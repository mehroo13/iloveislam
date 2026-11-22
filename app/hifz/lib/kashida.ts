// app/hifz/lib/kashida.ts — measured kashida (tatweel) justification for
// mushaf lines (spec §21.4).
//
// WHY THIS EXISTS: `text-align: justify; text-justify: inter-character`
// tells the browser to stretch Arabic letters instead of word gaps, but
// Chrome only stretches kashida so far — on a short line (7 words in a
// wide column) the remaining shortfall goes into the spaces BETWEEN words,
// so the gaps stay wide even though a little kashida is visible. The
// printed mushaf fills the line with kashida instead. This filler measures
// each justified line's natural (unjustified) width, works out the
// shortfall, and inserts U+0640 TATWEEL at valid positions inside words
// until the line is full — then justification has nothing left to stretch,
// so the word gaps stay tight.
//
// RULES (kept conservative so the text can never look wrong):
// - A tatweel goes AFTER a dual-joining letter (one that connects to the
//   following letter) and AFTER that letter's diacritics, never at the
//   start or end of a word, never next to a pause mark, and at most 3 in
//   one spot. Words shorter than 3 letters get none.
// - At most ~45% stretch: a line that would need more is not filled —
//   the caller centres it instead (a centred short line reads like the
//   printed mushaf's last line; a stretched one does not).
// - A line is only attempted when its kashida capacity (eligible points
//   x 3 tatweels) covers the shortfall; otherwise it is centred without
//   attempting a partial fill.
// - The fill UNDERSHOOTS on purpose (floor, never ceil, and a 2px safety
//   slack): the old code used ceil(), which inserted up to one tatweel
//   MORE than the shortfall, so the line overflowed its box by a few px,
//   wrapped onto a second visual line, and the wrap-guard threw the
//   whole fill away. A line whose shortfall exceeds its kashida capacity
//   was likewise attempted, exhausted the capacity, and restored.
//   Measured 2026-11-22 on page 1 (HarfBuzz-shaped Amiri at 33.6px in a
//   650px frame, live Quran.com data): lines 4–5 shortfalls 242px/284px
//   vs capacity 167px/186px (capacity failure — the lines were just
//   under the 45% centre threshold, so the fill was attempted and
//   failed); line 6 shortfall 219px vs capacity 242px, but ceil()
//   inserted 36 tatweels (223px) for a 219px shortfall, overshooting the
//   box by ~4px (wrap failure). All three were left on plain CSS
//   justification with wide gaps — and the simulation over pages 1–3
//   shows the old code failed all 23 fillable lines the same way.
// - A line the filler cannot fill is CENTRED, never left on plain CSS
//   justification: 'left' now only means "already full", "genuinely
//   over-full (wraps onto two visual lines)" or memorise-mode rules.
//   Plain CSS justification is what stretched the single tatweel already
//   in words like الرَّحْمَـٰنِ and مَـٰلِكِ into a visible split, and
//   the word spaces into wide gaps.
// - Everything is defensive: any measurement or insertion failure leaves
//   the line as it was. The filler never throws.
// - The pure string helpers AND the pure fill-decision helpers are
//   unit-tested by tools/test-kashida.mjs.

export const TATWEEL = 'ـ'; // U+0640 ARABIC TATWEEL (kashida)
export const MAX_PER_POINT = 3;
export const MAX_SHORTFALL_FRACTION = 0.45;
/** Safety margin (px) left unfilled so a filled line can never overflow
 *  its box and trip the wrap-guard (see the fill loop). */
export const FILL_SLACK_PX = 2;

/** Letters that join to the following letter (dual-joining). A tatweel
 *  may follow one of these (after its diacritics). Everything else — alef,
 *  dal, reh, waw, teh marbuta, alef maqsura, bari ye, noon ghunna — does
 *  not connect forward, so a tatweel after it would float unattached.
 *  Covers both Uthmani and Indo-Pak text (keheh, peh, cheh, teh, gaf,
 *  heh-goal included). */
const JOINING = new Set([
  'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'ي',
  'ڪ', 'پ', 'چ', 'ٹ', 'گ', 'ھ',
]);

/** Combining marks that ride on a letter (harakat, shadda, maddah, hamza
 *  marks, superscript alef). A tatweel goes after the whole cluster, never
 *  between a letter and its mark. */
