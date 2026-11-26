// app/hifz/components/ReaderSearch.tsx — Step 3 of the step-by-step
// Tarteel match: the "Search" screen. Full-screen overlay over the
// Step 1 Mushaf Reader, opened from the magnifying-glass icon in the
// top bar. Very light grey background (#F8F8F8), circular back button
// (white, thin grey border, black chevron) top-left, bold "Search"
// top-right, and a bottom row fixed to the bottom: a light-grey pill
// input (exact placeholder "e.g. Al-Fatihah, 1:4, pg 62, ...", green
// caret). The phone's native keyboard is NOT part of the build;
// tapping the input focuses it (and raises the native keyboard on a
// real phone). No "Tarteel" / "Premium" wording.
//
// Alive pass (2026-11-25): the search is REAL. Typing finds surahs
// by name (English or Arabic), a reference like 1:4 (opens the
// surah's first page — the reader has no ayah-to-page map, so the
// result says so), a page like "pg 62", or a Juz like "juz 5".
// Tapping a result jumps the reader straight to that page. The
// voice button is GONE, not dead: voice search needs the coach's
// on-device engine, and the iOS voice-search decision is held —
// a button that does nothing is worse than no button.
//
// Part 5 (2026-11-26): search by ANY WORD. Typing an Arabic word
// (e.g. الرحمن) finds the ayahs containing it — via the new
// /api/quran/word-search route (Quran.com v4 search, matched
// diacritic-insensitively, exact-word matches first), each result
// showing surah + ayah + the ayah's text and jumping the reader to
// that ayah's page in the selected edition. The same route resolves
// a "S:A" reference to the ayah's own page, so 1:4 now opens the
// ayah instead of the surah's first page (the old comment above
// about having no ayah-to-page map is now outdated). Word search is
// debounced (350 ms) so it does not hammer the server per keystroke;
// when it fails it says so honestly and the reference search keeps
// working.
//
// Recent searches (2026-11-26, the "five" build): the shared store
// (app/hifz/lib/recent-searches.ts, cap 25) records a query when the
// user taps a result, and the empty-query view shows the list —
// tapping a row re-runs that query. Shared with the Search hub page
// and Voice Search, so it is one list everywhere.

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_SURAHS, getSurahById } from '../surahs';
import {
  juzFirstPageForEdition,
  surahFirstPageForEdition,
  surahsOnMushafPageForEdition,
} from '../lib/mushaf-surah-pages';
import { totalPagesForEdition, type MushafEditionId } from '../lib/mushaf-edition';
import {
  RECENT_SEARCHES_EVENT,
  clearRecentSearches,
  loadRecentSearches,
  recordRecentSearch,
} from '../lib/recent-searches';

const INK = 'var(--reader-ink)';
const MUTED = 'var(--reader-muted)';

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ stroke: INK }} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M14.5 5.5L8 12l6.5 6.5" />
    </svg>
  );
}
function IconSearchSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ stroke: INK }} strokeWidth="2.4" strokeLinecap="round" className="h-[18px] w-[18px] shrink-0" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  );
}

type SearchResult = {
  key: string;
  label: string;
  sub: string;
  page: number;
};

/** One ayah from /api/quran/word-search (Part 5). */
type WordSearchResult = {
  verse_key: string;
  surah: number;
  surahName: string;
  ayah: number;
  page: number;
  text: string;
};

/** A "S:A" reference, or null. Shared by the sync lookup and the
 *  async ayah-page resolution. */
function parseRef(query: string): { surah: number; ayah: number } | null {
  const ref = query.trim().match(/^(\d{1,3})\s*:\s*(\d{1,3})$/);
  if (!ref) return null;
  return { surah: Number(ref[1]), ayah: Number(ref[2]) };
}

/** True when the query holds Arabic letters — the word-search trigger. */
const HAS_ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

/** Real lookup over the local Quran data — no network, no guessing.
 *  Page numbers are in the SELECTED edition's layout (a surah's
 *  first page and a Juz's first page differ per edition).
 *  `refPage` is the ayah's own page once /api/quran/word-search
 *  has resolved a "S:A" reference (Part 5); until then the result
 *  honestly opens the surah's first page. */
