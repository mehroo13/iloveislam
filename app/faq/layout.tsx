import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ — Hifz Help & Answers | I Love Islam',
  description:
    'Find answers to frequently asked questions about the free Hifz app — AI Quran memorisation coach, recitation feedback, hifz plans, and offline progress.',
  keywords: [
    'hifz faq', 'quran memorisation help', 'i love islam help', 'hifz app questions', 'memorise quran faq',
  ],
  openGraph: {
    title: 'FAQ — Hifz Help & Answers | I Love Islam',
    description: 'Answers to common questions about the free Hifz Quran memorisation app. Privacy, accuracy, and usage explained.',
    type: 'website',
    url: 'https://www.iloveislam.life/faq',
    siteName: 'I Love Islam',
    locale: 'en_US',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'FAQ — I Love Islam' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ — I Love Islam',
    description: 'Answers to common questions about the free Hifz app.',
    images: ['/optimized/og-image.webp'],
  },
  alternates: { canonical: 'https://www.iloveislam.life/faq' },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is Hifz completely free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! All tools are 100% free. No hidden fees, no subscription plans, and no credit card required.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do I need to create an account?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No account needed. You can use all tools immediately without registration. Some features use browser local storage but no personal data is collected on servers.',
          },
        },
        {
          '@type': 'Question',
          name: 'How accurate are the prayer times?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Prayer times are calculated using the Aladhan API with accurate astronomical calculations based on your location, following standard Islamic calculation methods.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does the Zakat Calculator work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Enter your assets (cash, gold, silver, investments) and liabilities (debts, expenses) to determine your Zakatable wealth, then calculate 2.5% of that amount using current gold/silver prices.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is the Qibla Finder accurate?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! The Qibla Finder uses the great-circle calculation method to find the shortest path to the Kaaba in Makkah. Enable location services for best accuracy.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do you store my personal data?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. All calculations happen locally in your browser. We do not store any personal information on our servers.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is my location shared with anyone?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Your location is only used locally to calculate prayer times and Qibla direction. We never send your location to our servers or share it with third parties.',
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'FAQ', item: 'https://www.iloveislam.life/faq' },
      ],
    },
  ],
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
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
