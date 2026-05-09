'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

// ── TRANSLATIONS ──
const TRANSLATIONS: Record<string, {
  tagline: string; search: string; found: string; results: string;
  noTools: string; noToolsSub: string; clear: string;
  about: string; blog: string; privacy: string;
  mostUsed: string; daily: string; finance: string; travel: string;
  footerMade: string; footerFree: string;
  stats: { tools: string; free: string; noSignup: string; mobile: string; world: string; fast: string };
  aboutTitle: string; aboutText1: string; aboutText2: string;
}> = {
  en: {
    tagline: 'The complete toolkit for every Muslim',
    search: 'Search tools — zakat, qibla, quran...',
    found: 'Found', results: 'result',
    noTools: 'No tools found', noToolsSub: 'Try searching: zakat, prayer, quran, qibla...',
    clear: 'Clear Search',
    about: 'About', blog: 'Blog', privacy: 'Privacy',
    mostUsed: 'Most Used', daily: 'Daily Practice', finance: 'Finance & Giving', travel: 'Travel & Knowledge',
    footerMade: 'Made with ❤️ for the Ummah', footerFree: 'Always Free · No Sign-up',
    stats: { tools: '20 Free Tools', free: '100% Free', noSignup: 'No Sign-up', mobile: 'Works on Mobile', world: 'Works Worldwide', fast: 'Always Fast' },
    aboutTitle: 'About I Love Islam Tools',
    aboutText1: 'I Love Islam is a free collection of Islamic tools designed for Muslims worldwide. Whether you need to calculate your annual Zakat, find accurate Prayer Times for your city, locate the Qibla direction, or read the Quran with translation — everything is available in one place, completely free.',
    aboutText2: 'Our tools include a Hijri Calendar converter, Dhikr counter, 99 Names of Allah, Halal Travel guide, Mosque Finder, Islamic Inheritance Calculator, and our unique Mizan Islamic Life Blueprint — all built with love for the Ummah.',
  },
  ar: {
    tagline: 'مجموعة أدوات إسلامية مجانية لكل مسلم',
    search: 'ابحث عن الأدوات — زكاة، قبلة، قرآن...',
    found: 'وجد', results: 'نتيجة',
    noTools: 'لم يتم العثور على أدوات', noToolsSub: 'جرب البحث: زكاة، صلاة، قرآن...',
    clear: 'مسح البحث',
    about: 'عن الموقع', blog: 'مدونة', privacy: 'الخصوصية',
    mostUsed: 'الأكثر استخداماً', daily: 'الممارسة اليومية', finance: 'المال والعطاء', travel: 'السفر والمعرفة',
    footerMade: 'صُنع بمحبة للأمة الإسلامية', footerFree: 'مجاني دائماً · لا تسجيل',
    stats: { tools: '٢٠ أداة مجانية', free: '١٠٠٪ مجاني', noSignup: 'لا تسجيل', mobile: 'يعمل على الجوال', world: 'يعمل في كل مكان', fast: 'سريع دائماً' },
    aboutTitle: 'عن أدوات أحب الإسلام',
    aboutText1: 'أحب الإسلام هو مجموعة مجانية من الأدوات الإسلامية المصممة للمسلمين في جميع أنحاء العالم.',
    aboutText2: 'تشمل أدواتنا محوّل التقويم الهجري وعداد الذكر وأسماء الله الحسنى ودليل السفر الحلال والمزيد.',
  },
  ur: {
    tagline: 'ہر مسلمان کے لیے مکمل اسلامی ٹول کٹ',
    search: 'ٹولز تلاش کریں — زکوٰۃ، قبلہ، قرآن...',
    found: 'ملا', results: 'نتیجہ',
    noTools: 'کوئی ٹول نہیں ملا', noToolsSub: 'تلاش کریں: زکوٰۃ، نماز، قرآن...',
    clear: 'تلاش صاف کریں',
    about: 'ہمارے بارے میں', blog: 'بلاگ', privacy: 'رازداری',
    mostUsed: 'سب سے زیادہ استعمال', daily: 'روزانہ عبادت', finance: 'مال اور صدقہ', travel: 'سفر اور علم',
    footerMade: 'امت کے لیے محبت سے بنایا گیا', footerFree: 'ہمیشہ مفت · کوئی رجسٹریشن نہیں',
    stats: { tools: '٢٠ مفت ٹولز', free: '١٠٠٪ مفت', noSignup: 'کوئی سائن اپ نہیں', mobile: 'موبائل پر چلتا ہے', world: 'دنیا بھر میں', fast: 'ہمیشہ تیز' },
    aboutTitle: 'I Love Islam ٹولز کے بارے میں',
    aboutText1: 'I Love Islam دنیا بھر کے مسلمانوں کے لیے مفت اسلامی ٹولز کا مجموعہ ہے۔ زکوٰۃ، نماز کے اوقات، قبلہ اور قرآن — سب ایک جگہ۔',
    aboutText2: 'ہمارے ٹولز میں ہجری کیلنڈر، ذکر کاؤنٹر، اللہ کے ۹۹ نام، میزان لائف بلیو پرنٹ اور بہت کچھ شامل ہے۔',
  },
  fr: {
    tagline: 'La boîte à outils islamique complète pour chaque Muslim',
    search: 'Rechercher — zakat, qibla, coran...',
    found: 'Trouvé', results: 'résultat',
    noTools: 'Aucun outil trouvé', noToolsSub: 'Essayez: zakat, prière, coran...',
    clear: 'Effacer',
    about: 'À propos', blog: 'Blog', privacy: 'Confidentialité',
    mostUsed: 'Les plus utilisés', daily: 'Pratique quotidienne', finance: 'Finance & Dons', travel: 'Voyage & Savoir',
    footerMade: 'Fait avec ❤️ pour la Oumma', footerFree: 'Toujours gratuit · Sans inscription',
    stats: { tools: '20 Outils gratuits', free: '100% Gratuit', noSignup: 'Sans inscription', mobile: 'Mobile', world: 'Mondial', fast: 'Rapide' },
    aboutTitle: 'À propos de I Love Islam',
    aboutText1: 'I Love Islam est une collection gratuite d\'outils islamiques pour les musulmans du monde entier.',
    aboutText2: 'Calculateur de Zakat, horaires de prière, direction de la Qibla, lecture du Coran et bien plus encore.',
  },
  tr: {
    tagline: 'Her Müslüman için tam İslami araç seti',
    search: 'Araçları ara — zekat, kıble, kuran...',
    found: 'Bulundu', results: 'sonuç',
    noTools: 'Araç bulunamadı', noToolsSub: 'Deneyin: zekat, namaz, kuran...',
    clear: 'Temizle',
    about: 'Hakkında', blog: 'Blog', privacy: 'Gizlilik',
    mostUsed: 'En Çok Kullanılan', daily: 'Günlük İbadet', finance: 'Finans & Sadaka', travel: 'Seyahat & Bilgi',
    footerMade: 'Ümmet için sevgiyle yapıldı', footerFree: 'Her zaman ücretsiz · Kayıt yok',
    stats: { tools: '20 Ücretsiz Araç', free: '%100 Ücretsiz', noSignup: 'Kayıt yok', mobile: 'Mobil', world: 'Dünya geneli', fast: 'Hızlı' },
    aboutTitle: 'I Love Islam Araçları Hakkında',
    aboutText1: 'I Love Islam, dünya genelindeki Müslümanlar için tasarlanmış ücretsiz İslami araçlar koleksiyonudur.',
    aboutText2: 'Zekat hesaplayıcı, namaz vakitleri, kıble bulucu ve çok daha fazlası.',
  },
  id: {
    tagline: 'Perangkat Islam lengkap untuk setiap Muslim',
    search: 'Cari alat — zakat, kiblat, quran...',
    found: 'Ditemukan', results: 'hasil',
    noTools: 'Tidak ada alat ditemukan', noToolsSub: 'Coba: zakat, shalat, quran...',
    clear: 'Hapus',
    about: 'Tentang', blog: 'Blog', privacy: 'Privasi',
    mostUsed: 'Paling Sering Digunakan', daily: 'Ibadah Harian', finance: 'Keuangan & Sedekah', travel: 'Perjalanan & Ilmu',
    footerMade: 'Dibuat dengan ❤️ untuk Umat', footerFree: 'Selalu Gratis · Tanpa Daftar',
    stats: { tools: '20 Alat Gratis', free: '100% Gratis', noSignup: 'Tanpa Daftar', mobile: 'Mobile', world: 'Seluruh Dunia', fast: 'Cepat' },
    aboutTitle: 'Tentang I Love Islam',
    aboutText1: 'I Love Islam adalah kumpulan alat Islam gratis untuk Muslim di seluruh dunia.',
    aboutText2: 'Kalkulator zakat, waktu shalat, kiblat, Al-Quran dan masih banyak lagi.',
  },
  bn: {
    tagline: 'প্রতিটি মুসলিমের জন্য সম্পূর্ণ ইসলামিক টুলকিট',
    search: 'টুল খুঁজুন — যাকাত, কিবলা, কোরআন...',
    found: 'পাওয়া গেছে', results: 'ফলাফল',
    noTools: 'কোনো টুল পাওয়া যায়নি', noToolsSub: 'চেষ্টা করুন: যাকাত, নামাজ, কোরআন...',
    clear: 'পরিষ্কার করুন',
    about: 'সম্পর্কে', blog: 'ব্লগ', privacy: 'গোপনীয়তা',
    mostUsed: 'সর্বাধিক ব্যবহৃত', daily: 'দৈনিক ইবাদত', finance: 'অর্থ ও দান', travel: 'ভ্রমণ ও জ্ঞান',
    footerMade: 'উম্মতের জন্য ভালোবাসায় তৈরি', footerFree: 'সর্বদা বিনামূল্যে',
    stats: { tools: '২০টি বিনামূল্যে টুল', free: '১০০% বিনামূল্যে', noSignup: 'নিবন্ধন নেই', mobile: 'মোবাইলে চলে', world: 'বিশ্বজুড়ে', fast: 'দ্রুত' },
    aboutTitle: 'I Love Islam টুলস সম্পর্কে',
    aboutText1: 'I Love Islam বিশ্বজুড়ে মুসলিমদের জন্য বিনামূল্যে ইসলামিক টুলের সংগ্রহ।',
    aboutText2: 'যাকাত ক্যালকুলেটর, নামাজের সময়, কিবলা, কোরআন এবং আরও অনেক কিছু।',
  },
  ms: {
    tagline: 'Kit alat Islam lengkap untuk setiap Muslim',
    search: 'Cari alat — zakat, kiblat, quran...',
    found: 'Dijumpai', results: 'keputusan',
    noTools: 'Tiada alat dijumpai', noToolsSub: 'Cuba: zakat, solat, quran...',
    clear: 'Padam',
    about: 'Tentang', blog: 'Blog', privacy: 'Privasi',
    mostUsed: 'Paling Kerap Digunakan', daily: 'Amalan Harian', finance: 'Kewangan & Sedekah', travel: 'Perjalanan & Ilmu',
    footerMade: 'Dibuat dengan ❤️ untuk Umat', footerFree: 'Sentiasa Percuma',
    stats: { tools: '20 Alat Percuma', free: '100% Percuma', noSignup: 'Tanpa Daftar', mobile: 'Mudah alih', world: 'Seluruh Dunia', fast: 'Laju' },
    aboutTitle: 'Tentang I Love Islam',
    aboutText1: 'I Love Islam ialah koleksi alat Islam percuma untuk Muslim di seluruh dunia.',
    aboutText2: 'Kalkulator zakat, waktu solat, kiblat, Al-Quran dan banyak lagi.',
  },
};

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'عربي', flag: '🇸🇦' },
  { code: 'ur', label: 'اردو', flag: '🇵🇰' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'ms', label: 'Melayu', flag: '🇲🇾' },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
];

