'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const tools = [
  {
    category: 'Most Used',
    emoji: '⭐',
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
    category: 'Daily Practice',
    emoji: '🤲',
    items: [
      { name: 'Dua Generator', desc: 'Find prayers for every moment', icon: '🤲', href: '/dua', color: 'bg-amber-50 text-amber-700' },
      { name: '99 Names of Allah', desc: 'Asma ul Husna with meanings', icon: '⭐', href: '/names', color: 'bg-rose-50 text-rose-700' },
      { name: 'Ramadan Planner', desc: 'Suhoor, iftar & ibadah tracker', icon: '🌙', href: '/ramadan', color: 'bg-indigo-50 text-indigo-700' },
      { name: 'Hadith Search', desc: 'Search across hadith books', icon: '🔍', href: '/hadith', color: 'bg-cyan-50 text-cyan-700' },
    ],
  },
  {
    category: 'Finance & Giving',
    emoji: '💝',
    items: [
      { name: 'Sadaqah Tracker', desc: 'Log your voluntary charity', icon: '❤️', href: '/sadaqah', color: 'bg-pink-50 text-pink-700' },
      { name: 'Islamic Will', desc: 'Draft your Wasiyyah easily', icon: '📜', href: '/will', color: 'bg-stone-50 text-stone-700' },
      { name: 'Inheritance Calculator', desc: 'Islamic inheritance shares', icon: '⚖️', href: '/inheritance', color: 'bg-orange-50 text-orange-700' },
      { name: 'Halal Finance Check', desc: 'Check if a deal is riba-free', icon: '✅', href: '/halal-finance', color: 'bg-lime-50 text-lime-700' },
      { name: 'Kaffarah Calculator', desc: 'Expiation for broken oaths', icon: '📋', href: '/kaffarah', color: 'bg-yellow-50 text-yellow-700' },
    ],
  },
  {
    category: 'Travel & Knowledge',
    emoji: '📚',
    items: [
      { name: 'Halal Travel', desc: 'Plan your journey with ease', icon: '🌍', href: '/travel', color: 'bg-blue-50 text-blue-700' },
      { name: 'Hajj Checklist', desc: 'Step-by-step pilgrimage guide', icon: '🕋', href: '/hajj', color: 'bg-stone-50 text-stone-700' },
      { name: 'Mosque Finder', desc: 'Nearest masjid by GPS', icon: '🕌', href: '/mosque', color: 'bg-emerald-50 text-emerald-700' },
      { name: 'Islamic Name Finder', desc: 'Meanings of Arabic names', icon: '✏️', href: '/names-finder', color: 'bg-violet-50 text-violet-700' },
    ],
  },
];

// ── Translations ─────────────────────────────────────────────────────────
const LANGS = [
  { code: 'en', flag: '🇬🇧', label: 'English', native: 'English', dir: 'ltr' },
  { code: 'ar', flag: '🇸🇦', label: 'Arabic',  native: 'العربية', dir: 'rtl' },
  { code: 'ur', flag: '🇵🇰', label: 'Urdu',    native: 'اردو',    dir: 'rtl' },
];

