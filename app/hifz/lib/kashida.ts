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
// - The fill is MEASUREMENT-DRIVEN, one tatweel at a time (2026-11-25):
//   a tatweel's true in-context cost varies 6–19px by position (the
//   canvas advance of a lone tatweel, ~6.2px in Amiri, is only the
//   cheapest case — after a sukun it costs 19.2px), so no width estimate
//   can plan a batch. The loop inserts one, re-measures, and undoes any
//   single tatweel that would overflow the line; a half-filled line is
//   never left on plain CSS justification — if the points cannot close
//   the gap, the line is restored and centred.
// - A line is only attempted when its shortfall is within the 45%
//   stretch; the old capacity gate (points x 3 x canvas width) is gone
//   — it false-centred fillable lines (page 1, 1:2: 168 < 170 by 2px)
//   because the canvas width understates the in-context cost.
// - A line the filler cannot fill is CENTRED, never left on plain CSS
//   justification: 'left' now only means "already full" or
//   memorise-mode rules. A genuinely over-full line (wraps onto two
//   visual lines) is centred too — centred fragments read like the
//   printed mushaf; CSS justification stretches them into wide gaps.
//   Plain CSS justification is what stretched the single tatweel already
//   in words like الرَّحْمَـٰنِ and مَـٰلِكِ into a visible split, and
//   the word spaces into wide gaps.
// - Centring must set textAlignLast as well as textAlign. The CSS rule
//   `.mushaf-line { text-align-last: justify }` re-justifies each
//   line's only (last) line, so text-align-last wins over text-align:
//   live (2026-11-22) the filler centred lines 3–5 — inline textAlign
//   'center', 0 tatweels — and they still rendered spread edge-to-edge
//   (computed textAlignLast 'justify'). Every centre decision sets
//   textAlignLast='center' too; every fill / 'left' exit restores or
//   clears it, so a stale 'center' cannot defeat a later fill when a
//   script switch changes the measurements.
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
 *  'centre' — too short to fill sanely (>45% of the width): a
 *  half-filled line reads worse than a centred one.
 *  'fill' — attempt it. There is deliberately NO capacity arm any
 *  more (2026-11-25): a tatweel's true in-context cost varies
 *  6–19px by position, so no width estimate can say upfront whether
 *  the points cover the shortfall — the fill loop measures after
 *  every insertion and centres only if it genuinely cannot reach
 *  nearly-full. The old capacity check (canvas advance × points)
 *  false-centred fillable lines (page 1, 1:2: 168 < 170 by 2px). */
