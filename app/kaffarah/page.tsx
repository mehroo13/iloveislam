'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

// ─── Currencies ───────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'USD', sym: '$', meal: 5, cloth: 15 },
  { code: 'GBP', sym: '£', meal: 4, cloth: 12 },
  { code: 'EUR', sym: '€', meal: 4.5, cloth: 13 },
  { code: 'AUD', sym: 'A$', meal: 7, cloth: 20 },
  { code: 'CAD', sym: 'C$', meal: 6, cloth: 18 },
  { code: 'PKR', sym: '₨', meal: 300, cloth: 800 },
  { code: 'SAR', sym: '﷼', meal: 18, cloth: 55 },
  { code: 'AED', sym: 'د.إ', meal: 18, cloth: 55 },
  { code: 'MYR', sym: 'RM', meal: 10, cloth: 30 },
  { code: 'INR', sym: '₹', meal: 100, cloth: 300 },
  { code: 'BDT', sym: '৳', meal: 150, cloth: 500 },
  { code: 'TRY', sym: '₺', meal: 50, cloth: 150 },
];

// ─── Kaffarah Types ───────────────────────────────────────────────────────────
interface KaffarahStep {
  order: number;
  label: string;
  detail: string;
  type: 'feed' | 'clothe' | 'slave' | 'fast' | 'free_choice';
  count: number;
  consecutive?: boolean;
}

interface KaffarahType {
  id: string;
  label: string;
  arabic: string;
  icon: string;
  description: string;
  ayah: string;
  source: string;
  steps: KaffarahStep[];
  note?: string;
  category: 'kaffarah' | 'fidyah';
}

