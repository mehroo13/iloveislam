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
   * Passage index of the start anchor (first word of the first run of
   * >= 3 consecutive trustworthy locked observations, or the
   * first-locked fallback at stop), or null when the take never
   * locked — logged by the UI so a phone test can prove where the
   * anchor landed. 0 on a from-the-top take only when the tracker
   * locks onto the head itself; on clean audio the first lock lands
   * 1–9 s in, so the anchor is usually a few words past the true
   * start and the words before it are `not-reached`, never `missed`.
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
 * Prepare the microphone synchronously inside the user's tap, WITHOUT
 * waiting for the model: needs only the web module (warmed by
 * `warmWebModule()` or by an earlier `loadEngine()`). Throws when the
 * module is not warm yet — the caller falls back to awaiting the
 * engine first (H5, 2026-11-27: the old path awaited `ensureEngine()`
 * before preparing, so a cold first tap prepared outside the gesture
 * and the AudioContext could stay suspended with zero frames).
 */
export function prepareMicrophoneStandalone(): PreparedMicCapture {
  if (!webModule) {
    throw new Error('Recitation engine module is not loaded yet.');
  }
  const handle = webModule.prepareMicrophone();
  return {
    handle,
    stream: handle.stream,
    context: handle.context,
    release: () => handle.release(),
  };
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
   * Until the anchor is known, checker events are BUFFERED (never
   * emitted, never recorded): a flag fired while the tracker is still
   * finding where he started may be about words he never attempted.
   * Once the anchor is known the buffer is flushed — flags at/after it
   * are applied, flags before it are dropped. At stop() the anchor is
   * resolved with its fallback and any still-buffered events are
   * flushed silently (recorded for buildResult, not re-emitted live).
   *
   * HARDENED 2026-11-27 (H1/H3): the run ignores locks below the
   * floor, locks the tracker is less than half-sure of, and locks in
   * the first 500 ms (see lib/recitation-anchor.ts); the stop-time
   * fallback is the first locked word at/after the floor, never an
   * ambiguous guess — a take that never locks has NO anchor and
   * reports `unclear`. The anchor index is logged when it lands (and
   * returned in SessionResult), so the next phone test can prove
   * where it landed.
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
    if (idx !== undefined && anchorIndex !== null && idx < anchorIndex) return;
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
      // Feed the start anchor: locked observations only — an `ambiguous`
      // observation never starts or breaks the run (see
      // lib/recitation-anchor.ts). The moment the anchor is known,
      // release the buffered checker events (flags at/after it only).
      // The anchor index is logged: without it, no phone test can
      // prove whether the anchor landed on his start word or on the
      // passage head (H1 — the first anchor fix was unverifiable).
      if (idx !== undefined) anchorTracker.observe(idx, ev.state, best.confidence, ev.timeMs);
      if (anchorIndex === null && anchorTracker.anchor !== null) {
        anchorIndex = anchorTracker.anchor;
        console.log('[tilawa] anchor:', {
          wallMs: Math.round(performance.now()),
          anchorIndex,
          anchorKey: orderedKeys[anchorIndex],
          floorIndex: anchorFloorIndex,
          firstLockedIndex,
          firstObservedIndex,
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
    // locked, the anchor stays null: no buffered flag is ever applied
    // and the take reports `unclear` (coverage 0) instead of being
    // anchored on an acquisition guess.
    if (anchorIndex === null) {
      anchorIndex = anchorTracker.resolveAtStop(firstLockedIndex);
    }
    flushPendingCheckerEvents(false);
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
    // never attempted (Mehran, 2026-11-26). Graces (B) and (C) are still
    // beaten by a checker-CONFIRMED flag, as before.
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
    //     alone, 6 ambiguous events, 0 locks), so there the anchor
    //     is null and the whole take reports `unclear` rather than
    //     being anchored on a guess (H3).
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
      let status: CoachWordStatus;
      if (anchorIndex !== null && (orderedIndex.get(key) ?? 0) < anchorIndex) {
        // Never attempted — the anchor grace BEATS a checker flag (and a
        // stray observation): the reciter started after this word.
        status = 'not-reached';
      } else if (flag) {
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
    const unclear = noSpeech || trackedElsewhere || coverage < 0.5 || quality < 0.4;
    const audioHealth = getAudioHealth();

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
      // read this array). Off-passage locations have no passage index
      // and are kept — the anchor cannot judge them.
      mistakes: session.mistakes().filter((m) => {
        const idx = orderedIndex.get(wordKey(m.location));
        return idx === undefined || anchorIndex === null || idx >= anchorIndex;
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
