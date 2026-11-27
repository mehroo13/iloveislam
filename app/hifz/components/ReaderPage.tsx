// app/hifz/components/ReaderPage.tsx — the reader screen's mushaf
// page. A lean renderer (no Listen/highlight/peek/translation):
// groups the page's words by Madani line, colours them from the
// AlQuran Cloud tajweed edition (per-letter, via lib/tajweed), and
// renders ayah-end medallions. Lines are justified with the measured
// kashida filler (lib/kashida) like the printed mushaf.
//
// The frame renders at a per-page design width (prop): the parent
// measures the page's longest line (onMeasure) and sizes the frame
// to it, so a short page (Al-Fatihah) renders large like the
// reference instead of small like a scaled 970px page.

'use client';

import { useEffect, useRef, useState } from 'react';
import { getSurahById } from '../surahs';
import { BISMILLAH } from '../../quran/lib';
import {
  cleanMushafIndopak,
  cleanMushafUthmani,
  isPauseMarkOnly,
  type MushafVerse,
} from '../lib/fetch';
import type { QuranScript } from '../../quran/lib';
import { fillMushafFrame } from '../lib/kashida';
import {
  alignWords,
  colorizeWord,
  TAJWEED_BLACK,
  type TajweedSurah,
} from '../lib/tajweed';
import {
  displayEntriesForLine,
  type ReaderDisplayEntry,
} from '../lib/reader-words';
import {
  mistakeForKeys,
  type PeekInfo,
  type ReaderMistake,
} from '../lib/reader-mistakes';
import { normalizeArabic } from '../lib/alignment';
import { loadSimilarWordSet } from '../lib/similar-phrases';
import ReaderSurahHeader from './ReaderSurahHeader';
import { consumeWordLongPress, useTapGuard, useWordLongPress } from './ReaderAltViews';

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
function toArabicIndic(n: number): string {
  return String(n)
    .split('')
    .map((d) => ARABIC_INDIC_DIGITS[Number(d)] ?? d)
    .join('');
}

/** Ayah-end medallion: a double-ringed circle with small floral
 *  flourishes and the ayah number in Arabic-Indic numerals, as on
 *  the reference screenshot. Our own SVG. */
export function ReaderRosette({ ayah }: { ayah: number }) {
  return (
    <span className="relative mx-1 inline-flex h-8 w-8 items-center justify-center align-middle">
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        fill="none"
        style={{ stroke: 'var(--reader-ink)' }}
      >
        <circle cx="20" cy="20" r="13" style={{ fill: 'var(--reader-card)' }} strokeWidth="1.25" />
        <circle cx="20" cy="20" r="10.5" strokeWidth="0.75" />
        {/* Small petals at the diagonals */}
        <g style={{ fill: 'var(--reader-ink)' }} stroke="none">
          <path d="M 20 3.5 L 21.6 7 L 20 8.5 L 18.4 7 Z" />
          <path d="M 20 36.5 L 21.6 33 L 20 31.5 L 18.4 33 Z" />
          <path d="M 3.5 20 L 7 18.4 L 8.5 20 L 7 21.6 Z" />
          <path d="M 36.5 20 L 33 18.4 L 31.5 20 L 33 21.6 Z" />
        </g>
        {/* Double loop at the top */}
        <circle cx="16.5" cy="5.5" r="2" style={{ fill: 'var(--reader-card)' }} strokeWidth="1" />
        <circle cx="23.5" cy="5.5" r="2" style={{ fill: 'var(--reader-card)' }} strokeWidth="1" />
      </svg>
      <span className="relative text-[1rem] font-bold leading-none text-[#111827]">
        {toArabicIndic(ayah)}
      </span>
    </span>
  );
}

