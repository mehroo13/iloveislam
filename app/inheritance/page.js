export const metadata = {
  title: 'Islamic Inheritance Calculator — Free Faraid Tool | I Love Islam',
  description: 'Calculate Islamic inheritance shares for free. Based on Faraid law from Quran and Sunnah. Enter heirs and estate to get exact distribution.',
}

'use client';
import { useState } from 'react';
import Link from 'next/link';

const CURRENCIES = ['USD $', 'GBP £', 'EUR €', 'AUD $', 'PKR ₨', 'SAR ﷼', 'AED د.إ'];

const HEIRS = [
  { id: 'husband',     label: 'Husband',          group: 'Spouse',    gender: 'male'   },
  { id: 'wife',        label: 'Wife/Wives',        group: 'Spouse',    gender: 'female' },
  { id: 'son',         label: 'Son(s)',             group: 'Children',  gender: 'male'   },
  { id: 'daughter',    label: 'Daughter(s)',        group: 'Children',  gender: 'female' },
  { id: 'father',      label: 'Father',             group: 'Parents',   gender: 'male'   },
  { id: 'mother',      label: 'Mother',             group: 'Parents',   gender: 'female' },
  { id: 'pGrandfather',label: 'Paternal Grandfather', group: 'Grandparents', gender: 'male' },
  { id: 'pGrandmother',label: 'Paternal Grandmother', group: 'Grandparents', gender: 'female' },
  { id: 'mGrandmother',label: 'Maternal Grandmother', group: 'Grandparents', gender: 'female' },
  { id: 'fullBrother', label: 'Full Brother(s)',    group: 'Siblings',  gender: 'male'   },
  { id: 'fullSister',  label: 'Full Sister(s)',     group: 'Siblings',  gender: 'female' },
  { id: 'pBrother',    label: 'Paternal Brother(s)',group: 'Siblings',  gender: 'male'   },
  { id: 'pSister',     label: 'Paternal Sister(s)', group: 'Siblings',  gender: 'female' },
  { id: 'mBrother',    label: 'Maternal Brother(s)',group: 'Siblings',  gender: 'male'   },
  { id: 'mSister',     label: 'Maternal Sister(s)', group: 'Siblings',  gender: 'female' },
];

