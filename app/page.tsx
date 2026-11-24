// app/page.tsx — the landing page is the Mushaf Reader (Step 1 of
// the step-by-step Tarteel match): the reader screen opens when the
// website opens. Server-rendered with page 1 (Al-Fatihah) so the
// first paint already has the real text.

import type { Metadata } from 'next';
import ReaderScreen from './hifz/components/ReaderScreen';
import { fetchReaderPage } from './hifz/lib/reader-page';

export const metadata: Metadata = {
  title: 'Read the Quran — Mushaf Reader | I Love Islam',
  description:
    'Read the Quran in the Madani Mushaf with tajweed colours. Swipe through all 604 pages — Al-Fatihah to An-Nas. Free, no sign-up.',
  alternates: { canonical: 'https://www.iloveislam.life/' },
  openGraph: {
    title: 'Read the Quran — Mushaf Reader | I Love Islam',
    description:
      'Read the Quran in the Madani Mushaf with tajweed colours. Swipe through all 604 pages. Free, no sign-up.',
    url: 'https://www.iloveislam.life/',
    type: 'website',
  },
};

export const revalidate = 3600;

export default async function HomePage() {
  const initial = await fetchReaderPage(1);
  return <ReaderScreen initial={initial} />;
}
