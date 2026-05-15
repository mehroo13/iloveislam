import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Qibla Finder — Find Accurate Qibla Direction from Any Location | I Love Islam',
  description:
    'Find the exact Qibla direction from your location with our free Qibla compass. Accurate, works worldwide, and includes a live compass mode.',
  openGraph: {
    title: 'Qibla Finder — Accurate Qibla Direction from Any Location | I Love Islam',
    description:
      'Find the exact Qibla direction from your location with our free Qibla compass. Accurate, works worldwide, and includes a live compass mode.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does the Qibla finder work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We use your device GPS (or a city search) to get your latitude and longitude, then compute the exact bearing to the Kaaba using the great‑circle formula.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the Qibla direction accurate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, it’s calculated using the standard spherical Earth model, typically accurate within 1°. For best results, enable the live compass and hold your phone flat.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use this without giving location permission?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. You can search for any city in the world and get the fixed Qibla direction. The live compass requires device orientation permission, but the static direction works without it.',
      },
    },
  ],
};

export default function QiblaLayout({ children }: { children: React.ReactNode }) {
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