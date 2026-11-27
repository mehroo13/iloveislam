'use client';

/**
 * app/hifz/components/RecitationCoach.tsx — the Hifz recitation coach,
 * rebuilt 2026-11-27 as ONE simple white screen, one ayah at a time.
 *
 * One job: Listen first, hide the words, recite with the mic, see which
 * words were right. No scope pickers, no reciter picker, no history
 * list, no teacher note, no green buttons — the only green left is a
 * word turning green when you say it right (red when you miss it).
 *
 * ENGINE: Tilawa (`@tilawa/core`, MIT, on-device) via
 * app/hifz/lib/tilawa.ts — reused exactly as-is. Audio is processed
 * on-device and never uploaded. The model download is user-initiated:
 * `loadEngine()` runs only after the mic is tapped.
 *
 * FEEDBACK HONESTY: word accuracy only, never tajweed, never a
 * percentage grade — the result is a count ("17 of 19 words right").
 * A word the tracker never observed is "not heard", never a confident
 * "wrong". Only a checker-CONFIRMED wrong word is labelled wrong.
 *
 * PERSISTENCE (kept): every finished take still calls recordCoachSession
 * and still saves its mistakes (the mistakes overview and My Progress
 * depend on them). Only the history LIST UI is gone. A peek still
 * counts as a mistake in scoring (markAttempt 'peek', allCorrect false)
 * — that rule is unchanged.
 *
 * Props keep the old shape so the surah page (SurahClient) keeps
 * compiling: it passes the whole surah's ayahs and the coach works
 * one ayah at a time from initialAyahIndex. Scope (range / whole
 * surah) no longer applies — a range is just tapping Next ayah.
 * The /hifz/recite screen passes a single-ayah array and drives Next
 * itself via onNextAyah.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AUDIO_BASE } from '../../quran/lib';
import { playDroppedFeedback, playMistakeFeedback } from '../lib/sounds';
import {
  addMistake,
  loadMistakes,
  loadProgress,
  loadSettings,
  markAttempt,
  markMistakesCorrected,
  recordMinutes,
  recordTypeActivity,
  saveMistakes,
  saveProgress,
  type HifzSettings,
  type MistakeType,
} from '../progress';
import { readListenSpeed } from '../lib/listen-speed';
import { splitWords } from '../lib/alignment';
import { AdaptiveVad } from '../lib/vad';
import { saveSessionAudio } from '../lib/store';
import { recordCoachSession } from '../lib/session-records';
import { audioExtension, recordingFileName, type SharedRecording } from './ShareAudio';
import {
  engineSupport,
  loadEngine,
  warmupSession,
  type EngineLoadProgress,
  type PreparedMicCapture,
  type RecitationEngine,
  type RecitationSession,
  type SessionResult,
  type WordEvent,
} from '../lib/tilawa';

/** Low-confidence attempt — research §6, verbatim. */
export const UNCLEAR_COPY =
  "I couldn't hear this clearly. Check your microphone, move somewhere quieter, and try again.";

/** One Quran.com audio segment: [wordIndex0, wordPosition1, startMs, endMs]. */
export type AudioSegment = [number, number, number, number];

/** One ayah the coach can work with. Text comes from the Quran.com API via the page — never pasted into the repo. */
export interface CoachAyah {
  surah: number;
  ayah: number;
  /** Display text (Indo-Pak — the coach's word alignment is built on it). */
  text: string;
  /** English translation shown under the Arabic. */
  translation?: string;
  /** Relative audio path from the Quran.com API, e.g. "Alafasy/mp3/001001.mp3". */
  audioUrl?: string;
  /** Per-word timings inside the ayah's MP3 (Quran.com segments) — for
   *  hearing one missed word on its own. Absent when the caller did not
   *  fetch them; word playback is then unavailable. */
  segments?: AudioSegment[];
  /** One display key per segment (audioDisplayKeys) — a segment's
   *  1-based position is a raw-word ordinal, not an engine index. */
  segKeys?: string[];
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
  /** Opening scope from the /hifz/recite picker — accepted for
   *  compatibility, no longer used: the coach is always one ayah. */
  initialScopeKind?: 'single' | 'range' | 'whole';
  /** 0-based index of the range start — accepted, no longer used. */
  initialRangeFrom?: number;
  /** 0-based index of the range end — accepted, no longer used. */
  initialRangeTo?: number;
  /** Called when the user moves to another ayah (so the page can update its URL/state). */
  onAyahChange?: (ayah: number) => void;
  /** When the parent owns ayah navigation (the /hifz/recite screen),
   *  Next ayah calls this instead of advancing internally. */
  onNextAyah?: () => void;
  /** Whether a next ayah exists, when the parent owns navigation. */
  hasNextAyah?: boolean;
}

type EngineState = 'idle' | 'loading' | 'ready' | 'failed' | 'unsupported';
/**
 * Mic states: idle → requesting (permission prompt is up) → recording
 * (mic connected; "Listening" until the VAD confirms a voice, then
 * "Voice detected") → checking (processing the recitation) → idle
 * (result) / denied / unavailable.
 */
