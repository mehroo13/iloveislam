// app/page.tsx — Server Component (SSR + ISR). Homepage is the Hifz app
// (spec §2, refocus §14, Tarteel-simple redesign 2026-11-21): a slim hero
// with one primary action, then the coach entry, Continue, and the surah
// list in HomeClient. No dashboard of sections.
import type { Metadata } from 'next';
import Link from 'next/link';
import HomeClient from './HomeClient';
import { SITE_DESCRIPTION, SITE_TITLE } from './layout';

export const revalidate = 3600; // ISR: revalidate every hour

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  metadataBase: new URL('https://www.iloveislam.life'),
  keywords:
    'memorise quran, hifz, quran memorisation, recitation coach, surah al-mulk, surah ya-sin, surah al-kahf, juz amma, ayat al-kursi, learn quran, quran test mode, voice search quran',
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
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: 'https://www.iloveislam.life',
    siteName: 'I Love Islam',
    images: [{ url: 'https://www.iloveislam.life/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Memorise the Quran with an AI Recitation Coach' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['https://www.iloveislam.life/optimized/og-image.webp'],
  },
};

// NOTE (2026-11-21 SEO fix): the site-wide WebSite/Organization/WebApplication
// JSON-LD lives in app/layout.tsx. A second WebSite block used to live here
// with a SearchAction pointing at /?q= — removed, because the search page
// does not exist and duplicate WebSite entities confuse rich-result parsers.

export default function Page() {
  return (
    <>
      {/* Hero — server-rendered, one primary action (spec §2.1.1).
          Tarteel-clean restyle 2026-11-23: light-grey section with a white
          card, dark text, green accents — same copy, CTAs and routes. */}
      <section className="bg-[#F4F5F7]">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <div className="rounded-2xl border border-[#E8EAED] bg-white px-4 py-10 text-center shadow-sm sm:py-12">
            <p dir="rtl" lang="ar" className="font-quran text-3xl text-[#1FA36B] sm:text-4xl">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-[#111827] sm:text-5xl">
              Memorise the Quran with AI
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#6B7280] sm:text-base">
              Recite aloud. Get instant feedback on every word. No account, no app to install.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/hifz/recite"
                className="rounded-full bg-[#57D798] px-6 py-3 text-sm font-bold text-[#102E26] shadow hover:brightness-110"
              >
                Start reciting
              </Link>
              <Link
                href="/hifz"
                className="rounded-full border border-[#E8EAED] bg-white px-6 py-3 text-sm font-semibold text-[#111827] hover:bg-[#F4F5F7]"
              >
                Browse all 114 surahs
              </Link>
            </div>
            <p className="mt-5 text-sm font-bold text-[#1FA36B]">Free forever. No sign-up.</p>
            <p className="mt-1 text-xs text-[#6B7280]">
              6,236 ayahs · 114 surahs · 604 Mushaf pages · 104 translations — everything free.
            </p>
          </div>
        </div>
      </section>
      <HomeClient />
      <section className="bg-[#F4F5F7] pb-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-2xl border border-[#E8EAED] bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-bold text-[#111827]">Memorise the Quran with Hifz</h2>
            <p className="text-sm leading-relaxed text-[#6B7280]">
              Hifz is a free AI companion for memorising the Quran: pick a surah, listen to a
              trusted reciter, hide the verse and recite it aloud — the coach follows your
              recitation word by word, on your device, and tells you exactly which words to
              retry. Follow a 7-day or 30-day plan, test yourself in Test Mode, find any ayah
              by reciting it with Voice Search, or take on a group challenge with family and
              friends. Your progress, streak and mistake log stay on your own device — no
              account, no sign-up. Quran text, translation and tafsir come from Quran.com;
              audio from trusted reciters.
            </p>
          <nav aria-label="Hifz pages" className="mt-5 flex flex-wrap gap-2">
            {[
              ['/hifz', 'Hifz Hub — Memorise the Quran'],
              ['/hifz/recite', 'Recite with the Coach'],
              ['/hifz/test', 'Test Mode'],
              ['/hifz/voice-search', 'Voice Search'],
              ['/hifz/challenges', 'Group Challenges'],
              ['/hifz/juz-amma', 'Juz Amma'],
              ['/hifz/plans', 'Hifz Plans'],
              ['/hifz/my-progress', 'My Progress'],
              ['/hifz/al-mulk', 'Surah Al-Mulk'],
              ['/hifz/ya-sin', 'Surah Ya-Sin'],
              ['/hifz/al-kahf', 'Surah Al-Kahf'],
              ['/hifz/ayat-al-kursi', 'Ayat al-Kursi'],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-[#E8EAED] bg-[#F4F5F7] px-3 py-1.5 text-xs font-semibold text-[#1FA36B] transition hover:border-[#57D798] hover:text-[#111827]"
              >
                {label}
              </Link>
            ))}
          </nav>
          </div>
        </div>
      </section>
    </>
  );
}
