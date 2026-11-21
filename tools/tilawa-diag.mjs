// /tmp/tilawa-diag.mjs — diagnostic dump of Tilawa tracker position events.
// Shows exactly which words the tracker observes, when, and in what state,
// so the false-flag cause (take-start / ayah-boundary / short-word) can be
// identified instead of guessed. Read-only against the repo; uses the same
// @tilawa/core/node engine and Alafasy audio as tools/test-tilawa.mjs.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTilawa, readWav } from '@tilawa/core/node';

const CACHE_DIR = join(tmpdir(), 'tilawa-cache');
const WORK_DIR = join(tmpdir(), 'tilawa-test-audio');
mkdirSync(WORK_DIR, { recursive: true });

const SURAH = Number(process.argv[2] ?? 67);
const FROM = Number(process.argv[3] ?? 1);
const TO = Number(process.argv[4] ?? 3);
const TIER = process.argv[5] ?? 'lite';

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  return res.json();
}

const data = await fetchJson(
  `https://api.quran.com/api/v4/verses/by_chapter/${SURAH}?fields=text_uthmani&audio=7&per_page=${TO - FROM + 1}&page=1`,
);
const verses = data.verses.filter((v) => v.verse_number >= FROM && v.verse_number <= TO);
const expected = verses.map((v) => ({
  surah: SURAH, ayah: v.verse_number,
  words: v.text_uthmani.replace(/\s+/g, ' ').trim().split(' '),
}));

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

const tilawa = await createTilawa({ tier: TIER, cacheDir: CACHE_DIR });
console.log(`engine: ${tilawa.model.id} tier=${tilawa.model.tier}`);

const session = tilawa.startMemorization(
  { surah: SURAH, fromAyah: FROM, toAyah: TO },
  { confirm: { after: 'next-word' } },
);
const events = [];
session.subscribe((e) => {
  if (e.type === 'position' && e.observed?.[0]) {
    events.push({ t: e.timeMs, state: e.state, word: `${e.observed[0].word.surah}:${e.observed[0].word.ayah}:${e.observed[0].word.word}`, conf: e.observed[0].confidence });
  } else if (e.type === 'checker') {
    events.push({ t: e.timeMs, state: `checker:${e.state}`, word: `${e.location.surah}:${e.location.ayah}:${e.location.word}`, conf: e.confidence, cls: e.errorClass });
  } else if (e.type === 'position') {
    events.push({ t: e.timeMs, state: `pos:${e.state}`, word: '-', conf: null });
  }
});

let clock = 0;
for (const v of verses) {
  const part = await mp3ToWav(`https://verses.quran.com/${v.audio.url}`, `diag-${SURAH}-${v.verse_number}`);
  const { samples, sampleRate } = await readWav(part.wav);
  console.log(`ayah ${SURAH}:${v.verse_number} audio ${part.durationSec.toFixed(2)}s starts at session clock ${clock.toFixed(2)}s`);
  for (let i = 0; i < samples.length; i += 4800) {
    await session.pushAudio(samples.subarray(i, i + 4800), sampleRate);
  }
  clock += part.durationSec;
}
await session.end();
session.dispose();
await tilawa.dispose();

// Print the event stream, one line per event, with gaps.
console.log('\n--- event stream (t=ms since session start) ---');
let prevT = 0;
for (const ev of events) {
  const gap = ev.t - prevT;
  console.log(`${String(ev.t).padStart(7)} (+${String(gap).padStart(5)}) ${ev.state.padEnd(16)} ${ev.word} conf=${ev.conf?.toFixed(2) ?? '-'}${ev.cls ? ' ' + ev.cls : ''}`);
  prevT = ev.t;
}

// Which expected words were never observed?
const observed = new Set(events.filter((e) => e.word !== '-' && !e.state.startsWith('checker')).map((e) => e.word));
console.log('\n--- expected words never observed ---');
for (const a of expected) {
  a.words.forEach((w, i) => {
    const k = `${a.surah}:${a.ayah}:${i + 1}`;
    if (!observed.has(k)) console.log(`${k} "${w}"`);
  });
}
console.log('DONE');