type MicState = 'idle' | 'requesting' | 'recording' | 'checking' | 'denied' | 'unavailable';

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

/** Id for a coach session — also the key of its stored audio, when the
 *  recording is persisted (see lib/store.ts saveSessionAudio). */
function newSessionId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through to the timestamp fallback */
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Map a Tilawa MicrophoneError (or a prepareMicrophone() failure, same
 * `.reason` shape) to the coach's mic state + user-facing message.
 */
function micErrorFor(err: unknown): { state: 'denied' | 'unavailable'; message: string } {
  const reason = (err as { reason?: string })?.reason;
  if (reason === 'denied') {
    return {
      state: 'denied',
      message: 'Microphone access is blocked. Allow the microphone in your browser settings and try again.',
    };
  }
  if (reason === 'insecure-context') {
    return {
      state: 'unavailable',
      message: 'The microphone needs a secure (https) connection.',
    };
  }
  return {
    state: 'unavailable',
    message: 'No microphone was found on this device.',
  };
}

export default function RecitationCoach({
  surah,
  surahName,
  ayahs,
  initialAyahIndex = 0,
  onAyahChange,
  onNextAyah,
  hasNextAyah,
}: RecitationCoachProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(
    Math.max(0, Math.min(initialAyahIndex, Math.max(0, ayahs.length - 1))),
  );
  const current = ayahs[currentIndex];
  const words = useMemo(() => (current ? splitWords(current.text) : []), [current]);

  // Phase: ready (show the ayah, Listen / Hide / mic) or feedback
  // (the small result card). Recording is micState === 'recording'.
  const [phase, setPhase] = useState<'ready' | 'feedback'>('ready');

  // Arabic visibility + peek tracking. A peek counts as a mistake in
  // scoring (persistAttempt marks 'peek') — that rule is unchanged.
  const [arabicHidden, setArabicHidden] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [peekCount, setPeekCount] = useState(0);

  // Engine + mic state.
  const [engineState, setEngineState] = useState<EngineState>('idle');
  const [engineLoadProgress, setEngineLoadProgress] = useState<EngineLoadProgress | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [micState, setMicState] = useState<MicState>('idle');
  const [micError, setMicError] = useState<string | null>(null);
  const [voiceDetected, setVoiceDetected] = useState(false);
  const [vadSpeaking, setVadSpeaking] = useState(false);
  const [framesSeen, setFramesSeen] = useState(0);
  const [audioStalled, setAudioStalled] = useState(false);
  const [silentInput, setSilentInput] = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const [online, setOnline] = useState<boolean>(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  // Feedback.
  const [liveWords, setLiveWords] = useState<Record<string, 'correct' | 'wrong' | 'missed'>>({});
  const [result, setResult] = useState<SessionResult | null>(null);
  const [feedbackWords, setFeedbackWords] = useState<FeedbackWord[]>([]);
  const [pendingFix, setPendingFix] = useState(false);
  // Word playback (tap a missed word to hear just that word).
  const [playingWordKey, setPlayingWordKey] = useState<string | null>(null);
  const [wordNote, setWordNote] = useState<string | null>(null);
  // Listen (whole ayah) playback.
  const [playing, setPlaying] = useState(false);

  const [settings, setSettings] = useState<HifzSettings | null>(null);
  useEffect(() => {
    try {
      setSettings(loadSettings());
    } catch {
      /* defaults */
    }
  }, []);

  const engineRef = useRef<RecitationEngine | null>(null);
  const sessionRef = useRef<RecitationSession | null>(null);
  const loadAbortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** A mic tap that arrived while the engine was still loading: start
   *  the take as soon as the engine is ready. */
  const pendingStartRef = useRef(false);
  const recordingStartRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const startInFlightRef = useRef(false);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mistakeSoundKeysRef = useRef(new Set<string>());
  const voiceDetectedRef = useRef(false);
  const vadSpeakingRef = useRef(false);
  const vadRef = useRef<AdaptiveVad | null>(null);
  const levelCountRef = useRef(0);
  const abortRef = useRef<Promise<void> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordStreamRef = useRef<MediaStream | null>(null);
  /** While set, the sounding clip is a single word — `endMs` is the
   *  word's segment end inside its ayah MP3; the timeupdate listener
   *  stops playback there instead of letting the clip run on into the
   *  rest of the ayah. */
  const wordStopRef = useRef<{ endMs: number } | null>(null);

  const ayahLabel = current ? `${surah}:${current.ayah}` : '';
  const rangeLabel = ayahLabel;

  /* ---------------- audio (Listen) ---------------- */

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    wordStopRef.current = null;
    setPlaying(false);
    setPlayingWordKey(null);
  }, []);

  const playAyahAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!current?.audioUrl || !audio) return;
    stopAudio();
    audio.src = `${AUDIO_BASE}${current.audioUrl}`;
    // Reference audio plays at the Listen speed (Settings → Listening).
    audio.playbackRate = readListenSpeed();
    setPlaying(true);
    audio.play().catch(() => setPlaying(false));
  }, [current, stopAudio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      setPlaying(false);
      setPlayingWordKey(null);
      wordStopRef.current = null;
    };
    // Single-word playback: stop at the word's segment end.
    const onTimeUpdate = () => {
      const stop = wordStopRef.current;
      if (stop && audio.currentTime * 1000 >= stop.endMs) {
        wordStopRef.current = null;
        audio.pause();
        setPlaying(false);
        setPlayingWordKey(null);
      }
    };
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, []);

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

  // Dropped Connection feedback (Settings → Dropped Connection): when
  // the network goes away mid-take, a sound + vibration, if enabled.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOffline = () => {
      if (sessionRef.current) playDroppedFeedback();
    };
    window.addEventListener('offline', onOffline);
    return () => window.removeEventListener('offline', onOffline);
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
        // Lite, not auto/full: measured 2026-11-21, the 68 MB full model
        // scores IDENTICALLY to the 25 MB lite model on clean recitation
        // and is slower to download and run.
        tier: 'lite',
        signal: abort.signal,
        onProgress: (p) => setEngineLoadProgress(p),
      });
      engineRef.current = engine;
      setEngineState('ready');
      // Mic-lag (2026-11-27): warm a throwaway session in the
      // background — the first startSession of the page takes ~6 s,
      // the second ~0.16 s. Deferred a tick so the tap paints first.
      window.setTimeout(() => warmupSession(engine), 0);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setEngineState('idle');
        setEngineLoadProgress(null);
        return;
      }
      setEngineState('failed');
      setLoadError('The checker could not be loaded. Listen still works — check your connection and try the mic again.');
    }
  }, [engineState]);

  const cancelLoad = useCallback(() => {
    loadAbortRef.current?.abort();
    pendingStartRef.current = false;
  }, []);

  /* ---------------- progress writes (spec §5.1) ---------------- */

  const persistAttempt = useCallback(
    (opts: {
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
        source?: 'engine';
      }[];
    }) => {
      if (!current) return;
      let progress = loadProgress();
      progress = markAttempt(
        progress,
        current.surah,
        current.ayah,
        opts.peeked ? 'peek' : opts.allCorrect ? 'correct' : 'miss',
      );
      progress = recordMinutes(progress, opts.minutes);
      // Per-type goal (§15.8): a coach attempt is memorisation practice.
      progress = recordTypeActivity(progress, 'memorisation', 1);
      saveProgress(progress);
      if (opts.mistakes.length > 0) {
        let log = loadMistakes();
        for (const m of opts.mistakes) {
          log = addMistake(log, { ...m, date: new Date().toISOString() });
        }
        saveMistakes(log);
      }
      // Stage 5 (§11): a clean recitation marks this ayah's earlier
      // mistakes corrected (history kept, flagged fixed, no longer a
      // weak spot) — including the case where there are no new mistakes.
      if (opts.allCorrect) {
        const log = markMistakesCorrected(loadMistakes(), current.surah, current.ayah);
        saveMistakes(log);
      }
    },
    [current],
  );

  /* ---------------- mic recording ---------------- */

  /**
   * End any live take WITHOUT producing a result — the user left
   * mid-take or a new take is about to start. Safe to call when
   * nothing is live. Does NOT touch micState: callers set it.
   */
  const abortLiveSession = useCallback(async () => {
    if (abortRef.current) return abortRef.current;
    const session = sessionRef.current;
    sessionRef.current = null;
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
    setVoiceDetected(false);
    voiceDetectedRef.current = false;
    setVadSpeaking(false);
    vadSpeakingRef.current = false;
    vadRef.current = null;
    setAudioStalled(false);
    setSilentInput(false);
    setFramesSeen(0);
    levelCountRef.current = 0;
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
    if (!engine || !current) return;
    // Never start a second session while one is starting.
    if (startInFlightRef.current) return;
    // Never start the mic while ayah audio is playing through the
    // speaker — the reciter audio feeds straight back into the mic.
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
    setMicState('requesting');
    // MIC PREPARE — MUST stay synchronous in this tap handler, before
    // any await (2026-11-22 root-cause fix). Tilawa documents that iOS
    // Safari only starts audio created/resumed during a user gesture.
    let prepared: PreparedMicCapture | null = null;
    try {
      prepared = engine.prepareMicrophone();
    } catch (err) {
      const mapped = micErrorFor(err);
      setMicState(mapped.state);
      setMicError(mapped.message);
      return;
    }
    startInFlightRef.current = true;
    // RESTART LIFECYCLE: if a previous take never reached stop(), its
    // capture is still live. The AudioContext for THIS take is already
    // created in the gesture above, so awaiting the old take's abort
    // here is safe.
    await abortLiveSession();
    sessionIdRef.current = newSessionId();
    const expected = [{ surah: current.surah, ayah: current.ayah, text: current.text }];
    const session = engine.startSession({
      surah,
      fromAyah: current.ayah,
      toAyah: current.ayah,
      expected,
      onWord: (e: WordEvent) => {
        if (e.status === 'not-reached') return; // live events are only correct/wrong/missed
        // Detection off (Settings → Recitation): follow-along only —
        // the live red flags never appear; only confirmed correct
        // words light up green.
        if (e.status !== 'correct') {
          try {
            if (loadSettings().detectMistakes === false) return;
          } catch {
            /* settings unreadable — flag as usual */
          }
        }
        const liveStatus: 'correct' | 'wrong' | 'missed' =
          e.status === 'correct' ? 'correct' : e.status === 'wrong' ? 'wrong' : 'missed';
        setLiveWords((prev) => ({ ...prev, [wordKey(e.surah, e.ayah, e.word)]: liveStatus }));
        // Mistake Feedback (Settings → Mistake Feedback): one sound +
        // vibration per newly flagged word, not per re-emitted event.
        if (e.status !== 'correct') {
          const k = wordKey(e.surah, e.ayah, e.word);
          if (!mistakeSoundKeysRef.current.has(k)) {
            mistakeSoundKeysRef.current.add(k);
            playMistakeFeedback();
          }
        }
      },
      onLevel: (db: number) => {
        levelCountRef.current++;
        // Any real level clears the silent-input warning.
        if (db > -110) setSilentInput((prev) => (prev ? false : prev));
        // Adaptive VAD (lib/vad.ts): sustained speech above the room's
        // noise floor — quiet recitation counts, a single loud transient
        // does not, and pauses between words do not flick it off.
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
      const mapped = micErrorFor(err);
      setMicState(mapped.state);
      setMicError(mapped.message);
      return;
    }
    startInFlightRef.current = false;
    setMicState('recording');
    setLiveWords({});
    // Own-recording playback (device only): reuse the SAME mic stream
    // Tilawa is listening to. Best effort — if MediaRecorder refuses
    // the shared stream, reciting still works.
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
      setRecordingSecs(Math.max(0, Math.floor((Date.now() - recordingStartRef.current) / 1000)));
      setFramesSeen((prev) => (prev === levelCountRef.current ? prev : levelCountRef.current));
    }, 500);
    // Stall watch: if NO level callback arrives within 2.5 s, the
    // worklet is delivering no frames — capture is dead even though the
    // mic was granted. If frames ARE flowing but the level never rises
    // above digital silence, the input itself is silent.
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
  }, [current, surah, settings, stopAudio, abortLiveSession]);

  const stopRecording = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || !current) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
    // Stop the own-recording capture and keep it as a blob (device only).
    let pendingRecording: SharedRecording | null = null;
    try {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          const rec = recorderRef.current;
          if (!rec) return resolve();
          rec.onstop = () => resolve();
          try {
            rec.stop();
          } catch {
            resolve();
          }
        });
        const mimeType = recorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(recordChunksRef.current, { type: mimeType });
        if (blob.size > 0) {
          pendingRecording = {
            blob,
            fileName: recordingFileName(surah, current.ayah, current.ayah, audioExtension(mimeType)),
          };
        }
      }
    } catch {
      /* recording unavailable — reciting still counts */
    } finally {
      // The recorder shares Tilawa's stream: never stop its tracks here
      // — session.stop() below owns them.
      recordStreamRef.current = null;
      recorderRef.current = null;
    }
    setMicState('checking');
    const res = await session.stop();
    sessionRef.current = null;
    setMicState('idle');
    setVoiceDetected(false);
    voiceDetectedRef.current = false;
    setVadSpeaking(false);
    vadSpeakingRef.current = false;
    vadRef.current = null;
    setAudioStalled(false);
    setSilentInput(false);
    setFramesSeen(0);
    levelCountRef.current = 0;
    setResult(res);

    const confirmedKeys = new Set(
      res.mistakes.map((m) => wordKey(m.location.surah, m.location.ayah, m.location.word)),
    );
    const words: FeedbackWord[] = [];
    for (const w of splitWords(current.text)) {
      const found = res.words.find(
        (rw) => rw.surah === current.surah && rw.ayah === current.ayah && rw.wordIndex === w.index,
      );
      const status: FeedbackWord['status'] = found ? found.status : 'not-reached';
      words.push({
        key: wordKey(current.surah, current.ayah, w.index + 1),
        display: w.display,
        status,
        confirmed: confirmedKeys.has(wordKey(current.surah, current.ayah, w.index + 1)),
      });
    }
    setFeedbackWords(words);
    setPhase('feedback');

    const missedWords = words.filter((w) => w.status === 'missed' || w.status === 'wrong');
    const allCorrect =
      !peeked && !res.unclear && missedWords.length === 0 && res.reachedCount > 0 &&
      words.every((w) => w.status === 'correct' || w.status === 'not-reached');
    const minutes = Math.max(res.durationMs / 60000, 0.1);
    // Mistake detection, read fresh (Settings → Recitation): off means
    // the take is follow-along only, whatever the engine flagged.
    let detectMistakes = true;
    try {
      detectMistakes = loadSettings().detectMistakes !== false;
    } catch {
      /* settings unreadable — judge as usual */
    }
    if (!detectMistakes) {
      // Follow-along: highlight only, no judgement — count the minutes,
      // never log a mistake or touch the streak.
      let p = loadProgress();
      p = recordMinutes(p, minutes);
      saveProgress(p);
      setPendingFix(false);
      return;
    }
    if (settings?.dontProgress) {
      // "Don't progress until mistake is fixed": hold on this ayah until
      // a later attempt comes back clean.
      setPendingFix(missedWords.length > 0);
    }
    persistAttempt({
      allCorrect,
      peeked,
      minutes,
      // Stage 5 (§10/§11): each mistake carries its word position and
      // the checker's own class. Recognition uncertainty is never logged
      // as a mistake: only confirmed events and observed misses reach here.
      mistakes: missedWords.map((w) => {
        const [s, ay, wd] = w.key.split(':').map(Number);
        const display = splitWords(current.text)[wd - 1]?.display ?? w.display;
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

    // Session record + persisted audio. Accuracy is the REAL measured
    // accuracy from this session's result (correct / reached words),
    // never a formula derived from the mistake log.
    const sessionId = sessionIdRef.current ?? newSessionId();
    let audioId: string | undefined;
    if (pendingRecording && settings?.saveAudio === true) {
      const saved = await saveSessionAudio(sessionId, pendingRecording.blob, {
        date: new Date().toISOString(),
        rangeLabel,
        durationSec: Math.round(res.durationMs / 1000),
        mistakes: missedWords.length,
      });
      if (saved) {
        audioId = sessionId;
      }
    }
    recordCoachSession({
      id: sessionId,
      date: new Date().toISOString(),
      range: rangeLabel,
      surah: surahName,
      durationSec: Math.round(res.durationMs / 1000),
      accuracy: res.reachedCount > 0 ? (res.correctCount / res.reachedCount) * 100 : 0,
      mistakes: missedWords.length,
      ...(audioId ? { audioId } : {}),
    });
  }, [current, surah, surahName, rangeLabel, peeked, persistAttempt, settings]);

  /** The big round mic button: tap to recite, tap again to stop. */
  const onMicTap = useCallback(() => {
    if (micState === 'recording') {
      void stopRecording();
      return;
    }
    if (micState === 'requesting' || micState === 'checking') return;
    // A new take starts with the words hidden (the point is reciting
    // from memory). The peek state belongs to this attempt — it is
    // cleared by Try again / Next ayah, not here.
    setArabicHidden(true);
    setResult(null);
    setFeedbackWords([]);
    setLiveWords({});
    mistakeSoundKeysRef.current.clear();
    setMicError(null);
    setPhase('ready');
    if (engineRef.current) {
      void startRecording();
      return;
    }
    if (engineState === 'unsupported') {
      setMicError('This device cannot run the on-device checker. Listen still works.');
      return;
    }
    if (engineState === 'failed') {
      // Retry the download — one tap, not two.
      pendingStartRef.current = true;
      void loadEngineNow();
      return;
    }
    // Engine still loading (or idle): start the download and begin the
    // take the moment it is ready — one tap, not two.
    pendingStartRef.current = true;
    void loadEngineNow();
  }, [micState, engineState, loadError, startRecording, loadEngineNow]);

  // A mic tap that arrived while the engine was loading starts the take
  // as soon as the engine is ready.
  useEffect(() => {
    if (pendingStartRef.current && engineState === 'ready') {
      pendingStartRef.current = false;
      void startRecording();
    }
  }, [engineState, startRecording]);

  // Cleanup on unmount: stop any live session; the engine stays cached.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
      startInFlightRef.current = false;
      pendingStartRef.current = false;
      sessionRef.current?.dispose();
      sessionRef.current = null;
      stopAudio();
    };
  }, [stopAudio]);

  /* ---------------- word playback (tap a missed word) ---------------- */

  /**
   * Hear JUST one word: the ayah's MP3, seeked to the word's segment
   * start (Quran.com timings) and stopped at its segment end. The
   * queue is left empty, so nothing follows the word. A hold during a
   * mic take is ignored silently. The sounding word lights green while
   * it sounds, even when it is a red mistake word — green means
   * "sounding now", red means "mistake".
   */
  const playWord = useCallback(
    (wordIndex0: number) => {
      if (micState !== 'idle') return;
      const audio = audioRef.current;
      if (!current?.audioUrl || !audio) return;
      const key = wordKey(current.surah, current.ayah, wordIndex0 + 1);
      // First segment sounding this word's key (segKeys maps a segment's
      // raw-word position onto its display key). Fall back to the
      // positional segment when the scripts' word breaks differ.
      let seg: AudioSegment | undefined;
      if (current.segments && current.segKeys) {
        const idx = current.segments.findIndex((s) => current.segKeys?.[s[1] - 1] === key);
        if (idx >= 0) seg = current.segments[idx];
      }
      if (!seg && current.segments?.[wordIndex0]) seg = current.segments[wordIndex0];
      if (!seg) {
        setWordNote('No audio for that word yet.');
        return;
      }
      const startMs = seg[2];
      const endMs = Math.max(seg[3], startMs + 200);
      setWordNote(null);
      stopAudio();
      wordStopRef.current = { endMs };
      setPlayingWordKey(key);
      audio.src = `${AUDIO_BASE}${current.audioUrl}`;
      try {
        audio.playbackRate = readListenSpeed();
      } catch {
        /* playbackRate unsupported — the word still plays at 1x */
      }
      // The seek is async: play only once it lands ('seeked'), with a
      // timeout that plays anyway rather than leaving silence.
      const attemptPlay = () => {
        audio.play().catch(() => {
          setPlayingWordKey(null);
          wordStopRef.current = null;
        });
      };
      const doSeek = () => {
        try {
          audio.currentTime = Math.max(0, startMs / 1000);
        } catch {
          attemptPlay();
          return;
        }
        if (!audio.seeking) {
          attemptPlay();
          return;
        }
        let done = false;
        const onSeeked = () => {
          if (done) return;
          done = true;
          audio.removeEventListener('seeked', onSeeked);
          attemptPlay();
        };
        audio.addEventListener('seeked', onSeeked);
        window.setTimeout(() => {
          if (!done) {
            done = true;
            audio.removeEventListener('seeked', onSeeked);
            if (audio.paused) attemptPlay();
          }
        }, 1500);
      };
      if (audio.readyState >= 1) doSeek();
      else audio.addEventListener('loadedmetadata', doSeek, { once: true });
    },
    [current, micState, stopAudio],
  );

  /* ---------------- navigation ---------------- */

  const resetAttempt = useCallback(() => {
    stopAudio();
    setResult(null);
    setFeedbackWords([]);
    setLiveWords({});
    setPeeked(false);
    setRevealedCount(0);
    setPeekCount(0);
    setPendingFix(false);
    setPlayingWordKey(null);
    setWordNote(null);
    setMicError(null);
    mistakeSoundKeysRef.current.clear();
    setPhase('ready');
  }, [stopAudio]);

  const tryAgain = useCallback(() => {
    resetAttempt();
    setArabicHidden(true);
  }, [resetAttempt]);

  const internalHasNext = currentIndex < ayahs.length - 1;
  const canGoNext = onNextAyah ? (hasNextAyah ?? true) : internalHasNext;
  const nextBlockedByFix = pendingFix && feedbackWords.some((w) => w.status === 'missed' || w.status === 'wrong');
  const nextAyah = useCallback(() => {
    if (onNextAyah) {
      onNextAyah();
      return;
    }
    if (currentIndex >= ayahs.length - 1) return;
    const next = currentIndex + 1;
    resetAttempt();
    // The next ayah starts shown, like a fresh visit — the hide
    // belongs to the take that just ended, not the new ayah.
    setArabicHidden(false);
    setCurrentIndex(next);
    onAyahChange?.(ayahs[next]?.ayah ?? 0);
  }, [onNextAyah, currentIndex, ayahs, resetAttempt, onAyahChange]);

  const peekNext = useCallback(() => {
    setRevealedCount((c) => c + 1);
    setPeekCount((c) => c + 1);
    setPeeked(true);
  }, []);

  const peekRest = useCallback(() => {
    setRevealedCount(10000);
    setPeekCount((c) => c + 1);
    setPeeked(true);
  }, []);

  /* ---------------- derived render state ---------------- */

  const recording = micState === 'recording';
  const correctCount = Object.values(liveWords).filter((v) => v === 'correct').length;
  const progress = words.length > 0 ? correctCount / words.length : 0;
  const missedWords = feedbackWords.filter((w) => w.status === 'missed' || w.status === 'wrong');
  const notHeardCount = feedbackWords.filter((w) => w.status === 'not-reached').length;
  const rightCount = feedbackWords.filter((w) => w.status === 'correct').length;
  const unclear = !!result && (result.unclear || result.noSpeech || result.reachedCount === 0);
  const timer = `${Math.floor(recordingSecs / 60)}:${String(recordingSecs % 60).padStart(2, '0')}`;
  const statusText = recording
    ? vadSpeaking
      ? `Voice detected · ${timer}`
      : voiceDetected
        ? `Paused — keep reciting · ${timer}`
        : framesSeen === 0
          ? `Mic connected · ${timer}`
          : `Listening — recite the ayah · ${timer}`
    : micState === 'requesting'
      ? 'Asking for the microphone…'
      : micState === 'checking'
        ? 'Checking what you said…'
        : null;

  /** Class for one word in the ayah line: live colours while reciting,
   *  feedback colours after, plain otherwise. While a missed word is
   *  sounding (tap to hear it), it lights green — green means
   *  "sounding now", red means "mistake". */
  const wordClass = (key: string): string | undefined => {
    if (playingWordKey === key) return 'live-word-correct';
    if (phase === 'feedback') {
      const fw = feedbackWords.find((f) => f.key === key);
      if (fw?.status === 'correct') return 'live-word-correct';
      if (fw?.status === 'missed' || fw?.status === 'wrong') return 'live-word-wrong';
      return undefined;
    }
    const live = liveWords[key];
    if (live === 'correct') return 'live-word-correct';
    if (live === 'wrong' || live === 'missed') return 'live-word-wrong';
    return undefined;
  };

  return (
    <section aria-label={`Recite ${surahName}`} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <audio ref={audioRef} preload="none" className="hidden" />

      {!online && (
        <p role="status" className="mb-3 text-sm text-[#5b6b62]">
          You are offline. Listen needs a connection; the mic still works on-device.
        </p>
      )}

      {/* The ayah — big Arabic, translation small underneath in grey. */}
      <div className="rounded-xl border border-[#E5E7EB] px-4 py-5">
        <p dir="rtl" lang="ar" translate="no" className="font-quran text-right text-3xl leading-loose text-[#1C2420]">
          {words.map((w) => {
            const key = wordKey(current?.surah ?? surah, current?.ayah ?? 0, w.index + 1);
            const live = liveWords[key];
            const shown =
              !arabicHidden ||
              phase === 'feedback' ||
              live === 'correct' ||
              live === 'wrong' ||
              live === 'missed' ||
              w.index < revealedCount;
            if (!shown) {
              return (
                <span
                  key={key}
                  className="hidden-word-rule"
                  style={{ width: `${Math.max(1.2, w.display.length * 0.45)}em` }}
                />
              );
            }
            return (
              <span key={key} className={wordClass(key)}>
                {w.display}{' '}
              </span>
            );
          })}
          <span className="hidden-ayah-rosette" aria-hidden="true"> ◯</span>
        </p>
        {current?.translation && (
          <p className="mt-3 text-sm leading-relaxed text-[#5b6b62]">{current.translation}</p>
        )}
      </div>

      {/* Peek — only while the words are hidden and before the result. */}
      {arabicHidden && phase !== 'feedback' && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={peekNext}
            className="min-h-11 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1C2420] hover:border-[#1C2420] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C2420]"
          >
            Peek at the next word
          </button>
          <button
            type="button"
            onClick={peekRest}
            className="min-h-11 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1C2420] hover:border-[#1C2420] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C2420]"
          >
            Show all words
          </button>
          {peeked && (
            <p role="status" className="text-xs text-[#5b6b62]">
              You peeked{peekCount > 1 ? ` ${peekCount} times` : ''} — this try won&apos;t count as fully correct.
            </p>
          )}
        </div>
      )}

      {/* Thin progress line while reciting: how far through the ayah. */}
      {recording && (
        <div className="mt-4">
          <div className="h-1 overflow-hidden rounded-full bg-[#E5E7EB]" aria-hidden="true">
            <div className="h-full bg-[#1C2420] transition-[width] duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          {statusText && (
            <p role="status" className="mt-2 text-center text-sm font-semibold text-[#1C2420]">
              {statusText}
            </p>
          )}
          {audioStalled && (
            <p role="alert" className="mx-auto mt-2 max-w-md rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm">
              The mic isn&apos;t sending any sound. Stop and try again, or run a{' '}
              <Link href="/hifz/diagnostics" className="font-semibold text-[#1C2420] underline">
                mic check
              </Link>
              .
            </p>
          )}
          {silentInput && !audioStalled && (
            <p role="alert" className="mx-auto mt-2 max-w-md rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm">
              The mic is connected but silent — check it isn&apos;t muted or covered. Stop and try again.
            </p>
          )}
        </div>
      )}

      {/* Engine loading — the model downloads on the first mic tap. */}
      {engineState === 'loading' && engineLoadProgress && !recording && (
        <div className="mt-4">
          <p role="status" className="text-sm font-semibold text-[#1C2420]">
            Loading the checker… {Math.round(engineLoadProgress.fraction * 100)}%
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#E5E7EB]" aria-hidden="true">
            <div className="h-full bg-[#1C2420]" style={{ width: `${Math.round(engineLoadProgress.fraction * 100)}%` }} />
          </div>
          <button
            type="button"
            onClick={cancelLoad}
            className="mt-2 text-sm font-semibold text-[#1C2420] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C2420]"
          >
            Cancel
          </button>
        </div>
      )}
      {micState === 'requesting' && statusText && !recording && (
        <p role="status" className="mt-4 text-center text-sm font-semibold text-[#1C2420]">{statusText}</p>
      )}
      {micState === 'checking' && statusText && (
        <p role="status" className="mt-4 text-center text-sm font-semibold text-[#1C2420]">{statusText}</p>
      )}
      {micError && (
        <p role="alert" className="mt-4 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1C2420]">
          {micError}
        </p>
      )}
      {engineState === 'failed' && loadError && !micError && (
        <p role="alert" className="mt-4 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1C2420]">
          {loadError}
        </p>
      )}

      {/* Controls: Listen, Hide, and the big round mic. */}
      {phase !== 'feedback' && (
        <div className="mt-5 flex flex-col items-center">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={playing ? stopAudio : playAyahAudio}
              disabled={!current?.audioUrl}
              className="min-h-11 rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#1C2420] hover:border-[#1C2420] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C2420]"
            >
              {playing ? 'Stop' : 'Listen'}
            </button>
            <button
              type="button"
              onClick={() => setArabicHidden((h) => !h)}
              aria-pressed={arabicHidden}
              className="min-h-11 rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#1C2420] hover:border-[#1C2420] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C2420]"
            >
              {arabicHidden ? 'Show' : 'Hide'}
            </button>
          </div>
          <button
            type="button"
            onClick={onMicTap}
            disabled={micState === 'requesting' || micState === 'checking' || engineState === 'loading'}
            aria-label={recording ? 'Stop reciting' : 'Recite with the microphone'}
            className="mt-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#1C2420] bg-white text-[#1C2420] hover:bg-[#F4F5F7] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C2420] focus-visible:ring-offset-2"
          >
            {recording ? (
              <span aria-hidden="true" className="block h-6 w-6 rounded-[4px] bg-[#1C2420]" />
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0M12 19v3" />
              </svg>
            )}
          </button>
          <p className="mt-2 text-sm font-semibold text-[#1C2420]">
            {recording ? 'Tap to stop' : engineState === 'loading' ? 'Loading…' : 'Tap the mic to recite'}
          </p>
          <p className="mt-1 text-center text-xs text-[#5b6b62]">
            Word accuracy only — this does not judge tajweed.
          </p>
        </div>
      )}

      {/* ---------- RESULT ---------- */}
      {phase === 'feedback' && result && (
        <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
          {unclear ? (
            <>
              <p role="status" className="text-sm leading-relaxed text-[#1C2420]">{UNCLEAR_COPY}</p>
              {(result.noSpeech || result.reachedCount === 0) && (
                <p className="mt-2 text-sm text-[#5b6b62]">No words were heard in this try.</p>
              )}
            </>
          ) : (
            <>
              <p className="text-base font-bold text-[#1C2420]">
                {rightCount} of {feedbackWords.length} words right
              </p>
              {missedWords.length > 0 && (
                <>
                  <p className="mt-3 text-sm font-semibold text-[#1C2420]">Words to check — tap one to hear it:</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {missedWords.map((w) => {
                      const idx = Number(w.key.split(':')[2]) - 1;
                      const sounding = playingWordKey === w.key;
                      return (
                        <button
                          key={w.key}
                          type="button"
                          onClick={() => playWord(idx)}
                          aria-label={`Hear the word ${w.display}`}
                          className={`min-h-11 rounded-full border px-3 py-2 font-quran text-xl leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C2420] ${
                            sounding ? 'live-word-correct border-[#E5E7EB] bg-white' : 'live-word-wrong border-[#E5E7EB] bg-white'
                          }`}
                        >
                          {w.display}
                        </button>
                      );
                    })}
                  </div>
                  {wordNote && (
                    <p role="status" className="mt-2 text-sm text-[#5b6b62]">{wordNote}</p>
                  )}
                </>
              )}
              {missedWords.length === 0 && !peeked && (
                <p className="mt-2 text-sm text-[#5b6b62]">Every word heard was right — well done.</p>
              )}
              {peeked && (
                <p className="mt-2 text-sm text-[#5b6b62]">You peeked during this try, so it doesn&apos;t count as fully correct.</p>
              )}
              {notHeardCount > 0 && (
                <p className="mt-2 text-sm text-[#5b6b62]">
                  {notHeardCount} {notHeardCount === 1 ? 'word' : 'words'} {notHeardCount === 1 ? 'wasn’t' : 'weren’t'} heard clearly — say the ayah again to check {notHeardCount === 1 ? 'it' : 'them'}.
                </p>
              )}
            </>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={tryAgain}
              className="min-h-11 rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#1C2420] hover:border-[#1C2420] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C2420]"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={nextAyah}
              disabled={!canGoNext || nextBlockedByFix}
              className="min-h-11 rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#1C2420] hover:border-[#1C2420] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C2420]"
            >
              Next ayah
            </button>
          </div>
          {nextBlockedByFix && (
            <p className="mt-2 text-sm text-[#5b6b62]">
              Your settings hold you on this ayah until it comes back clean — try again.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
