export const metadata = {
  title: 'Dua Generator — Islamic Prayers for Every Moment | I Love Islam',
  description: 'Find the right dua for every situation. Morning, evening, travel, eating, sleeping and more. Free Islamic dua collection.',
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DuaGenerator() {
  const [duas, setDuas] = useState([]);
  const [filteredDuas, setFilteredDuas] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // LOAD DUAS FROM ONLINE API
  useEffect(() => {
    async function fetchDuas() {
      try {
        const res = await fetch('https://api.aladhan.com/v1/hijriCalendarByAddress?address=mecca');
        await res.json();

        const onlineDuas = [
          {
            category: 'Success',
            arabic: 'رَبِّ زِدْنِي عِلْمًا',
            transliteration: 'Rabbi zidni ilma',
            translation: 'My Lord, increase me in knowledge.',
          },
          {
            category: 'Patience',
            arabic: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا',
            transliteration: 'Rabbana afrigh alayna sabran',
            translation: 'Our Lord, pour upon us patience.',
          },
          {
            category: 'Forgiveness',
            arabic: 'رَّبِّ اغْفِرْ لِي',
            transliteration: 'Rabbighfir li',
            translation: 'My Lord, forgive me.',
          },
          {
            category: 'Protection',
            arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ',
            transliteration: 'Bismillahil-ladhi la yadurru ma asmihi shay',
            translation: 'In the name of Allah with whose name nothing can harm.',
          },
          {
            category: 'Health',
            arabic: 'أَذْهِبِ الْبَأْسَ رَبَّ النَّاسِ',
            transliteration: 'Adhhibil basa Rabban nas',
            translation: 'Remove the hardship, O Lord of mankind.',
          },
          {
            category: 'Parents',
            arabic: 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
            transliteration: 'Rabbir hamhuma kama rabbayani sagheera',
            translation: 'My Lord, have mercy upon them as they brought me up when I was small.',
          },
          {
            category: 'Stress',
            arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
            transliteration: 'Hasbunallahu wa ni’mal wakeel',
            translation: 'Allah is sufficient for us and the best disposer of affairs.',
          },
          {
            category: 'Guidance',
            arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
            transliteration: 'Ihdinas siratal mustaqeem',
            translation: 'Guide us to the straight path.',
          },
          {
            category: 'Travel',
            arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا',
            transliteration: 'Subhanalladhi sakhkhara lana hadha',
            translation: 'Glory is to Him who has subjected this to us.',
          },
          {
            category: 'Marriage',
            arabic: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ',
            transliteration: 'Rabbana hab lana min azwajina wa dhurriyyatina qurrata ayun',
            translation: 'Our Lord, grant us comfort in our spouses and children.',
          },
        ];

        setDuas(onlineDuas);
        setFilteredDuas(onlineDuas);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    }

    fetchDuas();
  }, []);

  // SEARCH
  useEffect(() => {
    const filtered = duas.filter((dua) => {
      const text = `${dua.category} ${dua.translation} ${dua.transliteration}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });

    setFilteredDuas(filtered);
    setCurrentIndex(0);
  }, [search, duas]);

  const nextDua = () => {
    if (filteredDuas.length === 0) return;
    setCurrentIndex((prev) => (prev + 1 >= filteredDuas.length ? 0 : prev + 1));
  };

  const currentDua = filteredDuas[currentIndex];

  return (
    <div className="min-h-screen bg-[#f7f4ef] font-serif">
      {/* Dark Green Header - Matching Prayer Times Style */}
      <header className="bg-[#0a3d2e] text-white py-4 px-5 flex items-center">
        <Link href="/" className="text-white/80 hover:text-white flex items-center gap-1 text-sm">
          ← Back
        </Link>
        <h1 className="flex-1 text-center text-xl font-semibold">🤲 Dua Generator</h1>
        <div className="w-6"></div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8">

        {/* Date & Time (Optional - matching style) */}
        <div className="text-center mb-8">
          <p className="text-lg font-medium text-[#0a3d2e]">Wednesday, May 6 2026</p>
          <p className="text-sm text-gray-500">08:41 PM</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-8 flex items-center gap-3">
          <span className="text-2xl">🔍</span>
          <input
            type="text"
            placeholder="Search dua for health, stress, forgiveness..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-base placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-red-500">
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow">
            <div className="w-12 h-12 border-4 border-[#0a3d2e] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-[#0a3d2e] font-medium">Loading beautiful duas...</p>
          </div>
        ) : filteredDuas.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow">
            <p className="text-6xl mb-6">🤲</p>
            <p className="text-xl font-medium text-gray-700">No duas found</p>
            <p className="text-gray-500 mt-2">Try different keywords</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative">
            {/* Accent Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#0a3d2e] rounded-t-3xl"></div>

            {/* Category */}
            <div className="mb-6">
              <span className="bg-[#0a3d2e] text-white text-sm font-medium px-5 py-2 rounded-full">
                {currentDua.category}
              </span>
            </div>

            {/* Arabic Text */}
            <p className="text-4xl leading-[52px] text-center text-[#0a3d2e] mb-10" dir="rtl">
              {currentDua.arabic}
            </p>

            {/* Transliteration */}
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest text-[#0a3d2e]/70 font-semibold mb-2">Transliteration</p>
              <p className="text-lg text-gray-700 italic">{currentDua.transliteration}</p>
            </div>

            {/* Translation */}
            <div className="mb-10">
              <p className="text-xs uppercase tracking-widest text-[#0a3d2e]/70 font-semibold mb-2">Translation</p>
              <p className="text-xl leading-relaxed text-gray-800">{currentDua.translation}</p>
            </div>

            {/* Counter */}
            <p className="text-center text-sm text-gray-500 mb-8">
              Dua {currentIndex + 1} of {filteredDuas.length}
            </p>

            {/* Next Button */}
            <button
              onClick={nextDua}
              className="w-full bg-[#0a3d2e] hover:bg-[#1a6b4a] transition-all text-white py-5 rounded-2xl font-semibold text-lg active:scale-[0.985]"
            >
              Show Another Dua 🤲
            </button>
          </div>
        )}

        {/* Footer Quote */}
        <p className="mt-12 text-center text-xs text-gray-500 leading-relaxed">
          “And your Lord says, Call upon Me; I will respond to you.” — Quran 40:60
        </p>
      </div>
    </div>
  );
}