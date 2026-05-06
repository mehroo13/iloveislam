'use client';
import { useState, useEffect } from 'react';
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

const CURRENCY = ['USD $', 'GBP £', 'EUR €', 'AUD $', 'PKR ₨', 'SAR ﷼', 'AED د.إ'];

export default function SadaqahTracker() {
  const [entries, setEntries] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sadaqah_entries');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [currency, setCurrency] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('sadaqah_currency') || 'USD $';
    return 'USD $';
  });
  const [form, setForm] = useState({ amount: '', category: 'general', note: '', date: new Date().toISOString().split('T')[0], recipient: '' });
  const [activeTab, setActiveTab] = useState('log');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    localStorage.setItem('sadaqah_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('sadaqah_currency', currency);
  }, [currency]);

  function addEntry() {
    if (!form.amount || isNaN(form.amount)) return;
    const entry = { ...form, id: Date.now(), amount: parseFloat(form.amount) };
    setEntries(prev => [entry, ...prev]);
    setForm({ amount: '', category: 'general', note: '', date: new Date().toISOString().split('T')[0], recipient: '' });
    setShowForm(false);
  }

  function deleteEntry(id) {
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  const thisMonth = entries.filter(e => e.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((sum, e) => sum + e.amount, 0);
  const thisYear = entries.filter(e => e.date.startsWith(new Date().getFullYear().toString())).reduce((sum, e) => sum + e.amount, 0);

  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    total: entries.filter(e => e.category === cat.id).reduce((sum, e) => sum + e.amount, 0),
    count: entries.filter(e => e.category === cat.id).length,
  })).filter(c => c.total > 0);

  const sym = currency.split(' ')[1] || '$';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #1a6b4a 100%)' }} className="px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
          <h1 className="text-white font-semibold">❤️ Sadaqah Tracker</h1>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="bg-white/20 text-white text-xs rounded-lg px-2 py-1 border-0 outline-none"
          >
            {CURRENCY.map(c => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}
          </select>
        </div>

        {/* Total banner */}
        <div className="max-w-2xl mx-auto mt-5 text-center">
          <p className="text-white/60 text-xs mb-1">Total Sadaqah Given</p>
          <p className="text-4xl font-bold text-white">{sym}{total.toFixed(2)}</p>
          <p className="text-white/50 text-xs mt-1">{entries.length} donations recorded</p>
        </div>

        {/* Stats */}
        <div className="max-w-2xl mx-auto mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-white font-semibold">{sym}{thisMonth.toFixed(2)}</p>
            <p className="text-white/50 text-xs">This Month</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-white font-semibold">{sym}{thisYear.toFixed(2)}</p>
            <p className="text-white/50 text-xs">This Year</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex bg-white rounded-xl border border-gray-100 p-1 gap-1">
          {[
            { id: 'log', label: '📋 History' },
            { id: 'breakdown', label: '📊 Breakdown' },
            { id: 'inspire', label: '✨ Inspire' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`}
              style={activeTab === tab.id ? { background: '#0a3d2e' } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-32 space-y-4">

        {/* LOG TAB */}
        {activeTab === 'log' && (
          <>
            {entries.length === 0 && !showForm && (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">❤️</p>
                <p className="text-gray-500 text-sm">No donations logged yet</p>
                <p className="text-gray-400 text-xs mt-1">Tap the button below to log your first sadaqah</p>
              </div>
            )}
            {entries.map(entry => {
              const cat = CATEGORIES.find(c => c.id === entry.category);
              return (
                <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: '#f0faf5' }}>
                    {cat?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{sym}{entry.amount.toFixed(2)}</p>
                      <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{cat?.label}</span>
                    </div>
                    {entry.recipient && <p className="text-xs text-gray-500 truncate">To: {entry.recipient}</p>}
                    {entry.note && <p className="text-xs text-gray-400 truncate">{entry.note}</p>}
                    <p className="text-xs text-gray-300 mt-0.5">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <button onClick={() => deleteEntry(entry.id)} className="text-gray-200 hover:text-red-400 text-lg flex-shrink-0">×</button>
                </div>
              );
            })}
          </>
        )}

        {/* BREAKDOWN TAB */}
        {activeTab === 'breakdown' && (
          <>
            {byCategory.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">No data yet — log some donations first!</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="font-semibold text-gray-800 mb-4">By Category</p>
                <div className="space-y-4">
                  {byCategory.sort((a, b) => b.total - a.total).map(cat => (
                    <div key={cat.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-700">{cat.icon} {cat.label}</span>
                        <span className="text-sm font-medium text-gray-800">{sym}{cat.total.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className="h-2 rounded-full" style={{
                          width: `${(cat.total / total) * 100}%`,
                          background: '#0a3d2e'
                        }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{cat.count} donation{cat.count !== 1 ? 's' : ''} · {((cat.total / total) * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-3">Summary</p>
              <div className="space-y-2">
                {[
                  { label: 'Total all time', value: `${sym}${total.toFixed(2)}` },
                  { label: 'This month', value: `${sym}${thisMonth.toFixed(2)}` },
                  { label: 'This year', value: `${sym}${thisYear.toFixed(2)}` },
                  { label: 'Total donations', value: entries.length },
                  { label: 'Average per donation', value: entries.length ? `${sym}${(total / entries.length).toFixed(2)}` : '-' },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500">{row.label}</span>
                    <span className="text-sm font-medium text-gray-800">{row.value}</span>
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
                arabic: 'مَّثَلُ ٱلَّذِينَ يُنفِقُونَ أَمْوَٰلَهُمْ فِى سَبِيلِ ٱللَّهِ كَمَثَلِ حَبَّةٍ أَنۢبَتَتْ سَبْعَ سَنَابِلَ',
                translation: 'The example of those who spend their wealth in the way of Allah is like a seed that grows seven spikes',
                source: 'Quran 2:261'
              },
              {
                arabic: 'ٱلَّذِينَ يُنفِقُونَ أَمْوَٰلَهُم بِٱلَّيْلِ وَٱلنَّهَارِ سِرًّا وَعَلَانِيَةً',
                translation: 'Those who spend their wealth by night and day, privately and publicly',
                source: 'Quran 2:274'
              },
            ].map((verse, i) => (
              <div key={i} style={{ background: 'linear-gradient(135deg, #0a3d2e, #1a5c3a)' }} className="rounded-2xl p-5">
                <p className="font-arabic text-xl text-white/90 text-right leading-loose mb-3">{verse.arabic}</p>
                <p className="text-white/70 text-sm italic leading-relaxed mb-2">"{verse.translation}..."</p>
                <p className="text-white/40 text-xs">{verse.source}</p>
              </div>
            ))}

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-3">💡 Types of Sadaqah</p>
              <div className="space-y-3">
                {[
                  { icon: '😊', title: 'A smile', desc: 'Smiling at your brother is sadaqah' },
                  { icon: '🌳', title: 'Sadaqah Jariyah', desc: 'Ongoing charity — plant a tree, build a well, teach knowledge' },
                  { icon: '💬', title: 'Good words', desc: 'Saying a kind word is sadaqah' },
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
          </div>
        )}
      </main>

      {/* Add Entry Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full max-w-2xl mx-auto rounded-t-3xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <p className="font-semibold text-gray-800">Log Sadaqah</p>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl">×</button>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Amount ({sym})</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-2 block">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                    className={`py-2 px-1 rounded-xl border text-center text-xs transition-all ${form.category === cat.id ? 'border-emerald-300 text-emerald-800' : 'border-gray-100 text-gray-600'}`}
                    style={form.category === cat.id ? { background: '#f0faf5' } : { background: '#fafafa' }}
                  >
                    <p className="text-lg">{cat.icon}</p>
                    <p>{cat.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Recipient (optional)</label>
              <input
                type="text"
                value={form.recipient}
                onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))}
                placeholder="e.g. Local masjid, UNICEF, neighbour..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Note (optional)</label>
              <input
                type="text"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Any notes..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>

            <button
              onClick={addEntry}
              className="w-full py-4 rounded-2xl text-white font-semibold text-base"
              style={{ background: '#0a3d2e' }}
            >
              Log Sadaqah ❤️
            </button>
          </div>
        </div>
      )}

      {/* Floating add button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40">
        <button
          onClick={() => setShowForm(true)}
          className="shadow-xl text-white font-semibold px-8 py-4 rounded-full flex items-center gap-2"
          style={{ background: '#0a3d2e' }}
        >
          + Log Sadaqah
        </button>
      </div>
    </div>
  );
}