import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hadith Search — Authentic Hadiths from Bukhari, Muslim & More | I Love Islam',
  description:
    'Search authentic hadiths across Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa’i, Ibn Majah. Read in English or Urdu, bookmark, and copy. Free, no sign‑up.',
  keywords: [
    'hadith search', 'search hadith', 'sahih hadith', 'bukhari hadith', 'muslim hadith', 'hadith in english',
    'hadith in urdu', 'authentic hadith', 'hadith database', 'free hadith search',
  ],
  openGraph: {
    title: 'Hadith Search — Authentic Hadiths in English & Urdu | I Love Islam',
    description: 'Search thousands of hadiths from six authentic collections. Bookmark and copy easily.',
    url: 'https://iloveislam.life/hadith-search',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hadith Search | I Love Islam',
    description: 'Free hadith search across six major collections.',
  },
  alternates: { canonical: 'https://iloveislam.life/hadith-search' },
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
      name: 'Hadith Search',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Search authentic hadiths from Sahih Bukhari, Sahih Muslim, Abu Dawud, Tirmidhi, Nasa’i, and Ibn Majah. Supports English and Urdu translations with bookmarking.',
      url: 'https://iloveislam.life/hadith-search',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Hadith Search', item: 'https://iloveislam.life/hadith-search' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Which hadith collections are included?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The six canonical collections: Sahih Bukhari, Sahih Muslim, Sunan Abu Dawud, Jami at‑Tirmidhi, Sunan an‑Nasa’i, and Sunan Ibn Majah.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I read hadiths in Urdu?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, you can switch between English and Urdu. The tool loads both language editions so you can toggle instantly.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I save hadiths for later?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely. Tap the bookmark icon on any hadith to save it. Your saved list appears in the “Saved” tab.',
          },
        },
      ],
    },
  ],
};

export default function HadithSearchLayout({ children }: { children: React.ReactNode }) {
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