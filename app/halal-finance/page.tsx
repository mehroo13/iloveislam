'use client';

import React, { useState } from 'react';
import Link from 'next/link';

/* ── Data (unchanged) ── */
const DEAL_TYPES = [
  { id: 'loan', label: 'Personal Loan', icon: '💳', desc: 'Bank loan, credit card debt, personal lending' },
  { id: 'mortgage', label: 'Home Mortgage', icon: '🏠', desc: 'Home purchase financing' },
  { id: 'investment', label: 'Investment / Stock', icon: '📈', desc: 'Stocks, funds, crypto, business investment' },
  { id: 'business', label: 'Business Deal', icon: '🤝', desc: 'Partnership, sale, trade agreement' },
  { id: 'savings', label: 'Savings Account', icon: '🏦', desc: 'Bank account, fixed deposit, bonds' },
  { id: 'insurance', label: 'Insurance Policy', icon: '🛡️', desc: 'Life, health, car, home insurance' },
  { id: 'crypto', label: 'Cryptocurrency', icon: '₿', desc: 'Bitcoin, Ethereum, DeFi, staking' },
  { id: 'rent', label: 'Rental / Lease', icon: '🏢', desc: 'Property rental, car lease, equipment hire' },
];

type DealType = (typeof DEAL_TYPES)[number]; // ✅ new type

