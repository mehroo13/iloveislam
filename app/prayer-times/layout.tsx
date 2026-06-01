import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prayer Times — Accurate Daily Salah Times Worldwide | I Love Islam',
  description:
    'Get precise prayer times for any city. Choose calculation methods (ISNA, MWL, Umm al‑Qura) and see live countdown to the next prayer. Free, no sign‑up.',
  keywords: [
    'prayer times', 'salah times', 'namaz times', 'fajr time', 'dhuhr time', 'asr time', 'maghrib time', 'isha time',
    'islamic prayer times today', 'muslim prayer times', 'azan time', 'qibla time', 'prayer timetable',
  ],
  openGraph: {
    title: 'Prayer Times — Accurate Salah Times Worldwide | I Love Islam',
    description:
      'Get precise prayer times for any city. Choose calculation methods and see a live countdown to the next prayer.',
    url: 'https://www.iloveislam.life/prayer-times',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Free Islamic Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prayer Times | I Love Islam',
    description: 'Accurate daily prayer times for any city. Free.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/prayer-times' },
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
      name: 'Prayer Times',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Accurate Islamic prayer times for any location worldwide, with multiple calculation methods and live next-prayer countdown.',
      url: 'https://www.iloveislam.life/prayer-times',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://www.iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Prayer Times', item: 'https://www.iloveislam.life/prayer-times' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How are prayer times calculated?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Prayer times are calculated using astronomical algorithms based on your geographic coordinates. You can select from standard methods like ISNA, Muslim World League, Umm al‑Qura, and others.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I see the next prayer countdown?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, the tool highlights the next prayer and shows the time remaining. You can also see the full daily timetable.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does the prayer time tool work on mobile?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely. It’s fully responsive and works on all devices. You can even add it to your home screen.',
          },
        },
      ],
    },
  ],
};

export default function PrayerTimesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Understanding Islamic Prayer Times</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Salah (prayer) is the second pillar of Islam and the most important act of worship performed by Muslims five times daily. Each prayer has a specific time window determined by the position of the sun, and performing prayers within their prescribed times is obligatory for every adult Muslim. The Prophet Muhammad (peace be upon him) said: &quot;The first thing a person will be asked about on the Day of Judgment is their prayer&quot; (Abu Dawud).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Our Prayer Times tool calculates accurate salah times for any location worldwide using established astronomical algorithms. Simply allow location access or search for your city, and the tool will display today&apos;s complete prayer schedule including Fajr (pre-dawn), Sunrise, Dhuhr (midday), Asr (afternoon), Maghrib (sunset), and Isha (night) prayers.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            You can choose from multiple calculation methods used by different Islamic organizations around the world, including the Islamic Society of North America (ISNA), Muslim World League (MWL), Egyptian General Authority of Survey, Umm al-Qura University (Saudi Arabia), and others. Each method differs slightly in the angle used to calculate Fajr and Isha times, so choose the one most commonly followed in your region.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">The Five Daily Prayers Explained</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">Fajr (Dawn Prayer):</strong> Performed between the first light of dawn (when a white line appears on the horizon) and just before sunrise. It consists of 2 rak&apos;ah (units) of obligatory prayer. The Prophet (peace be upon him) said the two rak&apos;ah before Fajr are better than the world and everything in it.</p>
            <p><strong className="text-gray-800">Dhuhr (Midday Prayer):</strong> Begins when the sun passes its zenith (highest point) and lasts until the shadow of an object equals its length plus its shadow at noon. It consists of 4 rak&apos;ah. On Fridays, Dhuhr is replaced by Jumu&apos;ah (Friday congregational prayer) for men.</p>
            <p><strong className="text-gray-800">Asr (Afternoon Prayer):</strong> Begins when the shadow of an object exceeds its length (Hanafi) or equals its length (other schools) and lasts until sunset. It consists of 4 rak&apos;ah. The Prophet warned against missing Asr prayer specifically.</p>
            <p><strong className="text-gray-800">Maghrib (Sunset Prayer):</strong> Begins immediately after sunset and lasts until the red twilight disappears. It consists of 3 rak&apos;ah and should be prayed promptly after the adhan.</p>
            <p><strong className="text-gray-800">Isha (Night Prayer):</strong> Begins when the red or white twilight disappears and lasts until midnight (or until Fajr according to some scholars). It consists of 4 rak&apos;ah, followed by the recommended Witr prayer.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">How Prayer Times Are Calculated</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Islamic prayer times are determined by the position of the sun relative to the observer&apos;s location on Earth. Modern calculation methods use precise astronomical formulas that account for latitude, longitude, altitude, and the time of year. The key parameters that differ between calculation methods are the sun angles used for Fajr and Isha.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            For example, the Muslim World League uses 18° below the horizon for Fajr and 17° for Isha, while ISNA uses 15° for both. The Umm al-Qura method (used in Saudi Arabia) uses a fixed interval of 90 minutes after Maghrib for Isha. These differences typically result in variations of only a few minutes between methods.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Our tool uses the Aladhan API, which implements all major calculation methods with high precision. For locations at extreme latitudes (above 48°) where twilight may persist throughout the night during summer, special rules are applied to ensure reasonable prayer times year-round.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">Tips for Using This Tool</h3>
          <ul className="space-y-2 text-sm text-emerald-700 leading-relaxed">
            <li>• Enable location services for the most accurate times based on your exact position</li>
            <li>• Choose the calculation method most commonly used in your region or recommended by your local mosque</li>
            <li>• The live countdown shows time remaining until the next prayer, helping you plan your day</li>
            <li>• Prayer times change daily throughout the year as day length varies with seasons</li>
            <li>• For the most precise times, always verify with your local mosque, especially for Fajr and Isha</li>
            <li>• This tool works on all devices — you can bookmark it on your phone for quick daily access</li>
          </ul>
        </div>
      </section>
    </>
  );
}