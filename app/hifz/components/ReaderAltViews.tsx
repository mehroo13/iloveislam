// app/hifz/components/ReaderAltViews.tsx — the reader's alternate
// layouts (Phase 1, Mushaf Layout modal):
//   ReaderContinuousText — the Quran as flowing, resizable plain text,
//     surah after surah with no pagination (2026-11-25 refinement pass).
//   ReaderTranslationMode — each ayah with its Dr. Mustafa Khattab
//   (The Clear Quran) translation, fetched per surah from the
//   /api/quran/khattab route (the open quran-api dataset — neither
//   Quran.com v4 nor AlQuran Cloud serves Khattab; verified 2026-11-24).
// Transliteration is NOT shown: the mode's content is translation, per
// the brief (a transliteration line would need per-word data).
//
// Both views support Hide Verses: the Arabic is blurred until tapped
// (tap-to-peek). In translation mode only the Arabic blurs — the
// English stays visible as the prompt.

'use client';

import { useEffect, useRef, useState } from 'react';
import { getSurahById } from '../surahs';
import { BISMILLAH } from '../../quran/lib';
import { type MushafVerse } from '../lib/fetch';
import { type ReaderPageData } from '../lib/reader-page';
import { verseDisplayWords } from '../lib/reader-words';
import {
  mistakeForKeys,
  type PeekInfo,
  type ReaderMistake,
} from '../lib/reader-mistakes';
import ReaderSurahHeader from './ReaderSurahHeader';
import { ReaderRosette } from './ReaderPage';

const INK = 'var(--reader-ink)';
const MUTED = 'var(--reader-muted)';

/**
 * One ayah rendered as individually identified word spans (Phase 3):
 * every word gets `id="word-surah-ayah-index"` and lights up green
 * while any of its engine keys is in highlightedWords. The spaces
 * between words are plain text nodes, so flowing justification is
 * unchanged. A word that covers two engine tokens (base word + an
 * attached pause mark) highlights when either is spoken.
 */
