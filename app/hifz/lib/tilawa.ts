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
 *    `unavailable` / `insecure-context`).
 *  - `session.mistakes()` — confirmed mistakes at the end of a take.
 *
 * MAPPING TO THE COACH'S WORD MODEL (spec §3/§8):
 *  - correct: a word the tracker observed (locked position) and the checker
 *    never flagged.
 *  - wrong: checker `wrong_word` at that location ("Check this word" in UI).
 *  - missed: checker `omitted_word` / `skipped_passage`, or a word the
 *    reciter never reached while later words were observed.
 *  - not-reached: words after the last observed word (partial recitation —
 *    research §5 step 2.6). Never shown as missed.
 *  - The adapter NEVER emits tajweed labels, scores or rule names. Tilawa's
 *    pronunciation error classes exist in the engine but are unsupported in
 *    v1 (`capabilities.unsupported`) and are never surfaced.
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
import type { Microphone } from '@tilawa/core/web';
import { splitWords } from './alignment';

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
  /** True when no speech was detected at all. */
  noSpeech: boolean;
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

export interface StartSessionOptions {
  surah: number;
  fromAyah: number;
  toAyah: number;
  /** Expected text, one entry per ayah in the range. */
  expected: ExpectedAyah[];
  /** Live word events as the tracker follows the recitation. */
  onWord?: (e: WordEvent) => void;
  /** Live mic level in dBFS (about every 20 ms) for the level meter. */
  onLevel?: (db: number) => void;
  /** Fired when the tracker state changes (acquiring/locked/lost). */
  onTrackerState?: (state: string) => void;
}

export interface RecitationSession {
  /** Start the microphone into this session. Rejects with MicrophoneError. */
  startMic(): Promise<void>;
  /** Feed audio directly (file-driven scoring / tests). Any sample rate. */
  pushAudio(samples: Float32Array, sampleRate: number): Promise<void>;
  /**
   * Stop (mic or file), drain the engine and decide every open mistake.
   * Returns the full per-word result. Idempotent.
   */
  stop(): Promise<SessionResult>;
  dispose(): void;
}

export interface RecitationEngine {
  readonly tier: string;
  readonly modelId: string;
  readonly modelVersion: string | null;
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
 * Load the engine on demand. Dynamic import: `@tilawa/core/web` (and with
 * it `onnxruntime-web`) is fetched only when this function runs — never in
 * the first-paint bundle.
 */
export async function loadEngine(opts: LoadEngineOptions = {}): Promise<RecitationEngine> {
  const tier: EngineTier = opts.tier ?? 'auto';
  // Dynamic import — the only place the engine enters the bundle.
  const { createTilawa } = await import('@tilawa/core/web');
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

  // Live state, updated from position + checker events.
  const observed = new Map<string, { confidence: number; timeMs: number }>();
  const flagged = new Map<string, CheckerEvent>();
  const orderOfKey = new Map<string, number>();
  let order = 0;
  let trackerState = 'acquiring';
  let mic: Microphone | null = null;
  let stopped = false;
  let stopPromise: Promise<SessionResult> | null = null;

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

  session.subscribe((event: EngineEvent) => {
    if (event.type === 'position') {
      const ev = event as PositionEvent;
      if (ev.state !== trackerState) {
        trackerState = ev.state;
        opts.onTrackerState?.(ev.state);
      }
      const best = ev.observed[0];
      if (!best) return;
      const key = wordKey(best.word);
      if (!observed.has(key)) {
        observed.set(key, { confidence: best.confidence, timeMs: ev.timeMs });
        orderOfKey.set(key, order++);
      }
      // A word the tracker is locked on, with no checker flag, is correct
      // so far. Live highlight only; the final result is decided at stop().
      if (!flagged.has(key) && ev.state === 'locked') {
        emitWord(best.word, 'correct', best.confidence);
      }
    } else if (event.type === 'checker') {
      const ev = event as CheckerEvent;
      if (ev.state === 'confirmed') {
        flagged.set(wordKey(ev.location), ev);
        emitWord(
          ev.location,
          ev.errorClass === 'wrong_word' ? 'wrong' : 'missed',
          ev.confidence,
        );
      } else if (ev.state === 'resolved' || ev.state === 'uncertain') {
        // Self-correction: the reciter fixed it, or the audio was too unclear
        // to judge. Never count it as a mistake.
        if (flagged.get(wordKey(ev.location))?.id === ev.id) {
          flagged.delete(wordKey(ev.location));
          emitWord(ev.location, 'correct', ev.confidence);
        }
      }
    }
  });

  const buildResult = (): SessionResult => {
    // Passage order: ayahs in range order, words in index order.
    const orderedKeys = [...expectedByKey.keys()].sort((a, b) => {
      const [sa, aa, wa] = a.split(':').map(Number);
      const [sb, ab, wb] = b.split(':').map(Number);
      return sa - sb || aa - ab || wa - wb;
    });
    const orderedIndex = new Map(orderedKeys.map((k, i) => [k, i]));

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
      if (flag) {
        status = flag.errorClass === 'wrong_word' ? 'wrong' : 'missed';
      } else if (seen) {
        status = 'correct';
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

    return {
      words,
      correctCount,
      reachedCount,
      missedCount,
      unclear,
      noSpeech,
      trackedElsewhere,
      mistakes: session.mistakes(),
      durationMs: session.now(),
    };
  };

  return {
    async startMic() {
      mic = await tilawa.listen(session, {
        onLevel: opts.onLevel,
      });
    },
    async pushAudio(samples: Float32Array, sampleRate: number) {
      await session.pushAudio(samples, sampleRate);
    },
    stop(): Promise<SessionResult> {
      if (stopPromise) return stopPromise;
      stopped = true;
      stopPromise = (async () => {
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
    dispose() {
      stopped = true;
      if (mic) void mic.stop().catch(() => undefined);
      session.dispose();
    },
  };
}
