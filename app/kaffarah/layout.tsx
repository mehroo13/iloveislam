import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kaffarah Calculator — Calculate Expiation for Oaths, Fasts & More | I Love Islam',
  description:
    'Calculate the monetary equivalent or fasting days for Kaffarah of broken oaths, Zihar, accidental killing, or broken Ramadan fasts. Free, no sign‑up.',
  keywords: [
    'kaffarah calculator', 'kaffara', 'expiation', 'broken oath kaffarah', 'zihar kaffarah',
    'accidental killing kaffarah', 'ramadan fast kaffarah', 'islamic expiation', 'kaffarah amount',
  ],
  openGraph: {
    title: 'Kaffarah Calculator — Islamic Expiation Guide | I Love Islam',
    description: 'Find out what Kaffarah is required for broken oaths, Zihar, and more. Customize costs and see the total.',
    url: 'https://www.iloveislam.life/kaffarah-calculator',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Free Islamic Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kaffarah Calculator | I Love Islam',
    description: 'Free tool to calculate Islamic expiations.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/kaffarah-calculator' },
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
      name: 'Kaffarah Calculator',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Calculate the Kaffarah (expiation) for broken oaths, Zihar, accidental killing, and intentionally broken Ramadan fasts. Shows monetary equivalent based on local costs.',
      url: 'https://www.iloveislam.life/kaffarah-calculator',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://www.iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Kaffarah Calculator', item: 'https://www.iloveislam.life/kaffarah-calculator' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Kaffarah?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Kaffarah is an obligatory expiation for certain sins, such as breaking an oath, Zihar, or intentionally breaking a Ramadan fast. It may involve feeding the poor, clothing them, or fasting.',
          },
        },
        {
          '@type': 'Question',
          name: 'How is the monetary value calculated?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can adjust the cost per meal or garment to match your local prices. The calculator multiplies the required number of meals/garments by the per‑unit cost and the number of occurrences.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I use this instead of asking a scholar?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'This is an educational guide. For a binding religious ruling, consult a qualified Islamic scholar.',
          },
        },
      ],
    },
  ],
};

export default function KaffarahCalculatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Understanding Kaffarah in Islamic Law</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Kaffarah (expiation) is a mandatory act of atonement prescribed in Islamic law for certain sins and violations. It serves as both a means of seeking Allah&apos;s forgiveness and a practical way to benefit the community through feeding or clothing the poor. The concept of Kaffarah demonstrates Islam&apos;s balanced approach to sin — acknowledging human weakness while providing a clear path to redemption through specific acts of worship and charity.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            There are four main types of Kaffarah in Islamic jurisprudence: expiation for broken oaths (Quran 5:89), Zihar (a pre-Islamic form of divorce, Quran 58:3-4), accidental killing (Quran 4:92), and intentionally breaking a Ramadan fast without valid excuse. Each type has specific requirements that typically involve freeing a slave (no longer applicable), fasting for a specified number of consecutive days, or feeding/clothing a set number of poor people.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Our Kaffarah Calculator helps you determine the exact requirement for your situation, including the monetary equivalent based on local meal and clothing costs. You can customize the per-unit costs to match prices in your area and calculate for multiple occurrences.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-amber-800 mb-3">Important Reminder</h3>
          <p className="text-amber-700 text-sm leading-relaxed">
            Kaffarah is a serious religious obligation. This calculator provides general guidance based on majority scholarly positions, but your specific situation may have nuances that require scholarly consultation. If you are unsure whether Kaffarah applies to your situation, or which type is required, please consult a qualified Islamic scholar (mufti) who can assess your individual circumstances.
          </p>
        </div>
      </section>
    </>
  );
}