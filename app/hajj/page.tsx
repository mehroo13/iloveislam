'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabId = 'checklist' | 'packing' | 'duas' | 'restrictions' | 'mistakes' | 'emergency';

interface CheckItem {
  id: string;
  text: string;
  icon: string;
  detail?: string;
}

interface Section {
  id: string;
  title: string;
  icon: string;
  color: string;
  items: CheckItem[];
}

// ─── Hajj Checklist Data ──────────────────────────────────────────────────────
const HAJJ_SECTIONS: Section[] = [
  {
    id: 'preparation', title: '📝 Before You Leave', icon: '📝', color: '#0a3d2e',
    items: [
      { id: 'prep1', text: 'Obtain Hajj visa and Nusuk permit', icon: '🛂', detail: 'Apply through your country\'s authorized Hajj agent' },
      { id: 'prep2', text: 'Book flights and accommodation', icon: '✈️', detail: 'Mina tents, Arafat, Muzdalifah arrangements' },
      { id: 'prep3', text: 'Learn the Manasik (rites) of Hajj thoroughly', icon: '📚', detail: 'Attend a Hajj seminar or watch detailed guides' },
      { id: 'prep4', text: 'Prepare physically – walk daily, build stamina', icon: '🏃', detail: 'You will walk 10-15km per day during Hajj' },
      { id: 'prep5', text: 'Get required vaccinations (Meningitis ACWY mandatory)', icon: '💉', detail: 'Also recommended: flu, COVID, pneumonia' },
      { id: 'prep6', text: 'Arrange travel medical insurance', icon: '🏥' },
      { id: 'prep7', text: 'Settle all debts and seek forgiveness from people', icon: '🤝' },
      { id: 'prep8', text: 'Write your Islamic will (Wasiyyah)', icon: '📜' },
      { id: 'prep9', text: 'Make sincere intention (Niyyah) for Allah alone', icon: '🤲' },
      { id: 'prep10', text: 'Learn key Arabic phrases and duas', icon: '💬' },
      { id: 'prep11', text: 'Photocopy all documents (passport, visa, tickets)', icon: '📄' },
      { id: 'prep12', text: 'Inform family and leave emergency contacts', icon: '📞' },
    ],
  },
  {
    id: 'day1', title: '🏕️ Day 1: 8th Dhul Hijjah – Mina', icon: '🏕️', color: '#1a6b4a',
    items: [
      { id: 'd1_1', text: 'Enter state of Ihram at Miqat', icon: '🤍', detail: 'Ghusl, wear Ihram, make intention for Hajj' },
      { id: 'd1_2', text: 'Recite Talbiyah continuously', icon: '🗣️', detail: 'Labbayk Allahumma labbayk...' },
      { id: 'd1_3', text: 'Travel to Mina after Fajr', icon: '🚌' },
      { id: 'd1_4', text: 'Pray Dhuhr, Asr, Maghrib, Isha (shortened, not combined)', icon: '🕌' },
      { id: 'd1_5', text: 'Spend the night in Mina', icon: '🌙', detail: 'Rest, make dhikr, prepare for Arafat' },
      { id: 'd1_6', text: 'Pray Fajr in Mina before leaving for Arafat', icon: '🌅' },
    ],
  },
  {
    id: 'day2', title: '🏔️ Day 2: 9th Dhul Hijjah – Arafat', icon: '🏔️', color: '#b8860b',
    items: [
      { id: 'd2_1', text: 'Travel to Arafat after sunrise', icon: '☀️' },
      { id: 'd2_2', text: 'Perform Wuquf (standing) at Arafat', icon: '🧍', detail: 'THE most important pillar — Hajj IS Arafat' },
      { id: 'd2_3', text: 'Listen to the Hajj Khutbah', icon: '🎙️' },
      { id: 'd2_4', text: 'Pray Dhuhr and Asr combined & shortened', icon: '🕌' },
      { id: 'd2_5', text: 'Spend entire afternoon in du\'a and repentance', icon: '🤲', detail: 'Best du\'a is on this day — cry, beg, repent' },
      { id: 'd2_6', text: 'After sunset, travel calmly to Muzdalifah', icon: '🚶' },
      { id: 'd2_7', text: 'Pray Maghrib and Isha combined in Muzdalifah', icon: '🕌' },
      { id: 'd2_8', text: 'Collect 49-70 pebbles for Jamarat', icon: '🪨', detail: '49 if leaving on 12th, 70 if staying till 13th' },
      { id: 'd2_9', text: 'Sleep in Muzdalifah (Wajib to stay till Fajr)', icon: '🌌' },
    ],
  },
  {
    id: 'day3', title: '🐑 Day 3: 10th Dhul Hijjah – Eid & Nahr', icon: '🕋', color: '#c8a96e',
    items: [
      { id: 'd3_1', text: 'Pray Fajr in Muzdalifah, then head to Mina', icon: '🌄' },
      { id: 'd3_2', text: 'Stone Jamarat al-Aqaba (large pillar) with 7 pebbles', icon: '🪨', detail: 'Say "Bismillah, Allahu Akbar" with each throw' },
      { id: 'd3_3', text: 'Offer Hadi (sacrifice)', icon: '🐏', detail: 'Required for Tamattu\' and Qiran Hajj' },
      { id: 'd3_4', text: 'Shave head (Halq) or trim hair (Taqsir)', icon: '🪒', detail: 'Halq is better for men. Women trim fingertip length.' },
      { id: 'd3_5', text: 'First Tahallul — most Ihram restrictions lifted', icon: '✅', detail: 'Can wear normal clothes, use perfume. Marital relations still prohibited.' },
      { id: 'd3_6', text: 'Go to Makkah for Tawaf al-Ifadah', icon: '🕋', detail: 'This is a Rukn (pillar) of Hajj — cannot be skipped' },
      { id: 'd3_7', text: 'Perform Sa\'ee between Safa and Marwa', icon: '🚶‍♀️', detail: '7 rounds. Required for Tamattu\' Hajj.' },
      { id: 'd3_8', text: 'Second Tahallul — ALL restrictions lifted', icon: '🎉' },
      { id: 'd3_9', text: 'Return to Mina for the night', icon: '🏕️' },
    ],
  },
  {
    id: 'days4_5', title: '☀️ Days 4-5: 11th-12th Dhul Hijjah – Tashreeq', icon: '⛺', color: '#2d8a5e',
    items: [
      { id: 'd4_1', text: 'Stay in Mina during Days of Tashreeq', icon: '🏕️' },
      { id: 'd4_2', text: 'Day 11: Stone all 3 Jamarat after Dhuhr (7 each)', icon: '🪨', detail: 'Small → Medium → Large. Make du\'a after first two.' },
      { id: 'd4_3', text: 'Day 12: Stone all 3 Jamarat after Dhuhr (7 each)', icon: '🪨' },
      { id: 'd4_4', text: 'If leaving on 12th: depart Mina before sunset', icon: '⏳', detail: 'If sun sets while still in Mina, must stay for 13th' },
      { id: 'd4_5', text: 'Day 13 (optional): Stone all 3 Jamarat if staying', icon: '🪨' },
    ],
  },
  {
    id: 'farewell', title: '🕋 Farewell & Departure', icon: '🕋', color: '#4a2c0a',
    items: [
      { id: 'fw1', text: 'Perform Tawaf al-Wada\' (Farewell Tawaf)', icon: '🕋', detail: 'Last thing before leaving Makkah. Wajib.' },
      { id: 'fw2', text: 'Make du\'a at the Multazam', icon: '🤲', detail: 'Between Hajar al-Aswad and the Ka\'bah door' },
      { id: 'fw3', text: 'Drink Zamzam water and make du\'a', icon: '💧' },
      { id: 'fw4', text: 'Visit Madinah (recommended, not part of Hajj)', icon: '🕌', detail: 'Pray 40 prayers in Masjid an-Nabawi if possible' },
      { id: 'fw5', text: 'Send Salam upon the Prophet ﷺ at his grave', icon: '🌹' },
      { id: 'fw6', text: 'Visit Masjid Quba (reward of Umrah)', icon: '🕌' },
      { id: 'fw7', text: 'Return home with gratitude and renewed faith', icon: '🏠' },
    ],
  },
];

