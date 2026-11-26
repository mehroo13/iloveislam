// app/terms/page.tsx — Terms of Service (rebuilt 2026-11-25 in the
// new app design: light grey, white cards, back button to Home).
// The 13 sections are unchanged except section 8, which now says
// progress lives in the browser unless you choose an optional
// account backup (accounts exist now — the old line said it lives
// only in the browser, which is no longer true).
import TrustShell from '../components/TrustShell';

const lastUpdated = 'November 21, 2026';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content:
      'By accessing and using I Love Islam (iloveislam.life), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use this website. We reserve the right to update these terms at any time, and continued use of the site constitutes acceptance of any changes.',
  },
  {
    title: '2. Description of Service',
    content:
      'Hifz is a free AI companion for memorising the Quran: an on-device recitation coach that gives word-by-word feedback, memorisation plans, Test Mode, Voice Search, streaks and mistake review. All features are provided free of charge with no registration required.',
  },
  {
    title: '3. Islamic Content Disclaimer',
    content:
      "The content provided on this website is for general informational and educational purposes only. It is not a fatwa (Islamic legal ruling) and should not be treated as such.\n\nSpecifically:\n• The recitation coach checks which words you recited — it does not check tajweed. A qualified teacher is still needed for tajweed, and the coach's feedback is never a substitute for one.\n• Quran text, translations and tafsir are sourced from Quran.com; translations and tafsir are scholarly works and may differ between sources.\n• Memorization plans are study guides, not a guarantee of memorisation.\n\nFor binding religious rulings (fatwas), please consult a qualified Islamic scholar.",
  },
  {
    title: '4. Acceptable Use',
    content:
      'You agree to use this website only for lawful purposes and in a manner consistent with Islamic ethics. You must not:\n\n• Use the site in any way that violates any applicable law or regulation\n• Attempt to gain unauthorized access to any part of the website\n• Use automated tools to scrape or copy content in bulk\n• Redistribute, sell, or claim ownership of our app or content\n• Use the site to spread misinformation about Islam\n• Attempt to disrupt or interfere with the website\'s operation\n• Use the site for any commercial purpose without our written consent',
  },
  {
    title: '5. Intellectual Property',
    content:
      'The content, design, and code on I Love Islam are owned by I Love Islam unless otherwise stated. The Quran text displayed is the divine word of Allah ﷻ and is used for the purpose of enabling Muslims to read and learn. Arabic calligraphy and Islamic content is used with respect and for educational purposes.\n\nYou may share links to our app freely. You may not copy, reproduce, or redistribute our code or website content without permission.',
  },
  {
    title: '6. Third-Party APIs and Services',
    content:
      'The app uses third-party services to function, including:\n• Quran.com API — for Quran text, translations, tafsir and reciter audio\n• Your browser\'s built-in speech recognition — for Voice Search, where available\n\nWe are not responsible for the availability, accuracy, or content of these third-party services. Interruptions in these services may temporarily affect app functionality.',
  },
  {
    title: '7. Accuracy and Reliability',
    content:
      'While we strive to provide accurate and reliable feedback, I Love Islam makes no warranties or representations about the accuracy, completeness, or suitability of the information provided. The recitation coach is provided "as is" — it checks word accuracy only, never tajweed, and may occasionally mishear. We are not liable for any decisions made based on the output of the coach. Always verify important religious matters with qualified scholars and teachers.',
  },
  {
    title: '8. Privacy',
    content:
      'Your privacy is important to us. Please review our Privacy Policy which explains how we collect, use, and protect your information. Key points: we do not collect personal data, your recitation audio never leaves your device, and your progress lives only in your own browser unless you choose an optional account backup.',
  },
  {
    title: '9. Advertisements',
    content:
      'No advertisements are currently shown — our Google AdSense application is still outstanding. If it is approved, I Love Islam may display advertisements through Google AdSense or similar advertising networks in the future to help cover hosting and development costs. These ads are served by third parties and their content is not controlled by us. We strive to ensure advertisements are appropriate for a Muslim audience, but we cannot guarantee the content of all third-party ads.',
  },
  {
    title: '10. Limitation of Liability',
    content:
      'To the maximum extent permitted by law, I Love Islam shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from your use of or inability to use the service, including but not limited to damages resulting from reliance on any information obtained from the website.',
  },
  {
    title: '11. Changes to the Service',
    content:
      'We reserve the right to modify, suspend, or discontinue any part of the service at any time without notice. We may add new features, remove existing ones, or change how the app works. We will endeavour to maintain service continuity but cannot guarantee uninterrupted access.',
  },
  {
    title: '12. Contact',
    content:
      "If you have any questions about these Terms of Service, please contact us at contact@iloveislam.life. We aim to respond within 48 hours insha'Allah.",
  },
  {
    title: '13. Governing Law',
    content:
      'These terms shall be governed by and construed in accordance with applicable law. Any disputes shall be resolved through good-faith communication. As Muslims, we encourage all disputes to be resolved through Islamic principles of fairness and justice (adl).',
  },
];

export default function Terms() {
  return (
    <TrustShell title="Terms of Service">
      <div className="space-y-4">
        {/* Hero */}
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h2 className="text-2xl font-bold">Terms of Service</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#6B7280]">
            Please read these terms carefully. By using our free Hifz app, you agree to these terms.
          </p>
          <p className="mt-2 text-xs text-[#9CA3AF]">Last updated: {lastUpdated}</p>
        </div>

        {/* Quick Summary */}
        <div className="rounded-[12px] border border-[#BBF7D0] bg-[#E4FFF2] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h3 className="font-bold text-[#166534]">Simple Summary (Plain English)</h3>
          <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {[
              'All features are free and always will be',
              'No account or sign-up required',
              "Your data is private — we don't sell it",
              'The coach checks words, not tajweed — consult a teacher',
              'Do not copy or redistribute our app without permission',
              'Do not use the site for unlawful purposes',
            ].map((item) => (
              <p key={item} className="text-sm text-[#15803D]">
                ✓ {item}
              </p>
            ))}
          </div>
        </div>

        {/* Detailed Sections */}
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
          >
            <h3 className="text-base font-bold">{section.title}</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#6B7280]">{section.content}</p>
          </div>
        ))}

        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <p className="font-quran text-xl text-[#111827]">بسم الله الرحمن الرحيم</p>
          {/* Audit m7: the "Made with love…" tagline also lives in the
              TrustShell site footer below — it was rendered twice. */}
        </div>
      </div>
    </TrustShell>
  );
}
