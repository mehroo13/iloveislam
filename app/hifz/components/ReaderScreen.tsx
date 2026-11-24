// app/hifz/components/ReaderScreen.tsx — the reader screen (Step 1
// of the step-by-step Tarteel match): the default landing page.
// Full-height mobile-first layout: fixed top bar (hamburger, pill
// with surah / Page / Juz / Hizb + bookmark, search / gift /
// settings), scrollable mushaf page, fixed bottom bar (Mistakes,
// book, eye-off, glowing mic). Horizontal swipe (touch + mouse drag)
// turns the page like a physical Mushaf; the top-bar pill updates.
//
// Phase 1 (live wiring): every top/bottom icon works. One modal open
// at a time (a single openModal state). Hamburger → Dashboard, pill →
// ChapterSheet, bookmark toggles a persisted page bookmark, search →
// Search overlay, gift → Welcome overlay, gear → Settings, Mistakes
// → mistakes modal (mock data), Book → Mushaf Layout sheet (Book /
// Quran Text / Translation modes — persisted), eye-off → Hide Verses
// (blur + tap-to-peek). The page carries a header row (surah left,
// Juz/Hizb right) and a bottom-right page number, and a full Madani
// page is fitted to the viewport height (whole-page reference).
//
// Phase 2 (live wiring): the mic runs the Tilawa on-device engine
// (same as the coach, lite tier) — idle mint, recording red + pulsing
// with a stop square, loading/processing spinner, toasts above the
// button; recognised words are console.logged and kept in state for
// Phase 3 highlighting. Tilawa tracks the declared passage, so the
// "transcript" is the expected words it locked onto. No bottom tab bar.
//
// Phase 6 (Testing Mode): a take that starts with Hide Verses on is
// a memorisation test — the text stays blurred while the engine
// tracks underneath, a tap on a blurred line/verse peeks AND logs a
// 'peek' mistake (peeks count in the score — see the Phase 6 report),
// and on stop the text unblurs and a score popup shows the engine
// accuracy + the mistake count (word mistakes + peeks). A normal
// visible take shows no popup.

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SURAH_FIRST_PAGE, MUSHAF_TOTAL_PAGES, surahsOnMushafPage } from '../mushaf';
import type { ReaderPageData } from '../lib/reader-page';
import ReaderPage from './ReaderPage';
import ChapterSheet from './ChapterSheet';
import ReaderSearch from './ReaderSearch';
import ReaderGift from './ReaderGift';
import ReaderSettings from './ReaderSettings';
import ReaderDashboard from './ReaderDashboard';
import ReaderMushafLayout, { type ReaderLayoutMode } from './ReaderMushafLayout';
import ReaderMistakes from './ReaderMistakes';
import { ReaderTextMode, ReaderTranslationMode } from './ReaderAltViews';
import { loadBookmarks, saveBookmarks } from '../lib/bookmarks';
import { migrateToIdb } from '../lib/store';
import { readerWordKey } from '../lib/reader-words';
import { MIN_READER_SESSION_MS, saveReaderSession, surahName } from '../lib/reader-sessions';
import { type PeekInfo, type ReaderMistake } from '../lib/reader-mistakes';
import {
  loadEngine,
  engineSupport,
  type ExpectedAyah,
  type PreparedMicCapture,
  type RecitationEngine,
  type RecitationSession,
  type SessionResult,
  type WordEvent,
} from '../lib/tilawa';
import type { MushafVerse } from '../lib/fetch';
import { AUDIO_BASE } from '../../quran/lib';

/* ---------------------------------------------------------------- */
/*  Reader mic (Phase 2): Tilawa on-device engine. The same engine   */
/*  and the same mic preparation the coach uses — prepare the mic     */
/*  synchronously inside the tap (2026-11-22 fix: an AudioContext    */
/*  created after `await getUserMedia`, outside the gesture, stays    */
/*  suspended on mobile), one shared stream, no audio upload. The    */
/*  engine is loaded on demand (dynamic import inside loadEngine,    */
/*  lite 25 MB tier) and cached by the Cache API after the first      */
/*  download. Tilawa is a tracker, not a transcriber: the             */
/*  "transcript" is the sequence of expected words it locked onto.    */
/* ---------------------------------------------------------------- */

/** Reference text for one take: the current page's ayahs. A Tilawa
 * session covers a single surah, so a page spanning two surahs uses
 * the first surah on the page. Ayah-end ornaments (char_type 'end')
 * are not spoken words and are left out of the expected text. */
function pageExpected(verses: MushafVerse[]): {
  surah: number;
  fromAyah: number;
  toAyah: number;
  ayahs: ExpectedAyah[];
} | null {
  const bySurah = new Map<number, { ayah: number; text: string }[]>();
  for (const v of verses) {
    const [s, a] = v.verse_key.split(':').map(Number);
    if (!Number.isFinite(s) || !Number.isFinite(a)) continue;
    const text = v.words
      .filter((w) => w.char_type_name !== 'end')
      .map((w) => w.text_uthmani ?? '')
      .join(' ')
      .trim();
    if (!text) continue;
    const list = bySurah.get(s) ?? [];
    list.push({ ayah: a, text });
    bySurah.set(s, list);
  }
  const first = [...bySurah.entries()][0];
  if (!first) return null;
  const [surah, ayahs] = first;
  return {
    surah,
    fromAyah: ayahs[0].ayah,
    toAyah: ayahs[ayahs.length - 1].ayah,
    ayahs: ayahs.map((a) => ({ surah, ayah: a.ayah, text: a.text })),
  };
}

/** Mic button state: idle → loading (model download / permission
 * prompt) → recording → processing → idle. Loading and processing
 * both show the spinner; the toast says which. */
type MicState = 'idle' | 'loading' | 'recording' | 'processing';

/** One Quran.com audio segment: [wordIndex0, wordPosition1, startMs,
 *  endMs] — the same shape MushafReader's Listen uses (see its
 *  AudioSegment comment: one segment per word, in word order). */
type AudioSegment = [number, number, number, number];
/** One playable ayah in the Listen queue. */
interface PlayItem {
  key: string;
  surah: number;
  ayah: number;
  url: string;
  segments: AudioSegment[];
}
/** Listen (audio playback) state: idle → loading (fetching the
 *  page's audio) → playing ⇄ paused → idle. */
type PlayState = 'idle' | 'loading' | 'playing' | 'paused';

function IconStop() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" fill="#FFFFFF" />
    </svg>
  );
}
function IconSpinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** The one modal open at a time (Phase 1). */
type ReaderModal = 'dashboard' | 'sheet' | 'search' | 'gift' | 'settings' | 'layout' | 'mistakes';

/* Reader chrome colours (Phase 7): CSS variables, defined in :root
 * and redefined under [data-theme="dark"] in globals.css — so the
 * Light / Dark toggle restyles the reader without re-rendering.
 * Light values are the old literals (#F7F7F5 / #111827 / #6B7280),
 * so light mode looks exactly as before. SVG icons use these via
 * style={{ stroke: INK }} / style={{ fill: INK }} — var() does NOT
 * work in SVG presentation attributes (stroke={INK}), only in the
 * style prop. */
const PAGE_BG = 'var(--reader-bg)';
const INK = 'var(--reader-ink)';
const MUTED = 'var(--reader-muted)';

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

/* ---------------------------------------------------------------- */
/*  Icons (inline SVG, our own).                                     */
/* ---------------------------------------------------------------- */

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" style={{ stroke: INK }} strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" style={{ stroke: INK }} strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  );
}
function IconGift() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <rect x="3.5" y="9.5" width="17" height="11" rx="1" fill="#FACC15" />
      <rect x="2.5" y="6.5" width="19" height="4" rx="1" fill="#FDE047" />
      <rect x="10.8" y="6.5" width="2.4" height="14" fill="#EF4444" />
      <path d="M12 6.5C10 3.5 6.5 3.5 6.5 5.5 6.5 7 9 7 12 6.5ZM12 6.5C14 3.5 17.5 3.5 17.5 5.5 17.5 7 15 7 12 6.5Z" fill="#EF4444" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <g style={{ fill: INK }}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <rect key={a} x="11" y="1.5" width="2" height="4.5" rx="1" transform={`rotate(${a} 12 12)`} />
        ))}
        <circle cx="12" cy="12" r="6.5" />
        <circle cx="12" cy="12" r="2.6" fill="#FFFFFF" />
      </g>
    </svg>
  );
}
function IconBookmark({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path
        d="M6.5 3.5h11V21L12 16.5 6.5 21V3.5Z"
        fill={filled ? '#16A34A' : '#9CA3AF'}
        stroke={filled ? '#16A34A' : 'none'}
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconMic() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
      <rect x="9.5" y="2.5" width="5" height="11" rx="2.5" fill="#FFFFFF" />
      <path d="M6 11.5c0 3.6 2.7 6 6 6s6-2.4 6-6" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17.5V21" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path
        d="M12 6.8C10.6 5.2 8.2 4.6 5.6 5.2 4.2 5.5 3.2 6 3.2 6.8v10.4c0 .8 1 1.3 2.4 1 2.6-.6 5-.6 6.4.7 1.4-1.3 3.8-1.3 6.4-.7 1.4.3 2.4-.2 2.4-1V6.8c0-.8-1-1.3-2.4-1.6-2.6-.6-5 0-6.4 1.6Z"
        style={{ fill: INK }}
      />
      <path d="M12 6.8v11.1" stroke="#FFFFFF" strokeWidth="1.1" />
    </svg>
  );
}
function IconEyeOff() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" style={{ stroke: INK }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12C5 7.5 8.5 5.5 12 5.5c3.5 0 7 2 9.5 6.5-2.5 4.5-6 6.5-9.5 6.5-3.5 0-7-2-9.5-6.5Z" />
      <circle cx="12" cy="12" r="2.6" style={{ fill: INK }} stroke="none" />
      <path d="M4.5 4.5l15 15" />
    </svg>
  );
}

