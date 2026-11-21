// app/hifz/page.tsx — Hifz hub landing (spec §1.1, §2 applied to the hub).
// Server-rendered shell + client progress widget (localStorage).
import type { Metadata } from 'next';
import Link from 'next/link';
import { LAUNCH_SURAHS, NAMED_LAUNCH_SURAHS, JUZ_AMMA_SURAHS } from './surahs';
import { getPlan } from './plans';
import ProgressWidget, { SurahProgressBar } from './components/ProgressWidget';
import PlanCard from './components/PlanCard';
import { JUZ_AMMA_90_DAY } from './plans';
import ToolIcon from '../components/ToolIcon';
import { Breadcrumb, Attribution, PremiumSection } from './components/HifzShared';
import { SITE_URL } from './lib/fetch';

export const metadata: Metadata = {
  title: 'Memorise the Quran — Hifz Hub | I Love Islam',
  description:
    'Recite Quran aloud and get instant word-by-word feedback. Memorise Surah Al-Mulk, Ya-Sin, Al-Kahf and Juz Amma with 7-day and 30-day hifz plans. Free, no sign-up.',
  alternates: { canonical: `${SITE_URL}/hifz` },
  openGraph: {
    title: 'Memorise the Quran — Hifz Hub | I Love Islam',
    description:
      'Recite Quran aloud and get instant word-by-word feedback. Memorise with 7-day and 30-day hifz plans. Free, no sign-up.',
    url: `${SITE_URL}/hifz`,
    siteName: 'I Love Islam',
    type: 'website',
  },
};

const HOW_IT_WORKS = [
  { icon: 'ear', title: 'Listen', text: 'Hear the ayah from a trusted reciter, as many times as you need.' },
  { icon: 'hide', title: 'Hide', text: 'Hide the Arabic and keep the translation as a prompt.' },
  { icon: 'mic', title: 'Recite', text: 'Recite aloud into your microphone — audio never leaves your device.' },
  { icon: 'check', title: 'Feedback', text: 'See every word marked correct, not heard, or to check — then retry.' },
];

