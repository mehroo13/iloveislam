// app/hifz/components/TestClient.tsx — Test Mode (spec §22, report §4.2).
// Sheikh-style test: random starts from your range, the first few words as
// the prompt, hidden words reveal as you recite correctly. The question
// card is dark navy with a deck behind it, a blue-gradient footer, "Round:
// N of 10", a segmented progress bar, stat pills, ‹ / « reveal arrows and
// a big green stop button. Scoring: a question counts as correct only with
// zero mistakes; a reveal counts as a mistake; the mistakes counter is a
// running total for the whole session. Temporary Session records nothing.
// All free, unlimited — no promotion, no paywall, no cross-device sync
// (device-local; export/import on My Progress).
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  loadProgress, saveProgress, markAttempt, recordMinutes, recordTypeActivity,
  loadMistakes, saveMistakes, addMistake, markMistakesCorrected, pickTestPool, revisionDue,
  type HifzProgress, type MistakeEntry,
} from '../progress';
import { buildTestInsights, type TestInsight } from '../lib/insights';
import { ALL_SURAHS, getSurahById } from '../surahs';
import { getJuz } from '../juz';
import { saveBestTestPct } from '../badges';
import { loadTestSessions, saveTestSession, loadInProgressTest, saveInProgressTest, clearInProgressTest, type TestSessionRecord, type InProgressTest } from '../lib/mode';
import { RangeWheel, type RangeSelection } from './SharedSheets';
import { useT } from '../lib/i18n';
import { playTestFeedback } from '../lib/sounds';

type Scope = 'memorised' | 'practised' | 'any' | 'weakest';
type Phase = 'setup' | 'testing' | 'done';
type Duration = 5 | 10 | 20;
/** Per-test time limit in minutes (0 = no limit). */
type TimeLimitMinutes = 0 | 5 | 10 | 15 | 30;
/** The six test types (Stage 4, Part 6). */
type TestType = 'sequential' | 'random' | 'middle' | 'completion' | 'revision' | 'difficult';

interface TestQuestion {
  surah: number;
  ayah: number;
  span: number;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}

function allAyahs(): TestQuestion[] {
  const out: TestQuestion[] = [];
  for (const s of ALL_SURAHS) {
    for (let a = 1; a <= s.ayahCount; a++) out.push({ surah: s.id, ayah: a, span: 1 });
  }
  return out;
}

/** Question length, in mushaf lines (1–15). The slider is the single
 *  source of truth; the presets below just set it.
 *  Lines → ayahs uses the real Quran totals: 6,236 ayahs across 604
 *  pages × 15 lines = 9,060 lines, so one line is ~0.69 ayahs. A long
 *  ayah covers more lines than a short one, so the span is approximate
 *  — the question text itself is what the user recites, and it always
 *  covers the full span (see loadQuestion). */
const LINES_PER_AYAH = 6236 / 9060;
/** Preset line counts for the Short / Medium / Long buttons. */
const LINE_PRESETS = { short: 2, medium: 5, long: 10 } as const;
/** Words per mushaf line, for the "stop mid-ayah" cap when "Extend
 *  question to the ayah's end" is off: ~77,430 words ÷ 9,060 lines. */
const WORDS_PER_LINE = 9;

