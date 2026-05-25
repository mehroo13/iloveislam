'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

/* ── DATA ── */
const LETTERS = [
  { letter: 'ا', name: 'Alif' },
  { letter: 'ب', name: 'Ba' },
  { letter: 'ت', name: 'Ta' },
  { letter: 'ث', name: 'Tha' },
  { letter: 'ج', name: 'Jeem' },
  { letter: 'ح', name: 'Ha' },
  { letter: 'خ', name: 'Kha' },
  { letter: 'د', name: 'Dal' },
  { letter: 'ذ', name: 'Dhal' },
  { letter: 'ر', name: 'Ra' },
  { letter: 'ز', name: 'Zay' },
  { letter: 'س', name: 'Seen' },
  { letter: 'ش', name: 'Sheen' },
  { letter: 'ص', name: 'Sad' },
  { letter: 'ض', name: 'Dad' },
  { letter: 'ط', name: 'Taa' },
  { letter: 'ظ', name: 'Dha' },
  { letter: 'ع', name: 'Ain' },
  { letter: 'غ', name: 'Ghain' },
  { letter: 'ف', name: 'Fa' },
  { letter: 'ق', name: 'Qaf' },
  { letter: 'ك', name: 'Kaf' },
  { letter: 'ل', name: 'Lam' },
  { letter: 'م', name: 'Meem' },
  { letter: 'ن', name: 'Noon' },
  { letter: 'ه', name: 'Ha2' },
  { letter: 'و', name: 'Waw' },
  { letter: 'ي', name: 'Ya' },
];

type Mode = 'home' | 'learn' | 'quiz' | 'challenge' | 'spell' | 'result';
type AnswerState = 'idle' | 'correct' | 'wrong';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getOptions(correctName: string): string[] {
  const wrongs = shuffle(LETTERS.filter((l) => l.name !== correctName))
    .slice(0, 3)
    .map((l) => l.name);
  return shuffle([...wrongs, correctName]);
}

/* ── CONFETTI ── */
type Particle = { id: number; x: number; color: string; delay: number; duration: number };
function useConfetti() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const fire = useCallback(() => {
    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
    const ps: Particle[] = Array.from({ length: 22 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.4,
      duration: 0.8 + Math.random() * 0.7,
    }));
    setParticles(ps);
    setTimeout(() => setParticles([]), 2000);
  }, []);
  return { particles, fire };
}

