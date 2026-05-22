'use client';

// app/halal-scanner/components/ManualSearch.tsx
// Search by product name or enter ingredients manually – with halal status preview

import { useState, useCallback, useRef } from 'react';
import { searchByName, type OpenFoodFactsProduct } from '@/lib/openFoodFacts';
import { analyzeIngredients } from '@/lib/analyzeIngredients';

interface ManualSearchProps {
  onProduct: (product: OpenFoodFactsProduct, ingredients: string[]) => void;
  onManualIngredients: (ingredients: string[]) => void;
  isLoading: boolean;
}

// Helper to get a quick verdict for display
function getQuickVerdict(ingredientsList: string[]) {
  if (ingredientsList.length === 0) return null;
  const analysis = analyzeIngredients(ingredientsList);
  return {
    verdict: analysis.verdict,
    confidence: analysis.confidence,
  };
}

export default function ManualSearch({ onProduct, onManualIngredients, isLoading }: ManualSearchProps) {
  const [query, setQuery] = useState('');
  const [ingredientText, setIngredientText] = useState('');
  const [mode, setMode] = useState<'product' | 'ingredients'>('product');
  const [results, setResults] = useState<{ 
    product: OpenFoodFactsProduct; 
    ingredients: string[];
    quickVerdict?: { verdict: string; confidence: string };
  }[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [quickAnalyzing, setQuickAnalyzing] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    setSearching(true);
    setSearched(false);

    try {
      const res = await searchByName(q.trim());
      // Filter only valid products and map to our format
      const validResults = res
        .filter((item): item is { found: true; product: OpenFoodFactsProduct; ingredients: string[] } => 
          item.found === true && item.product !== undefined)
        .map(item => ({
          product: item.product,
          ingredients: item.ingredients,
          quickVerdict: undefined, // will be loaded on demand
        }));
      setResults(validResults);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQuickAnalyze = async (index: number, ingredients: string[]) => {
    if (ingredients.length === 0) return;
    setQuickAnalyzing(index);
    // Simulate a small delay for better UX
    await new Promise(r => setTimeout(r, 100));
    const verdict = getQuickVerdict(ingredients);
    setResults(prev => prev.map((r, i) => 
      i === index ? { ...r, quickVerdict: verdict || undefined } : r
    ));
    setQuickAnalyzing(null);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(val), 600);
  };

  const handleIngredientSubmit = () => {
    if (!ingredientText.trim()) return;
    const ingredients = ingredientText
      .split(/[,;\n]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 1);
    if (ingredients.length > 0) {
      onManualIngredients(ingredients);
    }
  };

  const getVerdictBadge = (verdict: string) => {
    switch(verdict) {
      case 'halal': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-800/40 dark:text-emerald-300">✅ Halal</span>;
      case 'haram': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-800/40 dark:text-red-300">❌ Haram</span>;
      case 'mashbooh': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-800/40 dark:text-amber-300">⚠️ Mashbooh</span>;
      default: return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">❓ Unknown</span>;
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Mode toggle */}
      <div className="flex bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-1 gap-1">
        <button
          onClick={() => setMode('product')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            mode === 'product'
              ? 'bg-white dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200 shadow-sm'
              : 'text-emerald-500 dark:text-emerald-400 hover:text-emerald-700'
          }`}
        >
          🔍 Search Product
        </button>
        <button
          onClick={() => setMode('ingredients')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            mode === 'ingredients'
              ? 'bg-white dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200 shadow-sm'
              : 'text-emerald-500 dark:text-emerald-400 hover:text-emerald-700'
          }`}
        >
          📝 Enter Ingredients
        </button>
      </div>

      {/* Product search */}
      {mode === 'product' && (
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="e.g. Nutella, Doritos, Kit Kat, Oreo..."
              disabled={isLoading}
              className="w-full pl-4 pr-12 py-3.5 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition text-sm"
            />
            {searching ? (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            )}
          </div>

          {/* Results with quick halal preview */}
          {results.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((r, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-800 border border-emerald-100 dark:border-emerald-800 rounded-xl overflow-hidden hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-start gap-3 p-3">
                    {/* Product image */}
                    {r.product.image_front_url ? (
                      <img
                        src={r.product.image_front_url}
                        alt={r.product.product_name}
                        className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-100"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    ) : (
                      <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                        🛒
                      </div>
                    )}
                    
                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">
                        {r.product.product_name || 'Unknown Product'}
                      </p>
                      {r.product.brands && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.product.brands}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {/* Quick halal status badge (if already analyzed) */}
                        {r.quickVerdict ? (
                          getVerdictBadge(r.quickVerdict.verdict)
                        ) : r.ingredients.length > 0 ? (
                          <button
                            onClick={() => handleQuickAnalyze(idx, r.ingredients)}
                            disabled={quickAnalyzing === idx}
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            {quickAnalyzing === idx ? (
                              <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              '🔍 Quick Check'
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">No ingredients data</span>
                        )}
                        <button
                          onClick={() => onProduct(r.product, r.ingredients)}
                          className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-full transition-all"
                        >
                          Full Analysis →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searched && results.length === 0 && (
            <div className="text-center py-6">
              <p className="text-4xl mb-2">🔎</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">No products found.</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Try a different name or use the "Enter Ingredients" tab.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual ingredient entry */}
      {mode === 'ingredients' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
              📋 Paste or type the ingredients list:
            </label>
            <textarea
              value={ingredientText}
              onChange={(e) => setIngredientText(e.target.value)}
              placeholder={`Example:\nWater, Sugar, Wheat flour, Vegetable oil (palm), Salt, Yeast, E471, Natural flavouring, E202`}
              rows={5}
              disabled={isLoading}
              className="w-full p-3 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition text-sm resize-none font-mono"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Separate by commas, semicolons, or new lines
            </p>
          </div>

          <button
            onClick={handleIngredientSubmit}
            disabled={!ingredientText.trim() || isLoading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 disabled:dark:bg-gray-700 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-semibold rounded-xl transition-all text-sm"
          >
            {isLoading ? 'Analyzing...' : '🔍 Analyze Ingredients →'}
          </button>
        </div>
      )}
    </div>
  );
}