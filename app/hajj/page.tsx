'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/* ── Hajj Steps Data ── */
const HAJJ_SECTIONS = [
  {
    id: 'preparation',
    title: '🕋 Before You Leave',
    icon: '📝',
    color: '#0a3d2e',
    items: [
      { id: 'prep1', text: 'Obtain Hajj visa and Nusuk permit', icon: '🛂' },
      { id: 'prep2', text: 'Book flights and accommodation (Mina, Arafat, Muzdalifah)', icon: '✈️' },
      { id: 'prep3', text: 'Learn the Manasik (rites) of Hajj', icon: '📚' },
      { id: 'prep4', text: 'Prepare physically – walk daily, build stamina', icon: '🏃' },
      { id: 'prep5', text: 'Arrange travel medical insurance and vaccinations', icon: '💉' },
      { id: 'prep6', text: 'Settle debts and write a will (if needed)', icon: '📜' },
      { id: 'prep7', text: 'Make sincere intention (Niyyah) to perform Hajj only for Allah', icon: '🤲' },
      { id: 'prep8', text: 'Pack unscented toiletries, Ihram garments, comfortable sandals', icon: '🎒' },
    ],
  },
  {
    id: 'day1',
    title: '🌅 Day 1: 8th Dhul Hijjah – Yawm at‑Tarwiyah (Mina)',
    icon: '🏕️',
    color: '#1a6b4a',
    items: [
      { id: 'd1_1', text: 'Enter state of Ihram at Miqat (if not already)', icon: '🤍' },
      { id: 'd1_2', text: 'Recite Talbiyah frequently: "Labbayk Allahumma labbayk…"', icon: '🗣️' },
      { id: 'd1_3', text: 'Travel to Mina after sunrise', icon: '🚌' },
      { id: 'd1_4', text: 'Pray Dhuhr, Asr, Maghrib, and Isha in Mina (shortened)', icon: '🕌' },
      { id: 'd1_5', text: 'Spend the night in Mina – rest and make du\'a', icon: '🌙' },
    ],
  },
  {
    id: 'day2',
    title: '🤲 Day 2: 9th Dhul Hijjah – Day of Arafah',
    icon: '🏔️',
    color: '#b8860b',
    items: [
      { id: 'd2_1', text: 'Pray Fajr in Mina, then travel to Arafat after sunrise', icon: '☀️' },
      { id: 'd2_2', text: 'Perform Wuquf (standing) at Arafat – the greatest pillar of Hajj', icon: '🧍‍♂️' },
      { id: 'd2_3', text: 'Listen to the Hajj Khutbah at Masjid Namirah', icon: '🎙️' },
      { id: 'd2_4', text: 'Spend the entire afternoon in du’a, dhikr, and repentance', icon: '🤲' },
      { id: 'd2_5', text: 'After sunset, travel to Muzdalifah calmly', icon: '🚶' },
      { id: 'd2_6', text: 'Pray Maghrib and Isha combined (shortened) in Muzdalifah', icon: '🕌' },
      { id: 'd2_7', text: 'Collect 70 pebbles for Jamarat (or 49 if leaving early)', icon: '🪨' },
      { id: 'd2_8', text: 'Sleep under the open sky in Muzdalifah (worship & rest)', icon: '🌌' },
    ],
  },
  {
    id: 'day3',
    title: '🐑 Day 3: 10th Dhul Hijjah – Eid al‑Adha & Jamarat',
    icon: '🕋',
    color: '#c8a96e',
    items: [
      { id: 'd3_1', text: 'Pray Fajr in Muzdalifah, then return to Mina', icon: '🌄' },
      { id: 'd3_2', text: 'Stone Jamarat al‑Aqaba (the large pillar) with 7 pebbles', icon: '🪨' },
      { id: 'd3_3', text: 'Offer Hadi (sacrifice) – if performing Tamattu’ or Qiran', icon: '🐏' },
      { id: 'd3_4', text: 'Men: Shave head (Halq) or trim hair (Taqsir)', icon: '🪒' },
      { id: 'd3_5', text: 'Women: Trim a fingertip’s length of hair', icon: '✂️' },
      { id: 'd3_6', text: 'Proceed to Makkah and perform Tawaf al‑Ifadah (Ziyarah)', icon: '🕋' },
      { id: 'd3_7', text: 'Perform Sa’ee between Safa and Marwa', icon: '🚶‍♀️' },
    ],
  },
  {
    id: 'days4-6',
    title: '☀️ Days 4–6: 11th–13th Dhul Hijjah – Ayyam at‑Tashreeq',
    icon: '⛺',
    color: '#2d8a5e',
    items: [
      { id: 'd4_1', text: 'Stay in Mina during the Days of Tashreeq', icon: '🏕️' },
      { id: 'd4_2', text: 'Each day after Dhuhr: stone all three Jamarat (small, medium, large)', icon: '🪨' },
      { id: 'd4_3', text: 'If leaving on 12th Dhul Hijjah, stone before sunset', icon: '⏳' },
      { id: 'd4_4', text: 'Perform Tawaf al‑Wada (Farewell Tawaf) before departing Makkah', icon: '🕋' },
      { id: 'd4_5', text: 'Make final du’a at the Multazam (between Hajar al‑Aswad and the door)', icon: '🤲' },
    ],
  },
];

