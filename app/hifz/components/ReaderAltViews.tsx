// app/hifz/components/ReaderAltViews.tsx — the reader's alternate
// layouts (Phase 1, Mushaf Layout modal):
//   ReaderContinuousText — the Quran as flowing, resizable plain text,
//     surah after surah with no pagination (2026-11-25 refinement pass).
//   ReaderTranslationMode — each ayah with its Dr. Mustafa Khattab
//   (The Clear Quran) translation, fetched per surah from the
//   /api/quran/khattab route (the open quran-api dataset — neither
//   Quran.com v4 nor AlQuran Cloud serves Khattab; verified 2026-11-24).
//   Since 2026-11-26 (Part 2) it scrolls as one continuous vertical
//   flow over the loaded page range, like ReaderContinuousText —
//   no swipe track, no per-page columns.
// Transliteration is NOT shown: the mode's content is translation, per
// the brief (a transliteration line would need per-word data).
//
// Both views support Hide Verses: the Arabic is blurred until tapped
// (tap-to-peek). In translation mode only the Arabic blurs — the
// English stays visible as the prompt.

'use client';

import { useEffect, useRef, useState } from 'react';
import { getSurahById } from '../surahs';
import { API, BISMILLAH, KHATTAB_TRANSLATION_ID, cleanTranslationText, translationName, type QuranScript } from '../../quran/lib';
import { type MushafVerse } from '../lib/fetch';
import { type ReaderPageData } from '../lib/reader-page';
import { verseDisplayWords } from '../lib/reader-words';
import {
  mistakeForKeys,
  type PeekInfo,
  type ReaderMistake,
} from '../lib/reader-mistakes';
import {
  alignWords,
  colorizeWord,
  TAJWEED_BLACK,
  type ParsedTajweedAyah,
  type TajweedSurah,
} from '../lib/tajweed';
import ReaderSurahHeader from './ReaderSurahHeader';
import { ReaderRosette } from './ReaderPage';

const INK = 'var(--reader-ink)';
const MUTED = 'var(--reader-muted)';

/** Font class for the display script: Indo-Pak renders in
 *  Scheherazade New, Madani (Uthmani) in Amiri — the same pairing
 *  the Book reader (MushafPageFrame) uses. */
