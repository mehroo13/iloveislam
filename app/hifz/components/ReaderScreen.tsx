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
import { useRouter } from 'next/navigation';
import {
  surahFirstPageForEdition,
  surahsOnMushafPageForEdition,
} from '../lib/mushaf-surah-pages';
import type { ReaderPageData } from '../lib/reader-page';
import ReaderPage from './ReaderPage';
import ChapterSheet from './ChapterSheet';
import ReaderSearch from './ReaderSearch';
import ReaderGift from './ReaderGift';
import ReaderSettings, { type SettingsScreenId } from './ReaderSettings';
import ReaderDashboard from './ReaderDashboard';
import type { ReaderLayoutMode } from '../lib/layout-mode';
import {
  editionFromSettings,
  mushafEditionById,
  scriptForEdition,
  totalPagesForEdition,
  type MushafEditionId,
} from '../lib/mushaf-edition';
import { getScriptPref, setScriptPref } from '../lib/script';
import ReaderMistakes from './ReaderMistakes';
import { ReaderTranslationMode, ReaderContinuousText } from './ReaderAltViews';
import { loadBookmarks, saveBookmarks } from '../lib/bookmarks';
import { migrateToIdb } from '../lib/store';
import { readerWordKey } from '../lib/reader-words';
import { MIN_READER_SESSION_MS, saveReaderSession, surahName } from '../lib/reader-sessions';
import { DEFAULT_RECITER_ID, DEFAULT_TRANSLATION_ID, loadSettings, saveSettings } from '../progress';
import { type PeekInfo, type ReaderMistake, loadFrequentMistakeKeys } from '../lib/reader-mistakes';
import { playDroppedFeedback, playMistakeFeedback, playSessionFeedback } from '../lib/sounds';
import TafsirBlock from './TafsirBlock';
import { TAFSIR_KEY } from './AyahClient';
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
import { API, AUDIO_BASE, KHATTAB_TRANSLATION_ID, TAFSIR_ID, tafsirName } from '../../quran/lib';

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
type ReaderModal = 'dashboard' | 'sheet' | 'search' | 'gift' | 'settings' | 'mistakes';

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
  const router = useRouter();
  const [page, setPage] = useState(initial.page);
  const [pages, setPages] = useState<Record<number, ReaderPageData>>({ [initial.page]: initial });
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const [designWidths, setDesignWidths] = useState<Record<number, number>>({});
  /* Page-turn track (2026-11-25 second refinement; Book-only since
   * 2026-11-26, Part 2 — Translation left the track for the
   * continuous scroll): Book renders THREE page columns in a
   * horizontal track — left→right [page+1, page, page-1] — inside a
   * content-width window. `offset` is the track's displacement
   * from its settled position (0 = the current page centred); the
   * transform is translateX(-contentWidth + offset). During a drag
   * the track follows the finger 1:1, so the next page is already
   * sliding into view under the touch; on release it settles the
   * short way to the nearest snap point and the page commits.
   * Direction (Mehran): left-to-right swipe goes to the NEXT page,
   * right-to-left comes BACK — the next page sits to the left, so
   * dragging rightward turns forward. */
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  /* One modal open at a time (Phase 1): opening any modal closes
   * all others. */
  const [openModal, setOpenModal] = useState<ReaderModal | null>(null);
  /* Reading layout (Mushaf Layout sheet), persisted across visits.
   * Read after mount to avoid a server/client hydration mismatch.
   * Default is Quran Text (2026-11-26, Part 3): a fresh user lands
   * on the resizable flowing text; a stored choice still wins. */
  const [layoutMode, setLayoutMode] = useState<ReaderLayoutMode>('text');
  /** Book swipes page by page; Text and Translation both scroll as
   *  one continuous vertical flow over the loaded page range
   *  (2026-11-26, Part 2: Translation joins Text here). Every
   *  `layoutMode === 'text'` gate below goes through this flag, so
   *  the two continuous modes share range-loading, visible-page
   *  tracking, the pill/bookmark/mic scope and the no-swipe rule. */
  const isContinuous = layoutMode === 'text' || layoutMode === 'translation';
  /* Mushaf Type picker (fourth refinement, 2026-11-25): the print
   * edition + the Show Tajweed Colors switch, both persisted in
   * `ili_hifz_settings_v1` and applied to the reader at once.
   * Defaults equal the reader's behaviour before the picker existed
   * (Madani 1405, colours on), so nothing changes on first load. */
  const [edition, setEdition] = useState<MushafEditionId>('madani-1405');
  /** Real page count of the selected edition's layout (604 Madani,
   *  610 Indo-Pak) — every page bound in this file uses it. */
  const totalPages = totalPagesForEdition(edition);

  /* One reader page, in the given edition (default: the selected
   *  one). Declared up here (not with the swipe code below) because
   *  selectEdition calls it. The cache is per page number and is
   *  dropped on an edition switch (see selectEdition), so a cached
   *  entry always belongs to the current edition. */
  const fetchPage = useCallback(
    async (n: number, ed: MushafEditionId = edition): Promise<ReaderPageData> => {
      /* The cache belongs to the current edition: a fetch for a
       * DIFFERENT edition (the selectEdition pre-fetch) must never
       * hit it — the entry for this page number is the old edition's
       * page. */
      const cached = ed === edition ? pagesRef.current[n] : undefined;
      if (cached) return cached;
      const res = await fetch(`/api/quran/reader-page/${n}?edition=${ed}`);
      if (!res.ok) throw new Error(`reader page ${n}: ${res.status}`);
      const d = (await res.json()) as ReaderPageData;
      setPages((p) => ({ ...p, [n]: d }));
      return d;
    },
    [edition],
  );
  const [tajweedOn, setTajweedOn] = useState(true);
  /** Whether the coach saves session recordings on this device
   *  (Settings → Data Usage → "Save audio data"). The coach reads
   *  the settings document when a session ends; the state here only
   *  feeds the toggle's displayed value. */
  const [saveAudio, setSaveAudio] = useState(true);
  /** Which screen Settings opens on: the gear opens main (null);
   *  the book button seeds the Mushaf Layout screen. */
  const [settingsSeed, setSettingsSeed] = useState<SettingsScreenId | null>(null);
  useEffect(() => {
    try {
      const s = loadSettings();
      setEdition(editionFromSettings(s, getScriptPref()));
      setTajweedOn(s.tajweedColors ?? true);
      setSaveAudio(s.saveAudio ?? true);
      setTranslationId(s.translationId ?? DEFAULT_TRANSLATION_ID);
      setTafsirId(s.tafsirId ?? TAFSIR_ID);
    } catch {
      /* defaults stand */
    }
  }, []);
  /* Settings subtree: the reader's translation + tafsir (Settings →
   * Translations / Tafsir). Defaults equal the reader's behaviour
   * before the screens existed (Khattab; Ibn Kathir Abridged). */
  const [translationId, setTranslationId] = useState(DEFAULT_TRANSLATION_ID);
  const [tafsirId, setTafsirId] = useState(TAFSIR_ID);
  /** The verse whose tafsir sheet is open (tapped ayah number), or null. */
  const [tafsirSheet, setTafsirSheet] = useState<string | null>(null);
  const selectTranslation = useCallback((id: number) => {
    setTranslationId(id);
    try {
      saveSettings({ ...loadSettings(), translationId: id });
    } catch {
      /* storage unavailable — the choice applies this session */
    }
    // Prime the offline cache for the surah on screen: the service
    // worker caches /api/quran responses for 7 days, so the first
    // open of a surah with this translation saves it for offline
    // reading. Khattab comes from its own route, not the proxy.
    // (`page` is the anchor page — visiblePage is derived later in
    // this component, so the prime uses the anchor's surah.)
    try {
      const surah = surahsOnMushafPageForEdition(page, edition)[0];
      if (surah) {
        if (id === KHATTAB_TRANSLATION_ID) void fetch(`/api/quran/khattab/${surah}`);
        else void fetch(`${API}/verses/by_chapter/${surah}?fields=text_uthmani&translations=${id}&per_page=all`);
      }
    } catch {
      /* cache priming must never break the selection */
    }
  }, [page]);
  const selectTafsir = useCallback((id: number) => {
    setTafsirId(id);
    try {
      saveSettings({ ...loadSettings(), tafsirId: id });
      // The surah pages keep their own copy of the choice (AyahClient
      // reads `TAFSIR_KEY`); write it too so both agree.
      window.localStorage.setItem(TAFSIR_KEY, String(id));
    } catch {
      /* storage unavailable — the choice applies this session */
    }
  }, []);
  /* Mushaf Type picker: switching editions re-renders the reader in
   *  the new print's own layout AND script — the page data is
   *  per-edition, so the current page is fetched in the new edition
   *  FIRST and the state only swaps once it lands (a failed fetch
   *  keeps the old edition). The page number is kept (the Madani
   *  editions differ by at most a page; Indo-Pak drifts by up to
   *  six) and clamped to the new edition's total. The old edition's
   *  cached pages and measured design widths are dropped with the
   *  swap — they belong to a different layout. */
  const selectEdition = useCallback(
    (id: MushafEditionId) => {
      if (id === edition) return;
      const target = Math.min(page, totalPagesForEdition(id));
      void fetchPage(target, id)
        .then(() => {
          setEdition(id);
          if (target !== page) setPage(target);
          setPages((p) => ({ [target]: p[target] }));
          setDesignWidths({});
          /* Continuous mode: restart the list at the new edition's
           * page — the range's other pages belong to the old
           * edition and are no longer cached. The pending prepend
           * baseline belongs to the old list too — drop it. */
          pendingPrependRef.current = null;
          if (isContinuous) {
            setTextRange({ start: target, end: target });
            setVisibleText(null);
          }
          try {
            saveSettings({ ...loadSettings(), mushafEdition: id });
            setScriptPref(scriptForEdition(id));
          } catch {
            /* storage unavailable — the choice applies this session */
          }
        })
        .catch(() => {
          /* new edition's page failed to load — stay on the old one */
        });
    },
    [edition, page, fetchPage, layoutMode],
  );
  const toggleTajweed = useCallback((v: boolean) => {
    setTajweedOn(v);
    try {
      saveSettings({ ...loadSettings(), tajweedColors: v });
    } catch {
      /* storage unavailable — the choice applies this session */
    }
  }, []);
  /** Settings subtree (commit E): Data Usage — whether the coach
   *  saves session recordings. The coach reads the document when a
   *  session ends, so persisting is the whole job here. */
  const toggleSaveAudio = useCallback((v: boolean) => {
    setSaveAudio(v);
    try {
      saveSettings({ ...loadSettings(), saveAudio: v });
    } catch {
      /* storage unavailable — the choice applies this session */
    }
  }, []);
  /* Settings subtree (2026-11-25): the Marking / Hidden Verses /
   * Listening choices the Settings screens own, kept as reader state
   * so they apply at once (the settings document is the persisted
   * copy — each handler writes it too). Defaults equal the reader's
   * behaviour before the screens existed. */
  const [detectMistakes, setDetectMistakes] = useState(true);
  const detectMistakesRef = useRef(true);
  const [hideMarkers, setHideMarkers] = useState(false);
  const [mistakeMarkingOn, setMistakeMarkingOn] = useState(true);
  const [similarOn, setSimilarOn] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const playSpeedRef = useRef(1);
  const [frequentMistakes, setFrequentMistakes] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => {
    try {
      const s = loadSettings();
      setDetectMistakes(s.detectMistakes !== false);
      detectMistakesRef.current = s.detectMistakes !== false;
      setHideMarkers(s.hideAyahMarkers === true);
      setMistakeMarkingOn(s.highlightMistakes !== false);
      setSimilarOn(s.colorSimilarPhrases === true);
      const sp = typeof s.playSpeed === 'number' && s.playSpeed >= 0.5 && s.playSpeed <= 1.75 ? s.playSpeed : 1;
      setPlaySpeed(sp);
      playSpeedRef.current = sp;
    } catch {
      /* defaults stand */
    }
    setFrequentMistakes(loadFrequentMistakeKeys());
  }, []);
  /* The word-level mistake history is written by the coach and the
   *  test page, not by the reader — the reader's own takes keep
   *  their mistakes in session state only. The set is therefore
   *  loaded once per mount above (a return from the coach remounts
   *  the reader), and the Marking toggle flips `mistakeMarkingOn`
   *  live without re-reading the store. */
  const toggleDetectMistakes = useCallback((v: boolean) => {
    setDetectMistakes(v);
    detectMistakesRef.current = v;
    try {
      saveSettings({ ...loadSettings(), detectMistakes: v });
    } catch {
      /* storage unavailable — the choice applies this session */
    }
    // Switched off mid-take: the live red words go away at once —
    // detection off means no flags, not stale ones.
    if (!v) setMistakeMap(new Map());
  }, []);
  const toggleHideMarkers = useCallback((v: boolean) => {
    setHideMarkers(v);
    try {
      saveSettings({ ...loadSettings(), hideAyahMarkers: v });
    } catch {
      /* storage unavailable — the choice applies this session */
    }
  }, []);
  const toggleMistakeMarking = useCallback((v: boolean) => {
    setMistakeMarkingOn(v);
    try {
      saveSettings({ ...loadSettings(), highlightMistakes: v });
    } catch {
      /* storage unavailable — the choice applies this session */
    }
  }, []);
  const toggleSimilar = useCallback((v: boolean) => {
    setSimilarOn(v);
    try {
      saveSettings({ ...loadSettings(), colorSimilarPhrases: v });
    } catch {
      /* storage unavailable — the choice applies this session */
    }
  }, []);
  const changePlaySpeed = useCallback((v: number) => {
    setPlaySpeed(v);
    playSpeedRef.current = v;
    try {
      saveSettings({ ...loadSettings(), playSpeed: v });
    } catch {
      /* storage unavailable — the choice applies this session */
    }
    // Apply to a playing clip at once; playNext applies it to the
    // next clip.
    try {
      if (playAudioRef.current) playAudioRef.current.playbackRate = v;
    } catch {
      /* no audio element yet */
    }
  }, []);
  const [textSize, setTextSize] = useState(1.6);
  const data = pages[page] ?? initial;

  /* Continuous modes (2026-11-25 refinement pass; Translation
   * joined 2026-11-26, Part 2): the loaded page range. The anchor
   * is `page`; the range grows downward as the user scrolls
   * (fetchPage fills the pages cache) and upward when they scroll
   * back. `page` itself never changes while scrolling, so a scroll
   * can never interrupt a live mic take or playback — the take's
   * reference text is the anchor page's ayahs. */
  const [textRange, setTextRange] = useState<{ start: number; end: number } | null>(null);
  const textRangeRef = useRef<{ start: number; end: number } | null>(null);
  textRangeRef.current = textRange;
  /* The position the user is actually looking at in a continuous
   * mode — drives the pill, the header row, the bookmark and the
   * mic/playback scope. */
  const [visibleText, setVisibleText] = useState<{ surah: number; page: number; juz: number; hizb: number } | null>(null);
  const visibleTextRef = useRef(visibleText);
  visibleTextRef.current = visibleText;
  /* The page the reader is effectively on: the visible page in a
   * continuous mode, the anchor page otherwise. */
  const visiblePage = isContinuous && visibleText ? visibleText.page : page;
  /* Prepending a page above the viewport: the scrollHeight before
   * the new page's verses arrive, so the scroll position can be
   * preserved once they render. Set by the upward extend, consumed
   * ONLY by the compensation effect when the prepend actually lands
   * (delta > 0), released on a fetch failure, and cleared whenever
   * the list itself is reset (a jump or edition switch) — the
   * baseline belongs to the old list, and a stale one would corrupt
   * the next compensation. While it is set, extend() fires nothing:
   * a second range change before the compensation runs would
   * overwrite it (see extend). */
  const pendingPrependRef = useRef<number | null>(null);
  /* A range-extension fetch in flight (one page at a time — the
   * scroll check must not cascade-load pages while data is still
   * arriving). */
  const textExtendingRef = useRef(false);
  /* Last deliberate scroll (user) — the follow-the-word scroll
   * during a mic take must not fight one. Programmatic scrolls
   * (follow-the-word) set programmaticScrollRef instead. */
  const lastUserScrollRef = useRef(0);
  const programmaticScrollRef = useRef(false);
  /* The most recently lit word (mic correct event or Listen's
   * sounding word) — the follow-the-word scroll reads this. */
  const latestLitKeyRef = useRef<string | null>(null);
  /* The loaded pages in a continuous mode, in order, with their verses
   *  AND their tajweed data — the continuous modes colour from the
   *  same per-page tajweed the Book reader uses (2026-11-26: the
   *  memo used to drop tajweed here, so Quran Text / Translation
   *  never had any colours to show). */
  const textPages = useMemo(() => {
    if (!textRange) return [];
    const out: { page: number; verses: MushafVerse[]; meta: ReaderPageData['meta']; tajweed: ReaderPageData['tajweed'] }[] = [];
    for (let p = textRange.start; p <= textRange.end; p++) {
      const d = pages[p];
      if (d) out.push({ page: p, verses: d.verses, meta: d.meta, tajweed: d.tajweed });
    }
    return out;
  }, [textRange, pages]);
  /* The passage the mic / Listen should use: in a continuous mode
   * the surah the user is actually looking at (from the loaded
   * pages); otherwise the current page's first surah. */
  const activeExpected = useMemo(() => {
    if (isContinuous) {
      const surah =
        visibleText?.surah ??
        (textPages.length > 0 ? pageExpected(textPages[0].verses)?.surah : undefined);
      if (!surah) return null;
      const verses: MushafVerse[] = [];
      for (const pg of textPages) {
        for (const v of pg.verses) {
          if (v.verse_key.startsWith(`${surah}:`)) verses.push(v);
        }
      }
      if (verses.length === 0) return null;
      return pageExpected(verses);
    }
    return pageExpected(data.verses);
  }, [layoutMode, visibleText, textPages, data]);
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
      if (v === 'book' || v === 'text' || v === 'translation') setLayoutMode(v);
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
  // Settings subtree (commit F): Hide Verses is a persisted setting
  // — restore the saved choice on mount. Test flows still flip it
  // in-session only (leaving a take turns it off); only the Settings
  // toggle writes the document.
  useEffect(() => {
    try {
      setHideVerses(loadSettings().hideVerses ?? false);
    } catch {
      /* default stands */
    }
  }, []);
  /** The Settings toggle for Hide Verses: flips the reader state
   *  and persists the choice. */
  const toggleHideVerses = useCallback(() => {
    setHideVerses((v) => {
      const next = !v;
      try {
        saveSettings({ ...loadSettings(), hideVerses: next });
      } catch {
        /* storage unavailable — the choice applies this session */
      }
      return next;
    });
  }, []);
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
    setBookmarked(loadBookmarks().some((b) => b.kind === 'page' && b.page === visiblePage));
  }, [visiblePage]);
  const [contentWidth, setContentWidth] = useState(390);
  const containerRef = useRef<HTMLDivElement | null>(null);
  /* Fit-to-height shrink, PER PAGE (2026-11-25 third refinement):
   * 1 normally; reduced only when that page would overflow the
   * viewport. The old single shared shrink was fitted only to the
   * current page and applied after the commit — so an incoming page
   * rendered at the outgoing page's shrink during the drag (full
   * width) and then suddenly narrowed when its own shrink landed:
   * the "drop" Mehran saw, and the swipe felt un-smooth. Each
   * column now carries its own shrink, computed from its own frame
   * before any drag, so the zoom a page has mid-drag is exactly
   * the zoom it keeps after the commit. */
  const [shrinks, setShrinks] = useState<Record<number, number>>({});
  const shrinksRef = useRef<Record<number, number>>({});
  const designWidthsRef = useRef(designWidths);
  designWidthsRef.current = designWidths;
  const contentWidthRef = useRef(contentWidth);
  contentWidthRef.current = contentWidth;
  const layoutModeRef = useRef(layoutMode);
  layoutModeRef.current = layoutMode;
  const busyRef = useRef(false);
  const dragRef = useRef<{ startX: number; startY: number; active: boolean; pointerId: number | null; captured: boolean }>({
    startX: 0,
    startY: 0,
    active: false,
    pointerId: null,
    captured: false,
  });

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
    const exists = list.some((b) => b.kind === 'page' && b.page === visiblePage);
    saveBookmarks(
      exists
        ? list.filter((b) => !(b.kind === 'page' && b.page === visiblePage))
        : [...list, { kind: 'page', page: visiblePage, addedAt: Date.now() }],
    );
    setBookmarked(!exists);
  }, [visiblePage]);
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
  /* Which line indices of page n are currently revealed (peeks).
   * The track renders three page columns, each with its own
   * `L{n}:` prefix, so the revealed set is computed per page. */
  const revealedLinesFor = useCallback(
    (n: number) => {
      const out = new Set<number>();
      const prefix = `L${n}:`;
      for (const k of revealed) {
        if (k.startsWith(prefix)) {
          const v = Number(k.slice(prefix.length));
          if (Number.isFinite(v)) out.add(v);
        }
      }
      return out;
    },
    [revealed],
  );

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
  /** Words the mistake sound already played for this take (the
   *  checker can re-emit a word — one sound per newly flagged word). */
  const mistakeSoundKeysRef = useRef(new Set<string>());
  /* Dropped Connection feedback (Settings → Dropped Connection):
   * when the network goes away mid-take, a sound + vibration, if
   * enabled. The coach has its own identical listener. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOffline = () => {
      if (micStateRef.current === 'recording') playDroppedFeedback();
    };
    window.addEventListener('offline', onOffline);
    return () => window.removeEventListener('offline', onOffline);
  }, []);
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
        // Detection off: only peeks survive — the engine's word flags
        // are not recorded (same gate as the live branch above).
        for (const w of result.words) {
          if ((w.status === 'wrong' || w.status === 'missed') && detectMistakesRef.current) {
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
          // The mushaf page the take was on — the Activity tab's
          // Pages chart counts distinct pages per day from this.
          page,
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
        // Detection off: the score counts peeks only — the engine's
        // word flags were never shown, so they must not count either.
        const wordMistakes = detectMistakesRef.current
          ? result.words.filter((w) => w.status === 'wrong' || w.status === 'missed').length
          : 0;
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
      // Session Start & Stop feedback: the same sound + vibration
      // when the take ends, if enabled.
      playSessionFeedback();
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
    // Reference text: the passage the reader is on — the visible
    // surah in a continuous mode, else the current page's ayahs
    // (first surah on the page — a session covers one surah).
    const expected = activeExpected;
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
    mistakeSoundKeysRef.current.clear();
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
          // Also the follow-the-word scroll's latest lit word.
          latestLitKeyRef.current = key;
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
        } else if ((e.status === 'wrong' || e.status === 'missed') && detectMistakesRef.current) {
          // Narrowed to 'wrong' | 'missed' by the branch — captured
          // here, because property narrowing does not survive into
          // the setState closure below.
          // Settings → Recitation → "Detect mistakes" off: this whole
          // branch is skipped — the word keeps whatever green it had
          // (follow-along only), no red flag, no mistake entry.
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
          // Mistake Feedback (Settings → Mistake Feedback): one sound
          // + vibration per newly flagged word, not per re-emitted
          // event — the checker can re-emit a word, so the per-take
          // set dedupes. (The helper honours the sound/vibrate
          // toggles; detection-off never reaches this branch.)
          if (!mistakeSoundKeysRef.current.has(key)) {
            mistakeSoundKeysRef.current.add(key);
            playMistakeFeedback();
          }
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
    // Session Start & Stop feedback (Settings → Session Start & Stop):
    // a sound + a short vibration when the take starts, if enabled.
    playSessionFeedback();
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
  }, [ensureEngine, setMic, stopMic, activeExpected]);

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
     same-origin proxy `/api/quran/verses/by_page/{n}?…&audio={reciter}`
     returns each verse's `audio.url` plus `audio.segments` — the
     per-word [index, position, startMs, endMs] timings inside the
     reciter's own audio. The reciter is the one picked in Settings →
     Reciters (default Mishary Alafasy, id 7 — the old reader's
     default, and the same voice as the spec's AlQuran Cloud
     `ar.alafasy` example). AlQuran Cloud's ayah audio carries
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
    // Listen play speed (Settings → Listening): the picked speed,
    // applied to every clip as it loads.
    try {
      audio.playbackRate = playSpeedRef.current;
    } catch {
      /* playbackRate unsupported — the clip still plays at 1x */
    }
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
    // The passage the reader is on — the visible surah in
    // a continuous mode, else the page's ayahs, first surah only
    // (same scope as a mic take).
    const expected = activeExpected;
    if (!expected) {
      setPlay('idle');
      showPlayError('Nothing to play on this page.');
      return;
    }
    let items: PlayItem[] = [];
    try {
      // The reciter is the one picked in Settings → Reciters
      // (settings doc `reciterId`, default 7 Alafasy).
      const reciterId = loadSettings().reciterId ?? DEFAULT_RECITER_ID;
      const res = await fetch(
        `/api/quran/verses/by_page/${visiblePage}?words=true&word_fields=text_uthmani,text_indopak,line_number,page_number,position,char_type_name&fields=text_uthmani&audio=${reciterId}`,
      );
      if (!res.ok) throw new Error(`by_page ${visiblePage}: ${res.status}`);
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
  }, [activeExpected, visiblePage, setPlay, showPlayError]);

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
        latestLitKeyRef.current = key;
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

  /* Per-column fit check (2026-11-25 third refinement): every track
   * column's zoom wrapper carries data-frame-page; one
   * ResizeObserver watches them (and the container, for resizes /
   * rotations) and fits EACH page's shrink from its own frame. The
   * shrink is derived from the frame's scrollHeight — the UNZOOMED
   * layout height (scrollHeight ignores the CSS zoom) — times that
   * page's own colScale, so the value never depends on the shrink
   * currently applied: no division by a transient shrink, no
   * oscillation, and a page's shrink is already final while it is
   * still an off-screen column, before any drag. A column is
   * skipped until its design width is measured (designWidths[n]
   * set): an unmeasured column would fit from the 970 default and
   * lock in a wrong shrink. Verified live 2026-11-25: scrollHeight
   * is stable at 1184 for page 3 across shrink changes, and the
   * formula gives the settled 0.854 — while the old check landed
   * 0.729 right after the commit and drifted to 0.854 seconds
   * later (the drop Mehran saw). */
  const runShrinkCheck = useCallback((n: number) => {
    if (layoutModeRef.current !== 'book') return;
    const main = containerRef.current;
    if (!main) return;
    const el = main.querySelector<HTMLElement>(`[data-frame-page="${n}"]`);
    if (!el) return;
    const dw = designWidthsRef.current[n];
    if (dw === undefined) return;
    const layoutH = el.scrollHeight;
    if (layoutH <= 0) return;
    const colScale = Math.max(0.3, Math.min(1, (contentWidthRef.current - 12) / dw));
    const col = el.closest('[data-track-page]');
    const headH = col && col.children.length > 0 ? (col.children[0] as HTMLElement).offsetHeight : 0;
    const footEl = col && col.children.length > 0 ? (col.children[col.children.length - 1] as HTMLElement) : null;
    const footH = footEl ? footEl.offsetHeight : 0;
    const chrome = headH + footH + 16; // pt-2 + pb-2 on the track wrapper
    const avail = main.clientHeight - chrome;
    if (avail <= 0) return;
    const next = Math.max(0.3, Math.min(1, avail / (layoutH * colScale)));
    const cur = shrinksRef.current[n] ?? 1;
    if (Math.abs(next - cur) > 0.005) {
      shrinksRef.current = { ...shrinksRef.current, [n]: next };
      setShrinks(shrinksRef.current);
    }
  }, []);

  useEffect(() => {
    if (layoutMode !== 'book') return;
    const main = containerRef.current;
    if (!main) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const t = entry.target as HTMLElement;
        const n = Number(t.dataset.framePage);
        if (n) runShrinkCheck(n);
        else {
          // The container itself resized (rotation): re-fit all.
          main.querySelectorAll<HTMLElement>('[data-frame-page]').forEach((el) => {
            runShrinkCheck(Number(el.dataset.framePage));
          });
        }
      }
    });
    main.querySelectorAll<HTMLElement>('[data-frame-page]').forEach((el) => {
      ro.observe(el);
      runShrinkCheck(Number(el.dataset.framePage));
    });
    ro.observe(main);
    return () => ro.disconnect();
  }, [page, layoutMode, pages, runShrinkCheck]);

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

  // Pre-fetch the neighbouring pages so swipes are instant.
  useEffect(() => {
    for (const n of [page - 1, page + 1]) {
      if (n >= 1 && n <= totalPages && !pagesRef.current[n]) {
        fetchPage(n).catch(() => {});
      }
    }
  }, [page, fetchPage]);

  const handleMeasure = useCallback((p: number) => {
    return (maxNatural: number) => {
      // Snap to 4px: the measurer's sub-pixel readings otherwise
      // wobble dw by ±1px, scale/zoom follow, the measure effect
      // re-runs on the zoom change, and React hits max update depth.
      // The +16 is the frame's side padding (px-2, 8px each side):
      // it must match ReaderPage's frame padding, or the frame is
      // sized wider than its text and the filler over-stretches.
      const dw = Math.max(480, Math.min(970, Math.round((maxNatural * 1.04 + 16) / 4) * 4));
      setDesignWidths((d) => (d[p] === dw ? d : { ...d, [p]: dw }));
    };
  }, []);

  const snapBack = useCallback(() => {
    setAnimating(true);
    setOffset(0);
    window.setTimeout(() => setAnimating(false), 200);
  }, []);

  const goToPage = useCallback(
    async (target: number, dir: 1 | -1) => {
      if (busyRef.current) return;
      busyRef.current = true;
      const w = contentWidth;
      // The target column is pre-rendered (pre-fetch on page change
      // + on pointerdown), so its data is normally cached and this
      // resolves at once — the settle never waits on the network.
      // Only an uncached page waits for its fetch, and a failed
      // fetch snaps back instead of turning.
      if (!pagesRef.current[target]) {
        try {
          await fetchPage(target);
        } catch {
          busyRef.current = false;
          snapBack();
          return;
        }
      }
      // Settle (2026-11-25 second refinement): the track is already
      // at the finger's release point (offset = dx). Animate it the
      // short way to the snap point — next page = +w, previous = -w
      // — with a short ease-out, then commit the page and re-centre
      // the track in the same tick (no transition), so the reset is
      // invisible: the newly centred column is the page just
      // revealed. No teleport, no re-render wait, no double flash.
      setAnimating(true);
      setOffset(dir > 0 ? w : -w);
      await wait(200);
      setAnimating(false);
      setPage(target);
      setOffset(0);
      busyRef.current = false;
    },
    [fetchPage, snapBack, contentWidth],
  );

  const jumpToPage = useCallback(
    (target: number) => {
      if (target < 1 || target > totalPages || target === page) return;
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
   * left to native scrolling (touch-action: pan-y). In the
   * continuous modes there is no page turn — the content scrolls.
   * Direction (Mehran, 2026-11-25): a left-to-right swipe turns
   * FORWARD (page 2, 3, …) and right-to-left comes BACK. The next
   * page sits to the left in this RTL book, so dragging rightward
   * turns forward. During the drag the track follows the finger
   * 1:1 (see onPointerMove) — the next page is already sliding
   * into view under the touch. */
  const onPointerDown = (e: React.PointerEvent) => {
    if (isContinuous) return;
    if (busyRef.current) return;
    // A mouse drag over the page selects text (brand-yellow
    // ::selection) and the track keeps its DOM nodes alive across
    // the turn, so the selection survives the page commit and sits
    // on the new page's header. Clear any stale selection here;
    // select-none on <main> stops new ones forming.
    window.getSelection()?.removeAllRanges();
    // Pre-fetch the neighbouring pages so their track columns are
    // populated before the drag reveals them.
    for (const n of [page - 1, page + 1]) {
      if (n >= 1 && n <= totalPages && !pagesRef.current[n]) {
        fetchPage(n).catch(() => {});
      }
    }
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
    if (d.startX < 24 && dx > 0) {
      // Left-edge drag to the right: the browser's back-swipe.
      // Let the browser have it instead of turning the page.
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
    // Resistance at the ends of the book (rightward = forward now:
    // no previous page on page 1 when dragging left, no next page
    // on the last page when dragging right).
    let o = dx;
    if ((page === 1 && dx < 0) || (page === totalPages && dx > 0)) o = dx * 0.35;
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
      // Mehran (2026-11-25): left-to-right goes to the NEXT page,
      // right-to-left comes BACK to the previous one.
      const dir = dx > 0 ? 1 : -1;
      const target = page + dir;
      if (target < 1 || target > totalPages) {
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

  /* The pill / header row follow what the user is actually looking
   * at: the visible surah and page in a continuous mode, the
   * anchor page otherwise. */
  const pillMeta =
    isContinuous && visibleText
      ? {
          surahName: surahName(visibleText.surah),
          page: visibleText.page,
          juz: visibleText.juz,
          hizb: visibleText.hizb,
        }
      : { surahName: meta.surahName, page, juz: meta.juz, hizb: meta.hizb };

  /* Layout-mode change (2026-11-25 refinement pass; Translation
   * joined the continuous modes 2026-11-26, Part 2): entering a
   * continuous mode starts the list at the anchor page; leaving one
   * lands on the page actually being read — but never interrupts a
   * live take or playback. Also resets any in-flight slide offset
   * so a mode switch can never leave the page shifted. */
  const prevLayoutModeRef = useRef<ReaderLayoutMode>('text');
  useEffect(() => {
    const prev = prevLayoutModeRef.current;
    prevLayoutModeRef.current = layoutMode;
    if (prev !== layoutMode) {
      setOffset(0);
      setAnimating(false);
      if (isContinuous) {
        // The list restarts: any pending prepend baseline belongs to
        // the old list — drop it (see pendingPrependRef).
        pendingPrependRef.current = null;
        setTextRange({ start: page, end: page });
        setVisibleText(null);
        window.setTimeout(() => containerRef.current?.scrollTo({ top: 0 }), 0);
      } else if (prev === 'text' || prev === 'translation') {
        const vt = visibleTextRef.current;
        if (vt && vt.page !== page && micStateRef.current === 'idle' && playStateRef.current === 'idle') {
          jumpToPage(vt.page);
        }
      }
      return;
    }
    // Same mode, but the anchor page changed — a ChapterSheet jump
    // (or the gift's return to Page 1) while in a continuous mode:
    // restart the list at the new page.
    if (isContinuous) {
      // The list restarts: any pending prepend baseline belongs to
      // the old list — drop it (see pendingPrependRef).
      pendingPrependRef.current = null;
      setTextRange({ start: page, end: page });
      setVisibleText(null);
      window.setTimeout(() => containerRef.current?.scrollTo({ top: 0 }), 0);
    }
  }, [layoutMode, page, jumpToPage]);

  /* Continuous-mode scroll tracking (text + translation): the
   * topmost visible ayah sets the visible position (pill / header /
   * bookmark / mic scope), and approaching either end of the loaded
   * range extends it by one page (one fetch at a time, so the check
   * cannot cascade-load pages while data is still arriving). The
   * text ayahs carry [data-text-ayah], the translation ayah blocks
   * [data-translation-ayah]; both expose the same dataset. */
  useEffect(() => {
    if (!isContinuous) return;
    const mainEl = containerRef.current;
    if (!mainEl) return;
    let rafId = 0;
    let scheduled = false;
    const extend = (target: number) => {
      if (textExtendingRef.current) return;
      /* One range change in flight at a time — and a prepend counts
       * as in flight until its compensation has run, not just until
       * its fetch resolves. A cached fetch resolves in a microtask,
       * clearing textExtendingRef before the compensation effect
       * has run, so without this guard the scroll check fires a
       * second upward extend while scrollTop is still 0: the second
       * extend overwrites pendingPrependRef with the post-prepend
       * scrollHeight, the first prepend is never compensated for,
       * and the viewport ends up two pages above the jump target
       * (seen 2026-11-26: sheet jump to Juz 30 landed p584 instead
       * of p586 in Quran Text mode). The same guard covers the
       * downward branch: an append while a prepend is pending would
       * inflate the compensation delta the same way. */
      if (pendingPrependRef.current !== null) return;
      const range = textRangeRef.current;
      if (!range) return;
      if (target === range.end + 1 && target <= totalPages) {
        textExtendingRef.current = true;
        textRangeRef.current = { start: range.start, end: target };
        setTextRange(textRangeRef.current);
        fetchPage(target)
          .catch(() => {})
          .finally(() => {
            textExtendingRef.current = false;
          });
      } else if (target === range.start - 1 && target >= 1) {
        textExtendingRef.current = true;
        pendingPrependRef.current = mainEl.scrollHeight;
        textRangeRef.current = { start: target, end: range.end };
        setTextRange(textRangeRef.current);
        fetchPage(target)
          .catch(() => {
            /* The prepended page never arrived: release the
             * compensation baseline, or the guard above would block
             * every further extension for the rest of the session
             * (the ref is otherwise only cleared when a prepend
             * actually lands). */
            pendingPrependRef.current = null;
          })
          .finally(() => {
            textExtendingRef.current = false;
          });
      }
    };
    const check = () => {
      scheduled = false;
      const range = textRangeRef.current;
      if (!range) return;
      const top = mainEl.getBoundingClientRect().top;
      const els = mainEl.querySelectorAll('[data-text-ayah], [data-translation-ayah]');
      for (const el of els) {
        const r = (el as HTMLElement).getBoundingClientRect();
        if (r.bottom > top + 90) {
          const ds = (el as HTMLElement).dataset;
          const cur = {
            surah: Number(ds.surah),
            page: Number(ds.page),
            juz: Number(ds.juz),
            hizb: Number(ds.hizb ?? 1),
          };
          if (visibleTextRef.current?.surah !== cur.surah || visibleTextRef.current?.page !== cur.page) {
            visibleTextRef.current = cur;
            setVisibleText(cur);
          }
          break;
        }
      }
      if (mainEl.scrollHeight - mainEl.scrollTop - mainEl.clientHeight < 1000) {
        extend(range.end + 1);
      } else if (mainEl.scrollTop < 400) {
        extend(range.start - 1);
      }
    };
    const onScroll = () => {
      if (programmaticScrollRef.current) {
        programmaticScrollRef.current = false;
        return;
      }
      lastUserScrollRef.current = Date.now();
      if (scheduled) return;
      scheduled = true;
      rafId = requestAnimationFrame(check);
    };
    mainEl.addEventListener('scroll', onScroll, { passive: true });
    check();
    return () => {
      mainEl.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [layoutMode, textRange, fetchPage]);

  /* Prepending a page above the viewport must not move the text
   * the user is reading: once the new page's verses render, shift
   * the scroll position down by exactly the height they added.
   * The ref is consumed ONLY when a prepend actually landed
   * (delta > 0): the range change itself re-renders textPages with
   * the new page still unfetched, and consuming the ref on that
   * no-op run lost the shift — the viewport then stayed at the top
   * and showed the prepended page instead of the one the user was
   * on (seen 2026-11-26 in Translation mode, where a tall page
   * makes the upward branch fire first on a ChapterSheet jump). */
  useEffect(() => {
    const mainEl = containerRef.current;
    const before = pendingPrependRef.current;
    if (!mainEl || before === null) return;
    const delta = mainEl.scrollHeight - before;
    if (delta <= 0) return;
    pendingPrependRef.current = null;
    mainEl.scrollTop += delta;
  }, [textPages]);

  /* Follow the lit word in continuous modes: during Listen the
   * view follows the recitation; during a mic take it follows only
   * while the user has not scrolled themselves in the last 2 s, so
   * it never fights a deliberate scroll. Book mode needs none of
   * this — the whole page is always in view. */
  useEffect(() => {
    if (!isContinuous) return;
    const key = latestLitKeyRef.current;
    if (!key) return;
    const isPlayback = playStateRef.current === 'playing' || playStateRef.current === 'paused';
    const isTake = micStateRef.current === 'recording';
    if (!isPlayback && !isTake) return;
    if (isTake && !isPlayback && Date.now() - lastUserScrollRef.current < 2000) return;
    // The lit word's ayah: a word can cover two engine tokens and
    // the span id only carries the first key, so the ayah is the
    // reliable anchor — the lit word is inside it.
    const [s, a] = key.split(':');
    const el = document.querySelector(`[data-verse-key="${s}:${a}"]`);
    const mainEl = containerRef.current;
    if (!el || !mainEl) return;
    const r = el.getBoundingClientRect();
    const m = mainEl.getBoundingClientRect();
    if (r.top < m.top + 80 || r.bottom > m.bottom - 24) {
      programmaticScrollRef.current = true;
      el.scrollIntoView({ block: 'center' });
    }
  }, [playingWordKey, highlightedWords, layoutMode]);

  /* Page header row (whole-page reference): surah name left, Play +
   * Juz / Hizb right. Shared by the track columns (each column shows
   * its own page's meta) and by the continuous modes (pillMeta).
   * Only the current column carries the fit-check ref and the Play
   * button's testid — the side columns are inert. */
  const renderHeaderRow = (
    hm: { surahName: string; juz: number; hizb: number },
    isCurrent: boolean,
  ) => (
    <div className="flex items-center justify-between px-2 pb-1">
      <span className="text-[15px] font-medium" style={{ color: INK }}>
        {hm.surahName}
      </span>
      <span className="flex items-center gap-2">
        {/* Phase 7 — Listen: play this surah's recitation (Mishary
            Alafasy); the words light up green as they sound. Tap
            again to pause, tap once more to resume; a page turn
            stops it. */}
        <button
          type="button"
          aria-label={
            playState === 'playing'
              ? 'Pause recitation'
              : playState === 'paused'
                ? 'Resume recitation'
                : playState === 'loading'
                  ? 'Loading recitation audio'
                  : `Play ${hm.surahName} recitation`
          }
          aria-pressed={playState === 'playing'}
          data-testid={isCurrent ? 'reader-play-button' : undefined}
          data-play-state={isCurrent ? playState : undefined}
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
          <span>Juz {hm.juz}</span>
          <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" fill="none" style={{ stroke: INK }} strokeWidth="1.2" />
            <circle cx="6" cy="6" r="1.4" style={{ fill: INK }} />
          </svg>
          <span>Hizb {hm.hizb}</span>
        </span>
      </span>
    </div>
  );

  /* One column of the page-turn track (2026-11-25 second
   * refinement): the header row for that page's meta, the Book page
   * content, and the page number pinned to the bottom-right by
   * mt-auto. The track is Book-only since 2026-11-26 (Part 2):
   * Translation left the track for the continuous scroll, so this
   * column always renders ReaderPage. The column's own design width
   * and scale are computed per page, so an adjacent page is already
   * laid out at full size before the drag reveals it — and its own
   * fit shrink is already final too (third refinement), so the
   * commit changes nothing. Off-screen columns are inert (their
   * buttons are not focusable or clickable) and carry
   * data-track-page so a deploy can be proven live by the
   * attribute's presence. Each column's zoom wrapper carries
   * data-frame-page so the per-page fit check can find it. */
  const renderPageColumn = (n: number, isCurrent: boolean) => {
    const pd = pages[n];
    const colMeta = pd?.meta ?? data.meta;
    const dw = designWidths[n] ?? 970;
    // Only 12px of the content width is held back (6px each side):
    // the text must occupy the full available space (2026-11-25
    // second refinement — the old 32px left a wide empty margin
    // around every page). The shrink is this page's own fit.
    const colScale = Math.max(0.3, Math.min(1, (contentWidth - 12) / dw));
    const zoom = colScale * (shrinks[n] ?? 1);
    const verses = pd?.verses ?? [];
    const tajweed = pd?.tajweed ?? {};
    return (
      <div
        data-track-page={n}
        inert={!isCurrent}
        className="flex min-h-full shrink-0 flex-col"
        style={{ width: contentWidth }}
      >
        {renderHeaderRow(colMeta, isCurrent)}
        <div data-frame-page={n} className="w-full" style={{ zoom }}>
          <ReaderPage
            key={n}
            page={n}
            verses={verses}
            tajweed={tajweed}
            script={scriptForEdition(edition)}
            tajweedOn={tajweedOn}
            designWidth={dw}
            onMeasure={handleMeasure(n)}
            zoom={zoom}
            hideVerses={hideVerses}
            revealedLines={revealedLinesFor(n)}
            onRevealLine={(ln, info) => reveal(`L${n}:${ln}`, info)}
            highlightedWords={displayHighlightedWords}
            mistakes={mistakeMap}
            onMistakeWordClick={openMistakeTooltip}
            hideMarkers={hideMarkers}
            frequentMistakes={frequentMistakes}
            mistakeMarkingOn={mistakeMarkingOn}
            similarOn={similarOn}
            onRosetteClick={(verseKey) => setTafsirSheet(verseKey)}
          />
        </div>
        <div className="mt-auto flex justify-end px-2 pt-1">
          <span className="text-[15px]" style={{ color: INK }}>
            {n}
          </span>
        </div>
      </div>
    );
  };

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
              {pillMeta.surahName}
            </p>
            <p className="truncate text-[11.5px] leading-tight" style={{ color: MUTED }}>
              Page {pillMeta.page} | Juz {pillMeta.juz} | Hizb {pillMeta.hizb}
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
            onClick={() => {
              // The gear opens Settings at the main screen (no seed).
              setSettingsSeed(null);
              setOpenModal('settings');
            }}
            className="flex h-9 w-9 items-center justify-center"
          >
            <IconGear />
          </button>
        </div>
      </header>

      {/* Mushaf page (swipe area) */}
      <main
        ref={containerRef}
        className="relative min-h-0 flex-1 select-none overflow-y-auto [touch-action:pan-y]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="mx-auto flex min-h-full w-full max-w-[520px] flex-col justify-start overflow-x-clip pb-2 pt-2">
          {/* Book: a three-column track [page+1, page, page-1] in a
              content-width window. The track is translated by
              -contentWidth + offset, so the current page is centred
              at rest; during a drag it follows the finger 1:1, and
              on release it settles the short way to the snap point
              (see goToPage). The wrapper clips the off-screen
              columns (overflow-x-clip above). The continuous modes
              (Text, Translation) have no track — they scroll
              natively, one flow over the loaded page range. */}
          {isContinuous ? (
            <>
              {renderHeaderRow(pillMeta, true)}
              {playError && (
                <p role="alert" data-testid="play-error" className="px-2 pb-1 text-center text-[13px] leading-snug" style={{ color: '#DC2626' }}>
                  {playError}
                </p>
              )}
              {layoutMode === 'text' ? (
                <ReaderContinuousText
                  pages={textPages}
                  textSize={textSize}
                  onTextSizeChange={changeTextSize}
                  highlightedWords={displayHighlightedWords}
                  mistakes={mistakeMap}
                  onMistakeWordClick={openMistakeTooltip}
                  hideVerses={hideVerses}
                  revealed={revealed}
                  onReveal={reveal}
                  script={scriptForEdition(edition)}
                  tajweedOn={tajweedOn}
                />
              ) : (
                <ReaderTranslationMode
                  pages={textPages}
                  hideVerses={hideVerses}
                  revealed={revealed}
                  onReveal={reveal}
                  highlightedWords={displayHighlightedWords}
                  mistakes={mistakeMap}
                  onMistakeWordClick={openMistakeTooltip}
                  translationId={translationId}
                  onRosetteClick={(verseKey) => setTafsirSheet(verseKey)}
                  script={scriptForEdition(edition)}
                  tajweedOn={tajweedOn}
                />
              )}
            </>
          ) : (
            <>
              {playError && (
                <p role="alert" data-testid="play-error" className="px-2 pb-1 text-center text-[13px] leading-snug" style={{ color: '#DC2626' }}>
                  {playError}
                </p>
              )}
              <div
                className="flex min-h-full flex-1"
                style={{
                  width: `${3 * contentWidth}px`,
                  transform: `translateX(${-contentWidth + offset}px)`,
                  transition: animating ? 'transform 200ms ease-out' : 'none',
                }}
              >
                {renderPageColumn(page + 1, false)}
                {renderPageColumn(page, true)}
                {renderPageColumn(page - 1, false)}
              </div>
            </>
          )}
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
            onClick={() => {
              // The book button opens the full Mushaf Layout screen
              // (Settings subtree, commit E) — the Phase 1 bottom
              // sheet is retired. Back returns to the reader.
              setSettingsSeed('mushafLayout');
              setOpenModal('settings');
            }}
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
        onOpenSettings={() => {
          // Dashboard → Settings always starts at main (no seed).
          setSettingsSeed(null);
          setOpenModal('settings');
        }}
        onOpenGift={() => setOpenModal('gift')}
        onTestYourself={() => {
          setOpenModal(null);
          router.push('/hifz/test');
        }}
      />

      {/* Search screen (Step 3): full-screen overlay. A result jumps
          the reader straight to its page. */}
      <ReaderSearch
        open={openModal === 'search'}
        onClose={() => setOpenModal(null)}
        onSelectPage={(p) => {
          setOpenModal(null);
          jumpToPage(p);
        }}
        edition={edition}
      />

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
          button returns to the reader. TEST YOURSELF navigates to the
          dedicated test page (/hifz/test); the Mushaf Layout row opens
          the layout sheet. */}
      <ReaderSettings
        open={openModal === 'settings'}
        onClose={() => {
          setOpenModal(null);
          setSettingsSeed(null);
        }}
        onTestYourself={() => {
          setOpenModal(null);
          router.push('/hifz/test');
        }}
        initialScreen={settingsSeed}
        hideVerses={hideVerses}
        onToggleHideVerses={toggleHideVerses}
        detectMistakes={detectMistakes}
        onToggleDetectMistakes={toggleDetectMistakes}
        hideMarkers={hideMarkers}
        onToggleHideMarkers={toggleHideMarkers}
        mistakeMarkingOn={mistakeMarkingOn}
        onToggleMistakeMarking={toggleMistakeMarking}
        similarOn={similarOn}
        onToggleSimilar={toggleSimilar}
        tajweedOn={tajweedOn}
        onToggleTajweed={toggleTajweed}
        playSpeed={playSpeed}
        onPlaySpeedChange={changePlaySpeed}
        translationId={translationId}
        onSelectTranslation={selectTranslation}
        tafsirId={tafsirId}
        onSelectTafsir={selectTafsir}
        layoutMode={layoutMode}
        onSelectLayout={selectLayoutMode}
        editionLabel={mushafEditionById(edition).name}
        edition={edition}
        onSelectEdition={selectEdition}
        page={visiblePage}
        pageVerses={pages[visiblePage]?.verses ?? null}
        script={scriptForEdition(edition)}
        saveAudio={saveAudio}
        onToggleSaveAudio={toggleSaveAudio}
      />

      {/* Chapter / Juz selection bottom sheet (Step 2) */}
      <ChapterSheet
        open={openModal === 'sheet'}
        onClose={() => setOpenModal(null)}
        currentSurahId={surahsOnMushafPageForEdition(visiblePage, edition)[0] ?? 1}
        currentJuz={pillMeta.juz}
        onSelectSurah={(id) => {
          setOpenModal(null);
          jumpToPage(surahFirstPageForEdition(edition)[id] ?? 1);
        }}
        onSelectPage={(p) => {
          setOpenModal(null);
          jumpToPage(p);
        }}
        edition={edition}
      />

      {/* The Mushaf Layout bottom sheet (Phase 1) and the standalone
          Mushaf Type overlay (fourth refinement) are retired in
          commit E: both live in the Settings stack now — the book
          button opens Settings seeded at the Mushaf Layout screen,
          and the Mushaf Type screen is one stack push deeper. */}

      {/* Tafsir sheet (Settings subtree): tapping an ayah number in
          the reader opens this bottom sheet with that verse's tafsir
          from the selected tafsir (Settings → Tafsir). TafsirBlock
          is mounted here for one verse at a time, on a tap — not as
          a per-ayah list in another view, which is what its header
          note warns against. */}
      {tafsirSheet && (
        <div
          className="absolute inset-0 z-[80] flex items-end justify-center bg-black/40"
          role="presentation"
          onClick={() => setTafsirSheet(null)}
        >
          <div
            className="max-h-[75%] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`Tafsir for ${tafsirSheet}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-bold" style={{ color: INK }}>
                  Tafsir — {tafsirSheet}
                </h2>
                <p className="mt-0.5 text-[13px]" style={{ color: MUTED }}>
                  {tafsirName(tafsirId)} — change it in Settings → Tafsir.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close tafsir"
                onClick={() => setTafsirSheet(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D1D5DB] bg-white text-[16px] font-bold"
                style={{ color: INK }}
              >
                ×
              </button>
            </div>
            <div className="mt-4">
              <TafsirBlock key={`${tafsirSheet}:${tafsirId}`} verseKey={tafsirSheet} tafsirId={tafsirId} />
            </div>
          </div>
        </div>
      )}

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
