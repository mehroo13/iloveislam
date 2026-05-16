import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prayer Times — Accurate Daily Salah Times Worldwide | I Love Islam',
  description:
    'Get precise prayer times for any city. Choose calculation methods (ISNA, MWL, Umm al‑Qura) and see live countdown to the next prayer. Free, no sign‑up.',
  keywords: [
    'prayer times', 'salah times', 'namaz times', 'fajr time', 'dhuhr time', 'asr time', 'maghrib time', 'isha time',
    'islamic prayer times today', 'muslim prayer times', 'azan time', 'qibla time', 'prayer timetable',
  ],
  openGraph: {
    title: 'Prayer Times — Accurate Salah Times Worldwide | I Love Islam',
    description:
      'Get precise prayer times for any city. Choose calculation methods and see a live countdown to the next prayer.',
    url: 'https://iloveislam.life/prayer-times',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prayer Times | I Love Islam',
    description: 'Accurate daily prayer times for any city. Free.',
  },
  alternates: { canonical: 'https://iloveislam.life/prayer-times' },
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
      name: 'Prayer Times',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Accurate Islamic prayer times for any location worldwide, with multiple calculation methods and live next-prayer countdown.',
      url: 'https://iloveislam.life/prayer-times',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Prayer Times', item: 'https://iloveislam.life/prayer-times' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How are prayer times calculated?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Prayer times are calculated using astronomical algorithms based on your geographic coordinates. You can select from standard methods like ISNA, Muslim World League, Umm al‑Qura, and others.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I see the next prayer countdown?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, the tool highlights the next prayer and shows the time remaining. You can also see the full daily timetable.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does the prayer time tool work on mobile?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely. It’s fully responsive and works on all devices. You can even add it to your home screen.',
          },
        },
      ],
    },
  ],
};

export default function PrayerTimesLayout({ children }: { children: React.ReactNode }) {
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