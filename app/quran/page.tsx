'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * QURAN READER COMPONENT (INDO-PAK / SOUTH ASIAN STYLE)
 * 
 * Features:
 * - Indo-Pak (South Asian) Arabic script support
 * - Corrected Bismillah logic: Shown once at top, stripped from verse 1
 * - Surah At-Tawbah (9) exception: No Bismillah at start
 * - Urdu and English translations
 * - Mushaf and Verse-by-Verse modes
 */

interface Surah {
  number: number;
  name: string;
  arabic: string;
  urduName: string;
  meaning: string;
  meaningUrdu: string;
  verses: number;
  juz: number;
  makki: boolean;
}

interface Verse {
  number: number;
  arabic: string;
  translation: string;
}

interface Bookmark {
  number: number;
  name: string;
  arabic: string;
}

const SURAHS: Surah[] = [
  { number: 1, name: 'Al-Fatihah', arabic: 'الفاتحة', urduName: 'الفاتحہ', meaning: 'The Opening', meaningUrdu: 'افتتاحیہ', verses: 7, juz: 1, makki: true },
  { number: 2, name: 'Al-Baqarah', arabic: 'البقرة', urduName: 'البقرہ', meaning: 'The Cow', meaningUrdu: 'گائے', verses: 286, juz: 1, makki: false },
  { number: 3, name: 'Ali Imran', arabic: 'آل عمران', urduName: 'آل عمران', meaning: 'Family of Imran', meaningUrdu: 'عمران کا خاندان', verses: 200, juz: 3, makki: false },
  { number: 4, name: 'An-Nisa', arabic: 'النساء', urduName: 'النساء', meaning: 'The Women', meaningUrdu: 'عورتیں', verses: 176, juz: 4, makki: false },
  { number: 5, name: 'Al-Maidah', arabic: 'المائدة', urduName: 'المائدہ', meaning: 'The Table Spread', meaningUrdu: 'خوان', verses: 120, juz: 6, makki: false },
  { number: 6, name: 'Al-Anam', arabic: 'الأنعام', urduName: 'الأنعام', meaning: 'The Cattle', meaningUrdu: 'چوپائے', verses: 165, juz: 7, makki: true },
  { number: 7, name: 'Al-Araf', arabic: 'الأعراف', urduName: 'الأعراف', meaning: 'The Heights', meaningUrdu: 'اعراف', verses: 206, juz: 8, makki: true },
  { number: 8, name: 'Al-Anfal', arabic: 'الأنفال', urduName: 'الأنفال', meaning: 'The Spoils of War', meaningUrdu: 'مال غنیمت', verses: 75, juz: 9, makki: false },
  { number: 9, name: 'At-Tawbah', arabic: 'التوبة', urduName: 'التوبہ', meaning: 'The Repentance', meaningUrdu: 'توبہ', verses: 129, juz: 10, makki: false },
  { number: 10, name: 'Yunus', arabic: 'يونس', urduName: 'یونس', meaning: 'Jonah', meaningUrdu: 'یونس علیہ السلام', verses: 109, juz: 11, makki: true },
  { number: 11, name: 'Hud', arabic: 'هود', urduName: 'ھود', meaning: 'Hud', meaningUrdu: 'ھود علیہ السلام', verses: 123, juz: 12, makki: true },
  { number: 12, name: 'Yusuf', arabic: 'يوسف', urduName: 'یوسف', meaning: 'Joseph', meaningUrdu: 'یوسف علیہ السلام', verses: 111, juz: 12, makki: true },
  { number: 13, name: 'Ar-Rad', arabic: 'الرعد', urduName: 'الرعد', meaning: 'The Thunder', meaningUrdu: 'بادل کی گرج', verses: 43, juz: 13, makki: false },
  { number: 14, name: 'Ibrahim', arabic: 'إبراهيم', urduName: 'ابراہیم', meaning: 'Abraham', meaningUrdu: 'ابراہیم علیہ السلام', verses: 52, juz: 13, makki: true },
  { number: 15, name: 'Al-Hijr', arabic: 'الحجر', urduName: 'الحجر', meaning: 'The Rocky Tract', meaningUrdu: 'پتھر کی وادی', verses: 99, juz: 14, makki: true },
  { number: 16, name: 'An-Nahl', arabic: 'النحل', urduName: 'النحل', meaning: 'The Bee', meaningUrdu: 'شہد کی مکھی', verses: 128, juz: 14, makki: false },
  { number: 17, name: 'Al-Isra', arabic: 'الإسراء', urduName: 'الإسراء', meaning: 'The Night Journey', meaningUrdu: 'معراج', verses: 111, juz: 15, makki: true },
  { number: 18, name: 'Al-Kahf', arabic: 'الكهف', urduName: 'الکہف', meaning: 'The Cave', meaningUrdu: 'غار', verses: 110, juz: 15, makki: true },
  { number: 19, name: 'Maryam', arabic: 'مريم', urduName: 'مریم', meaning: 'Mary', meaningUrdu: 'مریم علیہا السلام', verses: 98, juz: 16, makki: true },
  { number: 20, name: 'Ta-Ha', arabic: 'طه', urduName: 'طٰہٰ', meaning: 'Ta-Ha', meaningUrdu: 'طٰہٰ', verses: 135, juz: 16, makki: true },
  { number: 21, name: 'Al-Anbiya', arabic: 'الأنبياء', urduName: 'الأنبیاء', meaning: 'The Prophets', meaningUrdu: 'انبیاء', verses: 112, juz: 17, makki: true },
  { number: 22, name: 'Al-Hajj', arabic: 'الحج', urduName: 'الحج', meaning: 'The Pilgrimage', meaningUrdu: 'حج', verses: 78, juz: 17, makki: false },
  { number: 23, name: 'Al-Muminun', arabic: 'المؤمنون', urduName: 'المؤمنون', meaning: 'The Believers', meaningUrdu: 'مومن', verses: 118, juz: 18, makki: true },
  { number: 24, name: 'An-Nur', arabic: 'النور', urduName: 'النور', meaning: 'The Light', meaningUrdu: 'نور', verses: 64, juz: 18, makki: false },
  { number: 25, name: 'Al-Furqan', arabic: 'الفرقان', urduName: 'الفرقان', meaning: 'The Criterion', meaningUrdu: 'فرقان', verses: 77, juz: 18, makki: true },
  { number: 26, name: 'Ash-Shuara', arabic: 'الشعراء', urduName: 'الشعراء', meaning: 'The Poets', meaningUrdu: 'شاعر', verses: 227, juz: 19, makki: true },
  { number: 27, name: 'An-Naml', arabic: 'النمل', urduName: 'النمل', meaning: 'The Ant', meaningUrdu: 'چیونٹی', verses: 93, juz: 19, makki: true },
  { number: 28, name: 'Al-Qasas', arabic: 'القصص', urduName: 'القصص', meaning: 'The Stories', meaningUrdu: 'قصص', verses: 88, juz: 20, makki: true },
  { number: 29, name: 'Al-Ankabut', arabic: 'العنكبوت', urduName: 'العنکبوت', meaning: 'The Spider', meaningUrdu: 'مکڑی', verses: 69, juz: 20, makki: true },
  { number: 30, name: 'Ar-Rum', arabic: 'الروم', urduName: 'الروم', meaning: 'The Romans', meaningUrdu: 'رومی', verses: 60, juz: 21, makki: true },
  { number: 31, name: 'Luqman', arabic: 'لقمان', urduName: 'لقمان', meaning: 'Luqman', meaningUrdu: 'لقمان علیہ السلام', verses: 34, juz: 21, makki: true },
  { number: 32, name: 'As-Sajdah', arabic: 'السجدة', urduName: 'السجدہ', meaning: 'The Prostration', meaningUrdu: 'سجدہ', verses: 30, juz: 21, makki: true },
  { number: 33, name: 'Al-Ahzab', arabic: 'الأحزاب', urduName: 'الأحزاب', meaning: 'The Combined Forces', meaningUrdu: 'اتحادی لشکر', verses: 73, juz: 21, makki: false },
  { number: 34, name: 'Saba', arabic: 'سبأ', urduName: 'سبأ', meaning: 'Sheba', meaningUrdu: 'سبا', verses: 54, juz: 22, makki: true },
  { number: 35, name: 'Fatir', arabic: 'فاطر', urduName: 'فاطر', meaning: 'Originator', meaningUrdu: 'خالق', verses: 45, juz: 22, makki: true },
  { number: 36, name: 'Ya-Sin', arabic: 'يس', urduName: 'یٰسٓ', meaning: 'Ya-Sin', meaningUrdu: 'یٰسٓ', verses: 83, juz: 22, makki: true },
  { number: 37, name: 'As-Saffat', arabic: 'الصافات', urduName: 'الصافات', meaning: 'Those Ranged in Ranks', meaningUrdu: 'صف باندھنے والے', verses: 182, juz: 23, makki: true },
  { number: 38, name: 'Sad', arabic: 'ص', urduName: 'صٓ', meaning: 'Sad', meaningUrdu: 'صٓ', verses: 88, juz: 23, makki: true },
  { number: 39, name: 'Az-Zumar', arabic: 'الزمر', urduName: 'الزمر', meaning: 'The Groups', meaningUrdu: 'گروہ', verses: 75, juz: 23, makki: true },
  { number: 40, name: 'Ghafir', arabic: 'غافر', urduName: 'غافر', meaning: 'The Forgiver', meaningUrdu: 'بخش دینے والا', verses: 85, juz: 24, makki: true },
  { number: 41, name: 'Fussilat', arabic: 'فصلت', urduName: 'فصلت', meaning: 'Explained in Detail', meaningUrdu: 'کھول کر بیان کیا', verses: 54, juz: 24, makki: true },
  { number: 42, name: 'Ash-Shura', arabic: 'الشورى', urduName: 'الشوریٰ', meaning: 'The Consultation', meaningUrdu: 'مشورہ', verses: 53, juz: 25, makki: true },
  { number: 43, name: 'Az-Zukhruf', arabic: 'الزخرف', urduName: 'الزخرف', meaning: 'The Gold Adornments', meaningUrdu: 'سونے کے زیورات', verses: 89, juz: 25, makki: true },
  { number: 44, name: 'Ad-Dukhan', arabic: 'الدخان', urduName: 'الدخان', meaning: 'The Smoke', meaningUrdu: 'دھواں', verses: 59, juz: 25, makki: true },
  { number: 45, name: 'Al-Jathiyah', arabic: 'الجاثية', urduName: 'الجاثیہ', meaning: 'The Crouching', meaningUrdu: 'گھٹنوں کے بل', verses: 37, juz: 25, makki: true },
  { number: 46, name: 'Al-Ahqaf', arabic: 'الأحقاف', urduName: 'الأحقاف', meaning: 'The Wind-Curved Sandhills', meaningUrdu: 'ریگستانی ٹیلے', verses: 35, juz: 26, makki: true },
  { number: 47, name: 'Muhammad', arabic: 'محمد', urduName: 'محمد', meaning: 'Muhammad', meaningUrdu: 'محمد ﷺ', verses: 38, juz: 26, makki: false },
  { number: 48, name: 'Al-Fath', arabic: 'الفتح', urduName: 'الفتح', meaning: 'The Victory', meaningUrdu: 'فتح', verses: 29, juz: 26, makki: false },
  { number: 49, name: 'Al-Hujurat', arabic: 'الحجرات', urduName: 'الحجرات', meaning: 'The Rooms', meaningUrdu: 'کمرے', verses: 18, juz: 26, makki: false },
  { number: 50, name: 'Qaf', arabic: 'ق', urduName: 'قٓ', meaning: 'Qaf', meaningUrdu: 'قٓ', verses: 45, juz: 26, makki: true },
  { number: 51, name: 'Adh-Dhariyat', arabic: 'الذاريات', urduName: 'الذاریات', meaning: 'The Winnowing Winds', meaningUrdu: 'اڑانے والی ہوائیں', verses: 60, juz: 26, makki: true },
  { number: 52, name: 'At-Tur', arabic: 'الطور', urduName: 'الطور', meaning: 'The Mount', meaningUrdu: 'طور پہاڑ', verses: 49, juz: 27, makki: true },
  { number: 53, name: 'An-Najm', arabic: 'النجم', urduName: 'النجم', meaning: 'The Star', meaningUrdu: 'ستارہ', verses: 62, juz: 27, makki: true },
  { number: 54, name: 'Al-Qamar', arabic: 'القمر', urduName: 'القمر', meaning: 'The Moon', meaningUrdu: 'چاند', verses: 55, juz: 27, makki: true },
  { number: 55, name: 'Ar-Rahman', arabic: 'الرحمن', urduName: 'الرحمن', meaning: 'The Most Gracious', meaningUrdu: 'نہایت رحم والا', verses: 78, juz: 27, makki: false },
  { number: 56, name: 'Al-Waqiah', arabic: 'الواقعة', urduName: 'الواقعہ', meaning: 'The Inevitable', meaningUrdu: 'ہونے والی', verses: 96, juz: 27, makki: true },
  { number: 57, name: 'Al-Hadid', arabic: 'الحديد', urduName: 'الحدید', meaning: 'The Iron', meaningUrdu: 'لوہا', verses: 29, juz: 27, makki: false },
  { number: 58, name: 'Al-Mujadila', arabic: 'المجادلة', urduName: 'المجادلہ', meaning: 'The Pleading Woman', meaningUrdu: 'جھگڑنے والی عورت', verses: 22, juz: 28, makki: false },
  { number: 59, name: 'Al-Hashr', arabic: 'الحشر', urduName: 'الحشر', meaning: 'The Exile', meaningUrdu: 'جلا وطن', verses: 24, juz: 28, makki: false },
  { number: 60, name: 'Al-Mumtahanah', arabic: 'الممتحنة', urduName: 'الممتحنہ', meaning: 'She that is to be examined', meaningUrdu: 'آزمائش کرنے والی', verses: 13, juz: 28, makki: false },
  { number: 61, name: 'As-Saf', arabic: 'الصف', urduName: 'الصف', meaning: 'The Ranks', meaningUrdu: 'صف', verses: 14, juz: 28, makki: false },
  { number: 62, name: 'Al-Jumuah', arabic: 'الجمعة', urduName: 'الجمعہ', meaning: 'The Congregation', meaningUrdu: 'جمعہ', verses: 11, juz: 28, makki: false },
  { number: 63, name: 'Al-Munafiqun', arabic: 'المنافقون', urduName: 'المنافقون', meaning: 'The Hypocrites', meaningUrdu: 'منافق', verses: 11, juz: 28, makki: false },
  { number: 64, name: 'At-Taghabun', arabic: 'التغابن', urduName: 'التغابن', meaning: 'The Mutual Disillusion', meaningUrdu: 'دھوکا دینے والا', verses: 18, juz: 28, makki: false },
  { number: 65, name: 'At-Talaq', arabic: 'الطلاق', urduName: 'الطلاق', meaning: 'The Divorce', meaningUrdu: 'طلاق', verses: 12, juz: 28, makki: false },
  { number: 66, name: 'At-Tahrim', arabic: 'التحريم', urduName: 'التحریم', meaning: 'The Prohibition', meaningUrdu: 'حرام', verses: 12, juz: 28, makki: false },
  { number: 67, name: 'Al-Mulk', arabic: 'الملك', urduName: 'الملک', meaning: 'The Sovereignty', meaningUrdu: 'بادشاہت', verses: 30, juz: 29, makki: true },
  { number: 68, name: 'Al-Qalam', arabic: 'القلم', urduName: 'القلم', meaning: 'The Pen', meaningUrdu: 'قلم', verses: 52, juz: 29, makki: true },
  { number: 69, name: 'Al-Haqqah', arabic: 'الحاقة', urduName: 'الحاقہ', meaning: 'The Reality', meaningUrdu: 'مستقل', verses: 52, juz: 29, makki: true },
  { number: 70, name: 'Al-Maarij', arabic: 'المعارج', urduName: 'المعارج', meaning: 'The Ascending Stairways', meaningUrdu: 'چڑھنے کے سیڑھ', verses: 44, juz: 29, makki: true },
  { number: 71, name: 'Nuh', arabic: 'نوح', urduName: 'نوح', meaning: 'Noah', meaningUrdu: 'نوح علیہ السلام', verses: 28, juz: 29, makki: true },
  { number: 72, name: 'Al-Jinn', arabic: 'الجن', urduName: 'الجن', meaning: 'The Jinn', meaningUrdu: 'جن', verses: 28, juz: 29, makki: true },
  { number: 73, name: 'Al-Muzzammil', arabic: 'المزمل', urduName: 'المزمل', meaning: 'The Enshrouded One', meaningUrdu: 'کملی اوڑھے ہوئے', verses: 20, juz: 29, makki: true },
  { number: 74, name: 'Al-Muddaththir', arabic: 'المدثر', urduName: 'المدثر', meaning: 'The Cloaked One', meaningUrdu: 'چادر اوڑھے ہوئے', verses: 56, juz: 29, makki: true },
  { number: 75, name: 'Al-Qiyamah', arabic: 'القيامة', urduName: 'القیامہ', meaning: 'The Resurrection', meaningUrdu: 'قیامت', verses: 40, juz: 29, makki: true },
  { number: 76, name: 'Al-Insan', arabic: 'الإنسان', urduName: 'الانسان', meaning: 'The Human', meaningUrdu: 'انسان', verses: 31, juz: 29, makki: false },
  { number: 77, name: 'Al-Mursalat', arabic: 'المرسلات', urduName: 'المرسلات', meaning: 'The Emissaries', meaningUrdu: 'بھیجی ہوئی ہوائیں', verses: 50, juz: 29, makki: true },
  { number: 78, name: 'An-Naba', arabic: 'النبأ', urduName: 'النبأ', meaning: 'The Tidings', meaningUrdu: 'خبر', verses: 40, juz: 30, makki: true },
  { number: 79, name: 'An-Naziat', arabic: 'النازعات', urduName: 'النازعات', meaning: 'Those who drag forth', meaningUrdu: 'نکالنے والے', verses: 46, juz: 30, makki: true },
  { number: 80, name: 'Abasa', arabic: 'عبس', urduName: 'عبس', meaning: 'He Frowned', meaningUrdu: 'ترش رو', verses: 42, juz: 30, makki: true },
  { number: 81, name: 'At-Takwir', arabic: 'التكوير', urduName: 'التکویر', meaning: 'The Overthrowing', meaningUrdu: 'لپیٹنا', verses: 29, juz: 30, makki: true },
  { number: 82, name: 'Al-Infitar', arabic: 'الانفطار', urduName: 'الانفطار', meaning: 'The Cleaving', meaningUrdu: 'بکھر جانا', verses: 19, juz: 30, makki: true },
  { number: 83, name: 'Al-Mutaffifin', arabic: 'المطففين', urduName: 'المطففین', meaning: 'The Defrauding', meaningUrdu: 'ناپ تول میں کمی کرنے والے', verses: 36, juz: 30, makki: true },
  { number: 84, name: 'Al-Inshiqaq', arabic: 'الانشقاق', urduName: 'الانشقاق', meaning: 'The Sundering', meaningUrdu: 'پھٹ جانا', verses: 25, juz: 30, makki: true },
  { number: 85, name: 'Al-Buruj', arabic: 'البروج', urduName: 'البروج', meaning: 'The Mansions of the Stars', meaningUrdu: 'ستاروں کے برج', verses: 22, juz: 30, makki: true },
  { number: 86, name: 'At-Tariq', arabic: 'الطارق', urduName: 'الطارق', meaning: 'The Morning Star', meaningUrdu: 'رات کا آنے والا', verses: 17, juz: 30, makki: true },
  { number: 87, name: 'Al-Ala', arabic: 'الأعلى', urduName: 'الأعلیٰ', meaning: 'The Most High', meaningUrdu: 'بہت اعلیٰ', verses: 19, juz: 30, makki: true },
  { number: 88, name: 'Al-Ghashiyah', arabic: 'الغاشية', urduName: 'الغاشیہ', meaning: 'The Overwhelming', meaningUrdu: 'چھا جانے والی', verses: 26, juz: 30, makki: true },
  { number: 89, name: 'Al-Fajr', arabic: 'الفجر', urduName: 'الفجر', meaning: 'The Dawn', meaningUrdu: 'صبح', verses: 30, juz: 30, makki: true },
  { number: 90, name: 'Al-Balad', arabic: 'البلد', urduName: 'البلد', meaning: 'The City', meaningUrdu: 'شہر', verses: 20, juz: 30, makki: true },
  { number: 91, name: 'Ash-Shams', arabic: 'الشمس', urduName: 'الشمس', meaning: 'The Sun', meaningUrdu: 'سورج', verses: 15, juz: 30, makki: true },
  { number: 92, name: 'Al-Layl', arabic: 'الليل', urduName: 'اللیل', meaning: 'The Night', meaningUrdu: 'رات', verses: 21, juz: 30, makki: true },
  { number: 93, name: 'Ad-Duha', arabic: 'الضحى', urduName: 'الضحیٰ', meaning: 'The Morning Hours', meaningUrdu: 'چاشت کا وقت', verses: 11, juz: 30, makki: true },
  { number: 94, name: 'Ash-Sharh', arabic: 'الشرح', urduName: 'الشرح', meaning: 'The Relief', meaningUrdu: 'کھول دینا', verses: 8, juz: 30, makki: true },
  { number: 95, name: 'At-Tin', arabic: 'التين', urduName: 'التین', meaning: 'The Fig', meaningUrdu: 'انجیر', verses: 8, juz: 30, makki: true },
  { number: 96, name: 'Al-Alaq', arabic: 'العلق', urduName: 'العلق', meaning: 'The Clot', meaningUrdu: 'جما ہوا خون', verses: 19, juz: 30, makki: true },
  { number: 97, name: 'Al-Qadr', arabic: 'القدر', urduName: 'القدر', meaning: 'The Power', meaningUrdu: 'قدر و منزلت', verses: 5, juz: 30, makki: true },
  { number: 98, name: 'Al-Bayyinah', arabic: 'البينة', urduName: 'البینہ', meaning: 'The Clear Proof', meaningUrdu: 'واضح دلیل', verses: 8, juz: 30, makki: false },
  { number: 99, name: 'Az-Zalzalah', arabic: 'الزلزلة', urduName: 'الزلزلہ', meaning: 'The Earthquake', meaningUrdu: 'زلزلہ', verses: 8, juz: 30, makki: false },
  { number: 100, name: 'Al-Adiyat', arabic: 'العاديات', urduName: 'العادیات', meaning: 'The Courser', meaningUrdu: 'دور دوڑنے والے', verses: 11, juz: 30, makki: true },
  { number: 101, name: 'Al-Qariah', arabic: 'القارعة', urduName: 'القارعہ', meaning: 'The Calamity', meaningUrdu: 'کھڑکھڑانے والی', verses: 11, juz: 30, makki: true },
  { number: 102, name: 'At-Takathur', arabic: 'التكاثر', urduName: 'التکاثر', meaning: 'The Rivalry in World Increase', meaningUrdu: 'زیادہ کرنے کا مقابلہ', verses: 8, juz: 30, makki: true },
  { number: 103, name: 'Al-Asr', arabic: 'العصر', urduName: 'العصر', meaning: 'The Declining Day', meaningUrdu: 'عصر کا وقت', verses: 3, juz: 30, makki: true },
  { number: 104, name: 'Al-Humazah', arabic: 'الهمزة', urduName: 'الھمزہ', meaning: 'The Traducer', meaningUrdu: 'عیب جو', verses: 9, juz: 30, makki: true },
  { number: 105, name: 'Al-Fil', arabic: 'الفيل', urduName: 'الفیل', meaning: 'The Elephant', meaningUrdu: 'ہاتھی', verses: 5, juz: 30, makki: true },
  { number: 106, name: 'Quraysh', arabic: 'قريش', urduName: 'قریش', meaning: 'Quraysh', meaningUrdu: 'قریش', verses: 4, juz: 30, makki: true },
  { number: 107, name: 'Al-Maun', arabic: 'الماعون', urduName: 'الماعون', meaning: 'The Small Kindnesses', meaningUrdu: 'برتن', verses: 7, juz: 30, makki: true },
  { number: 108, name: 'Al-Kawthar', arabic: 'الكوثر', urduName: 'الکوثر', meaning: 'Abundance', meaningUrdu: 'کثرت', verses: 3, juz: 30, makki: true },
  { number: 109, name: 'Al-Kafirun', arabic: 'الكافرون', urduName: 'الکافرون', meaning: 'The Disbelievers', meaningUrdu: 'کافر', verses: 6, juz: 30, makki: true },
  { number: 110, name: 'An-Nasr', arabic: 'النصر', urduName: 'النصر', meaning: 'The Divine Support', meaningUrdu: 'مدد', verses: 3, juz: 30, makki: false },
  { number: 111, name: 'Al-Masad', arabic: 'المسد', urduName: 'المسد', meaning: 'The Palm Fibre', meaningUrdu: 'کھجور کی رسی', verses: 5, juz: 30, makki: true },
  { number: 112, name: 'Al-Ikhlas', arabic: 'الإخلاص', urduName: 'الإخلاص', meaning: 'Sincerity', meaningUrdu: 'اخلاص', verses: 4, juz: 30, makki: true },
  { number: 113, name: 'Al-Falaq', arabic: 'الفلق', urduName: 'الفلق', meaning: 'The Daybreak', meaningUrdu: 'صبح', verses: 5, juz: 30, makki: true },
  { number: 114, name: 'An-Nas', arabic: 'الناس', urduName: 'الناس', meaning: 'Mankind', meaningUrdu: 'لوگ', verses: 6, juz: 30, makki: true },
];

