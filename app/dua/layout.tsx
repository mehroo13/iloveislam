import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dua Generator — Authentic Duas from Quran & Sunnah | I Love Islam',
  description:
    'Browse authentic duas with Arabic, transliteration, translation (English & Urdu), and references. Free, no sign‑up. Includes daily dua, search, and categories.',
  keywords: [
    'dua', 'islamic dua', 'dua from quran', 'daily dua', 'dua in english', 'dua in urdu',
    'authentic duas', 'supplication', 'islamic prayer', 'free dua app',
  ],
  openGraph: {
    title: 'Dua Generator — Authentic Duas from Quran & Sunnah | I Love Islam',
    description: 'Browse a large collection of authentic duas with translations and references.',
    url: 'https://iloveislam.life/dua-generator',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dua Generator | I Love Islam',
    description: 'Free authentic dua collection with English and Urdu translations.',
  },
  alternates: { canonical: 'https://iloveislam.life/dua-generator' },
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
      url: 'https://iloveislam.life/dua-generator',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Dua Generator', item: 'https://iloveislam.life/dua-generator' },
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
    </>
  );
}