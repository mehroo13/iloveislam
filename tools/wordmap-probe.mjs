/**
 * wordmap-probe.mjs — Phase 3 validation: does Tilawa's WordRef.word
 * index match the adapter's splitWords() indexing on an ayah with
 * pause-mark tokens? Ayah 2:2's Quran.com text contains 'رَيْبَ ۛ'
 * and 'فِيهِ ۛ' — tokens where a pause mark is separated by a space,
 * so splitWords() counts the mark as its own word (9 tokens) while
 * the display has 7 words. If Tilawa counts the mark as part of the
 * word (7 words), the adapter mapping is off by one after the first
 * mark and highlights would land on the wrong words.
 *
 * Runs the NODE engine on real Alafasy audio for 2:2 and prints the
 * observed WordRef sequence with the adapter-style display mapping.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTilawa, readWav } from '@tilawa/core/node';

const CACHE_DIR = join(tmpdir(), 'tilawa-cache');
const WORK_DIR = join(tmpdir(), 'tilawa-wordmap');
mkdirSync(WORK_DIR, { recursive: true });

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  return res.json();
}

const data = await fetchJson(
  'https://api.quran.com/api/v4/verses/by_chapter/2?fields=text_uthmani&audio=7&per_page=1&page=2',
);
const verse = data.verses.find((v) => v.verse_number === 2);
if (!verse) throw new Error('2:2 not found');
const text = verse.text_uthmani;
console.log('2:2 text_uthmani:', JSON.stringify(text));
const tokens = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
console.log('splitWords tokens (%d):', tokens.length);
tokens.forEach((t, i) => console.log(`  ${i + 1}: ${JSON.stringify(t)}`));

const audioUrl = `https://verses.quran.com/${verse.audio.url}`;
const mp3 = join(WORK_DIR, '2-2.mp3');
const wav = join(WORK_DIR, '2-2.wav');
if (!existsSync(mp3)) {
  const res = await fetch(audioUrl);
  if (!res.ok) throw new Error(`Audio GET -> HTTP ${res.status}`);
  writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
}
if (!existsSync(wav)) {
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', mp3, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', wav], { stdio: 'pipe' });
}
console.log('audio ready:', wav);

console.log('Loading Tilawa engine (lite)...');
const tilawa = await createTilawa({ tier: 'lite' });
console.log('engine ready:', tilawa.model.id);

const session = tilawa.startMemorization(
  { surah: 2, fromAyah: 2, toAyah: 2 },
  { confirm: { after: 'next-word' } },
);
const positions = [];
session.subscribe((e) => {
  if (e.type === 'position' && e.observed?.[0]) {
    positions.push({ word: e.observed[0].word, state: e.state, confidence: e.observed[0].confidence });
  }
});

const { samples, sampleRate } = await readWav(wav);
console.log(`feeding ${(samples.length / sampleRate).toFixed(1)}s of audio...`);
for (let i = 0; i < samples.length; i += 4800) {
  await session.pushAudio(samples.subarray(i, i + 4800), sampleRate);
}
await session.end();

const seen = new Map();
for (const p of positions) {
  const k = `${p.word.surah}:${p.word.ayah}:${p.word.word}`;
  if (!seen.has(k)) seen.set(k, p);
}
console.log(`\nobserved WordRefs in first-seen order (${seen.size}):`);
for (const [k, p] of seen) {
  const idx = Number(k.split(':')[2]) - 1;
  const display = tokens[idx] ?? '(OUT OF RANGE)';
  console.log(`  Tilawa ${k} state=${p.state} conf=${p.confidence?.toFixed(2)} -> adapter display ${JSON.stringify(display)}`);
}
session.dispose();
await tilawa.dispose();
console.log('\ndone');
