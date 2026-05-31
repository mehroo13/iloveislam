'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DUAS, DUA_CATEGORIES, type Dua } from '@/lib/duaDatabase';

const MOODS = [
  { id: 'anxious', label: 'Anxious', emoji: '😰', categories: ['anxiety', 'protection'] },
  { id: 'sad', label: 'Sad', emoji: '😢', categories: ['anxiety', 'forgiveness'] },
  { id: 'grateful', label: 'Grateful', emoji: '🤲', categories: ['morning', 'prayer'] },
  { id: 'sick', label: 'Sick', emoji: '🤒', categories: ['health'] },
  { id: 'scared', label: 'Scared', emoji: '😨', categories: ['protection', 'anxiety'] },
  { id: 'hopeful', label: 'Hopeful', emoji: '🌟', categories: ['prayer', 'rizq'] },
  { id: 'travelling', label: 'Travelling', emoji: '✈️', categories: ['travel'] },
  { id: 'studying', label: 'Studying', emoji: '📚', categories: ['knowledge'] },
];

function loadFavorites(): number[] {
  try { return JSON.parse(localStorage.getItem('dua_favorites') || '[]'); } catch { return []; }
}
function saveFavorites(ids: number[]) {
  try { localStorage.setItem('dua_favorites', JSON.stringify(ids)); } catch {}
}

