'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type AgeGroup = 'all' | '3-5' | '6-9' | '10-13';
type Category = 'all' | 'quran' | 'prayer' | 'arabic' | 'knowledge' | 'fun';

interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: Category;
  categoryLabel: string;
  ageGroup: AgeGroup[];
  stars: number; // max stars earnable
  isNew?: boolean;
  comingSoon?: boolean;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  requirement: number; // stars needed
}

// ─── Games Data ───────────────────────────────────────────────────────────────
const GAMES: Game[] = [
  // Existing 5 games
  { id: 'memory-match', name: 'Memory Match', description: 'Match pairs of Islamic symbols and objects', icon: '🎴', href: '/kids/games/memory-match', color: 'from-pink-500 to-rose-500', difficulty: 'Easy', category: 'fun', categoryLabel: 'Memory & Focus', ageGroup: ['3-5', '6-9'], stars: 3 },
  { id: 'prayer-guide', name: 'Learn to Pray', description: 'Step-by-step interactive prayer guide', icon: '🕌', href: '/kids/games/prayer-guide', color: 'from-emerald-500 to-teal-500', difficulty: 'Medium', category: 'prayer', categoryLabel: 'Prayer Learning', ageGroup: ['6-9', '10-13'], stars: 5 },
  { id: 'arabic-letters', name: 'Arabic Letters', description: 'Learn the Arabic alphabet with fun', icon: '🔤', href: '/kids/games/arabic-letters', color: 'from-blue-500 to-cyan-500', difficulty: 'Easy', category: 'arabic', categoryLabel: 'Language', ageGroup: ['3-5', '6-9'], stars: 3 },
  { id: 'dua-memory', name: 'Dua Memory', description: 'Learn daily duas through matching', icon: '🤲', href: '/kids/games/dua-memory', color: 'from-purple-500 to-indigo-500', difficulty: 'Medium', category: 'prayer', categoryLabel: 'Dua Learning', ageGroup: ['6-9', '10-13'], stars: 4 },
  { id: 'pillars-quiz', name: '5 Pillars Quiz', description: 'Test your knowledge of Islamic pillars', icon: '🏛️', href: '/kids/games/pillars-quiz', color: 'from-amber-500 to-orange-500', difficulty: 'Hard', category: 'knowledge', categoryLabel: 'Islamic Knowledge', ageGroup: ['6-9', '10-13'], stars: 5 },
  // New games
  { id: 'prophets-quiz', name: 'Prophets & Stories', description: 'Learn about 25 Prophets through stories and quizzes', icon: '🕌', href: '/kids/games/prophets-quiz', color: 'from-teal-500 to-emerald-600', difficulty: 'Medium', category: 'knowledge', categoryLabel: 'Islamic Stories', ageGroup: ['6-9', '10-13'], stars: 5, isNew: true },
  { id: 'dhikr-challenge', name: 'Dhikr Challenge', description: 'Reach dhikr targets with fun animations', icon: '📿', href: '/kids/games/dhikr-challenge', color: 'from-green-500 to-emerald-500', difficulty: 'Easy', category: 'prayer', categoryLabel: 'Worship', ageGroup: ['3-5', '6-9'], stars: 3, isNew: true },
  { id: 'dua-matching', name: 'Dua Situations', description: 'Match the right dua to each situation', icon: '🤲', href: '/kids/games/dua-matching', color: 'from-violet-500 to-purple-600', difficulty: 'Medium', category: 'prayer', categoryLabel: 'Dua Learning', ageGroup: ['6-9', '10-13'], stars: 4, isNew: true },
  { id: 'islamic-months', name: 'Islamic Months', description: 'Learn all 12 Hijri months and their significance', icon: '🌙', href: '/kids/games/islamic-months', color: 'from-indigo-500 to-blue-600', difficulty: 'Easy', category: 'knowledge', categoryLabel: 'Calendar', ageGroup: ['6-9', '10-13'], stars: 3, isNew: true },
  { id: 'asma-ul-husna', name: 'Asma ul Husna', description: 'Learn 99 Names of Allah in a fun way', icon: '⭐', href: '/kids/games/asma-ul-husna', color: 'from-yellow-500 to-amber-500', difficulty: 'Medium', category: 'quran', categoryLabel: '99 Names', ageGroup: ['6-9', '10-13'], stars: 5, isNew: true },
  { id: 'islamic-trivia', name: 'Islamic Trivia', description: '100+ fun trivia questions about Islam', icon: '🏆', href: '/kids/games/islamic-trivia', color: 'from-red-500 to-pink-500', difficulty: 'Hard', category: 'knowledge', categoryLabel: 'Trivia', ageGroup: ['10-13'], stars: 5, isNew: true },
  // More games
  { id: 'word-builder', name: 'Arabic Word Builder', description: 'Build Arabic words from letters', icon: '🔤', href: '/kids/games/word-builder', color: 'from-cyan-500 to-blue-500', difficulty: 'Medium', category: 'arabic', categoryLabel: 'Language', ageGroup: ['6-9', '10-13'], stars: 4, isNew: true },
  { id: 'hajj-adventure', name: 'Hajj Adventure', description: 'Interactive journey through Hajj steps', icon: '🕋', href: '/kids/games/hajj-adventure', color: 'from-stone-500 to-amber-600', difficulty: 'Medium', category: 'knowledge', categoryLabel: 'Hajj', ageGroup: ['6-9', '10-13'], stars: 5, isNew: true },
  { id: 'sahaba-heroes', name: 'Sahaba Heroes', description: 'Learn about the companions of the Prophet ﷺ', icon: '🌟', href: '/kids/games/sahaba-heroes', color: 'from-emerald-600 to-green-500', difficulty: 'Hard', category: 'knowledge', categoryLabel: 'History', ageGroup: ['10-13'], stars: 5, isNew: true },
  { id: 'seerah-adventure', name: 'Seerah Adventure', description: "Interactive timeline of the Prophet's ﷺ life", icon: '📖', href: '/kids/games/seerah-adventure', color: 'from-amber-600 to-yellow-500', difficulty: 'Hard', category: 'knowledge', categoryLabel: 'Seerah', ageGroup: ['10-13'], stars: 5, isNew: true },
  { id: 'quran-letters', name: 'Quran Letter Spot', description: 'Find Arabic letters in Quranic text', icon: '📖', href: '/kids/games/quran-letters', color: 'from-teal-600 to-cyan-500', difficulty: 'Medium', category: 'quran', categoryLabel: 'Quran', ageGroup: ['6-9', '10-13'], stars: 4, isNew: true },
  { id: 'islamic-coloring', name: 'Islamic Patterns', description: 'Create beautiful Islamic geometric patterns', icon: '🎨', href: '/kids/games/islamic-coloring', color: 'from-pink-400 to-rose-500', difficulty: 'Easy', category: 'fun', categoryLabel: 'Art', ageGroup: ['3-5', '6-9'], stars: 2, isNew: true },
];

