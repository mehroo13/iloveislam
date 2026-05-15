import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '99 Names of Allah & Prophet Muhammad ﷺ — Learn Divine Names | I Love Islam',
  description:
    'Explore the 99 names of Allah (Asma ul Husna) and the blessed names of Prophet Muhammad ﷺ with Arabic, transliteration, meanings and benefits. Free, no sign‑up.',
  openGraph: {
    title: '99 Names of Allah & Prophet Muhammad ﷺ — Learn Divine Names | I Love Islam',
    description:
      'Explore the 99 names of Allah (Asma ul Husna) and the blessed names of Prophet Muhammad ﷺ with Arabic, transliteration, meanings and benefits. Free, no sign‑up.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What are the 99 names of Allah?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The 99 names of Allah (Asma ul Husna) are the beautiful names and attributes of Allah mentioned in the Quran and Sunnah. Memorising them is a means of entering Paradise.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does the tool include names of Prophet Muhammad ﷺ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, you can toggle between the 99 names of Allah and a collection of authentic names/titles of Prophet Muhammad ﷺ, each with Arabic, transliteration, meaning and benefits.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I learn the names in Arabic and English?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. Each name is displayed in Arabic, with transliteration, English meaning, and a short benefit or explanation.',
      },
    },
  ],
};

export default function NamesLayout({ children }: { children: React.ReactNode }) {
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