import Link from 'next/link';

const sections = [
  {
    icon: '📋',
    title: '1. Overview',
    content:
      'I Love Islam ("we", "our", "the site") is committed to protecting your privacy. This Privacy Policy explains how we handle information when you use our website at iloveislam.life.',
  },
  {
    icon: '🚫',
    title: '2. Data We Do NOT Collect',
    content:
      'We do not require you to create an account. We do not ask for your name, email address, phone number, or any personal information to use any tool on this site. All calculations (Zakat, Prayer Times, Mizan Blueprint, etc.) happen in your browser.',
  },
  {
    icon: '💾',
    title: '3. Local Storage',
    content:
      'Some tools (like the Mizan Blueprint and language preference) save data locally on your own device using browser localStorage. This data never leaves your device and is never sent to our servers. You can clear it at any time by clearing your browser data.',
  },
  {
    icon: '🔗',
    title: '4. Third-Party APIs',
    content:
      'Some tools use free third-party APIs to function: Prayer Times uses Aladhan API (aladhan.com). Hijri Calendar uses Aladhan API. Quran Reader uses AlQuran Cloud API (alquran.cloud). Mosque/Halal Food search uses OpenStreetMap Overpass API. These services have their own privacy policies. We only send the minimum data needed (e.g. your city coordinates for prayer times).',
  },
  {
    icon: '📊',
    title: '5. Analytics',
    content:
      'We may use anonymous, privacy-friendly analytics to understand how many people visit our site and which tools are most used. This does not include any personally identifiable information.',
  },
  {
    icon: '🛒',
    title: '6. Advertising',
    content:
      'We may display advertisements through Google AdSense. Google may use cookies to serve ads based on your prior visits to this website or other websites. You can opt out of personalized advertising by visiting Google\'s Ad Settings.',
  },
  {
    icon: '🍪',
    title: '7. Cookies',
    content:
      'We use minimal cookies. Language preference and scroll position are stored locally. If advertisements are shown, Google AdSense may set cookies for ad personalization.',
  },
  {
    icon: '👶',
    title: "8. Children's Privacy",
    content:
      'Our site is suitable for all ages. We do not knowingly collect any information from children under 13.',
  },
  {
    icon: '📅',
    title: '9. Changes to This Policy',
    content:
      'We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated date.',
  },
  {
    icon: '✉️',
    title: '10. Contact',
    content:
      'If you have any questions about this Privacy Policy, please contact us through our website.',
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white font-serif">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white px-5 py-5 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/70 hover:text-white text-sm flex items-center gap-1">
            <span>←</span> Back to Tools
          </Link>
          <h1 className="text-xl font-bold tracking-wide">Privacy Policy</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 pb-20 space-y-6">
        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Privacy is Protected</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            We do not collect personal data. No registration required. All tools work locally in your browser.
          </p>
          <p className="text-xs text-gray-400 mt-2">Last updated: May 2026</p>
        </div>

        {/* Sections */}
        {sections.map((section, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50">
                {section.icon}
              </span>
              <div>
                <h3 className="font-bold text-gray-800 text-base mb-2">{section.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{section.content}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="text-center pt-6 border-t border-gray-100">
          <p className="font-arabic text-emerald-800 text-xl mb-2">بسم الله الرحمن الرحيم</p>
          <p className="text-xs text-gray-400">Made with ❤️ for the Ummah · Always Free</p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">Home</Link>
            <Link href="/about" className="text-xs text-gray-400 hover:text-gray-600">About</Link>
            <Link href="/contact" className="text-xs text-gray-400 hover:text-gray-600">Contact</Link>
            <Link href="/faq" className="text-xs text-gray-400 hover:text-gray-600">FAQ</Link>
          </div>
        </div>
      </main>
    </div>
  );
}