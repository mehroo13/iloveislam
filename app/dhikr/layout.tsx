import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dhikr Counter — Free Islamic Tasbeeh & Zikr Tracker | I Love Islam',
  description:
    'Count your daily dhikr with this beautiful Islamic counter. Includes Subhanallah, Alhamdulillah, Allahu Akbar, Salawat, Istighfar, and free mode. No sign‑up, works offline.',
  openGraph: {
    title: 'Dhikr Counter — Free Islamic Tasbeeh & Zikr Tracker | I Love Islam',
    description:
      'Count your daily dhikr with this beautiful Islamic counter. Includes Subhanallah, Alhamdulillah, Allahu Akbar, Salawat, Istighfar, and free mode. No sign‑up, works offline.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What dhikr can I count with this tool?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can choose from many presets: Subhanallah, Alhamdulillah, Allahu Akbar, La ilaha illallah, Salawat, Istighfar, Ayatul Kursi, and more. There’s also a free mode to count any custom dhikr.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does the Dhikr Counter save my progress?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, your total counts, streaks, history, and per-dhikr statistics are saved locally in your browser. They stay even if you close the page.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the Dhikr Counter free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Completely free. No sign‑up, no ads, and it works offline once loaded.',
      },
    },
  ],
};

export default function DhikrCounterLayout({ children }: { children: React.ReactNode }) {
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