import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mosque Finder – Find Nearest Masjid with Live Prayer Times | I Love Islam',
  description:
    'Find mosques near you or in any city. See live daily prayer times for each masjid, get directions, and filter by distance. Free, no sign‑up.',
  openGraph: {
    title: 'Mosque Finder – Find Nearest Masjid with Live Prayer Times | I Love Islam',
    description:
      'Find mosques near you or in any city. See live daily prayer times for each masjid, get directions, and filter by distance. Free, no sign‑up.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
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
};

export default function MosqueFinderLayout({ children }: { children: React.ReactNode }) {
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