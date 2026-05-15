'use client';

import { useState } from 'react';
import Link from 'next/link';

/* ── 99 Names of Allah ── */
const ALLAH_NAMES = [
  { number: 1, arabic: 'الله', transliteration: 'Allah', meaning: 'The Greatest Name', benefit: 'The name of the Divine Essence.' },
  { number: 2, arabic: 'الرَّحْمَنُ', transliteration: 'Ar-Rahman', meaning: 'The Most Gracious', benefit: 'The One who has plenty of mercy for the believers and the blasphemers in this world.' },
  { number: 3, arabic: 'الرَّحِيمُ', transliteration: 'Ar-Rahim', meaning: 'The Most Merciful', benefit: 'The One who has plenty of mercy for the believers.' },
  { number: 4, arabic: 'الْمَلِكُ', transliteration: 'Al-Malik', meaning: 'The King', benefit: 'The One with the complete Dominion.' },
  { number: 5, arabic: 'الْقُدُّوسُ', transliteration: 'Al-Quddus', meaning: 'The Most Holy', benefit: 'The One who is pure from any imperfection.' },
  { number: 6, arabic: 'السَّلَامُ', transliteration: 'As-Salam', meaning: 'The Source of Peace', benefit: 'The One who is free from every imperfection.' },
  { number: 7, arabic: 'الْمُؤْمِنُ', transliteration: 'Al-Mumin', meaning: 'The Guardian of Faith', benefit: 'The One who witnessed for Himself that no one is God but Him.' },
  { number: 8, arabic: 'الْمُهَيْمِنُ', transliteration: 'Al-Muhaymin', meaning: 'The Protector', benefit: 'The One who witnesses the saying and deeds of His creatures.' },
  { number: 9, arabic: 'الْعَزِيزُ', transliteration: 'Al-Aziz', meaning: 'The Mighty', benefit: 'The Strong, The Defeater who is not defeated.' },
  { number: 10, arabic: 'الْجَبَّارُ', transliteration: 'Al-Jabbar', meaning: 'The Compeller', benefit: 'The One that nothing happens in His Dominion except that which He willed.' },
  { number: 11, arabic: 'الْمُتَكَبِّرُ', transliteration: 'Al-Mutakabbir', meaning: 'The Majestic', benefit: 'The One who is clear from the attributes of the creatures.' },
  { number: 12, arabic: 'الْخَالِقُ', transliteration: 'Al-Khaliq', meaning: 'The Creator', benefit: 'The One who brings everything from non-existence to existence.' },
  { number: 13, arabic: 'الْبَارِئُ', transliteration: 'Al-Bari', meaning: 'The Evolver', benefit: 'The Creator who has the Power to turn the entities.' },
  { number: 14, arabic: 'الْمُصَوِّرُ', transliteration: 'Al-Musawwir', meaning: 'The Fashioner', benefit: 'The One who forms His creatures in different pictures.' },
  { number: 15, arabic: 'الْغَفَّارُ', transliteration: 'Al-Ghaffar', meaning: 'The Repeatedly Forgiving', benefit: 'The One who forgives the sins of His slaves time and time again.' },
  { number: 16, arabic: 'الْقَهَّارُ', transliteration: 'Al-Qahhar', meaning: 'The Subduer', benefit: 'The Dominant, The One who has the perfect Power.' },
  { number: 17, arabic: 'الْوَهَّابُ', transliteration: 'Al-Wahhab', meaning: 'The Bestower', benefit: 'The One who is Generous in giving plenty without any return.' },
  { number: 18, arabic: 'الرَّزَّاقُ', transliteration: 'Ar-Razzaq', meaning: 'The Provider', benefit: 'The One who provides everything that is needed.' },
  { number: 19, arabic: 'الْفَتَّاحُ', transliteration: 'Al-Fattah', meaning: 'The Opener', benefit: 'The One who opens for His slaves the closed worldly and religious matters.' },
  { number: 20, arabic: 'اَلْعَلِيمُ', transliteration: 'Al-Alim', meaning: 'The All-Knowing', benefit: 'The Knowledgeable; The One nothing is absent from His knowledge.' },
  { number: 21, arabic: 'الْقَابِضُ', transliteration: 'Al-Qabid', meaning: 'The Withholder', benefit: 'The One who constricts the sustenance by His wisdom.' },
  { number: 22, arabic: 'الْبَاسِطُ', transliteration: 'Al-Basit', meaning: 'The Extender', benefit: 'The One who expands and widens.' },
  { number: 23, arabic: 'الْخَافِضُ', transliteration: 'Al-Khafid', meaning: 'The Abaser', benefit: 'The One who lowers whoever He willed by His Dominion.' },
  { number: 24, arabic: 'الرَّافِعُ', transliteration: 'Ar-Rafi', meaning: 'The Exalter', benefit: 'The One who raises whoever He willed by His Dominion.' },
  { number: 25, arabic: 'الْمُعِزُّ', transliteration: 'Al-Muizz', meaning: 'The Honourer', benefit: 'He gives esteem to whoever He willed.' },
  { number: 26, arabic: 'الْمُذِلُّ', transliteration: 'Al-Mudhill', meaning: 'The Dishonourer', benefit: 'The One who humiliates whoever He willed.' },
  { number: 27, arabic: 'السَّمِيعُ', transliteration: 'As-Sami', meaning: 'The All-Hearing', benefit: 'The One who Hears all things that are heard.' },
  { number: 28, arabic: 'الْبَصِيرُ', transliteration: 'Al-Basir', meaning: 'The All-Seeing', benefit: 'The One who Sees all things that are seen.' },
  { number: 29, arabic: 'الْحَكَمُ', transliteration: 'Al-Hakam', meaning: 'The Judge', benefit: 'He is the Ruler and His judgment is His Word.' },
  { number: 30, arabic: 'الْعَدْلُ', transliteration: 'Al-Adl', meaning: 'The Just', benefit: 'The One who is entitled to do what He does.' },
  { number: 31, arabic: 'اللَّطِيفُ', transliteration: 'Al-Latif', meaning: 'The Subtle One', benefit: 'The One who is kind to His slaves and endows upon them.' },
  { number: 32, arabic: 'الْخَبِيرُ', transliteration: 'Al-Khabir', meaning: 'The All-Aware', benefit: 'The One who knows the truth of things.' },
  { number: 33, arabic: 'الْحَلِيمُ', transliteration: 'Al-Halim', meaning: 'The Forbearing', benefit: 'The One who delays the punishment for those who deserve it.' },
  { number: 34, arabic: 'الْعَظِيمُ', transliteration: 'Al-Azim', meaning: 'The Magnificent', benefit: 'The One deserving the attributes of Exaltment, Glory, Extolement.' },
  { number: 35, arabic: 'الْغَفُورُ', transliteration: 'Al-Ghafur', meaning: 'The Forgiving', benefit: 'The One who forgives a lot.' },
  { number: 36, arabic: 'الشَّكُورُ', transliteration: 'Ash-Shakur', meaning: 'The Appreciative', benefit: 'The One who gives a lot of reward for a little obedience.' },
  { number: 37, arabic: 'الْعَلِيُّ', transliteration: 'Al-Ali', meaning: 'The Most High', benefit: 'The One who is clear from the attributes of the creatures.' },
  { number: 38, arabic: 'الْكَبِيرُ', transliteration: 'Al-Kabir', meaning: 'The Most Great', benefit: 'The One who is greater than everything in status.' },
  { number: 39, arabic: 'الْحَفِيظُ', transliteration: 'Al-Hafiz', meaning: 'The Preserver', benefit: 'The One who protects whatever and whoever He willed.' },
  { number: 40, arabic: 'الْمُقِيتُ', transliteration: 'Al-Muqit', meaning: 'The Maintainer', benefit: 'The One who has the Power to feed His creatures.' },
  { number: 41, arabic: 'الْحسِيبُ', transliteration: 'Al-Hasib', meaning: 'The Reckoner', benefit: 'The One who gives the satisfaction.' },
  { number: 42, arabic: 'الْجَلِيلُ', transliteration: 'Al-Jalil', meaning: 'The Majestic', benefit: 'The One who is attributed with greatness of Power.' },
  { number: 43, arabic: 'الْكَرِيمُ', transliteration: 'Al-Karim', meaning: 'The Generous', benefit: 'The One who is clear from abjectness.' },
  { number: 44, arabic: 'الرَّقِيبُ', transliteration: 'Ar-Raqib', meaning: 'The Watchful', benefit: 'The One that nothing is absent from Him.' },
  { number: 45, arabic: 'الْمُجِيبُ', transliteration: 'Al-Mujib', meaning: 'The Responsive', benefit: 'The One who answers the one in need if he asks Him.' },
  { number: 46, arabic: 'الْوَاسِعُ', transliteration: 'Al-Wasi', meaning: 'The All-Encompassing', benefit: 'The Ample, The Knowledgeable.' },
  { number: 47, arabic: 'الْحَكِيمُ', transliteration: 'Al-Hakim', meaning: 'The All-Wise', benefit: 'The One who is correct in His doings.' },
  { number: 48, arabic: 'الْوَدُودُ', transliteration: 'Al-Wadud', meaning: 'The Loving', benefit: 'The One who loves His believing slaves.' },
  { number: 49, arabic: 'الْمَجِيدُ', transliteration: 'Al-Majid', meaning: 'The Most Glorious', benefit: 'The One who is with perfect Power, High Status.' },
  { number: 50, arabic: 'الْبَاعِثُ', transliteration: 'Al-Baith', meaning: 'The Resurrector', benefit: 'The One who resurrects His slaves after death.' },
  { number: 51, arabic: 'الشَّهِيدُ', transliteration: 'Ash-Shahid', meaning: 'The Witness', benefit: 'The One who nothing is absent from Him.' },
  { number: 52, arabic: 'الْحَقُّ', transliteration: 'Al-Haqq', meaning: 'The Truth', benefit: 'The One who truly exists.' },
  { number: 53, arabic: 'الْوَكِيلُ', transliteration: 'Al-Wakil', meaning: 'The Trustee', benefit: 'The One who gives the satisfaction and is relied upon.' },
  { number: 54, arabic: 'الْقَوِيُّ', transliteration: 'Al-Qawiyy', meaning: 'The Most Strong', benefit: 'The One with the complete Power.' },
  { number: 55, arabic: 'الْمَتِينُ', transliteration: 'Al-Matin', meaning: 'The Firm', benefit: 'The One with extreme Power which is un-interrupted.' },
  { number: 56, arabic: 'الْوَلِيُّ', transliteration: 'Al-Waliyy', meaning: 'The Protecting Friend', benefit: 'The Supporter.' },
  { number: 57, arabic: 'الْحَمِيدُ', transliteration: 'Al-Hamid', meaning: 'The Praiseworthy', benefit: 'The praised One who deserves to be praised.' },
  { number: 58, arabic: 'الْمُحْصِي', transliteration: 'Al-Muhsi', meaning: 'The Counter', benefit: 'The One who the count of things are known to him.' },
  { number: 59, arabic: 'الْمُبْدِئُ', transliteration: 'Al-Mubdi', meaning: 'The Originator', benefit: 'The One who started the human being.' },
  { number: 60, arabic: 'الْمُعِيدُ', transliteration: 'Al-Muid', meaning: 'The Restorer', benefit: 'The One who brings back the creatures after death.' },
  { number: 61, arabic: 'الْمُحْيِي', transliteration: 'Al-Muhyi', meaning: 'The Giver of Life', benefit: 'The One who took out a living human from semen.' },
  { number: 62, arabic: 'اَلْمُمِيتُ', transliteration: 'Al-Mumit', meaning: 'The Creator of Death', benefit: 'The One who renders the living dead.' },
  { number: 63, arabic: 'الْحَيُّ', transliteration: 'Al-Hayy', meaning: 'The Ever Living', benefit: 'The One attributed with a life that befits His Majesty.' },
  { number: 64, arabic: 'الْقَيُّومُ', transliteration: 'Al-Qayyum', meaning: 'The Self-Existing', benefit: 'The One who remains and does not end.' },
  { number: 65, arabic: 'الْوَاجِدُ', transliteration: 'Al-Wajid', meaning: 'The Finder', benefit: 'The Rich who is never poor.' },
  { number: 66, arabic: 'الْمَاجِدُ', transliteration: 'Al-Majid', meaning: 'The Noble', benefit: 'The One who is Majid.' },
  { number: 67, arabic: 'الْواحِدُ', transliteration: 'Al-Wahid', meaning: 'The Unique', benefit: 'The One without a partner.' },
  { number: 68, arabic: 'اَلاَحَدُ', transliteration: 'Al-Ahad', meaning: 'The One', benefit: 'The One without a partner.' },
  { number: 69, arabic: 'الصَّمَدُ', transliteration: 'As-Samad', meaning: 'The Eternal', benefit: 'The Master who is relied upon in matters.' },
  { number: 70, arabic: 'الْقَادِرُ', transliteration: 'Al-Qadir', meaning: 'The All-Powerful', benefit: 'The One attributed with Power.' },
  { number: 71, arabic: 'الْمُقْتَدِرُ', transliteration: 'Al-Muqtadir', meaning: 'The Prevailing', benefit: 'The One with the perfect Power.' },
  { number: 72, arabic: 'الْمُقَدِّمُ', transliteration: 'Al-Muqaddim', meaning: 'The Expediter', benefit: 'The One who puts things in their right places.' },
  { number: 73, arabic: 'الْمُؤَخِّرُ', transliteration: 'Al-Muakhkhir', meaning: 'The Delayer', benefit: 'The One who puts things in their right places.' },
  { number: 74, arabic: 'الأوَّلُ', transliteration: 'Al-Awwal', meaning: 'The First', benefit: 'The One whose Existence is without a beginning.' },
  { number: 75, arabic: 'الآخِرُ', transliteration: 'Al-Akhir', meaning: 'The Last', benefit: 'The One whose Existence is without an end.' },
  { number: 76, arabic: 'الظَّاهِرُ', transliteration: 'Az-Zahir', meaning: 'The Manifest', benefit: 'The One above Whom nothing exists.' },
  { number: 77, arabic: 'الْبَاطِنُ', transliteration: 'Al-Batin', meaning: 'The Hidden', benefit: 'The One below Whom nothing exists.' },
  { number: 78, arabic: 'الْوَالِي', transliteration: 'Al-Wali', meaning: 'The Governor', benefit: 'The One who owns things and manages them.' },
  { number: 79, arabic: 'الْمُتَعَالِي', transliteration: 'Al-Mutaali', meaning: 'The Most Exalted', benefit: 'The One who is clear from the attributes of the creation.' },
  { number: 80, arabic: 'الْبَرُّ', transliteration: 'Al-Barr', meaning: 'The Source of Goodness', benefit: 'The One who is kind to His creatures.' },
  { number: 81, arabic: 'التَّوَّابُ', transliteration: 'At-Tawwab', meaning: 'The Ever-Returning', benefit: 'The One who grants repentance to whoever He willed.' },
  { number: 82, arabic: 'الْمُنْتَقِمُ', transliteration: 'Al-Muntaqim', meaning: 'The Avenger', benefit: 'The One who victoriously prevails over His enemies.' },
  { number: 83, arabic: 'العَفُوُّ', transliteration: 'Al-Afuww', meaning: 'The Pardoner', benefit: 'The One with wide forgiveness.' },
  { number: 84, arabic: 'الرَّؤُوفُ', transliteration: 'Ar-Rauf', meaning: 'The Compassionate', benefit: 'The One with extreme Mercy.' },
  { number: 85, arabic: 'مَالِكُ الْمُلْكِ', transliteration: 'Malik-ul-Mulk', meaning: 'Owner of All Sovereignty', benefit: 'The One who controls the Dominion.' },
  { number: 86, arabic: 'ذُوالْجَلاَلِ وَالإكْرَامِ', transliteration: 'Dhul-Jalali-wal-Ikram', meaning: 'Lord of Majesty and Generosity', benefit: 'The One who deserves to be Exalted.' },
  { number: 87, arabic: 'الْمُقْسِطُ', transliteration: 'Al-Muqsit', meaning: 'The Equitable', benefit: 'The One who is Just in His judgment.' },
  { number: 88, arabic: 'الْجَامِعُ', transliteration: 'Al-Jami', meaning: 'The Gatherer', benefit: 'The One who gathers the creatures on a day there is no doubt about.' },
  { number: 89, arabic: 'الْغَنِيُّ', transliteration: 'Al-Ghani', meaning: 'The Self-Sufficient', benefit: 'The One who does not need the creation.' },
  { number: 90, arabic: 'الْمُغْنِي', transliteration: 'Al-Mughni', meaning: 'The Enricher', benefit: 'The One who satisfies the necessities of the creatures.' },
  { number: 91, arabic: 'اَلْمَانِعُ', transliteration: 'Al-Mani', meaning: 'The Withholder', benefit: 'The Supporter who protects and gives victory to His pious believers.' },
  { number: 92, arabic: 'الضَّارَّ', transliteration: 'Ad-Darr', meaning: 'The Distresser', benefit: 'The One who makes harm reach to whoever He willed.' },
  { number: 93, arabic: 'النَّافِعُ', transliteration: 'An-Nafi', meaning: 'The Propitious', benefit: 'The One who gives benefits to whoever He willed.' },
  { number: 94, arabic: 'النُّورُ', transliteration: 'An-Nur', meaning: 'The Light', benefit: 'The One who guides the believers to the right path.' },
  { number: 95, arabic: 'الْهَادِي', transliteration: 'Al-Hadi', meaning: 'The Guide', benefit: 'The One who made His believers succeed in knowing the truth.' },
  { number: 96, arabic: 'الْبَدِيعُ', transliteration: 'Al-Badi', meaning: 'The Incomparable', benefit: 'The One who created the creation and formed it without any preceding example.' },
  { number: 97, arabic: 'اَلْبَاقِي', transliteration: 'Al-Baqi', meaning: 'The Ever-Enduring', benefit: 'The One for whom the state of non-existence is impossible.' },
  { number: 98, arabic: 'الْوَارِثُ', transliteration: 'Al-Warith', meaning: 'The Inheritor', benefit: 'The One whose Existence remains.' },
  { number: 99, arabic: 'الرَّشِيدُ', transliteration: 'Ar-Rashid', meaning: 'The Guide to the Right Path', benefit: 'The One who guides.' },
];

