'use client';
// app/components/Header.tsx — sticky site header, new emerald + gold identity.
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import ToolIcon from './ToolIcon';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/dua-for-this-moment', label: 'Dua for This Moment' },
  { href: '/quran', label: 'Quran' },
  { href: '/prayer-times', label: 'Prayer Times' },
  { href: '/qibla', label: 'Qibla' },
  { href: '/dhikr', label: 'Dhikr' },
  { href: '/zakat', label: 'Zakat' },
  { href: '/names', label: '99 Names' },
  { href: '/hijri', label: 'Calendar' },
  { href: '/hadith', label: 'Hadith' },
  { href: '/hajj', label: 'Hajj' },
  { href: '/#tools', label: 'All Tools' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors ${
      pathname === href
        ? 'bg-white/10 text-[#E7D9A8]'
        : 'text-white/85 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-[#0B3D2E] text-white shadow-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="I Love Islam — home">
          <Image src="/logo.svg" alt="I Love Islam logo" width={36} height={36} priority />
          <span className="text-lg font-bold leading-none tracking-tight">
            I Love <span className="text-[#E7D9A8]">Islam</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden items-center xl:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            <ToolIcon name={open ? 'close' : 'menu'} className="h-5 w-5" />
          </span>
        </button>
      </div>

      {/* Mobile nav panel */}
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile navigation"
          className="border-t border-white/10 bg-[#0B3D2E] px-3 pb-4 pt-2 xl:hidden"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`block rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-white/10 text-[#E7D9A8]'
                      : 'text-white/85 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