const PACKING_LIST: Section[] = [
  {
    id: 'documents', title: '📄 Documents', icon: '📄', color: '#1a3d6b',
    items: [
      { id: 'pk_doc1', text: 'Passport (valid 6+ months)', icon: '🛂' },
      { id: 'pk_doc2', text: 'Hajj visa / Nusuk permit', icon: '📋' },
      { id: 'pk_doc3', text: 'Flight tickets (printed)', icon: '✈️' },
      { id: 'pk_doc4', text: 'Hotel booking confirmations', icon: '🏨' },
      { id: 'pk_doc5', text: 'Vaccination certificate', icon: '💉' },
      { id: 'pk_doc6', text: 'Travel insurance documents', icon: '🛡️' },
      { id: 'pk_doc7', text: 'Photocopies of all documents', icon: '📑' },
      { id: 'pk_doc8', text: 'Emergency contact card (in pocket)', icon: '📞' },
    ],
  },
  {
    id: 'ihram', title: '🤍 Ihram & Prayer', icon: '🤍', color: '#0a3d2e',
    items: [
      { id: 'pk_ih1', text: 'Ihram garments (2 white sheets for men)', icon: '🤍' },
      { id: 'pk_ih2', text: 'Ihram belt / money pouch', icon: '👛' },
      { id: 'pk_ih3', text: 'Prayer mat (lightweight, foldable)', icon: '🧎' },
      { id: 'pk_ih4', text: 'Pocket Quran or Quran app', icon: '📖' },
      { id: 'pk_ih5', text: 'Du\'a book / Hajj guide booklet', icon: '📚' },
      { id: 'pk_ih6', text: 'Tasbeeh / counter', icon: '📿' },
      { id: 'pk_ih7', text: 'Compass (for Qibla)', icon: '🧭' },
    ],
  },
  {
    id: 'clothing', title: '👕 Clothing', icon: '👕', color: '#4a2c6b',
    items: [
      { id: 'pk_cl1', text: 'Comfortable sandals (no stitching for men in Ihram)', icon: '🩴' },
      { id: 'pk_cl2', text: 'Regular clothes (for after Ihram)', icon: '👔' },
      { id: 'pk_cl3', text: 'Socks and underwear', icon: '🧦' },
      { id: 'pk_cl4', text: 'Light jacket (Madinah can be cool)', icon: '🧥' },
      { id: 'pk_cl5', text: 'Umbrella (essential for sun protection)', icon: '☂️' },
      { id: 'pk_cl6', text: 'Sleeping bag or light blanket (for Muzdalifah)', icon: '🛏️' },
    ],
  },
  {
    id: 'health', title: '🏥 Health & Hygiene', icon: '🏥', color: '#6b1a1a',
    items: [
      { id: 'pk_h1', text: 'Unscented soap, shampoo, deodorant', icon: '🧴' },
      { id: 'pk_h2', text: 'Sunscreen (unscented)', icon: '☀️' },
      { id: 'pk_h3', text: 'Prescription medications', icon: '💊' },
      { id: 'pk_h4', text: 'Pain relievers (paracetamol, ibuprofen)', icon: '💊' },
      { id: 'pk_h5', text: 'Blister plasters and bandages', icon: '🩹' },
      { id: 'pk_h6', text: 'Electrolyte sachets (for dehydration)', icon: '💧' },
      { id: 'pk_h7', text: 'Face masks (crowds are intense)', icon: '😷' },
      { id: 'pk_h8', text: 'Hand sanitizer', icon: '🧴' },
      { id: 'pk_h9', text: 'Vaseline (prevents chafing in Ihram)', icon: '🫙' },
      { id: 'pk_h10', text: 'Nail clippers and scissors', icon: '✂️' },
    ],
  },
  {
    id: 'essentials', title: '🎒 Essentials', icon: '🎒', color: '#6b4a0a',
    items: [
      { id: 'pk_e1', text: 'Small backpack / waist bag', icon: '🎒' },
      { id: 'pk_e2', text: 'Water bottle (refillable)', icon: '🍶' },
      { id: 'pk_e3', text: 'Snacks (dates, nuts, energy bars)', icon: '🥜' },
      { id: 'pk_e4', text: 'Phone + charger + power bank', icon: '🔋' },
      { id: 'pk_e5', text: 'Universal adapter', icon: '🔌' },
      { id: 'pk_e6', text: 'Cash (Saudi Riyals) + credit card', icon: '💰' },
      { id: 'pk_e7', text: 'Plastic bags (for shoes at mosque)', icon: '👜' },
      { id: 'pk_e8', text: 'Small towel', icon: '🧻' },
      { id: 'pk_e9', text: 'Earplugs and eye mask (for sleeping in Mina)', icon: '😴' },
    ],
  },
];

