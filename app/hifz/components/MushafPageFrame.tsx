// app/hifz/components/MushafPageFrame.tsx — one Madani mushaf page frame:
// the gold-bordered page, its lines (grouped by Quran.com's canonical
// line_number — no line break is ever invented), ornamental surah headers,
// Bismillah, ayah-end rosettes, juz markers, kashida justification and
// the weak-word / topic markings.
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
import { JUZ_PAGES } from '../juz';
import {
  cleanMushafIndopak,
  cleanMushafUthmani,
  isPauseMarkOnly,
  type MushafVerse,
  type MushafWord,
} from '../lib/fetch';
import { SCRIPT_LABELS } from '../lib/script';
import { getAyahTopic, TOPIC_BY_ID } from '../topics';
import { fillMushafFrame } from '../lib/kashida';
import { normalizeArabic } from '../lib/alignment';

/** Strong red for weak-word marking — the coach's wrong-word red. */
const WEAK_WORD_RED = '#DC2626';
/** Fixed design width (px) of one rendered mushaf page frame. See
 *  MushafPageView for why it is 970 (widest clean line in the Quran is
 *  ~895px; the text column is 920px). */
export const MUSHAF_PAGE_WIDTH = 970;

interface WordWithVerse extends MushafWord {
  verseKey: string;
}

/** Verse keys that open a juz, e.g. "2:142" opens Juz 2. */
const JUZ_START_KEYS = new Map<string, number>();
for (const juz of JUZ_PAGES) {
  const first = juz.segments[0];
  JUZ_START_KEYS.set(`${first.surahId}:${first.fromAyah}`, juz.n);
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
      <div className="relative rounded-2xl border-2 border-[#FFB800] bg-gradient-to-b from-[#FFF6D6] to-[#FFF1BF] px-4 pb-3 pt-4 text-center shadow-sm">
        {/* Corner diamonds */}
        <span aria-hidden="true" className="absolute left-2 top-2 h-2 w-2 rotate-45 bg-[#FFB800]" />
        <span aria-hidden="true" className="absolute right-2 top-2 h-2 w-2 rotate-45 bg-[#FFB800]" />
        <span aria-hidden="true" className="absolute bottom-2 left-2 h-2 w-2 rotate-45 bg-[#FFB800]" />
        <span aria-hidden="true" className="absolute bottom-2 right-2 h-2 w-2 rotate-45 bg-[#FFB800]" />
        {/* Star overlapping the top border, as on a printed mushaf header */}
        <span
          aria-hidden="true"
          className="absolute -top-3 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-[#FFB800] bg-[#FFF6D6] text-[#FFB800]"
        >
          <StarMark className="h-3.5 w-3.5" />
        </span>
        <div className="rounded-xl border border-[#FFB800]/60 bg-[#FFFFFF]/80 px-3 py-2">
          {/* Fixed size (no sm: variant): inside the scaled page the type
              must not depend on the viewport width — the transform scales
              it. text-4xl is the size desktop already used. */}
          <p dir="rtl" lang="ar" translate="no" className="font-quran-madani text-4xl leading-snug text-[#102E26]">
            {surah.arabic}
          </p>
        </div>
        <p className="mt-2 border-t border-[#FFB800]/40 pt-2 text-xs font-bold uppercase tracking-wider text-[#7A5C00]">
          Surah {surah.id} · {surah.name} · {surah.meaning} · {surah.ayahCount} ayahs ·{' '}
          {surah.revelation}
        </p>
      </div>
      {surah.id !== 1 && surah.id !== 9 && (
        <p dir="rtl" lang="ar" translate="no" className="font-quran-madani mt-4 text-center text-3xl text-[#102E26]">
          {BISMILLAH}
        </p>
      )}
    </div>
  );
}

function JuzMarker({ n }: { n: number }) {
  return (
    <div className="my-3 flex items-center gap-3" aria-label={`Start of Juz ${n}`}>
      <span className="h-px flex-1 bg-[#FFB800]/50" aria-hidden="true" />
      <span className="rounded-full border border-[#FFB800] bg-[#FFF6D6] px-3 py-1 text-xs font-bold text-[#7A5C00]">
        Juz {n}
      </span>
      <span className="h-px flex-1 bg-[#FFB800]/50" aria-hidden="true" />
    </div>
  );
}

export interface MushafPageFrameProps {
  page: number;
  verses: MushafVerse[];
  script: QuranScript;
  /** Smaller type on the same 15-line Madani page — this is a text-size
   *  choice only; it never re-flows the page into 16 lines. */
  compactText: boolean;
  /** Colour-code ayahs by topic (study aid). */
  topicColors: boolean;
  /** Memorisation mode: words hidden as grey rules. */
  hidden: boolean;
  /** How many words (in reading order across this page) are revealed. */
  revealed: number;
  /** Words missed 2+ times, keyed "surah:ayah:normalised-word". */
  frequentMistakes: ReadonlySet<string>;
  /** The "Highlight mistake history" setting. */
  mistakeMarkingOn: boolean;
  /** Called with the number of weak words on this page (drives the
   *  legend in the single-page view; the reader does not need it). */
  onWeakCount?: (n: number) => void;
}

