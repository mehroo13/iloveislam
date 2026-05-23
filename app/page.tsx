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
    stats: { tools: '25 Free Tools', free: '100% Free', noSignup: 'No Sign-up', mobile: 'Works on Mobile', world: 'Works Worldwide', fast: 'Always Fast' },
    aboutTitle: 'About I Love Islam Tools',
    aboutText1: 'I Love Islam is a free collection of Islamic tools for Muslims worldwide — Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Hijri Calendar, Kaffarah Calculator, and much more. Everything in one place, completely free.',
    aboutText2: 'Our tools include Dhikr counter, 99 Names of Allah, Halal Travel guide, Mosque Finder, Islamic Inheritance Calculator, Sadaqah Tracker, Eid ul Adha toolkit, Islamic Alarm, Night Recitation player, and our unique Mizan Islamic Life Blueprint.',
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
    stats: { tools: '٢٥ أداة', free: '١٠٠٪ مجاني', noSignup: 'لا تسجيل', mobile: 'يعمل على الجوال', world: 'يعمل في كل مكان', fast: 'سريع دائماً' },
    aboutTitle: 'عن أدوات أحب الإسلام',
    aboutText1: 'أحب الإسلام مجموعة مجانية من الأدوات الإسلامية للمسلمين في جميع أنحاء العالم.',
    aboutText2: 'تشمل أدواتنا عداد الذكر وأسماء الله الحسنى ودليل السفر الحلال وأدوات عيد الأضحى ومنبه إسلامي وتلاوة ليلية والمزيد.',
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
    stats: { tools: '٢٥ مفت ٹولز', free: '١٠٠٪ مفت', noSignup: 'سائن اپ نہیں', mobile: 'موبائل پر', world: 'دنیا بھر میں', fast: 'تیز' },
    aboutTitle: 'I Love Islam کے بارے میں',
    aboutText1: 'I Love Islam دنیا بھر کے مسلمانوں کے لیے مفت اسلامی ٹولز کا مجموعہ ہے۔',
    aboutText2: 'ذکر کاؤنٹر، اللہ کے ۹۹ نام، عید الاضحیٰ ٹول کٹ، اسلامی الارم، رات کی تلاوت اور بہت کچھ۔',
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
    stats: { tools: '25 Outils', free: '100% Gratuit', noSignup: 'Sans inscription', mobile: 'Mobile', world: 'Mondial', fast: 'Rapide' },
    aboutTitle: 'À propos de I Love Islam',
    aboutText1: 'I Love Islam est une collection gratuite d\'outils islamiques — Zakat, horaires de prière, Qibla, Coran et bien plus.',
    aboutText2: 'Compteur de Dhikr, 99 noms d\'Allah, guide de voyage halal, kit Aïd el-Adha, alarme islamique, récitation nocturne, et notre outil unique Mizan.',
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
    stats: { tools: '25 Araç', free: '%100 Ücretsiz', noSignup: 'Kayıt yok', mobile: 'Mobil', world: 'Dünya geneli', fast: 'Hızlı' },
    aboutTitle: 'I Love Islam Hakkında',
    aboutText1: 'I Love Islam, Müslümanlar için ücretsiz İslami araçlar — Zekat, namaz vakitleri, kıble, Kuran ve daha fazlası.',
    aboutText2: 'Dhikr sayacı, Allah\'ın 99 ismi, helal seyahat rehberi, Kurban Bayramı araç seti, İslami alarm, gece tilaveti ve Mizan aracımız.',
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
    stats: { tools: '25 Alat', free: '100% Gratis', noSignup: 'Tanpa Daftar', mobile: 'Mobile', world: 'Seluruh Dunia', fast: 'Cepat' },
    aboutTitle: 'Tentang I Love Islam',
    aboutText1: 'I Love Islam adalah kumpulan alat Islam gratis — Kalkulator zakat, waktu shalat, kiblat, Al-Quran dan masih banyak lagi.',
    aboutText2: 'Penghitung dzikir, 99 Nama Allah, panduan halal, kit Idul Adha, alarm Islam, tilawah malam, dan Mizan Blueprint.',
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
    stats: { tools: '25 Alat', free: '100% Percuma', noSignup: 'Tanpa Daftar', mobile: 'Mudah alih', world: 'Seluruh Dunia', fast: 'Laju' },
    aboutTitle: 'Tentang I Love Islam',
    aboutText1: 'I Love Islam ialah koleksi alat Islam percuma — kalkulator zakat, waktu solat, kiblat, Al-Quran dan banyak lagi.',
    aboutText2: 'Pembilang zikir, 99 Nama Allah, panduan halal, kit Hari Raya Aidiladha, penggera Islam, bacaan malam dan Mizan Blueprint.',
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
    stats: { tools: '২৫ টুল', free: '১০০% বিনামূল্যে', noSignup: 'নিবন্ধন নেই', mobile: 'মোবাইলে', world: 'বিশ্বজুড়ে', fast: 'দ্রুত' },
    aboutTitle: 'I Love Islam সম্পর্কে',
    aboutText1: 'I Love Islam বিশ্বজুড়ে মুসলিমদের জন্য বিনামূল্যে ইসলামিক টুলের সংগ্রহ।',
    aboutText2: 'ধিকর কাউন্টার, আল্লাহর ৯৯ নাম, হালাল ভ্রমণ গাইড, ঈদুল আযহা টুলকিট, রাতের তিলাওয়াত, ইসলামিক অ্যালার্ম এবং মিযান ব্লুপ্রিন্ট।',
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
  { text: "And put your trust in Allah if you are believers.", source: "Quran 5:23", arabic: "وَعَلَى اللَّهِ فَتَوَكَّلُوا إِن كُنتُم مُّؤْمِنِينَ" },
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

