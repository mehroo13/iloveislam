'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// ── Correct Qibla bearing (great‑circle) ──
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

function lowPassFilter(newValue: number, oldValue: number, smoothing = 0.15): number {
  const diff = newValue - oldValue;
  const adjustedDiff = ((diff + 540) % 360) - 180;
  return (oldValue + adjustedDiff * smoothing + 360) % 360;
}

const QIBLA_STORAGE_KEY = 'iloveislam_qibla_location';

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
    const locInfo = { lat, lng, name, country, flag: getFlagEmoji(countryCode) };
    setLocation(locInfo);
    const qibla = calculateQibla(lat, lng);
    const dist = calculateDistance(lat, lng);
    setQiblaDirection(qibla);
    setDistance(dist);
    setLoading(false);
    // Save to localStorage
    try { localStorage.setItem(QIBLA_STORAGE_KEY, JSON.stringify({ lat, lng, name, country, countryCode })); } catch {}
    // Auto-enable compass
    enableCompass();
  }, []);

  // Auto-load saved location or auto-detect on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(QIBLA_STORAGE_KEY);
      if (saved) {
        const { lat, lng, name, country, countryCode } = JSON.parse(saved);
        updateLocation(lat, lng, name, country, countryCode);
        return;
      }
    } catch {}
    // No saved location — auto-detect
    getCurrentLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCompass = useCallback(() => {
    if (!window.DeviceOrientationEvent) {
      setCompassPermission('denied');
      return;
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      let rawHeading: number | null = null;

      // iOS Safari — webkitCompassHeading gives degrees from magnetic north (clockwise)
      // This is the direction the TOP of the device is pointing
      if ((event as any).webkitCompassHeading !== undefined) {
        rawHeading = (event as any).webkitCompassHeading;
      } else if (event.alpha !== null) {
        // Standard non-absolute fallback
        // alpha = 0 when first initialized, not reliable for compass
        // Use (360 - alpha) as best guess
        rawHeading = (360 - event.alpha) % 360;
      }

      if (rawHeading !== null) {
        const filtered = lowPassFilter(rawHeading, filterRef.current, 0.15);
        filterRef.current = filtered;
        setCompassHeading(Math.round(filtered * 10) / 10);
        setCompassEnabled(true);
        if ((event as any).webkitCompassAccuracy) {
          setCompassAccuracy((event as any).webkitCompassAccuracy);
        }
      }
    };

    const absoluteHandler = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        // deviceorientationabsolute on Chrome Android:
        // alpha = 0 means device pointing north
        // alpha increases as device rotates counter-clockwise
        // So heading (clockwise from north) = (360 - alpha) % 360
        const heading = (360 - event.alpha) % 360;
        const filtered = lowPassFilter(heading, filterRef.current, 0.15);
        filterRef.current = filtered;
        setCompassHeading(Math.round(filtered * 10) / 10);
        setCompassEnabled(true);
      }
    };

    if ('ondeviceorientationabsolute' in window) {
      globalThis.addEventListener('deviceorientationabsolute', absoluteHandler, true);
      compassListenerRef.current = absoluteHandler;
    } else {
      globalThis.addEventListener('deviceorientation', handleOrientation, true);
      compassListenerRef.current = handleOrientation;
    }
  }, []);

  const stopCompass = useCallback(() => {
    if (compassListenerRef.current) {
      globalThis.removeEventListener('deviceorientation', compassListenerRef.current, true);
      globalThis.removeEventListener('deviceorientationabsolute', compassListenerRef.current as any, true);
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

  const arrowRotation = qiblaDirection || 0;
  // When compass is live: compass rose rotates to match real world, arrow stays at fixed Qibla bearing
  // When compass is off: everything is static, arrow points at Qibla bearing from top (North)
  const compassRoseRotation = compassEnabled ? -compassHeading : 0;

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
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 to-emerald-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-sm px-4 py-4 flex items-center gap-4 border-b border-white/10 sticky top-0 z-10">
        <Link href="/" className="text-white/70 hover:text-white text-sm flex items-center gap-1">
          <span>←</span> Back
        </Link>
        <h1 className="text-white font-semibold text-lg flex-1 text-center">🕋 Qibla Finder</h1>
        <div className="w-12" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Empty state / search */}
        {!qiblaDirection && (
          <>
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🧭</div>
              <h2 className="text-2xl font-bold mb-2">Find Qibla Direction</h2>
              <p className="text-white/60 text-sm">Use your location or search a city to get the exact bearing to Kaaba.</p>
            </div>

            <button
              onClick={getCurrentLocation}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
            >
              📍 Use My Location
            </button>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-white/20" />
              <span className="text-white/50 text-xs uppercase">or search</span>
              <div className="h-px flex-1 bg-white/20" />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCityHandler()}
                placeholder="City name..."
                className="flex-1 bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 placeholder-white/40 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={searchCityHandler}
                disabled={loading || !searchCity.trim()}
                className="bg-white/10 hover:bg-white/20 text-white px-5 rounded-xl font-semibold"
              >
                Go
              </button>
            </div>

            <div>
              <p className="text-white/40 text-xs text-center mb-2">Quick test cities</p>
              <div className="flex flex-wrap justify-center gap-2">
                {testCities.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => updateLocation(city.lat, city.lng, city.name, '', '')}
                    className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-white/70 text-xs hover:bg-white/10"
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="flex justify-center items-center gap-2 text-white/60 py-4">
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                Fetching location...
              </div>
            )}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-sm text-red-200 text-center">
                {error}
              </div>
            )}
          </>
        )}

        {/* Qibla result */}
        {qiblaDirection !== null && location && (
          <>
            {/* Location — compact */}
            <div className="flex items-center justify-center gap-2 text-white/70 text-sm">
              <span>{location.flag || '📍'}</span>
              <span className="font-medium text-white">{location.name}</span>
              {location.country && <span className="text-white/40">• {location.country}</span>}
            </div>

            {/* COMPASS — Hero element, takes most of the screen */}
            <div className="flex flex-col items-center">
              <div className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px]">
                {/* Outer glow ring */}
                <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
                  isFacingQibla && compassEnabled
                    ? 'shadow-[0_0_40px_rgba(16,185,129,0.4)] border-2 border-emerald-400/60'
                    : 'border-2 border-white/10'
                }`} />

                {/* Compass rose — rotates with device */}
                <div
                  className="absolute inset-2 rounded-full bg-gradient-to-b from-emerald-900/80 to-emerald-950/90 border border-white/10 shadow-inner transition-transform duration-150 ease-out"
                  style={{ transform: `rotate(${compassRoseRotation}deg)` }}
                >
                  {/* N/S/E/W labels */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 text-red-400 text-sm font-black">N</div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/50 text-sm font-bold">S</div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-sm font-bold">E</div>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm font-bold">W</div>

                  {/* Tick marks */}
                  {[...Array(72)].map((_, i) => {
                    const rotation = i * 5;
                    const isMajor = i % 6 === 0;
                    const isMid = i % 3 === 0 && !isMajor;
                    return (
                      <div
                        key={i}
                        className="absolute top-0 left-1/2"
                        style={{
                          width: isMajor ? '2px' : '1px',
                          height: isMajor ? '14px' : isMid ? '8px' : '4px',
                          background: isMajor ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
                          transform: `rotate(${rotation}deg) translateX(-50%)`,
                          transformOrigin: '0 148px',
                        }}
                      />
                    );
                  })}
                </div>

                {/* Qibla arrow — rotates with compass rose */}
                <div
                  className="absolute inset-2 transition-transform duration-150 ease-out"
                  style={{ transform: `rotate(${arrowRotation + compassRoseRotation}deg)` }}
                >
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    {/* Arrow with glow */}
                    <div className="relative">
                      <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[55px] border-l-transparent border-r-transparent border-b-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    </div>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xl">🕋</div>
                  </div>
                </div>

                {/* Center — shows degree */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
                    isFacingQibla && compassEnabled
                      ? 'bg-emerald-500/20 w-24 h-24 border border-emerald-400/40'
                      : 'bg-white/5 w-20 h-20 border border-white/10'
                  }`}>
                    <p className="text-white text-xl font-bold tabular-nums">{qiblaDirection.toFixed(0)}°</p>
                    <p className="text-emerald-300 text-[10px] font-semibold">{getCardinalDirection(qiblaDirection)}</p>
                  </div>
                </div>
              </div>

              {/* Facing Qibla feedback */}
              {compassEnabled && isFacingQibla && (
                <div className="w-full mt-4 max-w-xs">
                  <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-2xl p-4 text-center">
                    <p className="text-emerald-300 text-lg font-bold">✅ Facing Qibla!</p>
                    <p className="text-emerald-400/60 text-xs mt-1">You are aligned with the Kaaba</p>
                  </div>
                </div>
              )}
            </div>

            {/* Info row — compact */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Distance</p>
                <p className="text-white font-bold text-lg">{distance?.toLocaleString()} km</p>
                <p className="text-white/30 text-[10px]">{(distance! * 0.621371).toFixed(0)} miles</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Bearing</p>
                <p className="text-white font-bold text-lg">{qiblaDirection.toFixed(1)}°</p>
                <p className="text-emerald-400 text-[10px] font-semibold">{getCardinalDirection(qiblaDirection)} {getDirectionEmoji(qiblaDirection)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const text = `🕋 Qibla from ${location.name}: ${qiblaDirection.toFixed(1)}° ${getCardinalDirection(qiblaDirection)}\nDistance: ${distance?.toLocaleString()} km\n\niloveislam.life/qibla`;
                  if (navigator.share) { navigator.share({ title: 'Qibla Direction', text }); }
                  else { navigator.clipboard.writeText(text); }
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 font-medium py-2.5 rounded-xl border border-white/10 text-sm flex items-center justify-center gap-2"
              >
                📤 Share
              </button>
              <button
                onClick={resetLocation}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 font-medium py-2.5 rounded-xl border border-white/10 text-sm"
              >
                📍 Change Location
              </button>
            </div>

            {compassPermission === 'denied' && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                <p className="text-amber-200 text-xs">Compass not available. Use the bearing ({qiblaDirection.toFixed(1)}°) with any compass app.</p>
              </div>
            )}
            {compassPermission === 'granted' && !compassEnabled && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                <p className="text-amber-200 text-xs">Move your phone in a figure‑8 to calibrate the compass.</p>
              </div>
            )}

            <p className="text-white/20 text-[10px] text-center">
              Keep phone flat, away from magnets. The bearing ({qiblaDirection.toFixed(1)}° {getCardinalDirection(qiblaDirection)}) is always mathematically correct.
            </p>
          </>
        )}
      </main>
    </div>
  );
}