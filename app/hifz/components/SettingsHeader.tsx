// app/hifz/components/SettingsHeader.tsx — Settings top bar, Tarteel-style:
// back arrow in a circle (start side) + bold screen title (end side).
// No breadcrumb, no big heading + description. Client component only so
// the title follows the interface language; the pages stay server
// components (metadata lives there).
//
// Back is always a FIXED destination, never router.back(): the browser
// history back looped Settings -> Account -> Settings (the user came
// from the Account page, so "back" returned there instead of Home).
// The main Settings page goes to the Features menu (the reader with
// the Dashboard open, "/?dashboard=1"); detail screens pass
// backHref="/hifz/settings".

'use client';

import Link from 'next/link';
import { useT } from '../lib/i18n';

const BTN =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#111827]/25 bg-transparent text-[#111827] hover:bg-white';

function BackChevron() {
  return (
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
  );
}

export default function SettingsHeader({ title, backHref }: { title?: string; backHref?: string }) {
  const t = useT();
  const label = title ?? t('set.title');
  // No backHref = the main Settings page: back goes to the Features menu.
  const href = backHref ?? '/?dashboard=1';
  return (
    <div className="flex items-center justify-between">
      <Link href={href} aria-label={t('rb.search.goBack')} className={BTN}>
        <BackChevron />
      </Link>
      <h1 className="text-xl font-bold text-[#111827]">{label}</h1>
    </div>
  );
}
