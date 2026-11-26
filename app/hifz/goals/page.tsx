// app/hifz/goals/page.tsx — Goals (spec §22).
import type { Metadata } from 'next';
import GoalsClient from '../components/GoalsClient';
import { Breadcrumb, Attribution, BackToReader } from '../components/HifzShared';
import { SITE_URL } from '../lib/fetch';

export const metadata: Metadata = {
  title: 'Goals — Smart Hifz Goals | I Love Islam',
  description:
    'Set a custom hifz goal — portion, deadline and type — and get a daily plan. Free, unlimited goals, no sign-up.',
  alternates: { canonical: `${SITE_URL}/hifz/goals` },
  robots: { index: false, follow: true },
};

export default async function GoalsPage({
  searchParams,
}: {
  searchParams?: Promise<{ preset?: string }>;
}) {
  const preset = (await searchParams)?.preset;
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hifz', href: '/hifz' },
          { label: 'Goals' },
        ]}
      />
      <BackToReader />
      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#102E26] sm:text-4xl">Goals</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5b6b62] sm:text-base">
          Set your intention, get a daily plan, and keep the streak alive.
        </p>
      </header>
      <div className="mt-6">
        <GoalsClient preset={preset} />
      </div>
      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
