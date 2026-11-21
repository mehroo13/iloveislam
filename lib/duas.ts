// ─── Dua for This Moment — verified dua dataset ───────────────────────────────
// Exactly 18 duas. Arabic, transliteration, translation and source are copied
// verbatim from the verified source list. Do not add, remove or alter entries.

export interface Dua {
  id: string;
  title: string;
  situations: string[];
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
}

export const DUAS: Dua[] = [
  {
    id: 'anxiety',
    title: "When you're anxious or worried",
    situations: ['anxiety', 'worry', 'stress', 'sadness', 'debt', 'fear'],
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ',
    transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazani, wal-'ajzi wal-kasali, wal-bukhli wal-jubni, wa dala'id-dayni wa ghalabatir-rijal.",
    translation: 'O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debts and from being overpowered by men.',
    source: 'Sahih al-Bukhari',
  },
  {
    id: 'sleep',
    title: 'Before you sleep',
    situations: ['sleep', 'bedtime', 'night'],
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: 'Bismika Allahumma amutu wa ahya.',
    translation: 'In Your name, O Allah, I die and I live.',
    source: 'Sahih al-Bukhari',
  },
  {
    id: 'waking',
    title: 'When you wake up',
    situations: ['waking up', 'morning'],
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    transliteration: 'Alhamdu lillahil-ladhi ahyana ba\'da ma amatana wa ilayhin-nushur.',
    translation: 'All praise is for Allah who gave us life after having taken it from us, and unto Him is the resurrection.',
    source: 'Sahih al-Bukhari',
  },
  {
    id: 'parents',
    title: 'For your parents',
    situations: ['parents', 'mother', 'father', 'gratitude'],
    arabic: 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    transliteration: 'Rabbir-hamhuma kama rabbayani saghira.',
    translation: 'My Lord, have mercy upon them as they brought me up [when I was] small.',
    source: 'Quran 17:24',
  },
  {
    id: 'knowledge',
    title: 'For knowledge',
    situations: ['knowledge', 'studying', 'learning', 'exams'],
    arabic: 'رَّبِّ زِدْنِي عِلْمًا',
    transliteration: "Rabbi zidni 'ilma.",
    translation: 'My Lord, increase me in knowledge.',
    source: 'Quran 20:114',
  },
  {
    id: 'travel',
    title: 'When you travel',
    situations: ['travel', 'journey', 'flight', 'car'],
    arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ',
    transliteration: 'Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila rabbina lamunqalibun.',
    translation: 'Exalted is He who has subjected this to us, and we could not have [otherwise] subdued it. And indeed we, to our Lord, will [surely] return.',
    source: 'Quran 43:13-14',
  },
  {
    id: 'before-eating',
    title: 'Before you eat',
    situations: ['eating', 'food', 'meal'],
    arabic: 'بِسْمِ اللَّهِ',
    transliteration: 'Bismillah.',
    translation: 'In the name of Allah.',
    source: 'Sahih al-Bukhari, Sahih Muslim',
  },
  {
    id: 'after-eating',
    title: 'After you eat',
    situations: ['eating', 'food', 'gratitude'],
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِّنِّي وَلَا قُوَّةٍ',
    transliteration: "Alhamdu lillahil-ladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah.",
    translation: 'All praise is for Allah who fed me this and provided it for me without any might or power on my part.',
    source: "Jami' at-Tirmidhi (Hasan)",
  },
  {
    id: 'entering-home',
    title: 'Entering your home',
    situations: ['home', 'entering home', 'leaving home'],
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ، بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى رَبِّنَا تَوَكَّلْنَا',
    transliteration: "Allahumma inni as'aluka khayral-mawliji wa khayral-makhraji, bismillahi walajna, wa bismillahi kharajna, wa 'ala rabbina tawakkalna.",
    translation: 'O Allah, I ask You for the best of entering and the best of leaving. In the name of Allah we enter, in the name of Allah we leave, and upon our Lord we rely.',
    source: 'Sunan Abi Dawud',
  },
  {
    id: 'forgiveness',
    title: 'When you need forgiveness',
    situations: ['forgiveness', 'sin', 'repentance', 'guilt'],
    arabic: 'رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',
    transliteration: 'Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna minal-khasirin.',
    translation: 'Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.',
    source: 'Quran 7:23',
  },
  {
    id: 'patience',
    title: 'When you need patience',
    situations: ['patience', 'hardship', 'difficulty', 'strength'],
    arabic: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا',
    transliteration: "Rabbana afrigh 'alayna sabran wa thabbit aqdamana.",
    translation: 'Our Lord, pour upon us patience and plant firmly our feet.',
    source: 'Quran 2:250',
  },
  {
    id: 'sick',
    title: 'For someone who is sick',
    situations: ['sickness', 'illness', 'healing', 'hospital'],
    arabic: 'اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا',
    transliteration: "Allahumma Rabban-nas, adhhibil-ba's, ishfi antash-Shafi, la shifa'a illa shifa'uk, shifa'an la yughadiru saqama.",
    translation: 'O Allah, Lord of the people, remove the trouble and heal, for You are the Healer. There is no healing but Yours, a healing which leaves no illness behind.',
    source: 'Sahih al-Bukhari, Sahih Muslim',
  },
  {
    id: 'marriage',
    title: 'For marriage and family',
    situations: ['marriage', 'spouse', 'children', 'family'],
    arabic: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
    transliteration: "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yunin waj'alna lil-muttaqina imama.",
    translation: 'Our Lord, grant us from among our wives and offspring comfort to our eyes and make us an example for the righteous.',
    source: 'Quran 25:74',
  },
  {
    id: 'provision',
    title: 'For provision and work',
    situations: ['provision', 'money', 'work', 'job', 'morning'],
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا',
    transliteration: "Allahumma inni as'aluka 'ilman nafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalan.",
    translation: 'O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds.',
    source: 'Sunan Ibn Majah',
  },
  {
    id: 'anger',
    title: "When you're angry",
    situations: ['anger', 'frustration', 'calm'],
    arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
    transliteration: "A'udhu billahi minash-shaytanir-rajim.",
    translation: 'I seek refuge in Allah from the accursed devil.',
    source: 'Sahih al-Bukhari, Sahih Muslim',
  },
  {
    id: 'exams',
    title: 'Before an exam',
    situations: ['exams', 'difficulty', 'ease', 'studying'],
    arabic: 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا',
    transliteration: "Allahumma la sahla illa ma ja'altahu sahla, wa anta taj'alul-hazna idha shi'ta sahla.",
    translation: 'O Allah, there is no ease except what You make easy, and You make the difficult easy if You wish.',
    source: 'Sahih Ibn Hibban',
  },
  {
    id: 'gratitude',
    title: 'For gratitude and worship',
    situations: ['gratitude', 'worship', 'remembrance', 'prayer'],
    arabic: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
    transliteration: "Allahumma a'inni 'ala dhikrika wa shukrika wa husni 'ibadatika.",
    translation: 'O Allah, help me to remember You, to thank You, and to worship You in the best manner.',
    source: 'Sunan Abi Dawud',
  },
  {
    id: 'ease',
    title: 'When something feels hard',
    situations: ['ease', 'speaking', 'presentation', 'new task', 'difficulty'],
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
    transliteration: 'Rabbish-rah li sadri, wa yassir li amri.',
    translation: 'My Lord, expand for me my chest, and ease for me my task.',
    source: 'Quran 20:25-26',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Rotate through the 18 duas by day of year (0-based). */
export function getDuaOfTheDay(): Dua {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return DUAS[dayOfYear % DUAS.length];
}

// Plain-words synonyms: a search term maps to one or more target words that
// are then matched against title + situations + translation.
const SYNONYMS: Record<string, string[]> = {
  insomnia: ['sleep'],
  sleepless: ['sleep'],
  nervous: ['anxiety'],
  worried: ['anxiety'],
  scared: ['anxiety'],
  ill: ['sick'],
  unwell: ['sick'],
  test: ['exams'],
  thankful: ['gratitude'],
  sad: ['anxiety'],
  depressed: ['anxiety'],
  money: ['provision'],
  job: ['provision'],
  kids: ['marriage'],
  mother: ['parents'],
  father: ['parents'],
  food: ['before-eating', 'after-eating'],
  journey: ['travel'],
  flight: ['travel'],
  calm: ['anger'],
  peace: ['anger'],
  hard: ['ease', 'patience'],
  difficult: ['ease', 'patience'],
  learn: ['knowledge'],
  study: ['knowledge'],
  morning: ['waking', 'provision'],
  night: ['sleep'],
};

/** Case-insensitive plain-words search against title + situations + translation. */
export function searchDuas(q: string): Dua[] {
  const query = q.trim().toLowerCase();
  if (!query) return DUAS;

  // Expand the query with synonyms, then match any of the expanded terms.
  const terms = new Set<string>([query]);
  for (const word of query.split(/\s+/)) {
    const mapped = SYNONYMS[word];
    if (mapped) mapped.forEach((m) => terms.add(m));
  }

  return DUAS.filter((dua) => {
    const haystack = [dua.title, ...dua.situations, dua.translation]
      .join(' ')
      .toLowerCase();
    for (const term of terms) {
      if (haystack.includes(term)) return true;
    }
    return false;
  });
}
