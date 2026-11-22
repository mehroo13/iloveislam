// app/hifz/bookmarks/page.tsx — Bookmarks list (Stage 5, §6).
import type { Metadata } from 'next';
import BookmarksClient from '../components/BookmarksClient';
import { Breadcrumb, Attribution } from '../components/HifzShared';
import { SITE_URL } from '../lib/fetch';

export const metadata: Metadata = {
  title: 'Bookmarks — Saved Ayahs & Mushaf Pages | I Love Islam',
  description:
    'Your saved ayahs and Mushaf pages, with notes. Stored only on this device, included in progress export/import.',
  alternates: { canonical: `${SITE_URL}/hifz/bookmarks` },
  robots: { index: false, follow: true },
};

export default function BookmarksPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hifz', href: '/hifz' },
          { label: 'Bookmarks' },
        ]}
      />
      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#102E26] sm:text-4xl">Bookmarks</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5b6b62] sm:text-base">
          Ayahs and Mushaf pages you saved, with a note on each if you added one.
          Stored only on this device — and included when you export your progress.
        </p>
      </header>
      <div className="mt-6">
        <BookmarksClient />
      </div>
      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
