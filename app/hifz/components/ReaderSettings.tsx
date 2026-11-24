// app/hifz/components/ReaderSettings.tsx — Step 5 of the step-by-step
// Tarteel match: the "Settings" full-screen page. Opens from the gear
// icon in the reader's top bar. Layout follows the two reference
// screenshots (top + scrolled): very light grey background, circular
// back button + "Settings" title, a horizontally scrollable banner
// (pink Testing Mode card + blue Get Started card), then grouped
// white cards — Experiences, Quran Appearance, Appearance,
// Notifications, Sounds & Haptics, Downloads, Privacy — each row with
// a small black icon, a label, and a light grey chevron. The page
// scrolls vertically; the header stays fixed. No "Tarteel" /
// "Premium" wording anywhere.
//
// Phase 7 (live wiring): the rows that can work, work — TEST
// YOURSELF opens the reader in Testing Mode (Hide Verses on), the
// Mushaf Layout row opens the layout sheet, Theme is a real Light /
// Dark toggle (same `ili_hifz_settings_v1.theme` the old settings
// page uses, so it persists across reloads), and Delete All Audio
// Data clears the on-device data (two-tap confirm) and reloads.
// The remaining rows stay visual-only (see the phase reminder list).

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  applyReaderTheme,
  getReaderTheme,
  READER_THEME_EVENT,
  type ReaderTheme,
} from '../lib/reader-theme';
import { deleteAllLocalData } from '../lib/store';

const INK = 'var(--reader-ink)';
const MUTED = 'var(--reader-muted)';

/* ---------------------------------------------------------------- */
/*  Icons (inline SVG, our own).                                     */
/* ---------------------------------------------------------------- */

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" style={{ stroke: INK }} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}
function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}
function IconMic() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <rect x="9" y="2.5" width="6" height="11.5" rx="3" style={{ fill: INK }} />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" fill="none" style={{ stroke: INK }} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 18v3.5" style={{ stroke: INK }} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" style={{ fill: INK }} />
    </svg>
  );
}
function IconBookOpen() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 6.5C10.5 5 8 4.5 5 5c-1 .2-2 .6-2 1.4v11.2c0 .8 1 1.2 2 1 3-.5 5.5 0 7 1.5 1.5-1.5 4-2 7-1.5 1 .2 2-.2 2-1V6.4c0-.8-1-1.2-2-1.4-3-.5-5.5 0-7 1.5Z" />
      <path d="M12 6.5v12.6" />
    </svg>
  );
}
function IconEyeOff() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12C5 7.5 8.5 5.5 12 5.5c3.5 0 7 2 9.5 6.5-2.5 4.5-6 6.5-9.5 6.5-3.5 0-7-2-9.5-6.5Z" />
      <circle cx="12" cy="12" r="2.6" style={{ fill: INK }} stroke="none" />
      <path d="M4.5 4.5l15 15" />
    </svg>
  );
}
function IconPen() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3.5a2.83 2.83 0 1 1 4 4L7.5 21 2.5 22 3.5 17 17 3.5Z" />
      <path d="M14.5 6l3.5 3.5" />
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  );
}
function IconSun() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15 18 9" />
      <path d="M10.3 20.5a2 2 0 0 0 3.4 0" />
    </svg>
  );
}
function IconAlertCircle() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" style={{ fill: INK }} />
      <path d="M12 7.5v5.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="16.8" r="1.2" fill="#FFFFFF" />
    </svg>
  );
}
function IconWifi() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
      <path d="M2 9a15 15 0 0 1 20 0" />
      <path d="M5.5 12.5a10.5 10.5 0 0 1 13 0" />
      <path d="M8.8 16a6 6 0 0 1 6.4 0" />
      <circle cx="12" cy="19.4" r="1.1" style={{ fill: INK }} stroke="none" />
    </svg>
  );
}
function IconRadio() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="2" style={{ fill: INK }} stroke="none" />
      <path d="M7.6 7.6a6.4 6.4 0 0 0 0 8.8" />
      <path d="M16.4 7.6a6.4 6.4 0 0 1 0 8.8" />
      <path d="M4.7 4.7a10.4 10.4 0 0 0 0 14.6" />
      <path d="M19.3 4.7a10.4 10.4 0 0 1 0 14.6" />
    </svg>
  );
}
function IconLanguages() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 5h9" />
      <path d="M8.5 3v2c0 3.5-2 6.5-4.5 8" />
      <path d="M5.5 8.5c.8 1.8 2.2 3.4 4 4.5" />
      <path d="M13 21l4.5-10L22 21" />
      <path d="M14.8 17h5.4" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10.5" width="16" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function IconMinusCircle() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" style={{ fill: INK }} />
      <path d="M8 12h8" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// Gold 4-point sparkle, as in the pink banner's decoration.
function IconSparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#F59E0B" aria-hidden="true">
      <path d="M12 1l2.2 7.8L22 11l-7.8 2.2L12 21l-2.2-7.8L2 11l7.8-2.2L12 1Z" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/*  Sections (order + rows match the two reference screenshots).     */
/* ---------------------------------------------------------------- */

type RowDef = { icon: () => React.JSX.Element; label: string };
type SectionDef = { title: string; rows: RowDef[] };

const SECTIONS: SectionDef[] = [
  {
    title: 'Experiences',
    rows: [
      { icon: IconMic, label: 'Recitation' },
      { icon: IconPlay, label: 'Listening' },
    ],
  },
  {
    title: 'Quran Appearance',
    rows: [
      { icon: IconBookOpen, label: 'Mushaf Layout' },
      { icon: IconEyeOff, label: 'Hidden Verses' },
      { icon: IconPen, label: 'Marking' },
    ],
  },
  {
    title: 'Appearance',
    rows: [
      { icon: IconGlobe, label: 'Language' },
      { icon: IconSun, label: 'Theme' },
    ],
  },
  {
    title: 'Notifications',
    rows: [{ icon: IconBell, label: 'Reminders' }],
  },
  {
    title: 'Sounds & Haptics',
    rows: [
      { icon: IconAlertCircle, label: 'Mistake Feedback' },
      { icon: IconMic, label: 'Session Start & Stop' },
      { icon: IconWifi, label: 'Dropped Connection' },
      { icon: IconBell, label: 'Testing Mode' },
    ],
  },
  {
    title: 'Downloads',
    rows: [
      { icon: IconRadio, label: 'Reciters' },
      { icon: IconLanguages, label: 'Translations' },
      { icon: IconBookOpen, label: 'Tafsir' },
    ],
  },
  {
    title: 'Privacy',
    rows: [
      { icon: IconLock, label: 'Data Usage' },
      { icon: IconMinusCircle, label: 'Delete All Audio Data' },
    ],
  },
];

/* ---------------------------------------------------------------- */
/*  Banner decoration — our own drawing: three tilted gradient       */
/*  capsules, a green circle peeking at the right edge, gold         */
/*  sparkles and white rays, as in the reference pink card.          */
/* ---------------------------------------------------------------- */

