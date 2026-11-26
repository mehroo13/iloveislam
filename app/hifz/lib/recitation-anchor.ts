/**
 * app/hifz/lib/recitation-anchor.ts — Where did the reciter actually start?
 *
 * Pure functions + one tiny stateful tracker. No browser APIs, no engine
 * imports: safe to import from client components, server components and
 * Node test scripts alike.
 *
 * THE PROBLEM (Mehran, 2026-11-26): on the Mushaf Reader, opening the mic
 * and starting from the MIDDLE of a page still marked from the TOP of the
 * page and marked him wrong. The passage is always declared from its first
 * ayah (Tilawa's MemorizationPassage is ayah-granular only — there is NO
 * word-level start position in the API), so the tracker always starts
 * expecting word 1. Tilawa is a sequential tracker, not a transcriber: on
 * a mid-page start it spends ~1-3 s in `ambiguous` state before locking
 * onto the declared passage at the mid-page word. It DOES find him — but
 * in that window the checker can CONFIRM omitted_word / skipped_passage
 * for the un-recited head words, and the old buildResult() grace let a
 * checker-CONFIRMED flag beat every grace, so the head words stayed
 * `missed` live, in the final result, the Mistakes modal, the saved
 * session and the test score.
 *
 * THE FIX — the anchor: the first word of the first run of >=
 * ANCHOR_RUN_LENGTH consecutive LOCKED observations (consecutive passage
 * indices, in observation order, ignoring intervening `ambiguous`
 * observations). Words before the anchor were never attempted: they are
 * `not-reached`, never `missed`/`wrong`, live or at stop — the anchor
 * grace BEATS checker flags (a deliberate change to the old grace (A)
 * in lib/tilawa.ts). From-the-top start: the anchor is passage index 0,
 * so nothing is suppressed and behaviour is identical.
 *
 * Fallbacks, used only when no 3-run exists by stop: the first locked
 * word (2026-11-27: NEVER an `ambiguous` first-observed word — a
 * never-locking take has no anchor at all, so its words stay
 * `not-reached` and the take reports `unclear` instead of being
 * silently anchored on an acquisition guess).
 *
 * HARDENING (Mehran, 2026-11-27 — the starting line still came back
 * missed after the first anchor landed, so the anchor itself was
 * re-diagnosed from scratch and the holes below were found in the
 * wild, then measured headless against the real engine on clean
 * professional audio — tools/mic-calib, 2026-11-27):
 *  - Floor: the anchor may not land before the floor — the first word
 *    of the ayah BEFORE the ayah the reciter started on (one ayah of
 *    slack for a half-visible ayah above the recorded topmost one).
 *    A lock onto the passage head can then never become the anchor.
 *    The floor can only turn would-be-correct words into
 *    `not-reached`, never into `missed` (pre-anchor words are
 *    protected, and a lock below the floor is ignored entirely).
 *  - Confidence: a locked observation only joins the run when the
 *    tracker is at least half-sure of it (confidence >= 0.5).
 *    Measured: genuine locks on clean audio run 0.68–1.00, while the
 *    tracker's own lock floor is 0.08 — a 0.1 lock is the tracker
 *    guessing, not knowing. A take whose locks are all below the
 *    floor still anchors at stop via the first-locked fallback.
 *  - Time: a lock in the first 500 ms of the session never joins the
 *    run (measured first genuine locks: 1.9 s mid-passage, 9.0 s
 *    from the top — a sub-500 ms lock is acquisition noise). A
 *    genuine fast lock only restarts its run one word later.
 *  - Logging: the adapter logs the anchor index when it lands, so the
 *    next phone test can prove where it landed instead of assuming.
 */

/** Consecutive locked observations needed to declare the anchor. */
export const ANCHOR_RUN_LENGTH = 3;

/**
 * Minimum tracker confidence for a locked observation to join the
 * anchor run (see hardening note above). `PositionCandidate.confidence`
 * is `fit * separation`, 0..1; Tilawa itself locks at 0.08.
 */
export const ANCHOR_MIN_CONFIDENCE = 0.5;
/** Session-audio ms before which a lock never joins the anchor run. */
export const ANCHOR_MIN_TIME_MS = 500;