// ==================== ALL TOOLS FOR FEATURED BANNER ====================
const ALL_FEATURED_TOOLS = [
  { href: '/mizan', badge: '✨ Featured', title: 'Mizan — Islamic Life Blueprint', desc: 'Discover your purpose through Islamic numerology', icon: '✦', gradient: 'linear-gradient(135deg, #1a0a00, #3d1f00)', accent: '#c8a96e' },
  { href: '/zakat', badge: '💰 Finance', title: 'Zakat Calculator', desc: 'Calculate your annual Zakat with precision', icon: '💰', gradient: 'linear-gradient(135deg, #0a1f0a, #0d3d1a)', accent: '#4ade80' },
  { href: '/prayer-times', badge: '🕐 Daily', title: 'Prayer Times', desc: 'Accurate salah times for your location', icon: '🕐', gradient: 'linear-gradient(135deg, #0a0a2e, #1a1a5c)', accent: '#818cf8' },
  { href: '/qibla', badge: '🧭 Travel', title: 'Qibla Finder', desc: 'Find the direction of Mecca instantly', icon: '🧭', gradient: 'linear-gradient(135deg, #1a1000, #3d2800)', accent: '#fbbf24' },
  { href: '/quran', badge: '📖 Quran', title: 'Quran Reader', desc: 'Read and listen with full translation', icon: '📖', gradient: 'linear-gradient(135deg, #0f1a0a, #1a3d10)', accent: '#86efac' },
  { href: '/dhikr', badge: '📿 Worship', title: 'Dhikr Counter', desc: 'Your digital tasbih for daily remembrance', icon: '📿', gradient: 'linear-gradient(135deg, #1a0a1a, #2d1040)', accent: '#c084fc' },
  { href: '/hijri', badge: '🌙 Calendar', title: 'Hijri Calendar', desc: 'Convert Islamic and Gregorian dates', icon: '🌙', gradient: 'linear-gradient(135deg, #0a0f1a, #101a3d)', accent: '#7dd3fc' },
  { href: '/night', badge: '🌙 Sleep', title: 'Night Recitation', desc: 'Sleep with Al-Sudais — Mulk, Ya-Sin & more', icon: '🌙', gradient: 'linear-gradient(135deg, #050d14, #0d1f2d)', accent: '#60a5fa' },
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
      { name: 'Night Recitation', desc: 'Sleep with Quran recitation', icon: '🌙', href: '/night', color: 'bg-blue-100 text-blue-700' },
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
    setDark(prev => { const next = !prev; document.documentElement.classList.toggle('dark', next); localStorage.setItem(THEME_KEY, next ? 'dark' : 'light'); return next; });
  }, []);
  return { dark, toggle, mounted };
}

