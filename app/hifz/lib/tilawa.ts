/**
 * app/hifz/lib/tilawa.ts — Engine adapter for the recitation coach.
 *
 * A small interface hiding the Tilawa engine (`@tilawa/core`, MIT, on-device)
 * so the coach never touches engine internals and the engine can be swapped
 * later (research §7 step 2 fallback: in-browser Whisper) without touching
 * the UI.
 *
 * LOADING RULES (spec §6 performance budget):
 *  - The engine is loaded ONLY on demand, via dynamic `import()` inside
 *    `loadEngine()`. Nothing in this module is statically imported by a
 *    page: the coach itself is loaded with `next/dynamic(..., { ssr: false })`
 *    and only calls `loadEngine()` after the user taps "Recite".
 *  - `onnxruntime-web` is therefore never in the first-paint bundle.
 *  - Model tiers: `full` (68 MB, `spliced-clean@1-int8`, default) and `lite`
 *    (25 MB, `spliced-clean-lite@1-int8`). `tier: 'auto'` (default) lets
 *    Tilawa pick lite on devices reporting < 4 GB RAM or mobile without
 *    WebGPU. `onnxruntime-web` is pinned to 1.30.0 because that is the
 *    version Tilawa hosts its WASM runtime for at tilawa.dev (see its
 *    v1/manifest.json); a newer ORT would fail to load its WASM files.
 *  - Downloads report progress (`onProgress`) and are cancellable via
 *    `AbortSignal`. Files are cached by the Cache API after the first
 *    download, so repeat visits are near-instant and the coach can work
 *    offline once cached.
 *
 * WHAT THE ENGINE GIVES US (Tilawa 1.0.0-rc.0, `@tilawa/core/web`):
 *  - `createTilawa({ tier, onProgress, signal })` → `Tilawa`
 *  - `startMemorization({ surah, fromAyah, toAyah })` — a declared-passage
 *    session: the tracker stays inside the passage and `position` events
 *    carry the word the reciter should be on (`expected`).
 *  - `position` events: `observed[0].word` = { surah, ayah, word } (1-based
 *    word index inside the ayah) + `confidence`; `state` locked/acquiring/…
 *  - `checker` events: confirmed mistakes — `wrong_word`, `omitted_word`,
 *    `added_word`, `skipped_passage` — with `location` { surah, ayah, word }
 *    and `confidence`. Suspected mistakes that self-correct become
 *    `resolved` and are NOT counted (policy `countSelfCorrections: false`).
 *  - `listen(session, { onLevel })` — mic → session, with a live dBFS level
 *    callback for the meter. Rejects with `MicrophoneError` (`denied` /
 *    `unavailable` / `insecure-context`). On mobile the mic MUST be
 *    prepared first, synchronously in the tap, via
 *    `engine.prepareMicrophone()` and passed as `prepared` — otherwise the
 *    AudioContext is created after the permission prompt, outside the
 *    gesture, and can stay suspended with zero audio reaching the model
 *    (2026-11-22 "no voice" bug; see PreparedMicCapture).
 *  - `session.mistakes()` — confirmed mistakes at the end of a take.
 *  - `session.getAudioHealth()` — capture vs tracker telemetry: whether
 *    the mic actually delivered sound (`levelCallbacks`, `everAudible`)
 *    vs whether the tracker followed words (`positionEvents`,
 *    `everLocked`). `noSpeech` alone never proves the mic heard nothing.
 *
 * MAPPING TO THE COACH'S WORD MODEL (spec §3/§8):
 *  - correct: a word the tracker observed (locked position) and the checker
 *    never flagged.
 *  - wrong: checker `wrong_word` at that location ("Check this word" in UI).
 *  - missed: checker `omitted_word` / `skipped_passage`, or a word the
 *    reciter never reached while later words were observed.
 *  - not-reached: words after the last observed word (partial recitation —
 *    research §5 step 2.6). Never shown as missed. Words BEFORE the start
 *    anchor (lib/recitation-anchor.ts) are also not-reached — the reciter
 *    started after them, so they were never attempted, however the checker
 *    flagged them (Mehran, 2026-11-26).
 *  - The adapter NEVER emits tajweed labels, scores or rule names. Tilawa's
 *    pronunciation error classes exist in the engine but are unsupported in
 *    v1 (`capabilities.unsupported`) and are never surfaced. Measured
 *    2026-11-23: both shipped model manifests (`spliced-clean-lite` and
 *    `spliced-clean`, `models-v1.json`) list ONLY the four memorization
 *    classes as `supported`, so `short_vowel` — the class a pure
 *    vowel-only (tashkeel) error would need — cannot fire on this model
 *    version, and the adapter never populates a heard word for the
 *    harakat-strict comparison to compare against. See the coach for the
 *    removed dead branch.
 *  - Pause: Tilawa has no session pause. The adapter's `pause()` suspends
 *    the prepared AudioContext (no frames reach the tracker, so the
 *    audio-delivered session clock stops) and `resume()` resumes it.
 *
 * PRIVACY: audio is processed on-device by the ONNX model and never leaves
 * the device. No audio is stored — the coach keeps word references only.
 */

// Type-only imports: erased at compile time, so they add nothing to the bundle.
import type {
  CheckerEvent,
  EngineEvent,
  PositionEvent,
  Tilawa,
  TilawaSession,
  WordRef,
} from '@tilawa/core';
import type { Microphone, PreparedMicrophone } from '@tilawa/core/web';
import { splitWords } from './alignment';
import { AnchorTracker, ANCHOR_MIN_CONFIDENCE } from './recitation-anchor';

export type EngineTier = 'auto' | 'full' | 'lite';

export interface EngineLoadProgress {
  /** 'model' | 'reference' | 'warmup' (Tilawa load stages). */
  stage: string;
  /** 0..1 within the current stage. */
  fraction: number;
  loaded: number;
  total: number;
  fromCache: boolean;
  /** Human-readable size label for the tier being downloaded. */
  tierLabel: string;
}

export interface LoadEngineOptions {
  onProgress?: (p: EngineLoadProgress) => void;
  /** Default 'auto'. */
  tier?: EngineTier;
  /** Cancels the download; loadEngine then rejects with an AbortError. */
  signal?: AbortSignal;
}

/** One expected word, as the coach passes it in. */
export interface ExpectedAyah {
  surah: number;
  ayah: number;
  /** Display text (Uthmani or Indo-Pak — both normalise the same way). */
  text: string;
}

export type CoachWordStatus = 'correct' | 'missed' | 'wrong' | 'not-reached';

export interface WordEvent {
  /** 0-based index inside its ayah. */
  wordIndex: number;
  surah: number;
  ayah: number;
  /** 1-based word index inside the ayah (Tilawa's WordRef.word). */
  word: number;
  status: CoachWordStatus;
  /** Tracker/checker confidence 0..1, when the engine reported one. */
  confidence?: number;
  /** Display form of the expected word. */
  display: string;
}

export interface SessionWordResult extends WordEvent {
  /** What the engine heard at this spot, when it could say (normalised). */
  heard?: string;
}

export interface SessionResult {
  words: SessionWordResult[];
  /** Words heard correctly / words the reciter reached. */
  correctCount: number;
  reachedCount: number;
  missedCount: number;
  /** True when the attempt was too unclear to trust per-word colours. */
  unclear: boolean;
  /**
   * Passage index of the start anchor — the first lock's clean span
   * start once the 3-run confirms the take (the span is the tracker's
   * committed match, so it is where the recitation began), else the
   * first word of the first run of >= 3 consecutive trustworthy
   * locked observations, else the first-locked fallback at stop — or
   * null when the take never locked and the short-ayah fallback did
   * not fire. Logged by the UI so a phone test can prove where the
   * anchor landed. 0 on a from-the-top take when the head
   * certification fires (1:1 recited) or the lock's span starts at
   * the head; on clean audio the first lock lands 1–9 s in, so
   * without a clean span the anchor is usually a few words past the
   * true start and the words before it are `not-reached`, never
   * `missed` (except a confirmed skip the tracker demonstrably
   * passed over — see preAnchorFlagStands() in the adapter).
   */
  anchorIndex: number | null;
  /** "surah:ayah:word" key of the anchor word, or null (see anchorIndex). */
  anchorKey: string | null;
  /** True when the tracker observed no expected word at all. NOTE: this
   * does NOT by itself mean the microphone heard nothing — see
   * `micHeardAudio` / `audioHealth`. A take can have noSpeech=true while
   * the mic clearly heard the recitation (tracker never locked, take too
   * short, recitation too quiet for the model). The UI must never render
   * "we didn't hear anything" from noSpeech alone. Since 2026-11-27
   * (H2) only LOCKED observations count here: a take the tracker
   * followed only in `ambiguous` has noSpeech=true and unclear=true.
   */
  noSpeech: boolean;
  /**
   * True when the microphone demonstrably heard sound during the take:
   * at least AUDIBLE_CALLBACKS_MIN level callbacks louder than
   * AUDIBLE_DBFS. When noSpeech=true and micHeardAudio=true, the mic
   * worked and the TRACKER failed to follow — a different problem with a
   * different message. When both are false, the mic captured nothing.
   */
  micHeardAudio: boolean;
  /** Raw capture/tracker telemetry behind micHeardAudio (see AudioHealth). */
  audioHealth: AudioHealth;
  /**
   * True when the tracker followed words OUTSIDE the declared passage
   * (e.g. the reciter said a different ayah) while observing none of the
   * expected words. The UI can then say "that didn't sound like this ayah"
   * instead of showing per-word colours.
   */
  trackedElsewhere: boolean;
  /** Confirmed checker mistakes, raw (for the mistake log). */
  mistakes: CheckerEvent[];
  /** Session audio clock at stop, ms. */
  durationMs: number;
}

/**
 * Mic-capture health for one take, measured from Tilawa's own `onLevel`
 * callbacks (live dBFS from the raw worklet frames, BEFORE any resampling
 * or tracker work) and from the tracker's position events.
 *
 * This is what separates the two failure modes the old `noSpeech` flag
 * conflated (2026-11-22 bug: "We didn't hear anything" shown while the
 * user was reciting aloud):
 *  - CAPTURE failure: `levelCallbacks === 0` — the AudioWorklet never
 *    delivered a frame, so no audio reached the model at all (typically a
 *    suspended AudioContext — see prepareMicrophone() below).
 *  - TRACKER failure: `everAudible === true` but no position event ever
 *    observed an expected word — the mic heard the recitation, the model
 *    did not follow it (too short / too quiet / never locked).
 */
