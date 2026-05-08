export const metadata = {
  title: 'Halal Travel Guide — Plan Your Muslim Journey | I Love Islam',
  description: 'Plan your halal travel with ease. Find halal food, prayer spaces and Muslim friendly destinations worldwide. Free travel guide.',
}

'use client';
import { useState } from 'react';
import Link from 'next/link';

const TIPS = [
  { icon: '🍱', category: 'Food', title: 'Finding Halal Food', desc: 'Look for official Halal certification logos. When in doubt, ask locals at the nearest mosque for trusted recommendations.' },
  { icon: '🙏', category: 'Prayer', title: 'Praying While Travelling', desc: 'You can combine and shorten prayers (Qasr) when travelling over 80km. On planes, pray sitting if standing is not possible.' },
  { icon: '👗', category: 'Etiquette', title: 'Modest Dress & Local Customs', desc: 'Research modest dress codes before you travel. Cover your head when entering mosques. Learn a basic greeting in the local language.' },
  { icon: '🏥', category: 'Health', title: 'Health & Safety', desc: 'Carry your medications and prescriptions. Get travel insurance that covers medical needs. Save local emergency numbers before you arrive.' },
  { icon: '📿', category: 'Spirituality', title: 'Maintaining Your Ibadah', desc: 'Find the nearest mosque on arrival and try to pray in congregation. Keep a dhikr app handy for duas and remembrance on the road.' },
  { icon: '🌙', category: 'Ramadan', title: 'Travelling in Ramadan', desc: 'Travellers are permitted to break their fast and make it up later. Check local iftar and suhoor times beforehand.' },
];

const CATEGORY_COLORS = {
  Food: 'bg-emerald-50 text-emerald-700',
  Prayer: 'bg-blue-50 text-blue-700',
  Etiquette: 'bg-purple-50 text-purple-700',
  Health: 'bg-rose-50 text-rose-700',
  Spirituality: 'bg-amber-50 text-amber-700',
  Ramadan: 'bg-indigo-50 text-indigo-700',
};

const TABS = ['Halal Food', 'Mosques', 'Prayer Times', 'Travel Tips', 'Journey Dua'];

const PRAYERS = [
  { name: 'Fajr', icon: '🌅', key: 'Fajr' },
  { name: 'Sunrise', icon: '☀️', key: 'Sunrise' },
  { name: 'Dhuhr', icon: '🌤️', key: 'Dhuhr' },
  { name: 'Asr', icon: '⛅', key: 'Asr' },
  { name: 'Maghrib', icon: '🌇', key: 'Maghrib' },
  { name: 'Isha', icon: '🌙', key: 'Isha' },
];

