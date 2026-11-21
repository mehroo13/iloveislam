// app/hifz/search/page.tsx — Search hub (spec §22).
import type { Metadata } from 'next';
import SearchClient from '../components/SearchClient';
import { Breadcrumb, Attribution } from '../components/HifzShared';
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
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hifz', href: '/hifz' },
          { label: 'Search' },
        ]}
      />
      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#102E26] sm:text-4xl">Search</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5b6b62] sm:text-base">
          Find an ayah by words, by voice, or jump straight to a surah, juz or page.
        </p>
      </header>
      <div className="mt-6">
        <SearchClient initialQuery={q} />
      </div>
      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
