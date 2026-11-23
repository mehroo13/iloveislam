// app/hifz/setup/page.tsx — Book Settings (mushaf edition picker),
// standalone, so Settings can link to it (Mushaf Layout row).
import type { Metadata } from 'next';
import Link from 'next/link';
import BookSettings from '../components/BookSettings';
import { SITE_URL } from '../lib/fetch';

export const metadata: Metadata = {
  title: 'Book Settings — Choose your Mushaf | I Love Islam',
  description:
    'Choose the Mushaf layout for reading and memorisation: Madani Mushaf or Indo-Pak Script. Everything stays on your device.',
  alternates: { canonical: `${SITE_URL}/hifz/setup` },
  robots: { index: false, follow: true },
};

export default function SetupPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:pt-8">
      <div className="flex items-center justify-between">
        <Link
          href="/hifz/settings"
          className="inline-flex min-h-11 items-center rounded-full border border-[#E8EAED] bg-white px-4 text-sm font-semibold text-[#111827] hover:bg-[#F2F4F3]"
        >
          ← Settings
        </Link>
      </div>
      <h1 className="mt-6 text-center text-xl font-bold text-[#111827]">Setup</h1>
      <div className="mt-4">
        <BookSettings continueHref="/hifz/settings" />
      </div>
    </main>
  );
}
