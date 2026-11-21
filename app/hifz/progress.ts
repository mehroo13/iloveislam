// app/hifz/progress.ts — localStorage schema + helpers for the Hifz hub
// (spec §5.1, implemented exactly). No account, no backend: all progress
// lives in the browser. Pure functions where possible so they are unit-testable.
//
// Keys:
//   ili_hifz_v1           whole progress document (single key = single export/import)
//   ili_hifz_mistakes_v1  mistake log (separate key so it can be trimmed independently)
//   ili_hifz_settings_v1  reciter, translation, daily goal, preferences, free-tier usage
//
// Rules (normative, spec §5.1):
//   - An ayah becomes 'memorised' after 3 CONSECUTIVE correct recitations
//     (correct = all words correct, no peeks). One miss resets correctStreak
//     to 0. A peek counts as a miss.
//   - A streak day counts when the daily goal is met: the daily-goal minutes
//     (default 10, settable 5/10/15/30) OR 5 ayahs practised — whichever the
//     user hits first. Local calendar date. A missed day resets the count to 0;
//     continuity is never faked.
//   - Mistake log: free tier keeps 7 days; older entries are trimmed on write.
//     "Heard" is only stored if the engine returns it — never invent a heard word.
//   - Storage failure (unavailable / full / blocked): the site still works for
//     reading, listening and reciting; progress just isn't saved, and a
//     one-line notice is exposed via getStorageNotice(). Never crash the page.

export const HIFZ_PROGRESS_KEY = 'ili_hifz_v1';
export const HIFZ_MISTAKES_KEY = 'ili_hifz_mistakes_v1';
export const HIFZ_SETTINGS_KEY = 'ili_hifz_settings_v1';

/** Consecutive correct recitations that mark an ayah memorised. */
export const CORRECT_STREAK_FOR_MEMORISED = 3;
/** Free-tier mistake log retention, in days. */
export const FREE_MISTAKE_LOG_DAYS = 7;
/** Ayahs practised in a day that also meets the daily goal (with minutes). */
export const AYAHS_FOR_DAILY_GOAL = 5;
/** Allowed daily-goal values, in minutes. */
export const DAILY_GOAL_OPTIONS = [5, 10, 15, 30] as const;
export type DailyGoalMinutes = (typeof DAILY_GOAL_OPTIONS)[number];
export const DEFAULT_DAILY_GOAL_MINUTES: DailyGoalMinutes = 10;
/** Reciter / translation defaults match app/quran/lib.ts (Alafasy 7, Saheeh International 20). */
export const DEFAULT_RECITER_ID = 7;
export const DEFAULT_TRANSLATION_ID = 20;

export type AyahStatus = 'new' | 'learning' | 'memorised';
export type AttemptResult = 'correct' | 'miss' | 'peek';
export type PlanDays = 7 | 30 | 90;

/** Key for one ayah's progress record: "surah:ayah", e.g. "67:1". */
export type AyahKey = `${number}:${number}`;

export function ayahKey(surah: number, ayah: number): AyahKey {
  return `${surah}:${ayah}`;
}

export interface AyahProgress {
  status: AyahStatus;
  /** Consecutive correct recitations. */
  correctStreak: number;
  /** ISO date-time of the last practice, or null if never practised. */
  lastPractised: string | null;
  attempts: number;
}

export interface HifzProgress {
  version: 1;
  /** ISO date-time the document was created. */
  createdAt: string;
  dailyGoalMinutes: number;
  streak: {
    count: number;
    /** YYYY-MM-DD local date of the last streak day, or null if none yet. */
    lastActiveDate: string | null;
  };
  activePlan: {
    surahSlug: string;
    planDays: PlanDays;
    startedAt: string;
    currentDay: number;
  } | null;
  ayahs: Record<string, AyahProgress>;
  minutesToday: { date: string; minutes: number };
}

export interface MistakeEntry {
  surah: number;
  ayah: number;
  word: string;
  expected: string;
  /** What the engine heard — ONLY if the engine returned it. Never invented. */
  heard?: string;
  /** ISO date-time. */
  date: string;
  attempts: number;
  /**
   * Where the mistake came from: 'engine' (the on-device checker confirmed
   * or observed it) or 'self-mark' (the user marked it themselves in
   * no-mic practice mode). Optional so older stored entries stay valid.
   * NOTE: RecitationCoach does not set this yet (its submitSelfMark /
   * persistAttempt paths predate the field) — wiring it there is a
   * follow-up; the field exists so the value can persist once set.
   */
  source?: 'engine' | 'self-mark';
}

