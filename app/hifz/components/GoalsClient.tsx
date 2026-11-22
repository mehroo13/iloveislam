// app/hifz/components/GoalsClient.tsx — Smart goals (spec §22).
// Intention model: Goal Name + Action (Review / Memorize / Recite) + Range
// + Portion + Schedule; flexible ("all") vs portion-based; multiple ranges;
// reverse-order; recurring goals; auto daily plan; session bars green
// completed / yellow in-progress / red missed. Stored on this device only.
// All free — no limits on how many goals you set.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ALL_SURAHS } from '../surahs';
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
  /** 0..1 per session day, for the session bars. */
  sessions: number[];
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

type Suggestion = { label: string; note: string; action: GoalAction; range: string; portion: string; schedule: string };

export default function GoalsClient({ preset }: { preset?: string }) {
  const t = useT();
  const SUGGESTIONS: Suggestion[] = [
    { label: t('hub.completeQuran'), note: t('hub.completeQuranNote'), action: 'Recite', range: 'Whole Quran (114 surahs)', portion: '1 page a day', schedule: 'Every day' },
    { label: t('hub.kahf'), note: t('hub.kahfNote'), action: 'Recite', range: 'Surah Al-Kahf', portion: 'Whole surah', schedule: 'Every Friday' },
    { label: t('goal.reviewJuz30'), note: t('goal.reviewJuz30Note'), action: 'Review', range: 'Juz 30', portion: '5 ayahs a day', schedule: 'Every day' },
    { label: t('goal.memoriseAmma'), note: t('goal.memoriseAmmaNote'), action: 'Memorize', range: 'Juz 30 (Amma)', portion: '1 surah a day', schedule: 'Every day' },
  ];
  const [goals, setGoals] = useState<Goal[]>([]);
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

  useEffect(() => {
    setGoals(loadGoals());
    if (preset === 'kahf') {
      setName('Surah Al-Kahf every Friday');
      setAction('Recite');
      setRange('Surah Al-Kahf');
      setPortion('Whole surah');
      setSchedule('Every Friday');
      setRecurring(true);
    }
  }, [preset]);

  const persist = (next: Goal[]) => {
    setGoals(next);
    try {
      localStorage.setItem(GOALS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const createGoal = (s?: (typeof SUGGESTIONS)[number]) => {
    const g: Goal = {
      id: `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
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
    };
    if (!g.name) return;
    persist([g, ...goals]);
    setSavedMsg(`${t('goal.savedA')}${g.name}${t('goal.savedB')} ${g.portion}, ${g.schedule.toLowerCase()}.`);
    setName('');
  };

  const deleteGoal = (id: string) => persist(goals.filter((g) => g.id !== id));

  /** Daily plan preview: portion text + how many days the range needs. */
  const planPreview = () => {
    if (shape === 'flexible') {
      return deadline
        ? `${t('goal.planFlexibleDeadline')} ${deadline}.`
        : t('goal.planFlexibleNoDeadline');
    }
    return `${t('goal.planPortionA')} ${portion.toLowerCase()} ${t('goal.planPortionB')} ${schedule.toLowerCase()}.`;
  };

  const barColor = (v: number) => (v >= 1 ? '#16A34A' : v > 0 ? '#F2C94C' : '#DC2626');

  return (
    <div className="space-y-6">
      {savedMsg && (
        <p role="status" className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1FA36B]">
          {savedMsg}
        </p>
      )}

      {/* My goals */}
      {goals.length > 0 && (
        <section aria-labelledby="mine-heading" className="space-y-4">
          <h2 id="mine-heading" className="text-xl font-bold text-[#102E26]">{t('goal.myGoals')}</h2>
          {goals.map((g) => (
            <article key={g.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-bold text-[#102E26]">{g.name}</h3>
                <span className="rounded-full bg-[#E4FFF2] px-3 py-1 text-xs font-bold text-[#1FA36B]">
                  {g.action} · {g.shape === 'flexible' ? t('goal.flexibleLabel') : t('goal.portionBased')}
                  {g.recurring ? ` · ${t('goal.recurringLabel')}` : ''}
                  {g.reverse ? ` · ${t('goal.reverseLabel')}` : ''}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#5b6b62]">
                {g.range} · {g.portion} · {g.schedule}
              </p>
              <div className="mt-3 flex items-end gap-1" aria-label="Session progress bars">
                {(g.sessions.length > 0 ? g.sessions : [0, 0, 0, 0, 0, 0, 0]).map((v, i) => (
                  <span
                    key={i}
                    title={v >= 1 ? t('goal.sessionComplete') : v > 0 ? t('goal.sessionProgress') : t('goal.sessionMissed')}
                    className="w-6 rounded-t"
                    style={{ height: `${12 + v * 20}px`, background: barColor(v) }}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-[#5b6b62]">
                Bars: green = session complete, yellow = in progress, red = missed. Tap a bar on
                your progress page for the portion and time spent. Sessions appear here as you practise.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/hifz/recite"
                  className="rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
                >
                  {t('goal.practiseNow')}
                </Link>
                <button
                  type="button"
                  onClick={() => deleteGoal(g.id)}
                  className="text-sm font-semibold text-red-700 underline"
                >
                  {t('goal.deleteGoal')}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

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
                className={`rounded-full px-4 py-2 text-sm font-semibold ${shape === 'flexible' ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB]'}`}
              >
                {t('goal.flexible')}
              </button>
              <button
                type="button"
                aria-pressed={shape === 'portion'}
                onClick={() => setShape('portion')}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${shape === 'portion' ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB]'}`}
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
                className="mt-3 rounded-full bg-[#102E26] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1FA36B]"
              >
                {t('goal.startGoal')}
              </button>
            </article>
          ))}
        </div>
      </section>

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
