'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';

// ==================== TYPES ====================
interface Tool {
  name: string;
  desc: string;
  icon: string;
  href: string;
}

// ==================== TRANSLATIONS ====================
const TRANSLATIONS: Record<string, any> = {
  en: {
    tagline: 'The complete toolkit for every Muslim',
    search: 'Search tools — zakat, qibla, quran...',
    found: 'Found', results: 'result',
    noTools: 'No tools found', noToolsSub: 'Try searching: zakat, prayer, quran, qibla...',
    clear: 'Clear Search',
    about: 'About', blog: 'Blog', privacy: 'Privacy', contact: 'Contact', faq: 'FAQ', terms: 'Terms',
    mostUsed: 'Most Used', daily: 'Daily Practice', finance: 'Finance & Giving', travel: 'Travel & Knowledge',
    footerMade: 'Made with ❤️ for the Ummah', footerFree: 'Always Free · No Sign-up',
    aboutTitle: 'About I Love Islam Tools',
    aboutText1: 'I Love Islam is a free collection of Islamic tools designed for Muslims worldwide.',
    newsletterTitle: 'Weekly Islamic Guidance',
    newsletterSubtitle: 'Get spiritual reminders and tool updates.',
    newsletterPlaceholder: 'Your email',
    newsletterButton: 'Subscribe',
  },
  ar: {
    tagline: 'مجموعة أدوات إسلامية مجانية لكل مسلم',
    search: 'ابحث عن الأدوات — زكاة، قبلة، قرآن...',
    found: 'وجد', results: 'نتيجة',
    noTools: 'لم يتم العثور على أدوات', noToolsSub: 'جرب البحث: زكاة، صلاة، قرآن...',
    clear: 'مسح البحث',
    about: 'عن الموقع', blog: 'مدونة', privacy: 'الخصوصية', contact: 'تواصل معنا', faq: 'الأسئلة الشائعة', terms: 'الشروط',
    mostUsed: 'الأكثر استخداماً', daily: 'الممارسة اليومية', finance: 'المال والعطاء', travel: 'السفر والمعرفة',
    footerMade: 'صُنع بمحبة للأمة الإسلامية', footerFree: 'مجاني دائماً · لا تسجيل',
    aboutTitle: 'عن أدوات أحب الإسلام',
    aboutText1: 'أحب الإسلام هو مجموعة مجانية من الأدوات الإسلامية للمسلمين في جميع أنحاء العالم.',
    newsletterTitle: 'توجيه إسلامي أسبوعي',
    newsletterSubtitle: 'احصل على تذكيرات روحية وتحديثات الأدوات.',
    newsletterPlaceholder: 'بريدك الإلكتروني',
    newsletterButton: 'اشتراك',
  },
  ur: {
    tagline: 'ہر مسلمان کے لیے مکمل اسلامی ٹول کٹ',
    search: 'ٹولز تلاش کریں — زکوٰۃ، قبلہ، قرآن...',
    found: 'ملا', results: 'نتیجہ',
    noTools: 'کوئی ٹول نہیں ملا', noToolsSub: 'تلاش کریں: زکوٰۃ، نماز، قرآن...',
    clear: 'تلاش صاف کریں',
    about: 'ہمارے بارے میں', blog: 'بلاگ', privacy: 'رازداری', contact: 'رابطہ', faq: 'سوالات', terms: 'شرائط',
    mostUsed: 'سب سے زیادہ استعمال', daily: 'روزانہ عبادت', finance: 'مال اور صدقہ', travel: 'سفر اور علم',
    footerMade: 'امت کے لیے محبت سے بنایا گیا', footerFree: 'ہمیشہ مفت · کوئی رجسٹریشن نہیں',
    aboutTitle: 'I Love Islam ٹولز کے بارے میں',
    aboutText1: 'I Love Islam دنیا بھر کے مسلمانوں کے لیے مفت اسلامی ٹولز کا مجموعہ ہے۔',
    newsletterTitle: 'ہفتہ وار اسلامی رہنمائی',
    newsletterSubtitle: 'روحانی یاد دہانیوں اور ٹول اپ ڈیٹس حاصل کریں۔',
    newsletterPlaceholder: 'آپ کا ای میل',
    newsletterButton: 'سبسکرائب',
  },
  fr: {
    tagline: 'La boîte à outils islamique complète pour chaque Muslim',
    search: 'Rechercher — zakat, qibla, coran...',
    found: 'Trouvé', results: 'résultat',
    noTools: 'Aucun outil trouvé', noToolsSub: 'Essayez: zakat, prière, coran...',
    clear: 'Effacer',
    about: 'À propos', blog: 'Blog', privacy: 'Confidentialité', contact: 'Contact', faq: 'FAQ', terms: 'Conditions',
    mostUsed: 'Les plus utilisés', daily: 'Pratique quotidienne', finance: 'Finance & Dons', travel: 'Voyage & Savoir',
    footerMade: 'Fait avec ❤️ pour la Oumma', footerFree: 'Toujours gratuit · Sans inscription',
    aboutTitle: 'À propos de I Love Islam',
    aboutText1: 'I Love Islam est une collection gratuite d\'outils islamiques pour les musulmans.',
    newsletterTitle: 'Guidance Islamique Hebdomadaire',
    newsletterSubtitle: 'Recevez des rappels spirituels et des mises à jour.',
    newsletterPlaceholder: 'Votre email',
    newsletterButton: "S'abonner",
  },
};

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'عربي', flag: '🇸🇦' },
  { code: 'ur', label: 'اردو', flag: '🇵🇰' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

const RTL_LANGS = ['ar', 'ur'];

const TOOLS_DATA = [
  {
    category: 'mostUsed', emoji: '⭐',
    items: [
      { name: 'Zakat Calculator', desc: 'Calculate your annual zakat', icon: '💰', href: '/zakat' },
      { name: 'Prayer Times', desc: 'Daily salah times', icon: '🕐', href: '/prayer-times' },
      { name: 'Qibla Finder', desc: 'Find Mecca direction', icon: '🧭', href: '/qibla' },
      { name: 'Hijri Calendar', desc: 'Islamic date converter', icon: '🌙', href: '/hijri' },
      { name: 'Quran Reader', desc: 'Read with translation', icon: '📖', href: '/quran' },
      { name: 'Dhikr Counter', desc: 'Digital tasbih', icon: '📿', href: '/dhikr' },
    ],
  },
  {
    category: 'daily', emoji: '🤲',
    items: [
      { name: 'Dua Generator', desc: 'Prayers for every moment', icon: '🤲', href: '/dua' },
      { name: '99 Names of Allah', desc: 'Asma ul Husna', icon: '⭐', href: '/names' },
      { name: 'Ramadan Planner', desc: 'Suhoor & iftar tracker', icon: '🌙', href: '/ramadan' },
      { name: 'Hadith Search', desc: 'Search hadith books', icon: '🔍', href: '/hadith' },
    ],
  },
  {
    category: 'finance', emoji: '💝',
    items: [
      { name: 'Sadaqah Tracker', desc: 'Log your charity', icon: '❤️', href: '/sadaqah' },
      { name: 'Islamic Will', desc: 'Draft your Wasiyyah', icon: '📜', href: '/will' },
      { name: 'Inheritance Calc', desc: 'Islamic shares', icon: '⚖️', href: '/inheritance' },
      { name: 'Halal Finance', desc: 'Riba-free check', icon: '✅', href: '/halal-finance' },
    ],
  },
  {
    category: 'travel', emoji: '📚',
    items: [
      { name: 'Halal Travel', desc: 'Plan your journey', icon: '🌍', href: '/travel' },
      { name: 'Hajj Checklist', desc: 'Pilgrimage guide', icon: '🕋', href: '/hajj' },
      { name: 'Mosque Finder', desc: 'Nearest masjid', icon: '🕌', href: '/mosque' },
      { name: 'Islamic Names', desc: 'Name meanings', icon: '✏️', href: '/names-finder' },
    ],
  },
];

const SCROLL_KEY = 'iloveislam_scroll_position';

function Newsletter({ t }: { t: any }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setTimeout(() => {
      const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
      if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
      }
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 3000);
    }, 1000);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">📧</span>
        <h3 className="font-semibold text-gray-800 text-sm">{t.newsletterTitle}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">{t.newsletterSubtitle}</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.newsletterPlaceholder}
          required
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition"
        >
          {status === 'loading' ? '...' : t.newsletterButton}
        </button>
      </form>
      {status === 'success' && (
        <p className="text-green-600 text-xs mt-2">✓ Subscribed! JazakAllah Khayran.</p>
      )}
    </div>
  );
}

