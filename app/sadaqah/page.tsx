'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'food', label: 'Food', icon: '🍱', color: '#f59e0b' },
  { id: 'education', label: 'Education', icon: '📚', color: '#8b5cf6' },
  { id: 'masjid', label: 'Masjid', icon: '🕌', color: '#10b981' },
  { id: 'orphan', label: 'Orphan', icon: '👶', color: '#ec4899' },
  { id: 'water', label: 'Water', icon: '💧', color: '#3b82f6' },
  { id: 'medical', label: 'Medical', icon: '🏥', color: '#ef4444' },
  { id: 'clothing', label: 'Clothing', icon: '👕', color: '#6366f1' },
  { id: 'jariyah', label: 'Jariyah', icon: '🌳', color: '#059669' },
  { id: 'general', label: 'General', icon: '❤️', color: '#f43f5e' },
  { id: 'other', label: 'Other', icon: '✨', color: '#a855f7' },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$' }, { code: 'GBP', symbol: '£' },
  { code: 'EUR', symbol: '€' }, { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' }, { code: 'PKR', symbol: '₨' },
  { code: 'SAR', symbol: '﷼' }, { code: 'AED', symbol: 'د.إ' },
  { code: 'MYR', symbol: 'RM' }, { code: 'IDR', symbol: 'Rp' },
  { code: 'BDT', symbol: '৳' }, { code: 'TRY', symbol: '₺' },
  { code: 'INR', symbol: '₹' }, { code: 'NGN', symbol: '₦' },
];

const QUICK_AMOUNTS = [5, 10, 20, 50, 100, 200];

const INSPIRATIONAL_VERSES = [
  { arabic: 'مَّثَلُ ٱلَّذِينَ يُنفِقُونَ أَمْوَٰلَهُمْ فِى سَبِيلِ ٱللَّهِ كَمَثَلِ حَبَّةٍ أَنۢبَتَتْ سَبْعَ سَنَابِلَ فِى كُلِّ سُنۢبُلَةٍ مِّا۟ئَةُ حَبَّةٍ', translation: 'The example of those who spend in the way of Allah is like a seed that grows seven spikes; in each spike is a hundred grains.', source: 'Quran 2:261' },
  { arabic: 'لَن تَنَالُوا۟ ٱلْبِرَّ حَتَّىٰ تُنفِقُوا۟ مِمَّا تُحِبُّونَ', translation: 'You will never attain righteousness until you spend from that which you love.', source: 'Quran 3:92' },
  { arabic: 'وَمَا تُنفِقُوا۟ مِنْ خَيْرٍ فَلِأَنفُسِكُمْ', translation: 'And whatever good you spend is for yourselves.', source: 'Quran 2:272' },
  { arabic: 'ٱلَّذِينَ يُنفِقُونَ أَمْوَٰلَهُم بِٱلَّيْلِ وَٱلنَّهَارِ سِرًّا وَعَلَانِيَةً فَلَهُمْ أَجْرُهُمْ عِندَ رَبِّهِمْ', translation: 'Those who spend their wealth by night and day, privately and publicly — they will have their reward with their Lord.', source: 'Quran 2:274' },
  { arabic: 'وَمَآ أَنفَقْتُم مِّن شَىْءٍ فَهُوَ يُخْلِفُهُ', translation: 'And whatever you spend, He will replace it.', source: 'Quran 34:39' },
  { arabic: 'خُذْ مِنْ أَمْوَٰلِهِمْ صَدَقَةً تُطَهِّرُهُمْ وَتُزَكِّيهِم بِهَا', translation: 'Take from their wealth a charity by which you purify them and cause them increase.', source: 'Quran 9:103' },
];

interface Entry {
  id: number;
  amount: number;
  category: string;
  note: string;
  date: string;
  recipient: string;
  recurring?: boolean;
}

