// app/hifz/virtues.ts — hand-written, sourced virtues for the Hifz hub
// (spec §4.1.7, Appendix A). NOT AI-generated at runtime.
//
// Rules applied to every entry:
//   - Each entry quotes a real narration and names its collection + number.
//   - Grading is stated honestly. A weak narration is NEVER presented as
//     established: it is either labelled weak (with the grading note) or
//     left out entirely.
//   - Verification (checked against sunnah.com / scholarly gradings,
//     2026-11-21):
//       Al-Fatihah  — Sahih al-Bukhari 4474 (sahih, direct check).
//       Al-Mulk     — Jami` at-Tirmidhi 2891, graded Hasan (Darussalam).
//       Al-Kahf     — Sahih Muslim 809 (sahih, direct check).
//       Ayat al-Kursi — Sahih Muslim 810 (sahih, direct check).
//       Ar-Rahman   — Jami` at-Tirmidhi 3291, graded Hasan by al-Albani
//                     (Tirmidhi himself called it gharib).
//       Al-Waqi'ah / An-Naba / At-Takwir — Jami` at-Tirmidhi 3297, graded
//                     Hasan Gharib by Tirmidhi, Sahih by al-Albani.
//       Al-Ikhlas   — Sahih al-Bukhari 5015 (sahih, direct check).
//       General reward — Jami` at-Tirmidhi 2910, "hasan sahih" per Tirmidhi.
//   - OMITTED (no entry below): every other Juz Amma surah. No
//     surah-specific virtue narration for them was verified as sahih or
//     hasan, so no entry is invented for them.
//   - The two famous weak reports are addressed honestly inside the
//     Ya-Sin and Al-Waqi'ah entries (weakReportNote): Ya-Sin's "heart of
//     the Quran" (Tirmidhi 2887 — Tirmidhi called it gharib, unknown
//     narrator; several scholars grade it weak) and Al-Waqi'ah's
//     "protection from poverty" (al-Bayhaqi — graded weak by Ahmad,
//     ad-Daraqutni and al-Albani). Neither is quoted as an established
//     virtue; the entries rest on the verified general-reward hadith
//     (Tirmidhi 2910) and, for Al-Waqi'ah, on Tirmidhi 3297.

export type VirtueGrading = 'sahih' | 'hasan' | 'weak';

export interface SurahVirtue {
  /** Surah slug, or 'ayat-al-kursi' for the single-ayah entry. */
  slug: string;
  /** Surah number, or null for the single-ayah entry. */
  surahId: number | null;
  title: string;
  /** 1–3 sentences. */
  text: string;
  /** Collection + number, e.g. "Sahih Muslim 810". Always present. */
  source: string;
  grading: VirtueGrading;
  /** Who graded it / caveat on the grading. */
  gradingNote?: string;
  /** Honest note about a popular report for this surah that is weak. */
  weakReportNote?: string;
}

