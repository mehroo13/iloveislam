import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Islamic Inheritance Calculator — Distribute Estate According to Fara\'id | I Love Islam',
  description:
    'Calculate Islamic inheritance shares (Fara\'id) for your estate. Enter assets, deductions, and living heirs to see exact shares. Free, no sign‑up.',
  openGraph: {
    title: 'Islamic Inheritance Calculator — Distribute Estate According to Fara\'id | I Love Islam',
    description:
      'Calculate Islamic inheritance shares (Fara\'id) for your estate. Enter assets, deductions, and living heirs to see exact shares. Free, no sign‑up.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does Islamic inheritance work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'After funeral expenses and debts are paid, and any bequests (up to one‑third) are fulfilled, the remaining estate is distributed among heirs according to fixed shares outlined in the Quran and Sunnah (Fara\'id). This calculator follows the Hanafi school.',
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
};

export default function InheritanceLayout({ children }: { children: React.ReactNode }) {
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