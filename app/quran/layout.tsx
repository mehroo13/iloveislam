import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quran Reader — Read, Listen & Bookmark the Holy Quran | I Love Islam',
  description:
    'Read the Quran with Indo‑Pak Mushaf or verse‑by‑verse, listen to recitations, bookmark ayahs, and switch between English & Urdu translations. Free, no sign‑up.',
  keywords: [
    'quran reader', 'read quran online', 'quran with translation', 'quran audio', 'quran bookmarks',
    'quran english', 'quran urdu', 'al quran', 'free quran app', 'online quran recitation',
  ],
  openGraph: {
    title: 'Quran Reader — Holy Quran with Translation & Audio | I Love Islam',
    description: 'Read the Quran in Arabic with English/Urdu translation, audio recitation, and bookmarking.',
    url: 'https://iloveislam.life/quran-reader',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quran Reader | I Love Islam',
    description: 'Read, listen, and bookmark the Quran. Free forever.',
  },
  alternates: { canonical: 'https://iloveislam.life/quran-reader' },
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
      name: 'Quran Reader',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Read the Holy Quran in Arabic with Indo‑Pak Mushaf or verse‑by‑verse, listen to recitations, bookmark verses, and toggle English or Urdu translations.',
      url: 'https://iloveislam.life/quran-reader',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Quran Reader', item: 'https://iloveislam.life/quran-reader' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Can I read the Quran in English and Urdu?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, you can switch between English and Urdu translations at any time. The Arabic text is always displayed alongside.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is there audio recitation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, tap any verse to hear a renowned Qari recite it. You can also enable continuous playback for the whole surah.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do bookmarks work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Double‑tap any verse to bookmark it. Bookmarks are saved in your browser and shown in the surah list along with your last read position.',
          },
        },
      ],
    },
  ],
};

export default function QuranReaderLayout({ children }: { children: React.ReactNode }) {
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