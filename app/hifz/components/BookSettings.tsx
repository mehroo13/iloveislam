// app/hifz/components/BookSettings.tsx — Book Settings: mushaf edition
// picker + tajweed-colours toggle (Setup screen layout matching the
// reference screenshots, our own wording and branding — no copied logo,
// name or text).
//
// HONEST EDITIONS ONLY: we ship one 604-page Madani line dataset, so
// there are exactly two honest choices — the same Madani layout in
// Uthmani script ("Madani Mushaf") or in Indo-Pak lettering
// ("Indo-Pak Script"). No 1405/1421/1441 relabelling, no 610 pages.
//
// The preview on each card is real Quran text: the first lines of mushaf
// page 1 (Al-Fatihah) fetched from Quran.com, rendered in the edition's
// own script — never placeholder text. Used both as onboarding step 4
// and standalone at /hifz/setup (where Continue returns to Settings).
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BISMILLAH } from '../../quran/lib';
import { getSurahById } from '../surahs';
import {
  cleanMushafIndopak,
  cleanMushafUthmani,
  fetchMushafPage,
  isPauseMarkOnly,
  type MushafVerse,
} from '../lib/fetch';
import { getScriptPref, setScriptPref, type QuranScript } from '../lib/script';
import { loadSettings, saveSettings } from '../progress';
import { useT } from '../lib/i18n';

interface Edition {
  id: QuranScript;
  name: string;
  description: string;
}

const EDITIONS: Edition[] = [
  {
    id: 'uthmani',
    name: 'Madani Mushaf',
    description: 'rb.book.edUthmaniDesc',
  },
  {
    id: 'indopak',
    name: 'Indo-Pak Script',
    description: 'rb.book.edIndopakDesc',
  },
];

/** First lines of mushaf page 1, cleaned for the given script. Words are
 *  grouped by Quran.com's canonical line_number — no line break is ever
 *  invented, mirroring MushafPageFrame. */
function previewLines(verses: MushafVerse[], script: QuranScript): string[] {
  const byLine = new Map<number, string[]>();
  for (const v of verses) {
    for (const w of v.words ?? []) {
      const raw = script === 'uthmani' ? w.text_uthmani : w.text_indopak ?? w.text_uthmani;
      const text = script === 'uthmani' ? cleanMushafUthmani(raw) : cleanMushafIndopak(raw);
      if (!text) continue;
      const arr = byLine.get(w.line_number) ?? [];
      // Pause marks ride on the previous word, as on the printed page.
      if (w.char_type_name !== 'end' && isPauseMarkOnly(text) && arr.length > 0) {
        arr[arr.length - 1] += text;
      } else {
        arr.push(text);
      }
      byLine.set(w.line_number, arr);
    }
  }
  return [...byLine.keys()]
    .sort((a, b) => a - b)
    .slice(0, 6)
    .map((n) => byLine.get(n)!.join(' '));
}

/** Small real-page preview: ornate surah header + the first lines of
 *  page 1 in the edition's own script. While the page loads, skeleton
 *  bars; if the fetch fails, the Bismillah (real text) instead of a
 *  blank or invented preview. */
