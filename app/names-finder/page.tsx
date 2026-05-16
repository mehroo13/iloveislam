'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Dataset ────────────────────────────────────────────────────────────────
const DATASET_URL =
  'https://huggingface.co/datasets/takiuddinahmed/muslim-names-dataset/raw/main/muslim_names.json';

interface NameEntry {
  name: string;
  arabic: string;
  gender: 'boy' | 'girl';
  meaning: string;
  origin: string;
  category: string;
  popular: boolean;
}

let _cache: NameEntry[] | null = null;

async function loadDataset(): Promise<NameEntry[]> {
  if (_cache) return _cache;
  const res  = await fetch(DATASET_URL);
  if (!res.ok) throw new Error('Dataset fetch failed');
  const raw  = await res.json();
  _cache = (raw as any[]).map((n: any) => ({
    name:     n.english_name   || '',
    arabic:   n.arabic_name    || '',
    gender:   n.gender === 'female' ? 'girl' : 'boy',
    meaning:  n.meaning        || '',
    origin:   'Arabic',
    category: 'General',
    popular:  false,
  }));
  return _cache;
}

// ─── Quick topics ────────────────────────────────────────────────────────────
const TOPICS = [
  { emoji: '🕌', label: 'Prophets',  term: 'prophet'  },
  { emoji: '⭐', label: 'Sahaba',    term: 'sahaba'   },
  { emoji: '📖', label: 'Quranic',   term: 'quranic'  },
  { emoji: '🌟', label: 'Light',     term: 'light'    },
  { emoji: '🦁', label: 'Brave',     term: 'brave'    },
  { emoji: '🌸', label: 'Beauty',    term: 'beautiful' },
  { emoji: '🌙', label: 'Moon',      term: 'moon'     },
  { emoji: '💎', label: 'Pure',      term: 'pure'     },
  { emoji: '🌊', label: 'Ocean',     term: 'ocean'    },
  { emoji: '🕊️', label: 'Peace',    term: 'peace'    },
  { emoji: '🌺', label: 'Flower',    term: 'flower'   },
  { emoji: '☀️', label: 'Sun',      term: 'sun'      },
];

const PAGE_SIZE = 18;

function filterNames(all: NameEntry[], query: string, gender: string): NameEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return all.filter(n => {
    const hit =
      n.name.toLowerCase().includes(q) ||
      n.meaning.toLowerCase().includes(q) ||
      n.arabic.includes(query);
    const gok = gender === 'all' || n.gender === gender;
    return hit && gok;
  });
}

// ─── Colour helpers ──────────────────────────────────────────────────────────
const BOY_COLOR  = '#1d4ed8';
const GIRL_COLOR = '#be185d';
const GOLD       = '#c8a96e';
const GREEN_DARK = '#0a3d2e';
const GREEN_MID  = '#0f5c40';

function genderColor(g: 'boy' | 'girl') { return g === 'boy' ? BOY_COLOR : GIRL_COLOR; }
function genderBg(g: 'boy' | 'girl')    { return g === 'boy' ? '#dbeafe' : '#fce7f3'; }

