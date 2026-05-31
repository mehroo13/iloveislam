'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
type HeirId = 'husband' | 'wife' | 'son' | 'daughter' | 'grandson' | 'granddaughter' |
  'father' | 'mother' | 'pGrandfather' | 'pGrandmother' | 'mGrandmother' |
  'fullBrother' | 'fullSister' | 'pBrother' | 'pSister' | 'mBrother' | 'mSister';

interface HeirDef {
  id: HeirId;
  label: string;
  group: string;
  gender: 'male' | 'female';
  info: string;
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
  quranicRef: string;
  blocked: boolean;
  blockReason?: string;
}

const CURRENCIES = [
  { code: 'USD', sym: '$' }, { code: 'GBP', sym: '£' }, { code: 'EUR', sym: '€' },
  { code: 'AUD', sym: 'A$' }, { code: 'CAD', sym: 'C$' }, { code: 'PKR', sym: '₨' },
  { code: 'SAR', sym: '﷼' }, { code: 'AED', sym: 'د.إ' }, { code: 'MYR', sym: 'RM' },
  { code: 'INR', sym: '₹' }, { code: 'BDT', sym: '৳' }, { code: 'TRY', sym: '₺' },
];

const HEIRS: HeirDef[] = [
  { id: 'husband', label: 'Husband', group: 'Spouse', gender: 'male', info: '¼ with children, ½ without' },
  { id: 'wife', label: 'Wife/Wives', group: 'Spouse', gender: 'female', info: '⅛ with children, ¼ without' },
  { id: 'son', label: 'Son(s)', group: 'Children', gender: 'male', info: 'Asaba (residuary) — gets double of daughter' },
  { id: 'daughter', label: 'Daughter(s)', group: 'Children', gender: 'female', info: '½ alone, ⅔ if 2+, asaba with son' },
  { id: 'grandson', label: "Son's Son(s)", group: 'Children', gender: 'male', info: 'Inherits if no son' },
  { id: 'granddaughter', label: "Son's Daughter(s)", group: 'Children', gender: 'female', info: 'Inherits if no son/daughter takes all' },
  { id: 'father', label: 'Father', group: 'Parents', gender: 'male', info: '⅙ with children, asaba without' },
  { id: 'mother', label: 'Mother', group: 'Parents', gender: 'female', info: '⅙ with children/siblings, ⅓ without' },
  { id: 'pGrandfather', label: 'Paternal Grandfather', group: 'Grandparents', gender: 'male', info: 'Like father if father absent' },
  { id: 'pGrandmother', label: 'Paternal Grandmother', group: 'Grandparents', gender: 'female', info: '⅙ if mother absent' },
  { id: 'mGrandmother', label: 'Maternal Grandmother', group: 'Grandparents', gender: 'female', info: '⅙ if mother absent' },
  { id: 'fullBrother', label: 'Full Brother(s)', group: 'Siblings', gender: 'male', info: 'Asaba if no children/father' },
  { id: 'fullSister', label: 'Full Sister(s)', group: 'Siblings', gender: 'female', info: '½ alone, ⅔ if 2+, asaba with brother' },
  { id: 'pBrother', label: 'Paternal Half-Brother(s)', group: 'Siblings', gender: 'male', info: 'Asaba if no full brother' },
  { id: 'pSister', label: 'Paternal Half-Sister(s)', group: 'Siblings', gender: 'female', info: '½ alone, ⅔ if 2+' },
  { id: 'mBrother', label: 'Maternal Half-Brother(s)', group: 'Siblings', gender: 'male', info: '⅙ alone, ⅓ if 2+' },
  { id: 'mSister', label: 'Maternal Half-Sister(s)', group: 'Siblings', gender: 'female', info: '⅙ alone, ⅓ if 2+' },
];

const GROUPS = ['Spouse', 'Children', 'Parents', 'Grandparents', 'Siblings'];
const GROUP_ICONS: Record<string, string> = { Spouse: '💑', Children: '👶', Parents: '👨‍👩‍👧', Grandparents: '👴', Siblings: '🤝' };
const COLORS = ['#059669', '#0d9488', '#c8a96e', '#7c3aed', '#dc2626', '#2563eb', '#d97706', '#ec4899', '#6366f1', '#14b8a6'];

