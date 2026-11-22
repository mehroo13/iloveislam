// app/hifz/lib/bookmarks.ts — the bookmarks store (Stage 5, §6).
//
// One key, 'quran_bookmarks_v2', already shared by the surah reader, the
// ayah page and the old Quran reader. This module is the single owner of
// its shape from here on; the older writers only ever wrote ayah entries,
// which load here unchanged.
//
// SHAPE (backward compatible — entries written before Stage 5 have no
// `kind` and no `note`, and read as ayah bookmarks):
//   { kind: 'ayah', surahNumber, verseNumber, surahName?, note?, addedAt? }
//   { kind: 'page', page, note?, addedAt? }          (Mushaf page bookmark)
// `note` is a free-text note the user adds on the bookmarks page.
// `addedAt` is an epoch-ms timestamp (older entries used `timestamp`).
// Nothing here touches the network; everything is on-device.

export const BOOKMARKS_KEY = 'quran_bookmarks_v2';

export interface BookmarkEntry {
  kind: 'ayah' | 'page';
  /** Ayah bookmarks: surah number (1–114). */
  surahNumber?: number;
  /** Ayah bookmarks: ayah number within the surah. */
  verseNumber?: number;
  /** Ayah bookmarks: surah display name, cached at save time. */
  surahName?: string;
  /** Mushaf page bookmarks: page number (1–604). */
  page?: number;
  /** Free-text note, added on the bookmarks page. */
  note?: string;
  /** Epoch-ms when the bookmark was added. */
  addedAt?: number;
}

/** Raw stored row (any shape the older writers produced). */
type RawBookmark = Record<string, unknown>;

function normalise(raw: RawBookmark): BookmarkEntry | null {
  if (raw.kind === 'page') {
    const page = Number(raw.page);
    if (!Number.isInteger(page) || page < 1 || page > 604) return null;
    return {
      kind: 'page',
      page,
      ...(typeof raw.note === 'string' && raw.note ? { note: raw.note } : {}),
      addedAt: Number(raw.addedAt ?? raw.timestamp ?? Date.now()) || Date.now(),
    };
  }
  // Ayah bookmark (kind 'ayah' or absent — the pre-Stage-5 shape).
  const surahNumber = Number(raw.surahNumber ?? raw.surah);
  const verseNumber = Number(raw.verseNumber ?? raw.ayah);
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) return null;
  if (!Number.isInteger(verseNumber) || verseNumber < 1) return null;
  return {
    kind: 'ayah',
    surahNumber,
    verseNumber,
    ...(typeof raw.surahName === 'string' && raw.surahName ? { surahName: raw.surahName } : {}),
    ...(typeof raw.note === 'string' && raw.note ? { note: raw.note } : {}),
    addedAt: Number(raw.addedAt ?? raw.timestamp ?? Date.now()) || Date.now(),
  };
}

export function loadBookmarks(): BookmarkEntry[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: BookmarkEntry[] = [];
    for (const row of parsed as RawBookmark[]) {
      if (typeof row !== 'object' || row === null) continue;
      const b = normalise(row);
      if (b) out.push(b);
    }
    return out;
  } catch {
    return [];
  }
}

export function saveBookmarks(list: BookmarkEntry[]): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

/** Loose structural check for imported bookmark lists (import must not crash on junk). */
export function isValidBookmarks(value: unknown): value is BookmarkEntry[] {
  if (!Array.isArray(value)) return false;
  return value.every((row) => {
    if (typeof row !== 'object' || row === null) return false;
    return normalise(row as RawBookmark) !== null;
  });
}

export function normaliseBookmarks(value: unknown): BookmarkEntry[] {
  if (!Array.isArray(value)) return [];
  const out: BookmarkEntry[] = [];
  for (const row of value as RawBookmark[]) {
    if (typeof row !== 'object' || row === null) continue;
    const b = normalise(row);
    if (b) out.push(b);
  }
  return out;
}

export function bookmarkKey(b: BookmarkEntry): string {
  return b.kind === 'page' ? `page:${b.page}` : `ayah:${b.surahNumber}:${b.verseNumber}`;
}
