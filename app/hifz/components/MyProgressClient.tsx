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
  currentStreakCount, localDateString, isDailyGoalMet, ayahsPractisedOn,
  getStorageNotice, setDailyGoal, DAILY_GOAL_OPTIONS,
  activityByDate, weekPracticeDays, surahStrength, revisionDue, daysSince,
  peekedDue, mistakeTypeLabel, markMistakesCorrected,
  getTypeGoals, setTypeGoalTarget, recordTypeActivity, recordMinutes, previousLocalDate,
  GOAL_TYPE_LABELS, GOAL_TYPE_DESCRIPTIONS, TYPE_GOAL_OPTIONS,
  completedSurahs, completedJuz, activitySummary, strongestSurahThisWeek, difficultAyahs,
  type GoalType, type HifzProgress, type MistakeEntry, type HifzSettings,
} from '../progress';
import { loadBookmarks, saveBookmarks } from '../lib/bookmarks';
import { loadChallenges, saveChallenges } from '../lib/challenges';
import { loadTestSessions, loadInProgressTest, type TestSessionRecord, type InProgressTest } from '../lib/mode';
import { getSurahById, ALL_SURAHS } from '../surahs';
import { buildBadgeSnapshot, loadBestTestPct } from '../badges';
import BadgesGrid from './BadgesGrid';
import GoalsClient from './GoalsClient';
import ChallengesClient from './ChallengesClient';
import ToolIcon from '../../components/ToolIcon';
import { useT } from '../lib/i18n';

