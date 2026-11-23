// app/hifz/components/SurahList.tsx — the one surah list, used by the
// homepage and the Hifz hub. Tarteel-style "Chapter and Juz Lists"
// (2026-11-23): Recently Read card, Chapters / Parts / Bookmarks tabs,
// ascending/descending sort, per-surah memorisation markers, Juz header
// rows grouping the surahs, and a right-edge 1–30 Juz quick-jump rail.
// All / Started / Memorised progress-filter chips (restored 2026-11-23
// from the pre-rebuild list) sit under the search box on the Chapters tab.
// Search (English name, meaning, number, or Arabic name — diacritics
// optional) stays at the top and every row still navigates to its surah.
// Progress and bookmarks come only from on-device storage — nothing is
// invented: rows without memorisation data show no marker, and the
// Recently Read card hides entirely when there is no history.
'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ALL_SURAHS, getSurahById, type HifzSurah } from '../surahs';
import { JUZ_PAGES } from '../juz';
import { SURAH_FIRST_PAGE } from '../mushaf';
import { loadBookmarks, type BookmarkEntry } from '../lib/bookmarks';
import { useHifzProgress } from './ProgressWidget';
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

type Tab = 'chapters' | 'parts' | 'bookmarks';
type SortDir = 'asc' | 'desc';
type ProgressFilter = 'all' | 'started' | 'memorised';