function BannerDecoration() {
  return (
    <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-[140px] overflow-hidden rounded-r-2xl" aria-hidden="true">
      {/* White rays fanning out from behind the capsules. */}
      <svg viewBox="0 0 140 162" className="absolute inset-0 h-full w-full" fill="none" stroke="#FFFFFF" strokeWidth="1.4" opacity="0.75">
        <path d="M118 78 L18 6" />
        <path d="M118 78 L8 38" />
        <path d="M118 78 L4 78" />
        <path d="M118 78 L8 118" />
        <path d="M118 78 L18 150" />
      </svg>
      {/* Green circle peeking at the right edge. */}
      <div className="absolute -right-[10px] top-[118px] h-[30px] w-[30px] rounded-full bg-[#4ADE80]" />
      {/* Capsules: blue, purple, pink — tilted, with a light seam.
          Right ends bleed off the card edge, as in the reference. */}
      <div className="absolute -right-[4px] top-[30px] flex h-[20px] w-[74px] -rotate-[10deg] items-center justify-center rounded-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] shadow-md">
        <span className="h-[6px] w-[38px] rounded-full bg-white/60" />
      </div>
      <div className="absolute -right-[4px] top-[64px] flex h-[20px] w-[74px] -rotate-[10deg] items-center justify-center rounded-full bg-gradient-to-r from-[#A855F7] to-[#C084FC] shadow-md">
        <span className="h-[6px] w-[38px] rounded-full bg-white/60" />
      </div>
      <div className="absolute -right-[4px] top-[102px] flex h-[20px] w-[74px] -rotate-[10deg] items-center justify-center rounded-full bg-gradient-to-r from-[#F472B6] to-[#FB7185] shadow-md">
        <span className="h-[6px] w-[38px] rounded-full bg-white/60" />
      </div>
      <IconSparkle className="absolute -right-[2px] top-[4px] h-3.5 w-3.5" />
      <IconSparkle className="absolute right-[48px] top-[81px] h-3 w-3" />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Overlay                                                            */
/* ---------------------------------------------------------------- */

export default function ReaderSettings({
  open,
  onClose,
  onTestYourself,
  onOpenLayout,
}: {
  open: boolean;
  onClose: () => void;
  /** Phase 7: TEST YOURSELF opens the reader in Testing Mode. */
  onTestYourself?: () => void;
  /** Phase 7: the Mushaf Layout row opens the layout sheet. */
  onOpenLayout?: () => void;
}) {
  const [rendered, setRendered] = useState(open);
  const [shown, setShown] = useState(false);
  /** Phase 7 — Theme: the stored Light / Dark choice, kept in sync
   *  with the shared settings document (another surface may change
   *  it; the event re-renders this toggle). */
  const [theme, setTheme] = useState<ReaderTheme>('light');
  useEffect(() => {
    const sync = () => setTheme(getReaderTheme());
    sync();
    window.addEventListener(READER_THEME_EVENT, sync);
    return () => window.removeEventListener(READER_THEME_EVENT, sync);
  }, []);
  const chooseTheme = (t: ReaderTheme) => {
    applyReaderTheme(t);
    setTheme(t);
  };
  /** Phase 7 — Delete All Audio Data: two-tap confirm. The first
   *  tap arms the row ("Tap again to delete"); the second clears
   *  the on-device audio + ALL of localStorage and reloads. The arm
   *  expires after 4 s so an accidental first tap cannot delete
   *  anything later. */
  const [deleteArmed, setDeleteArmed] = useState(false);
  const deleteTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (deleteTimerRef.current !== null) window.clearTimeout(deleteTimerRef.current);
    };
  }, []);
  const handleDeleteTap = async () => {
    if (!deleteArmed) {
      setDeleteArmed(true);
      deleteTimerRef.current = window.setTimeout(() => setDeleteArmed(false), 4000);
      return;
    }
    if (deleteTimerRef.current !== null) window.clearTimeout(deleteTimerRef.current);
    setDeleteArmed(false);
    // IndexedDB first (session recordings + the localStorage mirror
    // in the kv store), then ALL of localStorage, then reload.
    // FLAG: clearing all of localStorage wipes every locally stored
    // record — goals, sessions, bookmarks, settings — not just
    // audio. That is what the spec asks for; narrow it to audio-only
    // on request (see the Phase 7 report).
    try {
      await deleteAllLocalData();
    } catch {
      /* delete failure is never fatal — still clear + reload */
    }
    try {
      window.localStorage.clear();
    } catch {
      /* storage unavailable */
    }
    window.location.reload();
  };

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

  if (!rendered) return null;

  return (
    <div
      role="dialog"
      aria-label="Settings"
      className="absolute inset-0 z-[70] flex flex-col transition-opacity duration-200"
      style={{ backgroundColor: 'var(--reader-bg)', opacity: shown ? 1 : 0 }}
    >
      {/* Header: back button left, title right. Stays fixed while the
          content below scrolls. */}
      <header className="flex shrink-0 items-center justify-between px-4 pb-3 pt-4">
        <button
          type="button"
          aria-label="Back to reader"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D1D5DB] bg-white"
        >
          <IconChevronLeft />
        </button>
        <h1 className="text-[20px] font-bold leading-none" style={{ color: INK }}>
          Settings
        </h1>
      </header>

      {/* Scrollable content: banner + grouped sections. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
        {/* Top horizontal scroll banner. */}
        <div className="mt-3 flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Card 1 — Testing Mode (pink). */}
          <article className="relative flex h-[162px] w-[290px] min-w-[290px] shrink-0 flex-col overflow-hidden rounded-2xl bg-[#FFEDF9] p-4">
            <BannerDecoration />
            {/* Text runs full width, as in the reference — the
                decoration overlaps the last words of the longer lines. */}
            <div>
              <h2 className="text-[15px] font-bold leading-snug" style={{ color: INK }}>
                New Feature: Testing Mode
              </h2>
              <p className="mt-1 w-[94%] text-[12.5px] leading-snug text-[#4B5563]">
                Test yourself randomly and build confidence reciting from anywhere in the Quran.
              </p>
            </div>
            <button
              type="button"
              onClick={onTestYourself}
              data-testid="settings-test-yourself"
              className="relative z-10 mt-auto h-[34px] self-start rounded-full bg-[#F6C45B] px-5 text-[12px] font-bold tracking-wide shadow-sm"
              style={{ color: '#111827' }}
            >
              TEST YOURSELF
            </button>
          </article>

          {/* Card 2 — Get Started (blue, partially visible). */}
          <article className="relative flex h-[162px] w-[290px] min-w-[290px] shrink-0 flex-col overflow-hidden rounded-2xl bg-[#C3DEF3] p-4">
            <div>
              <h2 className="text-[15px] font-bold leading-snug" style={{ color: INK }}>
                Get Started
              </h2>
              <p className="mt-1 text-[12.5px] leading-snug text-[#4B5563]">
                Start learning how to use it with our quick guide.
              </p>
            </div>
            <button
              type="button"
              className="relative z-10 mt-auto h-[34px] self-start rounded-full bg-white px-5 text-[12px] font-bold tracking-wide shadow-sm"
              style={{ color: INK }}
            >
              VIEW TUTORIAL
            </button>
          </article>
        </div>

        {/* Grouped sections. */}
        {SECTIONS.map((section, si) => (
          <section key={section.title} className={si === 0 ? 'mt-3' : 'mt-5'}>
            <h2 className="mb-1.5 px-1.5 text-[16px] font-bold" style={{ color: INK }}>
              {section.title}
            </h2>
            <div className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              {section.rows.map((row, ri) => {
                const RowIcon = row.icon;
                return (
                  <div key={row.label}>
                    {ri > 0 && <div className="ml-12 mr-4 border-t border-[#EFEFEF]" />}
                    {row.label === 'Theme' ? (
                      /* Phase 7 — Theme: a real Light / Dark toggle.
                         The choice is the shared settings document's
                         theme, so it persists across reloads. */
                      <div className="flex w-full items-center gap-3 px-4 py-[14px]">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                          <RowIcon />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[15px]" style={{ color: INK }}>
                          {row.label}
                        </span>
                        <span className="flex shrink-0 items-center rounded-full border border-[#D1D5DB] p-0.5" role="group" aria-label="Theme">
                          {(['light', 'dark'] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              aria-pressed={theme === t}
                              data-testid={`settings-theme-${t}`}
                              onClick={() => chooseTheme(t)}
                              className="rounded-full px-3 py-1 text-[12px] font-bold capitalize"
                              style={
                                theme === t
                                  ? { backgroundColor: 'var(--reader-ink)', color: 'var(--reader-bg)' }
                                  : { color: MUTED }
                              }
                            >
                              {t}
                            </button>
                          ))}
                        </span>
                      </div>
                    ) : row.label === 'Delete All Audio Data' ? (
                      /* Phase 7 — Delete All Audio Data: two-tap
                         confirm; the second tap clears the on-device
                         audio + ALL of localStorage and reloads. */
                      <button
                        type="button"
                        onClick={() => void handleDeleteTap()}
                        data-testid="settings-delete-audio"
                        aria-label={deleteArmed ? 'Tap again to delete all audio data' : 'Delete All Audio Data'}
                        className="flex w-full items-center gap-3 px-4 py-[14px] text-left"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                          <RowIcon />
                        </span>
                        <span className="min-w-0 flex-1 text-[15px]" style={{ color: deleteArmed ? '#DC2626' : INK }}>
                          {deleteArmed ? 'Tap again to delete everything' : row.label}
                        </span>
                        {deleteArmed ? (
                          <span className="shrink-0 text-[12px] font-bold" style={{ color: '#DC2626' }}>
                            Confirm
                          </span>
                        ) : (
                          <IconChevronRight />
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={row.label === 'Mushaf Layout' ? onOpenLayout : undefined}
                        className="flex w-full items-center gap-3 px-4 py-[14px] text-left"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                          <RowIcon />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[15px]" style={{ color: INK }}>
                          {row.label}
                        </span>
                        <IconChevronRight />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