const RTL_LANGS = ['ar', 'ur'];

const TOOLS_DATA = (t: typeof TRANSLATIONS['en']) => [
  {
    category: t.mostUsed, emoji: '⭐',
    items: [
      { name: 'Zakat Calculator', desc: 'Calculate your annual zakat', icon: '💰', href: '/zakat', color: 'bg-emerald-50 text-emerald-700' },
      { name: 'Prayer Times', desc: 'Daily salah times by location', icon: '🕐', href: '/prayer-times', color: 'bg-blue-50 text-blue-700' },
      { name: 'Qibla Finder', desc: 'Find the direction of Mecca', icon: '🧭', href: '/qibla', color: 'bg-amber-50 text-amber-700' },
      { name: 'Hijri Calendar', desc: 'Convert Islamic & Gregorian dates', icon: '🌙', href: '/hijri', color: 'bg-purple-50 text-purple-700' },
      { name: 'Quran Reader', desc: 'Read with translation & mushaf', icon: '📖', href: '/quran', color: 'bg-green-50 text-green-700' },
      { name: 'Dhikr Counter', desc: 'Digital tasbih with presets', icon: '📿', href: '/dhikr', color: 'bg-teal-50 text-teal-700' },
    ],
  },
  {
    category: t.daily, emoji: '🤲',
    items: [
      { name: 'Dua Generator', desc: 'Find prayers for every moment', icon: '🤲', href: '/dua', color: 'bg-amber-50 text-amber-700' },
      { name: '99 Names of Allah', desc: 'Asma ul Husna with meanings', icon: '⭐', href: '/names', color: 'bg-rose-50 text-rose-700' },
      { name: 'Ramadan Planner', desc: 'Suhoor, iftar & ibadah tracker', icon: '🌙', href: '/ramadan', color: 'bg-indigo-50 text-indigo-700' },
      { name: 'Hadith Search', desc: 'Search across hadith books', icon: '🔍', href: '/hadith', color: 'bg-cyan-50 text-cyan-700' },
    ],
  },
  {
    category: t.finance, emoji: '💝',
    items: [
      { name: 'Sadaqah Tracker', desc: 'Log your voluntary charity', icon: '❤️', href: '/sadaqah', color: 'bg-pink-50 text-pink-700' },
      { name: 'Islamic Will', desc: 'Draft your Wasiyyah easily', icon: '📜', href: '/will', color: 'bg-stone-50 text-stone-700' },
      { name: 'Inheritance Calculator', desc: 'Islamic inheritance shares', icon: '⚖️', href: '/inheritance', color: 'bg-orange-50 text-orange-700' },
      { name: 'Halal Finance Check', desc: 'Check if a deal is riba-free', icon: '✅', href: '/halal-finance', color: 'bg-lime-50 text-lime-700' },
      { name: 'Kaffarah Calculator', desc: 'Expiation for broken oaths', icon: '📋', href: '/kaffarah', color: 'bg-yellow-50 text-yellow-700' },
    ],
  },
  {
    category: t.travel, emoji: '📚',
    items: [
      { name: 'Halal Travel', desc: 'Plan your journey with ease', icon: '🌍', href: '/travel', color: 'bg-blue-50 text-blue-700' },
      { name: 'Hajj Checklist', desc: 'Step-by-step pilgrimage guide', icon: '🕋', href: '/hajj', color: 'bg-stone-50 text-stone-700' },
      { name: 'Mosque Finder', desc: 'Nearest masjid by GPS', icon: '🕌', href: '/mosque', color: 'bg-emerald-50 text-emerald-700' },
      { name: 'Islamic Name Finder', desc: 'Meanings of Arabic names', icon: '✏️', href: '/names-finder', color: 'bg-violet-50 text-violet-700' },
    ],
  },
];

