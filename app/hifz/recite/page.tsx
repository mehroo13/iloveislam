// app/hifz/recite/page.tsx — coach entry (spec §1.1).
import type { Metadata } from 'next';
import ReciteClient from '../components/ReciteClient';
import { Breadcrumb, Attribution, BackToReader } from '../components/HifzShared';
import { SITE_URL } from '../lib/fetch';

export const metadata: Metadata = {
  title: 'Recite the Quran — AI Recitation Coach | I Love Islam',
  description:
    'Pick a surah and recite it aloud. The coach follows your recitation word by word, on your device. Free, no sign-up.',
  alternates: { canonical: `${SITE_URL}/hifz/recite` },
  robots: { index: false, follow: true },
};

export default function RecitePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hifz', href: '/hifz' },
          { label: 'Recite' },
        ]}
      />
      <BackToReader />
      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#102E26] sm:text-4xl">Recite with the coach</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5b6b62] sm:text-base">
          Pick a surah and an ayah. Listen first, hide the verse, then recite it from memory.
        </p>
      </header>
      <div className="mt-6">
        <ReciteClient />
      </div>
      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
