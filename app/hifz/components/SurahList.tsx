// app/hifz/components/SurahList.tsx — the one surah list, used by the
// homepage and the Hifz hub (Tarteel-simple, 2026-11-21 redesign).
// One compact row per surah: number, name, Arabic, ayah count, a thin
// progress bar, and a single Recite action. A search box filters it.
// No cards, no grids of features — the list IS the navigation.
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { LAUNCH_SURAHS } from '../surahs';
import { SurahProgressBar } from './ProgressWidget';

export default function SurahList() {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return LAUNCH_SURAHS;
    return LAUNCH_SURAHS.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.meaning.toLowerCase().includes(needle) ||
        String(s.id) === needle,
    );
  }, [q]);

  return (
    <section aria-labelledby="surahs-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="surahs-heading" className="text-xl font-bold text-[#0B3D2E] sm:text-2xl">
          Your surahs
        </h2>
        <Link href="/hifz/juz-amma" className="text-sm font-semibold text-[#146B4D] hover:underline">
          Juz Amma — the beginner path →
        </Link>
      </div>
      <label className="mt-3 block">
        <span className="sr-only">Search surahs</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a surah — try “Mulk” or “36”"
          className="w-full rounded-full border border-[#e5e0d3] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#146B4D]"
        />
      </label>
      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-[#5b6b62]">No surah matches “{q}”.</p>
      ) : (
        <ul className="mt-3 divide-y divide-[#f0ede4] rounded-2xl border border-[#e5e0d3] bg-white shadow-sm">
          {filtered.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/hifz/${s.slug}`}
                className="flex min-w-0 items-center gap-3 px-4 py-3 hover:bg-[#F7F5EF]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf3ee] text-xs font-bold text-[#146B4D]">
                  {s.id}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-[#0B3D2E]">
                    {s.name} <span className="font-normal text-[#5b6b62]">· {s.ayahCount} ayahs</span>
                  </span>
                  <span className="mt-1 block max-w-40">
                    <SurahProgressBar surahId={s.id} ayahCount={s.ayahCount} />
                  </span>
                </span>
                <span dir="rtl" lang="ar" className="font-quran shrink-0 text-2xl text-[#146B4D]">
                  {s.arabic}
                </span>
                <span className="shrink-0 rounded-full bg-[#0B3D2E] px-3 py-1.5 text-xs font-semibold text-white">
                  Recite
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm text-[#5b6b62]">
        {filtered.length} of {LAUNCH_SURAHS.length} surahs ·{' '}
        <Link href="/hifz/plans" className="font-semibold text-[#146B4D] underline">
          Plans
        </Link>
        {' · '}
        <Link href="/hifz/test" className="font-semibold text-[#146B4D] underline">
          Test Mode
        </Link>
        {' · '}
        <Link href="/hifz/voice-search" className="font-semibold text-[#146B4D] underline">
          Voice Search
        </Link>
        {' · '}
        <Link href="/hifz/challenges" className="font-semibold text-[#146B4D] underline">
          Challenges
        </Link>
      </p>
    </section>
  );
}
