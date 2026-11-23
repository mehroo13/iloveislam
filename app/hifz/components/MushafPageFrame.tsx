// app/hifz/components/MushafPageFrame.tsx — one Madani mushaf page frame:
// the black-banner page, its lines (grouped by Quran.com's canonical
// line_number — no line break is ever invented), ornamental surah headers,
// Bismillah, ayah-end rosettes, juz markers, kashida justification and
// the weak-word markings.
//
// Tarteel-clean page (2026-11-23 re-check): the page is plain white
// edge to edge — no card frame, no gold anywhere, no topic wash, no
// footer. Clean black Uthmani text with tajweed colours only.
//
// This is the pure page renderer, shared by the single-page view
// (MushafPageView, inside its scaled viewport) and the continuous reader
// (MushafReader, which mounts one frame per page in a virtualised list).
// It owns NO zoom, NO navigation and NO page fetching — the parent
// supplies the verses and the view state. See MushafPageView.tsx for the
// layout rules (justified full lines, centred short lines, pause marks
// attached to the preceding word).
'use client';

import { Fragment, useEffect, useRef } from 'react';
import { BISMILLAH } from '../../quran/lib';
import { getSurahById, type HifzSurah } from '../surahs';
import type { QuranScript } from '../lib/script';
import {
  cleanMushafIndopak,
  cleanMushafUthmani,
  isPauseMarkOnly,
  type MushafVerse,
  type MushafWord,
} from '../lib/fetch';
import { fillMushafFrame } from '../lib/kashida';
import { useT } from '../lib/i18n';
import { normalizeArabic } from '../lib/alignment';
import { tajweedClass } from './SharedSheets';

/** Strong red for weak-word marking — the coach's wrong-word red. */
const WEAK_WORD_RED = '#DC2626';
/** Fixed design width (px) of one rendered mushaf page frame. See
 *  MushafPageView for why it is 970 (widest clean line in the Quran is
 *  ~895px; the text column is 920px). */
export const MUSHAF_PAGE_WIDTH = 970;

interface WordWithVerse extends MushafWord {
  verseKey: string;
}

/** Eight-point star (two overlapping squares) — the site's brand mark. */
function StarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <rect x="6.5" y="6.5" width="11" height="11" />
      <rect x="6.5" y="6.5" width="11" height="11" transform="rotate(45 12 12)" />
    </svg>
  );
}

