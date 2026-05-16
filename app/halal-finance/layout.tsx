import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Halal Finance Check — Check Any Deal for Riba, Gharar & Maysir | I Love Islam',
  description:
    'Test if a loan, mortgage, investment, insurance, or crypto deal is Shariah‑compliant. Get a risk score, red flags, and halal alternatives. Free, no sign‑up.',
  keywords: [
    'halal finance check', 'islamic finance', 'shariah compliant', 'riba check', 'gharar', 'maysir',
    'halal investment', 'halal loan', 'halal mortgage', 'halal insurance', 'is it halal',
  ],
  openGraph: {
    title: 'Halal Finance Check — Test Any Financial Deal | I Love Islam',
    description: 'Answer a few questions to see if your financial deal is Shariah‑compliant.',
    url: 'https://iloveislam.life/halal-finance',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Halal Finance Check | I Love Islam',
    description: 'Free Shariah screening tool for loans, investments, and more.',
  },
  alternates: { canonical: 'https://iloveislam.life/halal-finance' },
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
      name: 'Halal Finance Check',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Quickly screen any financial transaction for Riba, Gharar, and Maysir. Provides a risk score, red flag analysis, and Shariah‑compliant alternatives.',
      url: 'https://iloveislam.life/halal-finance',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Halal Finance Check', item: 'https://iloveislam.life/halal-finance' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What does this Halal Finance Checker do?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'It asks a few specific questions about your financial deal and gives a risk assessment based on the three main prohibitions in Islamic finance: Riba (interest), Gharar (excessive uncertainty), and Maysir (gambling).',
          },
        },
        {
          '@type': 'Question',
          name: 'Can this tool replace a fatwa?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No, this is an educational tool for self‑screening. For a definitive ruling, you must consult a qualified Islamic finance scholar.',
          },
        },
        {
          '@type': 'Question',
          name: 'Which financial deals can I check?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can check loans, mortgages, investments, business deals, savings accounts, insurance policies, cryptocurrency, and rental/lease agreements.',
          },
        },
      ],
    },
  ],
};

export default function HalalFinanceCheckLayout({ children }: { children: React.ReactNode }) {
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