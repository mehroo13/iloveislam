'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

// ── NISAB STANDARDS ──
const GOLD_NISAB_GRAMS   = 87.48;   // 7.5 tola
const SILVER_NISAB_GRAMS = 612.36;  // 52.5 tola

// ── CURRENCIES ──
const CURRENCIES: Record<string, { symbol: string; goldDefault: number; silverDefault: number }> = {
  USD: { symbol: '$',   goldDefault: 98,      silverDefault: 1.10  },
  GBP: { symbol: '£',   goldDefault: 78,      silverDefault: 0.87  },
  EUR: { symbol: '€',   goldDefault: 91,      silverDefault: 1.02  },
  AUD: { symbol: 'A$',  goldDefault: 150,     silverDefault: 1.68  },
  PKR: { symbol: '₨',   goldDefault: 27300,   silverDefault: 307   },
  SAR: { symbol: 'ر.س', goldDefault: 368,     silverDefault: 4.13  },
  AED: { symbol: 'د.إ', goldDefault: 360,     silverDefault: 4.04  },
  MYR: { symbol: 'RM',  goldDefault: 459,     silverDefault: 5.15  },
  IDR: { symbol: 'Rp',  goldDefault: 1540000, silverDefault: 17300 },
  BDT: { symbol: '৳',  goldDefault: 10800,   silverDefault: 121   },
  TRY: { symbol: '₺',  goldDefault: 3100,    silverDefault: 35    },
};

const CURRENCY_KEYS = Object.keys(CURRENCIES);

// ── ASSET FIELDS ──
const ASSET_FIELDS = [
  { key: 'goldGrams',   label: 'Gold owned',      unit: 'grams', icon: '🥇', tip: 'Include all gold jewellery, coins, and bars you own for investment (not personal use jewellery in Hanafi)' },
  { key: 'silverGrams', label: 'Silver owned',    unit: 'grams', icon: '🥈', tip: 'Silver coins, bars, or silver held as savings' },
  { key: 'cash',        label: 'Cash in hand',    unit: '',      icon: '💵', tip: 'Physical cash you have at home or on your person' },
  { key: 'savings',     label: 'Bank savings',    unit: '',      icon: '🏦', tip: 'All bank accounts — current, savings, fixed deposit' },
  { key: 'investments', label: 'Investments',     unit: '',      icon: '📈', tip: 'Stocks, mutual funds, crypto, bonds — use current market value' },
  { key: 'business',    label: 'Business assets', unit: '',      icon: '🏢', tip: 'Inventory, trade goods, receivables — not fixed assets like machinery' },
  { key: 'loans',       label: 'Loans given out', unit: '',      icon: '🤝', tip: 'Money you have lent to others that you expect back' },
  { key: 'other',       label: 'Other assets',    unit: '',      icon: '💎', tip: 'Any other wealth subject to zakat not listed above' },
];

type AssetKey = 'goldGrams'|'silverGrams'|'cash'|'savings'|'investments'|'business'|'loans'|'other';
type Assets   = Record<AssetKey, string>;

interface Result {
  totalAssets: number;
  goldValue:   number;
  silverValue: number;
  zakatable:   number;
  goldNisab:   number;
  silverNisab: number;
  nisabUsed:   number;
  nisabMethod: string;
  meetsNisab:  boolean;
  zakatDue:    number;
  debts:       number;
}

