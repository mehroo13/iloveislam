// app/hifz/lib/mushaf-layouts.ts — SERVER-ONLY. Do NOT import this
// from any client component (or from a module a client component
// imports): it reads the ~1 MB per-edition page/line maps from disk
// with `fs`, and the maps must never ship to the browser. The only
// caller is lib/reader-page.ts (server), via the reader-page API
// route. The browser asks for an edition's page through that route.
//
// The maps (app/hifz/data/mushaf-*-layout.json) are NUMBERS ONLY —
// no Quran text is ever pasted into the repo; the Arabic text always
// comes from Quran.com. Each file: {"edition","totalPages",
// "linesPerPage":15,"pageRanges":{"1":["1:1","1:7"],...},
// "surahFirstPage":{"1":1,...},"v1Pages":{"121":[121,122],...},
// "words":{"5:78":[[121,1],...]}} — words keyed by verse "S:A",
// array indexed by word position (0-based), [editionPage, line],
// non-end words only.
//
// Sources (verified 2026-11-25; full log in
// ~/workspace/mushaf-research/LAYOUT_INGESTION.md):
// - 1405 (V1): the Quran.com default — no file; the API data IS the
//   1405 layout, so layoutForEdition returns null for it.
// - 1421 (V2): QPC1/QPC2 per-line dataset (zonetecde/mushaf-layout)
//   + Quran.com word fields v1_page/v2_page, line_v1/line_v2.
// - 1441 (V4): scraped from the public QUL preview pages (id 19).
//   Its own file is written even when its lines prove identical to
//   1421 — that IS the V4 data, not a copy.
// - Indo-Pak (610 pp): scraped from the public QUL preview pages
//   (id 12, "Indopak 15 lines layout").
import fs from 'node:fs';
import path from 'node:path';

import type { MushafEditionId } from './mushaf-edition';
import type { MushafVerse, MushafWord } from './fetch';

export interface EditionLayout {
  edition: MushafEditionId;
  totalPages: number;
  linesPerPage: 15;
  pageRanges: Record<string, [string, string]>;
  surahFirstPage: Record<string, number>;
  /** Edition page -> the V1 (1405) pages whose words supply it. */
  v1Pages: Record<string, number[]>;
  /** Verse "S:A" -> per word position (0-based) [editionPage, line]. */
  words: Record<string, [number, number][]>;
}

const FILE_BY_EDITION: Record<Exclude<MushafEditionId, 'madani-1405'>, string> = {
  'madani-1421': 'mushaf-v2-layout.json',
  'madani-1441': 'mushaf-v4-layout.json',
  indopak: 'mushaf-indopak-layout.json',
};

const cache = new Map<MushafEditionId, EditionLayout>();

function loadLayout(id: Exclude<MushafEditionId, 'madani-1405'>): EditionLayout {
  const hit = cache.get(id);
  if (hit) return hit;
  const file = path.join(process.cwd(), 'app', 'hifz', 'data', FILE_BY_EDITION[id]);
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as EditionLayout;
  cache.set(id, parsed);
  return parsed;
}

/** The edition's layout map, or null for Madani 1405 (the Quran.com
 *  default data IS the 1405 layout — no file needed). */
export function layoutForEdition(id: MushafEditionId): EditionLayout | null {
  if (id === 'madani-1405') return null;
  return loadLayout(id);
}

/** The V1 (1405) pages the reader must fetch to render this edition
 *  page, from the layout's own v1Pages map. */
export function v1PagesForEditionPage(layout: EditionLayout, editionPage: number): number[] {
  const pages = layout.v1Pages[String(editionPage)];
  return Array.isArray(pages) && pages.length > 0 ? pages : [editionPage];
}

/** Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) — the ayah-end rosette number,
 *  matching what Quran.com ships on its own 'end' words. */
function arabicIndic(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}

function verseKeyParts(key: string): [number, number] {
  const [s, a] = key.split(':').map(Number);
  return [s || 0, a || 0];
}

/** Regroup V1 page data into one edition page. `v1PagesData` is the
 *  fetched MushafVerse[] of each covering V1 page (from
 *  v1PagesForEditionPage). Words are re-placed by the layout map:
 *  a word lands on this edition page only when the map says so, on
 *  the map's line. Ayah-end markers are synthesised exactly as
 *  Quran.com ships them (char_type_name 'end', the ayah number in
 *  Arabic-Indic digits, on the line of the ayah's last word) for
 *  every ayah whose LAST word falls on this page — so a split ayah
 *  shows its rosette only on the page where it ends. Verses are
 *  returned in Quran order; a verse with no words on this page is
 *  omitted. */
export function regroupEditionPage(
  layout: EditionLayout,
  editionPage: number,
  v1PagesData: MushafVerse[][],
): MushafVerse[] {
  const byVerse = new Map<string, { verse: MushafVerse; words: MushafWord[] }>();
  for (const pageVerses of v1PagesData) {
    for (const verse of pageVerses) {
      let entry = byVerse.get(verse.verse_key);
      if (!entry) {
        entry = { verse, words: [] };
        byVerse.set(verse.verse_key, entry);
      }
      const map = layout.words[verse.verse_key];
      if (!map) continue;
      for (const w of verse.words) {
        if (w.char_type_name === 'end') continue;
        const pos = map[w.position - 1];
        if (!pos) continue;
        const [ep, el] = pos;
        if (ep !== editionPage) continue;
        entry.words.push({ ...w, page_number: ep, line_number: el });
      }
    }
  }
  const out: MushafVerse[] = [];
  for (const [key, entry] of byVerse) {
    if (entry.words.length === 0) continue;
    const map = layout.words[key];
    const words = [...entry.words].sort((a, b) => a.position - b.position);
    const last = map?.[map.length - 1];
    if (last && last[0] === editionPage) {
      const [, ayah] = verseKeyParts(key);
      words.push({
        text_uthmani: arabicIndic(ayah),
        text_indopak: arabicIndic(ayah),
        line_number: last[1],
        page_number: editionPage,
        position: map.length + 1,
        char_type_name: 'end',
      });
    }
    out.push({ ...entry.verse, words });
  }
  out.sort((a, b) => {
    const [sa, aa] = verseKeyParts(a.verse_key);
    const [sb, ab] = verseKeyParts(b.verse_key);
    return sa - sb || aa - ab;
  });
  return out;
}
