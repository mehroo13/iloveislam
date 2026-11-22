// tools/validate_plans.mjs — validate EVERY Hifz plan against the Quran's
// official surah/ayah counts.
//
// Checks:
//   A. app/hifz/surahs.ts itself: 114 surahs, ids 1-114, unique slugs, and
//      every ayahCount matches the official Madani-mushaf count below
//      (total 6,236 ayahs). The repo's surahs.ts is the runtime authority;
//      the table below is the independent cross-check — any mismatch here
//      is a data error in surahs.ts, not in a plan.
//   B. Every per-surah plan (114 surahs x 7-day and 30-day = 228 plans):
//      days numbered 1..planDays in order; learning days cover the surah's
//      ayahs 1..N exactly once, contiguously, never mid-ayah, never
//      out of range; every day label matches its own range; review days
//      have no ayah range and their labels state the correct "learned so
//      far" count (7-day day 7 = all N ayahs; 30-day days 7/14/21 =
//      ayahs 1-K where K is the last ayah learned so far; day 30 =
//      ayahs 1-N); empty learning chunks become review days.
//   C. The Juz Amma 90-day plan: 90 days numbered 1..90; every learning
//      day's range lies inside its surah and its label matches the range;
//      per surah, the day chunks cover 1..N exactly once, contiguously;
//      all 37 Juz Amma surahs (78-114) are covered fully, and no surah
//      outside Juz Amma appears.
//
// Run: node tools/validate_plans.mjs   (exit 0 = all checks pass)
// The script compiles the TypeScript sources with the repo's own tsc
// into a temp dir, exactly like tools/verify_plans.mjs does.
import { execSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const ROOT = new URL('..', import.meta.url).pathname;

// Official ayah counts per surah (Madani mushaf), surah 1..114.
// Sum = 6,236.
const OFFICIAL_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
  54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60,
  49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52,
  44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19,
  26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3,
  6, 3, 5, 4, 5, 6,
];

const failures = [];
const fail = (where, detail) => failures.push(`${where}: ${detail}`);

function compile() {
  const outDir = mkdtempSync(join(tmpdir(), 'validate-plans-'));
  execSync(
    `${ROOT}node_modules/.bin/tsc ${ROOT}app/hifz/plans.ts ${ROOT}app/hifz/surahs.ts ` +
      `--module commonjs --target es2020 --outDir ${outDir} --skipLibCheck --moduleResolution node`,
    { stdio: 'pipe' },
  );
  return createRequire(join(outDir, 'plans.js'));
}

const req = compile();
const { getPlan, JUZ_AMMA_90_DAY } = req('./plans.js');
const { ALL_SURAHS, getSurahBySlug } = req('./surahs.js');

// --- A. surahs.ts against the official counts -------------------------------
let surahChecks = 0;
if (ALL_SURAHS.length !== 114) fail('surahs.ts', `expected 114 surahs, got ${ALL_SURAHS.length}`);
const seenSlugs = new Set();
let total = 0;
for (const s of ALL_SURAHS) {
  surahChecks++;
  total += s.ayahCount;
  if (s.id < 1 || s.id > 114) fail(`surahs.ts#${s.id}`, `id out of range: ${s.id}`);
  if (seenSlugs.has(s.slug)) fail(`surahs.ts#${s.id}`, `duplicate slug ${s.slug}`);
  seenSlugs.add(s.slug);
  const official = OFFICIAL_AYAH_COUNTS[s.id - 1];
  if (s.ayahCount !== official) {
    fail(
      `surahs.ts#${s.id} (${s.slug})`,
      `ayahCount ${s.ayahCount} != official ${official}`,
    );
  }
}
if (total !== 6236) fail('surahs.ts', `total ayahs ${total} != 6,236`);
const hud = getSurahBySlug('hud');
if (!hud || hud.ayahCount !== 123) {
  fail('surahs.ts#11 (hud)', `Hud ayahCount is ${hud?.ayahCount}, expected 123`);
}

// --- B. per-surah 7-day and 30-day plans ------------------------------------
const REVIEW_DAYS_30 = new Set([7, 14, 21, 30]);
let planChecks = 0;

function expectedLabel(start, end) {
  return start === end ? `Ayah ${start}` : `Ayahs ${start}–${end}`;
}

