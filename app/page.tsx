// app/page.tsx — Server Component (SSR + ISR). Homepage is the Hifz hub (spec §2).
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import HomeClient from './HomeClient';
import { fetchTimingsByCity, DEFAULT_CITY, DEFAULT_COUNTRY, DEFAULT_METHOD } from './lib/prayer';

export const revalidate = 3600; // ISR: revalidate every hour

export const metadata: Metadata = {
  title: 'Memorise the Quran — AI Recitation Coach & Hifz Plans | I Love Islam',
  description:
    'Recite Quran aloud and get instant word-by-word feedback. Memorise Surah Al-Mulk, Ya-Sin, Al-Kahf and Juz Amma with 7-day and 30-day hifz plans. Free, no sign-up, your audio never leaves your device.',
  metadataBase: new URL('https://www.iloveislam.life'),
  keywords:
    'memorise quran, hifz, quran memorisation, recitation coach, surah al-mulk, surah ya-sin, surah al-kahf, juz amma, ayat al-kursi, learn quran, islamic tools',
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
    title: 'Memorise the Quran — AI Recitation Coach & Hifz Plans | I Love Islam',
    description:
      'Recite Quran aloud and get instant word-by-word feedback. Memorise Surah Al-Mulk, Ya-Sin, Al-Kahf and Juz Amma with 7-day and 30-day hifz plans. Free, no sign-up.',
    url: 'https://www.iloveislam.life',
    siteName: 'I Love Islam',
    images: [{ url: 'https://www.iloveislam.life/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Memorise the Quran — AI Recitation Coach & Hifz Plans | I Love Islam',
    description:
      'Recite Quran aloud and get instant word-by-word feedback. Memorise Surah Al-Mulk, Ya-Sin, Al-Kahf and Juz Amma with 7-day and 30-day hifz plans. Free, no sign-up.',
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
    'Memorise the Quran with an AI recitation coach: recite aloud and get instant word-by-word feedback, with 7-day and 30-day hifz plans for Surah Al-Mulk, Ya-Sin, Al-Kahf and Juz Amma. Free, no sign-up.',
  featureList:
    'AI Recitation Coach, Hifz Plans, Juz Amma, Dua for This Moment, Quran Reader in Indo-Pak script, Prayer Times, Qibla Finder, Zakat Calculator, Dhikr Counter, 99 Names of Allah, Hijri Calendar, Hadith Search, Hajj Checklist, Ramadan Planner',
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
      {/* Hero — server-rendered, no client JS required to read it (spec §2.1.1). */}
      <section className="relative overflow-hidden bg-[#0B3D2E] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{ backgroundImage: 'url(/hero-pattern.svg)', backgroundSize: '96px 96px' }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:py-14 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p dir="rtl" lang="ar" className="font-quran text-3xl text-[#C9A227] sm:text-4xl">
              تَبٰرَكَ الَّذِىۡ بِيَدِهِ الۡمُلۡكُ
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#C9A227]">
              Surah Al-Mulk 67:1 — Blessed is He in whose hand is dominion
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
              Memorise the Quran, one verse at a time
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
              Recite aloud. Get instant feedback on every word. No account, no app to install.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/hifz/al-mulk?mode=recite"
                className="rounded-full bg-[#C9A227] px-6 py-3 text-sm font-bold text-[#0B3D2E] shadow hover:brightness-110"
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
            <p className="mt-4 text-sm font-semibold text-white/85">
              Free · No sign-up · Your audio never leaves your device
            </p>
          </div>
          <Image
            src="/mosque-silhouette.svg"
            alt=""
            width={420}
            height={170}
            priority
            className="hidden w-[420px] max-w-full shrink-0 opacity-90 lg:block"
          />
        </div>
      </section>
      <HomeClient initialPrayer={initialPrayer} />
      <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 pb-16">
        <div className="rounded-2xl border border-[#0B3D2E]/10 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-xl font-bold text-[#0B3D2E]">Memorise the Quran with I Love Islam</h2>
          <p className="text-sm leading-relaxed text-[#1C2420]/70">
            I Love Islam is a free companion for memorising the Quran: pick a surah, listen to a
            trusted reciter, hide the verse and recite it aloud — the coach follows your recitation
            word by word, on your device, and tells you exactly which words to retry. Follow a
            7-day or 30-day plan for Surah Al-Mulk, Ya-Sin, Al-Kahf, Ar-Rahman, Al-Waqi&apos;ah and
            Al-Fatihah, or work through all 37 short surahs of Juz Amma in 90 days. Your progress,
            streak and mistake log stay on your own device — no account, no sign-up. Alongside the
            hub, the site keeps the daily tools you already use: accurate prayer times, the Quran
            reader in beautiful Indo-Pak script, Dua for This Moment, Qibla finder, zakat
            calculator, dhikr counter and the 99 Names of Allah. Quran text, translation and
            tafsir come from Quran.com; audio from trusted reciters.
          </p>
          <nav aria-label="All tools" className="mt-5 flex flex-wrap gap-2">
            {[
              ['/hifz', 'Hifz Hub — Memorise the Quran'],
              ['/hifz/juz-amma', 'Juz Amma'],
              ['/hifz/plans', 'Hifz Plans'],
              ['/hifz/my-progress', 'My Progress'],
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
