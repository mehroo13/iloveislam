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
  type HifzProgress, type MistakeEntry, type HifzSettings,
} from '../progress';
import { getSurahById } from '../surahs';
import ToolIcon from '../../components/ToolIcon';

export default function MyProgressClient() {
  const [progress, setProgress] = useState<HifzProgress | null>(null);
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [settings, setSettings] = useState<HifzSettings | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
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

  const changeGoal = (minutes: number) => {
    const next = setDailyGoal(progress, minutes as 5 | 10 | 15 | 30);
    saveProgress(next);
    setProgress(next);
  };

  const doExport = () => {
    downloadProgressJson(
      `iloveislam-hifz-${today}.json`,
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
