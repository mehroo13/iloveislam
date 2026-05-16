// app/halal-travel/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Halal Travel – Mosques, Halal Food, Hotels & Prayer Times | I Love Islam',
  description:
    'Find mosques, halal restaurants, hotels, and prayer times for your journey. Travel with confidence – free, no sign‑up.',
  openGraph: {
    title: 'Halal Travel – Mosques, Halal Food, Hotels & Prayer Times | I Love Islam',
    description:
      'Find mosques, halal restaurants, hotels, and prayer times for your journey. Travel with confidence – free, no sign‑up.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
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
};

export default function HalalTravelLayout({ children }: { children: React.ReactNode }) {
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