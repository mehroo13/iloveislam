// app/hifz/components/ResumeWriter.tsx — CLIENT: record the reader
// resume position for a surah or Juz the user just opened.
//
// The home reader (`/`) restores `ili_mushaf_reader_pos_v1` on reopen.
// Only the readers themselves wrote that key — a surah or Juz page
// opened from the hub lists only wrote `ili_last_read_v1`, which the
// reader never reads for its restore. So opening An-Nas (or Juz 30)
// and then closing the app reopened on the OLD reader spot (Al-Fatihah)
// instead of what was just opened (seen live 2026-11-28). Rendering
// this (it renders nothing) on a surah/Juz page records that surah's
// (or Juz's) first page + first ayah in the user's current edition,
// so reopening lands there.
'use client';

import { useEffect } from 'react';
import { writeReaderSavedPos } from '../lib/reader-position';
import { editionFromSettings, totalPagesForEdition } from '../lib/mushaf-edition';
import { surahFirstPageForEdition, juzFirstPageForEdition } from '../lib/mushaf-surah-pages';
import { loadSettings } from '../progress';
import { getScriptPref } from '../lib/script';

export default function ResumeWriter({
  surahId,
  juz,
  ayah,
}: {
  /** Surah just opened (1–114): resume at its first page + first ayah. */
  surahId?: number;
  /** Juz just opened (1–30): resume at its first page + first ayah. */
  juz?: number;
  /** First ayah of the surah/Juz, as "surah:ayah" (e.g. "114:1", "2:142"). */
  ayah: string;
}) {
  useEffect(() => {
    try {
      const ed = editionFromSettings(loadSettings(), getScriptPref());
      const page =
        surahId !== undefined
          ? surahFirstPageForEdition(ed)[surahId] ?? 1
          : juz !== undefined
            ? juzFirstPageForEdition(ed)[juz] ?? 1
            : 1;
      writeReaderSavedPos({
        page: Math.min(totalPagesForEdition(ed), Math.max(1, page)),
        mode: 'continuous',
        zoom: 1,
        frac: 0,
        edition: ed,
        ayah,
      });
    } catch {
      /* storage unavailable — reading still works */
    }
  }, [surahId, juz, ayah]);
  return null;
}