function searchResults(
  raw: string,
  edition: MushafEditionId,
  refPage?: number | null,
): SearchResult[] {
  const query = raw.trim();
  if (!query) return [];
  const lower = query.toLowerCase();
  const surahFirstPage = surahFirstPageForEdition(edition);
  const juzFirstPage = juzFirstPageForEdition(edition);
  const totalPages = totalPagesForEdition(edition);

  // Reference "S:A" — the ayah's own page once resolved (Part 5);
  // until then, the surah's first page, and the result says so.
  const ref = parseRef(query);
  if (ref) {
    const s = getSurahById(ref.surah);
    if (s) {
      const page = refPage ?? surahFirstPage[s.id] ?? 1;
      return [
        {
          key: `ref-${s.id}:${ref.ayah}`,
          label: `${s.name} ${ref.surah}:${ref.ayah}`,
          sub:
            refPage != null
              ? `Ayah ${ref.surah}:${ref.ayah} · Page ${page}`
              : `Opens at the start of ${s.name} · Page ${page}`,
          page,
        },
      ];
    }
    return [];
  }

  // Page: "pg 62" / "page 62".
  const pg = lower.match(/^(?:pg|page)\s*(\d{1,3})$/);
  if (pg) {
    const n = Number(pg[1]);
    if (n >= 1 && n <= totalPages) {
      const names = surahsOnMushafPageForEdition(n, edition)
        .map((id) => getSurahById(id)?.name)
        .filter(Boolean)
        .join(', ');
      return [{ key: `pg-${n}`, label: `Page ${n}`, sub: names || 'Mushaf page', page: n }];
    }
    return [];
  }

  // Juz: "juz 5" / "part 5".
  const juz = lower.match(/^(?:juz|part)\s*(\d{1,2})$/);
  if (juz) {
    const n = Number(juz[1]);
    if (n >= 1 && n <= 30) {
      const page = juzFirstPage[n] ?? 1;
      return [{ key: `juz-${n}`, label: `Juz ${n}`, sub: `Starts on page ${page}`, page }];
    }
    return [];
  }

  // Bare number: a surah number (1–114), else a mushaf page.
  if (/^\d{1,3}$/.test(query)) {
    const n = Number(query);
    if (n >= 1 && n <= 114) {
      const s = getSurahById(n);
      if (s) {
        return [
          {
            key: `surah-${s.id}`,
            label: s.name,
            sub: `${s.ayahCount} verses · Page ${surahFirstPage[s.id] ?? 1}`,
            page: surahFirstPage[s.id] ?? 1,
          },
        ];
      }
    }
    if (n >= 1 && n <= totalPages) {
      return [{ key: `pg-${n}`, label: `Page ${n}`, sub: 'Mushaf page', page: n }];
    }
    return [];
  }

  // Surah name — English or Arabic, partial match, first 8.
  const matches = ALL_SURAHS.filter(
    (s) => s.name.toLowerCase().includes(lower) || s.arabic.includes(query),
  ).slice(0, 8);
  return matches.map((s) => ({
    key: `surah-${s.id}`,
    label: s.name,
    sub: `${s.ayahCount} verses · Page ${surahFirstPage[s.id] ?? 1}`,
    page: surahFirstPage[s.id] ?? 1,
  }));
}

/** First ~80 characters of an ayah, cut at a word boundary. */
function ayahSnippet(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  let out = '';
  for (const w of words) {
    if (out.length > 0 && out.length + 1 + w.length > 80) break;
    out += (out ? ' ' : '') + w;
  }
  return out.length < text.length ? `${out} …` : out;
}

