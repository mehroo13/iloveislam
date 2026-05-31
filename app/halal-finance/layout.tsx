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
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Understanding Halal Finance in Islam</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Islamic finance is a system of financial management that operates in accordance with Shariah (Islamic law). It is built on the fundamental principle that money itself has no intrinsic value — it is merely a medium of exchange. Therefore, earning money from money (interest/riba) without productive economic activity is prohibited. Allah says clearly in the Quran: &quot;Allah has permitted trade and has forbidden interest (riba)&quot; (Quran 2:275).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            The three main prohibitions in Islamic finance are Riba (interest or usury), Gharar (excessive uncertainty or deception in contracts), and Maysir (gambling or speculation). Any financial transaction that involves one or more of these elements is considered impermissible (haram) for Muslims. Our Halal Finance Check tool helps you identify whether a specific financial deal contains any of these prohibited elements.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            This tool is designed as an educational screening aid — it asks targeted questions about your financial transaction and provides a risk assessment with specific red flags identified. It also suggests Shariah-compliant alternatives where available. However, for definitive religious rulings on complex financial matters, always consult a qualified Islamic finance scholar or Shariah board.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">The Three Prohibitions Explained</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">Riba (Interest/Usury):</strong> Any guaranteed, predetermined return on a financial transaction regardless of the outcome of the underlying activity. This includes conventional bank interest on savings and loans, credit card interest, and any fixed return that is not tied to actual profit or loss sharing. The Prophet (peace be upon him) cursed the one who consumes riba, the one who pays it, the one who records it, and the two witnesses to it (Muslim).</p>
            <p><strong className="text-gray-800">Gharar (Excessive Uncertainty):</strong> Contracts where the terms, subject matter, or outcome are excessively uncertain or ambiguous. This includes selling something you do not own, contracts with unclear terms, and transactions where one party has significantly more information than the other. Some level of uncertainty is natural in business, but excessive gharar that could lead to disputes or exploitation is prohibited.</p>
            <p><strong className="text-gray-800">Maysir (Gambling/Speculation):</strong> Any transaction where the outcome depends entirely on chance rather than productive effort. This includes conventional gambling, lottery, and highly speculative financial instruments where gains come purely from price fluctuation without underlying economic value creation.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Shariah-Compliant Alternatives</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">Instead of conventional mortgages:</strong> Murabaha (cost-plus financing), Ijara (lease-to-own), or Diminishing Musharakah (declining partnership) arrangements offered by Islamic banks.</p>
            <p><strong className="text-gray-800">Instead of interest-bearing savings:</strong> Profit-sharing accounts (Mudarabah), Islamic investment funds, or Sukuk (Islamic bonds) that share actual profits rather than paying fixed interest.</p>
            <p><strong className="text-gray-800">Instead of conventional insurance:</strong> Takaful (cooperative insurance) where participants contribute to a pool that helps members in need, with surplus returned to participants.</p>
            <p><strong className="text-gray-800">Instead of speculative trading:</strong> Equity investments in Shariah-compliant companies (screened for halal business activities and acceptable debt ratios), real estate investment, or direct business partnerships (Musharakah).</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">How to Use This Screening Tool</h3>
          <ul className="space-y-2 text-sm text-emerald-700 leading-relaxed">
            <li>• Select the type of financial deal you want to check (loan, mortgage, investment, insurance, crypto, etc.)</li>
            <li>• Answer the specific questions about the terms and conditions of your deal</li>
            <li>• Receive a risk score indicating the likelihood of Shariah non-compliance</li>
            <li>• Review identified red flags with explanations of which Islamic principles they may violate</li>
            <li>• Explore suggested halal alternatives for your specific situation</li>
            <li>• Remember: this is a screening tool, not a fatwa — consult a scholar for binding rulings</li>
          </ul>
        </div>
      </section>
    </>
  );
}