function isCombining(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return (code >= 0x064b && code <= 0x065f) || code === 0x0670;
}

/** Small non-letter marks that may sit on a letter (Indo-Pak head marks,
 *  Arabic signs). A tatweel may go after one of these — it belongs to the
 *  letter before it — but never before it (splitting mark from letter).
 *  Pause marks (U+06D6–U+06ED) are deliberately NOT skippable: they end a
 *  word, and a tatweel after one would detach it. */
function isSkippableMark(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return (code >= 0x0610 && code <= 0x061a) || (code >= 0x06e0 && code <= 0x06e6);
}

/** Anything the filler may step over when looking for the next/previous
 *  real letter: combining marks, tatweel already there, small marks. */
function isSkippable(ch: string): boolean {
  return isCombining(ch) || ch === TATWEEL || isSkippableMark(ch);
}

/** Arabic letter (broad test: any letter in the Arabic blocks). Diacritics,
 *  tatweel, pause marks and digits are NOT letters. */
function isLetter(ch: string): boolean {
  if (ch === TATWEEL) return false;
  const code = ch.codePointAt(0) ?? 0;
  return (
    (code >= 0x0621 && code <= 0x064a) ||
    (code >= 0x066e && code <= 0x06d3) ||
    (code >= 0x06ee && code <= 0x06fc) ||
    code === 0x06ff
  );
}

/** String offsets (indices) in `text` where a tatweel may be inserted.
 *  An offset is eligible when the character before it is a dual-joining
 *  letter (plus its diacritics / any tatweel already there) and a real
 *  letter follows it in the same word. The offset sits AFTER the letter's
 *  diacritics (and after any tatweel already at that spot), so a later
 *  round can add more there up to MAX_PER_POINT. */
export function eligibleOffsets(text: string): number[] {
  const chars = [...text];
  const starts: number[] = [];
  let s = 0;
  for (const c of chars) {
    starts.push(s);
    s += c.length;
  }
  const out: number[] = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (!JOINING.has(ch)) continue;
    // Look ahead past diacritics, small marks and any tatweel already at
    // this spot. The offset sits after all of them, before the next letter.
    let j = i + 1;
    while (j < chars.length && isSkippable(chars[j])) j++;
    if (j >= chars.length) continue;
    if (!isLetter(chars[j])) continue; // end of word, punctuation, pause mark
    // How much kashida is already at this spot (tatweels just before j)?
    let existing = 0;
    for (let t = j - 1; t > i && chars[t] === TATWEEL; t--) existing++;
    if (existing >= MAX_PER_POINT) continue;
    // Not the first letter of the word: a letter must precede it (again
    // stepping over marks that belong to that letter).
    let k = i - 1;
    while (k >= 0 && isSkippable(chars[k])) k--;
    if (k < 0) continue;
    if (!isLetter(chars[k])) continue;
    out.push(starts[j]);
  }
  return out;
}

/** Insert `perPoint` tatweels at each of `offsets` (string indices) in
 *  `text`. Offsets are applied highest-first so they stay valid. */
