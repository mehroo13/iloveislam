'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const PRESETS = [
  { name: 'Subhanallah', arabic: 'سُبْحَانَ اللَّهِ', meaning: 'Glory be to Allah', target: 33, color: 'emerald' },
  { name: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', meaning: 'All praise be to Allah', target: 33, color: 'blue' },
  { name: 'Allahu Akbar', arabic: 'اللَّهُ أَكْبَرُ', meaning: 'Allah is the Greatest', target: 33, color: 'purple' },
  { name: 'La ilaha illallah', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', meaning: 'There is no god but Allah', target: 100, color: 'amber' },
  { name: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', meaning: 'I seek forgiveness from Allah', target: 100, color: 'rose' },
  { name: 'Salawat', arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', meaning: 'Blessings upon the Prophet ﷺ', target: 100, color: 'teal' },
];

const COLORS = {
  emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: '#10b981' },
  blue:    { bg: 'bg-blue-500',    light: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    ring: '#3b82f6' },
  purple:  { bg: 'bg-purple-500',  light: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  ring: '#8b5cf6' },
  amber:   { bg: 'bg-amber-500',   light: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   ring: '#f59e0b' },
  rose:    { bg: 'bg-rose-500',    light: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    ring: '#f43f5e' },
  teal:    { bg: 'bg-teal-500',    light: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    ring: '#14b8a6' },
};

export default function DhikrCounter() {
  const [selected, setSelected] = useState(0);
  const [count, setCount] = useState(0);
  const [sessions, setSessions] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const [completed, setCompleted] = useState(false);

  const preset = PRESETS[selected];
  const color = COLORS[preset.color];
  const progress = Math.min((count / preset.target) * 100, 100);

  useEffect(() => {
    setCount(0);
    setSessions(0);
    setCompleted(false);
  }, [selected]);

  const handleCount = () => {
    const newCount = count + 1;
    setCount(newCount);
    setTotalCount(prev => prev + 1);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    if (newCount >= preset.target) {
      setSessions(prev => prev + 1);
      setCount(0);
      setCompleted(true);
      setTimeout(() => setCompleted(false), 2000);
    }
  };

  const reset = () => {
    setCount(0);
    setSessions(0);
    setCompleted(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header style={{ background: '#0a3d2e' }} className="px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
        <h1 className="text-white font-medium">Dhikr Counter</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">

        {/* Preset selector */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Choose Dhikr</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p, i) => {
              const c = COLORS[p.color];
              return (
                <button key={p.name} onClick={() => setSelected(i)}
                  className={`text-left p-3 rounded-xl border transition-all ${selected === i ? `${c.light} ${c.border} border` : 'bg-white border-gray-100'}`}>
                  <p className={`text-xs font-medium ${selected === i ? c.text : 'text-gray-600'}`}>{p.name}</p>
                  <p className="text-xs text-gray-400">× {p.target}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main counter */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center mb-4">

          {/* Arabic text */}
          <div className={`${color.light} rounded-xl p-4 mb-6`}>
            <p className={`font-arabic text-3xl mb-1 ${color.text}`}>{preset.arabic}</p>
            <p className="text-sm text-gray-400">{preset.meaning}</p>
          </div>

          {/* Progress ring */}
          <div className="relative w-48 h-48 mx-auto mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none"
                stroke={color.ring} strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold ${color.text}`}>{count}</span>
              <span className="text-gray-400 text-sm">of {preset.target}</span>
            </div>
          </div>

          {/* Sessions */}
          {sessions > 0 && (
            <div className={`${color.light} rounded-lg px-4 py-2 inline-block mb-4`}>
              <span className={`text-sm font-medium ${color.text}`}>✅ {sessions} {sessions === 1 ? 'round' : 'rounds'} completed</span>
            </div>
          )}

          {completed && (
            <div className="bg-emerald-500 text-white rounded-xl py-2 px-4 mb-4 text-sm font-medium animate-pulse">
              🎉 Alhamdulillah! Round complete!
            </div>
          )}

          {/* Big tap button */}
          <button
            onClick={handleCount}
            className={`w-full py-6 rounded-2xl text-white text-xl font-semibold transition-all active:scale-95 ${flash ? 'scale-95 opacity-80' : ''} ${color.bg}`}
            style={{ boxShadow: `0 8px 25px ${color.ring}40` }}
          >
            📿 Tap to Count
          </button>

          <div className="flex gap-3 mt-3">
            <button onClick={reset}
              className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
              Reset
            </button>
            <div className="flex-1 py-2 bg-gray-50 rounded-xl text-sm text-gray-500 text-center">
              Total: <span className="font-semibold text-gray-700">{totalCount}</span>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-xs font-medium text-amber-700 mb-1">💡 Tip</p>
          <p className="text-xs text-amber-600">After each Salah, recite Subhanallah, Alhamdulillah, and Allahu Akbar 33 times each. This is from the Sunnah of the Prophet ﷺ.</p>
        </div>
      </main>
    </div>
  );
}