'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const dhikrList = [
  { name: 'SubhanAllah', arabic: 'سبحان الله', meaning: 'Glory be to Allah', target: 33, color: 'from-green-400 to-emerald-500' },
  { name: 'Alhamdulillah', arabic: 'الحمد لله', meaning: 'All praise is due to Allah', target: 33, color: 'from-blue-400 to-indigo-500' },
  { name: 'Allahu Akbar', arabic: 'الله أكبر', meaning: 'Allah is the Greatest', target: 34, color: 'from-purple-400 to-pink-500' },
];

function saveProgress(stars: number) {
  try {
    const raw = localStorage.getItem('kids_islamic_games_v2');
    const data = raw ? JSON.parse(raw) : { stars: 0, completedGames: [], lastPlayed: '' };
    data.stars = (data.stars || 0) + stars;
    if (!data.completedGames.includes('dhikr-challenge')) {
      data.completedGames.push('dhikr-challenge');
    }
    data.lastPlayed = 'dhikr-challenge';
    localStorage.setItem('kids_islamic_games_v2', JSON.stringify(data));
  } catch (e) {}
}

export default function DhikrChallengePage() {
  const [activeDhikr, setActiveDhikr] = useState(0);
  const [counts, setCounts] = useState([0, 0, 0]);
  const [pulse, setPulse] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [celebration, setCelebration] = useState(false);

  const current = dhikrList[activeDhikr];
  const currentCount = counts[activeDhikr];
  const progress = (currentCount / current.target) * 100;

  const handleTap = () => {
    if (currentCount >= current.target) return;
    setPulse(true);
    setTimeout(() => setPulse(false), 200);

    const newCounts = [...counts];
    newCounts[activeDhikr] = currentCount + 1;
    setCounts(newCounts);

    if (newCounts[activeDhikr] === current.target) {
      setCelebration(true);
      setTimeout(() => {
        setCelebration(false);
        if (activeDhikr < 2) {
          setActiveDhikr(a => a + 1);
        } else {
          setAllDone(true);
        }
      }, 2000);
    }
  };

  useEffect(() => {
    if (allDone) {
      saveProgress(3);
    }
  }, [allDone]);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${current.color} p-4 transition-all duration-500`}>
      <div className="max-w-lg mx-auto">
        <Link href="/kids" className="inline-flex items-center gap-2 text-white bg-black/20 hover:bg-black/30 px-4 py-2 rounded-full font-bold shadow-lg mb-4 text-lg">
          ← Back to Kids
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-center text-white drop-shadow-lg mb-6">
          📿 Dhikr Challenge 📿
        </h1>

        {!allDone ? (
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6 md:p-8 text-center">
            {/* Dhikr tabs */}
            <div className="flex gap-2 mb-6 justify-center">
              {dhikrList.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setActiveDhikr(i)}
                  className={`px-3 py-2 rounded-full font-bold text-sm transition-all ${
                    i === activeDhikr ? 'bg-gradient-to-r ' + d.color + ' text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-600'
                  } ${counts[i] >= dhikrList[i].target ? 'ring-2 ring-green-400' : ''}`}
                >
                  {d.name} {counts[i] >= dhikrList[i].target ? '✅' : ''}
                </button>
              ))}
            </div>

            {/* Arabic text */}
            <p className="text-4xl md:text-5xl font-bold text-gray-800 mb-2" dir="rtl">
              {current.arabic}
            </p>
            <p className="text-lg text-gray-600 mb-1 font-bold">{current.name}</p>
            <p className="text-sm text-gray-500 mb-6">{current.meaning}</p>

            {/* Progress ring */}
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke="url(#gradient)" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 2.83} 283`}
                  className="transition-all duration-300"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-800">{currentCount}</span>
                <span className="text-sm text-gray-500">/ {current.target}</span>
              </div>
            </div>

            {/* Tap button */}
            <button
              onClick={handleTap}
              disabled={currentCount >= current.target}
              className={`w-32 h-32 rounded-full bg-gradient-to-br ${current.color} text-white font-bold text-xl shadow-xl transition-all duration-200 ${
                pulse ? 'scale-125' : 'scale-100'
              } ${currentCount >= current.target ? 'opacity-50' : 'hover:scale-110 active:scale-90'}`}
            >
              {currentCount >= current.target ? '✅' : 'TAP!'}
            </button>

            {celebration && (
              <div className="mt-4 text-2xl font-bold text-green-600 animate-bounce">
                🎉 MashAllah! Well done! 🎉
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎉🌟📿✨🎊</div>
            <h2 className="text-3xl font-bold text-purple-700 mb-2">MashAllah!</h2>
            <p className="text-xl text-gray-700 mb-4">
              You completed all 100 dhikr!
            </p>
            <div className="text-4xl mb-4">⭐⭐⭐</div>
            <p className="text-gray-600 mb-2">33 SubhanAllah ✅</p>
            <p className="text-gray-600 mb-2">33 Alhamdulillah ✅</p>
            <p className="text-gray-600 mb-6">34 Allahu Akbar ✅</p>
            <p className="text-sm text-gray-500 mb-6">May Allah accept your dhikr! 🤲</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => { setCounts([0, 0, 0]); setActiveDhikr(0); setAllDone(false); }} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                Again 🔄
              </button>
              <Link href="/kids" className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                Back 🏠
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
