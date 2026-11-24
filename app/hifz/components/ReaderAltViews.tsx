// app/hifz/components/ReaderAltViews.tsx — the reader's alternate
// layouts (Phase 1, Mushaf Layout modal):
//   ReaderTextMode — the surah as flowing, resizable plain Quran text.
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
import {
  cleanMushafUthmani,
  isPauseMarkOnly,
  type MushafVerse,
} from '../lib/fetch';
import ReaderSurahHeader from './ReaderSurahHeader';
import { ReaderRosette } from './ReaderPage';

const INK = '#111827';
const MUTED = '#6B7280';

/** Plain flowing text of one verse: cleaned non-end words joined with
 *  spaces (pause-mark-only words attach to the previous word, as in
 *  the Madani renderer). */
export function versePlainText(v: MushafVerse): string {
  const out: string[] = [];
  for (const w of v.words ?? []) {
    if (w.char_type_name === 'end') continue;
    const text = cleanMushafUthmani(w.text_uthmani ?? '');
    if (!text) continue;
    if (isPauseMarkOnly(text) && out.length > 0) {
      out[out.length - 1] += text;
      continue;
    }
    out.push(text);
  }
  return out.join(' ');
}

/** Tap-vs-drag guard: a tap reveals a hidden verse; a swipe (which
 *  also fires pointer events on the way to turning the page) must not.
 *  Record the pointer-down position, then only accept clicks that
 *  moved less than ~12px. */
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

function SurahIntro({ sid }: { sid: number }) {
  const surah = getSurahById(sid);
  const name = surah ? `سُورَةُ ${surah.arabic}` : '';
  return (
    <div className="mb-3">
      <ReaderSurahHeader name={name} />
      {sid !== 1 && sid !== 9 && (
        <p dir="rtl" lang="ar" translate="no" className="font-quran-madani mt-3 text-center text-[1.6rem] leading-snug text-[#111827]">
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

export function ReaderTextMode({
  verses,
  hideVerses,
  revealed,
  onReveal,
  textSize,
  onTextSizeChange,
}: {
  verses: MushafVerse[];
  hideVerses: boolean;
  /** Keys of revealed verses: `V${verse_key}`. */
  revealed: ReadonlySet<string>;
  onReveal: (key: string) => void;
  /** Font size in rem. */
  textSize: number;
  onTextSizeChange: (n: number) => void;
}) {
  const guard = useTapGuard();
  const groups = groupBySurah(verses);
  return (
    <div className="w-full px-1 pb-4">
      {/* Text-size control */}
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

      {groups.map((g) => (
        <div key={`s-${g.sid}`}>
          <SurahIntro sid={g.sid} />
          {g.verses.map((v) => {
            const key = `V${v.verse_key}`;
            const hidden = hideVerses && !revealed.has(key);
            const ayahNum = Number(v.verse_key.split(':')[1]);
            return (
              <div
                key={v.verse_key}
                onPointerDown={hidden ? guard.down : undefined}
                onClick={
                  hidden
                    ? (e) => {
                        if (guard.ok(e)) onReveal(key);
                      }
                    : undefined
                }
                className="mb-4"
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
                  className="font-quran-madani text-justify leading-[2.1]"
                  style={{ fontSize: `${textSize}rem`, color: INK }}
                >
                  {versePlainText(v)}{' '}
                  <ReaderRosette ayah={ayahNum} />
                </p>
              </div>
            );
          })}
        </div>
      ))}
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
}: {
  verses: MushafVerse[];
  hideVerses: boolean;
  revealed: ReadonlySet<string>;
  onReveal: (key: string) => void;
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
          <SurahIntro sid={g.sid} />
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
                          if (guard.ok(e)) onReveal(key);
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
                    {versePlainText(v)}{' '}
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