interface Goal {
  type: 'weekly' | 'monthly' | 'yearly';
  amount: number;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
const LS_ENTRIES = 'sadaqah_entries_v2';
const LS_CURRENCY = 'sadaqah_currency';
const LS_GOAL = 'sadaqah_goal';

export default function SadaqahTracker() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currency, setCurrency] = useState('USD');
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('log');
  const [form, setForm] = useState({
    amount: '',
    category: 'general',
    note: '',
    date: new Date().toISOString().split('T')[0],
    recipient: '',
    recurring: false,
  });
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [goal, setGoal] = useState<Goal>({ type: 'monthly', amount: 100 });
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest'>('newest');

  // ── Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_ENTRIES);
      if (saved) setEntries(JSON.parse(saved));
      const savedCurr = localStorage.getItem(LS_CURRENCY);
      if (savedCurr) setCurrency(savedCurr);
      const savedGoal = localStorage.getItem(LS_GOAL);
      if (savedGoal) setGoal(JSON.parse(savedGoal));
    } catch {}
  }, []);

  // ── Save
  useEffect(() => {
    try { localStorage.setItem(LS_ENTRIES, JSON.stringify(entries)); } catch {}
  }, [entries]);
  useEffect(() => {
    try { localStorage.setItem(LS_CURRENCY, currency); } catch {}
  }, [currency]);
  useEffect(() => {
    try { localStorage.setItem(LS_GOAL, JSON.stringify(goal)); } catch {}
  }, [goal]);

  const sym = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

  // ── CRUD operations
  const addOrUpdateEntry = () => {
    if (!form.amount || isNaN(Number(form.amount))) return;
    const amount = parseFloat(form.amount);
    if (editingEntry) {
      setEntries(prev => prev.map(e => (e.id === editingEntry.id ? { ...e, ...form, amount, recurring: form.recurring } : e)));
      setEditingEntry(null);
    } else {
      const newEntry: Entry = { id: Date.now(), ...form, amount, recurring: form.recurring };
      setEntries(prev => [newEntry, ...prev]);
    }
    setForm({ amount: '', category: 'general', note: '', date: new Date().toISOString().split('T')[0], recipient: '', recurring: false });
    setShowForm(false);
  };

  const deleteEntry = (id: number) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    setConfirmDelete(null);
  };

  const startEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setForm({ amount: entry.amount.toString(), category: entry.category, note: entry.note, date: entry.date, recipient: entry.recipient, recurring: entry.recurring || false });
    setShowForm(true);
  };

  // ── Statistics
  const now = new Date();
  const totalAll = entries.reduce((sum, e) => sum + e.amount, 0);
  const thisMonth = entries.filter(e => e.date.startsWith(now.toISOString().slice(0, 7))).reduce((sum, e) => sum + e.amount, 0);
  const thisYear = entries.filter(e => e.date.startsWith(now.getFullYear().toString())).reduce((sum, e) => sum + e.amount, 0);
  const thisWeek = useMemo(() => {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    return entries.filter(e => e.date >= weekStartStr).reduce((sum, e) => sum + e.amount, 0);
  }, [entries, now]);

  // Streak
  const streak = useMemo(() => {
    const uniqueDays = new Set(entries.map(e => e.date));
    let count = 0;
    let checkDay = now.toISOString().split('T')[0];
    while (uniqueDays.has(checkDay)) {
      count++;
      const d = new Date(checkDay);
      d.setDate(d.getDate() - 1);
      checkDay = d.toISOString().split('T')[0];
    }
    return count;
  }, [entries, now]);

  // Goal progress
  const goalProgress = useMemo(() => {
    let current = 0;
    if (goal.type === 'weekly') current = thisWeek;
    else if (goal.type === 'monthly') current = thisMonth;
    else current = thisYear;
    return Math.min(100, goal.amount > 0 ? (current / goal.amount) * 100 : 0);
  }, [goal, thisWeek, thisMonth, thisYear]);

  const goalCurrent = goal.type === 'weekly' ? thisWeek : goal.type === 'monthly' ? thisMonth : thisYear;

  // Category breakdown
  const categoryBreakdown = useMemo(() =>
    CATEGORIES.map(cat => ({
      ...cat,
      total: entries.filter(e => e.category === cat.id).reduce((sum, e) => sum + e.amount, 0),
      count: entries.filter(e => e.category === cat.id).length,
    })).sort((a, b) => b.total - a.total),
  [entries]);

  // Monthly heatmap data (last 6 months)
  const heatmapData = useMemo(() => {
    const months: { month: string; days: { date: string; amount: number }[] }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toISOString().slice(0, 7);
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const days = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
        const amount = entries.filter(e => e.date === dateStr).reduce((sum, e) => sum + e.amount, 0);
        days.push({ date: dateStr, amount });
      }
      months.push({ month: d.toLocaleDateString('en', { month: 'short', year: 'numeric' }), days });
    }
    return months;
  }, [entries, now]);

  // Filtered & sorted entries
  const displayEntries = useMemo(() => {
    let filtered = filterCategory ? entries.filter(e => e.category === filterCategory) : entries;
    if (sortOrder === 'oldest') return [...filtered].reverse();
    if (sortOrder === 'highest') return [...filtered].sort((a, b) => b.amount - a.amount);
    return filtered;
  }, [entries, filterCategory, sortOrder]);

  // Export
  const exportData = () => {
    const csv = ['Date,Amount,Category,Recipient,Note', ...entries.map(e => `${e.date},${e.amount},${e.category},"${e.recipient}","${e.note}"`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `sadaqah-tracker-${now.toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Daily verse
  const dailyVerse = useMemo(() => {
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    return INSPIRATIONAL_VERSES[dayOfYear % INSPIRATIONAL_VERSES.length];
  }, [now]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans">
      {/* Header */}
      <header className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white px-4 pt-5 pb-6 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="max-w-2xl mx-auto relative">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors">
              <span>←</span> Home
            </Link>
            <h1 className="text-lg font-bold flex items-center gap-2">❤️ Sadaqah Tracker</h1>
            <button onClick={() => setShowCurrencyPicker(!showCurrencyPicker)} className="bg-white/15 backdrop-blur-sm text-white text-xs rounded-full px-3 py-1.5 border border-white/20 hover:bg-white/25 transition-all">
              {sym} {currency}
            </button>
          </div>

          {/* Currency picker dropdown */}
          {showCurrencyPicker && (
            <div className="absolute right-4 top-12 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 z-50 grid grid-cols-3 gap-1 w-64 animate-slideUp">
              {CURRENCIES.map(c => (
                <button key={c.code} onClick={() => { setCurrency(c.code); setShowCurrencyPicker(false); }}
                  className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${currency === c.code ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  {c.symbol} {c.code}
                </button>
              ))}
            </div>
          )}

          {/* Total banner */}
          <div className="text-center mb-5">
            <p className="text-white/50 text-xs mb-1 uppercase tracking-wider">Total Sadaqah Given</p>
            <p className="text-4xl sm:text-5xl font-bold tracking-tight">{sym}{totalAll.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            <p className="text-white/40 text-xs mt-1">{entries.length} donation{entries.length !== 1 ? 's' : ''} recorded</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'This Week', value: thisWeek },
              { label: 'This Month', value: thisMonth },
              { label: 'This Year', value: thisYear },
              { label: 'Streak', value: null, display: `${streak}🔥` },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center border border-white/5">
                <p className="text-sm sm:text-base font-bold">{s.display || `${sym}${s.value!.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</p>
                <p className="text-white/50 text-[10px] sm:text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Goal Progress */}
      <div className="max-w-2xl mx-auto px-4 -mt-3 relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)} Goal
              </span>
            </div>
            <button onClick={() => setShowGoalEditor(!showGoalEditor)} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
              {showGoalEditor ? 'Done' : 'Edit'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700 ease-out" style={{
                  width: `${goalProgress}%`,
                  background: goalProgress >= 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #059669, #10b981)',
                }} />
              </div>
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 min-w-[60px] text-right">
              {goalProgress >= 100 ? '✅' : `${Math.round(goalProgress)}%`}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {sym}{goalCurrent.toLocaleString(undefined, { maximumFractionDigits: 0 })} of {sym}{goal.amount.toLocaleString()} target
            {goalProgress >= 100 && ' — MashaAllah! Goal reached! 🎉'}
          </p>

          {showGoalEditor && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-2 items-center animate-slideUp">
              <select value={goal.type} onChange={e => setGoal(g => ({ ...g, type: e.target.value as Goal['type'] }))}
                className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-gray-50 dark:bg-gray-700 dark:text-gray-200">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">{sym}</span>
                <input type="number" value={goal.amount} onChange={e => setGoal(g => ({ ...g, amount: Number(e.target.value) || 0 }))}
                  className="w-20 text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-gray-50 dark:bg-gray-700 dark:text-gray-200" />
              </div>
              <div className="flex gap-1">
                {[50, 100, 200, 500].map(a => (
                  <button key={a} onClick={() => setGoal(g => ({ ...g, amount: a }))}
                    className={`text-xs px-2 py-1 rounded-lg border transition-all ${goal.amount === a ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Inspiration */}
      <div className="max-w-2xl mx-auto px-4 mt-4">
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-2xl p-4 text-white shadow-lg">
          <p className="text-right text-lg sm:text-xl leading-relaxed mb-2 opacity-90" style={{ fontFamily: "'Amiri', serif" }}>
            {dailyVerse.arabic}
          </p>
          <p className="text-white/70 text-xs italic">"{dailyVerse.translation}"</p>
          <p className="text-white/40 text-[10px] mt-1">{dailyVerse.source}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-1.5 gap-1 shadow-sm">
          {[
            { id: 'log', label: '📋 History' },
            { id: 'breakdown', label: '📊 Insights' },
            { id: 'heatmap', label: '🗓️ Calendar' },
            { id: 'inspire', label: '✨ Inspire' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-[11px] sm:text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-emerald-800 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4 pb-28">

        {/* LOG TAB */}
        {activeTab === 'log' && (
          <>
            {/* Filters */}
            {entries.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1 flex-1 overflow-x-auto pb-1">
                  <button onClick={() => setFilterCategory(null)}
                    className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${!filterCategory ? 'bg-emerald-800 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    All
                  </button>
                  {CATEGORIES.filter(c => entries.some(e => e.category === c.id)).map(cat => (
                    <button key={cat.id} onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                      className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${filterCategory === cat.id ? 'bg-emerald-800 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
                <select value={sortOrder} onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
                  className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-200">
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="highest">Highest</option>
                </select>
              </div>
            )}

            {entries.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-6xl mb-4">❤️</p>
                <p className="text-gray-600 dark:text-gray-300 font-medium mb-1 text-lg">No sadaqah logged yet</p>
                <p className="text-gray-400 text-sm mb-4">Every act of goodness is sadaqah</p>
                <button onClick={() => setShowForm(true)} className="bg-emerald-800 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-emerald-700 transition-all shadow-lg">
                  + Log Your First Sadaqah
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayEntries.map(entry => {
                  const cat = CATEGORIES.find(c => c.id === entry.category);
                  return (
                    <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-3 group hover:shadow-md transition-all">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${cat?.color}15` }}>
                        {cat?.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{sym}{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${cat?.color}15`, color: cat?.color }}>
                            {cat?.label}
                          </span>
                          {entry.recurring && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300">🔄</span>}
                        </div>
                        {entry.recipient && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">To: {entry.recipient}</p>}
                        {entry.note && <p className="text-[11px] text-gray-400 truncate">{entry.note}</p>}
                        <p className="text-[10px] text-gray-300 dark:text-gray-500 mt-0.5">
                          {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(entry)} className="text-gray-400 hover:text-emerald-600 text-sm p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700" aria-label="Edit">✏️</button>
                        {confirmDelete === entry.id ? (
                          <button onClick={() => deleteEntry(entry.id)} className="text-red-500 text-[10px] p-1 rounded-lg bg-red-50 dark:bg-red-900 font-medium">Sure?</button>
                        ) : (
                          <button onClick={() => setConfirmDelete(entry.id)} className="text-gray-400 hover:text-red-500 text-sm p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700" aria-label="Delete">🗑️</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {entries.length > 0 && (
              <button onClick={exportData} className="w-full text-center text-xs text-emerald-600 dark:text-emerald-400 hover:underline py-2">
                📥 Export as CSV
              </button>
            )}
          </>
        )}

        {/* BREAKDOWN TAB */}
        {activeTab === 'breakdown' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-lg">📊 Category Breakdown</h3>
              {categoryBreakdown.filter(c => c.total > 0).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No data yet — start logging sadaqah!</p>
              ) : (
                <div className="space-y-4">
                  {categoryBreakdown.filter(c => c.total > 0).map(cat => (
                    <div key={cat.id}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                          <span className="text-lg">{cat.icon}</span>{cat.label}
                        </span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{sym}{cat.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(cat.total / totalAll) * 100}%`, background: cat.color }} />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">{cat.count} donation{cat.count !== 1 ? 's' : ''} · {((cat.total / totalAll) * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-lg">📈 Summary</h3>
              <div className="space-y-0">
                {[
                  { label: 'Total (all time)', value: `${sym}${totalAll.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                  { label: 'This week', value: `${sym}${thisWeek.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                  { label: 'This month', value: `${sym}${thisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                  { label: 'This year', value: `${sym}${thisYear.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                  { label: 'Total entries', value: `${entries.length}` },
                  { label: 'Average donation', value: entries.length ? `${sym}${(totalAll / entries.length).toFixed(2)}` : '-' },
                  { label: 'Largest donation', value: entries.length ? `${sym}${Math.max(...entries.map(e => e.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-' },
                  { label: 'Current streak', value: `${streak} day${streak !== 1 ? 's' : ''} 🔥` },
                  { label: 'Categories used', value: `${new Set(entries.map(e => e.category)).size}` },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between py-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{row.label}</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* HEATMAP TAB */}
        {activeTab === 'heatmap' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-lg">🗓️ Giving Calendar</h3>
            <p className="text-xs text-gray-400 mb-4">Last 6 months — darker = more given that day</p>
            <div className="space-y-4">
              {heatmapData.map((month) => (
                <div key={month.month}>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{month.month}</p>
                  <div className="flex flex-wrap gap-[3px]">
                    {month.days.map((day) => {
                      const maxDay = Math.max(...month.days.map(d => d.amount), 1);
                      const intensity = day.amount > 0 ? Math.max(0.2, day.amount / maxDay) : 0;
                      const today = day.date === now.toISOString().split('T')[0];
                      return (
                        <div key={day.date} title={`${day.date}: ${sym}${day.amount.toFixed(2)}`}
                          className="rounded-sm transition-all hover:scale-150 hover:z-10"
                          style={{
                            width: 14, height: 14,
                            background: day.amount > 0 ? `rgba(16, 185, 129, ${intensity})` : 'rgba(0,0,0,0.04)',
                            border: today ? '2px solid #10b981' : 'none',
                          }} />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4 justify-end">
              <span className="text-[10px] text-gray-400">Less</span>
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((i) => (
                <div key={i} className="w-3 h-3 rounded-sm" style={{ background: i === 0 ? 'rgba(0,0,0,0.04)' : `rgba(16, 185, 129, ${i})` }} />
              ))}
              <span className="text-[10px] text-gray-400">More</span>
            </div>
          </div>
        )}

        {/* INSPIRE TAB */}
        {activeTab === 'inspire' && (
          <div className="space-y-4">
            {INSPIRATIONAL_VERSES.map((verse, i) => (
              <div key={i} className="bg-gradient-to-br from-emerald-900 to-teal-800 text-white rounded-2xl p-5 shadow-lg">
                <p className="text-xl sm:text-2xl leading-loose text-right mb-3 opacity-90" style={{ fontFamily: "'Amiri', serif" }}>{verse.arabic}</p>
                <p className="text-white/75 text-sm italic mb-2">"{verse.translation}"</p>
                <p className="text-white/40 text-xs">{verse.source}</p>
              </div>
            ))}

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3 text-lg">💡 Types of Sadaqah</h3>
              <div className="space-y-3">
                {[
                  { icon: '😊', title: 'A smile', desc: 'Smiling at your brother is sadaqah — Prophet ﷺ' },
                  { icon: '🌳', title: 'Sadaqah Jariyah', desc: 'Ongoing charity — plant a tree, build a well, teach knowledge' },
                  { icon: '💬', title: 'Good words', desc: 'A kind word is sadaqah — Prophet ﷺ' },
                  { icon: '🤝', title: 'Helping others', desc: 'Removing harm from the road is sadaqah' },
                  { icon: '💧', title: 'Water', desc: 'Giving water to the thirsty is one of the best sadaqah' },
                  { icon: '📖', title: 'Teaching', desc: 'Sharing beneficial knowledge is ongoing sadaqah' },
                  { icon: '🤲', title: 'Dua', desc: 'Making dua for your brother in his absence' },
                ].map((t, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-2xl">{t.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 text-center">
              <p className="text-2xl mb-2" style={{ fontFamily: "'Amiri', serif" }}>رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 italic">"Our Lord, accept from us. Indeed, You are the Hearing, the Knowing."</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">— Quran 2:127</p>
            </div>
          </div>
        )}
      </main>

      {/* Floating add button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-30">
        <button onClick={() => { setEditingEntry(null); setForm({ amount: '', category: 'general', note: '', date: new Date().toISOString().split('T')[0], recipient: '', recurring: false }); setShowForm(true); }}
          className="shadow-2xl text-white font-semibold px-8 py-4 rounded-full flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 transition-all active:scale-95 hover:shadow-emerald-200/50">
          <span className="text-lg">+</span> Log Sadaqah
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg">
                {editingEntry ? '✏️ Edit Sadaqah' : '❤️ Log New Sadaqah'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">×</button>
            </div>

            {/* Quick amounts */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 block">Quick Amount</label>
              <div className="flex gap-2 flex-wrap">
                {QUICK_AMOUNTS.map(a => (
                  <button key={a} onClick={() => setForm(f => ({ ...f, amount: a.toString() }))}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${form.amount === a.toString() ? 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    {sym}{a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Amount ({sym})</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 bg-gray-50 dark:bg-gray-700 dark:text-gray-100" autoFocus />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 block">Category</label>
              <div className="grid grid-cols-5 gap-1.5">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                    className={`py-2.5 px-1 rounded-xl border text-center transition-all ${form.category === cat.id ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900 shadow-sm scale-105' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                    <p className="text-lg mb-0.5">{cat.icon}</p>
                    <p className="text-[10px] font-medium text-gray-600 dark:text-gray-300">{cat.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Recipient (optional)</label>
              <input type="text" value={form.recipient} onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))} placeholder="e.g. Local masjid, UNICEF, neighbour..."
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 bg-gray-50 dark:bg-gray-700 dark:text-gray-100" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Note (optional)</label>
              <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Any notes..."
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 bg-gray-50 dark:bg-gray-700 dark:text-gray-100" />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 bg-gray-50 dark:bg-gray-700 dark:text-gray-100" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Recurring</span>
                </label>
              </div>
            </div>

            <button onClick={addOrUpdateEntry} disabled={!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0}
              className="w-full py-4 rounded-2xl text-white font-semibold text-base bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-[0.98]">
              {editingEntry ? '✏️ Update Sadaqah' : '❤️ Log Sadaqah'}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
