'use client';

import { useState, useEffect, useCallback } from 'react';
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

interface CalculationMethod {
  id: number;
  name: string;
}

/* ---- Constants ---- */
const PRAYERS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
type Prayer = (typeof PRAYERS)[number];

const PRAYER_ICONS: Record<Prayer, string> = {
  Fajr: '🌅',
  Sunrise: '☀️',
  Dhuhr: '🌤️',
  Asr: '⛅',
  Maghrib: '🌇',
  Isha: '🌙',
};

const METHODS: CalculationMethod[] = [
  { id: 2, name: 'Islamic Society of North America (ISNA)' },
  { id: 1, name: 'Muslim World League' },
  { id: 3, name: 'Egyptian General Authority' },
  { id: 4, name: 'Umm Al-Qura (Saudi Arabia)' },
  { id: 5, name: 'University of Islamic Sciences, Karachi' },
  { id: 15, name: 'Diyanet (Turkey)' },
  { id: 11, name: 'Majlis Ugama Islam Singapura' },
];

/* ---- Helpers ---- */
function formatTime(timeStr: string | undefined): string {
  if (!timeStr) return '--:--';
  const [hour, minute] = timeStr.split(':');
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minute} ${ampm}`;
}

function getNextPrayer(timings: PrayerTimings): Prayer {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const prayers: Prayer[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  for (const prayer of prayers) {
    const time = timings[prayer];
    if (!time) continue;
    const [h, m] = time.split(':').map(Number);
    if (h * 60 + m > nowMinutes) return prayer;
  }
  return 'Fajr';
}

export default function PrayerTimes() {
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [cityName, setCityName] = useState<string>('');
  const [method, setMethod] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [date, setDate] = useState(new Date());
  const [nextPrayer, setNextPrayer] = useState<Prayer>('Fajr');

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Recalculate next prayer when timings or date change
  useEffect(() => {
    if (timings) setNextPrayer(getNextPrayer(timings));
  }, [timings, date]);

  // Fetch prayer times by coordinates
  const fetchByCoords = useCallback(
    async (lat: number, lng: number, name?: string) => {
      setLoading(true);
      setError('');
      try {
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        const dateStr = `${day}-${month}-${year}`;
        const res = await fetch(
          `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${method}`
        );
        const data = await res.json();
        if (data.code === 200) {
          setTimings(data.data.timings);
          setCityName(name || `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`);
        } else {
          setError('Could not fetch prayer times. Please try again.');
        }
      } catch {
        setError('Network error. Please check your connection.');
      }
      setLoading(false);
    },
    [method]
  );

  // Use browser geolocation
  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geo = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const geoData = await geo.json();
          const city =
            geoData.address?.city ||
            geoData.address?.town ||
            geoData.address?.village ||
            '';
          const country = geoData.address?.country || '';
          fetchByCoords(latitude, longitude, `${city}, ${country}`.trim());
        } catch {
          fetchByCoords(latitude, longitude, 'Your Location');
        }
      },
      () => {
        setError('Location access denied. You can search for your city below.');
        setLoading(false);
      }
    );
  }, [fetchByCoords]);

  // Search by city name
  const searchCity = useCallback(async () => {
    if (!manualCity.trim()) return;
    setLoading(true);
    setError('');
    try {
      const geo = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          manualCity
        )}&format=json&limit=1`
      );
      const geoData = await geo.json();
      if (!geoData.length) {
        setError('City not found. Try a more specific name.');
        setLoading(false);
        return;
      }
      const { lat, lon, display_name } = geoData[0];
      const city = display_name.split(',')[0];
      fetchByCoords(parseFloat(lat), parseFloat(lon), city);
    } catch {
      setError('Could not find city. Please try again.');
      setLoading(false);
    }
  }, [manualCity, fetchByCoords]);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tool Header */}
      <header style={{ background: '#0a3d2e' }} className="px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">
          ← Back
        </Link>
        <h1 className="text-white font-medium text-lg">Prayer Times</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Live Date & Clock */}
        <div className="text-center mb-6">
          <p className="text-2xl font-light text-gray-800">{days[date.getDay()]}</p>
          <p className="text-gray-400">
            {months[date.getMonth()]} {date.getDate()}, {date.getFullYear()}
          </p>
          <p className="text-lg font-medium text-gray-700 mt-1">
            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Controls Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Location
          </p>

          <button
            onClick={useMyLocation}
            style={{ background: '#0a3d2e' }}
            className="w-full text-white rounded-xl py-3 font-medium mb-3 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            📍 Use My Location
          </button>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchCity()}
              placeholder="Or type your city..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
              aria-label="City name"
            />
            <button
              onClick={searchCity}
              className="px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Search
            </button>
          </div>

          <div className="mt-3">
            <label className="text-xs text-gray-500 mb-1 block" htmlFor="calculation-method">
              Calculation method
            </label>
            <select
              id="calculation-method"
              value={method}
              onChange={(e) => setMethod(parseInt(e.target.value, 10))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
            >
              {METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3 animate-pulse">🕌</div>
            <p className="text-gray-400">Fetching prayer times...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-500 mb-4">
            {error}
          </div>
        )}

        {timings && !loading && (
          <>
            <div className="text-center mb-4">
              <p className="text-gray-500 text-sm">Prayer times for</p>
              <p className="font-semibold text-gray-800 text-lg">📍 {cityName}</p>
            </div>

            {nextPrayer && (
              <div
                style={{ background: '#0a3d2e' }}
                className="rounded-2xl p-4 mb-4 text-center"
              >
                <p className="text-white/60 text-sm">Next prayer</p>
                <p className="text-white text-xl font-semibold">
                  {PRAYER_ICONS[nextPrayer]} {nextPrayer}
                </p>
                <p style={{ color: '#c8a96e' }} className="text-2xl font-bold">
                  {formatTime(timings[nextPrayer])}
                </p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {PRAYERS.map((prayer, i) => {
                const isNext = prayer === nextPrayer;
                return (
                  <div
                    key={prayer}
                    className={`flex items-center px-6 py-4 ${
                      i < PRAYERS.length - 1 ? 'border-b border-gray-50' : ''
                    } ${isNext ? 'bg-emerald-50' : ''}`}
                  >
                    <span className="text-xl mr-3" aria-hidden="true">
                      {PRAYER_ICONS[prayer]}
                    </span>
                    <span
                      className={`flex-1 font-medium ${
                        isNext ? 'text-emerald-700' : 'text-gray-700'
                      }`}
                    >
                      {prayer}
                    </span>
                    <span
                      className={`font-semibold ${
                        isNext ? 'text-emerald-700' : 'text-gray-800'
                      }`}
                    >
                      {formatTime(timings[prayer])}
                    </span>
                    {isNext && (
                      <span className="ml-3 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        Next
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}