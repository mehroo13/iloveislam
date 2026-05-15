'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  { id: 'food', label: 'Food', icon: '🍱' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'masjid', label: 'Masjid', icon: '🕌' },
  { id: 'orphan', label: 'Orphan', icon: '👶' },
  { id: 'water', label: 'Water', icon: '💧' },
  { id: 'medical', label: 'Medical', icon: '🏥' },
  { id: 'general', label: 'General', icon: '❤️' },
  { id: 'other', label: 'Other', icon: '✨' },
];

const CURRENCIES = [
  'USD $', 'GBP £', 'EUR €', 'AUD $', 'PKR ₨', 'SAR ﷼', 'AED د.إ',
];

interface Entry {
  id: number;
  amount: number;
  category: string;
  note: string;
  date: string;
  recipient: string;
}

export default function SadaqahTracker() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currency, setCurrency] = useState('USD $');
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('log');
  const [form, setForm] = useState({
    amount: '',
    category: 'general',
    note: '',
    date: new Date().toISOString().split('T')[0],
    recipient: '',
  });
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sadaqah_entries_v2');
      if (saved) setEntries(JSON.parse(saved));
      const savedCurr = localStorage.getItem('sadaqah_currency');
      if (savedCurr) setCurrency(savedCurr);
    }
  }, []);

  // Save
  useEffect(() => {
    if (entries.length || typeof window !== 'undefined') {
      localStorage.setItem('sadaqah_entries_v2', JSON.stringify(entries));
    }
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('sadaqah_currency', currency);
  }, [currency]);

  const addOrUpdateEntry = () => {
    if (!form.amount || isNaN(Number(form.amount))) return;
    const amount = parseFloat(form.amount);
    if (editingEntry) {
      setEntries(prev =>
        prev.map(e => (e.id === editingEntry.id ? { ...e, ...form, amount } : e))
      );
      setEditingEntry(null);
    } else {
      const newEntry: Entry = {
        id: Date.now(),
        ...form,
        amount,
      };
      setEntries(prev => [newEntry, ...prev]);
    }
    setForm({
      amount: '',
      category: 'general',
      note: '',
      date: new Date().toISOString().split('T')[0],
      recipient: '',
    });
    setShowForm(false);
  };

  const deleteEntry = (id: number) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const startEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setForm({
      amount: entry.amount.toString(),
      category: entry.category,
      note: entry.note,
      date: entry.date,
      recipient: entry.recipient,
    });
    setShowForm(true);
  };

  // ── Statistics ──
  const totalAll = entries.reduce((sum, e) => sum + e.amount, 0);
  const now = new Date();
  const thisMonth = entries
    .filter(e => e.date.startsWith(now.toISOString().slice(0, 7)))
    .reduce((sum, e) => sum + e.amount, 0);
  const thisYear = entries
    .filter(e => e.date.startsWith(now.getFullYear().toString()))
    .reduce((sum, e) => sum + e.amount, 0);

  // Streak – days this week with at least one sadaqah
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const uniqueDays = new Set(entries.map(e => e.date));
  let streak = 0;
  let checkDay = todayStr;
  while (uniqueDays.has(checkDay)) {
    streak++;
    const d = new Date(checkDay);
    d.setDate(d.getDate() - 1);
    checkDay = d.toISOString().split('T')[0];
  }

  const categoryBreakdown = CATEGORIES.map(cat => ({
    ...cat,
    total: entries.filter(e => e.category === cat.id).reduce((sum, e) => sum + e.amount, 0),
    count: entries.filter(e => e.category === cat.id).length,
  })).sort((a, b) => b.total - a.total);

  const sym = currency.split(' ')[1] || '$';

  // Shared card style
  const card = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-5';

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50/30 font-serif">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white px-4 py-5 shadow-lg sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between mb-3">
          <Link href="/" className="text-white/70 hover:text-white text-sm flex items-center gap-1">
            <span>←</span> Back
          </Link>
          <h1 className="text-xl font-bold">❤️ Sadaqah Tracker</h1>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-white/20 backdrop-blur-sm text-white text-xs rounded-full px-3 py-1.5 border border-white/30 focus:outline-none"
          >
            {CURRENCIES.map(c => (
              <option key={c} value={c} className="text-gray-800">{c}</option>
            ))}
          </select>
        </div>

        {/* Total banner */}
        <div className="max-w-2xl mx-auto text-center mb-4">
          <p className="text-white/60 text-xs mb-1">Total Sadaqah Given</p>
          <p className="text-4xl font-bold">{sym}{totalAll.toFixed(2)}</p>
          <p className="text-white/50 text-xs mt-1">{entries.length} donations recorded</p>
        </div>

        {/* Stats bar */}
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-lg font-bold">{sym}{thisMonth.toFixed(0)}</p>
            <p className="text-white/60 text-xs">This Month</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-lg font-bold">{sym}{thisYear.toFixed(0)}</p>
            <p className="text-white/60 text-xs">This Year</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-lg font-bold">{streak}🔥</p>
            <p className="text-white/60 text-xs">Day Streak</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex bg-white rounded-2xl border border-gray-100 p-1.5 gap-1 shadow-sm">
          {[
            { id: 'log', label: '📋 History' },
            { id: 'breakdown', label: '📊 Breakdown' },
            { id: 'inspire', label: '✨ Inspire' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-900 text-white shadow'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4 pb-24">
        {/* LOG TAB */}
        {activeTab === 'log' && (
          <>
            {entries.length === 0 && (
              <div className="text-center py-16">
                <p className="text-5xl mb-4">❤️</p>
                <p className="text-gray-600 font-medium mb-1">No sadaqah logged yet</p>
                <p className="text-gray-400 text-sm">Every act of goodness is sadaqah</p>
              </div>
            )}
            <div className="space-y-3">
              {entries.map(entry => {
                const cat = CATEGORIES.find(c => c.id === entry.category);
                return (
                  <div key={entry.id} className={`${card} flex items-center gap-4 group`}>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-2xl flex-shrink-0">
                      {cat?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-lg">
                          {sym}{entry.amount.toFixed(2)}
                        </p>
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                          {cat?.label}
                        </span>
                      </div>
                      {entry.recipient && (
                        <p className="text-sm text-gray-500 truncate">To: {entry.recipient}</p>
                      )}
                      {entry.note && (
                        <p className="text-xs text-gray-400 truncate">{entry.note}</p>
                      )}
                      <p className="text-xs text-gray-300 mt-1">
                        {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(entry)}
                        className="text-gray-400 hover:text-emerald-600"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* BREAKDOWN TAB */}
        {activeTab === 'breakdown' && (
          <>
            <div className={card}>
              <h3 className="font-semibold text-gray-800 mb-4 text-lg">By Category</h3>
              {categoryBreakdown.filter(c => c.total > 0).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-4">
                  {categoryBreakdown
                    .filter(c => c.total > 0)
                    .map(cat => (
                      <div key={cat.id}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <span className="text-xl">{cat.icon}</span>
                            {cat.label}
                          </span>
                          <span className="text-sm font-semibold text-gray-800">
                            {sym}{cat.total.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-full transition-all duration-500"
                            style={{ width: `${(cat.total / totalAll) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {cat.count} donation{cat.count !== 1 ? 's' : ''} ·{' '}
                          {((cat.total / totalAll) * 100).toFixed(1)}%
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className={card}>
              <h3 className="font-semibold text-gray-800 mb-4 text-lg">Summary</h3>
              <div className="space-y-2">
                {[
                  { label: 'Total (all time)', value: `${sym}${totalAll.toFixed(2)}` },
                  { label: 'This month', value: `${sym}${thisMonth.toFixed(2)}` },
                  { label: 'This year', value: `${sym}${thisYear.toFixed(2)}` },
                  { label: 'Total entries', value: entries.length },
                  { label: 'Average donation', value: entries.length ? `${sym}${(totalAll / entries.length).toFixed(2)}` : '-' },
                  { label: 'Current streak', value: `${streak} day${streak !== 1 ? 's' : ''} 🔥` },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="flex justify-between py-2.5 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-sm text-gray-500">{row.label}</span>
                    <span className="text-sm font-semibold text-gray-800">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* INSPIRE TAB */}
        {activeTab === 'inspire' && (
          <div className="space-y-4">
            {[
              {
                arabic:
                  'مَّثَلُ ٱلَّذِينَ يُنفِقُونَ أَمْوَٰلَهُمْ فِى سَبِيلِ ٱللَّهِ كَمَثَلِ حَبَّةٍ أَنۢبَتَتْ سَبْعَ سَنَابِلَ',
                translation:
                  'The example of those who spend their wealth in the way of Allah is like a seed that grows seven spikes',
                source: 'Quran 2:261',
              },
              {
                arabic:
                  'ٱلَّذِينَ يُنفِقُونَ أَمْوَٰلَهُم بِٱلَّيْلِ وَٱلنَّهَارِ سِرًّا وَعَلَانِيَةً',
                translation:
                  'Those who spend their wealth by night and day, privately and publicly',
                source: 'Quran 2:274',
              },
              {
                arabic:
                  'وَمَا تُنفِقُوا۟ مِنْ خَيْرٍ فَلِأَنفُسِكُمْ',
                translation:
                  'And whatever good you spend is for yourselves',
                source: 'Quran 2:272',
              },
            ].map((verse, i) => (
              <div
                key={i}
                className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white rounded-2xl p-6 shadow-lg"
              >
                <p className="text-2xl leading-loose text-right mb-4 font-arabic">
                  {verse.arabic}
                </p>
                <p className="text-white/80 text-sm italic mb-2">
                  “{verse.translation}...”
                </p>
                <p className="text-white/50 text-xs">{verse.source}</p>
              </div>
            ))}

            <div className={card}>
              <h3 className="font-semibold text-gray-800 mb-3 text-lg">💡 Types of Sadaqah</h3>
              <div className="space-y-3">
                {[
                  { icon: '😊', title: 'A smile', desc: 'Smiling at your brother is sadaqah' },
                  { icon: '🌳', title: 'Sadaqah Jariyah', desc: 'Ongoing charity — plant a tree, build a well, teach knowledge' },
                  { icon: '💬', title: 'Good words', desc: 'A kind word is sadaqah' },
                  { icon: '🤝', title: 'Helping others', desc: 'Removing harm from the road is sadaqah' },
                  { icon: '💧', title: 'Water', desc: 'Giving water to the thirsty is one of the best sadaqah' },
                ].map((t, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-2xl">{t.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t.title}</p>
                      <p className="text-xs text-gray-500">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={card}>
              <h3 className="font-semibold text-gray-800 mb-3 text-lg">🤲 Dua for Charity</h3>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-arabic text-emerald-800 mb-2">
                  رَبَّنَا تَقَبَّلْ مِنَّا
                </p>
                <p className="text-sm text-emerald-700 italic">
                  "Our Lord, accept from us. Indeed, You are the Hearing, the Knowing."
                </p>
                <p className="text-xs text-emerald-600 mt-1">— Quran 2:127</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating add button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-30">
        <button
          onClick={() => {
            setEditingEntry(null);
            setForm({
              amount: '',
              category: 'general',
              note: '',
              date: new Date().toISOString().split('T')[0],
              recipient: '',
            });
            setShowForm(true);
          }}
          className="shadow-2xl text-white font-semibold px-8 py-4 rounded-full flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 transition active:scale-95"
        >
          + Log Sadaqah
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center backdrop-blur-sm"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl p-6 space-y-4 shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-gray-800 text-lg">
                {editingEntry ? 'Edit Sadaqah' : 'Log New Sadaqah'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Amount ({sym})
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-gray-50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block">
                Category
              </label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                    className={`py-3 px-1 rounded-xl border text-center text-xs transition-all ${
                      form.category === cat.id
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <p className="text-xl mb-0.5">{cat.icon}</p>
                    <p className="font-medium">{cat.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Recipient (optional)
              </label>
              <input
                type="text"
                value={form.recipient}
                onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))}
                placeholder="e.g. Local masjid, UNICEF, neighbour..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-gray-50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Note (optional)
              </label>
              <input
                type="text"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Any notes..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-gray-50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-gray-50"
              />
            </div>

            <button
              onClick={addOrUpdateEntry}
              disabled={!form.amount || isNaN(Number(form.amount))}
              className="w-full py-4 rounded-2xl text-white font-semibold text-base bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {editingEntry ? '✏️ Update Sadaqah' : '❤️ Log Sadaqah'}
            </button>
          </div>
        </div>
      )}

      {/* Animation for modal */}
      <style jsx>{`
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}