// app/hifz/lib/search-jump.ts — shared "jump" parsing for the search
// surfaces (2026-11-26, features-8 audit S1–S4).
//
// The hub search box (/hifz/search) used to treat EVERY query as a word
// search, even though its placeholder advertises "Al-Baqarah, 2:255,
// pg 40" — so `1:4` returned 753 unrelated ayahs, `Al-Baqarah`
// returned nothing, and `pg 40` returned 3 unrelated ayahs. The
// reader overlay search (ReaderSearch) already parsed all of these
// correctly. This module is the one shared parser both surfaces use,
// so a query means the same thing everywhere:
//
//   "1:4" / "2:255"  → the ayah itself (validate against the surah's
//                       real ayah count; an out-of-range ayah is null)
//   "Al-Baqarah"     → the surah (English name, with or without
//                       "Al-", or Arabic name; partial matches return
//                       every match, first 8)
//   "pg 40" / "page 604" → the Mushaf page (1–604)
//   "juz 5" / "part 5"   → the Juz (1–30)
//   "67"             → surah 67 (1–114); "200" → page 200 (115–604)
//
// Anything else returns null and the caller falls back to word search.

import { ALL_SURAHS, getSurahById, type HifzSurah } from '../surahs';

export type SearchJump =
  | { kind: 'ayah'; surah: HifzSurah; ayah: number }
  | { kind: 'surahs'; surahs: HifzSurah[] }
  | { kind: 'page'; page: number }
  | { kind: 'juz'; juz: number };

/** A "S:A" reference, or null. */
export function parseRef(query: string): { surah: number; ayah: number } | null {
  const ref = query.trim().match(/^(\d{1,3})\s*:\s*(\d{1,3})$/);
  if (!ref) return null;
  return { surah: Number(ref[1]), ayah: Number(ref[2]) };
}

/** Normalise a surah-name query: lower-case, drop a leading "surah " /
 *  "surat " / "al-" so "Baqarah", "Al-Baqarah" and "Surah Al-Baqarah"
 *  all match the same surah. */
function normaliseSurahName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^surah\s+/, '')
    .replace(/^surat\s+/, '')
    .replace(/^al[-\s]/, '');
}

/** Surah-name matches (English or Arabic), first 8, or [] . */
export function matchSurahsByName(query: string): HifzSurah[] {
  const lower = query.trim().toLowerCase();
  const norm = normaliseSurahName(query);
  if (!lower) return [];
  return ALL_SURAHS.filter((s) => {
    if (s.arabic.includes(query.trim())) return true;
    const nameLower = s.name.toLowerCase();
    if (nameLower.includes(lower)) return true;
    if (norm.length >= 3 && normaliseSurahName(s.name).includes(norm)) return true;
    return false;
  }).slice(0, 8);
}

/** Parse a jump query. Returns null when the query is not a jump
 *  (the caller then runs a word search). */
export function parseSearchJump(raw: string): SearchJump | null {
  const query = raw.trim();
  if (!query) return null;
  const lower = query.toLowerCase();

  // Ayah reference "S:A" — only when the ayah really exists.
  const ref = parseRef(query);
  if (ref) {
    const s = getSurahById(ref.surah);
    if (s && ref.ayah >= 1 && ref.ayah <= s.ayahCount) {
      return { kind: 'ayah', surah: s, ayah: ref.ayah };
    }
    return null;
  }

  // Page: "pg 62" / "page 62".
  const pg = lower.match(/^(?:pg|page)\s*(\d{1,3})$/);
  if (pg) {
    const n = Number(pg[1]);
    if (n >= 1 && n <= 604) return { kind: 'page', page: n };
    return null;
  }

  // Juz: "juz 5" / "part 5".
  const juz = lower.match(/^(?:juz|part)\s*(\d{1,2})$/);
  if (juz) {
    const n = Number(juz[1]);
    if (n >= 1 && n <= 30) return { kind: 'juz', juz: n };
    return null;
  }

  // Bare number: a surah number (1–114), else a mushaf page (115–604).
  if (/^\d{1,3}$/.test(query)) {
    const n = Number(query);
    if (n >= 1 && n <= 114) {
      const s = getSurahById(n);
      if (s) return { kind: 'surahs', surahs: [s] };
    }
    if (n >= 1 && n <= 604) return { kind: 'page', page: n };
    return null;
  }

  // Surah name — English or Arabic.
  const matches = matchSurahsByName(query);
  if (matches.length > 0) return { kind: 'surahs', surahs: matches };
  return null;
}
