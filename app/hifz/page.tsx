// app/hifz/page.tsx — I Love Islam hub landing (spec §1.1, §2, Tarteel-simple
// redesign 2026-11-21). Server-rendered shell + client progress widget
// (localStorage) + the shared surah list. One screen of choices, not a
// dashboard: continue, surahs, and a single row of links to the rest.
import type { Metadata } from 'next';
import Link from 'next/link';
import ProgressWidget from './components/ProgressWidget';
import SurahList from './components/SurahList';
import { Breadcrumb, Attribution} from './components/HifzShared';
import { SITE_URL } from './lib/fetch';

export const metadata: Metadata = {
  title: 'Memorise the Quran — Hifz Hub | I Love Islam',
  description:
    'Recite Quran aloud and get instant word-by-word feedback. Memorise the whole Quran — all 114 surahs and all 30 juz — with 7-day and 30-day hifz plans. Free, no sign-up.',
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
      'Recite Quran aloud and get instant word-by-word feedback. Memorise the whole Quran — all 114 surahs and all 30 juz — with 7-day and 30-day hifz plans.',
  };
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Hifz' }]} />

      <header className="mt-4 text-center">
        <p dir="rtl" lang="ar" className="font-quran text-3xl text-[#FFB800] sm:text-4xl">
          خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#102E26] sm:text-4xl">
          Memorise the Quran, one verse at a time
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#5b6b62] sm:text-base">
          Recite aloud. Get instant feedback on every word. No account, no app to install.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/hifz/recite"
            className="rounded-full bg-[#57D798] px-6 py-3 text-sm font-bold text-[#102E26] hover:brightness-105"
          >
            Start reciting
          </Link>
        </div>
      </header>

      {/* New Goal hero — dark green card, intention first (screenshot style,
          our own words and mark). */}
      <section aria-labelledby="new-goal-heading" className="mt-6 overflow-hidden rounded-2xl bg-[#102E26] text-white shadow-sm">
        <div className="p-5 sm:p-6">
          <h2 id="new-goal-heading" className="text-2xl font-bold">Bismillah — let&apos;s set your intention.</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80">
            Pick a portion, a pace and a deadline, and the app builds your daily plan.
            Small and steady beats big and rare.
          </p>
          <p className="mt-4 border-t border-white/15 pt-4 text-sm italic text-white/70">
            “The most beloved deeds to Allah are the most consistent, even if they are small.”
            <span className="mt-1 block text-xs not-italic text-white/50">Sahih al-Bukhari</span>
          </p>
          <Link
            href="/hifz/goals"
            className="mt-5 block rounded-full bg-[#57D798] py-3 text-center text-sm font-bold text-[#102E26] hover:brightness-105"
          >
            Start a custom goal
          </Link>
        </div>
      </section>

      {/* Suggestions — horizontal scroll cards */}
      <section aria-labelledby="suggestions-heading" className="mt-6">
        <h2 id="suggestions-heading" className="text-lg font-bold text-[#102E26]">Suggestions</h2>
        <p className="text-sm text-[#5b6b62]">Try one of these to get started quickly.</p>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {[
            { href: '/hifz/plans', label: 'Complete the Quran', note: 'A full khatm, one daily portion at a time' },
            { href: '/hifz/goals?preset=kahf', label: 'Surah Al-Kahf every Friday', note: 'Recite it weekly, from memory' },
            { href: '/hifz/juz-amma', label: 'Juz Amma', note: '37 short surahs — the beginner path' },
            { href: '/hifz/memorize', label: 'Memorise a page a day', note: 'Hide the words, recite, repeat' },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="w-52 shrink-0 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm hover:border-[#57D798]"
            >
              <span className="block font-bold text-[#102E26]">{c.label}</span>
              <span className="mt-1 block text-sm text-[#5b6b62]">{c.note}</span>
              <span className="mt-3 block text-sm font-bold text-[#1FA36B]">Start →</span>
            </Link>
          ))}
        </div>
      </section>

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
        <h2 id="more-heading" className="text-xl font-bold text-[#102E26]">More</h2>
        <ul className="mt-3 divide-y divide-[#E5E7EB] rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          {MORE_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 hover:bg-[#FFFBF2]">
                <span className="min-w-0">
                  <span className="block font-semibold text-[#102E26]">{l.label}</span>
                  <span className="block truncate text-sm text-[#5b6b62]">{l.note}</span>
                </span>
                <span aria-hidden="true" className="shrink-0 font-bold text-[#1FA36B]">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