export interface AudioHealth {
  /** `onLevel` callbacks received (about one per 20 ms while the worklet
   * runs). 0 means the worklet never delivered a frame — capture is dead
   * even though permission was granted. */
  levelCallbacks: number;
  /** Loudest mic level seen, dBFS. Digital silence reports about -120. */
  maxLevelDb: number;
  /** Callbacks louder than AUDIBLE_DBFS. */
  audibleCallbacks: number;
  /** True when the mic clearly heard sound (see AUDIBLE_* below). */
  everAudible: boolean;
  /**
   * True when frames ARE flowing (levelCallbacks >= SILENT_CALLBACKS_MIN)
   * but the level never rose above SILENT_DBFS — the capture path runs
   * yet the input is digital silence (muted track, wrong input device,
   * mic covered/blocked at the OS level). Distinct from zero callbacks
   * (dead worklet): here the mic is "connected" and still hears nothing.
   * The coach shows this live, while the user can still fix it, instead
   * of waiting for a false "didn't hear anything" at the end.
   */
  silentInput: boolean;
  /** Position events received from the tracker, any state (including
   * `ambiguous` events with no observed word). */
  positionEvents: number;
  /** True once the tracker reached state 'locked'. */
  everLocked: boolean;
}

/** A level above this is treated as real sound, not room noise. Speech at
 * a phone held normally is typically -40..-10 dBFS; a quiet room sits
 * around -60 dBFS or lower. Mirrors the VAD margin Tilawa uses
 * (floor -60 dBFS + 12 dB margin = -48 dBFS trigger). */
export const AUDIBLE_DBFS = -50;
/** Minimum loud callbacks before a take counts as "mic heard audio" —
 * one stray transient (door, tap) must not clear the user. */
export const AUDIBLE_CALLBACKS_MIN = 3;
/**
 * Silent-input line: a take whose loudest level never rises above this
 * is digital silence, not quiet speech — a phone mic in a quiet room
 * still reports about -60 dBFS of room noise, so anything at or below
 * -110 dBFS means no sound is reaching the app at all. Only trusted
 * after SILENT_CALLBACKS_MIN callbacks (~1 s of flowing frames), so a
 * slow worklet start is not misread as a dead mic.
 */
export const SILENT_DBFS = -110;
export const SILENT_CALLBACKS_MIN = 50;

/**
 * Maximum `per` (unweighted phoneme error rate against the matched
 * span) of a first lock's committed span for its words to be trusted
 * as recited. Measured 2026-11-27 (tools/mic4-span-probe.mjs, lite
 * tier, clean Alafasy audio): clean first-lock spans run per 0–0.03
 * at confidence 0.90–1.00; a span covering a word skipped inside the
 * acquisition window runs per 0.207 at confidence 0.155, with the lock
 * 3.1 s later — and the checker confirms that skip. The gate rejects
 * a dirty span wholesale: when the acquisition is dirty, no span word
 * is trusted, and the anchor falls back to the run as before.
 */
export const FIRST_LOCK_SPAN_MAX_PER = 0.1;
/**
 * Per ceiling for the pre-lock ambiguous evidence (the head
 * certification + the short-ayah fallback, 2026-11-27): the basmala
 * bar, measured per-0 on clean audio. Kept separate from
 * FIRST_LOCK_SPAN_MAX_PER because ambiguous evidence is weaker than a
 * locked span and must clear the stricter bar.
 */
export const HEAD_AMBIGUOUS_MAX_PER = 0.05;
/** Same per ceiling for the pre-lock ambiguous basmala evidence (alias of HEAD_AMBIGUOUS_MAX_PER). */
export const BASMALA_AMBIGUOUS_MAX_PER = HEAD_AMBIGUOUS_MAX_PER;
/** Same cost ceiling as the basmala rule (measured cost 0 on clean audio). */
export const HEAD_AMBIGUOUS_MAX_COST = 0.01;
/**
 * In-tap mic buffer (2026-11-27, mic perfection): longest opening
 * audio kept from the tap, ms. A cold tap pays ~7 s engine load +
 * ~7 s first-session construction before listen() starts, and the
 * reciter's opening words play into nothing in that window — the
 * buffer covers it. 15 s bounds the queued backlog (a longer gap
 * means the user has not started reciting yet — the UI still shows
 * "loading" — so only the opening 15 s can contain speech).
 */
export const TAP_BUFFER_MAX_MS = 15000;
/**
 * Shortest buffer worth draining, ms: a warm tap's buffer is ~100–
 * 300 ms of audio, which the first lock's span already recovers — so
 * a sub-500 ms buffer is discarded outright instead of paying the
 * stop + decode round trip (which would cost live audio of its own).
 */
export const TAP_BUFFER_MIN_MS = 500;

/**
 * A microphone prepared synchronously inside the user's tap, via Tilawa's
 * `prepareMicrophone()` (`@tilawa/core/web`).
 *
 * WHY THIS EXISTS (root cause, 2026-11-22): Tilawa documents that "iOS
 * Safari only starts audio created or resumed during a user gesture", so
 * `prepareMicrophone()` must be called synchronously in the click handler
 * "when anything async (such as the first model download) happens before
 * `listen()`". The old adapter called `listen()` after awaits — and
 * `listen()` itself awaits the permission prompt BEFORE creating its
 * AudioContext — so on mobile the context could be created outside the
 * gesture, stay `suspended` (its `resume()` failure was swallowed), the
 * worklet never pulled, and zero frames reached the model: `noSpeech`
 * with a working physical mic. Preparing in the tap keeps the context
 * creation + resume inside the gesture on iOS Safari and inside transient
 * activation on Android Chrome / Samsung Internet.
 *
 * The prepared `stream` is ALSO the coach's own-recording source: the
 * coach must reuse this stream for MediaRecorder and never open a second
 * getUserMedia while Tilawa is listening (a second concurrent mobile
 * capture competes with the first). `listen()` takes ownership of the
 * handle — after passing it to startMic(), do NOT call release().
 */
export interface PreparedMicCapture {
  /** Opaque Tilawa handle; pass to `startMic()`. */
  readonly handle: PreparedMicrophone;
  /** The mic stream (resolves once permission is granted). Shared with
   * the coach's MediaRecorder — same stream, no second capture. */
  readonly stream: Promise<MediaStream>;
  /** The AudioContext Tilawa will listen on (created in the tap). */
  readonly context: AudioContext;
  /** Release the context + tracks if `listen()` is never called. */
  release(): void;
}

export interface StartSessionOptions {
  surah: number;
  fromAyah: number;
  toAyah: number;
  /** Expected text, one entry per ayah in the range. */
  expected: ExpectedAyah[];
  /**
   * The ayah the reciter is starting on (the reader's visible/topmost
   * ayah; unset in the coach, where the passage head is the start).
   * The adapter floors the start anchor at the first word of the ayah
   * BEFORE this one (one ayah of slack), so a lock onto the passage
   * head can never become the anchor (H1, 2026-11-27).
   */
  startAyah?: { surah: number; ayah: number };
  /** Live word events as the tracker follows the recitation. */
  onWord?: (e: WordEvent) => void;
  /** Live mic level in dBFS (about every 20 ms) for the level meter. */
  onLevel?: (db: number) => void;
  /** Fired when the tracker state changes (acquiring/locked/lost). */
  onTrackerState?: (state: string) => void;
}

export interface RecitationSession {
  /**
   * Start the microphone into this session. Pass a capture prepared
   * synchronously in the user's tap via `engine.prepareMicrophone()` —
   * that is the only supported path on mobile (see PreparedMicCapture);
   * without it `listen()` creates its AudioContext after the permission
   * prompt, outside the gesture, and the context can stay suspended.
   * Rejects with MicrophoneError.
   */
  startMic(prepared?: PreparedMicCapture): Promise<void>;
  /** Feed audio directly (file-driven scoring / tests). Any sample rate. */
  pushAudio(samples: Float32Array, sampleRate: number): Promise<void>;
  /** Live capture/tracker health for this take (see AudioHealth). */
  getAudioHealth(): AudioHealth;
  /**
   * Stop (mic or file), drain the engine and decide every open mistake.
   * Returns the full per-word result. Idempotent.
   */
  stop(): Promise<SessionResult>;
  /**
   * Pause the take: suspend the prepared AudioContext so no audio
   * reaches the tracker (Tilawa itself has no pause API — the session
   * clock counts audio delivered, so it pauses with the context), and
   * mark the session paused. The coach separately pauses its own
   * MediaRecorder and its wall-clock timer. Idempotent; a no-op for a
   * file-driven session with no prepared context. Resume with resume().
   */
  pause(): Promise<void>;
  /** Resume a paused take (resume the AudioContext). Idempotent. */
  resume(): Promise<void>;
  /** True while the take is paused. */
  readonly paused: boolean;
  /**
   * Abandon the take WITHOUT producing a result: stop the mic, close
   * the AudioContext, dispose the session. Used when the user leaves
   * mid-take ("Back to listening", mode switch) or when a new take must
   * start before the previous one ended — the old capture is fully
   * stopped and awaited before the new one starts, so two live
   * AudioContexts / mic streams never overlap. Idempotent; a no-op when
   * stop() is already in flight (that take is ending anyway).
   */
  abort(): Promise<void>;
  dispose(): void;
}

export interface RecitationEngine {
  readonly tier: string;
  readonly modelId: string;
  readonly modelVersion: string | null;
  /**
   * Prepare the microphone SYNCHRONOUSLY inside the user's tap handler,
   * before any await. Must be called before `startMic()` on the session;
   * the returned capture is handed to `startMic()` (which takes
   * ownership). Throws synchronously when there is no mic API at all.
   * Requires the engine module to be loaded (it is, once loadEngine()
   * has resolved — which is when the mic button is shown).
   */
  prepareMicrophone(): PreparedMicCapture;
  startSession(opts: StartSessionOptions): RecitationSession;
  /** Release the ONNX session. The model stays in the Cache API. */
  unload(): Promise<void>;
}

const TIER_LABELS: Record<EngineTier, string> = {
  auto: 'about 68 MB (25 MB lite on low-memory phones)',
  full: 'about 68 MB',
  lite: 'about 25 MB',
};

/**
 * Feature-detect the engine's hard requirements. Returns a plain reason when
 * the coach cannot run the engine on this device/browser, so the UI can fall
 * back to listen + self-mark instead of failing silently.
 */
