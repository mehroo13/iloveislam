'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const questions = [
  { q: "Who built the Ark?", options: ["Nuh (Noah)", "Ibrahim (Abraham)", "Musa (Moses)", "Isa (Jesus)"], answer: 0 },
  { q: "Who was thrown into fire but was saved by Allah?", options: ["Yusuf (Joseph)", "Ibrahim (Abraham)", "Dawud (David)", "Sulaiman (Solomon)"], answer: 1 },
  { q: "Who was swallowed by a whale?", options: ["Nuh (Noah)", "Musa (Moses)", "Yunus (Jonah)", "Idris (Enoch)"], answer: 2 },
  { q: "Who was the first Prophet?", options: ["Muhammad ﷺ", "Ibrahim (Abraham)", "Adam", "Nuh (Noah)"], answer: 2 },
  { q: "Who was the last Prophet?", options: ["Isa (Jesus)", "Muhammad ﷺ", "Musa (Moses)", "Ibrahim (Abraham)"], answer: 1 },
  { q: "Who interpreted dreams in prison?", options: ["Yusuf (Joseph)", "Dawud (David)", "Sulaiman (Solomon)", "Ayyub (Job)"], answer: 0 },
  { q: "Who could talk to animals?", options: ["Dawud (David)", "Sulaiman (Solomon)", "Adam", "Idris (Enoch)"], answer: 1 },
  { q: "Who parted the Red Sea?", options: ["Nuh (Noah)", "Ibrahim (Abraham)", "Musa (Moses)", "Isa (Jesus)"], answer: 2 },
  { q: "Who was given the Zabur (Psalms)?", options: ["Musa (Moses)", "Dawud (David)", "Isa (Jesus)", "Muhammad ﷺ"], answer: 1 },
  { q: "Who was given the Injeel (Gospel)?", options: ["Musa (Moses)", "Dawud (David)", "Isa (Jesus)", "Muhammad ﷺ"], answer: 2 },
  { q: "Who was given the Tawrat (Torah)?", options: ["Musa (Moses)", "Dawud (David)", "Isa (Jesus)", "Ibrahim (Abraham)"], answer: 0 },
  { q: "Who was known for his patience during illness?", options: ["Yusuf (Joseph)", "Ayyub (Job)", "Nuh (Noah)", "Lut (Lot)"], answer: 1 },
  { q: "Who was asked to sacrifice his son?", options: ["Nuh (Noah)", "Musa (Moses)", "Ibrahim (Abraham)", "Yaqub (Jacob)"], answer: 2 },
  { q: "Who built the Kaaba with his father Ibrahim?", options: ["Ishaq (Isaac)", "Ismail (Ishmael)", "Yusuf (Joseph)", "Yaqub (Jacob)"], answer: 1 },
  { q: "Who was born without a father?", options: ["Adam", "Isa (Jesus)", "Muhammad ﷺ", "Yahya (John)"], answer: 1 },
  { q: "Who lived for 950 years calling people to Allah?", options: ["Adam", "Nuh (Noah)", "Idris (Enoch)", "Ibrahim (Abraham)"], answer: 1 },
  { q: "Who was the father of Yusuf (Joseph)?", options: ["Ibrahim (Abraham)", "Ishaq (Isaac)", "Yaqub (Jacob)", "Ismail (Ishmael)"], answer: 2 },
  { q: "Who was raised to the heavens alive?", options: ["Muhammad ﷺ", "Isa (Jesus)", "Idris (Enoch)", "Ilyas (Elijah)"], answer: 1 },
  { q: "Who was sent to the people of 'Ad?", options: ["Salih", "Hud", "Shuayb", "Lut (Lot)"], answer: 1 },
  { q: "Who was sent to the people of Thamud?", options: ["Hud", "Salih", "Shuayb", "Lut (Lot)"], answer: 1 },
  { q: "Who was sent to the people of Madyan?", options: ["Hud", "Salih", "Shuayb", "Lut (Lot)"], answer: 2 },
  { q: "Which Prophet had a miraculous she-camel?", options: ["Hud", "Salih", "Shuayb", "Nuh (Noah)"], answer: 1 },
  { q: "Who was the son of Dawud (David)?", options: ["Yusuf (Joseph)", "Sulaiman (Solomon)", "Yahya (John)", "Zakariya (Zechariah)"], answer: 1 },
  { q: "Who was the father of Yahya (John)?", options: ["Ibrahim (Abraham)", "Zakariya (Zechariah)", "Dawud (David)", "Ilyas (Elijah)"], answer: 1 },
];

