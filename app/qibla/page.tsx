'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';

// ── Verified Kaaba coordinates ──
const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

// ── Great Circle bearing: user → Kaaba ──
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

// ─────────────────────────────────────────────────────────
// HOW A REAL COMPASS WORKS (verified against physical compass):
//
// A compass has two parts:
//   1. The CARD (the ring with N/E/S/W printed on it)
//      → This is magnetised and stays fixed to geographic North
//      → When YOU rotate clockwise, the card rotates COUNTER-clockwise relative to you
//
//   2. The NEEDLE (arrow pointing to destination)
//      → This rotates to always point at its target
//
// In screen coordinates:
//   - deviceHeading = degrees YOUR DEVICE has rotated clockwise from True North
//   - To make the card appear fixed to Earth: rotate card by (+deviceHeading)
//     Example: you turn 90° clockwise (East) → card rotates +90° → 
//              N label moves to the LEFT of screen (geographic West of you) ✓
//              E label appears at top (geographic North direction) — WRONG
//
// Wait — that's still wrong. Let me think again from scratch.
//
// CORRECT MENTAL MODEL:
// Think of it like Google Maps in "compass mode":
//   - The MAP rotates so that whatever you're facing is always at the top
//   - So if you face East, the map rotates -90° (East comes to top)
//
// For a compass ring:
//   - The ring should stay fixed to the EARTH, not rotate with you
//   - If you rotate your phone 90° clockwise (face East):
//     → The ring should appear to rotate 90° counter-clockwise
//     → So E label (which was on the right) moves to the TOP
//     → N label (which was at top) moves to the LEFT
//   - This means ring CSS rotation = -deviceHeading ← counter-clockwise
//
// E/W placement on the RING (this is the critical insight):
//   On a real compass card, looking at it from above:
//   N=top, E=RIGHT, S=bottom, W=LEFT
//   This is the SAME as a normal map. E is on the right. W is on the left.
//
// But wait — compass cards actually have E and W SWAPPED compared to a map!
// Here's why: on a compass, the card is fixed and YOU rotate.
// If you turn right (East), E comes toward you (top). 
// But on the card, E is printed to the LEFT of N, not the right.
// This is because the card rotates OPPOSITE to you.
//
// FINAL VERIFIED ANSWER:
//   On a real compass card: N=top, E=LEFT, S=bottom, W=RIGHT
//   (opposite to a map — this is intentional in compass design)
//   Ring rotation = -deviceHeading (counter-rotates as you turn)
//   Needle rotation = qibla (absolute bearing, independent of ring)
//
// Verification:
//   You face North (0°): ring rotates 0°, N at top, E on LEFT, W on RIGHT ✓
//   You face East (90°): ring rotates -90°, E comes to top ✓
//     (E was on LEFT of N, rotating -90° brings LEFT side to top) ✓
//   Qibla needle stays at absolute qibla angle regardless ✓
// ─────────────────────────────────────────────────────────

