'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-4BDTXNC58M';

const QUESTIONS = [
  { id: 1, question: "What is the FIRST pillar of Islam?", options: ["Salah", "Shahada", "Zakat", "Sawm"], correct: 1 },
  { id: 2, question: "How many times do Muslims pray daily?", options: ["3 times", "5 times", "7 times", "1 time"], correct: 1 },
  { id: 3, question: "What is Zakat?", options: ["Prayer", "Fasting", "Charity", "Pilgrimage"], correct: 2 },
  { id: 4, question: "During which month do Muslims fast?", options: ["Muharram", "Rajab", "Ramadan", "Sha'ban"], correct: 2 },
  { id: 5, question: "Where do Muslims go for Hajj?", options: ["Madinah", "Jerusalem", "Cairo", "Makkah"], correct: 3 },
];

export default function PillarsQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const handleAnswer = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    if (optionIndex === QUESTIONS[currentQuestion].correct) {
      setScore(score + 1);
    }
    
    setTimeout(() => {
      if (currentQuestion + 1 < QUESTIONS.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
      } else {
        setShowResult(true);
        setShowCelebration(true);
        
        // Save completion
        const saved = localStorage.getItem('kids_completed_games');
        let completedGames = saved ? JSON.parse(saved) : [];
        if (!completedGames.includes('pillars-of-islam')) {
          completedGames.push('pillars-of-islam');
          localStorage.setItem('kids_completed_games', JSON.stringify(completedGames));
          setPointsEarned(score + (optionIndex === QUESTIONS[currentQuestion].correct ? 1 : 0) > 3 ? 100 : 50);
        }
        
        setTimeout(() => setShowCelebration(false), 5000);
      }
    }, 1000);
  };

  if (showResult) {
    const passed = score >= 3;
    return (
      <>
        <Script strategy="lazyOnload" src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
        <Script id="google-analytics" strategy="lazyOnload" dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_MEASUREMENT_ID}');` }} />
        
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-7xl mb-4">{passed ? '🏆🎉' : '📚🌟'}</div>
            <h1 className="text-3xl font-bold text-amber-600 mb-2">{passed ? 'Masha\'Allah!' : 'Good Try!'}</h1>
            <p className="text-gray-600 mb-2">You scored {score} out of {QUESTIONS.length}</p>
            <div className="bg-white rounded-xl p-4 mb-4">
              <p className="text-lg font-bold text-emerald-600">+{passed ? 100 : 50} Points</p>
              <p className="text-sm text-gray-500">Pillars Quiz {passed ? 'Completed' : 'Attempted'}</p>
            </div>
            <Link href="/kids" className="inline-block px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition">
              Back to Games 🎮
            </Link>
          </div>
        </div>
      </>
    );
  }

  const q = QUESTIONS[currentQuestion];

  return (
    <>
      <Script strategy="lazyOnload" src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      <Script id="google-analytics" strategy="lazyOnload" dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_MEASUREMENT_ID}');` }} />

      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <header className="bg-gradient-to-r from-amber-600 to-orange-700 text-white px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link href="/kids" className="text-white/80 hover:text-white text-sm">← Back</Link>
            <h1 className="font-bold">🏛️ 5 Pillars of Islam</h1>
            <div className="text-sm">Q{currentQuestion + 1}/{QUESTIONS.length}</div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-6xl mb-3">🕌</div>
              <p className="text-xs text-gray-500 mb-2">Question {currentQuestion + 1}</p>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{q.question}</h2>
            </div>

            <div className="space-y-3">
              {q.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={selectedOption !== null}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedOption === null
                      ? 'bg-gray-100 dark:bg-gray-700 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                      : selectedOption === idx
                        ? idx === q.correct
                          ? 'bg-green-100 dark:bg-green-900/30 border-green-500'
                          : 'bg-red-100 dark:bg-red-900/30 border-red-500'
                        : idx === q.correct && selectedOption !== null
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-gray-100 dark:bg-gray-700 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{['A', 'B', 'C', 'D'][idx]}</span>
                    <span>{option}</span>
                    {selectedOption === idx && idx === q.correct && <span className="ml-auto">✅</span>}
                    {selectedOption === idx && idx !== q.correct && <span className="ml-auto">❌</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>

        {showCelebration && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white/95 rounded-2xl p-6 text-center shadow-2xl animate-bounce pointer-events-auto">
              <div className="text-6xl mb-3">🎉🏆🕌</div>
              <h3 className="text-2xl font-bold text-amber-600">Quiz Complete!</h3>
              <p>You scored {score}/{QUESTIONS.length}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}