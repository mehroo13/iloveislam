'use client';

import React, { useState } from 'react';
import Link from 'next/link';

/* ── Types ── */
type HeirId = 'husband' | 'wife' | 'son' | 'daughter' | 'father' | 'mother' |
  'pGrandfather' | 'pGrandmother' | 'mGrandmother' |
  'fullBrother' | 'fullSister' | 'pBrother' | 'pSister' | 'mBrother' | 'mSister';

interface HeirDefinition {
  id: HeirId;
  label: string;
  group: string;
  gender: 'male' | 'female';
}

interface HeirResult {
  id: HeirId;
  label: string;
  count: number;
  fraction: number;
  percentage: string;
  totalAmount: number;
  perPerson: number;
  group: string;
}

const CURRENCIES = ['USD $', 'GBP £', 'EUR €', 'AUD $', 'PKR ₨', 'SAR ﷼', 'AED د.إ'];

const HEIRS: HeirDefinition[] = [
  { id: 'husband',      label: 'Husband',           group: 'Spouse',     gender: 'male' },
  { id: 'wife',         label: 'Wife/Wives',        group: 'Spouse',     gender: 'female' },
  { id: 'son',          label: 'Son(s)',             group: 'Children',   gender: 'male' },
  { id: 'daughter',     label: 'Daughter(s)',        group: 'Children',   gender: 'female' },
  { id: 'father',       label: 'Father',             group: 'Parents',    gender: 'male' },
  { id: 'mother',       label: 'Mother',             group: 'Parents',    gender: 'female' },
  { id: 'pGrandfather', label: 'Paternal Grandfather', group: 'Grandparents', gender: 'male' },
  { id: 'pGrandmother', label: 'Paternal Grandmother', group: 'Grandparents', gender: 'female' },
  { id: 'mGrandmother', label: 'Maternal Grandmother', group: 'Grandparents', gender: 'female' },
  { id: 'fullBrother',  label: 'Full Brother(s)',    group: 'Siblings',   gender: 'male' },
  { id: 'fullSister',   label: 'Full Sister(s)',     group: 'Siblings',   gender: 'female' },
  { id: 'pBrother',     label: 'Paternal Brother(s)',group: 'Siblings',   gender: 'male' },
  { id: 'pSister',      label: 'Paternal Sister(s)', group: 'Siblings',   gender: 'female' },
  { id: 'mBrother',     label: 'Maternal Brother(s)',group: 'Siblings',   gender: 'male' },
  { id: 'mSister',      label: 'Maternal Sister(s)', group: 'Siblings',   gender: 'female' },
];

const GROUPS = ['Spouse', 'Children', 'Parents', 'Grandparents', 'Siblings'];
const GROUP_ICONS: Record<string, string> = {
  Spouse: '💑', Children: '👶', Parents: '👨‍👩‍👧', Grandparents: '👴', Siblings: '🤝',
};

/* ── Helper to display fraction nicely ── */
function fractionToString(f: number): string {
  const fracs: [number, string][] = [
    [1/2, '½'], [1/3, '⅓'], [1/4, '¼'], [1/6, '⅙'], [1/8, '⅛'],
    [2/3, '⅔'], [3/4, '¾'],
  ];
  for (const [val, str] of fracs) {
    if (Math.abs(f - val) < 0.0001) return str;
  }
  return (f * 100).toFixed(1) + '%';
}

