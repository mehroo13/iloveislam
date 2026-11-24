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
// Phase 6 (Testing Mode): a peek — tapping a blurred line/verse to
// reveal it during a test take — is also a mistake, kind `peek`.
// Its key is `peek:L{page}:{line}` (Madani page) or `peek:V{surah}:{ayah}`
// (text/translation views), `word` is 0 (a whole verse/line, not one
// word), and `display` is the first few words of the peeked text. A
// peek key never matches a word span, so it never paints a word red;
// it only shows in the Mistakes modal, the live count, the final
// score, and the saved session.
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

/** The mistake kinds: word-level (Tilawa checker) + test-mode peek. */
export type ReaderMistakeType = 'wrong' | 'missed' | 'peek';

export interface ReaderMistake {
  /** Engine word key `surah:ayah:word` (1-based word in the ayah),
   *  or a peek key `peek:L{page}:{line}` / `peek:V{surah}:{ayah}`. */
  key: string;
  surah: number;
  ayah: number;
  /** 1-based word index inside the ayah; 0 for a peek (whole
   *  verse/line, not a single word). */
  word: number;
  /** Display form of the EXPECTED word (Uthmani, as rendered) — or,
   *  for a peek, the first few words of the peeked text. */
  display: string;
  type: ReaderMistakeType;
}

/** Info about a peeked line/verse, passed up from the page renderer
 *  so the reader can log the peek in the test-mode mistake list. */
export interface PeekInfo {
  surah: number;
  ayah: number;
  /** First few words of the peeked text, for the mistake row. */
  display: string;
}

/** Badge text for a mistake kind. */
export function mistakeTypeLabel(type: ReaderMistakeType): string {
  if (type === 'peek') return 'Peeked';
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
