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
  loadMistakes, pickTestPool, revisionDue,
  type HifzProgress,
} from '../progress';
import { ALL_SURAHS, getSurahById } from '../surahs';
import { getJuz } from '../juz';
import { saveBestTestPct } from '../badges';
import { loadTestSessions, saveTestSession, loadInProgressTest, saveInProgressTest, clearInProgressTest, type TestSessionRecord, type InProgressTest } from '../lib/mode';
import { RangeWheel, type RangeSelection } from './SharedSheets';
import { useT } from '../lib/i18n';

type Scope = 'memorised' | 'practised' | 'any' | 'weakest';
type Phase = 'setup' | 'testing' | 'done';
type Duration = 5 | 10 | 20;
type QLength = 'short' | 'medium' | 'long';
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

const SPAN_BY_LENGTH: Record<QLength, number> = { short: 1, medium: 2, long: 3 };

export default function TestClient() {
  const [progress, setProgress] = useState<HifzProgress | null>(null);
  const [scope, setScope] = useState<Scope>('memorised');
  const [duration, setDuration] = useState<Duration>(10);
  const [qLength, setQLength] = useState<QLength>('medium');
  const [qLines, setQLines] = useState(5);
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
      startedAt: startedAtRef.current,
      temporary,
    });
  }, [phase, questions, idx, results, mistakesTotal, testType, scope, temporary]);

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
      return new Set(loadMistakes().map((m) => `${m.surah}:${m.ayah}`)).size;
    } catch {
      return 0;
    }
  }, [progress]);

  const spanFor = useCallback(() => {
    const base = SPAN_BY_LENGTH[qLength];
    // "Extend Question to Ayah's End" (on by default): a question runs to
    // the end of its final ayah. Off = it can stop mid-ayah, so cap at 1.
    return extendToEnd ? base : 1;
  }, [qLength, extendToEnd]);

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
      const res = await fetch(
        `/api/quran/verses/by_key/${q.surah}:${q.ayah}?fields=text_indopak&translations=20`,
      );
      if (!res.ok) throw new Error('Verse request failed');
      const data = await res.json();
      const v = data?.verse;
      const arabic: unknown = v?.text_indopak;
      if (typeof arabic === 'string' && arabic.trim()) {
        const clean = arabic.trim().replace(/[ﭐ-﷿]/g, '');
        const words = clean.split(/\s+/).filter(Boolean);
        setPromptWords(words);
        // The prompt is the first few words; the rest stays hidden.
        setPrompt(words.slice(0, 3).join(' '));
        setRevealedWords(3);
      }
    } catch {
      setNotice('The question text could not be loaded — check your connection and try again.');
    } finally {
      setLoadingQ(false);
    }
  }, []);

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
    setQuestions(saved.questions);
    setIdx(saved.idx);
    setResults(saved.results);
    setMistakesTotal(saved.mistakes);
    setElapsed(saved.seconds);
    elapsedRef.current = saved.seconds;
    setStreak(0);
    setPaused(false);
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
      if (!progress || idx >= questions.length) return;
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
      }
      if (!ok) setMistakesTotal((m) => m + 1);
      setResults((r) => [...r, ok]);
      setStreak((s) => (ok ? s + 1 : 0));
      if (idx + 1 >= questions.length) {
        setPhase('done');
      } else {
        const nextIdx = idx + 1;
        setIdx(nextIdx);
        void loadQuestion(questions[nextIdx]);
      }
    },
    [progress, idx, questions, revealedWords, revealedRest, temporary, loadQuestion],
  );

  const skip = useCallback(() => {
    // Swipe / Next skips the question (counts as a miss, like a wrong answer).
    answer(false);
  }, [answer]);

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
        {questions.some((_, i) => !results[i]) && (
          <section aria-label="Review missed ayahs" className="rounded-2xl border border-[#DC2626]/40 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-[#102E26]">{t('test.reviewMissed')}</h2>
            <p className="mt-1 text-sm text-[#5b6b62]">
              These go into your revision queue. Recite each one with the coach until it is clean.
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
          <section aria-label="Test paused" className="rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center shadow-sm sm:p-8">
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
        {/* Question card — dark navy deck card */}
        <section aria-label="Test question" className={`test-card overflow-hidden ${results.length > 0 && idx > 0 ? '' : ''}`}>
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
                  Recite onward from memory — keep going past the first ayah if the question
                  continues{!extendToEnd ? '' : ', to the end of the ayah'}. The card turns green
                  when you get it right, red when there is a mistake.
                </p>
              </>
            )}
          </div>
          <div className="test-card-footer flex items-center justify-between px-5 py-3">
            <p className="text-sm font-bold text-white">
              {eyeOff ? '—' : `${q.surah} ${surah ? surah.name : ''}`}
              <span className="block text-xs font-normal text-white/80">
                {eyeOff ? t('test.verseHidden') : `Verse ${q.ayah}${q.span > 1 ? `–${q.ayah + q.span - 1}` : ''}`}
              </span>
            </p>
            <button
              type="button"
              onClick={() => setEyeOff((v) => !v)}
              aria-pressed={eyeOff}
              aria-label="Hide or show the surah and verse"
              title="Hide the surah name and verse number"
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
          <span className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-bold">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#DC2626]" aria-hidden="true" />
            {mm}:{ss}
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
            className="min-h-11 rounded-full border border-[#102E26] px-5 py-2.5 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
            title="Reveal the next word — counts as a mistake"
          >
            {t('test.revealWord')}
          </button>
          <button
            type="button"
            onClick={revealRest}
            className="min-h-11 rounded-full border border-[#102E26] px-5 py-2.5 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
            title="Reveal the rest of the ayah — counts as a mistake"
          >
            {t('test.revealRest')}
          </button>
          <button
            type="button"
            onClick={skip}
            className="min-h-11 rounded-full border border-[#E5E7EB] px-5 py-2.5 text-sm font-semibold hover:border-[#1FA36B]"
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
            className="min-h-11 rounded-full bg-[#102E26] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B]"
          >
            {t('test.correctBtn')}
          </button>
          <button
            type="button"
            onClick={() => answer(false)}
            className="min-h-11 rounded-full bg-[#DC2626] px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-800"
          >
            {t('test.missedBtn')}
          </button>
        </div>
        <p className="text-center text-xs text-[#5b6b62]">
          Marking is on trust — the coach on the ayah page checks your recitation word by word
          if you want verification instead. A question counts as correct only with zero mistakes;
          revealing counts against you.
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
        <section aria-label="Unfinished test" className="rounded-2xl border border-[#FFB800] bg-[#FFFBF2] p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-[#102E26]">Unfinished test — pick up where you stopped</h2>
          <p className="mt-1 text-sm text-[#5b6b62]">
            {unfinished.results.length} of {unfinished.questions.length} questions answered ·{' '}
            {unfinished.results.filter(Boolean).length} correct so far · started{' '}
            {new Date(unfinished.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
            at {new Date(unfinished.startedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            {unfinished.temporary ? ' · temporary session' : ''}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resumeTest}
              className="min-h-11 rounded-full bg-[#57D798] px-5 py-2 text-sm font-bold text-[#102E26] hover:brightness-105"
            >
              Resume test
            </button>
            <button
              type="button"
              onClick={discardUnfinished}
              className="min-h-11 rounded-full border border-[#E5E7EB] px-5 py-2 text-sm font-semibold hover:border-red-700 hover:text-red-700"
            >
              Discard it
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
              setNotice(temporary ? null : 'Temporary session on — activity from this session won’t be saved.');
            }}
            aria-pressed={temporary}
            title="Temporary Session — nothing from this session is recorded"
            className={`min-h-11 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${temporary ? 'bg-[#FFB800] text-[#102E26]' : 'border border-[#E5E7EB]'}`}
          >
            {t('test.temporaryBtn')}{temporary ? ' ✓' : ''}
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[#5b6b62]">
          You have {counts.memorised} memorised {counts.memorised === 1 ? 'ayah' : 'ayahs'} and{' '}
          {counts.learning} learning. A test drops you at random places with no cue — the way
          a teacher tests you. Revealing a word counts as a mistake, exactly like peeking
          in the coach.
        </p>
        {temporary && (
          <p className="mt-2 rounded-lg bg-[#FFFBF2] px-3 py-2 text-sm font-semibold text-[#102E26]">
            Temporary — activity from this session won’t be saved. Good for passing the phone around.
          </p>
        )}

        <div className="mt-5">
          <p className="text-sm font-semibold">{t('test.type')}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2" role="group" aria-label="Test type">
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
                ? 'Start from the middle ignores this starting ayah — it drops you at a random ayah in the middle of your range instead.'
                : testType === 'completion'
                  ? 'The test runs from this ayah to the end of the surah (up to 20 questions).'
                  : 'The test runs in order from this ayah.'}
            </p>
          </div>
        )}

        <div className="mt-5">
          <p className="text-sm font-semibold">{t('test.whatToTest')}</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Test scope">
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
            “Your Memorization” is the range the app builds from what you have marked memorised
            and recited from memory. “Weakest Link” tests the ayahs you miss most.
          </p>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold">{t('test.customRange')}</p>
          <p className="text-xs text-[#5b6b62]">
            Pick by Surah, Juz, Hizb, Rub or Page — tap any number of sections, in any order,
            or combine them (e.g. Surah Al-Mulk + Juz 30). Saved ranges appear under “Your Ranges”.
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
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Session duration">
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
          </div>
          <div>
            <p className="text-sm font-semibold">{t('test.qLength')}</p>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Question length">
              {(['short', 'medium', 'long'] as QLength[]).map((l) => {
                const lengthLabel = l === 'short' ? t('test.lengthShort') : l === 'medium' ? t('test.lengthMedium') : t('test.lengthLong');
                return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={qLength === l}
                  onClick={() => setQLength(l)}
                  className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold capitalize ${qLength === l ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] hover:border-[#1FA36B]'}`}
                >
                  {lengthLabel} ({SPAN_BY_LENGTH[l]} {SPAN_BY_LENGTH[l] === 1 ? t('common.ayah') : t('common.ayahs')})
                </button>
                );
              })}
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#5b6b62]">
              {t('test.linesPerQuestion')}
              <input
                type="range"
                min={1}
                max={10}
                value={qLines}
                onChange={(e) => setQLines(Number(e.target.value))}
                aria-label="Question length in lines"
                className="w-28"
              />
              {qLines}
            </label>
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
          On: each question runs to the end of its final ayah, even past the line count.
          Off: a question can stop mid-ayah.
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
            Nothing practised yet — your first test will use new ayahs from the whole Quran.{' '}
            <Link href="/hifz/juz-amma" className="font-semibold text-[#1FA36B] underline">
              Start with Juz Amma first →
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

      {/* Suggested for you */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-[#102E26]">{t('test.suggested')}</h2>
        <ul className="mt-3 space-y-2">
          <li>
            <button
              type="button"
              onClick={() => {
                setScope('weakest');
                setNotice('Weakest Link selected — the test will use your most-missed ayahs first.');
              }}
              className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-left hover:border-[#1FA36B]"
            >
              <span className="block font-bold">{t('test.weakestLink')}</span>
              <span className="block text-sm text-[#5b6b62]">
                Tests you on the ayahs you miss most ({weakestCount} weak {weakestCount === 1 ? 'ayah' : 'ayahs'}).
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                setScope('memorised');
                setNotice('Your Memorization selected — the test covers what you have marked memorised.');
              }}
              className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-left hover:border-[#1FA36B]"
            >
              <span className="block font-bold">{t('test.scopeMemorised')}</span>
              <span className="block text-sm text-[#5b6b62]">
                The strict test: only what you claim to know ({counts.memorised} ayahs).
              </span>
            </button>
          </li>
        </ul>
        <p className="mt-3 text-xs text-[#5b6b62]">
          Questions never repeat within a session until the whole range is covered, then they recycle.
          A new session starts fresh.
        </p>
      </section>

      {/* How scoring works */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-[#102E26]">{t('test.howScored')}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#5b6b62]">
          <li>A question counts as correct only with zero mistakes.</li>
          <li>Revealing a word (‹) counts as a mistake; revealing the rest of the ayah («) counts as a mistake.</li>
          <li>The mistakes counter is a running total for the whole session, not per question.</li>
          <li>Correct, with no reveal: the ayah’s correct streak grows — 3 in a row makes it memorised.</li>
          <li>Missed, or revealed: the streak resets to 0 and the ayah joins your revision queue.</li>
          <li>Each question counts as a minute of practice towards your daily goal and streak (unless the session is Temporary).</li>
          <li>A test never adds new memorisation — it only affects scores of passages already marked memorised.</li>
        </ul>
      </section>
    </div>
  );
}
