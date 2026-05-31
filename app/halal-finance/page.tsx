'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// ─── Deal Types ───────────────────────────────────────────────────────────────
const DEAL_TYPES = [
  { id: 'loan', label: 'Personal Loan', icon: '💳', desc: 'Bank loan, credit card, personal lending', category: 'Borrowing' },
  { id: 'mortgage', label: 'Home Mortgage', icon: '🏠', desc: 'Home purchase financing', category: 'Borrowing' },
  { id: 'credit_card', label: 'Credit Card', icon: '💳', desc: 'Credit card usage and rewards', category: 'Borrowing' },
  { id: 'student_loan', label: 'Student Loan', icon: '🎓', desc: 'Education financing', category: 'Borrowing' },
  { id: 'investment', label: 'Stock / Fund', icon: '📈', desc: 'Stocks, ETFs, mutual funds', category: 'Investing' },
  { id: 'crypto', label: 'Cryptocurrency', icon: '₿', desc: 'Bitcoin, Ethereum, DeFi, staking', category: 'Investing' },
  { id: 'business', label: 'Business Deal', icon: '🤝', desc: 'Partnership, sale, trade', category: 'Business' },
  { id: 'savings', label: 'Savings Account', icon: '🏦', desc: 'Bank savings, fixed deposit, bonds', category: 'Banking' },
  { id: 'insurance', label: 'Insurance', icon: '🛡️', desc: 'Life, health, car, home insurance', category: 'Protection' },
  { id: 'rent', label: 'Rental / Lease', icon: '🏢', desc: 'Property rental, car lease', category: 'Business' },
  { id: 'forex', label: 'Forex Trading', icon: '💱', desc: 'Currency exchange and trading', category: 'Investing' },
  { id: 'mlm', label: 'MLM / Network', icon: '🔺', desc: 'Multi-level marketing, network marketing', category: 'Business' },
];

type DealType = (typeof DEAL_TYPES)[number];

