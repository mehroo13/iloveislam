import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us — I Love Islam | Free AI Quran Memorisation App',
  description:
    'Learn about I Love Islam — a free AI recitation coach that helps you memorise the whole Quran: all 114 surahs and 30 juz, with hifz plans, Mushaf reading, Test Mode and Voice Search. No sign-up, no fees, private by design.',
  keywords: [
    'about i love islam', 'quran memorisation app', 'hifz app', 'AI recitation coach',
    'memorise quran free', 'mushaf app', 'quran test mode',
  ],
  openGraph: {
    title: 'About I Love Islam — Free AI Quran Memorisation App',
    description: 'A free AI recitation coach to help you memorise the Quran — the whole Quran, with plans, Mushaf reading and tests. No sign-up, no fees.',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Memorise the Quran with AI' }],
    url: 'https://www.iloveislam.life/about',
    siteName: 'I Love Islam',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About I Love Islam',
    description: 'Free AI Quran memorisation app — the whole Quran, with a coach that listens. Learn about our mission.',
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
      description: 'Learn about I Love Islam — a free AI recitation coach for memorising the Quran.',
      url: 'https://www.iloveislam.life/about',
      mainEntity: {
        '@type': 'Organization',
        name: 'I Love Islam',
        url: 'https://www.iloveislam.life',
        description: 'Free AI Quran memorisation app — recite aloud and get word-by-word feedback, with hifz plans, Mushaf reading, Test Mode and Voice Search.',
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
