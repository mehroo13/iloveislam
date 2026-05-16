import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mizan — Islamic Numerology & Life Purpose Blueprint | I Love Islam',
  description:
    'Discover your Islamic archetype, divine name, and life purpose based on your birth date. Personalised Quranic verses, rizq path, dhikr, and prophetic mirror. Free, no sign‑up.',
  keywords: [
    'mizan', 'islamic numerology', 'islamic destiny calculator', 'abjad', 'islamic archetype',
    'life purpose islam', 'spiritual blueprint', 'free mizan report',
  ],
  openGraph: {
    title: 'Mizan — Islamic Archetype & Life Purpose | I Love Islam',
    description: 'Uncover your spiritual blueprint with personalised Quranic guidance.',
    url: 'https://iloveislam.life/mizan',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mizan | I Love Islam',
    description: 'Discover your Islamic archetype and divine purpose.',
  },
  alternates: { canonical: 'https://iloveislam.life/mizan' },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Mizan',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'A spiritual self‑reflection tool that maps your birth date to an Islamic archetype linked to a Divine Name, Quranic verse, daily verses, and life purpose.',
      url: 'https://iloveislam.life/mizan',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Mizan', item: 'https://iloveislam.life/mizan' },
      ],
    },
    {
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
            text: 'Your core numbers (Life, Soul, Destiny) are derived from your birth date using a reduction method reminiscent of the Abjad system. These numbers correspond to one of 9 Islamic archetypes.',
          },
        },
      ],
    },
  ],
};

export default function MizanLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}