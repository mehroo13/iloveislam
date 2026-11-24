// app/hifz/components/ReaderDashboard.tsx — Steps 6 + 7 of the
// step-by-step Tarteel match: the "Dashboard" screen. Opens from the
// hamburger in the reader's top bar (replacing the Step 1 chapter
// drawer; chapter navigation stays available via the central top-bar
// pill). Vertically scrollable: top bar (back, two-diamond logo,
// profile, gear), tabs (Dashboard / Goals / Memorization / Activity /
// Community) that dynamically swap the content below, and the tab
// views. Step 6 built the Dashboard tab; Step 7 made all four other
// tabs functional. The gear opens the Step 5 Settings screen; the
// profile icon is visual only. No "Tarteel" / "Premium" wording
// anywhere — the promo button says "Discover All Free Features" and
// the Activity Tracker is a free blank chart box, never a paywall.
//
// Greeting (correction 2026-11-24): NEVER a hardcoded name. A
// signed-in user sees "Salam {profile display_name}!" (email local
// part when no display name is set); a guest sees "Salam!" or their
// stored guest display name from the local settings store.
//
// The Community leaderboard rows 1–6 are the reference screenshot's
// rows, displayed as given (static, not wired to any live data
// source); rows 7–10 are mock rows, as instructed.

'use client';

import { useEffect, useRef, useState } from 'react';
import { loadSettings } from '../progress';
import { getSupabase } from '../lib/supabase';

const INK = '#111827';
const MUTED = '#6B7280';
const GREEN = '#16A34A';

/* ---------------------------------------------------------------- */
/*  Icons (inline SVG, our own).                                     */
/* ---------------------------------------------------------------- */

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}
function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? 'h-5 w-5'} fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}
function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? 'h-5 w-5'} fill="none" stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 9l7 7 7-7" />
    </svg>
  );
}
function IconChevronUp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? 'h-5 w-5'} fill="none" stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 15l7-7 7 7" />
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
function IconProfile() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" fill={INK} />
      <circle cx="12" cy="9" r="3.4" fill="#FFFFFF" />
      <path d="M5.4 19.5c1.2-3.2 3.6-4.8 6.6-4.8s5.4 1.6 6.6 4.8" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#6B7280" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15 18 9" />
      <path d="M10.3 20.5a2 2 0 0 0 3.4 0" />
    </svg>
  );
}
function IconPlusCircle() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}
function IconPlusGrey() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="#D1D5DB" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}
function IconPlusGreen() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#34D399" />
      <path d="M12 8v8M8 12h8" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
function IconCheckGrey() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="#E5E7EB" />
      <path d="M8 12.5l2.7 2.7L16.5 9" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconArrowUpRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}
function IconSparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#F59E0B" aria-hidden="true">
      <path d="M12 1l2.2 7.8L22 11l-7.8 2.2L12 21l-2.2-7.8L2 11l7.8-2.2L12 1Z" />
    </svg>
  );
}
/* Network / node symbol for the My Groups card — three nodes joined
 * by lines, grey, our own drawing. */
function IconNetwork() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" stroke="#9CA3AF" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="24" cy="12" r="5" fill="#D1D5DB" stroke="none" />
      <circle cx="12" cy="34" r="5" fill="#D1D5DB" stroke="none" />
      <circle cx="36" cy="34" r="5" fill="#D1D5DB" stroke="none" />
      <path d="M24 17v6m0 0l-9 7m9-7l9 7" />
    </svg>
  );
}

/* Two overlapping diamonds — our own logo mark (teal + light green,
 * measured from the reference). */
function LogoDiamonds({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 24" className={className} aria-hidden="true">
      <rect x="2" y="4" width="16" height="16" rx="2" transform="rotate(45 10 12)" fill="#48F0BD" />
      <rect x="18" y="6" width="14" height="14" rx="2" transform="rotate(45 25 13)" fill="#D3F2D3" />
    </svg>
  );
}

/* Golden lantern — our own drawing: dome + crescent on a rehal
 * stand, gold gradients. */
