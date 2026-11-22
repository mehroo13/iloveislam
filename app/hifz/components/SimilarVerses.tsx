// app/hifz/components/SimilarVerses.tsx — genuinely similar ayahs (Stage 5, §12).
//
// DATA: /mutashabihat.json, derived from the canonical Quran text itself
// by tools/build-mutashabihat.mjs (Quran.com API v4 text_uthmani, all
// 6,236 ayahs). Two ayahs are listed only when they share verbatim
// phrases — a shared 4-word phrase, or 2+ shared 3-word phrases,
// weighted by phrase rarity. No hand-written pairs; meaning-similarity
// is NOT claimed, and the empty state says so plainly.
//
// The JSON is 1.3 MB and is fetched ONLY when the user opens the section
// (never on page load). Partner ayah texts are fetched on demand from the
// same /api/quran proxy the reader uses, so the Arabic shown is the
// site's own verified text, never text copied from the dataset.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { API, verseText, cleanIndopak, type Verse } from '../../quran/lib';
import { normalizeArabic } from '../lib/alignment';
import { getSurahById } from '../surahs';
import { useT } from '../lib/i18n';

interface Partner {
  key: string;
  score: number;
  phrases: string[][];
}

interface MutashabihatData {
  byAyah: Record<string, Partner[]>;
}

let dataPromise: Promise<MutashabihatData | null> | null = null;
function loadData(): Promise<MutashabihatData | null> {
  if (!dataPromise) {
    dataPromise = fetch('/mutashabihat.json')
      .then((r) => (r.ok ? (r.json() as Promise<MutashabihatData>) : null))
      .catch(() => null);
  }
  return dataPromise;
}

/** Words of `text` whose normalised form is in `shared`. */
function renderWords(
  text: string,
  shared: Set<string>,
  keyPrefix: string,
) {
  const words = text.split(/\s+/).filter(Boolean);
  return words.map((w, i) => {
    const isShared = shared.has(normalizeArabic(w));
    return (
      <span
        key={`${keyPrefix}-${i}`}
        className={isShared ? 'rounded bg-[#FFB800]/50 px-0.5 font-bold' : undefined}
      >
        {w}{' '}
      </span>
    );
  });
}

