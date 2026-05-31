'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const months = [
  { name: 'Muharram', number: 1, significance: 'Islamic New Year - Sacred month', emoji: '🌙' },
  { name: 'Safar', number: 2, significance: 'Month of travel', emoji: '🐪' },
  { name: 'Rabi al-Awwal', number: 3, significance: 'Birth of Prophet Muhammad ﷺ', emoji: '🌟' },
  { name: 'Rabi al-Thani', number: 4, significance: 'Month of spring', emoji: '🌸' },
  { name: 'Jumada al-Ula', number: 5, significance: 'First month of dry season', emoji: '☀️' },
  { name: 'Jumada al-Thani', number: 6, significance: 'Second month of dry season', emoji: '🏜️' },
  { name: 'Rajab', number: 7, significance: 'Sacred month - Isra & Miraj', emoji: '✨' },
  { name: 'Shaban', number: 8, significance: 'Month before Ramadan', emoji: '🌓' },
  { name: 'Ramadan', number: 9, significance: 'Month of Fasting & Quran revelation', emoji: '🕌' },
  { name: 'Shawwal', number: 10, significance: 'Eid al-Fitr celebration', emoji: '🎉' },
  { name: 'Dhul Qadah', number: 11, significance: 'Sacred month - preparation for Hajj', emoji: '🕋' },
  { name: 'Dhul Hijjah', number: 12, significance: 'Month of Hajj & Eid al-Adha', emoji: '🐑' },
];

const quizQuestions = [
  { q: "Which month is fasting (Ramadan)?", options: ["7th month", "9th month", "11th month", "1st month"], answer: 1 },
  { q: "Which month marks the Islamic New Year?", options: ["Ramadan", "Muharram", "Shawwal", "Rajab"], answer: 1 },
  { q: "In which month is Hajj performed?", options: ["Ramadan", "Shawwal", "Dhul Hijjah", "Muharram"], answer: 2 },
  { q: "Which month celebrates Eid al-Fitr?", options: ["Ramadan", "Shawwal", "Dhul Hijjah", "Rajab"], answer: 1 },
  { q: "In which month was Prophet Muhammad ﷺ born?", options: ["Muharram", "Ramadan", "Rabi al-Awwal", "Rajab"], answer: 2 },
  { q: "Which month has the Night Journey (Isra & Miraj)?", options: ["Rajab", "Shaban", "Ramadan", "Muharram"], answer: 0 },
  { q: "Which month comes right before Ramadan?", options: ["Rajab", "Shaban", "Jumada al-Thani", "Shawwal"], answer: 1 },
  { q: "How many months are in the Islamic calendar?", options: ["10", "11", "12", "13"], answer: 2 },
  { q: "Which is the 1st month of the Islamic calendar?", options: ["Ramadan", "Muharram", "Rajab", "Safar"], answer: 1 },
  { q: "Eid al-Adha is celebrated in which month?", options: ["Shawwal", "Muharram", "Dhul Hijjah", "Ramadan"], answer: 2 },
  { q: "Which month is known as the month of travel?", options: ["Safar", "Rajab", "Shaban", "Jumada al-Ula"], answer: 0 },
  { q: "The Quran was first revealed in which month?", options: ["Rajab", "Shaban", "Ramadan", "Muharram"], answer: 2 },
];

function saveProgress(stars: number) {
  try {
    const raw = localStorage.getItem('kids_islamic_games_v2');
    const data = raw ? JSON.parse(raw) : { stars: 0, completedGames: [], lastPlayed: '' };
    data.stars = (data.stars || 0) + stars;
    if (!data.completedGames.includes('islamic-months')) {
      data.completedGames.push('islamic-months');
    }
    data.lastPlayed = 'islamic-months';
    localStorage.setItem('kids_islamic_games_v2', JSON.stringify(data));
  } catch (e) {}
}

export default function IslamicMonthsPage() {
  const [mode, setMode] = useState<'learn' | 'quiz' | 'result'>('learn');
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowResult(true);
    if (idx === quizQuestions[currentQ].answer) {
      setScore(s => s + 1);
    }
    setTimeout(() => {
      if (currentQ < quizQuestions.length - 1) {
        setCurrentQ(c => c + 1);
        setSelected(null);
        setShowResult(false);
      } else {
        setMode('result');
      }
    }, 1500);
  };

  useEffect(() => {
    if (mode === 'result') {
      const stars = score >= 10 ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;
      saveProgress(stars);
    }
  }, [mode, score]);

  const stars = score >= 10 ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-amber-300 to-yellow-400 p-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/kids" className="inline-flex items-center gap-2 text-white bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-full font-bold shadow-lg mb-4 text-lg">
          ← Back to Kids
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-center text-white drop-shadow-lg mb-6">
          📅 Islamic Months 🌙
        </h1>

        {mode === 'learn' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {months.map((m) => (
                <div key={m.number} className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600">
                    {m.number}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{m.emoji} {m.name}</p>
                    <p className="text-sm text-gray-500">{m.significance}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <button
                onClick={() => setMode('quiz')}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-full font-bold text-xl shadow-lg hover:scale-105 transition-transform"
              >
                Start Quiz! 🎯
              </button>
            </div>
          </div>
        )}

        {mode === 'quiz' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex justify-between items-center mb-4">
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold">
                Q {currentQ + 1}/{quizQuestions.length}
              </span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                Score: {score}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div
                className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${((currentQ + 1) / quizQuestions.length) * 100}%` }}
              />
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 text-center">
              {quizQuestions[currentQ].q}
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {quizQuestions[currentQ].options.map((opt, idx) => {
                let btnClass = "w-full p-4 rounded-2xl font-bold text-lg text-left transition-all duration-200 border-2 ";
                if (showResult) {
                  if (idx === quizQuestions[currentQ].answer) {
                    btnClass += "bg-green-100 border-green-500 text-green-700";
                  } else if (idx === selected && idx !== quizQuestions[currentQ].answer) {
                    btnClass += "bg-red-100 border-red-500 text-red-700";
                  } else {
                    btnClass += "bg-gray-50 border-gray-200 text-gray-400";
                  }
                } else {
                  btnClass += "bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100 hover:border-orange-400 hover:scale-[1.02] active:scale-95";
                }
                return (
                  <button key={idx} onClick={() => handleAnswer(idx)} className={btnClass} disabled={selected !== null}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {mode === 'result' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎉📅🌙✨🎊</div>
            <h2 className="text-3xl font-bold text-orange-700 mb-2">MashAllah!</h2>
            <p className="text-xl text-gray-700 mb-4">
              You scored <span className="font-bold text-orange-600">{score}</span> out of {quizQuestions.length}!
            </p>
            <div className="text-4xl mb-4">
              {Array.from({ length: stars }).map((_, i) => <span key={i}>⭐</span>)}
              {Array.from({ length: 3 - stars }).map((_, i) => <span key={i}>☆</span>)}
            </div>
            <p className="text-gray-500 mb-6">
              {score >= 10 ? "You know the Islamic months perfectly!" : score >= 7 ? "Great knowledge! Keep learning!" : "Review the months and try again!"}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button onClick={() => { setMode('learn'); setCurrentQ(0); setScore(0); setSelected(null); setShowResult(false); }} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                Learn Again 📖
              </button>
              <button onClick={() => { setMode('quiz'); setCurrentQ(0); setScore(0); setSelected(null); setShowResult(false); }} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                Quiz Again 🎯
              </button>
              <Link href="/kids" className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                Back 🏠
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
