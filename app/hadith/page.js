export const metadata = {
  title: 'Hadith Search — Search Bukhari Muslim & More | I Love Islam',
  description: 'Search thousands of hadiths from Sahih Bukhari, Sahih Muslim, Abu Dawud, Tirmidhi and more. Free hadith search engine.',
}

'use client';
import { useState } from 'react';
import Link from 'next/link';

const BOOKS = [
  { id: 'bukhari', label: 'Sahih Bukhari', short: 'Bukhari', apiName: 'bukhari' },
  { id: 'muslim', label: 'Sahih Muslim', short: 'Muslim', apiName: 'muslim' },
  { id: 'abu-dawud', label: 'Abu Dawud', short: 'Abu Dawud', apiName: 'abu-dawud' },
  { id: 'tirmidhi', label: 'Tirmidhi', short: 'Tirmidhi', apiName: 'tirmidhi' },
  { id: 'nasai', label: "Sunan an-Nasa'i", short: "Nasa'i", apiName: 'nasai' },
  { id: 'ibn-majah', label: 'Ibn Majah', short: 'Ibn Majah', apiName: 'ibn-majah' },
];

const TOPICS = ['Prayer', 'Fasting', 'Zakat', 'Hajj', 'Kindness', 'Knowledge', 'Family', 'Patience', 'Forgiveness', 'Charity'];

// Cache so we don't re-fetch the same book twice
const bookCache = {};

async function fetchBookHadiths(bookSlug) {
  if (bookCache[bookSlug]) return bookCache[bookSlug];
  // Primary CDN — fawazahmed0/hadith-api hosted on jsDelivr (free, no key, fast)
  const urls = [
    `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${bookSlug}.min.json`,
    `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${bookSlug}.json`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      const data = await res.json();
      const hadiths = data?.hadiths || [];
      bookCache[bookSlug] = hadiths;
      return hadiths;
    } catch { continue; }
  }
  return [];
}

