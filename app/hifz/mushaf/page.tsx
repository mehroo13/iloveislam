// app/hifz/mushaf/page.tsx — the Mushaf reader: all 604 Madani pages in
// one continuous reader, or one page at a time (Part 2, §4–6).
import type { Metadata } from 'next';
import { Suspense } from 'react';
import MushafReader from '../components/MushafReader';

export const metadata: Metadata = {
  title: 'Mushaf Reader — Read the Quran Continuously | I Love Islam',
  description:
    'Read the whole Madani Mushaf — all 604 pages in one continuous reader, or one page at a time. Pinch to zoom, jump to any page, Surah or ayah, and pick up where you left off. Free, no sign-up.',
  alternates: { canonical: 'https://www.iloveislam.life/hifz/mushaf' },
  openGraph: {
    title: 'Mushaf Reader — Read the Quran Continuously | I Love Islam',
    description:
      'All 604 pages of the Madani Mushaf in one continuous reader, or one page at a time. Free, no sign-up.',
    url: 'https://www.iloveislam.life/hifz/mushaf',
    siteName: 'I Love Islam',
    type: 'website',
  },
};

export default function MushafReaderPage() {
  return (
    <Suspense fallback={null}>
      <MushafReader />
    </Suspense>
  );
}
