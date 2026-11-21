'use client';

/**
 * app/hifz/components/RecitationCoach.tsx — the Hifz recitation coach.
 *
 * Spec §3 (coach flow), §3.2 (states), §8 (feedback). Everything is free —
 * Research: hifz-recitation-feedback-20261121, §5 (alignment), §6 (risks/UI copy).
 *
 * LOAD RULES (spec §6 performance budget): this component is a client island
 * meant to be loaded via `next/dynamic(..., { ssr: false })` ONLY when the
 * user opens it (`?mode=recite` or taps "Recite") — do NOT import it from any
 * page statically. The engine itself loads even later: `loadEngine()` runs
 * only after the user enters the "Hide & recite" step, so the ~25 MB model
 * download is always user-initiated and never in the first-paint bundle.
 *
 * ENGINE: Tilawa (`@tilawa/core`, MIT, on-device) via app/hifz/lib/tilawa.ts.
 * Audio is processed on-device and never uploaded by the app. A recording
 * of your recitation is kept only as an in-memory blob for this browser
 * session, and leaves the device only if you choose to share or download
 * it (see ShareAudio.tsx — explicit, per-recitation, user-initiated; no
 * auto-share, no default-on toggle). The mistake log keeps word references
 * (surah:ayah:word) only (spec §8.2). The Web Speech API is NOT used
 * (research §3 forbids it as the core engine).
 *
 * FEEDBACK HONESTY (measured 2026-11-21, tools/test-tilawa.mjs, lite tier):
 *  - The checker confirms almost no wrong words on clean recitation (0
 *    confirmed mistakes on Al-Fatihah + Al-Mulk), and the tracker blind
 *    spots that used to false-flag correct words (6.9% Fatihah, 9.4%
 *    Mulk) are now graced to "Not heard" instead of "missed" (see
 *    app/hifz/lib/tilawa.ts graces A/B/C): measured false-flag rate on
 *    clean professional recitation is now 0.0% on all six harness cases
 *    (Fatihah 0/29, Mulk 0/64, warm-up 0/4, single ayah 0/4), with
 *    wrong-ayah and silence detection intact. The full 68 MB model scores
 *    identically to the 25 MB lite model on every case, so the coach
 *    loads lite (see loadEngineNow). A word the tracker never observed is
 *    shown as "Not heard" (amber), never as a confident "wrong". Only a
 *    checker-CONFIRMED wrong word is labelled "Check this word" (red
 *    tint). Per-word colours are never shown when the attempt is unclear
 *    — the UI says so and offers a retry (research §5.7).
 *  - Never a percentage grade, never tajweed (spec §8).
 *
 * EVERYTHING IS FREE: no daily limits, no surah cap, no paid tier. The coach,
 * plans, mistake log and progress are free for everyone, always. No billing,
 * no paywall on text / translation / tafsir / audio — those are free, always.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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
  type HifzSettings,
  type MistakeEntry,
} from '../progress';
import { splitWords } from '../lib/alignment';
import { MistakeHistorySheet, SessionAnalyticsSheet, type HistoryRow } from './SharedSheets';
import { ShareAudioButtons, audioExtension, recordingFileName, type SharedRecording } from './ShareAudio';
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

/** Teacher disclaimer — research §6, verbatim except the last sentence,
 * updated 2026-11-22 for the teacher-share feature so it stays truthful:
 * sharing a recording is an explicit choice the user makes after a
 * session; nothing is sent automatically. Above the mic button AND on the
 * feedback screen. */
export const TEACHER_DISCLAIMER =
  'This checks which words you said — it does not judge tajweed. It can miss words, especially in noise, and it can flag a word you said correctly. Use it to practise between lessons. A teacher is still needed for tajweed. Your voice never leaves this device unless you choose to share a recording with your teacher.';

/** Low-confidence attempt — research §6, verbatim. */
export const UNCLEAR_COPY =
  "I couldn't hear this clearly. Check your microphone, move somewhere quieter, and try again.";

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
type CoachMode = 'mic' | 'self-mark' | 'follow';

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

/** Strip Arabic diacritics + tatweel so "ignore harakat" can compare the
 * bare letters of what was heard vs what was expected. */
