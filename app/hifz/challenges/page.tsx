// app/hifz/challenges/page.tsx — group challenges (spec §15.9).
// No accounts: challenges live in localStorage and sync via share links.
import type { Metadata } from 'next';
import ChallengesClient from '../components/ChallengesClient';
import { Breadcrumb, Attribution, BackToReader } from '../components/HifzShared';
import { SITE_URL } from '../lib/fetch';

export const metadata: Metadata = {
  title: 'Group Challenges — Memorise Together | I Love Islam',
  description:
    'Start a memorisation challenge with family or friends — share a code, track group progress. No accounts, no sign-up.',
  alternates: { canonical: `${SITE_URL}/hifz/challenges` },
};

export default function ChallengesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hifz', href: '/hifz' },
          { label: 'Challenges' },
        ]}
      />
      <BackToReader />
      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#102E26] sm:text-4xl">
          Group challenges
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5b6b62] sm:text-base">
          Memorise together. Create a challenge, share the code or link with family
          or friends, and watch the group progress grow. No accounts — progress
          syncs when members share their link back.
        </p>
      </header>
      <div className="mt-6">
        <ChallengesClient />
      </div>
      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
