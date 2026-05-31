'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const allQuestions = [
  { q: "How many times do Muslims pray daily?", options: ["3", "4", "5", "6"], answer: 2, cat: "Prayer" },
  { q: "What is the first surah of the Quran?", options: ["Al-Baqarah", "Al-Fatiha", "Al-Ikhlas", "An-Nas"], answer: 1, cat: "Quran" },
  { q: "Which city has the Kaaba?", options: ["Madinah", "Jerusalem", "Makkah", "Cairo"], answer: 2, cat: "General" },
  { q: "How many pillars of Islam are there?", options: ["3", "4", "5", "6"], answer: 2, cat: "General" },
  { q: "What month is fasting obligatory?", options: ["Shaban", "Rajab", "Ramadan", "Muharram"], answer: 2, cat: "General" },
  { q: "What is the holy book of Islam?", options: ["Bible", "Torah", "Quran", "Zabur"], answer: 2, cat: "Quran" },
  { q: "Who is the last Prophet in Islam?", options: ["Isa", "Musa", "Ibrahim", "Muhammad ﷺ"], answer: 3, cat: "Prophets" },
  { q: "What direction do Muslims face when praying?", options: ["East", "West", "Towards Kaaba", "North"], answer: 2, cat: "Prayer" },
  { q: "How many surahs are in the Quran?", options: ["100", "114", "120", "99"], answer: 1, cat: "Quran" },
  { q: "What is the night prayer called?", options: ["Fajr", "Tahajjud", "Dhuhr", "Maghrib"], answer: 1, cat: "Prayer" },
  { q: "What is Zakat?", options: ["Fasting", "Charity", "Prayer", "Pilgrimage"], answer: 1, cat: "General" },
  { q: "What is the first pillar of Islam?", options: ["Salah", "Zakat", "Shahada", "Hajj"], answer: 2, cat: "General" },
  { q: "Which angel brought revelation to Prophet Muhammad ﷺ?", options: ["Mikail", "Israfil", "Jibreel", "Azrael"], answer: 2, cat: "General" },
  { q: "What is the call to prayer called?", options: ["Iqamah", "Adhan", "Khutbah", "Dua"], answer: 1, cat: "Prayer" },
  { q: "How many rakats in Fajr prayer?", options: ["2", "3", "4", "1"], answer: 0, cat: "Prayer" },
  { q: "What is the last surah of the Quran?", options: ["Al-Fatiha", "Al-Falaq", "An-Nas", "Al-Ikhlas"], answer: 2, cat: "Quran" },
  { q: "Which Prophet built the Kaaba?", options: ["Musa", "Nuh", "Ibrahim", "Muhammad ﷺ"], answer: 2, cat: "Prophets" },
  { q: "What does 'Bismillah' mean?", options: ["Praise Allah", "In the name of Allah", "Allah is Great", "Thank Allah"], answer: 1, cat: "General" },
  { q: "How many days is Ramadan?", options: ["28", "29 or 30", "31", "25"], answer: 1, cat: "General" },
  { q: "What is Hajj?", options: ["Fasting", "Charity", "Pilgrimage to Makkah", "Night prayer"], answer: 2, cat: "General" },
  { q: "Which Prophet was known as Khalilullah (Friend of Allah)?", options: ["Musa", "Ibrahim", "Nuh", "Isa"], answer: 1, cat: "Prophets" },
  { q: "What do Muslims say when they sneeze?", options: ["SubhanAllah", "Alhamdulillah", "Allahu Akbar", "Bismillah"], answer: 1, cat: "General" },
  { q: "What is the night of power called?", options: ["Laylatul Miraj", "Laylatul Qadr", "Laylatul Bara'ah", "Laylatul Isra"], answer: 1, cat: "Quran" },
  { q: "How many juz (parts) are in the Quran?", options: ["20", "25", "30", "40"], answer: 2, cat: "Quran" },
  { q: "What is wudu?", options: ["Prayer", "Ablution/washing", "Fasting", "Charity"], answer: 1, cat: "Prayer" },
  { q: "Which Prophet parted the Red Sea?", options: ["Ibrahim", "Nuh", "Musa", "Dawud"], answer: 2, cat: "Prophets" },
  { q: "What is the meaning of 'Islam'?", options: ["Peace", "Submission to Allah", "Love", "Faith"], answer: 1, cat: "General" },
  { q: "Which city did Prophet Muhammad ﷺ migrate to?", options: ["Makkah", "Madinah", "Taif", "Jerusalem"], answer: 1, cat: "History" },
  { q: "What is the Sunnah?", options: ["Quran verses", "Prophet's teachings & practices", "Islamic law", "Prayer times"], answer: 1, cat: "General" },
  { q: "How many rakats in Dhuhr prayer?", options: ["2", "3", "4", "5"], answer: 2, cat: "Prayer" },
  { q: "What is the shortest surah in the Quran?", options: ["Al-Fatiha", "Al-Ikhlas", "Al-Kawthar", "An-Nas"], answer: 2, cat: "Quran" },
  { q: "What does 'Alhamdulillah' mean?", options: ["God is Great", "All praise to Allah", "In God's name", "God willing"], answer: 1, cat: "General" },
  { q: "Which Prophet could talk to animals?", options: ["Dawud", "Sulaiman", "Musa", "Yusuf"], answer: 1, cat: "Prophets" },
  { q: "What is the Islamic greeting?", options: ["Hello", "Assalamu Alaikum", "Marhaba", "Ahlan"], answer: 1, cat: "General" },
  { q: "How many times is 'Bismillah' in the Quran?", options: ["100", "114", "99", "120"], answer: 1, cat: "Quran" },
  { q: "What is Eid al-Fitr?", options: ["End of Hajj", "End of Ramadan", "Islamic New Year", "Prophet's birthday"], answer: 1, cat: "General" },
  { q: "Which Prophet was swallowed by a whale?", options: ["Nuh", "Yunus", "Musa", "Dawud"], answer: 1, cat: "Prophets" },
  { q: "What is the Quran's language?", options: ["Urdu", "Persian", "Arabic", "Turkish"], answer: 2, cat: "Quran" },
  { q: "How many rakats in Maghrib prayer?", options: ["2", "3", "4", "5"], answer: 1, cat: "Prayer" },
  { q: "What does 'SubhanAllah' mean?", options: ["Thank God", "Glory be to Allah", "God is Great", "God willing"], answer: 1, cat: "General" },
  { q: "Which Prophet interpreted dreams?", options: ["Ibrahim", "Yusuf", "Musa", "Dawud"], answer: 1, cat: "Prophets" },
  { q: "What is the Black Stone called?", options: ["Hajar al-Aswad", "Zamzam", "Safa", "Marwa"], answer: 0, cat: "History" },
  { q: "What is Sadaqah?", options: ["Obligatory charity", "Voluntary charity", "Prayer", "Fasting"], answer: 1, cat: "General" },
  { q: "Which Prophet received the Tawrat?", options: ["Dawud", "Isa", "Musa", "Ibrahim"], answer: 2, cat: "Prophets" },
  { q: "What is the well near the Kaaba called?", options: ["Nile", "Zamzam", "Euphrates", "Jordan"], answer: 1, cat: "History" },
  { q: "What does 'Allahu Akbar' mean?", options: ["God is One", "God is Great", "Praise God", "Thank God"], answer: 1, cat: "General" },
  { q: "How many rakats in Isha prayer?", options: ["2", "3", "4", "5"], answer: 2, cat: "Prayer" },
  { q: "Which Prophet was the father of many nations?", options: ["Adam", "Nuh", "Ibrahim", "Musa"], answer: 2, cat: "Prophets" },
  { q: "What is Tawaf?", options: ["Running between hills", "Circling the Kaaba", "Standing at Arafat", "Throwing stones"], answer: 1, cat: "History" },
  { q: "What is the first month of Islamic calendar?", options: ["Ramadan", "Muharram", "Rajab", "Shawwal"], answer: 1, cat: "General" },
  { q: "Which surah is called the heart of the Quran?", options: ["Al-Fatiha", "Ya-Sin", "Al-Baqarah", "Al-Mulk"], answer: 1, cat: "Quran" },
  { q: "What is Iftar?", options: ["Pre-dawn meal", "Breaking the fast", "Night prayer", "Charity"], answer: 1, cat: "General" },
  { q: "Which Prophet was known for his patience?", options: ["Yusuf", "Ayyub", "Musa", "Nuh"], answer: 1, cat: "Prophets" },
  { q: "What is Suhoor?", options: ["Breaking fast", "Pre-dawn meal", "Night prayer", "Afternoon snack"], answer: 1, cat: "General" },
  { q: "How many names does Allah have (Asma ul-Husna)?", options: ["50", "77", "99", "100"], answer: 2, cat: "General" },
  { q: "What is the migration from Makkah to Madinah called?", options: ["Isra", "Miraj", "Hijrah", "Jihad"], answer: 2, cat: "History" },
  { q: "Which Prophet was raised to the heavens?", options: ["Muhammad ﷺ", "Isa", "Musa", "Ibrahim"], answer: 1, cat: "Prophets" },
  { q: "What is Jannah?", options: ["Hell", "Paradise", "Earth", "Sky"], answer: 1, cat: "General" },
  { q: "What day is special for Muslims each week?", options: ["Monday", "Thursday", "Friday", "Sunday"], answer: 2, cat: "General" },
  { q: "Which Prophet was given the Zabur?", options: ["Musa", "Isa", "Dawud", "Ibrahim"], answer: 2, cat: "Prophets" },
  { q: "What is the meaning of 'InshAllah'?", options: ["Thank God", "God willing", "God is Great", "Praise God"], answer: 1, cat: "General" },
  { q: "How many ayahs are in Surah Al-Fatiha?", options: ["5", "6", "7", "8"], answer: 2, cat: "Quran" },
  { q: "What is the Qibla?", options: ["Prayer mat", "Direction of prayer", "Call to prayer", "Mosque"], answer: 1, cat: "Prayer" },
  { q: "Which battle was the first in Islam?", options: ["Uhud", "Badr", "Khandaq", "Hunayn"], answer: 1, cat: "History" },
  { q: "What is Tawheed?", options: ["Prayer", "Oneness of Allah", "Fasting", "Charity"], answer: 1, cat: "General" },
  { q: "What is the reward for good deeds in Islam?", options: ["Money", "Hasanat (good deeds)", "Fame", "Power"], answer: 1, cat: "General" },
  { q: "Which Prophet's people were destroyed by a flood?", options: ["Ibrahim", "Nuh", "Musa", "Lut"], answer: 1, cat: "Prophets" },
  { q: "What is Dhikr?", options: ["Charity", "Remembrance of Allah", "Fasting", "Pilgrimage"], answer: 1, cat: "General" },
  { q: "What is the longest surah in the Quran?", options: ["Al-Fatiha", "Al-Baqarah", "Al-Imran", "An-Nisa"], answer: 1, cat: "Quran" },
  { q: "Which Prophet was thrown into a well by his brothers?", options: ["Musa", "Yusuf", "Ibrahim", "Ismail"], answer: 1, cat: "Prophets" },
  { q: "What is Shura?", options: ["War", "Consultation", "Prayer", "Fasting"], answer: 1, cat: "General" },
  { q: "What are the two Eids in Islam?", options: ["Eid al-Fitr & Eid al-Adha", "Eid al-Fitr & Eid al-Mawlid", "Eid al-Adha & Eid al-Isra", "Eid al-Fitr & Eid al-Hijra"], answer: 0, cat: "General" },
  { q: "Which Prophet was given the Injeel?", options: ["Musa", "Dawud", "Isa", "Muhammad ﷺ"], answer: 2, cat: "Prophets" },
  { q: "What is the meaning of 'MashAllah'?", options: ["God willing", "What Allah has willed", "Praise God", "God is Great"], answer: 1, cat: "General" },
  { q: "How many prophets are mentioned in the Quran?", options: ["10", "15", "25", "50"], answer: 2, cat: "Quran" },
  { q: "What is Isra and Miraj?", options: ["Hajj rituals", "Night Journey & Ascension", "Battle", "Migration"], answer: 1, cat: "History" },
  { q: "Which companion was the first Caliph?", options: ["Umar", "Uthman", "Abu Bakr", "Ali"], answer: 2, cat: "History" },
  { q: "What is the meaning of 'Taqwa'?", options: ["Bravery", "God-consciousness", "Knowledge", "Wealth"], answer: 1, cat: "General" },
  { q: "What is Surah Al-Ikhlas about?", options: ["Prayer", "Oneness of Allah", "Stories", "Rules"], answer: 1, cat: "Quran" },
  { q: "Which Prophet lived for 950 years?", options: ["Adam", "Nuh", "Ibrahim", "Idris"], answer: 1, cat: "Prophets" },
  { q: "What is the pre-Islamic period called?", options: ["Hijrah", "Jahiliyyah", "Khilafah", "Ummah"], answer: 1, cat: "History" },
  { q: "How many times do we say 'Allahu Akbar' in Adhan?", options: ["2", "4", "6", "8"], answer: 1, cat: "Prayer" },
  { q: "What is Ihsan?", options: ["Faith", "Excellence in worship", "Charity", "Knowledge"], answer: 1, cat: "General" },
  { q: "Which surah mentions the story of the Elephant?", options: ["Al-Fil", "Al-Falaq", "Al-Fajr", "Al-Furqan"], answer: 0, cat: "Quran" },
  { q: "What is the Islamic concept of brotherhood called?", options: ["Ummah", "Shura", "Jihad", "Dawah"], answer: 0, cat: "General" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function saveProgress(stars: number) {
  try {
    const raw = localStorage.getItem('kids_islamic_games_v2');
    const data = raw ? JSON.parse(raw) : { stars: 0, completedGames: [], lastPlayed: '' };
    data.stars = (data.stars || 0) + stars;
    if (!data.completedGames.includes('islamic-trivia')) {
      data.completedGames.push('islamic-trivia');
    }
    data.lastPlayed = 'islamic-trivia';
    localStorage.setItem('kids_islamic_games_v2', JSON.stringify(data));
  } catch (e) {}
}

export default function IslamicTriviaPage() {
  const [questions, setQuestions] = useState<typeof allQuestions>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerActive, setTimerActive] = useState(false);
  const [started, setStarted] = useState(false);
  const totalQuestions = 20;

  const startGame = () => {
    const shuffled = shuffle(allQuestions).slice(0, totalQuestions);
    setQuestions(shuffled);
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setShowResult(false);
    setGameOver(false);
    setTimeLeft(15);
    setTimerActive(true);
    setStarted(true);
  };

  useEffect(() => {
    if (!timerActive || !started) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, timerActive, started]);

  const handleTimeout = () => {
    setTimerActive(false);
    setShowResult(true);
    setTimeout(() => moveToNext(), 1500);
  };

  const moveToNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
      setSelected(null);
      setShowResult(false);
      setTimeLeft(15);
      setTimerActive(true);
    } else {
      setGameOver(true);
      setTimerActive(false);
    }
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setTimerActive(false);
    setSelected(idx);
    setShowResult(true);
    if (idx === questions[currentQ].answer) {
      setScore(s => s + 1);
    }
    setTimeout(() => moveToNext(), 1500);
  };

  useEffect(() => {
    if (gameOver) {
      const stars = score >= 17 ? 3 : score >= 12 ? 2 : score >= 7 ? 1 : 0;
      saveProgress(stars);
    }
  }, [gameOver, score]);

  const stars = score >= 17 ? 3 : score >= 12 ? 2 : score >= 7 ? 1 : 0;

  const categoryColors: Record<string, string> = {
    Prophets: 'bg-purple-100 text-purple-700',
    Quran: 'bg-green-100 text-green-700',
    Prayer: 'bg-blue-100 text-blue-700',
    History: 'bg-amber-100 text-amber-700',
    General: 'bg-pink-100 text-pink-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-400 via-fuchsia-400 to-violet-500 p-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/kids" className="inline-flex items-center gap-2 text-white bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-full font-bold shadow-lg mb-4 text-lg">
          ← Back to Kids
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-center text-white drop-shadow-lg mb-6">
          🧠 Islamic Trivia 🏆
        </h1>

        {!started && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🧠🌟🕌📚🎯</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready for the Challenge?</h2>
            <p className="text-gray-600 mb-2">{totalQuestions} random questions from 100+</p>
            <p className="text-gray-600 mb-2">⏱️ 15 seconds per question</p>
            <p className="text-gray-600 mb-6">Categories: Prophets, Quran, Prayer, History, General</p>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-rose-500 to-violet-500 hover:from-rose-600 hover:to-violet-600 text-white px-8 py-4 rounded-full font-bold text-xl shadow-lg hover:scale-105 transition-transform"
            >
              Start Trivia! 🚀
            </button>
          </div>
        )}

        {started && !gameOver && questions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex justify-between items-center mb-3">
              <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-bold">
                Q {currentQ + 1}/{questions.length}
              </span>
              <span className={`px-3 py-1 rounded-full font-bold text-sm ${categoryColors[questions[currentQ].cat] || 'bg-gray-100 text-gray-700'}`}>
                {questions[currentQ].cat}
              </span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                Score: {score}
              </span>
            </div>

            {/* Timer bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className={`h-3 rounded-full transition-all duration-1000 ${
                  timeLeft > 10 ? 'bg-green-500' : timeLeft > 5 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${(timeLeft / 15) * 100}%` }}
              />
            </div>
            <p className={`text-center text-sm font-bold mb-4 ${timeLeft <= 5 ? 'text-red-600 animate-pulse' : 'text-gray-500'}`}>
              ⏱️ {timeLeft}s
            </p>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div
                className="bg-gradient-to-r from-rose-500 to-violet-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
              />
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 text-center">
              {questions[currentQ].q}
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {questions[currentQ].options.map((opt, idx) => {
                let btnClass = "w-full p-4 rounded-2xl font-bold text-lg text-left transition-all duration-200 border-2 ";
                if (showResult) {
                  if (idx === questions[currentQ].answer) {
                    btnClass += "bg-green-100 border-green-500 text-green-700";
                  } else if (idx === selected && idx !== questions[currentQ].answer) {
                    btnClass += "bg-red-100 border-red-500 text-red-700";
                  } else {
                    btnClass += "bg-gray-50 border-gray-200 text-gray-400";
                  }
                } else {
                  btnClass += "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800 hover:bg-fuchsia-100 hover:border-fuchsia-400 hover:scale-[1.02] active:scale-95";
                }
                return (
                  <button key={idx} onClick={() => handleAnswer(idx)} className={btnClass} disabled={selected !== null}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {gameOver && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎉🧠🏆✨🎊</div>
            <h2 className="text-3xl font-bold text-fuchsia-700 mb-2">MashAllah!</h2>
            <p className="text-xl text-gray-700 mb-4">
              You scored <span className="font-bold text-fuchsia-600">{score}</span> out of {questions.length}!
            </p>
            <div className="text-4xl mb-4">
              {Array.from({ length: stars }).map((_, i) => <span key={i}>⭐</span>)}
              {Array.from({ length: 3 - stars }).map((_, i) => <span key={i}>☆</span>)}
            </div>
            <p className="text-gray-500 mb-6">
              {score >= 17 ? "Incredible! You're an Islamic trivia master!" : score >= 12 ? "Great knowledge! Keep learning!" : score >= 7 ? "Good effort! Try again for more stars!" : "Keep learning and try again!"}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button onClick={startGame} className="bg-gradient-to-r from-rose-500 to-violet-500 hover:from-rose-600 hover:to-violet-600 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                Play Again 🔄
              </button>
              <Link href="/kids" className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                Back to Kids 🏠
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
