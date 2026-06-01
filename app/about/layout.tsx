import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us — I Love Islam | Free Islamic Tools for Every Muslim',
  description:
    'Learn about I Love Islam – a free collection of 26+ Islamic tools built for Muslims worldwide. Discover our mission, values, methodology, sources, and commitment to serving the global Ummah with accurate, private, and accessible Islamic tools.',
  keywords: [
    'about i love islam', 'islamic tools website', 'free muslim tools', 'islamic app',
    'muslim website', 'islamic technology', 'ummah tools', 'halal tools',
  ],
  openGraph: {
    title: 'About I Love Islam — Free Islamic Tools for the Ummah',
    description: 'Discover why we built 26+ free Islamic tools for the global Muslim community. Our mission, values, and commitment to accuracy and privacy.',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Free Islamic Tools' }],
    url: 'https://www.iloveislam.life/about',
    siteName: 'I Love Islam',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About I Love Islam',
    description: '26+ free Islamic tools for every Muslim. Learn about our mission and values.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/about' },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'AboutPage',
      name: 'About I Love Islam',
      description: 'Learn about I Love Islam — a free collection of 26+ Islamic tools built for Muslims worldwide.',
      url: 'https://www.iloveislam.life/about',
      mainEntity: {
        '@type': 'Organization',
        name: 'I Love Islam',
        url: 'https://www.iloveislam.life',
        description: 'Free Islamic tools for every Muslim — Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Kids Games, and more.',
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'About', item: 'https://www.iloveislam.life/about' },
      ],
    },
  ],
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
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