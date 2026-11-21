// app/components/Footer.tsx — site footer, deep emerald. Hifz app only:
// links to the Hifz hub and the legal pages. No tool links anywhere.
import Link from 'next/link';
import Image from 'next/image';

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Hifz',
    links: [
      { href: '/hifz', label: 'Hifz Hub' },
      { href: '/hifz/recite', label: 'Recite with the Coach' },
      { href: '/hifz/mushaf/1', label: 'Read the Mushaf' },
      { href: '/hifz/test', label: 'Test Mode' },
      { href: '/hifz/voice-search', label: 'Voice Search' },
      { href: '/hifz/challenges', label: 'Group Challenges' },
      { href: '/hifz/plans', label: 'Memorisation Plans' },
      { href: '/hifz/my-progress', label: 'My Progress' },
    ],
  },
  {
    title: 'Start Here',
    links: [
      { href: '/hifz/juz-amma', label: 'Juz Amma — the Beginner Path' },
      { href: '/hifz/al-mulk', label: 'Surah Al-Mulk' },
      { href: '/hifz/ya-sin', label: 'Surah Ya-Sin' },
      { href: '/hifz/al-kahf', label: 'Surah Al-Kahf' },
      { href: '/hifz/al-fatihah', label: 'Surah Al-Fatihah' },
      { href: '/hifz/ayat-al-kursi', label: 'Ayat al-Kursi' },
    ],
  },
];

const LEGAL_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#102E26] text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2.5" aria-label="I Love Islam — home">
            <Image src="/logo.svg" alt="I Love Islam logo" width={36} height={36} />
            <span className="text-lg font-bold leading-none tracking-tight text-white">
              I Love Islam
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            Memorise the Quran with an AI recitation coach: recite aloud and get
            word-by-word feedback, follow a plan, and test yourself — free, no
            sign-up, your audio never leaves your device.
          </p>
          <p className="mt-4 text-sm font-semibold text-[#57D798]">Free forever. No sign-up.</p>
        </div>

        {/* Link columns */}
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={`Footer — ${col.title}`}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFB800]">{col.title}</h2>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/75 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-white/60 sm:flex-row">
          <p>©{' '}{year}{' '}I Love Islam. Memorise the Quran with AI.</p>
          <nav aria-label="Footer legal links" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-white">
                {link.label}
              </Link>
            ))}
            <Link href="/llms.txt" className="transition-colors hover:text-white">
              AI Index (llms.txt)
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
