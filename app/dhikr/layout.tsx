import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dhikr Counter — Free Islamic Tasbeeh & Zikr Tracker | I Love Islam',
  description:
    'Count daily dhikr with beautiful presets: Subhanallah, Alhamdulillah, Allahu Akbar, Salawat, Istighfar. Track streaks, history, and per‑dhikr statistics. Free, no sign‑up.',
  keywords: [
    'dhikr counter', 'tasbeeh counter', 'zikr counter', 'digital tasbih', 'islamic counter',
    'subhanallah counter', 'alhamdulillah counter', 'allahu akbar counter', 'free dhikr app',
  ],
  openGraph: {
    title: 'Dhikr Counter — Tasbeeh & Zikr Tracker | I Love Islam',
    description: 'Count your daily dhikr with beautiful presets, track streaks, and see your history.',
    url: 'https://iloveislam.life/dhikr-counter',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dhikr Counter | I Love Islam',
    description: 'Free Islamic tasbeeh counter with progress tracking.',
  },
  alternates: { canonical: 'https://iloveislam.life/dhikr-counter' },
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
      name: 'Dhikr Counter',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'A digital Islamic tasbeeh counter with preset dhikr, target tracking, session streaks, and detailed per‑dhikr statistics — all stored locally in your browser.',
      url: 'https://iloveislam.life/dhikr-counter',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Dhikr Counter', item: 'https://iloveislam.life/dhikr-counter' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What dhikr can I count with this tool?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Presets include Subhanallah, Alhamdulillah, Allahu Akbar, La ilaha illallah, Salawat, Istighfar, Ayatul Kursi, and a free mode for any custom dhikr.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does it save my progress?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, your total counts, streaks, history, and per‑dhikr stats are saved in your browser. They stay even after you close the page.',
          },
        },
      ],
    },
  ],
};

export default function DhikrCounterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">The Importance of Dhikr in Islam</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Dhikr (also spelled Zikr or Thikr) means &quot;remembrance of Allah&quot; and is one of the most beloved acts of worship in Islam. It encompasses all forms of praising, glorifying, and remembering Allah through specific phrases, supplications, and contemplation. Allah says in the Quran: &quot;Remember Me, and I will remember you&quot; (Quran 2:152) and &quot;Verily, in the remembrance of Allah do hearts find rest&quot; (Quran 13:28).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            The Prophet Muhammad (peace be upon him) encouraged Muslims to engage in dhikr at all times — after prayers, in the morning and evening, before sleep, and throughout the day. He said: &quot;Shall I not inform you of the best of your deeds, the purest in the sight of your Lord, which raises your rank to the highest, which is better for you than spending gold and silver, and better than meeting your enemy and striking their necks?&quot; The companions said: &quot;Yes, O Messenger of Allah.&quot; He said: &quot;The remembrance of Allah&quot; (Tirmidhi).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Our Dhikr Counter provides a beautiful digital tasbeeh experience with preset phrases, target tracking, session history, and streak monitoring. Whether you are completing your post-prayer adhkar or engaging in extended remembrance sessions, this tool helps you maintain consistency and track your spiritual progress.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Common Dhikr Phrases and Their Virtues</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">SubhanAllah (سبحان الله) — Glory be to Allah:</strong> Reciting this 33 times after each prayer is from the Sunnah. The Prophet said: &quot;Whoever says SubhanAllah 33 times, Alhamdulillah 33 times, and Allahu Akbar 33 times after every prayer, and completes the hundred with La ilaha illallah, his sins will be forgiven even if they are as much as the foam of the sea&quot; (Muslim).</p>
            <p><strong className="text-gray-800">Alhamdulillah (الحمد لله) — All praise is for Allah:</strong> This phrase fills the scales of good deeds on the Day of Judgment. It is said after eating, drinking, sneezing, and in gratitude for any blessing.</p>
            <p><strong className="text-gray-800">Allahu Akbar (الله أكبر) — Allah is the Greatest:</strong> This declaration of Allah&apos;s greatness is said in prayer, during the adhan, on Eid days, and as general remembrance. It reminds us that nothing in creation is greater than our Creator.</p>
            <p><strong className="text-gray-800">La ilaha illallah (لا إله إلا الله) — There is no god but Allah:</strong> The best dhikr according to the Prophet (peace be upon him). It is the declaration of monotheism (Tawhid) and the foundation of Islamic faith.</p>
            <p><strong className="text-gray-800">Astaghfirullah (أستغفر الله) — I seek forgiveness from Allah:</strong> The Prophet used to seek forgiveness more than 70 times daily. Regular istighfar brings relief from anxiety, opens doors of provision, and erases sins.</p>
            <p><strong className="text-gray-800">Salawat upon the Prophet (ﷺ):</strong> Sending blessings upon the Prophet brings ten blessings from Allah in return. It is recommended especially on Fridays and whenever his name is mentioned.</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">How to Use This Dhikr Counter</h3>
          <ul className="space-y-2 text-sm text-emerald-700 leading-relaxed">
            <li>• Select a preset dhikr or use free mode for any custom phrase</li>
            <li>• Tap anywhere on the counter area or press the spacebar to count</li>
            <li>• Set targets (33, 100, or custom) and the counter will notify you when reached</li>
            <li>• Your progress is saved automatically — come back anytime to continue</li>
            <li>• View your history to see daily, weekly, and all-time statistics</li>
            <li>• Build streaks by completing dhikr sessions on consecutive days</li>
            <li>• All data is stored locally on your device — completely private</li>
          </ul>
        </div>
      </section>
    </>
  );
}