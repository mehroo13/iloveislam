'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Script from 'next/script';

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
  kids: string;
  footerMade: string;
  footerFree: string;
  stats: StatsType;
  aboutTitle: string;
  aboutText1: string;
  aboutText2: string;
  newsletterTitle: string;
  newsletterSubtitle: string;
  newsletterPlaceholder: string;
  newsletterButton: string;
}

// ==================== GOOGLE ANALYTICS ID ====================
const GA_MEASUREMENT_ID = 'G-4BDTXNC58M';

// ==================== TRANSLATIONS ====================
const TRANSLATIONS: Record<string, TranslationsType> = {
  en: {
    tagline: 'The complete toolkit for every Muslim',
    search: 'Search tools — zakat, qibla, quran...',
    found: 'Found', results: 'result',
    noTools: 'No tools found', noToolsSub: 'Try: zakat, prayer, quran, qibla...',
    clear: 'Clear Search',
    about: 'About', blog: 'Blog', privacy: 'Privacy', contact: 'Contact', faq: 'FAQ', terms: 'Terms',
    mostUsed: 'Most Used', daily: 'Daily Practice', finance: 'Finance & Giving', travel: 'Travel & Knowledge', kids: '🧒 Kids Corner',
    footerMade: 'Made with ❤️ for the Ummah', footerFree: 'Always Free · No Sign-up',
    stats: { tools: '23 Free Tools', free: '100% Free', noSignup: 'No Sign-up', mobile: 'Works on Mobile', world: 'Works Worldwide', fast: 'Always Fast' },
    aboutTitle: 'About I Love Islam Tools',
    aboutText1: 'I Love Islam is a free collection of Islamic tools for Muslims worldwide — Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Hijri Calendar, Kaffarah Calculator, and much more. Everything in one place, completely free.',
    aboutText2: 'Our tools include Dhikr counter, 99 Names of Allah, Halal Travel guide, Mosque Finder, Islamic Inheritance Calculator, Sadaqah Tracker, Eid ul Adha toolkit, and our unique Mizan Islamic Life Blueprint.',
    newsletterTitle: 'Weekly Islamic Guidance',
    newsletterSubtitle: 'Spiritual reminders and tool updates.',
    newsletterPlaceholder: 'Your email',
    newsletterButton: 'Subscribe',
  },
  ar: {
    tagline: 'مجموعة أدوات إسلامية مجانية لكل مسلم',
    search: 'ابحث — زكاة، قبلة، قرآن...',
    found: 'وجد', results: 'نتيجة',
    noTools: 'لم يتم العثور على أدوات', noToolsSub: 'جرب: زكاة، صلاة، قرآن...',
    clear: 'مسح البحث',
    about: 'عن الموقع', blog: 'مدونة', privacy: 'الخصوصية', contact: 'تواصل معنا', faq: 'الأسئلة الشائعة', terms: 'الشروط',
    mostUsed: 'الأكثر استخداماً', daily: 'الممارسة اليومية', finance: 'المال والعطاء', travel: 'السفر والمعرفة', kids: '🧒 ركن الأطفال',
    footerMade: 'صُنع بمحبة للأمة الإسلامية', footerFree: 'مجاني دائماً · لا تسجيل',
    stats: { tools: '٢٣ أداة', free: '١٠٠٪ مجاني', noSignup: 'لا تسجيل', mobile: 'يعمل على الجوال', world: 'يعمل في كل مكان', fast: 'سريع دائماً' },
    aboutTitle: 'عن أدوات أحب الإسلام',
    aboutText1: 'أحب الإسلام مجموعة مجانية من الأدوات الإسلامية للمسلمين في جميع أنحاء العالم.',
    aboutText2: 'تشمل أدواتنا عداد الذكر وأسماء الله الحسنى ودليل السفر الحلال وأدوات عيد الأضحى والمزيد.',
    newsletterTitle: 'توجيه إسلامي أسبوعي',
    newsletterSubtitle: 'تذكيرات روحية وتحديثات الأدوات.',
    newsletterPlaceholder: 'بريدك الإلكتروني',
    newsletterButton: 'اشتراك',
  },
  ur: {
    tagline: 'ہر مسلمان کے لیے مکمل اسلامی ٹول کٹ',
    search: 'تلاش کریں — زکوٰۃ، قبلہ، قرآن...',
    found: 'ملا', results: 'نتیجہ',
    noTools: 'کوئی ٹول نہیں ملا', noToolsSub: 'تلاش: زکوٰۃ، نماز، قرآن...',
    clear: 'صاف کریں',
    about: 'ہمارے بارے میں', blog: 'بلاگ', privacy: 'رازداری', contact: 'رابطہ', faq: 'سوالات', terms: 'شرائط',
    mostUsed: 'سب سے زیادہ', daily: 'روزانہ عبادت', finance: 'مال اور صدقہ', travel: 'سفر اور علم', kids: '🧒 بچوں کا کونا',
    footerMade: 'امت کے لیے محبت سے', footerFree: 'ہمیشہ مفت · کوئی رجسٹریشن نہیں',
    stats: { tools: '٢٣ مفت ٹولز', free: '١٠٠٪ مفت', noSignup: 'سائن اپ نہیں', mobile: 'موبائل پر', world: 'دنیا بھر میں', fast: 'تیز' },
    aboutTitle: 'I Love Islam کے بارے میں',
    aboutText1: 'I Love Islam دنیا بھر کے مسلمانوں کے لیے مفت اسلامی ٹولز کا مجموعہ ہے۔',
    aboutText2: 'ذکر کاؤنٹر، اللہ کے ۹۹ نام، عید الاضحیٰ ٹول کٹ، میزان لائف بلیو پرنٹ اور بہت کچھ۔',
    newsletterTitle: 'ہفتہ وار اسلامی رہنمائی',
    newsletterSubtitle: 'روحانی یاد دہانیاں اور اپ ڈیٹس۔',
    newsletterPlaceholder: 'آپ کا ای میل',
    newsletterButton: 'سبسکرائب',
  },
  fr: {
    tagline: 'La boîte à outils islamique pour chaque Muslim',
    search: 'Rechercher — zakat, qibla, coran...',
    found: 'Trouvé', results: 'résultat',
    noTools: 'Aucun outil trouvé', noToolsSub: 'Essayez: zakat, prière, coran...',
    clear: 'Effacer',
    about: 'À propos', blog: 'Blog', privacy: 'Confidentialité', contact: 'Contact', faq: 'FAQ', terms: 'Conditions',
    mostUsed: 'Les plus utilisés', daily: 'Pratique quotidienne', finance: 'Finance & Dons', travel: 'Voyage & Savoir', kids: '🧒 Coin des enfants',
    footerMade: 'Fait avec ❤️ pour la Oumma', footerFree: 'Toujours gratuit · Sans inscription',
    stats: { tools: '23 Outils', free: '100% Gratuit', noSignup: 'Sans inscription', mobile: 'Mobile', world: 'Mondial', fast: 'Rapide' },
    aboutTitle: 'À propos de I Love Islam',
    aboutText1: 'I Love Islam est une collection gratuite d\'outils islamiques — Zakat, horaires de prière, Qibla, Coran et bien plus.',
    aboutText2: 'Compteur de Dhikr, 99 noms d\'Allah, guide de voyage halal, kit Aïd el-Adha, et notre outil unique Mizan.',
    newsletterTitle: 'Guidance islamique hebdomadaire',
    newsletterSubtitle: 'Rappels spirituels et mises à jour.',
    newsletterPlaceholder: 'Votre email',
    newsletterButton: 'S\'abonner',
  },
  tr: {
    tagline: 'Her Müslüman için tam İslami araç seti',
    search: 'Ara — zekat, kıble, kuran...',
    found: 'Bulundu', results: 'sonuç',
    noTools: 'Araç bulunamadı', noToolsSub: 'Deneyin: zekat, namaz, kuran...',
    clear: 'Temizle',
    about: 'Hakkında', blog: 'Blog', privacy: 'Gizlilik', contact: 'İletişim', faq: 'SSS', terms: 'Şartlar',
    mostUsed: 'En Çok Kullanılan', daily: 'Günlük İbadet', finance: 'Finans & Sadaka', travel: 'Seyahat & Bilgi', kids: '🧒 Çocuk Köşesi',
    footerMade: 'Ümmet için sevgiyle', footerFree: 'Her zaman ücretsiz',
    stats: { tools: '23 Araç', free: '%100 Ücretsiz', noSignup: 'Kayıt yok', mobile: 'Mobil', world: 'Dünya geneli', fast: 'Hızlı' },
    aboutTitle: 'I Love Islam Hakkında',
    aboutText1: 'I Love Islam, Müslümanlar için ücretsiz İslami araçlar — Zekat, namaz vakitleri, kıble, Kuran ve daha fazlası.',
    aboutText2: 'Dhikr sayacı, Allah\'ın 99 ismi, helal seyahat rehberi, Kurban Bayramı araç seti ve Mizan aracımız.',
    newsletterTitle: 'Haftalık İslami Rehberlik',
    newsletterSubtitle: 'Manevi hatırlatmalar ve güncellemeler.',
    newsletterPlaceholder: 'E-postanız',
    newsletterButton: 'Abone ol',
  },
  id: {
    tagline: 'Perangkat Islam lengkap untuk setiap Muslim',
    search: 'Cari — zakat, kiblat, quran...',
    found: 'Ditemukan', results: 'hasil',
    noTools: 'Tidak ada alat', noToolsSub: 'Coba: zakat, shalat, quran...',
    clear: 'Hapus',
    about: 'Tentang', blog: 'Blog', privacy: 'Privasi', contact: 'Kontak', faq: 'FAQ', terms: 'Ketentuan',
    mostUsed: 'Paling Sering', daily: 'Ibadah Harian', finance: 'Keuangan & Sedekah', travel: 'Perjalanan & Ilmu', kids: '🧒 Sudut Anak',
    footerMade: 'Dibuat dengan ❤️ untuk Umat', footerFree: 'Selalu Gratis',
    stats: { tools: '23 Alat', free: '100% Gratis', noSignup: 'Tanpa Daftar', mobile: 'Mobile', world: 'Seluruh Dunia', fast: 'Cepat' },
    aboutTitle: 'Tentang I Love Islam',
    aboutText1: 'I Love Islam adalah kumpulan alat Islam gratis — Kalkulator zakat, waktu shalat, kiblat, Al-Quran dan masih banyak lagi.',
    aboutText2: 'Penghitung dzikir, 99 Nama Allah, panduan halal, kit Idul Adha, dan Mizan Blueprint.',
    newsletterTitle: 'Bimbingan Islam Mingguan',
    newsletterSubtitle: 'Pengingat spiritual dan pembaruan.',
    newsletterPlaceholder: 'Email Anda',
    newsletterButton: 'Berlangganan',
  },
  ms: {
    tagline: 'Kit alat Islam lengkap untuk setiap Muslim',
    search: 'Cari — zakat, kiblat, quran...',
    found: 'Dijumpai', results: 'keputusan',
    noTools: 'Tiada alat', noToolsSub: 'Cuba: zakat, solat, quran...',
    clear: 'Padam',
    about: 'Tentang', blog: 'Blog', privacy: 'Privasi', contact: 'Hubungi', faq: 'Soalan Lazim', terms: 'Terma',
    mostUsed: 'Paling Kerap', daily: 'Amalan Harian', finance: 'Kewangan & Sedekah', travel: 'Perjalanan & Ilmu', kids: '🧒 Sudut Kanak-kanak',
    footerMade: 'Dibuat dengan ❤️ untuk Umat', footerFree: 'Sentiasa Percuma',
    stats: { tools: '23 Alat', free: '100% Percuma', noSignup: 'Tanpa Daftar', mobile: 'Mudah alih', world: 'Seluruh Dunia', fast: 'Laju' },
    aboutTitle: 'Tentang I Love Islam',
    aboutText1: 'I Love Islam ialah koleksi alat Islam percuma — kalkulator zakat, waktu solat, kiblat, Al-Quran dan banyak lagi.',
    aboutText2: 'Pembilang zikir, 99 Nama Allah, panduan halal, kit Hari Raya Aidiladha dan Mizan Blueprint.',
    newsletterTitle: 'Panduan Islam Mingguan',
    newsletterSubtitle: 'Peringatan rohani dan kemas kini.',
    newsletterPlaceholder: 'E-mel anda',
    newsletterButton: 'Langgan',
  },
  bn: {
    tagline: 'প্রতিটি মুসলিমের জন্য সম্পূর্ণ ইসলামিক টুলকিট',
    search: 'খুঁজুন — যাকাত, কিবলা, কোরআন...',
    found: 'পাওয়া গেছে', results: 'ফলাফল',
    noTools: 'কোনো টুল পাওয়া যায়নি', noToolsSub: 'চেষ্টা: যাকাত, নামাজ, কোরআন...',
    clear: 'মুছুন',
    about: 'সম্পর্কে', blog: 'ব্লগ', privacy: 'গোপনীয়তা', contact: 'যোগাযোগ', faq: 'প্রশ্নোত্তর', terms: 'শর্তাবলী',
    mostUsed: 'সর্বাধিক ব্যবহৃত', daily: 'দৈনিক ইবাদত', finance: 'অর্থ ও দান', travel: 'ভ্রমণ ও জ্ঞান', kids: '🧒 বাচ্চাদের কর্নার',
    footerMade: 'উম্মতের জন্য ভালোবাসায়', footerFree: 'সর্বদা বিনামূল্যে',
    stats: { tools: '২৩ টুল', free: '১০০% বিনামূল্যে', noSignup: 'নিবন্ধন নেই', mobile: 'মোবাইলে', world: 'বিশ্বজুড়ে', fast: 'দ্রুত' },
    aboutTitle: 'I Love Islam সম্পর্কে',
    aboutText1: 'I Love Islam বিশ্বজুড়ে মুসলিমদের জন্য বিনামূল্যে ইসলামিক টুলের সংগ্রহ।',
    aboutText2: 'ধিকর কাউন্টার, আল্লাহর ৯৯ নাম, হালাল ভ্রমণ গাইড, ঈদুল আযহা টুলকিট এবং মিযান ব্লুপ্রিন্ট।',
    newsletterTitle: 'সাপ্তাহিক ইসলামিক গাইডেন্স',
    newsletterSubtitle: 'আধ্যাত্মিক স্মরণ এবং আপডেট।',
    newsletterPlaceholder: 'আপনার ইমেইল',
    newsletterButton: 'সাবস্ক্রাইব',
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

// ==================== DAILY QUOTES ====================
const DAILY_QUOTES = [
  { text: "Indeed, with hardship will be ease.", source: "Quran 94:6", arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا" },
  { text: "And He found you lost and guided you.", source: "Quran 93:7", arabic: "وَوَجَدَكَ ضَالًّا فَهَدَىٰ" },
  { text: "So remember Me; I will remember you.", source: "Quran 2:152", arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ" },
  { text: "Allah does not burden a soul beyond that it can bear.", source: "Quran 2:286", arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا" },
  { text: "Verily, the most honoured of you in the sight of Allah is the most righteous.", source: "Quran 49:13", arabic: "إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ" },
  { text: "And put your trust in Allah if you are believers.", source: "Quran 5:23", arabic: "وَعَلَى اللَّهِ فَتَوَكَّلُوا إِن كُنتُم مُّؤْمِنِينَ" },
  { text: "The strong person is one who controls himself when angry.", source: "Bukhari & Muslim", arabic: "لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ" },
  { text: "Make things easy and do not make them difficult.", source: "Bukhari", arabic: "يَسِّرُوا وَلَا تُعَسِّرُوا" },
  { text: "The best of people are those who are most beneficial to others.", source: "Al-Mu'jam al-Awsat", arabic: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ" },
  { text: "None of you truly believes until he loves for his brother what he loves for himself.", source: "Bukhari & Muslim", arabic: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ" },
  { text: "Speak good or remain silent.", source: "Bukhari & Muslim", arabic: "" },
  { text: "Smiling at your brother is an act of charity.", source: "Tirmidhi", arabic: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ" },
  { text: "The most beloved deeds to Allah are those done consistently, even if they are small.", source: "Bukhari & Muslim", arabic: "" },
  { text: "Verily, Allah does not look at your appearance or wealth, but He looks at your hearts and deeds.", source: "Muslim", arabic: "" },
  { text: "Be in this world as if you were a stranger or a traveller.", source: "Bukhari", arabic: "كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ أَوْ عَابِرُ سَبِيلٍ" },
  { text: "O Allah, You are Forgiving and love forgiveness, so forgive me.", source: "Tirmidhi", arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي" },
  { text: "The world is a prison for the believer and a paradise for the disbeliever.", source: "Muslim", arabic: "الدُّنْيَا سِجْنُ الْمُؤْمِنِ وَجَنَّةُ الْكَافِرِ" },
  { text: "Fear Allah wherever you are, and follow a bad deed with a good one to erase it.", source: "Tirmidhi", arabic: "" },
  { text: "Give charity without delay, for it stands in the way of calamity.", source: "Tirmidhi", arabic: "" },
  { text: "Allah is beautiful and He loves beauty.", source: "Muslim", arabic: "إِنَّ اللَّهَ جَمِيلٌ يُحِبُّ الْجَمَالَ" },
  { text: "The heaviest thing on the scale of deeds is good character.", source: "Abu Dawud & Tirmidhi", arabic: "" },
  { text: "Tie your camel, then put your trust in Allah.", source: "Tirmidhi", arabic: "" },
  { text: "Seek knowledge from the cradle to the grave.", source: "Attributed tradition", arabic: "اطْلُبُوا الْعِلْمَ مِنَ الْمَهْدِ إِلَى اللَّحْدِ" },
  { text: "Take benefit of five before five: your youth, your health, your wealth, your free time, and your life.", source: "Al-Hakim", arabic: "" },
  { text: "Whoever does not show mercy to people, Allah will not show mercy to him.", source: "Bukhari & Muslim", arabic: "مَنْ لَا يَرْحَمُ لَا يُرْحَمُ" },
  { text: "Do not look at how small the sin is, but look at how great is the One you are sinning against.", source: "Ibn Mas'ud", arabic: "" },
  { text: "Whoever teaches good, Allah and His angels and all creation send blessings upon him.", source: "Tirmidhi", arabic: "" },
  { text: "The best of you are those who are best to their families.", source: "Tirmidhi", arabic: "" },
  { text: "He who has no mercy for others will receive no mercy.", source: "Bukhari", arabic: "" },
  { text: "None of you will enter Paradise by his deeds alone — except by the Mercy of Allah.", source: "Bukhari", arabic: "" },
];

// ==================== ALL TOOLS FOR FEATURED BANNER (dynamic, day-based) ====================
const ALL_FEATURED_TOOLS = [
  { href: '/mizan', badge: '✨ Featured', title: 'Mizan — Islamic Life Blueprint', desc: 'Discover your purpose through Islamic numerology', icon: '✦', gradient: 'linear-gradient(135deg, #1a0a00, #3d1f00)', accent: '#c8a96e' },
  { href: '/zakat', badge: '💰 Finance', title: 'Zakat Calculator', desc: 'Calculate your annual Zakat with precision', icon: '💰', gradient: 'linear-gradient(135deg, #0a1f0a, #0d3d1a)', accent: '#4ade80' },
  { href: '/prayer-times', badge: '🕐 Daily', title: 'Prayer Times', desc: 'Accurate salah times for your location', icon: '🕐', gradient: 'linear-gradient(135deg, #0a0a2e, #1a1a5c)', accent: '#818cf8' },
  { href: '/qibla', badge: '🧭 Travel', title: 'Qibla Finder', desc: 'Find the direction of Mecca instantly', icon: '🧭', gradient: 'linear-gradient(135deg, #1a1000, #3d2800)', accent: '#fbbf24' },
  { href: '/quran', badge: '📖 Quran', title: 'Quran Reader', desc: 'Read and listen with full translation', icon: '📖', gradient: 'linear-gradient(135deg, #0f1a0a, #1a3d10)', accent: '#86efac' },
  { href: '/dhikr', badge: '📿 Worship', title: 'Dhikr Counter', desc: 'Your digital tasbih for daily remembrance', icon: '📿', gradient: 'linear-gradient(135deg, #1a0a1a, #2d1040)', accent: '#c084fc' },
  { href: '/hijri', badge: '🌙 Calendar', title: 'Hijri Calendar', desc: 'Convert Islamic and Gregorian dates', icon: '🌙', gradient: 'linear-gradient(135deg, #0a0f1a, #101a3d)', accent: '#7dd3fc' },
  { href: '/kids', badge: '🎮 Kids!', title: 'Islamic Games Hub', desc: '5 fun educational games for children', icon: '🧒', gradient: 'linear-gradient(135deg, #1a0a14, #3d1028)', accent: '#f9a8d4' },
  { href: '/names', badge: '⭐ Asma', title: '99 Names of Allah', desc: 'Explore and reflect on Asma ul Husna', icon: '⭐', gradient: 'linear-gradient(135deg, #1a0800, #3d1400)', accent: '#fb923c' },
  { href: '/ramadan', badge: '🌙 Ramadan', title: 'Ramadan Planner', desc: 'Suhoor, Iftar & worship tracker', icon: '🌙', gradient: 'linear-gradient(135deg, #080a1a, #101840)', accent: '#a5b4fc' },
  { href: '/hadith', badge: '🔍 Knowledge', title: 'Hadith Search', desc: 'Search authenticated hadith collections', icon: '🔍', gradient: 'linear-gradient(135deg, #0a1010, #103030)', accent: '#67e8f9' },
  { href: '/sadaqah', badge: '❤️ Giving', title: 'Sadaqah Tracker', desc: 'Log your charity and track your giving', icon: '❤️', gradient: 'linear-gradient(135deg, #1a0808, #3d1010)', accent: '#fca5a5' },
  { href: '/inheritance', badge: '⚖️ Finance', title: 'Inheritance Calculator', desc: 'Calculate Islamic inheritance shares', icon: '⚖️', gradient: 'linear-gradient(135deg, #100a00, #281800)', accent: '#fcd34d' },
  { href: '/halal-finance', badge: '✅ Finance', title: 'Halal Finance Check', desc: 'Verify if your investment is Riba-free', icon: '✅', gradient: 'linear-gradient(135deg, #061a06, #0a2e0a)', accent: '#6ee7b7' },
  { href: '/mosque', badge: '🕌 Travel', title: 'Mosque Finder', desc: 'Find the nearest masjid to you', icon: '🕌', gradient: 'linear-gradient(135deg, #081a0e, #103d1a)', accent: '#34d399' },
  { href: '/dua', badge: '🤲 Dua', title: 'Dua Generator', desc: 'Supplications for every moment of life', icon: '🤲', gradient: 'linear-gradient(135deg, #1a1000, #302000)', accent: '#fde68a' },
  { href: '/will', badge: '📜 Legal', title: 'Islamic Will', desc: 'Draft your Wasiyyah the right way', icon: '📜', gradient: 'linear-gradient(135deg, #0f0f0f, #252525)', accent: '#d1d5db' },
  { href: '/travel', badge: '🌍 Travel', title: 'Halal Travel Guide', desc: 'Plan a halal-friendly journey anywhere', icon: '🌍', gradient: 'linear-gradient(135deg, #001a14, #003d2a)', accent: '#2dd4bf' },
  { href: '/hajj', badge: '🕋 Hajj', title: 'Hajj Checklist', desc: 'Complete guide for your pilgrimage', icon: '🕋', gradient: 'linear-gradient(135deg, #100800, #301800)', accent: '#f59e0b' },
  { href: '/kaffarah', badge: '📋 Fiqh', title: 'Kaffarah Calculator', desc: 'Expiation for broken oaths and fasts', icon: '📋', gradient: 'linear-gradient(135deg, #0f0a00, #1f1400)', accent: '#fbbf24' },
  { href: '/names-finder', badge: '✏️ Names', title: 'Islamic Name Finder', desc: 'Beautiful names with meanings & origins', icon: '✏️', gradient: 'linear-gradient(135deg, #100a18, #201030)', accent: '#d8b4fe' },
  { href: '/eid', badge: '🗓️ Events', title: 'Islamic Events', desc: 'Eid, Ramadan & key Islamic dates', icon: '🗓️', gradient: 'linear-gradient(135deg, #1a0c00, #3d1a00)', accent: '#fdba74' },
  { href: '/eid-adha', badge: '🐄 Eid ul Adha', title: 'Eid ul Adha Toolkit', desc: 'Qurbani calc, takbeer, checklist & recipes', icon: '🐄', gradient: 'linear-gradient(135deg, #0d1a00, #1a3300)', accent: '#a3e635' },
];

// ==================== TOOLS DATA ====================
const TOOLS_DATA = (t: TranslationsType) => [
  {
    category: t.mostUsed, emoji: '⭐',
    items: [
      { name: 'Zakat Calculator', desc: 'Calculate your annual zakat', icon: '💰', href: '/zakat', color: 'bg-emerald-100 text-emerald-700' },
      { name: 'Prayer Times', desc: 'Daily salah times', icon: '🕐', href: '/prayer-times', color: 'bg-blue-100 text-blue-700' },
      { name: 'Qibla Finder', desc: 'Find Mecca direction', icon: '🧭', href: '/qibla', color: 'bg-amber-100 text-amber-700' },
      { name: 'Hijri Calendar', desc: 'Islamic date converter', icon: '🌙', href: '/hijri', color: 'bg-purple-100 text-purple-700' },
      { name: 'Quran Reader', desc: 'Read with translation', icon: '📖', href: '/quran', color: 'bg-green-100 text-green-700' },
      { name: 'Dhikr Counter', desc: 'Digital tasbih', icon: '📿', href: '/dhikr', color: 'bg-teal-100 text-teal-700' },
    ],
  },
  {
    category: t.daily, emoji: '🤲',
    items: [
      { name: 'Dua Generator', desc: 'Prayers for every moment', icon: '🤲', href: '/dua', color: 'bg-amber-100 text-amber-700' },
      { name: '99 Names of Allah', desc: 'Asma ul Husna', icon: '⭐', href: '/names', color: 'bg-rose-100 text-rose-700' },
      { name: 'Ramadan Planner', desc: 'Suhoor & iftar tracker', icon: '🌙', href: '/ramadan', color: 'bg-indigo-100 text-indigo-700' },
      { name: 'Hadith Search', desc: 'Search hadith books', icon: '🔍', href: '/hadith', color: 'bg-cyan-100 text-cyan-700' },
      { name: 'Mizan Blueprint', desc: 'Islamic life purpose', icon: '✦', href: '/mizan', color: 'bg-amber-100 text-amber-700' },
    ],
  },
  {
    category: t.finance, emoji: '💝',
    items: [
      { name: 'Sadaqah Tracker', desc: 'Log your charity', icon: '❤️', href: '/sadaqah', color: 'bg-pink-100 text-pink-700' },
      { name: 'Islamic Will', desc: 'Draft your Wasiyyah', icon: '📜', href: '/will', color: 'bg-stone-100 text-stone-700' },
      { name: 'Inheritance Calc', desc: 'Islamic shares', icon: '⚖️', href: '/inheritance', color: 'bg-orange-100 text-orange-700' },
      { name: 'Halal Finance', desc: 'Riba-free check', icon: '✅', href: '/halal-finance', color: 'bg-lime-100 text-lime-700' },
      { name: 'Kaffarah Calc', desc: 'Expiation for oaths', icon: '📋', href: '/kaffarah', color: 'bg-yellow-100 text-yellow-700' },
    ],
  },
  {
    category: t.travel, emoji: '📚',
    items: [
      { name: 'Halal Travel', desc: 'Plan your journey', icon: '🌍', href: '/travel', color: 'bg-blue-100 text-blue-700' },
      { name: 'Hajj Checklist', desc: 'Pilgrimage guide', icon: '🕋', href: '/hajj', color: 'bg-stone-100 text-stone-700' },
      { name: 'Mosque Finder', desc: 'Nearest masjid', icon: '🕌', href: '/mosque', color: 'bg-emerald-100 text-emerald-700' },
      { name: 'Islamic Names', desc: 'Name meanings', icon: '✏️', href: '/names-finder', color: 'bg-violet-100 text-violet-700' },
      { name: 'Islamic Events', desc: 'Eid & Ramadan dates', icon: '🗓️', href: '/eid', color: 'bg-amber-100 text-amber-700' },
      { name: 'Eid ul Adha Toolkit', desc: 'Qurbani, takbeer & more', icon: '🐄', href: '/eid-adha', color: 'bg-lime-100 text-lime-700' },
    ],
  },
  {
    category: t.kids, emoji: '🧒',
    items: [
      { name: 'Islamic Games Hub', desc: '5 fun Islamic games for kids', icon: '🎮', href: '/kids', color: 'bg-pink-100 text-pink-700' },
    ],
  },
];

const THEME_KEY = 'iloveislam_theme';
const LANG_KEY = 'iloveislam_lang';
const TOOL_CLICKS_KEY = 'iloveislam_tool_clicks';

// ==================== DARK MODE HOOK ====================
function useDarkMode() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = useCallback(() => {
    setDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return { dark, toggle, mounted };
}

// ==================== TRACK TOOL CLICKS ====================
function trackToolClick(toolName: string) {
  try {
    const clicks = JSON.parse(localStorage.getItem(TOOL_CLICKS_KEY) || '{}');
    clicks[toolName] = (clicks[toolName] || 0) + 1;
    localStorage.setItem(TOOL_CLICKS_KEY, JSON.stringify(clicks));
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'tool_click', {
        event_category: 'engagement',
        event_label: toolName,
        value: clicks[toolName],
      });
    }
  } catch {}
}

// ==================== SCROLL MANAGER ====================
const ScrollManager = {
  save() {
    try {
      const key = 'scroll_' + window.location.pathname;
      sessionStorage.setItem(key, String(Math.round(window.scrollY)));
    } catch {}
  },
};

// ==================== LIVE BAR ====================
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
          setHijri(`${h.day} ${h.month.en} ${h.year} AH`);
        }
      } catch {}
    };
    fetchHijri();
  }, []);

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap text-white/45 text-xs mb-4">
      {time && (
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          {time}
        </span>
      )}
      {gregorian && <span>{gregorian}</span>}
      {hijri && <span className="text-amber-300/70">{hijri}</span>}
    </div>
  );
}

// ==================== QUOTE OF THE DAY ====================
function QuoteOfTheDay() {
  const quote = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
    return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
  }, []);

  return (
    <div
      className="rounded-2xl p-4 mb-5 border relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #071510 0%, #0d2818 100%)', borderColor: 'rgba(200,169,110,0.2)' }}
    >
      <div className="absolute -top-4 -right-4 text-[80px] opacity-[0.04] select-none pointer-events-none leading-none">✦</div>
      <p className="text-[9px] font-bold tracking-[0.2em] uppercase mb-2.5" style={{ color: '#c8a96e' }}>
        ✨ Verse / Hadith of the Day
      </p>
      {quote.arabic && (
        <p className="text-right text-sm leading-loose mb-2.5 font-medium" style={{ color: '#d4aa6e', direction: 'rtl', fontFamily: 'serif' }}>
          {quote.arabic}
        </p>
      )}
      <p className="text-white/75 text-[13px] leading-relaxed italic mb-2">"{quote.text}"</p>
      <p className="text-white/30 text-[10px]">— {quote.source}</p>
    </div>
  );
}

