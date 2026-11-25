// app/hifz/components/ReaderMushafLayout.tsx — the "Mushaf Layout"
// bottom sheet (Phase 1). Opens from the Book icon in the reader's
// bottom bar. Matches Mehran's screenshot image-abb973f3.png: dimmed
// reader behind, white sheet with rounded top corners, "Mushaf Layout"
// header + X, "READING LAYOUT" subtitle, three radio cards (Book /
// Quran Text / Translation-Transliteration), and the "MUSHAF LAYOUT
// AND FONT" row with a chevron — which opens the Mushaf Type screen
// (fourth refinement, 2026-11-25; it was visual-only before that
// screen existed).
//
// The radio selection is real: onSelect persists the choice (parent)
// and switches the reader rendering. The sheet stays open after a
// selection so the user can compare; X closes it.

'use client';

import { useEffect, useState } from 'react';

export type ReaderLayoutMode = 'book' | 'text' | 'translation';

const INK = 'var(--reader-ink)';
const MUTED = 'var(--reader-muted)';

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#6B7280" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function IconBookFilled() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" aria-hidden="true">
      <path
        d="M12 6.8C10.6 5.2 8.2 4.6 5.6 5.2 4.2 5.5 3.2 6 3.2 6.8v10.4c0 .8 1 1.3 2.4 1 2.6-.6 5-.6 6.4.7 1.4-1.3 3.8-1.3 6.4-.7 1.4.3 2.4-.2 2.4-1V6.8c0-.8-1-1.3-2.4-1.6-2.6-.6-5 0-6.4 1.6Z"
        style={{ fill: INK }}
      />
      <path d="M12 6.8v11.1" stroke="#FFFFFF" strokeWidth="1.1" />
    </svg>
  );
}
function IconDocLines() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" aria-hidden="true">
      <path d="M6 3.5h9.5L19.5 7.5v13H6V3.5Z" style={{ fill: INK }} />
      <path d="M14.5 3.5v4.5h5" fill="#FFFFFF" opacity="0.85" />
      <path d="M9 12h6M9 15h6" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconTranslate() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" aria-hidden="true">
      <path
        d="M4 5.5h9l-1.2 2.6M6.6 8.1 9.5 14l.9-2M5.4 11.5h5.4M13.5 5.5h6M16.5 5.5v3.2c0 2.6-1.4 4.6-3.4 5.3M15 8.5c.8 1.8 2 3.6 3.6 4.9"
        fill="none"
        style={{ stroke: INK }}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="18.2" y="19.5" fontSize="8.5" fontWeight="700" style={{ fill: INK }} textAnchor="middle">
        A
      </text>
    </svg>
  );
}
function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

const OPTIONS: {
  id: ReaderLayoutMode;
  title: string;
  sub: string;
  icon: () => React.ReactNode;
}[] = [
  { id: 'book', title: 'Book', sub: 'Madani Mushaf (1405)', icon: IconBookFilled },
  { id: 'text', title: 'Quran Text', sub: 'Resizable Quran Text', icon: IconDocLines },
  {
    id: 'translation',
    title: 'Translation / Transliteration',
    sub: 'Dr. Mustafa Khattab, The Clear Quran',
    icon: IconTranslate,
  },
];

export default function ReaderMushafLayout({
  open,
  onClose,
  mode,
  onSelect,
  onOpenMushafType,
  editionLabel,
}: {
  open: boolean;
  onClose: () => void;
  mode: ReaderLayoutMode;
  onSelect: (m: ReaderLayoutMode) => void;
  /** Opens the Mushaf Type screen (fourth refinement): the row below
   *  was dead until this screen existed. */
  onOpenMushafType: () => void;
  /** Current Mushaf Type name, shown under the Book card. */
  editionLabel: string;
}) {
  const [rendered, setRendered] = useState(open);
  const [shown, setShown] = useState(false);

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

  if (!rendered) return null;

  return (
    <div className="absolute inset-0 z-40">
      {/* Overlay: dims the reader (~40%, as in the reference). */}
      <button
        type="button"
        aria-label="Close Mushaf Layout"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        style={{ opacity: shown ? 1 : 0 }}
      />
      {/* Sheet: slides up from the bottom. */}
      <div
        role="dialog"
        aria-label="Mushaf Layout"
        className="absolute inset-x-0 bottom-0 bg-white shadow-2xl transition-transform duration-300 ease-out"
        style={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          transform: shown ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5">
          <p className="text-[20px] font-bold leading-tight" style={{ color: INK }}>
            Mushaf Layout
          </p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center"
          >
            <IconClose />
          </button>
        </div>

        {/* Subtitle */}
        <p className="px-5 pt-4 text-[13px] font-bold uppercase leading-tight tracking-wide" style={{ color: INK }}>
          Reading Layout
        </p>
        <p className="px-5 pt-1 text-[14px] leading-snug" style={{ color: MUTED }}>
          Select how you wish to read the Quran.
        </p>

        {/* Radio cards */}
        <div className="mt-4 space-y-3 px-5" role="radiogroup" aria-label="Reading layout">
          {OPTIONS.map((opt) => {
            const selected = mode === opt.id;
            const Icon = opt.icon;
            // The Book card names the current Mushaf Type, so the
            // choice made in the Mushaf Type screen is visible here.
            const sub = opt.id === 'book' ? editionLabel : opt.sub;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(opt.id)}
                className="flex w-full items-center gap-3 rounded-[12px] bg-white px-4 py-3.5 text-left"
                style={{
                  border: selected ? '2px solid var(--reader-ink)' : '1px solid var(--reader-hairline)',
                }}
              >
                <Icon />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] font-semibold leading-tight" style={{ color: INK }}>
                    {opt.title}
                  </span>
                  <span className="block truncate text-[14px] leading-snug" style={{ color: MUTED }}>
                    {sub}
                  </span>
                </span>
                {/* Radio circle: filled black dot when selected. */}
                <span
                  aria-hidden="true"
                  className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full"
                  style={{ border: selected ? '2px solid var(--reader-ink)' : '2px solid var(--reader-hairline)' }}
                >
                  {selected && <span className="h-[10px] w-[10px] rounded-full bg-[#111827]" />}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom section — opens the Mushaf Type screen (fourth
            refinement, 2026-11-25): four editions with real previews
            plus the Show Tajweed Colors toggle. Was visual-only. */}
        <button
          type="button"
          onClick={onOpenMushafType}
          aria-label="Mushaf Layout and Font — choose Mushaf type"
          className="mt-6 flex w-full items-center justify-between px-5 pb-8 text-left"
        >
          <span className="min-w-0">
            <span className="block text-[14px] font-bold uppercase leading-tight tracking-wide" style={{ color: INK }}>
              Mushaf Layout and Font
            </span>
            <span className="block pt-0.5 text-[13px] leading-snug" style={{ color: MUTED }}>
              Choose the different Mushaf you wish to use.
            </span>
          </span>
          <IconChevronRight />
        </button>
      </div>
    </div>
  );
}
