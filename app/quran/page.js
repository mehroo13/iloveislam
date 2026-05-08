'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

const SURAHS = [
  { number: 1, name: 'Al-Fatihah', arabic: 'الفاتحة', meaning: 'The Opening', verses: 7, juz: 1 },
  { number: 2, name: 'Al-Baqarah', arabic: 'البقرة', meaning: 'The Cow', verses: 286, juz: 1 },
  { number: 3, name: 'Ali Imran', arabic: 'آل عمران', meaning: 'Family of Imran', verses: 200, juz: 3 },
  { number: 4, name: 'An-Nisa', arabic: 'النساء', meaning: 'The Women', verses: 176, juz: 4 },
  { number: 5, name: 'Al-Maidah', arabic: 'المائدة', meaning: 'The Table Spread', verses: 120, juz: 6 },
  { number: 6, name: 'Al-Anam', arabic: 'الأنعام', meaning: 'The Cattle', verses: 165, juz: 7 },
  { number: 7, name: 'Al-Araf', arabic: 'الأعراف', meaning: 'The Heights', verses: 206, juz: 8 },
  { number: 8, name: 'Al-Anfal', arabic: 'الأنفال', meaning: 'The Spoils of War', verses: 75, juz: 9 },
  { number: 9, name: 'At-Tawbah', arabic: 'التوبة', meaning: 'The Repentance', verses: 129, juz: 10 },
  { number: 10, name: 'Yunus', arabic: 'يونس', meaning: 'Jonah', verses: 109, juz: 11 },
  { number: 11, name: 'Hud', arabic: 'هود', meaning: 'Hud', verses: 123, juz: 11 },
  { number: 12, name: 'Yusuf', arabic: 'يوسف', meaning: 'Joseph', verses: 111, juz: 12 },
  { number: 13, name: 'Ar-Rad', arabic: 'الرعد', meaning: 'The Thunder', verses: 43, juz: 13 },
  { number: 14, name: 'Ibrahim', arabic: 'إبراهيم', meaning: 'Abraham', verses: 52, juz: 13 },
  { number: 15, name: 'Al-Hijr', arabic: 'الحجر', meaning: 'The Rocky Tract', verses: 99, juz: 14 },
  { number: 16, name: 'An-Nahl', arabic: 'النحل', meaning: 'The Bee', verses: 128, juz: 14 },
  { number: 17, name: 'Al-Isra', arabic: 'الإسراء', meaning: 'The Night Journey', verses: 111, juz: 15 },
  { number: 18, name: 'Al-Kahf', arabic: 'الكهف', meaning: 'The Cave', verses: 110, juz: 15 },
  { number: 19, name: 'Maryam', arabic: 'مريم', meaning: 'Mary', verses: 98, juz: 16 },
  { number: 20, name: 'Ta-Ha', arabic: 'طه', meaning: 'Ta-Ha', verses: 135, juz: 16 },
  { number: 21, name: 'Al-Anbiya', arabic: 'الأنبياء', meaning: 'The Prophets', verses: 112, juz: 17 },
  { number: 22, name: 'Al-Hajj', arabic: 'الحج', meaning: 'The Pilgrimage', verses: 78, juz: 17 },
  { number: 23, name: 'Al-Muminun', arabic: 'المؤمنون', meaning: 'The Believers', verses: 118, juz: 18 },
  { number: 24, name: 'An-Nur', arabic: 'النور', meaning: 'The Light', verses: 64, juz: 18 },
  { number: 25, name: 'Al-Furqan', arabic: 'الفرقان', meaning: 'The Criterion', verses: 77, juz: 18 },
  { number: 26, name: 'Ash-Shuara', arabic: 'الشعراء', meaning: 'The Poets', verses: 227, juz: 19 },
  { number: 27, name: 'An-Naml', arabic: 'النمل', meaning: 'The Ant', verses: 93, juz: 19 },
  { number: 28, name: 'Al-Qasas', arabic: 'القصص', meaning: 'The Stories', verses: 88, juz: 20 },
  { number: 29, name: 'Al-Ankabut', arabic: 'العنكبوت', meaning: 'The Spider', verses: 69, juz: 20 },
  { number: 30, name: 'Ar-Rum', arabic: 'الروم', meaning: 'The Romans', verses: 60, juz: 21 },
  { number: 31, name: 'Luqman', arabic: 'لقمان', meaning: 'Luqman', verses: 34, juz: 21 },
  { number: 32, name: 'As-Sajdah', arabic: 'السجدة', meaning: 'The Prostration', verses: 30, juz: 21 },
  { number: 33, name: 'Al-Ahzab', arabic: 'الأحزاب', meaning: 'The Combined Forces', verses: 73, juz: 21 },
  { number: 34, name: 'Saba', arabic: 'سبأ', meaning: 'Sheba', verses: 54, juz: 22 },
  { number: 35, name: 'Fatir', arabic: 'فاطر', meaning: 'Originator', verses: 45, juz: 22 },
  { number: 36, name: 'Ya-Sin', arabic: 'يس', meaning: 'Ya-Sin', verses: 83, juz: 22 },
  { number: 37, name: 'As-Saffat', arabic: 'الصافات', meaning: 'Those Ranged in Ranks', verses: 182, juz: 23 },
  { number: 38, name: 'Sad', arabic: 'ص', meaning: 'Sad', verses: 88, juz: 23 },
  { number: 39, name: 'Az-Zumar', arabic: 'الزمر', meaning: 'The Groups', verses: 75, juz: 23 },
  { number: 40, name: 'Ghafir', arabic: 'غافر', meaning: 'The Forgiver', verses: 85, juz: 24 },
  { number: 41, name: 'Fussilat', arabic: 'فصلت', meaning: 'Explained in Detail', verses: 54, juz: 24 },
  { number: 42, name: 'Ash-Shura', arabic: 'الشورى', meaning: 'The Consultation', verses: 53, juz: 25 },
  { number: 43, name: 'Az-Zukhruf', arabic: 'الزخرف', meaning: 'The Gold Adornments', verses: 89, juz: 25 },
  { number: 44, name: 'Ad-Dukhan', arabic: 'الدخان', meaning: 'The Smoke', verses: 59, juz: 25 },
  { number: 45, name: 'Al-Jathiyah', arabic: 'الجاثية', meaning: 'The Crouching', verses: 37, juz: 25 },
  { number: 46, name: 'Al-Ahqaf', arabic: 'الأحقاف', meaning: 'The Wind-Curved Sandhills', verses: 35, juz: 26 },
  { number: 47, name: 'Muhammad', arabic: 'محمد', meaning: 'Muhammad', verses: 38, juz: 26 },
  { number: 48, name: 'Al-Fath', arabic: 'الفتح', meaning: 'The Victory', verses: 29, juz: 26 },
  { number: 49, name: 'Al-Hujurat', arabic: 'الحجرات', meaning: 'The Rooms', verses: 18, juz: 26 },
  { number: 50, name: 'Qaf', arabic: 'ق', meaning: 'Qaf', verses: 45, juz: 26 },
  { number: 51, name: 'Adh-Dhariyat', arabic: 'الذاريات', meaning: 'The Winnowing Winds', verses: 60, juz: 26 },
  { number: 52, name: 'At-Tur', arabic: 'الطور', meaning: 'The Mount', verses: 49, juz: 27 },
  { number: 53, name: 'An-Najm', arabic: 'النجم', meaning: 'The Star', verses: 62, juz: 27 },
  { number: 54, name: 'Al-Qamar', arabic: 'القمر', meaning: 'The Moon', verses: 55, juz: 27 },
  { number: 55, name: 'Ar-Rahman', arabic: 'الرحمن', meaning: 'The Most Gracious', verses: 78, juz: 27 },
  { number: 56, name: 'Al-Waqiah', arabic: 'الواقعة', meaning: 'The Inevitable', verses: 96, juz: 27 },
  { number: 57, name: 'Al-Hadid', arabic: 'الحديد', meaning: 'The Iron', verses: 29, juz: 27 },
  { number: 58, name: 'Al-Mujadila', arabic: 'المجادلة', meaning: 'The Pleading Woman', verses: 22, juz: 28 },
  { number: 59, name: 'Al-Hashr', arabic: 'الحشر', meaning: 'The Exile', verses: 24, juz: 28 },
  { number: 60, name: 'Al-Mumtahanah', arabic: 'الممتحنة', meaning: 'She that is to be examined', verses: 13, juz: 28 },
  { number: 61, name: 'As-Saf', arabic: 'الصف', meaning: 'The Ranks', verses: 14, juz: 28 },
  { number: 62, name: 'Al-Jumuah', arabic: 'الجمعة', meaning: 'The Congregation', verses: 11, juz: 28 },
  { number: 63, name: 'Al-Munafiqun', arabic: 'المنافقون', meaning: 'The Hypocrites', verses: 11, juz: 28 },
  { number: 64, name: 'At-Taghabun', arabic: 'التغابن', meaning: 'The Mutual Disillusion', verses: 18, juz: 28 },
  { number: 65, name: 'At-Talaq', arabic: 'الطلاق', meaning: 'The Divorce', verses: 12, juz: 28 },
  { number: 66, name: 'At-Tahrim', arabic: 'التحريم', meaning: 'The Prohibition', verses: 12, juz: 28 },
  { number: 67, name: 'Al-Mulk', arabic: 'الملك', meaning: 'The Sovereignty', verses: 30, juz: 29 },
  { number: 68, name: 'Al-Qalam', arabic: 'القلم', meaning: 'The Pen', verses: 52, juz: 29 },
  { number: 69, name: 'Al-Haqqah', arabic: 'الحاقة', meaning: 'The Reality', verses: 52, juz: 29 },
  { number: 70, name: 'Al-Maarij', arabic: 'المعارج', meaning: 'The Ascending Stairways', verses: 44, juz: 29 },
  { number: 71, name: 'Nuh', arabic: 'نوح', meaning: 'Noah', verses: 28, juz: 29 },
  { number: 72, name: 'Al-Jinn', arabic: 'الجن', meaning: 'The Jinn', verses: 28, juz: 29 },
  { number: 73, name: 'Al-Muzzammil', arabic: 'المزمل', meaning: 'The Enshrouded One', verses: 20, juz: 29 },
  { number: 74, name: 'Al-Muddaththir', arabic: 'المدثر', meaning: 'The Cloaked One', verses: 56, juz: 29 },
  { number: 75, name: 'Al-Qiyamah', arabic: 'القيامة', meaning: 'The Resurrection', verses: 40, juz: 29 },
  { number: 76, name: 'Al-Insan', arabic: 'الإنسان', meaning: 'The Human', verses: 31, juz: 29 },
  { number: 77, name: 'Al-Mursalat', arabic: 'المرسلات', meaning: 'The Emissaries', verses: 50, juz: 29 },
  { number: 78, name: 'An-Naba', arabic: 'النبأ', meaning: 'The Tidings', verses: 40, juz: 30 },
  { number: 79, name: 'An-Naziat', arabic: 'النازعات', meaning: 'Those who drag forth', verses: 46, juz: 30 },
  { number: 80, name: 'Abasa', arabic: 'عبس', meaning: 'He Frowned', verses: 42, juz: 30 },
  { number: 81, name: 'At-Takwir', arabic: 'التكوير', meaning: 'The Overthrowing', verses: 29, juz: 30 },
  { number: 82, name: 'Al-Infitar', arabic: 'الانفطار', meaning: 'The Cleaving', verses: 19, juz: 30 },
  { number: 83, name: 'Al-Mutaffifin', arabic: 'المطففين', meaning: 'The Defrauding', verses: 36, juz: 30 },
  { number: 84, name: 'Al-Inshiqaq', arabic: 'الانشقاق', meaning: 'The Sundering', verses: 25, juz: 30 },
  { number: 85, name: 'Al-Buruj', arabic: 'البروج', meaning: 'The Mansions of the Stars', verses: 22, juz: 30 },
  { number: 86, name: 'At-Tariq', arabic: 'الطارق', meaning: 'The Morning Star', verses: 17, juz: 30 },
  { number: 87, name: 'Al-Ala', arabic: 'الأعلى', meaning: 'The Most High', verses: 19, juz: 30 },
  { number: 88, name: 'Al-Ghashiyah', arabic: 'الغاشية', meaning: 'The Overwhelming', verses: 26, juz: 30 },
  { number: 89, name: 'Al-Fajr', arabic: 'الفجر', meaning: 'The Dawn', verses: 30, juz: 30 },
  { number: 90, name: 'Al-Balad', arabic: 'البلد', meaning: 'The City', verses: 20, juz: 30 },
  { number: 91, name: 'Ash-Shams', arabic: 'الشمس', meaning: 'The Sun', verses: 15, juz: 30 },
  { number: 92, name: 'Al-Layl', arabic: 'الليل', meaning: 'The Night', verses: 21, juz: 30 },
  { number: 93, name: 'Ad-Duha', arabic: 'الضحى', meaning: 'The Morning Hours', verses: 11, juz: 30 },
  { number: 94, name: 'Ash-Sharh', arabic: 'الشرح', meaning: 'The Relief', verses: 8, juz: 30 },
  { number: 95, name: 'At-Tin', arabic: 'التين', meaning: 'The Fig', verses: 8, juz: 30 },
  { number: 96, name: 'Al-Alaq', arabic: 'العلق', meaning: 'The Clot', verses: 19, juz: 30 },
  { number: 97, name: 'Al-Qadr', arabic: 'القدر', meaning: 'The Power', verses: 5, juz: 30 },
  { number: 98, name: 'Al-Bayyinah', arabic: 'البينة', meaning: 'The Clear Proof', verses: 8, juz: 30 },
  { number: 99, name: 'Az-Zalzalah', arabic: 'الزلزلة', meaning: 'The Earthquake', verses: 8, juz: 30 },
  { number: 100, name: 'Al-Adiyat', arabic: 'العاديات', meaning: 'The Courser', verses: 11, juz: 30 },
  { number: 101, name: 'Al-Qariah', arabic: 'القارعة', meaning: 'The Calamity', verses: 11, juz: 30 },
  { number: 102, name: 'At-Takathur', arabic: 'التكاثر', meaning: 'The Rivalry in World Increase', verses: 8, juz: 30 },
  { number: 103, name: 'Al-Asr', arabic: 'العصر', meaning: 'The Declining Day', verses: 3, juz: 30 },
  { number: 104, name: 'Al-Humazah', arabic: 'الهمزة', meaning: 'The Traducer', verses: 9, juz: 30 },
  { number: 105, name: 'Al-Fil', arabic: 'الفيل', meaning: 'The Elephant', verses: 5, juz: 30 },
  { number: 106, name: 'Quraysh', arabic: 'قريش', meaning: 'Quraysh', verses: 4, juz: 30 },
  { number: 107, name: 'Al-Maun', arabic: 'الماعون', meaning: 'The Small Kindnesses', verses: 7, juz: 30 },
  { number: 108, name: 'Al-Kawthar', arabic: 'الكوثر', meaning: 'Abundance', verses: 3, juz: 30 },
  { number: 109, name: 'Al-Kafirun', arabic: 'الكافرون', meaning: 'The Disbelievers', verses: 6, juz: 30 },
  { number: 110, name: 'An-Nasr', arabic: 'النصر', meaning: 'The Divine Support', verses: 3, juz: 30 },
  { number: 111, name: 'Al-Masad', arabic: 'المسد', meaning: 'The Palm Fibre', verses: 5, juz: 30 },
  { number: 112, name: 'Al-Ikhlas', arabic: 'الإخلاص', meaning: 'Sincerity', verses: 4, juz: 30 },
  { number: 113, name: 'Al-Falaq', arabic: 'الفلق', meaning: 'The Daybreak', verses: 5, juz: 30 },
  { number: 114, name: 'An-Nas', arabic: 'الناس', meaning: 'Mankind', verses: 6, juz: 30 },
];

