// tools/test-kashida.mjs — unit test for app/hifz/lib/kashida.ts.
// Compiles the real file with the repo's tsc (DOM lib for the filler
// types) and asserts the pure string helpers: eligibleOffsets +
// insertTatweel. The DOM filler itself (measurement, ResizeObserver) can
// only run in a browser — it is verified live, not here.
// Run: node tools/test-kashida.mjs   (from the repo root)
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = mkdtempSync(join(tmpdir(), 'kashida-test-'));
try {
  execFileSync(join(root, 'node_modules', '.bin', 'tsc'), [
    join(root, 'app', 'hifz', 'lib', 'kashida.ts'),
    '--outDir', outDir,
    '--module', 'commonjs',
    '--target', 'es2020',
    '--lib', 'es2020,dom',
    '--skipLibCheck',
  ], { cwd: root, stdio: 'pipe' });
} catch (err) {
  console.error('tsc failed:', err.stdout?.toString() ?? err.message);
  process.exit(1);
}
const require = createRequire(import.meta.url);
const { eligibleOffsets, insertTatweel, TATWEEL } = require(join(outDir, 'kashida.js'));

const T = '\u0640'; // tatweel, for readable expectations
assert.equal(TATWEEL, T);

const cases = [
  // [input, expected offsets]
  ['\u0627\u0644\u0643\u062A\u0627\u0628', [2, 3, 4]], // الكتاب — after ل، ك، ت
  ['\u0641\u064A', []], // في — two letters, nowhere to stretch
  ['\u0627\u0644\u0644\u0647', [2, 3]], // الله — after both lams
  ['\u064A\u064F\u0624\u0652\u0645\u0650\u0646\u064F\u0648\u0646', [6, 8]], // يُؤْمِنُونَ — after م (past its kasra) and ن (past its damma)
  ['\u0627\u0644\u0645', [2]], // الم — after ل only
  // One tatweel already after ت: the same spot stays eligible (cap is 3).
  ['\u0627\u0644\u0643\u062A\u0640\u0627\u0628', [2, 3, 5]], // الكتـاب
  // Three tatweels already after ت: that spot is capped, the others stay.
  ['\u0627\u0644\u0643\u062A\u0640\u0640\u0640\u0627\u0628', [2, 3]],
  // Pause mark ends the word: no tatweel before it.
  ['\u0631\u064E\u064A\u0652\u0628\u064E\u06DB', [4]], // رَيْبَۛ — after ي only
  // Indo-Pak: the head mark on ل must not be split; tatweel goes after it.
  ['\u0627\u0644\u06E1\u06AA\u0650\u062A\u0670\u0627\u0628\u064F', [3, 5, 7]], // الۡڪِتٰبُ
];
for (const [input, expected] of cases) {
  assert.deepEqual(
    eligibleOffsets(input),
    expected,
    `eligibleOffsets(${JSON.stringify(input)})`,
  );
}

// Exact insertion: one tatweel after ل، ك، ت.
assert.equal(
  insertTatweel('\u0627\u0644\u0643\u062A\u0627\u0628', [2, 3, 4], 1),
  '\u0627\u0644\u0640\u0643\u0640\u062A\u0640\u0627\u0628',
);
// Two per point.
assert.equal(
  insertTatweel('\u0627\u0644\u0643\u062A\u0627\u0628', [2, 3, 4], 2),
  '\u0627\u0644\u0640\u0640\u0643\u0640\u0640\u062A\u0640\u0640\u0627\u0628',
);
// Properties: stripping tatweel restores the tatweel-free base text
// (inputs that already carry a tatweel lose that one too when stripped);
// length grows by exactly one tatweel per point per round.
for (const [input] of cases) {
  const filled = insertTatweel(input, eligibleOffsets(input), 2);
  assert.equal(filled.replaceAll(T, ''), input.replaceAll(T, ''));
  assert.equal(filled.length, input.length + eligibleOffsets(input).length * 2);
}

rmSync(outDir, { recursive: true, force: true });
console.log(`kashida: ${cases.length} eligibleOffsets cases + insertTatweel checks passed.`);
