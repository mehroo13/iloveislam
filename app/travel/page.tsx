'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabId = 'food' | 'mosque' | 'hotel' | 'prayer' | 'qibla' | 'tips' | 'dua';

interface Place {
  id: number;
  name: string;
  lat: number;
  lon: number;
  cuisine?: string;
  opening?: string;
  phone?: string;
  website?: string;
  address?: string;
  distance?: number;
  tags?: Record<string, string>;
}

interface SavedPlace extends Place {
  type: 'food' | 'mosque' | 'hotel';
  savedAt: number;
}

interface PrayerData {
  timings: Record<string, string>;
  city: string;
  hijri: string;
  lat: number;
  lon: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'food',   label: 'Halal Food',   icon: '🍱' },
  { id: 'mosque', label: 'Mosques',      icon: '🕌' },
  { id: 'hotel',  label: 'Hotels',       icon: '🏨' },
  { id: 'prayer', label: 'Prayer Times', icon: '🕐' },
  { id: 'qibla',  label: 'Qibla',        icon: '🧭' },
  { id: 'tips',   label: 'Travel Tips',  icon: '💡' },
  { id: 'dua',    label: 'Journey Duas', icon: '🤲' },
];

const TIPS = [
  { icon: '🍱', cat: 'Food',          title: 'Finding Halal Food',         desc: 'Look for official Halal certification logos on restaurants. Ask locals near the mosque for trusted recommendations. Apps like Zabihah and HalalTrip are also helpful.' },
  { icon: '🙏', cat: 'Prayer',        title: 'Praying While Travelling',   desc: 'You can combine and shorten prayers (Qasr) when travelling over 80 km. On planes, ask for a direction of Mecca or pray seated if standing is unsafe.' },
  { icon: '👗', cat: 'Etiquette',     title: 'Modest Dress & Customs',     desc: 'Research local dress codes. Cover your head when entering mosques. Learn "As-salamu alaykum" — it opens many doors.' },
  { icon: '🏥', cat: 'Health',        title: 'Health & Safety',            desc: 'Carry medications and prescriptions. Get travel insurance (Takaful). Save local emergency numbers before you arrive.' },
  { icon: '📿', cat: 'Spirituality',  title: 'Maintaining Your Ibadah',    desc: 'Find the nearest mosque on arrival. Use a dhikr app for duas on the road. Try to pray Fajr in the masjid — it sets a blessed tone for the day.' },
  { icon: '🌙', cat: 'Ramadan',       title: 'Travelling in Ramadan',      desc: 'Travellers may break their fast and make it up later. Check local iftar and suhoor times. Many cities have special Ramadan buffets at Muslim restaurants.' },
  { icon: '🧳', cat: 'Packing',       title: 'Muslim Travel Essentials',   desc: 'Pack a travel prayer mat, pocket Quran, small compass, and halal snacks. Keep digital and physical copies of all travel documents.' },
  { icon: '💬', cat: 'Communication', title: 'Language & Local Phrases',   desc: '"Salam" and "Shukran" go a long way in Muslim-majority countries. Download Google Translate offline for areas with poor connectivity.' },
  { icon: '💰', cat: 'Finance',       title: 'Money & Islamic Finance',    desc: 'Consider Takaful travel insurance. Carry local currency and small bills. Notify your bank before travelling to avoid card blocks.' },
  { icon: '✈️', cat: 'Flights',       title: 'Halal Meals on Flights',     desc: 'Always request a Halal meal (MOML) when booking. Confirm 24–48 hours before departure.' },
];

