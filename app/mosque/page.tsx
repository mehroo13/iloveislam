'use client';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Mosque {
  id: number;
  lat: number;
  lon: number;
  name: string;
  address: string;
  phone: string;
  website: string;
  opening_hours: string;
  distance: number;
  bearing: string;
  direction: string;
}

interface PrayerTime {
  name: string;
  time: string;
  icon: string;
  raw: number;
  isSunrise?: boolean;
}

interface PrayerResult {
  ok: boolean;
  times?: PrayerTime[];
  loading?: boolean;
}

// ─── Geo helpers ──────────────────────────────────────────────────────────────
function deg2rad(d: number) { return d * Math.PI / 180; }

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const dLon = deg2rad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(deg2rad(lat2));
  const x = Math.cos(deg2rad(lat1)) * Math.sin(deg2rad(lat2)) - Math.sin(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.cos(dLon);
  const b = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(b / 45) % 8];
}

function formatDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

function walkOrDrive(km: number): string {
  if (km < 0.15) return '~2 min walk';
  if (km < 0.8) return `~${Math.round(km * 1000 / 80)} min walk`;
  if (km < 3) return `~${Math.round(km / 0.4)} min drive`;
  return `~${Math.round(km / 0.6)} min drive`;
}

// ─── Prayer times cache ───────────────────────────────────────────────────────
const prayerCache: Record<string, PrayerResult> = {};

async function fetchPrayerTimes(lat: number, lon: number): Promise<PrayerResult> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  if (prayerCache[key] && !prayerCache[key].loading) return prayerCache[key];

  try {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lon}&method=2`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (data.code !== 200 || !data.data?.timings) throw new Error();

    const t = data.data.timings;

    function fmt(raw: string): string {
      if (!raw) return '--:--';
      const [h, m] = raw.split(':').map(Number);
      const ampm = h < 12 ? 'AM' : 'PM';
      const hr = h % 12 === 0 ? 12 : h % 12;
      return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
    }

    function toFloat(raw: string): number {
      if (!raw) return NaN;
      const [h, m] = raw.split(':').map(Number);
      return h + m / 60;
    }

    const result: PrayerResult = {
      ok: true,
      times: [
        { name: 'Fajr',    time: fmt(t.Fajr),    icon: '🌙', raw: toFloat(t.Fajr) },
        { name: 'Sunrise', time: fmt(t.Sunrise),  icon: '🌅', raw: toFloat(t.Sunrise), isSunrise: true },
        { name: 'Dhuhr',   time: fmt(t.Dhuhr),    icon: '☀️',  raw: toFloat(t.Dhuhr) },
        { name: 'Asr',     time: fmt(t.Asr),      icon: '🌤️', raw: toFloat(t.Asr) },
        { name: 'Maghrib', time: fmt(t.Maghrib),  icon: '🌇', raw: toFloat(t.Maghrib) },
        { name: 'Isha',    time: fmt(t.Isha),     icon: '🌃', raw: toFloat(t.Isha) },
      ],
    };
    prayerCache[key] = result;
    return result;
  } catch {
    const result: PrayerResult = { ok: false };
    prayerCache[key] = result;
    return result;
  }
}

function getNextPrayer(times: PrayerTime[]): string | null {
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const prayers = times.filter(t => !t.isSunrise);
  for (const p of prayers) {
    if (!isNaN(p.raw) && p.raw > nowH) return p.name;
  }
  return prayers[0]?.name ?? null;
}

// ─── Overpass query builder — simple = fast ───────────────────────────────────
function buildMosqueQuery(lat: number, lon: number, radiusM: number): string {
  return `[out:json][timeout:25];
