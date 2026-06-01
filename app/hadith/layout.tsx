import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hadith Search — Authentic Hadiths from Bukhari, Muslim & More | I Love Islam',
  description:
    'Search authentic hadiths across Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa’i, Ibn Majah. Read in English or Urdu, bookmark, and copy. Free, no sign‑up.',
  keywords: [
    'hadith search', 'search hadith', 'sahih hadith', 'bukhari hadith', 'muslim hadith', 'hadith in english',
    'hadith in urdu', 'authentic hadith', 'hadith database', 'free hadith search',
  ],
  openGraph: {
    title: 'Hadith Search — Authentic Hadiths in English & Urdu | I Love Islam',
    description: 'Search thousands of hadiths from six authentic collections. Bookmark and copy easily.',
    url: 'https://www.iloveislam.life/hadith-search',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Free Islamic Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hadith Search | I Love Islam',
    description: 'Free hadith search across six major collections.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/hadith-search' },
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
      name: 'Hadith Search',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Search authentic hadiths from Sahih Bukhari, Sahih Muslim, Abu Dawud, Tirmidhi, Nasa’i, and Ibn Majah. Supports English and Urdu translations with bookmarking.',
      url: 'https://www.iloveislam.life/hadith-search',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://www.iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Hadith Search', item: 'https://www.iloveislam.life/hadith-search' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Which hadith collections are included?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The six canonical collections: Sahih Bukhari, Sahih Muslim, Sunan Abu Dawud, Jami at‑Tirmidhi, Sunan an‑Nasa’i, and Sunan Ibn Majah.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I read hadiths in Urdu?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, you can switch between English and Urdu. The tool loads both language editions so you can toggle instantly.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I save hadiths for later?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely. Tap the bookmark icon on any hadith to save it. Your saved list appears in the “Saved” tab.',
          },
        },
      ],
    },
  ],
};

export default function HadithSearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">What Are Hadith and Why Are They Important?</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Hadith (plural: ahadith) are the recorded sayings, actions, and approvals of the Prophet Muhammad (peace be upon him). Together with the Quran, they form the two primary sources of Islamic law and guidance. While the Quran is the direct word of Allah, the hadith provide the practical demonstration of how to implement Quranic teachings in daily life. Allah says: &quot;Whatever the Messenger gives you, take it; and whatever he forbids you, abstain from it&quot; (Quran 59:7).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            The science of hadith (Ulum al-Hadith) is one of the most rigorous academic disciplines in Islamic scholarship. Each hadith consists of two parts: the isnad (chain of narrators) and the matn (text/content). Scholars meticulously verified each narrator in the chain for their character, memory, and reliability before accepting a hadith as authentic (sahih), good (hasan), or weak (da&apos;if).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Our Hadith Search tool gives you access to the six canonical collections (Kutub al-Sittah) — the most authoritative compilations of prophetic traditions accepted by Sunni Muslims. You can search by keyword, browse by collection, and read translations in both English and Urdu.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">The Six Canonical Hadith Collections</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">Sahih al-Bukhari:</strong> Compiled by Imam Muhammad ibn Ismail al-Bukhari (d. 870 CE). Considered the most authentic book after the Quran. Contains approximately 7,275 hadith (with repetitions) selected from over 600,000 narrations after rigorous verification.</p>
            <p><strong className="text-gray-800">Sahih Muslim:</strong> Compiled by Imam Muslim ibn al-Hajjaj (d. 875 CE). The second most authentic collection, known for its excellent organization by topic and avoidance of repetition. Contains approximately 7,500 hadith.</p>
            <p><strong className="text-gray-800">Sunan Abu Dawud:</strong> Compiled by Imam Abu Dawud al-Sijistani (d. 889 CE). Focuses primarily on hadith related to Islamic jurisprudence (fiqh) and legal rulings. Contains approximately 5,274 hadith.</p>
            <p><strong className="text-gray-800">Jami at-Tirmidhi:</strong> Compiled by Imam Muhammad ibn Isa at-Tirmidhi (d. 892 CE). Notable for including the grading of each hadith and mentioning different scholarly opinions on legal matters.</p>
            <p><strong className="text-gray-800">Sunan an-Nasa&apos;i:</strong> Compiled by Imam Ahmad ibn Shu&apos;ayb an-Nasa&apos;i (d. 915 CE). Known for its strict criteria of narrator authentication, considered by some scholars to be second only to the two Sahihs in authenticity.</p>
            <p><strong className="text-gray-800">Sunan Ibn Majah:</strong> Compiled by Imam Muhammad ibn Yazid Ibn Majah (d. 887 CE). Contains some unique hadith not found in the other five collections, though some are of weaker authentication.</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">How to Use This Hadith Search Tool</h3>
          <ul className="space-y-2 text-sm text-emerald-700 leading-relaxed">
            <li>• Search by keyword in English or Urdu to find relevant hadith on any topic</li>
            <li>• Filter by specific collection if you want hadith from a particular book</li>
            <li>• Toggle between English and Urdu translations with a single tap</li>
            <li>• Bookmark hadith you want to revisit — saved locally in your browser</li>
            <li>• Copy hadith text easily to share with family and friends</li>
            <li>• Each result shows the book name, chapter, and hadith number for verification</li>
          </ul>
        </div>
      </section>
    </>
  );
}