export default function ReaderSearch({
  open,
  onClose,
  onSelectPage,
  edition,
}: {
  open: boolean;
  onClose: () => void;
  /** A result tap jumps the reader to this mushaf page. */
  onSelectPage: (page: number) => void;
  /** The print edition: surah/Juz first pages differ per edition. */
  edition: MushafEditionId;
}) {
  const [rendered, setRendered] = useState(open);
  const [shown, setShown] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  /** Part 5 — word search (async, debounced) and "S:A" page resolution. */
  const [wordResults, setWordResults] = useState<WordSearchResult[]>([]);
  const [wordTotal, setWordTotal] = useState(0);
  const [wordState, setWordState] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');
  const [refPage, setRefPage] = useState<number | null>(null);
  /** Recent searches — the shared store (also used by the Search hub
   *  page and Voice Search), most-recent-first, capped at 25. */
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load the recents on mount and whenever another search surface
  // changes them (hub page, voice search) — no reload needed.
  useEffect(() => {
    setRecentSearches(loadRecentSearches());
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<string[]>).detail;
      if (Array.isArray(next)) setRecentSearches(next);
    };
    window.addEventListener(RECENT_SEARCHES_EVENT, onChange);
    return () => window.removeEventListener(RECENT_SEARCHES_EVENT, onChange);
  }, []);

  /** A result tap is the honest record trigger: the user found what
   *  they wanted and jumped to it. Typing, and the debounced
   *  word-search fetches, are never recorded. */
  const handleSelectPage = (page: number) => {
    const q = query.trim();
    if (q) setRecentSearches(recordRecentSearch(q));
    onSelectPage(page);
  };

  // Mount / fade lifecycle: mount, then fade in; on close, fade out
  // and unmount after the transition.
  useEffect(() => {
    if (open) {
      setRendered(true);
      setQuery('');
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const timer = window.setTimeout(() => setRendered(false), 200);
    return () => window.clearTimeout(timer);
  }, [open ]);

  // Focus the input when the overlay appears, so the native keyboard
  // rises on a real phone (as in the reference screenshot).
  useEffect(() => {
    if (shown) inputRef.current?.focus();
  }, [shown]);

  // Part 5 — async lookups, debounced so typing does not hammer the
  // server. Two independent lookups, each guarded so a stale response
  // (from an older query or edition) never overwrites a newer one:
  // (a) a "S:A" reference resolves to the ayah's own page;
  // (b) a word search runs for Arabic queries, or — as a fallback —
  // for any longer query the local reference search found nothing for
  // (e.g. an English word like "mercy"), but never for pure
  // reference queries (S:A, pg, juz, bare number).
  useEffect(() => {
    const trimmed = query.trim();
    setRefPage(null);
    setWordResults([]);
    setWordTotal(0);
    setWordState('idle');
    if (!trimmed) return;
    let cancelled = false;

    const ref = parseRef(trimmed);
    if (ref) {
      const s = getSurahById(ref.surah);
      if (s && ref.ayah >= 1 && ref.ayah <= s.ayahCount) {
        fetch(
          `/api/quran/word-search?verse=${ref.surah}:${ref.ayah}&edition=${edition}`,
        )
          .then((r) => (r.ok ? r.json() : null))
          .then((d: { verse?: { page?: number } } | null) => {
            if (!cancelled && typeof d?.verse?.page === 'number') setRefPage(d.verse.page);
          })
          .catch(() => {
            /* The surah-start result stays — no fake page. */
          });
      }
      return () => {
        cancelled = true;
      };
    }

    const local = searchResults(trimmed, edition);
    const isReference =
      /^(?:pg|page)\s*\d{1,3}$/i.test(trimmed) ||
      /^(?:juz|part)\s*\d{1,2}$/i.test(trimmed) ||
      /^\d{1,3}$/.test(trimmed);
    const wantsWordSearch = HAS_ARABIC.test(trimmed) || (local.length === 0 && trimmed.length >= 3 && !isReference);
    if (!wantsWordSearch) return;
    setWordState('loading');
    const timer = window.setTimeout(() => {
      fetch(`/api/quran/word-search?q=${encodeURIComponent(trimmed)}&edition=${edition}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((d: { total?: number; results?: WordSearchResult[] }) => {
          if (cancelled) return;
          setWordResults(Array.isArray(d.results) ? d.results : []);
          setWordTotal(typeof d.total === 'number' ? d.total : 0);
          setWordState('done');
        })
        .catch(() => {
          if (!cancelled) setWordState('error');
        });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, edition]);

  const results = useMemo(() => searchResults(query, edition, refPage), [query, edition, refPage]);

  if (!rendered) return null;

  return (
    <div
      role="dialog"
      aria-label="Search"
      className="absolute inset-0 z-[60] flex flex-col transition-opacity duration-200"
      style={{ backgroundColor: 'var(--reader-bg)', opacity: shown ? 1 : 0 }}
    >
      {/* Header: circular back button left, bold "Search" right. */}
      <header className="flex shrink-0 items-center justify-between px-[14px] pt-4">
        <button
          type="button"
          aria-label="Back to reader"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D1D5DB] bg-white"
        >
          <IconChevronLeft />
        </button>
        <p className="text-[20px] font-bold leading-none" style={{ color: INK }}>
          Search
        </p>
      </header>

      {/* Content area: the results, or an honest hint / empty state.
          Reference results first, then Part 5 word-search ayahs. */}
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-4">
        {query.trim() === '' ? (
          <>
            <p className="text-[14px] leading-relaxed" style={{ color: MUTED }}>
              Try a word like الرحمن, a surah name, a reference like 1:4, a page like pg 62, or a
              Juz like juz 5.
            </p>
            {/* Recent searches — only queries the user actually ran and
                tapped a result for. Nothing renders when there is no
                history. Tapping a row re-runs that query. */}
            {recentSearches.length > 0 && (
              <section aria-label="Recent searches" className="mt-5">
                <div className="flex items-center justify-between gap-2 px-1">
                  <h2 className="text-[13px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>
                    Recent searches
                  </h2>
                  <button
                    type="button"
                    onClick={() => setRecentSearches(clearRecentSearches())}
                    className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-[#1FA36B]"
                  >
                    Clear all
                  </button>
                </div>
                <ul className="mt-2 flex flex-col gap-2">
                  {recentSearches.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        dir="auto"
                        onClick={() => setQuery(item)}
                        className="flex w-full items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-left shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                      >
                        <IconSearchSmall />
                        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold" style={{ color: INK }}>
                          {item}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : results.length === 0 && wordResults.length === 0 && wordState !== 'loading' ? (
          wordState === 'error' ? (
            <p className="text-[14px] leading-relaxed" style={{ color: MUTED }}>
              Word search is unavailable right now. Try a surah name, a reference like 1:4, or pg
              62.
            </p>
          ) : (
            <p className="text-[14px] leading-relaxed" style={{ color: MUTED }}>
              No matches for “{query.trim()}”. Try a word like الرحمن, a surah name, a reference
              like 1:4, or pg 62.
            </p>
          )
        ) : (
          <div className="flex flex-col gap-2">
            {results.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => handleSelectPage(r.page)}
                className="flex w-full items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-left shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
              >
                <IconSearchSmall />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold" style={{ color: INK }}>
                    {r.label}
                  </span>
                  <span className="block text-[12px]" style={{ color: MUTED }}>
                    {r.sub}
                  </span>
                </span>
              </button>
            ))}
            {wordState === 'loading' && (
              <p className="px-1 pt-1 text-[13px]" style={{ color: MUTED }}>
                Searching for “{query.trim()}”…
              </p>
            )}
            {wordState === 'error' && results.length > 0 && (
              <p className="px-1 pt-1 text-[13px]" style={{ color: MUTED }}>
                Word search is unavailable right now — showing reference matches only.
              </p>
            )}
            {wordResults.map((w) => (
              <button
                key={`word-${w.verse_key}`}
                type="button"
                onClick={() => handleSelectPage(w.page)}
                className="flex w-full items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-left shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
              >
                <IconSearchSmall />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold" style={{ color: INK }}>
                    {w.surahName} {w.surah}:{w.ayah}
                  </span>
                  {w.text && (
                    <span
                      dir="rtl"
                      lang="ar"
                      className="block truncate text-right text-[14px] leading-relaxed"
                      style={{ color: INK }}
                    >
                      {ayahSnippet(w.text)}
                    </span>
                  )}
                  <span className="block text-[12px]" style={{ color: MUTED }}>
                    Page {w.page}
                  </span>
                </span>
              </button>
            ))}
            {wordState === 'done' && wordTotal > wordResults.length && wordResults.length > 0 && (
              <p className="px-1 pt-1 text-[13px]" style={{ color: MUTED }}>
                Showing {wordResults.length} of {wordTotal} ayahs — type a longer word to narrow it
                down.
              </p>
            )}
          </div>
        )}
      </main>

      {/* Bottom input row: fixed to the bottom, above the keyboard. */}
      <div
        className="fixed inset-x-0 bottom-0 z-[60] px-[14px]"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 min-w-0 flex-1 items-center gap-2.5 rounded-full bg-[#E5E7EB] pl-3 pr-3">
            <IconSearchSmall />
            <input
              ref={inputRef}
              type="text"
              inputMode="search"
              aria-label="Search the Quran"
              placeholder="e.g. الرحمن, Al-Fatihah, 1:4, pg 62"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
              style={{ caretColor: '#22C55E' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
