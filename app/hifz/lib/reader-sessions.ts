// app/hifz/lib/reader-sessions.ts — Phase 4: the reader's mic takes
// are real practice sessions.
//
// A finished reader take is saved to the SAME store the coach uses
// (`ili_coach_sessions_v1`, lib/session-records.ts) — one record per
// take, with the real measured accuracy from the engine result — and
// its minutes are also fed into the shared progress store
// (`ili_hifz_v1`, progress.ts) so the old hub and cloud sync see the
// activity. Nothing is invented: a take only counts when the mic
// demonstrably heard audio and the take lasted at least a few seconds
// (an accidental tap or a dead capture is not a session).
//
// STREAK HONESTY: the dashboard ring is driven by session DATES, per
// the Phase 4 spec — a day with a session counts, consecutive session
// days form the streak. That is NOT the same rule as the progress
// store's streak (progress.ts `updateStreak`), which only advances
// when the daily goal (10 min or 5 ayahs) is met. The two numbers can
// differ after a short take; the ring shows the session-date streak.
//
// All dates are LOCAL dates (YYYY-MM-DD). A session's stored `date`
// is an ISO timestamp (UTC), so it is converted with
// `localDateString(new Date(...))` — slicing the ISO string would put
// a late-night Sydney session on the wrong day.

import {
  COACH_SESSIONS_KEY,
  listCoachSessions,
  newCoachSessionId,
  recordCoachSession,
  type CoachSessionRecord,
} from './session-records';
import {
  HIFZ_PROGRESS_KEY,
  loadProgress,
  localDateString,
  recordMinutes,
  saveProgress,
} from '../progress';
import { mirrorKeyToIdb } from './store';
import { ALL_SURAHS } from '../surahs';

export type { CoachSessionRecord };

/** A take shorter than this, or with no audio heard, is not a session. */
export const MIN_READER_SESSION_MS = 3000;

export interface ReaderSessionInput {
  /** Surah number of the take (first surah on the page). */
  surah: number;
  fromAyah: number;
  toAyah: number;
  /** Take length in ms, from the engine result. */
  durationMs: number;
  /** Engine result counts. */
  correct: number;
  reached: number;
  missed: number;
  /** Display text of the missed/wrong words, in passage order. */
  mistakeWords: string[];
  /** True when the mic demonstrably heard sound during the take. */
  micHeardAudio: boolean;
  /** Phase 6: test-mode peeks this take (taps on blurred lines /
   *  verses while reciting from memory). A peek counts as a mistake
   *  — see the Phase 6 report for the decision — so it is added to
   *  the saved `mistakes` count, with a label per peek. */
  peeks?: number;
  /** One label per peek, e.g. "Peek: Ayah 4". */
  peekLabels?: string[];
  /** Mushaf page (1–604) the take was on — recorded so the Activity
   *  tab's Pages chart can count real pages per day. */
  page?: number;
}

/** Surah number → display name, e.g. 1 → "Al-Fatihah". */
export function surahName(surah: number): string {
  return ALL_SURAHS.find((s) => s.id === surah)?.name ?? `Surah ${surah}`;
}

/**
 * Save a finished reader take. Returns the saved record, or null when
 * the take does not count (too short or no audio heard). Never throws
 * — a storage failure must never break the reader.
 */
export function saveReaderSession(input: ReaderSessionInput): CoachSessionRecord | null {
  try {
    if (!input.micHeardAudio) return null;
    if (!(input.durationMs >= MIN_READER_SESSION_MS)) return null;
    const name = surahName(input.surah);
    const range =
      input.fromAyah === input.toAyah
        ? `${name} ${input.fromAyah}:${input.fromAyah}`
        : `${name} ${input.fromAyah}:${input.fromAyah}–${input.toAyah}`;
    const record: CoachSessionRecord = {
      id: newCoachSessionId(),
      date: new Date().toISOString(),
      surah: name,
      range,
      durationSec: Math.max(1, Math.round(input.durationMs / 1000)),
      // Same convention as the coach: 0 when the tracker reached no
      // word (nothing was confirmed correct).
      accuracy: input.reached > 0 ? (input.correct / input.reached) * 100 : 0,
      // The mushaf page the take was on (the Activity tab's Pages
      // chart counts distinct pages per day from this).
      ...(typeof input.page === 'number' ? { page: input.page } : {}),
      // Peeks count as mistakes (Phase 6 decision), so they join the
      // count and the word list.
      mistakes: input.missed + (input.peeks ?? 0),
      mistakeWords: [...input.mistakeWords, ...(input.peekLabels ?? [])],
    };
    recordCoachSession(record);
    // Feed the shared progress store (minutes today), so the old hub
    // and sync see the reader activity. The progress streak still
    // follows its own daily-goal rule (see the header note).
    saveProgress(recordMinutes(loadProgress(), input.durationMs / 60000));
    mirrorKeyToIdb(COACH_SESSIONS_KEY);
    mirrorKeyToIdb(HIFZ_PROGRESS_KEY);
    return record;
  } catch {
    return null;
  }
}

