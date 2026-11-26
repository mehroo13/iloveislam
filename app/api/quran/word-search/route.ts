// app/api/quran/word-search/route.ts — word search for the reader's
// Search screen (Part 5). Two modes, both edition-aware:
//
//   ?q=<word>&edition=<id>   — ayahs containing the word, each with
//     its mushaf page in the selected edition. Matching is Quran.com
//     v4 search, which matches Arabic words diacritic-insensitively
//     (a typed undiacritized word finds the Uthmani text), and the
//     results are re-ranked exact-word-match first (a result whose
//     matched word carries Quran.com's highlight flag sorts first).
//   ?verse=S:A&edition=<id>  — the mushaf page one ayah starts on,
//     so a "1:4" reference jumps to the ayah itself, not the surah's
//     first page.
//
// Quran text is never pasted into the repo — ayah text comes from
// Quran.com at request time. Page numbers are real: Madani 1405
// takes the verse's own page_number from Quran.com; 1421 / 1441 /
// Indo-Pak take the first word's page from the edition's own layout
// map (server-only numbers, lib/mushaf-layouts.ts).
//
// NOTE: this is NOT /api/quran/search — that path is the same-origin
// proxy the /hifz/search page and voice search already use, and a
// static route here would hijack it. This route lives under its own
// name so the proxy keeps working.
import { NextResponse } from 'next/server';

import { getSurahById } from '@/app/hifz/surahs';
import { layoutForEdition } from '@/app/hifz/lib/mushaf-layouts';
import { mushafEditionById, type MushafEditionId } from '@/app/hifz/lib/mushaf-edition';

const UPSTREAM = 'https://api.quran.com/api/v4';
const SEARCH_TIMEOUT_MS = 12000;
const VERSE_TIMEOUT_MS = 8000;
const MAX_RESULTS = 20;

export interface WordSearchResult {
  verse_key: string;
  surah: number;
  surahName: string;
  ayah: number;
  page: number;
  /** Uthmani ayah text from Quran.com (snippet source for the UI). */
  text: string;
}

async function fetchJson(url: string, timeoutMs: number, revalidate: number): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate },
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

/** The mushaf page an ayah starts on, in the selected edition.
 *  Non-1405 editions: the first word's page in the edition's own
 *  layout map. Madani 1405 (no layout file — the Quran.com default
 *  data IS the 1405 layout): the verse's own page_number. */
async function pageForVerseKey(key: string, edition: MushafEditionId): Promise<number | null> {
  if (edition !== 'madani-1405') {
    const layout = layoutForEdition(edition);
    const map = layout?.words[key];
    if (Array.isArray(map) && map.length > 0 && typeof map[0][0] === 'number') return map[0][0];
    // Fall through to the Quran.com lookup if the map has no entry.
  }
  const data = await fetchJson(
    `${UPSTREAM}/verses/by_key/${encodeURIComponent(key)}?fields=text_uthmani`,
    VERSE_TIMEOUT_MS,
    86400,
  );
  const page = (data as { verse?: { page_number?: number } } | null)?.verse?.page_number;
  return typeof page === 'number' && page >= 1 ? page : null;
}

function parseVerseKey(key: string): { surah: number; ayah: number } | null {
  const m = key.match(/^(\d{1,3}):(\d{1,3})$/);
  if (!m) return null;
  return { surah: Number(m[1]), ayah: Number(m[2]) };
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const edition = mushafEditionById(params.get('edition') as MushafEditionId | null).id;

  // Mode 1: one ayah -> its page.
  const verseParam = params.get('verse')?.trim() ?? '';
  if (verseParam) {
    const parsed = parseVerseKey(verseParam);
    const surah = parsed ? getSurahById(parsed.surah) : undefined;
    if (!parsed || !surah || parsed.ayah < 1 || parsed.ayah > surah.ayahCount) {
      return NextResponse.json({ error: 'verse must be a real reference like 2:255' }, { status: 400 });
    }
    const page = await pageForVerseKey(verseParam, edition);
    if (page === null) {
      return NextResponse.json({ error: 'could not find that ayah' }, { status: 502 });
    }
    const result: WordSearchResult = {
      verse_key: verseParam,
      surah: parsed.surah,
      surahName: surah.name,
      ayah: parsed.ayah,
      page,
      text: '',
    };
    return NextResponse.json({ verse: result });
  }

  // Mode 2: word search.
  const q = params.get('q')?.trim() ?? '';
  if (!q) return NextResponse.json({ query: '', total: 0, results: [] });
  if (q.length > 200) {
    return NextResponse.json({ error: 'search is too long' }, { status: 400 });
  }

  const data = await fetchJson(
    `${UPSTREAM}/search?q=${encodeURIComponent(q)}&size=${MAX_RESULTS}&language=en`,
    SEARCH_TIMEOUT_MS,
    3600,
  );
  const search = (data as { search?: { total_results?: number; results?: unknown[] } } | null)?.search;
  if (!search || !Array.isArray(search.results)) {
    return NextResponse.json(
      { error: 'Word search is unavailable right now — try again in a moment.' },
      { status: 502 },
    );
  }

  type RawResult = {
    verse_key?: string;
    text?: string;
    words?: { highlight?: boolean }[];
  };
  const raw = search.results as RawResult[];

  // Exact-word matches first: Quran.com flags the matched word with
  // highlight=true. Stable sort keeps the upstream order within each
  // group. Dedupe by verse_key, just in case.
  const seen = new Set<string>();
  const ranked = raw
    .filter((r) => typeof r.verse_key === 'string' && !seen.has(r.verse_key) && seen.add(r.verse_key))
    .map((r, i) => ({
      r,
      exact: Array.isArray(r.words) && r.words.some((w) => w.highlight === true),
      i,
    }))
    .sort((a, b) => Number(b.exact) - Number(a.exact) || a.i - b.i)
    .map(({ r }) => r);

  const resolved = await Promise.all(
    ranked.map(async (r) => {
      const key = r.verse_key as string;
      const parsed = parseVerseKey(key);
      const surah = parsed ? getSurahById(parsed.surah) : undefined;
      if (!parsed || !surah) return null;
      const page = await pageForVerseKey(key, edition);
      if (page === null) return null;
      return {
        verse_key: key,
        surah: parsed.surah,
        surahName: surah.name,
        ayah: parsed.ayah,
        page,
        text: String(r.text ?? '').trim(),
      } satisfies WordSearchResult;
    }),
  );
  const results = resolved.filter((r): r is WordSearchResult => r !== null).slice(0, MAX_RESULTS);

  return NextResponse.json({
    query: q,
    total: typeof search.total_results === 'number' ? search.total_results : results.length,
    results,
  });
}
