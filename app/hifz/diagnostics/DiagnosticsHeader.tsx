// app/hifz/diagnostics/DiagnosticsHeader.tsx — translated page header
// for /hifz/diagnostics (Stage 8). The page itself is a server
// component (metadata export), so the h1 + intro live in this tiny
// client island and follow the interface language like the rest of
// the diagnostics screen.
'use client';

import { useT } from '../lib/i18n';

export default function DiagnosticsHeader() {
  const t = useT();
  return (
    <header className="mt-4">
      <h1 className="text-3xl font-bold tracking-tight text-[#102E26] sm:text-4xl">{t('diag.title')}</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#5b6b62] sm:text-base">
        {t('diag.intro')}
      </p>
    </header>
  );
}