function IconLantern() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden="true">
      <defs>
        <linearGradient id="lanternGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FDE68A" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
      </defs>
      {/* Crescent above the dome. */}
      <path d="M38 4a7 7 0 1 0 4 12.6A8.5 8.5 0 0 1 38 4Z" fill="#F59E0B" />
      {/* Dome. */}
      <path d="M32 12c-8 0-13 5.5-13 12h26c0-6.5-5-12-13-12Z" fill="url(#lanternGold)" />
      {/* Body: arched window with bars. */}
      <rect x="20" y="25" width="24" height="20" rx="3" fill="url(#lanternGold)" />
      <path d="M26 28v14M32 28v14M38 28v14" stroke="#92400E" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M23 32h18" stroke="#92400E" strokeWidth="1.4" />
      {/* Rehal stand (crossed bars) + base. */}
      <path d="M18 50l28-8M46 50L18 42" stroke="#B45309" strokeWidth="3.4" strokeLinecap="round" />
      <rect x="16" y="50" width="32" height="3.4" rx="1.7" fill="#92400E" />
    </svg>
  );
}

/* Streak ring: grey track + an orange arc at the top, flame centre. */
function StreakRing() {
  return (
    <svg viewBox="0 0 64 64" className="h-[72px] w-[72px]" aria-hidden="true">
      <defs>
        <linearGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="26" fill="none" stroke="#E5E7EB" strokeWidth="5.5" />
      <circle
        cx="32"
        cy="32"
        r="26"
        fill="none"
        stroke="#FB923C"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeDasharray="41 122.3"
        transform="rotate(-90 32 32)"
      />
      {/* Flame (Material "whatshot" shape). */}
      <path
        fill="url(#fireGrad)"
        d="M33.5 20.7s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C25.21 27.51 24 30.62 24 34c0 4.42 3.58 8 8 8s8-3.58 8-8c0-5.39-2.59-10.2-6.5-13.3ZM31.71 39c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8Z"
        transform="translate(-8 -8) scale(1.33)"
      />
    </svg>
  );
}

/* Highlights graphic — our own drawing: tilted gradient capsules +
 * sparkles on black, as in the Step 5 banner decoration. */