function scriptFontClass(script: QuranScript): string {
  return script === 'indopak' ? 'font-quran' : 'font-quran-madani';
}

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
  page,
  highlightedWords,
  mistakes,
  onMistakeWordClick,
  clickable,
  script = 'uthmani',
  tajweed,
  tajweedOn = true,
  onPlayWord,
}: {
  verse: MushafVerse;
  /** The mushaf page this ayah sits on — the word-play queue is
   *  fetched for that page, in the edition being read. */
  page: number;
  highlightedWords?: ReadonlySet<string>;
  /** Words the checker flagged this take (Phase 5): engine key →
   *  mistake. Those words light up red and are tappable. */
  mistakes?: ReadonlyMap<string, ReaderMistake>;
  onMistakeWordClick?: (mistake: ReaderMistake, rect: DOMRect) => void;
  /** False while the verse is hidden (blurred) — a red word cannot
   *  be tapped for its tooltip until the verse is revealed. */
  clickable?: boolean;
  /** Display script (Mushaf Type picker): 'indopak' renders the
   *  Indo-Pak word forms; the engine keys still count Uthmani
   *  tokens, so highlighting lands on the right word either way. */
  script?: QuranScript;
  /** This ayah's parsed tajweed data (AlQuran Cloud tajweed
   *  edition, via the page data — the same source the Book reader
   *  colours from). Absent = this surah's tajweed failed to load,
   *  so the ayah renders black. */
  tajweed?: ParsedTajweedAyah | null;
  /** Show Tajweed Colors (the `tajweedColors` setting): when off,
   *  every word renders black. Default true — the Book reader's
   *  default, and the reader's behaviour before the toggle was
   *  wired here. The continuous modes ignored the setting entirely
   *  until 2026-11-26: AyahWords had no tajweed prop at all, so the
   *  default Quran Text mode (and Translation) never showed any
   *  colours even with the toggle on. */
  tajweedOn?: boolean;
  /** WORD PLAY (2026-11-27): press and hold a word to hear just
   *  that word. The keys are the display word's engine keys — the
   *  parent resolves them onto the audio segment (see playWord). */
  onPlayWord?: (verseKey: string, page: number, keys: string[]) => void;
}) {
  const guard = useTapGuard();
  // WORD PLAY: a hold on a revealed word plays just that word. No
  // hold is attached while the verse is hidden (clickable === false)
  // — a hidden verse peeks on tap, never plays — and a hold on a red
  // mistake word plays the word instead of opening its tooltip (the
  // click that follows the hold is suppressed, see below).
  const longPress = useWordLongPress((verseKey, keys) => {
    if (clickable !== false) onPlayWord?.(verseKey, page, keys);
  });
  const words = verseDisplayWords(verse, script);
  // Align this ayah's display words to the tajweed text once per
  // render (same alignWords the Book reader uses, same caveat: in
  // Indo-Pak mode the alignment is against Uthmani tajweed text, so
  // some words fall back to black).
  const offsets = tajweedOn && tajweed ? alignWords(words.map((w) => w.text), tajweed) : words.map(() => -1);
  return (
    <>
      {words.map((w, i) => {
        const highlighted = w.keys.some((k) => highlightedWords?.has(k));
        const mistake = mistakes ? mistakeForKeys(w.keys, mistakes) : undefined;
        // A red word opens its tooltip on a real tap (the guard keeps
        // a swipe from firing it); hidden verses reveal instead. A
        // tap that follows a word long-press is suppressed — the hold
        // already played the word, so the tooltip must not open too.
        const wordTap =
          mistake && clickable !== false
            ? {
                onClick: (e: React.MouseEvent) => {
                  if (consumeWordLongPress()) return;
                  if (guard.ok(e)) {
                    onMistakeWordClick?.(mistake, (e.currentTarget as HTMLElement).getBoundingClientRect());
                  }
                },
              }
            : {};
        // WORD PLAY (2026-11-27): the hold binder for this word —
        // only on a revealed verse. The pointerdown merges with the
        // tap guard's (a red word records both); the other hold
        // handlers are the word's own.
        const lpBind = clickable !== false && onPlayWord ? longPress.bind(verse.verse_key, w.keys) : null;
        const off = offsets[i] ?? -1;
        // Tajweed colours (display only): coloured letter-runs inside
        // the word span, exactly like the Book reader — the green/red
        // highlight wash sits on the outer span, the tajweed colour
        // on the inner runs, so they never fight. Off (or no match):
        // plain black text, like a word with no tajweed match.
        const content =
          tajweedOn && tajweed && off >= 0 ? (
            colorizeWord(w.text, tajweed.plain, tajweed.segments, off).map((r, ri) => (
              <span key={ri} style={{ color: r.color }}>
                {r.text}
              </span>
            ))
          ) : (
            w.text
          );
        return (
          <span key={i}>
            <span
              id={w.keys[0] ? `word-${w.keys[0].replace(/:/g, '-')}` : undefined}
              className={`reader-word${mistake ? ' highlight-red mistake-word' : highlighted ? ' highlight-green' : ''}`}
              style={tajweedOn ? undefined : { color: TAJWEED_BLACK }}
              onPointerDown={(e) => {
                if (mistake && clickable !== false) guard.down(e);
                lpBind?.onPointerDown(e);
              }}
              onPointerMove={lpBind?.onPointerMove}
              onPointerUp={lpBind?.onPointerUp}
              onPointerCancel={lpBind?.onPointerCancel}
              onPointerLeave={lpBind?.onPointerLeave}
              onContextMenu={lpBind?.onContextMenu}
              {...wordTap}
            >
              {content}
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
 *  spoken words, for the test-mode mistake row — in the display
 *  script, so the row matches what is on screen. */
function versePeekInfo(v: MushafVerse, script: QuranScript = 'uthmani'): PeekInfo {
  const [sidStr, ayahStr] = v.verse_key.split(':');
  const snippet = v.words
    .filter((w) => w.char_type_name !== 'end')
    .slice(0, 3)
    .map((w) => (script === 'indopak' ? (w.text_indopak ?? w.text_uthmani ?? '') : (w.text_uthmani ?? '')))
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

/* ------------------------------------------------------------------ */
/*  WORD PLAY — LONG PRESS (2026-11-27).                               */
/*                                                                     */
/*  Gesture (chosen over double-tap and over a tap-to-show control):   */
/*  press and hold a word for 500ms. Double-tap was ruled out — the    */
/*  first tap already plays the ayah, so it would need a ~300ms delay  */
/*  on every ayah tap to wait for a second tap, degrading the shipped  */
/*  tap-to-play. A control that appears on tap was ruled out — a tap   */
/*  on a word already means "play this ayah", so the tap would both    */
/*  start the ayah and show a chip (or the chip would have to replace  */
/*  the ayah tap). Long-press is the standard mobile word action       */
/*  (dictionaries do this), costs no new UI, and conflicts with        */
/*  nothing: a quick tap still plays the ayah, a drag still scrolls    */
/*  (movement over 12px — the same threshold as the tap guard —        */
/*  cancels the hold), a hidden verse still peeks (no long-press is    */
/*  attached while hidden), rosettes are buttons, not word spans.      */
/*                                                                     */
/*  Suppression: the pointerup after a long-press still fires a        */
/*  click, which would bubble to the ayah tap handler and start the    */
/*  whole ayah as well. The fire marks a short suppression window      */
/*  (2.5s — the click follows the release by milliseconds; a hold      */
/*  longer than ~3s total is the only case that escapes it, and then   */
/*  the ayah simply plays, which is the pre-existing tap behaviour).   */
/*  Every ayah/word/tooltip click handler checks consume() first.      */
/*  The window also bounds the failure the other way: a flag left set  */
/*  by a long-press whose click never arrives (pointercancel,           */
/*  unmount) can eat at most one tap in the next 2.5s, never a later    */
/*  deliberate one.                                                    */
/* ------------------------------------------------------------------ */

/** Hold duration for a word long-press. */
export const WORD_LONG_PRESS_MS = 500;
/** Movement that cancels a hold — the tap guard's 12px. */
const WORD_LONG_PRESS_MOVE_PX = 12;

let wordLongPressSuppressUntil = 0;
/** A word long-press just fired: the click that follows the release
 *  must not ALSO fire the ayah tap / mistake tooltip. */
export function markWordLongPress() {
  wordLongPressSuppressUntil = Date.now() + 2500;
}
/** True once, for the click that follows a long-press (then clears). */
export function consumeWordLongPress(): boolean {
  if (Date.now() < wordLongPressSuppressUntil) {
    wordLongPressSuppressUntil = 0;
    return true;
  }
  return false;
}

/** Long-press binder for one word: hold ≥500ms without moving >12px
 *  → onLongPress(verseKey, keys); release sooner → nothing (the
 *  normal tap proceeds). Pointer events only, so no click delay is
 *  introduced and the tap guard still vets the click itself. The
 *  timer is per-AyahWords / per-page instance (one press at a time);
 *  the pointer id guards against a second finger cancelling the
 *  first hold. onContextMenu is swallowed so a hold never pops the
 *  browser's callout / selection menu over the word. */
export function useWordLongPress(onLongPress: (verseKey: string, keys: string[]) => void) {
  const press = useRef<{ id: number; x: number; y: number; timer: number | null } | null>(null);
  const cbRef = useRef(onLongPress);
  cbRef.current = onLongPress;
  useEffect(
    () => () => {
      if (press.current?.timer !== null && press.current?.timer !== undefined) window.clearTimeout(press.current.timer);
      press.current = null;
    },
    [],
  );
  const cancel = (e: React.PointerEvent) => {
    const p = press.current;
    if (p && p.id === e.pointerId && p.timer !== null) {
      window.clearTimeout(p.timer);
      p.timer = null;
    }
  };
  return {
    bind: (verseKey: string, keys: string[]) => ({
      onPointerDown: (e: React.PointerEvent) => {
        if (press.current?.timer !== null && press.current?.timer !== undefined) window.clearTimeout(press.current.timer);
        const timer = window.setTimeout(() => {
          press.current = null;
          markWordLongPress();
          cbRef.current(verseKey, keys);
        }, WORD_LONG_PRESS_MS);
        press.current = { id: e.pointerId, x: e.clientX, y: e.clientY, timer };
      },
      onPointerMove: (e: React.PointerEvent) => {
        const p = press.current;
        if (p && p.id === e.pointerId && p.timer !== null && Math.hypot(e.clientX - p.x, e.clientY - p.y) >= WORD_LONG_PRESS_MOVE_PX) {
          window.clearTimeout(p.timer);
          p.timer = null;
        }
      },
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onPointerLeave: cancel,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }),
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

function SurahIntro({ sid, arabicSize, script = 'uthmani' }: { sid: number; arabicSize?: number; script?: QuranScript }) {
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
          className={`${scriptFontClass(script)} mt-3 text-center leading-snug text-[#111827]`}
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
  script = 'uthmani',
  tajweedOn = true,
  onPlayFromVerse,
  onPlayWord,
}: {
  pages: { page: number; verses: MushafVerse[]; meta: ReaderPageData['meta']; tajweed?: Record<number, TajweedSurah> }[];
  textSize: number;
  onTextSizeChange: (n: number) => void;
  highlightedWords?: ReadonlySet<string>;
  mistakes?: ReadonlyMap<string, ReaderMistake>;
  onMistakeWordClick?: (mistake: ReaderMistake, rect: DOMRect) => void;
  hideVerses: boolean;
  revealed: ReadonlySet<string>;
  onReveal: (key: string, info?: PeekInfo) => void;
  /** Display script (Mushaf Type picker): the flowing text renders
   *  in the selected edition's script, like the Book reader. */
  script?: QuranScript;
  /** Show Tajweed Colors (the `tajweedColors` setting), from the
   *  parent — the continuous modes ignored it until 2026-11-26. */
  tajweedOn?: boolean;
  /** TAP TO PLAY (2026-11-27): tap an ayah to hear the recitation
   *  from there. The second arg is the mushaf page the ayah sits
   *  on, so the queue is fetched for the right page. */
  onPlayFromVerse?: (verseKey: string, page: number) => void;
  /** WORD PLAY (2026-11-27): press and hold a word to hear just
   *  that word. Passed through to AyahWords with the page. */
  onPlayWord?: (verseKey: string, page: number, keys: string[]) => void;
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
      {pages.map(({ page, verses, meta, tajweed }, pageIdx) => {
        const groups = groupBySurah(verses);
        return (
          <div key={page}>
            {groups.map((g) => {
              const first = !seenSurahs.has(g.sid);
              if (first) seenSurahs.add(g.sid);
              return (
                <div key={`${page}-${g.sid}`}>
                  {first && <SurahIntro sid={g.sid} arabicSize={textSize} script={script} />}
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
                    className={`${scriptFontClass(script)} text-justify leading-[2.1]`}
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
                          // TAP TO PLAY (2026-11-27): a revealed
                          // ayah plays from there on a real tap (the
                          // guard keeps a swipe from firing it). A
                          // hidden ayah still peeks, never plays.
                          // Excluded, via the target: rosette buttons
                          // and red mistake words — their own taps
                          // (tafsir sheet / tooltip) bubble up here.
                          // WORD PLAY: a tap that follows a word
                          // long-press is suppressed — the hold
                          // already played just that word.
                          onPointerDown={hidden ? guard.down : onPlayFromVerse ? guard.down : undefined}
                          onClick={
                            hidden
                              ? (e) => {
                                  if (guard.ok(e)) onReveal(key, versePeekInfo(v, script));
                                }
                              : onPlayFromVerse
                                ? (e) => {
                                    const t = e.target as HTMLElement;
                                    if (t.closest('button') || t.closest('.mistake-word')) return;
                                    if (consumeWordLongPress()) return;
                                    if (guard.ok(e)) onPlayFromVerse(v.verse_key, page);
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
                            page={page}
                            highlightedWords={highlightedWords}
                            mistakes={mistakes}
                            onMistakeWordClick={onMistakeWordClick}
                            clickable={!hidden}
                            script={script}
                            tajweed={tajweed?.[g.sid]?.ayahs[ayahNum] ?? null}
                            tajweedOn={tajweedOn}
                            onPlayWord={onPlayWord}
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
/*  Translation mode — Arabic + the selected translation, as ONE      */
/*  continuous vertical scroll (2026-11-26, Part 2). Like the Quran   */
/*  Text mode, the parent (ReaderScreen) owns the loaded page range   */
/*  and grows it as the user approaches either end; this component    */
/*  just renders the pages it is given, in order — no swipe track,    */
/*  no per-page columns. A surah split across two mushaf pages gets   */
/*  ONE header ornament (on its first appearance), and a subtle       */
/*  centred page number marks each page boundary.                     */
/* ------------------------------------------------------------------ */

/** One ayah in translation mode: the Arabic (blurs in Hide Verses
 *  mode; tap reveals), the rosette (opens the tafsir sheet), the
 *  cleaned translation (Part 1: footnote markers stripped) and the
 *  verse reference. The wrapper carries the data attributes the
 *  parent's scroll tracking reads — data-translation-ayah /
 *  data-surah / data-page / data-juz / data-hizb / data-verse-key —
 *  so the top pill, the bookmark and the mic/playback scope follow
 *  the scrolled position, the same contract ReaderContinuousText's
 *  ayah spans keep. */
function TranslationAyahBlock({
  verse,
  page,
  meta,
  translation,
  translationFailed,
  hideVerses,
  revealed,
  onReveal,
  highlightedWords,
  mistakes,
  onMistakeWordClick,
  onRosetteClick,
  script = 'uthmani',
  tajweed,
  tajweedOn = true,
  onPlayFromVerse,
  onPlayWord,
}: {
  verse: MushafVerse;
  page: number;
  meta: ReaderPageData['meta'];
  /** The cleaned translation text for this ayah (undefined while
   *  it is still loading). */
  translation?: string;
  translationFailed: boolean;
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
  /** An ayah-end rosette was tapped: open that verse's tafsir sheet. */
  onRosetteClick?: (verseKey: string) => void;
  /** Display script (Mushaf Type picker): the Arabic renders in the
   *  selected edition's script, like the Book reader. */
  script?: QuranScript;
  /** This ayah's parsed tajweed data — the Translation mode's
   *  Arabic ignored the `tajweedColors` setting until 2026-11-26,
   *  like Quran Text mode. */
  tajweed?: ParsedTajweedAyah | null;
  /** Show Tajweed Colors (the `tajweedColors` setting). */
  tajweedOn?: boolean;
  /** TAP TO PLAY (2026-11-27): tap the ayah (Arabic or its
   *  translation) to hear the recitation from there. The second
   *  arg is the mushaf page the ayah sits on. */
  onPlayFromVerse?: (verseKey: string, page: number) => void;
  /** WORD PLAY (2026-11-27): press and hold a word to hear just
   *  that word. Passed through to AyahWords with the page. */
  onPlayWord?: (verseKey: string, page: number, keys: string[]) => void;
}) {
  const guard = useTapGuard();
  const key = `V${verse.verse_key}`;
  const hidden = hideVerses && !revealed.has(key);
  const ayahNum = Number(verse.verse_key.split(':')[1]);
  const sid = Number(verse.verse_key.split(':')[0]);
  return (
    <div
      data-translation-ayah
      data-surah={sid}
      data-page={page}
      data-juz={verse.juz_number}
      data-hizb={verse.hizb_number ?? meta.hizb}
      data-verse-key={verse.verse_key}
      className="mb-5 border-b border-[#F0F0F0] pb-4"
      // TAP TO PLAY (2026-11-27): a revealed ayah plays from there
      // on a real tap (the guard keeps a scroll from firing it) —
      // Arabic or translation, both are the same ayah. A hidden
      // ayah still peeks, never plays. Excluded, via the target:
      // the rosette button (tafsir sheet) and red mistake words
      // (tooltip) — their own taps bubble up here. WORD PLAY: a
      // tap that follows a word long-press is suppressed — the hold
      // already played just that word.
      onPointerDown={!hidden && onPlayFromVerse ? guard.down : undefined}
      onClick={
        !hidden && onPlayFromVerse
          ? (e) => {
              const t = e.target as HTMLElement;
              if (t.closest('button') || t.closest('.mistake-word')) return;
              if (consumeWordLongPress()) return;
              if (guard.ok(e)) onPlayFromVerse(verse.verse_key, page);
            }
          : undefined
      }
    >
      {/* Arabic — blurs in Hide Verses mode; tap reveals. */}
      <div
        onPointerDown={hidden ? guard.down : undefined}
        onClick={
          hidden
            ? (e) => {
                if (guard.ok(e)) onReveal(key, versePeekInfo(verse, script));
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
          className={`${scriptFontClass(script)} text-right leading-[2]`}
          style={{ fontSize: '1.5rem', color: INK }}
        >
          <AyahWords
            verse={verse}
            page={page}
            highlightedWords={highlightedWords}
            mistakes={mistakes}
            onMistakeWordClick={onMistakeWordClick}
            clickable={!hidden}
            script={script}
            tajweed={tajweed}
            tajweedOn={tajweedOn}
            onPlayWord={onPlayWord}
          />{' '}
          {onRosetteClick ? (
            <button
              type="button"
              aria-label={`Tafsir for ${verse.verse_key}`}
              onPointerDown={guard.down}
              onClick={(e) => {
                if (guard.ok(e)) onRosetteClick(verse.verse_key);
              }}
              className="m-0 inline-flex items-center justify-center border-0 bg-transparent p-0 align-middle"
            >
              <ReaderRosette ayah={ayahNum} />
            </button>
          ) : (
            <ReaderRosette ayah={ayahNum} />
          )}
        </p>
      </div>
      {/* English translation — stays visible as the prompt. The v4
          text carries footnote markers as HTML
          (`<sup foot_note=…>1</sup>`, rendered literally before
          the Part 1 fix); cleanTranslationText strips the whole
          marker — tag and number — and nothing else. */}
      {translationFailed ? (
        <p dir="ltr" className="pt-2 text-[14px] leading-relaxed text-[#DC2626]">
          Could not load the translation for this surah.
        </p>
      ) : translation ? (
        <p dir="ltr" className="pt-2 text-[15px] leading-relaxed text-[#374151]">
          {cleanTranslationText(translation)}
        </p>
      ) : (
        <p dir="ltr" className="pt-2 text-[14px] leading-relaxed" style={{ color: MUTED }}>
          Loading translation…
        </p>
      )}
      <p dir="ltr" className="pt-1 text-[12px]" style={{ color: MUTED }}>
        {verse.verse_key}
      </p>
    </div>
  );
}

export function ReaderTranslationMode({
  pages,
  hideVerses,
  revealed,
  onReveal,
  highlightedWords,
  mistakes,
  onMistakeWordClick,
  translationId = KHATTAB_TRANSLATION_ID,
  onRosetteClick,
  script = 'uthmani',
  tajweedOn = true,
  onPlayFromVerse,
  onPlayWord,
}: {
  /** The loaded page range, in order — the parent grows it as the
   *  user scrolls (same shape ReaderContinuousText takes). */
  pages: { page: number; verses: MushafVerse[]; meta: ReaderPageData['meta']; tajweed?: Record<number, TajweedSurah> }[];
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
  /** The selected translation (Settings → Translations). Khattab
   *  (131) is the default — the mode showed Khattab before the
   *  picker existed. Any other id comes from Quran.com v4 through
   *  the same-origin proxy (cached a week by the service worker). */
  translationId?: number;
  /** An ayah-end rosette was tapped: open that verse's tafsir sheet. */
  onRosetteClick?: (verseKey: string) => void;
  /** Display script (Mushaf Type picker): the Arabic renders in the
   *  selected edition's script, like the Book reader. */
  script?: QuranScript;
  /** Show Tajweed Colors (the `tajweedColors` setting), from the
   *  parent — the Translation mode's Arabic ignored it until
   *  2026-11-26. */
  tajweedOn?: boolean;
  /** TAP TO PLAY (2026-11-27): tap an ayah to hear the recitation
   *  from there. Passed through to each TranslationAyahBlock. */
  onPlayFromVerse?: (verseKey: string, page: number) => void;
  /** WORD PLAY (2026-11-27): press and hold a word to hear just
   *  that word. Passed through to each TranslationAyahBlock. */
  onPlayWord?: (verseKey: string, page: number, keys: string[]) => void;
}) {
  // Keyed by `${surah}:${translationId}` so switching translations
  // never shows the previous translation's text.
  const [translations, setTranslations] = useState<Record<string, Record<number, string>>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const loadedRef = useRef<Record<string, boolean>>({});

  // Fetch the selected translation for each surah in the loaded
  // range, once per surah per translation. Khattab (131) is not a
  // v4 resource — it comes from its own route; every other id comes
  // from v4.
  useEffect(() => {
    for (const { verses } of pages) {
      for (const g of groupBySurah(verses)) {
        const sid = g.sid;
        const loadKey = `${sid}:${translationId}`;
        if (loadedRef.current[loadKey] || loading[sid] || translations[loadKey]) continue;
        loadedRef.current[loadKey] = true;
        setLoading((l) => ({ ...l, [sid]: true }));
        const url =
          translationId === KHATTAB_TRANSLATION_ID
            ? `/api/quran/khattab/${sid}`
            : `${API}/verses/by_chapter/${sid}?fields=text_uthmani&translations=${translationId}&per_page=all`;
        fetch(url)
          .then((r) => {
            if (!r.ok) throw new Error(`translation ${sid}: ${r.status}`);
            return r.json();
          })
          .then((d: { translations?: Record<number, string>; verses?: { verse_number?: number; translations?: { text?: string }[] }[] }) => {
            if (d.translations) {
              setTranslations((t) => ({ ...t, [loadKey]: d.translations ?? {} }));
            } else if (Array.isArray(d.verses)) {
              const map: Record<number, string> = {};
              for (const v of d.verses) {
                if (typeof v?.verse_number === 'number' && v.translations?.[0]?.text) {
                  map[v.verse_number] = v.translations[0].text;
                }
              }
              setTranslations((t) => ({ ...t, [loadKey]: map }));
            } else {
              throw new Error(`translation ${sid}: unexpected payload`);
            }
            setFailed((f) => ({ ...f, [sid]: false }));
          })
          .catch(() => {
            loadedRef.current[loadKey] = false;
            setFailed((f) => ({ ...f, [sid]: true }));
          })
          .finally(() => setLoading((l) => ({ ...l, [sid]: false })));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // `loading` is a dep on purpose: if the user switches translation
    // while a surah is still loading, the first fetch is skipped and
    // this re-runs when it finishes, so the new translation loads.
  }, [pages, translationId, loading]);

  // A surah split across two mushaf pages gets ONE header ornament
  // (on its first appearance) — same as ReaderContinuousText.
  const seenSurahs = new Set<number>();
  return (
    <div className="w-full px-1 pb-4">
      {pages.map(({ page, verses, meta, tajweed }, pageIdx) => {
        const groups = groupBySurah(verses);
        return (
          <div key={page}>
            {groups.map((g) => {
              const first = !seenSurahs.has(g.sid);
              if (first) seenSurahs.add(g.sid);
              return (
                <div key={`${page}-${g.sid}`}>
                  {/* Bismillah at the ayah text size (1.5rem) so the intro
                      matches the verses below it. */}
                  {first && <SurahIntro sid={g.sid} arabicSize={1.5} script={script} />}
                  {g.verses.map((v) => {
                    const ayahNum = Number(v.verse_key.split(':')[1]);
                    return (
                      <TranslationAyahBlock
                        key={v.verse_key}
                        verse={v}
                        page={page}
                        meta={meta}
                        translation={translations[`${g.sid}:${translationId}`]?.[ayahNum]}
                        translationFailed={failed[g.sid] === true}
                        hideVerses={hideVerses}
                        revealed={revealed}
                        onReveal={onReveal}
                        highlightedWords={highlightedWords}
                        mistakes={mistakes}
                        onMistakeWordClick={onMistakeWordClick}
                        onRosetteClick={onRosetteClick}
                        script={script}
                        tajweed={tajweed?.[g.sid]?.ayahs[ayahNum] ?? null}
                        tajweedOn={tajweedOn}
                        onPlayFromVerse={onPlayFromVerse}
                        onPlayWord={onPlayWord}
                      />
                    );
                  })}
                </div>
              );
            })}
            {/* Page boundary marker (not after the last loaded page):
                the number of the page that just ended, centred
                between hairlines — same as ReaderContinuousText. */}
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
      <p dir="ltr" className="pt-1 text-center text-[12px] leading-snug" style={{ color: MUTED }}>
        Translation: {translationName(translationId)}.
      </p>
    </div>
  );
}
