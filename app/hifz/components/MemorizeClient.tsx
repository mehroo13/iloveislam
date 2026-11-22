// app/hifz/components/MemorizeClient.tsx — Memorize tab (spec §22).
// Memorisation tracker (Chapter 114 / Juz 30 / Hizb 60 tabs, surah rows
// expanding to per-page rows with segmented strength bars) + hide-and-
// reveal practice picker + Test Mode entry. All free, all on-device.
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ALL_SURAHS, getSurahById } from '../surahs';
import { SURAH_FIRST_PAGE, SURAH_LAST_PAGE } from '../mushaf';
import { JUZ_PAGES } from '../juz';
import { loadProgress, type HifzProgress } from '../progress';
import { useT } from '../lib/i18n';

type Tab = 'chapter' | 'juz' | 'hizb';

function strengthSegments(memorised: number, learning: number, total: number) {
  // Segmented bar: green memorised, yellow-green learning, grey untouched.
  const mem = total > 0 ? (memorised / total) * 100 : 0;
  const lea = total > 0 ? (learning / total) * 100 : 0;
  return { mem, lea };
}

export default function MemorizeClient() {
  const [progress, setProgress] = useState<HifzProgress | null>(null);
  const [tab, setTab] = useState<Tab>('chapter');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [practiceSurah, setPracticeSurah] = useState(2);
  const t = useT();

  useEffect(() => {
    try {
      setProgress(loadProgress());
    } catch {
      setProgress(null);
    }
  }, []);

  const counts = useMemo(() => {
    const out = new Map<string, { memorised: number; learning: number; total: number }>();
    if (!progress) return out;
    for (const [key, a] of Object.entries(progress.ayahs)) {
      const [s, ay] = key.split(':').map(Number);
      const surah = getSurahById(s);
      if (!surah) continue;
      const rec = out.get(String(s)) ?? { memorised: 0, learning: 0, total: surah.ayahCount };
      if (a.status === 'memorised') rec.memorised += 1;
      else if (a.status === 'learning') rec.learning += 1;
      out.set(String(s), rec);
      void ay;
    }
    return out;
  }, [progress]);

  const surahPages = (id: number) => {
    const first = SURAH_FIRST_PAGE[id] ?? 1;
    const last = SURAH_LAST_PAGE[id] ?? first;
    const pages: number[] = [];
    for (let p = first; p <= last; p++) pages.push(p);
    return pages;
  };

  const juzRows = JUZ_PAGES.map((j) => {
    let memorised = 0;
    let learning = 0;
    let total = 0;
    for (const seg of j.segments) {
      const surah = getSurahById(seg.surahId);
      if (!surah) continue;
      total += seg.toAyah - seg.fromAyah + 1;
      for (let ay = seg.fromAyah; ay <= seg.toAyah; ay++) {
        const st = progress?.ayahs[`${seg.surahId}:${ay}`]?.status;
        if (st === 'memorised') memorised += 1;
        else if (st === 'learning') learning += 1;
      }
    }
    return { n: j.n, memorised, learning, total };
  });

  const hizbRows = Array.from({ length: 60 }, (_, i) => {
    // A hizb is half a juz; approximate from juz halves for the tracker.
    const juzIdx = Math.floor(i / 2);
    const half = i % 2;
    const j = JUZ_PAGES[juzIdx];
    let memorised = 0;
    let learning = 0;
    let total = 0;
    if (j) {
      const segs = j.segments;
      const mid = Math.ceil(segs.length / 2);
      const use = half === 0 ? segs.slice(0, mid) : segs.slice(mid);
      for (const seg of use) {
        total += seg.toAyah - seg.fromAyah + 1;
        for (let ay = seg.fromAyah; ay <= seg.toAyah; ay++) {
          const st = progress?.ayahs[`${seg.surahId}:${ay}`]?.status;
          if (st === 'memorised') memorised += 1;
          else if (st === 'learning') learning += 1;
        }
      }
    }
    return { n: i + 1, memorised, learning, total };
  });

  const totalMemorised = [...counts.values()].reduce((a, c) => a + c.memorised, 0);

  return (
    <div className="space-y-6">
      {/* Hide & reveal practice */}
      <section aria-labelledby="practice-heading" className="rounded-2xl bg-[#102E26] p-5 text-white shadow-sm sm:p-6">
        <h2 id="practice-heading" className="text-xl font-bold">{t('mem.practiceHeading')}</h2>
        <p className="mt-1 text-sm leading-relaxed text-white/80">
          Open a mushaf page with the words hidden as thin grey rules. Recite from memory —
          words reveal as you get them right. Peek if you are stuck; a peek counts as a miss.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold">
            {t('mem.surah')}
            <select
              value={practiceSurah}
              onChange={(e) => setPracticeSurah(Number(e.target.value))}
              className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white outline-none"
            >
              {ALL_SURAHS.map((s) => (
                <option key={s.id} value={s.id} className="text-black">
                  {s.id}. {s.name}
                </option>
              ))}
            </select>
          </label>
          <Link
            href={`/hifz/mushaf/${SURAH_FIRST_PAGE[practiceSurah] ?? 1}?memorize=1`}
            className="rounded-full bg-[#57D798] px-5 py-2.5 text-sm font-bold text-[#102E26] hover:brightness-105"
          >
            {t('mem.practiseHidden')}
          </Link>
          <Link
            href="/hifz/test"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            {t('mem.testMode')}
          </Link>
        </div>
        <p className="mt-3 text-xs text-white/60">
          You have {totalMemorised} memorised {totalMemorised === 1 ? 'ayah' : 'ayahs'} so far.
          A test only ever covers what you have marked memorised — it never adds new memorisation by itself.
        </p>
      </section>

      {/* Tracker */}
      <section aria-labelledby="tracker-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="tracker-heading" className="text-xl font-bold text-[#102E26]">{t('mem.tracker')}</h2>
          <Link href="/hifz/my-progress" className="text-sm font-semibold text-[#1FA36B] underline">
            {t('mem.fullProgress')}
          </Link>
        </div>
        <div className="mt-4 flex gap-1" role="group" aria-label="Tracker view">
          {(
            [
              ['chapter', t('mem.tabChapter')],
              ['juz', t('mem.tabJuz')],
              ['hizb', t('mem.tabHizb')],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              className={`min-h-11 rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                tab === t ? 'border border-[#E5E7EB] bg-white font-bold text-[#102E26] shadow-sm' : 'text-[#5b6b62]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'chapter' && (
          <ul className="mt-4 divide-y divide-[#E5E7EB]">
            {ALL_SURAHS.map((s) => {
              const c = counts.get(String(s.id)) ?? { memorised: 0, learning: 0, total: s.ayahCount };
              const { mem, lea } = strengthSegments(c.memorised, c.learning, c.total);
              const isOpen = expanded === s.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded(isOpen ? null : s.id)}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <span className="w-8 shrink-0 text-sm font-semibold text-[#5b6b62]">{s.id}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-[#102E26]">{s.name}</span>
                      <span className="block text-xs text-[#5b6b62]">
                        {t('mem.verses').replace('{n}', String(s.ayahCount))} · {s.revelation} · {t('mem.memorisedCount').replace('{n}', String(c.memorised))}
                      </span>
                      <span className="mt-1 flex h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[#E5E7EB]" aria-hidden="true">
                        <span className="h-full bg-[#1FA36B]" style={{ width: `${mem}%` }} />
                        <span className="h-full bg-[#A3E635]" style={{ width: `${lea}%` }} />
                      </span>
                    </span>
                    <span dir="rtl" lang="ar" className="font-quran-madani shrink-0 text-2xl text-[#102E26]">
                      {s.arabic}
                    </span>
                    <span aria-hidden="true" className="shrink-0 text-[#5b6b62]">{isOpen ? '⌃' : '⌄'}</span>
                  </button>
                  {isOpen && (
                    <ul className="mb-3 ml-11 space-y-1">
                      {surahPages(s.id).map((p) => (
                        <li key={p}>
                          <Link
                            href={`/hifz/mushaf/${p}?memorize=1`}
                            className="flex items-center justify-between gap-3 rounded-lg bg-[#FFFBF2] px-3 py-2 text-sm hover:bg-[#E4FFF2]"
                          >
                            <span>
                              <span className="font-bold">{t('mem.page').replace('{p}', String(p))}</span>{' '}
                              <span className="text-[#5b6b62]">{t('mem.startsPage').replace('{name}', s.name).replace('{p}', String(p))}</span>
                            </span>
                            <span className="font-semibold text-[#1FA36B]">{t('mem.practisePage')}</span>
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link
                          href={`/hifz/${s.slug}?mode=recite`}
                          className="mt-1 block rounded-lg bg-[#102E26] px-3 py-2 text-center text-sm font-semibold text-white hover:bg-[#1FA36B]"
                        >
                          {t('mem.reciteCoach').replace('{name}', s.name)}
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {tab === 'juz' && (
          <ul className="mt-4 divide-y divide-[#E5E7EB]">
            {juzRows.map((j) => {
              const { mem, lea } = strengthSegments(j.memorised, j.learning, j.total);
              return (
                <li key={j.n} className="py-3">
                  <Link href={`/hifz/juz/${j.n}`} className="flex items-center gap-3">
                    <span className="w-14 shrink-0 font-bold text-[#102E26]">{t('mem.juz').replace('{n}', String(j.n))}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-[#5b6b62]">{t('mem.memorisedCount').replace('{n}', String(j.memorised))} · {t('mem.learningCount').replace('{n}', String(j.learning))} {t('mem.ofAyahs').replace('{n}', String(j.total))}</span>
                      <span className="mt-1 flex h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[#E5E7EB]" aria-hidden="true">
                        <span className="h-full bg-[#1FA36B]" style={{ width: `${mem}%` }} />
                        <span className="h-full bg-[#A3E635]" style={{ width: `${lea}%` }} />
                      </span>
                    </span>
                    <span aria-hidden="true" className="text-[#5b6b62]">›</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {tab === 'hizb' && (
          <ul className="mt-4 divide-y divide-[#E5E7EB]">
            {hizbRows.map((h) => {
              const { mem, lea } = strengthSegments(h.memorised, h.learning, h.total);
              return (
                <li key={h.n} className="flex items-center gap-3 py-2.5">
                  <span className="w-16 shrink-0 font-bold text-[#102E26]">{t('mem.hizb').replace('{n}', String(h.n))}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-[#5b6b62]">{t('mem.memorisedCount').replace('{n}', String(h.memorised))} · {t('mem.learningCount').replace('{n}', String(h.learning))}</span>
                    <span className="mt-1 flex h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[#E5E7EB]" aria-hidden="true">
                      <span className="h-full bg-[#1FA36B]" style={{ width: `${mem}%` }} />
                      <span className="h-full bg-[#A3E635]" style={{ width: `${lea}%` }} />
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-xs text-[#5b6b62]">
          Mark an ayah memorised from its surah page (tap “Mark memorised”) or by reciting it
          correctly three times in a row with the coach. Nothing here is shared — it lives on this device.
        </p>
      </section>
    </div>
  );
}
