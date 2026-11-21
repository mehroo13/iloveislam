import Link from 'next/link';
import ToolIcon from '../components/ToolIcon';

// app/about/page.tsx — About I Love Islam (rewritten 2026-11-21 for the
// single-purpose AI Hifz app; the old page described the retired tools
// site). Honest, specific, no invented claims.
export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white font-serif">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white px-5 py-5 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/70 hover:text-white text-sm flex items-center gap-1">
            <span>←</span> Back to Home
          </Link>
          <h1 className="text-xl font-bold tracking-wide">About Us</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 pb-20 space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white rounded-2xl p-8 text-center shadow-lg">
          <div className="mb-3 flex justify-center">
            <ToolIcon name="quran" className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">I Love Islam</h2>
          <p className="text-white/80 text-sm max-w-md mx-auto leading-relaxed">
            Memorise the Quran with an AI recitation coach — free forever, no sign-up, no account.
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 text-lg mb-3">What this app is</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            I Love Islam is a free web app that helps you memorise the Quran. You recite aloud,
            and the AI coach listens and flags mistakes word by word, right in your browser. The
            whole Quran is here — all 114 surahs and all 30 juz — with hifz plans, a Mushaf
            reading mode that looks like the printed Quran, Test Mode, Voice Search, group
            challenges, streaks and a mistake log.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            There is nothing to install and nothing to pay for. No account, no sign-up, no
            subscription. Your recitation audio never leaves your device — the coach runs
            on-device, so your practice stays private.
          </p>
        </div>

        {/* Story Sections */}
        {[
          {
            // Icons are the site's inline-SVG set (ToolIcon). The emoji
            // icons here were stripped in the 2026-11-21 emoji cleanup and
            // left as empty strings, which rendered as empty pale squares.
            icon: 'mosque',
            title: 'Our Mission',
            body: 'Our mission is simple: help every Muslim memorise the Quran, wherever they are, whatever their level. Memorisation used to need a teacher beside you at all times; this app gives you a patient coach that is available any hour, for free, for everyone. We believe access to the Quran is a right, not a privilege — so the whole app is free, and it stays free.',
          },
          {
            icon: 'quran',
            title: 'What the app does',
            body: 'The AI recitation coach listens while you recite and checks every word. Memorisation Mode hides the verse so you recite from memory. Test Mode quizzes you like an exam. Voice Search finds any ayah by reciting it. Hifz plans (7-day, 30-day and a 90-day Juz Amma plan) break every surah into daily portions. The Mushaf mode shows the Quran page by page, exactly like the printed Madani mushaf. You can read in Indo-Pak or Madani script, with translations, tafsir and word-by-word breakdowns, and listen to named reciters.',
          },
          {
            icon: 'mic',
            title: 'How the coach works — and its limits',
            body: 'The coach checks which words you recited, word by word. It does not check tajweed, and it is not a replacement for a teacher — for tajweed, a qualified teacher is still needed. If the coach ever flags a word you said correctly, tell us through the Contact page so we can keep improving it.',
          },
          {
            icon: 'bookmark',
            title: 'Our sources',
            body: 'Quran text, translations and tafsir come from Quran.com. Audio is from named reciters, including Mishary Alafasy. The virtues and plan content on each surah page cites its collection and grading, and weak reports are labelled weak. If you spot an error in any verse, translation or reference, please report it — accuracy in matters of the Quran is the highest priority here.',
          },
          {
            icon: 'hide',
            title: 'Privacy',
            body: 'We collect no personal data. There are no accounts and no sign-up. Your recitation audio is processed on your device and never uploaded. Your progress — streaks, memorised ayahs, mistakes — is stored only in your own browser, and you can export or delete it at any time. Advertising (Google AdSense) runs only if you accept cookies; the app works fully whether you accept or decline.',
          },
          {
            icon: 'sadaqah',
            title: 'Who runs it',
            body: 'I Love Islam is an independent project, built and run by Mehran Khan as an ongoing charity (sadaqah jariyah) for the Ummah. It is maintained with the hope that every ayah memorised through it becomes a source of reward. If the app helps you, the best support you can give is to share it with family and friends.',
          },
          {
            icon: 'share',
            title: 'Community & feedback',
            body: 'This app belongs to its users. Many features were built or improved because someone wrote in. If you find a bug, have an idea, or want a feature, reach out through the Contact page — every message is read. If you notice a mistake in the Quran text or a translation, tell us with the correct source and we will fix it.',
          },
        ].map((section, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ToolIcon name={section.icon} className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{section.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{section.body}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Closing */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center shadow-sm">
          <p className="font-quran text-2xl text-emerald-800 mb-2">بسم الله الرحمن الرحيم</p>
          <p className="text-sm text-gray-600 mb-1">In the name of Allah, the Most Gracious, the Most Merciful</p>
          <p className="text-xs text-gray-400 mt-3">Made with love for the Ummah · Always free</p>
        </div>

        {/* Footer Links */}
        <div className="text-center pt-4 border-t border-gray-100">
          <div className="flex flex-wrap justify-center gap-4 mt-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">Home</Link>
            <Link href="/hifz" className="text-xs text-gray-400 hover:text-gray-600">Hifz Hub</Link>
            <Link href="/contact" className="text-xs text-gray-400 hover:text-gray-600">Contact</Link>
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600">Terms of Service</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
