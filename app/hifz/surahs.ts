// app/hifz/surahs.ts — single source of truth for the Hifz hub launch set
// (spec §1.2, §4.2). One row per launch surah + a marker for Ayat al-Kursi.
//
// Ayah counts, Arabic names, transliterations and revelation verified against
// the Quran.com chapters API (https://api.quran.com/api/v4/chapters, live
// fetch 2026-11-21). English meanings follow Quran.com's translated_name,
// lightly tidied. Juz numbers follow app/quran/lib.ts JUZ_DATA.
// Slugs: lowercase hyphenated transliteration, no "surah" prefix.
// Al-Baqarah as a whole is NOT in v1 — only its ayah 2:255 (Ayat al-Kursi).

export type Revelation = 'Makki' | 'Madani';

export interface LaunchSurah {
  /** Surah number (1–114). */
  id: number;
  /** URL slug, e.g. "al-mulk" -> /hifz/al-mulk. */
  slug: string;
  /** Arabic name. */
  arabic: string;
  /** Transliterated name. */
  name: string;
  /** English meaning. */
  meaning: string;
  /** Number of ayahs — verified against the Quran.com chapters API. */
  ayahCount: number;
  revelation: Revelation;
  /** Juz the surah starts in. */
  juz: number;
  /** Juz the surah ends in, when it spans two juz. */
  juzEnd?: number;
}

