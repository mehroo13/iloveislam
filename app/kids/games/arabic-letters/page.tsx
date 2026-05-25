'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

/* ✅ FULL LETTER SET */
const LETTERS = [
  { letter: 'ا', name: 'Alif' },
  { letter: 'ب', name: 'Ba' },
  { letter: 'ت', name: 'Ta' },
  { letter: 'ث', name: 'Tha' },
  { letter: 'ج', name: 'Jeem' },
  { letter: 'ح', name: 'Ha' },
  { letter: 'خ', name: 'Kha' },
  { letter: 'د', name: 'Dal' },
  { letter: 'ذ', name: 'Dhal' },
  { letter: 'ر', name: 'Ra' },
  { letter: 'ز', name: 'Zay' },
  { letter: 'س', name: 'Seen' },
  { letter: 'ش', name: 'Sheen' },
  { letter: 'ص', name: 'Sad' },
  { letter: 'ض', name: 'Dad' },
  { letter: 'ط', name: 'Taa' },
  { letter: 'ظ', name: 'Dha' },
  { letter: 'ع', name: 'Ain' },
  { letter: 'غ', name: 'Ghain' },
  { letter: 'ف', name: 'Fa' },
  { letter: 'ق', name: 'Qaf' },
  { letter: 'ك', name: 'Kaf' },
  { letter: 'ل', name: 'Lam' },
  { letter: 'م', name: 'Meem' },
  { letter: 'ن', name: 'Noon' },
  { letter: 'ه', name: 'Ha2' },
  { letter: 'و', name: 'Waw' },
  { letter: 'ي', name: 'Ya' },
];

export default function ArabicLettersUltimate() {
  const [mode, setMode] = useState<'learn' | 'quiz' | 'challenge'>('learn');
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [timer, setTimer] = useState(10);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const current = LETTERS[index];
  const intervalRef = useRef<any>();

  /* ✅ GENERATE OPTIONS */
  const generateOptions = () => {
    const wrong = LETTERS
      .filter(l => l.name !== current.name)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(l => l.name);

    setOptions([...wrong, current.name].sort(() => Math.random() - 0.5));
  };

  useEffect(() => {
    if (mode !== 'learn') generateOptions();
  }, [index, mode]);

  /* 🎯 TIMER MODE */
  useEffect(() => {
    if (mode === 'challenge') {
      intervalRef.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            next();
            return 10;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [mode]);

  const next = () => {
    setSelected(null);
    if (index + 1 < LETTERS.length) {
      setIndex(i => i + 1);
    } else {
      if (mode === 'learn') {
        setMode('quiz');
        setIndex(0);
      } else if (mode === 'quiz') {
        setMode('challenge');
        setIndex(0);
        setStars(0);
      } else {
        alert("🏆 You finished everything!");
      }
    }
  };

  const answer = (opt: string) => {
    setSelected(opt);

    if (opt === current.name) {
      setScore(s => s + 1);
      setStars(s => s + 1);
    }

    setTimeout(next, 700);
  };

  /* 🧩 DRAG MATCH */
  const handleDrop = (letterName: string) => {
    if (letterName === current.name) {
      next();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-200">

      {/* HEADER */}
      <div className="flex justify-between p-4 bg-white shadow">
        <Link href="/kids">← Back</Link>
        <div>⭐ {stars} | 🧠 {score}</div>
      </div>

      <div className="p-6 text-center">

        <h1 className="text-2xl font-bold mb-4">
          {mode === 'learn' && "Learn Mode 📘"}
          {mode === 'quiz' && "Quiz Mode 🎯"}
          {mode === 'challenge' && `Challenge ⏳ ${timer}`}
        </h1>

        <motion.div
          key={current.letter}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-8xl mb-6 cursor-pointer"
        >
          {current.letter}
        </motion.div>

        {/* LEARN */}
        {mode === 'learn' && (
          <button onClick={next} className="bg-green-500 px-6 py-3 rounded-xl text-white">
            Next →
          </button>
        )}

        {/* QUIZ / CHALLENGE */}
        {(mode === 'quiz' || mode === 'challenge') && (
          <div className="grid grid-cols-2 gap-4">
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => answer(opt)}
                className={`p-4 rounded-xl font-bold ${
                  selected === null
                    ? 'bg-white'
                    : opt === current.name
                      ? 'bg-green-500 text-white'
                      : opt === selected
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* 🧩 DRAG GAME */}
        {mode === 'challenge' && (
          <div className="mt-10">
            <p className="mb-2">Drag correct name here 👇</p>
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e.dataTransfer.getData('text'))}
              className="h-20 border-4 border-dashed rounded-xl flex items-center justify-center"
            >
              Drop Here
            </div>

            <div className="flex gap-3 justify-center mt-4">
              {options.map(opt => (
                <div
                  key={opt}
                  draggable
                  onDragStart={e => e.dataTransfer.setData('text', opt)}
                  className="bg-white px-4 py-2 rounded shadow cursor-grab"
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}