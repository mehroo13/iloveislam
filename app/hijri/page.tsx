'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const HIJRI_MONTHS = [
  { en: 'Muharram', ar: 'محرم', meaning: 'Sacred month', sacred: true },
  { en: 'Safar', ar: 'صفر', meaning: 'Void', sacred: false },
  { en: "Rabi' al-Awwal", ar: 'ربيع الأول', meaning: 'First spring', sacred: false },
  { en: "Rabi' al-Thani", ar: 'ربيع الثاني', meaning: 'Second spring', sacred: false },
  { en: 'Jumada al-Awwal', ar: 'جمادى الأولى', meaning: 'First dry', sacred: false },
  { en: 'Jumada al-Thani', ar: 'جمادى الثانية', meaning: 'Second dry', sacred: false },
  { en: 'Rajab', ar: 'رجب', meaning: 'Respect', sacred: true },
  { en: "Sha'ban", ar: 'شعبان', meaning: 'Scattered', sacred: false },
  { en: 'Ramadan', ar: 'رمضان', meaning: 'Scorching heat', sacred: false },
  { en: 'Shawwal', ar: 'شوال', meaning: 'Raised', sacred: false },
  { en: "Dhul Qi'dah", ar: 'ذو القعدة', meaning: 'Master of rest', sacred: true },
  { en: 'Dhul Hijjah', ar: 'ذو الحجة', meaning: 'Master of pilgrimage', sacred: true },
];

// Key Islamic events: month-day → event info
const ISLAMIC_EVENTS: Record<string, { name: string; color: string; emoji: string }> = {
  '1-1': { name: 'Islamic New Year', color: 'bg-blue-500', emoji: '🔵' },
  '1-10': { name: 'Day of Ashura', color: 'bg-red-500', emoji: '🔴' },
  '3-12': { name: 'Mawlid al-Nabi ﷺ', color: 'bg-yellow-500', emoji: '🟡' },
  '7-27': { name: "Isra' wal Mi'raj", color: 'bg-purple-500', emoji: '🟣' },
  '8-15': { name: "Laylat al-Bara'at", color: 'bg-indigo-500', emoji: '💜' },
  '9-1': { name: 'First day of Ramadan', color: 'bg-purple-600', emoji: '🟣' },
  '9-27': { name: 'Laylat al-Qadr (est.)', color: 'bg-amber-500', emoji: '⭐' },
  '10-1': { name: 'Eid al-Fitr', color: 'bg-green-500', emoji: '🟢' },
  '10-2': { name: 'Eid al-Fitr (Day 2)', color: 'bg-green-500', emoji: '🟢' },
  '10-3': { name: 'Eid al-Fitr (Day 3)', color: 'bg-green-500', emoji: '🟢' },
  '12-1': { name: 'Start of Dhul Hijjah', color: 'bg-amber-600', emoji: '🌟' },
  '12-8': { name: 'Day of Tarwiyah', color: 'bg-amber-500', emoji: '🕋' },
  '12-9': { name: 'Day of Arafah', color: 'bg-amber-600', emoji: '🌟' },
  '12-10': { name: 'Eid al-Adha', color: 'bg-green-600', emoji: '🟢' },
  '12-11': { name: 'Eid al-Adha (Day 2)', color: 'bg-green-500', emoji: '🟢' },
  '12-12': { name: 'Eid al-Adha (Day 3)', color: 'bg-green-500', emoji: '🟢' },
  '12-13': { name: 'Ayyam al-Tashreeq', color: 'bg-green-400', emoji: '🟢' },
};

// Ayyamul Bidh (white days) — 13, 14, 15 of every month
function isAyyamulBidh(day: number): boolean {
  return day === 13 || day === 14 || day === 15;
}

// First 10 days of Dhul Hijjah
function isDhulHijjahFirst10(month: number, day: number): boolean {
  return month === 12 && day >= 1 && day <= 10;
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthEn: string;
  monthAr: string;
}

interface CalendarDay {
  hijriDay: number;
  hijriMonth: number;
  hijriYear: number;
  gregorianDate: string; // "DD Mon"
  gregorianFull: string; // full date
  weekday: string;
  isToday: boolean;
  event: { name: string; color: string; emoji: string } | null;
  isAyyamulBidh: boolean;
  isDhulHijjah10: boolean;
  isRamadan: boolean;
}

