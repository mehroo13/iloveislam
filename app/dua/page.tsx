'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';

// ─── Language ───────────────────────────────────────────────────────────────
const LANGUAGES = { ENGLISH: 'en', URDU: 'ur' } as const;
type Lang = (typeof LANGUAGES)[keyof typeof LANGUAGES];

// ─── Types ───────────────────────────────────────────────────────────────────
interface Dua {
  id: number;
  title: string;
  titleUrdu: string;
  category: string;
  categoryUrdu: string;
  occasion?: string;
  arabic: string;
  transliteration: string;
  translation: string;
  translationUrdu: string;
  reference: string;
  source: 'quran' | 'bukhari' | 'muslim' | 'tirmidhi' | 'abudawud' | 'nasai' | 'ibnemajah' | 'ahmad' | 'hisn';
  benefits: string;
  verified: boolean;
  tags: string[];
}

// ─── Expanded Dataset (60 duas) ──────────────────────────────────────────────
const AUTHENTIC_DUAS: Dua[] = [
  // ── FORGIVENESS ──
  {
    id: 1, title: "Dua for Forgiveness (Adaam & Hawwa)", titleUrdu: "معافی کی دعا", category: "Forgiveness", categoryUrdu: "معافی", occasion: "General",
    arabic: "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
    transliteration: "Rabbana zalamna anfusana wa-in lam taghfir lana wa tarhamna lanakoonanna minal khasireen",
    translation: "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.",
    translationUrdu: "اے ہمارے رب! ہم نے اپنی جانوں پر ظلم کیا اور اگر تو نے ہمیں معاف نہ کیا اور رحم نہ فرمایا تو ہم نقصان اٹھانے والوں میں سے ہوں گے۔",
    reference: "Surah Al-A'raf 7:23", source: "quran", benefits: "The dua of Prophet Adam (AS) — one of the most accepted duas for forgiveness.", verified: true, tags: ["forgiveness", "mercy", "tawbah"]
  },
  {
    id: 2, title: "Sayyid al-Istighfar (Master of Forgiveness)", titleUrdu: "سید الاستغفار", category: "Forgiveness", categoryUrdu: "معافی", occasion: "Morning & Evening",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    transliteration: "Allahumma anta rabbi la ilaha illa anta, khalaqtani wa ana abduka, wa ana 'ala ahdika wa wa'dika mastata'tu, a'oodhu bika min sharri ma sana'tu, aboo'u laka bini'matika 'alayya, wa aboo'u bidhanbee, faghfir li fa-innahu la yaghfirudh-dhunooba illa ant",
    translation: "O Allah, You are my Lord, there is no god but You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil I have done. I acknowledge Your blessings upon me, and I acknowledge my sin, so forgive me, for indeed none forgives sins but You.",
    translationUrdu: "اے اللہ! تو میرا رب ہے، تیرے سوا کوئی معبود نہیں۔ تو نے مجھے پیدا کیا اور میں تیرا بندہ ہوں، میں اپنی طاقت کے مطابق تیرے عہد و پیمان پر قائم ہوں۔ میں اپنے کیے کی برائی سے تیری پناہ مانگتا ہوں، تیری نعمتوں کا اقرار کرتا ہوں اور اپنے گناہوں کا بھی اقرار کرتا ہوں، پس مجھے معاف کر دے کیونکہ گناہ تیرے سوا کوئی نہیں بخش سکتا۔",
    reference: "Sahih al-Bukhari 6306", source: "bukhari", benefits: "Prophet (ﷺ) said: whoever recites this with certainty in the morning and dies before evening enters Paradise.", verified: true, tags: ["forgiveness", "morning", "evening", "istighfar"]
  },
  {
    id: 3, title: "Dua of Yunus (AS) in the Whale", titleUrdu: "حضرت یونسؑ کی دعا", category: "Forgiveness", categoryUrdu: "معافی", occasion: "Distress",
    arabic: "لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ",
    transliteration: "La ilaha illa anta subhanaka inni kuntu minaz-zalimeen",
    translation: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.",
    translationUrdu: "تیرے سوا کوئی معبود نہیں، تو پاک ہے، بے شک میں ظالموں میں سے تھا۔",
    reference: "Surah Al-Anbiya 21:87", source: "quran", benefits: "Allah accepted this dua and saved Yunus (AS). Recite in any hopeless situation.", verified: true, tags: ["distress", "forgiveness", "relief", "crisis"]
  },
  // ── ANXIETY & STRESS ──
  {
    id: 4, title: "Dua for Anxiety & Grief", titleUrdu: "پریشانی اور غم کی دعا", category: "Anxiety & Stress", categoryUrdu: "پریشانی", occasion: "General",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ وَالْجُبْنِ وَالْبُخْلِ وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ",
    transliteration: "Allahumma inni a'oodhu bika minal-hammi wal-hazani, wal-'ajzi wal-kasali, wal-jubni wal-bukhli, wa dhala'id-dayni wa ghalabatir-rijal",
    translation: "O Allah, I seek refuge in You from anxiety and grief, weakness and laziness, cowardice and miserliness, the burden of debt, and being overpowered by men.",
    translationUrdu: "اے اللہ! میں تیری پناہ مانگتا ہوں فکر و غم سے، عاجزی و سستی سے، بزدلی و کنجوسی سے، قرض کے بوجھ سے اور لوگوں کے غلبے سے۔",
    reference: "Sahih al-Bukhari 6369", source: "bukhari", benefits: "Prophet (ﷺ) frequently recited this — covers 8 major life stresses in one dua.", verified: true, tags: ["anxiety", "stress", "debt", "laziness"]
  },
  {
    id: 5, title: "Dua for Relief from Hardship", titleUrdu: "تکلیف سے نجات کی دعا", category: "Anxiety & Stress", categoryUrdu: "پریشانی", occasion: "Difficulty",
    arabic: "اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا",
    transliteration: "Allahumma la sahla illa ma ja'altahu sahlan, wa anta taj'alul-hazna idha shi'ta sahlan",
    translation: "O Allah, there is no ease except in what You make easy, and You make difficulty easy when You will.",
    translationUrdu: "اے اللہ! کوئی آسانی نہیں سوائے اس کے جو تو آسان کر دے، اور تو مشکل کو بھی جب چاہے آسان بنا دیتا ہے۔",
    reference: "Ibn Hibban 3/255", source: "ahmad", benefits: "Dua to ask Allah to make difficult matters easy.", verified: true, tags: ["ease", "hardship", "difficulty"]
  },
  // ── PARENTS ──
  {
    id: 6, title: "Dua for Parents", titleUrdu: "والدین کے لیے دعا", category: "Parents", categoryUrdu: "والدین", occasion: "General",
    arabic: "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
    transliteration: "Rabbir hamhuma kama rabbayani sagheera",
    translation: "My Lord, have mercy upon them as they brought me up when I was small.",
    translationUrdu: "اے میرے رب! ان دونوں پر رحم فرما جیسا کہ انہوں نے مجھے بچپن میں پالا۔",
    reference: "Surah Al-Isra 17:24", source: "quran", benefits: "Essential dua from the Quran — to be recited for living and deceased parents.", verified: true, tags: ["parents", "mercy", "family"]
  },
  {
    id: 7, title: "Dua for Forgiveness of Parents", titleUrdu: "والدین کی مغفرت کی دعا", category: "Parents", categoryUrdu: "والدین", occasion: "General",
    arabic: "رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ",
    transliteration: "Rabbanagh-fir li wa liwalidayya wa lil-mu'mineena yawma yaqoomul-hisab",
    translation: "Our Lord, forgive me and my parents and the believers the Day the account is established.",
    translationUrdu: "اے ہمارے رب! مجھے، میرے والدین اور مومنوں کو اس دن بخش دے جب حساب قائم ہوگا۔",
    reference: "Surah Ibrahim 14:41", source: "quran", benefits: "Dua of Prophet Ibrahim (AS) for his parents and all believers.", verified: true, tags: ["parents", "forgiveness", "judgment-day"]
  },
  // ── KNOWLEDGE ──
  {
    id: 8, title: "Dua for Knowledge", titleUrdu: "علم کی دعا", category: "Knowledge", categoryUrdu: "علم", occasion: "Study / Work",
    arabic: "رَبِّ زِدْنِي عِلْمًا",
    transliteration: "Rabbi zidni 'ilma",
    translation: "My Lord, increase me in knowledge.",
    translationUrdu: "اے میرے رب! میرے علم میں اضافہ فرما۔",
    reference: "Surah Ta-Ha 20:114", source: "quran", benefits: "The only place in the Quran where Allah commanded the Prophet to ask for more of something.", verified: true, tags: ["knowledge", "study", "growth"]
  },
  {
    id: 9, title: "Dua for Beneficial Knowledge", titleUrdu: "نافع علم کی دعا", category: "Knowledge", categoryUrdu: "علم", occasion: "Morning",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا",
    transliteration: "Allahumma inni as'aluka 'ilman nafi'an wa rizqan tayyiban wa 'amalan mutaqabbalan",
    translation: "O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds.",
    translationUrdu: "اے اللہ! میں تجھ سے نفع بخش علم، پاکیزہ رزق اور مقبول عمل مانگتا ہوں۔",
    reference: "Ibn Majah 925", source: "ibnemajah", benefits: "Recite after Fajr prayer every morning.", verified: true, tags: ["knowledge", "rizq", "morning", "deeds"]
  },
  // ── HEALTH ──
  {
    id: 10, title: "Dua for Healing", titleUrdu: "شفاء کی دعا", category: "Health", categoryUrdu: "صحت", occasion: "Illness",
    arabic: "أَذْهِبِ الْبَأْسَ رَبَّ النَّاسِ وَاشْفِ أَنْتَ الشَّافِي لَا شِفَاءَ إِلَّا شِفَاؤُكَ شِفَاءً لَا يُغَادِرُ سَقَمًا",
    transliteration: "Adhhibil-ba'sa Rabban-nas, washfi antash-Shafi, la shifa'a illa shifa'uka, shifa'an la yughadiru saqama",
    translation: "Remove the harm, O Lord of mankind, and heal — You are the Healer. There is no healing except Your healing, a healing that leaves no disease.",
    translationUrdu: "اے لوگوں کے رب! تکلیف دور فرما، شفا دے — تو ہی شفا دینے والا ہے، تیری شفا کے سوا کوئی شفا نہیں، ایسی شفا دے جو کوئی بیماری نہ چھوڑے۔",
    reference: "Sahih al-Bukhari 5743", source: "bukhari", benefits: "Prophet (ﷺ) recited this while passing his right hand over the sick.", verified: true, tags: ["healing", "illness", "sick"]
  },
  {
    id: 11, title: "Dua for the Sick (7 times)", titleUrdu: "بیمار کے لیے دعا", category: "Health", categoryUrdu: "صحت", occasion: "Illness",
    arabic: "أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ",
    transliteration: "As'alullaha-l-'azeema rabbal-'arshil-'azeemi an yashfiyaka",
    translation: "I ask Allah the Mighty, the Lord of the great Throne, to cure you.",
    translationUrdu: "میں دعا کرتا ہوں اللہ عظیم سے، عرش عظیم کے رب سے کہ وہ تمہیں شفا دے۔",
    reference: "Abu Dawud 3106", source: "abudawud", benefits: "Recite 7 times over the sick person — if not their appointed time, they will recover.", verified: true, tags: ["healing", "illness", "visiting-sick"]
  },
  // ── PROTECTION ──
  {
    id: 12, title: "Dua for Comprehensive Good", titleUrdu: "دنیا و آخرت کی بھلائی", category: "Protection", categoryUrdu: "حفاظت", occasion: "General",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
    translation: "Our Lord, give us in this world good and in the Hereafter good and protect us from the punishment of the Fire.",
    translationUrdu: "اے ہمارے رب! ہمیں دنیا میں بھلائی دے اور آخرت میں بھلائی دے اور جہنم کے عذاب سے بچا۔",
    reference: "Surah Al-Baqarah 2:201", source: "quran", benefits: "Most comprehensive dua — covers this life, next life, and protection from punishment.", verified: true, tags: ["dunya", "akhirah", "protection", "hellfire"]
  },
  {
    id: 13, title: "Ayat al-Kursi Protection", titleUrdu: "آیۃ الکرسی", category: "Protection", categoryUrdu: "حفاظت", occasion: "Morning & Evening",
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ",
    transliteration: "Allahu la ilaha illa huwal-hayyul-qayyum, la ta'khudhuhu sinatun wa la nawm, lahu ma fis-samawati wa ma fil-ardh",
    translation: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth.",
    translationUrdu: "اللہ — اس کے سوا کوئی معبود نہیں، وہ ہمیشہ زندہ اور قائم رکھنے والا ہے۔ نہ اسے اونگھ آتی ہے نہ نیند، جو کچھ آسمانوں میں اور زمین میں ہے سب اسی کا ہے۔",
    reference: "Surah Al-Baqarah 2:255", source: "quran", benefits: "Whoever recites after every prayer — nothing prevents them from entering Paradise except death.", verified: true, tags: ["protection", "morning", "evening", "after-prayer"]
  },
  {
    id: 14, title: "Dua from Shaytan (Evil Eye)", titleUrdu: "شیطان اور نظر بد سے حفاظت", category: "Protection", categoryUrdu: "حفاظت", occasion: "General",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    transliteration: "A'oodhu bikalimatil-lahit-tammati min sharri ma khalaq",
    translation: "I seek refuge in the perfect words of Allah from the evil of what He created.",
    translationUrdu: "میں اللہ کے کامل کلمات کی پناہ میں آتا ہوں ہر چیز کی برائی سے جو اس نے پیدا کی۔",
    reference: "Sahih Muslim 2708", source: "muslim", benefits: "Recite 3x in evening — nothing will harm you that night.", verified: true, tags: ["protection", "evil-eye", "shaytan", "evening"]
  },
  {
    id: 15, title: "Dua for Protection (Morning 3x)", titleUrdu: "صبح کی حفاظت کی دعا", category: "Protection", categoryUrdu: "حفاظت", occasion: "Morning",
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    transliteration: "Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardhi wa la fis-sama'i wa huwas-sami'ul-'alim",
    translation: "In the name of Allah — with whose name nothing can cause harm on earth or in heaven — and He is the All-Hearing, All-Knowing.",
    translationUrdu: "اللہ کے نام سے — جس کے نام کے ساتھ زمین و آسمان میں کوئی چیز نقصان نہیں دے سکتی — اور وہ سننے والا، جاننے والا ہے۔",
    reference: "Abu Dawud 5088", source: "abudawud", benefits: "Recite 3x morning and evening — protected from sudden affliction.", verified: true, tags: ["protection", "morning", "evening", "bismillah"]
  },
  // ── MORNING & EVENING ──
  {
    id: 16, title: "Morning Dhikr — Complete", titleUrdu: "مکمل صبح کا ذکر", category: "Morning & Evening", categoryUrdu: "صبح و شام", occasion: "Morning",
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "Asbahna wa asbahal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la sharika lahu, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadeer",
    translation: "We have entered the morning and all dominion belongs to Allah. All praise is for Allah. There is no god but Allah alone, without partner. To Him belongs sovereignty and praise, and He is over all things competent.",
    translationUrdu: "ہم نے صبح کی اور بادشاہی اللہ کے لیے ہے، سب تعریف اللہ کو، اللہ کے سوا کوئی معبود نہیں، وہ اکیلا شریک سے پاک ہے، اسی کی بادشاہی اور حمد ہے، وہ ہر چیز پر قادر ہے۔",
    reference: "Sahih Muslim 2723", source: "muslim", benefits: "Opens the day with complete reliance on Allah.", verified: true, tags: ["morning", "dhikr", "praise"]
  },
  {
    id: 17, title: "Evening Dhikr — Complete", titleUrdu: "مکمل شام کا ذکر", category: "Morning & Evening", categoryUrdu: "صبح و شام", occasion: "Evening",
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "Amsaina wa amsal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la sharika lahu, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadeer",
    translation: "We have entered the evening and all dominion belongs to Allah. All praise is for Allah. There is no god but Allah alone, without partner. To Him belongs sovereignty and praise, and He is over all things competent.",
    translationUrdu: "ہم نے شام کی اور بادشاہی اللہ کے لیے ہے، سب تعریف اللہ کو، اللہ کے سوا کوئی معبود نہیں، وہ اکیلا شریک سے پاک ہے، اسی کی بادشاہی اور حمد ہے، وہ ہر چیز پر قادر ہے۔",
    reference: "Sahih Muslim 2723", source: "muslim", benefits: "Closes the day with gratitude and surrender to Allah.", verified: true, tags: ["evening", "dhikr", "praise"]
  },
  // ── TRAVEL ──
  {
    id: 18, title: "Dua for Boarding a Vehicle", titleUrdu: "سواری پر چڑھنے کی دعا", category: "Travel", categoryUrdu: "سفر", occasion: "Travel",
    arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ",
    transliteration: "Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrineen, wa inna ila rabbina lamunqaliboon",
    translation: "Glory be to Him who has subjected this to us, and we could never have done it by ourselves. And indeed, to our Lord we will return.",
    translationUrdu: "پاک ہے وہ جس نے اسے ہمارے تابع کر دیا، ہم اسے قابو میں نہ لا سکتے تھے، اور ہم اپنے رب کی طرف لوٹنے والے ہیں۔",
    reference: "Surah Az-Zukhruf 43:13-14", source: "quran", benefits: "Recite when boarding any vehicle — car, plane, ship, etc.", verified: true, tags: ["travel", "vehicle", "journey"]
  },
  {
    id: 19, title: "Dua for Leaving Home", titleUrdu: "گھر سے نکلتے وقت کی دعا", category: "Daily Routine", categoryUrdu: "روزمرہ", occasion: "Daily",
    arabic: "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    transliteration: "Bismillah, tawakkaltu 'alallah, la hawla wa la quwwata illa billah",
    translation: "In the name of Allah, I put my trust in Allah, there is no power and no might except with Allah.",
    translationUrdu: "اللہ کے نام سے، میں نے اللہ پر بھروسہ کیا، اللہ کے سوا کوئی طاقت اور قوت نہیں۔",
    reference: "Abu Dawud 5095", source: "abudawud", benefits: "An angel says 'you are guided, defended, and protected' to whoever recites this.", verified: true, tags: ["daily", "morning", "travel", "tawakkul"]
  },
  {
    id: 20, title: "Dua for Entering Home", titleUrdu: "گھر میں داخل ہونے کی دعا", category: "Daily Routine", categoryUrdu: "روزمرہ", occasion: "Daily",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلَجِ وَخَيْرَ الْمَخْرَجِ بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
    transliteration: "Allahumma inni as'aluka khayral-mawlaji wa khayral-makhraji, bismillahi walajna, wa bismillahi kharajna, wa 'alallahi rabbina tawakkalna",
    translation: "O Allah, I ask You for the best of entrance and the best of exit. In the name of Allah we enter, in the name of Allah we leave, and upon our Lord we place our trust.",
    translationUrdu: "اے اللہ! میں داخل ہونے اور نکلنے کی بھلائی مانگتا ہوں۔ اللہ کے نام سے داخل ہوئے، اللہ کے نام سے نکلے، اپنے رب پر توکل کیا۔",
    reference: "Abu Dawud 5096", source: "abudawud", benefits: "Brings blessings and peace into the home.", verified: true, tags: ["home", "daily", "blessing"]
  },
  // ── PRAYER ──
  {
    id: 21, title: "Dua for Entering Masjid", titleUrdu: "مسجد میں داخلے کی دعا", category: "Prayer", categoryUrdu: "نماز", occasion: "Prayer",
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    transliteration: "Allahummaftah li abwaba rahmatik",
    translation: "O Allah, open for me the doors of Your mercy.",
    translationUrdu: "اے اللہ! میرے لیے اپنی رحمت کے دروازے کھول دے۔",
    reference: "Sahih Muslim 713", source: "muslim", benefits: "Invites Allah's mercy upon entering the mosque.", verified: true, tags: ["masjid", "mosque", "prayer", "mercy"]
  },
  {
    id: 22, title: "Dua After Adhan", titleUrdu: "اذان کے بعد کی دعا", category: "Prayer", categoryUrdu: "نماز", occasion: "Prayer",
    arabic: "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ",
    transliteration: "Allahumma rabba hadhihid-da'watit-tammah, was-salatil-qa'imah, ati Muhammadanil-wasilata wal-fadheelah, wab'ath-hu maqamam-mahmoodanil-ladhi wa'adtah",
    translation: "O Allah, Lord of this perfect call and established prayer, grant Muhammad the intercession and excellence, and raise him to the praised station You have promised him.",
    translationUrdu: "اے اللہ! اس کامل پکار اور قائم ہونے والی نماز کے رب! محمد ﷺ کو وسیلہ اور فضیلت عطا فرما اور انہیں مقام محمود پر فائز فرما جس کا وعدہ کیا۔",
    reference: "Sahih al-Bukhari 614", source: "bukhari", benefits: "Prophet's intercession is guaranteed for whoever recites this after adhan.", verified: true, tags: ["adhan", "prayer", "prophet", "intercession"]
  },
  // ── FAMILY ──
  {
    id: 23, title: "Dua for Righteous Spouse & Children", titleUrdu: "اولاد اور جیون ساتھی کی دعا", category: "Family", categoryUrdu: "خاندان", occasion: "General",
    arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
    transliteration: "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yunin waj'alna lil-muttaqeena imama",
    translation: "Our Lord, grant us from among our spouses and offspring comfort to our eyes and make us an example for the righteous.",
    translationUrdu: "اے ہمارے رب! ہمیں ہماری بیویوں اور اولاد سے آنکھوں کی ٹھنڈک عطا فرما اور ہمیں پرہیزگاروں کا امام بنا۔",
    reference: "Surah Al-Furqan 25:74", source: "quran", benefits: "Beautiful dua for a blessed, God-fearing family life.", verified: true, tags: ["family", "children", "spouse", "marriage"]
  },
  {
    id: 24, title: "Dua for Pious Children", titleUrdu: "نیک اولاد کی دعا", category: "Family", categoryUrdu: "خاندان", occasion: "General",
    arabic: "رَبِّ هَبْ لِي مِن لَّدُنكَ ذُرِّيَّةً طَيِّبَةً ۖ إِنَّكَ سَمِيعُ الدُّعَاءِ",
    transliteration: "Rabbi hab li min ladunka dhurriyyatan tayyibatan innaka sami'ud-du'a",
    translation: "My Lord, grant me from Yourself a good offspring. Indeed, You are the Hearer of supplication.",
    translationUrdu: "اے میرے رب! مجھے اپنی طرف سے پاکیزہ اولاد عطا فرما، بے شک تو دعائیں سننے والا ہے۔",
    reference: "Surah Aal-Imran 3:38", source: "quran", benefits: "Dua of Prophet Zakariyya (AS) — answered with Prophet Yahya (AS).", verified: true, tags: ["children", "family", "offspring"]
  },
  // ── GUIDANCE ──
  {
    id: 25, title: "Dua al-Istikharah", titleUrdu: "استخارے کی دعا", category: "Guidance", categoryUrdu: "ہدایت", occasion: "Decision Making",
    arabic: "اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ وَتَعْلَمُ وَلَا أَعْلَمُ وَأَنْتَ عَلَّامُ الْغُيُوبِ",
    transliteration: "Allahumma inni astakheeruka bi'ilmika wa astaqdiruka biqudratika, wa as'aluka min fadlikal-'azeem, fa innaka taqdiru wa la aqdiru, wa ta'lamu wa la a'lamu, wa anta 'allamul-ghuyoob",
    translation: "O Allah, I seek Your guidance by Your knowledge, and I seek Your ability by Your power, and I ask You of Your great bounty. For You are able while I am not, and You know while I do not, and You are the Knower of the unseen.",
    translationUrdu: "اے اللہ! میں تیرے علم سے بھلائی مانگتا ہوں، تیری قدرت سے طاقت مانگتا ہوں، اور تیرا عظیم فضل مانگتا ہوں۔ تو قادر ہے اور میں نہیں، تو جانتا ہے اور میں نہیں، اور تو غیب کا جاننے والا ہے۔",
    reference: "Sahih al-Bukhari 1162", source: "bukhari", benefits: "Pray 2 rakats and recite before making any important decision.", verified: true, tags: ["guidance", "decision", "istikharah"]
  },
  {
    id: 26, title: "Dua for Guidance (Sirat al-Mustaqim)", titleUrdu: "صراط مستقیم کی دعا", category: "Guidance", categoryUrdu: "ہدایت", occasion: "Prayer",
    arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
    transliteration: "Ihdinas-siratal-mustaqeem, sirathal-ladhina an'amta 'alayhim, ghayril-maghdoobi 'alayhim wa lad-dalleen",
    translation: "Guide us to the straight path — the path of those upon whom You have bestowed favor, not of those who have evoked anger or those who are astray.",
    translationUrdu: "ہمیں سیدھا راستہ دکھا — ان لوگوں کا راستہ جن پر تو نے انعام کیا، نہ ان کا جن پر غضب ہوا اور نہ گمراہوں کا۔",
    reference: "Surah Al-Fatiha 1:6-7", source: "quran", benefits: "Recited 17+ times daily in prayer — the most repeated dua in Islam.", verified: true, tags: ["guidance", "prayer", "fatiha", "daily"]
  },
  // ── FINANCIAL ──
  {
    id: 27, title: "Dua for Rizq (Provision)", titleUrdu: "رزق کی دعا", category: "Financial", categoryUrdu: "مالی", occasion: "General",
    arabic: "اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ",
    transliteration: "Allahummakfini bihalalika 'an haramika, wa aghnini bifadlika 'amman siwak",
    translation: "O Allah, suffice me with what is lawful against what is unlawful, and enrich me by Your bounty so I have no need of anyone besides You.",
    translationUrdu: "اے اللہ! مجھے حلال سے کفایت دے تاکہ حرام سے بچوں، اپنے فضل سے غنی کر تاکہ تیرے سوا کسی کا محتاج نہ رہوں۔",
    reference: "Jami at-Tirmidhi 3563", source: "tirmidhi", benefits: "Protection from debt and reliance on halal income.", verified: true, tags: ["rizq", "halal", "financial", "wealth"]
  },
  {
    id: 28, title: "Dua for Debt Relief", titleUrdu: "قرض سے نجات کی دعا", category: "Financial", categoryUrdu: "مالی", occasion: "Difficulty",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ",
    transliteration: "Allahumma inni a'oodhu bika minal-hammi wal-hazani, wa a'oodhu bika minal-'ajzi wal-kasali, wa a'oodhu bika minal-jubni wal-bukhli, wa a'oodhu bika min ghalabatid-dayni wa qahrir-rijal",
    translation: "O Allah, I seek refuge in You from worry and grief, weakness and laziness, cowardice and miserliness, and from being overpowered by debt and dominated by men.",
    translationUrdu: "اے اللہ! میں پناہ مانگتا ہوں غم و فکر سے، عاجزی و سستی سے، بزدلی و کنجوسی سے، قرض کے غلبے اور لوگوں کے تسلط سے۔",
    reference: "Sahih al-Bukhari 2893", source: "bukhari", benefits: "Specifically addresses debt and financial oppression.", verified: true, tags: ["debt", "financial", "anxiety"]
  },
  // ── SLEEP ──
  {
    id: 29, title: "Dua Before Sleeping", titleUrdu: "سونے سے پہلے کی دعا", category: "Sleep", categoryUrdu: "نیند", occasion: "Night",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allahumma amootu wa ahya",
    translation: "In Your name, O Allah, I die and I live.",
    translationUrdu: "اے اللہ! تیرے نام کے ساتھ مرتا ہوں اور جیتا ہوں۔",
    reference: "Sahih al-Bukhari 6324", source: "bukhari", benefits: "Sleep is like a small death — surrendering to Allah before rest.", verified: true, tags: ["sleep", "night", "evening"]
  },
  {
    id: 30, title: "Dua Upon Waking", titleUrdu: "بیدار ہونے کی دعا", category: "Sleep", categoryUrdu: "نیند", occasion: "Morning",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    transliteration: "Alhamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushoor",
    translation: "All praise is for Allah who gave us life after causing us to die, and to Him is the resurrection.",
    translationUrdu: "ہر طرح کی تعریف اس اللہ کے لیے جس نے مارنے کے بعد زندہ کیا اور اسی کی طرف اٹھنا ہے۔",
    reference: "Sahih al-Bukhari 6324", source: "bukhari", benefits: "First words in the morning — gratitude for another day of life.", verified: true, tags: ["morning", "waking", "gratitude"]
  },
  // ── FOOD ──
  {
    id: 31, title: "Dua Before Eating", titleUrdu: "کھانے سے پہلے کی دعا", category: "Food & Drink", categoryUrdu: "کھانا", occasion: "Daily",
    arabic: "اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ بِسْمِ اللَّهِ",
    transliteration: "Allahumma barik lana fima razaqtana waqina 'adhaban-nar, Bismillah",
    translation: "O Allah, bless us in what You have provided and protect us from the punishment of the Fire. In the name of Allah.",
    translationUrdu: "اے اللہ! تو نے جو دیا ہے اس میں برکت دے اور جہنم کے عذاب سے بچا۔ اللہ کے نام سے۔",
    reference: "Hisn al-Muslim", source: "hisn", benefits: "Brings Allah's blessing into the food.", verified: true, tags: ["food", "eating", "daily", "blessing"]
  },
  {
    id: 32, title: "Dua After Eating", titleUrdu: "کھانے کے بعد کی دعا", category: "Food & Drink", categoryUrdu: "کھانا", occasion: "Daily",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",
    transliteration: "Alhamdu lillahil-ladhi at'amana wa saqana wa ja'alana muslimeen",
    translation: "All praise is for Allah who fed us, gave us drink, and made us Muslims.",
    translationUrdu: "ہر طرح کی تعریف اس اللہ کے لیے جس نے کھلایا، پلایا اور مسلمان بنایا۔",
    reference: "Abu Dawud 3850", source: "abudawud", benefits: "Gratitude for sustenance and the blessing of Islam.", verified: true, tags: ["food", "eating", "gratitude", "daily"]
  },
  // ── PATIENCE ──
  {
    id: 33, title: "Dua for Patience in Trial", titleUrdu: "آزمائش میں صبر کی دعا", category: "Patience", categoryUrdu: "صبر", occasion: "Difficulty",
    arabic: "رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
    transliteration: "Rabbana afrigh 'alayna sabran wa thabbit aqdamana wansurna 'alal-qawmil-kafirin",
    translation: "Our Lord, pour upon us patience and plant firmly our feet and give us victory over the disbelieving people.",
    translationUrdu: "اے ہمارے رب! ہم پر صبر انڈیل دے، ہمارے قدم جما دے اور کافروں کے خلاف ہماری مدد فرما۔",
    reference: "Surah Al-Baqarah 2:250", source: "quran", benefits: "Dua of those who faced Jalut (Goliath) — for steadfastness in hardship.", verified: true, tags: ["patience", "trial", "steadfastness", "difficulty"]
  },
  {
    id: 34, title: "Inna Lillahi (Calamity)", titleUrdu: "مصیبت کی دعا", category: "Patience", categoryUrdu: "صبر", occasion: "Loss / Grief",
    arabic: "إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي وَأَخْلِفْ لِي خَيْرًا مِنْهَا",
    transliteration: "Inna lillahi wa inna ilayhi raji'oon. Allahumma jurni fi musibati wa akhlif li khayran minha",
    translation: "Indeed we belong to Allah and to Him we shall return. O Allah, reward me in my calamity and replace it with something better.",
    translationUrdu: "بے شک ہم اللہ کے لیے ہیں اور اسی کی طرف لوٹنا ہے۔ اے اللہ! مجھے میری مصیبت میں اجر دے اور اس سے بہتر عطا فرما۔",
    reference: "Sahih Muslim 918", source: "muslim", benefits: "Upon calamity — Umm Salamah was given the Prophet (ﷺ) as replacement after reciting this.", verified: true, tags: ["loss", "grief", "calamity", "patience", "inna lillahi"]
  },
  // ── RAMADAN SPECIALS ──
  {
    id: 35, title: "Dua for Laylat al-Qadr", titleUrdu: "لیلۃ القدر کی دعا", category: "Ramadan & Special Nights", categoryUrdu: "رمضان", occasion: "Ramadan",
    arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
    transliteration: "Allahumma innaka 'afuwwun tuhibbul-'afwa fa'fu 'anni",
    translation: "O Allah, You are All-Pardoning and You love to pardon, so pardon me.",
    translationUrdu: "اے اللہ! تو معاف کرنے والا ہے اور معافی کو پسند کرتا ہے، پس مجھے معاف فرما دے۔",
    reference: "Jami at-Tirmidhi 3513", source: "tirmidhi", benefits: "The Prophet (ﷺ) personally taught this dua for Laylat al-Qadr to Aisha (RA).", verified: true, tags: ["ramadan", "laylatul-qadr", "forgiveness", "special-nights"]
  },
  {
    id: 36, title: "Dua for Breaking Fast (Iftar)", titleUrdu: "افطار کی دعا", category: "Ramadan & Special Nights", categoryUrdu: "رمضان", occasion: "Ramadan",
    arabic: "اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ",
    transliteration: "Allahumma laka sumtu wa 'ala rizqika aftartu",
    translation: "O Allah, I fasted for You and I break my fast upon Your provision.",
    translationUrdu: "اے اللہ! میں نے تیرے لیے روزہ رکھا اور تیرے ہی رزق پر افطار کیا۔",
    reference: "Abu Dawud 2358", source: "abudawud", benefits: "Recite when breaking the fast at Maghrib.", verified: true, tags: ["ramadan", "fasting", "iftar", "daily"]
  },
  {
    id: 37, title: "Dua for Seeing New Moon", titleUrdu: "نئے چاند کی دعا", category: "Ramadan & Special Nights", categoryUrdu: "رمضان", occasion: "Islamic Months",
    arabic: "اللَّهُ أَكْبَرُ اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْأَمْنِ وَالْإِيمَانِ وَالسَّلَامَةِ وَالْإِسْلَامِ رَبِّي وَرَبُّكَ اللَّهُ",
    transliteration: "Allahu akbar. Allahumma ahillahu 'alayna bil-amni wal-imani was-salamati wal-islam. rabbi wa rabbukallah",
    translation: "Allah is the Greatest. O Allah, bring it (the crescent) upon us with security, faith, safety, and Islam. My Lord and your Lord is Allah.",
    translationUrdu: "اللہ اکبر۔ اے اللہ! اسے ہم پر امن، ایمان، سلامتی اور اسلام کے ساتھ طلوع فرما۔ میرا اور تیرا رب اللہ ہے۔",
    reference: "Jami at-Tirmidhi 3451", source: "tirmidhi", benefits: "Recite upon seeing the new crescent moon.", verified: true, tags: ["moon", "ramadan", "islamic-months", "crescent"]
  },
  // ── HAJI & SPECIAL ──
  {
    id: 38, title: "Dua of Arafah", titleUrdu: "عرفات کی دعا", category: "Hajj & Umrah", categoryUrdu: "حج", occasion: "Hajj / Dhul Hijjah",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "La ilaha illallahu wahdahu la sharika lahu, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadeer",
    translation: "There is no deity except Allah alone, without partner. To Him belongs sovereignty and praise, and He is over all things competent.",
    translationUrdu: "اللہ کے سوا کوئی معبود نہیں، وہ اکیلا ہے، اس کا کوئی شریک نہیں، اسی کی بادشاہی اور حمد ہے اور وہ ہر چیز پر قادر ہے۔",
    reference: "Jami at-Tirmidhi 3585", source: "tirmidhi", benefits: "Best dua on the Day of Arafah — most virtuous day for dua.", verified: true, tags: ["hajj", "arafah", "dhulhijjah", "tawheed"]
  },
  {
    id: 39, title: "Dua at Zamzam Well", titleUrdu: "زمزم پیتے وقت کی دعا", category: "Hajj & Umrah", categoryUrdu: "حج", occasion: "Hajj / Umrah",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ",
    transliteration: "Allahumma inni as'aluka 'ilman nafi'an wa rizqan wasi'an wa shifa'an min kulli da'",
    translation: "O Allah, I ask You for beneficial knowledge, wide provision, and healing from every disease.",
    translationUrdu: "اے اللہ! میں نفع بخش علم، وسیع رزق اور ہر بیماری سے شفا مانگتا ہوں۔",
    reference: "Al-Hakim 1/473", source: "ahmad", benefits: "Zamzam is for whatever it is drunk for — pair with this powerful dua.", verified: true, tags: ["hajj", "umrah", "zamzam", "knowledge", "healing"]
  },
  // ── PRAISE ──
  {
    id: 40, title: "Dua of Gratitude", titleUrdu: "شکر کی دعا", category: "Gratitude", categoryUrdu: "شکر", occasion: "General",
    arabic: "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ وَأَدْخِلْنِي بِرَحْمَتِكَ فِي عِبَادِكَ الصَّالِحِينَ",
    transliteration: "Rabbi awzi'ni an ashkura ni'matakal-lati an'amta 'alayya wa 'ala walidayya wa an a'mala salihan tardahu wa adkhilni birahmatika fi 'ibadikasaliheen",
    translation: "My Lord, enable me to be grateful for Your favor which You have bestowed upon me and upon my parents and to do righteousness of which You approve, and admit me by Your mercy among Your righteous servants.",
    translationUrdu: "اے میرے رب! مجھے توفیق دے کہ میں تیری اس نعمت کا شکر ادا کروں جو تو نے مجھ پر اور میرے والدین پر کی ہے، اور وہ نیک عمل کروں جس سے تو راضی ہو، اور مجھے اپنی رحمت سے اپنے نیک بندوں میں داخل فرما۔",
    reference: "Surah An-Naml 27:19", source: "quran", benefits: "Comprehensive dua for gratitude, good deeds, and entry among the righteous.", verified: true, tags: ["gratitude", "shukr", "parents", "righteous"]
  },
  {
    id: 41, title: "Dua of Prophet Ibrahim (AS)", titleUrdu: "ابراہیمؑ کی دعا", category: "Gratitude", categoryUrdu: "شکر", occasion: "General",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي وَهَبَ لِي عَلَى الْكِبَرِ إِسْمَاعِيلَ وَإِسْحَاقَ إِنَّ رَبِّي لَسَمِيعُ الدُّعَاءِ",
    transliteration: "Alhamdu lillahil-ladhi wahaba li 'alal-kibari Isma'eela wa Ishaq, inna rabbi lasamee'ud-du'a",
    translation: "Praise be to Allah who has granted me, despite my old age, Ismail and Ishaq. My Lord is the Hearer of supplication.",
    translationUrdu: "شکر ہے اس اللہ کا جس نے مجھے بڑھاپے میں اسماعیل اور اسحاق عطا فرمائے۔ بے شک میرا رب دعائیں سننے والا ہے۔",
    reference: "Surah Ibrahim 14:39", source: "quran", benefits: "A reminder that Allah answers dua at any age — never lose hope.", verified: true, tags: ["gratitude", "hope", "ibrahim", "children"]
  },
  // ── TAWAKKUL ──
  {
    id: 42, title: "Dua of Tawakkul (Trust in Allah)", titleUrdu: "توکل کی دعا", category: "Trust in Allah", categoryUrdu: "توکل", occasion: "General",
    arabic: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
    transliteration: "Hasbiyallahu la ilaha illa huwa 'alayhi tawakkaltu wa huwa rabbul-'arshil-'azeem",
    translation: "Allah is sufficient for me. There is no deity except Him. Upon Him I have relied, and He is the Lord of the great Throne.",
    translationUrdu: "اللہ مجھے کافی ہے، اس کے سوا کوئی معبود نہیں، اسی پر میں نے بھروسہ کیا اور وہ عرش عظیم کا رب ہے۔",
    reference: "Surah At-Tawbah 9:129", source: "quran", benefits: "Whoever recites this 7x morning and evening, Allah will suffice them.", verified: true, tags: ["tawakkul", "trust", "reliance", "morning", "evening"]
  },
  // ── DAILY ROUTINE ──
  {
    id: 43, title: "Dua for Wearing New Clothes", titleUrdu: "نئے کپڑے پہننے کی دعا", category: "Daily Routine", categoryUrdu: "روزمرہ", occasion: "Daily",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي كَسَانِي هَٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
    transliteration: "Alhamdu lillahil-ladhi kasani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah",
    translation: "All praise is for Allah who clothed me with this and provided it to me without any might or power from myself.",
    translationUrdu: "ہر طرح کی تعریف اس اللہ کے لیے جس نے مجھے یہ پہنایا اور بغیر کسی طاقت کے عطا کیا۔",
    reference: "Abu Dawud 4023", source: "abudawud", benefits: "Gratitude for clothing is a form of worship.", verified: true, tags: ["daily", "clothes", "gratitude"]
  },
  {
    id: 44, title: "Dua When Looking in Mirror", titleUrdu: "آئینے میں دیکھنے کی دعا", category: "Daily Routine", categoryUrdu: "روزمرہ", occasion: "Daily",
    arabic: "اللَّهُمَّ أَنْتَ حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي",
    transliteration: "Allahumma anta hassanta khalqi fahassin khuluqi",
    translation: "O Allah, just as You have made my appearance beautiful, make my character beautiful too.",
    translationUrdu: "اے اللہ! جیسا تو نے میری صورت خوبصورت بنائی ویسے ہی میرے اخلاق بھی خوبصورت بنا دے۔",
    reference: "Musnad Ahmad 3/104", source: "ahmad", benefits: "A reminder that inner character matters more than outward appearance.", verified: true, tags: ["daily", "character", "akhlaq", "beauty"]
  },
  {
    id: 45, title: "Dua for Entering Toilet", titleUrdu: "بیت الخلاء میں داخلے کی دعا", category: "Daily Routine", categoryUrdu: "روزمرہ", occasion: "Daily",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ",
    transliteration: "Allahumma inni a'oodhu bika minal-khubuthi wal-khaba'ith",
    translation: "O Allah, I seek refuge in You from male and female evil spirits.",
    translationUrdu: "اے اللہ! میں نر اور مادہ شیطانوں سے تیری پناہ مانگتا ہوں۔",
    reference: "Sahih al-Bukhari 6322", source: "bukhari", benefits: "Recite before entering — protection in a place where evil gathers.", verified: true, tags: ["daily", "toilet", "protection", "bathroom"]
  },
  // ── SPECIAL OCCASIONS ──
  {
    id: 46, title: "Dua on Day of Jumu'ah (Friday)", titleUrdu: "جمعے کے دن کی دعا", category: "Friday & Special Days", categoryUrdu: "جمعہ", occasion: "Friday",
    arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
    transliteration: "Allahumma salli 'ala Muhammadin wa 'ala ali Muhammadin kama sallayta 'ala Ibrahima wa 'ala ali Ibrahima innaka hameedun majeed",
    translation: "O Allah, send blessings upon Muhammad and the family of Muhammad, as You sent blessings upon Ibrahim and the family of Ibrahim. Indeed, You are Praiseworthy, Most Glorious.",
    translationUrdu: "اے اللہ! محمد اور آل محمد پر رحمت نازل فرما جیسے تو نے ابراہیم اور آل ابراہیم پر رحمت نازل فرمائی، بے شک تو تعریف والا، بزرگی والا ہے۔",
    reference: "Sahih al-Bukhari 3370", source: "bukhari", benefits: "Increases in reward on Fridays — special day for salawat on the Prophet.", verified: true, tags: ["friday", "salawat", "prophet", "juma"]
  },
  {
    id: 47, title: "Dua for Eid Day", titleUrdu: "عید کے دن کی دعا", category: "Friday & Special Days", categoryUrdu: "جمعہ", occasion: "Eid",
    arabic: "تَقَبَّلَ اللَّهُ مِنَّا وَمِنكُمْ",
    transliteration: "Taqabbalallahu minna wa minkum",
    translation: "May Allah accept (good deeds) from us and from you.",
    translationUrdu: "اللہ ہم سے اور تم سے قبول فرمائے۔",
    reference: "Fath al-Bari 2/446", source: "bukhari", benefits: "The Companions would greet each other with this on Eid.", verified: true, tags: ["eid", "special", "greeting", "acceptance"]
  },
  // ── ADVANCED ──
  {
    id: 48, title: "Dua for Good Character", titleUrdu: "اچھے اخلاق کی دعا", category: "Character & Manners", categoryUrdu: "اخلاق", occasion: "General",
    arabic: "اللَّهُمَّ اهْدِنِي لِأَحْسَنِ الْأَخْلَاقِ لَا يَهْدِي لِأَحْسَنِهَا إِلَّا أَنْتَ وَاصْرِفْ عَنِّي سَيِّئَهَا لَا يَصْرِفُ عَنِّي سَيِّئَهَا إِلَّا أَنْتَ",
    transliteration: "Allahumma ihdini li-ahsanil-akhlaqi la yahdi li-ahsaniha illa anta, wasrif 'anni sayyi'aha la yasrifu 'anni sayyi'aha illa ant",
    translation: "O Allah, guide me to the best of character — no one can guide to the best of it except You — and protect me from the worst of it, for no one can protect from the worst of it except You.",
    translationUrdu: "اے اللہ! مجھے بہترین اخلاق کی طرف رہنمائی فرما — اس کی طرف تیرے سوا کوئی نہیں رہنما بنا سکتا — اور مجھے برے اخلاق سے بچا، اس سے تیرے سوا کوئی نہیں بچا سکتا۔",
    reference: "Sahih Muslim 771", source: "muslim", benefits: "Prophet (ﷺ) recited this in his night prayer regularly.", verified: true, tags: ["character", "akhlaq", "manners", "self-improvement"]
  },
  {
    id: 49, title: "Dua for Steadfastness of Heart", titleUrdu: "دل کی ثابت قدمی کی دعا", category: "Iman & Heart", categoryUrdu: "ایمان", occasion: "General",
    arabic: "يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ",
    transliteration: "Ya muqallibul-quloob thabbit qalbi 'ala dinik",
    translation: "O Turner of hearts, make my heart firm upon Your religion.",
    translationUrdu: "اے دلوں کو پھیرنے والے! میرے دل کو اپنے دین پر ثابت رکھ۔",
    reference: "Jami at-Tirmidhi 2140", source: "tirmidhi", benefits: "Prophet (ﷺ) recited this frequently — hearts can change, ask Allah to keep yours firm.", verified: true, tags: ["iman", "heart", "steadfastness", "faith"]
  },
  {
    id: 50, title: "Dua for Sweetness of Iman", titleUrdu: "ایمان کی مٹھاس کی دعا", category: "Iman & Heart", categoryUrdu: "ایمان", occasion: "General",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ إِيمَانًا لَا يَرْتَدُّ وَنَعِيمًا لَا يَنْفَدُ وَمُرَافَقَةَ نَبِيِّكَ مُحَمَّدٍ فِي أَعْلَى جَنَّةِ الْخُلْدِ",
    transliteration: "Allahumma inni as'aluka imanan la yartaddu wa na'iman la yanfadu wa murafiaqata nabiyyika Muhammadin fi a'la jannatil-khuld",
    translation: "O Allah, I ask You for faith that never retreats, blessings that never end, and companionship with Your Prophet Muhammad in the highest eternal gardens.",
    translationUrdu: "اے اللہ! میں تجھ سے وہ ایمان مانگتا ہوں جو پلٹے نہیں، وہ نعمت جو ختم نہ ہو، اور اپنے نبی محمد ﷺ کی ہمسائیگی ہمیشہ والی جنت میں۔",
    reference: "Ahmad 4/364", source: "ahmad", benefits: "Beautiful dua encompassing dunya, akhirah, and closeness to the Prophet (ﷺ).", verified: true, tags: ["iman", "jannah", "prophet", "eternal"]
  },
  // ── SEEKING REFUGE ──
  {
    id: 51, title: "Dua of Musa (AS) for Help", titleUrdu: "حضرت موسیؑ کی مدد کی دعا", category: "Seeking Help", categoryUrdu: "مدد", occasion: "Difficulty",
    arabic: "رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ",
    transliteration: "Rabbi inni lima anzalta ilayya min khayrin faqeer",
    translation: "My Lord, indeed I am in need of whatever good You would send down to me.",
    translationUrdu: "اے میرے رب! جو بھلائی تو میری طرف نازل کرے میں اس کا محتاج ہوں۔",
    reference: "Surah Al-Qasas 28:24", source: "quran", benefits: "Musa (AS) said this with complete humility — Allah responded immediately.", verified: true, tags: ["help", "poverty", "humility", "musa", "need"]
  },
  {
    id: 52, title: "Dua for Sufficiency", titleUrdu: "کفایت کی دعا", category: "Seeking Help", categoryUrdu: "مدد", occasion: "General",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ",
    transliteration: "Allahumma inni as'aluka al-'afiyata fid-dunya wal-akhirah",
    translation: "O Allah, I ask You for well-being in this life and the next.",
    translationUrdu: "اے اللہ! میں دنیا اور آخرت میں عافیت مانگتا ہوں۔",
    reference: "Sunan Ibn Majah 3848", source: "ibnemajah", benefits: "The Prophet said 'No dua asked of Allah is better than asking for al-'afiyah'.", verified: true, tags: ["health", "wellbeing", "afiyah", "dunya", "akhirah"]
  },
  // ── LATE NIGHT ──
  {
    id: 53, title: "Dua for Tahajjud (Night Prayer)", titleUrdu: "تہجد کی دعا", category: "Night Prayer", categoryUrdu: "تہجد", occasion: "Night",
    arabic: "اللَّهُمَّ لَكَ الْحَمْدُ أَنْتَ نُورُ السَّمَوَاتِ وَالْأَرْضِ وَمَنْ فِيهِنَّ وَلَكَ الْحَمْدُ أَنْتَ قَيِّمُ السَّمَوَاتِ وَالْأَرْضِ وَمَنْ فِيهِنَّ",
    transliteration: "Allahumma lakal-hamdu anta nurus-samawati wal-ardhi wa man fihinna, wa lakal-hamdu anta qayyimus-samawati wal-ardhi wa man fihinna",
    translation: "O Allah, to You is all praise — You are the Light of the heavens and earth and whoever is in them. To You is all praise — You are the Sustainer of the heavens and earth and whoever is in them.",
    translationUrdu: "اے اللہ! ہر تعریف تیرے لیے — تو آسمانوں، زمین اور ان میں موجود سب کا نور ہے۔ ہر تعریف تیرے لیے — تو آسمانوں، زمین اور ان میں موجود سب کا قیوم ہے۔",
    reference: "Sahih al-Bukhari 1120", source: "bukhari", benefits: "Prophet (ﷺ) recited this at the beginning of night prayer — acknowledges Allah's majesty.", verified: true, tags: ["tahajjud", "night-prayer", "praise", "night"]
  },
  // ── GENERAL COLLECTION ──
  {
    id: 54, title: "Dua for Entering Paradise", titleUrdu: "جنت کی دعا", category: "Akhirah", categoryUrdu: "آخرت", occasion: "General",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ",
    transliteration: "Allahumma inni as'alukal-jannata wa a'oodhu bika minan-nar",
    translation: "O Allah, I ask You for Paradise and I seek refuge in You from the Fire.",
    translationUrdu: "اے اللہ! میں تجھ سے جنت مانگتا ہوں اور جہنم سے تیری پناہ مانگتا ہوں۔",
    reference: "Abu Dawud 792", source: "abudawud", benefits: "The minimum dua — whoever asks for jannah 3x, jannah says 'O Allah enter him'.", verified: true, tags: ["jannah", "paradise", "fire", "akhirah"]
  },
  {
    id: 55, title: "Dua for Good Death", titleUrdu: "حسن خاتمے کی دعا", category: "Akhirah", categoryUrdu: "آخرت", occasion: "General",
    arabic: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً إِنَّكَ أَنتَ الْوَهَّابُ",
    transliteration: "Rabbana la tuzigh qulubana ba'da idh hadaytana wa hab lana min ladunka rahmatan innaka antal-wahhab",
    translation: "Our Lord, do not let our hearts deviate after You have guided us and grant us from Yourself mercy. Indeed, You are the Bestower.",
    translationUrdu: "اے ہمارے رب! ہمارے دلوں کو ٹیڑھا نہ کر جب تو نے ہمیں ہدایت دی ہے، اور اپنی جانب سے رحمت عطا فرما، بے شک تو بہت عطا کرنے والا ہے۔",
    reference: "Surah Aal-Imran 3:8", source: "quran", benefits: "Ask Allah to keep the heart on guidance until the final breath.", verified: true, tags: ["death", "guidance", "heart", "akhirah"]
  },
  {
    id: 56, title: "Dua for Good Ending (Khatimah)", titleUrdu: "حسن انجام کی دعا", category: "Akhirah", categoryUrdu: "آخرت", occasion: "General",
    arabic: "اللَّهُمَّ اخْتِمْ لَنَا بِالإِسْلامِ وَاخْتِمْ لَنَا بِالإِيمَانِ وَاخْتِمْ لَنَا بِأَحْسَنِ الأَعْمَالِ",
    transliteration: "Allahumma-khtim lana bil-islam, wakh-tim lana bil-iman, wakh-tim lana bi-ahsanil-a'mal",
    translation: "O Allah, seal our lives with Islam, seal our lives with faith, and seal our lives with the best of deeds.",
    translationUrdu: "اے اللہ! ہماری زندگی اسلام پر ختم فرما، ایمان پر ختم فرما، اور بہترین اعمال پر ختم فرما۔",
    reference: "Hisn al-Muslim", source: "hisn", benefits: "One of the most important duas — a good ending is everything.", verified: true, tags: ["khatimah", "ending", "death", "akhirah"]
  },
  {
    id: 57, title: "Dua of Ibrahim (AS) for the City", titleUrdu: "ابراہیمؑ کی مکہ کے لیے دعا", category: "Community & Society", categoryUrdu: "معاشرہ", occasion: "General",
    arabic: "رَبِّ اجْعَلْ هَٰذَا بَلَدًا آمِنًا وَارْزُقْ أَهْلَهُ مِنَ الثَّمَرَاتِ مَنْ آمَنَ مِنْهُم بِاللَّهِ وَالْيَوْمِ الْآخِرِ",
    transliteration: "Rabbij-'al hadha baladan aminan warzuq ahlahu minaththamarati man amana minhum billahi walyawmil-akhir",
    translation: "My Lord, make this a secure land and provide its people with fruits — those who believe in Allah and the Last Day.",
    translationUrdu: "اے میرے رب! اسے امن والا شہر بنا دے اور اس کے رہنے والوں کو — جو اللہ اور آخرت پر ایمان رکھتے ہوں — پھلوں سے رزق عطا فرما۔",
    reference: "Surah Al-Baqarah 2:126", source: "quran", benefits: "Model dua for asking safety and provision for one's community.", verified: true, tags: ["community", "safety", "provision", "ibrahim"]
  },
  {
    id: 58, title: "Dua for Widening the Chest", titleUrdu: "سینہ کھولنے کی دعا", category: "Iman & Heart", categoryUrdu: "ایمان", occasion: "Difficulty",
    arabic: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي يَفْقَهُوا قَوْلِي",
    transliteration: "Rabbish-rah li sadri wa yassir li amri wahlul 'uqdatan min lisani yafqahu qawli",
    translation: "My Lord, expand for me my breast, ease my affair, and untie the knot in my tongue that they may understand my speech.",
    translationUrdu: "اے میرے رب! میرا سینہ کھول دے، میرا کام آسان کر دے، اور میری زبان کی گرہ سلجھا دے تاکہ لوگ میری بات سمجھیں۔",
    reference: "Surah Ta-Ha 20:25-28", source: "quran", benefits: "Dua of Prophet Musa (AS) before facing Pharaoh — for clarity, ease, and communication.", verified: true, tags: ["ease", "clarity", "speech", "difficulty", "musa"]
  },
  {
    id: 59, title: "Dua for Qunoot (Witr)", titleUrdu: "قنوت وتر کی دعا", category: "Night Prayer", categoryUrdu: "تہجد", occasion: "Prayer",
    arabic: "اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ وَعَافِنِي فِيمَنْ عَافَيْتَ وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ وَبَارِكْ لِي فِيمَا أَعْطَيْتَ",
    transliteration: "Allahumma-hdini fiman hadayt, wa 'afini fiman 'afayt, wa tawallani fiman tawallayt, wa barik li fima a'tayt",
    translation: "O Allah, guide me among those You have guided, pardon me among those You have pardoned, take me as an ally among those You have taken as allies, and bless me in what You have given.",
    translationUrdu: "اے اللہ! مجھے ان میں شامل کر جنہیں تو نے ہدایت دی، عافیت دے ان میں جنہیں تو نے عافیت دی، میری سرپرستی ان میں سے فرما جن کی تو نے فرمائی، اور جو کچھ تو نے دیا ہے اس میں برکت دے۔",
    reference: "Abu Dawud 1425", source: "abudawud", benefits: "Taught by the Prophet (ﷺ) to Hasan ibn Ali for Witr prayer.", verified: true, tags: ["witr", "qunoot", "night-prayer", "guidance"]
  },
  {
    id: 60, title: "Dua for the Deceased", titleUrdu: "مرحوم کے لیے دعا", category: "Death & Afterlife", categoryUrdu: "موت", occasion: "Funeral",
    arabic: "اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ وَأَكْرِمْ نُزُلَهُ وَوَسِّعْ مُدْخَلَهُ وَاغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ",
    transliteration: "Allahummagh-fir lahu warhamhu wa 'afihi wa'fu 'anhu wa akrim nuzulahu wa wassi' madkhalahu waghsilhu bil-ma'i wal-thalji wal-barad",
    translation: "O Allah, forgive him, have mercy on him, pardon him, grant him security, honor his arrival, widen his entrance, and wash him with water, snow, and hail.",
    translationUrdu: "اے اللہ! اسے بخش دے، اس پر رحم فرما، اسے عافیت دے، اسے معاف کر دے، اس کی آمد کا اکرام فرما، اس کا داخلہ کشادہ کر، اسے پانی، برف اور اولوں سے دھو دے۔",
    reference: "Sahih Muslim 963", source: "muslim", benefits: "Comprehensive dua for the deceased — recite in Janazah prayer.", verified: true, tags: ["deceased", "funeral", "janazah", "death", "forgiveness"]
  }
];

