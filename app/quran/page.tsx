// app/quran/page.tsx — Server Component.
// The surah list and Verse of the Day are fetched server-side (ISR) so the
// page renders instantly with real content instead of "Loading surahs…".
// The interactive reader (verses, audio, tafsir, search, bookmarks, plan)
// lives in QuranClient.
import type { Metadata } from 'next';
import QuranClient from './QuranClient';
import { UPSTREAM_API, VOTD_KEYS, dayOfYear, type Chapter, type Verse } from './lib';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Quran Reader — Read the Quran in Indo-Pak Script | Hifz',
  description:
    'Read the Holy Quran in the Indo-Pak script with English translation, audio recitation and tafsir. Browse all 114 surahs, read by Juz, search, bookmark verses and follow a 30-day reading plan.',
  keywords:
    'quran reader, read quran online, indo-pak quran, quran translation, quran audio, tafsir ibn kathir, quran surahs, juz, reading plan',
  alternates: { canonical: 'https://www.iloveislam.life/quran' },
  openGraph: {
    title: 'Quran Reader — Read the Quran in Indo-Pak Script | Hifz',
    description:
      'Read the Holy Quran in the Indo-Pak script with translation, audio recitation and tafsir.',
    url: 'https://www.iloveislam.life/quran',
    siteName: 'Hifz',
    type: 'website',
  },
};

async function fetchChapters(): Promise<Chapter[]> {
  try {
    const res = await fetch(`${UPSTREAM_API}/chapters?language=en`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.chapters) ? (data.chapters as Chapter[]) : [];
  } catch {
    return [];
  }
}

async function fetchVotd(): Promise<{ verse: Verse | null; key: string }> {
  const key = VOTD_KEYS[dayOfYear(new Date()) % VOTD_KEYS.length];
  try {
    const res = await fetch(`${UPSTREAM_API}/verses/by_key/${key}?fields=text_indopak&translations=20`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { verse: null, key };
    const data = await res.json();
    return { verse: (data?.verse as Verse) ?? null, key };
  } catch {
    return { verse: null, key };
  }
}

export default async function QuranPage() {
  const [chapters, votd] = await Promise.all([fetchChapters(), fetchVotd()]);
  return <QuranClient initialChapters={chapters} initialVotd={votd.verse} initialVotdKey={votd.key} />;
}
