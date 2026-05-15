import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hijri Calendar Converter — Convert Dates Between Gregorian & Hijri | I Love Islam',
  description:
    'Convert any Gregorian date to Hijri and vice versa. See today’s Islamic date, upcoming events, and a list of all Hijri months. Free, no sign‑up.',
  openGraph: {
    title: 'Hijri Calendar Converter — Convert Dates Between Gregorian & Hijri | I Love Islam',
    description:
      'Convert any Gregorian date to Hijri and vice versa. See today’s Islamic date, upcoming events, and a list of all Hijri months. Free, no sign‑up.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does the Hijri calendar converter work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We use the Umm al-Qura algorithm to accurately convert dates between the Gregorian and Hijri systems. You can also see today’s Islamic date automatically.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the Hijri calendar?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Hijri calendar is a lunar calendar of 12 months used to determine Islamic holidays like Ramadan, Eid al-Fitr, and Eid al-Adha.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I convert any date?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, you can pick a Gregorian date or manually enter a Hijri date (day, month, year). The converter is fast and free.',
      },
    },
  ],
};

export default function HijriCalendarLayout({ children }: { children: React.ReactNode }) {
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