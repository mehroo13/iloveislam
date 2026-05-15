import type { Metadata } from 'next';

// ── SEO METADATA ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Zakat Calculator 2025 — Free Islamic Zakat Tool | I Love Islam',
  description:
    'Calculate your annual Zakat in seconds. Enter gold, silver, cash, savings & investments. Supports 11 currencies. Based on authentic Hanafi fiqh. Free, no sign-up.',
  keywords: [
    'zakat calculator',
    'zakat calculator 2025',
    'how much zakat do I owe',
    'nisab threshold 2025',
    'zakat on gold',
    'zakat on savings',
    'islamic finance calculator',
    'zakat hanafi',
    'zakat sunni',
    'free zakat calculator',
  ],
  openGraph: {
    title: 'Zakat Calculator 2025 — Free Islamic Zakat Tool | I Love Islam',
    description:
      'Calculate your Zakat in seconds. Supports gold, silver, cash, savings & 11 currencies. Based on authentic Hanafi fiqh.',
    url: 'https://iloveislam.life/zakat',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zakat Calculator 2025 — Free | I Love Islam',
    description:
      'Free Zakat calculator for gold, silver, cash, savings & investments. 11 currencies. Based on Hanafi fiqh.',
  },
  alternates: {
    canonical: 'https://iloveislam.life/zakat',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

// ── JSON-LD SCHEMA ────────────────────────────────────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    // SoftwareApplication schema
    {
      '@type': 'SoftwareApplication',
      name: 'Zakat Calculator',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description:
        'A free Islamic Zakat calculator supporting 11 currencies. Enter gold, silver, cash, savings, investments and debts to calculate your annual Zakat obligation based on authentic Hanafi fiqh.',
      url: 'https://iloveislam.life/zakat',
      provider: {
        '@type': 'Organization',
        name: 'I Love Islam',
        url: 'https://iloveislam.life',
      },
    },
    // BreadcrumbList schema
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Zakat Calculator', item: 'https://iloveislam.life/zakat' },
      ],
    },
    // FAQPage schema
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How much Zakat do I have to pay?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Zakat is 2.5% (one-fortieth) of your total net zakatable wealth — cash, savings, gold, silver, investments and business stock — after deducting immediate debts, provided that total exceeds the nisab threshold and a full lunar year (hawl) has passed.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the nisab for Zakat in 2025?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The nisab is the minimum wealth threshold for Zakat to become obligatory. It is equal to 87.48 g of gold or 612.36 g of silver. Most scholars recommend using the silver nisab as it is more inclusive and benefits more people in need.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Zakat due on gold jewellery?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'According to the Hanafi madhab, Zakat is due on all gold jewellery — including personal-use jewellery — because gold is an intrinsically zakatable asset. The Shafi\'i, Maliki and Hanbali schools generally exempt jewellery worn for personal use. This calculator uses the Hanafi position by default.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do I pay Zakat on money I have borrowed or owe?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Immediate debts due within the year are deducted from your total wealth before calculating Zakat. Enter your outstanding liabilities in the "Debts & Liabilities" field and they will be subtracted automatically.',
          },
        },
        {
          '@type': 'Question',
          name: 'When should I pay Zakat?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Zakat becomes due once your wealth has been above the nisab for a full lunar year (hawl — 354 days). Many Muslims choose to pay in Ramadan to benefit from multiplied reward, but it can be paid at any time once the hawl is complete.',
          },
        },
        {
          '@type': 'Question',
          name: 'Who are the 8 categories that can receive Zakat?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'According to Quran 9:60, Zakat may be given to: (1) the poor (fuqara), (2) the needy (masakin), (3) Zakat administrators, (4) those whose hearts are to be reconciled, (5) freeing captives/slaves, (6) those in debt (gharimin), (7) in the way of Allah (fi sabilillah), and (8) wayfarers (ibn al-sabil).',
          },
        },
      ],
    },
  ],
};

// ── LAYOUT ────────────────────────────────────────────────────────────────────
export default function ZakatLayout({ children }: { children: React.ReactNode }) {
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