function trackToolClick(toolName: string) {
  try {
    const clicks = JSON.parse(localStorage.getItem(TOOL_CLICKS_KEY) || '{}');
    clicks[toolName] = (clicks[toolName] || 0) + 1;
    localStorage.setItem(TOOL_CLICKS_KEY, JSON.stringify(clicks));
    if ((window as any).gtag) {
      (window as any).gtag('event', 'tool_click', { event_category: 'engagement', event_label: toolName, value: clicks[toolName] });
    }
  } catch {}
}

function ScrollManager() { return { save: () => { try { const key = 'scroll_' + window.location.pathname; sessionStorage.setItem(key, String(Math.round(window.scrollY))); } catch {} } }; }

function LiveBar() {
  const [time, setTime] = useState('');
  useEffect(() => { const tick = () => { const now = new Date(); setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); }; tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer); }, []);
  return (<div className="flex items-center justify-center gap-3 flex-wrap text-white/45 text-xs mb-4"><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />{time}</span></div>);
}

function ToolCard({ tool }: { tool: Tool }) {
  const handleClick = () => { trackToolClick(tool.name); try { const key = 'scroll_' + window.location.pathname; sessionStorage.setItem(key, String(Math.round(window.scrollY))); } catch {} };
  return (
    <Link href={tool.href} onClick={handleClick} className="group bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center text-center active:scale-95">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2 transition-transform duration-200 group-hover:scale-110 ${tool.color}`}>{tool.icon}</div>
      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight mb-0.5">{tool.name}</p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{tool.desc}</p>
    </Link>
  );
}

export default function Home() {
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { dark, toggle: toggleDark, mounted: darkMounted } = useDarkMode();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); const savedLang = localStorage.getItem(LANG_KEY); if (savedLang && TRANSLATIONS[savedLang]) setLang(savedLang); }, []);

  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  const isRTL = RTL_LANGS.includes(lang);
  const tools = TOOLS_DATA(t);

  const filteredTools = useMemo(() => {
    if (!search.trim()) return tools;
    const q = search.toLowerCase();
    return tools
      .map(section => ({
        ...section,
        items: section.items.filter(item => `${item.name} ${item.desc}`.toLowerCase().includes(q)),
      }))
      .filter(section => section.items.length > 0);
  }, [search, tools]);

  const totalResults = filteredTools.reduce((acc, s) => acc + s.items.length, 0);
  const currentLang = LANGUAGES.find(l => l.code === lang);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showLangMenu && !(e.target as Element).closest('.lang-menu')) setShowLangMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showLangMenu]);

  const switchLang = useCallback((code: string) => { setLang(code); localStorage.setItem(LANG_KEY, code); setShowLangMenu(false); }, []);

  const statsValues = t.stats ? Object.values(t.stats) : [];

  if (!mounted || !darkMounted) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><div className="animate-pulse text-emerald-700 dark:text-emerald-400">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors" dir={isRTL ? 'rtl' : 'ltr'}>
      <Script strategy="lazyOnload" src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      <Script id="google-analytics" strategy="lazyOnload" dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}',{page_path:window.location.pathname,send_page_view:true,transport_type:'beacon'});` }} />

      <header className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #0d5238 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"><div className="absolute top-4 left-8 text-white/5 text-7xl">☽</div><div className="absolute bottom-4 right-8 text-white/5 text-6xl">✦</div></div>
        <div className="relative z-10 px-4 pt-4 pb-8 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6" dir="ltr">
            <div className="flex gap-4">
              <Link href="/about" className="text-white/50 hover:text-white/80 text-xs transition">About</Link>
              <Link href="/blog" className="text-white/50 hover:text-white/80 text-xs transition">Blog</Link>
              <Link href="/contact" className="text-white/50 hover:text-white/80 text-xs transition hidden sm:inline">Contact</Link>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleDark} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition" aria-label="Toggle theme">{dark ? '☀️' : '🌙'}</button>
              <div className="relative lang-menu">
                <button onClick={() => setShowLangMenu(!showLangMenu)} className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-xl px-2.5 py-1.5 text-white/70 text-xs hover:bg-white/20 transition">
                  <span>{currentLang?.flag}</span><span className="hidden sm:inline">{currentLang?.label}</span><span>▾</span>
                </button>
                {showLangMenu && <div className="absolute top-8 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50 w-32">{LANGUAGES.map(l => (<button key={l.code} onClick={() => switchLang(l.code)} className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left ${lang === l.code ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}><span>{l.flag}</span><span>{l.label}</span></button>))}</div>}
              </div>
            </div>
          </div>
          <div className="text-center">
            <h1 className="font-arabic text-5xl md:text-6xl mb-2" style={{ color: '#c8a96e' }}>♡ I Love Islam</h1>
            <p className="text-white/50 text-sm mb-4">{t.tagline}</p>
            <LiveBar />
            <div className="max-w-md mx-auto flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-4 py-2.5 focus-within:border-white/40 transition">
              <span className="text-white/40">🔍</span>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search} className="bg-transparent text-white placeholder-white/30 text-sm outline-none flex-1" />
              {search && <button onClick={() => setSearch('')} className="text-white/40 hover:text-white">✕</button>}
            </div>
            {search && <p className="text-white/40 text-xs mt-2">{t.found} <span className="text-white">{totalResults}</span> {t.results}{totalResults !== 1 ? 's' : ''}</p>}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            {!search && (<Link href="/mizan" className="block mb-6"><div className="bg-gradient-to-r from-amber-900 to-amber-800 rounded-xl p-3 flex items-center gap-3 hover:shadow-lg transition"><div className="w-10 h-10 rounded-xl bg-amber-700/50 flex items-center justify-center text-xl">✦</div><div className="flex-1"><p className="text-amber-300 text-[10px] font-bold">✨ FEATURED</p><p className="text-white text-sm font-semibold">Mizan — Islamic Life Blueprint</p></div><div className="text-amber-400 text-lg">→</div></div></Link>)}
            {filteredTools.length === 0 && (<div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center"><p className="text-5xl mb-3">🔍</p><p className="text-gray-700 dark:text-gray-300 font-semibold mb-1">{t.noTools} "{search}"</p><p className="text-gray-400 text-sm">{t.noToolsSub}</p><button onClick={() => setSearch('')} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm">Clear</button></div>)}
            {filteredTools.map(section => (<div key={section.category} className="mb-8"><div className="flex items-center gap-2 mb-3"><span>{section.emoji}</span><h2 className="text-[10px] font-bold tracking-wider uppercase text-gray-400">{section.category}</h2><div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" /></div><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">{section.items.map(tool => (<ToolCard key={tool.name} tool={tool} />))}</div></div>))}
            {!search && statsValues.length > 0 && (<div className="flex flex-wrap justify-center gap-2 my-6">{statsValues.map(label => (<span key={label} className="text-[10px] text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-700">{label}</span>))}</div>)}
          </div>
          <div className="lg:w-72"><Newsletter t={t} /></div>
        </div>
        {!search && (<div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700"><h2 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-2">{t.aboutTitle}</h2><p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t.aboutText1}</p></div>)}
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-gray-400">{t.footerMade} · {t.footerFree}</p>
          <div className="flex flex-wrap justify-center gap-4 mt-3"><Link href="/about" className="text-xs text-gray-400 hover:text-gray-600">About</Link><Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600">Privacy</Link><Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600">Terms</Link><Link href="/contact" className="text-xs text-gray-400 hover:text-gray-600">Contact</Link></div>
        </div>
      </footer>
      <BackToTop />
    </div>
  );
}
