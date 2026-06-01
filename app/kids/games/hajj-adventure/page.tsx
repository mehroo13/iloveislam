'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const HAJJ_STEPS = [
  { emoji: '🕊️', title: 'Ihram', description: 'Pilgrims enter a state of purity called Ihram. Men wear two white unstitched cloths, and everyone makes the intention for Hajj. They recite "Labbayk Allahumma Labbayk" (Here I am, O Allah, here I am).' },
  { emoji: '🕋', title: 'Tawaf', description: 'Pilgrims walk around the Kaaba seven times in a counter-clockwise direction. This shows unity and devotion to Allah. The Kaaba is the House of Allah in Makkah.' },
  { emoji: '🏃', title: "Sa'i", description: "Pilgrims walk between the hills of Safa and Marwah seven times. This remembers Hajar's search for water for her baby Ismail, until Allah provided the well of Zamzam." },
  { emoji: '⛺', title: 'Mina (Day of Tarwiyah)', description: 'Pilgrims travel to Mina and spend the day and night in tents. They pray and prepare for the most important day of Hajj.' },
  { emoji: '🌄', title: 'Arafat (Day of Arafah)', description: 'The most important day of Hajj! Pilgrims stand at the plain of Arafat from noon to sunset, making dua (supplication) to Allah. This is when sins are forgiven.' },
  { emoji: '🌙', title: 'Muzdalifah', description: 'After sunset at Arafat, pilgrims travel to Muzdalifah. They pray Maghrib and Isha together, sleep under the open sky, and collect pebbles for the next day.' },
  { emoji: '🎯', title: 'Jamarat (Stoning)', description: 'Pilgrims throw pebbles at three stone pillars in Mina. This remembers how Prophet Ibrahim threw stones at Shaytan who tried to stop him from obeying Allah.' },
  { emoji: '🕋', title: 'Farewell Tawaf', description: 'Before leaving Makkah, pilgrims perform a final Tawaf around the Kaaba. This is their goodbye to the Holy House. Hajj is now complete! Hajj Mabroor!' },
]

const QUIZ_QUESTIONS = [
  { question: 'What do pilgrims wear when entering Ihram?', options: ['Colorful clothes', 'Two white unstitched cloths', 'Black robes', 'Green shirts'], answer: 1 },
  { question: 'How many times do pilgrims walk around the Kaaba?', options: ['3 times', '5 times', '7 times', '10 times'], answer: 2 },
  { question: "Sa'i remembers which person's search for water?", options: ['Maryam', 'Hajar', 'Khadijah', 'Aisha'], answer: 1 },
  { question: 'Which day is the most important day of Hajj?', options: ['Day of Mina', 'Day of Arafah', 'Day of Tawaf', 'Day of Jamarat'], answer: 1 },
  { question: 'What do pilgrims throw at the stone pillars?', options: ['Flowers', 'Water', 'Pebbles', 'Sand'], answer: 2 },
]

export default function HajjAdventurePage() {
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<'story' | 'quiz' | 'done'>('story')
  const [quizIndex, setQuizIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  function handleNextStep() {
    if (step < HAJJ_STEPS.length - 1) {
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
      if (!data.completedGames.includes('hajj-adventure')) {
        data.completedGames.push('hajj-adventure')
      }
      data.stars = (data.stars || 0) + score
      data.lastPlayed = 'hajj-adventure'
      localStorage.setItem('kids_islamic_games_v2', JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save progress', e)
    }
  }

  function restart() {
    setStep(0)
    setPhase('story')
    setQuizIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setShowResult(false)
  }

  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-100 via-orange-50 to-yellow-100 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-4">🕋</div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">MashAllah!</h1>
          <p className="text-xl text-gray-700 mb-2">You completed the Hajj Adventure!</p>
          <p className="text-lg text-gray-600 mb-4">Quiz Score: {score}/{QUIZ_QUESTIONS.length}</p>
          <div className="text-4xl mb-4">{'⭐'.repeat(score)}</div>
          <div className="flex gap-4 justify-center">
            <button onClick={restart} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg min-h-[44px] transition">
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
      <div className="min-h-screen bg-gradient-to-b from-amber-100 via-orange-50 to-yellow-100 p-4">
        <div className="max-w-lg mx-auto">
          <Link href="/kids" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold mb-4 min-h-[44px]">
            ← Back to Games
          </Link>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-600">📝 Hajj Quiz</h2>
              <span className="bg-orange-100 text-orange-800 font-bold px-3 py-1 rounded-full text-sm">
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
                      : 'bg-blue-50 hover:bg-blue-100 text-gray-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {showResult && (
              <button onClick={handleNextQuestion} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-2xl shadow-lg min-h-[44px] transition">
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

  const currentStep = HAJJ_STEPS[step]

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 via-orange-50 to-yellow-100 p-4">
      <div className="max-w-lg mx-auto">
        <Link href="/kids" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold mb-4 min-h-[44px]">
          ← Back to Games
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-orange-600">🕋 Hajj Adventure</h1>
            <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-sm">
              Step {step + 1}/{HAJJ_STEPS.length}
            </span>
          </div>

          <div className="text-center mb-6">
            <div className="text-7xl mb-4">{currentStep.emoji}</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">{currentStep.title}</h2>
            <p className="text-gray-600 text-lg leading-relaxed">{currentStep.description}</p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-orange-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / HAJJ_STEPS.length) * 100}%` }}
            />
          </div>

          <button
            onClick={handleNextStep}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-2xl shadow-lg min-h-[44px] transition"
          >
            {step < HAJJ_STEPS.length - 1 ? 'Next Step →' : 'Take the Quiz! 📝'}
          </button>
        </div>
      </div>
    </div>
  )
}
