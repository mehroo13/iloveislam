import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hijri Calendar Converter — Gregorian to Hijri & Islamic Date Today | I Love Islam',
  description:
    'Convert any date between Gregorian and Hijri calendars. See today’s Islamic date, upcoming events, and all Hijri months. Free, no sign‑up.',
  keywords: [
    'hijri calendar', 'islamic date today', 'hijri to gregorian', 'gregorian to hijri', 'arabic date',
    'islamic calendar 1446', 'hijri months', 'today hijri date', 'hijri converter',
  ],
  openGraph: {
    title: 'Hijri Calendar Converter | I Love Islam',
    description: 'Convert dates between Gregorian and Hijri, see today’s Islamic date, and browse all Hijri months.',
    url: 'https://iloveislam.life/hijri-calendar',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hijri Calendar Converter | I Love Islam',
    description: 'Free Hijri to Gregorian date converter with Islamic events.',
  },
  alternates: { canonical: 'https://iloveislam.life/hijri-calendar' },
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
      name: 'Hijri Calendar Converter',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Convert dates between the Gregorian and Hijri calendars, view today’s Islamic date, and explore all Hijri months with their Islamic significance.',
      url: 'https://iloveislam.life/hijri-calendar',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Hijri Calendar', item: 'https://iloveislam.life/hijri-calendar' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the Hijri date today?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The tool shows today’s Hijri date automatically when you open the page. You can also convert any Gregorian or Hijri date.',
          },
        },
        {
          '@type': 'Question',
          name: 'How accurate is the Hijri conversion?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We use the Umm al‑Qura algorithm, the most widely accepted Islamic calendar. Actual dates may vary by one day depending on moon sighting.',
          },
        },
      ],
    },
  ],
};

export default function HijriCalendarLayout({ children }: { children: React.ReactNode }) {
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