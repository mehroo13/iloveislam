'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback, Suspense, lazy } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// ==================== TYPES ====================
interface Tool {
  name: string;
  desc: string;
  icon: string;
  href: string;
  color: string;
  category?: string;
}

// ==================== TRANSLATIONS ====================
const TRANSLATIONS: Record<string, {
  tagline: string; search: string; found: string; results: string;
  noTools: string; noToolsSub: string; clear: string;
  about: string; blog: string; privacy: string; contact: string; faq: string; terms: string;
  mostUsed: string; daily: string; finance: string; travel: string;
  footerMade: string; footerFree: string;
  stats: { tools: string; free: string; noSignup: string; mobile: string; world: string; fast: string };
  aboutTitle: string; aboutText1: string; aboutText2: string;
  metaDescription: string;
  newsletterTitle: string; newsletterSubtitle: string; newsletterPlaceholder: string; newsletterButton: string;
  quickActions: string;
  darkMode: string; lightMode: string;
}> = {
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
    metaDescription: 'Free Islamic tools: Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Hijri Calendar, Dhikr Counter, and more. 20+ tools for every Muslim.',
    newsletterTitle: 'Weekly Islamic Guidance',
    newsletterSubtitle: 'Get one email per week with spiritual reminders, tool updates, and Islamic knowledge.',
    newsletterPlaceholder: 'Your email address',
    newsletterButton: 'Subscribe',
    quickActions: 'Quick Actions',
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
    metaDescription: 'أدوات إسلامية مجانية: حاسبة الزكاة، مواقيت الصلاة، اتجاه القبلة، قراءة القرآن، التقويم الهجري، وعدّاد الذكر. أكثر من ٢٠ أداة لكل مسلم.',
    newsletterTitle: 'توجيه إسلامي أسبوعي',
    newsletterSubtitle: 'احصل على بريد إلكتروني واحد أسبوعيًا مع تذكيرات روحية وتحديثات الأدوات والمعرفة الإسلامية.',
    newsletterPlaceholder: 'بريدك الإلكتروني',
    newsletterButton: 'اشتراك',
    quickActions: 'إجراءات سريعة',
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
    metaDescription: 'مفت اسلامی ٹولز: زکوٰۃ کیلکولیٹر، نماز کے اوقات، قبلہ تلاش کریں، قرآن پڑھیں، ہجری کیلنڈر۔ ٢٠+ ٹولز ہر مسلمان کے لیے۔',
    newsletterTitle: 'ہفتہ وار اسلامی رہنمائی',
    newsletterSubtitle: 'ہر ہفتے ایک ای میل روحانی یاد دہانیوں، ٹول اپ ڈیٹس اور اسلامی علم کے ساتھ حاصل کریں۔',
    newsletterPlaceholder: 'آپ کا ای میل پتہ',
    newsletterButton: 'سبسکرائب کریں',
    quickActions: 'فوری اعمال',
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
    metaDescription: 'Outils islamiques gratuits: calculatrice Zakat, horaires de prière, direction Qibla, lecture du Coran, calendrier Hijri. 20+ outils.',
    newsletterTitle: 'Guidance Islamique Hebdomadaire',
    newsletterSubtitle: 'Recevez un e-mail par semaine avec des rappels spirituels, des mises à jour d\'outils et des connaissances islamiques.',
    newsletterPlaceholder: 'Votre adresse e-mail',
    newsletterButton: "S'abonner",
    quickActions: 'Actions Rapides',
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
    metaDescription: 'Ücretsiz İslami araçlar: Zekat hesaplama, namaz vakitleri, kıble bulma, Kuran okuma, Hicri takvim. 20+ araç.',
    newsletterTitle: 'Haftalık İslami Rehberlik',
    newsletterSubtitle: 'Manevi hatırlatıcılar, araç güncellemeleri ve İslami bilgiler içeren haftalık bir e-posta alın.',
    newsletterPlaceholder: 'E-posta adresiniz',
    newsletterButton: 'Abone Ol',
    quickActions: 'Hızlı İşlemler',
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
    metaDescription: 'Alat Islam gratis: Kalkulator zakat, waktu shalat, kiblat, baca Al-Quran, kalender Hijri. 20+ alat.',
    newsletterTitle: 'Panduan Islami Mingguan',
    newsletterSubtitle: 'Dapatkan satu email per minggu dengan pengingat spiritual, pembaruan alat, dan pengetahuan Islam.',
    newsletterPlaceholder: 'Alamat email Anda',
    newsletterButton: 'Berlangganan',
    quickActions: 'Tindakan Cepat',
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
    metaDescription: 'Alat Islam percuma: Kalkulator zakat, waktu solat, kiblat, baca Al-Quran, kalendar Hijri. 20+ alat.',
    newsletterTitle: 'Panduan Islami Mingguan',
    newsletterSubtitle: 'Dapatkan satu e-mel setiap minggu dengan peringatan rohani, kemas kini alat, dan pengetahuan Islam.',
    newsletterPlaceholder: 'Alamat e-mel anda',
    newsletterButton: 'Langgan',
    quickActions: 'Tindakan Pantas',
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
    metaDescription: 'বিনামূল্যে ইসলামিক টুলস: যাকাত ক্যালকুলেটর, নামাজের সময়, কিবলা, কোরআন পড়া, হিজরি ক্যালেন্ডার। ২০+ টুলস।',
    newsletterTitle: 'সাপ্তাহিক ইসলামিক নির্দেশিকা',
    newsletterSubtitle: 'আধ্যাত্মিক অনুস্মারক, টুল আপডেট এবং ইসলামিক জ্ঞান সহ সাপ্তাহিক একটি ইমেল পান।',
    newsletterPlaceholder: 'আপনার ইমেইল ঠিকানা',
    newsletterButton: 'সাবস্ক্রাইব',
    quickActions: 'দ্রুত কর্ম',
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

const QUICK_ACTIONS = [
  { label: 'Calculate Zakat', icon: '💰', href: '/zakat', color: 'bg-emerald-100 text-emerald-700' },
  { label: 'Find Prayer Times', icon: '🕐', href: '/prayer-times', color: 'bg-blue-100 text-blue-700' },
  { label: 'Locate Qibla', icon: '🧭', href: '/qibla', color: 'bg-amber-100 text-amber-700' },
  { label: 'Read Quran', icon: '📖', href: '/quran', color: 'bg-green-100 text-green-700' },
];

const SCROLL_KEY = 'iloveislam_scroll';
const THEME_KEY = 'iloveislam_theme';
const RECENT_TOOLS_KEY = 'iloveislam_recent_tools';

// ==================== COMPONENTS ====================

// Skip to content link
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-emerald-700 focus:p-3 focus:rounded-lg focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}