/* Phase 7 — Listen icons for the reader's Play button (green play
 * triangle / pause bars, drawn in the current-ink green). */
function IconPlaySmall() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="#16A34A" />
    </svg>
  );
}
function IconPauseSmall() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <rect x="6.5" y="5" width="3.6" height="14" rx="1" fill="#FFFFFF" />
      <rect x="13.9" y="5" width="3.6" height="14" rx="1" fill="#FFFFFF" />
    </svg>
  );
}
function IconPlaySpinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(22,163,74,0.3)" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/*  Screen                                                             */
/* ---------------------------------------------------------------- */

export default function ReaderScreen({ initial }: { initial: ReaderPageData }) {
  const [page, setPage] = useState(initial.page);
  const [pages, setPages] = useState<Record<number, ReaderPageData>>({ [initial.page]: initial });
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const [designWidths, setDesignWidths] = useState<Record<number, number>>({});
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  /* One modal open at a time (Phase 1): opening any modal closes
   * all others. */
  const [openModal, setOpenModal] = useState<ReaderModal | null>(null);
  /* Reading layout (Mushaf Layout sheet), persisted across visits.
   * Read after mount to avoid a server/client hydration mismatch. */
  const [layoutMode, setLayoutMode] = useState<ReaderLayoutMode>('book');
  const [textSize, setTextSize] = useState(1.6);
  /* IndexedDB mirror (2026-11-25 final pass): migrateToIdb() used to
   * run only in the /hifz/* AppShell, so the landing page `/` never
   * created the `ili-hifz` database until the first write — a reader
   * session saved from `/` would have had no mirror yet. The landing
   * page is the reader, so it migrates on mount too. Idempotent
   * (openDb is cached, put() overwrites the same keys), and the
   * AppShell call stays for /hifz/* visits. */
  useEffect(() => {
    void migrateToIdb();
  }, []);
  useEffect(() => {
    try {
      const v = window.localStorage.getItem('ili_reader_layout_v1');
      if (v === 'text' || v === 'translation') setLayoutMode(v);
      const s = Number(window.localStorage.getItem('ili_reader_text_size_v1'));
      if (Number.isFinite(s) && s >= 1.2 && s <= 2.2) setTextSize(s);
    } catch {
      /* storage unavailable — defaults stand */
    }
  }, []);
  /* Hide Verses mode + per-line/verse reveals. Reveal keys:
   * `L{page}:{line}` for the Madani page, `V{verse_key}` for the
   * text/translation views. */
  const [hideVerses, setHideVerses] = useState(false);
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());
  /* Phase 6 (Testing Mode): refs the mic callbacks read without
   * stale closures. `hideVersesRef` mirrors the toggle; `testTakeRef`
   * is true while the live take started with the text hidden (a
   * memorisation test); `peekMapRef` holds the peeks logged this
   * take, keyed `peek:…` — the mistakeMap state alone cannot be
   * read from stopMic's stable callback. */
  const hideVersesRef = useRef(false);
  useEffect(() => {
    hideVersesRef.current = hideVerses;
  }, [hideVerses]);
  const testTakeRef = useRef(false);
  const peekMapRef = useRef(new Map<string, ReaderMistake>());
  /* Page bookmark, persisted in the shared bookmarks store. */
  const [bookmarked, setBookmarked] = useState(false);
  useEffect(() => {
    setBookmarked(loadBookmarks().some((b) => b.kind === 'page' && b.page === page));
  }, [page]);
  const [contentWidth, setContentWidth] = useState(390);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameWrapRef = useRef<HTMLDivElement | null>(null);
  const pageHeadRef = useRef<HTMLDivElement | null>(null);
  const pageFootRef = useRef<HTMLDivElement | null>(null);
  /* Fit-to-height shrink for the Madani page (whole-page reference):
   * 1 normally; reduced only when the full page would overflow. */
  const [shrink, setShrink] = useState(1);
  const shrinkRef = useRef(1);
  const busyRef = useRef(false);
  const dragRef = useRef<{ startX: number; startY: number; active: boolean; pointerId: number | null; captured: boolean }>({
    startX: 0,
    startY: 0,
    active: false,
    pointerId: null,
    captured: false,
  });

  const data = pages[page] ?? initial;
  const designWidth = designWidths[page] ?? 970;
  // Scale the design-width frame to the (phone-width) content area.
  // Capped at 1 so a short page never blows up on a wide screen.
  const scale = Math.max(0.3, Math.min(1, (contentWidth - 32) / designWidth));

  /* Phase 1 helpers. */
  const selectLayoutMode = useCallback((m: ReaderLayoutMode) => {
    setLayoutMode(m);
    try {
      window.localStorage.setItem('ili_reader_layout_v1', m);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const changeTextSize = useCallback((n: number) => {
    setTextSize(n);
    try {
      window.localStorage.setItem('ili_reader_text_size_v1', String(n));
    } catch {
      /* storage unavailable */
    }
  }, []);
  const toggleBookmark = useCallback(() => {
    const list = loadBookmarks();
    const exists = list.some((b) => b.kind === 'page' && b.page === page);
    saveBookmarks(
      exists
        ? list.filter((b) => !(b.kind === 'page' && b.page === page))
        : [...list, { kind: 'page', page, addedAt: Date.now() }],
    );
    setBookmarked(!exists);
  }, [page]);
  const reveal = useCallback((key: string, info?: PeekInfo) => {
    setRevealed((r) => {
      const next = new Set(r);
      next.add(key);
      return next;
    });
    // Phase 6 — peek logging: a tap on a blurred line/verse DURING a
    // live test take (mic recording, text hidden at take start) is a
    // peek — the reciter needed help, so it joins the mistake list
    // with kind 'peek' and counts in the live count and the final
    // score. A peek outside a test take (browsing with hidden verses,
    // or a normal visible take) is not a mistake and is not logged.
    // DECISION: a peek counts as a mistake in the score. Mehran can
    // redirect this (e.g. peeks shown but not counted) — see the
    // Phase 6 report.
    if (info && micStateRef.current === 'recording' && testTakeRef.current) {
      const peekKey = `peek:${key}`;
      const entry: ReaderMistake = {
        key: peekKey,
        surah: info.surah,
        ayah: info.ayah,
        word: 0,
        display: info.display,
        type: 'peek',
      };
      peekMapRef.current.set(peekKey, entry);
      setMistakeMap((prev) => {
        if (prev.has(peekKey)) return prev;
        const next = new Map(prev);
        next.set(peekKey, entry);
        return next;
      });
      console.log('[reader-mic] peek:', peekKey, info.display);
    }
  }, []);
  const revealedLines = useMemo(() => {
    const out = new Set<number>();
    const prefix = `L${page}:`;
    for (const k of revealed) {
      if (k.startsWith(prefix)) {
        const n = Number(k.slice(prefix.length));
        if (Number.isFinite(n)) out.add(n);
      }
    }
    return out;
  }, [revealed, page]);

  /** A red word was tapped: open its tooltip next to the word.
   *  Above the word when there is room, else below it; clamped
   *  inside the viewport. The tooltip is fixed-position (the rect
   *  is already viewport coords, zoom included). */
  const openMistakeTooltip = useCallback((mistake: ReaderMistake, rect: DOMRect) => {
    const W = 264;
    const left = Math.max(8, Math.min(window.innerWidth - W - 8, rect.left + rect.width / 2 - W / 2));
    if (rect.top > 180) {
      setMistakeTooltip({ mistake, bottom: window.innerHeight - rect.top + 8, left });
    } else {
      setMistakeTooltip({ mistake, top: rect.bottom + 8, left });
    }
  }, []);

  /* Phase 2 — reader mic (Tilawa on-device engine, same as the coach).
   * `spokenText` is the final transcript so far (the expected words
   * the tracker locked onto, in passage order). Phase 3 highlights
   * words from the engine's onWord events: each 'correct' word's key
   * goes into `highlightedWords` and the word's span lights up green.
   * The engine is loaded once and kept for the reader's lifetime; the
   * model stays in the Cache API. */
  const [micState, setMicState] = useState<MicState>('idle');
  const [micSupported, setMicSupported] = useState(true);
  const [spokenText, setSpokenText] = useState('');
  const [interimText, setInterimText] = useState('');
  /** Words spoken correctly this take (Phase 3): engine keys
   *  `surah:ayah:word` (1-based). The rendered word spans light up
   *  green while their key is in this set. Cleared on a new take and
   *  on page change; kept after stop so the reciter can review what
   *  was said. */
  const [highlightedWords, setHighlightedWords] = useState<ReadonlySet<string>>(new Set());
  /** Words the checker flagged this take (Phase 5): engine key →
   *  mistake. The word's span lights up red; the Mistakes button
   *  shows the live count; the modal lists them. Live checker
   *  events add to it; stop() replaces it with the authoritative
   *  final list from the result (words the reciter demonstrably
   *  went past count too, even when the checker never confirmed
   *  them live). Cleared on a new take and on page change; kept
   *  after stop for review, like the green highlights. */
  const [mistakeMap, setMistakeMap] = useState<ReadonlyMap<string, ReaderMistake>>(new Map());
  /** True once a take has started this visit — the Mistakes modal
   *  shows "recite first" before any take, and "no mistakes" after
   *  a clean one. */
  const [hasRecited, setHasRecited] = useState(false);
  /** The red-word tooltip: the tapped mistake + its fixed position
   *  (`top` when below the word, `bottom` when above it). */
  const [mistakeTooltip, setMistakeTooltip] = useState<{
    mistake: ReaderMistake;
    top?: number;
    bottom?: number;
    left: number;
  } | null>(null);
  /** The current take's mistakes in passage order, for the modal. */
  const mistakesList = useMemo(() => [...mistakeMap.values()], [mistakeMap]);
  const mistakeCount = mistakeMap.size;
  /** Phase 6 — the finished test take's score popup. Only set for a
   *  test take that counts (audio heard, ≥ 3 s); a normal visible
   *  take never shows it. Cleared on a new take and on page change. */
  const [testScore, setTestScore] = useState<{
    accuracy: number;
    mistakes: number;
    peeks: number;
    wordMistakes: number;
  } | null>(null);
  const [micToast, setMicToast] = useState<string | null>(null);
  const engineRef = useRef<RecitationEngine | null>(null);
  const engineStateRef = useRef<'idle' | 'loading' | 'ready' | 'failed' | 'unsupported'>('idle');
  const enginePromiseRef = useRef<Promise<RecitationEngine | null> | null>(null);
  const sessionRef = useRef<RecitationSession | null>(null);
  const micStateRef = useRef<MicState>('idle');
  /** Words recognised so far this take, keyed "surah:ayah:word" — the
   * tracker re-emits a word on every locked position event, so the
   * transcript must dedupe by key. */
  const micWordsRef = useRef(new Map<string, string>());
  /** The take's passage (first surah on the page + ayah range), for
   *  the Phase 4 session record saved when the take ends. */
  const micSessionMetaRef = useRef<{ surah: number; fromAyah: number; toAyah: number } | null>(null);
  /** onLevel callbacks this take (capture-health watchdog). */
  const micLevelRef = useRef(0);
  const micTimerRef = useRef<number | null>(null);
  const micWatchdogRef = useRef<number | null>(null);

  const setMic = useCallback((s: MicState) => {
    micStateRef.current = s;
    setMicState(s);
  }, []);

  /** Load the engine on demand (lite 25 MB tier, as the coach uses —
   * measured identical scores to the 68 MB full tier). One in-flight
   * load is shared by every caller. */
  const ensureEngine = useCallback(async (): Promise<RecitationEngine | null> => {
    if (engineRef.current) return engineRef.current;
    if (enginePromiseRef.current) return enginePromiseRef.current;
    if (!engineSupport().supported) {
      engineStateRef.current = 'unsupported';
      setMicSupported(false);
      return null;
    }
    engineStateRef.current = 'loading';
    const p = loadEngine({ tier: 'lite' })
      .then((eng) => {
        engineRef.current = eng;
        engineStateRef.current = 'ready';
        return eng;
      })
      .catch(() => {
        engineStateRef.current = 'failed';
        enginePromiseRef.current = null;
        return null;
      });
    enginePromiseRef.current = p;
    return p;
  }, []);

  /* Warm the engine in the background once the reader is interactive:
   * first user interaction, else an idle callback. The model is then
   * usually ready when the mic is tapped, so prepareMicrophone() runs
   * synchronously inside that tap (the 2026-11-22 gesture fix). If the
   * user taps first, the tap shows the loading state and waits instead.
   * The engine module is never in the first-paint bundle. */
  useEffect(() => {
    let started = false;
    const kick = () => {
      if (started) return;
      started = true;
      void ensureEngine();
    };
    window.addEventListener('pointerdown', kick, { once: true });
    let idleId: number | undefined;
    let timer: number | undefined;
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(() => kick(), { timeout: 8000 });
    } else {
      timer = window.setTimeout(kick, 3000);
    }
    return () => {
      window.removeEventListener('pointerdown', kick);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [ensureEngine]);

  /* Unmount: stop any live take, release the engine. The model stays
   * in the Cache API for the next visit. */
  useEffect(() => {
    return () => {
      if (micTimerRef.current !== null) window.clearTimeout(micTimerRef.current);
      if (micWatchdogRef.current !== null) window.clearTimeout(micWatchdogRef.current);
      const s = sessionRef.current;
      sessionRef.current = null;
      if (s) void s.abort();
      const eng = engineRef.current;
      engineRef.current = null;
      if (eng) void eng.unload();
    };
  }, []);

  const stopMic = useCallback(
    async (why: 'user' | 'dead') => {
      const session = sessionRef.current;
      if (!session) return;
      if (micWatchdogRef.current !== null) {
        window.clearTimeout(micWatchdogRef.current);
        micWatchdogRef.current = null;
      }
      setMic('processing');
      setMicToast('Processing recitation...');
      let result: SessionResult | null = null;
      try {
        result = await session.stop();
      } catch {
        result = null;
      }
      sessionRef.current = null;
      if (result) {
        // Final transcript, in passage order: the words the tracker
        // confirmed as correctly recited.
        const heard = result.words
          .filter((w) => w.status === 'correct')
          .map((w) => w.display)
          .join(' ');
        if (heard) {
          setSpokenText(heard);
          setInterimText('');
          console.log('[reader-mic] transcript:', heard);
        }
        console.log('[reader-mic] result:', {
          correct: result.correctCount,
          reached: result.reachedCount,
          missed: result.missedCount,
          noSpeech: result.noSpeech,
          micHeardAudio: result.micHeardAudio,
          durationMs: result.durationMs,
        });
        // Phase 5: the authoritative mistake list for this take — the
        // final per-word result, not just the live checker events.
        // Words the reciter demonstrably went past (later words were
        // observed) count as missed even when the checker never
        // confirmed them live; graced words (tracker blind spots)
        // do not. The red highlights persist after stop for review.
        // Phase 6: peeks logged during a test take survive the stop —
        // they are merged in front of the word mistakes (passage
        // order is not defined for a peek, which covers a whole
        // line/verse).
        const finalMistakes = new Map<string, ReaderMistake>();
        for (const [k, m] of peekMapRef.current) finalMistakes.set(k, m);
        for (const w of result.words) {
          if (w.status === 'wrong' || w.status === 'missed') {
            const k = readerWordKey(w.surah, w.ayah, w.word);
            finalMistakes.set(k, {
              key: k,
              surah: w.surah,
              ayah: w.ayah,
              word: w.word,
              display: w.display,
              type: w.status,
            });
          }
        }
        setMistakeMap(finalMistakes);
        setMistakeTooltip(null);
        if (finalMistakes.size > 0) {
          console.log(
            '[reader-mic] mistakes:',
            [...finalMistakes.values()].map((m) => `${m.key} ${m.display} (${m.type})`),
          );
        }
      }
      if (why === 'dead') {
        // Capture never delivered a frame (e.g. a suspended
        // AudioContext from an out-of-gesture prepare on first use):
        // leave the message up so the user can read it — the retry tap
        // runs in-gesture with the engine already loaded.
        testTakeRef.current = false;
        setMic('idle');
        setMicToast("Microphone isn't sending audio — please tap the mic and try again.");
        micTimerRef.current = window.setTimeout(() => setMicToast(null), 4000);
        return;
      }
      // Phase 4: a finished take is a practice session — save it
      // (date, surah, duration, real accuracy, mistake list) to the
      // coach session store. A dead capture saves nothing; a take
      // too short or with no audio heard does not count either.
      if (result && micSessionMetaRef.current) {
        const meta = micSessionMetaRef.current;
        micSessionMetaRef.current = null;
        const mistakeWords = result.words
          .filter((w) => w.status === 'wrong' || w.status === 'missed')
          .map((w) => w.display);
        // Phase 6: peeks count as mistakes, so they join the saved
        // record's count and word list.
        const peekLabels = [...peekMapRef.current.values()].map((m) => `Peek: Ayah ${m.ayah}`);
        const saved = saveReaderSession({
          surah: meta.surah,
          fromAyah: meta.fromAyah,
          toAyah: meta.toAyah,
          durationMs: result.durationMs,
          correct: result.correctCount,
          reached: result.reachedCount,
          missed: result.missedCount,
          mistakeWords,
          micHeardAudio: result.micHeardAudio,
          peeks: peekMapRef.current.size,
          peekLabels,
        });
        if (saved) {
          console.log('[reader-mic] session saved:', {
            surah: saved.surah,
            range: saved.range,
            durationSec: saved.durationSec,
            accuracy: Math.round(saved.accuracy),
            mistakes: saved.mistakes,
          });
        } else {
          console.log('[reader-mic] session not saved: take too short or no audio heard');
        }
      }
      // Phase 6 — test score: a take that started with the text
      // hidden and still has it hidden at stop is a memorisation
      // test. When it counts as a session (audio heard, ≥ 3 s),
      // unblur the text so the green/red review is visible, and
      // show the score popup: accuracy from the engine result,
      // mistake count = word mistakes + peeks. A normal visible take
      // shows no popup; a dead or too-short take shows none either
      // (an accidental tap should not pop a score). The flag is
      // cleared so a later stop cannot re-show the score.
      if (
        result &&
        testTakeRef.current &&
        hideVersesRef.current &&
        result.micHeardAudio &&
        result.durationMs >= MIN_READER_SESSION_MS
      ) {
        const wordMistakes = result.words.filter((w) => w.status === 'wrong' || w.status === 'missed').length;
        const peekCount = peekMapRef.current.size;
        const accuracy = result.reachedCount > 0 ? (result.correctCount / result.reachedCount) * 100 : 0;
        setHideVerses(false);
        setTestScore({
          accuracy: Math.round(accuracy),
          mistakes: wordMistakes + peekCount,
          peeks: peekCount,
          wordMistakes,
        });
        console.log('[reader-mic] test score:', {
          accuracy: Math.round(accuracy),
          mistakes: wordMistakes + peekCount,
          peeks: peekCount,
        });
      }
      testTakeRef.current = false;
      micTimerRef.current = window.setTimeout(() => {
        setMic('idle');
        setMicToast(null);
      }, 1200);
    },
    [setMic],
  );

  const startMic = useCallback(async () => {
    // Listen and the mic exclude each other: stop the audio first.
    if (playStateRef.current !== 'idle') {
      setMicToast('Stop the audio playback first, then recite.');
      micTimerRef.current = window.setTimeout(() => setMicToast(null), 4000);
      return;
    }
    // The engine must be ready before prepareMicrophone() can run.
    if (engineStateRef.current !== 'ready') {
      setMic('loading');
      setMicToast('Loading the recitation model… (about 25 MB, first time only)');
      const eng = await ensureEngine();
      if (!eng) {
        setMic('idle');
        if (engineStateRef.current === 'unsupported') {
          setMicToast("Recitation check isn't supported on this device or browser.");
        } else {
          setMicToast("Couldn't load the recitation model — check your connection and try again.");
        }
        return;
      }
    }
    const engine = engineRef.current;
    if (!engine) {
      setMic('idle');
      setMicToast("Couldn't load the recitation model — check your connection and try again.");
      return;
    }
    // MIC PREPARE — MUST stay synchronous in this tap handler, before
    // any await (2026-11-22 root-cause fix). The context is created +
    // resumed while the gesture is fresh; listen() then takes
    // ownership of the prepared capture.
    let prepared: PreparedMicCapture;
    try {
      prepared = engine.prepareMicrophone();
    } catch (err) {
      const reason = (err as { reason?: string })?.reason;
      setMic('idle');
      if (reason === 'denied') {
        const msg = 'Please allow microphone access to use this feature.';
        window.alert(msg);
        setMicToast(msg);
      } else if (reason === 'insecure-context') {
        setMicToast('Microphone needs a secure (https) connection.');
      } else {
        setMicToast("Microphone isn't available on this device.");
      }
      return;
    }
    setMic('loading');
    setMicToast('Waiting for microphone permission…');
    // A previous take that never reached stop() is still live: abort
    // it first, so two live captures never overlap. The new session
    // only starts once the old one is fully stopped.
    try {
      if (sessionRef.current) {
        await sessionRef.current.abort();
        sessionRef.current = null;
      }
    } catch {
      /* already gone */
    }
    // Reference text: the current page's ayahs (first surah on the
    // page — a session covers one surah).
    const expected = pageExpected(data.verses);
    if (!expected) {
      prepared.release();
      setMic('idle');
      setMicToast('Nothing to recite on this page.');
      return;
    }
    micWordsRef.current = new Map();
    micLevelRef.current = 0;
    micSessionMetaRef.current = {
      surah: expected.surah,
      fromAyah: expected.fromAyah,
      toAyah: expected.toAyah,
    };
    setSpokenText('');
    setInterimText('');
    setHighlightedWords(new Set());
    setMistakeMap(new Map());
    setMistakeTooltip(null);
    // Phase 6: a take that starts with the text hidden is a
    // memorisation test. Re-hide anything peeked in an earlier take
    // so the test is fair, clear the old score, and start a fresh
    // peek log.
    testTakeRef.current = hideVersesRef.current;
    peekMapRef.current.clear();
    setTestScore(null);
    if (testTakeRef.current) setRevealed(new Set());
    const session = engine.startSession({
      surah: expected.surah,
      fromAyah: expected.fromAyah,
      toAyah: expected.toAyah,
      expected: expected.ayahs,
      onWord: (e: WordEvent) => {
        const key = readerWordKey(e.surah, e.ayah, e.word);
        if (e.status === 'correct') {
          // Light the word up green (Phase 3). The tracker re-emits a
          // word on every locked position event, so dedupe by key.
          setHighlightedWords((prev) => {
            if (prev.has(key)) return prev;
            const next = new Set(prev);
            next.add(key);
            return next;
          });
          // A self-correction: the checker resolved its flag, so the
          // word is no longer a mistake (Phase 5).
          setMistakeMap((prev) => {
            if (!prev.has(key)) return prev;
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
          const seen = micWordsRef.current;
          if (seen.has(key)) return;
          seen.set(key, e.display);
          const text = [...seen.values()].join(' ');
          // The recognised Arabic, in the console for debugging.
          console.log('[reader-mic] recognised:', e.display);
          setSpokenText(text);
          setInterimText(text);
        } else if (e.status === 'wrong' || e.status === 'missed') {
          // Narrowed to 'wrong' | 'missed' by the branch — captured
          // here, because property narrowing does not survive into
          // the setState closure below.
          const mistakeType: 'wrong' | 'missed' = e.status;
          // The checker flagged this word — it was not said correctly,
          // so drop any green it had and paint it red (Phase 5). The
          // Mistakes button count updates live from this map.
          setHighlightedWords((prev) => {
            if (!prev.has(key)) return prev;
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
          setMistakeMap((prev) => {
            const next = new Map(prev);
            next.set(key, {
              key,
              surah: e.surah,
              ayah: e.ayah,
              word: e.word,
              display: e.display,
              type: mistakeType,
            });
            return next;
          });
        }
        // 'not-reached' is never emitted live — ignore.
      },
      onLevel: () => {
        micLevelRef.current += 1;
      },
      onTrackerState: (s: string) => {
        console.log('[reader-mic] tracker:', s);
      },
    });
    sessionRef.current = session;
    try {
      // listen() takes ownership of `prepared` — on failure it
      // releases the capture itself, so do NOT release it here.
      await session.startMic(prepared);
    } catch (err) {
      sessionRef.current = null;
      session.dispose();
      const reason = (err as { reason?: string })?.reason;
      setMic('idle');
      if (reason === 'denied') {
        const msg = 'Please allow microphone access to use this feature.';
        window.alert(msg);
        setMicToast(msg);
      } else if (reason === 'insecure-context') {
        setMicToast('Microphone needs a secure (https) connection.');
      } else {
        setMicToast("Microphone isn't available on this device.");
      }
      return;
    }
    setMic('recording');
    setMicToast('Listening... Recite now.');
    setHasRecited(true);
    // Capture-health watchdog: if no audio frames reach the engine
    // within a few seconds, the capture is dead (e.g. a suspended
    // AudioContext from an out-of-gesture prepare on first use) —
    // stop and ask for a retry tap instead of listening to silence.
    micWatchdogRef.current = window.setTimeout(() => {
      if (micStateRef.current !== 'recording') return;
      if (micLevelRef.current === 0) {
        void stopMic('dead');
      }
    }, 4000);
  }, [ensureEngine, setMic, stopMic, data.verses]);

  const toggleMic = useCallback(() => {
    if (micStateRef.current === 'recording') {
      void stopMic('user');
      return;
    }
    if (micStateRef.current === 'loading' || micStateRef.current === 'processing') return;
    void startMic();
  }, [startMic, stopMic]);

  /* ---------------- Phase 7 — Listen (audio playback) -------------
     Reuses the Mushaf Listen infrastructure (MushafReader.tsx): the
     same-origin proxy `/api/quran/verses/by_page/{n}?…&audio=7`
     returns each verse's `audio.url` plus `audio.segments` — the
     per-word [index, position, startMs, endMs] timings inside the
     reciter's own audio (Mishary Alafasy, reciter 7 — the old
     reader's default, and the same voice as the spec's AlQuran
     Cloud `ar.alafasy` example). AlQuran Cloud's ayah audio carries
     NO word timings, so it cannot drive the word-by-word highlight;
     the Quran.com segments are the only source that can — which is
     why this reuses Listen instead of building a second audio system.
     The sounding word lights up green through the same highlight
     set Phase 3 uses (the union below): the segment's 1-based
     position maps straight onto the engine key `surah:ayah:word` —
     pause-mark words are their own segments (see MushafPageFrame),
     so the mapping holds across them. Scope is the first surah on
     the page (same as a mic take); a page turn stops playback, as
     it ends a take. The mic and playback exclude each other: you
     cannot recite-check while audio plays, or play while reciting. */
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [playingWordKey, setPlayingWordKey] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const playStateRef = useRef<PlayState>('idle');
  const playingWordKeyRef = useRef<string | null>(null);
  const playAudioRef = useRef<HTMLAudioElement | null>(null);
  const playQueueRef = useRef<PlayItem[]>([]);
  const playCurrentRef = useRef<PlayItem | null>(null);
  /** Generation counter: a newer start/stop invalidates in-flight
   *  fetches and play() promises, so a stale one cannot restart
   *  audio after the user stopped it. */
  const playRunRef = useRef(0);
  const playErrorTimerRef = useRef<number | null>(null);

  const setPlay = useCallback((s: PlayState) => {
    playStateRef.current = s;
    setPlayState(s);
  }, []);

  const showPlayError = useCallback((msg: string) => {
    setPlayError(msg);
    if (playErrorTimerRef.current !== null) window.clearTimeout(playErrorTimerRef.current);
    playErrorTimerRef.current = window.setTimeout(() => setPlayError(null), 5000);
  }, []);

  const stopPlayback = useCallback(() => {
    playRunRef.current += 1;
    playQueueRef.current = [];
    playCurrentRef.current = null;
    const a = playAudioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute('src');
      a.load();
    }
    playingWordKeyRef.current = null;
    setPlayingWordKey(null);
    setPlay('idle');
  }, [setPlay]);

  const playNextRef = useRef<() => void>(() => {});
  const playNext = useCallback(() => {
    const run = playRunRef.current;
    const audio = playAudioRef.current;
    if (!audio) return;
    const item = playQueueRef.current.shift();
    if (!item) {
      stopPlayback();
      return;
    }
    playCurrentRef.current = item;
    playingWordKeyRef.current = null;
    setPlayingWordKey(null);
    audio.src = `${AUDIO_BASE}${item.url}`;
    // One play attempt for this clip. Two rejections are NOT "unplayable":
    // AbortError means the play was cut short by a pause (the user paused
    // while this clip was still loading) or by a superseding skip — never
    // skip on it, or the pause silently un-pauses itself and the next
    // "resume" tap pauses again instead. NotSupportedError can mean the
    // element still holds the PREVIOUS clip's error while the new src
    // loads: retry once shortly; if that fails too, the error event owns
    // the skip, so the retry must not skip on its own (or one bad clip
    // would be skipped twice).
    const attemptPlay = (isRetry: boolean) => {
      audio
        .play()
        .then(() => {
          if (playRunRef.current === run) setPlay('playing');
        })
        .catch((err: unknown) => {
          if (playRunRef.current !== run) return;
          const name = (err as { name?: string })?.name;
          if (name === 'AbortError') return;
          if (name === 'NotAllowedError') {
            // Autoplay blocked (the fetch outlasted the tap's
            // activation): stop and ask for another tap instead of
            // silently skipping through the whole queue.
            stopPlayback();
            showPlayError('Audio was blocked — please tap Play again.');
            return;
          }
          if (name === 'NotSupportedError' && !isRetry) {
            window.setTimeout(() => {
              if (playRunRef.current === run && playStateRef.current !== 'paused') attemptPlay(true);
            }, 700);
            return;
          }
          if (isRetry) return; // the error event owns the skip from here
          // Unplayable clip — skip to the next ayah, never stall.
          playNextRef.current();
        });
    };
    attemptPlay(false);
  }, [stopPlayback, setPlay, showPlayError]);
  playNextRef.current = playNext;

  const startPlayback = useCallback(async () => {
    if (micStateRef.current !== 'idle') {
      showPlayError('Stop reciting first, then play the audio.');
      return;
    }
    // Listening is not testing: unhide the words so the follow-along
    // is visible instead of a blurred page.
    if (hideVersesRef.current) setHideVerses(false);
    setPlay('loading');
    setPlayError(null);
    const run = playRunRef.current + 1;
    playRunRef.current = run;
    // The page's ayahs, first surah only (same scope as a mic take).
    const expected = pageExpected(data.verses);
    if (!expected) {
      setPlay('idle');
      showPlayError('Nothing to play on this page.');
      return;
    }
    let items: PlayItem[] = [];
    try {
      const res = await fetch(
        `/api/quran/verses/by_page/${page}?words=true&word_fields=text_uthmani,text_indopak,line_number,page_number,position,char_type_name&fields=text_uthmani&audio=7`,
      );
      if (!res.ok) throw new Error(`by_page ${page}: ${res.status}`);
      const d = (await res.json()) as {
        verses?: { verse_key: string; audio?: { url?: string; segments?: AudioSegment[] } }[];
      };
      for (const v of d.verses ?? []) {
        const [s, a] = v.verse_key.split(':').map(Number);
        if (s !== expected.surah || !v.audio?.url) continue;
        items.push({ key: v.verse_key, surah: s, ayah: a, url: v.audio.url, segments: v.audio.segments ?? [] });
      }
    } catch {
      if (playRunRef.current !== run) return;
      setPlay('idle');
      showPlayError("Couldn't load the audio — check your connection and try again.");
      return;
    }
    if (playRunRef.current !== run) return;
    if (items.length === 0) {
      setPlay('idle');
      showPlayError('No audio for this page yet.');
      return;
    }
    playQueueRef.current = items;
    playNextRef.current();
  }, [data.verses, page, setPlay, showPlayError]);

  const togglePlayback = useCallback(() => {
    const st = playStateRef.current;
    if (st === 'playing') {
      const a = playAudioRef.current;
      if (a) a.pause();
      setPlay('paused');
      return;
    }
    if (st === 'paused') {
      const a = playAudioRef.current;
      if (!a) {
        void startPlayback();
        return;
      }
      a.play()
        .then(() => setPlay('playing'))
        .catch(() => {
          showPlayError('Audio was blocked — please tap Play again.');
        });
      return;
    }
    if (st === 'loading') return;
    void startPlayback();
  }, [setPlay, showPlayError, startPlayback]);

  /* One <audio> element drives Listen: timeupdate maps the sounding
   * position onto the current verse's segments (between words, the
   * last sounded word stays lit until the next starts — the same
   * rule as MushafReader); ended / error moves to the next ayah.
   * Unmount pauses the audio so Listen never plays invisibly after
   * leaving the reader. */
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    playAudioRef.current = audio;
    const onTime = () => {
      const cur = playCurrentRef.current;
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
      if (idx === -1) {
        if (playingWordKeyRef.current !== null) {
          playingWordKeyRef.current = null;
          setPlayingWordKey(null);
        }
        return;
      }
      // Segment position (1-based) is the engine word index.
      const key = readerWordKey(cur.surah, cur.ayah, cur.segments[idx][1]);
      if (playingWordKeyRef.current !== key) {
        playingWordKeyRef.current = key;
        setPlayingWordKey(key);
      }
    };
    const onEnded = () => {
      playNextRef.current();
    };
    const onError = () => {
      // A clip that fails while paused must not restart the audio by
      // itself: point the element at the next ayah and stay paused, so
      // Resume plays it instead of the player resuming on its own.
      if (playStateRef.current === 'paused') {
        const item = playQueueRef.current.shift();
        if (!item) {
          stopPlayback();
          return;
        }
        playCurrentRef.current = item;
        playingWordKeyRef.current = null;
        setPlayingWordKey(null);
        audio.src = `${AUDIO_BASE}${item.url}`;
        return;
      }
      playNextRef.current();
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      playAudioRef.current = null;
    };
  }, []);

  /** Words lit on screen this take: the recitation greens (Phase 3)
   *  plus the word currently sounding in Listen (Phase 7). The
   *  renderers light any key in this set green. */
  const displayHighlightedWords = useMemo(
    () => (playingWordKey ? new Set([...highlightedWords, playingWordKey]) : highlightedWords),
    [highlightedWords, playingWordKey],
  );

  /* A page change ends the take: the session's reference text is the
   * old page's ayahs. It also stops Listen (Phase 7). */
  useEffect(() => {
    if (sessionRef.current) void stopMic('user');
    stopPlayback();
    setHighlightedWords(new Set()); // the new page starts unhighlighted
    setMistakeMap(new Map()); // and with no red words
    setMistakeTooltip(null);
    setTestScore(null); // and with no score popup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, stopPlayback]);

  /* A new page (or layout) starts unshrunk; the fit check below
   * shrinks only when the whole page would overflow the viewport. */
  useEffect(() => {
    shrinkRef.current = 1;
    setShrink(1);
  }, [page, layoutMode]);

  /* Fit the whole Madani page in the viewport (whole-page reference:
   * 15 lines + header row + page number, no vertical scroll). Runs
   * whenever the frame resizes (fonts loading included). The zoom
   * scales the frame linearly, so one or two passes converge. */
  useEffect(() => {
    if (layoutMode !== 'book') return;
    const main = containerRef.current;
    const frame = frameWrapRef.current;
    if (!main || !frame) return;
    const check = () => {
      const chrome =
        (pageHeadRef.current?.offsetHeight ?? 0) +
        (pageFootRef.current?.offsetHeight ?? 0) +
        28; // pt-3 + pb-4 + gaps
      const avail = main.clientHeight - chrome;
      // getBoundingClientRect (not scrollHeight): scrollHeight ignores
      // the CSS zoom on the frame and reports the unzoomed height,
      // which over-shrinks dense pages to a narrow column.
      const h = frame.getBoundingClientRect().height;
      if (h <= 0 || avail <= 0) return;
      // Derive the shrink from the unshrunk height instead of
      // multiplying down: the old multiply-only version never grew
      // back, so a shrink taken while the fallback font was still
      // loaded (narrow measure, wide frame) stuck forever.
      const unshrunk = h / shrinkRef.current;
      const next = Math.max(0.3, Math.min(1, avail / unshrunk));
      if (Math.abs(next - shrinkRef.current) > 0.005) {
        shrinkRef.current = next;
        setShrink(next);
      }
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(frame);
    ro.observe(main);
    return () => ro.disconnect();
  }, [page, layoutMode, designWidth, scale]);

  // Track the content width (viewport, capped at phone width) so the
  // scale and the slide distance follow resizes / rotations.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContentWidth(Math.min(el.clientWidth, 520));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fetchPage = useCallback(async (n: number): Promise<ReaderPageData> => {
    const cached = pagesRef.current[n];
    if (cached) return cached;
    const res = await fetch(`/api/quran/reader-page/${n}`);
    if (!res.ok) throw new Error(`reader page ${n}: ${res.status}`);
    const d = (await res.json()) as ReaderPageData;
    setPages((p) => ({ ...p, [n]: d }));
    return d;
  }, []);

  // Pre-fetch the neighbouring pages so swipes are instant.
  useEffect(() => {
    for (const n of [page - 1, page + 1]) {
      if (n >= 1 && n <= MUSHAF_TOTAL_PAGES && !pagesRef.current[n]) {
        fetchPage(n).catch(() => {});
      }
    }
  }, [page, fetchPage]);

  const handleMeasure = useCallback((p: number) => {
    return (maxNatural: number) => {
      // Snap to 4px: the measurer's sub-pixel readings otherwise
      // wobble dw by ±1px, scale/zoom follow, the measure effect
      // re-runs on the zoom change, and React hits max update depth.
      const dw = Math.max(480, Math.min(970, Math.round((maxNatural * 1.04 + 48) / 4) * 4));
      setDesignWidths((d) => (d[p] === dw ? d : { ...d, [p]: dw }));
    };
  }, []);

  const snapBack = useCallback(() => {
    setAnimating(true);
    setOffset(0);
    window.setTimeout(() => setAnimating(false), 280);
  }, []);

  const goToPage = useCallback(
    async (target: number, dir: 1 | -1) => {
      if (busyRef.current) return;
      busyRef.current = true;
      const w = contentWidth;
      try {
        await fetchPage(target);
      } catch {
        busyRef.current = false;
        snapBack();
        return;
      }
      // Slide the current page out.
      setAnimating(true);
      setOffset(dir > 0 ? -w : w);
      await wait(280);
      // Swap to the new page off-screen (no transition), let it
      // commit + measure, then slide it in.
      setAnimating(false);
      setPage(target);
      setOffset(dir > 0 ? w : -w);
      await raf();
      await raf();
      setAnimating(true);
      setOffset(0);
      await wait(280);
      setAnimating(false);
      busyRef.current = false;
    },
    [fetchPage, snapBack, contentWidth],
  );

  const jumpToPage = useCallback(
    (target: number) => {
      if (target < 1 || target > MUSHAF_TOTAL_PAGES || target === page) return;
      if (busyRef.current) return;
      busyRef.current = true;
      fetchPage(target)
        .then(() => {
          setAnimating(false);
          setOffset(0);
          setPage(target);
        })
        .catch(() => {})
        .finally(() => {
          busyRef.current = false;
        });
    },
    [page, fetchPage],
  );

  /* Swipe: pointer events (touch + mouse). Vertical gestures are
   * left to native scrolling (touch-action: pan-y). */
  const onPointerDown = (e: React.PointerEvent) => {
    if (busyRef.current) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, active: true, pointerId: e.pointerId, captured: false };
    // NOTE: no setPointerCapture here. Capturing on pointerdown
    // retargets the click to <main>, so buttons and tap-to-peek inside
    // the page never receive their click. Capture lazily, only once a
    // horizontal drag is established (see onPointerMove).
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    if (Math.abs(dy) > Math.abs(dx) * 1.2) {
      // Vertical gesture — hand it back to native scrolling.
      d.active = false;
      snapBack();
      return;
    }
    // Horizontal drag established — capture the pointer now so the
    // swipe keeps tracking even if it leaves the element.
    if (!d.captured) {
      d.captured = true;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    }
    // Resistance at the ends of the book.
    let o = dx;
    if ((page === 1 && dx > 0) || (page === MUSHAF_TOTAL_PAGES && dx < 0)) o = dx * 0.35;
    setOffset(o);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active || d.pointerId !== e.pointerId) return;
    d.active = false;
    const dx = e.clientX - d.startX;
    const w = contentWidth;
    const threshold = Math.max(70, w * 0.22);
    if (Math.abs(dx) > threshold) {
      const dir = dx < 0 ? 1 : -1;
      const target = page + dir;
      if (target < 1 || target > MUSHAF_TOTAL_PAGES) {
        snapBack();
        return;
      }
      void goToPage(target, dir);
    } else {
      snapBack();
    }
  };

  /* The chapter drawer was replaced in Step 6: the hamburger now
   * opens the Dashboard. Chapter navigation stays available via the
   * central top-bar pill (Step 2 ChapterSheet). */

  const meta = data.meta;

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden" style={{ backgroundColor: PAGE_BG }}>
      {/* Top navigation bar — raised above the chapter-sheet overlay
          while the sheet is open, so the top bar stays undimmed. */}
      <header
        className={`relative flex shrink-0 items-center gap-2 border-b border-[#E8E8E4] px-3 py-2.5 ${openModal === 'sheet' ? 'z-50' : ''}`}
        style={{ backgroundColor: PAGE_BG }}
      >
        <button
          type="button"
          aria-label="Dashboard"
          onClick={() => setOpenModal('dashboard')}
          className="flex h-10 w-10 shrink-0 items-center justify-center"
        >
          <IconMenu />
        </button>
        <div className="flex min-w-0 flex-1 items-center rounded-[12px] border border-[#D1D5DB] bg-white px-3.5 py-1.5">
          <button
            type="button"
            aria-label="Chapters and Juz lists"
            onClick={() => setOpenModal('sheet')}
            className="min-w-0 flex-1 text-left"
          >
            <p className="truncate text-[15px] font-bold leading-tight" style={{ color: INK }}>
              {meta.surahName}
            </p>
            <p className="truncate text-[11.5px] leading-tight" style={{ color: MUTED }}>
              Page {page} | Juz {meta.juz} | Hizb {meta.hizb}
            </p>
          </button>
          <button
            type="button"
            aria-label={bookmarked ? 'Remove bookmark for this page' : 'Bookmark this page'}
            aria-pressed={bookmarked}
            onClick={toggleBookmark}
            className="ml-2 shrink-0"
          >
            <IconBookmark filled={bookmarked} />
          </button>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setOpenModal('search')}
            className="flex h-9 w-9 items-center justify-center"
          >
            <IconSearch />
          </button>
          <button
            type="button"
            aria-label="Gifts"
            onClick={() => setOpenModal('gift')}
            className="flex h-9 w-9 items-center justify-center"
          >
            <IconGift />
          </button>
          <button
            type="button"
            aria-label="Settings"
            onClick={() => setOpenModal('settings')}
            className="flex h-9 w-9 items-center justify-center"
          >
            <IconGear />
          </button>
        </div>
      </header>

      {/* Mushaf page (swipe area) */}
      <main
        ref={containerRef}
        className="relative min-h-0 flex-1 overflow-y-auto [touch-action:pan-y]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="mx-auto flex min-h-full w-full max-w-[520px] flex-col justify-start pb-4 pt-3">
          {/* The slide wrapper is a full-height flex column so the
              page number (mt-auto below) sits at the bottom-right of
              the reading area — the screen's bottom-right corner —
              instead of right after the text block (2026-11-25 final
              pass). When the page overflows, the wrapper grows with
              the content and the number follows the text. */}
          <div
            className="flex min-h-full w-full flex-1 flex-col"
            style={{
              transform: `translateX(${offset}px)`,
              transition: animating ? 'transform 280ms ease' : 'none',
            }}
          >
            {/* Page header row (whole-page reference): surah name
                left, Play + Juz / Hizb right. */}
            <div ref={pageHeadRef} className="flex items-center justify-between px-2 pb-2">
              <span className="text-[15px] font-medium" style={{ color: INK }}>
                {meta.surahName}
              </span>
              <span className="flex items-center gap-2">
                {/* Phase 7 — Listen: play this surah's recitation
                    (Mishary Alafasy); the words light up green as
                    they sound. Tap again to pause, tap once more to
                    resume; a page turn stops it. */}
                <button
                  type="button"
                  aria-label={
                    playState === 'playing'
                      ? 'Pause recitation'
                      : playState === 'paused'
                        ? 'Resume recitation'
                        : playState === 'loading'
                          ? 'Loading recitation audio'
                          : `Play ${meta.surahName} recitation`
                  }
                  aria-pressed={playState === 'playing'}
                  data-testid="reader-play-button"
                  data-play-state={playState}
                  onClick={togglePlayback}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D1D5DB] bg-white shadow-sm"
                  style={
                    playState === 'playing'
                      ? { backgroundColor: '#16A34A', borderColor: '#16A34A' }
                      : undefined
                  }
                >
                  {playState === 'playing' ? (
                    <IconPauseSmall />
                  ) : playState === 'loading' ? (
                    <IconPlaySpinner />
                  ) : (
                    <IconPlaySmall />
                  )}
                </button>
                <span className="flex items-center gap-2 text-[15px]" style={{ color: INK }}>
                  <span>Juz {meta.juz}</span>
                  <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
                    <circle cx="6" cy="6" r="4.5" fill="none" style={{ stroke: INK }} strokeWidth="1.2" />
                    <circle cx="6" cy="6" r="1.4" style={{ fill: INK }} />
                  </svg>
                  <span>Hizb {meta.hizb}</span>
                </span>
              </span>
            </div>
            {playError && (
              <p role="alert" data-testid="play-error" className="px-2 pb-1 text-center text-[13px] leading-snug" style={{ color: '#DC2626' }}>
                {playError}
              </p>
            )}
            {layoutMode === 'book' ? (
              <div ref={frameWrapRef} className="w-full" style={{ zoom: scale * shrink }}>
                <ReaderPage
                  key={page}
                  page={page}
                  verses={data.verses}
                  tajweed={data.tajweed}
                  designWidth={designWidth}
                  onMeasure={handleMeasure(page)}
                  zoom={scale * shrink}
                  hideVerses={hideVerses}
                  revealedLines={revealedLines}
                  onRevealLine={(ln, info) => reveal(`L${page}:${ln}`, info)}
                  highlightedWords={displayHighlightedWords}
                  mistakes={mistakeMap}
                  onMistakeWordClick={openMistakeTooltip}
                />
              </div>
            ) : layoutMode === 'text' ? (
              <ReaderTextMode
                key={page}
                verses={data.verses}
                hideVerses={hideVerses}
                revealed={revealed}
                onReveal={reveal}
                textSize={textSize}
                onTextSizeChange={changeTextSize}
                highlightedWords={displayHighlightedWords}
                mistakes={mistakeMap}
                onMistakeWordClick={openMistakeTooltip}
              />
            ) : (
              <ReaderTranslationMode
                key={page}
                verses={data.verses}
                hideVerses={hideVerses}
                revealed={revealed}
                onReveal={reveal}
                highlightedWords={displayHighlightedWords}
                mistakes={mistakeMap}
                onMistakeWordClick={openMistakeTooltip}
              />
            )}
            {/* Page number, bottom-right (whole-page reference):
                mt-auto pins it to the bottom of the reading area
                when the page fits, instead of right after the text. */}
            <div ref={pageFootRef} className="mt-auto flex justify-end px-2 pt-2">
              <span className="text-[15px]" style={{ color: INK }}>
                {page}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom control bar */}
      <footer
        className="relative shrink-0 border-t border-[#EDEDEA]"
        style={{ backgroundColor: PAGE_BG, height: 76 }}
      >
        <div className="flex h-full items-center gap-2.5 px-4">
          {/* Mistakes (Phase 5): the live count for this take — "2
              Mistakes" once the checker flags words, "Mistakes"
              when there are none. Red while the count is above 0. */}
          <button
            type="button"
            aria-label={
              mistakeCount > 0
                ? `${mistakeCount} mistake${mistakeCount === 1 ? '' : 's'} this session`
                : 'Recent mistakes'
            }
            data-testid="mistakes-button"
            onClick={() => {
              setMistakeTooltip(null);
              setOpenModal('mistakes');
            }}
            className="flex h-11 items-center rounded-full border-[1.5px] bg-white px-5 text-[15px] font-bold shadow-sm"
            style={{
              borderColor: mistakeCount > 0 ? '#DC2626' : INK,
              color: mistakeCount > 0 ? '#DC2626' : INK,
            }}
          >
            {mistakeCount > 0 ? `${mistakeCount} Mistake${mistakeCount === 1 ? '' : 's'}` : 'Mistakes'}
          </button>
          <button
            type="button"
            aria-label="Mushaf Layout"
            onClick={() => setOpenModal('layout')}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D1D5DB] bg-white shadow-sm"
          >
            <IconBook />
          </button>
          <button
            type="button"
            aria-label={hideVerses ? 'Show verses' : 'Hide verses'}
            aria-pressed={hideVerses}
            onClick={() => setHideVerses((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full border shadow-sm"
            style={{
              borderColor: hideVerses ? '#16A34A' : '#D1D5DB',
              backgroundColor: hideVerses ? 'var(--reader-mint)' : 'var(--reader-card)',
            }}
          >
            <IconEyeOff />
          </button>
        </div>
        {/* Mic (Phase 2: Tilawa on-device engine). Idle = mint + mic
            icon; recording = red, gently pulsing, stop square;
            loading / processing = spinner. A floating toast above the
            button reports the state and shows the recognised words as
            they arrive. */}
        <div className="absolute bottom-3 right-4 flex flex-col items-end">
          {micToast && (
            <div
              role="status"
              data-testid="mic-toast"
              className="mb-3 w-[248px] rounded-2xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-left shadow-lg"
            >
              <p className="text-[13px] font-bold" style={{ color: INK }}>
                {micToast}
              </p>
              {(interimText || spokenText) && (
                <p dir="rtl" lang="ar" className="mt-1 text-[14px] leading-snug" style={{ color: MUTED }}>
                  {interimText || spokenText}
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            aria-label={
              micState === 'recording'
                ? 'Stop reciting'
                : micState === 'loading'
                  ? 'Loading recitation model'
                  : micState === 'processing'
                    ? 'Processing recitation'
                    : 'Recite'
            }
            aria-pressed={micState === 'recording'}
            data-mic-state={micState}
            data-mic-supported={micSupported}
            onClick={toggleMic}
            className={`flex h-16 w-16 items-center justify-center rounded-full ${micState === 'recording' ? 'animate-pulse' : ''}`}
            style={
              micState === 'recording'
                ? {
                    background:
                      'radial-gradient(circle at 50% 42%, #FCA5A5 0%, #F87171 48%, #DC2626 100%)',
                    boxShadow: '0 0 26px 7px rgba(220, 38, 38, 0.45), 0 4px 14px rgba(0,0,0,0.12)',
                  }
                : {
                    background:
                      'radial-gradient(circle at 50% 42%, #C9F7D4 0%, #7BE3A8 48%, #34D399 100%)',
                    boxShadow: '0 0 26px 7px rgba(52, 211, 153, 0.45), 0 4px 14px rgba(0,0,0,0.12)',
                  }
            }
          >
            {micState === 'recording' ? (
              <IconStop />
            ) : micState === 'loading' || micState === 'processing' ? (
              <IconSpinner />
            ) : (
              <IconMic />
            )}
          </button>
        </div>
      </footer>

      {/* Red-word tooltip (Phase 5): a tap anywhere else closes it;
          it also closes on a new take, a page change, or when the
          take ends. The checker cannot supply the spoken word —
          Tilawa tracks, it does not transcribe — so a wrong word
          honestly says "something else", never an invented quote.
          Tashkeel (diacritic) mistakes are NOT shown here: the
          FastConformer pass that could supply spoken words is not
          wired up (see the Phase 5 report). */}
      {mistakeTooltip && (
        <>
          <button
            type="button"
            aria-label="Close mistake detail"
            data-testid="mistake-tooltip-backdrop"
            onClick={() => setMistakeTooltip(null)}
            className="fixed inset-0 z-50 cursor-default"
            style={{ backgroundColor: 'transparent' }}
          />
          <div
            role="dialog"
            aria-label="Mistake detail"
            data-testid="mistake-tooltip"
            className="fixed z-50 w-[264px] rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-left shadow-xl"
            style={{ left: mistakeTooltip.left, top: mistakeTooltip.top, bottom: mistakeTooltip.bottom }}
          >
            <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: '#DC2626' }}>
              {mistakeTooltip.mistake.type === 'wrong' ? 'Wrong word' : 'Skipped word'}
            </p>
            <p dir="rtl" lang="ar" className="font-quran-madani pt-1 text-right text-[22px] leading-snug" style={{ color: INK }}>
              {mistakeTooltip.mistake.display}
            </p>
            <p className="pt-1 text-[13px] leading-snug" style={{ color: MUTED }}>
              {mistakeTooltip.mistake.type === 'wrong'
                ? 'You said something else here — the checker could not tell exactly what was said.'
                : 'You skipped this word.'}
            </p>
            <p className="pt-1 text-[13px] leading-snug" style={{ color: INK }}>
              {surahName(mistakeTooltip.mistake.surah)} · Ayah {mistakeTooltip.mistake.ayah}
            </p>
          </div>
        </>
      )}

      {/* Test score popup (Phase 6): after a memorisation test (a
          take that started with the text hidden), the text is
          unblurred and the score shows — accuracy from the engine
          result, mistake count = word mistakes + peeks. Dismissible
          by backdrop, X, or Done; "Review mistakes" dismisses it
          and opens the Mistakes modal. It never appears for a normal
          visible take. */}
      {testScore && (
        <>
          <button
            type="button"
            aria-label="Close test score"
            data-testid="test-score-backdrop"
            onClick={() => setTestScore(null)}
            className="fixed inset-0 z-50 cursor-default"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          />
          <div
            role="dialog"
            aria-label="Test score"
            data-testid="test-score-popup"
            className="fixed left-1/2 top-1/2 z-50 w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white px-6 py-6 text-center shadow-2xl"
          >
            <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: '#16A34A' }}>
              Test complete
            </p>
            <p data-testid="test-score-accuracy" className="pt-2 text-[30px] font-bold leading-tight" style={{ color: INK }}>
              Accuracy: {testScore.accuracy}%
            </p>
            <p data-testid="test-score-mistakes" className="pt-1 text-[16px] font-semibold" style={{ color: testScore.mistakes > 0 ? '#DC2626' : '#16A34A' }}>
              {testScore.mistakes === 0
                ? 'No mistakes — well done!'
                : `${testScore.mistakes} Mistake${testScore.mistakes === 1 ? '' : 's'}`}
            </p>
            {testScore.peeks > 0 && (
              <p className="pt-1 text-[13px] leading-snug" style={{ color: MUTED }}>
                Including {testScore.peeks} peek{testScore.peeks === 1 ? '' : 's'} — you looked at the text{' '}
                {testScore.peeks === 1 ? 'once' : `${testScore.peeks} times`}.
              </p>
            )}
            <div className="flex gap-2 pt-5">
              {testScore.mistakes > 0 && (
                <button
                  type="button"
                  data-testid="test-score-review"
                  onClick={() => {
                    setTestScore(null);
                    setOpenModal('mistakes');
                  }}
                  className="h-11 flex-1 rounded-full border-[1.5px] border-[#111827] bg-white text-[15px] font-bold"
                  style={{ color: INK }}
                >
                  Review mistakes
                </button>
              )}
              <button
                type="button"
                data-testid="test-score-done"
                onClick={() => setTestScore(null)}
                className="h-11 flex-1 rounded-full bg-[#16A34A] text-[15px] font-bold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}

      {/* Dashboard (Step 6): full-screen overlay from the hamburger;
          the back button returns to the reader. Its gear opens
          Settings; the Dashboard closes first. */}
      <ReaderDashboard
        open={openModal === 'dashboard'}
        onClose={() => setOpenModal(null)}
        onOpenSettings={() => setOpenModal('settings')}
      />

      {/* Search screen (Step 3): full-screen overlay. */}
      <ReaderSearch open={openModal === 'search'} onClose={() => setOpenModal(null)} />

      {/* Welcome / gift overlay (Step 4): closing returns to the
          reader on Page 1, Al-Fatihah. Never auto-shows on load. */}
      <ReaderGift
        open={openModal === 'gift'}
        onClose={() => {
          setOpenModal(null);
          if (page !== 1) jumpToPage(1);
        }}
      />

      {/* Settings page (Step 5): full-screen overlay; the back
          button returns to the reader. Phase 7: TEST YOURSELF opens
          the reader in Testing Mode (Hide Verses on); the Mushaf
          Layout row opens the layout sheet. */}
      <ReaderSettings
        open={openModal === 'settings'}
        onClose={() => setOpenModal(null)}
        onTestYourself={() => {
          setOpenModal(null);
          setHideVerses(true);
        }}
        onOpenLayout={() => setOpenModal('layout')}
      />

      {/* Chapter / Juz selection bottom sheet (Step 2) */}
      <ChapterSheet
        open={openModal === 'sheet'}
        onClose={() => setOpenModal(null)}
        currentSurahId={surahsOnMushafPage(page)[0] ?? 1}
        currentJuz={meta.juz}
        onSelectSurah={(id) => {
          setOpenModal(null);
          jumpToPage(SURAH_FIRST_PAGE[id] ?? 1);
        }}
      />

      {/* Mushaf Layout bottom sheet (Phase 1): the radio selection
          persists and switches the reader rendering. */}
      <ReaderMushafLayout
        open={openModal === 'layout'}
        onClose={() => setOpenModal(null)}
        mode={layoutMode}
        onSelect={selectLayoutMode}
      />

      {/* Mistakes modal (Phase 5): the current take's real mistakes
          — no mock data. */}
      <ReaderMistakes
        open={openModal === 'mistakes'}
        onClose={() => setOpenModal(null)}
        mistakes={mistakesList}
        hasRecited={hasRecited}
        recording={micState === 'recording'}
      />
    </div>
  );
}
