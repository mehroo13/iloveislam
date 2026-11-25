/* app/quran/lib.ts — shared Quran constants, types and helpers.
   Imported by the server page (chapters + Verse of the Day) and by
   QuranClient (reader, search, tafsir, audio, bookmarks, reading plan). */

/* ------------------------------------------------------------------ */
/*  Quran Reader — Indo-Pak script (Quran.com API v4, text_indopak)   */
/*  The browser NEVER talks to api.quran.com directly: every client    */
/*  fetch goes through the same-origin proxy /api/quran (see           */
/*  app/api/quran/[...path]/route.ts), which fetches server-side with  */
/*  a timeout, one retry and caching. The direct browser connection    */
/*  failed/timed out for some users (the Juz view failed outright).    */
/*  Server components use UPSTREAM_API directly — that path works.     */
/* ------------------------------------------------------------------ */

export const API = '/api/quran';
export const UPSTREAM_API = 'https://api.quran.com/api/v4';
export const AUDIO_BASE = 'https://verses.quran.com/';

/* Verified live against api.quran.com on 2026-11-22 (resources endpoints +
   spot-check: every id below returned real text for Al-Fatihah 1:1).
   The API returns 126 translations in total; this is a curated 104 across
   65 languages + transliteration — the widely-used translation per language
   (two where a language has two major ones). All are served freely by
   Quran.com's public API with attribution (see ATTRIBUTION in
   app/hifz/lib/fetch.ts); nothing is pasted into the repo. Tarteel's
   published 152 is NOT reproducible from Quran.com v4 — do not claim it.
   `lang` drives the <optgroup> grouping in the pickers. */
/** Dr. Mustafa Khattab, The Clear Quran — not a v4 resource (see note
 *  on its TRANSLATIONS entry); served via /api/quran/khattab. */
export const KHATTAB_TRANSLATION_ID = 131;

