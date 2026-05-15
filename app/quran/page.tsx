'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  audio?: string;
}

interface Bookmark {
  surahNumber: number;
  surahName: string;
  verseNumber: number;
  timestamp: number;
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
  { label: 'S', arabicSize: '22px', transSize: '14px' },
  { label: 'M', arabicSize: '26px', transSize: '15px' },
  { label: 'L', arabicSize: '30px', transSize: '16px' },
  { label: 'XL', arabicSize: '34px', transSize: '17px' },
];

const toArabicNum = (n: number): string =>
  n.toString().split('').map(d => String.fromCharCode(0x0660 + parseInt(d))).join('');

const BISMILLAH_FRAGMENTS = [
  'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
  'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ',
  'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ',
  'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ',
  'بسم الله الرحمن الرحيم',
];

function stripBismillah(text: string): string {
  let t = text.trim();
  for (const b of BISMILLAH_FRAGMENTS) {
    if (t.startsWith(b)) {
      t = t.slice(b.length).trim();
      return t;
    }
  }
  const patterns = [
    /^[\s\u06DD\u06D6]*بِسْمِ\s*اللَّهِ\s*الرَّحْمَٰنِ\s*الرَّحِيمِ[\s\u06DD\u06D6]*/u,
    /^[\s\u06DD\u06D6]*بسم الله الرحمن الرحيم[\s\u06DD\u06D6]*/u,
    /^[\s\u06DD\u06D6]*بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ[\s\u06DD\u06D6]*/u,
  ];
  for (const pattern of patterns) {
    t = t.replace(pattern, '').trim();
  }
  t = t.replace(/^[\s\u06DD\u06D6]+/, '').trim();
  return t;
}

const COLORS = {
  skyBlue: '#e3f2fd',
  skyBlueDark: '#0277bd',
  skyBlueMid: '#039be5',
  skyBlueLight: '#4fc3f7',
  gold: '#c8a96e',
  white: '#ffffff',
  // Mushaf page colors
  mushafPage: '#fdf8f0',
  mushafBorder: '#8B6914',
  mushafText: '#1a0a00',
  mushafGold: '#B8860B',
  mushafLight: '#f5ede0',
};