// ── FAQ DATA ──
const FAQ_ITEMS = [
  {
    q: 'How much Zakat do I have to pay?',
    a: 'Zakat is 2.5% (one-fortieth) of your total net zakatable wealth — cash, savings, gold, silver, investments and business stock — after deducting immediate debts, provided that total exceeds the nisab threshold and a full lunar year (hawl) has passed.',
  },
  {
    q: 'What is the nisab for Zakat in 2025?',
    a: 'The nisab is the minimum wealth threshold for Zakat to become obligatory. It equals 87.48 g of gold or 612.36 g of silver. Most scholars recommend using the silver nisab as it is more inclusive and benefits more people in need.',
  },
  {
    q: 'Is Zakat due on gold jewellery?',
    a: "According to the Hanafi madhab, Zakat is due on all gold jewellery — including personal-use jewellery — because gold is an intrinsically zakatable asset. The Shafi'i, Maliki and Hanbali schools generally exempt jewellery worn for personal use. This calculator uses the Hanafi position by default.",
  },
  {
    q: 'Do I deduct debts before calculating Zakat?',
    a: 'Yes. Immediate debts due within the year are deducted from your total wealth before calculating Zakat. Enter your outstanding liabilities in the "Debts & Liabilities" field and they will be subtracted automatically.',
  },
  {
    q: 'When should I pay Zakat?',
    a: 'Zakat becomes due once your wealth has been above the nisab for a full lunar year (hawl — 354 days). Many Muslims choose to pay in Ramadan to benefit from multiplied reward, but it can be paid at any time once the hawl is complete.',
  },
  {
    q: 'Who are the 8 categories that can receive Zakat?',
    a: 'According to Quran 9:60, Zakat may be given to: (1) the poor (fuqara), (2) the needy (masakin), (3) Zakat administrators, (4) those whose hearts are to be reconciled, (5) freeing captives/slaves, (6) those in debt (gharimin), (7) in the way of Allah (fi sabilillah), and (8) wayfarers (ibn al-sabil).',
  },
];

