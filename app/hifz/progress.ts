// app/hifz/progress.ts — localStorage schema + helpers for the Hifz hub
// (spec §5.1, implemented exactly). No account, no backend: all progress
// lives in the browser. Pure functions where possible so they are unit-testable.
//
// Keys:
//   ili_hifz_v1           whole progress document (single key = single export/import)
//   ili_hifz_mistakes_v1  mistake log (separate key so it can be trimmed independently)
//   ili_hifz_settings_v1  reciter, translation, daily goal, preferences
//
// Rules (normative, spec §5.1):
//   - An ayah becomes 'memorised' after 3 CONSECUTIVE correct recitations
//     (correct = all words correct, no peeks). One miss resets correctStreak
//     to 0. A peek counts as a miss.
//   - A streak day counts when the daily goal is met: the daily-goal minutes
//     (default 10, settable 5/10/15/30) OR 5 ayahs practised — whichever the
//     user hits first. Local calendar date. A missed day resets the count to 0;
//     continuity is never faked.
//   - Mistake log: kept in full — every mistake stays until the user clears it.
//     "Heard" is only stored if the engine returns it — never invent a heard word.
//   - Storage failure (unavailable / full / blocked): the site still works for
//     reading, listening and reciting; progress just isn't saved, and a
//     one-line notice is exposed via getStorageNotice(). Never crash the page.

export const HIFZ_PROGRESS_KEY = 'ili_hifz_v1';
export const HIFZ_MISTAKES_KEY = 'ili_hifz_mistakes_v1';
export const HIFZ_SETTINGS_KEY = 'ili_hifz_settings_v1';

import { JUZ_PAGES } from './juz';
import { KHATTAB_TRANSLATION_ID, TAFSIR_ID } from '../quran/lib';

/** Consecutive correct recitations that mark an ayah memorised. */
export const CORRECT_STREAK_FOR_MEMORISED = 3;
/** Ayahs practised in a day that also meets the daily goal (with minutes). */
export const AYAHS_FOR_DAILY_GOAL = 5;
/** Allowed daily-goal values, in minutes. */
export const DAILY_GOAL_OPTIONS = [5, 10, 15, 30] as const;
export type DailyGoalMinutes = (typeof DAILY_GOAL_OPTIONS)[number];
export const DEFAULT_DAILY_GOAL_MINUTES: DailyGoalMinutes = 10;
/** Reciter / translation defaults match app/quran/lib.ts (Alafasy 7).
 *  The translation default is Khattab (131): the reader's Translation
 *  mode has always shown Dr. Mustafa Khattab, so the Translations
 *  screen and the mode agree for a fresh user. The surah / ayah pages
 *  keep their own Saheeh International default — fetchSurahVerses /
 *  fetchVerseByKey default to 20 and AyahClient initialises to 20 —
 *  so this change does not touch them. */
export const DEFAULT_RECITER_ID = 7;
export const DEFAULT_TRANSLATION_ID = KHATTAB_TRANSLATION_ID;

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
  /**
   * Stage 5 (§9): ISO date-time of the last peek (revealing a hidden word
   * or ayah) on this ayah, or null/undefined when the user has not peeked
   * — or has since recited it clean once, which clears the flag. Peeking
   * is help-needed: a peeked ayah jumps the revision queue (peekedDue)
   * until one clean recitation clears it. A peek still resets the
   * correct streak (markAttempt, below) — the flag is only the queue signal.
   */
  lastPeekAt?: string | null;
  /** Total peeks on this ayah, across all sessions. */
  peekCount?: number;
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
  /** Per-type daily goals (§15.8). Optional: older saved documents lack it. */
  typeGoals?: TypeGoals;
  /**
   * Stage 6 (§18): longest streak ever reached, in days. Optional so
   * older saves load — they read as the current streak until a new
   * streak day beats it. Maintained by recordMinutes / the Add Session
   * restore path; never faked from anything else.
   */
  longestStreak?: number;
}

export type MistakeType =
  | 'missed' // expected word never heard (omitted_word)
  | 'incorrect' // word said differently (wrong_word)
  | 'extra' // an added word the checker confirmed (added_word)
  | 'repeated' // a word repeated (duplicate collapse in alignment.ts)
  | 'sequence' // words out of order / passage skipped (skipped_passage)
  | 'skipped'; // passage skipped without a word-level location

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
  /**
   * Stage 5 (§11): 0-based word position inside the ayah, when known.
   * Lets the review screen say "word 3 of this ayah" instead of only the
   * word itself. Older entries lack it.
   */
  wordIndex?: number;
  /** Stage 5 (§11): what kind of issue this was (checker class, or 'missed'
   *  for a self-marked word). Older entries lack it and read as 'missed'. */
  type?: MistakeType;
  /**
   * Stage 5 (§11): true once the user recited this ayah clean (all words
   * correct, no peek) after the mistake was logged. A corrected mistake
   * stays in the log — it is history, not deleted — but the review screen
   * shows it as fixed and stops counting it as a weak spot.
   */
  corrected?: boolean;
  /** ISO date-time the mistake was corrected, when corrected. */
  correctedAt?: string;
  /**
   * BB: id of the coach session this mistake came from, when the coach
   * recorded one. Lets the mistake row offer "hear my recitation" via
   * loadSessionAudio(sessionId) (lib/store.ts). Older entries lack it —
   * those rows honestly say no recording is available, never a fake
   * player.
   */
  sessionId?: string;
}

