// app/hifz/lib/mushaf-surah-pages.ts — CLIENT-SAFE: per-edition
// surah-first-page maps (114 numbers per edition) for the reader's
// Chapter sheet jumps and the current-surah pill. The numbers come
// from the real layout files (app/hifz/data/mushaf-*-layout.json,
// surahFirstPage), extracted into the small
// app/hifz/data/mushaf-surah-pages.json by
// ~/workspace/mushaf-research/gen-surah-pages.py — the big per-word
// maps never ship to the browser. Madani 1405 reuses the generated
// maps in app/hifz/mushaf.ts (the Quran.com default data IS the 1405
// layout).
import { SURAH_FIRST_PAGE as V1_FIRST, JUZ_FIRST_PAGE as V1_JUZ_FIRST } from '../mushaf';
import type { MushafEditionId } from './mushaf-edition';
import { totalPagesForEdition } from './mushaf-edition';
import surahPagesJson from '../data/mushaf-surah-pages.json';

type PageMap = Record<number, number>;

function asPageMap(raw: Record<string, number>): PageMap {
  const out: PageMap = {};
  for (const [k, v] of Object.entries(raw)) out[Number(k)] = v;
  return out;
}

interface EditionPageMaps {
  surahFirstPage: Record<string, number>;
  juzFirstPage: Record<string, number>;
}

function mapsFor(id: MushafEditionId): EditionPageMaps | null {
  const raw = (surahPagesJson as Record<string, EditionPageMaps>)[id];
  return raw ?? null;
}

const FIRST_BY_EDITION: Record<MushafEditionId, PageMap> = {
  'madani-1405': V1_FIRST,
  'madani-1421': asPageMap(mapsFor('madani-1421')?.surahFirstPage ?? {}),
  'madani-1441': asPageMap(mapsFor('madani-1441')?.surahFirstPage ?? {}),
  indopak: asPageMap(mapsFor('indopak')?.surahFirstPage ?? {}),
};

const JUZ_FIRST_BY_EDITION: Record<MushafEditionId, PageMap> = {
  'madani-1405': V1_JUZ_FIRST,
  'madani-1421': asPageMap(mapsFor('madani-1421')?.juzFirstPage ?? {}),
  'madani-1441': asPageMap(mapsFor('madani-1441')?.juzFirstPage ?? {}),
  indopak: asPageMap(mapsFor('indopak')?.juzFirstPage ?? {}),
};

/** First page of each surah (1–114) in an edition's layout. */
export function surahFirstPageForEdition(id: MushafEditionId): PageMap {
  return FIRST_BY_EDITION[id] ?? V1_FIRST;
}

/** First page of each Juz (1–30) in an edition's layout. */
export function juzFirstPageForEdition(id: MushafEditionId): PageMap {
  return JUZ_FIRST_BY_EDITION[id] ?? V1_JUZ_FIRST;
}

/** Last page of each surah (1–114) in an edition's layout — derived
 *  from the first pages (a surah ends the page before the next
 *  surah's first page; surah 114 ends on the edition's last page).
 *  Short surahs can share a first page (113 and 114 both start on
 *  p604 Madani), so a surah's last page is never before its first. */
export function surahLastPageForEdition(id: MushafEditionId): PageMap {
  const first = surahFirstPageForEdition(id);
  const total = totalPagesForEdition(id);
  const out: PageMap = {};
  for (let s = 1; s <= 114; s++) {
    out[s] = s < 114 ? Math.max(first[s], first[s + 1] - 1) : total;
  }
  return out;
}

/** Surahs on a page in an edition's layout (same shape as
 *  mushaf.ts's surahsOnMushafPage, which is the 1405 version). */
export function surahsOnMushafPageForEdition(page: number, id: MushafEditionId): number[] {
  const first = surahFirstPageForEdition(id);
  const last = surahLastPageForEdition(id);
  const ids: number[] = [];
  for (let s = 1; s <= 114; s++) {
    if (page >= first[s] && page <= last[s]) ids.push(s);
  }
  return ids;
}
