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
// The goal store lives in lib/goals.ts (Phase 4) so the reader
// dashboard writes the same shape to the same key.
import { loadGoals, saveGoals, newGoalId, type Goal, type GoalAction } from '../lib/goals';

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
    { label: t('rb.goals.tplAyahDay'), note: t('rb.goals.tplAyahDayNote'), action: 'Memorize', range: 'Whole Quran (114 surahs)', portion: '1 ayah a day', schedule: 'Every day' },
    { label: t('rb.goals.tplPageDay'), note: t('rb.goals.tplPageDayNote'), action: 'Memorize', range: 'Whole Quran (114 surahs)', portion: '1 page a day', schedule: 'Every day' },
    { label: t('rb.goals.tplSurahMonth'), note: t('rb.goals.tplSurahMonthNote'), action: 'Memorize', range: 'Surah Al-Mulk', portion: 'Whole surah', schedule: 'Every day', deadline: 'month-end' },
    { label: t('rb.goals.tplJuzWeek'), note: t('rb.goals.tplJuzWeekNote'), action: 'Review', range: 'Juz 30', portion: '1 page a day', schedule: 'Every day' },
    { label: t('rb.goals.tplCompleteSurah'), note: t('rb.goals.tplCompleteSurahNote'), action: 'Memorize', range: 'Surah Al-Mulk', portion: 'Whole surah', schedule: 'Every day' },
    { label: t('rb.goals.tplRevise'), note: t('rb.goals.tplReviseNote'), action: 'Review', range: 'Whole Quran (114 surahs)', portion: '5 ayahs a day', schedule: 'Every day' },
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
  // C3 (2026-11-26): deep-link presets — the Challenges page's
  // League "Join with a goal" buttons and daily-reading suggestions
  // land here with a goal prefilled, the way ?preset=kahf already
  // worked. Any preset opens the create form with its fields set.
  const PRESETS: Record<string, { name: string; action: GoalAction; range: string; portion: string; schedule: string }> = {
    kahf: { name: t('rb.goals.presetKahfName'), action: 'Recite', range: 'Surah Al-Kahf', portion: 'Whole surah', schedule: 'Every Friday' },
    'league-ramadan': { name: t('chal.tplRamadanName'), action: 'Memorize', range: 'Whole Quran (114 surahs)', portion: '1 page a day', schedule: 'Every day' },
    'league-baqarah': { name: t('chal.tplBaqarahName'), action: 'Memorize', range: 'Surah Al-Baqarah', portion: '1 page a day', schedule: 'Every day' },
    'league-imran': { name: t('chal.tplImranName'), action: 'Memorize', range: "Surah Ali 'Imran", portion: '1 page a day', schedule: 'Every day' },
    'daily-time': { name: t('chal.dailyTime'), action: 'Recite', range: 'Whole Quran (114 surahs)', portion: '1 page a day', schedule: 'Every day' },
    'daily-pages': { name: t('chal.dailyPages'), action: 'Recite', range: 'Whole Quran (114 surahs)', portion: '1 page a day', schedule: 'Every day' },
  };
  // G3: editing a goal reuses the create form, prefilled — a visible
  // Edit button, not swipe-only.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  // m9: Delete goal asks first (same two-step pattern as delete-all).
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadGoals();
    setGoals(loaded);
    // Deep-link only: the create form opens when a suggestion preset
    // asked for it. It stays closed otherwise — even with no goals yet,
    // so the Goals tab shows the START A NEW GOAL card like Tarteel.
    const p = preset ? PRESETS[preset] : undefined;
    if (p) {
      setShowCreate(true);
      setName(p.name);
      setAction(p.action);
      setRange(p.range);
      setPortion(p.portion);
      setSchedule(p.schedule);
      setRecurring(true);
    }
    try {
      setProgress(loadProgress());
    } catch {
      setProgress(null);
    }
  }, [preset]);

  // Opened from My Progress → Dashboard ("Start a new goal"): open the
  // create form when the signal changes.
  useEffect(() => {
    if (createOpenSignal && createOpenSignal > 0) setShowCreate(true);
  }, [createOpenSignal]);

  const persist = (next: Goal[]) => {
    setGoals(next);
    saveGoals(next);
  };

  const createGoal = (s?: (typeof SUGGESTIONS)[number] | (typeof TEMPLATES)[number]) => {
    const templateDeadline =
      s && 'deadline' in s && s.deadline
        ? s.deadline === 'month-end'
          ? currentMonthEnd()
          : s.deadline
        : undefined;
    const resolvedDeadline = templateDeadline || deadline || undefined;
    // G3: saving while editing updates that goal instead of creating
    // a second one. Templates / suggestions always create a new goal.
    if (editingId && !s) {
      const updated = goals.map((g) => {
        if (g.id !== editingId) return g;
        const next: Goal = {
          ...g,
          name: name.trim() || g.name,
          action,
          range,
          portion,
          schedule,
          shape,
          reverse,
          recurring,
        };
        if (resolvedDeadline) next.deadline = resolvedDeadline;
        else delete next.deadline;
        return next;
      });
      persist(updated);
      setSavedMsg(`${t('goal.savedA')}${name.trim()}${t('goal.savedB')} ${portion}, ${schedule.toLowerCase()}.`);
      setEditingId(null);
      setName('');
      setShowCreate(false);
      return;
    }
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

  const deleteGoal = (id: string) => {
    setConfirmDeleteId(null);
    persist(goals.filter((g) => g.id !== id));
  };

  // G2: an explicit Complete control — marks the goal done and
  // archives it; Archived shows a "Completed" badge for it.
  const markComplete = (id: string) =>
    persist(goals.map((g) => (g.id === id ? { ...g, completed: true, archived: true } : g)));

  // G3: open the form prefilled with this goal's values.
  const startEdit = (g: Goal) => {
    setEditingId(g.id);
    setName(g.name);
    setAction(g.action);
    setRange(g.range);
    setPortion(g.portion);
    setSchedule(g.schedule);
    setShape(g.shape);
    setReverse(g.reverse);
    setRecurring(g.recurring);
    setDeadline(g.deadline ?? '');
    setShowCreate(true);
  };

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
      <li className="flex flex-wrap items-center gap-2 rounded-xl bg-[#F4F5F7] px-3 py-2 text-sm">
        <span className="font-semibold text-[#111827]">{g.name}</span>
        <span className="text-[#6B7280]">
          {g.range} · {g.portion} · {g.schedule}
        </span>
        {pct !== null && <span className="font-bold text-[#1FA36B]">{pct}% memorised</span>}
        <Link href="/hifz/recite" className="ml-auto font-semibold text-[#1FA36B] underline">
          {t('goal.practiseNow')}
        </Link>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      {savedMsg && (
        <p role="status" className="rounded-xl border border-[#E8EAED] bg-white px-4 py-3 text-sm font-semibold text-[#1FA36B]">
          {savedMsg}
        </p>
      )}

      {/* Stage 6 (§17): opt-in in-app reminders. Only when a reminded goal
          is due and nothing has been practised today yet. */}
      {dueReminders.length > 0 && (
        <section aria-label={t('rb.goals.reminders')} className="rounded-2xl border border-[#FFB800] bg-[#F4F5F7] p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#111827]">{t('rb.goals.reminderTitle')}</h2>
          <ul className="mt-2 space-y-1 text-sm text-[#6B7280]">
            {dueReminders.map((g) => (
              <li key={g.id}>
                <strong className="text-[#111827]">{g.name}</strong> {t('rb.goals.reminderDue').replace('{time}', g.remindTime ?? '')}
              </li>
            ))}
          </ul>
          <Link
            href="/hifz/recite"
            className="mt-3 inline-block rounded-full bg-[#57D798] px-4 py-2 text-sm font-bold text-[#102E26] hover:brightness-105"
          >
            {t('goal.practiseNow')}
          </Link>
        </section>
      )}

      {/* Start a new goal — a white card, like the reference. Tapping it
          opens the templates + create form below Archived; tapping again
          closes it. Never a green "Close" pill. */}
      <div>
        <button
          type="button"
          aria-expanded={showCreate}
          onClick={() => {
            if (showCreate) setEditingId(null);
            setShowCreate((v) => !v);
          }}
          className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[#E8EAED] bg-white px-4 py-3 text-sm font-bold text-[#111827] shadow-sm hover:border-[#1FA36B]"
        >
          {showCreate ? t('rb.dash.closeForm') : t('rb.dash.startNewGoal')}
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#57D798] text-[#102E26]" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </button>
      </div>

      {/* Active goals — always shown, with the reference's description. */}
      <section aria-labelledby="mine-heading" className="space-y-4">
        <div>
          <h2 id="mine-heading" className="text-xl font-bold text-[#111827]">{t('rb.goals.active')}</h2>
          <p className="mt-1 text-sm text-[#6B7280]">{t('rb.dash.activeDesc')}</p>
        </div>
        {activeGoals.length > 0 && (
          <>
          {activeGoals.map((g) => {
            const p = goalProgress(g);
            const pct = p && p.total > 0 ? Math.round((p.memorised / p.total) * 100) : null;
            return (
              <article key={g.id} className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold text-[#111827]">{g.name}</h3>
                  <span className="rounded-full bg-[#E4FFF2] px-3 py-1 text-xs font-bold text-[#1FA36B]">
                    {g.action} · {g.shape === 'flexible' ? t('goal.flexibleLabel') : t('goal.portionBased')}
                    {g.recurring ? ` · ${t('goal.recurringLabel')}` : ''}
                    {g.reverse ? ` · ${t('goal.reverseLabel')}` : ''}
                    {g.deadline ? ` · by ${g.deadline}` : ''}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {g.range} · {g.portion} · {g.schedule}
                </p>
                {p === null ? (
                  <p className="mt-3 text-sm text-[#6B7280]">
                    Progress can&apos;t be measured for this range — it was saved before ranges
                    were measured. Delete it and recreate it from a template to track it.
                  </p>
                ) : (
                  <>
                    <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="font-semibold text-[#111827]">
                        {p.total === 1
                          ? t('rb.goals.memorisedOfOne').replace('{a}', String(p.memorised))
                          : t('rb.goals.memorisedOf').replace('{a}', String(p.memorised)).replace('{b}', String(p.total))}
                        {p.learning > 0 ? ` · ${t('rb.list.nLearning').replace('{n}', String(p.learning))}` : ''}
                      </span>
                      <span className="font-bold text-[#1FA36B]">{pct}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#E8EAED]" role="progressbar" aria-valuenow={pct ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label={t('rb.goals.progressOn').replace('{name}', g.name)}>
                      <div className="h-full rounded-full bg-[#1FA36B]" style={{ width: `${pct ?? 0}%` }} />
                    </div>
                    <div className="mt-3 flex items-end gap-1" aria-label={t('rb.goals.practiceRange')}>
                      {p.days.map((d) => (
                        <span
                          key={d.date}
                          title={`${d.date}: ${d.practised ? t('rb.goals.practisedRange') : t('rb.dash.stNoPractice')}`}
                          className={`w-6 rounded-t ${d.practised ? 'bg-[#16A34A]' : 'bg-[#E8EAED]'}`}
                          style={{ height: '20px' }}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      {t('rb.goals.last7Note')}
                      {p.practisedToday ? ' ' + t('rb.goals.practisedToday') : ' ' + t('rb.goals.notPractisedToday')}
                      {p.memorised === 0 && p.learning === 0
                        ? ' ' + t('rb.goals.nothingRange')
                        : ''}
                    </p>
                  </>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#E8EAED] pt-3">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={!!g.remind}
                      onChange={(e) => setReminder(g.id, e.target.checked, g.remindTime ?? '08:00')}
                    />{t('rb.goals.remindMe')}</label>
                  {g.remind && (
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      {t('rb.goals.atTime')}
                      <input
                        type="time"
                        value={g.remindTime ?? '08:00'}
                        onChange={(e) => setReminder(g.id, true, e.target.value)}
                        className="min-h-11 rounded-lg border border-[#E8EAED] bg-[#F4F5F7] px-2 py-1.5 text-sm"
                      />
                    </label>
                  )}
                  <span className="text-xs text-[#6B7280]">{t('rb.goals.reminderNote')}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/hifz/recite"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
                  >
                    {t('goal.practiseNow')}
                  </Link>
                  {/* G3: visible Edit button (was swipe-only). G2:
                      explicit Mark complete control. */}
                  <button
                    type="button"
                    onClick={() => startEdit(g)}
                    className="min-h-11 rounded-full border border-[#E8EAED] px-4 py-2 text-sm font-semibold hover:border-[#1FA36B]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => markComplete(g.id)}
                    className="min-h-11 rounded-full border border-[#1FA36B] px-4 py-2 text-sm font-semibold text-[#1FA36B] hover:bg-[#E4FFF2]"
                  >
                    Mark complete
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchived(g.id, true)}
                    className="text-sm font-semibold text-[#6B7280] underline"
                  >{t('rb.goals.archive')}</button>
                  {confirmDeleteId === g.id ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-red-700">{t('goal.confirmDelete')}</span>
                      <button
                        type="button"
                        onClick={() => deleteGoal(g.id)}
                        className="text-sm font-semibold text-red-700 underline"
                      >
                        {t('goal.yesDelete')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-sm font-semibold text-[#6B7280] underline"
                      >
                        {t('rb.dash.keepThem')}
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(g.id)}
                      className="text-sm font-semibold text-red-700 underline"
                    >
                      {t('goal.deleteGoal')}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
          </>
        )}
      </section>

      {/* Today's goals — small-caps label + white card, like the reference. */}
      <section aria-labelledby="today-heading">
        <h2 id="today-heading" className="text-xs font-bold uppercase tracking-wide text-[#111827]">{t('rb.goals.todayGoals')}</h2>
        <div className="mt-2 rounded-2xl border border-[#E8EAED] bg-white p-4 shadow-sm">
          {todaysGoals.length === 0 ? (
            <p className="text-center text-base text-[#111827]">{t('rb.goals.none')}</p>
          ) : (
            <ul className="space-y-2">
              {todaysGoals.map((g) => (
                <GoalRow key={g.id} g={g} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Upcoming goals — small-caps label + white card, like the reference. */}
      <section aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="text-xs font-bold uppercase tracking-wide text-[#111827]">{t('rb.goals.upcoming')}</h2>
        <div className="mt-2 rounded-2xl border border-[#E8EAED] bg-white p-4 shadow-sm">
          {upcomingGoals.length === 0 ? (
            <p className="text-center text-base text-[#111827]">{t('rb.goals.none')}</p>
          ) : (
            <ul className="space-y-2">
              {upcomingGoals.map((g) => (
                <GoalRow key={g.id} g={g} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Archived goals — chevron header + description, like the reference;
          archiving never deletes a goal. */}
      <section aria-labelledby="archived-heading">
        <button
          type="button"
          aria-expanded={showArchived}
          onClick={() => setShowArchived((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <h2 id="archived-heading" className="text-xl font-bold text-[#111827]">{t('rb.goals.archived')}</h2>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform ${showArchived ? 'rotate-180' : ''}`}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <p className="mt-1 text-sm text-[#6B7280]">{t('rb.dash.archivedDesc')}</p>
        {showArchived &&
          (archivedGoals.length === 0 ? (
            <div className="mt-2 rounded-2xl border border-[#E8EAED] bg-white p-4 shadow-sm">
              <p className="text-center text-base text-[#111827]">{t('rb.goals.none')}</p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {archivedGoals.map((g) => (
                <li key={g.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#F4F5F7] px-3 py-2 text-sm">
                  <span className="font-semibold text-[#111827]">{g.name}</span>
                  {g.completed && (
                    <span className="rounded-full bg-[#E4FFF2] px-2 py-0.5 text-xs font-bold text-[#1FA36B]">Completed ✓</span>
                  )}
                  <span className="text-[#6B7280]">{g.range} · {g.portion} · {g.schedule}</span>
                  <span className="ml-auto flex gap-3">
                    <button type="button" onClick={() => setArchived(g.id, false)} className="font-semibold text-[#1FA36B] underline">{t('rb.goals.unarchive')}</button>
                    {confirmDeleteId === g.id ? (
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-red-700">{t('goal.confirmDelete')}</span>
                        <button type="button" onClick={() => deleteGoal(g.id)} className="font-semibold text-red-700 underline">
                          {t('goal.yesDelete')}
                        </button>
                        <button type="button" onClick={() => setConfirmDeleteId(null)} className="font-semibold text-[#6B7280] underline">
                          {t('rb.dash.keepThem')}
                        </button>
                      </span>
                    ) : (
                      <button type="button" onClick={() => setConfirmDeleteId(g.id)} className="font-semibold text-red-700 underline">
                        {t('goal.deleteGoal')}
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ))}
      </section>

      {/* G1 (2026-11-26): one-tap templates are ALWAYS visible — they
          used to hide behind the START A NEW GOAL button, so a new
          user on a fresh load could never discover them. The custom
          new-goal form + suggestions stay behind the button. */}
      <section aria-labelledby="templates-heading">
        <h2 id="templates-heading" className="text-xl font-bold text-[#111827]">{t('rb.goals.fromTemplate')}</h2>
        <p className="text-sm text-[#6B7280]">{t('rb.goals.oneTap')}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map((s) => (
            <article key={s.label} className="rounded-2xl border border-[#E8EAED] bg-white p-4 shadow-sm">
              <h3 className="font-bold text-[#111827]">{s.label}</h3>
              <p className="mt-1 text-sm text-[#6B7280]">{s.note}</p>
              <p className="mt-1 text-xs text-[#6B7280]">
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

      {showCreate && (
        <>
      {/* New goal */}
      <section aria-labelledby="new-heading" className="rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="new-heading" className="text-xl font-bold text-[#111827]">{editingId ? 'Edit goal' : t('hub.goalCta')}</h2>
        <p className="mt-1 text-sm text-[#6B7280]">{t('rb.goals.intentionNote')}</p>
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-semibold">
            {t('goal.goalName')}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('goal.namePlaceholder')}
              className="mt-1 block w-full rounded-lg border border-[#E8EAED] bg-[#F4F5F7] px-3 py-2.5 text-sm"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              {t('goal.action')}
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as GoalAction)}
                className="mt-1 block w-full rounded-lg border border-[#E8EAED] bg-[#F4F5F7] px-3 py-2.5 text-sm"
              >
                <option value="Memorize">{t('goal.memorize')}</option>
                <option value="Review">{t('common.review')}</option>
                <option value={t('common.recite')}>{t('common.recite')}</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">
              {t('goal.range')}
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[#E8EAED] bg-[#F4F5F7] px-3 py-2.5 text-sm"
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
                className="mt-1 block w-full rounded-lg border border-[#E8EAED] bg-[#F4F5F7] px-3 py-2.5 text-sm"
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
                className="mt-1 block w-full rounded-lg border border-[#E8EAED] bg-[#F4F5F7] px-3 py-2.5 text-sm"
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
                className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${shape === 'flexible' ? 'bg-[#102E26] text-white' : 'border border-[#E8EAED]'}`}
              >
                {t('goal.flexible')}
              </button>
              <button
                type="button"
                aria-pressed={shape === 'portion'}
                onClick={() => setShape('portion')}
                className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${shape === 'portion' ? 'bg-[#102E26] text-white' : 'border border-[#E8EAED]'}`}
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
                className="mt-1 block rounded-lg border border-[#E8EAED] bg-[#F4F5F7] px-3 py-2.5 text-sm"
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
          <p className="rounded-xl bg-[#E4FFF2] px-4 py-3 text-sm text-[#111827]">{planPreview()}</p>
          <button
            type="button"
            onClick={() => createGoal()}
            disabled={!name.trim()}
            className="rounded-full bg-[#57D798] px-6 py-3 text-sm font-bold text-[#102E26] disabled:opacity-50"
          >
            {editingId ? 'Save changes' : t('goal.saveGoal')}
          </button>
        </div>
      </section>

      {/* Suggestions */}
      <section aria-labelledby="sugg-heading">
        <h2 id="sugg-heading" className="text-xl font-bold text-[#111827]">{t('hub.suggestions')}</h2>
        <p className="text-sm text-[#6B7280]">{t('hub.suggestionsHint')}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <article key={s.label} className="rounded-2xl border border-[#E8EAED] bg-white p-4 shadow-sm">
              <h3 className="font-bold text-[#111827]">{s.label}</h3>
              <p className="mt-1 text-sm text-[#6B7280]">{s.note}</p>
              <p className="mt-1 text-xs text-[#6B7280]">
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

      <p className="text-sm text-[#6B7280]">
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
