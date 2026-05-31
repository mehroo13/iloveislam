import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white font-serif">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white px-5 py-5 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/70 hover:text-white text-sm flex items-center gap-1">
            <span>←</span> Back to Tools
          </Link>
          <h1 className="text-xl font-bold tracking-wide">About Us</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 pb-20 space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white rounded-2xl p-8 text-center shadow-lg">
          <p className="text-4xl mb-3">♡</p>
          <h2 className="text-2xl font-bold mb-2">I Love Islam</h2>
          <p className="text-white/80 text-sm max-w-md mx-auto leading-relaxed">
            Free Islamic tools for every Muslim — no sign‑up, no fees, no barriers.
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 text-lg mb-3">Welcome to I Love Islam</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            I Love Islam is a comprehensive, free-to-use platform offering over 26 carefully crafted Islamic tools designed to support Muslims in their daily worship, spiritual growth, and practical religious needs. Whether you are looking to calculate your Zakat, find accurate prayer times, locate the Qibla direction, read the Quran with translation, or check if a food product is Halal, our platform provides everything you need in one convenient place.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            We launched this project with a simple belief: that every Muslim, regardless of their location, language, or financial situation, deserves access to reliable, well-designed Islamic tools. In a world where many apps charge subscription fees or require personal data, we chose a different path — one rooted in the Islamic principle of serving the Ummah without expecting anything in return.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Our platform is built with modern web technology, ensuring fast load times, mobile responsiveness, and offline capability for many features. Every tool is designed to be intuitive enough for anyone to use, from tech-savvy youth to elderly family members who simply want to count their daily dhikr or check prayer times.
          </p>
        </div>

        {/* Story Sections with icons */}
        {[
          {
            icon: '🎯',
            title: 'Our Mission',
            body: 'Our mission is to make Islamic knowledge and daily practice effortless for every Muslim, anywhere in the world. We believe that technology should serve faith, not complicate it. Every tool we build is guided by three principles: accuracy (sourced from authentic Islamic scholarship), accessibility (free, no sign-up, works on any device), and privacy (your data stays on your device). We aim to be the single most trusted destination for everyday Islamic tools, serving the global Ummah with excellence and sincerity.',
          },
          {
            icon: '🛠️',
            title: 'What We Offer',
            body: 'Our suite includes over 26 essential Islamic tools: Zakat Calculator with live gold prices, Prayer Times for any city worldwide, Qibla Finder with compass, Quran Reader with multiple translations, HalalScan barcode and ingredient checker, Dhikr Counter with streak tracking, Hijri Calendar converter, Hadith Search engine, Ramadan Planner, Sadaqah Tracker, Islamic Inheritance Calculator, Halal Finance Screening tool, Kaffarah Calculator, Mosque Finder, Hajj and Umrah Checklist, Islamic Will Generator, Halal Travel Guide, Islamic Names Finder with 14,000+ names, Dua Collection with 60+ authentic supplications, Night Recitation player, Eid toolkit, 99 Names of Allah, Kids Islamic Corner, and our unique Mizan Islamic Life Blueprint. Each tool is carefully researched and regularly updated.',
          },
          {
            icon: '💡',
            title: 'Why We Built It',
            body: 'The idea for I Love Islam came from a common frustration: Muslims needed multiple apps and websites to handle basic religious tasks — one for prayer times, another for Zakat, a third for Quran reading, and so on. Many of these were cluttered with ads, required accounts, or charged fees. Inspired by platforms like iLovePDF that simplify complex tasks into one clean interface, we set out to create the Islamic equivalent — a single, reliable, beautiful platform where every Muslim can find what they need without friction. We wanted to prove that Islamic tools can be both functional and beautifully designed.',
          },
          {
            icon: '🤲',
            title: 'Our Values',
            body: 'Everything we do is guided by Islamic values of service, honesty, and respect for privacy. We are completely free — no premium tiers, no hidden costs, no paywalls. We collect zero personal data — no accounts, no tracking, no selling of information. We believe access to Islamic tools is a right, not a privilege. Your privacy is sacred to us, which is why all calculations happen locally in your browser. We are transparent about our sources, our methods, and our limitations. When our tools cannot replace scholarly guidance, we say so clearly.',
          },
          {
            icon: '📚',
            title: 'Our Sources & Methodology',
            body: 'Accuracy is paramount when dealing with matters of faith. Our prayer times use the Aladhan API with established astronomical calculation methods (ISNA, Muslim World League, Umm al-Qura, and others). Quran text is sourced from verified digital Mushaf databases. Hadith content comes from authenticated collections (Bukhari, Muslim, Tirmidhi, Abu Dawud, and others) via scholarly APIs. Zakat and inheritance calculations follow majority Sunni (primarily Hanafi) fiqh positions. We always recommend consulting a qualified Islamic scholar for binding religious rulings, as our tools are educational aids, not fatwas.',
          },
          {
            icon: '🌍',
            title: 'Multilingual & Global',
            body: 'The Muslim Ummah spans every continent and speaks hundreds of languages. We currently support English, Arabic, Urdu, French, Turkish, Indonesian, Malay, and Bengali — with more languages being added regularly. Our tools work worldwide, adapting to local prayer time calculation methods, currencies for Zakat, and regional preferences. Whether you are in New York, Cairo, Karachi, Istanbul, Jakarta, or London, our tools are designed to serve you accurately.',
          },
          {
            icon: '🔒',
            title: 'Privacy & Security',
            body: 'In an age of data harvesting, we take a radically different approach. We do not require registration. We do not collect personal information. We do not use tracking cookies. Location data (used only for prayer times and Qibla) is processed entirely in your browser and never sent to our servers. Tools like the Mizan Blueprint and Dhikr Counter store progress in your browser\'s local storage — data that only you can access. We believe that your spiritual journey is between you and Allah, and no technology company should be a middleman in that relationship.',
          },
          {
            icon: '💬',
            title: 'Community & Feedback',
            body: 'I Love Islam belongs to the Ummah. We actively welcome feedback, suggestions, bug reports, and feature requests from our users. Many of our tools were built or improved based on community input. If you notice an error, have an idea for a new tool, or want to help with translations, we encourage you to reach out through our Contact page. Together, we can make this platform even more useful for Muslims everywhere. Every suggestion is read and considered carefully.',
          },
          {
            icon: '🚀',
            title: 'Our Roadmap',
            body: 'We are continuously improving and expanding our platform. Upcoming features include additional language support, enhanced offline capabilities, audio recitation for more Quran surahs, community-driven content contributions, accessibility improvements for visually impaired users, and new tools based on community requests. We are committed to long-term development and maintenance of this platform as a sadaqah jariyah (ongoing charity) for the Ummah.',
          },
          {
            icon: '❤️',
            title: 'A Labour of Love',
            body: 'This project is built and maintained as a labour of love and a form of ongoing charity (sadaqah jariyah). We hope that every prayer timed correctly, every Zakat calculated accurately, every Quran verse read, and every dhikr counted through our platform becomes a source of reward for all involved. We ask Allah to accept this effort and make it beneficial for the entire Muslim Ummah. If you find our tools helpful, please share them with family and friends — that is the best support you can give us.',
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

        {/* Footer Links */}
        <div className="text-center pt-4 border-t border-gray-100">
          <div className="flex flex-wrap justify-center gap-4 mt-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">Home</Link>
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600">Terms of Service</Link>
            <Link href="/contact" className="text-xs text-gray-400 hover:text-gray-600">Contact</Link>
            <Link href="/faq" className="text-xs text-gray-400 hover:text-gray-600">FAQ</Link>
            <Link href="/blog" className="text-xs text-gray-400 hover:text-gray-600">Blog</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