const HAJJ_DUAS = [
  { arabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لا شَرِيكَ لَكَ', meaning: 'Talbiyah — the call of the pilgrim', when: 'From Miqat until stoning on 10th' },
  { arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', meaning: 'Between Yemeni Corner and Hajar al-Aswad (Tawaf)', when: 'During Tawaf — Quran 2:201' },
  { arabic: 'لا إِلَهَ إِلا اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', meaning: 'Best du\'a on the Day of Arafah', when: 'Day of Arafat — Tirmidhi' },
  { arabic: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ', meaning: 'When beginning Sa\'ee at Safa', when: 'Start of Sa\'ee — Quran 2:158' },
  { arabic: 'رَبِّ اغْفِرْ وَارْحَمْ وَأَنتَ الأَعَزُّ الأَكْرَمُ', meaning: 'O Lord, forgive and have mercy, You are the Most Mighty', when: 'Between Safa and Marwa' },
  { arabic: 'بِسْمِ اللَّهِ، اللَّهُ أَكْبَرُ', meaning: 'In the name of Allah, Allah is the Greatest', when: 'When throwing each pebble at Jamarat' },
  { arabic: 'اللَّهُمَّ اجْعَلْهُ حَجًّا مَبْرُورًا وَسَعْيًا مَشْكُورًا وَذَنْبًا مَغْفُورًا', meaning: 'O Allah, make it an accepted Hajj, a rewarded effort, and a forgiven sin', when: 'General — throughout Hajj' },
  { arabic: 'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلا إِلَهَ إِلا اللَّهُ وَاللَّهُ أَكْبَرُ', meaning: 'Takbeer of Tashreeq', when: 'After every Fard prayer from 9th-13th Dhul Hijjah' },
];

const IHRAM_RESTRICTIONS = [
  { icon: '✂️', text: 'Cutting hair or nails', applies: 'Both' },
  { icon: '🌹', text: 'Using perfume or scented products', applies: 'Both' },
  { icon: '💍', text: 'Marriage or proposals', applies: 'Both' },
  { icon: '❤️', text: 'Sexual relations', applies: 'Both' },
  { icon: '🎯', text: 'Hunting land animals', applies: 'Both' },
  { icon: '👔', text: 'Wearing stitched clothing', applies: 'Men only' },
  { icon: '🧢', text: 'Covering the head', applies: 'Men only' },
  { icon: '🧤', text: 'Wearing gloves', applies: 'Women only' },
  { icon: '😷', text: 'Covering the face (Niqab)', applies: 'Women only' },
];

const COMMON_MISTAKES = [
  { icon: '❌', mistake: 'Pushing and shoving during Tawaf', fix: 'Stay calm, make du\'a, move with the flow. Upper floors are less crowded.' },
  { icon: '❌', mistake: 'Touching/kissing Hajar al-Aswad by force', fix: 'Simply point toward it and say "Bismillah, Allahu Akbar" from a distance.' },
  { icon: '❌', mistake: 'Specific du\'as for each round of Tawaf', fix: 'There are NO specific duas for each round. Make any du\'a from your heart.' },
  { icon: '❌', mistake: 'Leaving Muzdalifah before Fajr (without excuse)', fix: 'Stay until after Fajr. Only elderly/weak may leave after midnight.' },
  { icon: '❌', mistake: 'Not staying in Arafat until sunset', fix: 'You MUST stay until sunset. Leaving early may invalidate your Hajj.' },
  { icon: '❌', mistake: 'Stoning Jamarat before Dhuhr on Days of Tashreeq', fix: 'Stoning on 11th, 12th, 13th must be AFTER Dhuhr (Hanafi/Hanbali).' },
  { icon: '❌', mistake: 'Skipping Tawaf al-Wada\' (Farewell Tawaf)', fix: 'It is Wajib. Skipping it requires a penalty (dam/sacrifice).' },
  { icon: '❌', mistake: 'Wasting time on phone/socializing at Arafat', fix: 'Arafat is THE day of Hajj. Spend every moment in du\'a and dhikr.' },
  { icon: '❌', mistake: 'Not learning the rites before going', fix: 'Study Hajj thoroughly. Ignorance leads to mistakes that may require penalties.' },
];

const EMERGENCY_INFO = [
  { label: 'Saudi Emergency', number: '911', icon: '🚨' },
  { label: 'Ambulance', number: '997', icon: '🚑' },
  { label: 'Civil Defense', number: '998', icon: '🚒' },
  { label: 'Traffic Police', number: '993', icon: '🚔' },
  { label: 'Hajj Ministry Helpline', number: '920002814', icon: '🕋' },
  { label: 'Lost Pilgrims', number: '0125366333', icon: '🔍' },
];

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'checklist', label: 'Checklist', icon: '✅' },
  { id: 'packing', label: 'Packing', icon: '🎒' },
  { id: 'duas', label: 'Duas', icon: '🤲' },
  { id: 'restrictions', label: 'Ihram', icon: '🤍' },
  { id: 'mistakes', label: 'Mistakes', icon: '⚠️' },
  { id: 'emergency', label: 'Emergency', icon: '🚨' },
];

