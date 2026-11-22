#!/usr/bin/env node
/**
 * tools/build-mutashabihat.mjs — derive the "similar verses" (mutashabihat)
 * dataset from the canonical Quran text itself (Stage 5, §12).
 *
 * SOURCE: Quran.com API v4, text_uthmani for all 114 chapters — the exact
 * same canonical text the reader already serves. Nothing is invented: two
 * ayahs are "similar" only when they share verbatim phrases in that text.
 *
 * METHOD (same normalisation as app/hifz/lib/alignment.ts — diacritics
 * stripped, alef/ya/ta-marbuta unified, Indo-Pak variants unified — so
 * the same phrase matches across Uthmani/Indo-Pak spellings):
 *   1. Index every 4-word phrase (and 3-word phrase) of normalised words.
 *   2. Candidate pairs = ayahs sharing >= 1 four-word phrase, or >= 2
 *      three-word phrases. A shared phrase's weight is length x
 *      log(totalAyahs / documentFrequency), so a rare long phrase (e.g.
 *      "inna alladhina amanu wa-alladhina hadu") counts far more than a
 *      common short one (e.g. "wa-allahu ghafoorun raheem" is common).
 *   3. Per ayah keep the top 5 partners by score, with the up-to-3
 *      longest shared phrases (stored as normalised words; the UI matches
 *      them back against the displayed text by normalising it the same way).
 *
 * VERIFICATION: the script asserts known similar pairs and prints
 * coverage; it exits non-zero if a spot check fails. Cross-check: Tarteel's
 * open Quranic Universal Library lists 5,278 similar ayahs — our coverage
 * should be in the same ballpark, not identical (different method).
 *
 * Usage: node tools/build-mutashabihat.mjs
 * Output: public/mutashabihat.json (loaded lazily by SimilarVerses.tsx)
 */
import { writeFileSync } from 'node:fs';

const API = 'https://api.quran.com/api/v4';
const OUT = new URL('../public/mutashabihat.json', import.meta.url);
const TOTAL = 6236;

/* Same normalisation as app/hifz/lib/alignment.ts normalizeArabic(). */
const DIACRITIC_RE = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
const PUNCT_RE =
  /[۝۩ؐ؏ـً-ٰٟۖ-ۭﭐ-﷿ﹰ-ﹴﹶ-ﻼ!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~«»،؛؟٠-٩0-9]/g;
