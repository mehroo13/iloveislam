'use client';

// app/halal-scanner/components/ScanHistory.tsx
// Persisted scan history using localStorage — no login required

import { useEffect, useState } from 'react';
import { type AnalysisResult } from '@/lib/analyzeIngredients';
import { type OpenFoodFactsProduct } from '@/lib/openFoodFacts';

export interface ScanRecord {
  id: string;
  product?: {
    name: string;
    brand?: string;
    imageUrl?: string;
  };
  result: {
    verdict: string;
    confidence: string;
    summary: string;
    haramCount: number;
    mashboohCount: number;
    halalCount: number;
  };
  scannedAt: string;
}

const STORAGE_KEY = 'halalscan_history';
const MAX_HISTORY = 50;

export function saveToHistory(
  analysisResult: AnalysisResult,
  product?: OpenFoodFactsProduct,
  imageUrl?: string
): ScanRecord {
  const record: ScanRecord = {
    id: Date.now().toString(),
    product: product
      ? {
          name: product.product_name || 'Unknown Product',
          brand: product.brands,
          imageUrl: imageUrl || product.image_front_url,
        }
      : undefined,
    result: {
      verdict: analysisResult.verdict,
      confidence: analysisResult.confidence,
      summary: analysisResult.summary,
      haramCount: analysisResult.haramIngredients.length,
      mashboohCount: analysisResult.mashboohIngredients.length,
      halalCount: analysisResult.halalIngredients.length,
    },
    scannedAt: new Date().toISOString(),
  };

  try {
    const existing = loadHistory();
    const updated = [record, ...existing].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  return record;
}

export function loadHistory(): ScanRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

const VERDICT_STYLES: Record<string, { emoji: string; badge: string }> = {
  halal: { emoji: '✅', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  haram: { emoji: '❌', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  mashbooh: { emoji: '⚠️', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  unknown: { emoji: '❓', badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
};

interface ScanHistoryProps {
  refreshTrigger?: number;
}

export default function ScanHistory({ refreshTrigger = 0 }: ScanHistoryProps) {
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
  }, [refreshTrigger]);

  const handleClear = () => {
    if (confirm('Clear all scan history?')) {
      clearHistory();
      setHistory([]);
    }
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-3">📋</div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">No scans yet</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
          Your scan history will appear here
        </p>
      </div>
    );
  }

  const displayed = showAll ? history : history.slice(0, 5);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span>🕐</span> Scan History
          <span className="text-xs font-normal text-gray-400">({history.length})</span>
        </h3>
        <button
          onClick={handleClear}
          className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Records */}
      <div className="space-y-2">
        {displayed.map((record) => {
          const style = VERDICT_STYLES[record.result.verdict] || VERDICT_STYLES.unknown;
          const date = new Date(record.scannedAt);
          const timeAgo = formatTimeAgo(date);

          return (
            <div
              key={record.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
            >
              {/* Product image or emoji */}
              {record.product?.imageUrl ? (
                <img
                  src={record.product.imageUrl}
                  alt={record.product.name}
                  className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-gray-100 dark:border-gray-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                  {style.emoji}
                </div>
              )}

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">
                  {record.product?.name || 'Unknown Product'}
                </p>
                {record.product?.brand && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {record.product.brand}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{timeAgo}</p>
              </div>

              {/* Verdict */}
              <div className="flex-shrink-0 text-right">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.badge}`}>
                  {style.emoji} {record.result.verdict.charAt(0).toUpperCase() + record.result.verdict.slice(1)}
                </span>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {record.result.confidence} confidence
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more / less */}
      {history.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold transition-colors"
        >
          {showAll ? '▲ Show less' : `▼ Show all ${history.length} scans`}
        </button>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}