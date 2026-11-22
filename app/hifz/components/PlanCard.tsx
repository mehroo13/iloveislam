// app/hifz/components/PlanCard.tsx — memorisation plan cards (spec §5.2).
// Client component: "Start this plan" writes the active plan to localStorage.
// Every plan is free — 7-day, 30-day and the Juz Amma 90-day plan.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { loadProgress, saveProgress, getStorageNotice } from '../progress';
import type { PlanDay, SurahPlan, JuzAmmaPlan } from '../plans';
import { useT } from '../lib/i18n';

function DayList({ days, surahSlug }: { days: PlanDay[]; surahSlug?: string }) {
  const t = useT();
  return (
    <ol className="mt-3 space-y-1.5">
      {days.map((d) => (
        <li key={d.day} className="flex items-baseline gap-2 text-sm">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E4FFF2] text-xs font-bold text-[#1FA36B]">
            {d.day}
          </span>
          <span className={d.isReview ? 'font-semibold text-[#1FA36B]' : ''}>
            {d.label}
            {d.isReview ? ` · ${t('common.review')}` : ''}
          </span>
          {surahSlug && d.startAyah !== null && (
            <Link
              href={`/hifz/${surahSlug}?mode=recite`}
              className="ml-auto shrink-0 text-xs font-semibold text-[#1FA36B] underline"
            >
              {t('common.recite')}
            </Link>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function PlanCard({
  plan,
  surahSlug,
  surahName,
}: {
  plan: SurahPlan | JuzAmmaPlan;
  surahSlug?: string;
  surahName?: string;
}) {
  const t = useT();
  const [started, setStarted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const startPlan = () => {
    try {
      const progress = loadProgress();
      const next = {
        ...progress,
        activePlan: {
          surahSlug: surahSlug ?? 'juz-amma',
          planDays: plan.planDays,
          startedAt: new Date().toISOString(),
          currentDay: 1,
        },
      };
      saveProgress(next);
      setStarted(true);
      const n = getStorageNotice();
      if (n) setNotice(n);
    } catch {
      setNotice(t('plan.saveFailed'));
    }
  };

  return (
    <article className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold text-[#102E26]">
          {plan.planDays === 7 ? t('plan.7day') : plan.planDays === 30 ? t('plan.30day') : t('plan.90day')}{surahName ? ` — ${surahName}` : ` — ${t('hub.juzAmma')}`}
        </h3>
      </div>
      <p className="mt-1 text-sm text-[#5b6b62]">
        {plan.planDays === 7
          ? t('plan.desc7')
          : plan.planDays === 30
            ? t('plan.desc30')
            : t('plan.desc90')}
      </p>
      <DayList days={plan.days} surahSlug={surahSlug} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={startPlan}
          className="rounded-full bg-[#102E26] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
        >
          {started ? t('plan.started') : t('plan.start')}
        </button>
        <Link href="/hifz/my-progress" className="text-sm font-semibold text-[#1FA36B] underline">
          {t('plan.seeProgress')}
        </Link>
      </div>
      {started && (
        <p role="status" className="mt-3 rounded-lg bg-[#E4FFF2] px-3 py-2 text-sm">
          {t('plan.activeNow')}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 text-sm text-[#5b6b62]">{notice}</p>
      )}
    </article>
  );
}