export default function SimilarVerses({
  surah,
  ayah,
  ayahText,
}: {
  surah: number;
  ayah: number;
  /** Display text of this ayah (Indo-Pak or Uthmani — both normalise the same). */
  ayahText: string;
}) {
  const t = useT();
  const key = `${surah}:${ayah}`;
  const [open, setOpen] = useState(false);
  const [partners, setPartners] = useState<Partner[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<Partner | null>(null);
  const [partnerVerse, setPartnerVerse] = useState<Verse | null>(null);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerError, setPartnerError] = useState(false);
  const [quizHidden, setQuizHidden] = useState(false);
  const openedRef = useRef(false);

  const load = useCallback(async () => {
    const data = await loadData();
    if (!data) {
      setLoadError(true);
      return;
    }
    setPartners(data.byAyah[key] ?? []);
  }, [key]);

  useEffect(() => {
    if (open && !openedRef.current) {
      openedRef.current = true;
      void load();
    }
  }, [open, load]);

  // Deep link: #similar-verses opens the section (coach links here).
  useEffect(() => {
    try {
      if (window.location.hash === '#similar-verses') {
        setOpen(true);
        document.getElementById('similar-verses')?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const selectPartner = useCallback(async (p: Partner) => {
    setSelected(p);
    setQuizHidden(false);
    setPartnerVerse(null);
    setPartnerError(false);
    setPartnerLoading(true);
    try {
      const res = await fetch(`${API}/verses/by_key/${p.key}?fields=text_indopak,text_uthmani`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.verse) setPartnerVerse(data.verse as Verse);
      else setPartnerError(true);
    } catch {
      setPartnerError(true);
    } finally {
      setPartnerLoading(false);
    }
  }, []);

  const sharedWords = new Set<string>();
  if (selected) {
    for (const phrase of selected.phrases) {
      for (const w of phrase) sharedWords.add(w);
    }
  }
  const partnerSurah = selected ? getSurahById(Number(selected.key.split(':')[0])) : null;

  return (
    <section
      id="similar-verses"
      aria-labelledby="similar-heading"
      className="mt-6 scroll-mt-24 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="similar-heading" className="text-lg font-bold text-[#102E26]">
          {t('sim.title')}
        </h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="min-h-11 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold hover:border-[#1FA36B]"
        >
          {open ? t('sim.hide') : t('sim.show')}
        </button>
      </div>
      <p className="mt-1 text-sm text-[#5b6b62]">
        {t('sim.intro')}
      </p>

      {open && (
        <div className="mt-4">
          {loadError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700">
              {t('sim.loadError')}
            </p>
          )}
          {partners === null && !loadError && (
            <p className="text-sm text-[#5b6b62]">{t('sim.loading')}</p>
          )}
          {partners !== null && partners.length === 0 && (
            <p className="text-sm text-[#5b6b62]">
              {t('sim.none')}
            </p>
          )}
          {partners !== null && partners.length > 0 && (
            <>
              <ul className="space-y-2">
                {partners.map((p) => {
                  const [s, a] = p.key.split(':').map(Number);
                  const sInfo = getSurahById(s);
                  return (
                    <li key={p.key}>
                      <button
                        type="button"
                        onClick={() => void selectPartner(p)}
                        aria-expanded={selected?.key === p.key}
                        className={`flex w-full flex-wrap items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm hover:border-[#1FA36B] ${
                          selected?.key === p.key ? 'border-[#FFB800] bg-[#FFFBF2]' : 'border-[#E5E7EB] bg-[#FFFBF2]'
                        }`}
                      >
                        <span className="font-bold text-[#102E26]">
                          {sInfo ? sInfo.name : t('sim.surahFallback').replace('{n}', String(s))} {p.key}
                        </span>
                        <span className="text-xs text-[#5b6b62]">
                          {p.phrases.length === 1
                            ? t('sim.sharesOne')
                            : t('sim.sharesMany').replace('{n}', String(p.phrases.length))}
                        </span>
                        <span className="ml-auto text-xs font-semibold text-[#1FA36B]">
                          {selected?.key === p.key ? t('sim.comparing') : t('sim.compare')}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-[#5b6b62]">
                {t('sim.rankNote')}
              </p>
            </>
          )}

          {selected && (
            <div className="mt-4 rounded-xl border border-[#FFB800]/60 bg-[#FFFBF2] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-[#102E26]">
                  {t('sim.comparingTitle').replace('{a}', key).replace('{b}', selected.key)}
                  {partnerSurah ? ` — ${partnerSurah.name}` : ''}
                </p>
                {partnerSurah && (
                  <Link
                    href={`/hifz/${partnerSurah.slug}/${selected.key.replace(':', '-')}`}
                    className="rounded-full bg-[#102E26] min-h-11 px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
                  >
                    {t('sim.openLink').replace('{key}', selected.key)}
                  </Link>
                )}
              </div>
              <p className="mt-1 text-xs text-[#5b6b62]">
                {t('sim.highlightNote')}
              </p>
              {partnerLoading && <p className="mt-3 text-sm text-[#5b6b62]">{t('sim.loadingOther')}</p>}
              {partnerError && (
                <p role="alert" className="mt-3 text-sm text-red-700">
                  {t('sim.otherError')}
                </p>
              )}
              {partnerVerse && (
                <div className="mt-3 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-[#5b6b62]">{t('sim.thisAyah').replace('{key}', key)}</p>
                    <p dir="rtl" lang="ar" className="font-quran mt-1 text-right text-2xl leading-loose sm:text-3xl">
                      {renderWords(cleanIndopak(ayahText), sharedWords, 'this')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#5b6b62]">{t('sim.similarAyah').replace('{key}', selected.key)}</p>
                    {quizHidden ? (
                      <div className="mt-2 rounded-xl border border-[#E5E7EB] bg-white p-4 text-center">
                        <p className="text-sm text-[#5b6b62]">
                          {t('sim.hiddenQuiz')}
                        </p>
                        <button
                          type="button"
                          onClick={() => setQuizHidden(false)}
                          className="mt-3 min-h-11 rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
                        >
                          {t('sim.reveal')}
                        </button>
                      </div>
                    ) : (
                      <p dir="rtl" lang="ar" className="font-quran mt-1 text-right text-2xl leading-loose sm:text-3xl">
                        {renderWords(verseText(partnerVerse, 'indopak'), sharedWords, 'other')}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuizHidden((v) => !v)}
                    className="min-h-11 rounded-full border border-[#102E26] px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
                  >
                    {quizHidden ? t('sim.showAgain') : t('sim.practiseHide')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
