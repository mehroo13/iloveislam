'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const HAJJ_STEPS = [
  {
    id: 'preparation',
    title: 'Preparation & Ihram',
    items: [
      { id: 'p1', text: 'Make sincere intention (Niyyah) for Hajj' },
      { id: 'p2', text: 'Perform Ghusl (purification bath)' },
      { id: 'p3', text: 'Put on Ihram garments (for men)' },
      { id: 'p4', text: 'Perform 2 Rakats of Sunnah prayer' },
      { id: 'p5', text: 'Recite the Talbiyah frequently' },
    ]
  },
  {
    id: 'day1',
    title: 'Day 1: 8th Dhul Hijjah (Mina)',
    items: [
      { id: 'd1-1', text: 'Enter state of Ihram if not already' },
      { id: 'd1-2', text: 'Travel to Mina after Fajr' },
      { id: 'd1-3', text: 'Perform Dhuhr, Asr, Maghrib, and Isha in Mina' },
      { id: 'd1-4', text: 'Stay overnight in Mina' },
    ]
  },
  {
    id: 'day2',
    title: 'Day 2: 9th Dhul Hijjah (Arafat & Muzdalifah)',
    items: [
      { id: 'd2-1', text: 'Travel to Arafat after Fajr' },
      { id: 'd2-2', text: 'Perform Wuquf (Standing) at Arafat' },
      { id: 'd2-3', text: 'Listen to the Hajj Khutbah' },
      { id: 'd2-4', text: 'Travel to Muzdalifah after sunset' },
      { id: 'd2-5', text: 'Perform Maghrib and Isha together in Muzdalifah' },
      { id: 'd2-6', text: 'Collect 49 or 70 pebbles for Jamarat' },
      { id: 'd2-7', text: 'Stay overnight in Muzdalifah' },
    ]
  },
  {
    id: 'day3',
    title: 'Day 3: 10th Dhul Hijjah (Eid al-Adha)',
    items: [
      { id: 'd3-1', text: 'Travel back to Mina after Fajr' },
      { id: 'd3-2', text: 'Stoning of Jamarat al-Aqaba (Big Pillar)' },
      { id: 'd3-3', text: 'Perform Animal Sacrifice (Hadi)' },
      { id: 'd3-4', text: 'Shave or trim hair (Halq or Taqsir)' },
      { id: 'd3-5', text: 'Perform Tawaf al-Ifadah in Makkah' },
      { id: 'd3-6', text: 'Perform Sa’ee between Safa and Marwa' },
    ]
  },
  {
    id: 'days4-6',
    title: 'Days 4-6: 11th-13th Dhul Hijjah (Tashreeq)',
    items: [
      { id: 'd4-1', text: 'Stay in Mina for the Days of Tashreeq' },
      { id: 'd4-2', text: 'Stone all three Jamarat each day' },
      { id: 'd4-3', text: 'Perform Farewell Tawaf (Tawaf al-Wada) before leaving Makkah' },
    ]
  },
  {
    id: 'packing',
    title: 'Essential Packing List',
    items: [
      { id: 'pk1', text: 'Passport, Visa, and Nusuk ID' },
      { id: 'pk2', text: 'Unscented soap, shampoo, and deodorant' },
      { id: 'pk3', text: 'Comfortable walking sandals' },
      { id: 'pk4', text: 'Prayer mat and small Quran' },
      { id: 'pk5', text: 'Power bank and universal adapter' },
      { id: 'pk6', text: 'Personal medications and first aid kit' },
    ]
  }
];

export default function HajjChecklist() {
  const [checkedItems, setCheckedItems] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('hajj-checklist-progress');
    if (saved) {
      try {
        setCheckedItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load progress');
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('hajj-checklist-progress', JSON.stringify(checkedItems));
    }
  }, [checkedItems, mounted]);

  const toggleItem = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const resetProgress = () => {
    if (window.confirm('Are you sure you want to reset all progress?')) {
      setCheckedItems({});
    }
  };

  const totalItems = HAJJ_STEPS.reduce((acc, step) => acc + step.items.length, 0);
  const completedItems = Object.values(checkedItems).filter(Boolean).length;
  const progressPercentage = Math.round((completedItems / totalItems) * 100);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f7f4ef] font-serif">
      {/* Dark Green Header */}
      <header className="bg-[#0a3d2e] text-white py-4 px-5 flex items-center">
        <Link href="/" className="text-white/80 hover:text-white flex items-center gap-1 text-sm">
          ← Back
        </Link>
        <h1 className="flex-1 text-center text-xl font-semibold">🕋 Hajj Checklist</h1>
        <div className="w-6"></div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8">
        {/* Progress Overview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-[#0a3d2e]">Your Hajj Progress</h2>
            <span className="text-2xl font-bold text-[#0a3d2e]">{progressPercentage}%</span>
          </div>
          
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-[#0a3d2e] transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <p className="text-sm text-gray-600 text-center">
            {completedItems} of {totalItems} tasks completed
          </p>
        </div>

        {/* Checklist Sections */}
        {HAJJ_STEPS.map((section) => (
          <div key={section.id} className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden">
            <h2 className="bg-[#0a3d2e] text-white px-6 py-4 text-lg font-semibold">
              {section.title}
            </h2>
            
            <div className="p-6 space-y-4">
              {section.items.map((item) => (
                <label 
                  key={item.id} 
                  className="flex items-start gap-4 cursor-pointer group"
                >
                  <input 
                    type="checkbox" 
                    checked={!!checkedItems[item.id]} 
                    onChange={() => toggleItem(item.id)}
                    className="mt-1.5 w-5 h-5 accent-[#0a3d2e] cursor-pointer"
                  />
                  <span className={`flex-1 text-[15.5px] leading-relaxed transition-all ${
                    checkedItems[item.id] 
                      ? 'line-through text-gray-400' 
                      : 'text-gray-800'
                  }`}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}

        {/* Reset Button */}
        <div className="flex justify-center mt-8">
          <button 
            onClick={resetProgress}
            className="px-8 py-3 text-red-600 border border-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium"
          >
            Reset All Progress
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          Your progress is automatically saved in your browser
        </p>
      </div>
    </div>
  );
}