export function engineSupport(): { supported: boolean; reason?: string } {
  if (typeof window === 'undefined') return { supported: false, reason: 'server' };
  if (!window.isSecureContext) {
    return { supported: false, reason: 'insecure-context' };
  }
  if (!('caches' in window)) {
    return { supported: false, reason: 'no-cache-api' };
  }
  if (typeof WebAssembly !== 'object') {
    return { supported: false, reason: 'no-webassembly' };
  }
  return { supported: true };
}

/** Rough device-memory hint used only to label which tier `auto` will pick. */
export function autoTierLabel(): string {
  if (typeof navigator === 'undefined') return TIER_LABELS.auto;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (mem !== undefined && mem < 4) return TIER_LABELS.lite;
  if (mobile && !('gpu' in navigator)) return TIER_LABELS.lite;
  return TIER_LABELS.full;
}

/**
 * The dynamically imported `@tilawa/core/web` module, cached by
 * loadEngine(). `prepareMicrophone()` must run synchronously inside a tap
 * handler, so it cannot do its own dynamic import (an `await import()`
 * would leave the gesture); it uses this cache instead. The cache is set
 * exactly when the engine finishes loading — the mic button is only shown
 * once the engine is ready, so prepareMicrophone() always finds it.
 */
let webModule: typeof import('@tilawa/core/web') | null = null;

/**
 * Warm just the `@tilawa/core/web` JS module (no model download) so
 * `prepareMicrophoneStandalone()` can run synchronously inside a tap
 * later. Call on mount / first interaction; cheap (chunk only — the
 * 25 MB model is NOT downloaded here). `loadEngine()` sets the same
 * cache when it runs.
 */
export async function warmWebModule(): Promise<void> {
  if (webModule) return;
  try {
    webModule = await import('@tilawa/core/web');
  } catch {
    // Module unavailable — loadEngine() will surface the failure.
  }
}

/**
 * IN-TAP MIC BUFFER (2026-11-27, mic perfection — gap 1).
 *
 * The problem: on a cold tap the engine load (~7 s, cached model) +
 * the first session's construction (~7 s, synchronous, blocks the
 * main thread) run between the tap's `prepareMicrophone()` and
 * `listen()`, and nothing captures the reciter's opening words in
 * that window — the fake-audio harness and a real phone agree: the
 * cold-tap TOP take scored 14/29 with the anchor wrongly at 1:3:1.
 * The background warmup fixes the warm tap, not the tap that lands
 * before the warmup finishes.
 *
 * Why a MediaRecorder buffer is SAFE here (the earlier investigation
 * stopped at "buffered audio must feed before the live stream or it
 * corrupts tracker order, and draining a backlog at ~0.2x real-time
 * would stall the live take" — both premises are now measured
 * otherwise):
 *  - ORDER: `TilawaSession.pushAudio` calls "run one at a time in
 *    call order". The buffer is pushed (fire-and-forget, never
 *    awaited) BEFORE `listen()` is called, so it is queued strictly
 *    before the first live worklet chunk — in order, nothing lost,
 *    nothing reordered. `listen()` only starts feeding live chunks
 *    after its async worklet setup, which happens after our push.
 *  - DRAIN: measured Node (onnxruntime-node, lite tier, take-top.wav)
 *    drains at 11.8–13.1x real-time, and the warm browser harness
 *    shows the first lock landing ~0.8 s behind the audio it
 *    references — the model keeps up with live audio once warm. A
 *    ≤ 15 s buffer is a bounded, shrinking lag, not a stall; and the
 *    final result never depends on drain speed anyway, because
 *    `stop()` drains the session (session.end()) before the result
 *    is built. The live highlighting may trail the voice by the
 *    buffer length on a cold tap — strictly better than losing the
 *    opening words entirely. The `[tilawa] tracker-lag:` summary
 *    logged at stop measures the real lag per take.
 *  - CAPTURE: the recorder runs on the prepared stream — the same
 *    stream the coach's own MediaRecorder already shares — starting
 *    when the stream resolves (permission granted; before that the
 *    user cannot be reciting). It records on the media thread, so it
 *    keeps capturing through the synchronous session-construction
 *    block on the main thread. Two recorders on one stream are
 *    independent; a second getUserMedia is never opened.
 *  - FAILURE: any failure (no MediaRecorder, no supported mimeType,
 *    decode error, empty blob) yields null and the take proceeds
 *    exactly as before — the buffer can never break a take.
 */
export interface TapBufferDrain {
  samples: Float32Array;
  sampleRate: number;
  /** Decoded audio length, ms. */
  durationMs: number;
  /** True when the recording ran longer than TAP_BUFFER_MAX_MS and the tail was dropped. */
  truncated: boolean;
}

interface TapBufferController {
  /** Wall ms recorded so far (tap/grant → now). */
  elapsedMs(): number;
  /** Stop the recorder, decode the audio, return null when unusable. */
  drain(): Promise<TapBufferDrain | null>;
  /** Abandon the recording (take never started / capture released). */
  discard(): void;
}

/** In-tap recorders, keyed by the capture they belong to. Module-level
 * so `startMic()` can drain the buffer `prepareMicrophoneStandalone()`
 * started, without changing the public PreparedMicCapture shape. */
const tapBuffers = new WeakMap<PreparedMicCapture, TapBufferController>();

function pickTapBufferMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return '';
  for (const cand of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) {
    try {
      if (MediaRecorder.isTypeSupported(cand)) return cand;
    } catch {
      // Ignore and try the next candidate.
    }
  }
  return '';
}

function startTapBuffer(handle: PreparedMicrophone, context: AudioContext): TapBufferController | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const mimeType = pickTapBufferMimeType();
  const chunks: Blob[] = [];
  let recorder: MediaRecorder | null = null;
  let stopped = false;
  let startedAt: number | null = null;
  handle.stream.then((stream) => {
    if (stopped) return;
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch (e) {
      console.log('[tilawa] tap-buffer-recorder-failed:', JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
      return;
    }
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.onerror = (e) => {
      console.log('[tilawa] tap-buffer-error:', JSON.stringify({ error: String((e as ErrorEvent).error ?? e.type) }));
    };
    try {
      recorder.start(250);
      startedAt = Date.now();
      console.log('[tilawa] tap-buffer-started:', JSON.stringify({ wallMs: Math.round(performance.now()), mimeType: mimeType || '(default)' }));
    } catch (e) {
      console.log('[tilawa] tap-buffer-start-failed:', JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
      recorder = null;
    }
  }).catch((e) => {
    console.log('[tilawa] tap-buffer-stream-failed:', JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
  });
  const elapsedMs = (): number => (startedAt === null ? 0 : Date.now() - startedAt);
  const drain = async (): Promise<TapBufferDrain | null> => {
    stopped = true;
    const rec = recorder;
    recorder = null;
    if (!rec) return null;
    // Stop and await the final flush. The encoder MUST be drained via
    // stop(): Chrome's webm muxer may emit nothing on the timeslice
    // ticks and deliver the whole recording on stop — returning early
    // on `chunks.length === 0` here threw away a good 3.7 s buffer in
    // the cold-tap harness (measured 2026-11-27: recorder started,
    // 3703 ms elapsed, drain returned in 1 ms with zero chunks).
    // Only a recorder that is already inactive with nothing recorded
    // yields null.
    if (rec.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        const to = window.setTimeout(() => resolve(), 1500);
        rec.onstop = () => {
          window.clearTimeout(to);
          resolve();
        };
        try {
          rec.stop();
        } catch {
          window.clearTimeout(to);
          resolve();
        }
      });
    }
    if (chunks.length === 0) {
      console.log('[tilawa] tap-buffer-empty:', JSON.stringify({ state: rec.state, chunks: 0 }));
      return null;
    }
    const blob = new Blob(chunks, { type: mimeType || undefined });
    if (blob.size === 0) return null;
    try {
      const buf = await blob.arrayBuffer();
      const audio = await context.decodeAudioData(buf);
      if (!audio || audio.numberOfChannels < 1 || audio.length === 0) return null;
      const data = audio.getChannelData(0);
      const maxSamples = Math.floor((TAP_BUFFER_MAX_MS / 1000) * audio.sampleRate);
      const truncated = data.length > maxSamples;
      const samples = Float32Array.from(truncated ? data.subarray(0, maxSamples) : data);
      return {
        samples,
        sampleRate: audio.sampleRate,
        durationMs: Math.round((samples.length / audio.sampleRate) * 1000),
        truncated,
      };
    } catch {
      return null;
    }
  };
  const discard = () => {
    stopped = true;
    const rec = recorder;
    recorder = null;
    if (rec && rec.state !== 'inactive') {
      try { rec.stop(); } catch { /* ignore */ }
    }
  };
  return { elapsedMs, drain, discard };
}

/**
 * Prepare the microphone synchronously inside the user's tap, WITHOUT
 * waiting for the model: needs only the web module (warmed by
 * `warmWebModule()` or by an earlier `loadEngine()`). Throws when the
 * module is not warm yet — the caller falls back to awaiting the
 * engine first (H5, 2026-11-27: the old path awaited `ensureEngine()`
 * before preparing, so a cold first tap prepared outside the gesture
 * and the AudioContext could stay suspended with zero frames).
 *
 * Also starts the in-tap buffer (see above): a MediaRecorder on the
 * prepared stream, drained by `startMic()` before `listen()` — so a
 * tap that lands before the background warmup finishes no longer
 * loses its opening words. The recorder is stopped/discarded by
 * `startMic()` or by `release()`; it never outlives the capture.
 */
export function prepareMicrophoneStandalone(): PreparedMicCapture {
  if (!webModule) {
    throw new Error('Recitation engine module is not loaded yet.');
  }
  const handle = webModule.prepareMicrophone();
  const capture: PreparedMicCapture = {
    handle,
    stream: handle.stream,
    context: handle.context,
    release: () => {
      tapBuffers.get(capture)?.discard();
      handle.release();
    },
  };
  const buffer = startTapBuffer(handle, handle.context);
  if (buffer) tapBuffers.set(capture, buffer);
  return capture;
}

/**
 * Load the engine on demand. Dynamic import: `@tilawa/core/web` (and with
 * it `onnxruntime-web`) is fetched only when this function runs — never in
 * the first-paint bundle.
 */