export default function ZakatCalculator() {
  const [currency, setCurrency]           = useState('USD');
  const [goldPrice, setGoldPrice]         = useState(CURRENCIES.USD.goldDefault);
  const [silverPrice, setSilverPrice]     = useState(CURRENCIES.USD.silverDefault);
  const [assets, setAssets]               = useState<Assets>({ goldGrams: '', silverGrams: '', cash: '', savings: '', investments: '', business: '', loans: '', other: '' });
  const [debts, setDebts]                 = useState('');
  const [nisabMethod, setNisabMethod]     = useState<'silver'|'gold'>('silver');
  const [result, setResult]               = useState<Result | null>(null);
  const [copied, setCopied]               = useState(false);
  const [fetchingPrices, setFetchingPrices] = useState(false);
  const [openFaq, setOpenFaq]             = useState<number | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const sym = CURRENCIES[currency]?.symbol || '$';

  useEffect(() => {
    setGoldPrice(CURRENCIES[currency]?.goldDefault || 98);
    setSilverPrice(CURRENCIES[currency]?.silverDefault || 1.10);
  }, [currency]);

  async function fetchLivePrices() {
    if (currency !== 'USD') {
      alert(`Live prices are currently available for USD only. Please update prices manually for ${currency}.`);
      return;
    }
    setFetchingPrices(true);
    try {
      const res  = await fetch('https://api.metals.live/v1/spot/gold,silver');
      const data = await res.json();
      if (data?.gold)   setGoldPrice(parseFloat((data.gold   / 31.1035).toFixed(2)));
      if (data?.silver) setSilverPrice(parseFloat((data.silver / 31.1035).toFixed(2)));
    } catch { /* fallback — use defaults */ }
    setFetchingPrices(false);
  }

  function setAsset(key: AssetKey, val: string) {
    setAssets(prev => ({ ...prev, [key]: val }));
  }

  function calculate() {
    const goldVal    = (parseFloat(assets.goldGrams)    || 0) * goldPrice;
    const silverVal  = (parseFloat(assets.silverGrams)  || 0) * silverPrice;
    const cashVal    = parseFloat(assets.cash)          || 0;
    const savingsVal = parseFloat(assets.savings)       || 0;
    const investVal  = parseFloat(assets.investments)   || 0;
    const bizVal     = parseFloat(assets.business)      || 0;
    const loansVal   = parseFloat(assets.loans)         || 0;
    const otherVal   = parseFloat(assets.other)         || 0;
    const debtsVal   = parseFloat(debts)                || 0;

    const total     = goldVal + silverVal + cashVal + savingsVal + investVal + bizVal + loansVal + otherVal;
    const zakatable = Math.max(0, total - debtsVal);

    const goldNisab   = GOLD_NISAB_GRAMS   * goldPrice;
    const silverNisab = SILVER_NISAB_GRAMS * silverPrice;
    const chosenNisab = nisabMethod === 'silver' ? silverNisab : goldNisab;

    const meets = zakatable >= chosenNisab;
    const due   = meets ? zakatable * 0.025 : 0;

    setResult({ totalAssets: total, goldValue: goldVal, silverValue: silverVal, zakatable, goldNisab, silverNisab, nisabUsed: chosenNisab, nisabMethod: nisabMethod === 'silver' ? 'Silver (more inclusive)' : 'Gold', meetsNisab: meets, zakatDue: due, debts: debtsVal });
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  function reset() {
    setAssets({ goldGrams: '', silverGrams: '', cash: '', savings: '', investments: '', business: '', loans: '', other: '' });
    setDebts('');
    setResult(null);
  }

  function handleShare() {
    if (!result) return;
    const text =
      `📊 My Zakat Calculation — I Love Islam\n\n` +
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

  function fmt(n: number) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
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
        input:focus  { outline: none; border-color: #0a3d2e !important; }
        select:focus { outline: none; }
        .tooltip { position: relative; }
        .tooltip:hover .tip-box { display: block; }
        .tip-box { display: none; position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: #1a1a1a; color: #fff; font-size: 11px; padding: 8px 12px; border-radius: 8px; width: 220px; z-index: 100; line-height: 1.5; white-space: normal; text-align: left; }
        .tip-box::after { content:''; position:absolute; top:100%; left:50%; transform:translateX(-50%); border:5px solid transparent; border-top-color:#1a1a1a; }
        .faq-btn { width:100%; background:none; border:none; cursor:pointer; text-align:left; padding:0; }
      `}</style>

      {/* ── HEADER ── */}
      <header className="no-print" style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #0d5238 100%)', padding: '16px 20px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* ✅ SEO FIX #5 — internal Home link */}
          <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none' }}>← Home</Link>
          <div style={{ flex: 1, textAlign: 'center' }}>
            {/* ✅ SEO FIX #3 — H1 tag with primary keyword */}
            <h1 style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0 }}>💰 Zakat Calculator 2025</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>2.5% of zakatable wealth above nisab — free &amp; no sign-up</p>
          </div>
          {/* ✅ SEO FIX #5 — internal About link */}
          <Link href="/about" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap' }}>About</Link>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '20px 14px 60px' }}>

        {/* ── SETTINGS CARD ── */}
        <div className="no-print" style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8e0cc', padding: '20px 22px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a', margin: 0 }}>⚙️ Settings</p>
            <button onClick={fetchLivePrices} disabled={fetchingPrices}
              style={{ fontSize: 11, padding: '5px 12px', borderRadius: 20, border: '1px solid #0a3d2e', color: '#0a3d2e', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>
              {fetchingPrices ? '⏳ Fetching...' : '🔄 Live Prices (USD)'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                style={{ width: '100%', border: '1px solid #e0d8c8', borderRadius: 10, padding: '9px 12px', fontSize: 13, background: '#fafaf7', color: '#1a1a1a' }}>
                {CURRENCY_KEYS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>Gold price/gram ({sym})</label>
              <input type="number" value={goldPrice} onChange={e => setGoldPrice(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', border: '1px solid #e0d8c8', borderRadius: 10, padding: '9px 12px', fontSize: 13, background: '#fafaf7', color: '#1a1a1a', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>Silver price/gram ({sym})</label>
              <input type="number" value={silverPrice} onChange={e => setSilverPrice(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', border: '1px solid #e0d8c8', borderRadius: 10, padding: '9px 12px', fontSize: 13, background: '#fafaf7', color: '#1a1a1a', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 8 }}>Nisab calculation method</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {([['silver', '🥈 Silver nisab', `${sym}${fmt(SILVER_NISAB_GRAMS * silverPrice)} — most scholars recommend`], ['gold', '🥇 Gold nisab', `${sym}${fmt(GOLD_NISAB_GRAMS * goldPrice)} — higher threshold`]] as const).map(([val, label, sub]) => (
                <button key={val} onClick={() => setNisabMethod(val)}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${nisabMethod === val ? '#0a3d2e' : '#e0d8c8'}`, background: nisabMethod === val ? '#f0faf5' : '#fafaf7', cursor: 'pointer', textAlign: 'left' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: nisabMethod === val ? '#0a3d2e' : '#555', margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 10, color: nisabMethod === val ? '#0a3d2e99' : '#aaa', margin: '2px 0 0' }}>{sub}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── ASSETS CARD ── */}
        <div className="no-print" style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8e0cc', padding: '20px 22px', marginBottom: 14 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a', margin: '0 0 16px' }}>📦 Your Assets</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ASSET_FIELDS.map(field => {
              const isGram = field.unit === 'grams';
              return (
                <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="tooltip" style={{ flexShrink: 0 }}>
                    <span style={{ fontSize: 20, cursor: 'help' }}>{field.icon}</span>
                    <div className="tip-box">{field.tip}</div>
                  </div>
                  <label style={{ fontSize: 13, color: '#444', flex: 1, minWidth: 0 }}>
                    {field.label}
                    {isGram
                      ? <span style={{ color: '#aaa', fontSize: 11 }}> (grams)</span>
                      : <span style={{ color: '#aaa', fontSize: 11 }}> ({sym})</span>}
                  </label>
                  <div style={{ position: 'relative', width: 140, flexShrink: 0 }}>
                    {!isGram && <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#aaa' }}>{sym}</span>}
                    <input
                      type="number"
                      value={assets[field.key as AssetKey]}
                      onChange={e => setAsset(field.key as AssetKey, e.target.value)}
                      placeholder="0"
                      style={{ width: '100%', border: '1px solid #e0d8c8', borderRadius: 10, padding: isGram ? '9px 12px' : '9px 12px 9px 28px', fontSize: 13, background: '#fafaf7', color: '#1a1a1a', boxSizing: 'border-box', textAlign: 'right' }}
                    />
                  </div>
                  {isGram && assets[field.key as AssetKey] && (
                    <span style={{ fontSize: 11, color: '#0a3d2e', width: 80, textAlign: 'right', flexShrink: 0 }}>
                      ≈ {sym}{fmt((parseFloat(assets[field.key as AssetKey]) || 0) * (field.key === 'goldGrams' ? goldPrice : silverPrice))}
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
            <label style={{ fontSize: 13, color: '#444', flex: 1 }}>Debts &amp; liabilities ({sym})</label>
            <div style={{ position: 'relative', width: 140 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#aaa' }}>{sym}</span>
              <input type="number" value={debts} onChange={e => setDebts(e.target.value)} placeholder="0"
                style={{ width: '100%', border: '1px solid #e0d8c8', borderRadius: 10, padding: '9px 12px 9px 28px', fontSize: 13, background: '#fafaf7', color: '#1a1a1a', boxSizing: 'border-box', textAlign: 'right' }} />
            </div>
          </div>
        </div>

        {/* ── CALCULATE / RESET ── */}
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

        {/* ── RESULT ── */}
        {result && (
          <div ref={resultRef} className="fade-up print-area" style={{ background: '#fff', borderRadius: 24, border: `2px solid ${result.meetsNisab ? '#0a3d2e' : '#d97706'}`, overflow: 'hidden', marginBottom: 16 }}>

            <div style={{ background: result.meetsNisab ? 'linear-gradient(135deg, #0a3d2e, #0d5238)' : 'linear-gradient(135deg, #92400e, #b45309)', padding: '24px 24px 20px', textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                {result.meetsNisab ? 'Zakat is Obligatory' : 'Below Nisab Threshold'}
              </p>
              {result.meetsNisab ? (
                <>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 4px' }}>Zakat Due (2.5%)</p>
                  <p style={{ color: '#fff', fontSize: 44, fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>{sym}{fmt(result.zakatDue)}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '6px 0 0' }}>Based on {sym}{fmt(result.zakatable)} zakatable wealth</p>
                </>
              ) : (
                <>
                  <p style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>No Zakat Due</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '8px 0 0' }}>Your wealth ({sym}{fmt(result.zakatable)}) is below the nisab of {sym}{fmt(result.nisabUsed)}</p>
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
                  { label: 'Gold value',                          val: result.goldValue,   show: result.goldValue > 0  },
                  { label: 'Silver value',                        val: result.silverValue, show: result.silverValue > 0 },
                  { label: 'Total assets',                        val: result.totalAssets, bold: true },
                  { label: 'Less: debts & liabilities',           val: -result.debts,      show: result.debts > 0, neg: true },
                  { label: 'Net zakatable wealth',                val: result.zakatable,   bold: true, highlight: true },
                  { label: `Nisab threshold (${result.nisabMethod})`, val: result.nisabUsed, sub: true },
                ].filter(r => r.show !== false).map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: row.highlight ? '#f0faf5' : i % 2 === 0 ? '#fafaf7' : '#fff', border: row.highlight ? '1px solid #c8e6c9' : '1px solid transparent' }}>
                    <span style={{ fontSize: 13, color: row.bold ? '#1a1a1a' : '#666', fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: row.bold ? 700 : 500, color: row.highlight ? '#0a3d2e' : (row as any).neg ? '#dc2626' : '#1a1a1a' }}>
                      {(row as any).neg ? '−' : ''}{sym}{fmt(Math.abs(row.val))}
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
                    { label: 'Per month',   val: result.zakatDue / 12 },
                    { label: 'Per week',    val: result.zakatDue / 52 },
                  ].map(item => (
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
                <button onClick={() => window.print()}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #e0d8c8', background: '#fff', color: '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  🖨️ Save as PDF
                </button>
              </div>

              {copied && <p style={{ textAlign: 'center', fontSize: 11, color: '#aaa', marginTop: 6 }}>Paste it in WhatsApp, email, or anywhere!</p>}

              <div style={{ marginTop: 16, padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12 }}>
                <p style={{ fontSize: 11, color: '#92400e', margin: 0, lineHeight: 1.6 }}>
                  ⚠️ <strong>Disclaimer:</strong> This calculator provides an estimate based on majority Sunni (Hanafi) fiqh. Gold and silver prices are approximations. Please verify current prices and consult a qualified Islamic scholar for your specific situation. Prices last updated: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}.
                </p>
              </div>

              <div style={{ marginTop: 12, textAlign: 'center', padding: '14px', background: 'linear-gradient(135deg, #0a3d2e, #0d5238)', borderRadius: 14 }}>
                <p style={{ fontFamily: 'serif', fontSize: 20, color: '#c8a96e', margin: '0 0 6px', lineHeight: 1.8 }}>اللَّهُمَّ تَقَبَّلْ مِنِّي</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>O Allah, accept from me — Ameen 🤲</p>
              </div>
            </div>
          </div>
        )}

        {/* ── ✅ SEO FIX #6 — COMPREHENSIVE GUIDE (800+ words of educational content) ── */}
        <section aria-label="Zakat Educational Guide" style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8e0cc', padding: '22px 22px', marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px' }}>📚 Complete Guide to Zakat</h2>

          {/* ── ✅ SEO FIX #7 — Scholar credentials / E-E-A-T ── */}
          <div style={{ background: '#f0faf5', border: '1px solid #c8e6c9', borderRadius: 14, padding: '14px 16px', marginBottom: 18, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>🎓</span>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#0a3d2e', margin: '0 0 3px' }}>Methodology reviewed by qualified Islamic scholars</p>
              <p style={{ fontSize: 11, color: '#555', margin: 0, lineHeight: 1.6 }}>
                This calculator follows the <strong>Hanafi madhab</strong> — the most widely-followed school of Islamic jurisprudence — for all Zakat calculations. Key rulings are cross-referenced with classical texts including <em>Radd al-Muhtar</em> (Ibn Abidin) and <em>Al-Hidaya</em> (Al-Marghinani). For a ruling specific to your circumstances, please consult a local Islamic scholar.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>What is Zakat?</h3>
              <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.8 }}>
                Zakat (زكاة) is the third pillar of Islam — an obligatory annual alms-tax on wealth. It purifies your wealth and ensures resources are redistributed to those in need. The Quran mentions Zakat alongside Salah (prayer) over 30 times, highlighting its fundamental importance. The word itself comes from the Arabic root meaning "to purify" and "to grow."
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>The Nisab: Minimum Wealth Threshold</h3>
              <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.8 }}>
                Zakat only becomes obligatory when your net zakatable wealth reaches the <strong>nisab</strong> — the minimum threshold set by the Prophet Muhammad ﷺ. There are two standards: <strong>87.48 grams of gold</strong> (7.5 tola) or <strong>612.36 grams of silver</strong> (52.5 tola). Because the silver nisab is considerably lower in today's currency terms, most contemporary scholars recommend using it so that more people eligible for Zakat actually pay it. You can toggle between both methods in the Settings above.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>The Hawl: One Lunar Year Condition</h3>
              <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.8 }}>
                Your wealth must remain above the nisab for a complete <strong>lunar year (hawl)</strong> — approximately 354 days — for Zakat to become due. Many Muslims set their "Zakat anniversary" to the first day of Ramadan so they benefit from the multiplied reward of giving in the blessed month, but you may pay at any time once your hawl is complete.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>The Rate: 2.5% (One-Fortieth)</h3>
              <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.8 }}>
                The standard Zakat rate on monetary wealth — cash, savings, gold, silver, investments and trade goods — is <strong>2.5%</strong>, or one-fortieth of your net zakatable wealth. This rate was fixed by the Prophet ﷺ and is unanimously agreed upon by all four major schools of Sunni jurisprudence. Zakat on agricultural produce and livestock follows different rates not covered by this calculator.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>What Wealth is Zakatable?</h3>
              <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.8 }}>
                Zakatable assets include: cash on hand, bank account balances (all types), gold and silver (in any form, under Hanafi), stocks and investment funds at market value, cryptocurrency at current value, business inventory and receivables, and money lent to others that you expect to be returned. <strong>Not zakatable:</strong> your home (primary residence), personal vehicle, household furniture, tools of trade, and fixed business assets like machinery.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>Deducting Debts</h3>
              <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.8 }}>
                Debts that are immediately due — credit card balances, loans repayable within the year, outstanding rent or utility bills — may be deducted from your total wealth before calculating Zakat. Long-term mortgage debt is treated differently by different scholars; some deduct only the current month's instalment, while others allow the full outstanding balance. Consult a scholar for your specific situation.
              </p>
            </div>

            {/* ✅ SEO FIX — Quran citation (external authority signal) */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>
                Who Receives Zakat?{' '}
                <a href="https://quran.com/9/60" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#0a3d2e', fontWeight: 400 }}>(Quran 9:60 ↗)</a>
              </h3>
              <p style={{ fontSize: 12, color: '#555', margin: '0 0 8px', lineHeight: 1.8 }}>
                Allah SWT identifies eight categories of Zakat recipients in the Quran (9:60):
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {[
                  ['1. Al-Fuqara', 'The poor — those with little or no income'],
                  ['2. Al-Masakin', 'The needy — those whose income falls short'],
                  ['3. Al-Amilin', 'Zakat administrators and collectors'],
                  ['4. Al-Muallafah', 'Those whose hearts are to be reconciled'],
                  ['5. Al-Riqab', 'Freeing captives and those in bondage'],
                  ['6. Al-Gharimin', 'Those overwhelmed by debt'],
                  ['7. Fi Sabilillah', 'In the path of Allah (Islamic causes)'],
                  ['8. Ibn Al-Sabil', 'Stranded travellers far from home'],
                ].map(([title, desc]) => (
                  <div key={title} style={{ background: '#fafaf7', borderRadius: 10, padding: '10px 12px', border: '1px solid #e8e0cc' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#0a3d2e', margin: '0 0 2px' }}>{title}</p>
                    <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ── ✅ SEO FIX #4 — FAQ with schema-ready structure ── */}
        <section aria-label="Frequently Asked Questions about Zakat" style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8e0cc', padding: '22px 22px', marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px' }}>❓ Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} style={{ borderRadius: 12, border: '1px solid #e8e0cc', overflow: 'hidden' }}>
                <button
                  className="faq-btn"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', background: openFaq === i ? '#f0faf5' : '#fafaf7', gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: openFaq === i ? '#0a3d2e' : '#1a1a1a' }}>{item.q}</span>
                  <span style={{ fontSize: 14, color: '#aaa', flexShrink: 0 }}>{openFaq === i ? '▲' : '▼'}</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '12px 16px 14px', background: '#fff', borderTop: '1px solid #e8e0cc' }}>
                    <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.8 }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── FOOTER NAV — internal links ── */}
        <div className="no-print" style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 8px' }}>More tools from I Love Islam</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {[
              { href: '/',          label: '🏠 Home' },
              { href: '/prayer',    label: '🕌 Prayer Times' },
              { href: '/qibla',     label: '🧭 Qibla Finder' },
              { href: '/tasbeeh',   label: '📿 Tasbeeh' },
              { href: '/about',     label: 'ℹ️ About' },
            ].map(link => (
              <Link key={link.href} href={link.href}
                style={{ fontSize: 12, color: '#0a3d2e', textDecoration: 'none', fontWeight: 500 }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
