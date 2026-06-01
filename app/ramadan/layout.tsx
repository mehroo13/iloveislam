import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ramadan Planner 2027 — Complete Ramadan Tracker | I Love Islam',
  description:
    'Plan and track your Ramadan: daily fasts, ibadah checklist, mood, goals (Quran, Tarawih, Sadaqah), duas, and personal journal. Free, no sign‑up.',
  keywords: [
    'ramadan planner', 'ramadan tracker', 'fasting tracker', 'ramadan goals', 'ramadan calendar',
    'ramadan ibadah', 'ramadan journal', 'ramadan checklist', 'free ramadan app',
  ],
  openGraph: {
    title: 'Ramadan Planner — Daily Fasting & Ibadah Tracker | I Love Islam',
    description: 'Make the most of Ramadan with a daily tracker, goals, duas, and a personal journal.',
    url: 'https://www.iloveislam.life/ramadan-planner',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Free Islamic Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ramadan Planner | I Love Islam',
    description: 'Free Ramadan tracker with daily checklists and goals.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/ramadan-planner' },
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
      name: 'Ramadan Planner',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'A comprehensive Ramadan companion: track daily fasts, ibadah, set 30‑day goals, read duas, and maintain a personal journal. All data saved locally.',
      url: 'https://www.iloveislam.life/ramadan-planner',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://www.iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Ramadan Planner', item: 'https://www.iloveislam.life/ramadan-planner' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How can I track my fasts during Ramadan?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Use the “Today” tab to toggle your fast on or off. The calendar shows your fasting record for the whole month.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I set personal goals for Ramadan?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, track goals like completing the Quran, praying Tarawih, giving Sadaqah, and more. Progress bars update automatically as you log ibadah.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does it include Ramadan duas?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely. Essential duas for Suhoor, Iftar, and Laylatul Qadr are included in the Duas tab.',
          },
        },
      ],
    },
  ],
};

export default function RamadanPlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Making the Most of Ramadan</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Ramadan is the ninth month of the Islamic calendar and the holiest month for Muslims worldwide. It is the month in which the Holy Quran was first revealed to Prophet Muhammad (peace be upon him), and fasting during its days is the fourth pillar of Islam. Allah says: &quot;O you who have believed, decreed upon you is fasting as it was decreed upon those before you that you may become righteous&quot; (Quran 2:183).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            During Ramadan, Muslims fast from dawn (Fajr) to sunset (Maghrib), abstaining from food, drink, and other physical needs. But Ramadan is far more than just abstaining from food — it is a month of spiritual renewal, increased worship, charity, self-discipline, and drawing closer to Allah. The Prophet (peace be upon him) said: &quot;When Ramadan begins, the gates of Paradise are opened, the gates of Hell are closed, and the devils are chained&quot; (Bukhari and Muslim).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Our Ramadan Planner helps you maximize this blessed month by providing daily tracking for fasts, ibadah (worship), personal goals, and a reflective journal. Set targets for Quran completion, Tarawih prayers, Sadaqah giving, and more — then track your progress throughout the 30 days.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Features of the Ramadan Planner</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">Daily Fast Tracker:</strong> Log each day&apos;s fast with a simple toggle. View your complete fasting record on the monthly calendar at a glance.</p>
            <p><strong className="text-gray-800">Ibadah Checklist:</strong> Track daily worship activities including Tarawih, Quran reading, dhikr, dua, and voluntary prayers.</p>
            <p><strong className="text-gray-800">30-Day Goals:</strong> Set personal goals for the month (complete the Quran, pray Tarawih every night, give daily Sadaqah) and watch your progress bars fill up.</p>
            <p><strong className="text-gray-800">Essential Duas:</strong> Access important Ramadan supplications including duas for Suhoor (pre-dawn meal), Iftar (breaking fast), and Laylatul Qadr (Night of Power).</p>
            <p><strong className="text-gray-800">Personal Journal:</strong> Record daily reflections, gratitude, and spiritual insights throughout the month.</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">Tips for a Productive Ramadan</h3>
          <ul className="space-y-2 text-sm text-emerald-700 leading-relaxed">
            <li>• Set clear, achievable goals before Ramadan begins — our planner helps you define and track them</li>
            <li>• Aim to complete at least one full reading of the Quran during the month</li>
            <li>• Increase your charity — the Prophet was most generous during Ramadan</li>
            <li>• Pray Tarawih every night, especially during the last ten nights</li>
            <li>• Seek Laylatul Qadr (Night of Power) in the odd nights of the last ten days</li>
            <li>• Use the journal feature to reflect on your spiritual growth each day</li>
            <li>• All your data is saved locally — your Ramadan journey stays private</li>
          </ul>
        </div>
      </section>
    </>
  );
}