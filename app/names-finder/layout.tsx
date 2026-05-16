import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Islamic Name Finder – 14,585+ Muslim Names with Meanings | I Love Islam',
  description:
    'Search 14,585+ authentic Islamic names by meaning, keyword, or Arabic script. Browse boy and girl names, save favourites, and copy meanings. Free, no sign‑up.',
  openGraph: {
    title: 'Islamic Name Finder – 14,585+ Muslim Names with Meanings | I Love Islam',
    description:
      'Search 14,585+ authentic Islamic names by meaning, keyword, or Arabic script. Browse boy and girl names, save favourites, and copy meanings. Free, no sign‑up.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How many names are in this Islamic name database?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Over 14,585 authentic Muslim names from the Hugging Face Muslim Names Dataset, with Arabic script, English transliteration, meaning, and gender.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I search for names by meaning?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! You can search by name, meaning, or topic (e.g., “prophet”, “brave”, “flower”). You can also filter by boy or girl names.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I save names for later?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. Tap the “Save Name” button on any name to bookmark it. Your saved names are shown in the “Saved” tab.',
      },
    },
  ],
};

export default function IslamicNamesLayout({ children }: { children: React.ReactNode }) {
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