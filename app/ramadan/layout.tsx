import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ramadan Planner — Daily Tracker, Goals, Duas & Journal | I Love Islam',
  description:
    'Make the most of Ramadan: track fasts, ibadah, daily mood, set goals, save duas and journal. Free, no sign‑up, works on mobile.',
  openGraph: {
    title: 'Ramadan Planner — Daily Tracker, Goals, Duas & Journal | I Love Islam',
    description:
      'Make the most of Ramadan: track fasts, ibadah, daily mood, set goals, save duas and journal. Free, no sign‑up, works on mobile.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How can I track my fasts during Ramadan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use the “Today” tab to toggle your fast for the day. The calendar shows your entire month at a glance.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does the planner include Ramadan duas?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! You’ll find essential duas for Suhoor, Iftar, Laylatul Qadr and more. Just tap the “Duas” tab.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I set personal goals for Ramadan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. Track goals like Quran completion, Tarawih, Sadaqah, Dhikr, and Tahajjud. Progress bars update automatically as you log ibadah.',
      },
    },
  ],
};

export default function RamadanPlannerLayout({ children }: { children: React.ReactNode }) {
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