function SurahHeader({ surah }: { surah: HifzSurah }) {
  return (
    <div className="my-5">
      {/* Ornate black banner in the style of a printed mushaf header: a
          black band with a white hairline frame, eight-point-star
          ornaments at the ends and a white arched cartouche holding the
          surah name. Our own ornament (CSS/SVG) — no gold anywhere on
          the page. The banner carries the Arabic name only, as on
          Tarteel's reader: the English meta line (number, meaning, ayah
          count, revelation) is gone. */}
      <div className="relative border-2 border-[#111827] bg-[#111827] px-10 py-2 text-center">
        {/* Inner hairline frame */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-1 border border-white/70" />
        {/* End ornaments */}
        <span aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white">
          <StarMark className="h-5 w-5" />
        </span>
        <span aria-hidden="true" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white">
          <StarMark className="h-5 w-5" />
        </span>
        {/* Centre cartouche */}
        <div className="relative mx-auto w-fit max-w-full rounded-b-lg rounded-t-full border-2 border-[#111827] bg-white px-8 py-1.5">
          {/* Fixed size (no sm: variant): inside the scaled page the type
              must not depend on the viewport width — the transform scales
              it. */}
          <p dir="rtl" lang="ar" translate="no" className="font-quran-madani text-[2rem] leading-snug text-[#111827]">
            سُورَةُ {surah.arabic}
          </p>
        </div>
      </div>
      {surah.id !== 1 && surah.id !== 9 && (
        <p dir="rtl" lang="ar" translate="no" className="font-quran-madani mt-4 text-center text-3xl text-[#111827]">
          {BISMILLAH}
        </p>
      )}
    </div>
  );
}

/** Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) for ayah-end rosettes. */
const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
function toArabicIndic(n: number): string {
  return String(n)
    .split('')
    .map((d) => ARABIC_INDIC_DIGITS[Number(d)] ?? d)
    .join('');
}

/** Ayah-end marker: an eight-point-star rosette (two overlapping squares
 *  inside a circle — the site's own geometric motif) in black with the
 *  ayah number in Arabic-Indic numerals, as on a printed mushaf. The
 *  number is derived from the verse key, not from the upstream word
 *  text (Quran.com ships the end marker with a Western numeral). Grey
 *  in memorise mode, where the words are hidden. */
function AyahRosette({ ayah, muted = false }: { ayah: number; muted?: boolean }) {
  const color = muted ? '#9CA3AF' : '#111827';
  return (
    <span className="relative mx-1 inline-flex h-8 w-8 items-center justify-center align-middle">
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      >
        <circle cx="20" cy="20" r="14.5" fill="#FFFFFF" />
        <rect x="9.5" y="9.5" width="21" height="21" />
        <rect x="9.5" y="9.5" width="21" height="21" transform="rotate(45 20 20)" />
      </svg>
      <span className="relative text-[1rem] font-bold leading-none" style={{ color }}>
        {toArabicIndic(ayah)}
      </span>
    </span>
  );
}

export interface MushafPageFrameProps {
  page: number;
  verses: MushafVerse[];
  script: QuranScript;
  /** Smaller type on the same 15-line Madani page — this is a text-size
   *  choice only; it never re-flows the page into 16 lines. */
  compactText: boolean;
  /** Memorisation mode: words hidden as grey rules. */
  hidden: boolean;
  /** How many words (in reading order across this page) are revealed. */
  revealed: number;
  /** Words missed 2+ times, keyed "surah:ayah:normalised-word". */
  frequentMistakes: ReadonlySet<string>;
  /** The "Highlight mistake history" setting. */
  mistakeMarkingOn: boolean;
  /** The "Show Tajweed colours" setting (display only — the heuristic
   *  in SharedSheets.tajweedClass, never detection). Off by default. */
  tajweedOn?: boolean;
  /** Word-by-word Listen highlight: the verse + word index (among the
   *  verse's `char_type_name === 'word'` words, in payload order — the
   *  same order as Quran.com `audio.segments`) currently sounding.
   *  Rendered as a soft background on that one word, via an inline
   *  style (no new CSS): the line stays a text run, so kashida
   *  justification is untouched. Ignored in memorise mode. */
  activeWord?: { verseKey: string; wordIndex: number } | null;
  /** Tap-a-line translation layer (MushafReader): when set, tapping a
   *  mushaf line reports its ayahs (key + Arabic as rendered); the
   *  reader shows their translation / transliteration in a panel, so
   *  the page layout is never disturbed. */
  onLineTap?: (info: { line: number; verses: { key: string; arabic: string }[] }) => void;
  /** Called with the number of weak words on this page (drives the
   *  legend in the single-page view; the reader does not need it). */
  onWeakCount?: (n: number) => void;
}

export default function MushafPageFrame({
  page,
  verses,
  script,
  compactText,
  hidden,
  revealed,
  frequentMistakes,
  mistakeMarkingOn,
  tajweedOn = false,
  activeWord = null,
  onLineTap,
  onWeakCount,
}: MushafPageFrameProps) {
  const t = useT();
  const fontClass = script === 'uthmani' ? 'font-quran-madani' : 'font-quran';
  // Global word index across the page, so peeking reveals words in order.
  const wordCounter = { current: 0 };

  const isFrequentMistake = (verseKey: string, text: string): boolean => {
    if (!mistakeMarkingOn || frequentMistakes.size === 0) return false;
    const norm = normalizeArabic(text);
    if (!norm) return false;
    return frequentMistakes.has(`${verseKey}:${norm}`);
  };

  // Measured kashida justification (see lib/kashida.ts). Runs after
  // mount, after fonts load, on resize, and whenever the rendered lines
  // change. It skips memorise-mode rule lines (those are blank).
  const frameRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const run = () => fillMushafFrame(frame);
    const raf = requestAnimationFrame(run);
    let observer: ResizeObserver | null = null;
    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) run();
      });
    }
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => run());
      observer.observe(frame);
    }
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
    // activeWord re-runs the fill: highlighting swaps one word between a
    // plain text node and a span, and the fill must re-measure the line.
    // The highlight span has no padding, so the fill lands identically.
  }, [page, verses, script, compactText, hidden, revealed, frequentMistakes, mistakeMarkingOn, tajweedOn, activeWord]);

  // Group words by mushaf line, in verse order. Do NOT re-sort by
  // `position`: positions restart at 1 for every verse, so sorting by
  // position alone interleaves verses on the same line — the ayah-end
  // rosette of one verse landed after the first word of the next verse
  // (live: "ذٰلِكَ١الۡڪِتٰبُ" instead of "الٓمّٓ١ ذٰلِكَ الۡڪِتٰبُ").
  // The iteration below already appends in verse order, then position.
  const lines = new Map<number, WordWithVerse[]>();
  for (const v of verses) {
    for (const w of v.words ?? []) {
      const arr = lines.get(w.line_number) ?? [];
      arr.push({ ...w, verseKey: v.verse_key });
      lines.set(w.line_number, arr);
    }
  }

  const renderedHeaders = new Set<number>();
  const blocks: React.ReactNode[] = [];
  let key = 0;
  // Weak (frequently missed) words on this page — drives the legend.
  let weakOnPage = 0;
  // Per-verse word counter (one per verse key, across all lines of the
  // page): the index of each `char_type_name === 'word'` word in payload
  // order. This is the same order as Quran.com `audio.segments`, so the
  // Listen engine's segment index maps straight onto a display word.
  // Pause-mark-only words are words in the payload too (and have their
  // own segment); when one merges into the previous word, the merged
  // entry takes the mark's index, so its segment highlights the word
  // the mark hangs off. Ayah-end rosettes are markers, not words (-1).
  const verseWordCounters = new Map<string, number>();

  for (const lineNo of [...lines.keys()].sort((a, b) => a - b)) {
    const words = lines.get(lineNo)!;
    // A new surah starts on this line when its first verse (ayah 1) has
    // words here. Emit its header before the line.
    for (const w of words) {
      const [sidStr, ayahStr] = w.verseKey.split(':');
      if (ayahStr === '1' && !renderedHeaders.has(Number(sidStr))) {
        const surah = getSurahById(Number(sidStr));
        if (surah) {
          blocks.push(<SurahHeader key={`h-${key++}`} surah={surah} />);
          renderedHeaders.add(Number(sidStr));
        }
      }
    }

    // Clean the display text for the chosen script, merging mark-only
    // words into the previous word.
    const display: { text: string; isEnd: boolean; verseKey: string; globalIdx: number; weak: boolean; verseWordIdx: number }[] = [];
    for (const w of words) {
      const raw = script === 'uthmani' ? w.text_uthmani : w.text_indopak ?? w.text_uthmani;
      const text =
        script === 'uthmani' ? cleanMushafUthmani(raw) : cleanMushafIndopak(raw);
      if (!text) continue;
      if (w.char_type_name !== 'end' && isPauseMarkOnly(text) && display.length > 0) {
        display[display.length - 1].text += text;
        // The mark is its own word (and segment): the merged entry takes
        // the mark's index so its segment highlights this word.
        const c = verseWordCounters.get(w.verseKey) ?? 0;
        verseWordCounters.set(w.verseKey, c + 1);
        display[display.length - 1].verseWordIdx = c;
        continue;
      }
      const verseWordIdx =
        w.char_type_name === 'end' ? -1 : (verseWordCounters.get(w.verseKey) ?? 0);
      if (w.char_type_name !== 'end') verseWordCounters.set(w.verseKey, verseWordIdx + 1);
      display.push({
        text,
        isEnd: w.char_type_name === 'end',
        verseKey: w.verseKey,
        globalIdx: wordCounter.current++,
        // Rosettes are markers, not words — never weak. The weak flag is
        // checked on the bare word: merged pause marks normalise away,
        // so a merged word still matches its mistake-log entry.
        weak: w.char_type_name === 'end' ? false : isFrequentMistake(w.verseKey, text),
        verseWordIdx,
      });
    }
    if (display.length === 0) continue;
    weakOnPage += display.reduce((n, w) => n + (w.weak ? 1 : 0), 0);

    // Full lines are justified like the mushaf (kashida stretching, not
    // wide word gaps); short lines are centred, as in the book.
    // WHY THE WORDS ARE ONE TEXT RUN: the previous render wrapped every
    // word in its own <span>, and the browser then justified by stretching
    // the spaces BETWEEN the spans — the wide word gaps on the live site.
    // Kashida (inter-character) stretching only works inside one text run,
    // so the reading view joins each run of words into a single text node
    // and only the ayah-end rosettes stay as elements. Hidden (memorise)
    // mode still needs per-word spans for the grey rules.
    // Short lines (Bismillah, a single ayah fragment) stay centred.
    // Count WORDS only — an ayah-end rosette is a marker, not a word:
    // counting it made line 1 of page 2 (7 words + 2 rosettes) look
    // "long" and justify it with wide gaps.
    const shortLine = display.filter((w) => !w.isEnd).length < 5;
    // Fixed sizes (no sm: variant): inside the scaled page the type must
    // not depend on the viewport width — the transform scales it. These
    // are the sizes desktop already used (the old sm: sizes), so the
    // desktop design is unchanged.
    const sizeCls = compactText ? 'text-[1.85rem] leading-[2.2]' : 'text-[2.1rem] leading-[2.35]';
    const lineClass = `${fontClass} ${sizeCls} text-[#111827] ${shortLine ? 'text-center' : 'mushaf-line'}`;
    let lineContent: React.ReactNode;
    if (hidden) {
      lineContent = display.map((w, i) => {
        if (w.isEnd) {
          const ayahNum = Number(w.verseKey.split(':')[1]);
          return <AyahRosette key={`${w.verseKey}-${i}`} ayah={ayahNum} muted />;
        }
        // Memorisation mode: unrevealed words are thin grey rules — except
        // weak words, which show as thicker RED rules, so the user sees
        // where their weak words are without the word being revealed.
        // A revealed (peeked) weak word keeps the red dotted underline.
        // A revealed word otherwise takes its tajweed colour when the
        // setting is on (display only — same heuristic as reading view).
        if (w.globalIdx >= revealed) {
          return w.weak ? (
            <span
              key={`${w.verseKey}-${i}`}
              className="hidden-word-rule"
              style={{
                width: `${Math.max(1.2, w.text.length * 0.45)}em`,
                background: WEAK_WORD_RED,
                height: '0.2em',
              }}
              title={t('rb.mpf.wordMissed2')}
            />
          ) : (
            <span
              key={`${w.verseKey}-${i}`}
              className="hidden-word-rule"
              style={{ width: `${Math.max(1.2, w.text.length * 0.45)}em` }}
            />
          );
        }
        return w.weak ? (
          <span key={`${w.verseKey}-${i}`} className="live-word-wrong">
            {w.text}{' '}
          </span>
        ) : tajweedOn && tajweedClass(w.text) ? (
          <span key={`${w.verseKey}-${i}`} className={tajweedClass(w.text)}>
            {w.text}{' '}
          </span>
        ) : (
          <span key={`${w.verseKey}-${i}`}>
            {w.text}{' '}
          </span>
        );
      });
    } else {
      // One text run per stretch of words; rosettes stay as elements.
      // Topic colours (§23): each run belongs to one ayah, so the run
      // gets that ayah's topic wash and the rosette its topic colour.
      // Weak words split the run into segments — but only at weak words,
      // and only when the run has one: an unmarked run stays a single
      // plain string exactly as before, so kashida justification is
      // untouched (the filler measures across text nodes either way).
      // A weak word gets the red dotted underline (the coach's
      // .live-word-wrong), never a topic tint and never a tajweed colour,
      // so the markings cannot be confused even where a weak word sits
      // on a wash. Tajweed colours split the same way when the setting
      // is on.
      const nodes: React.ReactNode[] = [];
      let runSegs: { text: string; weak: boolean; tj: string; active: boolean }[] = [];
      let runKey = '';
      const flush = () => {
        if (runSegs.length === 0) return;
        // No topic wash: the page is clean text with tajweed colours
        // only (2026-11-23 re-check). The topic wash used to wrap each
        // ayah run in a tinted span (Al-Fatihah's 'worship' wash
        // #E3EAFB was the light-blue wash on the live page).
        let content: React.ReactNode;
        const useSpans =
          runSegs.some((s) => s.weak) ||
          (tajweedOn && runSegs.some((s) => s.tj)) ||
          runSegs.some((s) => s.active);
        if (!useSpans) {
          content = runSegs.map((s) => s.text).join(' ');
        } else {
          const children: React.ReactNode[] = [];
          runSegs.forEach((s, si) => {
            if (si > 0) children.push(' ');
            children.push(
              s.weak ? (
                <span
                  key={`${runKey}-w${si}`}
                  className="live-word-wrong"
                  style={s.active ? { background: '#D9FBE8', borderRadius: '0.2em' } : undefined}
                >
                  {s.text}
                </span>
              ) : s.active ? (
                // Word-by-word Listen highlight: a soft green background
                // on the one sounding word. Inline style only (no new
                // CSS, no padding) so the line's width — and the kashida
                // fill — does not move when the highlight moves.
                <span key={`${runKey}-w${si}`} style={{ background: '#D9FBE8', borderRadius: '0.2em' }}>
                  {s.text}
                </span>
              ) : s.tj ? (
                <span key={`${runKey}-w${si}`} className={s.tj}>
                  {s.text}
                </span>
              ) : (
                s.text
              ),
            );
          });
          content = <Fragment key={`r-${runKey}-${nodes.length}`}>{children}</Fragment>;
        }
        nodes.push(content);
        runSegs = [];
        runKey = '';
      };
      display.forEach((w, i) => {
        if (w.isEnd) {
          flush();
          const [, ea] = w.verseKey.split(':').map(Number);
          nodes.push(<AyahRosette key={`${w.verseKey}-${i}`} ayah={ea} />);
        } else {
          if (runSegs.length === 0) runKey = w.verseKey;
          runSegs.push({
            text: w.text,
            weak: w.weak,
            tj: w.weak ? '' : tajweedOn ? tajweedClass(w.text) : '',
            active:
              activeWord !== null &&
              !hidden &&
              w.verseKey === activeWord.verseKey &&
              w.verseWordIdx === activeWord.wordIndex,
          });
        }
      });
      flush();
      lineContent = nodes;
    }
    blocks.push(
      // translate="no": the Quran text must never be machine-translated
      // by the browser. Without it, Chrome/Safari see Arabic content in
      // an English-lang document, offer translation, and (once the user
      // has accepted it) auto-translate every mushaf page — the Arabic is
      // replaced by English in place, and "Show original" does not stick
      // across page loads. lang="ar" alone does NOT prevent this; it only
      // tells the browser what language the text is. The interface
      // language setting is unaffected: it drives <html lang> and the
      // app's own dictionaries, not these nodes.
      // overflowWrap/wordBreak 'normal' overrides .font-quran's
      // `overflow-wrap: break-word` (globals.css, not touched here):
      // a word must never be split across lines to make the layout fit.
      // At the fixed design width no word is ever wider than the line,
      // so this guard costs nothing and can only prevent a split.
      // onLineTap (tap-a-line translation layer): tapping a line reports
      // its ayahs to the reader, which shows their translation /
      // transliteration in a panel. The tap adds no element to the page,
      // so the mushaf layout is untouched.
      <p
        key={`l-${lineNo}`}
        dir="rtl"
        lang="ar"
        translate="no"
        className={`${lineClass}${onLineTap ? ' cursor-pointer' : ''}`}
        style={{ overflowWrap: 'normal', wordBreak: 'normal' }}
        onClick={
          onLineTap
            ? () => {
                const byKey = new Map<string, string[]>();
                for (const w of display) {
                  if (w.isEnd) continue;
                  const arr = byKey.get(w.verseKey) ?? [];
                  arr.push(w.text);
                  byKey.set(w.verseKey, arr);
                }
                const verses = [...byKey].map(([verseKey, parts]) => ({
                  key: verseKey,
                  arabic: parts.join(' '),
                }));
                if (verses.length > 0) onLineTap({ line: lineNo, verses });
              }
            : undefined
        }
      >
        {lineContent}
      </p>,
    );
  }

  const lineCount = lines.size;
  // Short pages (few lines of text) are centred vertically in the frame
  // instead of leaving a big empty area below the text.
  const shortPage = lineCount > 0 && lineCount < 9;

  useEffect(() => {
    if (onWeakCount) onWeakCount(weakOnPage);
    // weakOnPage is recomputed every render from the same inputs; the
    // effect re-runs when any of them changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, verses, script, frequentMistakes, mistakeMarkingOn, onWeakCount]);

  // Tarteel-clean page: the white page fills the screen edge to edge —
  // no card border, no rounded frame, no footer. (Attribution lives in
  // Settings/About, not on the page.)
  return (
    <div className="bg-white">
      <div
        ref={frameRef}
        className={`flex min-h-[62vh] flex-col bg-white px-6 ${
          shortPage ? 'justify-center py-14' : 'justify-start py-6'
        }`}
      >
        {blocks.length > 0 ? (
          blocks
        ) : (
          <p className="py-10 text-center text-sm text-[#6B7280]">{t('rb.mpf.pageFailed')}</p>
        )}
      </div>
    </div>
  );
}
