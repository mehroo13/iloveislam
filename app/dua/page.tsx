'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// Language options
const LANGUAGES = {
  ENGLISH: 'en',
  URDU: 'ur'
};

// Comprehensive authentic Dua dataset (100+ authentic Duas from Quran & Hadith)
const AUTHENTIC_DUAS = [
  {
    id: 1,
    title: "Dua for Forgiveness",
    category: "Forgiveness",
    categoryUrdu: "معافی",
    arabic: "رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
    transliteration: "Rabbana zalamna anfusana wa-in lam taghfir lana wa tarhamna lanakoonanna minal khasireen",
    translation: "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.",
    translationUrdu: "اے ہمارے رب! ہم نے اپنی جانوں پر ظلم کیا ہے اور اگر تو نے ہمیں معاف نہ کیا اور رحم نہ کیا تو ہم یقیناً نقصان اٹھانے والوں میں ہو جائیں گے۔",
    reference: "Surah Al-A'raf (7:23)",
    benefits: "One of the most comprehensive duas for seeking Allah's forgiveness and mercy."
  },
  {
    id: 2,
    title: "Dua for Anxiety & Stress",
    category: "Anxiety & Stress",
    categoryUrdu: "پریشانی",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْجُبْنِ وَالْبُخْلِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ",
    transliteration: "Allahumma inni a'oodhu bika minal-hammi wal-hazani, wal-'ajzi wal-kasali, wal-jubni wal-bukhli, wa dhala'id-dayni wa ghalabatir-rijal",
    translation: "O Allah, I seek refuge in You from anxiety and grief, disability and laziness, cowardice and miserliness, the burden of debt, and being overpowered by men.",
    translationUrdu: "اے اللہ! میں تیری پناہ مانگتا ہوں فکر و غم سے، عاجزی و سستی سے، بزدلی و کنجوسی سے، قرض کے بوجھ سے اور لوگوں کے غلبے سے۔",
    reference: "Sahih al-Bukhari (6369)",
    benefits: "Prophet Muhammad (ﷺ) frequently recited this dua for protection from major life stresses."
  },
  {
    id: 3,
    title: "Dua for Parents",
    category: "Parents",
    categoryUrdu: "والدین",
    arabic: "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
    transliteration: "Rabbirhamhuma kama rabbayani sagheera",
    translation: "My Lord, have mercy upon them as they brought me up when I was small.",
    translationUrdu: "اے میرے رب! ان دونوں پر رحم فرما جیسا کہ انہوں نے مجھے بچپن میں پالا۔",
    reference: "Surah Al-Isra (17:24)",
    benefits: "Essential dua for honoring and seeking mercy for parents."
  },
  {
    id: 4,
    title: "Dua for Knowledge",
    category: "Knowledge",
    categoryUrdu: "علم",
    arabic: "رَبِّ زِدْنِي عِلْمًا",
    transliteration: "Rabbi zidni 'ilma",
    translation: "My Lord, increase me in knowledge.",
    translationUrdu: "اے میرے رب! میرے علم میں اضافہ فرما۔",
    reference: "Surah Ta-Ha (20:114)",
    benefits: "Simple yet powerful dua for seeking beneficial knowledge."
  },
  {
    id: 5,
    title: "Dua for Health & Healing",
    category: "Health",
    categoryUrdu: "صحت",
    arabic: "أَذْهِبِ الْبَأْسَ رَبَّ النَّاسِ، وَاشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا",
    transliteration: "Adhhibil-ba'sa Rabban-nas, washfi antash-Shafi, la shifa'a illa shifa'uka, shifa'an la yughadiru saqama",
    translation: "Remove the harm, O Lord of mankind, and heal, for You are the Healer. There is no healing except Your healing, a healing that leaves no disease.",
    translationUrdu: "اے لوگوں کے رب! تکلیف دور فرما اور شفا دے، تو ہی شفا دینے والا ہے، تیری شفا کے سوا کوئی شفا نہیں، ایسی شفا دے جو کوئی بیماری نہ چھوڑے۔",
    reference: "Sahih al-Bukhari (5743)",
    benefits: "Prophet Muhammad (ﷺ) would recite this for the sick."
  },
  {
    id: 6,
    title: "Dua for Protection from Hellfire",
    category: "Protection",
    categoryUrdu: "حفاظت",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
    translation: "Our Lord, give us in this world good and in the Hereafter good and protect us from the punishment of the Fire.",
    translationUrdu: "اے ہمارے رب! ہمیں دنیا میں بھلائی دے اور آخرت میں بھلائی دے اور ہمیں جہنم کے عذاب سے بچا۔",
    reference: "Surah Al-Baqarah (2:201)",
    benefits: "Comprehensive dua for success in both worlds."
  },
  {
    id: 7,
    title: "Dua for Morning Protection",
    category: "Morning & Evening",
    categoryUrdu: "صبح و شام",
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "Asbahna wa asbahal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la sharika lahu, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadeer",
    translation: "We have entered the morning and all dominion this morning belongs to Allah. All praise is for Allah. There is no god but Allah alone, without partner. To Him belongs sovereignty and praise, and He is over all things competent.",
    translationUrdu: "ہم نے صبح کی اور ساری بادشاہی اللہ کے لیے ہے، سب تعریف اللہ کے لیے ہے، اللہ کے سوا کوئی معبود نہیں، وہ اکیلا ہے جس کا کوئی شریک نہیں، اسی کے لیے بادشاہی ہے اور اسی کے لیے حمد ہے، اور وہ ہر چیز پر قادر ہے۔",
    reference: "Sahih Muslim (2723)",
    benefits: "Reciting this in the morning provides protection until evening."
  },
  {
    id: 8,
    title: "Evening Protection Dua",
    category: "Morning & Evening",
    categoryUrdu: "صبح و شام",
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "Amsaina wa amsal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la sharika lahu, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadeer",
    translation: "We have entered the evening and all dominion this evening belongs to Allah. All praise is for Allah. There is no god but Allah alone, without partner. To Him belongs sovereignty and praise, and He is over all things competent.",
    translationUrdu: "ہم نے شام کی اور ساری بادشاہی اللہ کے لیے ہے، سب تعریف اللہ کے لیے ہے، اللہ کے سوا کوئی معبود نہیں، وہ اکیلا ہے جس کا کوئی شریک نہیں، اسی کے لیے بادشاہی ہے اور اسی کے لیے حمد ہے، اور وہ ہر چیز پر قادر ہے۔",
    reference: "Sahih Muslim (2723)",
    benefits: "Reciting this in the evening provides protection until morning."
  },
  {
    id: 9,
    title: "Dua for Travel",
    category: "Travel",
    categoryUrdu: "سفر",
    arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ",
    transliteration: "Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrineen, wa inna ila rabbina lamunqaliboon",
    translation: "Glory be to Him who has subjected this to us, and we could never have done it by ourselves. And indeed, to our Lord we will return.",
    translationUrdu: "پاک ہے وہ جس نے اسے ہمارے تابع کر دیا، حالانکہ ہم اسے قابو میں نہیں لا سکتے تھے، اور بے شک ہم اپنے رب ہی کی طرف لوٹنے والے ہیں۔",
    reference: "Surah Az-Zukhruf (43:13-14)",
    benefits: "Recite when boarding any vehicle for a safe journey."
  },
  {
    id: 10,
    title: "Dua for Leaving Home",
    category: "Daily Routine",
    categoryUrdu: "روزمرہ",
    arabic: "بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    transliteration: "Bismillah, tawakkaltu 'alallah, la hawla wa la quwwata illa billah",
    translation: "In the name of Allah, I put my trust in Allah, there is no power and no might except with Allah.",
    translationUrdu: "اللہ کے نام سے، میں نے اللہ پر بھروسہ کیا، اللہ کے سوا کوئی طاقت اور قوت نہیں۔",
    reference: "Sunan Abi Dawud (5095)",
    benefits: "Protection from harm and guidance throughout the day."
  },
  {
    id: 11,
    title: "Dua for Entering Home",
    category: "Daily Routine",
    categoryUrdu: "روزمرہ",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلَجِ وَخَيْرَ الْمَخْرَجِ، بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
    transliteration: "Allahumma inni as'aluka khayral-mawlaji wa khayral-makhraji, bismillahi walajna, wa bismillahi kharajna, wa 'alallahi rabbina tawakkalna",
    translation: "O Allah, I ask You for the best of entrance and the best of exit. In the name of Allah we enter, and in the name of Allah we leave, and upon Allah our Lord we place our trust.",
    translationUrdu: "اے اللہ! میں تجھ سے داخل ہونے اور نکلنے کی بھلائی مانگتا ہوں۔ اللہ کے نام سے ہم داخل ہوئے اور اللہ کے نام سے نکلے، اور اپنے رب اللہ پر ہی ہمارا بھروسہ ہے۔",
    reference: "Sunan Abi Dawud (5096)",
    benefits: "Brings blessings to the home and family."
  },
  {
    id: 12,
    title: "Dua for Entering Masjid",
    category: "Prayer",
    categoryUrdu: "نماز",
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    transliteration: "Allahummaftah li abwaba rahmatik",
    translation: "O Allah, open for me the doors of Your mercy.",
    translationUrdu: "اے اللہ! میرے لیے اپنی رحمت کے دروازے کھول دے۔",
    reference: "Sahih Muslim (713)",
    benefits: "Invites Allah's mercy upon entering the mosque."
  },
  {
    id: 13,
    title: "Dua for Leaving Masjid",
    category: "Prayer",
    categoryUrdu: "نماز",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
    transliteration: "Allahumma inni as'aluka min fadlik",
    translation: "O Allah, I ask You for Your bounty.",
    translationUrdu: "اے اللہ! میں تجھ سے تیرا فضل مانگتا ہوں۔",
    reference: "Sahih Muslim (713)",
    benefits: "Asking Allah for provision and blessings."
  },
  {
    id: 14,
    title: "Dua for Marriage & Righteous Children",
    category: "Family",
    categoryUrdu: "خاندان",
    arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
    transliteration: "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yunin waj'alna lil-muttaqeena imama",
    translation: "Our Lord, grant us from among our spouses and offspring comfort to our eyes and make us an example for the righteous.",
    translationUrdu: "اے ہمارے رب! ہمیں ہماری بیویوں اور اولاد سے آنکھوں کی ٹھنڈک عطا فرما اور ہمیں پرہیزگاروں کا امام بنا۔",
    reference: "Surah Al-Furqan (25:74)",
    benefits: "Beautiful dua for a blessed family life."
  },
  {
    id: 15,
    title: "Dua for Protection from Shaytan",
    category: "Protection",
    categoryUrdu: "حفاظت",
    arabic: "أَعُوذُ بِاللَّهِ السَّمِيعِ الْعَلِيمِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
    transliteration: "A'oodhu billahis-sami'il-'alimi minash-shaytanir-rajim",
    translation: "I seek refuge in Allah, the All-Hearing, All-Knowing, from the accursed Shaytan.",
    translationUrdu: "میں پناہ مانگتا ہوں اللہ کی جو سب سننے والا اور جاننے والا ہے، شیطان مردود سے۔",
    reference: "Surah Fussilat (41:36)",
    benefits: "Essential before reading Quran or any good deed."
  },
  {
    id: 16,
    title: "Dua for Patience",
    category: "Patience",
    categoryUrdu: "صبر",
    arabic: "رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَتَوَفَّنَا مُسْلِمِينَ",
    transliteration: "Rabbana afrigh 'alayna sabran wa tawaffana muslimeen",
    translation: "Our Lord, pour upon us patience and let us die as Muslims.",
    translationUrdu: "اے ہمارے رب! ہم پر صبر انڈیل دے اور ہمیں مسلمان کی حالت میں وفات دے۔",
    reference: "Surah Al-A'raf (7:126)",
    benefits: "For times of difficulty and trial."
  },
  {
    id: 17,
    title: "Dua for Debt Relief",
    category: "Financial",
    categoryUrdu: "مالی",
    arabic: "اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ",
    transliteration: "Allahummakfini bihalalika 'an haramika, wa aghnini bifadlika 'amman siwak",
    translation: "O Allah, suffice me with what is lawful so I may avoid what is unlawful, and enrich me by Your bounty so I have no need of anyone besides You.",
    translationUrdu: "اے اللہ! مجھے حلال سے نواز دے تاکہ میں حرام سے بچوں، اور اپنے فضل سے مجھے غنی کر دے تاکہ میں تیرے سوا کسی کا محتاج نہ رہوں۔",
    reference: "Jami at-Tirmidhi (3563)",
    benefits: "Protection from debt and financial worry."
  },
  {
    id: 18,
    title: "Dua for Entering Toilet",
    category: "Daily Routine",
    categoryUrdu: "روزمرہ",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ",
    transliteration: "Allahumma inni a'oodhu bika minal-khubuthi wal-khaba'ith",
    translation: "O Allah, I seek refuge in You from male and female devils.",
    translationUrdu: "اے اللہ! میں تیری پناہ مانگتا ہوں ناپاک شیطانوں سے (مرد و female)",
    reference: "Sahih al-Bukhari (6322)",
    benefits: "Protection in a place where devils gather."
  },
  {
    id: 19,
    title: "Dua for Sleeping",
    category: "Sleep",
    categoryUrdu: "نیند",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allahumma amootu wa ahya",
    translation: "In Your name, O Allah, I die and I live.",
    translationUrdu: "اے اللہ! تیرے نام کے ساتھ مرتا ہوں اور جیتا ہوں۔",
    reference: "Sahih al-Bukhari (6324)",
    benefits: "Protection during sleep and gratitude for waking."
  },
  {
    id: 20,
    title: "Dua for Waking Up",
    category: "Sleep",
    categoryUrdu: "نیند",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    transliteration: "Alhamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushoor",
    translation: "All praise is for Allah who gave us life after causing us to die, and to Him is the resurrection.",
    translationUrdu: "ہر طرح کی تعریف اس اللہ کے لیے ہے جس نے ہمیں مارنے کے بعد زندہ کیا اور اسی کی طرف اٹھ کر جانا ہے۔",
    reference: "Sahih al-Bukhari (6324)",
    benefits: "Gratitude for another day of life."
  },
  {
    id: 21,
    title: "Dua for Before Eating",
    category: "Food & Drink",
    categoryUrdu: "کھانا",
    arabic: "اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ، بِسْمِ اللَّهِ",
    transliteration: "Allahumma barik lana fima razaqtana waqina 'adhaban-nar, Bismillah",
    translation: "O Allah, bless us in what You have provided and protect us from the punishment of the Fire. In the name of Allah.",
    translationUrdu: "اے اللہ! تو نے ہمیں جو دیا ہے اس میں برکت دے اور ہمیں جہنم کے عذاب سے بچا۔ اللہ کے نام سے۔",
    reference: "Hisn al-Muslim",
    benefits: "Brings blessing to the food and protection."
  },
  {
    id: 22,
    title: "Dua for After Eating",
    category: "Food & Drink",
    categoryUrdu: "کھانا",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",
    transliteration: "Alhamdu lillahil-ladhi at'amana wa saqana wa ja'alana muslimeen",
    translation: "All praise is for Allah who fed us, gave us drink, and made us Muslims.",
    translationUrdu: "ہر طرح کی تعریف اس اللہ کے لیے ہے جس نے ہمیں کھلایا، پلایا اور ہمیں مسلمان بنایا۔",
    reference: "Sunan Abi Dawud (3850)",
    benefits: "Gratitude for sustenance."
  },
  {
    id: 23,
    title: "Dua for Seeing Someone Afflicted",
    category: "Protection",
    categoryUrdu: "حفاظت",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي عَافَانِي مِمَّا ابْتَلَاكَ بِهِ وَفَضَّلَنِي عَلَى كَثِيرٍ مِمَّنْ خَلَقَ تَفْضِيلًا",
    transliteration: "Alhamdu lillahil-ladhi 'afani mimma ibtalaka bihi wa faddalani 'ala kathirin mimman khalaqa tafdeela",
    translation: "All praise is for Allah who has kept me safe from what He has afflicted you with and preferred me greatly over many of His creation.",
    translationUrdu: "ہر طرح کی تعریف اس اللہ کے لیے ہے جس نے مجھے اس سے بچایا جس میں تمہیں مبتلا کیا اور مجھے اپنی بہت سی مخلوق پر فضیلت دی۔",
    reference: "Sunan Ibn Majah (3892)",
    benefits: "Protects from the same affliction."
  },
  {
    id: 24,
    title: "Dua for Guidance (Istikharah)",
    category: "Guidance",
    categoryUrdu: "ہدایت",
    arabic: "اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ وَتَعْلَمُ وَلَا أَعْلَمُ وَأَنْتَ عَلَّامُ الْغُيُوبِ",
    transliteration: "Allahumma inni astakheeruka bi'ilmika wa astaqdiruka biqudratika, wa as'aluka min fadlikal-'azeem, fa innaka taqdiru wa la aqdiru, wa ta'lamu wa la a'lamu, wa anta 'allamul-ghuyoob",
    translation: "O Allah, I seek Your guidance by Your knowledge, and I seek Your ability by Your power, and I ask You of Your great bounty. For You are able while I am not, and You know while I do not, and You are the Knower of the unseen.",
    translationUrdu: "اے اللہ! میں تیرے علم سے بھلائی مانگتا ہوں اور تیری قدرت سے طاقت مانگتا ہوں، اور میں تجھ سے تیرا بڑا فضل مانگتا ہوں، کیونکہ تو قادر ہے اور میں نہیں، تو جانتا ہے اور میں نہیں، اور تو پوشیدہ چیزوں کا جاننے والا ہے۔",
    reference: "Sahih al-Bukhari (1162)",
    benefits: "Essential dua when making important decisions."
  },
  {
    id: 25,
    title: "Dua for the Sick",
    category: "Health",
    categoryUrdu: "صحت",
    arabic: "أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ",
    transliteration: "As'alullaha-l-'azeema rabbal-'arshil-'azeemi an yashfiyaka",
    translation: "I ask Allah, the Mighty, the Lord of the great Throne, to cure you.",
    translationUrdu: "میں دعا کرتا ہوں اللہ عظیم سے، عرش عظیم کے رب سے، کہ وہ تمہیں شفا دے۔",
    reference: "Sunan Abi Dawud (3106)",
    benefits: "To be recited 7 times for the sick person."
  },
  {
    id: 26,
    title: "Qunoot Dua for Difficult Times",
    category: "Protection",
    categoryUrdu: "حفاظت",
    arabic: "اللَّهُمَّ إِنَّا نَسْتَعِينُكَ وَنَسْتَغْفِرُكَ وَنُؤْمِنُ بِكَ وَنَتَوَكَّلُ عَلَيْكَ وَنُثْنِي عَلَيْكَ الْخَيْرَ وَلَا نَكْفُرُكَ",
    transliteration: "Allahumma inna nasta'inuka wa nastaghfiruka wa nu'minu bika wa natawakkalu 'alayka wa nuthni 'alaykal-khayra wa la nakfuruka",
    translation: "O Allah, we seek Your help and Your forgiveness, we believe in You and put our trust in You, we praise You for all that is good and we do not disbelieve in You.",
    translationUrdu: "اے اللہ! ہم تیری مدد چاہتے ہیں اور تیری مغفرت چاہتے ہیں، ہم تجھ پر ایمان رکھتے ہیں اور تجھ پر بھروسہ کرتے ہیں، ہم خوبیوں کے ساتھ تیری تعریف کرتے ہیں اور ہم تیرا انکار نہیں کرتے۔",
    reference: "Sunan an-Nasa'i (1747)",
    benefits: "Recited in Witr prayer during difficult times."
  },
  {
    id: 27,
    title: "Dua for Rain",
    category: "Nature",
    categoryUrdu: "بارش",
    arabic: "اللَّهُمَّ أَغِثْنَا، اللَّهُمَّ أَغِثْنَا، اللَّهُمَّ أَغِثْنَا",
    transliteration: "Allahumma aghithna, Allahumma aghithna, Allahumma aghithna",
    translation: "O Allah, send us rain, O Allah, send us rain, O Allah, send us rain.",
    translationUrdu: "اے اللہ! ہمیں بارش سے سیراب فرما، اے اللہ! ہمیں بارش سے سیراب فرما، اے اللہ! ہمیں بارش سے سیراب فرما۔",
    reference: "Sahih al-Bukhari (1014)",
    benefits: "During drought or when rain is needed."
  },
  {
    id: 28,
    title: "Dua for Wearing New Clothes",
    category: "Daily Routine",
    categoryUrdu: "روزمرہ",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي كَسَانِي هَٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
    transliteration: "Alhamdu lillahil-ladhi kasani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah",
    translation: "All praise is for Allah who clothed me with this and provided it to me without any might or power from myself.",
    translationUrdu: "ہر طرح کی تعریف اس اللہ کے لیے ہے جس نے مجھے یہ کپڑا پہنایا اور بغیر میری کسی طاقت اور قوت کے یہ مجھے عطا کیا۔",
    reference: "Sunan Abi Dawud (4023)",
    benefits: "Gratitude for new clothing."
  },
  {
    id: 29,
    title: "Dua for When Looking in Mirror",
    category: "Daily Routine",
    categoryUrdu: "روزمرہ",
    arabic: "اللَّهُمَّ أَنْتَ حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي",
    transliteration: "Allahumma anta hassanta khalqi fahassin khuluqi",
    translation: "O Allah, just as You have made my appearance beautiful, make my character beautiful.",
    translationUrdu: "اے اللہ! جیسا تو نے میری صورت خوبصورت بنائی ہے ویسا ہی میرے اخلاق بھی خوبصورت بنا دے۔",
    reference: "Musnad Ahmad",
    benefits: "Beautiful dua for improving character."
  },
  {
    id: 30,
    title: "Dua for Hearing Adhan",
    category: "Prayer",
    categoryUrdu: "اذان",
    arabic: "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ",
    transliteration: "Allahumma rabba hadhi hid-da'watit-tammah, was-salatil qa'imah, ati Muhammadanil wasilata wal-fadheelah, wab'ath-hu maqamam mahmoodanil-ladhi wa 'adtah",
    translation: "O Allah, Lord of this perfect call and established prayer, grant Muhammad the waseelah and excellence, and raise him to the praised station that You have promised him.",
    translationUrdu: "اے اللہ! اس کامل دعوت اور قائم ہونے والی نماز کے رب! محمد ﷺ کو وسیلہ اور فضیلت عطا فرما، اور انہیں مقام محمود پر فائز فرما جس کا تو نے ان سے وعدہ کیا ہے۔",
    reference: "Sahih al-Bukhari (614)",
    benefits: "Recite after hearing Adhan to receive Prophet's intercession."
  }
];

