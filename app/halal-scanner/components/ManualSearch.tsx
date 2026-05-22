'use client';

// app/halal-scanner/components/ManualSearch.tsx
// Search by product name or type in ingredients manually

import { useState, useCallback, useRef } from 'react';
import { searchByName, type OpenFoodFactsProduct } from '@/lib/openFoodFacts';

interface ManualSearchProps {
  onProduct: (product: OpenFoodFactsProduct, ingredients: string[]) => void;
  onManualIngredients: (ingredients: string[]) => void;
  isLoading: boolean;
}

export default function ManualSearch({ onProduct, onManualIngredients, isLoading }: ManualSearchProps) {
  const [query, setQuery] = useState('');
  const [ingredientText, setIngredientText] = useState('');
  const [mode, setMode] = useState<'product' | 'ingredients'>('product');
  const [results, setResults] = useState<{ product: OpenFoodFactsProduct; ingredients: string[] }[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
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
      setResults(res);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

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
    onManualIngredients(ingredients);
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
              placeholder="e.g. Nutella, Doritos, Kit Kat..."
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

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => r.product && onProduct(r.product, r.ingredients)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-emerald-100 dark:border-emerald-800 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-left group"
                >
                  {r.product?.image_front_url ? (
                    <img
                      src={r.product.image_front_url}
                      alt={r.product.product_name}
                      className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                      🛒
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate group-hover:text-emerald-700">
                      {r.product?.product_name || 'Unknown Product'}
                    </p>
                    {r.product?.brands && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.product.brands}</p>
                    )}
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {r.ingredients.length > 0
                        ? `${r.ingredients.length} ingredients found`
                        : 'Tap to check'}
                    </p>
                  </div>
                  <span className="text-emerald-400 group-hover:text-emerald-600 text-lg">→</span>
                </button>
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
              Paste or type the ingredients list:
            </label>
            <textarea
              value={ingredientText}
              onChange={(e) => setIngredientText(e.target.value)}
              placeholder={`e.g.\nWater, Sugar, Wheat flour, Vegetable oil (palm), Salt, Yeast, E471, Natural flavouring, E202`}
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
            Analyse Ingredients →
          </button>
        </div>
      )}
    </div>
  );
}