interface ReaderPageProps {
  page: number;
  verses: MushafVerse[];
  /** Tajweed data keyed by surah id. Missing surahs render black. */
  tajweed: Record<number, TajweedSurah>;
  /** Design width of the frame (px). The parent sizes it to the
   *  page's longest line (see onMeasure). */
  designWidth: number;
  /** Called with the page's longest line's natural width (px, at the
   *  2.1rem line font), so the parent can size the frame. */
  onMeasure: (maxNatural: number) => void;
  /** Current zoom of the wrapper around this page (scale * shrink);
   *  the measurer divides it back out of its readings. */
  zoom: number;
  /** Hide Verses mode (Phase 1): when on, each ayah line is blurred
   *  until tapped (tap-to-peek). */
  hideVerses?: boolean;
  /** Line numbers (Madani line_no on this page) already revealed. */
  revealedLines?: ReadonlySet<number>;
  /** Tap handler for a hidden line (tap-to-peek). The second arg is
   *  the peek info (first verse on the line + its first words) so
   *  the reader can log the peek in a test take (Phase 6). */
  onRevealLine?: (lineNo: number, info?: PeekInfo) => void;
  /** Words the reciter has said correctly this take (Phase 3):
   *  engine keys `surah:ayah:word` (1-based). Those words light up
   *  green; the set is owned by the parent (cleared on page change /
   *  new take). */
  highlightedWords?: ReadonlySet<string>;
  /** Words the checker flagged this take (Phase 5): engine key →
   *  mistake. Those words light up red and are tappable — the tap
   *  opens the tooltip (see onMistakeWordClick). Owned by the
   *  parent, same lifetime as highlightedWords. */
  mistakes?: ReadonlyMap<string, ReaderMistake>;
  /** A red word was tapped (a real tap, not a swipe — the tap guard
   *  filters drags). `rect` is the word's viewport rect, for the
   *  tooltip position. Not fired while the line is hidden. */
  onMistakeWordClick?: (mistake: ReaderMistake, rect: DOMRect) => void;
  /** Script the page renders in (Mushaf Type picker, fourth
   *  refinement): 'uthmani' is a Madani layout, 'indopak' the
   *  Indo-Pak lettering on the 610-page Indo-Pak line breaks.
   *  Default 'uthmani' — the reader's behaviour before the picker
   *  existed. */
  script?: QuranScript;
  /** Show Tajweed Colors (the `tajweedColors` setting): when off,
   *  every word renders black. Default true — colours were always
   *  on in this reader before the toggle was wired here. */
  tajweedOn?: boolean;
  /** Hide ayah-end markers (Settings → Hidden Verses → "Hide verse
   *  markers"): when on, no rosette is rendered. Default false. */
  hideMarkers?: boolean;
  /** Words missed 2+ times, keyed "surah:ayah:normalised-word"
   *  (Settings → Marking → "Highlight mistake history"). */
  frequentMistakes?: ReadonlySet<string>;
  /** The "Highlight mistake history" setting itself. */
  mistakeMarkingOn?: boolean;
  /** The "Color similar phrases" setting (Settings → Marking). */
  similarOn?: boolean;
  /** An ayah-end rosette was tapped (Settings → Tafsir): open that
   *  verse's tafsir sheet. Absent = rosettes are not tappable. */
  onRosetteClick?: (verseKey: string) => void;
  /** TAP TO PLAY (2026-11-27): a word was tapped — hear the
   *  recitation from that word's ayah. The second arg is this
   *  page, so the queue is fetched for it. Absent = words are not
   *  tappable for playback. */
  onPlayFromVerse?: (verseKey: string, page: number) => void;
  /** WORD PLAY (2026-11-27): a word was pressed and held — hear
   *  just that word. The keys are the display word's engine keys;
   *  the parent resolves them onto the audio segment. */
  onPlayWord?: (verseKey: string, page: number, keys: string[]) => void;
}

