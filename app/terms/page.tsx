import Link from 'next/link';

const lastUpdated = 'November 21, 2026';

const sections = [
  {
    icon: '',
    title: '1. Acceptance of Terms',
    content:
      'By accessing and using I Love Islam (iloveislam.life), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use this website. We reserve the right to update these terms at any time, and continued use of the site constitutes acceptance of any changes.',
  },
  {
    icon: '',
    title: '2. Description of Service',
    content:
      'I Love Islam is a free AI companion for memorising the Quran: an on-device recitation coach that gives word-by-word feedback, memorisation plans, Test Mode, Voice Search, streaks and mistake review. All features are provided free of charge with no registration required.',
  },
  {
    icon: '',
    title: '3. Islamic Content Disclaimer',
    content:
      'The content provided on this website is for general informational and educational purposes only. It is not a fatwa (Islamic legal ruling) and should not be treated as such.\n\nSpecifically:\n• The recitation coach checks which words you recited — it does not check tajweed. A qualified teacher is still needed for tajweed, and the coach\'s feedback is never a substitute for one.\n• Quran text, translations and tafsir are sourced from Quran.com; translations and tafsir are scholarly works and may differ between sources.\n• Memorisation plans are study guides, not a guarantee of memorisation.\n\nFor binding religious rulings (fatwas), please consult a qualified Islamic scholar.',
  },
  {
    icon: '',
    title: '4. Acceptable Use',
    content:
      'You agree to use this website only for lawful purposes and in a manner consistent with Islamic ethics. You must not:\n\n• Use the site in any way that violates any applicable law or regulation\n• Attempt to gain unauthorized access to any part of the website\n• Use automated tools to scrape or copy content in bulk\n• Redistribute, sell, or claim ownership of our app or content\n• Use the site to spread misinformation about Islam\n• Attempt to disrupt or interfere with the website\'s operation\n• Use the site for any commercial purpose without our written consent',
  },
  {
    icon: '',
    title: '5. Intellectual Property',
    content:
      'The content, design, and code on I Love Islam are owned by I Love Islam unless otherwise stated. The Quran text displayed is the divine word of Allah ﷻ and is used for the purpose of enabling Muslims to read and learn. Arabic calligraphy and Islamic content is used with respect and for educational purposes.\n\nYou may share links to our app freely. You may not copy, reproduce, or redistribute our code or website content without permission.',
  },
  {
    icon: '',
    title: '6. Third-Party APIs and Services',
    content:
      'The app uses third-party services to function, including:\n• Quran.com API — for Quran text, translations, tafsir and reciter audio\n• Your browser\'s built-in speech recognition — for Voice Search, where available\n\nWe are not responsible for the availability, accuracy, or content of these third-party services. Interruptions in these services may temporarily affect app functionality.',
  },
  {
    icon: '',
    title: '7. Accuracy and Reliability',
    content:
      'While we strive to provide accurate and reliable feedback, I Love Islam makes no warranties or representations about the accuracy, completeness, or suitability of the information provided. The recitation coach is provided "as is" — it checks word accuracy only, never tajweed, and may occasionally mishear. We are not liable for any decisions made based on the output of the coach. Always verify important religious matters with qualified scholars and teachers.',
  },
  {
    icon: '',
    title: '8. Privacy',
    content:
      'Your privacy is important to us. Please review our Privacy Policy which explains how we collect, use, and protect your information. Key points: we do not collect personal data, your recitation audio never leaves your device, and your progress lives only in your own browser.',
  },
  {
    icon: '',
    title: '9. Advertisements',
    content:
      'I Love Islam may display advertisements through Google AdSense or similar advertising networks to help cover hosting and development costs. These ads are served by third parties and their content is not controlled by us. We strive to ensure advertisements are appropriate for a Muslim audience, but we cannot guarantee the content of all third-party ads.',
  },
  {
    icon: '',
    title: '10. Limitation of Liability',
    content:
      'To the maximum extent permitted by law, I Love Islam shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from your use of or inability to use the service, including but not limited to damages resulting from reliance on any information obtained from the website.',
  },
  {
    icon: '',
    title: '11. Changes to the Service',
    content:
      'We reserve the right to modify, suspend, or discontinue any part of the service at any time without notice. We may add new features, remove existing ones, or change how the app works. We will endeavour to maintain service continuity but cannot guarantee uninterrupted access.',
  },
  {
    icon: '',
    title: '12. Contact',
    content:
      'If you have any questions about these Terms of Service, please contact us at contact@iloveislam.life. We aim to respond within 48 hours insha\'Allah.',
  },
  {
    icon: '',
    title: '13. Governing Law',
    content:
      'These terms shall be governed by and construed in accordance with applicable law. Any disputes shall be resolved through good-faith communication. As Muslims, we encourage all disputes to be resolved through Islamic principles of fairness and justice (adl).',
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white font-serif">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white px-5 py-5 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/70 hover:text-white text-sm flex items-center gap-1">
            <span>←</span> Back to the Hifz app
          </Link>
          <h1 className="text-xl font-bold tracking-wide">Terms of Service</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 pb-20 space-y-6">
        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
          <div className="text-4xl mb-3"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Terms of Service</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            Please read these terms carefully. By using our free Hifz app, you agree to these terms.
          </p>
          <p className="text-xs text-gray-400 mt-2">Last updated: {lastUpdated}</p>
        </div>

        {/* Quick Summary */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
            <span></span> Simple Summary (Plain English)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {[
              ' All features are free and always will be',
              ' No account or sign-up required',
              ' Your data is private — we don\'t sell it',
              ' The coach checks words, not tajweed — consult a teacher',
              ' Do not copy or redistribute our app without permission',
              ' Do not use the site for unlawful purposes',
            ].map((item, i) => (
              <p key={i} className="text-sm text-emerald-700">{item}</p>
            ))}
          </div>
        </div>

        {/* Detailed Sections */}
        {sections.map((section, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50">
                {section.icon}
              </span>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-base mb-2">{section.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{section.content}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="text-center pt-6 border-t border-gray-100">
          <p className="font-arabic text-emerald-800 text-xl mb-2">بسم الله الرحمن الرحيم</p>
          <p className="text-xs text-gray-400">Made with  for the Ummah · Always Free</p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">Home</Link>
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600">Privacy Policy</Link>
            <Link href="/hifz" className="text-xs text-gray-400 hover:text-gray-600">Hifz Hub</Link>
          </div>
        </div>
      </main>
    </div>
  );
}