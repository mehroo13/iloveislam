import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Geist } from 'next/font/google';
import CMPConsent from './components/CMPConsent';
import PWAProvider from './components/PWAProvider';
import InstallPrompt from './components/InstallPrompt';
import Header from './components/Header';
import Footer from './components/Footer';
import './globals.css';
import ScrollRestorer from './ScrollRestorer';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B3D2E',
};

const SITE_TITLE = 'I Love Islam — Memorise the Quran with AI';
const SITE_DESCRIPTION =
  'Memorise the Quran with an AI recitation coach: recite aloud and get instant word-by-word feedback, with hifz plans, Test Mode, Voice Search, group challenges, streaks and mistake review. Free forever. No sign-up. Your audio never leaves your device.';

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  metadataBase: new URL('https://www.iloveislam.life'),
  keywords: [
    'memorise quran',
    'hifz',
    'quran memorisation',
    'AI recitation coach',
    'quran mistake detection',
    'surah al-mulk',
    'juz amma',
    'ayat al-kursi',
    'quran test mode',
    'voice search quran',
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
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: 'https://www.iloveislam.life',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/optimized/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'I Love Islam — Memorise the Quran with an AI Recitation Coach',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/optimized/og-image.webp'],
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
        <link rel="preload" href="/optimized/og-image.webp" as="image" />

        {/* Apple PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="I Love Islam" />
        <meta name="mobile-web-app-capable" content="yes" />

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
              '@graph': [
                {
                  '@type': 'WebSite',
                  name: 'I Love Islam',
                  url: 'https://www.iloveislam.life',
                  description: SITE_DESCRIPTION,
                  publisher: { '@id': '#organization' },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: 'https://www.iloveislam.life/search?q={search_term_string}',
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'Organization',
                  '@id': '#organization',
                  name: 'I Love Islam',
                  url: 'https://www.iloveislam.life',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://www.iloveislam.life/icon-512.png',
                    width: 512,
                    height: 512,
                  },
                  contactPoint: {
                    '@type': 'ContactPoint',
                    contactType: 'customer support',
                    email: 'contact@iloveislam.life',
                  },
                },
                {
                  '@type': 'WebApplication',
                  name: 'I Love Islam — Memorise the Quran with an AI Recitation Coach',
                  description: SITE_DESCRIPTION,
                  url: 'https://www.iloveislam.life',
                  applicationCategory: 'EducationalApplication',
                  operatingSystem: 'Web',
                  browserRequirements: 'Requires JavaScript',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                  },
                  featureList: 'AI Recitation Coach with live word-by-word mistake detection, Memorisation Mode with hidden verses and peeking, Test Mode, Voice Search, Hifz Plans, Streaks, Mistake Review, Activity Heatmaps, Per-Surah Strength, Juz Amma, Tafsir and Translations',
                  screenshot: 'https://www.iloveislam.life/optimized/og-image.webp',
                  author: { '@id': '#organization' },
                  publisher: { '@id': '#organization' },
                },
              ],
            }),
          }}
        />
      </head>

      <body className="min-h-full flex flex-col bg-[#F7F5EF] text-[#1C2420]">
        <a href="#main-content" className="sr-only-focusable absolute top-2 left-2 z-50 bg-white text-sm px-3 py-2 rounded-md shadow" aria-label="Skip to main content">Skip to content</a>
        <ScrollRestorer />
        <CMPConsent />
        <PWAProvider>
          <Header />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
          <InstallPrompt />
        </PWAProvider>
      </body>
    </html>
  );
}
