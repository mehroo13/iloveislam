// app/hifz/badges.ts — badges / achievements for the Hifz app.
// Free, no accounts, no locked features: every badge is earned by practice
// alone. Nothing here is paywalled and nothing is ever sold.
//
// Design: badges are DERIVED from the existing progress document
// (app/hifz/progress.ts) — no new stored progress is needed to earn them.
// `buildBadgeSnapshot` turns a HifzProgress into the small snapshot the
// badge checks read; `evaluateBadges` returns earned/locked for every badge.
// The only exception is Test Mode accuracy: test scores are session-only
// today (TestClient keeps results in component state), so accuracy badges
// read an optional persisted best score — see `loadBestTestPct` /
// `saveBestTestPct` and badges-INTEGRATION.md. Until that two-line wiring
// lands, accuracy badges stay locked with a "take a test" hint.
//
// Revision counting (honest proxy, documented): progress.ts stores no
// cumulative "ayahs revised" counter, so `revisedAyahs` counts ayahs
// practised 4+ times — i.e. revisited at least once after the 3 consecutive
// correct recitations that mark an ayah memorised. It is a lower-bound
// proxy for real revision, not an exact count; a dedicated counter is the
// documented follow-up in badges-INTEGRATION.md.

import {
  currentStreakCount,
  localDateString,
  practiceDates,
  type HifzProgress,
} from './progress';
import { ALL_SURAHS } from './surahs';
import { JUZ_PAGES } from './juz';

/** Total ayahs in the Quran (matches app/hifz/surahs.ts). */
export const TOTAL_AYAHS = 6236;
/** Half the Quran, for the "Half the Quran" badge. */
export const HALF_QURAN_AYAHS = 3118;
/** Juz Amma is juz 30 (surahs 78–114). */
export const JUZ_AMMA = 30;

/** localStorage key for the best Test Mode score (0–100, or absent). */
export const BEST_TEST_KEY = 'ili_hifz_best_test_v1';

export type BadgeCategory =
  | 'streak'
  | 'memorisation'
  | 'revision'
  | 'accuracy'
  | 'journey';

export const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  streak: 'Streak',
  memorisation: 'Memorization',
  revision: 'Revision',
  accuracy: 'Accuracy',
  journey: 'Journey',
};

export const CATEGORY_ORDER: BadgeCategory[] = [
  'streak',
  'memorisation',
  'revision',
  'accuracy',
  'journey',
];

/** Everything a badge check needs, derived from stored progress. */
export interface BadgeSnapshot {
  /** Current live streak (0 when lapsed), in days. */
  streakDays: number;
  /** Ayahs with status 'memorised'. */
  memorisedAyahs: number;
  /** Surah ids fully memorised (every ayah 'memorised'). */
  memorisedSurahs: number[];
  /** Juz fully memorised (0–30). */
  juzMemorised: number;
  /** Juz 30 (Juz Amma) fully memorised. */
  juzAmmaComplete: boolean;
  /** Total recitation attempts across all ayahs. */
  totalAttempts: number;
  /** Ayahs practised 4+ times — the revision proxy (see header note). */
  revisedAyahs: number;
  /** Distinct local dates with any practice. */
  practiceDays: number;
  /** Best Test Mode score (0–100), or null when no test has been recorded. */
  bestTestPct: number | null;
}

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  /** ToolIcon name — see app/components/ToolIcon.tsx. */
  icon: string;
  category: BadgeCategory;
  check: (s: BadgeSnapshot) => boolean;
  /** Progress toward the badge, for the locked state ("12 / 100"). */
  progress: (s: BadgeSnapshot) => { current: number; target: number };
}

export interface BadgeResult {
  badge: BadgeDef;
  earned: boolean;
  current: number;
  target: number;
}

const atLeast =
  (get: (s: BadgeSnapshot) => number, target: number) =>
  (s: BadgeSnapshot): { current: number; target: number } => ({
    current: Math.min(get(s), target),
    target,
  });