export const LAUNCH_SURAHS: LaunchSurah[] = [
  { id: 1, slug: 'al-fatihah', arabic: 'الفاتحة', name: 'Al-Fatihah', meaning: 'The Opener', ayahCount: 7, revelation: 'Makki', juz: 1 },
  { id: 18, slug: 'al-kahf', arabic: 'الكهف', name: 'Al-Kahf', meaning: 'The Cave', ayahCount: 110, revelation: 'Makki', juz: 15, juzEnd: 16 },
  { id: 36, slug: 'ya-sin', arabic: 'يس', name: 'Ya-Sin', meaning: 'Ya Sin', ayahCount: 83, revelation: 'Makki', juz: 22, juzEnd: 23 },
  { id: 55, slug: 'ar-rahman', arabic: 'الرحمن', name: 'Ar-Rahman', meaning: 'The Beneficent', ayahCount: 78, revelation: 'Madani', juz: 27 },
  { id: 56, slug: 'al-waqiah', arabic: 'الواقعة', name: 'Al-Waqi\'ah', meaning: 'The Inevitable', ayahCount: 96, revelation: 'Makki', juz: 27 },
  { id: 67, slug: 'al-mulk', arabic: 'الملك', name: 'Al-Mulk', meaning: 'The Sovereignty', ayahCount: 30, revelation: 'Makki', juz: 29 },
  { id: 78, slug: 'an-naba', arabic: 'النبإ', name: 'An-Naba', meaning: 'The Tidings', ayahCount: 40, revelation: 'Makki', juz: 30 },
  { id: 79, slug: 'an-naziat', arabic: 'النازعات', name: 'An-Nazi\'at', meaning: 'Those Who Drag Forth', ayahCount: 46, revelation: 'Makki', juz: 30 },
  { id: 80, slug: 'abasa', arabic: 'عبس', name: '\'Abasa', meaning: 'He Frowned', ayahCount: 42, revelation: 'Makki', juz: 30 },
  { id: 81, slug: 'at-takwir', arabic: 'التكوير', name: 'At-Takwir', meaning: 'The Overthrowing', ayahCount: 29, revelation: 'Makki', juz: 30 },
  { id: 82, slug: 'al-infitar', arabic: 'الإنفطار', name: 'Al-Infitar', meaning: 'The Cleaving', ayahCount: 19, revelation: 'Makki', juz: 30 },
  { id: 83, slug: 'al-mutaffifin', arabic: 'المطففين', name: 'Al-Mutaffifin', meaning: 'The Defrauding', ayahCount: 36, revelation: 'Makki', juz: 30 },
  { id: 84, slug: 'al-inshiqaq', arabic: 'الإنشقاق', name: 'Al-Inshiqaq', meaning: 'The Sundering', ayahCount: 25, revelation: 'Makki', juz: 30 },
  { id: 85, slug: 'al-buruj', arabic: 'البروج', name: 'Al-Buruj', meaning: 'The Mansions of the Stars', ayahCount: 22, revelation: 'Makki', juz: 30 },
  { id: 86, slug: 'at-tariq', arabic: 'الطارق', name: 'At-Tariq', meaning: 'The Nightcomer', ayahCount: 17, revelation: 'Makki', juz: 30 },
  { id: 87, slug: 'al-ala', arabic: 'الأعلى', name: 'Al-A\'la', meaning: 'The Most High', ayahCount: 19, revelation: 'Makki', juz: 30 },
  { id: 88, slug: 'al-ghashiyah', arabic: 'الغاشية', name: 'Al-Ghashiyah', meaning: 'The Overwhelming', ayahCount: 26, revelation: 'Makki', juz: 30 },
  { id: 89, slug: 'al-fajr', arabic: 'الفجر', name: 'Al-Fajr', meaning: 'The Dawn', ayahCount: 30, revelation: 'Makki', juz: 30 },
  { id: 90, slug: 'al-balad', arabic: 'البلد', name: 'Al-Balad', meaning: 'The City', ayahCount: 20, revelation: 'Makki', juz: 30 },
  { id: 91, slug: 'ash-shams', arabic: 'الشمس', name: 'Ash-Shams', meaning: 'The Sun', ayahCount: 15, revelation: 'Makki', juz: 30 },
  { id: 92, slug: 'al-layl', arabic: 'الليل', name: 'Al-Layl', meaning: 'The Night', ayahCount: 21, revelation: 'Makki', juz: 30 },
  { id: 93, slug: 'ad-duhaa', arabic: 'الضحى', name: 'Ad-Duhaa', meaning: 'The Morning Hours', ayahCount: 11, revelation: 'Makki', juz: 30 },
  { id: 94, slug: 'ash-sharh', arabic: 'الشرح', name: 'Ash-Sharh', meaning: 'The Relief', ayahCount: 8, revelation: 'Makki', juz: 30 },
  { id: 95, slug: 'at-tin', arabic: 'التين', name: 'At-Tin', meaning: 'The Fig', ayahCount: 8, revelation: 'Makki', juz: 30 },
  { id: 96, slug: 'al-alaq', arabic: 'العلق', name: 'Al-\'Alaq', meaning: 'The Clot', ayahCount: 19, revelation: 'Makki', juz: 30 },
  { id: 97, slug: 'al-qadr', arabic: 'القدر', name: 'Al-Qadr', meaning: 'The Power', ayahCount: 5, revelation: 'Makki', juz: 30 },
  { id: 98, slug: 'al-bayyinah', arabic: 'البينة', name: 'Al-Bayyinah', meaning: 'The Clear Proof', ayahCount: 8, revelation: 'Madani', juz: 30 },
  { id: 99, slug: 'az-zalzalah', arabic: 'الزلزلة', name: 'Az-Zalzalah', meaning: 'The Earthquake', ayahCount: 8, revelation: 'Madani', juz: 30 },
  { id: 100, slug: 'al-adiyat', arabic: 'العاديات', name: 'Al-\'Adiyat', meaning: 'The Courser', ayahCount: 11, revelation: 'Makki', juz: 30 },
  { id: 101, slug: 'al-qariah', arabic: 'القارعة', name: 'Al-Qari\'ah', meaning: 'The Calamity', ayahCount: 11, revelation: 'Makki', juz: 30 },
  { id: 102, slug: 'at-takathur', arabic: 'التكاثر', name: 'At-Takathur', meaning: 'Rivalry in World Increase', ayahCount: 8, revelation: 'Makki', juz: 30 },
  { id: 103, slug: 'al-asr', arabic: 'العصر', name: 'Al-\'Asr', meaning: 'The Declining Day', ayahCount: 3, revelation: 'Makki', juz: 30 },
  { id: 104, slug: 'al-humazah', arabic: 'الهمزة', name: 'Al-Humazah', meaning: 'The Traducer', ayahCount: 9, revelation: 'Makki', juz: 30 },
  { id: 105, slug: 'al-fil', arabic: 'الفيل', name: 'Al-Fil', meaning: 'The Elephant', ayahCount: 5, revelation: 'Makki', juz: 30 },
  { id: 106, slug: 'quraysh', arabic: 'قريش', name: 'Quraysh', meaning: 'Quraysh', ayahCount: 4, revelation: 'Makki', juz: 30 },
  { id: 107, slug: 'al-maun', arabic: 'الماعون', name: 'Al-Ma\'un', meaning: 'The Small Kindnesses', ayahCount: 7, revelation: 'Makki', juz: 30 },
  { id: 108, slug: 'al-kawthar', arabic: 'الكوثر', name: 'Al-Kawthar', meaning: 'The Abundance', ayahCount: 3, revelation: 'Makki', juz: 30 },
  { id: 109, slug: 'al-kafirun', arabic: 'الكافرون', name: 'Al-Kafirun', meaning: 'The Disbelievers', ayahCount: 6, revelation: 'Makki', juz: 30 },
  { id: 110, slug: 'an-nasr', arabic: 'النصر', name: 'An-Nasr', meaning: 'The Divine Support', ayahCount: 3, revelation: 'Madani', juz: 30 },
  { id: 111, slug: 'al-masad', arabic: 'المسد', name: 'Al-Masad', meaning: 'The Palm Fiber', ayahCount: 5, revelation: 'Makki', juz: 30 },
  { id: 112, slug: 'al-ikhlas', arabic: 'الإخلاص', name: 'Al-Ikhlas', meaning: 'The Sincerity', ayahCount: 4, revelation: 'Makki', juz: 30 },
  { id: 113, slug: 'al-falaq', arabic: 'الفلق', name: 'Al-Falaq', meaning: 'The Daybreak', ayahCount: 5, revelation: 'Makki', juz: 30 },
  { id: 114, slug: 'an-nas', arabic: 'الناس', name: 'An-Nas', meaning: 'Mankind', ayahCount: 6, revelation: 'Makki', juz: 30 },
];

