// app/hifz/lib/reader-page.ts — server-side loader for one reader
// page: the mushaf page's verses (Quran.com) + the tajweed edition
// (AlQuran Cloud) for every surah on the page + the top-bar meta
// (surah, page, juz, hizb). Shared by the root page (SSR) and the
// reader-page API route (swipes).

import { fetchMushafPage, type MushafVerse } from './fetch';
import { getSurahById } from '../surahs';
import { fetchTajweedSurah, type TajweedSurah } from './tajweed';

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

export async function fetchReaderPage(n: number): Promise<ReaderPageData> {
  const verses = await fetchMushafPage(n);
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
