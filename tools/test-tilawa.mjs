/**
 * tools/test-tilawa.mjs — PROOF script for the Tilawa recitation engine.
 *
 * NOT shipped to production (not imported by any app code). Run:
 *   node tools/test-tilawa.mjs [--tier lite|full] [--case fatihah|mulk|wrong|silence|all]
 *
 * What it does:
 *  1. Loads @tilawa/core via its NODE entry (@tilawa/core/node, onnxruntime-node)
 *     — the same engine the browser coach loads via @tilawa/core/web; the
 *     session/tracker/checker code is shared, only the platform loader differs.
 *  2. Downloads REAL professional recitation audio (Mishary Alafasy, reciter 7)
 *     for known passages from verses.quran.com, via the Quran.com API for the
 *     expected Uthmani text — the same sources the coach uses.
 *  3. Converts mp3 -> 16 kHz mono WAV with ffmpeg, feeds it to a declared-
 *     passage (memorization) session in 0.3 s chunks, and records the
 *     word-follow output: which words the tracker observed, which the checker
 *     confirmed as wrong/omitted/skipped.
 *  4. Reports: engine load (time + model id/tier), per-word follow, false-flag
 *     rate on clean professional recitation, wrong-ayah detection, silence
 *     handling, and latency (wall time vs audio duration).
 *
 * False-flag rate definition (clean recitation, everything recited correctly):
 *   flagged = words the checker CONFIRMED wrong/omitted, or words never
 *   observed although later words in the same ayah were observed (missed).
 *   false-flag rate = flagged / total expected words.
 * A word the reciter never reached (trailing words after the audio ends) is
 * NOT a false flag — it is "not reached".
 *
 * Requires: network (tilawa.dev model download once, ~25 MB lite / ~68 MB full,
 * cached in /tmp/tilawa-cache), ffmpeg, Node >= 20.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTilawa, readWav } from '@tilawa/core/node';

const CACHE_DIR = join(tmpdir(), 'tilawa-cache');
const WORK_DIR = join(tmpdir(), 'tilawa-test-audio');
mkdirSync(WORK_DIR, { recursive: true });

const args = process.argv.slice(2);
const tierArg = (args.find((a) => a.startsWith('--tier=')) ?? '--tier=lite').split('=')[1];
const caseArg = (args.find((a) => a.startsWith('--case=')) ?? '--case=all').split('=')[1];
const TIER = tierArg === 'full' ? 'full' : 'lite';

const now = () => performance.now();

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  return res.json();
}

/** Fetch expected Uthmani text + Alafasy audio URLs for a surah range. */
async function fetchPassage(surah, fromAyah, toAyah) {
  const data = await fetchJson(
    `https://api.quran.com/api/v4/verses/by_chapter/${surah}?fields=text_uthmani&audio=7&per_page=${toAyah - fromAyah + 1}&page=1`,
  );
  const verses = (data.verses ?? []).filter(
    (v) => v.verse_number >= fromAyah && v.verse_number <= toAyah,
  );
  if (verses.length !== toAyah - fromAyah + 1) {
    throw new Error(`Expected ${toAyah - fromAyah + 1} verses for ${surah}:${fromAyah}-${toAyah}, got ${verses.length}`);
  }
  return verses.map((v) => ({
    surah,
    ayah: v.verse_number,
    key: v.verse_key,
    text: v.text_uthmani,
    audioUrl: `https://verses.quran.com/${v.audio.url}`,
    wordCount: v.text_uthmani.replace(/\s+/g, ' ').trim().split(' ').length,
  }));
}

