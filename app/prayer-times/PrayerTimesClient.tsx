'use client';

// app/prayer-times/PrayerTimesClient.tsx — interactive prayer times.
// Server-rendered Sydney / Muslim World League data arrives as props, so the
// page is never blank. The client only re-fetches when the user changes city
// or method. City + method are persisted under the SAME keys the homepage
// uses (ili_city, ili_prayer_method), so both pages always agree.

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ToolIcon from '../components/ToolIcon';
import {
  PRAYER_METHODS,
  PRAYER_ORDER,
  ALL_PRAYERS,
  DEFAULT_METHOD,
  CITY_KEY,
  METHOD_KEY,
  COORDS_KEY,
  methodLabel,
  isValidMethod,
  cleanTime,
  formatPrayerTime,
  fetchTimingsByCity,
  fetchMonthByCity,
  type PrayerTimings,
  type AladhanDay,
  type MonthDay,
} from '../lib/prayer';

type Prayer = (typeof ALL_PRAYERS)[number];

const PRAYER_META: Record<Prayer, { icon: string; sunnah: string }> = {
  Fajr: { icon: 'dawn', sunnah: '2 Sunnah + 2 Fard' },
  Sunrise: { icon: 'sun', sunnah: 'Ishraq (2 optional)' },
  Dhuhr: { icon: 'sun', sunnah: '4 Sunnah + 4 Fard + 2 Sunnah' },
  Asr: { icon: 'afternoon', sunnah: '4 Fard' },
  Maghrib: { icon: 'sunset', sunnah: '3 Fard + 2 Sunnah' },
  Isha: { icon: 'moon', sunnah: '4 Fard + 2 Sunnah + 3 Witr' },
};

const LEGACY_KEY = 'iloveislam_prayer_location';

