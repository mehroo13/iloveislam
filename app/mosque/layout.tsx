import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mosque Finder — Find Nearest Masjid with Live Prayer Times | I Love Islam',
  description:
    'Find mosques near you or in any city. See live daily prayer times for each masjid, get directions, and filter by distance. Free, no sign‑up.',
  keywords: [
    'mosque finder', 'find mosque near me', 'masjid locator', 'nearest mosque', 'prayer times mosque',
    'muslim place of worship', 'masjid directions',
  ],
  openGraph: {
    title: 'Mosque Finder — Nearest Masjid & Prayer Times | I Love Islam',
    description: 'Locate mosques nearby with live prayer times and directions.',
    url: 'https://www.iloveislam.life/mosque-finder',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Free Islamic Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mosque Finder | I Love Islam',
    description: 'Free mosque locator with live prayer times.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/mosque-finder' },
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
      name: 'Mosque Finder',
      applicationCategory: 'TravelApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Find mosques (masjids) near your current location or any city using OpenStreetMap data. Each mosque shows live daily prayer times calculated from the Aladhan API.',
      url: 'https://www.iloveislam.life/mosque-finder',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://www.iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Mosque Finder', item: 'https://www.iloveislam.life/mosque-finder' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How can I find mosques near me?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Tap “Use My GPS Location” or enter a city name. The tool searches OpenStreetMap for nearby mosques and shows their distance and direction.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does the mosque finder show prayer times?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! Tap on any mosque to see today’s live prayer times calculated for its exact coordinates using the Aladhan API.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I get directions to a mosque?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely. In the expanded details, use the “Get Directions” button to open Google Maps with the best route from your current location.',
          },
        },
      ],
    },
  ],
};

export default function MosqueFinderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Finding Your Nearest Mosque</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            The mosque (masjid) holds a central place in Muslim community life. It is not merely a place of prayer but a hub for education, social connection, community support, and spiritual growth. The Prophet Muhammad (peace be upon him) said: &quot;The most beloved places to Allah are the mosques&quot; (Muslim). Praying in congregation at the mosque carries 27 times more reward than praying alone (Bukhari and Muslim).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Our Mosque Finder tool helps you locate mosques near your current location or in any city worldwide. Using OpenStreetMap data, it identifies nearby masjids and displays their distance, direction, and — uniquely — live prayer times calculated for each mosque&apos;s exact coordinates. This is especially useful when travelling or when you have moved to a new area.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Simply allow GPS access or search for a city, and the tool will show you all nearby mosques sorted by distance. Tap on any mosque to see its full prayer timetable for today, and use the directions button to navigate there using your preferred maps application.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">The Importance of Congregational Prayer</h3>
          <p className="text-emerald-700 text-sm leading-relaxed mb-3">
            Islam places great emphasis on praying in congregation (jama&apos;ah) at the mosque. The Prophet (peace be upon him) said: &quot;Prayer in congregation is twenty-seven times superior to prayer offered individually&quot; (Bukhari). For men, attending the mosque for the five daily prayers is strongly encouraged (and considered obligatory by some scholars), while for women it is optional but rewarded.
          </p>
          <p className="text-emerald-700 text-sm leading-relaxed">
            Beyond the spiritual reward, regular mosque attendance builds community bonds, provides access to Islamic education, and creates a support network. Many mosques also offer Quran classes, youth programs, marriage services, funeral arrangements, and charitable activities. Finding and connecting with your local mosque is one of the most important steps in maintaining an active Islamic life.
          </p>
        </div>
      </section>
    </>
  );
}