/* ── Inheritance calculation (Hanafi/majority fiqh) ── */
function calculate(
  estate: number,
  deductions: number,
  heirCounts: Record<string, number>
): HeirResult[] {
  const net = Math.max(0, estate - deductions);
  if (net === 0) return [];

  // ✅ Fixed: double‑bang forces boolean return
  const has = (id: string): boolean => !!(heirCounts[id] && heirCounts[id] > 0);
  const count = (id: string): number => heirCounts[id] || 0;

  const hasSon = has('son');
  const hasDaughter = has('daughter');
  const hasChildren = hasSon || hasDaughter;
  const hasFather = has('father');
  const hasMother = has('mother');
  const hasHusband = has('husband');
  const hasWife = has('wife');
  const hasFullBrother = has('fullBrother');
  const hasFullSister = has('fullSister');

  let shares: Record<string, number | 'asaba'> = {};

  // Spouse
  if (hasHusband) shares['husband'] = hasChildren ? 1/4 : 1/2;
  if (hasWife) {
    const wifeHouseholdShare = hasChildren ? 1/8 : 1/4;
    shares['wife'] = wifeHouseholdShare; // will be split among count later
  }

  // Parents
  if (hasFather) {
    shares['father'] = hasChildren ? 1/6 : 'asaba';
  }
  if (hasMother) {
    const siblingsCount =
      count('fullBrother') + count('fullSister') +
      count('pBrother') + count('pSister') +
      count('mBrother') + count('mSister');
    if (hasChildren || siblingsCount >= 2) {
      shares['mother'] = 1/6;
    } else {
      shares['mother'] = 1/3;
    }
  }

  // Grandparents (simplified, only if father absent)
  if (!hasFather && has('pGrandfather')) {
    shares['pGrandfather'] = hasChildren ? 1/6 : 'asaba';
  }
  if (!hasMother && has('pGrandmother')) {
    shares['pGrandmother'] = 1/6;
  }
  if (!hasMother && !has('pGrandmother') && has('mGrandmother')) {
    shares['mGrandmother'] = 1/6;
  }

  // Daughters (when no son)
  if (!hasSon && hasDaughter) {
    shares['daughter'] = count('daughter') === 1 ? 1/2 : 2/3;
  }

  // Siblings (only if no children and no father)
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
    // Maternal siblings (Khalati rule)
    if (has('mBrother') || has('mSister')) {
      const mCount = count('mBrother') + count('mSister');
      const mShare = mCount === 1 ? 1/6 : 1/3;
      if (has('mBrother')) shares['mBrother'] = mShare; // actual split by count later
      if (has('mSister')) shares['mSister'] = mShare;
    }
  }

  // Fixed shares total
  let fixedTotal = 0;
  for (const [id, share] of Object.entries(shares)) {
    if (typeof share === 'number') fixedTotal += share;
  }

  // Residue (asaba)
  const residue = Math.max(0, 1 - fixedTotal);

  if (hasSon) {
    // Sons & daughters: son gets 2x daughter
    const sons = count('son');
    const daus = count('daughter');
    const totalParts = sons * 2 + daus;
    if (sons > 0) shares['son'] = (residue * sons * 2) / totalParts;
    if (daus > 0) shares['daughter'] = (residue * daus) / totalParts;
  } else {
    // Assign residue to first asaba heir
    for (const [id, share] of Object.entries(shares)) {
      if (share === 'asaba') {
        shares[id] = residue;
        break;
      }
    }
    // Radd (return) if no asaba
    if (residue > 0 && !Object.values(shares).includes('asaba')) {
      // redistribute proportionally (simplified: give to father/mother)
      if (hasFather && shares['father'] !== 'asaba') {
        shares['father'] = (shares['father'] as number) + residue;
      } else if (hasMother) {
        shares['mother'] = (shares['mother'] as number) + residue;
      }
    }
  }

  // Clean 'asaba' strings
  for (const id of Object.keys(shares)) {
    if (shares[id] === 'asaba') delete shares[id];
  }

  // Build results
  const results: HeirResult[] = [];
  for (const [id, fraction] of Object.entries(shares)) {
    if (typeof fraction !== 'number' || fraction <= 0) continue;
    const heirInfo = HEIRS.find(h => h.id === id);
    if (!heirInfo) continue;
    const individualCount = count(id);
    const totalAmount = net * fraction;
    const perPerson = individualCount > 0 ? totalAmount / individualCount : totalAmount;

    results.push({
      id: id as HeirId,
      label: heirInfo.label,
      count: individualCount,
      fraction: fraction as number,
      percentage: (fraction * 100).toFixed(2),
      totalAmount,
      perPerson,
      group: heirInfo.group,
    });
  }

  return results.sort((a, b) => b.fraction - a.fraction);
}

