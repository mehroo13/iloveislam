// app/hifz/plans.ts — memorisation plan definitions (spec §5.2).
//
// Phase 2 (2026-11-21): the 7-day and 30-day per-surah plans are now
// GENERATED at runtime from the surah's ayah count, instead of a static
// table — the full Quran (114 surahs) would have made the table ~6,000
// lines. The generator implements exactly the algorithm the old static
// tables were built with (script /tmp/gen_hifz.py, 2026-11-21), and was
// verified to reproduce those hand-checked tables byte-for-byte for all
// 43 launch surahs x both plan lengths (tools/verify_plans.mjs):
//   - 7-day plans: days 1-6 learn, day 7 is review. Ayahs split into 6
//     near-equal contiguous chunks (earlier chunks take the extra ayah);
//     a chunk of 0 ayahs becomes a review day ("Review - ayahs learned
//     so far"). Day 7: "Review - all N ayahs".
//   - 30-day plans: days 7, 14, 21, 30 are review-only. The other 26
//     days learn, ayahs split into 26 near-equal contiguous chunks
//     (same rule); empty chunks become review days. Review days 7/14/21
//     are labelled "Review - ayahs 1-K" (K = last ayah learned so far);
//     day 30 is "Review - ayahs 1-N".
//   - Learning days cover the surah's ayahs exactly once, contiguously,
//     never mid-ayah. Short surahs front-load their learning days and
//     spend the remaining days reviewing - that is deliberate, not an error.
// All plans — 7-day, 30-day and the Juz Amma 90-day plan — are free, always.
// The Juz Amma 90-day plan below is unchanged from v1 (static table,
// hand-checked once 2026-11-21); do not hand-edit it either.

import { getSurahBySlug } from './surahs';

export interface PlanDay {
  day: number;
  /** First ayah of the day's chunk, or null on a review day. */
  startAyah: number | null;
  /** Last ayah of the day's chunk, or null on a review day. */
  endAyah: number | null;
  label: string;
  isReview: boolean;
}

export interface SurahPlan {
  surahSlug: string;
  surahId: number;
  planDays: 7 | 30;
  days: PlanDay[];
}

/** One day of the Juz Amma 90-day plan: a surah (or part of one), or a review day. */
export interface JuzAmmaPlanDay extends PlanDay {
  /** Surah being learned that day, or null on a review day. */
  surahSlug: string | null;
  surahId: number | null;
}

export interface JuzAmmaPlan {
  planDays: 90;
  days: JuzAmmaPlanDay[];
}

const REVIEW_DAYS_30 = new Set([7, 14, 21, 30]);

function chunkLabel(start: number, end: number): string {
  return start === end ? `Ayah ${start}` : `Ayahs ${start}–${end}`;
}

/**
 * Build a 7-day or 30-day plan for one surah from its ayah count.
 * Pure function of (ayahCount, planDays) — memoised by getPlan below.
 */
export function buildSurahPlan(
  surahSlug: string,
  surahId: number,
  ayahCount: number,
  planDays: 7 | 30,
): SurahPlan {
  const totalDays = planDays;
  const learningDays: number[] =
    planDays === 7
      ? [1, 2, 3, 4, 5, 6]
      : Array.from({ length: 30 }, (_, i) => i + 1).filter(
          (d) => !REVIEW_DAYS_30.has(d),
        );
  const base = Math.floor(ayahCount / learningDays.length);
  const extra = ayahCount - base * learningDays.length; // first `extra` chunks get +1
  const chunkByDay = new Map<number, { start: number; end: number } | null>();
  let next = 1;
  learningDays.forEach((day, i) => {
    const size = base + (i < extra ? 1 : 0);
    if (size === 0) {
      chunkByDay.set(day, null);
    } else {
      chunkByDay.set(day, { start: next, end: next + size - 1 });
      next += size;
    }
  });

  const days: PlanDay[] = [];
  let learned = 0; // last ayah learned by the learning days so far
  for (let day = 1; day <= totalDays; day++) {
    const isScheduledReview =
      planDays === 7 ? day === 7 : REVIEW_DAYS_30.has(day);
    const chunk = chunkByDay.get(day) ?? null;
    if (isScheduledReview) {
      days.push({
        day,
        startAyah: null,
        endAyah: null,
        label:
          planDays === 7
            ? `Review — all ${ayahCount} ayahs`
            : `Review — ayahs 1–${learned}`,
        isReview: true,
      });
    } else if (chunk === null) {
      days.push({
        day,
        startAyah: null,
        endAyah: null,
        label: 'Review — ayahs learned so far',
        isReview: true,
      });
    } else {
      days.push({
        day,
        startAyah: chunk.start,
        endAyah: chunk.end,
        label: chunkLabel(chunk.start, chunk.end),
        isReview: false,
      });
      learned = chunk.end;
    }
  }
  return { surahSlug, surahId, planDays, days };
}