function AyahWords({
  verse,
  highlightedWords,
  mistakes,
  onMistakeWordClick,
  clickable,
}: {
  verse: MushafVerse;
  highlightedWords?: ReadonlySet<string>;
  /** Words the checker flagged this take (Phase 5): engine key →
   *  mistake. Those words light up red and are tappable. */
  mistakes?: ReadonlyMap<string, ReaderMistake>;
  onMistakeWordClick?: (mistake: ReaderMistake, rect: DOMRect) => void;
  /** False while the verse is hidden (blurred) — a red word cannot
   *  be tapped for its tooltip until the verse is revealed. */
  clickable?: boolean;
}) {
  const guard = useTapGuard();
  const words = verseDisplayWords(verse);
  return (
    <>
      {words.map((w, i) => {
        const highlighted = w.keys.some((k) => highlightedWords?.has(k));
        const mistake = mistakes ? mistakeForKeys(w.keys, mistakes) : undefined;
        // A red word opens its tooltip on a real tap (the guard keeps
        // a swipe from firing it); hidden verses reveal instead.
        const wordTap =
          mistake && clickable !== false
            ? {
                onPointerDown: guard.down,
                onClick: (e: React.MouseEvent) => {
                  if (guard.ok(e)) {
                    onMistakeWordClick?.(mistake, (e.currentTarget as HTMLElement).getBoundingClientRect());
                  }
                },
              }
            : {};
        return (
          <span key={i}>
            <span
              id={w.keys[0] ? `word-${w.keys[0].replace(/:/g, '-')}` : undefined}
              className={`reader-word${mistake ? ' highlight-red mistake-word' : highlighted ? ' highlight-green' : ''}`}
              {...wordTap}
            >
              {w.text}
            </span>
            {i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </>
  );
}

/** Tap-vs-drag guard: a tap reveals a hidden verse; a swipe (which
 *  also fires pointer events on the way to turning the page) must not.
 *  Record the pointer-down position, then only accept clicks that
 *  moved less than ~12px. */
/** Peek info for one verse (Phase 6): the verse + its first three
 *  spoken words, for the test-mode mistake row. */
function versePeekInfo(v: MushafVerse): PeekInfo {
  const [sidStr, ayahStr] = v.verse_key.split(':');
  const snippet = v.words
    .filter((w) => w.char_type_name !== 'end')
    .slice(0, 3)
    .map((w) => w.text_uthmani ?? '')
    .join(' ');
  return { surah: Number(sidStr), ayah: Number(ayahStr), display: snippet };
}

export function useTapGuard() {
  const pos = useRef<{ x: number; y: number } | null>(null);
  return {
    down: (e: React.PointerEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    },
    ok: (e: React.MouseEvent) => {
      const p = pos.current;
      pos.current = null;
      if (!p) return true;
      return Math.hypot(e.clientX - p.x, e.clientY - p.y) < 12;
    },
  };
}

/** Group the page's verses by surah, in order of appearance. */
function groupBySurah(verses: MushafVerse[]): { sid: number; verses: MushafVerse[] }[] {
  const groups: { sid: number; verses: MushafVerse[] }[] = [];
  for (const v of verses) {
    const sid = Number(v.verse_key.split(':')[0]);
    const last = groups[groups.length - 1];
    if (last && last.sid === sid) last.verses.push(v);
    else groups.push({ sid, verses: [v] });
  }
  return groups;
}

function SurahIntro({ sid, arabicSize }: { sid: number; arabicSize?: number }) {
  const surah = getSurahById(sid);
  const name = surah ? `سُورَةُ ${surah.arabic}` : '';
  return (
    <div className="mb-3">
      <ReaderSurahHeader name={name} />
      {sid !== 1 && sid !== 9 && (
        <p
          dir="rtl"
          lang="ar"
          translate="no"
          className="font-quran-madani mt-3 text-center leading-snug text-[#111827]"
          style={{ fontSize: `${arabicSize ?? 1.6}rem` }}
        >
          {BISMILLAH}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quran Text mode — flowing, resizable plain text.                    */
/* ------------------------------------------------------------------ */

export const TEXT_SIZE_MIN = 1.2;
export const TEXT_SIZE_MAX = 2.2;
export const TEXT_SIZE_STEP = 0.2;


/* ---------------------------------------------------------------- */
/*  Continuous Quran Text (2026-11-25 refinement pass)               */
/* ---------------------------------------------------------------- */

/** Continuous Quran Text: the ayahs flow surah after surah as the
 *  user scrolls — Al-Fatihah, then the Al-Baqarah header ornament +
 *  Bismillah + Al-Baqarah, and so on — with NO pagination and NO
 *  empty space. The parent (ReaderScreen) owns the loaded page
 *  range and grows it as the user approaches either end; this
 *  component just renders the pages it is given, in order.
 *
 *  A surah split across two mushaf pages gets ONE header ornament
 *  (on its first appearance). A subtle centred page number marks
 *  each page boundary, as in the reader's whole-page reference.
 *
 *  FLOWING TEXT (2026-11-25 second refinement): the ayahs of one
 *  surah render as ONE flowing paragraph — words run together and
 *  wrap naturally, several ayahs on the same visual line, the
 *  rosette inline at the end of each ayah — exactly like the surah
 *  text in the reference screenshot. NO per-ayah rows, NO gaps
 *  between ayahs. Each ayah is an inline span (data-text-ayah /
 *  data-surah / data-page / data-juz / data-hizb / data-verse-key)
 *  so the parent can still track which surah and page the user is
 *  looking at (the top pill, the header row, the bookmark and the
 *  mic/playback scope all follow it), and so Hide Verses can blur
 *  one ayah at a time (tap-to-peek). The ayah rendering matches
 *  the old paginated text view — same word spans (so the Phase 3/5
 *  green/red highlighting, the mic, the peek and the Play button
 *  all keep working here), same blur + tap-to-peek, same rosette. */
export function ReaderContinuousText({
  pages,
  textSize,
  onTextSizeChange,
  highlightedWords,
  mistakes,
  onMistakeWordClick,
  hideVerses,
  revealed,
  onReveal,
}: {
  pages: { page: number; verses: MushafVerse[]; meta: ReaderPageData['meta'] }[];
  textSize: number;
  onTextSizeChange: (n: number) => void;
  highlightedWords?: ReadonlySet<string>;
  mistakes?: ReadonlyMap<string, ReaderMistake>;
  onMistakeWordClick?: (mistake: ReaderMistake, rect: DOMRect) => void;
  hideVerses: boolean;
  revealed: ReadonlySet<string>;
  onReveal: (key: string, info?: PeekInfo) => void;
}) {
  const guard = useTapGuard();
  const seenSurahs = new Set<number>();
  return (
    <div className="w-full px-1 pb-10">
      {/* Text size control — same as the paginated text view. It
          sits at the top of the flow and scrolls away as you read. */}
      <div className="mb-3 flex items-center justify-between border-b border-[#EDEDEA] pb-3">
        <span className="text-[13px] font-semibold" style={{ color: MUTED }}>
          Text size
        </span>
        <span className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Smaller text"
            onClick={() => onTextSizeChange(Math.max(TEXT_SIZE_MIN, +(textSize - TEXT_SIZE_STEP).toFixed(1)))}
            disabled={textSize <= TEXT_SIZE_MIN}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D1D5DB] bg-white text-[16px] font-bold disabled:opacity-40"
            style={{ color: INK }}
          >
            A−
          </button>
          <button
            type="button"
            aria-label="Larger text"
            onClick={() => onTextSizeChange(Math.min(TEXT_SIZE_MAX, +(textSize + TEXT_SIZE_STEP).toFixed(1)))}
            disabled={textSize >= TEXT_SIZE_MAX}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D1D5DB] bg-white text-[19px] font-bold disabled:opacity-40"
            style={{ color: INK }}
          >
            A+
          </button>
        </span>
      </div>
      {pages.map(({ page, verses, meta }, pageIdx) => {
        const groups = groupBySurah(verses);
        return (
          <div key={page}>
            {groups.map((g) => {
              const first = !seenSurahs.has(g.sid);
              if (first) seenSurahs.add(g.sid);
              return (
                <div key={`${page}-${g.sid}`}>
                  {first && <SurahIntro sid={g.sid} arabicSize={textSize} />}
                  {/* One flowing paragraph per surah: the ayahs run
                      together and wrap naturally — several ayahs on
                      the same visual line, rosette inline at each
                      ayah's end. Each ayah is an inline span so the
                      parent can track it and Hide Verses can blur
                      (tap-to-peek) one ayah at a time. */}
                  <p
                    dir="rtl"
                    lang="ar"
                    translate="no"
                    className="font-quran-madani text-justify leading-[2.1]"
                    style={{ fontSize: `${textSize}rem`, color: INK }}
                  >
                    {g.verses.map((v) => {
                      const key = `V${v.verse_key}`;
                      const hidden = hideVerses && !revealed.has(key);
                      const ayahNum = Number(v.verse_key.split(':')[1]);
                      return (
                        <span
                          key={v.verse_key}
                          data-text-ayah
                          data-surah={g.sid}
                          data-page={page}
                          data-juz={v.juz_number}
                          data-hizb={v.hizb_number ?? meta.hizb}
                          data-verse-key={v.verse_key}
                          onPointerDown={hidden ? guard.down : undefined}
                          onClick={
                            hidden
                              ? (e) => {
                                  if (guard.ok(e)) onReveal(key, versePeekInfo(v));
                                }
                              : undefined
                          }
                          style={
                            hidden
                              ? { filter: 'blur(7px)', cursor: 'pointer', userSelect: 'none' }
                              : undefined
                          }
                        >
                          <AyahWords
                            verse={v}
                            highlightedWords={highlightedWords}
                            mistakes={mistakes}
                            onMistakeWordClick={onMistakeWordClick}
                            clickable={!hidden}
                          />{' '}
                          <ReaderRosette ayah={ayahNum} />
                        </span>
                      );
                    })}
                  </p>
                </div>
              );
            })}
            {/* Page boundary marker (not after the last loaded page):
                the number of the page that just ended, centred
                between hairlines. Compact — the flow must not stall
                on vertical whitespace between pages. */}
            {pageIdx < pages.length - 1 && (
              <div aria-hidden="true" className="flex items-center gap-3 py-3">
                <div className="h-px flex-1" style={{ backgroundColor: '#E5E7EB' }} />
                <span className="text-[12px] font-semibold" style={{ color: MUTED }}>
                  {page}
                </span>
                <div className="h-px flex-1" style={{ backgroundColor: '#E5E7EB' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Translation mode — Arabic + Khattab English translation.           */
/* ------------------------------------------------------------------ */

export function ReaderTranslationMode({
  verses,
  hideVerses,
  revealed,
  onReveal,
  highlightedWords,
  mistakes,
  onMistakeWordClick,
}: {
  verses: MushafVerse[];
  hideVerses: boolean;
  revealed: ReadonlySet<string>;
  /** Tap handler for a hidden verse (tap-to-peek). The second arg
   *  is the peek info (verse + its first words) so the reader can
   *  log the peek in a test take (Phase 6). */
  onReveal: (key: string, info?: PeekInfo) => void;
  /** Words spoken correctly this take (Phase 3): engine keys
   *  `surah:ayah:word` (1-based). */
  highlightedWords?: ReadonlySet<string>;
  /** Words the checker flagged this take (Phase 5). */
  mistakes?: ReadonlyMap<string, ReaderMistake>;
  onMistakeWordClick?: (mistake: ReaderMistake, rect: DOMRect) => void;
}) {
  const guard = useTapGuard();
  const [translations, setTranslations] = useState<Record<number, Record<number, string>>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const loadedRef = useRef<Record<number, boolean>>({});

  const groups = groupBySurah(verses);

  // Fetch Khattab for each surah on the page, once per surah.
  useEffect(() => {
    for (const g of groups) {
      const sid = g.sid;
      if (loadedRef.current[sid] || loading[sid] || translations[sid]) continue;
      loadedRef.current[sid] = true;
      setLoading((l) => ({ ...l, [sid]: true }));
      fetch(`/api/quran/khattab/${sid}`)
        .then((r) => {
          if (!r.ok) throw new Error(`khattab ${sid}: ${r.status}`);
          return r.json();
        })
        .then((d: { translations?: Record<number, string> }) => {
          setTranslations((t) => ({ ...t, [sid]: d.translations ?? {} }));
          setFailed((f) => ({ ...f, [sid]: false }));
        })
        .catch(() => {
          loadedRef.current[sid] = false;
          setFailed((f) => ({ ...f, [sid]: true }));
        })
        .finally(() => setLoading((l) => ({ ...l, [sid]: false })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verses]);

  return (
    <div className="w-full px-1 pb-4">
      {groups.map((g) => (
        <div key={`s-${g.sid}`}>
          {/* Bismillah at the ayah text size (1.5rem) so the intro
              matches the verses below it. */}
          <SurahIntro sid={g.sid} arabicSize={1.5} />
          {g.verses.map((v) => {
            const key = `V${v.verse_key}`;
            const hidden = hideVerses && !revealed.has(key);
            const ayahNum = Number(v.verse_key.split(':')[1]);
            const tr = translations[g.sid]?.[ayahNum];
            return (
              <div key={v.verse_key} className="mb-5 border-b border-[#F0F0F0] pb-4">
                {/* Arabic — blurs in Hide Verses mode; tap reveals. */}
                <div
                  onPointerDown={hidden ? guard.down : undefined}
                  onClick={
                    hidden
                      ? (e) => {
                          if (guard.ok(e)) onReveal(key, versePeekInfo(v));
                        }
                      : undefined
                  }
                  style={
                    hidden
                      ? { filter: 'blur(7px)', cursor: 'pointer', userSelect: 'none' }
                      : undefined
                  }
                >
                  <p
                    dir="rtl"
                    lang="ar"
                    translate="no"
                    className="font-quran-madani text-right leading-[2]"
                    style={{ fontSize: '1.5rem', color: INK }}
                  >
                    <AyahWords
                      verse={v}
                      highlightedWords={highlightedWords}
                      mistakes={mistakes}
                      onMistakeWordClick={onMistakeWordClick}
                      clickable={!hidden}
                    />{' '}
                    <ReaderRosette ayah={ayahNum} />
                  </p>
                </div>
                {/* English translation — stays visible as the prompt. */}
                {failed[g.sid] ? (
                  <p dir="ltr" className="pt-2 text-[14px] leading-relaxed text-[#DC2626]">
                    Could not load the translation for this surah.
                  </p>
                ) : tr ? (
                  <p dir="ltr" className="pt-2 text-[15px] leading-relaxed text-[#374151]">
                    {tr}
                  </p>
                ) : (
                  <p dir="ltr" className="pt-2 text-[14px] leading-relaxed" style={{ color: MUTED }}>
                    Loading translation…
                  </p>
                )}
                <p dir="ltr" className="pt-1 text-[12px]" style={{ color: MUTED }}>
                  {v.verse_key}
                </p>
              </div>
            );
          })}
        </div>
      ))}
      <p dir="ltr" className="pt-1 text-center text-[12px] leading-snug" style={{ color: MUTED }}>
        Translation: Dr. Mustafa Khattab, The Clear Quran.
      </p>
    </div>
  );
}