export interface HifzSettings {
  reciterId: number;
  translationId: number;
  dailyGoalMinutes: number;
  hideTranslation: boolean;
  /** Screenshot/spec rebuild 2026-11-21 (§22) — all optional for old saves. */
  /** Mistake detection on/off (coach). */
  detectMistakes?: boolean;
  /** Harakat (tashkeel) strictness — RETIRED 2026-11-23: the Tilawa engine
      tracks word positions only and never transcribes, so a vowel-only
      difference cannot be detected (see RecitationCoach/tilawa notes).
      Field kept so old saves still parse; no UI or code reads it. */
  harakatStrict?: boolean;
  /** "Don't progress until mistake is fixed" — hold on a mistaken ayah. */
  dontProgress?: boolean;
  /** Mistake-history pastel washes on the page. */
  highlightMistakes?: boolean;
  /** Show the washes even over still-hidden words. */
  showForHidden?: boolean;
  /** Tajweed colours (display only — never detection). */
  tajweedColors?: boolean;
  /** Hide ayah-end markers (rosettes) for a true memory test. */
  hideAyahMarkers?: boolean;
  /** Hide verses (blur each ayah until tapped) — the Hidden Verses
   *  toggle (Settings subtree, commit F: persisted so the choice
   *  survives a reload, like the other toggles). */
  hideVerses?: boolean;
  /** Save session audio data (on-device only) so recordings can play back. */
  saveAudio?: boolean;
  /** Sound + vibration on test-question completion. */
  testSound?: boolean;
  /** Mushaf text size: 15 = large type, 16 = compact type. Stored as 15|16
   *  for compatibility; both show the same 15-line Madani page — the value
   *  never changes the line breaks, only the type size. */
  mushafLines?: 15 | 16;
  /** Mushaf Type picker (fourth refinement, 2026-11-25): the print
   *  edition the reader shows. 'madani-1421' / 'madani-1441' keep the
   *  Madani (1405) layout until verified line data for those prints
   *  exists (see lib/mushaf-edition.ts) — the choice is still real
   *  and persisted; only the layout falls back. */
  mushafEdition?: import('./lib/mushaf-edition').MushafEditionId;
  /** Selected tafsir (Settings → Tafsir); default Ibn Kathir (Abridged). */
  tafsirId?: number;
  /** Colour-code the mushaf by ayah topic (study aid, §23). */
  topicColors?: boolean;
  /** Listen playback speed (0.5–1.75), persisted. */
  playSpeed?: number;
  /** Mistake feedback (Settings → Mistake Feedback): sound + effect + vibration. */
  mistakeSound?: boolean;
  mistakeSoundEffect?: import('./lib/sounds').SoundEffectId;
  mistakeVibrate?: boolean;
  /** Session start/stop feedback (Settings → Session Start & Stop). */
  sessionSound?: boolean;
  sessionVibrate?: boolean;
  /** Dropped-connection feedback (Settings → Dropped Connection). */
  droppedSound?: boolean;
  droppedVibrate?: boolean;
  /** Testing Mode feedback: sound effect + vibration (testSound bool already exists). */
  testSoundEffect?: import('./lib/sounds').SoundEffectId;
  testVibrate?: boolean;
  /** Streak reminder (Settings → Reminders): daily reminder at streakReminderTime. */
  streakReminder?: boolean;
  /** HH:MM local time for the streak reminder. */
  streakReminderTime?: string;
  /** Colour words shared with similar verses (Mutashabihat data). */
  colorSimilarPhrases?: boolean;
  /** Theme: light / dark / sepia. 'auto' follows the system (prefers-color-scheme). */
  theme?: 'light' | 'dark' | 'sepia' | 'auto';
  /** UI language (EN/AR/FR/ID/MS/RU/HI/UR). AR + UR render full RTL. */
  language?: string;
  /**
   * BB: optional guest display name (local only, never synced, never
   * required) so the progress dashboard can greet the user by name.
   * Empty / absent = guest, and the greeting stays a plain "Salam!".
   */
  displayName?: string;
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
    longestStreak: 0,
  };
}

