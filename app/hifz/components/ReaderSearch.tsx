// app/hifz/components/ReaderSearch.tsx — Step 3 of the step-by-step
// Tarteel match: the "Search" screen. Full-screen overlay over the
// Step 1 Mushaf Reader, opened from the magnifying-glass icon in the
// top bar. Very light grey background (#F8F8F8), circular back button
// (white, thin grey border, black chevron) top-left, bold "Search"
// top-right, empty content area, and a bottom row fixed to the bottom:
// a light-grey pill input (exact placeholder
// "e.g. Al-Fatihah, 1:4, pg 62, ...", green caret) plus a glowing
// mint voice-search button. UI layout only in this step — no search
// logic and no results list yet. The voice button is visual only.
// The phone's native keyboard is NOT part of the build; tapping the
// input focuses it (and raises the native keyboard on a real phone).
// No "Tarteel" / "Premium" wording.

'use client';

import { useEffect, useRef, useState } from 'react';

const INK = '#111827';

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M14.5 5.5L8 12l6.5 6.5" />
    </svg>
  );
}
function IconSearchSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" className="h-[18px] w-[18px] shrink-0" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  );
}
function IconMicSmall() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <rect x="9.5" y="2.5" width="5" height="11" rx="2.5" fill="#FFFFFF" />
      <path d="M6 11.5c0 3.6 2.7 6 6 6s6-2.4 6-6" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17.5V21" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function ReaderSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rendered, setRendered] = useState(open);
  const [shown, setShown] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Mount / fade lifecycle: mount, then fade in; on close, fade out
  // and unmount after the transition.
  useEffect(() => {
    if (open) {
      setRendered(true);
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

  if (!rendered) return null;

  return (
    <div
      role="dialog"
      aria-label="Search"
      className="absolute inset-0 z-[60] flex flex-col transition-opacity duration-200"
      style={{ backgroundColor: '#F8F8F8', opacity: shown ? 1 : 0 }}
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

      {/* Content area: empty in this step — results come later. */}
      <main className="min-h-0 flex-1" />

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
              className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
              style={{ caretColor: '#22C55E' }}
            />
          </div>
          <button
            type="button"
            aria-label="Voice search"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{
              background: 'radial-gradient(circle at 50% 42%, #C9F7D4 0%, #7BE3A8 48%, #34D399 100%)',
              boxShadow: '0 0 14px 3px rgba(52, 211, 153, 0.45), 0 2px 8px rgba(0,0,0,0.10)',
            }}
          >
            <IconMicSmall />
          </button>
        </div>
      </div>
    </div>
  );
}
