// app/hifz/lib/mushaf-edition.ts — the Mushaf Type picker (fourth
// refinement, 2026-11-25): the four editions Mehran asked for from his
// Tarteel "Mushaf Type" reference screenshot, in our own words and
// branding — no Tarteel logo, name, artwork or exact text; the
// edition names themselves are factual.
//
// HONESTY — WHAT WAS VERIFIED (2026-11-25, before building):
// - Quran Foundation's public mushaf catalogue (api-docs.quran.com,
//   Page Layout guide) lists NO distinct 1405 / 1421 / 1441 line
//   layouts. Its mushaf IDs are font/script variants of one 604-page
//   Madani layout: 1 QCF V2, 2 QCF V1, 3 IndoPak (604), 4 Uthmani
//   Hafs, 5 KFGQPC Hafs, 6 IndoPak 15-line (610 pages), 7 IndoPak
//   16-line (548), 11 Tajweed, 19 QCF Tajweed V4. The Foundation API
//   also needs an API key (x-auth-token + x-client-id) the project
//   does not have.
// - The legacy public api.quran.com IGNORES its `mushaf` parameter:
//   by_page/44 returns 2:260–2:264 for mushaf=1, 5 and 6 alike, even
//   though the IndoPak 15-line layout puts 2:255 on page 44. So no
//   public source the app can call supplies distinct 1421/1441 (or
//   610-page Indo-Pak) line data.
// - THEREFORE: 1421 and 1441 are offered as real, persisted choices
//   that keep the closest real layout — the Madani (1405) one — with
//   that note visible on the card and in the reader. Nothing is
//   faked: no line data is invented, and the preview on those cards
//   is the real page-1 render of the layout the reader will show.
//   The day verified 1421/1441 line data exists, those two entries
//   are the only place that changes (dataSource + script/line map).
// - Indo-Pak is REAL: the app's existing Indo-Pak script rendering
//   (Quran.com text_indopak, 604-page Madani line breaks). It is NOT
//   the 610-page Indo-Pak print layout — the card says so plainly.
//
// STORAGE: the edition lives in `ili_hifz_settings_v1` as
// `mushafEdition` (see progress.ts). The script preference
// (`hifz_script_v1`, lib/script.ts) is kept in sync by the caller:
// indopak <-> 'indopak', every Madani edition <-> 'uthmani' — so the
// single-page reader, surah reader and onboarding picker, which read
// the script pref, always agree with this screen.
import type { HifzSettings } from '../progress';
import type { QuranScript } from '../../quran/lib';

export type MushafEditionId = 'madani-1405' | 'madani-1421' | 'madani-1441' | 'indopak';

export const DEFAULT_MUSHAF_EDITION: MushafEditionId = 'madani-1405';

/** One picker entry. `script` is the script the reader renders in;
 *  `honestNoteKey` (an i18n key) is shown on the card whenever the
 *  edition's own distinct line data is not available yet. */
export interface MushafEdition {
  id: MushafEditionId;
  name: string;
  /** i18n key for the card's own-words description. */
  descKey: string;
  /** i18n key for the "15 Lines / 604 pages" line. */
  linesKey: 'rb.mushafType.lines15';
  script: QuranScript;
  /** True when selecting this edition changes the reader's layout
   *  for real (1405: the shipped layout; indopak: the script). */
  realLayout: boolean;
  /** i18n key for the honest note, or null when no note is needed. */
  honestNoteKey: string | null;
}

export const MUSHAF_EDITIONS: MushafEdition[] = [
  {
    id: 'madani-1405',
    name: 'Madani Mushaf (1405)',
    descKey: 'rb.mushafType.ed1405Desc',
    linesKey: 'rb.mushafType.lines15',
    script: 'uthmani',
    realLayout: true,
    honestNoteKey: null,
  },
  {
    id: 'madani-1421',
    name: 'Madani Mushaf (1421)',
    descKey: 'rb.mushafType.ed1421Desc',
    linesKey: 'rb.mushafType.lines15',
    script: 'uthmani',
    realLayout: false,
    honestNoteKey: 'rb.mushafType.ed1421Note',
  },
  {
    id: 'madani-1441',
    name: 'Madani Mushaf (1441)',
    descKey: 'rb.mushafType.ed1441Desc',
    linesKey: 'rb.mushafType.lines15',
    script: 'uthmani',
    realLayout: false,
    honestNoteKey: 'rb.mushafType.ed1441Note',
  },
  {
    id: 'indopak',
    name: 'Indo-Pak Mushaf (Naskh)',
    descKey: 'rb.mushafType.edIndopakDesc',
    linesKey: 'rb.mushafType.lines15',
    script: 'indopak',
    realLayout: true,
    honestNoteKey: 'rb.mushafType.edIndopakNote',
  },
];

export function mushafEditionById(id: string | undefined | null): MushafEdition {
  return MUSHAF_EDITIONS.find((e) => e.id === id) ?? MUSHAF_EDITIONS[0];
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
