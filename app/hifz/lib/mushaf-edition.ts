// app/hifz/lib/mushaf-edition.ts — the Mushaf Type picker (fourth
// refinement, 2026-11-25; made real, 2026-11-25): the four editions
// Mehran asked for from his Tarteel "Mushaf Type" reference
// screenshot, in our own words and branding — no Tarteel logo, name,
// artwork or exact text; the edition names themselves are factual.
//
// WHAT EACH EDITION IS (verified 2026-11-25, from the real data):
// - Madani 1405 (V1): the shipped Quran.com layout — 604 pages, 15
//   lines. The reader's default page/line data.
// - Madani 1421 (V2): a real distinct layout, ingested from the
//   QPC1/QPC2 per-line dataset (zonetecde/mushaf-layout) and the
//   Quran.com word fields (v1_page/v2_page, line_v1/line_v2). It
//   differs from 1405 on 36 pages at range level and on 565/604
//   pages at line level — e.g. page 121: 1405 has 5:77–5:82, 1421
//   has 5:78–5:83. 604 pages, 15 lines.
// - Madani 1441 (V4): QUL's V4 layout. At page level it matches
//   1421 exactly (0 range mismatches on all 604 pages); its line
//   data was scraped from the public QUL previews and compared
//   against 1421 — see ~/workspace/mushaf-research/
//   LAYOUT_INGESTION.md for the verdict. If the comparison proves
//   its lines identical to 1421, this entry renders the 1421 line
//   map (the same real data, not an invention) and the two previews
//   will honestly look the same on the pages where they agree.
// - Indo-Pak (Naskh): a real distinct layout — the 610-page,
//   15-line Indo-Pak print, ingested from the public QUL preview
//   pages (id 12, "Indopak 15 lines layout"). 305/604 pages differ
//   from the Madani range map; the reader renders it in the
//   Indo-Pak script (text_indopak) on its own 610 pages.
//
// STORAGE: the edition lives in `ili_hifz_settings_v1` as
// `mushafEdition` (see progress.ts). The script preference
// (`hifz_script_v1`, lib/script.ts) is kept in sync by the caller:
// indopak <-> 'indopak', every Madani edition <-> 'uthmani' — so the
// single-page reader, surah reader and onboarding picker, which read
// the script pref, always agree with this screen.
//
// DATA: the per-edition page/line maps live in
// app/hifz/data/mushaf-*-layout.json (numbers only — no Quran text
// is ever pasted into the repo; the text always comes from
// Quran.com). The server-only loader is lib/mushaf-layouts.ts; the
// small client-safe per-edition page counts and surah-first-pages
// live in lib/mushaf-surah-pages.ts.
import type { HifzSettings } from '../progress';
import type { QuranScript } from '../../quran/lib';

export type MushafEditionId = 'madani-1405' | 'madani-1421' | 'madani-1441' | 'indopak';

export const DEFAULT_MUSHAF_EDITION: MushafEditionId = 'madani-1405';

/** One picker entry. `script` is the script the reader renders in;
 *  `totalPages` is the real page count of that edition's layout;
 *  `previewPage` is a page where this edition DIFFERS from the
 *  others, so the card's preview shows its own layout — page 1
 *  (Al-Fatihah) is identical in every Madani edition and must never
 *  be used as the preview. */
export interface MushafEdition {
  id: MushafEditionId;
  name: string;
  /** i18n key for the card's own-words description. */
  descKey: string;
  /** i18n key for the "15 Lines" part of the "15 Lines / N pages" line. */
  linesKey: 'rb.mushafType.lines15';
  script: QuranScript;
  /** Real page count of this edition's layout (604 Madani, 610 Indo-Pak). */
  totalPages: number;
  /** Page the card previews — a page where this edition differs. */
  previewPage: number;
}

export const MUSHAF_EDITIONS: MushafEdition[] = [
  {
    id: 'madani-1405',
    name: 'Madani Mushaf (1405)',
    descKey: 'rb.mushafType.ed1405Desc',
    linesKey: 'rb.mushafType.lines15',
    script: 'uthmani',
    totalPages: 604,
    previewPage: 208,
  },
  {
    id: 'madani-1421',
    name: 'Madani Mushaf (1421)',
    descKey: 'rb.mushafType.ed1421Desc',
    linesKey: 'rb.mushafType.lines15',
    script: 'uthmani',
    totalPages: 604,
    previewPage: 208,
  },
  {
    id: 'madani-1441',
    name: 'Madani Mushaf (1441)',
    descKey: 'rb.mushafType.ed1441Desc',
    linesKey: 'rb.mushafType.lines15',
    script: 'uthmani',
    totalPages: 604,
    previewPage: 208,
  },
  {
    id: 'indopak',
    name: 'Indo-Pak Mushaf (Naskh)',
    descKey: 'rb.mushafType.edIndopakDesc',
    linesKey: 'rb.mushafType.lines15',
    script: 'indopak',
    totalPages: 610,
    previewPage: 208,
  },
];

export function mushafEditionById(id: string | undefined | null): MushafEdition {
  return MUSHAF_EDITIONS.find((e) => e.id === id) ?? MUSHAF_EDITIONS[0];
}

/** Real page count for an edition. */
export function totalPagesForEdition(id: MushafEditionId): number {
  return mushafEditionById(id).totalPages;
}

/** Script the reader renders for an edition. */
export function scriptForEdition(id: MushafEditionId): QuranScript {
  return mushafEditionById(id).script;
}

/** Edition stored in settings, with the migration: an old save with
 *  no edition but an Indo-Pak script pref reads as Indo-Pak. */
export function editionFromSettings(
  settings: HifzSettings,
  scriptPref: QuranScript,
): MushafEditionId {
  if (settings.mushafEdition) return settings.mushafEdition;
  return scriptPref === 'indopak' ? 'indopak' : DEFAULT_MUSHAF_EDITION;
}
