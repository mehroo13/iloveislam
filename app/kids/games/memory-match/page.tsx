'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-4BDTXNC58M';

// 8 pairs of Islamic symbols
const ISLAMIC_SYMBOLS = [
  { id: 1, name: 'Kaaba', icon: '🕋' },
  { id: 2, name: 'Moon & Star', icon: '🌙' },
  { id: 3, name: 'Quran', icon: '📖' },
  { id: 4, name: 'Mosque', icon: '🕌' },
  { id: 5, name: 'Prayer Beads', icon: '📿' },
  { id: 6, name: 'Dates', icon: '🌴' },
  { id: 7, name: 'Zamzam', icon: '💧' },
  { id: 8, name: 'Tasbih', icon: '🔴' },
];

const createCards = () => {
  let cards: any[] = [];
  ISLAMIC_SYMBOLS.forEach((symbol) => {
    cards.push({ id: Math.random(), symbolId: symbol.id, name: symbol.name, icon: symbol.icon, isFlipped: false, isMatched: false });
    cards.push({ id: Math.random(), symbolId: symbol.id, name: symbol.name, icon: symbol.icon, isFlipped: false, isMatched: false });
  });
  return shuffleArray(cards);
};

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export default function MemoryMatchGame() {
  const [cards, setCards] = useState(createCards());
  const [selectedId, setSelectedId] = useState(null);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  useEffect(() => {
    if (matchedPairs === ISLAMIC_SYMBOLS.length && !gameComplete) {
      setGameComplete(true);
      setShowCelebration(true);
      
      // Save completion
      const saved = localStorage.getItem('kids_completed_games');
      let completedGames = saved ? JSON.parse(saved) : [];
      if (!completedGames.includes('memory-match')) {
        completedGames.push('memory-match');
        localStorage.setItem('kids_completed_games', JSON.stringify(completedGames));
        setPointsEarned(100);
      }
      
      // Track in GA
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'game_completed', {
          event_category: 'kids_game',
          event_label: 'memory_match',
          value: moves,
        });
      }
      
      setTimeout(() => setShowCelebration(false), 5000);
    }
  }, [matchedPairs, gameComplete, moves]);

  const handleCardClick = (clickedCard: any) => {
    if (clickedCard.isMatched || clickedCard.isFlipped || gameComplete) return;
    if (selectedId === clickedCard.id) return;

    if (selectedId === null) {
      setCards(cards.map(c => c.id === clickedCard.id ? { ...c, isFlipped: true } : c));
      setSelectedId(clickedCard.id);
      return;
    }

    const selectedCard = cards.find(c => c.id === selectedId);
    setCards(cards.map(c => c.id === clickedCard.id ? { ...c, isFlipped: true } : c));
    setMoves(prev => prev + 1);

    if (selectedCard.symbolId === clickedCard.symbolId) {
      setMatchedPairs(prev => prev + 1);
      setCards(cards.map(c => (c.id === selectedId || c.id === clickedCard.id) ? { ...c, isMatched: true } : c));
      setSelectedId(null);
    } else {
      setTimeout(() => {
        setCards(cards.map(c => (c.id === selectedId || c.id === clickedCard.id) ? { ...c, isFlipped: false } : c));
        setSelectedId(null);
      }, 800);
    }
  };

  const resetGame = () => {
    setCards(createCards());
    setSelectedId(null);
    setMoves(0);
    setMatchedPairs(0);
    setGameComplete(false);
  };

  if (gameComplete) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-7xl mb-4 animate-bounce">🎉🌟🕋</div>
            <h1 className="text-3xl font-bold text-pink-600 dark:text-pink-400 mb-2">Masha'Allah!</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">You matched all {ISLAMIC_SYMBOLS.length} pairs in {moves} moves!</p>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
              <p className="text-lg font-bold text-emerald-600">+100 Points</p>
              <p className="text-sm text-gray-500">Memory Game Completed</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={resetGame} className="px-5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">Play Again</button>
              <Link href="/kids" className="px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition">Back to Games 🎮</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <header className="bg-gradient-to-r from-pink-600 to-purple-700 text-white px-4 py-3 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link href="/kids" className="text-white/80 hover:text-white text-sm">← Back</Link>
            <h1 className="font-bold">🎴 Memory Match</h1>
            <div className="text-sm">🎯 {matchedPairs}/{ISLAMIC_SYMBOLS.length}</div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 flex justify-between items-center shadow-md">
            <div className="text-center">
              <p className="text-xs text-gray-500">Moves</p>
              <p className="text-2xl font-bold text-pink-600">{moves}</p>
            </div>
            <button onClick={resetGame} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm">🔄 New Game</button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                disabled={card.isMatched}
                className={`aspect-square rounded-xl text-3xl font-bold transition-all duration-300 flex items-center justify-center shadow-md
                  ${card.isFlipped || card.isMatched 
                    ? 'bg-gradient-to-br from-pink-100 to-purple-100 dark:bg-gray-700 scale-100' 
                    : 'bg-gradient-to-br from-pink-400 to-purple-500 scale-95 hover:scale-100'
                  }
                  ${card.isMatched ? 'opacity-50' : ''}
                `}
              >
                {(card.isFlipped || card.isMatched) ? card.icon : '?'}
              </button>
            ))}
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            Find matching pairs of Islamic symbols!
          </div>
        </main>

        {showCelebration && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white/95 rounded-2xl p-6 text-center shadow-2xl animate-bounce pointer-events-auto">
              <div className="text-6xl mb-3">🎉🌟🕋</div>
              <h3 className="text-2xl font-bold text-pink-600">Masha'Allah!</h3>
              <p>You completed the game!</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}