export interface HifzSettings {
  reciterId: number;
  translationId: number;
  dailyGoalMinutes: number;
  hideTranslation: boolean;
  /** Free-tier usage counters (client-side limits, spec §3.3 — bypassable by design in v1). */
  freeUsage: {
    /** YYYY-MM-DD local date these counters belong to. */
    date: string;
    /** Slugs recited today (free tier: 1 surah/day). */
    surahsRecitedToday: string[];
    minutesRecitedToday: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Dates — always LOCAL calendar dates (spec §5.1).                   */
/* ------------------------------------------------------------------ */

/** Local date as YYYY-MM-DD. */
export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** YYYY-MM-DD of the local day before `dateStr` (YYYY-MM-DD). */
export function previousLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const prev = new Date(y, m - 1, d);
  prev.setDate(prev.getDate() - 1);
  return localDateString(prev);
}

/* ------------------------------------------------------------------ */
/*  Storage failure — never crash, one-line notice (spec §5.1).        */
/* ------------------------------------------------------------------ */

let storageNotice: string | null = null;

/** One-line notice when progress could not be saved/loaded, else null. */
export function getStorageNotice(): string | null {
  return storageNotice;
}

function storageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const probe = '__ili_hifz_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function readKey(key: string): string | null {
  try {
    if (!storageAvailable()) return null;
    return window.localStorage.getItem(key);
  } catch {
    storageNotice = 'Progress could not be loaded — browser storage is unavailable.';
    return null;
  }
}

function writeKey(key: string, value: string): boolean {
  try {
    if (!storageAvailable()) {
      storageNotice = 'Progress is not being saved — browser storage is unavailable.';
      return false;
    }
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    storageNotice = 'Progress could not be saved — browser storage is full or blocked.';
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Defaults + validation                                              */
/* ------------------------------------------------------------------ */

export function createDefaultProgress(now: Date = new Date()): HifzProgress {
  return {
    version: 1,
    createdAt: now.toISOString(),
    dailyGoalMinutes: DEFAULT_DAILY_GOAL_MINUTES,
    streak: { count: 0, lastActiveDate: null },
    activePlan: null,
    ayahs: {},
    minutesToday: { date: localDateString(now), minutes: 0 },
  };
}

export function createDefaultSettings(now: Date = new Date()): HifzSettings {
  return {
    reciterId: DEFAULT_RECITER_ID,
    translationId: DEFAULT_TRANSLATION_ID,
    dailyGoalMinutes: DEFAULT_DAILY_GOAL_MINUTES,
    hideTranslation: false,
    freeUsage: { date: localDateString(now), minutesRecitedToday: 0, surahsRecitedToday: [] },
  };
}

/** Structural check used by load + import. Rejects anything that is not a v1 document. */
export function isValidProgress(value: unknown): value is HifzProgress {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.version !== 1) return false;
  if (typeof v.createdAt !== 'string') return false;
  if (typeof v.dailyGoalMinutes !== 'number') return false;
  if (typeof v.streak !== 'object' || v.streak === null) return false;
  const streak = v.streak as Record<string, unknown>;
  if (typeof streak.count !== 'number') return false;
  if (streak.lastActiveDate !== null && typeof streak.lastActiveDate !== 'string') return false;
  if (v.activePlan !== null && typeof v.activePlan !== 'object') return false;
  if (typeof v.ayahs !== 'object' || v.ayahs === null) return false;
  if (typeof v.minutesToday !== 'object' || v.minutesToday === null) return false;
  const mt = v.minutesToday as Record<string, unknown>;
  return typeof mt.date === 'string' && typeof mt.minutes === 'number';
}

/* ------------------------------------------------------------------ */
/*  Load / save                                                        */
/* ------------------------------------------------------------------ */

/** Load the progress document; returns a fresh default (unsaved) when none exists. */
export function loadProgress(): HifzProgress {
  const raw = readKey(HIFZ_PROGRESS_KEY);
  if (!raw) return createDefaultProgress();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isValidProgress(parsed)) return parsed;
  } catch {
    // Corrupt stored JSON: fall through to a fresh default.
  }
  storageNotice = 'Saved progress could not be read, so a fresh record was started.';
  return createDefaultProgress();
}

export function saveProgress(progress: HifzProgress): boolean {
  return writeKey(HIFZ_PROGRESS_KEY, JSON.stringify(progress));
}

export function loadMistakes(): MistakeEntry[] {
  const raw = readKey(HIFZ_MISTAKES_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as MistakeEntry[];
  } catch {
    // Corrupt log: start empty rather than crash.
  }
  return [];
}

