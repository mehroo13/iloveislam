// app/hifz/components/HifzShared.tsx — shared components for the hub:
// attribution footer, surah hero. (The breadcrumb used to live here
// too; Tarteel has no breadcrumbs anywhere, so Breadcrumb now renders
// nothing — the export stays so the 18 call sites in /hifz pages keep
// compiling, and the pages themselves are untouched.)
'use client';

import type { HifzSurah } from '../surahs';
import { ATTRIBUTION } from '../lib/fetch';
import { BISMILLAH } from '../../quran/lib';
import { useT } from '../lib/i18n';

/** No breadcrumbs in the app (Tarteel has none). Kept as a no-op so
 *  existing call sites compile; renders nothing. */
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  void items;
  return null;
}

export function Attribution({ reciterName }: { reciterName?: string }) {
  const t = useT();
  return (
    <p className="mt-8 text-center text-xs leading-relaxed text-[#5b6b62]">
      {ATTRIBUTION}
      {reciterName ? ` ${t('shared.audio')} ${reciterName}.` : ''}
    </p>
  );
}

export function SurahHero({
  surah,
  planDays,
}: {
  surah: HifzSurah;
  planDays?: number;
}) {
  const t = useT();
  return (
    <header className="rounded-2xl bg-[#102E26] px-5 py-8 text-center text-white shadow-sm sm:px-8 sm:py-10">
      <p dir="rtl" lang="ar" className="font-quran text-5xl text-[#FFB800] sm:text-6xl">
        {surah.arabic}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t('common.surah')} {surah.name}</h1>
      <p className="mt-1 text-base text-white/80">
        {surah.meaning} · {t('common.surah')} {surah.id} {t('common.of')} 114
      </p>
      <p className="mt-2 text-sm text-white/70">
        {surah.ayahCount} {t('common.ayahs')} · {surah.revelation} · {t('shared.juz')} {surah.juz}
        {surah.juzEnd && surah.juzEnd !== surah.juz ? `–${surah.juzEnd}` : ''}
        {planDays ? ` · ${planDays}-${t('shared.dayPlanAvailable')}` : ''}
      </p>
      {surah.id !== 1 && surah.id !== 9 && (
        <p dir="rtl" lang="ar" className="font-quran mt-5 text-2xl text-white/90 sm:text-3xl">
          {BISMILLAH}
        </p>
      )}
    </header>
  );
}
