export const metadata = {
  title: 'Ramadan Planner — Suhoor Iftar & Ibadah Tracker | I Love Islam',
  description: 'Plan your Ramadan with our free planner. Track suhoor, iftar, fasting, Quran reading and ibadah goals. No sign-up needed.',
}

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const DUAS = [
  { time: 'Suhoor', arabic: 'نَوَيْتُ صَوْمَ غَدٍ', transliteration: 'Nawaitu sawma ghadin', meaning: 'I intend to fast tomorrow' },
  { time: 'Iftar', arabic: 'اللَّهُمَّ اِنِّى لَكَ صُمْتُ', transliteration: 'Allahumma inni laka sumtu', meaning: 'O Allah, I fasted for You' },
];

const GOALS = [
  { id: 'quran', label: 'Complete Quran', icon: '📖', target: 30 },
  { id: 'tarawih', label: 'Pray Tarawih', icon: '🕌', target: 30 },
  { id: 'sadaqah', label: 'Give Sadaqah', icon: '💚', target: 30 },
  { id: 'dhikr', label: 'Daily Dhikr', icon: '📿', target: 30 },
  { id: 'tahajjud', label: 'Pray Tahajjud', icon: '🌙', target: 10 },
];

const IBADAH_OPTIONS = ['Quran', 'Tarawih', 'Tahajjud', 'Sadaqah', 'Dhikr', 'Fasting', 'Dua', 'Good Deed'];

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getDayOfRamadan() {
  // For demo, returns a number 1-30 based on current day of month
  return ((new Date().getDate() - 1) % 30) + 1;
}