/** Save the mistake log, trimming entries older than the free-tier retention first. */
export function saveMistakes(mistakes: MistakeEntry[], now: Date = new Date()): boolean {
  return writeKey(HIFZ_MISTAKES_KEY, JSON.stringify(trimMistakes(mistakes, now)));
}

export function loadSettings(): HifzSettings {
  const raw = readKey(HIFZ_SETTINGS_KEY);
  if (!raw) return createDefaultSettings();
  try {
    const parsed = JSON.parse(raw) as Partial<HifzSettings>;
    const defaults = createDefaultSettings();
    return {
      ...defaults,
      ...parsed,
      freeUsage: { ...defaults.freeUsage, ...(parsed.freeUsage ?? {}) },
    };
  } catch {
    return createDefaultSettings();
  }
}

export function saveSettings(settings: HifzSettings): boolean {
  return writeKey(HIFZ_SETTINGS_KEY, JSON.stringify(settings));
}

/* ------------------------------------------------------------------ */
/*  Attempts + streaks (pure)                                          */
/* ------------------------------------------------------------------ */

/**
 * Record one recitation attempt for an ayah. Returns a NEW progress document.
 * correct: correctStreak + 1; at 3 consecutive correct the ayah is 'memorised'.
 * miss / peek: correctStreak resets to 0 (a peek counts as a miss, spec §5.1);
 * a previously memorised ayah drops back to 'learning'.
 */
export function markAttempt(
  progress: HifzProgress,
  surah: number,
  ayah: number,
  result: AttemptResult,
  now: Date = new Date(),
): HifzProgress {
  const key = ayahKey(surah, ayah);
  const prev: AyahProgress = progress.ayahs[key] ?? {
    status: 'new',
    correctStreak: 0,
    lastPractised: null,
    attempts: 0,
  };
  let next: AyahProgress;
  if (result === 'correct') {
    const streak = prev.correctStreak + 1;
    next = {
      status: streak >= CORRECT_STREAK_FOR_MEMORISED ? 'memorised' : 'learning',
      correctStreak: streak,
      lastPractised: now.toISOString(),
      attempts: prev.attempts + 1,
    };
  } else {
    next = {
      status: 'learning',
      correctStreak: 0,
      lastPractised: now.toISOString(),
      attempts: prev.attempts + 1,
    };
  }
  return { ...progress, ayahs: { ...progress.ayahs, [key]: next } };
}

/** How many distinct ayahs were practised on `dateStr` (YYYY-MM-DD local). */
export function ayahsPractisedOn(progress: HifzProgress, dateStr: string): number {
  return Object.values(progress.ayahs).filter(
    (a) => a.lastPractised !== null && a.lastPractised.slice(0, 10) === dateStr,
  ).length;
}

/** True when the daily goal is met: goal minutes OR 5 ayahs practised, whichever first. */
export function isDailyGoalMet(progress: HifzProgress, dateStr: string): boolean {
  const minutes =
    progress.minutesToday.date === dateStr ? progress.minutesToday.minutes : 0;
  return (
    minutes >= progress.dailyGoalMinutes ||
    ayahsPractisedOn(progress, dateStr) >= AYAHS_FOR_DAILY_GOAL
  );
}

/**
 * Advance the streak for a goal-met day. Pure.
 * Same day: unchanged. Yesterday: count + 1. Anything earlier (or never):
 * a new streak starts at 1 — a missed day resets the count, never faked.
 */
export function updateStreak(
  streak: HifzProgress['streak'],
  todayStr: string,
): HifzProgress['streak'] {
  if (streak.lastActiveDate === todayStr) return streak;
  if (
    streak.lastActiveDate !== null &&
    streak.lastActiveDate === previousLocalDate(todayStr)
  ) {
    return { count: streak.count + 1, lastActiveDate: todayStr };
  }
  return { count: 1, lastActiveDate: todayStr };
}

/**
 * The streak count to DISPLAY today: 0 when the last active day was neither
 * today nor yesterday (the streak has lapsed), otherwise the stored count.
 * This is what stops a stale number from pretending the streak is alive.
 */
export function currentStreakCount(
  streak: HifzProgress['streak'],
  todayStr: string,
): number {
  if (streak.lastActiveDate === null) return 0;
  if (streak.lastActiveDate === todayStr) return streak.count;
  if (streak.lastActiveDate === previousLocalDate(todayStr)) return streak.count;
  return 0;
}