/** Small SVG progress ring for one per-type daily goal. */
function GoalRing({ done, target }: { done: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={`${done} of ${target} ayahs — ${pct}%`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="#E5E7EB" strokeWidth="7" />
      <circle
        cx="32" cy="32" r={r} fill="none" stroke="#1FA36B" strokeWidth="7"
        strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`}
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="36" textAnchor="middle" fontSize="13" fontWeight="700" fill="#102E26">
        {pct}%
      </text>
    </svg>
  );
}


const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'goals', label: 'Goals' },
  { id: 'memorization', label: 'Memorization' },
  { id: 'activity', label: 'Activity' },
  { id: 'community', label: 'Community' },
] as const;
type ProgressTab = (typeof TABS)[number]['id'];

/** Streak card (Dashboard + Activity tabs): flame, day count, longest
 *  streak, and Fri–Thu week diamonds from real practice data. */
function StreakCard({ streak, longestStreak, activity }: {
  streak: number;
  longestStreak: number;
  activity: Record<string, number>;
}) {
  const now = new Date();
  const back = (now.getDay() - 5 + 7) % 7; // days since Friday (5)
  const friday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
  const labels = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
  const days = labels.map((label, i) => {
    const d = new Date(friday.getFullYear(), friday.getMonth(), friday.getDate() + i);
    const key = localDateString(d);
    return { label, date: key, active: (activity[key] ?? 0) > 0, future: d > now };
  });
  return (
    <div className="t-card rounded-2xl p-5 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#5b6b62]">
        <ToolIcon name="flame" className="h-4 w-4 text-[#FFB800]" /> Streak
      </p>
      <p className="mt-2 text-4xl font-bold text-[#102E26]">{streak} Day</p>
      <p className="mt-1 text-sm text-[#5b6b62]">
        Longest Streak {longestStreak} Day
      </p>
      <div className="mt-4 flex items-start justify-between gap-1" role="img" aria-label="Days practised this week, Friday to Thursday">
        {days.map((d) => (
          <span key={d.date} className="flex flex-1 flex-col items-center gap-1.5" title={`${d.label} ${d.date}: ${d.active ? 'practised' : d.future ? 'not yet' : 'no practice recorded'}`}>
            <span
              className={`block h-3.5 w-3.5 rotate-45 rounded-[3px] ${d.active ? 'bg-[#1FA36B]' : d.future ? 'border border-[#E5E7EB] bg-transparent' : 'bg-[#E5E7EB]'}`}
            />
            <span className="text-[10px] font-semibold text-[#5b6b62]">{d.label}</span>
          </span>
        ))}
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
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FFFBF2] p-4">
      <div className="flex items-center gap-3">
        {goal.target > 0 ? (
          <GoalRing done={goal.done} target={goal.target} />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#E5E7EB] text-xs font-bold text-[#5b6b62]">Not set</span>
        )}
        <div className="min-w-0">
          <p className="font-bold text-[#102E26]">{GOAL_TYPE_LABELS[type]}</p>
          <p className="text-sm text-[#5b6b62]">
            {goal.target > 0 ? (
              <>{goal.done} / {goal.target} {t('common.ayahs')} {met ? t('prog.goalMetShort') : t('prog.today')}</>
            ) : (
              'Not Set'
            )}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[#5b6b62]">{GOAL_TYPE_DESCRIPTIONS[type]}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#5b6b62]">
          {t('prog.target')}
          <select
            value={goal.target}
            onChange={(e) => onTargetChange(type, Number(e.target.value))}
            className="min-h-11 rounded-lg border border-[#E5E7EB] bg-white px-2 py-1.5 text-sm"
            aria-label={`${GOAL_TYPE_LABELS[type]} daily target in ayahs`}
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
  const [sessions, setSessions] = useState<{ date: string; type: string; ayahs: number; minutes: number }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ili_sessions_v1') ?? '[]') as { date: string; type: string; ayahs: number; minutes: number }[];
    } catch {
      return [];
    }
  });
  // Mistake log filters + weak spots.
  const [mistakeFilter, setMistakeFilter] = useState<'all' | 'incorrect' | 'missed'>('all');
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

  if (progress === null || settings === null) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#5b6b62]">{t('prog.loading')}</p>
          {notice && <p className="mt-2 text-sm text-[#5b6b62]">{notice}</p>}
        </div>
        <BadgesGrid snapshot={badgeSnapshot} />
      </div>
    );
  }

  const today = localDateString();
  const streak = currentStreakCount(progress.streak, today);
  const goalMet = isDailyGoalMet(progress, today);
  const practisedToday = ayahsPractisedOn(progress, today);
  const minutesToday = progress.minutesToday.date === today ? progress.minutesToday.minutes : 0;
  const memorised = Object.entries(progress.ayahs).filter(([, a]) => a.status === 'memorised');
  const learning = Object.entries(progress.ayahs).filter(([, a]) => a.status === 'learning');
  const goalPct = Math.min(100, Math.round((minutesToday / progress.dailyGoalMinutes) * 100));
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
    count < 0 ? 'bg-transparent' : count === 0 ? 'bg-[#E5E7EB]' : count <= 1 ? 'bg-[#bcd8c6]' : count <= 3 ? 'bg-[#7fb894]' : 'bg-[#1FA36B]';

  const changeGoal = (minutes: number) => {
    const next = setDailyGoal(progress, minutes as 5 | 10 | 15 | 30);
    saveProgress(next);
    setProgress(next);
  };

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
          ? `Saved ${saved} pages and surahs for offline use. The coach model downloads the first time you recite, and is then cached too — after that, airplane mode works.`
          : `Saved ${saved} of ${urls.length}. Some items failed — check your connection and try again.`,
      );
    } catch {
      setOfflineMsg('Could not save for offline use — check your connection and try again.');
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
        `Progress imported successfully.` +
          (result.bookmarks.length > 0 ? ` ${result.bookmarks.length} bookmarks restored.` : '') +
          (result.challenges.length > 0 ? ` ${result.challenges.length} challenges restored.` : ''),
      );
      reload();
    };
    reader.onerror = () => setImportMsg('That file could not be read.');
    reader.readAsText(file);
  };

  const doAddSession = () => {
    try {
      let next = loadProgress();
      const todayStr = localDateString();
      if (addDate === todayStr) {
        next = recordMinutes(next, addMinutes);
        next = recordTypeActivity(next, addType, addAyahs);
      } else if (addDate === previousLocalDate(todayStr)) {
        // Restore a missed day: yesterday counts toward the streak.
        const last = next.streak.lastActiveDate;
        if (last === addDate) {
          setAddMsg('That day is already in your streak.');
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
      } else {
        setAddMsg('You can add a session for today or yesterday only — older days cannot restore a streak.');
        return;
      }
      saveProgress(next);
      setProgress(next);
      const entry = { date: addDate, type: addType, ayahs: addAyahs, minutes: addMinutes };
      const list = [entry, ...sessions].slice(0, 30);
      setSessions(list);
      try {
        localStorage.setItem('ili_sessions_v1', JSON.stringify(list));
      } catch {
        /* ignore */
      }
      setAddMsg(
        addDate === todayStr
          ? `Session added for today — ${addAyahs} ayahs, ${addMinutes} minutes.`
          : `Session added for yesterday — your streak is restored for that day.`,
      );
    } catch {
      setAddMsg('That session could not be saved — browser storage is unavailable.');
    }
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
      {notice && (
        <p role="status" className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#5b6b62]">
          {notice}
        </p>
      )}

      {/* 5-tab progress hub — Dashboard / Goals / Memorization / Activity / Community. */}
      <div role="tablist" aria-label="Progress sections" className="flex gap-1 overflow-x-auto border-b border-[#E8EAED] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            type="button"
            role="tab"
            aria-selected={tab === tb.id}
            onClick={() => setTab(tb.id)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-semibold ${
              tab === tb.id
                ? 'border-[#1FA36B] font-bold text-[#111827]'
                : 'border-transparent text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-6" role="tabpanel" aria-label="Dashboard">
          {/* Guest-safe greeting: no name is stored anywhere on this device,
              so no name is shown — never a fake one. */}
          <div>
            <h2 className="text-2xl font-bold text-[#102E26]">Salam!</h2>
            <p className="mt-1 text-sm text-[#5b6b62]">
              Your hifz at a glance — every number below comes from your practice on this device.
            </p>
          </div>

          <section aria-label="Streak and daily goal" className="grid gap-4 sm:grid-cols-2">
            <StreakCard streak={streak} longestStreak={longestStreak} activity={activity} />
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">{t('prog.dailyGoal')}</p>
          <p className="mt-2 text-4xl font-bold text-[#102E26]">
            {minutesToday}<span className="text-lg text-[#5b6b62]"> / {progress.dailyGoalMinutes} min</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E5E7EB]" role="progressbar" aria-valuenow={goalPct} aria-valuemin={0} aria-valuemax={100} aria-label="Daily goal progress">
            <div className="h-full rounded-full bg-[#1FA36B]" style={{ width: `${goalPct}%` }} />
          </div>
          <p className="mt-2 text-sm text-[#5b6b62]">
            {t('prog.practisedToday').replace('{n}', String(practisedToday)).replace('{ayahWord}', practisedToday === 1 ? t('common.ayah') : t('common.ayahs'))}
            {goalMet ? t('prog.goalMet') : t('prog.goalNotMet')}
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm font-medium">
            {t('prog.goal')}
            <select
              value={progress.dailyGoalMinutes}
              onChange={(e) => changeGoal(Number(e.target.value))}
              className="min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
            >
              {DAILY_GOAL_OPTIONS.map((m) => (
                <option key={m} value={m}>{t('prog.minutes').replace('{n}', String(m))}</option>
              ))}
            </select>
          </label>
        </div>
          </section>

          {/* Free-features promo — our own line; nothing is upsold, everything is free. */}
          <section aria-label="Explore free features" className="t-card rounded-2xl p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-[#102E26]">Keep going — every tool here is free</h2>
            <p className="mt-1 text-sm text-[#5b6b62]">
              Recite with the coach, test yourself, set goals and track every ayah — no account, no limits, no cost.
            </p>
            <Link
              href="/hifz/memorize"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-[#57D798] px-5 py-2.5 text-sm font-bold text-[#102E26] hover:brightness-105"
            >
              Explore all features →
            </Link>
          </section>

          {/* Highlights — Testing Mode, with the real best score when one exists. */}
          <section aria-label="Highlights" className="t-card rounded-2xl p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-[#102E26]">Highlights</h2>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FFFBF2] px-4 py-3">
              <div>
                <p className="font-bold text-[#102E26]">Testing Mode</p>
                <p className="text-sm text-[#5b6b62]">
                  {bestTestPct !== null
                    ? `Your best test score so far is ${bestTestPct}%.`
                    : 'Test what you have memorised — six test types, instant scores.'}
                </p>
              </div>
              <Link href="/hifz/test" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]">
                Open Test Mode →
              </Link>
            </div>
          </section>

          {/* Today's goals — the three per-type daily goals, with a way to start a new goal. */}
          <section aria-labelledby="today-goals-heading" className="t-card rounded-2xl p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="today-goals-heading" className="text-xl font-bold text-[#102E26]">Today&apos;s goals</h2>
              <button
                type="button"
                onClick={() => { setGoalsCreateSignal((n) => n + 1); setTab('goals'); }}
                className="min-h-11 rounded-full bg-[#57D798] px-5 py-2 text-sm font-bold text-[#102E26] hover:brightness-105"
              >
                START A NEW GOAL
              </button>
            </div>
            <p className="mt-1 text-sm text-[#5b6b62]">
              One goal per kind of practice, in ayahs per day.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {(Object.keys(GOAL_TYPE_LABELS) as GoalType[]).map((type) => (
                <TypeGoalCard key={type} type={type} goal={typeGoals[type]} onTargetChange={changeTypeTarget} onLog={logType} />
              ))}
            </div>
          </section>

      {/* Stage 6 (§18): totals — every number traces to stored progress. */}
      <section aria-label="Totals" className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">Surahs completed</p>
          <p className="mt-1 text-3xl font-bold text-[#102E26]">{completedSurahList.length}</p>
          <p className="mt-1 text-xs text-[#5b6b62]">of 114 · every ayah memorised</p>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">Juz completed</p>
          <p className="mt-1 text-3xl font-bold text-[#102E26]">{completedJuzList.length}</p>
          <p className="mt-1 text-xs text-[#5b6b62]">
            of 30{completedJuzList.length > 0 ? ` · Juz ${completedJuzList.join(', ')}` : ''}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">This week</p>
          <p className="mt-1 text-3xl font-bold text-[#102E26]">{summary.weekAyahs}</p>
          <p className="mt-1 text-xs text-[#5b6b62]">
            {summary.weekAyahs === 1 ? 'ayah' : 'ayahs'} · {summary.weekDays} {summary.weekDays === 1 ? 'day' : 'days'}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">This month</p>
          <p className="mt-1 text-3xl font-bold text-[#102E26]">{summary.monthAyahs}</p>
          <p className="mt-1 text-xs text-[#5b6b62]">
            {summary.monthAyahs === 1 ? 'ayah' : 'ayahs'} · {summary.monthDays} {summary.monthDays === 1 ? 'day' : 'days'}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">Reading today</p>
          <p className="mt-1 text-3xl font-bold text-[#102E26]">
            {typeGoals.reading.done}<span className="text-lg text-[#5b6b62]"> / {typeGoals.reading.target}</span>
          </p>
          <p className="mt-1 text-xs text-[#5b6b62]">ayahs · log more on the Goals tab</p>
        </div>
      </section>

      {/* Stage 6 (§18): at a glance — three summaries from real data, each
          with an honest empty state when there is nothing to summarise. */}
      <section aria-labelledby="glance-heading" className="grid gap-4 sm:grid-cols-3">
        <h2 id="glance-heading" className="sr-only">At a glance</h2>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">Your strongest Surah this week</p>
          {strongestWeek ? (
            <>
              <p className="mt-2 text-xl font-bold text-[#102E26]">{strongestWeek.name}</p>
              <p className="mt-1 text-sm text-[#5b6b62]">
                {strongestWeek.ayahsPractised} {strongestWeek.ayahsPractised === 1 ? 'ayah' : 'ayahs'} practised in the last 7 days.
              </p>
              <Link href={`/hifz/${strongestWeek.slug}`} className="mt-3 inline-block font-semibold text-[#1FA36B] underline">
                Open it →
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#5b6b62]">
              Nothing practised this week yet — recite an ayah with the coach and your strongest surah appears here.
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">Ayahs that may need more revision</p>
          {revisionNeeded > 0 ? (
            <>
              <p className="mt-2 text-xl font-bold text-[#102E26]">
                {revisionNeeded} {revisionNeeded === 1 ? 'ayah' : 'ayahs'}
              </p>
              <p className="mt-1 text-sm text-[#5b6b62]">
                {peeked.length > 0 ? `${peeked.length} peeked at and not yet recited clean. ` : ''}
                {due.length > 0 ? `${due.length} due by the revision schedule.` : ''}
              </p>
              <button type="button" onClick={() => setTab('memorization')} className="mt-3 inline-block font-semibold text-[#1FA36B] underline">
                See the revision queue →
              </button>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#5b6b62]">
              Nothing due — everything you have practised is fresh. It appears here when an ayah goes stale or you peek at one.
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">Continue where you left off</p>
          {lastRead ? (
            <>
              <p className="mt-2 text-xl font-bold text-[#102E26]">{lastRead.name}</p>
              <p className="mt-1 text-sm text-[#5b6b62]">
                Last read {new Date(lastRead.at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.
              </p>
              <Link href={`/hifz/${lastRead.slug}`} className="mt-3 inline-block font-semibold text-[#1FA36B] underline">
                Continue reading →
              </Link>
            </>
          ) : mushafPage !== null ? (
            <>
              <p className="mt-2 text-xl font-bold text-[#102E26]">Mushaf page {mushafPage}</p>
              <p className="mt-1 text-sm text-[#5b6b62]">Your last place in the continuous reader.</p>
              <Link href={`/hifz/mushaf?page=${mushafPage}`} className="mt-3 inline-block font-semibold text-[#1FA36B] underline">
                Open the Mushaf →
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#5b6b62]">
              No reading yet — open a surah and your place is remembered here.
            </p>
          )}
        </div>
      </section>

      {/* Continue where you left off + favourites */}
      {(lastRead || bookmarks.length > 0) && (
        <section aria-labelledby="continue-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
          {lastRead && (
            <>
              <h2 id="continue-heading" className="text-xl font-bold text-[#102E26]">{t('prog.continue')}</h2>
              <p className="mt-1 text-sm text-[#5b6b62]">
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
              <h3 className="text-sm font-bold text-[#102E26]">{t('prog.favourites')}</h3>
              {/* Stage 6 (§19): the shared bookmark store also holds Mushaf
                  page bookmarks (no surahNumber) — only ayah bookmarks
                  belong in this list; page bookmarks show on /hifz/bookmarks. */}
              <ul className="mt-2 space-y-1 text-sm">
                {bookmarks
                  .filter((b) => typeof b.surahNumber === 'number')
                  .slice(0, 10).map((b, i) => {
                  const bs = getSurahById(b.surahNumber);
                  return (
                    <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-[#FFFBF2] px-3 py-2">
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
                <p className="mt-2 text-xs text-[#5b6b62]">{t('prog.showingBookmarks').replace('{n}', String(bookmarks.filter((b) => typeof b.surahNumber === 'number').length))}</p>
              )}
              <Link href="/hifz/bookmarks" className="mt-3 inline-block font-semibold text-[#1FA36B] underline">
                View all bookmarks →
              </Link>
            </div>
          )}
        </section>
      )}

        </div>
      )}

      {tab === 'goals' && (
        <div role="tabpanel" aria-label="Goals">
          <GoalsClient createOpenSignal={goalsCreateSignal} />
        </div>
      )}

      {tab === 'memorization' && (
        <div className="space-y-6" role="tabpanel" aria-label="Memorization">
          {/* Memorization completion — memorised ayahs out of all 6,236. */}
          <section aria-labelledby="completion-heading" className="t-card rounded-2xl p-5 shadow-sm sm:p-6">
            <h2 id="completion-heading" className="text-xl font-bold text-[#102E26]">Memorization completion</h2>
            <p className="mt-2 text-4xl font-bold text-[#102E26]">{memorisedPct}%</p>
            <p className="mt-1 text-sm text-[#5b6b62]">
              {memorised.length} of 6,236 ayahs memorised · {learning.length} {learning.length === 1 ? 'ayah' : 'ayahs'} learning · an ayah counts as memorised after 3 correct recitations in a row.
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E5E7EB]" role="progressbar" aria-valuenow={memorisedPct} aria-valuemin={0} aria-valuemax={100} aria-label="Memorization completion">
              <div className="h-full rounded-full bg-[#1FA36B]" style={{ width: `${memorisedPct}%` }} />
            </div>
            {progress.activePlan && (
              <p className="mt-2 text-sm text-[#5b6b62]">
                {t('prog.activePlan').replace('{days}', String(progress.activePlan.planDays)).replace('{day}', String(progress.activePlan.currentDay))}
              </p>
            )}
          </section>

          {/* Goals — Memorization Goal and Review Goal cards (real values, or "Not Set"). */}
          <section aria-labelledby="mem-goals-heading" className="t-card rounded-2xl p-5 shadow-sm sm:p-6">
            <h2 id="mem-goals-heading" className="text-xl font-bold text-[#102E26]">Goals</h2>
            <p className="mt-1 text-sm text-[#5b6b62]">
              Your daily memorisation and review targets, in ayahs per day.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TypeGoalCard type="memorisation" goal={typeGoals.memorisation} onTargetChange={changeTypeTarget} onLog={logType} />
              <TypeGoalCard type="revision" goal={typeGoals.revision} onTargetChange={changeTypeTarget} onLog={logType} />
            </div>
            <p className="mt-3 text-sm text-[#5b6b62]">
              Change or add goals any time on the <button type="button" onClick={() => setTab('goals')} className="font-semibold text-[#1FA36B] underline">Goals tab</button>.
            </p>
          </section>

      {/* Memorised map — all 114 surahs */}
      <section aria-labelledby="map-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="map-heading" className="text-xl font-bold text-[#102E26]">{t('prog.mapHeading')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          One square per surah, darker as it gets stronger. Tap a square to open the surah.
        </p>
        <div className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-12" role="list" aria-label="Memorised map of all 114 surahs">
          {ALL_SURAHS.map((s) => {
            const st = strengths.find((x) => x.surah === s.id);
            const pct = st?.strengthPct ?? 0;
            const bg = pct === 0 ? '#E5E7EB' : pct < 25 ? '#bcd8c6' : pct < 50 ? '#7fb894' : pct < 100 ? '#1FA36B' : '#102E26';
            return (
              <Link
                key={s.id}
                href={`/hifz/${s.slug}`}
                role="listitem"
                title={t('prog.mapTitle').replace('{name}', s.name).replace('{pct}', String(pct)).replace('{m}', String(st?.memorised ?? 0)).replace('{total}', String(s.ayahCount))}
                aria-label={t('prog.mapAria').replace('{name}', s.name).replace('{pct}', String(pct))}
                className="flex h-9 items-center justify-center rounded-md text-xs font-bold text-white"
                style={{ background: bg, color: pct === 0 ? '#5b6b62' : '#fff' }}
              >
                {s.id}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Surah strength */}
      <section aria-labelledby="strength-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="strength-heading" className="text-xl font-bold text-[#102E26]">{t('prog.strength')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          How strong each surah you have touched is: memorised ayahs count fully, learning
          ayahs count half. Surahs you have never practised are not listed.
        </p>
        {strengths.length === 0 ? (
          <p className="mt-2 text-sm text-[#5b6b62]">
            No strength yet — recite an ayah with the coach and it appears here.{' '}
            <Link href="/hifz/juz-amma" className="font-semibold text-[#1FA36B] underline">Start with Juz Amma →</Link>
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {strengths.map((s) => (
              <li key={s.slug}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <Link href={`/hifz/${s.slug}`} className="font-semibold text-[#102E26] hover:underline">
                    {s.name} <span className="font-normal text-[#5b6b62]">· {t('prog.strengthLine').replace('{m}', String(s.memorised)).replace('{l}', String(s.learning)).replace('{n}', String(s.ayahCount))}</span>
                  </Link>
                  <span className="font-bold text-[#1FA36B]">{s.strengthPct}%</span>
                </div>
                <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-[#E5E7EB]" aria-hidden="true">
                  <div className="h-full bg-[#1FA36B]" style={{ width: `${(s.memorised / s.ayahCount) * 100}%` }} />
                  <div className="h-full bg-[#7fb894]" style={{ width: `${(s.learning / s.ayahCount) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Revision due — spaced repetition queue */}
      <section id="revision" aria-labelledby="revision-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="revision-heading" className="text-xl font-bold text-[#102E26]">{t('prog.revision')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Memory fades on a schedule: a learning ayah is due after 2 days without practice,
          a memorised ayah after 7 days. Oldest first — the weakest memory is the most urgent.
        </p>
        {/* Stage 5 (§9): peeks drive revision. Ayahs you needed help with
            come FIRST — needing a peek is a stronger signal than merely
            not practising for a while. One clean recitation clears an ayah
            from this list. */}
        {peeked.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-bold text-[#102E26]">
              Peeked — revise these first ({peeked.length})
            </h3>
            <p className="mt-1 text-xs text-[#5b6b62]">
              You revealed a hidden word or ayah here, so the app knows this one needs work.
            </p>
            <ul className="mt-2 space-y-2">
              {peeked.slice(0, 10).map((item) => {
                const surah = getSurahById(item.surah);
                return (
                  <li key={`peek-${item.surah}:${item.ayah}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#FFB800]/60 bg-[#FFFBF2] px-3 py-2 text-sm">
                    <span>
                      {surah ? surah.name : `Surah ${item.surah}`} {item.surah}:{item.ayah} ·{' '}
                      peeked {item.peekCount} {item.peekCount === 1 ? 'time' : 'times'}
                      {item.daysSincePeek === 0 ? ' · today' : ` · ${item.daysSincePeek} ${item.daysSincePeek === 1 ? 'day' : 'days'} ago`}
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
          <p className="mt-2 text-sm text-[#5b6b62]">{t('prog.nothingDue')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {due.slice(0, 10).map((item) => {
              const surah = getSurahById(item.surah);
              return (
                <li key={`${item.surah}:${item.ayah}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#FFFBF2] px-3 py-2 text-sm">
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
          <p className="mt-2 text-sm text-[#5b6b62]">{t('prog.moreDue').replace('{n}', String(due.length - 10))}</p>
        )}
      </section>

      {/* Memorised ayahs */}
      <section aria-labelledby="memorised-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="memorised-heading" className="text-xl font-bold text-[#102E26]">{t('prog.memorisedAyahs')}</h2>
        {memorised.length === 0 ? (
          <p className="mt-2 text-sm text-[#5b6b62]">
            Nothing memorised yet. Recite an ayah correctly three times in a row and it appears here.{' '}
            <Link href="/hifz/juz-amma" className="font-semibold text-[#1FA36B] underline">Start with Juz Amma →</Link>
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
      <section aria-labelledby="mistakes-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="mistakes-heading" className="text-xl font-bold text-[#102E26]">{t('prog.mistakesHeading')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Your full mistake log is kept on this device — nothing is trimmed. The wash behind a
          word shows how often you have missed it: red most, then orange, yellow, green fewest.
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter mistakes">
          {(['all', 'incorrect', 'missed'] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={mistakeFilter === f}
              onClick={() => setMistakeFilter(f)}
              className={`min-h-11 rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${mistakeFilter === f ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] hover:border-[#1FA36B]'}`}
            >
              {f === 'all' ? t('prog.filterAll') : f === 'incorrect' ? t('prog.filterIncorrect') : t('prog.filterMissed')}
            </button>
          ))}
        </div>
        {mistakes.length === 0 ? (
          <p className="mt-3 text-sm text-[#5b6b62]">
            No mistakes logged yet. When the coach hears a word you missed, it appears here with
            the ayah to retry.
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
              return ranked.length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-[#102E26]">{t('prog.weakSpots')}</h3>
                  <ul className="mt-2 space-y-2">
                    {ranked.map((w) => {
                      const surah = getSurahById(w.surah);
                      return (
                        <li key={`${w.surah}:${w.ayah}:${w.word}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#FFFBF2] px-3 py-2 text-sm">
                          <span dir="rtl" lang="ar" className={`font-quran text-lg ${wash(w.attempts)}`}>{w.word}</span>
                          <span>
                            {surah ? surah.name : `Surah ${w.surah}`} {w.surah}:{w.ayah} · {t('prog.missed').replace('{n}', String(w.attempts)).replace('{timeWord}', w.attempts === 1 ? t('common.time') : t('common.times'))}
                            {w.heard ? ` · heard as “${w.heard}”` : ''}
                          </span>
                          <span className="text-xs text-[#5b6b62]">
                            {t('prog.moreToClear').replace('{n}', String(Math.max(0, 3 - Math.min(3, w.attempts))))}
                          </span>
                          {surah && (
                            <Link href={`/hifz/${surah.slug}?mode=recite&ayah=${w.ayah}`} className="ml-auto font-semibold text-[#1FA36B] underline">
                              {t('prog.practiseWord')}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
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
                    <li key={`${m.surah}:${m.ayah}:${m.word}:${i}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#FFFBF2] px-3 py-2 text-sm">
                      <span dir="rtl" lang="ar" className="font-quran text-lg">{m.word}</span>
                      <span>
                        {surah ? surah.name : `Surah ${m.surah}`} {m.surah}:{m.ayah}
                        {typeof m.wordIndex === 'number' ? ` · word ${m.wordIndex + 1}` : ''} ·{' '}
                        {mistakeTypeLabel(m.type)} · {m.attempts}{' '}
                        {m.attempts === 1 ? t('common.time') : t('common.times')}
                        {m.source === 'self-mark' ? ` · ${t('prog.selfMarked')}` : ''}
                        {m.heard ? ` · heard as “${m.heard}”` : ''}
                        {whenLabel ? ` · ${whenLabel}` : ''}
                      </span>
                      {m.corrected && (
                        <span className="rounded-full bg-[#E4FFF2] px-2 py-0.5 text-xs font-bold text-[#1FA36B]">
                          Corrected{m.correctedAt ? ` · ${new Date(m.correctedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
                        </span>
                      )}
                      <span className="ml-auto flex gap-2">
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
                          >
                            Mark corrected
                          </button>
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
            <div className="mt-4 rounded-xl border border-[#E5E7EB] p-4">
              <p className="text-sm font-bold text-[#102E26]">Recordings &amp; stored history</p>
              <p className="mt-1 text-xs leading-relaxed text-[#5b6b62]">
                A recording of a take is kept only in the coach, for that browser session, so
                you can listen back — it is never uploaded and no audio file is stored on this
                device. Closing the coach deletes it. Turning recordings off stops new ones
                being kept.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSaveAudio(!(settings.saveAudio ?? true))}
                  aria-pressed={settings.saveAudio ?? true}
                  className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold ${(settings.saveAudio ?? true) ? 'border-[#1FA36B] bg-[#E4FFF2] text-[#1FA36B]' : 'border-[#E5E7EB] hover:border-[#1FA36B]'}`}
                >
                  {(settings.saveAudio ?? true) ? 'Recordings on — tap to turn off' : 'Recordings off — tap to turn on'}
                </button>
                {confirmClearMistakes ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-red-700">Delete all {mistakes.length} mistake records?</span>
                    <button
                      type="button"
                      onClick={clearAllMistakes}
                      className="min-h-11 rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Yes, delete all
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearMistakes(false)}
                      className="min-h-11 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold"
                    >
                      Keep them
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearMistakes(true)}
                    className="min-h-11 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:border-red-700"
                  >
                    Delete all mistake history
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Stage 6 (§18): difficult ayahs — ranked by uncorrected mistakes,
          per ayah (the weak-spots list above is per word). */}
      <section aria-labelledby="difficult-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="difficult-heading" className="text-xl font-bold text-[#102E26]">Difficult ayahs</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          The ayahs you have missed most, counting only mistakes you have not yet corrected.
        </p>
        {difficult.length === 0 ? (
          <p className="mt-2 text-sm text-[#5b6b62]">
            No difficult ayahs — either no mistakes are logged, or every mistake has been corrected.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {difficult.map((d) => {
              const surah = getSurahById(d.surah);
              return (
                <li key={`${d.surah}:${d.ayah}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#FFFBF2] px-3 py-2 text-sm">
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
      <section aria-labelledby="tests-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="tests-heading" className="text-xl font-bold text-[#102E26]">Test performance</h2>
        {testSessions.length === 0 ? (
          <p className="mt-2 text-sm text-[#5b6b62]">
            No tests taken yet. Take a test and your scores appear here — best, recent average, and every past test to review.{' '}
            <Link href="/hifz/test" className="font-semibold text-[#1FA36B] underline">Take your first test →</Link>
          </p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-[#FFFBF2] p-3">
                <p className="text-2xl font-bold text-[#102E26]">{testSessions.length}</p>
                <p className="text-xs text-[#5b6b62]">tests taken</p>
              </div>
              <div className="rounded-xl bg-[#FFFBF2] p-3">
                <p className="text-2xl font-bold text-[#102E26]">{bestTestPct}%</p>
                <p className="text-xs text-[#5b6b62]">best score</p>
              </div>
              <div className="rounded-xl bg-[#FFFBF2] p-3">
                <p className="text-2xl font-bold text-[#102E26]">{avgTestPct}%</p>
                <p className="text-xs text-[#5b6b62]">average of last {recentTestPcts.length}</p>
              </div>
            </div>
            <ul className="mt-3 space-y-2">
              {testSessions.slice(0, 5).map((s, i) => (
                <li key={`${s.at}-${i}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#FFFBF2] px-3 py-2 text-sm">
                  <span className="font-bold text-[#102E26]">
                    {s.score}/{s.total} · {s.total > 0 ? Math.round((s.score / s.total) * 100) : 0}%
                  </span>
                  <span className="text-[#5b6b62]">{s.type} · {s.scope}</span>
                  <span className="text-[#5b6b62]">{s.mistakes} {s.mistakes === 1 ? 'mistake' : 'mistakes'}</span>
                  <span className="ml-auto text-xs text-[#5b6b62]">
                    {new Date(s.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </li>
              ))}
            </ul>
            {testSessions[0] && testSessions[0].missed.length > 0 && (
              <div className="mt-3">
                <h3 className="text-sm font-bold text-[#102E26]">Missed in your latest test — revise these</h3>
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
          <p className="mt-3 rounded-xl border border-[#FFB800] bg-[#FFFBF2] px-3 py-2 text-sm">
            <strong>Unfinished test:</strong> {unfinishedTest.results.length} of{' '}
            {unfinishedTest.questions.length} questions answered.{' '}
            <Link href="/hifz/test" className="font-semibold text-[#1FA36B] underline">
              Resume it →
            </Link>
          </p>
        )}
        <Link href="/hifz/test" className="mt-3 inline-block font-semibold text-[#1FA36B] underline">
          Open Test Mode →
        </Link>
      </section>

        </div>
      )}

      {tab === 'activity' && (
        <div className="space-y-6" role="tabpanel" aria-label="Activity">
          <StreakCard streak={streak} longestStreak={longestStreak} activity={activity} />

      {/* Add Session — off-platform session / streak restore (screenshot 7) */}
      <section aria-labelledby="add-session-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="add-session-heading" className="text-xl font-bold text-[#102E26]">{t('prog.addSession')}</h2>
          <span className="rounded-full bg-[#57D798] px-3 py-1 text-xs font-bold text-[#102E26]">+ ADD SESSION</span>
        </div>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Read or recited away from the app — from a printed mushaf, in class, with a teacher?
          Log it here. A session for yesterday restores a missed day&apos;s streak.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-[#5b6b62]">
            {t('prog.date')}
            <input
              type="date"
              value={addDate}
              onChange={(e) => setAddDate(e.target.value)}
              className="mt-1 block min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-[#5b6b62]">
            {t('prog.type')}
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value as GoalType)}
              className="mt-1 block min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
            >
              {(Object.keys(GOAL_TYPE_LABELS) as GoalType[]).map((t) => (
                <option key={t} value={t}>{GOAL_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-[#5b6b62]">
            {t('prog.ayahs')}
            <input
              type="number"
              min={1}
              max={6236}
              value={addAyahs}
              onChange={(e) => setAddAyahs(Number(e.target.value) || 1)}
              className="mt-1 block w-20 min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-[#5b6b62]">
            {t('prog.minutesLabel')}
            <input
              type="number"
              min={1}
              max={600}
              value={addMinutes}
              onChange={(e) => setAddMinutes(Number(e.target.value) || 1)}
              className="mt-1 block w-20 min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
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
              <li key={i} className="flex flex-wrap gap-2 rounded-lg bg-[#FFFBF2] px-3 py-2">
                <span className="font-semibold">{sess.date}</span>
                <span>{GOAL_TYPE_LABELS[sess.type as GoalType] ?? sess.type}</span>
                <span className="text-[#5b6b62]">{sess.ayahs} ayahs · {sess.minutes} min</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Stage 6 (§19): session history — memorisation sessions logged by
          hand plus completed tests, newest first. Only what is stored. */}
      <section aria-labelledby="history-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="history-heading" className="text-xl font-bold text-[#102E26]">Session history</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Sessions you logged by hand (Add Session above) and tests you completed. Coach
          practice is recorded ayah by ayah in the activity chart and heatmap above.
        </p>
        {(() => {
          const rows: { at: string; label: string; detail: string; href?: string }[] = [
            ...sessions.map((s) => ({
              at: s.date,
              label: GOAL_TYPE_LABELS[s.type as GoalType] ?? s.type,
              detail: `${s.ayahs} ayahs · ${s.minutes} min`,
            })),
            ...testSessions.map((s) => ({
              at: s.at.slice(0, 10),
              label: `Test — ${s.type}`,
              detail: `${s.score}/${s.total} · ${s.mistakes} ${s.mistakes === 1 ? 'mistake' : 'mistakes'}`,
              href: '/hifz/test',
            })),
          ].sort((a, b) => b.at.localeCompare(a.at));
          if (rows.length === 0) {
            return (
              <p className="mt-2 text-sm text-[#5b6b62]">
                No sessions logged yet. Log a session you did away from the app, or take a test, and it appears here.
              </p>
            );
          }
          return (
            <ul className="mt-3 space-y-1 text-sm">
              {rows.slice(0, 15).map((r, i) => (
                <li key={`${r.at}-${i}`} className="flex flex-wrap gap-2 rounded-lg bg-[#FFFBF2] px-3 py-2">
                  <span className="font-semibold">{r.at}</span>
                  <span>{r.label}</span>
                  <span className="text-[#5b6b62]">{r.detail}</span>
                  {r.href && (
                    <Link href={r.href} className="ml-auto font-semibold text-[#1FA36B] underline">
                      Open
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          );
        })()}
      </section>

      {/* Badges — free achievements earned by practice (§23) */}
      <BadgesGrid snapshot={badgeSnapshot} />

      {/* Weekly challenge + activity heatmap */}
      <section aria-labelledby="challenge-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="challenge-heading" className="text-xl font-bold text-[#102E26]">{t('prog.challenge')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Practise on {WEEK_CHALLENGE_DAYS} days this week — {weekDays} of {WEEK_CHALLENGE_DAYS} done.
          {weekDays >= WEEK_CHALLENGE_DAYS ? ' Challenge complete — well done.' : ' A day counts when you practise any ayah.'}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E5E7EB]" role="progressbar" aria-valuenow={weekDays} aria-valuemin={0} aria-valuemax={WEEK_CHALLENGE_DAYS} aria-label="Weekly challenge progress">
          <div className="h-full rounded-full bg-[#FFB800]" style={{ width: `${Math.min(100, (weekDays / WEEK_CHALLENGE_DAYS) * 100)}%` }} />
        </div>
        <h3 className="mt-6 text-sm font-bold text-[#102E26]">{t('prog.activityHeading')}</h3>
        <p className="mt-1 text-xs text-[#5b6b62]">
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

      {/* Engagement chart — time / ayahs by day, week, month */}
      <section aria-labelledby="engagement-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="engagement-heading" className="text-xl font-bold text-[#102E26]">{t('prog.engagement')}</h2>
          <div className="flex gap-1" role="group" aria-label="Chart range">
            {(['day', 'week', 'month'] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={chartRange === r}
                onClick={() => setChartRange(r)}
                className={`min-h-11 rounded-full px-3 py-1 text-xs font-bold capitalize ${chartRange === r ? 'bg-[#E5E7EB] text-[#102E26]' : 'border border-[#E5E7EB] text-[#5b6b62]'}`}
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
                    <span className="text-[10px] text-[#5b6b62]">{b.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#5b6b62]">
                {t('prog.ayahsPractised')} — {chartRange === 'day' ? t('prog.perDay') : chartRange === 'week' ? t('prog.perWeek') : t('prog.perMonth')}.
                Built from your ayah records — never invented.
              </p>
            </div>
          );
        })()}
      </section>

      {/* Offline coach (§15.10) */}
      <section aria-labelledby="offline-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="offline-heading" className="text-xl font-bold text-[#102E26]">{t('prog.offline')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          {swReady === true
            ? 'Offline support is on — this device can run the coach without internet once the surahs below are saved.'
            : swReady === false
              ? 'Offline support is not active in this browser yet — try reloading, or use a browser that supports service workers.'
              : 'Checking offline support…'}
        </p>
        <p className="mt-2 text-sm text-[#5b6b62]">
          Saving downloads the text of every surah in the whole Quran plus the main pages, so the
          coach works in airplane mode. The AI model itself downloads the first time
          you recite and is cached on this device after that.
        </p>
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
      <section aria-labelledby="export-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="export-heading" className="text-xl font-bold text-[#102E26]">{t('prog.exportHeading')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Progress lives only on this device. Download a copy to keep it safe, or import a copy
          from another device. This is the v1 substitute for accounts. The export includes your
          bookmarks and group challenges when you have any.
        </p>
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
            className="min-h-11 rounded-full border border-[#102E26] px-5 py-2.5 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
          >
            {t('prog.importBtn')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            aria-label="Choose a progress export file"
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
        <div className="space-y-6" role="tabpanel" aria-label="Community">
          {/* My Groups — real local groups only; no global leaderboard exists. */}
          <section aria-labelledby="my-groups-heading" className="t-card rounded-2xl p-5 shadow-sm sm:p-6">
            <h2 id="my-groups-heading" className="text-xl font-bold text-[#102E26]">My Groups</h2>
            <p dir="rtl" lang="ar" className="font-quran mt-3 text-xl leading-relaxed text-[#102E26]">
              وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ
            </p>
            <p className="mt-1 text-sm text-[#5b6b62]">
              &ldquo;And in that let the competitors compete.&rdquo; — Quran 83:26
            </p>
            <p className="mt-2 text-sm text-[#5b6b62]">
              Practise together — invite friends to a group challenge and keep each other going.
            </p>
            {groups.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm">
                {groups.map((g) => (
                  <li key={g.id} className="flex flex-wrap gap-2 rounded-lg bg-[#FFFBF2] px-3 py-2">
                    <span className="font-semibold">{g.name}</span>
                    <span className="text-[#5b6b62]">{g.code} · {g.members.length} {g.members.length === 1 ? 'member' : 'members'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[#5b6b62]">No groups yet — create one below, or join with a code a friend shared.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="#community-join" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#57D798] px-5 py-2 text-sm font-bold text-[#102E26] hover:brightness-105">
                JOIN A GROUP
              </a>
              <a href="#community-create" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#102E26] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]">
                CREATE A GROUP
              </a>
              <Link href="/hifz/challenges" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E5E7EB] px-5 py-2 text-sm font-semibold hover:border-[#1FA36B]">
                Open the full challenges page →
              </Link>
            </div>
            <p className="mt-3 text-xs text-[#5b6b62]">
              Groups live only on this device and in the share links you send — there is no global
              leaderboard here, only the groups you join. The Quran League below is the same: your
              own group&apos;s progress, shared by link.
            </p>
          </section>

          <ChallengesClient />
        </div>
      )}
    </div>
  );
}
