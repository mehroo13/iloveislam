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
 * word, else the first observed word (the old grace-(A) boundary — e.g.
 * a single short ayah the tracker follows in `ambiguous` the whole take
 * and never locks on).
 */

/** Consecutive locked observations needed to declare the anchor. */
export const ANCHOR_RUN_LENGTH = 3;

/** One tracker observation, reduced to what the anchor needs. */
export interface AnchorObservation {
  /** 0-based index of the word in passage order. */
  index: number;
  /** Tracker state for this observation ('locked' / 'ambiguous' / …). */
  state: string;
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

  /** Passage index of the anchor once detected, else null. */
  get anchor(): number | null {
    return this.detected;
  }

  /** Feed one position observation (arrival order). */
  observe(index: number, state: string): void {
    if (this.detected !== null) return;
    if (state !== 'locked') return;
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
   * first locked word, else the first observed word (the old grace-(A)
   * boundary). Returns null when nothing was ever observed. Memoised —
   * the resolved anchor is the anchor from then on.
   */
  resolveAtStop(
    firstLockedIndex: number | null,
    firstObservedIndex: number | null,
  ): number | null {
    if (this.detected !== null) return this.detected;
    this.detected = firstLockedIndex ?? firstObservedIndex ?? null;
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
  firstObservedIndex: number | null,
): number | null {
  const tracker = new AnchorTracker();
  for (const obs of observations) tracker.observe(obs.index, obs.state);
  return tracker.resolveAtStop(firstLockedIndex, firstObservedIndex);
}
