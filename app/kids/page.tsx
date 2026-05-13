'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  completed?: boolean;
}

export default function KidsCorner() {
  const [completedGames, setCompletedGames] = useState<string[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  // Load completed games from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kids_completed_games');
    if (saved) {
      const completed = JSON.parse(saved);
      setCompletedGames(completed);
      setTotalPoints(completed.length * 100);
    }
  }, []);

  const games: Game[] = [
    {
      id: 'memory-match',
      name: '📿 Memory Match Game',
      description: 'Match pairs of Islamic symbols and objects',
      icon: '🎴',
      href: '/kids/games/memory-match',
      color: 'from-pink-500 to-rose-500',
      difficulty: 'Easy',
      category: 'Memory & Focus',
      completed: completedGames.includes('memory-match'),
    },
    {
      id: 'prayer-guide',
      name: '🕌 Learn to Pray',
      description: 'Step-by-step interactive prayer guide for kids',
      icon: '🕋',
      href: '/kids/games/prayer-guide',
      color: 'from-emerald-500 to-teal-500',
      difficulty: 'Medium',
      category: 'Prayer Learning',
      completed: completedGames.includes('prayer-guide'),
    },
    {
      id: 'arabic-letters',
      name: '🔤 Arabic Letters',
      description: 'Match Arabic letters with pictures',
      icon: '📖',
      href: '/kids/games/arabic-letters',
      color: 'from-blue-500 to-cyan-500',
      difficulty: 'Easy',
      category: 'Language Learning',
      completed: completedGames.includes('arabic-letters'),
    },
    {
      id: 'dua-memory',
      name: '🤲 Dua Memory',
      description: 'Learn daily duas through matching',
      icon: '🕌',
      href: '/kids/games/dua-memory',
      color: 'from-purple-500 to-indigo-500',
      difficulty: 'Medium',
      category: 'Dua Learning',
      completed: completedGames.includes('dua-memory'),
    },
    {
      id: 'pillars-of-islam',
      name: '🏛️ 5 Pillars of Islam',
      description: 'Interactive quiz about Islamic pillars',
      icon: '⭐',
      href: '/kids/games/pillars-quiz',
      color: 'from-amber-500 to-orange-500',
      difficulty: 'Hard',
      category: 'Islamic Knowledge',
      completed: completedGames.includes('pillars-of-islam'),
    },
  ];

  const completedCount = games.filter(g => g.completed).length;
  const progressPercentage = (completedCount / games.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-600 to-purple-700 dark:from-pink-800 dark:to-purple-900 text-white px-4 py-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="text-white/80 hover:text-white text-sm flex items-center gap-1">
              ← Back to Home
            </Link>
            <div className="flex items-center gap-2 text-sm">
              <span>⭐ {totalPoints} Points</span>
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">🧒 Kids Islamic Games 🎮</h1>
            <p className="text-white/80 text-sm">Learn about Islam through fun and interactive games!</p>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-center text-xs text-white/70 mt-2">
            {completedCount} of {games.length} games completed • {progressPercentage}% Mastery
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-md">
            <div className="text-2xl mb-1">🎮</div>
            <div className="text-xl font-bold text-pink-600">{games.length}</div>
            <div className="text-[10px] text-gray-500">Total Games</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-md">
            <div className="text-2xl mb-1">⭐</div>
            <div className="text-xl font-bold text-emerald-600">{totalPoints}</div>
            <div className="text-[10px] text-gray-500">Points Earned</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-md">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-xl font-bold text-amber-600">{completedCount}</div>
            <div className="text-[10px] text-gray-500">Completed</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-md">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-xl font-bold text-orange-600">{Math.floor(progressPercentage)}%</div>
            <div className="text-[10px] text-gray-500">Mastery</div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {games.map((game) => (
            <Link
              key={game.id}
              href={game.href}
              className={`block rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                game.completed ? 'ring-2 ring-amber-400' : ''
              }`}
            >
              <div className={`bg-gradient-to-br ${game.color} p-5 text-white`}>
                <div className="text-5xl mb-3">{game.icon}</div>
                <h2 className="font-bold text-xl mb-1">{game.name}</h2>
                <p className="text-white/80 text-sm">{game.description}</p>
                <div className="flex gap-2 mt-3">
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{game.difficulty}</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{game.category}</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Play Now →</span>
                {game.completed && (
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                    ✅ Completed
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Parent Guide */}
        <div className="mt-8 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">👨‍👩‍👧‍👦 Parent Guide</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            These games help children learn about Islam in a fun, engaging way. Each game teaches different Islamic concepts:
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>🎴 • <strong>Memory Match:</strong> Builds concentration while learning Islamic symbols</li>
            <li>🕌 • <strong>Prayer Guide:</strong> Step-by-step prayer positions and meanings</li>
            <li>🔤 • <strong>Arabic Letters:</strong> Introduction to Arabic alphabet</li>
            <li>🤲 • <strong>Dua Memory:</strong> Memorize daily prayers</li>
            <li>🏛️ • <strong>5 Pillars:</strong> Core Islamic knowledge</li>
          </ul>
          <p className="text-xs text-gray-400 mt-3">✨ All games are 100% free, no ads, no sign-up required!</p>
        </div>
      </main>
    </div>
  );
}