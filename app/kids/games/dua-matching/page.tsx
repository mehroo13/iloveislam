'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const duaPairs = [
  { situation: "Before eating", dua: "Bismillah", emoji: "🍽️" },
  { situation: "After eating", dua: "Alhamdulillahil-ladhi at'amana", emoji: "😊" },
  { situation: "After sneezing", dua: "Alhamdulillah", emoji: "🤧" },
  { situation: "Entering bathroom", dua: "Allahumma inni a'udhu bika minal khubthi wal khaba'ith", emoji: "🚪" },
  { situation: "Leaving home", dua: "Bismillahi tawakkaltu 'alAllah", emoji: "🏠" },
  { situation: "Before sleeping", dua: "Bismika Allahumma amutu wa ahya", emoji: "🌙" },
  { situation: "Waking up", dua: "Alhamdulillahil-ladhi ahyana ba'da ma amatana", emoji: "☀️" },
  { situation: "Entering mosque", dua: "Allahummaf-tahli abwaba rahmatik", emoji: "🕌" },
  { situation: "When it rains", dua: "Allahumma sayyiban nafi'a", emoji: "🌧️" },
  { situation: "When looking in mirror", dua: "Allahumma ahsanta khalqi fa ahsin khuluqi", emoji: "🪞" },
  { situation: "When wearing new clothes", dua: "Alhamdulillahil-ladhi kasani", emoji: "👕" },
  { situation: "When traveling", dua: "Subhanal-ladhi sakh-khara lana hadha", emoji: "✈️" },
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
    if (!data.completedGames.includes('dua-matching')) {
      data.completedGames.push('dua-matching');
    }
    data.lastPlayed = 'dua-matching';
    localStorage.setItem('kids_islamic_games_v2', JSON.stringify(data));
  } catch (e) {}
}

export default function DuaMatchingPage() {
  const [shuffledDuas, setShuffledDuas] = useState<typeof duaPairs>([]);
  const [selectedSituation, setSelectedSituation] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    setShuffledDuas(shuffle(duaPairs));
  }, []);

  const handleSituationClick = (idx: number) => {
    if (matched.has(idx)) return;
    setSelectedSituation(idx);
    setWrong(null);
  };

  const handleDuaClick = (duaIdx: number) => {
    if (selectedSituation === null) return;
    setAttempts(a => a + 1);

    const situationItem = duaPairs[selectedSituation];
    const duaItem = shuffledDuas[duaIdx];

    if (situationItem.dua === duaItem.dua) {
      const newMatched = new Set(matched);
      newMatched.add(selectedSituation);
      setMatched(newMatched);
      setScore(s => s + 1);
      setSelectedSituation(null);

      if (newMatched.size === duaPairs.length) {
        setGameOver(true);
      }
    } else {
      setWrong(duaIdx);
      setTimeout(() => setWrong(null), 800);
    }
  };

  useEffect(() => {
    if (gameOver) {
      const stars = attempts <= 14 ? 3 : attempts <= 18 ? 2 : 1;
      saveProgress(stars);
    }
  }, [gameOver, attempts]);

  const stars = attempts <= 14 ? 3 : attempts <= 18 ? 2 : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-cyan-300 to-blue-400 p-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/kids" className="inline-flex items-center gap-2 text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-full font-bold shadow-lg mb-4 text-lg">
          ← Back to Kids
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-center text-white drop-shadow-lg mb-2">
          🤲 Dua Matching Game 🤲
        </h1>
        <p className="text-center text-white/80 mb-6">Click a situation, then click the matching dua!</p>

        {!gameOver ? (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Situations column */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3 text-center">📋 Situations</h3>
              <div className="space-y-2">
                {duaPairs.map((pair, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSituationClick(idx)}
                    disabled={matched.has(idx)}
                    className={`w-full p-3 rounded-2xl font-bold text-left transition-all duration-200 ${
                      matched.has(idx)
                        ? 'bg-green-100 border-2 border-green-400 text-green-700 opacity-60'
                        : selectedSituation === idx
                        ? 'bg-yellow-100 border-2 border-yellow-500 text-yellow-800 scale-[1.02] shadow-lg'
                        : 'bg-white border-2 border-gray-200 text-gray-800 hover:border-teal-400 hover:bg-teal-50'
                    }`}
                  >
                    <span className="mr-2">{pair.emoji}</span>
                    {pair.situation}
                    {matched.has(idx) && ' ✅'}
                  </button>
                ))}
              </div>
            </div>

            {/* Duas column */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3 text-center">🤲 Duas</h3>
              <div className="space-y-2">
                {shuffledDuas.map((pair, idx) => {
                  const isMatched = matched.has(duaPairs.findIndex(p => p.dua === pair.dua));
                  return (
                    <button
                      key={idx}
                      onClick={() => handleDuaClick(idx)}
                      disabled={isMatched}
                      className={`w-full p-3 rounded-2xl font-bold text-left transition-all duration-200 text-sm ${
                        isMatched
                          ? 'bg-green-100 border-2 border-green-400 text-green-700 opacity-60'
                          : wrong === idx
                          ? 'bg-red-100 border-2 border-red-500 text-red-700 animate-pulse'
                          : 'bg-white border-2 border-gray-200 text-gray-800 hover:border-cyan-400 hover:bg-cyan-50'
                      }`}
                    >
                      {pair.dua}
                      {isMatched && ' ✅'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎉🤲✨🌟🎊</div>
            <h2 className="text-3xl font-bold text-teal-700 mb-2">MashAllah!</h2>
            <p className="text-xl text-gray-700 mb-4">
              You matched all {duaPairs.length} duas in {attempts} attempts!
            </p>
            <div className="text-4xl mb-4">
              {Array.from({ length: stars }).map((_, i) => <span key={i}>⭐</span>)}
              {Array.from({ length: 3 - stars }).map((_, i) => <span key={i}>☆</span>)}
            </div>
            <p className="text-gray-500 mb-6">Now you know which dua to say! 🤲</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => { setShuffledDuas(shuffle(duaPairs)); setSelectedSituation(null); setMatched(new Set()); setWrong(null); setScore(0); setAttempts(0); setGameOver(false); }} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                Play Again 🔄
              </button>
              <Link href="/kids" className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                Back to Kids 🏠
              </Link>
            </div>
          </div>
        )}

        {/* Score bar */}
        {!gameOver && (
          <div className="mt-4 bg-white/80 rounded-full px-4 py-2 flex justify-between items-center">
            <span className="font-bold text-teal-700">Matched: {matched.size}/{duaPairs.length}</span>
            <span className="font-bold text-gray-600">Attempts: {attempts}</span>
          </div>
        )}
      </div>
    </div>
  );
}