export async function loadEngine(opts: LoadEngineOptions = {}): Promise<RecitationEngine> {
  const tier: EngineTier = opts.tier ?? 'auto';
  // Dynamic import — the only place the engine enters the bundle.
  const web = await import('@tilawa/core/web');
  webModule = web;
  const { createTilawa } = web;
  const tilawa: Tilawa = await createTilawa({
    tier,
    signal: opts.signal,
    onProgress: opts.onProgress
      ? (p) =>
          opts.onProgress!({
            stage: p.stage,
            fraction: p.fraction,
            loaded: p.loaded,
            total: p.total,
            fromCache: p.fromCache,
            tierLabel: TIER_LABELS[tier],
          })
      : undefined,
  });

  return {
    tier: tilawa.model.tier ?? tier,
    modelId: tilawa.model.id,
    modelVersion: tilawa.model.version,
    prepareMicrophone(): PreparedMicCapture {
      return prepareMicrophoneStandalone();
    },
    startSession(sessionOpts: StartSessionOptions): RecitationSession {
      return createSession(tilawa, sessionOpts);
    },
    async unload() {
      await tilawa.dispose();
    },
  };
}

/**
 * Warm the first-session construction cost so the first real mic tap
 * starts listening at once. Measured 2026-11-27 (live, same page):
 * the first `startSession` of the page takes 6.4 s (tracker/checker
 * construction + JIT in `startMemorization`), the second 0.16 s.
 * Nothing buffers between the tap's `prepareMicrophone()` and
 * `listen()`, so every second of that gap is opening audio that never
 * reaches the model — the reciter's first words are lost before the
 * tracker can even acquire. Call once, in the background, after the
 * engine is ready (the reader's background engine warm, the coach's
 * `loadEngineNow`); the passage is arbitrary — any valid passage
 * warms the same construction — so a fixed 1:1 is used and no caller
 * has to thread its passage in. Creates and immediately disposes a
 * throwaway session: no mic, no audio, no subscribers, nothing
 * observed. Best-effort: a failed warmup must never break the real
 * tap, which creates its own session and surfaces errors.
 */
