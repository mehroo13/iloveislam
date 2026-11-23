// app/hifz/components/SearchClient.tsx — Search (spec §22).
// Tarteel-style Search screen (2026-11-23): light grey background, back
// arrow, "Search" title, a search-field pill with a green mic button at
// its right (→ /hifz/voice-search), and clean white result cards.
// Arabic/English text search, search by surah / juz / page, and Similar
// Verses: results show Arabic + translation with share/copy and Continue
// Reading. The dark-green Voice Search card is now a clean white card
// with green accents — no dark navy. All behaviour is unchanged.
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ALL_SURAHS, getSurahById } from '../surahs';
import { SURAH_FIRST_PAGE } from '../mushaf';
import { JUZ_PAGES } from '../juz';
import { useT, t as tr, getUiLocale } from '../lib/i18n';

interface SearchResult {
  verse_key: string;
  text: string;
  translations?: { text: string }[];
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}

export default function SearchClient({ initialQuery }: { initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery ?? '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const t = useT();
  const router = useRouter();

  // Jump-to controls
  const [jumpSurah, setJumpSurah] = useState(2);
  const [jumpJuz, setJumpJuz] = useState(1);
  const [jumpPage, setJumpPage] = useState(3);

  const runSearch = useCallback(async (query: string) => {
    const queryTrim = query.trim();
    if (!queryTrim) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/quran/search?q=${encodeURIComponent(queryTrim)}&size=10&language=en`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = (data?.search?.results ?? []) as SearchResult[];
      setResults(list);
      setTotal(Number(data?.search?.total_results ?? list.length) || list.length);
    } catch {
      setError(tr('search.error', getUiLocale()));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) void runSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const shareResult = async (r: SearchResult) => {
    const text = `${r.text}\n${r.verse_key}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else await copyText(text, r.verse_key);
    } catch {
      /* share cancelled */
    }
  };

  return (
    <div className="rounded-3xl bg-[#F1F2F4] px-3 py-4 sm:px-5 sm:py-5">
      {/* Header: back arrow + "Search" title */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#111827]/25 bg-transparent text-[#111827] hover:bg-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
            <path d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-[#111827]">Search</h2>
      </div>

      <div className="mt-5 space-y-5">
        {/* Text search — pill with a green mic button at its right */}
        <section aria-label={t('search.sectionLabel')}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runSearch(q);
            }}
          >
            <div className="flex items-center gap-2 rounded-full border border-[#E8EAED] bg-white py-1.5 pl-4 pr-1.5 shadow-sm focus-within:border-[#1FA36B]">
              <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0" aria-hidden="true">
                <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <label htmlFor="hifz-search" className="sr-only">
                {t('search.label')}
              </label>
              <input
                id="hifz-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g. Al-Baqarah, 2:255, pg 40, …"
                className="min-w-0 flex-1 bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
              />
              <button type="submit" disabled={loading || !q.trim()} className="sr-only">
                {t('common.search')}
              </button>
              <Link
                href="/hifz/voice-search"
                aria-label="Voice search"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#57D798] text-white shadow-sm hover:brightness-105"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                  <path d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 0 3-3V4.5a3 3 0 1 0-6 0v8.25a3 3 0 0 0 3 3Z" />
                </svg>
              </Link>
            </div>
          </form>
          <p className="mt-2 px-2 text-xs text-[#6B7280]">
            Type Arabic or English words to find the ayah. Or recite a phrase —{' '}
            <Link href="/hifz/voice-search" className="inline-block py-1 font-semibold text-[#1FA36B] underline">
              Voice Search finds it by sound →
            </Link>
          </p>
          {error && (
            <p role="alert" className="mt-3 px-2 text-sm text-red-700">{error}</p>
          )}
        </section>

        {/* Results — clean white cards on the light grey background */}
        {searched && (
          <section aria-label={t('search.resultsLabel')} className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-[#111827]">{t('search.results')}</h2>
            {q.trim() && (
              <p dir="auto" className="mt-1 text-sm text-[#6B7280]">
                {t('search.forQuery').replace('{q}', q.trim()).replace('{n}', String(total)).replace('{ayahWord}', total === 1 ? t('common.ayah') : t('common.ayahs'))}
              </p>
            )}
            {results.length === 0 && !loading ? (
              <p className="mt-3 text-sm text-[#6B7280]">
                {t('search.nothingFound')}
              </p>
            ) : (
              <ul className="mt-4 space-y-5">
                {results.map((r) => {
                  const [s, a] = r.verse_key.split(':').map(Number);
                  const surah = getSurahById(s);
                  const translation = stripHtml(r.translations?.[0]?.text ?? '');
                  return (
                    <li key={r.verse_key} className="border-b border-[#E8EAED] pb-5 last:border-0 last:pb-0">
                      <p className="flex items-center gap-2 text-sm">
                        <span className="rounded-md border border-[#E8EAED] px-2 py-0.5 text-xs font-bold">{r.verse_key}</span>
                        <span className="font-bold">{surah ? surah.name : `Surah ${s}`}</span>
                      </p>
                      <p dir="rtl" lang="ar" className="font-quran mt-3 text-right text-2xl leading-loose sm:text-3xl">
                        {r.text}
                      </p>
                      {translation && (
                        <p className="mt-2 text-sm leading-relaxed text-[#1C2420]/85">{translation}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void shareResult(r)}
                          className="min-h-11 rounded-full border border-[#E8EAED] px-3.5 py-1.5 text-sm font-semibold hover:border-[#1FA36B]"
                        >
                          {t('search.share')}
                        </button>
                        <button
                          type="button"
                          onClick={() => void copyText(`${r.text} (${r.verse_key})`, r.verse_key)}
                          className="min-h-11 rounded-full border border-[#E8EAED] px-3.5 py-1.5 text-sm font-semibold hover:border-[#1FA36B]"
                        >
                          {copied === r.verse_key ? t('search.copied') : t('search.copy')}
                        </button>
                        {surah && (
                          <Link
                            href={`/hifz/${surah.slug}?mode=recite&ayah=${a}`}
                            className="inline-flex min-h-11 items-center justify-center ml-auto rounded-full bg-[#102E26] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#1FA36B]"
                          >
                            {t('search.continueReading')}
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* Jump to surah / juz / page */}
        <section aria-labelledby="jump-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
          <h2 id="jump-heading" className="text-xl font-bold text-[#111827]">{t('search.jump')}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold">
                {t('search.surah')}
                <select
                  value={jumpSurah}
                  onChange={(e) => setJumpSurah(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-[#E8EAED] bg-white px-3 py-2.5 text-sm"
                >
                  {ALL_SURAHS.map((s) => (
                    <option key={s.id} value={s.id}>{s.id}. {s.name}</option>
                  ))}
                </select>
              </label>
              <Link
                href={`/hifz/${ALL_SURAHS[jumpSurah - 1]?.slug ?? 'al-fatihah'}`}
                className="inline-flex min-h-11 items-center justify-center mt-2 inline-block rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
              >
                {t('search.openSurah')}
              </Link>
              <p className="mt-1 text-xs text-[#6B7280]">{t('search.startsOnPage').replace('{p}', String(SURAH_FIRST_PAGE[jumpSurah] ?? '?'))}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold">
                {t('search.juz')}
                <select
                  value={jumpJuz}
                  onChange={(e) => setJumpJuz(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-[#E8EAED] bg-white px-3 py-2.5 text-sm"
                >
                  {JUZ_PAGES.map((j) => (
                    <option key={j.n} value={j.n}>Juz {j.n}</option>
                  ))}
                </select>
              </label>
              <Link
                href={`/hifz/juz/${jumpJuz}`}
                className="inline-flex min-h-11 items-center justify-center mt-2 inline-block rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
              >
                {t('search.openJuz')}
              </Link>
            </div>
            <div>
              <label className="block text-sm font-semibold">
                {t('search.page')}
                <input
                  type="number"
                  min={1}
                  max={604}
                  value={jumpPage}
                  onChange={(e) => setJumpPage(Number(e.target.value) || 1)}
                  className="mt-1 block w-full rounded-lg border border-[#E8EAED] bg-white px-3 py-2.5 text-sm"
                />
              </label>
              <Link
                href={`/hifz/mushaf/${Math.min(604, Math.max(1, jumpPage))}`}
                className="inline-flex min-h-11 items-center justify-center mt-2 inline-block rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
              >
                {t('search.openPage')}
              </Link>
            </div>
          </div>
        </section>

        {/* Voice search entry — clean white card with green accents */}
        <section className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#1FA36B]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
              <path d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 0 3-3V4.5a3 3 0 1 0-6 0v8.25a3 3 0 0 0 3 3Z" />
            </svg>
            {t('search.voiceSearch')}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">
            Recite any phrase and the app finds the exact ayah and surah — like Shazam, for the Quran.
          </p>
          <Link
            href="/hifz/voice-search"
            className="mt-4 inline-block rounded-full bg-[#57D798] px-5 py-2.5 text-sm font-bold text-[#102E26] hover:brightness-105"
          >
            {t('search.openVoiceSearch')}
          </Link>
        </section>
      </div>
    </div>
  );
}
