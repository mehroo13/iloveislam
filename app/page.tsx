// app/page.tsx — Server Component (SSR + ISR)
import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const revalidate = 3600; // ISR: revalidate every hour

export const metadata: Metadata = {
  title: 'I Love Islam — Free Islamic Tools for Every Muslim',
  description:
    'Free Islamic tools: Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, HalalScan, Dhikr Counter, Hijri Calendar, Hadith Search and 26+ more. No sign-up. Works worldwide.',
  metadataBase: new URL('https://www.iloveislam.life'),
  keywords:
    'islamic tools, zakat calculator, prayer times, qibla finder, quran reader, halal scanner, dhikr counter, hijri calendar, halal haram checker, free muslim app',
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
    title: 'I Love Islam — Free Islamic Tools',
    description: 'The complete free toolkit for every Muslim. 26+ tools, no sign-up.',
    url: 'https://www.iloveislam.life',
    siteName: 'I Love Islam',
    images: [{ url: 'https://www.iloveislam.life/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'I Love Islam — Free Islamic Tools',
    description: '26+ free Islamic tools. No sign-up required.',
    images: ['https://www.iloveislam.life/og-image.png'],
  },
};

// JSON-LD structured data — server-rendered, great for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'I Love Islam',
  url: 'https://www.iloveislam.life',
  description: 'Free Islamic tools for every Muslim — Zakat, Prayer Times, Qibla, Quran, HalalScan and more.',
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
      <section className="max-w-4xl mx-auto px-4 py-10 pb-16 space-y-8 bg-gray-50">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome to I Love Islam — Your Complete Islamic Toolkit</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            I Love Islam is a comprehensive, free-to-use platform offering over 26 carefully designed Islamic tools to support Muslims in their daily worship, spiritual growth, financial obligations, and practical religious needs. Our mission is simple: to make Islamic practice accessible, accurate, and effortless for every Muslim, regardless of location, language, or technical ability.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Whether you need to calculate your annual Zakat with live gold prices, find accurate prayer times for your city, determine the Qibla direction from anywhere in the world, read the Holy Quran with translation, check if a food product is Halal, count your daily dhikr, search authentic hadith, plan your Ramadan schedule, or prepare for Hajj — everything you need is here in one place, completely free, with no registration required.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Every tool on this platform is built with accuracy, privacy, and ease of use as core principles. We source our data from established Islamic APIs and scholarly databases, all calculations happen locally in your browser (your data never leaves your device), and our interface is designed to work beautifully on any device — from desktop computers to mobile phones. We support 8 languages including English, Arabic, Urdu, French, Turkish, Indonesian, Malay, and Bengali.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Our Most Popular Islamic Tools</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">Zakat Calculator:</strong> Calculate your annual Zakat obligation with precision. Supports gold, silver, cash, investments, and debts. Features live metal prices, multiple currencies, and tola/gram conversion. Based on Hanafi fiqh with clear Nisab thresholds.</p>
            <p><strong className="text-gray-800">Prayer Times:</strong> Get accurate daily salah times for any city worldwide. Choose from multiple calculation methods (ISNA, MWL, Umm al-Qura, and more). Includes a live countdown to the next prayer and supports all five daily prayers plus sunrise.</p>
            <p><strong className="text-gray-800">Qibla Finder:</strong> Find the exact direction to the Kaaba from your current location using GPS or city search. Features a live compass overlay, distance to Makkah calculation, and cardinal direction display.</p>
            <p><strong className="text-gray-800">Quran Reader:</strong> Read the complete Holy Quran with multiple translations. Browse by surah, search by keyword, and access both Arabic text and transliteration. Designed for comfortable reading on any screen size.</p>
            <p><strong className="text-gray-800">HalalScan:</strong> Scan product barcodes, QR codes, or upload photos to instantly check if food items are Halal, Haram, or Mashbooh (doubtful). Features ingredient-by-ingredient analysis with explanations.</p>
            <p><strong className="text-gray-800">Dhikr Counter:</strong> A beautiful digital tasbeeh with preset phrases (SubhanAllah, Alhamdulillah, Allahu Akbar, and more), target tracking, session history, and streak monitoring to help you maintain consistent remembrance of Allah.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Additional Tools for Every Aspect of Muslim Life</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">Finance and Giving:</strong> Beyond Zakat, we offer a Halal Finance Screening tool (check any deal for Riba, Gharar, and Maysir), Islamic Inheritance Calculator (Fara&apos;id distribution), Kaffarah Calculator (expiation for broken oaths and fasts), Sadaqah Tracker (log your charitable giving), and an Islamic Will Generator.</p>
            <p><strong className="text-gray-800">Daily Worship:</strong> Our Dua Generator provides 60+ authentic supplications from Quran and Sunnah with Arabic, transliteration, and translations. The Hadith Search covers six canonical collections. The 99 Names of Allah tool helps you learn and reflect on Asma ul Husna. The Night Recitation player lets you sleep with beautiful Quran recitation.</p>
            <p><strong className="text-gray-800">Travel and Knowledge:</strong> Plan your journey with the Halal Travel Guide, find nearby mosques with the Mosque Finder, prepare for pilgrimage with the Hajj Checklist, discover beautiful Muslim names with the Islamic Names Finder (14,000+ names), and stay informed about Islamic events and dates.</p>
            <p><strong className="text-gray-800">Family:</strong> Our Kids Islamic Corner features 5 fun educational games designed to teach children about Islam in an engaging way. The Eid ul Adha Toolkit helps families prepare for the festival with Qurbani calculations, takbeer audio, and celebration checklists.</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">Why Muslims Trust I Love Islam</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-emerald-700 leading-relaxed">
            <div>
              <p className="font-semibold mb-1">✅ 100% Free Forever</p>
              <p>No subscriptions, no premium tiers, no hidden costs. Every tool is completely free.</p>
            </div>
            <div>
              <p className="font-semibold mb-1">✅ No Registration Required</p>
              <p>Use any tool instantly without creating an account or providing personal information.</p>
            </div>
            <div>
              <p className="font-semibold mb-1">✅ Privacy First</p>
              <p>All calculations happen in your browser. We never collect, store, or sell your data.</p>
            </div>
            <div>
              <p className="font-semibold mb-1">✅ Authentic Sources</p>
              <p>Content sourced from verified Quran databases, authenticated hadith collections, and established Islamic APIs.</p>
            </div>
            <div>
              <p className="font-semibold mb-1">✅ Works Everywhere</p>
              <p>Responsive design works on phones, tablets, and desktops. Supports 8 languages for the global Ummah.</p>
            </div>
            <div>
              <p className="font-semibold mb-1">✅ Always Fast</p>
              <p>Built with modern web technology for instant loading and smooth performance on any connection.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}