/* ── MAIN COMPONENT ── */
export default function ArabicLettersGame() {
  const [mode, setMode] = useState<Mode>('home');
  const [shuffledIdx, setShuffledIdx] = useState<number[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [timer, setTimer] = useState(10);
  const [flash, setFlash] = useState<'' | 'green' | 'red'>('');
  const [spellInput, setSpellInput] = useState('');
  const [spellDone, setSpellDone] = useState(false);
  const [lastMode, setLastMode] = useState<Mode>('quiz');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { particles, fire: fireConfetti } = useConfetti();

  const currentLetter = LETTERS[shuffledIdx[idx] ?? idx];
  const progress = ((idx + 1) / LETTERS.length) * 100;

  const praises = ['Great job!', 'Correct!', 'Awesome!', 'You got it!', 'Perfect!', 'Brilliant!'];
  const pickPraise = () => praises[Math.floor(Math.random() * praises.length)];

  const doFlash = (color: 'green' | 'red') => {
    setFlash(color);
    setTimeout(() => setFlash(''), 200);
  };

  /* ── START MODE ── */
  const startMode = (m: Mode) => {
    clearTimer();
    setLastMode(m);
    setMode(m);
    setIdx(0);
    setScore(0);
    setStreak(0);
    setFeedback('');
    setAnswerState('idle');
    setSelectedOpt(null);
    setSpellInput('');
    setSpellDone(false);
    const newOrder = shuffle(LETTERS.map((_, i) => i));
    setShuffledIdx(newOrder);
    if (m !== 'learn') {
      setOptions(getOptions(LETTERS[newOrder[0]].name));
    }
    if (m === 'challenge') {
      setTimer(10);
    }
  };

  /* ── TIMER (challenge) ── */
  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => {
    if (mode === 'challenge' && answerState === 'idle') {
      clearTimer();
      setTimer(10);
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearTimer();
            setStreak(0);
            setFeedback("Time's up!");
            setAnswerState('wrong');
            doFlash('red');
            setTimeout(() => advance('challenge'), 900);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (mode !== 'challenge') clearTimer(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, idx, answerState]);

  /* ── ADVANCE ── */
  const advance = (m: Mode) => {
    setAnswerState('idle');
    setSelectedOpt(null);
    setFeedback('');
    setSpellInput('');
    setSpellDone(false);
    setIdx((prev) => {
      const next = prev + 1;
      if (next >= LETTERS.length) {
        setMode('result');
        return prev;
      }
      if (m !== 'learn') {
        setOptions(getOptions(LETTERS[shuffledIdx[next]].name));
      }
      if (m === 'challenge') setTimer(10);
      return next;
    });
  };

  /* ── ANSWER (quiz / challenge) ── */
  const handleAnswer = (opt: string) => {
    if (answerState !== 'idle') return;
    clearTimer();
    setSelectedOpt(opt);
    const correct = opt === currentLetter.name;
    setAnswerState(correct ? 'correct' : 'wrong');
    if (correct) {
      const newStreak = streak + 1;
      setScore((s) => s + 1);
      setStreak(newStreak);
      setTotalStars((s) => s + 1);
      setBestStreak((b) => Math.max(b, newStreak));
      setFeedback(pickPraise());
      doFlash('green');
      if (newStreak % 3 === 0) fireConfetti();
    } else {
      setStreak(0);
      setFeedback('Not quite — the answer is ' + currentLetter.name);
      doFlash('red');
    }
    setTimeout(() => advance(mode), 1000);
  };

  /* ── SPELL ── */
  const handleSpellChange = (val: string) => {
    if (spellDone) return;
    setSpellInput(val);
    const correct = currentLetter.name.toLowerCase().replace(/[^a-z]/g, '');
    const typed = val.toLowerCase().replace(/[^a-z]/g, '');
    if (typed === correct) {
      setSpellDone(true);
      const newStreak = streak + 1;
      setScore((s) => s + 1);
      setStreak(newStreak);
      setTotalStars((s) => s + 1);
      setBestStreak((b) => Math.max(b, newStreak));
      setFeedback(pickPraise());
      doFlash('green');
      if (newStreak % 3 === 0) fireConfetti();
      setTimeout(() => advance('spell'), 800);
    }
  };

  /* ── LEARN NAV ── */
  const learnPrev = () => {
    if (idx > 0) setIdx((i) => i - 1);
  };
  const learnNext = () => {
    if (idx < LETTERS.length - 1) {
      setIdx((i) => i + 1);
    } else {
      setMode('result');
    }
  };

  /* ── RESULT helpers ── */
  const pct = Math.round((score / LETTERS.length) * 100);
  const resultEmoji = pct >= 90 ? '🏆' : pct >= 70 ? '🌟' : pct >= 50 ? '😊' : '💪';
  const resultTitle = pct >= 90 ? 'Amazing!' : pct >= 70 ? 'Great job!' : pct >= 50 ? 'Well done!' : 'Keep going!';
  const resultStars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;

  /* ── OPTION BUTTON color ── */
  const optClass = (opt: string) => {
    const base =
      'rounded-2xl py-4 px-3 text-base font-semibold border-2 transition-all duration-150 active:scale-95 ';
    if (answerState === 'idle') return base + 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50';
    if (opt === currentLetter.name) return base + 'bg-green-100 border-green-500 text-green-800';
    if (opt === selectedOpt) return base + 'bg-red-100 border-red-400 text-red-700';
    return base + 'bg-slate-100 border-slate-200 text-slate-400';
  };

  /* ── TIMER RING ── */
  const timerCirc = 2 * Math.PI * 23;
  const timerOffset = timerCirc * (1 - timer / 10);

  /* ───────────────── RENDER ───────────────── */

  /* Flash overlay */
  const flashClass =
    flash === 'green'
      ? 'fixed inset-0 pointer-events-none z-50 bg-green-400/20 transition-opacity'
      : flash === 'red'
      ? 'fixed inset-0 pointer-events-none z-50 bg-red-400/15 transition-opacity'
      : 'fixed inset-0 pointer-events-none z-50 opacity-0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-pink-50 font-sans">

      {/* Flash */}
      <div className={flashClass} />

      {/* Confetti */}
      <div className="fixed top-0 left-0 w-full pointer-events-none overflow-visible z-40">
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: -10,
              width: 8,
              height: 8,
              borderRadius: 2,
              background: p.color,
              animationName: 'cffall',
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              animationFillMode: 'forwards',
              animationTimingFunction: 'linear',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes cffall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(380px) rotate(720deg); opacity: 0; }
        }
        @keyframes popIn {
          0% { transform: scale(0.4); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .letter-pop { animation: popIn 0.35s ease forwards; }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeSlide 0.25s ease forwards; }
      `}</style>

      {/* ── HOME ── */}
      {mode === 'home' && (
        <div className="flex flex-col items-center px-4 pt-10 pb-8 fade-in">
          <Link href="/kids" className="self-start text-sm text-slate-400 hover:text-slate-600 mb-6">
            ← Back
          </Link>
          <div className="text-5xl mb-2">🌙</div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">Arabic Alphabet</h1>
          <p className="text-slate-500 text-sm mb-8">28 letters · 4 fun ways to learn</p>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
            {([
              { m: 'learn', icon: '📖', label: 'Learn', desc: 'See every letter' },
              { m: 'quiz', icon: '🎯', label: 'Quiz', desc: 'Pick the right name' },
              { m: 'challenge', icon: '⚡', label: 'Speed', desc: 'Race the clock!' },
              { m: 'spell', icon: '🔤', label: 'Spell It', desc: 'Type the name' },
            ] as const).map(({ m, icon, label, desc }) => (
              <button
                key={m}
                onClick={() => startMode(m)}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95"
              >
                <div className="text-3xl mb-2">{icon}</div>
                <div className="font-semibold text-slate-800 text-sm">{label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
              </button>
            ))}
          </div>

          <p className="text-sm text-slate-400">
            Total stars: <span className="font-semibold text-amber-500">{totalStars} ⭐</span>
          </p>
        </div>
      )}

      {/* ── SHARED HEADER (non-home, non-result) ── */}
      {mode !== 'home' && mode !== 'result' && (
        <div className="flex items-center justify-between px-4 pt-4 pb-2 max-w-md mx-auto">
          <button
            onClick={() => { clearTimer(); setMode('home'); }}
            className="text-sm text-slate-400 hover:text-slate-600 border border-slate-200 rounded-xl px-3 py-1.5 bg-white"
          >
            ← Home
          </button>
          <div className="flex gap-2 text-sm">
            {(mode === 'quiz' || mode === 'challenge' || mode === 'spell') && (
              <span className="bg-white border border-slate-100 rounded-full px-3 py-1 text-green-600 font-semibold">
                {score} ✓
              </span>
            )}
            {streak > 1 && (
              <span className="bg-amber-50 border border-amber-100 rounded-full px-3 py-1 text-amber-500 font-semibold">
                {streak >= 5 ? '🔥' : '⭐'} {streak}
              </span>
            )}
            <span className="bg-white border border-slate-100 rounded-full px-3 py-1 text-slate-500">
              {idx + 1}/28
            </span>
          </div>
        </div>
      )}

      {/* ── PROGRESS BAR ── */}
      {mode !== 'home' && mode !== 'result' && (
        <div className="max-w-md mx-auto px-4 mb-2">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── LETTER DISPLAY ── */}
      {mode !== 'home' && mode !== 'result' && (
        <div className="text-center py-4 max-w-md mx-auto">
          {/* Challenge timer ring */}
          {mode === 'challenge' && (
            <div className="flex justify-center mb-2">
              <div className="relative w-14 h-14">
                <svg className="-rotate-90 w-14 h-14" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="23" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  <circle
                    cx="28" cy="28" r="23" fill="none"
                    stroke={timer <= 3 ? '#dc2626' : '#6366f1'}
                    strokeWidth="4"
                    strokeDasharray={timerCirc}
                    strokeDashoffset={timerOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.2s' }}
                  />
                </svg>
                <span
                  className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${
                    timer <= 3 ? 'text-red-500' : 'text-slate-700'
                  }`}
                >
                  {timer}
                </span>
              </div>
            </div>
          )}

          <div
            key={`${mode}-${idx}`}
            className="letter-pop inline-block text-9xl cursor-default select-none leading-none mb-2"
          >
            {currentLetter.letter}
          </div>

          {mode === 'learn' && (
            <div className="text-2xl font-bold text-slate-700 mt-1">{currentLetter.name}</div>
          )}

          {mode === 'quiz' || mode === 'challenge' ? (
            <div className="text-sm text-slate-400 mt-1">What is the name of this letter?</div>
          ) : null}
          {mode === 'spell' && (
            <div className="text-sm text-slate-400 mt-1">Type the name of this letter</div>
          )}
        </div>
      )}

      {/* ── FEEDBACK ── */}
      {mode !== 'home' && mode !== 'result' && mode !== 'learn' && (
        <div
          className={`text-center text-sm font-semibold min-h-6 mb-2 ${
            feedback.includes('Not quite') || feedback === "Time's up!"
              ? 'text-red-500'
              : 'text-green-600'
          }`}
        >
          {feedback}
        </div>
      )}

      {/* ── LEARN BUTTONS ── */}
      {mode === 'learn' && (
        <div className="flex gap-3 justify-center px-4 max-w-md mx-auto mt-2">
          <button
            onClick={learnPrev}
            disabled={idx === 0}
            className="flex-1 bg-white border border-slate-200 rounded-2xl py-3 text-slate-600 font-semibold disabled:opacity-30 hover:bg-slate-50 active:scale-95 transition-all"
          >
            ← Prev
          </button>
          <button
            onClick={learnNext}
            className="flex-1 bg-indigo-500 text-white rounded-2xl py-3 font-semibold hover:bg-indigo-600 active:scale-95 transition-all"
          >
            {idx === LETTERS.length - 1 ? 'Finish ✓' : 'Next →'}
          </button>
        </div>
      )}

      {/* ── QUIZ / CHALLENGE OPTIONS ── */}
      {(mode === 'quiz' || mode === 'challenge') && (
        <div className="grid grid-cols-2 gap-3 px-4 max-w-md mx-auto">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              disabled={answerState !== 'idle'}
              className={optClass(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* ── SPELL INPUT ── */}
      {mode === 'spell' && (
        <div className="px-4 max-w-md mx-auto">
          <input
            type="text"
            value={spellInput}
            onChange={(e) => handleSpellChange(e.target.value)}
            disabled={spellDone}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            placeholder="Type the letter name..."
            className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-800 bg-white focus:outline-none focus:border-indigo-400 placeholder-slate-300 transition-colors"
          />
          {!spellDone && (
            <button
              onClick={() => advance('spell')}
              className="w-full mt-3 border border-slate-200 bg-white rounded-2xl py-3 text-sm text-slate-400 hover:bg-slate-50 active:scale-95 transition-all"
            >
              Skip →
            </button>
          )}
        </div>
      )}

      {/* ── RESULT ── */}
      {mode === 'result' && (
        <div className="flex flex-col items-center px-4 pt-12 pb-8 text-center fade-in max-w-md mx-auto">
          <div className="text-6xl mb-4">{resultEmoji}</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{resultTitle}</h2>
          <p className="text-slate-500 text-sm mb-4">
            {score} out of 28 correct · Best streak: {bestStreak}
          </p>
          <div className="text-3xl mb-8 tracking-widest">
            {Array.from({ length: resultStars }, () => '⭐').join('')}
            {Array.from({ length: 3 - resultStars }, () => '☆').join('')}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => startMode(lastMode)}
              className="bg-indigo-500 text-white rounded-2xl px-6 py-3 font-semibold hover:bg-indigo-600 active:scale-95 transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => setMode('home')}
              className="bg-white border border-slate-200 rounded-2xl px-6 py-3 text-slate-600 font-semibold hover:bg-slate-50 active:scale-95 transition-all"
            >
              Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}