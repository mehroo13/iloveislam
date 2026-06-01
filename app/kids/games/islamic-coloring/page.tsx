'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ef4444', '#ec4899']
const COLOR_NAMES = ['Green', 'Blue', 'Gold', 'Purple', 'Red', 'Pink']

const SHAPES = [
  '⬟', '◆', '▲', '●', '⬡', '★',
  '●', '★', '⬡', '◆', '▲', '⬟',
  '★', '⬟', '●', '⬡', '◆', '▲',
  '▲', '◆', '★', '●', '⬟', '⬡',
  '⬡', '▲', '◆', '★', '●', '⬟',
  '⬟', '●', '▲', '⬡', '★', '◆',
]

export default function IslamicColoringPage() {
  const [grid, setGrid] = useState<number[]>(Array(36).fill(-1))
  const [showCelebration, setShowCelebration] = useState(false)
  const [completed, setCompleted] = useState(false)

  function handleShapeTap(index: number) {
    if (completed) return
    const newGrid = [...grid]
    newGrid[index] = (newGrid[index] + 1) % COLORS.length
    setGrid(newGrid)

    // Check if all colored
    if (newGrid.every((c) => c >= 0)) {
      setCompleted(true)
      setShowCelebration(true)
      saveProgress()
    }
  }

  function saveProgress() {
    try {
      const stored = localStorage.getItem('kids_islamic_games_v2')
      const data = stored ? JSON.parse(stored) : { stars: 0, completedGames: [], lastPlayed: '' }
      if (!data.completedGames.includes('islamic-coloring')) {
        data.completedGames.push('islamic-coloring')
      }
      data.stars = (data.stars || 0) + 5
      data.lastPlayed = 'islamic-coloring'
      localStorage.setItem('kids_islamic_games_v2', JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save progress', e)
    }
  }

  function restart() {
    setGrid(Array(36).fill(-1))
    setShowCelebration(false)
    setCompleted(false)
  }

  if (showCelebration) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-100 via-purple-50 to-yellow-100 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-4">🎨</div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">MashAllah!</h1>
          <p className="text-xl text-gray-700 mb-4">Beautiful pattern! You colored all the shapes!</p>
          <div className="text-4xl mb-4">⭐⭐⭐⭐⭐</div>
          <div className="flex gap-4 justify-center">
            <button onClick={restart} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg min-h-[44px] transition">
              Color Again
            </button>
            <Link href="/kids" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg min-h-[44px] transition inline-flex items-center">
              Back to Games
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const coloredCount = grid.filter((c) => c >= 0).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-purple-50 to-yellow-100 p-4">
      <div className="max-w-lg mx-auto">
        <Link href="/kids" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold mb-4 min-h-[44px]">
          ← Back to Games
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-pink-600">🎨 Islamic Patterns</h1>
            <span className="bg-pink-100 text-pink-800 font-bold px-3 py-1 rounded-full text-sm">
              {coloredCount}/{grid.length}
            </span>
          </div>

          <p className="text-center text-gray-600 mb-4">
            Tap each shape to cycle through colors. Color all shapes to complete!
          </p>

          {/* Color palette legend */}
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {COLORS.map((color, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-500">{COLOR_NAMES[i]}</span>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-6 gap-2 mb-4">
            {grid.map((colorIndex, i) => (
              <button
                key={i}
                onClick={() => handleShapeTap(i)}
                className="w-full aspect-square rounded-xl flex items-center justify-center text-2xl transition-all duration-200 shadow min-h-[44px] hover:scale-110 border-2"
                style={{
                  backgroundColor: colorIndex >= 0 ? COLORS[colorIndex] : '#f3f4f6',
                  borderColor: colorIndex >= 0 ? COLORS[colorIndex] : '#d1d5db',
                  color: colorIndex >= 0 ? 'white' : '#6b7280',
                }}
              >
                {SHAPES[i]}
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-pink-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(coloredCount / grid.length) * 100}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-500">
            {coloredCount === 0 ? 'Start tapping shapes!' : `${grid.length - coloredCount} shapes left`}
          </p>
        </div>
      </div>
    </div>
  )
}