export const BADGES: BadgeDef[] = [
  // ---- Streak ----
  {
    id: 'streak-3',
    name: 'First Steps',
    description: 'Practise 3 days in a row.',
    icon: 'flame',
    category: 'streak',
    check: (s) => s.streakDays >= 3,
    progress: atLeast((s) => s.streakDays, 3),
  },
  {
    id: 'streak-7',
    name: 'A Week Strong',
    description: 'Practise 7 days in a row.',
    icon: 'flame',
    category: 'streak',
    check: (s) => s.streakDays >= 7,
    progress: atLeast((s) => s.streakDays, 7),
  },
  {
    id: 'streak-30',
    name: 'A Month of Light',
    description: 'Practise 30 days in a row.',
    icon: 'moon',
    category: 'streak',
    check: (s) => s.streakDays >= 30,
    progress: atLeast((s) => s.streakDays, 30),
  },
  {
    id: 'streak-100',
    name: 'Centurion',
    description: 'Practise 100 days in a row.',
    icon: 'sparkle',
    category: 'streak',
    check: (s) => s.streakDays >= 100,
    progress: atLeast((s) => s.streakDays, 100),
  },
  // ---- Memorisation ----
  {
    id: 'mem-1',
    name: 'First Ayah',
    description: 'Memorise your first ayah.',
    icon: 'quran',
    category: 'memorisation',
    check: (s) => s.memorisedAyahs >= 1,
    progress: atLeast((s) => s.memorisedAyahs, 1),
  },
  {
    id: 'mem-surah-1',
    name: 'First Surah',
    description: 'Memorise a whole surah, every ayah.',
    icon: 'bookmark',
    category: 'memorisation',
    check: (s) => s.memorisedSurahs.length >= 1,
    progress: atLeast((s) => s.memorisedSurahs.length, 1),
  },
  {
    id: 'mem-juz-amma',
    name: 'Juz Amma Complete',
    description: 'Memorise all of Juz Amma (surahs 78–114).',
    icon: 'moon',
    category: 'memorisation',
    check: (s) => s.juzAmmaComplete,
    progress: (s) => ({ current: s.juzAmmaComplete ? 1 : 0, target: 1 }),
  },
  {
    id: 'mem-juz-1',
    name: 'One Juz',
    description: 'Memorise a whole juz.',
    icon: 'quran',
    category: 'memorisation',
    check: (s) => s.juzMemorised >= 1,
    progress: atLeast((s) => s.juzMemorised, 1),
  },
  {
    id: 'mem-juz-5',
    name: 'Five Juz',
    description: 'Memorise five juz.',
    icon: 'quran',
    category: 'memorisation',
    check: (s) => s.juzMemorised >= 5,
    progress: atLeast((s) => s.juzMemorised, 5),
  },
  {
    id: 'mem-juz-10',
    name: 'Ten Juz',
    description: 'Memorise ten juz — a third of the Quran.',
    icon: 'quran',
    category: 'memorisation',
    check: (s) => s.juzMemorised >= 10,
    progress: atLeast((s) => s.juzMemorised, 10),
  },
  {
    id: 'mem-half',
    name: 'Half the Quran',
    description: `Memorise ${HALF_QURAN_AYAHS.toLocaleString()} ayahs — half the Quran.`,
    icon: 'names',
    category: 'memorisation',
    check: (s) => s.memorisedAyahs >= HALF_QURAN_AYAHS,
    progress: atLeast((s) => s.memorisedAyahs, HALF_QURAN_AYAHS),
  },
  {
    id: 'mem-full',
    name: 'Hafiz',
    description: `Memorise the whole Quran — all ${TOTAL_AYAHS.toLocaleString()} ayahs.`,
    icon: 'sparkle',
    category: 'memorisation',
    check: (s) => s.memorisedAyahs >= TOTAL_AYAHS,
    progress: atLeast((s) => s.memorisedAyahs, TOTAL_AYAHS),
  },
  // ---- Revision ----
  {
    id: 'rev-100',
    name: 'Reviser',
    description: 'Revisit 100 ayahs after memorising them.',
    icon: 'check',
    category: 'revision',
    check: (s) => s.revisedAyahs >= 100,
    progress: atLeast((s) => s.revisedAyahs, 100),
  },
  {
    id: 'rev-500',
    name: 'Steadfast Reviewer',
    description: 'Revisit 500 ayahs after memorising them.',
    icon: 'check',
    category: 'revision',
    check: (s) => s.revisedAyahs >= 500,
    progress: atLeast((s) => s.revisedAyahs, 500),
  },
  {
    id: 'rev-1000',
    name: 'Guardian of Memory',
    description: 'Revisit 1,000 ayahs after memorising them.',
    icon: 'bookmark',
    category: 'revision',
    check: (s) => s.revisedAyahs >= 1000,
    progress: atLeast((s) => s.revisedAyahs, 1000),
  },
  // ---- Accuracy (needs a recorded Test Mode score) ----
  {
    id: 'acc-80',
    name: 'Steady Voice',
    description: 'Score 80% or more in a Test Mode test.',
    icon: 'mic',
    category: 'accuracy',
    check: (s) => (s.bestTestPct ?? 0) >= 80,
    progress: (s) => ({ current: s.bestTestPct ?? 0, target: 80 }),
  },
  {
    id: 'acc-95',
    name: 'Near Perfect',
    description: 'Score 95% or more in a Test Mode test.',
    icon: 'mic',
    category: 'accuracy',
    check: (s) => (s.bestTestPct ?? 0) >= 95,
    progress: (s) => ({ current: s.bestTestPct ?? 0, target: 95 }),
  },
  {
    id: 'acc-100',
    name: 'Flawless',
    description: 'Score 100% in a Test Mode test — every question correct.',
    icon: 'check',
    category: 'accuracy',
    check: (s) => (s.bestTestPct ?? 0) >= 100,
    progress: (s) => ({ current: s.bestTestPct ?? 0, target: 100 }),
  },
  // ---- Journey ----
  {
    id: 'days-7',
    name: 'Consistent',
    description: 'Practise on 7 different days.',
    icon: 'calendar',
    category: 'journey',
    check: (s) => s.practiceDays >= 7,
    progress: atLeast((s) => s.practiceDays, 7),
  },
  {
    id: 'days-30',
    name: 'Dedicated',
    description: 'Practise on 30 different days.',
    icon: 'calendar',
    category: 'journey',
    check: (s) => s.practiceDays >= 30,
    progress: atLeast((s) => s.practiceDays, 30),
  },
];

