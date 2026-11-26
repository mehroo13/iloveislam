// app/hifz/lib/test-settings.ts — the persisted Test Mode preferences
// (2026-11-26, the "five" build: Test Settings).
//
// What the test SETUP screen already lets the user pick — how many
// questions, how long each question is (in mushaf lines), and a per-test
// time limit — used to live only in TestClient useState, so every fresh
// test reset to the defaults (10 questions, 5 lines, no limit). This
// store persists those three choices in localStorage so the next test
// remembers them, and the Settings → Testing Mode screen reads and
// writes the SAME store, so a change in either place shows up in the
// other. Device-local only, like everything else in the Hifz app — no
// account, no sync, nothing uploaded.
//
// The unfinished-test resume (loadInProgressTest) is separate: it
// restores the in-progress test's own limit for that test only, and
// does not touch these defaults.

export const TEST_SETTINGS_KEY = 'ili_test_settings_v1';

/** How many questions a test asks. */
export type TestQuestionCount = 5 | 10 | 20;
/** Per-test time limit in minutes (0 = no limit). */
export type TestTimeLimitMinutes = 0 | 5 | 10 | 15 | 30;

export interface TestSettings {
  /** Number of questions per test. */
  questionCount: TestQuestionCount;
  /** Question length in mushaf lines, 1–15. */
  questionLines: number;
  /** Per-test time limit in minutes (0 = unlimited). */
  timeLimitMinutes: TestTimeLimitMinutes;
}

export const DEFAULT_TEST_SETTINGS: TestSettings = {
  questionCount: 10,
  questionLines: 5,
  timeLimitMinutes: 0,
};

/** Preset line counts for the Short / Medium / Long buttons. */
export const TEST_LINE_PRESETS = { short: 2, medium: 5, long: 10 } as const;

export const TEST_QUESTION_COUNTS: TestQuestionCount[] = [5, 10, 20];
export const TEST_TIME_LIMITS: TestTimeLimitMinutes[] = [0, 5, 10, 15, 30];

/** Lines → ayahs, from the real Quran totals: 6,236 ayahs across 604
 *  pages × 15 lines = 9,060 lines, so one line is ~0.69 ayahs. The
 *  same conversion TestClient uses for its question span. */
export const TEST_LINES_PER_AYAH = 6236 / 9060;

/** Roughly how many ayahs a question of `lines` mushaf lines covers
 *  (1 line → 1 ayah minimum; 15 lines → 10 ayahs). */
export function ayahsForLines(lines: number): number {
  return Math.max(1, Math.round(lines * TEST_LINES_PER_AYAH));
}

function isQuestionCount(v: unknown): v is TestQuestionCount {
  return v === 5 || v === 10 || v === 20;
}

function isTimeLimit(v: unknown): v is TestTimeLimitMinutes {
  return v === 0 || v === 5 || v === 10 || v === 15 || v === 30;
}

/** Validate one stored value at a time; anything bad falls back to
 *  the default for that field, never throws, never blanks the rest. */
function sanitize(value: unknown): TestSettings {
  const v = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
  const questionLines =
    typeof v.questionLines === 'number' && Number.isFinite(v.questionLines)
      ? Math.min(15, Math.max(1, Math.round(v.questionLines)))
      : DEFAULT_TEST_SETTINGS.questionLines;
  return {
    questionCount: isQuestionCount(v.questionCount) ? v.questionCount : DEFAULT_TEST_SETTINGS.questionCount,
    questionLines,
    timeLimitMinutes: isTimeLimit(v.timeLimitMinutes) ? v.timeLimitMinutes : DEFAULT_TEST_SETTINGS.timeLimitMinutes,
  };
}

export function loadTestSettings(): TestSettings {
  try {
    const raw = localStorage.getItem(TEST_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_TEST_SETTINGS };
    return sanitize(JSON.parse(raw));
  } catch {
    /* bad stored data (or storage unavailable) — defaults */
    return { ...DEFAULT_TEST_SETTINGS };
  }
}

/** Event fired on window whenever the settings change, so a mounted
 *  test setup can pick up a change made elsewhere without a reload. */
export const TEST_SETTINGS_EVENT = 'ili:test-settings-changed';

export function saveTestSettings(patch: Partial<TestSettings>): TestSettings {
  const next = sanitize({ ...loadTestSettings(), ...patch });
  try {
    localStorage.setItem(TEST_SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the in-memory value still applies */
  }
  try {
    window.dispatchEvent(new CustomEvent(TEST_SETTINGS_EVENT, { detail: next }));
  } catch {
    /* ignore */
  }
  return next;
}