export default function TestClient() {
  const [progress, setProgress] = useState<HifzProgress | null>(null);
  const [scope, setScope] = useState<Scope>('memorised');
  const [duration, setDuration] = useState<Duration>(10);
  /** Question length in mushaf lines, 1–15 (default 5). Wired into the
   *  question span by spanFor — this slider is live, not decorative. */
  const [qLines, setQLines] = useState(5);
  /** Per-test time limit in minutes (0 = unlimited, the default). */
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<TimeLimitMinutes>(0);
  const [extendToEnd, setExtendToEnd] = useState(true);
  const [temporary, setTemporary] = useState(false);
  const [ranges, setRanges] = useState<RangeSelection[]>([]);
  const [phase, setPhase] = useState<Phase>('setup');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [mistakesTotal, setMistakesTotal] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  // Stage 4: test type, starting point, pause, history.
  const [testType, setTestType] = useState<TestType>('random');
  const [startSurah, setStartSurah] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('ili_last_read_v1');
      if (raw) {
        const parsed = JSON.parse(raw) as { surah?: number };
        if (typeof parsed.surah === 'number' && parsed.surah >= 1 && parsed.surah <= 114) return parsed.surah;
      }
    } catch {
      /* default */
    }
    return 1;
  });
  const [startAyah, setStartAyah] = useState(1);
  const [paused, setPaused] = useState(false);
  const [sessions, setSessions] = useState<TestSessionRecord[]>(() => loadTestSessions());
  // Stage 6 (§19): an unfinished test left mid-way, resumable from the setup screen.
  const [unfinished, setUnfinished] = useState<InProgressTest | null>(() => loadInProgressTest());
  const t = useT();

  // Question card state
  const [prompt, setPrompt] = useState<string>('');
  const [promptWords, setPromptWords] = useState<string[]>([]);
  const [revealedWords, setRevealedWords] = useState(0);
  const [revealedRest, setRevealedRest] = useState(false);
  const [loadingQ, setLoadingQ] = useState(false);
  const [eyeOff, setEyeOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [streak, setStreak] = useState(0);
  /** Colour flash after marking: the card turns green on Correct, red
   *  on Missed, for a beat before the next question loads. */
  const [markFlash, setMarkFlash] = useState<'correct' | 'missed' | null>(null);
  /** True when the test ended because the time limit ran out. */
  const [timeUp, setTimeUp] = useState(false);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Clear a pending advance if the component unmounts mid-flash.
  useEffect(() => () => {
    if (advanceRef.current) clearTimeout(advanceRef.current);
  }, []);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Stage 6 (§19): the timer writes elapsed into state every second; the
  // persist effect below reads it from a ref so it does not re-save on
  // every tick — only when the test state itself changes.
  const elapsedRef = useRef(0);
  const startedAtRef = useRef<string>(new Date().toISOString());
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  // Stage 6 (§19): persist the in-progress test whenever its state
  // changes, so closing the tab mid-test leaves something resumable.
  // A finished test clears it (see the done effect below).
  useEffect(() => {
    if (phase !== 'testing' || questions.length === 0) return;
    saveInProgressTest({
      questions,
      idx,
      results,
      mistakes: mistakesTotal,
      seconds: elapsedRef.current,
      type: testType,
      scope,
      timeLimitMinutes,
      startedAt: startedAtRef.current,
      temporary,
    });
  }, [phase, questions, idx, results, mistakesTotal, testType, scope, timeLimitMinutes, temporary]);

  // Persist the best Test Mode score for the accuracy badges (see badges.ts),
  // and record the completed session in the local test history.
  // Temporary sessions record nothing — the test page says so.
  useEffect(() => {
    if (phase !== 'done') return;
    // Stage 6 (§19): a finished test is no longer unfinished.
    clearInProgressTest();
    setUnfinished(null);
    if (temporary) return;
    const total = results.length;
    if (total === 0) return;
    const pct = Math.round((results.filter(Boolean).length / total) * 100);
    saveBestTestPct(pct);
    setSessions(
      saveTestSession({
        at: new Date().toISOString(),
        type: testType,
        scope,
        score: results.filter(Boolean).length,
        total,
        mistakes: mistakesTotal,
        seconds: elapsed,
        missed: questions
          .filter((_, i) => !results[i])
          .map((q) => ({ surah: q.surah, ayah: q.ayah, span: q.span })),
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    try {
      setProgress(loadProgress());
    } catch {
      setProgress(null);
    }
  }, []);

  useEffect(() => {
    if (phase === 'testing' && !paused) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    return undefined;
  }, [phase, paused]);

  // Time limit enforcement: when a limit is set and the clock reaches
  // it, the test ends now (the current unanswered question counts as
  // missed on the done screen). 0 = unlimited, never enforced.
  useEffect(() => {
    if (phase === 'testing' && timeLimitMinutes > 0 && elapsed >= timeLimitMinutes * 60) {
      setTimeUp(true);
      setPhase('done');
    }
  }, [phase, elapsed, timeLimitMinutes]);

  const counts = useMemo(() => {
    if (!progress) return { memorised: 0, learning: 0, practised: 0 };
    let memorised = 0;
    let learning = 0;
    for (const a of Object.values(progress.ayahs)) {
      if (a.status === 'memorised') memorised += 1;
      else if (a.status === 'learning') learning += 1;
    }
    return { memorised, learning, practised: memorised + learning };
  }, [progress]);

  const weakestCount = useMemo(() => {
    try {
      // Corrected mistakes are history, not weak spots — they must not
      // keep an ayah in the weakest count (or pool) once fixed.
      return new Set(
        loadMistakes().filter((m) => !m.corrected).map((m) => `${m.surah}:${m.ayah}`),
      ).size;
    } catch {
      return 0;
    }
  }, [progress]);

  const spanFor = useCallback(() => {
    // Lines → ayahs from the real Quran totals (see LINES_PER_AYAH).
    // 1 line → 1 ayah minimum; 15 lines → 10 ayahs, so the longest
    // questions genuinely reach fifteen mushaf lines.
    const base = Math.max(1, Math.round(qLines * LINES_PER_AYAH));
    // "Extend Question to Ayah's End" (on by default): a question runs to
    // the end of its final ayah. Off = it can stop mid-ayah, so cap at 1
    // ayah and let loadQuestion truncate the words to the line count.
    return extendToEnd ? base : 1;
  }, [qLines, extendToEnd]);

  const withSpan = useCallback(
    (qs: { surah: number; ayah: number }[]) => {
      const span = spanFor();
      return qs.map((q) => {
        const surah = getSurahById(q.surah);
        const maxSpan = surah ? Math.min(span, surah.ayahCount - q.ayah + 1) : 1;
        return { ...q, span: Math.max(1, maxSpan) };
      });
    },
    [spanFor],
  );

  const shuffle = useCallback(<T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, []);

  /** Expand the custom ranges (Surah / Juz / Hizb / Rub / Page) into an
   *  ordered ayah list, from real data — never invented boundaries.
   *  Juz segments come from juz.ts (generated from Quran.com); mushaf
   *  pages are fetched live through the proxy. Hizb and Rub have no
   *  stored boundaries on this device, so they test their whole Juz
   *  (the UI says so). */
  const rangeAyahs = useCallback(async (): Promise<{ surah: number; ayah: number }[]> => {
    const out: { surah: number; ayah: number }[] = [];
    const pushJuz = (n: number) => {
      const j = getJuz(n);
      if (!j) return;
      for (const seg of j.segments) {
        for (let a = seg.fromAyah; a <= seg.toAyah; a++) out.push({ surah: seg.surahId, ayah: a });
      }
    };
    for (const r of ranges) {
      if (r.kind === 'surah') {
        const s = getSurahById(r.id);
        if (s) for (let a = 1; a <= s.ayahCount; a++) out.push({ surah: s.id, ayah: a });
      } else if (r.kind === 'juz') {
        pushJuz(r.id);
      } else if (r.kind === 'hizb') {
        pushJuz(Math.ceil(r.id / 2));
      } else if (r.kind === 'rub') {
        pushJuz(Math.ceil(r.id / 4));
      } else if (r.kind === 'page') {
        try {
          const res = await fetch(`/api/quran/verses/by_page/${r.id}?fields=text_indopak`);
          if (!res.ok) continue;
          const data = await res.json();
          for (const v of (data?.verses ?? []) as { verse_key?: string }[]) {
            const [s, a] = String(v.verse_key ?? '').split(':').map(Number);
            if (Number.isInteger(s) && Number.isInteger(a)) out.push({ surah: s, ayah: a });
          }
        } catch {
          /* a page that cannot load is skipped, not faked */
        }
      }
    }
    return out;
  }, [ranges]);

  const poolForScope = useCallback(
    (prog: HifzProgress, count: number): TestQuestion[] => {
      if (scope === 'weakest') {
        const mistakes = loadMistakes();
        const byAyah = new Map<string, number>();
        for (const m of mistakes) {
          // Corrected mistakes are fixed — they must not keep an ayah
          // dominating the weakest pool.
          if (m.corrected) continue;
          const k = `${m.surah}:${m.ayah}`;
          byAyah.set(k, (byAyah.get(k) ?? 0) + m.attempts);
        }
        const ranked = [...byAyah.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([k]) => {
            const [s, ay] = k.split(':').map(Number);
            return { surah: s, ayah: ay };
          });
        const pool = withSpan(ranked.slice(0, count));
        return pool.length >= count ? pool : [...pool, ...withSpan(pickTestPool(prog, allAyahs(), count - pool.length))];
      }
      if (scope === 'memorised') {
        const mem = Object.entries(prog.ayahs)
          .filter(([, a]) => a.status === 'memorised')
          .map(([key]) => {
            const [s, ay] = key.split(':').map(Number);
            return { surah: s, ayah: ay };
          });
        let pool = withSpan(pickTestPool({ ...prog, ayahs: Object.fromEntries(Object.entries(prog.ayahs).filter(([, a]) => a.status === 'memorised')) }, mem, count));
        if (pool.length < count) pool = withSpan(pickTestPool(prog, allAyahs(), count));
        return pool;
      }
      if (ranges.length > 0) {
        // Custom range from the range wheel — Surah only here; Juz /
        // Hizb / Rub / Page ranges are expanded by rangeAyahs() in
        // startTest (async: pages need a live fetch). This branch stays
        // sync for the random scope path.
        const picked: { surah: number; ayah: number }[] = [];
        for (const r of ranges) {
          if (r.kind === 'surah') {
            const s = getSurahById(r.id);
            if (s) for (let a = 1; a <= s.ayahCount; a++) picked.push({ surah: s.id, ayah: a });
          }
        }
        if (picked.length > 0) return withSpan(pickTestPool(prog, picked, count));
      }
      return withSpan(pickTestPool(prog, allAyahs(), count));
    },
    [scope, ranges, withSpan],
  );

  const loadQuestion = useCallback(async (q: TestQuestion) => {
    setLoadingQ(true);
    setPrompt('');
    setPromptWords([]);
    setRevealedWords(0);
    setRevealedRest(false);
    try {
      // Fetch every ayah in the span, not just the first: a 15-line
      // question spans several ayahs, and the hidden words must cover
      // all of them or the length setting is a lie.
      const parts = await Promise.all(
        Array.from({ length: q.span }, (_, k) => q.ayah + k).map(async (ayah) => {
          const res = await fetch(
            `/api/quran/verses/by_key/${q.surah}:${ayah}?fields=text_indopak&translations=20`,
          );
          if (!res.ok) throw new Error('Verse request failed');
          return res.json();
        }),
      );
      const allWords: string[] = [];
      for (const data of parts) {
        const arabic: unknown = data?.verse?.text_indopak;
        if (typeof arabic === 'string' && arabic.trim()) {
          allWords.push(...arabic.trim().replace(/[ﭐ-﷿]/g, '').split(/\s+/).filter(Boolean));
        }
      }
      if (allWords.length === 0) throw new Error('Verse request failed');
      // "Extend to the ayah's end" off: stop mid-ayah at the line count
      // (about 9 words per mushaf line). On: the whole span, to the end
      // of the final ayah.
      const words = extendToEnd ? allWords : allWords.slice(0, Math.max(3, qLines * WORDS_PER_LINE));
      setPromptWords(words);
      // The prompt is the first few words; the rest stays hidden.
      setPrompt(words.slice(0, 3).join(' '));
      setRevealedWords(3);
    } catch {
      setNotice('The question text could not be loaded — check your connection and try again.');
    } finally {
      setLoadingQ(false);
    }
  }, [extendToEnd, qLines]);

  const startTest = useCallback(async () => {
    if (!progress) return;
    let pool: TestQuestion[] = [];
    if (testType === 'revision') {
      // Revision: ayahs due (oldest first), up to the chosen length.
      pool = withSpan(
        revisionDue(progress, new Date(), duration).map((r) => ({ surah: r.surah, ayah: r.ayah })),
      );
      if (pool.length === 0) {
        setNotice('Nothing is due for revision right now — recite with the coach first.');
        return;
      }
    } else if (testType === 'difficult') {
      // Difficult ayah: the most-missed ayahs first (scope is Weakest).
      pool = poolForScope(progress, duration);
    } else if (testType === 'sequential' || testType === 'middle' || testType === 'completion') {
      // Ordered tests run through a range in mushaf order. The base is
      // the custom ranges when set, else the starting surah.
      const base =
        ranges.length > 0
          ? await rangeAyahs()
          : (() => {
              const s = getSurahById(startSurah);
              const out: { surah: number; ayah: number }[] = [];
              if (s) for (let a = 1; a <= s.ayahCount; a++) out.push({ surah: s.id, ayah: a });
              return out;
            })();
      if (base.length === 0) {
        setNotice('That range could not be loaded — check your connection and try again.');
        return;
      }
      let startIdx = 0;
      if (testType === 'middle') {
        // Start from the middle: a random ayah in the middle third of the
        // range — the test never starts at the beginning of the surah.
        const lo = Math.floor(base.length / 3);
        const hi = Math.floor((2 * base.length) / 3);
        startIdx = lo + Math.floor(Math.random() * Math.max(1, hi - lo));
      } else {
        const i = base.findIndex((q) => q.surah === startSurah && q.ayah === startAyah);
        startIdx = i >= 0 ? i : 0;
      }
      // Surah completion runs to the end of the surah (capped at 20
      // questions so a long surah stays a sane test).
      const count =
        testType === 'completion' ? Math.min(20, base.length - startIdx) : duration;
      pool = withSpan(base.slice(startIdx, startIdx + count));
    } else {
      // Random ayah: random questions only from the chosen range.
      if (ranges.length > 0) {
        const picked = await rangeAyahs();
        if (picked.length > 0) {
          pool = withSpan(shuffle(picked).slice(0, duration));
        }
      }
      if (pool.length === 0) pool = poolForScope(progress, duration);
    }
    if (pool.length === 0) {
      setNotice('Nothing to test yet — recite an ayah with the coach first, or pick “Anything”.');
      return;
    }
    startedAtRef.current = new Date().toISOString();
    setUnfinished(null);
    setQuestions(pool);
    setIdx(0);
    setResults([]);
    setMistakesTotal(0);
    setElapsed(0);
    setStreak(0);
    setPaused(false);
    setMarkFlash(null);
    setTimeUp(false);
    setPhase('testing');
    void loadQuestion(pool[0]);
  }, [progress, duration, poolForScope, loadQuestion, testType, ranges, rangeAyahs, startSurah, startAyah, withSpan, shuffle]);

  /** Stage 6 (§19): resume an unfinished test where it stopped. The
   *  answered questions keep their results; the timer picks up from the
   *  saved elapsed time. The current question reloads its prompt. */
  const resumeTest = useCallback(() => {
    const saved = loadInProgressTest();
    if (!saved) {
      setUnfinished(null);
      return;
    }
    startedAtRef.current = saved.startedAt;
    setTestType(saved.type as TestType);
    setScope(saved.scope as Scope);
    setTimeLimitMinutes((saved.timeLimitMinutes ?? 0) as TimeLimitMinutes);
    setQuestions(saved.questions);
    setIdx(saved.idx);
    setResults(saved.results);
    setMistakesTotal(saved.mistakes);
    setElapsed(saved.seconds);
    elapsedRef.current = saved.seconds;
    setStreak(0);
    setPaused(false);
    setMarkFlash(null);
    setTimeUp(false);
    setTemporary(saved.temporary);
    setUnfinished(null);
    setPhase('testing');
    void loadQuestion(saved.questions[saved.idx]);
  }, [loadQuestion]);

  const discardUnfinished = useCallback(() => {
    clearInProgressTest();
    setUnfinished(null);
  }, []);

  const revealNext = useCallback(() => {
    // Single arrow: reveal the next word — it counts as a mistake.
    setRevealedWords((c) => c + 1);
    setMistakesTotal((m) => m + 1);
  }, []);

  const revealRest = useCallback(() => {
    // Double arrow: reveal the rest of the ayah — it counts as a mistake.
    setRevealedRest(true);
    setMistakesTotal((m) => m + 1);
  }, []);

  const answer = useCallback(
    (correct: boolean) => {
      // Ignore taps while the green/red flash is showing — one mark per
      // question.
      if (!progress || idx >= questions.length || markFlash !== null) return;
      const q = questions[idx];
      // A question counts as correct only with zero mistakes: a reveal, or
      // a missed mark, makes it a miss. The mistakes counter is a running
      // total for the whole session, not per question.
      // Exact rule: correct only if the user marked it correct AND revealed
      // nothing beyond the 3-word prompt (revealedWords stays 3, no «).
      const roundClean = revealedWords <= 3 && !revealedRest;
      const ok = correct && roundClean;
      if (!temporary) {
        let next = progress;
        for (let k = 0; k < q.span; k++) {
          next = markAttempt(next, q.surah, q.ayah + k, ok ? 'correct' : 'miss');
        }
        next = recordMinutes(next, 1);
        next = recordTypeActivity(next, 'revision', q.span);
        saveProgress(next);
        setProgress(next);
        if (!ok) {
          // Log the miss into the word-level mistake log, so test
          // mistakes appear in Mistake History — not just as an ayah
          // reference on the done screen. The anchor is the first word
          // the user could not continue with: the next unrevealed word,
          // or the first hidden word when the rest was revealed. Only
          // logged when the question text actually loaded — a failed
          // load leaves no word to point at, and an empty entry would
          // be invented data.
          const missedIdx = revealedRest
            ? 3
            : Math.min(revealedWords, promptWords.length - 1);
          if (promptWords.length > missedIdx && missedIdx >= 0) {
            const word = promptWords[missedIdx];
            saveMistakes(
              addMistake(loadMistakes(), {
                surah: q.surah,
                ayah: q.ayah,
                word,
                expected: word,
                wordIndex: missedIdx,
                type: 'missed',
                source: 'self-mark',
                date: new Date().toISOString(),
              }),
            );
          }
        } else {
          // A clean recall fixes this ayah's earlier mistakes: history
          // is kept, flagged corrected, and it stops counting as a weak
          // spot (same rule as the coach's clean recitation).
          let log = loadMistakes();
          let changed = false;
          for (let k = 0; k < q.span; k++) {
            const nextLog = markMistakesCorrected(log, q.surah, q.ayah + k);
            if (nextLog !== log) {
              log = nextLog;
              changed = true;
            }
          }
          if (changed) saveMistakes(log);
        }
      }
      if (!ok) setMistakesTotal((m) => m + 1);
      setResults((r) => [...r, ok]);
      setStreak((s) => (ok ? s + 1 : 0));
      // Testing Mode feedback (Settings → Testing Mode): a sound +
      // vibration when a question is finished, if enabled.
      playTestFeedback();
      // Flash the card green (correct) or red (missed) for a beat so the
      // user actually sees it, then move on. The old code advanced
      // instantly, which is why the colour promise could never be seen.
      setMarkFlash(ok ? 'correct' : 'missed');
      if (advanceRef.current) clearTimeout(advanceRef.current);
      advanceRef.current = setTimeout(() => {
        setMarkFlash(null);
        if (idx + 1 >= questions.length) {
          setPhase('done');
        } else {
          const nextIdx = idx + 1;
          setIdx(nextIdx);
          void loadQuestion(questions[nextIdx]);
        }
      }, 900);
    },
    [progress, idx, questions, revealedWords, revealedRest, temporary, loadQuestion, markFlash, promptWords],
  );

  const skip = useCallback(() => {
    // Swipe / Next skips the question (counts as a miss, like a wrong answer).
    answer(false);
  }, [answer]);

  // Per-user insights, generated only from the user's own test sessions
  // and mistake log (see lib/insights). On the done screen the session
  // that just finished is prepended so the numbers include it at once;
  // everywhere else it is the stored history. With no data yet the
  // builder returns honest empty-state text, never an invented tip.
  const insights: TestInsight[] = useMemo(() => {
    let mistakes: MistakeEntry[] = [];
    try {
      mistakes = loadMistakes();
    } catch {
      mistakes = [];
    }
    const sessionList: TestSessionRecord[] =
      phase === 'done' && results.length > 0
        ? [
            {
              at: new Date().toISOString(),
              type: testType,
              scope,
              score: results.filter(Boolean).length,
              total: results.length,
              mistakes: mistakesTotal,
              seconds: elapsed,
              missed: questions
                .filter((_, i) => !results[i])
                .map((q) => ({ surah: q.surah, ayah: q.ayah, span: q.span })),
            },
            ...sessions,
          ]
        : sessions;
    return buildTestInsights({ mistakes, sessions: sessionList, surahs: ALL_SURAHS, t });
  }, [phase, results, questions, mistakesTotal, elapsed, testType, scope, sessions, progress, t]);

  if (progress === null) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <p className="text-sm text-[#5b6b62]">{t('test.loading')}</p>
      </div>
    );
  }

  if (phase === 'done') {
    const score = results.filter(Boolean).length;
    const total = results.length;
    const pct = total === 0 ? 0 : Math.round((score / total) * 100);
    return (
      <div className="space-y-6">
        <section className="rounded-2xl bg-[#102E26] p-6 text-center text-white shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#FFB800]">{t('test.complete')}</p>
          <p className="mt-3 text-5xl font-bold">
            {score}<span className="text-2xl text-white/60"> / {total}</span>
          </p>
          <p className="mt-2 text-sm text-white/80">
            {pct === 100
              ? 'Perfect — every question recalled with zero mistakes. That is real hifz.'
              : pct >= 80
                ? 'Strong recall. The questions you missed are already in your revision queue.'
                : pct >= 50
                  ? 'Halfway there — the missed ayahs need another round with the coach.'
                  : 'A hard test is honest feedback, not a failure. Recite the missed ayahs with the coach and test again tomorrow.'}
          </p>
          <p className="mt-2 text-sm text-white/60">
            {timeUp
              ? 'Time ran out — the test ended at the time limit. Unanswered questions count as missed.'
              : null}
            {mistakesTotal === 1 ? t('test.mistakeOne') : t('test.mistakesMany').replace('{n}', String(mistakesTotal))}
            {temporary ? t('test.tempNote') : t('test.savedNote')}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setPhase('setup')}
              className="rounded-full bg-[#57D798] px-6 py-2.5 text-sm font-bold text-[#102E26] hover:brightness-105"
            >
              {t('test.takeAnother')}
            </button>
            <Link
              href="/hifz/my-progress"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/40 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              {t('test.seeQueue')}
            </Link>
          </div>
        </section>
        {/* What your tests show — per-user insights from your own test
            history and mistake log (lib/insights). No fixed tips, nothing
            invented: with no data yet this says so honestly. */}
        <section aria-label={t('test.insightsTitle')} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-[#102E26]">{t('test.insightsTitle')}</h2>
          <p className="mt-1 text-sm text-[#5b6b62]">
            {t('test.insightsSub')}
          </p>
          <ul className="mt-3 space-y-2">
            {insights.map((ins, i) => {
              const surah = ins.surah ? getSurahById(ins.surah) : undefined;
              return (
                <li key={`insight-${i}`} className="rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm">
                  <span className="block font-bold text-[#102E26]">{ins.title}</span>
                  <span className="block mt-0.5 leading-relaxed text-[#5b6b62]">{ins.body}</span>
                  {surah && ins.ayah && (
                    <Link
                      href={`/hifz/${surah.slug}?mode=recite&ayah=${ins.ayah}`}
                      className="mt-1 inline-block font-semibold text-[#1FA36B] underline"
                    >
                      {t('test.reciteCoach')}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
        {questions.some((_, i) => !results[i]) && (
          <section aria-label={t('test.reviewMissedLabel')} className="rounded-2xl border border-[#DC2626]/40 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-[#102E26]">{t('test.reviewMissed')}</h2>
            <p className="mt-1 text-sm text-[#5b6b62]">
              {t('test.reviewMissedNote')}
            </p>
            <ul className="mt-3 space-y-2">
              {questions.map((q, i) => {
                if (results[i]) return null;
                const surah = getSurahById(q.surah);
                return (
                  <li
                    key={`missed-${q.surah}:${q.ayah}`}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm"
                  >
                    <span className="font-bold text-[#DC2626]">{t('test.missed')}</span>
                    <span>
                      {surah ? surah.name : `Surah ${q.surah}`} {q.surah}:{q.ayah}
                      {q.span > 1 ? `–${q.ayah + q.span - 1}` : ''}
                    </span>
                    <Link
                      href={surah ? `/hifz/${surah.slug}?mode=recite&ayah=${q.ayah}` : '/hifz'}
                      className="ml-auto font-semibold text-[#1FA36B] underline"
                    >
                      {t('test.reciteCoach')}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        <ul className="space-y-2">
          {questions.map((q, i) => {
            const surah = getSurahById(q.surah);
            return (
              <li
                key={`${q.surah}:${q.ayah}`}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm shadow-sm"
              >
                <span className={results[i] ? 'font-bold text-[#16A34A]' : 'font-bold text-[#DC2626]'}>
                  {results[i] ? t('test.correct') : t('test.missed')}
                </span>
                <span>
                  {surah ? surah.name : `Surah ${q.surah}`} {q.surah}:{q.ayah}
                  {q.span > 1 ? `–${q.ayah + q.span - 1}` : ''}
                </span>
                <Link
                  href={surah ? `/hifz/${surah.slug}?mode=recite&ayah=${q.ayah}` : '/hifz'}
                  className="ml-auto font-semibold text-[#1FA36B] underline"
                >
                  {t('test.reciteCoach')}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (phase === 'testing') {
    const q = questions[idx];
    const surah = getSurahById(q.surah);
    const total = questions.length;
    const correctSoFar = results.filter(Boolean).length;
    const acc = results.length > 0 ? Math.round((correctSoFar / results.length) * 100) : 100;
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(elapsed % 60).padStart(2, '0');
    // With a time limit the pill counts DOWN the time left; without one
    // it counts the elapsed time up.
    const remainingSecs = timeLimitMinutes > 0 ? Math.max(0, timeLimitMinutes * 60 - elapsed) : null;
    const rmm = remainingSecs === null ? mm : String(Math.floor(remainingSecs / 60)).padStart(2, '0');
    const rss = remainingSecs === null ? ss : String(remainingSecs % 60).padStart(2, '0');
    const lowTime = remainingSecs !== null && remainingSecs <= 60;
    const hiddenCount = Math.max(0, promptWords.length - revealedWords);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#5b6b62]">
            {temporary ? `${t('test.temporary')} · ` : ''}{t('test.round').replace('{n}', String(idx + 1)).replace('{total}', String(total))}
          </p>
          <span className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              aria-pressed={paused}
              className="rounded-full border border-[#E5E7EB] px-3 py-1 text-sm font-semibold"
            >
              {paused ? t('test.resume') : t('test.pause')}
            </button>
            <button
              type="button"
              onClick={() => setPhase('setup')}
              aria-label={t('test.stopTest')}
              className="rounded-full border border-[#E5E7EB] px-3 py-1 text-sm font-semibold"
            >
              {t('test.endTest')}
            </button>
          </span>
        </div>
        {/* Segmented progress bar — one segment per question */}
        <div className="flex gap-1" role="progressbar" aria-valuenow={idx} aria-valuemin={0} aria-valuemax={total} aria-label={t('test.progressLabel')}>
          {questions.map((_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded-full ${i < idx ? 'bg-[#57D798]' : i === idx ? 'bg-[#1FA36B]' : 'bg-[#E5E7EB]'}`}
            />
          ))}
        </div>

        {paused ? (
          <section aria-label={t('test.pausedLabel')} className="rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center shadow-sm sm:p-8">
            <p className="text-xl font-bold text-[#102E26]">{t('test.pause')}</p>
            <p className="mt-2 text-sm text-[#5b6b62]">{t('test.paused')}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setPaused(false)}
                className="min-h-11 rounded-full bg-[#57D798] px-6 py-2.5 text-sm font-bold text-[#102E26] hover:brightness-105"
              >
                {t('test.resume')}
              </button>
              <button
                type="button"
                onClick={() => setPhase('done')}
                className="min-h-11 rounded-full border border-[#E5E7EB] px-6 py-2.5 text-sm font-semibold"
              >
                {t('test.endTest')}
              </button>
            </div>
          </section>
        ) : (
          <>
        {/* Question card — dark navy deck card. It turns green when the
            question is marked correct, red when missed (markFlash, set in
            answer()), using the .test-card-correct / .test-card-wrong
            classes in globals.css. */}
        <section aria-label={t('test.questionLabel')} className={`test-card overflow-hidden ${markFlash === 'correct' ? 'test-card-correct' : markFlash === 'missed' ? 'test-card-wrong' : ''}`}>
          <div className="p-6 sm:p-8">
            {loadingQ ? (
              <p className="py-10 text-center text-white/70">{t('test.loadingQuestion')}</p>
            ) : (
              <>
                <p dir="rtl" lang="ar" className="font-quran text-right text-3xl leading-loose text-white sm:text-4xl">
                  {prompt}
                </p>
                <div className="mt-4 space-y-2" aria-hidden="true">
                  {Array.from({ length: Math.min(4, Math.max(1, Math.ceil(hiddenCount / 6))) }).map((_, i) => (
                    <div key={i} className="h-5 rounded-full bg-[#2A3F66]" />
                  ))}
                </div>
                {revealedRest && promptWords.length > 0 && (
                  <p dir="rtl" lang="ar" className="font-quran mt-4 text-right text-2xl leading-loose text-white/90">
                    {promptWords.join(' ')}
                  </p>
                )}
                <p className="mt-4 text-sm text-white/60">
                  {t('test.reciteOnwardA')}{!extendToEnd ? '' : t('test.reciteOnwardEnd')}{t('test.reciteOnwardB')}
                </p>
                {markFlash && (
                  <p role="status" className="mt-3 text-base font-bold text-white">
                    {markFlash === 'correct' ? t('test.flashCorrect') : t('test.flashMissed')}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="test-card-footer flex items-center justify-between px-5 py-3">
            <p className="text-sm font-bold text-white">
              {eyeOff ? '—' : `${q.surah} ${surah ? surah.name : ''}`}
              <span className="block text-xs font-normal text-white/80">
                {eyeOff ? t('test.verseHidden') : `${t('test.verseNum').replace('{n}', String(q.ayah))}${q.span > 1 ? `–${q.ayah + q.span - 1}` : ''}`}
              </span>
            </p>
            <button
              type="button"
              onClick={() => setEyeOff((v) => !v)}
              aria-pressed={eyeOff}
              aria-label={t('test.hideSurahLabel')}
              title={t('test.hideSurahTitle')}
              className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/25"
            >
              {eyeOff ? '👁' : '👁‍🗨'}
            </button>
          </div>
        </section>

        <p className="text-sm text-[#5b6b62]">
          {eyeOff ? t('test.hiddenNote') : `${surah ? surah.name : `Surah ${q.surah}`} ${q.surah}:${q.ayah}`}
          {q.span > 1 ? t('test.questionRuns').replace('{n}', String(q.span)) : ''}
        </p>

        {/* Stat pills + stop button */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-bold">
            ✗ {mistakesTotal} {mistakesTotal === 1 ? t('test.mistake') : t('test.mistakes')}
          </span>
          <span className="rounded-full bg-[#57D798] px-3 py-1.5 text-sm font-bold text-[#102E26]">
            {acc}%
          </span>
          <span className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-bold">
            🔥 {streak}
          </span>
          <span
            className={`rounded-full border px-3 py-1.5 text-sm font-bold ${lowTime ? 'border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]' : 'border-[#E5E7EB] bg-white'}`}
            title={timeLimitMinutes > 0 ? t('test.timeLeftTitle').replace('{n}', String(timeLimitMinutes)) : t('test.elapsedTitle')}
          >
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#DC2626]" aria-hidden="true" />
            {remainingSecs !== null ? t('test.timeRemaining').replace('{time}', `${rmm}:${rss}`) : `${rmm}:${rss}`}
          </span>
          <button
            type="button"
            onClick={() => setPhase('done')}
            aria-label={t('test.stopTest')}
            className="mic-btn ml-auto flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white"
          >
            ■
          </button>
        </div>

        {/* Reveal arrows + mark */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={revealNext}
            disabled={markFlash !== null}
            className="min-h-11 rounded-full border border-[#102E26] px-5 py-2.5 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2] disabled:opacity-50"
            title={t('test.revealWordTitle')}
          >
            {t('test.revealWord')}
          </button>
          <button
            type="button"
            onClick={revealRest}
            disabled={markFlash !== null}
            className="min-h-11 rounded-full border border-[#102E26] px-5 py-2.5 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2] disabled:opacity-50"
            title={t('test.revealRestTitle')}
          >
            {t('test.revealRest')}
          </button>
          <button
            type="button"
            onClick={skip}
            disabled={markFlash !== null}
            className="min-h-11 rounded-full border border-[#E5E7EB] px-5 py-2.5 text-sm font-semibold hover:border-[#1FA36B] disabled:opacity-50"
          >
            {t('test.skip')}
          </button>
        </div>
        {notice && (
          <p role="status" className="text-center text-sm text-red-700">{notice}</p>
        )}
        <div className="flex flex-wrap justify-center gap-2 border-t border-[#E5E7EB] pt-4">
          <button
            type="button"
            onClick={() => answer(true)}
            disabled={markFlash !== null}
            className="min-h-11 rounded-full bg-[#102E26] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] disabled:opacity-50"
          >
            {t('test.correctBtn')}
          </button>
          <button
            type="button"
            onClick={() => answer(false)}
            disabled={markFlash !== null}
            className="min-h-11 rounded-full bg-[#DC2626] px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
          >
            {t('test.missedBtn')}
          </button>
        </div>
        <p className="text-center text-xs text-[#5b6b62]">
          {t('test.markingTrustNote')}
        </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stage 6 (§19): resume an unfinished test. Only shown when a
          test was left mid-way — it restores the exact question list and
          the answers already given. */}
      {phase === 'setup' && unfinished && (
        <section aria-label={t('test.unfinishedLabel')} className="rounded-2xl border border-[#FFB800] bg-[#FFFBF2] p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-[#102E26]">{t('test.unfinishedTitle')}</h2>
          <p className="mt-1 text-sm text-[#5b6b62]">
            {t('test.unfinishedAnswered').replace('{a}', String(unfinished.results.length)).replace('{b}', String(unfinished.questions.length))} ·{' '}
            {t('test.unfinishedCorrect').replace('{n}', String(unfinished.results.filter(Boolean).length))} ·{' '}
            {t('test.unfinishedStarted').replace('{date}', new Date(unfinished.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })).replace('{time}', new Date(unfinished.startedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }))}
            {unfinished.temporary ? ` · ${t('test.unfinishedTemporary')}` : ''}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resumeTest}
              className="min-h-11 rounded-full bg-[#57D798] px-5 py-2 text-sm font-bold text-[#102E26] hover:brightness-105"
            >
              {t('test.resumeTest')}
            </button>
            <button
              type="button"
              onClick={discardUnfinished}
              className="min-h-11 rounded-full border border-[#E5E7EB] px-5 py-2 text-sm font-semibold hover:border-red-700 hover:text-red-700"
            >
              {t('test.discardUnfinished')}
            </button>
          </div>
        </section>
      )}

      {/* Setup */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[#102E26]">{t('test.setup')}</h2>
          <button
            type="button"
            onClick={() => {
              setTemporary((t) => !t);
              setNotice(temporary ? null : t('test.temporaryOnNote'));
            }}
            aria-pressed={temporary}
            title={t('test.temporaryTitle')}
            className={`min-h-11 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${temporary ? 'bg-[#FFB800] text-[#102E26]' : 'border border-[#E5E7EB]'}`}
          >
            {t('test.temporaryBtn')}{temporary ? ' ✓' : ''}
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[#5b6b62]">
          {t('test.setupIntro').replace('{a}', String(counts.memorised)).replace('{ayahs}', counts.memorised === 1 ? t('common.ayah') : t('common.ayahs')).replace('{b}', String(counts.learning))}
        </p>
        {temporary && (
          <p className="mt-2 rounded-lg bg-[#FFFBF2] px-3 py-2 text-sm font-semibold text-[#102E26]">
            {t('test.temporaryNote')}
          </p>
        )}

        <div className="mt-5">
          <p className="text-sm font-semibold">{t('test.type')}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2" role="group" aria-label={t('test.type')}>
            {(
              [
                ['sequential', t('test.typeSequential'), t('test.typeSequentialDesc')],
                ['random', t('test.typeRandom'), t('test.typeRandomDesc')],
                ['middle', t('test.typeMiddle'), t('test.typeMiddleDesc')],
                ['completion', t('test.typeCompletion'), t('test.typeCompletionDesc')],
                ['revision', t('test.typeRevision'), t('test.typeRevisionDesc')],
                ['difficult', t('test.typeDifficult'), t('test.typeDifficultDesc')],
              ] as [TestType, string, string][]
            ).map(([v, label, desc]) => (
              <button
                key={v}
                type="button"
                aria-pressed={testType === v}
                onClick={() => {
                  setTestType(v);
                  if (v === 'difficult') setScope('weakest');
                }}
                className={`min-h-11 rounded-xl border px-4 py-2.5 text-left ${testType === v ? 'border-[#1FA36B] bg-[#E4FFF2]' : 'border-[#E5E7EB] hover:border-[#1FA36B]'}`}
              >
                <span className="block text-sm font-bold text-[#102E26]">{label}</span>
                <span className="block text-xs leading-snug text-[#5b6b62]">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {(testType === 'sequential' || testType === 'middle' || testType === 'completion') && (
          <div className="mt-5">
            <p className="text-sm font-semibold">{t('test.startSurah')}</p>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <label className="text-xs font-semibold text-[#5b6b62]">
                {t('test.startSurah')}
                <select
                  value={startSurah}
                  onChange={(e) => {
                    const s = Number(e.target.value);
                    setStartSurah(s);
                    setStartAyah(1);
                  }}
                  className="mt-1 block min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
                >
                  {ALL_SURAHS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id}. {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-[#5b6b62]">
                {t('test.startAyah')}
                <input
                  type="number"
                  min={1}
                  max={getSurahById(startSurah)?.ayahCount ?? 1}
                  value={startAyah}
                  onChange={(e) =>
                    setStartAyah(
                      Math.min(
                        getSurahById(startSurah)?.ayahCount ?? 1,
                        Math.max(1, Number(e.target.value) || 1),
                      ),
                    )
                  }
                  className="mt-1 block w-20 min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  const s = getSurahById(startSurah);
                  if (s) setStartAyah(1 + Math.floor(Math.random() * s.ayahCount));
                }}
                className="min-h-11 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold hover:border-[#1FA36B]"
              >
                {t('test.randomStart')}
              </button>
            </div>
            <p className="mt-1 text-xs text-[#5b6b62]">
              {testType === 'middle'
                ? t('test.runsMiddleNote')
                : testType === 'completion'
                  ? t('test.runsToEnd')
                  : t('test.runsInOrder')}
            </p>
          </div>
        )}

        <div className="mt-5">
          <p className="text-sm font-semibold">{t('test.whatToTest')}</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t('test.whatToTest')}>
            {(
              [
                ['memorised', t('test.scopeMemorised')],
                ['practised', t('test.scopePractised')],
                ['weakest', t('test.scopeWeakest').replace('{n}', String(weakestCount))],
                ['any', t('test.scopeAny')],
              ] as [Scope, string][]
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                aria-pressed={scope === v}
                onClick={() => setScope(v)}
                className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${scope === v ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] hover:border-[#1FA36B]'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[#5b6b62]">
            {t('test.scopeNote').replace('{mem}', t('test.scopeMemorised')).replace('{weak}', t('test.weakestLinkShort'))}
          </p>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold">{t('test.customRange')}</p>
          <p className="text-xs text-[#5b6b62]">
            {t('test.customRangeNote').replace('{ranges}', t('sheet.yourRanges'))}
          </p>
          <div className="mt-2">
            <RangeWheel selected={ranges} onChange={setRanges} />
          </div>
          {ranges.some((r) => r.kind === 'hizb' || r.kind === 'rub') && (
            <p className="mt-2 text-xs text-[#5b6b62]">{t('test.hizbRubNote')}</p>
          )}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold">{t('test.duration')}</p>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t('test.duration')}>
              {([5, 10, 20] as Duration[]).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={duration === n}
                  onClick={() => setDuration(n)}
                  className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${duration === n ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] hover:border-[#1FA36B]'}`}
                >
                  {t('test.questions').replace('{n}', String(n))}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm font-semibold">{t('test.timeLimit')}</p>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t('test.timeLimitLabel')}>
              {([0, 5, 10, 15, 30] as TimeLimitMinutes[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={timeLimitMinutes === m}
                  onClick={() => setTimeLimitMinutes(m)}
                  className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${timeLimitMinutes === m ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] hover:border-[#1FA36B]'}`}
                >
                  {m === 0 ? t('test.noTimeLimit') : t('test.minShort').replace('{n}', String(m))}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-[#5b6b62]">
              {timeLimitMinutes === 0
                ? t('test.noLimitNote')
                : t('test.limitEndsNote').replace('{n}', String(timeLimitMinutes))}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">{t('test.qLength')}</p>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t('test.qLength')}>
              {(['short', 'medium', 'long'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={qLines === LINE_PRESETS[l]}
                  onClick={() => setQLines(LINE_PRESETS[l])}
                  className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold capitalize ${qLines === LINE_PRESETS[l] ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] hover:border-[#1FA36B]'}`}
                >
                  {l === 'short' ? t('test.lengthShort') : l === 'medium' ? t('test.lengthMedium') : t('test.lengthLong')} ({LINE_PRESETS[l]} lines)
                </button>
              ))}
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#5b6b62]">
              {t('test.linesPerQuestion')}
              <input
                type="range"
                min={1}
                max={15}
                value={qLines}
                onChange={(e) => setQLines(Math.min(15, Math.max(1, Number(e.target.value) || 1)))}
                aria-label={t('test.linesSliderLabel')}
                className="w-28"
              />
              {qLines} {qLines === 1 ? t('common.line') : t('common.lines')}
            </label>
            <p className="mt-1 text-xs text-[#5b6b62]">
              {t('test.aboutAyahsPerQ').replace('{n}', String(Math.max(1, Math.round(qLines * LINES_PER_AYAH)))).replace('{ayahs}', Math.max(1, Math.round(qLines * LINES_PER_AYAH)) === 1 ? t('common.ayah') : t('common.ayahs'))}
            </p>
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={extendToEnd}
            onChange={(e) => setExtendToEnd(e.target.checked)}
          />
          {t('test.extend')}
        </label>
        <p className="mt-1 text-xs text-[#5b6b62]">
          {t('test.extendHint')}
        </p>

        <button
          type="button"
          onClick={startTest}
          className="mt-6 rounded-full bg-[#57D798] px-6 py-3 text-sm font-bold text-[#102E26] hover:brightness-105"
        >
          {t('test.startTest')}
        </button>
        {counts.practised === 0 && (
          <p className="mt-3 text-sm text-[#5b6b62]">
            {t('test.nothingPractisedNote')}{' '}
            <Link href="/hifz/juz-amma" className="font-semibold text-[#1FA36B] underline">
              {t('test.startJuzAmmaFirst')}
            </Link>
          </p>
        )}
      </section>

      {/* Recent tests — completed sessions on this device */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-[#102E26]">{t('test.recentTests')}</h2>
        {sessions.length === 0 ? (
          <p className="mt-2 text-sm text-[#5b6b62]">{t('test.noRecentTests')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sessions.slice(0, 8).map((s, i) => (
              <li
                key={`${s.at}-${i}`}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm"
              >
                <span className="font-bold text-[#102E26]">
                  {s.score}/{s.total}
                </span>
                <span className="text-[#5b6b62]">
                  {t(`test.type${s.type.charAt(0).toUpperCase()}${s.type.slice(1)}`)}
                </span>
                <span className="text-[#5b6b62]">
                  {s.mistakes} {s.mistakes === 1 ? t('test.mistake') : t('test.mistakes')} ·{' '}
                  {Math.floor(s.seconds / 60)}:{String(s.seconds % 60).padStart(2, '0')}
                </span>
                <span className="ml-auto text-xs text-[#5b6b62]">
                  {new Date(s.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Suggested for you — real pointers from your own tests and misses
          (lib/insights), not fixed cards. With no history yet this says so
          honestly. The two scope shortcuts stay below as quick ways in. */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-[#102E26]">{t('test.suggested')}</h2>
        <ul className="mt-3 space-y-2">
          {insights.map((ins, i) => {
            const surah = ins.surah ? getSurahById(ins.surah) : undefined;
            return (
              <li key={`suggested-${i}`} className="rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm">
                <span className="block font-bold text-[#102E26]">{ins.title}</span>
                <span className="block mt-0.5 leading-relaxed text-[#5b6b62]">{ins.body}</span>
                {surah && ins.ayah && (
                  <Link
                    href={`/hifz/${surah.slug}?mode=recite&ayah=${ins.ayah}`}
                    className="mt-1 inline-block font-semibold text-[#1FA36B] underline"
                  >
                    {t('test.reciteCoach')}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setScope('weakest');
              setNotice(t('test.weakestSelectedNote').replace('{weak}', t('test.weakestLinkShort')));
            }}
            className="min-h-11 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold hover:border-[#1FA36B]"
          >
            {t('test.weakestLinkCount').replace('{weak}', t('test.weakestLink')).replace('{n}', String(weakestCount)).replace('{ayahs}', weakestCount === 1 ? t('common.ayah') : t('common.ayahs'))}
          </button>
          <button
            type="button"
            onClick={() => {
              setScope('memorised');
              setNotice(t('test.memorisedSelectedNote').replace('{mem}', t('test.scopeMemorised')));
            }}
            className="min-h-11 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold hover:border-[#1FA36B]"
          >
            {t('test.scopeMemorised')} ({counts.memorised} {counts.memorised === 1 ? t('common.ayah') : t('common.ayahs')})
          </button>
        </div>
        <p className="mt-3 text-xs text-[#5b6b62]">
          {t('test.noRepeatNote')}
        </p>
      </section>

      {/* How scoring works */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-[#102E26]">{t('test.howScored')}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#5b6b62]">
          <li>{t('test.rule1')}</li>
          <li>{t('test.rule2')}</li>
          <li>{t('test.rule3')}</li>
          <li>{t('test.rule4')}</li>
          <li>{t('test.rule5')}</li>
          <li>{t('test.rule6')}</li>
          <li>{t('test.rule7')}</li>
        </ul>
      </section>
    </div>
  );
}
