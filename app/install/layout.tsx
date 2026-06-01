import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Install I Love Islam App — Free Offline Islamic Tools',
  description: 'Install I Love Islam on your phone or computer for instant offline access to Prayer Times, Dhikr Counter, Quran Reader, and 25+ Islamic tools. No app store needed.',
  keywords: ['install islamic app', 'offline islamic tools', 'pwa islamic', 'add to home screen islam'],
  alternates: { canonical: 'https://www.iloveislam.life/install' },
  openGraph: {
    title: 'Install I Love Islam App — Free Offline Islamic Tools',
    description: 'Install I Love Islam on your phone or computer for instant offline access to 25+ Islamic tools.',
    url: 'https://www.iloveislam.life/install',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'Install I Love Islam App' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Install I Love Islam App — Free Offline Islamic Tools',
    description: 'Get instant offline access to 25+ Islamic tools from your home screen.',
    images: ['/optimized/og-image.webp'],
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: 'Install I Love Islam App',
      description: 'Step-by-step guide to install I Love Islam as a Progressive Web App on iPhone, Android, Windows, and Mac.',
      url: 'https://www.iloveislam.life/install',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Install App', item: 'https://www.iloveislam.life/install' },
      ],
    },
  ],
};

export default function InstallLayout({ children }: { children: React.ReactNode }) {
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
