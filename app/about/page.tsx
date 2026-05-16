import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white font-serif">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white px-5 py-5 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/70 hover:text-white text-sm flex items-center gap-1">
            <span>←</span> Back to Tools
          </Link>
          <h1 className="text-xl font-bold tracking-wide">About Us</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 pb-20 space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white rounded-2xl p-8 text-center shadow-lg">
          <p className="text-4xl mb-3">♡</p>
          <h2 className="text-2xl font-bold mb-2">I Love Islam</h2>
          <p className="text-white/80 text-sm max-w-md mx-auto leading-relaxed">
            Free Islamic tools for every Muslim — no sign‑up, no fees, no barriers.
          </p>
        </div>

        {/* Story Sections with icons */}
        {[
          {
            icon: '🎯',
            title: 'Our Mission',
            body: 'We exist to make Islamic knowledge and practice effortless for every Muslim, anywhere in the world. All tools are 100% free, forever.',
          },
          {
            icon: '🛠️',
            title: 'What We Built',
            body: 'Over 20 essential Islamic tools – from Zakat Calculator to Quran Reader, Prayer Times, Qibla Finder, Hijri Calendar, Dhikr Counter, 99 Names, and more. One clean, fast website that works on any device.',
          },
          {
            icon: '💡',
            title: 'Why We Built It',
            body: 'Muslims needed a single, reliable place to handle everyday Islamic needs. Inspired by apps like iLovePDF, we wanted to make complex things simple.',
          },
          {
            icon: '🤲',
            title: 'Our Values',
            body: 'Completely free. No data collection. No registration. We believe access to Islamic tools should be a right, not a privilege. Your privacy is sacred.',
          },
          {
            icon: '🌍',
            title: 'Multilingual',
            body: 'We support English, Arabic, Urdu, French, Turkish, Indonesian, Malay, and Bengali — because the Ummah is global. More languages are coming.',
          },
          {
            icon: '💬',
            title: 'Get In Touch',
            body: 'We welcome feedback, suggestions, and corrections. This site belongs to the Ummah and is improved by the Ummah. Contact us anytime.',
          },
        ].map((section, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50">
                {section.icon}
              </span>
              <div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{section.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{section.body}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Closing */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center shadow-sm">
          <p className="font-arabic text-2xl text-emerald-800 mb-2">بسم الله الرحمن الرحيم</p>
          <p className="text-sm text-gray-600 mb-1">In the name of Allah, the Most Gracious, the Most Merciful</p>
          <p className="text-xs text-gray-400 mt-3">Made with ❤️ for the Ummah · Always free</p>
        </div>
      </main>
    </div>
  );
}