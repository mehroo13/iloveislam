import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Islamic Inheritance Calculator — Distribute Estate According to Fara\'id | I Love Islam',
  description:
    'Calculate Islamic inheritance shares based on Hanafi fiqh. Enter estate, deductions, and heirs to see exact shares for each family member. Free, no sign‑up.',
  keywords: [
    'islamic inheritance calculator', 'faraid', 'inheritance shares', 'islamic estate distribution',
    'faraid calculator', 'muslim inheritance law', 'shariah inheritance',
  ],
  openGraph: {
    title: 'Islamic Inheritance Calculator — Fara\'id Distribution | I Love Islam',
    description: 'Distribute an estate according to Islamic inheritance law. See shares for each heir.',
    url: 'https://www.iloveislam.life/inheritance-calculator',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Free Islamic Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inheritance Calculator | I Love Islam',
    description: 'Free Islamic inheritance calculator with step‑by‑step results.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/inheritance-calculator' },
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
      name: 'Islamic Inheritance Calculator',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Calculate inheritance shares (Fara\'id) according to the Hanafi school. Input estate value, deductions, and living heirs to get precise monetary shares.',
      url: 'https://www.iloveislam.life/inheritance-calculator',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://www.iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Inheritance Calculator', item: 'https://www.iloveislam.life/inheritance-calculator' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does Islamic inheritance work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'After funeral expenses and debts are paid, and any bequests (up to one‑third) are fulfilled, the remaining estate is distributed among heirs according to fixed shares outlined in the Quran and Sunnah.',
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
    },
  ],
};

export default function InheritanceCalculatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Islamic Inheritance Law (Ilm al-Fara&apos;id)</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Islamic inheritance law (known as Ilm al-Fara&apos;id or the Science of Obligatory Shares) is one of the most detailed and precisely defined areas of Islamic jurisprudence. Allah Himself prescribed the exact shares for each heir in the Quran (Surah An-Nisa, verses 11-12 and 176), making it one of the few areas where divine legislation leaves minimal room for human interpretation. The Prophet (peace be upon him) said: &quot;Learn the laws of inheritance and teach them to people, for it is half of knowledge&quot; (Ibn Majah).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            The Islamic system of inheritance ensures that wealth is distributed fairly among family members after a person&apos;s death, preventing the concentration of wealth in one branch of the family. It recognizes the rights of spouses, children, parents, and other relatives, with each receiving a divinely prescribed share. The system also allows for a bequest (wasiyyah) of up to one-third of the estate to non-heirs or charitable causes.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Our Islamic Inheritance Calculator follows the Hanafi school of jurisprudence and helps you determine the exact share for each heir based on the estate value, deductions (funeral expenses, debts, and bequests), and the specific combination of living heirs. This is an educational tool — for actual estate division, always consult a qualified Islamic scholar and legal professional.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">How Islamic Inheritance Distribution Works</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">Step 1 — Funeral Expenses:</strong> The first deduction from the estate covers reasonable funeral and burial costs.</p>
            <p><strong className="text-gray-800">Step 2 — Debts:</strong> All outstanding debts of the deceased are paid from the estate before any distribution to heirs.</p>
            <p><strong className="text-gray-800">Step 3 — Wasiyyah (Bequest):</strong> Up to one-third of the remaining estate may be allocated according to the deceased&apos;s will, but only to non-heirs. Bequests to existing heirs require the consent of all other heirs.</p>
            <p><strong className="text-gray-800">Step 4 — Distribution to Heirs:</strong> The remaining estate is distributed according to the Quranic shares. Primary heirs (who always inherit if alive) include the spouse, parents, sons, and daughters. Secondary heirs inherit only when certain primary heirs are absent.</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-amber-800 mb-3">Important Disclaimer</h3>
          <p className="text-amber-700 text-sm leading-relaxed mb-3">
            This calculator is for educational and planning purposes only. Islamic inheritance law is complex, with many special cases (such as the grandfather-siblings problem, the Umariyyatan cases, and Awl/Radd adjustments) that require scholarly expertise. The actual distribution may also be affected by local civil laws in your country.
          </p>
          <p className="text-amber-700 text-sm leading-relaxed">
            For actual estate planning and distribution, we strongly recommend consulting both a qualified Islamic scholar (mufti) who specializes in inheritance law and a legal professional familiar with your local jurisdiction. Writing an Islamic will (wasiyyah) during your lifetime is highly recommended to ensure your estate is distributed according to Shariah.
          </p>
        </div>
      </section>
    </>
  );
}