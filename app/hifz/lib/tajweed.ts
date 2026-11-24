// app/hifz/lib/tajweed.ts — Tajweed colouring from the AlQuran Cloud
// quran-tajweed edition, matched to the reference screenshot.
//
// The edition marks individual letters inside words with inline tags:
//   [h:1[ٱ]  hamzat-wasl        [l[ل]   laam shamsiyah (silent laam)
//   [n[ـٰ]   madda normal       [p[ِي]  madda permissible
//   [m[َا]   madda necessary    [s[و]   silent letter
//   [g[مّ]   ghunna             [q[قْ]  qalqalah
//   [o[َآ]  madd + hamza (muttasil)
//   [f / [a / [u / [c / [w / [i / [d  ikhfaa / idghaam / other rules
// Colours are sampled from the reference screenshot (Tarteel reader,
// Al-Fatihah) and Tarteel's published tajweed legend:
//   n -> muted gold #CA8A04 (madd tabee'i) · p -> vivid orange #F97D1D
//   (the [p] ِي is ORANGE in the screenshot — the earlier "blue [p]"
//   reading was the neighbouring tafkhim letter misattributed) ·
//   m -> dark red #991B1B (madd laazim) · g -> green #16A34A (ghunna) ·
//   q -> light blue #38BDF8 (qalqalah) · o -> orange-red #EA580C
//   (madd wajib muttasil) · s -> grey #9CA3AF (silent letter) ·
//   h, l -> black (rendered black in the screenshot).
// The edition does NOT tag tafkhim (heavy letters), but the screenshot
// colours them steel blue #0F5E7F — خ ص ض غ ط ق ظ, and ر with a fatha
// or damma (heavy raa). That rule is applied here for untagged letters
// (an explicit tag always wins: a saakin ق is qalqalah-light-blue,
// not tafkhim-dark-blue).
// Codes f/a/u/c/w/i/d (ikhfaa, idghaam, others) have no verified colour
// in the reference, so they render black — safe, never wrong-looking.

export type TajweedSegment = { start: number; end: number; code: string };

export interface ParsedTajweedAyah {
  /** Plain Uthmani text with all tags stripped. */
  plain: string;
  segments: TajweedSegment[];
}

/** Colours per tajweed code (null = default black). */
export const TAJWEED_CODE_COLORS: Record<string, string | null> = {
  h: null,
  l: null,
  n: '#CA8A04',
  p: '#F97D1D',
  m: '#991B1B',
  s: '#9CA3AF',
  g: '#16A34A',
  q: '#38BDF8',
  o: '#EA580C',
  f: null,
  a: null,
  u: null,
  c: null,
  w: null,
  i: null,
  d: null,
};

/** Steel blue for tafkhim (heavy) letters. */
export const TAFKHIM_COLOR = '#0F5E7F';
/** Default text colour. */
export const TAJWEED_BLACK = '#111827';

/** Heavy (tafkhim) letters — always pronounced heavy. */
const HEAVY_LETTERS = new Set(['خ', 'ص', 'ض', 'غ', 'ط', 'ق', 'ظ']);

/** Combining marks (harakat, shadda, maddah, superscript alef). */
function isCombining(ch: string): boolean {
  if (!ch) return false;
  const code = ch.codePointAt(0) ?? 0;
  return (code >= 0x064b && code <= 0x065f) || code === 0x0670;
}

/** Parse one ayah's tagged text into plain text + segments. Tag form:
 *  `[code]` or `[code:id]` then `[` then text then `]`. */
export function parseTajweedText(text: string): ParsedTajweedAyah {
  const re = /\[([a-z])(?::\d+)?\[([^\]]*)\]/g;
  let plain = '';
  const segments: TajweedSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    plain += text.slice(last, m.index);
    const start = plain.length;
    plain += m[2];
    segments.push({ start, end: plain.length, code: m[1] });
    last = m.index + m[0].length;
  }
  plain += text.slice(last);
  return { plain, segments };
}

/** Colour of the character at index `i` in `plain`, given the segments.
 *  Explicit segment colour wins; otherwise the tafkhim rule; otherwise
 *  a combining mark inherits the colour of the base letter it rides on
 *  (so a fatha on a blue ط is blue, a kasra in an orange [p] is orange).
 *  A sukoon (ْ) after a heavy letter takes that letter's blue (the
 *  حْ in ٱلرَّحْمَـٰنِ samples blue in the screenshot). */
export function tajweedColorAt(plain: string, segments: TajweedSegment[], i: number): string {
  // Out of range (the Quran.com word is longer than the tajweed word
  // it aligned to — the two editions tokenise a few words
  // differently): render black, never crash.
  if (i < 0 || i >= plain.length) return TAJWEED_BLACK;
  for (const s of segments) {
    if (i >= s.start && i < s.end) {
      return TAJWEED_CODE_COLORS[s.code] ?? TAJWEED_BLACK;
    }
  }
  const ch = plain[i];
  if (isCombining(ch)) {
    // Find the base letter this mark rides on (walk back over marks).
    let j = i - 1;
    while (j >= 0 && isCombining(plain[j])) j--;
    if (j >= 0) {
      // A sukoon whose base letter follows a heavy letter is blue
      // (حْ after رَّ). Any other mark inherits its base letter.
      if (ch === 'ْ') {
        let k = j - 1;
        while (k >= 0 && isCombining(plain[k])) k--;
        if (k >= 0 && isHeavyLetter(plain, k)) return TAFKHIM_COLOR;
      }
      return tajweedColorAt(plain, segments, j);
    }
    return TAJWEED_BLACK;
  }
  if (isHeavyLetter(plain, i)) return TAFKHIM_COLOR;
  return TAJWEED_BLACK;
}