/** Launch surahs keyed by slug. */
export const LAUNCH_SURAHS_BY_SLUG: Record<string, LaunchSurah> =
  Object.fromEntries(LAUNCH_SURAHS.map((s) => [s.slug, s]));

/** The six named launch surahs (spec §4.2), in hub display order. */
export const NAMED_LAUNCH_SURAHS: LaunchSurah[] = [
  'al-fatihah',
  'al-mulk',
  'ya-sin',
  'ar-rahman',
  'al-waqiah',
  'al-kahf',
].map((slug) => LAUNCH_SURAHS_BY_SLUG[slug]);

/** Juz Amma surahs (78–114), in mushaf order. */
export const JUZ_AMMA_SURAHS: LaunchSurah[] = LAUNCH_SURAHS.filter(
  (s) => s.juz === 30,
);

/**
 * Ayat al-Kursi (2:255) — a single-ayah study page, not a surah page.
 * Canonical ayah URL: /hifz/al-baqarah/2-255 ; friendly page: /hifz/ayat-al-kursi.
 */
export const AYAT_AL_KURSI = {
  surahId: 2,
  surahSlug: 'al-baqarah',
  surahName: 'Al-Baqarah',
  ayah: 255,
  /** Friendly page slug. */
  slug: 'ayat-al-kursi',
  /** Ayah ref used in the URL: /hifz/al-baqarah/2-255. */
  ref: '2-255',
  /** Canonical ayah key shown in content and metadata. */
  key: '2:255',
} as const;

export function getSurahBySlug(slug: string): LaunchSurah | undefined {
  return LAUNCH_SURAHS_BY_SLUG[slug];
}

export function getSurahById(id: number): LaunchSurah | undefined {
  return LAUNCH_SURAHS.find((s) => s.id === id);
}

/** Total indexable ayah pages in the launch set: 404 (named six) + 564 (Juz Amma) + 1 (2:255). */
export const LAUNCH_AYAH_COUNT: number =
  LAUNCH_SURAHS.reduce((sum, s) => sum + s.ayahCount, 0) + 1;
