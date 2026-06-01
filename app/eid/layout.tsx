import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Islamic Events & Countdowns 2026 — Ramadan, Eid, Ashura | I Love Islam',
  description:
    'Live countdowns to Ramadan, Eid ul-Fitr, Eid ul-Adha, Day of Arafah, Ashura, Mawlid, and all major Islamic events. Dates calculated automatically for any year. Pin your favourites.',
  keywords: [
    'islamic events 2026',
    'ramadan 2026 date',
    'eid ul fitr 2026',
    'eid ul adha 2026',
    'day of arafah 2026',
    'ashura 2026',
    'mawlid an nabi 2026',
    'islamic calendar 2026',
    'hijri calendar',
    'islamic countdown',
    'when is ramadan',
    'when is eid',
    'laylatul qadr 2026',
  ],
  openGraph: {
    title: 'Islamic Events & Countdowns 2026 | I Love Islam',
    description:
      'Live countdowns to Ramadan, Eid, Arafah, Ashura & all major Islamic events. Pin your favourites. Free forever.',
    url: 'https://www.iloveislam.life/events',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Free Islamic Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Islamic Events & Countdowns 2026 | I Love Islam',
    description: 'Live countdowns to Ramadan, Eid, Arafah & all major Islamic events. Free.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/events' },
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
      name: 'Islamic Events & Countdowns',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Live countdowns to all major Islamic events including Ramadan, Eid ul-Fitr, Eid ul-Adha, Day of Arafah, Ashura, Mawlid, and more. Dates calculated dynamically for any year using the Kuwaiti Hijri algorithm.',
      url: 'https://www.iloveislam.life/events',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://www.iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',           item: 'https://www.iloveislam.life'        },
        { '@type': 'ListItem', position: 2, name: 'Islamic Events', item: 'https://www.iloveislam.life/events' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'When is Ramadan 2026?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ramadan 2026 is expected to begin around 1 March 2026, subject to moon sighting. The exact date may vary by 1 day depending on your location and the local Islamic authority.',
          },
        },
        {
          '@type': 'Question',
          name: 'When is Eid ul-Fitr 2026?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Eid ul-Fitr 2026 is expected to fall around 30 March or 31 March 2026, marking the end of Ramadan. The exact date depends on the sighting of the new moon.',
          },
        },
        {
          '@type': 'Question',
          name: 'When is Eid ul-Adha 2026?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Eid ul-Adha 2026 is expected around 6 June 2026, on the 10th of Dhu al-Hijjah 1446 AH. The exact date may vary by region.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is Laylatul Qadr?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Laylatul Qadr (The Night of Power) is the holiest night in Islam, occurring in the last ten odd nights of Ramadan — most likely the 27th night. The Quran states it is better than a thousand months of worship. Muslims spend it in prayer, Quran recitation, and dhikr.",
          },
        },
        {
          '@type': 'Question',
          name: 'How are Islamic dates calculated?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'This tool uses the Kuwaiti algorithm to convert Hijri dates to Gregorian. Results are accurate to ±1 day. For prayer times and official event dates, always confirm with your local mosque or Islamic authority, as actual dates depend on moon sighting.',
          },
        },
      ],
    },
  ],
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
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