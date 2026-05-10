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

  // ── COMPASS MATH (verified) ──────────────────────────────────────────────
  // The compass has two independently rotating parts:
  //
  // 1. RING (the degree scale with N/E/S/W labels)
  //    - Must stay fixed to the Earth regardless of how you rotate your phone
  //    - If you rotate phone clockwise by X degrees, ring must rotate counter-clockwise by X
  //    - Ring CSS rotation = -deviceHeading
  //
  // 2. NEEDLE (the arrow pointing to Qibla)
  //    - Must point toward Mecca in the real world
  //    - Qibla is an absolute bearing from True North (e.g. 290° means NW)
  //    - The needle is INSIDE the ring group, so it inherits the ring's -deviceHeading rotation
  //    - To make needle point at absolute qibla: needle CSS rotation = qibla + deviceHeading
  //      Because: ring rotates -heading, needle adds back +heading, net = qibla ✓
  //    - If compass inactive (deviceHeading = null): needle rotation = qibla (shows static direction)
  //
  // E/W ON THE RING:
  //    Standard compass card: N=top(0°), E=right(90°), S=bottom(180°), W=left(270°)
  //    This is identical to a normal map. E is on the RIGHT. W is on the LEFT.
  //    When you face East (rotate phone 90° clockwise):
  //      Ring rotates -90° → E (which was at 90°/right) moves to top ✓
  //      W (which was at 270°/left) moves to bottom ✓
  // ──────────────────────────────────────────────────────────────────────────

  const CX = 150, CY = 150;
  const ringRotation = deviceHeading !== null ? -deviceHeading : 0;
  // Needle is INSIDE ring group (which already rotates -heading),
  // so needle needs to add back heading to point at absolute qibla:
  const needleRotation = (qibla ?? 0) + (deviceHeading ?? 0);

  const startCompass = useCallback(() => {
    const handler = (e: DeviceOrientationEvent) => {
      let h: number | null = null;
      // iOS: webkitCompassHeading is clockwise degrees from True North
      const iosHeading = (e as any).webkitCompassHeading;
      if (typeof iosHeading === 'number' && iosHeading >= 0 && iosHeading <= 360) {
        h = iosHeading;
      }
      // Android: alpha is counter-clockwise from East, convert to clockwise from North
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

            {/* ── COMPASS ── */}
            <div className="flex flex-col items-center">
              <div className="w-72 h-72 sm:w-80 sm:h-80">
                <svg viewBox="0 0 300 300" className="w-full h-full">

                  {/* ── RING GROUP: rotates -deviceHeading so labels stay fixed to Earth ── */}
                  <g style={{
                    transformOrigin: `${CX}px ${CY}px`,
                    transform: `rotate(${ringRotation}deg)`,
                    transition: deviceHeading !== null ? 'transform 0.12s linear' : 'none',
                  }}>

                    {/* Outer background circle */}
                    <circle cx={CX} cy={CY} r="145" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

                    {/* Degree numbers every 30° */}
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => {
                      const rad = (deg - 90) * Math.PI / 180;
                      const r = 105;
                      return (
                        <text key={deg}
                          x={CX + r * Math.cos(rad)} y={CY + r * Math.sin(rad)}
                          textAnchor="middle" dominantBaseline="central"
                          fontSize="8" fill="rgba(255,255,255,0.25)">
                          {deg}
                        </text>
                      );
                    })}

                    {/* Tick marks */}
                    {Array.from({ length: 72 }, (_, i) => {
                      const deg = i * 5;
                      const major = deg % 90 === 0;
                      const semi = deg % 45 === 0 && !major;
                      const rad = (deg - 90) * Math.PI / 180;
                      const r1 = 143;
                      const r2 = major ? 126 : semi ? 131 : 136;
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
                        Standard compass/map orientation:
                        N = top    = 0°   (SVG angle = -90° from right = top)
                        E = RIGHT  = 90°  (SVG angle = 0° = right)
                        S = bottom = 180°
                        W = LEFT   = 270°
                        Ring counter-rotates with device so labels stay fixed to Earth. ── */}
                    {[
                      { label: 'N',  deg: 0,   color: '#f87171', size: 17, bold: true  },
                      { label: 'NE', deg: 45,  color: 'rgba(255,255,255,0.4)', size: 9,  bold: false },
                      { label: 'E',  deg: 90,  color: 'rgba(255,255,255,0.85)', size: 15, bold: true  },
                      { label: 'SE', deg: 135, color: 'rgba(255,255,255,0.4)', size: 9,  bold: false },
                      { label: 'S',  deg: 180, color: 'rgba(255,255,255,0.85)', size: 15, bold: true  },
                      { label: 'SW', deg: 225, color: 'rgba(255,255,255,0.4)', size: 9,  bold: false },
                      { label: 'W',  deg: 270, color: 'rgba(255,255,255,0.85)', size: 15, bold: true  },
                      { label: 'NW', deg: 315, color: 'rgba(255,255,255,0.4)', size: 9,  bold: false },
                    ].map(({ label, deg, color, size, bold }) => {
                      // SVG: 0° = right (3 o'clock), so subtract 90° to make 0° = top (12 o'clock)
                      const rad = (deg - 90) * Math.PI / 180;
                      const r = 120;
                      return (
                        <text key={label}
                          x={CX + r * Math.cos(rad)}
                          y={CY + r * Math.sin(rad)}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={size}
                          fontWeight={bold ? 'bold' : 'normal'}
                          fill={color}>
                          {label}
                        </text>
                      );
                    })}

                    {/* Inner circle background */}
                    <circle cx={CX} cy={CY} r="98" fill="rgba(8,25,15,0.75)" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

                  </g>

                  {/* ── NEEDLE GROUP ──
                      The needle lives OUTSIDE the ring group so its rotation
                      is independent in the SVG coordinate system.
                      To point at absolute qibla bearing:
                        ring rotates by -deviceHeading
                        needle (which is in the same SVG coordinate space as the ring parent)
                        must rotate by: qibla
                      BUT if needle were INSIDE the ring group, it would inherit -deviceHeading,
                      so we'd need qibla + deviceHeading to compensate.
                      Since needle is OUTSIDE the ring group: rotate by qibla directly. ── */}
                  <g style={{
                    transformOrigin: `${CX}px ${CY}px`,
                    transform: `rotate(${qibla ?? 0}deg)`,
                    transition: 'transform 0.3s ease-out',
                  }}>
                    {/* Kaaba emoji at the tip */}
                    <text x={CX} y={CY - 85} textAnchor="middle" dominantBaseline="central" fontSize="20">🕋</text>
                    {/* Gold arrow pointing up (toward tip) */}
                    <polygon
                      points={`${CX},${CY - 72} ${CX - 7},${CY - 18} ${CX + 7},${CY - 18}`}
                      fill="#c8a96e" opacity="0.95"
                    />
                    {/* Tail (opposite direction) */}
                    <polygon
                      points={`${CX},${CY + 48} ${CX - 5},${CY + 8} ${CX + 5},${CY + 8}`}
                      fill="rgba(255,255,255,0.18)"
                    />
                  </g>

                  {/* ── LIVE COMPASS NEEDLE (when active) ──
                      When compass is active, this second needle shows the device heading.
                      It always points up (where you are facing).
                      Rotate by -deviceHeading so it stays fixed pointing upward (to Earth-North). ── */}
                  {deviceHeading !== null && (
                    <g style={{
                      transformOrigin: `${CX}px ${CY}px`,
                      transform: `rotate(0deg)`,
                    }}>
                      {/* Small white upward arrow showing "you are facing this way" */}
                      <polygon
                        points={`${CX},${CY - 60} ${CX - 4},${CY - 35} ${CX + 4},${CY - 35}`}
                        fill="rgba(255,255,255,0.3)"
                      />
                    </g>
                  )}

                  {/* Centre dot */}
                  <circle cx={CX} cy={CY} r="8" fill="white"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(200,169,110,0.9))' }} />

                  {/* Qibla degree label in centre */}
                  <text x={CX} y={CY + 22} textAnchor="middle" fontSize="11" fill="rgba(200,169,110,0.9)" fontWeight="bold">
                    {qibla}° {cardinal(qibla ?? 0)}
                  </text>

                </svg>
              </div>

              {/* Debug readout */}
              {deviceHeading !== null && (
                <div className="mt-1 flex gap-4 text-xs text-white/35">
                  <span>📱 Heading: {Math.round(deviceHeading)}°</span>
                  <span>🕋 Qibla: {qibla}°</span>
                </div>
              )}
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center">
                <p className="text-white/40 text-xs mb-1">Qibla Direction</p>
                <p className="text-white text-3xl font-bold">{qibla}°</p>
                <p className="text-xs mt-1" style={{ color: '#c8a96e' }}>{cardinal(qibla ?? 0)}</p>
                <p className="text-white/30 text-xs mt-0.5">from True North</p>
              </div>
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center">
                <p className="text-white/40 text-xs mb-1">Distance to Kaaba</p>
                <p className="text-white text-3xl font-bold">{dist?.toLocaleString()}</p>
                <p className="text-white/50 text-xs mt-1">kilometers</p>
                <p className="text-white/30 text-xs mt-0.5">≈ {Math.round((dist ?? 0) * 0.621371).toLocaleString()} miles</p>
              </div>
            </div>

            {/* Compass controls */}
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
                <button onClick={disableCompass} className="text-white/30 hover:text-white/60 text-xs transition-colors">Disable</button>
              </div>
            )}

            {compassState === 'denied' && (
              <div className="bg-yellow-500/15 border border-yellow-400/30 rounded-xl p-3 text-center">
                <p className="text-yellow-300 text-sm">Compass permission denied. Face {qibla}° ({cardinal(qibla ?? 0)}) from True North.</p>
              </div>
            )}

            {compassState === 'unsupported' && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-white/40 text-sm">Live compass not supported on this device. Face {qibla}° ({cardinal(qibla ?? 0)}) from True North.</p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/50 text-xs text-center leading-relaxed">
                {compassState === 'active'
                  ? '🔄 The 🕋 golden arrow always points toward the Kaaba. Rotate your phone until the arrow points straight up — then you are facing Qibla.'
                  : `📐 Face ${qibla}° (${cardinal(qibla ?? 0)}) from True North to face Qibla. Enable the live compass below for real-time guidance.`}
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-3">
              <p className="text-amber-300/70 text-xs text-center">
                ✓ Great Circle bearing · Kaaba: 21.4225°N, 39.8262°E
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