'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-4BDTXNC58M';

const ARABIC_LETTERS = [
  { letter: 'ا', name: 'Alif', example: 'Apple', image: '🍎' },
  { letter: 'ب', name: 'Ba', example: 'House', image: '🏠' },
  { letter: 'ت', name: 'Ta', example: 'Tiger', image: '🐯' },
  { letter: 'ث', name: 'Tha', example: 'Three', image: '3️⃣' },
  { letter: 'ج', name: 'Jeem', example: 'Camel', image: '🐪' },
  { letter: 'ح', name: 'Ha', example: 'Hen', image: '🐔' },
  { letter: 'خ', name: 'Kha', example: 'Bread', image: '🍞' },
  { letter: 'د', name: 'Dal', example: 'Drum', image: '🥁' },
];

export default function ArabicLettersGame() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    generateOptions();
  }, [currentIndex]);

  const generateOptions = () => {
    const current = ARABIC_LETTERS[currentIndex];
    const otherNames = ARABIC_LETTERS.filter(l => l.name !== current.name).map(l => l.name);
    const shuffled = [...otherNames.slice(0, 3), current.name].sort(() => Math.random() - 0.5);
    setOptions(shuffled);
  };

  const handleAnswer = (selected: string) => {
    setSelectedOption(selected);
    const isCorrect = selected === ARABIC_LETTERS[currentIndex].name;
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setTimeout(() => {
      if (currentIndex + 1 < ARABIC_LETTERS.length) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOption(null);
      } else {
        setCompleted(true);
        setShowCelebration(true);
        
        // Save completion
        const saved = localStorage.getItem('kids_completed_games');
        let completedGames = saved ? JSON.parse(saved) : [];
        if (!completedGames.includes('arabic-letters')) {
          completedGames.push('arabic-letters');
          localStorage.setItem('kids_completed_games', JSON.stringify(completedGames));
        }
        
        setTimeout(() => setShowCelebration(false), 5000);
      }
    }, 1000);
  };

  if (completed) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-7xl mb-4 animate-bounce">🎉📖🌟</div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Masha'Allah!</h1>
            <p className="text-gray-600 mb-2">You learned {ARABIC_LETTERS.length} Arabic letters!</p>
            <div className="bg-white rounded-xl p-4 mb-4">
              <p className="text-lg font-bold text-emerald-600">+100 Points</p>
              <p className="text-sm text-gray-500">Arabic Letters Completed</p>
            </div>
            <Link href="/kids" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
              Back to Games 🎮
            </Link>
          </div>
        </div>
      </>
    );
  }

  const current = ARABIC_LETTERS[currentIndex];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <header className="bg-gradient-to-r from-blue-600 to-cyan-700 text-white px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link href="/kids" className="text-white/80 hover:text-white text-sm">← Back</Link>
            <h1 className="font-bold">🔤 Arabic Letters</h1>
            <div className="text-sm">⭐ {score}/{ARABIC_LETTERS.length}</div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="text-8xl mb-4 font-arabic">{current.letter}</div>
            <p className="text-gray-500 mb-2">What is this letter?</p>
            
            <div className="grid grid-cols-2 gap-3 mt-6">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={selectedOption !== null}
                  className={`p-4 rounded-xl font-semibold transition-all ${
                    selectedOption === null
                      ? 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                      : selectedOption === option
                        ? option === current.name
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                        : option === current.name && selectedOption !== null
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 opacity-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </main>

        {showCelebration && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white/95 rounded-2xl p-6 text-center shadow-2xl animate-bounce pointer-events-auto">
              <div className="text-6xl mb-3">🎉📖🌟</div>
              <h3 className="text-2xl font-bold text-blue-600">Masha'Allah!</h3>
              <p>You completed Arabic Letters!</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}