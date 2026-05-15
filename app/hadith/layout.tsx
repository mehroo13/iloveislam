import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hadith Search — Authentic Hadiths in English & Urdu | I Love Islam',
  description:
    'Search authentic hadiths from Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa\'i, Ibn Majah. Read in English or Urdu, bookmark, copy, and share. Free, no sign‑up.',
  openGraph: {
    title: 'Hadith Search — Authentic Hadiths in English & Urdu | I Love Islam',
    description:
      'Search authentic hadiths from Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa\'i, Ibn Majah. Read in English or Urdu, bookmark, copy, and share. Free, no sign‑up.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Which hadith collections are included?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sahih Bukhari, Sahih Muslim, Sunan Abu Dawud, Jami at-Tirmidhi, Sunan an-Nasa\'i, and Sunan Ibn Majah. You can search all or filter by a specific book.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I read hadiths in Urdu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, simply switch the language selector to Urdu and all results will appear in Urdu translation. English is also available.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I save hadiths for later?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. Tap the bookmark icon on any hadith to save it. Your saved hadiths are stored in your browser and shown in the “Saved” tab.',
      },
    },
  ],
};

export default function HadithSearchLayout({ children }: { children: React.ReactNode }) {
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