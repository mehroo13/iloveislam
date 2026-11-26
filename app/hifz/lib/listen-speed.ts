// app/hifz/lib/listen-speed.ts — the ONE Listen play speed.
//
// Two stores hold it: `ili_hifz_listen_v1.speed` (Settings → Listening,
// SurahClient) and `ili_hifz_settings_v1.playSpeed` (the reader's own
// speed control). They drifted apart — Settings wrote only the first,
// the reader (`/`) played only the second, so a speed picked in
// Settings was silently ignored (audit M1, 2026-11-26). Every audio
// path reads through here and every speed control writes through
// here, so the two keys can never disagree again.
//
// Valid speeds are 0.5–2x (Settings offers 0.5–2x incl. 1.75x);
// the reader's own control caps at 1.75x, so a stored 2x is kept
// when it came from the listen key.

import { loadSettings, saveSettings } from '../progress';

export const LISTEN_KEY = 'ili_hifz_listen_v1';

export const LISTEN_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function readListenKeySpeed(): number | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(LISTEN_KEY);
    if (!raw) return null;
    const s = Number((JSON.parse(raw) as { speed?: unknown }).speed);
    return LISTEN_SPEEDS.includes(s) ? s : null;
  } catch {
    return null;
  }
}

/** The speed Listen should play at right now: the Settings →
// Listening choice first, the reader's stored playSpeed second, 1x. */
export function readListenSpeed(): number {
  const fromListenKey = readListenKeySpeed();
  if (fromListenKey !== null) return fromListenKey;
  try {
    const sp = loadSettings().playSpeed;
    if (typeof sp === 'number' && sp >= 0.5 && sp <= 1.75) return sp;
  } catch {
    /* storage unavailable — fall through to 1x */
  }
  return 1;
}

/** Persist a speed pick to BOTH stores (merge, so the per-surah ayah
 *  range in the listen key survives). */
export function writeListenSpeed(speed: number): void {
  try {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem(LISTEN_KEY);
      const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      window.localStorage.setItem(LISTEN_KEY, JSON.stringify({ ...prev, speed }));
    }
  } catch {
    /* storage unavailable — the in-memory choice still applies */
  }
  try {
    const s = loadSettings();
    if (s.playSpeed !== speed) saveSettings({ ...s, playSpeed: speed });
  } catch {
    /* storage unavailable */
  }
}
