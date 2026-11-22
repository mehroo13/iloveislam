// tools/test-kashida.mjs — unit test for app/hifz/lib/kashida.ts.
// Compiles the real file with the repo's tsc (DOM lib for the filler
// types) and asserts the pure string helpers (eligibleOffsets +
// insertTatweel), the pure fill-decision helpers, and — via a minimal
// DOM shim below — the DOM filler fillMushafLine's alignment decisions
// (centre sets textAlignLast, fill/'left' exits clear or restore it,
// wrapped lines centre with no tatweel). Real rendered widths and the
// live browser behaviour are verified live, not here.
// Run: node tools/test-kashida.mjs   (from the repo root)
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = mkdtempSync(join(tmpdir(), 'kashida-test-'));
try {
  execFileSync(join(root, 'node_modules', '.bin', 'tsc'), [
    join(root, 'app', 'hifz', 'lib', 'kashida.ts'),
    '--outDir', outDir,
    '--module', 'commonjs',
    '--target', 'es2020',
    '--lib', 'es2020,dom',
    '--skipLibCheck',
  ], { cwd: root, stdio: 'pipe' });
} catch (err) {
  console.error('tsc failed:', err.stdout?.toString() ?? err.message);
  process.exit(1);
}
const require = createRequire(import.meta.url);
const {
  eligibleOffsets, insertTatweel, TATWEEL, stripTatweel,
  fillDecision, tatweelsToInsert, isNearlyFull, fillMushafLine,
  FILL_SLACK_PX, MAX_PER_POINT, MAX_SHORTFALL_FRACTION,
} = require(join(outDir, 'kashida.js'));

const T = '\u0640'; // tatweel, for readable expectations
assert.equal(TATWEEL, T);
assert.equal(MAX_PER_POINT, 3);
assert.equal(MAX_SHORTFALL_FRACTION, 0.45);
assert.equal(FILL_SLACK_PX, 2);

const cases = [
  // [input, expected offsets]
  ['\u0627\u0644\u0643\u062A\u0627\u0628', [2, 3, 4]], // الكتاب — after ل، ك، ت
  ['\u0641\u064A', []], // في — two letters, nowhere to stretch
  ['\u0627\u0644\u0644\u0647', [2, 3]], // الله — after both lams
  ['\u064A\u064F\u0624\u0652\u0645\u0650\u0646\u064F\u0648\u0646', [6, 8]], // يُؤْمِنُونَ — after م (past its kasra) and ن (past its damma)
  ['\u0627\u0644\u0645', [2]], // الم — after ل only
  // One tatweel already after ت: the same spot stays eligible (cap is 3).
  ['\u0627\u0644\u0643\u062A\u0640\u0627\u0628', [2, 3, 5]], // الكتـاب
  // Three tatweels already after ت: that spot is capped, the others stay.
  ['\u0627\u0644\u0643\u062A\u0640\u0640\u0640\u0627\u0628', [2, 3]],
  // Pause mark ends the word: no tatweel before it.
  ['\u0631\u064E\u064A\u0652\u0628\u064E\u06DB', [4]], // رَيْبَۛ — after ي only
  // Indo-Pak: the head mark on ل must not be split; tatweel goes after it.
  ['\u0627\u0644\u06E1\u06AA\u0650\u062A\u0670\u0627\u0628\u064F', [3, 5, 7]], // الۡڪِتٰبُ
];
for (const [input, expected] of cases) {
  assert.deepEqual(
    eligibleOffsets(input),
    expected,
    `eligibleOffsets(${JSON.stringify(input)})`,
  );
}

