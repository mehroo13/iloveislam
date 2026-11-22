import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Install I Love Islam Hifz App — Free Offline Quran Memorisation',
  description: 'Install Hifz on your phone or computer for instant offline access to the AI Quran memorisation coach, recitation feedback, and hifz plans. No app store needed.',
  keywords: ['install hifz app', 'offline quran memorisation', 'pwa quran', 'add to home screen quran'],
  alternates: { canonical: 'https://www.iloveislam.life/install' },
  openGraph: {
    title: 'Install I Love Islam Hifz App — Free Offline Quran Memorisation',
    description: 'Install Hifz on your phone or computer for instant offline access to the AI Quran memorisation coach.',
    url: 'https://www.iloveislam.life/install',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'Install I Love Islam App' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Install I Love Islam Hifz App — Free Offline Quran Memorisation',
    description: 'Get instant offline access to the Hifz Quran memorisation app from your home screen.',
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
      description: 'Step-by-step guide to install Hifz as a Progressive Web App on iPhone, Android, Windows, and Mac.',
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
