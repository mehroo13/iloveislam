import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quran Reader — Read the Quran in Indo-Pak Script with Translation & Audio | I Love Islam',
  description:
    'Read the Holy Quran in the Indo-Pak script — the 15-line Mushaf style read in Pakistan, India and Bangladesh — with five English translations, audio recitation by world-renowned Qaris, Ibn Kathir tafsir, bookmarks and a 30-juz reading plan. Free, no sign-up.',
  keywords: [
    'quran reader', 'quran indo-pak script', 'indo pak mushaf', 'quran with translation',
    'quran audio', 'quran bookmarks', 'quran english', 'quran tafsir', 'ibn kathir tafsir',
    'al quran', 'free quran app', 'quran recitation', 'quran juz', 'quran reading plan',
  ],
  openGraph: {
    title: 'Quran Reader — Holy Quran in Indo-Pak Script with Translation & Audio | I Love Islam',
    description: 'Read the Quran in the Indo-Pak script with five English translations, audio recitation, Ibn Kathir tafsir and bookmarks.',
    url: 'https://www.iloveislam.life/quran',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Free Islamic Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quran Reader — Indo-Pak Script | I Love Islam',
    description: 'Read the Quran in Indo-Pak script with translation, audio, tafsir and bookmarks. Free forever.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/quran' },
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
        'Read the Holy Quran in the Indo-Pak script with five English translations, audio recitation by renowned Qaris, Ibn Kathir tafsir, bookmarks and a 30-juz reading plan.',
      url: 'https://www.iloveislam.life/quran',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://www.iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Quran Reader', item: 'https://www.iloveislam.life/quran' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Can I read the Quran in English?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, you can switch between five English translations at any time — Saheeh International, Yusuf Ali, Pickthall, Abdel Haleem and Taqi Usmani. The Arabic text is always displayed in the Indo-Pak script alongside.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is there audio recitation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, tap any verse to hear a renowned Qari recite it. You can also enable continuous playback for the whole surah, and read the Ibn Kathir tafsir for any verse.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do bookmarks work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Tap the Bookmark button on any verse to save it. Bookmarks are saved in your browser and shown in the Bookmarks tab along with your last read position.',
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
          <h2 className="text-xl font-bold text-gray-800 mb-4">Read the Holy Quran — Free Quran Reader</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            The Holy Quran is the final revelation from Allah to humanity, revealed to Prophet Muhammad (peace be upon him) over a period of 23 years through the Angel Jibreel (Gabriel). It is the primary source of guidance for over 1.8 billion Muslims worldwide, containing 114 surahs (chapters) and over 6,200 verses covering all aspects of faith, worship, morality, law, and human conduct. Allah describes it as: &quot;A guidance for mankind and clear proofs of guidance and the criterion between right and wrong&quot; (Quran 2:185).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Our Quran Reader provides a beautiful, distraction-free reading experience with the complete Arabic text in the Indo-Pak script alongside five English translations. You can browse by surah or juz, search for specific verses, listen to professional recitations, read Ibn Kathir tafsir, and bookmark your favourite ayahs for easy reference. The tool remembers your last reading position so you can continue where you left off.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Whether you are reading your daily portion (wird), studying a specific topic, memorizing verses, or simply seeking spiritual comfort, our Quran Reader is designed to make your interaction with the Book of Allah as smooth and meaningful as possible. The interface works beautifully on all devices, from large desktop screens to mobile phones.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Features of Our Quran Reader</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">Complete Arabic Text:</strong> The full Quran in the clear, readable Indo-Pak Mushaf script with proper tajweed markings, displayed verse by verse.</p>
            <p><strong className="text-gray-800">Multiple Translations:</strong> Switch between five respected English translations displayed alongside the Arabic text: Saheeh International, Yusuf Ali, Pickthall, Abdel Haleem and Taqi Usmani.</p>
            <p><strong className="text-gray-800">Audio Recitation:</strong> Listen to beautiful recitations by renowned Qaris. Tap any verse to hear it recited, or enable continuous playback for the entire surah.</p>
            <p><strong className="text-gray-800">Bookmarks and Progress:</strong> Tap “Bookmark” on any verse to save it. Your reading position and bookmarks are saved locally in your browser for easy access.</p>
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