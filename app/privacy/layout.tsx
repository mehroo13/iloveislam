import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — I Love Islam | No Data Collection',
  description:
    'We do not collect any personal data. All Islamic tools work locally in your browser. No tracking, no cookies, no registration required. Your privacy is protected.',
  openGraph: {
    title: 'Privacy Policy — I Love Islam',
    description: 'Your privacy is protected. No registration, no data collection. All tools work locally.',
    type: 'website',
    url: 'https://www.iloveislam.life/privacy',
    siteName: 'I Love Islam',
    locale: 'en_US',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'Privacy Policy — I Love Islam' }],
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy — I Love Islam',
    description: 'No data collection. All tools work locally in your browser.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/privacy' },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
    { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: 'https://www.iloveislam.life/privacy' },
  ],
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
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
