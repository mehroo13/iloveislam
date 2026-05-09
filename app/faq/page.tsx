'use client';
import { useState } from 'react';
import Link from 'next/link';

const FAQS = [
  {
    category: '🌿 General',
    items: [
      {
        q: 'Is I Love Islam completely free?',
        a: 'Yes — 100% free, forever. There are no subscriptions, no premium plans, and no hidden fees. Every tool on this site is free for every Muslim worldwide, always.',
      },
      {
        q: 'Do I need to create an account or sign up?',
        a: 'No account needed. You can use every single tool without signing up or providing any personal information. Just open the tool and use it.',
      },
      {
        q: 'Does the website work on mobile phones?',
        a: 'Yes. Every tool is fully responsive and works on all devices — iPhone, Android, tablet, desktop, and laptop. We designed mobile-first so it works perfectly on small screens.',
      },
      {
        q: 'Which languages does the site support?',
        a: 'The homepage is available in 8 languages: English, Arabic (عربي), Urdu (اردو), French, Turkish, Indonesian, Malay, and Bengali. We are working to add more languages insha\'Allah.',
      },
      {
        q: 'Can I suggest a new tool?',
        a: 'Absolutely! We love hearing from the community. Go to our Contact page and select "Tool Suggestion" as the subject. We read every suggestion and many of our tools came from user ideas.',
      },
    ],
  },
  {
    category: '💰 Zakat Calculator',
    items: [
      {
        q: 'Is the Zakat calculation accurate?',
        a: 'Our Zakat calculator follows the majority Sunni (Hanafi) scholarly position — based on the Nisab threshold of 85g of gold or 595g of silver. You can choose which Nisab to apply. For complex financial situations, please consult a qualified Islamic scholar or mufti.',
      },
      {
        q: 'Which madhab does the Zakat calculator follow?',
        a: 'The calculator primarily follows the Hanafi madhab which is the most widely followed madhab globally. We note where scholarly differences exist so you can adjust accordingly.',
      },
      {
        q: 'What is the Nisab threshold?',
        a: 'Nisab is the minimum amount of wealth a Muslim must have before Zakat becomes obligatory. It equals 85 grams of gold or 595 grams of silver. Our calculator uses live gold and silver prices to calculate this automatically.',
      },
    ],
  },
  {
    category: '🕐 Prayer Times',
    items: [
      {
        q: 'Why are my prayer times different from my local mosque?',
        a: 'Prayer times vary depending on the calculation method used. Different countries and schools of thought use different methods (MWL, ISNA, Egypt, Karachi etc.). Our tool lets you select your preferred calculation method. Your local mosque may use a specific method for your region.',
      },
      {
        q: 'Does Prayer Times use my real location?',
        a: 'Yes, with your permission. We use your browser\'s GPS location to calculate accurate prayer times for your exact position. Your location is never stored on our servers — it\'s only used locally in your browser.',
      },
      {
        q: 'Can I use Prayer Times without sharing my location?',
        a: 'Yes. You can manually type your city name in the search field instead of using GPS. We will look up the coordinates for your city.',
      },
    ],
  },
  {
    category: '📖 Quran Reader',
    items: [
      {
        q: 'Which translation does the Quran Reader use?',
        a: 'We use the Muhammad Asad translation (The Message of the Quran) which is widely respected for its scholarly depth and modern English. We plan to add more translations including Yusuf Ali and Sahih International insha\'Allah.',
      },
      {
        q: 'Does the Quran Reader work offline?',
        a: 'Currently the Quran Reader requires an internet connection to load the Arabic text and translation from our API. We are working on offline support for future versions.',
      },
      {
        q: 'Can I read the Quran in Mushaf style?',
        a: 'Yes! Our Quran Reader has a Mushaf mode that shows the continuous flowing Arabic text exactly as it appears in a physical Quran, with traditional verse markers. You can switch between Mushaf mode and Verse-by-Verse mode at any time.',
      },
    ],
  },
  {
    category: '🧭 Qibla & Mosque Finder',
    items: [
      {
        q: 'How accurate is the Qibla Finder?',
        a: 'Our Qibla Finder uses your GPS coordinates and calculates the precise bearing toward the Kaaba in Makkah using the great-circle method. This is the most accurate method available. Accuracy depends on your device\'s compass calibration.',
      },
      {
        q: 'How does the Mosque Finder work?',
        a: 'The Mosque Finder uses your GPS location and searches for nearby mosques using mapping data. Results are sorted by distance. We recommend verifying prayer times with the mosque directly before visiting.',
      },
    ],
  },
  {
    category: '⚖️ Inheritance & Finance Tools',
    items: [
      {
        q: 'Is the Inheritance Calculator a legal document?',
        a: 'No. Our Inheritance Calculator is an educational tool that provides an estimate based on majority Sunni (Hanafi) fiqh principles. For actual estate distribution, you must consult a qualified Islamic scholar and a legal professional in your country. Do not use this as a legal document.',
      },
      {
        q: 'What is the Halal Finance Check?',
        a: 'The Halal Finance Check is a screening tool that helps you identify whether a financial deal, investment, loan, or savings account contains elements of Riba (interest), Gharar (uncertainty), or Maysir (gambling). It is a guide — not a fatwa. Always consult a qualified Islamic finance scholar for binding rulings.',
      },
      {
        q: 'What is Kaffarah and how does the calculator work?',
        a: 'Kaffarah is an expiation — an act performed to atone for certain sins like breaking an oath, Zihar, or intentionally breaking a Ramadan fast. Our calculator shows the steps of expiation in the correct Islamic order and calculates the monetary equivalent where applicable.',
      },
    ],
  },
  {
    category: '🔒 Privacy & Data',
    items: [
      {
        q: 'Do you collect my personal data?',
        a: 'We collect minimal anonymous data through standard web analytics (page views, country). We do not collect your name, email, or any personally identifiable information unless you contact us through the contact form. Read our full Privacy Policy for details.',
      },
      {
        q: 'Is my location data stored?',
        a: 'No. Your GPS location is only used within your browser to calculate prayer times and find nearby mosques. It is never sent to or stored on our servers.',
      },
      {
        q: 'Does the site use cookies?',
        a: 'We use minimal cookies only for language preferences and local tool settings (like your Dhikr count and saved bookmarks). These are stored in your browser\'s local storage and are never shared with third parties.',
      },
      {
        q: 'Is the Mizan tool private?',
        a: 'Yes. The Mizan Islamic Life Blueprint calculates everything entirely in your browser. Your birth date and name are never sent to our servers — they stay on your device only.',
      },
    ],
  },
  {
    category: '🐛 Technical',
    items: [
      {
        q: 'A tool is not working. What should I do?',
        a: 'First try refreshing the page. If that doesn\'t work, try clearing your browser cache (Ctrl+Shift+Delete). Some tools like Prayer Times and Quran Reader need an internet connection. If the issue persists, please Contact Us with details of which tool and what device/browser you are using.',
      },
      {
        q: 'Why is the Hadith Search not finding results?',
        a: 'The Hadith Search connects to the Sunnah.com API. Occasionally the API may be temporarily unavailable. Please try again after a few minutes. If the problem persists, contact us.',
      },
      {
        q: 'Can I use these tools on my website or app?',
        a: 'Our tools are for personal use on iloveislam.life. If you\'d like to collaborate or discuss integration, please reach out via our Contact page.',
      },
    ],
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  const total = filtered.reduce((a, c) => a + c.items.length, 0);

  return (
    <div className="min-h-screen" style={{ background: '#f7f6f2' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #0d5238 50%, #0a3d2e 100%)' }}
        className="px-4 pt-4 pb-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-8 text-white/5 text-8xl">☽</div>
          <div className="absolute bottom-4 right-8 text-white/5 text-6xl">✦</div>
        </div>
        <div className="relative z-10 flex items-center justify-between mb-6">
          <Link href="/" className="text-white/50 hover:text-white/80 text-xs transition-colors">← Back to Tools</Link>
          <div />
        </div>
        <div className="relative z-10">
          <p className="text-white/40 text-xs tracking-widest uppercase mb-2">I Love Islam</p>
          <h1 className="text-3xl font-bold text-white mb-2">Frequently Asked Questions</h1>
          <p className="text-white/50 text-sm mb-6">Everything you need to know about our Islamic tools</p>

          {/* Search */}
          <div className="max-w-lg mx-auto flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-5 py-3 backdrop-blur-sm">
            <span className="text-white/40">🔍</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="bg-transparent text-white placeholder-white/30 text-sm outline-none flex-1" />
            {search && <button onClick={() => setSearch('')} className="text-white/40 hover:text-white">✕</button>}
          </div>
          {search && (
            <p className="text-white/40 text-xs mt-2">{total} result{total !== 1 ? 's' : ''} found</p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-16">

        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-gray-700 mb-1">No questions found for "{search}"</p>
            <p className="text-gray-400 text-sm">Try different keywords or <Link href="/contact" className="text-emerald-600 underline">contact us</Link> directly.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map(cat => (
              <div key={cat.category}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400">{cat.category}</h2>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <div className="space-y-2">
                  {cat.items.map(item => (
                    <div key={item.q} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <button
                        onClick={() => setOpen(open === item.q ? null : item.q)}
                        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors">
                        <p className="text-sm font-medium text-gray-800 leading-relaxed">{item.q}</p>
                        <span className="text-gray-400 flex-shrink-0 mt-0.5 transition-transform duration-200"
                          style={{ transform: open === item.q ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          ▾
                        </span>
                      </button>
                      {open === item.q && (
                        <div className="px-5 pb-5 pt-0 border-t border-gray-50">
                          <p className="text-sm text-gray-600 leading-relaxed pt-4">{item.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Still have questions */}
        <div className="mt-10 rounded-3xl p-8 text-center text-white"
          style={{ background: 'linear-gradient(135deg, #0a3d2e, #0d5238)' }}>
          <p className="text-2xl mb-2">🤲</p>
          <h3 className="font-bold text-lg mb-2">Still have a question?</h3>
          <p className="text-white/60 text-sm mb-5">We read every message and reply within 48 hours insha'Allah</p>
          <Link href="/contact"
            className="inline-block px-6 py-3 rounded-2xl font-semibold text-sm transition-all hover:opacity-90"
            style={{ background: '#c8a96e', color: '#0a3d2e' }}>
            Contact Us →
          </Link>
        </div>

        {/* Bismillah footer */}
        <div className="text-center mt-8">
          <p className="font-arabic text-emerald-800 text-xl mb-1">بسم الله الرحمن الرحيم</p>
          <p className="text-xs text-gray-400">Made with ❤️ for the Ummah · Always Free · No Sign-up</p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">Home</Link>
            <Link href="/about" className="text-xs text-gray-400 hover:text-gray-600">About</Link>
            <Link href="/contact" className="text-xs text-gray-400 hover:text-gray-600">Contact</Link>
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600">Privacy</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