function normalizeArabic(input) {
  let s = input.normalize('NFC').replace(/^\uFEFF/, '');
  s = s.replace(DIACRITIC_RE, '');
  s = s
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ھہ]/g, 'ه')
    .replace(/ے/g, 'ي')
    .replace(/ک/g, 'ك')
    .replace(/ی/g, 'ي');
  s = s.replace(PUNCT_RE, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchChapter(id) {
  const res = await fetch(
    `${API}/verses/by_chapter/${id}?fields=text_uthmani&per_page=all`,
  );
  if (!res.ok) throw new Error(`chapter ${id}: HTTP ${res.status}`);
  const data = await res.json();
  return data.verses ?? [];
}

const ayahs = new Map(); // key -> normalised words
for (let ch = 1; ch <= 114; ch++) {
  const verses = await fetchChapter(ch);
  for (const v of verses) {
    const words = normalizeArabic(v.text_uthmani).split(' ').filter(Boolean);
    ayahs.set(v.verse_key, words);
  }
  if (ch % 20 === 0) console.log(`fetched ${ch}/114 chapters (${ayahs.size} ayahs)`);
  await sleep(60);
}
console.log(`total ayahs: ${ayahs.size}`);
if (ayahs.size !== TOTAL) {
  console.error(`EXPECTED ${TOTAL} ayahs, got ${ayahs.size} — aborting, data incomplete`);
  process.exit(1);
}

/* Phrase index: phrase string -> Set of ayah keys. */
function ngrams(words, n) {
  const out = [];
  for (let i = 0; i + n <= words.length; i++) out.push(words.slice(i, i + n).join(' '));
  return out;
}
const index4 = new Map();
const index3 = new Map();
for (const [key, words] of ayahs) {
  for (const p of new Set(ngrams(words, 4))) {
    if (!index4.has(p)) index4.set(p, new Set());
    index4.get(p).add(key);
  }
  for (const p of new Set(ngrams(words, 3))) {
    if (!index3.has(p)) index3.set(p, new Set());
    index3.get(p).add(key);
  }
}
console.log(`distinct 4-word phrases: ${index4.size}; 3-word phrases: ${index3.size}`);

/* Candidate pairs with shared phrases. */
const pairs = new Map(); // "a|b" -> { a, b, phrases: Map<phrase, len> }
function addPhrase(a, b, phrase) {
  const [x, y] = a < b ? [a, b] : [b, a];
  const k = `${x}|${y}`;
  let pair = pairs.get(k);
  if (!pair) {
    pair = { a: x, b: y, phrases: new Map() };
    pairs.set(k, pair);
  }
  pair.phrases.set(phrase, phrase.split(' ').length);
}
for (const [phrase, keys] of index4) {
  if (keys.size < 2 || keys.size > 40) continue; // >40 = boilerplate, not distinguishing
  const arr = [...keys];
  for (let i = 0; i < arr.length; i++)
    for (let j = i + 1; j < arr.length; j++) addPhrase(arr[i], arr[j], phrase);
}
for (const [phrase, keys] of index3) {
  if (keys.size < 2 || keys.size > 40) continue;
  const arr = [...keys];
  for (let i = 0; i < arr.length; i++)
    for (let j = i + 1; j < arr.length; j++) addPhrase(arr[i], arr[j], phrase);
}

/* Score: shared 4-word phrases dominate; 3-word phrases only count when
 * there are >= 2 of them (a single shared 3-word phrase is too generic).
 * Weight per phrase = length x log(TOTAL / df), df from the 4-gram index
 * where available, else the 3-gram index. */
function df(phrase, len) {
  const idx = len === 4 ? index4 : index3;
  return idx.get(phrase)?.size ?? TOTAL;
}
const byAyah = new Map(); // key -> [{key, score, phrases}]
let pairCount = 0;
for (const pair of pairs.values()) {
  const p4 = [...pair.phrases.entries()].filter(([, len]) => len === 4);
  const p3 = [...pair.phrases.entries()].filter(([, len]) => len === 3);
  if (p4.length === 0 && p3.length < 2) continue;
  let score = 0;
  const kept = [];
  for (const [phrase, len] of [...p4, ...p3]) {
    const w = len * Math.log(TOTAL / df(phrase, len));
    score += w;
    kept.push({ phrase, len, w });
  }
  // Keep the 3 longest (then heaviest) shared phrases for display.
  kept.sort((a, b) => b.len - a.len || b.w - a.w);
  const phrases = kept.slice(0, 3).map((k) => k.phrase.split(' '));
  if (score < 6) continue; // below this, the "similarity" is noise
  pairCount++;
  for (const [me, other] of [[pair.a, pair.b], [pair.b, pair.a]]) {
    if (!byAyah.has(me)) byAyah.set(me, []);
    byAyah.get(me).push({ key: other, score: Math.round(score * 10) / 10, phrases });
  }
}
for (const list of byAyah.values()) {
  list.sort((a, b) => b.score - a.score);
  // Top 8: a famous pair (e.g. 2:62 ↔ 22:17) can legitimately rank 6th
  // behind closer matches — a top-5 cap hid real mutashabihat.
  list.length = Math.min(list.length, 8);
}

const out = {
  version: 1,
  generatedAt: new Date().toISOString(),
  source: 'Quran.com API v4 text_uthmani (all 114 chapters, 6,236 ayahs) — the same canonical text the reader serves.',
  method:
    'Derived from the canonical text: two ayahs are similar only when they share verbatim phrases (a shared 4-word phrase, or 2+ shared 3-word phrases), weighted by phrase rarity. No hand-written pairs, no text search relabelled as similarity.',
  ayahsWithMatches: byAyah.size,
  totalPairs: pairCount,
  byAyah: Object.fromEntries(byAyah),
};
writeFileSync(OUT, JSON.stringify(out));
console.log(`ayahs with matches: ${byAyah.size} / ${TOTAL}; pairs kept: ${pairCount}`);
console.log(`wrote ${OUT.pathname} (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`);

/* Spot checks — well-known mutashabihat pairs. Exit non-zero on failure. */
function partners(key) {
  return new Set((byAyah.get(key) ?? []).map((p) => p.key));
}
const checks = [
  ['2:62', '5:69', 'inna alladhina amanu wa-alladhina hadu'],
  ['2:62', '22:17', 'inna alladhina amanu wa-alladhina hadu'],
  ['5:69', '22:17', 'inna alladhina amanu wa-alladhina hadu'],
  ['2:134', '2:141', 'tilka ummatun qad khalat'],
  ['26:109', '26:127', 'wa-ma asalukum alayhi min ajr'],
  ['26:109', '26:145', 'wa-ma asalukum alayhi min ajr'],
];
let failed = 0;
for (const [a, b, label] of checks) {
  const ok = partners(a).has(b) && partners(b).has(a);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${a} <-> ${b} (${label})`);
  if (!ok) failed++;
}
// Sanity: a famously unique ayah should have no (or very few) partners.
const kursy = partners('2:255');
console.log(`2:255 (Ayat al-Kursi) partners: ${kursy.size} — ${[...kursy].slice(0, 5).join(', ') || 'none'}`);
if (failed > 0) {
  console.error(`${failed} spot check(s) failed — dataset NOT trusted, see above`);
  process.exit(1);
}
console.log('All spot checks passed.');
