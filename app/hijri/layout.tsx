import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hijri Calendar Converter — Convert Dates Between Gregorian & Hijri | I Love Islam',
  description:
    'Convert any Gregorian date to Hijri and vice versa. See today’s Islamic date, upcoming events, and a list of all Hijri months. Free, no sign-up.',
  openGraph: {
    title: 'Hijri Calendar Converter — Convert Dates Between Gregorian & Hijri | I Love Islam',
    description:
      'Convert any Gregorian date to Hijri and vice versa. See today’s Islamic date, upcoming events, and a list of all Hijri months. Free, no sign-up.',
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
        text: 'We use the Umm al-Qura algorithm (the most widely accepted Islamic calendar) to accurately convert dates between the Gregorian and Hijri systems. You can also see today’s Islamic date automatically.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the Hijri calendar?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Hijri calendar (also known as the Islamic or Arabic calendar) is a lunar calendar consisting of 12 months in a year of 354 or 355 days. It is used to determine Islamic holidays and events like Ramadan, Eid al-Fitr, and Eid al-Adha.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I convert any date?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! You can pick a Gregorian date or manually enter a Hijri date (day, month, year). The converter is fast and free.',
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
      <header className="max-w-lg mx-auto px-4 pt-8 pb-4">
        <a href="/" className="text-sm text-emerald-700 hover:underline">
          ← Back to I Love Islam Tools
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          Hijri Calendar Converter
        </h1>
        <p className="text-gray-500 mt-2">
          Instantly convert dates between Gregorian and Hijri. See today’s Islamic date,
          upcoming Islamic events, and a full list of Hijri months. Completely free.
        </p>
      </header>

      {children}

      <section className="max-w-lg mx-auto px-4 py-10 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqSchema.mainEntity.map((item) => (
            <div key={item.name}>
              <h3 className="font-medium text-gray-700">{item.name}</h3>
              <p className="text-gray-500 text-sm mt-1">{item.acceptedAnswer.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}