// ==================== NEWSLETTER ====================
function Newsletter({ t }: { t: TranslationsType }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('https://formspree.io/f/xpqbybvq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, _subject: 'Newsletter Subscription — I Love Islam' }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
        setTimeout(() => setStatus('idle'), 4000);
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'newsletter_signup', { event_category: 'engagement', event_label: email });
        }
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800/50">
      <div className="flex items-center gap-2 mb-1">
        <span>📧</span>
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t.newsletterTitle}</h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t.newsletterSubtitle}</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder={t.newsletterPlaceholder} required
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <button
          type="submit" disabled={status === 'loading'}
          className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50 transition-all hover:opacity-90 active:scale-95"
          style={{ background: '#0a3d2e' }}
        >
          {status === 'loading' ? '...' : t.newsletterButton}
        </button>
      </form>
      {status === 'success' && <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-2">✓ JazakAllah Khayran! You're subscribed.</p>}
      {status === 'error' && <p className="text-red-500 text-xs mt-2">Something went wrong. Please try again.</p>}
    </div>
  );
}

// ==================== TOOL CARD ====================
function ToolCard({ tool }: { tool: Tool }) {
  const handleClick = () => {
    trackToolClick(tool.name);
    ScrollManager.save();
  };

  return (
    <Link
      href={tool.href}
      onClick={handleClick}
      className="group bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center text-center active:scale-95"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2 transition-transform duration-200 group-hover:scale-110 ${tool.color}`}>
        {tool.icon}
      </div>
      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight mb-0.5">{tool.name}</p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{tool.desc}</p>
    </Link>
  );
}

// ==================== BACK TO TOP ====================
function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-4 z-50 w-10 h-10 rounded-full text-white shadow-xl flex items-center justify-center text-base transition-all hover:scale-110 active:scale-95"
      style={{ background: 'linear-gradient(135deg, #0a3d2e, #0d5238)' }}
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}

// ==================== DYNAMIC FEATURED BANNER (all tools, day-based rotation) ====================
function FeaturedBanner() {
  const dayIndex = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - start.getTime()) / 86400000);
  }, []);

  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('left');

  const total = ALL_FEATURED_TOOLS.length;
  const currentIdx = (dayIndex + offset) % total;
  const tool = ALL_FEATURED_TOOLS[currentIdx];

  useEffect(() => {
    const timer = setInterval(() => {
      advance('left');
    }, 5000);
    return () => clearInterval(timer);
  }, [offset]);

  const advance = (dir: 'left' | 'right') => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setOffset(prev => dir === 'left' ? prev + 1 : prev - 1 + total);
      setAnimating(false);
    }, 220);
  };

  const handleClick = () => {
    trackToolClick(tool.title);
    ScrollManager.save();
  };

  const dotsCount = Math.min(total, 7);
  const activeDot = currentIdx % dotsCount;

  return (
    <div className="mb-5 relative">
      <div
        className="rounded-2xl overflow-hidden transition-all duration-300"
        style={{ background: tool.gradient }}
      >
        <Link href={tool.href} onClick={handleClick} className="block p-4 group">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
              style={{ background: `${tool.accent}18`, border: `1px solid ${tool.accent}30` }}
            >
              {tool.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold tracking-[0.18em] uppercase mb-0.5" style={{ color: tool.accent }}>
                {tool.badge}
              </p>
              <p className="text-white font-semibold text-sm leading-tight mb-0.5 truncate">{tool.title}</p>
              <p className="text-white/40 text-xs leading-tight truncate">{tool.desc}</p>
            </div>
            <div
              className="flex-shrink-0 text-sm transition-transform duration-200 group-hover:translate-x-1"
              style={{ color: tool.accent }}
            >
              →
            </div>
          </div>
        </Link>

        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex gap-1">
            {Array.from({ length: dotsCount }).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === activeDot ? 16 : 6,
                  height: 6,
                  background: i === activeDot ? tool.accent : `${tool.accent}30`,
                }}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => advance('right')}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all active:scale-90"
              style={{ background: `${tool.accent}20`, color: tool.accent }}
              aria-label="Previous tool"
            >
              ‹
            </button>
            <button
              onClick={() => advance('left')}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all active:scale-90"
              style={{ background: `${tool.accent}20`, color: tool.accent }}
              aria-label="Next tool"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div
        className="absolute -top-2 -right-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
        style={{ background: tool.accent, color: '#000' }}
      >
        {currentIdx + 1}/{total}
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function Home() {
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { dark, toggle: toggleDark, mounted: darkMounted } = useDarkMode();
  const langMenuRef = useRef<HTMLDivElement>(null);
  const langButtonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  const isRTL = RTL_LANGS.includes(lang);

  const tools = useMemo(() => TOOLS_DATA(t), [t]);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem(LANG_KEY);
    if (savedLang && TRANSLATIONS[savedLang]) setLang(savedLang);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showLangMenu &&
        langMenuRef.current && !langMenuRef.current.contains(e.target as Node) &&
        langButtonRef.current && !langButtonRef.current.contains(e.target as Node)
      ) setShowLangMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLangMenu]);

  const switchLang = useCallback((code: string) => {
    setLang(code);
    localStorage.setItem(LANG_KEY, code);
    setShowLangMenu(false);
  }, []);

  const filteredTools = useMemo(() => {
    if (!search.trim()) return tools;
    const q = search.toLowerCase();
    return tools
      .map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.name.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          section.category.toLowerCase().includes(q)
        ),
      }))
      .filter(s => s.items.length > 0);
  }, [search, tools]);

  const totalResults = filteredTools.reduce((acc, s) => acc + s.items.length, 0);
  const currentLang = LANGUAGES.find(l => l.code === lang);

  if (!mounted || !darkMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f6f2' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="text-3xl" style={{ color: '#c8a96e' }}>♡</div>
          <div className="text-emerald-700 text-xs tracking-widest uppercase animate-pulse">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script strategy="lazyOnload" src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      <Script
        id="google-analytics"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}',{page_path:window.location.pathname,send_page_view:true,transport_type:'beacon'});`,
        }}
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* ==================== HEADER ==================== */}
        <header className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #071e14 0%, #0a3d2e 60%, #0d5238 100%)' }}>
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute top-0 left-0 w-48 h-48 rounded-full opacity-[0.04]"
              style={{ background: 'radial-gradient(circle, #c8a96e 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-[0.04]"
              style={{ background: 'radial-gradient(circle, #c8a96e 0%, transparent 70%)', transform: 'translate(30%, 30%)' }} />
            <div className="absolute top-6 right-12 text-white/[0.03] text-7xl select-none">☽</div>
            <div className="absolute bottom-4 left-10 text-white/[0.03] text-5xl select-none">✦</div>
          </div>

          <div className="relative z-10 px-4 pt-3 pb-8 max-w-6xl mx-auto">
            {/* ── TOP NAV BAR ── */}
            <div className="flex items-center justify-between mb-6" dir="ltr">

              {/* LEFT: Logo image + nav links */}
              <div className="flex items-center gap-1">
                {/* Logo image — top left */}
                <Link href="/" aria-label="I Love Islam — Home" className="flex-shrink-0 mr-1 hover:opacity-80 transition-opacity">
                  <Image
                    src="/logo2.png"
                    alt="I Love Islam"
                    width={52}
                    height={52}
                    className="rounded-xl"
                    priority
                  />
                </Link>

                {[
                  { href: '/about', label: t.about },
                  { href: '/blog', label: t.blog },
                  { href: '/faq', label: t.faq, hidden: true },
                  { href: '/contact', label: t.contact, hidden: true },
                ].map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-white/45 hover:text-white/80 text-xs transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/8 ${link.hidden ? 'hidden sm:inline-flex' : ''}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* RIGHT: Dark mode toggle + language switcher */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleDark}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/18 transition-all active:scale-90 text-base"
                  aria-label="Toggle dark mode"
                >
                  {dark ? '☀️' : '🌙'}
                </button>

                <div className="relative">
                  <button
                    ref={langButtonRef}
                    onClick={() => setShowLangMenu(v => !v)}
                    className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-xl px-2.5 py-1.5 text-white/65 text-xs hover:bg-white/18 transition-all"
                  >
                    <span>{currentLang?.flag}</span>
                    <span className="hidden sm:inline">{currentLang?.label}</span>
                    <span className="text-white/35 text-[10px]">▾</span>
                  </button>
                  {showLangMenu && (
                    <div
                      ref={langMenuRef}
                      className="absolute top-10 right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 w-44 py-1"
                      style={{ maxHeight: 280, overflowY: 'auto' }}
                    >
                      {LANGUAGES.map(l => (
                        <button
                          key={l.code}
                          onClick={() => switchLang(l.code)}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition hover:bg-gray-50 dark:hover:bg-gray-700 ${lang === l.code ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          <span>{l.flag}</span>
                          <span className="flex-1">{l.label}</span>
                          {lang === l.code && <span className="text-emerald-500 text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Logo + tagline (centre hero) */}
            <div className="text-center">
              <Link
                href="/"
                className="inline-block text-5xl md:text-6xl mb-1.5 hover:opacity-80 transition-opacity cursor-pointer tracking-tight"
                style={{ color: '#c8a96e', fontFamily: 'serif' }}
                aria-label="I Love Islam — Home"
              >
                ♡ I Love Islam
              </Link>
              <p className="text-white/45 text-xs mb-4 tracking-wide">{t.tagline}</p>

              <LiveBar />

              {/* Search bar */}
              <div className="max-w-md mx-auto">
                <div className="flex items-center gap-3 rounded-2xl px-4 py-3 focus-within:border-white/35 transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <span className="text-white/35 text-base flex-shrink-0">🔍</span>
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={t.search}
                    className="bg-transparent text-white placeholder-white/25 text-sm outline-none flex-1 min-w-0"
                    aria-label="Search Islamic tools"
                  />
                  {search && (
                    <button
                      onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                      className="text-white/35 hover:text-white/70 text-lg leading-none transition-colors flex-shrink-0"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {search && (
                  <div className="mt-2 text-center">
                    {totalResults === 0 ? (
                      <p className="text-white/50 text-xs">
                        No matches for <span className="text-white font-medium">"{search}"</span>
                        <span className="block text-white/25 text-[10px] mt-0.5">Try: zakat · prayer · quran · qibla · dhikr · kids · eid</span>
                      </p>
                    ) : (
                      <p className="text-white/50 text-xs">
                        <span className="text-white font-semibold">{totalResults}</span> {totalResults === 1 ? 'tool' : 'tools'} found
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ==================== MAIN ==================== */}
        <main className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ---- Content column ---- */}
            <div className="flex-1 min-w-0">

              {!search && <QuoteOfTheDay />}
              {!search && <FeaturedBanner />}

              {/* No results */}
              {filteredTools.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center border border-gray-100 dark:border-gray-700">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-gray-700 dark:text-gray-300 font-semibold mb-1">{t.noTools} "{search}"</p>
                  <p className="text-gray-400 text-sm mb-4">{t.noToolsSub}</p>
                  <button
                    onClick={() => setSearch('')}
                    className="px-5 py-2 rounded-xl text-white text-sm transition hover:opacity-90 active:scale-95"
                    style={{ background: '#0a3d2e' }}
                  >
                    {t.clear}
                  </button>
                </div>
              )}

              {/* Tool sections */}
              {filteredTools.map(section => (
                <div key={section.category} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">{section.emoji}</span>
                    <h2 className="text-[10px] font-bold tracking-[0.16em] uppercase text-gray-400 dark:text-gray-500">
                      {section.category}
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-700" />
                    <span className="text-[9px] text-gray-300 dark:text-gray-600 tabular-nums">
                      {section.items.length} tools
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {section.items.map(tool => (
                      <ToolCard key={tool.name} tool={tool} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Stats + About */}
              {!search && (
                <>
                  <div className="flex flex-wrap justify-center gap-2 my-5">
                    {Object.values(t.stats).map(label => (
                      <span
                        key={label}
                        className="text-[10px] text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-700"
                      >
                        {label}
                      </span>
                    ))}
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                    <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-2">{t.aboutTitle}</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed mb-2">{t.aboutText1}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">{t.aboutText2}</p>
                  </div>
                </>
              )}
            </div>

            {/* ---- Sidebar ---- */}
            {!search && (
              <div className="lg:w-64 xl:w-72 flex-shrink-0 space-y-4">
                <Newsletter t={t} />

                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-3">⭐ Popular Tools</p>
                  <div className="space-y-0.5">
                    {[
                      { label: '💰 Zakat Calculator', href: '/zakat', desc: 'Calculate your annual zakat' },
                      { label: '🕐 Prayer Times', href: '/prayer-times', desc: 'Daily salah times' },
                      { label: '🧭 Qibla Finder', href: '/qibla', desc: 'Find Mecca direction' },
                      { label: '📿 Dhikr Counter', href: '/dhikr', desc: 'Digital tasbih' },
                      { label: '📖 Quran Reader', href: '/quran', desc: 'Read with translation' },
                      { label: '🐄 Eid ul Adha', href: '/eid-adha', desc: 'Qurbani toolkit' },
                      { label: '🎮 Kids Games', href: '/kids', desc: 'Fun Islamic games' },
                    ].map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => { trackToolClick(link.label); ScrollManager.save(); }}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all group"
                      >
                        <span>{link.label}</span>
                        <span className="text-gray-300 dark:text-gray-600 group-hover:translate-x-0.5 transition-transform">→</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ==================== FOOTER ==================== */}
        <footer className="mt-8 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="text-center mb-4">
              {/* ── Logo image replacing the text link in footer ── */}
              <Link href="/" aria-label="I Love Islam — Home" className="inline-block hover:opacity-80 transition-opacity">
                <Image
                  src="/logo.png"
                  alt="I Love Islam"
                  width={72}
                  height={72}
                  className="rounded-2xl mx-auto"
                />
              </Link>
              <p className="text-emerald-700 dark:text-emerald-500 text-base mt-2" style={{ fontFamily: 'serif' }}>بسم الله الرحمن الرحيم</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t.footerMade} · {t.footerFree}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 md:gap-5 mb-4">
              {[
                { href: '/about', label: t.about },
                { href: '/blog', label: t.blog },
                { href: '/faq', label: t.faq },
                { href: '/privacy', label: t.privacy },
                { href: '/terms', label: t.terms },
                { href: '/contact', label: t.contact },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <p className="text-center text-[10px] text-gray-300 dark:text-gray-600">
              © {new Date().getFullYear()} iloveislam.life · All tools are free for the Ummah
            </p>
          </div>
        </footer>

        <BackToTop />
      </div>
    </>
  );
}