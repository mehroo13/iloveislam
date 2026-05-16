// app/halal-travel/page.tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import Link from 'next/link';

const TABS = [
  { id: 'food', label: '🍱 Halal Food' },
  { id: 'mosque', label: '🕌 Mosques' },
  { id: 'hotel', label: '🏨 Hotels' },
  { id: 'prayer', label: '🕐 Prayer Times' },
  { id: 'tips', label: '💡 Travel Tips' },
  { id: 'dua', label: '🤲 Journey Duas' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const TIPS = [
  { icon: '🍱', category: 'Food', title: 'Finding Halal Food', desc: 'Look for official Halal certification logos. When in doubt, ask locals at the nearest mosque for trusted recommendations.' },
  { icon: '🙏', category: 'Prayer', title: 'Praying While Travelling', desc: 'You can combine and shorten prayers (Qasr) when travelling over 80km. On planes, pray sitting if standing is not possible.' },
  { icon: '👗', category: 'Etiquette', title: 'Modest Dress & Local Customs', desc: 'Research modest dress codes before you travel. Cover your head when entering mosques. Learn a basic greeting in the local language.' },
  { icon: '🏥', category: 'Health', title: 'Health & Safety', desc: 'Carry your medications and prescriptions. Get travel insurance that covers medical needs. Save local emergency numbers before you arrive.' },
  { icon: '📿', category: 'Spirituality', title: 'Maintaining Your Ibadah', desc: 'Find the nearest mosque on arrival and try to pray in congregation. Keep a dhikr app handy for duas and remembrance on the road.' },
  { icon: '🌙', category: 'Ramadan', title: 'Travelling in Ramadan', desc: 'Travellers are permitted to break their fast and make it up later. Check local iftar and suhoor times beforehand.' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Food: 'bg-emerald-50 text-emerald-700',
  Prayer: 'bg-blue-50 text-blue-700',
  Etiquette: 'bg-purple-50 text-purple-700',
  Health: 'bg-rose-50 text-rose-700',
  Spirituality: 'bg-amber-50 text-amber-700',
  Ramadan: 'bg-indigo-50 text-indigo-700',
};

const PRAYER_ICONS: Record<string, string> = {
  Fajr: '🌅', Sunrise: '☀️', Dhuhr: '🌤️', Asr: '⛅', Maghrib: '🌇', Isha: '🌙',
};

const DUAS = [
  { arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ', transliteration: 'Subhaanal-ladhee sakhkhara lanaa hadhaa wa maa kunnaa lahu muqrineen.', meaning: 'Dua when beginning a journey', reference: 'Quran 43:13' },
  { arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ فِي سَفَرِي هَذَا الْبِرَّ وَالتَّقْوَى', transliteration: "Allahumma inni as'aluka fi safari hadhal birra wattaqwa.", meaning: 'Dua for righteousness during travel', reference: 'Muslim' },
  { arabic: 'اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ وَالْخَلِيفَةُ فِي الْأَهْلِ', transliteration: 'Allahumma antas-saahibu fis-safar, wal-khaleefatu fil-ahl.', meaning: 'O Allah, You are the Companion in travel and the Guardian of the family', reference: 'Muslim' },
  { arabic: 'رَبِّ أَنزِلْنِي مُنزَلًا مُّبَارَكًا وَأَنتَ خَيْرُ الْمُنزِلِينَ', transliteration: "Rabbi anzilnee munzalan mubaarakan wa anta khayrul munzileen.", meaning: 'Dua upon arriving at a destination', reference: 'Quran 23:29' },
];

/* ── Helper to format time ── */
function formatTime(timeStr: string): string {
  if (!timeStr) return '--:--';
  const [hour, minute] = timeStr.split(':');
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minute} ${ampm}`;
}

/* ── Place type ── */
interface Place {
  id: number;
  name: string;
  lat: number;
  lon: number;
  type?: string; // cuisine, hotel class, etc.
  opening?: string;
  phone?: string;
  website?: string;
  address?: string;
}

export default function HalalTravel() {
  const [activeTab, setActiveTab] = useState<TabId>('food');
  const [city, setCity] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState<'food' | 'mosque' | 'hotel' | ''>('');

  // Prayer times state
  const [prayerCity, setPrayerCity] = useState('');
  const [prayerData, setPrayerData] = useState<any>(null);
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [prayerError, setPrayerError] = useState('');

  // Current location coordinates
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setCity(''); // clear manual input
        setLoading(false);
      },
      () => {
        setError('Location access denied. Please enter a city manually.');
        setLoading(false);
      }
    );
  }, []);

  // Search places via Overpass API
  const searchPlaces = useCallback(async (type: 'food' | 'mosque' | 'hotel') => {
    let lat: number, lon: number;
    if (coords) {
      lat = coords.lat;
      lon = coords.lon;
      // Use reverse geocoding to get city name for display
      try {
        const reverse = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const revData = await reverse.json();
        const fetchedCity = revData.address?.city || revData.address?.town || revData.address?.village || 'Your Location';
        setCity(fetchedCity);
      } catch {}
    } else {
      if (!city.trim()) {
        setError('Please enter a city or use your current location.');
        return;
      }
      // geocode city
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
      const geoData = await geoRes.json();
      if (!geoData.length) {
        setError('City not found. Try another name.');
        setLoading(false);
        return;
      }
      lat = parseFloat(geoData[0].lat);
      lon = parseFloat(geoData[0].lon);
    }

    setLoading(true);
    setError('');
    setResults([]);
    setSearchType(type);

    try {
      let query: string;
      if (type === 'food') {
        query = `[out:json][timeout:30];(node["amenity"="restaurant"]["diet:halal"="yes"](around:5000,${lat},${lon});node["amenity"="fast_food"]["diet:halal"="yes"](around:5000,${lat},${lon});node["cuisine"="halal"](around:5000,${lat},${lon}););out body;`;
      } else if (type === 'mosque') {
        query = `[out:json][timeout:30];(node["amenity"="place_of_worship"]["religion"="muslim"](around:5000,${lat},${lon});way["amenity"="place_of_worship"]["religion"="muslim"](around:5000,${lat},${lon}););out center;`;
      } else { // hotel
        query = `[out:json][timeout:30];(node["tourism"="hotel"](around:5000,${lat},${lon});node["building"="hotel"](around:5000,${lat},${lon});way["tourism"="hotel"](around:5000,${lat},${lon}););out center;`;
      }

      const overpassRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      if (!overpassRes.ok) throw new Error('Overpass API error');
      const overpassData = await overpassRes.json();

      const places: Place[] = (overpassData.elements || [])
        .filter((el: any) => el.lat || el.center?.lat)
        .map((el: any) => ({
          id: el.id,
          name: el.tags?.name || el.tags?.['name:en'] || (type === 'food' ? 'Halal Restaurant' : type === 'mosque' ? 'Mosque' : 'Hotel'),
          lat: el.lat || el.center?.lat,
          lon: el.lon || el.center?.lon,
          cuisine: el.tags?.cuisine || '',
          opening: el.tags?.opening_hours || '',
          phone: el.tags?.phone || el.tags?.['contact:phone'] || '',
          website: el.tags?.website || el.tags?.['contact:website'] || '',
          address: el.tags?.['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}` : '',
        }))
        .slice(0, 20);

      if (places.length === 0) {
        setError(`No ${type === 'food' ? 'halal restaurants' : type === 'mosque' ? 'mosques' : 'hotels'} found in this area.`);
      } else {
        setResults(places);
      }
    } catch (e) {
      setError('Search failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [city, coords]);

  // Open directions
  const openDirections = (lat: number, lon: number, name: string) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${encodeURIComponent(name)}`, '_blank');
  };

  const openMap = (lat: number, lon: number) => {
    window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=17`, '_blank');
  };

  // Fetch prayer times
  const fetchPrayerTimes = async () => {
    if (!prayerCity.trim()) return;
    setPrayerLoading(true);
    setPrayerError('');
    setPrayerData(null);
    try {
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(prayerCity)}&format=json&limit=1`);
      const geoData = await geo.json();
      if (!geoData.length) { setPrayerError('City not found.'); setPrayerLoading(false); return; }
      const { lat, lon } = geoData[0];
      const today = new Date();
      const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      const res = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lon}&method=2`);
      const data = await res.json();
      if (data.code === 200) {
        setPrayerData({ timings: data.data.timings, city: geoData[0].display_name.split(',')[0] });
      } else setPrayerError('Could not fetch prayer times.');
    } catch { setPrayerError('Network error.'); }
    setPrayerLoading(false);
  };

  // Shared classes
  const inputClass = 'flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200';
  const btnClass = 'bg-emerald-800 hover:bg-emerald-700 text-white px-5 rounded-xl text-sm font-semibold active:scale-95 transition-all';
  const cardClass = 'bg-white rounded-2xl shadow-sm border border-gray-100 p-5';

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white font-serif">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white px-5 py-4 shadow-lg sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white/80 hover:text-white text-sm">← Back</Link>
          <h1 className="text-xl font-bold tracking-wide">🌍 Halal Travel</h1>
          <div className="w-6" />
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-[57px] z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 flex overflow-x-auto gap-1 py-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setResults([]);
                setError('');
              }}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
                activeTab === tab.id ? 'bg-emerald-800 text-white shadow' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-12 space-y-5">
        {/* Common search bar for Food, Mosque, Hotel */}
        {(['food', 'mosque', 'hotel'] as const).includes(activeTab) && (
          <div className={cardClass + ' space-y-4'}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchPlaces(activeTab)}
                    placeholder={activeTab === 'food' ? 'City (e.g. Istanbul)' : activeTab === 'mosque' ? 'City or district' : 'City or area'}
                    className="pl-10 w-full border border-gray-200 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <button onClick={() => searchPlaces(activeTab)} className={btnClass}>
                  Search
                </button>
              </div>
              <button onClick={getCurrentLocation} className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                📍 Use My Location
              </button>
            </div>
            {coords && !city && <p className="text-xs text-emerald-600">Using your current location</p>}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Searching {activeTab === 'food' ? 'halal restaurants' : activeTab === 'mosque' ? 'mosques' : 'hotels'}...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>
        )}

        {/* Results */}
        {results.length > 0 && !loading && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Found <strong className="text-emerald-800">{results.length}</strong> {activeTab === 'food' ? 'halal restaurants' : activeTab === 'mosque' ? 'mosques' : 'hotels'}
              </p>
            </div>
            <div className="space-y-3">
              {results.map(place => (
                <div key={place.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:border-emerald-200 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                        {activeTab === 'food' ? '🍱' : activeTab === 'mosque' ? '🕌' : '🏨'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm leading-tight">{place.name}</p>
                        {place.cuisine && <p className="text-xs text-gray-400 mt-0.5 capitalize">{place.cuisine.replace(/_/g, ' ')}</p>}
                        {place.address && <p className="text-xs text-gray-400 mt-0.5">{place.address}</p>}
                        {place.opening && <p className="text-xs text-emerald-600 mt-0.5">🕐 {place.opening}</p>}
                        {place.phone && <p className="text-xs text-gray-500 mt-0.5">📞 {place.phone}</p>}
                        {place.website && (
                          <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block mt-0.5">
                            🌐 {place.website.replace('https://', '').replace('http://', '')}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button onClick={() => openDirections(place.lat, place.lon, place.name)} className="bg-emerald-800 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700 whitespace-nowrap">
                        🧭 Directions
                      </button>
                      <button onClick={() => openMap(place.lat, place.lon)} className="border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 whitespace-nowrap">
                        🗺️ Map
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state tips */}
        {!loading && results.length === 0 && !error && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-semibold text-amber-800 mb-2">💡 Tips</p>
            <ul className="space-y-1.5">
              {(activeTab === 'food' ? [
                'Search for cities with a known Muslim presence',
                'Use the current location button if you’re already there',
                'Look for official Halal certification logos'
              ] : activeTab === 'mosque' ? [
                'Enter a major city name for best results',
                'You can also use your current location',
                'Mosques are often also community centres'
              ] : [
                'Enter a popular tourist destination',
                'Hotels near city centres are more likely to be listed',
                'Use the map link to explore the area'
              ]).map((t, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5"><span>•</span>{t}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Prayer Times Tab */}
        {activeTab === 'prayer' && (
          <>
            <div className={cardClass + ' space-y-4'}>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🕌</span>
                  <input
                    type="text"
                    value={prayerCity}
                    onChange={(e) => setPrayerCity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchPrayerTimes()}
                    placeholder="Enter destination city"
                    className="pl-10 w-full border border-gray-200 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <button onClick={fetchPrayerTimes} className={btnClass}>
                  Get Times
                </button>
              </div>
            </div>

            {prayerLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-gray-500 text-sm">Fetching prayer times...</p>
              </div>
            )}

            {prayerError && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{prayerError}</div>}

            {prayerData && !prayerLoading && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-emerald-800 px-5 py-4 text-center">
                  <p className="text-white/70 text-xs">Prayer times for</p>
                  <p className="text-white font-semibold">📍 {prayerData.city}</p>
                </div>
                {Object.entries(prayerData.timings).map(([key, value]: [string, string]) => {
                  if (!['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(key)) return null;
                  return (
                    <div key={key} className="flex items-center px-5 py-3.5 border-b border-gray-50 last:border-0">
                      <span className="text-xl mr-3">{PRAYER_ICONS[key]}</span>
                      <span className="flex-1 text-sm font-medium text-gray-700">{key}</span>
                      <span className="font-semibold text-gray-800 text-sm">{formatTime(value)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-blue-800 mb-2">✈️ Traveller’s Salah Rules</p>
              <ul className="space-y-1.5 text-xs text-blue-700">
                <li>• Shorten 4‑rakah prayers to 2 (Qasr)</li>
                <li>• Combine Dhuhr & Asr, Maghrib & Isha</li>
                <li>• Valid when travelling ~80 km or more</li>
                <li>• On a plane, pray facing Qibla if possible</li>
              </ul>
            </div>
          </>
        )}

        {/* Travel Tips Tab */}
        {activeTab === 'tips' && (
          <div className="space-y-3">
            {TIPS.map(tip => (
              <div key={tip.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{tip.icon}</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[tip.category]}`}>{tip.category}</span>
                    <h3 className="text-sm font-semibold text-gray-800">{tip.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Duas Tab */}
        {activeTab === 'dua' && (
          <div className="space-y-4">
            <div className="bg-emerald-800 rounded-2xl p-5 text-center text-white shadow-md">
              <p className="text-sm">Recite these duas for a blessed and safe journey</p>
            </div>
            {DUAS.map((dua, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="bg-amber-50 rounded-xl p-4 mb-4">
                  <p className="text-2xl text-gray-800 text-right leading-loose font-arabic" dir="rtl">{dua.arabic}</p>
                </div>
                <p className="text-sm text-gray-500 italic mb-3 leading-relaxed">{dua.transliteration}</p>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-medium text-gray-700">{dua.meaning}</p>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{dua.reference}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}