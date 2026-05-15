import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dua Generator — Authentic Duas from Quran & Sunnah | I Love Islam',
  description:
    'Browse authentic duas with Arabic, transliteration, translation (English & Urdu), and references. Free, no sign‑up. Includes daily dua, search, and categories.',
  openGraph: {
    title: 'Dua Generator — Authentic Duas from Quran & Sunnah | I Love Islam',
    description:
      'Browse authentic duas with Arabic, transliteration, translation (English & Urdu), and references. Free, no sign‑up. Includes daily dua, search, and categories.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Are these duas authentic?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, all duas are sourced from the Holy Quran, Sahih al-Bukhari, Sahih Muslim, and other authentic Hadith collections.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I read the duas in English and Urdu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. You can toggle between English and Urdu translations at any time. The Arabic text, transliteration, and references are always shown.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there a daily dua feature?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, a featured daily dua is shown at the top, and you can jump to it with one tap.',
      },
    },
  ],
};

export default function DuaGeneratorLayout({ children }: { children: React.ReactNode }) {
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