const PLAN_CACHE = new Map<string, SurahPlan>();

export function getPlan(
  surahSlug: string,
  planDays: 7 | 30,
): SurahPlan | undefined {
  const key = `${surahSlug}:${planDays}`;
  const cached = PLAN_CACHE.get(key);
  if (cached) return cached;
  const surah = getSurahBySlug(surahSlug);
  if (!surah) return undefined;
  const plan = buildSurahPlan(surah.slug, surah.id, surah.ayahCount, planDays);
  PLAN_CACHE.set(key, plan);
  return plan;
}

export function getPlanDay(
  plan: SurahPlan | JuzAmmaPlan,
  day: number,
): PlanDay | undefined {
  return plan.days.find((d) => d.day === day);
}


export const JUZ_AMMA_90_DAY: JuzAmmaPlan = {
  planDays: 90,
  days: [
    { day: 1, surahSlug: 'al-asr', surahId: 103, startAyah: 1, endAyah: 3, label: 'Al-\'Asr 1–3', isReview: false },
    { day: 2, surahSlug: 'al-kawthar', surahId: 108, startAyah: 1, endAyah: 3, label: 'Al-Kawthar 1–3', isReview: false },
    { day: 3, surahSlug: 'an-nasr', surahId: 110, startAyah: 1, endAyah: 3, label: 'An-Nasr 1–3', isReview: false },
    { day: 4, surahSlug: 'quraysh', surahId: 106, startAyah: 1, endAyah: 4, label: 'Quraysh 1–4', isReview: false },
    { day: 5, surahSlug: 'al-ikhlas', surahId: 112, startAyah: 1, endAyah: 4, label: 'Al-Ikhlas 1–4', isReview: false },
    { day: 6, surahSlug: 'al-qadr', surahId: 97, startAyah: 1, endAyah: 5, label: 'Al-Qadr 1–5', isReview: false },
    { day: 7, surahSlug: null, surahId: null, startAyah: null, endAyah: null, label: 'Review — up to Al-Qadr', isReview: true },
    { day: 8, surahSlug: 'al-fil', surahId: 105, startAyah: 1, endAyah: 5, label: 'Al-Fil 1–5', isReview: false },
    { day: 9, surahSlug: 'al-masad', surahId: 111, startAyah: 1, endAyah: 5, label: 'Al-Masad 1–5', isReview: false },
    { day: 10, surahSlug: 'al-falaq', surahId: 113, startAyah: 1, endAyah: 5, label: 'Al-Falaq 1–5', isReview: false },
    { day: 11, surahSlug: 'al-kafirun', surahId: 109, startAyah: 1, endAyah: 6, label: 'Al-Kafirun 1–6', isReview: false },
    { day: 12, surahSlug: 'an-nas', surahId: 114, startAyah: 1, endAyah: 6, label: 'An-Nas 1–6', isReview: false },
    { day: 13, surahSlug: 'al-maun', surahId: 107, startAyah: 1, endAyah: 7, label: 'Al-Ma\'un 1–7', isReview: false },
    { day: 14, surahSlug: null, surahId: null, startAyah: null, endAyah: null, label: 'Review — up to Al-Ma\'un', isReview: true },
    { day: 15, surahSlug: 'ash-sharh', surahId: 94, startAyah: 1, endAyah: 8, label: 'Ash-Sharh 1–8', isReview: false },
    { day: 16, surahSlug: 'at-tin', surahId: 95, startAyah: 1, endAyah: 8, label: 'At-Tin 1–8', isReview: false },
    { day: 17, surahSlug: 'al-bayyinah', surahId: 98, startAyah: 1, endAyah: 8, label: 'Al-Bayyinah 1–8', isReview: false },
    { day: 18, surahSlug: 'az-zalzalah', surahId: 99, startAyah: 1, endAyah: 8, label: 'Az-Zalzalah 1–8', isReview: false },
    { day: 19, surahSlug: 'at-takathur', surahId: 102, startAyah: 1, endAyah: 8, label: 'At-Takathur 1–8', isReview: false },
    { day: 20, surahSlug: 'al-humazah', surahId: 104, startAyah: 1, endAyah: 9, label: 'Al-Humazah 1–9', isReview: false },
    { day: 21, surahSlug: null, surahId: null, startAyah: null, endAyah: null, label: 'Review — up to Al-Humazah', isReview: true },
    { day: 22, surahSlug: 'ad-duhaa', surahId: 93, startAyah: 1, endAyah: 6, label: 'Ad-Duhaa 1–6', isReview: false },
    { day: 23, surahSlug: 'ad-duhaa', surahId: 93, startAyah: 7, endAyah: 11, label: 'Ad-Duhaa 7–11', isReview: false },
    { day: 24, surahSlug: 'al-adiyat', surahId: 100, startAyah: 1, endAyah: 6, label: 'Al-\'Adiyat 1–6', isReview: false },
    { day: 25, surahSlug: 'al-adiyat', surahId: 100, startAyah: 7, endAyah: 11, label: 'Al-\'Adiyat 7–11', isReview: false },
    { day: 26, surahSlug: 'al-qariah', surahId: 101, startAyah: 1, endAyah: 6, label: 'Al-Qari\'ah 1–6', isReview: false },
    { day: 27, surahSlug: 'al-qariah', surahId: 101, startAyah: 7, endAyah: 11, label: 'Al-Qari\'ah 7–11', isReview: false },
    { day: 28, surahSlug: null, surahId: null, startAyah: null, endAyah: null, label: 'Review — up to Al-Qari\'ah', isReview: true },
    { day: 29, surahSlug: 'ash-shams', surahId: 91, startAyah: 1, endAyah: 8, label: 'Ash-Shams 1–8', isReview: false },
    { day: 30, surahSlug: 'ash-shams', surahId: 91, startAyah: 9, endAyah: 15, label: 'Ash-Shams 9–15', isReview: false },
    { day: 31, surahSlug: 'at-tariq', surahId: 86, startAyah: 1, endAyah: 9, label: 'At-Tariq 1–9', isReview: false },
    { day: 32, surahSlug: 'at-tariq', surahId: 86, startAyah: 10, endAyah: 17, label: 'At-Tariq 10–17', isReview: false },
    { day: 33, surahSlug: 'al-infitar', surahId: 82, startAyah: 1, endAyah: 7, label: 'Al-Infitar 1–7', isReview: false },
    { day: 34, surahSlug: 'al-infitar', surahId: 82, startAyah: 8, endAyah: 13, label: 'Al-Infitar 8–13', isReview: false },
    { day: 35, surahSlug: null, surahId: null, startAyah: null, endAyah: null, label: 'Review — up to Al-Infitar', isReview: true },
    { day: 36, surahSlug: 'al-infitar', surahId: 82, startAyah: 14, endAyah: 19, label: 'Al-Infitar 14–19', isReview: false },
    { day: 37, surahSlug: 'al-ala', surahId: 87, startAyah: 1, endAyah: 7, label: 'Al-A\'la 1–7', isReview: false },
    { day: 38, surahSlug: 'al-ala', surahId: 87, startAyah: 8, endAyah: 13, label: 'Al-A\'la 8–13', isReview: false },
    { day: 39, surahSlug: 'al-ala', surahId: 87, startAyah: 14, endAyah: 19, label: 'Al-A\'la 14–19', isReview: false },
    { day: 40, surahSlug: 'al-alaq', surahId: 96, startAyah: 1, endAyah: 7, label: 'Al-\'Alaq 1–7', isReview: false },
    { day: 41, surahSlug: 'al-alaq', surahId: 96, startAyah: 8, endAyah: 13, label: 'Al-\'Alaq 8–13', isReview: false },
    { day: 42, surahSlug: null, surahId: null, startAyah: null, endAyah: null, label: 'Review — up to Al-\'Alaq', isReview: true },
    { day: 43, surahSlug: 'al-alaq', surahId: 96, startAyah: 14, endAyah: 19, label: 'Al-\'Alaq 14–19', isReview: false },
    { day: 44, surahSlug: 'al-balad', surahId: 90, startAyah: 1, endAyah: 7, label: 'Al-Balad 1–7', isReview: false },
    { day: 45, surahSlug: 'al-balad', surahId: 90, startAyah: 8, endAyah: 14, label: 'Al-Balad 8–14', isReview: false },
    { day: 46, surahSlug: 'al-balad', surahId: 90, startAyah: 15, endAyah: 20, label: 'Al-Balad 15–20', isReview: false },
    { day: 47, surahSlug: 'al-layl', surahId: 92, startAyah: 1, endAyah: 7, label: 'Al-Layl 1–7', isReview: false },
    { day: 48, surahSlug: 'al-layl', surahId: 92, startAyah: 8, endAyah: 14, label: 'Al-Layl 8–14', isReview: false },
    { day: 49, surahSlug: null, surahId: null, startAyah: null, endAyah: null, label: 'Review — up to Al-Layl', isReview: true },
    { day: 50, surahSlug: 'al-layl', surahId: 92, startAyah: 15, endAyah: 21, label: 'Al-Layl 15–21', isReview: false },
    { day: 51, surahSlug: 'al-buruj', surahId: 85, startAyah: 1, endAyah: 8, label: 'Al-Buruj 1–8', isReview: false },
    { day: 52, surahSlug: 'al-buruj', surahId: 85, startAyah: 9, endAyah: 15, label: 'Al-Buruj 9–15', isReview: false },
    { day: 53, surahSlug: 'al-buruj', surahId: 85, startAyah: 16, endAyah: 22, label: 'Al-Buruj 16–22', isReview: false },
    { day: 54, surahSlug: 'al-inshiqaq', surahId: 84, startAyah: 1, endAyah: 9, label: 'Al-Inshiqaq 1–9', isReview: false },
    { day: 55, surahSlug: 'al-inshiqaq', surahId: 84, startAyah: 10, endAyah: 17, label: 'Al-Inshiqaq 10–17', isReview: false },
    { day: 56, surahSlug: null, surahId: null, startAyah: null, endAyah: null, label: 'Review — up to Al-Inshiqaq', isReview: true },
    { day: 57, surahSlug: 'al-inshiqaq', surahId: 84, startAyah: 18, endAyah: 25, label: 'Al-Inshiqaq 18–25', isReview: false },
    { day: 58, surahSlug: 'al-ghashiyah', surahId: 88, startAyah: 1, endAyah: 7, label: 'Al-Ghashiyah 1–7', isReview: false },
    { day: 59, surahSlug: 'al-ghashiyah', surahId: 88, startAyah: 8, endAyah: 14, label: 'Al-Ghashiyah 8–14', isReview: false },
    { day: 60, surahSlug: 'al-ghashiyah', surahId: 88, startAyah: 15, endAyah: 20, label: 'Al-Ghashiyah 15–20', isReview: false },
    { day: 61, surahSlug: 'al-ghashiyah', surahId: 88, startAyah: 21, endAyah: 26, label: 'Al-Ghashiyah 21–26', isReview: false },
    { day: 62, surahSlug: 'at-takwir', surahId: 81, startAyah: 1, endAyah: 8, label: 'At-Takwir 1–8', isReview: false },
    { day: 63, surahSlug: null, surahId: null, startAyah: null, endAyah: null, label: 'Review — up to At-Takwir', isReview: true },
    { day: 64, surahSlug: 'at-takwir', surahId: 81, startAyah: 9, endAyah: 15, label: 'At-Takwir 9–15', isReview: false },
    { day: 65, surahSlug: 'at-takwir', surahId: 81, startAyah: 16, endAyah: 22, label: 'At-Takwir 16–22', isReview: false },
    { day: 66, surahSlug: 'at-takwir', surahId: 81, startAyah: 23, endAyah: 29, label: 'At-Takwir 23–29', isReview: false },
    { day: 67, surahSlug: 'al-fajr', surahId: 89, startAyah: 1, endAyah: 8, label: 'Al-Fajr 1–8', isReview: false },
    { day: 68, surahSlug: 'al-fajr', surahId: 89, startAyah: 9, endAyah: 16, label: 'Al-Fajr 9–16', isReview: false },
    { day: 69, surahSlug: 'al-fajr', surahId: 89, startAyah: 17, endAyah: 23, label: 'Al-Fajr 17–23', isReview: false },
    { day: 70, surahSlug: null, surahId: null, startAyah: null, endAyah: null, label: 'Review — up to Al-Fajr', isReview: true },
    { day: 71, surahSlug: 'al-fajr', surahId: 89, startAyah: 24, endAyah: 30, label: 'Al-Fajr 24–30', isReview: false },
    { day: 72, surahSlug: 'al-mutaffifin', surahId: 83, startAyah: 1, endAyah: 9, label: 'Al-Mutaffifin 1–9', isReview: false },
    { day: 73, surahSlug: 'al-mutaffifin', surahId: 83, startAyah: 10, endAyah: 18, label: 'Al-Mutaffifin 10–18', isReview: false },
    { day: 74, surahSlug: 'al-mutaffifin', surahId: 83, startAyah: 19, endAyah: 27, label: 'Al-Mutaffifin 19–27', isReview: false },
    { day: 75, surahSlug: 'al-mutaffifin', surahId: 83, startAyah: 28, endAyah: 36, label: 'Al-Mutaffifin 28–36', isReview: false },
    { day: 76, surahSlug: 'an-naba', surahId: 78, startAyah: 1, endAyah: 10, label: 'An-Naba 1–10', isReview: false },
    { day: 77, surahSlug: null, surahId: null, startAyah: null, endAyah: null, label: 'Review — up to An-Naba', isReview: true },
    { day: 78, surahSlug: 'an-naba', surahId: 78, startAyah: 11, endAyah: 20, label: 'An-Naba 11–20', isReview: false },
    { day: 79, surahSlug: 'an-naba', surahId: 78, startAyah: 21, endAyah: 30, label: 'An-Naba 21–30', isReview: false },
    { day: 80, surahSlug: 'an-naba', surahId: 78, startAyah: 31, endAyah: 40, label: 'An-Naba 31–40', isReview: false },
    { day: 81, surahSlug: 'abasa', surahId: 80, startAyah: 1, endAyah: 11, label: '\'Abasa 1–11', isReview: false },
    { day: 82, surahSlug: 'abasa', surahId: 80, startAyah: 12, endAyah: 22, label: '\'Abasa 12–22', isReview: false },
    { day: 83, surahSlug: 'abasa', surahId: 80, startAyah: 23, endAyah: 32, label: '\'Abasa 23–32', isReview: false },
    { day: 84, surahSlug: null, surahId: null, startAyah: null, endAyah: null, label: 'Review — up to \'Abasa', isReview: true },
    { day: 85, surahSlug: 'abasa', surahId: 80, startAyah: 33, endAyah: 42, label: '\'Abasa 33–42', isReview: false },
    { day: 86, surahSlug: 'an-naziat', surahId: 79, startAyah: 1, endAyah: 12, label: 'An-Nazi\'at 1–12', isReview: false },
    { day: 87, surahSlug: 'an-naziat', surahId: 79, startAyah: 13, endAyah: 24, label: 'An-Nazi\'at 13–24', isReview: false },
    { day: 88, surahSlug: 'an-naziat', surahId: 79, startAyah: 25, endAyah: 35, label: 'An-Nazi\'at 25–35', isReview: false },
    { day: 89, surahSlug: 'an-naziat', surahId: 79, startAyah: 36, endAyah: 46, label: 'An-Nazi\'at 36–46', isReview: false },
    { day: 90, surahSlug: null, surahId: null, startAyah: null, endAyah: null, label: 'Review — up to An-Nazi\'at', isReview: true }
  ],
};
