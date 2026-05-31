'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const names = [
  { name: 'Ar-Rahman', meaning: 'The Most Gracious', arabic: 'الرحمن' },
  { name: 'Ar-Rahim', meaning: 'The Most Merciful', arabic: 'الرحيم' },
  { name: 'Al-Malik', meaning: 'The King', arabic: 'الملك' },
  { name: 'Al-Quddus', meaning: 'The Most Holy', arabic: 'القدوس' },
  { name: 'As-Salam', meaning: 'The Source of Peace', arabic: 'السلام' },
  { name: "Al-Mu'min", meaning: 'The Guardian of Faith', arabic: 'المؤمن' },
  { name: 'Al-Muhaymin', meaning: 'The Protector', arabic: 'المهيمن' },
  { name: 'Al-Aziz', meaning: 'The Almighty', arabic: 'العزيز' },
  { name: 'Al-Jabbar', meaning: 'The Compeller', arabic: 'الجبار' },
  { name: 'Al-Mutakabbir', meaning: 'The Supreme', arabic: 'المتكبر' },
  { name: 'Al-Khaliq', meaning: 'The Creator', arabic: 'الخالق' },
  { name: "Al-Bari'", meaning: 'The Originator', arabic: 'البارئ' },
  { name: 'Al-Musawwir', meaning: 'The Fashioner', arabic: 'المصور' },
  { name: 'Al-Ghaffar', meaning: 'The Forgiver', arabic: 'الغفار' },
  { name: 'Al-Qahhar', meaning: 'The Subduer', arabic: 'القهار' },
  { name: 'Al-Wahhab', meaning: 'The Bestower', arabic: 'الوهاب' },
  { name: 'Ar-Razzaq', meaning: 'The Provider', arabic: 'الرزاق' },
  { name: 'Al-Fattah', meaning: 'The Opener', arabic: 'الفتاح' },
  { name: "Al-'Alim", meaning: 'The All-Knowing', arabic: 'العليم' },
  { name: 'Al-Qabid', meaning: 'The Restrainer', arabic: 'القابض' },
  { name: 'Al-Basit', meaning: 'The Expander', arabic: 'الباسط' },
  { name: 'Al-Khafid', meaning: 'The Abaser', arabic: 'الخافض' },
  { name: "Ar-Rafi'", meaning: 'The Exalter', arabic: 'الرافع' },
  { name: "Al-Mu'izz", meaning: 'The Honorer', arabic: 'المعز' },
  { name: 'Al-Mudhill', meaning: 'The Humiliator', arabic: 'المذل' },
  { name: "As-Sami'", meaning: 'The All-Hearing', arabic: 'السميع' },
  { name: 'Al-Basir', meaning: 'The All-Seeing', arabic: 'البصير' },
  { name: 'Al-Hakam', meaning: 'The Judge', arabic: 'الحكم' },
  { name: "Al-'Adl", meaning: 'The Just', arabic: 'العدل' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function saveProgress(stars: number) {
  try {
    const raw = localStorage.getItem('kids_islamic_games_v2');
    const data = raw ? JSON.parse(raw) : { stars: 0, completedGames: [], lastPlayed: '' };
    data.stars = (data.stars || 0) + stars;
    if (!data.completedGames.includes('asma-ul-husna')) {
      data.completedGames.push('asma-ul-husna');
    }
    data.lastPlayed = 'asma-ul-husna';
    localStorage.setItem('kids_islamic_games_v2', JSON.stringify(data));
  } catch (e) {}
}

export default function AsmaUlHusnaPage() {
  const [mode, setMode] = useState<'learn' | 'quiz' | 'result'>('learn');
  const [page, setPage] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<{ nameObj: typeof names[0]; options: string[] }[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const namesPerPage = 10;
  const totalPages = Math.ceil(names.length / namesPerPage);
  const currentNames = names.slice(page * namesPerPage, (page + 1) * namesPerPage);

  const generateQuiz = () => {
    const shuffled = shuffle(names).slice(0, 15);
    const qs = shuffled.map(nameObj => {
      const wrongOptions = shuffle(names.filter(n => n.meaning !== nameObj.meaning))
        .slice(0, 3)
        .map(n => n.meaning);
      const options = shuffle([nameObj.meaning, ...wrongOptions]);
      return { nameObj, options };
    });
    setQuizQuestions(qs);
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setShowResult(false);
    setMode('quiz');
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowResult(true);
    if (quizQuestions[currentQ].options[idx] === quizQuestions[currentQ].nameObj.meaning) {
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
      const stars = score >= 13 ? 3 : score >= 10 ? 2 : score >= 6 ? 1 : 0;
      saveProgress(stars);
    }
  }, [mode, score]);

  const stars = score >= 13 ? 3 : score >= 10 ? 2 : score >= 6 ? 1 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-400 to-pink-400 p-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/kids" className="inline-flex items-center gap-2 text-white bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-full font-bold shadow-lg mb-4 text-lg">
          ← Back to Kids
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-center text-white drop-shadow-lg mb-6">
          ✨ Asma ul-Husna ✨
        </h1>
        <p className="text-center text-white/80 mb-6">Learn the Beautiful Names of Allah</p>

        {mode === 'learn' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {currentNames.map((n, idx) => (
                <div key={idx} className="bg-white/95 rounded-2xl shadow-lg p-4 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-indigo-700 text-lg">{n.name}</p>
                      <p className="text-gray-600">{n.meaning}</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-800" dir="rtl">{n.arabic}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-10 h-10 rounded-full font-bold transition-all ${
                    i === page ? 'bg-white text-indigo-700 shadow-lg scale-110' : 'bg-white/30 text-white hover:bg-white/50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={generateQuiz}
                className="bg-white text-indigo-700 hover:bg-indigo-50 px-8 py-4 rounded-full font-bold text-xl shadow-lg hover:scale-105 transition-transform"
              >
                Start Quiz! 🎯
              </button>
            </div>
          </div>
        )}

        {mode === 'quiz' && quizQuestions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex justify-between items-center mb-4">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">
                Q {currentQ + 1}/{quizQuestions.length}
              </span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                Score: {score}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${((currentQ + 1) / quizQuestions.length) * 100}%` }}
              />
            </div>

            <div className="text-center mb-6">
              <p className="text-3xl font-bold text-gray-800 mb-1" dir="rtl">
                {quizQuestions[currentQ].nameObj.arabic}
              </p>
              <p className="text-xl font-bold text-indigo-700">
                {quizQuestions[currentQ].nameObj.name}
              </p>
              <p className="text-gray-500 mt-2">What does this name mean?</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {quizQuestions[currentQ].options.map((opt, idx) => {
                const correct = quizQuestions[currentQ].nameObj.meaning;
                let btnClass = "w-full p-4 rounded-2xl font-bold text-lg text-left transition-all duration-200 border-2 ";
                if (showResult) {
                  if (opt === correct) {
                    btnClass += "bg-green-100 border-green-500 text-green-700";
                  } else if (idx === selected && opt !== correct) {
                    btnClass += "bg-red-100 border-red-500 text-red-700";
                  } else {
                    btnClass += "bg-gray-50 border-gray-200 text-gray-400";
                  }
                } else {
                  btnClass += "bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100 hover:border-indigo-400 hover:scale-[1.02] active:scale-95";
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
            <div className="text-6xl mb-4">🎉✨🌟💫🎊</div>
            <h2 className="text-3xl font-bold text-indigo-700 mb-2">MashAllah!</h2>
            <p className="text-xl text-gray-700 mb-4">
              You scored <span className="font-bold text-indigo-600">{score}</span> out of {quizQuestions.length}!
            </p>
            <div className="text-4xl mb-4">
              {Array.from({ length: stars }).map((_, i) => <span key={i}>⭐</span>)}
              {Array.from({ length: 3 - stars }).map((_, i) => <span key={i}>☆</span>)}
            </div>
            <p className="text-gray-500 mb-6">
              {score >= 13 ? "You know Allah's names beautifully!" : score >= 10 ? "Great effort! Keep learning!" : "Review the names and try again!"}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button onClick={() => { setMode('learn'); setPage(0); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                Learn More 📖
              </button>
              <button onClick={generateQuiz} className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                Quiz Again 🎯
              </button>
              <Link href="/kids" className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                Back 🏠
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
