'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ── Verified Kaaba coordinates ──
const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

// ── Great Circle bearing: user → Kaaba (0–360°, clockwise from True North) ──
function calcQibla(lat: number, lng: number): number {
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const Δλ = ((KAABA_LNG - lng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// ── Haversine distance (km) ──
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

function flag(code: string) {
  return code.toUpperCase().split('').map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');
}

interface Loc { lat: number; lng: number; name: string; country: string; flag: string; }

// ── Compass geometry explanation ──
// The compass ring shows cardinal directions fixed to the REAL WORLD.
// When device heading = H degrees:
//   - The entire SVG (ring + labels) rotates by -H degrees
//     so N label always points toward geographic North
//   - The Qibla needle is drawn at angle (qibla - deviceHeading) inside the same SVG
//     so it always points toward Kaaba in the real world
//
// This is equivalent to: imagine looking at a real compass.
// The compass card (ring) counter-rotates with the phone.
// The needle always points to Qibla.
//
// East/West check:
//   Device points East (H=90): ring rotates -90°, so E label moves to top → correct
//   Device points West (H=270): ring rotates -270° = +90°, W label moves to top → correct

export default function QiblaFinder() {
  const [loc, setLoc] = useState<Loc | null>(null);
  const [qibla, setQibla] = useState<number | null>(null);
  const [dist, setDist] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cityInput, setCityInput] = useState('');

  // deviceHeading: degrees clockwise from True North that the device top is pointing
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [compassState, setCompassState] = useState<'idle' | 'active' | 'denied' | 'unsupported'>('idle');
  const cleanupRef = useRef<(() => void) | null>(null);
  const headingRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  // ── Compass: ring rotation = -deviceHeading (counter-rotate so N stays fixed) ──
  // ── Needle rotation inside SVG = qibla - deviceHeading ──
  const ringRotation = deviceHeading !== null ? -deviceHeading : 0;
  const needleAngle = qibla !== null && deviceHeading !== null
    ? (qibla - deviceHeading + 360) % 360  // needle points to Qibla in world space
    : qibla ?? 0;                            // no compass: just show fixed Qibla angle

  const startCompass = useCallback(() => {
    const handler = (e: DeviceOrientationEvent) => {
      let h: number | null = null;

      // iOS: webkitCompassHeading = degrees clockwise from True North. Correct as-is.
      const ios = (e as any).webkitCompassHeading;
      if (typeof ios === 'number' && ios >= 0 && ios <= 360) {
        h = ios;
      }
      // Android: alpha = degrees the device has rotated counter-clockwise from East.
      // True North heading = (360 - alpha) % 360
      else if (typeof e.alpha === 'number' && e.alpha !== null) {
        h = (360 - e.alpha) % 360;
      }

      if (h === null) return;

      // Smooth update via RAF — only if moved > 0.5°
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const diff = Math.abs(h! - headingRef.current);
        if (diff > 0.5 && diff < 350) {
          headingRef.current = h!;
          setDeviceHeading(Math.round(h! * 10) / 10);
        }
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
        if (r === 'granted') startCompass();
        else setCompassState('denied');
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
    const q = calcQibla(lat, lng);
    setQibla(Math.round(q * 10) / 10);
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
          applyLoc(latitude, longitude, city, country, code ? flag(code) : '📍');
        } catch { applyLoc(latitude, longitude, 'Your Location', '', '📍'); }
      },
      (e) => {
        setLoading(false);
        setError(e.code === 1
          ? 'Location access denied. Please enable location and try again.'
          : 'Could not get location. Search for your city instead.');
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
      applyLoc(lat, lng, name, country, code ? flag(code) : '📍');
    } catch { setError('Search failed. Check connection and try again.'); setLoading(false); }
  };

  const reset = () => {
    setLoc(null); setQibla(null); setDist(null);
    setCityInput(''); setError(''); disableCompass();
  };

  // ── SVG Compass component ──
  // The entire SVG rotates by ringRotation (= -deviceHeading).
  // The needle inside rotates by needleAngle.
  // This means: if device points North (heading=0), ring stays put, needle points to Qibla.
  //             if device points East  (heading=90), ring rotates -90° (E goes to top), needle tracks Qibla.
  const CX = 150, CY = 150, R_OUTER = 140, R_INNER = 105;

  const compassSVG = (
    <svg viewBox="0 0 300 300" className="w-full h-full">
      {/* Rotating group: whole compass ring rotates with device */}
      <g style={{
        transformOrigin: '150px 150px',
        transform: `rotate(${ringRotation}deg)`,
        transition: deviceHeading !== null ? 'transform 0.15s linear' : 'none',
      }}>
        {/* Outer ring */}
        <circle cx={CX} cy={CY} r={R_OUTER} fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

        {/* Tick marks — 72 ticks every 5° */}
        {Array.from({ length: 72 }, (_, i) => {
          const deg = i * 5;
          const major = deg % 90 === 0;
          const medium = deg % 45 === 0;
          const rad = (deg - 90) * Math.PI / 180;
          const r1 = R_OUTER - 2;
          const r2 = major ? R_OUTER - 16 : medium ? R_OUTER - 11 : R_OUTER - 7;
          return (
            <line key={deg}
              x1={CX + r1 * Math.cos(rad)} y1={CY + r1 * Math.sin(rad)}
              x2={CX + r2 * Math.cos(rad)} y2={CY + r2 * Math.sin(rad)}
              stroke={major ? 'rgba(255,255,255,0.9)' : medium ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'}
              strokeWidth={major ? 2.5 : 1.5}
            />
          );
        })}

        {/* Cardinal direction labels — these rotate WITH the ring */}
        {/* When device points East, E label rotates to top → correct */}
        {[
          { label: 'N', deg: 0, color: '#f87171', size: 16, weight: 'bold' },
          { label: 'NE', deg: 45, color: 'rgba(255,255,255,0.4)', size: 10, weight: 'normal' },
          { label: 'E', deg: 90, color: 'rgba(255,255,255,0.7)', size: 14, weight: 'bold' },
          { label: 'SE', deg: 135, color: 'rgba(255,255,255,0.4)', size: 10, weight: 'normal' },
          { label: 'S', deg: 180, color: 'rgba(255,255,255,0.7)', size: 14, weight: 'bold' },
          { label: 'SW', deg: 225, color: 'rgba(255,255,255,0.4)', size: 10, weight: 'normal' },
          { label: 'W', deg: 270, color: 'rgba(255,255,255,0.7)', size: 14, weight: 'bold' },
          { label: 'NW', deg: 315, color: 'rgba(255,255,255,0.4)', size: 10, weight: 'normal' },
        ].map(({ label, deg, color, size, weight }) => {
          const rad = (deg - 90) * Math.PI / 180;
          const r = R_OUTER - 26;
          return (
            <text key={label}
              x={CX + r * Math.cos(rad)} y={CY + r * Math.sin(rad)}
              textAnchor="middle" dominantBaseline="central"
              fontSize={size} fontWeight={weight} fill={color}>
              {label}
            </text>
          );
        })}

        {/* Inner circle */}
        <circle cx={CX} cy={CY} r={R_INNER} fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

        {/* Degree markers every 30° inside */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => {
          const rad = (deg - 90) * Math.PI / 180;
          const r = R_INNER - 16;
          return (
            <text key={deg}
              x={CX + r * Math.cos(rad)} y={CY + r * Math.sin(rad)}
              textAnchor="middle" dominantBaseline="central"
              fontSize="8" fill="rgba(255,255,255,0.25)">
              {deg}
            </text>
          );
        })}
      </g>

      {/* Qibla needle — separate rotation, NOT inside the ring group */}
      {/* needleAngle = qibla - deviceHeading, so it always points to Kaaba in real world */}
      <g style={{
        transformOrigin: '150px 150px',
        transform: `rotate(${needleAngle}deg)`,
        transition: 'transform 0.3s ease-out',
      }}>
        {/* Needle shaft pointing up (toward Kaaba) */}
        <line x1={CX} y1={CY} x2={CX} y2={CY - 80}
          stroke="#c8a96e" strokeWidth="3" strokeLinecap="round" />
        {/* Arrowhead */}
        <polygon
          points={`${CX},${CY - 90} ${CX - 8},${CY - 68} ${CX + 8},${CY - 68}`}
          fill="#c8a96e" />
        {/* Kaaba emoji at tip */}
        <text x={CX} y={CY - 98} textAnchor="middle" dominantBaseline="central" fontSize="18">🕋</text>
        {/* Tail */}
        <line x1={CX} y1={CY} x2={CX} y2={CY + 45}
          stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" />
        <circle cx={CX} cy={CY + 50} r={4} fill="rgba(255,255,255,0.2)" />
      </g>

      {/* Center dot */}
      <circle cx={CX} cy={CY} r={6} fill="white"
        style={{ filter: 'drop-shadow(0 0 4px rgba(200,169,110,0.8))' }} />
    </svg>
  );

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
              <p className="text-white/50 text-sm">Find the direction of the Holy Kaaba from anywhere in the world</p>
            </div>

            <button onClick={useGPS} disabled={loading}
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

        {/* ── RESULT STATE ── */}
        {qibla !== null && loc && (
          <div className="space-y-4">

            {/* Location */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">{loc.flag}</span>
                <span className="text-white font-medium">{loc.name}</span>
                {loc.country && <span className="text-white/50 text-sm">· {loc.country}</span>}
              </div>
              <p className="text-white/30 text-xs mt-0.5">{loc.lat.toFixed(4)}°, {loc.lng.toFixed(4)}°</p>
            </div>

            {/* Compass */}
            <div className="flex flex-col items-center">
              <div className="w-72 h-72 sm:w-80 sm:h-80">
                {compassSVG}
              </div>

              {/* Live readout */}
              {deviceHeading !== null && (
                <div className="mt-2 flex gap-4 text-xs text-white/40">
                  <span>Device: {Math.round(deviceHeading)}°</span>
                  <span>Qibla: {qibla}°</span>
                  <span>Needle: {Math.round(needleAngle)}°</span>
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
                className="w-full py-3 rounded-xl border border-white/20 text-white/70 text-sm font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2">
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
                <p className="text-yellow-300 text-sm">Compass permission denied. Use the {qibla}° value with a physical compass app.</p>
              </div>
            )}

            {compassState === 'unsupported' && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-white/40 text-sm">Live compass not available. Face {qibla}° ({cardinal(qibla)}) from North.</p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/50 text-xs text-center leading-relaxed">
                {compassState === 'active'
                  ? '🔄 Turn your phone slowly. The 🕋 golden arrow always points toward the Kaaba. The ring (N/E/S/W) stays fixed to the real world as you rotate.'
                  : `📐 Face ${qibla}° (${cardinal(qibla)}) from True North to face the Qibla. Enable the live compass above for real-time guidance.`}
              </p>
            </div>

            {/* Accuracy note */}
            <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-3">
              <p className="text-amber-300/70 text-xs text-center leading-relaxed">
                ✓ Uses verified Great Circle bearing formula<br />
                Kaaba: 21.4225°N, 39.8262°E · Accuracy within 1°
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