export function createDefaultSettings(now: Date = new Date()): HifzSettings {
  return {
    reciterId: DEFAULT_RECITER_ID,
    translationId: DEFAULT_TRANSLATION_ID,
    dailyGoalMinutes: DEFAULT_DAILY_GOAL_MINUTES,
    hideTranslation: false,
    detectMistakes: true,
    harakatStrict: false,
    dontProgress: false,
    highlightMistakes: true,
    showForHidden: false,
    tajweedColors: true,
    hideAyahMarkers: false,
    hideVerses: false,
    saveAudio: true,
    testSound: true,
    tafsirId: TAFSIR_ID,
    playSpeed: 1,
    mistakeSound: true,
    mistakeSoundEffect: 'chime',
    mistakeVibrate: true,
    sessionSound: true,
    sessionVibrate: true,
    droppedSound: true,
    droppedVibrate: true,
    testSoundEffect: 'chime',
    testVibrate: true,
    streakReminder: false,
    streakReminderTime: '19:00',
    colorSimilarPhrases: false,
    mushafLines: 15,
    mushafEdition: 'madani-1405',
    topicColors: true,
    theme: 'light',
    language: 'en',
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

/** Save the mistake log in full — no trimming, every mistake is kept. */
export function saveMistakes(mistakes: MistakeEntry[], now: Date = new Date()): boolean {
  return writeKey(HIFZ_MISTAKES_KEY, JSON.stringify(mistakes));
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
      // Stage 5 (§9): one clean recitation clears the "peeked, revise
      // first" flag (the streak itself still needs 3 in a row). The total
      // peek count is kept as history.
      lastPeekAt: null,
      peekCount: prev.peekCount ?? 0,
    };
  } else if (result === 'peek') {
    next = {
      status: 'learning',
      correctStreak: 0,
      lastPractised: now.toISOString(),
      attempts: prev.attempts + 1,
      lastPeekAt: now.toISOString(),
      peekCount: (prev.peekCount ?? 0) + 1,
    };
  } else {
    next = {
      status: 'learning',
      correctStreak: 0,
      lastPractised: now.toISOString(),
      attempts: prev.attempts + 1,
      lastPeekAt: prev.lastPeekAt ?? null,
      peekCount: prev.peekCount ?? 0,
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
  // Stage 6 (§18): the longest streak is the best the user ever reached.
  // Older saves lack the field — they start from the current streak.
  next.longestStreak = Math.max(progress.longestStreak ?? next.streak.count, next.streak.count);
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
/*  Per-type daily goals (spec §13 #7, §15.8) — memorisation, revision */
/*  and reading are SEPARATE goals, each with its own target (ayahs/    */
/*  day) and its own counter. Counts reset every local day. Auto-       */
/*  counted: coach attempts → memorisation, test questions → revision.  */
/*  Reading is logged by hand on My Progress (there is no honest way    */
/*  to auto-detect "I read this ayah" from a page view).                */
/* ------------------------------------------------------------------ */

export type GoalType = 'memorisation' | 'revision' | 'reading';

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  memorisation: 'Memorisation',
  revision: 'Revision',
  reading: 'Reading',
};

export const GOAL_TYPE_DESCRIPTIONS: Record<GoalType, string> = {
  memorisation: 'New ayahs practised with the coach.',
  revision: 'Ayahs revised — test questions and revision-queue recitations.',
  reading: 'Ayahs read. Log them by hand on this page.',
};

export const DEFAULT_TYPE_GOAL_TARGETS: Record<GoalType, number> = {
  memorisation: 3,
  revision: 3,
  reading: 5,
};

export const TYPE_GOAL_OPTIONS = [1, 3, 5, 10, 20] as const;

export interface TypeGoalState {
  /** Target ayahs for the day. */
  target: number;
  /** Ayahs done today. */
  done: number;
  /** YYYY-MM-DD local date `done` belongs to. */
  date: string;
}

export type TypeGoals = Record<GoalType, TypeGoalState>;

export function defaultTypeGoals(now: Date = new Date()): TypeGoals {
  const date = localDateString(now);
  return {
    memorisation: { target: DEFAULT_TYPE_GOAL_TARGETS.memorisation, done: 0, date },
    revision: { target: DEFAULT_TYPE_GOAL_TARGETS.revision, done: 0, date },
    reading: { target: DEFAULT_TYPE_GOAL_TARGETS.reading, done: 0, date },
  };
}

/** The stored goals, with today's counts (0 when the stored date is not today). */
export function getTypeGoals(progress: HifzProgress, now: Date = new Date()): TypeGoals {
  const today = localDateString(now);
  const stored = progress.typeGoals ?? defaultTypeGoals(now);
  const out = {} as TypeGoals;
  (Object.keys(DEFAULT_TYPE_GOAL_TARGETS) as GoalType[]).forEach((t) => {
    const g = stored[t] ?? defaultTypeGoals(now)[t];
    out[t] = g.date === today ? g : { ...g, done: 0, date: today };
  });
  return out;
}

/** Add `count` ayahs to one type's today counter. Returns a NEW document. */
export function recordTypeActivity(
  progress: HifzProgress,
  type: GoalType,
  count: number = 1,
  now: Date = new Date(),
): HifzProgress {
  const goals = getTypeGoals(progress, now);
  const g = goals[type];
  return {
    ...progress,
    typeGoals: { ...goals, [type]: { ...g, done: g.done + count } },
  };
}

/** Set one type's daily target (ayahs). Returns a NEW document. */
export function setTypeGoalTarget(
  progress: HifzProgress,
  type: GoalType,
  target: number,
  now: Date = new Date(),
): HifzProgress {
  const goals = getTypeGoals(progress, now);
  return {
    ...progress,
    typeGoals: { ...goals, [type]: { ...goals[type], target } },
  };
}

/* ------------------------------------------------------------------ */
/*  Mistake log (pure add)                                              */
/* ------------------------------------------------------------------ */

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
  return next;
}

/* ------------------------------------------------------------------ */
/*  Export / import                                                    */
/* ------------------------------------------------------------------ */

export interface HifzExport {
  kind: 'hifz-export';
  exportedAt: string;
  progress: HifzProgress;
  mistakes: MistakeEntry[];
  settings: HifzSettings;
  /** Stage 5 (§6): bookmarks (ayah + Mushaf page, with notes). Optional so
   *  older exports still import. */
  bookmarks?: import('./lib/bookmarks').BookmarkEntry[];
  /** Stage 5 (§6): group challenges, where present. Optional, same reason. */
  challenges?: import('./lib/challenges').GroupChallenge[];
}

export function exportProgress(
  progress: HifzProgress,
  mistakes: MistakeEntry[],
  settings: HifzSettings,
  extras?: {
    bookmarks?: import('./lib/bookmarks').BookmarkEntry[];
    challenges?: import('./lib/challenges').GroupChallenge[];
  },
): string {
  const doc: HifzExport = {
    kind: 'hifz-export',
    exportedAt: new Date().toISOString(),
    progress,
    mistakes,
    settings,
    ...(extras?.bookmarks ? { bookmarks: extras.bookmarks } : {}),
    ...(extras?.challenges ? { challenges: extras.challenges } : {}),
  };
  return JSON.stringify(doc, null, 2);
}

export type ImportResult =
  | {
      ok: true;
      progress: HifzProgress;
      mistakes: MistakeEntry[];
      settings: HifzSettings;
      bookmarks: import('./lib/bookmarks').BookmarkEntry[];
      challenges: import('./lib/challenges').GroupChallenge[];
    }
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
  if (doc.kind !== 'hifz-export' && doc.kind !== 'iloveislam-hifz-export') {
    return { ok: false, error: 'That file is not a Hifz progress export.' };
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
  // Stage 5 (§6): bookmarks + challenges ride along when present. They are
  // validated loosely (normaliseBookmarks drops junk rows) and default to
  // empty on older exports — an export without them still imports cleanly.
  // The challenge rows are checked only for the fields the challenges page
  // needs; a malformed row is dropped rather than failing the whole import.
  const bookmarks = normaliseBookmarksLocal(doc.bookmarks);
  const challenges = Array.isArray(doc.challenges)
    ? (doc.challenges as unknown[]).filter(
        (c): c is import('./lib/challenges').GroupChallenge =>
          typeof c === 'object' &&
          c !== null &&
          typeof (c as Record<string, unknown>).id === 'string' &&
          typeof (c as Record<string, unknown>).code === 'string' &&
          typeof (c as Record<string, unknown>).surahId === 'number',
      )
    : [];
  return { ok: true, progress: doc.progress, mistakes, settings, bookmarks, challenges };
}

/**
 * Local bookmark normaliser for import (progress.ts must stay free of
 * browser APIs; lib/bookmarks.ts owns the storage key, this owns the
 * shape check used at import time).
 */
function normaliseBookmarksLocal(
  value: unknown,
): import('./lib/bookmarks').BookmarkEntry[] {
  if (!Array.isArray(value)) return [];
  const out: import('./lib/bookmarks').BookmarkEntry[] = [];
  for (const row of value as Record<string, unknown>[]) {
    if (typeof row !== 'object' || row === null) continue;
    if (row.kind === 'page') {
      const page = Number(row.page);
      if (Number.isInteger(page) && page >= 1 && page <= 604) {
        out.push({
          kind: 'page',
          page,
          ...(typeof row.note === 'string' && row.note ? { note: row.note } : {}),
          addedAt: Number(row.addedAt ?? row.timestamp ?? Date.now()) || Date.now(),
        });
      }
      continue;
    }
    const surahNumber = Number(row.surahNumber ?? row.surah);
    const verseNumber = Number(row.verseNumber ?? row.ayah);
    if (
      Number.isInteger(surahNumber) &&
      surahNumber >= 1 &&
      surahNumber <= 114 &&
      Number.isInteger(verseNumber) &&
      verseNumber >= 1
    ) {
      out.push({
        kind: 'ayah',
        surahNumber,
        verseNumber,
        ...(typeof row.surahName === 'string' && row.surahName ? { surahName: row.surahName } : {}),
        ...(typeof row.note === 'string' && row.note ? { note: row.note } : {}),
        addedAt: Number(row.addedAt ?? row.timestamp ?? Date.now()) || Date.now(),
      });
    }
  }
  return out;
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

/* ------------------------------------------------------------------ */
/*  Analytics — heatmap, surah strength, revision queue, test pool     */
/*  (spec §13/§15 — Tarteel parity + beyond. All pure, all derived    */
/*  from the existing ayah records; no new data is collected.)        */
/* ------------------------------------------------------------------ */

/** Days since `dateStr` (YYYY-MM-DD local) until `now`, in whole days. */
export function daysSince(dateStr: string, now: Date = new Date()): number {
  const today = localDateString(now);
  const t1 = Date.parse(`${dateStr}T00:00:00`);
  const t2 = Date.parse(`${today}T00:00:00`);
  if (Number.isNaN(t1) || Number.isNaN(t2)) return 0;
  return Math.max(0, Math.round((t2 - t1) / 86400000));
}

/**
 * Practice activity by local date: how many ayahs were last practised on
 * each date. Built only from the ayah records' lastPractised stamps, so it
 * works on progress saved before this feature existed. A day counts once
 * per ayah practised that day; it is a lower bound on real activity, never
 * an invented count.
 */
export function activityByDate(progress: HifzProgress): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of Object.values(progress.ayahs)) {
    if (!a.lastPractised) continue;
    const day = a.lastPractised.slice(0, 10);
    out[day] = (out[day] ?? 0) + 1;
  }
  return out;
}

