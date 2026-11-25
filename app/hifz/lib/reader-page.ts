// app/hifz/lib/reader-page.ts — server-side loader for one reader
// page: the mushaf page's verses (Quran.com) + the tajweed edition
// (AlQuran Cloud) for every surah on the page + the top-bar meta
// (surah, page, juz, hizb). Shared by the root page (SSR) and the
// reader-page API route (swipes).

import { fetchMushafPage, type MushafVerse } from './fetch';
import { getSurahById } from '../surahs';
import { fetchTajweedSurah, type TajweedSurah } from './tajweed';
import {
  layoutForEdition,
  regroupEditionPage,
  v1PagesForEditionPage,
} from './mushaf-layouts';
import type { MushafEditionId } from './mushaf-edition';
import { mushafEditionById } from './mushaf-edition';

export interface ReaderPageMeta {
  surahId: number;
  /** English surah name for the top-bar pill, e.g. "Al-Fatihah". */
  surahName: string;
  juz: number;
  hizb: number;
}

export interface ReaderPageData {
  page: number;
  verses: MushafVerse[];
  /** Tajweed data keyed by surah id (a surah is omitted when its
   *  fetch failed — the page then renders that surah black). */
  tajweed: Record<number, TajweedSurah>;
  meta: ReaderPageMeta;
}

/** One mushaf page for the reader (Book or Quran Text mode). `edition`
 *  selects the print: 'madani-1405' reads the Quran.com page as-is
 *  (it IS the 1405 layout); every other edition re-places the words
 *  from its own real page/line map (lib/mushaf-layouts.ts), fetching
 *  the 1–2 V1 pages that supply the edition page. The returned verses
 *  carry the EDITION's page/line numbers, so the renderers
 *  (MushafPageFrame, EditionPreview) need no edition logic — and the
 *  meta (first surah, juz, hizb) comes from the edition page's first
 *  verse. Tajweed colours are fetched per surah as before, for the
 *  surahs on this edition page. An out-of-range page returns an
 *  empty page (verses []) rather than throwing. */
export async function fetchReaderPage(
  n: number,
  edition: MushafEditionId = 'madani-1405',
): Promise<ReaderPageData> {
  const ed = mushafEditionById(edition);
  let verses: MushafVerse[];
  if (n < 1 || n > ed.totalPages) {
    verses = [];
  } else {
    const layout = layoutForEdition(edition);
    if (!layout) {
      verses = await fetchMushafPage(n);
    } else {
      const v1Pages = v1PagesForEditionPage(layout, n);
      const fetched = await Promise.all(v1Pages.map((p) => fetchMushafPage(p)));
      verses = regroupEditionPage(layout, n, fetched);
    }
  }
  const surahIds = [...new Set(verses.map((v) => Number(v.verse_key.split(':')[0])))];
  const tajweed: Record<number, TajweedSurah> = {};
  await Promise.all(
    surahIds.map(async (sid) => {
      try {
        tajweed[sid] = await fetchTajweedSurah(sid);
      } catch {
        // Render that surah uncoloured rather than failing the page.
      }
    }),
  );
  const first = verses[0];
  const firstSurahId = first ? Number(first.verse_key.split(':')[0]) : 1;
  const surah = getSurahById(firstSurahId);
  return {
    page: n,
    verses,
    tajweed,
    meta: {
      surahId: firstSurahId,
      surahName: surah?.name ?? 'Al-Fatihah',
      juz: first?.juz_number ?? 1,
      hizb: first?.hizb_number ?? 1,
    },
  };
}