/* ── Blessed Names of Prophet Muhammad ﷺ ── */
const PROPHET_NAMES = [
  { number: 1, arabic: 'مُحَمَّد', transliteration: 'Muhammad', meaning: 'The Praised One', benefit: 'The most praised; his name is praised on earth and in the heavens.' },
  { number: 2, arabic: 'أَحْمَد', transliteration: 'Ahmad', meaning: 'The Most Praiseworthy', benefit: 'As mentioned in the Quran, Prophet Isa (AS) gave glad tidings of Ahmad.' },
  { number: 3, arabic: 'الْمَاحِي', transliteration: 'Al-Mahi', meaning: 'The Eraser', benefit: 'By him Allah erases disbelief.' },
  { number: 4, arabic: 'الْحَاشِر', transliteration: 'Al-Hashir', meaning: 'The Gatherer', benefit: 'People will be gathered at his feet on the Day of Judgment.' },
  { number: 5, arabic: 'الْعَاقِب', transliteration: 'Al-Aqib', meaning: 'The Last Prophet', benefit: 'The one who is after whom there is no prophet.' },
  { number: 6, arabic: 'نَبِيُّ التَّوْبَة', transliteration: 'Nabiyy at-Tawbah', meaning: 'The Prophet of Repentance', benefit: 'He opened the door of repentance.' },
  { number: 7, arabic: 'نَبِيُّ الرَّحْمَة', transliteration: 'Nabiyy ar-Rahmah', meaning: 'The Prophet of Mercy', benefit: 'He was sent as a mercy to the worlds.' },
  { number: 8, arabic: 'نَبِيُّ الْمَلْحَمَة', transliteration: 'Nabiyy al-Malhamah', meaning: 'The Prophet of Battles', benefit: 'He was sent with striving in the cause of Allah.' },
  { number: 9, arabic: 'الْأُمِّي', transliteration: 'Al-Ummi', meaning: 'The Unlettered', benefit: 'He could not read or write, yet received the Quran.' },
  { number: 10, arabic: 'شَاهِد', transliteration: 'Shahid', meaning: 'The Witness', benefit: 'He will be a witness over his nation.' },
  { number: 11, arabic: 'مُبَشِّر', transliteration: 'Mubashshir', meaning: 'The Bringer of Good News', benefit: 'He brings glad tidings of Paradise.' },
  { number: 12, arabic: 'نَذِير', transliteration: 'Nadhir', meaning: 'The Warner', benefit: 'He warns of the punishment of the Hellfire.' },
  { number: 13, arabic: 'سِرَاج', transliteration: 'Siraj', meaning: 'The Radiant Lamp', benefit: 'He illuminates the path of guidance.' },
  { number: 14, arabic: 'مُدَّثِّر', transliteration: 'Muddaththir', meaning: 'The Enwrapped', benefit: 'The one covered with garments, called to arise and warn.' },
  { number: 15, arabic: 'مُزَّمِّل', transliteration: 'Muzzammil', meaning: 'The Wrapped in Cloak', benefit: 'The one who spent nights in prayer.' },
  { number: 16, arabic: 'طٰهٰ', transliteration: 'Ta-Ha', meaning: 'Purifier, Guide', benefit: 'A blessed name by which Allah addressed him in the Quran.' },
  { number: 17, arabic: 'يٰسٓ', transliteration: 'Ya-Sin', meaning: 'Chief of Mankind', benefit: 'The heart of the Quran; a special name for the Prophet.' },
  { number: 18, arabic: 'الْمُصْطَفَى', transliteration: 'Al-Mustafa', meaning: 'The Chosen One', benefit: 'Allah chose him above all creation.' },
  { number: 19, arabic: 'الْمُجْتَبَى', transliteration: 'Al-Mujtaba', meaning: 'The Selected', benefit: 'He was specially selected for prophethood.' },
  { number: 20, arabic: 'خَاتَمُ النَّبِيِّين', transliteration: 'Khatam an-Nabiyyin', meaning: 'The Seal of the Prophets', benefit: 'The last and final prophet, no prophet will come after him.' },
  { number: 21, arabic: 'رَسُولُ اللَّه', transliteration: 'Rasulullah', meaning: 'Messenger of Allah', benefit: 'He delivered the final message to mankind.' },
  { number: 22, arabic: 'حَبِيبُ اللَّه', transliteration: 'Habibullah', meaning: 'Beloved of Allah', benefit: 'He is the most beloved to Allah.' },
  { number: 23, arabic: 'صَاحِبُ الشَّفَاعَة', transliteration: 'Sahib ash-Shafa\'ah', meaning: 'The Owner of Intercession', benefit: 'He will intercede for the believers on Judgement Day.' },
  { number: 24, arabic: 'صَاحِبُ الْحَوْض', transliteration: 'Sahib al-Hawd', meaning: 'The Owner of the Pool', benefit: 'He will have the Hawd al-Kawthar to give drink to his followers.' },
  { number: 25, arabic: 'صَاحِبُ الْوَسِيلَة', transliteration: 'Sahib al-Wasilah', meaning: 'The Owner of the Highest Station', benefit: 'He will be granted the Maqam Mahmud (the station of praise).' },
  { number: 26, arabic: 'نَبِيُّ الْهُدَى', transliteration: 'Nabiyy al-Huda', meaning: 'The Prophet of Guidance', benefit: 'He guides to the straight path.' },
  { number: 27, arabic: 'رَحْمَةً لِّلْعَالَمِين', transliteration: 'Rahmatan lil-Alamin', meaning: 'Mercy to the Worlds', benefit: 'He is a mercy to all of creation.' },
  { number: 28, arabic: 'النُّور', transliteration: 'An-Nur', meaning: 'The Light', benefit: 'He illuminates the darkness of ignorance.' },
  { number: 29, arabic: 'الْبَشِير', transliteration: 'Al-Bashir', meaning: 'The Bringer of Good News', benefit: 'He announces the reward of Paradise for the believers.' },
  { number: 30, arabic: 'الْمُنِير', transliteration: 'Al-Munir', meaning: 'The Illuminator', benefit: 'He enlightens the hearts with faith.' },
];