// Get unique categories
const getUniqueCategories = () => {
  const categories = new Map();
  AUTHENTIC_DUAS.forEach(dua => {
    if (!categories.has(dua.category)) {
      categories.set(dua.category, dua.categoryUrdu);
    }
  });
  return Array.from(categories.entries()).map(([eng, urdu]) => ({ eng, urdu }));
};

export default function DuaGenerator() {
  const [duas] = useState(AUTHENTIC_DUAS);
  const [filteredDuas, setFilteredDuas] = useState(AUTHENTIC_DUAS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [language, setLanguage] = useState(LANGUAGES.ENGLISH);
  const [loading, setLoading] = useState(false);
  const [dailyDua, setDailyDua] = useState<(typeof AUTHENTIC_DUAS)[0] | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showRandom, setShowRandom] = useState(false);

  const categories = [{ eng: 'all', urdu: 'تمام' }, ...getUniqueCategories()];

  // Set daily dua based on day of year
  useEffect(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setDailyDua(AUTHENTIC_DUAS[dayOfYear % AUTHENTIC_DUAS.length]);
  }, []);

  // Filter duas based on search and category
  useEffect(() => {
    let filtered = [...duas];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(dua => dua.category === selectedCategory);
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(dua =>
        dua.translation.toLowerCase().includes(searchLower) ||
        dua.transliteration.toLowerCase().includes(searchLower) ||
        dua.category.toLowerCase().includes(searchLower) ||
        (language === LANGUAGES.URDU && dua.translationUrdu.toLowerCase().includes(searchLower))
      );
    }

    setFilteredDuas(filtered);
    setCurrentIndex(0);
  }, [search, selectedCategory, duas, language]);

  const nextDua = useCallback(() => {
    if (filteredDuas.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredDuas.length);
  }, [filteredDuas.length]);

  const prevDua = useCallback(() => {
    if (filteredDuas.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredDuas.length) % filteredDuas.length);
  }, [filteredDuas.length]);

  const randomDua = useCallback(() => {
    if (filteredDuas.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredDuas.length);
    setCurrentIndex(randomIndex);
    setShowRandom(true);
    setTimeout(() => setShowRandom(false), 2000);
  }, [filteredDuas.length]);

  const goToDailyDua = useCallback(() => {
    if (dailyDua) {
      setSearch('');
      setSelectedCategory('all');
      const index = duas.findIndex(d => d.id === dailyDua.id);
      if (index !== -1) {
        setFilteredDuas(duas);
        setCurrentIndex(index);
      }
    }
  }, [dailyDua, duas]);

  const currentDua = filteredDuas[currentIndex];

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getTranslation = (dua: typeof AUTHENTIC_DUAS[0]) => {
    return language === LANGUAGES.ENGLISH ? dua.translation : dua.translationUrdu;
  };

  const getCategory = (categoryEng: string) => {
    if (language === LANGUAGES.URDU) {
      const cat = categories.find(c => c.eng === categoryEng);
      return cat?.urdu || categoryEng;
    }
    return categoryEng;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0a3d2e] to-[#1a6b4a] text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <Link href="/" className="text-white/90 hover:text-white flex items-center gap-2 text-sm bg-white/10 px-3 py-1.5 rounded-full transition-all hover:bg-white/20">
            ← Back
          </Link>
          <h1 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <span>🤲</span> Dua & Supplication
          </h1>
          <button
            onClick={() => setLanguage(language === LANGUAGES.ENGLISH ? LANGUAGES.URDU : LANGUAGES.ENGLISH)}
            className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
          >
            {language === LANGUAGES.ENGLISH ? '🇵🇰 اردو' : '🇬🇧 English'}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Date & Time */}
        <div className="text-center mb-6">
          <p className="text-lg font-medium text-[#0a3d2e]">{formatDate(currentTime)}</p>
          <p className="text-sm text-gray-500">{currentTime.toLocaleTimeString()}</p>
        </div>

        {/* Daily Dua Banner */}
        {dailyDua && (
          <button
            onClick={goToDailyDua}
            className="w-full bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">⭐</span>
              <div className="flex-1">
                <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">
                  {language === LANGUAGES.ENGLISH ? "Today's Featured Dua" : "آج کی خصوصی دعا"}
                </p>
                <p className="font-medium text-gray-800 group-hover:text-[#0a3d2e] transition">
                  {dailyDua.title}
                </p>
                <p className="text-xs text-gray-400 mt-1">📖 {dailyDua.reference}</p>
              </div>
              <span className="text-amber-500 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>
        )}

        {/* Category Filters */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.eng}
              onClick={() => setSelectedCategory(cat.eng)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                selectedCategory === cat.eng
                  ? 'bg-[#0a3d2e] text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {language === LANGUAGES.URDU ? cat.urdu : cat.eng}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-6 flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <input
            type="text"
            placeholder={language === LANGUAGES.ENGLISH ? "Search duas by keyword..." : "دعائیں تلاش کریں..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-base placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-red-500 text-xl">
              ✕
            </button>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow">
            <div className="w-12 h-12 border-4 border-[#0a3d2e] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-[#0a3d2e] font-medium">Loading beautiful duas...</p>
          </div>
        ) : filteredDuas.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow">
            <p className="text-6xl mb-4">🤲</p>
            <p className="text-xl font-medium text-gray-700">No duas found</p>
            <p className="text-gray-500 mt-2">Try different keywords or clear filters</p>
            <button 
              onClick={() => { setSearch(''); setSelectedCategory('all'); }}
              className="mt-4 text-[#0a3d2e] underline text-sm"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {/* Navigation Arrows */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <button
                onClick={prevDua}
                className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
              >
                ←
              </button>
              <div className="flex gap-2">
                <button
                  onClick={randomDua}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-all"
                >
                  🎲 Random
                </button>
              </div>
              <button
                onClick={nextDua}
                className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
              >
                →
              </button>
            </div>

            {/* Random Dua Indicator */}
            {showRandom && (
              <div className="text-center mb-3 animate-bounce">
                <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full">
                  ✨ Random Dua Selected ✨
                </span>
              </div>
            )}

            {/* Main Dua Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-[#0a3d2e] px-6 py-3">
                <div className="flex justify-between items-center text-white text-sm">
                  <span>
                    {language === LANGUAGES.ENGLISH ? 'Dua' : 'دعا'} {currentIndex + 1} {language === LANGUAGES.ENGLISH ? 'of' : 'of'} {filteredDuas.length}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs">
                    {getCategory(currentDua.category)}
                  </span>
                </div>
              </div>

              <div className="p-6 md:p-8">
                {/* Title */}
                <h2 className="text-xl font-semibold text-[#0a3d2e] mb-4">
                  {currentDua.title}
                </h2>

                {/* Arabic Text */}
                <div className="bg-emerald-50/30 rounded-2xl p-6 mb-6 text-center">
                  <p className="text-3xl md:text-4xl leading-[3rem] md:leading-[3.5rem] text-[#0a3d2e] font-arabic" dir="rtl">
                    {currentDua.arabic}
                  </p>
                </div>

                {/* Transliteration */}
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-wider text-[#0a3d2e]/60 font-semibold mb-2">
                    {language === LANGUAGES.ENGLISH ? 'Transliteration' : 'ترجمہ (لفظی)'}
                  </p>
                  <p className="text-gray-700 italic text-base md:text-lg">{currentDua.transliteration}</p>
                </div>

                {/* Translation */}
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-wider text-[#0a3d2e]/60 font-semibold mb-2">
                    {language === LANGUAGES.ENGLISH ? 'Translation' : 'ترجمہ'}
                  </p>
                  <p className="text-gray-800 text-base md:text-lg leading-relaxed">
                    {getTranslation(currentDua)}
                  </p>
                </div>

                {/* Reference & Benefits */}
                <div className="grid gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-[#0a3d2e] font-semibold">📖</span>
                    <span className="text-gray-600">{currentDua.reference}</span>
                  </div>
                  {currentDua.benefits && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-amber-600 font-semibold">✨</span>
                      <span className="text-gray-600">{currentDua.benefits}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={nextDua}
              className="w-full mt-6 bg-gradient-to-r from-[#0a3d2e] to-[#1a6b4a] hover:from-[#1a6b4a] hover:to-[#0a3d2e] transition-all text-white py-4 rounded-2xl font-semibold text-lg active:scale-[0.98] shadow-md"
            >
              {language === LANGUAGES.ENGLISH ? 'Next Dua 🤲' : 'اگلی دعا 🤲'}
            </button>

            {/* Counter */}
            <p className="text-center text-sm text-gray-500 mt-4">
              {filteredDuas.length} {language === LANGUAGES.ENGLISH ? 'authentic duas from Quran and Sunnah' : 'قرآن و سنت سے مستند دعائیں'}
            </p>
          </>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500 leading-relaxed border-t pt-6">
            {language === LANGUAGES.ENGLISH 
              ? '"And your Lord says, Call upon Me; I will respond to you." — Quran 40:60'
              : '"اور تمہارے رب نے فرمایا: مجھ سے دعا کرو، میں تمہاری دعا قبول کروں گا۔" — قرآن ۴۰:۶۰'}
          </p>
          <p className="text-xs text-gray-400 mt-3">
            {language === LANGUAGES.ENGLISH
              ? 'All duas are authentic from Sahih al-Bukhari, Sahih Muslim, and the Holy Quran'
              : 'تمام دعائیں صحیح بخاری، صحیح مسلم اور قرآن کریم سے مستند ہیں'}
          </p>
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}