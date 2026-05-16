import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mosque Finder — Find Nearest Masjid with Live Prayer Times | I Love Islam',
  description:
    'Find mosques near you or in any city. See live daily prayer times for each masjid, get directions, and filter by distance. Free, no sign‑up.',
  keywords: [
    'mosque finder', 'find mosque near me', 'masjid locator', 'nearest mosque', 'prayer times mosque',
    'muslim place of worship', 'masjid directions',
  ],
  openGraph: {
    title: 'Mosque Finder — Nearest Masjid & Prayer Times | I Love Islam',
    description: 'Locate mosques nearby with live prayer times and directions.',
    url: 'https://iloveislam.life/mosque-finder',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mosque Finder | I Love Islam',
    description: 'Free mosque locator with live prayer times.',
  },
  alternates: { canonical: 'https://iloveislam.life/mosque-finder' },
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
      name: 'Mosque Finder',
      applicationCategory: 'TravelApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Find mosques (masjids) near your current location or any city using OpenStreetMap data. Each mosque shows live daily prayer times calculated from the Aladhan API.',
      url: 'https://iloveislam.life/mosque-finder',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Mosque Finder', item: 'https://iloveislam.life/mosque-finder' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How can I find mosques near me?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Tap “Use My GPS Location” or enter a city name. The tool searches OpenStreetMap for nearby mosques and shows their distance and direction.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does the mosque finder show prayer times?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! Tap on any mosque to see today’s live prayer times calculated for its exact coordinates using the Aladhan API.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I get directions to a mosque?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely. In the expanded details, use the “Get Directions” button to open Google Maps with the best route from your current location.',
          },
        },
      ],
    },
  ],
};

export default function MosqueFinderLayout({ children }: { children: React.ReactNode }) {
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