interface MonthData {
  days: CalendarDay[];
  hijriMonth: number;
  hijriYear: number;
  startWeekday: number; // 0=Sun, 1=Mon...
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function HijriCalendar() {
  const [todayHijri, setTodayHijri] = useState<HijriDate | null>(null);
  const [currentMonth, setCurrentMonth] = useState<number>(1);
  const [currentYear, setCurrentYear] = useState<number>(1447);
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'calendar' | 'converter'>('calendar');
  // Converter state
  const [gregDate, setGregDate] = useState('');
  const [hijriDay, setHijriDay] = useState('');
  const [hijriMonthInput, setHijriMonthInput] = useState('');
  const [hijriYearInput, setHijriYearInput] = useState('');
  const [convMode, setConvMode] = useState<'g2h' | 'h2g'>('g2h');
  const [convResult, setConvResult] = useState<string | null>(null);
  const [convLoading, setConvLoading] = useState(false);

  // Fetch today's Hijri date on mount
  useEffect(() => {
    fetchToday();
  }, []);

  // Fetch month data when month/year changes
  useEffect(() => {
    if (currentMonth && currentYear) {
      fetchMonth(currentMonth, currentYear);
    }
  }, [currentMonth, currentYear]);

  const fetchToday = async () => {
    try {
      const today = new Date();
      const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      const res = await fetch(`https://api.aladhan.com/v1/gToH/${dateStr}`);
      const data = await res.json();
      if (data.code === 200) {
        const h = data.data.hijri;
        const hijri: HijriDate = {
          day: parseInt(h.day),
          month: h.month.number,
          year: parseInt(h.year),
          monthEn: h.month.en,
          monthAr: h.month.ar,
        };
        setTodayHijri(hijri);
        setCurrentMonth(hijri.month);
        setCurrentYear(hijri.year);
      }
    } catch {}
  };

  const fetchMonth = async (month: number, year: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.aladhan.com/v1/hToGCalendar/${month}/${year}`);
      const data = await res.json();
      if (data.code === 200 && data.data) {
        const today = new Date();
        const todayStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        const days: CalendarDay[] = data.data.map((entry: any) => {
          const h = entry.hijri;
          const g = entry.gregorian;
          const hDay = parseInt(h.day);
          const hMonth = parseInt(h.month.number);
          const gDate = `${g.day} ${g.month.en.substring(0, 3)}`;
          const gFull = `${g.weekday.en}, ${g.day} ${g.month.en} ${g.year}`;
          const isToday = `${g.day}-${g.month.number}-${g.year}` === todayStr;
          const eventKey = `${hMonth}-${hDay}`;
          return {
            hijriDay: hDay,
            hijriMonth: hMonth,
            hijriYear: parseInt(h.year),
            gregorianDate: gDate,
            gregorianFull: gFull,
            weekday: g.weekday.en,
            isToday,
            event: ISLAMIC_EVENTS[eventKey] || null,
            isAyyamulBidh: isAyyamulBidh(hDay),
            isDhulHijjah10: isDhulHijjahFirst10(hMonth, hDay),
            isRamadan: hMonth === 9,
          };
        });
        // Determine start weekday (0=Sun)
        const firstDayWeekday = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
          .indexOf(days[0]?.weekday || 'Sunday');
        setMonthData({ days, hijriMonth: month, hijriYear: year, startWeekday: firstDayWeekday });
      }
    } catch {}
    setLoading(false);
  };

  const prevMonth = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };
  const goToToday = () => {
    if (todayHijri) { setCurrentMonth(todayHijri.month); setCurrentYear(todayHijri.year); }
  };

  // Converter functions
  const convertG2H = async () => {
    if (!gregDate) return;
    setConvLoading(true); setConvResult(null);
    try {
      const d = new Date(gregDate);
      const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
      const res = await fetch(`https://api.aladhan.com/v1/gToH/${dateStr}`);
      const data = await res.json();
      if (data.code === 200) {
        const h = data.data.hijri;
        const g = data.data.gregorian;
        setConvResult(`${g.weekday.en}, ${g.day} ${g.month.en} ${g.year} = ${h.day} ${h.month.en} ${h.year} AH (${h.month.ar})`);
      }
    } catch {}
    setConvLoading(false);
  };

