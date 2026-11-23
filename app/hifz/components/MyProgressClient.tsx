// app/hifz/components/MyProgressClient.tsx — progress dashboard (spec §5.1).
// Client-only: everything reads localStorage. Guarded throughout — with
// storage off, the page still renders and says so; it never crashes.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  createDefaultProgress,
  loadProgress, saveProgress, loadMistakes, saveMistakes, loadSettings, saveSettings,
  exportProgress, importProgress, downloadProgressJson,
  currentStreakCount, localDateString,
  getStorageNotice,
  activityByDate, weekPracticeDays, surahStrength, revisionDue, daysSince,
  peekedDue, mistakeTypeLabel, markMistakesCorrected,
  getTypeGoals, setTypeGoalTarget, recordTypeActivity, recordMinutes, previousLocalDate,
  GOAL_TYPE_LABELS, GOAL_TYPE_DESCRIPTIONS, TYPE_GOAL_OPTIONS,
  completedSurahs, completedJuz, activitySummary, strongestSurahThisWeek, difficultAyahs,
  accuracyTrend, mistakesByTypeOverTime, weekOverWeek, ayahMistakeTrend,
  type GoalType, type HifzProgress, type MistakeEntry, type HifzSettings,
  type MistakeType, type ExternalSession, type MistakeTypeWeek,
} from '../progress';
// BB (progress hub): coach-session history + per-mistake audio playback
// read the real APIs landed by worker BA (commit 4811997):
//   listCoachSessions / CoachSessionRecord — app/hifz/lib/session-records.ts
//   loadSessionAudio — app/hifz/lib/store.ts (IndexedDB session-audio store)
import { listCoachSessions, type CoachSessionRecord } from '../lib/session-records';
import { loadSessionAudio } from '../lib/store';
import { loadBookmarks, saveBookmarks } from '../lib/bookmarks';
import { loadChallenges, saveChallenges } from '../lib/challenges';
import { loadTestSessions, loadInProgressTest, type TestSessionRecord, type InProgressTest } from '../lib/mode';
import { getSurahById, ALL_SURAHS } from '../surahs';
import { buildBadgeSnapshot, evaluateBadges, loadBestTestPct } from '../badges';
import BadgesGrid from './BadgesGrid';
import GoalsClient from './GoalsClient';
import ChallengesClient from './ChallengesClient';
import ToolIcon from '../../components/ToolIcon';
import { useT } from '../lib/i18n';

