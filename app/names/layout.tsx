import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '99 Names of Allah & Prophet Muhammad ﷺ — Learn Divine Names | I Love Islam',
  description:
    'Explore the 99 names of Allah (Asma ul Husna) and the blessed names/titles of Prophet Muhammad ﷺ with Arabic, transliteration, meaning, and benefits. Free, no sign‑up.',
  keywords: [
    '99 names of allah', 'asma ul husna', 'allah names', '99 names', 'prophet muhammad names',
    'names of prophet', 'allah 99 names list', 'asma ul husna with meaning',
  ],
  openGraph: {
    title: '99 Names of Allah & Prophet Muhammad ﷺ | I Love Islam',
    description: 'Learn the 99 beautiful names of Allah and the blessed names of Prophet Muhammad ﷺ.',
    url: 'https://iloveislam.life/names-of-allah',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '99 Names of Allah & Prophet | I Love Islam',
    description: 'Free interactive guide to divine names.',
  },
  alternates: { canonical: 'https://iloveislam.life/names-of-allah' },
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
      name: '99 Names of Allah & Prophet',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Browse and learn the 99 names of Allah (Asma ul Husna) and the blessed names of Prophet Muhammad ﷺ, each with Arabic, transliteration, meaning, and benefits.',
      url: 'https://iloveislam.life/names-of-allah',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Names of Allah & Prophet', item: 'https://iloveislam.life/names-of-allah' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What are the 99 names of Allah?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The 99 names of Allah (Asma ul Husna) are the beautiful names and attributes of Allah mentioned in the Quran and Sunnah. Memorising them is a means of entering Paradise.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does the tool include names of Prophet Muhammad ﷺ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, you can toggle between the 99 names of Allah and a collection of authentic names/titles of Prophet Muhammad ﷺ, each with Arabic, transliteration, meaning and benefits.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I learn the names in Arabic and English?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely. Each name is displayed in Arabic, with transliteration, English meaning, and a short benefit or explanation.',
          },
        },
      ],
    },
  ],
};

export default function NamesOfAllahLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">The 99 Names of Allah (Asma ul Husna)</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            The 99 Names of Allah, known as Asma ul Husna (the Most Beautiful Names), are the divine attributes and qualities of Allah mentioned throughout the Quran and authentic hadith. Each name reveals a different aspect of Allah&apos;s nature — His mercy, power, knowledge, justice, generosity, and love. Allah says: &quot;And to Allah belong the most beautiful names, so invoke Him by them&quot; (Quran 7:180).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            The Prophet Muhammad (peace be upon him) said: &quot;Allah has ninety-nine names — one hundred minus one — and whoever memorizes them (ahsaha) will enter Paradise&quot; (Bukhari and Muslim). Scholars explain that &quot;ahsaha&quot; means more than mere memorization — it includes understanding their meanings, believing in them, acting upon them, and calling upon Allah by them in supplication.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Our tool presents all 99 names with their Arabic calligraphy, transliteration, English meaning, and a brief explanation of each name&apos;s significance. You can also explore the blessed names and titles of Prophet Muhammad (peace be upon him), learning about the qualities that earned him each title.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Categories of Divine Names</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">Names of Mercy and Compassion:</strong> Ar-Rahman (The Most Gracious), Ar-Raheem (The Most Merciful), Al-Ghaffar (The Repeatedly Forgiving), Al-Wadud (The Most Loving), Al-Latif (The Subtle/Kind). These names remind us of Allah&apos;s infinite mercy that encompasses all creation.</p>
            <p><strong className="text-gray-800">Names of Power and Majesty:</strong> Al-Aziz (The Almighty), Al-Jabbar (The Compeller), Al-Qahhar (The Subduer), Al-Qadir (The All-Powerful). These names inspire awe and remind us of Allah&apos;s absolute sovereignty over all things.</p>
            <p><strong className="text-gray-800">Names of Knowledge and Wisdom:</strong> Al-Alim (The All-Knowing), Al-Hakeem (The All-Wise), Al-Khabir (The All-Aware), As-Sami (The All-Hearing), Al-Basir (The All-Seeing). Nothing escapes Allah&apos;s knowledge.</p>
            <p><strong className="text-gray-800">Names of Provision and Generosity:</strong> Ar-Razzaq (The Provider), Al-Wahhab (The Bestower), Al-Karim (The Most Generous), Al-Mughni (The Enricher). Allah provides for all creation without limit.</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">Benefits of Learning Allah&apos;s Names</h3>
          <ul className="space-y-2 text-sm text-emerald-700 leading-relaxed">
            <li>• Deepens your relationship with Allah by understanding His attributes</li>
            <li>• Enhances your dua by calling upon Allah with the most appropriate name for your need</li>
            <li>• Increases faith (iman) and consciousness of Allah (taqwa) in daily life</li>
            <li>• Provides comfort during hardship by remembering Allah&apos;s mercy and wisdom</li>
            <li>• The Prophet promised Paradise for those who truly learn and internalize these names</li>
            <li>• Helps develop good character by striving to embody divine qualities like mercy and patience</li>
          </ul>
        </div>
      </section>
    </>
  );
}