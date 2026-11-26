/**
 * tools/mic-anchor-verify.mjs — PROOF script for the mic anchor fix
 * (2026-11-27, H1–H5). NOT shipped to production.
 *
 * Run: `node tools/mic-anchor-verify.mjs`
 *
 * Feeds REAL Alafasy audio to the node Tilawa engine (same engine the
 * browser coach loads; model + audio cached in /tmp) and replays the
 * position events through the REAL AnchorTracker
 * (app/hifz/lib/recitation-anchor.ts) with the production floor /
 * confidence / time guards, then applies the new status rules
 * (locked-only reached, anchor grace, went-past → missed) to prove:
 *  - MID (declare 1:1-7, recite only 1:4-7 — Mehran's exact scenario):
 *    the anchor lands at 1:4:3, the starting line is never `missed`,
 *    and a stray ambiguous guess ahead cannot mark it missed (H2).
 *  - TOP (declare 1:1-7, recite 1:1-7): no false misses either — but
 *    the anchor is NOT index 0 (first genuine lock lands ~9 s in),
 *    so the first words are honestly `not-reached`, never `correct`.
 *  - SHORT (declare 1:1, recite 1:1): the take never locks, so it has
 *    NO anchor and reports `unclear` instead of false green (H3).
 *
 * The status computation here is a deliberately small simulation of
 * the status rules in lib/tilawa.ts buildResult() (anchor grace +
 * went-past rule); the full adapter is measured by
 * tools/test-tilawa.mjs, whose mirror was updated with the same rules.
 */
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createTilawa, readWav } from '@tilawa/core/node';
import { AnchorTracker } from '../app/hifz/lib/recitation-anchor.ts';

const CACHE_DIR = join(tmpdir(), 'tilawa-cache');
const WORK_DIR = join(tmpdir(), 'tilawa-test-audio');

// Al-Fatihah word counts per ayah (1:1=4, 1:2=4, 1:3=2, 1:4=3, 1:5=4, 1:6=3, 1:7=9).
const WORDS_PER_AYAH = { 1: 4, 2: 4, 3: 2, 4: 3, 5: 4, 6: 3, 7: 9 };
const orderedKeys = [];
for (let a = 1; a <= 7; a++) {
  for (let w = 1; w <= WORDS_PER_AYAH[a]; w++) orderedKeys.push(`1:${a}:${w}`);
}
const orderedIndex = new Map(orderedKeys.map((k, i) => [k, i]));
const ayahFirst = new Map();
for (const k of orderedKeys) {
  const ak = k.split(':').slice(0, 2).join(':');
  if (!ayahFirst.has(ak)) ayahFirst.set(ak, orderedIndex.get(k));
}
// Start ayah 1:4 (idx 10); floor = first word of the ayah before it (1:3, idx 8).
const FLOOR = ayahFirst.get('1:3');

async function runCase(tilawa, label, { fromAyah, toAyah, audioAyahs, startAyah }) {
  // Passage keys for THIS case only (SHORT declares 1:1, not 1:1-7).
  const passageKeys = [];
  for (let a = fromAyah; a <= toAyah; a++) {
    for (let w = 1; w <= WORDS_PER_AYAH[a]; w++) passageKeys.push(`1:${a}:${w}`);
  }
  const passageIndex = new Map(passageKeys.map((k, i) => [k, i]));
  const session = tilawa.startMemorization(
    { surah: 1, fromAyah, toAyah },
    { confirm: { after: 'next-word' } },
  );
  const events = [];
  session.subscribe((e) => {
    if (e.type === 'position' && e.observed?.[0]) {
      const o = e.observed[0];
      events.push({ t: e.timeMs, state: e.state, key: `${o.word.surah}:${o.word.ayah}:${o.word.word}`, conf: o.confidence });
    }
  });
  for (const a of audioAyahs) {
    const { samples, sampleRate } = await readWav(join(WORK_DIR, `fatihah-1-${a}.wav`));
    for (let i = 0; i < samples.length; i += 4800) {
      await session.pushAudio(samples.subarray(i, i + 4800), sampleRate);
    }
  }
  await session.end();
  session.dispose();

  // Feed the REAL tracker with the production floor (start ayah 1:4).
  const floor = startAyah ? ayahFirst.get(`1:${startAyah - 1}`) ?? 0 : 0;
  const tracker = new AnchorTracker({ floorIndex: floor });
  let firstLocked = null;
  let firstObserved = null;
  // H2: ONLY locked observations count as reached.
  const reached = new Set();
  for (const ev of events) {
    const idx = passageIndex.get(ev.key);
    if (idx === undefined) continue;
    if (firstObserved === null) firstObserved = idx;
    if (ev.state === 'locked') {
      if (firstLocked === null && orderedIndex.get(ev.key) >= floor) firstLocked = idx;
      reached.add(ev.key);
    }
    tracker.observe(orderedIndex.get(ev.key), ev.state, ev.conf, ev.t);
  }
  let anchor = tracker.anchor;
  if (anchor === null) anchor = tracker.resolveAtStop(firstLocked);
  const lastReached = [...reached].map((k) => passageIndex.get(k)).sort((a, b) => a - b).at(-1) ?? null;
  const status = new Map();
  for (const k of passageKeys) {
    const idx = passageIndex.get(k);
    if (anchor !== null && idx < anchor) status.set(k, 'not-reached');
    else if (reached.has(k)) status.set(k, 'correct');
    else if (lastReached !== null && idx < lastReached) status.set(k, 'missed');
    else status.set(k, 'not-reached');
  }
  const missed = [...status.values()].filter((s) => s === 'missed').length;
  const correct = [...status.values()].filter((s) => s === 'correct').length;
  const coverage = reached.size / passageKeys.length;
  const unclear = reached.size === 0 || coverage < 0.5;
  console.log(`\n--- ${label} ---`);
  console.log(`  events: ${events.length} | locked: ${events.filter((e) => e.state === 'locked').length} | first locked: ${firstLocked !== null ? passageKeys[firstLocked] : '-'} | first observed (any state): ${firstObserved !== null ? passageKeys[firstObserved] : '-'}`);
  console.log(`  floor: ${floor} (${orderedKeys[floor]}) | anchor: ${anchor} (${anchor !== null ? orderedKeys[anchor] : '-'}) | correct=${correct} missed=${missed} unclear=${unclear}`);
  return { events, anchor, floor, firstLocked, firstObserved, missed, correct, unclear, status, reached };
}