const T: Record<string, any> = {
  en: {
    siteName: 'I Love Islam',
    tagline: 'The complete toolkit for every Muslim — 20 free tools in one place',
    badge: 'Free · No Sign-up · Always Available',
    searchPlaceholder: 'Search tools — zakat, qibla, quran...',
    noResults: 'No tools found for',
    clearSearch: 'Clear Search',
    trySearch: 'Try searching: zakat, prayer, quran, qibla...',
    found: 'Found',
    results: 'results',
    result: 'result',
    blog: 'Blog',
    about: 'About',
    privacy: 'Privacy',
    mizanBadge: '✨ New Featured Tool',
    mizanTitle: 'Mizan — Your Islamic Life Blueprint',
    mizanDesc: 'Discover your personality, life purpose & spiritual path through Islamic numerology',
    mizanSub: 'Based on Abjad numerology · 99 Names of Allah · Quranic guidance · Your birth date',
    mizanCta: 'Discover Yours',
    copyright: '© 2025 iloveislam.life · Made with ❤️ for the Ummah · Always Free · No Ads · No Sign-up',
  },
  ar: {
    siteName: 'أحب الإسلام',
    tagline: 'مجموعة أدوات كاملة لكل مسلم — ٢٠ أداة مجانية في مكان واحد',
    badge: 'مجاني · بدون تسجيل · متاح دائماً',
    searchPlaceholder: 'ابحث عن الأدوات — زكاة، قبلة، قرآن...',
    noResults: 'لا توجد أدوات لـ',
    clearSearch: 'مسح البحث',
    trySearch: 'جرب: زكاة، صلاة، قرآن، قبلة...',
    found: 'وجدنا',
    results: 'نتائج',
    result: 'نتيجة',
    blog: 'المدونة',
    about: 'من نحن',
    privacy: 'الخصوصية',
    mizanBadge: '✨ أداة جديدة مميزة',
    mizanTitle: 'ميزان — مخطط حياتك الإسلامي',
    mizanDesc: 'اكتشف شخصيتك ومسارك الروحي من خلال علم الأعداد الإسلامي',
    mizanSub: 'حساب الجُمَّل · ٩٩ اسماً لله · توجيه قرآني · تاريخ ميلادك',
    mizanCta: 'اكتشف ميزانك',
    copyright: '© 2025 iloveislam.life · صُنع بـ ❤️ للأمة الإسلامية · مجاني دائماً · بلا إعلانات',
  },
  ur: {
    siteName: 'میں اسلام سے محبت کرتا ہوں',
    tagline: 'ہر مسلمان کے لیے مکمل ٹول کٹ — ایک جگہ ۲۰ مفت ٹولز',
    badge: 'مفت · بغیر سائن اپ · ہمیشہ دستیاب',
    searchPlaceholder: 'ٹولز تلاش کریں — زکوٰۃ، قبلہ، قرآن...',
    noResults: 'کوئی ٹول نہیں ملا',
    clearSearch: 'تلاش صاف کریں',
    trySearch: 'تلاش کریں: زکوٰۃ، نماز، قرآن...',
    found: 'ملے',
    results: 'نتائج',
    result: 'نتیجہ',
    blog: 'بلاگ',
    about: 'ہمارے بارے میں',
    privacy: 'رازداری',
    mizanBadge: '✨ نئی خاص ٹول',
    mizanTitle: 'میزان — آپ کا اسلامی زندگی کا نقشہ',
    mizanDesc: 'اسلامی علم الاعداد کے ذریعے اپنی شخصیت اور روحانی راستہ دریافت کریں',
    mizanSub: 'ابجد حساب · اللہ کے ۹۹ نام · قرآنی رہنمائی · تاریخ پیدائش',
    mizanCta: 'اپنا میزان دریافت کریں',
    copyright: '© 2025 iloveislam.life · امت کے لیے ❤️ سے بنایا گیا · ہمیشہ مفت · بغیر اشتہار',
  },
};

