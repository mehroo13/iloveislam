// app/hifz/components/SettingsHeader.tsx — Settings page header.
// Client component only so the heading follows the interface language;
// the page itself stays a server component (metadata lives there).
'use client';

import { useT } from '../lib/i18n';
import { Breadcrumb } from './HifzShared';

export default function SettingsHeader() {
  const t = useT();
  return (
    <>
      <Breadcrumb
        items={[
          { label: t('nav.home'), href: '/' },
          { label: t('crumb.hifz'), href: '/hifz' },
          { label: t('set.title') },
        ]}
      />
      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#102E26] sm:text-4xl">{t('set.title')}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5b6b62] sm:text-base">
          {t('set.subtitle')}
        </p>
      </header>
    </>
  );
}