function HighlightsGraphic() {
  return (
    <div className="pointer-events-none relative h-[92px] overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 220 104" className="absolute inset-0 h-full w-full" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.5">
        <path d="M150 52 L20 4" />
        <path d="M150 52 L8 30" />
        <path d="M150 52 L4 52" />
        <path d="M150 52 L8 74" />
        <path d="M150 52 L20 100" />
      </svg>
      <div className="absolute right-[18px] top-[10px] flex h-[20px] w-[100px] -rotate-[10deg] items-center justify-center rounded-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] shadow-md">
        <span className="h-[6px] w-[52px] rounded-full bg-white/60" />
      </div>
      <div className="absolute left-[18px] top-[36px] flex h-[20px] w-[100px] rotate-[8deg] items-center justify-center rounded-full bg-gradient-to-r from-[#A855F7] to-[#C084FC] shadow-md">
        <span className="h-[6px] w-[52px] rounded-full bg-white/60" />
      </div>
      <div className="absolute right-[30px] top-[66px] flex h-[20px] w-[100px] -rotate-[8deg] items-center justify-center rounded-full bg-gradient-to-r from-[#F472B6] to-[#FB7185] shadow-md">
        <span className="h-[6px] w-[52px] rounded-full bg-white/60" />
      </div>
      <div className="absolute right-[6px] top-[44px] h-[22px] w-[22px] rounded-full bg-[#4ADE80]" />
      <IconSparkle className="absolute left-[8px] top-[8px] h-3.5 w-3.5" />
      <IconSparkle className="absolute right-[96px] top-[52px] h-3 w-3" />
      <IconSparkle className="absolute left-[104px] top-[82px] h-3 w-3" />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Streak week (shared by the Dashboard and Activity tabs)          */
/* ---------------------------------------------------------------- */

const WEEK = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
const ACTIVE_DAY = 'Mon';

function DayPill({ day }: { day: string }) {
  const active = day === ACTIVE_DAY;
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-2 rounded-xl px-0.5 py-2.5 ${active ? 'bg-[#DBFFF4]' : ''}`}
    >
      <span className={`text-[11px] leading-none ${active ? 'font-bold' : ''}`} style={{ color: active ? GREEN : MUTED }}>
        {day}
      </span>
      {active ? (
        <span className="flex h-[22px] w-[22px] rotate-45 items-center justify-center rounded-[4px] bg-[#22C55E]">
          <span className="-rotate-45">
            <IconCheck />
          </span>
        </span>
      ) : (
        <span className="h-[22px] w-[22px] rotate-45 rounded-[4px] border-[1.5px] border-dashed border-[#9CA3AF]" />
      )}
    </div>
  );
}

/* The streak card, identical on the Dashboard and Activity tabs. */
function StreakCard() {
  return (
    <section className="mt-3 flex items-stretch gap-2 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      {/* Ring + count. */}
      <div className="flex w-[76px] shrink-0 flex-col items-center justify-center gap-1">
        <StreakRing />
        <p className="text-[15px] font-bold leading-none" style={{ color: '#F97316' }}>
          1 Day
        </p>
      </div>
      {/* Week panel. */}
      <div className="flex min-w-0 flex-1 flex-col justify-center rounded-xl px-2 py-3" style={{ backgroundColor: '#E9FFF3' }}>
        <div className="flex gap-0.5">
          {WEEK.map((d) => (
            <DayPill key={d} day={d} />
          ))}
        </div>
        <p className="mt-1.5 pl-1 text-[12px] leading-none" style={{ color: GREEN }}>
          Longest Streak <span className="font-bold">1 Day</span>
        </p>
      </div>
      {/* Bell + add, stacked at the far right edge. */}
      <div className="flex w-6 shrink-0 flex-col items-center justify-between py-1">
        <IconBell />
        <IconPlusCircle />
      </div>
    </section>
  );
}

/* Full-width white "START A NEW GOAL" button, as on the Dashboard's
 * Today's Goals section and at the top of the Goals tab. */
function StartGoalButton() {
  return (
    <button
      type="button"
      className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white text-[13px] font-bold tracking-wide shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
      style={{ color: INK }}
    >
      START A NEW GOAL
      <IconPlusGreen />
    </button>
  );
}

/* ---------------------------------------------------------------- */
/*  Tab views                                                          */
/* ---------------------------------------------------------------- */

/* Dashboard tab — the Step 6 content, unchanged. */
function DashboardTab({ displayName }: { displayName: string | null }) {
  return (
    <>
      {/* Greeting — dynamic name, never hardcoded. */}
      <h1 className="mt-4 text-[20px] font-bold leading-tight" style={{ color: INK }}>
        {displayName ? `Salam ${displayName}!` : 'Salam!'}
      </h1>

      <StreakCard />

      {/* Promo card. The button spans the full card width, as in
          the reference — so the card has no side padding; the icon
          and text carry their own. */}
      <section className="mt-4 flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white pb-4 pt-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col items-center px-5">
          <IconLantern />
          <p className="mt-3 text-center text-[17px] font-bold leading-snug" style={{ color: INK }}>
            Memorize the Quran better and faster than ever before!
          </p>
        </div>
        <button
          type="button"
          className="mt-4 h-10 w-full rounded-full text-[17px] font-bold shadow-sm"
          style={{
            color: INK,
            background: 'linear-gradient(90deg, #47BEFF 0%, #44FE9B 100%)',
          }}
        >
          Discover All Free Features
        </button>
      </section>

      {/* Highlights. */}
      <section className="mt-5">
        <h2 className="text-[17px] font-bold" style={{ color: INK }}>
          Highlights
        </h2>
        <div className="mt-2 flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <article className="flex h-[228px] w-[220px] shrink-0 flex-col overflow-hidden rounded-2xl bg-black p-3">
            <p className="text-[13px] font-semibold leading-snug text-white">Product 📱 - Testing Mode</p>
            <div className="mt-2 flex-1">
              <HighlightsGraphic />
            </div>
            <p className="text-[15px] font-bold leading-snug text-white">New Feature</p>
            <p className="mt-0.5 text-[12px] leading-snug" style={{ color: '#9CA3AF' }}>
              Test your memorization randomly from anywhere in the Quran.
            </p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-[11px] font-semibold tracking-wide text-white">TEST YOURSELF NOW!</p>
              <IconArrowUpRight />
            </div>
          </article>
        </div>
      </section>

      {/* Today's Goals. */}
      <section className="mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold" style={{ color: INK }}>
            Today&apos;s Goals
          </h2>
          <button type="button" className="text-[13px]" style={{ color: MUTED }}>
            See All
          </button>
        </div>
        <StartGoalButton />
      </section>
    </>
  );
}

/* Goals tab. */
function GoalsTab() {
  const archived = [
    { name: 'Memorize Surah Al-Mulk', date: 'Completed on Nov 20' },
    { name: 'Memorize Surah Al-Kahf', date: 'Completed on Nov 12' },
  ];
  return (
    <>
      <StartGoalButton />

      {/* Active. */}
      <section className="mt-5">
        <h2 className="text-[17px] font-bold" style={{ color: INK }}>
          Active
        </h2>
        <p className="mt-1 text-[13px] leading-snug" style={{ color: MUTED }}>
          Goals you are trying to complete. Swipe right on goal to modify.
        </p>
        <div className="mt-3 border-t border-[#E5E7EB]" />
      </section>

      {/* Today's goals. */}
      <section className="mt-4">
        <h3 className="text-[11px] font-bold tracking-wide" style={{ color: INK }}>
          TODAY&apos;S GOALS
        </h3>
        <div className="mt-2 flex h-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[15px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]" style={{ color: INK }}>
          None
        </div>
      </section>

      {/* Upcoming goals. */}
      <section className="mt-4">
        <h3 className="text-[11px] font-bold tracking-wide" style={{ color: INK }}>
          UPCOMING GOALS
        </h3>
        <div className="mt-2 flex h-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[15px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]" style={{ color: INK }}>
          None
        </div>
      </section>

      {/* Archived. */}
      <section className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold" style={{ color: INK }}>
            Archived
          </h2>
          <IconChevronDown />
        </div>
        <p className="mt-1 text-[13px] leading-snug" style={{ color: MUTED }}>
          Goals you completed or are no longer working towards.
        </p>
        <div className="mt-3 border-t border-[#E5E7EB]" />
        <div className="mt-3 flex flex-col gap-2">
          {archived.map((g) => (
            <div
              key={g.name}
              className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
            >
              <IconCheckGrey />
              <span className="min-w-0 flex-1 truncate text-[15px] line-through" style={{ color: MUTED }}>
                {g.name}
              </span>
              <span className="shrink-0 text-[12px]" style={{ color: MUTED }}>
                {g.date}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* Memorization tab. */
function MemorizationTab() {
  const progress = [
    { name: 'Al-Fatihah', pct: 100, verses: '7/7 Verses' },
    { name: 'Al-Baqarah', pct: 0, verses: '0/286 Verses' },
    { name: "Ali 'Imran", pct: 0, verses: '0/200 Verses' },
  ];
  return (
    <>
      {/* Memorization Completion card. */}
      <button
        type="button"
        className="mt-3 flex w-full items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-left shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
      >
        <span>
          <span className="block text-[16px] leading-snug" style={{ color: INK }}>
            Memorization Completion
          </span>
          <span className="block text-[22px] font-semibold leading-snug" style={{ color: '#34D399' }}>
            0%
          </span>
        </span>
        <IconChevronRight className="h-6 w-6" />
      </button>

      <div className="mt-5 border-t border-[#E5E7EB]" />

      {/* Goals. */}
      <section className="mt-4">
        <h2 className="text-[20px] font-bold" style={{ color: INK }}>
          Goals
        </h2>

        <div className="mt-4 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold" style={{ color: INK }}>
            Memorization
          </h3>
          <IconChevronUp />
        </div>
        <button
          type="button"
          className="mt-2 flex w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-left shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
        >
          <span>
            <span className="block text-[16px] leading-snug" style={{ color: INK }}>
              Memorization Goal
            </span>
            <span className="block text-[18px] leading-snug" style={{ color: '#34D399' }}>
              Not Set
            </span>
          </span>
          <IconChevronRight className="h-6 w-6" />
        </button>

        <div className="mt-5 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold" style={{ color: INK }}>
            Review
          </h3>
          <IconChevronUp />
        </div>
        <button
          type="button"
          className="mt-2 flex w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-left shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
        >
          <span>
            <span className="block text-[16px] leading-snug" style={{ color: INK }}>
              Review Goal
            </span>
            <span className="block text-[18px] leading-snug" style={{ color: '#34D399' }}>
              Not Set
            </span>
          </span>
          <IconChevronRight className="h-6 w-6" />
        </button>
      </section>

      {/* Surah Progress. */}
      <section className="mt-6">
        <h2 className="text-[20px] font-bold" style={{ color: INK }}>
          Surah Progress
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {progress.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
            >
              <span className="w-[86px] shrink-0 truncate text-[15px] font-semibold" style={{ color: INK }}>
                {s.name}
              </span>
              <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${s.pct}%`, backgroundColor: '#22C55E' }}
                />
              </span>
              <span className="w-[76px] shrink-0 text-right text-[12px]" style={{ color: MUTED }}>
                {s.verses}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* Activity tab. */
function ActivityTab() {
  const [range, setRange] = useState('Engagement');
  const sessions = [
    { when: 'Today, 4:06 PM', surah: 'Al-Fatihah', mins: '5 mins', acc: '98% Accuracy' },
    { when: 'Yesterday, 9:12 PM', surah: 'Al-Baqarah', mins: '12 mins', acc: '94% Accuracy' },
    { when: 'Nov 22, 7:45 PM', surah: 'Al-Mulk', mins: '8 mins', acc: '96% Accuracy' },
    { when: 'Nov 21, 6:30 PM', surah: 'Al-Fatihah', mins: '4 mins', acc: '99% Accuracy' },
  ];
  return (
    <>
      <StreakCard />

      {/* Session History. */}
      <button
        type="button"
        className="mt-3 flex w-full items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-left shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
      >
        <span>
          <span className="block text-[16px] leading-snug" style={{ color: INK }}>
            Session History
          </span>
          <span className="block text-[18px] leading-snug" style={{ color: '#34D399' }}>
            1
          </span>
        </span>
        <IconChevronRight className="h-6 w-6" />
      </button>

      {/* Achievements. */}
      <section className="mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold" style={{ color: INK }}>
            Achievements
          </h2>
          <button type="button" className="text-[13px]" style={{ color: MUTED }}>
            See All
          </button>
        </div>
        <p className="mt-1 text-[14px]" style={{ color: MUTED }}>
          No badges have been earned yet.
        </p>
      </section>

      {/* Activity Tracker — free: a blank white box with a light
          grey grid, never a paywall message. */}
      <section className="mt-4">
        <h2 className="text-[17px] font-bold" style={{ color: INK }}>
          Activity Tracker
        </h2>
        <div
          className="mt-2 h-[180px] rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
          style={{
            backgroundImage:
              'linear-gradient(#EDEFF1 1px, transparent 1px), linear-gradient(90deg, #EDEFF1 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
          aria-label="Activity chart"
        />
      </section>

      {/* Pages chart. */}
      <section className="mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold" style={{ color: INK }}>
            Pages
          </h2>
          <button type="button" className="flex items-center gap-1 text-[14px]" style={{ color: INK }}>
            Last 3 Days
            <IconChevronDown className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <svg viewBox="0 0 340 150" className="h-auto w-full" aria-label="Pages read in the last 3 days">
            {/* Shaded region over the last date, as in the reference. */}
            <rect x="252" y="10" width="84" height="112" fill="#D1FAE5" opacity="0.55" />
            {/* Dashed gridline at the top (value 1). */}
            <line x1="30" y1="10" x2="336" y2="10" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="4 4" />
            {/* Axes. */}
            <line x1="30" y1="10" x2="30" y2="122" stroke="#34D399" strokeWidth="1.5" />
            <line x1="30" y1="122" x2="336" y2="122" stroke="#34D399" strokeWidth="1.5" />
            {/* Y labels. */}
            <text x="22" y="14" textAnchor="end" fontSize="11" fill="#34D399">1</text>
            <text x="22" y="126" textAnchor="end" fontSize="11" fill="#34D399">0</text>
            {/* X labels. */}
            {['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23'].map((d, i) => (
              <text key={d} x={58 + i * 76} y="140" textAnchor="middle" fontSize="10" fill="#34D399">
                {d}
              </text>
            ))}
          </svg>
        </div>
      </section>

      {/* Engagement chart. */}
      <section className="mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold" style={{ color: INK }}>
            Engagement
          </h2>
          <button type="button" className="flex items-center gap-1 text-[14px]" style={{ color: INK }}>
            Last 3 Days
            <IconChevronDown className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <svg viewBox="0 0 340 150" className="h-auto w-full" aria-label="Minutes spent in the last 3 days">
            <line x1="30" y1="10" x2="336" y2="10" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="30" y1="10" x2="30" y2="122" stroke="#34D399" strokeWidth="1.5" />
            <line x1="30" y1="122" x2="336" y2="122" stroke="#34D399" strokeWidth="1.5" />
            <text x="22" y="14" textAnchor="end" fontSize="11" fill="#34D399">30</text>
            <text x="22" y="126" textAnchor="end" fontSize="11" fill="#34D399">0</text>
            {/* Bars: minutes per day (0, 0, 5, 22 of 30 max). */}
            {[0, 0, 5, 22].map((mins, i) => {
              const h = (mins / 30) * 112;
              return (
                <rect
                  key={i}
                  x={44 + i * 76}
                  y={122 - h}
                  width="28"
                  height={h}
                  rx="3"
                  fill="#34D399"
                />
              );
            })}
            {['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23'].map((d, i) => (
              <text key={d} x={58 + i * 76} y="140" textAnchor="middle" fontSize="10" fill="#34D399">
                {d}
              </text>
            ))}
          </svg>
        </div>
      </section>

      {/* Recent Sessions. */}
      <section className="mt-5">
        <h2 className="text-[17px] font-bold" style={{ color: INK }}>
          Recent Sessions
        </h2>
        <div className="mt-2 flex flex-col gap-2">
          {sessions.map((s) => (
            <div
              key={s.when}
              className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[14px] font-semibold" style={{ color: INK }}>
                  {s.when}
                </span>
                <span className="text-[13px] font-semibold" style={{ color: '#16A34A' }}>
                  {s.acc}
                </span>
              </div>
              <p className="mt-0.5 text-[13px]" style={{ color: MUTED }}>
                {s.surah} · {s.mins}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* Community tab. */
function CommunityTab() {
  const [mode, setMode] = useState<'Engagement' | 'Completions'>('Engagement');
  // Rows 1–6 are the reference screenshot's rows, shown as given
  // (static, no live data source). Rows 7–10 are mock rows.
  const rows = [
    { pos: '🥇', icon: '', name: 'مجتمع فارس', hrs: '13,880' },
    { pos: '🥈', icon: '', name: 'Hifdhstatus', hrs: '6,047' },
    { pos: '🥉', icon: '', name: 'صُحبة مُؤمن', hrs: '5,162' },
    { pos: '4', icon: '👊', name: '(IG: omier.elsawaf) متبطلش محاولات', hrs: '2,345' },
    { pos: '5', icon: '🌙', name: 'www.discord.gg/islam | Salam Talk', hrs: '1,878' },
    { pos: '6', icon: '🌸', name: 'البُشرى', hrs: '1,833' },
    { pos: '7', icon: '⭐', name: 'Quran Lovers', hrs: '1,500' },
    { pos: '8', icon: '📖', name: 'Daily Reciters', hrs: '1,200' },
    { pos: '9', icon: '🕌', name: 'Masjid Group', hrs: '950' },
    { pos: '10', icon: '🌟', name: 'Sisters in Islam', hrs: '800' },
  ];
  return (
    <>
      {/* My Groups. */}
      <h2 className="mt-4 text-[20px] font-bold" style={{ color: INK }}>
        My Groups
      </h2>
      <section className="mt-2 flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white px-5 py-5 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <IconNetwork />
        <p dir="rtl" lang="ar" className="font-quran mt-3 text-[16px] leading-relaxed" style={{ color: INK }}>
          وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ (سورة المطففين: ٢٦)
        </p>
        <p className="mt-2 text-[15px] leading-snug" style={{ color: INK }}>
          &quot;And in that let the competitors compete.&quot; (Quran Al-Mutaffifin:26)
        </p>
        <p className="mt-3 text-[13px] leading-relaxed" style={{ color: MUTED }}>
          Join or start a group and compete with your family and friends to see who reads the most on the
          leaderboard. Enjoy the motivation and rewards of reading together!
        </p>
        <button
          type="button"
          className="mt-4 h-11 w-[220px] rounded-full border border-[#111827] text-[14px] font-semibold tracking-wide"
          style={{ color: INK }}
        >
          JOIN A GROUP
        </button>
        <button
          type="button"
          className="mt-2.5 h-11 w-[220px] rounded-full border border-[#111827] text-[14px] font-semibold tracking-wide"
          style={{ color: INK }}
        >
          CREATE A GROUP
        </button>
      </section>

      {/* Global Group Leaderboard. */}
      <section className="mt-5">
        <h2 className="text-[20px] font-bold" style={{ color: INK }}>
          Global Group Leaderboard
        </h2>
        <div className="mt-2 flex items-center justify-between">
          <button type="button" aria-label="Previous month" className="flex h-8 w-8 items-center justify-center">
            <IconChevronLeft />
          </button>
          <p className="text-center text-[15px] leading-tight" style={{ color: MUTED }}>
            Jumada al-Thani
            <span className="block">1448</span>
          </p>
          <button type="button" aria-label="Next month" className="flex h-8 w-8 items-center justify-center">
            <IconChevronRight className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-[11px]" style={{ color: MUTED }}>
          <span className="font-bold" style={{ color: INK }}>
            Last updated:
          </span>{' '}
          Monday, November 23, 4:06 PM <span style={{ color: '#9CA3AF' }}>(local time)</span>
        </p>

        {/* Engagement / Completions toggle — switches the active
            pill only in this step. */}
        <div className="mt-3 flex gap-2" role="tablist" aria-label="Leaderboard metric">
          {(['Engagement', 'Completions'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-2 text-[14px] font-semibold ${
                mode === m ? 'border border-[#E5E7EB] bg-white shadow-sm' : 'bg-[#F3F4F6]'
              }`}
              style={{ color: mode === m ? INK : MUTED }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Table. */}
        <div className="mt-3">
          <div className="flex items-center border-b border-[#E5E7EB] pb-1.5 text-[12px]" style={{ color: MUTED }}>
            <span className="w-9 shrink-0 text-center">Pos</span>
            <span className="min-w-0 flex-1">Name</span>
            <span className="w-[86px] shrink-0 text-right">Activity</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.pos + r.name}
              className="flex items-center border-b border-[#F3F4F6] py-2.5"
            >
              <span className="w-9 shrink-0 text-center text-[15px]" style={{ color: INK }}>
                {r.pos}
              </span>
              <span className="min-w-0 flex-1 truncate text-[14px]" style={{ color: INK }} dir="auto">
                {r.icon ? `${r.icon} ` : ''}
                {r.name}
              </span>
              <span className="w-[86px] shrink-0 text-right text-[14px]" style={{ color: INK }}>
                {r.hrs} <span className="text-[10px]" style={{ color: MUTED }}>HRS</span>
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-4 flex h-11 w-full items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[13px] font-bold tracking-wide shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
          style={{ color: INK }}
        >
          View Full Leaderboard
        </button>
      </section>
    </>
  );
}

/* ---------------------------------------------------------------- */
/*  Overlay                                                            */
/* ---------------------------------------------------------------- */

const TABS = ['Dashboard', 'Goals', 'Memorization', 'Activity', 'Community'];

export default function ReaderDashboard({
  open,
  onClose,
  onOpenSettings,
}: {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}) {
  const [rendered, setRendered] = useState(open);
  const [shown, setShown] = useState(false);
  const [tab, setTab] = useState<string>('Dashboard');
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  // Greeting name: null = guest with no name stored ("Salam!").
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Mount / fade lifecycle: mount, then fade in; on close, fade out
  // and unmount after the transition.
  useEffect(() => {
    if (open) {
      setRendered(true);
      setTab('Dashboard');
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const timer = window.setTimeout(() => setRendered(false), 200);
    return () => window.clearTimeout(timer);
  }, [open ]);

  // Switching tabs scrolls the content back to the top.
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [tab]);

  // Greeting name, resolved whenever the Dashboard opens. Signed-in:
  // the Supabase profile display_name, else the email's local part.
  // Guest: the stored guest display name from the local settings
  // store, else null ("Salam!"). Never a hardcoded name.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    let guestName: string | null = null;
    try {
      guestName = loadSettings().displayName?.trim() || null;
    } catch {
      /* no stored settings — plain "Salam!" */
    }
    const sb = getSupabase();
    if (!sb) {
      setDisplayName(guestName);
      return;
    }
    void sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!alive) return;
      const user = session?.user;
      if (!user) {
        setDisplayName(guestName);
        return;
      }
      const fallback = user.email?.split('@')[0]?.trim() || guestName;
      try {
        const { data } = await sb
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle();
        const profileName = (data as { display_name?: string | null } | null)?.display_name?.trim();
        if (alive) setDisplayName(profileName || fallback);
      } catch {
        if (alive) setDisplayName(fallback);
      }
    });
    return () => {
      alive = false;
    };
  }, [open ]);

  if (!rendered) return null;

  return (
    <div
      role="dialog"
      aria-label="Dashboard"
      className="absolute inset-0 z-[70] flex flex-col transition-opacity duration-200"
      style={{ backgroundColor: '#F8F8F8', opacity: shown ? 1 : 0 }}
    >
      {/* Header: back button left, logo centre, profile + gear right.
          Stays fixed while the content below scrolls. */}
      <header className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
        <button
          type="button"
          aria-label="Back to reader"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D1D5DB] bg-white"
        >
          <IconChevronLeft />
        </button>
        <LogoDiamonds className="h-6 w-10" />
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Profile" className="flex h-7 w-7 items-center justify-center">
            <IconProfile />
          </button>
          <button type="button" aria-label="Settings" onClick={onOpenSettings} className="flex h-7 w-7 items-center justify-center">
            <IconGear />
          </button>
        </div>
      </header>

      {/* Tabs: the active one is bold black with a black underline,
          the rest grey. Horizontal scroll if they overflow. Tapping
          a tab swaps the content below. */}
      <nav className="shrink-0 border-b border-[#E5E7EB] px-4" aria-label="Dashboard sections">
        <div className="flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`shrink-0 whitespace-nowrap pb-2 pt-1 text-[16px] ${
                tab === t
                  ? 'border-b-[3px] border-[#111827] font-bold'
                  : 'border-b-[3px] border-transparent'
              }`}
              style={{ color: tab === t ? INK : '#9CA3AF' }}
            >
              {t}
            </button>
          ))}
        </div>
      </nav>

      {/* Scrollable content — the active tab's view. */}
      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
        {tab === 'Dashboard' && <DashboardTab displayName={displayName} />}
        {tab === 'Goals' && <GoalsTab />}
        {tab === 'Memorization' && <MemorizationTab />}
        {tab === 'Activity' && <ActivityTab />}
        {tab === 'Community' && <CommunityTab />}
      </div>
    </div>
  );
}