const QUESTIONS: Record<string, { id: string; q: string; flag: boolean; weight: number; tip: string }[]> = {
  loan: [
    { id: 'interest', q: 'Does this loan charge interest (Riba)?', flag: true, weight: 10, tip: 'Any fixed charge on borrowed money is Riba — strictly forbidden. Quran 2:275.' },
    { id: 'compound', q: 'Is there compound interest involved?', flag: true, weight: 10, tip: 'Compound interest is even more severe — "doubled and multiplied" (Quran 3:130).' },
    { id: 'penalty', q: 'Are there late payment penalties that increase over time?', flag: true, weight: 7, tip: 'Escalating penalties constitute Riba. Fixed admin fees are more permissible.' },
    { id: 'secured', q: 'Is the loan secured with legitimate collateral?', flag: false, weight: 2, tip: 'Secured loans with asset-backing are more transparent and structured.' },
    { id: 'islamic', q: 'Is this from an Islamic finance institution?', flag: false, weight: 4, tip: 'Islamic banks use Murabaha, Musharakah, or Ijarah instead of interest.' },
  ],
  mortgage: [
    { id: 'interest', q: 'Does the mortgage charge interest (Riba)?', flag: true, weight: 10, tip: 'Conventional mortgages are Riba-based. Alternatives: Diminishing Musharakah or Ijarah.' },
    { id: 'islamic_structure', q: 'Is it structured as Murabaha or Diminishing Musharakah?', flag: false, weight: 5, tip: 'These Islamic structures allow home ownership without interest.' },
    { id: 'ownership', q: 'Do you own a share of the property from day one?', flag: false, weight: 3, tip: 'In Musharakah, both you and the bank own shares — you buy their share over time.' },
    { id: 'penalty', q: 'Are there interest-based early repayment penalties?', flag: true, weight: 6, tip: 'Fixed admin fees are permissible; interest-based penalties are not.' },
    { id: 'insurance', q: 'Is mortgage insurance (PMI) mandatory with interest?', flag: true, weight: 4, tip: 'Takaful (Islamic insurance) is the halal alternative to conventional PMI.' },
  ],
  credit_card: [
    { id: 'interest', q: 'Do you pay interest if you carry a balance?', flag: true, weight: 10, tip: 'Credit card interest is Riba. If you pay in full monthly, no interest accrues.' },
    { id: 'full_payment', q: 'Do you always pay the full balance each month?', flag: false, weight: 5, tip: 'Paying in full avoids interest — many scholars permit this usage.' },
    { id: 'cash_advance', q: 'Do you use cash advances (which always charge interest)?', flag: true, weight: 8, tip: 'Cash advances charge interest from day one — always haram.' },
    { id: 'rewards_haram', q: 'Are rewards earned from haram merchants (casinos, bars)?', flag: true, weight: 6, tip: 'Cashback from haram purchases is problematic.' },
    { id: 'necessity', q: 'Is this your only option for essential purchases?', flag: false, weight: 2, tip: 'Necessity (Darurah) may permit limited use if no alternative exists.' },
  ],
  student_loan: [
    { id: 'interest', q: 'Does the loan charge interest?', flag: true, weight: 10, tip: 'Interest-bearing student loans are Riba regardless of the purpose.' },
    { id: 'govt_loan', q: 'Is it a government loan with below-inflation rates?', flag: true, weight: 5, tip: 'Some scholars view this differently, but majority still consider it Riba.' },
    { id: 'necessity', q: 'Is there absolutely no other way to fund your education?', flag: false, weight: 3, tip: 'Explore scholarships, family support, part-time work, or Islamic student finance.' },
    { id: 'islamic_alt', q: 'Have you explored Islamic student finance options?', flag: false, weight: 4, tip: 'Some institutions offer Qard Hasan or income-share agreements.' },
    { id: 'repay_fast', q: 'Do you plan to repay as quickly as possible to minimize interest?', flag: false, weight: 2, tip: 'If forced into it, minimizing interest paid is the lesser harm.' },
  ],
  investment: [
    { id: 'haram_sector', q: 'Does the company operate in alcohol, gambling, pork, weapons, or adult content?', flag: true, weight: 10, tip: 'Investing in haram industries is forbidden regardless of profit.' },
    { id: 'debt_ratio', q: 'Does the company have debt exceeding 33% of total assets?', flag: true, weight: 7, tip: 'High debt ratios indicate heavy reliance on interest-based financing.' },
    { id: 'interest_income', q: 'Does the company earn more than 5% revenue from interest?', flag: true, weight: 8, tip: 'AAOIFI standard: interest income must be below 5% of total revenue.' },
    { id: 'shariah_screen', q: 'Has this been Shariah-screened by a scholar or board?', flag: false, weight: 5, tip: 'Look for MSCI Islamic Index, Dow Jones Islamic, or S&P Shariah indices.' },
    { id: 'purification', q: 'Will you purify any haram income by donating to charity?', flag: false, weight: 3, tip: 'If a tiny % of income is haram, scholars allow purification via sadaqah.' },
    { id: 'short_selling', q: 'Does it involve short selling or margin trading?', flag: true, weight: 8, tip: 'Selling what you do not own is prohibited (Gharar). Margin = borrowing with interest.' },
  ],
  business: [
    { id: 'riba', q: 'Does the deal involve any interest-based lending or borrowing?', flag: true, weight: 10, tip: 'Even if both parties agree, interest in a contract is not permissible.' },
    { id: 'gharar', q: 'Is there excessive uncertainty (Gharar) in the terms?', flag: true, weight: 8, tip: 'Contracts must be clear. Excessive ambiguity about price, delivery, or terms is Gharar.' },
    { id: 'maysir', q: 'Does profit depend entirely on chance (Maysir)?', flag: true, weight: 9, tip: 'Speculation without actual work or asset backing resembles gambling.' },
    { id: 'haram_product', q: 'Does the business deal in haram products/services?', flag: true, weight: 10, tip: 'Trading in alcohol, pork, drugs, or immoral services is not permissible.' },
    { id: 'transparency', q: 'Are both parties fully aware of all terms?', flag: false, weight: 3, tip: 'Transparency (no hidden terms) is essential in Islamic contracts.' },
    { id: 'mutual_consent', q: 'Do both parties enter with free and full consent?', flag: false, weight: 3, tip: 'Coercion invalidates a contract in Islamic law.' },
  ],
  savings: [
    { id: 'interest_earning', q: 'Does this account pay interest on your balance?', flag: true, weight: 10, tip: 'Interest-earning savings accounts are Riba. Use a current account instead.' },
    { id: 'bonds', q: 'Does it involve government or corporate bonds?', flag: true, weight: 8, tip: 'Conventional bonds pay fixed interest. Sukuk (Islamic bonds) are the alternative.' },
    { id: 'profit_sharing', q: 'Is it a profit-sharing account (Mudarabah)?', flag: false, weight: 5, tip: 'Mudarabah accounts share actual profit/loss — permissible in Islam.' },
    { id: 'islamic_bank', q: 'Is it with an Islamic bank?', flag: false, weight: 4, tip: 'Islamic banks are supervised by a Shariah board and avoid interest.' },
    { id: 'fixed_deposit', q: 'Is it a fixed deposit with guaranteed returns?', flag: true, weight: 9, tip: 'Guaranteed fixed returns on deposits = Riba. Returns must be variable.' },
  ],
  insurance: [
    { id: 'conventional', q: 'Is this conventional insurance (not Takaful)?', flag: true, weight: 8, tip: 'Conventional insurance involves Gharar, Maysir, and Riba in investments.' },
    { id: 'takaful', q: 'Is this Takaful (mutual Islamic insurance)?', flag: false, weight: 6, tip: 'Takaful pools contributions for mutual benefit — permissible by most scholars.' },
    { id: 'investment_component', q: 'Does the policy invest premiums in interest-bearing instruments?', flag: true, weight: 7, tip: 'Common in life insurance — check the investment policy.' },
    { id: 'compulsory', q: 'Is this insurance legally required (e.g. car insurance)?', flag: false, weight: 4, tip: 'Scholars generally allow legally mandatory insurance under necessity (Darurah).' },
    { id: 'gambling_element', q: 'Is there a gambling element (you pay, may never claim)?', flag: true, weight: 5, tip: 'This is the Maysir element in conventional insurance.' },
  ],
  crypto: [
    { id: 'utility', q: 'Does the cryptocurrency have a clear, legitimate utility?', flag: false, weight: 4, tip: 'Currencies with real utility (payments, smart contracts) are viewed more favourably.' },
    { id: 'speculation', q: 'Are you buying purely for speculative price gain?', flag: true, weight: 8, tip: 'Pure speculation with no underlying asset or utility resembles Maysir.' },
    { id: 'staking_interest', q: 'Does staking pay fixed interest-like returns?', flag: true, weight: 7, tip: 'Fixed returns on staked crypto resemble Riba. Variable profit-sharing may differ.' },
    { id: 'defi_interest', q: 'Does it involve DeFi lending/borrowing with interest?', flag: true, weight: 9, tip: 'DeFi interest protocols are considered Riba by most scholars.' },
    { id: 'haram_platform', q: 'Is the platform used for gambling or illegal activity?', flag: true, weight: 10, tip: 'Participating in or enabling haram activities via crypto is not permissible.' },
    { id: 'scholar_approval', q: 'Has a reputable scholar reviewed this specific crypto?', flag: false, weight: 3, tip: 'Look for fatawa from AAOIFI, Mufti Faraz Adam, or established scholars.' },
  ],
  rent: [
    { id: 'clear_terms', q: 'Are rental amount, duration, and conditions clearly defined?', flag: false, weight: 3, tip: 'Clarity in contracts is required — vague terms involve Gharar.' },
    { id: 'ownership_risk', q: 'Does the owner bear ownership risks (maintenance, repairs)?', flag: false, weight: 4, tip: 'In valid Ijarah, the owner retains ownership responsibility.' },
    { id: 'interest_penalty', q: 'Are there interest-based late payment penalties?', flag: true, weight: 7, tip: 'Fixed late fees may be permissible; escalating interest charges are not.' },
    { id: 'haram_use', q: 'Will the property be used for haram purposes?', flag: true, weight: 10, tip: 'Renting to a business selling alcohol or running haram services is not permissible.' },
    { id: 'lease_to_own', q: 'If lease-to-own, is it structured as Ijarah wa Iqtina?', flag: false, weight: 4, tip: 'Ijarah wa Iqtina (lease ending in ownership) is the halal alternative.' },
  ],
  forex: [
    { id: 'spot_trade', q: 'Is the exchange done on the spot (same session)?', flag: false, weight: 5, tip: 'Spot forex (immediate exchange) is permissible. The Prophet ﷺ said: "hand to hand."' },
    { id: 'leverage', q: 'Are you using leverage (borrowed money to trade)?', flag: true, weight: 9, tip: 'Leverage involves borrowing with interest (swap fees) — Riba.' },
    { id: 'swap_fees', q: 'Does your broker charge overnight swap/rollover fees?', flag: true, weight: 8, tip: 'Swap fees are interest. Use an Islamic (swap-free) account.' },
    { id: 'islamic_account', q: 'Is this an Islamic (swap-free) forex account?', flag: false, weight: 5, tip: 'Many brokers offer swap-free accounts for Muslim traders.' },
    { id: 'gambling', q: 'Are you trading based on pure guesswork without analysis?', flag: true, weight: 6, tip: 'Trading without knowledge or analysis resembles gambling (Maysir).' },
  ],
  mlm: [
    { id: 'product_value', q: 'Is there a genuine product/service with real market value?', flag: false, weight: 5, tip: 'Legitimate MLMs sell real products. If income is mainly from recruitment, it is a pyramid scheme.' },
    { id: 'recruitment_focus', q: 'Is income primarily from recruiting others (not product sales)?', flag: true, weight: 10, tip: 'Pyramid schemes are haram — they involve Gharar and taking money unjustly.' },
    { id: 'entry_fee', q: 'Is there a large upfront fee to join?', flag: true, weight: 7, tip: 'High entry fees with no real product = pyramid scheme characteristics.' },
    { id: 'guaranteed_returns', q: 'Are returns guaranteed regardless of effort?', flag: true, weight: 8, tip: 'Guaranteed returns without risk = Riba or fraud.' },
    { id: 'haram_products', q: 'Does the company sell haram products?', flag: true, weight: 10, tip: 'Selling supplements with haram ingredients, or promoting haram services.' },
    { id: 'transparency', q: 'Is the compensation plan transparent and understandable?', flag: false, weight: 3, tip: 'Excessive complexity often hides unfair terms (Gharar).' },
  ],
};