function toArabicNum(n) {
  return n.toString().split('').map(d => String.fromCharCode(0x0660 + parseInt(d))).join('');
}

const FONT_SIZES = [
  { label: 'S', size: '24px' },
  { label: 'M', size: '29px' },
  { label: 'L', size: '34px' },
  { label: 'XL', size: '40px' },
];

const VerseEnd = ({ num }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.15em',
    height: '2.15em',
    borderRadius: '50%',
    fontSize: '0.52em',
    margin: '0 0.35em 0 0.5em',
    verticalAlign: 'middle',
    fontFamily: "'Scheherazade New', serif",
    background: '#f8f1e3',
    border: '2px solid #1a3c2f',
    color: '#1a3c2f',
    flexShrink: 0,
  }}>
    {toArabicNum(num)}
  </span>
);

const GOLD = '#c8a96e';
const GREEN_DARK = '#1a3c2f';

export default function QuranReader() {
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('mushaf');
  const [fontSize, setFontSize] = useState(1);
  const [showTranslation, setShowTranslation] = useState(true);
  const [dark, setDark] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(localStorage.getItem('quran_bookmarks') || '[]'); } catch { return []; }
    }
    return [];
  });
  const topRef = useRef(null);

  const bg = dark ? '#0a1208' : '#f8f4eb';
  const cardBg = dark ? '#111d14' : '#fffef5';
  const borderCol = dark ? '#2a3d2a' : '#d4c9a0';
  const textCol = dark ? '#e0d5b0' : '#1a3c2f';
  const subCol = dark ? '#6b7c6b' : '#7a6a40';

  const filtered = SURAHS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.arabic.includes(search) ||
    s.meaning.toLowerCase().includes(search.toLowerCase()) ||
    s.number.toString() === search.trim()
  );

  async function loadSurah(surah) {
    setSelectedSurah(surah);
    setVerses([]);
    setLoading(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const [r1, r2] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${surah.number}`),
        fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/en.asad`),
      ]);
      const d1 = await r1.json();
      const d2 = await r2.json();
      if (d1.code === 200) {
        setVerses(d1.data.ayahs.map((a, i) => ({
          number: a.numberInSurah,
          arabic: a.text,
          translation: d2.data?.ayahs?.[i]?.text || '',
        })));
      } else setError('Could not load surah. Please try again.');
    } catch { setError('Network error. Please check your connection.'); }
    setLoading(false);
  }

  function toggleBookmark(s) {
    const has = bookmarks.find(b => b.number === s.number);
    const updated = has ? bookmarks.filter(b => b.number !== s.number) : [...bookmarks, s];
    setBookmarks(updated);
    localStorage.setItem('quran_bookmarks', JSON.stringify(updated));
  }
  const isBookmarked = (n) => bookmarks.some(b => b.number === n);

  const displayVerses = verses.filter(v => !(selectedSurah?.number === 1 && v.number === 1));

  return (
    <div ref={topRef} style={{ minHeight: '100vh', background: bg, color: textCol, transition: 'background 0.3s, color 0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap');
        .qf { font-family: 'Scheherazade New', serif !important; }
        .mushaf-text { line-height: 2.95; text-align: justify; text-align-last: right; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #c8a96e88; border-radius: 3px; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: GREEN_DARK, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          {selectedSurah ? (
            <button onClick={() => { setSelectedSurah(null); setVerses([]); }} style={{ color: '#fff', background: 'none', border: 'none', fontSize: 15, cursor: 'pointer' }}>
              ← Surahs
            </button>
          ) : (
            <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 15 }}>← Back</Link>
          )}
          <div style={{ flex: 1, textAlign: 'center' }}>
            {selectedSurah ? (
              <div>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{selectedSurah.name}</div>
                <div className="qf" style={{ color: GOLD, fontSize: 22 }}>{selectedSurah.arabic}</div>
              </div>
            ) : (
              <span className="qf" style={{ color: GOLD, fontSize: 24 }}>القرآن الكريم</span>
            )}
          </div>
          <button onClick={() => setDark(d => !d)} style={{ fontSize: 22, background: 'none', border: 'none', color: '#fff' }}>
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* SURAH LIST */}
      {!selectedSurah && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 14px' }}>
          {/* Hero + Search + Bookmarks sections remain the same as your original code */}
          {/* (I kept them minimal for brevity - you can paste your original list section here if you want) */}
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div className="qf" style={{ fontSize: 42, color: GREEN_DARK }}>﷽</div>
            <h1 style={{ color: GREEN_DARK, margin: '10px 0 4px' }}>القرآن الكريم</h1>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search surah name or number..."
              style={{ width: '100%', padding: '14px 20px', borderRadius: 12, border: `1px solid ${borderCol}`, background: cardBg, fontSize: 16 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(s => (
              <div key={s.number} style={{ background: cardBg, border: `1px solid ${borderCol}`, borderRadius: 12, padding: 4 }}>
                <button
                  onClick={() => loadSurah(s)}
                  style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                >
                  <div style={{ width: 42, height: 42, background: GREEN_DARK, color: GOLD, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {s.number}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 13, color: subCol }}>{s.meaning} • {s.verses} verses</div>
                  </div>
                  <span className="qf" style={{ fontSize: 26 }}>{s.arabic}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* READING VIEW */}
      {selectedSurah && (
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '10px 12px 60px' }}>
          {loading && <div style={{ textAlign: 'center', padding: '100px 20px' }}><div className="qf" style={{ fontSize: 70, color: GOLD }}>﷽</div><p>Loading...</p></div>}
          
          {error && <div style={{ padding: 20, background: '#fee', color: 'red', borderRadius: 12 }}>{error}</div>}

          {verses.length > 0 && (
            <div style={{
              background: '#f8f1e3',
              border: '4px double #c8a96e',
              borderRadius: 12,
              boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}>
              {/* Green Header with Bismillah - Only Once */}
              <div style={{
                background: 'linear-gradient(to right, #1a3c2f, #234d3a, #1a3c2f)',
                padding: '22px 20px 18px',
                textAlign: 'center',
                borderBottom: '3px solid #c8a96e',
              }}>
                <p className="qf" style={{ fontSize: '32px', color: '#f4e8c1', margin: 0, lineHeight: 1.6 }}>
                  بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
                </p>
              </div>

              <div style={{ padding: '40px 32px 50px' }}>
                {/* Surah Name */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                  <div style={{ display: 'inline-block', padding: '16px 48px', border: `3px solid ${GOLD}`, borderRadius: 16, background: 'rgba(255,255,255,0.6)' }}>
                    <p className="qf" style={{ fontSize: '42px', color: '#1a3c2f', margin: '0 0 8px 0' }}>{selectedSurah.arabic}</p>
                    <p style={{ margin: 0, color: '#444', fontSize: '16px' }}>{selectedSurah.name} • {selectedSurah.meaning}</p>
                  </div>
                </div>

                {/* Mushaf Mode */}
                {mode === 'mushaf' && (
                  <p
                    dir="rtl"
                    className="qf mushaf-text"
                    style={{
                      fontSize: FONT_SIZES[fontSize].size,
                      color: '#1a3c2f',
                      wordSpacing: '8px',
                      margin: 0,
                    }}
                  >
                    {displayVerses.map(v => (
                      <span key={v.number}>
                        {v.arabic}
                        <VerseEnd num={v.number} />
                      </span>
                    ))}
                  </p>
                )}

                {/* Verse Mode */}
                {mode === 'verse' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    {displayVerses.map(v => (
                      <div key={v.number} style={{ background: 'rgba(255,255,255,0.9)', padding: '24px', borderRadius: 14, border: '1px solid #d4c9a0' }}>
                        <p className="qf" dir="rtl" style={{
                          fontSize: FONT_SIZES[fontSize].size,
                          color: '#1a3c2f',
                          lineHeight: 2.8,
                          margin: '0 0 16px 0',
                        }}>
                          {v.arabic} <VerseEnd num={v.number} />
                        </p>
                        {showTranslation && <p style={{ color: '#444', lineHeight: 1.75 }}>{v.translation}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* End Marker */}
                <div style={{ textAlign: 'center', marginTop: 60 }}>
                  <p className="qf" style={{ fontSize: '29px', color: '#1a3c2f' }}>
                    ۝ صَدَقَ اللَّهُ الْعَظِيْمُ ۝
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}