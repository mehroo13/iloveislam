import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — I Love Islam | Free Islamic Tools',
  description:
    'Read the terms of service for I Love Islam free Islamic tools. All tools are free forever, provided as-is for educational and personal use.',
  openGraph: {
    title: 'Terms of Service — I Love Islam',
    description: 'Free Islamic tools terms of service. All tools are provided as-is for educational use.',
    type: 'website',
    url: 'https://www.iloveislam.life/terms',
    siteName: 'I Love Islam',
    locale: 'en_US',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'Terms of Service — I Love Islam' }],
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Service — I Love Islam',
    description: 'Free Islamic tools terms of service.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/terms' },
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
    { '@type': 'ListItem', position: 2, name: 'Terms of Service', item: 'https://www.iloveislam.life/terms' },
  ],
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
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
