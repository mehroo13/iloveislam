'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/* ── Constants ── */
const DUAS = [
  {
    time: 'Suhoor',
    arabic: 'وَبِصَوْمِ غَدٍ نَّوَيْتُ مِن شَهْرِ رَمَضَانَ',
    transliteration: 'Wa bisawmi ghadin nawaytu min shahri Ramadan',
    meaning: 'I intend to keep the fast for tomorrow in the month of Ramadan',
  },
  {
    time: 'Iftar',
    arabic: 'اللَّهُمَّ إِنِّي لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَيْكَ تَوَكَّلْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ',
    transliteration: 'Allahumma inni laka sumtu wa bika aamantu wa alayka tawakkaltu wa ala rizq-ika aftartu',
    meaning: 'O Allah! I fasted for You and I believe in You and I put my trust in You and I break my fast with Your sustenance',
  },
];

const MOODS = ['😄', '🙂', '😐', '😔', '🤲'];

const IBADAH_OPTIONS = [
  'Quran', 'Tarawih', 'Tahajjud', 'Sadaqah', 'Dhikr', 'Fasting', 'Dua', 'Good Deed',
];

const GOALS = [
  { id: 'quran', label: 'Complete Quran', icon: '📖', target: 30 },
  { id: 'tarawih', label: 'Pray Tarawih', icon: '🕌', target: 30 },
  { id: 'sadaqah', label: 'Give Sadaqah', icon: '💚', target: 30 },
  { id: 'dhikr', label: 'Daily Dhikr', icon: '📿', target: 30 },
  { id: 'tahajjud', label: 'Pray Tahajjud', icon: '🌙', target: 10 },
];

type DayData = {
  ibadah: string[];
  fasted: boolean;
};