// Exact insertion: one tatweel after ل، ك، ت.
assert.equal(
  insertTatweel('\u0627\u0644\u0643\u062A\u0627\u0628', [2, 3, 4], 1),
  '\u0627\u0644\u0640\u0643\u0640\u062A\u0640\u0627\u0628',
);
// Two per point.
assert.equal(
  insertTatweel('\u0627\u0644\u0643\u062A\u0627\u0628', [2, 3, 4], 2),
  '\u0627\u0644\u0640\u0640\u0643\u0640\u0640\u062A\u0640\u0640\u0627\u0628',
);
// Properties: stripping tatweel restores the tatweel-free base text
// (inputs that already carry a tatweel lose that one too when stripped);
// length grows by exactly one tatweel per point per round.
for (const [input] of cases) {
  const filled = insertTatweel(input, eligibleOffsets(input), 2);
  assert.equal(filled.replaceAll(T, ''), input.replaceAll(T, ''));
  assert.equal(filled.length, input.length + eligibleOffsets(input).length * 2);
}

// ------------------------------------------------------------------
// fillMushafLine alignment decisions (2026-11-22 text-align-last fix).
//
// Live defects: (1) the filler centred lines 3–5 (inline textAlign
// 'center', 0 tatweels) but they still rendered spread edge-to-edge,
// because `.mushaf-line { text-align-last: justify }` re-justifies a
// single-line <p>'s only line — text-align-last wins over text-align.
// (2) On a 390px phone the lines genuinely wrap; the old wrapped guard
// returned 'left' and CSS justification stretched the fragments.
// Minimal DOM shim: text nodes, element styles, TreeWalker, Range and
// canvas are faked with fixed metrics (8px per char, 6.2px per tatweel,
// 70px line-height) — enough to drive the filler's decisions, not a
// rendering engine. Real widths are verified live in a browser.
// ------------------------------------------------------------------

const SHIM_CHAR_PX = 8;
const SHIM_TATWEEL_PX = 6.2;
const SHIM_LINE_HEIGHT = 70;

class ShimText {
  constructor(data) { this.data = data; this.nodeType = 3; this.parentNode = null; }
}
class ShimElement {
  constructor(tag = 'p') {
    this.tagName = tag.toUpperCase();
    this.nodeType = 1;
    this.childNodes = [];
    this.style = { textAlign: '', textAlignLast: '' };
    this.clientWidth = 650;
    this._forceWrapped = false; // range height is always two lines
    this._wrapAfterFill = false; // range height is two lines once text holds a tatweel
  }
  appendChild(child) { child.parentNode = this; this.childNodes.push(child); return child; }
  querySelector() { return null; }
  remove() {}
  getContext() { return SHIM_CTX; }
  cloneNode(deep) {
    const c = new ShimElement(this.tagName.toLowerCase());
    c.clientWidth = this.clientWidth;
    c._forceWrapped = this._forceWrapped;
    c._wrapAfterFill = this._wrapAfterFill;
    if (deep) for (const n of this.childNodes) if (n.nodeType === 3) c.appendChild(new ShimText(n.data));
    return c;
  }
  getBoundingClientRect() {
    return { width: shimTextWidth(shimTextContent(this)), height: SHIM_LINE_HEIGHT };
  }
}
const SHIM_CTX = {
  font: '',
  measureText() { return { width: SHIM_TATWEEL_PX }; },
};
function shimTextContent(el) {
  let out = '';
  for (const n of el.childNodes) {
    if (n.nodeType === 3) out += n.data;
    else out += shimTextContent(n);
  }
  return out;
}
function shimTextWidth(text) {
  let w = 0;
  for (const ch of text) w += ch === T ? SHIM_TATWEEL_PX : SHIM_CHAR_PX;
  return w;
}
class ShimRange {
  selectNodeContents(el) { this.el = el; }
  getBoundingClientRect() {
    const text = shimTextContent(this.el);
    const wrapped = this.el._forceWrapped
      || (this.el._wrapAfterFill && text.includes(T));
    return { width: shimTextWidth(text), height: wrapped ? SHIM_LINE_HEIGHT * 2 : SHIM_LINE_HEIGHT };
  }
}
let shimThrowOnAppend = false;
const shimBody = new ShimElement('body');
const shimBodyAppend = shimBody.appendChild.bind(shimBody);
shimBody.appendChild = (child) => {
  if (shimThrowOnAppend) throw new Error('shim: appendChild failed');
  return shimBodyAppend(child);
};
const shimDocument = {
  body: shimBody,
  createTreeWalker(root) {
    const nodes = [];
    (function walk(el) {
      for (const n of el.childNodes) {
        if (n.nodeType === 3) nodes.push(n);
        else walk(n);
      }
    })(root);
    let i = 0;
    return { nextNode() { return i < nodes.length ? nodes[i++] : null; } };
  },
  createRange() { return new ShimRange(); },
  createElement(tag) { return new ShimElement(tag); },
};
globalThis.document = shimDocument;
globalThis.NodeFilter = { SHOW_TEXT: 4 };
globalThis.getComputedStyle = () => ({ font: '33px Amiri', lineHeight: `${SHIM_LINE_HEIGHT}px` });

