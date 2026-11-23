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
// - Listen (word-by-word follow-along): the floating mode switcher's
//   Listen entry plays in place — the selected reciter's continuous
//   ayah audio, page after page, with each word highlighted in the
//   mushaf page from Quran.com `audio.segments` timings. See the Listen
//   engine (after jumpToPage).
// - Tap-a-line translation: with the layer on (settings sheet, off by
//   default), tapping a mushaf line shows its translation — and
//   transliteration (resource 57) when on — in a panel; the page
//   itself is never altered.
'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import MushafPageFrame, { MUSHAF_PAGE_WIDTH } from './MushafPageFrame';
import {
  JUZ_FIRST_PAGE,
  MUSHAF_TOTAL_PAGES,
  surahsOnMushafPage,
} from '../mushaf';
import { getSurahById } from '../surahs';
import { SCRIPT_LABELS, useScriptPref, type QuranScript } from '../lib/script';
import { useT } from '../lib/i18n';
import { loadMistakes, loadProgress, saveProgress, markAttempt, loadSettings, saveSettings } from '../progress';
import { loadBookmarks, saveBookmarks } from '../lib/bookmarks';
import { normalizeArabic } from '../lib/alignment';
import { MODE_EVENT, ayahKeyForRevealedWord, lastReadSlug, loadMode, requestMode, saveListenPosition, saveMode, type HifzMode } from '../lib/mode';
import { AUDIO_BASE, RECITERS, TRANSLATIONS, stripHtml } from '../../quran/lib';
import SurahList from './SurahList';
import type { MushafVerse } from '../lib/fetch';

const PAGE_QUERY_BASE =
  'words=true&word_fields=text_uthmani,text_indopak,line_number,page_number,position,char_type_name&fields=text_uthmani';
/** The page query, with the reciter: `audio=<reciterId>` makes the
 *  by_page endpoint return each verse's `audio.url` plus
 *  `audio.segments` — per-word timings inside the reciter's continuous
 *  ayah audio (see the Listen engine below). */
const pageQuery = (reciterId: number) => `${PAGE_QUERY_BASE}&audio=${reciterId}`;

/** One Quran.com audio segment: [wordIndex0, wordPosition1, startMs,
 *  endMs] — the timings of one word inside its ayah's audio. Verified
 *  live 2026-11-23: every reciter returns one segment per word, in
 *  word order (2:255: 50 segments for 50 words, reciters 2, 3, 7, 12). */
type AudioSegment = [number, number, number, number];
/** MushafVerse plus the reciter audio the by_page endpoint returns when
 *  `audio=<reciterId>` is requested. `audio` is NOT in the shared
 *  MushafVerse type (lib/fetch.ts is outside this worker's files), so
 *  the extension lives here and the fetch casts to it. */