/** Distinct local dates on which any ayah was practised, newest first. */
export function practiceDates(progress: HifzProgress): string[] {
  return Object.keys(activityByDate(progress)).sort().reverse();
}

/** Monday (00:00 local) of the week containing `now`. */
export function weekStart(now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dow);
  return localDateString(d);
}

/** Distinct practice days in the current Monday–Sunday week. */
export function weekPracticeDays(progress: HifzProgress, now: Date = new Date()): number {
  const start = weekStart(now);
  const end = localDateString(now);
  return practiceDates(progress).filter((d) => d >= start && d <= end).length;
}

export interface SurahStrength {
  surah: number;
  slug: string;
  name: string;
  ayahCount: number;
  memorised: number;
  learning: number;
  practised: number;
  /** 0–100: memorised counts fully, learning counts half. */
  strengthPct: number;
}

/**
 * Per-surah strength for every surah with any practice. Strength is
 * the share of the surah's ayahs memorised (full weight) or learning (half
 * weight) — a surah you have never touched scores nothing and is omitted.
 */
export function surahStrength(
  progress: HifzProgress,
  surahs: { id: number; slug: string; name: string; ayahCount: number }[],
): SurahStrength[] {
  const out: SurahStrength[] = [];
  for (const s of surahs) {
    let memorised = 0;
    let learning = 0;
    for (const [key, a] of Object.entries(progress.ayahs)) {
      if (Number(key.split(':')[0]) !== s.id) continue;
      if (a.status === 'memorised') memorised += 1;
      else if (a.status === 'learning') learning += 1;
    }
    if (memorised === 0 && learning === 0) continue;
    out.push({
      surah: s.id,
      slug: s.slug,
      name: s.name,
      ayahCount: s.ayahCount,
      memorised,
      learning,
      practised: memorised + learning,
      strengthPct: Math.min(
        100,
        Math.round(((memorised + 0.5 * learning) / s.ayahCount) * 100),
      ),
    });
  }
  return out.sort((a, b) => b.strengthPct - a.strengthPct);
}

