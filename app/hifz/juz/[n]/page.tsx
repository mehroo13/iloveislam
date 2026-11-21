// app/hifz/juz/[n]/page.tsx — Juz overview (spec §1.1).
// v1 ships only Juz 30, which redirects to /hifz/juz-amma (the same content).
// Any other juz 404s — the remaining juz pages are a v3 rollout.
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

export async function generateStaticParams() {
  return [{ n: '30' }];
}

export const metadata: Metadata = {
  title: 'Juz 30 — Memorise Juz Amma | I Love Islam',
  description:
    'Juz 30 (Juz Amma) — all 37 short surahs with the recitation coach and a 90-day hifz plan. Free, no sign-up.',
};

export default async function JuzPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  if (n === '30') redirect('/hifz/juz-amma');
  notFound();
}
