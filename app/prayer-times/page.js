'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';

// ==================== TYPES ====================
interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Imsak?: string;
  Midnight?: string;
  Lastthird?: string;
}

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

interface SavedLocation {
  name: string;
  lat: number;
  lng: number;
  method: number;
}

// ==================== CONSTANTS ====================
const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
const PRAYER_ICONS: Record<string, string> = { 
  Fajr: '🌅', Sunrise: '☀️', Dhuhr: '🌤️', Asr: '⛅', 
  Maghrib: '🌇', Isha: '🌙'
};

const METHODS = [
  { id: 2, name: 'ISNA (North America)' },
  { id: 1, name: 'Muslim World League' },
  { id: 3, name: 'Egyptian Authority' },
  { id: 4, name: 'Umm Al-Qura (Makkah)' },
  { id: 5, name: 'Karachi (Pakistan)' },
  { id: 15, name: 'Diyanet (Turkey)' },
  { id: 11, name: 'Singapore (MUIS)' },
];

const STORAGE_KEY = 'prayer_favorites';

// ==================== UTILITIES ====================
function formatTime(timeStr: string, use24Hour: boolean = false): string {
  if (!timeStr || timeStr === '-----') return '--:--';
  const [hour, minute] = timeStr.split(':');
  const h = parseInt(hour);
  if (use24Hour) return `${hour}:${minute}`;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minute} ${ampm}`;
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getNextPrayerInfo(timings: PrayerTimings) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  
  for (const prayer of PRAYERS) {
    if (!timings[prayer]) continue;
    const prayerMinutes = timeToMinutes(timings[prayer]);
    if (prayerMinutes > nowMinutes) {
      const minutesUntil = prayerMinutes - nowMinutes;
      return { prayer, minutesUntil, time: timings[prayer] };
    }
  }
  // Next day's Fajr
  const fajrMinutes = timeToMinutes(timings.Fajr) + 1440;
  const minutesUntil = fajrMinutes - nowMinutes;
  return { prayer: 'Fajr', minutesUntil, time: timings.Fajr };
}

// ==================== WEATHER COMPONENT ====================
function WeatherDisplay({ lat, lng, cityName }: { lat?: number; lng?: number; cityName?: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lng) return;
    
    const fetchWeather = async () => {
      setLoading(true);
      try {
        // Using Open-Meteo (free, no API key required)
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m&timezone=auto`
        );
        const data = await res.json();
        
        if (data.current_weather) {
          const current = data.current_weather;
          // Map weather codes to conditions
          const weatherCode = current.weathercode;
          let condition = 'Clear';
          let icon = '☀️';
          
          if (weatherCode === 0) { condition = 'Clear'; icon = '☀️'; }
          else if (weatherCode === 1 || weatherCode === 2) { condition = 'Partly Cloudy'; icon = '⛅'; }
          else if (weatherCode === 3) { condition = 'Cloudy'; icon = '☁️'; }
          else if (weatherCode >= 45 && weatherCode <= 48) { condition = 'Foggy'; icon = '🌫️'; }
          else if (weatherCode >= 51 && weatherCode <= 55) { condition = 'Drizzle'; icon = '🌧️'; }
          else if (weatherCode >= 61 && weatherCode <= 65) { condition = 'Rain'; icon = '🌧️'; }
          else if (weatherCode >= 71 && weatherCode <= 77) { condition = 'Snow'; icon = '❄️'; }
          else if (weatherCode >= 80 && weatherCode <= 82) { condition = 'Rain Showers'; icon = '🌧️'; }
          else if (weatherCode >= 95 && weatherCode <= 99) { condition = 'Thunderstorm'; icon = '⛈️'; }
          
          setWeather({
            temp: Math.round(current.temperature),
            condition,
            icon,
            humidity: 0, // Open-Meteo free tier needs hourly for humidity
            windSpeed: Math.round(current.windspeed),
          });
        }
      } catch (error) {
        console.error('Weather fetch error:', error);
      }
      setLoading(false);
    };
    
    fetchWeather();
  }, [lat, lng]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-3 shadow-sm border border-blue-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{weather.icon}</span>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Weather</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{weather.condition}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{weather.temp}°</p>
          <p className="text-[10px] text-gray-400">💨 {weather.windSpeed} km/h</p>
        </div>
      </div>
    </div>
  );
}

