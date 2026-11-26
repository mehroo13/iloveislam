/**
 * tools/test-recitation-anchor.mjs — Node test for the mic start-anchor
 * (app/hifz/lib/recitation-anchor.ts). Pure logic only: no engine, no
 * browser, no mic. Run: `node tools/test-recitation-anchor.mjs`
 *
 * Simulates the event sequences the live adapter sees, in arrival order:
 *  (a) mid-page start — the tracker wanders in `ambiguous`, then locks
 *      mid-page: the anchor must land mid-page, so the un-recited head
 *      words are "not attempted" (pre-anchor flags suppressed, final
 *      status not-reached);
 *  (b) from-the-top start — anchor at passage index 0, nothing suppressed;
 *  (c) short take with no lock — NO fallback anchor (2026-11-27, H3:
 *      a never-locking take has no anchor and reports unclear, instead
 *      of being silently anchored on an ambiguous guess);
 *  (d) hardening — the floor, the confidence floor and the 500 ms
 *      guard (2026-11-27, H1): a lock onto the passage head, a
 *      low-confidence lock, or a lock in the first 500 ms never
 *      starts the anchor run.
 *
 * The adapter wiring in lib/tilawa.ts (buffering checker events until the
 * anchor is known, flushing at/after it, the anchor-beats-flag rule in
 * buildResult, filtering result.mistakes) is NOT testable headless — it
 * needs the live Tilawa engine and a real mic take, so it is covered by
 * the live verifier, not by this script. This script proves the anchor
 * rule itself, which is the whole decision.
 */
import assert from 'node:assert/strict';
import {
  ANCHOR_RUN_LENGTH,
  AnchorTracker,
  detectAnchor,
} from '../app/hifz/lib/recitation-anchor.ts';

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log(`  ok — ${name}`);
}

// The suppression rule the adapter applies to every checker flag and to
// result.mistakes: a flag at/after the anchor is kept, a flag before it
// is dropped. (Kept as a local mirror of the one-line rule in tilawa.ts:
// `idx < anchorIndex` — the test asserts the rule's truth table, the
// live verifier asserts the adapter actually applies it.)
function flagSuppressed(index, anchor) {
  return index !== undefined && anchor !== null && index < anchor;
}

console.log('recitation-anchor tests');
console.log(`  ANCHOR_RUN_LENGTH = ${ANCHOR_RUN_LENGTH}`);
assert.equal(ANCHOR_RUN_LENGTH, 3);

// ── (a) Mid-page start ──────────────────────────────────────────────
// Tracker wanders in `ambiguous` (wrong-passage guesses), then locks at
// word 10, 11, 12 of the passage. Anchor must be 10 — NOT 0, and NOT
// the first ambiguous word.
check('mid-page start: anchor lands mid-page (10), not at the top', () => {
  const anchor = detectAnchor(
    [
      { index: 0, state: 'ambiguous' },
      { index: 1, state: 'ambiguous' },
      { index: 3, state: 'ambiguous' },
      { index: 10, state: 'locked', confidence: 0.9, timeMs: 2000 },
      { index: 4, state: 'ambiguous' },
      { index: 11, state: 'locked', confidence: 0.9, timeMs: 2500 },
      { index: 12, state: 'locked', confidence: 0.95, timeMs: 3000 },
      { index: 13, state: 'locked', confidence: 0.95, timeMs: 3500 },
    ],
    10, // firstLockedIndex
  );
  assert.equal(anchor, 10);
});

check('mid-page start: head-word flags suppressed, anchor-word flags kept', () => {
  const anchor = 10;
  for (const i of [0, 1, 5, 9]) assert.equal(flagSuppressed(i, anchor), true);
  for (const i of [10, 11, 12, 40]) assert.equal(flagSuppressed(i, anchor), false);
  // No anchor yet (take still finding its feet): nothing is dropped.
  assert.equal(flagSuppressed(0, null), false);
  // Off-passage flag (no passage index): kept — the anchor cannot judge it.
  assert.equal(flagSuppressed(undefined, anchor), false);
});