function EditionPreview({
  script,
  verses,
  failed,
}: {
  script: QuranScript;
  verses: MushafVerse[] | null;
  failed: boolean;
}) {
  const lines = useMemo(() => (verses ? previewLines(verses, script) : []), [verses, script]);
  const surah = getSurahById(1);
  const fontClass = script === 'uthmani' ? 'font-quran-madani' : 'font-quran';
  const shown = failed ? [BISMILLAH] : lines;
  return (
    <div dir="rtl" lang="ar" translate="no" className="border border-[#E8C86A] bg-[#F4F5F7] px-3 py-3">
      {/* Ornate surah header, as on the printed page */}
      <div className="rounded-lg border-2 border-[#FFB800] bg-gradient-to-b from-[#FFF6D6] to-[#FFF1BF] px-2 py-1.5 text-center">
        <p className={`${fontClass} text-lg leading-snug text-[#111827]`}>
          {surah?.arabic ?? 'الْفَاتِحَة'}
        </p>
      </div>
      {verses === null && !failed ? (
        <div className="mt-3 space-y-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-4 rounded bg-[#EFE9D8]" />
          ))}
        </div>
      ) : (
        <div className={`mt-2 ${fontClass} text-[15px] leading-[2.1] text-[#111827]`}>
          {shown.map((line, i) => {
            // Full lines justify like the printed mushaf; short lines
            // centre instead of stretching (text-align-last trap).
            const justify = line.split(' ').length >= 5;
            return (
              <p
                key={i}
                style={justify ? { textAlign: 'justify', textAlignLast: 'justify' } : { textAlign: 'center' }}
              >
                {line}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function BookSettings({
  onContinue,
  continueHref,
}: {
  /** Called when Continue is tapped (onboarding: finish onboarding). */
  onContinue?: () => void;
  /** If set, Continue navigates here instead (standalone /hifz/setup). */
  continueHref?: string;
}) {
  const [script, setScript] = useState<QuranScript>('indopak');
  const [tajweed, setTajweed] = useState(false);
  const [verses, setVerses] = useState<MushafVerse[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const t = useT();

  useEffect(() => {
    setScript(getScriptPref());
    try {
      setTajweed(loadSettings().tajweedColors ?? false);
    } catch {
      /* storage unavailable — default off */
    }
    let cancelled = false;
    void fetchMushafPage(1)
      .then((v) => {
        if (cancelled) return;
        if (v.length > 0) setVerses(v);
        else setLoadFailed(true);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const choose = (id: QuranScript) => {
    setScript(id);
    setScriptPref(id);
  };

  const toggleTajweed = (v: boolean) => {
    setTajweed(v);
    try {
      saveSettings({ ...loadSettings(), tajweedColors: v });
    } catch {
      /* storage unavailable — the choice just doesn't persist */
    }
  };

  return (
    <section aria-label={t('rb.book.ariaLabel')} className="rounded-3xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold tracking-wide text-[#111827]">{t('rb.book.title')}</h2>
      <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">{t('rb.book.choose')}</p>

      {/* Swipeable edition cards (horizontal scroll-snap, next card peeking). */}
      <div
        className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
        role="group"
        aria-label={t('rb.book.edition')}
      >
        {EDITIONS.map((ed) => {
          const selected = script === ed.id;
          return (
            <article
              key={ed.id}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={`${ed.name} — ${selected ? t('rb.book.selected') : t('rb.book.select')}`}
              onClick={() => choose(ed.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  choose(ed.id);
                }
              }}
              className="w-[82%] shrink-0 cursor-pointer snap-center focus:outline-none sm:w-[340px]"
            >
              <h3 className="pb-2 text-center text-base font-bold text-[#111827]">{ed.name}</h3>
              <div
                className={`relative rounded-xl border-2 bg-white p-2 ${
                  selected ? 'border-[#57D798]' : 'border-[#E8EAED]'
                }`}
              >
                <EditionPreview script={ed.id} verses={verses} failed={loadFailed} />
                {selected && (
                  <span
                    aria-hidden="true"
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#57D798] text-white shadow ring-2 ring-white"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">{t(ed.description)}</p>
              <p className="mt-1.5 text-sm text-[#111827]">
                <span className="font-bold">15 Lines</span> / 604 pages
              </p>
            </article>
          );
        })}
      </div>

      {/* Tajweed colours — wired to the real set.tajweedColors setting. */}
      <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-[#E8EAED] px-4 py-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF7F0]">
            {/* Three coloured dots = tajweed colour-coding */}
            <span className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
              <span className="h-2 w-2 rounded-full bg-[#1FA36B]" />
              <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
            </span>
          </span>
          <div>
            <p className="text-sm font-semibold text-[#111827]">{t('rb.book.showTajweed')}</p>
            <p className="text-xs leading-relaxed text-[#6B7280]">{t('rb.book.tajweedHint')}</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={tajweed}
          aria-label={t('rb.book.showTajweed')}
          onClick={() => toggleTajweed(!tajweed)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            tajweed ? 'bg-[#57D798]' : 'bg-[#E8EAED]'
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
              tajweed ? 'start-[22px]' : 'start-0.5'
            }`}
          />
        </button>
      </div>

      {continueHref ? (
        <Link
          href={continueHref}
          className="mt-6 block w-full rounded-full bg-[#57D798] py-4 text-center text-lg font-bold text-[#102E26] hover:brightness-105"
        >{t('common.continue')}</Link>
      ) : (
        <button
          type="button"
          onClick={() => onContinue?.()}
          className="mt-6 w-full rounded-full bg-[#57D798] py-4 text-lg font-bold text-[#102E26] hover:brightness-105"
        >{t('common.continue')}</button>
      )}
    </section>
  );
}
