'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

/* ---- Types ---- */
interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
}

/* ---- Constants ---- */
const PRAYERS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
type Prayer = (typeof PRAYERS)[number];

const PRAYER_INFO: Record<Prayer, { icon: string; sunnah: string; rakah: string }> = {
  Fajr: { icon: '🌅', sunnah: '2 Sunnah + 2 Fard', rakah: '2' },
  Sunrise: { icon: '☀️', sunnah: 'Ishraq (2 optional)', rakah: '—' },
  Dhuhr: { icon: '🌤️', sunnah: '4 Sunnah + 4 Fard + 2 Sunnah', rakah: '4' },
  Asr: { icon: '⛅', sunnah: '4 Fard', rakah: '4' },
  Maghrib: { icon: '🌇', sunnah: '3 Fard + 2 Sunnah', rakah: '3' },
  Isha: { icon: '🌙', sunnah: '4 Fard + 2 Sunnah + 3 Witr', rakah: '4' },
};

const METHODS = [
  { id: 2, name: 'ISNA (North America)' },
  { id: 1, name: 'Muslim World League' },
  { id: 3, name: 'Egyptian General Authority' },
  { id: 4, name: 'Umm Al-Qura (Saudi Arabia)' },
  { id: 5, name: 'Univ. of Islamic Sciences, Karachi' },
  { id: 15, name: 'Diyanet (Turkey)' },
  { id: 11, name: 'Majlis Ugama Islam Singapura' },
  { id: 7, name: 'Shia Ithna-Ashari (Jafari)' },
  { id: 8, name: 'Gulf Region' },
  { id: 9, name: 'Kuwait' },
  { id: 10, name: 'Qatar' },
  { id: 12, name: 'France (UOIF)' },
  { id: 13, name: 'Turkey (Diyanet Alt)' },
  { id: 14, name: 'Spiritual Administration of Muslims, Russia' },
];

const STORAGE_KEY = 'iloveislam_prayer_location';

