import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Halal Finance Check — Test Any Deal for Riba, Gharar & Maysir | I Love Islam',
  description:
    'Check if a loan, mortgage, investment, crypto, or insurance deal is Shariah‑compliant. Answer a few questions to get a risk score and halal alternatives. Free, no sign‑up.',
  openGraph: {
    title: 'Halal Finance Check — Test Any Deal for Riba, Gharar & Maysir | I Love Islam',
    description:
      'Check if a loan, mortgage, investment, crypto, or insurance deal is Shariah‑compliant. Answer a few questions to get a risk score and halal alternatives. Free, no sign‑up.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What does this Halal Finance Checker do?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It asks a few specific questions about your financial deal (loan, investment, insurance, etc.) and gives a risk assessment based on the three main prohibitions in Islamic finance: Riba (interest), Gharar (excessive uncertainty), and Maysir (gambling). It also suggests halal alternatives.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can this replace a fatwa from a scholar?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. This is an educational tool for self‑screening. For a definitive ruling, you must consult a qualified Islamic finance scholar or Shariah board.',
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
};

export default function HalalFinanceCheckLayout({ children }: { children: React.ReactNode }) {
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