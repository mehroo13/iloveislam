import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kaffarah Calculator — Calculate Expiation Costs for Broken Oaths & More | I Love Islam',
  description:
    'Calculate the monetary equivalent or fasting days for Kaffarah (expiation) of broken oaths, Zihar, accidental killing, or broken Ramadan fasts. Free, no sign‑up.',
  openGraph: {
    title: 'Kaffarah Calculator — Calculate Expiation Costs for Broken Oaths & More | I Love Islam',
    description:
      'Calculate the monetary equivalent or fasting days for Kaffarah (expiation) of broken oaths, Zihar, accidental killing, or broken Ramadan fasts. Free, no sign‑up.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Kaffarah?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Kaffarah is an obligatory expiation for certain sins, such as breaking an oath intentionally, Zihar, accidental killing, or breaking a Ramadan fast. It may involve feeding the poor, clothing them, freeing a slave (not applicable today), or fasting.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is the monetary value calculated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can adjust the cost per meal or garment according to your local prices. The calculator multiplies the required number of meals/garments by the per‑unit cost and the number of occurrences.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use this calculator as a fatwa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No, this is an educational tool. For a binding religious ruling, please consult a qualified Islamic scholar.',
      },
    },
  ],
};

export default function KaffarahCalculatorLayout({ children }: { children: React.ReactNode }) {
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