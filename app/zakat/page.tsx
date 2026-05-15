'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ── CONSTANTS ──
const GOLD_NISAB_GRAMS = 87.48;
const SILVER_NISAB_GRAMS = 612.36;
const GRAMS_PER_TOLA = 11.6638;

const CURRENCIES: Record<string, { symbol: string; goldDefault: number; silverDefault: number }> = {
  USD: { symbol: '$', goldDefault: 98, silverDefault: 1.1 },
  GBP: { symbol: '£', goldDefault: 78, silverDefault: 0.87 },
  EUR: { symbol: '€', goldDefault: 91, silverDefault: 1.02 },
  AUD: { symbol: 'A$', goldDefault: 150, silverDefault: 1.68 },
  PKR: { symbol: '₨', goldDefault: 27300, silverDefault: 307 },
  SAR: { symbol: 'ر.س', goldDefault: 368, silverDefault: 4.13 },
  AED: { symbol: 'د.إ', goldDefault: 360, silverDefault: 4.04 },
  MYR: { symbol: 'RM', goldDefault: 459, silverDefault: 5.15 },
  IDR: { symbol: 'Rp', goldDefault: 1540000, silverDefault: 17300 },
  BDT: { symbol: '৳', goldDefault: 10800, silverDefault: 121 },
  TRY: { symbol: '₺', goldDefault: 3100, silverDefault: 35 },
};

const CURRENCY_KEYS = Object.keys(CURRENCIES);

const ASSET_FIELDS = [
  { key: 'gold', label: 'Gold owned', icon: '🥇', tip: 'All gold jewellery, coins, bars (excluding personal use jewellery in Hanafi)' },
  { key: 'silver', label: 'Silver owned', icon: '🥈', tip: 'Silver coins, bars, or silver held as savings' },
  { key: 'cash', label: 'Cash in hand', icon: '💵', tip: 'Physical cash at home or on your person' },
  { key: 'savings', label: 'Bank savings', icon: '🏦', tip: 'All bank accounts — current, savings, fixed deposit' },
  { key: 'investments', label: 'Investments', icon: '📈', tip: 'Stocks, mutual funds, crypto, bonds — use current market value' },
  { key: 'business', label: 'Business assets', icon: '🏢', tip: 'Inventory, trade goods, receivables — not fixed assets like machinery' },
  { key: 'loans', label: 'Loans given out', icon: '🤝', tip: 'Money you have lent to others that you expect back' },
  { key: 'other', label: 'Other assets', icon: '💎', tip: 'Any other wealth subject to zakat not listed above' },
] as const;

type AssetKey = (typeof ASSET_FIELDS)[number]['key'];
type Assets = Record<AssetKey, string>;

interface Result {
  totalAssets: number;
  goldValue: number;
  silverValue: number;
  zakatable: number;
  goldNisab: number;
  silverNisab: number;
  nisabUsed: number;
  nisabMethod: string;
  meetsNisab: boolean;
  zakatDue: number;
  debts: number;
}