(
  node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lon});
  way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lon});
  node["building"="mosque"](around:${radiusM},${lat},${lon});
  way["building"="mosque"](around:${radiusM},${lat},${lon});
);
out body center;`;
}

// ─── Overpass fetch — 3 mirrors × POST+GET = 6 attempts ──────────────────────
const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

async function overpassFetch(query: string): Promise<any[]> {
  for (const url of MIRRORS) {
    for (const method of ['POST', 'GET'] as const) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 22000);
        const res = await fetch(
          method === 'GET' ? `${url}?data=${encodeURIComponent(query)}` : url,
          {
            method,
            signal: ctrl.signal,
            ...(method === 'POST' ? {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `data=${encodeURIComponent(query)}`,
            } : {}),
          }
        );
        clearTimeout(t);
        if (!res.ok) continue;
        const data = await res.json();
        if (Array.isArray(data.elements)) return data.elements;
      } catch { continue; }
    }
  }
  throw new Error('All map servers are currently busy. Please try again in a moment.');
}

// ─── Parse raw OSM elements into Mosque objects ───────────────────────────────
function parseElements(elements: any[], userLat: number, userLon: number): Mosque[] {
  const seen = new Set<string>();
  const mosques: Mosque[] = [];

  for (const el of elements) {
    const lat = el.type === 'node' ? el.lat : el.center?.lat;
    const lon = el.type === 'node' ? el.lon : el.center?.lon;
    if (!lat || !lon) continue;

    const name =
      el.tags?.name ||
      el.tags?.['name:en'] ||
      el.tags?.['name:ar'] ||
      el.tags?.['name:ur'] ||
      el.tags?.['name:tr'] ||
      'Mosque';

    // Deduplicate by name + rounded coords
    const key = `${name.toLowerCase().trim()}-${Math.round(lat * 500)}-${Math.round(lon * 500)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const dist = getDistance(userLat, userLon, lat, lon);
    const bearing = getBearing(userLat, userLon, lat, lon);

    mosques.push({
      id: el.id,
      lat, lon, name,
      address: [
        el.tags?.['addr:housenumber'],
        el.tags?.['addr:street'],
        el.tags?.['addr:city'],
      ].filter(Boolean).join(', '),
      phone: el.tags?.phone || el.tags?.['contact:phone'] || '',
      website: el.tags?.website || el.tags?.['contact:website'] || '',
      opening_hours: el.tags?.opening_hours || '',
      distance: dist,
      bearing,
      direction: walkOrDrive(dist),
    });
  }

  return mosques.sort((a, b) => a.distance - b.distance);
}

// ─── Search with auto-expanding radius ───────────────────────────────────────
const RADII = [4000, 8000, 15000, 30000]; // 4 → 8 → 15 → 30 km

async function searchMosques(lat: number, lon: number, targetKm: number): Promise<{ mosques: Mosque[]; usedKm: number }> {
  // Always respect the user's chosen radius first; expand only if empty
  const radiiToTry = [targetKm * 1000, ...RADII.filter(r => r > targetKm * 1000)];
  let lastElements: any[] = [];
  let succeeded = false;
  let usedKm = targetKm;

  for (const r of radiiToTry) {
    try {
      const els = await overpassFetch(buildMosqueQuery(lat, lon, r));
      succeeded = true;
      lastElements = els;
      usedKm = r / 1000;
      if (els.length >= 2) break; // good enough — stop expanding
    } catch {
      continue; // mirror failed — try wider radius
    }
  }

  if (!succeeded) throw new Error('All map servers are currently busy. Please wait 30 seconds and try again.');
  return { mosques: parseElements(lastElements, lat, lon), usedKm };
}

