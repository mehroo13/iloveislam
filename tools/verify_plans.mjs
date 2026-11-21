// tools/verify_plans.mjs — prove the runtime plan generator in
// app/hifz/plans.ts reproduces the old hand-checked static tables
// (git HEAD:app/hifz/plans.ts, saved to /tmp/plans_old.ts) exactly,
// for all 43 launch surahs x both plan lengths (7 and 30 days).
// Run: node tools/verify_plans.mjs   (exit 0 = all 86 plans identical)
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const ROOT = new URL('..', import.meta.url).pathname;
const OLD_TS = '/tmp/plans_old.ts';

function compile(entry, outDir) {
  mkdirSync(outDir, { recursive: true });
  execSync(
    `${ROOT}node_modules/.bin/tsc ${entry} --module commonjs --target es2020 ` +
      `--outDir ${outDir} --skipLibCheck --moduleResolution node`,
    { stdio: 'pipe' },
  );
}

compile(`${ROOT}app/hifz/plans.ts ${ROOT}app/hifz/surahs.ts`, '/tmp/verify-plans-new');
compile(OLD_TS, '/tmp/verify-plans-old');

const requireNew = createRequire('/tmp/verify-plans-new/plans.js');
const requireOld = createRequire('/tmp/verify-plans-old/plans_old.js');
const { getPlan } = requireNew('./plans.js');
const oldPlans = requireOld('./plans_old.js');

// Launch-set slugs, taken from the old tables themselves.
const slugs = Object.keys(oldPlans.PLANS_7_DAY);
if (slugs.length !== 43) throw new Error(`expected 43 launch surahs, got ${slugs.length}`);

let checked = 0;
const failures = [];
for (const slug of slugs) {
  for (const days of [7, 30]) {
    const table = days === 7 ? oldPlans.PLANS_7_DAY : oldPlans.PLANS_30_DAY;
    const expected = table[slug];
    const actual = getPlan(slug, days);
    checked++;
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      failures.push(`${slug} ${days}-day`);
      for (let i = 0; i < Math.max(expected.days.length, actual?.days?.length ?? 0); i++) {
        const e = JSON.stringify(expected.days[i]);
        const a = JSON.stringify(actual?.days?.[i]);
        if (e !== a) console.log(`  MISMATCH ${slug} ${days}d day ${i + 1}:\n    old: ${e}\n    new: ${a}`);
      }
    }
  }
}
// Also verify the 90-day Juz Amma plan is byte-identical.
if (JSON.stringify(requireNew('./plans.js').JUZ_AMMA_90_DAY) !== JSON.stringify(oldPlans.JUZ_AMMA_90_DAY)) {
  failures.push('JUZ_AMMA_90_DAY');
}
if (!existsSync('/tmp/plans_old.ts')) throw new Error('old plans file missing');

console.log(`checked ${checked} surah plans + Juz Amma 90-day: ${failures.length === 0 ? 'ALL IDENTICAL' : 'FAILURES: ' + failures.join(', ')}`);
process.exit(failures.length === 0 ? 0 : 1);
