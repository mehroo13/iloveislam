import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — I Love Islam',
  description: 'Privacy Policy for I Love Islam. We do not collect personal data. No registration required. Your privacy is protected.',
};

export default function Privacy() {
  const sections = [
    {
      title: '1. Overview',
      content: 'I Love Islam ("we", "our", "the site") is committed to protecting your privacy. This Privacy Policy explains how we handle information when you use our website at iloveislam.life.',
    },
    {
      title: '2. Data We Do NOT Collect',
      content: 'We do not require you to create an account. We do not ask for your name, email address, phone number, or any personal information to use any tool on this site. All calculations (Zakat, Prayer Times, Mizan Blueprint, etc.) happen in your browser.',
    },
    {
      title: '3. Local Storage',
      content: 'Some tools (like the Mizan Blueprint and language preference) save data locally on your own device using browser localStorage. This data never leaves your device and is never sent to our servers. You can clear it at any time by clearing your browser data.',
    },
    {
      title: '4. Third-Party APIs',
      content: 'Some tools use free third-party APIs to function: Prayer Times uses Aladhan API (aladhan.com). Hijri Calendar uses Aladhan API. Quran Reader uses AlQuran Cloud API (alquran.cloud). Mosque/Halal Food search uses OpenStreetMap Overpass API. These services have their own privacy policies. We only send the minimum data needed (e.g. your city coordinates for prayer times).',
    },
    {
      title: '5. Analytics',
      content: 'We may use anonymous, privacy-friendly analytics to understand how many people visit our site and which tools are most used. This does not include any personally identifiable information.',
    },
    {
      title: '6. Advertising',
      content: 'We may display advertisements through Google AdSense. Google may use cookies to serve ads based on your prior visits to this website or other websites. You can opt out of personalized advertising by visiting Google\'s Ad Settings.',
    },
    {
      title: '7. Cookies',
      content: 'We use minimal cookies. Language preference and scroll position are stored locally. If advertisements are shown, Google AdSense may set cookies for ad personalization.',
    },
    {
      title: '8. Children\'s Privacy',
      content: 'Our site is suitable for all ages. We do not knowingly collect any information from children under 13.',
    },
    {
      title: '9. Changes to This Policy',
      content: 'We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated date.',
    },
    {
      title: '10. Contact',
      content: 'If you have any questions about this Privacy Policy, please contact us through our website.',
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f7f6f2' }}>
      <header style={{ background: '#0a3d2e' }} className="px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
        <h1 className="text-white font-medium">Privacy Policy</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <p className="text-xs text-gray-400">Last updated: May 2026</p>
          <h2 className="text-lg font-bold text-gray-800 mt-1">Privacy Policy — I Love Islam</h2>
          <p className="text-sm text-gray-500 mt-2">Your privacy matters to us. This site is designed to be used without giving us any personal information.</p>
        </div>

        {sections.map(section => (
          <div key={section.title} className="bg-white rounded-2xl border border-gray-100 p-5 mb-3">
            <h2 className="font-semibold text-gray-800 mb-2 text-sm">{section.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{section.content}</p>
          </div>
        ))}

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-emerald-700 hover:underline">← Return to I Love Islam</Link>
        </div>
      </main>
    </div>
  );
}
