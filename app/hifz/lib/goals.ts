// app/hifz/lib/goals.ts — the stored-goal model (Phase 4).
//
// Extracted verbatim from GoalsClient (the old progress hub's goal
// store) so the reader dashboard and the hub write the SAME shape to
// the SAME key (`ili_goals_v1`). A goal written by the reader's simple
// "Start a New Goal" modal must load in the hub, and vice versa.
//
// Goal model: Goal Name + Action (Review / Memorize / Recite) + Range
// + Portion + Schedule; flexible ("all") vs portion-based; multiple
// ranges; reverse-order; recurring goals. Stored on this device only.
// All free — no limits on how many goals you set.

export type GoalAction = 'Review' | 'Memorize' | 'Recite';

export interface Goal {
  id: string;
  name: string;
  action: GoalAction;
  range: string;
  portion: string;
  schedule: string;
  shape: 'flexible' | 'portion';
  reverse: boolean;
  recurring: boolean;
  createdAt: string;
  /** 0..1 per session day, for the session bars (legacy — Stage 6
   *  computes the bars from real practice instead; kept so old saves
   *  still load). */
  sessions: number[];
  /** Stage 6 (§17): opt-in in-app reminder for this goal. */
  remind?: boolean;
  /** "HH:MM" local time the reminder becomes due. */
  remindTime?: string;
  /** Optional deadline (YYYY-MM-DD) for flexible goals. */
  deadline?: string;
  /** Archived goals hide from Active / Today's / Upcoming; they live
   *  in Archived. */
  archived?: boolean;
}

export const GOALS_KEY = 'ili_goals_v1';

/** All stored goals, newest first. Never throws. */
export function loadGoals(): Goal[] {
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Goal[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Persist the goal list. Never throws. */
export function saveGoals(goals: Goal[]): void {
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  } catch {
    /* storage failure is never fatal */
  }
}

/** A unique id for a new goal (module-level: id generation is impure). */
export function newGoalId(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/**
 * A goal from just a name — the reader's simple "Start a New Goal"
 * modal (Phase 4). Defaults match the hub's most common goal: memorize
 * the whole Quran, a page a day, every day, flexible, recurring.
 */
export function createSimpleGoal(name: string): Goal {
  return {
    id: newGoalId(),
    name: name.trim(),
    action: 'Memorize',
    range: 'Whole Quran (114 surahs)',
    portion: '1 page a day',
    schedule: 'Every day',
    shape: 'flexible',
    reverse: false,
    recurring: true,
    createdAt: new Date().toISOString(),
    sessions: [],
  };
}

/** Active (non-archived) goals, newest first. */
export function activeGoals(goals: Goal[]): Goal[] {
  return goals.filter((g) => !g.archived);
}
