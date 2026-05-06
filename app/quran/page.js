'use client';
import { useState } from 'react';
import Link from 'next/link';

const SURAHS = [
  { number: 1, name: 'Al-Fatihah', arabic: 'الفاتحة', meaning: 'The Opening', verses: 7 },
  { number: 2, name: 'Al-Baqarah', arabic: 'البقرة', meaning: 'The Cow', verses: 286 },
  { number: 3, name: 'Ali Imran', arabic: 'آل عمران', meaning: 'Family of Imran', verses: 200 },
  { number: 4, name: 'An-Nisa', arabic: 'النساء', meaning: 'The Women', verses: 176 },
  { number: 5, name: 'Al-Maidah', arabic: 'المائدة', meaning: 'The Table Spread', verses: 120 },
  { number: 6, name: 'Al-Anam', arabic: 'الأنعام', meaning: 'The Cattle', verses: 165 },
  { number: 7, name: 'Al-Araf', arabic: 'الأعراف', meaning: 'The Heights', verses: 206 },
  { number: 8, name: 'Al-Anfal', arabic: 'الأنفال', meaning: 'The Spoils of War', verses: 75 },
  { number: 9, name: 'At-Tawbah', arabic: 'التوبة', meaning: 'The Repentance', verses: 129 },
  { number: 10, name: 'Yunus', arabic: 'يونس', meaning: 'Jonah', verses: 109 },
  { number: 11, name: 'Hud', arabic: 'هود', meaning: 'Hud', verses: 123 },
  { number: 12, name: 'Yusuf', arabic: 'يوسف', meaning: 'Joseph', verses: 111 },
  { number: 13, name: 'Ar-Rad', arabic: 'الرعد', meaning: 'The Thunder', verses: 43 },
  { number: 14, name: 'Ibrahim', arabic: 'إبراهيم', meaning: 'Abraham', verses: 52 },
  { number: 15, name: 'Al-Hijr', arabic: 'الحجر', meaning: 'The Rocky Tract', verses: 99 },
  { number: 16, name: 'An-Nahl', arabic: 'النحل', meaning: 'The Bee', verses: 128 },
  { number: 17, name: 'Al-Isra', arabic: 'الإسراء', meaning: 'The Night Journey', verses: 111 },
  { number: 18, name: 'Al-Kahf', arabic: 'الكهف', meaning: 'The Cave', verses: 110 },
  { number: 19, name: 'Maryam', arabic: 'مريم', meaning: 'Mary', verses: 98 },
  { number: 20, name: 'Ta-Ha', arabic: 'طه', meaning: 'Ta-Ha', verses: 135 },
  { number: 21, name: 'Al-Anbiya', arabic: 'الأنبياء', meaning: 'The Prophets', verses: 112 },
  { number: 22, name: 'Al-Hajj', arabic: 'الحج', meaning: 'The Pilgrimage', verses: 78 },
  { number: 23, name: 'Al-Muminun', arabic: 'المؤمنون', meaning: 'The Believers', verses: 118 },
  { number: 24, name: 'An-Nur', arabic: 'النور', meaning: 'The Light', verses: 64 },
  { number: 25, name: 'Al-Furqan', arabic: 'الفرقان', meaning: 'The Criterion', verses: 77 },
  { number: 36, name: 'Ya-Sin', arabic: 'يس', meaning: 'Ya-Sin', verses: 83 },
  { number: 44, name: 'Ad-Dukhan', arabic: 'الدخان', meaning: 'The Smoke', verses: 59 },
  { number: 55, name: 'Ar-Rahman', arabic: 'الرحمن', meaning: 'The Most Gracious', verses: 78 },
  { number: 56, name: 'Al-Waqiah', arabic: 'الواقعة', meaning: 'The Inevitable', verses: 96 },
  { number: 67, name: 'Al-Mulk', arabic: 'الملك', meaning: 'The Sovereignty', verses: 30 },
  { number: 78, name: 'An-Naba', arabic: 'النبأ', meaning: 'The Tidings', verses: 40 },
  { number: 108, name: 'Al-Kawthar', arabic: 'الكوثر', meaning: 'Abundance', verses: 3 },
  { number: 112, name: 'Al-Ikhlas', arabic: 'الإخلاص', meaning: 'Sincerity', verses: 4 },
  { number: 113, name: 'Al-Falaq', arabic: 'الفلق', meaning: 'The Daybreak', verses: 5 },
  { number: 114, name: 'An-Nas', arabic: 'الناس', meaning: 'Mankind', verses: 6 },
];

// Arabic verse number circle ١ ٢ ٣...
function toArabicNum(n) {
  return n.toString().split('').map(d => String.fromCharCode(0x0660 + parseInt(d))).join('');
}