export const TRANSLATIONS: { id: number; name: string; lang: string }[] = [
  // English
  { id: 20, name: 'Saheeh International', lang: 'English' },
  // Khattab (id 131) is NOT a Quran.com v4 resource — verified
  // 2026-11-24, v4 has no 131. It is served from the open quran-api
  // dataset (eng-mustafakhattaba) via /api/quran/khattab, and fetch.ts
  // substitutes its text whenever translationId is 131, so pickers
  // can offer it like any other translation. The catalogue now holds
  // 105 entries (104 v4 + Khattab).
  { id: KHATTAB_TRANSLATION_ID, name: 'Dr. Mustafa Khattab, The Clear Quran', lang: 'English' },
  { id: 22, name: 'Yusuf Ali', lang: 'English' },
  { id: 19, name: 'Pickthall', lang: 'English' },
  { id: 85, name: 'Abdel Haleem', lang: 'English' },
  { id: 84, name: 'Taqi Usmani', lang: 'English' },
  { id: 203, name: 'Al-Hilali & Khan', lang: 'English' },
  { id: 149, name: 'Fadel Soliman (Bridges)', lang: 'English' },
  { id: 95, name: 'Maududi (Tafhim)', lang: 'English' },
  // French
  { id: 31, name: 'Hamidullah', lang: 'French' },
  { id: 779, name: 'Rashid Maash', lang: 'French' },
  { id: 136, name: 'Montada Islamic Foundation', lang: 'French' },
  // Indonesian
  { id: 33, name: 'Indonesian Ministry', lang: 'Indonesian' },
  { id: 134, name: 'King Fahad Quran Complex', lang: 'Indonesian' },
  // Malay
  { id: 39, name: 'Basmeih', lang: 'Malay' },
  // Russian
  { id: 45, name: 'Kuliev', lang: 'Russian' },
  { id: 78, name: 'Ministry of Awqaf, Egypt', lang: 'Russian' },
  { id: 79, name: 'Abu Adel', lang: 'Russian' },
  // Urdu
  { id: 234, name: 'Jalandhari', lang: 'Urdu' },
  { id: 54, name: 'Junagarhi', lang: 'Urdu' },
  { id: 97, name: 'Maududi (Tafheem)', lang: 'Urdu' },
  { id: 819, name: 'Wahiduddin Khan', lang: 'Urdu' },
  { id: 831, name: 'Maududi (Roman Urdu)', lang: 'Urdu' },
  // Hindi
  { id: 122, name: 'Azizul Haque', lang: 'Hindi' },
  // Turkish
  { id: 77, name: 'Diyanet', lang: 'Turkish' },
  { id: 52, name: 'Elmalili Hamdi Yazir', lang: 'Turkish' },
  // Persian
  { id: 29, name: 'Hussein Taji Kal Dari', lang: 'Persian' },
  { id: 135, name: 'IslamHouse.com', lang: 'Persian' },
  // Bengali
  { id: 161, name: 'Taisirul Quran', lang: 'Bengali' },
  { id: 213, name: 'Abu Bakr Zakaria', lang: 'Bengali' },
  { id: 163, name: 'Sheikh Mujibur Rahman', lang: 'Bengali' },
  // Spanish
  { id: 83, name: 'Isa Garcia', lang: 'Spanish' },
  { id: 199, name: 'Noor International Center', lang: 'Spanish' },
  // German
  { id: 27, name: 'Bubenheim & Nadeem', lang: 'German' },
  { id: 208, name: 'Abu Reda', lang: 'German' },
  // Italian
  { id: 153, name: 'Hamza Roberto Piccardo', lang: 'Italian' },
  { id: 209, name: 'Othman al-Sharif', lang: 'Italian' },
  // Portuguese
  { id: 103, name: 'Helmi Nasr', lang: 'Portuguese' },
  { id: 43, name: 'Samir El-Hayek', lang: 'Portuguese' },
  // Chinese
  { id: 56, name: 'Ma Jian', lang: 'Chinese' },
  { id: 109, name: 'Muhammad Makin', lang: 'Chinese' },
  // Japanese
  { id: 35, name: 'Ryoichi Mita', lang: 'Japanese' },
  { id: 218, name: 'Saeed Sato', lang: 'Japanese' },
  // Korean
  { id: 36, name: 'Korean Translation', lang: 'Korean' },
  { id: 219, name: 'Hamed Choi', lang: 'Korean' },
  // Tamil
  { id: 50, name: 'Jan Trust Foundation', lang: 'Tamil' },
  { id: 133, name: 'Abdul Hameed Baqavi', lang: 'Tamil' },
  // Swahili
  { id: 49, name: 'Ali Muhsin Al-Barwani', lang: 'Swahili' },
  { id: 231, name: 'Abu Bakr & Khamis', lang: 'Swahili' },
  // Dutch
  { id: 235, name: 'Abdalsalaam', lang: 'Dutch' },
  { id: 144, name: 'Sofian S. Siregar', lang: 'Dutch' },
  // Bosnian
  { id: 126, name: 'Besim Korkut', lang: 'Bosnian' },
  { id: 25, name: 'Muhamed Mehanović', lang: 'Bosnian' },
  // Albanian
  { id: 88, name: 'Hasan Efendi Nahi', lang: 'Albanian' },
  { id: 89, name: 'Sherif Ahmeti', lang: 'Albanian' },
  // Uzbek
  { id: 55, name: 'Muhammad Sodiq (Latin)', lang: 'Uzbek' },
  { id: 127, name: 'Muhammad Sodik', lang: 'Uzbek' },
  // Kurdish
  { id: 81, name: 'Burhan Muhammad-Amin', lang: 'Kurdish' },
  { id: 143, name: 'Muhammad Saleh Bamoki', lang: 'Kurdish' },
  // Thai
  { id: 51, name: 'King Fahad Quran Complex', lang: 'Thai' },
  { id: 230, name: 'Society of Institutes and Universities', lang: 'Thai' },
  // Vietnamese
  { id: 220, name: 'Ruwwad Center', lang: 'Vietnamese' },
  { id: 221, name: 'Hasan Abdul-Karim', lang: 'Vietnamese' },
  // Malayalam
  { id: 37, name: 'Abdul Hameed & Kunhi', lang: 'Malayalam' },
  { id: 80, name: 'Karakunnu & Elayavoor', lang: 'Malayalam' },
  // One widely-used translation per further language
  { id: 87, name: 'Sadiq and Sani', lang: 'Amharic' },
  { id: 236, name: 'Ramdane At Mansour', lang: 'Amazigh' },
  { id: 120, name: 'Rafeequl Islam', lang: 'Assamese' },
  { id: 75, name: 'Alikhan Musayev', lang: 'Azeri' },
  { id: 795, name: 'Suliman Kanti', lang: 'Bambara' },
  { id: 237, name: 'Tzvetan Theophanov', lang: 'Bulgarian' },
  { id: 106, name: 'Magomed Magomedov', lang: 'Chechen' },
  { id: 26, name: 'Czech Translation', lang: 'Czech' },
  { id: 785, name: 'Badkhashani', lang: 'Dari' },
  { id: 86, name: 'Office of the President of Maldives', lang: 'Divehi' },
  { id: 30, name: 'Finnish Translation', lang: 'Finnish' },
  { id: 232, name: 'African Development Foundation', lang: 'Ganda' },
  { id: 225, name: 'Rabila Al-Umry', lang: 'Gujarati' },
  { id: 32, name: 'Abubakar Gumi', lang: 'Hausa' },
  { id: 233, name: 'Dar Al-Salam Center', lang: 'Hebrew' },
  { id: 771, name: 'Kannada Translation', lang: 'Kannada' },
  { id: 222, name: 'Khalifa Altay', lang: 'Kazakh' },
  { id: 128, name: 'Cambodian Muslim Community', lang: 'Khmer' },
  { id: 774, name: 'Rwanda Muslims Association', lang: 'Kinyarwanda' },
  { id: 38, name: 'Maranao Translation', lang: 'Maranao' },
  { id: 226, name: "Muhammad Shafi'i Ansari", lang: 'Marathi' },
  { id: 108, name: 'Ahl Al-Hadith (Nepal)', lang: 'Nepali' },
  { id: 41, name: 'Norwegian Translation', lang: 'Norwegian' },
  { id: 111, name: 'Ghali Apapur Apaghuna', lang: 'Oromo' },
  { id: 118, name: 'Zakaria Abulsalam', lang: 'Pashto' },
  { id: 42, name: 'Józef Bielawski', lang: 'Polish' },
  { id: 44, name: 'George Grigore', lang: 'Romanian' },
  { id: 238, name: 'Taj Mehmood Amroti', lang: 'Sindhi' },
  { id: 228, name: 'Ruwwad Center', lang: 'Sinhala' },
  { id: 46, name: 'Mahmud Muhammad Abduh', lang: 'Somali' },
  { id: 48, name: 'Knut Bernström', lang: 'Swedish' },
  { id: 211, name: 'Dar Al-Salam Center', lang: 'Tagalog' },
  { id: 53, name: 'Tatar Translation', lang: 'Tatar' },
  { id: 227, name: 'Abder-Rahim ibn Muhammad', lang: 'Telugu' },
  { id: 139, name: 'Khawaja Mirof & Khawaja Mir', lang: 'Tajik' },
  { id: 74, name: 'Ayati', lang: 'Tajik' },
  { id: 76, name: 'Muhammad Saleh', lang: 'Uighur' },
  { id: 217, name: 'Mikhailo Yaqubovic', lang: 'Ukrainian' },
  { id: 125, name: 'Mikael Aykyuni', lang: 'Yoruba' },
  // Transliteration (Latin script, not a translation — grouped on its own)
  { id: 57, name: 'Transliteration', lang: 'Transliteration' },
];
/* Reciter ids verified against api.quran.com/api/v4/resources/recitations
   2026-11-22. The endpoint returns exactly these 12 recitations from 8
   reciters (probed ids 13–20: no audio) — that is the whole catalogue
   Quran.com v4 offers, so 12 is our honest count. Tarteel's published 16
   recitations are NOT reproducible from this API; do not claim 16. */