check('mid-page start: anchor never moves once set (jump back, re-lock)', () => {
  const t = new AnchorTracker();
  const feed = [
    [10, 'locked'], [11, 'locked'], [12, 'locked'],
    [13, 'locked'], [14, 'locked'],
    [5, 'locked'], [6, 'locked'], [7, 'locked'], [8, 'locked'],
  ];
  for (const [i, s] of feed) t.observe(i, s);
  assert.equal(t.anchor, 10);
});

check('mid-page start: anchor appears only on the 3rd consecutive locked word', () => {
  const t = new AnchorTracker();
  assert.equal(t.anchor, null);
  t.observe(10, 'locked');
  assert.equal(t.anchor, null);
  t.observe(4, 'ambiguous'); // intervening ambiguous: ignored, run survives
  t.observe(11, 'locked');
  assert.equal(t.anchor, null);
  t.observe(12, 'locked');
  assert.equal(t.anchor, 10);
});

// ── (b) From-the-top start ──────────────────────────────────────────
check('from-top start: anchor at 0, nothing suppressed', () => {
  const anchor = detectAnchor(
    [
      { index: 0, state: 'locked', confidence: 0.9, timeMs: 1000 },
      { index: 1, state: 'locked', confidence: 0.9, timeMs: 1500 },
      { index: 2, state: 'locked', confidence: 0.9, timeMs: 2000 },
      { index: 3, state: 'locked', confidence: 0.9, timeMs: 2500 },
    ],
    0,
  );
  assert.equal(anchor, 0);
  for (const i of [0, 1, 2, 3]) assert.equal(flagSuppressed(i, anchor), false);
});

check('from-top start: ambiguous lead-in does not move the anchor', () => {
  const anchor = detectAnchor(
    [
      { index: 2, state: 'ambiguous' },
      { index: 0, state: 'locked', confidence: 0.9, timeMs: 1000 },
      { index: 1, state: 'locked', confidence: 0.9, timeMs: 1500 },
      { index: 2, state: 'locked', confidence: 0.9, timeMs: 2000 },
    ],
    0,
  );
  assert.equal(anchor, 0);
});

// ── (c) Short take, no lock ─────────────────────────────────────────
check('short take, never locks: NO fallback anchor (H3 — null, take is unclear)', () => {
  const anchor = detectAnchor(
    [
      { index: 2, state: 'ambiguous', confidence: 0.5, timeMs: 1000 },
      { index: 3, state: 'ambiguous', confidence: 0.5, timeMs: 2000 },
      { index: 4, state: 'ambiguous', confidence: 0.5, timeMs: 3000 },
    ],
    null, // never locked
  );
  assert.equal(anchor, null);
});

check('lock but no 3-run by stop: fallback anchor = first locked word', () => {
  const anchor = detectAnchor(
    [
      { index: 5, state: 'locked', confidence: 0.9, timeMs: 1000 },
      { index: 7, state: 'locked', confidence: 0.9, timeMs: 2000 }, // jump: restarts the run, no 3-run
    ],
    5,
  );
  assert.equal(anchor, 5);
});

check('nothing observed at all: anchor null, no crash', () => {
  assert.equal(detectAnchor([], null), null);
  const t = new AnchorTracker();
  assert.equal(t.resolveAtStop(null), null);
  assert.equal(t.anchor, null);
});

// ── Run-break rules ─────────────────────────────────────────────────
check('repeated locked word restarts the run at that word', () => {
  const anchor = detectAnchor(
    [
      { index: 8, state: 'locked', confidence: 0.9, timeMs: 1000 },
      { index: 8, state: 'locked', confidence: 0.9, timeMs: 1500 },
      { index: 9, state: 'locked', confidence: 0.9, timeMs: 2000 },
      { index: 10, state: 'locked', confidence: 0.9, timeMs: 2500 },
    ],
    8,
  );
  assert.equal(anchor, 8);
});

