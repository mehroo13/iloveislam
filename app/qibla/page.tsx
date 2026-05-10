'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ── Kaaba coordinates (verified) ──
const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

// ── Calculate Qibla bearing from user to Kaaba ──
// Uses the standard Great Circle bearing formula
function calculateQibla(userLat: number, userLng: number): number {
  const φ1 = (userLat * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const Δλ = ((KAABA_LNG - userLng) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  // Convert to degrees and normalise to 0–360
  return ((θ * 180) / Math.PI + 360) % 360;
}

// ── Haversine distance to Kaaba in km ──
function calculateDistance(lat: number, lng: number): number {
  const R = 6371;
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const Δφ = ((KAABA_LAT - lat) * Math.PI) / 180;
  const Δλ = ((KAABA_LNG - lng) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function cardinalName(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function getFlagEmoji(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('');
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
  const [qibla, setQibla] = useState<number | null>(null);   // true bearing to Kaaba
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cityInput, setCityInput] = useState('');

  // Compass
  const [compassHeading, setCompassHeading] = useState<number | null>(null); // device heading (deg from true North)
  const [compassState, setCompassState] = useState<'idle' | 'active' | 'denied' | 'unsupported'>('idle');
  const cleanupRef = useRef<(() => void) | null>(null);

  // ── Compass needle rotation ──
  // When compass is active: rotate needle so it points to Qibla relative to where phone is pointing
  // When compass is not active: just show fixed Qibla arrow (no device rotation)
  const needleRotation =
    qibla !== null && compassHeading !== null
      ? (qibla - compassHeading + 360) % 360
      : qibla ?? 0;

  // ── Start compass ──
  const startCompass = useCallback(() => {
    if (typeof window === 'undefined') return;

    let lastHeading = 0;

    const handler = (e: DeviceOrientationEvent) => {
      let heading: number | null = null;

      // iOS: webkitCompassHeading is already true-north heading (0–360)
      const ios = (e as any).webkitCompassHeading;
      if (typeof ios === 'number' && ios >= 0) {
        heading = ios;
      }
      // Android / other: alpha is rotation around Z axis
      // alpha=0 means device top points East (not North), so convert:
      // True heading = (360 - alpha) % 360
      else if (typeof e.alpha === 'number') {
        heading = (360 - e.alpha) % 360;
      }

      if (heading === null) return;

      // Smooth: only update if moved more than 1 degree
      if (Math.abs(heading - lastHeading) > 1 || Math.abs(heading - lastHeading) > 180) {
        lastHeading = heading;
        setCompassHeading(heading);
      }
    };

    window.addEventListener('deviceorientation', handler, true);
    setCompassState('active');

    cleanupRef.current = () => {
      window.removeEventListener('deviceorientation', handler, true);
    };
  }, []);

  // ── Request permission (iOS 13+) then start ──
  const enableCompass = async () => {
    if (typeof window === 'undefined') return;

    const DOE = window.DeviceOrientationEvent as any;

    if (typeof DOE?.requestPermission === 'function') {
      try {
        const result = await DOE.requestPermission();
        if (result === 'granted') {
          startCompass();
        } else {
          setCompassState('denied');
        }
      } catch {
        setCompassState('denied');
      }
    } else if ('DeviceOrientationEvent' in window) {
      // Android / desktop — no permission required
      startCompass();
    } else {
      setCompassState('unsupported');
    }
  };

  const disableCompass = () => {
    cleanupRef.current?.();
    setCompassHeading(null);
    setCompassState('idle');
  };

  useEffect(() => () => cleanupRef.current?.(), []);

  // ── Set location & compute Qibla ──
  const applyLocation = useCallback(
    (lat: number, lng: number, name: string, country: string, flag: string) => {
      setLocation({ lat, lng, name, country, flag });
      setQibla(Math.round(calculateQibla(lat, lng) * 10) / 10);
      setDistance(calculateDistance(lat, lng));
      setLoading(false);
    },
    []
  );

  // ── GPS ──
  const useGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            'Your Location';
          const country = data.address?.country || '';
          const code = data.address?.country_code?.toUpperCase() || '';
          applyLocation(latitude, longitude, city, country, code ? getFlagEmoji(code) : '📍');
        } catch {
          applyLocation(latitude, longitude, 'Your Location', '', '📍');
        }
      },
      (err) => {
        setLoading(false);
        if (err.code === 1)
          setError('Location access denied. Please enable location services and try again.');
        else
          setError('Unable to get your location. Please search for your city instead.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // ── City search ──
  const searchCity = async () => {
    if (!cityInput.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityInput)}&format=json&limit=1&accept-language=en`
      );
      const data = await res.json();
      if (!data?.length) {
        setError('City not found. Please try a different spelling.');
        setLoading(false);
        return;
      }
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      const name = data[0].display_name.split(',')[0];

      const rev = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
      );
      const revData = await rev.json();
      const country = revData.address?.country || '';
      const code = revData.address?.country_code?.toUpperCase() || '';
      applyLocation(lat, lng, name, country, code ? getFlagEmoji(code) : '📍');
    } catch {
      setError('Search failed. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const reset = () => {
    setLocation(null);
    setQibla(null);
    setDistance(null);
    setCityInput('');
    setError('');
    disableCompass();
  };

  // ── Compass ring tick marks ──
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #0d5238 60%, #0a3d2e 100%)' }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-4 border-b border-white/10">
        <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">← Back</Link>
        <h1 className="text-white font-medium flex-1 text-center">🕋 Qibla Finder</h1>
        <div className="w-16" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">

        {/* ── INPUT STATE ── */}
        {qibla === null && (
          <div className="space-y-4">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
              <div className="text-5xl mb-3">🕋</div>
              <h2 className="text-white text-lg font-semibold mb-1">Find Qibla Direction</h2>
              <p className="text-white/50 text-sm">
                Find the direction of the Holy Kaaba in Makkah from your location.
              </p>
            </div>

            <button
              onClick={useGPS}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: '#1a7a4a' }}>
              📍 Use My Current Location
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/40 text-xs">OR</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCity()}
                placeholder="Enter your city name..."
                className="flex-1 bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm placeholder-white/30 outline-none focus:border-white/50 transition-all"
              />
              <button
                onClick={searchCity}
                disabled={loading || !cityInput.trim()}
                className="px-5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-40">
                Search
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-3 py-6">
                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                <p className="text-white/50 text-sm">Finding location...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ── RESULT STATE ── */}
        {qibla !== null && location && (
          <div className="space-y-4">

            {/* Location card */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-0.5">
                <span className="text-xl">{location.flag}</span>
                <span className="text-white font-medium">{location.name}</span>
                {location.country && (
                  <span className="text-white/50 text-sm">· {location.country}</span>
                )}
              </div>
              <p className="text-white/30 text-xs">
                {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°
              </p>
            </div>

            {/* ── COMPASS ── */}
            <div className="flex flex-col items-center">
              <div className="relative w-72 h-72">

                {/* Outer ring with tick marks */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 288 288">
                  {/* Outer circle */}
                  <circle cx="144" cy="144" r="138" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                  {/* Tick marks */}
                  {ticks.map((deg) => {
                    const major = deg % 45 === 0;
                    const medium = deg % 15 === 0;
                    const rad = (deg - 90) * (Math.PI / 180);
                    const outerR = 136;
                    const innerR = major ? 122 : medium ? 126 : 129;
                    const x1 = 144 + outerR * Math.cos(rad);
                    const y1 = 144 + outerR * Math.sin(rad);
                    const x2 = 144 + innerR * Math.cos(rad);
                    const y2 = 144 + innerR * Math.sin(rad);
                    return (
                      <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={major ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)'}
                        strokeWidth={major ? 2 : 1} />
                    );
                  })}
                  {/* Cardinal labels */}
                  {[
                    { label: 'N', deg: 0, color: '#f87171' },
                    { label: 'E', deg: 90, color: 'rgba(255,255,255,0.6)' },
                    { label: 'S', deg: 180, color: 'rgba(255,255,255,0.6)' },
                    { label: 'W', deg: 270, color: 'rgba(255,255,255,0.6)' },
                  ].map(({ label, deg, color }) => {
                    const rad = (deg - 90) * (Math.PI / 180);
                    const r = 112;
                    const x = 144 + r * Math.cos(rad);
                    const y = 144 + r * Math.sin(rad);
                    return (
                      <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="central"
                        fontSize="13" fontWeight="bold" fill={color}>{label}</text>
                    );
                  })}
                  {/* Inner circle background */}
                  <circle cx="144" cy="144" r="100" fill="rgba(0,0,0,0.25)" />
                </svg>

                {/* Device rotation layer — rotates opposite to compass heading */}
                {compassHeading !== null && (
                  <div
                    className="absolute inset-0 transition-transform duration-150 ease-linear"
                    style={{ transform: `rotate(${-compassHeading}deg)` }}>
                    {/* This counter-rotates the ring so N always faces physical North */}
                  </div>
                )}

                {/* Qibla needle — rotates to point to Kaaba */}
                <div
                  className="absolute inset-0 transition-transform duration-300 ease-out"
                  style={{ transform: `rotate(${needleRotation}deg)` }}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {/* Kaaba icon at tip */}
                    <div style={{ marginBottom: '0px' }}>
                      <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 6px rgba(200,169,110,0.8))' }}>🕋</span>
                    </div>
                    {/* Arrow shaft */}
                    <div style={{ width: '3px', height: '52px', background: 'linear-gradient(to bottom, #c8a96e, #a07840)', borderRadius: '2px' }} />
                    {/* Arrow tail */}
                    <div style={{
                      width: 0, height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderTop: '16px solid rgba(255,255,255,0.3)',
                    }} />
                  </div>
                </div>

                {/* Center dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white shadow-lg z-10" style={{ boxShadow: '0 0 10px rgba(200,169,110,0.6)' }} />
                </div>

              </div>

              {/* Live compass heading display */}
              {compassHeading !== null && (
                <p className="text-white/40 text-xs mt-2">
                  Device heading: {Math.round(compassHeading)}° · Qibla: {qibla}°
                </p>
              )}
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center">
                <p className="text-white/40 text-xs mb-1">Qibla Direction</p>
                <p className="text-white text-3xl font-bold">{qibla}°</p>
                <p className="text-xs mt-1" style={{ color: '#c8a96e' }}>{cardinalName(qibla)}</p>
                <p className="text-white/30 text-xs mt-0.5">from True North</p>
              </div>
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center">
                <p className="text-white/40 text-xs mb-1">Distance to Kaaba</p>
                <p className="text-white text-3xl font-bold">{distance?.toLocaleString()}</p>
                <p className="text-white/50 text-xs mt-1">kilometers</p>
                <p className="text-white/30 text-xs mt-0.5">≈ {Math.round((distance ?? 0) * 0.621371).toLocaleString()} miles</p>
              </div>
            </div>

            {/* Compass enable/status */}
            {compassState === 'idle' && (
              <button
                onClick={enableCompass}
                className="w-full py-3 rounded-xl border border-white/20 text-white/70 text-sm font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                🧭 Enable Live Compass (for real-time tracking)
              </button>
            )}

            {compassState === 'active' && (
              <div className="flex items-center justify-between bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-emerald-300 text-sm font-medium">Live Compass Active</p>
                </div>
                <button onClick={disableCompass} className="text-white/30 hover:text-white/60 text-xs transition-colors">Disable</button>
              </div>
            )}

            {compassState === 'denied' && (
              <div className="bg-yellow-500/15 border border-yellow-400/30 rounded-xl p-3 text-center">
                <p className="text-yellow-300 text-sm">Compass permission denied. Use the degree value above with a physical compass.</p>
              </div>
            )}

            {compassState === 'unsupported' && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-white/40 text-sm">Live compass not available on this device. Use the degree value above.</p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/50 text-xs text-center leading-relaxed">
                {compassState === 'active'
                  ? '🔄 Turn your phone slowly until the 🕋 arrow points upward. That is your Qibla direction.'
                  : `📐 Face ${qibla}° (${cardinalName(qibla)}) from True North. You can use a compass app or physical compass and rotate until you reach ${qibla}°.`}
              </p>
            </div>

            {/* Verification note */}
            <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-3 text-center">
              <p className="text-amber-300/70 text-xs leading-relaxed">
                ✓ Calculated using verified Great Circle bearing formula.<br />
                Kaaba coordinates: 21.4225°N, 39.8262°E (internationally verified).
              </p>
            </div>

            <button
              onClick={reset}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all">
              ← Change Location
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