export default function MushafPageFrame({
  page,
  verses,
  script,
  compactText,
  topicColors,
  hidden,
  revealed,
  frequentMistakes,
  mistakeMarkingOn,
  onWeakCount,
}: MushafPageFrameProps) {
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
  }, [page, verses, script, compactText, topicColors, hidden, revealed, frequentMistakes, mistakeMarkingOn]);

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
  const renderedJuzMarkers = new Set<number>();
  const blocks: React.ReactNode[] = [];
  let key = 0;
  // Weak (frequently missed) words on this page — drives the legend.
  let weakOnPage = 0;

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
      // A juz starts on this line when the verse key opens a juz.
      const juzN = JUZ_START_KEYS.get(w.verseKey);
      if (juzN !== undefined && !renderedJuzMarkers.has(juzN)) {
        blocks.push(<JuzMarker key={`j-${key++}`} n={juzN} />);
        renderedJuzMarkers.add(juzN);
      }
    }

    // Clean the display text for the chosen script, merging mark-only
    // words into the previous word.
    const display: { text: string; isEnd: boolean; verseKey: string; globalIdx: number; weak: boolean }[] = [];
    for (const w of words) {
      const raw = script === 'uthmani' ? w.text_uthmani : w.text_indopak ?? w.text_uthmani;
      const text =
        script === 'uthmani' ? cleanMushafUthmani(raw) : cleanMushafIndopak(raw);
      if (!text) continue;
      if (w.char_type_name !== 'end' && isPauseMarkOnly(text) && display.length > 0) {
        display[display.length - 1].text += text;
        continue;
      }
      display.push({
        text,
        isEnd: w.char_type_name === 'end',
        verseKey: w.verseKey,
        globalIdx: wordCounter.current++,
        // Rosettes are markers, not words — never weak. The weak flag is
        // checked on the bare word: merged pause marks normalise away,
        // so a merged word still matches its mistake-log entry.
        weak: w.char_type_name === 'end' ? false : isFrequentMistake(w.verseKey, text),
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
    const lineClass = `${fontClass} ${sizeCls} text-[#1C2420] ${shortLine ? 'text-center' : 'mushaf-line'}`;
    let lineContent: React.ReactNode;
    if (hidden) {
      lineContent = display.map((w, i) => {
        if (w.isEnd) {
          return (
            <span
              key={`${w.verseKey}-${i}`}
              className="hidden-ayah-rosette mx-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#E5E7EB] align-middle text-[1rem] font-bold text-[#9CA3AF]"
            >
              {w.text}
            </span>
          );
        }
        // Memorisation mode: unrevealed words are thin grey rules — except
        // weak words, which show as thicker RED rules, so the user sees
        // where their weak words are without the word being revealed.
        // A revealed (peeked) weak word keeps the red dotted underline.
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
              title="Word you have missed 2 or more times"
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
      // .live-word-wrong), never a topic tint, so the two markings
      // cannot be confused even where a weak word sits on a wash.
      const nodes: React.ReactNode[] = [];
      let runSegs: { text: string; weak: boolean }[] = [];
      let runKey = '';
      const flush = () => {
        if (runSegs.length === 0) return;
        const [rs, ra] = runKey.split(':').map(Number);
        const topic = topicColors ? TOPIC_BY_ID[getAyahTopic(rs, ra)] : null;
        let content: React.ReactNode;
        if (!runSegs.some((s) => s.weak)) {
          content = runSegs.map((s) => s.text).join(' ');
        } else {
          const children: React.ReactNode[] = [];
          runSegs.forEach((s, si) => {
            if (si > 0) children.push(' ');
            children.push(
              s.weak ? (
                <span key={`${runKey}-w${si}`} className="live-word-wrong">
                  {s.text}
                </span>
              ) : (
                s.text
              ),
            );
          });
          content = <Fragment key={`r-${runKey}-${nodes.length}`}>{children}</Fragment>;
        }
        nodes.push(
          topic ? (
            <span
              key={`r-${runKey}-${nodes.length}`}
              style={{
                background: topic.wash,
                borderRadius: '0.25em',
                padding: '0 0.15em',
                WebkitBoxDecorationBreak: 'clone',
                boxDecorationBreak: 'clone',
              }}
            >
              {content}
            </span>
          ) : (
            content
          ),
        );
        runSegs = [];
        runKey = '';
      };
      display.forEach((w, i) => {
        if (w.isEnd) {
          flush();
          const [es, ea] = w.verseKey.split(':').map(Number);
          const etopic = topicColors ? TOPIC_BY_ID[getAyahTopic(es, ea)] : null;
          const ecolor = etopic ? etopic.color : '#1FA36B';
          nodes.push(
            <span
              key={`${w.verseKey}-${i}`}
              className="mx-1 inline-flex h-7 w-7 items-center justify-center rounded-full border align-middle text-[1rem] font-bold"
              style={{ borderColor: ecolor, color: ecolor }}
            >
              {w.text}
            </span>,
          );
        } else {
          if (runSegs.length === 0) runKey = w.verseKey;
          runSegs.push({ text: w.text, weak: w.weak });
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
      <p key={`l-${lineNo}`} dir="rtl" lang="ar" translate="no" className={lineClass} style={{ overflowWrap: 'normal', wordBreak: 'normal' }}>
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

  return (
    <div className="rounded-2xl border-2 border-[#FFB800] bg-[#FFFBF2] p-2 shadow-sm sm:p-4">
      <div
        ref={frameRef}
        className={`flex min-h-[62vh] flex-col rounded-xl border border-[#FFB800]/60 bg-[#FFFBF2] px-6 ${
          shortPage ? 'justify-center py-14' : 'justify-start py-6'
        }`}
      >
        {blocks.length > 0 ? (
          blocks
        ) : (
          <p className="py-10 text-center text-sm text-[#5b6b62]">
            This mushaf page could not be loaded right now. Check your connection and reload.
          </p>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-[#5b6b62]">
        Page {page} of 604 · Madani Mushaf · {SCRIPT_LABELS[script]} · Text via Quran.com
      </p>
    </div>
  );
}