  const convertH2G = async () => {
    if (!hijriDay || !hijriMonthInput || !hijriYearInput) return;
    setConvLoading(true); setConvResult(null);
    try {
      const res = await fetch(`https://api.aladhan.com/v1/hToG/${hijriDay}-${hijriMonthInput}-${hijriYearInput}`);
      const data = await res.json();
      if (data.code === 200) {
        const h = data.data.hijri;
        const g = data.data.gregorian;
        setConvResult(`${h.day} ${h.month.en} ${h.year} AH = ${g.weekday.en}, ${g.day} ${g.month.en} ${g.year}`);
      }
    } catch {}
    setConvLoading(false);
  };

  // Next event countdown
  const getNextEvent = (): { name: string; daysLeft: number } | null => {
    if (!todayHijri || !monthData) return null;
    const todayNum = todayHijri.month * 30 + todayHijri.day;
    let closest: { name: string; daysLeft: number } | null = null;
    for (const [key, ev] of Object.entries(ISLAMIC_EVENTS)) {
      const [m, d] = key.split('-').map(Number);
      const evNum = m * 30 + d;
      const diff = evNum - todayNum;
      if (diff > 0 && (!closest || diff < closest.daysLeft)) {
        closest = { name: ev.name, daysLeft: diff };
      }
    }
    return closest;
  };

  const nextEvent = getNextEvent();
  const monthInfo = HIJRI_MONTHS[currentMonth - 1];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #071e14, #0a3d2e)' }} className="px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/50 hover:text-white text-sm">← Home</Link>
          <h1 className="text-white font-bold text-base">🌙 Hijri Calendar</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* Today's Date Hero */}
        {todayHijri && (
          <div style={{ background: 'linear-gradient(135deg, #071e14, #0a3d2e)' }} className="rounded-2xl p-5 text-center">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Today&apos;s Islamic Date</p>
            <p className="text-2xl font-bold mb-1" style={{ color: '#c8a96e' }}>
              {todayHijri.day} {todayHijri.monthAr} {todayHijri.year}
            </p>
            <p className="text-white text-sm font-medium">
              {todayHijri.day} {todayHijri.monthEn} {todayHijri.year} AH
            </p>
            {nextEvent && (
              <p className="text-white/50 text-xs mt-2">
                Next: {nextEvent.name} in ~{nextEvent.daysLeft} days
              </p>
            )}
          </div>
        )}