const tilawa = await createTilawa({ tier: 'lite', cacheDir: CACHE_DIR });
console.log(`engine: ${tilawa.model.id} tier=${tilawa.model.tier}`);

// MID — Mehran's exact scenario.
const mid = await runCase(tilawa, 'MID — declare 1:1-7, recite only 1:4-7', {
  fromAyah: 1, toAyah: 7, audioAyahs: [4, 5, 6, 7], startAyah: 4,
});
assert.equal(mid.anchor, 12, 'MID anchor must be 1:4:3 (idx 12), not the head');
assert.equal(mid.missed, 0, 'MID: no word may be missed on clean recitation');
assert.equal(mid.status.get('1:4:1'), 'not-reached', 'MID: first word of the starting line is not-reached (tracker had not locked yet), never missed');
assert.equal(mid.status.get('1:4:2'), 'not-reached', 'MID: second word of the starting line is not-reached, never missed');
assert.equal(mid.status.get('1:4:3'), 'correct', 'MID: anchor word itself is correct');
console.log('  ok — starting line never missed; anchor at 1:4:3');

// H2 injection (synthetic, so the mechanism is isolated): the tracker
// locks 1:4:3–1:5:1 (anchor 12), then emits ONE stray `ambiguous` guess
// at 1:7:1 (idx 20) and the take ends — no further locks. Under the OLD
// rule the guess counted as reached, so lastReached=20 and the
// unobserved words 1:5:2–1:6:3 (idx 14–19) came out `missed`. Under the
// NEW rule the guess never enters `reached`, lastReached stays 13, and
// those words are `not-reached` (the reciter simply stopped there).
{
  const synthetic = [
    { idx: 12, state: 'locked', conf: 1.0, t: 2000 },
    { idx: 13, state: 'locked', conf: 1.0, t: 2500 },
    { idx: 14, state: 'locked', conf: 1.0, t: 3000 },
    { idx: 20, state: 'ambiguous', conf: 0.8, t: 3500 },
  ];
  const tracker = new AnchorTracker({ floorIndex: FLOOR });
  const reachedOld = new Set();
  const reachedNew = new Set();
  for (const ev of synthetic) {
    tracker.observe(ev.idx, ev.state, ev.conf, ev.t);
    reachedOld.add(orderedKeys[ev.idx]); // old: every observation counts
    if (ev.state === 'locked') reachedNew.add(orderedKeys[ev.idx]); // new: locked only
  }
  const anchor = tracker.anchor;
  assert.equal(anchor, 12);
  const wentPast = (reachedSet) => {
    const last = [...reachedSet].map((k) => orderedIndex.get(k)).sort((a, b) => a - b).at(-1);
    const missed = [];
    for (let i = 0; i < orderedKeys.length; i++) {
      if (anchor !== null && i < anchor) continue;
      if (!reachedSet.has(orderedKeys[i]) && last !== null && i < last) missed.push(orderedKeys[i]);
    }
    return missed;
  };
  const oldMissed = wentPast(reachedOld);
  const newMissed = wentPast(reachedNew);
  console.log(`\n--- H2 injection (synthetic: lock 12–14, stray ambiguous guess at idx 20, take ends) ---`);
  console.log(`  old rule missed: ${oldMissed.join(', ')}`);
  console.log(`  new rule missed: ${newMissed.join(', ') || '(none)'}`);
  assert.deepEqual(oldMissed, ['1:5:3', '1:5:4', '1:6:1', '1:6:2', '1:6:3']);
  assert.deepEqual(newMissed, []);
  console.log('  ok — ambiguous guesses cannot advance the reached frontier');
}

// TOP — from-the-top control.
const top = await runCase(tilawa, 'TOP — declare 1:1-7, recite 1:1-7', {
  fromAyah: 1, toAyah: 7, audioAyahs: [1, 2, 3, 4, 5, 6, 7], startAyah: 1,
});
assert.equal(top.missed, 0, 'TOP: no word may be missed on clean recitation');
assert.notEqual(top.anchor, 0, 'TOP: the anchor is NOT index 0 — first genuine lock lands seconds in (honest ceiling, reported not hidden)');
assert.equal(top.status.get('1:1:1'), 'not-reached', 'TOP: head words before the anchor are not-reached, never correct-by-assumption');
console.log(`  ok — no false misses from the top; anchor honestly at ${orderedKeys[top.anchor]} (idx ${top.anchor}), not 0`);

// SHORT — single short ayah never locks.
const short = await runCase(tilawa, 'SHORT — declare 1:1, recite 1:1', {
  fromAyah: 1, toAyah: 1, audioAyahs: [1], startAyah: 1,
});
assert.equal(short.anchor, null, 'SHORT: no lock means no anchor (H3)');
assert.equal(short.unclear, true, 'SHORT: never-locking take reports unclear');
assert.equal(short.missed, 0, 'SHORT: nothing is missed — the take is unclear, not wrong');
console.log('  ok — short take is unclear, never falsely green or red');

await tilawa.dispose();
console.log('\nAll mic-anchor proofs passed.');
