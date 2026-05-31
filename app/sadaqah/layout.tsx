import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sadaqah Tracker — Log & Track Your Charity & Donations | I Love Islam',
  description:
    'Record every sadaqah you give. Categorise donations, set goals, maintain streaks, and get inspired by Quranic verses. Free, no sign‑up.',
  keywords: [
    'sadaqah tracker', 'charity tracker', 'donation tracker', 'sadaqah jarriyah', 'track my charity',
    'islamic charity', 'free charity app', 'sadaqah log',
  ],
  openGraph: {
    title: 'Sadaqah Tracker — Log Your Charity & Earn Rewards | I Love Islam',
    description: 'Keep a beautiful log of your sadaqah, track streaks, and see category breakdowns.',
    url: 'https://iloveislam.life/sadaqah-tracker',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sadaqah Tracker | I Love Islam',
    description: 'Free charity tracker with streaks and breakdowns.',
  },
  alternates: { canonical: 'https://iloveislam.life/sadaqah-tracker' },
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
      name: 'Sadaqah Tracker',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Log every sadaqah (charity) you give, track daily streaks, view category breakdowns, and get inspired by Quranic verses. All data saved locally in your browser.',
      url: 'https://iloveislam.life/sadaqah-tracker',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Sadaqah Tracker', item: 'https://iloveislam.life/sadaqah-tracker' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I log a sadaqah donation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Tap the floating “+ Log Sadaqah” button. Enter the amount, choose a category, add a recipient/note, and save. All data stays in your browser.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I see my charity breakdown?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! The “Breakdown” tab shows how your sadaqah is distributed across categories with progress bars and totals.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is there a reminder to give daily?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The tracker shows your current streak and encourages you to keep it alive. You’ll find Quranic inspiration in the Inspire tab.',
          },
        },
      ],
    },
  ],
};

export default function SadaqahTrackerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">The Virtue of Sadaqah in Islam</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Sadaqah (voluntary charity) is one of the most beloved deeds to Allah and one of the most effective ways to purify wealth, earn reward, and help those in need. Unlike Zakat which is obligatory, Sadaqah is voluntary and can be given in any amount, at any time, to anyone in need. The Prophet Muhammad (peace be upon him) said: &quot;Charity does not decrease wealth&quot; (Muslim) and &quot;Give charity without delay, for it stands in the way of calamity&quot; (Tirmidhi).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Sadaqah is not limited to monetary donations. The Prophet (peace be upon him) taught that every good deed is charity — a smile, removing harm from the road, speaking a kind word, helping someone in need, and even a morsel of food placed in your spouse&apos;s mouth are all forms of Sadaqah. However, financial charity holds special significance as it directly alleviates poverty and suffering.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Our Sadaqah Tracker helps you maintain a consistent habit of giving by logging every donation, tracking daily streaks, categorizing your charity, and inspiring you with Quranic verses about the rewards of generosity. All data is stored privately in your browser.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">Types of Sadaqah You Can Track</h3>
          <ul className="space-y-2 text-sm text-emerald-700 leading-relaxed">
            <li>• <strong>Monetary donations</strong> to the poor, orphans, or Islamic causes</li>
            <li>• <strong>Sadaqah Jariyah</strong> (ongoing charity) like building wells, sponsoring education, or planting trees</li>
            <li>• <strong>Food donations</strong> to food banks, neighbours, or the homeless</li>
            <li>• <strong>Clothing and goods</strong> given to those in need</li>
            <li>• <strong>Time and skills</strong> volunteered for community service</li>
            <li>• <strong>Knowledge sharing</strong> — teaching others beneficial knowledge</li>
          </ul>
        </div>
      </section>
    </>
  );
}