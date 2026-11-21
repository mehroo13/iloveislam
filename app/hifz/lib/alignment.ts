/**
 * app/hifz/lib/alignment.ts — Normalisation + word alignment for recitation
 * feedback. Pure functions, no browser APIs: safe to import from client
 * components, server components and Node test scripts alike.
 *
 * Implements research report §5 (hifz-recitation-feedback-20261121) exactly:
 *   Step 1 — normalisation, applied identically to reference words and to
 *   recognised/heard words.
 *   Step 2 — word-level Needleman–Wunsch alignment with a similarity-aware
 *   substitution cost, long-word anchoring, duplicate collapse, partial
 *   recitation ("not reached yet" ≠ missed) and confidence gating.
 *
 * HARD RULES (spec §8): this layer reports word identity only. It never
 * outputs tajweed labels, scores, or rule names. The UI renders
 * "Check this word" for a substituted word, never "Wrong".
 */

/** Per-reference-word outcome. `not-reached` = the reciter stopped before it. */
export type WordStatus = 'correct' | 'said-differently' | 'missed' | 'not-reached';

export interface RefWord {
  /** 0-based index inside its ayah. */
  index: number;
  /** Display form (original script, diacritics kept). */
  display: string;
  /** Normalised form used for comparison. */
  normalised: string;
}

export interface AlignedWord extends RefWord {
  status: WordStatus;
  /** What was heard, when the engine/alignment could say (normalised form). */
  heard?: string;
}

/** Diacritics + Quranic marks, per research §5 step 1.3. */
export const DIACRITIC_RE =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;

/** Verse-end / ornate markers and punctuation that carry no word identity.
 *  Written with explicit \u escapes (ascending) — literal Arabic ranges
 *  here previously tripped TS1517 (ؐ U+0610 – ؏ U+060F is a reversed range). */
const PUNCT_RE =
  /[۝۩ؐ؏ـً-ٰٟۖ-ۭﭐ-﷿ﹰ-ﹴﹶ-ﻼ!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~«»،؛؟٠-٩0-9]/g;

/**
 * Normalise one Arabic string for comparison.
 *
 * Order (research §5 step 1):
 *  1. NFC + strip BOM.
 *  2. Strip diacritics / Quranic marks. KNOWN TRAP (U+0670 superscript alef):
 *     stripping it deletes a letter in words like الرَّحْمَٰنِ — but it is
 *     stripped on BOTH sides (ASR/engine output never contains it), so the
 *     two sides still agree. We lose the alef distinction in a handful of
 *     words; that is accepted and documented (research §5 step 1.3).
 *  3. Alef unification: أ إ آ ٱ → ا.
 *  4. ى → ي.  5. ة → ه.  6. Indo-Pak extras: ھ ہ → ه, ے → ي, ک → ك, ی → ي.
 *  7. Strip punctuation / verse markers, collapse whitespace.
 * Never: stemming, root extraction, synonym mapping.
 */
export function normalizeArabic(input: string): string {
  let s = input.normalize('NFC').replace(/^\uFEFF/, '');
  s = s.replace(DIACRITIC_RE, '');
  s = s
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ھہ]/g, 'ه')
    .replace(/ے/g, 'ي')
    .replace(/ک/g, 'ك')
    .replace(/ی/g, 'ي');
  s = s.replace(PUNCT_RE, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

/** Split display text into words, keeping display + normalised forms paired. */
export function splitWords(text: string): RefWord[] {
  const displayWords = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  return displayWords.map((display, index) => ({
    index,
    display,
    normalised: normalizeArabic(display),
  }));
}

/** Character-level Levenshtein distance (small strings; O(n·m) is fine). */
export function charDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let cur = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}

/**
 * Similarity-aware substitution cost (research §5 step 2.2):
 * 0 identical; 0.5 near-miss (character distance ≤ 1–2, or one word a prefix
 * of the other — catches a dropped hamza / one misheard letter); 1 otherwise.
 * Short words need a tighter bar: distance ≤ 1 when either word is ≤ 3 chars.
 */