// Islamic inheritance calculation (Hanafi/majority fiqh)
function calculate(estate, deductions, heirs) {
  const net = Math.max(0, estate - deductions);
  if (net === 0) return [];

  const h = heirs; // shorthand
  const has = (id) => h[id] && h[id] > 0;
  const count = (id) => h[id] || 0;

  const results = [];
  let remaining = 1; // fraction of estate

  const hasSon = has('son');
  const hasDaughter = has('daughter');
  const hasChildren = hasSon || hasDaughter;
  const hasFather = has('father');
  const hasMother = has('mother');
  const hasHusband = has('husband');
  const hasWife = has('wife');
  const hasFullBrother = has('fullBrother');
  const hasFullSister = has('fullSister');

  let shares = {};

  // ── SPOUSE ──
  if (hasHusband) {
    shares['husband'] = hasChildren ? 1/4 : 1/2;
  }
  if (hasWife) {
    // Share is per household (1/8 or 1/4 split among wives)
    const wifeHouseholdShare = hasChildren ? 1/8 : 1/4;
    shares['wife'] = wifeHouseholdShare; // will split among count later
  }

  // ── PARENTS ──
  if (hasFather) {
    if (hasChildren) {
      shares['father'] = 1/6;
    } else {
      // Father gets residue (asaba) — handled below
      shares['father'] = 'asaba';
    }
  }
  if (hasMother) {
    const hasSiblings = has('fullBrother') || has('fullSister') || has('pBrother') || has('pSister') || has('mBrother') || has('mSister');
    if (hasChildren || (hasSiblings && count('fullBrother') + count('fullSister') + count('pBrother') + count('pSister') + count('mBrother') + count('mSister') >= 2)) {
      shares['mother'] = 1/6;
    } else {
      shares['mother'] = 1/3;
    }
  }

  // ── GRANDPARENTS (simplified) ──
  if (!hasFather && has('pGrandfather')) {
    shares['pGrandfather'] = hasChildren ? 1/6 : 'asaba';
  }
  if (!hasMother && has('pGrandmother')) {
    shares['pGrandmother'] = 1/6;
  }
  if (!hasMother && !has('pGrandmother') && has('mGrandmother')) {
    shares['mGrandmother'] = 1/6;
  }

  // ── DAUGHTERS (fixed share, then residue with sons) ──
  if (!hasSon && hasDaughter) {
    shares['daughter'] = count('daughter') === 1 ? 1/2 : 2/3;
  }

  // ── SIBLINGS (only inherit if no son, no father) ──
  if (!hasChildren && !hasFather) {
    if (hasFullBrother) {
      shares['fullBrother'] = 'asaba';
    } else if (!hasFullBrother && hasFullSister) {
      shares['fullSister'] = count('fullSister') === 1 ? 1/2 : 2/3;
    }
    if (!hasFullBrother && !hasFullSister) {
      if (has('pBrother')) shares['pBrother'] = 'asaba';
      else if (has('pSister')) shares['pSister'] = count('pSister') === 1 ? 1/2 : 2/3;
    }
    // Maternal siblings
    if (has('mBrother') || has('mSister')) {
      const mCount = count('mBrother') + count('mSister');
      const mShare = mCount === 1 ? 1/6 : 1/3;
      if (has('mBrother')) shares['mBrother'] = mShare / mCount * count('mBrother');
      if (has('mSister')) shares['mSister'] = mShare / mCount * count('mSister');
    }
  }

  // ── CALCULATE FIXED SHARES TOTAL ──
  let fixedTotal = 0;
  for (const [id, share] of Object.entries(shares)) {
    if (share !== 'asaba') fixedTotal += share;
  }

  // ── RESIDUE (asaba) ──
  const residue = Math.max(0, 1 - fixedTotal);

  // Sons + daughters get residue (son gets 2x daughter)
  if (hasSon) {
    const sonCount = count('son');
    const dauCount = count('daughter');
    // Total parts: each son = 2, each daughter = 1
    const totalParts = sonCount * 2 + dauCount;
    shares['son'] = (residue * sonCount * 2) / totalParts;
    if (hasDaughter) shares['daughter'] = (residue * dauCount) / totalParts;
  } else {
    // Asaba heirs
    for (const [id, share] of Object.entries(shares)) {
      if (share === 'asaba') {
        shares[id] = residue;
        break; // simplified: first asaba gets it
      }
    }
    // If no asaba, remaining goes to father or mother (radd)
    if (residue > 0 && !Object.values(shares).includes('asaba') && !hasSon) {
      if (hasFather && shares['father'] !== 'asaba') shares['father'] = (shares['father'] || 0) + residue;
      else if (hasMother) shares['mother'] = (shares['mother'] || 0) + residue;
    }
  }

  // Clean up remaining 'asaba' strings
  for (const id of Object.keys(shares)) {
    if (shares[id] === 'asaba') shares[id] = 0;
  }

  // ── BUILD RESULTS ──
  for (const [id, fraction] of Object.entries(shares)) {
    if (!fraction || fraction <= 0) continue;
    const heirInfo = HEIRS.find(h => h.id === id);
    if (!heirInfo) continue;
    const individualCount = count(id);
    const totalAmount = net * fraction;
    const perPerson = individualCount > 0 ? totalAmount / individualCount : totalAmount;

    results.push({
      id,
      label: heirInfo.label,
      count: individualCount,
      fraction,
      percentage: (fraction * 100).toFixed(2),
      totalAmount,
      perPerson,
      group: heirInfo.group,
    });
  }

  return results.sort((a, b) => b.fraction - a.fraction);
}

function fractionToString(f) {
  const fracs = [
    [1/2, '½'], [1/3, '⅓'], [1/4, '¼'], [1/6, '⅙'], [1/8, '⅛'],
    [2/3, '⅔'], [3/4, '¾'],
  ];
  for (const [val, str] of fracs) {
    if (Math.abs(f - val) < 0.001) return str;
  }
  return (f * 100).toFixed(1) + '%';
}

const GROUPS = ['Spouse', 'Children', 'Parents', 'Grandparents', 'Siblings'];
const GROUP_ICONS = { Spouse: '💑', Children: '👶', Parents: '👨‍👩‍👧', Grandparents: '👴', Siblings: '🤝' };

