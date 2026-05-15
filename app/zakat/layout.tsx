import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zakat Calculator — Easy Islamic Wealth Tax Calculation | I Love Islam',
  description:
    'Calculate your Zakat accurately using gold & silver nisab. Supports any currency, live prices, tola/grams, and full breakdown. Free, no sign‑up.',
  openGraph: {
    title: 'Zakat Calculator — Easy Islamic Wealth Tax Calculation | I Love Islam',
    description:
      'Calculate your Zakat accurately using gold & silver nisab. Supports any currency, live prices, tola/grams, and full breakdown. Free, no sign‑up.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How is Zakat calculated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Zakat is 2.5% of your zakatable wealth above the nisab threshold. Add up gold, silver, cash, investments, and business assets, subtract immediate debts, and if the net exceeds nisab (based on silver or gold), Zakat is due.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I enter gold and silver in tola?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, the calculator lets you switch between grams and tola for both gold and silver inputs.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are gold and silver prices live?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can enable live prices, which fetch the latest spot gold/silver rates and convert them to your chosen currency using real exchange rates.',
      },
    },
  ],
};

export default function ZakatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}