export function substitutionCost(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0 || b.length === 0) return 1;
  if (a.startsWith(b) || b.startsWith(a)) return 0.5;
  const d = charDistance(a, b);
  const bar = Math.min(a.length, b.length) <= 3 ? 1 : 2;
  return d <= bar ? 0.5 : 1;
}

/**
 * Deletion cost, length-weighted: long/rare words anchor the alignment
 * (research §5 step 2.4). Deleting a long word costs more than deleting a
 * short particle (مِن، مَا، فِي، وَ), so the aligner prefers to match long
 * words rather than skip over them. Insertion cost stays flat at 1.
 */
function deletionCost(word: string): number {
  return word.length >= 5 ? 1.5 : 1;
}

export interface AlignOptions {
  /**
   * Minimum recognised-words / reference-words ratio below which the attempt
   * is "unclear" (research §5 step 2.7). Default 0.5.
   */
  minCoverage?: number;
  /**
   * Minimum share of reached reference words that aligned (correct or
   * said-differently) below which the attempt is "unclear". Default 0.4.
   */
  minAlignmentQuality?: number;
}

export interface AlignResult {
  words: AlignedWord[];
  /** Recognised words heard, after duplicate collapse. */
  heardCount: number;
  /** Reference words the reciter reached (correct + said-differently + missed). */
  reachedCount: number;
  /** Words heard correctly. */
  correctCount: number;
  /** Words the reciter reached but the alignment could not match at all. */
  missedCount: number;
  /**
   * True when the attempt is too unclear to show per-word colours:
   * <50% of words recognised, or the alignment is very poor, or nothing was
   * heard at all. The UI must then show "I couldn't hear this clearly"
   * and offer a retry — never per-word red/amber (research §5 step 2.7).
   */
  unclear: boolean;
  /** Extra recognised words with no reference counterpart (repetitions, stumbles). */
  extraCount: number;
}

/**
 * Align normalised recognised words against normalised reference words.
 *
 * `reference` — display text of the expected ayah (Uthmani or Indo-Pak;
 * both normalise the same way).
 * `recognised` — normalised words the engine heard, in order. Pass the
 * engine's own words through `normalizeArabic` first (or raw words — this
 * function normalises them again, which is a no-op for already-normal text).
 *
 * Repetitions: consecutive duplicate recognised words are collapsed before
 * alignment (research §5 step 2.5). Partial recitation: trailing reference
 * words after the last aligned recognised word are `not-reached`, not
 * `missed` (research §5 step 2.6).
 */
