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

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_SURAHS, getSurahById } from '../surahs';
import { JUZ_FIRST_PAGE, MUSHAF_TOTAL_PAGES, SURAH_FIRST_PAGE, surahsOnMushafPage } from '../mushaf';

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

/** Real lookup over the local Quran data — no network, no guessing. */
function searchResults(raw: string): SearchResult[] {
  const query = raw.trim();
  if (!query) return [];
  const lower = query.toLowerCase();

  // Reference "S:A" — opens the surah's first page (the reader has
  // no ayah-to-page map; the result says so honestly).
  const ref = query.match(/^(\d{1,3})\s*:\s*(\d{1,3})$/);
  if (ref) {
    const s = getSurahById(Number(ref[1]));
    if (s) {
      const page = SURAH_FIRST_PAGE[s.id] ?? 1;
      return [
        {
          key: `ref-${s.id}:${ref[2]}`,
          label: `${s.name} ${ref[1]}:${ref[2]}`,
          sub: `Opens at the start of ${s.name} · Page ${page}`,
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
    if (n >= 1 && n <= MUSHAF_TOTAL_PAGES) {
      const names = surahsOnMushafPage(n)
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
      const page = JUZ_FIRST_PAGE[n] ?? 1;
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
            sub: `${s.ayahCount} verses · Page ${SURAH_FIRST_PAGE[s.id] ?? 1}`,
            page: SURAH_FIRST_PAGE[s.id] ?? 1,
          },
        ];
      }
    }
    if (n >= 1 && n <= MUSHAF_TOTAL_PAGES) {
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
    sub: `${s.ayahCount} verses · Page ${SURAH_FIRST_PAGE[s.id] ?? 1}`,
    page: SURAH_FIRST_PAGE[s.id] ?? 1,
  }));
}

export default function ReaderSearch({
  open,
  onClose,
  onSelectPage,
}: {
  open: boolean;
  onClose: () => void;
  /** A result tap jumps the reader to this mushaf page. */
  onSelectPage: (page: number) => void;
}) {
  const [rendered, setRendered] = useState(open);
  const [shown, setShown] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  const results = useMemo(() => searchResults(query), [query]);

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

      {/* Content area: the results, or an honest hint / empty state. */}
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-4">
        {query.trim() === '' ? (
          <p className="text-[14px] leading-relaxed" style={{ color: MUTED }}>
            Try a surah name, a reference like 1:4, a page like pg 62, or a Juz like juz 5.
          </p>
        ) : results.length === 0 ? (
          <p className="text-[14px] leading-relaxed" style={{ color: MUTED }}>
            No matches for “{query.trim()}”. Try a surah name, a reference like 1:4, or pg 62.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {results.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => onSelectPage(r.page)}
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
              placeholder="e.g. Al-Fatihah, 1:4, pg 62, ..."
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
