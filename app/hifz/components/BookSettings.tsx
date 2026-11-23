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
// The preview on each card is a real mini mushaf page: the first lines
// of mushaf page 1 (Al-Fatihah) fetched from Quran.com, grouped by
// Quran.com's canonical line_number, with the same tajweed-colour
// heuristic (SharedSheets.tajweedClass) and rosette ayah-end markers
// as the real reader (MushafPageFrame) — never placeholder text, and
// no gold frame: the card is a plain white page, like the reference.
// Used both as onboarding step 4 and standalone at /hifz/setup (where
// Continue returns to Settings).
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { tajweedClass } from './SharedSheets';

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

/** One word of a preview line: text plus whether it is an ayah-end
 *  marker (rendered as a rosette, like the reader). */
interface PreviewWord {
  text: string;
  isEnd: boolean;
}

/** First lines of mushaf page 1, cleaned for the given script, kept as
 *  per-word runs grouped by Quran.com's canonical line_number — no line
 *  break is ever invented, mirroring MushafPageFrame. Words that share
 *  a tajweed colour stay in one text run so the line justifies with
 *  kashida stretching, not wide word gaps (same reason as the reader). */
function previewLines(verses: MushafVerse[], script: QuranScript): PreviewWord[][] {
  const byLine = new Map<number, PreviewWord[]>();
  for (const v of verses) {
    for (const w of v.words ?? []) {
      const raw = script === 'uthmani' ? w.text_uthmani : w.text_indopak ?? w.text_uthmani;
      const text = script === 'uthmani' ? cleanMushafUthmani(raw) : cleanMushafIndopak(raw);
      if (!text) continue;
      const arr = byLine.get(w.line_number) ?? [];
      // Pause marks ride on the previous word, as on the printed page.
      if (w.char_type_name !== 'end' && isPauseMarkOnly(text) && arr.length > 0) {
        arr[arr.length - 1].text += text;
      } else {
        arr.push({ text, isEnd: w.char_type_name === 'end' });
      }
      byLine.set(w.line_number, arr);
    }
  }
  return [...byLine.keys()]
    .sort((a, b) => a - b)
    .slice(0, 8)
    .map((n) => byLine.get(n)!);
}

/** One preview line: runs of words sharing a tajweed colour joined
 *  into single text nodes, ayah-end markers as rosettes. */
function PreviewLine({
  words,
  fontClass,
  tajweedOn,
}: {
  words: PreviewWord[];
  fontClass: string;
  tajweedOn: boolean;
}) {
  // Full lines justify like the printed mushaf; short lines centre
  // instead of stretching (text-align-last trap).
  const wordCount = words.filter((w) => !w.isEnd).length;
  const justify = wordCount >= 5;
  const nodes: React.ReactNode[] = [];
  let run: { text: string; cls: string }[] = [];
  const flush = () => {
    if (run.length === 0) return;
    const text = run.map((s) => s.text).join(' ');
    const cls = run[0].cls;
    nodes.push(
      cls ? (
        <span key={nodes.length} className={cls}>
          {text}
        </span>
      ) : (
        text
      ),
    );
    run = [];
  };
  words.forEach((w, i) => {
    if (w.isEnd) {
      flush();
      nodes.push(
        <span
          key={`e-${i}`}
          className="mx-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#1FA36B] align-middle text-[11px] font-bold leading-none text-[#1FA36B]"
        >
          {w.text}
        </span>,
      );
      return;
    }
    const cls = tajweedOn ? tajweedClass(w.text) : '';
    // Colour change splits the run; the space between runs is its own
    // text node, and words inside a run join with spaces.
    if (run.length > 0 && run[0].cls !== cls) {
      flush();
      nodes.push(' ');
    }
    run.push({ text: w.text, cls });
  });
  flush();
  return (
    <p
      className={`${fontClass} text-[15px] leading-[2.1] text-[#111827] ${
        justify ? 'mushaf-line' : 'text-center'
      }`}
    >
      {nodes}
    </p>
  );
}

/** Mini mushaf-page preview: a black double-ruled surah header (our
 *  own plain frame — no gold, no yellow) + the first lines of page 1
 *  in the edition's own script, with tajweed colours and rosette ayah
 *  markers exactly as the reader shows them. While the page loads,
 *  skeleton bars; if the fetch fails, the Bismillah (real text)
 *  instead of a blank or invented preview. */