const ALTERNATIVES: Record<string, string[]> = {
  loan: ['Qard Hasan (interest-free loan)', 'Islamic microfinance', 'Family/community crowdfunding', 'Tawarruq from Islamic bank', 'Murabaha financing'],
  mortgage: ['Diminishing Musharakah (shared ownership)', 'Murabaha home purchase', 'Ijarah (rent-to-own)', 'Islamic mortgage providers (Guidance Residential, LARIBA, Gatehouse Bank)'],
  credit_card: ['Debit card (spend only what you have)', 'Islamic credit cards (Murabaha-based)', 'Pay full balance monthly (no interest accrues)', 'Prepaid cards'],
  student_loan: ['Scholarships and grants', 'Family support / Qard Hasan', 'Part-time work during studies', 'Islamic student finance (e.g. KIVA, LaunchGood)', 'Income-share agreements'],
  investment: ['Shariah-screened ETFs (Wahed, SP Funds, Amundi Islamic)', 'Sukuk (Islamic bonds)', 'Direct real estate', 'Halal business partnerships (Musharakah)', 'Gold/silver'],
  business: ['Murabaha (cost-plus sale)', 'Musharakah (profit-sharing)', 'Mudarabah (silent partnership)', 'Salam / Istisna contracts'],
  savings: ['Current/checking account (no interest)', 'Mudarabah profit-sharing savings', 'Islamic bank accounts', 'Invest in halal assets', 'Gold savings accounts'],
  insurance: ['Takaful providers (Salama, FWD Takaful, Prudential BSN)', 'Self-insurance savings fund', 'Community mutual aid', 'Use conventional only if legally mandatory'],
  crypto: ['Bitcoin (accepted by many scholars)', 'Ethereum utility use cases', 'Islamic crypto platforms (HAQQ, IslamicCoin)', 'Avoid DeFi interest protocols'],
  rent: ['Standard Ijarah contract', 'Ijarah wa Iqtina (lease-to-own)', 'Islamic lawyer-reviewed contracts', 'Avoid properties used for haram'],
  forex: ['Spot trading only (no leverage)', 'Islamic swap-free accounts', 'Physical currency exchange', 'Avoid overnight positions'],
  mlm: ['Direct product sales (no recruitment focus)', 'Start your own halal business', 'Affiliate marketing with halal products', 'Avoid pyramid-structured compensation'],
};

