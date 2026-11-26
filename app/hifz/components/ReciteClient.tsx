// app/hifz/components/ReciteClient.tsx — coach entry picker (spec §1.1).
// Pick a surah + scope + reciter, then go to /hifz/[slug]?mode=recite.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_SURAHS } from '../surahs';
import { RECITERS } from '../../quran/lib';
import { loadSettings, saveSettings } from '../progress';
import { useT } from '../lib/i18n';

type ScopeKind = 'single' | 'range' | 'whole';

export default function ReciteClient() {
  const router = useRouter();
  const t = useT();
  const [slug, setSlug] = useState('al-fatihah');
  const [ayah, setAyah] = useState(1);
  const [scopeKind, setScopeKind] = useState<ScopeKind>('single');
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(7);
  const [reciterId, setReciterId] = useState(7);
  const surah = ALL_SURAHS.find((s) => s.slug === slug) ?? ALL_SURAHS[0];

  const startReciting = () => {
    // Audit C-1: the reciter pick used to die here — the landing URL
    // carried no reciter and nothing was persisted, so the coach always
    // fell back to Alafasy. Carry it both ways: the ?reciter= param (the
    // surah page honours it on arrival) and the saved settings (so the
    // coach card and later visits keep it).
    try {
      saveSettings({ ...loadSettings(), reciterId });
    } catch {
      /* storage unavailable — the URL param still carries the choice */
    }
    if (scopeKind === 'range') {
      const from = Math.min(rangeFrom, rangeTo);
      const to = Math.max(rangeFrom, rangeTo);
      router.push(`/hifz/${slug}?mode=recite&ayah=${from}&from=${from}&to=${to}&reciter=${reciterId}`);
    } else if (scopeKind === 'whole') {
      router.push(`/hifz/${slug}?mode=recite&ayah=1&from=1&to=${surah.ayahCount}&reciter=${reciterId}`);
    } else {
      router.push(`/hifz/${slug}?mode=recite&ayah=${ayah}&reciter=${reciterId}`);
    }
  };

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
      <label className="block text-sm font-semibold">
        {t('recite.surah')}
        <select
          value={slug}
          onChange={(e) => {
            const next = ALL_SURAHS.find((s) => s.slug === e.target.value) ?? ALL_SURAHS[0];
            setSlug(e.target.value);
            setAyah(1);
            setRangeFrom(1);
            setRangeTo(next.ayahCount);
          }}
          className="mt-1 block w-full rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
        >
          {ALL_SURAHS.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name} — {s.meaning} ({s.ayahCount} {s.ayahCount === 1 ? t('common.ayah') : t('common.ayahs')})
            </option>
          ))}
        </select>
      </label>
      {/* Audit C-2: the picker had no ayah-range control — only "Start at
          ayah" — while the surah coach card has the full One ayah /
          An ayah range / Whole surah choice. Same radios, same labels. */}
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">{t('coach.whatRecite')}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
            <input type="radio" name="recite-scope" checked={scopeKind === 'single'} onChange={() => setScopeKind('single')} />
            {t('coach.oneAyah')}
          </label>
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
            <input type="radio" name="recite-scope" checked={scopeKind === 'range'} onChange={() => setScopeKind('range')} />
            {t('coach.ayahRange')}
          </label>
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
            <input type="radio" name="recite-scope" checked={scopeKind === 'whole'} onChange={() => setScopeKind('whole')} />
            {t('coach.wholeSurah')}
          </label>
        </div>
      </fieldset>
      {scopeKind === 'single' && (
        <label className="mt-4 block text-sm font-semibold">
          {t('recite.startAtAyah')}
          <select
            value={ayah}
            onChange={(e) => setAyah(Number(e.target.value))}
            className="mt-1 block w-full max-w-xs rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
          >
            {Array.from({ length: surah.ayahCount }, (_, i) => i + 1).map((a) => (
              <option key={a} value={a}>
                {surah.id}:{a}
              </option>
            ))}
          </select>
        </label>
      )}
      {scopeKind === 'range' && (
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="text-sm font-semibold">
            {t('coach.fromAyah')}
            <select
              value={rangeFrom}
              onChange={(e) => setRangeFrom(Number(e.target.value))}
              className="mt-1 block min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2 text-sm"
            >
              {Array.from({ length: surah.ayahCount }, (_, i) => i + 1).map((a) => (
                <option key={`f-${a}`} value={a}>
                  {surah.id}:{a}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            {t('coach.toAyah')}
            <select
              value={rangeTo}
              onChange={(e) => setRangeTo(Number(e.target.value))}
              className="mt-1 block min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2 text-sm"
            >
              {Array.from({ length: surah.ayahCount }, (_, i) => i + 1).map((a) => (
                <option key={`t-${a}`} value={a}>
                  {surah.id}:{a}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <label className="mt-4 block text-sm font-semibold">
        {t('recite.reciter')}
        <select
          value={reciterId}
          onChange={(e) => setReciterId(Number(e.target.value))}
          className="mt-1 block w-full max-w-xs rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
        >
          {RECITERS.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={startReciting}
        className="mt-6 rounded-full bg-[#57D798] px-6 py-3 text-sm font-semibold text-[#102E26] hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
      >
        {t('recite.start').replace('{surah}', surah.name).replace('{ref}', `${surah.id}:${scopeKind === 'single' ? ayah : scopeKind === 'range' ? `${Math.min(rangeFrom, rangeTo)}` : 1}`)}
      </button>
      <p className="mt-3 text-sm text-[#5b6b62]">
        {t('recite.coachNote')}
      </p>
    </div>
  );
}
