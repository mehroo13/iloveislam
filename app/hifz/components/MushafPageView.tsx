// app/hifz/components/MushafPageView.tsx — renders one Madani mushaf page
// the way the printed Quran looks (spec §21).
//
// Data: Quran.com verses/by_page, each verse with its words. Every word
// carries text_uthmani AND text_indopak, line_number and char_type_name
// ('word' | 'end'). The printed mushaf leaves the header lines empty where
// a new surah starts (e.g. page 2: lines 1–2 empty, words start on line 3)
// and where a surah starts mid-page (e.g. page 564: lines 6–7 empty for
// Al-Qalam). So the renderer walks the lines in order and drops the
// ornamental surah header + Bismillah into the empty-line gap before the
// surah's first words. Ayah-end markers (the circled ayah number) render
// as the numeral inside a gold ring. Juz starts get a small marker line.
//
// Layout rules that make it read like the printed mushaf:
//   - Full lines are justified with inter-character (kashida) spacing —
//     the mushaf stretches letters, not word gaps, so wide gaps between
//     words are never allowed. Short lines are centred, as in the book.
//   - Pause marks are attached to the preceding word (cleanMushafUthmani)
//     and mark-only words are merged into the previous word, so nothing
//     floats above the line.
//   - Short pages (few lines of text) are vertically centred in the page
//     frame instead of leaving a big empty area below the text.
//   - The surah header is an ornamental gold frame with corner diamonds
//     and an eight-point star, not a plain box.
//   - Script picker (Indo-Pak / Madani-Uthmani) — the same preference as
//     the reader (hifz_script_v1). Indo-Pak renders on the Madani page
//     layout, exactly as Quran.com's own reader does; the page breaks are
//     the Madani mushaf's in both scripts.
'use client';

import Link from 'next/link';
import { BISMILLAH } from '../../quran/lib';
import { getSurahById, type HifzSurah } from '../surahs';
import { JUZ_PAGES } from '../juz';
import {
  cleanMushafIndopak,
  cleanMushafUthmani,
  isPauseMarkOnly,
  type MushafVerse,
  type MushafWord,
} from '../lib/fetch';
import { SCRIPT_LABELS, useScriptPref } from '../lib/script';

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
      <div className="relative rounded-2xl border-2 border-[#C9A227] bg-gradient-to-b from-[#FFF9E6] to-[#FBF0CC] px-4 pb-3 pt-4 text-center shadow-sm">
        {/* Corner diamonds */}
        <span aria-hidden="true" className="absolute left-2 top-2 h-2 w-2 rotate-45 bg-[#C9A227]" />
        <span aria-hidden="true" className="absolute right-2 top-2 h-2 w-2 rotate-45 bg-[#C9A227]" />
        <span aria-hidden="true" className="absolute bottom-2 left-2 h-2 w-2 rotate-45 bg-[#C9A227]" />
        <span aria-hidden="true" className="absolute bottom-2 right-2 h-2 w-2 rotate-45 bg-[#C9A227]" />
        {/* Star overlapping the top border, as on a printed mushaf header */}
        <span
          aria-hidden="true"
          className="absolute -top-3 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-[#C9A227] bg-[#FFF9E6] text-[#C9A227]"
        >
          <StarMark className="h-3.5 w-3.5" />
        </span>
        <div className="rounded-xl border border-[#C9A227]/60 bg-[#FFFDF6]/80 px-3 py-2">
          <p dir="rtl" lang="ar" className="font-quran-madani text-3xl leading-snug text-[#0B3D2E] sm:text-4xl">
            {surah.arabic}
          </p>
        </div>
        <p className="mt-2 border-t border-[#C9A227]/40 pt-2 text-xs font-bold uppercase tracking-wider text-[#8a6d1b]">
          Surah {surah.id} · {surah.name} · {surah.meaning} · {surah.ayahCount} ayahs ·{' '}
          {surah.revelation}
        </p>
      </div>
      {surah.id !== 1 && surah.id !== 9 && (
        <p dir="rtl" lang="ar" className="font-quran-madani mt-4 text-center text-2xl text-[#0B3D2E] sm:text-3xl">
          {BISMILLAH}
        </p>
      )}
    </div>
  );
}

function JuzMarker({ n }: { n: number }) {
  return (
    <div className="my-3 flex items-center gap-3" aria-label={`Start of Juz ${n}`}>
      <span className="h-px flex-1 bg-[#C9A227]/50" aria-hidden="true" />
      <span className="rounded-full border border-[#C9A227] bg-[#FFF9E6] px-3 py-1 text-xs font-bold text-[#8a6d1b]">
        Juz {n}
      </span>
      <span className="h-px flex-1 bg-[#C9A227]/50" aria-hidden="true" />
    </div>
  );
}

