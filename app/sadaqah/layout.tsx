import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sadaqah Tracker — Log & Track Your Charity & Donations | I Love Islam',
  description:
    'Record every sadaqah you give. Categorise donations, set goals, maintain streaks, and get inspired by Quranic verses. Free, no sign‑up.',
  keywords: [
    'sadaqah tracker', 'charity tracker', 'donation tracker', 'sadaqah jarriyah', 'track my charity',
    'islamic charity', 'free charity app', 'sadaqah log',
  ],
  openGraph: {
    title: 'Sadaqah Tracker — Log Your Charity & Earn Rewards | I Love Islam',
    description: 'Keep a beautiful log of your sadaqah, track streaks, and see category breakdowns.',
    url: 'https://iloveislam.life/sadaqah-tracker',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sadaqah Tracker | I Love Islam',
    description: 'Free charity tracker with streaks and breakdowns.',
  },
  alternates: { canonical: 'https://iloveislam.life/sadaqah-tracker' },
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
      name: 'Sadaqah Tracker',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Log every sadaqah (charity) you give, track daily streaks, view category breakdowns, and get inspired by Quranic verses. All data saved locally in your browser.',
      url: 'https://iloveislam.life/sadaqah-tracker',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Sadaqah Tracker', item: 'https://iloveislam.life/sadaqah-tracker' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I log a sadaqah donation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Tap the floating “+ Log Sadaqah” button. Enter the amount, choose a category, add a recipient/note, and save. All data stays in your browser.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I see my charity breakdown?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! The “Breakdown” tab shows how your sadaqah is distributed across categories with progress bars and totals.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is there a reminder to give daily?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The tracker shows your current streak and encourages you to keep it alive. You’ll find Quranic inspiration in the Inspire tab.',
          },
        },
      ],
    },
  ],
};

export default function SadaqahTrackerLayout({ children }: { children: React.ReactNode }) {
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