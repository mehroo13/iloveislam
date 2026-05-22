'use client';

// app/halal-scanner/components/IngredientBreakdown.tsx
// Ingredient-by-ingredient halal/haram/mashbooh breakdown

import { useState } from 'react';
import { type IngredientResult, type HalalStatus } from '@/lib/halalDatabase';

interface IngredientBreakdownProps {
  results: IngredientResult[];
}

const STATUS_CONFIG: Record<HalalStatus | 'unknown', {
  label: string;
  emoji: string;
  labelAr: string;
  bg: string;
  border: string;
  text: string;
  dot: string;
}> = {
  halal: {
    label: 'Halal',
    emoji: '✅',
    labelAr: 'حلال',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-700',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  haram: {
    label: 'Haram',
    emoji: '❌',
    labelAr: 'حرام',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-700',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
  },
  mashbooh: {
    label: 'Mashbooh',
    emoji: '⚠️',
    labelAr: 'مشبوه',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  unknown: {
    label: 'Unknown',
    emoji: '❓',
    labelAr: '—',
    bg: 'bg-gray-50 dark:bg-gray-800/40',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-500 dark:text-gray-400',
    dot: 'bg-gray-400',
  },
};

type FilterTab = 'all' | HalalStatus | 'unknown';

export default function IngredientBreakdown({ results }: IngredientBreakdownProps) {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  if (!results || results.length === 0) return null;

  const counts = {
    all: results.length,
    halal: results.filter((r) => r.status === 'halal').length,
    haram: results.filter((r) => r.status === 'haram').length,
    mashbooh: results.filter((r) => r.status === 'mashbooh').length,
    unknown: results.filter((r) => r.status === 'unknown').length,
  };

  const filtered = filter === 'all' ? results : results.filter((r) => r.status === filter);

  const toggleExpand = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const tabs: { key: FilterTab; label: string; emoji: string; count: number; activeClass: string }[] = [
    { key: 'all', label: 'All', emoji: '📋', count: counts.all, activeClass: 'bg-gray-700 text-white' },
    { key: 'haram', label: 'Haram', emoji: '❌', count: counts.haram, activeClass: 'bg-red-500 text-white' },
    { key: 'mashbooh', label: 'Doubtful', emoji: '⚠️', count: counts.mashbooh, activeClass: 'bg-amber-500 text-white' },
    { key: 'halal', label: 'Halal', emoji: '✅', count: counts.halal, activeClass: 'bg-emerald-600 text-white' },
    { key: 'unknown', label: 'Unknown', emoji: '❓', count: counts.unknown, activeClass: 'bg-gray-400 text-white' },
  ];

  return (
    <div className="w-full mt-4">
      <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
        <span>🧪</span> Ingredient Breakdown
        <span className="ml-1 text-xs font-normal text-gray-400">({results.length} ingredients)</span>
      </h3>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          tab.count > 0 || tab.key === 'all' ? (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === tab.key
                  ? tab.activeClass
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`w-4 h-4 flex items-center justify-center rounded-full text-xs ${
                  filter === tab.key ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ) : null
        ))}
      </div>

      {/* Ingredient list */}
      <div className="space-y-1.5">
        {filtered.map((item, i) => {
          const status = item.status as HalalStatus | 'unknown';
          const cfg = STATUS_CONFIG[status];
          const isExpanded = expanded.has(i);
          const hasDetail = item.matched && (item.matched.reason || item.matched.scholarNote);

          return (
            <div
              key={i}
              className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}
            >
              <div
                className={`flex items-center gap-2.5 px-3 py-2.5 ${hasDetail ? 'cursor-pointer' : ''}`}
                onClick={() => hasDetail && toggleExpand(i)}
              >
                {/* Status dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
                    {item.matched?.name || item.original}
                  </span>
                  {item.matched?.name && item.matched.name.toLowerCase() !== item.original.toLowerCase() && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                      ({item.original})
                    </span>
                  )}
                  {item.matched?.category && (
                    <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                      · {item.matched.category}
                    </span>
                  )}
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.text} ${cfg.bg} border ${cfg.border}`}>
                    {cfg.emoji} {cfg.label}
                  </span>
                  {hasDetail && (
                    <span className={`text-xs ${cfg.text} transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && item.matched && (
                <div className={`px-4 pb-3 pt-0 border-t ${cfg.border} space-y-1.5`}>
                  {item.matched.reason && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      <span className="font-semibold">Reason: </span>
                      {item.matched.reason}
                    </p>
                  )}
                  {item.matched.scholarNote && (
                    <div className="flex items-start gap-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-2">
                      <span className="text-sm">📚</span>
                      <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                        <span className="font-semibold">Scholar Note: </span>
                        {item.matched.scholarNote}
                      </p>
                    </div>
                  )}
                  {item.matched.source && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Source: {item.matched.source}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
          No ingredients in this category.
        </p>
      )}
    </div>
  );
}