export interface RevisionItem {
  surah: number;
  ayah: number;
  status: AyahStatus;
  daysSincePractised: number;
}

/**
 * Spaced-revision queue: ayahs whose memory is due a review. A 'learning'
 * ayah is due after 2 days without practice; a 'memorised' ayah after 7
 * days. Oldest first — the weakest memory is the most urgent. This is the
 * revision scheduling Tarteel's Smart Goals do; ours is performance-driven,
 * not calendar-fixed.
 */
export function revisionDue(
  progress: HifzProgress,
  now: Date = new Date(),
  limit: number = 20,
): RevisionItem[] {
  const items: RevisionItem[] = [];
  for (const [key, a] of Object.entries(progress.ayahs)) {
    if (!a.lastPractised) continue;
    const days = daysSince(a.lastPractised.slice(0, 10), now);
    const dueAfter = a.status === 'memorised' ? 7 : 2;
    if (a.status === 'new') continue;
    if (days < dueAfter) continue;
    const [s, ay] = key.split(':').map(Number);
    items.push({ surah: s, ayah: ay, status: a.status, daysSincePractised: days });
  }
  items.sort((x, y) => y.daysSincePractised - x.daysSincePractised);
  return items.slice(0, limit);
}

export interface PeekedItem {
  surah: number;
  ayah: number;
  /** ISO date-time of the last peek. */
  peekedAt: string;
  /** Total peeks on this ayah. */
  peekCount: number;
  /** Days since the peek (0 = today). */
  daysSincePeek: number;
}

/**
 * Stage 5 (§9): ayahs the user needed help with — peeked at (revealed a
 * hidden word or ayah) and not yet recited clean once since. These jump
 * the revision queue AHEAD of the time-based due list: needing help is a
 * stronger signal than merely not practising for a while. Most recent
 * peek first. A peek older than 14 days without a clean recitation still
 * lists (memory does not heal by itself), it just sorts after fresher ones.
 */
export function peekedDue(
  progress: HifzProgress,
  now: Date = new Date(),
  limit: number = 20,
): PeekedItem[] {
  const items: PeekedItem[] = [];
  for (const [key, a] of Object.entries(progress.ayahs)) {
    if (!a.lastPeekAt) continue;
    const [s, ay] = key.split(':').map(Number);
    items.push({
      surah: s,
      ayah: ay,
      peekedAt: a.lastPeekAt,
      peekCount: a.peekCount ?? 1,
      daysSincePeek: daysSince(a.lastPeekAt.slice(0, 10), now),
    });
  }
  items.sort((x, y) => y.peekedAt.localeCompare(x.peekedAt));
  return items.slice(0, limit);
}

