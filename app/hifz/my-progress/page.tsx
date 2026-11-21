// app/hifz/my-progress/page.tsx — progress dashboard (spec §5.1).
import type { Metadata } from 'next';
import MyProgressClient from '../components/MyProgressClient';
import { Breadcrumb, Attribution } from '../components/HifzShared';
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
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hifz', href: '/hifz' },
          { label: 'My Progress' },
        ]}
      />
      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#0B3D2E] sm:text-4xl">My progress</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5b6b62] sm:text-base">
          Everything here is stored only on this device — nothing is uploaded. An ayah counts
          as memorised after 3 correct recitations in a row.
        </p>
      </header>
      <div className="mt-6">
        <MyProgressClient />
      </div>
      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
