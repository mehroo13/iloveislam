// app/components/Footer.tsx — site footer, deep emerald, links to the kept tools.
import Link from 'next/link';
import Image from 'next/image';

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Most Used',
    links: [
      { href: '/dua-for-this-moment', label: 'Dua for This Moment' },
      { href: '/quran', label: 'Quran Reader' },
      { href: '/prayer-times', label: 'Prayer Times' },
      { href: '/qibla', label: 'Qibla Finder' },
      { href: '/zakat', label: 'Zakat Calculator' },
      { href: '/dhikr', label: 'Dhikr Counter' },
    ],
  },
  {
    title: 'Daily Practice',
    links: [
      { href: '/names', label: '99 Names of Allah' },
      { href: '/hadith', label: 'Hadith Search' },
      { href: '/hijri', label: 'Hijri Calendar' },
      { href: '/ramadan', label: 'Ramadan Planner' },
      { href: '/night', label: 'Night Recitation' },
    ],
  },
  {
    title: 'Finance & Travel',
    links: [
      { href: '/inheritance', label: 'Inheritance Calculator' },
      { href: '/sadaqah', label: 'Sadaqah Tracker' },
      { href: '/halal-finance', label: 'Halal Finance Check' },
      { href: '/kaffarah', label: 'Kaffarah Calculator' },
      { href: '/hajj', label: 'Hajj Checklist' },
      { href: '/travel', label: 'Halal Travel Guide' },
      { href: '/names-finder', label: 'Islamic Name Finder' },
      { href: '/mizan', label: 'Mizan — Life Blueprint' },
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
    <footer className="bg-[#0B3D2E] text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:grid-cols-2 lg:grid-cols-5">
        {/* Brand */}
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2.5" aria-label="I Love Islam — home">
            <Image src="/logo.svg" alt="I Love Islam logo" width={36} height={36} />
            <span className="text-lg font-bold leading-none tracking-tight text-white">
              I Love <span className="text-[#E7D9A8]">Islam</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            Your daily companion for prayer, Quran and duas — the right dua for
            every moment, prayer times, Qibla, zakat, dhikr and the 99 Names of
            Allah, all in one place.
          </p>
          <p className="mt-4 text-sm font-semibold text-[#E7D9A8]">Free forever. No sign-up.</p>
        </div>

        {/* Link columns */}
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={`Footer — ${col.title}`}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#C9A227]">{col.title}</h2>
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
          <p>©{' '}{year}{' '}I Love Islam. Made with love for the Ummah.</p>
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
