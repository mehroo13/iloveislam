import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sadaqah Tracker — Log Your Charity & Earn Endless Rewards | I Love Islam',
  description:
    'Track every sadaqah you give. Categorise donations, set goals, maintain streaks, and get inspired by Quranic verses. Free, no sign‑up.',
  openGraph: {
    title: 'Sadaqah Tracker — Log Your Charity & Earn Endless Rewards | I Love Islam',
    description:
      'Track every sadaqah you give. Categorise donations, set goals, maintain streaks, and get inspired by Quranic verses. Free, no sign‑up.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
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
        text: 'Absolutely. The tracker shows your current streak and encourages you to keep it alive. You’ll find Quranic inspiration in the Inspire tab.',
      },
    },
  ],
};

export default function SadaqahTrackerLayout({ children }: { children: React.ReactNode }) {
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