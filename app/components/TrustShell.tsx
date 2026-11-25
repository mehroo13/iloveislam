// app/components/TrustShell.tsx — shared shell for the trust pages
// (About, Contact, Privacy, Terms), rebuilt 2026-11-25 in the new
// app design: light-grey background, white cards, circular back
// button to Home. Replaces the old emerald-gradient pages and the
// dark-green Header/Footer chrome (deleted with them).
import Link from 'next/link';
import type { ReactNode } from 'react';

const FOOTER_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/hifz', label: 'Hifz Hub' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

export default function TrustShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#111827]">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 pb-3 pt-4">
        <Link
          href="/"
          aria-label="Back to Home"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#111827]/25 bg-transparent text-[#111827] hover:bg-white"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 rtl:-scale-x-100"
            aria-hidden="true"
          >
            <path d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold leading-none">{title}</h1>
        <div className="w-11 shrink-0" />
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-8">{children}</main>
      <footer className="mx-auto max-w-3xl px-4 pb-10 pt-2">
        <div className="border-t border-[#E5E7EB] pt-4 text-center">
          <p className="text-xs text-[#9CA3AF]">Made with love for the Ummah · Always free</p>
          <nav aria-label="Footer" className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-xs text-[#6B7280] hover:text-[#111827]">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