export default function ZakatCalculator() {
  // State
  const [currency, setCurrency] = useState('USD');
  const [goldPrice, setGoldPrice] = useState(CURRENCIES.USD.goldDefault);
  const [silverPrice, setSilverPrice] = useState(CURRENCIES.USD.silverDefault);
  const [useLivePrices, setUseLivePrices] = useState(false);
  const [usdGoldPerGram, setUsdGoldPerGram] = useState<number | null>(null);
  const [usdSilverPerGram, setUsdSilverPerGram] = useState<number | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [assets, setAssets] = useState<Assets>({
    gold: '',
    silver: '',
    cash: '',
    savings: '',
    investments: '',
    business: '',
    loans: '',
    other: '',
  });
  const [goldInput, setGoldInput] = useState('');
  const [silverInput, setSilverInput] = useState('');
  const [goldUnit, setGoldUnit] = useState<'grams' | 'tola'>('grams');
  const [silverUnit, setSilverUnit] = useState<'grams' | 'tola'>('grams');
  const [debts, setDebts] = useState('');
  const [nisabMethod, setNisabMethod] = useState<'silver' | 'gold'>('silver');
  const [result, setResult] = useState<Result | null>(null);
  const [showTip, setShowTip] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fetchingPrices, setFetchingPrices] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const sym = CURRENCIES[currency]?.symbol || '$';

  // Derived grams from inputs
  const goldGrams = goldInput
    ? goldUnit === 'tola'
      ? parseFloat(goldInput) * GRAMS_PER_TOLA
      : parseFloat(goldInput)
    : 0;

  const silverGrams = silverInput
    ? silverUnit === 'tola'
      ? parseFloat(silverInput) * GRAMS_PER_TOLA
      : parseFloat(silverInput)
    : 0;

  // Update assets when inputs change (for calculation consistency)
  useEffect(() => {
    setAssets((prev) => ({
      ...prev,
      gold: goldGrams.toString(),
      silver: silverGrams.toString(),
    }));
  }, [goldGrams, silverGrams]);

  // Auto-update prices when live mode is on and currency changes
  useEffect(() => {
    if (useLivePrices && usdGoldPerGram !== null && usdSilverPerGram !== null && exchangeRates) {
      const rate = exchangeRates[currency] || 1;
      setGoldPrice(parseFloat((usdGoldPerGram * rate).toFixed(2)));
      setSilverPrice(parseFloat((usdSilverPerGram * rate).toFixed(2)));
    }
  }, [currency, useLivePrices, usdGoldPerGram, usdSilverPerGram, exchangeRates]);

  // Reset live prices if user turns off live mode
  useEffect(() => {
    if (!useLivePrices) {
      // Reset to defaults based on currency
      setGoldPrice(CURRENCIES[currency]?.goldDefault || 98);
      setSilverPrice(CURRENCIES[currency]?.silverDefault || 1.1);
    }
  }, [useLivePrices, currency]);

  // Fetch live gold/silver + exchange rates
  const fetchLivePrices = useCallback(async () => {
    setFetchingPrices(true);
    try {
      // Fetch spot prices in USD per troy ounce
      const metalsRes = await fetch('https://api.metals.live/v1/spot/gold,silver');
      const metalsData = await metalsRes.json();
      if (metalsData?.gold && metalsData?.silver) {
        const goldPerGram = parseFloat((metalsData.gold / 31.1035).toFixed(2));
        const silverPerGram = parseFloat((metalsData.silver / 31.1035).toFixed(2));
        setUsdGoldPerGram(goldPerGram);
        setUsdSilverPerGram(silverPerGram);
      } else {
        // Fallback to defaults
        alert('Could not fetch live metal prices. Using default values.');
        setUseLivePrices(false);
        setFetchingPrices(false);
        return;
      }

      // Fetch exchange rates (USD base)
      const forexRes = await fetch('https://open.er-api.com/v6/latest/USD');
      const forexData = await forexRes.json();
      if (forexData?.rates) {
        setExchangeRates(forexData.rates);
      } else {
        // Fallback: only USD available
        setExchangeRates({ USD: 1 });
      }

      setUseLivePrices(true);
    } catch {
      alert('Network error while fetching live prices. Please try again.');
      setUseLivePrices(false);
    }
    setFetchingPrices(false);
  }, []);

  // Handle asset input changes
  function setAsset(key: AssetKey, val: string) {
    if (key === 'gold') setGoldInput(val);
    else if (key === 'silver') setSilverInput(val);
    else setAssets((prev) => ({ ...prev, [key]: val }));
  }

  // Unit toggle handlers
  const toggleGoldUnit = () => {
    if (goldInput) {
      // Convert existing input value to new unit
      const currentGrams = goldGrams;
      const newUnit = goldUnit === 'grams' ? 'tola' : 'grams';
      const newValue = newUnit === 'tola' ? currentGrams / GRAMS_PER_TOLA : currentGrams;
      setGoldInput(newValue ? newValue.toFixed(2) : '');
    }
    setGoldUnit((prev) => (prev === 'grams' ? 'tola' : 'grams'));
  };

  const toggleSilverUnit = () => {
    if (silverInput) {
      const currentGrams = silverGrams;
      const newUnit = silverUnit === 'grams' ? 'tola' : 'grams';
      const newValue = newUnit === 'tola' ? currentGrams / GRAMS_PER_TOLA : currentGrams;
      setSilverInput(newValue ? newValue.toFixed(2) : '');
    }
    setSilverUnit((prev) => (prev === 'grams' ? 'tola' : 'grams'));
  };

  // Calculate
  function calculate() {
    const goldVal = goldGrams * goldPrice;
    const silverVal = silverGrams * silverPrice;
    const cashVal = parseFloat(assets.cash) || 0;
    const savingsVal = parseFloat(assets.savings) || 0;
    const investVal = parseFloat(assets.investments) || 0;
    const bizVal = parseFloat(assets.business) || 0;
    const loansVal = parseFloat(assets.loans) || 0;
    const otherVal = parseFloat(assets.other) || 0;
    const debtsVal = parseFloat(debts) || 0;

    const total = goldVal + silverVal + cashVal + savingsVal + investVal + bizVal + loansVal + otherVal;
    const zakatable = Math.max(0, total - debtsVal);

    const goldNisab = GOLD_NISAB_GRAMS * goldPrice;
    const silverNisab = SILVER_NISAB_GRAMS * silverPrice;
    const chosenNisab = nisabMethod === 'silver' ? silverNisab : goldNisab;

    const meets = zakatable >= chosenNisab;
    const due = meets ? zakatable * 0.025 : 0;

    setResult({
      totalAssets: total,
      goldValue: goldVal,
      silverValue: silverVal,
      zakatable,
      goldNisab,
      silverNisab,
      nisabUsed: chosenNisab,
      nisabMethod: nisabMethod === 'silver' ? 'Silver (more inclusive)' : 'Gold',
      meetsNisab: meets,
      zakatDue: due,
      debts: debtsVal,
    });

    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  function reset() {
    setGoldInput('');
    setSilverInput('');
    setGoldUnit('grams');
    setSilverUnit('grams');
    setAssets({ gold: '', silver: '', cash: '', savings: '', investments: '', business: '', loans: '', other: '' });
    setDebts('');
    setResult(null);
    setUseLivePrices(false);
  }

  // Share / Print functions (unchanged, using sym and fmt)
  function handleShare() {
    if (!result) return;
    const text = `📊 My Zakat Calculation — I Love Islam\n\n` +
      `Total Assets: ${sym}${fmt(result.totalAssets)}\n` +
      `After Debts: ${sym}${fmt(result.zakatable)}\n` +
      `Nisab (${result.nisabMethod}): ${sym}${fmt(result.nisabUsed)}\n` +
      `Meets Nisab: ${result.meetsNisab ? '✅ Yes' : '❌ No'}\n` +
      (result.meetsNisab ? `\n💰 Zakat Due (2.5%): ${sym}${fmt(result.zakatDue)}\n` : '\nNo zakat is due.\n') +
      `\nCalculated at iloveislam.life/zakat\nJazakAllah Khair 🤲`;

    if (navigator.share && /Mobi/i.test(navigator.userAgent)) {
      navigator.share({ title: 'My Zakat Calculation', text });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    }
  }

  function handlePrint() {
    window.print();
  }

  function fmt(n: number) {
    if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const progressPct = result ? Math.min((result.zakatable / result.nisabUsed) * 100, 100) : 0;

  return (
    <div className="min-h-screen" style={{ background: '#f5f3ed' }}>
      <style>{`
        @media print {
          header, .no-print { display: none !important; }
          .print-area { box-shadow: none !important; }
          body { background: white !important; }
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease-out forwards; }
        input:focus { outline: none; border-color: #0a3d2e !important; }
        select:focus { outline: none; }
        .tooltip { position: relative; }
        .tooltip:hover .tip-box { display: block; }
        .tip-box { display: none; position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: #1a1a1a; color: #fff; font-size: 11px; padding: 8px 12px; border-radius: 8px; width: 220px; z-index: 100; line-height: 1.5; white-space: normal; text-align: left; }
        .tip-box::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: #1a1a1a; }
      `}</style>

      {/* Header */}
      <header className="no-print" style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #0d5238 100%)', padding: '16px 20px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none' }}>← Back</Link>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0 }}>💰 Zakat Calculator</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>2.5% of zakatable wealth above nisab</p>
          </div>
          <div style={{ width: 60 }} />
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 14px 60px' }}>

        {/* ── SETTINGS CARD ── */}
        <div className="no-print" style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8e0cc', padding: '20px 22px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a', margin: 0 }}>⚙️ Settings</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="checkbox"
                  checked={useLivePrices}
                  onChange={(e) => {
                    if (e.target.checked) {
                      fetchLivePrices();
                    } else {
                      setUseLivePrices(false);
                    }
                  }}
                />
                <span style={{ color: '#0a3d2e', fontWeight: 600 }}>Live prices</span>
              </label>
              <button
                onClick={fetchLivePrices}
                disabled={fetchingPrices}
                style={{
                  fontSize: 11,
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: '1px solid #0a3d2e',
                  color: '#0a3d2e',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {fetchingPrices ? '⏳ Fetching...' : '🔄 Refresh'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{ width: '100%', border: '1px solid #e0d8c8', borderRadius: 10, padding: '9px 12px', fontSize: 13, background: '#fafaf7', color: '#1a1a1a' }}
              >
                {CURRENCY_KEYS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>
                Gold price/gram ({sym})
              </label>
              <input
                type="number"
                value={goldPrice}
                onChange={(e) => {
                  setGoldPrice(parseFloat(e.target.value) || 0);
                  setUseLivePrices(false); // manual override turns off live
                }}
                disabled={useLivePrices}
                style={{
                  width: '100%',
                  border: '1px solid #e0d8c8',
                  borderRadius: 10,
                  padding: '9px 12px',
                  fontSize: 13,
                  background: useLivePrices ? '#f0f0f0' : '#fafaf7',
                  color: '#1a1a1a',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>
                Silver price/gram ({sym})
              </label>
              <input
                type="number"
                value={silverPrice}
                onChange={(e) => {
                  setSilverPrice(parseFloat(e.target.value) || 0);
                  setUseLivePrices(false);
                }}
                disabled={useLivePrices}
                style={{
                  width: '100%',
                  border: '1px solid #e0d8c8',
                  borderRadius: 10,
                  padding: '9px 12px',
                  fontSize: 13,
                  background: useLivePrices ? '#f0f0f0' : '#fafaf7',
                  color: '#1a1a1a',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Nisab method */}
          <div>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 8 }}>Nisab calculation method</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {(
                [
                  ['silver', '🥈 Silver nisab', `${sym}${fmt(SILVER_NISAB_GRAMS * silverPrice)} — most scholars recommend`],
                  ['gold', '🥇 Gold nisab', `${sym}${fmt(GOLD_NISAB_GRAMS * goldPrice)} — higher threshold`],
                ] as const
              ).map(([val, label, sub]) => (
                <button
                  key={val}
                  onClick={() => setNisabMethod(val)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: `1.5px solid ${nisabMethod === val ? '#0a3d2e' : '#e0d8c8'}`,
                    background: nisabMethod === val ? '#f0faf5' : '#fafaf7',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 600, color: nisabMethod === val ? '#0a3d2e' : '#555', margin: 0 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 10, color: nisabMethod === val ? '#0a3d2e99' : '#aaa', margin: '2px 0 0' }}>
                    {sub}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── ASSETS CARD ── */}
        <div className="no-print" style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8e0cc', padding: '20px 22px', marginBottom: 14 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a', margin: '0 0 16px' }}>📦 Your Assets</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ASSET_FIELDS.map((field) => {
              const isGoldOrSilver = field.key === 'gold' || field.key === 'silver';
              const isGold = field.key === 'gold';
              const unit = isGold ? goldUnit : silverUnit;
              const toggleUnit = isGold ? toggleGoldUnit : toggleSilverUnit;
              const inputValue = isGold ? goldInput : silverInput;
              const inputHandler = (e: React.ChangeEvent<HTMLInputElement>) =>
                setAsset(field.key, e.target.value);

              return (
                <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="tooltip" style={{ flexShrink: 0 }}>
                    <span style={{ fontSize: 20, cursor: 'help' }}>{field.icon}</span>
                    <div className="tip-box">{field.tip}</div>
                  </div>
                  <label style={{ fontSize: 13, color: '#444', flex: 1, minWidth: 0 }}>
                    {field.label}
                    {isGoldOrSilver ? null : <span style={{ color: '#aaa', fontSize: 11 }}> ({sym})</span>}
                  </label>
                  <div style={{ position: 'relative', width: 140, flexShrink: 0, display: 'flex', gap: 4 }}>
                    {!isGoldOrSilver && (
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#aaa' }}>{sym}</span>
                    )}
                    <input
                      type="number"
                      value={isGoldOrSilver ? inputValue : assets[field.key]}
                      onChange={inputHandler}
                      placeholder="0"
                      style={{
                        width: isGoldOrSilver ? '100%' : 'calc(100% - 60px)',
                        border: '1px solid #e0d8c8',
                        borderRadius: 10,
                        padding: isGoldOrSilver ? '9px 12px' : '9px 12px 9px 28px',
                        fontSize: 13,
                        background: '#fafaf7',
                        color: '#1a1a1a',
                        boxSizing: 'border-box',
                        textAlign: 'right',
                      }}
                    />
                    {isGoldOrSilver && (
                      <select
                        value={unit}
                        onChange={toggleUnit}
                        style={{
                          border: '1px solid #e0d8c8',
                          borderRadius: 10,
                          padding: '9px 4px',
                          fontSize: 12,
                          background: '#fafaf7',
                          color: '#1a1a1a',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="grams">g</option>
                        <option value="tola">tola</option>
                      </select>
                    )}
                  </div>
                  {isGoldOrSilver && inputValue && (
                    <span style={{ fontSize: 11, color: '#0a3d2e', width: 80, textAlign: 'right', flexShrink: 0 }}>
                      ≈ {sym}{fmt((isGold ? goldGrams * goldPrice : silverGrams * silverPrice))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── DEBTS CARD ── */}
        <div className="no-print" style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8e0cc', padding: '20px 22px', marginBottom: 14 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a', margin: '0 0 4px' }}>📉 Deductions</p>
          <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 14px' }}>Immediate debts payable within the year</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>💳</span>
            <label style={{ fontSize: 13, color: '#444', flex: 1 }}>Debts & liabilities ({sym})</label>
            <div style={{ position: 'relative', width: 140 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#aaa' }}>{sym}</span>
              <input
                type="number"
                value={debts}
                onChange={(e) => setDebts(e.target.value)}
                placeholder="0"
                style={{ width: '100%', border: '1px solid #e0d8c8', borderRadius: 10, padding: '9px 12px 9px 28px', fontSize: 13, background: '#fafaf7', color: '#1a1a1a', boxSizing: 'border-box', textAlign: 'right' }}
              />
            </div>
          </div>
        </div>

        {/* ── BUTTONS ── */}
        <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button onClick={calculate}
            style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #0a3d2e, #0d5238)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.03em' }}>
            Calculate My Zakat ⚖️
          </button>
          <button onClick={reset}
            style={{ padding: '14px 20px', borderRadius: 14, border: '1px solid #e0d8c8', background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>
            Reset
          </button>
        </div>

        {/* ── RESULT ── (unchanged but works with new data) */}
        {result && (
          <div ref={resultRef} className="fade-up print-area" style={{ background: '#fff', borderRadius: 24, border: `2px solid ${result.meetsNisab ? '#0a3d2e' : '#d97706'}`, overflow: 'hidden', marginBottom: 16 }}>
            {/* Same result JSX as before, no changes needed */}
            <div style={{ background: result.meetsNisab ? 'linear-gradient(135deg, #0a3d2e, #0d5238)' : 'linear-gradient(135deg, #92400e, #b45309)', padding: '24px 24px 20px', textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                {result.meetsNisab ? 'Zakat is Obligatory' : 'Below Nisab Threshold'}
              </p>
              {result.meetsNisab ? (
                <>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 4px' }}>Zakat Due (2.5%)</p>
                  <p style={{ color: '#fff', fontSize: 44, fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>
                    {sym}{fmt(result.zakatDue)}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '6px 0 0' }}>
                    Based on {sym}{fmt(result.zakatable)} zakatable wealth
                  </p>
                </>
              ) : (
                <>
                  <p style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>No Zakat Due</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '8px 0 0' }}>
                    Your wealth ({sym}{fmt(result.zakatable)}) is below the nisab of {sym}{fmt(result.nisabUsed)}
                  </p>
                </>
              )}
              <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.15)', borderRadius: 20, height: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 20, background: result.meetsNisab ? '#c8a96e' : '#fbbf24', width: `${progressPct}%`, transition: 'width 1s ease' }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '5px 0 0' }}>
                {progressPct >= 100 ? '100% — Nisab reached' : `${progressPct.toFixed(1)}% toward nisab`}
              </p>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 14px' }}>Breakdown</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { label: 'Gold value', val: result.goldValue, show: result.goldValue > 0 },
                  { label: 'Silver value', val: result.silverValue, show: result.silverValue > 0 },
                  { label: 'Total assets', val: result.totalAssets, bold: true },
                  { label: 'Less: debts & liabilities', val: -result.debts, show: result.debts > 0, neg: true },
                  { label: 'Net zakatable wealth', val: result.zakatable, bold: true, highlight: true },
                  { label: `Nisab threshold (${result.nisabMethod})`, val: result.nisabUsed, sub: true },
                ].filter((r) => r.show !== false).map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', borderRadius: 10,
                    background: row.highlight ? '#f0faf5' : i % 2 === 0 ? '#fafaf7' : '#fff',
                    border: row.highlight ? '1px solid #c8e6c9' : '1px solid transparent',
                  }}>
                    <span style={{ fontSize: 13, color: row.bold ? '#1a1a1a' : '#666', fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: row.bold ? 700 : 500, color: row.highlight ? '#0a3d2e' : row.neg ? '#dc2626' : '#1a1a1a' }}>
                      {row.neg ? '−' : ''}{sym}{fmt(Math.abs(row.val))}
                    </span>
                  </div>
                ))}
              </div>
              {result.meetsNisab && (
                <div style={{ marginTop: 14, background: '#f0faf5', border: '1px solid #0a3d2e33', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: '#0a3d2e88', margin: '0 0 4px' }}>ZAKAT DUE = Net Zakatable Wealth × 2.5%</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#0a3d2e', margin: 0 }}>
                    {sym}{fmt(result.zakatable)} × 2.5% = {sym}{fmt(result.zakatDue)}
                  </p>
                </div>
              )}
              {result.meetsNisab && (
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { label: 'Pay at once', val: result.zakatDue },
                    { label: 'Per month', val: result.zakatDue / 12 },
                    { label: 'Per week', val: result.zakatDue / 52 },
                  ].map((item) => (
                    <div key={item.label} style={{ background: '#f8f6f0', borderRadius: 12, padding: '12px', textAlign: 'center', border: '1px solid #e8e0cc' }}>
                      <p style={{ fontSize: 10, color: '#aaa', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.label}</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#0a3d2e', margin: 0 }}>{sym}{fmt(item.val)}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="no-print" style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={handleShare}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: copied ? '#059669' : 'linear-gradient(135deg, #0a3d2e, #0d5238)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {copied ? '✅ Copied to clipboard!' : '📤 Share My Zakat'}
                </button>
                <button onClick={handlePrint}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #e0d8c8', background: '#fff', color: '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  🖨️ Save as PDF
                </button>
              </div>
              {copied && (
                <p style={{ textAlign: 'center', fontSize: 11, color: '#aaa', marginTop: 6 }}>Paste it in WhatsApp, email, or anywhere!</p>
              )}
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12 }}>
                <p style={{ fontSize: 11, color: '#92400e', margin: 0, lineHeight: 1.6 }}>
                  ⚠️ <strong>Disclaimer:</strong> This calculator provides an estimate based on majority Sunni (Hanafi) fiqh. Gold and silver prices are approximations. Please verify current prices and consult a qualified Islamic scholar for your specific situation. Prices last updated: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}.
                </p>
              </div>
              <div style={{ marginTop: 12, textAlign: 'center', padding: '14px', background: 'linear-gradient(135deg, #0a3d2e, #0d5238)', borderRadius: 14 }}>
                <p style={{ fontFamily: 'serif', fontSize: 20, color: '#c8a96e', margin: '0 0 6px', lineHeight: 1.8 }}>
                  اللَّهُمَّ تَقَبَّلْ مِنِّي
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>
                  O Allah, accept from me — Ameen 🤲
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info card (unchanged) */}
        <div className="no-print" style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8e0cc', padding: '18px 22px' }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a', margin: '0 0 12px' }}>📚 About Zakat</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '📐', title: 'Nisab (Minimum Threshold)', body: 'Zakat is only due when your net wealth exceeds the nisab for a full lunar year (hawl). Silver nisab is ~612g; gold nisab is ~87.5g.' },
              { icon: '💸', title: 'Rate', body: 'The Zakat rate is 2.5% (1/40th) of your total zakatable wealth above the nisab.' },
              { icon: '🤝', title: 'Who receives Zakat?', body: 'The 8 categories in Quran 9:60: the poor, the needy, Zakat administrators, those whose hearts are to be reconciled, freeing captives, those in debt, for the sake of Allah, and wayfarers.' },
              { icon: '📅', title: 'When to pay?', body: 'Once a full lunar year (354 days) has passed with your wealth above nisab. Many Muslims pay in Ramadan for the multiplied reward.' },
            ].map((item) => (
              <div key={item.title} style={{ display: 'flex', gap: 12, padding: '10px 12px', background: '#fafaf7', borderRadius: 12 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', margin: '0 0 2px' }}>{item.title}</p>
                  <p style={{ fontSize: 11, color: '#888', margin: 0, lineHeight: 1.6 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}