const QUESTIONS = {
  loan: [
    { id: 'interest', q: 'Does this loan charge interest (Riba)?', flag: true, weight: 10, tip: 'Any fixed charge on borrowed money is Riba — strictly forbidden in Islam.' },
    { id: 'compound', q: 'Is there compound interest involved?', flag: true, weight: 10, tip: 'Compound interest is considered even more severe than simple interest.' },
    { id: 'penalty', q: 'Are there late payment penalty fees that increase over time?', flag: true, weight: 7, tip: 'Escalating penalties can constitute Riba. Fixed admin fees are more permissible.' },
    { id: 'secured', q: 'Is the loan secured with a legitimate asset (collateral)?', flag: false, weight: 2, tip: 'Secured loans with asset-backing are generally more structured and transparent.' },
    { id: 'islamic', q: 'Is this offered by an Islamic finance institution?', flag: false, weight: 3, tip: 'Islamic banks use Murabaha, Musharakah, or Ijarah structures instead of interest.' },
  ],
  mortgage: [
    { id: 'interest', q: 'Does the mortgage charge interest (Riba)?', flag: true, weight: 10, tip: 'Conventional mortgages are Riba-based. Alternatives: Diminishing Musharakah or Ijarah.' },
    { id: 'islamic_structure', q: 'Is it structured as Murabaha or Diminishing Musharakah?', flag: false, weight: 5, tip: 'These Islamic structures allow home ownership without interest.' },
    { id: 'ownership', q: 'Do you own a share of the property from day one?', flag: false, weight: 3, tip: 'In Musharakah, both you and the bank own shares — you buy the bank\'s share over time.' },
    { id: 'penalty', q: 'Are there interest-based early repayment penalties?', flag: true, weight: 6, tip: 'Fixed admin fees are permissible; interest-based penalties are not.' },
    { id: 'insurance', q: 'Is mortgage insurance (PMI) mandatory with interest?', flag: true, weight: 4, tip: 'Takaful (Islamic insurance) is the halal alternative to conventional PMI.' },
  ],
  investment: [
    { id: 'haram_sector', q: 'Does the company operate in alcohol, gambling, pork, weapons, or adult content?', flag: true, weight: 10, tip: 'Investing in haram industries is forbidden regardless of profit.' },
    { id: 'debt_ratio', q: 'Does the company have debt exceeding 33% of its total assets?', flag: true, weight: 7, tip: 'High debt ratios indicate the company relies heavily on interest-based financing.' },
    { id: 'interest_income', q: 'Does the company earn more than 5% revenue from interest?', flag: true, weight: 8, tip: 'AAOIFI standard: interest income must be below 5% of total revenue.' },
    { id: 'shariah_screen', q: 'Has this investment been Shariah-screened by a scholar or board?', flag: false, weight: 5, tip: 'Look for MSCI Islamic Index, Dow Jones Islamic, or Amundi Islamic funds.' },
    { id: 'purification', q: 'Are you willing to purify haram income by donating it to charity?', flag: false, weight: 3, tip: 'If a tiny % of income is haram, scholars allow purification via sadaqah.' },
  ],
  business: [
    { id: 'riba', q: 'Does the deal involve any interest-based lending or borrowing?', flag: true, weight: 10, tip: 'Even if both parties agree, interest in a contract is not permissible.' },
    { id: 'gharar', q: 'Is there excessive uncertainty (Gharar) in the terms?', flag: true, weight: 8, tip: 'Contracts must be clear. Excessive ambiguity about price, delivery, or terms is Gharar.' },
    { id: 'maysir', q: 'Does profit depend entirely on chance (Maysir/gambling)?', flag: true, weight: 9, tip: 'Speculation without actual work or asset backing resembles gambling.' },
    { id: 'haram_product', q: 'Does the business sell or deal in haram products/services?', flag: true, weight: 10, tip: 'Trading in alcohol, pork, drugs, or immoral services is not permissible.' },
    { id: 'transparency', q: 'Are both parties fully aware of all terms and conditions?', flag: false, weight: 3, tip: 'Transparency (no hidden terms) is essential in Islamic contracts.' },
    { id: 'mutual_consent', q: 'Do both parties enter the deal with free and full consent?', flag: false, weight: 3, tip: 'Coercion invalidates a contract in Islamic law.' },
  ],
  savings: [
    { id: 'interest_earning', q: 'Does this account pay interest on your balance?', flag: true, weight: 10, tip: 'Interest-earning savings accounts are Riba. Use a current/checking account instead.' },
    { id: 'bonds', q: 'Does it involve government or corporate bonds?', flag: true, weight: 8, tip: 'Conventional bonds pay fixed interest — not permissible. Sukuk (Islamic bonds) are the alternative.' },
    { id: 'profit_sharing', q: 'Is it a profit-sharing account (Mudarabah)?', flag: false, weight: 5, tip: 'Mudarabah savings accounts share actual profit/loss — permissible in Islam.' },
    { id: 'islamic_bank', q: 'Is it with an Islamic bank or window?', flag: false, weight: 4, tip: 'Islamic banks are supervised by a Shariah board and avoid interest-based products.' },
  ],
  insurance: [
    { id: 'conventional', q: 'Is this a conventional insurance policy (not Takaful)?', flag: true, weight: 8, tip: 'Conventional insurance involves Gharar, Maysir, and Riba in investments.' },
    { id: 'takaful', q: 'Is this Takaful (mutual Islamic insurance)?', flag: false, weight: 6, tip: 'Takaful pools contributions for mutual benefit — permissible by most scholars.' },
    { id: 'investment_component', q: 'Does the policy invest premiums in interest-bearing instruments?', flag: true, weight: 7, tip: 'This is a common issue in life insurance policies — check the investment policy.' },
    { id: 'compulsory', q: 'Is this insurance legally required (e.g. car insurance by law)?', flag: false, weight: 3, tip: 'Scholars generally allow legally mandatory insurance under the principle of necessity (Darurah).' },
  ],
  crypto: [
    { id: 'utility', q: 'Does the cryptocurrency have a clear, legitimate utility or use case?', flag: false, weight: 4, tip: 'Currencies with real utility (payments, smart contracts) are viewed more favourably.' },
    { id: 'speculation', q: 'Are you buying purely for speculative price gain with no underlying value?', flag: true, weight: 8, tip: 'Pure speculation with no underlying asset or utility is close to Maysir (gambling).' },
    { id: 'staking_interest', q: 'Does it involve staking that pays fixed interest-like returns?', flag: true, weight: 7, tip: 'Fixed returns on staked crypto resemble Riba. Profit-sharing staking may be different.' },
    { id: 'defi_interest', q: 'Does it involve DeFi lending/borrowing with interest?', flag: true, weight: 9, tip: 'DeFi interest protocols are considered Riba by most scholars.' },
    { id: 'haram_platform', q: 'Is the platform used for gambling, adult content, or illegal activity?', flag: true, weight: 10, tip: 'Participating in or enabling haram activities via crypto is not permissible.' },
    { id: 'scholar_approval', q: 'Has a reputable scholar or Shariah board reviewed this specific crypto?', flag: false, weight: 3, tip: 'Look for fatawa from AAOIFI, Mufti Faraz Adam, or Mufti Menk on specific coins.' },
  ],
  rent: [
    { id: 'clear_terms', q: 'Are the rental amount, duration, and conditions clearly defined?', flag: false, weight: 3, tip: 'Clarity in contracts is required — vague rental terms involve Gharar.' },
    { id: 'ownership_risk', q: 'Does the owner bear the risks of ownership (maintenance, major repairs)?', flag: false, weight: 4, tip: 'In a valid Ijarah, the owner retains ownership responsibility.' },
    { id: 'interest_penalty', q: 'Are there interest-based late payment penalties?', flag: true, weight: 7, tip: 'Fixed late fees may be permissible; escalating interest-based charges are not.' },
    { id: 'haram_use', q: 'Will the rented property be used for haram purposes?', flag: true, weight: 10, tip: 'Renting to a business that sells alcohol or runs haram services is not permissible.' },
    { id: 'lease_to_own', q: 'If lease-to-own, is it structured as Ijarah wa Iqtina?', flag: false, weight: 4, tip: 'Ijarah wa Iqtina (lease ending in ownership transfer) is the halal alternative to interest-based hire purchase.' },
  ],
};

