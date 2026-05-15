import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quran Reader — Read, Listen & Bookmark the Holy Quran | I Love Islam',
  description:
    'Read the Quran with Indo‑Pak Mushaf or verse‑by‑verse, listen to recitations, bookmark ayahs, and switch between English & Urdu translations. Free, no sign‑up.',
  openGraph: {
    title: 'Quran Reader — Read, Listen & Bookmark the Holy Quran | I Love Islam',
    description:
      'Read the Quran with Indo‑Pak Mushaf or verse‑by‑verse, listen to recitations, bookmark ayahs, and switch between English & Urdu translations. Free, no sign‑up.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Can I read the Quran in Arabic and translations?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! You can view the Arabic text in the beautiful Indo‑Pak Mushaf style or verse‑by‑verse. Translations are available in both English and Urdu, which you can toggle anytime.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there audio recitation?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. Tap on any verse to play its recitation by a renowned Qari. You can also enable continuous playback to listen to the whole surah.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do bookmarks work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Double‑tap any verse to bookmark it. Your bookmarks are saved in your browser and can be accessed from the surah list. You can also resume your last read session.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the Quran reader free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, it’s completely free. No sign‑up or subscription needed. Just open and read.',
      },
    },
  ],
};

export default function QuranReaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <header className="max-w-4xl mx-auto px-4 pt-8 pb-4">
        <a href="/" className="text-sm text-emerald-700 hover:underline">
          ← Back to I Love Islam Tools
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          Al‑Quran Al‑Kareem Reader
        </h1>
        <p className="text-gray-500 mt-2">
          Read the Holy Quran in Arabic with Indo‑Pak Mushaf or verse‑by‑verse. Listen
          to recitations, add bookmarks, and switch between English & Urdu translations —
          all for free.
        </p>
      </header>

      {children}

      <section className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqSchema.mainEntity.map((item) => (
            <div key={item.name}>
              <h3 className="font-medium text-gray-700">{item.name}</h3>
              <p className="text-gray-500 text-sm mt-1">{item.acceptedAnswer.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}