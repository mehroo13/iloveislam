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
  { label: 'S', arabicSize: '26px', transSize: '14px' },
  { label: 'M', arabicSize: '32px', transSize: '15px' },
  { label: 'L', arabicSize: '38px', transSize: '16px' },
  { label: 'XL', arabicSize: '44px', transSize: '17px' },
];

const toArabicNum = (n: number): string =>
  n.toString().split('').map(d => String.fromCharCode(0x0660 + parseInt(d))).join('');

// ── IMPROVED BISMILLAH STRIPPING ──
// Specifically targets the Indo-Pak Bismillah and common variations
const BISMILLAH_FRAGMENTS = [
  'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', // Standard Indo-Pak with specific diacritics
  'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ', // Uthmani
  'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ',
  'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ',
  'بسم الله الرحمن الرحيم',
];

function stripBismillah(text: string, surahNumber: number): string {
  let t = text.trim();
  
  // Special case: Al-Fatihah (1). Verse 1 IS Bismillah.
  // If we strip it, we return empty, which we handle in loadSurah.
  
  for (const b of BISMILLAH_FRAGMENTS) {
    if (t.startsWith(b)) {
      t = t.slice(b.length).trim();
      // also strip any leading verse-end marker ۝ or whitespace
      t = t.replace(/^[\u06DD\s]+/, '').trim();
      return t;
    }
  }
  
  // Fallback: broad regex for any Bismillah-like opener
  // This handles cases where there might be invisible characters or slight diacritic differences
  const bismillahRegex = /^بِسْمِ\s+[\u0600-\u06FF\u064B-\u065F\s]+?الرَّحِيمِ[\s\u06DD]*/u;
  const bismillahRegexUthmani = /^بِسۡمِ\s+[\u0600-\u06FF\u064B-\u065F\s]+?الرَّحِیمِ[\s\u06DD]*/u;
  
  t = t.replace(bismillahRegex, '').trim();
  t = t.replace(bismillahRegexUthmani, '').trim();
  
  return t;
}

const COLORS = {
  greenDark: '#0a3d2e',
  greenMid: '#0d5c36',
  greenLight: '#1a7a4a',
  gold: '#c8a96e',
  cream: '#f0efe0',
  white: '#fffef5',
};