// Tool name translations
const TOOL_T: Record<string, Record<string, { name: string; desc: string }>> = {
  en: {
    'Zakat Calculator': { name: 'Zakat Calculator', desc: 'Calculate your annual zakat' },
    'Prayer Times': { name: 'Prayer Times', desc: 'Daily salah times by location' },
    'Qibla Finder': { name: 'Qibla Finder', desc: 'Find the direction of Mecca' },
    'Hijri Calendar': { name: 'Hijri Calendar', desc: 'Convert Islamic & Gregorian dates' },
    'Quran Reader': { name: 'Quran Reader', desc: 'Read with translation & mushaf' },
    'Dhikr Counter': { name: 'Dhikr Counter', desc: 'Digital tasbih with presets' },
    'Dua Generator': { name: 'Dua Generator', desc: 'Find prayers for every moment' },
    '99 Names of Allah': { name: '99 Names of Allah', desc: 'Asma ul Husna with meanings' },
    'Ramadan Planner': { name: 'Ramadan Planner', desc: 'Suhoor, iftar & ibadah tracker' },
    'Hadith Search': { name: 'Hadith Search', desc: 'Search across hadith books' },
    'Sadaqah Tracker': { name: 'Sadaqah Tracker', desc: 'Log your voluntary charity' },
    'Islamic Will': { name: 'Islamic Will', desc: 'Draft your Wasiyyah easily' },
    'Inheritance Calculator': { name: 'Inheritance Calculator', desc: 'Islamic inheritance shares' },
    'Halal Finance Check': { name: 'Halal Finance Check', desc: 'Check if a deal is riba-free' },
    'Kaffarah Calculator': { name: 'Kaffarah Calculator', desc: 'Expiation for broken oaths' },
    'Halal Travel': { name: 'Halal Travel', desc: 'Plan your journey with ease' },
    'Hajj Checklist': { name: 'Hajj Checklist', desc: 'Step-by-step pilgrimage guide' },
    'Mosque Finder': { name: 'Mosque Finder', desc: 'Nearest masjid by GPS' },
    'Islamic Name Finder': { name: 'Islamic Name Finder', desc: 'Meanings of Arabic names' },
  },
  ar: {
    'Zakat Calculator': { name: 'حاسبة الزكاة', desc: 'احسب زكاتك السنوية' },
    'Prayer Times': { name: 'أوقات الصلاة', desc: 'أوقات الصلاة اليومية حسب موقعك' },
    'Qibla Finder': { name: 'محدد القبلة', desc: 'اعثر على اتجاه مكة المكرمة' },
    'Hijri Calendar': { name: 'التقويم الهجري', desc: 'تحويل التواريخ الإسلامية والميلادية' },
    'Quran Reader': { name: 'قارئ القرآن', desc: 'اقرأ مع الترجمة والمصحف' },
    'Dhikr Counter': { name: 'عداد الذكر', desc: 'سبحة رقمية مع نصوص مضيئة' },
    'Dua Generator': { name: 'مولد الأدعية', desc: 'ابحث عن أدعية لكل لحظة' },
    '99 Names of Allah': { name: 'أسماء الله الحسنى', desc: 'الأسماء الحسنى ومعانيها' },
    'Ramadan Planner': { name: 'مخطط رمضان', desc: 'متابعة السحور والإفطار والعبادة' },
    'Hadith Search': { name: 'بحث الحديث', desc: 'البحث في كتب الحديث' },
    'Sadaqah Tracker': { name: 'متتبع الصدقة', desc: 'سجّل صدقاتك التطوعية' },
    'Islamic Will': { name: 'الوصية الإسلامية', desc: 'صياغة وصيتك بسهولة' },
    'Inheritance Calculator': { name: 'حاسبة المواريث', desc: 'حصص الميراث الإسلامية' },
    'Halal Finance Check': { name: 'فحص التمويل الحلال', desc: 'تحقق من خلو الصفقة من الربا' },
    'Kaffarah Calculator': { name: 'حاسبة الكفارة', desc: 'كفارة الأيمان المنتهكة' },
    'Halal Travel': { name: 'السفر الحلال', desc: 'خطط لرحلتك بسهولة' },
    'Hajj Checklist': { name: 'قائمة الحج', desc: 'دليل الحج خطوة بخطوة' },
    'Mosque Finder': { name: 'محدد المساجد', desc: 'أقرب مسجد بالـ GPS' },
    'Islamic Name Finder': { name: 'محدد الأسماء الإسلامية', desc: 'معاني الأسماء العربية' },
  },
  ur: {
    'Zakat Calculator': { name: 'زکوٰۃ کیلکولیٹر', desc: 'اپنی سالانہ زکوٰۃ حساب کریں' },
    'Prayer Times': { name: 'نماز کے اوقات', desc: 'مقام کے مطابق روزانہ نماز کے اوقات' },
    'Qibla Finder': { name: 'قبلہ فائنڈر', desc: 'مکہ کی سمت معلوم کریں' },
    'Hijri Calendar': { name: 'ہجری کیلنڈر', desc: 'اسلامی اور عیسوی تاریخ تبدیل کریں' },
    'Quran Reader': { name: 'قرآن ریڈر', desc: 'ترجمے کے ساتھ پڑھیں' },
    'Dhikr Counter': { name: 'ذکر کاؤنٹر', desc: 'ڈیجیٹل تسبیح' },
    'Dua Generator': { name: 'دعا جنریٹر', desc: 'ہر موقع کی دعا تلاش کریں' },
    '99 Names of Allah': { name: 'اللہ کے ۹۹ نام', desc: 'اسماء الحسنی اور معانی' },
    'Ramadan Planner': { name: 'رمضان پلانر', desc: 'سحری، افطار اور عبادت ٹریکر' },
    'Hadith Search': { name: 'حدیث سرچ', desc: 'حدیث کتابوں میں تلاش' },
    'Sadaqah Tracker': { name: 'صدقہ ٹریکر', desc: 'اپنا نفلی صدقہ ریکارڈ کریں' },
    'Islamic Will': { name: 'اسلامی وصیت', desc: 'اپنی وصیت آسانی سے لکھیں' },
    'Inheritance Calculator': { name: 'وراثت کیلکولیٹر', desc: 'اسلامی وراثت کے حصے' },
    'Halal Finance Check': { name: 'حلال فنانس چیک', desc: 'سودے کو سود سے پاک چیک کریں' },
    'Kaffarah Calculator': { name: 'کفارہ کیلکولیٹر', desc: 'قسم توڑنے کا کفارہ' },
    'Halal Travel': { name: 'حلال سفر', desc: 'اپنا سفر آسانی سے پلان کریں' },
    'Hajj Checklist': { name: 'حج چیک لسٹ', desc: 'قدم بہ قدم حج گائیڈ' },
    'Mosque Finder': { name: 'مسجد فائنڈر', desc: 'GPS سے قریب ترین مسجد' },
    'Islamic Name Finder': { name: 'اسلامی نام فائنڈر', desc: 'عربی ناموں کے معانی' },
  },
};

