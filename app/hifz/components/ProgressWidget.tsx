// app/hifz/components/ProgressWidget.tsx — "Continue where you left off"
// + per-surah progress bars (spec §2.1.2, §5). Client-only: reads
// localStorage (ili_hifz_v1). Renders a sensible empty state when storage
// is empty or blocked — never a blank gap.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ALL_SURAHS_BY_SLUG, JUZ_AMMA_SURAHS } from '../surahs';
import {
  loadProgress,
  currentStreakCount,
  localDateString,
  isDailyGoalMet,
  ayahsPractisedOn,
  getStorageNotice,
  type HifzProgress,
} from '../progress';
import ToolIcon from '../../components/ToolIcon';
import { useT } from '../lib/i18n';

export function useHifzProgress(): HifzProgress | null {
  const [progress, setProgress] = useState<HifzProgress | null>(null);
  useEffect(() => {
    try {
      setProgress(loadProgress());
    } catch {
      setProgress(null);
    }
    const onFocus = () => {
      try {
        setProgress(loadProgress());
      } catch {
        /* keep existing */
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);
  return progress;
}

/** Memorised fraction for one surah (0–1), from localStorage. */
export function SurahProgressBar({ surahId, ayahCount }: { surahId: number; ayahCount: number }) {
  const t = useT();
  const progress = useHifzProgress();
  const memorised = progress
    ? Object.entries(progress.ayahs).filter(
        ([key, a]) => Number(key.split(':')[0]) === surahId && a.status === 'memorised',
      ).length
    : 0;
  const learning = progress
    ? Object.entries(progress.ayahs).filter(
        ([key, a]) => Number(key.split(':')[0]) === surahId && a.status === 'learning',
      ).length
    : 0;
  const frac = ayahCount > 0 ? memorised / ayahCount : 0;
  return (
    <div>
      <div
        className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]"
        role="progressbar"
        aria-valuenow={memorised}
        aria-valuemin={0}
        aria-valuemax={ayahCount}
        aria-label={`${memorised} ${t('common.of')} ${ayahCount} ${t('common.ayahs')} ${t('prog.memorisedWord')}`}
      >
        <div className="h-full rounded-full bg-[#1FA36B]" style={{ width: `${Math.round(frac * 100)}%` }} />
      </div>
      <p className="mt-1 text-xs text-[#5b6b62]">
        {progress === null
          ? t('prog.savedOnDevice')
          : memorised > 0 || learning > 0
            ? `${memorised} ${t('prog.memorisedWord')} · ${learning} ${t('prog.learning')} · ${ayahCount} ${t('common.ayahs')}`
            : t('prog.notStarted')}
      </p>
    </div>
  );
}

export default function ProgressWidget() {
  const t = useT();
  const progress = useHifzProgress();
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    setNotice(getStorageNotice());
  }, [progress]);

  if (progress === null) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-[#102E26]">{t('prog.startJuz')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          {t('prog.startJuzNote')}
        </p>
        <Link
          href="/hifz/juz-amma"
          className="mt-4 inline-block rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B]"
        >
          {t('prog.startJuz')}
        </Link>
      </div>
    );
  }

  const today = localDateString();
  const streak = currentStreakCount(progress.streak, today);
  const goalMet = isDailyGoalMet(progress, today);
  const practisedToday = ayahsPractisedOn(progress, today);
  const minutesToday = progress.minutesToday.date === today ? progress.minutesToday.minutes : 0;
  const activePlan = progress.activePlan;
  const planSurah = activePlan ? ALL_SURAHS_BY_SLUG[activePlan.surahSlug] : undefined;
  const hasAnything = Object.keys(progress.ayahs).length > 0 || streak > 0 || activePlan !== null;

  if (!hasAnything) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-[#102E26]">{t('prog.startJuz')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          {t('prog.startJuzNote')}
        </p>
        <Link
          href="/hifz/juz-amma"
          className="mt-4 inline-block rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B]"
        >
          {t('prog.startJuz')}
        </Link>
        {notice && <p className="mt-3 text-sm text-[#5b6b62]">{notice}</p>}
      </div>
    );
  }

  // Next ayah: first ayah of the active plan's surah that is not yet memorised,
  // else the first learning ayah, else Juz Amma's first unmemorised surah.
  let nextHref = '/hifz/juz-amma';
  let nextLabel = t('prog.continueJuz');
  if (planSurah) {
    const firstOpen = Array.from({ length: planSurah.ayahCount }, (_, i) => i + 1).find(
      (a) => progress.ayahs[`${planSurah.id}:${a}`]?.status !== 'memorised',
    );
    if (firstOpen) {
      nextHref = `/hifz/${planSurah.slug}?mode=recite`;
      nextLabel = `${t('common.continue')} ${t('common.surah')} ${planSurah.name} — ${t('common.ayah')} ${firstOpen}`;
    } else {
      nextHref = `/hifz/${planSurah.slug}`;
      nextLabel = `${t('common.review')} ${t('common.surah')} ${planSurah.name}`;
    }
  } else {
    const open = JUZ_AMMA_SURAHS.find((s) =>
      Array.from({ length: s.ayahCount }, (_, i) => i + 1).some(
        (a) => progress.ayahs[`${s.id}:${a}`]?.status !== 'memorised',
      ),
    );
    if (open) {
      nextHref = `/hifz/${open.slug}?mode=recite`;
      nextLabel = `${t('common.continue')} ${t('common.surah')} ${open.name} — ${t('hub.juzAmma')}`;
    }
  }

  const memorisedCount = Object.values(progress.ayahs).filter((a) => a.status === 'memorised').length;

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-[#102E26]">{t('prog.continue')}</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFBF2] px-3 py-1 text-sm font-bold text-[#102E26]">
          <ToolIcon name="flame" className="h-4 w-4 text-[#FFB800]" />
          {streak} {streak === 1 ? t('prog.streakOne') : t('prog.streakMany')}
        </span>
      </div>
      <p className="mt-2 text-sm text-[#5b6b62]">
        {memorisedCount} {memorisedCount === 1 ? t('prog.ayahMemorised') : t('prog.ayahsMemorised')} · {practisedToday}{' '}
        {t('prog.practisedTodayWord')} · {Math.round(minutesToday)} {t('common.of')} {progress.dailyGoalMinutes} {t('prog.minutesWord')} {t('common.today')}
        {goalMet ? ` — ${t('prog.dailyGoalMet')}` : '.'}
      </p>
      {activePlan && planSurah && (
        <p className="mt-1 text-sm text-[#5b6b62]">
          {t('prog.activePlanLabel')} {activePlan.planDays} {t('prog.dayPlan')} — {t('common.surah')} {planSurah.name} · {t('common.day')}{' '}
          {activePlan.currentDay}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={nextHref}
          className="rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B]"
        >
          {nextLabel}
        </Link>
        <Link
          href="/hifz/my-progress"
          className="rounded-full border border-[#102E26] px-5 py-2.5 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
        >
          {t('common.myProgress')}
        </Link>
      </div>
      {notice && <p className="mt-3 text-sm text-[#5b6b62]">{notice}</p>}
    </div>
  );
}
