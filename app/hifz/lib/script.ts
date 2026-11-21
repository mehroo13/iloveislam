// app/hifz/lib/script.ts — Quran script preference (spec §13 #16, §15.7).
//
// Two scripts, one rule:
//   - READER (surah page, ayah page, juz pages): the user's script —
//     Indo-Pak (default) or Madani / Uthmani (Quran.com v4 text_uthmani).
//     The reader fetches BOTH fields so switching scripts needs no refetch.
//   - COACH (RecitationCoach, Test Mode, Word-by-word): ALWAYS Indo-Pak.
//     The coach's word alignment (app/hifz/lib/alignment.ts, splitWords)
//     and the Tilawa tracker's word positions are built on the Indo-Pak
//     text: Uthmani word breaks differ (e.g. merged words, different
//     forms), so aligning the engine against Uthmani text would mis-mark
//     words. The coach shows a one-line note when Madani is selected in
//     the reader, so the difference is visible, never silent.
//
// Preference lives in localStorage (hifz_script_v1) so it survives reloads
// and applies on every reader page.
import { useEffect, useState } from 'react';
import type { QuranScript } from '../../quran/lib';

export type { QuranScript };

const SCRIPT_KEY = 'hifz_script_v1';

export const SCRIPT_LABELS: Record<QuranScript, string> = {
  indopak: 'Indo-Pak',
  uthmani: 'Madani (Uthmani)',
};

/** Quran.com v4 fields string that fetches both scripts at once. */
export const BOTH_SCRIPT_FIELDS = 'text_indopak,text_uthmani';

export function getScriptPref(): QuranScript {
  try {
    if (typeof window === 'undefined') return 'indopak';
    return window.localStorage.getItem(SCRIPT_KEY) === 'uthmani' ? 'uthmani' : 'indopak';
  } catch {
    return 'indopak';
  }
}

export function setScriptPref(script: QuranScript): void {
  try {
    window.localStorage.setItem(SCRIPT_KEY, script);
  } catch {
    /* storage unavailable — the choice just doesn't persist */
  }
}

/** React hook for the reader pages: script state, persisted. */
export function useScriptPref(): [QuranScript, (s: QuranScript) => void] {
  const [script, setScript] = useState<QuranScript>('indopak');
  useEffect(() => {
    setScript(getScriptPref());
  }, []);
  const change = (s: QuranScript) => {
    setScript(s);
    setScriptPref(s);
  };
  return [script, change];
}
