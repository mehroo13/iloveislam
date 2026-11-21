// app/page.tsx — Server Component (SSR + ISR)
import type { Metadata } from 'next';
import Link from 'next/link';
import HomeClient from './HomeClient';
import { fetchTimingsByCity, DEFAULT_CITY, DEFAULT_COUNTRY, DEFAULT_METHOD } from './lib/prayer';

export const revalidate = 3600; // ISR: revalidate every hour

export const metadata: Metadata = {
  title: 'I Love Islam — Your Daily Companion for Prayer, Quran & Duas',
  description:
    'Your daily companion for prayer, Quran and duas — Dua for This Moment, a Quran reader in beautiful Indo-Pak script, accurate prayer times, Qibla finder, zakat calculator, dhikr counter and the 99 Names of Allah. Free forever, no sign-up.',
  metadataBase: new URL('https://www.iloveislam.life'),
  keywords:
    'islamic tools, dua for this moment, quran reader indopak, prayer times, qibla finder, zakat calculator, dhikr counter, 99 names of allah, hijri calendar, free muslim app',
  authors: [{ name: 'I Love Islam', url: 'https://www.iloveislam.life' }],
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://www.iloveislam.life',
    languages: {
      'en-US': 'https://www.iloveislam.life',
      'x-default': 'https://www.iloveislam.life',
    },
  },
  openGraph: {
    title: 'I Love Islam — Your Daily Companion for Prayer, Quran & Duas',
    description:
      'Your daily companion for prayer, Quran and duas — Dua for This Moment, a Quran reader in beautiful Indo-Pak script, accurate prayer times, Qibla finder, zakat calculator, dhikr counter and the 99 Names of Allah. Free forever, no sign-up.',
    url: 'https://www.iloveislam.life',
    siteName: 'I Love Islam',
    images: [{ url: 'https://www.iloveislam.life/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'I Love Islam — Your Daily Companion for Prayer, Quran & Duas',
    description:
      'Your daily companion for prayer, Quran and duas — Dua for This Moment, a Quran reader in beautiful Indo-Pak script, accurate prayer times, Qibla finder, zakat calculator, dhikr counter and the 99 Names of Allah. Free forever, no sign-up.',
    images: ['https://www.iloveislam.life/og-image.png'],
  },
};

// JSON-LD structured data — server-rendered, great for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'I Love Islam',
  url: 'https://www.iloveislam.life',
  description:
    'Your daily companion for prayer, Quran and duas — Dua for This Moment, a Quran reader in Indo-Pak script, prayer times, Qibla, zakat, dhikr and the 99 Names of Allah.',
  featureList:
    'Dua for This Moment, Quran Reader in Indo-Pak script, Prayer Times, Qibla Finder, Zakat Calculator, Dhikr Counter, 99 Names of Allah, Hijri Calendar, Hadith Search, Hajj Checklist, Ramadan Planner',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://www.iloveislam.life/?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default async function Page() {
  // Server-render today's prayer times (Sydney, Muslim World League) so the
  // homepage prayer card is never blank. If the API is unreachable at
  // render time, HomeClient falls back to its own client-side fetch.
  let initialPrayer = null;
  try {
    initialPrayer = await fetchTimingsByCity(DEFAULT_CITY, DEFAULT_COUNTRY, DEFAULT_METHOD);
  } catch {
    initialPrayer = null;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient initialPrayer={initialPrayer} />
      <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 pb-16">
        <div className="rounded-2xl border border-[#0B3D2E]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-xl font-bold text-[#0B3D2E]">Welcome to I Love Islam — Your Daily Companion</h2>
          <p className="text-sm leading-relaxed text-[#1C2420]/70">
            I Love Islam is a free companion for your daily deen — built around the moments that
            matter most: the next prayer, the right dua for what you are feeling right now, and a
            verse of the Quran to carry with you through the day. Start with accurate prayer times
            for your city and a live countdown to the next salah. Read the Quran in the beautiful
            Indo-Pak script, with reciter audio, translations, tafsir, bookmarks, and a 30-juz
            reading plan. When life brings a moment — joy, worry, gratitude, hardship — Dua for
            This Moment gives you the right authentic dua, with Arabic, transliteration, and
            translation. Everything lives in one place, completely free, with no registration
            required. We source our data from established Islamic APIs and scholarly databases,
            your personal progress stays on your own device, and the interface works beautifully
            on any device.
          </p>
          <nav aria-label="All tools" className="mt-5 flex flex-wrap gap-2">
            {[
              ['/dua-for-this-moment', 'Dua for This Moment'],
              ['/quran', 'Quran Reader'],
              ['/prayer-times', 'Prayer Times'],
              ['/qibla', 'Qibla Finder'],
              ['/zakat', 'Zakat Calculator'],
              ['/dhikr', 'Dhikr Counter'],
              ['/names', '99 Names of Allah'],
              ['/hijri', 'Hijri Calendar'],
              ['/hadith', 'Hadith Search'],
              ['/hajj', 'Hajj Checklist'],
              ['/inheritance', 'Inheritance Calculator'],
              ['/ramadan', 'Ramadan Planner'],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-[#0B3D2E]/15 bg-[#F7F5EF] px-3 py-1.5 text-xs font-semibold text-[#146B4D] transition hover:border-[#C9A227] hover:text-[#0B3D2E]"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </>
  );
}