/** Small SVG progress ring for one per-type daily goal. */
function GoalRing({ done, target }: { done: number; target: number }) {
  const t = useT();
  const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={t('rb.dash.goalProgress').replace('{done}', String(done)).replace('{target}', String(target)).replace('{pct}', String(pct))}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="#E8EAED" strokeWidth="7" />
      <circle
        cx="32" cy="32" r={r} fill="none" stroke="#1FA36B" strokeWidth="7"
        strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`}
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="36" textAnchor="middle" fontSize="13" fontWeight="700" fill="#111827">
        {pct}%
      </text>
    </svg>
  );
}


/** Per-mistake "hear my recitation" button (BB). The recording is the
 *  session's stored blob from loadSessionAudio (lib/store.ts), keyed by
 *  the session id. A mistake with no recording honestly says "No
 *  recording" — never a fake player. */
function MistakeAudioButton({ sessionId }: { sessionId?: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'none' | 'error'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  useEffect(() => () => {
    audioRef.current?.pause();
    if (urlRef.current && urlRef.current.startsWith('blob:')) URL.revokeObjectURL(urlRef.current);
  }, []);
  if (!sessionId) {
    return <span className="text-xs text-[#6B7280]">No recording</span>;
  }
  const play = async () => {
    if (state === 'playing') {
      audioRef.current?.pause();
      setState('idle');
      return;
    }
    setState('loading');
    try {
      const entry = await loadSessionAudio(sessionId);
      if (!entry) {
        setState('none');
        return;
      }
      const url = URL.createObjectURL(entry.blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setState('idle');
      audio.onerror = () => setState('error');
      await audio.play();
      setState('playing');
    } catch {
      setState('error');
    }
  };
  return (
    <button
      type="button"
      onClick={play}
      disabled={state === 'loading'}
      className="font-semibold text-[#1FA36B] underline disabled:opacity-50"
    >
      {state === 'loading'
        ? 'Loading…'
        : state === 'playing'
          ? 'Pause recitation'
          : state === 'none'
            ? 'No recording'
            : state === 'error'
              ? 'Couldn’t play'
              : 'Hear my recitation'}
    </button>
  );
}

/** BB: coach sessions (CoachSessionRecord) into history rows, using the
 *  REAL measured accuracy from each record — never a derived figure. */
function coachSessionRows(sessions: CoachSessionRecord[]): { at: string; label: string; detail: string }[] {
  return sessions.map((s) => ({
    at: s.date.slice(0, 10),
    label: 'Coaching',
    detail: `${Math.round(s.accuracy)}% correct · ${s.mistakes} ${s.mistakes === 1 ? 'mistake' : 'mistakes'} · ${s.range}`,
  }));
}

function coachAccuracyRecords(sessions: CoachSessionRecord[]): { at: string; pct: number }[] {
  return sessions.map((s) => ({ at: s.date, pct: s.accuracy }));
}

/**
 * BB: link a mistake to its session recording. Mistake entries carry no
 * session id (the coach never wrote one), so the match is by same local
 * day + the ayah falling inside the session's range ("67:1" or
 * "67:1–5"). Latest matching session that day wins. This is a lookup,
 * not a guess: no same-day session covering the ayah means no
 * recording, and the row says so.
 */
function audioIdForMistake(m: MistakeEntry, sessions: CoachSessionRecord[]): string | undefined {
  if (m.sessionId) return m.sessionId;
  const day = m.date.slice(0, 10);
  let best: CoachSessionRecord | null = null;
  for (const s of sessions) {
    if (!s.audioId) continue;
    if (s.date.slice(0, 10) !== day) continue;
    const match = /^(\d+):(\d+)(?:[–-](\d+))?$/.exec(s.range.trim());
    if (!match) continue;
    const surah = Number(match[1]);
    const from = Number(match[2]);
    const to = match[3] ? Number(match[3]) : from;
    if (surah !== m.surah || m.ayah < from || m.ayah > to) continue;
    if (!best || s.date > best.date) best = s;
  }
  return best?.audioId;
}

/** Colours for the mistake-type-over-time stacked bars. */
const MISTAKE_TYPE_COLORS: Record<MistakeType, string> = {
  missed: '#1FA36B',
  incorrect: '#FF8A00',
  extra: '#38BDF8',
  repeated: '#F472B6',
  sequence: '#C9A227',
  skipped: '#9CA3AF',
};

const TABS = [
  { id: 'dashboard', label: 'rb.dash.tabDashboard' },
  { id: 'goals', label: 'rb.dash.tabGoals' },
  { id: 'memorization', label: 'rb.dash.tabMemorization' },
  { id: 'activity', label: 'rb.dash.tabActivity' },
  { id: 'community', label: 'rb.dash.tabCommunity' },
] as const;
type ProgressTab = (typeof TABS)[number]['id'];

/** Tarteel-style top bar for the progress hub: back arrow in a circle
 *  (left), our own I Love Islam logo mark centred, profile + settings
 *  (right). The logo is our own mark (public/logo.svg) — never Tarteel's. */
function HubTopBar() {
  const t = useT();
  return (
    <div className="flex items-center justify-between">
      <Link
        href="/hifz"
        aria-label={t('rb.dash.backToHifz')}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#111827] text-[#111827] hover:bg-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <Link href="/" aria-label="I Love Islam — home" className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="I Love Islam" width={36} height={36} className="h-9 w-9" />
      </Link>
      <span className="flex shrink-0 items-center gap-1">
        <Link
          href="/hifz/settings"
          aria-label="Profile"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#111827] hover:bg-white"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="8.5" r="3.2" fill="currentColor" stroke="none" />
            <path d="M5.5 19.5c1.2-3.2 3.6-4.8 6.5-4.8s5.3 1.6 6.5 4.8" fill="currentColor" stroke="none" />
          </svg>
        </Link>
        <Link
          href="/hifz/settings"
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#111827] hover:bg-white"
        >
          <ToolIcon name="settings" className="h-6 w-6" />
        </Link>
      </span>
    </div>
  );
}

/** Streak card (Dashboard + Activity tabs), rebuilt to Tarteel's
 *  horizontal layout: flame in a circle at the left with the orange day
 *  count below it, a mint-green panel in the middle with Fri–Thu day
 *  labels + diamonds and "Longest Streak N Day" at the bottom, and a
 *  bell + green plus-in-circle at the right. */
function StreakCard({ streak, longestStreak, activity, addHref, onBell }: {
  streak: number;
  longestStreak: number;
  activity: Record<string, number>;
  addHref: string;
  onBell: () => void;
}) {
  const t = useT();
  const now = new Date();
  // BB: the streak count is a true circular progress ring — progress
  // toward the user's longest streak (their own best, never an
  // invented target). A streak at its best fills the ring; no longest
  // streak yet means any live streak fills it, and 0 fills nothing.
  const ringPct =
    longestStreak > 0 ? Math.min(100, Math.round((streak / longestStreak) * 100)) : streak > 0 ? 100 : 0;
  const ringR = 24;
  const ringC = 2 * Math.PI * ringR;
  const back = (now.getDay() - 5 + 7) % 7; // days since Friday (5)
  const friday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
  const labels = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
  const days = labels.map((label, i) => {
    const d = new Date(friday.getFullYear(), friday.getMonth(), friday.getDate() + i);
    const key = localDateString(d);
    const isToday = key === localDateString(now);
    return { label, date: key, active: (activity[key] ?? 0) > 0, future: d > now, isToday };
  });
  return (
    <div className="flex items-stretch gap-3 rounded-2xl border border-[#E8EAED] bg-white p-4 shadow-sm">
      {/* Left: streak ring — flame inside a circular progress ring, day
          count below. The Fri–Thu week view (diamonds) is unchanged. */}
      <div className="flex w-14 shrink-0 flex-col items-center justify-center">
        <span className="relative flex h-14 w-14 items-center justify-center">
          <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            className="absolute inset-0"
            role="img"
            aria-label={`Streak ${streak} days — ${ringPct}% of your longest streak of ${longestStreak} days`}
          >
            <circle cx="28" cy="28" r={ringR} fill="none" stroke="#FFE9C2" strokeWidth="5" />
            <circle
              cx="28" cy="28" r={ringR} fill="none" stroke="#FF8A00" strokeWidth="5"
              strokeLinecap="round" strokeDasharray={`${(ringPct / 100) * ringC} ${ringC}`}
              transform="rotate(-90 28 28)"
            />
          </svg>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F4F5F7]">
            <ToolIcon name="flame" className="h-7 w-7 text-[#FF8A00]" />
          </span>
        </span>
        <p className="mt-1.5 whitespace-nowrap text-sm font-bold text-[#FF8A00]">
          {streak} {t('rb.dash.dayWord')}
        </p>
      </div>
      {/* Middle: mint panel — day labels, diamonds, longest streak. */}
      <div className="min-w-0 flex-1 rounded-xl bg-[#D9F7E8] px-3 py-2.5">
        <div className="flex items-start justify-between gap-1" role="img" aria-label={t('rb.dash.weekLabel')}>
          {days.map((d) => (
            <span
              key={d.date}
              className="flex flex-1 flex-col items-center gap-1.5"
              title={`${d.label} ${d.date}: ${d.active ? t('rb.dash.stPractised') : d.future ? t('rb.dash.stNotYet') : t('rb.dash.stNoPractice')}`}
            >
              <span className={`text-[11px] font-semibold ${d.isToday ? 'font-bold text-[#1FA36B]' : 'text-[#5b8a6e]'}`}>{d.label}</span>
              <span
                className={`flex h-5 w-5 rotate-45 items-center justify-center rounded-[4px] ${
                  d.active
                    ? 'bg-[#1FA36B]'
                    : d.future
                      ? 'border border-[#9DB8A8] bg-transparent'
                      : 'bg-[#C4D8CB]'
                }`}
              >
                {d.active && (
                  <ToolIcon name="check" className="h-3 w-3 -rotate-45 text-white" />
                )}
              </span>
            </span>
          ))}
        </div>
        <p className="mt-2 text-center text-xs">
          <span className="text-[#5b8a6e]">{t('rb.dash.longestStreak')} </span>
          <span className="font-bold text-[#1FA36B]">{longestStreak} {t('rb.dash.dayWord')}</span>
        </p>
      </div>
      {/* Right: bell (reminders) + green plus (log a session). */}
      <div className="flex w-8 shrink-0 flex-col items-center justify-between py-1">
        <button
          type="button"
          onClick={onBell}
          aria-label={t('rb.dash.reminders')}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#1FA36B] hover:bg-[#E4FFF2]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
        </button>
        <a
          href={addHref}
          aria-label={t('rb.dash.addSessionLink')}
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1FA36B] text-[#1FA36B] hover:bg-[#E4FFF2]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </a>
      </div>
    </div>
  );
}

/** One per-type daily goal card (Dashboard Today's Goals + Memorization
 *  Goals). A target of 0 renders as "Not Set" — targets default to 3/3/5,
 *  so this is only a defensive branch, never invented data. */
function TypeGoalCard({ type, goal, onTargetChange, onLog }: {
  type: GoalType;
  goal: { done: number; target: number };
  onTargetChange: (type: GoalType, target: number) => void;
  onLog: (type: GoalType, count: number) => void;
}) {
  const t = useT();
  const met = goal.target > 0 && goal.done >= goal.target;
  return (
    <div className="rounded-xl border border-[#E8EAED] bg-[#F4F5F7] p-4">
      <div className="flex items-center gap-3">
        {goal.target > 0 ? (
          <GoalRing done={goal.done} target={goal.target} />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#E8EAED] text-xs font-bold text-[#6B7280]">{t('rb.dash.notSet')}</span>
        )}
        <div className="min-w-0">
          <p className="font-bold text-[#111827]">{GOAL_TYPE_LABELS[type]}</p>
          <p className="text-sm text-[#6B7280]">
            {goal.target > 0 ? (
              <>{goal.done} / {goal.target} {t('common.ayahs')} {met ? t('prog.goalMetShort') : t('prog.today')}</>
            ) : (
              'Not Set'
            )}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">{GOAL_TYPE_DESCRIPTIONS[type]}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
          {t('prog.target')}
          <select
            value={goal.target}
            onChange={(e) => onTargetChange(type, Number(e.target.value))}
            className="min-h-11 rounded-lg border border-[#E8EAED] bg-white px-2 py-1.5 text-sm"
            aria-label={t('rb.dash.dailyTargetInAyahs').replace('{label}', GOAL_TYPE_LABELS[type])}
          >
            {TYPE_GOAL_OPTIONS.map((n) => (
              <option key={n} value={n}>{t('prog.ayahsOption').replace('{n}', String(n))}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => onLog(type, 1)}
          className="min-h-11 rounded-full border border-[#1FA36B] px-3 py-1.5 text-xs font-semibold text-[#1FA36B] hover:bg-[#E4FFF2]"
        >
          {t('prog.plusOne')}
        </button>
        <button
          type="button"
          onClick={() => onLog(type, 5)}
          className="min-h-11 rounded-full border border-[#1FA36B] px-3 py-1.5 text-xs font-semibold text-[#1FA36B] hover:bg-[#E4FFF2]"
        >
          {t('prog.plusFive')}
        </button>
      </div>
    </div>
  );
}

/** Memorization tab goal row (Tarteel layout): a collapsible "Memorization"
/ *  / "Review" heading, then a white card "Memorization Goal / Not Set"
 *  (or the real done/target) with a chevron. Tapping the card reveals the
 *  ring + target controls underneath — that is the goal detail. */
function MemGoalRow({ label, goalLabel, type, goal, onTargetChange, onLog }: {
  label: string;
  goalLabel: string;
  type: GoalType;
  goal: { done: number; target: number };
  onTargetChange: (type: GoalType, target: number) => void;
  onLog: (type: GoalType, count: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const value = goal.target > 0 ? `${goal.done} / ${goal.target} ayahs` : 'Not Set';
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-1 text-left"
      >
        <span className="text-base font-bold text-[#111827]">{label}</span>
        <ToolIcon
          name="chevronDown"
          className={`h-5 w-5 text-[#9CA3AF] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-expanded={detailOpen}
            onClick={() => setDetailOpen((v) => !v)}
            className="mt-2 flex w-full items-center justify-between rounded-xl border border-[#E8EAED] bg-white p-4 text-left shadow-sm"
          >
            <span>
              <span className="block text-base text-[#111827]">{goalLabel}</span>
              <span className="mt-0.5 block text-xl font-bold text-[#1FA36B]">{value}</span>
            </span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
          {detailOpen && (
            <div className="mt-3">
              <TypeGoalCard type={type} goal={goal} onTargetChange={onTargetChange} onLog={onLog} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MyProgressClient() {
  const [progress, setProgress] = useState<HifzProgress | null>(null);
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [settings, setSettings] = useState<HifzSettings | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const t = useT();
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [offlineMsg, setOfflineMsg] = useState<string | null>(null);
  const [offlineSaving, setOfflineSaving] = useState(false);
  const [swReady, setSwReady] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  // Add Session (off-platform session / streak restore, screenshot 7).
  const [addDate, setAddDate] = useState(() => previousLocalDate(localDateString()));
  const [addType, setAddType] = useState<GoalType>('reading');
  const [addAyahs, setAddAyahs] = useState(5);
  const [addMinutes, setAddMinutes] = useState(10);
  const [addMsg, setAddMsg] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ExternalSession[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ili_sessions_v1') ?? '[]') as ExternalSession[];
    } catch {
      return [];
    }
  });
  // BB: coach sessions (listCoachSessions, lib/session-records.ts).
  // Sync localStorage read; a missing/corrupt store reads as empty.
  const [coachSessions, setCoachSessions] = useState<CoachSessionRecord[]>(() => {
    try {
      return listCoachSessions();
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      setCoachSessions(listCoachSessions());
    } catch {
      /* coach history is a progressive enhancement */
    }
  }, []);
  // Mistake log filters + weak spots.
  const [mistakeFilter, setMistakeFilter] = useState<'all' | 'incorrect' | 'missed'>('all');
  // BB: which weak-spot bar is tapped open (interactive chart detail).
  const [selectedWeak, setSelectedWeak] = useState<{ surah: number; ayah: number; word: string } | null>(null);
  // BB: guest display name, edited inline on the dashboard (local only).
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  // Stage 5 (§11): delete-all-mistakes confirm step. This hook MUST live
  // with the other hooks above the loading early-return — a useState below
  // it changes the hook count between renders (React error #310).
  const [confirmClearMistakes, setConfirmClearMistakes] = useState(false);
  // Last-read + favourites (bookmarks), spec §22.4.
  const [lastRead, setLastRead] = useState<{ surah: number; name: string; slug: string; at: number } | null>(null);
  const [bookmarks, setBookmarks] = useState<{ surahNumber: number; verseNumber: number; surahName?: string }[]>([]);
  // Stage 6 (§18/§19): completed test sessions + any unfinished test, for
  // the test-performance and session-history sections. Read once on mount.
  const [testSessions, setTestSessions] = useState<TestSessionRecord[]>(() => loadTestSessions());
  const [unfinishedTest, setUnfinishedTest] = useState<InProgressTest | null>(() => loadInProgressTest());
  const [mushafPage, setMushafPage] = useState<number | null>(null);
  useEffect(() => {
    try {
      const lr = localStorage.getItem('ili_last_read_v1');
      if (lr) setLastRead(JSON.parse(lr) as { surah: number; name: string; slug: string; at: number });
      const b = localStorage.getItem('quran_bookmarks_v2');
      if (b) setBookmarks(JSON.parse(b) as { surahNumber: number; verseNumber: number; surahName?: string }[]);
      const mp = localStorage.getItem('ili_mushaf_reader_pos_v1');
      if (mp) {
        const parsed = JSON.parse(mp) as { page?: number };
        if (typeof parsed.page === 'number') setMushafPage(parsed.page);
      }
    } catch {
      /* ignore */
    }
  }, []);
  // Engagement chart range.
  const [chartRange, setChartRange] = useState<'day' | 'week' | 'month'>('day');
  // Activity tab: collapsible Session History card + Achievements grid.
  const [showHistory, setShowHistory] = useState(false);
  // BB: Session History pagination — 15 rows at a time, "Show more"
  // adds 15. The stored list itself is uncapped (see doAddSession).
  const [historyLimit, setHistoryLimit] = useState(15);
  const [showBadges, setShowBadges] = useState(false);
  // Activity tab: Pages chart range (Tarteel's "Last 3 Days" dropdown).
  const [pagesRange, setPagesRange] = useState<'3' | '7' | '14'>('3');
  // 5-tab progress hub (Dashboard / Goals / Memorization / Activity /
  // Community), in the style of the Tarteel app screenshots.
  const [tab, setTab] = useState<ProgressTab>('dashboard');
  // Signal from the Dashboard's START A NEW GOAL button: opens the
  // Goals tab's create form (GoalsClient watches this prop).
  const [goalsCreateSignal, setGoalsCreateSignal] = useState(0);
  // Real local groups, for the Community tab's My Groups card.
  const [groups, setGroups] = useState(() => loadChallenges());

  const reload = useCallback(() => {
    try {
      setProgress(loadProgress());
      setMistakes(loadMistakes());
      setSettings(loadSettings());
      setNotice(getStorageNotice());
      setTestSessions(loadTestSessions());
      setUnfinishedTest(loadInProgressTest());
      setGroups(loadChallenges());
    } catch {
      setProgress(null);
      setNotice(t('prog.loadError'));
    }
  }, [t]);

  useEffect(() => {
    reload();
    try {
      const q = new URLSearchParams(window.location.search);
      const requested = q.get('tab');
      if (
        requested === 'goals' || requested === 'memorization' ||
        requested === 'activity' || requested === 'community' || requested === 'dashboard'
      ) setTab(requested);
    } catch {
      /* ignore */
    }
    // Offline coach (§15.10): is the service worker actually controlling this page?
    try {
      if ('serviceWorker' in navigator) {
        setSwReady(!!navigator.serviceWorker.controller);
        void navigator.serviceWorker.ready.then(() => setSwReady(true)).catch(() => undefined);
      } else {
        setSwReady(false);
      }
    } catch {
      setSwReady(false);
    }
  }, [reload]);

  // Badges (free achievements, §23): derived from stored progress. The
  // snapshot is computed BEFORE the loading branch so the badges render
  // server-side too — with no progress loaded yet, a fresh default (all
  // 20 locked, 0% progress) is used. Otherwise the SSR HTML had no
  // badges markup at all and the section only appeared after hydration.
  // The fallback passes bestTestPct: null deliberately, so the server
  // render and the client hydration render are identical.
  const badgeSnapshot =
    progress === null
      ? buildBadgeSnapshot(createDefaultProgress(), { bestTestPct: null })
      : buildBadgeSnapshot(progress, { bestTestPct: loadBestTestPct() });
  const earnedCount = evaluateBadges(badgeSnapshot).filter((r) => r.earned).length;

  // Activity tab — Session History rows (hand-logged sessions + completed
  // tests + coach sessions, newest first). Coach sessions come from
  // listCoachSessions() (lib/session-records.ts, real measured accuracy).
  // Computed once here so the compact card and the expanded list share
  // the same rows and count.
  const historyRows: { at: string; label: string; detail: string; href?: string }[] = [
    ...sessions.map((s) => ({
      at: s.date,
      label: GOAL_TYPE_LABELS[s.type as GoalType] ?? s.type,
      detail: t('rb.dash.sessionRow').replace('{a}', String(s.ayahs)).replace('{m}', String(s.minutes)),
    })),
    ...testSessions.map((s) => ({
      at: s.at.slice(0, 10),
      label: t('rb.dash.sessionTest').replace('{type}', s.type),
      detail: `${s.score}/${s.total} · ${s.mistakes} ${s.mistakes === 1 ? t('test.mistake') : t('test.mistakes')}`,
      href: '/hifz/test',
    })),
    ...coachSessionRows(coachSessions),
  ].sort((a, b) => b.at.localeCompare(a.at));

  if (progress === null || settings === null) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#6B7280]">{t('prog.loading')}</p>
          {notice && <p className="mt-2 text-sm text-[#6B7280]">{notice}</p>}
        </div>
        <BadgesGrid snapshot={badgeSnapshot} />
      </div>
    );
  }

  const today = localDateString();
  const streak = currentStreakCount(progress.streak, today);
  const memorised = Object.entries(progress.ayahs).filter(([, a]) => a.status === 'memorised');
  const memorisedPct = Math.round((memorised.length / 6236) * 100);
  // Per-type daily goals (§15.8): separate targets + counters.
  const typeGoals = getTypeGoals(progress);

  // --- Analytics (spec §15): heatmap, surah strength, revision queue, weekly challenge.
  const activity = activityByDate(progress);
  const weekDays = weekPracticeDays(progress);
  const WEEK_CHALLENGE_DAYS = 5;
  const strengths = surahStrength(progress, ALL_SURAHS);
  const due = revisionDue(progress);
  // Stage 5 (§9): ayahs the user peeked at and has not yet recited clean
  // once since — they jump the revision queue ahead of the time-based list.
  const peeked = peekedDue(progress);

  // Stage 6 (§18): dashboard totals + summaries — all from stored data.
  const completedSurahList = completedSurahs(progress, ALL_SURAHS);
  const completedJuzList = completedJuz(progress);
  const summary = activitySummary(progress);
  const strongestWeek = strongestSurahThisWeek(progress, ALL_SURAHS);
  const difficult = difficultAyahs(mistakes);
  // Older saves lack longestStreak; the current streak is the honest floor.
  const longestStreak = progress.longestStreak ?? streak;
  const revisionNeeded = peeked.length + due.length;
  // Test performance: best / average of the last 5 / latest, from the
  // completed test sessions on this device.
  const testPcts = testSessions.map((s) => (s.total > 0 ? Math.round((s.score / s.total) * 100) : 0));
  const bestTestPct = testPcts.length > 0 ? Math.max(...testPcts) : null;
  const recentTestPcts = testPcts.slice(0, 5);
  const avgTestPct =
    recentTestPcts.length > 0
      ? Math.round(recentTestPcts.reduce((a, b) => a + b, 0) / recentTestPcts.length)
      : null;

  // BB — real analytics (progress.ts helpers, no invented data):
  // per-day accuracy from real scored sessions (tests + coach),
  // mistake frequency by type per week, week-over-week comparison,
  // and per-ayah mistake trends for the hardest ayahs. Anything with
  // no data renders an honest empty state in the Activity tab.
  const accuracyRecords = [
    ...testSessions.map((s) => ({ at: s.at, correct: s.score, total: s.total })),
    ...coachAccuracyRecords(coachSessions),
  ];
  const accTrend = accuracyTrend(accuracyRecords, 14);
  const mistakeTypeWeeks: MistakeTypeWeek[] = mistakesByTypeOverTime(mistakes, 6);
  const wow = weekOverWeek(
    progress,
    mistakes,
    testSessions.map((s) => ({ at: s.at, score: s.score, total: s.total })),
  );

  // 12-week activity heatmap (Monday-first columns). Dates are local; a day
  // counts when any ayah was last practised on it (see activityByDate).
  const heatmapWeeks: { date: string; count: number }[][] = (() => {
    const weeks: { date: string; count: number }[][] = [];
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) - 7 * 11);
    for (let w = 0; w < 12; w++) {
      const days: { date: string; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + w * 7 + d);
        const key = localDateString(day);
        days.push({ date: key, count: day > now ? -1 : (activity[key] ?? 0) });
      }
      weeks.push(days);
    }
    return weeks;
  })();
  const heatColor = (count: number) =>
    count < 0 ? 'bg-transparent' : count === 0 ? 'bg-[#E8EAED]' : count <= 1 ? 'bg-[#bcd8c6]' : count <= 3 ? 'bg-[#7fb894]' : 'bg-[#1FA36B]';

  const changeTypeTarget = (type: GoalType, target: number) => {
    const next = setTypeGoalTarget(progress, type, target);
    saveProgress(next);
    setProgress(next);
  };

  const logType = (type: GoalType, count: number) => {
    const next = recordTypeActivity(progress, type, count);
    saveProgress(next);
    setProgress(next);
  };

  /** Save the surah text the coach needs so it works in airplane mode (§15.10). */
  const saveForOffline = async () => {
    setOfflineSaving(true);
    setOfflineMsg(null);
    try {
      const urls: string[] = [
        '/', '/hifz', '/hifz/recite', '/hifz/test', '/hifz/voice-search',
        '/hifz/my-progress', '/hifz/challenges', '/hifz/juz-amma', '/hifz/plans',
        ...ALL_SURAHS.map(
          (s) => `/api/quran/verses/by_chapter/${s.id}?fields=text_indopak,text_uthmani&translations=20&audio=7&per_page=all`,
        ),
      ];
      let saved = 0;
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (res.ok) saved += 1;
        } catch {
          /* one failed fetch must not stop the rest */
        }
      }
      setOfflineMsg(
        saved === urls.length
          ? t('rb.dash.savedOffline').replace('{n}', String(saved))
          : t('rb.dash.savedPartial').replace('{a}', String(saved)).replace('{b}', String(urls.length)),
      );
    } catch {
      setOfflineMsg(t('rb.dash.saveOfflineFail'));
    } finally {
      setOfflineSaving(false);
    }
  };

  const doExport = () => {
    downloadProgressJson(
      `hifz-${today}.json`,
      exportProgress(progress, mistakes, settings, {
        bookmarks: loadBookmarks(),
        challenges: loadChallenges(),
      }),
    );
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = importProgress(String(reader.result ?? ''));
      if (!result.ok) {
        setImportMsg(result.error);
        return;
      }
      saveProgress(result.progress);
      saveMistakes(result.mistakes);
      saveSettings(result.settings);
      // Stage 5 (§6): bookmarks + challenges ride in the export when
      // present. An older export has none — importing it leaves the
      // current bookmarks and challenges untouched, never wipes them.
      if (result.bookmarks.length > 0) saveBookmarks(result.bookmarks);
      if (result.challenges.length > 0) saveChallenges(result.challenges);
      setImportMsg(
        t('rb.dash.importedOk') +
          (result.bookmarks.length > 0 ? ' ' + t('rb.dash.bookmarksRestored').replace('{n}', String(result.bookmarks.length)) : '') +
          (result.challenges.length > 0 ? ' ' + t('rb.dash.challengesRestored').replace('{n}', String(result.challenges.length)) : ''),
      );
      reload();
    };
    reader.onerror = () => setImportMsg(t('rb.dash.fileUnreadable'));
    reader.readAsText(file);
  };

  const doAddSession = () => {
    try {
      const todayStr = localDateString();
      // Backdating is allowed for any past date — but the streak rule
      // is explicit and honest: ONLY yesterday can restore a missed
      // streak day. An older date is recorded in history (minutes +
      // ayahs) and never touches the streak, so backdated entries
      // cannot fabricate streak days. A future date is refused.
      if (!addDate || addDate > todayStr) {
        setAddMsg('Choose today or a past date — a future date can’t be logged.');
        return;
      }
      let next = loadProgress();
      let msg: string;
      if (addDate === todayStr) {
        next = recordMinutes(next, addMinutes);
        next = recordTypeActivity(next, addType, addAyahs);
        msg = t('rb.dash.sessionAddedToday').replace('{a}', String(addAyahs)).replace('{m}', String(addMinutes));
      } else if (addDate === previousLocalDate(todayStr)) {
        // Restore a missed day: yesterday counts toward the streak.
        const last = next.streak.lastActiveDate;
        if (last === addDate) {
          setAddMsg(t('rb.dash.dayInStreak'));
          return;
        }
        const newCount = last === previousLocalDate(addDate) ? next.streak.count + 1 : 1;
        next = {
          ...next,
          streak: {
            count: newCount,
            lastActiveDate: addDate,
          },
          // Stage 6 (§18): a restored streak day can set a new longest streak.
          longestStreak: Math.max(next.longestStreak ?? next.streak.count, newCount),
        };
        msg = t('rb.dash.sessionAddedYesterday');
      } else {
        // Older than yesterday: history only. No streak change, no
        // minutes added to any daily total (minutesToday is today-only
        // by design) — the minutes and ayahs live in the session record.
        msg = `Session added for ${addDate} — recorded in your history. Older days don’t change your streak; only yesterday can restore a missed day.`;
      }
      saveProgress(next);
      setProgress(next);
      const entry: ExternalSession = { date: addDate, type: addType, ayahs: addAyahs, minutes: addMinutes };
      // BB: no 30-entry cap — the whole history is kept and paginated
      // in the Session History list instead.
      const list = [entry, ...sessions];
      setSessions(list);
      try {
        localStorage.setItem('ili_sessions_v1', JSON.stringify(list));
      } catch {
        /* ignore */
      }
      setAddMsg(msg);
    } catch {
      setAddMsg(t('rb.dash.sessionSaveFail'));
    }
  };

  /** Mark every mistake on one word (one ayah) corrected — used by the
   *  weak-spots chart detail. History is kept, flagged corrected. */
  const markWordCorrected = (surah: number, ayah: number, word: string) => {
    const at = new Date().toISOString();
    const next = mistakes.map((m) =>
      m.surah === surah && m.ayah === ayah && m.word === word && !m.corrected
        ? { ...m, corrected: true, correctedAt: at }
        : m,
    );
    saveMistakes(next);
    setMistakes(next);
  };

  /** Save / clear the guest display name (local only, settings store). */
  const saveDisplayName = (name: string) => {
    const trimmed = name.trim().slice(0, 30);
    const next = { ...settings, displayName: trimmed ? trimmed : undefined };
    saveSettings(next);
    setSettings(next);
    setEditingName(false);
  };

  const clearMistake = (idx: number) => {
    const next = mistakes.filter((_, i) => i !== idx);
    saveMistakes(next);
    setMistakes(next);
  };

  const markOneCorrected = (idx: number) => {
    const next = mistakes.map((m, i) =>
      i === idx ? { ...m, corrected: true, correctedAt: new Date().toISOString() } : m,
    );
    saveMistakes(next);
    setMistakes(next);
  };

  // Stage 5 (§11): delete controls. Mistake history is deleted outright;
  // audio is different — recordings are never stored past the recitation
  // session (in-memory blob only, gone when the coach closes), so there is
  // no stored audio file to delete. The control that matters is stopping
  // new recordings, which is the saveAudio setting below.
  const clearAllMistakes = () => {
    saveMistakes([]);
    setMistakes([]);
    setConfirmClearMistakes(false);
  };
  const setSaveAudio = (on: boolean) => {
    const next = { ...settings, saveAudio: on };
    saveSettings(next);
    setSettings(next);
  };

  return (
    <div className="space-y-6">
      <HubTopBar />
      {notice && (
        <p role="status" className="rounded-xl border border-[#E8EAED] bg-white px-4 py-3 text-sm text-[#6B7280]">
          {notice}
        </p>
      )}

      {/* 5-tab progress hub — Dashboard / Goals / Memorization / Activity / Community. */}
      <div role="tablist" aria-label={t('rb.dash.progressSections')} className="flex gap-1 overflow-x-auto border-b border-[#E8EAED] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            type="button"
            role="tab"
            aria-selected={tab === tb.id}
            onClick={() => setTab(tb.id)}
            className={`shrink-0 border-b-[3px] px-3 py-2 text-[15px] ${
              tab === tb.id
                ? 'border-black font-bold text-black'
                : 'border-transparent font-medium text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            {t(tb.label)}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-6" role="tabpanel" aria-label={t('rb.dash.tabDashboard')}>
          {/* BB: greeting with the optional guest display name (local
              only, stored in settings). No name stored = plain "Salam!"
              — never a fake name. Tap "Add your name" / "Edit name" to
              set or clear it. */}
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">
              {settings.displayName
                ? `${t('rb.dash.salam').replace(/!+\s*$/, '')} ${settings.displayName}!`
                : t('rb.dash.salam')}
            </h2>
            {editingName ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="display-name-input">Your display name</label>
                <input
                  id="display-name-input"
                  type="text"
                  value={nameDraft}
                  maxLength={30}
                  placeholder="Your name"
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveDisplayName(nameDraft);
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                  className="min-h-11 rounded-lg border border-[#E8EAED] bg-white px-3 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => saveDisplayName(nameDraft)}
                  className="min-h-11 rounded-full bg-[#57D798] px-4 py-1.5 text-sm font-bold text-[#102E26]"
                >
                  Save name
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="min-h-11 rounded-full border border-[#E8EAED] px-4 py-1.5 text-sm font-semibold"
                >
                  Cancel
                </button>
                {settings.displayName && (
                  <button
                    type="button"
                    onClick={() => saveDisplayName('')}
                    className="min-h-11 rounded-full border border-red-200 px-4 py-1.5 text-sm font-semibold text-red-700"
                  >
                    Clear name
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNameDraft(settings.displayName ?? '');
                  setEditingName(true);
                }}
                className="mt-1 text-sm font-semibold text-[#1FA36B] underline"
              >
                {settings.displayName ? 'Edit name' : 'Add your name'}
              </button>
            )}
          </div>

          <StreakCard
            streak={streak}
            longestStreak={longestStreak}
            activity={activity}
            addHref="/hifz/my-progress?tab=activity#add-session-heading"
            onBell={() => setTab('goals')}
          />

          {/* Free-features promo — our own simple mosque icon (never
              Tarteel's artwork) and our own line; nothing is upsold,
              everything is free. BB: the button now goes to Settings,
              where the unlocked features live — Mistake Detection is
              in the Recitation detail there. SettingsClient has no
              deep-link, so the link lands on Settings and the user
              taps Recitation. */}
          <section aria-label={t('rb.dash.exploreFree')} className="rounded-2xl border border-[#E8EAED] bg-white p-5 text-center shadow-sm sm:p-6">
            <span className="mx-auto flex h-16 w-16 items-center justify-center" aria-hidden="true">
              <ToolIcon name="mosque" className="h-14 w-14 text-[#C9A227]" />
            </span>
            <p className="mt-3 text-lg font-bold leading-snug text-[#111827]">{t('rb.dash.memBetter')}</p>
            <Link
              href="/hifz/settings"
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#38BDF8] to-[#34D399] px-5 py-3 text-base font-bold text-[#102E26] hover:brightness-105"
            >{t('rb.dash.exploreAllFree')}</Link>
            <p className="mt-2 text-xs text-[#6B7280]">Mistake Detection and every other feature are in Settings → Recitation. All free, no Premium.</p>
          </section>

          {/* Highlights — Testing Mode on a dark card, like the reference.
              No copied artwork: the decoration is plain CSS shapes. */}
          <section aria-label={t('rb.dash.highlights')}>
            <h2 className="text-xl font-bold text-[#111827]">{t('rb.dash.highlights')}</h2>
            <Link href="/hifz/test" className="relative mt-3 block overflow-hidden rounded-2xl bg-[#111827] p-5 text-white shadow-sm">
              <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-[#38BDF8]/25 blur-xl" />
              <span aria-hidden="true" className="pointer-events-none absolute -bottom-8 right-16 h-24 w-24 rounded-full bg-[#34D399]/25 blur-xl" />
              <span aria-hidden="true" className="pointer-events-none absolute right-6 top-10 h-10 w-24 rotate-[-8deg] rounded-full bg-[#F472B6]/30 blur-md" />
              <span className="relative text-xs font-semibold text-white/70">{t('rb.dash.testingModeLabel')}</span>
              <p className="relative mt-10 text-lg font-bold">{t('rb.dash.newFeature')}</p>
              <p className="relative mt-1 max-w-[260px] text-sm leading-relaxed text-white/80">{t('rb.dash.testRandom')}</p>
              <p className="relative mt-3 text-sm font-bold tracking-wide text-white/90">
                {t('rb.dash.testYourselfNow')} <span aria-hidden="true">↗</span>
              </p>
            </Link>
          </section>

          {/* Today's goals — the three per-type daily goals, with a way to start a new goal. */}
          <section aria-labelledby="today-goals-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="today-goals-heading" className="text-xl font-bold text-[#111827]">{t('rb.goals.todayGoals')}</h2>
              <button
                type="button"
                onClick={() => setTab('goals')}
                className="text-sm font-medium text-[#6B7280] hover:text-[#111827]"
              >{t('rb.dash.seeAll')}</button>
            </div>
            <button
              type="button"
              onClick={() => { setGoalsCreateSignal((n) => n + 1); setTab('goals'); }}
              className="mt-3 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[#E8EAED] bg-white px-4 py-3 text-sm font-bold text-[#111827] shadow-sm hover:border-[#1FA36B]"
            >
              {t('rb.dash.startNewGoal')}
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#57D798] text-[#102E26]" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </button>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {(Object.keys(GOAL_TYPE_LABELS) as GoalType[]).map((type) => (
                <TypeGoalCard key={type} type={type} goal={typeGoals[type]} onTargetChange={changeTypeTarget} onLog={logType} />
              ))}
            </div>
          </section>

      {/* Stage 6 (§18): totals — every number traces to stored progress. */}
      <section aria-label={t('rb.dash.totals')} className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-2xl border border-[#E8EAED] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{t('rb.dash.surahsCompleted')}</p>
          <p className="mt-1 text-3xl font-bold text-[#111827]">{completedSurahList.length}</p>
          <p className="mt-1 text-xs text-[#6B7280]">{t('rb.dash.of114')}</p>
        </div>
        <div className="rounded-2xl border border-[#E8EAED] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{t('rb.dash.juzCompleted')}</p>
          <p className="mt-1 text-3xl font-bold text-[#111827]">{completedJuzList.length}</p>
          <p className="mt-1 text-xs text-[#6B7280]">
            of 30{completedJuzList.length > 0 ? ` · Juz ${completedJuzList.join(', ')}` : ''}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E8EAED] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{t('rb.dash.thisWeek')}</p>
          <p className="mt-1 text-3xl font-bold text-[#111827]">{summary.weekAyahs}</p>
          <p className="mt-1 text-xs text-[#6B7280]">
            {summary.weekAyahs === 1 ? 'ayah' : 'ayahs'} · {summary.weekDays} {summary.weekDays === 1 ? 'day' : 'days'}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E8EAED] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{t('rb.dash.thisMonth')}</p>
          <p className="mt-1 text-3xl font-bold text-[#111827]">{summary.monthAyahs}</p>
          <p className="mt-1 text-xs text-[#6B7280]">
            {summary.monthAyahs === 1 ? 'ayah' : 'ayahs'} · {summary.monthDays} {summary.monthDays === 1 ? 'day' : 'days'}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E8EAED] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{t('rb.dash.readingToday')}</p>
          <p className="mt-1 text-3xl font-bold text-[#111827]">
            {typeGoals.reading.done}<span className="text-lg text-[#6B7280]"> / {typeGoals.reading.target}</span>
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">{t('rb.dash.ayahsLogMore')}</p>
        </div>
      </section>

      {/* Stage 6 (§18): at a glance — three summaries from real data, each
          with an honest empty state when there is nothing to summarise. */}
      <section aria-labelledby="glance-heading" className="grid gap-4 sm:grid-cols-3">
        <h2 id="glance-heading" className="sr-only">{t('rb.dash.glanceHeading')}</h2>
        <div className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{t('rb.dash.strongestWeek')}</p>
          {strongestWeek ? (
            <>
              <p className="mt-2 text-xl font-bold text-[#111827]">{strongestWeek.name}</p>
              <p className="mt-1 text-sm text-[#6B7280]">
                {strongestWeek.ayahsPractised} {strongestWeek.ayahsPractised === 1 ? 'ayah' : 'ayahs'} practised in the last 7 days.
              </p>
              <Link href={`/hifz/${strongestWeek.slug}`} className="mt-3 inline-block font-semibold text-[#1FA36B] underline">{t('rb.dash.openIt')} →</Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#6B7280]">{t('rb.dash.nothingStrongest')}</p>
          )}
        </div>
        <div className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{t('rb.dash.needRevision')}</p>
          {revisionNeeded > 0 ? (
            <>
              <p className="mt-2 text-xl font-bold text-[#111827]">
                {revisionNeeded} {revisionNeeded === 1 ? 'ayah' : 'ayahs'}
              </p>
              <p className="mt-1 text-sm text-[#6B7280]">
                {peeked.length > 0 ? t('rb.dash.peekedDue').replace('{n}', String(peeked.length)) + ' ' : ''}
                {due.length > 0 ? t('rb.dash.dueBySchedule').replace('{n}', String(due.length)) : ''}
              </p>
              <button type="button" onClick={() => setTab('memorization')} className="mt-3 inline-block font-semibold text-[#1FA36B] underline">{t('rb.dash.seeRevision')} →</button>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#6B7280]">{t('rb.dash.nothingDue')}</p>
          )}
        </div>
        <div className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{t('prog.continue')}</p>
          {lastRead ? (
            <>
              <p className="mt-2 text-xl font-bold text-[#111827]">{lastRead.name}</p>
              <p className="mt-1 text-sm text-[#6B7280]">
                Last read {new Date(lastRead.at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.
              </p>
              <Link href={`/hifz/${lastRead.slug}`} className="mt-3 inline-block font-semibold text-[#1FA36B] underline">{t('rb.dash.continueReading')} →</Link>
            </>
          ) : mushafPage !== null ? (
            <>
              <p className="mt-2 text-xl font-bold text-[#111827]">{t('rb.dash.mushafPage')} {mushafPage}</p>
              <p className="mt-1 text-sm text-[#6B7280]">{t('rb.dash.lastPlace')}</p>
              <Link href={`/hifz/mushaf?page=${mushafPage}`} className="mt-3 inline-block font-semibold text-[#1FA36B] underline">
                {t('bm.openMushaf')}
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#6B7280]">{t('rb.dash.noReading')}</p>
          )}
        </div>
      </section>

      {/* Continue where you left off + favourites */}
      {(lastRead || bookmarks.length > 0) && (
        <section aria-labelledby="continue-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
          {lastRead && (
            <>
              <h2 id="continue-heading" className="text-xl font-bold text-[#111827]">{t('prog.continue')}</h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                {t('prog.lastRead')} <strong>{lastRead.name}</strong> —{' '}
                {new Date(lastRead.at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.
              </p>
              <Link href={`/hifz/${lastRead.slug}`} className="mt-3 inline-block rounded-full bg-[#57D798] px-4 py-2 text-sm font-bold text-[#102E26] hover:brightness-105">
                {t('prog.continueReading').replace('{name}', lastRead.name)}
              </Link>
            </>
          )}
          {bookmarks.length > 0 && (
            <div className={lastRead ? 'mt-5' : ''}>
              <h3 className="text-sm font-bold text-[#111827]">{t('prog.favourites')}</h3>
              {/* Stage 6 (§19): the shared bookmark store also holds Mushaf
                  page bookmarks (no surahNumber) — only ayah bookmarks
                  belong in this list; page bookmarks show on /hifz/bookmarks. */}
              <ul className="mt-2 space-y-1 text-sm">
                {bookmarks
                  .filter((b) => typeof b.surahNumber === 'number')
                  .slice(0, 10).map((b, i) => {
                  const bs = getSurahById(b.surahNumber);
                  return (
                    <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-[#F4F5F7] px-3 py-2">
                      <span>{bs ? bs.name : b.surahName ?? `Surah ${b.surahNumber}`} {b.surahNumber}:{b.verseNumber}</span>
                      {bs && (
                        <Link href={`/hifz/${bs.slug}?ayah=${b.verseNumber}`} className="ml-auto font-semibold text-[#1FA36B] underline">
                          {t('prog.open')}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
              {bookmarks.filter((b) => typeof b.surahNumber === 'number').length > 10 && (
                <p className="mt-2 text-xs text-[#6B7280]">{t('prog.showingBookmarks').replace('{n}', String(bookmarks.filter((b) => typeof b.surahNumber === 'number').length))}</p>
              )}
              <Link href="/hifz/bookmarks" className="mt-3 inline-block font-semibold text-[#1FA36B] underline">{t('rb.dash.viewAllBookmarks')} →</Link>
            </div>
          )}
        </section>
      )}

        </div>
      )}

      {tab === 'goals' && (
        <div role="tabpanel" aria-label={t('rb.goals.goals')}>
          <GoalsClient createOpenSignal={goalsCreateSignal} />
        </div>
      )}

      {tab === 'memorization' && (
        <div className="space-y-6" role="tabpanel" aria-label={t('rb.dash.tabMemorization')}>
          {/* Memorization completion — compact row, like the reference:
              label + green percent + chevron to the memorised list below. */}
          <a
            href="#memorised-ayahs"
            className="flex items-center justify-between rounded-2xl border border-[#E8EAED] bg-white p-4 shadow-sm"
            aria-label={`${t('rb.dash.memCompletion')} — ${memorisedPct}%`}
          >
            <span>
              <span className="block text-base text-[#111827]">{t('rb.dash.memCompletion')}</span>
              <span className="mt-0.5 block text-xl font-bold text-[#1FA36B]">{memorisedPct}%</span>
            </span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </a>

          {/* Goals — Memorization Goal and Review Goal cards. The ring +
              target controls live behind each card's chevron (the goal
              detail), not inline. */}
          <section aria-labelledby="mem-goals-heading">
            <h2 id="mem-goals-heading" className="text-xl font-bold text-[#111827]">{t('rb.goals.goals')}</h2>
            <div className="mt-4 space-y-5">
              <MemGoalRow label="Memorization" goalLabel={t('rb.dash.memGoal')} type="memorisation" goal={typeGoals.memorisation} onTargetChange={changeTypeTarget} onLog={logType} />
              <MemGoalRow label="Review" goalLabel={t('rb.dash.reviewGoal')} type="revision" goal={typeGoals.revision} onTargetChange={changeTypeTarget} onLog={logType} />
            </div>
          </section>

      {/* Memorised map — all 114 surahs */}
      <section aria-labelledby="map-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="map-heading" className="text-xl font-bold text-[#111827]">{t('prog.mapHeading')}</h2>
        <p className="mt-1 text-sm text-[#6B7280]">{t('rb.dash.mapHint')}</p>
        <div className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-12" role="list" aria-label={t('rb.dash.mapDesc')}>
          {ALL_SURAHS.map((s) => {
            const st = strengths.find((x) => x.surah === s.id);
            const pct = st?.strengthPct ?? 0;
            const bg = pct === 0 ? '#E8EAED' : pct < 25 ? '#bcd8c6' : pct < 50 ? '#7fb894' : pct < 100 ? '#1FA36B' : '#102E26';
            return (
              <Link
                key={s.id}
                href={`/hifz/${s.slug}`}
                role="listitem"
                title={t('prog.mapTitle').replace('{name}', s.name).replace('{pct}', String(pct)).replace('{m}', String(st?.memorised ?? 0)).replace('{total}', String(s.ayahCount))}
                aria-label={t('prog.mapAria').replace('{name}', s.name).replace('{pct}', String(pct))}
                className="flex h-9 items-center justify-center rounded-md text-xs font-bold text-white"
                style={{ background: bg, color: pct === 0 ? '#6B7280' : '#fff' }}
              >
                {s.id}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Surah strength */}
      <section aria-labelledby="strength-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="strength-heading" className="text-xl font-bold text-[#111827]">{t('prog.strength')}</h2>
        <p className="mt-1 text-sm text-[#6B7280]">{t('rb.dash.strengthHint')}</p>
        {strengths.length === 0 ? (
          <p className="mt-2 text-sm text-[#6B7280]">
            No strength yet — recite an ayah with the coach and it appears here.{' '}
            <Link href="/hifz/juz-amma" className="font-semibold text-[#1FA36B] underline">{t('rb.dash.startJuzAmma')} →</Link>
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {strengths.map((s) => (
              <li key={s.slug}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <Link href={`/hifz/${s.slug}`} className="font-semibold text-[#111827] hover:underline">
                    {s.name} <span className="font-normal text-[#6B7280]">· {t('prog.strengthLine').replace('{m}', String(s.memorised)).replace('{l}', String(s.learning)).replace('{n}', String(s.ayahCount))}</span>
                  </Link>
                  <span className="font-bold text-[#1FA36B]">{s.strengthPct}%</span>
                </div>
                <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-[#E8EAED]" aria-hidden="true">
                  <div className="h-full bg-[#1FA36B]" style={{ width: `${(s.memorised / s.ayahCount) * 100}%` }} />
                  <div className="h-full bg-[#7fb894]" style={{ width: `${(s.learning / s.ayahCount) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Revision due — spaced repetition queue */}
      <section id="revision" aria-labelledby="revision-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="revision-heading" className="text-xl font-bold text-[#111827]">{t('prog.revision')}</h2>
        <p className="mt-1 text-sm text-[#6B7280]">{t('rb.dash.memoryFades')}</p>
        {/* Stage 5 (§9): peeks drive revision. Ayahs you needed help with
            come FIRST — needing a peek is a stronger signal than merely
            not practising for a while. One clean recitation clears an ayah
            from this list. */}
        {peeked.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-bold text-[#111827]">
              Peeked — revise these first ({peeked.length})
            </h3>
            <p className="mt-1 text-xs text-[#6B7280]">{t('rb.dash.revealedNote')}</p>
            <ul className="mt-2 space-y-2">
              {peeked.slice(0, 10).map((item) => {
                const surah = getSurahById(item.surah);
                return (
                  <li key={`peek-${item.surah}:${item.ayah}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#FFB800]/60 bg-[#F4F5F7] px-3 py-2 text-sm">
                    <span>
                      {surah ? surah.name : `Surah ${item.surah}`} {item.surah}:{item.ayah} ·{' '}
                      {t('rb.dash.peekedWord')} {item.peekCount} {item.peekCount === 1 ? t('common.time') : t('common.times')}
                      {item.daysSincePeek === 0 ? t('rb.dash.todaySuffix') : t('rb.dash.daysAgo').replace('{n}', String(item.daysSincePeek)).replace('{unit}', item.daysSincePeek === 1 ? t('common.day') : t('common.days'))}
                    </span>
                    <Link
                      href={surah ? `/hifz/${surah.slug}?mode=recite&ayah=${item.ayah}` : '/hifz'}
                      className="ml-auto font-semibold text-[#1FA36B] underline"
                    >
                      {t('prog.reviseNow')}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {due.length === 0 && peeked.length === 0 ? (
          <p className="mt-2 text-sm text-[#6B7280]">{t('prog.nothingDue')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {due.slice(0, 10).map((item) => {
              const surah = getSurahById(item.surah);
              return (
                <li key={`${item.surah}:${item.ayah}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#F4F5F7] px-3 py-2 text-sm">
                  <span>
                    {surah ? surah.name : `Surah ${item.surah}`} {item.surah}:{item.ayah} ·{' '}
                    {item.status === 'memorised' ? t('common.memorised') : t('common.learning')} · {t('prog.lastPractised')}{' '}
                    {item.daysSincePractised} {item.daysSincePractised === 1 ? t('prog.dayAgo') : t('prog.daysAgo')}
                  </span>
                  <Link
                    href={surah ? `/hifz/${surah.slug}?mode=recite&ayah=${item.ayah}` : '/hifz'}
                    className="ml-auto font-semibold text-[#1FA36B] underline"
                  >
                    {t('prog.reviseNow')}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {due.length > 10 && (
          <p className="mt-2 text-sm text-[#6B7280]">{t('prog.moreDue').replace('{n}', String(due.length - 10))}</p>
        )}
      </section>

      {/* Memorised ayahs */}
      <section id="memorised-ayahs" aria-labelledby="memorised-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="memorised-heading" className="text-xl font-bold text-[#111827]">{t('prog.memorisedAyahs')}</h2>
        {memorised.length === 0 ? (
          <p className="mt-2 text-sm text-[#6B7280]">
            Nothing memorised yet. Recite an ayah correctly three times in a row and it appears here.{' '}
            <Link href="/hifz/juz-amma" className="font-semibold text-[#1FA36B] underline">{t('rb.dash.startJuzAmma')} →</Link>
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {memorised.map(([key]) => {
              const [s, a] = key.split(':').map(Number);
              const surah = getSurahById(s);
              return (
                <li key={key}>
                  <Link
                    href={surah ? `/hifz/${surah.slug}/${s}-${a}` : '/hifz'}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#E4FFF2] px-3 py-1.5 text-sm font-semibold text-[#1FA36B] hover:underline"
                  >
                    {surah ? surah.name : `Surah ${s}`} {key}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Mistake log — filters, weak-spots ranking, practice-my-mistakes */}
      <section aria-labelledby="mistakes-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="mistakes-heading" className="text-xl font-bold text-[#111827]">{t('prog.mistakesHeading')}</h2>
        <p className="mt-1 text-sm text-[#6B7280]">{t('rb.dash.mistakeLogNote')}</p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t('rb.dash.filterMistakes')}>
          {(['all', 'incorrect', 'missed'] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={mistakeFilter === f}
              onClick={() => setMistakeFilter(f)}
              className={`min-h-11 rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${mistakeFilter === f ? 'bg-[#102E26] text-white' : 'border border-[#E8EAED] hover:border-[#1FA36B]'}`}
            >
              {f === 'all' ? t('prog.filterAll') : f === 'incorrect' ? t('prog.filterIncorrect') : t('prog.filterMissed')}
            </button>
          ))}
        </div>
        {mistakes.length === 0 ? (
          <p className="mt-3 text-sm text-[#6B7280]">
            {t('rb.dash.noMistakes')}
          </p>
        ) : (
          <>
            {/* Weak spots — ranked by how often each word was missed.
                Corrected mistakes are history, not weak spots: they are
                excluded here (Stage 5, §11). */}
            {(() => {
              const byWord = new Map<string, { word: string; surah: number; ayah: number; attempts: number; heard?: string }>();
              for (const m of mistakes) {
                if (m.corrected) continue;
                const k = `${m.surah}:${m.ayah}:${m.word}`;
                const prev = byWord.get(k);
                byWord.set(k, {
                  word: m.word,
                  surah: m.surah,
                  ayah: m.ayah,
                  attempts: (prev?.attempts ?? 0) + m.attempts,
                  heard: m.heard ?? prev?.heard,
                });
              }
              const ranked = [...byWord.values()].sort((a, b) => b.attempts - a.attempts).slice(0, 10);
              const wash = (n: number) => (n >= 6 ? 'wash-most' : n >= 3 ? 'wash-often' : n >= 2 ? 'wash-some' : 'wash-few');
              const maxAttempts = ranked.length > 0 ? ranked[0].attempts : 1;
              return ranked.length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-[#111827]">{t('prog.weakSpots')}</h3>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    Tap a bar to see that word’s detail. Fully visible — nothing here is blurred or locked.
                  </p>
                  {/* BB: real interactive bar chart (not a plain list).
                      Bar length = how often the word was missed. Tapping
                      a bar opens its detail below with Practise + Mark
                      corrected. */}
                  <div className="mt-2 space-y-2" role="list" aria-label={t('prog.weakSpots')}>
                    {ranked.map((w) => {
                      const surah = getSurahById(w.surah);
                      const key = `${w.surah}:${w.ayah}:${w.word}`;
                      const isSelected =
                        selectedWeak !== null &&
                        selectedWeak.surah === w.surah &&
                        selectedWeak.ayah === w.ayah &&
                        selectedWeak.word === w.word;
                      return (
                        <button
                          key={key}
                          type="button"
                          role="listitem"
                          aria-pressed={isSelected}
                          aria-label={`${w.word} — ${surah ? surah.name : `Surah ${w.surah}`} ${w.surah}:${w.ayah}, missed ${w.attempts} ${w.attempts === 1 ? 'time' : 'times'}. Tap for detail.`}
                          onClick={() =>
                            setSelectedWeak(isSelected ? null : { surah: w.surah, ayah: w.ayah, word: w.word })
                          }
                          className={`block w-full rounded-xl px-3 py-2 text-left ${isSelected ? 'bg-[#E4FFF2] ring-2 ring-[#1FA36B]' : 'bg-[#F4F5F7] hover:bg-[#E8EAED]'}`}
                        >
                          <span className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                            <span>
                              <span dir="rtl" lang="ar" className={`font-quran text-lg ${wash(w.attempts)}`}>{w.word}</span>
                              {' '}
                              <span className="text-[#6B7280]">
                                {surah ? surah.name : `Surah ${w.surah}`} {w.surah}:{w.ayah}
                              </span>
                            </span>
                            <span className="font-bold text-[#111827]">
                              {t('prog.missed').replace('{n}', String(w.attempts)).replace('{timeWord}', w.attempts === 1 ? t('common.time') : t('common.times'))}
                            </span>
                          </span>
                          <span className="mt-1.5 block h-3 overflow-hidden rounded-full bg-[#E8EAED]" aria-hidden="true">
                            <span
                              className="block h-full rounded-full bg-[#1FA36B]"
                              style={{ width: `${Math.max(4, (w.attempts / maxAttempts) * 100)}%` }}
                            />
                          </span>
                          {w.heard && (
                            <span className="mt-1 block text-xs text-[#6B7280]">
                              {t('rb.dash.heardAs').replace('{heard}', w.heard)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedWeak && (() => {
                    const w = ranked.find(
                      (x) => x.surah === selectedWeak.surah && x.ayah === selectedWeak.ayah && x.word === selectedWeak.word,
                    );
                    if (!w) return null;
                    const surah = getSurahById(w.surah);
                    return (
                      <div className="mt-3 rounded-xl border border-[#1FA36B] bg-white p-4 text-sm">
                        <p className="font-bold text-[#111827]">
                          <span dir="rtl" lang="ar" className="font-quran text-xl">{w.word}</span>
                          {' '}· {surah ? surah.name : `Surah ${w.surah}`} {w.surah}:{w.ayah}
                        </p>
                        <p className="mt-1 text-[#6B7280]">
                          Missed {w.attempts} {w.attempts === 1 ? 'time' : 'times'}
                          {w.heard ? ` · heard as “${w.heard}”` : ''}
                          {` · ${t('prog.moreToClear').replace('{n}', String(Math.max(0, 3 - Math.min(3, w.attempts))))}`}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {surah && (
                            <Link
                              href={`/hifz/${surah.slug}?mode=recite&ayah=${w.ayah}`}
                              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
                            >
                              {t('prog.practiseWord')}
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              markWordCorrected(w.surah, w.ayah, w.word);
                              setSelectedWeak(null);
                            }}
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#1FA36B] px-4 py-2 text-sm font-semibold text-[#1FA36B] hover:bg-[#E4FFF2]"
                          >
                            {t('rb.dash.markCorrected')}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                  <Link
                    href="/hifz/test"
                    className="inline-flex min-h-11 items-center justify-center mt-3 inline-block rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
                  >
                    {t('prog.practiseMistakes')}
                  </Link>
                </div>
              ) : null;
            })()}
            <ul className="mt-4 space-y-2">
              {[...mistakes]
                .reverse()
                .filter((m) => {
                  if (mistakeFilter === 'all') return true;
                  if (mistakeFilter === 'incorrect') return !!m.heard && m.heard !== m.expected;
                  return !m.heard;
                })
                .slice(0, 50)
                .map((m, i) => {
                  const surah = getSurahById(m.surah);
                  const idx = mistakes.length - 1 - i;
                  const when = new Date(m.date);
                  const whenLabel = Number.isNaN(when.getTime())
                    ? ''
                    : when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
                      ' · ' +
                      when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
                  return (
                    <li key={`${m.surah}:${m.ayah}:${m.word}:${i}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#F4F5F7] px-3 py-2 text-sm">
                      <span dir="rtl" lang="ar" className="font-quran text-lg">{m.word}</span>
                      <span>
                        {surah ? surah.name : `Surah ${m.surah}`} {m.surah}:{m.ayah}
                        {typeof m.wordIndex === 'number' ? ` · ${t('rb.dash.wordNum').replace('{n}', String(m.wordIndex + 1))}` : ''} ·{' '}
                        {mistakeTypeLabel(m.type)} · {m.attempts}{' '}
                        {m.attempts === 1 ? t('common.time') : t('common.times')}
                        {m.source === 'self-mark' ? ` · ${t('prog.selfMarked')}` : ''}
                        {m.heard ? ` · ${t('rb.dash.heardAs').replace('{heard}', m.heard)}` : ''}
                        {whenLabel ? ` · ${whenLabel}` : ''}
                      </span>
                      {m.corrected && (
                        <span className="rounded-full bg-[#E4FFF2] px-2 py-0.5 text-xs font-bold text-[#1FA36B]">
                          Corrected{m.correctedAt ? ` · ${new Date(m.correctedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
                        </span>
                      )}
                      <span className="ml-auto flex gap-2">
                        {/* BB: hear your own recitation for this mistake.
                            The session id comes from the mistake itself
                            when present, otherwise from the same-day
                            coach session whose range covers this ayah
                            (audioIdForMistake). No match = honest "No
                            recording" state. */}
                        <MistakeAudioButton sessionId={audioIdForMistake(m, coachSessions)} />
                        {surah && (
                          <Link href={`/hifz/${surah.slug}?mode=recite`} className="font-semibold text-[#1FA36B] underline">
                            {t('common.retry')}
                          </Link>
                        )}
                        {!m.corrected && (
                          <button
                            type="button"
                            onClick={() => markOneCorrected(idx)}
                            className="font-semibold text-[#1FA36B] underline"
                          >{t('rb.dash.markCorrected')}</button>
                        )}
                        <button
                          type="button"
                          onClick={() => clearMistake(idx)}
                          className="font-semibold text-red-700 underline"
                        >
                          {t('common.clear')}
                        </button>
                      </span>
                    </li>
                  );
                })}
            </ul>
            {/* Stage 5 (§11): delete controls. History is deleted outright.
                Audio is never stored past the session, so the control is
                the recording switch — turning it off stops new recordings
                being kept for listen-back. */}
            <div className="mt-4 rounded-xl border border-[#E8EAED] p-4">
              <p className="text-sm font-bold text-[#111827]">{t('rb.dash.recordingsHistory')}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">{t('rb.set.recordingNote')}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSaveAudio(!(settings.saveAudio ?? true))}
                  aria-pressed={settings.saveAudio ?? true}
                  className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold ${(settings.saveAudio ?? true) ? 'border-[#1FA36B] bg-[#E4FFF2] text-[#1FA36B]' : 'border-[#E8EAED] hover:border-[#1FA36B]'}`}
                >
                  {(settings.saveAudio ?? true) ? t('rb.dash.recOn') : t('rb.dash.recOff')}
                </button>
                {confirmClearMistakes ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-red-700">{t('rb.dash.deleteAllMistakes').replace('{n}', String(mistakes.length))}</span>
                    <button
                      type="button"
                      onClick={clearAllMistakes}
                      className="min-h-11 rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white"
                    >{t('rb.dash.yesDeleteAll')}</button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearMistakes(false)}
                      className="min-h-11 rounded-full border border-[#E8EAED] px-4 py-2 text-sm font-semibold"
                    >{t('rb.dash.keepThem')}</button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearMistakes(true)}
                    className="min-h-11 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:border-red-700"
                  >{t('rb.dash.deleteMistakeHistory')}</button>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Stage 6 (§18): difficult ayahs — ranked by uncorrected mistakes,
          per ayah (the weak-spots list above is per word). */}
      <section aria-labelledby="difficult-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="difficult-heading" className="text-xl font-bold text-[#111827]">{t('rb.dash.difficult')}</h2>
        <p className="mt-1 text-sm text-[#6B7280]">{t('rb.dash.difficultHint')}</p>
        {difficult.length === 0 ? (
          <p className="mt-2 text-sm text-[#6B7280]">{t('rb.dash.noDifficult')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {difficult.map((d) => {
              const surah = getSurahById(d.surah);
              return (
                <li key={`${d.surah}:${d.ayah}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#F4F5F7] px-3 py-2 text-sm">
                  <span>
                    {surah ? surah.name : `Surah ${d.surah}`} {d.surah}:{d.ayah} · missed{' '}
                    {d.attempts} {d.attempts === 1 ? 'time' : 'times'} · {d.words} {d.words === 1 ? 'word' : 'words'} · last{' '}
                    {new Date(d.lastMistake).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  {surah && (
                    <Link href={`/hifz/${surah.slug}?mode=recite&ayah=${d.ayah}`} className="ml-auto font-semibold text-[#1FA36B] underline">
                      {t('prog.reviseNow')}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Stage 6 (§18/§19): test performance + review previous tests. */}
      <section aria-labelledby="tests-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="tests-heading" className="text-xl font-bold text-[#111827]">{t('rb.dash.testPerf')}</h2>
        {testSessions.length === 0 ? (
          <p className="mt-2 text-sm text-[#6B7280]">
            No tests taken yet. Take a test and your scores appear here — best, recent average, and every past test to review.{' '}
            <Link href="/hifz/test" className="font-semibold text-[#1FA36B] underline">{t('rb.dash.takeFirstTest')} →</Link>
          </p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-[#F4F5F7] p-3">
                <p className="text-2xl font-bold text-[#111827]">{testSessions.length}</p>
                <p className="text-xs text-[#6B7280]">{t('rb.dash.testsTaken')}</p>
              </div>
              <div className="rounded-xl bg-[#F4F5F7] p-3">
                <p className="text-2xl font-bold text-[#111827]">{bestTestPct}%</p>
                <p className="text-xs text-[#6B7280]">{t('rb.dash.bestScore')}</p>
              </div>
              <div className="rounded-xl bg-[#F4F5F7] p-3">
                <p className="text-2xl font-bold text-[#111827]">{avgTestPct}%</p>
                <p className="text-xs text-[#6B7280]">{t('rb.dash.avgLast').replace('{n}', String(recentTestPcts.length))}</p>
              </div>
            </div>
            <ul className="mt-3 space-y-2">
              {testSessions.slice(0, 5).map((s, i) => (
                <li key={`${s.at}-${i}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#F4F5F7] px-3 py-2 text-sm">
                  <span className="font-bold text-[#111827]">
                    {s.score}/{s.total} · {s.total > 0 ? Math.round((s.score / s.total) * 100) : 0}%
                  </span>
                  <span className="text-[#6B7280]">{s.type} · {s.scope}</span>
                  <span className="text-[#6B7280]">{s.mistakes} {s.mistakes === 1 ? 'mistake' : 'mistakes'}</span>
                  <span className="ml-auto text-xs text-[#6B7280]">
                    {new Date(s.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </li>
              ))}
            </ul>
            {testSessions[0] && testSessions[0].missed.length > 0 && (
              <div className="mt-3">
                <h3 className="text-sm font-bold text-[#111827]">{t('rb.dash.missedLatest')}</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {testSessions[0].missed.slice(0, 8).map((m) => {
                    const surah = getSurahById(m.surah);
                    return (
                      <li key={`${m.surah}:${m.ayah}`}>
                        <Link
                          href={surah ? `/hifz/${surah.slug}?mode=recite&ayah=${m.ayah}` : '/hifz'}
                          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#E4FFF2] px-3 py-1.5 text-sm font-semibold text-[#1FA36B] hover:underline"
                        >
                          {surah ? surah.name : `Surah ${m.surah}`} {m.surah}:{m.ayah}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}
        {unfinishedTest && (
          <p className="mt-3 rounded-xl border border-[#FFB800] bg-[#F4F5F7] px-3 py-2 text-sm">
            <strong>{t('rb.dash.unfinishedTest')}</strong> {t('rb.dash.unfinishedDetail').replace('{a}', String(unfinishedTest.results.length)).replace('{b}', String(unfinishedTest.questions.length))}{' '}
            <Link href="/hifz/test" className="font-semibold text-[#1FA36B] underline">{t('rb.dash.resumeIt')} →</Link>
          </p>
        )}
        <Link href="/hifz/test" className="mt-3 inline-block font-semibold text-[#1FA36B] underline">{t('rb.dash.openTestMode')} →</Link>
      </section>

        </div>
      )}

      {tab === 'activity' && (
        <div className="space-y-6" role="tabpanel" aria-label={t('rb.dash.tabActivity')}>
          <StreakCard
            streak={streak}
            longestStreak={longestStreak}
            activity={activity}
            addHref="#add-session-heading"
            onBell={() => setTab('goals')}
          />

          {/* Session History — compact card with the real count; tap the
              chevron to see the full list. */}
          <section aria-labelledby="history-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-4 shadow-sm">
            <button
              type="button"
              aria-expanded={showHistory}
              onClick={() => setShowHistory((v) => !v)}
              className="flex w-full items-center justify-between text-left"
            >
              <span>
                <span className="block text-base text-[#111827]">{t('rb.dash.sessionHistory')}</span>
                <span className="mt-0.5 block text-xl font-bold text-[#1FA36B]">{historyRows.length}</span>
              </span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform ${showHistory ? 'rotate-90' : ''}`}>
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
            {showHistory && (
              <div className="mt-3">
                <h2 id="history-heading" className="sr-only">{t('rb.dash.sessionHistory')}</h2>
                <p className="text-sm text-[#6B7280]">{t('rb.dash.sessionsNote')}</p>
                {historyRows.length === 0 ? (
                  <p className="mt-2 text-sm text-[#6B7280]">{t('rb.dash.noSessions')}</p>
                ) : (
                  <>
                    <ul className="mt-3 space-y-1 text-sm">
                      {historyRows.slice(0, historyLimit).map((r, i) => (
                        <li key={`${r.at}-${i}`} className="flex flex-wrap gap-2 rounded-lg bg-[#F4F5F7] px-3 py-2">
                          <span className="font-semibold">{r.at}</span>
                          <span>{r.label}</span>
                          <span className="text-[#6B7280]">{r.detail}</span>
                          {r.href && (
                            <Link href={r.href} className="ml-auto font-semibold text-[#1FA36B] underline">
                              {t('bm.open')}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                    {/* BB: the stored history is uncapped; the list shows
                        15 at a time. */}
                    {historyRows.length > historyLimit ? (
                      <button
                        type="button"
                        onClick={() => setHistoryLimit((n) => n + 15)}
                        className="mt-3 min-h-11 rounded-full border border-[#1FA36B] px-4 py-2 text-sm font-semibold text-[#1FA36B] hover:bg-[#E4FFF2]"
                      >
                        Show more ({historyRows.length - historyLimit} more)
                      </button>
                    ) : historyRows.length > 15 ? (
                      <button
                        type="button"
                        onClick={() => setHistoryLimit(15)}
                        className="mt-3 min-h-11 rounded-full border border-[#E8EAED] px-4 py-2 text-sm font-semibold hover:border-[#1FA36B]"
                      >
                        Show less
                      </button>
                    ) : null}
                  </>
                )}
              </div>
            )}
          </section>

          {/* Achievements — free badges. Nothing earned yet shows the
              honest empty line, like the reference. */}
          <section aria-labelledby="achievements-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="achievements-heading" className="text-xl font-bold text-[#111827]">{t('rb.dash.achievements')}</h2>
              <button
                type="button"
                onClick={() => setShowBadges((v) => !v)}
                className="text-sm font-medium text-[#6B7280] hover:text-[#111827]"
              >{t('rb.dash.seeAll')}</button>
            </div>
            {earnedCount === 0 ? (
              <p className="mt-2 text-sm text-[#6B7280]">{t('rb.dash.noBadgesYet')}</p>
            ) : showBadges ? (
              <div className="mt-3"><BadgesGrid snapshot={badgeSnapshot} /></div>
            ) : (
              <p className="mt-2 text-sm text-[#6B7280]">
                {earnedCount} of 20 earned — tap See All to view them.
              </p>
            )}
          </section>

          {/* Activity Tracker — free, no lock: the real 12-week heatmap
              plus this week's challenge progress. */}
          <section aria-labelledby="tracker-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
            <h2 id="tracker-heading" className="text-xl font-bold text-[#111827]">{t('rb.dash.activityTracker')}</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              {t('rb.dash.weeklyProgress').replaceAll('{total}', String(WEEK_CHALLENGE_DAYS)).replace('{done}', String(weekDays))}
              {weekDays >= WEEK_CHALLENGE_DAYS ? ' ' + t('rb.dash.challengeDone') : ' ' + t('rb.dash.dayCounts')}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8EAED]" role="progressbar" aria-valuenow={weekDays} aria-valuemin={0} aria-valuemax={WEEK_CHALLENGE_DAYS} aria-label={t('rb.dash.weeklyChallenge')}>
              <div className="h-full rounded-full bg-[#FFB800]" style={{ width: `${Math.min(100, (weekDays / WEEK_CHALLENGE_DAYS) * 100)}%` }} />
            </div>
            <h3 className="mt-6 text-sm font-bold text-[#111827]">{t('prog.activityHeading')}</h3>
            <p className="mt-1 text-xs text-[#6B7280]">
              One square per day; darker means more ayahs practised that day. Built from your
              ayah records, so it works on progress saved before this view existed.
            </p>
            <div className="mt-3 flex gap-[3px] overflow-x-auto pb-1" role="img" aria-label={t('prog.heatmapLabel').replace('{n}', String(Object.keys(activity).length))}>
              {heatmapWeeks.map((week, wi) => (
                <div key={wi} className="flex shrink-0 flex-col gap-[3px]">
                  {week.map((day) => (
                    <span
                      key={day.date}
                      title={day.count < 0 ? day.date : t('prog.practisedOnDay').replace('{date}', day.date).replace('{n}', String(day.count)).replace('{ayahWord}', day.count === 1 ? t('common.ayah') : t('common.ayahs'))}
                      className={`h-3 w-3 rounded-[3px] ${heatColor(day.count)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* Pages — ayahs practised per day over the selected range.
              Honest note: this device tracks ayahs practised, not Mushaf
              pages, so the bars count ayahs per day. */}
          <section aria-labelledby="pages-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="pages-heading" className="text-xl font-bold text-[#111827]">{t('rb.dash.pagesChart')}</h2>
              <label className="sr-only" htmlFor="pages-range">{t('rb.dash.pagesChart')}</label>
              <select
                id="pages-range"
                value={pagesRange}
                onChange={(e) => setPagesRange(e.target.value as '3' | '7' | '14')}
                className="min-h-11 rounded-lg border border-[#E8EAED] bg-white px-2 py-1.5 text-sm font-semibold text-[#111827]"
              >
                <option value="3">{t('rb.dash.last3Days')}</option>
                <option value="7">{t('rb.dash.last7Days')}</option>
                <option value="14">{t('rb.dash.last14Days')}</option>
              </select>
            </div>
            {(() => {
              const n = Number(pagesRange);
              const now = new Date();
              const buckets: { label: string; value: number }[] = [];
              for (let i = n - 1; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
                const key = localDateString(d);
                buckets.push({
                  label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                  value: activity[key] ?? 0,
                });
              }
              const max = Math.max(1, ...buckets.map((b) => b.value));
              return (
                <div className="mt-3 rounded-2xl border border-[#E8EAED] bg-white p-4 shadow-sm">
                  <div className="flex h-28 items-end gap-1" role="img" aria-label={`${t('rb.dash.ayahsPerDay')} — ${t('rb.dash.pagesChart')}`}>
                    {buckets.map((b, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t bg-[#57D798]"
                          style={{ height: `${Math.max(b.value > 0 ? 8 : 2, (b.value / max) * 100)}%` }}
                          title={`${b.label}: ${b.value} ${b.value === 1 ? t('common.ayah') : t('common.ayahs')}`}
                        />
                        <span className="text-[10px] text-[#6B7280]">{b.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-[#6B7280]">{t('rb.dash.ayahsPerDay')}</p>
                </div>
              );
            })()}
          </section>

      {/* Engagement chart — time / ayahs by day, week, month */}
      <section aria-labelledby="engagement-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="engagement-heading" className="text-xl font-bold text-[#111827]">{t('prog.engagement')}</h2>
          <div className="flex gap-1" role="group" aria-label={t('rb.dash.chartRange')}>
            {(['day', 'week', 'month'] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={chartRange === r}
                onClick={() => setChartRange(r)}
                className={`min-h-11 rounded-full px-3 py-1 text-xs font-bold capitalize ${chartRange === r ? 'bg-[#E8EAED] text-[#111827]' : 'border border-[#E8EAED] text-[#6B7280]'}`}
              >
                {r === 'day' ? t('prog.day') : r === 'week' ? t('prog.week') : t('prog.month')}
              </button>
            ))}
          </div>
        </div>
        {(() => {
          const now = new Date();
          const buckets: { label: string; value: number }[] = [];
          if (chartRange === 'day') {
            for (let i = 13; i >= 0; i--) {
              const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
              const key = localDateString(d);
              buckets.push({ label: d.toLocaleDateString(undefined, { weekday: 'short' }), value: activity[key] ?? 0 });
            }
          } else if (chartRange === 'week') {
            for (let i = 7; i >= 0; i--) {
              const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7);
              const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6);
              let v = 0;
              for (const [day, c] of Object.entries(activity)) {
                if (day >= localDateString(start) && day <= localDateString(end)) v += c;
              }
              buckets.push({ label: `W-${i}`, value: v });
            }
          } else {
            for (let i = 5; i >= 0; i--) {
              const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              let v = 0;
              for (const [day, c] of Object.entries(activity)) {
                if (day.startsWith(key)) v += c;
              }
              buckets.push({ label: d.toLocaleDateString(undefined, { month: 'short' }), value: v });
            }
          }
          const max = Math.max(1, ...buckets.map((b) => b.value));
          return (
            <div>
              <div className="mt-4 flex h-28 items-end gap-1" role="img" aria-label={`${t('prog.ayahsPractised')} — ${chartRange === 'day' ? t('prog.perDay') : chartRange === 'week' ? t('prog.perWeek') : t('prog.perMonth')}`}>
                {buckets.map((b, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-[#57D798]"
                      style={{ height: `${Math.max(b.value > 0 ? 8 : 2, (b.value / max) * 100)}%` }}
                      title={`${b.label}: ${b.value} ${b.value === 1 ? t('common.ayah') : t('common.ayahs')}`}
                    />
                    <span className="text-[10px] text-[#6B7280]">{b.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#6B7280]">
                {t('prog.ayahsPractised')} — {chartRange === 'day' ? t('prog.perDay') : chartRange === 'week' ? t('prog.perWeek') : t('prog.perMonth')}.
                Built from your ayah records — never invented.
              </p>
            </div>
          );
        })()}
      </section>

      {/* BB — Real analytics. Every number below comes from stored
          records only (test scores, coach sessions, mistake log).
          Accuracy is real per-session accuracy — there is no synthetic
          "90% floor" figure anywhere here. A metric with no data yet
          says so instead of showing an invented number. */}
      <section aria-labelledby="real-analytics-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="real-analytics-heading" className="text-xl font-bold text-[#111827]">Real analytics</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          From your actual test and coaching sessions — never estimated.
        </p>

        {/* Week over week */}
        <h3 className="mt-5 text-sm font-bold text-[#111827]">Week over week</h3>
        <div className="mt-2 grid grid-cols-2 gap-3 text-center">
          {([
            { label: 'This week', stats: wow.current },
            { label: 'Last week', stats: wow.previous },
          ] as const).map(({ label, stats }) => (
            <div key={label} className="rounded-xl bg-[#F4F5F7] p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">{label}</p>
              <p className="mt-1 text-2xl font-bold text-[#111827]">{stats.ayahs}</p>
              <p className="text-xs text-[#6B7280]">ayahs · {stats.days} {stats.days === 1 ? 'day' : 'days'}</p>
              <p className="mt-1 text-xs text-[#6B7280]">
                {stats.mistakes} mistake {stats.mistakes === 1 ? 'attempt' : 'attempts'}
                {stats.testAvgPct !== null
                  ? ` · ${stats.testAvgPct}% test accuracy (${stats.tests} ${stats.tests === 1 ? 'test' : 'tests'})`
                  : stats.tests === 0 ? ' · no tests' : ''}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-[#6B7280]">
          {wow.current.ayahs - wow.previous.ayahs >= 0 ? '+' : ''}
          {wow.current.ayahs - wow.previous.ayahs} ayahs vs last week ·{' '}
          {wow.current.days - wow.previous.days >= 0 ? '+' : ''}
          {wow.current.days - wow.previous.days} days ·{' '}
          {wow.current.testAvgPct !== null && wow.previous.testAvgPct !== null
            ? `${wow.current.testAvgPct - wow.previous.testAvgPct >= 0 ? '+' : ''}${wow.current.testAvgPct - wow.previous.testAvgPct} pts test accuracy`
            : 'test accuracy comparison needs a test in both weeks'}
        </p>

        {/* Real accuracy trend — per-day, scored sessions only */}
        <h3 className="mt-6 text-sm font-bold text-[#111827]">Accuracy trend — last 14 days</h3>
        {accTrend.every((p) => p.pct === null) ? (
          <p className="mt-2 text-sm text-[#6B7280]">
            No test or coaching sessions yet — take a test or recite with the coach and your real accuracy appears here.
          </p>
        ) : (
          <>
            <div className="mt-3 flex h-28 items-end gap-1" role="img" aria-label="Real accuracy per day over the last 14 days">
              {accTrend.map((p) => (
                <div key={p.date} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t ${p.pct === null ? 'bg-[#E8EAED]' : 'bg-[#1FA36B]'}`}
                    style={{ height: `${p.pct === null ? 2 : Math.max(8, p.pct)}%` }}
                    title={p.pct === null ? `${p.date}: no session` : `${p.date}: ${p.pct}% (${p.correct}/${p.total})`}
                  />
                  <span className="text-[10px] text-[#6B7280]">
                    {new Date(`${p.date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#6B7280]">
              Real per-session accuracy (test score + coach words correct). Days with no session are blank — never filled in.
            </p>
          </>
        )}

        {/* Per-ayah trend — weekly mistake counts for the hardest ayahs */}
        <h3 className="mt-6 text-sm font-bold text-[#111827]">Per-ayah trend — your hardest ayahs</h3>
        {difficult.length === 0 ? (
          <p className="mt-2 text-sm text-[#6B7280]">
            No mistakes logged yet, so there is no per-ayah trend to show.
          </p>
        ) : (
          <div className="mt-2 space-y-4">
            {difficult.slice(0, 3).map((d) => {
              const trend = ayahMistakeTrend(mistakes, d.surah, d.ayah, 6);
              const max = Math.max(1, ...trend.map((x) => x.mistakes));
              const surah = getSurahById(d.surah);
              return (
                <div key={`${d.surah}:${d.ayah}`}>
                  <p className="text-sm font-semibold text-[#111827]">
                    {surah ? surah.name : `Surah ${d.surah}`} {d.surah}:{d.ayah} — mistakes per week (fewer is better)
                  </p>
                  <div className="mt-2 flex h-16 items-end gap-1" role="img" aria-label={`Weekly mistakes on ${d.surah}:${d.ayah} over the last 6 weeks`}>
                    {trend.map((x) => (
                      <div key={x.weekStart} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t bg-[#FF8A00]"
                          style={{ height: `${x.mistakes === 0 ? 2 : Math.max(10, (x.mistakes / max) * 100)}%` }}
                          title={`${x.label}: ${x.mistakes} ${x.mistakes === 1 ? 'mistake' : 'mistakes'}`}
                        />
                        <span className="text-[10px] text-[#6B7280]">{x.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mistake frequency by type over time — stacked weekly bars */}
        <h3 className="mt-6 text-sm font-bold text-[#111827]">Mistakes by type — last 6 weeks</h3>
        {mistakeTypeWeeks.every((w) => w.total === 0) ? (
          <p className="mt-2 text-sm text-[#6B7280]">No mistakes logged in the last 6 weeks.</p>
        ) : (
          <>
            <div className="mt-3 flex h-28 items-end gap-2" role="img" aria-label="Mistake attempts per week, split by type, over the last 6 weeks">
              {mistakeTypeWeeks.map((w) => {
                const max = Math.max(1, ...mistakeTypeWeeks.map((x) => x.total));
                return (
                  <div key={w.weekStart} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="flex w-full flex-col-reverse overflow-hidden rounded-t"
                      style={{ height: `${w.total === 0 ? 2 : Math.max(8, (w.total / max) * 100)}%` }}
                      title={`${w.label}: ${w.total} ${w.total === 1 ? 'mistake' : 'mistakes'}`}
                    >
                      {(Object.keys(MISTAKE_TYPE_COLORS) as (keyof typeof MISTAKE_TYPE_COLORS)[]).map((type) => {
                        const n = w.counts[type] ?? 0;
                        if (n === 0) return null;
                        return (
                          <div
                            key={type}
                            style={{ height: `${(n / w.total) * 100}%`, background: MISTAKE_TYPE_COLORS[type], minHeight: 2 }}
                            title={`${mistakeTypeLabel(type)}: ${n}`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-[#6B7280]">{w.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6B7280]">
              {(Object.keys(MISTAKE_TYPE_COLORS) as (keyof typeof MISTAKE_TYPE_COLORS)[]).map((type) => (
                <span key={type} className="flex items-center gap-1">
                  <span aria-hidden="true" className="h-3 w-3 rounded-sm" style={{ background: MISTAKE_TYPE_COLORS[type] }} />
                  {mistakeTypeLabel(type)}
                </span>
              ))}
            </p>
          </>
        )}
      </section>

      {/* Add Session — off-platform session / streak restore (screenshot 7) */}
      <section aria-labelledby="add-session-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="add-session-heading" className="text-xl font-bold text-[#111827]">{t('prog.addSession')}</h2>
          <span className="rounded-full bg-[#57D798] px-3 py-1 text-xs font-bold text-[#102E26]">{t('rb.dash.addSession')}</span>
        </div>
        <p className="mt-1 text-sm text-[#6B7280]">
          Read or recited away from the app — from a printed mushaf, in class, with a teacher?
          Log it here. Any past date can be logged; a session for yesterday restores a missed
          day&apos;s streak, and older days are kept in your history without changing the streak.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-[#6B7280]">
            {t('prog.date')}
            <input
              type="date"
              value={addDate}
              max={today}
              onChange={(e) => setAddDate(e.target.value)}
              className="mt-1 block min-h-11 rounded-lg border border-[#E8EAED] bg-[#F4F5F7] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-[#6B7280]">
            {t('prog.type')}
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value as GoalType)}
              className="mt-1 block min-h-11 rounded-lg border border-[#E8EAED] bg-[#F4F5F7] px-2 py-1.5 text-sm"
            >
              {(Object.keys(GOAL_TYPE_LABELS) as GoalType[]).map((t) => (
                <option key={t} value={t}>{GOAL_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-[#6B7280]">
            {t('prog.ayahs')}
            <input
              type="number"
              min={1}
              max={6236}
              value={addAyahs}
              onChange={(e) => setAddAyahs(Number(e.target.value) || 1)}
              className="mt-1 block w-20 min-h-11 rounded-lg border border-[#E8EAED] bg-[#F4F5F7] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-[#6B7280]">
            {t('prog.minutesLabel')}
            <input
              type="number"
              min={1}
              max={600}
              value={addMinutes}
              onChange={(e) => setAddMinutes(Number(e.target.value) || 1)}
              className="mt-1 block w-20 min-h-11 rounded-lg border border-[#E8EAED] bg-[#F4F5F7] px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={doAddSession}
            className="min-h-11 rounded-full bg-[#57D798] px-5 py-2 text-sm font-bold text-[#102E26] hover:brightness-105"
          >
            {t('prog.addSessionBtn')}
          </button>
        </div>
        {addMsg && (
          <p role="status" className="mt-3 text-sm font-semibold text-[#1FA36B]">{addMsg}</p>
        )}
        {sessions.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {sessions.slice(0, 5).map((sess, i) => (
              <li key={i} className="flex flex-wrap gap-2 rounded-lg bg-[#F4F5F7] px-3 py-2">
                <span className="font-semibold">{sess.date}</span>
                <span>{GOAL_TYPE_LABELS[sess.type as GoalType] ?? sess.type}</span>
                <span className="text-[#6B7280]">{sess.ayahs} ayahs · {sess.minutes} min</span>
              </li>
            ))}
          </ul>
        )}
      </section>




      {/* Offline coach (§15.10) */}
      <section aria-labelledby="offline-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="offline-heading" className="text-xl font-bold text-[#111827]">{t('prog.offline')}</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          {swReady === true
            ? t('rb.dash.offlineOn')
            : swReady === false
              ? t('rb.dash.offlineOff')
              : t('rb.dash.checkingOffline')}
        </p>
        <p className="mt-2 text-sm text-[#6B7280]">{t('rb.dash.savingNote')}</p>
        <button
          type="button"
          onClick={saveForOffline}
          disabled={offlineSaving}
          className="mt-4 rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] disabled:opacity-50"
        >
          {offlineSaving ? t('prog.saving') : t('prog.saveOffline')}
        </button>
        {offlineMsg && (
          <p role="status" className="mt-3 text-sm font-semibold text-[#1FA36B]">{offlineMsg}</p>
        )}
      </section>

      {/* Export / import */}
      <section aria-labelledby="export-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="export-heading" className="text-xl font-bold text-[#111827]">{t('prog.exportHeading')}</h2>
        <p className="mt-1 text-sm text-[#6B7280]">{t('rb.dash.progressLives')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={doExport}
            className="min-h-11 rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B]"
          >
            {t('prog.download')}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="min-h-11 rounded-full border border-[#102E26] px-5 py-2.5 text-sm font-semibold text-[#111827] hover:bg-[#E4FFF2]"
          >
            {t('prog.importBtn')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            aria-label={t('rb.dash.chooseExport')}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) doImport(f);
              e.target.value = '';
            }}
          />
        </div>
        {importMsg && (
          <p role="status" className="mt-3 text-sm font-semibold text-[#1FA36B]">{importMsg}</p>
        )}
      </section>

        </div>
      )}

      {tab === 'community' && (
        <div className="space-y-6" role="tabpanel" aria-label={t('rb.dash.tabCommunity')}>
          {/* My Groups — heading outside the card, like the reference. */}
          <h2 className="text-xl font-bold text-[#111827]">{t('rb.dash.myGroups')}</h2>
          <section aria-labelledby="my-groups-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 text-center shadow-sm sm:p-6">
            <h3 id="my-groups-heading" className="sr-only">{t('rb.dash.myGroups')}</h3>
            <span className="mx-auto flex h-12 w-12 items-center justify-center text-[#9CA3AF]" aria-hidden="true">
              <ToolIcon name="share" className="h-8 w-8" />
            </span>
            <p dir="rtl" lang="ar" className="font-quran mt-3 text-xl leading-relaxed text-[#111827]">
              وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ
            </p>
            <p className="mt-1 text-sm text-[#111827]">
              &ldquo;And in that let the competitors compete.&rdquo; — Quran 83:26
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">{t('rb.dash.practiseTogether')}</p>
            {groups.length > 0 ? (
              <ul className="mt-3 space-y-1 text-left text-sm">
                {groups.map((g) => (
                  <li key={g.id} className="flex flex-wrap gap-2 rounded-lg bg-[#F4F5F7] px-3 py-2">
                    <span className="font-semibold">{g.name}</span>
                    <span className="text-[#6B7280]">{g.code} · {g.members.length} {g.members.length === 1 ? 'member' : 'members'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[#6B7280]">{t('rb.dash.noGroups')}</p>
            )}
            <div className="mt-4 flex flex-col items-center gap-2">
              <a href="#community-join" className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-black bg-white px-6 py-2 text-sm font-bold text-black hover:bg-[#F4F5F7]">{t('rb.dash.joinGroup')}</a>
              <a href="#community-create" className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-black bg-white px-6 py-2 text-sm font-bold text-black hover:bg-[#F4F5F7]">{t('rb.dash.createGroup')}</a>
              <Link href="/hifz/challenges" className="mt-1 inline-flex min-h-11 items-center justify-center text-sm font-semibold text-[#1FA36B] underline">{t('rb.dash.openChallenges')} →</Link>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#6B7280]">
              {t('rb.dash.groupsNoteShort')}
            </p>
          </section>

          <ChallengesClient />
        </div>
      )}
    </div>
  );
}
