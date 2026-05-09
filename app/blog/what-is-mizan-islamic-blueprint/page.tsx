import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'What is the Mizan Islamic Life Blueprint? — I Love Islam',
  description: 'Discover how the Mizan tool uses the ancient Abjad numerology system, the 99 Names of Allah, and Quranic guidance to reveal your Islamic archetype and life purpose.',
};

export default function MizanBlogPost() {
  return (
    <div className="min-h-screen" style={{ background: '#f7f6f2' }}>
      <header style={{ background: '#0a3d2e' }} className="px-6 py-4 flex items-center gap-4">
        <Link href="/blog" className="text-white/60 hover:text-white text-sm">← Blog</Link>
        <span className="text-white/30 text-sm">What is Mizan?</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Hero */}
        <div className="rounded-2xl p-6 mb-6 text-center"
          style={{ background: 'linear-gradient(135deg, #1a0a00, #3d1f00)' }}>
          <div className="text-4xl mb-3">✦</div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xs px-2 py-1 rounded-full border border-amber-400/40 text-amber-400">Self-Discovery</span>
            <span className="text-xs text-white/30">4 min read · June 2025</span>
          </div>
          <h1 className="text-xl font-bold text-white">What is the Mizan Islamic Life Blueprint?</h1>
        </div>

        <article className="space-y-4">
          {[
            {
              heading: null,
              body: 'The Mizan Islamic Life Blueprint is a unique self-discovery tool that combines the ancient Islamic Abjad numerology system with the 99 Names of Allah and Quranic guidance to create a personalised spiritual profile based solely on your birth date.',
            },
            {
              heading: 'What is Abjad Numerology?',
              body: 'Abjad is an ancient Arabic numerical system in which each letter of the Arabic alphabet corresponds to a numerical value. Islamic scholars have used this system for centuries to find meaning in names, dates, and Quranic verses. It predates modern numerology and is deeply rooted in Islamic scholarly tradition.',
            },
            {
              heading: 'How Does Mizan Work?',
              body: 'When you enter your birth date, Mizan calculates three numbers: your Life Number (your core personality and path), your Soul Number (your inner self and emotional nature), and your Destiny Number (your mission in this life). These three numbers together determine your Islamic Archetype — one of 9 divine personality types.',
            },
            {
              heading: 'The 9 Islamic Archetypes',
              body: 'Each archetype is named in Arabic and connected to one of the 99 Names of Allah. For example, The Pioneer is connected to Al-Wahid (The One), while The Nurturer resonates with Al-Wadud (The Loving). Each archetype comes with a personalised Quranic verse, a spiritual personality reading, life purpose, wealth path, relationship style, and a recommended daily dhikr.',
            },
            {
              heading: 'Is This Islamically Appropriate?',
              body: 'Mizan is designed as a tool for self-reflection and inspiration, not as a form of fortune-telling or divination (which is forbidden in Islam). It uses the established Abjad system as a framework for self-understanding in the same way a personality test might. All results include Quranic references and Sunnah-based guidance. All final guidance should always be sought from Allah and qualified Islamic scholars.',
            },
            {
              heading: 'How is it Different from Western Numerology?',
              body: 'Unlike Western numerology which has no Islamic basis, Mizan is built entirely on Islamic foundations — the Abjad letter-number system, the Asma ul Husna (99 Names of Allah), Quranic verses, and the character types described in Islamic tradition. Every element of the tool is rooted in Islamic knowledge.',
            },
            {
              heading: 'Try Mizan Now',
              body: 'Mizan is completely free and requires no sign-up. Your data never leaves your device. Every time you enter the same birth date, you will get the exact same result — making it a consistent and reliable personal reference.',
            },
          ].map((section, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
              {section.heading && <h2 className="font-bold text-gray-800 mb-2 text-sm">{section.heading}</h2>}
              <p className="text-sm text-gray-500 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </article>

        {/* CTA */}
        <div className="mt-6 rounded-2xl p-6 text-center"
          style={{ background: 'linear-gradient(135deg, #1a0a00, #3d1f00)' }}>
          <p className="text-white font-semibold mb-2">Ready to discover your Islamic Blueprint?</p>
          <Link href="/mizan"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
            style={{ background: '#c8a96e', color: '#1a0a00' }}>
            Try Mizan Free ✦
          </Link>
        </div>

        {/* Back to blog */}
        <div className="text-center mt-6">
          <Link href="/blog" className="text-sm text-emerald-700 hover:underline">← Back to all articles</Link>
        </div>
      </main>
    </div>
  );
}
