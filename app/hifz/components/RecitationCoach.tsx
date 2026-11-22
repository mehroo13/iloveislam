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
  markMistakesCorrected,
  recordMinutes,
  recordTypeActivity,
  saveMistakes,
  saveProgress,
  type HifzSettings,
  type MistakeEntry,
  type MistakeType,
} from '../progress';
import { getSurahById } from '../surahs';
import { splitWords } from '../lib/alignment';
import { useT } from '../lib/i18n';
import { MistakeHistorySheet, SessionAnalyticsSheet, type HistoryRow } from './SharedSheets';
import { ShareAudioButtons, audioExtension, recordingFileName, type SharedRecording } from './ShareAudio';
import {
  autoTierLabel,
  engineSupport,
  loadEngine,
  type EngineLoadProgress,
  type PreparedMicCapture,
  type RecitationEngine,
  type RecitationSession,
  type SessionResult,
  type WordEvent,
} from '../lib/tilawa';
import { AdaptiveVad } from '../lib/vad';

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

/**
 * Map a Tilawa MicrophoneError (or a prepareMicrophone() failure, same
 * `.reason` shape) to the coach's mic state + user-facing message.
 * Shared by the prepare step and the listen step so both report alike.
 */
function micErrorFor(err: unknown, tr: (key: string) => string): { state: 'denied' | 'unavailable'; message: string } {
  const reason = (err as { reason?: string })?.reason;
  if (reason === 'denied') {
    return {
      state: 'denied',
      message: tr('coach.micBlocked'),
    };
  }
  if (reason === 'insecure-context') {
    return {
      state: 'unavailable',
      message: tr('coach.micHttps'),
    };
  }
  return {
    state: 'unavailable',
    message: tr('coach.micNone'),
  };
}

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
/**
 * Mic states, in the order the user sees them (Stage 3):
 *  idle → requesting (permission prompt is up) → recording (mic
 *  connected; "Listening" until the VAD confirms a voice, then "Voice
 *  detected") → checking (processing the recitation) → idle (result) /
 *  denied / unavailable. `requesting` is its own state so the user is
 *  never left staring at an unchanged screen while the browser's
 *  permission prompt is open.
 */
