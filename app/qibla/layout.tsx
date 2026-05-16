import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Qibla Finder — Find Accurate Qibla Direction from Anywhere | I Love Islam',
  description:
    'Find the exact Qibla direction from your location. Use GPS or search a city. Includes a live compass and distance to Kaaba. Free, no sign‑up.',
  keywords: [
    'qibla finder', 'qibla direction', 'find qibla', 'kaaba direction', 'mecca direction', 'prayer direction',
    'qibla compass', 'online qibla', 'qibla locator', 'muslim qibla',
  ],
  openGraph: {
    title: 'Qibla Finder — Accurate Qibla Direction | I Love Islam',
    description: 'Find the exact direction to the Kaaba from your current location or any city.',
    url: 'https://iloveislam.life/qibla',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Qibla Finder | I Love Islam',
    description: 'Free Qibla compass with live direction.',
  },
  alternates: { canonical: 'https://iloveislam.life/qibla' },
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
      name: 'Qibla Finder',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Find the exact Qibla direction (towards the Kaaba in Mecca) from any location using GPS or city search, with a live compass and distance display.',
      url: 'https://iloveislam.life/qibla',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Qibla Finder', item: 'https://iloveislam.life/qibla' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How accurate is the Qibla direction?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The Qibla is calculated using the great‑circle formula, accurate to within 1°. For best results, enable the live compass and hold your phone flat away from metal objects.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I use the Qibla finder without GPS?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, you can search for any city and the tool will show the fixed Qibla bearing. The live compass requires device orientation permission.',
          },
        },
      ],
    },
  ],
};

export default function QiblaFinderLayout({ children }: { children: React.ReactNode }) {
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