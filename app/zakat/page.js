'use client';
import { useState } from 'react';
import Link from 'next/link';

const GOLD_NISAB_GRAMS = 87.48;
const SILVER_NISAB_GRAMS = 612.36;
const GOLD_PRICE_PER_GRAM = 95; // USD approx - user can change
const SILVER_PRICE_PER_GRAM = 1.1;

export default function ZakatCalculator() {
  const [goldGrams, setGoldGrams] = useState('');
  const [silverGrams, setSilverGrams] = useState('');
  const [cash, setCash] = useState('');
  const [savings, setSavings] = useState('');
  const [investments, setInvestments] = useState('');
  const [businessAssets, setBusinessAssets] = useState('');
  const [debts, setDebts] = useState('');
  const [goldPrice, setGoldPrice] = useState(GOLD_PRICE_PER_GRAM);
  const [silverPrice, setSilverPrice] = useState(SILVER_PRICE_PER_GRAM);
  const [currency, setCurrency] = useState('USD');
  const [result, setResult] = useState(null);

  const calculate = () => {
    const goldValue = (parseFloat(goldGrams) || 0) * goldPrice;
    const silverValue = (parseFloat(silverGrams) || 0) * silverPrice;
    const cashValue = parseFloat(cash) || 0;
    const savingsValue = parseFloat(savings) || 0;
    const investmentsValue = parseFloat(investments) || 0;
    const businessValue = parseFloat(businessAssets) || 0;
    const debtsValue = parseFloat(debts) || 0;

    const totalAssets = goldValue + silverValue + cashValue + savingsValue + investmentsValue + businessValue;
    const zakatable = Math.max(0, totalAssets - debtsValue);

    const goldNisabValue = GOLD_NISAB_GRAMS * goldPrice;
    const silverNisabValue = SILVER_NISAB_GRAMS * silverPrice;
    const nisabValue = Math.min(goldNisabValue, silverNisabValue); // use lower (silver) for more inclusive

    const meetsNisab = zakatable >= nisabValue;
    const zakatDue = meetsNisab ? zakatable * 0.025 : 0;

    setResult({
      totalAssets: totalAssets.toFixed(2),
      zakatable: zakatable.toFixed(2),
      nisabValue: nisabValue.toFixed(2),
      meetsNisab,
      zakatDue: zakatDue.toFixed(2),
    });
  };

  const reset = () => {
    setGoldGrams(''); setSilverGrams(''); setCash('');
    setSavings(''); setInvestments(''); setBusinessAssets('');
    setDebts(''); setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header style={{ background: '#0a3d2e' }} className="px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
        <h1 className="text-white font-medium">Zakat Calculator</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl">💰</div>
            <div>
              <h2 className="font-semibold text-gray-800">Zakat Calculator</h2>
              <p className="text-sm text-gray-400">Based on 2.5% of zakatable wealth above nisab</p>
            </div>
          </div>

          {/* Currency & Prices */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Settings</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option>USD</option><option>GBP</option><option>EUR</option>
                  <option>PKR</option><option>SAR</option><option>AED</option>
                  <option>MYR</option><option>IDR</option><option>BDT</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Gold price/gram ({currency})</label>
                <input type="number" value={goldPrice} onChange={e => setGoldPrice(parseFloat(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Silver price/gram ({currency})</label>
                <input type="number" value={silverPrice} onChange={e => setSilverPrice(parseFloat(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          {/* Assets */}
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Your Assets</p>
          <div className="space-y-3 mb-6">
            {[
              { label: 'Gold owned (grams)', value: goldGrams, set: setGoldGrams, placeholder: 'e.g. 100' },
              { label: 'Silver owned (grams)', value: silverGrams, set: setSilverGrams, placeholder: 'e.g. 500' },
              { label: `Cash in hand (${currency})`, value: cash, set: setCash, placeholder: '0' },
              { label: `Bank savings (${currency})`, value: savings, set: setSavings, placeholder: '0' },
              { label: `Investments / stocks (${currency})`, value: investments, set: setInvestments, placeholder: '0' },
              { label: `Business assets (${currency})`, value: businessAssets, set: setBusinessAssets, placeholder: '0' },
            ].map(field => (
              <div key={field.label} className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-48 flex-shrink-0">{field.label}</label>
                <input
                  type="number"
                  value={field.value}
                  onChange={e => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>

          {/* Debts */}
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Deductions</p>
          <div className="flex items-center gap-3 mb-6">
            <label className="text-sm text-gray-600 w-48 flex-shrink-0">Debts / liabilities ({currency})</label>
            <input
              type="number"
              value={debts}
              onChange={e => setDebts(e.target.value)}
              placeholder="0"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={calculate}
              style={{ background: '#0a3d2e' }}
              className="flex-1 text-white rounded-xl py-3 font-medium hover:opacity-90 transition-opacity">
              Calculate Zakat
            </button>
            <button onClick={reset}
              className="px-5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
              Reset
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-2xl border p-6 ${result.meetsNisab ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <h3 className="font-semibold text-gray-800 mb-4">Your Zakat Result</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total assets</span>
                <span className="font-medium">{currency} {parseFloat(result.totalAssets).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">After deducting debts</span>
                <span className="font-medium">{currency} {parseFloat(result.zakatable).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Nisab threshold (silver)</span>
                <span className="font-medium">{currency} {parseFloat(result.nisabValue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Meets nisab?</span>
                <span className={`font-medium ${result.meetsNisab ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {result.meetsNisab ? '✅ Yes' : '❌ No'}
                </span>
              </div>
            </div>
            <div className={`rounded-xl p-4 text-center ${result.meetsNisab ? 'bg-emerald-600' : 'bg-amber-500'}`}>
              {result.meetsNisab ? (
                <>
                  <p className="text-white/70 text-sm mb-1">Zakat due (2.5%)</p>
                  <p className="text-white text-3xl font-bold">{currency} {parseFloat(result.zakatDue).toLocaleString()}</p>
                </>
              ) : (
                <p className="text-white font-medium">Your wealth is below the nisab threshold. No zakat is due.</p>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Note: This is an estimate. Please consult a scholar for your specific situation.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}