export default function RamadanPlanner() {
  // User‑controlled Ramadan day (1‑30). Persisted in localStorage.
  const [ramadanDay, setRamadanDay] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>('tracker');
  const [days, setDays] = useState<Record<string, DayData>>({});
  const [notes, setNotes] = useState<string>('');
  const [mood, setMood] = useState<string>('');

  // Load all data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDay = localStorage.getItem('ramadan_day_number');
      if (savedDay) setRamadanDay(Math.min(30, Math.max(1, parseInt(savedDay, 10))));
      setDays(JSON.parse(localStorage.getItem('ramadan_days_v2') || '{}'));
      setNotes(localStorage.getItem('ramadan_notes_v2') || '');
    }
  }, []);

  // Persist ramadan day
  useEffect(() => {
    localStorage.setItem('ramadan_day_number', ramadanDay.toString());
  }, [ramadanDay]);

  // Persist days and notes
  useEffect(() => {
    if (Object.keys(days).length) localStorage.setItem('ramadan_days_v2', JSON.stringify(days));
  }, [days]);

  useEffect(() => {
    localStorage.setItem('ramadan_notes_v2', notes);
  }, [notes]);

  // Mood persistence
  const todayKey = `day-${ramadanDay}`; // unique key per ramadan day
  useEffect(() => {
    const savedMood = localStorage.getItem(`ramadan_mood_${todayKey}`);
    if (savedMood) setMood(savedMood);
    else setMood('');
  }, [todayKey]);

  useEffect(() => {
    if (mood) localStorage.setItem(`ramadan_mood_${todayKey}`, mood);
  }, [mood, todayKey]);

  const todayData: DayData = days[todayKey] || { ibadah: [], fasted: false };

  const changeDay = (delta: number) => {
    setRamadanDay(prev => Math.min(30, Math.max(1, prev + delta)));
  };

  const toggleFasted = () => {
    setDays(prev => ({
      ...prev,
      [todayKey]: { ...todayData, fasted: !todayData.fasted },
    }));
  };

  const toggleIbadah = (item: string) => {
    const current = todayData.ibadah || [];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    setDays(prev => ({
      ...prev,
      [todayKey]: { ...todayData, ibadah: updated },
    }));
  };

  const getGoalCount = (goalId: string) => {
    const ibadahMap: Record<string, string> = {
      quran: 'Quran',
      tarawih: 'Tarawih',
      sadaqah: 'Sadaqah',
      dhikr: 'Dhikr',
      tahajjud: 'Tahajjud',
    };
    const targetIbadah = ibadahMap[goalId];
    return Object.values(days).filter(d => d.ibadah?.includes(targetIbadah)).length;
  };

  const getDaysFasted = () => Object.values(days).filter(d => d.fasted).length;

  const totalIbadah = Object.values(days).reduce((sum, d) => sum + (d.ibadah?.length || 0), 0);

  const card = 'bg-white rounded-2xl border border-gray-100 p-5 shadow-sm';

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50/30">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0a3d2e] to-[#1a6b4a] text-white px-4 py-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/70 hover:text-white text-sm flex items-center gap-1">
            <span>←</span> Back
          </Link>
          <h1 className="text-xl font-bold tracking-wide">🌙 Ramadan Planner</h1>
          {/* Day selector */}
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
            <button
              onClick={() => changeDay(-1)}
              disabled={ramadanDay <= 1}
              className="text-white hover:text-amber-300 disabled:opacity-40 text-lg leading-none"
            >
              ‹
            </button>
            <span className="text-sm font-semibold min-w-[4rem] text-center">
              Day {ramadanDay}/30
            </span>
            <button
              onClick={() => changeDay(1)}
              disabled={ramadanDay >= 30}
              className="text-white hover:text-amber-300 disabled:opacity-40 text-lg leading-none"
            >
              ›
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-4">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>Ramadan Progress</span>
            <span>{ramadanDay} of 30 days</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${(ramadanDay / 30) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="bg-[#0a3d2e] text-white px-4 py-4">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-amber-300">{getDaysFasted()}</p>
            <p className="text-white/60 text-xs">Days Fasted</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-300">{totalIbadah}</p>
            <p className="text-white/60 text-xs">Ibadah Done</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-300">{30 - ramadanDay}</p>
            <p className="text-white/60 text-xs">Days Left</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex bg-white rounded-2xl border border-gray-100 p-1.5 gap-1 shadow-sm">
          {[
            { id: 'tracker', label: '📅 Today' },
            { id: 'goals', label: '🎯 Goals' },
            { id: 'duas', label: '🤲 Duas' },
            { id: 'notes', label: '📝 Journal' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#0a3d2e] text-white shadow'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[1]}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5 pb-10">
        {/* TODAY TAB */}
        {activeTab === 'tracker' && (
          <>
            {/* Fasting Toggle */}
            <div className={card}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800 text-lg">Did you fast today?</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Ramadan Day {ramadanDay}
                  </p>
                </div>
                <button
                  onClick={toggleFasted}
                  className={`w-16 h-9 rounded-full transition-all relative flex items-center ${
                    todayData.fasted ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-7 h-7 bg-white rounded-full shadow absolute transform transition-transform ${
                      todayData.fasted ? 'translate-x-8' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              {todayData.fasted && (
                <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                  <p className="text-emerald-700 text-sm font-semibold">✅ Alhamdulillah! Fast recorded</p>
                </div>
              )}
            </div>

            {/* Mood Tracker */}
            <div className={card}>
              <p className="font-semibold text-gray-800 mb-4 text-lg">How are you feeling?</p>
              <div className="flex gap-3 justify-center">
                {MOODS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMood(m === mood ? '' : m)}
                    className={`text-3xl w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                      mood === m
                        ? 'bg-emerald-100 border-2 border-emerald-500 shadow-inner scale-95'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {mood && <p className="text-center text-xs text-gray-400 mt-3">Your mood is saved for today</p>}
            </div>

            {/* Ibadah Checklist */}
            <div className={card}>
              <p className="font-semibold text-gray-800 mb-4 text-lg">Today's Ibadah</p>
              <div className="grid grid-cols-2 gap-3">
                {IBADAH_OPTIONS.map(item => {
                  const done = todayData.ibadah?.includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => toggleIbadah(item)}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 text-left ${
                        done
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs flex-shrink-0 ${
                          done
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {done ? '✓' : ''}
                      </span>
                      {item}
                    </button>
                  );
                })}
              </div>
              {todayData.ibadah?.length > 0 && (
                <p className="text-xs text-gray-400 mt-4 text-center">
                  {todayData.ibadah.length} of {IBADAH_OPTIONS.length} completed — MashaAllah! ✨
                </p>
              )}
            </div>
          </>
        )}

        {/* GOALS TAB */}
        {activeTab === 'goals' && (
          <>
            <div className={card}>
              <p className="font-semibold text-gray-800 text-lg mb-1">Ramadan Goals</p>
              <p className="text-xs text-gray-400 mb-5">Track your 30-day ibadah goals</p>
              <div className="space-y-5">
                {GOALS.map(goal => {
                  const count = getGoalCount(goal.id);
                  const pct = Math.min((count / goal.target) * 100, 100);
                  return (
                    <div key={goal.id}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <span className="text-lg">{goal.icon}</span> {goal.label}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                          {count}/{goal.target}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: pct === 100
                              ? 'linear-gradient(to right, #f59e0b, #d97706)'
                              : 'linear-gradient(to right, #0a3d2e, #1a6b4a)',
                          }}
                        />
                      </div>
                      {pct === 100 && (
                        <p className="text-xs text-amber-600 mt-1 font-semibold">🏆 Goal completed!</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fasting Calendar */}
            <div className={card}>
              <p className="font-semibold text-gray-800 mb-4 text-lg">Fasting Calendar</p>
              <div className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: 30 }, (_, i) => {
                  const dayNumber = i + 1;
                  const key = `day-${dayNumber}`;
                  const fasted = days[key]?.fasted;
                  const isToday = dayNumber === ramadanDay;
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                        isToday ? 'ring-2 ring-offset-1 ring-amber-400' : ''
                      }`}
                      style={{
                        background: fasted
                          ? 'linear-gradient(135deg, #0a3d2e, #1a6b4a)'
                          : dayNumber < ramadanDay
                          ? '#f1f1f1'
                          : '#fafafa',
                        color: fasted ? 'white' : '#aaa',
                      }}
                    >
                      {dayNumber}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-[#0a3d2e] inline-block" /> Fasted
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-gray-200 inline-block" /> Missed
                </span>
              </div>
            </div>
          </>
        )}

        {/* DUAS TAB */}
        {activeTab === 'duas' && (
          <>
            <div className={card}>
              <p className="font-semibold text-gray-800 text-lg mb-4">Essential Ramadan Duas</p>
              {DUAS.map((dua, i) => (
                <div key={i} className={`${i > 0 ? 'mt-6 pt-6 border-t border-gray-100' : ''}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      {dua.time}
                    </span>
                  </div>
                  <p className="text-3xl text-right text-gray-800 leading-loose mb-3 font-arabic">{dua.arabic}</p>
                  <p className="text-sm text-gray-500 italic mb-1">{dua.transliteration}</p>
                  <p className="text-sm text-gray-700">{dua.meaning}</p>
                </div>
              ))}
            </div>

            <div className={card}>
              <p className="font-semibold text-gray-800 text-lg mb-4">Laylatul Qadr Dua</p>
              <div className="bg-gradient-to-r from-[#0a3d2e] to-[#1a6b4a] rounded-xl p-5 text-center text-white">
                <p className="text-3xl leading-loose mb-3 font-arabic">
                  اللَّهُمَّ إِنَّكَ عُفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي
                </p>
                <p className="text-white/70 text-sm italic mb-1">
                  Allahumma innaka 'afuwwun tuhibbul 'afwa fa'fu 'anni
                </p>
                <p className="text-white/90 text-sm mt-2">
                  O Allah, You are Forgiving and love forgiveness, so forgive me
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                Recite abundantly in the last 10 nights — Hadith (Tirmidhi)
              </p>
            </div>

            <div className={card}>
              <p className="font-semibold text-gray-800 text-lg mb-4">✨ Ramadan Tips</p>
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
                    <span className="text-xl">{t.icon}</span>
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
            <div className={card}>
              <p className="font-semibold text-gray-800 text-lg mb-1">Personal Ramadan Journal</p>
              <p className="text-xs text-gray-400 mb-4">Write your reflections, gratitude, and goals</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bismillah... write your thoughts, what you're grateful for, goals for this Ramadan, reflections on today's fast..."
                className="w-full h-56 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-gray-50"
              />
              <p className="text-xs text-gray-300 text-right mt-2">{notes.length} characters — saved automatically</p>
            </div>

            <div className={card}>
              <p className="font-semibold text-gray-800 text-lg mb-4">💡 Journal Prompts</p>
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
                    className="w-full text-left text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-3 transition-all border border-gray-200"
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