const getUniqueCategories = () => {
  const map = new Map<string, string>();
  AUTHENTIC_DUAS.forEach(d => {
    if (!map.has(d.category)) map.set(d.category, d.categoryUrdu);
  });
  return Array.from(map.entries()).map(([eng, urdu]) => ({ eng, urdu }));
};

const SOURCE_LABELS: Record<Dua['source'], string> = {
  quran: 'Quran', bukhari: 'Ṣaḥīḥ Bukhārī', muslim: 'Ṣaḥīḥ Muslim',
  tirmidhi: 'Tirmidhī', abudawud: 'Abū Dāwūd', nasai: 'Nasāʾī',
  ibnemajah: 'Ibn Mājah', ahmad: 'Musnad Ahmad', hisn: 'Ḥiṣn al-Muslim'
};
const SOURCE_COLORS: Record<Dua['source'], string> = {
  quran: '#1B5E20', bukhari: '#0D47A1', muslim: '#1A237E',
  tirmidhi: '#4A148C', abudawud: '#B71C1C', nasai: '#E65100',
  ibnemajah: '#37474F', ahmad: '#3E2723', hisn: '#004D40'
};

// ─── LocalStorage Helpers ─────────────────────────────────────────────────────
const LS_KEY = 'dua_favorites';
const loadFavs = (): number[] => {
  try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
};
const saveFavs = (ids: number[]) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(ids)); } catch { /* noop */ }
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function DuaGenerator() {
  const [language, setLanguage] = useState<Lang>(LANGUAGES.ENGLISH);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dailyDua, setDailyDua] = useState<Dua | null>(null);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'favorites' | 'daily'>('browse');
  const [showShareToast, setShowShareToast] = useState(false);
  const [randomFlash, setRandomFlash] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const categories = [{ eng: 'all', urdu: 'تمام' }, ...getUniqueCategories()];

  // Load favorites from localStorage
  useEffect(() => { setFavorites(loadFavs()); }, []);

  // Daily dua
  useEffect(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setDailyDua(AUTHENTIC_DUAS[dayOfYear % AUTHENTIC_DUAS.length]);
  }, []);

  // Filtered list
  const filteredDuas = AUTHENTIC_DUAS.filter(dua => {
    if (favoritesOnly && !favorites.includes(dua.id)) return false;
    if (selectedCategory !== 'all' && dua.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        dua.title.toLowerCase().includes(q) ||
        dua.translation.toLowerCase().includes(q) ||
        dua.translationUrdu.includes(q) ||
        dua.transliteration.toLowerCase().includes(q) ||
        dua.category.toLowerCase().includes(q) ||
        dua.tags.some(t => t.includes(q))
      );
    }
    return true;
  });

  const currentDua = filteredDuas[currentIndex] ?? null;

  const next = useCallback(() => {
    if (!filteredDuas.length) return;
    setCurrentIndex(p => (p + 1) % filteredDuas.length);
  }, [filteredDuas.length]);

  const prev = useCallback(() => {
    if (!filteredDuas.length) return;
    setCurrentIndex(p => (p - 1 + filteredDuas.length) % filteredDuas.length);
  }, [filteredDuas.length]);

  const random = useCallback(() => {
    if (!filteredDuas.length) return;
    setCurrentIndex(Math.floor(Math.random() * filteredDuas.length));
    setRandomFlash(true);
    setTimeout(() => setRandomFlash(false), 1500);
  }, [filteredDuas.length]);

  const toggleFavorite = (id: number) => {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    saveFavs(next);
  };

  const copyDua = async () => {
    if (!currentDua) return;
    const text = `${currentDua.arabic}\n\n${currentDua.transliteration}\n\n${currentDua.translation}\n\n— ${currentDua.reference}`;
    try { await navigator.clipboard.writeText(text); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareDua = async () => {
    if (!currentDua) return;
    const text = `📿 ${currentDua.title}\n\n${currentDua.arabic}\n\n${currentDua.translation}\n\n— ${currentDua.reference}`;
    try {
      if (navigator.share) { await navigator.share({ title: currentDua.title, text }); }
      else { await navigator.clipboard.writeText(text); setShowShareToast(true); setTimeout(() => setShowShareToast(false), 2500); }
    } catch { /* noop */ }
  };

  const speakDua = () => {
    if (!currentDua) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utter = new SpeechSynthesisUtterance(
      language === LANGUAGES.URDU
        ? `${currentDua.translationUrdu}. ${currentDua.reference}`
        : `${currentDua.title}. ${currentDua.translation}. Reference: ${currentDua.reference}`
    );
    utter.lang = language === LANGUAGES.URDU ? 'ur-PK' : 'en-US';
    utter.rate = 0.85;
    utter.onend = () => setSpeaking(false);
    speechRef.current = utter;
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  };

  // Reset index on filter change
  useEffect(() => { setCurrentIndex(0); }, [search, selectedCategory, favoritesOnly]);

  const L = (en: string, ur: string) => language === LANGUAGES.URDU ? ur : en;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 40%, #f0f9ff 100%)', fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {/* ── HEADER ── */}
      <header style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)', boxShadow: '0 4px 24px rgba(6,78,59,0.35)' }} className="sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <Link href="/" className="text-emerald-100 hover:text-white flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all">
            ← {L('Back', 'واپس')}
          </Link>
          <div className="flex flex-col items-center">
            <h1 className="text-white font-semibold text-base sm:text-lg flex items-center gap-2">
              <span className="text-xl">🤲</span>
              {L('Dua & Supplication', 'دعا و مناجات')}
            </h1>
            <p className="text-emerald-200 text-xs">{AUTHENTIC_DUAS.length} {L('Authenticated Duas', 'مستند دعائیں')}</p>
          </div>
          <button
            onClick={() => setLanguage(language === LANGUAGES.ENGLISH ? LANGUAGES.URDU : LANGUAGES.ENGLISH)}
            className="bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-full text-sm font-medium transition-all border border-white/20"
          >
            {language === LANGUAGES.ENGLISH ? 'اردو' : 'EN'}
          </button>
        </div>

        {/* Tab Bar */}
        <div className="max-w-3xl mx-auto px-4 pb-2 flex gap-1">
          {(['browse', 'favorites', 'daily'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); if (tab === 'browse') { setFavoritesOnly(false); } else if (tab === 'favorites') { setFavoritesOnly(true); } }}
              className={`flex-1 text-xs py-1.5 rounded-full font-medium transition-all ${activeTab === tab ? 'bg-white text-emerald-800' : 'text-emerald-100 hover:bg-white/10'}`}
            >
              {tab === 'browse' && L('📚 Browse', '📚 تلاش')}
              {tab === 'favorites' && L(`❤️ Saved (${favorites.length})`, `❤️ محفوظ (${favorites.length})`)}
              {tab === 'daily' && L('⭐ Daily Dua', '⭐ آج کی دعا')}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5">

        {/* ── DAILY DUA TAB ── */}
        {activeTab === 'daily' && dailyDua && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <p className="text-2xl font-bold text-emerald-900">{L("Today's Dua", 'آج کی دعا')}</p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString(language === LANGUAGES.URDU ? 'ur-PK' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <DuaCard
              dua={dailyDua} language={language} favorite={favorites.includes(dailyDua.id)}
              onToggleFavorite={() => toggleFavorite(dailyDua.id)}
              onCopy={copyDua} onShare={shareDua} onSpeak={speakDua}
              speaking={speaking} copied={copied} isDaily index={0} of={1}
            />
          </div>
        )}

        {/* ── BROWSE / FAVORITES ── */}
        {(activeTab === 'browse' || activeTab === 'favorites') && (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder={L('Search by keyword, category, or tag…', 'کلیدی لفظ، زمرہ یا ٹیگ سے تلاش کریں…')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm outline-none focus:ring-2 focus:ring-emerald-300 text-sm"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-400 text-lg leading-none">✕</button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex overflow-x-auto gap-2 mb-5 pb-1 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat.eng}
                  onClick={() => setSelectedCategory(cat.eng)}
                  className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap font-medium transition-all border ${
                    selectedCategory === cat.eng
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {language === LANGUAGES.URDU ? cat.urdu : cat.eng}
                </button>
              ))}
            </div>

            {/* Empty state */}
            {filteredDuas.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-50">
                <p className="text-5xl mb-4">🤲</p>
                <p className="text-lg font-semibold text-gray-700">{L('No duas found', 'کوئی دعا نہیں ملی')}</p>
                <p className="text-sm text-gray-400 mt-1">{L('Try a different search or clear filters', 'مختلف الفاظ یا فلٹر صاف کریں')}</p>
                <button onClick={() => { setSearch(''); setSelectedCategory('all'); }} className="mt-4 text-emerald-700 underline text-sm">
                  {L('Clear filters', 'فلٹر صاف کریں')}
                </button>
              </div>
            )}

            {filteredDuas.length > 0 && (
              <>
                {/* Nav Row */}
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={prev} className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-emerald-50 active:scale-95 transition-all text-lg">←</button>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-gray-400 font-medium">
                      {L('Dua', 'دعا')} {currentIndex + 1} / {filteredDuas.length}
                    </span>
                  </div>
                  <button
                    onClick={random}
                    className={`px-4 py-2 text-xs rounded-full font-medium transition-all border ${randomFlash ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    🎲 {L('Random', 'بے ترتیب')}
                  </button>
                  <button onClick={next} className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-emerald-50 active:scale-95 transition-all text-lg">→</button>
                </div>

                {/* Main Card */}
                {currentDua && (
                  <DuaCard
                    dua={currentDua} language={language}
                    favorite={favorites.includes(currentDua.id)}
                    onToggleFavorite={() => toggleFavorite(currentDua.id)}
                    onCopy={copyDua} onShare={shareDua} onSpeak={speakDua}
                    speaking={speaking} copied={copied}
                    index={currentIndex} of={filteredDuas.length}
                  />
                )}

                {/* Next Button */}
                <button
                  onClick={next}
                  className="w-full mt-5 py-4 rounded-2xl font-semibold text-white text-base active:scale-[0.98] transition-all shadow-md"
                  style={{ background: 'linear-gradient(135deg, #064e3b, #065f46)' }}
                >
                  {L('Next Dua 🤲', 'اگلی دعا 🤲')}
                </button>
              </>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-10 border-t border-emerald-100 pt-6 text-center">
          <p className="text-sm text-emerald-800 italic leading-relaxed">
            {L(
              '"And your Lord says: Call upon Me; I will respond to you." — Quran 40:60',
              '"اور تمہارے رب نے فرمایا: مجھ سے دعا کرو، میں قبول کروں گا۔" — قرآن ۴۰:۶۰'
            )}
          </p>
          <p className="text-xs text-gray-400 mt-3">
            {L(
              `All ${AUTHENTIC_DUAS.length} duas are sourced from the Holy Quran, Sahih al-Bukhari, Sahih Muslim, and other authenticated collections.`,
              `تمام ${AUTHENTIC_DUAS.length} دعائیں قرآن کریم، صحیح بخاری، صحیح مسلم اور دیگر مستند مجموعوں سے ہیں۔`
            )}
          </p>
        </div>
      </div>

      {/* Toast */}
      {showShareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-900 text-white text-sm px-5 py-3 rounded-2xl shadow-xl animate-fade-in z-50">
          {L('Copied to clipboard ✓', 'کلپ بورڈ میں کاپی ✓')}
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.35s ease-out both; }
      `}</style>
    </div>
  );
}

