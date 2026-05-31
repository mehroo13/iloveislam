import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quran Reader — Read, Listen & Bookmark the Holy Quran | I Love Islam',
  description:
    'Read the Quran with Indo‑Pak Mushaf or verse‑by‑verse, listen to recitations, bookmark ayahs, and switch between English & Urdu translations. Free, no sign‑up.',
  keywords: [
    'quran reader', 'read quran online', 'quran with translation', 'quran audio', 'quran bookmarks',
    'quran english', 'quran urdu', 'al quran', 'free quran app', 'online quran recitation',
  ],
  openGraph: {
    title: 'Quran Reader — Holy Quran with Translation & Audio | I Love Islam',
    description: 'Read the Quran in Arabic with English/Urdu translation, audio recitation, and bookmarking.',
    url: 'https://iloveislam.life/quran-reader',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quran Reader | I Love Islam',
    description: 'Read, listen, and bookmark the Quran. Free forever.',
  },
  alternates: { canonical: 'https://iloveislam.life/quran-reader' },
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
      name: 'Quran Reader',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Read the Holy Quran in Arabic with Indo‑Pak Mushaf or verse‑by‑verse, listen to recitations, bookmark verses, and toggle English or Urdu translations.',
      url: 'https://iloveislam.life/quran-reader',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Quran Reader', item: 'https://iloveislam.life/quran-reader' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Can I read the Quran in English and Urdu?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, you can switch between English and Urdu translations at any time. The Arabic text is always displayed alongside.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is there audio recitation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, tap any verse to hear a renowned Qari recite it. You can also enable continuous playback for the whole surah.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do bookmarks work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Double‑tap any verse to bookmark it. Bookmarks are saved in your browser and shown in the surah list along with your last read position.',
          },
        },
      ],
    },
  ],
};

export default function QuranReaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Read the Holy Quran Online — Free Quran Reader</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            The Holy Quran is the final revelation from Allah to humanity, revealed to Prophet Muhammad (peace be upon him) over a period of 23 years through the Angel Jibreel (Gabriel). It is the primary source of guidance for over 1.8 billion Muslims worldwide, containing 114 surahs (chapters) and over 6,200 verses covering all aspects of faith, worship, morality, law, and human conduct. Allah describes it as: &quot;A guidance for mankind and clear proofs of guidance and the criterion between right and wrong&quot; (Quran 2:185).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Our Quran Reader provides a beautiful, distraction-free reading experience with the complete Arabic text alongside translations in English and Urdu. You can browse by surah, search for specific verses, listen to professional recitations, and bookmark your favourite ayahs for easy reference. The tool remembers your last reading position so you can continue where you left off.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Whether you are reading your daily portion (wird), studying a specific topic, memorizing verses, or simply seeking spiritual comfort, our Quran Reader is designed to make your interaction with the Book of Allah as smooth and meaningful as possible. The interface works beautifully on all devices, from large desktop screens to mobile phones.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Features of Our Quran Reader</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">Complete Arabic Text:</strong> The full Quran in clear, readable Arabic script with proper tajweed markings. Choose between Indo-Pak Mushaf style or verse-by-verse display.</p>
            <p><strong className="text-gray-800">Multiple Translations:</strong> Toggle between English and Urdu translations displayed alongside the Arabic text. Translations are sourced from respected scholars.</p>
            <p><strong className="text-gray-800">Audio Recitation:</strong> Listen to beautiful recitations by renowned Qaris. Tap any verse to hear it recited, or enable continuous playback for the entire surah.</p>
            <p><strong className="text-gray-800">Bookmarks and Progress:</strong> Double-tap any verse to bookmark it. Your reading position and bookmarks are saved locally in your browser for easy access.</p>
            <p><strong className="text-gray-800">Search Functionality:</strong> Search for specific words or phrases across the entire Quran to find relevant verses on any topic.</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">The Virtues of Reading Quran</h3>
          <p className="text-emerald-700 text-sm leading-relaxed mb-3">
            The Prophet Muhammad (peace be upon him) said: &quot;Read the Quran, for it will come as an intercessor for its companions on the Day of Resurrection&quot; (Muslim). He also said: &quot;The one who is proficient in the recitation of the Quran will be with the honourable and obedient scribes (angels), and the one who recites the Quran and finds it difficult, stumbling through its verses, will have a double reward&quot; (Bukhari and Muslim).
          </p>
          <p className="text-emerald-700 text-sm leading-relaxed">
            Every letter of the Quran you read earns you reward (hasanah), and each hasanah is multiplied by ten. Reading even a small portion daily builds a powerful spiritual habit that brings peace, guidance, and barakah (blessing) into your life. We encourage you to establish a daily reading routine, even if it is just a few verses.
          </p>
        </div>
      </section>
    </>
  );
}