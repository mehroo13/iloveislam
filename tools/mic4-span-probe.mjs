/**
 * tools/mic4-span-probe.mjs — Node probe for the mic first-word gap
 * (worker B, 2026-11-27). Feeds the harness take WAVs (real Alafasy
 * audio) to a memorization session via @tilawa/core/node — the same
 * engine/tracker/checker the browser coach runs — and dumps the
 * acquisition in full: every position event with its committed span,
 * basmala prefix, confidence and per, plus checker flags.
 *
 * Questions it answers (before any live run):
 *  - What is the first lock's span? ("words covered by the evidence
 *    so far" — the acquisition context the lock consumed.)
 *  - Does a from-the-top take's first lock carry prefix 'basmala'?
 *  - Does a take that SKIPS 1:1 carry NO prefix? (the discriminator)
 *  - How fast is inference vs real time (feed wall ms vs audio sec)?
 *
 * Run: node tools/mic4-span-probe.mjs [--tier lite|full] [--case mid|top|skip|skipbasmala|all]
 * Requires: network once for the model (cached in /tmp/tilawa-cache),
 * ffmpeg only for the take WAVs (already 16 kHz mono).
 */
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createTilawa, readWav } from '@tilawa/core/node';

const AUDIO = '/home/hatch/workspace/mushaf-verify/audio';
const args = process.argv.slice(2);
const tierArg = (args.find((a) => a.startsWith('--tier=')) ?? '--tier=lite').split('=')[1];
const caseArg = (args.find((a) => a.startsWith('--case=')) ?? '--case=all').split('=')[1];
const TIER = tierArg === 'full' ? 'full' : 'lite';

const CASES = {
  mid: { wav: 'take-mid.wav', label: 'start 1:4, recite 1:4-7' },
  top: { wav: 'take-top.wav', label: 'from top, recite 1:1-7' },
  skip: { wav: 'take-skip.wav', label: 'start 1:4, recite 1:4,1:5,1:7 (1:6 skipped)' },
  skipbasmala: { wav: 'take-skip-basmala.wav', label: 'from top, recite 1:2-7 (1:1 SKIPPED)' },
  skiphead: { wav: 'take-skip-head.wav', label: 'start 1:4, recite 1:4:1, 1:4:3-7 (1:4:2 SKIPPED inside the acquisition window)' },
  start13: { wav: 'take-start-1-3.wav', label: 'from top, recite 1:3-7 (1:1 AND 1:2 skipped — basmala false-positive control)' },
};

const wk = (r) => `${r.surah}:${r.ayah}:${r.word}`;

async function probe(tilawa, name, cfg) {
  console.log(`\n===== ${name.toUpperCase()} — ${cfg.label} (${cfg.wav}) =====`);
  const session = tilawa.startMemorization(
    { surah: 1, fromAyah: 1, toAyah: 7 },
    { confirm: { after: 'next-word' } },
  );
  const positions = [];
  const checker = [];
  session.subscribe((e) => {
    if (e.type === 'position') {
      const c = e.observed?.[0];
      positions.push({
        timeMs: e.timeMs, state: e.state,
        word: c ? wk(c.word) : null,
        span: c ? `${wk(c.span.start)}..${wk(c.span.end)}` : null,
        prefix: c?.prefix ?? null,
        conf: c ? +c.confidence.toFixed(3) : null,
        per: c ? +c.per.toFixed(3) : null,
        cost: c ? +c.cost.toFixed(3) : null,
      });
    } else if (e.type === 'checker') {
      checker.push(e);
    }
  });
  const { samples, sampleRate } = await readWav(join(AUDIO, cfg.wav));
  const audioSec = samples.length / sampleRate;
  const chunk = Math.round(0.3 * sampleRate);
  const t0 = performance.now();
  for (let i = 0; i < samples.length; i += chunk) {
    await session.pushAudio(samples.subarray(i, i + chunk), sampleRate);
  }
  const feedMs = performance.now() - t0;
  await session.end();
  console.log(`audio ${audioSec.toFixed(1)}s fed in ${feedMs.toFixed(0)}ms wall (${(audioSec * 1000 / feedMs).toFixed(2)}x real-time)`);
  const firstPos = positions[0];
  console.log('first position event:', JSON.stringify(firstPos));
  const firstLock = positions.find((p) => p.state === 'locked');
  console.log('FIRST LOCK:', JSON.stringify(firstLock));
  const locked = positions.filter((p) => p.state === 'locked');
  console.log(`locked events: ${locked.length}; first 6 locked words: ${locked.slice(0, 6).map((p) => `${p.word}@${p.timeMs}ms`).join(', ')}`);
  const amb = positions.filter((p) => p.state === 'ambiguous');
  console.log(`ambiguous events: ${amb.length}; first 3: ${amb.slice(0, 3).map((p) => `${p.word}@${p.timeMs}ms`).join(', ') || '(none)'}`);
  const preLockAmb = positions.slice(0, positions.findIndex((p) => p.state === 'locked'));
  console.log('pre-lock ambiguous (full):', JSON.stringify(preLockAmb.filter((p) => p.state === 'ambiguous')));
  const acq = positions.filter((p) => p.state === 'acquiring');
  console.log(`acquiring events: ${acq.length}`);
  const confirmed = checker.filter((c) => c.state === 'confirmed');
  console.log(`checker confirmed: ${confirmed.length} ${confirmed.map((c) => `${c.errorClass}@${wk(c.location)}`).join(', ') || '(none)'}`);
  const resolved = checker.filter((c) => c.state !== 'confirmed').length;
  console.log(`checker non-confirmed (resolved/uncertain): ${resolved}`);
  // The adapter's anchor inputs, replayed from the locked stream:
  // first locked word at/after floor 8 (MID/SKIP) or 0 (TOP).
  const floor = name === 'mid' || name === 'skip' ? 8 : 0;
  console.log('locked words in passage order (first 12):', locked.slice(0, 12).map((p) => p.word).join(' '));
  console.log('floor:', floor);
  session.dispose();
}

async function main() {
  console.log(`loading engine (tier ${TIER})…`);
  const t0 = performance.now();
  const tilawa = await createTilawa({ tier: TIER, cacheDir: join(tmpdir(), 'tilawa-cache') });
  console.log(`engine ready in ${((performance.now() - t0) / 1000).toFixed(1)}s — model ${tilawa.model.id} tier ${tilawa.model.tier} backend ${tilawa.model.backend}`);
  const names = caseArg === 'all' ? Object.keys(CASES) : [caseArg];
  for (const n of names) await probe(tilawa, n, CASES[n]);
  await tilawa.dispose();
  console.log('\nDONE');
}
main().catch((e) => { console.error('PROBE ERROR', e); process.exit(2); });
