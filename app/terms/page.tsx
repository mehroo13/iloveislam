import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for I Love Islam — Free Islamic Tools for Muslims worldwide.',
};

export default function Terms() {
  const lastUpdated = 'May 9, 2026';

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing and using I Love Islam (iloveislam.life), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use this website. We reserve the right to update these terms at any time, and continued use of the site constitutes acceptance of any changes.`,
    },
    {
      title: '2. Description of Service',
      content: `I Love Islam is a free collection of Islamic tools designed for Muslims worldwide. Our tools include but are not limited to: Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Hijri Calendar, Dhikr Counter, 99 Names of Allah, Hadith Search, Ramadan Planner, Sadaqah Tracker, Inheritance Calculator, Halal Finance Check, Kaffarah Calculator, Mosque Finder, Hajj Checklist, Islamic Will generator, Halal Travel guide, Islamic Name Finder, Dua Generator, and Mizan Islamic Life Blueprint. All tools are provided free of charge with no registration required.`,
    },
    {
      title: '3. Islamic Content Disclaimer',
      content: `The Islamic tools, calculations, and content provided on this website are for general informational and educational purposes only. They are not fatwas (Islamic legal rulings) and should not be treated as such.

Specifically:
• Zakat calculations are estimates based on majority Sunni (Hanafi) fiqh. Always consult a qualified Islamic scholar for your specific situation.
• Inheritance calculations are guides only and not legal documents. Consult an Islamic scholar and legal professional for actual estate matters.
• Kaffarah calculations follow general scholarly positions but your specific situation may differ.
• The Halal Finance Check is a screening tool, not a binding religious ruling.
• The Mizan Islamic Life Blueprint is for personal reflection and inspiration only.
• Prayer times are calculated using standard algorithms and may differ from your local mosque.

For binding religious rulings (fatwas), please consult a qualified Islamic scholar.`,
    },
    {
      title: '4. Acceptable Use',
      content: `You agree to use this website only for lawful purposes and in a manner consistent with Islamic ethics. You must not:

• Use the site in any way that violates any applicable law or regulation
• Attempt to gain unauthorized access to any part of the website
• Use automated tools to scrape or copy content in bulk
• Redistribute, sell, or claim ownership of our tools or content
• Use the site to spread misinformation about Islam
• Attempt to disrupt or interfere with the website's operation
• Use the site for any commercial purpose without our written consent`,
    },
    {
      title: '5. Intellectual Property',
      content: `The content, design, code, and tools on I Love Islam are owned by I Love Islam unless otherwise stated. The Quran text displayed is the divine word of Allah ﷻ and is used for the purpose of enabling Muslims to read and learn. Hadith content is sourced from scholarly databases. Arabic calligraphy and Islamic content is used with respect and for educational purposes.

You may share links to our tools freely. You may not copy, reproduce, or redistribute our tool code or website content without permission.`,
    },
    {
      title: '6. Third-Party APIs and Services',
      content: `Our tools use several third-party APIs to function, including:
• Aladhan API — for prayer times and Hijri calendar
• AlQuran.cloud — for Quran text and translations
• Sunnah.com API — for Hadith search
• Google Maps — for Mosque Finder and location services

We are not responsible for the availability, accuracy, or content of these third-party services. Interruptions in these services may temporarily affect tool functionality.`,
    },
    {
      title: '7. Accuracy and Reliability',
      content: `While we strive to provide accurate and reliable tools, I Love Islam makes no warranties or representations about the accuracy, completeness, or suitability of the information provided. Tools are provided "as is" without any guarantee of accuracy for your specific situation.

We are not liable for any decisions made based on the output of our tools. Always verify important religious and financial decisions with qualified scholars and professionals.`,
    },
    {
      title: '8. Privacy',
      content: `Your privacy is important to us. Please review our Privacy Policy which explains how we collect, use, and protect your information. Key points: we do not collect personal data without consent, location data is never stored on our servers, and the Mizan tool calculates everything locally in your browser.`,
    },
    {
      title: '9. Advertisements',
      content: `I Love Islam may display advertisements through Google AdSense or similar advertising networks to help cover hosting and development costs. These ads are served by third parties and their content is not controlled by us. We strive to ensure advertisements are appropriate for a Muslim audience, but we cannot guarantee the content of all third-party ads.`,
    },
    {
      title: '10. Limitation of Liability',
      content: `To the maximum extent permitted by law, I Love Islam shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from your use of or inability to use the service, including but not limited to damages resulting from reliance on any information obtained from the website.`,
    },
    {
      title: '11. Changes to the Service',
      content: `We reserve the right to modify, suspend, or discontinue any part of the service at any time without notice. We may add new tools, remove existing ones, or change how tools function. We will endeavour to maintain service continuity but cannot guarantee uninterrupted access.`,
    },
    {
      title: '12. Contact',
      content: `If you have any questions about these Terms of Service, please contact us through our Contact page or by emailing mehrakhanuet3@gmail.com. We aim to respond within 48 hours insha'Allah.`,
    },
    {
      title: '13. Governing Law',
      content: `These terms shall be governed by and construed in accordance with applicable law. Any disputes shall be resolved through good-faith communication. As Muslims, we encourage all disputes to be resolved through Islamic principles of fairness and justice (adl).`,
    },
  ];

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
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-white/50 text-sm">Last updated: {lastUpdated}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-16">

        {/* Intro box */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl flex-shrink-0">📜</span>
            <div>
              <p className="font-semibold text-gray-800 mb-2">Please read these terms carefully</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                These Terms of Service govern your use of I Love Islam (iloveislam.life). By using our free Islamic tools, you agree to these terms. Our tools are provided to serve the Muslim community and are always free — we simply ask that you use them responsibly and in the spirit of Islamic ethics.
              </p>
            </div>
          </div>
        </div>

        {/* Quick summary */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 mb-6">
          <p className="font-semibold text-emerald-800 mb-3">📋 Simple Summary (Plain English)</p>
          <div className="space-y-2">
            {[
              '✅ All tools are free and always will be',
              '✅ No account or sign-up required',
              '✅ Your data is private — we don\'t sell it',
              '⚠️ Tools are guides, not fatwas — consult a scholar for religious rulings',
              '⚠️ Inheritance and finance tools are not legal documents',
              '❌ Do not copy or redistribute our tools without permission',
              '❌ Do not use the site for unlawful purposes',
            ].map((item, i) => (
              <p key={i} className="text-sm text-emerald-700">{item}</p>
            ))}
          </div>
        </div>

        {/* Full terms */}
        <div className="space-y-4">
          {sections.map(s => (
            <div key={s.title} className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-800 mb-3 text-sm">{s.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{s.content}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-10">
          <p className="font-arabic text-emerald-800 text-xl mb-1">بسم الله الرحمن الرحيم</p>
          <p className="text-xs text-gray-400 mb-4">Made with ❤️ for the Ummah · Always Free · No Sign-up</p>
          <div className="flex justify-center gap-4">
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
