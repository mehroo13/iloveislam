import Link from 'next/link';

const lastUpdated = 'May 9, 2026';

const sections = [
  {
    icon: '📜',
    title: '1. Acceptance of Terms',
    content:
      'By accessing and using I Love Islam (iloveislam.life), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use this website. We reserve the right to update these terms at any time, and continued use of the site constitutes acceptance of any changes.',
  },
  {
    icon: '🛠️',
    title: '2. Description of Service',
    content:
      'I Love Islam is a free collection of Islamic tools designed for Muslims worldwide. Our tools include but are not limited to: Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Hijri Calendar, Dhikr Counter, 99 Names of Allah, Hadith Search, Ramadan Planner, Sadaqah Tracker, Inheritance Calculator, Halal Finance Check, Kaffarah Calculator, Mosque Finder, Hajj Checklist, Islamic Will generator, Halal Travel guide, Islamic Name Finder, Dua Generator, and Mizan Islamic Life Blueprint. All tools are provided free of charge with no registration required.',
  },
  {
    icon: '📖',
    title: '3. Islamic Content Disclaimer',
    content:
      'The Islamic tools, calculations, and content provided on this website are for general informational and educational purposes only. They are not fatwas (Islamic legal rulings) and should not be treated as such.\n\nSpecifically:\n• Zakat calculations are estimates based on majority Sunni (Hanafi) fiqh. Always consult a qualified Islamic scholar for your specific situation.\n• Inheritance calculations are guides only and not legal documents. Consult an Islamic scholar and legal professional for actual estate matters.\n• Kaffarah calculations follow general scholarly positions but your specific situation may differ.\n• The Halal Finance Check is a screening tool, not a binding religious ruling.\n• The Mizan Islamic Life Blueprint is for personal reflection and inspiration only.\n• Prayer times are calculated using standard algorithms and may differ from your local mosque.\n\nFor binding religious rulings (fatwas), please consult a qualified Islamic scholar.',
  },
  {
    icon: '✅',
    title: '4. Acceptable Use',
    content:
      'You agree to use this website only for lawful purposes and in a manner consistent with Islamic ethics. You must not:\n\n• Use the site in any way that violates any applicable law or regulation\n• Attempt to gain unauthorized access to any part of the website\n• Use automated tools to scrape or copy content in bulk\n• Redistribute, sell, or claim ownership of our tools or content\n• Use the site to spread misinformation about Islam\n• Attempt to disrupt or interfere with the website\'s operation\n• Use the site for any commercial purpose without our written consent',
  },
  {
    icon: '🔒',
    title: '5. Intellectual Property',
    content:
      'The content, design, code, and tools on I Love Islam are owned by I Love Islam unless otherwise stated. The Quran text displayed is the divine word of Allah ﷻ and is used for the purpose of enabling Muslims to read and learn. Hadith content is sourced from scholarly databases. Arabic calligraphy and Islamic content is used with respect and for educational purposes.\n\nYou may share links to our tools freely. You may not copy, reproduce, or redistribute our tool code or website content without permission.',
  },
  {
    icon: '🔗',
    title: '6. Third-Party APIs and Services',
    content:
      'Our tools use several third-party APIs to function, including:\n• Aladhan API — for prayer times and Hijri calendar\n• AlQuran.cloud — for Quran text and translations\n• Sunnah.com API — for Hadith search\n• Google Maps — for Mosque Finder and location services\n\nWe are not responsible for the availability, accuracy, or content of these third-party services. Interruptions in these services may temporarily affect tool functionality.',
  },
  {
    icon: '⚠️',
    title: '7. Accuracy and Reliability',
    content:
      'While we strive to provide accurate and reliable tools, I Love Islam makes no warranties or representations about the accuracy, completeness, or suitability of the information provided. Tools are provided "as is" without any guarantee of accuracy for your specific situation.\n\nWe are not liable for any decisions made based on the output of our tools. Always verify important religious and financial decisions with qualified scholars and professionals.',
  },
  {
    icon: '🔐',
    title: '8. Privacy',
    content:
      'Your privacy is important to us. Please review our Privacy Policy which explains how we collect, use, and protect your information. Key points: we do not collect personal data without consent, location data is never stored on our servers, and the Mizan tool calculates everything locally in your browser.',
  },
  {
    icon: '🛒',
    title: '9. Advertisements',
    content:
      'I Love Islam may display advertisements through Google AdSense or similar advertising networks to help cover hosting and development costs. These ads are served by third parties and their content is not controlled by us. We strive to ensure advertisements are appropriate for a Muslim audience, but we cannot guarantee the content of all third-party ads.',
  },
  {
    icon: '⚖️',
    title: '10. Limitation of Liability',
    content:
      'To the maximum extent permitted by law, I Love Islam shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from your use of or inability to use the service, including but not limited to damages resulting from reliance on any information obtained from the website.',
  },
  {
    icon: '🔄',
    title: '11. Changes to the Service',
    content:
      'We reserve the right to modify, suspend, or discontinue any part of the service at any time without notice. We may add new tools, remove existing ones, or change how tools function. We will endeavour to maintain service continuity but cannot guarantee uninterrupted access.',
  },
  {
    icon: '✉️',
    title: '12. Contact',
    content:
      'If you have any questions about these Terms of Service, please contact us through our Contact page. We aim to respond within 48 hours insha\'Allah.',
  },
  {
    icon: '🌍',
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
            <span>←</span> Back to Tools
          </Link>
          <h1 className="text-xl font-bold tracking-wide">Terms of Service</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 pb-20 space-y-6">
        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
          <div className="text-4xl mb-3">📜</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Terms of Service</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            Please read these terms carefully. By using our free Islamic tools, you agree to these terms.
          </p>
          <p className="text-xs text-gray-400 mt-2">Last updated: {lastUpdated}</p>
        </div>

        {/* Quick Summary */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
            <span>📋</span> Simple Summary (Plain English)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {[
              '✅ All tools are free and always will be',
              '✅ No account or sign-up required',
              '✅ Your data is private — we don\'t sell it',
              '⚠️ Tools are guides, not fatwas — consult a scholar',
              '⚠️ Inheritance and finance tools are not legal documents',
              '❌ Do not copy or redistribute our tools without permission',
              '❌ Do not use the site for unlawful purposes',
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
          <p className="text-xs text-gray-400">Made with ❤️ for the Ummah · Always Free</p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">Home</Link>
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600">Privacy Policy</Link>
            <Link href="/contact" className="text-xs text-gray-400 hover:text-gray-600">Contact</Link>
            <Link href="/faq" className="text-xs text-gray-400 hover:text-gray-600">FAQ</Link>
          </div>
        </div>
      </main>
    </div>
  );
}