const FONT_SIZES = [
  { label: 'S', arabicSize: '28px', transSize: '14px' },
  { label: 'M', arabicSize: '34px', transSize: '15px' },
  { label: 'L', arabicSize: '40px', transSize: '16px' },
  { label: 'XL', arabicSize: '48px', transSize: '18px' },
];

const COLORS = {
  greenDark: '#0a3d2e',
  greenMid: '#0d5c36',
  greenLight: '#1a7a4a',
  gold: '#c8a96e',
  cream: '#f0efe0',
  white: '#fffef5',
};

// Indo-Pak specific Bismillah text (South Asian script style)
const BISMILLAH_INDOPAK = "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ";

const toArabicNum = (n: number): string =>
  n.toString().split('').map(d => String.fromCharCode(0x0660 + parseInt(d))).join('');

/**
 * STRIP BISMILLAH FUNCTION
 * Strips the embedded Bismillah from the beginning of the text.
 * This is crucial for Indo-Pak scripts where Bismillah is often 
 * baked into the first verse of every surah.
 */
function stripBismillah(text: string): string {
  if (!text) return "";
  let t = text.trim();
  
  // Broad regex to catch various Bismillah forms including Indo-Pak style
  // Matches "Bismillah... Ar-Rahim" plus any trailing markers or spaces
  const bismillahRegex = /^[\ufeff\s]*بِسْمِ\s+[\u0600-\u06FF\u064B-\u065F\s]+?الرَّحِيْمِ[\s\u06DD]*/u;
  const bismillahRegexAlt = /^[\ufeff\s]*بِسۡمِ\s+[\u0600-\u06FF\u064B-\u065F\s]+?الرَّحِیۡمِ[\s\u06DD]*/u;
  
  let stripped = t.replace(bismillahRegex, '').replace(bismillahRegexAlt, '').trim();
  
  // If stripping left nothing (like in Al-Fatihah V1), we keep it empty 
  // because the Bismillah is already shown at the top.
  return stripped;
}