const ALTERNATIVES = {
  loan: ['Qard Hasan (interest-free loan from a Muslim)', 'Islamic microfinance institutions', 'Crowdfunding from family/community', 'Tawarruq (commodity murabaha) from Islamic bank'],
  mortgage: ['Diminishing Musharakah (shared ownership)', 'Murabaha home purchase', 'Ijarah (rent-to-own)', 'Islamic mortgage providers (e.g. Guidance Residential, LARIBA)'],
  investment: ['Shariah-screened ETFs (e.g. Wahed Invest, Amundi Islamic)', 'Sukuk (Islamic bonds)', 'Real estate (direct ownership)', 'Halal business partnerships (Musharakah)'],
  business: ['Murabaha (cost-plus sale)', 'Musharakah (profit-sharing partnership)', 'Mudarabah (silent partnership)', 'Salam / Istisna for advance purchase contracts'],
  savings: ['Current/checking account (no interest)', 'Mudarabah profit-sharing savings', 'Islamic bank accounts', 'Invest in halal assets instead'],
  insurance: ['Takaful providers (e.g. Salama, FWD Takaful)', 'Self-insurance (savings fund)', 'Community mutual aid funds', 'Use conventional only if legally mandatory (Darurah)'],
  crypto: ['Bitcoin (accepted by many scholars as currency)', 'Ethereum utility use cases', 'Halal crypto platforms (e.g. IslamicCoin, HAQQ)', 'Consult Mufti Faraz Adam\'s research'],
  rent: ['Standard Ijarah contract', 'Ijarah wa Iqtina (lease-to-own)', 'Ensure contract reviewed by Islamic lawyer', 'Avoid properties used for haram purposes'],
};

