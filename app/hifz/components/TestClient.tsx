// app/hifz/components/TestClient.tsx — Test Mode (spec §15.1).
// Exam-style recall test, beyond Tarteel's Test Mode: random ayahs from your
// memorised/learning pool, Arabic hidden, no cue except surah + ayah number.
// You recite from memory, then mark the attempt yourself (or open the ayah
// in the coach). A correct mark is recorded exactly like a coach attempt —
// 3 consecutive correct recitations make the ayah 'memorised' (progress.ts).
// A reveal counts as a miss, like a peek. No audio is recorded or stored.
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  loadProgress, saveProgress, markAttempt, recordMinutes, pickTestPool,
  type HifzProgress,
} from '../progress';
import { LAUNCH_SURAHS, getSurahById, AYAT_AL_KURSI } from '../surahs';

type Scope = 'memorised' | 'practised' | 'any';
type Phase = 'setup' | 'testing' | 'done';

interface TestQuestion {
  surah: number;
  ayah: number;
}

interface RevealedVerse {
  arabic: string;
  translation: string;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}

function allLaunchAyahs(): TestQuestion[] {
  const out: TestQuestion[] = [];
  for (const s of LAUNCH_SURAHS) {
    for (let a = 1; a <= s.ayahCount; a++) out.push({ surah: s.id, ayah: a });
  }
  out.push({ surah: AYAT_AL_KURSI.surahId, ayah: AYAT_AL_KURSI.ayah });
  return out;
}