const SCENARIOS: { name: string; heirs: Record<string, number> }[] = [
  { name: 'Husband, 2 sons, 1 daughter', heirs: { husband: 1, son: 2, daughter: 1 } },
  { name: 'Wife, father, mother', heirs: { wife: 1, father: 1, mother: 1 } },
  { name: 'Wife, 2 daughters, father, mother', heirs: { wife: 1, daughter: 2, father: 1, mother: 1 } },
  { name: 'Husband, mother, 2 full sisters', heirs: { husband: 1, mother: 1, fullSister: 2 } },
  { name: 'Wife, son, daughter, mother', heirs: { wife: 1, son: 1, daughter: 1, mother: 1 } },
];

function fractionToString(f: number): string {
  const fracs: [number, string][] = [[1/2,'½'],[1/3,'⅓'],[1/4,'¼'],[1/6,'⅙'],[1/8,'⅛'],[2/3,'⅔'],[3/4,'¾'],[1/12,'1/12'],[1/24,'1/24']];
  for (const [val, str] of fracs) { if (Math.abs(f - val) < 0.001) return str; }
  return (f * 100).toFixed(2) + '%';
}

// ─── Inheritance Calculation (Hanafi majority fiqh) ───────────────────────────
function calculate(estate: number, deductions: number, heirCounts: Record<string, number>): { results: HeirResult[]; awl: boolean; radd: boolean } {
  const net = Math.max(0, estate - deductions);
  if (net === 0) return { results: [], awl: false, radd: false };

  const has = (id: string): boolean => !!(heirCounts[id] && heirCounts[id] > 0);
  const count = (id: string): number => heirCounts[id] || 0;

  const hasSon = has('son');
  const hasDaughter = has('daughter');
  const hasGrandson = has('grandson');
  const hasGranddaughter = has('granddaughter');
  const hasDescendant = hasSon || hasDaughter || hasGrandson || hasGranddaughter;
  const hasMaleDescendant = hasSon || hasGrandson;
  const hasFather = has('father');
  const hasMother = has('mother');
  const hasHusband = has('husband');
  const hasWife = has('wife');

  const siblingCount = count('fullBrother') + count('fullSister') + count('pBrother') + count('pSister') + count('mBrother') + count('mSister');

  type ShareEntry = { id: HeirId; share: number; isAsaba: boolean; qRef: string };
  const shares: ShareEntry[] = [];

  // ── Spouse shares (Quran 4:12)
  if (hasHusband) shares.push({ id: 'husband', share: hasDescendant ? 1/4 : 1/2, isAsaba: false, qRef: 'Quran 4:12' });
  if (hasWife) shares.push({ id: 'wife', share: hasDescendant ? 1/8 : 1/4, isAsaba: false, qRef: 'Quran 4:12' });

  // ── Parents (Quran 4:11)
  if (hasFather) {
    if (hasDescendant) shares.push({ id: 'father', share: 1/6, isAsaba: hasMaleDescendant ? false : true, qRef: 'Quran 4:11' });
    else shares.push({ id: 'father', share: 0, isAsaba: true, qRef: 'Quran 4:11' });
  }
  if (hasMother) {
    if (hasDescendant || siblingCount >= 2) shares.push({ id: 'mother', share: 1/6, isAsaba: false, qRef: 'Quran 4:11' });
    else shares.push({ id: 'mother', share: 1/3, isAsaba: false, qRef: 'Quran 4:11' });
  }

  // ── Grandparents (only if parent absent)
  if (!hasFather && has('pGrandfather')) {
    if (hasDescendant) shares.push({ id: 'pGrandfather', share: 1/6, isAsaba: hasMaleDescendant ? false : true, qRef: 'Ijma (scholarly consensus)' });
    else shares.push({ id: 'pGrandfather', share: 0, isAsaba: true, qRef: 'Ijma' });
  }
  if (!hasMother) {
    if (has('pGrandmother')) shares.push({ id: 'pGrandmother', share: 1/6, isAsaba: false, qRef: 'Hadith (Mughirah)' });
    else if (has('mGrandmother')) shares.push({ id: 'mGrandmother', share: 1/6, isAsaba: false, qRef: 'Hadith (Mughirah)' });
  }

  // ── Children (Quran 4:11)
  if (hasSon) {
    shares.push({ id: 'son', share: 0, isAsaba: true, qRef: 'Quran 4:11' });
    if (hasDaughter) shares.push({ id: 'daughter', share: 0, isAsaba: true, qRef: 'Quran 4:11' });
  } else if (hasDaughter) {
    shares.push({ id: 'daughter', share: count('daughter') === 1 ? 1/2 : 2/3, isAsaba: false, qRef: 'Quran 4:11' });
    // Granddaughter gets ⅙ to complete ⅔ if one daughter
    if (hasGranddaughter && count('daughter') === 1) {
      shares.push({ id: 'granddaughter', share: 1/6, isAsaba: false, qRef: 'Hadith (Ibn Masud)' });
    }
  } else if (hasGrandson) {
    shares.push({ id: 'grandson', share: 0, isAsaba: true, qRef: 'Quran 4:11 (by analogy)' });
    if (hasGranddaughter) shares.push({ id: 'granddaughter', share: 0, isAsaba: true, qRef: 'Quran 4:11 (by analogy)' });
  } else if (hasGranddaughter) {
    shares.push({ id: 'granddaughter', share: count('granddaughter') === 1 ? 1/2 : 2/3, isAsaba: false, qRef: 'Hadith (Ibn Masud)' });
  }

  // ── Siblings (only if no descendant and no father) (Quran 4:12, 4:176)
  if (!hasDescendant && !hasFather && !has('pGrandfather')) {
    // Full siblings
    if (has('fullBrother')) {
      shares.push({ id: 'fullBrother', share: 0, isAsaba: true, qRef: 'Quran 4:176' });
      if (has('fullSister')) shares.push({ id: 'fullSister', share: 0, isAsaba: true, qRef: 'Quran 4:176' });
    } else if (has('fullSister')) {
      shares.push({ id: 'fullSister', share: count('fullSister') === 1 ? 1/2 : 2/3, isAsaba: false, qRef: 'Quran 4:176' });
    }
    // Paternal half-siblings (only if no full siblings)
    if (!has('fullBrother') && !has('fullSister')) {
      if (has('pBrother')) {
        shares.push({ id: 'pBrother', share: 0, isAsaba: true, qRef: 'Quran 4:176 (by analogy)' });
        if (has('pSister')) shares.push({ id: 'pSister', share: 0, isAsaba: true, qRef: 'Quran 4:176' });
      } else if (has('pSister')) {
        shares.push({ id: 'pSister', share: count('pSister') === 1 ? 1/2 : 2/3, isAsaba: false, qRef: 'Quran 4:176' });
      }
    }
    // Maternal half-siblings (Quran 4:12)
    if (has('mBrother') || has('mSister')) {
      const mTotal = count('mBrother') + count('mSister');
      const mShare = mTotal === 1 ? 1/6 : 1/3;
      if (has('mBrother')) shares.push({ id: 'mBrother', share: mShare, isAsaba: false, qRef: 'Quran 4:12' });
      if (has('mSister') && !has('mBrother')) shares.push({ id: 'mSister', share: mShare, isAsaba: false, qRef: 'Quran 4:12' });
    }
  }

  // ── Calculate fixed shares total
  let fixedTotal = shares.filter(s => !s.isAsaba && s.share > 0).reduce((sum, s) => sum + s.share, 0);
  const residue = Math.max(0, 1 - fixedTotal);
  let awl = false;
  let radd = false;

  // ── Distribute residue to asaba heirs
  const asabaHeirs = shares.filter(s => s.isAsaba);
  if (asabaHeirs.length > 0 && residue > 0) {
    // Sons/daughters or grandsons/granddaughters: male gets 2x female
    const sonEntry = asabaHeirs.find(s => s.id === 'son');
    const dauEntry = asabaHeirs.find(s => s.id === 'daughter');
    const gsonEntry = asabaHeirs.find(s => s.id === 'grandson');
    const gdauEntry = asabaHeirs.find(s => s.id === 'granddaughter');
    const fbEntry = asabaHeirs.find(s => s.id === 'fullBrother');
    const fsEntry = asabaHeirs.find(s => s.id === 'fullSister');
    const pbEntry = asabaHeirs.find(s => s.id === 'pBrother');
    const psEntry = asabaHeirs.find(s => s.id === 'pSister');

    if (sonEntry) {
      const sons = count('son');
      const daus = dauEntry ? count('daughter') : 0;
      const totalParts = sons * 2 + daus;
      sonEntry.share = (residue * sons * 2) / totalParts / sons; // per son
      sonEntry.share = (residue * 2) / totalParts; // fraction per 1 son (will multiply by count later)
      if (dauEntry) dauEntry.share = residue / totalParts;
      // Recalculate: total for sons = sonEntry.share * sons, total for daughters = dauEntry.share * daus
      const sonTotal = (residue * sons * 2) / totalParts;
      const dauTotal = (residue * daus) / totalParts;
      sonEntry.share = sonTotal;
      if (dauEntry) dauEntry.share = dauTotal;
    } else if (gsonEntry) {
      const gsons = count('grandson');
      const gdaus = gdauEntry ? count('granddaughter') : 0;
      const totalParts = gsons * 2 + gdaus;
      gsonEntry.share = (residue * gsons * 2) / totalParts;
      if (gdauEntry) gdauEntry.share = (residue * gdaus) / totalParts;
    } else if (fbEntry) {
      const fbs = count('fullBrother');
      const fss = fsEntry ? count('fullSister') : 0;
      const totalParts = fbs * 2 + fss;
      fbEntry.share = (residue * fbs * 2) / totalParts;
      if (fsEntry) fsEntry.share = (residue * fss) / totalParts;
    } else if (pbEntry) {
      const pbs = count('pBrother');
      const pss = psEntry ? count('pSister') : 0;
      const totalParts = pbs * 2 + pss;
      pbEntry.share = (residue * pbs * 2) / totalParts;
      if (psEntry) psEntry.share = (residue * pss) / totalParts;
    } else {
      // Single asaba heir (father, grandfather)
      const firstAsaba = asabaHeirs.find(s => s.share === 0);
      if (firstAsaba) firstAsaba.share = residue;
    }
  }

  // ── Awl (proportional reduction if shares exceed 1)
  const totalShares = shares.reduce((sum, s) => sum + s.share, 0);
  if (totalShares > 1.001) {
    awl = true;
    const factor = 1 / totalShares;
    shares.forEach(s => { s.share *= factor; });
  }

  // ── Radd (return excess to non-spouse heirs if no asaba and total < 1)
  if (asabaHeirs.length === 0 || asabaHeirs.every(s => s.share === 0)) {
    const currentTotal = shares.reduce((sum, s) => sum + s.share, 0);
    if (currentTotal < 0.999 && currentTotal > 0) {
      radd = true;
      const nonSpouse = shares.filter(s => s.id !== 'husband' && s.id !== 'wife' && s.share > 0);
      const nonSpouseTotal = nonSpouse.reduce((sum, s) => sum + s.share, 0);
      const excess = 1 - currentTotal;
      if (nonSpouseTotal > 0) {
        nonSpouse.forEach(s => { s.share += (s.share / nonSpouseTotal) * excess; });
      }
    }
  }

  // ── Build results
  const results: HeirResult[] = shares.filter(s => s.share > 0).map(s => {
    const heirInfo = HEIRS.find(h => h.id === s.id)!;
    const c = count(s.id);
    const totalAmount = net * s.share;
    return {
      id: s.id, label: heirInfo.label, count: c,
      fraction: s.share, percentage: (s.share * 100).toFixed(2),
      totalAmount, perPerson: c > 0 ? totalAmount / c : totalAmount,
      group: heirInfo.group, quranicRef: s.qRef, blocked: false,
    };
  }).sort((a, b) => b.fraction - a.fraction);

  return { results, awl, radd };
}

