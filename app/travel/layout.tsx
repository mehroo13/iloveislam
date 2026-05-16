import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Halal Travel — Find Mosques, Halal Food, Hotels & Prayer Times | I Love Islam',
  description:
    'Find mosques, halal restaurants, hotels, and prayer times for your journey. Travel with confidence — free, no sign‑up.',
  keywords: [
    'halal travel', 'halal restaurants near me', 'mosque finder', 'find halal food', 'prayer times travel',
    'hotels near mosque', 'halal travel guide', 'muslim travel', 'halal trip planner',
  ],
  openGraph: {
    title: 'Halal Travel — Mosques, Halal Food & Prayer Times | I Love Islam',
    description: 'Find everything you need for a blessed journey: halal food, mosques, hotels, and prayer times.',
    url: 'https://iloveislam.life/halal-travel',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Halal Travel | I Love Islam',
    description: 'Free halal travel assistant with mosque and restaurant finder.',
  },
  alternates: { canonical: 'https://iloveislam.life/halal-travel' },
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
      name: 'Halal Travel',
      applicationCategory: 'TravelApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'A complete halal travel companion: find halal restaurants, mosques, and hotels near any location or city, plus get prayer times for your destination.',
      url: 'https://iloveislam.life/halal-travel',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Halal Travel', item: 'https://iloveislam.life/halal-travel' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How can I find halal food while travelling?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Use the Halal Food tab to search for restaurants with halal certification. You can also filter by cuisine and get directions.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I locate nearby mosques?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, the Mosques tab uses your current location or a city name to show nearby places of worship. Tap “Directions” to open in Google Maps.',
          },
        },
        {
          '@type': 'Question',
          name: 'What about hotels and prayer times?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The Hotels tab helps you find accommodation, and the Prayer Times tab gives accurate timings for your destination.',
          },
        },
      ],
    },
  ],
};

export default function HalalTravelLayout({ children }: { children: React.ReactNode }) {
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