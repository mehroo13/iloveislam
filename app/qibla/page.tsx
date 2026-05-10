'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';

const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

function calcQibla(lat: number, lng: number): number {
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const Δλ = ((KAABA_LNG - lng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function calcDistance(lat: number, lng: number): number {
  const R = 6371;
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const Δφ = ((KAABA_LAT - lat) * Math.PI) / 180;
  const Δλ = ((KAABA_LNG - lng) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function cardinal(deg: number) {
  const d = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return d[Math.round(deg / 22.5) % 16];
}

function flagEmoji(code: string) {
  return code.toUpperCase().split('').map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');
}

interface Loc { lat: number; lng: number; name: string; country: string; flag: string; }

// ── VERIFIED COMPASS MATH ──────────────────────────────────────────────────
//
// Two independently rotating SVG groups (siblings, NOT parent/child):
//
// 1. RING (N/E/S/W labels):
//    - Must stay fixed to Earth as user rotates phone
//    - If user rotates phone clockwise by X°, ring must appear to rotate counter-clockwise X°
//    - Ring CSS rotation = -deviceHeading
//    - E is at 90° (RIGHT), W is at 270° (LEFT) — standard map/compass orientation
//
// 2. NEEDLE (Qibla arrow):
//    - Must always point toward Mecca in screen space
//    - When user faces Qibla direction, needle should point STRAIGHT UP (0° from top)
//    - Formula: needleRotation = qibla - deviceHeading
//    - Proof: if deviceHeading = qibla, then needleRotation = 0 = straight up ✅
//    - Static mode (no compass): deviceHeading = 0, so needleRotation = qibla ✅
//
// SVG coordinate note:
//   SVG 0° = 3 o'clock (right). To make 0° = 12 o'clock (top/North):
//   use (angleDeg - 90) when converting to radians for x/y positioning.
//
// Verified against:
//   London (51.5°N, -0.1°W)  → Qibla 119° SE  ✅
//   New York (40.7°N, -74°W) → Qibla 59°  NE  ✅
//   Karachi (24.9°N, 67°E)   → Qibla 268° W   ✅
//   Jakarta (-6.2°N, 107°E)  → Qibla 295° NW  ✅
//   Sydney (-33.9°N, 151°E)  → Qibla 278° W   ✅
// ──────────────────────────────────────────────────────────────────────────

export default function QiblaFinder() {
  const [loc, setLoc] = useState<Loc | null>(null);
  const [qibla, setQibla] = useState<number | null>(null);
  const [dist, setDist] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [compassState, setCompassState] = useState<'idle'|'active'|'denied'|'unsupported'>('idle');
  const cleanupRef = useRef<(()=>void)|null>(null);
  const rafRef = useRef<number|null>(null);

  const CX = 150, CY = 150;

  // Ring stays fixed to Earth: rotate counter-clockwise as user rotates clockwise
  const ringRotation = deviceHeading !== null ? -deviceHeading : 0;

  // Needle points to Qibla: subtract deviceHeading so needle is relative to screen top
  // When deviceHeading = qibla → needleRotation = 0 = straight up = facing Qibla ✅
  const needleRotation = ((qibla ?? 0) - (deviceHeading ?? 0) + 360) % 360;

  const startCompass = useCallback(() => {
    const handler = (e: DeviceOrientationEvent) => {
      let h: number | null = null;
      // iOS: webkitCompassHeading is clockwise degrees from True North — use directly
      const ios = (e as any).webkitCompassHeading;
      if (typeof ios === 'number' && ios >= 0 && ios <= 360) {
        h = ios;
      }
      // Android: alpha is counter-clockwise from East → convert to clockwise from North
      else if (typeof e.alpha === 'number') {
        h = (360 - e.alpha) % 360;
      }
      if (h === null) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setDeviceHeading(Math.round(h! * 10) / 10);
      });
    };
    window.addEventListener('deviceorientation', handler, true);
    setCompassState('active');
    cleanupRef.current = () => {
      window.removeEventListener('deviceorientation', handler, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const enableCompass = async () => {
    const DOE = (window as any).DeviceOrientationEvent;
    if (typeof DOE?.requestPermission === 'function') {
      try {
        const r = await DOE.requestPermission();
        if (r === 'granted') startCompass(); else setCompassState('denied');
      } catch { setCompassState('denied'); }
    } else if ('DeviceOrientationEvent' in window) {
      startCompass();
    } else {
      setCompassState('unsupported');
    }
  };

  const disableCompass = () => {
    cleanupRef.current?.();
    setDeviceHeading(null);
    setCompassState('idle');
  };

  useEffect(() => () => { cleanupRef.current?.(); }, []);

  const applyLoc = useCallback((lat: number, lng: number, name: string, country: string, f: string) => {
    setLoc({ lat, lng, name, country, flag: f });
    setQibla(Math.round(calcQibla(lat, lng) * 10) / 10);
    setDist(calcDistance(lat, lng));
    setLoading(false);
  }, []);

  const useGPS = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported.'); return; }
    setLoading(true); setError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`);
          const d = await r.json();
          const city = d.address?.city || d.address?.town || d.address?.village || 'Your Location';
          const country = d.address?.country || '';
          const code = d.address?.country_code?.toUpperCase() || '';
          applyLoc(latitude, longitude, city, country, code ? flagEmoji(code) : '📍');
        } catch { applyLoc(latitude, longitude, 'Your Location', '', '📍'); }
      },
      (e) => {
        setLoading(false);
        setError(e.code === 1 ? 'Location access denied. Please enable location services.' : 'Could not get location. Please search your city.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const searchCity = async () => {
    if (!cityInput.trim()) return;
    setLoading(true); setError('');
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityInput)}&format=json&limit=1&accept-language=en`);
      const d = await r.json();
      if (!d?.length) { setError('City not found. Try a different spelling.'); setLoading(false); return; }
      const lat = parseFloat(d[0].lat), lng = parseFloat(d[0].lon);
      const name = d[0].display_name.split(',')[0];
      const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`);
      const rd = await rev.json();
      const country = rd.address?.country || '';
      const code = rd.address?.country_code?.toUpperCase() || '';
      applyLoc(lat, lng, name, country, code ? flagEmoji(code) : '📍');
    } catch { setError('Search failed. Check connection and try again.'); setLoading(false); }
  };

  const reset = () => {
    setLoc(null); setQibla(null); setDist(null);
    setCityInput(''); setError(''); disableCompass();
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #0d5238 60%, #0a3d2e 100%)' }}>

      <header className="px-6 py-4 flex items-center gap-4 border-b border-white/10">
        <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">← Back</Link>
        <h1 className="text-white font-medium flex-1 text-center">🕋 Qibla Finder</h1>
        <div className="w-16" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">

        {/* INPUT */}
        {qibla === null && (
          <div className="space-y-4">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
              <div className="text-5xl mb-3">🕋</div>
              <h2 className="text-white text-lg font-semibold mb-1">Find Qibla Direction</h2>
              <p className="text-white/50 text-sm">Find the direction of the Holy Kaaba from anywhere in the world</p>
            </div>

            <button onClick={useGPS} disabled={loading}
              className="w-full py-4 rounded-2xl font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: '#1a7a4a' }}>
              📍 Use My Current Location
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/40 text-xs">OR</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            <div className="flex gap-2">
              <input type="text" value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchCity()}
                placeholder="Enter your city name..."
                className="flex-1 bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm placeholder-white/30 outline-none focus:border-white/50 transition-all" />
              <button onClick={searchCity} disabled={loading || !cityInput.trim()}
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

        {/* RESULT */}
        {qibla !== null && loc && (
          <div className="space-y-4">

            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">{loc.flag}</span>
                <span className="text-white font-medium">{loc.name}</span>
                {loc.country && <span className="text-white/50 text-sm">· {loc.country}</span>}
              </div>
              <p className="text-white/30 text-xs mt-0.5">{loc.lat.toFixed(4)}°, {loc.lng.toFixed(4)}°</p>
            </div>

            {/* COMPASS */}
            <div className="flex flex-col items-center">
              <div className="w-72 h-72 sm:w-80 sm:h-80">
                <svg viewBox="0 0 300 300" className="w-full h-full">

                  {/* RING — rotates -deviceHeading, stays fixed to Earth */}
                  <g style={{
                    transformOrigin: `${CX}px ${CY}px`,
                    transform: `rotate(${ringRotation}deg)`,
                    transition: deviceHeading !== null ? 'transform 0.1s linear' : 'none',
                  }}>
                    {/* Outer dark circle */}
                    <circle cx={CX} cy={CY} r="145" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

                    {/* Tick marks */}
                    {Array.from({ length: 72 }, (_, i) => {
                      const deg = i * 5;
                      const major = deg % 90 === 0;
                      const semi  = deg % 45 === 0 && !major;
                      const rad = (deg - 90) * Math.PI / 180;
                      const r1 = 143, r2 = major ? 126 : semi ? 131 : 137;
                      return (
                        <line key={deg}
                          x1={CX + r1 * Math.cos(rad)} y1={CY + r1 * Math.sin(rad)}
                          x2={CX + r2 * Math.cos(rad)} y2={CY + r2 * Math.sin(rad)}
                          stroke={major ? 'rgba(255,255,255,0.9)' : semi ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)'}
                          strokeWidth={major ? 2.5 : 1.2}
                        />
                      );
                    })}

                    {/* Degree numbers every 30° */}
                    {[30,60,120,150,210,240,300,330].map(deg => {
                      const rad = (deg - 90) * Math.PI / 180;
                      return (
                        <text key={deg}
                          x={CX + 108 * Math.cos(rad)} y={CY + 108 * Math.sin(rad)}
                          textAnchor="middle" dominantBaseline="central"
                          fontSize="7.5" fill="rgba(255,255,255,0.22)">
                          {deg}
                        </text>
                      );
                    })}

                    {/* Cardinal labels
                        N=0° (top), E=90° (right), S=180° (bottom), W=270° (left)
                        Standard map/compass orientation — verified correct */}
                    {[
                      { label: 'N',  deg: 0,   color: '#f87171', size: 17, bold: true  },
                      { label: 'NE', deg: 45,  color: 'rgba(255,255,255,0.38)', size: 9, bold: false },
                      { label: 'E',  deg: 90,  color: 'rgba(255,255,255,0.85)', size: 15, bold: true  },
                      { label: 'SE', deg: 135, color: 'rgba(255,255,255,0.38)', size: 9, bold: false },
                      { label: 'S',  deg: 180, color: 'rgba(255,255,255,0.85)', size: 15, bold: true  },
                      { label: 'SW', deg: 225, color: 'rgba(255,255,255,0.38)', size: 9, bold: false },
                      { label: 'W',  deg: 270, color: 'rgba(255,255,255,0.85)', size: 15, bold: true  },
                      { label: 'NW', deg: 315, color: 'rgba(255,255,255,0.38)', size: 9, bold: false },
                    ].map(({ label, deg, color, size, bold }) => {
                      const rad = (deg - 90) * Math.PI / 180;
                      const r = 120;
                      return (
                        <text key={label}
                          x={CX + r * Math.cos(rad)}
                          y={CY + r * Math.sin(rad)}
                          textAnchor="middle" dominantBaseline="central"
                          fontSize={size} fontWeight={bold ? 'bold' : 'normal'}
                          fill={color}>
                          {label}
                        </text>
                      );
                    })}

                    {/* Inner dark area */}
                    <circle cx={CX} cy={CY} r="98" fill="rgba(6,20,12,0.8)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  </g>

                  {/* NEEDLE — sibling of ring (NOT child), rotates independently
                      needleRotation = qibla - deviceHeading
                      → When deviceHeading = qibla: needleRotation = 0 = straight up = facing Qibla ✅
                      → When deviceHeading = 0 (static): needleRotation = qibla ✅ */}
                  <g style={{
                    transformOrigin: `${CX}px ${CY}px`,
                    transform: `rotate(${needleRotation}deg)`,
                    transition: deviceHeading !== null ? 'transform 0.1s linear' : 'transform 0.3s ease-out',
                  }}>
                    {/* Kaaba at tip */}
                    <text x={CX} y={CY - 83} textAnchor="middle" dominantBaseline="central" fontSize="22">🕋</text>
                    {/* Gold arrow body */}
                    <polygon points={`${CX},${CY - 68} ${CX - 8},${CY - 15} ${CX + 8},${CY - 15}`}
                      fill="#c8a96e" opacity="0.95" />
                    {/* Gold arrowhead overlap */}
                    <polygon points={`${CX},${CY - 75} ${CX - 5},${CY - 60} ${CX + 5},${CY - 60}`}
                      fill="#e8c882" />
                    {/* Tail */}
                    <polygon points={`${CX},${CY + 52} ${CX - 5},${CY + 10} ${CX + 5},${CY + 10}`}
                      fill="rgba(255,255,255,0.15)" />
                  </g>

                  {/* Centre dot */}
                  <circle cx={CX} cy={CY} r="8" fill="white"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(200,169,110,1))' }} />

                  {/* Qibla label */}
                  <text x={CX} y={CY + 24} textAnchor="middle" fontSize="10"
                    fill="rgba(200,169,110,0.85)" fontWeight="bold">
                    {qibla}° {cardinal(qibla)}
                  </text>

                </svg>
              </div>

              {/* Live debug */}
              {deviceHeading !== null && (
                <div className="mt-1 flex gap-5 text-xs text-white/30">
                  <span>📱 {Math.round(deviceHeading)}°</span>
                  <span>🕋 Qibla {qibla}°</span>
                  <span>Needle {Math.round(needleRotation)}°</span>
                </div>
              )}
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center">
                <p className="text-white/40 text-xs mb-1">Qibla Direction</p>
                <p className="text-white text-3xl font-bold">{qibla}°</p>
                <p className="text-xs mt-1" style={{ color: '#c8a96e' }}>{cardinal(qibla)}</p>
                <p className="text-white/30 text-xs mt-0.5">from True North</p>
              </div>
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center">
                <p className="text-white/40 text-xs mb-1">Distance to Kaaba</p>
                <p className="text-white text-3xl font-bold">{dist?.toLocaleString()}</p>
                <p className="text-white/50 text-xs mt-1">kilometers</p>
                <p className="text-white/30 text-xs mt-0.5">≈ {Math.round((dist ?? 0) * 0.621371).toLocaleString()} miles</p>
              </div>
            </div>

            {/* Compass button */}
            {compassState === 'idle' && (
              <button onClick={enableCompass}
                className="w-full py-3 rounded-xl border border-white/20 text-white/70 text-sm font-medium hover:bg-white/10 transition-all">
                🧭 Enable Live Compass
              </button>
            )}
            {compassState === 'active' && (
              <div className="flex items-center justify-between bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-emerald-300 text-sm font-medium">Live Compass Active</p>
                </div>
                <button onClick={disableCompass} className="text-white/30 hover:text-white/60 text-xs">Disable</button>
              </div>
            )}
            {compassState === 'denied' && (
              <div className="bg-yellow-500/15 border border-yellow-400/30 rounded-xl p-3 text-center">
                <p className="text-yellow-300 text-sm">Compass permission denied. Face {qibla}° ({cardinal(qibla)}) from True North.</p>
              </div>
            )}
            {compassState === 'unsupported' && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-white/40 text-sm">Live compass not supported. Face {qibla}° ({cardinal(qibla)}) from True North.</p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/50 text-xs text-center leading-relaxed">
                {compassState === 'active'
                  ? '🔄 Slowly rotate your phone. When the 🕋 golden arrow points straight up — you are facing the Qibla.'
                  : `📐 Face ${qibla}° (${cardinal(qibla)}) from True North to face Qibla. Enable live compass for real-time guidance.`}
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-3">
              <p className="text-amber-300/60 text-xs text-center">
                ✓ Verified Great Circle formula · Kaaba 21.4225°N 39.8262°E
              </p>
            </div>

            <button onClick={reset}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all">
              ← Change Location
            </button>
          </div>
        )}
      </main>
    </div>
  );
}