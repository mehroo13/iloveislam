// app/hifz/components/ChapterSheet.tsx — Step 2 of the step-by-step
// Tarteel match: the "Surah and Juz Selection" bottom sheet. Opens over
// the Step 1 Mushaf Reader when the central top-bar pill is tapped.
// Bottom sheet (rounded top corners, drag handle) sliding up from below
// the top bar; the overlay dims the reader content while the top bar
// stays undimmed above it (the header is raised to z-50 in
// ReaderScreen while the sheet is open).
// Recently Read card, Chapters / Parts / Bookmarks tabs, sort +
// progress row, the 114 surahs grouped under the Juz where each begins,
// and a sticky 1–30 Juz rail. Tapping a surah closes the sheet and
// jumps the reader to that surah's first page. Row backgrounds follow
// the reference: Juz headers #F0F0F0, the currently open surah #E9E9E9,
// every other surah row white. No "Tarteel" / "Premium" wording.

'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ALL_SURAHS, getSurahById, type HifzSurah } from '../surahs';
import { SURAH_FIRST_PAGE } from '../mushaf';
import { useT } from '../lib/i18n';

type Tab = 'chapters' | 'parts' | 'bookmarks';
type SortDir = 'asc' | 'desc';

const INK = '#111827';
const MUTED = '#6B7280';

function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1FA36B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
function IconBookmarkSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
    </svg>
  );
}
function IconSort() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
      <path d="M12 2.5l5 6.5H7l5-6.5Z" fill="#9CA3AF" />
      <path d="M12 21.5l-5-6.5h10l-5 6.5Z" fill="#9CA3AF" />
    </svg>
  );
}
function IconBrain() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
      <circle cx="10" cy="8" r="4" />
      <path d="M3.5 20c.6-3.2 3.2-5 6.5-5 1.2 0 2.3.2 3.3.7" />
      <path d="M14.5 12.5l2 2 3.5-3.5" />
    </svg>
  );
}

