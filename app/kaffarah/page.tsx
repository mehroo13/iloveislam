'use client';

import React, { useState, useMemo } from 'react';
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

const MEAL_COSTS: Record<string, number> = {
  'USD $': 5, 'GBP £': 4, 'EUR €': 4.5, 'AUD $': 7, 'PKR ₨': 300, 'SAR ﷼': 18, 'AED د.إ': 18,
};

const CLOTH_COSTS: Record<string, number> = {
  'USD $': 15, 'GBP £': 12, 'EUR €': 13, 'AUD $': 20, 'PKR ₨': 800, 'SAR ﷼': 55, 'AED د.إ': 55,
};

type Step = { order: number; label: string; detail: string; type: string; count: number };
type KaffarahType = typeof KAFFARAH_TYPES[number];

export default function KaffarahCalculator() {
  const [selected, setSelected] = useState<KaffarahType | null>(null);
  const [currency, setCurrency] = useState('USD $');
  const [mealCost, setMealCost] = useState('');
  const [clothCost, setClothCost] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeStep, setActiveStep] = useState(0); // for step-by-step guidance

  const sym = currency.split(' ')[1] || '$';
  const defaultMeal = MEAL_COSTS[currency] || 5;
  const defaultCloth = CLOTH_COSTS[currency] || 15;
  const meal = parseFloat(mealCost) || defaultMeal;
  const cloth = parseFloat(clothCost) || defaultCloth;

  const selectType = (type: KaffarahType) => {
    setSelected(type);
    setMealCost('');
    setClothCost('');
    setQuantity(1);
    setActiveStep(0);
  };

  const handlePrint = () => window.print();

  // Compute total monetary obligation for the selected type
  const monetaryTotal = useMemo(() => {
    if (!selected) return null;
    let total = 0;
    for (const step of selected.steps) {
      if (step.type === 'feed') total += meal * step.count * quantity;
      else if (step.type === 'clothe') total += cloth * step.count * quantity;
    }
    return total;
  }, [selected, meal, cloth, quantity]);

  const fastingDays = useMemo(() => {
    if (!selected) return 0;
    const fastStep = selected.steps.find(s => s.type === 'fast');
    return fastStep ? fastStep.count * quantity : 0;
  }, [selected, quantity]);

  const TYPE_ICONS: Record<string, string> = { feed: '🍱', clothe: '👕', slave: '🚫', fast: '🌙' };
  const TYPE_COLORS: Record<string, string> = { feed: '#f0faf5', clothe: '#f0f4ff', slave: '#fff5f5', fast: '#fffbf0' };
  const TYPE_TEXT: Record<string, string> = { feed: '#0a3d2e', clothe: '#1a3a6b', slave: '#6b1a1a', fast: '#6b4a0a' };

  const cardClass = 'bg-white rounded-2xl shadow-sm border border-gray-100 p-5';

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white font-serif">
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white px-5 py-4 shadow-lg sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {selected ? (
            <button onClick={() => setSelected(null)} className="text-white/80 hover:text-white text-sm">← Back</button>
          ) : (
            <Link href="/" className="text-white/80 hover:text-white text-sm">← Back</Link>
          )}
          <h1 className="text-xl font-bold tracking-wide">🕊️ Kaffarah Calculator</h1>
          <select
            value={currency}
            onChange={(e) => { setCurrency(e.target.value); setMealCost(''); setClothCost(''); }}
            className="bg-white/20 backdrop-blur-sm text-white text-xs rounded-full px-3 py-1.5 border border-white/30 focus:outline-none"
          >
            {CURRENCIES.map(c => (
              <option key={c} value={c} className="text-gray-800">{c}</option>
            ))}
          </select>
        </div>
        {selected && (
          <div className="max-w-2xl mx-auto mt-3 text-center">
            <p className="text-2xl font-arabic text-white/80">{selected.arabic}</p>
            <p className="text-white/70 text-sm mt-1">{selected.description}</p>
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-12 space-y-5">
        {/* TYPE SELECTION */}
        {!selected && (
          <>
            <div className={cardClass}>
              <h2 className="text-lg font-bold text-gray-800 mb-2">What is Kaffarah?</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Kaffarah (كفارة) is an expiation — an act of worship performed to atone for specific sins.
                Select the type below to see the required steps and calculate the monetary equivalent.
              </p>
            </div>

            <div className="space-y-3">
              {KAFFARAH_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => selectType(type)}
                  className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:border-emerald-200 hover:shadow-md transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl flex-shrink-0">
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:text-emerald-800">{type.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{type.description}</p>
                    <p className="text-xs text-gray-500 mt-1 font-arabic">{type.arabic}</p>
                  </div>
                  <span className="text-gray-300 text-xl group-hover:text-emerald-600">›</span>
                </button>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-amber-800 text-sm mb-2">📚 Important Reminder</h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                Kaffarah must be accompanied by sincere repentance (Tawbah). The steps are ordered —
                you must be genuinely unable to perform a higher step before moving to the next.
                Always consult a qualified scholar for your specific situation.
              </p>
            </div>
          </>
        )}

        {/* DETAIL VIEW */}
        {selected && (
          <>
            {/* Daleel */}
            <div className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white rounded-2xl p-6 shadow-md">
              <p className="text-white/60 text-xs mb-2 font-semibold">Daleel (Evidence)</p>
              <p className="text-white/90 text-sm leading-relaxed italic">"{selected.ayah}..."</p>
              <p className="text-white/50 text-xs mt-2">{selected.source}</p>
            </div>

            {selected.note && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
                <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Important Note</p>
                <p className="text-xs text-amber-700 leading-relaxed">{selected.note}</p>
              </div>
            )}

            {/* Total Summary Card (NEW) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-800 text-lg mb-3">📋 Kaffarah Summary</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-emerald-600 mb-1">Occurrences</p>
                  <p className="text-2xl font-bold text-emerald-800">{quantity}</p>
                </div>
                {monetaryTotal !== null && monetaryTotal > 0 && (
                  <div className="bg-emerald-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-emerald-600 mb-1">Monetary Total</p>
                    <p className="text-2xl font-bold text-emerald-800">
                      {sym}{monetaryTotal.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              {fastingDays > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-amber-600 mb-1">Fasting Requirement</p>
                  <p className="text-2xl font-bold text-amber-800">{fastingDays} days</p>
                  {selected.steps.some(s => s.type === 'fast' && s.count >= 60) && (
                    <p className="text-xs text-amber-600 mt-1">Must be consecutive</p>
                  )}
                </div>
              )}
            </div>

            {/* Steps Cards */}
            <div className="space-y-4">
              <h2 className="font-bold text-gray-800 text-lg">Steps of Kaffarah</h2>
              {selected.steps.map((step, i) => {
                const monetary = step.type === 'feed' ? meal * step.count * quantity : step.type === 'clothe' ? cloth * step.count * quantity : null;
                const isSlaveStep = step.type === 'slave';
                return (
                  <div
                    key={i}
                    className={`bg-white rounded-2xl shadow-sm border p-5 transition-all ${isSlaveStep ? 'border-gray-200 opacity-60' : 'border-gray-100'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${isSlaveStep ? 'bg-gray-300' : 'bg-emerald-800'}`}>
                        {step.order}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xl">{TYPE_ICONS[step.type]}</span>
                          <h3 className={`font-semibold text-base ${isSlaveStep ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {step.label}
                          </h3>
                          {isSlaveStep && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">N/A today</span>}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 ml-10">{step.detail}</p>

                        {monetary !== null && !isSlaveStep && (
                          <div className="mt-3 ml-10 rounded-xl p-3" style={{ backgroundColor: TYPE_COLORS[step.type] }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: TYPE_TEXT[step.type] }}>
                              💰 Monetary Equivalent
                            </p>
                            <p className="text-lg font-bold" style={{ color: TYPE_TEXT[step.type] }}>
                              {sym}{monetary.toFixed(2)}
                            </p>
                            <p className="text-xs mt-1" style={{ color: TYPE_TEXT[step.type], opacity: 0.8 }}>
                              {step.count} × {step.type === 'feed' ? `${sym}${meal} per meal` : `${sym}${cloth} per garment`}
                              {quantity > 1 && ` × ${quantity} occurrence${quantity > 1 ? 's' : ''}`}
                            </p>
                          </div>
                        )}

                        {step.type === 'fast' && !isSlaveStep && (
                          <div className="mt-3 ml-10 bg-amber-50 rounded-xl p-3">
                            <p className="text-xs font-semibold text-amber-800 mb-1">🌙 Fasting</p>
                            <p className="text-lg font-bold text-amber-700">{step.count * quantity} days</p>
                            {step.count >= 60 && (
                              <p className="text-xs text-amber-600 mt-1">Consecutive — if interrupted, must restart</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Customization Panel */}
            <div className={cardClass}>
              <h2 className="font-bold text-gray-800 text-lg mb-4">Customize Calculation</h2>

              {selected.steps.some(s => s.type === 'feed') && (
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Cost per meal ({sym})</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{sym}</span>
                    <input
                      type="number"
                      value={mealCost}
                      onChange={e => setMealCost(e.target.value)}
                      placeholder={`Default: ${sym}${defaultMeal}`}
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                </div>
              )}

              {selected.steps.some(s => s.type === 'clothe') && (
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Cost per garment ({sym})</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{sym}</span>
                    <input
                      type="number"
                      value={clothCost}
                      onChange={e => setClothCost(e.target.value)}
                      placeholder={`Default: ${sym}${defaultCloth}`}
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 mb-2 block">Number of occurrences</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-lg"
                  >
                    −
                  </button>
                  <span className="text-xl font-bold text-gray-800 w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 rounded-full bg-emerald-800 text-white hover:bg-emerald-700 flex items-center justify-center text-lg"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500 ml-2">
                    {quantity > 1 ? `${quantity} kaffarahs` : 'Single kaffarah'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tawbah reminder */}
            <div className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white rounded-2xl p-6 text-center shadow-md">
              <p className="text-2xl font-arabic mb-2">التَّوْبَةُ</p>
              <p className="font-semibold text-lg mb-1">Tawbah (Repentance) is Essential</p>
              <p className="text-white/70 text-sm leading-relaxed">
                Kaffarah without sincere repentance is incomplete. Feel remorse, resolve not to repeat,
                and ask Allah for forgiveness.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Disclaimer</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                This is a general guide based on majority Sunni fiqh. Scholarly opinions may vary.
                Please consult a qualified Islamic scholar for your specific case.
              </p>
            </div>

            <button
              onClick={handlePrint}
              className="w-full py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition shadow-sm"
            >
              🖨️ Print / Save as PDF
            </button>
          </>
        )}
      </main>
    </div>
  );
}