/** True when the letter at index `i` is a heavy (tafkhim) letter:
 *  one of خ ص ض غ ط ق ظ, or a ر carrying a fatha/damma (heavy raa).
 *  A ر with a kasra (or no vowel) is light. */
export function isHeavyLetter(plain: string, i: number): boolean {
  const ch = plain[i];
  if (!ch) return false;
  if (HEAVY_LETTERS.has(ch)) return true;
  if (ch !== 'ر') return false;
  // Look at the vowel immediately after the raa (skipping shadda).
  let j = i + 1;
  while (j < plain.length && plain[j] === 'ّ') j++;
  const v = plain[j];
  return v === 'َ' || v === 'ُ' || v === 'ً' || v === 'ٌ';
}

/** Split a word's text into coloured runs (consecutive chars sharing
 *  a colour). `wordStart` is the word's offset in the ayah's plain text. */
export function colorizeWord(
  word: string,
  plain: string,
  segments: TajweedSegment[],
  wordStart: number,
): { text: string; color: string }[] {
  const runs: { text: string; color: string }[] = [];
  for (let k = 0; k < word.length; k++) {
    const color = tajweedColorAt(plain, segments, wordStart + k);
    const last = runs[runs.length - 1];
    if (last && last.color === color) last.text += word[k];
    else runs.push({ text: word[k], color });
  }
  return runs;
}

/* ------------------------------------------------------------------ */
/*  Alignment: match Quran.com words to tajweed words (same ayah).     */
/* ------------------------------------------------------------------ */

/** Normalise for comparison: strip diacritics/tatweel, unify alef
 *  forms, teh marbuta, alef maqsura. Pause marks are stripped too
 *  (they attach differently in the two sources). */
export function normalizeForMatch(text: string): string {
  return text
    .replace(/[ً-ٰٟـۖ-ۭ]/g, '')
    .replace(/[ٱأإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

/** Align a list of Quran.com words (cleaned, pause marks merged) to
 *  the tajweed ayah's words (plain text split on spaces). Returns, per
 *  Quran.com word, the offset of the matching tajweed word in the
 *  plain text, or -1 when no match (render that word black). */
export function alignWords(quranWords: string[], tajweed: ParsedTajweedAyah): number[] {
  const tWords = tajweed.plain.split(/\s+/).filter(Boolean);
  // Offsets of each tajweed word in the plain text.
  const offsets: number[] = [];
  {
    let pos = 0;
    for (const w of tWords) {
      const idx = tajweed.plain.indexOf(w, pos);
      offsets.push(idx === -1 ? pos : idx);
      pos = (idx === -1 ? pos : idx) + w.length;
    }
  }
  const out: number[] = [];
  let t = 0;
  for (const qw of quranWords) {
    const nq = normalizeForMatch(qw);
    let found = -1;
    // Search forward from the last match (words are in order in both
    // sources). No window: a line can start mid-ayah, so the word may
    // be far ahead in the ayah's word list. A word that never matches
    // renders black (-1) rather than taking a wrong neighbour's colour.
    for (let k = t; k < tWords.length; k++) {
      if (normalizeForMatch(tWords[k]) === nq) {
        found = k;
        break;
      }
    }
    out.push(found === -1 ? -1 : offsets[found]);
    if (found !== -1) t = found + 1;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Fetching (server-side).                                            */
/* ------------------------------------------------------------------ */

export interface TajweedSurah {
  id: number;
  /** Arabic surah name with diacritics, e.g. "سُورَةُ الفَاتِحَةِ". */
  name: string;
  englishName: string;
  /** Keyed by ayah number within the surah. */
  ayahs: Record<number, ParsedTajweedAyah>;
}

const TAJWEED_API = 'https://api.alquran.cloud/v1/surah';

/** Fetch + parse one surah's tajweed edition. Cached a day (the text
 *  is static). Throws on a bad response so the caller can fall back
 *  to uncoloured text. */
export async function fetchTajweedSurah(surahId: number): Promise<TajweedSurah> {
  const res = await fetch(`${TAJWEED_API}/${surahId}/quran-tajweed`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`tajweed fetch failed for surah ${surahId}: ${res.status}`);
  const data = (await res.json()) as {
    data?: {
      number?: number;
      name?: string;
      englishName?: string;
      ayahs?: { numberInSurah?: number; text?: string }[];
    };
  };
  const d = data.data;
  if (!d || !Array.isArray(d.ayahs)) throw new Error(`tajweed: no ayahs for surah ${surahId}`);
  const ayahs: Record<number, ParsedTajweedAyah> = {};
  for (const a of d.ayahs) {
    if (typeof a.numberInSurah !== 'number' || typeof a.text !== 'string') continue;
    ayahs[a.numberInSurah] = parseTajweedText(a.text);
  }
  return {
    id: d.number ?? surahId,
    name: d.name ?? '',
    englishName: d.englishName ?? '',
    ayahs,
  };
}