const KAFFARAH_TYPES: KaffarahType[] = [
  {
    id: 'oath', label: 'Broken Oath (Yamin)', arabic: 'كفارة اليمين', icon: '🤝',
    description: 'Breaking a sworn oath made in the name of Allah',
    ayah: 'So its expiation is the feeding of ten needy people from the average of that which you feed your families, or clothing them, or the freeing of a slave. But whoever cannot find — then a fast of three days.',
    source: 'Quran 5:89', category: 'kaffarah',
    steps: [
      { order: 1, label: 'Feed 10 poor people', detail: 'One average meal each (or give equivalent in food/money)', type: 'feed', count: 10 },
      { order: 2, label: 'OR Clothe 10 poor people', detail: 'One garment each sufficient to cover in prayer', type: 'clothe', count: 10 },
      { order: 3, label: 'OR Free a slave', detail: 'Not applicable in modern times', type: 'slave', count: 1 },
      { order: 4, label: 'Fast 3 days', detail: 'Only if genuinely unable to do any of the above (poverty)', type: 'fast', count: 3 },
    ],
    note: 'For broken oaths, the first three options are interchangeable (you choose one). Fasting is only if you cannot afford any of them.',
  },
  {
    id: 'ramadan', label: 'Broken Ramadan Fast', arabic: 'كفارة الإفطار', icon: '🌙',
    description: 'Intentionally breaking a Ramadan fast through intercourse',
    ayah: 'A man came to the Prophet ﷺ and said: "I am ruined!" He said: "Free a slave. If you cannot, fast two months consecutively. If you cannot, feed sixty poor people."',
    source: 'Hadith — Bukhari & Muslim', category: 'kaffarah',
    steps: [
      { order: 1, label: 'Free a slave', detail: 'Not applicable today — proceed to next', type: 'slave', count: 1 },
      { order: 2, label: 'Fast 60 consecutive days', detail: 'Must be uninterrupted (excluding Eid days). If broken, restart.', type: 'fast', count: 60, consecutive: true },
      { order: 3, label: 'Feed 60 poor people', detail: 'If genuinely unable to fast (illness, old age)', type: 'feed', count: 60 },
    ],
    note: 'This applies to breaking fast through intercourse. Eating/drinking intentionally requires Qada (making up the day) only — not kaffarah (Hanafi: kaffarah also applies for intentional eating).',
  },
  {
    id: 'zihar', label: 'Zihar', arabic: 'كفارة الظهار', icon: '💔',
    description: 'Comparing wife to a mahram (e.g. "You are like my mother\'s back")',
    ayah: 'Those who pronounce zihar and then wish to go back on what they said — then the freeing of a slave before they touch one another. And he who does not find — then fasting for two months consecutively. And he who is unable — then the feeding of sixty poor persons.',
    source: 'Quran 58:3-4', category: 'kaffarah',
    steps: [
      { order: 1, label: 'Free a slave', detail: 'Not applicable today — proceed to next', type: 'slave', count: 1 },
      { order: 2, label: 'Fast 60 consecutive days', detail: 'Must be completed before resuming marital relations', type: 'fast', count: 60, consecutive: true },
      { order: 3, label: 'Feed 60 poor people', detail: 'If unable to fast due to illness or old age', type: 'feed', count: 60 },
    ],
  },
  {
    id: 'murder', label: 'Accidental Killing', arabic: 'كفارة القتل الخطأ', icon: '⚖️',
    description: 'Unintentional killing of a person (e.g. car accident)',
    ayah: 'And whoever kills a believer by mistake — then the freeing of a believing slave and a compensation (diyah) delivered to his family... And whoever does not find — then fasting for two months consecutively.',
    source: 'Quran 4:92', category: 'kaffarah',
    steps: [
      { order: 1, label: 'Free a believing slave', detail: 'Not applicable today — proceed to next', type: 'slave', count: 1 },
      { order: 2, label: 'Fast 2 consecutive months (60 days)', detail: 'If interrupted, must restart from the beginning', type: 'fast', count: 60, consecutive: true },
    ],
    note: 'Diyah (blood money) must ALSO be paid to the victim\'s family separately. This is in addition to kaffarah. Consult a scholar and lawyer.',
  },
  {
    id: 'fidyah_fast', label: 'Fidyah — Missed Fasts', arabic: 'فدية الصيام', icon: '🍽️',
    description: 'For those permanently unable to fast (elderly, chronic illness)',
    ayah: 'And upon those who are able [to fast, but with hardship] — a ransom of feeding a poor person [each day].',
    source: 'Quran 2:184', category: 'fidyah',
    steps: [
      { order: 1, label: 'Feed 1 poor person per missed day', detail: 'One average meal per day missed (or monetary equivalent)', type: 'feed', count: 1 },
    ],
    note: 'Fidyah applies to those who CANNOT fast at all (permanent illness, extreme old age). If you can make up fasts later, you should do Qada instead.',
  },
  {
    id: 'fidyah_hajj', label: 'Fidyah — Hajj Violations', arabic: 'فدية الحج', icon: '🕋',
    description: 'Violating ihram restrictions during Hajj/Umrah',
    ayah: 'And whoever among you is ill or has an ailment of the head — then a ransom of fasting or charity or sacrifice.',
    source: 'Quran 2:196', category: 'fidyah',
    steps: [
      { order: 1, label: 'Fast 3 days', detail: 'For minor violations (cutting hair, wearing perfume, etc.)', type: 'fast', count: 3 },
      { order: 2, label: 'OR Feed 6 poor people', detail: 'Alternative to fasting', type: 'feed', count: 6 },
      { order: 3, label: 'OR Sacrifice a sheep', detail: 'Slaughter and distribute to the poor', type: 'free_choice', count: 1 },
    ],
    note: 'The type of fidyah depends on the specific violation. Major violations (intercourse before standing at Arafat) require a camel. Consult a scholar.',
  },
  {
    id: 'vow', label: 'Unfulfilled Vow (Nadhr)', arabic: 'كفارة النذر', icon: '📿',
    description: 'Breaking a vow made to Allah that you cannot fulfill',
    ayah: 'The Prophet ﷺ said: "The kaffarah of a vow is the kaffarah of an oath."',
    source: 'Hadith — Muslim', category: 'kaffarah',
    steps: [
      { order: 1, label: 'Feed 10 poor people', detail: 'Same as broken oath kaffarah', type: 'feed', count: 10 },
      { order: 2, label: 'OR Clothe 10 poor people', detail: 'One garment each', type: 'clothe', count: 10 },
      { order: 3, label: 'OR Free a slave', detail: 'Not applicable today', type: 'slave', count: 1 },
      { order: 4, label: 'Fast 3 days', detail: 'If unable to afford the above', type: 'fast', count: 3 },
    ],
    note: 'If you made a vow to do something good (e.g. pray extra, give charity) and CAN fulfill it, you must fulfill it. Kaffarah is only for vows you genuinely cannot keep.',
  },
];