export const VIRTUES: SurahVirtue[] = [
  {
    slug: 'al-fatihah',
    surahId: 1,
    title: 'The greatest surah in the Quran',
    text: 'The Prophet (peace be upon him) called Al-Fatihah "the greatest surah in the Quran" — the seven oft-repeated verses (as-Sab\u2019 al-Mathani) given to him. It is the surah recited in every rak\u2019ah of prayer.',
    source: 'Sahih al-Bukhari 4474',
    grading: 'sahih',
  },
  {
    slug: 'al-mulk',
    surahId: 67,
    title: 'The surah that intercedes',
    text: '\u201cThere is a surah in the Quran of thirty verses, which intercedes for a man until he is forgiven. It is Tabarak alladhi bi-yadihil-Mulk.\u201d Memorising it is memorising an intercessor.',
    source: 'Jami` at-Tirmidhi 2891',
    grading: 'hasan',
    gradingNote: 'Graded Hasan (Darussalam).',
  },
  {
    slug: 'ya-sin',
    surahId: 36,
    title: 'Ten rewards for every letter',
    text: 'No surah-specific virtue for Ya-Sin is established as sahih, but the reward of reciting it is: whoever recites a letter from the Book of Allah receives a good deed for it, and a good deed is multiplied tenfold.',
    source: 'Jami` at-Tirmidhi 2910',
    grading: 'hasan',
    gradingNote: 'Tirmidhi graded it "hasan sahih".',
    weakReportNote:
      'The widely shared report calling Ya-Sin "the heart of the Quran" (Jami` at-Tirmidhi 2887) was called gharib by Tirmidhi himself — its chain has an unknown narrator — and is graded weak by hadith scholars, so it is not presented here as established.',
  },
  {
    slug: 'al-kahf',
    surahId: 18,
    title: 'Protection from the Dajjal',
    text: 'Whoever memorises the first ten verses of Surah Al-Kahf will be protected from the Dajjal. That is why the first ten verses are the first milestone of this surah\u2019s plan.',
    source: 'Sahih Muslim 809',
    grading: 'sahih',
  },
  {
    slug: 'ar-rahman',
    surahId: 55,
    title: 'The jinn answered better than we did',
    text: 'When the Prophet (peace be upon him) recited Ar-Rahman to his Companions they stayed silent, so he told them he had recited it to the jinn on the Night of the Jinn — and at every "Which of your Lord\u2019s favours will you both deny?" they answered, "We deny none of Your favours, our Lord, and to You belongs all praise."',
    source: 'Jami` at-Tirmidhi 3291',
    grading: 'hasan',
    gradingNote: 'Graded Hasan by al-Albani; Tirmidhi called it gharib.',
  },
  {
    slug: 'al-waqiah',
    surahId: 56,
    title: 'The surah that turned his hair grey',
    text: 'The Prophet (peace be upon him) said that Hud, Al-Waqi\u2019ah, Al-Mursalat, An-Naba and At-Takwir "have made my hair grey" — their warnings of the Day of Judgement. This surah describes that Day and the three groups of people.',
    source: 'Jami` at-Tirmidhi 3297',
    grading: 'sahih',
    gradingNote: 'Tirmidhi graded it "hasan gharib"; al-Albani graded it sahih.',
    weakReportNote:
      'The popular report that reciting Al-Waqi\u2019ah every night protects from poverty (reported by al-Bayhaqi) was graded weak by Ahmad, ad-Daraqutni and al-Albani, so it is not presented here as an established promise.',
  },
  {
    slug: 'ayat-al-kursi',
    surahId: null,
    title: 'The greatest verse in the Book of Allah',
    text: 'The Prophet (peace be upon him) asked Ubayy ibn Ka\u2019b which verse of the Book of Allah is the greatest. Ubayy answered with Ayat al-Kursi — "Allah, there is no god but He, the Living, the Eternal" — and the Prophet (peace be upon him) said, "May knowledge be pleasant for you, O Abu\u2019l-Mundhir!"',
    source: 'Sahih Muslim 810',
    grading: 'sahih',
  },
  {
    slug: 'al-ikhlas',
    surahId: 112,
    title: 'Equal to one third of the Quran',
    text: 'The Prophet (peace be upon him) said of Surah Al-Ikhlas: "By Him in Whose Hand my life is, this surah is equal to one-third of the Quran!" Four short verses — the first surah most children memorise.',
    source: 'Sahih al-Bukhari 5015',
    grading: 'sahih',
  },
  {
    slug: 'an-naba',
    surahId: 78,
    title: 'The surah that turned his hair grey',
    text: 'The Prophet (peace be upon him) said that Hud, Al-Waqi\u2019ah, Al-Mursalat, An-Naba and At-Takwir "have made my hair grey" — their warnings of the Day of Judgement. An-Naba opens Juz Amma with that Day: "About what are they asking one another?"',
    source: 'Jami` at-Tirmidhi 3297',
    grading: 'sahih',
    gradingNote: 'Tirmidhi graded it "hasan gharib"; al-Albani graded it sahih.',
  },
  {
    slug: 'at-takwir',
    surahId: 81,
    title: 'The surah that turned his hair grey',
    text: 'The Prophet (peace be upon him) said that Hud, Al-Waqi\u2019ah, Al-Mursalat, An-Naba and At-Takwir "have made my hair grey" — their warnings of the Day of Judgement. At-Takwir pictures the sun folded up and the reckoning laid bare.',
    source: 'Jami` at-Tirmidhi 3297',
    grading: 'sahih',
    gradingNote: 'Tirmidhi graded it "hasan gharib"; al-Albani graded it sahih.',
  },
];

/** Virtues keyed by slug ('ayat-al-kursi' for the single-ayah entry). */
export const VIRTUES_BY_SLUG: Record<string, SurahVirtue> =
  Object.fromEntries(VIRTUES.map((v) => [v.slug, v]));

export function getVirtue(slug: string): SurahVirtue | undefined {
  return VIRTUES_BY_SLUG[slug];
}
