export const metadata = {
  title: 'Kaffarah Calculator — Expiation for Broken Oaths | I Love Islam',
  description: 'Calculate kaffarah for broken oaths, fasts and zihar. Based on Quran and Sunnah. Free Islamic expiation calculator.',
}

'use client';
import { useState } from 'react';
import Link from 'next/link';

const CURRENCIES = ['USD $', 'GBP £', 'EUR €', 'AUD $', 'PKR ₨', 'SAR ﷼', 'AED د.إ'];

const KAFFARAH_TYPES = [
  {
    id: 'oath',
    label: 'Broken Oath',
    arabic: 'كفارة اليمين',
    icon: '🤝',
    description: 'Breaking a sworn oath (Yamin)',
    ayah: 'So its expiation is the feeding of ten needy people...',
    source: 'Quran 5:89',
    steps: [
      { order: 1, label: 'Feed 10 poor people', detail: 'One meal each, or give equivalent food/money', type: 'feed', count: 10 },
      { order: 2, label: 'Clothe 10 poor people', detail: 'Minimum one garment each to cover in prayer', type: 'clothe', count: 10 },
      { order: 3, label: 'Free a slave', detail: 'Not applicable in modern times', type: 'slave', count: 1 },
      { order: 4, label: 'Fast 3 days', detail: 'Only if unable to do any of the above', type: 'fast', count: 3 },
    ],
  },
  {
    id: 'zihar',
    label: 'Zihar',
    arabic: 'كفارة الظهار',
    icon: '💔',
    description: 'Comparing wife to mother\'s back (Zihar)',
    ayah: 'Then the expiation is the freeing of a slave before they touch one another...',
    source: 'Quran 58:3-4',
    steps: [
      { order: 1, label: 'Free a slave', detail: 'Not applicable in modern times — proceed to next', type: 'slave', count: 1 },
      { order: 2, label: 'Fast 60 consecutive days', detail: 'Must be uninterrupted — if broken, must restart', type: 'fast', count: 60 },
      { order: 3, label: 'Feed 60 poor people', detail: 'If unable to fast due to illness or old age', type: 'feed', count: 60 },
    ],
  },
  {
    id: 'murder',
    label: 'Accidental Killing',
    arabic: 'كفارة القتل',
    icon: '⚖️',
    description: 'Unintentional (accidental) killing of a Muslim',
    ayah: 'And whoever kills a believer by mistake — then the freeing of a believing slave and a compensation...',
    source: 'Quran 4:92',
    steps: [
      { order: 1, label: 'Free a believing slave', detail: 'Not applicable in modern times — proceed to next', type: 'slave', count: 1 },
      { order: 2, label: 'Fast 2 consecutive months', detail: '60 consecutive days — if broken must restart', type: 'fast', count: 60 },
    ],
    note: 'Diyah (blood money) must also be paid to the family separately. Consult a scholar.',
  },
  {
    id: 'ramadan',
    label: 'Broken Ramadan Fast',
    arabic: 'كفارة الإفطار',
    icon: '🌙',
    description: 'Intentionally breaking a Ramadan fast (by intercourse)',
    ayah: 'He must free a slave; if he cannot, he must fast for two months consecutively...',
    source: 'Hadith — Bukhari & Muslim',
    steps: [
      { order: 1, label: 'Free a slave', detail: 'Not applicable in modern times — proceed to next', type: 'slave', count: 1 },
      { order: 2, label: 'Fast 60 consecutive days', detail: 'Must be uninterrupted — does not include Eid days', type: 'fast', count: 60 },
      { order: 3, label: 'Feed 60 poor people', detail: 'If genuinely unable to fast', type: 'feed', count: 60 },
    ],
    note: 'This kaffarah applies specifically to breaking the fast through intercourse. Eating/drinking intentionally requires making up the day (Qada) only.',
  },
];

const MEAL_COSTS = {
  'USD $': 5,
  'GBP £': 4,
  'EUR €': 4.5,
  'AUD $': 7,
  'PKR ₨': 300,
  'SAR ﷼': 18,
  'AED د.إ': 18,
};

const CLOTH_COSTS = {
  'USD $': 15,
  'GBP £': 12,
  'EUR €': 13,
  'AUD $': 20,
  'PKR ₨': 800,
  'SAR ﷼': 55,
  'AED د.إ': 55,
};