const GLOSSARY = [
  { term: 'Riba (ربا)', meaning: 'Interest/Usury — any predetermined return on a loan. Strictly forbidden.', ref: 'Quran 2:275-279' },
  { term: 'Gharar (غرر)', meaning: 'Excessive uncertainty — contracts with ambiguous terms or unknown outcomes.', ref: 'Hadith (Muslim)' },
  { term: 'Maysir (ميسر)', meaning: 'Gambling — profit from pure chance without productive effort.', ref: 'Quran 5:90' },
  { term: 'Murabaha', meaning: 'Cost-plus financing — bank buys asset and sells to you at disclosed markup.', ref: 'Islamic Finance' },
  { term: 'Musharakah', meaning: 'Joint partnership — both parties share profit AND loss proportionally.', ref: 'Islamic Finance' },
  { term: 'Mudarabah', meaning: 'Silent partnership — one provides capital, other provides expertise.', ref: 'Islamic Finance' },
  { term: 'Ijarah', meaning: 'Lease — owner retains ownership, lessee pays for usage rights.', ref: 'Islamic Finance' },
  { term: 'Takaful', meaning: 'Islamic insurance — mutual cooperation, participants share risk.', ref: 'Islamic Finance' },
  { term: 'Sukuk', meaning: 'Islamic bonds — asset-backed certificates representing ownership share.', ref: 'Islamic Finance' },
  { term: 'Qard Hasan', meaning: 'Benevolent loan — interest-free loan given as an act of charity.', ref: 'Quran 2:245' },
  { term: 'Darurah', meaning: 'Necessity — extreme need that may permit otherwise forbidden actions.', ref: 'Fiqh Principle' },
  { term: 'Awl', meaning: 'Proportional reduction when inheritance shares exceed the estate.', ref: 'Inheritance Law' },
];