const DUAS = [
  { arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ', transliteration: 'Subhaanal-ladhee sakhkhara lanaa hadhaa wa maa kunnaa lahu muqrineen.', meaning: 'Dua when beginning a journey', reference: 'Quran 43:13' },
  { arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ فِي سَفَرِي هَذَا الْبِرَّ وَالتَّقْوَى', transliteration: "Allahumma inni as'aluka fi safari hadhal birra wattaqwa.", meaning: 'Dua for righteousness during travel', reference: 'Muslim' },
  { arabic: 'اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ وَالْخَلِيفَةُ فِي الْأَهْلِ', transliteration: 'Allahumma antas-saahibu fis-safar, wal-khaleefatu fil-ahl.', meaning: 'O Allah, You are the Companion in travel and the Guardian of the family', reference: 'Muslim' },
  { arabic: 'رَبِّ أَنزِلْنِي مُنزَلًا مُّبَارَكًا وَأَنتَ خَيْرُ الْمُنزِلِينَ', transliteration: "Rabbi anzilnee munzalan mubaarakan wa anta khayrul munzileen.", meaning: 'Dua upon arriving at a destination', reference: 'Quran 23:29' },
];

export default function HalalTravel() {
  const [activeTab, setActiveTab] = useState('Halal Food');

  // Food & Mosque search
  const [city, setCity] = useState('');
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchType, setSearchType] = useState('');
  const [cityCoords, setCityCoords] = useState(null);

  // Prayer times
  const [prayerCity, setPrayerCity] = useState('');
  const [prayerData, setPrayerData] = useState(null);
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [prayerError, setPrayerError] = useState('');

  const searchPlaces = async (type) => {
    if (!city.trim()) return;
    setSearchLoading(true);
    setSearchError('');
    setResults([]);
    setSearchType(type);

    try {
      // Step 1: get city coordinates
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
      const geoData = await geoRes.json();
      if (!geoData.length) { setSearchError('City not found. Try another name.'); setSearchLoading(false); return; }

      const { lat, lon } = geoData[0];
      setCityCoords({ lat: parseFloat(lat), lon: parseFloat(lon) });

      // Step 2: search Overpass API for real OSM data
      const query = type === 'food'
        ? `[out:json][timeout:25];(node["amenity"="restaurant"]["diet:halal"="yes"](around:5000,${lat},${lon});node["amenity"="fast_food"]["diet:halal"="yes"](around:5000,${lat},${lon});node["cuisine"="halal"](around:5000,${lat},${lon}););out body;`
        : `[out:json][timeout:25];(node["amenity"="place_of_worship"]["religion"="muslim"](around:5000,${lat},${lon});way["amenity"="place_of_worship"]["religion"="muslim"](around:5000,${lat},${lon}););out center;`;

      const overpassRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const overpassData = await overpassRes.json();

      const places = (overpassData.elements || [])
        .filter(el => el.lat || el.center?.lat)
        .map(el => ({
          id: el.id,
          name: el.tags?.name || el.tags?.['name:en'] || (type === 'food' ? 'Halal Restaurant' : 'Mosque'),
          lat: el.lat || el.center?.lat,
          lon: el.lon || el.center?.lon,
          cuisine: el.tags?.cuisine || '',
          opening: el.tags?.opening_hours || '',
          phone: el.tags?.phone || el.tags?.['contact:phone'] || '',
          website: el.tags?.website || el.tags?.['contact:website'] || '',
        }))
        .slice(0, 20);

      if (places.length === 0) {
        setSearchError(`No ${type === 'food' ? 'halal restaurants' : 'mosques'} found in "${city}". Try a larger city or different spelling.`);
      } else {
        setResults(places);
      }
    } catch (e) {
      setSearchError('Search failed. Please check your connection and try again.');
    }
    setSearchLoading(false);
  };

  const openDirections = (lat, lon, name) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${encodeURIComponent(name)}`, '_blank');
  };

  const openMap = (lat, lon) => {
    window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=17`, '_blank');
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
        setPrayerData({ timings: data.data.timings, city: geoData[0].display_name.split(',')[0] });
      } else setPrayerError('Could not fetch prayer times.');
    } catch { setPrayerError('Network error. Please try again.'); }
    setPrayerLoading(false);
  };

  const formatTime = (t) => {
    if (!t) return '--';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header style={{ background: '#0a3d2e' }} className="px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
        <h1 className="text-white font-medium">🌍 Halal Travel</h1>
      </header>

      <div style={{ background: '#0a3d2e' }} className="px-6 pb-4 text-center">
        <p className="text-white/40 text-sm">Everything you need for a blessed journey</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 flex overflow-x-auto gap-1 py-2">
          {TABS.map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setResults([]); setSearchError(''); }}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
              style={activeTab === tab ? { background: '#0a3d2e' } : {}}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* ── HALAL FOOD ── */}
        {activeTab === 'Halal Food' && (
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Search Halal Restaurants</p>
              <div className="flex gap-2">
                <input type="text" value={city} onChange={e => setCity(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchPlaces('food')}
                  placeholder="Enter city, e.g. Istanbul, London..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400" />
                <button onClick={() => searchPlaces('food')}
                  style={{ background: '#0a3d2e' }}
                  className="text-white px-5 rounded-xl text-sm font-medium hover:opacity-90 active:scale-95 transition-all">
                  Search
                </button>
              </div>
            </div>

            {searchLoading && searchType === 'food' && (
              <div className="text-center py-10">
                <div className="text-4xl animate-pulse mb-2">🍱</div>
                <p className="text-gray-400 text-sm">Finding halal restaurants in {city}...</p>
              </div>
            )}

            {searchError && searchType === 'food' && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-500 mb-4">{searchError}</div>
            )}

            {results.length > 0 && searchType === 'food' && (
              <>
                <p className="text-xs text-gray-400 mb-3">Found <span className="font-semibold text-gray-600">{results.length}</span> halal restaurants in <strong>{city}</strong></p>
                <div className="space-y-2">
                  {results.map(place => (
                    <div key={place.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🍱</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm leading-tight">{place.name}</p>
                            {place.cuisine && <p className="text-xs text-gray-400 mt-0.5 capitalize">{place.cuisine.replace(/_/g, ' ')}</p>}
                            {place.opening && <p className="text-xs text-emerald-600 mt-0.5">🕐 {place.opening}</p>}
                            {place.phone && <p className="text-xs text-gray-400 mt-0.5">📞 {place.phone}</p>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button onClick={() => openDirections(place.lat, place.lon, place.name)}
                            style={{ background: '#0a3d2e' }}
                            className="text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90 whitespace-nowrap">
                            🧭 Directions
                          </button>
                          <button onClick={() => openMap(place.lat, place.lon)}
                            className="border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 whitespace-nowrap">
                            🗺️ View Map
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!searchLoading && results.length === 0 && !searchError && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-xs font-medium text-amber-700 mb-2">💡 Tips for finding Halal food</p>
                <ul className="space-y-1.5">
                  {['Look for the Halal logo or crescent moon on signage', 'Ask locals at the nearest mosque — they always know', 'Vegetarian or seafood options are usually safe fallbacks', 'In Muslim-majority countries, most food is already halal'].map(tip => (
                    <li key={tip} className="text-xs text-amber-600 flex items-start gap-1.5"><span>•</span>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── MOSQUES ── */}
        {activeTab === 'Mosques' && (
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Find Mosques Near You</p>
              <div className="flex gap-2">
                <input type="text" value={city} onChange={e => setCity(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchPlaces('mosque')}
                  placeholder="Enter city or area..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400" />
                <button onClick={() => searchPlaces('mosque')}
                  style={{ background: '#0a3d2e' }}
                  className="text-white px-5 rounded-xl text-sm font-medium hover:opacity-90 active:scale-95 transition-all">
                  Search
                </button>
              </div>
            </div>

            {searchLoading && searchType === 'mosque' && (
              <div className="text-center py-10">
                <div className="text-4xl animate-pulse mb-2">🕌</div>
                <p className="text-gray-400 text-sm">Finding mosques in {city}...</p>
              </div>
            )}

            {searchError && searchType === 'mosque' && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-500 mb-4">{searchError}</div>
            )}

            {results.length > 0 && searchType === 'mosque' && (
              <>
                <p className="text-xs text-gray-400 mb-3">Found <span className="font-semibold text-gray-600">{results.length}</span> mosques in <strong>{city}</strong></p>
                <div className="space-y-2">
                  {results.map(place => (
                    <div key={place.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🕌</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm leading-tight">{place.name}</p>
                            {place.opening && <p className="text-xs text-emerald-600 mt-0.5">🕐 {place.opening}</p>}
                            {place.phone && <p className="text-xs text-gray-400 mt-0.5">📞 {place.phone}</p>}
                            {place.website && (
                              <a href={place.website} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline mt-0.5 block truncate">
                                🌐 {place.website.replace('https://', '').replace('http://', '')}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button onClick={() => openDirections(place.lat, place.lon, place.name)}
                            style={{ background: '#0a3d2e' }}
                            className="text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90 whitespace-nowrap">
                            🧭 Directions
                          </button>
                          <button onClick={() => openMap(place.lat, place.lon)}
                            className="border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 whitespace-nowrap">
                            🗺️ View Map
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!searchLoading && results.length === 0 && !searchError && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-xs font-medium text-emerald-700 mb-2">🕌 Mosque etiquette reminders</p>
                <ul className="space-y-1.5">
                  {['Remove your shoes before entering', 'Dress modestly — cover arms and legs', 'Keep your voice low inside the masjid', 'Women should bring a headscarf', 'Turn your phone to silent'].map(tip => (
                    <li key={tip} className="text-xs text-emerald-600 flex items-start gap-1.5"><span>•</span>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── PRAYER TIMES ── */}
        {activeTab === 'Prayer Times' && (
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Prayer Times for Your Destination</p>
              <div className="flex gap-2">
                <input type="text" value={prayerCity} onChange={e => setPrayerCity(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchPrayerTimes()}
                  placeholder="Enter your destination city..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400" />
                <button onClick={fetchPrayerTimes}
                  style={{ background: '#0a3d2e' }}
                  className="text-white px-5 rounded-xl text-sm font-medium hover:opacity-90 active:scale-95 transition-all">
                  Get Times
                </button>
              </div>
            </div>

            {prayerLoading && (
              <div className="text-center py-10">
                <div className="text-4xl animate-pulse mb-2">🕌</div>
                <p className="text-gray-400 text-sm">Fetching prayer times...</p>
              </div>
            )}

            {prayerError && <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-500 mb-4">{prayerError}</div>}

            {prayerData && !prayerLoading && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
                <div style={{ background: '#0a3d2e' }} className="px-5 py-4 text-center">
                  <p className="text-white/60 text-xs">Prayer times for</p>
                  <p className="text-white font-semibold">📍 {prayerData.city}</p>
                </div>
                {PRAYERS.map((p, i) => (
                  <div key={p.name} className={`flex items-center px-5 py-3.5 ${i < PRAYERS.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <span className="text-xl mr-3">{p.icon}</span>
                    <span className="flex-1 text-sm font-medium text-gray-700">{p.name}</span>
                    <span className="font-semibold text-gray-800 text-sm">{formatTime(prayerData.timings[p.key])}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-xs font-medium text-blue-700 mb-2">✈️ Travelling & Salah rules</p>
              <ul className="space-y-1.5">
                {['You may shorten 4-rakah prayers to 2 (Qasr)', 'You may combine Dhuhr & Asr, or Maghrib & Isha', 'This applies when travelling more than ~80km', 'On a plane, face Qibla if possible, otherwise your intention counts'].map(tip => (
                  <li key={tip} className="text-xs text-blue-600 flex items-start gap-1.5"><span>•</span>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── TRAVEL TIPS ── */}
        {activeTab === 'Travel Tips' && (
          <div className="space-y-3">
            {TIPS.map(tip => (
              <div key={tip.title} className="bg-white border border-gray-100 rounded-2xl p-5">
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

        {/* ── JOURNEY DUA ── */}
        {activeTab === 'Journey Dua' && (
          <div className="space-y-4">
            <div style={{ background: '#0a3d2e' }} className="rounded-2xl p-4 text-center mb-2">
              <p className="text-white/60 text-sm">Recite these duas for a blessed and safe journey</p>
            </div>
            {DUAS.map((dua, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="bg-amber-50 rounded-xl p-4 mb-4">
                  <p className="font-arabic text-2xl text-gray-800 text-right leading-loose" dir="rtl">{dua.arabic}</p>
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