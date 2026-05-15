import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mizan — Islamic Numerology & Archetype Blueprint | I Love Islam',
  description:
    'Discover your Islamic archetype and life purpose based on your birth date. Personalised Quranic verses, divine names, rizq path, dhikr guide, and prophetic mirror. Free, private.',
  openGraph: {
    title: 'Mizan — Islamic Numerology & Archetype Blueprint | I Love Islam',
    description:
      'Discover your Islamic archetype and life purpose based on your birth date. Personalised Quranic verses, divine names, rizq path, dhikr guide, and prophetic mirror. Free, private.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Mizan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Mizan is an Islamic self‑reflection tool that maps your birth date to a spiritual archetype inspired by Quranic themes and the 99 Names of Allah. It offers personalised insights, daily verses, and dhikr suggestions — all computed privately in your browser.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Mizan fortune‑telling?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No, Mizan is not divination. It is a framework for self‑reflection based on patterns in creation. All guidance ultimately comes from Allah and qualified Islamic scholars.',
      },
    },
    {
      '@type': 'Question',
      name: 'How are my numbers calculated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Your core numbers (Life, Soul, Destiny) are derived from your birth date using a reduction method reminiscent of the Abjad system. These numbers correspond to one of 9 Islamic archetypes, each linked to a Divine Name, Quranic verse, and prophetic example.',
      },
    },
  ],
};

export default function MizanLayout({ children }: { children: React.ReactNode }) {
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