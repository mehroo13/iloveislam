'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const ROUNDS = [
  { phrase: 'بسم الله الرحمن الرحيم', targetLetter: 'ب', meaning: 'In the name of Allah, the Most Gracious, the Most Merciful' },
  { phrase: 'بسم الله الرحمن الرحيم', targetLetter: 'ل', meaning: 'In the name of Allah, the Most Gracious, the Most Merciful' },
  { phrase: 'الحمد لله رب العالمين', targetLetter: 'ا', meaning: 'All praise is due to Allah, Lord of the worlds' },
  { phrase: 'الحمد لله رب العالمين', targetLetter: 'ر', meaning: 'All praise is due to Allah, Lord of the worlds' },
  { phrase: 'الرحمن الرحيم', targetLetter: 'م', meaning: 'The Most Gracious, the Most Merciful' },
  { phrase: 'مالك يوم الدين', targetLetter: 'ي', meaning: 'Master of the Day of Judgment' },
  { phrase: 'إياك نعبد وإياك نستعين', targetLetter: 'ن', meaning: 'You alone we worship, You alone we ask for help' },
  { phrase: 'اهدنا الصراط المستقيم', targetLetter: 'ص', meaning: 'Guide us to the straight path' },
  { phrase: 'اهدنا الصراط المستقيم', targetLetter: 'ه', meaning: 'Guide us to the straight path' },
  { phrase: 'قل هو الله أحد', targetLetter: 'ق', meaning: 'Say: He is Allah, the One' },
]

export default function QuranLettersPage() {
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [found, setFound] = useState<number[]>([])
  const [wrong, setWrong] = useState<number | null>(null)
  const [allFound, setAllFound] = useState(false)

  function getLetters() {
    const phrase = ROUNDS[round].phrase
    const letters: { char: string; index: number; isSpace: boolean }[] = []
    for (let i = 0; i < phrase.length; i++) {
      letters.push({ char: phrase[i], index: i, isSpace: phrase[i] === ' ' })
    }
    return letters
  }

  function getTargetIndices() {
    const phrase = ROUNDS[round].phrase
    const target = ROUNDS[round].targetLetter
    const indices: number[] = []
    for (let i = 0; i < phrase.length; i++) {
      if (phrase[i] === target) indices.push(i)
    }
    return indices
  }

  function handleLetterTap(index: number) {
    if (allFound) return
    const targetIndices = getTargetIndices()
    if (targetIndices.includes(index) && !found.includes(index)) {
      const newFound = [...found, index]
      setFound(newFound)
      if (newFound.length === targetIndices.length) {
        setAllFound(true)
        setScore(score + 1)
      }
    } else if (!targetIndices.includes(index)) {
      setWrong(index)
      setTimeout(() => setWrong(null), 500)
    }
  }

  function handleNext() {
    if (round < ROUNDS.length - 1) {
      setRound(round + 1)
      setFound([])
      setAllFound(false)
      setWrong(null)
    } else {
      setCompleted(true)
      saveProgress()
    }
  }

  function saveProgress() {
    try {
      const stored = localStorage.getItem('kids_islamic_games_v2')
      const data = stored ? JSON.parse(stored) : { stars: 0, completedGames: [], lastPlayed: '' }
      if (!data.completedGames.includes('quran-letters')) {
        data.completedGames.push('quran-letters')
      }
      data.stars = (data.stars || 0) + score
      data.lastPlayed = 'quran-letters'
      localStorage.setItem('kids_islamic_games_v2', JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save progress', e)
    }
  }

  function restart() {
    setRound(0)
    setScore(0)
    setCompleted(false)
    setFound([])
    setAllFound(false)
    setWrong(null)
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">MashAllah!</h1>
          <p className="text-xl text-gray-700 mb-2">You found all the letters!</p>
          <p className="text-lg text-gray-600 mb-4">Score: {score}/{ROUNDS.length} rounds perfect</p>
          <div className="text-4xl mb-4">{'⭐'.repeat(Math.min(score, 10))}</div>
          <div className="flex gap-4 justify-center">
            <button onClick={restart} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg min-h-[44px] transition">
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

  const letters = getLetters()
  const targetIndices = getTargetIndices()
  const currentRound = ROUNDS[round]

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-lg mx-auto">
        <Link href="/kids" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold mb-4 min-h-[44px]">
          ← Back to Games
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-sky-600">🔍 Letter Spot</h1>
            <span className="bg-sky-100 text-sky-800 font-bold px-3 py-1 rounded-full text-sm">
              {round + 1}/{ROUNDS.length}
            </span>
          </div>

          <div className="text-center mb-4">
            <p className="text-gray-500 text-sm mb-2">{currentRound.meaning}</p>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 mb-4">
              <p className="text-lg font-bold text-yellow-800">
                Find the letter: <span className="text-3xl text-red-600">{currentRound.targetLetter}</span>
              </p>
              <p className="text-sm text-gray-500">({targetIndices.length} to find)</p>
            </div>
          </div>

          {/* Phrase display */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 flex flex-wrap gap-1 justify-center" dir="rtl">
            {letters.map((l) => {
              if (l.isSpace) return <span key={l.index} className="w-3" />
              const isTarget = targetIndices.includes(l.index)
              const isFound = found.includes(l.index)
              const isWrong = wrong === l.index
              return (
                <button
                  key={l.index}
                  onClick={() => handleLetterTap(l.index)}
                  className={`text-2xl font-bold w-10 h-10 rounded-lg flex items-center justify-center transition min-w-[44px] min-h-[44px] ${
                    isFound
                      ? 'bg-green-500 text-white scale-110'
                      : isWrong
                      ? 'bg-red-400 text-white animate-pulse'
                      : 'bg-blue-100 hover:bg-blue-200 text-gray-800'
                  }`}
                >
                  {l.char}
                </button>
              )
            })}
          </div>

          <div className="text-center mb-4">
            <span className="text-sm text-gray-500">
              Found: {found.length}/{targetIndices.length}
            </span>
          </div>

          {allFound && (
            <button
              onClick={handleNext}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-2xl shadow-lg min-h-[44px] transition animate-bounce"
            >
              {round < ROUNDS.length - 1 ? 'Next Round →' : 'Finish! 🎉'}
            </button>
          )}
        </div>

        <div className="text-center mt-4">
          <span className="bg-green-100 text-green-800 font-bold px-4 py-2 rounded-full">
            Score: {score} ⭐
          </span>
        </div>
      </div>
    </div>
  )
}
