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
  { label: 'S', value: '24px', line: 2.6 },
  { label: 'M', value: '30px', line: 2.8 },
  { label: 'L', value: '36px', line: 3.0 },
  { label: 'XL', value: '44px', line: 3.2 },
];

// Authentic mushaf green palette
const MUSHAF_GREEN   = '#1b6b3a';   // deep rich green like printed Quran
const MUSHAF_BORDER  = '#c8a020';   // gold border
const MUSHAF_BG      = '#1d7040';   // page background green
const MUSHAF_STRIPE  = '#1a6438';   // slightly darker for alternate rows
const HEADER_BG      = '#0f4a26';   // dark header

export default function QuranReader() {
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [verses, setVerses]               = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [search, setSearch]               = useState('');
  const [fontSize, setFontSize]           = useState(1);   // index into FONT_SIZES
  const [showTrans, setShowTrans]         = useState(false);
  const [bookmarks, setBookmarks]         = useState(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(localStorage.getItem('quran_bm') || '[]'); } catch { return []; }
    }
    return [];
  });
  const pageRef = useRef(null);

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
    if (pageRef.current) pageRef.current.scrollTo({ top: 0 });
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
    try { localStorage.setItem('quran_bm', JSON.stringify(updated)); } catch {}
  }
  const isBookmarked = n => bookmarks.some(b => b.number === n);

  // The API for surah 1 returns verse 1 as bismillah text — we skip it since we show bismillah in header
  // For all other surahs, API does NOT include bismillah as a verse
  const displayVerses = selectedSurah?.number === 1
    ? verses.filter(v => v.number !== 1)
    : verses;

  return (
    <div style={{ minHeight: '100vh', background: '#0f2d1a', fontFamily: 'Georgia, serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap');
        .qf { font-family: 'Scheherazade New', 'Traditional Arabic', 'KFGQPC Uthmanic Script HAFS', serif !important; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0f2d1a; }
        ::-webkit-scrollbar-thumb { background: ${MUSHAF_BORDER}66; border-radius: 3px; }
      `}</style>

      {/* ══ TOP NAV BAR ══ */}
      <div style={{ background: HEADER_BG, borderBottom: `2px solid ${MUSHAF_BORDER}`, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px #00000060' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {selectedSurah
            ? <button onClick={() => { setSelectedSurah(null); setVerses([]); }}
                style={{ color: '#c8c8b0', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 6 }}>
                ← Surahs
              </button>
            : <Link href="/" style={{ color: '#c8c8b0', fontSize: 13, padding: '6px 10px', textDecoration: 'none' }}>← Back</Link>
          }

          <div style={{ flex: 1, textAlign: 'center' }}>
            {selectedSurah ? (
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}>{selectedSurah.name} · {selectedSurah.meaning}</div>
                <div className="qf" style={{ color: MUSHAF_BORDER, fontSize: 22, lineHeight: 1.3 }}>{selectedSurah.arabic}</div>
              </div>
            ) : (
              <div>
                <div className="qf" style={{ color: MUSHAF_BORDER, fontSize: 26, lineHeight: 1.4 }}>القرآن الكريم</div>
                <div style={{ color: '#c8c8b066', fontSize: 11, letterSpacing: 2 }}>THE NOBLE QURAN</div>
              </div>
            )}
          </div>

          {selectedSurah ? (
            <button onClick={() => toggleBookmark(selectedSurah)}
              style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', color: isBookmarked(selectedSurah.number) ? MUSHAF_BORDER : '#555', padding: 6 }}>
              🔖
            </button>
          ) : (
            <div style={{ width: 40 }} />
          )}
        </div>
      </div>

      {/* ══ SURAH LIST ══ */}
      {!selectedSurah && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 14px 50px' }}>

          {/* Hero */}
          <div style={{ background: `linear-gradient(160deg, #0f4a26, #1b6b3a, #0f4a26)`, borderRadius: 16, padding: '28px 20px 22px', textAlign: 'center', marginBottom: 18, border: `2px solid ${MUSHAF_BORDER}55`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'repeating-linear-gradient(45deg,#c8a020 0,#c8a020 1px,transparent 0,transparent 8px)', backgroundSize: '8px 8px' }} />
            {/* Decorative top line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${MUSHAF_BORDER})` }} />
              <span style={{ color: MUSHAF_BORDER, fontSize: 16 }}>✦</span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${MUSHAF_BORDER})` }} />
            </div>
            <p className="qf" style={{ fontSize: 36, color: '#fff', margin: '0 0 6px', lineHeight: 1.9, textShadow: '0 2px 8px #00000040' }}>
              بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', margin: '14px 0 8px' }}>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${MUSHAF_BORDER})` }} />
              <span style={{ color: MUSHAF_BORDER, fontSize: 16 }}>✦</span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${MUSHAF_BORDER})` }} />
            </div>
            <p style={{ color: '#c8c8b099', fontSize: 12, letterSpacing: 2 }}>114 SURAHS · 6,236 VERSES · 30 JUZ</p>
          </div>

          {/* Bookmarks */}
          {bookmarks.length > 0 && (
            <div style={{ background: '#122a1a', border: `1px solid ${MUSHAF_BORDER}44`, borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: MUSHAF_BORDER, fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>🔖 BOOKMARKED</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {bookmarks.map(s => (
                  <button key={s.number} onClick={() => loadSurah(s)}
                    style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${MUSHAF_BORDER}55`, background: '#1a3a24', color: '#d4c8a0', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="qf" style={{ fontSize: 17 }}>{s.arabic}</span> {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search surah by name, meaning, or number..."
              style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: 10, border: `1px solid #2a4a30`, background: '#122a1a', color: '#d4c8a0', fontSize: 14, outline: 'none' }} />
          </div>
          <p style={{ fontSize: 11, color: '#4a6a50', marginBottom: 10, paddingLeft: 2 }}>{filtered.length} surahs</p>

          {/* Surah list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.map(s => (
              <div key={s.number} style={{ background: '#122a1a', border: `1px solid #2a4a30`, borderRadius: 10, display: 'flex', alignItems: 'center', overflow: 'hidden', transition: 'border-color .15s' }}>
                <button onClick={() => loadSurah(s)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  {/* Number badge */}
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: HEADER_BG, border: `1px solid ${MUSHAF_BORDER}55`, color: MUSHAF_BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                    {s.number}
                  </div>
                  {/* Name */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#d4c8a0' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#5a7a60' }}>{s.meaning} · {s.verses} verses · Juz {s.juz}</div>
                  </div>
                  {/* Arabic */}
                  <span className="qf" style={{ fontSize: 22, color: '#c8e0cc', flexShrink: 0 }}>{s.arabic}</span>
                </button>
                <button onClick={() => toggleBookmark(s)}
                  style={{ padding: '11px 12px', background: 'none', border: 'none', borderLeft: '1px solid #2a4a30', cursor: 'pointer', fontSize: 16, color: isBookmarked(s.number) ? MUSHAF_BORDER : '#2a4a30' }}>
                  🔖
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ READING VIEW ══ */}
      {selectedSurah && (
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '16px 12px 60px' }}>

          {/* Controls bar */}
          <div style={{ background: '#0f2d1a', border: `1px solid #2a4a30`, borderRadius: 10, padding: '9px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, position: 'sticky', top: 70, zIndex: 40 }}>
            {/* Font size */}
            <div style={{ display: 'flex', gap: 3 }}>
              {FONT_SIZES.map((f, i) => (
                <button key={i} onClick={() => setFontSize(i)}
                  style={{ width: 30, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: fontSize === i ? MUSHAF_BORDER : '#1a3a24', color: fontSize === i ? '#0f2d1a' : '#5a7a60', transition: 'all .15s' }}>
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ height: 20, width: 1, background: '#2a4a30' }} />
            {/* Translation toggle */}
            <button onClick={() => setShowTrans(v => !v)}
              style={{ padding: '5px 12px', borderRadius: 7, border: `1px solid ${showTrans ? MUSHAF_BORDER : '#2a4a30'}`, background: showTrans ? '#1a3a24' : 'transparent', color: showTrans ? MUSHAF_BORDER : '#5a7a60', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              🌐 Translation {showTrans ? 'ON' : 'OFF'}
            </button>
            <div style={{ marginLeft: 'auto', color: '#5a7a60', fontSize: 11 }}>
              {selectedSurah.verses} verses · Juz {selectedSurah.juz}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p className="qf" style={{ fontSize: 56, color: MUSHAF_BORDER }}>﷽</p>
              <p style={{ color: '#5a7a60', fontSize: 14, marginTop: 16 }}>Loading {selectedSurah.name}…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: '#2d0f0f', border: '1px solid #7a2020', borderRadius: 10, padding: 16, color: '#e07070', fontSize: 14, textAlign: 'center' }}>{error}</div>
          )}

          {/* ── THE MUSHAF PAGE ── */}
          {verses.length > 0 && !loading && (
            <>
              {/* Outer frame — mimics the green printed Quran */}
              <div style={{
                background: MUSHAF_BG,
                border: `4px solid ${MUSHAF_BORDER}`,
                borderRadius: 4,
                boxShadow: `0 0 0 8px #0f2d1a, 0 0 0 10px ${MUSHAF_BORDER}44, 0 8px 40px #00000080`,
                position: 'relative',
                overflow: 'hidden',
              }}>

                {/* Inner border line */}
                <div style={{ position: 'absolute', inset: 10, border: `1px solid ${MUSHAF_BORDER}55`, borderRadius: 2, pointerEvents: 'none', zIndex: 1 }} />

                <div style={{ padding: '28px 24px 28px', position: 'relative', zIndex: 2 }}>

                  {/* ── SURAH HEADER BOX (like printed Quran) ── */}
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    {/* Decorative rule above */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ flex: 1, height: 2, background: MUSHAF_BORDER }} />
                      <span style={{ color: MUSHAF_BORDER, fontSize: 14 }}>❧</span>
                      <div style={{ flex: 1, height: 2, background: MUSHAF_BORDER }} />
                    </div>

                    {/* Surah name oval — authentic style */}
                    <div style={{ display: 'inline-block', border: `2px solid ${MUSHAF_BORDER}`, borderRadius: 100, padding: '12px 48px', background: 'rgba(0,0,0,0.18)', position: 'relative' }}>
                      {/* Surah number badge */}
                      <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: MUSHAF_BG, padding: '0 10px' }}>
                        <span style={{ color: MUSHAF_BORDER, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>سورة {toArabicNum(selectedSurah.number)}</span>
                      </div>
                      <p className="qf" style={{ fontSize: 36, color: '#fff', margin: 0, lineHeight: 1.6 }}>{selectedSurah.arabic}</p>
                      <p style={{ color: '#ffffffaa', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', margin: '2px 0 0' }}>{selectedSurah.name} · {selectedSurah.meaning}</p>
                    </div>

                    {/* Decorative rule below */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                      <div style={{ flex: 1, height: 2, background: MUSHAF_BORDER }} />
                      <span style={{ color: MUSHAF_BORDER, fontSize: 14 }}>❧</span>
                      <div style={{ flex: 1, height: 2, background: MUSHAF_BORDER }} />
                    </div>
                  </div>

                  {/* ── BISMILLAH — shown ONCE, not for At-Tawbah (9) ── */}
                  {selectedSurah.number !== 9 && (
                    <div style={{ textAlign: 'center', marginBottom: 18, paddingBottom: 18, borderBottom: `1px solid ${MUSHAF_BORDER}44` }}>
                      <p className="qf" style={{ fontSize: 30, color: '#fff', lineHeight: 2.0, margin: 0, textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>
                        بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ
                      </p>
                    </div>
                  )}

                  {/* ── VERSE TEXT — continuous mushaf style ── */}
                  <div dir="rtl" style={{ textAlign: 'justify', textAlignLast: 'right' }}>
                    <p className="qf" style={{
                      fontSize: FONT_SIZES[fontSize].value,
                      lineHeight: FONT_SIZES[fontSize].line,
                      color: '#000',           // BLACK text like real printed Quran
                      margin: 0,
                      wordSpacing: 4,
                      textShadow: 'none',
                    }}>
                      {displayVerses.map(v => (
                        <span key={v.number}>
                          {v.arabic}
                          {/* Verse number circle */}
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '1.8em', height: '1.8em', borderRadius: '50%',
                            fontSize: '0.48em',
                            margin: '0 0.2em',
                            verticalAlign: 'middle',
                            background: 'rgba(0,0,0,0.15)',
                            border: '1px solid rgba(0,0,0,0.25)',
                            color: '#000',
                            flexShrink: 0,
                            fontFamily: "'Scheherazade New', serif",
                          }}>
                            {toArabicNum(v.number)}
                          </span>
                        </span>
                      ))}
                    </p>
                  </div>

                  {/* ── TRANSLATION (if on) ── */}
                  {showTrans && displayVerses.some(v => v.translation) && (
                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: `2px solid ${MUSHAF_BORDER}44` }}>
                      <p style={{ color: MUSHAF_BORDER, fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 14, textAlign: 'center' }}>TRANSLATION (Asad)</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {displayVerses.filter(v => v.translation).map(v => (
                          <div key={v.number} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.15)', border: `1px solid ${MUSHAF_BORDER}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0, marginTop: 2 }}>{v.number}</span>
                            <p style={{ color: '#ffffffcc', fontSize: 13, lineHeight: 1.75, margin: 0, fontStyle: 'italic' }}>{v.translation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── End of Surah ── */}
                  <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 18, borderTop: `2px solid ${MUSHAF_BORDER}44` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ flex: 1, height: 1, background: MUSHAF_BORDER }} />
                      <p className="qf" style={{ color: '#fff', fontSize: 22, margin: 0 }}>صَدَقَ اللَّهُ الْعَظِيمُ</p>
                      <div style={{ flex: 1, height: 1, background: MUSHAF_BORDER }} />
                    </div>
                    <p style={{ color: '#ffffff55', fontSize: 11, letterSpacing: 1 }}>END OF SURAH {selectedSurah.name.toUpperCase()}</p>
                  </div>
                </div>
              </div>

              {/* ── Navigation ── */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
                {selectedSurah.number > 1 && (
                  <button onClick={() => loadSurah(SURAHS.find(s => s.number === selectedSurah.number - 1))}
                    style={{ padding: '11px 22px', borderRadius: 10, border: `1px solid #2a4a30`, background: '#122a1a', color: '#d4c8a0', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    ← Previous Surah
                  </button>
                )}
                {selectedSurah.number < 114 && (
                  <button onClick={() => loadSurah(SURAHS.find(s => s.number === selectedSurah.number + 1))}
                    style={{ padding: '11px 22px', borderRadius: 10, border: 'none', background: HEADER_BG, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, borderTop: `2px solid ${MUSHAF_BORDER}44` }}>
                    Next Surah →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}