const FAQ = [
  { q: 'What is the difference between Kaffarah and Fidyah?', a: 'Kaffarah is expiation for a sin (breaking oath, intentionally breaking fast). Fidyah is compensation for inability to perform an obligation (too old to fast). Kaffarah is heavier.' },
  { q: 'Can I pay Kaffarah in money instead of food?', a: 'Hanafi scholars allow paying the monetary equivalent. Shafi\'i and Hanbali scholars prefer actual food distribution. Both are valid — choose based on what benefits the poor more.' },
  { q: 'Do I need to feed 10 different people or can I feed one person 10 times?', a: 'The majority view is 10 different people. However, some Hanafi scholars allow feeding one person over 10 days.' },
  { q: 'What if I break my 60-day consecutive fast?', a: 'You must restart from day 1. Exceptions: menstruation (women continue after), Eid days (skip and continue), genuine illness (some scholars allow continuing).' },
  { q: 'Does Kaffarah expire?', a: 'No. Kaffarah remains an obligation until fulfilled. It does not expire with time and should be paid as soon as possible.' },
  { q: 'Can I give Kaffarah to family members?', a: 'You cannot give it to those you are already obligated to support (spouse, children, parents). You can give to other relatives who are poor.' },
];

export default function KaffarahCalculator() {
  const [selected, setSelected] = useState<KaffarahType | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [mealCost, setMealCost] = useState('');
  const [clothCost, setClothCost] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [missedDays, setMissedDays] = useState(30); // for fidyah
  const [showFaq, setShowFaq] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'kaffarah' | 'fidyah'>('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const curr = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  const sym = curr.sym;
  const defaultMeal = curr.meal;
  const defaultCloth = curr.cloth;
  const meal = parseFloat(mealCost) || defaultMeal;
  const cloth = parseFloat(clothCost) || defaultCloth;

  const selectType = (type: KaffarahType) => {
    setSelected(type); setMealCost(''); setClothCost(''); setQuantity(1); setMissedDays(30);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredTypes = filterCategory === 'all' ? KAFFARAH_TYPES : KAFFARAH_TYPES.filter(t => t.category === filterCategory);

  // Calculate costs for each step
  const stepCosts = useMemo(() => {
    if (!selected) return [];
    return selected.steps.map(step => {
      const count = selected.id === 'fidyah_fast' ? missedDays : step.count * quantity;
      if (step.type === 'feed') return { ...step, cost: meal * count, count };
      if (step.type === 'clothe') return { ...step, cost: cloth * count, count };
      if (step.type === 'fast') return { ...step, cost: 0, count: step.count * quantity };
      return { ...step, cost: 0, count };
    });
  }, [selected, meal, cloth, quantity, missedDays]);

  // Total monetary (first applicable monetary option)
  const primaryCost = useMemo(() => {
    const feedStep = stepCosts.find(s => s.type === 'feed' && s.cost > 0);
    return feedStep?.cost || 0;
  }, [stepCosts]);

  const fastingDays = useMemo(() => {
    const fastStep = stepCosts.find(s => s.type === 'fast');
    return fastStep?.count || 0;
  }, [stepCosts]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 via-white to-stone-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans">
      <header className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white px-5 py-4 shadow-xl sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {selected ? (
            <button onClick={() => { setSelected(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-white/60 hover:text-white text-sm transition-colors">← Back</button>
          ) : (
            <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">← Home</Link>
          )}
          <h1 className="text-lg font-bold">🕊️ Kaffarah & Fidyah Calculator</h1>
          <button onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
            className="bg-white/15 text-white text-xs rounded-full px-3 py-1.5 border border-white/20 hover:bg-white/25 transition-all">
            {sym} {currency}
          </button>
        </div>
        {/* Currency picker dropdown */}
        {showCurrencyPicker && (
          <div className="max-w-3xl mx-auto mt-2 relative">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 grid grid-cols-3 sm:grid-cols-4 gap-1 animate-slideDown">
              {CURRENCIES.map(c => (
                <button key={c.code} onClick={() => { setCurrency(c.code); setShowCurrencyPicker(false); setMealCost(''); setClothCost(''); }}
                  className={`px-2 py-2.5 rounded-lg text-xs font-medium transition-all ${currency === c.code ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  {c.sym} {c.code}
                </button>
              ))}
            </div>
          </div>
        )}
        {selected && (
          <div className="max-w-3xl mx-auto mt-3 text-center">
            <p className="text-xl text-white/80" style={{ fontFamily: "'Amiri', serif" }}>{selected.arabic}</p>
            <p className="text-white/50 text-xs mt-1">{selected.description}</p>
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-12 space-y-5">
        {/* TYPE SELECTION */}
        {!selected && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 text-center">
              <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-400 mb-2">Calculate Your Kaffarah or Fidyah</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Select the type of expiation to see the required steps, Quranic evidence, and monetary equivalent.
              </p>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 justify-center">
              {[
                { id: 'all' as const, label: 'All' },
                { id: 'kaffarah' as const, label: '⚖️ Kaffarah' },
                { id: 'fidyah' as const, label: '🍽️ Fidyah' },
              ].map(f => (
                <button key={f.id} onClick={() => setFilterCategory(f.id)}
                  className={`text-xs px-4 py-2 rounded-full font-medium transition-all ${filterCategory === f.id ? 'bg-emerald-800 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTypes.map(type => (
                <button key={type.id} onClick={() => selectType(type)}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 text-left hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md transition-all group active:scale-[0.98]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{type.icon}</span>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 text-sm">{type.label}</p>
                      <p className="text-[10px] text-gray-400" style={{ fontFamily: "'Amiri', serif" }}>{type.arabic}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{type.description}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full ${type.category === 'kaffarah' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
                      {type.category === 'kaffarah' ? '⚖️ Kaffarah' : '🍽️ Fidyah'}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* FAQ */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <button onClick={() => setShowFaq(!showFaq)} className="w-full flex items-center justify-between">
                <h3 className="font-bold text-gray-800 dark:text-gray-100">❓ Frequently Asked Questions</h3>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">{showFaq ? 'Hide' : 'Show'}</span>
              </button>
              {showFaq && (
                <div className="mt-4 space-y-2">
                  {FAQ.map((faq, i) => (
                    <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                      <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 pr-4">{faq.q}</span>
                        <span className="text-gray-400 text-xs flex-shrink-0">{expandedFaq === i ? '▲' : '▼'}</span>
                      </button>
                      {expandedFaq === i && (
                        <div className="px-4 pb-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-gray-700 pt-2">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* What is Kaffarah */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
              <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm mb-2">📚 What is Kaffarah?</h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed mb-2">
                <strong>Kaffarah</strong> (كفارة) is an expiation — a prescribed act of worship to atone for specific sins. It must be accompanied by sincere repentance (Tawbah).
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                <strong>Fidyah</strong> (فدية) is compensation paid when someone is permanently unable to fulfill a religious obligation (like fasting). It is not a punishment but a substitute.
              </p>
            </div>
          </>
        )}

        {/* DETAIL VIEW */}
        {selected && (
          <>
            {/* Daleel */}
            <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-xl">
              <p className="text-white/50 text-[10px] mb-2 font-semibold uppercase tracking-wider">📖 Daleel (Evidence)</p>
              <p className="text-white/90 text-sm leading-relaxed italic mb-3">"{selected.ayah}"</p>
              <p className="text-white/40 text-xs">— {selected.source}</p>
            </div>

            {selected.note && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">⚠️ Important Note</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">{selected.note}</p>
              </div>
            )}

            {/* Summary Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-4">📋 Summary</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selected.id === 'fidyah_fast' ? (
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-4 text-center col-span-2 sm:col-span-1">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mb-1 uppercase">Missed Days</p>
                    <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">{missedDays}</p>
                  </div>
                ) : (
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mb-1 uppercase">Occurrences</p>
                    <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">{quantity}</p>
                  </div>
                )}
                {primaryCost > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 mb-1 uppercase">Feed Option</p>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{sym}{primaryCost.toLocaleString()}</p>
                  </div>
                )}
                {stepCosts.some(s => s.type === 'clothe') && (
                  <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 mb-1 uppercase">Clothe Option</p>
                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{sym}{(cloth * 10 * quantity).toLocaleString()}</p>
                  </div>
                )}
                {fastingDays > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mb-1 uppercase">Fast Option</p>
                    <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">{fastingDays} days</p>
                    {stepCosts.find(s => s.type === 'fast')?.consecutive && (
                      <p className="text-[9px] text-amber-500 mt-0.5">consecutive</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Steps (in order of priority)</h2>
              {stepCosts.map((step, i) => {
                const isSlaveStep = step.type === 'slave';
                const isOr = step.label.startsWith('OR ');
                const colors: Record<string, { bg: string; text: string; border: string }> = {
                  feed: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
                  clothe: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
                  fast: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
                  slave: { bg: 'bg-gray-50 dark:bg-gray-700/50', text: 'text-gray-400', border: 'border-gray-200 dark:border-gray-600' },
                  free_choice: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
                };
                const c = colors[step.type] || colors.feed;

                return (
                  <div key={i} className={`rounded-2xl border p-4 transition-all ${c.border} ${isSlaveStep ? 'opacity-50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isSlaveStep ? 'bg-gray-200 dark:bg-gray-600 text-gray-400' : 'bg-emerald-800 text-white'}`}>
                        {step.order}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-semibold text-sm ${isSlaveStep ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-100'}`}>
                            {step.label}
                          </h3>
                          {isSlaveStep && <span className="text-[9px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">N/A today</span>}
                          {isOr && !isSlaveStep && <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">Alternative</span>}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{step.detail}</p>

                        {step.cost > 0 && !isSlaveStep && (
                          <div className={`mt-3 ${c.bg} rounded-xl p-3 border ${c.border}`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-medium ${c.text}`}>💰 Monetary Equivalent</span>
                              <span className={`text-lg font-bold ${c.text}`}>{sym}{step.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <p className={`text-[10px] mt-1 opacity-70 ${c.text}`}>
                              {step.count} × {sym}{step.type === 'feed' ? meal : cloth} per {step.type === 'feed' ? 'meal' : 'garment'}
                            </p>
                          </div>
                        )}

                        {step.type === 'fast' && !isSlaveStep && (
                          <div className={`mt-3 ${c.bg} rounded-xl p-3 border ${c.border}`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-medium ${c.text}`}>🌙 Fasting Required</span>
                              <span className={`text-lg font-bold ${c.text}`}>{step.count} days</span>
                            </div>
                            {(step as any).consecutive && <p className={`text-[10px] mt-1 ${c.text} opacity-70`}>Must be consecutive — if broken, restart</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Customization */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base mb-4">⚙️ Customize Calculation</h2>

              {selected.id === 'fidyah_fast' && (
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wide">Number of missed fasting days</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setMissedDays(d => Math.max(1, d - 1))} className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-lg active:scale-90">−</button>
                    <input type="number" value={missedDays} onChange={e => setMissedDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center border border-gray-200 dark:border-gray-600 rounded-xl py-2 text-lg font-bold bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                    <button onClick={() => setMissedDays(d => d + 1)} className="w-9 h-9 rounded-full bg-emerald-800 text-white hover:bg-emerald-700 flex items-center justify-center text-lg active:scale-90">+</button>
                    <div className="flex gap-1 ml-2">
                      {[29, 30, 60].map(d => (
                        <button key={d} onClick={() => setMissedDays(d)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${missedDays === d ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selected.id !== 'fidyah_fast' && (
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wide">Number of occurrences</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-lg active:scale-90">−</button>
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-100 w-8 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="w-9 h-9 rounded-full bg-emerald-800 text-white hover:bg-emerald-700 flex items-center justify-center text-lg active:scale-90">+</button>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{quantity > 1 ? `${quantity} kaffarahs` : 'Single'}</span>
                  </div>
                </div>
              )}

              {selected.steps.some(s => s.type === 'feed') && (
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block uppercase tracking-wide">Cost per meal ({sym})</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{sym}</span>
                    <input type="number" value={mealCost} onChange={e => setMealCost(e.target.value)} placeholder={`Default: ${sym}${defaultMeal}`}
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800" />
                  </div>
                </div>
              )}

              {selected.steps.some(s => s.type === 'clothe') && (
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block uppercase tracking-wide">Cost per garment ({sym})</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{sym}</span>
                    <input type="number" value={clothCost} onChange={e => setClothCost(e.target.value)} placeholder={`Default: ${sym}${defaultCloth}`}
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800" />
                  </div>
                </div>
              )}
            </div>

            {/* Tawbah */}
            <div className="bg-gradient-to-br from-emerald-900 to-teal-800 text-white rounded-2xl p-6 text-center shadow-lg">
              <p className="text-2xl mb-2" style={{ fontFamily: "'Amiri', serif" }}>التَّوْبَةُ النَّصُوحُ</p>
              <p className="font-semibold text-base mb-1">Sincere Repentance is Essential</p>
              <p className="text-white/70 text-xs leading-relaxed">
                Kaffarah without Tawbah is incomplete. Feel genuine remorse, resolve never to repeat the sin, and ask Allah for forgiveness.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                <strong>⚠️ Disclaimer:</strong> This is a general guide based on majority Sunni fiqh. Scholarly opinions may vary between madhabs. Please consult a qualified Islamic scholar for your specific situation.
              </p>
            </div>

            <button onClick={() => window.print()}
              className="w-full py-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">
              🖨️ Print / Save as PDF
            </button>
          </>
        )}
      </main>

      <style jsx>{`
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
