'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-4BDTXNC58M';

const DUAS = [
  { id: 1, arabic: 'بسم الله', english: 'Bismillah', meaning: 'In the name of Allah', occasion: 'Before eating' },
  { id: 2, arabic: 'الحمد لله', english: 'Alhamdulillah', meaning: 'All praise is for Allah', occasion: 'After eating' },
  { id: 3, arabic: 'السلام عليكم', english: 'Assalamu Alaikum', meaning: 'Peace be upon you', occasion: 'When meeting someone' },
  { id: 4, arabic: 'ما شاء الله', english: 'Masha\'Allah', meaning: 'Allah has willed', occasion: 'When seeing something good' },
  { id: 5, arabic: 'إن شاء الله', english: 'Insha\'Allah', meaning: 'If Allah wills', occasion: 'When planning the future' },
  { id: 6, arabic: 'سبحان الله', english: 'SubhanAllah', meaning: 'Glory be to Allah', occasion: 'When amazed by creation' },
];

export default function DuaMemoryGame() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleKnow = () => {
    setScore(score + 1);
    nextDua();
  };

  const handleDontKnow = () => {
    nextDua();
  };

  const nextDua = () => {
    if (currentIndex + 1 < DUAS.length) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      setCompleted(true);
      setShowCelebration(true);
      
      const saved = localStorage.getItem('kids_completed_games');
      let completedGames = saved ? JSON.parse(saved) : [];
      if (!completedGames.includes('dua-memory')) {
        completedGames.push('dua-memory');
        localStorage.setItem('kids_completed_games', JSON.stringify(completedGames));
      }
      
      setTimeout(() => setShowCelebration(false), 5000);
    }
  };

  const currentDua = DUAS[currentIndex];

  if (completed) {
    return (
      <>
        <Script strategy="lazyOnload" src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
        <Script id="google-analytics" strategy="lazyOnload" dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_MEASUREMENT_ID}');` }} />
        
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-7xl mb-4 animate-bounce">🎉🤲🌟</div>
            <h1 className="text-3xl font-bold text-purple-600 mb-2">Masha'Allah!</h1>
            <p className="text-gray-600 mb-2">You learned {DUAS.length} daily duas!</p>
            <div className="bg-white rounded-xl p-4 mb-4">
              <p className="text-lg font-bold text-emerald-600">+100 Points</p>
              <p className="text-sm text-gray-500">Dua Memory Completed</p>
            </div>
            <Link href="/kids" className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">
              Back to Games 🎮
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Script strategy="lazyOnload" src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      <Script id="google-analytics" strategy="lazyOnload" dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_MEASUREMENT_ID}');` }} />

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
        <header className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link href="/kids" className="text-white/80 hover:text-white text-sm">← Back</Link>
            <h1 className="font-bold">🤲 Dua Memory</h1>
            <div className="text-sm">⭐ {score}/{DUAS.length}</div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <p className="text-xs text-gray-500 mb-2">Dua {currentIndex + 1} of {DUAS.length}</p>
            
            <div className="text-4xl font-arabic mb-4">{currentDua.arabic}</div>
            <p className="text-gray-500 text-sm mb-2">{currentDua.occasion}</p>
            
            {!showAnswer ? (
              <button
                onClick={() => setShowAnswer(true)}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
              >
                Show Meaning →
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-xl font-semibold text-purple-700">{currentDua.english}</p>
                <p className="text-gray-600 text-sm">{currentDua.meaning}</p>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleDontKnow}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
                  >
                    Need Practice
                  </button>
                  <button
                    onClick={handleKnow}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                  >
                    I Know It ✅
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            🤲 Learn daily duas with their meanings and occasions
          </div>
        </main>

        {showCelebration && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white/95 rounded-2xl p-6 text-center shadow-2xl animate-bounce pointer-events-auto">
              <div className="text-6xl mb-3">🎉🤲🌟</div>
              <h3 className="text-2xl font-bold text-purple-600">Masha'Allah!</h3>
              <p>You learned all the duas!</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}