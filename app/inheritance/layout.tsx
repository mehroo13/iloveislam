import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Islamic Inheritance Calculator — Distribute Estate According to Fara\'id | I Love Islam',
  description:
    'Calculate Islamic inheritance shares based on Hanafi fiqh. Enter estate, deductions, and heirs to see exact shares for each family member. Free, no sign‑up.',
  keywords: [
    'islamic inheritance calculator', 'faraid', 'inheritance shares', 'islamic estate distribution',
    'faraid calculator', 'muslim inheritance law', 'shariah inheritance',
  ],
  openGraph: {
    title: 'Islamic Inheritance Calculator — Fara\'id Distribution | I Love Islam',
    description: 'Distribute an estate according to Islamic inheritance law. See shares for each heir.',
    url: 'https://iloveislam.life/inheritance-calculator',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inheritance Calculator | I Love Islam',
    description: 'Free Islamic inheritance calculator with step‑by‑step results.',
  },
  alternates: { canonical: 'https://iloveislam.life/inheritance-calculator' },
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
      name: 'Islamic Inheritance Calculator',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Calculate inheritance shares (Fara\'id) according to the Hanafi school. Input estate value, deductions, and living heirs to get precise monetary shares.',
      url: 'https://iloveislam.life/inheritance-calculator',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Inheritance Calculator', item: 'https://iloveislam.life/inheritance-calculator' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does Islamic inheritance work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'After funeral expenses and debts are paid, and any bequests (up to one‑third) are fulfilled, the remaining estate is distributed among heirs according to fixed shares outlined in the Quran and Sunnah.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I include multiple wives or children?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, you can enter the number of each heir type. For example, two daughters will share the daughters\' portion equally.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is this calculator legally binding?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No, this is for educational purposes only. For actual estate division, consult a qualified Islamic scholar and a local lawyer.',
          },
        },
      ],
    },
  ],
};

export default function InheritanceCalculatorLayout({ children }: { children: React.ReactNode }) {
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