export default function HifzHubPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Memorise the Quran — Hifz Hub',
    url: `${SITE_URL}/hifz`,
    description:
      'Recite Quran aloud and get instant word-by-word feedback. Memorise Surah Al-Mulk, Ya-Sin, Al-Kahf and Juz Amma with 7-day and 30-day hifz plans.',
  };
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Hifz' }]} />

      <section className="mt-4 rounded-2xl bg-[#0B3D2E] px-5 py-8 text-white shadow-sm sm:px-8 sm:py-10">
        <p dir="rtl" lang="ar" className="font-quran text-3xl text-[#C9A227] sm:text-4xl">
          خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Memorise the Quran, one verse at a time
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
          Recite aloud. Get instant feedback on every word. No account, no app to install.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/hifz/al-mulk?mode=recite"
            className="rounded-full bg-[#C9A227] px-6 py-3 text-sm font-bold text-[#0B3D2E] hover:brightness-110"
          >
            Start reciting — Surah Al-Mulk
          </Link>
          <Link
            href="/hifz/juz-amma"
            className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Browse Juz Amma
          </Link>
        </div>
        <p className="mt-4 text-sm text-white/70">
          Free · No sign-up · Your audio never leaves your device
        </p>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="mt-6">
        <h2 id="how-heading" className="sr-only">How the recitation coach works</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-[#e5e0d3] bg-white p-4 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf3ee] text-[#146B4D]">
                <ToolIcon name={step.icon} className="h-5 w-5" />
              </span>
              <p className="mt-3 font-bold text-[#0B3D2E]">
                {i + 1}. {step.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#5b6b62]">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Continue */}
      <div className="mt-6">
        <ProgressWidget />
      </div>

      {/* Featured surahs */}
      <section aria-labelledby="featured-heading" className="mt-10">
        <h2 id="featured-heading" className="text-2xl font-bold text-[#0B3D2E]">Featured surahs</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Start with the surah you already know best — or the one you have always wanted to memorise.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NAMED_LAUNCH_SURAHS.map((s) => {
            const plan = getPlan(s.slug, 7);
            return (
              <article key={s.slug} className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#0B3D2E]">
                      <Link href={`/hifz/${s.slug}`} className="hover:underline">Surah {s.name}</Link>
                    </h3>
                    <p className="text-sm text-[#5b6b62]">
                      {s.meaning} · {s.ayahCount} ayahs · {s.revelation} · Juz {s.juz}
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
                  {plan && (
                    <span className="rounded-full bg-[#F7F5EF] px-3 py-2 text-xs font-bold text-[#5b6b62]">
                      7-day plan
                    </span>
                  )}
                </div>
              </article>
            );
          })}
          <article className="rounded-2xl border border-[#C9A227]/40 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#0B3D2E]">
                  <Link href="/hifz/ayat-al-kursi" className="hover:underline">Ayat al-Kursi</Link>
                </h3>
                <p className="text-sm text-[#5b6b62]">The greatest verse in the Book of Allah · 2:255 · 1 ayah</p>
              </div>
              <p dir="rtl" lang="ar" className="font-quran shrink-0 text-3xl text-[#146B4D]">آية الكرسي</p>
            </div>
            <div className="mt-4">
              <SurahProgressBar surahId={2} ayahCount={1} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/hifz/ayat-al-kursi" className="rounded-full bg-[#0B3D2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#146B4D]">
                Study Ayat al-Kursi
              </Link>
              <span className="rounded-full bg-[#F7F5EF] px-3 py-2 text-xs font-bold text-[#5b6b62]">7-day plan</span>
            </div>
          </article>
          <article className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#0B3D2E]">
                  <Link href="/hifz/juz-amma" className="hover:underline">Juz Amma</Link>
                </h3>
                <p className="text-sm text-[#5b6b62]">Juz 30 · 37 short surahs · 564 ayahs · the beginner path</p>
              </div>
              <p dir="rtl" lang="ar" className="font-quran shrink-0 text-3xl text-[#146B4D]">جزء عمّ</p>
            </div>
            <p className="mt-4 text-sm text-[#5b6b62]">
              Shortest first, one surah every 2–3 days — early wins that build a habit.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/hifz/juz-amma" className="rounded-full bg-[#0B3D2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#146B4D]">
                Browse Juz Amma
              </Link>
              <span className="rounded-full bg-[#F7F5EF] px-3 py-2 text-xs font-bold text-[#5b6b62]">90-day plan</span>
            </div>
          </article>
        </div>
      </section>

      {/* Plans strip */}
      <section aria-labelledby="plans-heading" className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="plans-heading" className="text-2xl font-bold text-[#0B3D2E]">Memorisation plans</h2>
          <Link href="/hifz/plans" className="text-sm font-semibold text-[#146B4D] hover:underline">
            See all plans →
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <PlanCard plan={getPlan('al-mulk', 7)!} surahSlug="al-mulk" surahName="Al-Mulk" />
          <PlanCard plan={JUZ_AMMA_90_DAY} surahName="Juz Amma" premium />
        </div>
        <p className="mt-3 text-sm text-[#5b6b62]">
          Also: memorise Ayat al-Kursi in 7 days, and every launch surah in 30 days —{' '}
          <Link href="/hifz/plans" className="font-semibold text-[#146B4D] underline">all plans</Link>.
        </p>
      </section>

      {/* All launch surahs (internal linking, spec §9.1) */}
      <section aria-labelledby="all-heading" className="mt-10">
        <h2 id="all-heading" className="text-2xl font-bold text-[#0B3D2E]">All launch surahs</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {LAUNCH_SURAHS.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/hifz/${s.slug}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-[#e5e0d3] bg-white px-4 py-3 text-sm shadow-sm hover:border-[#146B4D]"
              >
                <span className="font-semibold text-[#0B3D2E]">
                  {s.id}. {s.name} <span className="font-normal text-[#5b6b62]">· {s.ayahCount} ayahs</span>
                </span>
                <span dir="rtl" lang="ar" className="font-quran text-xl text-[#146B4D]">{s.arabic}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[#5b6b62]">
          {JUZ_AMMA_SURAHS.length} of these are Juz Amma (surahs 78–114).{' '}
          <Link href="/hifz/juz-amma" className="font-semibold text-[#146B4D] underline">
            Start with Juz Amma, the beginner path →
          </Link>
        </p>
      </section>

      <PremiumSection />
      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
