'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const SAHABA = [
  { name: 'Abu Bakr', emoji: '🌟', title: 'As-Siddiq (The Truthful)', achievement: 'First Caliph and best friend of the Prophet ﷺ' },
  { name: 'Umar ibn Al-Khattab', emoji: '⚖️', title: 'Al-Farooq (The Distinguisher)', achievement: 'Known for his justice and strong leadership' },
  { name: 'Uthman ibn Affan', emoji: '📖', title: 'Dhun-Nurayn (Possessor of Two Lights)', achievement: 'Known for generosity and compiled the Quran' },
  { name: 'Ali ibn Abi Talib', emoji: '⚔️', title: 'Asadullah (Lion of Allah)', achievement: 'Known for bravery and deep knowledge' },
  { name: 'Khadijah bint Khuwaylid', emoji: '💎', title: 'Mother of the Believers', achievement: 'First person to believe in the Prophet ﷺ' },
  { name: 'Aisha bint Abu Bakr', emoji: '📚', title: 'The Scholar', achievement: 'Great scholar and teacher of Islam' },
  { name: 'Bilal ibn Rabah', emoji: '🎵', title: 'The Muezzin', achievement: 'First muezzin (caller to prayer) in Islam' },
  { name: 'Khalid bin Walid', emoji: '🗡️', title: 'Sword of Allah', achievement: 'Undefeated military commander' },
  { name: 'Fatimah bint Muhammad', emoji: '🌹', title: 'Az-Zahra (The Radiant)', achievement: 'Beloved daughter of the Prophet ﷺ' },
  { name: 'Salman al-Farisi', emoji: '🔍', title: 'The Seeker', achievement: 'Traveled far seeking truth until finding Islam' },
]

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function SahabaHeroesPage() {
  const [phase, setPhase] = useState<'learn' | 'quiz' | 'done'>('learn')
  const [cardIndex, setCardIndex] = useState(0)
  const [quizIndex, setQuizIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [questions, setQuestions] = useState<{ question: string; options: string[]; answer: number }[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    generateQuiz()
  }, [])

  function generateQuiz() {
    const qs = SAHABA.map((s, i) => {
      const wrongOptions = shuffleArray(SAHABA.filter((_, idx) => idx !== i)).slice(0, 3).map(x => x.name)
      const options = shuffleArray([s.name, ...wrongOptions])
      return {
        question: `Who is known for: "${s.achievement}"?`,
        options,
        answer: options.indexOf(s.name),
      }
    })
    setQuestions(shuffleArray(qs))
  }

  function handleNextCard() {
    if (cardIndex < SAHABA.length - 1) {
      setCardIndex(cardIndex + 1)
    } else {
      setPhase('quiz')
    }
  }

  function handleAnswer(index: number) {
    if (showResult) return
    setSelectedAnswer(index)
    setShowResult(true)
    if (index === questions[quizIndex].answer) {
      setScore(score + 1)
    }
  }

  function handleNextQuestion() {
    if (quizIndex < questions.length - 1) {
      setQuizIndex(quizIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setPhase('done')
      saveProgress()
    }
  }

  function saveProgress() {
    try {
      const stored = localStorage.getItem('kids_islamic_games_v2')
      const data = stored ? JSON.parse(stored) : { stars: 0, completedGames: [], lastPlayed: '' }
      if (!data.completedGames.includes('sahaba-heroes')) {
        data.completedGames.push('sahaba-heroes')
      }
      data.stars = (data.stars || 0) + score
      data.lastPlayed = 'sahaba-heroes'
      localStorage.setItem('kids_islamic_games_v2', JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save progress', e)
    }
  }

  function restart() {
    setPhase('learn')
    setCardIndex(0)
    setQuizIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setShowResult(false)
    generateQuiz()
  }

  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-100 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">MashAllah!</h1>
          <p className="text-xl text-gray-700 mb-2">You learned about the Sahaba!</p>
          <p className="text-lg text-gray-600 mb-4">Quiz Score: {score}/{questions.length}</p>
          <div className="text-4xl mb-4">{'⭐'.repeat(Math.min(score, 10))}</div>
          <div className="flex gap-4 justify-center">
            <button onClick={restart} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg min-h-[44px] transition">
              Play Again
            </button>
            <Link href="/kids" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg min-h-[44px] transition inline-flex items-center">
              Back to Games
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'quiz') {
    const q = questions[quizIndex]
    if (!q) return null
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-100 p-4">
        <div className="max-w-lg mx-auto">
          <Link href="/kids" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold mb-4 min-h-[44px]">
            ← Back to Games
          </Link>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-purple-600">📝 Sahaba Quiz</h2>
              <span className="bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full text-sm">
                {quizIndex + 1}/{questions.length}
              </span>
            </div>
            <p className="text-lg font-semibold text-gray-800 mb-4">{q.question}</p>
            <div className="space-y-3 mb-4">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className={`w-full text-left py-3 px-4 rounded-2xl font-semibold min-h-[44px] transition shadow ${
                    showResult
                      ? i === q.answer
                        ? 'bg-green-500 text-white'
                        : i === selectedAnswer
                        ? 'bg-red-400 text-white'
                        : 'bg-gray-100 text-gray-600'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-gray-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {showResult && (
              <button onClick={handleNextQuestion} className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-2xl shadow-lg min-h-[44px] transition">
                {quizIndex < questions.length - 1 ? 'Next Question →' : 'See Results 🎉'}
              </button>
            )}
          </div>
          <div className="text-center mt-4">
            <span className="bg-green-100 text-green-800 font-bold px-4 py-2 rounded-full">Score: {score} ⭐</span>
          </div>
        </div>
      </div>
    )
  }

  const companion = SAHABA[cardIndex]

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="max-w-lg mx-auto">
        <Link href="/kids" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold mb-4 min-h-[44px]">
          ← Back to Games
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-purple-600">🌟 Sahaba Heroes</h1>
            <span className="bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded-full text-sm">
              {cardIndex + 1}/{SAHABA.length}
            </span>
          </div>

          <div className="text-center mb-6">
            <div className="text-7xl mb-4">{companion.emoji}</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{companion.name}</h2>
            <p className="text-purple-600 font-semibold mb-3">{companion.title}</p>
            <p className="text-gray-600 text-lg">{companion.achievement}</p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${((cardIndex + 1) / SAHABA.length) * 100}%` }}
            />
          </div>

          <button
            onClick={handleNextCard}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-2xl shadow-lg min-h-[44px] transition"
          >
            {cardIndex < SAHABA.length - 1 ? 'Next Hero →' : 'Take the Quiz! 📝'}
          </button>
        </div>
      </div>
    </div>
  )
}