export default function QuranReader() {
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('mushaf');
  const [fontSize, setFontSize] = useState(1);
  const [showTranslation, setShowTranslation] = useState(true);
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const [dark, setDark] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('quran_bookmarks');
      if (s) setBookmarks(JSON.parse(s));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem('quran_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const toggleBookmark = (s: Surah) => {
    const has = bookmarks.find(b => b.number === s.number);
    setBookmarks(has ? bookmarks.filter(b => b.number !== s.number) : [...bookmarks, { number: s.number, name: s.name, arabic: s.arabic }]);
  };
  const isBookmarked = (n: number) => bookmarks.some(b => b.number === n);

  const filtered = SURAHS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.arabic.includes(search) ||
    s.urduName.includes(search) ||
    s.meaning.toLowerCase().includes(search.toLowerCase()) ||
    s.number.toString() === search.trim()
  );

  const loadSurah = useCallback(async (surah: Surah) => {
    setSelectedSurah(surah);
    setVerses([]);
    setLoading(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // ── SOUTH ASIAN FIX: Use quran-indopak ──
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
          // Strip Bismillah from verse 1 of any surah except At-Tawbah (9)
          let arabicText = ayah.text;
          if (surah.number !== 9 && ayah.numberInSurah === 1) {
            arabicText = stripBismillah(ayah.text, surah.number);
          }

          return {
            number: ayah.numberInSurah,
            arabic: arabicText,
            translation: transData.data?.ayahs?.[idx]?.text || '',
          };
        });

        // Special handling for Al-Fatihah: If verse 1 became empty (because it was just Bismillah),
        // we keep it empty or handle it. In Mushaf mode, empty spans won't show.
        // In Verse mode, we might want to show something or just let it be.
        // Most Indo-Pak scripts keep Al-Fatihah V1 as Bismillah.
        
        setVerses(versesData);
      } else {
        setError('Failed to load Surah content.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  const cardBg = dark ? '#1a1a1a' : '#fff';
  const textCol = dark ? '#eee' : '#333';
  const borderCol = dark ? '#333' : '#eee';

  return (
    <div style={{ minHeight: '100vh', background: dark ? '#111' : '#f8f9fa', fontFamily: 'system-ui, -apple-system, sans-serif', color: textCol }}>
      {/* ── FONT INJECTION ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&family=Amiri&display=swap');
        .arabic-font {
          font-family: 'Noto Nastaliq Urdu', serif;
          word-spacing: 2px;
        }
        .urdu-font {
          font-family: 'Noto Nastaliq Urdu', serif;
        }
        /* Custom scrollbar for better look */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.gold}44; borderRadius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: ${COLORS.gold}66; }
      `}} />

      {!selectedSurah ? (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
          <header style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{ fontSize: 42, color: COLORS.greenDark, margin: '0 0 10px' }}>Al-Quran Al-Kareem</h1>
            <p style={{ color: '#666', fontSize: 16 }}>South Asian (Indo-Pak) Script Edition</p>
            
            <div style={{ marginTop: 30, position: 'relative', maxWidth: 500, margin: '30px auto 0' }}>
              <input
                type="text"
                placeholder="Search Surah by name, number or meaning..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '16px 24px', borderRadius: 50, border: '2px solid #e0e0e0', fontSize: 16, outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = COLORS.greenMid}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {filtered.map(s => (
              <div key={s.number} onClick={() => loadSurah(s)} style={{
                background: cardBg, padding: 20, borderRadius: 16, border: `1px solid ${borderCol}`, cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', alignItems: 'center', gap: 15
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: 45, height: 45, borderRadius: 12, background: COLORS.greenDark, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                  {s.number}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{s.name}</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: '#888' }}>{s.meaning}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="arabic-font" style={{ margin: 0, fontSize: 22, color: COLORS.greenMid }}>{s.arabic}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#aaa' }}>{s.verses} Ayahs</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div ref={topRef} style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>
          {/* Reader Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, background: cardBg, padding: '12px 20px', borderRadius: 12, border: `1px solid ${borderCol}`, position: 'sticky', top: 10, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <button onClick={() => setSelectedSurah(null)} style={{ background: 'none', border: 'none', color: COLORS.greenMid, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              ← Back
            </button>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${borderCol}`, background: cardBg, color: textCol }}>
                <option value="mushaf">Mushaf Mode</option>
                <option value="verse">Verse Mode</option>
              </select>
              <select value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${borderCol}`, background: cardBg, color: textCol }}>
                {FONT_SIZES.map((f, i) => <option key={i} value={i}>Size {f.label}</option>)}
              </select>
              <button onClick={() => setLang(lang === 'en' ? 'ur' : 'en')} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${borderCol}`, background: cardBg, color: textCol, cursor: 'pointer' }}>
                {lang === 'en' ? 'Urdu' : 'English'}
              </button>
              <button onClick={() => setDark(!dark)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${borderCol}`, background: cardBg, color: textCol, cursor: 'pointer' }}>
                {dark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <div style={{ width: 40, height: 40, border: `4px solid ${COLORS.gold}22`, borderTopColor: COLORS.gold, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
              <p style={{ color: COLORS.gold, fontWeight: 600 }}>Loading Surah...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
              
              <div style={{ background: COLORS.greenDark, borderRadius: 24, padding: '40px 30px', color: '#fff', marginBottom: 30, position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(10,61,46,0.2)' }}>
                {/* Decorative background elements */}
                <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
                <div style={{ position: 'absolute', bottom: -30, left: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Surah name box */}
                  <div style={{ textAlign: 'center', marginBottom: 18 }}>
                    <div style={{ display: 'inline-block', border: `2px solid ${COLORS.gold}`, borderRadius: 10, padding: '12px 40px', background: 'rgba(0,0,0,0.28)', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: COLORS.greenDark, padding: '0 12px', color: COLORS.gold, fontSize: 11, fontWeight: 700, borderRadius: 20, whiteSpace: 'nowrap' }}>
                        سورة {selectedSurah.number}
                      </div>
                      <p className="arabic-font" style={{ fontSize: 42, color: COLORS.gold, margin: 0, lineHeight: 1.2 }}>{selectedSurah.arabic}</p>
                      <p style={{ color: '#fff8', fontSize: 14, margin: '8px 0 0' }}>{selectedSurah.name} · {selectedSurah.meaning}</p>
                      <p style={{ color: '#fff5', fontSize: 11, margin: '4px 0 0' }}>{selectedSurah.verses} Verses · Juz {selectedSurah.juz} · {selectedSurah.makki ? 'Makki' : 'Madani'}</p>
                    </div>
                  </div>

                  {/* Bottom rule */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, justifyContent: 'center' }}>
                    <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${COLORS.gold}88)` }} />
                    <span style={{ color: COLORS.gold, fontSize: 20 }}>❧</span>
                    <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${COLORS.gold}88)` }} />
                  </div>

                  {/* ── BISMILLAH — shown ONCE, only if not At-Tawbah (9) ── */}
                  {selectedSurah.number !== 9 && (
                    <div style={{ textAlign: 'center', marginBottom: 26 }}>
                      <p className="arabic-font" style={{ fontSize: '38px', color: '#fff', margin: 0, lineHeight: 1.5, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                      </p>
                    </div>
                  )}

                  {/* ── MUSHAF MODE — continuous text ── */}
                  {mode === 'mushaf' && (
                    <p className="arabic-font" dir="rtl" style={{
                      fontSize: FONT_SIZES[fontSize].arabicSize,
                      color: '#fff',
                      lineHeight: 2.5,
                      textAlign: 'justify',
                      textAlignLast: 'right',
                      wordSpacing: 5,
                      margin: 0,
                      textShadow: '0 1px 3px rgba(0,0,0,0.25)',
                    }}>
                      {verses.map(v => (
                        <span key={v.number}>
                          {v.arabic}
                          {v.arabic && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '1.9em', height: '1.9em', borderRadius: '50%',
                              fontSize: '0.5em', margin: '0 0.3em', verticalAlign: 'middle',
                              fontFamily: 'Amiri, serif',
                              background: 'rgba(255,255,255,0.15)',
                              border: '1px solid rgba(255,255,255,0.35)',
                              color: '#fff', flexShrink: 0,
                            }}>
                              {toArabicNum(v.number)}
                            </span>
                          )}
                        </span>
                      ))}
                    </p>
                  )}

                  {/* ── VERSE MODE ── */}
                  {mode === 'verse' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {verses.map(v => (
                        <div key={v.number} style={{ background: 'rgba(255,255,255,0.09)', borderRadius: 12, padding: '16px 18px', border: `1px solid ${COLORS.gold}33` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: COLORS.gold, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                              {v.number}
                            </div>
                            <span style={{ color: '#ffffff66', fontSize: 11 }}>{selectedSurah.name} · Ayah {v.number}</span>
                          </div>

                          {/* Arabic */}
                          <p className="arabic-font" dir="rtl" style={{
                            fontSize: FONT_SIZES[fontSize].arabicSize,
                            color: '#fff',
                            lineHeight: 2.2,
                            textAlign: 'right',
                            margin: 0,
                            wordSpacing: 4,
                            textShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }}>
                            {v.arabic}
                            {v.arabic && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '1.8em', height: '1.8em', borderRadius: '50%',
                                fontSize: '0.5em', margin: '0 0.3em', verticalAlign: 'middle',
                                fontFamily: 'Amiri, serif',
                                background: 'rgba(255,255,255,0.15)',
                                border: '1px solid rgba(255,255,255,0.35)',
                                color: '#fff', flexShrink: 0,
                              }}>
                                {toArabicNum(v.number)}
                              </span>
                            )}
                          </p>

                          {/* Translation */}
                          {showTranslation && v.translation && (
                            <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${COLORS.gold}33` }}>
                              <p
                                className={lang === 'ur' ? 'urdu-font' : ''}
                                dir={lang === 'ur' ? 'rtl' : 'ltr'}
                                style={{
                                  color: '#ffffffcc',
                                  fontSize: lang === 'ur' ? FONT_SIZES[fontSize].transSize : FONT_SIZES[fontSize].transSize,
                                  lineHeight: 1.85,
                                  margin: 0,
                                  fontStyle: lang === 'en' ? 'italic' : 'normal',
                                  textAlign: lang === 'ur' ? 'right' : 'left',
                                }}>
                                {v.translation}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* End of surah */}
                  <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 18, borderTop: `1px solid ${COLORS.gold}44` }}>
                    <p className="arabic-font" style={{ color: COLORS.gold, fontSize: 26, margin: 0 }}>
                      ۝ صَدَقَ اللَّهُ الْعَظِيمُ ۝
                    </p>
                    <p style={{ color: '#ffffffaa', fontSize: 12, marginTop: 6 }}>
                      End of Surah {selectedSurah.name} · {selectedSurah.verses} Verses
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
                {selectedSurah.number > 1 && (
                  <button onClick={() => loadSurah(SURAHS.find(s => s.number === selectedSurah.number - 1)!)}
                    style={{ padding: '11px 22px', borderRadius: 40, border: `1px solid ${borderCol}`, background: cardBg, color: textCol, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    ← Previous
                  </button>
                )}
                {selectedSurah.number < 114 && (
                  <button onClick={() => loadSurah(SURAHS.find(s => s.number === selectedSurah.number + 1)!)}
                    style={{ padding: '11px 26px', borderRadius: 40, border: 'none', background: COLORS.greenDark, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
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