export function warmupSession(engine: RecitationEngine): void {
  try {
    const session = engine.startSession({
      surah: 1,
      fromAyah: 1,
      toAyah: 1,
      expected: [{ surah: 1, ayah: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' }],
    });
    session.dispose();
  } catch {
    // Best-effort warmup; the real tap creates its own session.
  }
}

function wordKey(ref: WordRef): string {
  return `${ref.surah}:${ref.ayah}:${ref.word}`;
}

function createSession(tilawa: Tilawa, opts: StartSessionOptions): RecitationSession {
  // Mic-lag diagnostics (2026-11-27): session-creation wall time on
  // the same performance.now() clock as the first-event logs. The
  // session is created in the mic tap (after the engine-ready await),
  // so with the harness-side tap reading this brackets the tap →
  // listen wait. One line per session; console only.
  console.log('[tilawa] session-created:', JSON.stringify({ wallMs: Math.round(performance.now()) }));
  const session: TilawaSession = tilawa.startMemorization(
    { surah: opts.surah, fromAyah: opts.fromAyah, toAyah: opts.toAyah },
    { confirm: { after: 'next-word' } },
  );
  // Diagnostic (mic-lag investigation): the gap between
  // session-created and session-ready is the tracker/checker
  // construction + JIT on the first session of the page; later
  // sessions are ~10x faster. If this gap is seconds, the take's
  // opening audio is lost before listen() starts (nothing buffers
  // between the tap's prepare and listen()).
  console.log('[tilawa] session-ready:', JSON.stringify({ wallMs: Math.round(performance.now()) }));

  // Expected words, indexed by "surah:ayah:word" (word 1-based in ayah).
  const expectedByKey = new Map<string, { ayah: ExpectedAyah; refWord: ReturnType<typeof splitWords>[number] }>();
  for (const ayah of opts.expected) {
    for (const w of splitWords(ayah.text)) {
      expectedByKey.set(`${ayah.surah}:${ayah.ayah}:${w.index + 1}`, { ayah, refWord: w });
    }
  }
  // Passage order: ayahs in range order, words in index order.
  const orderedKeys = [...expectedByKey.keys()].sort((a, b) => {
    const [sa, aa, wa] = a.split(':').map(Number);
    const [sb, ab, wb] = b.split(':').map(Number);
    return sa - sb || aa - ab || wa - wb;
  });
  const orderedIndex = new Map(orderedKeys.map((k, i) => [k, i]));
  // Ayah structure, for the boundary grace in buildResult().
  const ayahKeys = [...new Set(orderedKeys.map((k) => k.split(':').slice(0, 2).join(':')))];
  const ayahFirstWord = new Map<string, string>();
  const ayahLastWord = new Map<string, string>();
  for (const k of orderedKeys) {
    const ak = k.split(':').slice(0, 2).join(':');
    if (!ayahFirstWord.has(ak)) ayahFirstWord.set(ak, k);
    ayahLastWord.set(ak, k);
  }

  // Live state, updated from position + checker events.
  // H2 (2026-11-27): ONLY locked observations count as "reached".
  // `observed` is written ONLY in the locked branch of the position
  // handler below — an `ambiguous` acquisition guess never enters
  // it, so it can never advance `lastReached` and turn the starting
  // line (or any unobserved word before a stray guess) into `missed`
  // via the "went past" rule in buildResult(). Ambiguous observations
  // feed nothing except the anchor tracker's ignore-list and the
  // first-observed log value.
  const observed = new Map<string, { confidence: number; timeMs: number; state: string }>();
  const flagged = new Map<string, CheckerEvent>();
  const orderOfKey = new Map<string, number>();
  let order = 0;
  let trackerState = 'acquiring';
  /** Passage index of the first expected word the tracker observed, or null.
   * ANY state, logging only — since 2026-11-27 (H3) it NEVER feeds the
   * stop-time anchor fallback: an `ambiguous` acquisition guess must
   * not become the anchor. */
  let firstObservedIndex: number | null = null;
  /** Passage index of the first expected word observed while LOCKED at
   * or after the anchor floor, or null. The stop-time anchor fallback. */
  let firstLockedIndex: number | null = null;
  /**
   * ANCHOR FLOOR (H1, 2026-11-27): the anchor may not land before the
   * first word of the ayah BEFORE the reciter's start ayah (one ayah
   * of slack for a half-visible ayah above the recorded topmost one).
   * 0 when no start ayah was given (coach) or the start ayah is the
   * passage head. A lock onto the passage head can then never become
   * the anchor — the failure mode that silently defeated the first
   * anchor fix — while a genuine start one ayah early still can.
   */
  let anchorFloorIndex = 0;
  if (opts.startAyah) {
    const startAyahKey = `${opts.startAyah.surah}:${opts.startAyah.ayah}`;
    const startPos = ayahKeys.indexOf(startAyahKey);
    if (startPos > 0) {
      anchorFloorIndex = orderedIndex.get(ayahFirstWord.get(ayahKeys[startPos - 1])!) ?? 0;
    }
  }
  /**
   * START ANCHOR (Mehran, 2026-11-26 — mid-page starts marked from the
   * top). The passage is always declared from its first ayah, so the
   * tracker starts expecting word 1 even when the reciter starts
   * mid-page. The anchor is where he ACTUALLY started: the first word
   * of the first run of >= 3 consecutive LOCKED observations (see
   * lib/recitation-anchor.ts). Words before it were never attempted:
   * they are `not-reached`, never flagged live or at stop — the anchor
   * grace BEATS checker flags (a deliberate change to the old grace (A)
   * below, which a confirmed flag defeated). From-the-top start: the
   * anchor is passage index 0, so nothing is suppressed.
   *
   * FIRST-WORD FIX (Mehran, 2026-11-27 — the mic could not capture the
   * first words): the first lock's committed span covers the
   * acquisition audio the tracker consumed as context, so once the
   * 3-run confirms the take, the anchor moves to the span's start
   * (clamped to the floor) and the span's words count as observed —
   * but ONLY when the span is clean (confidence >= 0.5, per <= 0.1):
   * a span covering a skipped word runs per 0.207 and is not trusted
   * at all. Head words the phrase cutter drops before any lock (the
   * 1:1 basmala) are certified instead by the pre-lock ambiguous run
   * that followed them (>= 2 events, per <= 0.05, cost <= 0.01,
   * covering the head contiguously from the floor — see
   * ambiguousPrefixCover; the controls show no 1:1 ambiguous event
   * at all when 1:1 was skipped). The same cover decides a take that
   * never locks (short-ayah fallback, see buildResult). Words
   * between a certified head and the lock's span start — an ayah
   * skipped inside the acquisition window — are the acquisition gap:
   * not-reached unless the checker confirms a skip for one of them.
   * A take that never locks AND has no clean ambiguous cover still
   * has no anchor and reports `unclear`.
   *
   * Until the anchor is known, checker events are BUFFERED (never
   * emitted, never recorded): a flag fired while the tracker is still
   * finding where he started may be about words he never attempted.
   * Once the anchor is known the buffer is flushed — flags at/after it
   * are applied, flags before it are dropped — EXCEPT a confirmed
   * skip the tracker demonstrably passed over (see
   * preAnchorFlagStands()). At stop() the anchor is resolved with its
   * fallback and any still-buffered events are flushed silently
   * (recorded for buildResult, not re-emitted live).
   *
   * HARDENED 2026-11-27 (H1/H3): the run ignores locks below the
   * floor, locks the tracker is less than half-sure of, and locks in
   * the first 500 ms (see lib/recitation-anchor.ts); the stop-time
   * fallback is the first locked word at/after the floor, never an
   * ambiguous guess — a take that never locks has NO anchor and
   * reports `unclear` unless the short-ayah fallback fires. The
   * anchor index is logged when it lands (and returned in
   * SessionResult), so the next phone test can prove where it landed.
   */
  const anchorTracker = new AnchorTracker({ floorIndex: anchorFloorIndex });
  /** Passage index of the anchor once known live, else null. */
  let anchorIndex: number | null = null;
  /** Checker events received before the anchor was known. */
  const pendingCheckerEvents: CheckerEvent[] = [];
  /** True once any position event arrived with state 'locked'. */
  let everLocked = false;
  /** Position events received, any state (see AudioHealth). */
  let positionEvents = 0;
  /**
   * First-event timing diagnostics (mic-lag investigation, 2026-11-27):
   * wall-clock (performance.now()) + session-audio ms of the first
   * position event, first lock (with its committed span + basmala
   * prefix), and first mic level callback — logged once per take so a
   * harness (or a phone console) can split the lag into capture vs
   * decode vs acquisition. Console only; no behaviour change.
   */
  let firstPositionLogged = false;
  let firstLockLogged = false;
  let firstLevelLogged = false;
  /**
   * Tracker-lag diagnostics (2026-11-27, mic perfection): wall ms of
   * listen-start + audio ms already delivered before it (the tap
   * buffer), so each position event's lag behind real time is
   * (wall − listenStartWall + preListenAudioMs − timeMs). A lag that
   * stays flat means the model drains at/above real time; a lag that
   * grows through the take means it drains slower and the live
   * highlighting trails the voice. Logged as a summary at stop.
   */
  let listenStartWallMs: number | null = null;
  let preListenAudioMsRef = 0;
  let firstLockLagMs: number | null = null;
  let lastLagMs: number | null = null;
  let maxLagMs = 0;
  /**
   * First-lock span (mic first-word fix, 2026-11-27): the committed
   * match of the take's first lock, as passage indices — set only when
   * the span is clean (confidence >= 0.5, per <=
   * FIRST_LOCK_SPAN_MAX_PER). Its words are the acquisition context
   * the lock consumed; they were recited, so they count as observed
   * and the anchor starts at the span start (clamped to the floor).
   * Null when the first lock's span is dirty or absent: no span word
   * is trusted and the anchor falls back to the run as before. Only
   * the FIRST lock ever sets this — later (local) events' spans are
   * whole local runs, which a mid-run skip would also span.
   */
  let firstLockSpan: { startIndex: number; endIndex: number } | null = null;
  /**
   * First-lock span start, whether the span is clean or dirty
   * (2026-11-27, mic perfection): the span's start is where the
   * tracker's committed match began even when the match itself is
   * dirty. Used for the acquisition-gap grace (words between the
   * certified head and the span start sat inside the acquisition
   * window — unproven, never missed unless the checker confirms
   * them). Raw passage index (not floor-clamped); only the FIRST
   * lock ever sets it.
   */
  let firstLockSpanStartIndex: number | null = null;
  /**
   * First-lock span when it FAILS the clean gate (2026-11-27): a
   * dirty span is trusted for no word — but its dirt is itself
   * evidence (a span covering a skipped word runs per ~0.2). Its
   * words are graced (not-reached, never missed via the went-past
   * rule) UNLESS the checker confirms a skip for one of them — see
   * preAnchorFlagStands(). Null when the first lock's span is clean
   * or absent.
   */
  let firstLockSpanDirty: { startIndex: number; endIndex: number } | null = null;
  /**
   * Pre-lock ambiguous observations of expected words (2026-11-27,
   * mic perfection — generalises the old basmala-only list). Each
   * entry is the observation's committed span as passage indices,
   * with the tracker's own per/cost/confidence. Recorded only while
   * the take has never locked: after the first lock the take is
   * following, and later ambiguous events are re-acquisition, not
   * head evidence. Judged only as a run (see
   * ambiguousPrefixCover): a single stray guess proves nothing.
   * Capped — a take's acquisition is seconds, not minutes.
   */
  const preLockAmbiguous: { spanStartIdx: number; spanEndIdx: number; confidence: number; per: number; cost: number }[] = [];
  /** True once the head-certification rule has fired for this take. */
  let headCertified = false;
  /** Certified head range [start, end] (passage indices), or null. */
  let headCertifiedRange: { startIndex: number; endIndex: number } | null = null;
  /**
   * Acquisition-gap grace range (2026-11-27): words between the
   * certified head's end and the first lock's span start — inside
   * the acquisition window, unproven either way. Not-reached unless
   * the checker confirms a skip for one of them. Null when there is
   * no gap (the span follows the head immediately, the normal TOP
   * case) or the head was never certified.
   */
  let acquisitionGap: { startIndex: number; endIndex: number } | null = null;
  /** Mic-capture health, from Tilawa's onLevel callbacks (raw worklet
   * frames, before resampling/tracking). Silence reports about -120 dBFS. */
  let levelCallbacks = 0;
  let maxLevelDb = -120;
  let audibleCallbacks = 0;
  const getAudioHealth = (): AudioHealth => ({
    levelCallbacks,
    maxLevelDb,
    audibleCallbacks,
    everAudible: audibleCallbacks >= AUDIBLE_CALLBACKS_MIN,
    silentInput: levelCallbacks >= SILENT_CALLBACKS_MIN && maxLevelDb <= SILENT_DBFS,
    positionEvents,
    everLocked,
  });
  /** Record one onLevel sample, then forward it to the UI meter. */
  const recordLevel = (db: number) => {
    levelCallbacks++;
    if (!firstLevelLogged) {
      firstLevelLogged = true;
      console.log('[tilawa] first-level:', JSON.stringify({ wallMs: Math.round(performance.now()) }));
    }
    if (db > maxLevelDb) maxLevelDb = db;
    if (db > AUDIBLE_DBFS) audibleCallbacks++;
    opts.onLevel?.(db);
  };
  let mic: Microphone | null = null;
  /** The AudioContext behind the prepared mic capture (set in
   * startMic). Suspending it is how pause() stops audio reaching the
   * tracker — Tilawa exposes no pause of its own. Null for file-driven
   * sessions, where pause() is a no-op. */
  let preparedContext: AudioContext | null = null;
  /** True while the take is paused (see pause()/resume()). */
  let paused = false;
  let stopped = false;
  let stopPromise: Promise<SessionResult> | null = null;
  let abortPromise: Promise<void> | null = null;

  const emitWord = (ref: WordRef, status: CoachWordStatus, confidence?: number) => {
    const entry = expectedByKey.get(wordKey(ref));
    if (!entry || !opts.onWord) return;
    opts.onWord({
      wordIndex: entry.refWord.index,
      surah: ref.surah,
      ayah: ref.ayah,
      word: ref.word,
      status,
      confidence,
      display: entry.refWord.display,
    });
  };

  /**
   * Mark every expected word in a passage range as observed (locked),
   * in passage order, and light it live — the shared half of the
   * first-lock span and head-certification rules. A checker flag still beats
   * `seen` at stop (buildResult checks flags before `seen`); live, a
   * flagged word is never lit, and a flag arriving later un-lights it
   * via applyCheckerEvent. The UI dedupes repeat 'correct' events by
   * key, so the range's end word being re-emitted by the handler's own
   * live-light below is a no-op.
   */
  const markRangeObserved = (startIdx: number, endIdx: number, confidence: number, timeMs: number) => {
    for (let i = startIdx; i <= endIdx; i++) {
      const k = orderedKeys[i];
      if (observed.has(k)) continue;
      observed.set(k, { confidence, timeMs, state: 'locked' });
      orderOfKey.set(k, order++);
      if (!flagged.has(k) && opts.onWord) {
        const entry = expectedByKey.get(k);
        if (entry) {
          const [s, a, w] = k.split(':').map(Number);
          opts.onWord({
            wordIndex: entry.refWord.index,
            surah: s,
            ayah: a,
            word: w,
            status: 'correct',
            confidence,
            display: entry.refWord.display,
          });
        }
      }
    }
  };

  /**
   * The ambiguous-prefix cover (2026-11-27, mic perfection): the
   * longest passage range [start..end] the pre-lock ambiguous
   * evidence covers contiguously from its earliest span start, using
   * only trustworthy observations (confidence >= 0.5 — the anchor
   * floor; per <= HEAD_AMBIGUOUS_MAX_PER, cost <=
   * HEAD_AMBIGUOUS_MAX_COST — the basmala bar, measured per-0 on
   * clean audio). Spans are the tracker's committed matches, so a
   * span [s..e] covers every word in it, not just its observed
   * end-word. Requires >= 2 qualifying events and >= 2 covered
   * words: a single stray guess proves nothing. The start is
   * clamped to the anchor floor — nothing below the floor is ever
   * certified (H1). Null when no such cover exists. Pure: safe to
   * call at the first lock (head certification) and at stop (the
   * short-ayah fallback).
   */
  const ambiguousPrefixCover = (): { startIndex: number; endIndex: number } | null => {
    const qualifying = preLockAmbiguous.filter(
      (a) =>
        a.confidence >= ANCHOR_MIN_CONFIDENCE &&
        a.per <= HEAD_AMBIGUOUS_MAX_PER &&
        a.cost <= HEAD_AMBIGUOUS_MAX_COST,
    );
    if (qualifying.length < 2) return null;
    const start = Math.max(Math.min(...qualifying.map((a) => a.spanStartIdx)), anchorFloorIndex);
    const covered = new Set<number>();
    for (const a of qualifying) {
      for (let i = Math.max(a.spanStartIdx, start); i <= a.spanEndIdx; i++) covered.add(i);
    }
    let end = start - 1;
    while (covered.has(end + 1)) end++;
    if (end - start + 1 < 2) return null;
    return { startIndex: start, endIndex: end };
  };

  /**
   * Whether a checker flag for word `idx` stands even though the word
   * sits before the anchor (2026-11-27, mic perfection — gap 2). The
   * anchor grace exists because the checker can flag words the
   * reciter never attempted — but a CONFIRMED skip the tracker
   * demonstrably passed over is a real skip, not an un-attempted head
   * word. The MID control proves the distinction: on a clean
   * mid-page start the checker confirms NOTHING for the head words
   * (its suspected flags resolve); a confirmed omitted/skipped flag
   * fires only when the tracker's committed path jumps over the word.
   * Two shapes qualify:
   *  (i) the word lies inside the first lock's DIRTY span — the
   *      span's dirt IS the skip (a span covering a skipped word
   *      runs per ~0.2), so the flag names the skipped word;
   *  (ii) the word lies at/after the first word the tracker
   *      demonstrably followed (first lock's span start, else first
   *      locked word) — the take reached past it, so it was skipped,
   *      not un-attempted.
   * Only confirmed missed-class flags qualify: a wrong_word before
   * the anchor stays dropped (the alignment there is too weak to say
   * WHICH word was wrong).
   */
  const preAnchorFlagStands = (ev: CheckerEvent, idx: number): boolean => {
    if (ev.state !== 'confirmed') return false;
    if (ev.errorClass !== 'omitted_word' && ev.errorClass !== 'skipped_passage') return false;
    if (
      firstLockSpanDirty !== null &&
      idx >= firstLockSpanDirty.startIndex &&
      idx <= firstLockSpanDirty.endIndex
    ) {
      return true;
    }
    const firstFollowed = firstLockSpan !== null ? firstLockSpan.startIndex : firstLockedIndex;
    if (firstFollowed !== null && idx >= firstFollowed) return true;
    return false;
  };

  /**
   * Apply one checker event: a confirmed flag goes into `flagged` + a
   * live onWord event; resolved/uncertain clears a flag the reciter
   * fixed. A flag for a word BEFORE the anchor is dropped outright —
   * the word was never attempted, so it is never a mistake, never red
   * live, never in the mistake log, and never plays the mistake sound.
   * `emitLive` false records the flag for buildResult() without
   * re-emitting it (stop-time flush — the UI is already showing the
   * final result by then).
   */
  const applyCheckerEvent = (ev: CheckerEvent, emitLive = true) => {
    const key = wordKey(ev.location);
    const idx = orderedIndex.get(key);
    // Pre-anchor flags are dropped — EXCEPT a confirmed skip the
    // tracker demonstrably passed over (see preAnchorFlagStands()).
    if (idx !== undefined && anchorIndex !== null && idx < anchorIndex && !preAnchorFlagStands(ev, idx)) return;
    if (ev.state === 'confirmed') {
      flagged.set(key, ev);
      if (emitLive) {
        emitWord(
          ev.location,
          ev.errorClass === 'wrong_word' ? 'wrong' : 'missed',
          ev.confidence,
        );
      }
    } else if (ev.state === 'resolved' || ev.state === 'uncertain') {
      // Self-correction: the reciter fixed it, or the audio was too unclear
      // to judge. Never count it as a mistake.
      if (flagged.get(key)?.id === ev.id) {
        flagged.delete(key);
        if (emitLive) emitWord(ev.location, 'correct', ev.confidence);
      }
    }
  };

  /** Flush buffered checker events now the anchor is known. */
  const flushPendingCheckerEvents = (emitLive = true) => {
    if (anchorIndex === null) return;
    const pending = pendingCheckerEvents.splice(0);
    for (const ev of pending) applyCheckerEvent(ev, emitLive);
  };

  session.subscribe((event: EngineEvent) => {
    if (event.type === 'position') {
      const ev = event as PositionEvent;
      positionEvents++;
      // Tracker lag (mic perfection, 2026-11-27): how far behind real
      // time the tracker is running. The session clock counts audio
      // delivered, including any tap buffer fed before listen(), so
      // the buffer's length is added back to the wall clock.
      if (listenStartWallMs !== null) {
        const lag = Math.round(performance.now() - listenStartWallMs + preListenAudioMsRef - ev.timeMs);
        if (firstLockLagMs === null && ev.state === 'locked') firstLockLagMs = lag;
        lastLagMs = lag;
        if (lag > maxLagMs) maxLagMs = lag;
      }
      if (!firstPositionLogged) {
        firstPositionLogged = true;
        console.log('[tilawa] first-position:', JSON.stringify({
          wallMs: Math.round(performance.now()), timeMs: ev.timeMs, state: ev.state,
        }));
      }
      if (ev.state !== trackerState) {
        trackerState = ev.state;
        opts.onTrackerState?.(ev.state);
      }
      const best = ev.observed[0];
      if (!best) return;
      const key = wordKey(best.word);
      const idx = orderedIndex.get(key);
      // AMBIGUOUS EVIDENCE (mic perfection, 2026-11-27 — generalises
      // the old basmala-only list): before the first lock, an
      // `ambiguous` observation's committed span is the only witness
      // for words the tracker's phrase cutter drops before any lock
      // can commit (the 1:1 basmala) and for words on a take that
      // never locks at all (a single short ayah). Recorded here,
      // judged only as a run at the first lock / at stop (see
      // ambiguousPrefixCover); a single stray guess proves nothing.
      // H2 still stands everywhere else: ambiguous observations
      // never enter `observed` directly.
      if (!everLocked && ev.state === 'ambiguous' && best.span) {
        const spanStartIdx = orderedIndex.get(wordKey(best.span.start));
        const spanEndIdx = orderedIndex.get(wordKey(best.span.end));
        if (spanStartIdx !== undefined && spanEndIdx !== undefined && preLockAmbiguous.length < 500) {
          preLockAmbiguous.push({ spanStartIdx, spanEndIdx, confidence: best.confidence, per: best.per, cost: best.cost });
        }
      }
      // Feed the start anchor: locked observations only — an `ambiguous`
      // observation never starts or breaks the run (see
      // lib/recitation-anchor.ts). The moment the anchor is known,
      // release the buffered checker events (flags at/after it only).
      // The anchor index is logged: without it, no phone test can
      // prove whether the anchor landed on his start word or on the
      // passage head (H1 — the first anchor fix was unverifiable).
      if (idx !== undefined) anchorTracker.observe(idx, ev.state, best.confidence, ev.timeMs);
      if (anchorIndex === null && anchorTracker.anchor !== null) {
        // The anchor is where the recitation began: the certified
        // head's start when the pre-lock ambiguous run proves the
        // take started there (the basmala case, generalised), the
        // first lock's clean span start (the match's own start —
        // always at/before the run's first end-word), else the run's
        // start as before.
        anchorIndex = headCertified && headCertifiedRange !== null
          ? headCertifiedRange.startIndex
          : firstLockSpan !== null
            ? Math.max(firstLockSpan.startIndex, anchorFloorIndex)
            : anchorTracker.anchor;
        console.log('[tilawa] anchor:', {
          wallMs: Math.round(performance.now()),
          anchorIndex,
          anchorKey: orderedKeys[anchorIndex],
          floorIndex: anchorFloorIndex,
          firstLockedIndex,
          firstObservedIndex,
          firstLockSpan:
            firstLockSpan !== null
              ? `${orderedKeys[firstLockSpan.startIndex]}..${orderedKeys[firstLockSpan.endIndex]}`
              : null,
          firstLockSpanDirty:
            firstLockSpanDirty !== null
              ? `${orderedKeys[firstLockSpanDirty.startIndex]}..${orderedKeys[firstLockSpanDirty.endIndex]}`
              : null,
          headCertified,
          headCertifiedRange:
            headCertifiedRange !== null
              ? `${orderedKeys[headCertifiedRange.startIndex]}..${orderedKeys[headCertifiedRange.endIndex]}`
              : null,
          acquisitionGap:
            acquisitionGap !== null
              ? `${orderedKeys[acquisitionGap.startIndex]}..${orderedKeys[acquisitionGap.endIndex]}`
              : null,
        });
        flushPendingCheckerEvents();
      }
      if (ev.state === 'locked') {
        everLocked = true;
        if (!firstLockLogged) {
          firstLockLogged = true;
          // `span` is the tracker's committed match ("words covered by
          // the evidence so far") — the acquisition context the lock
          // consumed; `prefix: 'basmala'` certifies a leading basmala
          // was heard before the span. Logged so first-word capture
          // can be measured, not assumed.
          console.log('[tilawa] first-lock:', JSON.stringify({
            wallMs: Math.round(performance.now()),
            timeMs: ev.timeMs,
            key,
            spanStart: best.span ? wordKey(best.span.start) : null,
            spanEnd: best.span ? wordKey(best.span.end) : null,
            prefix: best.prefix ?? null,
            confidence: best.confidence,
            per: best.per,
            cost: best.cost,
          }));
          // FIRST-LOCK SPAN (mic first-word fix, 2026-11-27): the
          // lock's committed match covers the acquisition audio — the
          // words the tracker consumed as context before it could
          // lock. When the alignment is clean (confidence + per gates
          // — a span covering a skipped word runs per 0.207, conf
          // 0.155), those words WERE recited: mark them observed and
          // remember the span start for the anchor. A dirty span is
          // not trusted at all — but its start is still recorded
          // (the acquisition gap) and its range is remembered (the
          // checker may still name a skip inside it). Only the first
          // lock ever does this.
          const spanStartIdx = orderedIndex.get(wordKey(best.span.start));
          const spanEndIdx = orderedIndex.get(wordKey(best.span.end));
          const spanClean =
            best.confidence >= ANCHOR_MIN_CONFIDENCE && best.per <= FIRST_LOCK_SPAN_MAX_PER;
          if (spanStartIdx !== undefined && spanEndIdx !== undefined) {
            firstLockSpanStartIndex = spanStartIdx;
            if (spanClean) {
              const start = Math.max(spanStartIdx, anchorFloorIndex);
              if (start <= spanEndIdx) {
                firstLockSpan = { startIndex: start, endIndex: spanEndIdx };
                markRangeObserved(start, spanEndIdx, best.confidence, ev.timeMs);
              }
            } else {
              firstLockSpanDirty = { startIndex: spanStartIdx, endIndex: spanEndIdx };
            }
          }
          // HEAD CERTIFICATION (2026-11-27 — generalises the basmala
          // rule to any passage head): the pre-lock ambiguous run is
          // the only witness for head words the tracker's phrase
          // cutter drops before any lock can commit (the 1:1 basmala:
          // spans growing 1:1:1..2, ..3, ..4 at per 0, cost 0 on the
          // TOP take). The lock itself can never certify those words
          // and the checker never flags a skipped 1:1 — so the run is
          // required to be a RUN (>= 2 events, per <= 0.05, cost <=
          // 0.01) covering the head contiguously from the floor (see
          // ambiguousPrefixCover). The controls prove the
          // discriminator: skipping 1:1 (recite 1:2-7, or start at
          // 1:3) produces NO 1:1 ambiguous event at all. Unlike the
          // old rule, the lock's span need not start immediately
          // after the head: when an ayah is skipped between the head
          // and the lock (skip 1:2: the lock's span starts at 1:3:1),
          // the words in between are the acquisition gap — graced,
          // never missed unless the checker confirms them.
          const cover = ambiguousPrefixCover();
          if (cover !== null && cover.startIndex === anchorFloorIndex) {
            headCertified = true;
            headCertifiedRange = cover;
            markRangeObserved(cover.startIndex, cover.endIndex, best.confidence, ev.timeMs);
            if (firstLockSpanStartIndex !== null && firstLockSpanStartIndex > cover.endIndex + 1) {
              acquisitionGap = { startIndex: cover.endIndex + 1, endIndex: firstLockSpanStartIndex - 1 };
            }
          }
        }
        // H1/H3: the stop-time fallback anchor is the first lock at or
        // after the floor — a lock onto the passage head never counts.
        if (firstLockedIndex === null && idx !== undefined && idx >= anchorFloorIndex) {
          firstLockedIndex = idx;
        }
      }
      if (firstObservedIndex === null && idx !== undefined) firstObservedIndex = idx;
      // H2: only a LOCKED observation counts as reached. An `ambiguous`
      // guess is recorded nowhere here — it cannot advance the reached
      // frontier, inflate coverage, or turn an unobserved word into
      // `missed` via the "went past" rule in buildResult().
      if (ev.state === 'locked' && !observed.has(key)) {
        observed.set(key, { confidence: best.confidence, timeMs: ev.timeMs, state: ev.state });
        orderOfKey.set(key, order++);
      }
      // A word the tracker is locked on, with no checker flag, is correct
      // so far. Live highlight only; the final result is decided at stop().
      // Once the anchor is known, a locked word BEFORE it is never lit:
      // the reciter never attempted it. H4 (2026-11-27): before the
      // anchor is known, a lock alone is NOT enough to light a word —
      // during acquisition the tracker emits wrong positions, and the
      // old comment claiming a pre-anchor lock "cannot be one of the
      // un-recited head words" did not follow. A word lights live only
      // when the tracker is at least half-sure of it (confidence >=
      // 0.5; measured genuine locks run 0.68–1.00 on clean audio) AND
      // it sits at or after the start floor — a head word can never
      // light, with or without an anchor yet.
      if (
        !flagged.has(key) &&
        ev.state === 'locked' &&
        best.confidence >= ANCHOR_MIN_CONFIDENCE &&
        (idx === undefined || idx >= anchorFloorIndex) &&
        (anchorIndex === null || idx === undefined || idx >= anchorIndex)
      ) {
        emitWord(best.word, 'correct', best.confidence);
      }
    } else if (event.type === 'checker') {
      const ev = event as CheckerEvent;
      if (anchorIndex === null) {
        // Anchor not known yet — buffer. A flag fired now may be about
        // words the reciter never attempted (the tracker is still
        // finding where he started). Flushed once the anchor is known,
        // or silently at stop() with the fallback anchor.
        pendingCheckerEvents.push(ev);
        return;
      }
      applyCheckerEvent(ev);
    }
  });

  const buildResult = (): SessionResult => {
    // Resolve the start anchor (3-run, else first-locked fallback —
    // NEVER an ambiguous first-observed word, H3) and flush any
    // checker events still buffered — silently: the take is over, the
    // per-word result below is authoritative. When the take never
    // locked, the anchor stays null unless the short-ayah fallback
    // below fires: no buffered flag is ever applied and the take
    // reports `unclear` (coverage 0) instead of being anchored on an
    // acquisition guess.
    if (anchorIndex === null) {
      // No 3-run by stop: the anchor is the first lock's clean span
      // start when there is one (a committed match — the lock itself
      // was the trust gate), the certified head's start when the
      // head rule fired, else the first-locked fallback as before.
      anchorIndex = headCertified && headCertifiedRange !== null
        ? headCertifiedRange.startIndex
        : firstLockSpan !== null
          ? Math.max(firstLockSpan.startIndex, anchorFloorIndex)
          : anchorTracker.resolveAtStop(firstLockedIndex);
    }
    flushPendingCheckerEvents(false);
    // SHORT-AYAH FALLBACK (2026-11-27, mic perfection — gap 3): a
    // take that NEVER locked has no anchor — but the model can follow
    // a 4-word ayah cleanly in `ambiguous` (per 0, conf 0.5,
    // sequential spans covering every word) without ever promoting
    // to locked: locking needs more context than a short ayah
    // provides (a hard model limit on LOCKING, not on following —
    // measured Node: 1:1 alone, 4 ambiguous events, 0 locks). When
    // the pre-lock ambiguous cover is clean for a prefix of the
    // passage and no checker flag was confirmed, that prefix WAS
    // recited: anchor at its start, its words count as observed, and
    // the take is clear. A flagged take never takes this path.
    let ambiguousFallback = false;
    if (anchorIndex === null && !everLocked) {
      const cover = ambiguousPrefixCover();
      if (cover !== null && flagged.size === 0) {
        ambiguousFallback = true;
        anchorIndex = cover.startIndex;
        for (let i = cover.startIndex; i <= cover.endIndex; i++) {
          const k = orderedKeys[i];
          if (!observed.has(k)) {
            observed.set(k, { confidence: ANCHOR_MIN_CONFIDENCE, timeMs: 0, state: 'ambiguous' });
            orderOfKey.set(k, order++);
          }
        }
      }
    }
    // Words the reciter reached, in passage order — counting ONLY expected
    // words. (FIX 2026-11-21: the tracker can follow words outside the
    // declared passage, e.g. a different ayah; those keys are not in
    // orderedKeys, so using them as "last reached" made indexOf() return -1
    // and every expected word came out "not-reached" instead of the attempt
    // being recognised as off-passage.)
    const reachedKeys = [...observed.keys()]
      .filter((k) => expectedByKey.has(k))
      .sort((a, b) => (orderOfKey.get(a) ?? 0) - (orderOfKey.get(b) ?? 0));
    const lastReached = reachedKeys.length > 0 ? reachedKeys[reachedKeys.length - 1] : null;
    const trackedElsewhere = observed.size > 0 && reachedKeys.length === 0;
    const noSpeech = observed.size === 0;
    const observedSet = new Set(reachedKeys);

    // FALSE-FLAG GRACES (measured 2026-11-21, tools/test-tilawa.mjs +
    // tools/tilawa-diag.mjs; lite AND full tiers identical). On clean
    // professional recitation the checker confirms NOTHING — every false
    // flag is a word the tracker never observed while later words were.
    // The tracker has three systematic blind spots, and a word in one of
    // them is "not reached yet" (neutral, never in the mistake log), not
    // "missed". The ANCHOR grace (A) BEATS a checker flag — the word was
    // never attempted (Mehran, 2026-11-26) — with ONE exception: a
    // confirmed skip the tracker demonstrably passed over stands even
    // before the anchor (see preAnchorFlagStands(), gap 2, 2026-11-27).
    // Graces (B) and (C) are still beaten by a checker-CONFIRMED flag,
    // as before.
    // (A) TAKE-START / MID-PAGE START — the anchor (see
    //     lib/recitation-anchor.ts): the tracker spends the first ~1-3 s
    //     in `ambiguous` state, emitting positions for WRONG passages
    //     (e.g. 7:54:29, 25:1:2) before it locks onto the declared
    //     passage — at the word the reciter actually started on, which
    //     on a mid-page start is NOT word 1. Words before the anchor
    //     were never listened to, not skipped. The boundary is the
    //     anchor when a 3-run was detected; the fallback is the first
    //     LOCKED observation at/after the start floor when the take
    //     locks at all (an `ambiguous` observation of an early word
    //     does not prove the tracker was following — it may be a
    //     wrong-passage guess, and using it as the boundary exposed
    //     1:2:2 in testing); on a single short ayah the tracker may
    //     NEVER lock at all (it follows the words in `ambiguous` at
    //     conf ~0.5 for the whole take — measured 2026-11-27: 1:1
    //     alone, 6 ambiguous events, 0 locks) — that take is now
    //     decided by the short-ayah fallback (clean ambiguous cover,
    //     no confirmed flags) instead of reporting `unclear`, and a
    //     take with no clean cover still reports `unclear` rather
    //     than being anchored on a guess (H3).
    // (B) AYAH-BOUNDARY JUMP: at an ayah boundary the tracker sometimes
    //     jumps from the previous ayah's penultimate word straight to the
    //     next ayah's first word, skipping the boundary word (e.g. 67:2:12
    //     ٱلْغَفُورُ). A last word of an ayah whose next ayah's first word
    //     WAS observed is a tracker jump, not a reciter skip.
    // (C) SHORT PARTICLE / SANDWICH: a word sandwiched between two
    //     tracked neighbours is routinely merged with them by the tracker
    //     — e.g. مِن between two observed words, or ٱللَّهِ inside the
    //     Basmala ("bismillah" runs together). On takes where the tracker
    //     DID lock, the grace is limited to 1-2 letter particles (longer
    //     words are reliable evidence when locked); on takes where it
    //     NEVER locked, any sandwiched word is graced, because ambiguous
    //     tracking is too weak to call a mid-take omission. Genuine skips
    //     of such a word are the least important words to flag, and the
    //     checker can still confirm one.
    const graced = new Set<string>();
    // (A) boundary is the resolved start anchor (3-run, else the
    // first-locked fallback, else null — see buildResult() head).
    const lockBoundary = anchorIndex;
    if (lockBoundary !== null) {
      for (let i = 0; i < lockBoundary; i++) graced.add(orderedKeys[i]);
    }
    // (D) ACQUISITION WINDOW — the first lock's dirty span, and the gap
    // between a certified head and the span start (2026-11-27, mic
    // perfection, gap 2): words the tracker consumed as acquisition
    // context without trusting them. Unproven either way — not-reached,
    // never missed via the went-past rule — unless the checker confirms
    // a skip for one of them (a flag still beats a grace, as in (B)/(C);
    // the anchor-suppression exception in the status loop below is what
    // lets such a flag through when the word also sits before the anchor).
    if (firstLockSpanDirty !== null) {
      for (let i = firstLockSpanDirty.startIndex; i <= firstLockSpanDirty.endIndex; i++) graced.add(orderedKeys[i]);
    }
    if (acquisitionGap !== null) {
      for (let i = acquisitionGap.startIndex; i <= acquisitionGap.endIndex; i++) graced.add(orderedKeys[i]);
    }
    for (let ai = 0; ai < ayahKeys.length - 1; ai++) {
      const last = ayahLastWord.get(ayahKeys[ai])!;
      const nextFirst = ayahFirstWord.get(ayahKeys[ai + 1])!;
      if (!observedSet.has(last) && observedSet.has(nextFirst)) graced.add(last);
    }
    // (C) needs the (A)/(B) graces settled first, and can chain across two
    // adjacent short words — iterate to a fixpoint (bounded, tiny).
    const maxGraceLen = everLocked ? 2 : Infinity;
    for (let pass = 0; pass < 3; pass++) {
      let changed = false;
      for (let i = 0; i < orderedKeys.length; i++) {
        const key = orderedKeys[i];
        if (observedSet.has(key) || graced.has(key)) continue;
        const normLen = expectedByKey.get(key)!.refWord.normalised.length;
        if (normLen > maxGraceLen) continue;
        const prevOk = i === 0 || observedSet.has(orderedKeys[i - 1]) || graced.has(orderedKeys[i - 1]);
        const nextOk =
          i === orderedKeys.length - 1 ||
          observedSet.has(orderedKeys[i + 1]) || graced.has(orderedKeys[i + 1]);
        if (prevOk && nextOk) {
          graced.add(key);
          changed = true;
        }
      }
      if (!changed) break;
    }

    const words: SessionWordResult[] = [];
    let correctCount = 0;
    let missedCount = 0;
    let reachedCount = 0;

    for (const key of orderedKeys) {
      const entry = expectedByKey.get(key)!;
      const [surah, ayah, word] = key.split(':').map(Number);
      const flag = flagged.get(key);
      const seen = observed.has(key);
      const keyIdx = orderedIndex.get(key) ?? 0;
      const beforeAnchor = anchorIndex !== null && keyIdx < anchorIndex;
      // A confirmed skip the tracker demonstrably passed over stands
      // even before the anchor (see preAnchorFlagStands()); every
      // other pre-anchor flag is dropped with the word itself.
      const flagApplies = flag !== undefined && (!beforeAnchor || preAnchorFlagStands(flag, keyIdx));
      let status: CoachWordStatus;
      if (beforeAnchor && !flagApplies) {
        // Never attempted — the anchor grace BEATS a checker flag (and a
        // stray observation): the reciter started after this word.
        status = 'not-reached';
      } else if (flag && flagApplies) {
        status = flag.errorClass === 'wrong_word' ? 'wrong' : 'missed';
      } else if (seen) {
        status = 'correct';
      } else if (graced.has(key)) {
        // One of the tracker blind spots above: do not call it a mistake.
        status = 'not-reached';
      } else if (lastReached !== null && (orderedIndex.get(key) ?? 0) < (orderedIndex.get(lastReached) ?? 0)) {
        // The reciter demonstrably went past this word (later words were
        // observed) without it being observed: missed.
        status = 'missed';
      } else {
        // Not observed and at/after the last observed word: the reciter
        // stopped before it — "not reached yet", never "missed".
        status = 'not-reached';
      }
      if (status !== 'not-reached') reachedCount++;
      if (status === 'correct') correctCount++;
      if (status === 'missed') missedCount++;
      words.push({
        wordIndex: entry.refWord.index,
        surah,
        ayah,
        word,
        status,
        confidence: observed.get(key)?.confidence ?? flag?.confidence,
        display: entry.refWord.display,
        // No `heard` word: Tilawa tracks positions, it does not transcribe
        // words — the checker reports phonemes, not a heard word. Never
        // invent one for the mistake log (spec §8.2).
      });
    }

    // Confidence gating (research §5 step 2.7), computed from COVERAGE of
    // the expected passage — not from an alignment of the engine's observed
    // words against themselves. (FIX 2026-11-21: the old code fed
    // alignRecitation() a "heard" list built from the EXPECTED words of the
    // observed positions, so the alignment was tautologically perfect and
    // `unclear` could never fire except on no-speech. The gate now fires
    // when under half the expected words were observed, or when under 40%
    // of reached words were correct.)
    const coverage = orderedKeys.length === 0 ? 0 : reachedKeys.length / orderedKeys.length;
    const quality = reachedCount === 0 ? 0 : correctCount / reachedCount;
    // The short-ayah fallback is clear by construction: its words were
    // followed cleanly (per <= 0.05, conf >= 0.5, sequential, no flags)
    // — the coverage gate below would otherwise call a clean 4-word
    // recitation of a 29-word passage "unclear" for being short, which
    // is the wrong question: the take is short, not unclear.
    const unclear = ambiguousFallback
      ? false
      : noSpeech || trackedElsewhere || coverage < 0.5 || quality < 0.4;
    const audioHealth = getAudioHealth();

    // Diagnostics (mic perfection, 2026-11-27): the ambiguous evidence
    // behind the head/short-ayah decisions, and the tracker's lag
    // behind real time through the take — console only, so a harness
    // (or a phone console) can prove what the adapter decided and
    // whether the model drained at real time. Logged once, at stop.
    const cover = ambiguousPrefixCover();
    console.log('[tilawa] ambiguous-summary:', JSON.stringify({
      preLockAmbiguous: preLockAmbiguous.length,
      cover: cover !== null
        ? `${orderedKeys[cover.startIndex]}..${orderedKeys[cover.endIndex]}`
        : null,
      headCertified,
      acquisitionGap: acquisitionGap !== null
        ? `${orderedKeys[acquisitionGap.startIndex]}..${orderedKeys[acquisitionGap.endIndex]}`
        : null,
      firstLockSpanDirty: firstLockSpanDirty !== null
        ? `${orderedKeys[firstLockSpanDirty.startIndex]}..${orderedKeys[firstLockSpanDirty.endIndex]}`
        : null,
      ambiguousFallback,
    }));
    console.log('[tilawa] tracker-lag:', JSON.stringify({
      firstLockLagMs,
      lastLagMs,
      maxLagMs,
      positionEvents,
      preListenAudioMs: preListenAudioMsRef,
    }));

    return {
      words,
      correctCount,
      reachedCount,
      missedCount,
      unclear,
      anchorIndex,
      anchorKey: anchorIndex !== null ? orderedKeys[anchorIndex] : null,
      noSpeech,
      micHeardAudio: audioHealth.everAudible,
      audioHealth,
      trackedElsewhere,
      // Pre-anchor confirmed mistakes were never attempted: drop them
      // from the log (the coach's by-type counts and confirmed flags
      // read this array) — EXCEPT a confirmed skip the tracker
      // demonstrably passed over (see preAnchorFlagStands()). Off-passage
      // locations have no passage index and are kept — the anchor
      // cannot judge them.
      mistakes: session.mistakes().filter((m) => {
        const idx = orderedIndex.get(wordKey(m.location));
        return idx === undefined || anchorIndex === null || idx >= anchorIndex || (idx !== undefined && preAnchorFlagStands(m, idx));
      }),
      durationMs: session.now(),
    };
  };

  return {
    async startMic(prepared?: PreparedMicCapture) {
      // VAD OFF, deliberately and explicitly: Tilawa's energy VAD
      // (DEFAULTS.vad is false) would gate audio before the model, and
      // its floor -60 dBFS + 12 dB margin trigger (-48 dBFS) drops quiet
      // recitation outright. With the VAD off every frame reaches the
      // tracker, and quiet speech still has a chance to lock. Voice
      // detection for the UI lives in app/hifz/lib/vad.ts (AdaptiveVad) —
      // display-only, never a gate on the audio path.
      preparedContext = prepared?.context ?? null;
      // TAP BUFFER (2026-11-27 — gap 1): feed the opening audio the
      // tap captured while the engine/session was still starting. The
      // push is fire-and-forget and happens BEFORE listen(), so the
      // buffer is queued strictly before the first live chunk (call
      // order — see the buffer note above); listen() then starts
      // immediately, with no await on the drain. A short buffer
      // (< TAP_BUFFER_MIN_MS, the warm-tap case) is discarded
      // instead: the first lock's span already recovers those words.
      // Any drain failure leaves the take exactly as it was.
      let preListenAudioMs = 0;
      if (prepared) {
        const tapBuffer = tapBuffers.get(prepared);
        if (tapBuffer) {
          const elapsedMs = tapBuffer.elapsedMs();
          console.log('[tilawa] tap-buffer-decision:', JSON.stringify({ elapsedMs }));
          if (elapsedMs >= TAP_BUFFER_MIN_MS) {
            const drainStart = Date.now();
            const drained = await tapBuffer.drain().catch(() => null);
            if (drained && drained.durationMs >= TAP_BUFFER_MIN_MS) {
              preListenAudioMs = drained.durationMs;
              console.log('[tilawa] tap-buffer:', JSON.stringify({
                ms: drained.durationMs,
                samples: drained.samples.length,
                sampleRate: drained.sampleRate,
                truncated: drained.truncated,
                drainMs: Date.now() - drainStart,
              }));
              // Fire-and-forget: queued before any live chunk.
              void session.pushAudio(drained.samples, drained.sampleRate).catch(() => undefined);
            } else {
              console.log('[tilawa] tap-buffer-drain-null:', JSON.stringify({ elapsedMs, drainMs: Date.now() - drainStart }));
            }
          } else {
            console.log('[tilawa] tap-buffer-discarded:', JSON.stringify({ elapsedMs }));
            tapBuffer.discard();
          }
        } else {
          console.log('[tilawa] tap-buffer-missing:', JSON.stringify({}));
        }
      }
      listenStartWallMs = Math.round(performance.now());
      preListenAudioMsRef = preListenAudioMs;
      console.log('[tilawa] listen-start:', JSON.stringify({ wallMs: Math.round(performance.now()) }));
      mic = await tilawa.listen(session, {
        vad: false,
        onLevel: recordLevel,
        ...(prepared ? { prepared: prepared.handle } : {}),
      });
    },
    async pushAudio(samples: Float32Array, sampleRate: number) {
      await session.pushAudio(samples, sampleRate);
    },
    getAudioHealth,
    async pause() {
      if (paused || stopped) return;
      paused = true;
      // Suspend the context: the worklet stops pulling frames, so no
      // audio reaches the tracker and the session clock (audio-delivered
      // ms) stops advancing. The tracker itself has no pause call.
      if (preparedContext && preparedContext.state === 'running') {
        await preparedContext.suspend().catch(() => undefined);
      }
    },
    async resume() {
      if (!paused || stopped) return;
      paused = false;
      if (preparedContext && preparedContext.state === 'suspended') {
        await preparedContext.resume().catch(() => undefined);
      }
    },
    get paused() {
      return paused;
    },
    stop(): Promise<SessionResult> {
      if (stopPromise) return stopPromise;
      stopped = true;
      stopPromise = (async () => {
        // A paused take must be resumed first so mic.stop() can drain
        // the session cleanly.
        if (paused) {
          paused = false;
          if (preparedContext && preparedContext.state === 'suspended') {
            await preparedContext.resume().catch(() => undefined);
          }
        }
        if (mic) {
          await mic.stop();
          mic = null;
        } else {
          await session.end();
        }
        return buildResult();
      })();
      return stopPromise;
    },
    abort(): Promise<void> {
      if (abortPromise) return abortPromise;
      // A take already being checked ends with a result; abandoning it
      // mid-drain would corrupt that result — nothing to abort.
      if (stopPromise) return Promise.resolve();
      stopped = true;
      abortPromise = (async () => {
        if (mic) {
          // mic.stop() ends the session and closes the AudioContext.
          await mic.stop().catch(() => undefined);
          mic = null;
        } else {
          await session.end().catch(() => undefined);
        }
        session.dispose();
      })();
      return abortPromise;
    },
    dispose() {
      stopped = true;
      if (mic) void mic.stop().catch(() => undefined);
      session.dispose();
    },
  };
}