export default function QuranReader() {
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('mushaf'); // 'mushaf' or 'translation'
  const [fontSize, setFontSize] = useState(2); // index into sizes
  const [showTranslation, setShowTranslation] = useState(true);

  const arabicSizes = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  const fontLabels = ['S', 'M', 'L', 'XL'];

  const filtered = SURAHS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.arabic.includes(search) ||
    s.meaning.toLowerCase().includes(search.toLowerCase())
  );

  const loadSurah = async (surah) => {
    setSelectedSurah(surah);
    setVerses([]);
    setLoading(true);
    setError('');
    try {
      const [arabicRes, transRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${surah.number}`),
        fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/en.asad`)
      ]);
      const arabicData = await arabicRes.json();
      const transData = await transRes.json();
      if (arabicData.code === 200) {
        setVerses(arabicData.data.ayahs.map((a, i) => ({
          number: a.numberInSurah,
          arabic: a.text,
          translation: transData.data?.ayahs?.[i]?.text || '',
        })));
      } else setError('Could not load surah.');
    } catch { setError('Network error.'); }
    setLoading(false);
  };

  const goBack = () => { setSelectedSurah(null); setVerses([]); setError(''); };

  return (
    <div className="min-h-screen bg-gray-50">
      <header style={{ background: '#0a3d2e' }} className="px-6 py-4 flex items-center gap-4">
        {selectedSurah ? (
          <button onClick={goBack} className="text-white/60 hover:text-white text-sm">← Surahs</button>
        ) : (
          <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
        )}
        <h1 className="text-white font-medium flex-1">
          {selectedSurah ? `${selectedSurah.name} · ${selectedSurah.arabic}` : 'Quran Reader'}
        </h1>
        {selectedSurah && (
          <span className="text-white/40 text-sm">{selectedSurah.verses} verses</span>
        )}
      </header>

      {/* Surah list */}
      {!selectedSurah && (
        <main className="max-w-2xl mx-auto px-4 py-6">
          <div style={{ background: '#0a3d2e' }} className="rounded-2xl p-5 mb-5 text-center">
            <p className="font-arabic text-3xl mb-1" style={{ color: '#c8a96e' }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            <p className="text-white/50 text-sm">In the name of Allah, the Most Gracious, the Most Merciful</p>
          </div>
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search surah name or meaning..."
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm bg-white" />
          </div>
          <p className="text-xs text-gray-400 mb-3">{filtered.length} surahs</p>
          <div className="space-y-2">
            {filtered.map(surah => (
              <button key={surah.number} onClick={() => loadSurah(surah)}
                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-gray-300 transition-all text-left">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: '#0a3d2e', color: '#c8a96e' }}>
                  {surah.number}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{surah.name}</p>
                  <p className="text-xs text-gray-400">{surah.meaning} · {surah.verses} verses</p>
                </div>
                <p className="font-arabic text-xl text-gray-600">{surah.arabic}</p>
              </button>
            ))}
          </div>
        </main>
      )}

      {/* Surah reading view */}
      {selectedSurah && (
        <main className="max-w-2xl mx-auto px-4 py-4">

          {/* Mode & Controls bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-4 flex items-center gap-2 flex-wrap">
            {/* Mode toggle */}
            <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs">
              <button onClick={() => setMode('mushaf')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${mode === 'mushaf' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>
                📜 Mushaf
              </button>
              <button onClick={() => setMode('translation')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${mode === 'translation' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>
                📋 Verse by Verse
              </button>
            </div>

            {/* Font size */}
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-xs text-gray-400 mr-1">A</span>
              {arabicSizes.map((_, i) => (
                <button key={i} onClick={() => setFontSize(i)}
                  className={`w-6 h-6 rounded text-xs font-bold transition-all ${fontSize === i ? 'text-white' : 'text-gray-300'}`}
                  style={fontSize === i ? { background: '#0a3d2e' } : {}}>
                  {fontLabels[i]}
                </button>
              ))}
            </div>

            {/* Translation toggle — only in verse mode */}
            {mode === 'translation' && (
              <button onClick={() => setShowTranslation(!showTranslation)}
                className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border transition-all ${showTranslation ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-400'}`}>
                EN {showTranslation ? 'ON' : 'OFF'}
              </button>
            )}
          </div>

          {loading && (
            <div className="text-center py-20">
              <div className="text-5xl mb-3 animate-pulse">📖</div>
              <p className="text-gray-400">Loading {selectedSurah.name}...</p>
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-500">{error}</div>}

          {verses.length > 0 && (
            <>
              {/* Surah header */}
              <div className="text-center mb-6">
                <div className="inline-block border border-gray-200 rounded-2xl px-8 py-4 bg-white">
                  <p className="font-arabic text-2xl text-gray-800 mb-1">{selectedSurah.arabic}</p>
                  <p className="text-sm text-gray-400">{selectedSurah.name} · {selectedSurah.meaning}</p>
                </div>
              </div>

              {/* Bismillah */}
              {selectedSurah.number !== 9 && selectedSurah.number !== 1 && (
                <p className="font-arabic text-2xl text-gray-600 text-center mb-6">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
              )}

              {/* ── MUSHAF MODE — continuous flowing text ── */}
              {mode === 'mushaf' && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <p
                    className={`font-arabic ${arabicSizes[fontSize]} leading-loose text-gray-800 text-justify`}
                    dir="rtl"
                    style={{ lineHeight: '2.8', wordSpacing: '4px' }}
                  >
                    {verses.map((verse, i) => (
                      <span key={verse.number}>
                        {verse.arabic}
                        {/* Arabic verse end marker with number */}
                        <span
                          className="inline-flex items-center justify-center mx-2 text-base align-middle"
                          style={{ color: '#c8a96e', fontFamily: 'Amiri, serif' }}
                        >
                          ۝{toArabicNum(verse.number)}
                        </span>
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {/* ── VERSE BY VERSE MODE ── */}
              {mode === 'translation' && (
                <div className="space-y-3">
                  {verses.map(verse => (
                    <div key={verse.number} className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ background: '#0a3d2e', color: '#c8a96e' }}>
                          {verse.number}
                        </div>
                      </div>
                      <p className={`font-arabic ${arabicSizes[fontSize]} leading-loose text-gray-800 text-right mb-3`} dir="rtl">
                        {verse.arabic}
                      </p>
                      {showTranslation && verse.translation && (
                        <p className="text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
                          {verse.translation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      )}
    </div>
  );
}