import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mizan — Islamic Numerology & Life Purpose Blueprint | I Love Islam',
  description:
    'Discover your Islamic archetype, divine name, and life purpose based on your birth date. Personalised Quranic verses, rizq path, dhikr, and prophetic mirror. Free, no sign‑up.',
  keywords: [
    'mizan', 'islamic numerology', 'islamic destiny calculator', 'abjad', 'islamic archetype',
    'life purpose islam', 'spiritual blueprint', 'free mizan report',
  ],
  openGraph: {
    title: 'Mizan — Islamic Archetype & Life Purpose | I Love Islam',
    description: 'Uncover your spiritual blueprint with personalised Quranic guidance.',
    url: 'https://iloveislam.life/mizan',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mizan | I Love Islam',
    description: 'Discover your Islamic archetype and divine purpose.',
  },
  alternates: { canonical: 'https://iloveislam.life/mizan' },
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
      name: 'Mizan',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'A spiritual self‑reflection tool that maps your birth date to an Islamic archetype linked to a Divine Name, Quranic verse, daily verses, and life purpose.',
      url: 'https://iloveislam.life/mizan',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Mizan', item: 'https://iloveislam.life/mizan' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Mizan?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Mizan is an Islamic self‑reflection tool that maps your birth date to a spiritual archetype inspired by Quranic themes and the 99 Names of Allah. It offers personalised insights, daily verses, and dhikr suggestions — all computed privately in your browser.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Mizan fortune‑telling?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No, Mizan is not divination. It is a framework for self‑reflection based on patterns in creation. All guidance ultimately comes from Allah and qualified Islamic scholars.',
          },
        },
        {
          '@type': 'Question',
          name: 'How are my numbers calculated?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Your core numbers (Life, Soul, Destiny) are derived from your birth date using a reduction method reminiscent of the Abjad system. These numbers correspond to one of 9 Islamic archetypes.',
          },
        },
      ],
    },
  ],
};

export default function MizanLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">What is Mizan? — Islamic Archetype & Life Blueprint</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Mizan is a unique Islamic self-reflection tool that helps Muslims discover their spiritual archetype based on patterns in their birth date. The word &quot;Mizan&quot; (ميزان) means &quot;balance&quot; or &quot;scale&quot; in Arabic — it appears in the Quran referring to the divine balance in creation and the scales of justice on the Day of Judgement. This tool uses that concept of divine balance to help you understand your unique spiritual strengths, life purpose, and connection to Allah&apos;s names.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Using a digit-reduction method inspired by the ancient Abjad numeral system (a traditional Arabic letter-number correspondence used by Islamic scholars for centuries), Mizan maps your birth date to one of 9 Islamic archetypes. Each archetype is linked to a specific Divine Name from the 99 Names of Allah, personalized Quranic verses, a recommended dhikr practice, career guidance (rizq path), and relationship compatibility insights.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            This is NOT fortune-telling, astrology, or divination — all of which are prohibited in Islam. Mizan is a framework for self-reflection and spiritual growth. All knowledge of the unseen belongs to Allah alone. The tool is designed to inspire contemplation, encourage dhikr, and deepen your connection with the Quran. Always seek guidance from Allah and qualified Islamic scholars for important life decisions.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">The 9 Islamic Archetypes</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">1. The Pioneer (Al-Awwal):</strong> Natural leaders who forge new paths. Linked to the Divine Name Al-Wahid (The One). Like Prophet Ibrahim (AS) who stood alone for truth.</p>
            <p><strong className="text-gray-800">2. The Peacemaker (Al-Tawazun):</strong> Empathetic healers who bring harmony. Linked to Al-Lateef (The Subtle). Like Khadijah (RA) who brought peace to the Prophet.</p>
            <p><strong className="text-gray-800">3. The Illuminator (Al-Bayan):</strong> Creative communicators who inspire others. Linked to An-Nur (The Light). Gifted with expression and clarity.</p>
            <p><strong className="text-gray-800">4. The Builder (Al-Itqan):</strong> Disciplined architects of lasting structures. Linked to Al-Musawwir (The Fashioner). Patient and methodical.</p>
            <p><strong className="text-gray-800">5. The Voyager (Al-Hurriyah):</strong> Adventurous seekers of knowledge and experience. Linked to Al-Wasi (The All-Encompassing). Curious and adaptable.</p>
            <p><strong className="text-gray-800">6. The Nurturer (Al-Rahmah):</strong> Compassionate caregivers who heal communities. Linked to Ar-Rahman (The Most Gracious). Selfless and loving.</p>
            <p><strong className="text-gray-800">7. The Seeker (Al-Hikmah):</strong> Deep thinkers who pursue wisdom and truth. Linked to Al-Alim (The All-Knowing). Analytical and spiritual.</p>
            <p><strong className="text-gray-800">8. The Commander (Al-Quwwah):</strong> Powerful leaders who protect and provide. Linked to Al-Aziz (The Almighty). Strong and just.</p>
            <p><strong className="text-gray-800">9. The Completer (Al-Kamal):</strong> Wise souls who see the bigger picture. Linked to Al-Hakim (The All-Wise). Visionary and compassionate.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">How It Works — The Abjad System</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            The Abjad numeral system is an ancient method of assigning numerical values to Arabic letters, used by Islamic scholars throughout history for various purposes including chronograms (recording dates in poetry), mathematical calculations, and scholarly notation. It is NOT a form of divination — it is simply a numbering system, similar to how Roman numerals assign values to letters.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Mizan uses a simplified digit-reduction method: your birth date digits are added together repeatedly until a single digit (1-9) remains. This number corresponds to your primary archetype. Additional numbers are derived from your birth day (Soul Number) and birth month+year (Destiny Number) to provide deeper insights.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            All calculations happen entirely in your browser. No personal data is sent to any server. Your birth date and results are stored only in your browser&apos;s local storage and can be cleared at any time.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">Important Islamic Disclaimer</h3>
          <p className="text-emerald-700 text-sm leading-relaxed mb-3">
            Mizan is a tool for self-reflection and spiritual contemplation only. It is NOT a substitute for Islamic guidance, scholarly advice, or personal dua to Allah. The Prophet Muhammad (peace be upon him) warned against fortune-telling and divination — Mizan is neither of these. It is a framework that uses mathematical patterns to encourage reflection on Allah&apos;s names and Quranic themes.
          </p>
          <p className="text-emerald-700 text-sm leading-relaxed">
            All knowledge of the unseen (ilm al-ghayb) belongs exclusively to Allah. No tool, person, or system can predict your future or determine your destiny. Your life is in Allah&apos;s hands, and your success comes through faith, good deeds, and sincere dua. Use Mizan as inspiration for dhikr and Quran reflection — nothing more.
          </p>
        </div>
      </section>
    </>
  );
}