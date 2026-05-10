'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';

// ==================== TYPES ====================
interface Tool {
  name: string;
  desc: string;
  icon: string;
  href: string;
  color: string;
}

interface StatsType {
  tools: string;
  free: string;
  noSignup: string;
  mobile: string;
  world: string;
  fast: string;
}

interface TranslationsType {
  tagline: string;
  search: string;
  found: string;
  results: string;
  noTools: string;
  noToolsSub: string;
  clear: string;
  about: string;
  blog: string;
  privacy: string;
  contact: string;
  faq: string;
  terms: string;
  mostUsed: string;
  daily: string;
  finance: string;
  travel: string;
  footerMade: string;
  footerFree: string;
  stats: StatsType;
  aboutTitle: string;
  aboutText1: string;
  aboutText2: string;
  metaDescription: string;
  newsletterTitle: string;
  newsletterSubtitle: string;
  newsletterPlaceholder: string;
  newsletterButton: string;
  darkMode: string;
  lightMode: string;
}

// ==================== TRANSLATIONS - ALL 8 LANGUAGES ====================
const TRANSLATIONS: Record<string, TranslationsType> = {
  en: {
    tagline: 'The complete toolkit for every Muslim',
    search: 'Search tools — zakat, qibla, quran...',
    found: 'Found', results: 'result',
    noTools: 'No tools found', noToolsSub: 'Try searching: zakat, prayer, quran, qibla...',
    clear: 'Clear Search',
    about: 'About', blog: 'Blog', privacy: 'Privacy', contact: 'Contact', faq: 'FAQ', terms: 'Terms',
    mostUsed: 'Most Used', daily: 'Daily Practice', finance: 'Finance & Giving', travel: 'Travel & Knowledge',
    footerMade: 'Made with ❤️ for the Ummah', footerFree: 'Always Free · No Sign-up',
    stats: { tools: '20+ Free Tools', free: '100% Free', noSignup: 'No Sign-up', mobile: 'Works on Mobile', world: 'Works Worldwide', fast: 'Always Fast' },
    aboutTitle: 'About I Love Islam Tools',
    aboutText1: 'I Love Islam is a free collection of Islamic tools designed for Muslims worldwide. Whether you need to calculate your annual Zakat, find accurate Prayer Times for your city, locate the Qibla direction, or read the Quran with translation — everything is available in one place, completely free.',
    aboutText2: 'Our tools include a Hijri Calendar converter, Dhikr counter, 99 Names of Allah, Halal Travel guide, Mosque Finder, Islamic Inheritance Calculator, and our unique Mizan Islamic Life Blueprint — all built with love for the Ummah.',
    metaDescription: 'Free Islamic tools: Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Hijri Calendar, Dhikr Counter, and more.',
    newsletterTitle: 'Weekly Islamic Guidance',
    newsletterSubtitle: 'Get spiritual reminders, tool updates, and Islamic knowledge.',
    newsletterPlaceholder: 'Your email',
    newsletterButton: 'Subscribe',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
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
    stats: { tools: '٢٠+ أداة مجانية', free: '١٠٠٪ مجاني', noSignup: 'لا تسجيل', mobile: 'يعمل على الجوال', world: 'يعمل في كل مكان', fast: 'سريع دائماً' },
    aboutTitle: 'عن أدوات أحب الإسلام',
    aboutText1: 'أحب الإسلام هو مجموعة مجانية من الأدوات الإسلامية المصممة للمسلمين في جميع أنحاء العالم.',
    aboutText2: 'تشمل أدواتنا محوّل التقويم الهجري وعداد الذكر وأسماء الله الحسنى ودليل السفر الحلال والمزيد.',
    metaDescription: 'أدوات إسلامية مجانية: حاسبة الزكاة، مواقيت الصلاة، اتجاه القبلة، قراءة القرآن، التقويم الهجري.',
    newsletterTitle: 'توجيه إسلامي أسبوعي',
    newsletterSubtitle: 'احصل على تذكيرات روحية وتحديثات الأدوات والمعرفة الإسلامية.',
    newsletterPlaceholder: 'بريدك الإلكتروني',
    newsletterButton: 'اشتراك',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
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
    stats: { tools: '٢٠+ مفت ٹولز', free: '١٠٠٪ مفت', noSignup: 'کوئی سائن اپ نہیں', mobile: 'موبائل پر چلتا ہے', world: 'دنیا بھر میں', fast: 'ہمیشہ تیز' },
    aboutTitle: 'I Love Islam ٹولز کے بارے میں',
    aboutText1: 'I Love Islam دنیا بھر کے مسلمانوں کے لیے مفت اسلامی ٹولز کا مجموعہ ہے۔',
    aboutText2: 'ہمارے ٹولز میں ہجری کیلنڈر، ذکر کاؤنٹر، اللہ کے ۹۹ نام، میزان لائف بلیو پرنٹ اور بہت کچھ شامل ہے۔',
    metaDescription: 'مفت اسلامی ٹولز: زکوٰۃ کیلکولیٹر، نماز کے اوقات، قبلہ تلاش کریں، قرآن پڑھیں۔',
    newsletterTitle: 'ہفتہ وار اسلامی رہنمائی',
    newsletterSubtitle: 'روحانی یاد دہانیوں، ٹول اپ ڈیٹس اور اسلامی علم کے ساتھ۔',
    newsletterPlaceholder: 'آپ کا ای میل',
    newsletterButton: 'سبسکرائب',
    darkMode: 'ڈارک موڈ',
    lightMode: 'لائٹ موڈ',
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
    stats: { tools: '20+ Outils gratuits', free: '100% Gratuit', noSignup: 'Sans inscription', mobile: 'Mobile', world: 'Mondial', fast: 'Rapide' },
    aboutTitle: 'À propos de I Love Islam',
    aboutText1: 'I Love Islam est une collection gratuite d\'outils islamiques pour les musulmans du monde entier.',
    aboutText2: 'Calculateur de Zakat, horaires de prière, direction de la Qibla, lecture du Coran et bien plus encore.',
    metaDescription: 'Outils islamiques gratuits: calculatrice Zakat, horaires de prière, direction Qibla, lecture du Coran, calendrier Hijri.',
    newsletterTitle: 'Guidance Islamique Hebdomadaire',
    newsletterSubtitle: 'Recevez des rappels spirituels, des mises à jour d\'outils et des connaissances islamiques.',
    newsletterPlaceholder: 'Votre email',
    newsletterButton: "S'abonner",
    darkMode: 'Mode Sombre',
    lightMode: 'Mode Clair',
  },
  tr: {
    tagline: 'Her Müslüman için tam İslami araç seti',
    search: 'Araçları ara — zekat, kıble, kuran...',
    found: 'Bulundu', results: 'sonuç',
    noTools: 'Araç bulunamadı', noToolsSub: 'Deneyin: zekat, namaz, kuran...',
    clear: 'Temizle',
    about: 'Hakkında', blog: 'Blog', privacy: 'Gizlilik', contact: 'İletişim', faq: 'SSS', terms: 'Şartlar',
    mostUsed: 'En Çok Kullanılan', daily: 'Günlük İbadet', finance: 'Finans & Sadaka', travel: 'Seyahat & Bilgi',
    footerMade: 'Ümmet için sevgiyle yapıldı', footerFree: 'Her zaman ücretsiz · Kayıt yok',
    stats: { tools: '20+ Ücretsiz Araç', free: '%100 Ücretsiz', noSignup: 'Kayıt yok', mobile: 'Mobil', world: 'Dünya geneli', fast: 'Hızlı' },
    aboutTitle: 'I Love Islam Araçları Hakkında',
    aboutText1: 'I Love Islam, dünya genelindeki Müslümanlar için tasarlanmış ücretsiz İslami araçlar koleksiyonudur.',
    aboutText2: 'Zekat hesaplayıcı, namaz vakitleri, kıble bulucu ve çok daha fazlası.',
    metaDescription: 'Ücretsiz İslami araçlar: Zekat hesaplama, namaz vakitleri, kıble bulma, Kuran okuma, Hicri takvim.',
    newsletterTitle: 'Haftalık İslami Rehberlik',
    newsletterSubtitle: 'Manevi hatırlatıcılar, araç güncellemeleri ve İslami bilgiler alın.',
    newsletterPlaceholder: 'E-postanız',
    newsletterButton: 'Abone Ol',
    darkMode: 'Karanlık Mod',
    lightMode: 'Aydınlık Mod',
  },
  id: {
    tagline: 'Perangkat Islam lengkap untuk setiap Muslim',
    search: 'Cari alat — zakat, kiblat, quran...',
    found: 'Ditemukan', results: 'hasil',
    noTools: 'Tidak ada alat ditemukan', noToolsSub: 'Coba: zakat, shalat, quran...',
    clear: 'Hapus',
    about: 'Tentang', blog: 'Blog', privacy: 'Privasi', contact: 'Kontak', faq: 'FAQ', terms: 'Ketentuan',
    mostUsed: 'Paling Sering Digunakan', daily: 'Ibadah Harian', finance: 'Keuangan & Sedekah', travel: 'Perjalanan & Ilmu',
    footerMade: 'Dibuat dengan ❤️ untuk Umat', footerFree: 'Selalu Gratis · Tanpa Daftar',
    stats: { tools: '20+ Alat Gratis', free: '100% Gratis', noSignup: 'Tanpa Daftar', mobile: 'Mobile', world: 'Seluruh Dunia', fast: 'Cepat' },
    aboutTitle: 'Tentang I Love Islam',
    aboutText1: 'I Love Islam adalah kumpulan alat Islam gratis untuk Muslim di seluruh dunia.',
    aboutText2: 'Kalkulator zakat, waktu shalat, kiblat, Al-Quran dan masih banyak lagi.',
    metaDescription: 'Alat Islam gratis: Kalkulator zakat, waktu shalat, kiblat, baca Al-Quran, kalender Hijri.',
    newsletterTitle: 'Panduan Islami Mingguan',
    newsletterSubtitle: 'Dapatkan pengingat spiritual, pembaruan alat, dan pengetahuan Islam.',
    newsletterPlaceholder: 'Email Anda',
    newsletterButton: 'Berlangganan',
    darkMode: 'Mode Gelap',
    lightMode: 'Mode Terang',
  },
  ms: {
    tagline: 'Kit alat Islam lengkap untuk setiap Muslim',
    search: 'Cari alat — zakat, kiblat, quran...',
    found: 'Dijumpai', results: 'keputusan',
    noTools: 'Tiada alat dijumpai', noToolsSub: 'Cuba: zakat, solat, quran...',
    clear: 'Padam',
    about: 'Tentang', blog: 'Blog', privacy: 'Privasi', contact: 'Hubungi', faq: 'Soalan Lazim', terms: 'Terma',
    mostUsed: 'Paling Kerap Digunakan', daily: 'Amalan Harian', finance: 'Kewangan & Sedekah', travel: 'Perjalanan & Ilmu',
    footerMade: 'Dibuat dengan ❤️ untuk Umat', footerFree: 'Sentiasa Percuma',
    stats: { tools: '20+ Alat Percuma', free: '100% Percuma', noSignup: 'Tanpa Daftar', mobile: 'Mudah alih', world: 'Seluruh Dunia', fast: 'Laju' },
    aboutTitle: 'Tentang I Love Islam',
    aboutText1: 'I Love Islam ialah koleksi alat Islam percuma untuk Muslim di seluruh dunia.',
    aboutText2: 'Kalkulator zakat, waktu solat, kiblat, Al-Quran dan banyak lagi.',
    metaDescription: 'Alat Islam percuma: Kalkulator zakat, waktu solat, kiblat, baca Al-Quran, kalendar Hijri.',
    newsletterTitle: 'Panduan Islami Mingguan',
    newsletterSubtitle: 'Dapatkan peringatan rohani, kemas kini alat, dan pengetahuan Islam.',
    newsletterPlaceholder: 'E-mel anda',
    newsletterButton: 'Langgan',
    darkMode: 'Mod Gelap',
    lightMode: 'Mod Terang',
  },
  bn: {
    tagline: 'প্রতিটি মুসলিমের জন্য সম্পূর্ণ ইসলামিক টুলকিট',
    search: 'টুল খুঁজুন — যাকাত, কিবলা, কোরআন...',
    found: 'পাওয়া গেছে', results: 'ফলাফল',
    noTools: 'কোনো টুল পাওয়া যায়নি', noToolsSub: 'চেষ্টা করুন: যাকাত, নামাজ, কোরআন...',
    clear: 'পরিষ্কার করুন',
    about: 'সম্পর্কে', blog: 'ব্লগ', privacy: 'গোপনীয়তা', contact: 'যোগাযোগ', faq: 'প্রশ্নোত্তর', terms: 'শর্তাবলী',
    mostUsed: 'সর্বাধিক ব্যবহৃত', daily: 'দৈনিক ইবাদত', finance: 'অর্থ ও দান', travel: 'ভ্রমণ ও জ্ঞান',
    footerMade: 'উম্মতের জন্য ভালোবাসায় তৈরি', footerFree: 'সর্বদা বিনামূল্যে',
    stats: { tools: '২০+ বিনামূল্যে টুল', free: '১০০% বিনামূল্যে', noSignup: 'নিবন্ধন নেই', mobile: 'মোবাইলে চলে', world: 'বিশ্বজুড়ে', fast: 'দ্রুত' },
    aboutTitle: 'I Love Islam টুলস সম্পর্কে',
    aboutText1: 'I Love Islam বিশ্বজুড়ে মুসলিমদের জন্য বিনামূল্যে ইসলামিক টুলের সংগ্রহ।',
    aboutText2: 'যাকাত ক্যালকুলেটর, নামাজের সময়, কিবলা, কোরআন এবং আরও অনেক কিছু।',
    metaDescription: 'বিনামূল্যে ইসলামিক টুলস: যাকাত ক্যালকুলেটর, নামাজের সময়, কিবলা, কোরআন পড়া, হিজরি ক্যালেন্ডার।',
    newsletterTitle: 'সাপ্তাহিক ইসলামিক নির্দেশিকা',
    newsletterSubtitle: 'আধ্যাত্মিক অনুস্মারক, টুল আপডেট এবং ইসলামিক জ্ঞান পান।',
    newsletterPlaceholder: 'আপনার ইমেইল',
    newsletterButton: 'সাবস্ক্রাইব',
    darkMode: 'ডার্ক মোড',
    lightMode: 'লাইট মোড',
  },
};

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', direction: 'ltr' },
  { code: 'ar', label: 'عربي', flag: '🇸🇦', direction: 'rtl' },
  { code: 'ur', label: 'اردو', flag: '🇵🇰', direction: 'rtl' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', direction: 'ltr' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷', direction: 'ltr' },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩', direction: 'ltr' },
  { code: 'ms', label: 'Melayu', flag: '🇲🇾', direction: 'ltr' },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩', direction: 'ltr' },
];