export default function TestClient() {
  const [progress, setProgress] = useState<HifzProgress | null>(null);
  const [scope, setScope] = useState<Scope>('memorised');
  const [length, setLength] = useState<5 | 10>(5);
  const [phase, setPhase] = useState<Phase>('setup');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState<RevealedVerse | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      setProgress(loadProgress());
    } catch {
      setProgress(null);
    }
  }, []);

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

  const startTest = useCallback(() => {
    if (!progress) return;
    // Scope narrows the pool: 'memorised' tests only what you claim to know;
    // 'practised' adds learning ayahs; 'any' also tops up with new ayahs.
    let pool: TestQuestion[];
    if (scope === 'memorised') {
      const mem = Object.entries(progress.ayahs)
        .filter(([, a]) => a.status === 'memorised')
        .map(([key]) => {
          const [s, ay] = key.split(':').map(Number);
          return { surah: s, ayah: ay };
        });
      pool = pickTestPool({ ...progress, ayahs: Object.fromEntries(Object.entries(progress.ayahs).filter(([, a]) => a.status === 'memorised')) }, mem, length);
      if (pool.length < length) {
        // Not enough memorised ayahs yet — top up from learning, then new.
        pool = pickTestPool(progress, allLaunchAyahs(), length);
      }
    } else if (scope === 'practised') {
      pool = pickTestPool(progress, allLaunchAyahs(), length);
    } else {
      pool = pickTestPool(progress, allLaunchAyahs(), length);
      // 'any' deliberately mixes in fresh ayahs: pickTestPool already tops
      // up with unpractised ayahs when the practised pool is short.
    }
    setQuestions(pool);
    setIdx(0);
    setResults([]);
    setRevealed(null);
    setPhase('testing');
  }, [progress, scope, length]);

  const reveal = useCallback(async (q: TestQuestion) => {
    setRevealing(true);
    try {
      const res = await fetch(
        `/api/quran/verses/by_key/${q.surah}:${q.ayah}?fields=text_indopak&translations=20`,
      );
      if (!res.ok) throw new Error('Verse request failed');
      const data = await res.json();
      const v = data?.verse;
      const arabic: unknown = v?.text_indopak;
      const translation: unknown = v?.translations?.[0]?.text;
      if (typeof arabic === 'string' && arabic.trim()) {
        setRevealed({
          arabic: arabic.trim().replace(/[\uE000-\uF8FF]/g, ''),
          translation: typeof translation === 'string' ? stripHtml(translation) : '',
        });
      } else {
        setNotice('The verse text could not be loaded — check your connection and try again.');
      }
    } catch {
      setNotice('The verse text could not be loaded — check your connection and try again.');
    } finally {
      setRevealing(false);
    }
  }, []);

  const answer = useCallback(
    (correct: boolean) => {
      if (!progress || idx >= questions.length) return;
      const q = questions[idx];
      // A reveal is a peek: it counts as a miss, however the user marks it.
      const honest = revealed ? false : correct;
      let next = markAttempt(progress, q.surah, q.ayah, honest ? 'correct' : 'miss');
      next = recordMinutes(next, 1);
      saveProgress(next);
      setProgress(next);
      setResults((r) => [...r, honest]);
      setRevealed(null);
      if (idx + 1 >= questions.length) {
        setPhase('done');
      } else {
        setIdx(idx + 1);
      }
    },
    [progress, idx, questions, revealed],
  );

  if (progress === null) {
    return (
      <div className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm">
        <p className="text-sm text-[#5b6b62]">Loading your progress…</p>
      </div>
    );
  }

  if (phase === 'done') {
    const score = results.filter(Boolean).length;
    const total = results.length;
    const pct = total === 0 ? 0 : Math.round((score / total) * 100);
    return (
      <div className="space-y-6">
        <section className="rounded-2xl bg-[#0B3D2E] p-6 text-center text-white shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#C9A227]">Test complete</p>
          <p className="mt-3 text-5xl font-bold">
            {score}<span className="text-2xl text-white/60"> / {total}</span>
          </p>
          <p className="mt-2 text-sm text-white/80">
            {pct === 100
              ? 'Perfect — every ayah recalled without a peek. That is real hifz.'
              : pct >= 80
                ? 'Strong recall. The ayahs you missed are already in your revision queue.'
                : pct >= 50
                  ? 'Halfway there — the missed ayahs need another round with the coach.'
                  : 'A hard test is honest feedback, not a failure. Recite the missed ayahs with the coach and test again tomorrow.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setPhase('setup')}
              className="rounded-full bg-[#C9A227] px-6 py-2.5 text-sm font-semibold text-[#0B3D2E] hover:brightness-110"
            >
              Take another test
            </button>
            <Link
              href="/hifz/my-progress"
              className="rounded-full border border-white/40 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              See my revision queue →
            </Link>
          </div>
        </section>
        <ul className="space-y-2">
          {questions.map((q, i) => {
            const surah = getSurahById(q.surah);
            return (
              <li
                key={`${q.surah}:${q.ayah}`}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e5e0d3] bg-white px-4 py-3 text-sm shadow-sm"
              >
                <span className={results[i] ? 'font-bold text-[#146B4D]' : 'font-bold text-red-700'}>
                  {results[i] ? '✓ Correct' : '✗ Missed'}
                </span>
                <span>
                  {surah ? surah.name : `Surah ${q.surah}`} {q.surah}:{q.ayah}
                </span>
                <Link
                  href={surah ? `/hifz/${surah.slug}?mode=recite&ayah=${q.ayah}` : '/hifz'}
                  className="ml-auto font-semibold text-[#146B4D] underline"
                >
                  Recite with the coach →
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
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#5b6b62]">
            Question {idx + 1} of {questions.length}
          </p>
          <p className="text-sm font-semibold text-[#146B4D]">
            {results.filter(Boolean).length} correct so far
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#e5e0d3]" role="progressbar" aria-valuenow={idx} aria-valuemin={0} aria-valuemax={questions.length} aria-label="Test progress">
          <div className="h-full rounded-full bg-[#146B4D]" style={{ width: `${(idx / questions.length) * 100}%` }} />
        </div>
        <section className="rounded-2xl border border-[#e5e0d3] bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#C9A227]">Recite from memory</p>
          <h2 className="mt-3 text-2xl font-bold text-[#0B3D2E] sm:text-3xl">
            {surah ? `Surah ${surah.name}` : `Surah ${q.surah}`} · {q.surah}:{q.ayah}
          </h2>
          <p className="mt-2 text-sm text-[#5b6b62]">
            No text, no audio cue — just the surah and the ayah number. Recite it aloud from
            memory, then mark yourself honestly.
          </p>
          {revealed ? (
            <div className="mt-6 rounded-xl bg-[#F7F5EF] p-5">
              <p dir="rtl" lang="ar" className="font-quran text-right text-3xl leading-loose text-[#0B3D2E]">
                {revealed.arabic}
              </p>
              {revealed.translation && (
                <p className="mt-3 text-sm leading-relaxed text-[#1C2420]/80">“{revealed.translation}”</p>
              )}
              <p className="mt-3 text-xs font-semibold text-red-700">
                You revealed the ayah — this question counts as missed, like a peek.
              </p>
            </div>
          ) : (
            <div className="mx-auto mt-6 flex h-28 max-w-md items-center justify-center rounded-xl border-2 border-dashed border-[#e5e0d3] bg-[#F7F5EF]">
              <p className="px-4 text-sm font-semibold text-[#5b6b62]">
                The ayah is hidden. Recite it from memory.
              </p>
            </div>
          )}
          {notice && (
            <p role="status" className="mt-3 text-sm text-red-700">{notice}</p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {!revealed && (
              <button
                type="button"
                onClick={() => reveal(q)}
                disabled={revealing}
                className="rounded-full border border-[#0B3D2E] px-5 py-2.5 text-sm font-semibold text-[#0B3D2E] hover:bg-[#eaf3ee] disabled:opacity-50"
              >
                {revealing ? 'Loading…' : 'Reveal the ayah'}
              </button>
            )}
            <Link
              href={surah ? `/hifz/${surah.slug}?mode=recite&ayah=${q.ayah}` : '/hifz'}
              className="rounded-full border border-[#0B3D2E] px-5 py-2.5 text-sm font-semibold text-[#0B3D2E] hover:bg-[#eaf3ee]"
            >
              Recite with the coach →
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 border-t border-[#e5e0d3] pt-5">
            <button
              type="button"
              onClick={() => answer(true)}
              className="rounded-full bg-[#0B3D2E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#146B4D]"
            >
              I recited it correctly
            </button>
            <button
              type="button"
              onClick={() => answer(false)}
              className="rounded-full bg-red-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-800"
            >
              I missed it
            </button>
          </div>
          <p className="mt-3 text-xs text-[#5b6b62]">
            Marking is on trust — the coach on the ayah page checks your recitation word by
            word if you want verification instead.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-[#0B3D2E]">Set up your test</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#5b6b62]">
          You have {counts.memorised} memorised {counts.memorised === 1 ? 'ayah' : 'ayahs'} and{' '}
          {counts.learning} learning. A test drops you at random ayahs with no cue — the way
          a teacher tests you. Revealing an ayah counts as a miss, exactly like peeking
          in the coach.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            What to test
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}
              className="mt-1 block w-full rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2.5 text-sm font-normal"
            >
              <option value="memorised">Memorised ayahs only — the strict test</option>
              <option value="practised">Memorised + learning ayahs</option>
              <option value="any">Anything in the launch set, including new ayahs</option>
            </select>
          </label>
          <label className="block text-sm font-semibold">
            How many questions
            <select
              value={length}
              onChange={(e) => setLength(Number(e.target.value) as 5 | 10)}
              className="mt-1 block w-full rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2.5 text-sm font-normal"
            >
              <option value={5}>5 questions</option>
              <option value={10}>10 questions</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={startTest}
          className="mt-6 rounded-full bg-[#0B3D2E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#146B4D]"
        >
          Start the test
        </button>
        {counts.practised === 0 && (
          <p className="mt-3 text-sm text-[#5b6b62]">
            Nothing practised yet — your first test will use new ayahs from the launch set.{' '}
            <Link href="/hifz/juz-amma" className="font-semibold text-[#146B4D] underline">
              Start with Juz Amma first →
            </Link>
          </p>
        )}
      </section>
      <section className="rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-[#0B3D2E]">How a test is scored</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#5b6b62]">
          <li>Correct, with no reveal: the ayah's correct streak grows — 3 in a row makes it memorised.</li>
          <li>Missed, or revealed: the streak resets to 0 and the ayah joins your revision queue.</li>
          <li>Each question counts as a minute of practice towards your daily goal and streak.</li>
        </ul>
      </section>
    </div>
  );
}