for (const surah of ALL_SURAHS) {
  const n = surah.ayahCount;
  for (const planDays of [7, 30]) {
    planChecks++;
    const where = `${surah.slug} ${planDays}-day`;
    const plan = getPlan(surah.slug, planDays);
    if (!plan) { fail(where, 'plan missing'); continue; }
    if (plan.surahSlug !== surah.slug || plan.surahId !== surah.id) {
      fail(where, `plan surah mismatch: ${plan.surahSlug}/${plan.surahId}`);
    }
    if (plan.days.length !== planDays) {
      fail(where, `expected ${planDays} days, got ${plan.days.length}`);
      continue;
    }
    let nextAyah = 1; // first ayah not yet covered by a learning day
    let learned = 0; // last ayah learned so far (for review labels)
    for (const d of plan.days) {
      if (d.day < 1 || d.day > planDays) fail(where, `day number out of range: ${d.day}`);
      const scheduledReview = planDays === 7 ? d.day === 7 : REVIEW_DAYS_30.has(d.day);
      if (scheduledReview) {
        if (!d.isReview || d.startAyah !== null || d.endAyah !== null) {
          fail(where, `day ${d.day}: scheduled review day carries an ayah range`);
        }
        const want =
          planDays === 7
            ? `Review — all ${n} ayahs`
            : d.day === 30
              ? `Review — ayahs 1–${n}`
              : `Review — ayahs 1–${learned}`;
        if (d.label !== want) {
          fail(where, `day ${d.day}: review label "${d.label}" != expected "${want}"`);
        }
      } else if (d.isReview) {
        // Empty learning chunk (short surah): must be a plain review day.
        if (d.startAyah !== null || d.endAyah !== null) {
          fail(where, `day ${d.day}: review day carries an ayah range`);
        }
        if (d.label !== 'Review — ayahs learned so far') {
          fail(where, `day ${d.day}: empty-chunk label "${d.label}" unexpected`);
        }
      } else {
        if (d.startAyah === null || d.endAyah === null) {
          fail(where, `day ${d.day}: learning day has no ayah range`);
          continue;
        }
        if (d.startAyah !== nextAyah) {
          fail(where, `day ${d.day}: starts at ayah ${d.startAyah}, expected ${nextAyah} (gap or overlap)`);
        }
        if (d.endAyah < d.startAyah) {
          fail(where, `day ${d.day}: inverted range ${d.startAyah}–${d.endAyah}`);
        }
        if (d.endAyah > n) {
          fail(where, `day ${d.day}: end ayah ${d.endAyah} exceeds surah total ${n}`);
        }
        const want = expectedLabel(d.startAyah, d.endAyah);
        if (d.label !== want) {
          fail(where, `day ${d.day}: label "${d.label}" != expected "${want}"`);
        }
        nextAyah = d.endAyah + 1;
        learned = d.endAyah;
      }
    }
    if (nextAyah !== n + 1) {
      fail(where, `coverage ends at ayah ${nextAyah - 1}, surah has ${n} — ${n + 1 - nextAyah} ayah(s) never covered`);
    }
    if (learned !== n) {
      fail(where, `last ayah learned is ${learned}, surah has ${n} — plan finishes before the full portion is covered`);
    }
  }
}

// --- C. Juz Amma 90-day plan -------------------------------------------------
let juzAmmaChecks = 0;
{
  const where = 'juz-amma 90-day';
  juzAmmaChecks++;
  const plan = JUZ_AMMA_90_DAY;
  if (!plan || plan.planDays !== 90 || plan.days.length !== 90) {
    fail(where, `expected a 90-day plan with 90 days, got ${plan?.days?.length}`);
  } else {
    const covered = new Map(); // surahId -> { next: number, total: number, name: string }
    for (const d of plan.days) {
      if (d.day < 1 || d.day > 90) fail(where, `day number out of range: ${d.day}`);
      if (d.isReview) {
        if (d.surahSlug !== null || d.surahId !== null || d.startAyah !== null || d.endAyah !== null) {
          fail(where, `day ${d.day}: review day carries a surah/ayah range`);
        }
        continue;
      }
      const surah = d.surahId ? ALL_SURAHS.find((s) => s.id === d.surahId) : undefined;
      if (!surah || surah.slug !== d.surahSlug) {
        fail(where, `day ${d.day}: unknown surah ${d.surahSlug}/${d.surahId}`);
        continue;
      }
      if (surah.id < 78 || surah.id > 114) {
        fail(where, `day ${d.day}: surah ${surah.slug} (${surah.id}) is not in Juz Amma (78-114)`);
      }
      if (d.startAyah === null || d.endAyah === null) {
        fail(where, `day ${d.day}: learning day has no ayah range`);
        continue;
      }
      const state = covered.get(surah.id) ?? { next: 1, total: surah.ayahCount, name: surah.name };
      if (d.startAyah !== state.next) {
        fail(where, `day ${d.day}: ${surah.slug} starts at ayah ${d.startAyah}, expected ${state.next} (gap or overlap)`);
      }
      if (d.endAyah < d.startAyah || d.endAyah > surah.ayahCount) {
        fail(where, `day ${d.day}: ${surah.slug} range ${d.startAyah}–${d.endAyah} invalid (surah has ${surah.ayahCount})`);
      }
      const want = `${surah.name} ${d.startAyah}–${d.endAyah}`;
      if (d.label !== want) {
        fail(where, `day ${d.day}: label "${d.label}" != expected "${want}"`);
      }
      state.next = d.endAyah + 1;
      covered.set(surah.id, state);
    }
    for (let id = 78; id <= 114; id++) {
      const state = covered.get(id);
      const surah = ALL_SURAHS.find((s) => s.id === id);
      if (!state) {
        fail(where, `surah ${surah.slug} (${id}) never appears in the plan`);
      } else if (state.next !== state.total + 1) {
        fail(where, `surah ${surah.slug} (${id}) covered only to ayah ${state.next - 1} of ${state.total}`);
      }
    }
    if (covered.size !== 37) {
      fail(where, `expected 37 Juz Amma surahs, plan covers ${covered.size}`);
    }
  }
}

// --- Report ------------------------------------------------------------------
console.log(`surah data: ${surahChecks} surahs checked against official counts (total ${total} ayahs)`);
console.log(`per-surah plans: ${planChecks} plans checked (114 surahs x 7-day and 30-day)`);
console.log(`juz-amma plan: ${juzAmmaChecks} plan checked (90 days, 37 surahs)`);
console.log(`Hud cross-check: surah 11 Hud = ${hud?.ayahCount} ayahs (official: 123)`);
if (failures.length === 0) {
  console.log('RESULT: ALL CHECKS PASSED — no discrepancies found.');
  process.exit(0);
} else {
  console.log(`RESULT: ${failures.length} DISCREPANCY(IES) FOUND:`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
