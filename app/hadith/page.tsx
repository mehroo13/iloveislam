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
  textEn: string;   // English text
  textUr: string;   // Urdu text
  arabic: string;
  grade: string;
}

/* ── Cache: merged hadiths by book (bookSlug → array of HadithResult) ── */
const bookCache: Record<string, HadithResult[]> = {};

async function fetchLanguageHadiths(bookSlug: string, lang: string): Promise<Record<string, { text: string; number: string }>> {
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
      const map: Record<string, { text: string; number: string }> = {};
      (data?.hadiths || []).forEach((h: any) => {
        map[h.hadithnumber] = { text: h.text || '', number: h.hadithnumber };
      });
      return map;
    } catch {
      continue;
    }
  }
  return {};
}

async function fetchMergedHadiths(bookSlug: string): Promise<HadithResult[]> {
  if (bookCache[bookSlug]) return bookCache[bookSlug];

  const [enMap, urMap] = await Promise.all([
    fetchLanguageHadiths(bookSlug, 'eng'),
    fetchLanguageHadiths(bookSlug, 'urd'),
  ]);

  // Combine by hadith number (both should have the same numbers)
  const merged: HadithResult[] = [];
  const allNumbers = new Set([...Object.keys(enMap), ...Object.keys(urMap)]);
  allNumbers.forEach(num => {
    const en = enMap[num];
    const ur = urMap[num];
    if (en || ur) {
      merged.push({
        _id: `${bookSlug}-${num}`,
        bookSlug,
        hadithNumber: num,
        textEn: en?.text || '',
        textUr: ur?.text || '',
        arabic: '', // Arabic not fetched from these editions
        grade: '',  // grade not available in this dataset
      });
    }
  });

  bookCache[bookSlug] = merged;
  return merged;
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
  const [dark, setDark] = useState(false);

  // Load saved
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('saved_hadiths_v3');
        if (raw) setSaved(JSON.parse(raw));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('saved_hadiths_v3', JSON.stringify(saved));
    }
  }, [saved]);

  // The search function now loads both language versions for every book being searched,
  // then searches across both texts. Results are displayed in the currently selected language.
  const search = useCallback(async (q?: string, book?: string) => {
    const term = (q || query).trim().toLowerCase();
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
        const hadiths = await fetchMergedHadiths(slug);
        // Search in both English and Urdu texts (case-insensitive)
        const matches = hadiths.filter(h =>
          (h.textEn || '').toLowerCase().includes(term) ||
          (h.textUr || '').toLowerCase().includes(term)
        );
        allMatches = [...allMatches, ...matches];
        if (allMatches.length >= 30) break;
      }

      setResults(allMatches.slice(0, 30));
    } catch (e) {
      setError('Could not load hadith data. Please check your internet connection and try again.');
    }
    setLoading(false);
    setLoadingMsg('');
  }, [query]);

  const handleSave = (h: HadithResult) => {
    const exists = saved.some(s => s._id === h._id);
    setSaved(exists ? saved.filter(s => s._id !== h._id) : [h, ...saved]);
  };

  const isSaved = (h: HadithResult) => saved.some(s => s._id === h._id);

  const copyHadith = (h: HadithResult) => {
    const text = `${language === 'eng' ? h.textEn : h.textUr}\n— ${getBookLabel(h.bookSlug)}, Hadith #${h.hadithNumber}${h.grade ? ' | ' + h.grade : ''}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(h._id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getBookLabel = (slug: string) =>
    BOOKS.find(b => b.apiName === slug)?.label || 'Hadith Collection';

  // Hadith Card – now shows text based on selected language
  const HadithCard = ({ h }: { h: HadithResult }) => {
    const saved_ = isSaved(h);
    const grade = h.grade || '';
    const displayText = language === 'eng' ? h.textEn : h.textUr;
    return (
      <div style={{ background: dark ? '#1e293b' : '#fff', border: `1px solid ${dark ? '#334155' : '#f1f5f9'}` }} className="rounded-2xl shadow-sm overflow-hidden">
        <div style={{ background: dark ? '#334155' : '#f9fafb' }} className="px-4 py-2.5 flex items-center gap-2 flex-wrap">
          <span className="bg-emerald-900 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
            {getBookLabel(h.bookSlug)}
          </span>
          {h.hadithNumber && (
            <span style={{ background: dark ? '#475569' : '#e5e7eb', color: dark ? '#cbd5e1' : '#6b7280' }} className="text-[10px] px-2 py-0.5 rounded-full">
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
            <button onClick={() => copyHadith(h)} className="text-sm" style={{ color: dark ? '#94a3b8' : '#9ca3af' }}>
              {copiedId === h._id ? '✅' : '📋'}
            </button>
            <button onClick={() => {
              const text = `${displayText}\n\n— ${getBookLabel(h.bookSlug)}, #${h.hadithNumber}\n\niloveislam.life/hadith`;
              if (navigator.share) navigator.share({ title: 'Hadith', text });
              else navigator.clipboard?.writeText(text);
            }} className="text-sm" style={{ color: dark ? '#94a3b8' : '#9ca3af' }}>📤</button>
            <button onClick={() => handleSave(h)} className={`text-lg ${saved_ ? 'text-amber-500' : ''}`} style={{ color: saved_ ? undefined : (dark ? '#475569' : '#d1d5db') }}>
              🔖
            </button>
          </div>
        </div>
        <div className="p-4">
          <p style={{ color: dark ? '#e2e8f0' : '#374151' }} className="text-sm leading-relaxed">{displayText}</p>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: dark ? '#0f172a' : undefined }} className={dark ? '' : 'bg-gradient-to-b from-amber-50/50 to-white font-serif'}>
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
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white/20 backdrop-blur-sm text-white text-xs rounded-full px-3 py-1.5 border border-white/30 focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} className="text-gray-800">
                  {lang.label}
                </option>
              ))}
            </select>
            <button onClick={() => setDark(!dark)} className="text-white/60 hover:text-white text-lg ml-2">{dark ? '☀️' : '🌙'}</button>
          </div>
          <p className="text-white/60 text-xs text-center">
            Search in English or Urdu – results switch instantly
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
                placeholder={language === 'urd' ? 'اردو میں تلاش کریں...' : 'Search hadith... (e.g., faith, prayer)'}
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
              onClick={() => { setSelectedBook(''); if (query.trim()) search(query, ''); }}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                !selectedBook ? 'bg-amber-500 text-white' : 'bg-white/20 text-white/80'
              }`}
            >
              All Books
            </button>
            {BOOKS.map(b => (
              <button
                key={b.id}
                onClick={() => { setSelectedBook(b.apiName); if (query.trim()) search(query, b.apiName); }}
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
                        onClick={() => { setQuery(topic); search(topic); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        style={{ background: dark ? '#1e293b' : '#fffbeb', border: `1px solid ${dark ? '#334155' : '#fde68a'}`, color: dark ? '#fcd34d' : '#92400e' }}
                        className="px-4 py-2 rounded-full text-xs font-medium"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ background: dark ? '#1e293b' : '#fff', border: `1px solid ${dark ? '#334155' : '#f1f5f9'}` }} className="rounded-2xl p-5 shadow-sm">
                  <h3 style={{ color: dark ? '#e2e8f0' : '#1f2937' }} className="text-sm font-bold mb-3">📖 Browse by Book</h3>
                  <p style={{ color: dark ? '#94a3b8' : '#6b7280' }} className="text-xs mb-3">Select a book then search for any topic</p>
                  <div className="space-y-2">
                    {BOOKS.map(b => (
                      <button
                        key={b.id}
                        onClick={() => { setSelectedBook(b.apiName); }}
                        style={{ background: selectedBook === b.apiName ? (dark ? '#064e3b' : '#ecfdf5') : (dark ? '#334155' : '#f9fafb'), border: `1px solid ${selectedBook === b.apiName ? '#059669' : (dark ? '#475569' : '#e5e7eb')}` }}
                        className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all"
                      >
                        <span style={{ color: dark ? '#e2e8f0' : '#374151' }} className="text-sm font-medium">{b.label}</span>
                        {selectedBook === b.apiName && <span className="text-xs text-emerald-600 font-bold">✓ Selected</span>}
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
                      Try different keywords or select a different book.
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
                    onClick={() => { setSaved([]); localStorage.removeItem('saved_hadiths_v3'); }}
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