import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Prayer Times — Accurate Salah Times by Location | I Love Islam',
  description:
    'Get accurate daily prayer times for your city anywhere in the world. Free, no sign-up needed.',
  openGraph: {
    title: 'Prayer Times — Accurate Salah Times by Location | I Love Islam',
    description:
      'Get accurate daily prayer times for your city anywhere in the world. Free, no sign-up needed.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How are prayer times calculated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We use astronomical algorithms based on your geographic coordinates. You can select different calculation methods like ISNA, Umm Al-Qura, and others.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the prayer time tool free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, completely free. No sign-up needed and it works worldwide on any device.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does this tool work on mobile?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. The page is fully responsive and works on smartphones, tablets, and desktops.',
      },
    },
  ],
};

export default function PrayerTimesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />

      {children}
    </>
  );
}