// ─── Mosque Card ──────────────────────────────────────────────────────────────
function MosqueCard({
  mosque,
  rank,
  userPos,
}: {
  mosque: Mosque;
  rank: number;
  userPos: { lat: number; lon: number } | null;
}) {
  const [open, setOpen] = useState(false);
  const [prayer, setPrayer] = useState<PrayerResult | null>(null);
  const isFirst = rank === 0;

  async function toggle() {
    setOpen(o => !o);
    if (!open && !prayer) {
      setPrayer({ ok: false, loading: true });
      const result = await fetchPrayerTimes(mosque.lat, mosque.lon);
      setPrayer(result);
    }
  }

  const nextPrayer = prayer?.ok && prayer.times ? getNextPrayer(prayer.times) : null;

  return (
    <div
      onClick={toggle}
      style={{
        background: open ? '#fdfcf8' : '#fff',
        borderRadius: 18,
        border: `1.5px solid ${open ? '#0a3d2e' : isFirst ? '#c8a96e55' : '#ede9e2'}`,
        padding: '15px 17px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: open ? '0 4px 24px rgba(10,61,46,0.10)' : isFirst ? '0 2px 12px rgba(200,169,110,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* ── Row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Rank bubble */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: isFirst ? 'linear-gradient(135deg,#0a3d2e,#1a6b4a)' : '#f5f1eb',
          color: isFirst ? '#c8a96e' : '#888',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: isFirst ? 20 : 13, fontWeight: 700,
        }}>
          {isFirst ? '🕌' : rank + 1}
        </div>

        {/* Name + distance */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14, fontWeight: 700, color: '#0a3d2e',
            margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {mosque.name}
          </p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 12, fontWeight: 800,
              color: isFirst ? '#c8a96e' : '#0a3d2e',
              background: isFirst ? '#0a3d2e' : '#f0faf4',
              padding: '2px 8px', borderRadius: 20,
            }}>
              {formatDist(mosque.distance)}
            </span>
            <span style={{ fontSize: 11, color: '#bbb' }}>{mosque.bearing}</span>
            <span style={{ fontSize: 11, color: '#aaa' }}>{mosque.direction}</span>
            {mosque.address && (
              <span style={{ fontSize: 11, color: '#c8b99a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                {mosque.address}
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <span style={{ fontSize: 11, color: '#ccc', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </div>

      {/* ── Expanded panel ── */}
      {open && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee8dc' }}>

          {/* Prayer times */}
          <div style={{
            background: 'linear-gradient(135deg, #071a10, #0a3d2e)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: 0 }}>🕐 Today's Prayer Times</p>
              <p style={{ color: 'rgba(200,169,110,0.75)', fontSize: 10, margin: 0 }}>
                {prayer?.loading ? 'Fetching…' : prayer?.ok ? '✓ Live · Aladhan API' : 'Unavailable'}
              </p>
            </div>

            {prayer?.loading && (
              <div style={{ textAlign: 'center', padding: '18px 0' }}>
                <div style={{ width: 26, height: 26, border: '2.5px solid rgba(255,255,255,0.2)', borderTopColor: '#c8a96e', borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }} />
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '10px 0 0' }}>Fetching prayer times…</p>
              </div>
            )}

            {prayer?.ok && prayer.times && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
                  {prayer.times.map(p => {
                    const isNext = nextPrayer === p.name;
                    return (
                      <div key={p.name} style={{
                        background: isNext ? 'rgba(200,169,110,0.22)' : 'rgba(255,255,255,0.07)',
                        border: `1.5px solid ${isNext ? 'rgba(200,169,110,0.55)' : 'transparent'}`,
                        borderRadius: 10, padding: '9px 6px', textAlign: 'center',
                      }}>
                        <p style={{ fontSize: 16, margin: '0 0 2px' }}>{p.icon}</p>
                        <p style={{ color: p.isSunrise ? 'rgba(255,255,255,0.35)' : isNext ? '#c8a96e' : 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: 700, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{p.name}</p>
                        <p style={{ color: p.isSunrise ? 'rgba(255,255,255,0.3)' : '#fff', fontSize: 12, fontWeight: 800, margin: 0 }}>{p.time}</p>
                        {isNext && (
                          <p style={{ color: '#c8a96e', fontSize: 8, fontWeight: 800, letterSpacing: 1, margin: '3px 0 0', textTransform: 'uppercase' }}>● NEXT</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, textAlign: 'center', margin: '10px 0 0', fontStyle: 'italic' }}>
                  Calculated for this mosque's exact location · Powered by Aladhan.com
                </p>
              </>
            )}

            {prayer && !prayer.loading && !prayer.ok && (
              <div style={{ textAlign: 'center', padding: '14px 0' }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 4px' }}>Could not load prayer times</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>Check your connection and try again</p>
              </div>
            )}
          </div>

          {/* Details */}
          {(mosque.opening_hours || mosque.phone || mosque.website) && (
            <div style={{ background: '#f9f7f2', borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {mosque.opening_hours && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>🕐</span>
                  <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.5 }}>{mosque.opening_hours}</p>
                </div>
              )}
              {mosque.phone && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>📞</span>
                  <a href={`tel:${mosque.phone}`} onClick={e => e.stopPropagation()}
                    style={{ fontSize: 12, color: '#0a3d2e', textDecoration: 'none', fontWeight: 600 }}>{mosque.phone}</a>
                </div>
              )}
              {mosque.website && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>🌐</span>
                  <a href={mosque.website.startsWith('http') ? mosque.website : `https://${mosque.website}`}
                    target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    style={{ fontSize: 12, color: '#0a3d2e', textDecoration: 'none', wordBreak: 'break-all', fontWeight: 600 }}>
                    {mosque.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={e => {
                e.stopPropagation();
                const url = userPos
                  ? `https://www.google.com/maps/dir/${userPos.lat},${userPos.lon}/${mosque.lat},${mosque.lon}`
                  : `https://www.google.com/maps/search/?api=1&query=${mosque.lat},${mosque.lon}`;
                window.open(url, '_blank');
              }}
              style={{ flex: 1, background: 'linear-gradient(135deg,#0a3d2e,#1a6b4a)', color: '#fff', border: 'none', borderRadius: 11, padding: '12px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              🗺️ Get Directions
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                window.open(`https://www.google.com/maps/search/?api=1&query=${mosque.lat},${mosque.lon}`, '_blank');
              }}
              style={{ flex: 1, background: '#f0ece4', color: '#0a3d2e', border: 'none', borderRadius: 11, padding: '12px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              📌 View on Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
type Status = 'idle' | 'locating' | 'geocoding' | 'loading' | 'done' | 'error';

export default function MosqueFinder() {
  const [status, setStatus]       = useState<Status>('idle');
  const [userPos, setUserPos]     = useState<{ lat: number; lon: number } | null>(null);
  const [mosques, setMosques]     = useState<Mosque[]>([]);
  const [usedKm, setUsedKm]       = useState<number>(5);
  const [error, setError]         = useState('');
  const [filter, setFilter]       = useState('');
  const [radius, setRadius]       = useState(5);
  const [cityInput, setCityInput] = useState('');
  const [cityLoading, setCityLoading] = useState(false);
  const [locationLabel, setLocationLabel] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (lat: number, lon: number, r: number) => {
    // Cancel any in-flight search
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setStatus('loading');
    setMosques([]);
    setError('');
    setFilter('');

    try {
      const { mosques: results, usedKm: actualKm } = await searchMosques(lat, lon, r);
      setMosques(results);
      setUsedKm(actualKm);
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed. Please try again.');
      setStatus('error');
    }
  }, []);

  // ── GPS ──
  function handleGPS() {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser. Please search by city.');
      setStatus('error');
      return;
    }
    setStatus('locating');
    setError('');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setUserPos({ lat, lon });
        // Reverse geocode label (non-blocking)
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
          .then(r => r.json())
          .then(d => {
            const name = d.address?.city || d.address?.town || d.address?.village || d.address?.county || '';
            setLocationLabel(name ? `Near ${name}` : 'Your GPS location');
          })
          .catch(() => setLocationLabel('Your GPS location'));
        await runSearch(lat, lon, radius);
      },
      err => {
        const msg = err.code === 1
          ? 'Location permission denied. Please allow access or search by city below.'
          : 'Could not get your location. Please search by city.';
        setError(msg);
        setStatus('error');
      },
      { timeout: 14000, enableHighAccuracy: true }
    );
  }

  // ── City search ──
  async function handleCitySearch() {
    if (!cityInput.trim()) return;
    setCityLoading(true);
    setError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityInput.trim())}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' }, signal: AbortSignal.timeout(10000) }
      );
      const data = await res.json();
      if (!data.length) throw new Error('City not found. Try a different spelling or nearby city.');
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      const label = data[0].display_name.split(',')[0];
      setUserPos({ lat, lon });
      setLocationLabel(`Near ${label}`);
      setCityLoading(false);
      await runSearch(lat, lon, radius);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'City search failed. Check your connection.');
      setCityLoading(false);
      setStatus('error');
    }
  }

  function handleRadiusChange(r: number) {
    setRadius(r);
    if (userPos) runSearch(userPos.lat, userPos.lon, r);
  }

  const filtered = mosques.filter(m =>
    !filter.trim() ||
    m.name.toLowerCase().includes(filter.toLowerCase()) ||
    m.address.toLowerCase().includes(filter.toLowerCase())
  );

  const isSearching = status === 'locating' || status === 'geocoding' || status === 'loading';

  return (
    <div style={{ minHeight: '100vh', background: '#f5f2ed', fontFamily: 'Georgia, "Times New Roman", serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.5} }
        .mosque-card-enter { animation: fadeUp 0.3s ease forwards; }
        input:focus { outline: none !important; }
        button:active { transform: scale(0.97); }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: 'linear-gradient(160deg, #071a10 0%, #0a3d2e 55%, #0f5c3a 100%)', padding: '18px 16px 28px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(200,169,110,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(200,169,110,0.04)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none' }}>← Back</Link>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: 0.3 }}>🕌 Mosque Finder</h1>
              <p style={{ color: 'rgba(200,169,110,0.7)', fontSize: 10, margin: '2px 0 0', letterSpacing: 1.5, textTransform: 'uppercase' }}>Find · Prayer Times · Directions</p>
            </div>
            <div style={{ width: 48 }} />
          </div>

          {/* GPS button — always prominent */}
          <button
            onClick={handleGPS}
            disabled={isSearching}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 14,
              border: 'none',
              background: isSearching
                ? 'rgba(255,255,255,0.12)'
                : 'linear-gradient(135deg, #c8a96e, #a8863e)',
              color: isSearching ? 'rgba(255,255,255,0.6)' : '#071a10',
              fontSize: 15,
              fontWeight: 800,
              cursor: isSearching ? 'not-allowed' : 'pointer',
              marginBottom: 10,
              letterSpacing: 0.2,
              transition: 'all 0.2s',
            }}
          >
            {status === 'locating' ? '📡 Getting your GPS location…'
              : status === 'loading' && !cityLoading ? '⏳ Searching mosques…'
              : status === 'done' ? '📡 Refresh — Use My GPS Again'
              : '📍 Use My GPS Location — Find Nearest Mosques'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>OR SEARCH BY CITY</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* City search */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCitySearch()}
              placeholder="City, e.g. London · Karachi · Dubai · Sydney…"
              style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: 'none', fontSize: 13, background: 'rgba(255,255,255,0.12)', color: '#fff', }}
            />
            <button
              onClick={handleCitySearch}
              disabled={cityLoading || !cityInput.trim() || isSearching}
              style={{
                background: cityInput.trim() ? 'rgba(200,169,110,0.9)' : 'rgba(255,255,255,0.1)',
                color: cityInput.trim() ? '#071a10' : 'rgba(255,255,255,0.4)',
                border: 'none', borderRadius: 12, padding: '0 20px',
                fontWeight: 700, fontSize: 13, cursor: cityInput.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              {cityLoading ? '…' : 'Search'}
            </button>
          </div>

          {/* Radius chips — shown once we have a position */}
          {(status === 'done' || status === 'loading') && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>Radius:</span>
              {[2, 5, 10, 20].map(r => (
                <button
                  key={r}
                  onClick={() => handleRadiusChange(r)}
                  style={{
                    padding: '4px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700,
                    background: radius === r ? '#c8a96e' : 'rgba(255,255,255,0.12)',
                    color: radius === r ? '#071a10' : 'rgba(255,255,255,0.65)',
                    transition: 'all 0.2s',
                  }}
                >
                  {r}km
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN ── */}
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '14px 14px 48px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <p style={{ color: '#dc2626', fontSize: 13, fontWeight: 700, margin: '0 0 8px' }}>{error}</p>
              <button
                onClick={() => window.open('https://www.google.com/maps/search/mosque+near+me', '_blank')}
                style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                🗺️ Search on Google Maps instead
              </button>
            </div>
          </div>
        )}

        {/* Idle splash */}
        {status === 'idle' && !error && (
          <div style={{ background: 'linear-gradient(135deg,#071a10,#0a3d2e)', borderRadius: 20, padding: '40px 24px', textAlign: 'center', animation: 'fadeUp 0.4s ease' }}>
            <p style={{ fontSize: 56, margin: '0 0 14px' }}>🕌</p>
            <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Find Mosques Near You</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 6px', lineHeight: 1.7 }}>
              Tap GPS for instant results · or type any city
            </p>
            <p style={{ color: 'rgba(200,169,110,0.7)', fontSize: 12, fontStyle: 'italic', margin: 0 }}>
              Tap any mosque to see live prayer times
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {status === 'loading' && (
          <div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #ede9e2', padding: '15px 17px', marginBottom: 10, display: 'flex', gap: 12, animation: 'pulse 1.4s ease infinite', animationDelay: `${i * 0.1}s` }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0ece4', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, background: '#f0ece4', borderRadius: 6, width: '55%', marginBottom: 8 }} />
                  <div style={{ height: 11, background: '#f5f2ed', borderRadius: 6, width: '35%' }} />
                </div>
              </div>
            ))}
            <p style={{ textAlign: 'center', color: '#bbb', fontSize: 12, marginTop: 4 }}>
              Searching {radius}km radius… trying multiple map servers
            </p>
          </div>
        )}

        {/* Results */}
        {status === 'done' && (
          <>
            {/* Summary bar */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #ede9e2', padding: '11px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <div>
                <p style={{ fontSize: 13, color: '#555', margin: 0 }}>
                  <strong style={{ color: '#0a3d2e' }}>{mosques.length}</strong> mosque{mosques.length !== 1 ? 's' : ''} found
                  {usedKm !== radius && usedKm > radius && (
                    <span style={{ color: '#c8a96e', fontSize: 11 }}> (expanded to {usedKm}km)</span>
                  )}
                </p>
                {locationLabel && <p style={{ fontSize: 11, color: '#aaa', margin: '2px 0 0' }}>📍 {locationLabel}</p>}
              </div>
              {mosques.length > 0 && (
                <p style={{ fontSize: 11, color: '#c8a96e', fontWeight: 700, margin: 0 }}>
                  Nearest: {formatDist(mosques[0].distance)} · {mosques[0].bearing}
                </p>
              )}
            </div>

            {/* Filter input — show if more than 5 results */}
            {mosques.length > 5 && (
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#bbb' }}>🔍</span>
                <input
                  type="text"
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  placeholder={`Filter ${mosques.length} mosques by name or street…`}
                  style={{ width: '100%', paddingLeft: 40, paddingRight: 14, paddingTop: 11, paddingBottom: 11, borderRadius: 12, border: '1.5px solid #ede9e2', fontSize: 13, background: '#fff', color: '#333' }}
                />
                {filter && (
                  <button onClick={() => setFilter('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 16 }}>✕</button>
                )}
              </div>
            )}

            {/* Mosque cards */}
            {filtered.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #ede9e2', padding: '40px 20px', textAlign: 'center' }}>
                {filter ? (
                  <>
                    <p style={{ fontSize: 36, margin: '0 0 8px' }}>🔍</p>
                    <p style={{ fontSize: 14, color: '#555', margin: '0 0 10px' }}>No mosques match "{filter}"</p>
                    <button onClick={() => setFilter('')} style={{ background: '#0a3d2e', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, cursor: 'pointer' }}>Clear filter</button>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 36, margin: '0 0 8px' }}>🕌</p>
                    <p style={{ fontSize: 14, color: '#555', margin: '0 0 14px' }}>No mosques found in this area</p>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {[10, 20, 30].filter(r => r > radius).map(r => (
                        <button key={r} onClick={() => handleRadiusChange(r)}
                          style={{ background: '#0a3d2e', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, cursor: 'pointer' }}>
                          Search {r}km
                        </button>
                      ))}
                      <button
                        onClick={() => window.open('https://www.google.com/maps/search/mosque+near+me', '_blank')}
                        style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, cursor: 'pointer' }}>
                        Try Google Maps
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                {filtered.map((m, i) => (
                  <div key={m.id} className="mosque-card-enter" style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}>
                    <MosqueCard mosque={m} rank={i} userPos={userPos} />
                  </div>
                ))}
                <p style={{ fontSize: 10, color: '#ccc', textAlign: 'center', fontStyle: 'italic', margin: '4px 0 0', lineHeight: 1.7 }}>
                  Data from OpenStreetMap · Prayer times from Aladhan.com
                  {usedKm !== radius && <> · Radius auto-expanded to {usedKm}km for more results</>}
                </p>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}