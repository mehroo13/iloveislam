import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us — I Love Islam',
  description: 'Learn about I Love Islam — a free collection of Islamic tools built for Muslims worldwide. Our mission, our story, and our commitment to the Ummah.',
};

export default function About() {
  return (
    <div className="min-h-screen" style={{ background: '#f7f6f2' }}>
      <header style={{ background: '#0a3d2e' }} className="px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
        <h1 className="text-white font-medium">About I Love Islam</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">

        <div style={{ background: '#0a3d2e' }} className="rounded-2xl p-6 mb-6 text-center">
          <p className="font-arabic text-3xl mb-2" style={{ color: '#c8a96e' }}>♡ I Love Islam</p>
          <p className="text-white/60 text-sm">Free Islamic Tools for Everyone</p>
        </div>

        {[
          {
            title: 'Our Mission',
            content: 'I Love Islam was built with one simple goal — to make Islamic knowledge and practice easier for every Muslim, everywhere in the world, completely for free. No sign-ups. No fees. No barriers.',
          },
          {
            title: 'What We Built',
            content: 'We have created 20+ free tools including a Zakat Calculator, Prayer Times finder, Qibla direction tool, full Quran Reader with translation, Hijri Calendar converter, Dhikr Counter, 99 Names of Allah, Mosque Finder, Halal Travel guide, and our unique Mizan Islamic Life Blueprint — all in one place.',
          },
          {
            title: 'Why We Built It',
            content: 'Muslims around the world needed a single, clean, fast, and trustworthy place to access Islamic utilities. We were inspired by tools like iLovePDF — the idea of making complex things simple — and applied that to Islamic practice.',
          },
          {
            title: 'Our Values',
            content: 'Everything on this site is free and will always remain free. We do not sell your data. We do not require registration. We believe access to Islamic tools should be a right for every Muslim, not a privilege.',
          },
          {
            title: 'Multilingual',
            content: 'We support English, Arabic, Urdu, French, Turkish, Indonesian, Malay, and Bengali — because the Ummah is global. More languages are being added regularly.',
          },
          {
            title: 'Contact Us',
            content: 'We welcome feedback, suggestions, and corrections. If you notice an error in any calculation or content, please reach out. This site belongs to the Ummah and is improved by the Ummah.',
          },
        ].map(section => (
          <div key={section.title} className="bg-white rounded-2xl border border-gray-100 p-5 mb-3">
            <h2 className="font-semibold text-gray-800 mb-2 text-sm">{section.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{section.content}</p>
          </div>
        ))}

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mt-4 text-center">
          <p className="font-arabic text-2xl mb-2" style={{ color: '#0a3d2e' }}>بسم الله الرحمن الرحيم</p>
          <p className="text-xs text-gray-500">In the name of Allah, the Most Gracious, the Most Merciful</p>
          <p className="text-xs text-gray-400 mt-2">Made with love for the Ummah · Always free</p>
        </div>
      </main>
    </div>
  );
}