function saveProgress(stars: number) {
  try {
    const raw = localStorage.getItem('kids_islamic_games_v2');
    const data = raw ? JSON.parse(raw) : { stars: 0, completedGames: [], lastPlayed: '' };
    data.stars = (data.stars || 0) + stars;
    if (!data.completedGames.includes('prophets-quiz')) {
      data.completedGames.push('prophets-quiz');
    }
    data.lastPlayed = 'prophets-quiz';
    localStorage.setItem('kids_islamic_games_v2', JSON.stringify(data));
  } catch (e) {}
}

export default function ProphetsQuizPage() {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === questions[currentQ].answer) {
      setScore(s => s + 1);
    }
    setShowResult(true);
    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(c => c + 1);
        setSelected(null);
        setShowResult(false);
      } else {
        setGameOver(true);
      }
    }, 1500);
  };

  useEffect(() => {
    if (gameOver) {
      const stars = score >= 20 ? 3 : score >= 15 ? 2 : score >= 10 ? 1 : 0;
      saveProgress(stars);
    }
  }, [gameOver, score]);

  const stars = score >= 20 ? 3 : score >= 15 ? 2 : score >= 10 ? 1 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-yellow-300 p-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/kids" className="inline-flex items-center gap-2 text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-full font-bold shadow-lg mb-4 text-lg">
          ← Back to Kids
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-center text-white drop-shadow-lg mb-6">
          🕌 Prophets Quiz 🌟
        </h1>

        {!gameOver ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex justify-between items-center mb-4">
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold">
                Q {currentQ + 1}/{questions.length}
              </span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                Score: {score}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
              />
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 text-center">
              {questions[currentQ].q}
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {questions[currentQ].options.map((opt, idx) => {
                let btnClass = "w-full p-4 rounded-2xl font-bold text-lg text-left transition-all duration-200 border-2 ";
                if (showResult) {
                  if (idx === questions[currentQ].answer) {
                    btnClass += "bg-green-100 border-green-500 text-green-700";
                  } else if (idx === selected && idx !== questions[currentQ].answer) {
                    btnClass += "bg-red-100 border-red-500 text-red-700";
                  } else {
                    btnClass += "bg-gray-50 border-gray-200 text-gray-400";
                  }
                } else {
                  btnClass += "bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100 hover:border-purple-400 hover:scale-[1.02] active:scale-95";
                }
                return (
                  <button key={idx} onClick={() => handleAnswer(idx)} className={btnClass} disabled={selected !== null}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎉🌟🎊</div>
            <h2 className="text-3xl font-bold text-purple-700 mb-2">MashAllah!</h2>
            <p className="text-xl text-gray-700 mb-4">
              You scored <span className="font-bold text-purple-600">{score}</span> out of {questions.length}!
            </p>
            <div className="text-4xl mb-4">
              {Array.from({ length: stars }).map((_, i) => <span key={i}>⭐</span>)}
              {Array.from({ length: 3 - stars }).map((_, i) => <span key={i}>☆</span>)}
            </div>
            <p className="text-gray-500 mb-6">
              {score >= 20 ? "Amazing! You know the Prophets so well!" : score >= 15 ? "Great job! Keep learning!" : score >= 10 ? "Good effort! Try again to get more stars!" : "Keep learning about the Prophets!"}
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => { setCurrentQ(0); setScore(0); setSelected(null); setShowResult(false); setGameOver(false); }} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                Play Again 🔄
              </button>
              <Link href="/kids" className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                Back to Kids 🏠
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
