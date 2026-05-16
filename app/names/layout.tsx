import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '99 Names of Allah & Prophet Muhammad ﷺ — Learn Divine Names | I Love Islam',
  description:
    'Explore the 99 names of Allah (Asma ul Husna) and the blessed names/titles of Prophet Muhammad ﷺ with Arabic, transliteration, meaning, and benefits. Free, no sign‑up.',
  keywords: [
    '99 names of allah', 'asma ul husna', 'allah names', '99 names', 'prophet muhammad names',
    'names of prophet', 'allah 99 names list', 'asma ul husna with meaning',
  ],
  openGraph: {
    title: '99 Names of Allah & Prophet Muhammad ﷺ | I Love Islam',
    description: 'Learn the 99 beautiful names of Allah and the blessed names of Prophet Muhammad ﷺ.',
    url: 'https://iloveislam.life/names-of-allah',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '99 Names of Allah & Prophet | I Love Islam',
    description: 'Free interactive guide to divine names.',
  },
  alternates: { canonical: 'https://iloveislam.life/names-of-allah' },
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
      name: '99 Names of Allah & Prophet',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Browse and learn the 99 names of Allah (Asma ul Husna) and the blessed names of Prophet Muhammad ﷺ, each with Arabic, transliteration, meaning, and benefits.',
      url: 'https://iloveislam.life/names-of-allah',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Names of Allah & Prophet', item: 'https://iloveislam.life/names-of-allah' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What are the 99 names of Allah?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The 99 names of Allah (Asma ul Husna) are the beautiful names and attributes of Allah mentioned in the Quran and Sunnah. Memorising them is a means of entering Paradise.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does the tool include names of Prophet Muhammad ﷺ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, you can toggle between the 99 names of Allah and a collection of authentic names/titles of Prophet Muhammad ﷺ, each with Arabic, transliteration, meaning and benefits.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I learn the names in Arabic and English?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely. Each name is displayed in Arabic, with transliteration, English meaning, and a short benefit or explanation.',
          },
        },
      ],
    },
  ],
};

export default function NamesOfAllahLayout({ children }: { children: React.ReactNode }) {
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