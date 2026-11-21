// app/hifz/components/MushafPageView.tsx — renders one Madani mushaf page
// the way the printed Quran looks (spec §21).
//
// Data: Quran.com verses/by_page, each verse with its words. Every word
// carries text_uthmani, line_number and char_type_name ('word' | 'end').
// The printed mushaf leaves the header lines empty where a new surah
// starts (e.g. page 2: lines 1–2 empty, words start on line 3) and where
// a surah starts mid-page (e.g. page 564: lines 6–7 empty for Al-Qalam).
// So the renderer walks the lines in order and drops the ornamental
// surah header + Bismillah into the empty-line gap before the surah's
// first words. Ayah-end markers (the circled ayah number) render as the
// numeral inside a gold ring. Juz starts get a small marker line.
// Full lines are justified like the mushaf; short lines are centred.
import Link from 'next/link';
import { BISMILLAH } from '../../quran/lib';
import { getSurahById, type HifzSurah } from '../surahs';
import { JUZ_PAGES } from '../juz';
import type { MushafVerse, MushafWord } from '../lib/fetch';

interface WordWithVerse extends MushafWord {
  verseKey: string;
}

/** Verse keys that open a juz, e.g. "2:142" opens Juz 2. */
const JUZ_START_KEYS = new Map<string, number>();
for (const juz of JUZ_PAGES) {
  const first = juz.segments[0];
  JUZ_START_KEYS.set(`${first.surahId}:${first.fromAyah}`, juz.n);
}

function SurahHeader({ surah }: { surah: HifzSurah }) {
  return (
    <div className="my-4">
      <div className="rounded-xl border-2 border-[#C9A227] bg-[#FFF9E6] px-4 py-3 text-center shadow-sm">
        <p dir="rtl" lang="ar" className="font-quran-madani text-3xl leading-snug text-[#0B3D2E] sm:text-4xl">
          {surah.arabic}
        </p>
        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#8a6d1b]">
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
  // Group words by mushaf line, in position order.
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
    const shortLine = words.length < 6;
    blocks.push(
      <p
        key={`l-${lineNo}`}
        dir="rtl"
        lang="ar"
        className={`font-quran-madani text-[1.85rem] leading-[2.35] text-[#1C2420] sm:text-[2.1rem] ${
          shortLine ? 'text-center' : 'text-justify [text-align-last:justify]'
        }`}
      >
        {words.map((w, i) =>
          w.char_type_name === 'end' ? (
            <span
              key={`${w.verseKey}-${i}`}
              className="mx-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#C9A227] align-middle text-[1rem] font-bold text-[#8a6d1b]"
            >
              {w.text_uthmani}
            </span>
          ) : (
            <span key={`${w.verseKey}-${i}`}>
              {w.text_uthmani}{' '}
            </span>
          ),
        )}
      </p>,
    );
  }

  const surahIds = [...new Set(verses.map((v) => Number(v.verse_key.split(':')[0])))];
  const surahs = surahIds.map(getSurahById).filter((s): s is HifzSurah => Boolean(s));

  return (
    <div>
      <div className="rounded-2xl border-2 border-[#C9A227] bg-[#FDF8EC] p-2 shadow-sm sm:p-4">
        <div className="rounded-xl border border-[#C9A227]/60 bg-[#FFFDF6] px-3 py-4 sm:px-6 sm:py-6">
          {blocks.length > 0 ? (
            blocks
          ) : (
            <p className="py-10 text-center text-sm text-[#5b6b62]">
              This mushaf page could not be loaded right now. Check your connection and reload.
            </p>
          )}
        </div>
        <p className="mt-3 text-center text-xs text-[#5b6b62]">
          Page {page} of 604 · Madani Mushaf · Uthmani script · Text via Quran.com
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