/**
 * Add practice minutes and, if the goal is now met, advance the streak.
 * Returns a NEW progress document.
 */
export function recordMinutes(
  progress: HifzProgress,
  minutes: number,
  now: Date = new Date(),
): HifzProgress {
  const todayStr = localDateString(now);
  const minutesToday =
    progress.minutesToday.date === todayStr
      ? { date: todayStr, minutes: progress.minutesToday.minutes + minutes }
      : { date: todayStr, minutes };
  const next: HifzProgress = { ...progress, minutesToday };
  if (isDailyGoalMet(next, todayStr)) {
    next.streak = updateStreak(next.streak, todayStr);
  }
  return next;
}

/** Set the daily goal (5 / 10 / 15 / 30 minutes). Returns a NEW document. */
export function setDailyGoal(
  progress: HifzProgress,
  minutes: DailyGoalMinutes,
): HifzProgress {
  return { ...progress, dailyGoalMinutes: minutes };
}

/* ------------------------------------------------------------------ */
/*  Mistake log (pure add/trim)                                        */
/* ------------------------------------------------------------------ */

/** Drop entries older than `retentionDays` (free tier: 7). Pure. */
export function trimMistakes(
  mistakes: MistakeEntry[],
  now: Date = new Date(),
  retentionDays: number = FREE_MISTAKE_LOG_DAYS,
): MistakeEntry[] {
  const cutoff = now.getTime() - retentionDays * 24 * 60 * 60 * 1000;
  return mistakes.filter((m) => {
    const t = Date.parse(m.date);
    return Number.isNaN(t) || t >= cutoff;
  });
}

/**
 * Add a mistake. A repeat of the same word in the same ayah on the same day
 * bumps `attempts` instead of duplicating the row. Never invents `heard`:
 * pass it only when the engine returned a heard word.
 */
export function addMistake(
  mistakes: MistakeEntry[],
  entry: Omit<MistakeEntry, 'attempts'>,
  now: Date = new Date(),
): MistakeEntry[] {
  const day = localDateString(now);
  const idx = mistakes.findIndex(
    (m) =>
      m.surah === entry.surah &&
      m.ayah === entry.ayah &&
      m.word === entry.word &&
      m.date.slice(0, 10) === day,
  );
  let next: MistakeEntry[];
  if (idx >= 0) {
    next = mistakes.map((m, i) =>
      i === idx
        ? { ...m, attempts: m.attempts + 1, date: entry.date, ...(entry.heard ? { heard: entry.heard } : {}) }
        : m,
    );
  } else {
    next = [...mistakes, { ...entry, attempts: 1 }];
  }
  return trimMistakes(next, now);
}

/* ------------------------------------------------------------------ */
/*  Export / import                                                    */
/* ------------------------------------------------------------------ */

export interface HifzExport {
  kind: 'iloveislam-hifz-export';
  exportedAt: string;
  progress: HifzProgress;
  mistakes: MistakeEntry[];
  settings: HifzSettings;
}

export function exportProgress(
  progress: HifzProgress,
  mistakes: MistakeEntry[],
  settings: HifzSettings,
): string {
  const doc: HifzExport = {
    kind: 'iloveislam-hifz-export',
    exportedAt: new Date().toISOString(),
    progress,
    mistakes,
    settings,
  };
  return JSON.stringify(doc, null, 2);
}

export type ImportResult =
  | { ok: true; progress: HifzProgress; mistakes: MistakeEntry[]; settings: HifzSettings }
  | { ok: false; error: string };

/** Validate an imported JSON string. Rejects anything that is not a v1 export. */
export function importProgress(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'That file does not contain a progress export.' };
  }
  const doc = parsed as Record<string, unknown>;
  if (doc.kind !== 'iloveislam-hifz-export') {
    return { ok: false, error: 'That file is not an I Love Islam hifz export.' };
  }
  if (!isValidProgress(doc.progress)) {
    return {
      ok: false,
      error: 'That export is not version 1 progress data and cannot be imported.',
    };
  }
  const mistakes = Array.isArray(doc.mistakes) ? (doc.mistakes as MistakeEntry[]) : [];
  const settings =
    typeof doc.settings === 'object' && doc.settings !== null
      ? (doc.settings as HifzSettings)
      : createDefaultSettings();
  return { ok: true, progress: doc.progress, mistakes, settings };
}

/** Trigger a .json download of the export (client only; no-op on the server). */
export function downloadProgressJson(filename: string, json: string): void {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    storageNotice = 'The progress file could not be downloaded in this browser.';
  }
}