// ─── Dua Card Component ───────────────────────────────────────────────────────
interface CardProps {
  dua: Dua; language: Lang; favorite: boolean;
  onToggleFavorite: () => void; onCopy: () => void; onShare: () => void; onSpeak: () => void;
  speaking: boolean; copied: boolean; isDaily?: boolean; index: number; of: number;
}

function DuaCard({ dua, language, favorite, onToggleFavorite, onCopy, onShare, onSpeak, speaking, copied, isDaily }: CardProps) {
  const L = (en: string, ur: string) => language === LANGUAGES.URDU ? ur : en;
  const srcColor = SOURCE_COLORS[dua.source];

  return (
    <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden animate-fade-in">
      {/* Card Header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${srcColor}ee, ${srcColor}bb)` }}>
        <div className="flex items-center gap-2">
          {isDaily && <span className="text-amber-300">⭐</span>}
          <span className="text-white/90 text-xs font-medium bg-white/15 px-2.5 py-1 rounded-full">
            {language === LANGUAGES.URDU ? dua.categoryUrdu : dua.category}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {dua.verified && (
            <span className="text-xs text-white/80 flex items-center gap-1">
              <span className="text-green-300">✓</span> {L('Verified', 'مستند')}
            </span>
          )}
          <span className="text-white/70 text-xs">{SOURCE_LABELS[dua.source]}</span>
        </div>
      </div>

      <div className="p-5 md:p-6">
        {/* Title */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold text-gray-900 leading-snug flex-1">
            {language === LANGUAGES.URDU ? dua.titleUrdu : dua.title}
          </h2>
          <button
            onClick={onToggleFavorite}
            className={`text-2xl transition-all hover:scale-110 active:scale-95 flex-shrink-0 ${favorite ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
            title={L(favorite ? 'Remove from favorites' : 'Save to favorites', favorite ? 'پسندیدہ سے ہٹائیں' : 'پسندیدہ میں شامل کریں')}
          >
            {favorite ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Arabic */}
        <div className="rounded-2xl p-5 mb-5 text-center" style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' }}>
          <p
            className="leading-[3rem] text-emerald-900 select-all"
            dir="rtl"
            style={{ fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', fontFamily: "'Scheherazade New', 'Noto Naskh Arabic', 'Amiri', serif", lineHeight: '3rem' }}
          >
            {dua.arabic}
          </p>
        </div>

        {/* Transliteration */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-emerald-700/70 uppercase tracking-wider mb-1.5">
            {L('Transliteration', 'تلفظ')}
          </p>
          <p className="text-gray-600 italic text-sm leading-relaxed">{dua.transliteration}</p>
        </div>

        {/* Translation */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-emerald-700/70 uppercase tracking-wider mb-1.5">
            {L('Translation', 'ترجمہ')}
          </p>
          <p
            className="text-gray-800 text-base leading-relaxed"
            dir={language === LANGUAGES.URDU ? 'rtl' : 'ltr'}
            style={language === LANGUAGES.URDU ? { fontFamily: "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif", fontSize: '1.05rem', lineHeight: '2rem' } : {}}
          >
            {language === LANGUAGES.URDU ? dua.translationUrdu : dua.translation}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {dua.tags.map(tag => (
            <span key={tag} className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
              #{tag}
            </span>
          ))}
        </div>

        {/* Reference & Benefits */}
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <span className="text-emerald-600 mt-0.5">📖</span>
            <span className="text-gray-600 font-medium">{dua.reference}</span>
          </div>
          {dua.benefits && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-amber-500 mt-0.5">✨</span>
              <span className="text-gray-500 italic">{dua.benefits}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-5 pt-4 border-t border-gray-50">
          <button
            onClick={onCopy}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${copied ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
          >
            {copied ? L('✓ Copied!', '✓ کاپی!') : L('📋 Copy', '📋 کاپی')}
          </button>
          <button
            onClick={onShare}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-all"
          >
            {L('🔗 Share', '🔗 شیئر')}
          </button>
          <button
            onClick={onSpeak}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${speaking ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
          >
            {speaking ? L('⏹ Stop', '⏹ روکیں') : L('🔊 Listen', '🔊 سنیں')}
          </button>
        </div>
      </div>
    </div>
  );
}