/** One tracker observation, reduced to what the anchor needs. */
export interface AnchorObservation {
  /** 0-based index of the word in passage order. */
  index: number;
  /** Tracker state for this observation ('locked' / 'ambiguous' / …). */
  state: string;
  /** Tracker confidence 0..1 (`PositionCandidate.confidence`), when known. */
  confidence?: number;
  /** Session-audio clock ms of the observation, when known. */
  timeMs?: number;
}

/** Options for AnchorTracker (all optional; defaults = the hardening above). */
export interface AnchorTrackerOptions {
  /**
   * Passage index the anchor may not land before — the first word of
   * the ayah before the reciter's start ayah (0 = passage head, i.e.
   * no floor, as the coach uses). Locks below the floor are ignored.
   */
  floorIndex?: number;
  /** Minimum confidence for a locked observation to join the run. */
  minConfidence?: number;
  /** Session-audio ms before which a lock never joins the run. */
  minTimeMs?: number;
}

/**
 * Stateful anchor detector, fed one position observation at a time in
 * arrival order by the engine adapter (lib/tilawa.ts).
 *
 * - Non-'locked' observations are ignored entirely: an `ambiguous`
 *   observation between two locked ones does not break the run, and an
 *   `ambiguous` observation of an early word never starts one.
 * - A locked observation at the next consecutive index extends the
 *   current run; any other locked index (a repeat, a jump, a step back)
 *   restarts the run at that word.
 * - Once the anchor is set it never moves: later observations — a
 *   re-lock further in, a jump back — cannot drag it.
 */
export class AnchorTracker {
  private runStart: number | null = null;
  private runLength = 0;
  private prevIndex: number | null = null;
  private detected: number | null = null;
  private readonly floorIndex: number;
  private readonly minConfidence: number;
  private readonly minTimeMs: number;

  constructor(opts: AnchorTrackerOptions = {}) {
    this.floorIndex = opts.floorIndex ?? 0;
    this.minConfidence = opts.minConfidence ?? ANCHOR_MIN_CONFIDENCE;
    this.minTimeMs = opts.minTimeMs ?? ANCHOR_MIN_TIME_MS;
  }

  /** Passage index of the anchor once detected, else null. */
  get anchor(): number | null {
    return this.detected;
  }

  /** Feed one position observation (arrival order). */
  observe(index: number, state: string, confidence?: number, timeMs?: number): void {
    if (this.detected !== null) return;
    if (state !== 'locked') return;
    // Hardening (2026-11-27): a lock below the start floor, a
    // low-confidence lock, or a lock in the first 500 ms of the
    // session never starts or extends the run — any of them may be
    // acquisition noise, and none of them may become the anchor.
    // (An observation without confidence/time — e.g. a replayed
    // sequence — skips only the check it cannot run.)
    if (index < this.floorIndex) return;
    if (confidence !== undefined && confidence < this.minConfidence) return;
    if (timeMs !== undefined && timeMs < this.minTimeMs) return;
    if (this.prevIndex !== null && index === this.prevIndex + 1) {
      this.runLength += 1;
    } else {
      this.runStart = index;
      this.runLength = 1;
    }
    this.prevIndex = index;
    if (this.runLength >= ANCHOR_RUN_LENGTH) {
      this.detected = this.runStart;
    }
  }

  /**
   * Resolve the anchor at stop, when no 3-run was ever detected: the
   * first locked word at/after the floor, else null — NEVER the first
   * observed word (2026-11-27, H3: an `ambiguous` acquisition guess
   * must not become the anchor). A take with no trustworthy lock has
   * no anchor: its words stay `not-reached` and the take reports
   * `unclear`. Memoised — the resolved anchor is the anchor from then on.
   */
  resolveAtStop(firstLockedIndex: number | null): number | null {
    if (this.detected !== null) return this.detected;
    this.detected = firstLockedIndex ?? null;
    return this.detected;
  }
}

/**
 * Stateless version of the same rule, over a whole observation sequence:
 * the anchor for a recorded take, or the stop-time fallback. Used by the
 * Node test (tools/test-recitation-anchor.mjs) and anywhere a recorded
 * sequence needs re-playing. The adapter uses AnchorTracker live.
 */
export function detectAnchor(
  observations: AnchorObservation[],
  firstLockedIndex: number | null,
  opts: AnchorTrackerOptions = {},
): number | null {
  const tracker = new AnchorTracker(opts);
  for (const obs of observations) tracker.observe(obs.index, obs.state, obs.confidence, obs.timeMs);
  return tracker.resolveAtStop(firstLockedIndex);
}
