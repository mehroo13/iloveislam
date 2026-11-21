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
  getTypeGoals, setTypeGoalTarget, recordTypeActivity,
  GOAL_TYPE_LABELS, GOAL_TYPE_DESCRIPTIONS, TYPE_GOAL_OPTIONS,
  type GoalType, type HifzProgress, type MistakeEntry, type HifzSettings,
} from '../progress';
import { getSurahById, LAUNCH_SURAHS } from '../surahs';
import ToolIcon from '../../components/ToolIcon';

/** Small SVG progress ring for one per-type daily goal. */
function GoalRing({ done, target }: { done: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={`${done} of ${target} ayahs — ${pct}%`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="#e5e0d3" strokeWidth="7" />
      <circle
        cx="32" cy="32" r={r} fill="none" stroke="#146B4D" strokeWidth="7"
        strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`}
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="36" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0B3D2E">
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
      <div className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm">
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
  const strengths = surahStrength(progress, LAUNCH_SURAHS);
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
    count < 0 ? 'bg-transparent' : count === 0 ? 'bg-[#e5e0d3]' : count <= 1 ? 'bg-[#bcd8c6]' : count <= 3 ? 'bg-[#7fb894]' : 'bg-[#146B4D]';

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
        ...LAUNCH_SURAHS.map(
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

  const clearMistake = (idx: number) => {
    const next = mistakes.filter((_, i) => i !== idx);
    saveMistakes(next);
    setMistakes(next);
  };

  return (
    <div className="space-y-6">
      {notice && (
        <p role="status" className="rounded-xl border border-[#e5e0d3] bg-white px-4 py-3 text-sm text-[#5b6b62]">
          {notice}
        </p>
      )}

      {/* Streak + daily goal */}
      <section aria-labelledby="streak-heading" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#5b6b62]">
            <ToolIcon name="flame" className="h-4 w-4 text-[#C9A227]" /> Streak
          </p>
          <p className="mt-2 text-4xl font-bold text-[#0B3D2E]">{streak}</p>
          <p className="mt-1 text-sm text-[#5b6b62]">
            {streak === 0
              ? 'No active streak — practise today to start one.'
              : streak === 1
                ? 'day in a row'
                : 'days in a row'}
          </p>
        </div>
        <div className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">Daily goal</p>
          <p className="mt-2 text-4xl font-bold text-[#0B3D2E]">
            {minutesToday}<span className="text-lg text-[#5b6b62]"> / {progress.dailyGoalMinutes} min</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e5e0d3]" role="progressbar" aria-valuenow={goalPct} aria-valuemin={0} aria-valuemax={100} aria-label="Daily goal progress">
            <div className="h-full rounded-full bg-[#146B4D]" style={{ width: `${goalPct}%` }} />
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
              className="rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-2 py-1.5 text-sm"
            >
              {DAILY_GOAL_OPTIONS.map((m) => (
                <option key={m} value={m}>{m} minutes</option>
              ))}
            </select>
          </label>
        </div>
        <div className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5b6b62]">Memorised</p>
          <p className="mt-2 text-4xl font-bold text-[#0B3D2E]">{memorised.length}</p>
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

      {/* Per-type daily goals (§15.8) — memorisation, revision, reading separately */}
      <section aria-labelledby="goals-heading" className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="goals-heading" className="text-xl font-bold text-[#0B3D2E]">Today&apos;s goals — by type</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          One goal per kind of practice, in ayahs per day. Coach attempts count toward
          memorisation, test questions toward revision; reading is logged by hand below.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {(Object.keys(GOAL_TYPE_LABELS) as GoalType[]).map((type) => {
            const g = typeGoals[type];
            const met = g.done >= g.target;
            return (
              <div key={type} className="rounded-xl border border-[#e5e0d3] bg-[#F7F5EF] p-4">
                <div className="flex items-center gap-3">
                  <GoalRing done={g.done} target={g.target} />
                  <div className="min-w-0">
                    <p className="font-bold text-[#0B3D2E]">{GOAL_TYPE_LABELS[type]}</p>
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
                      className="rounded-lg border border-[#e5e0d3] bg-white px-2 py-1.5 text-sm"
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
                    className="rounded-full border border-[#146B4D] px-3 py-1.5 text-xs font-semibold text-[#146B4D] hover:bg-[#eaf3ee]"
                  >
                    +1 ayah
                  </button>
                  <button
                    type="button"
                    onClick={() => logType(type, 5)}
                    className="rounded-full border border-[#146B4D] px-3 py-1.5 text-xs font-semibold text-[#146B4D] hover:bg-[#eaf3ee]"
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
      <section aria-labelledby="challenge-heading" className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="challenge-heading" className="text-xl font-bold text-[#0B3D2E]">This week&apos;s challenge</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Practise on {WEEK_CHALLENGE_DAYS} days this week — {weekDays} of {WEEK_CHALLENGE_DAYS} done.
          {weekDays >= WEEK_CHALLENGE_DAYS ? ' Challenge complete — well done.' : ' A day counts when you practise any ayah.'}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e5e0d3]" role="progressbar" aria-valuenow={weekDays} aria-valuemin={0} aria-valuemax={WEEK_CHALLENGE_DAYS} aria-label="Weekly challenge progress">
          <div className="h-full rounded-full bg-[#C9A227]" style={{ width: `${Math.min(100, (weekDays / WEEK_CHALLENGE_DAYS) * 100)}%` }} />
        </div>
        <h3 className="mt-6 text-sm font-bold text-[#0B3D2E]">Your activity — last 12 weeks</h3>
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
      <section aria-labelledby="strength-heading" className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="strength-heading" className="text-xl font-bold text-[#0B3D2E]">Surah strength</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          How strong each surah you have touched is: memorised ayahs count fully, learning
          ayahs count half. Surahs you have never practised are not listed.
        </p>
        {strengths.length === 0 ? (
          <p className="mt-2 text-sm text-[#5b6b62]">
            No strength yet — recite an ayah with the coach and it appears here.{' '}
            <Link href="/hifz/juz-amma" className="font-semibold text-[#146B4D] underline">Start with Juz Amma →</Link>
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {strengths.map((s) => (
              <li key={s.slug}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <Link href={`/hifz/${s.slug}`} className="font-semibold text-[#0B3D2E] hover:underline">
                    {s.name} <span className="font-normal text-[#5b6b62]">· {s.memorised} memorised, {s.learning} learning of {s.ayahCount}</span>
                  </Link>
                  <span className="font-bold text-[#146B4D]">{s.strengthPct}%</span>
                </div>
                <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-[#e5e0d3]" aria-hidden="true">
                  <div className="h-full bg-[#146B4D]" style={{ width: `${(s.memorised / s.ayahCount) * 100}%` }} />
                  <div className="h-full bg-[#7fb894]" style={{ width: `${(s.learning / s.ayahCount) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Revision due — spaced repetition queue */}
      <section aria-labelledby="revision-heading" className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="revision-heading" className="text-xl font-bold text-[#0B3D2E]">Revision due</h2>
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
                <li key={`${item.surah}:${item.ayah}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#F7F5EF] px-3 py-2 text-sm">
                  <span>
                    {surah ? surah.name : `Surah ${item.surah}`} {item.surah}:{item.ayah} ·{' '}
                    {item.status === 'memorised' ? 'memorised' : 'learning'} · last practised{' '}
                    {item.daysSincePractised} {item.daysSincePractised === 1 ? 'day' : 'days'} ago
                  </span>
                  <Link
                    href={surah ? `/hifz/${surah.slug}?mode=recite&ayah=${item.ayah}` : '/hifz'}
                    className="ml-auto font-semibold text-[#146B4D] underline"
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
      <section aria-labelledby="memorised-heading" className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="memorised-heading" className="text-xl font-bold text-[#0B3D2E]">Memorised ayahs</h2>
        {memorised.length === 0 ? (
          <p className="mt-2 text-sm text-[#5b6b62]">
            Nothing memorised yet. Recite an ayah correctly three times in a row and it appears here.{' '}
            <Link href="/hifz/juz-amma" className="font-semibold text-[#146B4D] underline">Start with Juz Amma →</Link>
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
                    className="rounded-full bg-[#eaf3ee] px-3 py-1.5 text-sm font-semibold text-[#146B4D] hover:underline"
                  >
                    {surah ? surah.name : `Surah ${s}`} {key}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Mistake log */}
      <section aria-labelledby="mistakes-heading" className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="mistakes-heading" className="text-xl font-bold text-[#0B3D2E]">Words to retry</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Free tier keeps the last 7 days of mistakes, on this device.
        </p>
        {mistakes.length === 0 ? (
          <p className="mt-2 text-sm text-[#5b6b62]">
            No mistakes logged yet. When the coach hears a word you missed, it appears here with
            the ayah to retry.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {[...mistakes].reverse().slice(0, 50).map((m, i) => {
              const surah = getSurahById(m.surah);
              const idx = mistakes.length - 1 - i;
              return (
                <li key={`${m.surah}:${m.ayah}:${m.word}:${i}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#F7F5EF] px-3 py-2 text-sm">
                  <span dir="rtl" lang="ar" className="font-quran text-lg">{m.word}</span>
                  <span>
                    {surah ? surah.name : `Surah ${m.surah}`} {m.surah}:{m.ayah} · {m.attempts}{' '}
                    {m.attempts === 1 ? 'time' : 'times'}
                    {m.source === 'self-mark' ? ' · self-marked' : ''}
                    {m.heard ? ` · heard as “${m.heard}”` : ''}
                  </span>
                  <span className="ml-auto flex gap-2">
                    {surah && (
                      <Link href={`/hifz/${surah.slug}?mode=recite`} className="font-semibold text-[#146B4D] underline">
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
        )}
      </section>

      {/* Offline coach (§15.10) */}
      <section aria-labelledby="offline-heading" className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="offline-heading" className="text-xl font-bold text-[#0B3D2E]">Offline coach</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          {swReady === true
            ? 'Offline support is on — this device can run the coach without internet once the surahs below are saved.'
            : swReady === false
              ? 'Offline support is not active in this browser yet — try reloading, or use a browser that supports service workers.'
              : 'Checking offline support…'}
        </p>
        <p className="mt-2 text-sm text-[#5b6b62]">
          Saving downloads the text of every launch surah plus the main pages, so the
          coach works in airplane mode. The AI model itself downloads the first time
          you recite and is cached on this device after that.
        </p>
        <button
          type="button"
          onClick={saveForOffline}
          disabled={offlineSaving}
          className="mt-4 rounded-full bg-[#0B3D2E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#146B4D] disabled:opacity-50"
        >
          {offlineSaving ? 'Saving…' : 'Save surahs for offline use'}
        </button>
        {offlineMsg && (
          <p role="status" className="mt-3 text-sm font-semibold text-[#146B4D]">{offlineMsg}</p>
        )}
      </section>

      {/* Export / import */}
      <section aria-labelledby="export-heading" className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="export-heading" className="text-xl font-bold text-[#0B3D2E]">Your progress is yours</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Progress lives only on this device. Download a copy to keep it safe, or import a copy
          from another device. This is the v1 substitute for accounts.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={doExport}
            className="rounded-full bg-[#0B3D2E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#146B4D]"
          >
            Download my progress (.json)
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-full border border-[#0B3D2E] px-5 py-2.5 text-sm font-semibold text-[#0B3D2E] hover:bg-[#eaf3ee]"
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
          <p role="status" className="mt-3 text-sm font-semibold text-[#146B4D]">{importMsg}</p>
        )}
      </section>
    </div>
  );
}
