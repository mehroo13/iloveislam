// app/hifz/lib/reader-position.ts — the shared reader position key.
//
// RESUME FIX (2026-11-26, Mehran: closing the tool must return to the
// same position): the landing-page reader (`/`, ReaderScreen) never
// saved or restored position at all — every fresh open was page 1 —
// while the continuous Mushaf reader (`/hifz/mushaf`, MushafReader)
// has persisted `{page, mode, zoom, frac}` under this key since
// 2026-11-25. The landing reader now reads and writes the SAME key,
// so the two readers agree on where the user is.
//
// SHAPE (backward-compatible with what MushafReader writes): the four
// original fields keep their meaning; the three extra fields are
// optional and ignored by MushafReader's reader (it rebuilds the
// object picking only the fields it knows). A position written by
// MushafReader (no layout/edition/ayah) still restores here — the
// layout falls back to the stored layout pref, the edition to the
// settings doc, the ayah to the top of the page.
//   page    — mushaf page number (1..604 Madani, 1..610 Indo-Pak)
//   mode    — MushafReader's mode: 'page' = its own page-by-page
//             view, 'continuous' = Quran Text or Translation (kept
//             so a spot saved here still restores there, and vice
//             versa). The landing reader has no Book layout any more
//             (removed 2026-11-28), so a saved 'page' mode now
//             restores into Quran Text.
//   zoom    — MushafReader's zoom; the landing reader has none, so
//             it writes 1
//   frac    — scroll fraction within the page on /hifz/mushaf; the
//             landing reader writes 0 — the ayah below is its
//             within-page position instead
//   layout  — the landing reader's layout ('text' |
//             'translation'); wins over `mode` when present. A stored
//             'book' is dropped (Book layout removed 2026-11-28) and
//             falls back to Quran Text.
//   edition — the print edition the page number belongs to
//             ('madani-1405' | 'madani-1421' | 'madani-1441' |
//             'indopak'); a page number means different content per
//             edition, so restoring without it could land on the
//             wrong text
//   ayah    — verse_key ("surah:ayah") of the topmost visible ayah
//             in a continuous mode; the restore scrolls it to the
//             top of the viewport, so reopening lands mid-page
//             exactly, not just at the page top. Null in Book mode
//             (the whole page is always in view).

import type { MushafEditionId } from './mushaf-edition';
import type { ReaderLayoutMode } from './layout-mode';

export const READER_POS_KEY = 'ili_mushaf_reader_pos_v1';

export type ReaderPosMode = 'continuous' | 'page';

export interface ReaderSavedPos {
  page: number;
  mode: ReaderPosMode;
  zoom: number;
  frac: number;
  layout?: ReaderLayoutMode;
  edition?: MushafEditionId;
  ayah?: string | null;
}

const EDITIONS: readonly string[] = ['madani-1405', 'madani-1421', 'madani-1441', 'indopak'];
const LAYOUTS: readonly string[] = ['text', 'translation'];
const AYAH_RE = /^\d+:\d+$/;

function clampPage(n: number, totalPages: number): number {
  return Math.min(totalPages, Math.max(1, Math.round(n) || 1));
}

/** Read the stored position, or null when there is none / it is
 *  unusable. `totalPages` is the current edition's page count —
 *  callers restoring into a different edition clamp against that
 *  edition's count instead. */
export function readReaderSavedPos(totalPages = 604): ReaderSavedPos | null {
  try {
    const raw = window.localStorage.getItem(READER_POS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<ReaderSavedPos>;
    if (typeof p.page !== 'number') return null;
    const pos: ReaderSavedPos = {
      page: clampPage(p.page, totalPages),
      mode: p.mode === 'page' ? 'page' : 'continuous',
      zoom: typeof p.zoom === 'number' ? Math.min(4, Math.max(0.5, p.zoom)) : 1,
      frac: typeof p.frac === 'number' ? Math.min(1, Math.max(0, p.frac)) : 0,
    };
    if (typeof p.layout === 'string' && LAYOUTS.includes(p.layout)) {
      pos.layout = p.layout as ReaderLayoutMode;
    }
    if (typeof p.edition === 'string' && EDITIONS.includes(p.edition)) {
      pos.edition = p.edition as MushafEditionId;
    }
    if (typeof p.ayah === 'string' && AYAH_RE.test(p.ayah)) pos.ayah = p.ayah;
    else if (p.ayah === null) pos.ayah = null;
    return pos;
  } catch {
    return null;
  }
}

/** Write a position. Returns the raw string written (callers keep
 *  it for the pagehide ownership guard — see MushafReader). */
export function writeReaderSavedPos(pos: ReaderSavedPos): string | null {
  try {
    const raw = JSON.stringify(pos);
    window.localStorage.setItem(READER_POS_KEY, raw);
    return raw;
  } catch {
    return null;
  }
}
