import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Islamic Will Generator — Create a Free Wasiyyah Draft | I Love Islam',
  description:
    'Create a basic Islamic will (Wasiyyah) in minutes. Fill in your details, executor, debts, charitable bequests, and print your draft. Free, no sign‑up.',
  keywords: [
    'islamic will', 'wasiyyah', 'free islamic will', 'islamic will template', 'islamic inheritance',
    'will generator', 'shariah will', 'muslim will', 'create wasiyyah',
  ],
  openGraph: {
    title: 'Islamic Will Generator — Free Wasiyyah Draft | I Love Islam',
    description: 'Create a basic Islamic will according to Shariah guidelines in minutes.',
    url: 'https://iloveislam.life/islamic-will',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Islamic Will Generator | I Love Islam',
    description: 'Free Islamic will draft maker.',
  },
  alternates: { canonical: 'https://iloveislam.life/islamic-will' },
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
      name: 'Islamic Will Generator',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Create a basic Islamic will (Wasiyyah) according to Shariah. Enter your details, executor, charitable bequests, and generate a printable draft.',
      url: 'https://iloveislam.life/islamic-will',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Islamic Will', item: 'https://iloveislam.life/islamic-will' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is an Islamic Will (Wasiyyah)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A Wasiyyah is a will that allows a Muslim to distribute up to one‑third of their estate to non‑heirs or charity, while the remaining two‑thirds are distributed according to Islamic inheritance laws (Fara’id).',
          },
        },
        {
          '@type': 'Question',
          name: 'Is this will legally valid?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'This is an educational template. To make it legally binding, you must consult a qualified Islamic scholar and a local lawyer to ensure it meets your country’s legal requirements.',
          },
        },
      ],
    },
  ],
};

export default function IslamicWillLayout({ children }: { children: React.ReactNode }) {
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