export default function HadithSearch() {
  const [query, setQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(localStorage.getItem('saved_hadiths') || '[]'); } catch { return []; }
    }
    return [];
  });
  const [activeTab, setActiveTab] = useState('search');
  const [searched, setSearched] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  async function search(q = query, book = selectedBook) {
    const term = (q || '').trim();
    if (!term) return;
    setLoading(true);
    setError('');
    setResults(null);
    setSearched(term);

    try {
      const booksToSearch = book ? [book] : BOOKS.map(b => b.apiName);
      let allMatches = [];

      for (const slug of booksToSearch) {
        setLoadingMsg(`Searching ${BOOKS.find(b => b.apiName === slug)?.label || slug}...`);
        const hadiths = await fetchBookHadiths(slug);
        const matches = hadiths.filter(h =>
          (h.text || '').toLowerCase().includes(term.toLowerCase())
        ).map(h => ({
          _id: `${slug}-${h.hadithnumber}`,
          bookSlug: slug,
          hadithNumber: h.hadithnumber,
          text: h.text || '',
          arabic: '',
          grade: h.grades?.[0]?.grade || '',
        }));
        allMatches = [...allMatches, ...matches];
        if (allMatches.length >= 30) break;
      }

      setResults(allMatches.slice(0, 30));
    } catch (e) {
      setError('Could not load hadith data. Please check your internet connection and try again.');
    }

    setLoading(false);
    setLoadingMsg('');
  }

  function saveHadith(h) {
    const uid = h._id;
    const exists = saved.find(s => s._id === uid);
    const updated = exists ? saved.filter(s => s._id !== uid) : [h, ...saved];
    setSaved(updated);
    try { localStorage.setItem('saved_hadiths', JSON.stringify(updated)); } catch {}
  }

  function isSaved(h) { return saved.some(s => s._id === h._id); }

  function copyHadith(h) {
    const text = `${h.text}\n— ${getBookLabel(h.bookSlug)}, Hadith #${h.hadithNumber}${h.grade ? ' | ' + h.grade : ''}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(h._id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function getBookLabel(slug) {
    return BOOKS.find(b => b.apiName === slug)?.label || slug || 'Hadith Collection';
  }

  function HadithCard({ h }) {
    const saved_ = isSaved(h);
    const grade = h.grade || '';
    return (
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0ede8', overflow: 'hidden' }}>
        <div style={{ background: '#f8f5f0', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ background: '#0a3d2e', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
            {getBookLabel(h.bookSlug)}
          </span>
          {h.hadithNumber && (
            <span style={{ fontSize: 11, color: '#888', background: '#ece8e1', padding: '3px 8px', borderRadius: 20 }}>Hadith #{h.hadithNumber}</span>
          )}
          {grade && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
              background: grade.toLowerCase().includes('sahih') ? '#dcfce7' : grade.toLowerCase().includes('hasan') ? '#dbeafe' : '#f3f4f6',
              color: grade.toLowerCase().includes('sahih') ? '#166534' : grade.toLowerCase().includes('hasan') ? '#1d4ed8' : '#6b7280'
            }}>{grade}</span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button onClick={() => copyHadith(h)} title="Copy" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.5 }}>
              {copiedId === h._id ? '✅' : '📋'}
            </button>
            <button onClick={() => saveHadith(h)} title="Bookmark" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: saved_ ? 1 : 0.3, transition: 'opacity .2s' }}>
              🔖
            </button>
          </div>
        </div>
        <div style={{ padding: '14px 16px' }}>
          {h.arabic && (
            <p style={{ textAlign: 'right', fontSize: 20, lineHeight: 1.9, color: '#1a1a1a', borderRight: '3px solid #c8a96e', paddingRight: 12, margin: '0 0 10px', fontFamily: 'serif' }}>
              {h.arabic}
            </p>
          )}
          <p style={{ fontSize: 14, lineHeight: 1.75, color: '#333', margin: 0 }}>{h.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f4ef', fontFamily: 'Georgia, serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #1a6b4a 100%)', padding: '20px 16px 0' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>← Back</Link>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>📚 Hadith Search</h1>
            <div style={{ width: 48 }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center', margin: '0 0 14px' }}>
            Search across Bukhari, Muslim, Abu Dawud & more
          </p>

          {/* Search bar */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="Search hadith... e.g. prayer, kindness"
                style={{ width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 12, paddingBottom: 12, borderRadius: 12, border: 'none', outline: 'none', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <button
              onClick={() => search()}
              disabled={loading || !query.trim()}
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 12, padding: '0 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: (!query.trim() || loading) ? 0.5 : 1 }}
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>

          {/* Book filter pills */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 0 14px' }}>
            <button onClick={() => setSelectedBook('')}
              style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: !selectedBook ? '#c8a96e' : 'rgba(255,255,255,0.15)', color: !selectedBook ? '#0a3d2e' : 'rgba(255,255,255,0.7)' }}>
              All Books
            </button>
            {BOOKS.map(b => (
              <button key={b.id} onClick={() => setSelectedBook(b.apiName)}
                style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: selectedBook === b.apiName ? '#c8a96e' : 'rgba(255,255,255,0.15)', color: selectedBook === b.apiName ? '#0a3d2e' : 'rgba(255,255,255,0.7)' }}>
                {b.short}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 640, margin: '12px auto 0', padding: '0 16px' }}>
        <div style={{ display: 'flex', background: '#fff', borderRadius: 12, border: '1px solid #ede9e2', padding: 4, gap: 4 }}>
          {[
            { id: 'search', label: '🔍 Search' },
            { id: 'saved', label: `🔖 Saved${saved.length > 0 ? ` (${saved.length})` : ''}` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: activeTab === tab.id ? '#0a3d2e' : 'transparent', color: activeTab === tab.id ? '#fff' : '#888', transition: 'all .2s' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '12px 16px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {activeTab === 'search' && (
          <>
            {/* Empty state */}
            {!results && !loading && !error && (
              <>
                <div style={{ background: 'linear-gradient(135deg, #0a3d2e, #1a5c3a)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
                  <p style={{ fontSize: 22, color: 'rgba(255,255,255,0.85)', margin: '0 0 8px', lineHeight: 1.8, fontFamily: 'serif' }}>
                    طَلَبُ الْعِلْمِ فَرِيضَةٌ
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontStyle: 'italic', margin: '0 0 4px' }}>
                    "Seeking knowledge is an obligation upon every Muslim"
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>— Ibn Majah</p>
                </div>

                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0ede8', padding: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0a3d2e', margin: '0 0 10px' }}>Quick Topic Search</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {TOPICS.map(topic => (
                      <button key={topic}
                        onClick={() => { setQuery(topic); search(topic); }}
                        style={{ padding: '6px 14px', background: '#f8f5f0', border: '1px solid #e8e2d8', borderRadius: 20, fontSize: 12, cursor: 'pointer', color: '#444' }}>
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0ede8', padding: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0a3d2e', margin: '0 0 10px' }}>📖 Books Available</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {BOOKS.map(b => (
                      <button key={b.id}
                        onClick={() => { setQuery('faith'); setSelectedBook(b.apiName); search('faith', b.apiName); }}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: '#f8f5f0', borderRadius: 10, border: '1px solid #f0ede8', cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ fontSize: 13, color: '#333' }}>{b.label}</span>
                        <span style={{ fontSize: 12, color: '#999' }}>Browse →</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ width: 36, height: 36, border: '3px solid #0a3d2e', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }} />
                <p style={{ color: '#999', fontSize: 13, marginTop: 12 }}>{loadingMsg || 'Searching hadith collections...'}</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: 20, textAlign: 'center' }}>
                <p style={{ color: '#dc2626', fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>⚠️ Connection Error</p>
                <p style={{ color: '#ef4444', fontSize: 12, margin: '0 0 12px' }}>{error}</p>
                <button onClick={() => search()} style={{ background: '#0a3d2e', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 13, cursor: 'pointer' }}>
                  Try Again
                </button>
              </div>
            )}

            {/* Results */}
            {results && !loading && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 13, color: '#555', margin: 0 }}>
                    <strong style={{ color: '#0a3d2e' }}>{results.length}</strong> result{results.length !== 1 ? 's' : ''} for "<em>{searched}</em>"
                  </p>
                  <button onClick={() => { setResults(null); setError(''); setQuery(''); setSearched(''); }}
                    style={{ fontSize: 12, color: '#c8a96e', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Clear ✕
                  </button>
                </div>

                {results.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0ede8', padding: '40px 20px', textAlign: 'center' }}>
                    <p style={{ fontSize: 32, margin: '0 0 8px' }}>📖</p>
                    <p style={{ fontSize: 14, color: '#555', margin: '0 0 4px' }}>No results found for "{searched}"</p>
                    <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>Try different keywords or select a different book</p>
                  </div>
                ) : (
                  results.map((h, i) => <HadithCard key={h._id || i} h={h} />)
                )}
              </>
            )}
          </>
        )}

        {/* Saved Tab */}
        {activeTab === 'saved' && (
          <>
            {saved.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <p style={{ fontSize: 36, margin: '0 0 8px' }}>🔖</p>
                <p style={{ fontSize: 14, color: '#555', margin: '0 0 4px' }}>No saved hadiths yet</p>
                <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>Tap 🔖 on any hadith to save it here</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 13, color: '#555', margin: 0 }}>{saved.length} saved hadith{saved.length !== 1 ? 's' : ''}</p>
                  <button onClick={() => { setSaved([]); try { localStorage.removeItem('saved_hadiths'); } catch {} }}
                    style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Clear all
                  </button>
                </div>
                {saved.map((h, i) => <HadithCard key={h._id || i} h={h} />)}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}