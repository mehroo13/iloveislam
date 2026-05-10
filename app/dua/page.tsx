'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// Language options
const LANGUAGES = {
  ENGLISH: 'en',
  URDU: 'ur',
  INDONESIAN: 'id',
  // More languages supported by API
};

// Language display names
const LANGUAGE_NAMES = {
  en: 'English',
  ur: 'اردو',
  id: 'Bahasa Indonesia',
};

// API Base URL - dua-dhikr API (authentic Sunnah duas)
const API_BASE_URL = 'https://dua-dhikr-api.vercel.app';

// Categories available in the API
const CATEGORIES = [
  { id: 'all', nameEn: 'All Duas', nameUr: 'تمام دعائیں' },
  { id: 'daily', nameEn: 'Daily Duas', nameUr: 'یومیہ دعائیں' },
  { id: 'morning_evening', nameEn: 'Morning & Evening', nameUr: 'صبح و شام' },
  { id: 'prayer', nameEn: 'Prayer Duas', nameUr: 'نماز کی دعائیں' },
  { id: 'food_drink', nameEn: 'Food & Drink', nameUr: 'کھانے پینے کی دعائیں' },
  { id: 'travel', nameEn: 'Travel Duas', nameUr: 'سفر کی دعائیں' },
  { id: 'sleep', nameEn: 'Sleep Duas', nameUr: 'نیند کی دعائیں' },
  { id: 'quranic', nameEn: 'Quranic Duas', nameUr: 'قرآنی دعائیں' },
  { id: 'repentance', nameEn: 'Repentance', nameUr: 'توبہ' },
  { id: 'family', nameEn: 'Family Duas', nameUr: 'خاندان کی دعائیں' },
  { id: 'health', nameEn: 'Health & Healing', nameUr: 'صحت و شفا' },
  { id: 'protection', nameEn: 'Protection', nameUr: 'حفاظت' },
];

interface Dua {
  id: string;
  title: string;
  arabic: string;
  latin: string;  // Transliteration
  translation: string;
  notes?: string;
  fawaid?: string;  // Benefits/virtues
  source?: string;  // Hadith reference
}

