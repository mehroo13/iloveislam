// app/hifz/components/BadgesGrid.tsx — badges / achievements display.
// Client-only: renders from a BadgeSnapshot built on My Progress.
// Every badge is free — there is nothing to unlock with payment, and the
// locked state always shows honest progress toward the goal ("12 / 100"),
// never a paywall. Accuracy badges stay locked with a "take a test" hint
// until a Test Mode score has been recorded (see badges.ts).
'use client';

import ToolIcon from '../../components/ToolIcon';
import { useT } from '../lib/i18n';
import {
  BADGES,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  evaluateBadges,
  type BadgeResult,
  type BadgeSnapshot,
} from '../badges';

function BadgeCard({ result, bestTestPct }: { result: BadgeResult; bestTestPct: number | null }) {
  const t = useT();
  const { badge, earned, current, target } = result;
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const needsTest = badge.category === 'accuracy' && bestTestPct === null;
  return (
    <li
      className={`rounded-2xl border p-4 ${
        earned
          ? 'border-[#FFB800] bg-[#FFFBF2] shadow-sm'
          : 'border-[#E5E7EB] bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            earned ? 'bg-[#FFB800] text-white' : 'bg-[#F3F4F6] text-[#9CA3AF]'
          }`}
          aria-hidden="true"
        >
          <ToolIcon name={badge.icon} className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className={`font-bold ${earned ? 'text-[#102E26]' : 'text-[#6B7280]'}`}>
            {badge.name}
          </p>
          <p className="mt-0.5 text-sm text-[#5b6b62]">{badge.description}</p>
        </div>
        {earned && (
          <span className="ml-auto shrink-0 rounded-full bg-[#1FA36B] px-2 py-0.5 text-xs font-bold text-white">
            {t('badge.earned')}
          </span>
        )}
      </div>
      {!earned && (
        <div className="mt-3">
          <div
            className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress toward ${badge.name}`}
          >
            <div className="h-full bg-[#1FA36B]" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-[#5b6b62]">
            {needsTest
              ? t('badge.takeTest')
              : `${current.toLocaleString()} / ${target.toLocaleString()}`}
          </p>
        </div>
      )}
    </li>
  );
}

export default function BadgesGrid({ snapshot }: { snapshot: BadgeSnapshot }) {
  const t = useT();
  const results = evaluateBadges(snapshot);
  const earnedCount = results.filter((r) => r.earned).length;
  const byCategory = new Map<string, BadgeResult[]>();
  for (const r of results) {
    const list = byCategory.get(r.badge.category) ?? [];
    list.push(r);
    byCategory.set(r.badge.category, list);
  }
  // Keep the defined category order even if a category is ever empty.
  const ordered = CATEGORY_ORDER.filter((c) => byCategory.has(c));
  return (
    <section aria-labelledby="badges-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="badges-heading" className="text-xl font-bold text-[#102E26]">
          {t('badge.badges')}
        </h2>
        <p className="text-sm font-semibold text-[#102E26]">
          {earnedCount} {t('common.of')} {BADGES.length} {t('badge.earnedWord')}
        </p>
      </div>
      <p className="mt-1 text-sm text-[#5b6b62]">
        {t('badge.freeNote')}
      </p>
      {earnedCount === 0 && (
        <p className="mt-3 rounded-xl bg-[#FFFBF2] px-4 py-3 text-sm text-[#5b6b62]">
          {t('badge.noneYet')}
        </p>
      )}
      <div className="mt-5 space-y-6">
        {ordered.map((category) => (
          <div key={category}>
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#5b6b62]">
              {CATEGORY_LABELS[category]}
            </h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {(byCategory.get(category) ?? []).map((r) => (
                <BadgeCard key={r.badge.id} result={r} bestTestPct={snapshot.bestTestPct} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
