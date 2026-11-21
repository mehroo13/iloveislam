// app/hifz/test/page.tsx — Test Mode (spec §15.1).
import type { Metadata } from 'next';
import TestClient from '../components/TestClient';
import { Breadcrumb, Attribution } from '../components/HifzShared';
import { SITE_URL } from '../lib/fetch';

export const metadata: Metadata = {
  title: 'Test Mode — Exam-Style Recall Test | Hifz',
  description:
    'Test your hifz like a teacher would: random ayahs from what you have memorised, Arabic hidden, no cue. Recite from memory and mark yourself honestly.',
  alternates: { canonical: `${SITE_URL}/hifz/test` },
  robots: { index: false, follow: true },
};

export default function TestPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hifz', href: '/hifz' },
          { label: 'Test Mode' },
        ]}
      />
      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#0B3D2E] sm:text-4xl">Test Mode</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5b6b62] sm:text-base">
          Random ayahs, no cue, no peeking without cost. This is the exam Tarteel added
          in 2026 — here it is free, and a reveal counts as a miss, like a peek in the
          coach. The coach checks words, not tajweed; a teacher is still needed for
          tajweed.
        </p>
      </header>
      <div className="mt-6">
        <TestClient />
      </div>
      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