const BADGES: Badge[] = [
  { id: 'starter', name: 'First Steps', icon: '🌱', description: 'Complete your first game', requirement: 3 },
  { id: 'learner', name: 'Young Learner', icon: '📚', description: 'Earn 15 stars', requirement: 15 },
  { id: 'prayer-pro', name: 'Prayer Pro', icon: '🕌', description: 'Earn 25 stars', requirement: 25 },
  { id: 'arabic-ace', name: 'Arabic Ace', icon: '🔤', description: 'Earn 35 stars', requirement: 35 },
  { id: 'scholar', name: 'Young Scholar', icon: '🎓', description: 'Earn 50 stars', requirement: 50 },
  { id: 'champion', name: 'Islamic Champion', icon: '🏆', description: 'Earn 75 stars', requirement: 75 },
  { id: 'hafiz', name: 'Little Hafiz', icon: '👑', description: 'Earn 100 stars', requirement: 100 },
];

const AGE_GROUPS = [
  { id: 'all' as AgeGroup, label: '✨ All Ages', emoji: '✨' },
  { id: '3-5' as AgeGroup, label: '🌱 Ages 3-5', emoji: '🌱' },
  { id: '6-9' as AgeGroup, label: '🌟 Ages 6-9', emoji: '🌟' },
  { id: '10-13' as AgeGroup, label: '📚 Ages 10-13', emoji: '📚' },
];

const CATEGORIES = [
  { id: 'all' as Category, label: 'All', icon: '🎮' },
  { id: 'quran' as Category, label: 'Quran', icon: '📖' },
  { id: 'prayer' as Category, label: 'Prayer & Dua', icon: '🤲' },
  { id: 'arabic' as Category, label: 'Arabic', icon: '🔤' },
  { id: 'knowledge' as Category, label: 'Knowledge', icon: '🧠' },
  { id: 'fun' as Category, label: 'Fun', icon: '🎯' },
];

const ENCOURAGEMENTS = [
  'MashAllah! Keep going! 🌟',
  'You\'re doing amazing! ⭐',
  'Allah loves those who learn! 📚',
  'SubhanAllah! Great progress! 🎉',
  'Keep learning, little scholar! 🏆',
];

const LS_KEY = 'kids_islamic_games_v2';