check('step back restarts the run at the earlier word', () => {
  const anchor = detectAnchor(
    [
      { index: 6, state: 'locked', confidence: 0.9, timeMs: 1000 },
      { index: 7, state: 'locked', confidence: 0.9, timeMs: 1500 },
      { index: 5, state: 'locked', confidence: 0.9, timeMs: 2000 },
      { index: 6, state: 'locked', confidence: 0.9, timeMs: 2500 },
      { index: 7, state: 'locked', confidence: 0.9, timeMs: 3000 },
      { index: 8, state: 'locked', confidence: 0.9, timeMs: 3500 },
    ],
    6,
  );
  assert.equal(anchor, 5);
});

check('ambiguous observations never start or break a run', () => {
  const anchor = detectAnchor(
    [
      { index: 4, state: 'locked', confidence: 0.9, timeMs: 1000 },
      { index: 0, state: 'ambiguous' },
      { index: 5, state: 'locked', confidence: 0.9, timeMs: 1500 },
      { index: 9, state: 'ambiguous' },
      { index: 6, state: 'locked', confidence: 0.9, timeMs: 2000 },
    ],
    4,
  );
  assert.equal(anchor, 4);
});

// ── (d) Hardening: floor, confidence, time (H1, 2026-11-27) ─────────
check('floor: a 3-run onto the passage head never becomes the anchor', () => {
  // Start ayah 1:4 (passage idx 10); floor = first word of 1:3 (idx 8).
  // The tracker locks 0,1,2 first (head), then 10,11,12 (his start).
  const anchor = detectAnchor(
    [
      { index: 0, state: 'locked', confidence: 0.9, timeMs: 1000 },
      { index: 1, state: 'locked', confidence: 0.9, timeMs: 1500 },
      { index: 2, state: 'locked', confidence: 0.9, timeMs: 2000 },
      { index: 10, state: 'locked', confidence: 0.9, timeMs: 2500 },
      { index: 11, state: 'locked', confidence: 0.9, timeMs: 3000 },
      { index: 12, state: 'locked', confidence: 0.9, timeMs: 3500 },
    ],
    10,
    { floorIndex: 8 },
  );
  assert.equal(anchor, 10);
});

check('floor: with no lock at/after the floor, the fallback is null', () => {
  const t = new AnchorTracker({ floorIndex: 8 });
  t.observe(0, 'locked', 0.9, 1000);
  t.observe(1, 'locked', 0.9, 1500);
  t.observe(2, 'locked', 0.9, 2000);
  assert.equal(t.anchor, null);
  // A first-locked below the floor must not become the stop fallback
  // either (the adapter only feeds it locks at/after the floor).
  assert.equal(t.resolveAtStop(null), null);
});

check('confidence: a low-confidence lock never joins the run', () => {
  const anchor = detectAnchor(
    [
      { index: 10, state: 'locked', confidence: 0.2, timeMs: 1000 },
      { index: 11, state: 'locked', confidence: 0.2, timeMs: 1500 },
      { index: 12, state: 'locked', confidence: 0.2, timeMs: 2000 },
      { index: 13, state: 'locked', confidence: 0.9, timeMs: 2500 },
      { index: 14, state: 'locked', confidence: 0.9, timeMs: 3000 },
      { index: 15, state: 'locked', confidence: 0.9, timeMs: 3500 },
    ],
    10,
  );
  assert.equal(anchor, 13);
});

check('time: a lock in the first 500 ms never joins the run', () => {
  const anchor = detectAnchor(
    [
      { index: 10, state: 'locked', confidence: 0.9, timeMs: 200 },
      { index: 11, state: 'locked', confidence: 0.9, timeMs: 600 },
      { index: 12, state: 'locked', confidence: 0.9, timeMs: 900 },
      { index: 13, state: 'locked', confidence: 0.9, timeMs: 1200 },
    ],
    10,
  );
  assert.equal(anchor, 11);
});

check('observations without confidence/time still anchor (replayed sequences)', () => {
  const anchor = detectAnchor(
    [
      { index: 10, state: 'locked' },
      { index: 11, state: 'locked' },
      { index: 12, state: 'locked' },
    ],
    10,
  );
  assert.equal(anchor, 10);
});

console.log(`\n${passed} checks passed.`);
