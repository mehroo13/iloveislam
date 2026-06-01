import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Islamic Duas — 500+ Authentic Duas from Quran & Sunnah | I Love Islam',
  description:
    'Browse over 500 authentic duas from the Quran and Sunnah with Arabic, transliteration, translations, and references. Free, no sign-up.',
  keywords: [
    'dua', 'islamic dua', 'dua from quran', 'daily dua', 'dua in english', 'dua in urdu',
    'authentic duas', 'supplication', 'islamic prayer', 'free dua app',
  ],
  openGraph: {
    title: 'Islamic Duas — 500+ Authentic Duas from Quran & Sunnah | I Love Islam',
    description: 'Browse over 500 authentic duas from the Quran and Sunnah with Arabic, transliteration, translations, and references. Free, no sign-up.',
    url: 'https://www.iloveislam.life/dua-generator',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Free Islamic Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Islamic Duas — 500+ Authentic Duas from Quran & Sunnah | I Love Islam',
    description: 'Browse over 500 authentic duas from the Quran and Sunnah with Arabic, transliteration, translations, and references. Free, no sign-up.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/dua-generator' },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Dua Generator',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'A curated collection of authentic duas from the Quran and Sahih hadith. Browse by category, search by keyword, and toggle between English and Urdu translations.',
      url: 'https://www.iloveislam.life/dua-generator',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://www.iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 3, name: 'Dua Generator', item: 'https://www.iloveislam.life/dua-generator' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Are these duas authentic?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, all duas are sourced from the Holy Quran, Sahih al‑Bukhari, Sahih Muslim, and other authentic Hadith collections.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I read the duas in English and Urdu?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely. You can toggle between English and Urdu translations at any time. The Arabic text, transliteration, and references are always shown.',
          },
        },
      ],
    },
  ],
};

export default function DuaGeneratorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">The Power of Dua in Islam</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Dua (supplication) is the essence of worship in Islam. It is the direct, personal conversation between a servant and their Lord — no intermediary, no ritual requirement, just a sincere heart calling upon the Creator. The Prophet Muhammad (peace be upon him) said: &quot;Dua is worship&quot; (Abu Dawud) and &quot;Nothing is more honourable to Allah than dua&quot; (Tirmidhi). Allah Himself invites us to call upon Him: &quot;Call upon Me; I will respond to you&quot; (Quran 40:60).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Unlike the five daily prayers which have fixed forms and times, dua can be made at any time, in any language, and in any position. However, there are certain times and conditions when dua is more likely to be accepted: during the last third of the night, between the adhan and iqamah, while prostrating in prayer, on Fridays, during rain, while fasting, and while travelling.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Our Dua Generator provides a carefully curated collection of over 60 authentic supplications sourced from the Holy Quran and verified hadith collections (Bukhari, Muslim, Tirmidhi, Abu Dawud, and others). Each dua includes the original Arabic text, transliteration for those learning to pronounce Arabic, translations in English and Urdu, the source reference, and information about its benefits and occasions for recitation.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Etiquette of Making Dua</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">Begin with praise of Allah:</strong> Start your dua by praising Allah and sending blessings upon the Prophet (peace be upon him). The Prophet said: &quot;Every dua is kept back until you send blessings upon the Prophet&quot; (Al-Bayhaqi).</p>
            <p><strong className="text-gray-800">Be sincere and present:</strong> Make dua with full concentration and certainty that Allah will respond. The Prophet said: &quot;Call upon Allah while being certain of being answered, and know that Allah does not respond to a dua from a heedless heart&quot; (Tirmidhi).</p>
            <p><strong className="text-gray-800">Face the Qibla and raise your hands:</strong> While not obligatory, facing the direction of Makkah and raising your palms upward is from the Sunnah when making dua outside of prayer.</p>
            <p><strong className="text-gray-800">Be persistent:</strong> Do not give up if your dua is not answered immediately. Allah responds in one of three ways: He gives you what you asked for, He averts a harm from you, or He stores the reward for you in the Hereafter.</p>
            <p><strong className="text-gray-800">Ask for good in both worlds:</strong> The Prophet frequently made the comprehensive dua: &quot;Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire&quot; (Quran 2:201).</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Categories of Duas in Our Collection</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Our collection is organized into meaningful categories to help you find the right supplication for every situation in life. Categories include duas for forgiveness and repentance, protection from harm, morning and evening adhkar, travel prayers, prayers for health and healing, supplications for guidance and knowledge, duas for parents and family, prayers for provision and sustenance, and special occasion duas.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Every dua in our collection is verified against authentic sources. We include the exact reference (Quran chapter and verse, or hadith book and number) so you can verify each supplication independently. Duas marked as &quot;verified&quot; have been cross-referenced with multiple scholarly sources for authenticity.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">Features of This Dua Tool</h3>
          <ul className="space-y-2 text-sm text-emerald-700 leading-relaxed">
            <li>• Browse 60+ authentic duas from Quran and Sunnah with full references</li>
            <li>• Toggle between English and Urdu translations instantly</li>
            <li>• Search by keyword, category, or occasion to find relevant duas quickly</li>
            <li>• Each dua includes Arabic text, transliteration, translation, and source</li>
            <li>• Learn about the benefits and recommended times for each supplication</li>
            <li>• Completely free with no registration required</li>
          </ul>
        </div>
      </section>
    </>
  );
}