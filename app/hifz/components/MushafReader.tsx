// app/hifz/components/MushafReader.tsx — the Mushaf reader (Part 2, §4–6).
//
// All 604 Madani pages in ONE vertically scrollable reader, plus a
// one-page-at-a-time mode. Replaces the old per-page scale + "load the
// next two pages" approach, which only scrolled the current page.
//
// HOW IT WORKS
// - Data: Quran.com verses/by_page through the same-origin proxy
//   (/api/quran/...), the same canonical Madani page/line data the
//   single-page view uses. Every word carries its line_number, so page
//   and line divisions are the printed mushaf's — nothing is re-divided.
// - Rendering: one <MushafPageFrame> per page, mounted only for pages
//   near the viewport (current ±2); every other page is a placeholder
//   div with its measured (or estimated) height, so the scrollbar and
//   scroll position stay stable across all 604 pages without mounting
//   604 heavy frames. Fetched page data is cached in memory and evicted
//   once it is far behind/ahead, so long sessions stay light.
// - Zoom: ONE zoom level for the whole reader, persisted in
//   localStorage. The content column is scaled with CSS `zoom`
//   (fitScale × zoom); zooming never re-flows text, never resets when
//   the page changes, and scrolling keeps working while zoomed. Under
//   CSS `zoom`, offsetHeight / ResizeObserver report UNSCALED layout
//   heights (verified in headless Chrome 2026-11-22), so placeholders
//   use measured heights directly and a zoom change re-anchors the
//   scroll position by the scale ratio.
// - Position: the current page + offset fraction is saved (throttled)
//   to localStorage and restored on the next visit; the URL carries
//   ?page= (replaceState while scrolling, pushState for jumps / page
//   mode) so back/forward and deep links land on the right page.
//   Scroll sync uses history.replaceState, NOT router.replace — the
//   router reset the window scroll to 0 ~400ms after every restore
//   (measured live 2026-11-22), which wiped "pick up where you left
//   off". On a reload the saved position wins over a stale ?page=.
// - Slots use `justify-content: safe center`: the 970px frame centres
//   when it fits and left-aligns (scrollable right) when zoomed past
//   the viewport, so no part of a page is ever unreachable on the left.
'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import MushafPageFrame, { MUSHAF_PAGE_WIDTH } from './MushafPageFrame';
import {
  JUZ_FIRST_PAGE,
  MUSHAF_TOTAL_PAGES,
  SURAH_FIRST_PAGE,
  surahsOnMushafPage,
} from '../mushaf';
import { ALL_SURAHS, getSurahById } from '../surahs';
import { SCRIPT_LABELS, useScriptPref, type QuranScript } from '../lib/script';
import { useT } from '../lib/i18n';
import { TOPICS } from '../topics';
import { loadMistakes, loadProgress, saveProgress, markAttempt, loadSettings, saveSettings } from '../progress';
import { loadBookmarks, saveBookmarks } from '../lib/bookmarks';
import { normalizeArabic } from '../lib/alignment';
import { MODE_EVENT, ayahKeyForRevealedWord, lastReadSlug, loadMode, requestMode, saveMode, type HifzMode } from '../lib/mode';
import SurahList from './SurahList';
import type { MushafVerse } from '../lib/fetch';

const PAGE_QUERY =
  'words=true&word_fields=text_uthmani,text_indopak,line_number,page_number,position,char_type_name&fields=text_uthmani';
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;
/** Unscaled height (px) assumed for a page until it is measured. A full
 *  15-line page is ~1100–1200px at the 970px design width; short pages
 *  are shorter, header pages taller. The estimate only sizes
 *  placeholders — real heights replace it as pages mount, and the
 *  scroll-compensation below absorbs the difference. */
const EST_PAGE_HEIGHT = 1150;
/** Unscaled gap (px) between pages in the continuous list. */
const SLOT_GAP = 24;
/** Pages mounted around the current page (continuous mode). */
const RENDER_BEHIND = 2;
const RENDER_AHEAD = 2;
/** Pages fetched around the current page. */
const FETCH_BEHIND = 2;
const FETCH_AHEAD = 4;
/** Fetched page data is evicted once it is further than this from the
 *  current page (re-fetch is cheap — the proxy caches for 24h). */
const CACHE_RADIUS = 40;
const FETCH_CONCURRENCY = 3;

const POS_KEY = 'ili_mushaf_reader_pos_v1';

type Mode = 'continuous' | 'page';
interface SavedPos {
  page: number;
  mode: Mode;
  zoom: number;
  frac: number;
}

function clampPage(n: number): number {
  return Math.min(MUSHAF_TOTAL_PAGES, Math.max(1, Math.round(n) || 1));
}

/** Juz number for a mushaf page (largest juz whose first page is <= it). */
function juzForPage(page: number): number {
  let juz = 1;
  for (let n = 1; n <= 30; n++) {
    if (JUZ_FIRST_PAGE[n] <= page) juz = n;
  }
  return juz;
}