// Combine data
type NameItem = { number: number; arabic: string; transliteration: string; meaning: string; benefit: string };

export default function NamesOfAllah() {
  const [viewMode, setViewMode] = useState<'allah' | 'prophet'>('allah');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<NameItem | null>(null);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  const currentList = viewMode === 'allah' ? ALLAH_NAMES : PROPHET_NAMES;

  const filtered = currentList.filter((n) =>
    n.transliteration.toLowerCase().includes(search.toLowerCase()) ||
    n.meaning.toLowerCase().includes(search.toLowerCase()) ||
    n.arabic.includes(search) ||
    n.number.toString().includes(search)
  );

  const getColor = (index: number) => {
    const colors = ['#0a3d2e', '#1a6b4a', '#b8860b', '#2563eb', '#7c3aed', '#b45309', '#059669'];
    return colors[index % colors.length];
  };

  if (selected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <header className="bg-gradient-to-r from-[#0a3d2e] to-[#1a6b4a] text-white px-6 py-4 flex items-center gap-4 shadow-lg">
          <button onClick={() => setSelected(null)} className="text-white/80 hover:text-white text-sm">← Back</button>
          <h1 className="font-semibold text-lg">{viewMode === 'allah' ? '99 Names of Allah' : 'Names of Prophet ﷺ'}</h1>
        </header>
        <main className="max-w-lg mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-[#0a3d2e] to-[#1a6b4a] p-6 text-center">
              <p className="text-emerald-200 text-sm mb-2">#{selected.number}</p>
              <p className="text-5xl md:text-6xl font-arabic text-white mb-4 leading-relaxed">{selected.arabic}</p>
              <p className="text-2xl font-bold text-white mb-1">{selected.transliteration}</p>
              <p className="text-emerald-100 text-lg">{selected.meaning}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Benefit & Meaning</h3>
                <p className="text-gray-700 leading-relaxed">{selected.benefit}</p>
              </div>
              {viewMode === 'allah' && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-emerald-700 text-sm">
                    📖 The Prophet ﷺ said: <em>"Allah has ninety-nine names. Whoever preserves them will enter Paradise."</em> (Bukhari)
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                const idx = currentList.findIndex(n => n.number === selected.number);
                if (idx > 0) setSelected(currentList[idx - 1]);
              }}
              disabled={selected.number === 1}
              className="bg-white border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all">
              ← Previous
            </button>
            <button
              onClick={() => {
                const idx = currentList.findIndex(n => n.number === selected.number);
                if (idx < currentList.length - 1) setSelected(currentList[idx + 1]);
              }}
              disabled={selected.number === currentList.length}
              className="bg-white border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all">
              Next →
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <header className="bg-gradient-to-r from-[#0a3d2e] to-[#1a6b4a] text-white px-6 py-4 flex items-center gap-4 shadow-lg sticky top-0 z-10">
        <Link href="/" className="text-white/80 hover:text-white text-sm">← Back</Link>
        <h1 className="font-semibold text-lg flex-1">
          {viewMode === 'allah' ? '99 Names of Allah' : 'Names of Prophet ﷺ'}
        </h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Toggle between Allah and Prophet names */}
        <div className="flex bg-white rounded-2xl p-1 border border-gray-200 shadow-sm mb-6">
          <button
            onClick={() => { setViewMode('allah'); setSelected(null); }}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
              viewMode === 'allah' ? 'bg-[#0a3d2e] text-white shadow' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🕌 99 Names of Allah
          </button>
          <button
            onClick={() => { setViewMode('prophet'); setSelected(null); }}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
              viewMode === 'prophet' ? 'bg-[#0a3d2e] text-white shadow' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            💚 Names of Prophet ﷺ
          </button>
        </div>

        {/* Banner */}
        <div className="bg-gradient-to-r from-[#0a3d2e] to-[#1a6b4a] rounded-2xl p-6 mb-6 text-center text-white shadow-lg">
          <p className="text-3xl font-arabic mb-2 text-emerald-200">
            {viewMode === 'allah' ? 'أَسْمَاءُ اللَّهِ الْحُسْنَى' : 'أَسْمَاءُ النَّبِيِّ ﷺ'}
          </p>
          <p className="text-white/80 text-sm">
            {viewMode === 'allah'
              ? 'The 99 Beautiful Names of Allah – learn, memorize, and reflect'
              : 'Blessed names and titles of the Messenger of Allah ﷺ'}
          </p>
          <p className="text-white/50 text-xs mt-2">Tap any name to see details</p>
        </div>

        {/* Search & layout toggle */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or meaning..."
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm bg-white focus:ring-2 focus:ring-emerald-200 outline-none shadow-sm"
            />
          </div>
          <button
            onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')}
            className="bg-white border border-gray-200 rounded-xl px-4 text-sm text-gray-500 hover:bg-gray-50 shadow-sm"
          >
            {layout === 'grid' ? '☰' : '⊞'}
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-4">{filtered.length} names found</p>

        {/* Grid Layout */}
        {layout === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map((name, i) => (
              <button
                key={name.number}
                onClick={() => setSelected(name)}
                className="group bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all hover:border-emerald-200"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold mx-auto mb-2">
                  {name.number}
                </div>
                <p className="font-arabic text-3xl mb-2 text-gray-800 group-hover:text-[#0a3d2e] transition">{name.arabic}</p>
                <p className="text-sm font-semibold text-gray-700">{name.transliteration}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{name.meaning}</p>
              </button>
            ))}
          </div>
        )}

        {/* List Layout */}
        {layout === 'list' && (
          <div className="space-y-2">
            {filtered.map((name) => (
              <button
                key={name.number}
                onClick={() => setSelected(name)}
                className="w-full bg-white border border-gray-100 rounded-xl px-5 py-3 flex items-center gap-4 hover:border-emerald-200 hover:shadow-sm transition-all text-left"
              >
                <span className="text-xs font-bold text-gray-400 w-6">{name.number}</span>
                <p className="font-arabic text-2xl text-gray-700 w-16 text-right">{name.arabic}</p>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{name.transliteration}</p>
                  <p className="text-xs text-gray-400 truncate">{name.meaning}</p>
                </div>
                <span className="text-gray-300 text-lg">›</span>
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🌙</p>
            <p className="text-gray-500">No names match your search</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center border-t pt-6">
          <p className="text-sm text-gray-500">
            {viewMode === 'allah'
              ? '“And to Allah belong the best names, so invoke Him by them.” — Quran 7:180'
              : '“Indeed, Allah and His angels send blessings upon the Prophet.” — Quran 33:56'}
          </p>
        </div>
      </main>
    </div>
  );
}