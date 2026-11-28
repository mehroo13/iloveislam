// app/hifz/recite/page.tsx — the Recite with Coach screen (rebuilt
// 2026-11-27): ONE simple white screen, one ayah at a time. The coach
// itself lives here now — no picker, no redirect to the surah page.
import type { Metadata } from 'next';
import ReciteClient from '../components/ReciteClient';
import { SITE_URL } from '../lib/fetch';

export const metadata: Metadata = {
  title: 'Recite with Coach — I Love Islam',
  description:
    'Listen, hide the words, and recite the ayah aloud. The coach follows your recitation word by word, on your device. Free, no sign-up.',
  alternates: { canonical: `${SITE_URL}/hifz/recite` },
  robots: { index: false, follow: true },
};

export default async function RecitePage({
  searchParams,
}: {
  searchParams?: Promise<{ surah?: string; ayah?: string; from?: string }>;
}) {
  const sp = await searchParams;
  const ayah = sp?.ayah ? Number(sp.ayah) : undefined;
  return (
    <main className="min-h-dvh bg-[#F4F5F7] text-[#1C2420]">
      <ReciteClient
        initialSurah={sp?.surah}
        initialAyah={Number.isFinite(ayah) ? ayah : undefined}
        initialFrom={sp?.from}
      />
    </main>
  );
}
