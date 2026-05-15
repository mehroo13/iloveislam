import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prayer Times — Accurate Salah Times by Location | I Love Islam',
  description: 'Get accurate daily prayer times for your city anywhere in the world. Free, no sign-up needed.',
  openGraph: {
    title: 'Prayer Times — Accurate Salah Times by Location | I Love Islam',
    description: 'Get accurate daily prayer times for your city anywhere in the world. Free, no sign-up needed.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How are prayer times calculated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We calculate prayer times using globally recognized astronomical formulas based on your geographic coordinates. You can select different calculation methods (e.g., ISNA, Umm Al-Qura) in the settings.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the prayer time tool free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, completely free. No sign-up, no ads, and it works worldwide on any device.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does this tool work on mobile?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. The page is fully responsive and works on smartphones, tablets, and desktops.',
      },
    },
  ],
};

export default function PrayerTimesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <header className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        <a href="/" className="text-sm text-emerald-700 hover:underline">
          ← Back to I Love Islam Tools
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          Prayer Times for Any City
        </h1>
        <p className="text-gray-500 mt-2 max-w-xl">
          Accurate, daily salah times based on your location or manual city search. Choose
          from seven global calculation methods. Works offline‑first once loaded and is
          completely free.
        </p>
      </header>

      {children}

      <section className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700">How are prayer times calculated?</h3>
            <p className="text-gray-500 text-sm mt-1">
              We calculate times using astronomical algorithms (sun position) based on your
              coordinates. You can switch between methods like ISNA, Muslim World League,
              Umm Al-Qura, and others to match your local mosque.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Is the tool really free?</h3>
            <p className="text-gray-500 text-sm mt-1">
              Yes, 100% free. No accounts, no ads, no subscriptions. It’s a free service for
              the global Muslim community.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Can I use it on my phone?</h3>
            <p className="text-gray-500 text-sm mt-1">
              Certainly. The page is fully responsive and works on all devices. You can even
              add it to your home screen for quick access.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}