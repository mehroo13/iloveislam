import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Islamic Will Generator — Free Wasiyyah Draft in Minutes | I Love Islam',
  description:
    'Create a basic Islamic will (Wasiyyah) according to Shariah guidelines. Fill in your details, executor, charitable bequests, and print your draft for free.',
  openGraph: {
    title: 'Islamic Will Generator — Free Wasiyyah Draft in Minutes | I Love Islam',
    description:
      'Create a basic Islamic will (Wasiyyah) according to Shariah guidelines. Fill in your details, executor, charitable bequests, and print your draft for free.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is an Islamic Will (Wasiyyah)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A Wasiyyah is a will that allows a Muslim to distribute up to one‑third of their estate to non‑heirs or charity, while the remaining two‑thirds are distributed according to Islamic inheritance laws (Fara\'id). This tool helps you draft the basic structure.',
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
    {
      '@type': 'Question',
      name: 'Can I include my debts and funeral instructions?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, the form lets you list debts and appoint an executor. Funeral instructions can be added in the additional notes section.',
      },
    },
  ],
};

export default function IslamicWillLayout({ children }: { children: React.ReactNode }) {
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