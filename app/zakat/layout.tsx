import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zakat Calculator 2026 — Free Online Zakat Calculator | I Love Islam',
  description:
    'Calculate your Zakat accurately. Enter gold, silver, cash, investments & debts. Supports any currency, live gold prices, and tola/grams. Free, no sign‑up.',
  keywords: [
    'zakat calculator', 'calculate zakat', 'zakat on gold', 'zakat on silver', 'nisab', 'islamic tax',
    'zakat money', 'zakat percentage', 'zakah', 'how much zakat', 'zakat due date',
  ],
  openGraph: {
    title: 'Zakat Calculator — Easy & Accurate Zakat Calculation | I Love Islam',
    description: 'Calculate your Zakat with live gold prices, custom currency, and a detailed breakdown.',
    url: 'https://www.iloveislam.life/zakat',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Free Islamic Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zakat Calculator | I Love Islam',
    description: 'Free, accurate Zakat calculator with live gold prices.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/zakat' },
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
      url: 'https://www.iloveislam.life/zakat',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://www.iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Zakat Calculator', item: 'https://www.iloveislam.life/zakat' },
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
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Understanding Zakat: The Third Pillar of Islam</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Zakat is one of the five pillars of Islam and represents a mandatory form of charitable giving for every Muslim whose wealth exceeds a minimum threshold known as the Nisab. The word &quot;Zakat&quot; comes from the Arabic root meaning &quot;to purify&quot; — it purifies one&apos;s wealth and soul from greed and attachment to material possessions. Allah says in the Quran: &quot;Take from their wealth a charity by which you purify them and cause them increase&quot; (Quran 9:103).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Zakat is not simply a tax or donation — it is an act of worship that carries immense spiritual reward. It redistributes wealth within the Muslim community, ensuring that the poor and needy are cared for. The Prophet Muhammad (peace be upon him) said: &quot;Whoever pays the Zakat on his wealth will have its evil removed from him&quot; (Ibn Khuzaymah). Refusing to pay Zakat is considered a major sin in Islam.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Our Zakat Calculator helps you determine your exact Zakat obligation by accounting for all forms of zakatable wealth including gold, silver, cash savings, investments, business inventory, and debts owed to you, minus your immediate liabilities. The tool supports multiple currencies and can fetch live gold and silver prices for the most accurate calculation.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">How Zakat is Calculated</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">The Nisab Threshold:</strong> Zakat becomes obligatory when your total zakatable wealth exceeds the Nisab for a full lunar year (hawl). The Nisab is equivalent to 87.48 grams of gold or 612.36 grams of silver. Most scholars recommend using the silver Nisab as it results in a lower threshold, meaning more people qualify to pay Zakat and more wealth is distributed to the needy.</p>
            <p><strong className="text-gray-800">The Rate:</strong> The standard Zakat rate is 2.5% (1/40th) of your total zakatable wealth above the Nisab. This applies to savings, gold, silver, investments, and business assets. Agricultural produce and livestock have different rates.</p>
            <p><strong className="text-gray-800">What Counts as Zakatable Wealth:</strong> Cash in bank accounts and at home, gold and silver (jewellery included according to Hanafi fiqh), stocks and investments at market value, business inventory, money owed to you that you expect to receive, rental income saved, and cryptocurrency holdings.</p>
            <p><strong className="text-gray-800">What is Deducted:</strong> Immediate debts due within the year, essential living expenses due immediately, and business liabilities can be deducted from your total assets before calculating Zakat.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Who Receives Zakat?</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Allah specifies eight categories of Zakat recipients in the Quran (9:60): the poor (al-fuqara), the needy (al-masakin), Zakat administrators, those whose hearts are to be reconciled, freeing captives, those in debt, in the cause of Allah, and the stranded traveller. You may distribute your Zakat to any of these categories, with priority typically given to the poor and needy in your local community.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            It is important to note that Zakat cannot be given to one&apos;s parents, grandparents, children, grandchildren, or spouse, as their financial support is already an obligation. Zakat should be given to Muslims, though some scholars permit giving to non-Muslims in the category of &quot;those whose hearts are to be reconciled.&quot; Many Muslims choose to pay their Zakat during Ramadan for increased reward, though it can be paid at any time once a full lunar year has passed since your wealth exceeded the Nisab.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">Important Notes About This Calculator</h3>
          <ul className="space-y-2 text-sm text-emerald-700 leading-relaxed">
            <li>• This calculator follows the majority Hanafi position, which includes gold and silver jewellery in zakatable assets</li>
            <li>• Live gold and silver prices are fetched from market data and converted to your chosen currency</li>
            <li>• You can switch between grams and tola for gold and silver measurements</li>
            <li>• The calculator provides an estimate — for complex financial situations, consult a qualified Islamic scholar</li>
            <li>• Remember that Zakat is due after one full lunar year (hawl) of possessing wealth above the Nisab</li>
            <li>• All calculations happen locally in your browser — your financial data is never sent to any server</li>
          </ul>
        </div>
      </section>
    </>
  );
}