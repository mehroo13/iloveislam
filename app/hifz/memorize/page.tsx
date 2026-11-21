// app/hifz/memorize/page.tsx — Memorize tab (spec §22).
import type { Metadata } from 'next';
import MemorizeClient from '../components/MemorizeClient';
import { Breadcrumb, Attribution } from '../components/HifzShared';
import { SITE_URL } from '../lib/fetch';

export const metadata: Metadata = {
  title: 'Memorize — Hide & Recite | I Love Islam',
  description:
    'Test your memorisation by hiding the verses and reciting from memory. Track every surah, juz and hizb. Free, no sign-up.',
  alternates: { canonical: `${SITE_URL}/hifz/memorize` },
  robots: { index: false, follow: true },
};

export default function MemorizePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hifz', href: '/hifz' },
          { label: 'Memorize' },
        ]}
      />
      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#102E26] sm:text-4xl">Memorize</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5b6b62] sm:text-base">
          Hide the words, recite from memory, and watch the tracker fill in.
        </p>
      </header>
      <div className="mt-6">
        <MemorizeClient />
      </div>
      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