export default function InheritanceCalculator() {
  const [estate, setEstate] = useState('');
  const [funeral, setFuneral] = useState('');
  const [debts, setDebts] = useState('');
  const [wasiyyah, setWasiyyah] = useState('');
  const [heirCounts, setHeirCounts] = useState<Record<string, number>>({});
  const [currency, setCurrency] = useState('USD');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState('');
  const [showScenarios, setShowScenarios] = useState(false);
  const [deceasedGender, setDeceasedGender] = useState<'male' | 'female'>('male');

  const sym = CURRENCIES.find(c => c.code === currency)?.sym || '$';
  const net = Math.max(0, (parseFloat(estate) || 0) - (parseFloat(funeral) || 0) - (parseFloat(debts) || 0) - (parseFloat(wasiyyah) || 0));

  const setCount = (id: string, val: number) => setHeirCounts(prev => ({ ...prev, [id]: Math.max(0, val) }));
  const hasAnyHeir = Object.values(heirCounts).some(v => v > 0);

  // Validation: can't have both husband and wife
  const validHeirs = useMemo(() => {
    if (deceasedGender === 'male') return HEIRS.filter(h => h.id !== 'husband');
    return HEIRS.filter(h => h.id !== 'wife');
  }, [deceasedGender]);

  const handleNext = () => {
    if (net <= 0) { setError('Net estate must be positive after deductions.'); return; }
    const maxWasiyyah = ((parseFloat(estate) || 0) - (parseFloat(funeral) || 0) - (parseFloat(debts) || 0)) / 3;
    if ((parseFloat(wasiyyah) || 0) > maxWasiyyah + 0.01) { setError(`Wasiyyah cannot exceed ⅓ of estate after debts (${sym}${maxWasiyyah.toFixed(2)})`); return; }
    setError(''); setStep(2);
  };

  const calcResult = useMemo(() => {
    if (step !== 3) return null;
    const deductions = (parseFloat(funeral) || 0) + (parseFloat(debts) || 0) + (parseFloat(wasiyyah) || 0);
    return calculate(parseFloat(estate) || 0, deductions, heirCounts);
  }, [step, estate, funeral, debts, wasiyyah, heirCounts]);

  const resetAll = () => { setEstate(''); setFuneral(''); setDebts(''); setWasiyyah(''); setHeirCounts({}); setStep(1); setError(''); };

  const loadScenario = (heirs: Record<string, number>) => { setHeirCounts(heirs); setShowScenarios(false); };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 via-white to-stone-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans">
      <header className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white px-5 py-4 shadow-xl sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">← Home</Link>
          <h1 className="text-lg font-bold">⚖️ Islamic Inheritance Calculator</h1>
          <button onClick={() => setCurrency(CURRENCIES[(CURRENCIES.findIndex(c => c.code === currency) + 1) % CURRENCIES.length].code)}
            className="bg-white/15 text-white text-xs rounded-full px-3 py-1.5 border border-white/20 hover:bg-white/25 transition-all">
            {sym} {currency}
          </button>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-3xl mx-auto px-4 pt-5">
        <div className="flex items-center justify-center gap-2 mb-2">
          {[{ n: 1, l: 'Estate' }, { n: 2, l: 'Heirs' }, { n: 3, l: 'Results' }].map((s, i) => (
            <React.Fragment key={s.n}>
              <button disabled={s.n > step} onClick={() => s.n < step && setStep(s.n as 1|2|3)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${step >= s.n ? 'bg-emerald-800 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                <span className="font-bold">{s.n}</span> {s.l}
              </button>
              {i < 2 && <div className={`w-8 h-0.5 ${step > s.n ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 pb-12 space-y-5 mt-4">
        {/* STEP 1 */}
        {step === 1 && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">💰 Estate & Deductions</h2>
                <p className="text-xs text-gray-400">Enter the total value of all assets and any deductions.</p>
              </div>

              {/* Deceased gender */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Deceased was</label>
                <div className="flex gap-2">
                  {(['male', 'female'] as const).map(g => (
                    <button key={g} onClick={() => { setDeceasedGender(g); setHeirCounts(prev => { const n = {...prev}; delete n[g === 'male' ? 'husband' : 'wife']; return n; }); }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${deceasedGender === g ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 shadow-sm' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>
                      {g === 'male' ? '👨 Male' : '👩 Female'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Total Estate Value *</label>
                <p className="text-xs text-gray-400 mb-2">All assets: cash, property, investments, gold, vehicles</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{sym}</span>
                  <input type="number" value={estate} onChange={e => setEstate(e.target.value)} placeholder="0.00"
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3.5 text-xl font-bold bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800" />
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Deductions (in Islamic priority order)</p>
                {[
                  { label: '⚰️ Funeral & Burial Expenses', value: funeral, set: setFuneral, hint: 'Paid first from estate' },
                  { label: '💳 Debts of Deceased', value: debts, set: setDebts, hint: 'All outstanding debts' },
                  { label: '📜 Wasiyyah / Bequests (max ⅓)', value: wasiyyah, set: setWasiyyah, hint: 'Charitable bequests, max one-third' },
                ].map(item => (
                  <div key={item.label} className="mb-3">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">{item.label}</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{sym}</span>
                      <input type="number" value={item.value} onChange={e => item.set(e.target.value)} placeholder="0.00"
                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800" />
                    </div>
                  </div>
                ))}
              </div>

              {parseFloat(estate) > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
                  <p className="text-sm text-emerald-800 dark:text-emerald-300">Net distributable estate: <strong className="text-lg">{sym}{net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></p>
                </div>
              )}
              {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-600 dark:text-red-300">{error}</div>}
            </div>

            <button onClick={handleNext} disabled={!estate || parseFloat(estate) <= 0}
              className="w-full py-4 rounded-2xl bg-emerald-800 text-white font-semibold text-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg active:scale-[0.98]">
              Next: Select Heirs →
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            {/* Scenarios */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <button onClick={() => setShowScenarios(!showScenarios)} className="w-full flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-200">📋 Quick Scenarios</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">{showScenarios ? 'Hide' : 'Show'}</span>
              </button>
              {showScenarios && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {SCENARIOS.map((s, i) => (
                    <button key={i} onClick={() => loadScenario(s.heirs)}
                      className="text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900 hover:border-emerald-300 transition-all">
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
              Set the number of each living heir. The deceased was <strong>{deceasedGender}</strong> — {deceasedGender === 'male' ? 'wife' : 'husband'} is shown as spouse.
            </div>

            {GROUPS.map(group => {
              const groupHeirs = validHeirs.filter(h => h.group === group);
              if (groupHeirs.length === 0) return null;
              return (
                <div key={group} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex items-center gap-2">
                    <span className="text-lg">{GROUP_ICONS[group]}</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{group}</span>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-700">
                    {groupHeirs.map(heir => (
                      <div key={heir.id} className="px-5 py-3.5 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{heir.label}</span>
                          <p className="text-[10px] text-gray-400">{heir.info}</p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <button onClick={() => setCount(heir.id, (heirCounts[heir.id] || 0) - 1)}
                            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-lg transition-all active:scale-90">−</button>
                          <span className="w-6 text-center font-bold text-gray-800 dark:text-gray-100 text-sm">{heirCounts[heir.id] || 0}</span>
                          <button onClick={() => setCount(heir.id, (heirCounts[heir.id] || 0) + 1)}
                            className="w-8 h-8 rounded-full bg-emerald-800 text-white hover:bg-emerald-700 flex items-center justify-center text-lg transition-all active:scale-90">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">← Back</button>
              <button onClick={() => setStep(3)} disabled={!hasAnyHeir}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-800 text-white font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg active:scale-[0.98]">
                Calculate ⚖️
              </button>
            </div>
          </>
        )}

        {/* STEP 3: Results */}
        {step === 3 && calcResult && (
          <>
            <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-6 text-center shadow-xl">
              <p className="text-white/60 text-xs mb-1 uppercase tracking-wider">Net Distributable Estate</p>
              <p className="text-4xl font-bold tracking-tight">{sym}{net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              <p className="text-white/40 text-xs mt-2">{calcResult.results.length} heir group{calcResult.results.length !== 1 ? 's' : ''} · Deceased: {deceasedGender}</p>
              {(calcResult.awl || calcResult.radd) && (
                <div className="mt-3 flex justify-center gap-2">
                  {calcResult.awl && <span className="text-xs bg-red-500/20 text-red-200 px-2 py-0.5 rounded-full">⚠️ Awl Applied</span>}
                  {calcResult.radd && <span className="text-xs bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded-full">↩️ Radd Applied</span>}
                </div>
              )}
            </div>

            {calcResult.awl && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-xs text-red-700 dark:text-red-300">
                <strong>Awl (Proportional Reduction):</strong> The fixed shares exceed the estate. All shares have been proportionally reduced to fit. This is the ruling of Umar ibn al-Khattab (RA).
              </div>
            )}
            {calcResult.radd && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-xs text-blue-700 dark:text-blue-300">
                <strong>Radd (Return):</strong> After distributing fixed shares, there is a surplus. It has been returned proportionally to non-spouse heirs (Hanafi view).
              </div>
            )}

            {calcResult.results.length === 0 ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center">
                <p className="text-amber-800 dark:text-amber-300 font-medium">No valid heirs found for distribution</p>
                <button onClick={() => setStep(2)} className="mt-2 text-emerald-700 dark:text-emerald-400 underline text-sm">Go back to add heirs</button>
              </div>
            ) : (
              <>
                {/* Visual bar */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5" id="print-results">
                  <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide">Distribution Overview</p>
                  <div className="w-full h-10 rounded-xl overflow-hidden flex shadow-inner">
                    {calcResult.results.map((r, i) => (
                      <div key={r.id} className="h-full flex items-center justify-center text-[9px] text-white font-bold transition-all hover:opacity-80"
                        style={{ width: `${r.fraction * 100}%`, backgroundColor: COLORS[i % COLORS.length], minWidth: r.fraction > 0.05 ? 'auto' : '2px' }}
                        title={`${r.label}: ${r.percentage}%`}>
                        {r.fraction > 0.08 && fractionToString(r.fraction)}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                    {calcResult.results.map((r, i) => (
                      <div key={r.id} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {r.label} ({r.percentage}%)
                      </div>
                    ))}
                  </div>
                </div>

                {/* Heir cards */}
                <div className="space-y-3">
                  {calcResult.results.map((r, i) => (
                    <div key={r.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{r.label}</h3>
                          <p className="text-[11px] text-gray-400">{r.group} · {r.count} {r.count === 1 ? 'person' : 'people'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl" style={{ color: COLORS[i % COLORS.length] }}>
                            {sym}{r.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-gray-400">{fractionToString(r.fraction)} · {r.percentage}%</p>
                        </div>
                      </div>
                      {r.count > 1 && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 flex justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-300">Each person ({r.count}×)</span>
                          <span className="font-semibold" style={{ color: COLORS[i % COLORS.length] }}>{sym}{r.perPerson.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">📖 {r.quranicRef}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">← Edit Heirs</button>
              <button onClick={handlePrint} className="py-3.5 px-5 rounded-2xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">🖨️</button>
              <button onClick={resetAll} className="flex-1 py-3.5 rounded-2xl bg-emerald-800 text-white font-semibold hover:bg-emerald-700 transition-all shadow-lg active:scale-[0.98]">New Calculation</button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-300">
              <p className="font-semibold mb-1">⚠️ Disclaimer</p>
              <p className="text-xs leading-relaxed">This calculator provides estimates based on majority Sunni (Hanafi) fiqh. Inheritance law is complex and varies by school of thought. Always consult a qualified Islamic scholar and local lawyer for your specific case.</p>
            </div>
          </>
        )}
      </main>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-results, #print-results * { visibility: visible; }
          #print-results { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; }
        }
      `}</style>
    </div>
  );
}
