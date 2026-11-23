// app/hifz/components/SettingsHeader.tsx — Settings top bar, Tarteel-style:
// back arrow in a circle (start side) + bold screen title (end side).
// No breadcrumb, no big heading + description. Client component only so
// the title follows the interface language; the pages stay server
// components (metadata lives there).
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const label = title ?? t('set.title');
  return (
    <div className="flex items-center justify-between">
      {backHref ? (
        <Link href={backHref} aria-label={t('rb.search.goBack')} className={BTN}>
          <BackChevron />
        </Link>
      ) : (
        <button type="button" onClick={() => router.back()} aria-label={t('rb.search.goBack')} className={BTN}>
          <BackChevron />
        </button>
      )}
      <h1 className="text-xl font-bold text-[#111827]">{label}</h1>
    </div>
  );
}