// ==================== COUNTDOWN TIMER ====================
function CountdownTimer({ minutesUntil }: { minutesUntil: number }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const target = new Date(now.getTime() + minutesUntil * 60000);
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) return;
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [minutesUntil]);
  
  if (minutesUntil <= 0) return null;
  
  return (
    <div className="text-center mt-3 pt-3 border-t border-white/20">
      <p className="text-3xl font-mono font-bold tracking-wider text-white">
        {timeLeft.hours.toString().padStart(2, '0')}:
        {timeLeft.minutes.toString().padStart(2, '0')}:
        {timeLeft.seconds.toString().padStart(2, '0')}
      </p>
      <p className="text-white/40 text-[10px] mt-1">until {timeLeft.hours > 0 ? 'next prayer' : 'prayer time'}</p>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function PrayerTimes() {
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cityName, setCityName] = useState('');
  const [method, setMethod] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [date, setDate] = useState(new Date());
  const [nextPrayer, setNextPrayer] = useState<{ prayer: string; minutesUntil: number; time: string } | null>(null);
  const [use24Hour, setUse24Hour] = useState(false);
  const [hijriDate, setHijriDate] = useState('');
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setSavedLocations(JSON.parse(saved));
  }, []);

  // Fetch Hijri date
  useEffect(() => {
    const fetchHijri = async () => {
      try {
        const today = new Date();
        const res = await fetch(`https://api.aladhan.com/v1/gToH/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`);
        const data = await res.json();
        if (data.code === 200) {
          const h = data.data.hijri;
          setHijriDate(`${h.day} ${h.month.en} ${h.year} AH`);
        }
      } catch {}
    };
    fetchHijri();
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update next prayer info
  useEffect(() => {
    if (timings) {
      setNextPrayer(getNextPrayerInfo(timings));
    }
  }, [timings, date]);

  const fetchPrayerTimes = useCallback(async (lat: number, lng: number, name: string, selectedMethod: number = method) => {
    setLoading(true);
    setError('');
    try {
      const today = new Date();
      const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      const res = await fetch(
        `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${selectedMethod}`
      );
      const data = await res.json();
      if (data.code === 200) {
        setTimings(data.data.timings);
        setCityName(name);
        setLocation({ lat, lng });
      } else {
        setError('Could not fetch prayer times. Try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    }
    setLoading(false);
  }, [method]);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) return setError('Geolocation not supported.');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        try {
          const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const geoData = await geo.json();
          const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Your Location';
          const country = geoData.address?.country || '';
          fetchPrayerTimes(latitude, longitude, `${city}, ${country}`, method);
        } catch {
          fetchPrayerTimes(latitude, longitude, 'Your Location', method);
        }
      },
      () => { setError('Location access denied. Enter your city below.'); setLoading(false); }
    );
  }, [fetchPrayerTimes, method]);

  const searchCity = useCallback(async () => {
    if (!manualCity.trim()) return;
    setLoading(true);
    setError('');
    try {
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualCity)}&format=json&limit=1`);
      const geoData = await geo.json();
      if (geoData.length === 0) { setError('City not found. Try another name.'); setLoading(false); return; }
      const { lat, lon, display_name } = geoData[0];
      const city = display_name.split(',')[0];
      fetchPrayerTimes(parseFloat(lat), parseFloat(lon), city, method);
      setManualCity('');
    } catch {
      setError('Could not find city.'); setLoading(false);
    }
  }, [manualCity, fetchPrayerTimes, method]);

  const saveCurrentLocation = useCallback(() => {
    if (!location || !cityName) return;
    const newFav: SavedLocation = { name: cityName.split(',')[0], lat: location.lat, lng: location.lng, method };
    const updated = [newFav, ...savedLocations.filter(l => l.name !== cityName.split(',')[0])].slice(0, 3);
    setSavedLocations(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [location, cityName, method, savedLocations]);

  const loadSavedLocation = useCallback((saved: SavedLocation) => {
    fetchPrayerTimes(saved.lat, saved.lng, saved.name, saved.method);
    setMethod(saved.method);
  }, [fetchPrayerTimes]);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header style={{ background: '#0a3d2e' }} className="px-4 py-3 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/60 hover:text-white text-sm transition">
            ← Back
          </Link>
          <h1 className="text-white font-semibold text-sm">🕌 Prayer Times</h1>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="text-white/60 hover:text-white text-sm"
          >
            ⚙️
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 pb-24">
        {/* Date & Time - Compact */}
        <div className="text-center mb-5">
          <p className="text-xl font-light text-gray-800 dark:text-gray-100">{days[date.getDay()]}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{months[date.getMonth()]} {date.getDate()}</span>
            <span>•</span>
            <span>{hijriDate || 'Loading...'}</span>
          </div>
          <p className="text-2xl font-mono font-semibold text-gray-800 dark:text-gray-200 mt-1">
            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>

        {/* Weather Display - New! */}
        {location && <WeatherDisplay lat={location.lat} lng={location.lng} cityName={cityName} />}

        {/* Settings Panel (collapsible) */}
        {showSettings && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">Settings</p>
            
            <div className="mb-3">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Time Format</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setUse24Hour(false)}
                  className={`flex-1 py-2 rounded-lg text-sm transition ${!use24Hour ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                  12h (AM/PM)
                </button>
                <button 
                  onClick={() => setUse24Hour(true)}
                  className={`flex-1 py-2 rounded-lg text-sm transition ${use24Hour ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                  24h
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Calculation Method</label>
              <select 
                value={method} 
                onChange={e => setMethod(parseInt(e.target.value))}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white"
              >
                {METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Location Controls - Compact */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex gap-2 mb-2">
            <button 
              onClick={useMyLocation}
              style={{ background: '#0a3d2e' }}
              className="flex-1 text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 transition"
            >
              📍 My Location
            </button>
            <div className="flex-1 flex gap-1">
              <input
                type="text"
                value={manualCity}
                onChange={e => setManualCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchCity()}
                placeholder="City name..."
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-400 outline-none"
              />
              <button 
                onClick={searchCity}
                className="px-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition"
              >
                🔍
              </button>
            </div>
          </div>

          {/* Saved Locations */}
          {savedLocations.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {savedLocations.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => loadSavedLocation(loc)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition"
                >
                  📌 {loc.name}
                </button>
              ))}
              {location && (
                <button
                  onClick={saveCurrentLocation}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-emerald-300 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 transition"
                >
                  + Save Current
                </button>
              )}
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3 animate-pulse">🕌</div>
            <p className="text-gray-400 text-sm">Loading prayer times...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-3 text-sm text-red-500 dark:text-red-400 mb-4">
            ⚠️ {error}
          </div>
        )}

        {timings && !loading && (
          <>
            {/* Location Name */}
            <div className="text-center mb-4">
              <p className="text-xs text-gray-400">Prayer times for</p>
              <p className="font-semibold text-gray-800 dark:text-gray-200">{cityName}</p>
            </div>

            {/* Next Prayer Card */}
            {nextPrayer && (
              <div 
                className="rounded-2xl p-5 mb-5 text-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #0d5238 100%)' }}
              >
                <div className="absolute top-2 right-3 text-5xl opacity-5">☪️</div>
                <p className="text-white/40 text-[10px] tracking-wider uppercase mb-1">Next Prayer</p>
                <p className="text-3xl font-bold text-white mb-1">
                  {PRAYER_ICONS[nextPrayer.prayer]} {nextPrayer.prayer}
                </p>
                <p className="text-2xl font-mono font-bold text-amber-300">
                  {formatTime(nextPrayer.time, use24Hour)}
                </p>
                <CountdownTimer minutesUntil={nextPrayer.minutesUntil} />
              </div>
            )}

            {/* Prayer Times List - Clean */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              {PRAYERS.map((prayer) => {
                const time = timings[prayer];
                const isNext = prayer === nextPrayer?.prayer;
                
                return (
                  <div 
                    key={prayer}
                    className={`flex items-center px-4 py-3.5 ${isNext ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''} border-b border-gray-50 dark:border-gray-700 last:border-0`}
                  >
                    <span className="text-xl mr-3 w-8">{PRAYER_ICONS[prayer]}</span>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${isNext ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {prayer}
                      </p>
                      {prayer === 'Fajr' && (
                        <p className="text-[9px] text-gray-400">Start fast</p>
                      )}
                      {prayer === 'Maghrib' && (
                        <p className="text-[9px] text-gray-400">Break fast</p>
                      )}
                    </div>
                    <span className={`font-mono font-semibold text-base ${isNext ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {formatTime(time, use24Hour)}
                    </span>
                    {isNext && (
                      <span className="ml-2 text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                        Next
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sunrise & Fasting Info - Compact */}
            {timings.Sunrise && timings.Maghrib && (
              <div className="mt-4 flex justify-between items-center px-4 py-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500">🌅 Sunrise</p>
                  <p className="font-semibold text-sm">{formatTime(timings.Sunrise, use24Hour)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500">⏱️ Day Length</p>
                  <p className="font-semibold text-sm">
                    {(() => {
                      const sunrise = timeToMinutes(timings.Sunrise);
                      const maghrib = timeToMinutes(timings.Maghrib);
                      const hours = Math.floor((maghrib - sunrise) / 60);
                      const mins = (maghrib - sunrise) % 60;
                      return `${hours}h ${mins}m`;
                    })()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500">🌙 Maghrib</p>
                  <p className="font-semibold text-sm">{formatTime(timings.Maghrib, use24Hour)}</p>
                </div>
              </div>
            )}

            {/* Tahajjud Time - Small text */}
            {timings.Lastthird && timings.Fajr && (
              <p className="text-center text-[10px] text-gray-400 mt-3">
                🌙 Best Tahajjud: {formatTime(timings.Lastthird, use24Hour)} - {formatTime(timings.Fajr, use24Hour)}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}