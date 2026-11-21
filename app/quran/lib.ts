/* app/quran/lib.ts — shared Quran constants, types and helpers.
   Imported by the server page (chapters + Verse of the Day) and by
   QuranClient (reader, search, tafsir, audio, bookmarks, reading plan). */

/* ------------------------------------------------------------------ */
/*  Quran Reader — Indo-Pak script (Quran.com API v4, text_indopak)   */
/*  All data is fetched client-side; the page builds with no network. */
/* ------------------------------------------------------------------ */

export const API = 'https://api.quran.com/api/v4';
export const AUDIO_BASE = 'https://verses.quran.com/';

/* Verified live against api.quran.com on 2026-11-21. */
export const TRANSLATIONS = [
  { id: 20, name: 'Saheeh International' },
  { id: 22, name: 'Yusuf Ali' },
  { id: 19, name: 'Pickthall' },
  { id: 85, name: 'Abdel Haleem' },
  { id: 84, name: 'Taqi Usmani' },
];
export const RECITERS = [
  { id: 7, name: 'Mishary Alafasy' },
  { id: 2, name: 'Abdul Basit (Murattal)' },
  { id: 3, name: 'Abdur-Rahman as-Sudais' },
  { id: 9, name: 'Muhammad al-Minshawi' },
  { id: 6, name: 'Mahmoud Al-Husary' },
  { id: 4, name: 'Abu Bakr al-Shatri' },
];
export const TAFSIR_ID = 169; // Ibn Kathir (Abridged), English — verified via /resources/tafsirs
export const TAFSIR_NAME = 'Tafsir Ibn Kathir (Abridged)';

export const BISMILLAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

/* Verse of the Day — rotates by day-of-year, same pattern as the homepage. */
export const VOTD_KEYS = [
  '94:6', '93:7', '2:152', '2:286', '49:13', '5:23',
  '2:255', '36:58', '55:13', '1:5', '3:8', '17:23', '13:28', '39:53',
];