export default function ReaderPage({ page, verses, tajweed, designWidth, onMeasure, zoom, hideVerses, revealedLines, onRevealLine, highlightedWords, mistakes, onMistakeWordClick, script = 'uthmani', tajweedOn = true, hideMarkers = false, frequentMistakes, mistakeMarkingOn = true, similarOn = false, onRosetteClick, onPlayFromVerse, onPlayWord }: ReaderPageProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const onMeasureRef = useRef(onMeasure);
  onMeasureRef.current = onMeasure;
  const tapGuard = useTapGuard();
  // WORD PLAY (2026-11-27): a hold on a revealed word plays just
  // that word. No hold is attached while the line is hidden — a
  // hidden line peeks on tap, never plays.
  const wordLongPress = useWordLongPress((verseKey, keys) => {
    onPlayWord?.(verseKey, page, keys);
  });

  const cleanWord = script === 'indopak' ? cleanMushafIndopak : cleanMushafUthmani;
  /* "Color similar phrases" (Settings → Marking): the normalised
   * words this page's ayahs share with a similar verse, loaded lazily
   * per ayah from /mutashabihat.json. A background wash only — no
   * padding, no bold — so the justified line's width never moves. */
  const [similarSets, setSimilarSets] = useState<Record<string, ReadonlySet<string>>>({});
  useEffect(() => {
    if (!similarOn) {
      setSimilarSets({});
      return;
    }
    let cancelled = false;
    const keys = [...new Set(verses.map((v) => v.verse_key))];
    void Promise.all(keys.map(async (k) => {
      const [s, a] = k.split(':').map(Number);
      return [k, await loadSimilarWordSet(s, a)] as const;
    })).then((pairs) => {
      if (cancelled) return;
      const next: Record<string, ReadonlySet<string>> = {};
      for (const [k, set] of pairs) next[k] = set;
      setSimilarSets(next);
    });
    return () => {
      cancelled = true;
    };
  }, [similarOn, verses]);
  // Measure the longest line's natural width (from the data, with the
  // real font — independent of the filler's tatweel). Runs when the
  // verses change and again once the fonts load.
  //
  // The measurer lives INSIDE the zoomed wrapper, so its
  // getBoundingClientRect is scaled by the wrapper's zoom: divide the
  // measured width back out, or the parent sizes the frame from a
  // zoomed width (page 3 came out 480px, lines wrapped, page shrank
  // to a narrow column). `zoom` is a dep so a zoom change re-measures;
  // the divided result is zoom-invariant, so it converges at once.
  useEffect(() => {
    const measure = () => {
      const el = measureRef.current;
      if (!el || zoom <= 0) return;
      let max = 0;
      const lineTexts = collectLineTexts(verses, script);
      for (const { text, rosettes } of lineTexts) {
        el.textContent = text;
        const w = el.getBoundingClientRect().width / zoom + rosettes * 40;
        if (w > max) max = w;
      }
      if (max > 0) onMeasureRef.current(max);
    };
    measure();
    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) measure();
      });
    }
    return () => {
      cancelled = true;
    };
  }, [verses, zoom, script]);

  // Kashida justification (fill or centre each line) after render,
  // after fonts load, and whenever the frame width changes.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const run = () => fillMushafFrame(frame);
    const raf = requestAnimationFrame(run);
    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) run();
      });
    }
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // Marking changes re-render words (rosettes appear/vanish, washes
    // come and go), so the fill must re-measure after them too.
  }, [page, verses, tajweed, designWidth, script, hideMarkers, frequentMistakes, mistakeMarkingOn, similarSets, similarOn]);

  // Group words by mushaf line, in verse order (positions restart
  // per verse — do not re-sort by position). `text` is the display
  // script's raw word; `keyText` is always the Uthmani raw word, so
  // the mic engine's word keys count Uthmani tokens even in
  // Indo-Pak mode (see lib/reader-words.ts).
  const lines = new Map<number, { text: string; keyText: string; isEnd: boolean; verseKey: string }[]>();
  for (const v of verses) {
    for (const w of v.words ?? []) {
      const arr = lines.get(w.line_number) ?? [];
      arr.push({
        text: script === 'indopak' ? (w.text_indopak ?? w.text_uthmani ?? '') : (w.text_uthmani ?? ''),
        keyText: w.text_uthmani ?? '',
        isEnd: w.char_type_name === 'end',
        verseKey: v.verse_key,
      });
      lines.set(w.line_number, arr);
    }
  }

  const renderedHeaders = new Set<number>();
  // Per-ayah engine-word cursor (Phase 3): persists across lines in
  // this render, so an ayah split over two lines keeps continuous
  // engine indices. Keyed by verse_key.
  const engineCursors = new Map<string, number>();
  const blocks: React.ReactNode[] = [];
  let key = 0;

  for (const lineNo of [...lines.keys()].sort((a, b) => a - b)) {
    const words = lines.get(lineNo)!;
    // A new surah starts on this line when its first verse (ayah 1)
    // has words here. Emit its header before the line.
    for (const w of words) {
      const [sidStr, ayahStr] = w.verseKey.split(':');
      if (ayahStr === '1' && !renderedHeaders.has(Number(sidStr))) {
        const sid = Number(sidStr);
        const surah = getSurahById(sid);
        const headerName =
          tajweed[sid]?.name && tajweed[sid].name.length > 0
            ? // The edition writes the definite article with a wasla
              // (ٱ); a standalone surah title pronounces it, so the
              // header shows a plain alef with a fatha (اَ), as on the
              // reference: "سُورَةُ الفَاتِحَةِ".
              tajweed[sid].name.replace(/ٱ/g, 'اَ')
            : surah
              ? `سُورَةُ ${surah.arabic}`
              : '';
        blocks.push(
          <div key={`h-${key++}`} className="mb-2">
            <ReaderSurahHeader name={headerName} />
            {sid !== 1 && sid !== 9 && (
              <p dir="rtl" lang="ar" translate="no" className="font-quran-madani mt-4 text-center text-[1.9rem] leading-snug text-[#111827]">
                {BISMILLAH}
              </p>
            )}
          </div>,
        );
        renderedHeaders.add(sid);
      }
    }

    // Display text with the engine word keys each word covers (Phase 3
    // highlighting): cleaned, mark-only words merged into the previous
    // word — exactly as before, plus the keys. The cursor map keeps an
    // ayah's indices continuous across its lines.
    const display: ReaderDisplayEntry[] = displayEntriesForLine(words, engineCursors, cleanWord);
    if (display.length === 0) continue;

    // A hidden line (Hide Verses mode, not yet peeked) blurs until
    // tapped; a red word inside it cannot be tapped for its tooltip
    // until the line is revealed (the tap reveals it instead).
    const hidden = !!hideVerses && !revealedLines?.has(lineNo);

    // Every line gets the mushaf-line class and the kashida filler
    // decides: fill it when the stretch is sane, centre it when it
    // is not (shortfall > 45% or capacity short — e.g. a page's last
    // line). The old "< 5 words → text-center" bypass skipped the
    // filler entirely, so fillable short lines (page 1's Bismillah,
    // 1:2, 1:6 — 34–39% shortfall, ample capacity) rendered centred
    // at ~60% width while the printed mushaf stretches them
    // edge-to-edge (2026-11-25 final pass).
    //
    // Leading 2.05 (was 2.35, 2026-11-25 third refinement): a dense
    // 15-line page at full width is 15 × 2.1rem × leading × zoom
    // tall, and at 2.35 it overflowed the viewport by ~100px, so
    // the fit check shrank it to a narrow column. At 2.05 the page
    // fits at full width (shrink 1) on a phone viewport; the fit
    // check stays as the safety net for shorter screens. The
    // measurer below uses the same leading.
    // Indo-Pak renders in Scheherazade New (font-quran), Madani in
    // Amiri (font-quran-madani) — the same fonts the single-page
    // reader uses for the two scripts.
    const lineClass =
      script === 'indopak'
        ? 'font-quran text-[2.1rem] leading-[2.05] text-[#111827] mushaf-line'
        : 'font-quran-madani text-[2.1rem] leading-[2.05] text-[#111827] mushaf-line';

    // Colour each word from its ayah's tajweed segments (aligned by
    // normalised text). Words without a match render black.
    const lineContent: React.ReactNode[] = [];
    // Group consecutive display entries by verse so alignment runs
    // once per ayah.
    let i = 0;
    while (i < display.length) {
      const verseKey = display[i].verseKey;
      const [sidStr, ayahStr] = verseKey.split(':');
      const sid = Number(sidStr);
      const ayahNum = Number(ayahStr);
      // Collect this ayah's words on this line (in order).
      const group: ReaderDisplayEntry[] = [];
      while (i < display.length && display[i].verseKey === verseKey) {
        group.push(display[i]);
        i++;
      }
      const tj = tajweed[sid]?.ayahs[ayahNum];
      const wordTexts = group.filter((g) => !g.isEnd).map((g) => g.text);
      const offsets = tj ? alignWords(wordTexts, tj) : wordTexts.map(() => -1);
      let wi = 0;
      for (const g of group) {
        if (g.isEnd) {
          // "Hide verse markers": no rosette is rendered at all.
          if (!hideMarkers) {
            // A rosette tap opens that verse's tafsir sheet (the tap
            // guard keeps a swipe from firing it).
            lineContent.push(
              onRosetteClick ? (
                <button
                  key={`${g.verseKey}-end-${key++}`}
                  type="button"
                  aria-label={`Tafsir for ${g.verseKey}`}
                  onPointerDown={tapGuard.down}
                  onClick={(e) => {
                    if (tapGuard.ok(e)) onRosetteClick(g.verseKey);
                  }}
                  className="m-0 inline-flex items-center justify-center border-0 bg-transparent p-0 align-middle"
                >
                  <ReaderRosette ayah={ayahNum} />
                </button>
              ) : (
                <ReaderRosette key={`${g.verseKey}-end-${key++}`} ayah={ayahNum} />
              ),
            );
          }
          continue;
        }
        const off = offsets[wi];
        wi++;
        // Phase 3: every word gets a unique id (word-surah-ayah-index,
        // mapping cleanly to the engine's word positions) and lights up
        // green while any of its engine keys is highlighted. The class
        // sits on the outer span so the tajweed colour runs inside keep
        // their colours — the green is a soft background wash.
        // Phase 5: a word the checker flagged lights up red instead
        // (red wins over green) and is tappable for its tooltip.
        const highlighted = g.keys.some((k) => highlightedWords?.has(k));
        const mistake = mistakes ? mistakeForKeys(g.keys, mistakes) : undefined;
        const wordId = g.keys[0] ? `word-${g.keys[0].replace(/:/g, '-')}` : undefined;
        // Marking (Settings → Marking): a word missed 2+ times keeps
        // the red dotted underline from the mistake history (live
        // red/green wins over it), and a word this ayah shares with
        // a similar verse gets an amber wash. Neither applies while
        // the line is hidden — the blur hides the text anyway. The
        // merged pause marks normalise away, so a merged word still
        // matches its mistake-log / similar-phrase entry.
        const norm = normalizeArabic(g.text);
        const frequent =
          mistakeMarkingOn && !mistake && !hidden && norm !== '' && (frequentMistakes?.has(`${sid}:${ayahNum}:${norm}`) ?? false);
        const similar =
          similarOn && !mistake && !hidden && norm !== '' && (similarSets[g.verseKey]?.has(norm) ?? false);
        const wordClass = `reader-word${mistake ? ' highlight-red mistake-word' : highlighted ? ' highlight-green' : ''}${frequent ? ' live-word-wrong' : ''}${similar ? ' rounded bg-[#FFB800]/40' : ''}`;
        // A red word opens its tooltip on a real tap (the guard keeps
        // a swipe from firing it); hidden lines reveal instead. A tap
        // that follows a word long-press is suppressed — the hold
        // already played the word, so the tooltip must not open too.
        const wordTap =
          mistake && !hidden
            ? {
                onClick: (e: React.MouseEvent) => {
                  if (consumeWordLongPress()) return;
                  if (tapGuard.ok(e)) {
                    onMistakeWordClick?.(mistake, (e.currentTarget as HTMLElement).getBoundingClientRect());
                  }
                },
              }
            : {};
        // TAP TO PLAY (2026-11-27): a plain word plays from its
        // ayah on a real tap (same guard). The ayah comes from the
        // line's verseKey in scope — the word span's id encodes the
        // same `word-S-A-N`. Red words keep their tooltip instead
        // (mutually exclusive with wordTap above); hidden lines
        // reveal instead, so no tap is attached while hidden.
        // The rosette is a <button>, not a word span, so its tap
        // never reaches here. WORD PLAY: a tap that follows a word
        // long-press is suppressed — the hold already played just
        // that word.
        const playTap =
          !mistake && !hidden && onPlayFromVerse
            ? {
                onClick: (e: React.MouseEvent) => {
                  if (consumeWordLongPress()) return;
                  if (tapGuard.ok(e)) onPlayFromVerse(g.verseKey, page);
                },
              }
            : {};
        // WORD PLAY (2026-11-27): the hold binder for this word —
        // only on a revealed line. A hold on a red mistake word
        // plays the word instead of opening its tooltip (the click
        // that follows the hold is suppressed above).
        const lpBind = !hidden && onPlayWord ? wordLongPress.bind(g.verseKey, g.keys) : null;
        // The pointerdown merges the tap guard's (every word records
        // it, as wordTap/playTap did before) with the hold's; the
        // other hold handlers are the word's own. Explicit props sit
        // after the spreads so they win over any onPointerDown a
        // spread carries.
        const wordPointer = {
          onPointerDown: (e: React.PointerEvent) => {
            tapGuard.down(e);
            lpBind?.onPointerDown(e);
          },
          onPointerMove: lpBind?.onPointerMove,
          onPointerUp: lpBind?.onPointerUp,
          onPointerCancel: lpBind?.onPointerCancel,
          onPointerLeave: lpBind?.onPointerLeave,
          onContextMenu: lpBind?.onContextMenu,
        };
        // Show Tajweed Colors off: every word renders black, like a
        // word with no tajweed match. The toggle lives in the Mushaf
        // Type screen (and Settings); this reader ignored the setting
        // until the fourth refinement — colours were always on here.
        // (In Indo-Pak mode the alignment below is against Uthmani
        // tajweed text, so some words fall back to black even with
        // colours on; the per-word heuristic in the single-page
        // reader colours those.)
        if (tajweedOn && tj && off >= 0) {
          const runs = colorizeWord(g.text, tj.plain, tj.segments, off);
          lineContent.push(
            <span key={`${g.verseKey}-${wi}`} id={wordId} className={wordClass} {...wordTap} {...playTap} {...wordPointer}>
              {runs.map((r, ri) => (
                <span key={ri} style={{ color: r.color }}>
                  {r.text}
                </span>
              ))}
            </span>,
          );
        } else {
          lineContent.push(
            <span key={`${g.verseKey}-${wi}`} id={wordId} className={wordClass} style={{ color: TAJWEED_BLACK }} {...wordTap} {...playTap} {...wordPointer}>
              {g.text}
            </span>,
          );
        }
        // Space between words (a real text node, not a span, so the
        // filler can measure and justify the line).
        lineContent.push(' ');
      }
    }

    // A hidden line (Hide Verses mode, not yet peeked) blurs until
    // tapped; the tap guard keeps a swipe from revealing it.
    // (`hidden` is computed above, before the word loop.) The peek
    // info (Phase 6) is the first verse on the line + its first
    // words, so the reader can log the peek in a test take.
    const peekInfo: PeekInfo | undefined = (() => {
      const first = display.find((w) => !w.isEnd);
      if (!first) return undefined;
      const [sidStr, ayahStr] = first.verseKey.split(':');
      const snippet = display
        .filter((w) => !w.isEnd)
        .slice(0, 3)
        .map((w) => w.text)
        .join(' ');
      return { surah: Number(sidStr), ayah: Number(ayahStr), display: snippet };
    })();
    blocks.push(
      <p
        key={`l-${lineNo}`}
        dir="rtl"
        lang="ar"
        translate="no"
        className={lineClass}
        onPointerDown={hidden ? tapGuard.down : undefined}
        onClick={
          hidden
            ? (e) => {
                if (tapGuard.ok(e)) onRevealLine?.(lineNo, peekInfo);
              }
            : undefined
        }
        style={
          hidden
            ? { filter: 'blur(7px)', cursor: 'pointer', userSelect: 'none' }
            : undefined
        }
      >
        {lineContent}
      </p>,
    );
  }

  return (
    <div className="w-full">
      <div ref={frameRef} style={{ width: designWidth }} className="mx-auto px-2">
        {blocks}
      </div>
      {/* Hidden measurer: same font as a line, sized to content. */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className={`${script === 'indopak' ? 'font-quran' : 'font-quran-madani'} pointer-events-none fixed left-[-99999px] top-0 text-[2.1rem] leading-[2.05]`}
        style={{ width: 'max-content', visibility: 'hidden' }}
      />
    </div>
  );
}

