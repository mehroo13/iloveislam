import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hijri Calendar Converter — Gregorian to Hijri & Islamic Date Today | I Love Islam',
  description:
    'Convert any date between Gregorian and Hijri calendars. See today’s Islamic date, upcoming events, and all Hijri months. Free, no sign‑up.',
  keywords: [
    'hijri calendar', 'islamic date today', 'hijri to gregorian', 'gregorian to hijri', 'arabic date',
    'islamic calendar 1446', 'hijri months', 'today hijri date', 'hijri converter',
  ],
  openGraph: {
    title: 'Hijri Calendar Converter | I Love Islam',
    description: 'Convert dates between Gregorian and Hijri, see today’s Islamic date, and browse all Hijri months.',
    url: 'https://iloveislam.life/hijri-calendar',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hijri Calendar Converter | I Love Islam',
    description: 'Free Hijri to Gregorian date converter with Islamic events.',
  },
  alternates: { canonical: 'https://iloveislam.life/hijri-calendar' },
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
      name: 'Hijri Calendar Converter',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Convert dates between the Gregorian and Hijri calendars, view today’s Islamic date, and explore all Hijri months with their Islamic significance.',
      url: 'https://iloveislam.life/hijri-calendar',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Hijri Calendar', item: 'https://iloveislam.life/hijri-calendar' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the Hijri date today?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The tool shows today’s Hijri date automatically when you open the page. You can also convert any Gregorian or Hijri date.',
          },
        },
        {
          '@type': 'Question',
          name: 'How accurate is the Hijri conversion?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We use the Umm al‑Qura algorithm, the most widely accepted Islamic calendar. Actual dates may vary by one day depending on moon sighting.',
          },
        },
      ],
    },
  ],
};

export default function HijriCalendarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Understanding the Islamic Hijri Calendar</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            The Hijri calendar (also called the Islamic or lunar calendar) is the calendar system used by Muslims worldwide to determine religious observances, festivals, and important dates. It was established during the caliphate of Umar ibn al-Khattab (may Allah be pleased with him) and begins from the year of the Prophet Muhammad&apos;s (peace be upon him) migration (Hijrah) from Makkah to Madinah in 622 CE.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Unlike the Gregorian (solar) calendar which has 365 or 366 days, the Hijri calendar is based on lunar cycles and contains 354 or 355 days per year. Each month begins with the sighting of the new crescent moon (hilal), making it approximately 10-12 days shorter than the solar year. This means Islamic dates shift relative to the Gregorian calendar each year — which is why Ramadan, Hajj, and Eid occur at different times each solar year.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Our Hijri Calendar Converter allows you to instantly convert any date between the Gregorian and Hijri systems, view today&apos;s Islamic date, and explore the significance of each Hijri month. The tool uses the Umm al-Qura algorithm, which is the most widely accepted computational method for the Islamic calendar.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">The Twelve Months of the Hijri Calendar</h3>
          <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">1. Muharram:</strong> The first month and one of the four sacred months. The 10th of Muharram (Ashura) is a recommended day of fasting.</p>
            <p><strong className="text-gray-800">2. Safar:</strong> The second month. Contrary to pre-Islamic superstition, there is no bad omen associated with this month in Islam.</p>
            <p><strong className="text-gray-800">3. Rabi al-Awwal:</strong> The month in which the Prophet Muhammad (peace be upon him) was born and also passed away.</p>
            <p><strong className="text-gray-800">4. Rabi al-Thani:</strong> The fourth month, also known as Rabi al-Akhir.</p>
            <p><strong className="text-gray-800">5. Jumada al-Ula:</strong> The fifth month of the Islamic calendar.</p>
            <p><strong className="text-gray-800">6. Jumada al-Thani:</strong> The sixth month, also known as Jumada al-Akhirah.</p>
            <p><strong className="text-gray-800">7. Rajab:</strong> One of the four sacred months in which fighting was traditionally prohibited. The Night Journey (Isra and Mi&apos;raj) is commemorated in this month.</p>
            <p><strong className="text-gray-800">8. Sha&apos;ban:</strong> The month before Ramadan. The Prophet used to fast frequently in this month as preparation.</p>
            <p><strong className="text-gray-800">9. Ramadan:</strong> The holiest month — the month of fasting, the Quran&apos;s revelation, and Laylatul Qadr (the Night of Power).</p>
            <p><strong className="text-gray-800">10. Shawwal:</strong> The month of Eid al-Fitr (1st Shawwal). Fasting six days in Shawwal after Ramadan equals fasting the entire year.</p>
            <p><strong className="text-gray-800">11. Dhul Qi&apos;dah:</strong> One of the four sacred months and the month preceding Hajj.</p>
            <p><strong className="text-gray-800">12. Dhul Hijjah:</strong> The month of Hajj pilgrimage. The first ten days are the best days of the year. Eid al-Adha falls on the 10th.</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">Why the Hijri Calendar Matters</h3>
          <p className="text-emerald-700 text-sm leading-relaxed mb-3">
            The Hijri calendar is essential for determining the timing of all Islamic religious obligations and celebrations. Ramadan fasting, Hajj pilgrimage, Eid festivals, recommended fasting days (like Mondays, Thursdays, and the 13th-15th of each month), and the payment of Zakat are all tied to the lunar calendar.
          </p>
          <p className="text-emerald-700 text-sm leading-relaxed">
            Note that actual Hijri dates may vary by one day depending on local moon sighting practices. Some communities follow calculated calendars while others rely on physical sighting of the crescent moon. Our tool provides the calculated date based on the Umm al-Qura algorithm — always confirm with your local Islamic authority for religious observances.
          </p>
        </div>
      </section>
    </>
  );
}