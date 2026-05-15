'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const PRAYERS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_ICONS = { Fajr: '🌅', Sunrise: '☀️', Dhuhr: '🌤️', Asr: '⛅', Maghrib: '🌇', Isha: '🌙' };

const METHODS = [
  { id: 2, name: 'Islamic Society of North America (ISNA)' },
  { id: 1, name: 'Muslim World League' },
  { id: 3, name: 'Egyptian General Authority' },
  { id: 4, name: 'Umm Al-Qura (Saudi Arabia)' },
  { id: 5, name: 'University of Islamic Sciences, Karachi' },
  { id: 15, name: 'Diyanet (Turkey)' },
  { id: 11, name: 'Majlis Ugama Islam Singapura' },
];

function formatTime(timeStr) {
  if (!timeStr) return '--:--';
  const [hour, minute] = timeStr.split(':');
  const h = parseInt(hour);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minute} ${ampm}`;
}

function getNextPrayer(timings) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (const prayer of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
    if (!timings[prayer]) continue;
    const [h, m] = timings[prayer].split(':').map(Number);
    if (h * 60 + m > nowMinutes) return prayer;
  }
  return 'Fajr';
}

export default function PrayerTimes() {
  const [timings, setTimings] = useState(null);
  const [location, setLocation] = useState(null);
  const [cityName, setCityName] = useState('');
  const [method, setMethod] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [date, setDate] = useState(new Date());
  const [nextPrayer, setNextPrayer] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timings) setNextPrayer(getNextPrayer(timings));
  }, [timings, date]);

  const fetchByCoords = async (lat, lng, name) => {
    setLoading(true);
    setError('');
    try {
      const today = new Date();
      const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      const res = await fetch(
        `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${method}`
      );
      const data = await res.json();
      if (data.code === 200) {
        setTimings(data.data.timings);
        setCityName(name || `${lat.toFixed(2)}, ${lng.toFixed(2)}`);
      } else {
        setError('Could not fetch prayer times. Try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    }
    setLoading(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return setError('Geolocation not supported.');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        // Reverse geocode
        try {
          const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const geoData = await geo.json();
          const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Your Location';
          const country = geoData.address?.country || '';
          fetchByCoords(latitude, longitude, `${city}, ${country}`);
        } catch {
          fetchByCoords(latitude, longitude, 'Your Location');
        }
      },
      () => { setError('Location access denied. Enter your city below.'); setLoading(false); }
    );
  };

  const searchCity = async () => {
    if (!manualCity.trim()) return;
    setLoading(true);
    setError('');
    try {
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualCity)}&format=json&limit=1`);
      const geoData = await geo.json();
      if (geoData.length === 0) { setError('City not found. Try another name.'); setLoading(false); return; }
      const { lat, lon, display_name } = geoData[0];
      const city = display_name.split(',')[0];
      fetchByCoords(parseFloat(lat), parseFloat(lon), city);
    } catch {
      setError('Could not find city.'); setLoading(false);
    }
  };

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="min-h-screen bg-gray-50">
      <header style={{ background: '#0a3d2e' }} className="px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
        <h1 className="text-white font-medium">Prayer Times</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Date */}
        <div className="text-center mb-6">
          <p className="text-2xl font-light text-gray-800">{days[date.getDay()]}</p>
          <p className="text-gray-400">{months[date.getMonth()]} {date.getDate()}, {date.getFullYear()}</p>
          <p className="text-lg font-medium text-gray-700 mt-1">
            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Location controls */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Location</p>

          <button onClick={useMyLocation}
            style={{ background: '#0a3d2e' }}
            className="w-full text-white rounded-xl py-3 font-medium mb-3 hover:opacity-90 transition-opacity">
            📍 Use My Location
          </button>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualCity}
              onChange={e => setManualCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchCity()}
              placeholder="Or type your city..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <button onClick={searchCity}
              className="px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Search
            </button>
          </div>

          <div className="mt-3">
            <label className="text-xs text-gray-500 mb-1 block">Calculation method</label>
            <select value={method} onChange={e => setMethod(parseInt(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
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
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-500 mb-4">{error}</div>
        )}

        {timings && !loading && (
          <>
            <div className="text-center mb-4">
              <p className="text-gray-500 text-sm">Prayer times for</p>
              <p className="font-semibold text-gray-800 text-lg">📍 {cityName}</p>
            </div>

            {nextPrayer && (
              <div style={{ background: '#0a3d2e' }} className="rounded-2xl p-4 mb-4 text-center">
                <p className="text-white/60 text-sm">Next prayer</p>
                <p className="text-white text-xl font-semibold">{PRAYER_ICONS[nextPrayer]} {nextPrayer}</p>
                <p style={{ color: '#c8a96e' }} className="text-2xl font-bold">{formatTime(timings[nextPrayer])}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {PRAYERS.map((prayer, i) => {
                const isNext = prayer === nextPrayer;
                return (
                  <div key={prayer}
                    className={`flex items-center px-6 py-4 ${i < PRAYERS.length - 1 ? 'border-b border-gray-50' : ''} ${isNext ? 'bg-emerald-50' : ''}`}>
                    <span className="text-xl mr-3">{PRAYER_ICONS[prayer]}</span>
                    <span className={`flex-1 font-medium ${isNext ? 'text-emerald-700' : 'text-gray-700'}`}>{prayer}</span>
                    <span className={`font-semibold ${isNext ? 'text-emerald-700' : 'text-gray-800'}`}>
                      {formatTime(timings[prayer])}
                    </span>
                    {isNext && <span className="ml-3 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">Next</span>}
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