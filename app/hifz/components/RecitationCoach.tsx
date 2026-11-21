'use client';

/**
 * app/hifz/components/RecitationCoach.tsx — the Hifz recitation coach.
 *
 * Spec §3 (coach flow), §3.2 (states), §3.3 (free limits), §8 (feedback).
 * Research: hifz-recitation-feedback-20261121, §5 (alignment), §6 (risks/UI copy).
 *
 * LOAD RULES (spec §6 performance budget): this component is a client island
 * meant to be loaded via `next/dynamic(..., { ssr: false })` ONLY when the
 * user opens it (`?mode=recite` or taps "Recite") — do NOT import it from any
 * page statically. The engine itself loads even later: `loadEngine()` runs
 * only after the user enters the "Hide & recite" step, so the ~25–68 MB model
 * download is always user-initiated and never in the first-paint bundle.
 *
 * ENGINE: Tilawa (`@tilawa/core`, MIT, on-device) via app/hifz/lib/tilawa.ts.
 * Audio never leaves the device; no audio is stored — the mistake log keeps
 * word references (surah:ayah:word) only (spec §8.2). The Web Speech API is
 * NOT used (research §3 forbids it as the core engine).
 *
 * FEEDBACK HONESTY (measured 2026-11-21, tools/test-tilawa.mjs):
 *  - The checker confirms almost no wrong words on clean recitation (0
 *    confirmed mistakes on Al-Fatihah + Al-Mulk), but the tracker sometimes
 *    does not observe a word it should have (false-flag 7–9% on clean
 *    professional recitation, mostly the first word(s) of a take — the
 *    tracker needs ~1 s of audio context before the first word). So a word
 *    the tracker never observed is shown as "Not heard" (amber), never as a
 *    confident "wrong". Only a checker-CONFIRMED wrong word is labelled
 *    "Check this word" (red tint). Per-word colours are never shown when the
 *    attempt is unclear — the UI says so and offers a retry (research §5.7).
 *  - Never a percentage grade, never tajweed (spec §8).
 *
 * FREE LIMITS (spec §3.3): 1 surah/day, 10 minutes/day. Enforced CLIENT-SIDE
 * in v1 and labelled as such here — a determined user can bypass client
 * limits; that is accepted in v1 and fixed when accounts arrive in v3.
 * The limit resets at local midnight. No billing, no paywall on
 * text / translation / tafsir / audio — those are free, always.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AUDIO_BASE, API, RECITERS } from '../../quran/lib';
import {
  addMistake,
  ayahsPractisedOn,
  currentStreakCount,
  getStorageNotice,
  isDailyGoalMet,
  loadMistakes,
  loadProgress,
  loadSettings,
  localDateString,
  markAttempt,
  recordMinutes,
  recordTypeActivity,
  saveMistakes,
  saveProgress,
  saveSettings,
  type MistakeEntry,
} from '../progress';
import { splitWords } from '../lib/alignment';
import {
  autoTierLabel,
  engineSupport,
  loadEngine,
  type EngineLoadProgress,
  type RecitationEngine,
  type RecitationSession,
  type SessionResult,
  type WordEvent,
} from '../lib/tilawa';

/* ------------------------------------------------------------------ */
/*  Copy — research §6, verbatim where the research says verbatim.     */
/* ------------------------------------------------------------------ */

/** Teacher disclaimer — research §6, verbatim. Above the mic button AND on the feedback screen. */
export const TEACHER_DISCLAIMER =
  'This checks which words you said — it does not judge tajweed. It can miss words, especially in noise, and it can flag a word you said correctly. Use it to practise between lessons. A teacher is still needed for tajweed. Your voice never leaves this device.';

/** Low-confidence attempt — research §6, verbatim. */
export const UNCLEAR_COPY =
  "I couldn't hear this clearly. Check your microphone, move somewhere quieter, and try again.";

/** Free-tier limits (spec §3.3). Client-side in v1 — see header comment. */
export const FREE_SURAHS_PER_DAY = 1;
export const FREE_MINUTES_PER_DAY = 10;

const PREMIUM_ANCHOR = '#premium';

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

/** One ayah the coach can work with. Text comes from the Quran.com API via the page — never pasted into the repo. */
export interface CoachAyah {
  surah: number;
  ayah: number;
  /** Display text (Uthmani or Indo-Pak — both normalise the same way). */
  text: string;
  /** English translation shown as a prompt while the Arabic is hidden. */
  translation?: string;
  /** Relative audio path from the Quran.com API, e.g. "Alafasy/mp3/001001.mp3". */
  audioUrl?: string;
}

export interface RecitationCoachProps {
  /** Surah number, e.g. 67. */
  surah: number;
  /** URL slug, e.g. "al-mulk" — used for the free-tier "1 surah/day" counter. */
  surahSlug: string;
  /** Display name, e.g. "Al-Mulk". */
  surahName: string;
  /** Ayahs available to practise, in order. The page supplies these. */
  ayahs: CoachAyah[];
  /** 0-based index of the ayah to start on. Default 0. */
  initialAyahIndex?: number;
  /** Reciter id from RECITERS (default 7, Mishary Alafasy). */
  initialReciterId?: number;
  /** Called when the user moves to another ayah (so the page can update its URL/state). */
  onAyahChange?: (ayah: number) => void;
}

type Step = 'pick' | 'listen' | 'recite' | 'feedback';
type ScopeKind = 'single' | 'range' | 'whole';
type EngineState = 'idle' | 'loading' | 'ready' | 'failed' | 'unsupported';
type MicState = 'idle' | 'recording' | 'checking' | 'denied' | 'unavailable';
type CoachMode = 'mic' | 'self-mark';

interface FeedbackWord {
  key: string;
  display: string;
  status: 'correct' | 'missed' | 'wrong' | 'not-reached';
  /** True when the checker CONFIRMED this word (reliable); false when the tracker simply never observed it. */
  confirmed: boolean;
}