interface HistoryEntry {
  id: number;
  dealType: string;
  verdict: string;
  pct: number;
  date: string;
}

const LS_HISTORY = 'halal_finance_history';

export default function HalalFinanceCheck() {
  const [dealType, setDealType] = useState<DealType | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<any>(null);
  const [step, setStep] = useState<'select' | 'questions' | 'result'>('select');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Load history
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_HISTORY);
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const saveToHistory = (entry: HistoryEntry) => {
    const updated = [entry, ...history].slice(0, 20);
    setHistory(updated);
    try { localStorage.setItem(LS_HISTORY, JSON.stringify(updated)); } catch {}
  };

  const selectDeal = (type: DealType) => {
    setDealType(type); setAnswers({}); setResult(null); setStep('questions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const answer = (id: string, val: boolean) => setAnswers(prev => ({ ...prev, [id]: val }));

  const calculateResult = () => {
    if (!dealType) return;
    const qs = QUESTIONS[dealType.id];
    let riskScore = 0, maxScore = 0;
    const redFlags: string[] = [], greenPoints: string[] = [];

    for (const q of qs) {
      const ans = answers[q.id];
      if (ans === undefined) continue;
      maxScore += q.weight;
      if (q.flag && ans) { riskScore += q.weight; redFlags.push(q.q); }
      else if (!q.flag && ans) { greenPoints.push(q.q); }
      else if (q.flag && !ans) { greenPoints.push('No: ' + q.q); }
    }

    const pct = maxScore > 0 ? (riskScore / maxScore) * 100 : 0;
    let verdict: string, color: string, emoji: string, bg: string;
    if (pct === 0) { verdict = 'Halal ✓'; color = '#059669'; emoji = '✅'; bg = 'from-emerald-700 to-emerald-500'; }
    else if (pct <= 20) { verdict = 'Mostly Halal — Minor Concerns'; color = '#10b981'; emoji = '🟢'; bg = 'from-emerald-600 to-teal-500'; }
    else if (pct <= 45) { verdict = 'Questionable — Seek Scholar Advice'; color = '#d97706'; emoji = '🟡'; bg = 'from-amber-600 to-orange-500'; }
    else if (pct <= 70) { verdict = 'High Risk — Likely Haram Elements'; color = '#ea580c'; emoji = '🟠'; bg = 'from-orange-600 to-red-500'; }
    else { verdict = 'Haram — Clear Prohibitions Present'; color = '#dc2626'; emoji = '🔴'; bg = 'from-red-700 to-red-500'; }

    const res = { pct, verdict, color, emoji, bg, redFlags, greenPoints, riskScore, maxScore };
    setResult(res); setStep('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    saveToHistory({ id: Date.now(), dealType: dealType.label, verdict, pct, date: new Date().toISOString().split('T')[0] });
  };

  const qs = dealType ? QUESTIONS[dealType.id] || [] : [];
  const answered = qs.filter(q => answers[q.id] !== undefined).length;
  const allAnswered = answered === qs.length;

  const categories = useMemo(() => [...new Set(DEAL_TYPES.map(d => d.category))], []);
  const filteredDeals = filterCategory ? DEAL_TYPES.filter(d => d.category === filterCategory) : DEAL_TYPES;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 via-white to-stone-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans">
      <header className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white px-5 py-4 shadow-xl sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {step !== 'select' ? (
            <button onClick={() => { setStep(step === 'result' ? 'questions' : 'select'); setResult(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-white/60 hover:text-white text-sm transition-colors">← Back</button>
          ) : (
            <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">← Home</Link>
          )}
          <h1 className="text-lg font-bold">☪️ Halal Finance Check</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowGlossary(!showGlossary)} className="text-xs bg-white/15 px-2.5 py-1 rounded-full border border-white/20 hover:bg-white/25 transition-all">📖</button>
            <button onClick={() => setShowHistory(!showHistory)} className="text-xs bg-white/15 px-2.5 py-1 rounded-full border border-white/20 hover:bg-white/25 transition-all">📋</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-12 space-y-5">
        {/* Glossary panel */}
        {showGlossary && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5 animate-slideDown">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">📖 Islamic Finance Glossary</h3>
              <button onClick={() => setShowGlossary(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {GLOSSARY.map((g, i) => (
                <div key={i} className="border-b border-gray-50 dark:border-gray-700 pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{g.term}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{g.ref}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{g.meaning}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History panel */}
        {showHistory && history.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5 animate-slideDown">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">📋 Recent Checks</h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {history.map(h => (
                <div key={h.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{h.dealType}</span>
                    <span className="text-[10px] text-gray-400 ml-2">{h.date}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${h.pct <= 20 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : h.pct <= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                    {h.pct.toFixed(0)}% risk
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SELECT DEAL TYPE */}
        {step === 'select' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 text-center">
              <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-400 mb-2">Is Your Deal Halal?</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Answer questions about your financial deal to check for <strong>Riba</strong>, <strong>Gharar</strong>, and <strong>Maysir</strong>.
              </p>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => setFilterCategory(null)}
                className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${!filterCategory ? 'bg-emerald-800 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                All
              </button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                  className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${filterCategory === cat ? 'bg-emerald-800 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredDeals.map(type => (
                <button key={type.id} onClick={() => selectDeal(type)}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 text-left hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md transition-all group active:scale-[0.97]">
                  <span className="text-3xl">{type.icon}</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm mt-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{type.label}</p>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{type.desc}</p>
                </button>
              ))}
            </div>

            {/* Three prohibitions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base mb-4">The Three Prohibitions in Islamic Finance</h3>
              <div className="space-y-3">
                {[
                  { icon: '💸', term: 'Riba (ربا)', meaning: 'Interest / Usury', detail: 'Any predetermined return on a loan. "Allah has permitted trade and forbidden Riba" — Quran 2:275' },
                  { icon: '🎲', term: 'Maysir (ميسر)', meaning: 'Gambling', detail: 'Profit from pure chance without productive effort or asset backing.' },
                  { icon: '🌫️', term: 'Gharar (غرر)', meaning: 'Excessive Uncertainty', detail: 'Contracts with ambiguous terms, hidden conditions, or deceptive elements.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{item.term}</p>
                        <span className="text-[10px] text-gray-400">— {item.meaning}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* QUESTIONS */}
        {step === 'questions' && dealType && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
              <span className="text-3xl">{dealType.icon}</span>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100">{dealType.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{dealType.desc}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{answered} / {qs.length}</span>
              </div>
              <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-300" style={{ width: `${(answered / qs.length) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-3">
              {qs.map((q, i) => {
                const hasAns = answers[q.id] !== undefined;
                const isYes = answers[q.id] === true;
                const isNo = answers[q.id] === false;
                const isRed = hasAns && isYes === q.flag;
                return (
                  <div key={q.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border transition-all ${hasAns ? (isRed ? 'border-red-200 dark:border-red-800' : 'border-emerald-200 dark:border-emerald-800') : 'border-gray-100 dark:border-gray-700'} p-4`}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${hasAns ? (isRed ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300') : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                        {hasAns ? (isRed ? '!' : '✓') : i + 1}
                      </span>
                      <p className="text-sm text-gray-800 dark:text-gray-100 font-medium leading-relaxed flex-1">{q.q}</p>
                    </div>
                    <div className="flex gap-2 mb-2">
                      {[{ val: true, label: 'Yes' }, { val: false, label: 'No' }].map(opt => (
                        <button key={String(opt.val)} onClick={() => answer(q.id, opt.val)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border active:scale-[0.97] ${
                            hasAns && ((opt.val && isYes) || (!opt.val && isNo))
                              ? (opt.val === q.flag ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/50 dark:text-red-300' : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300')
                              : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {hasAns && (
                      <div className={`rounded-xl p-3 text-xs leading-relaxed ${isRed ? 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'}`}>
                        {isRed ? '⚠️ ' : '✅ '}{q.tip}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button onClick={calculateResult} disabled={!allAnswered}
              className="w-full py-4 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg active:scale-[0.98]">
              {allAnswered ? 'Get My Verdict ⚖️' : `Answer ${qs.length - answered} more`}
            </button>
          </>
        )}

        {/* RESULT */}
        {step === 'result' && result && dealType && (
          <>
            {/* Verdict card */}
            <div className={`rounded-2xl p-6 text-center text-white shadow-xl bg-gradient-to-br ${result.bg}`}>
              <p className="text-5xl mb-3">{result.emoji}</p>
              <p className="text-2xl font-bold mb-1">{result.verdict}</p>
              <p className="text-white/70 text-sm">{dealType.label}</p>
              <div className="mt-5 h-4 bg-white/20 rounded-full overflow-hidden relative">
                <div className="h-full rounded-full bg-white/90 transition-all duration-700" style={{ width: `${result.pct}%` }} />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-800 mix-blend-multiply">
                  {result.pct.toFixed(0)}% risk
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-white/50 mt-1">
                <span>✅ Halal</span>
                <span>🚫 Haram</span>
              </div>
            </div>

            {/* Red flags */}
            {result.redFlags.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5">
                <h3 className="font-bold text-red-800 dark:text-red-300 mb-3">🚩 Red Flags ({result.redFlags.length})</h3>
                <ul className="space-y-2">
                  {result.redFlags.map((flag: string, i: number) => (
                    <li key={i} className="text-sm text-red-700 dark:text-red-300 flex gap-2 items-start">
                      <span className="text-red-400 mt-0.5">•</span>{flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Green points */}
            {result.greenPoints.length > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5">
                <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-3">✅ Positive ({result.greenPoints.length})</h3>
                <ul className="space-y-2">
                  {result.greenPoints.map((pt: string, i: number) => (
                    <li key={i} className="text-sm text-emerald-700 dark:text-emerald-300 flex gap-2 items-start">
                      <span className="text-emerald-400 mt-0.5">•</span>{pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alternatives */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3">💡 Halal Alternatives</h3>
              <div className="space-y-2">
                {(ALTERNATIVES[dealType.id] || []).map((alt, i) => (
                  <div key={i} className="flex gap-2 items-start text-sm text-gray-600 dark:text-gray-300">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">→</span>
                    <span>{alt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quranic verse */}
            <div className="bg-gradient-to-br from-emerald-900 to-teal-800 text-white rounded-2xl p-6 text-center shadow-lg">
              <p className="text-2xl mb-2" style={{ fontFamily: "'Amiri', serif" }}>وَأَحَلَّ ٱللَّهُ ٱلْبَيْعَ وَحَرَّمَ ٱلرِّبَوٰا۟</p>
              <p className="text-white/70 text-sm italic">"Allah has permitted trade and forbidden interest"</p>
              <p className="text-white/40 text-xs mt-1">— Quran 2:275</p>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                <strong>⚠️ Disclaimer:</strong> This is a general screening tool, not a fatwa. For a binding Islamic ruling on your specific situation, consult a qualified Islamic finance scholar or Shariah board.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setStep('questions'); setResult(null); }}
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                ← Edit Answers
              </button>
              <button onClick={() => { setStep('select'); setDealType(null); setAnswers({}); setResult(null); }}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold transition-all shadow-lg active:scale-[0.98]">
                Check Another
              </button>
            </div>
          </>
        )}
      </main>

      <style jsx>{`
        .animate-slideDown { animation: slideDown 0.25s ease-out; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
