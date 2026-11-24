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
// The mic is still visual only — no recording logic yet. No bottom
// tab bar.

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

/** The one modal open at a time (Phase 1). */
type ReaderModal = 'dashboard' | 'sheet' | 'search' | 'gift' | 'settings' | 'layout' | 'mistakes';

const PAGE_BG = '#F7F7F5';
const INK = '#111827';
const MUTED = '#6B7280';

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
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
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
      <g fill={INK}>
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
        fill={INK}
      />
      <path d="M12 6.8v11.1" stroke="#FFFFFF" strokeWidth="1.1" />
    </svg>
  );
}
function IconEyeOff() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12C5 7.5 8.5 5.5 12 5.5c3.5 0 7 2 9.5 6.5-2.5 4.5-6 6.5-9.5 6.5-3.5 0-7-2-9.5-6.5Z" />
      <circle cx="12" cy="12" r="2.6" fill={INK} stroke="none" />
      <path d="M4.5 4.5l15 15" />
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
  const reveal = useCallback((key: string) => {
    setRevealed((r) => {
      const next = new Set(r);
      next.add(key);
      return next;
    });
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
      if (h > avail) {
        const next = Math.max(0.3, Math.min(1, shrinkRef.current * (avail / h)));
        if (Math.abs(next - shrinkRef.current) > 0.005) {
          shrinkRef.current = next;
          setShrink(next);
        }
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
          <div
            className="w-full"
            style={{
              transform: `translateX(${offset}px)`,
              transition: animating ? 'transform 280ms ease' : 'none',
            }}
          >
            {/* Page header row (whole-page reference): surah name
                left, Juz / Hizb right. */}
            <div ref={pageHeadRef} className="flex items-center justify-between px-2 pb-2">
              <span className="text-[15px] font-medium" style={{ color: INK }}>
                {meta.surahName}
              </span>
              <span className="flex items-center gap-2 text-[15px]" style={{ color: INK }}>
                <span>Juz {meta.juz}</span>
                <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
                  <circle cx="6" cy="6" r="4.5" fill="none" stroke={INK} strokeWidth="1.2" />
                  <circle cx="6" cy="6" r="1.4" fill={INK} />
                </svg>
                <span>Hizb {meta.hizb}</span>
              </span>
            </div>
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
                  onRevealLine={(ln) => reveal(`L${page}:${ln}`)}
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
              />
            ) : (
              <ReaderTranslationMode
                key={page}
                verses={data.verses}
                hideVerses={hideVerses}
                revealed={revealed}
                onReveal={reveal}
              />
            )}
            {/* Page number, bottom-right (whole-page reference). */}
            <div ref={pageFootRef} className="flex justify-end px-2 pt-2">
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
          <button
            type="button"
            aria-label="Recent mistakes"
            onClick={() => setOpenModal('mistakes')}
            className="flex h-11 items-center rounded-full border-[1.5px] border-[#111827] bg-white px-5 text-[15px] font-bold shadow-sm"
            style={{ color: INK }}
          >
            Mistakes
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
              backgroundColor: hideVerses ? '#F0FDF4' : '#FFFFFF',
            }}
          >
            <IconEyeOff />
          </button>
        </div>
        {/* Mic: solid mint, soft green glow, raised above the bar */}
        <button
          type="button"
          aria-label="Recite"
          className="absolute bottom-3 right-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            background: 'radial-gradient(circle at 50% 42%, #C9F7D4 0%, #7BE3A8 48%, #34D399 100%)',
            boxShadow: '0 0 26px 7px rgba(52, 211, 153, 0.45), 0 4px 14px rgba(0,0,0,0.12)',
          }}
        >
          <IconMic />
        </button>
      </footer>

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
          button returns to the reader. */}
      <ReaderSettings open={openModal === 'settings'} onClose={() => setOpenModal(null)} />

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

      {/* Mistakes modal (Phase 1): mock entries for now — real
          mistakes come from the recitation coach. */}
      <ReaderMistakes open={openModal === 'mistakes'} onClose={() => setOpenModal(null)} />
    </div>
  );
}
