import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Islamic Name Finder — 14,000+ Muslim Baby Names with Meanings | I Love Islam',
  description:
    'Search 14,585+ Islamic baby names for boys and girls. See Arabic script, full meanings, and origins. Filter by Quranic, Prophets, Sahaba, and more. Free, instant search.',
  keywords: [
    'islamic baby names',
    'muslim names',
    'islamic names with meanings',
    'muslim baby names 2025',
    'arabic names for boys',
    'arabic names for girls',
    'quranic names',
    'prophet names in islam',
    'sahaba names',
    'islamic name meanings arabic',
    'best muslim baby names',
  ],
  openGraph: {
    title: 'Islamic Name Finder — 14,000+ Muslim Baby Names | I Love Islam',
    description:
      'Search 14,585+ Islamic names for boys and girls with Arabic script, full meanings, and origins. Free and instant.',
    url: 'https://www.iloveislam.life/names',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Free Islamic Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Islamic Name Finder — 14,000+ Muslim Names | I Love Islam',
    description:
      'Search 14,585+ Islamic baby names with Arabic script, meanings, and origins. Free, instant search.',
  },
  alternates: {
    canonical: 'https://www.iloveislam.life/names',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Islamic Name Finder',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Search 14,585+ Islamic baby names for boys and girls with Arabic script, full meanings, and origins. Filter by Quranic names, Prophets, Sahaba, and more.',
      url: 'https://www.iloveislam.life/names',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://www.iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',              item: 'https://www.iloveislam.life'       },
        { '@type': 'ListItem', position: 2, name: 'Islamic Name Finder', item: 'https://www.iloveislam.life/names' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the best Islamic name for a baby boy?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Some of the most beloved Islamic names for boys include Muhammad, Ahmed, Ali, Omar, Ibrahim, Yusuf, and Abdullah — all names of Prophets or prominent companions. Use the search tool to explore meanings and find the name that resonates most with your family.',
          },
        },
        {
          '@type': 'Question',
          name: 'What are good Islamic names for a baby girl?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Popular Islamic names for girls include Fatima, Aisha, Maryam, Khadijah, Zainab, Noor, and Hana. These names carry deep meanings rooted in Islamic history and the Quran.',
          },
        },
        {
          '@type': 'Question',
          name: 'What does Quranic name mean?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A Quranic name is a name that appears directly in the text of the Holy Quran, or is closely derived from Quranic vocabulary. Examples include Maryam, Ibrahim, Noor, and Taha.',
          },
        },
      ],
    },
  ],
};

export default function NamesLayout({ children }: { children: React.ReactNode }) {
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