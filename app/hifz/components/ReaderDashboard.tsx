// app/hifz/components/ReaderDashboard.tsx — Steps 6 + 7 of the
// step-by-step Tarteel match: the "Dashboard" screen. Opens from the
// hamburger in the reader's top bar (replacing the Step 1 chapter
// drawer; chapter navigation stays available via the central top-bar
// pill). Vertically scrollable: top bar (back, two-diamond logo,
// profile, gear), tabs (Dashboard / Goals / Memorization / Activity /
// Community) that dynamically swap the content below, and the tab
// views. Step 6 built the Dashboard tab; Step 7 made all four other
// tabs functional. The gear opens the Step 5 Settings screen; the
// profile icon opens the account card (real sign-in state + sign out).
// No "Tarteel" / "Premium" wording anywhere — the promo button says
// "Discover All Free Features" and opens the real feature list.
//
// Phase 4 (live wiring): the streak ring, the goals and the session
// history are REAL, read from localStorage — sessions from
// `ili_coach_sessions_v1` (coach + reader takes), goals from
// `ili_goals_v1` (shared with the old hub), streak from session
// dates. "Start a New Goal" opens a modal that saves a goal. No
// sessions yet → an honest empty state, never mock rows.
//
// Alive pass (2026-11-25, Mehran's order: "it should be ours not
// the tarteel"): every tab is driven by the user's OWN data and every
// visible control works. The Community leaderboard reads the real
// `global_leaderboard` RPC (opted-in members only; empty until
// someone opts in — never the screenshot's names). Archived goals
// are only goals the user actually archived. Surah Progress reads
// the real memorised store. The Activity charts plot the user's real
// sessions (Pages = distinct mushaf pages per day, from sessions
// that recorded a page; Engagement = minutes per day), with a real
// 3/7/30-day range. The Activity Tracker heatmap is the real session
// days. Achievements are the real badge results. My Groups are the
// real local groups (create / join / leave work). Dead controls are
// gone; nothing here is copied from a screenshot or invented.
//
// Greeting (correction 2026-11-24): NEVER a hardcoded name. A
// signed-in user sees "Salam {profile display_name}!" (email local
// part when no display name is set); a guest sees "Salam!" or their
// stored guest display name from the local settings store.

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadProgress, loadSettings, localDateString, surahStrength } from '../progress';
import { ALL_SURAHS } from '../surahs';
import { getSupabase, signOut } from '../lib/supabase';
// Phase 4: sessions + streak + goals, all from localStorage.
import {
  formatSessionDuration,
  formatSessionWhen,
  listReaderSessions,
  streakFromSessions,
  type CoachSessionRecord,
  type StreakInfo,
} from '../lib/reader-sessions';
import {
  GOALS_KEY,
  activeGoals,
  createSimpleGoal,
  loadGoals,
  saveGoals,
  type Goal,
  type GoalAction,
} from '../lib/goals';
import { mirrorKeyToIdb } from '../lib/store';
// Alive pass: real badges, real groups, real global leaderboard.
import { TOTAL_AYAHS, buildBadgeSnapshot, evaluateBadges, loadBestTestPct } from '../badges';
import {
  createChallenge,
  daysLeft,
  groupProgress,
  loadChallenges,
  saveChallenges,
  shareLink,
  type GroupChallenge,
} from '../lib/challenges';

const INK = 'var(--reader-ink)';
const MUTED = 'var(--reader-muted)';
const GREEN = '#16A34A';

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
function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? 'h-5 w-5'} fill="none" style={{ stroke: INK }} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
function IconProfile() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" style={{ fill: INK }} />
      <circle cx="12" cy="9" r="3.4" fill="#FFFFFF" />
      <path d="M5.4 19.5c1.2-3.2 3.6-4.8 6.6-4.8s5.4 1.6 6.6 4.8" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
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
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: MUTED }} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
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

/* Streak ring: grey track + an orange arc at the top, flame centre.
 * `fraction` is how much of this week has a session (0..1) — the arc
 * grows as the week fills in. */
