/**
 * app/hifz/lib/vad.ts — adaptive voice-activity detection for the coach UI.
 *
 * DISPLAY-ONLY VAD — it NEVER gates audio to the recognition engine.
 *
 * WHY THIS EXISTS (Stage 3, 2026-11-22 investigation): the coach's old
 * "voice detected" flag was a single fixed threshold — one onLevel sample
 * louder than -50 dBFS. That misfires both ways: a door tap flips it, and
 * quiet recitation (a phone held at arm's length, a soft voice, a phone
 * mic with low gain) never reaches -50 dBFS, so the UI tells a reciting
 * user it hears nothing — while the tracker may in fact be following the
 * words. The same fixed threshold also cannot tell room noise from
 * speech, so it cannot say anything useful about background noise.
 *
 * Tilawa's own energy VAD (`@tilawa/core` `Vad`: floor -60 dBFS, margin
 * 12 dB, hang 4000 ms) is NOT the answer here either: `DEFAULTS.vad` is
 * `false`, so `listen()` runs with the VAD OFF and every frame reaches
 * the model — deliberately. Turning Tilawa's VAD on would DROP quiet
 * recitation before the model ever sees it, which is strictly worse for
 * recognition. This module is therefore a separate, UI-side VAD with its
 * own, more sensitive settings, and it only drives status text / the
 * meter — never the audio path.
 *
 * HOW THE FLOOR ADAPTS: the noise floor is the 10th percentile of the
 * last ~5 seconds of levels — i.e. the room tone, not the speech. A
 * quiet room (floor about -65) therefore detects speech down to about
 * -57 dBFS (floor + 8 dB margin), while a steadily noisy room (floor
 * about -50) needs speech above about -42 dBFS: steady noise alone
 * never counts as a voice, because the floor rises to meet it. The
 * floor is deliberately NOT an exponential average that chases loud
 * frames (Tilawa's shape): that would let continuous speech drag the
 * floor up until the speech itself fell below threshold.
 *
 * BEHAVIOUR:
 *  - Threshold = floor + margin. Margin defaults to 8 dB (Tilawa uses
 *    12 dB): quiet speech ~8 dB above the room floor counts, where
 *    Tilawa's gate would need ~12 dB.
 *  - Minimum speech duration (default 120 ms above threshold) before
 *    `speaking` latches: a single loud transient (tap, door) does not
 *    count as a voice.
 *  - Hangover (default 1200 ms): natural pauses between words do not
 *    flick the status back to "not speaking" mid-ayah. (Shorter than
 *    Tilawa's 4000 ms tracker hangover on purpose: this is a UI light,
 *    not the tracker's audio gate.)
 *  - `voiceDetected` latches true the first time speech is confirmed
 *    and stays true for the take: once the mic has heard the user, the
 *    UI never goes back to claiming it heard nothing.
 *
 * HONEST LIMIT: in a loud room, speech quieter than the room noise +
 * 8 dB is not detected as a voice by energy alone — nothing can tell it
 * apart from the noise. That is a display limit only: the tracker still
 * receives the audio and may follow it.
 *
 * FEEDING: call `push(db, dtMs)` with the same live dBFS readings the
 * coach already gets from Tilawa's `onLevel` (about one per 20 ms), or
 * from the diagnostics page's AnalyserNode loop (one per animation
 * frame). No audio samples are needed — dBFS in, verdict out — so the
 * class is pure logic and unit-testable in Node with no DOM.
 *
 * PRIVACY: no audio is stored or sent anywhere; only dBFS numbers pass
 * through this class.
 */

export interface AdaptiveVadOptions {
  /** dB above the adaptive floor that counts as speech. Default 8. */
  marginDb?: number;
  /** Starting noise floor, dBFS, used before any levels arrive. Default -60. */
  initialFloorDb?: number;
  /** ms continuously above threshold before `speaking` latches. Default 120. */
  minSpeechMs?: number;
  /** ms of below-threshold audio tolerated before `speaking` drops. Default 1200. */
  hangMs?: number;
  /** How many recent readings the floor window holds (~5 s at 20 ms). Default 250. */
  windowSize?: number;
}

export interface VadReading {
  /** True while speech is active (including hangover). */
  speaking: boolean;
  /** Latched: true once speech was confirmed at any point in this take. */
  voiceDetected: boolean;
  /** Current adaptive noise floor, dBFS. */
  floorDb: number;
  /** Current speech threshold (floor + margin), dBFS. */
  thresholdDb: number;
}

export class AdaptiveVad {
  private readonly margin: number;
  private readonly minSpeechMs: number;
  private readonly hangMs: number;
  private readonly initialFloorDb: number;
  private readonly windowSize: number;
  /** Recent dBFS readings, oldest first (ring, capped at windowSize). */
  private readonly window: number[] = [];
  private floorDb: number;
  private speaking = false;
  private voiceDetected = false;
  /** ms continuously above threshold (resets on a quiet frame). */
  private loudMs = 0;
  /** ms continuously below threshold while speaking. */
  private silentMs = 0;

  constructor(opts: AdaptiveVadOptions = {}) {
    this.margin = opts.marginDb ?? 8;
    this.initialFloorDb = opts.initialFloorDb ?? -60;
    this.floorDb = this.initialFloorDb;
    this.minSpeechMs = opts.minSpeechMs ?? 120;
    this.hangMs = opts.hangMs ?? 1200;
    this.windowSize = opts.windowSize ?? 250;
  }

  /** Feed one dBFS reading covering `dtMs` milliseconds. */
  push(db: number, dtMs: number): VadReading {
    this.window.push(db);
    if (this.window.length > this.windowSize) this.window.shift();
    // Floor = 10th percentile of the recent window: the room tone. A
    // sorted copy of ≤250 numbers, 50×/s, is trivially cheap. Until the
    // window has a few readings, use its minimum so the floor settles
    // within ~200 ms instead of sitting at the initial value.
    const sorted = [...this.window].sort((a, b) => a - b);
    const idx = Math.max(0, Math.floor(sorted.length * 0.1) - 1);
    this.floorDb = sorted[idx] ?? this.initialFloorDb;
    const threshold = this.floorDb + this.margin;
    const loud = db > threshold;
    if (loud) {
      this.silentMs = 0;
      this.loudMs += dtMs;
      if (!this.speaking && this.loudMs >= this.minSpeechMs) {
        this.speaking = true;
        this.voiceDetected = true;
      }
    } else {
      this.loudMs = 0;
      if (this.speaking) {
        this.silentMs += dtMs;
        if (this.silentMs > this.hangMs) this.speaking = false;
      }
    }
    return {
      speaking: this.speaking,
      voiceDetected: this.voiceDetected,
      floorDb: this.floorDb,
      thresholdDb: threshold,
    };
  }

  /** Current state without feeding a new reading. */
  get state(): VadReading {
    return {
      speaking: this.speaking,
      voiceDetected: this.voiceDetected,
      floorDb: this.floorDb,
      thresholdDb: this.floorDb + this.margin,
    };
  }

  /** Start a fresh take: window cleared, latch cleared, floor initial. */
  reset(): void {
    this.window.length = 0;
    this.floorDb = this.initialFloorDb;
    this.speaking = false;
    this.voiceDetected = false;
    this.loudMs = 0;
    this.silentMs = 0;
  }
}