/** Plain text of every rendered line (words joined by spaces) plus
 *  its rosette count, for the natural-width measurement. Mirrors the
 *  renderer's grouping/cleaning so the measure matches the render. */
function collectLineTexts(verses: MushafVerse[], script: QuranScript = 'uthmani'): { text: string; rosettes: number }[] {
  const cleanWord = script === 'indopak' ? cleanMushafIndopak : cleanMushafUthmani;
  const lines = new Map<number, { text: string; isEnd: boolean; verseKey: string }[]>();
  for (const v of verses) {
    for (const w of v.words ?? []) {
      const arr = lines.get(w.line_number) ?? [];
      arr.push({
        text: script === 'indopak' ? (w.text_indopak ?? w.text_uthmani ?? '') : (w.text_uthmani ?? ''),
        isEnd: w.char_type_name === 'end',
        verseKey: v.verse_key,
      });
      lines.set(w.line_number, arr);
    }
  }
  const out: { text: string; rosettes: number }[] = [];
  const headerSeen = new Set<number>();
  for (const lineNo of [...lines.keys()].sort((a, b) => a - b)) {
    const words = lines.get(lineNo)!;
    // A surah starting here adds a Bismillah line (its width counts).
    for (const w of words) {
      const [sidStr, ayahStr] = w.verseKey.split(':');
      const sid = Number(sidStr);
      if (ayahStr === '1' && !headerSeen.has(sid)) {
        headerSeen.add(sid);
        if (sid !== 1 && sid !== 9) out.push({ text: BISMILLAH, rosettes: 0 });
      }
    }
    const display: { text: string; isEnd: boolean }[] = [];
    for (const w of words) {
      const text = cleanWord(w.text);
      if (!text) continue;
      if (!w.isEnd && isPauseMarkOnly(text) && display.length > 0) {
        display[display.length - 1].text += text;
        continue;
      }
      display.push({ text, isEnd: w.isEnd });
    }
    if (display.length === 0) continue;
    const text = display
      .filter((d) => !d.isEnd)
      .map((d) => d.text)
      .join(' ');
    const rosettes = display.filter((d) => d.isEnd).length;
    out.push({ text, rosettes });
  }
  return out;
}
