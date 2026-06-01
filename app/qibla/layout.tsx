import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Qibla Finder — Find Accurate Qibla Direction from Anywhere | I Love Islam',
  description:
    'Find the exact Qibla direction from your location. Use GPS or search a city. Includes a live compass and distance to Kaaba. Free, no sign‑up.',
  keywords: [
    'qibla finder', 'qibla direction', 'find qibla', 'kaaba direction', 'mecca direction', 'prayer direction',
    'qibla compass', 'online qibla', 'qibla locator', 'muslim qibla',
  ],
  openGraph: {
    title: 'Qibla Finder — Find Qibla Direction from Anywhere | I Love Islam',
    description: 'Find the exact direction to the Kaaba from your current location or any city.',
    url: 'https://www.iloveislam.life/qibla',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Free Islamic Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Qibla Finder | I Love Islam',
    description: 'Free Qibla compass with live direction.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/qibla' },
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
      name: 'Qibla Finder',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Find the exact Qibla direction (towards the Kaaba in Mecca) from any location using GPS or city search, with a live compass and distance display.',
      url: 'https://www.iloveislam.life/qibla',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://www.iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Qibla Finder', item: 'https://www.iloveislam.life/qibla' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How accurate is the Qibla direction?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The Qibla is calculated using the great‑circle formula, accurate to within 1°. For best results, enable the live compass and hold your phone flat away from metal objects.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I use the Qibla finder without GPS?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, you can search for any city and the tool will show the fixed Qibla bearing. The live compass requires device orientation permission.',
          },
        },
      ],
    },
  ],
};

export default function QiblaFinderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">What is the Qibla and Why Does It Matter?</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            The Qibla is the direction that Muslims face during their daily prayers (salah). It points towards the Kaaba, the sacred cubic structure located in the centre of Masjid al-Haram in Makkah (Mecca), Saudi Arabia. Facing the Qibla is a mandatory condition for the validity of prayer in Islam, as commanded by Allah in the Quran: &quot;Turn your face toward al-Masjid al-Haram. And wherever you are, turn your faces toward it&quot; (Quran 2:144).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            The Kaaba was originally built by Prophet Ibrahim (Abraham) and his son Ismail (Ishmael), peace be upon them both, as the first house of worship dedicated to the One God. It has served as the focal point of Muslim prayer since the Prophet Muhammad (peace be upon him) was commanded to change the direction of prayer from Jerusalem to Makkah in the second year after the Hijrah (migration to Madinah).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Our Qibla Finder tool uses the great-circle calculation method to determine the shortest path from your location to the Kaaba. This is the most mathematically accurate method, providing direction precision within 1 degree. Simply enable GPS or search for your city, and the tool will instantly show you the exact bearing and cardinal direction to face during prayer.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">How the Qibla Direction is Calculated</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            The Qibla direction is calculated using spherical trigonometry — specifically the great-circle bearing formula. A great circle is the shortest path between two points on the surface of a sphere (the Earth). This method accounts for the curvature of the Earth and provides the most accurate direction regardless of your location.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            The formula takes your latitude and longitude coordinates and the coordinates of the Kaaba (21.4225°N, 39.8262°E) to calculate the initial bearing you should face. For example, from New York the Qibla is approximately 58° (ENE), from London it is approximately 119° (ESE), and from Jakarta it is approximately 295° (WNW).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Our tool also calculates the Haversine distance from your location to the Kaaba, giving you a sense of how far you are from the holiest site in Islam. The live compass feature (on supported mobile devices) overlays the Qibla direction on your device&apos;s magnetic compass for real-time guidance.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Tips for Finding Accurate Qibla Direction</h3>
          <ul className="space-y-2 text-sm text-gray-600 leading-relaxed">
            <li>• <strong>Use GPS for best accuracy:</strong> Allow location access so the tool can calculate the exact bearing from your precise position.</li>
            <li>• <strong>Calibrate your phone compass:</strong> Move your phone in a figure-8 pattern before using the live compass feature to ensure accurate readings.</li>
            <li>• <strong>Avoid magnetic interference:</strong> Keep your phone away from metal objects, magnets, and electronic devices that can affect the compass.</li>
            <li>• <strong>The static bearing is always correct:</strong> Even if the compass seems off due to interference, the mathematical bearing displayed is accurate.</li>
            <li>• <strong>Verify with landmarks:</strong> Once you know the direction, identify a fixed landmark (building, tree, mountain) in that direction for future reference.</li>
            <li>• <strong>When travelling:</strong> The Qibla direction changes as you move, so recalculate whenever you are in a new location.</li>
          </ul>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">Islamic Rulings About Facing the Qibla</h3>
          <p className="text-emerald-700 text-sm leading-relaxed mb-3">
            Scholars agree that those who can see the Kaaba must face it directly, while those far away need only face its general direction. A slight deviation is acceptable when the exact direction is uncertain. The Prophet (peace be upon him) said: &quot;What is between the East and the West is Qibla&quot; (Tirmidhi) — referring to people in Madinah where the Qibla is due south.
          </p>
          <p className="text-emerald-700 text-sm leading-relaxed">
            If you are unable to determine the Qibla direction (for example, in an unfamiliar place without tools), you should make your best effort to estimate the direction. If you later discover you were facing the wrong way, your prayer is still valid according to the majority of scholars, as Allah does not burden a soul beyond its capacity.
          </p>
        </div>
      </section>
    </>
  );
}