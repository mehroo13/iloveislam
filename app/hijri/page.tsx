'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah'
];

const ISLAMIC_EVENTS: Record<string, string> = {
  '1-1': 'Islamic New Year',
  '1-10': 'Day of Ashura',
  '3-12': 'Mawlid al-Nabi ﷺ',
  '7-27': "Laylat al-Mi'raj",
  '8-15': "Laylat al-Bara'at",
  '9-1': 'First day of Ramadan',
  '9-27': 'Laylat al-Qadr (estimated)',
  '10-1': 'Eid al-Fitr 🎉',
  '12-9': 'Day of Arafah',
  '12-10': 'Eid al-Adha 🐑',
};

interface HijriData {
  day: string;
  month: { number: number; en: string; ar: string };
  year: string;
  weekday?: { en: string };
}

interface GregorianData {
  day: string;
  month: { number: number; en: string };
  year: string;
  weekday: { en: string };
}

interface ConversionResult {
  hijri: string;
  hijriArabic: string;
  gregorian: string;
  weekday: string;
  event: string;
}

export default function HijriCalendar() {
  const [gregorianDate, setGregorianDate] = useState('');
  const [hijriDay, setHijriDay] = useState('');
  const [hijriMonth, setHijriMonth] = useState('');
  const [hijriYear, setHijriYear] = useState('');
  const [todayHijri, setTodayHijri] = useState<HijriData | null>(null);
  const [event, setEvent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'g2h' | 'h2g'>('g2h');
  const [result, setResult] = useState<ConversionResult | null>(null);

  useEffect(() => { fetchTodayHijri(); }, []);

  const fetchTodayHijri = async () => {
    try {
      const today = new Date();
      const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      const res = await fetch(`https://api.aladhan.com/v1/gToH/${dateStr}`);
      const data = await res.json();
      if (data.code === 200) {
        const h: HijriData = data.data.hijri;
        setTodayHijri(h);
        setEvent(ISLAMIC_EVENTS[`${h.month.number}-${h.day}`] || '');
      }
    } catch { /* silent */ }
  };

  const convertG2H = async () => {
    if (!gregorianDate) return setError('Please select a date.');
    setLoading(true); setError(''); setResult(null);
    try {
      const d = new Date(gregorianDate);
      const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
      const res = await fetch(`https://api.aladhan.com/v1/gToH/${dateStr}`);
      const data = await res.json();
      if (data.code === 200) {
        const h: HijriData = data.data.hijri;
        const g: GregorianData = data.data.gregorian;
        setResult({
          hijri: `${h.day} ${h.month.en} ${h.year} AH`,
          hijriArabic: `${h.day} ${h.month.ar} ${h.year}`,
          gregorian: `${g.day} ${g.month.en} ${g.year}`,
          weekday: g.weekday.en,
          event: ISLAMIC_EVENTS[`${h.month.number}-${h.day}`] || '',
        });
      } else setError('Could not convert. Try again.');
    } catch { setError('Network error.'); }
    setLoading(false);
  };

  const convertH2G = async () => {
    if (!hijriDay || !hijriMonth || !hijriYear) return setError('Please fill all fields.');
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`https://api.aladhan.com/v1/hToG/${hijriDay}-${hijriMonth}-${hijriYear}`);
      const data = await res.json();
      if (data.code === 200) {
        const h: HijriData = data.data.hijri;
        const g: GregorianData = data.data.gregorian;
        setResult({
          hijri: `${h.day} ${h.month.en} ${h.year} AH`,
          hijriArabic: `${h.day} ${h.month.ar} ${h.year}`,
          gregorian: `${g.day} ${g.month.en} ${g.year}`,
          weekday: g.weekday.en,
          event: ISLAMIC_EVENTS[`${h.month.number}-${h.day}`] || '',
        });
      } else setError('Invalid date. Please check your input.');
    } catch { setError('Network error.'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tool navigation bar */}
      <header style={{ background: '#0a3d2e' }} className="px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
        <span className="text-white font-medium">Hijri Calendar</span>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {todayHijri && (
          <div style={{ background: '#0a3d2e' }} className="rounded-2xl p-5 mb-4 text-center">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Today's Islamic Date</p>
            <p className="text-3xl mb-1" style={{ color: '#c8a96e' }}>
              {todayHijri.day} {todayHijri.month.ar} {todayHijri.year}
            </p>
            <p className="text-white text-lg font-medium">
              {todayHijri.day} {todayHijri.month.en} {todayHijri.year} AH
            </p>
            <p className="text-white/50 text-sm mt-1">{todayHijri.weekday?.en}</p>
            {event && (
              <div className="mt-3 bg-white/10 rounded-xl px-4 py-2 inline-block">
                <p className="text-white text-sm">🌙 {event}</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
            <button onClick={() => { setMode('g2h'); setResult(null); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'g2h' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>
              Gregorian → Hijri
            </button>
            <button onClick={() => { setMode('h2g'); setResult(null); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'h2g' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>
              Hijri → Gregorian
            </button>
          </div>

          {mode === 'g2h' ? (
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Select Gregorian date</label>
              <input type="date" value={gregorianDate}
                onChange={e => setGregorianDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4" />
              <button onClick={convertG2H}
                style={{ background: '#0a3d2e' }}
                className="w-full text-white rounded-xl py-3 font-medium hover:opacity-90 transition-opacity">
                Convert to Hijri 🌙
              </button>
            </div>
          ) : (
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Enter Hijri date</label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Day</label>
                  <input type="number" min="1" max="30" placeholder="1-30"
                    value={hijriDay} onChange={e => setHijriDay(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Month</label>
                  <select value={hijriMonth} onChange={e => setHijriMonth(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm">
                    <option value="">--</option>
                    {HIJRI_MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>{i + 1}. {m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Year (AH)</label>
                  <input type="number" placeholder="e.g. 1446"
                    value={hijriYear} onChange={e => setHijriYear(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <button onClick={convertH2G}
                style={{ background: '#0a3d2e' }}
                className="w-full text-white rounded-xl py-3 font-medium hover:opacity-90 transition-opacity">
                Convert to Gregorian 📅
              </button>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-500 mb-4">{error}</div>}
        {loading && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3 animate-pulse">🌙</div>
            <p className="text-gray-400">Converting date...</p>
          </div>
        )}

        {result && !loading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
            <h3 className="font-semibold text-gray-800 mb-4">Result</h3>
            <div className="space-y-3">
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-xs text-purple-500 mb-1">Hijri Date</p>
                <p className="text-2xl text-purple-800 mb-1">{result.hijriArabic}</p>
                <p className="font-medium text-purple-700">{result.hijri}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-blue-500 mb-1">Gregorian Date</p>
                <p className="font-medium text-blue-700">{result.weekday}, {result.gregorian}</p>
              </div>
              {result.event && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs text-amber-600 mb-1">🌙 Islamic Occasion</p>
                  <p className="font-medium text-amber-700">{result.event}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Islamic months list + important events (SEO friendly) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Islamic Months</p>
          <div className="grid grid-cols-2 gap-1 mb-4">
            {HIJRI_MONTHS.map((m, i) => (
              <div key={m} className="flex items-center gap-2 py-1">
                <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                <span className="text-sm text-gray-600">{m}</span>
              </div>
            ))}
          </div>

          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 mt-4">Key Islamic Events</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(ISLAMIC_EVENTS).map(([key, name]) => {
              const [month, day] = key.split('-').map(Number);
              return (
                <div key={key} className="flex items-center gap-2 py-1">
                  <span className="text-xs text-gray-400 w-16">{month}/{day}</span>
                  <span className="text-sm text-gray-600">{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}