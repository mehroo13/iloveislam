import type { Metadata } from 'next';
import Script from 'next/script';
import { Geist } from 'next/font/google';
import CMPConsent from './components/CMPConsent';
import './globals.css';
import ScrollRestorer from './ScrollRestorer';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'I Love Islam — Free Islamic Tools & Kids Games',
  description:
    'Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Kids Islamic Games, and 25+ more free Islamic tools.',
  metadataBase: new URL('https://www.iloveislam.life'),
  keywords: [
    'Islamic tools',
    'Muslim tools',
    'Qibla finder',
    'Prayer times',
    'Zakat calculator',
    'Quran reader',
    'Halal scanner',
    'Islamic kids games',
    'Hijri calendar',
  ],
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
    title: 'I Love Islam — Free Islamic Tools & Kids Games',
    description:
      'Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Kids Islamic Games, and 25+ more free Islamic tools.',
    url: 'https://www.iloveislam.life',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/optimized/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'I Love Islam — Free Islamic Tools & Kids Games',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'I Love Islam — Free Islamic Tools & Kids Games',
    description:
      'Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Kids Islamic Games, and 25+ more free Islamic tools.',
    images: ['/optimized/og-image.webp'],
    creator: '@iloveislam_life',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <head>
        {/* Removed GTM preconnect and immediate GTM preload; analytics load is gated by CMPConsent */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="/optimized/og-image.webp" as="image" />

        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a3d2e" />

        {/* Hreflang alternates */}
        <link rel="alternate" hrefLang="en" href="https://www.iloveislam.life/" />
        <link rel="alternate" hrefLang="x-default" href="https://www.iloveislam.life/" />

        {/* Google Analytics is loaded only after user consent via CMPConsent (client-side). */}

        {/* Structured data for site & organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'I Love Islam',
              url: 'https://www.iloveislam.life',
              description:
                'Free Islamic tools for every Muslim — Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Kids Islamic Games, and more.',
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'I Love Islam',
              url: 'https://www.iloveislam.life',
              logo: 'https://www.iloveislam.life/icon-512.png',
              sameAs: [
                'https://www.facebook.com/iloveislam.life',
                'https://twitter.com/iloveislam_life',
                'https://www.instagram.com/iloveislam.life',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer support',
                url: 'https://www.iloveislam.life/contact',
                email: 'contact@iloveislam.life',
              },
            }),
          }}
        />
      </head>

      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        <a href="#main-content" className="sr-only-focusable absolute top-2 left-2 z-50 bg-white text-sm px-3 py-2 rounded-md shadow" aria-label="Skip to main content">Skip to content</a>
        <ScrollRestorer />
        <CMPConsent />
        {children}
      </body>
    </html>
  );
}
