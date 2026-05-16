'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';

/* ── Tabs ── */
const TABS = [
  { id: 'food', label: '🍱 Halal Food' },
  { id: 'mosque', label: '🕌 Mosques' },
  { id: 'hotel', label: '🏨 Hotels' },
  { id: 'prayer', label: '🕐 Prayer Times' },
  { id: 'tips', label: '💡 Travel Tips' },
  { id: 'dua', label: '🤲 Journey Duas' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/* ── Travel Tips ── */
const TIPS = [
  { icon: '🍱', category: 'Food', title: 'Finding Halal Food', desc: 'Look for official Halal certification logos. When in doubt, ask locals at the nearest mosque for trusted recommendations.' },
  { icon: '🙏', category: 'Prayer', title: 'Praying While Travelling', desc: 'You can combine and shorten prayers (Qasr) when travelling over 80km. On planes, pray sitting if standing is not possible.' },
  { icon: '👗', category: 'Etiquette', title: 'Modest Dress & Local Customs', desc: 'Research modest dress codes before you travel. Cover your head when entering mosques. Learn a basic greeting in the local language.' },
  { icon: '🏥', category: 'Health', title: 'Health & Safety', desc: 'Carry your medications and prescriptions. Get travel insurance that covers medical needs. Save local emergency numbers before you arrive.' },
  { icon: '📿', category: 'Spirituality', title: 'Maintaining Your Ibadah', desc: 'Find the nearest mosque on arrival and try to pray in congregation. Keep a dhikr app handy for duas and remembrance on the road.' },
  { icon: '🌙', category: 'Ramadan', title: 'Travelling in Ramadan', desc: 'Travellers are permitted to break their fast and make it up later. Check local iftar and suhoor times beforehand.' },
  { icon: '🧳', category: 'Packing', title: 'Packing Essentials', desc: 'Pack a travel prayer mat, pocket Quran, and a small compass. Keep digital copies of your documents and emergency contacts.' },
  { icon: '💬', category: 'Communication', title: 'Language & Local Phrases', desc: 'Learn basic greetings in Arabic or the local language. "Salam" and "Shukran" go a long way in Muslim-majority countries.' },
  { icon: '💰', category: 'Finance', title: 'Money & Islamic Finance', desc: 'Carry local currency, inform your bank of travel plans, and consider halal travel insurance (Takaful).' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Food: 'bg-emerald-50 text-emerald-700',
  Prayer: 'bg-blue-50 text-blue-700',
  Etiquette: 'bg-purple-50 text-purple-700',
  Health: 'bg-rose-50 text-rose-700',
  Spirituality: 'bg-amber-50 text-amber-700',
  Ramadan: 'bg-indigo-50 text-indigo-700',
  Packing: 'bg-teal-50 text-teal-700',
  Communication: 'bg-orange-50 text-orange-700',
  Finance: 'bg-gray-50 text-gray-700',
};

const PRAYER_ICONS: Record<string, string> = {
  Fajr: '🌅', Sunrise: '☀️', Dhuhr: '🌤️', Asr: '⛅', Maghrib: '🌇', Isha: '🌙',
};

const DUAS = [
  { arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ', transliteration: 'Subhaanal-ladhee sakhkhara lanaa hadhaa wa maa kunnaa lahu muqrineen.', meaning: 'Dua when beginning a journey', reference: 'Quran 43:13' },
  { arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ فِي سَفَرِي هَذَا الْبِرَّ وَالتَّقْوَى', transliteration: "Allahumma inni as'aluka fi safari hadhal birra wattaqwa.", meaning: 'Dua for righteousness during travel', reference: 'Muslim' },
  { arabic: 'اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ وَالْخَلِيفَةُ فِي الْأَهْلِ', transliteration: 'Allahumma antas-saahibu fis-safar, wal-khaleefatu fil-ahl.', meaning: 'O Allah, You are the Companion in travel and the Guardian of the family', reference: 'Muslim' },
  { arabic: 'رَبِّ أَنزِلْنِي مُنزَلًا مُّبَارَكًا وَأَنتَ خَيْرُ الْمُنزِلِينَ', transliteration: "Rabbi anzilnee munzalan mubaarakan wa anta khayrul munzileen.", meaning: 'Dua upon arriving at a destination', reference: 'Quran 23:29' },
  { arabic: 'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا البِرَّ وَالتَّقْوَى وَمِنَ العَمَلِ مَا تَرْضَى', transliteration: 'Allahumma inna nas’aluka fi safarina hadha al-birra wat-taqwa wa minal-‘amali ma tarda.', meaning: 'O Allah, we ask You for righteousness, piety, and deeds that please You', reference: 'Muslim' },
];

/* ── Helper: format time ── */
function formatTime(timeStr: string): string {
  if (!timeStr) return '--:--';
  const [hour, minute] = timeStr.split(':');
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minute} ${ampm}`;
}

/* ── Helper: calculate distance (km) using Haversine ── */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* ── Place type ── */
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
}

/* ── Saved places ── */
interface SavedPlace extends Place {
  type: 'food' | 'mosque' | 'hotel';
  savedAt: number;
}

export default function HalalTravel() {
  const [activeTab, setActiveTab] = useState<TabId>('food');
  const [city, setCity] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState<'food' | 'mosque' | 'hotel' | ''>('');
  const [sortBy, setSortBy] = useState<'distance' | 'name'>('distance');
  const [filterCuisine, setFilterCuisine] = useState('');

  // Prayer times
  const [prayerCity, setPrayerCity] = useState('');
  const [prayerData, setPrayerData] = useState<any>(null);
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [prayerError, setPrayerError] = useState('');

  // Current location
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Saved places (localStorage)
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);

  // Load saved places on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('halal_travel_saved');
      if (saved) setSavedPlaces(JSON.parse(saved));
    }
  }, []);

  // Persist saved places
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('halal_travel_saved', JSON.stringify(savedPlaces));
    }
  }, [savedPlaces]);

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
        setCity('');
        setLoading(false);
      },
      () => {
        setError('Location access denied. Please enter a city manually.');
        setLoading(false);
      }
    );
  }, []);

  const searchPlaces = useCallback(async (type: 'food' | 'mosque' | 'hotel') => {
    let lat: number, lon: number;
    if (coords) {
      lat = coords.lat;
      lon = coords.lon;
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
      } else {
        query = `[out:json][timeout:30];(node["tourism"="hotel"](around:5000,${lat},${lon});node["building"="hotel"](around:5000,${lat},${lon});way["tourism"="hotel"](around:5000,${lat},${lon}););out center;`;
      }

      const overpassRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      if (!overpassRes.ok) throw new Error('Overpass API error');
      const overpassData = await overpassRes.json();

      let places: Place[] = (overpassData.elements || [])
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
        }));

      // Calculate distance if coords available
      if (coords) {
        places = places.map(p => ({ ...p, distance: getDistance(coords.lat, coords.lon, p.lat, p.lon) }));
      } else {
        // Use searched city center as reference
        places = places.map(p => ({ ...p, distance: getDistance(lat, lon, p.lat, p.lon) }));
      }

      // Filter by cuisine if food and filter set
      if (type === 'food' && filterCuisine) {
        places = places.filter(p => p.cuisine?.toLowerCase().includes(filterCuisine.toLowerCase()));
      }

      // Sort
      if (sortBy === 'distance') {
        places.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      } else {
        places.sort((a, b) => a.name.localeCompare(b.name));
      }

      setResults(places.slice(0, 30));
      if (places.length === 0) {
        setError(`No ${type === 'food' ? 'halal restaurants' : type === 'mosque' ? 'mosques' : 'hotels'} found.`);
      }
    } catch (e) {
      setError('Search failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [city, coords, filterCuisine, sortBy]);

  const openDirections = (lat: number, lon: number, name: string) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${encodeURIComponent(name)}`, '_blank');
  };

  const openMap = (lat: number, lon: number) => {
    window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=17`, '_blank');
  };

  const savePlace = (place: Place, type: 'food' | 'mosque' | 'hotel') => {
    setSavedPlaces(prev => {
      const exists = prev.find(p => p.id === place.id && p.type === type);
      if (exists) return prev; // already saved
      return [{ ...place, type, savedAt: Date.now() }, ...prev].slice(0, 50); // max 50
    });
  };

  const removeSavedPlace = (id: number, type: 'food' | 'mosque' | 'hotel') => {
    setSavedPlaces(prev => prev.filter(p => !(p.id === id && p.type === type)));
  };

  const isPlaceSaved = (id: number, type: 'food' | 'mosque' | 'hotel') => {
    return savedPlaces.some(p => p.id === id && p.type === type);
  };

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
        // Also get Hijri date
        const hijriRes = await fetch(`https://api.aladhan.com/v1/gToH/${dateStr}`);
        const hijriData = await hijriRes.json();
        const hijri = hijriData.code === 200 ? hijriData.data.hijri : null;
        setPrayerData({
          timings: data.data.timings,
          city: geoData[0].display_name.split(',')[0],
          hijri: hijri ? `${hijri.day} ${hijri.month.en} ${hijri.year}` : '',
        });
      } else setPrayerError('Could not fetch prayer times.');
    } catch { setPrayerError('Network error.'); }
    setPrayerLoading(false);
  };

  // Next prayer indicator
  const getNextPrayer = (timings: Record<string, string>) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    for (const prayer of prayers) {
      const time = timings[prayer];
      if (!time) continue;
      const [h, m] = time.split(':').map(Number);
      const prayerMinutes = h * 60 + m;
      if (prayerMinutes > currentMinutes) return { name: prayer, time: timings[prayer] };
    }
    return { name: 'Fajr (tomorrow)', time: timings['Fajr'] };
  };

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
        {['food', 'mosque', 'hotel'].includes(activeTab) && (
          <div className={cardClass + ' space-y-4'}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchPlaces(activeTab as 'food' | 'mosque' | 'hotel')}
                    placeholder={activeTab === 'food' ? 'City (e.g. Istanbul)' : activeTab === 'mosque' ? 'City or district' : 'City or area'}
                    className="pl-10 w-full border border-gray-200 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <button onClick={() => searchPlaces(activeTab as 'food' | 'mosque' | 'hotel')} className={btnClass}>
                  Search
                </button>
              </div>
              <button onClick={getCurrentLocation} className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                📍 Use My Location
              </button>
            </div>
            {coords && !city && <p className="text-xs text-emerald-600">Using your current location</p>}

            {/* Sort & Filter (only for food) */}
            {activeTab === 'food' && (
              <div className="flex gap-2 flex-wrap">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'distance' | 'name')}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                >
                  <option value="distance">Sort by distance</option>
                  <option value="name">Sort by name</option>
                </select>
                <input
                  type="text"
                  placeholder="Filter by cuisine (e.g. Turkish, Indian)"
                  value={filterCuisine}
                  onChange={(e) => setFilterCuisine(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white w-48"
                />
                <button
                  onClick={() => searchPlaces('food')}
                  className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
            <p className="text-center text-sm text-gray-400">Searching...</p>
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
              <p className="text-xs text-gray-400">{sortBy === 'distance' ? 'Sorted by distance' : 'Sorted by name'}</p>
            </div>
            <div className="space-y-3">
              {results.map(place => {
                const saved = isPlaceSaved(place.id, activeTab as 'food' | 'mosque' | 'hotel');
                return (
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
                          {place.distance !== undefined && (
                            <p className="text-xs text-gray-400 mt-1">📍 {place.distance.toFixed(1)} km</p>
                          )}
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
                        <button
                          onClick={() => saved ? removeSavedPlace(place.id, activeTab as 'food' | 'mosque' | 'hotel') : savePlace(place, activeTab as 'food' | 'mosque' | 'hotel')}
                          className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap ${saved ? 'bg-amber-100 text-amber-800' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                          {saved ? '🔖 Saved' : '🔖 Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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

        {/* Saved places */}
        {savedPlaces.length > 0 && ['food', 'mosque', 'hotel'].includes(activeTab) && (
          <div className={cardClass}>
            <h3 className="font-semibold text-gray-800 mb-3">🔖 Saved Places</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {savedPlaces
                .filter(p => p.type === activeTab)
                .map(place => (
                  <div key={`saved-${place.id}`} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{place.type === 'food' ? '🍱' : place.type === 'mosque' ? '🕌' : '🏨'}</span>
                      <span className="text-gray-700">{place.name}</span>
                    </span>
                    <button onClick={() => removeSavedPlace(place.id, place.type)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                ))}
            </div>
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
                  {prayerData.hijri && <p className="text-white/60 text-xs mt-1">{prayerData.hijri}</p>}
                </div>
                {(() => {
                  const next = getNextPrayer(prayerData.timings);
                  return (
                    <div className="bg-emerald-50 px-5 py-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-emerald-800">Next: {next.name}</span>
                      <span className="font-bold text-emerald-800">{formatTime(next.time)}</span>
                    </div>
                  );
                })()}
                {Object.entries(prayerData.timings).map(([key, value]: [string, any]) => {
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

        {/* Travel Tips Tab (expanded) */}
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