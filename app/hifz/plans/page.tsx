// app/hifz/plans/page.tsx — all memorisation plans (spec §5.2).
// 7-day and 30-day plans per surah, plus the Juz Amma 90-day plan.
// Every plan is free — no paid tier, no limits.
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_SURAHS } from '../surahs';
import { JUZ_AMMA_90_DAY } from '../plans';
import PlanCard from '../components/PlanCard';
import KhatmPlanCard from '../components/KhatmPlanCard';
import PlansListClient from '../components/PlansListClient';
import { Breadcrumb, Attribution, BackToReader} from '../components/HifzShared';
import { SITE_URL } from '../lib/fetch';

export const metadata: Metadata = {
  title: 'Hifz Plans — 7-Day, 30-Day & 90-Day | I Love Islam',
  description:
    'Memorization plans for every surah: 7-day plans, 30-day plans and the Juz Amma 90-day plan, each paired with the recitation coach.',
  alternates: { canonical: `${SITE_URL}/hifz/plans` },
};

export default function PlansPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pt-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hifz', href: '/hifz' },
          { label: 'Plans' },
        ]}
      />
      <BackToReader />
      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#102E26] sm:text-4xl">Memorization plans</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5b6b62] sm:text-base">
          Every plan pairs each day&apos;s ayahs with the recitation coach, so the plan knows
          whether you recited them correctly. A day is only complete when its ayahs reach
          “learning” or better — no honour-system completion.
        </p>
      </header>

      {/* Khatm — the whole-Quran plan (C2): the Challenges page links
          here, so the plan it promises actually exists. */}
      <section id="khatm" aria-labelledby="khatm-heading" className="mt-8">
        <h2 id="khatm-heading" className="text-2xl font-bold text-[#102E26]">Complete the Quran (Khatm)</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Read the whole Quran in 1, 3, 6, 9 or 12 months — every day names its exact ayahs.
        </p>
        <div className="mt-4 max-w-3xl">
          <KhatmPlanCard />
        </div>
      </section>

      <section aria-labelledby="juz-amma-heading" className="mt-8">
        <h2 id="juz-amma-heading" className="text-2xl font-bold text-[#102E26]">Juz Amma — 90 days</h2>
        <div className="mt-4 max-w-3xl">
          <PlanCard plan={JUZ_AMMA_90_DAY} surahName="Juz Amma" />
        </div>
      </section>

      <section aria-labelledby="surah-plans-heading" className="mt-10">
        <h2 id="surah-plans-heading" className="text-2xl font-bold text-[#102E26]">Per-surah plans</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Every plan is free — 7-day and 30-day plans for all {ALL_SURAHS.length} surahs,
          plus the Juz Amma 90-day plan above.
        </p>
        <div className="mt-4">
          <PlansListClient />
        </div>
      </section>

      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
