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

      if ((event as any).webkitCompassHeading !== undefined) {
        rawHeading = (event as any).webkitCompassHeading;
      } else if (event.absolute === true && event.alpha !== null) {
        rawHeading = event.alpha;
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
        const filtered = lowPassFilter(event.alpha, filterRef.current, 0.15);
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
            {/* Location card */}
            <div className="bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl">{location.flag || '📍'}</span>
                <span className="text-white font-semibold">{location.name}</span>
                {location.country && <span className="text-white/50 text-sm">• {location.country}</span>}
              </div>
              <p className="text-white/40 text-xs text-center">
                {location.lat.toFixed(4)}°{location.lat >= 0 ? 'N' : 'S'}, {location.lng.toFixed(4)}°{location.lng >= 0 ? 'E' : 'W'}
              </p>
            </div>

            {/* Compass card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 flex flex-col items-center">
              <div className="relative w-72 h-72 sm:w-80 sm:h-80">
                {/* Compass rose */}
                <div className="absolute inset-0 rounded-full bg-emerald-900/50 border-4 border-white/20 shadow-inner">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 text-red-400 text-xs font-bold">N</div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/40 text-xs font-bold">S</div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 text-xs font-bold">E</div>
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 text-xs font-bold">W</div>

                  {[...Array(36)].map((_, i) => {
                    const rotation = i * 10;
                    const isMajor = i % 3 === 0;
                    return (
                      <div
                        key={i}
                        className="absolute top-0 left-1/2"
                        style={{
                          width: '1px',
                          height: isMajor ? '10px' : '5px',
                          background: isMajor ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
                          transform: `rotate(${rotation}deg) translateX(-50%)`,
                          transformOrigin: `0 ${isMajor ? '144px' : '145px'}`,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Qibla arrow */}
                <div
                  className="absolute inset-0 transition-transform duration-300 ease-out"
                  style={{ transform: `rotate(${arrowRotation}deg)` }}
                >
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-b-[60px] border-l-transparent border-r-transparent border-b-emerald-400 drop-shadow-lg" />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl">🕋</div>
                  </div>
                </div>

                {/* Center indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`rounded-full transition-all duration-300 flex items-center justify-center ${
                    isFacingQibla && compassEnabled
                      ? 'bg-emerald-500/40 w-16 h-16 shadow-lg shadow-emerald-500/30'
                      : 'bg-white/10 w-12 h-12'
                  }`}>
                    <div className={`rounded-full ${
                      isFacingQibla && compassEnabled ? 'w-4 h-4 bg-emerald-300 animate-pulse' : 'w-3 h-3 bg-white/80'
                    }`} />
                  </div>
                </div>
              </div>

              {compassEnabled && (
                <div className="w-full mt-4">
                  {isFacingQibla ? (
                    <div className="bg-emerald-500/30 border border-emerald-400/50 rounded-xl p-3 text-center animate-pulse">
                      <p className="text-emerald-200 font-bold">✅ Facing Qibla!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-white/50">
                        <span>Turn right</span>
                        <span>You are here</span>
                        <span>Turn left</span>
                      </div>
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(0, 100 - alignmentAccuracy / 1.8)}%` }}
                        />
                      </div>
                      <p className="text-white/40 text-xs text-center">
                        {alignmentAccuracy <= 10
                          ? 'Almost there! 🎯'
                          : alignmentAccuracy <= 30
                          ? 'Getting closer…'
                          : 'Rotate your phone slowly'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-2xl p-4 border border-white/20 text-center">
                <p className="text-white/50 text-xs mb-1">Qibla Direction</p>
                <p className="text-white text-2xl font-bold">{qiblaDirection.toFixed(1)}°</p>
                <p className="text-emerald-300 font-medium">{getCardinalDirection(qiblaDirection)} {getDirectionEmoji(qiblaDirection)}</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 border border-white/20 text-center">
                <p className="text-white/50 text-xs mb-1">Distance to Kaaba</p>
                <p className="text-white text-2xl font-bold">{distance?.toLocaleString()}</p>
                <p className="text-white/50 text-xs">km (~{(distance! * 0.621371).toFixed(0)} mi)</p>
              </div>
            </div>

            {compassPermission === 'prompt' && (
              <button
                onClick={enableCompass}
                className="w-full bg-blue-600/80 hover:bg-blue-500 text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2"
              >
                🧭 Enable Live Compass
              </button>
            )}
            {compassPermission === 'granted' && compassEnabled && (
              <div className="flex items-center justify-center gap-2 bg-emerald-600/20 border border-emerald-500/30 rounded-xl py-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-emerald-200 text-sm font-medium">
                  Live • {Math.round(compassHeading)}° {getDirectionEmoji(compassHeading)}
                </p>
              </div>
            )}
            {compassPermission === 'granted' && !compassEnabled && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 text-center">
                <p className="text-yellow-200 text-sm">Move your phone in a figure‑8 to calibrate.</p>
              </div>
            )}
            {compassPermission === 'denied' && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 text-center">
                <p className="text-yellow-200 text-sm">Compass permission denied. Use the static arrow with a real compass.</p>
              </div>
            )}

            <p className="text-white/30 text-xs text-center">
              For best accuracy: keep phone flat, away from magnets. If the live compass doesn't match, use the static bearing with any compass app.
            </p>

            <button
              onClick={resetLocation}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-2xl border border-white/10"
            >
              Change Location
            </button>
          </>
        )}
      </main>
    </div>
  );
}