export default function HajjChecklist() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('checklist');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('hajj-checklist-v3');
      if (saved) setCheckedItems(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (mounted) {
      try { localStorage.setItem('hajj-checklist-v3', JSON.stringify(checkedItems)); } catch {}
    }
  }, [checkedItems, mounted]);

  const toggleItem = (id: string) => setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleSection = (id: string) => setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));

  const resetProgress = () => {
    if (window.confirm('Reset all your Hajj checklist progress? This cannot be undone.')) {
      setCheckedItems({});
    }
  };

  const allSections = activeTab === 'packing' ? PACKING_LIST : HAJJ_SECTIONS;
  const totalItems = allSections.reduce((sum, sec) => sum + sec.items.length, 0);
  const completedItems = allSections.reduce((sum, sec) => sum + sec.items.filter(item => checkedItems[item.id]).length, 0);
  const progressPercent = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 via-white to-stone-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-stone-900 via-emerald-900 to-stone-900 text-white px-5 py-4 shadow-xl sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">← Home</Link>
          <h1 className="text-lg font-bold">🕋 Hajj Guide & Checklist</h1>
          <button onClick={resetProgress} className="text-white/40 hover:text-red-300 text-xs transition-colors" title="Reset progress">🔄</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-[56px] z-10 overflow-x-auto shadow-sm">
        <div className="max-w-3xl mx-auto flex px-3 py-2 gap-1 min-w-max">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-emerald-800 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-5 pb-12 space-y-5">

        {/* CHECKLIST & PACKING TABS */}
        {(activeTab === 'checklist' || activeTab === 'packing') && (
          <>
            {/* Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-5">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" className="dark:stroke-gray-700" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="url(#hgrad)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressPercent / 100)}`}
                    className="transition-all duration-700" />
                  <defs><linearGradient id="hgrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#059669" /><stop offset="100%" stopColor="#c8a96e" /></linearGradient></defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-emerald-800 dark:text-emerald-400">{progressPercent}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{completedItems} of {totalItems} tasks</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {activeTab === 'checklist' ? 'Hajj Rites Progress' : 'Packing Progress'}
                </p>
                {progressPercent === 100 && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">✅ All done! May Allah accept your Hajj.</p>}
              </div>
            </div>

            {/* Sections */}
            {allSections.map(section => {
              const sectionCompleted = section.items.filter(item => checkedItems[item.id]).length;
              const sectionTotal = section.items.length;
              const isCollapsed = collapsedSections[section.id];
              const isDone = sectionCompleted === sectionTotal;
              return (
                <div key={section.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <button onClick={() => toggleSection(section.id)}
                    className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    style={{ backgroundColor: isDone ? '#f0fdf4' : `${section.color}08` }}>
                    <span className="text-xl">{section.icon}</span>
                    <div className="flex-1 text-left">
                      <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm">{section.title}</h2>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">{sectionCompleted}/{sectionTotal} completed</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDone && <span className="text-emerald-600 text-sm">✅</span>}
                      <span className="text-gray-400 text-xs">{isCollapsed ? '▼' : '▲'}</span>
                    </div>
                  </button>
                  {!isCollapsed && (
                    <div className="divide-y divide-gray-50 dark:divide-gray-700">
                      {section.items.map(item => {
                        const done = !!checkedItems[item.id];
                        return (
                          <label key={item.id} className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${done ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                            <input type="checkbox" checked={done} onChange={() => toggleItem(item.id)}
                              className="w-5 h-5 rounded accent-emerald-800 cursor-pointer mt-0.5 flex-shrink-0" />
                            <span className="text-base flex-shrink-0">{item.icon}</span>
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm leading-relaxed transition-all ${done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                                {item.text}
                              </span>
                              {item.detail && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{item.detail}</p>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* DUAS TAB */}
        {activeTab === 'duas' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-900 to-teal-800 text-white rounded-2xl p-5 text-center shadow-lg">
              <p className="text-xl mb-1" style={{ fontFamily: "'Amiri', serif" }}>أَدْعِيَةُ الْحَجِّ</p>
              <p className="text-white/60 text-xs">Essential Duas for Every Stage of Hajj</p>
            </div>
            {HAJJ_DUAS.map((dua, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-3 border border-amber-100 dark:border-amber-800">
                  <p className="text-lg text-right leading-loose text-gray-800 dark:text-gray-100" style={{ fontFamily: "'Amiri', serif" }} dir="rtl">{dua.arabic}</p>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{dua.meaning}</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">📍 {dua.when}</p>
              </div>
            ))}
          </div>
        )}

        {/* IHRAM RESTRICTIONS TAB */}
        {activeTab === 'restrictions' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-2">🤍 Ihram Restrictions</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">These actions are prohibited while in the state of Ihram. Violating them may require Fidyah (penalty).</p>
              <div className="space-y-3">
                {IHRAM_RESTRICTIONS.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800">
                    <span className="text-xl">{r.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{r.text}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.applies === 'Both' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : r.applies === 'Men only' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300'}`}>
                      {r.applies}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
              <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                <strong>What IS allowed in Ihram:</strong> Wearing a watch, glasses, hearing aid, using unscented soap, carrying bags, using an umbrella for shade, wearing a belt/money pouch, and bathing without rubbing hair off.
              </p>
            </div>
          </div>
        )}

        {/* MISTAKES TAB */}
        {activeTab === 'mistakes' && (
          <div className="space-y-3">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-2">
              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">⚠️ Avoid these common mistakes that many pilgrims make. Some can invalidate your Hajj or require a penalty.</p>
            </div>
            {COMMON_MISTAKES.map((m, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">{m.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">{m.mistake}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">✅ <strong>Correct:</strong> {m.fix}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMERGENCY TAB */}
        {activeTab === 'emergency' && (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5">
              <h2 className="font-bold text-red-800 dark:text-red-300 text-lg mb-3">🚨 Emergency Numbers (Saudi Arabia)</h2>
              <div className="space-y-2">
                {EMERGENCY_INFO.map((e, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-800">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{e.icon}</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{e.label}</span>
                    </div>
                    <a href={`tel:${e.number}`} className="text-sm font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-lg">{e.number}</a>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3">💡 Safety Tips</h3>
              <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                <li>• Keep your passport and ID in a waterproof pouch at all times</li>
                <li>• Memorize your hotel name and address in Arabic</li>
                <li>• Wear your group's identification bracelet/badge</li>
                <li>• Agree on a meeting point with your group in case of separation</li>
                <li>• Stay hydrated — drink water every 30 minutes in the heat</li>
                <li>• If lost, go to the nearest police/civil defense point</li>
                <li>• Save your embassy's number in your phone</li>
                <li>• Avoid carrying large amounts of cash</li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">Progress saved automatically · May Allah accept your Hajj Mabrur 🤍</p>
        </div>
      </main>
    </div>
  );
}
