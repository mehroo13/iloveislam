// app/hifz/mistakes/page.tsx — dedicated mistakes overview screen.
// A real route (linkable from the Dashboard, My Progress and the reader
// dashboard) — all data is read client-side from the on-device mistake
// log, like My Progress.
import type { Metadata } from 'next';
import MistakesOverviewClient from '../components/MistakesOverviewClient';
import { SITE_URL } from '../lib/fetch';

export const metadata: Metadata = {
  title: 'Mistakes Overview — Most-Missed Words & Trends | I Love Islam',
  description:
    'Your most-missed words, mistakes by surah, and mistakes over the last 30 days — all from your own recitation log, stored only on this device.',
  alternates: { canonical: `${SITE_URL}/hifz/mistakes` },
  robots: { index: false, follow: true },
};

export default function MistakesOverviewPage() {
  return (
    <main className="mx-auto max-w-3xl bg-[#F4F5F7] px-4 pb-16 pt-4 sm:pt-6">
      <MistakesOverviewClient />
    </main>
  );
}