function readSavedPos(): SavedPos | null {
  try {
    const raw = window.localStorage.getItem(POS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<SavedPos>;
    if (typeof p.page !== 'number') return null;
    return {
      page: clampPage(p.page),
      mode: p.mode === 'page' ? 'page' : 'continuous',
      zoom: typeof p.zoom === 'number' ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, p.zoom)) : 1,
      frac: typeof p.frac === 'number' ? Math.min(1, Math.max(0, p.frac)) : 0,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Reader chrome (Tarteel-clean) — shared with MushafPageView.       */
/*  Top bar: hamburger | centre location pill | bookmark / search /   */
/*  settings. Bottom bar: Mistakes pill, bookmarks, hide toggle and   */
/*  the big green mic orb. No gift icon (that was a Premium afford-   */
/*  ance) and no Tarteel logo, name, artwork or exact text.           */
/* ------------------------------------------------------------------ */

function IconMenu({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function IconBookmark({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 3h12v18l-6-4.5L6 21V3z" />
    </svg>
  );
}
function IconSearch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}
function IconGear({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.89a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87c.26.6.85 1 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconBook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
    </svg>
  );
}
function IconEyeOff({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M17.94 17.94A10.6 10.6 0 0 1 12 19c-7 0-10-7-10-7a17.6 17.6 0 0 1 4.06-4.94M9.9 4.24A9.5 9.5 0 0 1 12 4c7 0 10 7 10 7a17.7 17.7 0 0 1-2.16 3.19M14.12 14.12A3 3 0 1 1 9.88 9.88" />
      <path d="M2 2l20 20" />
    </svg>
  );
}
function IconMic({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 15a3.5 3.5 0 0 0 3.5-3.5v-6a3.5 3.5 0 1 0-7 0v6A3.5 3.5 0 0 0 12 15z" />
      <path d="M19 11.5a7 7 0 0 1-14 0H3.5a8.5 8.5 0 0 0 7.3 8.4V22h2.4v-2.1a8.5 8.5 0 0 0 7.3-8.4H19z" />
    </svg>
  );
}
function IconClose({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function MushafTopBar({
  title,
  subtitle,
  bookmarked,
  bookmarkAria,
  onToggleBookmark,
  onOpenNav,
  onOpenSettings,
}: {
  /** Surah name on the current page (or "Mushaf"). */
  title: string;
  /** "Page N | Juz N" — Hizb is omitted: no hizb dataset exists in the
   *  repo, and the number must not be invented. */
  subtitle: string;
  bookmarked: boolean;
  bookmarkAria: string;
  onToggleBookmark: () => void;
  onOpenNav: () => void;
  onOpenSettings: () => void;
}) {
  const t = useT();
  return (
    <div className="flex items-center gap-1.5 px-2 py-2 sm:gap-2 sm:px-3">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open chapter list"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#102E26] hover:bg-[#F3F4F6]"
      >
        <IconMenu className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open chapter list"
        className="min-w-0 flex-1 rounded-xl bg-[#F3F4F6] px-3 py-1.5 text-center hover:bg-[#EDEEF0]"
      >
        <span className="block truncate text-sm font-bold leading-tight text-[#102E26]">{title}</span>
        <span className="block truncate text-xs leading-tight text-[#5b6b62]">{subtitle}</span>
      </button>
      <button
        type="button"
        onClick={onToggleBookmark}
        aria-pressed={bookmarked}
        aria-label={bookmarkAria}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-[#F3F4F6] ${
          bookmarked ? 'text-[#FFB800]' : 'text-[#102E26]'
        }`}
      >
        <IconBookmark className="h-6 w-6" filled={bookmarked} />
      </button>
      <Link
        href="/hifz/search"
        aria-label="Search"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#102E26] hover:bg-[#F3F4F6]"
      >
        <IconSearch className="h-6 w-6" />
      </Link>
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label={t('reader.readerSettings')}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#102E26] hover:bg-[#F3F4F6]"
      >
        <IconGear className="h-6 w-6" />
      </button>
    </div>
  );
}

export function MushafBottomBar({
  hideActive,
  onToggleHide,
  onMic,
}: {
  hideActive: boolean;
  onToggleHide: () => void;
  /** Starts Recite mode (mic tap = Recite, as in the reference). */
  onMic: () => void;
}) {
  const t = useT();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[76px] z-40">
      <div className="mx-auto flex max-w-5xl items-end justify-between gap-2 px-3 sm:px-4">
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/hifz/my-progress"
            className="inline-flex min-h-11 items-center rounded-full bg-white px-4 py-2 text-sm font-bold text-[#102E26] shadow-md ring-1 ring-[#E5E7EB] hover:bg-[#FFFBF2]"
          >
            Mistakes
          </Link>
          <Link
            href="/hifz/bookmarks"
            aria-label="Bookmarks"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white text-[#102E26] shadow-md ring-1 ring-[#E5E7EB] hover:bg-[#FFFBF2]"
          >
            <IconBook className="h-5 w-5" />
          </Link>
          <button
            type="button"
            onClick={onToggleHide}
            aria-pressed={hideActive}
            aria-label={hideActive ? t('reader.showVerses') : t('reader.hideWords')}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full shadow-md ring-1 ring-[#E5E7EB] hover:bg-[#FFFBF2] ${
              hideActive ? 'bg-[#102E26] text-white' : 'bg-white text-[#102E26]'
            }`}
          >
            <IconEyeOff className="h-5 w-5" />
          </button>
        </div>
        <button
          type="button"
          onClick={onMic}
          aria-label="Recite with the coach"
          className="pointer-events-auto inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4ADE80,#1FA36B_55%,#06B6D4)] text-white shadow-[0_10px_28px_rgba(31,163,107,0.55)] ring-4 ring-white/70 transition-transform hover:scale-105 active:scale-95"
        >
          <IconMic className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
}

/** Slide-over sheet (left = chapter list, right = reader settings). */
export function ReaderSheet({
  open,
  onClose,
  side,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side: 'left' | 'right';
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-label={title} aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/40"
      />
      <div
        className={`absolute inset-y-0 flex w-full max-w-sm flex-col bg-white shadow-xl ${
          side === 'left' ? 'left-0' : 'right-0'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] px-4 py-3">
          <h2 className="min-w-0 truncate text-base font-bold text-[#102E26]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#102E26] hover:bg-[#F3F4F6]"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>
  );
}

const PRACTICE_MODES: HifzMode[] = ['reading', 'recite', 'listen', 'memorise', 'test'];
const MODE_LABEL_KEYS: Record<HifzMode, string> = {
  reading: 'mode.reading',
  recite: 'mode.recite',
  listen: 'mode.listen',
  memorise: 'mode.memorise',
  test: 'mode.test',
};
const MODE_DESC_KEYS: Record<HifzMode, string> = {
  reading: 'mode.descReading',
  recite: 'mode.descRecite',
  listen: 'mode.descListen',
  memorise: 'mode.descMemorise',
  test: 'mode.descTest',
};
const MODE_ICONS: Record<HifzMode, string> = {
  reading: '▤',
  recite: '🎙',
  listen: '♪',
  memorise: '◐',
  test: '✎',
};

/** All five practice modes as a list — the reader's replacement for the
 *  hidden global ModeSwitcher pill (see ModeSwitcher.tsx). The caller
 *  applies the mode in place when it can, else navigates. */
export function PracticeModeList({ onSelect }: { onSelect: (m: HifzMode) => void }) {
  const t = useT();
  const [current, setCurrent] = useState<HifzMode>('reading');
  useEffect(() => {
    setCurrent(loadMode());
    const onMode = (e: Event) => {
      const m = (e as CustomEvent<{ mode: HifzMode }>).detail?.mode;
      if (m) setCurrent(m);
    };
    window.addEventListener(MODE_EVENT, onMode);
    return () => window.removeEventListener(MODE_EVENT, onMode);
  }, []);
  return (
    <ul className="space-y-1">
      {PRACTICE_MODES.map((m) => (
        <li key={m}>
          <button
            type="button"
            onClick={() => onSelect(m)}
            aria-current={current === m}
            className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#FFFBF2] ${
              current === m ? 'bg-[#E4FFF2]' : ''
            }`}
          >
            <span aria-hidden="true" className="mt-0.5 text-lg leading-none">
              {MODE_ICONS[m]}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-sm font-bold text-[#102E26]">
                {t(MODE_LABEL_KEYS[m])}
                {current === m && (
                  <span className="rounded-full bg-[#1FA36B] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {t('mode.current')}
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-[#5b6b62]">
                {t(MODE_DESC_KEYS[m])}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  One slot in the list: a mounted frame, or a sized placeholder.     */
/* ------------------------------------------------------------------ */

const ReaderSlot = memo(function ReaderSlot({
  page,
  verses,
  failed,
  height,
  script,
  compactText,
  topicColors,
  hidden,
  revealed,
  frequentMistakes,
  mistakeMarkingOn,
  tajweedOn,
  registerSlot,
  onRetry,
}: {
  page: number;
  verses: MushafVerse[] | undefined;
  failed: boolean;
  /** Measured unscaled height, or undefined while unmeasured. */
  height: number | undefined;
  script: QuranScript;
  compactText: boolean;
  topicColors: boolean;
  hidden: boolean;
  revealed: number;
  frequentMistakes: ReadonlySet<string>;
  mistakeMarkingOn: boolean;
  tajweedOn: boolean;
  registerSlot: (n: number, el: HTMLDivElement | null) => void;
  onRetry: (n: number) => void;
}) {
  const t = useT();
  // Stable per page: an inline ref would be re-invoked (null, then el)
  // on every parent re-render, churning the ResizeObserver.
  const ref = useCallback((el: HTMLDivElement | null) => registerSlot(page, el), [page, registerSlot]);
  return (
    <div
      ref={ref}
      data-page={page}
      // safe center: the 970px frame centres when it fits and
      // left-aligns (scrollable right) when zoomed past the viewport.
      className="flex"
      style={{ justifyContent: 'safe center', marginBottom: SLOT_GAP }}
    >
      <div style={{ width: MUSHAF_PAGE_WIDTH, flexShrink: 0 }}>
        {verses ? (
          <MushafPageFrame
            page={page}
            verses={verses}
            script={script}
            compactText={compactText}
            topicColors={topicColors}
            hidden={hidden}
            revealed={revealed}
            frequentMistakes={frequentMistakes}
            mistakeMarkingOn={mistakeMarkingOn}
            tajweedOn={tajweedOn}
          />
        ) : failed ? (
          <div className="rounded-2xl border-2 border-[#FFB800] bg-[#FFFBF2] p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-[#102E26]">{t('reader.pageFailed').replace('{page}', String(page))}</p>
            <p className="mt-1 text-xs text-[#5b6b62]">{t('reader.checkConnection')}</p>
            <button
              type="button"
              onClick={() => onRetry(page)}
              className="mt-3 min-h-11 rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white"
            >
              {t('reader.retryPage').replace('{page}', String(page))}
            </button>
          </div>
        ) : (
          // Placeholder: keeps the scrollbar and every page below it in
          // place until the real page mounts. Height is the measured
          // height when known, else the estimate (unscaled — CSS `zoom`
          // on the column scales it visually).
          <div
            style={{ height: height ?? EST_PAGE_HEIGHT }}
            className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
            aria-label={t('reader.loadingAria').replace('{page}', String(page))}
          >
            <div className="mx-auto h-4 w-32 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="mx-auto mt-6 space-y-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-[#E5E7EB]/70" />
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-[#5b6b62]">{t('reader.loadingPage').replace('{page}', String(page))}</p>
          </div>
        )}
      </div>
    </div>
  );
});

/** Unmounted placeholder: measured height when known, else the
 *  estimate. Always rendered, so the scrollbar spans all 604 pages and
 *  every page top is addressable. Memoised with a stable ref for the
 *  same reason as ReaderSlot. */
const PlaceholderSlot = memo(function PlaceholderSlot({
  page,
  height,
  registerSlot,
}: {
  page: number;
  height: number | undefined;
  registerSlot: (n: number, el: HTMLDivElement | null) => void;
}) {
  const ref = useCallback((el: HTMLDivElement | null) => registerSlot(page, el), [page, registerSlot]);
  return (
    <div
      ref={ref}
      data-page={page}
      className="flex"
      style={{ justifyContent: 'safe center', marginBottom: SLOT_GAP }}
    >
      <div style={{ width: MUSHAF_PAGE_WIDTH, flexShrink: 0, height: height ?? EST_PAGE_HEIGHT }} />
    </div>
  );
});

export default function MushafReader() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>('continuous');
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<Map<number, MushafVerse[]>>(() => new Map());
  const [failed, setFailed] = useState<Set<number>>(() => new Set());
  const [heights, setHeights] = useState<Map<number, number>>(() => new Map());
  const [fitScale, setFitScale] = useState(1);
  const [toolbarH, setToolbarH] = useState(60);
  const [navOpen, setNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Reader view state (same preferences as the single-page view).
  const [script, setScript] = useScriptPref();
  const [compactText, setCompactText] = useState(false);
  const [topicColors, setTopicColors] = useState(true);
  const [hideVerses, setHideVerses] = useState(false);
  const [revealedMap, setRevealedMap] = useState<Record<number, number>>({});
  const [peekCount, setPeekCount] = useState(0);
  // Stage 5 (§6): bookmark the current Mushaf page. One list, shared with
  // the bookmarks page — toggling here adds/removes the same entry there.
  const [pageBookmarked, setPageBookmarked] = useState(false);
  useEffect(() => {
    try {
      setPageBookmarked(
        loadBookmarks().some((b) => b.kind === 'page' && b.page === currentPage),
      );
    } catch {
      setPageBookmarked(false);
    }
  }, [currentPage]);
  const togglePageBookmark = useCallback(() => {
    try {
      const list = loadBookmarks();
      const exists = list.some((b) => b.kind === 'page' && b.page === currentPage);
      const next = exists
        ? list.filter((b) => !(b.kind === 'page' && b.page === currentPage))
        : [...list, { kind: 'page' as const, page: currentPage, addedAt: Date.now() }];
      saveBookmarks(next);
      setPageBookmarked(!exists);
    } catch {
      /* storage unavailable — the button just doesn't persist */
    }
  }, [currentPage]);
  // Peek recording (Stage 4): one peek per ayah per page-view, recorded
  // as help-needed (markAttempt 'peek' — streak reset + revision queue).
  const peekedAyahsRef = useRef<Set<string>>(new Set());
  const recordPeek = useCallback((surah: number, ayah: number) => {
    const key = `${surah}:${ayah}`;
    if (peekedAyahsRef.current.has(key)) return;
    peekedAyahsRef.current.add(key);
    try {
      saveProgress(markAttempt(loadProgress(), surah, ayah, 'peek'));
    } catch {
      /* storage unavailable — the reveal still works */
    }
  }, []);
  const recordPeekForPage = useCallback(
    (pageVerses: MushafVerse[] | undefined, revealedIdx: number) => {
      if (!pageVerses) return;
      const hit = ayahKeyForRevealedWord(pageVerses, script, revealedIdx);
      if (hit) recordPeek(hit.surah, hit.ayah);
    },
    [recordPeek, script],
  );
  const recordPeekRestForPage = useCallback(
    (pageVerses: MushafVerse[] | undefined) => {
      if (!pageVerses) return;
      for (const v of pageVerses) {
        const [s, a] = v.verse_key.split(':').map(Number);
        if (Number.isInteger(s) && Number.isInteger(a)) recordPeek(s, a);
      }
    },
    [recordPeek],
  );

  /* Floating mode switcher (Stage 4): Memorise hides the words here,
     Reading shows them again. Recite / Listen / Test are not handled
     here — the switcher navigates to the surah reader or /hifz/test. */
  useEffect(() => {
    const onMode = (e: Event) => {
      const m = (e as CustomEvent<{ mode: HifzMode }>).detail?.mode;
      if (m === 'memorise') {
        e.preventDefault();
        setHideVerses(true);
        setRevealedMap({});
        setPeekCount(0);
        saveMode('memorise');
      } else if (m === 'reading') {
        e.preventDefault();
        setHideVerses(false);
        setRevealedMap({});
        setPeekCount(0);
        saveMode('reading');
      }
    };
    window.addEventListener(MODE_EVENT, onMode);
    return () => window.removeEventListener(MODE_EVENT, onMode);
  }, []);
  const [frequentMistakes, setFrequentMistakes] = useState<ReadonlySet<string>>(() => new Set());
  const [mistakeMarkingOn, setMistakeMarkingOn] = useState(true);
  // Tajweed colours (display only): the existing "Show Tajweed colours"
  // setting, previously applied only on the surah reader — now also here.
  const [tajweedOn, setTajweedOn] = useState(false);
  const toggleTajweed = useCallback(() => {
    setTajweedOn((prev) => {
      const next = !prev;
      try {
        saveSettings({ ...loadSettings(), tajweedColors: next });
      } catch {
        /* storage unavailable — the toggle still applies this session */
      }
      return next;
    });
  }, []);

  // Jump panel state.
  const [jumpPage, setJumpPage] = useState('');
  const [jumpSurah, setJumpSurah] = useState('');
  const [jumpJuz, setJumpJuz] = useState('');
  const [ayahSurah, setAyahSurah] = useState('');
  const [ayahNum, setAyahNum] = useState('');
  const [ayahError, setAyahError] = useState<string | null>(null);
  const [ayahBusy, setAyahBusy] = useState(false);

  // Refs (mirrors for handlers that must not re-subscribe).
  const pagesRef = useRef(pages);
  const failedRef = useRef(failed);
  const heightsRef = useRef(heights);
  const fetchingRef = useRef<Set<number>>(new Set());
  const slotEls = useRef<Map<number, HTMLDivElement>>(new Map());
  const cumRef = useRef<number[]>([]);
  const scaleRef = useRef(1);
  const fitScaleRef = useRef(1);
  const zoomRef = useRef(1);
  const currentPageRef = useRef(1);
  const modeRef = useRef<Mode>('continuous');
  const toolbarHRef = useRef(60);
  const pendingScrollRef = useRef<{ page: number; frac: number } | null>(null);
  // True from mount until the restore scroll has landed and the layout
  // has settled — while true, scroll events must not save/sync, or a
  // stray event at scrollY 0 overwrites the saved spot with page 1.
  const restoringRef = useRef(false);
  const restoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Raw stored position as it was when this session mounted, and the
  // raw string this session last wrote (see savePosition). The pagehide
  // guard uses them to tell a spot this session owns from one written
  // mid-session by something else (another tab, an external write).
  const storedAtMountRef = useRef<string | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRafRef = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const scale = fitScale * zoom;

  /* ------------------------- initial state ------------------------ */
  useEffect(() => {
    try {
      storedAtMountRef.current = window.localStorage.getItem(POS_KEY);
    } catch {
      storedAtMountRef.current = null;
    }
    const saved = readSavedPos();
    const qPage = Number(searchParams.get('page'));
    const qMode = searchParams.get('mode');
    // On a RELOAD the URL's ?page= is stale: it reflects the last
    // scroll sync (400ms debounce, and never on pagehide), while the
    // saved position is written on pagehide too — so the saved spot is
    // fresher. Prefer it on reload; a fresh navigation (deep link)
    // still honours ?page=.
    const navEntry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    const isReload = navEntry?.type === 'reload';
    const fromUrl =
      Number.isInteger(qPage) && qPage >= 1 && qPage <= MUSHAF_TOTAL_PAGES;
    const page = isReload && saved ? saved.page : fromUrl ? qPage : saved?.page ?? 1;
    const nextMode: Mode =
      isReload && saved
        ? saved.mode
        : qMode === 'page' || qMode === 'continuous'
          ? qMode
          : saved?.mode ?? 'continuous';
    const nextZoom = saved?.zoom ?? 1;
    setMode(nextMode);
    modeRef.current = nextMode;
    setZoom(nextZoom);
    zoomRef.current = nextZoom;
    setCurrentPage(page);
    currentPageRef.current = page;
    // A deep link lands at the top of its page; a restore keeps the
    // saved offset within the page.
    pendingScrollRef.current = { page, frac: fromUrl && !isReload ? 0 : saved?.frac ?? 0 };
    restoringRef.current = true;
    try {
      if (searchParams.get('memorize') === '1') setHideVerses(true);
      const raw = localStorage.getItem('ili_hifz_settings_v1');
      if (raw) {
        const parsed = JSON.parse(raw) as {
          mushafLines?: number;
          topicColors?: boolean;
          highlightMistakes?: boolean;
          tajweedColors?: boolean;
        };
        if (parsed.mushafLines === 16) setCompactText(true);
        if (parsed.topicColors === false) setTopicColors(false);
        if (parsed.highlightMistakes === false) setMistakeMarkingOn(false);
        if (parsed.tajweedColors === true) setTajweedOn(true);
      }
    } catch {
      /* defaults */
    }
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------- mistake-history marking -------------------- */
  useEffect(() => {
    if (!mounted) return;
    try {
      if (!mistakeMarkingOn) return;
      const counts = new Map<string, number>();
      for (const m of loadMistakes()) {
        const word = normalizeArabic(m.expected || m.word || '');
        if (!word || typeof m.surah !== 'number' || typeof m.ayah !== 'number') continue;
        const key = `${m.surah}:${m.ayah}:${word}`;
        counts.set(key, (counts.get(key) ?? 0) + Math.max(1, m.attempts || 1));
      }
      const frequent = new Set<string>();
      for (const [key, total] of counts) {
        if (total >= 2) frequent.add(key);
      }
      setFrequentMistakes(frequent);
    } catch {
      /* no marking */
    }
  }, [mounted, mistakeMarkingOn]);

  /* ------------------------- measurements ------------------------- */
  // Fit scale: the 970px frame scaled to the container width.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      // Content width, not clientWidth: the container has px-3/px-4
      // padding, and clientWidth includes it — using it overestimates
      // the fit scale by the padding (24px at 390px wide = 12px of
      // horizontal overflow past the viewport).
      const cs = getComputedStyle(el);
      const w =
        el.clientWidth - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0');
      if (w > 0) {
        const next = Math.min(1, w / MUSHAF_PAGE_WIDTH);
        fitScaleRef.current = next;
        setFitScale((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted]);

  // Toolbar height (the fixed toolbar wraps on narrow screens) — the
  // content spacer below it follows this value.
  useEffect(() => {
    const el = toolbarRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      const h = el.offsetHeight;
      if (h > 0) {
        toolbarHRef.current = h;
        setToolbarH((prev) => (prev === h ? prev : h));
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted, navOpen, settingsOpen]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // Cumulative unscaled page offsets (for the current-page estimate).
  // cum[n] = unscaled offset of the top of page n from the content top.
  useEffect(() => {
    const cum: number[] = new Array(MUSHAF_TOTAL_PAGES + 2).fill(0);
    for (let n = 2; n <= MUSHAF_TOTAL_PAGES + 1; n++) {
      cum[n] = cum[n - 1] + (heightsRef.current.get(n - 1) ?? EST_PAGE_HEIGHT) + SLOT_GAP;
    }
    cumRef.current = cum;
  }, [heights]);

  /* ------------------ slot height observation --------------------- */
  // One ResizeObserver for all slots. A slot's contentRect height is its
  // UNSCALED layout height (verified: `zoom` does not change it), which
  // is exactly what placeholders need. When a page above the viewport
  // mounts with a real height different from its placeholder estimate,
  // the scroll position is adjusted by the difference so the page under
  // the reader's eyes does not move.
  const slotObserverRef = useRef<ResizeObserver | null>(null);
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const n = Number((entry.target as HTMLElement).dataset.page);
        if (!n) continue;
        const h = entry.contentRect.height;
        if (h <= 0) continue;
        const old = heightsRef.current.get(n);
        if (old !== undefined && Math.abs(old - h) < 1) continue;
        heightsRef.current.set(n, h);
        changed = true;
        if (old !== undefined && Math.abs(old - h) >= 2) {
          const rect = (entry.target as HTMLElement).getBoundingClientRect();
          if (rect.bottom < toolbarHRef.current + 4) {
            window.scrollBy(0, (h - old) * scaleRef.current);
          }
        }
      }
      if (changed) setHeights(new Map(heightsRef.current));
    });
    slotObserverRef.current = observer;
    // Observe any slots already registered.
    slotEls.current.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      slotObserverRef.current = null;
    };
  }, [mounted]);

  const registerSlot = useCallback((n: number, el: HTMLDivElement | null) => {
    if (el) {
      slotEls.current.set(n, el);
      slotObserverRef.current?.observe(el);
    } else {
      const prev = slotEls.current.get(n);
      if (prev) slotObserverRef.current?.unobserve(prev);
      slotEls.current.delete(n);
    }
  }, []);

  /* ------------------------- data fetching ------------------------ */
  const fetchPage = useCallback(async (n: number): Promise<void> => {
    if (pagesRef.current.has(n) || fetchingRef.current.has(n)) return;
    fetchingRef.current.add(n);
    try {
      const res = await fetch(`/api/quran/verses/by_page/${n}?${PAGE_QUERY}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const verses = (data?.verses ?? []) as MushafVerse[];
      const next = new Map(pagesRef.current);
      next.set(n, verses);
      // Evict data far from the current page — long sessions stay light.
      const cur = currentPageRef.current;
      for (const key of [...next.keys()]) {
        if (Math.abs(key - cur) > CACHE_RADIUS) next.delete(key);
      }
      pagesRef.current = next;
      setPages(next);
    } catch {
      const nextFailed = new Set(failedRef.current);
      nextFailed.add(n);
      failedRef.current = nextFailed;
      setFailed(nextFailed);
    } finally {
      fetchingRef.current.delete(n);
    }
  }, []);

  const pumpFetches = useCallback(() => {
    const cur = currentPageRef.current;
    const lo = Math.max(1, cur - FETCH_BEHIND);
    const hi = Math.min(MUSHAF_TOTAL_PAGES, cur + FETCH_AHEAD);
    const wanted: number[] = [];
    for (let n = lo; n <= hi; n++) wanted.push(n);
    wanted.sort((a, b) => Math.abs(a - cur) - Math.abs(b - cur));
    let started = 0;
    for (const n of wanted) {
      if (started >= FETCH_CONCURRENCY) break;
      if (pagesRef.current.has(n) || fetchingRef.current.has(n) || failedRef.current.has(n)) continue;
      started++;
      void fetchPage(n);
    }
  }, [fetchPage]);

  useEffect(() => {
    if (!mounted) return;
    pumpFetches();
  }, [mounted, currentPage, mode, pumpFetches]);

  const retryPage = useCallback(
    (n: number) => {
      const nextFailed = new Set(failedRef.current);
      nextFailed.delete(n);
      failedRef.current = nextFailed;
      setFailed(nextFailed);
      void fetchPage(n);
    },
    [fetchPage],
  );

  /* --------------------- position save / restore ------------------ */
  const savePosition = useCallback(() => {
    try {
      const el = slotEls.current.get(currentPageRef.current);
      let frac = 0;
      if (el) {
        const r = el.getBoundingClientRect();
        const h = r.height;
        if (h > 0) frac = Math.min(1, Math.max(0, (toolbarHRef.current - r.top) / h));
      }
      const raw = JSON.stringify({ page: currentPageRef.current, mode: modeRef.current, zoom: zoomRef.current, frac });
      window.localStorage.setItem(POS_KEY, raw);
      lastSavedRef.current = raw;
    } catch {
      /* storage unavailable */
    }
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(savePosition, 800);
  }, [savePosition]);

  const syncUrl = useCallback((push: boolean) => {
    if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
    urlTimerRef.current = setTimeout(() => {
      const url = `/hifz/mushaf?page=${currentPageRef.current}&mode=${modeRef.current}`;
      if (push) {
        router.push(url, { scroll: false });
      } else {
        // Scroll sync must NOT go through the router: router.replace
        // resets the window scroll to 0 (measured live 2026-11-22 —
        // the replace lands ~400ms after the restore scroll and yanks
        // it back to page 1). history.replaceState only rewrites the
        // address bar, so the scroll position is untouched.
        window.history.replaceState(null, '', url);
      }
    }, 400);
  }, [router]);

  // Save on page hide (the reliable moment before the tab goes away).
  // But never clobber a stored spot this session doesn't own: if the
  // stored value changed after mount to something this session never
  // wrote (another tab, or an external write), it is fresher than this
  // session's page — leave it alone. Without this, a session that
  // never moved (e.g. opened at page 1) wipes a newer stored position
  // on unload, and the next visit restarts at page 1.
  useEffect(() => {
    const onHide = () => {
      try {
        const cur = window.localStorage.getItem(POS_KEY);
        if (
          cur !== null &&
          cur !== storedAtMountRef.current &&
          cur !== lastSavedRef.current
        ) {
          return;
        }
      } catch {
        /* fall through and save */
      }
      savePosition();
    };
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, [savePosition]);

  /* ---------------------- current-page tracking ------------------- */
  // Binary search over slot rects (tops are monotonic): ~10 rect reads
  // per scroll frame instead of 604.
  const deriveCurrentPage = useCallback((): number | null => {
    const probeY = toolbarHRef.current + window.innerHeight * 0.25;
    const getTop = (n: number): number | null => {
      const el = slotEls.current.get(n);
      if (!el) return null;
      return el.getBoundingClientRect().top;
    };
    // If the current page still contains the probe point, it stays.
    const curTop = getTop(currentPageRef.current);
    const curEl = slotEls.current.get(currentPageRef.current);
    if (curTop !== null && curEl) {
      const bottom = curTop + curEl.getBoundingClientRect().height;
      if (curTop <= probeY && bottom > probeY) return currentPageRef.current;
    }
    let lo = 1;
    let hi = MUSHAF_TOTAL_PAGES;
    let best = currentPageRef.current;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const top = getTop(mid);
      if (top === null) {
        // Slot not registered (should not happen — all 604 render) —
        // fall back to the cumulative estimate.
        const cum = cumRef.current;
        const origin = slotEls.current.get(1)
          ? slotEls.current.get(1)!.getBoundingClientRect().top + window.scrollY
          : window.scrollY;
        const est = (cum[mid] ?? 0) * scaleRef.current + origin;
        if (est <= window.scrollY + probeY) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
        continue;
      }
      if (top <= probeY) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return best;
  }, []);

  useEffect(() => {
    if (!mounted || modeRef.current !== 'continuous') return;
    const onScroll = () => {
      if (scrollRafRef.current) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = 0;
        // During the restore window, ignore scroll events: the restore
        // scroll itself (and any layout shift while pages mount) must
        // not re-derive the page or overwrite the saved spot.
        if (restoringRef.current) return;
        const next = deriveCurrentPage();
        if (next !== null && next !== currentPageRef.current) {
          currentPageRef.current = next;
          setCurrentPage(next);
        }
        scheduleSave();
        syncUrl(false);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, [mounted, mode, deriveCurrentPage, scheduleSave, syncUrl]);

  /* --------------------------- scrolling -------------------------- */
  const scrollToPageTop = useCallback((n: number, frac: number) => {
    const el = slotEls.current.get(n);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY - toolbarHRef.current - 4;
    window.scrollTo({ top: top + frac * r.height, behavior: 'auto' });
    return true;
  }, []);

  // Pending scroll (restore, jump, mode switch): runs when the target
  // slot exists — placeholders exist immediately, so a jump scrolls at
  // once to the estimated position and the height compensation above
  // keeps it there as real pages mount.
  useEffect(() => {
    if (!mounted) return;
    const pending = pendingScrollRef.current;
    if (!pending) return;
    if (scrollToPageTop(pending.page, pending.frac)) {
      pendingScrollRef.current = null;
      // Let the layout settle (real page heights mounting above the
      // viewport shift offsets) before scroll events may save/sync
      // again — otherwise the restore's own scroll can be overwritten
      // by a page-1 derivation.
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = setTimeout(() => {
        restoringRef.current = false;
      }, 1200);
    }
  }, [mounted, pages, heights, currentPage, mode, scrollToPageTop]);

  const jumpToPage = useCallback(
    (n: number, frac = 0, push = true) => {
      const page = clampPage(n);
      currentPageRef.current = page;
      setCurrentPage(page);
      pendingScrollRef.current = { page, frac };
      setNavOpen(false);
      scheduleSave();
      syncUrl(push);
    },
    [scheduleSave, syncUrl],
  );

  // Browser back/forward: the URL is the source of truth.
  useEffect(() => {
    const onPop = () => {
      const q = new URLSearchParams(window.location.search);
      const p = Number(q.get('page'));
      const m = q.get('mode');
      if (m === 'page' || m === 'continuous') {
        modeRef.current = m;
        setMode(m);
      }
      if (Number.isInteger(p) && p >= 1 && p <= MUSHAF_TOTAL_PAGES) {
        jumpToPage(p, 0, false);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [jumpToPage]);

  /* ------------------------------ zoom ---------------------------- */
  // Re-anchoring runs in a post-commit effect (below): the scroll
  // adjustment must see the NEW layout, and pinch events can batch
  // several zoom changes into one render — the anchor stores the scale
  // the layout had at the last commit, so the ratio stays exact.
  const zoomAnchorRef = useRef<{
    prevScale: number;
    nextScale: number;
    fx: number;
    fy: number;
    sx: number;
    sy: number;
  } | null>(null);

  const applyZoom = useCallback(
    (next: number, focalX?: number, focalY?: number) => {
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
      if (clamped === zoomRef.current) return;
      const prevScale = scaleRef.current;
      // scale = fitScale * zoom; fitScaleRef is always current, even
      // when several pinch moves batch into one render.
      const nextScale = fitScaleRef.current * clamped;
      zoomAnchorRef.current = {
        prevScale,
        nextScale,
        fx: focalX !== undefined ? focalX : window.innerWidth / 2,
        fy: focalY !== undefined ? focalY : window.innerHeight / 2,
        sx: window.scrollX,
        sy: window.scrollY,
      };
      zoomRef.current = clamped;
      setZoom(clamped);
      scheduleSave();
    },
    [scheduleSave],
  );

  // Post-commit re-anchor: the document point under the focal point
  // stays put across the scale change.
  useEffect(() => {
    const anchor = zoomAnchorRef.current;
    if (!anchor) return;
    zoomAnchorRef.current = null;
    if (anchor.prevScale <= 0) return;
    window.scrollTo({
      left: ((anchor.sx + anchor.fx) / anchor.prevScale) * anchor.nextScale - anchor.fx,
      top: ((anchor.sy + anchor.fy) / anchor.prevScale) * anchor.nextScale - anchor.fy,
      behavior: 'auto',
    });
  }, [zoom]);
  const applyZoomRef = useRef(applyZoom);
  useEffect(() => {
    applyZoomRef.current = applyZoom;
  });

  // Pinch-to-zoom (two fingers) and Ctrl+wheel / trackpad pinch, on the
  // reader content. One-finger scrolling stays native (window scroll).
  useEffect(() => {
    const el = contentRef.current;
    if (!el || !mounted) return;
    const pinch = { active: false, d0: 0, z0: 1, cx: 0, cy: 0 };
    const dist = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinch.active = true;
        pinch.d0 = dist(e.touches);
        pinch.z0 = zoomRef.current;
        pinch.cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        pinch.cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pinch.active || e.touches.length !== 2 || pinch.d0 <= 0) return;
      e.preventDefault();
      applyZoomRef.current(pinch.z0 * (dist(e.touches) / pinch.d0), pinch.cx, pinch.cy);
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch.active = false;
    };
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      applyZoomRef.current(zoomRef.current * Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY);
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
    };
  }, [mounted]);

  /* --------------------------- mode switch ------------------------ */
  const switchMode = useCallback(
    (m: Mode) => {
      if (m === modeRef.current) return;
      modeRef.current = m;
      setMode(m);
      // Retain the current Surah / ayah / approximate position: the
      // same page opens in the other mode.
      jumpToPage(currentPageRef.current, 0, true);
      scheduleSave();
    },
    [jumpToPage, scheduleSave],
  );

  // Practice-mode selection from the chapter sheet / mic button — the
  // reader's replacement for the hidden global ModeSwitcher pill. Ask
  // the mounted page to apply it in place first (Memorise / Reading
  // are handled above); otherwise navigate exactly as the switcher did.
  const selectPracticeMode = useCallback(
    (m: HifzMode) => {
      setNavOpen(false);
      if (requestMode(m)) return;
      if (m === 'test') {
        router.push('/hifz/test');
        return;
      }
      if (m === 'reading') return; // already reading, handled in place
      router.push(`/hifz/${lastReadSlug()}?mode=${m}`);
    },
    [router],
  );

  // Page mode: arrow keys turn pages; scroll to the top of the page.
  useEffect(() => {
    if (!mounted || mode !== 'page') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentPage > 1) jumpToPage(currentPage - 1, 0, true);
      if (e.key === 'ArrowRight' && currentPage < MUSHAF_TOTAL_PAGES) jumpToPage(currentPage + 1, 0, true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mounted, mode, currentPage, jumpToPage]);

  /* ------------------------------ jump ---------------------------- */
  const doJumpPage = () => {
    const n = Number(jumpPage);
    if (Number.isInteger(n) && n >= 1 && n <= MUSHAF_TOTAL_PAGES) jumpToPage(n);
  };

  const doJumpAyah = async () => {
    const s = Number(ayahSurah);
    const a = Number(ayahNum);
    const surah = getSurahById(s);
    if (!surah) {
      setAyahError(t('reader.ayahChooseSurah'));
      return;
    }
    if (!Number.isInteger(a) || a < 1 || a > surah.ayahCount) {
      setAyahError(t('reader.ayahCount').replace('{name}', surah.name).replace('{count}', String(surah.ayahCount)));
      return;
    }
    setAyahError(null);
    setAyahBusy(true);
    try {
      const res = await fetch(`/api/quran/verses/by_key/${s}:${a}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const pageNo = Number(data?.verse?.page_number);
      if (!Number.isInteger(pageNo) || pageNo < 1 || pageNo > MUSHAF_TOTAL_PAGES) {
        throw new Error('No page number returned');
      }
      jumpToPage(pageNo);
    } catch {
      setAyahError(t('reader.ayahNotFound'));
    } finally {
      setAyahBusy(false);
    }
  };

  /* ---------------------------- render ---------------------------- */
  const surahsHere = useMemo(
    () => surahsOnMushafPage(currentPage).map(getSurahById).filter((s): s is NonNullable<typeof s> => Boolean(s)),
    [currentPage],
  );
  const juzHere = juzForPage(currentPage);
  const winLo = mode === 'page' ? currentPage : Math.max(1, currentPage - RENDER_BEHIND);
  const winHi = mode === 'page' ? currentPage : Math.min(MUSHAF_TOTAL_PAGES, currentPage + RENDER_AHEAD);
  const pageList = useMemo(() => {
    const out: number[] = [];
    for (let n = 1; n <= MUSHAF_TOTAL_PAGES; n++) out.push(n);
    return out;
  }, []);

  const revealedFor = (n: number) => (hideVerses ? revealedMap[n] ?? 0 : 0);

  return (
    <div data-mushaf-reader className="min-h-screen bg-[#F2F2F2]">
      <h1 className="sr-only">{t('reader.title')}</h1>

      {/* Tarteel-clean top bar: hamburger | centre location pill |
          bookmark / search / settings. No gift icon (Premium affordance).
          Prev/next, jump, mode, zoom, hide and the other toolbar
          functions moved into the chapter sheet / settings sheet below. */}
      <div ref={toolbarRef} className="fixed inset-x-0 top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-5xl">
          <MushafTopBar
            title={surahsHere[0]?.name ?? 'Mushaf'}
            subtitle={`Page ${currentPage} | ${t('reader.juzLabel').replace('{n}', String(juzHere))}`}
            bookmarked={pageBookmarked}
            bookmarkAria={
              pageBookmarked
                ? t('reader.removeBookmarkAria').replace('{n}', String(currentPage))
                : t('reader.bookmarkAria').replace('{n}', String(currentPage))
            }
            onToggleBookmark={togglePageBookmark}
            onOpenNav={() => setNavOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </div>
        <div className="h-0.5 overflow-hidden bg-[#E5E7EB]" aria-hidden="true">
          <div className="h-full bg-[#1FA36B]" style={{ width: `${(currentPage / MUSHAF_TOTAL_PAGES) * 100}%` }} />
        </div>
      </div>

      {/* Chapter / Juz sheet (hamburger + centre pill). Practice modes,
          jump-to (page / surah / juz / ayah), prev/next and the full
          surah list. */}
      <ReaderSheet open={navOpen} onClose={() => setNavOpen(false)} side="left" title="Chapters & Juz">
        <p className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">Practice mode</p>
        <div className="mt-2">
          <PracticeModeList onSelect={selectPracticeMode} />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-[#5b6b62]">{t('reader.jumpTo')}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => jumpToPage(currentPage - 1, 0, true)}
            disabled={currentPage <= 1}
            className="min-h-11 flex-1 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#FFFBF2] disabled:opacity-40"
          >
            ← {t('reader.prev')}
          </button>
          <span className="text-sm font-semibold text-[#102E26]" aria-live="polite">
            {t('reader.pageOf').replace('{page}', String(currentPage)).replace('{total}', String(MUSHAF_TOTAL_PAGES))}
          </span>
          <button
            type="button"
            onClick={() => jumpToPage(currentPage + 1, 0, true)}
            disabled={currentPage >= MUSHAF_TOTAL_PAGES}
            className="min-h-11 flex-1 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#FFFBF2] disabled:opacity-40"
          >
            {t('reader.next')} →
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              doJumpPage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1">
              <label htmlFor="reader-jump-page" className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">
                {t('reader.pageLabel')}
              </label>
              <input
                id="reader-jump-page"
                type="number"
                min={1}
                max={604}
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                placeholder={t('reader.pagePlaceholder')}
                className="mt-1 w-full min-h-11 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#1FA36B]"
              />
            </div>
            <button type="submit" className="min-h-11 rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white">
              {t('reader.go')}
            </button>
          </form>
          <div>
            <label htmlFor="reader-jump-surah" className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">
              {t('reader.surahLabel')}
            </label>
            <select
              id="reader-jump-surah"
              value={jumpSurah}
              onChange={(e) => {
                const id = Number(e.target.value);
                setJumpSurah(e.target.value);
                if (id >= 1 && id <= 114) jumpToPage(SURAH_FIRST_PAGE[id]);
              }}
              className="mt-1 w-full min-h-11 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#1FA36B]"
            >
              <option value="">{t('reader.chooseSurah')}</option>
              {ALL_SURAHS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}. {s.name} ({s.meaning})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="reader-jump-juz" className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">
              {t('reader.juzJumpLabel')}
            </label>
            <select
              id="reader-jump-juz"
              value={jumpJuz}
              onChange={(e) => {
                const j = Number(e.target.value);
                setJumpJuz(e.target.value);
                if (j >= 1 && j <= 30) jumpToPage(JUZ_FIRST_PAGE[j]);
              }}
              className="mt-1 w-full min-h-11 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#1FA36B]"
            >
              <option value="">{t('reader.chooseJuz')}</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                <option key={j} value={j}>
                  {t('reader.juzOption').replace('{j}', String(j)).replace('{p}', String(JUZ_FIRST_PAGE[j]))}
                </option>
              ))}
            </select>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void doJumpAyah();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1">
              <label htmlFor="reader-jump-ayah-surah" className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">
                {t('reader.ayahSurah')}
              </label>
              <select
                id="reader-jump-ayah-surah"
                value={ayahSurah}
                onChange={(e) => {
                  setAyahSurah(e.target.value);
                  setAyahError(null);
                }}
                className="mt-1 w-full min-h-11 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#1FA36B]"
              >
                <option value="">{t('reader.chooseAyahSurah')}</option>
                {ALL_SURAHS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}. {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label htmlFor="reader-jump-ayah-num" className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">
                {t('reader.ayahNum')}
              </label>
              <input
                id="reader-jump-ayah-num"
                type="number"
                min={1}
                value={ayahNum}
                onChange={(e) => {
                  setAyahNum(e.target.value);
                  setAyahError(null);
                }}
                placeholder="#"
                className="mt-1 w-full min-h-11 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#1FA36B]"
              />
            </div>
            <button
              type="submit"
              disabled={ayahBusy}
              className="min-h-11 rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {ayahBusy ? '…' : 'Go'}
            </button>
          </form>
        </div>
        {ayahError && (
          <p role="status" className="mt-2 text-sm text-red-700">
            {ayahError}
          </p>
        )}
        {surahsHere.length > 0 && (
          <div className="mt-4 border-t border-[#E5E7EB] pt-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">{t('reader.onThisPage')}</p>
            <ul className="mt-1 space-y-1 text-sm">
              {surahsHere.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-x-3">
                  <Link href={`/hifz/${s.slug}`} className="font-semibold text-[#1FA36B] hover:underline">
                    Surah {s.name} ({s.meaning})
                  </Link>
                  <Link href={`/hifz/${s.slug}?mode=recite`} className="text-[#5b6b62] hover:underline">
                    {t('reader.reciteCoach')}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-5 border-t border-[#E5E7EB] pt-4">
          <SurahList />
        </div>
      </ReaderSheet>

      {/* Reader settings sheet (gear): mode, zoom, script, text size,
          topic + tajweed colours, hide words. */}
      <ReaderSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} side="right" title={t('reader.readerSettings')}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">{t('reader.readingMode')}</p>
        <div className="mt-2 flex rounded-full border border-[#E5E7EB] bg-white p-0.5" role="group" aria-label={t('reader.readingMode')}>
          {(['continuous', 'page'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              aria-pressed={mode === m}
              className={`min-h-10 flex-1 rounded-full px-3 py-1.5 text-sm font-semibold ${
                mode === m ? 'bg-[#102E26] text-white' : 'text-[#102E26] hover:bg-[#FFFBF2]'
              }`}
            >
              {m === 'continuous' ? t('reader.continuous') : t('reader.pageMode')}
            </button>
          ))}
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-[#5b6b62]">{t('reader.readerZoom')}</p>
        <div className="mt-2 flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white p-0.5" role="group" aria-label={t('reader.readerZoom')}>
          <button
            type="button"
            onClick={() => applyZoom(zoom - ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM}
            aria-label={t('reader.zoomOut')}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-lg font-bold text-[#102E26] hover:bg-[#FFFBF2] disabled:opacity-40"
          >
            −
          </button>
          <span className="w-12 text-center text-sm font-semibold text-[#102E26]" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => applyZoom(zoom + ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM}
            aria-label={t('reader.zoomIn')}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-lg font-bold text-[#102E26] hover:bg-[#FFFBF2] disabled:opacity-40"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => applyZoom(MIN_ZOOM)}
            disabled={zoom === MIN_ZOOM}
            className="min-h-10 flex-1 rounded-full px-3 text-sm font-semibold text-[#102E26] hover:bg-[#FFFBF2] disabled:opacity-40"
          >
            {t('reader.resetZoom')}
          </button>
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-[#5b6b62]">{t('reader.quranScript')}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label={t('reader.quranScript')}>
          {(['indopak', 'uthmani'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScript(s)}
              aria-pressed={script === s}
              className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${
                script === s ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] bg-white text-[#102E26] hover:bg-[#FFFBF2]'
              }`}
            >
              {SCRIPT_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={() => setCompactText((v) => !v)}
            aria-pressed={compactText}
            className={`min-h-11 w-full rounded-full px-4 py-2 text-sm font-semibold ${
              compactText ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] bg-white text-[#102E26] hover:bg-[#FFFBF2]'
            }`}
          >
            {compactText ? t('mpv.compactText') : t('mpv.largeText')}
          </button>
          <button
            type="button"
            onClick={() => setTopicColors((v) => !v)}
            aria-pressed={topicColors}
            className={`min-h-11 w-full rounded-full px-4 py-2 text-sm font-semibold ${
              topicColors ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] bg-white text-[#102E26] hover:bg-[#FFFBF2]'
            }`}
          >
            {topicColors ? t('reader.topicOn') : t('reader.topicOff')}
          </button>
          <button
            type="button"
            onClick={toggleTajweed}
            aria-pressed={tajweedOn}
            className={`min-h-11 w-full rounded-full px-4 py-2 text-sm font-semibold ${
              tajweedOn ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] bg-white text-[#102E26] hover:bg-[#FFFBF2]'
            }`}
          >
            {t('set.tajweedColors')}
          </button>
          <button
            type="button"
            onClick={() => {
              setHideVerses((h) => !h);
              setRevealedMap({});
              setPeekCount(0);
            }}
            aria-pressed={hideVerses}
            className={`min-h-11 w-full rounded-full px-4 py-2 text-sm font-semibold ${
              hideVerses ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] bg-white text-[#102E26] hover:bg-[#FFFBF2]'
            }`}
          >
            {hideVerses ? t('reader.showVerses') : t('reader.hideWords')}
          </button>
        </div>
        {topicColors && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <li
                key={t.id}
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold"
                style={{ borderColor: t.color, color: t.color, background: t.wash }}
                title={t.description}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: t.color }} aria-hidden="true" />
                {t.name}
              </li>
            ))}
          </ul>
        )}
        {tajweedOn && (
          <p className="mt-3 text-xs text-[#5b6b62]">
            Tajweed colours show where a rule applies in the text. They do not check your recitation — this app checks words only, never tajweed. A teacher is still needed for tajweed.
          </p>
        )}
        {mistakeMarkingOn && (
          <p className="mt-3 text-xs text-[#5b6b62]">
            <span className="live-word-wrong font-semibold">{t('mpv.weakLabel')}</span> {t('reader.weakNote')}
          </p>
        )}
        <p className="mt-3 text-xs text-[#5b6b62]">{t('reader.zoomNote')}</p>
        <Link
          href="/hifz/settings"
          className="mt-4 inline-flex min-h-11 items-center rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#FFFBF2]"
        >
          All settings →
        </Link>
      </ReaderSheet>

      {/* Spacer for the fixed toolbar. */}
      <div style={{ height: toolbarH }} aria-hidden="true" />

      {/* Reader content — light-grey app background, white page cards. */}
      <div ref={containerRef} className="mx-auto max-w-5xl bg-[#F2F2F2] px-3 pb-44 pt-4 sm:px-4">
        <div ref={contentRef} style={{ zoom: String(scale), touchAction: 'pan-x pan-y' }}>
          {!mounted ? (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center text-sm text-[#5b6b62]">
              {t('reader.loadingReader')}
            </div>
          ) : (
            pageList.map((n) => {
              const inWindow = n >= winLo && n <= winHi;
              if (!inWindow) {
                return (
                  <PlaceholderSlot
                    key={n}
                    page={n}
                    height={heights.get(n)}
                    registerSlot={registerSlot}
                  />
                );
              }
              return (
                <ReaderSlot
                  key={n}
                  page={n}
                  verses={pages.get(n)}
                  failed={failed.has(n)}
                  height={heights.get(n)}
                  script={script}
                  compactText={compactText}
                  topicColors={topicColors}
                  hidden={hideVerses}
                  revealed={revealedFor(n)}
                  frequentMistakes={frequentMistakes}
                  mistakeMarkingOn={mistakeMarkingOn}
                  tajweedOn={tajweedOn}
                  registerSlot={registerSlot}
                  onRetry={retryPage}
                />
              );
            })
          )}
        </div>
        <p className="mt-2 text-center text-xs text-[#5b6b62]">
          {t('reader.footer')}
        </p>
      </div>

      {/* Peek controls while words are hidden — floating above the
          bottom bar so they are always in reach. */}
      {hideVerses && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[152px] z-40">
          <div className="mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] flex-wrap items-center justify-center gap-2 px-3">
            <button
              type="button"
              onClick={() => {
                recordPeekForPage(pages.get(currentPage), revealedMap[currentPage] ?? 0);
                setRevealedMap((m) => ({ ...m, [currentPage]: (m[currentPage] ?? 0) + 1 }));
                setPeekCount((c) => c + 1);
              }}
              className="pointer-events-auto min-h-11 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#102E26] shadow-md ring-1 ring-[#FFB800] hover:bg-[#FFFBF2]"
            >
              {t('reader.nextWord')}
            </button>
            <button
              type="button"
              onClick={() => {
                recordPeekRestForPage(pages.get(currentPage));
                setRevealedMap((m) => ({ ...m, [currentPage]: 100000 }));
                setPeekCount((c) => c + 1);
              }}
              className="pointer-events-auto min-h-11 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#102E26] shadow-md ring-1 ring-[#FFB800] hover:bg-[#FFFBF2]"
            >
              {t('reader.revealRest')}
            </button>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#5b6b62] shadow-md ring-1 ring-[#E5E7EB]">
              {peekCount === 1
                ? t('reader.peekOne').replace('{n}', String(peekCount)).replace('{page}', String(currentPage))
                : t('reader.peekMany').replace('{n}', String(peekCount)).replace('{page}', String(currentPage))}
            </span>
          </div>
        </div>
      )}

      {/* Bottom bar: Mistakes / bookmarks / hide + the big mic orb. */}
      <MushafBottomBar
        hideActive={hideVerses}
        onToggleHide={() => {
          setHideVerses((h) => !h);
          setRevealedMap({});
          setPeekCount(0);
        }}
        onMic={() => selectPracticeMode('recite')}
      />
    </div>
  );
}