export default function InheritanceCalculator() {
  const [estate, setEstate] = useState<string>('');
  const [funeral, setFuneral] = useState<string>('');
  const [debts, setDebts] = useState<string>('');
  const [wasiyyah, setWasiyyah] = useState<string>('');
  const [heirCounts, setHeirCounts] = useState<Record<string, number>>({});
  const [currency, setCurrency] = useState<string>('USD $');
  const [results, setResults] = useState<HeirResult[] | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string>('');

  const sym = currency.split(' ')[1] || '$';

  const setCount = (id: string, val: number) => {
    setHeirCounts(prev => ({ ...prev, [id]: Math.max(0, val) }));
  };

  const handleNext = () => {
    const net = (parseFloat(estate) || 0) - (parseFloat(funeral) || 0) - (parseFloat(debts) || 0) - (parseFloat(wasiyyah) || 0);
    if (net <= 0) {
      setError('Net estate must be positive after deductions.');
      return;
    }
    setError('');
    setStep(2);
  };

  const runCalculation = () => {
    const deductions = (parseFloat(funeral) || 0) + (parseFloat(debts) || 0) + (parseFloat(wasiyyah) || 0);
    const res = calculate(parseFloat(estate) || 0, deductions, heirCounts);
    setResults(res);
    setStep(3);
  };

  const resetAll = () => {
    setEstate('');
    setFuneral('');
    setDebts('');
    setWasiyyah('');
    setHeirCounts({});
    setResults(null);
    setStep(1);
    setError('');
  };

  const hasAnyHeir = Object.values(heirCounts).some(v => v > 0);
  const net = Math.max(0, (parseFloat(estate) || 0) - (parseFloat(funeral) || 0) - (parseFloat(debts) || 0) - (parseFloat(wasiyyah) || 0));

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white font-serif">
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white px-5 py-4 shadow-lg sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/80 hover:text-white text-sm">← Back</Link>
          <h1 className="text-xl font-bold">⚖️ Inheritance Calculator</h1>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="bg-white/20 backdrop-blur-sm text-white text-xs rounded-full px-3 py-1.5 border border-white/30 focus:outline-none"
          >
            {CURRENCIES.map(c => (
              <option key={c} value={c} className="text-gray-800">{c}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Step indicator */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <button
                disabled={s > step}
                onClick={() => s < step && setStep(s as 1|2|3)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s ? 'bg-emerald-800 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-400'
                }`}
              >
                {s}
              </button>
              {s < 3 && (
                <div className="flex-1 h-0.5 bg-gray-200 mx-1">
                  <div
                    className={`h-0.5 transition-all ${step > s ? 'bg-emerald-800' : 'bg-gray-200'}`}
                    style={{ width: step > s ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 mb-4">
          {step === 1 && 'Enter estate value and deductions'}
          {step === 2 && 'Select living heirs'}
          {step === 3 && 'Review inheritance shares'}
        </p>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-12 space-y-5">
        {step === 1 && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Total Estate Value</label>
                <p className="text-xs text-gray-400 mb-2">All assets (cash, property, investments)</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">{sym}</span>
                  <input
                    type="number"
                    value={estate}
                    onChange={e => setEstate(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>

              <div className="border-t pt-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">Deductions (in order of priority)</p>
                {[
                  { label: '⚰️ Funeral Expenses', value: funeral, set: setFuneral },
                  { label: '💳 Debts of Deceased', value: debts, set: setDebts },
                  { label: '📜 Wasiyyah (max ⅓ of remaining)', value: wasiyyah, set: setWasiyyah },
                ].map((item) => (
                  <div key={item.label} className="mb-3">
                    <label className="text-xs text-gray-500 mb-1 block">{item.label}</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{sym}</span>
                      <input
                        type="number"
                        value={item.value}
                        onChange={e => item.set(e.target.value)}
                        placeholder="0.00"
                        className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {parseFloat(estate) > 0 && (
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-emerald-800">
                    Net distributable estate: <strong>{sym}{net.toFixed(2)}</strong>
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={!estate || parseFloat(estate) <= 0}
              className="w-full py-4 rounded-2xl bg-emerald-800 text-white font-semibold text-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next: Add Heirs →
            </button>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
              <p className="font-semibold mb-2">📚 Islamic Order of Deductions</p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-amber-700">
                <li>Funeral & burial expenses</li>
                <li>Debts owed by the deceased</li>
                <li>Bequests (up to ⅓ of estate after debts)</li>
                <li>Remainder distributed to heirs</li>
              </ol>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 mb-4">
              Enter the number of each living heir. Leave blank or 0 if none.
            </div>

            {GROUPS.map(group => {
              const groupHeirs = HEIRS.filter(h => h.group === group);
              return (
                <div key={group} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                    <span className="text-lg">{GROUP_ICONS[group]}</span>
                    <span className="font-semibold text-gray-700">{group}</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {groupHeirs.map(heir => (
                      <div key={heir.id} className="px-5 py-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{heir.label}</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setCount(heir.id, (heirCounts[heir.id] || 0) - 1)}
                            className="w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-bold text-gray-800">
                            {heirCounts[heir.id] || 0}
                          </span>
                          <button
                            onClick={() => setCount(heir.id, (heirCounts[heir.id] || 0) + 1)}
                            className="w-8 h-8 rounded-full bg-emerald-800 text-white hover:bg-emerald-700 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-2xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                ← Back
              </button>
              <button
                onClick={runCalculation}
                disabled={!hasAnyHeir}
                className="flex-1 py-4 rounded-2xl bg-emerald-800 text-white font-semibold text-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Calculate Shares ⚖️
              </button>
            </div>
          </>
        )}

        {step === 3 && results && (
          <>
            <div className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white rounded-2xl p-6 text-center shadow-lg">
              <p className="text-white/80 text-sm mb-1">Net Distributable Estate</p>
              <p className="text-3xl font-bold">{sym}{net.toFixed(2)}</p>
              <p className="text-white/60 text-xs mt-1">
                {results.length} heir group{results.length !== 1 ? 's' : ''}
              </p>
            </div>

            {results.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                <p className="text-amber-800 font-medium">No valid heirs found</p>
                <button onClick={() => setStep(2)} className="mt-2 text-emerald-700 underline text-sm">
                  Go back to add heirs
                </button>
              </div>
            ) : (
              <>
                {/* Distribution bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <p className="text-xs text-gray-400 mb-3 font-semibold">Distribution Overview</p>
                  <div className="w-full h-8 rounded-xl overflow-hidden flex">
                    {results.map((r, i) => {
                      const colors = ['#0a3d2e', '#1a6b4a', '#c8a96e', '#2d8a5e', '#a07840', '#4aaa7a'];
                      return (
                        <div
                          key={r.id}
                          style={{
                            width: `${r.fraction * 100}%`,
                            backgroundColor: colors[i % colors.length],
                          }}
                          title={`${r.label}: ${r.percentage}%`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                    {results.map((r, i) => {
                      const colors = ['#0a3d2e', '#1a6b4a', '#c8a96e', '#2d8a5e', '#a07840', '#4aaa7a'];
                      return (
                        <div key={r.id} className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span
                            className="w-3 h-3 rounded-sm inline-block"
                            style={{ backgroundColor: colors[i % colors.length] }}
                          />
                          {r.label} ({r.percentage}%)
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Heir cards */}
                <div className="space-y-3">
                  {results.map((r, i) => {
                    const colors = ['#0a3d2e', '#1a6b4a', '#c8a96e', '#2d8a5e', '#a07840', '#4aaa7a'];
                    const color = colors[i % colors.length];
                    return (
                      <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-800 text-lg">{r.label}</h3>
                            <p className="text-xs text-gray-400">
                              {r.group} · {r.count} {r.count === 1 ? 'person' : 'people'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-xl" style={{ color }}>
                              {sym}{r.totalAmount.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {fractionToString(r.fraction)} · {r.percentage}%
                            </p>
                          </div>
                        </div>
                        {r.count > 1 && (
                          <div className="bg-gray-50 rounded-xl p-3 flex justify-between text-sm">
                            <span className="text-gray-600">Each person ({r.count}×)</span>
                            <span className="font-semibold" style={{ color }}>
                              {sym}{r.perPerson.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">⚠️ Important Disclaimer</p>
              <p className="text-xs leading-relaxed">
                This calculator provides an estimate based on majority Sunni (Hanafi) fiqh. Inheritance can be
                complex. Consult a qualified scholar and a local lawyer for your specific case.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 rounded-2xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                ← Edit Heirs
              </button>
              <button
                onClick={resetAll}
                className="flex-1 py-4 rounded-2xl bg-emerald-800 text-white font-semibold hover:bg-emerald-700 transition"
              >
                New Calculation
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}