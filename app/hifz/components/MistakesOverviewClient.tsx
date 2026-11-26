// app/hifz/components/MistakesOverviewClient.tsx — dedicated mistakes
// overview screen (/hifz/mistakes).
//
// Everything here comes from the REAL mistake store (loadMistakes() in
// app/hifz/progress.ts) — the same log the coach and reader write. No
// fake data, no invented "you said X": `heard` is shown only when the
// engine returned it. Mark-corrected reuses the same rule as My
// Progress: history is kept, flagged corrected, and stops counting as
// a weak spot. Word-accuracy only — no tajweed-mistake claims anywhere.
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  loadMistakes,
  saveMistakes,
  markWordMistakesCorrected,
  mistakesByWord,
  mistakesBySurah,
  mistakesPerDay,
  type MistakeEntry,
} from '../progress';
import { getSurahById } from '../surahs';
import { useT } from '../lib/i18n';

type Filter = 'all' | 'uncorrected';

function timesLabel(t: (key: string) => string, n: number): string {
  return n === 1 ? t('common.time') : t('common.times');
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return (
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  );
}

export default function MistakesOverviewClient() {
  const t = useT();
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    setMistakes(loadMistakes());
    setLoaded(true);
  }, []);

  const uncorrectedOnly = filter === 'uncorrected';

  const totals = useMemo(() => {
    let total = 0;
    let uncorrected = 0;
    const words = new Set<string>();
    for (const m of mistakes) {
      total += m.attempts;
      if (!m.corrected) uncorrected += m.attempts;
      words.add(`${m.surah}:${m.ayah}:${m.word}`);
    }
    return { total, uncorrected, corrected: total - uncorrected, words: words.size };
  }, [mistakes]);

  const rankedWords = useMemo(
    () => mistakesByWord(mistakes, { uncorrectedOnly, limit: 10 }),
    [mistakes, uncorrectedOnly],
  );
  const bySurah = useMemo(
    () => mistakesBySurah(mistakes, { uncorrectedOnly }),
    [mistakes, uncorrectedOnly],
  );
  const trend = useMemo(
    () => mistakesPerDay(mistakes, 30, { uncorrectedOnly }),
    [mistakes, uncorrectedOnly],
  );
  const trendTotal = useMemo(() => trend.reduce((s, p) => s + p.count, 0), [trend]);
  const trendMax = useMemo(() => Math.max(1, ...trend.map((p) => p.count)), [trend]);
  const busiest = useMemo(() => {
    let best: { date: string; label: string; count: number } | null = null;
    for (const p of trend) {
      if (!best || p.count > best.count) best = p;
    }
    return best && best.count > 0 ? best : null;
  }, [trend]);

  const recent = useMemo(() => {
    const list = mistakes
      .map((m, idx) => ({ m, idx }))
      .filter(({ m }) => (uncorrectedOnly ? !m.corrected : true))
      .sort((a, b) => b.m.date.localeCompare(a.m.date));
    return list.slice(0, 20);
  }, [mistakes, uncorrectedOnly]);

  const persist = (next: MistakeEntry[]) => {
    saveMistakes(next);
    setMistakes(next);
  };

  const markWord = (surah: number, ayah: number, word: string) => {
    persist(markWordMistakesCorrected(mistakes, surah, ayah, word));
  };

  const markOne = (idx: number) => {
    const next = mistakes.map((m, i) =>
      i === idx ? { ...m, corrected: true, correctedAt: new Date().toISOString() } : m,
    );
    persist(next);
  };

  if (!loaded) {
    return <p className="py-8 text-sm text-[#6B7280]">{t('prog.loading')}</p>;
  }

  const wash = (n: number) =>
    n >= 6 ? 'wash-most' : n >= 3 ? 'wash-often' : n >= 2 ? 'wash-some' : 'wash-few';

  return (
    <div className="space-y-6">
      <div>
        <Link href="/hifz/my-progress" className="text-sm font-semibold text-[#1FA36B] underline">
          ← {t('mistakes.backToProgress')}
        </Link>
        <h1 className="mt-2 text-[22px] font-bold text-[#111827]">{t('mistakes.title')}</h1>
        <p className="mt-1 text-sm text-[#6B7280]">{t('mistakes.subtitle')}</p>
      </div>

      {mistakes.length === 0 ? (
        <section className="rounded-2xl border border-[#E8EAED] bg-white p-5 text-center shadow-sm sm:p-6">
          <p className="text-base font-bold text-[#111827]">{t('mistakes.empty')}</p>
          <p className="mt-2 text-sm text-[#6B7280]">
            {t('rb.dash.mistakeLogNote')}
          </p>
          <Link
            href="/hifz/recite"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[#102E26] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
          >
            {t('mistakes.emptyRecite')}
          </Link>
        </section>
      ) : (
        <>
          {/* Summary — all from the stored log. */}
          <section aria-label={t('mistakes.title')} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: t('mistakes.total'), value: totals.total },
              { label: t('mistakes.toFix'), value: totals.uncorrected },
              { label: t('mistakes.wordsMissed'), value: totals.words },
              { label: t('mistakes.correctedCount'), value: totals.corrected },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-[#E8EAED] bg-white p-4 shadow-sm">
                <p className="text-2xl font-bold text-[#111827]">{s.value}</p>
                <p className="mt-0.5 text-xs font-semibold text-[#6B7280]">{s.label}</p>
              </div>
            ))}
          </section>

          {/* Filter: all / uncorrected only. */}
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('rb.dash.filterMistakes')}>
            {(['all', 'uncorrected'] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`min-h-11 rounded-full px-4 py-1.5 text-sm font-semibold ${
                  filter === f ? 'bg-[#102E26] text-white' : 'border border-[#E8EAED] bg-white hover:border-[#1FA36B]'
                }`}
              >
                {f === 'all' ? t('mistakes.filterAll') : t('mistakes.filterUncorrected')}
              </button>
            ))}
          </div>

          {/* Most-missed words — ranked, with bars (same style as the
              weak-spots chart on My Progress). */}
          <section aria-labelledby="most-missed-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
            <h2 id="most-missed-heading" className="text-xl font-bold text-[#111827]">{t('mistakes.mostMissed')}</h2>
            <p className="mt-1 text-sm text-[#6B7280]">{t('mistakes.mostMissedHint')}</p>
            {rankedWords.length === 0 ? (
              <p className="mt-3 text-sm text-[#6B7280]">{t('mistakes.allCorrected')}</p>
            ) : (
              <div className="mt-4 space-y-2" role="list" aria-label={t('mistakes.mostMissed')}>
                {rankedWords.map((w) => {
                  const surah = getSurahById(w.surah);
                  const maxAttempts = rankedWords[0].attempts;
                  return (
                    <div
                      key={`${w.surah}:${w.ayah}:${w.word}`}
                      role="listitem"
                      className="rounded-xl bg-[#F4F5F7] px-3 py-2"
                    >
                      <span className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                        <span>
                          <span dir="rtl" lang="ar" className={`font-quran text-lg ${wash(w.attempts)}`}>{w.word}</span>
                          {' '}
                          <span className="text-[#6B7280]">
                            {surah ? surah.name : `Surah ${w.surah}`} {w.surah}:{w.ayah}
                          </span>
                        </span>
                        <span className="font-bold text-[#111827]">
                          {t('prog.missed').replace('{n}', String(w.attempts)).replace('{timeWord}', timesLabel(t, w.attempts))}
                        </span>
                      </span>
                      <span className="mt-1.5 block h-3 overflow-hidden rounded-full bg-[#E8EAED]" aria-hidden="true">
                        <span
                          className="block h-full rounded-full bg-[#1FA36B]"
                          style={{ width: `${Math.max(4, (w.attempts / maxAttempts) * 100)}%` }}
                        />
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-2">
                        {w.corrected ? (
                          <span className="rounded-full bg-[#E4FFF2] px-2 py-0.5 text-xs font-bold text-[#1FA36B]">
                            ✓ {t('mistakes.correctedLabel')}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => markWord(w.surah, w.ayah, w.word)}
                            className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#1FA36B] px-3 py-1 text-xs font-semibold text-[#1FA36B] hover:bg-[#E4FFF2]"
                          >
                            {t('mistakes.markCorrected')}
                          </button>
                        )}
                        {surah && (
                          <Link
                            href={`/hifz/${surah.slug}?mode=recite&ayah=${w.ayah}`}
                            className="text-xs font-semibold text-[#1FA36B] underline"
                          >
                            {t('prog.practiseWord')}
                          </Link>
                        )}
                        {w.heard && (
                          <span className="text-xs text-[#6B7280]">
                            {t('rb.dash.heardAs').replace('{heard}', w.heard)}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Mistakes by surah — ranked. */}
          <section aria-labelledby="by-surah-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
            <h2 id="by-surah-heading" className="text-xl font-bold text-[#111827]">{t('mistakes.bySurah')}</h2>
            <p className="mt-1 text-sm text-[#6B7280]">{t('mistakes.bySurahHint')}</p>
            {bySurah.length === 0 ? (
              <p className="mt-3 text-sm text-[#6B7280]">{t('mistakes.noWords')}</p>
            ) : (
              <div className="mt-4 space-y-2" role="list" aria-label={t('mistakes.bySurah')}>
                {bySurah.map((s) => {
                  const surah = getSurahById(s.surah);
                  const maxAttempts = bySurah[0].attempts;
                  return (
                    <div key={s.surah} role="listitem" className="rounded-xl bg-[#F4F5F7] px-3 py-2">
                      <span className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                        <span>
                          {surah ? (
                            <Link href={`/hifz/${surah.slug}`} className="font-semibold text-[#111827] underline">
                              {surah.name}
                            </Link>
                          ) : (
                            <span className="font-semibold text-[#111827]">Surah {s.surah}</span>
                          )}
                          {' '}
                          <span className="text-[#6B7280]">
                            {t('mistakes.surahDetail').replace('{w}', String(s.words)).replace('{a}', String(s.ayahs))}
                          </span>
                        </span>
                        <span className="font-bold text-[#111827]">
                          {t('prog.missed').replace('{n}', String(s.attempts)).replace('{timeWord}', timesLabel(t, s.attempts))}
                        </span>
                      </span>
                      <span className="mt-1.5 block h-3 overflow-hidden rounded-full bg-[#E8EAED]" aria-hidden="true">
                        <span
                          className="block h-full rounded-full bg-[#1FA36B]"
                          style={{ width: `${Math.max(4, (s.attempts / maxAttempts) * 100)}%` }}
                        />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Trends — mistakes per day, last 30 days. */}
          <section aria-labelledby="trend-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
            <h2 id="trend-heading" className="text-xl font-bold text-[#111827]">{t('mistakes.trend')}</h2>
            <p className="mt-1 text-sm text-[#6B7280]">{t('mistakes.trendHint')}</p>
            {trendTotal === 0 ? (
              <p className="mt-3 text-sm text-[#6B7280]">{t('mistakes.noTrend')}</p>
            ) : (
              <>
                <div
                  className="mt-4 flex h-36 items-end gap-[2px]"
                  role="img"
                  aria-label={`${t('mistakes.inLast30').replace('{n}', String(trendTotal))}`}
                >
                  {trend.map((p) => (
                    <div
                      key={p.date}
                      title={`${p.label}: ${p.count} ${timesLabel(t, p.count)}`}
                      aria-label={`${p.label}: ${p.count}`}
                      className={`min-w-0 flex-1 rounded-t ${p.count > 0 ? 'bg-[#1FA36B]' : 'bg-[#E8EAED]'}`}
                      style={{ height: `${p.count > 0 ? Math.max(4, (p.count / trendMax) * 100) : 4}%` }}
                    />
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-xs text-[#6B7280]">
                  <span>{trend[0].label}</span>
                  <span>{trend[Math.floor(trend.length / 2)].label}</span>
                  <span>{trend[trend.length - 1].label}</span>
                </div>
                <p className="mt-3 text-sm text-[#111827]">
                  {t('mistakes.inLast30').replace('{n}', String(trendTotal))}
                  {busiest
                    ? ` · ${t('mistakes.busiestDay')
                        .replace('{date}', busiest.label)
                        .replace('{n}', String(busiest.count))
                        .replace('{times}', timesLabel(t, busiest.count))}`
                    : ''}
                </p>
              </>
            )}
          </section>

          {/* Recent mistakes — newest first, mark corrected per entry. */}
          <section aria-labelledby="recent-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
            <h2 id="recent-heading" className="text-xl font-bold text-[#111827]">{t('mistakes.recent')}</h2>
            {recent.length === 0 ? (
              <p className="mt-3 text-sm text-[#6B7280]">{t('mistakes.noWords')}</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {recent.map(({ m, idx }) => {
                  const surah = getSurahById(m.surah);
                  return (
                    <li key={`${m.surah}:${m.ayah}:${m.word}:${m.date}:${idx}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#F4F5F7] px-3 py-2 text-sm">
                      <span dir="rtl" lang="ar" className="font-quran text-lg">{m.word}</span>
                      <span>
                        {surah ? surah.name : `Surah ${m.surah}`} {m.surah}:{m.ayah} · {m.attempts}{' '}
                        {timesLabel(t, m.attempts)}
                        {m.heard ? ` · ${t('rb.dash.heardAs').replace('{heard}', m.heard)}` : ''}
                        {dateLabel(m.date) ? ` · ${dateLabel(m.date)}` : ''}
                      </span>
                      {m.corrected ? (
                        <span className="ml-auto rounded-full bg-[#E4FFF2] px-2 py-0.5 text-xs font-bold text-[#1FA36B]">
                          ✓ {t('mistakes.correctedLabel')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => markOne(idx)}
                          className="ml-auto inline-flex min-h-9 items-center justify-center rounded-full border border-[#1FA36B] px-3 py-1 text-xs font-semibold text-[#1FA36B] hover:bg-[#E4FFF2]"
                        >
                          {t('mistakes.markCorrected')}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