/* ---- Helpers ---- */
function formatTime(timeStr: string | undefined): string {
  if (!timeStr) return '--:--';
  const clean = timeStr.replace(/\s*\(.*\)/, '').trim();
  const [hour, minute] = clean.split(':');
  const h = parseInt(hour, 10);
  if (isNaN(h)) return '--:--';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minute.substring(0, 2)} ${ampm}`;
}

function timeToMinutes(timeStr: string): number {
  const clean = timeStr.replace(/\s*\(.*\)/, '').trim();
  const [h, m] = clean.split(':').map(Number);
  return h * 60 + m;
}

function getNextPrayer(timings: PrayerTimings): { prayer: Prayer; minutesLeft: number } {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const prayerOrder: Prayer[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  for (const prayer of prayerOrder) {
    const time = timings[prayer];
    if (!time) continue;
    const pMin = timeToMinutes(time);
    if (pMin > nowMin) return { prayer, minutesLeft: pMin - nowMin };
  }
  // After Isha — next is Fajr (tomorrow)
  const fajrMin = timeToMinutes(timings.Fajr);
  const minsLeft = (24 * 60 - nowMin) + fajrMin;
  return { prayer: 'Fajr', minutesLeft: minsLeft };
}

function formatCountdown(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function PrayerTimes() {
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [weekTimings, setWeekTimings] = useState<{ date: string; timings: PrayerTimings }[]>([]);
  const [cityName, setCityName] = useState('');
  const [hijriDate, setHijriDate] = useState('');
  const [method, setMethod] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [now, setNow] = useState(new Date());
  const [nextInfo, setNextInfo] = useState<{ prayer: Prayer; minutesLeft: number } | null>(null);
  const [showWeek, setShowWeek] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live clock — update every second for countdown
  useEffect(() => {
    tickRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  // Recalculate next prayer every tick
  useEffect(() => {
    if (timings) setNextInfo(getNextPrayer(timings));
  }, [timings, now]);

  // Auto-load saved location on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { lat, lng, city, methodId } = JSON.parse(saved);
        if (methodId) setMethod(methodId);
        setCoords({ lat, lng });
        fetchByCoords(lat, lng, city, methodId || method);
      } else {
        // Auto-detect location on first visit
        autoDetect();
      }
    } catch {
      autoDetect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when method changes (if we have coords)
  useEffect(() => {
    if (coords) {
      fetchByCoords(coords.lat, coords.lng, cityName, method);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  const autoDetect = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const geoData = await geo.json();
          const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || '';
          const country = geoData.address?.country || '';
          const name = city ? `${city}, ${country}` : 'Your Location';
          fetchByCoords(latitude, longitude, name, method);
        } catch {
          fetchByCoords(latitude, longitude, 'Your Location', method);
        }
      },
      () => { setLoading(false); }
    );
  };

  const fetchByCoords = useCallback(async (lat: number, lng: number, name?: string, m?: number) => {
    setLoading(true);
    setError('');
    const usedMethod = m || method;
    try {
      const today = new Date();
      const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      const res = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${usedMethod}`);
      const data = await res.json();
      if (data.code === 200) {
        setTimings(data.data.timings);
        const cityLabel = name || `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
        setCityName(cityLabel);
        setCoords({ lat, lng });
        // Hijri date
        if (data.data.date?.hijri) {
          const h = data.data.date.hijri;
          setHijriDate(`${h.day} ${h.month.en} ${h.year} AH`);
        }
        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat, lng, city: cityLabel, methodId: usedMethod }));
        } catch {}
        // Fetch week
        fetchWeek(lat, lng, usedMethod);
      } else {
        setError('Could not fetch prayer times.');
      }
    } catch {
      setError('Network error. Check your connection.');
    }
    setLoading(false);
  }, [method]);

  const fetchWeek = async (lat: number, lng: number, m: number) => {
    try {
      const today = new Date();
      const week: { date: string; timings: PrayerTimings }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
        const res = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${m}`);
        const data = await res.json();
        if (data.code === 200) {
          const dayName = d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
          week.push({ date: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayName, timings: data.data.timings });
        }
      }
      setWeekTimings(week);
    } catch {}
  };

  const searchCity = useCallback(async () => {
    if (!manualCity.trim()) return;
    setLoading(true);
    setError('');
    try {
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualCity)}&format=json&limit=1`);
      const geoData = await geo.json();
      if (!geoData.length) { setError('City not found.'); setLoading(false); return; }
      const { lat, lon, display_name } = geoData[0];
      const city = display_name.split(',')[0];
      fetchByCoords(parseFloat(lat), parseFloat(lon), city, method);
      setManualCity('');
    } catch { setError('Search failed.'); setLoading(false); }
  }, [manualCity, fetchByCoords, method]);

  // Live countdown seconds
  const countdownSeconds = nextInfo ? (() => {
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    if (!timings || !nextInfo) return 0;
    const prayerTime = timings[nextInfo.prayer];
    if (!prayerTime) return 0;
    const clean = prayerTime.replace(/\s*\(.*\)/, '').trim();
    const [h, m] = clean.split(':').map(Number);
    let pSec = h * 3600 + m * 60;
    if (pSec <= nowSec) pSec += 24 * 3600; // next day
    return pSec - nowSec;
  })() : 0;

  const countdownH = Math.floor(countdownSeconds / 3600);
  const countdownM = Math.floor((countdownSeconds % 3600) / 60);
  const countdownS = countdownSeconds % 60;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #071e14, #0a3d2e)' }} className="px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/50 hover:text-white text-sm">← Home</Link>
          <h1 className="text-white font-bold text-base">🕐 Prayer Times</h1>
          <button onClick={() => setShowSettings(!showSettings)} className="text-white/50 hover:text-white text-sm">
            ⚙️
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* Next Prayer Countdown — Hero */}
        {timings && nextInfo && !loading && (
          <div style={{ background: 'linear-gradient(135deg, #071e14, #0a3d2e)' }} className="rounded-2xl p-5 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-2 right-6 text-6xl select-none">☽</div>
            </div>
            <div className="relative z-10">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Next Prayer</p>
              <p className="text-white text-2xl font-bold mb-1">
                {PRAYER_INFO[nextInfo.prayer].icon} {nextInfo.prayer}
              </p>
              <p style={{ color: '#c8a96e' }} className="text-sm mb-3">
                at {formatTime(timings[nextInfo.prayer])}
              </p>
              {/* Live Countdown */}
              <div className="flex justify-center gap-2">
                {[
                  { val: countdownH, label: 'hr' },
                  { val: countdownM, label: 'min' },
                  { val: countdownS, label: 'sec' },
                ].map((item) => (
                  <div key={item.label} className="bg-white/10 rounded-xl px-3 py-2 min-w-[52px]">
                    <p className="text-white text-xl font-bold tabular-nums">{String(item.val).padStart(2, '0')}</p>
                    <p className="text-white/40 text-[10px] uppercase">{item.label}</p>
                  </div>
                ))}
              </div>
              {/* Location & Hijri */}
              <div className="mt-3 flex items-center justify-center gap-3 text-xs text-white/40">
                <span>📍 {cityName}</span>
                {hijriDate && <span>• 🌙 {hijriDate}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Settings (collapsible) */}
        {(showSettings || !timings) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">📍 Location</p>
            <button
              onClick={autoDetect}
              style={{ background: '#0a3d2e' }}
              className="w-full text-white rounded-xl py-3 font-medium hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              📍 Use My GPS Location
            </button>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCity()}
                placeholder="Search city (e.g. London, Karachi)..."
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 dark:text-white focus:border-emerald-400 outline-none"
              />
              <button onClick={searchCity} className="px-4 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                🔍
              </button>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Calculation Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(parseInt(e.target.value, 10))}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 dark:text-white focus:border-emerald-400 outline-none"
              >
                {METHODS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3 animate-pulse">🕌</div>
            <p className="text-gray-400 dark:text-gray-500">Fetching prayer times...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-4 text-sm text-red-500 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Today's Prayer Times */}
        {timings && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Today&apos;s Schedule</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {now.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
            </div>
            {PRAYERS.map((prayer, i) => {
              const isNext = nextInfo?.prayer === prayer;
              return (
                <div
                  key={prayer}
                  className={`flex items-center px-4 py-3.5 ${i < PRAYERS.length - 1 ? 'border-b border-gray-50 dark:border-gray-700/50' : ''} ${isNext ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                >
                  <span className="text-lg mr-3 w-7 text-center">{PRAYER_INFO[prayer].icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className={`font-semibold text-sm ${isNext ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-200'}`}>
                      {prayer}
                    </span>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{PRAYER_INFO[prayer].sunnah}</p>
                  </div>
                  <span className={`font-bold text-sm tabular-nums ${isNext ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-100'}`}>
                    {formatTime(timings[prayer])}
                  </span>
                  {isNext && (
                    <span className="ml-2 text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                      {formatCountdown(nextInfo!.minutesLeft)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 7-Day View Toggle */}
        {timings && !loading && weekTimings.length > 0 && (
          <div>
            <button
              onClick={() => setShowWeek(!showWeek)}
              className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              📅 {showWeek ? 'Hide' : 'Show'} 7-Day Schedule
            </button>

            {showWeek && (
              <div className="mt-3 space-y-2">
                {weekTimings.map((day, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-300">{day.date}</p>
                    </div>
                    <div className="grid grid-cols-6 gap-0 text-center">
                      {PRAYERS.map((prayer) => (
                        <div key={prayer} className="py-2 px-1 border-r border-gray-50 dark:border-gray-700/50 last:border-r-0">
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-0.5">{prayer.substring(0, 3)}</p>
                          <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 tabular-nums">
                            {formatTime(day.timings[prayer])}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sunnah Info Card */}
        {timings && !loading && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">📿 Sunnah Reminder</p>
            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
              The Prophet ﷺ said: <em>&quot;The most beloved deeds to Allah are those done consistently, even if they are small.&quot;</em> (Bukhari & Muslim)
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
              Tip: Praying 12 rak&apos;ah of Sunnah daily earns a house in Jannah (Muslim).
              That&apos;s 2 before Fajr, 4 before Dhuhr, 2 after Dhuhr, 2 after Maghrib, 2 after Isha.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-gray-300 dark:text-gray-600">
            Times from Aladhan API • {cityName && `${cityName} • `}Method: {METHODS.find(m => m.id === method)?.name}
          </p>
        </div>
      </main>
    </div>
  );
}
