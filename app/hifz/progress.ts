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

/** Consecutive correct recitations that mark an ayah memorised. */
export const CORRECT_STREAK_FOR_MEMORISED = 3;
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
  /** Per-type daily goals (§15.8). Optional: older saved documents lack it. */
  typeGoals?: TypeGoals;
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
  /** Screenshot/spec rebuild 2026-11-21 (§22) — all optional for old saves. */
  /** Mistake detection on/off (coach). */
  detectMistakes?: boolean;
  /** Harakat (tashkeel) strictness: true = a harakat-only difference counts
      as a mistake; false = ignore harakat differences (checker + self-mark). */
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
  /** Save session audio data (on-device only) so recordings can play back. */
  saveAudio?: boolean;
  /** Sound + vibration on test-question completion. */
  testSound?: boolean;
  /** Mushaf layout: 15 lines (Madani) or 16 lines. */
  mushafLines?: 15 | 16;
  /** Colour-code the mushaf by ayah topic (study aid, §23). */
  topicColors?: boolean;
  /** Theme: light / dark / sepia. */
  theme?: 'light' | 'dark' | 'sepia';
  /** UI language (EN/AR/FR/ID/MS/RU/HI/UR). AR + UR render full RTL. */
  language?: string;
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
    detectMistakes: true,
    harakatStrict: false,
    dontProgress: false,
    highlightMistakes: true,
    showForHidden: false,
    tajweedColors: false,
    hideAyahMarkers: false,
    saveAudio: true,
    testSound: true,
    mushafLines: 15,
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
}

export function exportProgress(
  progress: HifzProgress,
  mistakes: MistakeEntry[],
  settings: HifzSettings,
): string {
  const doc: HifzExport = {
    kind: 'hifz-export',
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

/**
 * Test Mode pool (spec §15): the ayahs a test draws from. Memorised ayahs
 * first (the real test is recall of what you claim to know), then learning
 * ayahs; if fewer than `count` practised ayahs exist, the pool is topped up
 * with unpractised ayahs from the whole Quran so a new user can still take
 * a test. Shuffled, so the test drops you at random places with no cue.
 */
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