export function insertTatweel(text: string, offsets: number[], perPoint: number): string {
  if (perPoint <= 0 || offsets.length === 0) return text;
  const sorted = [...offsets].sort((a, b) => b - a);
  const tat = TATWEEL.repeat(perPoint);
  let out = text;
  for (const off of sorted) {
    out = out.slice(0, off) + tat + out.slice(off);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Pure fill-decision helpers — unit-tested by tools/test-kashida.mjs  */
/*  (the DOM filler below just measures and applies them).              */
/* ------------------------------------------------------------------ */

/** Decide what to do with a line before attempting a fill.
 *  'full' — nothing to do (shortfall within measurement noise).
 *  'centre' — too short to fill sanely (>45% of the width), or the
 *  line's kashida capacity (eligible points x 3 tatweels) cannot cover
 *  the shortfall: a half-filled line reads worse than a centred one.
 *  'fill' — attempt it. */
export function fillDecision(
  shortfallPx: number,
  availPx: number,
  capacityPx: number,
): 'full' | 'fill' | 'centre' {
  if (shortfallPx <= 2) return 'full';
  if (shortfallPx > availPx * MAX_SHORTFALL_FRACTION) return 'centre';
  if (capacityPx < shortfallPx) return 'centre';
  return 'fill';
}

/** How many tatweels to insert this round. floor(), never ceil(): ceil
 *  inserts up to one tatweel MORE than the shortfall, the line overflows
 *  its box by a few px, wraps onto a second visual line, and the
 *  wrap-guard discards the whole fill. Always leaves FILL_SLACK_PX of
 *  the shortfall unfilled, and never exceeds the remaining per-point
 *  capacity (points x MAX_PER_POINT). */
export function tatweelsToInsert(
  shortfallPx: number,
  tatweelPx: number,
  totalCap: number,
): number {
  if (shortfallPx <= 0 || tatweelPx <= 0 || totalCap <= 0) return 0;
  return Math.max(
    0,
    Math.min(Math.floor((shortfallPx - FILL_SLACK_PX) / tatweelPx), totalCap),
  );
}

/** True when the remaining shortfall is at most one tatweel plus the
 *  safety slack: the line is for practical purposes full — an ~8px rag
 *  on a ~650px line is invisible, and inserting one more tatweel would
 *  overflow the box. */
export function isNearlyFull(shortfallPx: number, tatweelPx: number): boolean {
  return shortfallPx <= tatweelPx + FILL_SLACK_PX;
}

/* ------------------------------------------------------------------ */
/*  DOM filler — measures real rendered lines and fills them.          */
/* ------------------------------------------------------------------ */

/** Original text of every text node this filler has touched, so a
 *  re-run (resize, script change, peek) always starts from the clean
 *  text and never stacks tatweel on tatweel. */
const ORIGINALS = new WeakMap<Text, string>();

function textNodesOf(el: HTMLElement): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let n: Text | null;
  while ((n = walker.nextNode() as Text | null)) out.push(n);
  return out;
}

function snapshotLine(line: HTMLElement): void {
  for (const n of textNodesOf(line)) {
    if (!ORIGINALS.has(n)) ORIGINALS.set(n, n.data);
  }
}

function restoreLine(line: HTMLElement): void {
  for (const n of textNodesOf(line)) {
    const orig = ORIGINALS.get(n);
    if (orig !== undefined && n.data !== orig) n.data = orig;
  }
}

/** True natural width of the line's content (including rosette spans and
 *  the wash spans' padding) — measured on an off-screen clone sized to
 *  its content, so justification and wrapping cannot skew it. */
function measureNatural(line: HTMLElement): number {
  const clone = line.cloneNode(true) as HTMLElement;
  clone.style.position = 'absolute';
  clone.style.left = '-99999px';
  clone.style.top = '0';
  clone.style.visibility = 'hidden';
  clone.style.width = 'max-content';
  clone.style.textAlign = 'start';
  clone.style.margin = '0';
  document.body.appendChild(clone);
  const w = clone.getBoundingClientRect().width;
  clone.remove();
  return w;
}

/** True when the line's text wraps onto more than one visual line. */
function isWrapped(line: HTMLElement): boolean {
  const range = document.createRange();
  range.selectNodeContents(line);
  return range.getClientRects().length > 1;
}

/** Natural width of one tatweel in this line's font (estimate for how
 *  many to insert; the re-measure loop corrects any error). */
function tatweelWidth(line: HTMLElement): number {
  try {
    const cs = getComputedStyle(line);
    const canvas = document.createElement('canvas').getContext('2d');
    if (!canvas) return 12;
    canvas.font = cs.font;
    return Math.max(4, canvas.measureText(TATWEEL).width);
  } catch {
    return 12;
  }
}

/** One eligible kashida point in a line's text, with the remaining
 *  per-point capacity (MAX_PER_POINT minus tatweel already there). */
type FillPoint = { node: Text; offset: number; cap: number };

/** Eligible kashida points across a line's text nodes, with the
 *  remaining per-point capacity (MAX_PER_POINT minus tatweel already
 *  at that spot). */
function gatherPoints(line: HTMLElement): { points: FillPoint[]; totalCap: number } {
  const points: FillPoint[] = [];
  for (const node of textNodesOf(line)) {
    for (const off of eligibleOffsets(node.data)) {
      let existing = 0;
      for (let i = off - 1; i >= 0 && node.data[i] === TATWEEL; i--) existing++;
      const cap = MAX_PER_POINT - existing;
      if (cap > 0) points.push({ node, offset: off, cap });
    }
  }
  return { points, totalCap: points.reduce((a, p) => a + p.cap, 0) };
}

/** Fill one justified line with kashida so its word gaps stay tight.
 *  Returns 'filled' (line is full, gaps tight), 'centred' (too short to
 *  fill sanely, or kashida capacity cannot cover the shortfall — centred
 *  instead, like the printed mushaf's last line), or 'left' (already
 *  full, genuinely over-full and wrapping, or memorise-mode rules —
 *  none of which are fillable lines). A line the filler cannot fill is
 *  NEVER left on plain CSS justification with wide gaps. Never throws. */
export function fillMushafLine(line: HTMLElement): 'filled' | 'centred' | 'left' {
  try {
    // Memorisation mode: words are grey rules, not text — nothing to fill.
    if (line.querySelector('.hidden-word-rule')) return 'left';
    snapshotLine(line);
    restoreLine(line);
    const prevAlign = line.style.textAlign;
    // Measure with justification off, so the width is the natural one.
    line.style.textAlign = 'start';
    if (isWrapped(line)) {
      // Genuinely over-full line (natural width exceeds the frame): it
      // wraps onto two visual lines. Leave it — centring a wrapped
      // paragraph would centre both fragments.
      line.style.textAlign = prevAlign;
      return 'left';
    }
    const avail = line.clientWidth;
    const shortfall = avail - measureNatural(line);
    const tatW = tatweelWidth(line);
    const { totalCap } = gatherPoints(line);
    const decision = fillDecision(shortfall, avail, totalCap * tatW);
    if (decision === 'full') {
      line.style.textAlign = prevAlign;
      return 'left'; // already full
    }
    if (decision === 'centre') {
      line.style.textAlign = 'center';
      return 'centred';
    }
    let remaining = shortfall;
    for (let round = 0; round < 4 && remaining > 2; round++) {
      // Re-gather: offsets and remaining caps shift as tatweel is added.
      const { points, totalCap: capLeft } = gatherPoints(line);
      if (points.length === 0) break;
      // Undershoot on purpose (floor + slack) — see tatweelsToInsert.
      const toInsert = tatweelsToInsert(remaining, tatW, capLeft);
      if (toInsert <= 0) break;
      // Distribute round-robin so the stretch is even across the line.
      const plan = new Map<Text, { offset: number; add: number }[]>();
      let left = toInsert;
      let guard = 0;
      while (left > 0 && guard++ < 10000) {
        let progressed = false;
        for (const p of points) {
          if (left === 0) break;
          if (p.cap <= 0) continue;
          p.cap -= 1;
          left -= 1;
          progressed = true;
          const list = plan.get(p.node) ?? [];
          const entry = list.find((e) => e.offset === p.offset);
          if (entry) entry.add += 1;
          else list.push({ offset: p.offset, add: 1 });
          plan.set(p.node, list);
        }
        if (!progressed) break;
      }
      let inserted = 0;
      for (const [node, list] of plan) {
        let data = node.data;
        for (const { offset, add } of [...list].sort((a, b) => b.offset - a.offset)) {
          data = data.slice(0, offset) + TATWEEL.repeat(add) + data.slice(offset);
          inserted += add;
        }
        node.data = data;
      }
      if (inserted === 0) break;
      // Never let a fill push the line onto a second visual line. The
      // undershoot above makes this near-unreachable (only if the
      // canvas tatweel estimate was far off); if it still happens,
      // centre the line rather than leaving it on CSS justification.
      if (isWrapped(line)) {
        restoreLine(line);
        line.style.textAlign = 'center';
        return 'centred';
      }
      remaining = avail - measureNatural(line);
    }
    if (remaining <= 2 || isNearlyFull(remaining, tatW)) return 'filled'; // textAlign stays 'start' — line is full
    // Capacity ran out (or the next tatweel would overflow the box):
    // centre it, like the printed mushaf's last line.
    restoreLine(line);
    line.style.textAlign = 'center';
    return 'centred';
  } catch {
    return 'left';
  }
}

/** Fill every justified line inside `root` (one mushaf page frame). */
export function fillMushafFrame(root: HTMLElement): void {
  const lines = root.querySelectorAll<HTMLElement>('p.mushaf-line');
  lines.forEach((line) => {
    try {
      fillMushafLine(line);
    } catch {
      /* one bad line must not stop the rest */
    }
  });
}
