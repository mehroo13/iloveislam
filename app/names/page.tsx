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

/* ── 99 Blessed Names of Prophet Muhammad ﷺ ──
   Compiled from Imam al-Jazuli's Dalail al-Khayrat, Ibn al-Qayyim's Zad al-Ma'ad,
   Qadi Iyad's al-Shifa, and authentic hadith collections. */
const PROPHET_NAMES = [
  { number: 1, arabic: 'مُحَمَّد', transliteration: 'Muhammad', meaning: 'The Oft-Praised', benefit: 'His blessed personal name; the one praised repeatedly in the heavens and on earth.' },
  { number: 2, arabic: 'أَحْمَد', transliteration: 'Ahmad', meaning: 'The Most Praiseworthy', benefit: 'The name given by Isa (AS) in glad tidings; the one who praises Allah most.' },
  { number: 3, arabic: 'حَامِد', transliteration: 'Hamid', meaning: 'The Praiser', benefit: 'The one who praises Allah in every circumstance.' },
  { number: 4, arabic: 'مَحْمُود', transliteration: 'Mahmud', meaning: 'The Praised One', benefit: 'The one praised by all creation for his noble character.' },
  { number: 5, arabic: 'الْمَاحِي', transliteration: 'Al-Mahi', meaning: 'The Effacer', benefit: 'Through him Allah erased disbelief from the earth. (Sahih Muslim)' },
  { number: 6, arabic: 'الْحَاشِر', transliteration: 'Al-Hashir', meaning: 'The Gatherer', benefit: 'People will be gathered at his feet on Judgement Day. (Sahih Muslim)' },
  { number: 7, arabic: 'الْعَاقِب', transliteration: 'Al-Aqib', meaning: 'The Last in Succession', benefit: 'The one after whom there is no prophet. (Sahih Muslim)' },
  { number: 8, arabic: 'الْمُقَفِّي', transliteration: 'Al-Muqaffi', meaning: 'The Surpasser', benefit: 'He surpasses all previous prophets in completeness.' },
  { number: 9, arabic: 'نَبِيّ التَّوْبَة', transliteration: 'Nabiyy at-Tawbah', meaning: 'The Prophet of Repentance', benefit: 'By him Allah opened the door of repentance for the world.' },
  { number: 10, arabic: 'نَبِيّ الرَّحْمَة', transliteration: 'Nabiyy ar-Rahmah', meaning: 'The Prophet of Mercy', benefit: 'He was sent as a mercy to all the worlds. (Quran 21:107)' },
  { number: 11, arabic: 'نَبِيّ الْمَلْحَمَة', transliteration: 'Nabiyy al-Malhamah', meaning: 'The Prophet of Battles', benefit: 'Sent with striving in the way of Allah against falsehood.' },
  { number: 12, arabic: 'رَسُولُ اللَّه', transliteration: 'Rasulullah', meaning: 'Messenger of Allah', benefit: 'The bearer of the final divine message to all mankind.' },
  { number: 13, arabic: 'النَّبِيّ', transliteration: 'An-Nabiyy', meaning: 'The Prophet', benefit: 'He received revelation and conveyed it faithfully.' },
  { number: 14, arabic: 'عَبْدُ اللَّه', transliteration: 'Abdullah', meaning: 'Servant of Allah', benefit: 'The most honoured title; mentioned in the Quran (72:19).' },
  { number: 15, arabic: 'الْأُمِّيّ', transliteration: 'Al-Ummiyy', meaning: 'The Unlettered', benefit: 'He could not read or write, yet brought the Quran — a clear miracle.' },
  { number: 16, arabic: 'خَاتَمُ النَّبِيِّين', transliteration: 'Khatam an-Nabiyyin', meaning: 'Seal of the Prophets', benefit: 'The last and final prophet forever. (Quran 33:40)' },
  { number: 17, arabic: 'خَاتِمُ الرُّسُل', transliteration: 'Khatim ar-Rusul', meaning: 'Seal of the Messengers', benefit: 'No messenger will come after him.' },
  { number: 18, arabic: 'حَبِيبُ اللَّه', transliteration: 'Habibullah', meaning: 'Beloved of Allah', benefit: 'The most beloved creation to Allah.' },
  { number: 19, arabic: 'صَفِيّ اللَّه', transliteration: 'Safiyyullah', meaning: 'Chosen by Allah', benefit: 'Exclusively selected by Allah for the final message.' },
  { number: 20, arabic: 'نَجِيّ اللَّه', transliteration: 'Najiyyullah', meaning: 'Confidant of Allah', benefit: 'The one who conversed intimately with Allah during Mi\'raj.' },
  { number: 21, arabic: 'كَلِيمُ اللَّه', transliteration: 'Kalimullah', meaning: 'One Addressed by Allah', benefit: 'Allah spoke to him directly without intermediary.' },
  { number: 22, arabic: 'الْمُصْطَفَى', transliteration: 'Al-Mustafa', meaning: 'The Chosen One', benefit: 'Allah chose him above all of creation for the final prophethood.' },
  { number: 23, arabic: 'الْمُجْتَبَى', transliteration: 'Al-Mujtaba', meaning: 'The Selected', benefit: 'Specially selected and purified.' },
  { number: 24, arabic: 'الْمُنْتَقَى', transliteration: 'Al-Muntaqa', meaning: 'The Elect', benefit: 'Elected for the most honoured station.' },
  { number: 25, arabic: 'رَحْمَةٌ لِلْعَالَمِين', transliteration: 'Rahmatan lil-Alamin', meaning: 'Mercy to the Worlds', benefit: 'A universal mercy for all creation. (Quran 21:107)' },
  { number: 26, arabic: 'سَيِّدُ الْمُرْسَلِين', transliteration: 'Sayyid al-Mursalin', meaning: 'Master of the Messengers', benefit: 'He is the leader of all prophets and messengers.' },
  { number: 27, arabic: 'إِمَامُ الْمُتَّقِين', transliteration: 'Imam al-Muttaqin', meaning: 'Leader of the God-Fearing', benefit: 'He leads the righteous on the path to Allah.' },
  { number: 28, arabic: 'قَائِدُ الْغُرِّ الْمُحَجَّلِين', transliteration: 'Qa\'id al-Ghurr al-Muhajjalin', meaning: 'Leader of the Brightly Shining', benefit: 'He leads those marked by the light of wudu on Judgement Day.' },
  { number: 29, arabic: 'الشَّافِع', transliteration: 'Ash-Shafi\'', meaning: 'The Intercessor', benefit: 'He will intercede for the believers on the Day of Judgement.' },
  { number: 30, arabic: 'الْمُشَفَّع', transliteration: 'Al-Mushaffa\'', meaning: 'The One Granted Intercession', benefit: 'Allah has granted him the highest intercession (Maqam Mahmud).' },
  { number: 31, arabic: 'صَاحِبُ الشَّفَاعَة', transliteration: 'Sahib ash-Shafa\'ah', meaning: 'Owner of Intercession', benefit: 'He alone holds the banner of praise on Judgement Day.' },
  { number: 32, arabic: 'صَاحِبُ الْوَسِيلَة', transliteration: 'Sahib al-Wasilah', meaning: 'Owner of the Highest Station', benefit: 'Granted al-Maqam al-Mahmud — the station of universal praise.' },
  { number: 33, arabic: 'صَاحِبُ الْحَوْض', transliteration: 'Sahib al-Hawd', meaning: 'Owner of the Pool', benefit: 'Al-Kawthar — his blessed pool from which the believers will drink.' },
  { number: 34, arabic: 'الشَّاهِد', transliteration: 'Ash-Shahid', meaning: 'The Testifier', benefit: 'He will testify for or against his nation on Judgement Day. (Quran 2:143)' },
  { number: 35, arabic: 'الشَّهِيد', transliteration: 'Ash-Shahid', meaning: 'The Witness', benefit: 'A witness to the truth of Tawhid and the final message.' },
  { number: 36, arabic: 'الْمُبَشِّر', transliteration: 'Al-Mubashshir', meaning: 'The Bringer of Good News', benefit: 'He gives glad tidings of Paradise to the obedient.' },
  { number: 37, arabic: 'الْبَشِير', transliteration: 'Al-Bashir', meaning: 'The Announcer of Good', benefit: 'He heralds the mercy and reward of Allah.' },
  { number: 38, arabic: 'النَّذِير', transliteration: 'An-Nadhir', meaning: 'The Warner', benefit: 'He warns of the punishment of the Hellfire. (Quran 35:23)' },
  { number: 39, arabic: 'الْمُنْذِر', transliteration: 'Al-Mundhir', meaning: 'The Admonisher', benefit: 'He cautions against disobedience and heedlessness.' },
  { number: 40, arabic: 'الدَّاعِي', transliteration: 'Ad-Da\'i', meaning: 'The Caller to Allah', benefit: 'He invites all humanity to the worship of Allah. (Quran 33:46)' },
  { number: 41, arabic: 'النُّور', transliteration: 'An-Nur', meaning: 'The Light', benefit: 'A light from Allah illuminating the path of guidance. (Quran 5:15)' },
  { number: 42, arabic: 'السِّرَاج', transliteration: 'As-Siraj', meaning: 'The Radiant Lamp', benefit: 'A shining lamp of guidance in the darkness. (Quran 33:46)' },
  { number: 43, arabic: 'الْمِصْبَاح', transliteration: 'Al-Misbah', meaning: 'The Lantern', benefit: 'Illuminates hearts with faith and knowledge.' },
  { number: 44, arabic: 'الْمُنِير', transliteration: 'Al-Munir', meaning: 'The Illuminator', benefit: 'Gives light to the path of truth and righteousness.' },
  { number: 45, arabic: 'الْهُدَى', transliteration: 'Al-Huda', meaning: 'The Guidance', benefit: 'He embodies and delivers divine guidance.' },
  { number: 46, arabic: 'الْمَهْدِيّ', transliteration: 'Al-Mahdiyy', meaning: 'The Guided', benefit: 'Guided by Allah to the straight path.' },
  { number: 47, arabic: 'طٰهٰ', transliteration: 'Ta-Ha', meaning: 'Purifier, Guide', benefit: 'A blessed Quranic name by which Allah addressed him. (Quran 20:1)' },
  { number: 48, arabic: 'يٰسٓ', transliteration: 'Ya-Sin', meaning: 'Chief of Mankind', benefit: 'The heart of the Quran; a special name for the Prophet. (Quran 36:1)' },
  { number: 49, arabic: 'الْمُزَّمِّل', transliteration: 'Al-Muzzammil', meaning: 'The Enwrapped in Cloak', benefit: 'The one who stood in night prayer wrapped in his garment. (Quran 73:1)' },
  { number: 50, arabic: 'الْمُدَّثِّر', transliteration: 'Al-Muddaththir', meaning: 'The Enshrouded', benefit: 'Called to arise and warn mankind. (Quran 74:1)' },
  { number: 51, arabic: 'الْأَمِين', transliteration: 'Al-Amin', meaning: 'The Trustworthy', benefit: 'Known as Al-Amin even before prophethood for his honesty.' },
  { number: 52, arabic: 'الْمَأْمُون', transliteration: 'Al-Ma\'mun', meaning: 'The Trusted', benefit: 'Entrusted with the most precious revelation.' },
  { number: 53, arabic: 'الصَّادِق', transliteration: 'As-Sadiq', meaning: 'The Truthful', benefit: 'He never spoke a lie; everything he conveyed is absolute truth.' },
  { number: 54, arabic: 'الْمُصَدَّق', transliteration: 'Al-Musaddaq', meaning: 'The Confirmed', benefit: 'Confirmed by miracles and by all previous scriptures.' },
  { number: 55, arabic: 'الْحَقّ', transliteration: 'Al-Haqq', meaning: 'The Truth', benefit: 'He came with the truth and his way is the way of truth.' },
  { number: 56, arabic: 'الْكَرِيم', transliteration: 'Al-Karim', meaning: 'The Noble & Generous', benefit: 'The most generous and honourable of all creation.' },
  { number: 57, arabic: 'الْمُكَرَّم', transliteration: 'Al-Mukarram', meaning: 'The Ennobled', benefit: 'Honoured by Allah above all others.' },
  { number: 58, arabic: 'الرَّؤُوف', transliteration: 'Ar-Ra\'uf', meaning: 'The Compassionate', benefit: 'Profoundly kind and compassionate to his nation. (Quran 9:128)' },
  { number: 59, arabic: 'الرَّحِيم', transliteration: 'Ar-Rahim', meaning: 'The Merciful', benefit: 'For the believers he is full of mercy. (Quran 9:128)' },
  { number: 60, arabic: 'الْعَفُوّ', transliteration: 'Al-\'Afuww', meaning: 'The Much-Pardoning', benefit: 'He pardoned those who wronged him with unmatched magnanimity.' },
  { number: 61, arabic: 'الشَّفِيق', transliteration: 'Ash-Shafiq', meaning: 'The Tenderhearted', benefit: 'Full of tender care and concern for his followers.' },
  { number: 62, arabic: 'النَّاصِح', transliteration: 'An-Nasih', meaning: 'The Sincere Advisor', benefit: 'He gave the most sincere counsel to all of mankind.' },
  { number: 63, arabic: 'الْوَجِيه', transliteration: 'Al-Wajih', meaning: 'The Eminent', benefit: 'Of the highest standing before Allah and all creation.' },
  { number: 64, arabic: 'الْوَكِيل', transliteration: 'Al-Wakil', meaning: 'The Entrusted', benefit: 'Entrusted with delivering the final and complete message.' },
  { number: 65, arabic: 'الْمُتَوَكِّل', transliteration: 'Al-Mutawakkil', meaning: 'Wholly Reliant on Allah', benefit: 'Described in the Torah as the one who places complete trust in Allah. (Sahih Bukhari)' },
  { number: 66, arabic: 'الْقَوِيّ', transliteration: 'Al-Qawiyy', meaning: 'The Mighty', benefit: 'Endowed with spiritual and moral strength from Allah.' },
  { number: 67, arabic: 'الْمَتِين', transliteration: 'Al-Matin', meaning: 'The Firm', benefit: 'Steadfast and unshakeable in conveying the truth.' },
  { number: 68, arabic: 'الْفَاتِح', transliteration: 'Al-Fatih', meaning: 'The Opener', benefit: 'By him Allah opened the doors of guidance after they were closed.' },
  { number: 69, arabic: 'الْجَامِع', transliteration: 'Al-Jami\'', meaning: 'The Embodier of all Virtues', benefit: 'He gathered within himself all noble qualities and virtues.' },
  { number: 70, arabic: 'الْكَامِل', transliteration: 'Al-Kamil', meaning: 'The Complete', benefit: 'Perfect in character, message, and station.' },
  { number: 71, arabic: 'إِكْلِيل', transliteration: 'Iklil', meaning: 'The Crown', benefit: 'The crown of prophethood and the adornment of creation.' },
  { number: 72, arabic: 'الْبَرّ', transliteration: 'Al-Barr', meaning: 'The Dutiful', benefit: 'Utmost dutifulness to Allah and kindness to creation.' },
  { number: 73, arabic: 'الْمُبِين', transliteration: 'Al-Mubin', meaning: 'The Clarifier', benefit: 'He clarified the revelation and made the path crystal clear.' },
  { number: 74, arabic: 'الْمُذَكِّر', transliteration: 'Al-Mudhakkir', meaning: 'The Reminder', benefit: 'He reminds people of Allah, the Hereafter, and their purpose.' },
  { number: 75, arabic: 'الْبَشَر', transliteration: 'Al-Bashar', meaning: 'The Human Being', benefit: 'A human like us, yet the best of humanity — so we can follow him.' },
  { number: 76, arabic: 'النَّجْمُ الثَّاقِب', transliteration: 'An-Najm ath-Thaqib', meaning: 'The Piercing Star', benefit: 'A shining star that pierces through darkness and ignorance.' },
  { number: 77, arabic: 'الْغَوْث', transliteration: 'Al-Ghawth', meaning: 'The Aid', benefit: 'A source of divine help and relief for those in distress.' },
  { number: 78, arabic: 'الْغِيَاث', transliteration: 'Al-Ghiyath', meaning: 'The Succour', benefit: 'He brings relief and answers to those who seek.' },
  { number: 79, arabic: 'سَيْفُ اللَّه', transliteration: 'Sayfullah', meaning: 'Sword of Allah', benefit: 'A warrior in the path of truth, defending the faith.' },
  { number: 80, arabic: 'حِزْبُ اللَّه', transliteration: 'Hizbullah', meaning: 'Party of Allah', benefit: 'The leader of Allah\'s party and those who follow him.' },
  { number: 81, arabic: 'نِعْمَةُ اللَّه', transliteration: 'Ni\'matullah', meaning: 'Blessing of Allah', benefit: 'He is the greatest blessing Allah has given to creation.' },
  { number: 82, arabic: 'هَدِيَّةُ اللَّه', transliteration: 'Hadiyyatullah', meaning: 'Gift of Allah', benefit: 'A divine gift to humanity, sent out of Allah\'s mercy.' },
  { number: 83, arabic: 'الصِّرَاطُ الْمُسْتَقِيم', transliteration: 'As-Sirat al-Mustaqim', meaning: 'The Straight Path', benefit: 'Following him means following the straight path to Allah.' },
  { number: 84, arabic: 'ذِكْرُ اللَّه', transliteration: 'Dhikrullah', meaning: 'Remembrance of Allah', benefit: 'He is a means of remembering Allah and drawing close to Him.' },
  { number: 85, arabic: 'الْعُرْوَةُ الْوُثْقَى', transliteration: 'Al-\'Urwah al-Wuthqa', meaning: 'The Trustworthy Handhold', benefit: 'The firmest grip that never breaks — belief in him and his message.' },
  { number: 86, arabic: 'أَبُو الْقَاسِم', transliteration: 'Abu al-Qasim', meaning: 'Father of Qasim', benefit: 'His kunya (teknonym) — he named himself after his first son.' },
  { number: 87, arabic: 'أَبُو الطَّاهِر', transliteration: 'Abu at-Tahir', meaning: 'Father of Tahir', benefit: 'Another blessed kunya of the Prophet ﷺ.' },
  { number: 88, arabic: 'أَبُو الطَّيِّب', transliteration: 'Abu at-Tayyib', meaning: 'Father of Tayyib', benefit: 'From his kunyas; all his names are fragrant and pure.' },
  { number: 89, arabic: 'أَبُو إِبْرَاهِيم', transliteration: 'Abu Ibrahim', meaning: 'Father of Ibrahim', benefit: 'Named after his son Ibrahim who passed away in infancy.' },
  { number: 90, arabic: 'الْمُخْتَار', transliteration: 'Al-Mukhtar', meaning: 'The Preferred One', benefit: 'Preferred by Allah over all of creation.' },
  { number: 91, arabic: 'الْعَرَبِيّ', transliteration: 'Al-\'Arabi', meaning: 'The Arab', benefit: 'From the noble lineage of the Arabs, the descendants of Isma\'il (AS).' },
  { number: 92, arabic: 'الْحِجَازِيّ', transliteration: 'Al-Hijazi', meaning: 'The Hijazi', benefit: 'From the blessed land of Hijaz, the cradle of Islam.' },
  { number: 93, arabic: 'الْمَدَنِيّ', transliteration: 'Al-Madani', meaning: 'The Madinan', benefit: 'The one who established the illuminated city of Madinah.' },
  { number: 94, arabic: 'الْهَاشِمِيّ', transliteration: 'Al-Hashimi', meaning: 'The Hashimi', benefit: 'From the noble clan of Banu Hashim of Quraysh.' },
  { number: 95, arabic: 'طَاهِر', transliteration: 'Tahir', meaning: 'The Pure', benefit: 'Pure in lineage, character, heart, and soul.' },
  { number: 96, arabic: 'مُطَهَّر', transliteration: 'Mutahhar', meaning: 'The Purified', benefit: 'Purified by Allah from all spiritual and moral defects.' },
  { number: 97, arabic: 'طَيِّب', transliteration: 'Tayyib', meaning: 'The Fragrant', benefit: 'Fragrant in name, character, and even in his blessed body.' },
  { number: 98, arabic: 'سَيِّد', transliteration: 'Sayyid', meaning: 'The Master', benefit: 'The master of all the children of Adam. (Sahih Muslim)' },
  { number: 99, arabic: 'رَسُولُ الرَّحْمَة', transliteration: 'Rasul ar-Rahmah', meaning: 'Messenger of Mercy', benefit: 'The messenger sent as the embodiment of divine mercy.' },
];

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
              {viewMode === 'prophet' && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-emerald-700 text-sm">
                    📖 "The Messenger of Allah ﷺ said: I have five names: I am Muhammad, I am Ahmad, I am al-Mahi (the Effacer) through whom Allah effaces disbelief, I am al-Hashir (the Gatherer) at whose feet people will be gathered, and I am al-\'Aqib (the Last)." — Sahih Muslim
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                const text = `${selected.arabic}\n${selected.transliteration}\n"${selected.meaning}"\n\n${selected.benefit}\n\niloveislam.life/names`;
                navigator.clipboard?.writeText(text);
              }}
              className="bg-white border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              📋 Copy
            </button>
            <button
              onClick={() => {
                const text = `${selected.arabic}\n${selected.transliteration} — ${selected.meaning}\n\niloveislam.life/names`;
                if (navigator.share) navigator.share({ title: selected.transliteration, text });
                else navigator.clipboard?.writeText(text);
              }}
              className="bg-white border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              📤 Share
            </button>
            <button
              onClick={() => setSelected(null)}
              className="bg-[#0a3d2e] rounded-xl py-3 text-sm font-medium text-white hover:opacity-90 transition-all">
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
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
        {/* Toggle */}
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
            💚 99 Names of Prophet ﷺ
          </button>
        </div>

        {/* Banner */}
        <div className="bg-gradient-to-r from-[#0a3d2e] to-[#1a6b4a] rounded-2xl p-6 mb-4 text-center text-white shadow-lg">
          <p className="text-3xl font-arabic mb-2 text-emerald-200">
            {viewMode === 'allah' ? 'أَسْمَاءُ اللَّهِ الْحُسْنَى' : 'أَسْمَاءُ النَّبِيِّ ﷺ'}
          </p>
          <p className="text-white/80 text-sm">
            {viewMode === 'allah'
              ? 'The 99 Beautiful Names of Allah – learn, memorize, and reflect'
              : 'Blessed names and titles of the Messenger of Allah ﷺ from Quran & Hadith'}
          </p>
          <p className="text-white/50 text-xs mt-2">Tap any name to see details</p>
        </div>

        {/* Name of the Day */}
        {(() => {
          const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
          const dailyName = currentList[dayOfYear % currentList.length];
          return (
            <button onClick={() => setSelected(dailyName)} className="w-full bg-white border border-emerald-200 rounded-2xl p-4 mb-4 text-center hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">✨ Name of the Day</p>
              <p className="text-3xl font-arabic text-gray-800 mb-1">{dailyName.arabic}</p>
              <p className="text-sm font-semibold text-gray-700">{dailyName.transliteration} — {dailyName.meaning}</p>
            </button>
          );
        })()}

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

        <div className="mt-10 text-center border-t pt-6">
          <p className="text-sm text-gray-500">
            {viewMode === 'allah'
              ? '“And to Allah belong the best names, so invoke Him by them.” — Quran 7:180'
              : '“Indeed, Allah and His angels send blessings upon the Prophet. O you who believe, ask Allah to send blessings and peace upon him.” — Quran 33:56'}
          </p>
        </div>
      </main>
    </div>
  );
}