export default function HalalFinanceCheck() {
  const [dealType, setDealType] = useState<DealType | null>(null); // ✅ fixed type
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<any>(null);
  const [step, setStep] = useState<'select' | 'questions' | 'result'>('select');

  const selectDeal = (type: DealType) => { // ✅ fixed parameter type
    setDealType(type);
    setAnswers({});
    setResult(null);
    setStep('questions');
  };

  const answer = (id: string, val: boolean) => {
    setAnswers(prev => ({ ...prev, [id]: val }));
  };

  const calculateResult = () => {
    if (!dealType) return;
    const qs = QUESTIONS[dealType.id as keyof typeof QUESTIONS];
    let riskScore = 0;
    let maxScore = 0;
    const redFlags: string[] = [];
    const greenPoints: string[] = [];

    for (const q of qs) {
      const ans = answers[q.id];
      if (ans === undefined) continue;
      maxScore += q.weight;
      if (q.flag && ans === true) {
        riskScore += q.weight;
        redFlags.push(q.q);
      } else if (!q.flag && ans === true) {
        greenPoints.push(q.q);
      } else if (q.flag && ans === false) {
        greenPoints.push('No: ' + q.q);
      }
    }

    const pct = maxScore > 0 ? (riskScore / maxScore) * 100 : 0;
    let verdict: string, color: string, emoji: string;
    if (pct === 0) { verdict = 'Likely Halal'; color = '#059669'; emoji = '✅'; }
    else if (pct <= 25) { verdict = 'Mostly Halal — Minor Concerns'; color = '#10b981'; emoji = '🟡'; }
    else if (pct <= 60) { verdict = 'Questionable — Seek Scholar Advice'; color = '#d97706'; emoji = '⚠️'; }
    else { verdict = 'High Risk of Haram'; color = '#dc2626'; emoji = '🚫'; }

    setResult({ pct, verdict, color, emoji, redFlags, greenPoints, riskScore, maxScore });
    setStep('result');
  };

  const qs = dealType ? QUESTIONS[dealType.id as keyof typeof QUESTIONS] : [];
  const answered = qs.filter(q => answers[q.id] !== undefined).length;
  const allAnswered = answered === qs.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white font-serif">
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white px-5 py-4 shadow-lg sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {step !== 'select' ? (
            <button onClick={() => { setStep(step === 'result' ? 'questions' : 'select'); setResult(null); }}
              className="text-white/80 hover:text-white text-sm transition">
              ← Back
            </button>
          ) : (
            <Link href="/" className="text-white/80 hover:text-white text-sm transition">← Back</Link>
          )}
          <h1 className="text-xl font-bold tracking-wide">☪️ Halal Finance Check</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-12 space-y-5">
        {/* SELECT DEAL TYPE */}
        {step === 'select' && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
              <h2 className="text-2xl font-bold text-emerald-800 mb-2">Is It Halal?</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Answer a few questions about your financial deal to check for <strong>Riba</strong> (interest), <strong>Gharar</strong> (uncertainty), and <strong>Maysir</strong> (gambling).
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {DEAL_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => selectDeal(type)}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:border-emerald-200 hover:shadow-md transition-all group"
                >
                  <span className="text-4xl">{type.icon}</span>
                  <p className="font-semibold text-gray-800 text-base mt-2 group-hover:text-emerald-800">{type.label}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{type.desc}</p>
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 text-lg mb-4">The Three Prohibitions</h3>
              <div className="space-y-4">
                {[
                  { icon: '💸', term: 'Riba (ربا)', meaning: 'Interest / Usury', detail: 'Any fixed, predetermined return on a loan or debt. Strictly forbidden in Quran 2:275.' },
                  { icon: '🎲', term: 'Maysir (ميسر)', meaning: 'Gambling / Speculation', detail: 'Profit from chance alone with no productive effort or asset backing.' },
                  { icon: '🌫️', term: 'Gharar (غرر)', meaning: 'Excessive Uncertainty', detail: 'Contracts with ambiguous terms, hidden conditions, or unclear outcomes.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-3xl">{item.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800">{item.term}</p>
                        <span className="text-xs text-gray-400">— {item.meaning}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.detail}</p>
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
              <span className="text-4xl">{dealType.icon}</span>
              <div>
                <p className="font-semibold text-gray-800 text-lg">{dealType.label}</p>
                <p className="text-sm text-gray-500">{dealType.desc}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Questions answered</span>
                <span>{answered} / {qs.length}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-emerald-700 rounded-full transition-all duration-300"
                  style={{ width: `${(answered / qs.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-4">
              {qs.map((q, i) => {
                const hasAnswered = answers[q.id] !== undefined;
                const isYes = answers[q.id] === true;
                const isNo = answers[q.id] === false;
                return (
                  <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-all">
                    <div className="flex items-start gap-3 mb-4">
                      <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        hasAnswered ? 'bg-emerald-800 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-800 font-medium leading-relaxed flex-1">{q.q}</p>
                    </div>

                    <div className="flex gap-2 mb-3">
                      {[
                        { val: true, label: 'Yes' },
                        { val: false, label: 'No' },
                      ].map(opt => (
                        <button
                          key={String(opt.val)}
                          onClick={() => answer(q.id, opt.val)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                            hasAnswered && ((opt.val === true && isYes) || (opt.val === false && isNo))
                              ? opt.val === q.flag
                                ? 'border-red-300 bg-red-50 text-red-700'
                                : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {hasAnswered && (
                      <div className={`rounded-xl p-3 text-xs leading-relaxed ${
                        isYes === q.flag ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {isYes === q.flag ? '⚠️ ' : '✅ '}{q.tip}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={calculateResult}
              disabled={!allAnswered}
              className="w-full py-4 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
            >
              {allAnswered ? 'Get My Result ⚖️' : `Answer ${qs.length - answered} more question${qs.length - answered !== 1 ? 's' : ''}`}
            </button>
          </>
        )}

        {/* RESULT */}
        {step === 'result' && result && dealType && (
          <>
            <div
              className="rounded-2xl p-6 text-center text-white shadow-xl"
              style={{ background: `linear-gradient(135deg, ${result.color}ee, ${result.color}aa)` }}
            >
              <p className="text-5xl mb-3">{result.emoji}</p>
              <p className="text-2xl font-bold mb-1">{result.verdict}</p>
              <p className="text-white/80 text-sm">{dealType.label} — {result.pct.toFixed(0)}% risk score</p>

              <div className="mt-5 h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-3 rounded-full bg-white transition-all duration-500"
                  style={{ width: `${result.pct}%`, opacity: 0.9 }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>Halal</span>
                <span>Haram Risk</span>
              </div>
            </div>

            {result.redFlags.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-red-800 text-lg mb-3">🚩 Red Flags ({result.redFlags.length})</h3>
                <ul className="space-y-2 list-disc list-inside text-sm text-red-700">
                  {result.redFlags.map((flag: string, i: number) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.greenPoints.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-emerald-800 text-lg mb-3">✅ Positive Factors ({result.greenPoints.length})</h3>
                <ul className="space-y-2 list-disc list-inside text-sm text-emerald-700">
                  {result.greenPoints.map((pt: string, i: number) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 text-lg mb-3">💡 Halal Alternatives</h3>
              <div className="space-y-2">
                {ALTERNATIVES[dealType.id as keyof typeof ALTERNATIVES].map((alt, i) => (
                  <div key={i} className="flex gap-2 items-start text-sm text-gray-600">
                    <span className="text-emerald-600 font-bold mt-0.5">→</span>
                    <span>{alt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white rounded-2xl p-6 text-center shadow-md">
              <p className="text-2xl font-arabic mb-2">وَأَحَلَّ ٱللَّهُ ٱلْبَيْعَ وَحَرَّمَ ٱلرِّبَوٰا۟</p>
              <p className="text-white/70 text-sm italic">"Allah has permitted trade and forbidden interest" — Quran 2:275</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Disclaimer</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                This is a general screening tool, not a fatwa. Consult a qualified Islamic finance scholar for a binding ruling.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep('questions'); setResult(null); }}
                className="flex-1 py-4 rounded-2xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                ← Edit Answers
              </button>
              <button
                onClick={() => { setStep('select'); setDealType(null); setAnswers({}); setResult(null); }}
                className="flex-1 py-4 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold transition shadow-md"
              >
                Check Another Deal
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}