// app/hifz/components/KhatmPlanCard.tsx — the whole-Quran (Khatm) plan
// (C2, 2026-11-26). The Challenges page promises a Khatm plan — read
// the whole Quran in 1, 3, 6, 9 or 12 months — and this is it: the
// 6,236 ayahs split into near-equal daily chunks (buildKhatmPlan in
// app/hifz/plans.ts), each day naming its exact surah + ayah range
// with a Recite link to that day's starting ayah. "Start this plan"
// stores it on this device (ili_khatm_plan_v1); the day list shows
// the first 7 days, the rest behind a "Show all days" toggle so a
// 12-month plan (360 days) does not render 360 rows on load.
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ALL_SURAHS } from '../surahs';
import { buildKhatmPlan, KHATM_MONTHS, type KhatmMonths } from '../plans';
import { useT } from '../lib/i18n';

const KHATM_KEY = 'ili_khatm_plan_v1';

export default function KhatmPlanCard() {
  const t = useT();
  const [months, setMonths] = useState<KhatmMonths>(3);
  const [started, setStarted] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const plan = useMemo(() => buildKhatmPlan(months), [months]);
  const visibleDays = showAll ? plan.days : plan.days.slice(0, 7);

  const startPlan = () => {
    try {
      localStorage.setItem(
        KHATM_KEY,
        JSON.stringify({ months, startedAt: new Date().toISOString(), currentDay: 1 }),
      );
      setStarted(true);
    } catch {
      /* storage unavailable — the plan itself still shows */
    }
  };

  return (
    <article className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-[#102E26]">
        Khatm — the whole Quran in {months} {months === 1 ? 'month' : 'months'}
      </h3>
      <p className="mt-1 text-sm text-[#5b6b62]">
        {plan.totalAyahs.toLocaleString()} ayahs over {plan.totalDays} days — about{' '}
        {plan.ayahsPerDay} ayahs a day. Every day names its exact ayahs, with a Recite link
        to the coach.
      </p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Khatm length">
        {KHATM_MONTHS.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={months === m}
            onClick={() => {
              setMonths(m);
              setStarted(false);
              setShowAll(false);
            }}
            className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${
              months === m ? 'bg-[#102E26] text-white' : 'border border-[#E8EAED]'
            }`}
          >
            {m} {m === 1 ? 'month' : 'months'}
          </button>
        ))}
      </div>
      <ol className="mt-3 space-y-1.5">
        {visibleDays.map((d) => {
          const slug = ALL_SURAHS[d.startSurahId - 1]?.slug ?? 'al-fatihah';
          return (
            <li key={d.day} className="flex items-baseline gap-2 text-sm">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E4FFF2] text-xs font-bold text-[#1FA36B]">
                {d.day}
              </span>
              <span>{d.label}</span>
              <Link
                href={`/hifz/${slug}?mode=recite&ayah=${d.startAyah}`}
                className="ml-auto inline-block shrink-0 py-1 text-xs font-semibold text-[#1FA36B] underline"
              >
                {t('common.recite')}
              </Link>
            </li>
          );
        })}
      </ol>
      {plan.days.length > 7 && (
        <button
          type="button"
          aria-expanded={showAll}
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-sm font-semibold text-[#1FA36B] underline"
        >
          {showAll ? 'Show fewer days' : `Show all ${plan.days.length} days`}
        </button>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={startPlan}
          className="min-h-11 rounded-full bg-[#102E26] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
        >
          {started ? t('plan.started') : t('plan.start')}
        </button>
        <Link href="/hifz/my-progress" className="inline-block py-1 text-sm font-semibold text-[#1FA36B] underline">
          {t('plan.seeProgress')}
        </Link>
      </div>
      {started && (
        <p role="status" className="mt-3 rounded-lg bg-[#E4FFF2] px-3 py-2 text-sm">
          {t('plan.activeNow')}
        </p>
      )}
    </article>
  );
}