function timeToMinutes(timeStr: string): number {
  const [h, m] = cleanTime(timeStr).split(':').map(Number);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

interface Props {
  initialToday: AladhanDay | null;
  initialMonth: MonthDay[];
  initialCity: string;
  initialCountry: string;
  initialMethod: number;
}

export default function PrayerTimesClient({ initialToday, initialMonth, initialCity, initialCountry, initialMethod }: Props) {
  const [timings, setTimings] = useState<PrayerTimings | null>(initialToday?.timings ?? null);
  const [month, setMonth] = useState<MonthDay[]>(initialMonth);
  const [cityName, setCityName] = useState(initialCity);
  const [countryName, setCountryName] = useState(initialCountry);
  const [hijriDate, setHijriDate] = useState(initialToday?.hijri ?? '');
  const [method, setMethod] = useState(initialMethod);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [showMonth, setShowMonth] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [monthLabel, setMonthLabel] = useState(() =>
    new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' }),
  );

  // Live clock for the countdown.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const persist = useCallback((city: string, country: string, m: number, c?: { lat: number; lng: number } | null) => {
    try {
      localStorage.setItem(CITY_KEY, JSON.stringify({ city, country }));
      localStorage.setItem(METHOD_KEY, String(m));
      if (c) localStorage.setItem(COORDS_KEY, JSON.stringify(c));
    } catch {
      // Storage unavailable — settings still apply for this session.
    }
  }, []);

  const applyDay = useCallback((day: AladhanDay | null, city: string, country: string, m: number) => {
    if (!day) {
      setError('Could not load prayer times. Check the city name and try again.');
      return;
    }
    setTimings(day.timings);
    if (day.hijri) setHijriDate(day.hijri);
    setCityName(city);
    setCountryName(country);
    setError('');
  }, []);

  const fetchByCity = useCallback(
    async (city: string, country: string, m: number) => {
      setUpdating(true);
      setError('');
      const today = new Date();
      const [day, monthData] = await Promise.all([
        fetchTimingsByCity(city, country, m, 0),
        fetchMonthByCity(city, country, m, today.getFullYear(), today.getMonth() + 1, 0),
      ]);
      applyDay(day, city, country, m);
      if (monthData.length > 0) {
        setMonth(monthData);
        setMonthLabel(today.toLocaleDateString('en', { month: 'long', year: 'numeric' }));
      }
      setUpdating(false);
    },
    [applyDay],
  );

  const fetchByCoords = useCallback(
    async (lat: number, lng: number, label: string, m: number) => {
      setUpdating(true);
      setError('');
      try {
        const today = new Date();
        const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        const res = await fetch(
          `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${m}`,
        );
        const data = await res.json();
        if (data.code === 200 && data.data?.timings) {
          const t = data.data.timings;
          applyDay(
            {
              timings: {
                Fajr: String(t.Fajr),
                Sunrise: String(t.Sunrise ?? ''),
                Dhuhr: String(t.Dhuhr),
                Asr: String(t.Asr),
                Maghrib: String(t.Maghrib),
                Isha: String(t.Isha),
              },
              hijri: data.data.date?.hijri
                ? `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year} AH`
                : '',
              gregorian: data.data.date?.gregorian?.date ?? '',
            },
            label,
            '',
            m,
          );
          setCoords({ lat, lng });
        } else {
          setError('Could not fetch prayer times for this location.');
        }
      } catch {
        setError('Network error. Check your connection.');
      }
      setUpdating(false);
    },
    [applyDay],
  );

  // On mount: restore the user's saved city/method (shared with the homepage).
  // Only re-fetch when the saved values differ from the server-rendered ones.
  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    try {
      let savedCity = initialCity;
      let savedCountry = initialCountry;
      let savedMethod = initialMethod;
      let savedCoords: { lat: number; lng: number } | null = null;

      const cityRaw = localStorage.getItem(CITY_KEY);
      if (cityRaw) {
        const parsed = JSON.parse(cityRaw) as { city?: string; country?: string };
        if (parsed.city?.trim()) savedCity = parsed.city.trim();
        if (parsed.country?.trim()) savedCountry = parsed.country.trim();
      }
      const methodRaw = localStorage.getItem(METHOD_KEY);
      if (methodRaw && isValidMethod(Number(methodRaw))) savedMethod = Number(methodRaw);
      const coordsRaw = localStorage.getItem(COORDS_KEY);
      if (coordsRaw) {
        const parsed = JSON.parse(coordsRaw) as { lat?: number; lng?: number };
        if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          savedCoords = { lat: parsed.lat, lng: parsed.lng };
        }
      }
      // One-time migration from the old storage key.
      if (!cityRaw && !methodRaw) {
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const parsed = JSON.parse(legacy) as { lat?: number; lng?: number; city?: string; methodId?: number };
          if (parsed.methodId && isValidMethod(parsed.methodId)) savedMethod = parsed.methodId;
          if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
            savedCoords = { lat: parsed.lat, lng: parsed.lng };
          }
          if (parsed.city) savedCity = parsed.city;
        }
      }

      setMethod(savedMethod);
      if (savedCoords) {
        setCoords(savedCoords);
        void fetchByCoords(savedCoords.lat, savedCoords.lng, savedCity, savedMethod);
      } else if (savedCity !== initialCity || savedCountry !== initialCountry || savedMethod !== initialMethod) {
        setCityName(savedCity);
        setCountryName(savedCountry);
        void fetchByCity(savedCity, savedCountry, savedMethod);
      }
      persist(savedCity, savedCountry, savedMethod, savedCoords);
    } catch {
      // Defaults stand — the server-rendered times are already on screen.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when the method changes (after the initial mount restore).
  const methodRef = useRef(method);
  useEffect(() => {
    if (methodRef.current === method) return;
    methodRef.current = method;
    persist(cityName, countryName, method, coords);
    if (coords) void fetchByCoords(coords.lat, coords.lng, cityName, method);
    else void fetchByCity(cityName, countryName, method);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  const autoDetect = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not available in this browser. Search for your city instead.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geo = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          );
          const geoData = await geo.json();
          const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || '';
          const country = geoData.address?.country || '';
          const name = city ? `${city}, ${country}` : 'Your Location';
          await fetchByCoords(latitude, longitude, name, method);
          persist(city || 'Your Location', country, method, { lat: latitude, lng: longitude });
        } catch {
          await fetchByCoords(latitude, longitude, 'Your Location', method);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
        setError('Location access was denied. Search for your city instead.');
      },
    );
  };

  const searchCity = useCallback(async () => {
    if (!manualCity.trim()) return;
    setLoading(true);
    setError('');
    try {
      const geo = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualCity)}&format=json&limit=1`,
      );
      const geoData = await geo.json();
      if (!geoData.length) {
        setError('City not found.');
        setLoading(false);
        return;
      }
      const { lat, lon, display_name } = geoData[0];
      const parts = String(display_name).split(',');
      const city = parts[0]?.trim() ?? manualCity.trim();
      const country = parts[parts.length - 1]?.trim() ?? '';
      setCoords(null);
      try {
        localStorage.removeItem(COORDS_KEY);
      } catch {
        // ignore
      }
      setManualCity('');
      persist(city, country, method, null);
      await fetchByCity(city, country, method);
    } catch {
      setError('Search failed. Check your connection.');
    }
    setLoading(false);
  }, [manualCity, fetchByCity, method, persist]);

  // --- Derived: next prayer + live countdown ---
  const nextInfo = (() => {
    if (!timings) return null;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    for (const prayer of PRAYER_ORDER) {
      if (timeToMinutes(timings[prayer]) > nowMin) return { prayer, tomorrow: false };
    }
    return { prayer: 'Fajr' as const, tomorrow: true };
  })();

  const countdownSeconds = (() => {
    if (!timings || !nextInfo) return 0;
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const [h, m] = cleanTime(timings[nextInfo.prayer]).split(':').map(Number);
    let pSec = h * 3600 + m * 60;
    if (pSec <= nowSec) pSec += 24 * 3600;
    return pSec - nowSec;
  })();

  // Aladhan returns dates as DD-MM-YYYY (e.g. "21-11-2026") — match that
  // format exactly, or the "Today" highlight never matches any row.
  const todayKey = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

  // "Next 7 days" must be the 7 days AFTER today — not month.slice(0, 7),
  // which showed the 1st–7th of the month (Nov 1–7) all month long.
  const todayIdx = month.findIndex((d) => d.date === todayKey);
  const nextWeek = todayIdx >= 0 ? month.slice(todayIdx + 1, todayIdx + 8) : month.slice(0, 7);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#1C2420]">
      {/* Header */}
      <header className="bg-[#0B3D2E] px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="text-sm font-semibold text-white/70 hover:text-white">
              ← Home
            </Link>
            <button
              type="button"
              onClick={() => setShowSettings((s) => !s)}
              aria-expanded={showSettings}
              aria-label="Prayer time settings"
              className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <ToolIcon name="settings" className="h-4 w-4" />
              Settings
            </button>
          </div>
          <h1 className="mt-4 flex items-center gap-3 text-3xl font-bold text-white sm:text-4xl">
            <ToolIcon name="prayer" className="h-8 w-8 text-[#C9A227]" />
            Prayer Times
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            Accurate daily salah times for {cityName || 'your city'} — {methodLabel(method)} method —
            with a live countdown, a 7-day schedule and a full monthly timetable.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:space-y-6 sm:py-8">
        {/* Settings */}
        {showSettings && (
          <section aria-label="Prayer time settings" className="rounded-2xl border border-[#0B3D2E]/10 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#1C2420]/60">
              <ToolIcon name="pin" className="h-4 w-4 text-[#146B4D]" /> Location &amp; method
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void searchCity()}
                  placeholder="Search city (e.g. London, Karachi)…"
                  className="min-w-0 flex-1 rounded-xl border border-[#1C2420]/15 bg-[#F7F5EF] px-3 py-2.5 text-sm outline-none focus:border-[#146B4D]"
                />
                <button
                  type="button"
                  onClick={() => void searchCity()}
                  className="flex items-center gap-1.5 rounded-xl bg-[#0B3D2E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#146B4D]"
                >
                  <ToolIcon name="search" className="h-4 w-4" /> Search
                </button>
              </div>
              <button
                type="button"
                onClick={autoDetect}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#0B3D2E]/15 px-4 py-2.5 text-sm font-semibold text-[#0B3D2E] transition hover:border-[#146B4D]"
              >
                <ToolIcon name="pin" className="h-4 w-4" /> Use my GPS location
              </button>
            </div>
            <label className="mt-4 block text-xs font-semibold text-[#1C2420]/70">
              Calculation method
              <select
                value={method}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  if (isValidMethod(id)) setMethod(id);
                }}
                className="mt-1 w-full rounded-xl border border-[#1C2420]/15 bg-[#F7F5EF] px-3 py-2.5 text-sm outline-none focus:border-[#146B4D]"
              >
                {PRAYER_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-2 text-xs text-[#1C2420]/50">
              Your city and method are saved on this device — the homepage uses the same settings,
              so both pages always agree.
            </p>
          </section>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {/* Next prayer countdown */}
        {timings && nextInfo && (
          <section aria-label="Next prayer" className="relative overflow-hidden rounded-2xl bg-[#0B3D2E] p-5 text-center text-white shadow-sm sm:p-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{ backgroundImage: 'url(/hero-pattern.svg)', backgroundSize: '96px 96px' }}
            />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#C9A227]">
                Next prayer · {nextInfo.prayer}
                {nextInfo.tomorrow ? ' (tomorrow)' : ''}
              </p>
              <p className="mt-1 text-2xl font-bold sm:text-3xl">
                {nextInfo.prayer} at {formatPrayerTime(timings[nextInfo.prayer])}
              </p>
              <div className="mt-3 flex justify-center gap-2" aria-label="Countdown to next prayer">
                {[
                  { val: Math.floor(countdownSeconds / 3600), label: 'hr' },
                  { val: Math.floor((countdownSeconds % 3600) / 60), label: 'min' },
                  { val: countdownSeconds % 60, label: 'sec' },
                ].map((item) => (
                  <div key={item.label} className="min-w-[64px] rounded-xl bg-white/10 px-3 py-2">
                    <p className="text-xl font-bold tabular-nums">{String(item.val).padStart(2, '0')}</p>
                    <p className="text-[10px] uppercase tracking-wide text-white/50">{item.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-white/60">
                <span className="flex items-center gap-1">
                  <ToolIcon name="pin" className="h-3.5 w-3.5" /> {cityName}
                  {countryName ? `, ${countryName}` : ''}
                </span>
                {hijriDate && (
                  <span className="flex items-center gap-1">
                    <ToolIcon name="moon" className="h-3.5 w-3.5" /> {hijriDate}
                  </span>
                )}
                {updating && <span>Updating…</span>}
              </p>
            </div>
          </section>
        )}

        {/* Loading skeleton — only ever shown when no data exists at all */}
        {!timings && loading && (
          <div className="space-y-3" aria-live="polite">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-white shadow-sm" />
            ))}
            <p className="text-center text-sm text-[#1C2420]/60">Loading prayer times…</p>
          </div>
        )}

        {/* Today's schedule + 7-day view */}
        {timings && (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
            <section aria-label="Today's prayer times" className="overflow-hidden rounded-2xl border border-[#0B3D2E]/10 bg-white shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-[#1C2420]/5 px-5 py-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1C2420]/60">Today&rsquo;s schedule</h2>
                <p className="text-xs text-[#1C2420]/50">
                  {now.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' })}
                </p>
              </div>
              <ul>
                {ALL_PRAYERS.map((prayer, i) => {
                  const isNext = nextInfo?.prayer === prayer && !nextInfo.tomorrow;
                  return (
                    <li
                      key={prayer}
                      className={`flex items-center gap-3 px-5 py-3.5 ${i < ALL_PRAYERS.length - 1 ? 'border-b border-[#1C2420]/5' : ''} ${
                        isNext ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isNext ? 'bg-[#146B4D] text-white' : 'bg-[#F7F5EF] text-[#146B4D]'}`}>
                        <ToolIcon name={PRAYER_META[prayer].icon} className="h-4.5 w-4.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-semibold ${isNext ? 'text-emerald-700' : 'text-[#1C2420]'}`}>
                          {prayer}
                          {isNext && (
                            <span className="ml-2 rounded-full bg-[#C9A227] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0B3D2E]">
                              Next
                            </span>
                          )}
                        </span>
                        <span className="block text-[11px] text-[#1C2420]/50">{PRAYER_META[prayer].sunnah}</span>
                      </span>
                      <span className={`text-sm font-bold tabular-nums ${isNext ? 'text-emerald-700' : 'text-[#1C2420]'}`}>
                        {formatPrayerTime(timings[prayer])}
                      </span>
                      {isNext && (
                        <span className="text-xs font-semibold text-emerald-700">
                          in {Math.floor(countdownSeconds / 3600)}h{' '}
                          {String(Math.floor((countdownSeconds % 3600) / 60)).padStart(2, '0')}m
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* 7-day schedule (derived from the monthly data) */}
            <section aria-label="7-day schedule" className="overflow-hidden rounded-2xl border border-[#0B3D2E]/10 bg-white shadow-sm lg:col-span-3">
              <div className="flex items-center justify-between border-b border-[#1C2420]/5 px-5 py-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1C2420]/60">Next 7 days</h2>
                <button
                  type="button"
                  onClick={() => setShowMonth((s) => !s)}
                  className="text-xs font-semibold text-[#146B4D] hover:underline"
                >
                  {showMonth ? 'Hide monthly timetable ↑' : 'View full month ↓'}
                </button>
              </div>
              {nextWeek.length === 0 ? (
                <p className="px-5 py-6 text-sm text-[#1C2420]/60">
                  The 7-day schedule loads with today&rsquo;s times — change city or method to refresh it.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wide text-[#1C2420]/50">
                        <th className="px-5 py-2.5 font-semibold">Day</th>
                        {ALL_PRAYERS.map((p) => (
                          <th key={p} className="px-2 py-2.5 text-center font-semibold">
                            {p.slice(0, 3)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {nextWeek.map((day) => {
                        const isToday = day.date === todayKey;
                        return (
                          <tr key={day.date} className={isToday ? 'bg-emerald-50 font-semibold' : 'border-t border-[#1C2420]/5'}>
                            <td className="px-5 py-2.5">
                              {day.weekday} {Number(day.date.split('-')[0])}
                              {isToday && <span className="ml-2 text-[10px] font-bold uppercase text-emerald-700">Today</span>}
                            </td>
                            {ALL_PRAYERS.map((p) => (
                              <td key={p} className="px-2 py-2.5 text-center tabular-nums">
                                {formatPrayerTime(day.timings[p])}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Monthly timetable */}
        {timings && showMonth && month.length > 0 && (
          <section aria-label={`Monthly prayer timetable — ${monthLabel}`} className="overflow-hidden rounded-2xl border border-[#0B3D2E]/10 bg-white shadow-sm">
            <div className="border-b border-[#1C2420]/5 px-5 py-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1C2420]/60">
                Monthly timetable · {monthLabel} · {cityName}
              </h2>
            </div>
            <div className="max-h-[480px] overflow-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-[11px] uppercase tracking-wide text-[#1C2420]/50">
                    <th className="px-5 py-2.5 font-semibold">Date</th>
                    <th className="px-2 py-2.5 font-semibold">Hijri</th>
                    {ALL_PRAYERS.map((p) => (
                      <th key={p} className="px-2 py-2.5 text-center font-semibold">
                        {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {month.map((day) => {
                    const isToday = day.date === todayKey;
                    return (
                      <tr key={day.date} className={isToday ? 'bg-emerald-50 font-semibold' : 'border-t border-[#1C2420]/5'}>
                        <td className="px-5 py-2">
                          {day.weekday} {day.date}
                          {isToday && <span className="ml-2 text-[10px] font-bold uppercase text-emerald-700">Today</span>}
                        </td>
                        <td className="px-2 py-2 text-xs text-[#1C2420]/60">{day.hijri}</td>
                        {ALL_PRAYERS.map((p) => (
                          <td key={p} className="px-2 py-2 text-center tabular-nums">
                            {formatPrayerTime(day.timings[p])}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Sunnah reminder */}
        {timings && (
          <section aria-label="Sunnah reminder" className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
              <ToolIcon name="sparkle" className="h-4 w-4" /> Sunnah reminder
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-800">
              The Prophet ﷺ said: <em>&ldquo;The most beloved deeds to Allah are those done
              consistently, even if they are small.&rdquo;</em> (Bukhari &amp; Muslim)
            </p>
            <p className="mt-2 text-xs text-amber-700">
              Tip: Praying 12 rak&apos;ah of Sunnah daily earns a house in Jannah (Muslim) —
              2 before Fajr, 4 before Dhuhr, 2 after Dhuhr, 2 after Maghrib, 2 after Isha.
            </p>
          </section>
        )}

        <p className="pb-8 text-center text-xs text-[#1C2420]/45">
          Times from the Aladhan API · {cityName && `${cityName} · `}Method: {methodLabel(method)}
        </p>
      </main>
    </div>
  );
}