const WORD = 'الكتاب'; // 6 chars, 3 eligible kashida points, 48px in the shim
function makeLine(text, { avail = 650, forceWrapped = false, wrapAfterFill = false } = {}) {
  const line = new ShimElement('p');
  line.clientWidth = avail;
  line._forceWrapped = forceWrapped;
  line._wrapAfterFill = wrapAfterFill;
  line.appendChild(new ShimText(text));
  return line;
}

// (a) Centre path sets textAlignLast 'center' — decision-'centre' branch.
{
  const line = makeLine(WORD.repeat(6)); // 36 chars, 288px, shortfall 362 > 45% of 650
  assert.equal(fillMushafLine(line), 'centred');
  assert.equal(line.style.textAlign, 'center');
  assert.equal(line.style.textAlignLast, 'center');
  assert.equal(shimTextContent(line).includes(T), false, 'centre inserts no tatweel');
}
// (a) Centre path sets textAlignLast 'center' — in-loop wrap branch:
// fill is attempted (shortfall 42, capacity covers), then the line
// wraps and the filler restores + centres instead of justifying.
{
  const line = makeLine(WORD.repeat(12) + 'الكت', { wrapAfterFill: true }); // 76 chars, 608px
  assert.equal(fillMushafLine(line), 'centred');
  assert.equal(line.style.textAlign, 'center');
  assert.equal(line.style.textAlignLast, 'center');
  assert.equal(shimTextContent(line).includes(T), false, 'wrapped fill is restored, no tatweel left');
}
// (b) Fill path clears a stale textAlignLast 'center' (from a previous
// centre decision) — the 'filled' exit sets it to ''.
{
  const line = makeLine(WORD.repeat(13) + 'ال'); // 80 chars, 640px, shortfall 10 -> fill
  line.style.textAlignLast = 'center'; // stale
  assert.equal(fillMushafLine(line), 'filled');
  assert.equal(line.style.textAlignLast, '');
  assert.equal(shimTextContent(line).split(T).length - 1, 1, 'exactly one tatweel inserted');
}
// (b) A line centred on one run must not keep textAlignLast 'center'
// when a script switch makes it fillable on the next run.
{
  const line = makeLine(WORD.repeat(6));
  assert.equal(fillMushafLine(line), 'centred');
  assert.equal(line.style.textAlignLast, 'center');
  line.childNodes[0].data = WORD.repeat(13) + 'ال'; // script switch: now fillable
  assert.equal(fillMushafLine(line), 'filled');
  assert.equal(line.style.textAlignLast, '');
}
// (b) 'full' / 'left' exit restores the previous inline values (the
// line is already full, so last-align is inert there).
{
  const line = makeLine(WORD.repeat(13) + 'الك'); // 81 chars, 648px, shortfall 2 -> full
  line.style.textAlign = 'justify';
  line.style.textAlignLast = 'center';
  assert.equal(fillMushafLine(line), 'left');
  assert.equal(line.style.textAlign, 'justify');
  assert.equal(line.style.textAlignLast, 'center');
}
// (b) Catch path ('left' on measurement failure) clears textAlignLast.
{
  const line = makeLine(WORD.repeat(13) + 'ال');
  line.style.textAlignLast = 'center';
  shimThrowOnAppend = true;
  try {
    assert.equal(fillMushafLine(line), 'left');
    assert.equal(line.style.textAlignLast, '');
  } finally {
    shimThrowOnAppend = false;
  }
}
// (c) A wrapped line resolves to 'centred' with NO tatweels inserted.
{
  const line = makeLine(WORD.repeat(6), { forceWrapped: true });
  assert.equal(fillMushafLine(line), 'centred');
  assert.equal(line.style.textAlign, 'center');
  assert.equal(line.style.textAlignLast, 'center');
  assert.equal(shimTextContent(line).includes(T), false, 'wrapped line gets no tatweel');
}

