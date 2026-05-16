import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ramadan Planner — Daily Fasting, Ibadah & Goal Tracker | I Love Islam',
  description:
    'Plan and track your Ramadan: daily fasts, ibadah checklist, mood, goals (Quran, Tarawih, Sadaqah), duas, and personal journal. Free, no sign‑up.',
  keywords: [
    'ramadan planner', 'ramadan tracker', 'fasting tracker', 'ramadan goals', 'ramadan calendar',
    'ramadan ibadah', 'ramadan journal', 'ramadan checklist', 'free ramadan app',
  ],
  openGraph: {
    title: 'Ramadan Planner — Daily Fasting & Ibadah Tracker | I Love Islam',
    description: 'Make the most of Ramadan with a daily tracker, goals, duas, and a personal journal.',
    url: 'https://iloveislam.life/ramadan-planner',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ramadan Planner | I Love Islam',
    description: 'Free Ramadan tracker with daily checklists and goals.',
  },
  alternates: { canonical: 'https://iloveislam.life/ramadan-planner' },
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
      name: 'Ramadan Planner',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'A comprehensive Ramadan companion: track daily fasts, ibadah, set 30‑day goals, read duas, and maintain a personal journal. All data saved locally.',
      url: 'https://iloveislam.life/ramadan-planner',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Ramadan Planner', item: 'https://iloveislam.life/ramadan-planner' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How can I track my fasts during Ramadan?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Use the “Today” tab to toggle your fast on or off. The calendar shows your fasting record for the whole month.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I set personal goals for Ramadan?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, track goals like completing the Quran, praying Tarawih, giving Sadaqah, and more. Progress bars update automatically as you log ibadah.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does it include Ramadan duas?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely. Essential duas for Suhoor, Iftar, and Laylatul Qadr are included in the Duas tab.',
          },
        },
      ],
    },
  ],
};

export default function RamadanPlannerLayout({ children }: { children: React.ReactNode }) {
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