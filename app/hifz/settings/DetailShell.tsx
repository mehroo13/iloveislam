// app/hifz/settings/DetailShell.tsx — shared shell for the Settings detail
// screens (Account, Your Data, Microphone Help, Support): the same
// Tarteel-style top bar (back arrow to /hifz/settings, bold title) over
// the detail content. Client component only so the title follows the
// interface language; each detail page stays a server component
// (metadata lives there).
'use client';

import type { ReactNode } from 'react';
import SettingsHeader from '../components/SettingsHeader';
import { useT } from '../lib/i18n';

export default function DetailShell({ titleKey, children }: { titleKey: string; children: ReactNode }) {
  const t = useT();
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <SettingsHeader title={t(titleKey)} backHref="/hifz/settings" />
      <div className="mt-6">{children}</div>
    </main>
  );
}