console.log('kashida: fillMushafLine alignment decisions (textAlignLast + wrapped-centre) passed.');

rmSync(outDir, { recursive: true, force: true });
console.log(`kashida: ${cases.length} eligibleOffsets cases + insertTatweel checks passed.`);

// stripTatweel: snapshotLine's script-change detector. Two texts that
// differ only by tatweel compare equal once stripped (a previous fill's
// inserted tatweel must NOT look like a script change); texts that
// differ in letters do not.
assert.equal(stripTatweel('\u0627\u0644\u0643\u062A\u0640\u0627\u0628'), '\u0627\u0644\u0643\u062A\u0627\u0628');
assert.equal(stripTatweel('\u0645\u0640\u0670\u0644\u0643'), '\u0645\u0670\u0644\u0643');
assert.equal(stripTatweel('\u0627\u0644\u0643\u062A\u0627\u0628'), stripTatweel('\u0627\u0644\u0643\u062A\u0640\u0627\u0628'));
assert.notEqual(
  stripTatweel('\u0645\u0627\u0644\u0643'), // مَالِك (Indo-Pak, no tatweel)
  stripTatweel('\u0645\u0644\u0643'), // different letters — a real change
);

// ------------------------------------------------------------------
// Fill-decision helpers (the page-1 defect fix, 2026-11-22).
//
// The old filler used ceil(shortfall / tatweelWidth): it inserted up to
// one tatweel MORE than the shortfall, the line overflowed its box by a
// few px, wrapped onto a second visual line, and the wrap-guard threw
// the whole fill away — leaving the line on plain CSS justification
// with wide gaps. The new filler undershoots (floor + slack) and
// centres any line it cannot fill instead of leaving it justified.
// NOTE: that ceil/capacity story was the simulation diagnosis. The
// LIVE cause of lines 3–5 staying justified after the 46e15b9 fix was
// isWrapped() counting Range.getClientRects() — bidi/inline-box
// fragmentation made every rosette-bearing line look "wrapped", so the
// filler returned 'left' before measuring. Fixed by comparing the
// range's bounding height against one line-height (DOM-only, verified
// live in a browser, not here).
// ------------------------------------------------------------------

// fillDecision(shortfall, avail, capacityPx): 'full' | 'fill' | 'centre'.
assert.equal(fillDecision(0, 650, 100), 'full');
assert.equal(fillDecision(2, 650, 100), 'full');
assert.equal(fillDecision(3, 650, 100), 'fill');
assert.equal(fillDecision(300, 650, 500), 'centre'); // >45% of avail
assert.equal(fillDecision(292, 650, 500), 'fill'); // 44.9% <= 45% and capacity covers
assert.equal(fillDecision(293, 650, 500), 'centre'); // 45.08% > 45%
assert.equal(fillDecision(140, 650, 100), 'centre'); // capacity cannot cover shortfall
assert.equal(fillDecision(140, 650, 140), 'fill'); // capacity exactly covers
// Page-1 lines (HarfBuzz-shaped Amiri, 33.6px, 650px frame):
assert.equal(fillDecision(242, 650, 167), 'centre'); // line 4: capacity 167 < shortfall 242
assert.equal(fillDecision(284, 650, 186), 'centre'); // line 5: capacity 186 < shortfall 284
assert.equal(fillDecision(219, 650, 242), 'fill'); // line 6: capacity covers
// Same page-1 line 6 measured in Scheherazade New (the live default
// font; its tatweel is only ~2.97px vs Amiri's ~6.2px, so capacity
// roughly halves): shortfall 151 vs capacity 116 — it must centre, not
// fill. The decision helpers are font-agnostic; the DOM filler measures
// the tatweel width in the live font (canvas) at runtime.
assert.equal(fillDecision(151, 650, 116), 'centre'); // line 6 in Scheherazade New