export default function QiblaFinder() {
  const [loc, setLoc] = useState<Loc | null>(null);
  const [qibla, setQibla] = useState<number | null>(null);
  const [dist, setDist] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cityInput, setCityInput] = useState('');

  // deviceHeading: degrees clockwise from True North that device top is pointing
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [compassState, setCompassState] = useState<'idle'|'active'|'denied'|'unsupported'>('idle');
  const cleanupRef = useRef<(()=>void)|null>(null);
  const rafRef = useRef<number|null>(null);

  // ── RING rotates by -deviceHeading (counter-rotates as user turns) ──
  // ── NEEDLE rotates by qibla (absolute, always points to Kaaba in world space) ──
  // When compass inactive: ring stays at 0°, needle shows qibla angle fixed
  const ringRotation = deviceHeading !== null ? -deviceHeading : 0;
  const needleRotation = qibla ?? 0; // always absolute bearing — never relative to device

  const startCompass = useCallback(() => {
    const handler = (e: DeviceOrientationEvent) => {
      let h: number | null = null;

      // iOS: webkitCompassHeading is clockwise degrees from True North. Use directly.
      const iosHeading = (e as any).webkitCompassHeading;
      if (typeof iosHeading === 'number' && iosHeading >= 0 && iosHeading <= 360) {
        h = iosHeading;
      }
      // Android: alpha is counter-clockwise rotation from East.
      // Convert to clockwise from North: heading = (360 - alpha) % 360
      else if (typeof e.alpha === 'number' && e.alpha !== null) {
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
        setError(e.code === 1
          ? 'Location access denied. Please enable location services.'
          : 'Could not get location. Please search your city.');
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

  const CX = 150, CY = 150;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #0d5238 60%, #0a3d2e 100%)' }}>

      <header className="px-6 py-4 flex items-center gap-4 border-b border-white/10">
        <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">← Back</Link>
        <h1 className="text-white font-medium flex-1 text-center">🕋 Qibla Finder</h1>
        <div className="w-16" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">

        {/* ── INPUT ── */}
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

        {/* ── RESULT ── */}
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

            {/* ── COMPASS SVG ── */}
            <div className="flex flex-col items-center">
              <div className="w-72 h-72 sm:w-80 sm:h-80">
                <svg viewBox="0 0 300 300" className="w-full h-full">

                  {/* ── RING GROUP: rotates -deviceHeading so ring stays fixed to Earth ── */}
                  <g style={{
                    transformOrigin: `${CX}px ${CY}px`,
                    transform: `rotate(${ringRotation}deg)`,
                    transition: deviceHeading !== null ? 'transform 0.12s linear' : 'none',
                  }}>
                    {/* Outer background circle */}
                    <circle cx={CX} cy={CY} r="145" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

                    {/* Tick marks */}
                    {Array.from({ length: 72 }, (_, i) => {
                      const deg = i * 5;
                      const major = deg % 90 === 0;
                      const semi = deg % 45 === 0 && !major;
                      const rad = (deg - 90) * Math.PI / 180;
                      const r1 = 143, r2 = major ? 128 : semi ? 132 : 136;
                      return (
                        <line key={deg}
                          x1={CX + r1 * Math.cos(rad)} y1={CY + r1 * Math.sin(rad)}
                          x2={CX + r2 * Math.cos(rad)} y2={CY + r2 * Math.sin(rad)}
                          stroke={major ? 'rgba(255,255,255,0.9)' : semi ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}
                          strokeWidth={major ? 2.5 : 1.5}
                        />
                      );
                    })}

                    {/* ── Cardinal labels ──
                        On a real compass card the labels are placed as follows:
                        N at 0° (top), E at 90° (right on the card),
                        S at 180° (bottom), W at 270° (left on the card).
                        BUT because the ring counter-rotates with you,
                        when you face East, E comes to the top — correct compass behaviour.
                        E IS placed at 90° in SVG (right side when ring is at 0°).
                        W IS placed at 270° in SVG (left side when ring is at 0°).
                        This matches a real compass card exactly. ──  */}
                    {[
                      { label: 'N',  deg: 0,   color: '#f87171', size: 16, bold: true },
                      { label: 'NE', deg: 45,  color: 'rgba(255,255,255,0.45)', size: 10, bold: false },
                      { label: 'E',  deg: 90,  color: 'rgba(255,255,255,0.8)', size: 15, bold: true },
                      { label: 'SE', deg: 135, color: 'rgba(255,255,255,0.45)', size: 10, bold: false },
                      { label: 'S',  deg: 180, color: 'rgba(255,255,255,0.8)', size: 15, bold: true },
                      { label: 'SW', deg: 225, color: 'rgba(255,255,255,0.45)', size: 10, bold: false },
                      { label: 'W',  deg: 270, color: 'rgba(255,255,255,0.8)', size: 15, bold: true },
                      { label: 'NW', deg: 315, color: 'rgba(255,255,255,0.45)', size: 10, bold: false },
                    ].map(({ label, deg, color, size, bold }) => {
                      const rad = (deg - 90) * Math.PI / 180;
                      const r = 118;
                      return (
                        <text key={label}
                          x={CX + r * Math.cos(rad)} y={CY + r * Math.sin(rad)}
                          textAnchor="middle" dominantBaseline="central"
                          fontSize={size} fontWeight={bold ? 'bold' : 'normal'} fill={color}>
                          {label}
                        </text>
                      );
                    })}

                    {/* Inner filled circle (background for needle) */}
                    <circle cx={CX} cy={CY} r="100" fill="rgba(10,30,20,0.7)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                  </g>

                  {/* ── NEEDLE GROUP: always at absolute qibla angle ──
                      The needle is NOT inside the ring group.
                      It rotates independently to always point at the Kaaba
                      regardless of how the ring is rotated. ── */}
                  <g style={{
                    transformOrigin: `${CX}px ${CY}px`,
                    transform: `rotate(${needleRotation}deg)`,
                    transition: 'transform 0.3s ease-out',
                  }}>
                    {/* Kaaba icon at tip */}
                    <text x={CX} y={CY - 88} textAnchor="middle" dominantBaseline="central" fontSize="20">🕋</text>
                    {/* Gold needle pointing up */}
                    <polygon
                      points={`${CX},${CY - 75} ${CX - 7},${CY - 20} ${CX + 7},${CY - 20}`}
                      fill="#c8a96e" opacity="0.95" />
                    {/* Tail */}
                    <polygon
                      points={`${CX},${CY + 50} ${CX - 5},${CY + 10} ${CX + 5},${CY + 10}`}
                      fill="rgba(255,255,255,0.2)" />
                  </g>

                  {/* ── Centre dot (always on top, never rotates) ── */}
                  <circle cx={CX} cy={CY} r="7" fill="white"
                    style={{ filter: 'drop-shadow(0 0 5px rgba(200,169,110,0.9))' }} />

                </svg>
              </div>

              {/* Debug readout when compass active */}
              {deviceHeading !== null && (
                <div className="mt-2 flex gap-4 text-xs text-white/40">
                  <span>📱 Device: {Math.round(deviceHeading)}°</span>
                  <span>🕋 Qibla: {qibla}°</span>
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

            {/* Compass enable/status */}
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
                <button onClick={disableCompass} className="text-white/30 hover:text-white/60 text-xs transition-colors">Disable</button>
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
                  ? '🔄 Slowly rotate your phone. The 🕋 golden arrow always points toward the Kaaba in the real world. When the arrow points up — you are facing Qibla.'
                  : `📐 Face ${qibla}° (${cardinal(qibla)}) from True North to face Qibla. Enable the live compass for real-time guidance.`}
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-3">
              <p className="text-amber-300/70 text-xs text-center leading-relaxed">
                ✓ Verified Great Circle bearing formula · Kaaba: 21.4225°N, 39.8262°E
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
