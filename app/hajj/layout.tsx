import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hajj Checklist — Complete Step‑by‑Step Guide & Tracker | I Love Islam',
  description:
    'Prepare for Hajj with a complete checklist: from Ihram to Tawaf al‑Wada. Track your progress, save your completion, and get inspired with duas. Free, no sign‑up.',
  keywords: [
    'hajj checklist', 'hajj guide', 'hajj steps', 'hajj preparation', 'hajj tracker',
    'hajj 2025', 'hajj planner', 'free hajj checklist', 'hajj rituals',
  ],
  openGraph: {
    title: 'Hajj Checklist — Complete Step‑by‑Step Guide | I Love Islam',
    description: 'A comprehensive checklist for every day of Hajj. Track your progress and never miss a rite.',
    url: 'https://www.iloveislam.life/hajj-checklist',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Free Islamic Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hajj Checklist | I Love Islam',
    description: 'Free Hajj planner and checklist.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/hajj-checklist' },
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
      name: 'Hajj Checklist',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'A complete step‑by‑step Hajj checklist covering every day from Ihram to Tawaf al‑Wada. Track your progress with checkboxes and get essential duas.',
      url: 'https://www.iloveislam.life/hajj-checklist',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://www.iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Hajj Checklist', item: 'https://www.iloveislam.life/hajj-checklist' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What are the essential steps of Hajj?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The essential steps include Ihram, standing at Arafat (Wuquf), Tawaf al‑Ifadah, Sa’ee between Safa and Marwa, stoning the Jamarat, and sacrifice (Hadi). Use our checklist to track each step.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I track my Hajj progress?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Simply check off each task as you complete it. Your progress is saved in your browser automatically. You can see your overall completion percentage at the top.',
          },
        },
        {
          '@type': 'Question',
          name: 'What should I pack for Hajj?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Essentials include unscented toiletries, comfortable walking sandals, a prayer mat, power bank, medications, and your travel documents. Our checklist includes a full packing list.',
          },
        },
      ],
    },
  ],
};

export default function HajjChecklistLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
      <section className="max-w-3xl mx-auto px-4 py-10 pb-16 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Hajj: The Fifth Pillar of Islam</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Hajj is the annual Islamic pilgrimage to Makkah (Mecca), Saudi Arabia, and is the fifth pillar of Islam. It is obligatory once in a lifetime for every Muslim who is physically and financially able to undertake the journey. Allah says: &quot;And proclaim to the people the Hajj; they will come to you on foot and on every lean camel; they will come from every distant pass&quot; (Quran 22:27). The Prophet Muhammad (peace be upon him) said: &quot;Whoever performs Hajj and does not commit any obscenity or transgression will return free of sin, like the day his mother bore him&quot; (Bukhari).
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Hajj takes place during the 8th to 12th of Dhul Hijjah, the last month of the Islamic calendar. Millions of Muslims from every corner of the world gather in Makkah, dressed in simple white garments (Ihram), erasing all distinctions of wealth, status, and nationality. It is the largest annual gathering of people on Earth and a powerful demonstration of Muslim unity and equality before Allah.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Our Hajj Checklist tool provides a comprehensive, step-by-step guide covering every day of the pilgrimage — from entering the state of Ihram to the final Tawaf al-Wada (farewell circumambulation). You can track your progress, check off completed tasks, and access essential duas for each stage of the journey.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">The Main Rites of Hajj</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">Ihram:</strong> Entering the sacred state by making intention and wearing the prescribed garments (two white unstitched cloths for men). Certain actions become prohibited in this state, including cutting hair, using perfume, and hunting.</p>
            <p><strong className="text-gray-800">Tawaf al-Qudum:</strong> The arrival circumambulation — walking around the Kaaba seven times counter-clockwise upon arriving in Makkah.</p>
            <p><strong className="text-gray-800">Sa&apos;ee:</strong> Walking seven times between the hills of Safa and Marwa, commemorating Hajar&apos;s (may Allah be pleased with her) search for water for her son Ismail.</p>
            <p><strong className="text-gray-800">Day of Arafat (9th Dhul Hijjah):</strong> Standing at the plain of Arafat from noon to sunset — this is the most essential rite of Hajj. The Prophet said: &quot;Hajj is Arafat.&quot;</p>
            <p><strong className="text-gray-800">Muzdalifah:</strong> Spending the night under the open sky after leaving Arafat, collecting pebbles for the stoning ritual.</p>
            <p><strong className="text-gray-800">Stoning the Jamarat:</strong> Throwing pebbles at the three pillars in Mina, symbolizing the rejection of Satan&apos;s temptation.</p>
            <p><strong className="text-gray-800">Sacrifice (Hadi):</strong> Offering an animal sacrifice on the 10th of Dhul Hijjah (Eid al-Adha), following the tradition of Prophet Ibrahim.</p>
            <p><strong className="text-gray-800">Tawaf al-Ifadah:</strong> The obligatory circumambulation performed after the stoning and sacrifice on the 10th.</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">Preparing for Your Hajj Journey</h3>
          <ul className="space-y-2 text-sm text-emerald-700 leading-relaxed">
            <li>• Start physical preparation months in advance — Hajj involves extensive walking in heat</li>
            <li>• Learn the rituals thoroughly before departure so you can focus on worship during Hajj</li>
            <li>• Settle all debts and seek forgiveness from people before leaving</li>
            <li>• Pack light but include essentials: unscented toiletries, comfortable sandals, medications, and a small prayer mat</li>
            <li>• Memorize key duas for each stage of Hajj — our checklist includes them all</li>
            <li>• Make sincere repentance and set the intention purely for the sake of Allah</li>
            <li>• Use our interactive checklist to track each step and ensure nothing is missed</li>
          </ul>
        </div>
      </section>
    </>
  );
}