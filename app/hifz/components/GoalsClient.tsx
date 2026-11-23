// app/hifz/components/GoalsClient.tsx — Smart goals (spec §22) + Stage 6 (§17).
// Intention model: Goal Name + Action (Review / Memorize / Recite) + Range
// + Portion + Schedule; flexible ("all") vs portion-based; multiple ranges;
// reverse-order; recurring goals; auto daily plan; session bars. Stored on
// this device only. All free — no limits on how many goals you set.
//
// Stage 6 (§17): goal progress is REAL, computed from the stored ayah
// records — "X of Y ayahs in this range memorised" plus the last 7 days
// of practice in that range. A goal with no practice yet says so; it never
// shows red "missed" bars for days before the goal existed. One-tap
// templates cover the six goal kinds in the brief. Reminders are OPT-IN
// per goal and IN-APP ONLY: when a reminded goal is due and the user
// opens this page without having practised today, a banner shows. The app
// sends no push notifications and never claims to.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ALL_SURAHS } from '../surahs';
import { getJuz } from '../juz';
import { loadProgress, ayahsPractisedOn, localDateString, type HifzProgress } from '../progress';
import { useT } from '../lib/i18n';

type GoalAction = 'Review' | 'Memorize' | 'Recite';

interface Goal {
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
  /** 0..1 per session day, for the session bars (legacy — Stage 6 computes
   *  the bars from real practice instead; kept so old saves still load). */
  sessions: number[];
  /** Stage 6 (§17): opt-in in-app reminder for this goal. */
  remind?: boolean;
  /** "HH:MM" local time the reminder becomes due. */
  remindTime?: string;
  /** Optional deadline (YYYY-MM-DD) for flexible goals. */
  deadline?: string;
  /** Archived goals hide from Active / Today's / Upcoming; they live in Archived. */
  archived?: boolean;
}

const GOALS_KEY = 'ili_goals_v1';

function loadGoals(): Goal[] {
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Goal[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * The ayahs a goal's range covers, as "surah:ayah" keys — from the real
 * surah and juz tables, never invented boundaries. Null when the range
 * cannot be measured (an old free-text range): the card says so honestly.
 */
function rangeAyahKeys(range: string): string[] | null {
  if (range.startsWith('Surah ')) {
    const s = ALL_SURAHS.find((x) => x.name === range.slice(6));
    if (!s) return null;
    const out: string[] = [];
    for (let a = 1; a <= s.ayahCount; a++) out.push(`${s.id}:${a}`);
    return out;
  }
  if (range === 'Juz 30' || range === 'Juz 29') {
    const j = getJuz(range === 'Juz 30' ? 30 : 29);
    if (!j) return null;
    const out: string[] = [];
    for (const seg of j.segments) {
      for (let a = seg.fromAyah; a <= seg.toAyah; a++) out.push(`${seg.surahId}:${a}`);
    }
    return out;
  }
  if (range.startsWith('Whole Quran')) {
    const out: string[] = [];
    for (const s of ALL_SURAHS) {
      for (let a = 1; a <= s.ayahCount; a++) out.push(`${s.id}:${a}`);
    }
    return out;
  }
  return null;
}

/** Last 7 local dates, oldest first. */
function lastSevenDays(): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    out.push(localDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)));
  }
  return out;
}