export default function DuaGenerator() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [fontSize, setFontSize] = useState(1); // 0=S, 1=M, 2=L, 3=XL
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => { setFavorites(loadFavorites()); }, []);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      saveFavorites(next);
      return next;
    });
  };

  // Daily dua — changes each day
  const dailyDua = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return DUAS[dayOfYear % DUAS.length];
  }, []);

  // Filtered duas
  const filtered = useMemo(() => {
    let list = DUAS;
    if (showFavoritesOnly) list = list.filter(d => favorites.includes(d.id));
    if (activeCategory) list = list.filter(d => d.category === activeCategory);
    if (activeMood) {
      const mood = MOODS.find(m => m.id === activeMood);
      if (mood) list = list.filter(d => mood.categories.includes(d.category));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.translation.toLowerCase().includes(q) ||
        d.transliteration.toLowerCase().includes(q) ||
        d.arabic.includes(search) ||
        d.occasion.toLowerCase().includes(q) ||
        d.tags.some(t => t.includes(q))
      );
    }
    return list;
  }, [search, activeCategory, activeMood, showFavoritesOnly, favorites]);

  const copyDua = (dua: Dua) => {
    const text = `${dua.arabic}\n\n${dua.transliteration}\n\n"${dua.translation}"\n\n— ${dua.reference}\n\niloveislam.life/dua`;
    navigator.clipboard?.writeText(text);
    setCopied(dua.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareDua = (dua: Dua) => {
    const text = `${dua.arabic}\n\n"${dua.translation}"\n\n— ${dua.reference}\n\niloveislam.life/dua`;
    if (navigator.share) navigator.share({ title: 'Dua', text });
    else copyDua(dua);
  };

  const clearFilters = () => { setActiveCategory(null); setActiveMood(null); setShowFavoritesOnly(false); setSearch(''); };

  const arabicSizes = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  const transSizes = ['text-xs', 'text-sm', 'text-base', 'text-lg'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #071e14, #0a3d2e)' }} className="px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/50 hover:text-white text-sm">← Home</Link>
          <h1 className="text-white font-bold text-base">🤲 Dua Collection</h1>
          <div className="flex gap-2">
            <button onClick={() => setFontSize(f => Math.min(3, f + 1))} className="text-white/50 hover:text-white text-sm">A+</button>
            <button onClick={() => setFontSize(f => Math.max(0, f - 1))} className="text-white/50 hover:text-white text-sm">A-</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* Daily Dua */}
        <div style={{ background: 'linear-gradient(135deg, #071e14, #0a3d2e)' }} className="rounded-2xl p-5">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">✨ Dua of the Day</p>
          <p className="text-white text-lg font-bold leading-relaxed text-right" dir="rtl" style={{ fontFamily: '"Scheherazade New", serif', lineHeight: 2.2 }}>
            {dailyDua.arabic}
          </p>
          <p className="text-emerald-300/80 text-sm italic mt-2">{dailyDua.translation}</p>
          <p className="text-white/30 text-xs mt-2">— {dailyDua.reference}</p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search duas (e.g. anxiety, forgiveness, morning)..."
            className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          {(search || activeCategory || activeMood || showFavoritesOnly) && (
            <button onClick={clearFilters} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-600 font-semibold">Clear</button>
          )}
        </div>

        {/* Mood selector */}
        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">How are you feeling?</p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {MOODS.map(mood => (
              <button
                key={mood.id}
                onClick={() => { setActiveMood(activeMood === mood.id ? null : mood.id); setActiveCategory(null); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeMood === mood.id
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                <span>{mood.emoji}</span>
                <span>{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Categories</p>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`text-xs font-semibold px-3 py-1 rounded-full transition-all ${
                showFavoritesOnly ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
            >
              ❤️ Favorites ({favorites.length})
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {DUA_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(activeCategory === cat.id ? null : cat.id); setActiveMood(null); }}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-center transition-all ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-emerald-300'
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="text-[10px] font-medium leading-tight">{cat.name}</span>
                <span className="text-[9px] opacity-60">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Showing {filtered.length} dua{filtered.length !== 1 ? 's' : ''}
          {activeCategory && ` in ${DUA_CATEGORIES.find(c => c.id === activeCategory)?.name}`}
          {activeMood && ` for "${MOODS.find(m => m.id === activeMood)?.label}"`}
        </p>

        {/* Dua Cards */}
        <div className="space-y-4">
          {filtered.map(dua => (
            <DuaCard
              key={dua.id}
              dua={dua}
              isFavorite={favorites.includes(dua.id)}
              onToggleFavorite={() => toggleFavorite(dua.id)}
              onCopy={() => copyDua(dua)}
              onShare={() => shareDua(dua)}
              copied={copied === dua.id}
              arabicSize={arabicSizes[fontSize]}
              transSize={transSizes[fontSize]}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🤲</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">No duas found for this filter.</p>
            <button onClick={clearFilters} className="mt-3 text-emerald-600 text-sm font-semibold">Show all duas</button>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 dark:text-gray-600 pb-8">
          All duas from Quran and authenticated Hadith collections
        </p>
      </main>
    </div>
  );
}

// ── Dua Card Component ──
function DuaCard({ dua, isFavorite, onToggleFavorite, onCopy, onShare, copied, arabicSize, transSize }: {
  dua: Dua; isFavorite: boolean; onToggleFavorite: () => void;
  onCopy: () => void; onShare: () => void; copied: boolean;
  arabicSize: string; transSize: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Arabic text */}
      <div className="p-5 pb-3">
        <p className={`${arabicSize} text-gray-800 dark:text-gray-100 text-right leading-[2.4] font-bold`} dir="rtl" style={{ fontFamily: '"Scheherazade New", "Amiri", "Noto Naskh Arabic", serif' }}>
          {dua.arabic}
        </p>
      </div>

      {/* Transliteration */}
      <div className="px-5 pb-2">
        <p className="text-sm text-blue-600 dark:text-blue-400 italic leading-relaxed">
          {dua.transliteration}
        </p>
      </div>

      {/* Translation */}
      <div className="px-5 pb-3">
        <p className={`${transSize} text-gray-600 dark:text-gray-300 leading-relaxed`}>
          {dua.translation}
        </p>
      </div>

      {/* Meta info */}
      <div className="px-5 pb-3 flex flex-wrap gap-2">
        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
          {dua.reference}
        </span>
        <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
          {dua.occasion}
        </span>
        {dua.virtue && (
          <span className="text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
            {dua.virtue.substring(0, 60)}{dua.virtue.length > 60 ? '...' : ''}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-700 flex items-center gap-2">
        <button onClick={onToggleFavorite} className={`text-lg ${isFavorite ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'}`} title="Favorite">
          {isFavorite ? '❤️' : '🤍'}
        </button>
        <button onClick={onCopy} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          {copied ? '✅ Copied' : '📋 Copy'}
        </button>
        <button onClick={onShare} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          📤 Share
        </button>
        <span className="ml-auto text-[9px] text-gray-300 dark:text-gray-600">#{dua.id}</span>
      </div>
    </div>
  );
}
