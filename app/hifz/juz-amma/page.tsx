// app/hifz/juz-amma/page.tsx — Juz 30 overview (spec §1.1).
// All 37 surahs (78–114) with progress, in "start here" order (shortest first
// for the plan order is on /hifz/plans; here the list is mushaf order).
import type { Metadata } from 'next';
import Link from 'next/link';
import { JUZ_AMMA_SURAHS } from '../surahs';
import { JUZ_AMMA_90_DAY } from '../plans';
import PlanCard from '../components/PlanCard';
import { SurahProgressBar } from '../components/ProgressWidget';
import { Breadcrumb, Attribution, PremiumSection } from '../components/HifzShared';
import { SITE_URL } from '../lib/fetch';

export const metadata: Metadata = {
  title: 'Juz Amma (Juz 30) — Memorise the Short Surahs | Hifz',
  description:
    'Memorise Juz Amma — all 37 short surahs (78–114) with the recitation coach, word-by-word and a 90-day plan. Free, no sign-up.',
  alternates: { canonical: `${SITE_URL}/hifz/juz-amma` },
  openGraph: {
    title: 'Juz Amma (Juz 30) — Memorise the Short Surahs | Hifz',
    description:
      'Memorise Juz Amma — all 37 short surahs with the recitation coach and a 90-day plan. Free, no sign-up.',
    url: `${SITE_URL}/hifz/juz-amma`,
    siteName: 'Hifz',
    type: 'website',
  },
};

export default function JuzAmmaPage() {
  const totalAyahs = JUZ_AMMA_SURAHS.reduce((sum, s) => sum + s.ayahCount, 0);
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pt-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hifz', href: '/hifz' },
          { label: 'Juz Amma' },
        ]}
      />
      <header className="mt-4 rounded-2xl bg-[#0B3D2E] px-5 py-8 text-white shadow-sm sm:px-8 sm:py-10">
        <p dir="rtl" lang="ar" className="font-quran text-4xl text-[#C9A227] sm:text-5xl">جزء عمّ</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Juz Amma — Juz 30</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
          The 37 short surahs every Muslim knows first — {totalAyahs} ayahs in all. Start with
          the shortest, build the habit, and work up to An-Naba. Also available as{' '}
          <Link href="/hifz/juz/30" className="font-semibold text-[#E7D9A8] underline">Juz 30</Link>.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/hifz/al-ikhlas?mode=recite"
            className="rounded-full bg-[#C9A227] px-6 py-3 text-sm font-bold text-[#0B3D2E] hover:brightness-110"
          >
            Start with Al-Ikhlas
          </Link>
          <Link
            href="/hifz/plans"
            className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            See the 90-day plan
          </Link>
        </div>
        <p className="mt-4 text-sm text-white/70">Free · No sign-up · Your audio never leaves your device</p>
      </header>

      <section aria-labelledby="plan-heading" className="mt-8">
        <h2 id="plan-heading" className="text-2xl font-bold text-[#0B3D2E]">The 90-day plan</h2>
        <div className="mt-4 max-w-3xl">
          <PlanCard plan={JUZ_AMMA_90_DAY} surahName="Juz Amma" premium />
        </div>
      </section>

      <section aria-labelledby="surahs-heading" className="mt-10">
        <h2 id="surahs-heading" className="text-2xl font-bold text-[#0B3D2E]">
          All 37 surahs of Juz Amma
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {JUZ_AMMA_SURAHS.map((s) => (
            <article key={s.slug} className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#0B3D2E]">
                    <Link href={`/hifz/${s.slug}`} className="hover:underline">
                      {s.id}. {s.name}
                    </Link>
                  </h3>
                  <p className="text-sm text-[#5b6b62]">
                    {s.meaning} · {s.ayahCount} ayahs · {s.revelation}
                  </p>
                </div>
                <p dir="rtl" lang="ar" className="font-quran shrink-0 text-3xl text-[#146B4D]">{s.arabic}</p>
              </div>
              <div className="mt-4">
                <SurahProgressBar surahId={s.id} ayahCount={s.ayahCount} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/hifz/${s.slug}?mode=recite`} className="rounded-full bg-[#0B3D2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#146B4D]">
                  Recite
                </Link>
                <Link href={`/hifz/${s.slug}`} className="rounded-full border border-[#e5e0d3] px-4 py-2 text-sm font-semibold hover:border-[#146B4D]">
                  Study
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <PremiumSection />
      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