/** All saved sessions (coach + reader), oldest first. Never throws. */
export function listReaderSessions(): CoachSessionRecord[] {
  return listCoachSessions();
}

/* ------------------------------------------------------------------ */
/*  Streak, from session dates                                         */
/* ------------------------------------------------------------------ */

/** Tarteel's week runs Friday → Thursday. */
export const STREAK_WEEK = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'] as const;

export interface StreakDay {
  label: string;
  /** Local date (YYYY-MM-DD) of this weekday in the current week. */
  dateStr: string;
  done: boolean;
}

export interface StreakInfo {
  /** Consecutive days with a session, ending today — or yesterday
   *  when today has no session yet (the streak is still alive). 0
   *  when the last session was before yesterday. */
  count: number;
  /** Longest consecutive-day run in the whole history. */
  longest: number;
  /** Whether a session happened today. */
  todayDone: boolean;
  /** The Fri–Thu week containing today, with a done flag per day. */
  week: StreakDay[];
  /** Local date of the most recent session, or null when none. */
  lastSessionDate: string | null;
}

/** Day number (days since epoch, UTC) for a local YYYY-MM-DD string. */
function dayNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.floor(Date.UTC(y, (m || 1) - 1, d || 1) / 86400000);
}

/** Consecutive-day streak + longest run + this week's days, from the
 *  saved sessions. Pure; never throws. */
export function streakFromSessions(
  sessions: CoachSessionRecord[],
  now: Date = new Date(),
): StreakInfo {
  const dates = new Set<string>();
  for (const s of sessions) {
    try {
      dates.add(localDateString(new Date(s.date)));
    } catch {
      /* a malformed date is skipped, not fatal */
    }
  }
  const todayStr = localDateString(now);
  const todayDone = dates.has(todayStr);

  // The Fri–Thu week containing today.
  const toFriday = (now.getDay() - 5 + 7) % 7;
  const friday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - toFriday);
  const week: StreakDay[] = STREAK_WEEK.map((label, i) => {
    const d = new Date(friday.getFullYear(), friday.getMonth(), friday.getDate() + i);
    const dateStr = localDateString(d);
    return { label, dateStr, done: dates.has(dateStr) };
  });

  // Current streak: walk back from today, or from yesterday when
  // today has no session yet (the streak is still alive).
  let count = 0;
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!dates.has(localDateString(cursor))) {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }
  while (dates.has(localDateString(cursor))) {
    count += 1;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }

  // Longest run: sorted day numbers, count consecutive runs.
  const sorted = [...dates].map(dayNumber).sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const n of sorted) {
    run = prev !== null && n === prev + 1 ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = n;
  }

  const lastSessionDate = dates.size > 0 ? [...dates].sort().pop() ?? null : null;
  return { count, longest, todayDone, week, lastSessionDate };
}

/* ------------------------------------------------------------------ */
/*  Display formatting for the Activity tab                            */
/* ------------------------------------------------------------------ */

/** "Today, 4:06 PM" / "Yesterday, 9:12 PM" / "Nov 22, 7:45 PM". */
export function formatSessionWhen(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateStr = localDateString(d);
  const todayStr = localDateString(now);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (dateStr === todayStr) return `Today, ${time}`;
  if (dateStr === localDateString(yesterday)) return `Yesterday, ${time}`;
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${date}, ${time}`;
}

/** "45 secs" under a minute, else "5 mins". */
export function formatSessionDuration(durationSec: number): string {
  if (durationSec < 60) return `${Math.max(0, Math.round(durationSec))} secs`;
  return `${Math.round(durationSec / 60)} mins`;
}