function EditionPreview({
  script,
  verses,
  failed,
  tajweedOn,
}: {
  script: QuranScript;
  verses: MushafVerse[] | null;
  failed: boolean;
  tajweedOn: boolean;
}) {
  const lines = useMemo(() => (verses ? previewLines(verses, script) : []), [verses, script]);
  const surah = getSurahById(1);
  const fontClass = script === 'uthmani' ? 'font-quran-madani' : 'font-quran';
  return (
    <div dir="rtl" lang="ar" translate="no" className="bg-white px-1 py-2">
      {/* Plain black double-ruled surah header, as on a printed page */}
      <div className="relative border-2 border-[#111827] px-1.5 py-1 text-center">
        <span aria-hidden="true" className="absolute -left-1 -top-1 h-2 w-2 rotate-45 border border-[#111827] bg-white" />
        <span aria-hidden="true" className="absolute -right-1 -top-1 h-2 w-2 rotate-45 border border-[#111827] bg-white" />
        <span aria-hidden="true" className="absolute -bottom-1 -left-1 h-2 w-2 rotate-45 border border-[#111827] bg-white" />
        <span aria-hidden="true" className="absolute -bottom-1 -right-1 h-2 w-2 rotate-45 border border-[#111827] bg-white" />
        <div className="border border-[#111827]/50 px-2 py-1">
          <p className={`${fontClass} text-lg leading-snug text-[#111827]`}>
            {surah?.arabic ?? 'الْفَاتِحَة'}
          </p>
        </div>
      </div>
      {verses === null && !failed ? (
        <div className="mt-3 space-y-2" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 rounded bg-[#EFEFEF]" />
          ))}
        </div>
      ) : failed ? (
        <p className={`${fontClass} mt-2 text-center text-[15px] leading-[2.1] text-[#111827]`}>
          {BISMILLAH}
        </p>
      ) : (
        <div className="mt-1">
          {lines.map((line, i) => (
            <PreviewLine key={i} words={line} fontClass={fontClass} tajweedOn={tajweedOn} />
          ))}
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
  const [script, setScript] = useState<QuranScript>('uthmani');
  const [tajweed, setTajweed] = useState(true);
  const [verses, setVerses] = useState<MushafVerse[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const t = useT();
  // Horizontal edition carousel — scrolled so the selected card is
  // fully visible (see the scroll effect below).
  const carouselRef = useRef<HTMLDivElement | null>(null);
  // True once the stored script preference has loaded: the scroll
  // must wait for it, or it would scroll to the initial 'uthmani'
  // state before the real preference is known.
  const [prefLoaded, setPrefLoaded] = useState(false);

  useEffect(() => {
    setScript(getScriptPref());
    setPrefLoaded(true);
    try {
      setTajweed(loadSettings().tajweedColors ?? false);
    } catch {
      /* storage unavailable — default on */
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

  // Keep the selected edition fully visible: the stored script default
  // (Indo-Pak) is the SECOND card, so on first paint the green border /
  // check would sit on a half-off-screen card while Madani shows first.
  // Scroll the selected card into view once the stored preference has
  // loaded, and again whenever the selection changes. The default and
  // the card order are unchanged — only the scroll position moves.
  useEffect(() => {
    if (!prefLoaded) return;
    carouselRef.current
      ?.querySelector(`[data-edition="${script}"]`)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [script, prefLoaded]);

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
        ref={carouselRef}
        className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
        role="group"
        aria-label={t('rb.book.edition')}
      >
        {EDITIONS.map((ed) => {
          const selected = script === ed.id;
          return (
            <article
              key={ed.id}
              data-edition={ed.id}
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
                <EditionPreview script={ed.id} verses={verses} failed={loadFailed} tajweedOn={tajweed} />
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
                <span className="font-bold">{t('rb.book.lines15')}</span> {t('rb.book.ofPages').replace('{n}', '604')}
              </p>
            </article>
          );
        })}
      </div>

      {/* Tajweed colours — wired to the real set.tajweedColors setting.
          Label + toggle only, like the reference: no subtitle. */}
      <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-[#E8EAED] px-4 py-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="font-quran shrink-0 text-2xl leading-none text-[#1FA36B]">
            ج
          </span>
          <p className="text-sm font-semibold text-[#111827]">{t('rb.book.showTajweed')}</p>
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
          className="mt-6 block w-full rounded-full bg-[#57D798] py-4 text-center text-lg font-bold text-white hover:brightness-105"
        >{t('common.continue')}</Link>
      ) : (
        <button
          type="button"
          onClick={() => onContinue?.()}
          className="mt-6 w-full rounded-full bg-[#57D798] py-4 text-lg font-bold text-white hover:brightness-105"
        >{t('common.continue')}</button>
      )}
    </section>
  );
}