export const JUZ_DATA: { juz: number; name: string; ar: string; start: string; surahs: number[] }[] = [
  { juz: 1, name: 'Alif Lam Mim', ar: 'الٓمٓ', start: 'Al-Fatihah 1:1', surahs: [1, 2] },
  { juz: 2, name: 'Sayaqool', ar: 'سَيَقُولُ', start: 'Al-Baqarah 2:142', surahs: [2] },
  { juz: 3, name: 'Tilkal Rusul', ar: 'تِلْكَ الرُّسُلُ', start: 'Al-Baqarah 2:253', surahs: [2, 3] },
  { juz: 4, name: 'Lan Tanaloo', ar: 'لَن تَنَالُوا', start: 'Ali Imran 3:93', surahs: [3, 4] },
  { juz: 5, name: 'Wal Muhsanat', ar: 'وَالْمُحْصَنَاتُ', start: 'An-Nisa 4:24', surahs: [4] },
  { juz: 6, name: 'La Yuhibbullah', ar: 'لَا يُحِبُّ اللَّهُ', start: 'An-Nisa 4:148', surahs: [4, 5] },
  { juz: 7, name: 'Wa Iza Samiu', ar: 'وَإِذَا سَمِعُوا', start: 'Al-Maidah 5:83', surahs: [5, 6] },
  { juz: 8, name: 'Wa Lau Annana', ar: 'وَلَوْ أَنَّنَا', start: 'Al-Anam 6:111', surahs: [6, 7] },
  { juz: 9, name: 'Qalal Malau', ar: 'قَالَ الْمَلَأُ', start: 'Al-Araf 7:88', surahs: [7, 8] },
  { juz: 10, name: 'Wa Alamu', ar: 'وَاعْلَمُوا', start: 'Al-Anfal 8:41', surahs: [8, 9] },
  { juz: 11, name: 'Yatazeroon', ar: 'يَعْتَذِرُونَ', start: 'At-Tawbah 9:93', surahs: [9, 10, 11] },
  { juz: 12, name: 'Wa Ma Min Dabbah', ar: 'وَمَا مِن دَابَّةٍ', start: 'Hud 11:6', surahs: [11, 12] },
  { juz: 13, name: 'Wa Ma Ubarriu', ar: 'وَمَا أُبَرِّئُ', start: 'Yusuf 12:53', surahs: [12, 13, 14] },
  { juz: 14, name: 'Rubama', ar: 'رُبَمَا', start: 'Al-Hijr 15:1', surahs: [15, 16] },
  { juz: 15, name: 'Subhanallazi', ar: 'سُبْحَانَ الَّذِي', start: 'Al-Isra 17:1', surahs: [17, 18] },
  { juz: 16, name: 'Qal Alam', ar: 'قَالَ أَلَمْ', start: 'Al-Kahf 18:75', surahs: [18, 19, 20] },
  { juz: 17, name: 'Iqtaraba', ar: 'اقْتَرَبَ', start: 'Al-Anbiya 21:1', surahs: [21, 22] },
  { juz: 18, name: 'Qad Aflaha', ar: 'قَدْ أَفْلَحَ', start: 'Al-Muminun 23:1', surahs: [23, 24, 25] },
  { juz: 19, name: 'Wa Qalallazina', ar: 'وَقَالَ الَّذِينَ', start: 'Al-Furqan 25:21', surahs: [25, 26, 27] },
  { juz: 20, name: 'Amman Khalaq', ar: 'أَمَّنْ خَلَقَ', start: 'An-Naml 27:56', surahs: [27, 28, 29] },
  { juz: 21, name: 'Utlu Ma Uhiya', ar: 'اتْلُ مَا أُوحِيَ', start: 'Al-Ankabut 29:46', surahs: [29, 30, 31, 32, 33] },
  { juz: 22, name: 'Wa Man Yaqnut', ar: 'وَمَن يَقْنُتْ', start: 'Al-Ahzab 33:31', surahs: [33, 34, 35, 36] },
  { juz: 23, name: 'Wa Mali', ar: 'وَمَا لِيَ', start: 'Ya-Sin 36:28', surahs: [36, 37, 38, 39] },
  { juz: 24, name: 'Faman Azlamu', ar: 'فَمَنْ أَظْلَمُ', start: 'Az-Zumar 39:32', surahs: [39, 40, 41] },
  { juz: 25, name: 'Ilaihi Yuraddu', ar: 'إِلَيْهِ يُرَدُّ', start: 'Fussilat 41:47', surahs: [41, 42, 43, 44, 45] },
  { juz: 26, name: 'Ha Mim', ar: 'حٰمٓ', start: 'Al-Ahqaf 46:1', surahs: [46, 47, 48, 49, 50, 51] },
  { juz: 27, name: 'Qala Fama Khatbukum', ar: 'قَالَ فَمَا خَطْبُكُمْ', start: 'Adh-Dhariyat 51:31', surahs: [51, 52, 53, 54, 55, 56, 57] },
  { juz: 28, name: 'Qad Sami Allah', ar: 'قَدْ سَمِعَ اللَّهُ', start: 'Al-Mujadila 58:1', surahs: [58, 59, 60, 61, 62, 63, 64, 65, 66] },
  { juz: 29, name: 'Tabarakallazi', ar: 'تَبَارَكَ الَّذِي', start: 'Al-Mulk 67:1', surahs: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77] },
  { juz: 30, name: 'Amma Yatasaaloon', ar: 'عَمَّ يَتَسَاءَلُونَ', start: 'An-Naba 78:1', surahs: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114] },
];

export interface Chapter {
  id: number;
  revelation_place: string;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  translated_name: { name: string };
}

export interface Verse {
  verse_key: string;
  verse_number: number;
  text_indopak: string;
  audio?: { url?: string };
  translations?: { text: string }[];
}

/* Same localStorage shape the old reader used, so existing bookmarks survive. */
export interface Bookmark {
  surahNumber: number;
  surahName: string;
  verseNumber: number;
  timestamp: number;
}

export interface SearchHit {
  verse_key: string;
  surahNumber: number;
  verseNumber: number;
  arabic: string;
  translation: string;
}

export type Tab = 'surahs' | 'juz' | 'search' | 'bookmarks' | 'plan';

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
}

export function dayOfYear(d: Date): number {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
}

export function networkErrorMessage(err: unknown): string {
  if (err instanceof TypeError) return 'You appear to be offline. Check your connection and try again.';
  return 'Could not load the Quran text. Please try again.';
}

