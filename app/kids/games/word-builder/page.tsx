'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const WORDS = [
  { word: 'بسم', meaning: 'In the name of', letters: ['ب', 'س', 'م'] },
  { word: 'الله', meaning: 'Allah (God)', letters: ['ا', 'ل', 'ل', 'ه'] },
  { word: 'رحمن', meaning: 'Most Gracious', letters: ['ر', 'ح', 'م', 'ن'] },
  { word: 'رحيم', meaning: 'Most Merciful', letters: ['ر', 'ح', 'ي', 'م'] },
  { word: 'الحمد', meaning: 'All Praise', letters: ['ا', 'ل', 'ح', 'م', 'د'] },
  { word: 'صلاة', meaning: 'Prayer', letters: ['ص', 'ل', 'ا', 'ة'] },
  { word: 'قرآن', meaning: 'Quran', letters: ['ق', 'ر', 'آ', 'ن'] },
  { word: 'مسجد', meaning: 'Mosque', letters: ['م', 'س', 'ج', 'د'] },
]

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function WordBuilderPage() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [scrambled, setScrambled] = useState<{ letter: string; id: number }[]>([])
  const [selected, setSelected] = useState<{ letter: string; id: number }[]>([])
  const [score, setScore] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [wordCorrect, setWordCorrect] = useState(false)
  const [wordWrong, setWordWrong] = useState(false)

  useEffect(() => {
    loadWord(0)
  }, [])

  function loadWord(index: number) {
    const word = WORDS[index]
    const lettersWithIds = word.letters.map((l, i) => ({ letter: l, id: i }))
    setScrambled(shuffleArray(lettersWithIds))
    setSelected([])
    setWordCorrect(false)
    setWordWrong(false)
  }

  function handleLetterTap(item: { letter: string; id: number }) {
    if (wordCorrect) return
    const newSelected = [...selected, item]
    setSelected(newSelected)
    setScrambled(scrambled.filter((s) => s.id !== item.id))

    if (newSelected.length === WORDS[currentWordIndex].letters.length) {
      const built = newSelected.map((s) => s.letter).join('')
      const target = WORDS[currentWordIndex].letters.join('')
      if (built === target) {
        setWordCorrect(true)
        setScore(score + 1)
      } else {
        setWordWrong(true)
        setTimeout(() => {
          loadWord(currentWordIndex)
        }, 1000)
      }
    }
  }

  function handleNext() {
    if (currentWordIndex < WORDS.length - 1) {
      const next = currentWordIndex + 1
      setCurrentWordIndex(next)
      loadWord(next)
    } else {
      setCompleted(true)
      saveProgress()
    }
  }

  function handleUndo() {
    if (selected.length === 0 || wordCorrect) return
    const last = selected[selected.length - 1]
    setSelected(selected.slice(0, -1))
    setScrambled([...scrambled, last])
    setWordWrong(false)
  }

  function saveProgress() {
    try {
      const stored = localStorage.getItem('kids_islamic_games_v2')
      const data = stored ? JSON.parse(stored) : { stars: 0, completedGames: [], lastPlayed: '' }
      if (!data.completedGames.includes('word-builder')) {
        data.completedGames.push('word-builder')
      }
      data.stars = (data.stars || 0) + score
      data.lastPlayed = 'word-builder'
      localStorage.setItem('kids_islamic_games_v2', JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save progress', e)
    }
  }

  function restart() {
    setCurrentWordIndex(0)
    setScore(0)
    setCompleted(false)
    loadWord(0)
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-100 via-green-50 to-blue-100 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">MashAllah!</h1>
          <p className="text-xl text-gray-700 mb-4">You built {score} out of {WORDS.length} words correctly!</p>
          <div className="text-4xl mb-4">{'⭐'.repeat(Math.min(score, 8))}</div>
          <div className="flex gap-4 justify-center">
            <button onClick={restart} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg min-h-[44px] transition">
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

  const currentWord = WORDS[currentWordIndex]

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 via-green-50 to-blue-100 p-4">
      <div className="max-w-lg mx-auto">
        <Link href="/kids" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold mb-4 min-h-[44px]">
          ← Back to Games
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-purple-600">📝 Word Builder</h1>
            <span className="bg-yellow-100 text-yellow-800 font-bold px-3 py-1 rounded-full text-sm">
              {currentWordIndex + 1}/{WORDS.length}
            </span>
          </div>

          <div className="text-center mb-6">
            <p className="text-gray-500 text-sm mb-1">Build this word:</p>
            <p className="text-4xl font-bold text-gray-300 mb-1" dir="rtl">{currentWord.word}</p>
            <p className="text-lg text-gray-600">({currentWord.meaning})</p>
          </div>

          {/* Built word area */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 min-h-[80px] flex items-center justify-center gap-2 flex-row-reverse">
            {selected.length === 0 && <p className="text-gray-400">Tap letters below to build the word</p>}
            {selected.map((item, i) => (
              <span
                key={i}
                className={`text-3xl font-bold px-3 py-1 rounded-lg ${
                  wordCorrect ? 'text-green-600 bg-green-100' : wordWrong ? 'text-red-600 bg-red-100' : 'text-blue-600 bg-blue-100'
                }`}
              >
                {item.letter}
              </span>
            ))}
          </div>

          {/* Scrambled letters */}
          <div className="flex flex-wrap gap-3 justify-center mb-4">
            {scrambled.map((item) => (
              <button
                key={item.id}
                onClick={() => handleLetterTap(item)}
                className="bg-purple-500 hover:bg-purple-600 text-white text-2xl font-bold w-14 h-14 rounded-2xl shadow-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                {item.letter}
              </button>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleUndo}
              disabled={selected.length === 0 || wordCorrect}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-2xl min-h-[44px] transition disabled:opacity-50"
            >
              ↩ Undo
            </button>
            {wordCorrect && (
              <button
                onClick={handleNext}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-2xl shadow-lg min-h-[44px] transition animate-bounce"
              >
                {currentWordIndex < WORDS.length - 1 ? 'Next Word →' : 'Finish! 🎉'}
              </button>
            )}
          </div>
        </div>

        <div className="text-center">
          <span className="bg-green-100 text-green-800 font-bold px-4 py-2 rounded-full">
            Score: {score} ⭐
          </span>
        </div>
      </div>
    </div>
  )
}