interface MushafVerseWithAudio extends MushafVerse {
  audio?: { url?: string; segments?: AudioSegment[] };
}
/** One playable verse in the Listen queue. */
interface ListenItem {
  key: string;
  url: string;
  segments: AudioSegment[];
  page: number;
}
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
/*  settings. Bottom bar: Mistakes pill, bookmarks, hide toggle,      */
/*  practice-mode picker and the big green mic orb. No gift icon       */
/*  (that was a Premium affordance) and no Tarteel logo, name,         */
/*  artwork or exact text.                                             */
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
        aria-label={t('rb.reader.openChapters')}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#111827] hover:bg-[#F3F4F6]"
      >
        <IconMenu className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={onOpenNav}
        aria-label={t('rb.reader.openChapters')}
        className="min-w-0 flex-1 rounded-xl bg-[#F3F4F6] px-3 py-1.5 text-center hover:bg-[#EDEEF0]"
      >
        <span className="block truncate text-sm font-bold leading-tight text-[#111827]">{title}</span>
        <span className="block truncate text-xs leading-tight text-[#6B7280]">{subtitle}</span>
      </button>
      <button
        type="button"
        onClick={onToggleBookmark}
        aria-pressed={bookmarked}
        aria-label={bookmarkAria}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-[#F3F4F6] ${
          bookmarked ? 'text-[#FFB800]' : 'text-[#111827]'
        }`}
      >
        <IconBookmark className="h-6 w-6" filled={bookmarked} />
      </button>
      <Link
        href="/hifz/search"
        aria-label={t('common.search')}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#111827] hover:bg-[#F3F4F6]"
      >
        <IconSearch className="h-6 w-6" />
      </Link>
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label={t('reader.readerSettings')}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#111827] hover:bg-[#F3F4F6]"
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
  onSelectMode,
}: {
  hideActive: boolean;
  onToggleHide: () => void;
  /** Starts Recite mode (mic tap = Recite, as in the reference). */
  onMic: () => void;
  /** Practice-mode picker (Reading / Recite / Listen / Memorise / Test). */
  onSelectMode?: (m: HifzMode) => void;
}) {
  const t = useT();
  const [modesOpen, setModesOpen] = useState(false);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[76px] z-40">
      <div className="mx-auto flex max-w-5xl items-end justify-between gap-2 px-3 sm:px-4">
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/hifz/my-progress"
            className="inline-flex min-h-11 items-center rounded-full bg-white px-4 py-2 text-sm font-bold text-[#111827] shadow-md ring-1 ring-[#E8EAED] hover:bg-[#F3F4F6]"
          >{t('rb.common.mistakes')}</Link>
          <Link
            href="/hifz/bookmarks"
            aria-label={t('rb.list.tabBookmarks')}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white text-[#111827] shadow-md ring-1 ring-[#E8EAED] hover:bg-[#F3F4F6]"
          >
            <IconBook className="h-5 w-5" />
          </Link>
          <button
            type="button"
            onClick={onToggleHide}
            aria-pressed={hideActive}
            aria-label={hideActive ? t('reader.showVerses') : t('reader.hideWords')}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full shadow-md ring-1 ring-[#E8EAED] hover:bg-[#F3F4F6] ${
              hideActive ? 'bg-[#102E26] text-white' : 'bg-white text-[#111827]'
            }`}
          >
            <IconEyeOff className="h-5 w-5" />
          </button>
          {onSelectMode && (
            <button
              type="button"
              onClick={() => setModesOpen(true)}
              aria-label={t('mode.practiceMode')}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white text-[#111827] shadow-md ring-1 ring-[#E8EAED] hover:bg-[#F3F4F6]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onMic}
          aria-label={t('rb.dash.reciteCoach')}
          className="pointer-events-auto inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4ADE80,#1FA36B_55%,#06B6D4)] text-white shadow-[0_10px_28px_rgba(31,163,107,0.55)] ring-4 ring-white/70 transition-transform hover:scale-105 active:scale-95"
        >
          <IconMic className="h-8 w-8" />
        </button>
      </div>
      {onSelectMode && (
        <ReaderSheet open={modesOpen} onClose={() => setModesOpen(false)} side="right" title={t('mode.practiceMode')}>
          <PracticeModeList
            onSelect={(m) => {
              setModesOpen(false);
              onSelectMode(m);
            }}
          />
        </ReaderSheet>
      )}
    </div>
  );
}

/** Slide-over sheet (left = chapter list, right = reader settings).
 *  `dragHandle` replaces the big title bar with a small centred
 *  drag-handle pill + close button, like Tarteel's bottom sheet — used
 *  by the chapter / juz lists drawer, whose first content is Recently
 *  Read, not a title. */
export function ReaderSheet({
  open,
  onClose,
  side,
  title,
  dragHandle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side: 'left' | 'right';
  title: string;
  dragHandle?: boolean;
  children: React.ReactNode;
}) {
  const t = useT();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-label={title} aria-modal="true">
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/40"
      />
      <div
        className={`absolute inset-y-0 flex w-full max-w-sm flex-col bg-white shadow-xl ${
          side === 'left' ? 'left-0' : 'right-0'
        }`}
      >
        {dragHandle ? (
          <div className="flex items-center justify-between px-4 pb-1 pt-3">
            <span className="w-11 shrink-0" aria-hidden="true" />
            <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-[#D1D5DB]" />
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-[#111827] hover:bg-[#F3F4F6]"
            >
              <IconClose className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 border-b border-[#E8EAED] px-4 py-3">
            <h2 className="min-w-0 truncate text-base font-bold text-[#111827]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#111827] hover:bg-[#F3F4F6]"
            >
              <IconClose className="h-5 w-5" />
            </button>
          </div>
        )}
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
            className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#F3F4F6] ${
              current === m ? 'bg-[#E4FFF2]' : ''
            }`}
          >
            <span aria-hidden="true" className="mt-0.5 text-lg leading-none">
              {MODE_ICONS[m]}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-sm font-bold text-[#111827]">
                {t(MODE_LABEL_KEYS[m])}
                {current === m && (
                  <span className="rounded-full bg-[#1FA36B] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {t('mode.current')}
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-[#6B7280]">
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
  hidden,
  revealed,
  frequentMistakes,
  mistakeMarkingOn,
  tajweedOn,
  activeWord,
  onLineTap,
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
  hidden: boolean;
  revealed: number;
  frequentMistakes: ReadonlySet<string>;
  mistakeMarkingOn: boolean;
  tajweedOn: boolean;
  /** Word-by-word Listen highlight for this page (null elsewhere). */
  activeWord: { verseKey: string; wordIndex: number } | null;
  /** Tap-a-line translation layer (undefined when the layer is off). */
  onLineTap?: (info: { line: number; verses: { key: string; arabic: string }[] }) => void;
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
            hidden={hidden}
            revealed={revealed}
            frequentMistakes={frequentMistakes}
            mistakeMarkingOn={mistakeMarkingOn}
            tajweedOn={tajweedOn}
            activeWord={activeWord}
            onLineTap={onLineTap}
          />
        ) : failed ? (
          <div className="rounded-2xl border-2 border-[#FFB800] bg-[#F4F5F7] p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-[#111827]">{t('reader.pageFailed').replace('{page}', String(page))}</p>
            <p className="mt-1 text-xs text-[#6B7280]">{t('reader.checkConnection')}</p>
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
            className="rounded-2xl border border-[#E8EAED] bg-white p-6 shadow-sm"
            aria-label={t('reader.loadingAria').replace('{page}', String(page))}
          >
            <div className="mx-auto h-4 w-32 animate-pulse rounded bg-[#E8EAED]" />
            <div className="mx-auto mt-6 space-y-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-[#E8EAED]/70" />
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-[#6B7280]">{t('reader.loadingPage').replace('{page}', String(page))}</p>
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
  const [pages, setPages] = useState<Map<number, MushafVerseWithAudio[]>>(() => new Map());
  const [failed, setFailed] = useState<Set<number>>(() => new Set());
  const [heights, setHeights] = useState<Map<number, number>>(() => new Map());
  const [fitScale, setFitScale] = useState(1);
  const [toolbarH, setToolbarH] = useState(60);
  const [navOpen, setNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Reader view state (same preferences as the single-page view).
  const [script, setScript] = useScriptPref();
  const [compactText, setCompactText] = useState(false);
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
     Reading shows them again, and Listen now plays in place too (the
     Listen engine below) — only Recite / Test navigate away, exactly
     as the switcher did. Switching mode stops Listen first (Stage 3
     contract: never abandon playing audio invisibly). */
  useEffect(() => {
    const onMode = (e: Event) => {
      const m = (e as CustomEvent<{ mode: HifzMode }>).detail?.mode;
      if (m === 'memorise') {
        e.preventDefault();
        stopListenRef.current();
        setHideVerses(true);
        setRevealedMap({});
        setPeekCount(0);
        saveMode('memorise');
      } else if (m === 'reading') {
        e.preventDefault();
        stopListenRef.current();
        setHideVerses(false);
        setRevealedMap({});
        setPeekCount(0);
        saveMode('reading');
      } else if (m === 'listen') {
        e.preventDefault();
        startListenRef.current();
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
  // Listen (word-by-word follow-along in the reader): the selected
  // reciter's continuous ayah audio, with per-word timings from
  // Quran.com `audio.segments` driving the in-page highlight.
  const [reciterId, setReciterId] = useState(7);
  const reciterIdRef = useRef(7);
  const [listenActive, setListenActive] = useState(false);
  const [listenPaused, setListenPaused] = useState(false);
  const [listenAyah, setListenAyah] = useState<string | null>(null);
  const [listenPage, setListenPage] = useState(0);
  const [listenNote, setListenNote] = useState('');
  const [activeWord, setActiveWord] = useState<{ verseKey: string; wordIndex: number } | null>(null);
  // Tap-a-line translation layer (off by default): the translation is
  // the shared settings translation (the same 104 the surah reader
  // uses); transliteration is Quran.com resource 57, fetched alongside
  // it. Nothing is rendered into the mushaf page — the translation
  // appears in a panel below the reader instead.
  const [mushafTranslationId, setMushafTranslationId] = useState(20);
  const mushafTranslationIdRef = useRef(20);
  const [tapTransOn, setTapTransOn] = useState(false);
  const [showTranslit, setShowTranslit] = useState(false);
  const showTranslitRef = useRef(false);
  const [transPanel, setTransPanel] = useState<{ verses: { key: string; arabic: string }[] } | null>(null);
  const [transData, setTransData] = useState<
    Map<string, { translation: string; transliteration: string; failed: boolean }>
  >(() => new Map());
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

  // (Jump-to-page/surah/juz/ayah used to live in the chapter sheet;
  // the sheet is lists-only now — see the chapter sheet below.)

  // Refs (mirrors for handlers that must not re-subscribe).
  const pagesRef = useRef(pages);
  const failedRef = useRef(failed);
  const heightsRef = useRef(heights);
  // Listen engine refs (see the engine after jumpToPage): the queue,
  // the run (current page + a page being waited on), the verse now
  // sounding (for segment lookup on timeupdate), the last highlighted
  // word (so timeupdate only re-renders when the word changes), and
  // the mode-handler handoffs (the MODE_EVENT listener is registered
  // once, before the engine functions exist).
  const listenAudioRef = useRef<HTMLAudioElement | null>(null);
  const listenQueueRef = useRef<ListenItem[]>([]);
  const listenRunRef = useRef<{ page: number; waitingPage: number | null } | null>(null);
  const listenCurrentRef = useRef<{ key: string; segments: AudioSegment[] } | null>(null);
  const activeWordRef = useRef<{ verseKey: string; wordIndex: number } | null>(null);
  const stopListenRef = useRef<() => void>(() => {});
  const startListenRef = useRef<() => void>(() => {});
  const playListenVerseRef = useRef<() => void>(() => {});
  // Translation-panel cache, keyed "verseKey:translationIds".
  const transCacheRef = useRef(new Map<string, { translation: string; transliteration: string }>());
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
          highlightMistakes?: boolean;
          tajweedColors?: boolean;
        };
        if (parsed.mushafLines === 16) setCompactText(true);
        if (parsed.highlightMistakes === false) setMistakeMarkingOn(false);
        if (parsed.tajweedColors === true) setTajweedOn(true);
      }
      // Listen + translation layer: the shared reciter / translation
      // settings (same source the surah reader uses), plus the reader's
      // own tap-layer toggles (off by default).
      const s = loadSettings();
      setReciterId(s.reciterId);
      reciterIdRef.current = s.reciterId;
      setMushafTranslationId(s.translationId);
      mushafTranslationIdRef.current = s.translationId;
      if (window.localStorage.getItem('ili_mushaf_tap_trans_v1') === '1') setTapTransOn(true);
      if (window.localStorage.getItem('ili_mushaf_show_translit_v1') === '1') {
        setShowTranslit(true);
        showTranslitRef.current = true;
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
      const res = await fetch(`/api/quran/verses/by_page/${n}?${pageQuery(reciterIdRef.current)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const verses = (data?.verses ?? []) as MushafVerseWithAudio[];
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

  /* ----------------- reciter / translation settings ---------------- */
  // Changing the reciter drops every cached page: the segments belong
  // to the reciter, so each page must refetch with the new reciter's
  // audio + timings. Listen stops first (its queue holds the old
  // reciter's clips).
  const changeReciter = useCallback(
    (id: number) => {
      stopListenRef.current();
      setReciterId(id);
      reciterIdRef.current = id;
      try {
        saveSettings({ ...loadSettings(), reciterId: id });
      } catch {
        /* storage unavailable — the picker still applies this session */
      }
      pagesRef.current = new Map();
      setPages(new Map());
      failedRef.current = new Set();
      setFailed(new Set());
      fetchingRef.current = new Set();
      pumpFetches();
    },
    [pumpFetches],
  );

  // The Mushaf translation is the shared settings translation (the
  // same 104 the surah reader uses) — one source of truth.
  const changeTranslation = useCallback((id: number) => {
    setMushafTranslationId(id);
    mushafTranslationIdRef.current = id;
    try {
      saveSettings({ ...loadSettings(), translationId: id });
    } catch {
      /* storage unavailable — the picker still applies this session */
    }
  }, []);

  const toggleTapTrans = useCallback(() => {
    setTapTransOn((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem('ili_mushaf_tap_trans_v1', next ? '1' : '0');
      } catch {
        /* storage unavailable */
      }
      if (!next) setTransPanel(null);
      return next;
    });
  }, []);

  const toggleTranslit = useCallback(() => {
    setShowTranslit((prev) => {
      const next = !prev;
      showTranslitRef.current = next;
      try {
        window.localStorage.setItem('ili_mushaf_show_translit_v1', next ? '1' : '0');
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

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

  /* ---------------- Listen: word-by-word follow-along --------------
     The continuous Mushaf reader had no audio at all. Listen plays the
     selected reciter's whole-ayah audio, page after page, and highlights
     each word IN the mushaf page as it sounds — driven by Quran.com
     `audio.segments`, the per-word [index, position, startMs, endMs]
     timings inside the reciter's own audio (verified live 2026-11-23:
     one segment per word, in word order, for every reciter tested).
     This is NOT timestamp-syncing inside a clip we don't own: the
     timings come from the same response as the audio itself, and the
     highlight is the segment whose window contains audio.currentTime.
     It is also NOT the per-word-clip mechanism (wbw/*.mp3): those clips
     are one fixed voice and ignore the reciter (see SurahClient) — here
     the voice IS the selected reciter's, because the audio is theirs.
     Ayahs with no segments (or no audio) still play whole-ayah, with a
     note, and unplayable clips are skipped, never stalled on. ---------- */
  const setActiveWordIfChanged = useCallback(
    (next: { verseKey: string; wordIndex: number } | null) => {
      const prev = activeWordRef.current;
      if (prev?.verseKey === next?.verseKey && prev?.wordIndex === next?.wordIndex) return;
      activeWordRef.current = next;
      setActiveWord(next);
    },
    [],
  );

  const listenVersesForPage = useCallback(
    (pageVerses: MushafVerseWithAudio[] | undefined, page: number): ListenItem[] => {
      const out: ListenItem[] = [];
      for (const v of pageVerses ?? []) {
        if (!v.audio?.url) continue;
        out.push({ key: v.verse_key, url: v.audio.url, segments: v.audio.segments ?? [], page });
      }
      return out;
    },
    [],
  );

  const stopListen = useCallback(() => {
    listenRunRef.current = null;
    listenQueueRef.current = [];
    listenCurrentRef.current = null;
    const a = listenAudioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute('src');
    }
    activeWordRef.current = null;
    setActiveWord(null);
    setListenAyah(null);
    setListenPage(0);
    setListenNote('');
    setListenActive(false);
    setListenPaused(false);
    saveMode('reading');
  }, []);
  stopListenRef.current = stopListen;

  const playListenVerse = useCallback(() => {
    const audio = listenAudioRef.current;
    const run = listenRunRef.current;
    if (!run || !audio) return;
    // Advance through pages until the queue holds a verse, or the
    // Quran ends. A page already loaded but with no playable verse is
    // skipped silently; a page not loaded yet is fetched and waited on
    // (the resume effect below picks it up).
    while (listenQueueRef.current.length === 0) {
      const nextPage = run.page + 1;
      if (nextPage > MUSHAF_TOTAL_PAGES) {
        stopListen();
        return;
      }
      if (pagesRef.current.has(nextPage)) {
        run.page = nextPage;
        listenQueueRef.current = listenVersesForPage(pagesRef.current.get(nextPage), nextPage);
        if (listenQueueRef.current.length > 0) {
          setListenPage(nextPage);
          jumpToPage(nextPage, 0, false);
        }
        // else loop on to the page after
      } else {
        run.waitingPage = nextPage;
        void fetchPage(nextPage);
        return;
      }
    }
    const item = listenQueueRef.current[0];
    listenCurrentRef.current = { key: item.key, segments: item.segments };
    setListenAyah(item.key);
    setListenPage(item.page);
    const [s, a] = item.key.split(':').map(Number);
    if (Number.isInteger(s) && Number.isInteger(a)) saveListenPosition(s, a);
    setListenNote(
      item.segments.length === 0
        ? t('reader.wbwUnavailableNote')
        : '',
    );
    setActiveWordIfChanged(null);
    audio.src = `${AUDIO_BASE}${item.url}`;
    audio.playbackRate = 1;
    audio.play().catch(() => {
      // Unplayable clip — skip to the next ayah rather than stalling.
      listenQueueRef.current.shift();
      playListenVerse();
    });
  }, [fetchPage, jumpToPage, listenVersesForPage, setActiveWordIfChanged, stopListen, t]);
  playListenVerseRef.current = playListenVerse;

  const startMushafListen = useCallback(() => {
    const page = currentPageRef.current;
    const pageVerses = pagesRef.current.get(page);
    const items = listenVersesForPage(pageVerses, page);
    stopListen();
    if (pageVerses === undefined) {
      // Current page not loaded yet — wait for it, then start (the
      // resume effect below picks it up once it arrives).
      listenRunRef.current = { page, waitingPage: page };
      setListenActive(true);
      setListenPage(page);
      setListenNote(t('reader.loadingPageAudio'));
      void fetchPage(page);
      return;
    }
    // Page loaded (even with no playable verse — playListenVerse
    // advances to the next playable page on its own).
    listenRunRef.current = { page, waitingPage: null };
    listenQueueRef.current = items;
    setListenActive(true);
    setListenPaused(false);
    setListenNote('');
    saveMode('listen');
    playListenVerse();
  }, [fetchPage, listenVersesForPage, playListenVerse, stopListen, t]);
  startListenRef.current = startMushafListen;

  const toggleListenPause = useCallback(() => {
    const audio = listenAudioRef.current;
    if (!listenRunRef.current || !audio) return;
    if (audio.paused) {
      void audio.play().catch(() => {});
      setListenPaused(false);
    } else {
      audio.pause();
      setListenPaused(true);
    }
  }, []);

  // Resume a Listen run that is waiting on a page to load.
  useEffect(() => {
    const run = listenRunRef.current;
    if (!run || run.waitingPage === null) return;
    const wp = run.waitingPage;
    if (failed.has(wp)) {
      stopListen();
      setListenNote(t('reader.pageAudioFailed'));
      return;
    }
    const pageVerses = pages.get(wp);
    if (!pageVerses) return;
    run.waitingPage = null;
    const items = listenVersesForPage(pageVerses, wp);
    if (items.length === 0) {
      // Page loaded but nothing playable on it — advance from here.
      run.page = wp;
      listenQueueRef.current = [];
      playListenVerse();
      return;
    }
    run.page = wp;
    listenQueueRef.current = items;
    setListenPage(wp);
    jumpToPage(wp, 0, false);
    playListenVerse();
  }, [pages, failed, jumpToPage, listenVersesForPage, playListenVerse, stopListen, t]);

  // One <audio> element drives Listen: timeupdate maps the sounding
  // position onto the current verse's segments (between words, the last
  // sounded word stays lit until the next starts); ended / error moves
  // to the next ayah. Unmount pauses the audio so Listen never plays
  // invisibly after leaving the reader.
  useEffect(() => {
    const audio = listenAudioRef.current;
    if (!audio) return;
    const onTime = () => {
      const cur = listenCurrentRef.current;
      if (!cur || cur.segments.length === 0) return;
      const ms = audio.currentTime * 1000;
      let idx = -1;
      for (let i = 0; i < cur.segments.length; i++) {
        const seg = cur.segments[i];
        if (ms >= seg[2] && ms < seg[3]) {
          idx = i;
          break;
        }
      }
      if (idx === -1) {
        for (let i = cur.segments.length - 1; i >= 0; i--) {
          if (ms >= cur.segments[i][3]) {
            idx = i;
            break;
          }
        }
      }
      setActiveWordIfChanged(
        idx === -1 ? null : { verseKey: cur.key, wordIndex: cur.segments[idx][0] },
      );
    };
    const onEnded = () => {
      listenQueueRef.current.shift();
      setActiveWordIfChanged(null);
      playListenVerseRef.current();
    };
    const onError = () => {
      listenQueueRef.current.shift();
      setActiveWordIfChanged(null);
      playListenVerseRef.current();
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
    };
  }, [setActiveWordIfChanged]);

  /* ---------------- tap-a-line translation -------------------------
     Tapping a mushaf line (only while the layer is on) fetches that
     line's ayahs' translation — and transliteration (resource 57) when
     the toggle is on — in ONE by_key request per ayah, through the same
     proxy. Results are cached per verse + translation set. The panel
     shows the translation / transliteration below the reader; the
     mushaf page itself is never altered. In memorise mode the Arabic
     is withheld from the panel (it would reveal the hidden words). */
  const handleLineTap = useCallback(
    (info: { line: number; verses: { key: string; arabic: string }[] }) => {
      setTransPanel({ verses: info.verses });
      const ids = showTranslitRef.current
        ? `${mushafTranslationIdRef.current},57`
        : String(mushafTranslationIdRef.current);
      for (const v of info.verses) {
        const cacheKey = `${v.key}:${ids}`;
        const cached = transCacheRef.current.get(cacheKey);
        if (cached) {
          setTransData((prev) => {
            const next = new Map(prev);
            next.set(cacheKey, { ...cached, failed: false });
            return next;
          });
          continue;
        }
        fetch(`/api/quran/verses/by_key/${v.key}?fields=text_uthmani&translations=${ids}`)
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then((data) => {
            const trs = (data?.verse?.translations ?? []) as {
              resource_id?: number;
              text?: string;
            }[];
            const entry = {
              translation: stripHtml(
                String(trs.find((x) => x.resource_id === mushafTranslationIdRef.current)?.text ?? ''),
              ),
              transliteration: stripHtml(
                String(trs.find((x) => x.resource_id === 57)?.text ?? ''),
              ),
            };
            transCacheRef.current.set(cacheKey, entry);
            setTransData((prev) => {
              const next = new Map(prev);
              next.set(cacheKey, { ...entry, failed: false });
              return next;
            });
          })
          .catch(() => {
            setTransData((prev) => {
              const next = new Map(prev);
              next.set(cacheKey, { translation: '', transliteration: '', failed: true });
              return next;
            });
          });
      }
    },
    [],
  );

  const reciterName = RECITERS.find((r) => r.id === reciterId)?.name ?? 'Mishary Alafasy';
  const translationName =
    TRANSLATIONS.find((tr) => tr.id === mushafTranslationId)?.name ?? 'Saheeh International';

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

  // Practice-mode selection from the mic button — the reader's
  // replacement for the hidden global ModeSwitcher pill. Ask
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
          Mode, zoom, hide and the other toolbar functions moved into
          the chapter sheet / settings sheet below. */}
      <div ref={toolbarRef} className="fixed inset-x-0 top-0 z-40 border-b border-[#E8EAED] bg-white/95 backdrop-blur">
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
        <div className="h-0.5 overflow-hidden bg-[#E8EAED]" aria-hidden="true">
          <div className="h-full bg-[#1FA36B]" style={{ width: `${(currentPage / MUSHAF_TOTAL_PAGES) * 100}%` }} />
        </div>
      </div>

      {/* Chapter / Juz sheet (hamburger + centre pill). Lists only, in
          Tarteel's order: Recently Read (real history only, hidden when
          empty), "Chapter and Juz Lists" label, Chapters / Parts /
          Bookmarks pills, sort + shown-progress labels, Juz headers +
          surah rows, and the 1–30 Juz quick-jump rail. No Practice Mode
          rows (mode switching lives in the reader bottom bar), no
          prev/next, no jump-to forms, no "on this page" block — the
          lists start at the top of the sheet. */}
      <ReaderSheet open={navOpen} onClose={() => setNavOpen(false)} side="left" title={t('rb.list.chaptersJuz')} dragHandle>
        <SurahList variant="drawer" />
      </ReaderSheet>

      {/* Reader settings sheet (gear): mode, zoom, script, text size,
          topic + tajweed colours, hide words. */}
      <ReaderSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} side="right" title={t('reader.readerSettings')}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{t('reader.readingMode')}</p>
        <div className="mt-2 flex rounded-full border border-[#E8EAED] bg-white p-0.5" role="group" aria-label={t('reader.readingMode')}>
          {(['continuous', 'page'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              aria-pressed={mode === m}
              className={`min-h-10 flex-1 rounded-full px-3 py-1.5 text-sm font-semibold ${
                mode === m ? 'bg-[#102E26] text-white' : 'text-[#111827] hover:bg-[#F3F4F6]'
              }`}
            >
              {m === 'continuous' ? t('reader.continuous') : t('reader.pageMode')}
            </button>
          ))}
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-[#6B7280]">{t('reader.readerZoom')}</p>
        <div className="mt-2 flex items-center gap-1 rounded-full border border-[#E8EAED] bg-white p-0.5" role="group" aria-label={t('reader.readerZoom')}>
          <button
            type="button"
            onClick={() => applyZoom(zoom - ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM}
            aria-label={t('reader.zoomOut')}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-lg font-bold text-[#111827] hover:bg-[#F3F4F6] disabled:opacity-40"
          >
            −
          </button>
          <span className="w-12 text-center text-sm font-semibold text-[#111827]" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => applyZoom(zoom + ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM}
            aria-label={t('reader.zoomIn')}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-lg font-bold text-[#111827] hover:bg-[#F3F4F6] disabled:opacity-40"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => applyZoom(MIN_ZOOM)}
            disabled={zoom === MIN_ZOOM}
            className="min-h-10 flex-1 rounded-full px-3 text-sm font-semibold text-[#111827] hover:bg-[#F3F4F6] disabled:opacity-40"
          >
            {t('reader.resetZoom')}
          </button>
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-[#6B7280]">{t('reader.quranScript')}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label={t('reader.quranScript')}>
          {(['indopak', 'uthmani'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScript(s)}
              aria-pressed={script === s}
              className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${
                script === s ? 'bg-[#102E26] text-white' : 'border border-[#E8EAED] bg-white text-[#111827] hover:bg-[#F3F4F6]'
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
              compactText ? 'bg-[#102E26] text-white' : 'border border-[#E8EAED] bg-white text-[#111827] hover:bg-[#F3F4F6]'
            }`}
          >
            {compactText ? t('mpv.compactText') : t('mpv.largeText')}
          </button>
          <button
            type="button"
            onClick={toggleTajweed}
            aria-pressed={tajweedOn}
            className={`min-h-11 w-full rounded-full px-4 py-2 text-sm font-semibold ${
              tajweedOn ? 'bg-[#102E26] text-white' : 'border border-[#E8EAED] bg-white text-[#111827] hover:bg-[#F3F4F6]'
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
              hideVerses ? 'bg-[#102E26] text-white' : 'border border-[#E8EAED] bg-white text-[#111827] hover:bg-[#F3F4F6]'
            }`}
          >
            {hideVerses ? t('reader.showVerses') : t('reader.hideWords')}
          </button>
        </div>
        {tajweedOn && (
          <p className="mt-3 text-xs text-[#6B7280]">{t('rb.reader.tajweedNote')}</p>
        )}
        {/* Listen in the reader (word-by-word follow-along): the reciter
            whose voice + word timings play. Changing it refetches the
            pages with the new reciter's audio. */}
        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-[#6B7280]">{t('mode.listen')}</p>
        <label className="mt-2 flex min-w-0 items-center gap-2 text-sm font-medium text-[#111827]">
          <span className="shrink-0">{t('surah.reciter')}</span>
          <select
            value={reciterId}
            onChange={(e) => changeReciter(Number(e.target.value))}
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#E5E7EB] bg-white px-2 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
          >
            {RECITERS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">
          Listen plays this reciter in the Mushaf reader, highlighting each word as it sounds — in the
          reciter&apos;s own voice.
        </p>
        {/* Tap-a-line translation layer (off by default): tapping a
            mushaf line shows its translation — and transliteration, when
            on — in a panel. The page itself is never altered. */}
        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-[#6B7280]">{t('common.translation')}</p>
        <label className="mt-2 flex min-w-0 items-center gap-2 text-sm font-medium text-[#111827]">
          <span className="shrink-0">{t('surah.translation')}</span>
          <select
            value={mushafTranslationId}
            onChange={(e) => changeTranslation(Number(e.target.value))}
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#E5E7EB] bg-white px-2 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
          >
            {TRANSLATIONS.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.name} ({tr.lang})
              </option>
            ))}
          </select>
        </label>
        <div className="mt-2 space-y-2">
          <button
            type="button"
            onClick={toggleTapTrans}
            aria-pressed={tapTransOn}
            className={`min-h-11 w-full rounded-full px-4 py-2 text-sm font-semibold ${
              tapTransOn ? 'bg-[#102E26] text-white' : 'border border-[#E8EAED] bg-white text-[#111827] hover:bg-[#F3F4F6]'
            }`}
          >
            {t('reader.tapLineTranslation')}
          </button>
          <button
            type="button"
            onClick={toggleTranslit}
            aria-pressed={showTranslit}
            className={`min-h-11 w-full rounded-full px-4 py-2 text-sm font-semibold ${
              showTranslit ? 'bg-[#102E26] text-white' : 'border border-[#E8EAED] bg-white text-[#111827] hover:bg-[#F3F4F6]'
            }`}
          >
            {t('reader.showTransliteration')}
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">
          {tapTransOn
            ? t('reader.tapTransHint')
                .replace('{name}', translationName)
                .replace('{extra}', showTranslit ? t('reader.tapTransHintExtra') : '')
            : t('reader.tapTransOffHint').replace('{label}', t('reader.tapLineTranslation'))}
        </p>
        {mistakeMarkingOn && (
          <p className="mt-3 text-xs text-[#6B7280]">
            <span className="live-word-wrong font-semibold">{t('mpv.weakLabel')}</span> {t('reader.weakNote')}
          </p>
        )}
        <p className="mt-3 text-xs text-[#6B7280]">{t('reader.zoomNote')}</p>
        <Link
          href="/hifz/settings"
          className="mt-4 inline-flex min-h-11 items-center rounded-full border border-[#E8EAED] bg-white px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#F3F4F6]"
        >{t('rb.reader.allSettings')} →</Link>
      </ReaderSheet>

      {/* Spacer for the fixed toolbar. */}
      <div style={{ height: toolbarH }} aria-hidden="true" />

      {/* Reader content — light-grey app background, white page cards. */}
      <div ref={containerRef} className="mx-auto max-w-5xl bg-[#F2F2F2] px-3 pb-44 pt-4 sm:px-4">
        <div ref={contentRef} style={{ zoom: String(scale), touchAction: 'pan-x pan-y' }}>
          {!mounted ? (
            <div className="rounded-2xl border border-[#E8EAED] bg-white p-6 text-center text-sm text-[#6B7280]">
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
                  hidden={hideVerses}
                  revealed={revealedFor(n)}
                  frequentMistakes={frequentMistakes}
                  mistakeMarkingOn={mistakeMarkingOn}
                  tajweedOn={tajweedOn}
                  activeWord={listenPage === n ? activeWord : null}
                  onLineTap={tapTransOn ? handleLineTap : undefined}
                  registerSlot={registerSlot}
                  onRetry={retryPage}
                />
              );
            })
          )}
        </div>
        <p className="mt-2 text-center text-xs text-[#6B7280]">
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
              className="pointer-events-auto min-h-11 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#111827] shadow-md ring-1 ring-[#FFB800] hover:bg-[#F3F4F6]"
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
              className="pointer-events-auto min-h-11 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#111827] shadow-md ring-1 ring-[#FFB800] hover:bg-[#F3F4F6]"
            >
              {t('reader.revealRest')}
            </button>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#6B7280] shadow-md ring-1 ring-[#E8EAED]">
              {peekCount === 1
                ? t('reader.peekOne').replace('{n}', String(peekCount)).replace('{page}', String(currentPage))
                : t('reader.peekMany').replace('{n}', String(peekCount)).replace('{page}', String(currentPage))}
            </span>
          </div>
        </div>
      )}

      {/* Bottom bar: Mistakes / bookmarks / hide / practice modes + the big mic orb. */}
      <MushafBottomBar
        hideActive={hideVerses}
        onToggleHide={() => {
          setHideVerses((h) => !h);
          setRevealedMap({});
          setPeekCount(0);
        }}
        onMic={() => selectPracticeMode('recite')}
        onSelectMode={selectPracticeMode}
      />

      {/* Listen bar (word-by-word follow-along): floats above the
          bottom bar while Listen is running — play/pause, the ayah now
          sounding, the reciter, stop. The floating mode switcher's
          Listen entry starts this in place. */}
      <audio ref={listenAudioRef} preload="auto" className="hidden" aria-hidden="true" />
      {listenActive && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[216px] z-40">
          <div className="mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] flex-col items-center gap-2 px-3">
            <div className="pointer-events-auto flex min-h-11 flex-wrap items-center justify-center gap-1 rounded-full bg-[#102E26] py-1 pl-2 pr-1 text-white shadow-md">
              <button
                type="button"
                onClick={toggleListenPause}
                aria-label={listenPaused ? t('reader.resumeListening') : t('reader.pauseListening')}
                className="min-h-9 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold hover:bg-white/25"
              >
                {listenPaused ? t('test.resume') : t('test.pause')}
              </button>
              <span className="px-2 text-sm font-semibold">
                {listenAyah ? t('reader.listeningAyah').replace('{ayah}', listenAyah) : t('mode.listen')}
              </span>
              <span className="hidden px-1 text-xs text-white/70 sm:inline">{reciterName}</span>
              <button
                type="button"
                onClick={() => stopListen()}
                aria-label={t('surah.stopListening')}
                className="min-h-9 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold hover:bg-white/25"
              >
                {t('surah.stopListening')}
              </button>
            </div>
            {listenNote && (
              <p className="pointer-events-auto max-w-md rounded-full bg-white px-3 py-1 text-center text-xs font-semibold text-[#6B7280] shadow-md ring-1 ring-[#E8EAED]">
                {listenNote}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tap-a-line translation panel: the translation (and
          transliteration, when on) of the tapped line's ayahs. The
          mushaf page is never altered. In memorise mode the Arabic is
          withheld — it would reveal the hidden words. */}
      {transPanel && (
        <div
          className="fixed inset-x-0 bottom-[152px] z-50"
          role="dialog"
          aria-label={t('common.translation')}
        >
          <div className="mx-auto max-w-2xl px-3">
            <div className="max-h-[45vh] overflow-y-auto rounded-2xl bg-white p-4 shadow-xl ring-1 ring-[#E8EAED]">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                  {t('common.translation')} · {translationName}
                </p>
                <button
                  type="button"
                  onClick={() => setTransPanel(null)}
                  aria-label={t('common.close')}
                  className="inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-full text-[#111827] hover:bg-[#F3F4F6]"
                >
                  <IconClose className="h-5 w-5" />
                </button>
              </div>
              <ul className="mt-2 space-y-4">
                {transPanel.verses.map((v) => {
                  const ids = showTranslit
                    ? `${mushafTranslationId},57`
                    : String(mushafTranslationId);
                  const entry = transData.get(`${v.key}:${ids}`);
                  return (
                    <li key={v.key}>
                      <p className="text-xs font-bold text-[#6B7280]">{v.key}</p>
                      {!hideVerses && (
                        <p dir="rtl" lang="ar" translate="no" className="font-quran mt-1 text-right text-xl leading-relaxed text-[#102E26]">
                          {v.arabic}
                        </p>
                      )}
                      {entry === undefined ? (
                        <p className="mt-1 text-sm text-[#6B7280]">Loading…</p>
                      ) : entry.failed ? (
                        <p className="mt-1 text-sm text-[#6B7280]">
                          {t('reader.translationFailed')}
                        </p>
                      ) : (
                        <>
                          {entry.translation && (
                            <p className="mt-1 text-sm leading-relaxed text-[#1C2420]">{entry.translation}</p>
                          )}
                          {showTranslit && entry.transliteration && (
                            <p className="mt-1 text-sm italic leading-relaxed text-[#5b6b62]">
                              {entry.transliteration}
                            </p>
                          )}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