// ─── Indo-Pak Mushaf Page Component ───────────────────────────────────────────
function MushafPage({
  surah,
  verses,
  fontSize,
  playingAudio,
  dark,
  onPlayAudio,
  onToggleContinuous,
  onStopAudio,
  isPaused,
  continuousAudio,
  showTranslation,
  lang,
  onToggleBookmark,
  isBookmarked,
}: {
  surah: Surah;
  verses: Verse[];
  fontSize: number;
  playingAudio: number | null;
  dark: boolean;
  onPlayAudio: (v: Verse, continuous: boolean) => void;
  onToggleContinuous: () => void;
  onStopAudio: () => void;
  isPaused: boolean;
  continuousAudio: boolean;
  showTranslation: boolean;
  lang: 'en' | 'ur';
  onToggleBookmark: (v: number) => void;
  isBookmarked: (v: number) => boolean;
}) {
  const pageBg = dark ? '#1a1000' : COLORS.mushafPage;
  const pageText = dark ? '#f0e6cc' : COLORS.mushafText;
  const borderColor = dark ? '#8B6914' : COLORS.mushafBorder;
  const goldColor = dark ? '#d4a843' : COLORS.mushafGold;
  const innerBg = dark ? '#120b00' : '#faf3e8';

  return (
    <div style={{
      background: pageBg,
      border: `3px solid ${borderColor}`,
      borderRadius: 4,
      padding: '0',
      boxShadow: dark
        ? '0 4px 30px rgba(0,0,0,0.7), inset 0 0 40px rgba(0,0,0,0.3)'
        : '0 4px 30px rgba(139,105,20,0.25), inset 0 0 40px rgba(139,105,20,0.05)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative double-border inner frame */}
      <div style={{
        margin: 6,
        border: `1px solid ${borderColor}`,
        borderRadius: 2,
        padding: '0',
      }}>
        {/* ── Ornate Header Banner ── */}
        <div style={{
          background: dark
            ? 'linear-gradient(180deg, #2a1800 0%, #1a1000 100%)'
            : 'linear-gradient(180deg, #fdf3d8 0%, #f5e8c0 100%)',
          borderBottom: `2px solid ${borderColor}`,
          padding: '8px 12px',
          position: 'relative',
        }}>
          {/* Top decorative strip */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}>
            {/* Left badge: Ayah count */}
            <div style={{
              border: `1.5px solid ${borderColor}`,
              borderRadius: 3,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: pageText,
              background: dark ? '#1a1000' : '#fff8e8',
              fontFamily: 'serif',
              direction: 'rtl',
            }}>
              آیاتہا {toArabicNum(surah.verses)}
            </div>

            {/* Center: Surah name box */}
            <div style={{
              border: `2px solid ${borderColor}`,
              borderRadius: 3,
              padding: '6px 24px',
              textAlign: 'center',
              position: 'relative',
              background: dark ? '#1a1000' : '#fff8e8',
            }}>
              {/* Corner ornaments */}
              <span style={{ position: 'absolute', top: -1, left: -1, fontSize: 10, color: goldColor }}>❖</span>
              <span style={{ position: 'absolute', top: -1, right: -1, fontSize: 10, color: goldColor }}>❖</span>
              <span style={{ position: 'absolute', bottom: -1, left: -1, fontSize: 10, color: goldColor }}>❖</span>
              <span style={{ position: 'absolute', bottom: -1, right: -1, fontSize: 10, color: goldColor }}>❖</span>

              <div style={{
                fontFamily: '"PDMS_Saleem_QuranFont", "Scheherazade New", "Noto Naskh Arabic", serif',
                fontSize: 17,
                fontWeight: 900,
                color: pageText,
                letterSpacing: 1,
                direction: 'rtl',
              }}>
                سُوْرَةُ {surah.arabic}
              </div>
              <div style={{ fontSize: 10, color: goldColor, marginTop: 2, fontFamily: 'serif' }}>
                {surah.makki ? 'مَكِّيَّة' : 'مَدَنِيَّة'} • {surah.name}
              </div>
            </div>

            {/* Right badge: Juz */}
            <div style={{
              border: `1.5px solid ${borderColor}`,
              borderRadius: 3,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: pageText,
              background: dark ? '#1a1000' : '#fff8e8',
              fontFamily: 'serif',
              direction: 'rtl',
            }}>
              جُزء {toArabicNum(surah.juz)}
            </div>
          </div>

          {/* Decorative divider line with diamond */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: borderColor }} />
            <span style={{ color: goldColor, fontSize: 12 }}>◆</span>
            <div style={{ flex: 1, height: 1, background: borderColor }} />
          </div>

          {/* Audio controls row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 4 }}>
            <button onClick={onToggleContinuous} style={{
              padding: '4px 14px', borderRadius: 20,
              background: goldColor, color: '#fff',
              border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11,
            }}>
              {playingAudio !== null && !isPaused ? '⏸ Pause' : '▶ Play'}
            </button>
            {playingAudio !== null && (
              <button onClick={onStopAudio} style={{
                padding: '4px 12px', borderRadius: 20,
                background: dark ? '#333' : '#e0d0b0', color: pageText,
                border: `1px solid ${borderColor}`, cursor: 'pointer', fontWeight: 700, fontSize: 11,
              }}>
                ⏹ Stop
              </button>
            )}
          </div>
        </div>

        {/* ── Bismillah ── */}
        {surah.number !== 9 && (
          <div style={{
            textAlign: 'center',
            padding: '14px 16px 6px',
            borderBottom: `1px solid ${borderColor}44`,
          }}>
            <span style={{
              fontFamily: '"PDMS_Saleem_QuranFont", "Scheherazade New", "Noto Naskh Arabic", "Arabic Typesetting", serif',
              fontSize: FONT_SIZES[fontSize].arabicSize,
              fontWeight: 900,
              color: pageText,
              lineHeight: 2.2,
              direction: 'rtl',
              letterSpacing: 0,
            }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </span>
          </div>
        )}

        {/* ── Mushaf Body ── */}
        <div style={{
          padding: '10px 16px 16px',
          background: innerBg,
          direction: 'rtl',
        }}>
          <p style={{
            fontFamily: '"PDMS_Saleem_QuranFont", "Scheherazade New", "Noto Naskh Arabic", "Arabic Typesetting", "Amiri Quran", serif',
            fontSize: FONT_SIZES[fontSize].arabicSize,
            color: pageText,
            textAlign: 'justify',
            textAlignLast: 'right',
            lineHeight: 2.6,
            margin: 0,
            wordSpacing: 4,
            letterSpacing: 0,
            fontWeight: 700,
          }}>
            {verses.map(v => (
              <span key={v.number} id={`verse-${v.number}`}
                style={{
                  background: playingAudio === v.number ? '#d4a84340' : 'transparent',
                  borderRadius: 4,
                  padding: playingAudio === v.number ? '2px 4px' : '0',
                  transition: 'background 0.3s ease',
                  cursor: 'pointer',
                }}
                onClick={() => onPlayAudio(v, false)}
              >
                {v.arabic}
                {/* Floral ayah marker with Arabic number */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '1.9em',
                  height: '1.9em',
                  position: 'relative',
                  margin: '0 6px',
                  verticalAlign: 'middle',
                  fontSize: '0.6em',
                  color: pageText,
                  fontWeight: 900,
                  fontFamily: '"Scheherazade New", serif',
                }}>
                  {/* SVG rosette marker */}
                  <svg
                    viewBox="0 0 40 40"
                    width="1.9em"
                    height="1.9em"
                    style={{ position: 'absolute', top: 0, left: 0 }}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="20" cy="20" r="18" fill="none" stroke={goldColor} strokeWidth="1.5" />
                    <circle cx="20" cy="20" r="13" fill="none" stroke={goldColor} strokeWidth="0.8" />
                    {/* 8 petal rosette */}
                    {[0,45,90,135,180,225,270,315].map((deg, i) => (
                      <ellipse
                        key={i}
                        cx={20 + 15 * Math.cos(deg * Math.PI / 180)}
                        cy={20 + 15 * Math.sin(deg * Math.PI / 180)}
                        rx="3" ry="2"
                        fill={goldColor}
                        transform={`rotate(${deg} 20 20)`}
                        opacity="0.6"
                      />
                    ))}
                    <circle cx="20" cy="20" r="11" fill={dark ? '#1a1000' : '#fff8e8'} />
                  </svg>
                  <span style={{ position: 'relative', zIndex: 1, fontSize: '1em', lineHeight: 1 }}>
                    {toArabicNum(v.number)}
                  </span>
                </span>
              </span>
            ))}
          </p>

          {/* Sadaqallah ul Azeem footer */}
          <div style={{
            textAlign: 'center',
            marginTop: 18,
            paddingTop: 10,
            borderTop: `1px solid ${borderColor}66`,
          }}>
            <span style={{
              fontFamily: '"Scheherazade New", "Noto Naskh Arabic", serif',
              fontSize: 18,
              color: goldColor,
              fontWeight: 700,
            }}>
              ۝ صَدَقَ اللَّهُ الْعَظِيمُ ۝
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Verse-by-Verse Component ─────────────────────────────────────────────────
function VerseView({
  surah,
  verses,
  fontSize,
  playingAudio,
  isPaused,
  dark,
  showTranslation,
  lang,
  onPlayAudio,
  onToggleBookmark,
  isBookmarked,
}: {
  surah: Surah;
  verses: Verse[];
  fontSize: number;
  playingAudio: number | null;
  isPaused: boolean;
  dark: boolean;
  showTranslation: boolean;
  lang: 'en' | 'ur';
  onPlayAudio: (v: Verse, continuous: boolean) => void;
  onToggleBookmark: (v: number) => void;
  isBookmarked: (v: number) => boolean;
}) {
  const pageBg = dark ? '#1a1000' : COLORS.mushafPage;
  const pageText = dark ? '#f0e6cc' : COLORS.mushafText;
  const borderColor = dark ? '#8B6914' : COLORS.mushafBorder;
  const goldColor = dark ? '#d4a843' : COLORS.mushafGold;
  const cardBg = dark ? '#120b00' : '#faf3e8';
  const cardActive = dark ? '#2a1800' : '#fef5dc';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {verses.map(v => (
        <div key={v.number} id={`verse-${v.number}`} style={{
          background: playingAudio === v.number ? cardActive : cardBg,
          borderRadius: 6,
          border: `1.5px solid ${playingAudio === v.number ? goldColor : borderColor + '55'}`,
          padding: '12px 14px',
          transition: 'all 0.3s ease',
          boxShadow: playingAudio === v.number ? `0 0 12px ${goldColor}44` : 'none',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            {/* Ayah number badge */}
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              border: `2px solid ${goldColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: dark ? '#2a1800' : '#fff8e8',
              fontFamily: '"Scheherazade New", serif',
              fontSize: 14, fontWeight: 900, color: pageText,
              direction: 'rtl',
            }}>
              {toArabicNum(v.number)}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => onPlayAudio(v, false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
              }}>
                {playingAudio === v.number && !isPaused ? '⏸️' : '▶️'}
              </button>
              <button onClick={() => onToggleBookmark(v.number)} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
                color: isBookmarked(v.number) ? goldColor : pageText,
              }}>
                {isBookmarked(v.number) ? '🔖' : '📑'}
              </button>
            </div>
          </div>

          <p dir="rtl" style={{
            fontFamily: '"PDMS_Saleem_QuranFont", "Scheherazade New", "Noto Naskh Arabic", "Arabic Typesetting", serif',
            fontSize: FONT_SIZES[fontSize].arabicSize,
            color: pageText,
            lineHeight: 2.5,
            textAlign: 'right',
            margin: 0,
            fontWeight: 700,
          }}>
            {v.arabic}
          </p>

          {showTranslation && v.translation && (
            <div style={{
              marginTop: 8, paddingTop: 8,
              borderTop: `1px solid ${borderColor}44`,
            }}>
              <p
                className={lang === 'ur' ? 'urdu-font' : ''}
                dir={lang === 'ur' ? 'rtl' : 'ltr'}
                style={{
                  color: dark ? '#c8b89a' : '#3a2800',
                  fontSize: FONT_SIZES[fontSize].transSize,
                  lineHeight: 1.9,
                  margin: 0,
                  fontStyle: lang === 'en' ? 'italic' : 'normal',
                }}
              >
                {v.translation}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QuranReader() {
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('mushaf');
  const [fontSize, setFontSize] = useState(1);
  const [showTranslation, setShowTranslation] = useState(true);
  const [lang, setLang] = useState<'en' | 'ur'>('ur');
  const [dark, setDark] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [lastRead, setLastRead] = useState<Bookmark | null>(null);
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [continuousAudio, setContinuousAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const b = localStorage.getItem('quran_bookmarks_v2');
      if (b) setBookmarks(JSON.parse(b));
      const lr = localStorage.getItem('quran_last_read');
      if (lr) setLastRead(JSON.parse(lr));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem('quran_bookmarks_v2', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    if (lastRead) localStorage.setItem('quran_last_read', JSON.stringify(lastRead));
  }, [lastRead]);

  const isBookmarked = useCallback((surahNumber: number, verseNumber: number): boolean => {
    return bookmarks.some(b => b.surahNumber === surahNumber && b.verseNumber === verseNumber);
  }, [bookmarks]);

  const toggleBookmark = useCallback((surah: Surah, verseNumber: number) => {
    const exists = bookmarks.some(b => b.surahNumber === surah.number && b.verseNumber === verseNumber);
    if (exists) {
      setBookmarks(prev => prev.filter(b => !(b.surahNumber === surah.number && b.verseNumber === verseNumber)));
    } else {
      setBookmarks(prev => [...prev, {
        surahNumber: surah.number,
        surahName: surah.name,
        verseNumber,
        timestamp: Date.now(),
      }]);
    }
  }, [bookmarks]);

  const loadSurah = useCallback(async (surah: Surah, targetVerse: number = 1) => {
    setSelectedSurah(surah);
    setVerses([]);
    setLoading(true);
    setError('');
    setPlayingAudio(null);
    setIsPaused(false);
    setContinuousAudio(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const arabicEdition = 'quran-indopak';
      const translationEdition = lang === 'en' ? 'en.asad' : 'ur.jalandhry';

      const [arabicRes, transRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/${arabicEdition}`),
        fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/${translationEdition}`),
      ]);

      const arabicData = await arabicRes.json();
      const transData = await transRes.json();

      if (arabicData.code === 200 && transData.code === 200) {
        const versesData: Verse[] = arabicData.data.ayahs.map((ayah: any, idx: number) => {
          let arabicText = ayah.text;
          if (surah.number !== 1 && surah.number !== 9 && ayah.numberInSurah === 1) {
            arabicText = stripBismillah(ayah.text);
          }
          return {
            number: ayah.numberInSurah,
            arabic: arabicText,
            translation: transData.data?.ayahs?.[idx]?.text || '',
            audio: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`
          };
        });
        setVerses(versesData);
        setLastRead({ surahNumber: surah.number, surahName: surah.name, verseNumber: targetVerse, timestamp: Date.now() });

        if (targetVerse > 1) {
          setTimeout(() => {
            const el = document.getElementById(`verse-${targetVerse}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 500);
        }
      } else {
        setError('Failed to load Surah content.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    if (selectedSurah) {
      loadSurah(selectedSurah, 1);
    }
  }, [lang]);

  const playAudio = (verse: Verse, continuous: boolean = false) => {
    setContinuousAudio(continuous);

    if (playingAudio === verse.number) {
      if (isPaused) {
        audioRef.current?.play();
        setIsPaused(false);
      } else {
        audioRef.current?.pause();
        setIsPaused(true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.src = verse.audio || '';
        audioRef.current.play();
        setPlayingAudio(verse.number);
        setIsPaused(false);

        if (mode === 'mushaf') {
          const el = document.getElementById(`verse-${verse.number}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  const toggleContinuous = () => {
    if (playingAudio !== null) {
      const currentVerse = verses[playingAudio - 1];
      playAudio(currentVerse, true);
    } else {
      if (verses.length > 0) playAudio(verses[0], true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingAudio(null);
    setIsPaused(false);
    setContinuousAudio(false);
  };

  const handleAudioEnd = () => {
    if (continuousAudio && playingAudio !== null && playingAudio < verses.length) {
      const nextVerse = verses[playingAudio];
      playAudio(nextVerse, true);
    } else {
      setPlayingAudio(null);
      setIsPaused(false);
      setContinuousAudio(false);
    }
  };

  const filtered = SURAHS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.arabic.includes(search) ||
    s.urduName.includes(search) ||
    s.meaning.toLowerCase().includes(search.toLowerCase()) ||
    s.number.toString() === search.trim()
  );

  // ── Theme colors (list page) ──
  const bgCol = dark ? '#011627' : COLORS.skyBlue;
  const cardBg = dark ? '#0b253a' : '#fff';
  const textCol = dark ? '#e0f2f1' : '#01579b';
  const borderCol = dark ? '#1e3a5f' : '#bbdefb';

  // ── Mushaf page theme ──
  const mushafBg = dark ? '#0d0800' : '#ede4cc';

  return (
    <div style={{
      minHeight: '100vh',
      background: selectedSurah ? mushafBg : bgCol,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: textCol,
      transition: 'background 0.3s ease',
    }}>
      <audio ref={audioRef} onEnded={handleAudioEnd} />

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=Amiri+Quran&family=Noto+Naskh+Arabic:wght@400;700&family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');

        /* Try to load PDMS Saleem font from a CDN if available */
        @font-face {
          font-family: 'PDMS_Saleem_QuranFont';
          src: url('https://fonts.gstatic.com/s/scheherazadenew/v21/4UaZrFhTvxVnHDvUkULCpKZnAhB5C_OwMU4=.woff2') format('woff2');
          font-weight: 700;
        }

        .mushaf-arabic {
          font-family: 'Scheherazade New', 'Noto Naskh Arabic', 'Amiri Quran', serif;
          font-weight: 700;
          direction: rtl;
          word-spacing: 4px;
          letter-spacing: 0;
        }
        .urdu-font {
          font-family: 'Noto Nastaliq Urdu', serif;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Mushaf page paper texture */
        .mushaf-page-wrap {
          animation: fadeIn 0.4s ease;
        }

        /* Responsive */
        @media (max-width: 600px) {
          .reader-controls-bar { flex-wrap: wrap; gap: 6px; }
          .font-btn-group { gap: 3px; }
        }
      `}} />

      {/* ═══════════════════════════════════════════════════════
          SURAH LIST PAGE
      ═══════════════════════════════════════════════════════ */}
      {!selectedSurah ? (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '12px 24px', background: COLORS.skyBlueDark, color: '#fff',
              border: 'none', borderRadius: 30, cursor: 'pointer', fontWeight: 700, marginBottom: 30,
            }}
          >
            ← Back to Main Menu
          </button>

          <header style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{ fontSize: 42, color: dark ? COLORS.skyBlueLight : COLORS.skyBlueDark, margin: '0 0 10px', fontWeight: 800 }}>
              Al-Quran Al-Kareem
            </h1>

            <div style={{ marginTop: 30, position: 'relative', maxWidth: 500, margin: '30px auto 0' }}>
              <input
                type="text"
                placeholder="Search Surah..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '16px 24px', borderRadius: 50,
                  border: `2px solid ${borderCol}`, fontSize: 16, outline: 'none',
                  background: cardBg, color: textCol,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 25, flexWrap: 'wrap' }}>
              {lastRead && (
                <button
                  onClick={() => loadSurah(SURAHS[lastRead.surahNumber - 1], lastRead.verseNumber)}
                  style={{
                    padding: '10px 18px', borderRadius: 30, background: COLORS.gold,
                    color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
                  }}
                >
                  📖 Last Read: {lastRead.surahName}
                </button>
              )}
              {bookmarks.length > 0 && (
                <button style={{
                  padding: '10px 18px', borderRadius: 30, background: COLORS.skyBlueDark,
                  color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
                }}>
                  🔖 Bookmarks ({bookmarks.length})
                </button>
              )}
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 15 }}>
            {filtered.map(s => (
              <div
                key={s.number}
                onClick={() => loadSurah(s)}
                style={{
                  background: cardBg, padding: 18, borderRadius: 16,
                  border: `1px solid ${borderCol}`, cursor: 'pointer',
                  transition: 'all 0.2s ease', display: 'flex', alignItems: 'center',
                  gap: 15, boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: COLORS.skyBlueDark,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 16, flexShrink: 0,
                }}>
                  {s.number}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{s.name}</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: dark ? '#81d4fa' : '#039be5' }}>{s.meaning}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{
                    fontFamily: '"Scheherazade New", "Noto Naskh Arabic", serif',
                    margin: 0, fontSize: 20, color: dark ? COLORS.skyBlueLight : COLORS.skyBlueDark,
                    fontWeight: 700,
                  }}>
                    {s.arabic}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      ) : (
        /* ═══════════════════════════════════════════════════════
            READER PAGE
        ═══════════════════════════════════════════════════════ */
        <div ref={topRef} style={{ maxWidth: 900, margin: '0 auto', padding: '10px 12px 30px' }}>

          {/* Sticky Controls Bar */}
          <div
            className="reader-controls-bar"
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 12,
              background: dark ? '#1a1200' : '#fdf8f0',
              padding: '8px 14px', borderRadius: 10,
              border: `1.5px solid ${dark ? '#8B6914' : COLORS.mushafBorder}`,
              position: 'sticky', top: 6, zIndex: 100,
              boxShadow: '0 4px 16px rgba(139,105,20,0.15)',
            }}
          >
            <button
              onClick={() => setSelectedSurah(null)}
              style={{
                background: 'none', border: 'none',
                color: dark ? '#d4a843' : COLORS.mushafBorder,
                cursor: 'pointer', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 14,
              }}
            >
              ← Back
            </button>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                style={{
                  padding: '5px 8px', borderRadius: 6,
                  border: `1px solid ${dark ? '#8B6914' : COLORS.mushafBorder}`,
                  background: dark ? '#2a1800' : '#fff8e8',
                  color: dark ? '#f0e6cc' : COLORS.mushafText,
                  fontWeight: 600, fontSize: 12,
                }}
              >
                <option value="mushaf">Mushaf</option>
                <option value="verse">Verse</option>
              </select>

              {/* Font Size Buttons */}
              <div className="font-btn-group" style={{ display: 'flex', gap: 3 }}>
                {FONT_SIZES.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => setFontSize(i)}
                    style={{
                      padding: '4px 9px', borderRadius: 5,
                      border: `1px solid ${fontSize === i ? COLORS.mushafGold : (dark ? '#8B6914' : COLORS.mushafBorder)}`,
                      background: fontSize === i ? COLORS.mushafGold : (dark ? '#2a1800' : '#fff8e8'),
                      color: fontSize === i ? '#fff' : (dark ? '#f0e6cc' : COLORS.mushafText),
                      fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {mode === 'verse' && (
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  style={{
                    padding: '4px 9px', borderRadius: 5,
                    border: `1px solid ${dark ? '#8B6914' : COLORS.mushafBorder}`,
                    background: showTranslation ? COLORS.mushafGold : (dark ? '#2a1800' : '#fff8e8'),
                    color: showTranslation ? '#fff' : (dark ? '#f0e6cc' : COLORS.mushafText),
                    fontWeight: 700, fontSize: 11, cursor: 'pointer',
                  }}
                >
                  {showTranslation ? 'Hide Trans.' : 'Show Trans.'}
                </button>
              )}

              <button
                onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
                style={{
                  padding: '4px 9px', borderRadius: 5,
                  border: 'none', background: COLORS.skyBlueDark,
                  color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 11,
                }}
              >
                {lang === 'en' ? 'اردو' : 'English'}
              </button>

              <button
                onClick={() => setDark(!dark)}
                style={{
                  padding: '4px 8px', borderRadius: 5,
                  border: `1px solid ${dark ? '#8B6914' : COLORS.mushafBorder}`,
                  background: dark ? '#2a1800' : '#fff8e8',
                  color: dark ? '#f0e6cc' : COLORS.mushafText,
                  cursor: 'pointer', fontSize: 13,
                }}
              >
                {dark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{
                width: 35, height: 35,
                border: `3px solid ${COLORS.mushafGold}33`,
                borderTopColor: COLORS.mushafGold,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 15px',
              }} />
              <p style={{ color: COLORS.mushafGold, fontWeight: 700, fontSize: 14 }}>
                Loading Surah...
              </p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#c62828' }}>
              <p>{error}</p>
            </div>
          ) : (
            <div className="mushaf-page-wrap">
              {mode === 'mushaf' ? (
                <MushafPage
                  surah={selectedSurah}
                  verses={verses}
                  fontSize={fontSize}
                  playingAudio={playingAudio}
                  dark={dark}
                  onPlayAudio={playAudio}
                  onToggleContinuous={toggleContinuous}
                  onStopAudio={stopAudio}
                  isPaused={isPaused}
                  continuousAudio={continuousAudio}
                  showTranslation={showTranslation}
                  lang={lang}
                  onToggleBookmark={(v) => toggleBookmark(selectedSurah, v)}
                  isBookmarked={(v) => isBookmarked(selectedSurah.number, v)}
                />
              ) : (
                <VerseView
                  surah={selectedSurah}
                  verses={verses}
                  fontSize={fontSize}
                  playingAudio={playingAudio}
                  isPaused={isPaused}
                  dark={dark}
                  showTranslation={showTranslation}
                  lang={lang}
                  onPlayAudio={playAudio}
                  onToggleBookmark={(v) => toggleBookmark(selectedSurah, v)}
                  isBookmarked={(v) => isBookmarked(selectedSurah.number, v)}
                />
              )}

              {/* Prev / Next navigation */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
                {selectedSurah.number > 1 && (
                  <button
                    onClick={() => loadSurah(SURAHS[selectedSurah.number - 2])}
                    style={{
                      padding: '10px 20px', borderRadius: 40,
                      border: `1.5px solid ${dark ? '#8B6914' : COLORS.mushafBorder}`,
                      background: dark ? '#2a1800' : '#fff8e8',
                      color: dark ? '#f0e6cc' : COLORS.mushafText,
                      cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    }}
                  >
                    ← Previous
                  </button>
                )}
                {selectedSurah.number < 114 && (
                  <button
                    onClick={() => loadSurah(SURAHS[selectedSurah.number])}
                    style={{
                      padding: '10px 24px', borderRadius: 40, border: 'none',
                      background: COLORS.mushafGold, color: '#fff',
                      cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    }}
                  >
                    Next Surah →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}