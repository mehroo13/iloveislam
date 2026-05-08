export const metadata = {
  title: 'Islamic Name Finder — Arabic Baby Name Meanings | I Love Islam',
  description: 'Find the meaning of Islamic and Arabic names. Search hundreds of Muslim baby names with meanings and origins. Free name finder.',
}

'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

// ── Online Dataset Fetching ────────────────────────────────────────
// Fetches names from the Hugging Face Muslim Names Dataset (14,585+ names)
const NAMES_DATASET_URL = 'https://huggingface.co/datasets/takiuddinahmed/muslim-names-dataset/raw/main/muslim_names.json';

let cachedNames = null;

async function fetchNamesDataset() {
  if (cachedNames) return cachedNames;
  
  try {
    const response = await fetch(NAMES_DATASET_URL);
    if (!response.ok) throw new Error('Failed to fetch dataset');
    
    const data = await response.json();
    
    // Transform dataset to match component expectations
    cachedNames = data.map(name => ({
      name: name.english_name,
      arabic: name.arabic_name,
      gender: name.gender === 'male' ? 'boy' : name.gender === 'female' ? 'girl' : 'boy',
      meaning: name.meaning,
      origin: 'Arabic',
      category: 'General',
      popular: false,
    }));
    
    return cachedNames;
  } catch (error) {
    console.error('Error fetching dataset:', error);
    return [];
  }
}

// ── Search and Filter Logic ────────────────────────────────────────
function searchNames(query, gender, page = 1, allNames) {
  if (!query.trim() || !allNames.length) return [];
  
  const queryLower = query.toLowerCase();
  
  // Filter by query (name, meaning, or keyword)
  let filtered = allNames.filter(n => {
    const nameMatch = n.name.toLowerCase().includes(queryLower);
    const meaningMatch = n.meaning.toLowerCase().includes(queryLower);
    const arabicMatch = n.arabic.includes(query);
    return nameMatch || meaningMatch || arabicMatch;
  });
  
  // Filter by gender
  if (gender !== 'all') {
    filtered = filtered.filter(n => n.gender === gender);
  }
  
  // Pagination: 12 names per page
  const pageSize = 12;
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  
  return filtered.slice(startIdx, endIdx);
}