const SCROLL_KEY = 'iloveislam_scroll';

function LiveBar({ t }: { t: typeof TRANSLATIONS['en'] }) {
  const [time, setTime] = useState('');
  const [hijri, setHijri] = useState('');
  const [gregorian, setGregorian] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setGregorian(now.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' }));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchHijri = async () => {
      try {
        const today = new Date();
        const d = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        const res = await fetch(`https://api.aladhan.com/v1/gToH/${d}`);
        const data = await res.json();
        if (data.code === 200) {
          const h = data.data.hijri;
          setHijri(`${h.day} ${h.month.en} ${h.year} AH`);
        }
      } catch {}
    };
    fetchHijri();
  }, []);

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap text-white/50 text-xs mb-5">
      {time && <span className="flex items-center gap-1"><span>🕐</span>{time}</span>}
      {gregorian && <span className="flex items-center gap-1"><span>📅</span>{gregorian}</span>}
      {hijri && <span className="flex items-center gap-1"><span>🌙</span>{hijri}</span>}
    </div>
  );
}

export default function Home() {
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  const isRTL = RTL_LANGS.includes(lang);
  const tools = TOOLS_DATA(t);

  // Save/restore language
  useEffect(() => {
    const saved = localStorage.getItem('iloveislam_lang');
    if (saved && TRANSLATIONS[saved]) setLang(saved);
  }, []);

  const switchLang = (code: string) => {
    setLang(code);
    localStorage.setItem('iloveislam_lang', code);
    setShowLangMenu(false);
  };

  useEffect(() => {
    const handleScroll = () => sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString());
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) setTimeout(() => window.scrollTo({ top: parseInt(saved), behavior: 'instant' }), 50);
  }, []);

  const filteredTools = useMemo(() => {
    if (!search.trim()) return tools;
    return tools
      .map((s) => ({
        ...s,
        items: s.items.filter((item) =>
          `${item.name} ${item.desc}`.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [search, lang]);

  const totalResults = filteredTools.reduce((acc, s) => acc + s.items.length, 0);
  const currentLang = LANGUAGES.find(l => l.code === lang);

  return (
    <>
      <h1 className="sr-only">
        I Love Islam — Free Islamic Tools: Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Hijri Calendar and more
      </h1>

      <div className="min-h-screen" style={{ background: '#f7f6f2' }} dir={isRTL ? 'rtl' : 'ltr'}>

        {/* ── HEADER ── */}
        <header style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #0d5238 50%, #0a3d2e 100%)' }}
          className="px-6 pt-8 pb-8 text-center relative overflow-hidden">

          {/* Background decorations */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute top-4 left-8 text-white/5 text-8xl font-arabic">☽</div>
            <div className="absolute bottom-4 right-8 text-white/5 text-6xl">✦</div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/[0.03] text-9xl font-arabic">☽</div>
          </div>

          {/* Language switcher — top right */}
          <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} z-20`}>
            <div className="relative">
              <button onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white/70 text-xs hover:bg-white/20 transition-all">
                <span>{currentLang?.flag}</span>
                <span className="hidden sm:inline">{currentLang?.label}</span>
                <span>▾</span>
              </button>
              {showLangMenu && (
                <div className="absolute top-9 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 w-44">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => switchLang(l.code)}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-left ${lang === l.code ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-700'}`}>
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                      {lang === l.code && <span className="ml-auto text-emerald-500">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Nav links */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
            <Link href="/about" className="text-white/50 hover:text-white/80 text-xs transition-colors">{t.about}</Link>
            <Link href="/blog" className="text-white/50 hover:text-white/80 text-xs transition-colors">{t.blog}</Link>
          </div>

          <div className="relative z-10">
            <h2 className="font-arabic text-5xl md:text-6xl mb-2" style={{ color: '#c8a96e' }}>
              ♡ I Love Islam
            </h2>
            <p className="text-white/50 text-sm mb-4">{t.tagline}</p>

            <LiveBar t={t} />

            {/* Search */}
            <div className="max-w-lg mx-auto flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-5 py-3 shadow-lg backdrop-blur-sm focus-within:border-white/40 transition-all">
              <span className="text-white/40">🔍</span>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={t.search}
                className="bg-transparent text-white placeholder-white/30 text-sm outline-none flex-1"
                aria-label="Search Islamic tools" />
              {search && (
                <button onClick={() => setSearch('')} className="text-white/40 hover:text-white transition-colors text-lg leading-none">✕</button>
              )}
            </div>
            {search && (
              <p className="text-white/40 text-xs mt-3">
                {t.found} <span className="text-white font-semibold">{totalResults}</span> {t.results}{totalResults !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6">

          {/* ── MIZAN BANNER ── */}
          {!search && (
            <Link href="/mizan" className="block mb-8 group">
              <div className="relative rounded-3xl overflow-hidden border border-amber-200/40 hover:shadow-xl hover:shadow-amber-900/10 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #3d1f00 40%, #1a0a00 100%)' }}>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-3 right-6 text-amber-400/20 text-7xl">✦</div>
                  <div className="absolute bottom-3 left-6 text-amber-400/10 text-5xl font-arabic">☽</div>
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border border-amber-400/30"
                    style={{ background: 'rgba(200,169,110,0.15)' }}>✦</div>
                  <div className="flex-1 text-center md:text-left">
                    <span className="text-xs font-bold px-3 py-1 rounded-full border border-amber-400/40 text-amber-400 tracking-widest uppercase mb-2 inline-block">
                      ✨ Featured Tool
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Mizan — Your Islamic Life Blueprint</h2>
                    <p className="text-sm mb-1" style={{ color: '#c8a96e' }}>Discover your personality, life purpose & spiritual path</p>
                    <p className="text-white/30 text-xs">Abjad numerology · 99 Names of Allah · Quranic guidance</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm group-hover:scale-105 transition-all"
                    style={{ background: '#c8a96e', color: '#1a0a00' }}>
                    Discover Yours <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* ── NO RESULTS ── */}
          {filteredTools.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 p-14 text-center">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-gray-700 font-bold text-lg mb-2">{t.noTools} "{search}"</p>
              <p className="text-gray-400 text-sm">{t.noToolsSub}</p>
              <button onClick={() => setSearch('')} className="mt-5 px-5 py-2 rounded-xl text-white text-sm" style={{ background: '#0a3d2e' }}>{t.clear}</button>
            </div>
          )}

          {/* ── TOOL SECTIONS ── */}
          {filteredTools.map((section) => (
            <div key={section.category} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span>{section.emoji}</span>
                <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-400">{section.category}</h2>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className={`grid gap-3 ${
                section.category === t.mostUsed
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6'
                  : 'grid-cols-2 md:grid-cols-4'
              }`}>
                {section.items.map((tool) => (
                  <Link key={tool.name} href={tool.href} aria-label={`${tool.name} — ${tool.desc}`}
                    className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-200 group relative overflow-hidden active:scale-95 flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110 ${tool.color}`}>
                      {tool.icon}
                    </div>
                    <p className="text-xs font-bold text-gray-800 leading-tight mb-1">{tool.name}</p>
                    <p className="text-gray-400 leading-snug group-hover:text-gray-500 transition-colors" style={{ fontSize: '10px' }}>{tool.desc}</p>
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-emerald-400 text-xs font-bold">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* ── STATS & SEO ── */}
          {!search && (
            <>
              <div className="flex flex-wrap justify-center gap-2 mt-4 mb-6">
                {Object.values(t.stats).map((label) => (
                  <div key={label} className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3 py-1.5 shadow-sm">
                    <span className="text-xs text-gray-500 font-medium">{label}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-4">
                <h2 className="font-semibold text-gray-800 mb-3 text-sm">{t.aboutTitle}</h2>
                <p className="text-xs text-gray-400 leading-relaxed mb-2">{t.aboutText1}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{t.aboutText2}</p>
              </div>
            </>
          )}
        </main>

        {/* ── FOOTER ── */}
        <footer className="mt-8 border-t border-gray-100 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="text-center mb-6">
              <p className="font-arabic text-emerald-800 text-2xl mb-1">بسم الله الرحمن الرحيم</p>
              <p className="text-xs text-gray-400">In the name of Allah, the Most Gracious, the Most Merciful</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
              {[
                { label: 'Most Used', links: ['Zakat Calculator', 'Prayer Times', 'Qibla Finder', 'Quran Reader'] },
                { label: 'Daily Practice', links: ['Dhikr Counter', '99 Names of Allah', 'Dua Generator', 'Hadith Search'] },
                { label: 'Finance', links: ['Sadaqah Tracker', 'Inheritance Calculator', 'Halal Finance', 'Islamic Will'] },
                { label: 'More', links: ['Hajj Checklist', 'Mosque Finder', 'Halal Travel', 'Islamic Names'] },
              ].map(col => (
                <div key={col.label}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{col.label}</p>
                  {col.links.map(l => <p key={l} className="text-xs text-gray-400 mb-1">{l}</p>)}
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4 flex flex-wrap items-center justify-center gap-4">
              <p className="text-xs text-gray-300">{t.footerMade} · {t.footerFree}</p>
              <div className="flex gap-3">
                <Link href="/about" className="text-xs text-gray-400 hover:text-gray-600">{t.about}</Link>
                <Link href="/blog" className="text-xs text-gray-400 hover:text-gray-600">{t.blog}</Link>
                <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600">{t.privacy}</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Close lang menu on outside click */}
      {showLangMenu && <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)} />}
    </>
  );
}