export function stripDiacritics(s: string): string {
  return s.replace(/[\u064B-\u0652\u0670\u0640]/g, '').trim();
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function RecitationCoach({
  surah,
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

  useEffect(() => {
    try {
      setSettings(loadSettings());
      setHighlightOn(loadSettings().highlightMistakes ?? true);
    } catch {
      /* defaults */
    }
  }, []);

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
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  // Screenshot-spec rebuild (§22): settings, peek tracking, live correction.
  const [settings, setSettings] = useState<HifzSettings | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [peekCount, setPeekCount] = useState(0);
  const [selectedMistake, setSelectedMistake] = useState<string | null>(null);
  const [removedMistakes, setRemovedMistakes] = useState<Set<string>>(new Set());
  const [showMistakeHistory, setShowMistakeHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [highlightOn, setHighlightOn] = useState(true);
  const [highlightToast, setHighlightToast] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  // The recording blob behind recordingUrl — kept in memory only, for the
  // current browser session, so it can be shared with a teacher or
  // downloaded (see ShareAudio.tsx). Never persisted, never uploaded.
  const [recording, setRecording] = useState<SharedRecording | null>(null);
  const [pendingFix, setPendingFix] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordStreamRef = useRef<MediaStream | null>(null);
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
    return ayahs; // whole surah
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
        // Lite, not auto/full: measured 2026-11-21 (tools/test-tilawa.mjs),
        // the 68 MB full model scores IDENTICALLY to the 25 MB lite model
        // on clean recitation (Fatihah 6.9%, Mulk 9.4% false flags, both
        // tiers, same words) and is slower to download and run. Lite is
        // the better default for every device; the adapter still supports
        // 'auto'/'full' if a future measurement ever justifies them.
        tier: 'lite',
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
    setStep('recite');
    setResult(null);
    setFeedbackWords([]);
    setPeeked(false);
    setRevealedCount(0);
    setPeekCount(0);
    setSelectedMistake(null);
    setRecordingUrl(null);
    setRecording(null);
    setLiveWords({});
    setSelfMarks({});
    if (mode === 'mic' || mode === 'follow') void loadEngineNow();
  }, [loadEngineNow, mode]);

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
    },
    [],
  );

  /* ---------------- mic recording ---------------- */

  const startRecording = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
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
    // Own-recording playback (device only): a second mic stream captured
    // with MediaRecorder, kept as a blob URL, never uploaded. Best effort —
    // if the browser refuses a second stream, reciting still works.
    if (settings?.saveAudio !== false) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recordStreamRef.current = stream;
        recordChunksRef.current = [];
        const rec = new MediaRecorder(stream);
        rec.ondataavailable = (e) => {
          if (e.data.size > 0) recordChunksRef.current.push(e.data);
        };
        rec.start(250);
        recorderRef.current = rec;
      } catch {
        recorderRef.current = null;
      }
    }
    recordingStartRef.current = Date.now();
    setRecordingSecs(0);
    timerRef.current = setInterval(() => {
      setRecordingSecs(Math.floor((Date.now() - recordingStartRef.current) / 1000));
    }, 500);
  }, [scopeAyahs, surah, settings]);

  const stopRecording = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Stop the own-recording capture and keep it as a blob URL (device only).
    try {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          const rec = recorderRef.current;
          if (!rec) return resolve();
          rec.onstop = () => resolve();
          try { rec.stop(); } catch { resolve(); }
        });
        const mimeType = recorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(recordChunksRef.current, { type: mimeType });
        if (blob.size > 0) {
          setRecordingUrl(URL.createObjectURL(blob));
          const scope = scopeAyahs();
          setRecording({
            blob,
            fileName: recordingFileName(
              surah,
              scope[0]?.ayah ?? 0,
              scope[scope.length - 1]?.ayah ?? 0,
              audioExtension(mimeType),
            ),
          });
        }
      }
    } catch {
      /* recording unavailable — reciting still counts */
    } finally {
      recordStreamRef.current?.getTracks().forEach((t) => t.stop());
      recordStreamRef.current = null;
      recorderRef.current = null;
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
    // Harakat option (§22): when "strict harakat" is OFF, a word the engine
    // heard with only the vowel marks different counts as correct.
    const harakatStrict = settings?.harakatStrict ?? false;
    const words: FeedbackWord[] = [];
    for (const a of scope) {
      for (const w of splitWords(a.text)) {
        const found = res.words.find(
          (rw) => rw.surah === a.surah && rw.ayah === a.ayah && rw.wordIndex === w.index,
        );
        let status: FeedbackWord['status'] = found ? found.status : 'not-reached';
        if (
          !harakatStrict &&
          status === 'wrong' &&
          found?.heard &&
          stripDiacritics(found.heard) === stripDiacritics(w.display)
        ) {
          status = 'correct';
        }
        words.push({
          key: wordKey(a.surah, a.ayah, w.index + 1),
          display: w.display,
          status,
          confirmed: confirmedKeys.has(wordKey(a.surah, a.ayah, w.index + 1)),
        });
      }
    }
    setFeedbackWords(words);
    setStep('feedback');

    const missedWords = words.filter((w) => w.status === 'missed' || w.status === 'wrong');
    const allCorrect =
      !peeked && !res.unclear && missedWords.length === 0 && res.reachedCount > 0 &&
      words.every((w) => w.status === 'correct' || w.status === 'not-reached');
    const minutes = Math.max(res.durationMs / 60000, 0.1);
    if (mode === 'follow') {
      // Follow-along: highlight only, no judgement — count the minutes, never
      // log a mistake or touch the streak.
      let p = loadProgress();
      p = recordMinutes(p, minutes);
      saveProgress(p);
      setPendingFix(false);
      return;
    }
    if (settings?.dontProgress) {
      // "Don't progress until mistake is fixed": hold on this ayah until a
      // later attempt comes back clean.
      setPendingFix(missedWords.length > 0 ? true : false);
    }
    persistAttempt({
      scope,
      allCorrect,
      peeked,
      minutes,
      mistakes: missedWords.map((w) => {
        const [s, ay, wd] = w.key.split(':').map(Number);
        const ayahText = scope.find((a) => a.ayah === ay)?.text ?? '';
        const display = splitWords(ayahText)[wd - 1]?.display ?? w.display;
        const heard = res.words.find(
          (rw) => rw.surah === s && rw.ayah === ay && rw.wordIndex === wd - 1,
        )?.heard;
        return { surah: s, ayah: ay, word: display, expected: display, ...(heard ? { heard } : {}) };
      }),
    });
  }, [persistAttempt, peeked, scopeAyahs, mode, settings]);

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
      setRevealedCount(0);
      setPeekCount(0);
      setSelectedMistake(null);
      setRecordingUrl(null);
      setRecording(null);
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
      setRevealedCount(0);
      setPeekCount(0);
      setSelectedMistake(null);
      setRecordingUrl(null);
      setRecording(null);
      setLiveWords({});
      setSelfMarks({});
      setStep('recite');
      if (mode === 'mic' || mode === 'follow') void loadEngineNow();
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
    <section aria-label={`Recitation coach for Surah ${surahName}`} className="rounded-2xl bg-white border border-[#E5E7EB] p-4 sm:p-6 shadow-sm">
      <audio ref={audioRef} preload="none" className="hidden" />
      <h2 className="text-xl font-bold text-[#102E26]">Recite {surahName}</h2>
      <p className="mt-1 text-sm text-[#5b6b62]">
        Listen, hide the verse, then recite it aloud. The checker follows your recitation word by word, on this device.
      </p>

      {!online && (
        <p role="status" className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm">
          You are offline. The checker still works if it was downloaded on this device before; Quran text and audio need a connection.
        </p>
      )}
      {storageNotice && (
        <p role="status" className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm">{storageNotice}</p>
      )}

      {/* Steps */}
      <ol className="mt-4 flex flex-wrap gap-2 text-xs font-semibold" aria-label="Coach steps">
        {(['pick', 'listen', 'recite', 'feedback'] as Step[]).map((s, i) => (
          <li
            key={s}
            aria-current={step === s ? 'step' : undefined}
            className={`rounded-full px-3 py-1 ${step === s ? 'bg-[#102E26] text-white' : 'bg-[#FFFBF2] text-[#5b6b62]'}`}
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
              <label className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
                <input type="radio" name="scope" checked={scopeKind === 'single'} onChange={() => setScopeKind('single')} />
                One ayah
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
                <input type="radio" name="scope" checked={scopeKind === 'range'} onChange={() => setScopeKind('range')} />
                An ayah range
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
                <input type="radio" name="scope" checked={scopeKind === 'whole'} onChange={() => setScopeKind('whole')} />
                Whole surah
              </label>
            </div>
          </fieldset>

          {scopeKind === 'single' && (
            <label className="mt-4 block text-sm font-semibold">
              Ayah
              <select
                value={currentIndex}
                onChange={(e) => setCurrentIndex(Number(e.target.value))}
                className="mt-1 block w-full max-w-xs rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2 text-sm"
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
                <select value={rangeFrom} onChange={(e) => setRangeFrom(Number(e.target.value))} className="mt-1 block rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2 text-sm">
                  {ayahs.map((a, i) => (<option key={`f-${a.ayah}`} value={i}>{a.surah}:{a.ayah}</option>))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                To ayah
                <select value={rangeTo} onChange={(e) => setRangeTo(Number(e.target.value))} className="mt-1 block rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2 text-sm">
                  {ayahs.map((a, i) => (<option key={`t-${a.ayah}`} value={i}>{a.surah}:{a.ayah}</option>))}
                </select>
              </label>
            </div>
          )}
          <label className="mt-4 block text-sm font-semibold">
            Reciter
            <select
              value={reciterId}
              onChange={(e) => void changeReciter(Number(e.target.value))}
              className="mt-1 block w-full max-w-xs rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2 text-sm"
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
              disabled={scopeAyahs().length === 0}
              className="rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              Listen first
            </button>
            <button
              type="button"
              onClick={enterRecite}
              disabled={scopeAyahs().length === 0}
              className="rounded-full border border-[#102E26] px-5 py-2.5 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              Recite now
            </button>
          </div>
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
              className="rounded-full bg-[#1FA36B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#102E26] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              {playingKey ? 'Playing… tap to stop' : 'Play'}
            </button>
            {playingKey && (
              <button type="button" onClick={stopAudio} className="rounded-full border border-[#E5E7EB] px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]">
                Stop audio
              </button>
            )}
            <button
              type="button"
              onClick={enterRecite}
              className="rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              Hide &amp; recite
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {scopeAyahs().map((a) => {
              const key = `${a.surah}:${a.ayah}`;
              return (
                <div key={key} className={`rounded-xl border p-3 ${playingKey === key ? 'border-[#FFB800] bg-[#FFFBF2]' : 'border-[#E5E7EB]'}`}>
                  <p dir="rtl" lang="ar" className="font-quran text-2xl sm:text-3xl leading-loose text-right">{a.text}</p>
                  {a.translation && <p className="mt-1 text-sm text-[#5b6b62]">{a.translation}</p>}
                  <button
                    type="button"
                    onClick={() => playAyahAudio(ayahs.findIndex((x) => x.surah === a.surah && x.ayah === a.ayah))}
                    disabled={!audioSrcFor(a)}
                    className="mt-2 rounded-full border border-[#E5E7EB] px-3 py-1.5 text-xs font-semibold hover:border-[#1FA36B] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
                  >
                    {playingKey === key ? 'Stop' : `Play ${a.surah}:${a.ayah}`}
                  </button>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={() => setStep('pick')} className="mt-4 text-sm font-semibold text-[#1FA36B] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]">
            Change ayah or reciter
          </button>
        </div>
      )}

      {/* ---------- STEP 3: HIDE & RECITE ---------- */}
      {step === 'recite' && (
        <div className="mt-5">
          <p className="text-sm font-semibold">Recite — {scopeLabel}</p>

          {/* Teacher disclaimer, verbatim, above the mic button (research §6). */}
          <p className="mt-3 rounded-lg bg-[#E4FFF2] border border-[#1FA36B]/20 px-3 py-2 text-sm">{TEACHER_DISCLAIMER}</p>

          {/* Mode switch: mistake detection / follow-along / self-mark */}
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Practice mode">
            {(
              [
                ['mic', 'Use microphone — mistakes flagged'],
                ['follow', 'Follow along — highlight only'],
                ['self-mark', 'Practice without mic'],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`rounded-full px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B] ${mode === m ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB]'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {mode === 'follow' && (
            <p className="mt-2 text-sm text-[#5b6b62]">
              Follow-along: recite with the text visible and the app highlights each word as
              you say it. Nothing is judged, nothing is logged as a mistake.
            </p>
          )}

          {/* Hide / prompt controls */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setArabicHidden((h) => !h)}
              aria-pressed={arabicHidden}
              className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold hover:border-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              {arabicHidden ? 'Show Arabic' : 'Hide Arabic'}
            </button>
            <button
              type="button"
              onClick={() => setShowTranslation((s) => !s)}
              aria-pressed={showTranslation}
              className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold hover:border-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              {showTranslation ? 'Hide translation prompt' : 'Show translation prompt'}
            </button>
            {arabicHidden && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setRevealedCount((c) => c + 1);
                    setPeekCount((c) => c + 1);
                    setPeeked(true);
                  }}
                  aria-label="Reveal the next word"
                  title="Peek — reveal the next word (counts as a peek)"
                  className="rounded-full border border-[#FFB800] px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#FFFBF2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
                >
                  ‹ Next word
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRevealedCount(10000);
                    setPeekCount((c) => c + 1);
                    setPeeked(true);
                  }}
                  aria-label="Reveal the rest of the ayah"
                  title="Peek — reveal the rest (counts as a peek)"
                  className="rounded-full border border-[#FFB800] px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#FFFBF2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
                >
                  « Reveal rest
                </button>
              </>
            )}
          </div>
          {peeked && (
            <p role="status" className="mt-2 text-sm text-[#5b6b62]">
              You peeked {peekCount} {peekCount === 1 ? 'time' : 'times'} — this attempt counts as a miss for streak purposes. That is honest practice, not a failure.
            </p>
          )}

          {/* The verse: hidden as thin grey rules (screenshot 4), revealed
              word-by-word as recited or peeked; live colours green = correct,
              red + dotted underline = mistake, orange = skipped/not heard. */}
          <div className="mt-4 rounded-xl border border-[#E5E7EB] p-4">
            {scopeAyahs().map((a, ai) => {
              const words = splitWords(a.text);
              const before = scopeAyahs()
                .slice(0, ai)
                .reduce((n, x) => n + splitWords(x.text).length, 0);
              return (
              <div key={`${a.surah}:${a.ayah}`} className="mt-2 first:mt-0">
                <p dir="rtl" lang="ar" className="font-quran text-2xl sm:text-3xl leading-loose text-right">
                  {words.map((w) => {
                    const key = wordKey(a.surah, a.ayah, w.index + 1);
                    const live = liveWords[key];
                    const globalIdx = before + w.index;
                    const liveCls =
                      live === 'correct'
                        ? 'live-word-correct'
                        : live === 'wrong'
                          ? 'live-word-wrong'
                          : live === 'missed'
                            ? 'live-word-skipped'
                            : undefined;
                    if (!arabicHidden) {
                      return (
                        <span key={key} className={liveCls}>
                          {w.display}{' '}
                        </span>
                      );
                    }
                    // Hidden: revealed by reciting correctly or by peeking;
                    // the rest stay as thin grey rules with a faint rosette.
                    if (live === 'correct' || globalIdx < revealedCount) {
                      return (
                        <span key={key} className={liveCls}>
                          {w.display}{' '}
                        </span>
                      );
                    }
                    if (live === 'wrong' || live === 'missed') {
                      return (
                        <span key={key} className={liveCls}>
                          {w.display}{' '}
                        </span>
                      );
                    }
                    return (
                      <span
                        key={key}
                        className="hidden-word-rule"
                        style={{ width: `${Math.max(1.2, w.display.length * 0.45)}em` }}
                      />
                    );
                  })}
                  <span className="hidden-ayah-rosette" aria-hidden="true"> ◯</span>
                </p>
                {showTranslation && a.translation && (
                  <p className="mt-1 text-sm text-[#5b6b62]">{a.translation}</p>
                )}
              </div>
              );
            })}
          </div>

          {mode !== 'self-mark' ? (
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
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E5E7EB]" aria-hidden="true">
                    <div className="h-full bg-[#1FA36B]" style={{ width: `${Math.round(engineLoadProgress.fraction * 100)}%` }} />
                  </div>
                  <button type="button" onClick={cancelLoad} className="mt-2 text-sm font-semibold text-[#1FA36B] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]">
                    Cancel download
                  </button>
                </div>
              )}
              {engineState === 'failed' && (
                <div className="mx-auto max-w-md rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm text-left">
                  <p role="alert">{loadError ?? 'The checker could not load. You can still listen, read and self-mark.'}</p>
                  <div className="mt-2 flex gap-3">
                    <button type="button" onClick={() => void loadEngineNow()} className="font-semibold text-[#1FA36B] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]">
                      Retry loading the checker
                    </button>
                    <button type="button" onClick={() => setMode('self-mark')} className="font-semibold text-[#1FA36B] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]">
                      Practice without mic
                    </button>
                  </div>
                </div>
              )}
              {engineState === 'unsupported' && (
                <p role="alert" className="mx-auto max-w-md rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm text-left">
                  The checker cannot run in this browser. You can still listen and practise with self-marking below.
                </p>
              )}
              {engineState === 'idle' && (
                <button
                  type="button"
                  onClick={() => void loadEngineNow()}
                  className="rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
                >
                  Load the checker ({autoTierLabel()})
                </button>
              )}

              {engineState === 'ready' && micState !== 'recording' && micState !== 'checking' && (
                <>
                  <p className="text-sm text-[#5b6b62]">We need the microphone to hear your recitation. Audio is processed on your device and never uploaded. Sharing a recording with your teacher is always your choice, after the session — nothing is sent automatically.</p>
                  <p className="mt-1 text-sm text-[#5b6b62]">Take a breath, then begin — the checker needs about a second to start listening.</p>
                  {/* Bottom bar: live stat pills + 4 round buttons + big gradient mic */}
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <span className="rounded-full border border-[#E5E7EB] px-3 py-1 text-xs font-bold">
                      {Object.values(liveWords).filter((v) => v === 'wrong' || v === 'missed').length} mistakes
                    </span>
                    <span className="rounded-full border border-[#E5E7EB] px-3 py-1 text-xs font-bold">
                      {Object.values(liveWords).length > 0
                        ? `${Math.round((Object.values(liveWords).filter((v) => v === 'correct').length / Object.values(liveWords).length) * 100)}% so far`
                        : '0% so far'}
                    </span>
                    <span className="rounded-full border border-[#E5E7EB] px-3 py-1 text-xs font-bold">
                      {recordingSecs > 0 ? `${Math.floor(recordingSecs / 60)}:${String(recordingSecs % 60).padStart(2, '0')}` : '0:00'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2" role="group" aria-label="Reader tools">
                    <button
                      type="button"
                      onClick={() => setShowTranslation((v) => !v)}
                      aria-label="Toggle translation prompt"
                      title="Translation prompt"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-base hover:border-[#1FA36B]"
                    >
                      ▤
                    </button>
                    <button
                      type="button"
                      onClick={() => setArabicHidden((h) => !h)}
                      aria-label="Hide or show the Arabic"
                      title="Hide / show Arabic"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-base hover:border-[#1FA36B]"
                    >
                      ◐
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !highlightOn;
                        setHighlightOn(next);
                        setHighlightToast(`Highlight mistakes: ${next ? 'Enabled' : 'Disabled'}`);
                        setTimeout(() => setHighlightToast(null), 2500);
                      }}
                      aria-label="Toggle mistake highlighting"
                      title="Highlight mistakes"
                      className={`flex h-10 w-10 items-center justify-center rounded-full border bg-white text-base hover:border-[#1FA36B] ${highlightOn ? 'border-[#57D798] ring-2 ring-[#57D798]' : 'border-[#E5E7EB]'}`}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          void navigator.clipboard.writeText(window.location.href);
                          setHighlightToast('Link copied');
                          setTimeout(() => setHighlightToast(null), 2500);
                        } catch {
                          /* clipboard unavailable */
                        }
                      }}
                      aria-label="Copy a link to this surah"
                      title="Share / copy link"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-base hover:border-[#1FA36B]"
                    >
                      ⤴
                    </button>
                  </div>
                  {highlightToast && (
                    <p role="status" className="mt-2 text-sm font-semibold text-[#1FA36B]">{highlightToast}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => void startRecording()}
                    aria-label="Start recording your recitation"
                    className="mic-btn mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-full text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB800]"
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
                  <div className="mx-auto mt-3 h-3 w-full max-w-md overflow-hidden rounded-full bg-[#E5E7EB]" role="meter" aria-label="Microphone level" aria-valuenow={Math.round(level * 100)} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-[#1FA36B] transition-[width] duration-100" style={{ width: `${Math.round(level * 100)}%` }} />
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
                <div className="mx-auto mt-3 max-w-md rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm text-left">
                  <p role="alert">{micError}</p>
                  <button type="button" onClick={() => setMode('self-mark')} className="mt-2 font-semibold text-[#1FA36B] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]">
                    Practice without mic
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-5">
              <p className="text-sm text-[#5b6b62]">
                Listen above, recite from memory, then mark each word yourself: correct, or not quite. Self-marked words are flagged as self-marked in the log.
              </p>
              <div className="mt-3 space-y-3">
                {scopeAyahs().map((a) => (
                  <div key={`sm-${a.surah}:${a.ayah}`} className="rounded-xl border border-[#E5E7EB] p-3">
                    <p className="text-xs font-semibold text-[#5b6b62]">{a.surah}:{a.ayah}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {splitWords(a.text).map((w) => {
                        const key = wordKey(a.surah, a.ayah, w.index + 1);
                        const marked = selfMarks[key];
                        return (
                          <span key={key} className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] px-2 py-1">
                            <span dir="rtl" lang="ar" className="font-quran text-lg leading-none">{w.display}</span>
                            <button
                              type="button"
                              aria-pressed={marked === true}
                              aria-label={`Mark ${w.display} correct`}
                              onClick={() => setSelfMarks((p) => ({ ...p, [key]: true }))}
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B] ${marked === true ? 'bg-[#1FA36B] text-white' : 'bg-[#E4FFF2]'}`}
                            >
                              Correct
                            </button>
                            <button
                              type="button"
                              aria-pressed={marked === false}
                              aria-label={`Mark ${w.display} not quite`}
                              onClick={() => setSelfMarks((p) => ({ ...p, [key]: false }))}
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B] ${marked === false ? 'bg-[#FFB800] text-[#102E26]' : 'bg-[#FFFBF2]'}`}
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
                className="mt-4 rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
              >
                Save my self-marking
              </button>
            </div>
          )}

          <button type="button" onClick={() => { stopAudio(); setStep('listen'); }} className="mt-5 text-sm font-semibold text-[#1FA36B] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]">
            Back to listening
          </button>
        </div>
      )}

      {/* ---------- STEP 4: FEEDBACK ---------- */}
      {step === 'feedback' && result && (
        <div className="mt-5">
          <p className="text-sm font-semibold">Feedback — {scopeLabel}</p>
          <p className="mt-1 rounded-lg bg-[#E4FFF2] border border-[#1FA36B]/20 px-3 py-2 text-sm">{TEACHER_DISCLAIMER}</p>

          {result.noSpeech ? (
            <p role="alert" className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm">
              We didn&apos;t hear anything. Check your mic and try again.
            </p>
          ) : result.trackedElsewhere ? (
            <p role="alert" className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm">
              That didn&apos;t sound like this ayah — check you&apos;re reciting the right one, then try again.
            </p>
          ) : result.unclear ? (
            <p role="alert" className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm">{UNCLEAR_COPY}</p>
          ) : tooShort ? (
            <p role="alert" className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm">
              That was too short to check. Try reciting the full ayah.
            </p>
          ) : (
            <p role="status" className="mt-3 text-base font-semibold">{feedbackSummary}</p>
          )}
          {peeked && (
            <p className="mt-2 text-sm text-[#5b6b62]">You peeked during this attempt, so it counts as a miss for your streak.</p>
          )}

          {/* Session summary: accuracy %, mistakes by type, time, peeks. */}
          {(() => {
            const reached = feedbackWords.filter((w) => w.status !== 'not-reached');
            const correct = feedbackWords.filter((w) => w.status === 'correct').length;
            const acc = reached.length > 0 ? Math.round((correct / reached.length) * 100) : 0;
            const byType = { Incorrect: 0, Missed: 0, Extra: 0, Skipped: 0 };
            for (const m of result.mistakes) {
              const t = (m as unknown as { type?: string }).type ?? '';
              if (t === 'wrong_word') byType.Incorrect += 1;
              else if (t === 'omitted_word') byType.Missed += 1;
              else if (t === 'added_word') byType.Extra += 1;
              else if (t === 'skipped_passage') byType.Skipped += 1;
            }
            const secs = Math.round(result.durationMs / 1000);
            return (
              <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#FFFBF2] p-4">
                <p className="text-sm font-bold text-[#102E26]">Session summary</p>
                <p className="mt-1 text-sm text-[#5b6b62]">
                  Accuracy {acc}% · {correct} of {reached.length} words correct ·{' '}
                  {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')} · {peekCount} {peekCount === 1 ? 'peek' : 'peeks'}
                </p>
                <p className="mt-1 text-sm text-[#5b6b62]">
                  Mistakes by type — Incorrect {byType.Incorrect} · Missed {byType.Missed} · Extra {byType.Extra} · Skipped {byType.Skipped}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMistakeHistory(true)}
                    className="rounded-full border border-[#102E26] px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
                  >
                    Mistake history
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAnalytics(true)}
                    className="rounded-full border border-[#102E26] px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
                  >
                    Session analytics
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Listen back to your own recording (kept on this device only)
              and, if you choose, share it with your teacher. Self-marked
              practice has no recording to share. */}
          {mode !== 'self-mark' && (
            <div className="mt-4 rounded-xl border border-[#E5E7EB] p-4">
              <p className="text-sm font-bold text-[#102E26]">Listen back to your recitation</p>
              <p className="mt-1 text-xs text-[#5b6b62]">Recorded on this device only. It stays here unless you choose to share or download it below — the app never uploads it, and it is not saved past this browser session.</p>
              {recordingUrl && <audio controls src={recordingUrl} className="mt-2 w-full" />}
              <div className="mt-3">
                <ShareAudioButtons
                  recording={recording}
                  noRecordingReason={
                    settings?.saveAudio === false
                      ? 'Recording is turned off in Settings, so there is no audio for this session.'
                      : 'No recording was captured for this session — the microphone may have been unavailable.'
                  }
                />
              </div>
            </div>
          )}
          {mode === 'self-mark' && (
            <p className="mt-2 text-sm text-[#5b6b62]">Self-marked attempt — these marks are yours, not the checker&apos;s.</p>
          )}

          {/* Per-word marking: green = correct, red + dotted underline =
              mistake, orange = skipped / not heard. Tap a mistake to see what
              you said vs the correct ayah (live correction). */}
          <div className="mt-4 space-y-3">
            {scopeAyahs().map((a) => (
              <div key={`fb-${a.surah}:${a.ayah}`} className="rounded-xl border border-[#E5E7EB] p-3">
                {!(settings?.hideAyahMarkers) && (
                  <p className="text-xs font-semibold text-[#5b6b62]">{a.surah}:{a.ayah}</p>
                )}
                <p dir="rtl" lang="ar" className="font-quran mt-1 text-2xl sm:text-3xl leading-loose text-right">
                  {splitWords(a.text).map((w) => {
                    const key = wordKey(a.surah, a.ayah, w.index + 1);
                    const fw = feedbackWords.find((f) => f.key === key);
                    const status = fw?.status ?? 'not-reached';
                    const showColour = !result.unclear && !result.noSpeech && !result.trackedElsewhere && !tooShort;
                    const removed = removedMistakes.has(key);
                    const cls = !showColour || removed
                      ? 'text-[#1C2420]'
                      : status === 'correct'
                        ? 'live-word-correct font-bold'
                        : status === 'wrong'
                          ? 'live-word-wrong font-bold'
                          : status === 'missed'
                            ? 'live-word-skipped font-bold'
                            : 'text-[#5b6b62]';
                    const label = !showColour
                      ? 'not checked'
                      : removed
                        ? 'removed — flagged wrongly'
                        : status === 'correct'
                          ? 'correct'
                          : status === 'wrong'
                            ? 'check this word — tap to compare'
                            : status === 'missed'
                              ? 'not heard — tap to compare'
                              : 'not reached yet';
                    if (showColour && (status === 'wrong' || status === 'missed') && !removed) {
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedMistake(selectedMistake === key ? null : key)}
                          aria-expanded={selectedMistake === key}
                          className={`${cls} rounded px-0.5 underline-offset-4 hover:bg-[#FFFBF2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]`}
                          title={label}
                        >
                          {w.display}{' '}
                          <span className="sr-only">({label})</span>
                        </button>
                      );
                    }
                    return (
                      <span key={key} className={cls} title={label}>
                        {w.display}{' '}
                        <span className="sr-only">({label})</span>
                      </span>
                    );
                  })}
                </p>
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#5b6b62]">
                  <span><span className="inline-block h-3 w-3 rounded-sm bg-[#16A34A] align-middle" /> Correct</span>
                  <span><span className="inline-block h-3 w-3 rounded-sm bg-[#EA580C] align-middle" /> Skipped / not heard</span>
                  <span><span className="inline-block h-3 w-3 rounded-sm bg-[#DC2626] align-middle" /> Check this word</span>
                  <span><span className="inline-block h-3 w-3 rounded-sm bg-[#E5E7EB] align-middle" /> Not reached yet</span>
                </p>
                {/* Tap-a-mistake correction panel */}
                {selectedMistake && scopeAyahs().some((x) => x.surah === a.surah && x.ayah === a.ayah) && (() => {
                  const [ss, ay, wd] = selectedMistake.split(':').map(Number);
                  if (ss !== a.surah || ay !== a.ayah) return null;
                  const ayahText = scopeAyahs().find((x) => x.surah === ss && x.ayah === ay)?.text ?? '';
                  const display = splitWords(ayahText)[wd - 1]?.display ?? '';
                  const heard = result.words.find(
                    (rw) => rw.surah === ss && rw.ayah === ay && rw.wordIndex === wd - 1,
                  )?.heard;
                  const fw = feedbackWords.find((f) => f.key === selectedMistake);
                  return (
                    <div className="mt-3 rounded-xl border border-[#E5E7EB] p-3">
                      <p className="text-sm font-bold text-[#102E26]">
                        {fw?.status === 'missed' ? 'Missed word' : 'Incorrect word'} — {ss}:{ay}
                      </p>
                      <div className="mt-2 rounded-lg border border-[#E5E7EB] p-3">
                        <p className="flex items-baseline justify-between gap-3">
                          <span className="text-xs font-semibold text-[#5b6b62]">Expected</span>
                          <span dir="rtl" lang="ar" className="font-quran text-xl text-right">
                            {splitWords(ayahText).map((w, i) => (
                              <span key={i} className={i === wd - 1 ? 'font-bold text-[#16A34A]' : undefined}>
                                {w.display}{' '}
                              </span>
                            ))}
                          </span>
                        </p>
                        <p className="mt-2 flex items-baseline justify-between gap-3 border-t border-[#E5E7EB] pt-2">
                          <span className="text-xs font-semibold text-[#5b6b62]">Recited</span>
                          <span dir="rtl" lang="ar" className="font-quran text-xl text-right">
                            {heard ? (
                              <span className="font-bold text-[#DC2626]">{heard}</span>
                            ) : (
                              <span className="text-[#5b6b62]">not heard</span>
                            )}
                          </span>
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/hifz/search?q=${encodeURIComponent(display)}`}
                          className="rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
                        >
                          See similar verses
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            const next = loadMistakes().filter(
                              (m) => !(m.surah === ss && m.ayah === ay && m.word === display),
                            );
                            saveMistakes(next);
                            setPersistedMistakes(next);
                            setRemovedMistakes((prev) => new Set(prev).add(selectedMistake));
                            setSelectedMistake(null);
                          }}
                          className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold hover:border-[#B42318] hover:text-[#B42318]"
                        >
                          Remove — I said it correctly
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-[#5b6b62]">
                        Removing a wrongly-flagged word stops it counting in your mistake history and test scores. You can put it back by reciting the ayah again.
                      </p>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>

          {/* Words to retry (mistake log, this surah). */}
          {retryMistakes.length > 0 && (
            <div className="mt-4 rounded-xl border border-[#E5E7EB] p-3">
              <p className="text-sm font-semibold">Words to retry</p>
              <ul className="mt-2 space-y-1 text-sm">
                {retryMistakes.slice(-10).map((m, i) => (
                  <li key={`${m.surah}:${m.ayah}:${m.word}:${i}`}>
                    <span dir="rtl" lang="ar" className="font-quran text-lg">{m.word}</span>
                    {' '}— {m.surah}:{m.ayah} · practised {m.attempts} {m.attempts === 1 ? 'time' : 'times'}
                    {selfMarkedMistakes.some((s) => s.surah === m.surah && s.ayah === m.ayah && s.word === m.word) && (
                      <span className="ml-2 rounded-full bg-[#FFFBF2] px-2 py-0.5 text-xs font-semibold">self-marked</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {dailyGoalMet && (
            <p role="status" className="mt-4 rounded-lg bg-[#E4FFF2] border border-[#1FA36B]/20 px-3 py-2 text-sm font-semibold">
              Daily goal met — you practised {ayahsToday} {ayahsToday === 1 ? 'ayah' : 'ayahs'} today. Streak: {streakCount} {streakCount === 1 ? 'day' : 'days'}.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => retryScope(true)}
              className="rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              Retry these words
            </button>
            <button
              type="button"
              onClick={() => retryScope(false)}
              className="rounded-full border border-[#102E26] px-5 py-2.5 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              Retry full ayah
            </button>
            {pendingFix ? (
              <p className="rounded-full border border-[#FFB800] bg-[#FFFBF2] px-5 py-2.5 text-sm font-semibold text-[#102E26]">
                Fix these words first — “Don&apos;t progress until a mistake is fixed” is on in Settings. Tap “Retry these words” above.
              </p>
            ) : currentIndex < ayahs.length - 1 ? (
              <button
                type="button"
                onClick={() => goToAyahIndex(currentIndex + 1)}
                className="rounded-full border border-[#E5E7EB] px-5 py-2.5 text-sm font-semibold hover:border-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
              >
                Next ayah
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => { setStep('listen'); }}
              className="rounded-full border border-[#E5E7EB] px-5 py-2.5 text-sm font-semibold hover:border-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              Listen again
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 border-t border-[#E5E7EB] pt-3 text-xs text-[#5b6b62]">
        Quran text, translation and audio via Quran.com. Your recitation audio never leaves your device unless you choose to share it with your teacher. A teacher is still needed for tajweed — this tool checks words, not tajweed.
      </p>

      {showMistakeHistory && (
        <MistakeHistorySheet
          mistakes={persistedMistakes}
          onRemove={(idx) => {
            const next = persistedMistakes.filter((_, i) => i !== idx);
            saveMistakes(next);
            setPersistedMistakes(next);
          }}
          onClose={() => setShowMistakeHistory(false)}
        />
      )}
      {showAnalytics && result && (
        <SessionAnalyticsSheet
          latestSessionAudio={
            recording
              ? { ...recording, range: scopeLabel, date: localDateString() }
              : null
          }
          accuracy={(() => {
            const reached = feedbackWords.filter((w) => w.status !== 'not-reached');
            const correct = feedbackWords.filter((w) => w.status === 'correct').length;
            return reached.length > 0 ? (correct / reached.length) * 100 : 0;
          })()}
          mistakesPerPage={(() => {
            const missed = feedbackWords.filter((w) => w.status === 'missed' || w.status === 'wrong').length;
            return scopeAyahs().length > 0 ? missed / Math.max(1, scopeAyahs().length / 15) : 0;
          })()}
          words={feedbackWords.filter((w) => w.status !== 'not-reached').length}
          history={(() => {
            const rows: HistoryRow[] = [];
            const byDay = new Map<string, { correct: number; total: number; range: string }>();
            for (const m of persistedMistakes) {
              const day = m.date.slice(0, 10);
              const r = byDay.get(day) ?? { correct: 0, total: 0, range: `${m.surah}:${m.ayah}` };
              r.total += 1;
              byDay.set(day, r);
            }
            for (const [day, r] of [...byDay.entries()].slice(-6)) {
              rows.push({
                date: day,
                range: r.range,
                accuracy: r.total > 0 ? Math.max(90, 100 - r.total) : 100,
                mistakesPerPage: r.total,
              });
            }
            return rows;
          })()}
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </section>
  );
}

export type { SessionResult };
