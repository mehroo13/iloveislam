'use client';
import { useState } from 'react';
import Link from 'next/link';

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
  const [dealType, setDealType] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [step, setStep] = useState('select'); // select | questions | result

  function selectDeal(type) {
    setDealType(type);
    setAnswers({});
    setResult(null);
    setStep('questions');
  }

  function answer(id, val) {
    setAnswers(prev => ({ ...prev, [id]: val }));
  }

  function calculateResult() {
    const qs = QUESTIONS[dealType.id];
    let riskScore = 0;
    let maxScore = 0;
    let redFlags = [];
    let greenPoints = [];

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
    let verdict, color, emoji;
    if (pct === 0) { verdict = 'Likely Halal'; color = '#0a3d2e'; emoji = '✅'; }
    else if (pct <= 25) { verdict = 'Mostly Halal — Minor Concerns'; color = '#2d8a5e'; emoji = '🟡'; }
    else if (pct <= 60) { verdict = 'Questionable — Seek Scholar Advice'; color = '#c8a96e'; emoji = '⚠️'; }
    else { verdict = 'High Risk of Haram'; color = '#c0392b'; emoji = '🚫'; }

    setResult({ pct, verdict, color, emoji, redFlags, greenPoints, riskScore, maxScore });
    setStep('result');
  }

  const qs = dealType ? QUESTIONS[dealType.id] : [];
  const answered = qs.filter(q => answers[q.id] !== undefined).length;
  const allAnswered = answered === qs.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #1a6b4a 100%)' }} className="px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {step !== 'select' ? (
            <button onClick={() => { setStep(step === 'result' ? 'questions' : 'select'); setResult(null); }}
              className="text-white/60 hover:text-white text-sm">← Back</button>
          ) : (
            <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
          )}
          <h1 className="text-white font-semibold">☪️ Halal Finance Check</h1>
          <div className="w-16" />
        </div>
        <p className="text-white/50 text-xs text-center mt-2">Check if a financial deal is Riba-free</p>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 pb-10 space-y-4">

        {/* SELECT DEAL TYPE */}
        {step === 'select' && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Answer a few questions about your financial deal to get an Islamic finance assessment. 
                This tool checks for Riba (interest), Gharar (uncertainty), and Maysir (gambling).
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {DEAL_TYPES.map(type => (
                <button key={type.id} onClick={() => selectDeal(type)}
                  className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:border-gray-300 hover:shadow-sm transition-all">
                  <span className="text-3xl">{type.icon}</span>
                  <p className="font-semibold text-gray-800 text-sm mt-2">{type.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{type.desc}</p>
                </button>
              ))}
            </div>

            {/* Three prohibitions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-3">The Three Prohibitions in Islamic Finance</p>
              <div className="space-y-3">
                {[
                  { icon: '💸', term: 'Riba (ربا)', meaning: 'Interest / Usury', detail: 'Any fixed, predetermined return on a loan or debt. Strictly forbidden in Quran 2:275.' },
                  { icon: '🎲', term: 'Maysir (ميسر)', meaning: 'Gambling / Speculation', detail: 'Profit from chance alone with no productive effort or asset backing.' },
                  { icon: '🌫️', term: 'Gharar (غرر)', meaning: 'Excessive Uncertainty', detail: 'Contracts with ambiguous terms, hidden conditions, or unclear outcomes.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">{item.term}</p>
                        <span className="text-xs text-gray-400">— {item.meaning}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
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
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <span className="text-3xl">{dealType.icon}</span>
              <div>
                <p className="font-semibold text-gray-800">{dealType.label}</p>
                <p className="text-xs text-gray-400">{dealType.desc}</p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Questions answered</span>
                <span>{answered} / {qs.length}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${(answered / qs.length) * 100}%`, background: '#0a3d2e' }} />
              </div>
            </div>

            <div className="space-y-3">
              {qs.map((q, i) => (
                <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${answers[q.id] !== undefined ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                      style={answers[q.id] !== undefined ? { background: '#0a3d2e' } : {}}>
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-800 font-medium leading-relaxed">{q.q}</p>
                  </div>

                  <div className="flex gap-2 mb-3">
                    {[{ val: true, label: 'Yes' }, { val: false, label: 'No' }].map(opt => (
                      <button key={String(opt.val)} onClick={() => answer(q.id, opt.val)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${answers[q.id] === opt.val
                          ? opt.val === q.flag ? 'border-red-300 text-red-700 bg-red-50' : 'border-emerald-300 text-emerald-700 bg-emerald-50'
                          : 'border-gray-100 text-gray-500 bg-gray-50 hover:border-gray-200'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {answers[q.id] !== undefined && (
                    <div className={`rounded-xl p-3 text-xs leading-relaxed ${answers[q.id] === q.flag ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {answers[q.id] === q.flag ? '⚠️' : '✅'} {q.tip}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={calculateResult} disabled={!allAnswered}
              className="w-full py-4 rounded-2xl text-white font-semibold disabled:opacity-40 transition-all"
              style={{ background: '#0a3d2e' }}>
              {allAnswered ? 'Get My Result ⚖️' : `Answer all ${qs.length - answered} remaining questions`}
            </button>
          </>
        )}

        {/* RESULT */}
        {step === 'result' && result && dealType && (
          <>
            {/* Verdict card */}
            <div className="rounded-2xl p-6 text-center text-white"
              style={{ background: `linear-gradient(135deg, ${result.color}, ${result.color}cc)` }}>
              <p className="text-5xl mb-3">{result.emoji}</p>
              <p className="text-2xl font-bold mb-1">{result.verdict}</p>
              <p className="text-white/70 text-sm">{dealType.label} — {result.pct.toFixed(0)}% risk score</p>

              {/* Risk meter */}
              <div className="mt-4 h-3 bg-white/20 rounded-full overflow-hidden">
                <div className="h-3 rounded-full transition-all bg-white"
                  style={{ width: `${result.pct}%`, opacity: 0.9 }} />
              </div>
              <div className="flex justify-between text-xs text-white/50 mt-1">
                <span>Halal</span>
                <span>Haram Risk</span>
              </div>
            </div>

            {/* Red flags */}
            {result.redFlags.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                <p className="font-semibold text-red-800 mb-3">🚩 Red Flags Found ({result.redFlags.length})</p>
                <div className="space-y-2">
                  {result.redFlags.map((flag, i) => (
                    <div key={i} className="flex gap-2 items-start text-sm text-red-700">
                      <span className="flex-shrink-0 mt-0.5">•</span>
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Green points */}
            {result.greenPoints.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                <p className="font-semibold text-emerald-800 mb-3">✅ Positive Factors ({result.greenPoints.length})</p>
                <div className="space-y-2">
                  {result.greenPoints.map((pt, i) => (
                    <div key={i} className="flex gap-2 items-start text-sm text-emerald-700">
                      <span className="flex-shrink-0 mt-0.5">•</span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Halal alternatives */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-3">💡 Halal Alternatives</p>
              <div className="space-y-2">
                {ALTERNATIVES[dealType.id].map((alt, i) => (
                  <div key={i} className="flex gap-2 items-start text-sm text-gray-600">
                    <span className="text-emerald-500 flex-shrink-0 mt-0.5 font-bold">→</span>
                    <span>{alt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scholar reminder */}
            <div style={{ background: 'linear-gradient(135deg, #0a3d2e, #1a5c3a)' }} className="rounded-2xl p-5 text-center">
              <p className="font-arabic text-xl text-white/80 mb-2">وَأَحَلَّ ٱللَّهُ ٱلْبَيْعَ وَحَرَّمَ ٱلرِّبَوٰا۟</p>
              <p className="text-white/60 text-xs italic">"Allah has permitted trade and forbidden interest" — Quran 2:275</p>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-medium text-amber-800 mb-1">⚠️ Disclaimer</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                This is a general screening tool, not a fatwa. Consult a qualified Islamic finance scholar 
                (e.g. AAOIFI-certified advisor, Mufti Faraz Adam, or your local Islamic centre) for a binding ruling.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setStep('questions'); setResult(null); }}
                className="flex-1 py-4 rounded-2xl border border-gray-200 text-gray-600 font-medium">
                ← Edit Answers
              </button>
              <button onClick={() => { setStep('select'); setDealType(null); setAnswers({}); setResult(null); }}
                className="flex-1 py-4 rounded-2xl text-white font-semibold"
                style={{ background: '#0a3d2e' }}>
                Check Another Deal
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}