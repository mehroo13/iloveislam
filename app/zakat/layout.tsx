import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zakat Calculator — Easy Islamic Wealth Tax Calculation | I Love Islam',
  description:
    'Calculate your Zakat accurately using gold & silver nisab. Supports any currency, live prices, tola/grams, and full breakdown. Free, no sign-up.',
  openGraph: {
    title: 'Zakat Calculator — Easy Islamic Wealth Tax Calculation | I Love Islam',
    description:
      'Calculate your Zakat accurately using gold & silver nisab. Supports any currency, live prices, tola/grams, and full breakdown. Free, no sign-up.',
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
        text: 'Zakat is 2.5% of your zakatable wealth above the nisab threshold (minimum amount). You add up all eligible assets (gold, silver, cash, investments, etc.), subtract immediate debts, and if the net amount exceeds the nisab (based on silver or gold), Zakat is due.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is nisab and which method should I use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nisab is the minimum wealth that makes one liable for Zakat. We use either the silver nisab (612.36g) or gold nisab (87.48g). Most scholars recommend the silver nisab because it benefits more poor people. You can choose in the settings.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I enter gold and silver in tola instead of grams?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! The calculator lets you switch between grams and tola (1 tola = 11.66g). Just select your preferred unit next to the input field.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are the gold and silver prices live?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When you enable live prices, we fetch the latest spot gold/silver prices and convert them to your chosen currency using real exchange rates. You can also manually enter prices if you prefer.',
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
      <header className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        <a href="/" className="text-sm text-emerald-700 hover:underline">
          ← Back to I Love Islam Tools
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          Free Zakat Calculator
        </h1>
        <p className="text-gray-500 mt-2 max-w-xl">
          Calculate your Zakat in seconds. Choose between gold/silver nisab, enter
          your assets in grams or tola, and get a detailed breakdown. Live gold & silver
          prices for any currency are supported.
        </p>
      </header>

      {children}

      <section className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqSchema.mainEntity.map((item) => (
            <div key={item.name}>
              <h3 className="font-medium text-gray-700">{item.name}</h3>
              <p className="text-gray-500 text-sm mt-1">
                {item.acceptedAnswer.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}