export function fillDecision(
  shortfallPx: number,
  availPx: number,
): 'full' | 'fill' | 'centre' {
  if (shortfallPx <= 2) return 'full';
  if (shortfallPx > availPx * MAX_SHORTFALL_FRACTION) return 'centre';
  return 'fill';
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

/** The tatweel-free base text: strips U+0640 so texts that differ only
 *  by inserted (or pre-existing) tatweel compare equal. Used by
 *  snapshotLine to tell a script change apart from a previous fill. */
export function stripTatweel(text: string): string {
  return text.split(TATWEEL).join('');
}

function snapshotLine(line: HTMLElement): void {
  for (const n of textNodesOf(line)) {
    const stored = ORIGINALS.get(n);
    if (stored === undefined) {
      ORIGINALS.set(n, n.data);
    } else if (stripTatweel(n.data) !== stripTatweel(stored)) {
      // The text changed underneath us: the script picker switched
      // Indo-Pak ↔ Uthmani and React updated this Text node in place,
      // so the stored "original" belongs to the old script. Re-snapshot
      // to the current text as-is (preserving its pre-existing
      // tatweels) — otherwise restoreLine would revert the line to the
      // old script. (If the two scripts differ only in tatweel
      // placement on this node, the stripped texts are equal and the
      // stale original is kept; the visible difference is one word's
      // tatweel placement, and the filler re-measures it anyway.)
      ORIGINALS.set(n, n.data);
    }
    // Otherwise the node holds the clean original plus tatweel this
    // filler inserted on a previous run: keep the stored original so
    // restoreLine strips the inserted tatweel back off.
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

/** True when the line's text wraps onto more than one visual line.
 *  Compares the range's bounding height against one line-height.
 *  Do NOT count getClientRects(): a range returns one rect per
 *  fragment, and fragmentation happens per inline box and per bidi
 *  reordering — a single mushaf line is two topic-wash spans plus
 *  atomic inline-flex rosettes, so rect-counting reports every
 *  rosette-bearing line as "wrapped" (the live page-1 defect:
 *  isWrapped was spuriously true, so fillMushafLine returned 'left'
 *  before it ever measured). A real wrap doubles the bounding height;
 *  rosettes and bidi fragments on one visual line do not change it.
 *  The 1.5x threshold sits safely between one line (<=1x) and two
 *  (>=2x); the low kasra under وَإِيَّاكَ adds only a few px. */
function isWrapped(line: HTMLElement): boolean {
  const range = document.createRange();
  range.selectNodeContents(line);
  const rectH = range.getBoundingClientRect().height;
  const lh = parseFloat(getComputedStyle(line).lineHeight) || rectH;
  // The page is scaled to fit the screen (MushafPageView, CSS `zoom`):
  // rect heights are scaled, line-height is not. Undo the scale before
  // comparing — the element's own rect/offset ratio IS the applied
  // scale (it holds whether the line is one visual line or two, since
  // both rect and offset heights double on a wrap). Without this, a
  // wrapped line at fit scale (~0.32) measures ~0.6 line-heights and
  // the guard misses it entirely.
  const elH = line.getBoundingClientRect().height;
  const elLayoutH = line.offsetHeight;
  const s = elLayoutH > 0 && elH > 0 ? elH / elLayoutH : 1;
  const h = s > 0 ? rectH / s : rectH;
  return h > lh * 1.5;
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
 *  at that spot).
 *
 *  The points are computed over the line's CONCATENATED text, not
 *  per text node (2026-11-25 fix). The tajweed renderer fragments
 *  every word into many small text nodes (one per colour run), and
 *  eligibleOffsets() needs a real letter on BOTH sides of a point
 *  inside the same string: a run that starts or ends mid-word has
 *  no neighbour letter in its own node, so the per-node count found
 *  almost nothing — live on page 1, line 3 ("الرَّحْمَٰنِ الرَّحِيمِ
 *  ③ مَـٰلِكِ يَوْمِ الدِّينِ", 26 nodes, 6% shortfall) had ONE
 *  eligible point, so the filler centred a line that only needed
 *  ~2 tatweels. Over the concatenated text the same line has 9
 *  points. Rosette digits and the spaces between words are inert:
 *  they are not letters, so no point can sit next to one. A point
 *  that falls exactly on a node boundary is assigned to the end of
 *  the earlier node (inserting there renders the same tatweel
 *  between the two letters). */
function gatherPoints(line: HTMLElement): { points: FillPoint[]; totalCap: number } {
  const nodes = textNodesOf(line);
  if (nodes.length === 0) return { points: [], totalCap: 0 };
  // Concatenated text + each node's start offset in it.
  const starts: number[] = [];
  let full = '';
  for (const node of nodes) {
    starts.push(full.length);
    full += node.data;
  }
  const points: FillPoint[] = [];
  for (const off of eligibleOffsets(full)) {
    // Which node holds this offset (boundary → the earlier node).
    let idx = -1;
    for (let i = 0; i < nodes.length; i++) {
      const start = starts[i];
      const end = start + nodes[i].data.length;
      if (off >= start && off <= end) {
        idx = i;
        // A boundary shared by two nodes belongs to the earlier one.
        if (off === end && i + 1 < nodes.length && starts[i + 1] === end) idx = i;
        break;
      }
    }
    if (idx === -1) continue;
    // Tatweel already at this spot (counted in the full string, so a
    // run split does not hide it): the point is full at MAX_PER_POINT.
    let existing = 0;
    for (let t = off - 1; t >= 0 && full[t] === TATWEEL; t--) existing++;
    const cap = MAX_PER_POINT - existing;
    if (cap <= 0) continue;
    points.push({ node: nodes[idx], offset: off - starts[idx], cap });
  }
  return { points, totalCap: points.reduce((a, p) => a + p.cap, 0) };
}

/** Fill one justified line with kashida so its word gaps stay tight.
 *  Returns 'filled' (line is full, gaps tight), 'centred' (too short to
 *  fill sanely, the points genuinely cannot close the gap, or the line
 *  wraps onto two visual lines — centred instead, like the printed
 *  mushaf's last line), or 'left' (already full, or memorise-mode rules
 *  — neither is a fillable line). A line the filler cannot fill is
 *  NEVER left on plain CSS justification with wide gaps. Never throws. */
export function fillMushafLine(line: HTMLElement): 'filled' | 'centred' | 'left' {
  try {
    // Memorisation mode: words are grey rules, not text — nothing to fill.
    if (line.querySelector('.hidden-word-rule')) return 'left';
    snapshotLine(line);
    restoreLine(line);
    const prevAlign = line.style.textAlign;
    const prevAlignLast = line.style.textAlignLast;
    // Measure with justification off, so the width is the natural one.
    line.style.textAlign = 'start';
    if (isWrapped(line)) {
      // Genuinely over-full line (natural width exceeds the frame): it
      // wraps onto two visual lines. Centre the fragments — no tatweel
      // (the text is clean after restoreLine). Plain CSS justification
      // plus text-align-last: justify would stretch the fragments into
      // wide gaps; centred fragments read like the printed mushaf.
      // Centring sets textAlignLast too: text-align-last wins over
      // text-align on a single-line <p> (see the header note).
      line.style.textAlign = 'center';
      line.style.textAlignLast = 'center';
      return 'centred';
    }
    const avail = line.clientWidth;
    const shortfall = avail - measureNatural(line);
    const tatW = tatweelWidth(line);
    const decision = fillDecision(shortfall, avail);
    if (decision === 'full') {
      line.style.textAlign = prevAlign;
      line.style.textAlignLast = prevAlignLast;
      return 'left'; // already full
    }
    if (decision === 'centre') {
      line.style.textAlign = 'center';
      line.style.textAlignLast = 'center';
      return 'centred';
    }
    // Measurement-driven fill (2026-11-25): insert ONE tatweel at a
    // time, round-robin over the eligible points, re-measuring the
    // natural width after every insertion. A tatweel that would
    // overflow the line is undone on the spot and that point is never
    // retried (its cost is fixed and the room only shrinks); cheaper
    // points still get their chance, so the line keeps whatever fits.
    //
    // WHY NOT A BATCH: the old loop inserted a whole round at once,
    // sized from the canvas tatweel advance (~6.2px in Amiri). The
    // in-context cost of one tatweel is 6–19px depending on position
    // (measured live on page 1 line 3: after a sukun 19.2px, after
    // ye+kasra 13.1px, most spots ~6.2px) — so a batch sized for 6.2px
    // overshot by 30px+, wrapped the line, and the wrap-guard threw
    // the WHOLE fill away and centred a fillable line. One at a time
    // can never overshoot by more than a single tatweel, and the
    // undo keeps every tatweel that did fit.
    //
    // Offset bookkeeping: points are gathered once; each tracks how
    // many tatweels it already holds and how far its offset has
    // shifted (an insertion earlier in the same text node pushes
    // later offsets in that node right by one).
    type LivePoint = {
      node: Text;
      origOffset: number;
      cap: number;
      shift: number;
    };
    const { points } = gatherPoints(line);
    const live: LivePoint[] = points.map((p) => ({
      node: p.node,
      origOffset: p.offset,
      cap: p.cap,
      shift: 0,
    }));
    const tooExpensive = new Set<LivePoint>();
    let remaining = shortfall;
    let cursor = 0;
    let guard = 0;
    while (remaining > 2 && guard++ < 300) {
      // Next point with cap left, round-robin from the cursor.
      let p: LivePoint | undefined;
      for (let i = 0; i < live.length; i++) {
        const q = live[(cursor + i) % live.length];
        if (q.cap > 0 && !tooExpensive.has(q)) {
          p = q;
          cursor = (cursor + i + 1) % live.length;
          break;
        }
      }
      if (!p) break;
      const at = p.origOffset + p.shift;
      p.node.data = p.node.data.slice(0, at) + TATWEEL + p.node.data.slice(at);
      const after = avail - measureNatural(line);
      if (after < 0) {
        // This tatweel overflowed the line: undo just this one and
        // never retry this point — a cheaper point may still fit.
        p.node.data = p.node.data.slice(0, at) + p.node.data.slice(at + 1);
        tooExpensive.add(p);
        continue;
      }
      p.cap -= 1;
      for (const q of live) {
        if (q !== p && q.node === p.node && q.origOffset > p.origOffset) q.shift += 1;
      }
      remaining = after;
    }
    if (remaining <= 2 || isNearlyFull(remaining, tatW)) {
      // textAlign stays 'start' — line is full. Clear textAlignLast:
      // a stale 'center' from a previous run would survive a script
      // switch and defeat the fill (CSS already supplies the justify).
      line.style.textAlignLast = '';
      return 'filled';
    }
    // No point could close the gap (capacity genuinely short, or the
    // remaining points are all too expensive for the room left):
    // centre it, like the printed mushaf's last line.
    restoreLine(line);
    line.style.textAlign = 'center';
    line.style.textAlignLast = 'center';
    return 'centred';
  } catch {
    // Defensive fallback: clear any centre last-align set above so a
    // half-measured line falls back to plain CSS justification.
    line.style.textAlignLast = '';
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
