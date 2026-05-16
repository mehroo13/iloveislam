import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zakat Calculator — Easy & Accurate Zakat on Wealth | I Love Islam',
  description:
    'Calculate your Zakat accurately. Enter gold, silver, cash, investments & debts. Supports any currency, live gold prices, and tola/grams. Free, no sign‑up.',
  keywords: [
    'zakat calculator', 'calculate zakat', 'zakat on gold', 'zakat on silver', 'nisab', 'islamic tax',
    'zakat money', 'zakat percentage', 'zakah', 'how much zakat', 'zakat due date',
  ],
  openGraph: {
    title: 'Zakat Calculator — Easy & Accurate Zakat Calculation | I Love Islam',
    description: 'Calculate your Zakat with live gold prices, custom currency, and a detailed breakdown.',
    url: 'https://iloveislam.life/zakat',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zakat Calculator | I Love Islam',
    description: 'Free, accurate Zakat calculator with live gold prices.',
  },
  alternates: { canonical: 'https://iloveislam.life/zakat' },
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
      name: 'Zakat Calculator',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Calculate your annual Zakat obligation based on gold, silver, cash, investments, and debts. Supports any currency and live metal prices.',
      url: 'https://iloveislam.life/zakat',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Zakat Calculator', item: 'https://iloveislam.life/zakat' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How is Zakat calculated?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Zakat is 2.5% of your zakatable wealth above the nisab threshold. Add up gold, silver, cash, investments, and business assets, subtract immediate debts, and if the net exceeds the nisab (based on silver or gold), Zakat is due.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I enter gold and silver in tola?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, the calculator allows you to switch between grams and tola for both gold and silver inputs.',
          },
        },
        {
          '@type': 'Question',
          name: 'Are the gold and silver prices live?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can enable live prices, which fetch the latest spot gold/silver rates and convert them to your chosen currency.',
          },
        },
      ],
    },
  ],
};

export default function ZakatCalculatorLayout({ children }: { children: React.ReactNode }) {
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