export default function QuranReader() {
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'mushaf' | 'verse'>('mushaf');
  const [fontSize, setFontSize] = useState(1);
  const [showTranslation, setShowTranslation] = useState(true);
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    try {
      const s = localStorage.getItem('quran_bookmarks');
      if (s) setBookmarks(JSON.parse(s));
    } catch {}
    
    // Default to first Surah if none selected
    if (!selectedSurah) loadSurah(SURAHS[0]);
  }, []);

  useEffect(() => {
    localStorage.setItem('quran_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const loadSurah = useCallback(async (surah: Surah) => {
    setSelectedSurah(surah);
    setVerses([]);
    setLoading(true);
    setError('');
    
    try {
      // API CONFIGURATION:
      // We use 'quran-simple-enhanced' or 'quran-simple' as a base.
      // For true Indo-Pak font rendering, we apply CSS fonts.
      const translationEdition = lang === 'en' ? 'en.asad' : 'ur.jalandhry';

      const [arabicRes, transRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/quran-simple-enhanced`),
        fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/${translationEdition}`),
      ]);

      const arabicData = await arabicRes.json();
      const transData = await transRes.json();

      if (arabicData.code === 200 && transData.code === 200) {
        const versesData: Verse[] = arabicData.data.ayahs.map((ayah: any, idx: number) => {
          // KEY FIX: Only strip Bismillah from Surah 1-114 EXCEPT Surah 9 (At-Tawbah)
          // Also strip it only from the FIRST verse.
          let arabicText = ayah.text;
          if (surah.number !== 9 && ayah.numberInSurah === 1) {
            arabicText = stripBismillah(ayah.text);
          }

          return {
            number: ayah.numberInSurah,
            arabic: arabicText,
            translation: transData.data?.ayahs?.[idx]?.text || '',
          };
        });

        // Special handling for Al-Fatihah: 
        // In some editions, V1 is just Bismillah. If we stripped it and it's empty, 
        // we should ensure the surah doesn't look broken.
        // However, in Indo-Pak scripts, Al-Hamdu... usually starts after Bismillah in V1.
        setVerses(versesData.filter(v => v.arabic.trim().length > 0 || v.number > 1));
      } else {
        setError('Unable to load surah. Please check your connection.');
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  const filteredSurahs = SURAHS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.number.toString() === search.trim() ||
    s.urduName.includes(search)
  );

  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      backgroundColor: '#051612', 
      color: '#fff', 
      minHeight: '100vh',
      padding: '20px' 
    }}>
      {/* INJECT INDO-PAK FONTS */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Amiri&display=swap');

        .indopak-font {
          font-family: "Noto Nastaliq Urdu", serif;
          direction: rtl;
        }
        .urdu-font {
          font-family: "Noto Nastaliq Urdu", serif;
        }
        .translation-text {
          font-family: 'Amiri', serif;
        }
      `}</style>

      {/* HEADER / NAVIGATION */}
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: COLORS.gold, margin: 0 }}>Quran Majeed</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
             <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value as 'en' | 'ur')}
              style={{ background: '#1a2e29', color: '#fff', border: `1px solid ${COLORS.gold}`, borderRadius: '5px', padding: '5px' }}
            >
              <option value="en">English</option>
              <option value="ur">اردو</option>
            </select>
            <select 
              value={fontSize} 
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              style={{ background: '#1a2e29', color: '#fff', border: `1px solid ${COLORS.gold}`, borderRadius: '5px', padding: '5px' }}
            >
              {FONT_SIZES.map((f, i) => <option key={i} value={i}>Size {f.label}</option>)}
            </select>
          </div>
        </div>

        {/* SEARCH & SURAH LIST */}
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Search Surah (e.g. 67 or Al-Mulk)" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#1a2e29', color: '#fff', marginBottom: '10px' }}
          />
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
            {filteredSurahs.slice(0, 10).map(s => (
              <button 
                key={s.number}
                onClick={() => loadSurah(s)}
                style={{ 
                  whiteSpace: 'nowrap', 
                  padding: '8px 15px', 
                  borderRadius: '20px', 
                  border: 'none', 
                  background: selectedSurah?.number === s.number ? COLORS.gold : '#1a2e29',
                  color: selectedSurah?.number === s.number ? '#000' : '#fff',
                  cursor: 'pointer'
                }}
              >
                {s.number}. {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* READER AREA */}
        {selectedSurah && (
          <div style={{ background: '#0a1f1a', borderRadius: '15px', padding: '30px', border: `1px solid ${COLORS.gold}33`, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            
            {/* SURAH HEADER */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 className="indopak-font" style={{ fontSize: '48px', color: COLORS.gold, margin: '0 0 10px 0' }}>{selectedSurah.arabic}</h2>
              <p style={{ margin: 0, color: '#aaa' }}>{selectedSurah.name} • {selectedSurah.meaning}</p>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                {selectedSurah.verses} Verses • {selectedSurah.makki ? 'Meccan' : 'Medinan'} • Juz {selectedSurah.juz}
              </p>
            </div>

            {/* SINGLE BISMILLAH DISPLAY */}
            {/* Logic: Show for all Surahs except At-Tawbah (9) */}
            {selectedSurah.number !== 9 && (
              <div style={{ textAlign: 'center', marginBottom: '40px', padding: '20px', borderBottom: '1px solid #1a2e29' }}>
                <p className="indopak-font" style={{ fontSize: '36px', margin: 0, color: '#fff' }}>
                  {BISMILLAH_INDOPAK}
                </p>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>Loading verses...</div>
            ) : error ? (
              <div style={{ textAlign: 'center', color: '#ff6b6b', padding: '50px' }}>{error}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                
                {/* MODE TOGGLE */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                  <button onClick={() => setMode('mushaf')} style={{ padding: '5px 15px', borderRadius: '15px', border: 'none', background: mode === 'mushaf' ? COLORS.greenMid : '#1a2e29', color: '#fff' }}>Mushaf</button>
                  <button onClick={() => setMode('verse')} style={{ padding: '5px 15px', borderRadius: '15px', border: 'none', background: mode === 'verse' ? COLORS.greenMid : '#1a2e29', color: '#fff' }}>Verse</button>
                </div>

                {/* MUSHAF MODE */}
                {mode === 'mushaf' && (
                  <div className="indopak-font" style={{ 
                    fontSize: FONT_SIZES[fontSize].arabicSize, 
                    lineHeight: '2.5', 
                    textAlign: 'justify', 
                    direction: 'rtl',
                    wordSpacing: '5px'
                  }}>
                    {verses.map(v => (
                      <span key={v.number}>
                        {v.arabic}
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: '1.5em', 
                          height: '1.5em', 
                          border: `1px solid ${COLORS.gold}`, 
                          borderRadius: '50%', 
                          fontSize: '0.5em', 
                          margin: '0 10px', 
                          color: COLORS.gold,
                          fontFamily: 'Amiri, serif'
                        }}>
                          {toArabicNum(v.number)}
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                {/* VERSE MODE */}
                {mode === 'verse' && verses.map(v => (
                  <div key={v.number} style={{ borderBottom: '1px solid #1a2e29', paddingBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <span style={{ color: COLORS.gold, fontWeight: 'bold' }}>{selectedSurah.number}:{v.number}</span>
                    </div>
                    <p className="indopak-font" style={{ 
                      fontSize: FONT_SIZES[fontSize].arabicSize, 
                      lineHeight: '2', 
                      textAlign: 'right', 
                      margin: '0 0 15px 0' 
                    }}>
                      {v.arabic}
                    </p>
                    {showTranslation && (
                      <p className={lang === 'ur' ? 'urdu-font' : 'translation-text'} style={{ 
                        fontSize: FONT_SIZES[fontSize].transSize, 
                        color: '#ccc', 
                        margin: 0,
                        textAlign: lang === 'ur' ? 'right' : 'left',
                        direction: lang === 'ur' ? 'rtl' : 'ltr'
                      }}>
                        {v.translation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* FOOTER NAVIGATION */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', paddingTop: '20px', borderTop: `1px solid ${COLORS.gold}33` }}>
              <button 
                disabled={selectedSurah.number === 1}
                onClick={() => loadSurah(SURAHS[selectedSurah.number - 2])}
                style={{ background: 'transparent', color: COLORS.gold, border: `1px solid ${COLORS.gold}`, padding: '8px 20px', borderRadius: '5px', cursor: selectedSurah.number === 1 ? 'default' : 'pointer', opacity: selectedSurah.number === 1 ? 0.3 : 1 }}
              >
                Previous
              </button>
              <button 
                disabled={selectedSurah.number === 114}
                onClick={() => loadSurah(SURAHS[selectedSurah.number])}
                style={{ background: COLORS.gold, color: '#000', border: 'none', padding: '8px 20px', borderRadius: '5px', cursor: selectedSurah.number === 114 ? 'default' : 'pointer', opacity: selectedSurah.number === 114 ? 0.3 : 1 }}
              >
                Next Surah
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