export default function ChapterSheet({
  open,
  onClose,
  currentSurahId,
  currentJuz,
  onSelectSurah,
}: {
  open: boolean;
  onClose: () => void;
  currentSurahId: number;
  currentJuz: number;
  onSelectSurah: (surahId: number) => void;
}) {
  const t = useT();
  const [rendered, setRendered] = useState(open);
  const [shown, setShown] = useState(false);
  const [tab, setTab] = useState<Tab>('chapters');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [lastRead, setLastRead] = useState<HifzSurah | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Mount / slide-up lifecycle: mount, then animate in; on close,
  // animate out and unmount after the transition.
  useEffect(() => {
    if (open) {
      setRendered(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const timer = window.setTimeout(() => setRendered(false), 320);
    return () => window.clearTimeout(timer);
  }, [open ]);

  // Recently Read: the persisted last-read surah, else the surah open in
  // the reader, else Al-Fatihah (the reference default).
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem('ili_last_read_v1');
      if (raw) {
        const parsed = JSON.parse(raw) as { surah?: number };
        const s = typeof parsed?.surah === 'number' ? getSurahById(parsed.surah) : undefined;
        if (s) setLastRead(s);
      }
    } catch {
      /* storage unavailable — fall back below */
    }
  }, [open ]);

  const recentlyRead: HifzSurah = lastRead ?? getSurahById(currentSurahId) ?? getSurahById(1)!;

  const juzOrder = useMemo(
    () =>
      sortDir === 'asc'
        ? Array.from({ length: 30 }, (_, i) => i + 1)
        : Array.from({ length: 30 }, (_, i) => 30 - i),
    [sortDir],
  );

  const jumpToJuz = (n: number) => {
    listRef.current?.querySelector(`#juz-head-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!rendered) return null;

  return (
    <div className="absolute inset-0 z-40">
      {/* Overlay: dims the reader content. The header sits above it
          (z-50 in ReaderScreen while the sheet is open), so the top bar
          stays undimmed. Clicking it closes the sheet. */}
      <button
        type="button"
        aria-label="Close chapter list"
        onClick={onClose}
        className="absolute inset-0 bg-black/25 transition-opacity duration-300"
        style={{ opacity: shown ? 1 : 0 }}
      />
      {/* Sheet: starts just below the top bar, slides up from the bottom. */}
      <div
        role="dialog"
        aria-label="Chapter and Juz Lists"
        className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-[24px] bg-white shadow-2xl transition-transform duration-300 ease-out"
        style={{ top: 76, transform: shown ? 'translateY(0)' : 'translateY(100%)' }}
      >
        {/* Drag handle */}
        <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-[#D1D5DB]" />

        {/* Recently Read */}
        <div className="shrink-0 px-5 pt-3">
          <p className="text-[15px]" style={{ color: MUTED }}>
            {t('rb.list.recentlyRead')}
          </p>
          <button
            type="button"
            onClick={() => onSelectSurah(recentlyRead.id)}
            className="mt-2 flex w-full items-stretch overflow-hidden rounded-xl border border-[#A7E8C8] bg-white text-left shadow-sm"
          >
            <span className="flex items-center gap-3 px-3 py-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8EAED] text-sm font-bold"
                style={{ color: INK }}
              >
                {recentlyRead.id}:1
              </span>
              <span>
                <span className="block text-base font-bold" style={{ color: INK }}>
                  {recentlyRead.name}
                </span>
                <span className="block text-xs" style={{ color: MUTED }}>
                  PG. {SURAH_FIRST_PAGE[recentlyRead.id] ?? 1}
                </span>
              </span>
            </span>
            <span className="ml-auto flex w-12 items-center justify-center bg-[#D9F7E8]">
              <IconChevronRight />
            </span>
          </button>
        </div>

        {/* Title */}
        <p className="shrink-0 px-5 pt-4 text-[17px] font-bold" style={{ color: INK }}>
          {t('rb.list.chapterJuzLists')}
        </p>

        {/* Tabs: Chapters / Parts / Bookmarks — switching the active
            state is visual in this step; the list stays the Chapters
            list for now. */}
        <div className="mt-3 flex shrink-0 gap-2 px-5" role="tablist" aria-label={t('rb.list.chapterJuzLists')}>
          {(
            [
              ['chapters', t('rb.list.tabChapters')],
              ['parts', t('rb.list.tabParts')],
              ['bookmarks', t('rb.list.tabBookmarks')],
            ] as [Tab, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ${
                tab === value
                  ? 'border border-[#111827]/20 bg-white text-[#111827] shadow-sm'
                  : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E8EAED]'
              }`}
            >
              {value === 'bookmarks' && <IconBookmarkSmall />}
              {label}
            </button>
          ))}
        </div>

        {/* Sort + shown-progress row */}
        <div className="mt-4 flex shrink-0 items-start gap-8 px-5">
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            aria-label={sortDir === 'asc' ? 'Sort descending' : 'Sort ascending'}
            className="flex items-start gap-1.5 text-left"
          >
            <IconSort />
            <span className="text-[11px] font-bold uppercase leading-tight tracking-wide" style={{ color: MUTED }}>
              {t('rb.list.sortBy')}
              <span className="block" style={{ color: INK }}>
                {sortDir === 'asc' ? t('rb.list.ascending') : t('rb.list.descending')}
              </span>
            </span>
          </button>
          <div className="flex items-start gap-1.5">
            <IconBrain />
            <span className="text-[11px] font-bold uppercase leading-tight tracking-wide" style={{ color: MUTED }}>
              {t('rb.list.shownProgress')}
              <span className="block" style={{ color: INK }}>
                {t('rb.dash.tabMemorization')}
              </span>
            </span>
          </div>
        </div>

        {/* List + sticky right rail */}
        <div className="relative mt-3 min-h-0 flex-1">
          <div ref={listRef} className="h-full overflow-y-auto overscroll-contain">
            <ul>
              {juzOrder.map((j) => {
                const rows = ALL_SURAHS.filter((s) => s.juz === j);
                const ordered = sortDir === 'asc' ? rows : [...rows].reverse();
                return (
                  <Fragment key={j}>
                    <li
                      id={`juz-head-${j}`}
                      className="scroll-mt-2 bg-[#F0F0F0] px-5 py-1 text-[13px] font-bold"
                      style={{ color: INK }}
                    >
                      Juz {j}
                    </li>
                    {ordered.map((s) => (
                      <li
                        key={s.id}
                        style={{ backgroundColor: s.id === currentSurahId ? '#E9E9E9' : '#FFFFFF' }}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectSurah(s.id)}
                          className="flex w-full items-center gap-3 px-5 py-1 pr-8 text-left"
                        >
                          <span className="w-8 shrink-0 self-start pt-[3px] text-center text-sm font-semibold" style={{ color: INK }}>
                            {s.id}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-bold leading-tight" style={{ color: INK }}>
                              {s.name}
                            </span>
                            <span className="block text-xs leading-snug" style={{ color: MUTED }}>
                              {s.ayahCount} {t('rb.list.verses')}
                              <span className="block">{s.revelation === 'Makki' ? 'Meccan' : 'Medinan'}</span>
                            </span>
                          </span>
                          <span dir="rtl" lang="ar" className="font-quran shrink-0 self-center text-2xl" style={{ color: INK }}>
                            {s.arabic}
                          </span>
                        </button>
                      </li>
                    ))}
                  </Fragment>
                );
              })}
            </ul>
          </div>

          {/* Right-edge Juz rail: 1–30, fixed while the list scrolls.
              The current Juz is bold/dark, the rest light grey. */}
          <nav
            aria-label="Jump to Juz"
            className="absolute bottom-0 right-1 top-0 z-10 flex w-5 flex-col"
          >
            {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => jumpToJuz(n)}
                aria-label={`Jump to Juz ${n}`}
                className={`flex flex-1 items-center justify-center text-[11px] leading-none ${
                  n === currentJuz ? 'font-bold text-[#111827]' : 'text-[#9CA3AF]'
                }`}
              >
                {n}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
