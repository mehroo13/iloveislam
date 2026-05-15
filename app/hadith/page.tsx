'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/* ── Books & Languages ── */
const BOOKS = [
  { id: 'bukhari', label: 'Sahih Bukhari', short: 'Bukhari', apiName: 'bukhari' },
  { id: 'muslim', label: 'Sahih Muslim', short: 'Muslim', apiName: 'muslim' },
  { id: 'abu-dawud', label: 'Abu Dawud', short: 'Abu Dawud', apiName: 'abu-dawud' },
  { id: 'tirmidhi', label: 'Tirmidhi', short: 'Tirmidhi', apiName: 'tirmidhi' },
  { id: 'nasai', label: "Sunan an-Nasa'i", short: "Nasa'i", apiName: 'nasai' },
  { id: 'ibn-majah', label: 'Ibn Majah', short: 'Ibn Majah', apiName: 'ibn-majah' },
];

const LANGUAGES = [
  { code: 'eng', label: 'English' },
  { code: 'urd', label: 'اردو (Urdu)' },
];

const TOPICS = [
  'Prayer', 'Fasting', 'Zakat', 'Hajj', 'Kindness', 'Knowledge',
  'Family', 'Patience', 'Forgiveness', 'Charity'
];

/* ── Types ── */
interface HadithResult {
  _id: string;
  bookSlug: string;
  hadithNumber: string;
  text: string;
  arabic: string;
  grade: string;
}

/* ── Cache ── */
const bookCache: Record<string, HadithResult[]> = {};

async function fetchBookHadiths(bookSlug: string, lang: string): Promise<HadithResult[]> {
  const cacheKey = `${lang}-${bookSlug}`;
  if (bookCache[cacheKey]) return bookCache[cacheKey];

  // Multiple fallback URLs to ensure reliable delivery
  const urls = [
    `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${lang}-${bookSlug}.min.json`,
    `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${lang}-${bookSlug}.json`,
    `https://raw.githubusercontent.com/fawazahmed0/hadith-api/main/editions/${lang}-${bookSlug}.json`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const data = await res.json();
      const hadiths: HadithResult[] = (data?.hadiths || []).map((h: any) => ({
        _id: `${bookSlug}-${h.hadithnumber}`,
        bookSlug,
        hadithNumber: h.hadithnumber,
        text: h.text || '',
        arabic: '',
        grade: h.grades?.[0]?.grade || '',
      }));
      bookCache[cacheKey] = hadiths;
      return hadiths;
    } catch (err) {
      // Try next URL
      continue;
    }
  }
  // All URLs failed – return empty
  console.error(`Failed to load ${lang}-${bookSlug} from all sources`);
  return [];
}

