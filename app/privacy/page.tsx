// app/privacy/page.tsx — Privacy Policy (rebuilt 2026-11-25 in the
// new app design: light grey, white cards, back button to Home).
// The 11 sections are unchanged — the copy was already accurate
// about the optional account (section 2/4). Only the design and the
// old emerald chrome changed.
import TrustShell from '../components/TrustShell';

const sections = [
  {
    title: '1. Overview',
    content:
      'I Love Islam ("we", "our", "the site") is committed to protecting your privacy. This Privacy Policy explains how we handle information when you use our website at iloveislam.life.',
  },
  {
    title: '2. Data We Do NOT Collect',
    content:
      'We do not require you to create an account. We do not ask for your name, email address, phone number, or any personal information to use the Hifz app. Your recitation audio is processed on your device and never uploaded. Your memorisation progress, streak and mistake log live only in your own browser, unless you choose to create an optional account to back them up (see section 4).',
  },
  {
    title: '3. Local Storage',
    content:
      'The Hifz app saves your progress, settings and mistake log locally on your own device using browser localStorage. As a guest this data never leaves your device and is never sent to our servers. You can clear it at any time by clearing your browser data, or by exporting and deleting it from the Settings page.',
  },
  {
    title: '4. Optional Account & Cloud Backup',
    content:
      'Creating an account is entirely optional — every feature of the Hifz app works without one. If you choose to create an account (Settings → Account & backup), we store only your email address and your progress records: which surahs and ayahs you have memorised, your goals, bookmarks, test results, reading location and settings, so your progress follows you to other devices and survives changing phones. We never store your voice or audio recordings: recitation checking happens on your device, and audio is never transmitted or stored. The microphone is only used while a voice feature (recitation check or voice search) is running. You can delete your progress on this device, or delete your account and its cloud backup entirely, from Settings → Account & backup. Deleting your account removes your email and all of your stored progress records.',
  },
  {
    title: '5. Third-Party APIs',
    content:
      "The app fetches Quran text, translations, tafsir and reciter audio through the Quran.com API (api.quran.com), requested from our own server so your browser talks only to iloveislam.life. Voice Search uses your browser's built-in speech recognition where available. These services have their own privacy policies. We send them no personal data — only the Quran reference or the words you searched for.",
  },
  {
    title: '6. Analytics',
    content:
      'We may use anonymous, privacy-friendly analytics to understand how many people visit our site and which parts of the Hifz app are most used. This does not include any personally identifiable information, your recitation audio, or the words you missed.',
  },
  {
    title: '7. Advertising',
    content:
      "No advertisements are currently shown on this website — our Google AdSense application is still outstanding. If it is approved, we may display advertisements through Google AdSense in the future. Google may use cookies to serve ads based on your prior visits to this website or other websites. You can opt out of personalized advertising by visiting Google's Ad Settings.",
  },
  {
    title: '8. Cookies',
    content:
      'We use minimal cookies. Language preference and scroll position are stored locally. If advertisements are shown, Google AdSense may set cookies for ad personalization.',
  },
  {
    title: "9. Children's Privacy",
    content:
      'Our site is suitable for all ages. We do not knowingly collect any information from children under 13.',
  },
  {
    title: '10. Changes to This Policy',
    content:
      'We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated date.',
  },
  {
    title: '11. Contact',
    content:
      'If you have any questions about this Privacy Policy, please contact us through our website.',
  },
];

export default function Privacy() {
  return (
    <TrustShell title="Privacy Policy">
      <div className="space-y-4">
        {/* Hero */}
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h2 className="text-2xl font-bold">Your Privacy is Protected</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#6B7280]">
            We do not collect personal data. No registration required. The Hifz app works locally in your browser.
          </p>
          <p className="mt-2 text-xs text-[#9CA3AF]">Last updated: November 2026</p>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
          >
            <h3 className="text-base font-bold">{section.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{section.content}</p>
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