const DUAS = [
  { arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', transliteration: "Bismillāhi tawakkaltu 'alallāhi wa lā ḥawla wa lā quwwata illā billāh.", meaning: 'Leaving the home', reference: 'Abu Dawud' },
  { arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ', transliteration: 'Subḥānal-ladhī sakhkhara lanā hādhā wa mā kunnā lahu muqrinīn.', meaning: 'When boarding a vehicle', reference: 'Quran 43:13' },
  { arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ فِي سَفَرِي هَٰذَا الْبِرَّ وَالتَّقْوَى', transliteration: "Allāhumma innī as'aluka fī safarī hādhal-birra wat-taqwā.", meaning: 'Dua at the start of a journey', reference: 'Muslim' },
  { arabic: 'اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ وَالْخَلِيفَةُ فِي الْأَهْلِ', transliteration: 'Allāhumma antas-ṣāḥibu fis-safar, wal-khalīfatu fil-ahl.', meaning: 'O Allah, be my Companion in travel and Guardian of my family', reference: 'Muslim' },
  { arabic: 'رَبِّ أَنزِلْنِي مُنزَلًا مُّبَارَكًا وَأَنتَ خَيْرُ الْمُنزِلِينَ', transliteration: "Rabbi anzilnī munzalan mubārakan wa anta khayrul munzilīn.", meaning: 'Dua upon arriving at a destination', reference: 'Quran 23:29' },
  { arabic: 'اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَٰذَا وَاطْوِ عَنَّا بُعْدَهُ', transliteration: "Allāhumma hawwin 'alaynā safaranā hādhā waṭwi 'annā bu'dah.", meaning: 'O Allah, make this journey easy and shorten its distance', reference: 'Muslim' },
];

const PRAYER_ICONS: Record<string, string> = { Fajr: '🌅', Sunrise: '🌤️', Dhuhr: '☀️', Asr: '🌥️', Maghrib: '🌇', Isha: '🌙' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatTime(t: string): string {
  if (!t) return '--:--';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function getQiblaAngle(lat: number, lon: number): number {
  const MECCA_LAT = 21.4225 * (Math.PI / 180);
  const MECCA_LON = 39.8262 * (Math.PI / 180);
  const userLat = lat * (Math.PI / 180);
  const dLon = MECCA_LON - lon * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(MECCA_LAT);
  const x = Math.cos(userLat) * Math.sin(MECCA_LAT) - Math.sin(userLat) * Math.cos(MECCA_LAT) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function saveLS(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function loadLS<T>(k: string, fb: T): T { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } }

// ─── Overpass fetch — tries multiple mirrors, proper timeout ──────────────────
// ─── Overpass fetch — tries multiple mirrors with GET fallback ────────────────
async function overpassFetch(query: string): Promise<any[]> {
  const MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ];
  for (const url of MIRRORS) {
    // Try POST first, then GET (some mirrors prefer one over the other)
    for (const method of ['POST', 'GET'] as const) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 25000);
        const fetchUrl = method === 'GET'
          ? `${url}?data=${encodeURIComponent(query)}`
          : url;
        const res = await fetch(fetchUrl, {
          method,
          ...(method === 'POST' ? {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
          } : {}),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.elements && data.elements.length >= 0) return data.elements;
      } catch { continue; }
    }
  }
  throw new Error('Map servers unavailable. Please try again in a moment.');
}

// ─── Build Overpass queries — simple & fast ───────────────────────────────────
function buildQuery(type: 'food' | 'mosque' | 'hotel', lat: number, lon: number, radius: number): string {
  if (type === 'mosque') {
    // Keep it simple — fewer lines = faster, less likely to timeout
    return `[out:json][timeout:25];
(
  node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
  way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
  node["building"="mosque"](around:${radius},${lat},${lon});
  way["building"="mosque"](around:${radius},${lat},${lon});
);
out body center;`;
  }

  if (type === 'food') {
    return `[out:json][timeout:40];
(
  node["amenity"="restaurant"]["diet:halal"="yes"](around:${radius},${lat},${lon});
  node["amenity"="fast_food"]["diet:halal"="yes"](around:${radius},${lat},${lon});
  node["amenity"="cafe"]["diet:halal"="yes"](around:${radius},${lat},${lon});
  node["cuisine"="halal"](around:${radius},${lat},${lon});
  node["amenity"="restaurant"]["cuisine"="arabic"](around:${radius},${lat},${lon});
  node["amenity"="restaurant"]["cuisine"="turkish"](around:${radius},${lat},${lon});
  node["amenity"="restaurant"]["cuisine"="indian"](around:${radius},${lat},${lon});
  node["amenity"="restaurant"]["cuisine"="pakistani"](around:${radius},${lat},${lon});
  node["amenity"="restaurant"]["cuisine"="lebanese"](around:${radius},${lat},${lon});
  node["amenity"="restaurant"]["cuisine"="persian"](around:${radius},${lat},${lon});
  node["amenity"="restaurant"]["cuisine"="moroccan"](around:${radius},${lat},${lon});
  node["amenity"="restaurant"]["cuisine"="bangladeshi"](around:${radius},${lat},${lon});
  node["amenity"="restaurant"]["cuisine"="malaysian"](around:${radius},${lat},${lon});
  node["amenity"="restaurant"]["cuisine"="indonesian"](around:${radius},${lat},${lon});
  node["amenity"="restaurant"]["cuisine"="middle_eastern"](around:${radius},${lat},${lon});
  node["amenity"="restaurant"]["cuisine"="afghan"](around:${radius},${lat},${lon});
  way["amenity"="restaurant"]["diet:halal"="yes"](around:${radius},${lat},${lon});
  way["amenity"="fast_food"]["diet:halal"="yes"](around:${radius},${lat},${lon});
);
out body center;`;
  }

  // hotel
  return `[out:json][timeout:40];
(
  node["tourism"="hotel"](around:${radius},${lat},${lon});
  node["tourism"="guest_house"](around:${radius},${lat},${lon});
  node["tourism"="hostel"](around:${radius},${lat},${lon});
  node["tourism"="apartment"](around:${radius},${lat},${lon});
  node["tourism"="motel"](around:${radius},${lat},${lon});
  way["tourism"="hotel"](around:${radius},${lat},${lon});
  way["tourism"="guest_house"](around:${radius},${lat},${lon});
);
out body center;`;
}

// ─── Extract lat/lon from element — handles nodes, ways, relations ────────────
function getElementCoords(el: any): { lat: number; lon: number } | null {
  // Node: has direct lat/lon
  if (el.type === 'node' && el.lat != null && el.lon != null) {
    return { lat: el.lat, lon: el.lon };
  }
  // Way/Relation: has center from "out body center"
  if (el.center?.lat != null && el.center?.lon != null) {
    return { lat: el.center.lat, lon: el.center.lon };
  }
  return null;
}

// ─── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(targetTimeStr: string | null) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    if (!targetTimeStr) return;
    const tick = () => {
      const now = new Date();
      const [h, m] = targetTimeStr.split(':').map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const diff = Math.floor((target.getTime() - now.getTime()) / 1000);
      const hh = Math.floor(diff / 3600);
      const mm = Math.floor((diff % 3600) / 60);
      const ss = diff % 60;
      setRemaining(`${hh}h ${String(mm).padStart(2, '0')}m ${String(ss).padStart(2, '0')}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTimeStr]);
  return remaining;
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  green:      '#1a4731',
  greenMid:   '#2d6a4f',
  greenLight: '#40916c',
  greenPale:  '#d8f3dc',
  gold:       '#c8a96e',
  goldLight:  '#fdf3dc',
  cream:      '#faf7f2',
  border:     '#e8dcc8',
  text:       '#1a1208',
  muted:      '#8a7a6a',
  white:      '#ffffff',
  red:        '#dc2626',
};

const S = {
  card: {
    background: C.white,
    borderRadius: 20,
    border: `1px solid ${C.border}`,
    padding: '18px 18px',
    boxShadow: '0 2px 16px rgba(26,71,49,0.07)',
  } as React.CSSProperties,
  input: {
    flex: 1,
    border: `1.5px solid ${C.border}`,
    borderRadius: 12,
    padding: '11px 14px',
    fontSize: 14,
    outline: 'none',
    background: C.cream,
    color: C.text,
    fontFamily: 'Georgia, serif',
  } as React.CSSProperties,
  btnPrimary: {
    background: C.green,
    color: C.white,
    border: 'none',
    borderRadius: 12,
    padding: '11px 20px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    whiteSpace: 'nowrap' as const,
    transition: 'background 0.2s',
  } as React.CSSProperties,
  btnSecondary: {
    background: C.cream,
    color: C.green,
    border: `1.5px solid ${C.border}`,
    borderRadius: 12,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
};

// ─── Place Card ───────────────────────────────────────────────────────────────
function PlaceCard({ place, type, saved, onDirections, onSave, onRemove }: {
  place: Place;
  type: 'food' | 'mosque' | 'hotel';
  saved: boolean;
  onDirections: () => void;
  onSave: () => void;
  onRemove: () => void;
}) {
  const icons = { food: '🍱', mosque: '🕌', hotel: '🏨' };
  const distStr = place.distance !== undefined
    ? place.distance < 1 ? `${Math.round(place.distance * 1000)}m` : `${place.distance.toFixed(1)}km`
    : null;
  const isVeryClose = place.distance !== undefined && place.distance < 0.5;
  const isClose     = place.distance !== undefined && place.distance < 2;

  return (
    <div style={{ background: C.white, borderRadius: 16, border: `1.5px solid ${isVeryClose ? C.greenLight : C.border}`, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', boxShadow: isVeryClose ? '0 2px 12px rgba(64,145,108,0.15)' : '0 1px 6px rgba(26,71,49,0.05)' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: isVeryClose ? C.greenPale : '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
        {icons[type]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 3 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: 0, fontFamily: 'Georgia, serif', flex: 1, lineHeight: 1.3 }}>{place.name}</p>
          {distStr && (
            <span style={{ flexShrink: 0, background: isVeryClose ? C.green : isClose ? C.greenMid : '#6b7280', color: '#fff', fontSize: 12, fontWeight: 800, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>
              {isVeryClose ? '📍 ' : ''}{distStr}
            </span>
          )}
        </div>
        {place.distance !== undefined && (
          <p style={{ fontSize: 11, color: isVeryClose ? C.greenLight : C.muted, margin: '0 0 3px', fontStyle: 'italic' }}>
            {place.distance < 0.1 ? '🚶 Less than 2 min walk'
              : place.distance < 0.5 ? `🚶 ~${Math.round(place.distance * 1000 / 80)} min walk`
              : place.distance < 2 ? `🚗 ~${Math.round(place.distance / 0.5)} min drive`
              : `🚗 ~${Math.round(place.distance / 0.8)} min drive`}
          </p>
        )}
        {place.cuisine && <p style={{ fontSize: 11, color: C.muted, margin: '0 0 2px', textTransform: 'capitalize' }}>{place.cuisine.replace(/_/g, ' ')}</p>}
        {place.address && <p style={{ fontSize: 11, color: C.muted, margin: '0 0 2px' }}>📍 {place.address}</p>}
        {place.opening && <p style={{ fontSize: 11, color: C.greenLight, margin: '0 0 2px' }}>🕐 {place.opening}</p>}
        {place.phone && <p style={{ fontSize: 11, color: C.muted, margin: '0 0 2px' }}>📞 {place.phone}</p>}
        {place.website && (
          <a href={place.website.startsWith('http') ? place.website : `https://${place.website}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: '#2563eb', textDecoration: 'none', display: 'block', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            🌐 {place.website.replace(/https?:\/\//, '')}
          </a>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button onClick={onDirections} style={{ ...S.btnPrimary, padding: '7px 12px', fontSize: 12 }}>🧭 Go</button>
        <button onClick={saved ? onRemove : onSave}
          style={{ padding: '6px 12px', borderRadius: 10, border: `1.5px solid ${saved ? C.gold : C.border}`, background: saved ? C.goldLight : C.cream, color: saved ? '#92400e' : C.muted, fontSize: 12, cursor: 'pointer' }}>
          {saved ? '🔖' : '🔖 Save'}
        </button>
      </div>
    </div>
  );
}

// ─── Qibla Compass ───────────────────────────────────────────────────────────
function QiblaCompass({ angle, deviceHeading }: { angle: number; deviceHeading: number | null }) {
  const needleAngle = deviceHeading !== null ? angle - deviceHeading : angle;
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto 16px' }}>
        <svg viewBox="0 0 220 220" width="220" height="220" style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle cx="110" cy="110" r="106" fill={C.cream} stroke={C.border} strokeWidth="2" />
          <circle cx="110" cy="110" r="90" fill="none" stroke={C.greenPale} strokeWidth="1" />
          {[
            { label: 'N', x: 110, y: 22 }, { label: 'S', x: 110, y: 202 },
            { label: 'E', x: 198, y: 115 }, { label: 'W', x: 22, y: 115 },
          ].map(d => (
            <text key={d.label} x={d.x} y={d.y} textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="700" fill={d.label === 'N' ? C.red : C.greenMid} fontFamily="Georgia, serif">{d.label}</text>
          ))}
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i * 10 * Math.PI) / 180;
            const isMajor = i % 9 === 0;
            const r1 = isMajor ? 82 : 86;
            return <line key={i} x1={110 + r1 * Math.sin(a)} y1={110 - r1 * Math.cos(a)} x2={110 + 92 * Math.sin(a)} y2={110 - 92 * Math.cos(a)} stroke={C.border} strokeWidth={isMajor ? 2 : 1} />;
          })}
          <circle cx="110" cy="110" r="8" fill={C.green} />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${needleAngle}deg)`, width: 4, height: 180, transformOrigin: '50% 50%', transition: 'transform 0.4s ease', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', bottom: '50%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: `80px solid ${C.gold}` }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `70px solid ${C.border}` }} />
        </div>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 14 }}>🕋</div>
      </div>
      <p style={{ fontSize: 26, fontWeight: 800, color: C.green, fontFamily: 'Georgia, serif', margin: '0 0 4px' }}>{Math.round(angle)}°</p>
      <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
        {deviceHeading !== null ? 'Compass active — point the golden arrow toward Mecca' : 'Degrees from North toward Mecca'}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HalalTravel() {
  const [activeTab, setActiveTab] = useState<TabId>('food');
  const [city, setCity]           = useState('');
  const [results, setResults]     = useState<Place[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [sortBy, setSortBy]       = useState<'distance' | 'name'>('distance');
  const [filterCuisine, setFilterCuisine] = useState('');

  // ── Store coords in a ref so searchPlaces always sees latest value instantly ──
  // This fixes the race condition where coords state update hadn't committed yet
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);
  const [coordsDisplay, setCoordsDisplay] = useState<{ lat: number; lon: number } | null>(null);

  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [locating, setLocating]       = useState(false);
  const [searchRadius, setSearchRadius] = useState<number | null>(null);
  const [usingGPS, setUsingGPS]         = useState(false);

  // Prayer
  const [prayerCity, setPrayerCity]     = useState('');
  const [prayerData, setPrayerData]     = useState<PrayerData | null>(null);
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [prayerError, setPrayerError]   = useState('');
  const [nextPrayer, setNextPrayer]     = useState<{ name: string; time: string } | null>(null);
  const countdown = useCountdown(nextPrayer?.time ?? null);

  // Qibla
  const [qiblaAngle, setQiblaAngle]       = useState<number | null>(null);
  const [qiblaCity, setQiblaCity]         = useState('');
  const [qiblaLoading, setQiblaLoading]   = useState(false);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [compassError, setCompassError]   = useState('');

  useEffect(() => {
    setSavedPlaces(loadLS('halal_travel_saved_v4', []));
  }, []);
  useEffect(() => {
    saveLS('halal_travel_saved_v4', savedPlaces);
  }, [savedPlaces]);

  // ── Core search function — takes coords directly to avoid stale closure ──────
  const doSearch = useCallback(async (
    type: 'food' | 'mosque' | 'hotel',
    lat: number,
    lon: number,
    isGPS: boolean,
    cityName: string,
    cuisine: string,
    sort: 'distance' | 'name',
  ) => {
    setLoading(true);
    setError('');
    setResults([]);
    setSearchRadius(null);

    // Auto-expanding radii — mosques start bigger since they can be sparse
    const RADII = type === 'mosque'
      ? [5000, 10000, 20000, 40000]
      : [2000, 5000, 10000, 20000];
    const MIN_RESULTS = 2;

    let elements: any[] = [];
    let usedRadius = RADII[0];
    let fetchSucceeded = false;
    try {
      for (const r of RADII) {
        usedRadius = r;
        try {
          elements = await overpassFetch(buildQuery(type, lat, lon, r));
          fetchSucceeded = true;
          if (elements.length >= MIN_RESULTS) break;
          // Got a valid response but few results — try wider radius
        } catch {
          // This mirror/radius failed — keep trying with next wider radius
          continue;
        }
      }

      if (!fetchSucceeded) {
        throw new Error('Map servers are busy right now. Please wait 30 seconds and try again.');
      }

      const defaultName = type === 'food' ? 'Halal Restaurant' : type === 'mosque' ? 'Mosque' : 'Hotel';

      // Parse elements — handle nodes (lat/lon) + ways/relations (center)
      let places: Place[] = elements
        .map((el: any) => {
          const coords = getElementCoords(el);
          if (!coords) return null;
          return {
            id: el.id,
            name: el.tags?.name || el.tags?.['name:en'] || el.tags?.['name:ar'] || el.tags?.['name:tr'] || el.tags?.['name:ur'] || defaultName,
            lat: coords.lat,
            lon: coords.lon,
            cuisine: el.tags?.cuisine || '',
            opening: el.tags?.opening_hours || '',
            phone: el.tags?.phone || el.tags?.['contact:phone'] || '',
            website: el.tags?.website || el.tags?.['contact:website'] || '',
            address: [el.tags?.['addr:street'], el.tags?.['addr:housenumber']].filter(Boolean).join(' '),
            distance: getDistance(lat, lon, coords.lat, coords.lon),
            tags: el.tags || {},
          } as Place;
        })
        .filter(Boolean) as Place[];

      // Deduplicate by name + approximate position
      const seen = new Set<string>();
      places = places.filter(p => {
        const key = `${p.name.toLowerCase().trim()}-${Math.round(p.lat * 1000)}-${Math.round(p.lon * 1000)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Cuisine filter (food only)
      if (type === 'food' && cuisine.trim()) {
        places = places.filter(p =>
          p.cuisine?.toLowerCase().includes(cuisine.toLowerCase()) ||
          p.name.toLowerCase().includes(cuisine.toLowerCase())
        );
      }

      // Sort
      places.sort((a, b) =>
        sort === 'name'
          ? a.name.localeCompare(b.name)
          : (a.distance ?? 999) - (b.distance ?? 999)
      );

      setResults(places.slice(0, 50));
      setSearchRadius(usedRadius);

      if (places.length === 0) {
        const label = type === 'food' ? 'halal restaurants' : type === 'mosque' ? 'mosques' : 'hotels';
        const location = isGPS ? 'your location' : cityName;
        setError(`No ${label} found within ${usedRadius / 1000} km of ${location}. OpenStreetMap data may be incomplete for this area. Try Google Maps below.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`${msg} — try again or use Google Maps below.`);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── GPS button — gets location then immediately searches ──────────────────────
  const handleMyLocation = useCallback((type: 'food' | 'mosque' | 'hotel') => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        // Update ref immediately — no waiting for React state
        coordsRef.current = { lat, lon };
        setCoordsDisplay({ lat, lon });
        setUsingGPS(true);
        setLocating(false);

        // Reverse geocode city name (non-blocking)
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
          .then(r => r.json())
          .then(d => {
            const name = d.address?.city || d.address?.town || d.address?.village || d.address?.county || '';
            if (name) setCity(name);
          })
          .catch(() => {});

        // Search immediately with the fresh coords — no stale state issue
        await doSearch(type, lat, lon, true, '', filterCuisine, sortBy);
      },
      err => {
        setLocating(false);
        if (err.code === 1) setError('Location permission denied. Please type a city name instead.');
        else setError('Could not get your location. Please type a city name.');
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }, [doSearch, filterCuisine, sortBy]);

  // ── City search button ────────────────────────────────────────────────────────
  const handleCitySearch = useCallback(async (type: 'food' | 'mosque' | 'hotel') => {
    if (!city.trim()) {
      setError('Please enter a city name or tap "📍 My Location".');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city.trim())}&format=json&limit=1`);
      const gd = await geo.json();
      if (!gd.length) {
        setError('City not found. Try a different spelling or a nearby city.');
        setLoading(false);
        return;
      }
      const lat = parseFloat(gd[0].lat);
      const lon = parseFloat(gd[0].lon);
      coordsRef.current = { lat, lon };
      setCoordsDisplay({ lat, lon });
      setUsingGPS(false);
      setLoading(false);
      await doSearch(type, lat, lon, false, city.trim(), filterCuisine, sortBy);
    } catch {
      setError('Network error while finding your city. Check your connection.');
      setLoading(false);
    }
  }, [city, doSearch, filterCuisine, sortBy]);

  // ── Prayer times ──────────────────────────────────────────────────────────────
  const fetchPrayerTimes = async () => {
    if (!prayerCity.trim()) return;
    setPrayerLoading(true);
    setPrayerError('');
    setPrayerData(null);
    try {
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(prayerCity.trim())}&format=json&limit=1`);
      const gd = await geo.json();
      if (!gd.length) { setPrayerError('City not found.'); setPrayerLoading(false); return; }
      const { lat, lon } = gd[0];
      const today = new Date();
      const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      const [prayerRes, hijriRes] = await Promise.all([
        fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lon}&method=2`),
        fetch(`https://api.aladhan.com/v1/gToH/${dateStr}`),
      ]);
      const pd = await prayerRes.json();
      const hd = await hijriRes.json();
      if (pd.code === 200) {
        const data: PrayerData = {
          timings: pd.data.timings,
          city: gd[0].display_name.split(',')[0],
          hijri: hd.code === 200 ? `${hd.data.hijri.day} ${hd.data.hijri.month.en} ${hd.data.hijri.year} AH` : '',
          lat: parseFloat(lat), lon: parseFloat(lon),
        };
        setPrayerData(data);
        const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        let next = null;
        for (const p of prayers) {
          const t = pd.data.timings[p];
          if (!t) continue;
          const [h, m] = t.split(':').map(Number);
          if (h * 60 + m > nowMin) { next = { name: p, time: t }; break; }
        }
        setNextPrayer(next ?? { name: 'Fajr', time: pd.data.timings['Fajr'] });
      } else {
        setPrayerError('Could not load prayer times. Try a different city.');
      }
    } catch {
      setPrayerError('Network error. Please check your connection.');
    }
    setPrayerLoading(false);
  };

  // ── Qibla ────────────────────────────────────────────────────────────────────
  const fetchQibla = async () => {
    setQiblaLoading(true);
    setQiblaAngle(null);
    try {
      let lat: number, lon: number;
      if (qiblaCity.trim()) {
        const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(qiblaCity.trim())}&format=json&limit=1`);
        const gd = await geo.json();
        if (!gd.length) { setQiblaLoading(false); return; }
        lat = parseFloat(gd[0].lat);
        lon = parseFloat(gd[0].lon);
      } else if (coordsRef.current) {
        lat = coordsRef.current.lat;
        lon = coordsRef.current.lon;
      } else { setQiblaLoading(false); return; }
      setQiblaAngle(getQiblaAngle(lat, lon));
    } catch {}
    setQiblaLoading(false);
  };

  const startCompass = () => {
    if (typeof DeviceOrientationEvent === 'undefined') { setCompassError('Compass not supported on this device.'); return; }
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((state: string) => { if (state === 'granted') listenCompass(); else setCompassError('Compass permission denied.'); })
        .catch(() => setCompassError('Could not request compass permission.'));
    } else { listenCompass(); }
  };
  const listenCompass = () => {
    window.addEventListener('deviceorientation', (e: DeviceOrientationEvent) => {
      const heading = (e as any).webkitCompassHeading ?? (e.alpha ? 360 - e.alpha : null);
      if (heading !== null) setDeviceHeading(heading);
    }, true);
  };

  // ── Save/Remove ───────────────────────────────────────────────────────────────
  const savePlace = (place: Place, type: 'food' | 'mosque' | 'hotel') => {
    setSavedPlaces(prev => {
      if (prev.some(p => p.id === place.id && p.type === type)) return prev;
      return [{ ...place, type, savedAt: Date.now() }, ...prev].slice(0, 60);
    });
  };
  const removePlace = (id: number, type: string) => setSavedPlaces(prev => prev.filter(p => !(p.id === id && p.type === type)));
  const isSaved = (id: number, type: string) => savedPlaces.some(p => p.id === id && p.type === type);
  const openDirections = (lat: number, lon: number) => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank');
  const openGMaps = (q: string) => window.open(`https://www.google.com/maps/search/${encodeURIComponent(q)}`, '_blank');

  const currentTabSavedPlaces = savedPlaces.filter(p => p.type === activeTab as string);
  const isSearchTab = ['food', 'mosque', 'hotel'].includes(activeTab);
  const searchType = activeTab as 'food' | 'mosque' | 'hotel';

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: 'Georgia, serif', color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Scheherazade+New:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #b0a090; }
        input:focus { border-color: #40916c !important; box-shadow: 0 0 0 3px #d8f3dc44; }
        button:active { opacity: 0.85; transform: scale(0.98); }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-thumb { background: #c8a96e55; border-radius: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        .fade-up { animation: fadeUp 0.3s ease; }
      `}</style>

      {/* HEADER */}
      <header style={{ background: `linear-gradient(135deg, ${C.green} 0%, ${C.greenMid} 100%)`, padding: '14px 20px 18px', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 4px 20px rgba(26,71,49,0.25)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none' }}>← Back</Link>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: 0, fontFamily: 'Lora, Georgia, serif' }}>🌍 Halal Travel</h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, margin: '2px 0 0', letterSpacing: 1, textTransform: 'uppercase' }}>Your Muslim Travel Companion</p>
          </div>
          <div style={{ width: 50 }} />
        </div>
      </header>

      {/* TAB BAR */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 60, zIndex: 20, overflowX: 'auto', boxShadow: '0 2px 8px rgba(26,71,49,0.06)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', padding: '8px 12px', gap: 6, minWidth: 'max-content' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setResults([]); setError(''); }}
              style={{ padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', background: activeTab === tab.id ? C.green : 'transparent', color: activeTab === tab.id ? C.white : C.muted, fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 500, fontFamily: 'Georgia, serif', whiteSpace: 'nowrap', transition: 'all 0.2s', boxShadow: activeTab === tab.id ? '0 2px 8px rgba(26,71,49,0.25)' : 'none' }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '18px 14px 60px' }}>

        {/* ════ FOOD / MOSQUE / HOTEL ════ */}
        {isSearchTab && (
          <div className="fade-up">
            <div style={{ ...S.card, marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.green, margin: '0 0 4px', fontFamily: 'Lora, Georgia, serif' }}>
                {activeTab === 'food' ? '🍱 Find Halal Restaurants' : activeTab === 'mosque' ? '🕌 Find Nearby Mosques' : '🏨 Find Hotels'}
              </p>
              <p style={{ fontSize: 11, color: C.muted, margin: '0 0 14px' }}>
                Type a city name and tap Search — or tap 📍 My Location to find places near you right now
              </p>

              {/* GPS button — prominent at top */}
              <button
                onClick={() => handleMyLocation(searchType)}
                disabled={locating}
                style={{ width: '100%', padding: '13px', borderRadius: 14, border: `2px solid ${C.greenLight}`, background: C.greenPale, color: C.green, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
              >
                {locating
                  ? <><span style={{ width: 16, height: 16, border: `2px solid ${C.greenLight}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Finding your location…</>
                  : <>📍 Use My Location — Find Nearest {activeTab === 'food' ? 'Halal Food' : activeTab === 'mosque' ? 'Mosques' : 'Hotels'}</>
                }
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontSize: 11, color: C.muted }}>or search by city</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>

              {/* City input row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input
                  style={S.input}
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCitySearch(searchType)}
                  placeholder={`e.g. ${activeTab === 'food' ? 'Istanbul, London, Dubai' : activeTab === 'mosque' ? 'London, Sydney, New York' : 'Dubai, Istanbul, Kuala Lumpur'}`}
                />
                <button onClick={() => handleCitySearch(searchType)} style={S.btnPrimary} disabled={loading}>
                  🔍 Search
                </button>
              </div>

              {/* Food filters */}
              {activeTab === 'food' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as 'distance' | 'name')}
                    style={{ padding: '7px 10px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.cream, color: C.text, fontSize: 12, fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                    <option value="distance">Nearest first</option>
                    <option value="name">Name A–Z</option>
                  </select>
                  <input
                    style={{ ...S.input, flex: 'none', width: 170, padding: '7px 12px', fontSize: 12 }}
                    type="text"
                    placeholder="Filter cuisine (e.g. Turkish)"
                    value={filterCuisine}
                    onChange={e => setFilterCuisine(e.target.value)}
                  />
                </div>
              )}

              {/* Location status */}
              {coordsDisplay && (
                <p style={{ fontSize: 11, color: C.greenLight, margin: '8px 0 0' }}>
                  ✅ {usingGPS ? '📍 Using your GPS location' : `📍 Showing results near ${city}`}
                </p>
              )}
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16, marginBottom: 10, display: 'flex', gap: 12, animation: 'pulse 1.5s ease infinite' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: C.border, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 14, background: C.border, borderRadius: 6, width: '60%', marginBottom: 8 }} />
                      <div style={{ height: 11, background: '#f0e8d8', borderRadius: 6, width: '40%' }} />
                    </div>
                  </div>
                ))}
                <p style={{ textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 8 }}>
                  Searching the map database… this can take up to 20 seconds
                </p>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
                <p style={{ color: C.red, fontSize: 13, margin: '0 0 10px', lineHeight: 1.6 }}>{error}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => openGMaps(
                      activeTab === 'food' ? `halal food ${city}` :
                      activeTab === 'mosque' ? `mosque near me` : `hotel ${city}`
                    )}
                    style={{ ...S.btnPrimary, background: '#1d4ed8', fontSize: 12, padding: '8px 14px' }}>
                    🗺️ Search on Google Maps
                  </button>
                  <button
                    onClick={() => coordsRef.current
                      ? doSearch(searchType, coordsRef.current.lat, coordsRef.current.lon, usingGPS, city, filterCuisine, sortBy)
                      : handleCitySearch(searchType)
                    }
                    style={{ ...S.btnSecondary, fontSize: 12, padding: '7px 14px' }}>
                    🔄 Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && !loading && (
              <div className="fade-up">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                  <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
                    <strong style={{ color: C.green }}>{results.length}</strong>{' '}
                    {activeTab === 'food' ? 'halal places' : activeTab === 'mosque' ? 'mosques' : 'hotels'} found
                    {searchRadius && <span style={{ color: C.greenLight }}> within {searchRadius >= 1000 ? `${searchRadius / 1000} km` : `${searchRadius}m`}</span>}
                    {usingGPS && <span style={{ color: C.greenLight }}> · GPS sorted by distance</span>}
                  </p>
                  <button
                    onClick={() => openGMaps(
                      activeTab === 'food' ? `halal food ${city}` :
                      activeTab === 'mosque' ? `mosque ${city}` : `hotel ${city}`
                    )}
                    style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    View on Maps
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {results.map(place => (
                    <PlaceCard key={place.id} place={place} type={searchType}
                      saved={isSaved(place.id, activeTab)}
                      onDirections={() => openDirections(place.lat, place.lon)}
                      onSave={() => savePlace(place, searchType)}
                      onRemove={() => removePlace(place.id, activeTab)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Saved places */}
            {currentTabSavedPlaces.length > 0 && (
              <div style={{ ...S.card, marginTop: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.green, margin: '0 0 12px', fontFamily: 'Lora, Georgia, serif' }}>
                  🔖 Saved {activeTab === 'food' ? 'Restaurants' : activeTab === 'mosque' ? 'Mosques' : 'Hotels'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                  {currentTabSavedPlaces.map(p => (
                    <div key={`sv-${p.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: C.cream, borderRadius: 10, border: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 13, color: C.text }}>
                        {activeTab === 'food' ? '🍱' : activeTab === 'mosque' ? '🕌' : '🏨'} {p.name}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openDirections(p.lat, p.lon)} style={{ fontSize: 11, background: C.green, color: C.white, border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>Go</button>
                        <button onClick={() => removePlace(p.id, p.type)} style={{ fontSize: 11, background: 'none', border: 'none', color: C.red, cursor: 'pointer', padding: '4px 6px' }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ PRAYER TIMES ════ */}
        {activeTab === 'prayer' && (
          <div className="fade-up">
            <div style={{ ...S.card, marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.green, margin: '0 0 12px', fontFamily: 'Lora, Georgia, serif' }}>🕐 Daily Prayer Times</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input style={S.input} type="text" value={prayerCity} onChange={e => setPrayerCity(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchPrayerTimes()}
                  placeholder="Enter city (e.g. Mecca, London, Sydney)" />
                <button onClick={fetchPrayerTimes} style={S.btnPrimary}>Get Times</button>
              </div>
            </div>
            {prayerLoading && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 36, height: 36, border: `3px solid ${C.greenPale}`, borderTopColor: C.green, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ color: C.muted, fontSize: 13 }}>Fetching prayer times…</p>
              </div>
            )}
            {prayerError && <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 12, padding: '12px 14px', color: C.red, fontSize: 13 }}>{prayerError}</div>}
            {prayerData && !prayerLoading && (
              <div className="fade-up">
                <div style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenMid})`, borderRadius: '16px 16px 0 0', padding: '18px 20px', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>Prayer Times for</p>
                  <p style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: '0 0 4px', fontFamily: 'Lora, Georgia, serif' }}>📍 {prayerData.city}</p>
                  {prayerData.hijri && <p style={{ color: C.gold, fontSize: 12, margin: 0 }}>{prayerData.hijri}</p>}
                </div>
                {nextPrayer && (
                  <div style={{ background: C.goldLight, border: `1px solid ${C.gold}`, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 11, color: C.muted, margin: '0 0 2px', textTransform: 'uppercase' }}>Next Prayer</p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: C.green, margin: 0, fontFamily: 'Lora, Georgia, serif' }}>{PRAYER_ICONS[nextPrayer.name]} {nextPrayer.name} — {formatTime(nextPrayer.time)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 11, color: C.muted, margin: '0 0 2px' }}>In</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: C.greenMid, margin: 0 }}>{countdown}</p>
                    </div>
                  </div>
                )}
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderTop: 'none', borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
                  {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((name, i) => {
                    const time = prayerData.timings[name];
                    if (!time) return null;
                    const isNext = nextPrayer?.name === name;
                    return (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: i < 5 ? `1px solid ${C.border}` : 'none', background: isNext ? C.greenPale : 'transparent' }}>
                        <span style={{ fontSize: 22, marginRight: 14 }}>{PRAYER_ICONS[name]}</span>
                        <span style={{ flex: 1, fontSize: 14, fontWeight: isNext ? 700 : 500, color: isNext ? C.green : C.text, fontFamily: 'Lora, Georgia, serif' }}>{name}</span>
                        {isNext && <span style={{ fontSize: 11, color: C.greenLight, background: C.greenPale, padding: '2px 8px', borderRadius: 10, border: `1px solid ${C.greenLight}`, marginRight: 10 }}>Next</span>}
                        <span style={{ fontSize: 15, fontWeight: 700, color: isNext ? C.green : C.text }}>{formatTime(time)}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, padding: '14px 16px', background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>🕌</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 2px' }}>Find a mosque for this prayer</p>
                    <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Pray in congregation for 27× the reward</p>
                  </div>
                  <button onClick={() => { setActiveTab('mosque'); setCity(prayerData.city); }} style={{ ...S.btnPrimary, padding: '8px 14px', fontSize: 12 }}>Find →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ QIBLA ════ */}
        {activeTab === 'qibla' && (
          <div className="fade-up">
            <div style={{ ...S.card, marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.green, margin: '0 0 12px', fontFamily: 'Lora, Georgia, serif' }}>🧭 Qibla Direction</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <input style={S.input} type="text" value={qiblaCity} onChange={e => setQiblaCity(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchQibla()}
                  placeholder="City name (or use My Location)" />
                <button onClick={fetchQibla} style={S.btnPrimary} disabled={qiblaLoading}>{qiblaLoading ? '…' : '🧭 Find Qibla'}</button>
                <button onClick={() => { if (coordsRef.current) setQiblaAngle(getQiblaAngle(coordsRef.current.lat, coordsRef.current.lon)); else handleMyLocation('mosque'); }} style={S.btnSecondary}>📍 My Location</button>
              </div>
              <button onClick={startCompass} style={{ width: '100%', padding: '10px 0', borderRadius: 12, border: `1.5px solid ${C.gold}`, background: C.goldLight, color: '#92400e', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                📱 Enable Live Compass
              </button>
              {compassError && <p style={{ fontSize: 12, color: C.red, margin: '8px 0 0' }}>{compassError}</p>}
              {deviceHeading !== null && <p style={{ fontSize: 12, color: C.greenLight, margin: '8px 0 0' }}>✅ Live compass active — Heading: {Math.round(deviceHeading)}°</p>}
            </div>
            {qiblaAngle !== null && (
              <div style={{ ...S.card }} className="fade-up">
                <QiblaCompass angle={qiblaAngle} deviceHeading={deviceHeading} />
                <div style={{ background: C.greenPale, borderRadius: 12, padding: '12px 16px', marginTop: 4, textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: C.green, margin: 0, fontFamily: 'Lora, Georgia, serif' }}>Face <strong>{Math.round(qiblaAngle)}°</strong> from North to face the Kaaba in Mecca</p>
                </div>
              </div>
            )}
            {qiblaAngle === null && !qiblaLoading && (
              <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                <p style={{ fontSize: 48, margin: '0 0 12px' }}>🕋</p>
                <p style={{ fontSize: 14, color: C.muted, fontStyle: 'italic', fontFamily: 'Lora, Georgia, serif' }}>Enter your city or use your location to find the Qibla direction</p>
              </div>
            )}
          </div>
        )}

        {/* ════ TIPS ════ */}
        {activeTab === 'tips' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TIPS.map(tip => (
              <div key={tip.title} style={{ ...S.card }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 24 }}>{tip.icon}</span>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.greenMid, background: C.greenPale, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tip.cat}</span>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '3px 0 0', fontFamily: 'Lora, Georgia, serif' }}>{tip.title}</p>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.75, margin: 0 }}>{tip.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* ════ DUAS ════ */}
        {activeTab === 'dua' && (
          <div className="fade-up">
            <div style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenMid})`, borderRadius: 18, padding: '18px 20px', marginBottom: 14, textAlign: 'center' }}>
              <p style={{ color: C.gold, fontSize: 16, fontWeight: 700, margin: '0 0 4px', fontFamily: 'Lora, Georgia, serif' }}>🤲 Journey Duas</p>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: 0, lineHeight: 1.7 }}>Recite these blessed duas for a safe and enriching journey</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {DUAS.map((dua, i) => (
                <div key={i} style={{ ...S.card }}>
                  <div style={{ background: C.goldLight, borderRadius: 12, padding: '16px 14px', marginBottom: 12, border: `1px solid ${C.border}` }}>
                    <p style={{ fontFamily: "'Scheherazade New', serif", fontSize: 24, color: C.text, textAlign: 'right', direction: 'rtl', margin: 0, lineHeight: 2.2 }}>{dua.arabic}</p>
                  </div>
                  <p style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', margin: '0 0 8px', lineHeight: 1.7 }}>{dua.transliteration}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0, fontFamily: 'Lora, Georgia, serif' }}>{dua.meaning}</p>
                    <span style={{ fontSize: 11, color: C.muted, background: C.cream, padding: '3px 10px', borderRadius: 10, border: `1px solid ${C.border}` }}>{dua.reference}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}