export const RECITERS = [
  { id: 7, name: 'Mishary Alafasy' },
  { id: 2, name: 'Abdul Basit (Murattal)' },
  { id: 1, name: 'Abdul Basit (Mujawwad)' },
  { id: 3, name: 'Abdur-Rahman as-Sudais' },
  { id: 9, name: 'Muhammad al-Minshawi (Murattal)' },
  { id: 8, name: 'Muhammad al-Minshawi (Mujawwad)' },
  { id: 6, name: 'Mahmoud Al-Husary' },
  { id: 12, name: 'Mahmoud Al-Husary (Muallim)' },
  { id: 4, name: 'Abu Bakr al-Shatri' },
  { id: 5, name: 'Hani ar-Rifai' },
  { id: 10, name: "Sa'ud ash-Shuraym" },
  { id: 11, name: 'Mohamed al-Tablawi' },
];
/* Tafsirs — the FULL catalogue api.quran.com/api/v4/resources/tafsirs
   returns (20 entries, 2026-11-22). Every id below was spot-checked live:
   each returned real tafsir text for 2:255 (Ayat al-Kursi). Tarteel's
   published 45 tafsirs are NOT reproducible from Quran.com v4; do not
   claim 45. Served freely by Quran.com with attribution; text is never
   pasted into the repo. */