export default function MushafPageView({
  page,
  verses,
}: {
  page: number;
  verses: MushafVerse[];
}) {
  const [script, setScript] = useScriptPref();
  const fontClass = script === 'uthmani' ? 'font-quran-madani' : 'font-quran';

  // Group words by mushaf line, in position order. A word that is only
  // pause marks is merged into the previous word so it sits on the word
  // it belongs to instead of floating above the line.
  const lines = new Map<number, WordWithVerse[]>();
  for (const v of verses) {
    for (const w of v.words ?? []) {
      const arr = lines.get(w.line_number) ?? [];
      arr.push({ ...w, verseKey: v.verse_key });
      lines.set(w.line_number, arr);
    }
  }
  for (const arr of lines.values()) arr.sort((a, b) => a.position - b.position);

  const renderedHeaders = new Set<number>();
  const renderedJuzMarkers = new Set<number>();
  const blocks: React.ReactNode[] = [];
  let key = 0;

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
    const display: { text: string; isEnd: boolean; verseKey: string }[] = [];
    for (const w of words) {
      const raw = script === 'uthmani' ? w.text_uthmani : w.text_indopak ?? w.text_uthmani;
      const text =
        script === 'uthmani' ? cleanMushafUthmani(raw) : cleanMushafIndopak(raw);
      if (!text) continue;
      if (w.char_type_name !== 'end' && isPauseMarkOnly(text) && display.length > 0) {
        display[display.length - 1].text += text;
        continue;
      }
      display.push({ text, isEnd: w.char_type_name === 'end', verseKey: w.verseKey });
    }
    if (display.length === 0) continue;

    // Full lines are justified like the mushaf (kashida stretching, not
    // wide word gaps); short lines are centred, as in the book.
    const shortLine = display.length < 8;
    blocks.push(
      <p
        key={`l-${lineNo}`}
        dir="rtl"
        lang="ar"
        className={`${fontClass} text-[1.85rem] leading-[2.35] text-[#1C2420] sm:text-[2.1rem] ${
          shortLine
            ? 'text-center'
            : 'text-justify [text-justify:inter-character] [text-align-last:justify]'
        }`}
      >
        {display.map((w, i) =>
          w.isEnd ? (
            <span
              key={`${w.verseKey}-${i}`}
              className="mx-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#C9A227] align-middle text-[1rem] font-bold text-[#8a6d1b]"
            >
              {w.text}
            </span>
          ) : (
            <span key={`${w.verseKey}-${i}`}>
              {w.text}{' '}
            </span>
          ),
        )}
      </p>,
    );
  }

  const surahIds = [...new Set(verses.map((v) => Number(v.verse_key.split(':')[0])))];
  const surahs = surahIds.map(getSurahById).filter((s): s is HifzSurah => Boolean(s));
  const lineCount = lines.size;
  // Short pages (few lines of text) are centred vertically in the frame
  // instead of leaving a big empty area below the text.
  const shortPage = lineCount > 0 && lineCount < 9;

  return (
    <div>
      {/* Script picker — same preference as the reader */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Quran script">
        <span className="text-sm font-semibold text-[#0B3D2E]">Script</span>
        {(['indopak', 'uthmani'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScript(s)}
            aria-pressed={script === s}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              script === s
                ? 'bg-[#0B3D2E] text-white'
                : 'border border-[#e5e0d3] bg-white text-[#0B3D2E] hover:bg-[#F7F5EF]'
            }`}
          >
            {SCRIPT_LABELS[s]}
          </button>
        ))}
      </div>
      {script === 'indopak' && (
        <p className="mt-2 text-center text-xs text-[#5b6b62]">
          Indo-Pak script on the Madani mushaf pages, as in Quran.com&apos;s reader.
        </p>
      )}

      <div className="mt-4 rounded-2xl border-2 border-[#C9A227] bg-[#FDF8EC] p-2 shadow-sm sm:p-4">
        <div
          className={`rounded-xl border border-[#C9A227]/60 bg-[#FFFDF6] px-3 py-4 sm:px-6 sm:py-6 ${
            shortPage ? 'flex min-h-[55vh] flex-col justify-center' : ''
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

      {/* Surahs on this page — jump back into the study view / coach */}
      {surahs.length > 0 && (
        <nav aria-label="Surahs on this page" className="mt-6 rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#0B3D2E]">On this page</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {surahs.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link href={`/hifz/${s.slug}`} className="font-semibold text-[#146B4D] hover:underline">
                  Surah {s.name} ({s.meaning})
                </Link>
                <Link href={`/hifz/${s.slug}?mode=recite`} className="text-[#5b6b62] hover:underline">
                  Recite with the coach →
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-[#5b6b62]">
            Prefer the verse list?{' '}
            <Link href="/hifz" className="font-semibold text-[#146B4D] underline">
              Browse all 114 surahs
            </Link>
          </p>
        </nav>
      )}
    </div>
  );
}