/** A unique id for a new goal (module-level: id generation is impure). */
function newGoalId(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** YYYY-MM-DD of the last day of the current month (module-level helper). */
function currentMonthEnd(): string {
  const now = new Date();
  return localDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
}

type Suggestion = { label: string; note: string; action: GoalAction; range: string; portion: string; schedule: string };

export default function GoalsClient({ preset, createOpenSignal }: { preset?: string; createOpenSignal?: number }) {
  const t = useT();
  const SUGGESTIONS: Suggestion[] = [
    { label: t('hub.completeQuran'), note: t('hub.completeQuranNote'), action: 'Recite', range: 'Whole Quran (114 surahs)', portion: '1 page a day', schedule: 'Every day' },
    { label: t('hub.kahf'), note: t('hub.kahfNote'), action: 'Recite', range: 'Surah Al-Kahf', portion: 'Whole surah', schedule: 'Every Friday' },
    { label: t('goal.reviewJuz30'), note: t('goal.reviewJuz30Note'), action: 'Review', range: 'Juz 30', portion: '5 ayahs a day', schedule: 'Every day' },
    { label: t('goal.memoriseAmma'), note: t('goal.memoriseAmmaNote'), action: 'Memorize', range: 'Juz 30 (Amma)', portion: '1 surah a day', schedule: 'Every day' },
  ];
  // Stage 6 (§17): the six goal kinds from the brief, one tap each.
  // 'month-end' resolves to the last day of the current month at creation.
  const TEMPLATES: (Suggestion & { deadline?: string })[] = [
    { label: 'Memorise one ayah a day', note: 'One new ayah every day, from anywhere in the Quran.', action: 'Memorize', range: 'Whole Quran (114 surahs)', portion: '1 ayah a day', schedule: 'Every day' },
    { label: 'Memorise one page a day', note: 'One Mushaf page a day — the whole Quran in about 20 months.', action: 'Memorize', range: 'Whole Quran (114 surahs)', portion: '1 page a day', schedule: 'Every day' },
    { label: 'One Surah a month', note: 'Finish Al-Mulk by the end of this month, then pick the next surah.', action: 'Memorize', range: 'Surah Al-Mulk', portion: 'Whole surah', schedule: 'Every day', deadline: 'month-end' },
    { label: 'Revise one Juz every week', note: 'Work through Juz 30 again, a little each day, every week.', action: 'Review', range: 'Juz 30', portion: '1 page a day', schedule: 'Every day' },
    { label: 'Complete a Surah', note: 'Memorise Al-Mulk from start to finish — your progress is measured ayah by ayah.', action: 'Memorize', range: 'Surah Al-Mulk', portion: 'Whole surah', schedule: 'Every day' },
    { label: 'Revise what you have memorised', note: 'Keep the ayahs you already know strong — a few each day.', action: 'Review', range: 'Whole Quran (114 surahs)', portion: '5 ayahs a day', schedule: 'Every day' },
  ];
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progress, setProgress] = useState<HifzProgress | null>(null);
  const [name, setName] = useState('');
  const [action, setAction] = useState<GoalAction>('Memorize');
  const [range, setRange] = useState('Surah Al-Mulk');
  const [portion, setPortion] = useState('1 page a day');
  const [schedule, setSchedule] = useState('Every day');
  const [shape, setShape] = useState<'flexible' | 'portion'>('flexible');
  const [reverse, setReverse] = useState(false);
  const [recurring, setRecurring] = useState(true);
  const [deadline, setDeadline] = useState('');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  // Progress-hub tab: the create form (templates + new-goal form +
  // suggestions) opens behind a START A NEW GOAL button.
  const [showCreate, setShowCreate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const loaded = loadGoals();
    setGoals(loaded);
    if (loaded.length === 0 || preset === 'kahf') setShowCreate(true);
    try {
      setProgress(loadProgress());
    } catch {
      setProgress(null);
    }
    if (preset === 'kahf') {
      setName('Surah Al-Kahf every Friday');
      setAction('Recite');
      setRange('Surah Al-Kahf');
      setPortion('Whole surah');
      setSchedule('Every Friday');
      setRecurring(true);
    }
  }, [preset]);

  // Opened from My Progress → Dashboard ("Start a new goal"): open the
  // create form when the signal changes.
  useEffect(() => {
    if (createOpenSignal && createOpenSignal > 0) setShowCreate(true);
  }, [createOpenSignal]);

  const persist = (next: Goal[]) => {
    setGoals(next);
    try {
      localStorage.setItem(GOALS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const createGoal = (s?: (typeof SUGGESTIONS)[number] | (typeof TEMPLATES)[number]) => {
    const templateDeadline =
      s && 'deadline' in s && s.deadline
        ? s.deadline === 'month-end'
          ? currentMonthEnd()
          : s.deadline
        : undefined;
    const resolvedDeadline = templateDeadline || deadline || undefined;
    const g: Goal = {
      id: newGoalId(),
      name: s?.label ?? name.trim() ?? t('goal.myGoal'),
      action: s?.action ?? action,
      range: s?.range ?? range,
      portion: s?.portion ?? portion,
      schedule: s?.schedule ?? schedule,
      shape,
      reverse,
      recurring,
      createdAt: new Date().toISOString(),
      sessions: [],
      ...(resolvedDeadline ? { deadline: resolvedDeadline } : {}),
    };
    if (!g.name) return;
    persist([g, ...goals]);
    setSavedMsg(`${t('goal.savedA')}${g.name}${t('goal.savedB')} ${g.portion}, ${g.schedule.toLowerCase()}.`);
    setName('');
  };

  const deleteGoal = (id: string) => persist(goals.filter((g) => g.id !== id));

  const setArchived = (id: string, archived: boolean) =>
    persist(goals.map((g) => (g.id === id ? { ...g, archived } : g)));

  const setReminder = (id: string, remind: boolean, remindTime?: string) => {
    persist(
      goals.map((g) =>
        g.id === id
          ? { ...g, remind, ...(remindTime !== undefined ? { remindTime } : {}), ...(remind ? {} : { remindTime: g.remindTime }) }
          : g,
      ),
    );
  };

  /** Daily plan preview: portion text + how many days the range needs. */
  const planPreview = () => {
    if (shape === 'flexible') {
      return deadline
        ? `${t('goal.planFlexibleDeadline')} ${deadline}.`
        : t('goal.planFlexibleNoDeadline');
    }
    return `${t('goal.planPortionA')} ${portion.toLowerCase()} ${t('goal.planPortionB')} ${schedule.toLowerCase()}.`;
  };

  // --- Stage 6 (§17): real progress + due reminders, from stored data.
  const today = localDateString();
  const practisedToday =
    progress !== null &&
    (ayahsPractisedOn(progress, today) > 0 ||
      (progress.minutesToday.date === today && progress.minutesToday.minutes > 0));
  // The clock reading is taken once, when the page opens — reminders are
  // an "open the app" feature, not a live timer.
  const [nowHHMM] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const dueReminders = goals.filter(
    (g) => g.remind && !practisedToday && g.remindTime && nowHHMM >= g.remindTime,
  );

  /** Real progress for one goal: memorised / learning counts in its range,
   *  and which of the last 7 days saw practice in that range. */
  const goalProgress = (g: Goal) => {
    const keys = rangeAyahKeys(g.range);
    if (!keys || !progress) return null;
    const keySet = new Set(keys);
    let memorised = 0;
    let learning = 0;
    const days = lastSevenDays();
    const practisedDays = new Set<string>();
    for (const [key, a] of Object.entries(progress.ayahs)) {
      if (!keySet.has(key)) continue;
      if (a.status === 'memorised') memorised += 1;
      else if (a.status === 'learning') learning += 1;
      if (a.lastPractised) {
        const day = a.lastPractised.slice(0, 10);
        if (days.includes(day)) practisedDays.add(day);
      }
    }
    return {
      total: keys.length,
      memorised,
      learning,
      days: days.map((d) => ({ date: d, practised: practisedDays.has(d) })),
      practisedToday: practisedDays.has(today),
    };
  };

  // --- Progress-hub tab sections: Active / Today's / Upcoming / Archived,
  // all from the same stored goals — nothing is computed from new data.
  const activeGoals = goals.filter((g) => !g.archived);
  const archivedGoals = goals.filter((g) => g.archived);
  /** Is this goal due today, from its schedule + real practice in range? */
  const isDueToday = (g: Goal): boolean => {
    const dow = new Date().getDay(); // 0 = Sunday
    if (g.schedule === 'Every day') return true;
    if (g.schedule === 'Weekdays') return dow >= 1 && dow <= 5;
    if (g.schedule === 'Every Friday') return dow === 5;
    if (g.schedule === '3 days a week') {
      const p = goalProgress(g);
      if (!p) return true; // unmeasurable range — show it rather than hide it
      const practisedDays = p.days.filter((d) => d.practised).length;
      return !p.practisedToday && practisedDays < 3;
    }
    return true; // unknown schedule — show in Today rather than lose it
  };
  const todaysGoals = activeGoals.filter(isDueToday);
  const upcomingGoals = activeGoals.filter((g) => !isDueToday(g));

  /** One compact row for the Today's / Upcoming lists. */
  const GoalRow = ({ g }: { g: Goal }) => {
    const p = goalProgress(g);
    const pct = p && p.total > 0 ? Math.round((p.memorised / p.total) * 100) : null;
    return (
      <li className="flex flex-wrap items-center gap-2 rounded-xl bg-[#FFFBF2] px-3 py-2 text-sm">
        <span className="font-semibold text-[#102E26]">{g.name}</span>
        <span className="text-[#5b6b62]">
          {g.range} · {g.portion} · {g.schedule}
        </span>
        {pct !== null && <span className="font-bold text-[#1FA36B]">{pct}% memorised</span>}
        <Link href="/hifz/recite" className="ml-auto font-semibold text-[#1FA36B] underline">
          Practise now →
        </Link>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      {savedMsg && (
        <p role="status" className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1FA36B]">
          {savedMsg}
        </p>
      )}

      {/* Stage 6 (§17): opt-in in-app reminders. Only when a reminded goal
          is due and nothing has been practised today yet. */}
      {dueReminders.length > 0 && (
        <section aria-label="Goal reminders" className="rounded-2xl border border-[#FFB800] bg-[#FFFBF2] p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#102E26]">Reminder — time to practise</h2>
          <ul className="mt-2 space-y-1 text-sm text-[#5b6b62]">
            {dueReminders.map((g) => (
              <li key={g.id}>
                <strong className="text-[#102E26]">{g.name}</strong> — you asked to be reminded
                at {g.remindTime}, and nothing has been practised today yet.
              </li>
            ))}
          </ul>
          <Link
            href="/hifz/recite"
            className="mt-3 inline-block rounded-full bg-[#57D798] px-4 py-2 text-sm font-bold text-[#102E26] hover:brightness-105"
          >
            Practise now →
          </Link>
        </section>
      )}

      {/* Start a new goal — opens the templates + create form below. */}
      <div>
        <button
          type="button"
          aria-expanded={showCreate}
          onClick={() => setShowCreate((v) => !v)}
          className="min-h-11 rounded-full bg-[#57D798] px-6 py-3 text-sm font-bold text-[#102E26] hover:brightness-105"
        >
          {showCreate ? 'Close' : 'START A NEW GOAL'}
        </button>
      </div>

      {/* Active goals */}
      {activeGoals.length > 0 && (
        <section aria-labelledby="mine-heading" className="space-y-4">
          <h2 id="mine-heading" className="text-xl font-bold text-[#102E26]">Active</h2>
          {activeGoals.map((g) => {
            const p = goalProgress(g);
            const pct = p && p.total > 0 ? Math.round((p.memorised / p.total) * 100) : null;
            return (
              <article key={g.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold text-[#102E26]">{g.name}</h3>
                  <span className="rounded-full bg-[#E4FFF2] px-3 py-1 text-xs font-bold text-[#1FA36B]">
                    {g.action} · {g.shape === 'flexible' ? t('goal.flexibleLabel') : t('goal.portionBased')}
                    {g.recurring ? ` · ${t('goal.recurringLabel')}` : ''}
                    {g.reverse ? ` · ${t('goal.reverseLabel')}` : ''}
                    {g.deadline ? ` · by ${g.deadline}` : ''}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#5b6b62]">
                  {g.range} · {g.portion} · {g.schedule}
                </p>
                {p === null ? (
                  <p className="mt-3 text-sm text-[#5b6b62]">
                    Progress can&apos;t be measured for this range — it was saved before ranges
                    were measured. Delete it and recreate it from a template to track it.
                  </p>
                ) : (
                  <>
                    <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="font-semibold text-[#102E26]">
                        {p.memorised} of {p.total} ayahs memorised
                        {p.learning > 0 ? ` · ${p.learning} learning` : ''}
                      </span>
                      <span className="font-bold text-[#1FA36B]">{pct}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#E5E7EB]" role="progressbar" aria-valuenow={pct ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress on ${g.name}`}>
                      <div className="h-full rounded-full bg-[#1FA36B]" style={{ width: `${pct ?? 0}%` }} />
                    </div>
                    <div className="mt-3 flex items-end gap-1" aria-label="Practice in this range over the last 7 days">
                      {p.days.map((d) => (
                        <span
                          key={d.date}
                          title={`${d.date}: ${d.practised ? 'practised in this range' : 'no practice recorded'}`}
                          className={`w-6 rounded-t ${d.practised ? 'bg-[#16A34A]' : 'bg-[#E5E7EB]'}`}
                          style={{ height: '20px' }}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-[#5b6b62]">
                      Last 7 days in this range: green = practised, grey = no practice recorded.
                      {p.practisedToday ? ' Practised today.' : ' Not practised today yet.'}
                      {p.memorised === 0 && p.learning === 0
                        ? ' Nothing practised in this range yet — recite with the coach and it appears here.'
                        : ''}
                    </p>
                  </>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#E5E7EB] pt-3">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={!!g.remind}
                      onChange={(e) => setReminder(g.id, e.target.checked, g.remindTime ?? '08:00')}
                    />
                    Remind me
                  </label>
                  {g.remind && (
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      at
                      <input
                        type="time"
                        value={g.remindTime ?? '08:00'}
                        onChange={(e) => setReminder(g.id, true, e.target.value)}
                        className="min-h-11 rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-2 py-1.5 text-sm"
                      />
                    </label>
                  )}
                  <span className="text-xs text-[#5b6b62]">
                    In-app only — the reminder shows here when you open the app. No notifications are sent.
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/hifz/recite"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
                  >
                    {t('goal.practiseNow')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setArchived(g.id, true)}
                    className="text-sm font-semibold text-[#5b6b62] underline"
                  >
                    Archive
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteGoal(g.id)}
                    className="text-sm font-semibold text-red-700 underline"
                  >
                    {t('goal.deleteGoal')}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {activeGoals.length === 0 && (
        <p><span className="rounded-full bg-[#E5E7EB] px-3 py-1 text-xs font-bold text-[#5b6b62]">None</span></p>
      )}

      {/* Today's goals — active goals whose schedule falls today. */}
      <section aria-labelledby="today-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="today-heading" className="text-xl font-bold text-[#102E26]">Today&apos;s goals</h2>
        {todaysGoals.length === 0 ? (
          <p className="mt-3"><span className="rounded-full bg-[#E5E7EB] px-3 py-1 text-xs font-bold text-[#5b6b62]">None</span></p>
        ) : (
          <ul className="mt-3 space-y-2">
            {todaysGoals.map((g) => (
              <GoalRow key={g.id} g={g} />
            ))}
          </ul>
        )}
      </section>

      {/* Upcoming goals — active goals not due today. */}
      <section aria-labelledby="upcoming-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="upcoming-heading" className="text-xl font-bold text-[#102E26]">Upcoming goals</h2>
        {upcomingGoals.length === 0 ? (
          <p className="mt-3"><span className="rounded-full bg-[#E5E7EB] px-3 py-1 text-xs font-bold text-[#5b6b62]">None</span></p>
        ) : (
          <ul className="mt-3 space-y-2">
            {upcomingGoals.map((g) => (
              <GoalRow key={g.id} g={g} />
            ))}
          </ul>
        )}
      </section>

      {/* Archived goals — collapsible; archiving never deletes a goal. */}
      <section aria-labelledby="archived-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="archived-heading" className="text-xl font-bold text-[#102E26]">Archived</h2>
          <button
            type="button"
            aria-expanded={showArchived}
            onClick={() => setShowArchived((v) => !v)}
            className="min-h-11 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-semibold hover:border-[#1FA36B]"
          >
            {showArchived ? 'Hide' : `Show (${archivedGoals.length})`}
          </button>
        </div>
        {showArchived &&
          (archivedGoals.length === 0 ? (
            <p className="mt-3"><span className="rounded-full bg-[#E5E7EB] px-3 py-1 text-xs font-bold text-[#5b6b62]">None</span></p>
          ) : (
            <ul className="mt-3 space-y-2">
              {archivedGoals.map((g) => (
                <li key={g.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#FFFBF2] px-3 py-2 text-sm">
                  <span className="font-semibold text-[#102E26]">{g.name}</span>
                  <span className="text-[#5b6b62]">{g.range} · {g.portion} · {g.schedule}</span>
                  <span className="ml-auto flex gap-3">
                    <button type="button" onClick={() => setArchived(g.id, false)} className="font-semibold text-[#1FA36B] underline">
                      Unarchive
                    </button>
                    <button type="button" onClick={() => deleteGoal(g.id)} className="font-semibold text-red-700 underline">
                      {t('goal.deleteGoal')}
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ))}
      </section>

      {showCreate && (
        <>
      {/* Stage 6 (§17): one-tap templates for the six goal kinds in the brief. */}
      <section aria-labelledby="templates-heading">
        <h2 id="templates-heading" className="text-xl font-bold text-[#102E26]">Start from a template</h2>
        <p className="text-sm text-[#5b6b62]">One tap creates the goal — progress is measured from your real practice.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map((s) => (
            <article key={s.label} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h3 className="font-bold text-[#102E26]">{s.label}</h3>
              <p className="mt-1 text-sm text-[#5b6b62]">{s.note}</p>
              <p className="mt-1 text-xs text-[#5b6b62]">
                {s.action} · {s.range} · {s.portion} · {s.schedule}
                {s.deadline ? (s.deadline === 'month-end' ? ' · by the end of this month' : ` · by ${s.deadline}`) : ''}
              </p>
              <button
                type="button"
                onClick={() => createGoal(s)}
                className="min-h-11 mt-3 rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
              >
                {t('goal.startGoal')}
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* New goal */}
      <section aria-labelledby="new-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="new-heading" className="text-xl font-bold text-[#102E26]">{t('hub.goalCta')}</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Set your intention: what you will do, over which part of the Quran, how much per
          session, and when. The app builds your daily plan from that — no account, no limits.
        </p>
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-semibold">
            {t('goal.goalName')}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('goal.namePlaceholder')}
              className="mt-1 block w-full rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              {t('goal.action')}
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as GoalAction)}
                className="mt-1 block w-full rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
              >
                <option value="Memorize">{t('goal.memorize')}</option>
                <option value="Review">{t('common.review')}</option>
                <option value="Recite">{t('common.recite')}</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">
              {t('goal.range')}
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
              >
                {ALL_SURAHS.map((s) => (
                  <option key={s.id} value={`Surah ${s.name}`}>Surah {s.name}</option>
                ))}
                <option value="Juz 30">{t('goal.juz30')}</option>
                <option value="Juz 29">{t('goal.juz29')}</option>
                <option value="Whole Quran (114 surahs)">{t('goal.wholeQuran')}</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">
              {t('goal.portion')}
              <select
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
              >
                <option value="1 ayah a day">{t('goal.ayahADay1')}</option>
                <option value="3 ayahs a day">{t('goal.ayahADay3')}</option>
                <option value="5 ayahs a day">{t('goal.ayahADay5')}</option>
                <option value="1 page a day">{t('goal.pageADay')}</option>
                <option value="Whole surah">{t('goal.wholeSurah')}</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">
              {t('goal.schedule')}
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
              >
                <option value="Every day">{t('goal.everyDay')}</option>
                <option value="Weekdays">{t('goal.weekdays')}</option>
                <option value="Every Friday">{t('goal.everyFriday')}</option>
                <option value="3 days a week">{t('goal.threeDays')}</option>
              </select>
            </label>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold">{t('goal.planShape')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={shape === 'flexible'}
                onClick={() => setShape('flexible')}
                className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${shape === 'flexible' ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB]'}`}
              >
                {t('goal.flexible')}
              </button>
              <button
                type="button"
                aria-pressed={shape === 'portion'}
                onClick={() => setShape('portion')}
                className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${shape === 'portion' ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB]'}`}
              >
                {t('goal.fixedPortion')}
              </button>
            </div>
          </fieldset>
          {shape === 'flexible' && (
            <label className="block text-sm font-semibold">
              {t('goal.deadline')}
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-1 block rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
              />
            </label>
          )}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={reverse} onChange={(e) => setReverse(e.target.checked)} />
              {t('goal.reverse')}
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
              {t('goal.recurring')}
            </label>
          </div>
          <p className="rounded-xl bg-[#E4FFF2] px-4 py-3 text-sm text-[#102E26]">{planPreview()}</p>
          <button
            type="button"
            onClick={() => createGoal()}
            disabled={!name.trim()}
            className="rounded-full bg-[#57D798] px-6 py-3 text-sm font-bold text-[#102E26] disabled:opacity-50"
          >
            {t('goal.saveGoal')}
          </button>
        </div>
      </section>

      {/* Suggestions */}
      <section aria-labelledby="sugg-heading">
        <h2 id="sugg-heading" className="text-xl font-bold text-[#102E26]">{t('hub.suggestions')}</h2>
        <p className="text-sm text-[#5b6b62]">{t('hub.suggestionsHint')}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <article key={s.label} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h3 className="font-bold text-[#102E26]">{s.label}</h3>
              <p className="mt-1 text-sm text-[#5b6b62]">{s.note}</p>
              <p className="mt-1 text-xs text-[#5b6b62]">
                {s.action} · {s.range} · {s.portion} · {s.schedule}
              </p>
              <button
                type="button"
                onClick={() => createGoal(s)}
                className="min-h-11 mt-3 rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
              >
                {t('goal.startGoal')}
              </button>
            </article>
          ))}
        </div>
      </section>
        </>
      )}

      <p className="text-sm text-[#5b6b62]">
        {t('goal.footerA')}{' '}
        <Link href="/hifz/my-progress" className="font-semibold text-[#1FA36B] underline">
          {t('common.myProgress')}
        </Link>
        {t('goal.footerB')}{' '}
        <Link href="/hifz/plans" className="font-semibold text-[#1FA36B] underline">
          {t('common.plans')}
        </Link>
        .
      </p>
    </div>
  );
}
