// app/hifz/setup/page.tsx — Book Settings (mushaf edition picker),
// standalone, so Settings can link to it (Mushaf Layout row).
//
// Header: pale mint-green gradient wash fading to light grey, "Setup"
// centred — matching the reference. No back pill on this screen.
import type { Metadata } from 'next';
import BookSettings from '../components/BookSettings';
import { SITE_URL } from '../lib/fetch';

export const metadata: Metadata = {
  title: 'Book Settings — Choose your Mushaf | I Love Islam',
  description:
    'Choose the Mushaf layout for reading and memorisation: Madani Mushaf or Indo-Pak Script. Everything stays on your device.',
  alternates: { canonical: `${SITE_URL}/hifz/setup` },
  robots: { index: false, follow: true },
};

export default function SetupPage() {
  return (
    <main className="mx-auto max-w-3xl px-4">
      <div className="-mx-4 bg-[linear-gradient(180deg,#D2EFDF_0%,#E2F4EB_45%,#F4F5F7_100%)] px-4 pb-6 pt-8 sm:pt-10">
        <h1 className="text-center text-xl font-bold text-[#111827]">Setup</h1>
      </div>
      <div className="-mx-4 bg-[#F4F5F7] px-4 pb-24 pt-4">
        <BookSettings continueHref="/hifz/settings" />
      </div>
    </main>
  );
}
