import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hajj Checklist — Complete Step‑by‑Step Guide & Tracker | I Love Islam',
  description:
    'Prepare for Hajj with a complete checklist: from Ihram to Tawaf al‑Wada. Track your progress, save your completion, and get inspired with duas. Free, no sign‑up.',
  keywords: [
    'hajj checklist', 'hajj guide', 'hajj steps', 'hajj preparation', 'hajj tracker',
    'hajj 2025', 'hajj planner', 'free hajj checklist', 'hajj rituals',
  ],
  openGraph: {
    title: 'Hajj Checklist — Complete Step‑by‑Step Guide | I Love Islam',
    description: 'A comprehensive checklist for every day of Hajj. Track your progress and never miss a rite.',
    url: 'https://iloveislam.life/hajj-checklist',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hajj Checklist | I Love Islam',
    description: 'Free Hajj planner and checklist.',
  },
  alternates: { canonical: 'https://iloveislam.life/hajj-checklist' },
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
      name: 'Hajj Checklist',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'A complete step‑by‑step Hajj checklist covering every day from Ihram to Tawaf al‑Wada. Track your progress with checkboxes and get essential duas.',
      url: 'https://iloveislam.life/hajj-checklist',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Hajj Checklist', item: 'https://iloveislam.life/hajj-checklist' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What are the essential steps of Hajj?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The essential steps include Ihram, standing at Arafat (Wuquf), Tawaf al‑Ifadah, Sa’ee between Safa and Marwa, stoning the Jamarat, and sacrifice (Hadi). Use our checklist to track each step.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I track my Hajj progress?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Simply check off each task as you complete it. Your progress is saved in your browser automatically. You can see your overall completion percentage at the top.',
          },
        },
        {
          '@type': 'Question',
          name: 'What should I pack for Hajj?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Essentials include unscented toiletries, comfortable walking sandals, a prayer mat, power bank, medications, and your travel documents. Our checklist includes a full packing list.',
          },
        },
      ],
    },
  ],
};

export default function HajjChecklistLayout({ children }: { children: React.ReactNode }) {
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