export const TAFSIRS: { id: number; name: string; lang: string }[] = [
  // English
  { id: 169, name: 'Tafsir Ibn Kathir (Abridged)', lang: 'English' },
  { id: 168, name: "Ma'arif al-Qur'an", lang: 'English' },
  { id: 817, name: 'Tazkirul Quran (Wahiduddin Khan)', lang: 'English' },
  // Arabic
  { id: 16, name: 'Tafsir Muyassar', lang: 'Arabic' },
  { id: 91, name: "Al-Sa'di", lang: 'Arabic' },
  { id: 93, name: 'Al-Tafsir al-Wasit (Tantawi)', lang: 'Arabic' },
  { id: 14, name: 'Tafsir Ibn Kathir', lang: 'Arabic' },
  { id: 15, name: 'Tafsir al-Tabari', lang: 'Arabic' },
  { id: 90, name: 'Al-Qurtubi', lang: 'Arabic' },
  { id: 94, name: 'Tafseer Al-Baghawi', lang: 'Arabic' },
  // Bengali
  { id: 381, name: 'Tafsir Fathul Majid', lang: 'Bengali' },
  { id: 164, name: 'Tafseer ibn Kathir', lang: 'Bengali' },
  { id: 165, name: 'Tafsir Ahsanul Bayaan', lang: 'Bengali' },
  { id: 166, name: 'Tafsir Abu Bakr Zakaria', lang: 'Bengali' },
  // Urdu
  { id: 157, name: 'Fi Zilal al-Quran', lang: 'Urdu' },
  { id: 159, name: 'Bayan ul Quran', lang: 'Urdu' },
  { id: 160, name: 'Tafsir Ibn Kathir', lang: 'Urdu' },
  { id: 818, name: 'Tazkir ul Quran (Wahiduddin Khan)', lang: 'Urdu' },
  // Russian
  { id: 170, name: "Al-Sa'di", lang: 'Russian' },
  // Kurdish
  { id: 804, name: 'Rebar Kurdish Tafsir', lang: 'Kurdish' },
];
export const TAFSIR_ID = 169; // Ibn Kathir (Abridged), English — the default tafsir
export const TAFSIR_NAME = 'Tafsir Ibn Kathir (Abridged)';

/** Group a lang-tagged list (translations / tafsirs) for <optgroup>
 *  rendering, preserving first-appearance order of the languages. */
export function groupByLanguage<T extends { lang: string }>(
  items: readonly T[],
): { lang: string; items: T[] }[] {
  const order: string[] = [];
  const map = new Map<string, T[]>();
  for (const it of items) {
    if (!map.has(it.lang)) {
      map.set(it.lang, []);
      order.push(it.lang);
    }
    map.get(it.lang)!.push(it);
  }
  return order.map((lang) => ({ lang, items: map.get(lang)! }));
}

/** Display name lookups (fall back to the site defaults). */
export function translationName(id: number): string {
  return TRANSLATIONS.find((t) => t.id === id)?.name ?? 'Saheeh International';
}
export function tafsirName(id: number): string {
  return TAFSIRS.find((t) => t.id === id)?.name ?? TAFSIR_NAME;
}
export function reciterName(id: number): string {
  return RECITERS.find((r) => r.id === id)?.name ?? 'Mishary Alafasy';
}

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
  /** Uthmani (Madani) text — present when the fetch asked for text_uthmani. */
  text_uthmani?: string;
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

/* Translation text as served by Quran.com v4 carries footnote
 * markers as HTML — `<sup foot_note=195932>1</sup>` — and the plain
 * stripHtml above leaves the footnote NUMBER behind ("Allāh,1 the
 * Entirely Merciful…"). The markers (tag + number) are references
 * to notes the reader never sees, so the whole `<sup>…</sup>`
 * element goes, then any other tag, then the entities. Verified
 * 2026-11-26 across 7 v4 translations × 708 ayahs + all 114 Khattab
 * surahs (6,236 ayahs, clean already): `<sup foot_note>` is the
 * only tag in the wild, and the "=" Mehran reported lives inside
 * `foot_note=…`, so it goes with the tag. Nothing else is touched:
 * the translator's own brackets (Khattab "[Herd us!]") and
 * punctuation stay. */
export function cleanTranslationText(text: string): string {
  return text
    .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/[\s\u00a0]+/g, ' ')
    .trim();
}

/* Quran.com's Indo-Pak text carries Private Use Area markers (U+E01A–
   U+E022) — proprietary stop-mark annotations with no glyph in any
   available font, so browsers render them as empty boxes. The Quranic
   words and diacritics are untouched; only these markers are removed,
   exactly as the Uthmani text (which has nothing at those positions). */
export function cleanIndopak(text: string): string {
  return text.replace(/[\uE000-\uF8FF]/g, '');
}

/* Uthmani (Madani) text: same PUA strip for safety, then trim. The
   Uthmani script uses different letter forms (e.g. ىٰ, ۤ) and different
   word breaks from Indo-Pak, so it must never be fed to the coach's word
   alignment — see app/hifz/lib/script.ts. */
export function cleanUthmani(text: string): string {
  return text.replace(/[\uE000-\uF8FF]/g, '').trim();
}

export type QuranScript = 'indopak' | 'uthmani';

/** Display text for a verse in the reader's chosen script. Falls back to
 *  Indo-Pak when the Uthmani text was not fetched (e.g. cached responses). */
export function verseText(v: Verse, script: QuranScript): string {
  if (script === 'uthmani' && v.text_uthmani) return cleanUthmani(v.text_uthmani);
  return cleanIndopak(v.text_indopak);
}

export function dayOfYear(d: Date): number {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
}

export function networkErrorMessage(err: unknown): string {
  if (err instanceof TypeError) return 'You appear to be offline. Check your connection and try again.';
  return 'Could not load the Quran text. Please try again.';
}