const SCROLL_KEY = 'iloveislam_scroll';

// ── Language Switcher ─────────────────────────────────────────────────────
function LangSwitcher({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = LANGS.find(l => l.code === lang) || LANGS[0];

  return (
    <div style={{ position: 'relative', zIndex: 50 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 20,
          padding: '6px 14px',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
        }}
      >
        {current.flag} {current.native} <span style={{ opacity: 0.7 }}>▾</span>
      </button>
      {open && (
        <>
          {/* Backdrop */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            overflow: 'hidden',
            zIndex: 50,
            minWidth: 150,
          }}>
            {LANGS.map(l => (
              <button key={l.code}
                onClick={() => { setLang(l.code); setOpen(false); }}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  border: 'none',
                  background: lang === l.code ? '#f0f9f4' : '#fff',
                  color: lang === l.code ? '#0a3d2e' : '#333',
                  fontSize: 13,
                  fontWeight: lang === l.code ? 700 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  textAlign: 'left',
                }}
              >
                <span>{l.flag}</span>
                <span>{l.native}</span>
                {lang === l.code && <span style={{ marginLeft: 'auto', color: '#0a3d2e' }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Live Bar ──────────────────────────────────────────────────────────────
function LiveBar() {
  const [time, setTime] = useState('');
  const [hijri, setHijri] = useState('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  return (
    <div className="flex items-center justify-center gap-4 flex-wrap text-white/50 text-xs mb-6">
      {time && <span className="flex items-center gap-1">🕐 {time}</span>}
      {hijri && <span className="flex items-center gap-1">🌙 {hijri}</span>}
      <span className="flex items-center gap-1">🌍 1.8 Billion Muslims Worldwide</span>
    </div>
  );
}

// ── Home Page ─────────────────────────────────────────────────────────────
export default function Home() {
  const [search, setSearch] = useState('');
  const [lang, setLangState] = useState('en');
  const dir = LANGS.find(l => l.code === lang)?.dir || 'ltr';
  const t = T[lang] || T.en;
  const toolT = TOOL_T[lang] || TOOL_T.en;

  // Load saved language
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ilis_lang');
      if (saved && T[saved]) setLangState(saved);
    } catch {}
  }, []);

  function setLang(l: string) {
    setLangState(l);
    try { localStorage.setItem('ilis_lang', l); } catch {}
  }

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
      .map(s => ({
        ...s,
        items: s.items.filter(t => {
          const tr = toolT[t.name] || { name: t.name, desc: t.desc };
          return `${tr.name} ${tr.desc}`.toLowerCase().includes(search.toLowerCase());
        }),
      }))
      .filter(s => s.items.length > 0);
  }, [search, toolT]);

  const totalResults = filteredTools.reduce((a, s) => a + s.items.length, 0);

  return (
    // Apply dir at wrapper level — this makes RTL apply to everything including footer links
    <div dir={dir} style={{ fontFamily: lang === 'ur' ? "'Noto Nastaliq Urdu', Georgia, serif" : lang === 'ar' ? "'Noto Naskh Arabic', Georgia, serif" : undefined }}>
      <h1 className="sr-only">
        I Love Islam — Free Islamic Tools: Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Hijri Calendar and more
      </h1>

      <div className="min-h-screen" style={{ background: '#f7f6f2' }}>

        {/* HERO HEADER */}
        <header style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #0d5238 50%, #0a3d2e 100%)' }}
          className="px-6 pt-10 pb-8 text-center relative overflow-hidden">

          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute top-4 left-8 text-white/5 text-8xl">☽</div>
            <div className="absolute bottom-4 right-8 text-white/5 text-6xl">✦</div>
          </div>

          {/* ── Language switcher: top right, inside header padding, NOT absolute overlapping ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, position: 'relative', zIndex: 10 }}>
            <LangSwitcher lang={lang} setLang={setLang} />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
              <span className="text-xs" style={{ color: '#c8a96e' }}>✦</span>
              <span className="text-white/70 text-xs tracking-widest uppercase">{t.badge}</span>
              <span className="text-xs" style={{ color: '#c8a96e' }}>✦</span>
            </div>

            <h2 className="font-arabic text-5xl md:text-6xl mb-2" style={{ color: '#c8a96e' }}>
              ♡ {t.siteName}
            </h2>
            <p className="text-white/60 text-sm mb-5">{t.tagline}</p>

            <LiveBar />

            <div className="max-w-lg mx-auto flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-5 py-3 shadow-lg backdrop-blur-sm focus-within:border-white/40 focus-within:bg-white/15 transition-all">
              <span className="text-white/40">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="bg-transparent text-white placeholder-white/30 text-sm outline-none flex-1"
                aria-label="Search Islamic tools"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-white/40 hover:text-white transition-colors text-lg leading-none">✕</button>
              )}
            </div>

            {search && (
              <p className="text-white/40 text-xs mt-3">
                {t.found} <span className="text-white font-semibold">{totalResults}</span> {totalResults !== 1 ? t.results : t.result}
              </p>
            )}
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6">

          {/* MIZAN BANNER */}
          {!search && (
            <Link href="/mizan" className="block mb-8 group">
              <div className="relative rounded-3xl overflow-hidden border border-amber-200 hover:shadow-xl hover:shadow-amber-900/10 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #3d1f00 40%, #1a0a00 100%)' }}>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-3 right-6 text-amber-400/20 text-7xl">✦</div>
                  <div className="absolute bottom-3 left-6 text-amber-400/10 text-5xl">☽</div>
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
                  <div className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl border border-amber-400/30"
                    style={{ background: 'rgba(200,169,110,0.15)' }}>✦</div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full border border-amber-400/40 text-amber-400 tracking-widest uppercase">
                        {t.mizanBadge}
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{t.mizanTitle}</h2>
                    <p className="text-sm md:text-base mb-1" style={{ color: '#c8a96e' }}>{t.mizanDesc}</p>
                    <p className="text-white/40 text-xs">{t.mizanSub}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all group-hover:scale-105"
                      style={{ background: '#c8a96e', color: '#1a0a00' }}>
                      {t.mizanCta} <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* NO RESULTS */}
          {filteredTools.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 p-14 text-center">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-gray-700 font-bold text-lg mb-2">{t.noResults} "{search}"</p>
              <p className="text-gray-400 text-sm">{t.trySearch}</p>
              <button onClick={() => setSearch('')} className="mt-5 px-5 py-2 rounded-xl text-white text-sm" style={{ background: '#0a3d2e' }}>
                {t.clearSearch}
              </button>
            </div>
          )}

          {/* TOOL SECTIONS */}
          {filteredTools.map(section => (
            <div key={section.category} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span>{section.emoji}</span>
                <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-400">{section.category}</h2>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className={`grid gap-3 ${section.category === 'Most Used' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6' : 'grid-cols-2 md:grid-cols-4'}`}>
                {section.items.map(tool => {
                  const tr = toolT[tool.name] || { name: tool.name, desc: tool.desc };
                  return (
                    <Link key={tool.name} href={tool.href} aria-label={`${tr.name} — ${tr.desc}`}
                      className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-200 group relative overflow-hidden active:scale-95 flex flex-col items-center text-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110 ${tool.color}`}>
                        {tool.icon}
                      </div>
                      <p className="text-xs font-bold text-gray-800 leading-tight mb-1">{tr.name}</p>
                      <p className="text-gray-400 leading-snug group-hover:text-gray-500 transition-colors" style={{ fontSize: '10px' }}>{tr.desc}</p>
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-emerald-400 text-xs font-bold">→</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* STATS */}
          {!search && (
            <>
              <div className="flex flex-wrap justify-center gap-2 mt-4 mb-6">
                {[
                  { icon: '🛠️', label: '20 Free Tools' },
                  { icon: '💚', label: '100% Free' },
                  { icon: '🔓', label: 'No Sign-up' },
                  { icon: '📱', label: 'Works on Mobile' },
                  { icon: '🌍', label: 'Works Worldwide' },
                  { icon: '⚡', label: 'Always Fast' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3 py-1.5 shadow-sm">
                    <span className="text-sm">{s.icon}</span>
                    <span className="text-xs text-gray-500 font-medium">{s.label}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-4">
                <h2 className="font-semibold text-gray-800 mb-3 text-sm">About I Love Islam Tools</h2>
                <p className="text-xs text-gray-400 leading-relaxed mb-2">
                  I Love Islam is a free collection of Islamic tools designed for Muslims worldwide. Whether you need to calculate your annual <strong className="text-gray-600">Zakat</strong>, find accurate <strong className="text-gray-600">Prayer Times</strong> for your city, locate the <strong className="text-gray-600">Qibla direction</strong>, or read the <strong className="text-gray-600">Quran</strong> with translation — everything is available in one place, completely free.
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Our tools include a <strong className="text-gray-600">Hijri Calendar converter</strong>, <strong className="text-gray-600">Dhikr counter</strong>, <strong className="text-gray-600">99 Names of Allah</strong>, <strong className="text-gray-600">Halal Travel guide</strong>, <strong className="text-gray-600">Mosque Finder</strong>, <strong className="text-gray-600">Islamic Inheritance Calculator</strong>, and our unique <strong className="text-gray-600">Mizan Islamic Life Blueprint</strong> — all built with love for the Ummah.
                </p>
              </div>
            </>
          )}
        </main>

        {/* FOOTER */}
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
                { label: 'Knowledge', links: ['Hajj Checklist', 'Mosque Finder', 'Halal Travel', 'Islamic Names'] },
              ].map(col => (
                <div key={col.label}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{col.label}</p>
                  {col.links.map(l => <p key={l} className="text-xs text-gray-400 mb-1">{l}</p>)}
                </div>
              ))}
            </div>

            {/* ── Footer nav: Blog, About, Privacy — all on one row, no overlap ── */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
              <Link href="/blog"    style={{ color: '#0a3d2e', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>{t.blog}</Link>
              <span style={{ color: '#d1d5db', fontSize: 12 }}>·</span>
              <Link href="/about"   style={{ color: '#0a3d2e', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>{t.about}</Link>
              <span style={{ color: '#d1d5db', fontSize: 12 }}>·</span>
              <Link href="/privacy" style={{ color: '#0a3d2e', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>{t.privacy}</Link>
            </div>

            <div className="border-t border-gray-100 pt-4 text-center">
              <p className="text-xs text-gray-300">{t.copyright}</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
