// app/hifz/lib/mode.ts — the shared practice-mode layer (Stage 4).
//
// One mode vocabulary for the whole Hifz app, plus the floating mode
// switcher's cross-component handoff and the test-session history store.
//
// MODES
//   reading    — plain reading, nothing hidden, no audio, no mic.
//   recite     — the RecitationCoach is open (mic follow-along).
//   listen     — reciter audio is playing (play-all / repeat / range).
//   memorise   — text hidden; recite from memory, peek on demand.
//   test       — Test Mode (/hifz/test).
//
// HANDOFF — how the floating switcher talks to the page underneath it:
// the switcher dispatches a cancelable `hifz:set-mode` CustomEvent on
// window with `{ mode }` in the detail. A page that can apply the mode
// in place (surah reader, ayah page, mushaf pages) calls
// `event.preventDefault()` and applies it; if nobody prevents the
// default, the switcher navigates instead (last-read surah with
// ?mode=…, or /hifz/test for Test). This keeps the switcher working on
// every /hifz/* route without it having to know which page is mounted.
// The current mode is persisted in localStorage so the switcher can
// show it on any page and the reader pages can restore it on load.
//
// SWITCHING CLEANLY — the rule from Stage 3: never abandon a live mic
// session or playing audio invisibly. Pages that handle a mode change
// must stop the previous mode first: closing the coach unmounts
// RecitationCoach, whose unmount cleanup aborts the live Tilawa session
// and stops its audio; SurahClient's stopListen() pauses both <audio>
// elements and clears the queue. The switcher itself never touches the
// mic or audio — it only asks the page to switch.
//
// PEEK RECORDING — a peek (revealing a hidden word/ayah) is recorded as
// help-needed for that ayah via markAttempt(…, 'peek'): the ayah's
// correct streak resets to 0 and it joins the revision queue. One peek
// per ayah per page-view is recorded, however many words are peeked —
// peeking five words of one ayah is one missed ayah, not five.
// `ayahKeyForRevealedWord` maps a mushaf page's revealed-word index back
// to its ayah by replaying MushafPageFrame's display loop exactly
// (lines grouped by line_number, pause-mark-only words merged into the
// previous word, ayah-end rosettes counted as display entries) — the
// same globalIdx the frame assigns, so the peek lands on the right ayah.
'use client';

import { cleanMushafIndopak, cleanMushafUthmani, isPauseMarkOnly, type MushafVerse } from './fetch';

export type HifzMode = 'reading' | 'recite' | 'listen' | 'memorise' | 'test';

export const MODE_EVENT = 'hifz:set-mode';
export const MODE_KEY = 'ili_hifz_mode_v1';
export const LAST_READ_KEY = 'ili_last_read_v1';
/** Last Listen position, so a return visit can resume where it stopped. */
export const LISTEN_POS_KEY = 'ili_hifz_listen_pos_v1';
/** Completed test sessions (device-local history, newest first). */
export const TEST_SESSIONS_KEY = 'ili_hifz_test_sessions_v1';

export const MODE_LABELS: Record<HifzMode, string> = {
  reading: 'Reading',
  recite: 'Recite',
  listen: 'Listen',
  memorise: 'Memorise',
  test: 'Test',
};

/** Short one-line description per mode, shown in the switcher panel. */
export const MODE_DESCRIPTIONS: Record<HifzMode, string> = {
  reading: 'Read the surah with translation and tafsir.',
  recite: 'Recite into the mic — the coach follows you word by word.',
  listen: 'Play the reciter, ayah by ayah, with repeat and speed.',
  memorise: 'Hide the words and recite from memory, peeking when stuck.',
  test: 'A teacher-style test from your memorised range.',
};

export function loadMode(): HifzMode {
  try {
    const raw = localStorage.getItem(MODE_KEY);
    if (raw === 'reading' || raw === 'recite' || raw === 'listen' || raw === 'memorise' || raw === 'test') return raw;
  } catch {
    /* storage unavailable — default */
  }
  return 'reading';
}

