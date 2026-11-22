// app/hifz/components/SurahList.tsx — the one surah list, used by the
// homepage and the Hifz hub (Tarteel-simple, 2026-11-21 redesign).
// One compact row per surah: number, name, Arabic, ayah count, a thin
// progress bar, and a single Recite action. A search box filters it.
// No cards, no grids of features — the list IS the navigation.
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ALL_SURAHS } from '../surahs';
import { SurahProgressBar } from './ProgressWidget';
import { useT } from '../lib/i18n';

export default function SurahList() {
  const t = useT();
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return ALL_SURAHS;
    return ALL_SURAHS.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.meaning.toLowerCase().includes(needle) ||
        String(s.id) === needle,
    );
  }, [q]);

  return (
    <section aria-labelledby="surahs-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="surahs-heading" className="text-xl font-bold text-[#102E26] sm:text-2xl">
          {t('list.yourSurahs')}
        </h2>
        <Link href="/hifz/juz-amma" className="text-sm font-semibold text-[#1FA36B] hover:underline">
          {t('list.juzAmmaPath')}
        </Link>
      </div>
      <label className="mt-3 block">
        <span className="sr-only">{t('list.searchSurahs')}</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('list.searchPlaceholder')}
          className="w-full rounded-full border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1FA36B]"
        />
      </label>
      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-[#5b6b62]">{t('list.noMatch')} “{q}”.</p>
      ) : (
        <ul className="mt-3 divide-y divide-[#E5E7EB] rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          {filtered.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/hifz/${s.slug}`}
                className="flex min-w-0 items-center gap-3 px-4 py-3 hover:bg-[#FFFBF2]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E4FFF2] text-xs font-bold text-[#1FA36B]">
                  {s.id}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-[#102E26]">
                    {s.name} <span className="font-normal text-[#5b6b62]">— {s.meaning} · {s.ayahCount} {t('common.ayahs')}</span>
                  </span>
                  <span className="mt-1 block max-w-40">
                    <SurahProgressBar surahId={s.id} ayahCount={s.ayahCount} />
                  </span>
                </span>
                <span dir="rtl" lang="ar" className="font-quran shrink-0 text-2xl text-[#1FA36B]">
                  {s.arabic}
                </span>
                <span className="shrink-0 rounded-full bg-[#102E26] px-3 py-1.5 text-xs font-semibold text-white">
                  {t('common.recite')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm text-[#5b6b62]">
        {filtered.length} {t('common.of')} {ALL_SURAHS.length} {t('list.surahsWord')} ·{' '}
        <Link href="/hifz/plans" className="font-semibold text-[#1FA36B] underline">
          {t('common.plans')}
        </Link>
        {' · '}
        <Link href="/hifz/test" className="font-semibold text-[#1FA36B] underline">
          {t('common.testMode')}
        </Link>
        {' · '}
        <Link href="/hifz/voice-search" className="font-semibold text-[#1FA36B] underline">
          {t('common.voiceSearch')}
        </Link>
        {' · '}
        <Link href="/hifz/challenges" className="font-semibold text-[#1FA36B] underline">
          {t('common.challenges')}
        </Link>
      </p>
    </section>
  );
}
