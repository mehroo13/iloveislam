// app/hifz/search/page.tsx — Search hub (spec §22).
// Tarteel-style minimal screen: no breadcrumb, no big page heading — the
// SearchClient renders the back arrow + "Search" title, the empty results
// area and the bottom-docked search pill itself.
import type { Metadata } from 'next';
import SearchClient from '../components/SearchClient';
import { Attribution } from '../components/HifzShared';
import { SITE_URL } from '../lib/fetch';

export const metadata: Metadata = {
  title: 'Search the Quran — Text & Voice | I Love Islam',
  description:
    'Find any ayah by Arabic or English words, or by reciting it. Jump to any surah, juz or mushaf page. Free, no sign-up.',
  alternates: { canonical: `${SITE_URL}/hifz/search` },
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const q = (await searchParams)?.q ?? '';
  return (
    <main className="mx-auto w-full max-w-3xl pb-10">
      <SearchClient initialQuery={q} />
      <div className="px-4 pt-6">
        <Attribution reciterName="Mishary Alafasy" />
      </div>
    </main>
  );
}
