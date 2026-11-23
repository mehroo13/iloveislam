// app/hifz/my-progress/page.tsx — progress dashboard (spec §5.1).
// Tarteel-clean hub chrome lives in MyProgressClient (back arrow, logo,
// tabs) — no breadcrumb and no big page heading here, like the reference.
import type { Metadata } from 'next';
import MyProgressClient from '../components/MyProgressClient';
import { Attribution } from '../components/HifzShared';
import { SITE_URL } from '../lib/fetch';

export const metadata: Metadata = {
  title: 'My Hifz Progress — Streak & Mistakes | I Love Islam',
  description:
    'Your memorisation progress: streak, daily goal, memorised ayahs, mistake log and export/import. Stored only on this device.',
  alternates: { canonical: `${SITE_URL}/hifz/my-progress` },
  robots: { index: false, follow: true },
};

export default function MyProgressPage() {
  return (
    <main className="mx-auto max-w-3xl bg-[#F4F5F7] px-4 pb-16 pt-4 sm:pt-6">
      <MyProgressClient />
      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
