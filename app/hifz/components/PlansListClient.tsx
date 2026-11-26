// app/hifz/components/PlansListClient.tsx — the per-surah plans list
// (P1 + P2, 2026-11-26). P1: plans exist for ALL 114 surahs, Juz
// Amma included — the page used to list only surahs 1–77. P2: the
// page is ~120,000px tall with 155 Start buttons and had no way to
// find a surah; a filter box (name or number) narrows the list live.
// getPlan is a pure function, so the list renders client-side.
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ALL_SURAHS } from '../surahs';
import { getPlan } from '../plans';
import PlanCard from './PlanCard';

export default function PlansListClient() {
  const [filter, setFilter] = useState('');
  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return ALL_SURAHS;
    const n = Number(q);
    return ALL_SURAHS.filter((s) => {
      if (!Number.isNaN(n) && n >= 1 && n <= 114 && s.id === n) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.meaning.toLowerCase().includes(q) ||
        s.arabic.includes(filter.trim())
      );
    });
  }, [filter]);

  return (
    <div>
      <label className="block text-sm font-semibold text-[#102E26]">
        Find a surah&apos;s plan
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Surah name or number — e.g. Al-Mulk, 67"
          aria-label="Filter surah plans by name or number"
          className="mt-1 block w-full max-w-md rounded-lg border border-[#E8EAED] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1FA36B]"
        />
      </label>
      {shown.length === 0 ? (
        <p className="mt-4 text-sm text-[#5b6b62]">
          No surah matches “{filter.trim()}”. Try a surah name or a number from 1 to 114.
        </p>
      ) : (
        <p className="mt-2 text-sm text-[#5b6b62]">
          Showing {shown.length} of {ALL_SURAHS.length} surahs.
        </p>
      )}
      <div className="mt-4 space-y-6">
        {shown.map((s) => {
          const p7 = getPlan(s.slug, 7);
          const p30 = getPlan(s.slug, 30);
          if (!p7 && !p30) return null;
          return (
            <div key={s.slug}>
              <h3 className="text-lg font-bold text-[#102E26]">
                <Link href={`/hifz/${s.slug}`} className="hover:underline">
                  Surah {s.name} ({s.ayahCount} ayahs)
                </Link>
              </h3>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {p7 && <PlanCard plan={p7} surahSlug={s.slug} surahName={s.name} />}
                {p30 && <PlanCard plan={p30} surahSlug={s.slug} surahName={s.name} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
