'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

// Kaaba coordinates (precise)
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// ── Correct Qibla bearing (great‑circle initial bearing) ──
function calculateQibla(lat: number, lng: number): number {
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const λ2 = (KAABA_LNG * Math.PI) / 180;
  const Δλ = λ2 - λ1;

  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const y = Math.sin(Δλ) * Math.cos(φ2);

  const θ = Math.atan2(y, x);
  const degrees = θ * (180 / Math.PI);
  return (degrees + 360) % 360;
}

// Haversine distance
function calculateDistance(lat: number, lng: number): number {
  const R = 6371;
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const Δφ = ((KAABA_LAT - lat) * Math.PI) / 180;
  const Δλ = ((KAABA_LNG - lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function getCardinalDirection(degrees: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return dirs[index];
}

function getDirectionEmoji(degrees: number): string {
  if (degrees >= 337.5 || degrees < 22.5) return '⬆️';
  if (degrees >= 22.5 && degrees < 67.5) return '↗️';
  if (degrees >= 67.5 && degrees < 112.5) return '➡️';
  if (degrees >= 112.5 && degrees < 157.5) return '↘️';
  if (degrees >= 157.5 && degrees < 202.5) return '⬇️';
  if (degrees >= 202.5 && degrees < 247.5) return '↙️';
  if (degrees >= 247.5 && degrees < 292.5) return '⬅️';
  return '↖️';
}

// Low‑pass filter for compass
function lowPassFilter(newValue: number, oldValue: number, smoothing: number = 0.15): number {
  const diff = newValue - oldValue;
  const adjustedDiff = ((diff + 540) % 360) - 180;
  return (oldValue + adjustedDiff * smoothing + 360) % 360;
}

interface LocationInfo {
  lat: number;
  lng: number;
  name: string;
  country: string;
  flag: string;
}

export default function QiblaFinder() {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchCity, setSearchCity] = useState('');

  // Compass states
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [compassPermission, setCompassPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [compassEnabled, setCompassEnabled] = useState(false);
  const [isFacingQibla, setIsFacingQibla] = useState(false);
  const [alignmentAccuracy, setAlignmentAccuracy] = useState<number>(180);
  const [compassAccuracy, setCompassAccuracy] = useState<number | null>(null);

  const compassListenerRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);
  const filterRef = useRef<number>(0);

  useEffect(() => {
    if (qiblaDirection !== null && compassEnabled) {
      const diff = Math.abs(qiblaDirection - compassHeading);
      const angleDiff = Math.min(diff, 360 - diff);
      setAlignmentAccuracy(angleDiff);
      setIsFacingQibla(angleDiff <= 5);
    }
  }, [qiblaDirection, compassHeading, compassEnabled]);

  const getFlagEmoji = (countryCode: string): string => {
    if (!countryCode) return '📍';
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const updateLocation = useCallback(async (lat: number, lng: number, name: string, country: string = '', countryCode: string = '') => {
    setLocation({ lat, lng, name, country, flag: getFlagEmoji(countryCode) });
    const qibla = calculateQibla(lat, lng);
    const dist = calculateDistance(lat, lng);
    setQiblaDirection(qibla);
    setDistance(dist);
    setLoading(false);
  }, []);

  const startCompass = useCallback(() => {
    if (!window.DeviceOrientationEvent) {
      setCompassPermission('denied');
      return;
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      let rawHeading: number | null = null;

      // iOS: webkitCompassHeading
      if ((event as any).webkitCompassHeading !== undefined) {
        rawHeading = (event as any).webkitCompassHeading;
      }
      // Android absolute orientation
      else if (event.absolute === true && event.alpha !== null) {
        rawHeading = event.alpha;
      }
      // Fallback
      else if (event.alpha !== null) {
        rawHeading = event.alpha;
      }

      if (rawHeading !== null) {
        const filtered = lowPassFilter(rawHeading, filterRef.current, 0.15);
        filterRef.current = filtered;
        setCompassHeading(Math.round(filtered * 10) / 10);
        setCompassEnabled(true);
        // Fix: cast event to any to access webkitCompassAccuracy
        if ((event as any).webkitCompassAccuracy) {
          setCompassAccuracy((event as any).webkitCompassAccuracy);
        }
      }
    };

    compassListenerRef.current = handleOrientation;
    window.addEventListener('deviceorientation', handleOrientation, true);
  }, []);

  const stopCompass = useCallback(() => {
    if (compassListenerRef.current) {
      window.removeEventListener('deviceorientation', compassListenerRef.current, true);
      compassListenerRef.current = null;
    }
  }, []);

  const enableCompass = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setCompassPermission('granted');
          startCompass();
        } else {
          setCompassPermission('denied');
        }
      } catch {
        setCompassPermission('denied');
      }
    } else {
      setCompassPermission('granted');
      startCompass();
    }
  };

  useEffect(() => {
    return () => stopCompass();
  }, [stopCompass]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || 'Your Location';
          const country = data.address?.country || '';
          const countryCode = data.address?.country_code || '';
          await updateLocation(latitude, longitude, city, country, countryCode);
        } catch {
          await updateLocation(latitude, longitude, 'Your Location', '', '');
        }
      },
      (err) => {
        setError(err.code === 1 ? 'Location access denied.' : 'Unable to get location.');
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const searchCityHandler = async () => {
    if (!searchCity.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchCity)}&format=json&limit=1&accept-language=en`
      );
      const data = await res.json();
      if (!data.length) {
        setError('City not found');
        setLoading(false);
        return;
      }
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      const cityName = data[0].display_name.split(',')[0];
      const revRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
      );
      const revData = await revRes.json();
      const country = revData.address?.country || '';
      const countryCode = revData.address?.country_code || '';
      await updateLocation(lat, lng, cityName, country, countryCode);
    } catch {
      setError('Error searching for city');
      setLoading(false);
    }
  };

  const resetLocation = () => {
    setLocation(null);
    setQiblaDirection(null);
    setDistance(null);
    setSearchCity('');
    setError('');
    setCompassEnabled(false);
    setCompassPermission('prompt');
    setIsFacingQibla(false);
    setAlignmentAccuracy(180);
    setCompassAccuracy(null);
    stopCompass();
  };

  const arrowRotation = qiblaDirection !== null && compassEnabled
    ? (qiblaDirection - compassHeading + 360) % 360
    : qiblaDirection || 0;

  const testCities = [
    { name: 'New York', lat: 40.7128, lng: -74.0060, expected: '58° NE' },
    { name: 'London', lat: 51.5074, lng: -0.1278, expected: '118° ESE' },
    { name: 'Istanbul', lat: 41.0082, lng: 28.9784, expected: '153° SSE' },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093, expected: '295° WNW' },
    { name: 'Delhi', lat: 28.6139, lng: 77.2090, expected: '270° W' },
    { name: 'Tokyo', lat: 35.6895, lng: 139.6917, expected: '293° WNW' },
    { name: 'Makkah', lat: 21.4225, lng: 39.8262, expected: '0° N' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
      <header className="bg-black/20 backdrop-blur-sm px-4 py-4 flex items-center gap-4 border-b border-emerald-700/50 sticky top-0 z-10">
        <Link href="/" className="text-white/70 hover:text-white text-sm flex items-center gap-1">
          <span>←</span> Back
        </Link>
        <h1 className="text-white font-semibold text-lg flex-1 text-center">🕋 Qibla Compass</h1>
        <div className="w-12"></div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {!qiblaDirection && (
          <div className="space-y-4">
            <div className="bg-white/10 rounded-2xl p-6 text-center border border-white/20">
              <div className="text-6xl mb-4">🧭</div>
              <h2 className="text-white text-xl font-semibold mb-2">Qibla Compass</h2>
              <p className="text-white/60 text-sm">Find the direction of the Holy Kaaba</p>
            </div>
            <button onClick={getCurrentLocation} disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 shadow-lg">
              📍 Use My Location
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-emerald-900 text-white/60">OR SEARCH</span>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCityHandler()}
                placeholder="Enter city name..."
                className="flex-1 bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 placeholder-white/40 focus:outline-none focus:border-emerald-500"
              />
              <button onClick={searchCityHandler} disabled={loading || !searchCity.trim()} className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 font-semibold">Go</button>
            </div>
            <div className="pt-2">
              <p className="text-white/40 text-xs text-center mb-2">Quick Test:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {testCities.map((city) => (
                  <button key={city.name} onClick={() => updateLocation(city.lat, city.lng, city.name, '', '')} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1.5 text-white/70 text-xs">
                    {city.name}
                  </button>
                ))}
              </div>
            </div>
            {loading && (
              <div className="flex items-center justify-center gap-3 py-8">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white/60">Loading...</p>
              </div>
            )}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}
          </div>
        )}

        {qiblaDirection !== null && location && (
          <div className="space-y-5">
            <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/20">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl">{location.flag || '📍'}</span>
                <span className="text-white font-semibold text-lg">{location.name}</span>
                {location.country && <span className="text-white/50 text-sm">• {location.country}</span>}
              </div>
              <p className="text-white/40 text-xs">
                {Math.abs(location.lat).toFixed(2)}°{location.lat >= 0 ? 'N' : 'S'}, {Math.abs(location.lng).toFixed(2)}°{location.lng >= 0 ? 'E' : 'W'}
              </p>
            </div>

            {/* Main Compass */}
            <div className="relative w-80 h-80 mx-auto">
              <div className="absolute inset-0 rounded-full bg-emerald-800/40 border-4 border-white/30 shadow-2xl backdrop-blur-sm">
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="text-red-400 font-bold text-sm">N</div>
                  <div className="w-px h-8 bg-red-400/50 mx-auto"></div>
                </div>
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="w-px h-8 bg-white/30 mx-auto"></div>
                  <div className="text-white/40 font-bold text-sm">S</div>
                </div>
                <div className="absolute right-1 top-1/2 transform -translate-y-1/2 z-10">
                  <div className="text-white/40 font-bold text-sm">E</div>
                  <div className="w-8 h-px bg-white/30 mx-auto"></div>
                </div>
                <div className="absolute left-1 top-1/2 transform -translate-y-1/2 z-10">
                  <div className="text-white/40 font-bold text-sm">W</div>
                  <div className="w-8 h-px bg-white/30 mx-auto"></div>
                </div>
                {[...Array(36)].map((_, i) => {
                  const rotation = i * 10;
                  const isMajor = i % 3 === 0;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 left-1/2"
                      style={{
                        width: '1px',
                        height: isMajor ? '12px' : '6px',
                        background: isMajor ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                        transform: `rotate(${rotation}deg) translateX(-50%)`,
                        transformOrigin: '0 160px',
                      }}
                    />
                  );
                })}
              </div>

              {/* Qibla Arrow */}
              <div
                className="absolute inset-0 transition-transform duration-200 ease-out z-20"
                style={{ transform: `rotate(${arrowRotation}deg)` }}
              >
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-b-[70px] border-l-transparent border-r-transparent border-b-emerald-500 drop-shadow-lg" />
                  <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 text-2xl filter drop-shadow-lg">🕋</div>
                </div>
              </div>

              {/* Center Bubble */}
              <div className="absolute inset-0 flex items-center justify-center z-30">
                <div className={`rounded-full transition-all duration-300 flex items-center justify-center ${
                  isFacingQibla && compassEnabled 
                    ? 'bg-emerald-500/40 w-16 h-16 shadow-lg shadow-emerald-500/50' 
                    : 'bg-white/20 w-12 h-12'}`}
                >
                  <div className={`rounded-full transition-all duration-300 ${
                    isFacingQibla && compassEnabled 
                      ? 'w-4 h-4 bg-emerald-300 animate-pulse' 
                      : 'w-3 h-3 bg-white'}`}
                  />
                </div>
                <div className="absolute w-10 h-px bg-white/40"></div>
                <div className="absolute w-px h-10 bg-white/40"></div>
                <div className="absolute w-8 h-px bg-white/20 transform rotate-45"></div>
                <div className="absolute w-8 h-px bg-white/20 transform -rotate-45"></div>
              </div>
            </div>

            {isFacingQibla && compassEnabled && (
              <div className="bg-emerald-500/40 border-2 border-emerald-400 rounded-xl p-3 text-center animate-pulse">
                <p className="text-emerald-300 font-bold text-lg">✓ You are facing the Qibla! ✓</p>
                <p className="text-emerald-200/70 text-xs mt-1">Perfect alignment!</p>
              </div>
            )}

            {compassEnabled && !isFacingQibla && (
              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>← Far</span>
                  <span>Alignment</span>
                  <span>Perfect →</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, 100 - (alignmentAccuracy / 1.8))}%` }}
                  />
                </div>
                <p className="text-white/40 text-center text-xs mt-2">
                  {alignmentAccuracy <= 10 
                    ? "🎯 Getting close! Keep turning..." 
                    : alignmentAccuracy <= 30
                    ? "🔄 You're in the right area..."
                    : "📱 Turn your phone towards the arrow"}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-white/50 text-xs mb-1">Qibla Direction</p>
                <p className="text-white text-2xl font-bold">{qiblaDirection}°</p>
                <p className="text-emerald-300 text-sm font-semibold">{getCardinalDirection(qiblaDirection)}</p>
                <p className="text-white/40 text-xs mt-1">{getDirectionEmoji(qiblaDirection)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-white/50 text-xs mb-1">Distance to Kaaba</p>
                <p className="text-white text-2xl font-bold">{distance?.toLocaleString()}</p>
                <p className="text-white/60 text-sm">kilometers</p>
                <p className="text-white/40 text-xs mt-1">{Math.round(distance! * 0.621371).toLocaleString()} miles</p>
              </div>
            </div>

            {compassPermission === 'prompt' && (
              <button onClick={enableCompass} className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 rounded-xl py-3 font-semibold flex items-center justify-center gap-2">
                <span>🧭</span> Enable Live Compass
              </button>
            )}
            {compassPermission === 'granted' && compassEnabled && (
              <div className="flex items-center justify-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl py-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-emerald-300 text-sm font-medium">
                  Compass Active • {Math.round(compassHeading)}° {getDirectionEmoji(compassHeading)}
                </p>
              </div>
            )}
            {compassPermission === 'denied' && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 text-center">
                <p className="text-yellow-300 text-sm">🔒 Compass permission denied. Use the fixed direction above with any compass app.</p>
              </div>
            )}

            <button onClick={resetLocation} className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 font-semibold">
              Change Location
            </button>
          </div>
        )}
      </main>
    </div>
  );
}