export default function RamadanPlanner() {
  const [activeTab, setActiveTab] = useState('tracker');
  const [days, setDays] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ramadan_days');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [goals, setGoals] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ramadan_goals');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [notes, setNotes] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ramadan_notes') || '';
    }
    return '';
  });
  const [mood, setMood] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ramadan_mood_' + getTodayKey());
      return saved || '';
    }
    return '';
  });

  const ramadanDay = getDayOfRamadan();
  const todayKey = getTodayKey();
  const todayData = days[todayKey] || { ibadah: [], fasted: false };

  useEffect(() => {
    localStorage.setItem('ramadan_days', JSON.stringify(days));
  }, [days]);

  useEffect(() => {
    localStorage.setItem('ramadan_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('ramadan_notes', notes);
  }, [notes]);

  function toggleFasted() {
    setDays(prev => ({
      ...prev,
      [todayKey]: { ...todayData, fasted: !todayData.fasted }
    }));
  }

  function toggleIbadah(item) {
    const current = todayData.ibadah || [];
    const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    setDays(prev => ({
      ...prev,
      [todayKey]: { ...todayData, ibadah: updated }
    }));
  }

  function saveMood(m) {
    setMood(m);
    localStorage.setItem('ramadan_mood_' + todayKey, m);
  }

  function getGoalCount(goalId) {
    return Object.values(days).filter(d => d.ibadah && d.ibadah.includes(
      goalId === 'quran' ? 'Quran' :
      goalId === 'tarawih' ? 'Tarawih' :
      goalId === 'sadaqah' ? 'Sadaqah' :
      goalId === 'dhikr' ? 'Dhikr' :
      goalId === 'tahajjud' ? 'Tahajjud' : ''
    )).length;
  }

  function getDaysCompleted() {
    return Object.values(days).filter(d => d.fasted).length;
  }

  const MOODS = ['😄', '🙂', '😐', '😔', '🤲'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #1a6b4a 100%)' }} className="px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
          <h1 className="text-white font-semibold">🌙 Ramadan Planner</h1>
          <div className="bg-white/20 rounded-full px-3 py-1 text-white text-xs">
            Day {ramadanDay}/30
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-4">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>Ramadan Progress</span>
            <span>{ramadanDay} of 30 days</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${(ramadanDay / 30) * 100}%`, background: '#c8a96e' }}
            />
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div style={{ background: '#0a3d2e' }} className="px-4 py-3">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold" style={{ color: '#c8a96e' }}>{getDaysCompleted()}</p>
            <p className="text-white/50 text-xs">Days Fasted</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: '#c8a96e' }}>
              {Object.values(days).reduce((sum, d) => sum + (d.ibadah?.length || 0), 0)}
            </p>
            <p className="text-white/50 text-xs">Ibadah Done</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: '#c8a96e' }}>
              {30 - ramadanDay}
            </p>
            <p className="text-white/50 text-xs">Days Left</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex bg-white rounded-xl border border-gray-100 p-1 gap-1">
          {[
            { id: 'tracker', label: '📅 Today' },
            { id: 'goals', label: '🎯 Goals' },
            { id: 'duas', label: '🤲 Duas' },
            { id: 'notes', label: '📝 Notes' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === tab.id ? { background: '#0a3d2e' } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-10">

        {/* TODAY TAB */}
        {activeTab === 'tracker' && (
          <>
            {/* Fasting toggle */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">Did you fast today?</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <button
                  onClick={toggleFasted}
                  className={`w-14 h-8 rounded-full transition-all relative ${todayData.fasted ? '' : 'bg-gray-200'}`}
                  style={todayData.fasted ? { background: '#0a3d2e' } : {}}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow absolute top-1 transition-all ${todayData.fasted ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              {todayData.fasted && (
                <div className="mt-3 bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-emerald-700 text-sm font-medium">✅ Alhamdulillah! Fast recorded</p>
                </div>
              )}
            </div>

            {/* Mood tracker */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-3">How are you feeling?</p>
              <div className="flex gap-3 justify-center">
                {MOODS.map(m => (
                  <button
                    key={m}
                    onClick={() => saveMood(m)}
                    className={`text-2xl w-12 h-12 rounded-full transition-all ${mood === m ? 'shadow-inner scale-90' : 'hover:scale-110'}`}
                    style={mood === m ? { background: '#f0faf5', border: '2px solid #0a3d2e' } : { background: '#f5f5f5' }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Ibadah checklist */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-3">Today's Ibadah</p>
              <div className="grid grid-cols-2 gap-2">
                {IBADAH_OPTIONS.map(item => {
                  const done = todayData.ibadah?.includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => toggleIbadah(item)}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all text-left flex items-center gap-2 ${
                        done ? 'border-emerald-200 text-emerald-800' : 'border-gray-100 text-gray-600 hover:border-gray-200'
                      }`}
                      style={done ? { background: '#f0faf5' } : { background: '#fafafa' }}
                    >
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center text-xs flex-shrink-0 ${
                        done ? 'border-emerald-500' : 'border-gray-300'
                      }`}
                      style={done ? { background: '#0a3d2e', borderColor: '#0a3d2e', color: 'white' } : {}}>
                        {done ? '✓' : ''}
                      </span>
                      {item}
                    </button>
                  );
                })}
              </div>
              {todayData.ibadah?.length > 0 && (
                <p className="text-xs text-gray-400 mt-3 text-center">
                  {todayData.ibadah.length} of {IBADAH_OPTIONS.length} completed today — MashaAllah! 🎉
                </p>
              )}
            </div>
          </>
        )}

        {/* GOALS TAB */}
        {activeTab === 'goals' && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-1">Ramadan Goals</p>
              <p className="text-xs text-gray-400 mb-4">Track your 30-day ibadah goals</p>
              <div className="space-y-4">
                {GOALS.map(goal => {
                  const count = getGoalCount(goal.id);
                  const pct = Math.min((count / goal.target) * 100, 100);
                  return (
                    <div key={goal.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-700">{goal.icon} {goal.label}</span>
                        <span className="text-xs text-gray-400">{count}/{goal.target} days</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full">
                        <div
                          className="h-2.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: pct === 100 ? '#c8a96e' : '#0a3d2e' }}
                        />
                      </div>
                      {pct === 100 && (
                        <p className="text-xs text-amber-600 mt-0.5">🏆 Goal achieved!</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calendar heatmap */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-3">Fasting Calendar</p>
              <div className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: 30 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (ramadanDay - 1) + i);
                  const key = d.toISOString().split('T')[0];
                  const fasted = days[key]?.fasted;
                  const isToday = i + 1 === ramadanDay;
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${isToday ? 'ring-2 ring-offset-1' : ''}`}
                      style={{
                        background: fasted ? '#0a3d2e' : i + 1 < ramadanDay ? '#f0f0f0' : '#f8f8f8',
                        color: fasted ? 'white' : '#aaa',
                        ringColor: '#0a3d2e',
                      }}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#0a3d2e', display: 'inline-block' }} /> Fasted</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> Missed</span>
              </div>
            </div>
          </>
        )}

        {/* DUAS TAB */}
        {activeTab === 'duas' && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50">
                <p className="font-semibold text-gray-800">Essential Ramadan Duas</p>
              </div>
              {DUAS.map((dua, i) => (
                <div key={i} className={`p-5 ${i < DUAS.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ background: '#0a3d2e' }}>{dua.time}</span>
                  </div>
                  <p className="font-arabic text-3xl text-right text-gray-800 leading-loose mb-3">{dua.arabic}</p>
                  <p className="text-sm text-gray-500 italic mb-1">{dua.transliteration}</p>
                  <p className="text-sm text-gray-700">{dua.meaning}</p>
                </div>
              ))}
            </div>

            {/* Extra duas */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-3">Laylatul Qadr Dua</p>
              <div style={{ background: 'linear-gradient(135deg, #0a3d2e, #1a6b4a)' }} className="rounded-xl p-5 text-center">
                <p className="font-arabic text-3xl text-white leading-loose mb-3">
                  اللَّهُمَّ إِنَّكَ عُفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي
                </p>
                <p className="text-white/70 text-sm italic mb-1">Allahumma innaka 'afuwwun tuhibbul 'afwa fa'fu 'anni</p>
                <p className="text-white/90 text-sm mt-2">O Allah, You are Forgiving and love forgiveness, so forgive me</p>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">Recite abundantly in the last 10 nights — Hadith (Tirmidhi)</p>
            </div>

            {/* Ramadan tips */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-3">✨ Ramadan Tips</p>
              <div className="space-y-3">
                {[
                  { icon: '🌙', tip: 'Make intention for fasting every night before Fajr' },
                  { icon: '💧', tip: 'Drink plenty of water between Iftar and Suhoor' },
                  { icon: '📖', tip: 'Read at least 1 Juz of Quran daily to complete it' },
                  { icon: '🤲', tip: 'Make dua abundantly — dua is accepted when fasting' },
                  { icon: '💚', tip: 'Give sadaqah daily, even if small — it is multiplied' },
                  { icon: '🕌', tip: 'Pray Tarawih — even a few rakahs is better than none' },
                ].map((t, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-lg">{t.icon}</span>
                    <p className="text-sm text-gray-600 leading-relaxed">{t.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-1">Personal Ramadan Journal</p>
              <p className="text-xs text-gray-400 mb-3">Write your reflections, gratitude, and goals</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Bismillah... write your thoughts, what you're grateful for, goals for this Ramadan, reflections on today's fast..."
                className="w-full h-64 border border-gray-100 rounded-xl p-4 text-sm text-gray-700 resize-none focus:outline-none focus:border-gray-300"
                style={{ background: '#fafafa' }}
              />
              <p className="text-xs text-gray-300 text-right mt-1">{notes.length} characters — saved automatically</p>
            </div>

            {/* Gratitude prompts */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-3">💡 Journal Prompts</p>
              <div className="space-y-2">
                {[
                  'What am I most grateful to Allah for today?',
                  'What is one thing I want to improve this Ramadan?',
                  'What dua do I want answered this Ramadan?',
                  'How can I be more present in my salah?',
                  'What sins do I want to leave behind this Ramadan?',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setNotes(n => n + (n ? '\n\n' : '') + prompt + '\n')}
                    className="w-full text-left text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-3 transition-all border border-gray-100"
                  >
                    + {prompt}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}