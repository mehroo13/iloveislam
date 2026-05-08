'use client';
import { useState, useEffect, useRef } from 'react';
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
  { label: 'S', arabic: 'text-xl', trans: 'text-sm' },
  { label: 'M', arabic: 'text-2xl', trans: 'text-sm' },
  { label: 'L', arabic: 'text-3xl', trans: 'text-base' },
  { label: 'XL', arabic: 'text-4xl', trans: 'text-base' },
];

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
      const s = localStorage.getItem('quran_bookmarks');
      return s ? JSON.parse(s) : [];
    }
    return [];
  });
  const [showBookmarks, setShowBookmarks] = useState(false);
  const topRef = useRef(null);

  const filtered = SURAHS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.arabic.includes(search) ||
    s.meaning.toLowerCase().includes(search.toLowerCase()) ||
    s.number.toString().includes(search)
  );

  // Theme colors
  const bg = dark ? '#0d1117' : '#f5f0e8';
  const cardBg = dark ? '#161b22' : '#fffdf7';
  const borderColor = dark ? '#30363d' : '#e8dfc8';
  const textMain = dark ? '#e6d5b8' : '#2c1810';
  const textSub = dark ? '#8b949e' : '#7a6552';
  const gold = '#c8a96e';
  const green = '#0a3d2e';

  async function loadSurah(surah) {
    setSelectedSurah(surah);
    setVerses([]);
    setLoading(true);
    setError('');
    setShowBookmarks(false);
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
    } catch { setError('Network error. Please check your connection.'); }
    setLoading(false);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function toggleBookmark(surah) {
    const exists = bookmarks.find(b => b.number === surah.number);
    const updated = exists ? bookmarks.filter(b => b.number !== surah.number) : [...bookmarks, surah];
    setBookmarks(updated);
    localStorage.setItem('quran_bookmarks', JSON.stringify(updated));
  }

  function isBookmarked(surah) {
    return bookmarks.some(b => b.number === surah.number);
  }

  const SurahHeader = ({ surah }) => (
    <div className="text-center mb-6 mt-2">
      {/* Decorative border top */}
      <div style={{ borderColor: gold }} className="border-t-2 mx-8 mb-4" />
      {/* Surah name box */}
      <div className="inline-block px-10 py-4 rounded-xl relative"
        style={{ background: dark ? '#1c2a1e' : '#e8f5ed', border: `2px solid ${gold}` }}>
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
          style={{ background: gold, color: '#fff', fontWeight: 'bold' }}>
          {surah.number}
        </div>
        <p className="font-arabic text-4xl mb-1" style={{ color: textMain }}>{surah.arabic}</p>
        <p style={{ color: textSub }} className="text-sm tracking-widest uppercase">{surah.name} · {surah.meaning}</p>
        <p style={{ color: textSub }} className="text-xs mt-1">{surah.verses} Verses · Juz {surah.juz}</p>
      </div>
      <div style={{ borderColor: gold }} className="border-b-2 mx-8 mt-4" />
    </div>
  );

  const Bismillah = () => (
    <div className="text-center my-6">
      <div className="inline-block px-8 py-3 rounded-2xl"
        style={{ background: dark ? '#1c2a1e' : '#e8f5ed', border: `1px solid ${borderColor}` }}>
        <p className="font-arabic text-3xl md:text-4xl leading-loose" style={{ color: textMain }}>
          بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ
        </p>
        <p className="text-xs mt-1" style={{ color: textSub }}>In the name of Allah, the Most Gracious, the Most Merciful</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: bg, color: textMain }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Scheherazade+New:wght@400;700&display=swap');
        .font-arabic { font-family: 'Scheherazade New', 'Amiri Quran', serif !important; }
        .verse-marker {
          display: inline-flex; align-items: center; justify-content: center;
          width: 2em; height: 2em; border-radius: 50%;
          font-family: 'Scheherazade New', serif;
          font-size: 0.7em; margin: 0 0.4em;
          vertical-align: middle; flex-shrink: 0;
        }
        .surah-card:hover { transform: translateY(-1px); transition: all 0.2s; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { border-radius: 3px; background: #c8a96e55; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3 flex items-center gap-3 shadow-sm" ref={topRef}
        style={{ background: dark ? '#161b22ee' : '#0a3d2eee', backdropFilter: 'blur(10px)' }}>
        {selectedSurah ? (
          <button onClick={() => { setSelectedSurah(null); setVerses([]); }}
            className="text-white/70 hover:text-white text-sm px-3 py-1.5 rounded-lg transition-all hover:bg-white/10">
            ← Surahs
          </button>
        ) : (
          <Link href="/" className="text-white/70 hover:text-white text-sm px-3 py-1.5 rounded-lg transition-all hover:bg-white/10">
            ← Back
          </Link>
        )}

        <div className="flex-1 text-center">
          {selectedSurah ? (
            <div>
              <p className="text-white font-semibold text-sm">{selectedSurah.name}</p>
              <p className="font-arabic text-white/60 text-base leading-none">{selectedSurah.arabic}</p>
            </div>
          ) : (
            <p className="text-white font-semibold tracking-wide">📖 Quran Reader</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Bookmarks */}
          {!selectedSurah && (
            <button onClick={() => setShowBookmarks(!showBookmarks)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-all ${showBookmarks ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
              🔖 {bookmarks.length > 0 ? bookmarks.length : ''}
            </button>
          )}
          {/* Dark mode */}
          <button onClick={() => setDark(!dark)}
            className="text-xl px-2 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all">
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* SURAH LIST */}
      {!selectedSurah && (
        <main className="max-w-2xl mx-auto px-4 py-6">
          {/* Hero banner */}
          <div className="rounded-3xl p-6 mb-6 text-center relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${green} 0%, #1a5c3a 100%)`, border: `1px solid ${gold}33` }}>
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #c8a96e 0, #c8a96e 1px, transparent 0, transparent 50%)',
              backgroundSize: '12px 12px'
            }} />
            <p className="font-arabic text-4xl mb-2 relative" style={{ color: gold }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="text-white/60 text-sm relative">The Noble Quran · 114 Surahs · 6236 Verses</p>
          </div>

          {/* Bookmarks section */}
          {showBookmarks && bookmarks.length > 0 && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
              <p className="text-sm font-semibold mb-3" style={{ color: textSub }}>🔖 Bookmarked Surahs</p>
              <div className="space-y-2">
                {bookmarks.map(s => (
                  <button key={s.number} onClick={() => loadSurah(s)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all hover:opacity-80"
                    style={{ background: dark ? '#1c2a1e' : '#e8f5ed', border: `1px solid ${gold}44` }}>
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: green, color: gold }}>{s.number}</span>
                    <span className="flex-1 text-sm font-medium" style={{ color: textMain }}>{s.name}</span>
                    <span className="font-arabic text-lg" style={{ color: textMain }}>{s.arabic}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔍</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, meaning, or number..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none transition-all"
              style={{ background: cardBg, border: `1px solid ${borderColor}`, color: textMain }} />
          </div>

          <p className="text-xs mb-3" style={{ color: textSub }}>{filtered.length} surahs</p>

          <div className="space-y-2">
            {filtered.map(surah => (
              <div key={surah.number} className="surah-card flex items-center gap-1 rounded-2xl overflow-hidden"
                style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                <button onClick={() => loadSurah(surah)} className="flex items-center gap-3 flex-1 px-4 py-3.5 text-left">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: green, color: gold }}>
                    {surah.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: textMain }}>{surah.name}</p>
                    <p className="text-xs truncate" style={{ color: textSub }}>{surah.meaning} · {surah.verses} verses · Juz {surah.juz}</p>
                  </div>
                  <p className="font-arabic text-2xl flex-shrink-0 ml-2" style={{ color: textMain }}>{surah.arabic}</p>
                </button>
                <button onClick={() => toggleBookmark(surah)}
                  className="px-3 py-3.5 text-lg transition-all hover:scale-110"
                  style={{ color: isBookmarked(surah) ? gold : dark ? '#3d3d3d' : '#ccc' }}>
                  🔖
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* READING VIEW */}
      {selectedSurah && (
        <main className="max-w-3xl mx-auto px-3 md:px-6 py-4">
          {/* Controls bar */}
          <div className="rounded-2xl p-3 mb-4 flex items-center gap-2 flex-wrap sticky top-16 z-40 shadow-sm"
            style={{ background: dark ? '#161b22ee' : '#fffdf7ee', backdropFilter: 'blur(8px)', border: `1px solid ${borderColor}` }}>

            {/* Mode toggle */}
            <div className="flex rounded-xl p-0.5 text-xs gap-0.5" style={{ background: dark ? '#0d1117' : '#f0e8d5' }}>
              <button onClick={() => setMode('mushaf')}
                className="px-3 py-2 rounded-lg font-medium transition-all"
                style={mode === 'mushaf' ? { background: green, color: 'white' } : { color: textSub }}>
                📜 Mushaf
              </button>
              <button onClick={() => setMode('verse')}
                className="px-3 py-2 rounded-lg font-medium transition-all"
                style={mode === 'verse' ? { background: green, color: 'white' } : { color: textSub }}>
                📋 Verse
              </button>
            </div>

            {/* Font size */}
            <div className="flex items-center gap-1 ml-auto">
              {FONT_SIZES.map((f, i) => (
                <button key={i} onClick={() => setFontSize(i)}
                  className="w-7 h-7 rounded-lg text-xs font-bold transition-all"
                  style={fontSize === i
                    ? { background: gold, color: '#fff' }
                    : { color: textSub, background: dark ? '#0d1117' : '#f0e8d5' }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Translation toggle */}
            {mode === 'verse' && (
              <button onClick={() => setShowTranslation(!showTranslation)}
                className="text-xs px-3 py-2 rounded-lg font-medium transition-all border"
                style={showTranslation
                  ? { background: dark ? '#1c2a1e' : '#e8f5ed', borderColor: gold, color: gold }
                  : { borderColor, color: textSub }}>
                EN {showTranslation ? 'ON' : 'OFF'}
              </button>
            )}

            {/* Bookmark current surah */}
            <button onClick={() => toggleBookmark(selectedSurah)}
              className="text-lg transition-all hover:scale-110"
              style={{ color: isBookmarked(selectedSurah) ? gold : dark ? '#3d3d3d' : '#ccc' }}>
              🔖
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-24">
              <p className="font-arabic text-6xl mb-4 animate-pulse" style={{ color: gold }}>﷽</p>
              <p style={{ color: textSub }} className="text-sm">Loading {selectedSurah.name}...</p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl p-5 text-center" style={{ background: '#fee', border: '1px solid #fcc' }}>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {verses.length > 0 && (
            <>
              <SurahHeader surah={selectedSurah} />

              {/* Bismillah — shown for all surahs except At-Tawbah (9) */}
              {selectedSurah.number !== 9 && <Bismillah />}

              {/* Al-Fatihah special note */}
              {selectedSurah.number === 1 && (
                <p className="text-center text-xs mb-4" style={{ color: textSub }}>
                  ✦ The Opening — recited in every unit of prayer ✦
                </p>
              )}

              {/* ── MUSHAF MODE ── */}
              {mode === 'mushaf' && (
                <div className="rounded-3xl p-5 md:p-8 mb-6"
                  style={{ background: cardBg, border: `2px solid ${borderColor}` }}>
                  {/* Decorative corner elements */}
                  <div className="absolute top-2 left-2 w-8 h-8 opacity-20" style={{ color: gold }}>✦</div>

                  <p className={`font-arabic ${FONT_SIZES[fontSize].arabic} leading-loose text-justify`}
                    dir="rtl"
                    style={{
                      color: textMain,
                      lineHeight: '3',
                      wordSpacing: '6px',
                      textAlignLast: 'justify',
                    }}>
                    {verses.map((verse) => (
                      <span key={verse.number}>
                        {verse.arabic}
                        <span className="verse-marker inline-flex"
                          style={{ background: dark ? '#1c2a1e' : '#e8f5ed', color: gold, border: `1px solid ${gold}66` }}>
                          {toArabicNum(verse.number)}
                        </span>
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {/* ── VERSE BY VERSE MODE ── */}
              {mode === 'verse' && (
                <div className="space-y-3 mb-6">
                  {verses.map(verse => (
                    <div key={verse.number} className="rounded-2xl overflow-hidden"
                      style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                      {/* Verse number header */}
                      <div className="px-4 py-2 flex items-center gap-2"
                        style={{ background: dark ? '#1c2a1e' : '#e8f5ed', borderBottom: `1px solid ${borderColor}` }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: gold, color: '#fff' }}>
                          {verse.number}
                        </div>
                        <span className="text-xs" style={{ color: textSub }}>
                          {selectedSurah.name} · Ayah {verse.number}
                        </span>
                      </div>

                      {/* Arabic text */}
                      <div className="px-5 py-5">
                        <p className={`font-arabic ${FONT_SIZES[fontSize].arabic} leading-loose text-right`}
                          dir="rtl" style={{ color: textMain, lineHeight: '2.8' }}>
                          {verse.arabic}
                          <span className="verse-marker inline-flex ml-2"
                            style={{ background: dark ? '#1c2a1e' : '#e8f5ed', color: gold, border: `1px solid ${gold}66`, fontSize: '0.55em' }}>
                            {toArabicNum(verse.number)}
                          </span>
                        </p>

                        {/* Translation */}
                        {showTranslation && verse.translation && (
                          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${borderColor}` }}>
                            <p className="text-xs mb-1 font-medium" style={{ color: gold }}>Muhammad Asad Translation</p>
                            <p className={`${FONT_SIZES[fontSize].trans} leading-relaxed`} style={{ color: textSub }}>
                              {verse.translation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* End of surah */}
              <div className="text-center py-6 mb-6">
                <div style={{ borderColor: gold }} className="border-t mx-12 mb-4" />
                <p className="font-arabic text-2xl" style={{ color: gold }}>
                  ۝ صَدَقَ اللَّهُ الْعَظِيمُ ۝
                </p>
                <p className="text-xs mt-2" style={{ color: textSub }}>
                  Sadaqa Allahu Al-Azim · Allah the Almighty has spoken the truth
                </p>
                <p className="text-xs mt-1" style={{ color: textSub }}>
                  End of Surah {selectedSurah.name} · {selectedSurah.verses} Verses
                </p>

                {/* Navigate to next/prev surah */}
                <div className="flex gap-3 justify-center mt-5">
                  {selectedSurah.number > 1 && (
                    <button onClick={() => loadSurah(SURAHS.find(s => s.number === selectedSurah.number - 1))}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                      style={{ background: dark ? '#1c2a1e' : '#e8f5ed', color: textMain, border: `1px solid ${borderColor}` }}>
                      ← Previous Surah
                    </button>
                  )}
                  {selectedSurah.number < 114 && (
                    <button onClick={() => loadSurah(SURAHS.find(s => s.number === selectedSurah.number + 1))}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all text-white"
                      style={{ background: green }}>
                      Next Surah →
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      )}
    </div>
  );
}