export default function SurahList() {
  const t = useT();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>('chapters');
  const [filter, setFilter] = useState<ProgressFilter>('all');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showProgress, setShowProgress] = useState(true);
  const [lastRead, setLastRead] = useState<HifzSurah | null>(null);
  const [recentIds, setRecentIds] = useState<number[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const progress = useHifzProgress();

  // Recently opened + bookmarks are local-only, read once on mount.
  useEffect(() => {
    try {
      const lr = localStorage.getItem('ili_last_read_v1');
      if (lr) {
        const parsed = JSON.parse(lr) as { surah?: number; name?: string; slug?: string };
        const s = typeof parsed?.surah === 'number' ? getSurahById(parsed.surah) : undefined;
        if (s) setLastRead(s);
      }
      const r = localStorage.getItem('ili_hifz_recent_surahs_v1');
      if (r) {
        setRecentIds(
          (JSON.parse(r) as { id?: number }[])
            .map((x) => Number(x?.id))
            .filter((n) => n >= 1 && n <= 114),
        );
      }
      setBookmarks(loadBookmarks());
    } catch {
      /* storage unavailable — the list still works */
    }
  }, []);

  // Per-surah memorised/learning counts, for the progress markers.
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

  // The Recently Read card shows the last-read surah (falling back to the
  // most recent entry in the recent list). Hidden when there is no history.
  const recentlyRead = useMemo(() => {
    if (lastRead) return lastRead;
    const first = recentIds.map((id) => getSurahById(id)).find((s) => s !== undefined);
    return first ?? null;
  }, [lastRead, recentIds]);

  const searching = q.trim() !== '';
  // While searching, always show the flat Chapters list.
  const activeTab: Tab = searching ? 'chapters' : tab;

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
    // Progress filter (restored from the pre-rebuild list): applies on top
    // of the search, using the same per-surah counts as the row markers.
    // 'started' = any ayah memorised or learning; 'memorised' = every ayah
    // of the surah memorised.
    if (filter !== 'all') {
      list = list.filter((s) => {
        const c = surahCounts.get(s.id) ?? { memorised: 0, learning: 0 };
        if (filter === 'started') return c.memorised + c.learning > 0;
        return c.memorised >= s.ayahCount && s.ayahCount > 0;
      });
    }
    return [...list].sort((a, b) => (sortDir === 'asc' ? a.id - b.id : b.id - a.id));
  }, [q, sortDir, filter, surahCounts]);

  const juzOrder = useMemo(
    () => (sortDir === 'asc' ? Array.from({ length: 30 }, (_, i) => i + 1) : Array.from({ length: 30 }, (_, i) => 30 - i)),
    [sortDir],
  );

  const bookmarked = useMemo(
    () => [...bookmarks].sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0)),
    [bookmarks],
  );

  const jumpToJuz = (n: number) => {
    document.getElementById(`juz-head-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showRail = activeTab === 'chapters' && !searching;

  return (
    <section aria-labelledby="surahs-heading">
      {/* Search — English name, meaning, number, or Arabic name */}
      <label className="block">
        <span className="sr-only">{t('list.searchSurahs')}</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('list.searchPlaceholder')}
          className="w-full rounded-full border border-[#E8EAED] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1FA36B]"
        />
      </label>

      {/* Progress filter — All / Started / Memorised. Chips only on the
          Chapters tab (searching forces the Chapters list, so the filter
          applies to the searched list too); Parts and Bookmarks tabs
          don't list surah rows, so the chips hide there. */}
      {activeTab === 'chapters' && (
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
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                filter === f
                  ? 'bg-[#1FA36B] text-white shadow-sm'
                  : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E8EAED]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Recently Read — only when there is real history, never faked */}
      {!searching && recentlyRead && (
        <div className="mt-4">
          <p className="text-base text-[#111827]">Recently Read</p>
          <Link
            href={`/hifz/${recentlyRead.slug}`}
            className="mt-2 flex items-stretch overflow-hidden rounded-xl border border-[#E8EAED] bg-white shadow-sm"
          >
            <span className="flex items-center gap-3 px-3 py-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8EAED] text-sm font-bold text-[#111827]">
                {recentlyRead.id}:1
              </span>
              <span>
                <span className="block text-base font-bold text-[#111827]">{recentlyRead.name}</span>
                <span className="block text-xs text-[#6B7280]">PG. {SURAH_FIRST_PAGE[recentlyRead.id] ?? 1}</span>
              </span>
            </span>
            <span className="ml-auto flex w-12 items-center justify-center bg-[#D9F7E8]">
              <svg viewBox="0 0 24 24" fill="none" stroke="#1FA36B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </span>
          </Link>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="surahs-heading" className="text-xl font-bold text-[#111827] sm:text-2xl">
          Chapter and Juz Lists
        </h2>
        <Link href="/hifz/juz-amma" className="text-sm font-semibold text-[#1FA36B] hover:underline">
          {t('list.juzAmmaPath')}
        </Link>
      </div>

      {/* Tabs: Chapters / Parts / Bookmarks */}
      <div className="mt-3 flex gap-2" role="tablist" aria-label="Chapter and Juz Lists">
        {(
          [
            ['chapters', 'Chapters'],
            ['parts', 'Parts'],
            ['bookmarks', 'Bookmarks'],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={activeTab === value}
            onClick={() => setTab(value)}
            className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === value
                ? 'border border-[#111827]/20 bg-white text-[#111827] shadow-sm'
                : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E8EAED]'
            }`}
          >
            {value === 'bookmarks' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
              </svg>
            )}
            {label}
          </button>
        ))}
      </div>

      {/* Sort + shown-progress controls */}
      <div className="mt-3 flex items-start justify-between gap-3 px-1">
        <button
          type="button"
          onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          aria-label={`Sort by ${sortDir === 'asc' ? 'descending' : 'ascending'}`}
          className="flex items-start gap-1.5 text-left text-[#6B7280] hover:text-[#111827]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
            <path d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m0 0L3 12m4.5 4.5L12 21m0 0 4.5-4.5M12 21V7.5m0 0L16.5 3M12 7.5l4.5 4.5" />
          </svg>
          <span className="text-[11px] font-bold uppercase leading-tight tracking-wide">
            Sort by
            <span className="block">{sortDir === 'asc' ? 'Ascending' : 'Descending'}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setShowProgress((v) => !v)}
          aria-pressed={showProgress}
          className="flex items-start gap-1.5 text-left text-[#6B7280] hover:text-[#111827]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
            <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          <span className="text-[11px] font-bold uppercase leading-tight tracking-wide">
            Shown progress
            <span className="block">Memorization</span>
          </span>
        </button>
      </div>

      {/* Chapters tab — surah rows grouped under Juz headers */}
      {activeTab === 'chapters' && (
        <div className="mt-3 flex gap-1.5">
          <div className="min-w-0 flex-1">
            {filtered.length === 0 ? (
              <p className="mt-4 text-sm text-[#6B7280]">
                {q.trim() ? `${t('list.noMatch')} “${q}”.` : `${t('list.noMatch')}.`}
              </p>
            ) : (
              <ul className="overflow-hidden rounded-2xl border border-[#E8EAED] bg-white shadow-sm">
                {searching
                  ? filtered.map((s) => <SurahRow key={s.slug} s={s} counts={surahCounts.get(s.id)} showProgress={showProgress} />)
                  : juzOrder.map((j) => {
                      // A progress filter can empty a whole Juz — skip its
                      // header rather than showing a header with no rows.
                      const rows = filtered.filter((s) => s.juz === j);
                      if (rows.length === 0) return null;
                      return (
                        <Fragment key={j}>
                          <li id={`juz-head-${j}`} className="scroll-mt-24 bg-[#F3F4F6] px-4 py-2 text-sm font-semibold text-[#111827]">
                            Juz {j}
                          </li>
                          {rows.map((s) => (
                            <SurahRow key={s.slug} s={s} counts={surahCounts.get(s.id)} showProgress={showProgress} />
                          ))}
                        </Fragment>
                      );
                    })}
              </ul>
            )}
          </div>

          {/* Right-edge Juz quick-jump rail */}
          {showRail && (
            <nav aria-label="Jump to Juz" className="sticky top-24 flex shrink-0 flex-col self-start">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => jumpToJuz(n)}
                  aria-label={`Jump to Juz ${n}`}
                  className="flex h-[19px] w-5 items-center justify-center rounded-full text-[10px] font-semibold leading-none text-[#6B7280] hover:bg-[#E4FFF2] hover:text-[#1FA36B]"
                >
                  {n}
                </button>
              ))}
            </nav>
          )}
        </div>
      )}

      {/* Parts tab — the 30 juz */}
      {activeTab === 'parts' && (
        <ul className="mt-3 divide-y divide-[#E8EAED] overflow-hidden rounded-2xl border border-[#E8EAED] bg-white shadow-sm">
          {juzOrder.map((n) => {
            const j = JUZ_PAGES[n - 1];
            if (!j) return null;
            const first = getSurahById(j.segments[0]?.surahId ?? 1);
            return (
              <li key={j.n}>
                <Link href={`/hifz/juz/${j.n}`} className="flex min-w-0 items-center gap-3 px-4 py-3 hover:bg-[#FFFBF2]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E4FFF2] text-xs font-bold text-[#1FA36B]">
                    {j.n}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-[#111827]">
                      Juz {j.n} · {j.name}
                    </span>
                    <span className="block truncate text-sm text-[#6B7280]">
                      {j.totalAyahs} {t('common.ayahs')}
                      {first ? ` · ${first.name}` : ''}
                    </span>
                  </span>
                  <span dir="rtl" lang="ar" className="font-quran shrink-0 text-2xl text-[#111827]">
                    {j.arabic}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Bookmarks tab — saved ayahs and Mushaf pages, newest first */}
      {activeTab === 'bookmarks' && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-[#E8EAED] bg-white shadow-sm">
          {bookmarked.length === 0 ? (
            <div className="p-5 text-center">
              <p className="text-sm text-[#6B7280]">No bookmarks yet. Bookmark an ayah or a Mushaf page while you read and it will show up here.</p>
              <Link href="/hifz/bookmarks" className="mt-3 inline-block rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]">
                View bookmarks →
              </Link>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-[#E8EAED]">
                {bookmarked.map((b, i) => {
                  if (b.kind === 'page') {
                    return (
                      <li key={`page-${b.page}-${i}`}>
                        <Link href={`/hifz/mushaf/${b.page}`} className="flex min-w-0 items-center gap-3 px-4 py-3 hover:bg-[#FFFBF2]">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E4FFF2] text-xs font-bold text-[#1FA36B]">
                            {b.page}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-bold text-[#111827]">Mushaf page {b.page}</span>
                            {b.note && <span className="block truncate text-sm text-[#6B7280]">{b.note}</span>}
                          </span>
                          <span className="shrink-0 text-sm text-[#6B7280]">›</span>
                        </Link>
                      </li>
                    );
                  }
                  const s = getSurahById(b.surahNumber ?? 0);
                  if (!s) return null;
                  return (
                    <li key={`ayah-${b.surahNumber}-${b.verseNumber}-${i}`}>
                      <Link href={`/hifz/${s.slug}?mode=recite&ayah=${b.verseNumber}`} className="flex min-w-0 items-center gap-3 px-4 py-3 hover:bg-[#FFFBF2]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E4FFF2] text-xs font-bold text-[#1FA36B]">
                          {s.id}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold text-[#111827]">
                            {s.name} {b.surahNumber}:{b.verseNumber}
                          </span>
                          {b.note ? (
                            <span className="block truncate text-sm text-[#6B7280]">{b.note}</span>
                          ) : (
                            <span className="block truncate text-sm text-[#6B7280]">{s.meaning}</span>
                          )}
                        </span>
                        <span dir="rtl" lang="ar" className="font-quran shrink-0 text-2xl text-[#111827]">
                          {s.arabic}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-[#E8EAED] p-3 text-center">
                <Link href="/hifz/bookmarks" className="text-sm font-semibold text-[#1FA36B] hover:underline">
                  View all bookmarks →
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      <p className="mt-3 text-sm text-[#6B7280]">
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

/** One surah row: number, bold name, "{n} Verses" + Meccan/Medinan, Arabic
 *  right-aligned — and a small memorisation marker only when this surah
 *  has real progress data. */
function SurahRow({
  s,
  counts,
  showProgress,
}: {
  s: HifzSurah;
  counts?: { memorised: number; learning: number };
  showProgress: boolean;
}) {
  const memorised = counts?.memorised ?? 0;
  const learning = counts?.learning ?? 0;
  const hasData = memorised + learning > 0;
  const pct = s.ayahCount > 0 ? Math.round((memorised / s.ayahCount) * 100) : 0;
  return (
    <li>
      <Link href={`/hifz/${s.slug}`} className="flex min-w-0 items-center gap-3 px-4 py-3 hover:bg-[#FFFBF2]">
        <span className="w-6 shrink-0 text-center text-sm font-semibold text-[#111827]">{s.id}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-bold text-[#111827]">{s.name}</span>
          <span className="block text-sm leading-snug text-[#6B7280]">
            {s.ayahCount} Verses
            <span className="block">{s.revelation === 'Makki' ? 'Meccan' : 'Medinan'}</span>
          </span>
          {showProgress && hasData && (
            <span className="mt-1.5 block max-w-36">
              <span className="block h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]">
                <span className="block h-full rounded-full bg-[#1FA36B]" style={{ width: `${pct}%` }} />
              </span>
              <span className="mt-0.5 block text-[11px] font-semibold text-[#1FA36B]">
                {memorised > 0 ? `${pct}% memorised` : `${learning} learning`}
              </span>
            </span>
          )}
        </span>
        <span dir="rtl" lang="ar" className="font-quran shrink-0 text-2xl text-[#111827]">
          {s.arabic}
        </span>
      </Link>
    </li>
  );
}
