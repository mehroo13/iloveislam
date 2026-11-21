// app/hifz/components/PlanCard.tsx — memorisation plan cards (spec §5.2).
// Client component: "Start this plan" writes the active plan to localStorage.
// 30-day plans are Premium in v1 — defined, not billed (spec §3.3/§7):
// the card says so plainly and still lets the user start it free during testing.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { loadProgress, saveProgress, getStorageNotice } from '../progress';
import type { PlanDay, SurahPlan, JuzAmmaPlan } from '../plans';

function DayList({ days, surahSlug }: { days: PlanDay[]; surahSlug?: string }) {
  return (
    <ol className="mt-3 space-y-1.5">
      {days.map((d) => (
        <li key={d.day} className="flex items-baseline gap-2 text-sm">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eaf3ee] text-xs font-bold text-[#146B4D]">
            {d.day}
          </span>
          <span className={d.isReview ? 'font-semibold text-[#146B4D]' : ''}>
            {d.label}
            {d.isReview ? ' · Review' : ''}
          </span>
          {surahSlug && d.startAyah !== null && (
            <Link
              href={`/hifz/${surahSlug}?mode=recite`}
              className="ml-auto shrink-0 text-xs font-semibold text-[#146B4D] underline"
            >
              Recite
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
  premium = false,
}: {
  plan: SurahPlan | JuzAmmaPlan;
  surahSlug?: string;
  surahName?: string;
  premium?: boolean;
}) {
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
      setNotice('Progress could not be saved — browser storage is unavailable.');
    }
  };

  return (
    <article className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold text-[#0B3D2E]">
          {plan.planDays}-day plan{surahName ? ` — ${surahName}` : ' — Juz Amma'}
        </h3>
        {premium && (
          <span className="rounded-full bg-[#F7F5EF] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#5b6b62]">
            Premium · free during testing
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-[#5b6b62]">
        {plan.planDays === 7
          ? 'Six days of new ayahs, then a full review day.'
          : plan.planDays === 30
            ? 'Small daily chunks with review days on days 7, 14, 21 and 30.'
            : 'One short surah every 2–3 days, shortest first, with a weekly review day.'}
      </p>
      <DayList days={plan.days} surahSlug={surahSlug} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={startPlan}
          className="rounded-full bg-[#0B3D2E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
        >
          {started ? 'Plan started — day 1' : 'Start this plan'}
        </button>
        <Link href="/hifz/my-progress" className="text-sm font-semibold text-[#146B4D] underline">
          See my progress
        </Link>
      </div>
      {started && (
        <p role="status" className="mt-3 rounded-lg bg-[#eaf3ee] px-3 py-2 text-sm">
          This is now your active plan. Day 1 is ready on your progress page.
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 text-sm text-[#5b6b62]">{notice}</p>
      )}
    </article>
  );
}