// Live Bar Component
function LiveBar() {
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
      } catch {
        // Silent fail
      }
    };
    fetchHijri();
  }, []);

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap text-white/50 text-xs mb-5" aria-live="polite">
      {time && <span className="flex items-center gap-1"><span aria-hidden="true">🕐</span><span>{time}</span></span>}
      {gregorian && <span className="flex items-center gap-1"><span aria-hidden="true">📅</span><span>{gregorian}</span></span>}
      {hijri && <span className="flex items-center gap-1"><span aria-hidden="true">🌙</span><span>{hijri}</span></span>}
    </div>
  );
}

// Tool Card Component
function ToolCard({ tool, onToolClick }: { tool: Tool; onToolClick: (tool: Tool) => void }) {
  const handleClick = () => {
    onToolClick(tool);
  };

  return (
    <Link
      href={tool.href}
      onClick={handleClick}
      aria-label={`${tool.name} — ${tool.desc}`}
      className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-200 group relative overflow-hidden active:scale-95 flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110 ${tool.color} dark:bg-opacity-20`} aria-hidden="true">
        {tool.icon}
      </div>
      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight mb-1">{tool.name}</p>
      <p className="text-gray-400 dark:text-gray-500 leading-snug group-hover:text-gray-500 transition-colors" style={{ fontSize: '10px' }}>{tool.desc}</p>
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
        <span className="text-emerald-400 text-xs font-bold">→</span>
      </div>
    </Link>
  );
}

// Quick Actions Component
function QuickActions({ t, lang }: { t: any; lang: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <span>⚡</span>
        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 dark:text-gray-500">{t.quickActions}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`${action.color} dark:bg-opacity-20 rounded-xl p-3 text-center hover:shadow-md transition-all hover:scale-105`}
          >
            <span className="text-2xl block mb-1">{action.icon}</span>
            <span className="text-[11px] font-medium dark:text-gray-300">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Recent Tools Component
function RecentTools({ t, onToolClick }: { t: any; onToolClick: (tool: Tool) => void }) {
  const [recent, setRecent] = useState<Tool[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(RECENT_TOOLS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecent(parsed.slice(0, 5));
      } catch (e) {
        console.error('Failed to load recent tools');
      }
    }
  }, []);

  if (recent.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <span>🔄</span>
        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 dark:text-gray-500">Recently Used</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {recent.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            onClick={() => onToolClick(tool)}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full text-xs text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all border border-gray-100 dark:border-gray-700"
          >
            {tool.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

// Newsletter Signup Component
function Newsletter({ t }: { t: any }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    
    // Store in localStorage for demo (replace with actual API endpoint)
    setTimeout(() => {
      // Save to localStorage for demo purposes
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
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl p-5 mb-6 border border-emerald-100 dark:border-emerald-800">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">📧</span>
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t.newsletterTitle}</h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {t.newsletterSubtitle}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.newsletterPlaceholder}
          required
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition whitespace-nowrap"
        >
          {status === 'loading' ? '...' : t.newsletterButton}
        </button>
      </form>
      {status === 'success' && (
        <p className="text-green-600 dark:text-green-400 text-xs mt-2">✓ Subscribed! JazakAllah Khayran.</p>
      )}
      {status === 'error' && (
        <p className="text-red-500 text-xs mt-2">Something went wrong. Please try again.</p>
      )}
    </div>
  );
}

// Theme Toggle Component
function ThemeToggle({ t }: { t: any }) {
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

  if (!mounted) {
    return <div className="w-8 h-8" />;
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      aria-label={darkMode ? t.lightMode : t.darkMode}
    >
      {darkMode ? '☀️' : '🌙'}
    </button>
  );
}

// Schema.org structured data
function SchemaData() {
  const baseUrl = 'https://www.iloveislam.life';
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'I Love Islam - Islamic Tools',
          description: 'Free Islamic tools: Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Hijri Calendar, and more.',
          url: baseUrl,
          applicationCategory: 'Lifestyle',
          operatingSystem: 'All',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            ratingCount: '1247',
          },
        }),
      }}
    />
  );
}

// PWA Install Prompt Component
function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
        setShowPrompt(false);
      });
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-emerald-200 dark:border-emerald-700 p-3 max-w-xs animate-bounce">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📱</span>
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Install I Love Islam App</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Get quick access to all tools</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium"
        >
          Install
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [recentTools, setRecentTools] = useState<Tool[]>([]);

  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  const isRTL = RTL_LANGS.includes(lang);
  const tools = TOOLS_DATA(t);

  // Load saved language and recent tools
  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('iloveislam_lang');
    if (savedLang && TRANSLATIONS[savedLang]) setLang(savedLang);
    
    const savedRecent = localStorage.getItem(RECENT_TOOLS_KEY);
    if (savedRecent) {
      try {
        setRecentTools(JSON.parse(savedRecent));
      } catch (e) {}
    }
  }, []);

  // Save tool click to recent tools
  const handleToolClick = useCallback((tool: Tool) => {
    const updated = [tool, ...recentTools.filter(t => t.href !== tool.href)].slice(0, 8);
    setRecentTools(updated);
    localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(updated));
  }, [recentTools]);

  const switchLang = useCallback((code: string) => {
    setLang(code);
    localStorage.setItem('iloveislam_lang', code);
    setShowLangMenu(false);
  }, []);

  // Save scroll position
  useEffect(() => {
    const handleScroll = () => sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString());
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position
  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved && mounted) {
      setTimeout(() => window.scrollTo({ top: parseInt(saved), behavior: 'instant' }), 50);
    }
  }, [mounted]);

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
  }, [search, lang]);

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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-emerald-700 dark:text-emerald-400">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
        <title>I Love Islam — Free Islamic Tools for Every Muslim</title>
        <meta name="description" content={t.metaDescription} />
        <meta name="keywords" content="islamic tools, zakat calculator, prayer times, qibla finder, quran reader, hijri calendar, dhikr counter, islamic apps" />
        <meta name="author" content="I Love Islam" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <link rel="canonical" href="https://www.iloveislam.life" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a3d2e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="I Love Islam" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.iloveislam.life" />
        <meta property="og:title" content="I Love Islam — Free Islamic Tools" />
        <meta property="og:description" content={t.metaDescription} />
        <meta property="og:image" content="https://www.iloveislam.life/og-image.jpg" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://www.iloveislam.life" />
        <meta property="twitter:title" content="I Love Islam — Free Islamic Tools" />
        <meta property="twitter:description" content={t.metaDescription} />
        <meta property="twitter:image" content="https://www.iloveislam.life/og-image.jpg" />
        <html lang={lang} dir={isRTL ? 'rtl' : 'ltr'} />
      </head>

      <SkipLink />
      <SchemaData />
      <PWAInstallPrompt />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <header
          className="px-4 pt-4 pb-8 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #0d5238 50%, #0a3d2e 100%)' }}
          role="banner"
        >
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
            <div className="absolute top-4 left-8 text-white/5 text-8xl">☽</div>
            <div className="absolute bottom-4 right-8 text-white/5 text-6xl">✦</div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/[0.03] text-9xl">☽</div>
          </div>

          {/* Top Nav Bar */}
          <div className="relative z-20 flex items-center justify-between mb-6" dir="ltr">
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link href="/about" className="text-white/50 hover:text-white/80 text-xs transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-white/30 rounded px-1">
                {t.about}
              </Link>
              <Link href="/blog" className="text-white/50 hover:text-white/80 text-xs transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-white/30 rounded px-1">
                {t.blog}
              </Link>
              <Link href="/contact" className="text-white/50 hover:text-white/80 text-xs transition-colors whitespace-nowrap hidden sm:inline focus:outline-none focus:ring-2 focus:ring-white/30 rounded px-1">
                {t.contact}
              </Link>
              <Link href="/faq" className="text-white/50 hover:text-white/80 text-xs transition-colors whitespace-nowrap hidden sm:inline focus:outline-none focus:ring-2 focus:ring-white/30 rounded px-1">
                {t.faq}
              </Link>
            </div>

            <div className="flex-1" />

            {/* Theme Toggle + Language Switcher */}
            <div className="flex items-center gap-2">
              <ThemeToggle t={t} />
              
              <div className="relative lang-menu">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white/70 text-xs hover:bg-white/20 transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-white/30"
                  aria-label="Select language"
                  aria-expanded={showLangMenu}
                >
                  <span aria-hidden="true">{currentLang?.flag}</span>
                  <span className="hidden sm:inline">{currentLang?.label}</span>
                  <span className="text-white/40" aria-hidden="true">▾</span>
                </button>

                {showLangMenu && (
                  <div className="absolute top-10 right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 w-44">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => switchLang(l.code)}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${
                          lang === l.code ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                        }`}
                        aria-label={`Switch to ${l.label}`}
                      >
                        <span aria-hidden="true">{l.flag}</span>
                        <span>{l.label}</span>
                        {lang === l.code && <span className="ml-auto text-emerald-500" aria-hidden="true">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10">
            <h1 className="font-arabic text-5xl md:text-6xl mb-2" style={{ color: '#c8a96e' }} aria-label="I Love Islam">
              ♡ I Love Islam
            </h1>
            <p className="text-white/50 text-sm mb-4">{t.tagline}</p>

            <LiveBar />

            {/* Search */}
            <div className="max-w-lg mx-auto flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-5 py-3 shadow-lg backdrop-blur-sm focus-within:border-white/40 transition-all">
              <span className="text-white/40" aria-hidden="true">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.search}
                className="bg-transparent text-white placeholder-white/30 text-sm outline-none flex-1"
                aria-label="Search Islamic tools"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-white/40 hover:text-white transition-colors text-lg leading-none"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {search && (
              <p className="text-white/40 text-xs mt-3" aria-live="polite">
                {t.found} <span className="text-white font-semibold">{totalResults}</span> {t.results}
                {totalResults !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </header>

        <main id="main-content" className="max-w-5xl mx-auto px-4 py-6" role="main">
          {/* Quick Actions */}
          <QuickActions t={t} lang={lang} />

          {/* Recent Tools */}
          <RecentTools t={t} onToolClick={handleToolClick} />

          {/* Newsletter Signup */}
          <Newsletter t={t} />

          {/* Mizan Banner - Featured Tool */}
          {!search && (
            <Link href="/mizan" className="block mb-6 group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-3xl">
              <div
                className="relative rounded-3xl overflow-hidden border border-amber-200/40 hover:shadow-xl hover:shadow-amber-900/10 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #3d1f00 40%, #1a0a00 100%)' }}
              >
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                  <div className="absolute top-3 right-6 text-amber-400/20 text-7xl">✦</div>
                  <div className="absolute bottom-3 left-6 text-amber-400/10 text-5xl">☽</div>
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
                  <div
                    className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border border-amber-400/30"
                    style={{ background: 'rgba(200,169,110,0.15)' }}
                    aria-hidden="true"
                  >✦</div>
                  <div className="flex-1 text-center md:text-left">
                    <span className="text-xs font-bold px-3 py-1 rounded-full border border-amber-400/40 text-amber-400 tracking-widest uppercase mb-2 inline-block">
                      ✨ Featured Tool
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Mizan — Your Islamic Life Blueprint</h2>
                    <p className="text-sm mb-1" style={{ color: '#c8a96e' }}>Discover your personality, life purpose & spiritual path</p>
                    <p className="text-white/30 text-xs">Abjad numerology · 99 Names of Allah · Quranic guidance</p>
                  </div>
                  <div
                    className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm group-hover:scale-105 transition-all"
                    style={{ background: '#c8a96e', color: '#1a0a00' }}
                    aria-hidden="true"
                  >
                    Discover Yours <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* No Results */}
          {filteredTools.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-14 text-center">
              <p className="text-5xl mb-4" aria-hidden="true">🔍</p>
              <p className="text-gray-700 dark:text-gray-300 font-bold text-lg mb-2">{t.noTools} "{search}"</p>
              <p className="text-gray-400 text-sm">{t.noToolsSub}</p>
              <button
                onClick={() => setSearch('')}
                className="mt-5 px-5 py-2 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                style={{ background: '#0a3d2e' }}
              >
                {t.clear}
              </button>
            </div>
          )}

          {/* Tool Sections */}
          {filteredTools.map((section) => (
            <div key={section.category} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span aria-hidden="true">{section.emoji}</span>
                <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-400 dark:text-gray-500">{section.category}</h2>
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
              </div>
              <div
                className={`grid gap-3 ${
                  section.category === t.mostUsed
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6'
                    : 'grid-cols-2 md:grid-cols-4'
                }`}
              >
                {section.items.map((tool) => (
                  <ToolCard key={tool.name} tool={tool} onToolClick={handleToolClick} />
                ))}
              </div>
            </div>
          ))}

          {/* Stats & About Section */}
          {!search && (
            <>
              <div className="flex flex-wrap justify-center gap-2 mt-4 mb-6">
                {Object.values(t.stats).map((label) => (
                  <div key={label} className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full px-3 py-1.5 shadow-sm">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mt-4">
                <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 text-sm">{t.aboutTitle}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed mb-2">{t.aboutText1}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">{t.aboutText2}</p>
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-8 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900" role="contentinfo">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="text-center mb-6">
              <p className="font-arabic text-emerald-800 dark:text-emerald-400 text-2xl mb-1" aria-label="Bismillah">بسم الله الرحمن الرحيم</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">In the name of Allah, the Most Gracious, the Most Merciful</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
              {[
                { label: 'Most Used', links: ['Zakat Calculator', 'Prayer Times', 'Qibla Finder', 'Quran Reader'] },
                { label: 'Daily Practice', links: ['Dhikr Counter', '99 Names of Allah', 'Dua Generator', 'Hadith Search'] },
                { label: 'Finance', links: ['Sadaqah Tracker', 'Inheritance Calculator', 'Halal Finance', 'Islamic Will'] },
                { label: 'More', links: ['Hajj Checklist', 'Mosque Finder', 'Halal Travel', 'Islamic Names'] },
              ].map((col) => (
                <div key={col.label}>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{col.label}</p>
                  {col.links.map((l) => (
                    <p key={l} className="text-xs text-gray-400 dark:text-gray-500 mb-1">{l}</p>
                  ))}
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex flex-wrap items-center justify-center gap-4" dir="ltr">
              <p className="text-xs text-gray-300 dark:text-gray-600">{t.footerMade} · {t.footerFree}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/about" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1">{t.about}</Link>
                <Link href="/blog" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1">{t.blog}</Link>
                <Link href="/contact" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1">{t.contact}</Link>
                <Link href="/faq" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1">{t.faq}</Link>
                <Link href="/terms" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1">{t.terms}</Link>
                <Link href="/privacy" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1">{t.privacy}</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}