export function saveMode(mode: HifzMode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}

/** Last-read surah slug, for mode-switch navigation. Defaults to Al-Fatihah. */
export function lastReadSlug(): string {
  try {
    const raw = localStorage.getItem(LAST_READ_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { slug?: string };
      if (parsed.slug) return parsed.slug;
    }
  } catch {
    /* ignore */
  }
  return 'al-fatihah';
}

/** Ask the mounted page to switch mode. Returns true if a page handled
 *  it in place (preventDefault), false if the caller should navigate. */
export function requestMode(mode: HifzMode): boolean {
  saveMode(mode);
  const ev = new CustomEvent<{ mode: HifzMode }>(MODE_EVENT, {
    detail: { mode },
    cancelable: true,
  });
  window.dispatchEvent(ev);
  return ev.defaultPrevented;
}

/** Listen position: the surah + ayah Listen last played. */
export function loadListenPosition(): { surah: number; ayah: number } | null {
  try {
    const raw = localStorage.getItem(LISTEN_POS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { surah?: number; ayah?: number };
    if (typeof parsed.surah === 'number' && typeof parsed.ayah === 'number') {
      return { surah: parsed.surah, ayah: parsed.ayah };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveListenPosition(surah: number, ayah: number): void {
  try {
    localStorage.setItem(LISTEN_POS_KEY, JSON.stringify({ surah, ayah }));
  } catch {
    /* ignore */
  }
}

/** Which ayah does the mushaf page's revealed word at `globalIdx` belong
 *  to? Replays MushafPageFrame's display loop exactly (see the module
 *  header) so the index lines up with what the frame rendered. Returns
 *  `{ surah, ayah }`, or null when the index is out of range. */
export function ayahKeyForRevealedWord(
  verses: MushafVerse[],
  script: 'uthmani' | 'indopak',
  globalIdx: number,
): { surah: number; ayah: number } | null {
  const lines = new Map<number, { verseKey: string; text: string; charType: string }[]>();
  for (const v of verses) {
    for (const w of v.words ?? []) {
      const arr = lines.get(w.line_number) ?? [];
      arr.push({
        verseKey: v.verse_key,
        text: script === 'uthmani' ? w.text_uthmani : (w.text_indopak ?? w.text_uthmani),
        charType: w.char_type_name,
      });
      lines.set(w.line_number, arr);
    }
  }
  let idx = 0;
  for (const lineNo of [...lines.keys()].sort((a, b) => a - b)) {
    const display: { verseKey: string }[] = [];
    for (const w of lines.get(lineNo)!) {
      const text = script === 'uthmani' ? cleanMushafUthmani(w.text) : cleanMushafIndopak(w.text);
      if (!text) continue;
      if (w.charType !== 'end' && isPauseMarkOnly(text) && display.length > 0) continue;
      display.push({ verseKey: w.verseKey });
    }
    for (const d of display) {
      if (idx === globalIdx) {
        const [s, a] = d.verseKey.split(':').map(Number);
        if (Number.isInteger(s) && Number.isInteger(a)) return { surah: s, ayah: a };
        return null;
      }
      idx += 1;
    }
  }
  return null;
}

/* ------------------------- test-session history ------------------------- */

export interface TestSessionRecord {
  /** ISO timestamp of when the test finished. */
  at: string;
  type: string;
  scope: string;
  score: number;
  total: number;
  mistakes: number;
  /** Elapsed seconds. */
  seconds: number;
  /** Missed questions, for review — surah:ayah keys. */
  missed: { surah: number; ayah: number; span: number }[];
}

const MAX_TEST_SESSIONS = 20;

export function loadTestSessions(): TestSessionRecord[] {
  try {
    const raw = localStorage.getItem(TEST_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TestSessionRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTestSession(rec: TestSessionRecord): TestSessionRecord[] {
  const next = [rec, ...loadTestSessions()].slice(0, MAX_TEST_SESSIONS);
  try {
    localStorage.setItem(TEST_SESSIONS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