/** Plain-English label for a mistake type (§11 review screen). */
export function mistakeTypeLabel(type: MistakeType | undefined): string {
  switch (type) {
    case 'incorrect':
      return 'Said differently';
    case 'extra':
      return 'Extra word';
    case 'repeated':
      return 'Repeated';
    case 'sequence':
      return 'Out of order';
    case 'skipped':
      return 'Passage skipped';
    case 'missed':
    default:
      return 'Missed';
  }
}

/**
 * Stage 5 (§11): mark every UNC corrected mistake on one ayah as corrected,
 * when the user recites that ayah clean. History is kept — corrected rows
 * stay in the log, flagged, and stop counting as weak spots.
 */
export function markMistakesCorrected(
  mistakes: MistakeEntry[],
  surah: number,
  ayah: number,
  now: Date = new Date(),
): MistakeEntry[] {
  const at = now.toISOString();
  let changed = false;
  const next = mistakes.map((m) => {
    if (m.surah === surah && m.ayah === ayah && !m.corrected) {
      changed = true;
      return { ...m, corrected: true, correctedAt: at };
    }
    return m;
  });
  return changed ? next : mistakes;
}

/* ------------------------------------------------------------------ */
/*  Stage 6 (§18) — dashboard totals + summaries. All pure, all      */
/*  derived from the stored ayah records and mistake log; nothing is  */
/*  invented. A metric with no data returns an empty result, and the  */
/*  dashboard shows an honest empty state for it.                    */
/* ------------------------------------------------------------------ */

/** Surahs where every ayah is memorised (a completed surah). */
export function completedSurahs(
  progress: HifzProgress,
  surahs: { id: number; slug: string; name: string; ayahCount: number }[],
): { id: number; slug: string; name: string; ayahCount: number }[] {
  const out: { id: number; slug: string; name: string; ayahCount: number }[] = [];
  for (const s of surahs) {
    let memorised = 0;
    for (const [key, a] of Object.entries(progress.ayahs)) {
      if (Number(key.split(':')[0]) !== s.id) continue;
      if (a.status === 'memorised') memorised += 1;
    }
    if (memorised > 0 && memorised === s.ayahCount) out.push(s);
  }
  return out;
}

/** Juz numbers where every ayah in the juz is memorised. */
export function completedJuz(progress: HifzProgress): number[] {
  const done: number[] = [];
  for (const j of JUZ_PAGES) {
    let total = 0;
    let memorised = 0;
    for (const seg of j.segments) {
      for (let a = seg.fromAyah; a <= seg.toAyah; a++) {
        total += 1;
        if (progress.ayahs[ayahKey(seg.surahId, a)]?.status === 'memorised') memorised += 1;
      }
    }
    if (total > 0 && memorised === total) done.push(j.n);
  }
  return done;
}

export interface WeekMonthActivity {
  weekAyahs: number;
  weekDays: number;
  monthAyahs: number;
  monthDays: number;
}

/** Ayahs practised + distinct practice days, this week (Mon–Sun) and this month. */
export function activitySummary(progress: HifzProgress, now: Date = new Date()): WeekMonthActivity {
  const activity = activityByDate(progress);
  const weekStartStr = weekStart(now);
  const today = localDateString(now);
  const monthPrefix = today.slice(0, 7);
  let weekAyahs = 0;
  let weekDays = 0;
  let monthAyahs = 0;
  let monthDays = 0;
  for (const [day, count] of Object.entries(activity)) {
    if (day >= weekStartStr && day <= today) {
      weekAyahs += count;
      weekDays += 1;
    }
    if (day.startsWith(monthPrefix)) {
      monthAyahs += count;
      monthDays += 1;
    }
  }
  return { weekAyahs, weekDays, monthAyahs, monthDays };
}

export interface StrongestSurahWeek {
  surah: number;
  slug: string;
  name: string;
  ayahsPractised: number;
}

/**
 * The surah the user practised most in the last 7 days (by distinct ayahs
 * whose lastPractised falls in the window). Null when nothing was
 * practised this week — the dashboard says so instead of inventing one.
 */
