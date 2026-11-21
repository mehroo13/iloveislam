import type { Metadata } from 'next';

const SITE_URL = 'https://www.iloveislam.life';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: 'Islamic Knowledge & Guides – Free Articles on Islam | Hifz',
    template: '%s | Hifz',
  },
  description:
    'Free in-depth Islamic guides covering Zakat calculation, prayer times, Qibla direction, Quran reading, Ramadan preparation, Hajj, Umrah, halal finance, and much more. No sign-up required.',

  keywords: [
    'islamic guides',
    'learn islam',
    'zakat calculation',
    'prayer times',
    'qibla direction',
    'hijri calendar',
    '99 names of allah',
    'ramadan guide',
    'hajj guide',
    'umrah steps',
    'halal finance',
    'islamic inheritance',
    'dhikr',
    'dua',
    'quran reading',
    'wudu steps',
    'five pillars of islam',
    'sadaqah',
    'kaffarah',
    'eid guide',
    'hadith',
    'islamic names',
    'eid guide',
  ],

  authors: [{ name: 'Hifz', url: SITE_URL }],
  creator: 'Hifz',
  publisher: 'Hifz',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: `${SITE_URL}/blog`,
  },

  openGraph: {
    title: 'Islamic Knowledge & Guides | Hifz',
    description:
      'Free in-depth Islamic guides and articles. Learn about Zakat, prayer, Quran, Ramadan, Hajj, halal finance, and more.',
    url: `${SITE_URL}/blog`,
    siteName: 'Hifz',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: `${SITE_URL}/og-image-blog.jpg`,
        width: 1200,
        height: 630,
        alt: 'Islamic Knowledge & Guides – Hifz',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    site: '@iloveislam',
    creator: '@iloveislam',
    title: 'Islamic Knowledge & Guides | Hifz',
    description:
      'Free in-depth Islamic guides and articles. Learn about Zakat, prayer, Quran, Ramadan, Hajj, halal finance, and more.',
    images: [`${SITE_URL}/og-image-blog.jpg`],
  },

  category: 'religion',
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}