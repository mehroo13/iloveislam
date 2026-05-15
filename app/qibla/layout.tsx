import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Qibla Finder — Find Accurate Qibla Direction from Any Location | I Love Islam',
  description:
    'Find the exact Qibla direction from your location with our free Qibla compass. Accurate, works worldwide, and includes a live compass mode.',
  openGraph: {
    title: 'Qibla Finder — Accurate Qibla Direction from Any Location | I Love Islam',
    description:
      'Find the exact Qibla direction from your location with our free Qibla compass. Accurate, works worldwide, and includes a live compass mode.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does the Qibla finder work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We use your device GPS (or a city search) to get your latitude and longitude. Then we compute the exact bearing to the Kaaba in Mecca using the great‑circle formula. The result is shown in degrees and as a visual compass.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the Qibla direction accurate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, it’s calculated using the standard spherical Earth model. The accuracy is typically within 1°. For best results enable the live compass and hold your phone flat away from metal objects.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use this without giving location permission?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. You can search for any city in the world and we’ll show you the fixed Qibla direction. The live compass requires device orientation permission, but the static direction works without it.',
      },
    },
  ],
};

export default function QiblaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <header className="max-w-md mx-auto px-4 pt-8 pb-4">
        <a href="/" className="text-sm text-emerald-700 hover:underline">
          ← Back to I Love Islam Tools
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          Qibla Finder
        </h1>
        <p className="text-gray-500 mt-2 max-w-xl">
          Find the exact Qibla direction from your current location or any city. Includes
          a live compass, distance to Kaaba, and accurate great‑circle calculation.
        </p>
      </header>

      {children}

      <section className="max-w-md mx-auto px-4 py-10 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqSchema.mainEntity.map((item) => (
            <div key={item.name}>
              <h3 className="font-medium text-gray-700">{item.name}</h3>
              <p className="text-gray-500 text-sm mt-1">
                {item.acceptedAnswer.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}