// app/hifz/lib/reader-mistakes.ts — Phase 5: mistake identity for the
// reader.
//
// One mistake = one expected word the Tilawa checker confirmed as
// wrong (`wrong_word`) or missed (`omitted_word` / `skipped_passage`),
// or a word the final result marks 'wrong' / 'missed' because the
// reciter demonstrably went past it. The key is the engine word key
// `surah:ayah:word` (1-based), the same scheme as Phase 3
// highlighting — so a mistake paints exactly the word it is about,
// never a neighbour.
//
// HONESTY: Tilawa is a tracker, not a transcriber. It knows the
// expected word and that the user said something else (or skipped
// it), but it cannot supply the actual spoken word — the adapter
// never populates `heard` (lib/tilawa.ts). The UI therefore NEVER
// shows an invented "you said X": a wrong word says "something
// else", a missed word says "skipped". Only a real transcription
// engine (the pending FastConformer Tashkeel pass) can supply the
// spoken words, and it is not wired up — see the header of
// ReaderScreen's mistake handling.

/** The two word-level mistake kinds the Tilawa checker can confirm. */
export type ReaderMistakeType = 'wrong' | 'missed';

export interface ReaderMistake {
  /** Engine word key `surah:ayah:word` (1-based word in the ayah). */
  key: string;
  surah: number;
  ayah: number;
  /** 1-based word index inside the ayah. */
  word: number;
  /** Display form of the EXPECTED word (Uthmani, as rendered). */
  display: string;
  type: ReaderMistakeType;
}

/** Badge text for a mistake kind. */
export function mistakeTypeLabel(type: ReaderMistakeType): string {
  return type === 'wrong' ? 'Wrong word' : 'Skipped word';
}

/** The mistake covering a display word, if any. A display word can
 *  cover two engine keys (base word + an attached pause mark, e.g.
 *  2:2 'رَيْبَ ۛ') — a mistake on either key marks the word. */
export function mistakeForKeys(
  keys: string[],
  mistakes: ReadonlyMap<string, ReaderMistake>,
): ReaderMistake | undefined {
  for (const k of keys) {
    const m = mistakes.get(k);
    if (m) return m;
  }
  return undefined;
}