export default function DuaGenerator() {
  const [duas, setDuas] = useState<Dua[]>([]);
  const [filteredDuas, setFilteredDuas] = useState<Dua[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [language, setLanguage] = useState(LANGUAGES.ENGLISH);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyDua, setDailyDua] = useState<Dua | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get daily dua based on day of year
  const getDailyDua = useCallback((duaList: Dua[]) => {
    if (duaList.length === 0) return null;
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return duaList[dayOfYear % duaList.length];
  }, []);

  // Fetch duas from API
  useEffect(() => {
    async function fetchDuas() {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all duas for selected language
        const response = await fetch(`${API_BASE_URL}/${language}`);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && Array.isArray(data)) {
          setDuas(data);
          setFilteredDuas(data);
          
          // Set daily dua
          const daily = getDailyDua(data);
          setDailyDua(daily);
        } else if (data.data && Array.isArray(data.data)) {
          setDuas(data.data);
          setFilteredDuas(data.data);
          const daily = getDailyDua(data.data);
          setDailyDua(daily);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (err) {
        console.error('Error fetching duas:', err);
        setError('Unable to load duas. Please check your connection and try again.');
        
        // Fallback to local duas if API fails
        loadFallbackDuas();
      } finally {
        setLoading(false);
      }
    }
    
    fetchDuas();
  }, [language, getDailyDua]);
  
  // Fallback authentic duas (in case API is unavailable)
  const loadFallbackDuas = () => {
    const fallbackDuas: Dua[] = [
      {
        id: '1',
        title: 'Dua for Anxiety and Stress',
        arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْجُبْنِ وَالْبُخْلِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ',
        latin: 'Allahumma inni a\'oodhu bika minal-hammi wal-hazani, wal-\'ajzi wal-kasali, wal-jubni wal-bukhli, wa dhala\'id-dayni wa ghalabatir-rijal',
        translation: 'O Allah, I seek refuge in You from anxiety and grief, disability and laziness, cowardice and miserliness, the burden of debt, and being overpowered by men.',
        source: 'Sahih al-Bukhari 6369',
        fawaid: 'Protects from major sources of psychological distress and financial worry.',
      },
      {
        id: '2',
        title: 'Dua for Forgiveness',
        arabic: 'رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',
        latin: 'Rabbana zalamna anfusana wa-in lam taghfir lana wa tarhamna lanakoonanna minal khasireen',
        translation: 'Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.',
        source: 'Surah Al-A\'raf 7:23',
      },
      {
        id: '3',
        title: 'Dua for Parents',
        arabic: 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
        latin: 'Rabbirhamhuma kama rabbayani sagheera',
        translation: 'My Lord, have mercy upon them as they brought me up when I was small.',
        source: 'Surah Al-Isra 17:24',
      },
      {
        id: '4',
        title: 'Dua for Increasing Knowledge',
        arabic: 'رَبِّ زِدْنِي عِلْمًا',
        latin: 'Rabbi zidni \'ilma',
        translation: 'My Lord, increase me in knowledge.',
        source: 'Surah Ta-Ha 20:114',
      },
      {
        id: '5',
        title: 'Dua for Patience',
        arabic: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا',
        latin: 'Rabbana afrigh \'alayna sabran',
        translation: 'Our Lord, pour upon us patience.',
        source: 'Surah Al-Baqarah 2:250',
      },
      {
        id: '6',
        title: 'Dua for Good in this Life and Hereafter',
        arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
        latin: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina \'adhaban-nar',
        translation: 'Our Lord, give us in this world good and in the Hereafter good and protect us from the punishment of the Fire.',
        source: 'Surah Al-Baqarah 2:201',
      },
      {
        id: '7',
        title: 'Dua for Protection',
        arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
        latin: 'Bismillahil-ladhi la yadurru ma\'as-mihi shay\'un fil-ardi wa la fis-sama\'i wa huwas-sami\'ul-\'alim',
        translation: 'In the name of Allah with whose name nothing is harmed on earth nor in heaven, and He is the All-Hearing, All-Knowing.',
        source: 'Sunan Abi Dawud 5088',
      },
      {
        id: '8',
        title: 'Dua for Entering Home',
        arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلَجِ وَخَيْرَ الْمَخْرَجِ بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا',
        latin: 'Allahumma inni as\'aluka khayral-mawlaji wa khayral-makhraji, bismillahi walajna, wa bismillahi kharajna, wa \'alallahi rabbina tawakkalna',
        translation: 'O Allah, I ask You for the best of entrance and the best of exit. In the name of Allah we enter, and in the name of Allah we leave, and upon Allah our Lord we place our trust.',
        source: 'Sunan Abi Dawud 5096',
      },
      {
        id: '9',
        title: 'Dua for Leaving Home',
        arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
        latin: 'Bismillahi tawakkaltu \'alallah, la hawla wa la quwwata illa billah',
        translation: 'In the name of Allah, I put my trust in Allah. There is no power and no might except with Allah.',
        source: 'Sunan Abi Dawud 5095',
      },
      {
        id: '10',
        title: 'Dua for Morning & Evening',
        arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        latin: 'Asbahna wa asbahal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la sharika lahu, lahul-mulku wa lahul-hamdu wa huwa \'ala kulli shay\'in qadeer',
        translation: 'We have entered the morning and all dominion this morning belongs to Allah. All praise is for Allah. There is no god but Allah alone, without partner. To Him belongs sovereignty and praise, and He is over all things competent.',
        source: 'Sahih Muslim 2723',
      },
      {
        id: '11',
        title: 'Dua for Travel',
        arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ',
        latin: 'Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrineen, wa inna ila rabbina lamunqaliboon',
        translation: 'Glory be to Him who has subjected this to us, and we could never have done it by ourselves. And indeed, to our Lord we will return.',
        source: 'Surah Az-Zukhruf 43:13-14',
      },
      {
        id: '12',
        title: 'Dua for Entering Mosque',
        arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
        latin: 'Allahummaftah li abwaba rahmatik',
        translation: 'O Allah, open for me the doors of Your mercy.',
        source: 'Sahih Muslim 713',
      },
      {
        id: '13',
        title: 'Dua for Leaving Mosque',
        arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
        latin: 'Allahumma inni as\'aluka min fadlik',
        translation: 'O Allah, I ask You for Your bounty.',
        source: 'Sahih Muslim 713',
      },
      {
        id: '14',
        title: 'Dua for Marriage and Righteous Children',
        arabic: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
        latin: 'Rabbana hab lana min azwajina wa dhurriyyatina qurrata a\'yunin waj\'alna lil-muttaqeena imama',
        translation: 'Our Lord, grant us from among our spouses and offspring comfort to our eyes and make us an example for the righteous.',
        source: 'Surah Al-Furqan 25:74',
      },
      {
        id: '15',
        title: 'Dua for Protection from Hellfire',
        arabic: 'رَبَّنَا اصْرِفْ عَنَّا عَذَابَ جَهَنَّمَ إِنَّ عَذَابَهَا كَانَ غَرَامًا',
        latin: 'Rabbana isrif \'anna \'adhaba jahannama inna \'adhabaha kana gharama',
        translation: 'Our Lord, avert from us the punishment of Hell. Indeed, its punishment is ever adhering.',
        source: 'Surah Al-Furqan 25:65',
      },
    ];
    
    setDuas(fallbackDuas);
    setFilteredDuas(fallbackDuas);
    setDailyDua(getDailyDua(fallbackDuas));
  };

  // Filter duas based on search and category
  useEffect(() => {
    let filtered = [...duas];
    
    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(dua =>
        (dua.title?.toLowerCase() || '').includes(searchLower) ||
        (dua.translation?.toLowerCase() || '').includes(searchLower) ||
        (dua.latin?.toLowerCase() || '').includes(searchLower) ||
        (dua.arabic || '').includes(search)
      );
    }
    
    setFilteredDuas(filtered);
    setCurrentIndex(0);
  }, [search, duas]);

  const nextDua = useCallback(() => {
    if (filteredDuas.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredDuas.length);
  }, [filteredDuas.length]);

  const prevDua = useCallback(() => {
    if (filteredDuas.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredDuas.length) % filteredDuas.length);
  }, [filteredDuas.length]);

  const randomDua = useCallback(() => {
    if (filteredDuas.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredDuas.length);
    setCurrentIndex(randomIndex);
  }, [filteredDuas.length]);

  const goToDailyDua = useCallback(() => {
    if (dailyDua && duas.length > 0) {
      const index = duas.findIndex(d => d.id === dailyDua.id);
      if (index !== -1) {
        // Clear search and filter first
        setSearch('');
        setFilteredDuas(duas);
        setCurrentIndex(index);
      }
    }
  }, [dailyDua, duas]);

  const currentDua = filteredDuas[currentIndex];

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0a3d2e] to-[#1a6b4a] text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <Link href="/" className="text-white/90 hover:text-white flex items-center gap-2 text-sm bg-white/10 px-3 py-1.5 rounded-full transition-all hover:bg-white/20">
            ← Back
          </Link>
          <h1 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <span>🤲</span> Dua Generator
          </h1>
          <div className="flex items-center gap-2">
            {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
              <button
                key={code}
                onClick={() => setLanguage(code as keyof typeof LANGUAGE_NAMES)}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                  language === code 
                    ? 'bg-white text-[#0a3d2e]' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Date & Time */}
        <div className="text-center mb-6">
          <p className="text-lg font-medium text-[#0a3d2e]">{formatDate(currentTime)}</p>
          <p className="text-sm text-gray-500">
            {currentTime.toLocaleTimeString()}
          </p>
        </div>

        {/* Daily Dua Banner */}
        {dailyDua && (
          <button
            onClick={goToDailyDua}
            className="w-full bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">⭐</span>
              <div className="flex-1">
                <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Today's Featured Dua</p>
                <p className="font-medium text-gray-800 group-hover:text-[#0a3d2e] transition">
                  {dailyDua.title || (dailyDua.arabic?.substring(0, 30) + '...')}
                </p>
                {dailyDua.source && (
                  <p className="text-xs text-gray-400 mt-1">📖 {dailyDua.source}</p>
                )}
              </div>
              <span className="text-amber-500 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>
        )}

        {/* Category Pills */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#0a3d2e] text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {language === 'ur' ? cat.nameUr : cat.nameEn}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-6 flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <input
            type="text"
            placeholder="Search duas by keyword, translation, or transliteration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-base placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-red-500 text-xl">
              ✕
            </button>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow">
            <div className="w-12 h-12 border-4 border-[#0a3d2e] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-[#0a3d2e] font-medium">Loading authentic duas from API...</p>
            <p className="text-sm text-gray-400 mt-2">Getting Sunnah duas with proper references</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow border-l-4 border-red-500">
            <p className="text-5xl mb-4">⚠️</p>
            <p className="text-red-600 font-medium">{error}</p>
            <p className="text-gray-500 text-sm mt-2">Using local authentic duas as fallback.</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-[#0a3d2e] text-white rounded-full text-sm"
            >
              Retry
            </button>
          </div>
        ) : filteredDuas.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow">
            <p className="text-6xl mb-4">🤲</p>
            <p className="text-xl font-medium text-gray-700">No duas found</p>
            <p className="text-gray-500 mt-2">Try different search keywords or clear filters</p>
            <button 
              onClick={() => { setSearch(''); setSelectedCategory('all'); }}
              className="mt-4 text-[#0a3d2e] underline text-sm"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {/* Navigation Arrows */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <button
                onClick={prevDua}
                className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
                aria-label="Previous dua"
              >
                ←
              </button>
              <div className="flex gap-2">
                <button
                  onClick={randomDua}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-all"
                >
                  🎲 Random
                </button>
              </div>
              <button
                onClick={nextDua}
                className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
                aria-label="Next dua"
              >
                →
              </button>
            </div>

            {/* Main Dua Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header Bar */}
              <div className="bg-[#0a3d2e] px-6 py-3">
                <div className="flex justify-between items-center text-white text-sm">
                  <span>Dua {currentIndex + 1} of {filteredDuas.length}</span>
                  {currentDua?.source && (
                    <span className="text-white/70 text-xs">📖 {currentDua.source}</span>
                  )}
                </div>
              </div>

              <div className="p-6 md:p-8">
                {/* Title */}
                {currentDua?.title && (
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-[#0a3d2e]">{currentDua.title}</h2>
                  </div>
                )}

                {/* Arabic Text */}
                <div className="bg-emerald-50/30 rounded-2xl p-6 mb-6 text-center">
                  <p className="text-3xl md:text-4xl leading-[3rem] md:leading-[3.5rem] text-[#0a3d2e] font-arabic" dir="rtl">
                    {currentDua?.arabic || 'Loading...'}
                  </p>
                </div>

                {/* Transliteration */}
                {currentDua?.latin && (
                  <div className="mb-6">
                    <p className="text-xs uppercase tracking-wider text-[#0a3d2e]/60 font-semibold mb-2">Transliteration</p>
                    <p className="text-gray-700 italic text-base md:text-lg">{currentDua.latin}</p>
                  </div>
                )}

                {/* Translation */}
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-wider text-[#0a3d2e]/60 font-semibold mb-2">Translation</p>
                  <p className="text-gray-800 text-base md:text-lg leading-relaxed">{currentDua?.translation}</p>
                </div>

                {/* Benefits / Fawaid */}
                {currentDua?.fawaid && (
                  <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-100">
                    <p className="text-xs uppercase tracking-wider text-amber-700 font-semibold mb-2">✨ Benefits & Virtues</p>
                    <p className="text-amber-800 text-sm">{currentDua.fawaid}</p>
                  </div>
                )}

                {/* Notes */}
                {currentDua?.notes && (
                  <div className="text-sm text-gray-500 italic border-t pt-4 mt-2">
                    💡 {currentDua.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={nextDua}
              className="w-full mt-6 bg-gradient-to-r from-[#0a3d2e] to-[#1a6b4a] hover:from-[#1a6b4a] hover:to-[#0a3d2e] transition-all text-white py-4 rounded-2xl font-semibold text-lg active:scale-[0.98] shadow-md"
            >
              Next Dua 🤲
            </button>
          </>
        )}

        {/* Footer Quote */}
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500 leading-relaxed border-t pt-6">
            “And your Lord says, Call upon Me; I will respond to you.” — Quran 40:60
          </p>
          <p className="text-xs text-gray-400 mt-3">
            Duas sourced from authentic Hadith (Sahih al-Bukhari, Sahih Muslim, etc.)
          </p>
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}