/* ── Duas & Reminders ── */
const HAJJ_DUAS = [
  { arabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لا شَرِيكَ لَكَ لَبَّيْكَ', transliteration: 'Labbayka Allāhumma labbayk…', meaning: 'Talbiyah – the call of the pilgrim' },
  { arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', transliteration: 'Rabbana atina fid‑dunya hasanah wa fil‑akhirati hasanah wa qina ‘adhaban‑nar', meaning: 'Most comprehensive du’a (recite often at Arafat)' },
  { arabic: 'لا إِلَهَ إِلا اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', transliteration: 'La ilaha illallahu wahdahu la sharika lah…', meaning: 'The best du’a on the Day of Arafah' },
];

export default function HajjChecklist() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('hajj-checklist-v2');
    if (saved) {
      try { setCheckedItems(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('hajj-checklist-v2', JSON.stringify(checkedItems));
    }
  }, [checkedItems, mounted]);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const resetProgress = () => {
    if (window.confirm('Reset all your Hajj checklist progress?')) {
      setCheckedItems({});
    }
  };

  const totalItems = HAJJ_SECTIONS.reduce((sum, sec) => sum + sec.items.length, 0);
  const completedItems = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white font-serif">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white px-5 py-4 shadow-lg sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/80 hover:text-white text-sm flex items-center gap-1">
            <span>←</span> Back
          </Link>
          <h1 className="text-xl font-bold tracking-wide">🕋 Hajj Checklist</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-12 space-y-6">
        {/* Progress Ring */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col items-center">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progressPercent / 100)}`}
                className="transition-all duration-700"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0a3d2e" />
                  <stop offset="100%" stopColor="#c8a96e" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-emerald-800">{progressPercent}%</span>
              <span className="text-xs text-gray-500 mt-1">Completed</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            {completedItems} of {totalItems} tasks done
          </p>
        </div>

        {/* Sections */}
        {HAJJ_SECTIONS.map(section => {
          const sectionItems = section.items;
          const sectionCompleted = sectionItems.filter(item => checkedItems[item.id]).length;
          const sectionTotal = sectionItems.length;
          return (
            <div key={section.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div
                className="px-5 py-4 flex items-center gap-3"
                style={{ backgroundColor: section.color + '15' }}
              >
                <span className="text-2xl">{section.icon}</span>
                <div className="flex-1">
                  <h2 className="font-bold text-gray-800 text-lg">{section.title}</h2>
                  <p className="text-xs text-gray-500">
                    {sectionCompleted}/{sectionTotal} tasks completed
                  </p>
                </div>
                <span className="text-xl text-emerald-700 font-bold">{sectionCompleted === sectionTotal ? '✅' : ''}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {sectionItems.map(item => {
                  const done = !!checkedItems[item.id];
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-4 px-5 py-4 cursor-pointer group transition-colors hover:bg-gray-50 ${
                        done ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => toggleItem(item.id)}
                        className="w-5 h-5 rounded accent-emerald-800 cursor-pointer"
                      />
                      <span className="text-lg">{item.icon}</span>
                      <span
                        className={`flex-1 text-sm leading-relaxed transition-all ${
                          done ? 'line-through text-gray-400' : 'text-gray-700'
                        }`}
                      >
                        {item.text}
                      </span>
                      {done && <span className="text-emerald-600 text-sm">✓</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Duas Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <span>🤲</span> Essential Hajj Duas
          </h2>
          <div className="space-y-4">
            {HAJJ_DUAS.map((dua, i) => (
              <div key={i} className="bg-amber-50 rounded-xl p-4">
                <p className="text-xl text-right leading-loose font-arabic text-gray-800 mb-2" dir="rtl">
                  {dua.arabic}
                </p>
                <p className="text-xs text-gray-500 italic mb-1">{dua.transliteration}</p>
                <p className="text-sm text-gray-700">{dua.meaning}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reset */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={resetProgress}
            className="px-6 py-2 border border-red-300 text-red-600 rounded-full text-sm font-medium hover:bg-red-50 transition-colors"
          >
            🔄 Reset All Progress
          </button>
          <p className="text-xs text-gray-400">Progress is saved automatically in your browser</p>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400">
          May Allah accept your Hajj and grant you Hajj Mabrur 🤍
        </p>
      </main>
    </div>
  );
}