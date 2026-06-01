'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const TIMELINE_EVENTS = [
  { year: '570 CE', emoji: '👶', title: 'Birth in Makkah', description: 'Prophet Muhammad ﷺ was born in Makkah in the Year of the Elephant. His father Abdullah had passed away before his birth. He was raised by his grandfather Abdul Muttalib.' },
  { year: '576 CE', emoji: '🏜️', title: 'Early Life', description: 'After his mother Aminah passed away, young Muhammad ﷺ was cared for by his grandfather, then his uncle Abu Talib. He was known as Al-Amin (The Trustworthy).' },
  { year: '610 CE', emoji: '✨', title: 'First Revelation', description: 'At age 40, in the Cave of Hira, Angel Jibreel appeared and revealed the first verses of the Quran: "Read in the name of your Lord who created." This was the beginning of prophethood.' },
  { year: '613 CE', emoji: '📢', title: 'Public Preaching', description: 'The Prophet ﷺ began calling people openly to Islam. Many people in Makkah opposed him, but the early Muslims stayed strong in their faith despite persecution.' },
  { year: '622 CE', emoji: '🐪', title: 'Migration to Madinah (Hijrah)', description: 'The Prophet ﷺ and the Muslims migrated from Makkah to Madinah. This event marks the start of the Islamic calendar. The people of Madinah welcomed them warmly.' },
  { year: '624 CE', emoji: '⚔️', title: 'Battle of Badr', description: 'The first major battle of Islam. Despite being outnumbered (313 vs 1000), the Muslims won with Allah\'s help. This was a turning point for the Muslim community.' },
  { year: '628 CE', emoji: '📜', title: 'Treaty of Hudaybiyyah', description: 'A peace treaty was signed between the Muslims and the Quraysh. Though it seemed unfair at first, it led to many people accepting Islam and was called a "clear victory" by Allah.' },
  { year: '630 CE', emoji: '🕋', title: 'Conquest of Makkah', description: 'The Prophet ﷺ returned to Makkah peacefully with 10,000 companions. He forgave the people of Makkah and cleansed the Kaaba of idols. Most of Makkah accepted Islam.' },
  { year: '632 CE', emoji: '🌍', title: 'Farewell Hajj', description: 'The Prophet ﷺ performed his final Hajj with over 100,000 Muslims. He gave his famous Farewell Sermon, teaching equality, justice, and the rights of all people.' },
  { year: '632 CE', emoji: '🕊️', title: 'Passing of the Prophet ﷺ', description: 'The Prophet ﷺ passed away in Madinah at age 63. He left behind the Quran and his Sunnah as guidance for all of humanity until the Day of Judgment.' },
]

const QUIZ_QUESTIONS = [
  { question: 'In which city was Prophet Muhammad ﷺ born?', options: ['Madinah', 'Makkah', 'Jerusalem', 'Taif'], answer: 1 },
  { question: 'What was the Prophet ﷺ known as before prophethood?', options: ['Al-Amin (The Trustworthy)', 'Al-Farooq', 'As-Siddiq', 'Al-Walid'], answer: 0 },
  { question: 'Where did the first revelation come?', options: ['Masjid al-Haram', 'Cave of Hira', 'Mount Uhud', 'Cave of Thawr'], answer: 1 },
  { question: 'What does Hijrah mean?', options: ['Prayer', 'Fasting', 'Migration', 'Charity'], answer: 2 },
  { question: 'How many Muslims fought at the Battle of Badr?', options: ['100', '313', '1000', '500'], answer: 1 },
  { question: 'What was the Treaty of Hudaybiyyah?', options: ['A battle', 'A peace treaty', 'A trade agreement', 'A marriage contract'], answer: 1 },
  { question: 'What happened during the Conquest of Makkah?', options: ['A big battle', 'The Prophet forgave the people', 'Muslims left Makkah', 'The Kaaba was destroyed'], answer: 1 },
  { question: 'How old was the Prophet ﷺ when he passed away?', options: ['40', '50', '63', '70'], answer: 2 },
]

export default function SeerahAdventurePage() {
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<'timeline' | 'quiz' | 'done'>('timeline')
  const [quizIndex, setQuizIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  function handleNextStep() {
    if (step < TIMELINE_EVENTS.length - 1) {
      setStep(step + 1)
    } else {
      setPhase('quiz')
    }
  }

  function handleAnswer(index: number) {
    if (showResult) return
    setSelectedAnswer(index)
    setShowResult(true)
    if (index === QUIZ_QUESTIONS[quizIndex].answer) {
      setScore(score + 1)
    }
  }

  function handleNextQuestion() {
    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
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
      if (!data.completedGames.includes('seerah-adventure')) {
        data.completedGames.push('seerah-adventure')
      }
      data.stars = (data.stars || 0) + score
      data.lastPlayed = 'seerah-adventure'
      localStorage.setItem('kids_islamic_games_v2', JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save progress', e)
    }
  }

  function restart() {
    setStep(0)
    setPhase('timeline')
    setQuizIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setShowResult(false)
  }

  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-100 via-teal-50 to-cyan-100 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-4">🌟</div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">MashAllah!</h1>
          <p className="text-xl text-gray-700 mb-2">You completed the Seerah Adventure!</p>
          <p className="text-lg text-gray-600 mb-4">Quiz Score: {score}/{QUIZ_QUESTIONS.length}</p>
          <div className="text-4xl mb-4">{'⭐'.repeat(Math.min(score, 8))}</div>
          <div className="flex gap-4 justify-center">
            <button onClick={restart} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg min-h-[44px] transition">
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
    const q = QUIZ_QUESTIONS[quizIndex]
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-100 via-teal-50 to-cyan-100 p-4">
        <div className="max-w-lg mx-auto">
          <Link href="/kids" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold mb-4 min-h-[44px]">
            ← Back to Games
          </Link>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-teal-600">📝 Seerah Quiz</h2>
              <span className="bg-teal-100 text-teal-800 font-bold px-3 py-1 rounded-full text-sm">
                {quizIndex + 1}/{QUIZ_QUESTIONS.length}
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
                      : 'bg-teal-50 hover:bg-teal-100 text-gray-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {showResult && (
              <button onClick={handleNextQuestion} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-2xl shadow-lg min-h-[44px] transition">
                {quizIndex < QUIZ_QUESTIONS.length - 1 ? 'Next Question →' : 'See Results 🎉'}
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

  const currentEvent = TIMELINE_EVENTS[step]

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-100 via-teal-50 to-cyan-100 p-4">
      <div className="max-w-lg mx-auto">
        <Link href="/kids" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold mb-4 min-h-[44px]">
          ← Back to Games
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-teal-600">📜 Seerah Adventure</h1>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-sm">
              {step + 1}/{TIMELINE_EVENTS.length}
            </span>
          </div>

          <div className="text-center mb-6">
            <div className="inline-block bg-teal-100 text-teal-800 font-bold px-4 py-1 rounded-full text-sm mb-3">
              {currentEvent.year}
            </div>
            <div className="text-7xl mb-4">{currentEvent.emoji}</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">{currentEvent.title}</h2>
            <p className="text-gray-600 text-lg leading-relaxed">{currentEvent.description}</p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-teal-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / TIMELINE_EVENTS.length) * 100}%` }}
            />
          </div>

          <button
            onClick={handleNextStep}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-2xl shadow-lg min-h-[44px] transition"
          >
            {step < TIMELINE_EVENTS.length - 1 ? 'Next Event →' : 'Take the Quiz! 📝'}
          </button>
        </div>
      </div>
    </div>
  )
}