const RTL_LANGS = ['ar', 'ur'];

const TOOLS_DATA = (t: TranslationsType) => [
  {
    category: t.mostUsed, emoji: '⭐',
    items: [
      { name: 'Zakat Calculator', desc: 'Calculate your annual zakat', icon: '💰', href: '/zakat', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
      { name: 'Prayer Times', desc: 'Daily salah times', icon: '🕐', href: '/prayer-times', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
      { name: 'Qibla Finder', desc: 'Find Mecca direction', icon: '🧭', href: '/qibla', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
      { name: 'Hijri Calendar', desc: 'Islamic date converter', icon: '🌙', href: '/hijri', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' },
      { name: 'Quran Reader', desc: 'Read with translation', icon: '📖', href: '/quran', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
      { name: 'Dhikr Counter', desc: 'Digital tasbih', icon: '📿', href: '/dhikr', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' },
    ],
  },
  {
    category: t.daily, emoji: '🤲',
    items: [
      { name: 'Dua Generator', desc: 'Prayers for every moment', icon: '🤲', href: '/dua', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
      { name: '99 Names of Allah', desc: 'Asma ul Husna', icon: '⭐', href: '/names', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' },
      { name: 'Ramadan Planner', desc: 'Suhoor & iftar tracker', icon: '🌙', href: '/ramadan', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' },
      { name: 'Hadith Search', desc: 'Search hadith books', icon: '🔍', href: '/hadith', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400' },
    ],
  },
  {
    category: t.finance, emoji: '💝',
    items: [
      { name: 'Sadaqah Tracker', desc: 'Log your charity', icon: '❤️', href: '/sadaqah', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400' },
      { name: 'Islamic Will', desc: 'Draft your Wasiyyah', icon: '📜', href: '/will', color: 'bg-stone-100 text-stone-700 dark:bg-stone-900/40 dark:text-stone-400' },
      { name: 'Inheritance Calc', desc: 'Islamic shares', icon: '⚖️', href: '/inheritance', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' },
      { name: 'Halal Finance', desc: 'Riba-free check', icon: '✅', href: '/halal-finance', color: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-400' },
    ],
  },
  {
    category: t.travel, emoji: '📚',
    items: [
      { name: 'Halal Travel', desc: 'Plan your journey', icon: '🌍', href: '/travel', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
      { name: 'Hajj Checklist', desc: 'Pilgrimage guide', icon: '🕋', href: '/hajj', color: 'bg-stone-100 text-stone-700 dark:bg-stone-900/40 dark:text-stone-400' },
      { name: 'Mosque Finder', desc: 'Nearest masjid', icon: '🕌', href: '/mosque', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
      { name: 'Islamic Names', desc: 'Name meanings', icon: '✏️', href: '/names-finder', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400' },
    ],
  },
];

const SCROLL_KEY = 'iloveislam_scroll_position';
const THEME_KEY = 'iloveislam_theme';
const LANG_KEY = 'iloveislam_lang';

// ==================== COMPONENTS ====================

function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  };

  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      aria-label={darkMode ? 'Light Mode' : 'Dark Mode'}
    >
      {darkMode ? '☀️' : '🌙'}
    </button>
  );
}

function LiveBar() {
  const [time, setTime] = useState('');
  const [hijri, setHijri] = useState('');
  const [gregorian, setGregorian] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setGregorian(now.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchHijri = async () => {
      try {
        const today = new Date();
        const res = await fetch(`https://api.aladhan.com/v1/gToH/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`);
        const data = await res.json();
        if (data.code === 200) {
          const h = data.data.hijri;
          setHijri(`${h.day} ${h.month.en.slice(0, 3)} ${h.year} AH`);
        }
      } catch {
        // Silent fail
      }
    };
    fetchHijri();
  }, []);

  return (
    <div className="flex items-center justify-center gap-4 flex-wrap text-white/50 text-xs mb-5">
      {time && <span>🕐 {time}</span>}
      {gregorian && <span>📅 {gregorian}</span>}
      {hijri && <span>🌙 {hijri}</span>}
    </div>
  );
}

function Newsletter({ t }: { t: TranslationsType }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">📧</span>
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t.newsletterTitle}</h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t.newsletterSubtitle}</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.newsletterPlaceholder}
          required
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
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
        <p className="text-green-600 dark:text-green-400 text-xs mt-2">✓ Subscribed! JazakAllah Khayran.</p>
      )}
    </div>
  );
}

function ToolCard({ tool, onToolClick }: { tool: Tool; onToolClick: (tool: Tool) => void }) {
  return (
    <Link
      href={tool.href}
      onClick={() => onToolClick(tool)}
      className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-md transition-all group flex flex-col items-center text-center"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2 ${tool.color}`}>
        {tool.icon}
      </div>
      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{tool.name}</p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500">{tool.desc}</p>
    </Link>
  );
}

export default function Home() {
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  const isRTL = RTL_LANGS.includes(lang);
  const tools = TOOLS_DATA(t);

  // Load saved settings
  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem(LANG_KEY);
    if (savedLang && TRANSLATIONS[savedLang]) setLang(savedLang);
  }, []);

  // Save scroll position before page unload
  useEffect(() => {
    const saveScroll = () => {
      sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString());
    };
    window.addEventListener('beforeunload', saveScroll);
    return () => window.removeEventListener('beforeunload', saveScroll);
  }, []);

  // Restore scroll position after navigation
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

  const switchLang = useCallback((code: string) => {
    setLang(code);
    localStorage.setItem(LANG_KEY, code);
    setShowLangMenu(false);
  }, []);

  const handleToolClick = (tool: Tool) => {
    sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString());
  };

  // Filter tools
  const filteredTools = useMemo(() => {
    if (!search.trim()) return tools;
    return tools
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          `${item.name} ${item.desc}`.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [search, tools]);

  const totalResults = filteredTools.reduce((acc, s) => acc + s.items.length, 0);
  const currentLang = LANGUAGES.find((l) => l.code === lang);

  // Close language menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showLangMenu && !(e.target as Element).closest('.lang-menu')) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showLangMenu]);

  const statsValues = t.stats ? Object.values(t.stats) : [];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-emerald-700 dark:text-emerald-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #0d5238 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-8 text-white/5 text-7xl">☽</div>
          <div className="absolute bottom-4 right-8 text-white/5 text-6xl">✦</div>
        </div>

        <div className="relative z-10 px-4 pt-4 pb-8 max-w-6xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6" dir="ltr">
            <div className="flex gap-4">
              <Link href="/about" className="text-white/50 hover:text-white/80 text-xs transition">About</Link>
              <Link href="/blog" className="text-white/50 hover:text-white/80 text-xs transition">Blog</Link>
              <Link href="/contact" className="text-white/50 hover:text-white/80 text-xs transition hidden sm:inline">Contact</Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
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
                  <div className="absolute top-8 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50 w-36">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => switchLang(l.code)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left ${
                          lang === l.code ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'
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
          </div>

          {/* Hero */}
          <div className="text-center">
            <h1 className="font-arabic text-5xl md:text-6xl mb-2" style={{ color: '#c8a96e' }}>♡ I Love Islam</h1>
            <p className="text-white/50 text-sm mb-4">{t.tagline}</p>
            <LiveBar />

            {/* Search */}
            <div className="max-w-md mx-auto flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-4 py-2.5 focus-within:border-white/40 transition">
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

            {filteredTools.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
                <p className="text-5xl mb-3">🔍</p>
                <p className="text-gray-700 dark:text-gray-300 font-semibold mb-1">{t.noTools} "{search}"</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">{t.noToolsSub}</p>
                <button onClick={() => setSearch('')} className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm transition">
                  {t.clear}
                </button>
              </div>
            )}

            {filteredTools.map((section) => (
              <div key={section.category} className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span>{section.emoji}</span>
                  <h2 className="text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">{section.category}</h2>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {section.items.map((tool) => (
                    <ToolCard key={tool.name} tool={tool} onToolClick={handleToolClick} />
                  ))}
                </div>
              </div>
            ))}

            {!search && statsValues.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 my-6">
                {statsValues.map((label: string) => (
                  <span key={label} className="text-[10px] text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-700">
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-72">
            <Newsletter t={t} />
          </div>
        </div>

        {!search && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-2">{t.aboutTitle}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t.aboutText1}</p>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t.footerMade} · {t.footerFree}</p>
          <div className="flex flex-wrap justify-center gap-4 mt-3">
            <Link href="/about" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">About</Link>
            <Link href="/privacy" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">Privacy</Link>
            <Link href="/terms" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">Terms</Link>
            <Link href="/contact" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}