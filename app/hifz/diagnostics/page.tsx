// app/hifz/diagnostics/page.tsx — internal microphone diagnostics.
//
// NOT linked from site navigation and NOT indexed: a troubleshooting tool
// for the recitation coach ("We didn't hear anything" reports). It tests
// the mic and the Arabic recognition engine separately, on this device,
// with nothing uploaded. See DiagnosticsClient for the checks.
import type { Metadata } from 'next';
import DiagnosticsClient from './DiagnosticsClient';
import { Breadcrumb } from '../components/HifzShared';
import { SITE_URL } from '../lib/fetch';

export const metadata: Metadata = {
  title: 'Microphone diagnostics — Hifz | I Love Islam',
  description:
    'Check whether this device microphone works with the recitation coach, and whether the on-device Arabic recognition engine can follow a recitation. Internal tool.',
  alternates: { canonical: `${SITE_URL}/hifz/diagnostics` },
  robots: { index: false, follow: false },
};

export default function DiagnosticsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hifz', href: '/hifz' },
          { label: 'Microphone diagnostics' },
        ]}
      />
      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#102E26] sm:text-4xl">Microphone diagnostics</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5b6b62] sm:text-base">
          If the recitation coach says it cannot hear you, run these checks. They test the
          microphone and the Arabic recognition separately, on this device only — no audio is
          uploaded or stored. Internal tool, not part of the normal Hifz flow.
        </p>
      </header>
      <div className="mt-6">
        <DiagnosticsClient />
      </div>
    </main>
  );
}
