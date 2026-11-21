// app/hifz/page.tsx — Hifz hub landing (spec §1.1, §2, Tarteel-simple
// redesign 2026-11-21). Server-rendered shell + client progress widget
// (localStorage) + the shared surah list. One screen of choices, not a
// dashboard: continue, surahs, and a single row of links to the rest.
import type { Metadata } from 'next';
import Link from 'next/link';
import ProgressWidget from './components/ProgressWidget';
import SurahList from './components/SurahList';
import { Breadcrumb, Attribution, PremiumSection } from './components/HifzShared';
import { SITE_URL } from './lib/fetch';

export const metadata: Metadata = {
  title: 'Memorise the Quran — Hifz Hub | Hifz',
  description:
    'Recite Quran aloud and get instant word-by-word feedback. Memorise Surah Al-Mulk, Ya-Sin, Al-Kahf and Juz Amma with 7-day and 30-day hifz plans. Free, no sign-up.',
  alternates: { canonical: `${SITE_URL}/hifz` },
  openGraph: {
    title: 'Memorise the Quran — Hifz Hub | Hifz',
    description:
      'Recite Quran aloud and get instant word-by-word feedback. Memorise with 7-day and 30-day hifz plans. Free, no sign-up.',
    url: `${SITE_URL}/hifz`,
    siteName: 'Hifz',
    type: 'website',
  },
};

const MORE_LINKS: { href: string; label: string; note: string }[] = [
  { href: '/hifz/test', label: 'Test Mode', note: 'Exam-style recall, Arabic hidden' },
  { href: '/hifz/voice-search', label: 'Voice Search', note: 'Find any ayah by reciting it' },
  { href: '/hifz/challenges', label: 'Group Challenges', note: 'Memorise together, no accounts' },
  { href: '/hifz/plans', label: 'Plans', note: '7-day, 30-day and 90-day plans' },
  { href: '/hifz/juz-amma', label: 'Juz Amma', note: '37 short surahs, the beginner path' },
  { href: '/hifz/my-progress', label: 'My Progress', note: 'Streak, goals, mistakes, offline' },
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
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Hifz' }]} />

      <header className="mt-4 text-center">
        <p dir="rtl" lang="ar" className="font-quran text-3xl text-[#C9A227] sm:text-4xl">
          خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0B3D2E] sm:text-4xl">
          Memorise the Quran, one verse at a time
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#5b6b62] sm:text-base">
          Recite aloud. Get instant feedback on every word. No account, no app to install.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/hifz/al-mulk?mode=recite"
            className="rounded-full bg-[#C9A227] px-6 py-3 text-sm font-bold text-[#0B3D2E] hover:brightness-110"
          >
            Start reciting — Surah Al-Mulk
          </Link>
        </div>
      </header>

      {/* Continue */}
      <div className="mt-6">
        <ProgressWidget />
      </div>

      {/* Surah list */}
      <div className="mt-6">
        <SurahList />
      </div>

      {/* Everything else — one row of links, not sections */}
      <section aria-labelledby="more-heading" className="mt-8">
        <h2 id="more-heading" className="text-xl font-bold text-[#0B3D2E]">More</h2>
        <ul className="mt-3 divide-y divide-[#f0ede4] rounded-2xl border border-[#e5e0d3] bg-white shadow-sm">
          {MORE_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 hover:bg-[#F7F5EF]">
                <span className="min-w-0">
                  <span className="block font-semibold text-[#0B3D2E]">{l.label}</span>
                  <span className="block truncate text-sm text-[#5b6b62]">{l.note}</span>
                </span>
                <span aria-hidden="true" className="shrink-0 font-bold text-[#146B4D]">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <PremiumSection />
      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
