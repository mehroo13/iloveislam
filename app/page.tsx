// app/page.tsx — Server Component (SSR + ISR)
import type { Metadata } from 'next';
import HomeClient from './HomeClient';

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

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
      <section className="max-w-4xl mx-auto px-4 py-10 pb-16 space-y-8 bg-[#F7F5EF]">
        <div className="bg-white rounded-2xl border border-[#0B3D2E]/10 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#0B3D2E] mb-4">Welcome to I Love Islam — Your Daily Companion</h2>
          <p className="text-[#1C2420]/70 text-sm leading-relaxed mb-3">
            I Love Islam is a free, carefully curated companion for your daily deen — built around the moments that matter most: the next prayer, the right dua for what you are feeling right now, and a verse of the Quran to carry with you through the day. Everything lives in one place, completely free, with no registration required.
          </p>
          <p className="text-[#1C2420]/70 text-sm leading-relaxed mb-3">
            Start your day with accurate prayer times for your city and a live countdown to the next salah. Open the Quran reader — set in the beautiful Indo-Pak script, with reciter audio, translations, tafsir, bookmarks, and a 30-juz reading plan. When life brings a moment — joy, worry, gratitude, hardship — Dua for This Moment gives you the right authentic dua, with Arabic, transliteration, and translation.
          </p>
          <p className="text-[#1C2420]/70 text-sm leading-relaxed">
            Every tool on this platform is built with accuracy, privacy, and ease of use as core principles. We source our data from established Islamic APIs and scholarly databases, your personal progress stays on your own device, and our interface is designed to work beautifully on any device — from desktop computers to mobile phones.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#0B3D2E]/10 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#0B3D2E] mb-3">Your Daily Essentials</h3>
          <div className="space-y-3 text-sm text-[#1C2420]/70 leading-relaxed">
            <p><strong className="text-[#1C2420]">Dua for This Moment:</strong> Tell us how you feel or what you are facing, and find the right authentic dua for that exact situation — with Arabic text, transliteration, translation, and its source, so you can learn it and use it with confidence.</p>
            <p><strong className="text-[#1C2420]">Quran Reader:</strong> Read the complete Holy Quran in the familiar Indo-Pak script, with reciter audio, multiple translations, Ibn Kathir tafsir, bookmarks, search, and a 30-juz reading plan to help you finish the Quran at your own pace.</p>
            <p><strong className="text-[#1C2420]">Prayer Times:</strong> Get accurate daily salah times for any city worldwide. Choose from multiple calculation methods (Muslim World League, ISNA, Umm al-Qura, and more), with a live countdown to the next prayer and all five daily prayers plus sunrise.</p>
            <p><strong className="text-[#1C2420]">Qibla Finder:</strong> Find the exact direction to the Kaaba from anywhere in the world, with a live compass, distance to Makkah, and clear cardinal direction.</p>
            <p><strong className="text-[#1C2420]">Zakat Calculator:</strong> Calculate your annual Zakat obligation with precision. Supports gold, silver, cash, investments, and debts, with live metal prices, multiple currencies, and clear Nisab thresholds.</p>
            <p><strong className="text-[#1C2420]">Dhikr Counter:</strong> A beautiful digital tasbeeh with preset phrases (SubhanAllah, Alhamdulillah, Allahu Akbar, and more), target tracking, session history, and streaks to help you maintain consistent remembrance of Allah.</p>
            <p><strong className="text-[#1C2420]">99 Names of Allah:</strong> Explore and reflect on Asma ul Husna — each name with its meaning, so you can learn them one by one and call upon Allah by His beautiful names.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#0B3D2E]/10 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#0B3D2E] mb-3">More Tools for Every Part of Muslim Life</h3>
          <div className="space-y-3 text-sm text-[#1C2420]/70 leading-relaxed">
            <p><strong className="text-[#1C2420]">Finance and Giving:</strong> Beyond Zakat, we offer a Halal Finance Screening tool (check any deal for Riba, Gharar, and Maysir), an Islamic Inheritance Calculator (Fara&apos;id distribution), a Kaffarah Calculator (expiation for broken oaths and fasts), and a Sadaqah Tracker (log your charitable giving).</p>
            <p><strong className="text-[#1C2420]">Daily Worship:</strong> The Hadith Search covers six canonical collections, so you can verify what you hear and study the Sunnah directly. The Night Recitation player lets you fall asleep to beautiful Quran recitation, and the Hijri Calendar keeps you connected to the Islamic dates that shape your year.</p>
            <p><strong className="text-[#1C2420]">Travel and Knowledge:</strong> Plan your journey with the Halal Travel Guide, prepare for pilgrimage with the Hajj Checklist, discover beautiful Muslim names with the Islamic Names Finder, and stay on top of Islamic events and dates with the Ramadan Planner and Eid toolkit.</p>
          </div>
        </div>

        <div className="bg-[#0B3D2E] rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-3">Why Muslims Trust I Love Islam</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-white/75 leading-relaxed">
            <div>
              <p className="font-semibold text-[#C9A227] mb-1">✓ 100% Free Forever</p>
              <p>No subscriptions, no premium tiers, no hidden costs. Every tool is completely free.</p>
            </div>
            <div>
              <p className="font-semibold text-[#C9A227] mb-1">✓ No Registration Required</p>
              <p>Use any tool instantly without creating an account or providing personal information.</p>
            </div>
            <div>
              <p className="font-semibold text-[#C9A227] mb-1">✓ Privacy First</p>
              <p>Your data stays on your device. We never collect, store, or sell your personal information.</p>
            </div>
            <div>
              <p className="font-semibold text-[#C9A227] mb-1">✓ Authentic Sources</p>
              <p>Content sourced from verified Quran databases, authenticated hadith collections, and established Islamic APIs.</p>
            </div>
            <div>
              <p className="font-semibold text-[#C9A227] mb-1">✓ Works Everywhere</p>
              <p>Responsive design works on phones, tablets, and desktops, so your companion is with you wherever you are.</p>
            </div>
            <div>
              <p className="font-semibold text-[#C9A227] mb-1">✓ Always Fast</p>
              <p>Built with modern web technology for instant loading and smooth performance on any connection.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