export function alignRecitation(
  reference: string,
  recognised: string[],
  opts: AlignOptions = {},
): AlignResult {
  const minCoverage = opts.minCoverage ?? 0.5;
  const minQuality = opts.minAlignmentQuality ?? 0.4;

  const ref = splitWords(reference);
  // Collapse consecutive duplicate recognised words (a repeated word while
  // memorising is a stumble, not an error on the reference word).
  const heardNorm: string[] = [];
  for (const raw of recognised) {
    const w = normalizeArabic(raw);
    if (!w) continue;
    if (heardNorm.length === 0 || heardNorm[heardNorm.length - 1] !== w) {
      heardNorm.push(w);
    }
  }

  const m = ref.length;
  const n = heardNorm.length;

  // Empty reference: nothing to score. Empty recitation: everything
  // not-reached (the caller maps this to "no speech", not to misses).
  if (m === 0) {
    return { words: [], heardCount: 0, reachedCount: 0, correctCount: 0, missedCount: 0, unclear: true, extraCount: n };
  }
  if (n === 0) {
    return {
      words: ref.map((w) => ({ ...w, status: 'not-reached' as WordStatus })),
      heardCount: 0, reachedCount: 0, correctCount: 0, missedCount: 0,
      unclear: true, extraCount: 0,
    };
  }

  // Needleman–Wunsch DP. dp[i][j] = min cost aligning ref[0..i) with heard[0..j).
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  const back: ('diag' | 'up' | 'left')[][] = Array.from({ length: m + 1 }, () =>
    new Array<'diag' | 'up' | 'left'>(n + 1).fill('diag'),
  );
  for (let i = 1; i <= m; i++) {
    dp[i][0] = dp[i - 1][0] + deletionCost(ref[i - 1].normalised);
    back[i][0] = 'up';
  }
  for (let j = 1; j <= n; j++) {
    dp[0][j] = dp[0][j - 1] + 1; // insertion
    back[0][j] = 'left';
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const sub = dp[i - 1][j - 1] + substitutionCost(ref[i - 1].normalised, heardNorm[j - 1]);
      const del = dp[i - 1][j] + deletionCost(ref[i - 1].normalised);
      const ins = dp[i][j - 1] + 1;
      if (sub <= del && sub <= ins) { dp[i][j] = sub; back[i][j] = 'diag'; }
      else if (del <= ins) { dp[i][j] = del; back[i][j] = 'up'; }
      else { dp[i][j] = ins; back[i][j] = 'left'; }
    }
  }

  // Trace back. Each reference word gets: correct / said-differently (+heard)
  // / missed. Track the last reference index that consumed a heard word so
  // trailing deletions become `not-reached`.
  const aligned: AlignedWord[] = ref.map((w) => ({ ...w, status: 'missed' as WordStatus }));
  let extraCount = 0;
  let lastConsumedRef = -1;
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    const step = back[i][j];
    if (i > 0 && j > 0 && step === 'diag') {
      const r = ref[i - 1];
      const h = heardNorm[j - 1];
      if (r.normalised === h) {
        aligned[i - 1] = { ...r, status: 'correct' };
      } else {
        aligned[i - 1] = { ...r, status: 'said-differently', heard: h };
      }
      lastConsumedRef = Math.max(lastConsumedRef, i - 1);
      i--; j--;
    } else if (i > 0 && (j === 0 || step === 'up')) {
      // Reference word with no heard counterpart: missed for now; trailing
      // ones are re-labelled not-reached below.
      i--;
    } else {
      // Extra heard word (insertion): a repetition or stumble, not an error
      // on a reference word. Count it, do not colour a word for it.
      extraCount++;
      j--;
    }
  }

  // Partial recitation: words after the last word the reciter demonstrably
  // reached were not attempted — they are "not reached yet", not "missed".
  for (let k = lastConsumedRef + 1; k < m; k++) {
    aligned[k] = { ...aligned[k], status: 'not-reached', heard: undefined };
  }

  const reached = aligned.filter((w) => w.status !== 'not-reached');
  const correctCount = aligned.filter((w) => w.status === 'correct').length;
  const missedCount = aligned.filter((w) => w.status === 'missed').length;
  const matchedCount = correctCount + aligned.filter((w) => w.status === 'said-differently').length;
  const coverage = n / m;
  const quality = reached.length === 0 ? 0 : matchedCount / reached.length;
  const unclear = coverage < minCoverage || quality < minQuality;

  return {
    words: aligned,
    heardCount: n,
    reachedCount: reached.length,
    correctCount,
    missedCount,
    unclear,
    extraCount,
  };
}

/**
 * One-line summary for the feedback screen (spec §3.1 step 5, research §5
 * step 3). Never a percentage grade, never tajweed. Counts only words the
 * reciter reached, so a stopped-halfway attempt is not punished for the
 * unreached tail.
 */
export function summaryLine(result: AlignResult): string {
  const { correctCount, reachedCount, missedCount } = result;
  if (reachedCount === 0) return 'No words were heard in that attempt.';
  const missedBit = missedCount > 0
    ? ` — ${missedCount} ${missedCount === 1 ? 'word was' : 'words were'} not heard`
    : '';
  return `You said ${correctCount} of ${reachedCount} words${missedBit}.`;
}
