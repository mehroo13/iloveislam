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

import { useEffect, useRef } from 'react';
import { getSurahById } from '../surahs';
import { BISMILLAH } from '../../quran/lib';
import {
  cleanMushafUthmani,
  isPauseMarkOnly,
  type MushafVerse,
} from '../lib/fetch';
import { fillMushafFrame } from '../lib/kashida';
import {
  alignWords,
  colorizeWord,
  TAJWEED_BLACK,
  type TajweedSurah,
} from '../lib/tajweed';
import ReaderSurahHeader from './ReaderSurahHeader';

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
        stroke="#111827"
      >
        <circle cx="20" cy="20" r="13" fill="#FFFFFF" strokeWidth="1.25" />
        <circle cx="20" cy="20" r="10.5" strokeWidth="0.75" />
        {/* Small petals at the diagonals */}
        <g fill="#111827" stroke="none">
          <path d="M 20 3.5 L 21.6 7 L 20 8.5 L 18.4 7 Z" />
          <path d="M 20 36.5 L 21.6 33 L 20 31.5 L 18.4 33 Z" />
          <path d="M 3.5 20 L 7 18.4 L 8.5 20 L 7 21.6 Z" />
          <path d="M 36.5 20 L 33 18.4 L 31.5 20 L 33 21.6 Z" />
        </g>
        {/* Double loop at the top */}
        <circle cx="16.5" cy="5.5" r="2" fill="#FFFFFF" strokeWidth="1" />
        <circle cx="23.5" cy="5.5" r="2" fill="#FFFFFF" strokeWidth="1" />
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
}

export default function ReaderPage({ page, verses, tajweed, designWidth, onMeasure }: ReaderPageProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const onMeasureRef = useRef(onMeasure);
  onMeasureRef.current = onMeasure;

  // Measure the longest line's natural width (from the data, with the
  // real font — independent of the filler's tatweel). Runs when the
  // verses change and again once the fonts load.
  useEffect(() => {
    const measure = () => {
      const el = measureRef.current;
      if (!el) return;
      let max = 0;
      const lineTexts = collectLineTexts(verses);
      for (const { text, rosettes } of lineTexts) {
        el.textContent = text;
        const w = el.getBoundingClientRect().width + rosettes * 40;
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
  }, [verses]);

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
  }, [page, verses, tajweed, designWidth]);

  // Group words by mushaf line, in verse order (positions restart
  // per verse — do not re-sort by position).
  const lines = new Map<number, { text: string; isEnd: boolean; verseKey: string }[]>();
  for (const v of verses) {
    for (const w of v.words ?? []) {
      const arr = lines.get(w.line_number) ?? [];
      arr.push({ text: w.text_uthmani ?? '', isEnd: w.char_type_name === 'end', verseKey: v.verse_key });
      lines.set(w.line_number, arr);
    }
  }

  const renderedHeaders = new Set<number>();
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

    // Clean display text, merging mark-only words into the previous word.
    const display: { text: string; isEnd: boolean; verseKey: string }[] = [];
    for (const w of words) {
      const text = cleanMushafUthmani(w.text);
      if (!text) continue;
      if (!w.isEnd && isPauseMarkOnly(text) && display.length > 0) {
        display[display.length - 1].text += text;
        continue;
      }
      display.push({ text, isEnd: w.isEnd, verseKey: w.verseKey });
    }
    if (display.length === 0) continue;

    const shortLine = display.filter((w) => !w.isEnd).length < 5;
    const lineClass = `font-quran-madani text-[2.1rem] leading-[2.35] text-[#111827] ${
      shortLine ? 'text-center' : 'mushaf-line'
    }`;

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
      const group: { text: string; isEnd: boolean; verseKey: string }[] = [];
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
          lineContent.push(<ReaderRosette key={`${g.verseKey}-end-${key++}`} ayah={ayahNum} />);
          continue;
        }
        const off = offsets[wi];
        wi++;
        if (tj && off >= 0) {
          const runs = colorizeWord(g.text, tj.plain, tj.segments, off);
          lineContent.push(
            <span key={`${g.verseKey}-${wi}`}>
              {runs.map((r, ri) => (
                <span key={ri} style={{ color: r.color }}>
                  {r.text}
                </span>
              ))}
            </span>,
          );
        } else {
          lineContent.push(
            <span key={`${g.verseKey}-${wi}`} style={{ color: TAJWEED_BLACK }}>
              {g.text}
            </span>,
          );
        }
        // Space between words (a real text node, not a span, so the
        // filler can measure and justify the line).
        lineContent.push(' ');
      }
    }

    blocks.push(
      <p key={`l-${lineNo}`} dir="rtl" lang="ar" translate="no" className={lineClass}>
        {lineContent}
      </p>,
    );
  }

  return (
    <div className="w-full">
      <div ref={frameRef} style={{ width: designWidth }} className="mx-auto px-6">
        {blocks}
      </div>
      {/* Hidden measurer: same font as a line, sized to content. */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className="font-quran-madani pointer-events-none fixed left-[-99999px] top-0 text-[2.1rem] leading-[2.35]"
        style={{ width: 'max-content', visibility: 'hidden' }}
      />
    </div>
  );
}

/** Plain text of every rendered line (words joined by spaces) plus
 *  its rosette count, for the natural-width measurement. Mirrors the
 *  renderer's grouping/cleaning so the measure matches the render. */
function collectLineTexts(verses: MushafVerse[]): { text: string; rosettes: number }[] {
  const lines = new Map<number, { text: string; isEnd: boolean; verseKey: string }[]>();
  for (const v of verses) {
    for (const w of v.words ?? []) {
      const arr = lines.get(w.line_number) ?? [];
      arr.push({ text: w.text_uthmani ?? '', isEnd: w.char_type_name === 'end', verseKey: v.verse_key });
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
      const text = cleanMushafUthmani(w.text);
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