// tatweelsToInsert: floor, never ceil — and never more than capacity.
assert.equal(tatweelsToInsert(219, 6.2, 39), 35); // floor((219-2)/6.2) — ceil would be 36 (the old overshoot)
assert.equal(tatweelsToInsert(129, 6.2, 57), 20); // page-2 line 4: ceil would be 21 (overshoot)
assert.equal(tatweelsToInsert(5, 6.2, 30), 0); // one more tatweel would overflow the box
assert.equal(tatweelsToInsert(500, 6.2, 10), 10); // bounded by remaining capacity
assert.equal(tatweelsToInsert(0, 6.2, 30), 0);
assert.equal(tatweelsToInsert(-3, 6.2, 30), 0);
assert.equal(tatweelsToInsert(100, 0, 30), 0);
assert.equal(tatweelsToInsert(100, 6.2, 0), 0);

// isNearlyFull: a shortfall of at most one tatweel + slack is full.
assert.equal(isNearlyFull(2, 6.2), true);
assert.equal(isNearlyFull(6.4, 6.2), true);
assert.equal(isNearlyFull(8.2, 6.2), true); // boundary: tatweel + slack
assert.equal(isNearlyFull(8.3, 6.2), false);
assert.equal(isNearlyFull(20, 6.2), false);

// Page-1 regression fixtures (HarfBuzz-shaped Amiri widths at 33.6px,
// avail 650px — main max-w-3xl 768 − px-4 32 − frame p-4 32 − inner
// px-6 48 − borders 6 = 650; measured 2026-11-22 from the live
// Quran.com data; each inserted tatweel adds 6.2px, verified by shaping).
const AVAIL = 650;
const TAT_W = 6.2;
// Lines 4–5 cannot be filled: capacity < shortfall — they must resolve
// to centred, never to plain CSS justification.
for (const { natural, points } of [
  { natural: 408, points: 9 }, // line 4: shortfall 242 vs capacity 167
  { natural: 366, points: 10 }, // line 5: shortfall 284 vs capacity 186
]) {
  const shortfall = AVAIL - natural;
  assert.equal(
    fillDecision(shortfall, AVAIL, points * MAX_PER_POINT * TAT_W),
    'centre',
    `line natural ${natural} must centre, not justify`,
  );
}
// Line 6 CAN be filled — but the OLD ceil logic overflowed its box by
// ~4px, wrapped, and was restored to plain CSS justification. The new
// floor logic keeps the filled line inside the box.
for (const { natural, points } of [
  { natural: 431, points: 13 }, // page-1 line 6: shortfall 219, capacity 242
  { natural: 521, points: 19 }, // page-2 line 4: shortfall 129, capacity 353
]) {
  const shortfall = AVAIL - natural;
  const totalCap = points * MAX_PER_POINT;
  assert.equal(fillDecision(shortfall, AVAIL, totalCap * TAT_W), 'fill');
  const n = tatweelsToInsert(shortfall, TAT_W, totalCap);
  // Filled width stays inside the box (old ceil count would exceed it).
  assert.ok(natural + n * TAT_W <= AVAIL, `filled width ${natural + n * TAT_W} <= avail ${AVAIL}`);
  assert.ok(natural + Math.ceil(shortfall / TAT_W) * TAT_W > AVAIL, 'old ceil count overflows (the defect)');
  // After the round the remaining shortfall is accepted as nearly full.
  assert.ok(isNearlyFull(shortfall - n * TAT_W, TAT_W), 'remainder is nearly full');
  // Evenly spread: no point carries more than MAX_PER_POINT.
  assert.ok(Math.ceil(n / points) <= MAX_PER_POINT, 'per-point cap respected');
}

console.log('kashida: fillDecision + tatweelsToInsert + isNearlyFull + page-1 regression checks passed.');
