import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kaffarah Calculator — Calculate Expiation for Oaths, Fasts & More | I Love Islam',
  description:
    'Calculate the monetary equivalent or fasting days for Kaffarah of broken oaths, Zihar, accidental killing, or broken Ramadan fasts. Free, no sign‑up.',
  keywords: [
    'kaffarah calculator', 'kaffara', 'expiation', 'broken oath kaffarah', 'zihar kaffarah',
    'accidental killing kaffarah', 'ramadan fast kaffarah', 'islamic expiation', 'kaffarah amount',
  ],
  openGraph: {
    title: 'Kaffarah Calculator — Islamic Expiation Guide | I Love Islam',
    description: 'Find out what Kaffarah is required for broken oaths, Zihar, and more. Customize costs and see the total.',
    url: 'https://iloveislam.life/kaffarah-calculator',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kaffarah Calculator | I Love Islam',
    description: 'Free tool to calculate Islamic expiations.',
  },
  alternates: { canonical: 'https://iloveislam.life/kaffarah-calculator' },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Kaffarah Calculator',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Calculate the Kaffarah (expiation) for broken oaths, Zihar, accidental killing, and intentionally broken Ramadan fasts. Shows monetary equivalent based on local costs.',
      url: 'https://iloveislam.life/kaffarah-calculator',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Kaffarah Calculator', item: 'https://iloveislam.life/kaffarah-calculator' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Kaffarah?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Kaffarah is an obligatory expiation for certain sins, such as breaking an oath, Zihar, or intentionally breaking a Ramadan fast. It may involve feeding the poor, clothing them, or fasting.',
          },
        },
        {
          '@type': 'Question',
          name: 'How is the monetary value calculated?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can adjust the cost per meal or garment to match your local prices. The calculator multiplies the required number of meals/garments by the per‑unit cost and the number of occurrences.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I use this instead of asking a scholar?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'This is an educational guide. For a binding religious ruling, consult a qualified Islamic scholar.',
          },
        },
      ],
    },
  ],
};

export default function KaffarahCalculatorLayout({ children }: { children: React.ReactNode }) {
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