type MicState = 'idle' | 'requesting' | 'recording' | 'checking' | 'denied' | 'unavailable';
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
  const t = useT();
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
  // Voice-detection state (spec: Ready → Requesting permission →
  // Listening → Voice detected → Processing → Result / Error). Driven by
  // the adaptive VAD (app/hifz/lib/vad.ts), NOT by a fixed threshold:
  // `voiceDetected` latches once the VAD confirms sustained speech above
  // the room's noise floor (so quiet recitation counts), `vadSpeaking`
  // is live speech incl. hangover (so pauses between words do not flick
  // the status), and the meter below is real levels only.
  const [voiceDetected, setVoiceDetected] = useState(false);
  const [vadSpeaking, setVadSpeaking] = useState(false);
  // `framesSeen` counts onLevel callbacks received this take (about one
  // per 20 ms): 0 means the worklet delivers no frames at all, which —
  // together with `audioStalled` / `silentInput` — separates "mic
  // connected" from "capture dead" from "capture running but silent".
  const [framesSeen, setFramesSeen] = useState(0);
  // True when the take has run ~2.5 s with ZERO level callbacks: the
  // AudioContext/worklet is delivering no frames at all (capture dead),
  // even though permission was granted. Shown as a live warning, not a
  // result — the take can still be stopped and retried.
  const [audioStalled, setAudioStalled] = useState(false);
  // True when frames ARE flowing but the level never rises above digital
  // silence (see AudioHealth.silentInput): the mic is connected yet
  // sends no sound (muted track, wrong input, mic covered at OS level).
  // Cleared the moment any real level arrives.
  const [silentInput, setSilentInput] = useState(false);
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
  // Guards for the recording lifecycle (2026-11-22 mic fix): a tap must
  // never start two sessions, and a new session must never start before
  // the previous one fully ended.
  const startInFlightRef = useRef(false);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Live waveform (real levels only, never fake): recent normalised
  // levels, drawn on a canvas while recording.
  const waveformRef = useRef<HTMLCanvasElement | null>(null);
  const levelsRef = useRef<number[]>([]);
  const voiceDetectedRef = useRef(false);
  const vadSpeakingRef = useRef(false);
  const vadRef = useRef<AdaptiveVad | null>(null);
  // onLevel callbacks received this take (mirrored to `framesSeen`
  // state by the 500 ms timer so the UI can tell "mic connected" from
  // "no frames at all" without re-rendering 50 times a second).
  const levelCountRef = useRef(0);
  // An abort already in flight (Back-to-listening / mode switch /
  // stale-take cleanup): startRecording awaits it so a new take never
  // starts before the previous capture fully stopped.
  const abortRef = useRef<Promise<void> | null>(null);

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
        else setAudioNote(t('coach.audioReciterFail'));
      } catch {
        setAudioNote(t('coach.audioReciterFail'));
      }
    },
    [surah, t],
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
      setLoadError(t('coach.checkerFailed'));
    }
  }, [engineState, t]);

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
      mistakes: {
        surah: number;
        ayah: number;
        word: string;
        expected: string;
        heard?: string;
        wordIndex?: number;
        type?: MistakeType;
        source?: 'engine' | 'self-mark';
      }[];
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
      // Stage 5 (§11): a clean recitation marks this ayah's earlier
      // mistakes corrected (history kept, flagged fixed, no longer a
      // weak spot) — including the case where there are no new mistakes.
      if (opts.allCorrect) {
        let log = loadMistakes();
        let changed = false;
        for (const a of opts.scope) {
          const next = markMistakesCorrected(log, a.surah, a.ayah);
          if (next !== log) {
            log = next;
            changed = true;
          }
        }
        if (changed) {
          saveMistakes(log);
          setPersistedMistakes(log);
        }
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

  /**
   * End any live take WITHOUT producing a result — the user left
   * mid-take ("Back to listening", mode switch) or a new take is about
   * to start. Stops the own-recording capture, awaits the session abort
   * (the old AudioContext is fully closed before the caller starts a
   * new take), and resets the mic UI. Safe to call when nothing is live.
   * Does NOT touch micState: callers set it (idle / requesting /
   * recording) for the state they are moving to.
   */
  const abortLiveSession = useCallback(async () => {
    if (abortRef.current) return abortRef.current;
    const session = sessionRef.current;
    sessionRef.current = null;
    // Stop the own-recording capture first: it shares the session's
    // stream, and stopping the recorder never stops the stream's tracks.
    try {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
    } catch {
      /* already stopped */
    }
    recorderRef.current = null;
    recordStreamRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
    setLevel(0);
    setVoiceDetected(false);
    voiceDetectedRef.current = false;
    setVadSpeaking(false);
    vadSpeakingRef.current = false;
    vadRef.current = null;
    setAudioStalled(false);
    setSilentInput(false);
    setFramesSeen(0);
    levelCountRef.current = 0;
    levelsRef.current = [];
    if (!session) return;
    const p = session.abort();
    abortRef.current = p;
    try {
      await p;
    } finally {
      if (abortRef.current === p) abortRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    // Never start a second session while one is starting.
    if (startInFlightRef.current) return;
    // PLAYBACK INTERACTION (Stage 3 root cause): never start the mic
    // while ayah audio is playing through the speaker — the reciter
    // audio feeds straight back into the mic, the tracker follows the
    // playback instead of the user, and the recording blob contains the
    // playback. Stop it synchronously in this tap, before anything else.
    stopAudio();
    setMicError(null);
    setAudioStalled(false);
    setSilentInput(false);
    setVoiceDetected(false);
    voiceDetectedRef.current = false;
    setVadSpeaking(false);
    vadSpeakingRef.current = false;
    setFramesSeen(0);
    levelCountRef.current = 0;
    vadRef.current = new AdaptiveVad();
    levelsRef.current = [];
    // "Requesting microphone permission" — shown while the browser's
    // permission prompt is up, so the user is never left guessing.
    setMicState('requesting');
    const scope = scopeAyahs();
    if (scope.length === 0) {
      setMicState('idle');
      return;
    }
    // MIC PREPARE — MUST stay synchronous in this tap handler, before
    // any await (2026-11-22 root-cause fix). Tilawa documents that iOS
    // Safari only starts audio created/resumed during a user gesture; the
    // old code called listen() after awaits, and listen() awaits the
    // permission prompt BEFORE creating its AudioContext, so on mobile the
    // context could be created outside the gesture, stay suspended, and
    // deliver zero frames to the model — "We didn't hear anything" with a
    // working mic. prepareMicrophone() creates + resumes the context and
    // asks for the mic while the gesture is still fresh; listen() then
    // takes ownership of the prepared capture.
    let prepared: PreparedMicCapture | null = null;
    try {
      prepared = engine.prepareMicrophone();
    } catch (err) {
      const mapped = micErrorFor(err, t);
      setMicState(mapped.state);
      setMicError(mapped.message);
      return;
    }
    startInFlightRef.current = true;
    // RESTART LIFECYCLE: if a previous take never reached stop(), its
    // capture is still live. The AudioContext for THIS take is already
    // created in the gesture above, so awaiting the old take's abort
    // here is safe — and the new session only starts listening once the
    // old one is fully stopped, so two live AudioContexts / mic streams
    // never overlap. (The old code disposed the stale session
    // fire-and-forget, leaving its context closing while the new one
    // started.)
    await abortLiveSession();
    const expected = scope.map((a) => ({ surah: a.surah, ayah: a.ayah, text: a.text }));
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
      onLevel: (db: number) => {
        // Meter scale: -60 dBFS (room noise) → 0, -10 dBFS (loud, close
        // speech) → 1. The old -60..0 scale left normal speech at ~17%
        // of the bar, so quiet recitation was invisible.
        const v = clamp01((db + 60) / 50);
        setLevel(v);
        levelsRef.current.push(v);
        if (levelsRef.current.length > 60) levelsRef.current.shift();
        levelCountRef.current++;
        // Any real level clears the silent-input warning.
        if (db > -110) setSilentInput((prev) => (prev ? false : prev));
        // Adaptive VAD (lib/vad.ts): sustained speech above the room's
        // noise floor — quiet recitation counts, a single loud transient
        // does not, and pauses between words do not flick it off.
        // onLevel fires about every 20 ms, so dtMs is 20.
        const reading = vadRef.current?.push(db, 20);
        if (reading) {
          if (reading.voiceDetected && !voiceDetectedRef.current) {
            voiceDetectedRef.current = true;
            setVoiceDetected(true);
          }
          if (reading.speaking !== vadSpeakingRef.current) {
            vadSpeakingRef.current = reading.speaking;
            setVadSpeaking(reading.speaking);
          }
        }
      },
      onTrackerState: (s: string) => setTrackerState(s),
    });
    sessionRef.current = session;
    try {
      // listen() takes ownership of `prepared` — on failure it releases
      // the capture itself, so the coach must NOT release it here.
      await session.startMic(prepared);
    } catch (err) {
      startInFlightRef.current = false;
      sessionRef.current = null;
      session.dispose();
      const mapped = micErrorFor(err, t);
      setMicState(mapped.state);
      setMicError(mapped.message);
      return;
    }
    startInFlightRef.current = false;
    setMicState('recording');
    setLiveWords({});
    // Own-recording playback (device only): reuse the SAME mic stream
    // Tilawa is listening to. The old code opened a SECOND getUserMedia
    // here — a second concurrent mobile capture competing with the first
    // (and, on iOS Safari, able to interrupt it) — while the coach's only
    // audio path depended on the first stream staying live. Sharing the
    // prepared stream removes that failure mode entirely. Best effort —
    // if MediaRecorder refuses the shared stream, reciting still works.
    // The stream's tracks belong to the Tilawa session: this code never
    // stops them; session.stop() does.
    if (settings?.saveAudio !== false) {
      try {
        const stream = await prepared.stream;
        if (stream.getAudioTracks().some((t) => t.readyState === 'live')) {
          recordStreamRef.current = stream;
          recordChunksRef.current = [];
          const rec = new MediaRecorder(stream);
          rec.ondataavailable = (e) => {
            if (e.data.size > 0) recordChunksRef.current.push(e.data);
          };
          rec.start(250);
          recorderRef.current = rec;
        }
      } catch {
        recorderRef.current = null;
      }
    }
    recordingStartRef.current = Date.now();
    setRecordingSecs(0);
    timerRef.current = setInterval(() => {
      setRecordingSecs(Math.floor((Date.now() - recordingStartRef.current) / 1000));
      // Mirror the callback count into state (throttled to 2×/s) so the
      // UI can tell "mic connected" from "no frames at all".
      setFramesSeen((prev) => (prev === levelCountRef.current ? prev : levelCountRef.current));
    }, 500);
    // Stall watch: if NO level callback arrives within 2.5 s, the
    // worklet is delivering no frames — capture is dead even though the
    // mic was granted. If frames ARE flowing but the level never rises
    // above digital silence, the input itself is silent (muted track,
    // wrong input, mic covered). Tell the user live, while they can
    // still fix it, instead of waiting for a false "didn't hear
    // anything" at the end.
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    stallTimerRef.current = setTimeout(() => {
      const health = sessionRef.current?.getAudioHealth();
      if (!sessionRef.current || !health) return;
      if (health.levelCallbacks === 0) {
        setAudioStalled(true);
      } else if (health.silentInput) {
        setSilentInput(true);
      }
    }, 2500);
  }, [scopeAyahs, surah, settings, t, stopAudio, abortLiveSession]);

  const stopRecording = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
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
      // The recorder shares Tilawa's stream (see startRecording): never
      // stop its tracks here — session.stop() below owns them, and
      // stopping them first would cut the audio path before the session
      // has drained. Just drop the references.
      recordStreamRef.current = null;
      recorderRef.current = null;
    }
    setMicState('checking');
    const res = await session.stop();
    sessionRef.current = null;
    setMicState('idle');
    setLevel(0);
    setVoiceDetected(false);
    voiceDetectedRef.current = false;
    setVadSpeaking(false);
    vadSpeakingRef.current = false;
    vadRef.current = null;
    setAudioStalled(false);
    setSilentInput(false);
    setFramesSeen(0);
    levelCountRef.current = 0;
    levelsRef.current = [];
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
      // Stage 5 (§10/§11): each mistake carries its word position and the
      // checker's own class, so the review screen can say what kind of
      // issue it was. The class comes from the confirmed checker event at
      // that location — wrong_word → incorrect, omitted_word → missed,
      // added_word → extra (an extra word was heard at this anchor; the
      // engine does not transcribe, so the extra word itself has no text),
      // skipped_passage → skipped. No event at the location (tracker-only
      // miss) reads as 'missed'. Recognition uncertainty is never logged
      // as a mistake: only confirmed events and observed misses reach here.
      mistakes: missedWords.map((w) => {
        const [s, ay, wd] = w.key.split(':').map(Number);
        const ayahText = scope.find((a) => a.ayah === ay)?.text ?? '';
        const display = splitWords(ayahText)[wd - 1]?.display ?? w.display;
        const heard = res.words.find(
          (rw) => rw.surah === s && rw.ayah === ay && rw.wordIndex === wd - 1,
        )?.heard;
        const eventClass = res.mistakes.find(
          (m) => m.location.surah === s && m.location.ayah === ay && m.location.word === wd,
        )?.errorClass;
        const type: MistakeType =
          eventClass === 'wrong_word'
            ? 'incorrect'
            : eventClass === 'added_word'
              ? 'extra'
              : eventClass === 'skipped_passage'
                ? 'skipped'
                : 'missed';
        return {
          surah: s,
          ayah: ay,
          word: display,
          expected: display,
          ...(heard ? { heard } : {}),
          wordIndex: wd - 1,
          type,
          source: 'engine' as const,
        };
      }),
    });
  }, [persistAttempt, peeked, scopeAyahs, mode, settings, t]);

  /**
   * Switching practice mode mid-take (or leaving for the Listen step)
   * must stop the live capture first — the old code just changed state
   * and left the session, mic stream and AudioContext running invisibly
   * behind the new screen, so the next take started on top of it.
   */
  const switchMode = useCallback(
    (m: CoachMode) => {
      if (sessionRef.current) {
        void abortLiveSession();
        setMicState('idle');
      }
      setMode(m);
    },
    [abortLiveSession],
  );

  const backToListening = useCallback(() => {
    stopAudio();
    if (sessionRef.current) {
      void abortLiveSession();
      setMicState('idle');
    }
    setStep('listen');
  }, [abortLiveSession, stopAudio]);

  // Cleanup on unmount: stop any live session; the engine stays cached.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
      startInFlightRef.current = false;
      sessionRef.current?.dispose();
      sessionRef.current = null;
      stopAudio();
    };
  }, [stopAudio]);

  // Live waveform: redraw the recent real mic levels while recording.
  // The canvas shows only levels the mic actually produced — if capture
  // is dead the strip stays flat, which is itself the diagnosis.
  useEffect(() => {
    if (micState !== 'recording') return;
    const draw = () => {
      const canvas = waveformRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const levels = levelsRef.current;
      const n = 60;
      const barW = w / n;
      for (let i = 0; i < n; i++) {
        const v = levels[levels.length - n + i] ?? 0;
        const barH = Math.max(2, v * (h - 4));
        ctx.fillStyle = v > 0.25 ? '#1FA36B' : '#9DB8A6';
        ctx.fillRect(i * barW + 1, (h - barH) / 2, Math.max(1, barW - 2), barH);
      }
    };
    draw();
    const id = setInterval(draw, 100);
    return () => clearInterval(id);
  }, [micState]);

  /* ---------------- self-mark fallback (no mic) ---------------- */

  const submitSelfMark = useCallback(() => {
    const scope = scopeAyahs();
    const words: FeedbackWord[] = [];
    const mistakes: {
      surah: number;
      ayah: number;
      word: string;
      expected: string;
      wordIndex: number;
      type: MistakeType;
      source: 'self-mark';
    }[] = [];
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
          mistakes.push({
            surah: a.surah,
            ayah: a.ayah,
            word: w.display,
            expected: w.display,
            wordIndex: w.index,
            type: 'missed',
            source: 'self-mark',
          });
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
      micHeardAudio: false,
      audioHealth: {
        levelCallbacks: 0,
        maxLevelDb: -120,
        audibleCallbacks: 0,
        everAudible: false,
        silentInput: false,
        positionEvents: 0,
        everLocked: false,
      },
      trackedElsewhere: false,
      mistakes: [],
      durationMs: 0,
    };
    setResult(selfResult);
    setFeedbackWords(words);
    setStep('feedback');
    const allCorrect = !peeked && mistakes.length === 0 && reachedCount > 0;
    persistAttempt({ scope, allCorrect, peeked, minutes: 0.5, mistakes });
    // Self-marked mistakes show as self-marked in the session's log view
    // (source 'self-mark' is persisted with the entry, Stage 5 §11).
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
      ? t('coach.noWordsHeard')
      : `${t('coach.youSaid')} ${result.correctCount} ${t('common.of')} ${result.reachedCount} ${t('common.words')}${
          result.missedCount > 0
            ? ` — ${result.missedCount} ${result.missedCount === 1 ? t('coach.wordWasNotHeard') : t('coach.wordsWereNotHeard')}`
            : ''
        }.`
    : '';

  const tooShort =
    !!result && !result.noSpeech && !result.unclear && result.durationMs > 0 &&
    result.durationMs < 2000 && result.reachedCount <= 1;

  const retryMistakes = persistedMistakes.filter((m) => m.surah === surah);

  /* ---------------- render ---------------- */

  return (
    <section aria-label={`${t('common.recite')} ${t('common.surah')} ${surahName}`} className="rounded-2xl bg-white border border-[#E5E7EB] p-4 sm:p-6 shadow-sm">
      <audio ref={audioRef} preload="none" className="hidden" />
      <h2 className="text-xl font-bold text-[#102E26]">{t('common.recite')} {surahName}</h2>
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
      <ol className="mt-4 flex flex-wrap gap-2 text-xs font-semibold" aria-label={t('coach.stepsLabel')}>
        {(['pick', 'listen', 'recite', 'feedback'] as Step[]).map((s, i) => (
          <li
            key={s}
            aria-current={step === s ? 'step' : undefined}
            className={`rounded-full px-3 py-1 ${step === s ? 'bg-[#102E26] text-white' : 'bg-[#FFFBF2] text-[#5b6b62]'}`}
          >
            {i + 1}. {s === 'pick' ? t('coach.pick') : s === 'listen' ? t('coach.listen') : s === 'recite' ? t('coach.hideRecite') : t('coach.feedback')}
          </li>
        ))}
      </ol>

      {/* ---------- STEP 1: PICK ---------- */}
      {step === 'pick' && (
        <div className="mt-5">
          <fieldset>
            <legend className="text-sm font-semibold">{t('coach.whatRecite')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="flex min-h-11 items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
                <input type="radio" name="scope" checked={scopeKind === 'single'} onChange={() => setScopeKind('single')} />
                {t('coach.oneAyah')}
              </label>
              <label className="flex min-h-11 items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
                <input type="radio" name="scope" checked={scopeKind === 'range'} onChange={() => setScopeKind('range')} />
                {t('coach.ayahRange')}
              </label>
              <label className="flex min-h-11 items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
                <input type="radio" name="scope" checked={scopeKind === 'whole'} onChange={() => setScopeKind('whole')} />
                {t('coach.wholeSurah')}
              </label>
            </div>
          </fieldset>

          {scopeKind === 'single' && (
            <label className="mt-4 block text-sm font-semibold">
              {t('common.ayah')}
              <select
                value={currentIndex}
                onChange={(e) => setCurrentIndex(Number(e.target.value))}
                className="mt-1 block w-full max-w-xs min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2 text-sm"
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
                {t('coach.fromAyah')}
                <select value={rangeFrom} onChange={(e) => setRangeFrom(Number(e.target.value))} className="mt-1 block min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2 text-sm">
                  {ayahs.map((a, i) => (<option key={`f-${a.ayah}`} value={i}>{a.surah}:{a.ayah}</option>))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                {t('coach.toAyah')}
                <select value={rangeTo} onChange={(e) => setRangeTo(Number(e.target.value))} className="mt-1 block min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2 text-sm">
                  {ayahs.map((a, i) => (<option key={`t-${a.ayah}`} value={i}>{a.surah}:{a.ayah}</option>))}
                </select>
              </label>
            </div>
          )}
          <label className="mt-4 block text-sm font-semibold">
            {t('common.reciter')}
            <select
              value={reciterId}
              onChange={(e) => void changeReciter(Number(e.target.value))}
              className="mt-1 block w-full max-w-xs min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2 text-sm"
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
              className="rounded-full bg-[#102E26] min-h-11 px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              {t('coach.listenFirst')}
            </button>
            <button
              type="button"
              onClick={enterRecite}
              disabled={scopeAyahs().length === 0}
              className="rounded-full border border-[#102E26] min-h-11 px-5 py-2.5 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              {t('coach.reciteNow')}
            </button>
          </div>
        </div>
      )}

      {/* ---------- STEP 2: LISTEN ---------- */}
      {step === 'listen' && (
        <div className="mt-5">
          <p className="text-sm font-semibold">{t('coach.listen')} — {scopeLabel}</p>
          <p className="mt-1 text-sm text-[#5b6b62]">
            {t('common.reciter')}: {RECITERS.find((r) => r.id === reciterId)?.name ?? 'Mishary Alafasy'}. {t('coach.wordsHighlight')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={playScopeAudio}
              className="rounded-full bg-[#1FA36B] min-h-11 px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#102E26] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              {playingKey ? t('coach.playingStop') : t('common.play')}
            </button>
            {playingKey && (
              <button type="button" onClick={stopAudio} className="rounded-full border border-[#E5E7EB] px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]">
                {t('coach.stopAudio')}
              </button>
            )}
            <button
              type="button"
              onClick={enterRecite}
              className="rounded-full bg-[#102E26] min-h-11 px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              {t('coach.hideRecite')}
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
                    {playingKey === key ? t('common.stop') : `${t('common.play')} ${a.surah}:${a.ayah}`}
                  </button>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={() => setStep('pick')} className="mt-4 text-sm font-semibold text-[#1FA36B] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]">
            {t('coach.changeAyah')}
          </button>
        </div>
      )}

      {/* ---------- STEP 3: HIDE & RECITE ---------- */}
      {step === 'recite' && (
        <div className="mt-5">
          <p className="text-sm font-semibold">{t('common.recite')} — {scopeLabel}</p>

          {/* Teacher disclaimer, verbatim, above the mic button (research §6). */}
          <p className="mt-3 rounded-lg bg-[#E4FFF2] border border-[#1FA36B]/20 px-3 py-2 text-sm">{TEACHER_DISCLAIMER}</p>

          {/* Mode switch: mistake detection / follow-along / self-mark */}
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t('coach.practiceMode')}>
            {(
              [
                ['mic', t('coach.modeMic')],
                ['follow', t('coach.modeFollow')],
                ['self-mark', t('coach.practiceWithoutMic')],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                aria-pressed={mode === m}
                className={`rounded-full min-h-11 px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B] ${mode === m ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB]'}`}
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
              className="rounded-full border border-[#E5E7EB] min-h-11 px-4 py-2 text-sm font-semibold hover:border-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              {arabicHidden ? t('coach.showArabic') : t('coach.hideArabic')}
            </button>
            <button
              type="button"
              onClick={() => setShowTranslation((s) => !s)}
              aria-pressed={showTranslation}
              className="rounded-full border border-[#E5E7EB] min-h-11 px-4 py-2 text-sm font-semibold hover:border-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              {showTranslation ? t('coach.hideTransPrompt') : t('coach.showTransPrompt')}
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
                  aria-label={t('coach.revealNext')}
                  title={t('coach.peekNextTitle')}
                  className="rounded-full border border-[#FFB800] min-h-11 px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#FFFBF2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
                >
                  {t('coach.peekNext')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRevealedCount(10000);
                    setPeekCount((c) => c + 1);
                    setPeeked(true);
                  }}
                  aria-label={t('coach.revealRest')}
                  title={t('coach.peekRestTitle')}
                  className="rounded-full border border-[#FFB800] min-h-11 px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#FFFBF2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
                >
                  {t('coach.peekRest')}
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
                    {t('coach.loadingChecker')} {engineLoadProgress.stage} {Math.round(engineLoadProgress.fraction * 100)}%
                  </p>
                  <p className="mt-1 text-xs text-[#5b6b62]">
                    {engineLoadProgress.tierLabel}
                    {engineLoadProgress.fromCache ? t('coach.loadedFromDevice') : t('coach.downloadedOnce')}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E5E7EB]" aria-hidden="true">
                    <div className="h-full bg-[#1FA36B]" style={{ width: `${Math.round(engineLoadProgress.fraction * 100)}%` }} />
                  </div>
                  <button type="button" onClick={cancelLoad} className="mt-2 text-sm font-semibold text-[#1FA36B] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]">
                    {t('coach.cancelDownload')}
                  </button>
                </div>
              )}
              {engineState === 'failed' && (
                <div className="mx-auto max-w-md rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm text-left">
                  <p role="alert">{loadError ?? t('coach.checkerFailed')}</p>
                  <div className="mt-2 flex gap-3">
                    <button type="button" onClick={() => void loadEngineNow()} className="font-semibold text-[#1FA36B] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]">
                      {t('coach.retryLoad')}
                    </button>
                    <button type="button" onClick={() => setMode('self-mark')} className="font-semibold text-[#1FA36B] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]">
                      {t('coach.practiceWithoutMic')}
                    </button>
                  </div>
                </div>
              )}
              {engineState === 'unsupported' && (
                <p role="alert" className="mx-auto max-w-md rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm text-left">
                  {t('coach.checkerUnsupported')}
                </p>
              )}
              {engineState === 'idle' && (
                <button
                  type="button"
                  onClick={() => void loadEngineNow()}
                  className="rounded-full bg-[#102E26] min-h-11 px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
                >
                  {t('coach.loadChecker')} ({autoTierLabel()})
                </button>
              )}

              {engineState === 'ready' && micState !== 'recording' && micState !== 'checking' && (
                <>
                  <p className="text-sm text-[#5b6b62]">We need the microphone to hear your recitation. Audio is processed on your device and never uploaded. Sharing a recording with your teacher is always your choice, after the session — nothing is sent automatically.</p>
                  <p className="mt-1 text-sm text-[#5b6b62]">{t('coach.takeBreath')}</p>
                  {/* Bottom bar: live stat pills + 4 round buttons + big gradient mic */}
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <span className="rounded-full border border-[#E5E7EB] px-3 py-1 text-xs font-bold">
                      {Object.values(liveWords).filter((v) => v === 'wrong' || v === 'missed').length} {t('coach.mistakesWord')}
                    </span>
                    <span className="rounded-full border border-[#E5E7EB] px-3 py-1 text-xs font-bold">
                      {Object.values(liveWords).length > 0
                        ? `${Math.round((Object.values(liveWords).filter((v) => v === 'correct').length / Object.values(liveWords).length) * 100)}% ${t('coach.soFar')}`
                        : `0% ${t('coach.soFar')}`}
                    </span>
                    <span className="rounded-full border border-[#E5E7EB] px-3 py-1 text-xs font-bold">
                      {recordingSecs > 0 ? `${Math.floor(recordingSecs / 60)}:${String(recordingSecs % 60).padStart(2, '0')}` : '0:00'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2" role="group" aria-label={t('coach.readerTools')}>
                    <button
                      type="button"
                      onClick={() => setShowTranslation((v) => !v)}
                      aria-label={t('coach.transPromptTitle')}
                      title={t('coach.transPromptTitle')}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-base hover:border-[#1FA36B]"
                    >
                      ▤
                    </button>
                    <button
                      type="button"
                      onClick={() => setArabicHidden((h) => !h)}
                      aria-label={t('coach.hideShowArabic')}
                      title={t('coach.hideShowArabic')}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-base hover:border-[#1FA36B]"
                    >
                      ◐
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !highlightOn;
                        setHighlightOn(next);
                        setHighlightToast(next ? t('coach.highlightEnabled') : t('coach.highlightDisabled'));
                        setTimeout(() => setHighlightToast(null), 2500);
                      }}
                      aria-label={t('coach.highlightTitle')}
                      title={t('coach.highlightTitle')}
                      className={`flex h-11 w-11 items-center justify-center rounded-full border bg-white text-base hover:border-[#1FA36B] ${highlightOn ? 'border-[#57D798] ring-2 ring-[#57D798]' : 'border-[#E5E7EB]'}`}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          void navigator.clipboard.writeText(window.location.href);
                          setHighlightToast(t('coach.linkCopied'));
                          setTimeout(() => setHighlightToast(null), 2500);
                        } catch {
                          /* clipboard unavailable */
                        }
                      }}
                      aria-label={t('coach.shareTitle')}
                      title={t('coach.shareTitle')}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-base hover:border-[#1FA36B]"
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
                    aria-label={t('coach.startRecording')}
                    className="mic-btn mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-full text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB800]"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
                      <rect x="9" y="2" width="6" height="12" rx="3" />
                      <path d="M5 10a7 7 0 0 0 14 0M12 19v3" />
                    </svg>
                  </button>
                  <p className="mt-2 text-sm font-semibold">{t('coach.tapToRecite')}</p>
                </>
              )}
              {micState === 'requesting' && (
                <p role="status" className="mt-3 text-sm font-semibold">{t('coach.requestingMic')}</p>
              )}
              {micState === 'recording' && (
                <div>
                  <p role="status" className="text-sm font-semibold text-[#B42318]">
                    {vadSpeaking
                      ? `${t('coach.voiceDetected')} ${Math.floor(recordingSecs / 60)}:${String(recordingSecs % 60).padStart(2, '0')}`
                      : voiceDetected
                        ? `${t('coach.voicePaused')} ${Math.floor(recordingSecs / 60)}:${String(recordingSecs % 60).padStart(2, '0')}`
                        : framesSeen === 0
                          ? `${t('coach.micConnected')} ${Math.floor(recordingSecs / 60)}:${String(recordingSecs % 60).padStart(2, '0')}`
                          : `${t('coach.listeningRecite')} ${Math.floor(recordingSecs / 60)}:${String(recordingSecs % 60).padStart(2, '0')}`}
                  </p>
                  {trackerState && <p className="mt-1 text-xs text-[#5b6b62]">{t('coach.checker')}: {trackerState}</p>}
                  <div className="mx-auto mt-3 h-3 w-full max-w-md overflow-hidden rounded-full bg-[#E5E7EB]" role="meter" aria-label={t('coach.micLevel')} aria-valuenow={Math.round(level * 100)} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-[#1FA36B] transition-[width] duration-100" style={{ width: `${Math.round(level * 100)}%` }} />
                  </div>
                  {/* Live waveform — real mic levels only. If the strip
                      stays flat while you speak, the mic is not reaching
                      the app: stop and try again, or run the mic check. */}
                  <canvas
                    ref={waveformRef}
                    width={300}
                    height={36}
                    aria-label={t('coach.waveform')}
                    className="mx-auto mt-2 h-9 w-full max-w-md rounded-lg bg-[#FFFBF2] border border-[#E5E7EB]"
                  />
                  {!voiceDetected && !audioStalled && !silentInput && (
                    <p className="mt-2 text-xs text-[#5b6b62]">{t('coach.micFlat')}</p>
                  )}
                  {audioStalled && (
                    <p role="alert" className="mx-auto mt-2 max-w-md rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm text-left">
                      The microphone is not sending any sound yet. Check it is not muted or covered, then tap “Stop &amp; check” and try again — or run the{' '}
                      <Link href="/hifz/diagnostics" className="font-semibold text-[#1FA36B] underline">microphone check</Link>.
                    </p>
                  )}
                  {silentInput && !audioStalled && (
                    <p role="alert" className="mx-auto mt-2 max-w-md rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm text-left">
                      The microphone is connected, but it is sending only silence — no sound is reaching the app at all. Check the mic is not muted or covered and that the right input is selected, then tap “Stop &amp; check” and try again — or run the{' '}
                      <Link href="/hifz/diagnostics" className="font-semibold text-[#1FA36B] underline">microphone check</Link>.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => void stopRecording()}
                    className="mt-4 rounded-full bg-[#B42318] px-6 py-3 text-sm font-semibold text-white hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318]"
                  >
                    {t('coach.stopCheck')}
                  </button>
                </div>
              )}
              {micState === 'checking' && (
                <p role="status" className="mt-3 text-sm font-semibold">{t('coach.checking')}</p>
              )}
              {(micState === 'denied' || micState === 'unavailable') && micError && (
                <div className="mx-auto mt-3 max-w-md rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm text-left">
                  <p role="alert">{micError}</p>
                  <button type="button" onClick={() => setMode('self-mark')} className="mt-2 font-semibold text-[#1FA36B] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]">
                    {t('coach.practiceWithoutMic')}
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
                              aria-label={`${t('coach.mark')} ${w.display} ${t('common.correct')}`}
                              onClick={() => setSelfMarks((p) => ({ ...p, [key]: true }))}
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B] ${marked === true ? 'bg-[#1FA36B] text-white' : 'bg-[#E4FFF2]'}`}
                            >
                              {t('coach.correct')}
                            </button>
                            <button
                              type="button"
                              aria-pressed={marked === false}
                              aria-label={`${t('coach.mark')} ${w.display} ${t('common.notQuite')}`}
                              onClick={() => setSelfMarks((p) => ({ ...p, [key]: false }))}
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B] ${marked === false ? 'bg-[#FFB800] text-[#102E26]' : 'bg-[#FFFBF2]'}`}
                            >
                              {t('common.notQuite')}
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
                className="mt-4 rounded-full bg-[#102E26] min-h-11 px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
              >
                {t('coach.saveSelfMark')}
              </button>
            </div>
          )}

          <button type="button" onClick={backToListening} className="mt-5 text-sm font-semibold text-[#1FA36B] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]">
            {t('coach.backToListening')}
          </button>
        </div>
      )}

      {/* ---------- STEP 4: FEEDBACK ---------- */}
      {step === 'feedback' && result && (
        <div className="mt-5">
          <p className="text-sm font-semibold">{t('coach.feedback')} — {scopeLabel}</p>
          <p className="mt-1 rounded-lg bg-[#E4FFF2] border border-[#1FA36B]/20 px-3 py-2 text-sm">{TEACHER_DISCLAIMER}</p>

          {result.noSpeech ? (
            result.micHeardAudio ? (
              // The mic DID hear the recitation (levels moved) but the
              // tracker followed no word. Never say "we didn't hear
              // anything" here — the user was speaking and the app heard
              // sound; it is the checker that could not follow the words
              // (too short / too quiet / never locked on).
              <p role="alert" className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm">
                We heard your voice, but the checker could not follow the words. Try holding the phone a little closer, reciting a little louder and slower, and giving it a second to start listening before the first word — then try again.
              </p>
            ) : (
              // The mic delivered no sound at all in this take (level
              // meter stayed flat): only here is "didn't hear anything"
              // accurate. Point at the mic check so a dead capture can be
              // diagnosed instead of retried blindly.
              <p role="alert" className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm">
                We didn&apos;t hear anything. Check your mic and try again. If it keeps happening, run the{' '}
                <Link href="/hifz/diagnostics" className="font-semibold text-[#1FA36B] underline">microphone check</Link>{' '}
                — it will tell you whether the microphone itself is working.
              </p>
            )
          ) : result.trackedElsewhere ? (
            <p role="alert" className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm">
              {t('coach.wrongAyah')}
            </p>
          ) : result.unclear ? (
            <p role="alert" className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm">{t('coach.unclear')}</p>
          ) : tooShort ? (
            <p role="alert" className="mt-3 rounded-lg bg-[#FFFBF2] border border-[#E5E7EB] px-3 py-2 text-sm">
              {t('coach.tooShort')}
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
                <p className="text-sm font-bold text-[#102E26]">{t('coach.sessionSummary')}</p>
                <p className="mt-1 text-sm text-[#5b6b62]">
                  {t('coach.accuracy')} {acc}% · {correct} {t('common.of')} {reached.length} {t('coach.wordsCorrect')} ·{' '}
                  {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')} · {peekCount} {peekCount === 1 ? t('coach.peek') : t('coach.peeks')}
                </p>
                <p className="mt-1 text-sm text-[#5b6b62]">
                  {t('coach.mistakesByType')} — {t('coach.incorrect')} {byType.Incorrect} · {t('coach.missed')} {byType.Missed} · {t('coach.extra')} {byType.Extra} · {t('coach.skipped')} {byType.Skipped}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMistakeHistory(true)}
                    className="rounded-full border border-[#102E26] min-h-11 px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
                  >
                    {t('coach.mistakeHistory')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAnalytics(true)}
                    className="rounded-full border border-[#102E26] min-h-11 px-4 py-2 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
                  >
                    {t('coach.sessionAnalytics')}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Extra words & skipped passages (Stage 5, §10) — the two
              checker classes the per-word colours cannot show. An added
              word is reported AT the expected word it was heard next to:
              the checker follows sounds, it does not transcribe, so the
              extra word itself has no text to show and none is invented.
              A skipped passage is a jump the reciter demonstrably made
              (later words were observed) — never a tracker blind spot,
              which is graced to "not reached" instead. */}
          {(() => {
            const extras = result.mistakes.filter((m) => m.errorClass === 'added_word' || m.errorClass === 'skipped_passage');
            if (extras.length === 0) return null;
            return (
              <div className="mt-4 rounded-xl border border-[#E5E7EB] p-4">
                <p className="text-sm font-bold text-[#102E26]">Extra words &amp; skipped passages</p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {extras.map((m, i) => {
                    const ayahText = scopeAyahs().find((x) => x.surah === m.location.surah && x.ayah === m.location.ayah)?.text ?? '';
                    const anchor = splitWords(ayahText)[m.location.word - 1]?.display ?? '';
                    return (
                      <li key={`${m.errorClass}:${m.location.surah}:${m.location.ayah}:${m.location.word}:${i}`}>
                        {m.errorClass === 'added_word' ? (
                          <>
                            An extra word was heard near{' '}
                            <span dir="rtl" lang="ar" className="font-quran text-base">{anchor}</span>{' '}
                            ({m.location.surah}:{m.location.ayah}). The checker does not write down
                            what was said, so the extra word itself is not shown.
                          </>
                        ) : (
                          <>
                            The recitation jumped ahead at{' '}
                            <span dir="rtl" lang="ar" className="font-quran text-base">{anchor}</span>{' '}
                            ({m.location.surah}:{m.location.ayah}) — a passage was skipped.
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })()}

          {/* Listen back to your own recording (kept on this device only)
              and, if you choose, share it with your teacher. Self-marked
              practice has no recording to share. */}
          {mode !== 'self-mark' && (
            <div className="mt-4 rounded-xl border border-[#E5E7EB] p-4">
              <p className="text-sm font-bold text-[#102E26]">{t('coach.listenBack')}</p>
              <p className="mt-1 text-xs text-[#5b6b62]">Recorded on this device only. It stays here unless you choose to share or download it below — the app never uploads it, and it is not saved past this browser session.</p>
              {recordingUrl && <audio controls src={recordingUrl} className="mt-2 w-full" />}
              <div className="mt-3">
                <ShareAudioButtons
                  recording={recording}
                  noRecordingReason={
                    settings?.saveAudio === false
                      ? t('coach.noRecordingOff')
                      : t('coach.noRecordingCaptured')
                  }
                />
              </div>
            </div>
          )}
          {mode === 'self-mark' && (
            <p className="mt-2 text-sm text-[#5b6b62]">{t('coach.selfMarkedNote')}</p>
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
                      ? t('coach.wordNotChecked')
                      : removed
                        ? t('coach.wordRemoved')
                        : status === 'correct'
                          ? t('coach.legendCorrect')
                          : status === 'wrong'
                            ? t('coach.wordCheck')
                            : status === 'missed'
                              ? t('coach.wordNotHeard')
                              : t('coach.wordNotReached');
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
                  <span><span className="inline-block h-3 w-3 rounded-sm bg-[#16A34A] align-middle" /> {t('coach.legendCorrect')}</span>
                  <span><span className="inline-block h-3 w-3 rounded-sm bg-[#EA580C] align-middle" /> {t('coach.legendSkipped')}</span>
                  <span><span className="inline-block h-3 w-3 rounded-sm bg-[#DC2626] align-middle" /> {t('coach.legendCheck')}</span>
                  <span><span className="inline-block h-3 w-3 rounded-sm bg-[#E5E7EB] align-middle" /> {t('coach.legendNotReached')}</span>
                </p>
                {/* Tap-a-mistake correction panel */}
                {selectedMistake && scopeAyahs().some((x) => x.surah === a.surah && x.ayah === a.ayah) && (() => {
                  const [ss, ay, wd] = selectedMistake.split(':').map(Number);
                  if (ss !== a.surah || ay !== a.ayah) return null;
                  const ayahText = scopeAyahs().find((x) => x.surah === ss && x.ayah === ay)?.text ?? '';
                  const display = splitWords(ayahText)[wd - 1]?.display ?? '';
                  const wordTotal = splitWords(ayahText).length;
                  const heard = result.words.find(
                    (rw) => rw.surah === ss && rw.ayah === ay && rw.wordIndex === wd - 1,
                  )?.heard;
                  const fw = feedbackWords.find((f) => f.key === selectedMistake);
                  // Stage 5 (§10): the checker class behind this word, so
                  // the panel can name the issue type — and its position.
                  const eventClass = result.mistakes.find(
                    (m) => m.location.surah === ss && m.location.ayah === ay && m.location.word === wd,
                  )?.errorClass;
                  const typeLabel =
                    eventClass === 'wrong_word'
                      ? 'Said differently'
                      : eventClass === 'added_word'
                        ? 'Extra word heard near here'
                        : eventClass === 'skipped_passage'
                          ? 'Passage skipped here'
                          : 'Missed';
                  const similarSlug = getSurahById(ss)?.slug;
                  return (
                    <div className="mt-3 rounded-xl border border-[#E5E7EB] p-3">
                      <p className="text-sm font-bold text-[#102E26]">
                        {fw?.status === 'missed' ? t('coach.missedWord') : t('coach.incorrectWord')} — {ss}:{ay}
                      </p>
                      <p className="mt-1 text-xs text-[#5b6b62]">
                        Word {wd} of {wordTotal} in this ayah · {typeLabel}
                        {fw?.confirmed ? ' · confirmed by the checker' : ' · not confirmed by the checker — treat as “not heard”, not as a certain mistake'}
                      </p>
                      <div className="mt-2 rounded-lg border border-[#E5E7EB] p-3">
                        <p className="flex items-baseline justify-between gap-3">
                          <span className="text-xs font-semibold text-[#5b6b62]">{t('common.expected')}</span>
                          <span dir="rtl" lang="ar" className="font-quran text-xl text-right">
                            {splitWords(ayahText).map((w, i) => (
                              <span key={i} className={i === wd - 1 ? 'font-bold text-[#16A34A]' : undefined}>
                                {w.display}{' '}
                              </span>
                            ))}
                          </span>
                        </p>
                        <p className="mt-2 flex items-baseline justify-between gap-3 border-t border-[#E5E7EB] pt-2">
                          <span className="text-xs font-semibold text-[#5b6b62]">{t('common.recited')}</span>
                          <span dir="rtl" lang="ar" className="font-quran text-xl text-right">
                            {heard ? (
                              <span className="font-bold text-[#DC2626]">{heard}</span>
                            ) : (
                              <span className="text-[#5b6b62]">{t('common.notHeard')}</span>
                            )}
                          </span>
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {similarSlug ? (
                          <Link
                            href={`/hifz/${similarSlug}/${ss}-${ay}#similar-verses`}
                            className="rounded-full bg-[#102E26] min-h-11 px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
                          >
                            {t('common.seeSimilar')}
                          </Link>
                        ) : (
                          <Link
                            href={`/hifz/search?q=${encodeURIComponent(display)}`}
                            className="rounded-full bg-[#102E26] min-h-11 px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
                          >
                            {t('common.seeSimilar')}
                          </Link>
                        )}
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
                          className="rounded-full border border-[#E5E7EB] min-h-11 px-4 py-2 text-sm font-semibold hover:border-[#B42318] hover:text-[#B42318]"
                        >
                          {t('coach.removeCorrect')}
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
              <p className="text-sm font-semibold">{t('coach.wordsToRetry')}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {retryMistakes.slice(-10).map((m, i) => (
                  <li key={`${m.surah}:${m.ayah}:${m.word}:${i}`}>
                    <span dir="rtl" lang="ar" className="font-quran text-lg">{m.word}</span>
                    {' '}— {m.surah}:{m.ayah} · {t('common.practised')} {m.attempts} {m.attempts === 1 ? t('common.time') : t('common.times')}
                    {selfMarkedMistakes.some((s) => s.surah === m.surah && s.ayah === m.ayah && s.word === m.word) && (
                      <span className="ml-2 rounded-full bg-[#FFFBF2] px-2 py-0.5 text-xs font-semibold">{t('coach.selfMarked')}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {dailyGoalMet && (
            <p role="status" className="mt-4 rounded-lg bg-[#E4FFF2] border border-[#1FA36B]/20 px-3 py-2 text-sm font-semibold">
              {t('coach.dailyGoalMet')} {ayahsToday} {ayahsToday === 1 ? t('common.ayah') : t('common.ayahs')} {t('common.today')}. {t('coach.streak')}: {streakCount} {streakCount === 1 ? t('common.day') : t('common.days')}.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => retryScope(true)}
              className="rounded-full bg-[#102E26] min-h-11 px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              {t('coach.retryWords')}
            </button>
            <button
              type="button"
              onClick={() => retryScope(false)}
              className="rounded-full border border-[#102E26] min-h-11 px-5 py-2.5 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              {t('coach.retryFull')}
            </button>
            {pendingFix ? (
              <p className="rounded-full border border-[#FFB800] bg-[#FFFBF2] min-h-11 px-5 py-2.5 text-sm font-semibold text-[#102E26]">
                Fix these words first — “Don&apos;t progress until a mistake is fixed” is on in Settings. Tap “Retry these words” above.
              </p>
            ) : currentIndex < ayahs.length - 1 ? (
              <button
                type="button"
                onClick={() => goToAyahIndex(currentIndex + 1)}
                className="rounded-full border border-[#E5E7EB] min-h-11 px-5 py-2.5 text-sm font-semibold hover:border-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
              >
                {t('coach.nextAyah')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => { setStep('listen'); }}
              className="rounded-full border border-[#E5E7EB] min-h-11 px-5 py-2.5 text-sm font-semibold hover:border-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA36B]"
            >
              {t('coach.listenAgain')}
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