/** Evaluate every badge against a snapshot. Pure. */
export function evaluateBadges(snapshot: BadgeSnapshot): BadgeResult[] {
  return BADGES.map((badge) => {
    const { current, target } = badge.progress(snapshot);
    return { badge, earned: badge.check(snapshot), current, target };
  });
}

/** Badges earned in `snapshot` that were not in `previousEarnedIds`. */
export function newlyEarned(
  previousEarnedIds: readonly string[],
  snapshot: BadgeSnapshot,
): BadgeDef[] {
  const prev = new Set(previousEarnedIds);
  return BADGES.filter((b) => b.check(snapshot) && !prev.has(b.id));
}

/**
 * Build the snapshot from stored progress. Pure except for the date.
 * `bestTestPct` comes from loadBestTestPct() (null until a test is recorded).
 */
export function buildBadgeSnapshot(
  progress: HifzProgress,
  opts: { bestTestPct?: number | null; now?: Date } = {},
): BadgeSnapshot {
  const now = opts.now ?? new Date();
  const memorised = new Set<string>();
  let totalAttempts = 0;
  let revisedAyahs = 0;
  for (const [key, a] of Object.entries(progress.ayahs)) {
    totalAttempts += a.attempts;
    if (a.status === 'memorised') {
      memorised.add(key);
      // A memorised ayah practised 4+ times was revisited at least once
      // after the 3 correct recitations that marked it memorised.
      if (a.attempts >= 4) revisedAyahs += 1;
    }
  }
  const memorisedSurahs: number[] = [];
  for (const s of ALL_SURAHS) {
    let full = true;
    for (let a = 1; a <= s.ayahCount; a++) {
      if (!memorised.has(`${s.id}:${a}`)) {
        full = false;
        break;
      }
    }
    if (full) memorisedSurahs.push(s.id);
  }
  let juzMemorised = 0;
  let juzAmmaComplete = false;
  for (const juz of JUZ_PAGES) {
    let full = true;
    for (const seg of juz.segments) {
      for (let a = seg.fromAyah; a <= seg.toAyah; a++) {
        if (!memorised.has(`${seg.surahId}:${a}`)) {
          full = false;
          break;
        }
      }
      if (!full) break;
    }
    if (full) {
      juzMemorised += 1;
      if (juz.n === JUZ_AMMA) juzAmmaComplete = true;
    }
  }
  return {
    streakDays: currentStreakCount(progress.streak, localDateString(now)),
    memorisedAyahs: memorised.size,
    memorisedSurahs,
    juzMemorised,
    juzAmmaComplete,
    totalAttempts,
    revisedAyahs,
    practiceDays: practiceDates(progress).length,
    bestTestPct: opts.bestTestPct ?? null,
  };
}

/* ------------------------------------------------------------------ */
/*  Best Test Mode score — the one small persisted value badges need.  */
/*  TestClient is session-only today; until it calls saveBestTestPct,   */
/*  loadBestTestPct returns null and accuracy badges stay locked.       */
/* ------------------------------------------------------------------ */

/** Best Test Mode score (0–100) or null when no test has been recorded. */
export function loadBestTestPct(): number | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(BEST_TEST_KEY);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n) : null;
  } catch {
    return null;
  }
}

/** Record a finished test score, keeping the best. Returns the stored best. */
export function saveBestTestPct(pct: number): number | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const prev = loadBestTestPct();
    const best = prev === null ? pct : Math.max(prev, pct);
    window.localStorage.setItem(BEST_TEST_KEY, String(Math.round(best)));
    return Math.round(best);
  } catch {
    return null;
  }
}
