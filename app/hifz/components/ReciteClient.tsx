// app/hifz/components/ReciteClient.tsx — coach entry picker (spec §1.1).
// Pick a surah + ayah + reciter, then go to /hifz/[slug]?mode=recite.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_SURAHS } from '../surahs';
import { RECITERS } from '../../quran/lib';

export default function ReciteClient() {
  const router = useRouter();
  const [slug, setSlug] = useState('al-mulk');
  const [ayah, setAyah] = useState(1);
  const [reciterId, setReciterId] = useState(7);
  const surah = ALL_SURAHS.find((s) => s.slug === slug) ?? ALL_SURAHS[0];

  return (
    <div className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm sm:p-6">
      <label className="block text-sm font-semibold">
        Surah
        <select
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setAyah(1);
          }}
          className="mt-1 block w-full rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2.5 text-sm"
        >
          {ALL_SURAHS.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name} — {s.meaning} ({s.ayahCount} ayahs)
            </option>
          ))}
        </select>
      </label>
      <label className="mt-4 block text-sm font-semibold">
        Start at ayah
        <select
          value={ayah}
          onChange={(e) => setAyah(Number(e.target.value))}
          className="mt-1 block w-full max-w-xs rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2.5 text-sm"
        >
          {Array.from({ length: surah.ayahCount }, (_, i) => i + 1).map((a) => (
            <option key={a} value={a}>
              {surah.id}:{a}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-4 block text-sm font-semibold">
        Reciter
        <select
          value={reciterId}
          onChange={(e) => setReciterId(Number(e.target.value))}
          className="mt-1 block w-full max-w-xs rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2.5 text-sm"
        >
          {RECITERS.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => router.push(`/hifz/${slug}?mode=recite&ayah=${ayah}`)}
        className="mt-6 rounded-full bg-[#0B3D2E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
      >
        Start reciting {surah.name} {surah.id}:{ayah}
      </button>
      <p className="mt-3 text-sm text-[#5b6b62]">
        The coach checks which words you said — it does not judge tajweed. A teacher is still
        needed for tajweed. Your voice never leaves this device.
      </p>
    </div>
  );
}