function wordKey(surah: number, ayah: number, word: number): string {
  return `${surah}:${ayah}:${word}`;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function RecitationCoach({
  surah,
  surahSlug,
  surahName,
  ayahs,
  initialAyahIndex = 0,
  initialReciterId = 7,
  onAyahChange,
}: RecitationCoachProps) {
  const [step, setStep] = useState<Step>('pick');
  const [scopeKind, setScopeKind] = useState<ScopeKind>('single');
  const [currentIndex, setCurrentIndex] = useState<number>(
    Math.max(0, Math.min(initialAyahIndex, Math.max(0, ayahs.length - 1))),
  );
  const [rangeFrom, setRangeFrom] = useState<number>(currentIndex);
  const [rangeTo, setRangeTo] = useState<number>(currentIndex);
  const [reciterId, setReciterId] = useState<number>(initialReciterId);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const a of ayahs) if (a.audioUrl) map[`${a.surah}:${a.ayah}`] = a.audioUrl;
    return map;
  });

  // Arabic visibility + translation prompt (spec §3.1 step 3).
  const [arabicHidden, setArabicHidden] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [peeked, setPeeked] = useState(false);

  // Engine + mic state (spec §3.2).
  const [engineState, setEngineState] = useState<EngineState>('idle');
  const [engineLoadProgress, setEngineLoadProgress] = useState<EngineLoadProgress | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [micState, setMicState] = useState<MicState>('idle');
  const [micError, setMicError] = useState<string | null>(null);
  const [level, setLevel] = useState(0); // 0..1, from onLevel dBFS
  const [recordingSecs, setRecordingSecs] = useState(0);
  const [trackerState, setTrackerState] = useState<string>('');
  const [online, setOnline] = useState<boolean>(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  // Mode + feedback.
  const [mode, setMode] = useState<CoachMode>('mic');
  const [liveWords, setLiveWords] = useState<Record<string, 'correct' | 'wrong' | 'missed'>>({});
  const [result, setResult] = useState<SessionResult | null>(null);
  const [feedbackWords, setFeedbackWords] = useState<FeedbackWord[]>([]);
  const [selfMarks, setSelfMarks] = useState<Record<string, boolean | null>>({});
  const [selfMarkedMistakes, setSelfMarkedMistakes] = useState<MistakeEntry[]>([]);
  const [persistedMistakes, setPersistedMistakes] = useState<MistakeEntry[]>(() =>
    typeof window === 'undefined' ? [] : loadMistakes(),
  );
  const [limitHit, setLimitHit] = useState<'surah' | 'minutes' | null>(null);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [dailyGoalMet, setDailyGoalMet] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [ayahsToday, setAyahsToday] = useState(0);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [audioNote, setAudioNote] = useState<string | null>(null);

  const engineRef = useRef<RecitationEngine | null>(null);
  const sessionRef = useRef<RecitationSession | null>(null);
  const loadAbortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playQueueRef = useRef<number[]>([]);
  const recordingStartRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---------------- scope ---------------- */

  const scopeAyahs = useCallback((): CoachAyah[] => {
    if (scopeKind === 'single') return ayahs[currentIndex] ? [ayahs[currentIndex]] : [];
    if (scopeKind === 'range') {
      const from = Math.min(rangeFrom, rangeTo);
      const to = Math.max(rangeFrom, rangeTo);
      return ayahs.slice(from, to + 1);
    }
    return ayahs; // whole surah — Premium only; the picker blocks starting it (see below)
  }, [ayahs, scopeKind, currentIndex, rangeFrom, rangeTo]);

  const scopeLabel = scopeAyahs().length === 1
    ? `${surah}:${scopeAyahs()[0]?.ayah}`
    : scopeAyahs().length > 1
      ? `${surah}:${scopeAyahs()[0]?.ayah}–${scopeAyahs()[scopeAyahs().length - 1]?.ayah}`
      : '';

  /* ---------------- audio (Listen) ---------------- */

  const audioSrcFor = useCallback(
    (a: CoachAyah): string | null => {
      const rel = audioUrls[`${a.surah}:${a.ayah}`] ?? a.audioUrl;
      return rel ? `${AUDIO_BASE}${rel}` : null;
    },
    [audioUrls],
  );

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    playQueueRef.current = [];
    setPlayingKey(null);
  }, []);

  const playAyahAudio = useCallback(
    (index: number) => {
      const a = ayahs[index];
      const src = a ? audioSrcFor(a) : null;
      const audio = audioRef.current;
      if (!a || !src || !audio) return;
      stopAudio();
      audio.src = src;
      setPlayingKey(`${a.surah}:${a.ayah}`);
      audio.play().catch(() => setPlayingKey(null));
    },
    [ayahs, audioSrcFor, stopAudio],
  );

  const playScopeAudio = useCallback(() => {
    const idxs = scopeAyahs()
      .map((a) => ayahs.findIndex((x) => x.surah === a.surah && x.ayah === a.ayah))
      .filter((i) => i >= 0);
    if (idxs.length === 0) return;
    playQueueRef.current = idxs.slice(1);
    playAyahAudio(idxs[0]);
  }, [ayahs, scopeAyahs, playAyahAudio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      const next = playQueueRef.current.shift();
      if (next !== undefined) playAyahAudio(next);
      else setPlayingKey(null);
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [playAyahAudio]);

  // Reciter change: refetch audio URLs for this surah through the existing
  // same-origin /api/quran proxy (same pattern as app/quran/QuranClient).
  // If the fetch fails, keep the previous reciter's audio and say so.
  const changeReciter = useCallback(
    async (id: number) => {
      setReciterId(id);
      setAudioNote(null);
      try {
        // Coach audio is fetched in Indo-Pak only, by design: the coach's
      // word alignment is built on the Indo-Pak text (see lib/script.ts).
      // The reader may show Madani, but the coach always checks Indo-Pak.
      const res = await fetch(
          `${API}/verses/by_chapter/${surah}?fields=text_indopak&audio=${id}&per_page=all`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: { verses?: { verse_number: number; audio?: { url?: string } }[] } =
          await res.json();
        const map: Record<string, string> = {};
        for (const v of data.verses ?? []) {
          if (v.audio?.url) map[`${surah}:${v.verse_number}`] = v.audio.url;
        }
        if (Object.keys(map).length > 0) setAudioUrls(map);
        else setAudioNote('Audio for this reciter could not be loaded — keeping the previous reciter.');
      } catch {
        setAudioNote('Audio for this reciter could not be loaded — keeping the previous reciter.');
      }
    },
    [surah],
  );

  /* ---------------- offline ---------------- */

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  /* ---------------- free limits (spec §3.3, client-side) ---------------- */

  const checkFreeLimit = useCallback((): 'ok' | 'surah' | 'minutes' => {
    const settings = loadSettings();
    const today = localDateString();
    const usage = settings.freeUsage.date === today
      ? settings.freeUsage
      : { date: today, surahsRecitedToday: [], minutesRecitedToday: 0 };
    if (usage.minutesRecitedToday >= FREE_MINUTES_PER_DAY) return 'minutes';
    if (usage.surahsRecitedToday.length >= FREE_SURAHS_PER_DAY && !usage.surahsRecitedToday.includes(surahSlug)) {
      return 'surah';
    }
    return 'ok';
  }, [surahSlug]);

  const recordFreeUsage = useCallback(
    (minutes: number) => {
      // Client-side counters (spec §3.3) — bypassable by design in v1.
      const settings = loadSettings();
      const today = localDateString();
      const usage = settings.freeUsage.date === today
        ? settings.freeUsage
        : { date: today, surahsRecitedToday: [], minutesRecitedToday: 0 };
      const next = {
        ...settings,
        freeUsage: {
          date: today,
          surahsRecitedToday: usage.surahsRecitedToday.includes(surahSlug)
            ? usage.surahsRecitedToday
            : [...usage.surahsRecitedToday, surahSlug],
          minutesRecitedToday: usage.minutesRecitedToday + minutes,
        },
      };
      saveSettings(next);
    },
    [surahSlug],
  );

  /* ---------------- engine loading ---------------- */

  const loadEngineNow = useCallback(async () => {
    if (engineRef.current || engineState === 'loading') return;
    const support = engineSupport();
    if (!support.supported) {
      setEngineState('unsupported');
      return;
    }
    const abort = new AbortController();
    loadAbortRef.current = abort;
    setEngineState('loading');
    setLoadError(null);
    setEngineLoadProgress(null);
    try {
      const engine = await loadEngine({
        tier: 'auto',
        signal: abort.signal,
        onProgress: (p) => setEngineLoadProgress(p),
      });
      engineRef.current = engine;
      setEngineState('ready');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setEngineState('idle');
        setEngineLoadProgress(null);
        return;
      }
      // Model failed: the page stays usable — listen + self-mark still work (§3.2).
      setEngineState('failed');
      setLoadError('The checker could not load. You can still listen, read and self-mark.');
    }
  }, [engineState]);

  const cancelLoad = useCallback(() => {
    loadAbortRef.current?.abort();
  }, []);

  // Entering the recite step starts the (user-initiated) model download.
  const enterRecite = useCallback(() => {
    const hit = checkFreeLimit();
    if (hit !== 'ok') {
      setLimitHit(hit);
      return;
    }
    setLimitHit(null);
    setStep('recite');
    setResult(null);
    setFeedbackWords([]);
    setPeeked(false);
    setLiveWords({});
    setSelfMarks({});
    if (mode === 'mic') void loadEngineNow();
  }, [checkFreeLimit, loadEngineNow, mode]);

  /* ---------------- progress writes (spec §5.1) ---------------- */

  const persistAttempt = useCallback(
    (opts: {
      scope: CoachAyah[];
      allCorrect: boolean;
      peeked: boolean;
      minutes: number;
      mistakes: { surah: number; ayah: number; word: string; expected: string; heard?: string }[];
    }) => {
      let progress = loadProgress();
      for (const a of opts.scope) {
        progress = markAttempt(
          progress,
          a.surah,
          a.ayah,
          opts.peeked ? 'peek' : opts.allCorrect ? 'correct' : 'miss',
        );
      }
      progress = recordMinutes(progress, opts.minutes);
      // Per-type goal (§15.8): a coach attempt is memorisation practice.
      progress = recordTypeActivity(progress, 'memorisation', opts.scope.length);
      saveProgress(progress);
      if (opts.mistakes.length > 0) {
        let log = loadMistakes();
        for (const m of opts.mistakes) {
          log = addMistake(log, { ...m, date: new Date().toISOString() });
        }
        saveMistakes(log);
        setPersistedMistakes(log);
      }
      const today = localDateString();
      setDailyGoalMet(isDailyGoalMet(progress, today));
      setStreakCount(currentStreakCount(progress.streak, today));
      setAyahsToday(ayahsPractisedOn(progress, today));
      setStorageNotice(getStorageNotice());
      recordFreeUsage(opts.minutes);
    },
    [recordFreeUsage],
  );

  /* ---------------- mic recording ---------------- */

  const startRecording = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    const hit = checkFreeLimit();
    if (hit !== 'ok') {
      setLimitHit(hit);
      return;
    }
    setLimitHit(null);
    setMicError(null);
    setMicState('idle');
    const scope = scopeAyahs();
    if (scope.length === 0) return;
    const expected = scope.map((a) => ({ surah: a.surah, ayah: a.ayah, text: a.text }));
    const confirmed = new Set<string>();
    const session = engine.startSession({
      surah,
      fromAyah: scope[0].ayah,
      toAyah: scope[scope.length - 1].ayah,
      expected,
      onWord: (e: WordEvent) => {
        if (e.status === 'not-reached') return; // live events are only correct/wrong/missed
        const liveStatus: 'correct' | 'wrong' | 'missed' =
          e.status === 'correct' ? 'correct' : e.status === 'wrong' ? 'wrong' : 'missed';
        setLiveWords((prev) => ({ ...prev, [wordKey(e.surah, e.ayah, e.word)]: liveStatus }));
      },
      onLevel: (db: number) => setLevel(clamp01((db + 60) / 60)),
      onTrackerState: (s: string) => setTrackerState(s),
    });
    sessionRef.current = session;
    try {
      // Called directly in the tap handler, after the engine is already
      // loaded, so the mic prompt still counts as user-gesture work on iOS.
      await session.startMic();
    } catch (err) {
      sessionRef.current = null;
      session.dispose();
      const reason = (err as { reason?: string })?.reason;
      if (reason === 'denied') {
        setMicState('denied');
        setMicError('Microphone is blocked. Check your browser site settings to enable it.');
      } else if (reason === 'insecure-context') {
        setMicState('unavailable');
        setMicError('The coach needs a secure (HTTPS) page to use the microphone.');
      } else {
        setMicState('unavailable');
        setMicError('No microphone is available on this device. You can still practise without a mic below.');
      }
      return;
    }
    setMicState('recording');
    setLiveWords({});
    recordingStartRef.current = Date.now();
    setRecordingSecs(0);
    timerRef.current = setInterval(() => {
      setRecordingSecs(Math.floor((Date.now() - recordingStartRef.current) / 1000));
    }, 500);
  }, [checkFreeLimit, scopeAyahs, surah]);

  const stopRecording = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setMicState('checking');
    const res = await session.stop();
    sessionRef.current = null;
    setMicState('idle');
    setLevel(0);
    setResult(res);

    const scope = scopeAyahs();
    const confirmedKeys = new Set(
      res.mistakes.map((m) => wordKey(m.location.surah, m.location.ayah, m.location.word)),
    );
    const words: FeedbackWord[] = [];
    for (const a of scope) {
      for (const w of splitWords(a.text)) {
        const found = res.words.find(
          (rw) => rw.surah === a.surah && rw.ayah === a.ayah && rw.wordIndex === w.index,
        );
        words.push({
          key: wordKey(a.surah, a.ayah, w.index + 1),
          display: w.display,
          status: found ? found.status : 'not-reached',
          confirmed: confirmedKeys.has(wordKey(a.surah, a.ayah, w.index + 1)),
        });
      }
    }
    setFeedbackWords(words);
    setStep('feedback');

    const missedWords = words.filter((w) => w.status === 'missed' || w.status === 'wrong');
    const allCorrect =
      !peeked && !res.unclear && missedWords.length === 0 && res.reachedCount > 0 &&
      res.words.every((w) => w.status === 'correct' || w.status === 'not-reached');
    const minutes = Math.max(res.durationMs / 60000, 0.1);
    persistAttempt({
      scope,
      allCorrect,
      peeked,
      minutes,
      mistakes: missedWords.map((w) => {
        const [s, ay, wd] = w.key.split(':').map(Number);
        const ayahText = scope.find((a) => a.ayah === ay)?.text ?? '';
        const display = splitWords(ayahText)[wd - 1]?.display ?? w.display;
        return { surah: s, ayah: ay, word: display, expected: display };
      }),
    });
  }, [persistAttempt, peeked, scopeAyahs]);

  // Cleanup on unmount: stop any live session; the engine stays cached.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      sessionRef.current?.dispose();
      sessionRef.current = null;
      stopAudio();
    };
  }, [stopAudio]);

  /* ---------------- self-mark fallback (no mic) ---------------- */

  const submitSelfMark = useCallback(() => {
    const scope = scopeAyahs();
    const words: FeedbackWord[] = [];
    const mistakes: { surah: number; ayah: number; word: string; expected: string }[] = [];
    let correctCount = 0;
    let reachedCount = 0;
    for (const a of scope) {
      for (const w of splitWords(a.text)) {
        const key = wordKey(a.surah, a.ayah, w.index + 1);
        const marked = selfMarks[key];
        reachedCount++;
        if (marked === true) {
          correctCount++;
          words.push({ key, display: w.display, status: 'correct', confirmed: false });
        } else if (marked === false) {
          words.push({ key, display: w.display, status: 'missed', confirmed: false });
          mistakes.push({ surah: a.surah, ayah: a.ayah, word: w.display, expected: w.display });
        } else {
          words.push({ key, display: w.display, status: 'not-reached', confirmed: false });
        }
      }
    }
    const selfResult: SessionResult = {
      words: words.map((w) => {
        const [s, ay, wd] = w.key.split(':').map(Number);
        return {
          wordIndex: wd - 1, surah: s, ayah: ay, word: wd,
          status: w.status, display: w.display,
        };
      }),
      correctCount,
      reachedCount,
      missedCount: mistakes.length,
      unclear: false,
      noSpeech: false,
      trackedElsewhere: false,
      mistakes: [],
      durationMs: 0,
    };
    setResult(selfResult);
    setFeedbackWords(words);
    setStep('feedback');
    const allCorrect = !peeked && mistakes.length === 0 && reachedCount > 0;
    persistAttempt({ scope, allCorrect, peeked, minutes: 0.5, mistakes });
    // Self-marked mistakes are flagged as self-marked in the session's log
    // view. (The persisted log schema in app/hifz/progress.ts has no
    // self-marked flag — a follow-up, not changed here.)
    setSelfMarkedMistakes(
      mistakes.map((m) => ({ ...m, date: new Date().toISOString(), attempts: 1 })),
    );
  }, [persistAttempt, peeked, scopeAyahs, selfMarks]);

  /* ---------------- navigation ---------------- */

  const goToAyahIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, ayahs.length - 1));
      setCurrentIndex(clamped);
      setRangeFrom(clamped);
      setRangeTo(clamped);
      setScopeKind('single');
      setResult(null);
      setFeedbackWords([]);
      setPeeked(false);
      setStep('listen');
      onAyahChange?.(ayahs[clamped]?.ayah ?? 0);
    },
    [ayahs, onAyahChange],
  );

  const retryScope = useCallback(
    (onlyMissed: boolean) => {
      if (onlyMissed && result) {
        // Retry just the ayahs that contain missed/wrong words.
        const badAyahs = new Set(result.words.filter((w) => w.status === 'missed' || w.status === 'wrong').map((w) => w.ayah));
        const idxs = ayahs.map((a, i) => ({ a, i })).filter(({ a }) => badAyahs.has(a.ayah)).map(({ i }) => i);
        if (idxs.length > 0) {
          setCurrentIndex(idxs[0]);
          setRangeFrom(Math.min(...idxs));
          setRangeTo(Math.max(...idxs));
          setScopeKind(idxs.length > 1 ? 'range' : 'single');
        }
      }
      setResult(null);
      setFeedbackWords([]);
      setPeeked(false);
      setLiveWords({});
      setSelfMarks({});
      setStep('recite');
      if (mode === 'mic') void loadEngineNow();
    },
    [ayahs, loadEngineNow, mode, result],
  );

  const feedbackSummary = result
    ? result.reachedCount === 0
      ? 'No words were heard in that attempt.'
      : `You said ${result.correctCount} of ${result.reachedCount} words${
          result.missedCount > 0
            ? ` — ${result.missedCount} ${result.missedCount === 1 ? 'word was' : 'words were'} not heard`
            : ''
        }.`
    : '';

  const tooShort =
    !!result && !result.noSpeech && !result.unclear && result.durationMs > 0 &&
    result.durationMs < 2000 && result.reachedCount <= 1;

  const retryMistakes = persistedMistakes.filter((m) => m.surah === surah);

  /* ---------------- render ---------------- */

  return (
    <section aria-label={`Recitation coach for Surah ${surahName}`} className="rounded-2xl bg-white border border-[#e5e0d3] p-4 sm:p-6 shadow-sm">
      <audio ref={audioRef} preload="none" className="hidden" />
      <h2 className="text-xl font-bold text-[#0B3D2E]">Recite {surahName}</h2>
      <p className="mt-1 text-sm text-[#5b6b62]">
        Listen, hide the verse, then recite it aloud. The checker follows your recitation word by word, on this device.
      </p>

      {!online && (
        <p role="status" className="mt-3 rounded-lg bg-[#F7F5EF] border border-[#e5e0d3] px-3 py-2 text-sm">
          You are offline. The checker still works if it was downloaded on this device before; Quran text and audio need a connection.
        </p>
      )}
      {storageNotice && (
        <p role="status" className="mt-3 rounded-lg bg-[#F7F5EF] border border-[#e5e0d3] px-3 py-2 text-sm">{storageNotice}</p>
      )}

      {/* Steps */}
      <ol className="mt-4 flex flex-wrap gap-2 text-xs font-semibold" aria-label="Coach steps">
        {(['pick', 'listen', 'recite', 'feedback'] as Step[]).map((s, i) => (
          <li
            key={s}
            aria-current={step === s ? 'step' : undefined}
            className={`rounded-full px-3 py-1 ${step === s ? 'bg-[#0B3D2E] text-white' : 'bg-[#F7F5EF] text-[#5b6b62]'}`}
          >
            {i + 1}. {s === 'pick' ? 'Pick' : s === 'listen' ? 'Listen' : s === 'recite' ? 'Hide & recite' : 'Feedback'}
          </li>
        ))}
      </ol>

      {/* ---------- STEP 1: PICK ---------- */}
      {step === 'pick' && (
        <div className="mt-5">
          <fieldset>
            <legend className="text-sm font-semibold">What do you want to recite?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="flex items-center gap-2 rounded-lg border border-[#e5e0d3] px-3 py-2 text-sm">
                <input type="radio" name="scope" checked={scopeKind === 'single'} onChange={() => setScopeKind('single')} />
                One ayah
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-[#e5e0d3] px-3 py-2 text-sm">
                <input type="radio" name="scope" checked={scopeKind === 'range'} onChange={() => setScopeKind('range')} />
                An ayah range
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-[#e5e0d3] px-3 py-2 text-sm opacity-70">
                <input type="radio" name="scope" checked={scopeKind === 'whole'} onChange={() => setScopeKind('whole')} />
                Whole surah (Premium)
              </label>
            </div>
          </fieldset>

          {scopeKind === 'single' && (
            <label className="mt-4 block text-sm font-semibold">
              Ayah
              <select
                value={currentIndex}
                onChange={(e) => setCurrentIndex(Number(e.target.value))}
                className="mt-1 block w-full max-w-xs rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2 text-sm"
              >
                {ayahs.map((a, i) => (
                  <option key={`${a.surah}:${a.ayah}`} value={i}>
                    {a.surah}:{a.ayah}
                  </option>
                ))}
              </select>
            </label>
          )}
          {scopeKind === 'range' && (
            <div className="mt-4 flex flex-wrap gap-4">
              <label className="text-sm font-semibold">
                From ayah
                <select value={rangeFrom} onChange={(e) => setRangeFrom(Number(e.target.value))} className="mt-1 block rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2 text-sm">
                  {ayahs.map((a, i) => (<option key={`f-${a.ayah}`} value={i}>{a.surah}:{a.ayah}</option>))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                To ayah
                <select value={rangeTo} onChange={(e) => setRangeTo(Number(e.target.value))} className="mt-1 block rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2 text-sm">
                  {ayahs.map((a, i) => (<option key={`t-${a.ayah}`} value={i}>{a.surah}:{a.ayah}</option>))}
                </select>
              </label>
            </div>
          )}
          {scopeKind === 'whole' && (
            <p className="mt-4 rounded-lg bg-[#F7F5EF] border border-[#e5e0d3] px-3 py-2 text-sm">
              Whole-surah review mode is part of Premium. Free recitation covers one ayah or one range per session.{' '}
              <a href={PREMIUM_ANCHOR} className="font-semibold text-[#146B4D] underline">See Premium</a>
              {' '}— coming soon, free during testing.
            </p>
          )}

          <label className="mt-4 block text-sm font-semibold">
            Reciter
            <select
              value={reciterId}
              onChange={(e) => void changeReciter(Number(e.target.value))}
              className="mt-1 block w-full max-w-xs rounded-lg border border-[#e5e0d3] bg-[#F7F5EF] px-3 py-2 text-sm"
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </label>
          {audioNote && <p role="status" className="mt-2 text-sm text-[#5b6b62]">{audioNote}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setStep('listen'); }}
              disabled={scopeKind === 'whole' || scopeAyahs().length === 0}
              className="rounded-full bg-[#0B3D2E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#146B4D] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
            >
              Listen first
            </button>
            <button
              type="button"
              onClick={enterRecite}
              disabled={scopeKind === 'whole' || scopeAyahs().length === 0}
              className="rounded-full border border-[#0B3D2E] px-5 py-2.5 text-sm font-semibold text-[#0B3D2E] hover:bg-[#eaf3ee] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
            >
              Recite now
            </button>
          </div>
          {limitHit && (
            <p role="alert" className="mt-3 rounded-lg bg-[#F7F5EF] border border-[#e5e0d3] px-3 py-2 text-sm">
              {limitHit === 'surah'
                ? "You've used today's free recitation on another surah — come back tomorrow, or see Premium."
                : "You've used today's 10 free minutes of recitation — come back tomorrow, or see Premium."}{' '}
              <a href={PREMIUM_ANCHOR} className="font-semibold text-[#146B4D] underline">See Premium</a>
            </p>
          )}
        </div>
      )}

      {/* ---------- STEP 2: LISTEN ---------- */}
      {step === 'listen' && (
        <div className="mt-5">
          <p className="text-sm font-semibold">Listen — {scopeLabel}</p>
          <p className="mt-1 text-sm text-[#5b6b62]">
            Reciter: {RECITERS.find((r) => r.id === reciterId)?.name ?? 'Mishary Alafasy'}. Words highlight per ayah as it plays.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={playScopeAudio}
              className="rounded-full bg-[#146B4D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0B3D2E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
            >
              {playingKey ? 'Playing… tap to stop' : 'Play'}
            </button>
            {playingKey && (
              <button type="button" onClick={stopAudio} className="rounded-full border border-[#e5e0d3] px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]">
                Stop audio
              </button>
            )}
            <button
              type="button"
              onClick={enterRecite}
              className="rounded-full bg-[#0B3D2E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
            >
              Hide &amp; recite
            </button>
          </div>
          {limitHit && (
            <p role="alert" className="mt-3 rounded-lg bg-[#F7F5EF] border border-[#e5e0d3] px-3 py-2 text-sm">
              {limitHit === 'surah'
                ? "You've used today's free recitation on another surah — come back tomorrow, or see Premium."
                : "You've used today's 10 free minutes of recitation — come back tomorrow, or see Premium."}{' '}
              <a href={PREMIUM_ANCHOR} className="font-semibold text-[#146B4D] underline">See Premium</a>
            </p>
          )}
          <div className="mt-4 space-y-3">
            {scopeAyahs().map((a) => {
              const key = `${a.surah}:${a.ayah}`;
              return (
                <div key={key} className={`rounded-xl border p-3 ${playingKey === key ? 'border-[#C9A227] bg-[#F7F5EF]' : 'border-[#e5e0d3]'}`}>
                  <p dir="rtl" lang="ar" className="font-quran text-2xl sm:text-3xl leading-loose text-right">{a.text}</p>
                  {a.translation && <p className="mt-1 text-sm text-[#5b6b62]">{a.translation}</p>}
                  <button
                    type="button"
                    onClick={() => playAyahAudio(ayahs.findIndex((x) => x.surah === a.surah && x.ayah === a.ayah))}
                    disabled={!audioSrcFor(a)}
                    className="mt-2 rounded-full border border-[#e5e0d3] px-3 py-1.5 text-xs font-semibold hover:border-[#146B4D] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
                  >
                    {playingKey === key ? 'Stop' : `Play ${a.surah}:${a.ayah}`}
                  </button>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={() => setStep('pick')} className="mt-4 text-sm font-semibold text-[#146B4D] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]">
            Change ayah or reciter
          </button>
        </div>
      )}

      {/* ---------- STEP 3: HIDE & RECITE ---------- */}
      {step === 'recite' && (
        <div className="mt-5">
          <p className="text-sm font-semibold">Recite — {scopeLabel}</p>

          {/* Teacher disclaimer, verbatim, above the mic button (research §6). */}
          <p className="mt-3 rounded-lg bg-[#eaf3ee] border border-[#146B4D]/20 px-3 py-2 text-sm">{TEACHER_DISCLAIMER}</p>

          {/* Mode switch */}
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Practice mode">
            <button
              type="button"
              onClick={() => setMode('mic')}
              aria-pressed={mode === 'mic'}
              className={`rounded-full px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D] ${mode === 'mic' ? 'bg-[#0B3D2E] text-white' : 'border border-[#e5e0d3]'}`}
            >
              Use microphone
            </button>
            <button
              type="button"
              onClick={() => setMode('self-mark')}
              aria-pressed={mode === 'self-mark'}
              className={`rounded-full px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D] ${mode === 'self-mark' ? 'bg-[#0B3D2E] text-white' : 'border border-[#e5e0d3]'}`}
            >
              Practice without mic
            </button>
          </div>

          {/* Hide / prompt controls */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setArabicHidden((h) => !h)}
              aria-pressed={arabicHidden}
              className="rounded-full border border-[#e5e0d3] px-4 py-2 text-sm font-semibold hover:border-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
            >
              {arabicHidden ? 'Show Arabic' : 'Hide Arabic'}
            </button>
            <button
              type="button"
              onClick={() => setShowTranslation((s) => !s)}
              aria-pressed={showTranslation}
              className="rounded-full border border-[#e5e0d3] px-4 py-2 text-sm font-semibold hover:border-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
            >
              {showTranslation ? 'Hide translation prompt' : 'Show translation prompt'}
            </button>
            {arabicHidden && !peeked && (
              <button
                type="button"
                onClick={() => setPeeked(true)}
                className="rounded-full border border-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B3D2E] hover:bg-[#F7F5EF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
              >
                Peek
              </button>
            )}
          </div>
          {peeked && (
            <p role="status" className="mt-2 text-sm text-[#5b6b62]">
              You peeked — this attempt counts as a miss for streak purposes. That is honest practice, not a failure.
            </p>
          )}

          {/* The verse: hidden, revealed word-by-word as recited, or shown. */}
          <div className="mt-4 rounded-xl border border-[#e5e0d3] p-4">
            {scopeAyahs().map((a) => (
              <div key={`${a.surah}:${a.ayah}`} className="mt-2 first:mt-0">
                <p dir="rtl" lang="ar" className="font-quran text-2xl sm:text-3xl leading-loose text-right">
                  {splitWords(a.text).map((w) => {
                    const key = wordKey(a.surah, a.ayah, w.index + 1);
                    const live = liveWords[key];
                    if (!arabicHidden || peeked) {
                      return (
                        <span
                          key={key}
                          className={live === 'correct' ? 'text-[#146B4D]' : live ? 'bg-[#e7d9a8] rounded px-0.5' : undefined}
                        >
                          {w.display}{' '}
                        </span>
                      );
                    }
                    // Hidden: words appear as they are recited correctly; the rest stay blank.
                    return (
                      <span key={key} className={live === 'correct' ? 'text-[#146B4D]' : 'text-[#e5e0d3]'}>
                        {live === 'correct' ? w.display : '••••'}{' '}
                      </span>
                    );
                  })}
                </p>
                {showTranslation && a.translation && (
                  <p className="mt-1 text-sm text-[#5b6b62]">{a.translation}</p>
                )}
              </div>
            ))}
          </div>

          {mode === 'mic' ? (
            <div className="mt-5 text-center">
              {engineState === 'loading' && engineLoadProgress && (
                <div className="mx-auto max-w-md text-left">
                  <p role="status" className="text-sm font-semibold">
                    Loading the recitation checker… {engineLoadProgress.stage} {Math.round(engineLoadProgress.fraction * 100)}%
                  </p>
                  <p className="mt-1 text-xs text-[#5b6b62]">
                    {engineLoadProgress.tierLabel}
                    {engineLoadProgress.fromCache ? ' — loaded from this device.' : ' — downloaded once, then kept on this device.'}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e5e0d3]" aria-hidden="true">
                    <div className="h-full bg-[#146B4D]" style={{ width: `${Math.round(engineLoadProgress.fraction * 100)}%` }} />
                  </div>
                  <button type="button" onClick={cancelLoad} className="mt-2 text-sm font-semibold text-[#146B4D] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]">
                    Cancel download
                  </button>
                </div>
              )}
              {engineState === 'failed' && (
                <div className="mx-auto max-w-md rounded-lg bg-[#F7F5EF] border border-[#e5e0d3] px-3 py-2 text-sm text-left">
                  <p role="alert">{loadError ?? 'The checker could not load. You can still listen, read and self-mark.'}</p>
                  <div className="mt-2 flex gap-3">
                    <button type="button" onClick={() => void loadEngineNow()} className="font-semibold text-[#146B4D] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]">
                      Retry loading the checker
                    </button>
                    <button type="button" onClick={() => setMode('self-mark')} className="font-semibold text-[#146B4D] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]">
                      Practice without mic
                    </button>
                  </div>
                </div>
              )}
              {engineState === 'unsupported' && (
                <p role="alert" className="mx-auto max-w-md rounded-lg bg-[#F7F5EF] border border-[#e5e0d3] px-3 py-2 text-sm text-left">
                  The checker cannot run in this browser. You can still listen and practise with self-marking below.
                </p>
              )}
              {engineState === 'idle' && (
                <button
                  type="button"
                  onClick={() => void loadEngineNow()}
                  className="rounded-full bg-[#0B3D2E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
                >
                  Load the checker ({autoTierLabel()})
                </button>
              )}

              {engineState === 'ready' && micState !== 'recording' && micState !== 'checking' && (
                <>
                  <p className="text-sm text-[#5b6b62]">We need the microphone to hear your recitation. Audio is processed on your device and never uploaded.</p>
                  <p className="mt-1 text-sm text-[#5b6b62]">Take a breath, then begin — the checker needs about a second to start listening.</p>
                  <button
                    type="button"
                    onClick={() => void startRecording()}
                    aria-label="Start recording your recitation"
                    className="mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#0B3D2E] text-white shadow hover:bg-[#146B4D] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C9A227]"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
                      <rect x="9" y="2" width="6" height="12" rx="3" />
                      <path d="M5 10a7 7 0 0 0 14 0M12 19v3" />
                    </svg>
                  </button>
                  <p className="mt-2 text-sm font-semibold">Tap to recite</p>
                </>
              )}
              {micState === 'recording' && (
                <div>
                  <p role="status" className="text-sm font-semibold text-[#B42318]">Recording… {Math.floor(recordingSecs / 60)}:{String(recordingSecs % 60).padStart(2, '0')}</p>
                  {trackerState && <p className="mt-1 text-xs text-[#5b6b62]">Checker: {trackerState}</p>}
                  <div className="mx-auto mt-3 h-3 w-full max-w-md overflow-hidden rounded-full bg-[#e5e0d3]" role="meter" aria-label="Microphone level" aria-valuenow={Math.round(level * 100)} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-[#146B4D] transition-[width] duration-100" style={{ width: `${Math.round(level * 100)}%` }} />
                  </div>
                  <button
                    type="button"
                    onClick={() => void stopRecording()}
                    className="mt-4 rounded-full bg-[#B42318] px-6 py-3 text-sm font-semibold text-white hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318]"
                  >
                    Stop &amp; check
                  </button>
                </div>
              )}
              {micState === 'checking' && (
                <p role="status" className="mt-3 text-sm font-semibold">Checking your recitation…</p>
              )}
              {(micState === 'denied' || micState === 'unavailable') && micError && (
                <div className="mx-auto mt-3 max-w-md rounded-lg bg-[#F7F5EF] border border-[#e5e0d3] px-3 py-2 text-sm text-left">
                  <p role="alert">{micError}</p>
                  <button type="button" onClick={() => setMode('self-mark')} className="mt-2 font-semibold text-[#146B4D] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]">
                    Practice without mic
                  </button>
                </div>
              )}
              {limitHit && (
                <p role="alert" className="mx-auto mt-3 max-w-md rounded-lg bg-[#F7F5EF] border border-[#e5e0d3] px-3 py-2 text-sm text-left">
                  {limitHit === 'surah'
                    ? "You've used today's free recitation on another surah — come back tomorrow, or see Premium."
                    : "You've used today's 10 free minutes of recitation — come back tomorrow, or see Premium."}{' '}
                  <a href={PREMIUM_ANCHOR} className="font-semibold text-[#146B4D] underline">See Premium</a>
                </p>
              )}
            </div>
          ) : (
            <div className="mt-5">
              <p className="text-sm text-[#5b6b62]">
                Listen above, recite from memory, then mark each word yourself: correct, or not quite. Self-marked words are flagged as self-marked in the log.
              </p>
              <div className="mt-3 space-y-3">
                {scopeAyahs().map((a) => (
                  <div key={`sm-${a.surah}:${a.ayah}`} className="rounded-xl border border-[#e5e0d3] p-3">
                    <p className="text-xs font-semibold text-[#5b6b62]">{a.surah}:{a.ayah}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {splitWords(a.text).map((w) => {
                        const key = wordKey(a.surah, a.ayah, w.index + 1);
                        const marked = selfMarks[key];
                        return (
                          <span key={key} className="inline-flex items-center gap-1 rounded-full border border-[#e5e0d3] px-2 py-1">
                            <span dir="rtl" lang="ar" className="font-quran text-lg leading-none">{w.display}</span>
                            <button
                              type="button"
                              aria-pressed={marked === true}
                              aria-label={`Mark ${w.display} correct`}
                              onClick={() => setSelfMarks((p) => ({ ...p, [key]: true }))}
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D] ${marked === true ? 'bg-[#146B4D] text-white' : 'bg-[#eaf3ee]'}`}
                            >
                              Correct
                            </button>
                            <button
                              type="button"
                              aria-pressed={marked === false}
                              aria-label={`Mark ${w.display} not quite`}
                              onClick={() => setSelfMarks((p) => ({ ...p, [key]: false }))}
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D] ${marked === false ? 'bg-[#C9A227] text-[#0B3D2E]' : 'bg-[#F7F5EF]'}`}
                            >
                              Not quite
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={submitSelfMark}
                className="mt-4 rounded-full bg-[#0B3D2E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
              >
                Save my self-marking
              </button>
            </div>
          )}

          <button type="button" onClick={() => { stopAudio(); setStep('listen'); }} className="mt-5 text-sm font-semibold text-[#146B4D] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]">
            Back to listening
          </button>
        </div>
      )}

      {/* ---------- STEP 4: FEEDBACK ---------- */}
      {step === 'feedback' && result && (
        <div className="mt-5">
          <p className="text-sm font-semibold">Feedback — {scopeLabel}</p>
          <p className="mt-1 rounded-lg bg-[#eaf3ee] border border-[#146B4D]/20 px-3 py-2 text-sm">{TEACHER_DISCLAIMER}</p>

          {result.noSpeech ? (
            <p role="alert" className="mt-3 rounded-lg bg-[#F7F5EF] border border-[#e5e0d3] px-3 py-2 text-sm">
              We didn&apos;t hear anything. Check your mic and try again.
            </p>
          ) : result.trackedElsewhere ? (
            <p role="alert" className="mt-3 rounded-lg bg-[#F7F5EF] border border-[#e5e0d3] px-3 py-2 text-sm">
              That didn&apos;t sound like this ayah — check you&apos;re reciting the right one, then try again.
            </p>
          ) : result.unclear ? (
            <p role="alert" className="mt-3 rounded-lg bg-[#F7F5EF] border border-[#e5e0d3] px-3 py-2 text-sm">{UNCLEAR_COPY}</p>
          ) : tooShort ? (
            <p role="alert" className="mt-3 rounded-lg bg-[#F7F5EF] border border-[#e5e0d3] px-3 py-2 text-sm">
              That was too short to check. Try reciting the full ayah.
            </p>
          ) : (
            <p role="status" className="mt-3 text-base font-semibold">{feedbackSummary}</p>
          )}
          {peeked && (
            <p className="mt-2 text-sm text-[#5b6b62]">You peeked during this attempt, so it counts as a miss for your streak.</p>
          )}
          {mode === 'self-mark' && (
            <p className="mt-2 text-sm text-[#5b6b62]">Self-marked attempt — these marks are yours, not the checker&apos;s.</p>
          )}

          {/* Per-word marking. Colour is never the only signal: every word carries a text label. */}
          <div className="mt-4 space-y-3">
            {scopeAyahs().map((a) => (
              <div key={`fb-${a.surah}:${a.ayah}`} className="rounded-xl border border-[#e5e0d3] p-3">
                <p className="text-xs font-semibold text-[#5b6b62]">{a.surah}:{a.ayah}</p>
                <p dir="rtl" lang="ar" className="font-quran mt-1 text-2xl sm:text-3xl leading-loose text-right">
                  {splitWords(a.text).map((w) => {
                    const key = wordKey(a.surah, a.ayah, w.index + 1);
                    const fw = feedbackWords.find((f) => f.key === key);
                    const status = fw?.status ?? 'not-reached';
                    const showColour = !result.unclear && !result.noSpeech && !result.trackedElsewhere && !tooShort;
                    const cls = !showColour
                      ? 'text-[#1C2420]'
                      : status === 'correct'
                        ? 'bg-[#146B4D] text-white rounded px-1'
                        : status === 'wrong'
                          ? 'bg-[#B42318] text-white rounded px-1'
                          : status === 'missed'
                            ? 'bg-[#e7d9a8] text-[#0B3D2E] rounded px-1'
                            : 'bg-[#e5e0d3] text-[#5b6b62] rounded px-1';
                    const label = !showColour
                      ? 'not checked'
                      : status === 'correct'
                        ? 'correct'
                        : status === 'wrong'
                          ? 'check this word'
                          : status === 'missed'
                            ? 'not heard'
                            : 'not reached yet';
                    return (
                      <span key={key} className={cls} title={label}>
                        {w.display}{' '}
                        <span className="sr-only">({label})</span>
                      </span>
                    );
                  })}
                </p>
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#5b6b62]">
                  <span><span className="inline-block h-3 w-3 rounded-sm bg-[#146B4D] align-middle" /> Correct</span>
                  <span><span className="inline-block h-3 w-3 rounded-sm bg-[#e7d9a8] align-middle" /> Not heard</span>
                  <span><span className="inline-block h-3 w-3 rounded-sm bg-[#B42318] align-middle" /> Check this word</span>
                  <span><span className="inline-block h-3 w-3 rounded-sm bg-[#e5e0d3] align-middle" /> Not reached yet</span>
                </p>
              </div>
            ))}
          </div>

          {/* Words to retry (mistake log, this surah). */}
          {retryMistakes.length > 0 && (
            <div className="mt-4 rounded-xl border border-[#e5e0d3] p-3">
              <p className="text-sm font-semibold">Words to retry</p>
              <ul className="mt-2 space-y-1 text-sm">
                {retryMistakes.slice(-10).map((m, i) => (
                  <li key={`${m.surah}:${m.ayah}:${m.word}:${i}`}>
                    <span dir="rtl" lang="ar" className="font-quran text-lg">{m.word}</span>
                    {' '}— {m.surah}:{m.ayah} · practised {m.attempts} {m.attempts === 1 ? 'time' : 'times'}
                    {selfMarkedMistakes.some((s) => s.surah === m.surah && s.ayah === m.ayah && s.word === m.word) && (
                      <span className="ml-2 rounded-full bg-[#F7F5EF] px-2 py-0.5 text-xs font-semibold">self-marked</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {dailyGoalMet && (
            <p role="status" className="mt-4 rounded-lg bg-[#eaf3ee] border border-[#146B4D]/20 px-3 py-2 text-sm font-semibold">
              Daily goal met — you practised {ayahsToday} {ayahsToday === 1 ? 'ayah' : 'ayahs'} today. Streak: {streakCount} {streakCount === 1 ? 'day' : 'days'}.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => retryScope(true)}
              className="rounded-full bg-[#0B3D2E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
            >
              Retry these words
            </button>
            <button
              type="button"
              onClick={() => retryScope(false)}
              className="rounded-full border border-[#0B3D2E] px-5 py-2.5 text-sm font-semibold text-[#0B3D2E] hover:bg-[#eaf3ee] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
            >
              Retry full ayah
            </button>
            {currentIndex < ayahs.length - 1 && (
              <button
                type="button"
                onClick={() => goToAyahIndex(currentIndex + 1)}
                className="rounded-full border border-[#e5e0d3] px-5 py-2.5 text-sm font-semibold hover:border-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
              >
                Next ayah
              </button>
            )}
            <button
              type="button"
              onClick={() => { setStep('listen'); }}
              className="rounded-full border border-[#e5e0d3] px-5 py-2.5 text-sm font-semibold hover:border-[#146B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146B4D]"
            >
              Listen again
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 border-t border-[#e5e0d3] pt-3 text-xs text-[#5b6b62]">
        Quran text, translation and audio via Quran.com. Your recitation audio never leaves your device. A teacher is still needed for tajweed — this tool checks words, not tajweed.
      </p>
    </section>
  );
}

export type { SessionResult };