/* ── Main Component ── */
export default function HadithSearch() {
  const [query, setQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [language, setLanguage] = useState('eng');
  const [results, setResults] = useState<HadithResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<HadithResult[]>([]);
  const [activeTab, setActiveTab] = useState('search');
  const [searched, setSearched] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [langWarning, setLangWarning] = useState('');

  // Load saved
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('saved_hadiths_v2');
        if (raw) setSaved(JSON.parse(raw));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('saved_hadiths_v2', JSON.stringify(saved));
    }
  }, [saved]);

  const search = useCallback(async (q?: string, book?: string) => {
    const term = (q || query).trim();
    if (!term) return;
    setLoading(true);
    setError('');
    setLangWarning('');
    setResults(null);
    setSearched(term);

    try {
      const booksToSearch = book ? [book] : BOOKS.map(b => b.apiName);
      let allMatches: HadithResult[] = [];

      for (const slug of booksToSearch) {
        const bookLabel = BOOKS.find(b => b.apiName === slug)?.label || slug;
        setLoadingMsg(`Searching ${bookLabel}...`);
        const hadiths = await fetchBookHadiths(slug, language);
        // If Urdu edition returned empty, warn once
        if (language === 'urd' && hadiths.length === 0 && !bookCache[`urd-${slug}`]) {
          // Actually we still set cache as empty array, so warn
        }
        const matches = hadiths.filter(h =>
          (h.text || '').toLowerCase().includes(term.toLowerCase())
        );
        allMatches = [...allMatches, ...matches];
        if (allMatches.length >= 30) break;
      }

      if (allMatches.length === 0 && language === 'urd') {
        setLangWarning('Make sure you are searching with Urdu script (e.g., ایمان, نماز). If the problem persists, the Urdu edition may be temporarily unavailable.');
      }

      setResults(allMatches.slice(0, 30));
    } catch (e) {
      setError('Could not load hadith data. Please check your internet connection and try again.');
    }
    setLoading(false);
    setLoadingMsg('');
  }, [query, language, selectedBook]);

  const handleSave = (h: HadithResult) => {
    const exists = saved.some(s => s._id === h._id);
    setSaved(exists ? saved.filter(s => s._id !== h._id) : [h, ...saved]);
  };

  const isSaved = (h: HadithResult) => saved.some(s => s._id === h._id);

  const copyHadith = (h: HadithResult) => {
    const text = `${h.text}\n— ${getBookLabel(h.bookSlug)}, Hadith #${h.hadithNumber}${h.grade ? ' | ' + h.grade : ''}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(h._id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getBookLabel = (slug: string) =>
    BOOKS.find(b => b.apiName === slug)?.label || 'Hadith Collection';

  // Hadith Card (unchanged)
  const HadithCard = ({ h }: { h: HadithResult }) => {
    const saved_ = isSaved(h);
    const grade = h.grade || '';
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2 flex-wrap">
          <span className="bg-emerald-900 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
            {getBookLabel(h.bookSlug)}
          </span>
          {h.hadithNumber && (
            <span className="text-[10px] text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
              #{h.hadithNumber}
            </span>
          )}
          {grade && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                grade.toLowerCase().includes('sahih') ? 'bg-green-100 text-green-700' :
                grade.toLowerCase().includes('hasan') ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}
            >
              {grade}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => copyHadith(h)} className="text-gray-400 hover:text-gray-600 text-sm">
              {copiedId === h._id ? '✅' : '📋'}
            </button>
            <button onClick={() => handleSave(h)} className={`text-lg ${saved_ ? 'text-amber-500' : 'text-gray-300 hover:text-gray-500'}`}>
              🔖
            </button>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-700 leading-relaxed">{h.text}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white font-serif">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white px-4 py-5 shadow-lg">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-white/70 hover:text-white text-sm flex items-center gap-1">
              <span>←</span> Back
            </Link>
            <h1 className="text-xl font-bold">📚 Hadith Search</h1>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setResults(null);
                setLangWarning('');
              }}
              className="bg-white/20 backdrop-blur-sm text-white text-xs rounded-full px-3 py-1.5 border border-white/30 focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} className="text-gray-800">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-white/60 text-xs text-center">
            Search authentic hadiths from Bukhari, Muslim, Abu Dawud & more
          </p>

          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search()}
                placeholder={language === 'urd' ? 'اردو میں تلاش کریں...' : 'Search hadith...'}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-none outline-none text-sm text-gray-800 bg-white shadow-sm"
              />
            </div>
            <button
              onClick={() => search()}
              disabled={loading || !query.trim()}
              className={`px-5 py-3 rounded-xl font-semibold text-sm transition ${
                loading || !query.trim()
                  ? 'bg-white/30 text-white/50 cursor-not-allowed'
                  : 'bg-amber-500 text-white hover:bg-amber-400'
              }`}
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>

          {/* Book filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedBook('')}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                !selectedBook ? 'bg-amber-500 text-white' : 'bg-white/20 text-white/80'
              }`}
            >
              All Books
            </button>
            {BOOKS.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBook(b.apiName)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                  selectedBook === b.apiName ? 'bg-amber-500 text-white' : 'bg-white/20 text-white/80'
                }`}
              >
                {b.short}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 mt-3">
        <div className="flex bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
          {[
            { id: 'search', label: '🔍 Search' },
            { id: 'saved', label: `🔖 Saved${saved.length > 0 ? ` (${saved.length})` : ''}` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-medium ${
                activeTab === tab.id
                  ? 'bg-emerald-900 text-white shadow'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4 pb-12">
        {activeTab === 'search' && (
          <>
            {/* Language warning */}
            {langWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                {langWarning}
              </div>
            )}

            {/* Empty state */}
            {!results && !loading && !error && (
              <>
                <div className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white rounded-2xl p-6 text-center shadow">
                  <p className="text-2xl font-arabic mb-2">طَلَبُ الْعِلْمِ فَرِيضَةٌ</p>
                  <p className="text-white/80 text-sm italic mb-1">
                    "Seeking knowledge is an obligation upon every Muslim"
                  </p>
                  <p className="text-white/50 text-xs">— Ibn Majah</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">Quick Topic Search</h3>
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.map(topic => (
                      <button
                        key={topic}
                        onClick={() => { setQuery(topic); search(topic); }}
                        className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-800 hover:bg-amber-100 font-medium"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">📖 Available Books</h3>
                  <div className="space-y-2">
                    {BOOKS.map(b => (
                      <button
                        key={b.id}
                        onClick={() => { setQuery(language === 'urd' ? 'ایمان' : 'faith'); setSelectedBook(b.apiName); search(language === 'urd' ? 'ایمان' : 'faith', b.apiName); }}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 text-left"
                      >
                        <span className="text-sm font-medium text-gray-700">{b.label}</span>
                        <span className="text-xs text-gray-400">Browse →</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-gray-500 text-sm">{loadingMsg || 'Searching hadith collections...'}</p>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <p className="text-red-600 font-semibold text-sm mb-1">⚠️ Connection Error</p>
                <p className="text-red-500 text-xs mb-3">{error}</p>
                <button onClick={() => search()} className="bg-emerald-900 text-white px-5 py-2 rounded-full text-sm font-semibold">
                  Try Again
                </button>
              </div>
            )}

            {results && !loading && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    <strong className="text-emerald-900">{results.length}</strong> result{results.length !== 1 ? 's' : ''} for "<em>{searched}</em>"
                  </p>
                  <button onClick={() => { setResults(null); setError(''); setQuery(''); setSearched(''); }}
                    className="text-xs text-amber-600 hover:text-amber-800 font-medium">
                    Clear ✕
                  </button>
                </div>

                {results.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
                    <p className="text-4xl mb-3">📖</p>
                    <p className="text-gray-700 font-medium mb-1">No results for "{searched}"</p>
                    <p className="text-gray-400 text-sm">
                      {language === 'urd'
                        ? 'کوشش کریں اردو میں دوبارہ لکھیں (مثلاً: ایمان، نماز)۔ اگر مسئلہ حل نہ ہو تو شاید اردو ایڈیشن دستیاب نہ ہو۔'
                        : 'Try different keywords or select a different book.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.map((h, i) => (
                      <HadithCard key={h._id || i} h={h} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'saved' && (
          <>
            {saved.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-4xl mb-4">🔖</p>
                <p className="text-gray-700 font-medium mb-1">No saved hadiths yet</p>
                <p className="text-gray-400 text-sm">Tap the bookmark icon on any hadith to save it</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{saved.length} saved hadith{saved.length !== 1 ? 's' : ''}</p>
                  <button
                    onClick={() => { setSaved([]); localStorage.removeItem('saved_hadiths_v2'); }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Clear all
                  </button>
                </div>
                <div className="space-y-3">
                  {saved.map((h, i) => (
                    <HadithCard key={h._id || i} h={h} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}