function StreakRing({ fraction }: { fraction: number }) {
  const arc = Math.max(0, Math.min(1, fraction)) * 163.36;
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
        strokeDasharray={`${arc.toFixed(1)} 163.36`}
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
/*  Phase 4: live — a day is checked when a session was saved on     */
/*  that local date; the count is the consecutive-day streak.        */
/* ---------------------------------------------------------------- */

function DayPill({ day, done }: { day: string; done: boolean }) {
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-2 rounded-xl px-0.5 py-2.5 ${done ? 'bg-[#DBFFF4]' : ''}`}
    >
      <span className={`text-[11px] leading-none ${done ? 'font-bold' : ''}`} style={{ color: done ? GREEN : MUTED }}>
        {day}
      </span>
      {done ? (
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
function StreakCard({ streak, onNewGoal }: { streak: StreakInfo; onNewGoal: () => void }) {
  const doneCount = streak.week.filter((d) => d.done).length;
  const dayWord = streak.count === 1 ? 'Day' : 'Days';
  const longestWord = streak.longest === 1 ? 'Day' : 'Days';
  return (
    <section className="mt-3 flex items-stretch gap-2 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      {/* Ring + count. */}
      <div className="flex w-[76px] shrink-0 flex-col items-center justify-center gap-1">
        <StreakRing fraction={doneCount / 7} />
        <p className="text-[15px] font-bold leading-none" style={{ color: '#F97316' }}>
          {streak.count} {dayWord}
        </p>
      </div>
      {/* Week panel. */}
      <div className="flex min-w-0 flex-1 flex-col justify-center rounded-xl px-2 py-3" style={{ backgroundColor: 'var(--reader-mint)' }}>
        <div className="flex gap-0.5">
          {streak.week.map((d) => (
            <DayPill key={d.label} day={d.label} done={d.done} />
          ))}
        </div>
        <p className="mt-1.5 pl-1 text-[12px] leading-none" style={{ color: GREEN }}>
          Longest Streak <span className="font-bold">{streak.longest} {longestWord}</span>
        </p>
      </div>
      {/* Add: a real button — opens the new-goal modal. The bell
          is gone: it had no reminders screen behind it, so it was
          a dead control. */}
      <div className="flex w-6 shrink-0 flex-col items-center justify-end py-1">
        <button
          type="button"
          aria-label="Start a new goal"
          onClick={onNewGoal}
          className="flex h-6 w-6 items-center justify-center"
        >
          <IconPlusCircle />
        </button>
      </div>
    </section>
  );
}

/* Full-width white "START A NEW GOAL" button, as on the Dashboard's
 * Today's Goals section and at the top of the Goals tab. Phase 4:
 * opens the new-goal modal. */
function StartGoalButton({ onNewGoal }: { onNewGoal: () => void }) {
  return (
    <button
      type="button"
      onClick={onNewGoal}
      className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white text-[13px] font-bold tracking-wide shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
      style={{ color: INK }}
    >
      START A NEW GOAL
      <IconPlusGreen />
    </button>
  );
}

/* A saved goal as a white card — used in the Dashboard's Today's
 * Goals and the Goals tab's Active section (Phase 4). When the
 * Goals tab passes `onArchive` / `onDelete`, the card shows the two
 * real actions: Archive moves the goal to Archived (the model has
 * `archived`), Delete removes it for good. */
function GoalCard({
  goal,
  onArchive,
  onDelete,
}: {
  goal: Goal;
  onArchive?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold" style={{ color: INK }}>
            {goal.name}
          </span>
          <span className="block text-[12px]" style={{ color: MUTED }}>
            {goal.action} · {goal.portion} · {goal.schedule}
          </span>
        </span>
      </div>
      {(onArchive || onDelete) && (
        <div className="mt-2 flex gap-2 border-t border-[#F3F4F6] pt-2">
          {onArchive && (
            <button
              type="button"
              onClick={onArchive}
              className="rounded-full border border-[#D1D5DB] px-3 py-1 text-[12px] font-semibold"
              style={{ color: INK }}
            >
              Archive
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full border border-[#FECACA] px-3 py-1 text-[12px] font-semibold"
              style={{ color: '#DC2626' }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* "Start a New Goal" modal (Phase 4): a name + an action
 * (Memorize / Review). Saving creates a goal in the shared
 * `ili_goals_v1` store. Alive pass: the action choice, so the
 * Memorization tab's Review Goal row can open it as a Review goal. */
function GoalModal({
  open,
  onClose,
  onSave,
  initialAction = 'Memorize',
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, action: GoalAction) => void;
  initialAction?: GoalAction;
}) {
  const [name, setName] = useState('');
  const [action, setAction] = useState<GoalAction>('Memorize');
  // A fresh, empty input (and the preset action) every time the
  // modal opens.
  useEffect(() => {
    if (open) {
      setName('');
      setAction(initialAction);
    }
  }, [open, initialAction ]);
  if (!open) return null;
  const trimmed = name.trim();
  return (
    <div
      className="absolute inset-0 z-[80] flex items-end justify-center bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full rounded-t-3xl bg-white p-5 pb-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Start a new goal"
      >
        <h2 className="text-[18px] font-bold" style={{ color: INK }}>
          Start a New Goal
        </h2>
        <p className="mt-1 text-[13px] leading-snug" style={{ color: MUTED }}>
          Give your goal a name — for example, “Memorize Surah Al-Mulk”.
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && trimmed) onSave(trimmed, action);
          }}
          placeholder="Goal name"
          aria-label="Goal name"
          className="mt-4 h-12 w-full rounded-xl border border-[#D1D5DB] px-4 text-[15px] outline-none focus:border-[#16A34A]"
        />
        <div className="mt-3 flex gap-2" role="group" aria-label="Goal action">
          {(['Memorize', 'Review'] as const).map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={action === a}
              onClick={() => setAction(a)}
              className="h-9 flex-1 rounded-full border text-[14px] font-semibold"
              style={
                action === a
                  ? { backgroundColor: '#16A34A', borderColor: '#16A34A', color: '#FFFFFF' }
                  : { borderColor: '#D1D5DB', color: INK }
              }
            >
              {a}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-full border border-[#D1D5DB] text-[15px] font-semibold"
            style={{ color: INK }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!trimmed}
            onClick={() => onSave(trimmed, action)}
            className="h-11 flex-1 rounded-full text-[15px] font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: '#16A34A' }}
          >
            Save Goal
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Tab views                                                          */
/* ---------------------------------------------------------------- */

/* Dashboard tab — the Step 6 content. Alive pass: the promo opens
 * the real Gift / feature list, the Highlights card opens Testing
 * Mode, and "See All" jumps to the Goals tab. */
function DashboardTab({
  displayName,
  goals,
  streak,
  onNewGoal,
  onOpenGift,
  onTestYourself,
  onGoToTab,
}: {
  displayName: string | null;
  goals: Goal[];
  streak: StreakInfo;
  onNewGoal: () => void;
  onOpenGift: () => void;
  onTestYourself: () => void;
  onGoToTab: (tab: string) => void;
}) {
  return (
    <>
      {/* Greeting — dynamic name, never hardcoded. */}
      <h1 className="mt-4 text-[20px] font-bold leading-tight" style={{ color: INK }}>
        {displayName ? `Salam ${displayName}!` : 'Salam!'}
      </h1>

      <StreakCard streak={streak} onNewGoal={onNewGoal} />

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
          onClick={onOpenGift}
          aria-label="Discover all free features"
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
          <button
            type="button"
            onClick={onTestYourself}
            aria-label="Testing Mode — test your memorization"
            className="flex h-[228px] w-[220px] shrink-0 flex-col overflow-hidden rounded-2xl bg-black p-3 text-left"
          >
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
          </button>
        </div>
      </section>

      {/* Today's Goals — Phase 4: the saved goals, from localStorage. */}
      <section className="mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold" style={{ color: INK }}>
            Today&apos;s Goals
          </h2>
          <button type="button" onClick={() => onGoToTab('Goals')} className="text-[13px]" style={{ color: MUTED }}>
            See All
          </button>
        </div>
        <StartGoalButton onNewGoal={onNewGoal} />
        {goals.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {goals.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

/* Goals tab — alive pass: Archived is ONLY goals the user actually
 * archived (the `archived` flag on the goal model); an empty state
 * when there are none. Active goal cards carry real Archive /
 * Delete actions; archived rows carry Restore / Delete. */
function GoalsTab({
  goals,
  onNewGoal,
  onArchiveGoal,
  onDeleteGoal,
  onRestoreGoal,
}: {
  /** ALL goals (active + archived) — the tab splits them. */
  goals: Goal[];
  onNewGoal: () => void;
  onArchiveGoal: (id: string) => void;
  onDeleteGoal: (id: string) => void;
  onRestoreGoal: (id: string) => void;
}) {
  const active = activeGoals(goals);
  const archived = goals.filter((g) => g.archived);
  return (
    <>
      <StartGoalButton onNewGoal={onNewGoal} />

      {/* Active — Phase 4: the saved goals as white cards. */}
      <section className="mt-5">
        <h2 className="text-[17px] font-bold" style={{ color: INK }}>
          Active
        </h2>
        <p className="mt-1 text-[13px] leading-snug" style={{ color: MUTED }}>
          Goals you are trying to complete. Tap Archive on a goal to move it here, or Delete to remove it.
        </p>
        <div className="mt-3 border-t border-[#E5E7EB]" />
        {active.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {active.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onArchive={() => onArchiveGoal(g.id)}
                onDelete={() => onDeleteGoal(g.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Today's goals. */}
      <section className="mt-4">
        <h3 className="text-[11px] font-bold tracking-wide" style={{ color: INK }}>
          TODAY&apos;S GOALS
        </h3>
        {active.length === 0 ? (
          <div className="mt-2 flex h-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[15px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]" style={{ color: INK }}>
            None
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {active.map((g) => (
              <div
                key={g.id}
                className="flex min-h-11 items-center rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-[15px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                style={{ color: INK }}
              >
                {g.name}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming goals — the goal model has no scheduled/future
          goals, so this is honestly empty until that exists. */}
      <section className="mt-4">
        <h3 className="text-[11px] font-bold tracking-wide" style={{ color: INK }}>
          UPCOMING GOALS
        </h3>
        <div className="mt-2 flex h-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[15px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]" style={{ color: INK }}>
          None
        </div>
      </section>

      {/* Archived — only goals the user actually archived. */}
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
        {archived.length === 0 ? (
          <p className="mt-3 text-[14px] leading-snug" style={{ color: MUTED }}>
            No archived goals yet. Archive a goal above to move it here.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {archived.map((g) => (
              <div
                key={g.id}
                className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-center gap-3">
                  <IconCheckGrey />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] line-through" style={{ color: MUTED }}>
                      {g.name}
                    </span>
                    <span className="block text-[12px]" style={{ color: MUTED }}>
                      {g.action} · {g.portion} · {g.schedule}
                    </span>
                  </span>
                </div>
                <div className="mt-2 flex gap-2 border-t border-[#F3F4F6] pt-2">
                  <button
                    type="button"
                    onClick={() => onRestoreGoal(g.id)}
                    className="rounded-full border border-[#D1D5DB] px-3 py-1 text-[12px] font-semibold"
                    style={{ color: INK }}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteGoal(g.id)}
                    className="rounded-full border border-[#FECACA] px-3 py-1 text-[12px] font-semibold"
                    style={{ color: '#DC2626' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

/* Memorization tab — alive pass: everything here reads the REAL
 * memorised store (`ili_hifz_v1`). Surah Progress lists every surah
 * with any practice (memorised + learning), sorted by strength;
 * Completion is the real share of the Quran's 6,236 ayahs memorised;
 * the two goal rows show the newest active goal of that action, or
 * "Not Set" — tapping one opens the new-goal modal preset to that
 * action. Nothing practised yet → an honest empty state. */
function MemorizationTab({
  goals,
  onNewGoal,
}: {
  goals: Goal[];
  onNewGoal: (action: GoalAction) => void;
}) {
  const strengths = surahStrength(loadProgress(), ALL_SURAHS);
  const memorisedTotal = strengths.reduce((sum, s) => sum + s.memorised, 0);
  const completionPct = Math.round((memorisedTotal / TOTAL_AYAHS) * 100);
  const memGoal = goals.find((g) => g.action === 'Memorize') ?? null;
  const revGoal = goals.find((g) => g.action === 'Review') ?? null;
  return (
    <>
      {/* Memorization Completion — a display card, not a button: it
          has no destination of its own. */}
      <div className="mt-3 flex w-full items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <span>
          <span className="block text-[16px] leading-snug" style={{ color: INK }}>
            Memorization Completion
          </span>
          <span className="block text-[22px] font-semibold leading-snug" style={{ color: '#34D399' }}>
            {completionPct}%
          </span>
          <span className="block text-[12px] leading-snug" style={{ color: MUTED }}>
            {memorisedTotal.toLocaleString()} of {TOTAL_AYAHS.toLocaleString()} ayahs memorised
          </span>
        </span>
      </div>

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
          onClick={() => onNewGoal('Memorize')}
          className="mt-2 flex w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-left shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
        >
          <span>
            <span className="block text-[16px] leading-snug" style={{ color: INK }}>
              Memorization Goal
            </span>
            <span className="block truncate text-[18px] leading-snug" style={{ color: '#34D399' }}>
              {memGoal ? memGoal.name : 'Not Set'}
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
          onClick={() => onNewGoal('Review')}
          className="mt-2 flex w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-left shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
        >
          <span>
            <span className="block text-[16px] leading-snug" style={{ color: INK }}>
              Review Goal
            </span>
            <span className="block truncate text-[18px] leading-snug" style={{ color: '#34D399' }}>
              {revGoal ? revGoal.name : 'Not Set'}
            </span>
          </span>
          <IconChevronRight className="h-6 w-6" />
        </button>
      </section>

      {/* Surah Progress — real, from the memorised store. */}
      <section className="mt-6">
        <h2 className="text-[20px] font-bold" style={{ color: INK }}>
          Surah Progress
        </h2>
        {strengths.length === 0 ? (
          <p className="mt-2 text-[14px] leading-snug" style={{ color: MUTED }}>
            No surahs practised yet. Recite with the mic in the reader, or mark ayahs memorised, and your
            progress will show here.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {strengths.map((s) => (
              <div
                key={s.surah}
                className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
              >
                <span className="w-[86px] shrink-0 truncate text-[15px] font-semibold" style={{ color: INK }}>
                  {s.name}
                </span>
                <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${s.strengthPct}%`, backgroundColor: '#22C55E' }}
                  />
                </span>
                <span className="w-[86px] shrink-0 whitespace-nowrap text-right text-[12px]" style={{ color: MUTED }}>
                  {s.memorised}/{s.ayahCount} Verses
                  {s.learning > 0 ? ` · ${s.learning} learning` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

/* A small bar chart from real per-day values. `values` are the
 * counts, `labels` the short day labels shown under every Nth bar.
 * When every value is zero the caller shows an honest empty state
 * instead of this chart. */
function BarChart({ values, labels, unit }: { values: number[]; labels: string[]; unit: string }) {
  const max = Math.max(1, ...values);
  const W = 340;
  const H = 150;
  const left = 30;
  const bottom = 122;
  const top = 10;
  const slot = (W - left - 6) / values.length;
  const barW = Math.min(28, slot * 0.55);
  const labelEvery = values.length > 10 ? 5 : values.length > 7 ? 2 : 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-label={`${unit} per day`}>
      <line x1={left} y1={top} x2={W - 4} y2={top} stroke="#D1D5DB" strokeWidth="1" strokeDasharray="4 4" />
      <line x1={left} y1={top} x2={left} y2={bottom} stroke="#34D399" strokeWidth="1.5" />
      <line x1={left} y1={bottom} x2={W - 4} y2={bottom} stroke="#34D399" strokeWidth="1.5" />
      <text x={left - 8} y={top + 4} textAnchor="end" fontSize="11" fill="#34D399">
        {max}
      </text>
      <text x={left - 8} y={bottom + 4} textAnchor="end" fontSize="11" fill="#34D399">
        0
      </text>
      {values.map((v, i) => {
        const h = (v / max) * (bottom - top);
        const x = left + i * slot + (slot - barW) / 2;
        return (
          <rect
            key={i}
            x={x}
            y={bottom - h}
            width={barW}
            height={v > 0 ? Math.max(h, 2) : 0}
            rx="3"
            fill="#34D399"
          />
        );
      })}
      {labels.map((d, i) =>
        i % labelEvery === 0 ? (
          <text key={d} x={left + i * slot + slot / 2} y={bottom + 18} textAnchor="middle" fontSize="10" fill="#34D399">
            {d}
          </text>
        ) : null,
      )}
    </svg>
  );
}