export function strongestSurahThisWeek(
  progress: HifzProgress,
  surahs: { id: number; slug: string; name: string; ayahCount: number }[],
  now: Date = new Date(),
): StrongestSurahWeek | null {
  const today = localDateString(now);
  const weekAgo = localDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
  const counts = new Map<number, number>();
  for (const [key, a] of Object.entries(progress.ayahs)) {
    if (!a.lastPractised) continue;
    const day = a.lastPractised.slice(0, 10);
    if (day < weekAgo || day > today) continue;
    const s = Number(key.split(':')[0]);
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  let best: { id: number; n: number } | null = null;
  for (const [id, n] of counts) {
    if (!best || n > best.n) best = { id, n };
  }
  if (!best) return null;
  const surah = surahs.find((s) => s.id === best.id);
  if (!surah) return null;
  return { surah: surah.id, slug: surah.slug, name: surah.name, ayahsPractised: best.n };
}

export interface DifficultAyah {
  surah: number;
  ayah: number;
  /** Total mistake attempts on this ayah (uncorrected mistakes only). */
  attempts: number;
  /** Distinct words missed on this ayah. */
  words: number;
  /** ISO date-time of the most recent mistake on this ayah. */
  lastMistake: string;
}

/**
 * Ayahs ranked by how often they were missed (uncorrected mistakes only —
 * corrected ones are history, not difficulty). Distinct from the per-word
 * weak spots: this is per ayah, for "these ayahs need more revision".
 */
export function difficultAyahs(mistakes: MistakeEntry[], limit: number = 5): DifficultAyah[] {
  const byAyah = new Map<string, { surah: number; ayah: number; attempts: number; words: Set<string>; lastMistake: string }>();
  for (const m of mistakes) {
    if (m.corrected) continue;
    const k = `${m.surah}:${m.ayah}`;
    const prev = byAyah.get(k);
    if (prev) {
      prev.attempts += m.attempts;
      prev.words.add(m.word);
      if (m.date > prev.lastMistake) prev.lastMistake = m.date;
    } else {
      byAyah.set(k, {
        surah: m.surah,
        ayah: m.ayah,
        attempts: m.attempts,
        words: new Set([m.word]),
        lastMistake: m.date,
      });
    }
  }
  return [...byAyah.values()]
    .sort((a, b) => b.attempts - a.attempts || b.lastMistake.localeCompare(a.lastMistake))
    .slice(0, limit)
    .map((x) => ({ surah: x.surah, ayah: x.ayah, attempts: x.attempts, words: x.words.size, lastMistake: x.lastMistake }));
}

/* ------------------------------------------------------------------ */
/*  BB — real analytics (no invented data). Every helper below is     */
/*  pure and derives ONLY from stored records: test sessions           */
/*  (score/total), coach sessions (measured accuracy percent) and the  */
/*  mistake log. There is deliberately NO synthetic accuracy here: the */
/*  `Math.max(90, 100 - total)` inference (mistake count → accuracy    */
/*  with a 90% floor) is not used anywhere in this file, and any      */
/*  chart built from these helpers shows an honest empty state when   */
/*  there are no sessions yet instead of an invented number.          */
/* ------------------------------------------------------------------ */

/** One hand-logged (external / off-platform) session. Stored uncapped
 *  in localStorage under 'ili_sessions_v1' — see MyProgressClient. */
export interface ExternalSession {
  /** YYYY-MM-DD local date the session happened. */
  date: string;
  /** Goal type label key ('memorisation' | 'revision' | 'reading'). */
  type: string;
  ayahs: number;
  minutes: number;
}

export interface AccuracyPoint {
  /** YYYY-MM-DD local date. */
  date: string;
  correct: number;
  total: number;
  /** 0–100, or null on a day with no scored session — never invented. */
  pct: number | null;
}

/**
 * Real per-day accuracy over the last `days` days, from scored
 * sessions only. Callers map their records in as either counts
 * (test score/total — pooled per day) or a percentage (coach
 * sessions report only a measured percent — those days average the
 * percentages). Days without a session carry pct: null, so a chart
 * shows a gap, not a made-up value. Oldest first.
 */
export function accuracyTrend(
  records: { at: string; correct?: number; total?: number; pct?: number }[],
  days: number = 14,
  now: Date = new Date(),
): AccuracyPoint[] {
  const byDay = new Map<
    string,
    { correct: number; total: number; pctSum: number; pctCount: number }
  >();
  for (const r of records) {
    if (!r.at) continue;
    const day = r.at.slice(0, 10);
    const prev = byDay.get(day) ?? { correct: 0, total: 0, pctSum: 0, pctCount: 0 };
    if (typeof r.total === 'number' && r.total > 0) {
      prev.correct += Math.max(0, r.correct ?? 0);
      prev.total += r.total;
    } else if (typeof r.pct === 'number' && Number.isFinite(r.pct)) {
      prev.pctSum += Math.min(100, Math.max(0, r.pct));
      prev.pctCount += 1;
    }
    byDay.set(day, prev);
  }
  const out: AccuracyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = localDateString(d);
    const v = byDay.get(key);
    const pct =
      v && v.total > 0
        ? Math.round((v.correct / v.total) * 100)
        : v && v.pctCount > 0
          ? Math.round(v.pctSum / v.pctCount)
          : null;
    out.push({ date: key, correct: v?.correct ?? 0, total: v?.total ?? 0, pct });
  }
  return out;
}

/** Monday (00:00 local) of the week `weeksAgo` weeks before this week. */
function mondayWeeksAgo(weeksAgo: number, now: Date = new Date()): Date {
  const [y, m, d] = weekStart(now).split('-').map(Number);
  return new Date(y, m - 1, d - weeksAgo * 7);
}

export interface MistakeTypeWeek {
  /** Monday YYYY-MM-DD starting the week. */
  weekStart: string;
  /** Short label, e.g. "12 Jan". */
  label: string;
  counts: Record<MistakeType, number>;
  total: number;
}

/**
 * Mistake frequency by type, per week, for the last `weeks` weeks
 * (oldest first). Counts are summed `attempts` from the real mistake
 * log; a type with no mistakes that week is 0, never estimated.
 */