// ─── NameCard ────────────────────────────────────────────────────────────────
function NameCard({
  n, saved, onSave,
}: {
  n: NameEntry;
  saved: boolean;
  onSave: (name: string) => void;
}) {
  const [open, setOpen]     = useState(false);
  const [copied, setCopied] = useState(false);
  const gc  = genderColor(n.gender);
  const gbg = genderBg(n.gender);

  function copy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard?.writeText(`${n.name} (${n.arabic}) — ${n.meaning}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        background: open ? '#fff' : '#fdfcfa',
        borderRadius: 18,
        border: `1.5px solid ${open ? gc : '#ede8e0'}`,
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'all .22s cubic-bezier(.4,0,.2,1)',
        boxShadow: open ? `0 8px 32px ${gc}18` : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Avatar */}
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: open ? gc : gbg,
          color: open ? '#fff' : gc,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
          fontFamily: "'Amiri', 'Georgia', serif",
          transition: 'all .22s',
          boxShadow: open ? `0 4px 16px ${gc}44` : 'none',
        }}>
          {n.arabic?.charAt(0) || '؟'}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{
              fontSize: 17, fontWeight: 700, color: GREEN_DARK,
              fontFamily: "'Playfair Display', Georgia, serif",
              letterSpacing: '-0.01em',
            }}>{n.name}</span>
            <span style={{
              fontSize: 15, color: '#b0a89a',
              fontFamily: "'Amiri', 'Georgia', serif",
            }}>{n.arabic}</span>
          </div>
          <p style={{
            fontSize: 12.5, color: '#7a7268', margin: 0, lineHeight: 1.5,
            overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: open ? 'normal' : 'nowrap',
          }}>{n.meaning}</p>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, borderRadius: 20,
            padding: '3px 10px', background: gbg, color: gc, letterSpacing: '0.05em',
          }}>
            {n.gender === 'boy' ? '♂ BOY' : '♀ GIRL'}
          </span>
          <span style={{ fontSize: 13, color: '#ccc', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${gbg}` }}>

          {/* Arabic display */}
          <div style={{
            background: `linear-gradient(135deg, ${gc}12, ${gc}06)`,
            border: `1px solid ${gc}20`,
            borderRadius: 14, padding: '20px 16px',
            textAlign: 'center', marginBottom: 14,
          }}>
            <p style={{
              fontSize: 52, fontFamily: "'Amiri', 'Georgia', serif",
              color: gc, margin: '0 0 6px', lineHeight: 1.3,
              textShadow: `0 2px 16px ${gc}33`,
            }}>{n.arabic}</p>
            <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>
              {n.name} · {n.origin} origin
            </p>
          </div>

          {/* Meaning */}
          <div style={{
            background: '#f9f7f4', borderRadius: 12,
            padding: '14px 16px', marginBottom: 12,
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#c0b8ae', margin: '0 0 7px', letterSpacing: '0.15em' }}>MEANING</p>
            <p style={{ fontSize: 14, color: '#333', margin: 0, lineHeight: 1.75, fontFamily: "'Playfair Display', Georgia, serif" }}>
              {n.meaning}
            </p>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{ fontSize: 11, background: gbg, color: gc, borderRadius: 20, padding: '5px 14px', fontWeight: 600 }}>
              {n.gender === 'boy' ? '♂ Boy' : '♀ Girl'}
            </span>
            <span style={{ fontSize: 11, background: '#f0ede8', color: '#666', borderRadius: 20, padding: '5px 14px' }}>
              🌍 {n.origin}
            </span>
            {n.popular && (
              <span style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', borderRadius: 20, padding: '5px 14px', fontWeight: 600 }}>
                ★ Popular
              </span>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={e => { e.stopPropagation(); onSave(n.name); }}
              style={{
                flex: 1, border: 'none', borderRadius: 12, padding: '12px 0',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: saved ? gc : '#f0ede8',
                color: saved ? '#fff' : GREEN_DARK,
                transition: 'all .2s',
                boxShadow: saved ? `0 4px 12px ${gc}44` : 'none',
              }}>
              {saved ? '🔖 Saved!' : '🔖 Save Name'}
            </button>
            <button
              onClick={copy}
              style={{
                flex: 1, background: copied ? '#059669' : '#f0ede8', color: copied ? '#fff' : GREEN_DARK,
                border: 'none', borderRadius: 12, padding: '12px 0',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
              }}>
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function IslamicNamesFinder() {
  const [allNames, setAllNames]         = useState<NameEntry[]>([]);
  const [datasetReady, setDatasetReady] = useState(false);
  const [datasetError, setDatasetError] = useState('');

  const [query, setQuery]   = useState('');
  const [gender, setGender] = useState<'all' | 'boy' | 'girl'>('all');
  const [tab, setTab]       = useState<'search' | 'saved'>('search');

  const [filtered, setFiltered]   = useState<NameEntry[]>([]);
  const [displayed, setDisplayed] = useState<NameEntry[]>([]);
  const [page, setPage]           = useState(1);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [saved, setSaved] = useState<string[]>([]);
  const [savedNames, setSavedNames] = useState<NameEntry[]>([]);

  const loaderRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Load dataset once
  useEffect(() => {
    loadDataset()
      .then(data => { setAllNames(data); setDatasetReady(true); })
      .catch(() => setDatasetError('Could not load names. Please refresh.'));
  }, []);

  // Infinite scroll observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && displayed.length < filtered.length) {
      const next = page + 1;
      setPage(next);
      setDisplayed(filtered.slice(0, next * PAGE_SIZE));
    }
  }, [displayed.length, filtered, page]);

  useEffect(() => {
    const obs = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [handleObserver]);

  // Sync saved names from results when saved list changes
  useEffect(() => {
    setSavedNames(prev => {
      const merged = [...prev];
      allNames.forEach(n => {
        if (saved.includes(n.name) && !merged.find(m => m.name === n.name)) {
          merged.push(n);
        }
      });
      return merged.filter(n => saved.includes(n.name));
    });
  }, [saved, allNames]);

  function runSearch(q: string, g: string) {
    if (!q.trim() || !datasetReady) return;
    setSearching(true);
    setTimeout(() => {
      const f = filterNames(allNames, q, g);
      setFiltered(f);
      setDisplayed(f.slice(0, PAGE_SIZE));
      setPage(1);
      setHasSearched(true);
      setSearching(false);
    }, 80);
  }

  function handleSearch() {
    if (!query.trim()) return;
    runSearch(query, gender);
  }

  function handleGender(g: 'all' | 'boy' | 'girl') {
    setGender(g);
    if (hasSearched && query.trim()) runSearch(query, g);
  }

  function handleTopic(term: string) {
    setQuery(term);
    runSearch(term, gender);
    inputRef.current?.focus();
  }

  function toggleSave(name: string) {
    setSaved(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }

  const hasMore = displayed.length < filtered.length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f7f3ec 0%, #f0ebe0 100%)',
      fontFamily: "'Georgia', serif",
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Amiri:wght@400;700&family=DM+Sans:wght@400;500;600&display=swap');

        * { box-sizing: border-box; }

        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes fadeSlide { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer   {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes pulse     { 0%,100% { opacity:1; } 50% { opacity:.5; } }

        .fade-in  { animation: fadeSlide .3s ease-out both; }
        .card-in  { animation: fadeSlide .25s ease-out both; }

        .search-input {
          font-family: 'DM Sans', sans-serif;
          transition: box-shadow .2s, border-color .2s;
        }
        .search-input:focus {
          outline: none;
          box-shadow: 0 0 0 3px ${GREEN_DARK}22;
          border-color: ${GREEN_DARK} !important;
        }

        .topic-btn {
          font-family: 'DM Sans', sans-serif;
          transition: all .18s ease;
          transform: translateY(0);
        }
        .topic-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        .topic-btn:active { transform: translateY(0); }

        .gender-btn {
          font-family: 'DM Sans', sans-serif;
          transition: all .18s ease;
        }

        .tab-btn {
          font-family: 'DM Sans', sans-serif;
          transition: all .18s ease;
        }

        .shimmer-card {
          background: linear-gradient(90deg, #f0ebe0 25%, #f7f3ec 50%, #f0ebe0 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 18px;
          height: 80px;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c8b89a; border-radius: 4px; }
      `}</style>

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header style={{
        background: `linear-gradient(160deg, ${GREEN_DARK} 0%, ${GREEN_MID} 60%, #1a6b4a 100%)`,
        padding: '0 16px',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 4px 24px rgba(10,61,46,0.35)',
      }}>
        {/* Decorative Arabic pattern strip */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0 10px' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>
              ← Home
            </Link>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{
                color: '#fff', fontWeight: 800, fontSize: 18, margin: 0,
                fontFamily: "'Playfair Display', Georgia, serif",
                letterSpacing: '-0.01em',
              }}>
                📖 Islamic Name Finder
              </h1>
              <p style={{ color: GOLD, fontSize: 11, margin: '2px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
                {datasetReady
                  ? `${allNames.length.toLocaleString()}+ names · Infinite scroll`
                  : 'Loading names…'}
              </p>
            </div>
            <Link href="/about" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>
              About
            </Link>
          </div>

          {/* Search bar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>🔍</span>
              <input
                ref={inputRef}
                className="search-input"
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Name, meaning, or topic…"
                disabled={!datasetReady}
                style={{
                  width: '100%', paddingLeft: 44, paddingRight: 14,
                  paddingTop: 13, paddingBottom: 13,
                  borderRadius: 14, border: '2px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  fontSize: 14, color: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <style>{`.search-input::placeholder { color: rgba(255,255,255,0.45); }`}</style>
            </div>
            <button
              onClick={handleSearch}
              disabled={!datasetReady || !query.trim() || searching}
              style={{
                background: GOLD, color: GREEN_DARK,
                border: 'none', borderRadius: 14, padding: '0 20px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                opacity: (!datasetReady || !query.trim()) ? 0.5 : 1,
                transition: 'opacity .2s',
                whiteSpace: 'nowrap',
              }}>
              Search
            </button>
          </div>

          {/* Gender filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {([
              { v: 'all',  label: '✨ All'    },
              { v: 'boy',  label: '♂ Boys'   },
              { v: 'girl', label: '♀ Girls'  },
            ] as const).map(g => (
              <button
                key={g.v}
                className="gender-btn"
                onClick={() => handleGender(g.v)}
                style={{
                  flex: 1, border: 'none', borderRadius: 12, padding: '9px 0',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  background: gender === g.v
                    ? (g.v === 'boy' ? BOY_COLOR : g.v === 'girl' ? GIRL_COLOR : GOLD)
                    : 'rgba(255,255,255,0.12)',
                  color: gender === g.v
                    ? (g.v === 'all' ? GREEN_DARK : '#fff')
                    : 'rgba(255,255,255,0.7)',
                  boxShadow: gender === g.v ? '0 2px 12px rgba(0,0,0,0.2)' : 'none',
                }}>
                {g.label}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, paddingBottom: 14 }}>
            {(['search', 'saved'] as const).map(t => (
              <button
                key={t}
                className="tab-btn"
                onClick={() => setTab(t)}
                style={{
                  flex: 1, borderRadius: 10, padding: '8px 0', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  background: tab === t ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: tab === t ? '#fff' : 'rgba(255,255,255,0.55)',
                  border: `1px solid ${tab === t ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)'}`,
                  backdropFilter: tab === t ? 'blur(4px)' : 'none',
                }}>
                {t === 'search' ? '🔍 Search' : `🔖 Saved (${saved.length})`}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 60px' }}>

        {/* ── SAVED TAB ── */}
        {tab === 'saved' && (
          <div className="fade-in">
            {savedNames.length === 0 ? (
              <div style={{
                background: `linear-gradient(135deg, ${GREEN_DARK}, ${GREEN_MID})`,
                borderRadius: 20, padding: '48px 24px', textAlign: 'center',
                boxShadow: '0 8px 32px rgba(10,61,46,0.2)',
              }}>
                <p style={{ fontSize: 48, margin: '0 0 14px' }}>🔖</p>
                <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: '0 0 8px', fontFamily: "'Playfair Display', Georgia, serif" }}>
                  No saved names yet
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  Search for names and tap "Save Name" to keep them here
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 13, color: '#7a7268', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                    <strong style={{ color: GREEN_DARK }}>{savedNames.length}</strong> saved {savedNames.length === 1 ? 'name' : 'names'}
                  </p>
                  <button
                    onClick={() => { setSaved([]); setSavedNames([]); }}
                    style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    Clear all
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {savedNames.map((n, i) => (
                    <div key={`saved-${n.name}-${i}`} className="card-in" style={{ animationDelay: `${i * 0.04}s` }}>
                      <NameCard n={n} saved={saved.includes(n.name)} onSave={toggleSave} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── SEARCH TAB ── */}
        {tab === 'search' && (
          <>
            {/* Dataset loading */}
            {!datasetReady && !datasetError && (
              <div style={{ textAlign: 'center', padding: '56px 0' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  border: `3px solid ${GREEN_DARK}`, borderTopColor: 'transparent',
                  animation: 'spin .8s linear infinite',
                  display: 'inline-block', marginBottom: 16,
                }} />
                <p style={{ color: '#9a9288', fontSize: 13, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  Loading 14,585 Islamic names…
                </p>
              </div>
            )}

            {datasetError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '14px 18px' }}>
                <p style={{ color: '#dc2626', fontSize: 13, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>⚠️ {datasetError}</p>
              </div>
            )}

            {/* Welcome screen */}
            {datasetReady && !hasSearched && !searching && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Hero card */}
                <div style={{
                  background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN_MID} 60%, #1a6b4a 100%)`,
                  borderRadius: 22, padding: '32px 24px',
                  textAlign: 'center', overflow: 'hidden', position: 'relative',
                  boxShadow: '0 12px 40px rgba(10,61,46,0.25)',
                }}>
                  {/* Decorative circle */}
                  <div style={{
                    position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.04)', top: -60, right: -40,
                    pointerEvents: 'none',
                  }} />
                  <div style={{
                    position: 'absolute', width: 120, height: 120, borderRadius: '50%',
                    background: 'rgba(200,169,110,0.08)', bottom: -30, left: -20,
                    pointerEvents: 'none',
                  }} />

                  <p style={{
                    fontSize: 44, margin: '0 0 14px',
                    fontFamily: "'Amiri', 'Georgia', serif",
                    color: GOLD, lineHeight: 1.2,
                  }}>بِسْمِ اللَّهِ</p>
                  <p style={{
                    color: '#fff', fontSize: 17, fontWeight: 700,
                    margin: '0 0 8px',
                    fontFamily: "'Playfair Display', Georgia, serif",
                  }}>
                    {allNames.length.toLocaleString()}+ Islamic Names
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 6px', fontFamily: "'DM Sans', sans-serif" }}>
                    Search by name, meaning, or topic · English & Arabic
                  </p>
                  <p style={{ color: GOLD, fontSize: 12, margin: 0, fontStyle: 'italic', fontFamily: "'Playfair Display', Georgia, serif" }}>
                    Infinite scroll · Save your favourites · Copy with one tap
                  </p>
                </div>

                {/* Quick topics */}
                <div style={{
                  background: '#fff', borderRadius: 18, padding: '18px 18px',
                  border: '1px solid #ede8e0',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}>
                  <p style={{
                    fontSize: 11, fontWeight: 700, color: '#c0b8ae',
                    margin: '0 0 12px', letterSpacing: '0.15em',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>BROWSE BY TOPIC</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {TOPICS.map(t => (
                      <button
                        key={t.term}
                        className="topic-btn"
                        onClick={() => handleTopic(t.term)}
                        style={{
                          background: '#f7f4ef', color: GREEN_DARK,
                          border: '1.5px solid #ede8e0', borderRadius: 22,
                          padding: '8px 16px', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                        }}>
                        {t.emoji} {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stats strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { val: `${allNames.filter(n => n.gender === 'boy').length.toLocaleString()}+`,  label: "Boy Names"  },
                    { val: `${allNames.filter(n => n.gender === 'girl').length.toLocaleString()}+`, label: "Girl Names" },
                    { val: '14K+', label: 'Total Names' },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: '#fff', borderRadius: 14, padding: '14px 12px',
                      textAlign: 'center', border: '1px solid #ede8e0',
                    }}>
                      <p style={{ fontSize: 20, fontWeight: 800, color: GREEN_DARK, margin: '0 0 3px', fontFamily: "'Playfair Display', Georgia, serif" }}>{s.val}</p>
                      <p style={{ fontSize: 11, color: '#aaa', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Searching skeleton */}
            {searching && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ height: 14, width: 140, background: '#ede8e0', borderRadius: 7, animation: 'pulse 1.2s infinite' }} />
                  <div style={{ height: 14, width: 80,  background: '#ede8e0', borderRadius: 7, animation: 'pulse 1.2s infinite' }} />
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="shimmer-card" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            )}

            {/* Results */}
            {!searching && hasSearched && (
              <div className="fade-in">
                {/* Count bar */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <p style={{ fontSize: 13, color: '#7a7268', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                    <strong style={{ color: GREEN_DARK }}>{displayed.length}</strong>
                    {' of '}
                    <strong style={{ color: GREEN_DARK }}>{filtered.length.toLocaleString()}</strong>
                    {' names for "'}
                    <strong style={{ color: GREEN_DARK }}>{query}</strong>
                    {'"'}
                  </p>
                  <span style={{
                    fontSize: 11, color: GOLD, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    background: `${GREEN_DARK}10`, borderRadius: 20, padding: '3px 10px',
                  }}>
                    ↓ Scroll to load more
                  </span>
                </div>

                {/* Cards grid */}
                {filtered.length === 0 ? (
                  <div style={{
                    background: '#fff', borderRadius: 18, border: '1px solid #ede8e0',
                    padding: '48px 24px', textAlign: 'center',
                  }}>
                    <p style={{ fontSize: 40, margin: '0 0 12px' }}>🔍</p>
                    <p style={{ fontSize: 15, color: '#555', margin: '0 0 6px', fontFamily: "'Playfair Display', Georgia, serif" }}>No names found</p>
                    <p style={{ fontSize: 12, color: '#aaa', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Try a different keyword or browse a topic above</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {displayed.map((n, i) => (
                      <div key={`${n.name}-${i}`} className="card-in" style={{ animationDelay: `${(i % PAGE_SIZE) * 0.03}s` }}>
                        <NameCard n={n} saved={saved.includes(n.name)} onSave={toggleSave} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Infinite scroll trigger */}
                {hasMore && (
                  <div ref={loaderRef} style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      border: `2px solid ${GREEN_DARK}`, borderTopColor: 'transparent',
                      animation: 'spin .8s linear infinite',
                    }} />
                  </div>
                )}

                {!hasMore && filtered.length > 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
                    <p style={{ fontSize: 12, color: '#b0a89a', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                      ✅ All {filtered.length.toLocaleString()} results shown
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 32, paddingTop: 20, borderTop: '1px solid #ede8e0' }}>
          <p style={{ fontSize: 11, color: '#c0b8ae', margin: '0 0 10px', fontFamily: "'DM Sans', sans-serif" }}>
            More tools from I Love Islam
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
            {[
              { href: '/',       label: '🏠 Home'         },
              { href: '/zakat',  label: '💰 Zakat'        },
              
              { href: '/qibla',  label: '🧭 Qibla'        },
              { href: '/about',  label: 'ℹ️ About'        },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{
                fontSize: 12, color: GREEN_DARK, textDecoration: 'none',
                fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              }}>
                {l.label}
              </Link>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#c8b8a2', margin: '14px 0 0', fontStyle: 'italic', fontFamily: "'Playfair Display', Georgia, serif" }}>
            14,585+ Islamic names · Arabic script · Full meanings
          </p>
        </div>
      </main>
    </div>
  );
}