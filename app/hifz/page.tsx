// app/hifz/page.tsx — I Love Islam hub landing (spec §1.1, §2, Tarteel-simple
// redesign 2026-11-21). Server-rendered shell + client progress widget
// (localStorage) + the shared surah list. One screen of choices, not a
// dashboard: continue, surahs, and a single row of links to the rest.
// The translatable chrome lives in HubClient (client component) so this
// page can keep its metadata export.
import type { Metadata } from 'next';
import ProgressWidget from './components/ProgressWidget';
import SurahList from './components/SurahList';
import HubClient, { HubMoreLinks } from './components/HubClient';
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

      <HubClient />

      {/* Continue */}
      <div className="mt-6">
        <ProgressWidget />
      </div>

      {/* Surah list */}
      <div className="mt-6">
        <SurahList />
      </div>

      {/* Everything else — one row of links, not sections */}
      <HubMoreLinks />

      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
