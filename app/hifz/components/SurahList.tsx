// app/hifz/components/SurahList.tsx — the one surah list, used by the
// homepage and the Hifz hub (Tarteel-simple, 2026-11-21 redesign; Stage 2
// navigation, 2026-11-22).
// One compact row per surah: number, name, Arabic, ayah count, a thin
// progress bar, and a single Recite action. Above the list: recently
// opened surahs, bookmarked surahs, a Juz jump, search (English name,
// meaning, number, or Arabic name — diacritics optional), and a progress
// filter (All / Started / Memorised). No cards, no grids of features —
// the list IS the navigation.
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ALL_SURAHS, getSurahById } from '../surahs';
import { JUZ_PAGES } from '../juz';
import { SurahProgressBar, useHifzProgress } from './ProgressWidget';
import { useT } from '../lib/i18n';

/** Strip Arabic diacritics/tatweel and normalise alef/taa/yaa so a search
 *  typed without diacritics still matches the stored Arabic name
 *  (e.g. "البقره" matches "البقرة"). */
function normArabic(s: string): string {
  return s
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

type ProgressFilter = 'all' | 'started' | 'memorised';

export default function SurahList() {
  const t = useT();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<ProgressFilter>('all');
  const [recentIds, setRecentIds] = useState<number[]>([]);
  const [bookmarkCounts, setBookmarkCounts] = useState<Record<number, number>>({});
  const progress = useHifzProgress();

  // Recently opened + bookmarked surahs are local-only, read once on mount.
  useEffect(() => {
    try {
      const r = localStorage.getItem('ili_hifz_recent_surahs_v1');
      if (r) {
        setRecentIds(
          (JSON.parse(r) as { id?: number }[])
            .map((x) => Number(x?.id))
            .filter((n) => n >= 1 && n <= 114),
        );
      }
      const b = localStorage.getItem('quran_bookmarks_v2');
      if (b) {
        const counts: Record<number, number> = {};
        for (const x of JSON.parse(b) as { surahNumber?: number }[]) {
          const n = Number(x?.surahNumber);
          if (n >= 1 && n <= 114) counts[n] = (counts[n] ?? 0) + 1;
        }
        setBookmarkCounts(counts);
      }
    } catch {
      /* storage unavailable — the list still works */
    }
  }, []);

  // Per-surah memorised/learning counts, for the progress filter.
  const surahCounts = useMemo(() => {
    const m = new Map<number, { memorised: number; learning: number }>();
    if (!progress) return m;
    for (const [key, a] of Object.entries(progress.ayahs)) {
      const sid = Number(key.split(':')[0]);
      const cur = m.get(sid) ?? { memorised: 0, learning: 0 };
      if (a.status === 'memorised') cur.memorised += 1;
      else if (a.status === 'learning') cur.learning += 1;
      m.set(sid, cur);
    }
    return m;
  }, [progress]);
  const hasProgress = surahCounts.size > 0;

  const recentSurahs = useMemo(
    () => recentIds.map((id) => getSurahById(id)).filter((s): s is NonNullable<typeof s> => s !== undefined),
    [recentIds],
  );
  const bookmarkedSurahs = useMemo(
    () =>
      Object.entries(bookmarkCounts)
        .map(([id, count]) => ({ surah: getSurahById(Number(id)), count }))
        .filter((x): x is { surah: NonNullable<typeof x.surah>; count: number } => x.surah !== undefined)
        .sort((a, b) => a.surah.id - b.surah.id),
    [bookmarkCounts],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const needleAr = normArabic(q.trim());
    let list = ALL_SURAHS;
    if (needle) {
      list = ALL_SURAHS.filter(
        (s) =>
          s.name.toLowerCase().includes(needle) ||
          s.meaning.toLowerCase().includes(needle) ||
          String(s.id) === needle ||
          (needleAr.length > 0 && normArabic(s.arabic).includes(needleAr)),
      );
    }
    if (filter !== 'all') {
      list = list.filter((s) => {
        const c = surahCounts.get(s.id) ?? { memorised: 0, learning: 0 };
        if (filter === 'started') return c.memorised + c.learning > 0;
        return c.memorised >= s.ayahCount && s.ayahCount > 0;
      });
    }
    return list;
  }, [q, filter, surahCounts]);

  const showShortcuts = q.trim() === '';

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

      {/* Recently opened surahs */}
      {showShortcuts && recentSurahs.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#5b6b62]">{t('list.recentlyOpened')}</p>
          <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {recentSurahs.map((s) => (
              <li key={s.id} className="shrink-0">
                <Link
                  href={`/hifz/${s.slug}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-semibold text-[#102E26] hover:border-[#1FA36B]"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E4FFF2] text-[11px] font-bold text-[#1FA36B]">
                    {s.id}
                  </span>
                  {s.name}
                  <span dir="rtl" lang="ar" className="font-quran text-base text-[#1FA36B]">
                    {s.arabic}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bookmarked surahs (surahs with at least one bookmarked ayah) */}
      {showShortcuts && bookmarkedSurahs.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#5b6b62]">{t('list.bookmarkedSurahs')}</p>
          <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {bookmarkedSurahs.map(({ surah: s, count }) => (
              <li key={s.id} className="shrink-0">
                <Link
                  href={`/hifz/${s.slug}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-semibold text-[#102E26] hover:border-[#1FA36B]"
                >
                  {s.name}
                  <span className="rounded-full bg-[#FFB800]/20 px-2 py-0.5 text-xs font-bold text-[#102E26]">🔖 {count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Jump to a Juz */}
      <label className="mt-3 block">
        <span className="sr-only">{t('list.browseJuz')}</span>
        <select
          value=""
          onChange={(e) => {
            const n = Number(e.target.value);
            if (n >= 1 && n <= 30) router.push(`/hifz/juz/${n}`);
          }}
          className="w-full rounded-full border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1FA36B]"
        >
          <option value="">{t('list.jumpToJuz')}</option>
          {JUZ_PAGES.map((j) => {
            const first = getSurahById(j.segments[0]?.surahId ?? 1);
            return (
              <option key={j.n} value={j.n}>
                Juz {j.n} — {j.name}
                {first ? ` · ${first.name}` : ''}
              </option>
            );
          })}
        </select>
      </label>

      {/* Search — English name, meaning, number, or Arabic name */}
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

      {/* Progress filter */}
      {hasProgress && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by progress">
          {(
            [
              ['all', t('list.filterAll')],
              ['started', t('list.filterStarted')],
              ['memorised', t('prog.memorised')],
            ] as [ProgressFilter, string][]
          ).map(([f, label]) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`min-h-11 rounded-full px-4 py-1.5 text-sm font-semibold ${
                filter === f ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] bg-white hover:border-[#1FA36B]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-[#5b6b62]">
          {q.trim() ? `${t('list.noMatch')} “${q}”.` : `${t('list.noMatch')}.`}
        </p>
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
                    {s.name}{' '}
                    <span className="hidden font-normal text-[#5b6b62] sm:inline">
                      — {s.meaning} · {s.ayahCount} {t('common.ayahs')}
                    </span>
                  </span>
                  <span className="block truncate text-sm text-[#5b6b62] sm:hidden">
                    — {s.meaning} · {s.ayahCount} {t('common.ayahs')}
                  </span>
                  <span className="mt-1 block max-w-40">
                    <SurahProgressBar surahId={s.id} ayahCount={s.ayahCount} />
                  </span>
                </span>
                <span dir="rtl" lang="ar" className="font-quran shrink-0 text-2xl text-[#1FA36B]">
                  {s.arabic}
                </span>
                <span className="hidden shrink-0 rounded-full bg-[#102E26] px-3 py-1.5 text-xs font-semibold text-white sm:inline-block">
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