export default function InheritanceCalculator() {
  const [estate, setEstate] = useState('');
  const [funeral, setFuneral] = useState('');
  const [debts, setDebts] = useState('');
  const [wasiyyah, setWasiyyah] = useState('');
  const [heirCounts, setHeirCounts] = useState({});
  const [currency, setCurrency] = useState('USD $');
  const [results, setResults] = useState(null);
  const [step, setStep] = useState(1);

  const sym = currency.split(' ')[1] || '$';

  function setCount(id, val) {
    setHeirCounts(prev => ({ ...prev, [id]: Math.max(0, parseInt(val) || 0) }));
  }

  function runCalculation() {
    const deductions = (parseFloat(funeral) || 0) + (parseFloat(debts) || 0) + (parseFloat(wasiyyah) || 0);
    const res = calculate(parseFloat(estate) || 0, deductions, heirCounts);
    setResults(res);
    setStep(3);
  }

  const hasAnyHeir = Object.values(heirCounts).some(v => v > 0);
  const net = Math.max(0, (parseFloat(estate) || 0) - (parseFloat(funeral) || 0) - (parseFloat(debts) || 0) - (parseFloat(wasiyyah) || 0));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #1a6b4a 100%)' }} className="px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
          <h1 className="text-white font-semibold">⚖️ Inheritance Calculator</h1>
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            className="bg-white/20 text-white text-xs rounded-lg px-2 py-1 border-0 outline-none">
            {CURRENCIES.map(c => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}
          </select>
        </div>
        <p className="text-white/50 text-xs text-center mt-2">Based on Islamic inheritance law (Fara'id)</p>
      </header>

      {/* Step indicator */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center flex-1">
              <button
                onClick={() => s < step && setStep(s)}
                className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 transition-all ${step >= s ? 'text-white' : 'bg-gray-200 text-gray-400'}`}
                style={step >= s ? { background: '#0a3d2e' } : {}}
              >
                {s}
              </button>
              <span className={`text-xs ml-2 ${step === s ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                {s === 1 ? 'Estate' : s === 2 ? 'Heirs' : 'Results'}
              </span>
              {s < 3 && <div className={`flex-1 h-0.5 mx-3 rounded ${step > s ? '' : 'bg-gray-200'}`} style={step > s ? { background: '#0a3d2e' } : {}} />}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-5 pb-10 space-y-4">

        {/* STEP 1 — Estate */}
        {step === 1 && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <div>
                <p className="font-semibold text-gray-800 mb-1">Total Estate Value</p>
                <p className="text-xs text-gray-400 mb-3">Total assets before any deductions</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{sym}</span>
                  <input type="number" value={estate} onChange={e => setEstate(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-lg font-semibold focus:outline-none focus:border-gray-400" />
                </div>
              </div>

              <div className="border-t border-gray-50 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Deductions (deducted first in Islam)</p>
                <div className="space-y-3">
                  {[
                    { key: 'funeral', label: '⚰️ Funeral Expenses', val: funeral, set: setFuneral },
                    { key: 'debts', label: '💳 Debts of Deceased', val: debts, set: setDebts },
                    { key: 'wasiyyah', label: '📜 Wasiyyah (max ⅓)', val: wasiyyah, set: setWasiyyah },
                  ].map(({ key, label, val, set }) => (
                    <div key={key}>
                      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{sym}</span>
                        <input type="number" value={val} onChange={e => set(e.target.value)}
                          placeholder="0.00"
                          className="w-full border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-gray-300 bg-gray-50" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {parseFloat(estate) > 0 && (
                <div style={{ background: '#f0faf5' }} className="rounded-xl p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Net distributable estate:</span>
                    <span className="font-bold" style={{ color: '#0a3d2e' }}>{sym}{net.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!estate || parseFloat(estate) <= 0}
              className="w-full py-4 rounded-2xl text-white font-semibold disabled:opacity-40"
              style={{ background: '#0a3d2e' }}
            >
              Next: Add Heirs →
            </button>

            {/* Islamic order note */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-medium text-amber-800 mb-2">📚 Islamic Order of Deductions</p>
              <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
                <li>Funeral & burial expenses</li>
                <li>Debts owed by the deceased</li>
                <li>Wasiyyah (bequest) — maximum ⅓ of remaining estate</li>
                <li>The remainder is distributed to heirs</li>
              </ol>
            </div>
          </>
        )}

        {/* STEP 2 — Heirs */}
        {step === 2 && (
          <>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
              Enter the number of each heir. Enter 0 or leave blank if not applicable.
            </div>

            {GROUPS.map(group => {
              const groupHeirs = HEIRS.filter(h => h.group === group);
              return (
                <div key={group} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
                    <span>{GROUP_ICONS[group]}</span>
                    <p className="font-semibold text-gray-800 text-sm">{group}</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {groupHeirs.map(heir => (
                      <div key={heir.id} className="px-5 py-3 flex items-center justify-between">
                        <span className="text-sm text-gray-700">{heir.label}</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setCount(heir.id, (heirCounts[heir.id] || 0) - 1)}
                            className="w-8 h-8 rounded-full border border-gray-200 text-gray-500 font-bold flex items-center justify-center hover:bg-gray-50"
                          >−</button>
                          <span className="w-6 text-center font-semibold text-gray-800 text-sm">
                            {heirCounts[heir.id] || 0}
                          </span>
                          <button
                            onClick={() => setCount(heir.id, (heirCounts[heir.id] || 0) + 1)}
                            className="w-8 h-8 rounded-full text-white font-bold flex items-center justify-center"
                            style={{ background: '#0a3d2e' }}
                          >+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-2xl border border-gray-200 text-gray-600 font-medium">
                ← Back
              </button>
              <button
                onClick={runCalculation}
                disabled={!hasAnyHeir}
                className="flex-1 py-4 rounded-2xl text-white font-semibold disabled:opacity-40"
                style={{ background: '#0a3d2e' }}
              >
                Calculate ⚖️
              </button>
            </div>
          </>
        )}

        {/* STEP 3 — Results */}
        {step === 3 && results && (
          <>
            {/* Summary card */}
            <div style={{ background: 'linear-gradient(135deg, #0a3d2e, #1a6b4a)' }} className="rounded-2xl p-5 text-center">
              <p className="text-white/60 text-xs mb-1">Net Distributable Estate</p>
              <p className="text-3xl font-bold text-white">{sym}{net.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-white/50 text-xs mt-1">{results.length} heir group{results.length !== 1 ? 's' : ''}</p>
            </div>

            {results.length === 0 ? (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
                <p className="text-amber-700 font-medium">No valid heirs found</p>
                <p className="text-amber-600 text-sm mt-1">Please go back and add at least one heir</p>
              </div>
            ) : (
              <>
                {/* Visual bar */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-400 mb-3">Distribution Overview</p>
                  <div className="flex h-8 rounded-xl overflow-hidden gap-0.5">
                    {results.map((r, i) => {
                      const colors = ['#0a3d2e', '#1a6b4a', '#c8a96e', '#2d8a5e', '#a07840', '#4aaa7a'];
                      return (
                        <div key={r.id} style={{ width: `${r.fraction * 100}%`, background: colors[i % colors.length] }}
                          title={`${r.label}: ${r.percentage}%`} />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                    {results.map((r, i) => {
                      const colors = ['#0a3d2e', '#1a6b4a', '#c8a96e', '#2d8a5e', '#a07840', '#4aaa7a'];
                      return (
                        <div key={r.id} className="flex items-center gap-1.5 text-xs text-gray-500">
                          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: colors[i % colors.length] }} />
                          {r.label} ({r.percentage}%)
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Heir cards */}
                <div className="space-y-3">
                  {results.map((r, i) => (
                    <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-800">{r.label}</p>
                          <p className="text-xs text-gray-400">{r.group} · {r.count > 1 ? `${r.count} people` : '1 person'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg" style={{ color: '#0a3d2e' }}>
                            {sym}{r.totalAmount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-gray-400">{fractionToString(r.fraction)} share · {r.percentage}%</p>
                        </div>
                      </div>
                      {r.count > 1 && (
                        <div style={{ background: '#f0faf5' }} className="rounded-xl p-3 flex justify-between text-sm">
                          <span className="text-gray-600">Per person ({r.count}x)</span>
                          <span className="font-medium" style={{ color: '#0a3d2e' }}>
                            {sym}{r.perPerson.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-medium text-amber-800 mb-1">⚠️ Important Disclaimer</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                This calculator provides a general estimate based on majority Sunni (Hanafi) fiqh. 
                Inheritance cases can be complex. Please consult a qualified Islamic scholar or inheritance specialist 
                for your specific situation. Do not use this as a legal document.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 py-4 rounded-2xl border border-gray-200 text-gray-600 font-medium">
                ← Edit Heirs
              </button>
              <button onClick={() => { setStep(1); setResults(null); setEstate(''); setFuneral(''); setDebts(''); setWasiyyah(''); setHeirCounts({}); }}
                className="flex-1 py-4 rounded-2xl text-white font-semibold"
                style={{ background: '#0a3d2e' }}>
                New Calculation
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}