export function mistakesByTypeOverTime(
  mistakes: MistakeEntry[],
  weeks: number = 6,
  now: Date = new Date(),
): MistakeTypeWeek[] {
  const buckets: (MistakeTypeWeek & { end: string })[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const monday = mondayWeeksAgo(w, now);
    const end = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    buckets.push({
      weekStart: localDateString(monday),
      end: localDateString(end),
      label: monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      counts: { missed: 0, incorrect: 0, extra: 0, repeated: 0, sequence: 0, skipped: 0 },
      total: 0,
    });
  }
  for (const m of mistakes) {
    const day = m.date.slice(0, 10);
    const bucket = buckets.find((b) => day >= b.weekStart && day <= b.end);
    if (!bucket) continue;
    const type: MistakeType = m.type ?? 'missed';
    bucket.counts[type] += m.attempts;
    bucket.total += m.attempts;
  }
  return buckets.map(({ end: _end, ...b }) => b);
}

export interface AyahTrendPoint {
  /** Monday YYYY-MM-DD starting the week. */
  weekStart: string;
  label: string;
  /** Summed mistake attempts on this ayah that week (0 = clean week). */
  mistakes: number;
}

/**
 * Per-ayah trend over time: mistake attempts on one ayah, per week,
 * for the last `weeks` weeks (oldest first). A falling line is real
 * improvement; a week with no mistakes on the ayah is 0, and an ayah
 * with no mistakes at all in the window is all zeros — the chart says
 * so instead of inventing a trend.
 */
export function ayahMistakeTrend(
  mistakes: MistakeEntry[],
  surah: number,
  ayah: number,
  weeks: number = 6,
  now: Date = new Date(),
): AyahTrendPoint[] {
  const buckets: (AyahTrendPoint & { end: string })[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const monday = mondayWeeksAgo(w, now);
    const end = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    buckets.push({
      weekStart: localDateString(monday),
      end: localDateString(end),
      label: monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      mistakes: 0,
    });
  }
  for (const m of mistakes) {
    if (m.surah !== surah || m.ayah !== ayah) continue;
    const day = m.date.slice(0, 10);
    const bucket = buckets.find((b) => day >= b.weekStart && day <= b.end);
    if (bucket) bucket.mistakes += m.attempts;
  }
  return buckets.map(({ end: _end, ...b }) => b);
}

export interface WeekStats {
  /** Distinct ayahs practised that week (from lastPractised stamps). */
  ayahs: number;
  /** Distinct practice days that week. */
  days: number;
  /** Mistake attempts logged that week. */
  mistakes: number;
  /** Pooled test accuracy that week (score/total across tests), or null
   *  when no test was taken — never invented. */
  testAvgPct: number | null;
  tests: number;
}

export interface WeekComparison {
  current: WeekStats;
  previous: WeekStats;
}

/**
 * Week-over-week comparison: this week (Monday–today) vs last week
 * (Monday–Sunday). All numbers come from stored records; a week with
 * no activity reports zeros / null, never a placeholder.
 */
export function weekOverWeek(
  progress: HifzProgress,
  mistakes: MistakeEntry[],
  tests: { at: string; score: number; total: number }[],
  now: Date = new Date(),
): WeekComparison {
  const curStart = weekStart(now);
  const curEnd = localDateString(now);
  const [y, m, d] = curStart.split('-').map(Number);
  const prevStart = localDateString(new Date(y, m - 1, d - 7));
  const prevEnd = previousLocalDate(curStart);
  const stats = (start: string, end: string): WeekStats => {
    const ayahKeys = new Set<string>();
    const days = new Set<string>();
    for (const [key, a] of Object.entries(progress.ayahs)) {
      if (!a.lastPractised) continue;
      const day = a.lastPractised.slice(0, 10);
      if (day >= start && day <= end) {
        ayahKeys.add(key);
        days.add(day);
      }
    }
    let mistakeAttempts = 0;
    for (const mi of mistakes) {
      const day = mi.date.slice(0, 10);
      if (day >= start && day <= end) mistakeAttempts += mi.attempts;
    }
    let score = 0;
    let total = 0;
    let testCount = 0;
    for (const t of tests) {
      const day = t.at.slice(0, 10);
      if (day >= start && day <= end && t.total > 0) {
        score += t.score;
        total += t.total;
        testCount += 1;
      }
    }
    return {
      ayahs: ayahKeys.size,
      days: days.size,
      mistakes: mistakeAttempts,
      testAvgPct: total > 0 ? Math.round((score / total) * 100) : null,
      tests: testCount,
    };
  };
  return { current: stats(curStart, curEnd), previous: stats(prevStart, prevEnd) };
}

export function pickTestPool(
  progress: HifzProgress,
  launchAyahs: { surah: number; ayah: number }[],
  count: number,
): { surah: number; ayah: number }[] {
  const memorised: { surah: number; ayah: number }[] = [];
  const learning: { surah: number; ayah: number }[] = [];
  const practisedKeys = new Set<string>();
  for (const [key, a] of Object.entries(progress.ayahs)) {
    practisedKeys.add(key);
    const [s, ay] = key.split(':').map(Number);
    if (a.status === 'memorised') memorised.push({ surah: s, ayah: ay });
    else if (a.status === 'learning') learning.push({ surah: s, ayah: ay });
  }
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const pool = [...shuffle(memorised), ...shuffle(learning)];
  if (pool.length < count) {
    const fresh = shuffle(
      launchAyahs.filter((x) => !practisedKeys.has(ayahKey(x.surah, x.ayah))),
    );
    pool.push(...fresh);
  }
  return pool.slice(0, count);
}