        {/* Mode toggle */}
        <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-100 dark:border-gray-700">
          <button onClick={() => setMode('calendar')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'calendar' ? 'bg-emerald-600 text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}>
            📅 Calendar
          </button>
          <button onClick={() => setMode('converter')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'converter' ? 'bg-emerald-600 text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}>
            🔄 Converter
          </button>
        </div>

        {/* CALENDAR VIEW */}
        {mode === 'calendar' && (
          <>
            {/* Month navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">←</button>
                <div className="text-center">
                  <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{monthInfo?.en}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{monthInfo?.ar} • {currentYear} AH {monthInfo?.sacred ? '• Sacred Month' : ''}</p>
                </div>
                <button onClick={nextMonth} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">→</button>
              </div>
              <button onClick={goToToday} className="w-full text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline">↩ Go to today</button>
            </div>

            {/* Calendar grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="text-3xl animate-pulse mb-2">🌙</div>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Loading calendar...</p>
              </div>
            ) : monthData && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className={`text-center py-2 text-[10px] font-bold uppercase tracking-wider ${d === 'Fri' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7">
                  {/* Empty cells for offset */}
                  {Array.from({ length: monthData.startWeekday }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square border-b border-r border-gray-50 dark:border-gray-700/50" />
                  ))}
                  {/* Actual days */}
                  {monthData.days.map((day, i) => (
                    <div
                      key={i}
                      className={`aspect-square border-b border-r border-gray-50 dark:border-gray-700/50 p-0.5 sm:p-1 flex flex-col items-center justify-center relative transition-colors ${
                        day.isToday ? 'bg-emerald-50 dark:bg-emerald-900/30 ring-2 ring-emerald-500 ring-inset' :
                        day.event ? 'bg-amber-50/50 dark:bg-amber-900/10' :
                        day.isDhulHijjah10 ? 'bg-yellow-50/50 dark:bg-yellow-900/10' :
                        day.isAyyamulBidh ? 'bg-blue-50/30 dark:bg-blue-900/10' :
                        day.isRamadan ? 'bg-purple-50/30 dark:bg-purple-900/10' : ''
                      }`}
                    >
                      {/* Hijri day number */}
                      <span className={`text-sm sm:text-base font-bold ${
                        day.isToday ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {day.hijriDay}
                      </span>
                      {/* Gregorian date small */}
                      <span className="text-[8px] sm:text-[9px] text-gray-400 dark:text-gray-500 leading-tight">
                        {day.gregorianDate}
                      </span>
                      {/* Event dot */}
                      {day.event && (
                        <div className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${day.event.color}`} title={day.event.name} />
                      )}
                      {/* Ayyamul Bidh indicator */}
                      {day.isAyyamulBidh && !day.event && (
                        <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-white border border-gray-300" title="Ayyamul Bidh (fasting recommended)" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Events this month */}
            {monthData && (() => {
              const events = monthData.days.filter(d => d.event);
              if (events.length === 0) return null;
              return (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Events This Month</p>
                  <div className="space-y-1.5">
                    {events.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span>{d.event!.emoji}</span>
                        <span className="text-gray-800 dark:text-gray-200 font-medium">{d.hijriDay} — {d.event!.name}</span>
                        <span className="text-gray-400 dark:text-gray-500 text-xs ml-auto">{d.gregorianDate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Legend */}
            <div className="flex flex-wrap gap-2 justify-center text-[10px] text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Today</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Eid</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Special Day</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white border border-gray-300" /> Ayyamul Bidh</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Ramadan</span>
            </div>
          </>
        )}

        {/* CONVERTER VIEW */}
        {mode === 'converter' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button onClick={() => { setConvMode('g2h'); setConvResult(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${convMode === 'g2h' ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white' : 'text-gray-400'}`}>
                Gregorian → Hijri
              </button>
              <button onClick={() => { setConvMode('h2g'); setConvResult(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${convMode === 'h2g' ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white' : 'text-gray-400'}`}>
                Hijri → Gregorian
              </button>
            </div>

            {convMode === 'g2h' ? (
              <div className="space-y-3">
                <input type="date" value={gregDate} onChange={e => setGregDate(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-700 dark:text-white" />
                <button onClick={convertG2H} disabled={convLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 font-medium text-sm">
                  {convLoading ? 'Converting...' : 'Convert to Hijri 🌙'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" min="1" max="30" placeholder="Day" value={hijriDay} onChange={e => setHijriDay(e.target.value)}
                    className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-3 text-sm bg-gray-50 dark:bg-gray-700 dark:text-white" />
                  <select value={hijriMonthInput} onChange={e => setHijriMonthInput(e.target.value)}
                    className="border border-gray-200 dark:border-gray-600 rounded-xl px-2 py-3 text-sm bg-gray-50 dark:bg-gray-700 dark:text-white">
                    <option value="">Month</option>
                    {HIJRI_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m.en}</option>)}
                  </select>
                  <input type="number" placeholder="Year" value={hijriYearInput} onChange={e => setHijriYearInput(e.target.value)}
                    className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-3 text-sm bg-gray-50 dark:bg-gray-700 dark:text-white" />
                </div>
                <button onClick={convertH2G} disabled={convLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 font-medium text-sm">
                  {convLoading ? 'Converting...' : 'Convert to Gregorian 📅'}
                </button>
              </div>
            )}

            {convResult && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4 text-center">
                <p className="text-emerald-800 dark:text-emerald-300 font-medium text-sm">{convResult}</p>
              </div>
            )}
          </div>
        )}

        {/* Islamic Months Reference */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">12 Islamic Months</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {HIJRI_MONTHS.map((m, i) => (
              <button
                key={i}
                onClick={() => { setCurrentMonth(i + 1); setMode('calendar'); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  currentMonth === i + 1 ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700' : ''
                }`}
              >
                <span className="text-xs text-gray-400 dark:text-gray-500 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{m.en}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{m.ar}</p>
                </div>
                {m.sacred && <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold">Sacred</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 dark:text-gray-600 pb-8">
          Dates from Aladhan API (Umm al-Qura algorithm) • Actual dates may vary ±1 day based on moon sighting
        </p>
      </main>
    </div>
  );
}
