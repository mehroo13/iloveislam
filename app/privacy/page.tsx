import Link from 'next/link';

const sections = [
  {
    icon: '',
    title: '1. Overview',
    content:
      'I Love Islam ("we", "our", "the site") is committed to protecting your privacy. This Privacy Policy explains how we handle information when you use our website at iloveislam.life.',
  },
  {
    icon: '',
    title: '2. Data We Do NOT Collect',
    content:
      'We do not require you to create an account. We do not ask for your name, email address, phone number, or any personal information to use the Hifz app. Your recitation audio is processed on your device and never uploaded. Your memorisation progress, streak and mistake log live only in your own browser.',
  },
  {
    icon: '',
    title: '3. Local Storage',
    content:
      'The Hifz app saves your progress, settings and mistake log locally on your own device using browser localStorage. This data never leaves your device and is never sent to our servers. You can clear it at any time by clearing your browser data, or by exporting and deleting it from the My Progress page.',
  },
  {
    icon: '',
    title: '4. Third-Party APIs',
    content:
      'The app fetches Quran text, translations, tafsir and reciter audio through the Quran.com API (api.quran.com), requested from our own server so your browser talks only to iloveislam.life. Voice Search uses your browser\'s built-in speech recognition where available. These services have their own privacy policies. We send them no personal data — only the Quran reference or the words you searched for.',
  },
  {
    icon: '',
    title: '5. Analytics',
    content:
      'We may use anonymous, privacy-friendly analytics to understand how many people visit our site and which parts of the Hifz app are most used. This does not include any personally identifiable information, your recitation audio, or the words you missed.',
  },
  {
    icon: '',
    title: '6. Advertising',
    content:
      'We may display advertisements through Google AdSense. Google may use cookies to serve ads based on your prior visits to this website or other websites. You can opt out of personalized advertising by visiting Google\'s Ad Settings.',
  },
  {
    icon: '',
    title: '7. Cookies',
    content:
      'We use minimal cookies. Language preference and scroll position are stored locally. If advertisements are shown, Google AdSense may set cookies for ad personalization.',
  },
  {
    icon: '',
    title: "8. Children's Privacy",
    content:
      'Our site is suitable for all ages. We do not knowingly collect any information from children under 13.',
  },
  {
    icon: '',
    title: '9. Changes to This Policy',
    content:
      'We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated date.',
  },
  {
    icon: '',
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
            <span>←</span> Back to the Hifz app
          </Link>
          <h1 className="text-xl font-bold tracking-wide">Privacy Policy</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 pb-20 space-y-6">
        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
          <div className="text-4xl mb-3"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Privacy is Protected</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            We do not collect personal data. No registration required. The Hifz app works locally in your browser.
          </p>
          <p className="text-xs text-gray-400 mt-2">Last updated: November 2026</p>
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
          <p className="text-xs text-gray-400">Made with love for the Ummah · Always Free</p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">Home</Link>
            <Link href="/hifz" className="text-xs text-gray-400 hover:text-gray-600">Hifz Hub</Link>
            <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600">Terms</Link>
          </div>
        </div>
      </main>
    </div>
  );
}