// app/about/page.tsx — About I Love Islam (rebuilt 2026-11-25 in the
// new app design: light grey, white cards, back button to Home).
// The old emerald-gradient page is gone, with it the dark-green
// Header/Footer chrome and the "built and run by [name]" line — no
// personal name appears anywhere in shipped copy. Content is the same
// honest description of the app, corrected where the old copy was
// out of date (accounts are optional now, not absent), plus a real
// "Support this app" section — the Donate button in Settings lands
// here (#support). There is no donation payment channel in the app:
// the section says so plainly by naming sharing as the support.
import TrustShell from '../components/TrustShell';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Our Mission',
    body: 'Our mission is simple: help every Muslim memorise the Quran, wherever they are, whatever their level. Memorisation used to need a teacher beside you at all times; this app gives you a patient coach that is available any hour, for free, for everyone. We believe access to the Quran is a right, not a privilege — so the whole app is free, and it stays free.',
  },
  {
    title: 'What the app does',
    body: 'The AI recitation coach listens while you recite and checks every word. Memorisation Mode hides the verse so you recite from memory. Test Mode quizzes you like an exam. Voice Search finds any ayah by reciting it. Hifz plans (7-day, 30-day and a 90-day Juz Amma plan) break every surah into daily portions. The Mushaf mode shows the Quran page by page, exactly like the printed Madani mushaf. You can read in Indo-Pak or Madani script, with translations, tafsir and word-by-word breakdowns, and listen to named reciters.',
  },
  {
    title: 'How the coach works — and its limits',
    body: 'The coach checks which words you recited, word by word. It does not check tajweed, and it is not a replacement for a teacher — for tajweed, a qualified teacher is still needed. If the coach ever flags a word you said correctly, tell us through the Contact page so we can keep improving it.',
  },
  {
    title: 'Our sources',
    body: 'Quran text, translations and tafsir come from Quran.com. Audio is from named reciters, including Mishary Alafasy. The virtues and plan content on each surah page cites its collection and grading, and weak reports are labelled weak. If you spot an error in any verse, translation or reference, please report it — accuracy in matters of the Quran is the highest priority here.',
  },
  {
    title: 'Privacy',
    body: 'We collect no personal data. There is no need for an account — everything works without one. An optional account only backs up your progress to your other devices. Your recitation audio is processed on your device and never uploaded. Your progress — streaks, memorised ayahs, mistakes — is stored only in your own browser, and you can export or delete it at any time. Advertising (Google AdSense) runs only if you accept cookies; the app works fully whether you accept or decline.',
  },
  {
    title: 'Who runs it',
    body: 'I Love Islam is an independent project, run as an ongoing charity (sadaqah jariyah) for the Ummah. It is maintained with the hope that every ayah memorised through it becomes a source of reward. If the app helps you, the best support you can give is to share it with family and friends.',
  },
  {
    title: 'Community & feedback',
    body: 'This app belongs to its users. Many features were built or improved because someone wrote in. If you find a bug, have an idea, or want a feature, reach out through the Contact page — every message is read. If you notice a mistake in the Quran text or a translation, tell us with the correct source and we will fix it.',
  },
];

export default function About() {
  return (
    <TrustShell title="About Us">
      <div className="space-y-4">
        {/* Hero */}
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h2 className="text-2xl font-bold">I Love Islam</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#6B7280]">
            Memorise the Quran with an AI recitation coach — free forever, no sign-up needed.
          </p>
        </div>

        {/* Introduction */}
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-bold">What this app is</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
            I Love Islam is a free web app that helps you memorise the Quran. You recite aloud,
            and the AI coach listens and flags mistakes word by word, right in your browser. The
            whole Quran is here — all 114 surahs and all 30 juz — with hifz plans, a Mushaf
            reading mode that looks like the printed Quran, Test Mode, Voice Search, group
            challenges, streaks and a mistake log.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
            There is nothing to install and nothing to pay for. No sign-up needed, no
            subscription. An account is optional — only to back up your progress. Your recitation
            audio never leaves your device — the coach runs on-device, so your practice stays
            private.
          </p>
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
          >
            <h3 className="text-lg font-bold">{section.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{section.body}</p>
          </div>
        ))}

        {/* Support — the Donate button in Settings lands here (#support).
            There is no donation payment channel in the app, so the
            section names sharing as the support; nothing is invented. */}
        <div
          id="support"
          className="scroll-mt-6 rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
        >
          <h3 className="text-lg font-bold">Support this app</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
            I Love Islam is free forever: no paid tier, no paywall, no ads. Donations are
            optional and never unlock anything — everything is already free. If it helps your
            hifz, the best support you can give is to share it with family and friends — that
            is what keeps it growing.
          </p>
        </div>

        {/* Closing */}
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <p className="font-quran text-2xl text-[#111827]">بسم الله الرحمن الرحيم</p>
          <p className="mt-1 text-sm text-[#6B7280]">In the name of Allah, the Most Gracious, the Most Merciful</p>
        </div>
      </div>
    </TrustShell>
  );
}