interface SavedData {
  stars: number;
  completedGames: string[];
  lastPlayed: string;
}

export default function KidsCorner() {
  const [data, setData] = useState<SavedData>({ stars: 0, completedGames: [], lastPlayed: '' });
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('all');
  const [category, setCategory] = useState<Category>('all');
  const [showBadges, setShowBadges] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setData(JSON.parse(saved));
      // Migrate from old format
      const oldSaved = localStorage.getItem('kids_completed_games');
      if (oldSaved && !saved) {
        const completed = JSON.parse(oldSaved);
        const migrated = { stars: completed.length * 3, completedGames: completed, lastPlayed: '' };
        setData(migrated);
        localStorage.setItem(LS_KEY, JSON.stringify(migrated));
      }
    } catch {}
  }, []);

  const filteredGames = useMemo(() => {
    return GAMES.filter(g => {
      if (ageGroup !== 'all' && !g.ageGroup.includes(ageGroup)) return false;
      if (category !== 'all' && g.category !== category) return false;
      return true;
    });
  }, [ageGroup, category]);

  const earnedBadges = BADGES.filter(b => data.stars >= b.requirement);
  const nextBadge = BADGES.find(b => data.stars < b.requirement);
  const level = earnedBadges.length;
  const levelNames = ['Beginner', 'Student', 'Learner', 'Explorer', 'Scholar', 'Master', 'Champion', 'Hafiz'];
  const currentLevel = levelNames[Math.min(level, levelNames.length - 1)];
  const encouragement = ENCOURAGEMENTS[Math.floor(Date.now() / 86400000) % ENCOURAGEMENTS.length];

  const availableGames = filteredGames.filter(g => !g.comingSoon);
  const comingSoonGames = filteredGames.filter(g => g.comingSoon);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white px-4 py-5 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="max-w-4xl mx-auto relative">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="text-white/70 hover:text-white text-sm transition-colors">← Home</Link>
            <button onClick={() => setShowBadges(!showBadges)} className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-white/30 transition-all">
              ⭐ {data.stars} Stars
            </button>
          </div>

          <div className="text-center mb-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-1">🧒 Islamic Games Hub 🎮</h1>
            <p className="text-white/80 text-sm">Learn Islam through fun games — 100% free, no ads!</p>
            <p className="text-yellow-200 text-xs mt-1 font-medium">{encouragement}</p>
          </div>

          {/* Level & Progress */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">
              {earnedBadges.length > 0 ? earnedBadges[earnedBadges.length - 1].icon : '🌱'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold">Level: {currentLevel}</span>
                <span className="text-xs text-white/60">{data.completedGames.length} games done</span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-700"
                  style={{ width: nextBadge ? `${(data.stars / nextBadge.requirement) * 100}%` : '100%' }} />
              </div>
              <p className="text-[10px] text-white/50 mt-1">
                {nextBadge ? `${nextBadge.requirement - data.stars} more stars to "${nextBadge.name}" badge` : '🏆 All badges earned!'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Badges panel */}
      {showBadges && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5 animate-slideDown">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">🏆 Your Badges</h3>
              <button onClick={() => setShowBadges(false)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
              {BADGES.map(badge => {
                const earned = data.stars >= badge.requirement;
                return (
                  <div key={badge.id} className={`text-center p-2 rounded-xl transition-all ${earned ? 'bg-yellow-50 dark:bg-yellow-900/20 scale-105' : 'bg-gray-50 dark:bg-gray-700 opacity-40'}`}>
                    <span className="text-2xl block mb-1">{badge.icon}</span>
                    <p className="text-[9px] font-bold text-gray-600 dark:text-gray-300">{badge.name}</p>
                    <p className="text-[8px] text-gray-400">{badge.requirement}⭐</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Age Group Selector */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {AGE_GROUPS.map(ag => (
            <button key={ag.id} onClick={() => setAgeGroup(ag.id)}
              className={`px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                ageGroup === ag.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}>
              {ag.label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
                category === cat.id ? 'bg-pink-500 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: '🎮', value: availableGames.length, label: 'Games' },
            { icon: '⭐', value: data.stars, label: 'Stars' },
            { icon: '✅', value: data.completedGames.length, label: 'Done' },
            { icon: '🏆', value: earnedBadges.length, label: 'Badges' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm border border-gray-100 dark:border-gray-700">
              <span className="text-xl block">{s.icon}</span>
              <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{s.value}</span>
              <span className="text-[9px] text-gray-400 block">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Games Grid */}
        {availableGames.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              🎮 Games ({availableGames.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableGames.map(game => {
                const completed = data.completedGames.includes(game.id);
                return (
                  <Link key={game.id} href={game.href}
                    className={`block rounded-2xl overflow-hidden shadow-md transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${completed ? 'ring-2 ring-yellow-400' : ''}`}>
                    <div className={`bg-gradient-to-br ${game.color} p-5 text-white relative`}>
                      {game.isNew && (
                        <span className="absolute top-3 right-3 text-[9px] font-bold bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-full">NEW!</span>
                      )}
                      {completed && (
                        <span className="absolute top-3 right-3 text-[9px] font-bold bg-green-400 text-gray-900 px-2 py-0.5 rounded-full">✅ Done</span>
                      )}
                      <span className="text-4xl block mb-2">{game.icon}</span>
                      <h3 className="font-bold text-base mb-1">{game.name}</h3>
                      <p className="text-white/80 text-xs leading-relaxed">{game.description}</p>
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full">{game.difficulty}</span>
                        <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full">{game.categoryLabel}</span>
                        <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full">⭐×{game.stars}</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 px-4 py-2.5 flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Play Now →</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: game.stars }).map((_, i) => (
                          <span key={i} className={`text-xs ${completed ? 'text-yellow-400' : 'text-gray-300'}`}>⭐</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Coming Soon */}
        {comingSoonGames.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mt-6">
              🔜 Coming Soon ({comingSoonGames.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {comingSoonGames.map(game => (
                <div key={game.id} className="rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 opacity-60">
                  <div className={`bg-gradient-to-br ${game.color} p-4 text-white`}>
                    <span className="text-3xl block mb-1">{game.icon}</span>
                    <h3 className="font-bold text-sm">{game.name}</h3>
                    <p className="text-white/70 text-[10px] mt-1">{game.description}</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 text-center">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">🔒 Coming Soon</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Parent Dashboard */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-3 flex items-center gap-2">👨‍👩‍👧‍👦 Parent Dashboard</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{data.completedGames.length}</p>
              <p className="text-[10px] text-purple-500">Games Completed</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{data.stars}</p>
              <p className="text-[10px] text-yellow-500">Stars Earned</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-green-700 dark:text-green-300">{earnedBadges.length}/{BADGES.length}</p>
              <p className="text-[10px] text-green-500">Badges</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{currentLevel}</p>
              <p className="text-[10px] text-blue-500">Current Level</p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
            <p>💡 <strong>Tip:</strong> Let your child play 2-3 games per day for best learning retention.</p>
            <p>📚 <strong>Reinforce:</strong> Ask your child to teach you what they learned — teaching strengthens memory!</p>
            <p>🤲 <strong>Practice:</strong> Use the Dua games before meals and bedtime for real-world application.</p>
            <p>🔒 <strong>Privacy:</strong> All data is stored locally on this device. No accounts, no tracking.</p>
          </div>
        </div>

        {/* Educational Guide */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5">
          <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm mb-3">📖 Age-by-Age Islamic Education Guide</h3>
          <div className="space-y-3 text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
            <div>
              <p className="font-bold">🌱 Ages 3-5: Foundation</p>
              <p className="text-emerald-600 dark:text-emerald-400">Teach Bismillah, basic duas (eating, sleeping), love of Allah, simple Arabic letters. Use colors, songs, and repetition.</p>
            </div>
            <div>
              <p className="font-bold">🌟 Ages 6-9: Building Blocks</p>
              <p className="text-emerald-600 dark:text-emerald-400">Introduce prayer, Quran reading, 5 Pillars, stories of Prophets, daily duas. Make it interactive and fun.</p>
            </div>
            <div>
              <p className="font-bold">📚 Ages 10-13: Deeper Understanding</p>
              <p className="text-emerald-600 dark:text-emerald-400">Islamic history, Seerah, Fiqh basics, Quran memorization, understanding meanings, Islamic ethics and character.</p>
            </div>
          </div>
        </div>

        {/* Hadith */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 text-center">
          <p className="text-base mb-2" style={{ fontFamily: "'Amiri', serif" }}>مُرُوا أَوْلَادَكُمْ بِالصَّلَاةِ وَهُمْ أَبْنَاءُ سَبْعِ سِنِينَ</p>
          <p className="text-xs text-amber-700 dark:text-amber-300 italic">"Command your children to pray when they are seven years old."</p>
          <p className="text-[10px] text-amber-500 mt-1">— Abu Dawud</p>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          ✨ All games are 100% free · No ads · No sign-up · Safe for children · Data stored locally
        </p>
      </main>

      <style jsx>{`
        .animate-slideDown { animation: slideDown 0.25s ease-out; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
