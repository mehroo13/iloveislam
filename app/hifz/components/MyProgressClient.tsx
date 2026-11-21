// app/hifz/components/MyProgressClient.tsx — progress dashboard (spec §5.1).
// Client-only: everything reads localStorage. Guarded throughout — with
// storage off, the page still renders and says so; it never crashes.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  loadProgress, saveProgress, loadMistakes, saveMistakes, loadSettings, saveSettings,
  exportProgress, importProgress, downloadProgressJson,
  currentStreakCount, localDateString, isDailyGoalMet, ayahsPractisedOn,
  getStorageNotice, setDailyGoal, DAILY_GOAL_OPTIONS,
  activityByDate, weekPracticeDays, surahStrength, revisionDue, daysSince,
  getTypeGoals, setTypeGoalTarget, recordTypeActivity, recordMinutes, previousLocalDate,
  GOAL_TYPE_LABELS, GOAL_TYPE_DESCRIPTIONS, TYPE_GOAL_OPTIONS,
  type GoalType, type HifzProgress, type MistakeEntry, type HifzSettings,
} from '../progress';
import { getSurahById, ALL_SURAHS } from '../surahs';
import ToolIcon from '../../components/ToolIcon';

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

export default function MyProgressClient() {
  const [progress, setProgress] = useState<HifzProgress | null>(null);
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [settings, setSettings] = useState<HifzSettings | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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
  // Last-read + favourites (bookmarks), spec §22.4.
  const [lastRead, setLastRead] = useState<{ surah: number; name: string; slug: string; at: number } | null>(null);
  const [bookmarks, setBookmarks] = useState<{ surahNumber: number; verseNumber: number; surahName?: string }[]>([]);
  useEffect(() => {
    try {
      const lr = localStorage.getItem('ili_last_read_v1');
      if (lr) setLastRead(JSON.parse(lr) as { surah: number; name: string; slug: string; at: number });
      const b = localStorage.getItem('quran_bookmarks_v2');
      if (b) setBookmarks(JSON.parse(b) as { surahNumber: number; verseNumber: number; surahName?: string }[]);
    } catch {
      /* ignore */
    }
  }, []);
  // Engagement chart range.
  const [chartRange, setChartRange] = useState<'day' | 'week' | 'month'>('day');

  const reload = useCallback(() => {
    try {
      setProgress(loadProgress());
      setMistakes(loadMistakes());
      setSettings(loadSettings());
      setNotice(getStorageNotice());
    } catch {
      setProgress(null);
      setNotice('Progress could not be loaded — browser storage is unavailable.');
    }
  }, []);

  useEffect(() => {
    reload();
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

  if (progress === null || settings === null) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <p className="text-sm text-[#5b6b62]">Loading your progress…</p>
        {notice && <p className="mt-2 text-sm text-[#5b6b62]">{notice}</p>}
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
  // Per-type daily goals (§15.8): separate targets + counters.
  const typeGoals = getTypeGoals(progress);

  // --- Analytics (spec §15): heatmap, surah strength, revision queue, weekly challenge.
  const activity = activityByDate(progress);
  const weekDays = weekPracticeDays(progress);
  const WEEK_CHALLENGE_DAYS = 5;
  const strengths = surahStrength(progress, ALL_SURAHS);
  const due = revisionDue(progress);

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
      exportProgress(progress, mistakes, settings),
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
      setImportMsg('Progress imported successfully.');
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
        next = {
          ...next,
          streak: {
            count: last === previousLocalDate(addDate) ? next.streak.count + 1 : 1,
            lastActiveDate: addDate,
          },
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

  return (
    <div className="space-y-6">
      {notice && (
        <p role="status" className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#5b6b62]">
          {notice}
        </p>
      )}

      {/* Streak + daily goal */}
      <section aria-labelledby="streak-heading" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#5b6b62]">
            <ToolIcon name="flame" className="h-4 w-4 text-[#FFB800]" /> Streak
          </p>
          <p className="mt-2 text-4xl font-bold text-[#102E26]">{streak}</p>
          <p className="mt-1 text-sm text-[#5b6b62]">
            {streak === 0
              ? 'No active streak — practise today to start one.'
              : streak === 1
                ? 'day in a row'
                : 'days in a row'}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">Daily goal</p>
          <p className="mt-2 text-4xl font-bold text-[#102E26]">
            {minutesToday}<span className="text-lg text-[#5b6b62]"> / {progress.dailyGoalMinutes} min</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E5E7EB]" role="progressbar" aria-valuenow={goalPct} aria-valuemin={0} aria-valuemax={100} aria-label="Daily goal progress">
            <div className="h-full rounded-full bg-[#1FA36B]" style={{ width: `${goalPct}%` }} />
          </div>
          <p className="mt-2 text-sm text-[#5b6b62]">
            {practisedToday} {practisedToday === 1 ? 'ayah' : 'ayahs'} practised today
            {goalMet ? ' — goal met.' : ' — goal not yet met.'}
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm font-medium">
            Goal
            <select
              value={progress.dailyGoalMinutes}
              onChange={(e) => changeGoal(Number(e.target.value))}
              className="rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
            >
              {DAILY_GOAL_OPTIONS.map((m) => (
                <option key={m} value={m}>{m} minutes</option>
              ))}
            </select>
          </label>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">Memorised</p>
          <p className="mt-2 text-4xl font-bold text-[#102E26]">{memorised.length}</p>
          <p className="mt-1 text-sm text-[#5b6b62]">
            {learning.length} {learning.length === 1 ? 'ayah' : 'ayahs'} learning · an ayah counts
            as memorised after 3 correct recitations in a row.
          </p>
          {progress.activePlan && (
            <p className="mt-2 text-sm text-[#5b6b62]">
              Active plan: {progress.activePlan.planDays}-day plan · day {progress.activePlan.currentDay}
            </p>
          )}
        </div>
      </section>

      {/* Add Session — off-platform session / streak restore (screenshot 7) */}
      <section aria-labelledby="add-session-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="add-session-heading" className="text-xl font-bold text-[#102E26]">Add a session</h2>
          <span className="rounded-full bg-[#57D798] px-3 py-1 text-xs font-bold text-[#102E26]">+ ADD SESSION</span>
        </div>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Read or recited away from the app — from a printed mushaf, in class, with a teacher?
          Log it here. A session for yesterday restores a missed day&apos;s streak.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-[#5b6b62]">
            Date
            <input
              type="date"
              value={addDate}
              onChange={(e) => setAddDate(e.target.value)}
              className="mt-1 block rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-[#5b6b62]">
            Type
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value as GoalType)}
              className="mt-1 block rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
            >
              {(Object.keys(GOAL_TYPE_LABELS) as GoalType[]).map((t) => (
                <option key={t} value={t}>{GOAL_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-[#5b6b62]">
            Ayahs
            <input
              type="number"
              min={1}
              max={6236}
              value={addAyahs}
              onChange={(e) => setAddAyahs(Number(e.target.value) || 1)}
              className="mt-1 block w-20 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-[#5b6b62]">
            Minutes
            <input
              type="number"
              min={1}
              max={600}
              value={addMinutes}
              onChange={(e) => setAddMinutes(Number(e.target.value) || 1)}
              className="mt-1 block w-20 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={doAddSession}
            className="rounded-full bg-[#57D798] px-5 py-2 text-sm font-bold text-[#102E26] hover:brightness-105"
          >
            Add session
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

      {/* Engagement chart — time / ayahs by day, week, month */}
      <section aria-labelledby="engagement-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="engagement-heading" className="text-xl font-bold text-[#102E26]">Quran Engagement Time</h2>
          <div className="flex gap-1" role="group" aria-label="Chart range">
            {(['day', 'week', 'month'] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={chartRange === r}
                onClick={() => setChartRange(r)}
                className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${chartRange === r ? 'bg-[#E5E7EB] text-[#102E26]' : 'border border-[#E5E7EB] text-[#5b6b62]'}`}
              >
                {r}
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
              <div className="mt-4 flex h-28 items-end gap-1" role="img" aria-label={`Ayahs practised per ${chartRange}`}>
                {buckets.map((b, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-[#57D798]"
                      style={{ height: `${Math.max(b.value > 0 ? 8 : 2, (b.value / max) * 100)}%` }}
                      title={`${b.label}: ${b.value} ayahs`}
                    />
                    <span className="text-[10px] text-[#5b6b62]">{b.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#5b6b62]">
                Ayahs practised per {chartRange === 'day' ? 'day (last 14 days)' : chartRange === 'week' ? 'week (last 8 weeks)' : 'month (last 6 months)'}.
                Built from your ayah records — never invented.
              </p>
            </div>
          );
        })()}
      </section>

      {/* Memorised map — all 114 surahs */}
      <section aria-labelledby="map-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="map-heading" className="text-xl font-bold text-[#102E26]">Memorised map — all 114 surahs</h2>
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
                title={`${s.name} — ${pct}% strong (${st?.memorised ?? 0} memorised of ${s.ayahCount})`}
                aria-label={`${s.name}, ${pct} percent strong`}
                className="flex h-9 items-center justify-center rounded-md text-xs font-bold text-white"
                style={{ background: bg, color: pct === 0 ? '#5b6b62' : '#fff' }}
              >
                {s.id}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Per-type daily goals (§15.8) — memorisation, revision, reading separately */}
      <section aria-labelledby="goals-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="goals-heading" className="text-xl font-bold text-[#102E26]">Today&apos;s goals — by type</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          One goal per kind of practice, in ayahs per day. Coach attempts count toward
          memorisation, test questions toward revision; reading is logged by hand below.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {(Object.keys(GOAL_TYPE_LABELS) as GoalType[]).map((type) => {
            const g = typeGoals[type];
            const met = g.done >= g.target;
            return (
              <div key={type} className="rounded-xl border border-[#E5E7EB] bg-[#FFFBF2] p-4">
                <div className="flex items-center gap-3">
                  <GoalRing done={g.done} target={g.target} />
                  <div className="min-w-0">
                    <p className="font-bold text-[#102E26]">{GOAL_TYPE_LABELS[type]}</p>
                    <p className="text-sm text-[#5b6b62]">
                      {g.done} / {g.target} ayahs {met ? '— goal met.' : 'today'}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#5b6b62]">{GOAL_TYPE_DESCRIPTIONS[type]}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-[#5b6b62]">
                    Target
                    <select
                      value={g.target}
                      onChange={(e) => changeTypeTarget(type, Number(e.target.value))}
                      className="rounded-lg border border-[#E5E7EB] bg-white px-2 py-1.5 text-sm"
                      aria-label={`${GOAL_TYPE_LABELS[type]} daily target in ayahs`}
                    >
                      {TYPE_GOAL_OPTIONS.map((n) => (
                        <option key={n} value={n}>{n} ayahs</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => logType(type, 1)}
                    className="rounded-full border border-[#1FA36B] px-3 py-1.5 text-xs font-semibold text-[#1FA36B] hover:bg-[#E4FFF2]"
                  >
                    +1 ayah
                  </button>
                  <button
                    type="button"
                    onClick={() => logType(type, 5)}
                    className="rounded-full border border-[#1FA36B] px-3 py-1.5 text-xs font-semibold text-[#1FA36B] hover:bg-[#E4FFF2]"
                  >
                    +5 ayahs
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Weekly challenge + activity heatmap */}
      <section aria-labelledby="challenge-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="challenge-heading" className="text-xl font-bold text-[#102E26]">This week&apos;s challenge</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Practise on {WEEK_CHALLENGE_DAYS} days this week — {weekDays} of {WEEK_CHALLENGE_DAYS} done.
          {weekDays >= WEEK_CHALLENGE_DAYS ? ' Challenge complete — well done.' : ' A day counts when you practise any ayah.'}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E5E7EB]" role="progressbar" aria-valuenow={weekDays} aria-valuemin={0} aria-valuemax={WEEK_CHALLENGE_DAYS} aria-label="Weekly challenge progress">
          <div className="h-full rounded-full bg-[#FFB800]" style={{ width: `${Math.min(100, (weekDays / WEEK_CHALLENGE_DAYS) * 100)}%` }} />
        </div>
        <h3 className="mt-6 text-sm font-bold text-[#102E26]">Your activity — last 12 weeks</h3>
        <p className="mt-1 text-xs text-[#5b6b62]">
          One square per day; darker means more ayahs practised that day. Built from your
          ayah records, so it works on progress saved before this view existed.
        </p>
        <div className="mt-3 flex gap-[3px] overflow-x-auto pb-1" role="img" aria-label={`Activity heatmap, ${Object.keys(activity).length} days practised in the last 12 weeks`}>
          {heatmapWeeks.map((week, wi) => (
            <div key={wi} className="flex shrink-0 flex-col gap-[3px]">
              {week.map((day) => (
                <span
                  key={day.date}
                  title={day.count < 0 ? day.date : `${day.date}: ${day.count} ${day.count === 1 ? 'ayah' : 'ayahs'} practised`}
                  className={`h-3 w-3 rounded-[3px] ${heatColor(day.count)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Surah strength */}
      <section aria-labelledby="strength-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="strength-heading" className="text-xl font-bold text-[#102E26]">Surah strength</h2>
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
                    {s.name} <span className="font-normal text-[#5b6b62]">· {s.memorised} memorised, {s.learning} learning of {s.ayahCount}</span>
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
      <section aria-labelledby="revision-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="revision-heading" className="text-xl font-bold text-[#102E26]">Revision due</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Memory fades on a schedule: a learning ayah is due after 2 days without practice,
          a memorised ayah after 7 days. Oldest first — the weakest memory is the most urgent.
        </p>
        {due.length === 0 ? (
          <p className="mt-2 text-sm text-[#5b6b62]">Nothing due — everything you have practised is fresh.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {due.slice(0, 10).map((item) => {
              const surah = getSurahById(item.surah);
              return (
                <li key={`${item.surah}:${item.ayah}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#FFFBF2] px-3 py-2 text-sm">
                  <span>
                    {surah ? surah.name : `Surah ${item.surah}`} {item.surah}:{item.ayah} ·{' '}
                    {item.status === 'memorised' ? 'memorised' : 'learning'} · last practised{' '}
                    {item.daysSincePractised} {item.daysSincePractised === 1 ? 'day' : 'days'} ago
                  </span>
                  <Link
                    href={surah ? `/hifz/${surah.slug}?mode=recite&ayah=${item.ayah}` : '/hifz'}
                    className="ml-auto font-semibold text-[#1FA36B] underline"
                  >
                    Revise now →
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {due.length > 10 && (
          <p className="mt-2 text-sm text-[#5b6b62]">{due.length - 10} more due after these.</p>
        )}
      </section>

      {/* Memorised ayahs */}
      <section aria-labelledby="memorised-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="memorised-heading" className="text-xl font-bold text-[#102E26]">Memorised ayahs</h2>
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
                    className="rounded-full bg-[#E4FFF2] px-3 py-1.5 text-sm font-semibold text-[#1FA36B] hover:underline"
                  >
                    {surah ? surah.name : `Surah ${s}`} {key}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Continue where you left off + favourites */}
      {(lastRead || bookmarks.length > 0) && (
        <section aria-labelledby="continue-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
          {lastRead && (
            <>
              <h2 id="continue-heading" className="text-xl font-bold text-[#102E26]">Continue where you left off</h2>
              <p className="mt-1 text-sm text-[#5b6b62]">
                Last read: <strong>{lastRead.name}</strong> —{' '}
                {new Date(lastRead.at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.
              </p>
              <Link href={`/hifz/${lastRead.slug}`} className="mt-3 inline-block rounded-full bg-[#57D798] px-4 py-2 text-sm font-bold text-[#102E26] hover:brightness-105">
                Continue reading {lastRead.name} →
              </Link>
            </>
          )}
          {bookmarks.length > 0 && (
            <div className={lastRead ? 'mt-5' : ''}>
              <h3 className="text-sm font-bold text-[#102E26]">Favourites — your bookmarks</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {bookmarks.slice(0, 10).map((b, i) => {
                  const bs = getSurahById(b.surahNumber);
                  return (
                    <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-[#FFFBF2] px-3 py-2">
                      <span>{bs ? bs.name : b.surahName ?? `Surah ${b.surahNumber}`} {b.surahNumber}:{b.verseNumber}</span>
                      {bs && (
                        <Link href={`/hifz/${bs.slug}?ayah=${b.verseNumber}`} className="ml-auto font-semibold text-[#1FA36B] underline">
                          Open →
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
              {bookmarks.length > 10 && (
                <p className="mt-2 text-xs text-[#5b6b62]">Showing 10 of {bookmarks.length} bookmarks.</p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Mistake log — filters, weak-spots ranking, practice-my-mistakes */}
      <section aria-labelledby="mistakes-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="mistakes-heading" className="text-xl font-bold text-[#102E26]">Words to retry</h2>
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
              className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${mistakeFilter === f ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] hover:border-[#1FA36B]'}`}
            >
              {f === 'all' ? 'All mistakes' : f === 'incorrect' ? 'Incorrect words' : 'Missed words'}
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
            {/* Weak spots — ranked by how often each word was missed */}
            {(() => {
              const byWord = new Map<string, { word: string; surah: number; ayah: number; attempts: number; heard?: string }>();
              for (const m of mistakes) {
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
                  <h3 className="text-sm font-bold text-[#102E26]">Weak spots — your most-missed words</h3>
                  <ul className="mt-2 space-y-2">
                    {ranked.map((w) => {
                      const surah = getSurahById(w.surah);
                      return (
                        <li key={`${w.surah}:${w.ayah}:${w.word}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#FFFBF2] px-3 py-2 text-sm">
                          <span dir="rtl" lang="ar" className={`font-quran text-lg ${wash(w.attempts)}`}>{w.word}</span>
                          <span>
                            {surah ? surah.name : `Surah ${w.surah}`} {w.surah}:{w.ayah} · missed {w.attempts} {w.attempts === 1 ? 'time' : 'times'}
                            {w.heard ? ` · heard as “${w.heard}”` : ''}
                          </span>
                          <span className="text-xs text-[#5b6b62]">
                            {Math.max(0, 3 - Math.min(3, w.attempts))} more correct recitations to clear
                          </span>
                          {surah && (
                            <Link href={`/hifz/${surah.slug}?mode=recite&ayah=${w.ayah}`} className="ml-auto font-semibold text-[#1FA36B] underline">
                              Practise this word →
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <Link
                    href="/hifz/test"
                    className="mt-3 inline-block rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
                  >
                    Practise my mistakes — Weakest Link test →
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
                  return (
                    <li key={`${m.surah}:${m.ayah}:${m.word}:${i}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#FFFBF2] px-3 py-2 text-sm">
                      <span dir="rtl" lang="ar" className="font-quran text-lg">{m.word}</span>
                      <span>
                        {surah ? surah.name : `Surah ${m.surah}`} {m.surah}:{m.ayah} · {m.attempts}{' '}
                        {m.attempts === 1 ? 'time' : 'times'}
                        {m.source === 'self-mark' ? ' · self-marked' : ''}
                        {m.heard ? ` · heard as “${m.heard}”` : ''}
                      </span>
                      <span className="ml-auto flex gap-2">
                        {surah && (
                          <Link href={`/hifz/${surah.slug}?mode=recite`} className="font-semibold text-[#1FA36B] underline">
                            Retry
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => clearMistake(idx)}
                          className="font-semibold text-red-700 underline"
                        >
                          Clear
                        </button>
                      </span>
                    </li>
                  );
                })}
            </ul>
          </>
        )}
      </section>

      {/* Offline coach (§15.10) */}
      <section aria-labelledby="offline-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="offline-heading" className="text-xl font-bold text-[#102E26]">Offline coach</h2>
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
          {offlineSaving ? 'Saving…' : 'Save surahs for offline use'}
        </button>
        {offlineMsg && (
          <p role="status" className="mt-3 text-sm font-semibold text-[#1FA36B]">{offlineMsg}</p>
        )}
      </section>

      {/* Export / import */}
      <section aria-labelledby="export-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="export-heading" className="text-xl font-bold text-[#102E26]">Your progress is yours</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Progress lives only on this device. Download a copy to keep it safe, or import a copy
          from another device. This is the v1 substitute for accounts.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={doExport}
            className="rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B]"
          >
            Download my progress (.json)
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-full border border-[#102E26] px-5 py-2.5 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
          >
            Import progress
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
  );
}
