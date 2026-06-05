import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Islam vs Other Religions — Interactive Comparison Tool | I Love Islam',
  description:
    'Compare Islam with Christianity, Judaism, Hinduism, Buddhism, Sikhism and Atheism. Explore concepts of God, prophethood, holy books, afterlife, prayer, science and more — with Quran references and dawah insights.',
  keywords: [
    'islam vs christianity', 'islam vs judaism', 'islam vs hinduism', 'islam vs buddhism',
    'compare religions', 'islam and other religions', 'religion comparison tool',
    'concept of god in islam', 'tawheed vs trinity', 'islamic dawah', 'why islam is true',
    'differences between religions', 'abrahamic religions comparison',
  ],
  openGraph: {
    title: 'Islam vs Other Religions — Interactive Comparison Tool',
    description: 'Side-by-side interactive comparison of Islam with major world religions. Topics: God, Prophets, Holy Book, Afterlife, Prayer, Science & more.',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'Islam vs Other Religions Comparison' }],
    url: 'https://www.iloveislam.life/compare-religions',
    siteName: 'I Love Islam',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Islam vs Other Religions — Interactive Comparison',
    description: 'Explore how Islam compares to Christianity, Judaism, Hinduism, Buddhism and more.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/compare-religions' },
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
      name: 'Islam vs Other Religions — Interactive Comparison Tool',
      description: 'Compare Islam with major world religions interactively.',
      url: 'https://www.iloveislam.life/compare-religions',
      mainEntity: {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'How does Islam differ from Christianity?', acceptedAnswer: { '@type': 'Answer', text: 'Islam believes in strict monotheism (Tawheed) — one God with no partners or sons. Christianity believes in the Trinity. Islam considers Jesus (Isa) a revered prophet, not the Son of God.' } },
          { '@type': 'Question', name: 'How does Islam differ from Judaism?', acceptedAnswer: { '@type': 'Answer', text: 'Both share monotheism and many prophets. Islam accepts Muhammad ﷺ as the final prophet, which Judaism does not. Islam has the Quran as the preserved final revelation.' } },
          { '@type': 'Question', name: 'How does Islam compare to Hinduism?', acceptedAnswer: { '@type': 'Answer', text: 'Islam is strictly monotheistic; Hinduism is polytheistic with many gods and goddesses. Islam rejects idol worship, which is central to many Hindu practices.' } },
        ],
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Islam vs Other Religions', item: 'https://www.iloveislam.life/compare-religions' },
      ],
    },
  ],
};

export default function CompareReligionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}