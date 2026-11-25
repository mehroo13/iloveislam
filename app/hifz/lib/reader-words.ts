// app/hifz/lib/reader-words.ts — word identity for Phase 3 highlighting.
//
// The reader's mic runs the Tilawa engine, whose WordRef is
// `surah:ayah:word` (1-based word index inside the ayah). The adapter
// (lib/tilawa) maps that ref to the caller's expected words via
// splitWords() on the joined non-end text_uthmani — so the engine's
// word list is the whitespace-split of that joined text, pause-mark
// tokens included (validated 2026-11-24 on real Alafasy audio for 2:2:
// the tracker locked onto the pause-mark tokens 'ۛ' at exactly the
// splitWords positions, so Tilawa counts them as words too).
//
// The page RENDERS words differently: cleanMushafUthmani() cleans each
// raw word, and pause-mark-only words merge into the previous display
// word. A display word can therefore cover TWO engine words (e.g.
// 'رَيْبَ ۛ' renders as one word 'رَيْبَۛ' but is engine tokens
// 'رَيْبَ' + 'ۛ'). This helper walks the raw words once and produces
// display entries carrying the engine word keys each covers, mirroring
// BOTH pipelines exactly — so a highlight lands on the word that was
// actually spoken, never a neighbour.
//
// Key scheme matches the coach's liveWords (`surah:ayah:word`,
// 1-based) so the two surfaces agree.

import { splitWords } from './alignment';
import {
  cleanMushafIndopak,
  cleanMushafUthmani,
  isPauseMarkOnly,
  type MushafVerse,
  type MushafWord,
} from './fetch';
import type { QuranScript } from '../../quran/lib';

/** Key for one engine word: `surah:ayah:word`, word 1-based inside the
 *  ayah — the same scheme as the coach's liveWords and the adapter's
 *  WordEvent.word. */
export function readerWordKey(surah: number, ayah: number, word: number): string {
  return `${surah}:${ayah}:${word}`;
}

/** One rendered word: its display text plus the engine word keys it
 *  covers (usually one; two when a pause mark rides inside the raw
 *  word, e.g. 'رَيْبَ ۛ'). Rosette entries (ayah-end ornaments) have
 *  no keys. */
export interface ReaderDisplayEntry {
  text: string;
  isEnd: boolean;
  verseKey: string;
  keys: string[];
}

/**
 * Build display entries for one ordered run of raw words (one Madani
 * line, or one whole ayah for the flowing views), carrying the engine
 * word keys each entry covers.
 *
 * `cursors` is the per-ayah engine-word cursor (0-based index to
 * continue from); it is advanced as words are consumed, so a caller
 * rendering one ayah across several lines passes the same map for
 * every line and the indices stay continuous. The map is mutated.
 *
 * Mirrors the display pipeline (clean + pause-mark-only merge into the
 * previous entry, same scope as the passed list) and the engine
 * tokenisation (splitWords on each raw word — equivalent to splitting
 * the joined text, since the join uses single spaces and the split
 * collapses whitespace). 'end' words pass through as rosette entries
 * with no keys and do not advance the cursor.
 *
 * SCRIPT (fourth refinement, 2026-11-25): `text` is the raw word in
 * the DISPLAY script; `keyText` (optional) is the same word in
 * Uthmani, used ONLY for the engine token count. The coach engine's
 * word list is built on Uthmani text, and Uthmani/Indo-Pak word
 * breaks differ, so counting tokens on Indo-Pak text could shift
 * every later highlight by one. Keys always count Uthmani tokens;
 * `clean` (default Uthmani) cleans the display text. */
export function displayEntriesForLine(
  words: { text: string; keyText?: string; isEnd: boolean; verseKey: string }[],
  cursors: Map<string, number>,
  clean: (text: string) => string = cleanMushafUthmani,
): ReaderDisplayEntry[] {
  const entries: ReaderDisplayEntry[] = [];
  for (const w of words) {
    if (w.isEnd) {
      entries.push({ text: w.text, isEnd: true, verseKey: w.verseKey, keys: [] });
      continue;
    }
    const [sidStr, ayahStr] = w.verseKey.split(':');
    const sid = Number(sidStr);
    const ayahNum = Number(ayahStr);
    const cursor = cursors.get(w.verseKey) ?? 0;
    const tokenCount = splitWords(w.keyText ?? w.text).length;
    const keys: string[] = [];
    for (let i = 0; i < tokenCount; i++) {
      keys.push(readerWordKey(sid, ayahNum, cursor + i + 1));
    }
    cursors.set(w.verseKey, cursor + tokenCount);
    const text = clean(w.text);
    if (!text) continue;
    if (isPauseMarkOnly(text) && entries.length > 0) {
      entries[entries.length - 1].text += text;
      entries[entries.length - 1].keys.push(...keys);
      continue;
    }
    entries.push({ text, isEnd: false, verseKey: w.verseKey, keys });
  }
  return entries;
}

/** Display words of one whole verse (flowing views): the same pipeline
 *  over the verse's words, so the merge scope is the ayah — exactly
 *  what versePlainText() did. 'end' words are skipped (no rosette
 *  here; the caller renders it separately).
 *
 *  SCRIPT: `script` selects the display text — 'indopak' renders the
 *  Indo-Pak word forms (cleaned with cleanMushafIndopak) while the
 *  engine keys still count Uthmani tokens (keyText), exactly as the
 *  Book reader does (displayEntriesForLine). So the mic's green
 *  highlighting and the red mistake marks land on the right word in
 *  either script. */
export function verseDisplayWords(
  verse: MushafVerse,
  script: QuranScript = 'uthmani',
): { text: string; keys: string[] }[] {
  const indopak = script === 'indopak';
  const entries = displayEntriesForLine(
    (verse.words ?? [])
      .filter((w) => w.char_type_name !== 'end')
      .map((w: MushafWord) => ({
        text: indopak ? (w.text_indopak ?? w.text_uthmani ?? '') : (w.text_uthmani ?? ''),
        keyText: w.text_uthmani ?? '',
        isEnd: false,
        verseKey: verse.verse_key,
      })),
    new Map(),
    indopak ? cleanMushafIndopak : cleanMushafUthmani,
  );
  return entries.map((e) => ({ text: e.text, keys: e.keys }));
}