export default function KaffarahCalculator() {
  const [selected, setSelected] = useState(null);
  const [currency, setCurrency] = useState('USD $');
  const [mealCost, setMealCost] = useState('');
  const [clothCost, setClothCost] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showResult, setShowResult] = useState(false);

  const sym = currency.split(' ')[1] || '$';
  const defaultMeal = MEAL_COSTS[currency] || 5;
  const defaultCloth = CLOTH_COSTS[currency] || 15;
  const meal = parseFloat(mealCost) || defaultMeal;
  const cloth = parseFloat(clothCost) || defaultCloth;

  function selectType(type) {
    setSelected(type);
    setMealCost('');
    setClothCost('');
    setQuantity(1);
    setShowResult(false);
  }

  function getMonetaryOption(step) {
    if (step.type === 'feed') return meal * step.count * quantity;
    if (step.type === 'clothe') return cloth * step.count * quantity;
    return null;
  }

  const TYPE_ICONS = { feed: '🍱', clothe: '👕', slave: '🚫', fast: '🌙' };
  const TYPE_COLORS = { feed: '#f0faf5', clothe: '#f0f4ff', slave: '#fff5f5', fast: '#fffbf0' };
  const TYPE_TEXT = { feed: '#0a3d2e', clothe: '#1a3a6b', slave: '#6b1a1a', fast: '#6b4a0a' };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #1a6b4a 100%)' }} className="px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {selected ? (
            <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white text-sm">← Back</button>
          ) : (
            <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
          )}
          <h1 className="text-white font-semibold">🕊️ Kaffarah Calculator</h1>
          <select value={currency} onChange={e => { setCurrency(e.target.value); setMealCost(''); setClothCost(''); }}
            className="bg-white/20 text-white text-xs rounded-lg px-2 py-1 border-0 outline-none">
            {CURRENCIES.map(c => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}
          </select>
        </div>
        {!selected && <p className="text-white/50 text-xs text-center mt-2">Select the type of kaffarah to calculate</p>}
        {selected && (
          <div className="max-w-2xl mx-auto mt-3 text-center">
            <p className="font-arabic text-2xl text-white/80">{selected.arabic}</p>
            <p className="text-white/60 text-sm mt-1">{selected.description}</p>
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 pb-10 space-y-4">

        {/* TYPE SELECTION */}
        {!selected && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Kaffarah (كفارة) is an expiation — an act of worship performed to atone for specific sins or violations. 
                Select the type below to see the steps and calculate the monetary equivalent if applicable.
              </p>
            </div>

            <div className="space-y-3">
              {KAFFARAH_TYPES.map(type => (
                <button key={type.id} onClick={() => selectType(type)}
                  className="w-full bg-white rounded-2xl border border-gray-100 p-5 text-left hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: '#f0faf5' }}>
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{type.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{type.description}</p>
                    <p className="font-arabic text-sm text-gray-500 mt-1">{type.arabic}</p>
                  </div>
                  <span className="text-gray-300 text-xl">›</span>
                </button>
              ))}
            </div>

            {/* General info */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-medium text-amber-800 mb-2">📚 About Kaffarah</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Kaffarah must be performed with sincere repentance (Tawbah). The steps are in order — 
                you must be genuinely unable to perform a step before moving to the next. 
                Always consult a qualified scholar for your specific situation.
              </p>
            </div>
          </>
        )}

        {/* DETAIL VIEW */}
        {selected && (
          <>
            {/* Quran/Hadith reference */}
            <div style={{ background: 'linear-gradient(135deg, #0a3d2e, #1a5c3a)' }} className="rounded-2xl p-5">
              <p className="text-white/50 text-xs mb-2">Daleel (Evidence)</p>
              <p className="text-white/90 text-sm leading-relaxed italic">"{selected.ayah}..."</p>
              <p className="text-white/40 text-xs mt-2">{selected.source}</p>
            </div>

            {/* Warning note if any */}
            {selected.note && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-xs font-medium text-amber-800 mb-1">⚠️ Important Note</p>
                <p className="text-xs text-amber-700 leading-relaxed">{selected.note}</p>
              </div>
            )}

            {/* Steps */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-50">
                <p className="font-semibold text-gray-800">Steps of Kaffarah</p>
                <p className="text-xs text-gray-400">Perform in order — only move to next if genuinely unable</p>
              </div>
              <div className="divide-y divide-gray-50">
                {selected.steps.map((step, i) => {
                  const monetary = getMonetaryOption(step);
                  const isSlaveStep = step.type === 'slave';
                  return (
                    <div key={i} className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                          style={{ background: isSlaveStep ? '#ccc' : '#0a3d2e' }}>
                          {step.order}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg">{TYPE_ICONS[step.type]}</span>
                            <p className={`font-medium text-sm ${isSlaveStep ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                              {step.label}
                            </p>
                            {isSlaveStep && (
                              <span className="text-xs bg-gray-100 text-gray-400 rounded-full px-2 py-0.5">N/A today</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 ml-7">{step.detail}</p>

                          {/* Monetary equivalent */}
                          {monetary !== null && !isSlaveStep && (
                            <div className="mt-3 ml-7 rounded-xl p-3"
                              style={{ background: TYPE_COLORS[step.type] }}>
                              <p className="text-xs font-medium mb-1" style={{ color: TYPE_TEXT[step.type] }}>
                                💰 Monetary Equivalent
                              </p>
                              <p className="text-lg font-bold" style={{ color: TYPE_TEXT[step.type] }}>
                                {sym}{monetary.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: TYPE_TEXT[step.type], opacity: 0.7 }}>
                                {step.count} × {step.type === 'feed' ? `${sym}${meal} per meal` : `${sym}${cloth} per garment`}
                                {quantity > 1 ? ` × ${quantity} occurrences` : ''}
                              </p>
                            </div>
                          )}

                          {step.type === 'fast' && !isSlaveStep && (
                            <div className="mt-3 ml-7 bg-amber-50 rounded-xl p-3">
                              <p className="text-xs font-medium text-amber-800 mb-1">🌙 Fasting Requirement</p>
                              <p className="text-lg font-bold text-amber-700">{step.count * quantity} days</p>
                              {step.count >= 60 && (
                                <p className="text-xs text-amber-600 mt-0.5">Must be consecutive — if interrupted, must restart</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calculator inputs */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <p className="font-semibold text-gray-800">Customize Calculation</p>

              {selected.steps.some(s => s.type === 'feed') && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Cost per meal in your area ({sym})</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{sym}</span>
                    <input type="number" value={mealCost}
                      onChange={e => setMealCost(e.target.value)}
                      placeholder={`Default: ${sym}${defaultMeal}`}
                      className="w-full border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-gray-300 bg-gray-50" />
                  </div>
                </div>
              )}

              {selected.steps.some(s => s.type === 'clothe') && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Cost per garment in your area ({sym})</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{sym}</span>
                    <input type="number" value={clothCost}
                      onChange={e => setClothCost(e.target.value)}
                      placeholder={`Default: ${sym}${defaultCloth}`}
                      className="w-full border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-gray-300 bg-gray-50" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Number of occurrences</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-full border border-gray-200 text-gray-500 font-bold flex items-center justify-center hover:bg-gray-50 text-lg">−</button>
                  <span className="text-xl font-bold text-gray-800 w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 rounded-full text-white font-bold flex items-center justify-center text-lg"
                    style={{ background: '#0a3d2e' }}>+</button>
                  <span className="text-xs text-gray-400 ml-2">
                    {quantity > 1 ? `${quantity} kaffarahs to pay` : 'Single kaffarah'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tawbah reminder */}
            <div style={{ background: 'linear-gradient(135deg, #0a3d2e, #1a5c3a)' }} className="rounded-2xl p-5 text-center">
              <p className="font-arabic text-2xl text-white/80 mb-2">التَّوْبَةُ</p>
              <p className="text-white font-medium text-sm mb-1">Remember: Tawbah (Repentance) is essential</p>
              <p className="text-white/60 text-xs leading-relaxed">
                Kaffarah without sincere repentance is incomplete. 
                Feel remorse, resolve not to repeat, and ask Allah for forgiveness.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-medium text-amber-800 mb-1">⚠️ Disclaimer</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                This is a general guide based on majority Sunni fiqh. Scholarly opinions may vary. 
                Please consult a qualified Islamic scholar for your specific case.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}