/* Activity tab — Phase 4: Session History + Recent Sessions read the
 * saved sessions from localStorage (coach + reader takes, newest
 * first). Alive pass: the charts plot the user's REAL sessions
 * (Pages = distinct mushaf pages per day, from takes that recorded
 * a page; Engagement = minutes per day), the range selector really
 * filters (Last 3 / 7 / 30 Days), the Activity Tracker is a real
 * 12-week heatmap of session days, and Achievements are the real
 * badge results. No sessions yet → an honest empty state, never
 * mock rows. */
function ActivityTab({
  sessions,
  streak,
  onNewGoal,
}: {
  sessions: CoachSessionRecord[];
  streak: StreakInfo;
  onNewGoal: () => void;
}) {
  const [rangeDays, setRangeDays] = useState<3 | 7 | 30>(3);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const recentRef = useRef<HTMLElement | null>(null);
  const recent = [...sessions].reverse();

  // The days in the selected range (local dates, oldest first).
  const days = useMemo(() => {
    const out: string[] = [];
    const now = new Date();
    for (let i = rangeDays - 1; i >= 0; i--) {
      out.push(localDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)));
    }
    return out;
  }, [rangeDays]);
  const dayLabels = useMemo(
    () =>
      days.map((d) => {
        const [y, m, day] = d.split('-').map(Number);
        return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
    [days],
  );

  // Per-day aggregates from the real sessions: minutes, distinct
  // mushaf pages (only takes that recorded a page), session count.
  const byDay = useMemo(() => {
    const map = new Map<string, { minutes: number; pages: Set<number> }>();
    for (const s of sessions) {
      const day = localDateString(new Date(s.date));
      const e = map.get(day) ?? { minutes: 0, pages: new Set<number>() };
      e.minutes += s.durationSec / 60;
      if (typeof s.page === 'number') e.pages.add(s.page);
      map.set(day, e);
    }
    return map;
  }, [sessions]);
  const pagesData = days.map((d) => byDay.get(d)?.pages.size ?? 0);
  const minutesData = days.map((d) => Math.round(byDay.get(d)?.minutes ?? 0));
  const hasPagesData = pagesData.some((v) => v > 0);
  const hasMinutesData = minutesData.some((v) => v > 0);

  // Heatmap: the last 12 weeks, weeks running Fri–Thu like the
  // streak. A cell is green on a day a session was saved.
  const sessionDays = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) set.add(localDateString(new Date(s.date)));
    return set;
  }, [sessions]);
  const heatWeeks = useMemo(() => {
    const today = new Date();
    const todayStr = localDateString(today);
    // Friday = 5; step back to this week's Friday.
    const offsetToFriday = (today.getDay() - 5 + 7) % 7;
    const thisFriday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offsetToFriday);
    const weeks: string[][] = [];
    for (let w = 11; w >= 0; w--) {
      const fri = new Date(thisFriday.getFullYear(), thisFriday.getMonth(), thisFriday.getDate() - w * 7);
      const ds: string[] = [];
      for (let i = 0; i < 7; i++) ds.push(localDateString(new Date(fri.getFullYear(), fri.getMonth(), fri.getDate() + i)));
      weeks.push(ds);
    }
    return { weeks, todayStr };
  }, []);

  // Achievements — the real badge results from the progress store.
  const badgeResults = useMemo(
    () => evaluateBadges(buildBadgeSnapshot(loadProgress(), { bestTestPct: loadBestTestPct() })),
    [],
  );
  const earnedBadges = badgeResults.filter((r) => r.earned);

  return (
    <>
      <StreakCard streak={streak} onNewGoal={onNewGoal} />

      {/* Session History — jumps to the Recent Sessions list below. */}
      <button
        type="button"
        onClick={() => recentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        className="mt-3 flex w-full items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-left shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
      >
        <span>
          <span className="block text-[16px] leading-snug" style={{ color: INK }}>
            Session History
          </span>
          <span className="block text-[18px] leading-snug" style={{ color: '#34D399' }}>
            {sessions.length}
          </span>
        </span>
        <IconChevronRight className="h-6 w-6" />
      </button>

      {/* Achievements — the real badge results from the progress
          store. "See All" expands the full list of 20 badges with
          their progress; earned ones are marked. */}
      <section className="mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold" style={{ color: INK }}>
            Achievements
          </h2>
          <button
            type="button"
            onClick={() => setShowAllBadges((v) => !v)}
            aria-expanded={showAllBadges}
            className="text-[13px]"
            style={{ color: MUTED }}
          >
            {showAllBadges ? 'See Less' : 'See All'}
          </button>
        </div>
        <p className="mt-1 text-[14px]" style={{ color: MUTED }}>
          {earnedBadges.length === 0
            ? 'No badges have been earned yet.'
            : `${earnedBadges.length} of ${badgeResults.length} badges earned: ${earnedBadges.map((r) => r.badge.name).join(', ')}.`}
        </p>
        {showAllBadges && (
          <div className="mt-2 flex flex-col gap-2">
            {badgeResults.map((r) => (
              <div
                key={r.badge.id}
                className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[15px] font-bold"
                  style={{
                    backgroundColor: r.earned ? '#DCFCE7' : '#F3F4F6',
                    color: r.earned ? '#16A34A' : '#9CA3AF',
                  }}
                  aria-hidden="true"
                >
                  {r.earned ? '✓' : '○'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold" style={{ color: INK }}>
                    {r.badge.name}
                  </span>
                  <span className="block text-[12px] leading-snug" style={{ color: MUTED }}>
                    {r.badge.description}
                  </span>
                  {!r.earned && (
                    <span className="block text-[12px]" style={{ color: MUTED }}>
                      {r.current} / {r.target}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Activity Tracker — a real 12-week heatmap: one cell per
          day (weeks run Fri–Thu, like the streak); a green cell is
          a day a session was saved. Free, never a paywall. */}
      <section className="mt-4">
        <h2 className="text-[17px] font-bold" style={{ color: INK }}>
          Activity Tracker
        </h2>
        <div className="mt-2 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex gap-[3px]" role="img" aria-label={`Activity in the last 12 weeks: ${sessionDays.size} session days`}>
            {heatWeeks.weeks.map((week, wi) => (
              <div key={wi} className="flex flex-1 flex-col gap-[3px]">
                {week.map((d) => {
                  const future = d > heatWeeks.todayStr;
                  const done = sessionDays.has(d);
                  return (
                    <span
                      key={d}
                      title={d}
                      className="aspect-square w-full rounded-[3px]"
                      style={{
                        backgroundColor: done ? '#22C55E' : future ? 'transparent' : '#EDEFF1',
                        border: future ? '1px solid #F3F4F6' : 'none',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[12px]" style={{ color: MUTED }}>
            {sessionDays.size === 0
              ? 'No sessions in the last 12 weeks yet.'
              : `${sessionDays.size} session ${sessionDays.size === 1 ? 'day' : 'days'} in the last 12 weeks.`}
          </p>
        </div>
      </section>

      {/* Pages chart — real: distinct mushaf pages practised per
          day, from takes that recorded a page. Takes saved before
          the page was recorded (or coach sessions) carry no page
          and are honestly left out. */}
      <section className="mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold" style={{ color: INK }}>
            Pages
          </h2>
          <select
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value) as 3 | 7 | 30)}
            aria-label="Pages chart range"
            className="rounded-lg border border-[#E5E7EB] bg-white px-2 py-1 text-[14px] outline-none"
            style={{ color: INK }}
          >
            <option value={3}>Last 3 Days</option>
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
          </select>
        </div>
        <div className="mt-2 rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          {hasPagesData ? (
            <BarChart values={pagesData} labels={dayLabels} unit="Pages" />
          ) : (
            <p className="px-2 py-6 text-[14px] leading-snug" style={{ color: MUTED }}>
              No pages recorded yet in this range. Recite with the mic in the reader — each take records its
              mushaf page here.
            </p>
          )}
        </div>
      </section>

      {/* Engagement chart — real: minutes practised per day. */}
      <section className="mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold" style={{ color: INK }}>
            Engagement
          </h2>
          <select
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value) as 3 | 7 | 30)}
            aria-label="Engagement chart range"
            className="rounded-lg border border-[#E5E7EB] bg-white px-2 py-1 text-[14px] outline-none"
            style={{ color: INK }}
          >
            <option value={3}>Last 3 Days</option>
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
          </select>
        </div>
        <div className="mt-2 rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          {hasMinutesData ? (
            <BarChart values={minutesData} labels={dayLabels} unit="Minutes" />
          ) : (
            <p className="px-2 py-6 text-[14px] leading-snug" style={{ color: MUTED }}>
              No minutes recorded yet in this range. Recite with the mic in the reader to record practice time.
            </p>
          )}
        </div>
      </section>

      {/* Recent Sessions — Phase 4: the saved sessions, newest first.
          The Session History button above scrolls here. */}
      <section ref={recentRef} className="mt-5 scroll-mt-2">
        <h2 className="text-[17px] font-bold" style={{ color: INK }}>
          Recent Sessions
        </h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-[14px] leading-snug" style={{ color: MUTED }}>
            No sessions yet. Tap the mic in the reader and recite to record your first session.
          </p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {recent.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[14px] font-semibold" style={{ color: INK }}>
                    {formatSessionWhen(s.date)}
                  </span>
                  <span className="text-[13px] font-semibold" style={{ color: '#16A34A' }}>
                    {Math.round(s.accuracy)}% Accuracy
                  </span>
                </div>
                <p className="mt-0.5 text-[13px]" style={{ color: MUTED }}>
                  {s.surah ?? s.range} · {formatSessionDuration(s.durationSec)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

/* Community tab — alive pass: the Global Group Leaderboard reads
 * the REAL `global_leaderboard` RPC (migration 0002, applied live
 * 2026-11-25): only members who opted in appear, with their display
 * name, memorised ayahs and streaks. Until anyone opts in the board
 * is honestly empty — never the screenshot's names, never invented
 * rows. The month buttons are gone (the RPC has no month dimension —
 * monthly data is not faked). Engagement sorts by current streak,
 * Completions by memorised ayahs. "View Full Leaderboard" shows all
 * 50 rows the RPC returns. My Groups are the real local groups
 * (same store as /hifz/challenges): CREATE makes a group that
 * appears here with its code + share link; JOIN takes a pasted code
 * and stores the membership on this device, with a clear note that
 * groups are device-local. */
type GlobalRow = {
  displayName: string;
  memorisedAyahs: number;
  currentStreak: number;
  longestStreak: number;
};

/* Create / Join group modal — a small bottom sheet over the
 * dashboard. Create: a name + your name (Al-Fatihah, 10 ayahs, 7
 * days — the same defaults as the challenges page). Join: a pasted
 * code + your name. */
function GroupModal({
  mode,
  onClose,
  onCreate,
  onJoin,
}: {
  mode: 'create' | 'join';
  onClose: () => void;
  onCreate: (name: string, myName: string) => void;
  onJoin: (code: string, myName: string) => void;
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [myName, setMyName] = useState('');
  const primary = mode === 'create' ? name.trim() : code.trim();
  const save = () => {
    if (!primary) return;
    if (mode === 'create') onCreate(name.trim(), myName.trim());
    else onJoin(code.trim(), myName.trim());
  };
  return (
    <div
      className="absolute inset-0 z-[85] flex items-end justify-center bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full rounded-t-3xl bg-white p-5 pb-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={mode === 'create' ? 'Create a group' : 'Join a group'}
      >
        <h2 className="text-[18px] font-bold" style={{ color: INK }}>
          {mode === 'create' ? 'Create a Group' : 'Join a Group'}
        </h2>
        <p className="mt-1 text-[13px] leading-snug" style={{ color: MUTED }}>
          {mode === 'create'
            ? 'A group for Al-Fatihah — 10 ayahs in 7 days. Share its code and your family and friends can join from their own devices.'
            : 'Paste the group code you were given. The group is stored on this device only.'}
        </p>
        {mode === 'create' ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
            }}
            placeholder="Group name"
            aria-label="Group name"
            className="mt-4 h-12 w-full rounded-xl border border-[#D1D5DB] px-4 text-[15px] outline-none focus:border-[#16A34A]"
          />
        ) : (
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
            }}
            placeholder="Group code, e.g. HIFZ-7K2Q"
            aria-label="Group code"
            className="mt-4 h-12 w-full rounded-xl border border-[#D1D5DB] px-4 text-[15px] outline-none focus:border-[#16A34A]"
          />
        )}
        <input
          value={myName}
          onChange={(e) => setMyName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
          }}
          placeholder="Your name in the group"
          aria-label="Your name in the group"
          className="mt-2 h-12 w-full rounded-xl border border-[#D1D5DB] px-4 text-[15px] outline-none focus:border-[#16A34A]"
        />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-full border border-[#D1D5DB] text-[15px] font-semibold"
            style={{ color: INK }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!primary}
            onClick={save}
            className="h-11 flex-1 rounded-full text-[15px] font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: '#16A34A' }}
          >
            {mode === 'create' ? 'Create Group' : 'Join Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommunityTab() {
  const [mode, setMode] = useState<'Engagement' | 'Completions'>('Engagement');
  const [rows, setRows] = useState<GlobalRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [groups, setGroups] = useState<GroupChallenge[]>(() => loadChallenges());
  const [groupModal, setGroupModal] = useState<'create' | 'join' | null>(null);
  const [groupMsg, setGroupMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // The real global board, fetched when the tab renders.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const sb = getSupabase();
        if (!sb) return;
        const { data, error } = await sb.rpc('global_leaderboard', { p_limit: 50 });
        if (!alive || error || !Array.isArray(data)) return;
        const parsed: GlobalRow[] = [];
        for (const r of data as unknown[]) {
          if (typeof r !== 'object' || r === null) continue;
          const rec = r as Record<string, unknown>;
          if (typeof rec.display_name !== 'string' || !rec.display_name.trim()) continue;
          parsed.push({
            displayName: rec.display_name.trim().slice(0, 40),
            memorisedAyahs: typeof rec.memorised_ayahs === 'number' ? rec.memorised_ayahs : 0,
            currentStreak: typeof rec.current_streak === 'number' ? rec.current_streak : 0,
            longestStreak: typeof rec.longest_streak === 'number' ? rec.longest_streak : 0,
          });
        }
        setRows(parsed);
        setUpdatedAt(new Date());
      } catch {
        /* offline — the board stays empty, never fake */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Engagement = current streak; Completions = memorised ayahs.
  const sorted = [...rows].sort((a, b) =>
    mode === 'Engagement' ? b.currentStreak - a.currentStreak : b.memorisedAyahs - a.memorisedAyahs,
  );
  const shown = showAll ? sorted : sorted.slice(0, 10);

  const persistGroups = (next: GroupChallenge[]) => {
    saveChallenges(next);
    setGroups(next);
  };
  const createGroup = (name: string, myName: string) => {
    const c = createChallenge({ name, surah: ALL_SURAHS[0], targetAyahs: 10, days: 7, myName });
    persistGroups([c, ...groups]);
    setGroupModal(null);
    setGroupMsg(`Group created — share the code ${c.code} with your family and friends.`);
  };
  const joinGroup = (code: string, myName: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    if (groups.some((g) => g.code === clean)) {
      setGroupMsg(`${clean} is already on this device.`);
      setGroupModal(null);
      return;
    }
    const now = new Date();
    const c: GroupChallenge = {
      id: `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
      code: clean,
      name: `${ALL_SURAHS[0].name} challenge`,
      surahId: ALL_SURAHS[0].id,
      surahName: ALL_SURAHS[0].name,
      targetAyahs: 10,
      days: 7,
      createdAt: now.toISOString(),
      endsAt: new Date(now.getTime() + 7 * 86400000).toISOString(),
      members: [{ name: myName.trim() || 'Me', ayahs: 0, updatedAt: now.toISOString(), mine: true }],
    };
    persistGroups([c, ...groups]);
    setGroupModal(null);
    setGroupMsg(`Joined ${clean}. Groups live only on this device.`);
  };
  const leaveGroup = (id: string) => {
    persistGroups(groups.filter((g) => g.id !== id));
    setGroupMsg('You left the group. Your copy on this device is removed; the group continues without you.');
  };
  const copyShareLink = async (c: GroupChallenge) => {
    const link = shareLink(c, window.location.origin);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedCode(c.code);
      window.setTimeout(() => setCopiedCode((v) => (v === c.code ? null : v)), 2000);
    } catch {
      setGroupMsg(`Share link: ${link}`);
    }
  };

  return (
    <>
      {/* My Groups — the real local groups. */}
      <h2 className="mt-4 text-[20px] font-bold" style={{ color: INK }}>
        My Groups
      </h2>
      {groupMsg && (
        <p role="status" className="mt-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1FA36B]">
          {groupMsg}
        </p>
      )}
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
          leaderboard. Enjoy the motivation and rewards of reading together! Your groups live only on this
          device.
        </p>
        <button
          type="button"
          onClick={() => setGroupModal('join')}
          className="mt-4 h-11 w-[220px] rounded-full border border-[#111827] text-[14px] font-semibold tracking-wide"
          style={{ color: INK }}
        >
          JOIN A GROUP
        </button>
        <button
          type="button"
          onClick={() => setGroupModal('create')}
          className="mt-2.5 h-11 w-[220px] rounded-full border border-[#111827] text-[14px] font-semibold tracking-wide"
          style={{ color: INK }}
        >
          CREATE A GROUP
        </button>
      </section>

      {groups.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {groups.map((g) => {
            const p = groupProgress(g);
            return (
              <div
                key={g.id}
                className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-[15px] font-semibold" style={{ color: INK }}>
                    {g.name}
                  </span>
                  <span className="shrink-0 text-[12px] font-bold" style={{ color: GREEN }}>
                    {g.code}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px]" style={{ color: MUTED }}>
                  {g.surahName} · {g.targetAyahs} ayahs · {daysLeft(g)} days left · {g.members.length}{' '}
                  {g.members.length === 1 ? 'member' : 'members'} · {p.done}/{p.goal} ayahs ({p.pct}%)
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void copyShareLink(g)}
                    className="rounded-full border border-[#D1D5DB] px-3 py-1 text-[12px] font-semibold"
                    style={{ color: INK }}
                  >
                    {copiedCode === g.code ? 'Link copied!' : 'Copy share link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => leaveGroup(g.id)}
                    className="rounded-full border border-[#FECACA] px-3 py-1 text-[12px] font-semibold"
                    style={{ color: '#DC2626' }}
                  >
                    Leave
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Global Group Leaderboard — the real opted-in members. */}
      <section className="mt-5">
        <h2 className="text-[20px] font-bold" style={{ color: INK }}>
          Global Group Leaderboard
        </h2>
        <p className="mt-1 text-[11px]" style={{ color: MUTED }}>
          <span className="font-bold" style={{ color: INK }}>
            Last updated:
          </span>{' '}
          {updatedAt
            ? `${updatedAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, ${updatedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} (local time)`
            : 'Not loaded yet'}
        </p>

        {/* Engagement / Completions toggle — a real sort: streak
            vs memorised ayahs. */}
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

        {rows.length === 0 ? (
          <p className="mt-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-4 text-[14px] leading-snug shadow-[0_1px_3px_rgba(0,0,0,0.05)]" style={{ color: MUTED }}>
            No one on the board yet — members appear here when they choose to appear in Settings → Privacy.
          </p>
        ) : (
          <>
            <div className="mt-3">
              <div className="flex items-center border-b border-[#E5E7EB] pb-1.5 text-[12px]" style={{ color: MUTED }}>
                <span className="w-8 shrink-0 text-center">Pos</span>
                <span className="min-w-0 flex-1">Name</span>
                <span className="w-[80px] shrink-0 text-right">
                  {mode === 'Engagement' ? 'Streak' : 'Memorised'}
                </span>
              </div>
              {shown.map((r, i) => (
                <div key={r.displayName} className="flex items-center border-b border-[#F3F4F6] py-2.5">
                  <span className="w-8 shrink-0 text-center text-[15px]" style={{ color: INK }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1)}
                  </span>
                  {/* dir="ltr" keeps Arabic names left-aligned at the
                      start of the Name column. */}
                  <span className="min-w-0 flex-1 truncate text-[13px]" style={{ color: INK }} dir="ltr">
                    {r.displayName}
                  </span>
                  <span className="w-[80px] shrink-0 text-right text-[14px]" style={{ color: INK }}>
                    {mode === 'Engagement' ? r.currentStreak : r.memorisedAyahs}{' '}
                    <span className="text-[10px]" style={{ color: MUTED }}>
                      {mode === 'Engagement' ? 'DAYS' : 'AYAHS'}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            {sorted.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="mt-4 flex h-11 w-full items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[13px] font-bold tracking-wide shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                style={{ color: INK }}
              >
                {showAll ? 'Show Less' : `View Full Leaderboard (${sorted.length})`}
              </button>
            )}
          </>
        )}
      </section>

      {groupModal && (
        <GroupModal
          mode={groupModal}
          onClose={() => setGroupModal(null)}
          onCreate={createGroup}
          onJoin={joinGroup}
        />
      )}
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
  onOpenGift,
  onTestYourself,
}: {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  /** Alive pass: the promo opens the Gift / feature list. */
  onOpenGift: () => void;
  /** Alive pass: the Highlights card opens Testing Mode. */
  onTestYourself: () => void;
}) {
  const [rendered, setRendered] = useState(open);
  const [shown, setShown] = useState(false);
  const [tab, setTab] = useState<string>('Dashboard');
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  // Greeting name: null = guest with no name stored ("Salam!").
  const [displayName, setDisplayName] = useState<string | null>(null);
  // Alive pass: the profile icon opens a real account card.
  const [accountOpen, setAccountOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  // Phase 4: sessions + goals + streak, read from localStorage.
  const [sessions, setSessions] = useState<CoachSessionRecord[]>(() => listReaderSessions());
  const [goals, setGoals] = useState<Goal[]>(() => loadGoals());
  const [streak, setStreak] = useState<StreakInfo>(() => streakFromSessions(listReaderSessions()));
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalModalAction, setGoalModalAction] = useState<GoalAction>('Memorize');

  // Phase 4: reload sessions/goals/streak whenever the Dashboard
  // opens, so a session or goal saved since the last visit shows up
  // (the reader saves sessions while the Dashboard is closed).
  useEffect(() => {
    if (!open) return;
    const s = listReaderSessions();
    setSessions(s);
    setGoals(loadGoals());
    setStreak(streakFromSessions(s));
  }, [open ]);

  // Phase 4: save a goal from the modal into the shared store.
  // Alive pass: archive / restore / delete, and the modal's action.
  const updateGoals = useCallback((next: Goal[]) => {
    saveGoals(next);
    setGoals(next);
    mirrorKeyToIdb(GOALS_KEY);
  }, []);
  const saveNewGoal = useCallback(
    (name: string, action: GoalAction) => {
      const goal = createSimpleGoal(name, action);
      updateGoals([goal, ...goals]);
      setGoalModalOpen(false);
    },
    [goals, updateGoals],
  );
  const openGoalModal = useCallback((action: GoalAction = 'Memorize') => {
    setGoalModalAction(action);
    setGoalModalOpen(true);
  }, []);
  const archiveGoal = useCallback(
    (id: string) => updateGoals(goals.map((g) => (g.id === id ? { ...g, archived: true } : g))),
    [goals, updateGoals],
  );
  const restoreGoal = useCallback(
    (id: string) => updateGoals(goals.map((g) => (g.id === id ? { ...g, archived: false } : g))),
    [goals, updateGoals],
  );
  const deleteGoal = useCallback(
    (id: string) => updateGoals(goals.filter((g) => g.id !== id)),
    [goals, updateGoals],
  );

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
      setSignedIn(false);
      return;
    }
    void sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!alive) return;
      const user = session?.user;
      if (!user) {
        setDisplayName(guestName);
        setSignedIn(false);
        return;
      }
      setSignedIn(true);
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
      style={{ backgroundColor: 'var(--reader-bg)', opacity: shown ? 1 : 0 }}
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
          <button
            type="button"
            aria-label="Account"
            aria-expanded={accountOpen}
            onClick={() => setAccountOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center"
          >
            <IconProfile />
          </button>
          <button type="button" aria-label="Settings" onClick={onOpenSettings} className="flex h-7 w-7 items-center justify-center">
            <IconGear />
          </button>
        </div>
      </header>

      {/* Account card — the profile icon's real destination: the
          signed-in state (or guest), a link to Account & backup,
          and sign out when signed in. */}
      {accountOpen && (
        <div className="shrink-0 border-b border-[#E5E7EB] bg-white px-4 py-3">
          <p className="text-[15px] font-semibold" style={{ color: INK }}>
            {signedIn ? `Signed in as ${displayName ?? 'your account'}` : 'Guest'}
          </p>
          <p className="mt-0.5 text-[13px] leading-snug" style={{ color: MUTED }}>
            {signedIn
              ? 'Your progress backs up to your account.'
              : 'Your progress is stored on this device. Sign in to back it up across devices.'}
          </p>
          <div className="mt-2 flex gap-2">
            <a
              href="/hifz/settings/account"
              className="rounded-full border border-[#D1D5DB] px-4 py-1.5 text-[13px] font-semibold"
              style={{ color: INK }}
            >
              Account &amp; backup
            </a>
            {signedIn && (
              <button
                type="button"
                onClick={() => {
                  void signOut().then(() => {
                    setSignedIn(false);
                    setDisplayName(null);
                    setAccountOpen(false);
                  });
                }}
                className="rounded-full border border-[#FECACA] px-4 py-1.5 text-[13px] font-semibold"
                style={{ color: '#DC2626' }}
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      )}

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
        {tab === 'Dashboard' && (
          <DashboardTab
            displayName={displayName}
            goals={activeGoals(goals)}
            streak={streak}
            onNewGoal={() => openGoalModal('Memorize')}
            onOpenGift={onOpenGift}
            onTestYourself={onTestYourself}
            onGoToTab={setTab}
          />
        )}
        {tab === 'Goals' && (
          <GoalsTab
            goals={goals}
            onNewGoal={() => openGoalModal('Memorize')}
            onArchiveGoal={archiveGoal}
            onDeleteGoal={deleteGoal}
            onRestoreGoal={restoreGoal}
          />
        )}
        {tab === 'Memorization' && <MemorizationTab goals={activeGoals(goals)} onNewGoal={openGoalModal} />}
        {tab === 'Activity' && (
          <ActivityTab sessions={sessions} streak={streak} onNewGoal={() => openGoalModal('Memorize')} />
        )}
        {tab === 'Community' && <CommunityTab />}
      </div>

      {/* New-goal modal (Phase 4). */}
      <GoalModal
        open={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        onSave={saveNewGoal}
        initialAction={goalModalAction}
      />
    </div>
  );
}
