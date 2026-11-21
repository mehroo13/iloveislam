// app/hifz/voice-search/page.tsx — Voice Search (spec §15.2).
import type { Metadata } from 'next';
import VoiceSearchClient from '../components/VoiceSearchClient';
import { Breadcrumb, Attribution } from '../components/HifzShared';
import { SITE_URL } from '../lib/fetch';

export const metadata: Metadata = {
  title: 'Voice Search — Find Any Ayah by Reciting It | I Love Islam',
  description:
    'Recite a few words of any ayah and find it instantly. The browser turns your voice into text on your device, and the match opens straight into the recitation coach.',
  alternates: { canonical: `${SITE_URL}/hifz/voice-search` },
  robots: { index: false, follow: true },
};

export default function VoiceSearchPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hifz', href: '/hifz' },
          { label: 'Voice Search' },
        ]}
      />
      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#102E26] sm:text-4xl">Voice Search</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5b6b62] sm:text-base">
          Heard an ayah and don&apos;t know where it is? Recite it and find it in seconds —
          voice search, free here on the web. Your voice never leaves your
          device: only the recognised words are searched.
        </p>
      </header>
      <div className="mt-6">
        <VoiceSearchClient />
      </div>
      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
