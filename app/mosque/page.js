'use client';
import { useState } from 'react';
import Link from 'next/link';

// ── Distance / bearing helpers ─────────────────────────────────────────────
function deg2rad(d) { return d * Math.PI / 180; }
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(deg2rad(lat1))*Math.cos(deg2rad(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function getBearing(lat1, lon1, lat2, lon2) {
  const dLon = deg2rad(lon2-lon1);
  const y = Math.sin(dLon)*Math.cos(deg2rad(lat2));
  const x = Math.cos(deg2rad(lat1))*Math.sin(deg2rad(lat2)) - Math.sin(deg2rad(lat1))*Math.cos(deg2rad(lat2))*Math.cos(dLon);
  const b = (Math.atan2(y,x)*180/Math.PI+360)%360;
  return ['N','NE','E','SE','S','SW','W','NW'][Math.round(b/45)%8];
}
function formatDist(km) { return km < 1 ? `${Math.round(km*1000)}m` : `${km.toFixed(1)}km`; }

// ── Aladhan API — real prayer times by coordinates ─────────────────────────
// Cache so we don't re-fetch for the same mosque twice
const prayerCache = {};

async function fetchRealPrayerTimes(lat, lon) {
  const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (prayerCache[key]) return prayerCache[key];

  try {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();

    const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lon}&method=2`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();

    if (data.code !== 200 || !data.data?.timings) throw new Error('Bad response');

    const t = data.data.timings;

    // Convert "HH:MM" (24h) → "H:MM AM/PM"
    function fmt(raw) {
      if (!raw) return null;
      const [h, m] = raw.split(':').map(Number);
      const ampm = h < 12 ? 'AM' : 'PM';
      const hr = h % 12 === 0 ? 12 : h % 12;
      return `${hr}:${m.toString().padStart(2,'0')} ${ampm}`;
    }

    // Raw hour float for "next prayer" detection
    function toFloat(raw) {
      if (!raw) return NaN;
      const [h, m] = raw.split(':').map(Number);
      return h + m / 60;
    }

    const result = [
      { name: 'Fajr',    time: fmt(t.Fajr),    icon: '🌙', raw: toFloat(t.Fajr) },
      { name: 'Sunrise', time: fmt(t.Sunrise),  icon: '🌅', raw: toFloat(t.Sunrise), isSunrise: true },
      { name: 'Dhuhr',   time: fmt(t.Dhuhr),    icon: '☀️',  raw: toFloat(t.Dhuhr) },
      { name: 'Asr',     time: fmt(t.Asr),      icon: '🌤️', raw: toFloat(t.Asr) },
      { name: 'Maghrib', time: fmt(t.Maghrib),  icon: '🌇', raw: toFloat(t.Maghrib) },
      { name: 'Isha',    time: fmt(t.Isha),     icon: '🌃', raw: toFloat(t.Isha) },
    ];

    prayerCache[key] = { ok: true, times: result };
    return prayerCache[key];
  } catch {
    prayerCache[key] = { ok: false };
    return prayerCache[key];
  }
}

function getNextPrayer(times) {
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const prayers = times.filter(t => !t.isSunrise);
  for (const p of prayers) {
    if (!isNaN(p.raw) && p.raw > nowH) return p.name;
  }
  return prayers[0]?.name;
}

// ── Overpass (OSM) mosque fetch ────────────────────────────────────────────
async function fetchMosques(lat, lon, radiusKm) {
  const r = radiusKm * 1000;
  const q = `[out:json][timeout:25];(node["amenity"="place_of_worship"]["religion"="muslim"](around:${r},${lat},${lon});way["amenity"="place_of_worship"]["religion"="muslim"](around:${r},${lat},${lon});node["amenity"="place_of_worship"]["name"~"mosque|masjid|jami|musalla",i](around:${r},${lat},${lon}););out center tags;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST', body: q, signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error('API error');
  const data = await res.json();
  return (data.elements || []).map(el => {
    const eLat = el.lat ?? el.center?.lat;
    const eLon = el.lon ?? el.center?.lon;
    if (!eLat || !eLon) return null;
    return {
      id: el.id, lat: eLat, lon: eLon,
      name: el.tags?.name || el.tags?.['name:en'] || 'Mosque',
      address: [el.tags?.['addr:housenumber'], el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(' '),
      phone: el.tags?.phone || el.tags?.['contact:phone'] || '',
      website: el.tags?.website || el.tags?.['contact:website'] || '',
      opening_hours: el.tags?.opening_hours || '',
      distance: getDistance(lat, lon, eLat, eLon),
      bearing: getBearing(lat, lon, eLat, eLon),
    };
  }).filter(Boolean).sort((a,b) => a.distance - b.distance);
}

// ── Main component ─────────────────────────────────────────────────────────
export default function MosqueFinder() {
  const [status, setStatus]       = useState('idle');
  const [userPos, setUserPos]     = useState(null);
  const [mosques, setMosques]     = useState([]);
  const [error, setError]         = useState('');
  const [selected, setSelected]   = useState(null);
  const [radius, setRadius]       = useState(5);
  const [filter, setFilter]       = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  async function loadMosques(lat, lon, r) {
    setStatus('loading'); setMosques([]); setSelected(null); setError('');
    try {
      const results = await fetchMosques(lat, lon, r);
      setMosques(results);
      setStatus('done');
    } catch {
      setError('Could not load mosque data. Please check your internet and try again.');
      setStatus('error');
    }
  }

  function locateMe() {
    if (!navigator.geolocation) { setError('Geolocation not supported. Search by city below.'); setStatus('error'); return; }
    setStatus('locating'); setError('');
    navigator.geolocation.getCurrentPosition(
      pos => { const {latitude:la,longitude:lo} = pos.coords; setUserPos({lat:la,lon:lo}); loadMosques(la,lo,radius); },
      err => { setError(err.code===1 ? 'Location permission denied. Please allow access or search by city.' : 'Could not get location. Try searching by city.'); setStatus('error'); },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }

  async function searchByCity() {
    if (!manualCity.trim()) return;
    setManualLoading(true); setError('');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualCity)}&format=json&limit=1`,
        { headers: {'Accept-Language':'en'}, signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      if (!data.length) throw new Error();
      const pos = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      setUserPos(pos); setManualLoading(false);
      loadMosques(pos.lat, pos.lon, radius);
    } catch { setError('City not found. Try a different spelling.'); setManualLoading(false); setStatus('error'); }
  }

  function changeRadius(r) { setRadius(r); if (userPos) loadMosques(userPos.lat, userPos.lon, r); }

  const filtered = mosques.filter(m =>
    !filter || m.name.toLowerCase().includes(filter.toLowerCase()) || m.address.toLowerCase().includes(filter.toLowerCase())
  );

  // ── Mosque Card ────────────────────────────────────────────────────────
  function MosqueCard({ m, idx }) {
    const [prayerState, setPrayerState] = useState(null); // null = not loaded, {ok,times} = loaded

    async function handleExpand() {
      if (selected?.id === m.id) {
        setSelected(null);
        return;
      }
      setSelected(m);
      if (!prayerState) {
        // Show loading state, then fetch
        setPrayerState({ loading: true });
        const result = await fetchRealPrayerTimes(m.lat, m.lon);
        setPrayerState(result);
      }
    }

    const isSelected = selected?.id === m.id;
    const nextPrayer = prayerState?.ok && prayerState.times ? getNextPrayer(prayerState.times) : null;

    return (
      <div
        onClick={handleExpand}
        style={{ background: isSelected ? '#f0f9f4' : '#fff', borderRadius: 16, border: `1.5px solid ${isSelected ? '#0a3d2e' : '#f0ede8'}`, padding: '14px 16px', cursor: 'pointer', transition: 'all .2s' }}
      >
        {/* Summary row */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:'50%', background: idx===0 ? '#0a3d2e' : '#f0ede8', color: idx===0 ? '#fff' : '#666', display:'flex', alignItems:'center', justifyContent:'center', fontSize: idx===0 ? 18 : 13, fontWeight:700, flexShrink:0 }}>
            {idx===0 ? '🕌' : idx+1}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:15, fontWeight:700, color:'#0a3d2e', margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.name}</p>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:12, color:'#c8a96e', fontWeight:700 }}>📍 {formatDist(m.distance)}</span>
              <span style={{ fontSize:11, color:'#bbb' }}>· {m.bearing}</span>
              {m.address && <span style={{ fontSize:11, color:'#aaa', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:170 }}>{m.address}</span>}
            </div>
          </div>
          <span style={{ fontSize:13, color:'#ccc', marginTop:2 }}>{isSelected ? '▲' : '▼'}</span>
        </div>

        {/* Expanded panel */}
        {isSelected && (
          <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #e0f0e8' }}>

            {/* ── Prayer Times Panel ── */}
            <div style={{ background:'linear-gradient(135deg,#0a3d2e,#1a5c3a)', borderRadius:14, padding:'14px 16px', marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <p style={{ color:'#fff', fontSize:13, fontWeight:700, margin:0 }}>🕐 Today's Prayer Times</p>
                <p style={{ color:'rgba(200,169,110,0.9)', fontSize:10, margin:0 }}>
                  {prayerState?.loading ? 'Loading…' : prayerState?.ok ? 'Live from Aladhan API' : 'Not available'}
                </p>
              </div>

              {/* Loading spinner */}
              {prayerState?.loading && (
                <div style={{ textAlign:'center', padding:'18px 0' }}>
                  <div style={{ width:28, height:28, border:'2.5px solid rgba(255,255,255,0.3)', borderTopColor:'#c8a96e', borderRadius:'50%', animation:'spin .8s linear infinite', display:'inline-block' }} />
                  <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, marginTop:10 }}>Fetching prayer times…</p>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              )}

              {/* Prayer times grid */}
              {prayerState?.ok && prayerState.times && (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                    {prayerState.times.map(p => (
                      <div key={p.name} style={{
                        background: nextPrayer===p.name ? 'rgba(200,169,110,0.25)' : 'rgba(255,255,255,0.08)',
                        borderRadius:10, padding:'8px 6px', textAlign:'center',
                        border: nextPrayer===p.name ? '1.5px solid rgba(200,169,110,0.6)' : '1.5px solid transparent'
                      }}>
                        <p style={{ fontSize:15, margin:'0 0 2px' }}>{p.icon}</p>
                        <p style={{ color: p.isSunrise ? 'rgba(255,255,255,0.45)' : nextPrayer===p.name ? '#c8a96e' : 'rgba(255,255,255,0.8)', fontSize:11, fontWeight:600, margin:'0 0 3px' }}>{p.name}</p>
                        <p style={{ color: p.isSunrise ? 'rgba(255,255,255,0.35)' : '#fff', fontSize:12, fontWeight:700, margin:0 }}>{p.time}</p>
                        {nextPrayer===p.name && <p style={{ color:'#c8a96e', fontSize:9, margin:'3px 0 0', fontWeight:600 }}>NEXT</p>}
                      </div>
                    ))}
                  </div>
                  <p style={{ color:'rgba(255,255,255,0.3)', fontSize:9, textAlign:'center', margin:'10px 0 0', fontStyle:'italic' }}>
                    Real-time times for this mosque's location · Powered by Aladhan.com
                  </p>
                </>
              )}

              {/* Not available state */}
              {prayerState && !prayerState.loading && !prayerState.ok && (
                <div style={{ textAlign:'center', padding:'14px 0' }}>
                  <p style={{ fontSize:22, margin:'0 0 6px' }}>📡</p>
                  <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:600, margin:'0 0 4px' }}>Prayer times not available</p>
                  <p style={{ color:'rgba(255,255,255,0.4)', fontSize:11, margin:0 }}>Could not reach the prayer times service. Check your connection and try again.</p>
                </div>
              )}
            </div>

            {/* Details */}
            {m.opening_hours && (
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <span>🕐</span>
                <p style={{ fontSize:12, color:'#555', margin:0 }}>{m.opening_hours}</p>
              </div>
            )}
            {m.phone && (
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <span>📞</span>
                <a href={`tel:${m.phone}`} onClick={e=>e.stopPropagation()} style={{ fontSize:12, color:'#0a3d2e', textDecoration:'none' }}>{m.phone}</a>
              </div>
            )}
            {m.website && (
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <span>🌐</span>
                <a href={m.website.startsWith('http') ? m.website : 'https://'+m.website} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{ fontSize:12, color:'#0a3d2e', textDecoration:'none', wordBreak:'break-all' }}>
                  {m.website.replace(/^https?:\/\//,'')}
                </a>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button
                onClick={e => { e.stopPropagation(); userPos ? window.open(`https://www.google.com/maps/dir/${userPos.lat},${userPos.lon}/${m.lat},${m.lon}`,'_blank') : window.open(`https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lon}`,'_blank'); }}
                style={{ flex:1, background:'#0a3d2e', color:'#fff', border:'none', borderRadius:10, padding:'11px 0', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                🗺️ Get Directions
              </button>
              <button
                onClick={e => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lon}`,'_blank'); }}
                style={{ flex:1, background:'#f0ede8', color:'#0a3d2e', border:'none', borderRadius:10, padding:'11px 0', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                📌 View on Map
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'#f7f4ef', fontFamily:'Georgia, serif' }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(160deg,#0a3d2e 0%,#1a6b4a 100%)', padding:'20px 16px 24px' }}>
        <div style={{ maxWidth:640, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
            <Link href="/" style={{ color:'rgba(255,255,255,0.6)', fontSize:13, textDecoration:'none' }}>← Back</Link>
            <h1 style={{ color:'#fff', fontSize:18, fontWeight:700, margin:0 }}>🕌 Mosque Finder</h1>
            <div style={{ width:48 }} />
          </div>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:11, textAlign:'center', margin:'0 0 18px' }}>Find nearest masjid · Live prayer times</p>

          <button onClick={locateMe} disabled={status==='locating'||status==='loading'}
            style={{ width:'100%', background:(status==='done'||status==='loading') ? 'rgba(255,255,255,0.15)' : '#c8a96e', color:(status==='done'||status==='loading') ? 'rgba(255,255,255,0.8)' : '#0a3d2e', border:'none', borderRadius:14, padding:'14px 0', fontSize:15, fontWeight:700, cursor:(status==='locating'||status==='loading') ? 'not-allowed' : 'pointer', marginBottom:10, opacity:(status==='locating'||status==='loading') ? 0.7 : 1, transition:'all .2s' }}>
            {status==='locating' ? '📡 Getting your location…' : status==='loading' ? '⏳ Searching mosques…' : status==='done' ? '📡 Refresh GPS' : '📡 Use My GPS Location'}
          </button>

          <div style={{ display:'flex', gap:8 }}>
            <input type="text" value={manualCity} onChange={e=>setManualCity(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchByCity()}
              placeholder="Or enter city… e.g. London, Karachi, Dubai"
              style={{ flex:1, padding:'11px 14px', borderRadius:12, border:'none', outline:'none', fontSize:13 }} />
            <button onClick={searchByCity} disabled={manualLoading||!manualCity.trim()}
              style={{ background:'rgba(255,255,255,0.2)', color:'#fff', border:'none', borderRadius:12, padding:'0 16px', fontWeight:600, fontSize:13, cursor:'pointer', opacity:(!manualCity.trim()||manualLoading)?0.5:1 }}>
              {manualLoading ? '…' : 'Go'}
            </button>
          </div>

          {(status==='done'||status==='loading') && (
            <div style={{ display:'flex', gap:6, marginTop:10, justifyContent:'center' }}>
              {[2,5,10,20].map(r=>(
                <button key={r} onClick={()=>changeRadius(r)}
                  style={{ padding:'4px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontWeight:600, background:radius===r ? '#c8a96e' : 'rgba(255,255,255,0.15)', color:radius===r ? '#0a3d2e' : 'rgba(255,255,255,0.7)', transition:'all .2s' }}>
                  {r}km
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main style={{ maxWidth:640, margin:'0 auto', padding:'14px 16px 40px', display:'flex', flexDirection:'column', gap:12 }}>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:14, padding:'14px 16px' }}>
            <p style={{ color:'#dc2626', fontSize:13, fontWeight:600, margin:0 }}>⚠️ {error}</p>
          </div>
        )}

        {status==='idle' && !error && (
          <div style={{ background:'linear-gradient(135deg,#0a3d2e,#1a5c3a)', borderRadius:16, padding:'32px 20px', textAlign:'center' }}>
            <p style={{ fontSize:52, margin:'0 0 12px' }}>🕌</p>
            <p style={{ color:'#fff', fontSize:16, fontWeight:700, margin:'0 0 6px' }}>Find Mosques Near You</p>
            <p style={{ color:'rgba(255,255,255,0.55)', fontSize:13, margin:'0 0 4px' }}>Tap a mosque to see live prayer times</p>
            <p style={{ color:'rgba(200,169,110,0.9)', fontSize:12, fontStyle:'italic', margin:0 }}>Press GPS button above to begin</p>
          </div>
        )}

        {status==='loading' && (
          <div style={{ textAlign:'center', padding:'52px 0' }}>
            <div style={{ width:40, height:40, border:'3px solid #0a3d2e', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .8s linear infinite', display:'inline-block' }} />
            <p style={{ color:'#999', fontSize:13, marginTop:14 }}>Searching for mosques nearby…</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {status==='done' && (
          <>
            <div style={{ background:'#fff', borderRadius:12, border:'1px solid #f0ede8', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:6 }}>
              <p style={{ fontSize:13, color:'#555', margin:0 }}>
                <strong style={{ color:'#0a3d2e' }}>{mosques.length}</strong> mosque{mosques.length!==1?'s':''} within <strong style={{ color:'#0a3d2e' }}>{radius}km</strong>
              </p>
              {mosques.length>0 && <p style={{ fontSize:11, color:'#999', margin:0 }}>Nearest: <strong style={{ color:'#c8a96e' }}>{formatDist(mosques[0].distance)}</strong> · Tap to see prayer times</p>}
            </div>

            {mosques.length>5 && (
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}>🔍</span>
                <input type="text" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter by name or street…"
                  style={{ width:'100%', paddingLeft:36, paddingRight:12, paddingTop:11, paddingBottom:11, borderRadius:12, border:'1px solid #ede9e2', outline:'none', fontSize:13, boxSizing:'border-box', background:'#fff' }} />
              </div>
            )}

            {filtered.length===0 ? (
              <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f0ede8', padding:'40px 20px', textAlign:'center' }}>
                <p style={{ fontSize:36, margin:'0 0 8px' }}>🕌</p>
                <p style={{ fontSize:14, color:'#555', margin:'0 0 12px' }}>No mosques found in this area</p>
                <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                  {[10,20].map(r=>(
                    <button key={r} onClick={()=>changeRadius(r)}
                      style={{ background:'#0a3d2e', color:'#fff', border:'none', borderRadius:10, padding:'9px 18px', fontSize:13, cursor:'pointer' }}>
                      Expand to {r}km
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {filtered.map((m,i) => <MosqueCard key={m.id} m={m} idx={i} />)}
                <p style={{ fontSize:11, color:'#bbb', textAlign:'center', fontStyle:'italic', margin:'4px 0 0' }}>
                  Mosques from OpenStreetMap · Prayer times powered by Aladhan.com API
                </p>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}