// app/hifz/components/HifzShared.tsx — shared components for the hub:
// attribution footer, surah hero. (The breadcrumb used to live here
// too; Tarteel has no breadcrumbs anywhere, so Breadcrumb now renders
// nothing — the export stays so the 18 call sites in /hifz pages keep
// compiling, and the pages themselves are untouched.)
'use client';

import type { HifzSurah } from '../surahs';
import Link from 'next/link';
import { ATTRIBUTION } from '../lib/fetch';
import { BISMILLAH } from '../../quran/lib';
import { reciterName } from '../../quran/lib';
import { loadSettings } from '../progress';
import { useEffect, useState } from 'react';
import { useT } from '../lib/i18n';

/** No breadcrumbs in the app (Tarteel has none). Kept as a no-op so
 *  existing call sites compile; renders nothing. */
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  void items;
  return null;
}

/** Back to the Features menu — the reader with the Dashboard overlay
 *  open. A circular back-arrow button, fixed destination
 *  "/?dashboard=1" — never router.back() (the browser history back
 *  looped Settings -> Account -> Settings). The reader opens its
 *  hamburger Dashboard when it sees ?dashboard=1 (ReaderScreen),
 *  so tapping back from any feature screen lands on the menu that
 *  lists every feature, not the bare reader home. Same style as the
 *  Search / Settings back arrows. */
export function BackToReader() {
  const t = useT();
  return (
    <Link href="/?dashboard=1" aria-label={t('rb.search.goBack')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#111827]/25 bg-transparent text-[#111827] hover:bg-white">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true">
        <path d="M15.75 19.5 8.25 12l7.5-7.5" />
      </svg>
    </Link>
  );
}

export function Attribution({ reciterName: reciterNameProp }: { reciterName?: string }) {
  const t = useT();
  // X1 (2026-11-26): the footer used to hardcode "Mishary Alafasy"
  // even when another reciter was picked. The selected reciter lives
  // in settings (ili_hifz_settings_v1, reciterId) — read it on the
  // client and show that name; the prop is only the fallback for
  // pages rendered before settings load.
  const [selectedName, setSelectedName] = useState<string | null>(null);
  useEffect(() => {
    try {
      setSelectedName(reciterName(loadSettings().reciterId));
    } catch {
      /* keep the prop fallback */
    }
  }, []);
  const name = selectedName ?? reciterNameProp;
  return (
    <p className="mt-8 text-center text-xs leading-relaxed text-[#5b6b62]">
      {ATTRIBUTION}
      {name ? ` ${t('shared.audio')} ${name}.` : ''}
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
