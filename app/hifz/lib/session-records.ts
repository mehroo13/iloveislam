/**
 * app/hifz/lib/session-records.ts — one record per finished coach session
 * (BA, 2026-11-23).
 *
 * Until now a coach session produced NO session record at all — only
 * per-ayah activity and mistake entries. These records are what session
 * history / analytics read: one row per session, with the REAL measured
 * accuracy from that session's result.
 *
 * ACCURACY HONESTY: `accuracy` is a percentage (0–100) computed as
 * correct / reached words from the session result (engine or self-mark).
 * It is NEVER the synthetic `Math.max(90, 100 - totalMistakes)` formula
 * that the analytics sheet used to derive from the mistake log — a
 * session with no mistakes logged is not automatically 100%, and a
 * session is not 90% just because it had few mistakes.
 *
 * Storage: localStorage key `ili_coach_sessions_v1`, no cap. Audio is
 * NOT stored here — only the `audioId` linking to the recording in the
 * IndexedDB `session-audio` store (see lib/store.ts), when the user has
 * `saveAudio` on and the recording was actually persisted. Everything
 * is local-only and free; nothing is uploaded.
 */

export interface CoachSessionRecord {
  /** Session id (same id as the stored audio, when audio was saved). */
  id: string;
  /** ISO timestamp of the session end. */
  date: string;
  /** Human range label, e.g. "67:1–5". */
  range: string;
  /** Session length in seconds (excludes any paused time). */
  durationSec: number;
  /** REAL measured accuracy, percent 0–100: correct / reached words. */
  accuracy: number;
  /** Number of missed/wrong words in the session. */
  mistakes: number;
  /** Id of the stored recording in the `session-audio` store, when one
   * was saved for this session. Absent when `saveAudio` is off, the
   * recording failed to save, or the session had no mic audio
   * (self-mark). */
  audioId?: string;
}

const KEY = 'ili_coach_sessions_v1';

function isRecord(value: unknown): value is CoachSessionRecord {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<CoachSessionRecord>;
  return (
    typeof r.id === 'string' &&
    typeof r.date === 'string' &&
    typeof r.range === 'string' &&
    typeof r.durationSec === 'number' &&
    typeof r.accuracy === 'number' &&
    typeof r.mistakes === 'number'
  );
}

/** All recorded coach sessions, oldest first. Never throws. */
export function listCoachSessions(): CoachSessionRecord[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecord);
  } catch {
    return [];
  }
}

/** Append one finished session's record. No cap. Never throws — a
 * storage failure must never break the feedback screen. */
export function recordCoachSession(record: CoachSessionRecord): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (!isRecord(record)) return;
    const sessions = listCoachSessions();
    sessions.push(record);
    localStorage.setItem(KEY, JSON.stringify(sessions));
  } catch {
    /* storage failure is never fatal */
  }
}