// ── Main component ─────────────────────────────────────────────────────────
export default function NamesFinder() {
  const [query, setQuery]             = useState('');
  const [gender, setGender]           = useState('all');
  const [results, setResults]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [page, setPage]               = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [expanded, setExpanded]       = useState(null);
  const [saved, setSaved]             = useState([]);
  const [tab, setTab]                 = useState('search');
  const [loadingMore, setLoadingMore] = useState(false);
  const [allNames, setAllNames]       = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [datasetLoaded, setDatasetLoaded] = useState(false);

  // Load dataset on component mount
  useEffect(() => {
    async function loadDataset() {
      const names = await fetchNamesDataset();
      setAllNames(names);
      setDatasetLoaded(true);
      console.log(`Dataset loaded: ${names.length} names`);
    }
    loadDataset();
  }, []);

  async function doSearch(q, g, pg = 1, append = false) {
    if (!q.trim()) return;
    if (!datasetLoaded) {
      setError('Dataset is loading. Please wait a moment and try again.');
      return;
    }
    if (allNames.length === 0) {
      setError('No names loaded. Please refresh the page.');
      return;
    }
    
    if (pg === 1) { 
      setLoading(true); 
      setError(''); 
    } else {
      setLoadingMore(true);
    }

    try {
      // Small delay to ensure smooth UI
      await new Promise(resolve => setTimeout(resolve, 100));

      const names = searchNames(q, g, pg, allNames);
      
      // Calculate total results for this query
      const queryLower = q.toLowerCase();
      const totalFiltered = allNames.filter(n => {
        const nameMatch = n.name.toLowerCase().includes(queryLower);
        const meaningMatch = n.meaning.toLowerCase().includes(queryLower);
        const arabicMatch = n.arabic.includes(q);
        const genderMatch = g === 'all' || n.gender === g;
        return (nameMatch || meaningMatch || arabicMatch) && genderMatch;
      });
      
      setTotalResults(totalFiltered.length);
      
      if (append) {
        setResults(prev => [...prev, ...names]);
      } else { 
        setResults(names); 
        setExpanded(null); 
      }
      setPage(pg);
      setHasSearched(true);
      
      console.log(`Search: "${q}" (${g}) - Found ${totalFiltered.length} total, showing ${names.length} on page ${pg}`);
    } catch (err) {
      setError('Could not search names. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleSearch(q = query, g = gender) {
    if (!q.trim()) {
      setError('Please enter a search term');
      return;
    }
    doSearch(q, g, 1, false);
  }

  function handleGender(g) {
    setGender(g);
    if (hasSearched && query.trim()) {
      doSearch(query, g, 1, false);
    }
  }

  function handleQuickSearch(term) {
    setQuery(term);
    doSearch(term, gender, 1, false);
  }

  function handleLoadMore() {
    doSearch(query, gender, page + 1, true);
  }

  function toggleSave(name) {
    setSaved(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }

  const QUICK_TOPICS = [
    { label: '🕌 Prophets', term: 'prophet' },
    { label: '⭐ Sahaba', term: 'sahaba' },
    { label: '📖 Quranic', term: 'quranic' },
    { label: '🌟 Light', term: 'light' },
    { label: '🦁 Brave', term: 'brave' },
    { label: '🌸 Flowers', term: 'flower' },
    { label: '🌙 Moon', term: 'moon' },
    { label: '💎 Pure', term: 'pure' },
  ];

  function NameCard({ n, idx }) {
    const isExpanded = expanded === `${n.name}-${idx}`;
    const isSaved    = saved.includes(n.name);
    const gc  = n.gender === 'boy' ? '#1e40af' : '#be185d';
    const gb2 = n.gender === 'boy' ? '#dbeafe' : '#fce7f3';
    const gbg = n.gender === 'boy' ? '#eff6ff' : '#fdf2f8';

    return (
      <div
        onClick={() => setExpanded(isExpanded ? null : `${n.name}-${idx}`)}
        style={{
          background: isExpanded ? gbg : '#fff',
          borderRadius: 16,
          border: `1.5px solid ${isExpanded ? gc : '#f0ede8'}`,
          padding: '14px 16px',
          cursor: 'pointer',
          transition: 'all .2s',
        }}
      >
        {/* Summary row */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:46, height:46, borderRadius:'50%',
            background: isExpanded ? gc : gb2,
            color: isExpanded ? '#fff' : gc,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:20, flexShrink:0, fontFamily:'Georgia, serif',
            transition:'all .2s',
          }}>
            {n.arabic?.charAt(0) || '؟'}
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
              <span style={{ fontSize:16, fontWeight:700, color:'#0a3d2e' }}>{n.name}</span>
              <span style={{ fontSize:14, color:'#aaa', fontFamily:'Georgia, serif' }}>{n.arabic}</span>
              {n.popular && <span style={{ fontSize:9, fontWeight:700, background:'#fef3c7', color:'#92400e', borderRadius:20, padding:'2px 7px' }}>★ POPULAR</span>}
            </div>
            <p style={{ fontSize:12, color:'#777', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace: isExpanded ? 'normal' : 'nowrap' }}>
              {n.meaning}
            </p>
          </div>

          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
            <span style={{ fontSize:10, fontWeight:700, borderRadius:20, padding:'3px 10px', background:gb2, color:gc }}>
              {n.gender === 'boy' ? '♂ Boy' : '♀ Girl'}
            </span>
            <span style={{ fontSize:13, color:'#ccc' }}>{isExpanded ? '▲' : '▼'}</span>
          </div>
        </div>

        {/* Expanded */}
        {isExpanded && (
          <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${gb2}` }}>

            <div style={{ background:`linear-gradient(135deg,${gc}18,${gc}08)`, border:`1px solid ${gc}22`, borderRadius:12, padding:'16px', textAlign:'center', marginBottom:12 }}>
              <p style={{ fontSize:46, fontFamily:'Georgia, serif', color:gc, margin:'0 0 4px', lineHeight:1.2 }}>{n.arabic}</p>
              <p style={{ fontSize:12, color:'#999', margin:0 }}>{n.name} — {n.origin} origin</p>
            </div>

            <div style={{ background:'#f9f7f4', borderRadius:10, padding:'12px 14px', marginBottom:12 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#bbb', margin:'0 0 6px', letterSpacing:1 }}>MEANING</p>
              <p style={{ fontSize:14, color:'#333', margin:0, lineHeight:1.7 }}>{n.meaning}</p>
            </div>

            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
              <span style={{ fontSize:11, background:gb2, color:gc, borderRadius:20, padding:'4px 12px', fontWeight:600 }}>{n.gender === 'boy' ? '♂ Boy' : '♀ Girl'}</span>
              <span style={{ fontSize:11, background:'#f0ede8', color:'#666', borderRadius:20, padding:'4px 12px' }}>🌍 {n.origin}</span>
              {n.category && <span style={{ fontSize:11, background:'#ecfdf5', color:'#065f46', borderRadius:20, padding:'4px 12px' }}>🏷️ {n.category}</span>}
              {n.popular && <span style={{ fontSize:11, background:'#fef3c7', color:'#92400e', borderRadius:20, padding:'4px 12px', fontWeight:600 }}>★ Popular</span>}
            </div>

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={e => { e.stopPropagation(); toggleSave(n.name); }}
                style={{ flex:1, border:'none', borderRadius:10, padding:'11px 0', fontSize:13, fontWeight:600, cursor:'pointer', background:isSaved ? gc : '#f0ede8', color:isSaved ? '#fff' : '#0a3d2e', transition:'all .2s' }}>
                {isSaved ? '🔖 Saved' : '🔖 Save Name'}
              </button>
              <button onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(`${n.name} (${n.arabic}) — ${n.meaning}`); }}
                style={{ flex:1, background:'#f0ede8', color:'#0a3d2e', border:'none', borderRadius:10, padding:'11px 0', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                📋 Copy
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const savedCards = results.filter(n => saved.includes(n.name));

  return (
    <div style={{ minHeight:'100vh', background:'#f7f4ef', fontFamily:'Georgia, serif' }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(160deg,#0a3d2e 0%,#1a6b4a 100%)', padding:'20px 16px 24px' }}>
        <div style={{ maxWidth:640, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
            <Link href="/" style={{ color:'rgba(255,255,255,0.6)', fontSize:13, textDecoration:'none' }}>← Back</Link>
            <h1 style={{ color:'#fff', fontSize:18, fontWeight:700, margin:0 }}>📖 Islamic Name Finder</h1>
            <div style={{ width:48 }} />
          </div>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:11, textAlign:'center', margin:'0 0 16px' }}>
            {datasetLoaded ? '14,585+ names · Instant search' : 'Loading names…'}
          </p>

          {/* Search */}
          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            <div style={{ position:'relative', flex:1 }}>
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>🔍</span>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search name, meaning, or topic…"
                disabled={!datasetLoaded}
                style={{ width:'100%', paddingLeft:42, paddingRight:14, paddingTop:13, paddingBottom:13, borderRadius:14, border:'none', outline:'none', fontSize:14, boxSizing:'border-box', opacity: datasetLoaded ? 1 : 0.6 }}
              />
            </div>
            <button onClick={() => handleSearch()} disabled={loading || !query.trim() || !datasetLoaded}
              style={{ background:'#c8a96e', color:'#0a3d2e', border:'none', borderRadius:14, padding:'0 20px', fontSize:13, fontWeight:600, cursor:(loading || !query.trim() || !datasetLoaded)?'not-allowed':'pointer', opacity:(loading || !query.trim() || !datasetLoaded)?0.6:1 }}>
              🔍 Search
            </button>
          </div>

          {/* Gender */}
          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            {[
              { value: 'all', label: '✨ All' },
              { value: 'boy', label: '♂ Boys' },
              { value: 'girl', label: '♀ Girls' }
            ].map(g => (
              <button 
                key={g.value} 
                onClick={() => handleGender(g.value)}
                disabled={!datasetLoaded}
                style={{ 
                  flex:1, 
                  border:'none', 
                  borderRadius:12, 
                  padding:'9px 0', 
                  fontSize:13, 
                  fontWeight:600, 
                  cursor: !datasetLoaded ? 'not-allowed' : 'pointer', 
                  transition:'all .2s',
                  background: gender === g.value 
                    ? (g.value === 'boy' ? '#3b82f6' : g.value === 'girl' ? '#ec4899' : '#c8a96e') 
                    : 'rgba(255,255,255,0.15)',
                  color: gender === g.value 
                    ? (g.value === 'all' ? '#0a3d2e' : '#fff') 
                    : 'rgba(255,255,255,0.7)',
                  opacity: !datasetLoaded ? 0.6 : 1
                }}>
                {g.label}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:8 }}>
            {['search','saved'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex:1, background:tab===t?'rgba(255,255,255,0.2)':'transparent', color:'rgba(255,255,255,0.8)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'8px 0', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                {t==='search' ? '🔍 Search' : `🔖 Saved (${saved.length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main style={{ maxWidth:640, margin:'0 auto', padding:'14px 16px 40px', display:'flex', flexDirection:'column', gap:12 }}>

        {/* SAVED TAB */}
        {tab === 'saved' && (
          savedCards.length === 0 ? (
            <div style={{ background:'linear-gradient(135deg,#0a3d2e,#1a5c3a)', borderRadius:16, padding:'40px 20px', textAlign:'center' }}>
              <p style={{ fontSize:40, margin:'0 0 12px' }}>🔖</p>
              <p style={{ color:'#fff', fontSize:15, fontWeight:700, margin:'0 0 6px' }}>No saved names yet</p>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, margin:0 }}>Search and tap "Save Name" to bookmark names here</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {savedCards.map((n,i) => <NameCard key={`saved-${n.name}-${i}`} n={n} idx={i} />)}
            </div>
          )
        )}

        {/* SEARCH TAB */}
        {tab === 'search' && (
          <>
            {/* Loading dataset */}
            {!datasetLoaded && !hasSearched && (
              <div style={{ textAlign:'center', padding:'52px 0' }}>
                <div style={{ width:40, height:40, border:'3px solid #0a3d2e', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .8s linear infinite', display:'inline-block' }} />
                <p style={{ color:'#999', fontSize:13, marginTop:14 }}>Loading 14,585 Islamic names…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {/* Welcome + Quick Topics */}
            {datasetLoaded && !hasSearched && !loading && (
              <>
                <div style={{ background:'linear-gradient(135deg,#0a3d2e,#1a5c3a)', borderRadius:16, padding:'28px 20px', textAlign:'center' }}>
                  <p style={{ fontSize:44, margin:'0 0 10px' }}>📖</p>
                  <p style={{ color:'#fff', fontSize:15, fontWeight:700, margin:'0 0 6px' }}>14,585+ Islamic Names</p>
                  <p style={{ color:'rgba(255,255,255,0.55)', fontSize:13, margin:'0 0 4px' }}>Search by name, meaning, or topic — in English or Arabic</p>
                  <p style={{ color:'rgba(200,169,110,0.9)', fontSize:12, fontStyle:'italic', margin:0 }}>Instant search · Tap "Load More" for more results</p>
                </div>

                <div style={{ background:'#fff', borderRadius:14, padding:'16px', border:'1px solid #f0ede8' }}>
                  <p style={{ fontSize:11, fontWeight:700, color:'#bbb', margin:'0 0 10px', letterSpacing:1 }}>BROWSE BY TOPIC</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {QUICK_TOPICS.map(t => (
                      <button key={t.term} onClick={() => handleQuickSearch(t.term)}
                        style={{ background:'#f7f4ef', color:'#0a3d2e', border:'1px solid #e8e4df', borderRadius:20, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Loading */}
            {loading && (
              <div style={{ textAlign:'center', padding:'52px 0' }}>
                <div style={{ width:40, height:40, border:'3px solid #0a3d2e', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .8s linear infinite', display:'inline-block' }} />
                <p style={{ color:'#999', fontSize:13, marginTop:14 }}>Searching Islamic names…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:14, padding:'14px 16px' }}>
                <p style={{ color:'#dc2626', fontSize:13, fontWeight:600, margin:0 }}>⚠️ {error}</p>
              </div>
            )}

            {/* Results */}
            {!loading && hasSearched && results.length > 0 && (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <p style={{ fontSize:13, color:'#888', margin:0 }}>
                    <strong style={{ color:'#0a3d2e' }}>{results.length}</strong> of <strong style={{ color:'#0a3d2e' }}>{totalResults}</strong> names for "<strong style={{ color:'#0a3d2e' }}>{query}</strong>"
                  </p>
                  <span style={{ fontSize:11, color:'#c8a96e', fontWeight:600 }}>✨ Online dataset</span>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {results.map((n,i) => <NameCard key={`${n.name}-${i}`} n={n} idx={i} />)}
                </div>

                {results.length < totalResults && (
                  <button onClick={handleLoadMore} disabled={loadingMore}
                    style={{ width:'100%', background:'#0a3d2e', color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontSize:14, fontWeight:600, cursor:loadingMore?'not-allowed':'pointer', opacity:loadingMore?0.7:1 }}>
                    {loadingMore ? '⏳ Loading more names…' : '⬇️ Load More Names'}
                  </button>
                )}
              </>
            )}

            {!loading && hasSearched && results.length === 0 && !error && (
              <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f0ede8', padding:'40px 20px', textAlign:'center' }}>
                <p style={{ fontSize:36, margin:'0 0 8px' }}>🔍</p>
                <p style={{ fontSize:14, color:'#555', margin:'0 0 4px' }}>No results found</p>
                <p style={{ fontSize:12, color:'#aaa', margin:0 }}>Try a different keyword or topic</p>
              </div>
            )}
          </>
        )}

        <p style={{ fontSize:11, color:'#bbb', textAlign:'center', fontStyle:'italic', margin:'4px 0 0' }}>
          Online dataset · 14,585+ Islamic names · Full meanings & Arabic script
        </p>
      </main>
    </div>
  );
}
