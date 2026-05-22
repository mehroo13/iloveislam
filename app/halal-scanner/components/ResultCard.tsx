'use client';

// app/halal-scanner/components/ResultCard.tsx
// Main verdict display card — Halal / Haram / Mashbooh

import { type AnalysisResult } from '@/lib/analyzeIngredients';
import { type OpenFoodFactsProduct } from '@/lib/openFoodFacts';

interface ResultCardProps {
  result: AnalysisResult;
  product?: OpenFoodFactsProduct;
  imageUrl?: string;
  onReset: () => void;
  onSave: () => void;
  saved?: boolean;
}

const VERDICT_CONFIG = {
  halal: {
    emoji: '✅',
    label: 'HALAL',
    labelAr: 'حلال',
    color: 'emerald',
    bgClass: 'from-emerald-500 to-emerald-600',
    lightBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-700',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800/60 dark:text-emerald-300',
    iconBg: 'bg-emerald-500',
  },
  haram: {
    emoji: '❌',
    label: 'HARAM',
    labelAr: 'حرام',
    color: 'red',
    bgClass: 'from-red-500 to-red-600',
    lightBg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-700',
    textClass: 'text-red-700 dark:text-red-300',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-800/60 dark:text-red-300',
    iconBg: 'bg-red-500',
  },
  mashbooh: {
    emoji: '⚠️',
    label: 'MASHBOOH',
    labelAr: 'مشبوه',
    color: 'amber',
    bgClass: 'from-amber-500 to-amber-600',
    lightBg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-700',
    textClass: 'text-amber-700 dark:text-amber-300',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-800/60 dark:text-amber-300',
    iconBg: 'bg-amber-500',
  },
  unknown: {
    emoji: '❓',
    label: 'UNKNOWN',
    labelAr: 'غير معروف',
    color: 'gray',
    bgClass: 'from-gray-500 to-gray-600',
    lightBg: 'bg-gray-50 dark:bg-gray-800/40',
    border: 'border-gray-200 dark:border-gray-700',
    textClass: 'text-gray-700 dark:text-gray-300',
    badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    iconBg: 'bg-gray-500',
  },
};

const CONFIDENCE_LABEL = {
  high: { label: 'High Confidence', stars: '●●●', color: 'text-emerald-600 dark:text-emerald-400' },
  medium: { label: 'Medium Confidence', stars: '●●○', color: 'text-amber-600 dark:text-amber-400' },
  low: { label: 'Low Confidence', stars: '●○○', color: 'text-red-500 dark:text-red-400' },
};

export default function ResultCard({
  result,
  product,
  imageUrl,
  onReset,
  onSave,
  saved = false,
}: ResultCardProps) {
  const config = VERDICT_CONFIG[result.verdict];
  const confidence = CONFIDENCE_LABEL[result.confidence];

  const handleShare = async () => {
    const text = `HalalScan Result for ${product?.product_name || 'Product'}: ${result.verdict.toUpperCase()}\n\n${result.summary}\n\nCheck on iloveislam.life`;
    if (navigator.share) {
      await navigator.share({ title: 'HalalScan Result', text });
    } else {
      await navigator.clipboard.writeText(text);
      alert('Result copied to clipboard!');
    }
  };

  return (
    <div className={`w-full rounded-2xl border ${config.border} overflow-hidden`}>

      {/* Header gradient banner */}
      <div className={`bg-gradient-to-r ${config.bgClass} px-6 py-5 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{config.emoji}</span>
          <div>
            <p className="text-white/80 text-xs font-medium uppercase tracking-widest">Verdict</p>
            <p className="text-white text-2xl font-black tracking-wide">
              {config.label}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/90 text-2xl font-bold" dir="rtl">{config.labelAr}</p>
          <p className={`text-xs font-semibold mt-0.5 ${confidence.color} bg-white/20 px-2 py-0.5 rounded-full`}>
            {confidence.stars} {confidence.label}
          </p>
        </div>
      </div>

      {/* Product info */}
      {(product || imageUrl) && (
        <div className={`px-5 py-3 ${config.lightBg} border-b ${config.border} flex items-center gap-3`}>
          {(imageUrl || product?.image_front_url) && (
            <img
              src={imageUrl || product?.image_front_url}
              alt="Product"
              className="w-14 h-14 object-cover rounded-lg border border-white shadow-sm flex-shrink-0"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 dark:text-gray-200 truncate">
              {product?.product_name || 'Scanned Product'}
            </p>
            {product?.brands && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{product.brands}</p>
            )}
            {product?.quantity && (
              <p className="text-xs text-gray-400 dark:text-gray-500">{product.quantity}</p>
            )}
          </div>
          {result.certifications && result.certifications.length > 0 && (
            <div className="flex-shrink-0">
              {result.certifications.map((cert, i) => (
                <span key={i} className="block text-xs bg-emerald-100 dark:bg-emerald-800/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                  🏅 {cert}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="px-5 py-4">
        <div className={`p-3.5 rounded-xl ${config.lightBg} border ${config.border}`}>
          <p className={`text-sm font-semibold ${config.textClass} leading-relaxed`}>
            {result.summary}
          </p>
        </div>

        {/* Recommendation */}
        <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {result.recommendation}
          </p>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { label: 'Halal', count: result.halalIngredients.length, emoji: '✅', cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' },
            { label: 'Haram', count: result.haramIngredients.length, emoji: '❌', cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' },
            { label: 'Doubtful', count: result.mashboohIngredients.length, emoji: '⚠️', cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' },
            { label: 'Unknown', count: result.unknownIngredients.length, emoji: '❓', cls: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.cls} rounded-xl p-2 text-center`}>
              <p className="text-lg font-black">{stat.count}</p>
              <p className="text-xs font-medium leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-5 pb-5 flex gap-2 flex-wrap">
        <button
          onClick={onReset}
          className="flex-1 min-w-[120px] py-2.5 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold text-sm rounded-xl transition-all"
        >
          ↩ Scan Again
        </button>
        <button
          onClick={onSave}
          disabled={saved}
          className={`flex-1 min-w-[120px] py-2.5 px-4 font-semibold text-sm rounded-xl transition-all ${
            saved
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-default'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {saved ? '✓ Saved' : '💾 Save'}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 min-w-[120px] py-2.5 px-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold text-sm rounded-xl transition-all border border-blue-100 dark:border-blue-800"
        >
          🔗 Share
        </button>
      </div>

      {/* Disclaimer */}
      <div className="px-5 pb-4">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed">
          HalalScan is a tool to assist Muslims. For religious rulings, consult a qualified Islamic scholar.
          Always look for certified halal labels when in doubt.
        </p>
      </div>
    </div>
  );
}