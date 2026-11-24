// app/hifz/components/ReaderScreen.tsx — the reader screen (Step 1
// of the step-by-step Tarteel match): the default landing page.
// Full-height mobile-first layout: fixed top bar (hamburger, pill
// with surah / Page / Juz / Hizb + bookmark, search / gift /
// settings), scrollable mushaf page, fixed bottom bar (Mistakes,
// book, eye-off, glowing mic). Horizontal swipe (touch + mouse drag)
// turns the page like a physical Mushaf; the top-bar pill updates.
// Mic / Mistakes / book / eye are visual only in this step — no
// recording logic, no navigation. No bottom tab bar.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSurahBySlug } from '../surahs';
import { SURAH_FIRST_PAGE, MUSHAF_TOTAL_PAGES, surahsOnMushafPage } from '../mushaf';
import type { ReaderPageData } from '../lib/reader-page';
import ReaderPage from './ReaderPage';
import SurahList from './SurahList';
import ChapterSheet from './ChapterSheet';
import ReaderSearch from './ReaderSearch';
import ReaderGift from './ReaderGift';

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
function IconBookmark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path d="M6.5 3.5h11V21L12 16.5 6.5 21V3.5Z" fill="#9CA3AF" />
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [contentWidth, setContentWidth] = useState(390);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const busyRef = useRef(false);
  const dragRef = useRef<{ startX: number; startY: number; active: boolean; pointerId: number | null }>({
    startX: 0,
    startY: 0,
    active: false,
    pointerId: null,
  });

  const data = pages[page] ?? initial;
  const designWidth = designWidths[page] ?? 970;
  // Scale the design-width frame to the (phone-width) content area.
  // Capped at 1 so a short page never blows up on a wide screen.
  const scale = Math.max(0.3, Math.min(1, (contentWidth - 32) / designWidth));

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
      const dw = Math.max(480, Math.min(970, Math.round(maxNatural * 1.04) + 48));
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
    dragRef.current = { startX: e.clientX, startY: e.clientY, active: true, pointerId: e.pointerId };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
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

  /* Chapter drawer: intercept mushaf-page + surah links so the jump
   * stays inside this reader; anything else navigates normally. */
  const onDrawerClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a');
    if (!a) return;
    const href = a.getAttribute('href') ?? '';
    const mushaf = href.match(/^\/hifz\/mushaf\/(\d+)/);
    if (mushaf) {
      e.preventDefault();
      setDrawerOpen(false);
      jumpToPage(Number(mushaf[1]));
      return;
    }
    const surah = href.match(/^\/hifz\/([a-z0-9-]+)$/);
    if (surah) {
      const s = getSurahBySlug(surah[1]);
      if (s) {
        e.preventDefault();
        setDrawerOpen(false);
        jumpToPage(SURAH_FIRST_PAGE[s.id] ?? 1);
      }
    }
  };

  const meta = data.meta;

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden" style={{ backgroundColor: PAGE_BG }}>
      {/* Top navigation bar — raised above the chapter-sheet overlay
          while the sheet is open, so the top bar stays undimmed. */}
      <header
        className={`relative flex shrink-0 items-center gap-2 border-b border-[#E8E8E4] px-3 py-2.5 ${sheetOpen ? 'z-50' : ''}`}
        style={{ backgroundColor: PAGE_BG }}
      >
        <button
          type="button"
          aria-label="Chapters"
          onClick={() => {
            setSheetOpen(false);
            setDrawerOpen(true);
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center"
        >
          <IconMenu />
        </button>
        <button
          type="button"
          aria-label="Chapters and Juz lists"
          onClick={() => {
            setDrawerOpen(false);
            setSheetOpen(true);
          }}
          className="flex min-w-0 flex-1 items-center rounded-[12px] border border-[#D1D5DB] bg-white px-3.5 py-1.5 text-left"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold leading-tight" style={{ color: INK }}>
              {meta.surahName}
            </p>
            <p className="truncate text-[11.5px] leading-tight" style={{ color: MUTED }}>
              Page {page} | Juz {meta.juz} | Hizb {meta.hizb}
            </p>
          </div>
          <span className="ml-2 shrink-0">
            <IconBookmark />
          </span>
        </button>
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            aria-label="Search"
            onClick={() => {
              setDrawerOpen(false);
              setSheetOpen(false);
              setSearchOpen(true);
            }}
            className="flex h-9 w-9 items-center justify-center"
          >
            <IconSearch />
          </button>
          <button
            type="button"
            aria-label="Gifts"
            onClick={() => {
              setDrawerOpen(false);
              setSheetOpen(false);
              setSearchOpen(false);
              setGiftOpen(true);
            }}
            className="flex h-9 w-9 items-center justify-center"
          >
            <IconGift />
          </button>
          <button type="button" aria-label="Settings" className="flex h-9 w-9 items-center justify-center">
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
        <div className="mx-auto flex min-h-full w-full max-w-[520px] flex-col justify-start pb-6 pt-32">
          <div
            className="w-full"
            style={{
              transform: `translateX(${offset}px)`,
              transition: animating ? 'transform 280ms ease' : 'none',
            }}
          >
            <div className="w-full" style={{ zoom: scale }}>
              <ReaderPage
                key={page}
                page={page}
                verses={data.verses}
                tajweed={data.tajweed}
                designWidth={designWidth}
                onMeasure={handleMeasure(page)}
              />
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
            className="flex h-11 items-center rounded-full border-[1.5px] border-[#111827] bg-white px-5 text-[15px] font-bold shadow-sm"
            style={{ color: INK }}
          >
            Mistakes
          </button>
          <button
            type="button"
            aria-label="Book"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D1D5DB] bg-white shadow-sm"
          >
            <IconBook />
          </button>
          <button
            type="button"
            aria-label="Hide translation"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D1D5DB] bg-white shadow-sm"
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

      {/* Chapter drawer */}
      {drawerOpen && (
        <div className="absolute inset-0 z-40">
          <button
            type="button"
            aria-label="Close chapters"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
              <p className="text-[17px] font-bold" style={{ color: INK }}>
                Chapters
              </p>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-2xl leading-none"
                style={{ color: MUTED }}
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto" onClick={onDrawerClick}>
              <SurahList />
            </div>
          </div>
        </div>
      )}

      {/* Search screen (Step 3): full-screen overlay. */}
      <ReaderSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Welcome / gift overlay (Step 4): closing returns to the
          reader on Page 1, Al-Fatihah. Never auto-shows on load. */}
      <ReaderGift
        open={giftOpen}
        onClose={() => {
          setGiftOpen(false);
          if (page !== 1) jumpToPage(1);
        }}
      />

      {/* Chapter / Juz selection bottom sheet (Step 2) */}
      <ChapterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        currentSurahId={surahsOnMushafPage(page)[0] ?? 1}
        currentJuz={meta.juz}
        onSelectSurah={(id) => {
          setSheetOpen(false);
          jumpToPage(SURAH_FIRST_PAGE[id] ?? 1);
        }}
      />
    </div>
  );
}