/** Download one mp3 and convert to 16 kHz mono WAV; returns wav path + duration. */
async function mp3ToWav(url, outName) {
  const mp3 = join(WORK_DIR, `${outName}.mp3`);
  const wav = join(WORK_DIR, `${outName}.wav`);
  if (!existsSync(mp3)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Audio GET ${url} -> HTTP ${res.status}`);
    writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
  }
  if (!existsSync(wav)) {
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', mp3, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', wav], { stdio: 'pipe' });
  }
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', wav], { encoding: 'utf8' }));
  return { wav, durationSec: Number(probe.format.duration) };
}

/**
 * Score one take: feed decoded audio to a memorization session and summarise
 * the word-follow output. Returns per-word detail for the report.
 */
async function scoreTake(tilawa, { surah, fromAyah, toAyah, expected, audioParts }) {
  const session = tilawa.startMemorization(
    { surah, fromAyah, toAyah },
    { confirm: { after: 'next-word' } },
  );
  const positions = [];
  const checker = [];
  session.subscribe((e) => {
    if (e.type === 'position' && e.observed?.[0]) {
      positions.push({ word: e.observed[0].word, state: e.state, confidence: e.observed[0].confidence, timeMs: e.timeMs });
    } else if (e.type === 'checker') {
      checker.push(e);
    }
  });

  const t0 = now();
  let totalAudioSec = 0;
  for (const part of audioParts) {
    const { samples, sampleRate } = await readWav(part.wav);
    totalAudioSec += samples.length / sampleRate;
    // README chunking: 4800 samples = 0.3 s at 16 kHz.
    for (let i = 0; i < samples.length; i += 4800) {
      await session.pushAudio(samples.subarray(i, i + 4800), sampleRate);
    }
  }
  const feedMs = now() - t0;
  const endT0 = now();
  await session.end();
  const endMs = now() - endT0;
  const wallMs = feedMs + endMs;

  // Per-word summary, mirroring app/hifz/lib/tilawa.ts buildResult() —
  // INCLUDING its false-flag graces (A take-start, B ayah-boundary jump,
  // C short particle), so the measured rate is the shipped rate.
  // H2 (2026-11-27): ONLY locked observations count as reached — an
  // `ambiguous` guess never enters `observed`, so it can never advance
  // the reached frontier or turn an unobserved word into `missed`.
  const observed = new Map();
  const order = [];
  for (const p of positions) {
    if (p.state !== 'locked') continue;
    const k = `${p.word.surah}:${p.word.ayah}:${p.word.word}`;
    if (!observed.has(k)) { observed.set(k, p); order.push(k); }
  }
  const confirmed = checker.filter((c) => c.state === 'confirmed');
  const flagged = new Map();
  for (const c of confirmed) flagged.set(`${c.location.surah}:${c.location.ayah}:${c.location.word}`, c);

  const words = [];
  let correct = 0, missed = 0, wrong = 0, notReached = 0;
  const orderedKeys = [];
  for (const ayah of expected) {
    ayah.text.replace(/\s+/g, ' ').trim().split(' ').forEach((display, i) => {
      orderedKeys.push({ key: `${ayah.surah}:${ayah.ayah}:${i + 1}`, display, ayah: ayah.ayah });
    });
  }
  // "Last reached" counts ONLY expected words: the tracker can follow words
  // outside the declared passage (wrong ayah), and those must not decide
  // which expected words count as missed (same fix as tilawa.ts, 2026-11-21).
  const expectedKeySet = new Set(orderedKeys.map((o) => o.key));
  const reachedInPassage = order.filter((k) => expectedKeySet.has(k));
  const lastReached = reachedInPassage.length ? reachedInPassage[reachedInPassage.length - 1] : null;
  const trackedElsewhere = observed.size > 0 && reachedInPassage.length === 0;
  const noSpeech = observed.size === 0;
  const coverage = orderedKeys.length ? reachedInPassage.length / orderedKeys.length : 0;

  // --- graces (mirror of tilawa.ts) ---
  const orderedIndex = new Map(orderedKeys.map((o, i) => [o.key, i]));
  const observedSet = new Set(reachedInPassage);
  // First LOCKED expected word + whether the tracker ever locked —
  // mirror of tilawa.ts (see its grace comments). Grace A boundary:
  // the first locked word when the take locks, else null — since
  // 2026-11-27 (H3) an `ambiguous` first-observed word is NEVER the
  // boundary: a take that never locks has no anchor and reports
  // `unclear` (all words not-reached) instead.
  let firstLockedIndex = null;
  let everLocked = false;
  for (const p of positions) {
    const k = `${p.word.surah}:${p.word.ayah}:${p.word.word}`;
    if (!expectedKeySet.has(k)) continue;
    if (p.state === 'locked') {
      everLocked = true;
      if (firstLockedIndex === null) firstLockedIndex = orderedIndex.get(k);
    }
  }
  const ayahNums = [...new Set(orderedKeys.map((o) => o.ayah))];
  const ayahFirst = new Map();
  const ayahLast = new Map();
  for (const o of orderedKeys) {
    if (!ayahFirst.has(o.ayah)) ayahFirst.set(o.ayah, o.key);
    ayahLast.set(o.ayah, o.key);
  }
  const normLen = (w) => w.normalize('NFC')
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[ھہ]/g, 'ه').replace(/ے/g, 'ي').replace(/ک/g, 'ك').replace(/ی/g, 'ي')
    .replace(/[^\u0621-\u064A]/g, '').length;
  const graced = new Set();
  const lockBoundary = firstLockedIndex;
  if (lockBoundary !== null) {
    for (let i = 0; i < lockBoundary; i++) graced.add(orderedKeys[i].key);
  }
  for (let ai = 0; ai < ayahNums.length - 1; ai++) {
    const last = ayahLast.get(ayahNums[ai]);
    const nextFirst = ayahFirst.get(ayahNums[ai + 1]);
    if (!observedSet.has(last) && observedSet.has(nextFirst)) graced.add(last);
  }
  const maxGraceLen = everLocked ? 2 : Infinity;
  for (let pass = 0; pass < 3; pass++) {
    let changed = false;
    for (let i = 0; i < orderedKeys.length; i++) {
      const key = orderedKeys[i].key;
      if (observedSet.has(key) || graced.has(key)) continue;
      if (normLen(orderedKeys[i].display) > maxGraceLen) continue;
      const prevOk = i === 0 || observedSet.has(orderedKeys[i - 1].key) || graced.has(orderedKeys[i - 1].key);
      const nextOk = i === orderedKeys.length - 1 || observedSet.has(orderedKeys[i + 1].key) || graced.has(orderedKeys[i + 1].key);
      if (prevOk && nextOk) { graced.add(key); changed = true; }
    }
    if (!changed) break;
  }

  for (const { key, display, ayah } of orderedKeys) {
    const flag = flagged.get(key);
    const seen = observed.has(key);
    let status;
    if (flag) status = flag.errorClass === 'wrong_word' ? 'wrong' : 'missed';
    else if (seen) status = 'correct';
    else if (graced.has(key)) status = 'not-reached';
    else if (lastReached && orderedKeys.findIndex((o) => o.key === key) < orderedKeys.findIndex((o) => o.key === lastReached)) status = 'missed';
    else status = 'not-reached';
    if (status === 'correct') correct++;
    if (status === 'missed') missed++;
    if (status === 'wrong') wrong++;
    if (status === 'not-reached') notReached++;
    words.push({ key, display, ayah, status, confidence: observed.get(key)?.confidence ?? flag?.confidence });
  }
  const total = orderedKeys.length;
  const reached = total - notReached;
  const falseFlags = missed + wrong; // clean recitation: every flag is false
  const unclear = noSpeech || trackedElsewhere || coverage < 0.5 || (reached > 0 && correct / reached < 0.4);
  session.dispose();
  return {
    words, total, correct, missed, wrong, notReached, reached,
    falseFlags, falseFlagRate: total ? falseFlags / total : 0,
    noSpeech, trackedElsewhere, unclear, coverage,
    confirmedMistakes: confirmed.map((c) => ({ class: c.errorClass, location: c.location, confidence: c.confidence })),
    suspectedOnly: checker.filter((c) => c.state !== 'confirmed').length,
    positionEvents: positions.length,
    audioSec: totalAudioSec, wallMs, feedMs, endMs,
    realtimeFactor: totalAudioSec ? wallMs / 1000 / totalAudioSec : 0,
    sessionMs: session.now(),
  };
}

function printResult(label, r) {
  console.log(`\n--- ${label} ---`);
  console.log(`audio: ${r.audioSec.toFixed(2)}s | wall (feed+end): ${(r.wallMs / 1000).toFixed(2)}s | real-time factor: ${r.realtimeFactor.toFixed(2)}x (wall/audio; <1 = faster than real time)`);
  console.log(`words: total=${r.total} correct=${r.correct} missed=${r.missed} wrong=${r.wrong} not-reached=${r.notReached} reached=${r.reached}`);
  console.log(`false-flag rate (clean recitation): ${(r.falseFlagRate * 100).toFixed(1)}% (${r.falseFlags}/${r.total})`);
  console.log(`noSpeech=${r.noSpeech} trackedElsewhere=${r.trackedElsewhere} unclear=${r.unclear} coverage=${(r.coverage * 100).toFixed(0)}%`);
  console.log(`position events: ${r.positionEvents} | confirmed checker mistakes: ${r.confirmedMistakes.length} | suspected/resolved/uncertain (not counted): ${r.suspectedOnly}`);
  if (r.confirmedMistakes.length) console.log('confirmed mistakes:', JSON.stringify(r.confirmedMistakes));
  const bad = r.words.filter((w) => w.status !== 'correct');
  if (bad.length) console.log('non-correct words:', bad.map((w) => `${w.key} "${w.display}"=${w.status}`).join(' | '));
}

// ---------------------------------------------------------------------------
const tLoad0 = now();
console.log(`Loading Tilawa engine (tier=${TIER}, cache=${CACHE_DIR}) ...`);
const tilawa = await createTilawa({ tier: TIER, cacheDir: CACHE_DIR, onProgress: (p) => {
  process.stdout.write(`\r  load ${p.stage}: ${(p.fraction * 100).toFixed(0)}% (${p.loaded}/${p.total} bytes${p.fromCache ? ', cached' : ''})   `);
} });
console.log(`\nENGINE LOADED in ${((now() - tLoad0) / 1000).toFixed(1)}s — model=${tilawa.model.id} version=${tilawa.model.version} tier=${tilawa.model.tier} backend=${tilawa.model.backend}`);
console.log(`capabilities: ${JSON.stringify(tilawa.capabilities?.supported ?? tilawa.capabilities)}`);

const results = {};

if (caseArg === 'all' || caseArg === 'fatihah') {
  console.log('\nCASE A — clean professional recitation: Al-Fatihah 1:1-7 (Alafasy)');
  const verses = await fetchPassage(1, 1, 7);
  const parts = [];
  for (const v of verses) parts.push(await mp3ToWav(v.audioUrl, `fatihah-1-${v.ayah}`));
  const r = await scoreTake(tilawa, { surah: 1, fromAyah: 1, toAyah: 7, expected: verses, audioParts: parts });
  printResult('A: Al-Fatihah 1:1-7 clean', r);
  results.fatihah = r;
}

if (caseArg === 'all' || caseArg === 'mulk') {
  console.log('\nCASE B — clean professional recitation: Al-Mulk 67:1-5 (Alafasy)');
  const verses = await fetchPassage(67, 1, 5);
  const parts = [];
  for (const v of verses) parts.push(await mp3ToWav(v.audioUrl, `mulk-67-${v.ayah}`));
  const r = await scoreTake(tilawa, { surah: 67, fromAyah: 1, toAyah: 5, expected: verses, audioParts: parts });
  printResult('B: Al-Mulk 67:1-5 clean', r);
  results.mulk = r;
}

if (caseArg === 'all' || caseArg === 'wrong') {
  console.log('\nCASE C — deliberately wrong: audio of Al-Fatihah 1:2 fed against expected 1:1 (must flag misses)');
  const verses = await fetchPassage(1, 1, 2);
  const wrongAudio = await mp3ToWav(verses[1].audioUrl, 'fatihah-1-2');
  const r = await scoreTake(tilawa, { surah: 1, fromAyah: 1, toAyah: 1, expected: [verses[0]], audioParts: [wrongAudio] });
  printResult('C: WRONG ayah audio vs expected 1:1 (flags here are CORRECT detections, not false flags)', r);
  console.log(`detection check: correct=${r.correct} of ${r.total} expected words; trackedElsewhere=${r.trackedElsewhere} (tracker followed the recited 1:2 words, none of 1:1) — the engine recognised this was NOT the expected ayah, so the coach must show "that didn't sound like this ayah", not per-word colours.`);
  results.wrong = r;
}

if (caseArg === 'all' || caseArg === 'silence') {
  console.log('\nCASE D — silence (0.5 s of digital silence, expected 1:1)');
  const verses = await fetchPassage(1, 1, 1);
  const silenceWav = join(WORK_DIR, 'silence.wav');
  if (!existsSync(silenceWav)) {
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=16000:cl=mono', '-t', '0.5', '-c:a', 'pcm_s16le', silenceWav], { stdio: 'pipe' });
  }
  const r = await scoreTake(tilawa, { surah: 1, fromAyah: 1, toAyah: 1, expected: verses, audioParts: [{ wav: silenceWav }] });
  printResult('D: silence vs expected 1:1 (expect no-speech: 0 observed, all not-reached)', r);
  results.silence = r;
}

if (caseArg === 'all' || caseArg === 'warmup') {
  console.log('\nCASE E — warm-up: Al-Fatihah 1:1 with 1.5 s leading silence (the realistic mic flow: tap mic, breathe, then recite)');
  const verses = await fetchPassage(1, 1, 1);
  const plain = await mp3ToWav(verses[0].audioUrl, 'fatihah-1-1');
  // Prepend 1.5 s of digital silence to the WAV (chunk-aware: ffmpeg WAVs
  // carry a LIST chunk before `data`, so the data offset is found, not assumed).
  const paddedWav = join(WORK_DIR, 'fatihah-1-1-padded.wav');
  if (!existsSync(paddedWav)) {
    const { readFileSync, writeFileSync } = await import('node:fs');
    const src = readFileSync(plain.wav);
    let i = 12, dataOff = -1, dataSize = 0;
    while (i < src.length) {
      const tag = src.subarray(i, i + 4).toString('latin1');
      const size = src.readUInt32LE(i + 4);
      if (tag === 'data') { dataOff = i + 8; dataSize = size; break; }
      i += 8 + size + (size % 2);
    }
    if (dataOff < 0) throw new Error('No data chunk in WAV');
    const silence = Buffer.alloc(Math.round(16000 * 2 * 1.5));
    const out = Buffer.concat([Buffer.from(src.subarray(0, dataOff)), silence, src.subarray(dataOff, dataOff + dataSize)]);
    out.writeUInt32LE(out.length - 8, 4);
    out.writeUInt32LE(dataSize + silence.length, dataOff - 4);
    writeFileSync(paddedWav, out);
  }
  const r = await scoreTake(tilawa, { surah: 1, fromAyah: 1, toAyah: 1, expected: verses, audioParts: [{ wav: paddedWav }] });
  printResult('E: 1:1 with 1.5 s warm-up silence (expect 4/4 — the tracker needs ~1 s of audio context before the first word)', r);
  results.warmup = r;
}

if (caseArg === 'all' || caseArg === 'single') {
  console.log('\nCASE F — single short ayah, no leading silence: Al-Fatihah 1:1 alone (the most common real coach take — one ayah, tap and recite)');
  const verses = await fetchPassage(1, 1, 1);
  const plain = await mp3ToWav(verses[0].audioUrl, 'fatihah-1-1');
  const r = await scoreTake(tilawa, { surah: 1, fromAyah: 1, toAyah: 1, expected: verses, audioParts: [plain] });
  printResult('F: 1:1 alone, no silence (expect 0/4 + unclear — a single short ayah never locks, so since 2026-11-27/H3 the take is honestly unclear instead of falsely all-correct from ambiguous-only tracking)', r);
  results.single = r;
}

await tilawa.dispose();
console.log('\n=== SUMMARY ===');
for (const [k, r] of Object.entries(results)) {
  console.log(`${k}: total=${r.total} correct=${r.correct} missed=${r.missed} wrong=${r.wrong} not-reached=${r.notReached} false-flag=${(r.falseFlagRate * 100).toFixed(1)}% wall=${(r.wallMs / 1000).toFixed(2)}s audio=${r.audioSec.toFixed(2)}s RT=${r.realtimeFactor.toFixed(2)}x`);
}
console.log('DONE');
