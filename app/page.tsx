// app/page.tsx — Server Component (SSR + ISR)
import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const revalidate = 3600; // ISR: revalidate every hour

export const metadata: Metadata = {
  title: 'I Love Islam — Free Islamic Tools for Every Muslim',
  description:
    'Free Islamic tools: Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, HalalScan, Dhikr Counter, Hijri Calendar, Hadith Search and 26+ more. No sign-up. Works worldwide.',
  metadataBase: new URL('https://www.iloveislam.life'),
  keywords:
    'islamic tools, zakat calculator, prayer times, qibla finder, quran reader, halal scanner, dhikr counter, hijri calendar, halal haram checker, free muslim app',
  authors: [{ name: 'I Love Islam', url: 'https://www.iloveislam.life' }],
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://www.iloveislam.life',
    languages: {
      'en-US': 'https://www.iloveislam.life',
      'x-default': 'https://www.iloveislam.life',
    },
  },
  openGraph: {
    title: 'I Love Islam — Free Islamic Tools',
    description: 'The complete free toolkit for every Muslim. 26+ tools, no sign-up.',
    url: 'https://www.iloveislam.life',
    siteName: 'I Love Islam',
    images: [{ url: 'https://www.iloveislam.life/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'I Love Islam — Free Islamic Tools',
    description: '26+ free Islamic tools. No sign-up required.',
    images: ['https://www.iloveislam.life/og-image.png'],
  },
};

// JSON-LD structured data — server-rendered, great for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'I Love Islam',
  url: 'https://www.iloveislam.life',
  description: 'Free Islamic tools for every Muslim — Zakat, Prayer Times, Qibla, Quran, HalalScan and more.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://www.iloveislam.life/?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}