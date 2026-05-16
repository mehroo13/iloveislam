import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dhikr Counter — Free Islamic Tasbeeh & Zikr Tracker | I Love Islam',
  description:
    'Count daily dhikr with beautiful presets: Subhanallah, Alhamdulillah, Allahu Akbar, Salawat, Istighfar. Track streaks, history, and per‑dhikr statistics. Free, no sign‑up.',
  keywords: [
    'dhikr counter', 'tasbeeh counter', 'zikr counter', 'digital tasbih', 'islamic counter',
    'subhanallah counter', 'alhamdulillah counter', 'allahu akbar counter', 'free dhikr app',
  ],
  openGraph: {
    title: 'Dhikr Counter — Tasbeeh & Zikr Tracker | I Love Islam',
    description: 'Count your daily dhikr with beautiful presets, track streaks, and see your history.',
    url: 'https://iloveislam.life/dhikr-counter',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dhikr Counter | I Love Islam',
    description: 'Free Islamic tasbeeh counter with progress tracking.',
  },
  alternates: { canonical: 'https://iloveislam.life/dhikr-counter' },
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
      name: 'Dhikr Counter',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'A digital Islamic tasbeeh counter with preset dhikr, target tracking, session streaks, and detailed per‑dhikr statistics — all stored locally in your browser.',
      url: 'https://iloveislam.life/dhikr-counter',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Dhikr Counter', item: 'https://iloveislam.life/dhikr-counter' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What dhikr can I count with this tool?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Presets include Subhanallah, Alhamdulillah, Allahu Akbar, La ilaha illallah, Salawat, Istighfar, Ayatul Kursi, and a free mode for any custom dhikr.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does it save my progress?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, your total counts, streaks, history, and per‑dhikr stats are saved in your browser. They stay even after you close the page.',
          },
        },
      ],
    },
  ],
};

export default function DhikrCounterLayout({ children }: { children: React.ReactNode }) {
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