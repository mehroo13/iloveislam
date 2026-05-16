import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hajj Checklist – Complete Step‑by‑Step Guide & Tracker | I Love Islam',
  description:
    'Prepare for Hajj with a complete checklist: from Ihram to Tawaf al‑Wada. Track your progress, save your completion, and get inspired with duas. Free, no sign‑up.',
  openGraph: {
    title: 'Hajj Checklist – Complete Step‑by‑Step Guide & Tracker | I Love Islam',
    description:
      'Prepare for Hajj with a complete checklist: from Ihram to Tawaf al‑Wada. Track your progress, save your completion, and get inspired with duas. Free, no sign‑up.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
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
};

export default function HajjChecklistLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}