export default function Home() {
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  const isRTL = RTL_LANGS.includes(lang);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('iloveislam_lang');
    if (savedLang && TRANSLATIONS[savedLang]) setLang(savedLang);
  }, []);

  useEffect(() => {
    const saveScroll = () => {
      sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString());
    };
    window.addEventListener('beforeunload', saveScroll);
    return () => window.removeEventListener('beforeunload', saveScroll);
  }, []);

  useEffect(() => {
    if (mounted) {
      const savedScroll = sessionStorage.getItem(SCROLL_KEY);
      if (savedScroll) {
        setTimeout(() => {
          window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' });
          sessionStorage.removeItem(SCROLL_KEY);
        }, 50);
      }
    }
  }, [mounted]);

  const switchLang = (code: string) => {
    setLang(code);
    localStorage.setItem('iloveislam_lang', code);
    setShowLangMenu(false);
  };

  const handleToolClick = () => {
    sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString());
  };

  const filteredTools = useMemo(() => {
    if (!search.trim()) return TOOLS_DATA;
    return TOOLS_DATA
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          `${item.name} ${item.desc}`.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [search]);

  const totalResults = filteredTools.reduce((acc, s) => acc + s.items.length, 0);
  const currentLang = LANGUAGES.find((l) => l.code === lang);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showLangMenu && !(e.target as Element).closest('.lang-menu')) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showLangMenu]);

  const getCategoryTitle = (category: string) => {
    const titles: Record<string, string> = {
      mostUsed: t.mostUsed,
      daily: t.daily,
      finance: t.finance,
      travel: t.travel,
    };
    return titles[category] || category;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-emerald-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #0d5238 100%)' }}>
        <div className="relative z-10 px-4 pt-4 pb-8 max-w-6xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-4">
              <Link href="/about" className="text-white/50 hover:text-white/80 text-xs transition">{t.about}</Link>
              <Link href="/blog" className="text-white/50 hover:text-white/80 text-xs transition">{t.blog}</Link>
              <Link href="/contact" className="text-white/50 hover:text-white/80 text-xs transition hidden sm:inline">{t.contact}</Link>
            </div>
            <div className="relative lang-menu">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-xl px-2.5 py-1.5 text-white/70 text-xs hover:bg-white/20 transition"
              >
                <span>{currentLang?.flag}</span>
                <span className="hidden sm:inline">{currentLang?.label}</span>
                <span>▾</span>
              </button>
              {showLangMenu && (
                <div className="absolute top-8 right-0 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 w-32">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => switchLang(l.code)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left ${
                        lang === l.code ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hero */}
          <div className="text-center">
            <h1 className="font-arabic text-5xl md:text-6xl mb-2" style={{ color: '#c8a96e' }}>♡ I Love Islam</h1>
            <p className="text-white/50 text-sm mb-4">{t.tagline}</p>

            {/* Search */}
            <div className="max-w-md mx-auto flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-4 py-2.5">
              <span className="text-white/40">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.search}
                className="bg-transparent text-white placeholder-white/30 text-sm outline-none flex-1"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-white/40 hover:text-white">✕</button>
              )}
            </div>
            {search && (
              <p className="text-white/40 text-xs mt-2">
                {t.found} <span className="text-white">{totalResults}</span> {t.results}{totalResults !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1">
            {/* Mizan Banner */}
            {!search && (
              <Link href="/mizan" className="block mb-6">
                <div className="bg-gradient-to-r from-amber-900 to-amber-800 rounded-xl p-3 flex items-center gap-3 hover:shadow-lg transition">
                  <div className="w-10 h-10 rounded-xl bg-amber-700/50 flex items-center justify-center text-xl">✦</div>
                  <div className="flex-1">
                    <p className="text-amber-300 text-[10px] font-bold">✨ FEATURED</p>
                    <p className="text-white text-sm font-semibold">Mizan — Islamic Life Blueprint</p>
                  </div>
                  <div className="text-amber-400 text-lg">→</div>
                </div>
              </Link>
            )}

            {/* No results */}
            {filteredTools.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <p className="text-5xl mb-3">🔍</p>
                <p className="text-gray-700 font-semibold mb-1">{t.noTools} "{search}"</p>
                <p className="text-gray-400 text-sm">{t.noToolsSub}</p>
                <button onClick={() => setSearch('')} className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm transition">
                  {t.clear}
                </button>
              </div>
            )}

            {/* Tool sections */}
            {filteredTools.map((section) => (
              <div key={section.category} className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span>{section.emoji}</span>
                  <h2 className="text-[10px] font-bold tracking-wider uppercase text-gray-400">{getCategoryTitle(section.category)}</h2>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {section.items.map((tool) => (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      onClick={handleToolClick}
                      className="bg-white rounded-xl p-3 border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all group flex flex-col items-center text-center"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl mb-2">
                        {tool.icon}
                      </div>
                      <p className="text-xs font-semibold text-gray-800">{tool.name}</p>
                      <p className="text-[10px] text-gray-400">{tool.desc}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* Stats */}
            {!search && (
              <div className="flex flex-wrap justify-center gap-2 my-6">
                <span className="text-[10px] text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-100">20+ Free Tools</span>
                <span className="text-[10px] text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-100">100% Free</span>
                <span className="text-[10px] text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-100">No Sign-up</span>
                <span className="text-[10px] text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-100">Works on Mobile</span>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-72">
            <Newsletter t={t} />
          </div>
        </div>

        {/* About section */}
        {!search && (
          <div className="mt-8 bg-white rounded-xl p-5 border border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm mb-2">{t.aboutTitle}</h2>
            <p className="text-xs text-gray-500 leading-relaxed">{t.aboutText1}</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-gray-400">{t.footerMade} · {t.footerFree}</p>
          <div className="flex flex-wrap justify-center gap-4 mt-3">
            <Link href="/about" className="text-xs text-gray-400 hover:text-gray-600 transition">About</Link>
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600 transition">Privacy</Link>
            <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600 transition">Terms</Link>
            <Link href="/contact" className="text-xs text-gray-400 hover:text-gray-600 transition">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}