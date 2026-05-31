// lib/duaDatabase.ts
// Comprehensive Dua Database — Authentic duas from Quran and Sunnah
// Sources: Hisnul Muslim, Sahih Bukhari, Sahih Muslim, Quran

export interface Dua {
  id: number;
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
  category: string;
  occasion: string;
  virtue?: string;
  tags: string[];
}

export interface DuaCategory {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  description: string;
  count: number;
}

export const DUA_CATEGORIES: DuaCategory[] = [
  { id: 'morning', name: 'Morning Adhkar', nameAr: 'أذكار الصباح', icon: '🌅', description: 'Duas to recite every morning after Fajr', count: 0 },
  { id: 'evening', name: 'Evening Adhkar', nameAr: 'أذكار المساء', icon: '🌇', description: 'Duas to recite every evening after Asr', count: 0 },
  { id: 'prayer', name: 'Prayer & Worship', nameAr: 'الصلاة والعبادة', icon: '🕌', description: 'Before, during, and after salah', count: 0 },
  { id: 'sleep', name: 'Sleep & Waking', nameAr: 'النوم والاستيقاظ', icon: '🌙', description: 'Before sleeping and upon waking', count: 0 },
  { id: 'food', name: 'Food & Drink', nameAr: 'الطعام والشراب', icon: '🍽️', description: 'Before and after eating and drinking', count: 0 },
  { id: 'travel', name: 'Travel', nameAr: 'السفر', icon: '✈️', description: 'Duas for journeys and transportation', count: 0 },
  { id: 'home', name: 'Home & Family', nameAr: 'البيت والأسرة', icon: '🏠', description: 'Entering home, family, children', count: 0 },
  { id: 'health', name: 'Health & Healing', nameAr: 'الصحة والشفاء', icon: '💚', description: 'Sickness, pain, visiting the ill', count: 0 },
  { id: 'protection', name: 'Protection & Ruqyah', nameAr: 'الحماية والرقية', icon: '🛡️', description: 'Evil eye, harm, enemies, shaytan', count: 0 },
  { id: 'forgiveness', name: 'Forgiveness', nameAr: 'الاستغفار والتوبة', icon: '🤲', description: 'Repentance and seeking mercy', count: 0 },
  { id: 'anxiety', name: 'Anxiety & Distress', nameAr: 'القلق والكرب', icon: '💙', description: 'Worry, sadness, fear, grief', count: 0 },
  { id: 'rizq', name: 'Rizq & Provision', nameAr: 'الرزق', icon: '💰', description: 'Wealth, debt, work, barakah', count: 0 },
  { id: 'knowledge', name: 'Knowledge', nameAr: 'العلم', icon: '📚', description: 'Study, exams, understanding', count: 0 },
  { id: 'events', name: 'Islamic Events', nameAr: 'المناسبات', icon: '🌟', description: 'Ramadan, Hajj, Eid, Jumu\'ah', count: 0 },
  { id: 'life', name: 'Life Events', nameAr: 'أحداث الحياة', icon: '🎯', description: 'Marriage, children, new home, death', count: 0 },
];

export const DUAS: Dua[] = [
  // ═══════════════════════════════════════════════════════════════
  // MORNING ADHKAR (أذكار الصباح)
  // ═══════════════════════════════════════════════════════════════
  { id: 1, arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', transliteration: 'Asbahna wa asbahal mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la shareeka lah, lahul mulku wa lahul hamdu wa huwa ala kulli shayin qadeer', translation: 'We have reached the morning and at this very time the whole kingdom belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah alone, without any partner. To Him belongs the dominion and to Him belongs all praise, and He is over all things capable.', reference: 'Abu Dawud 4/317', category: 'morning', occasion: 'Every morning after Fajr', virtue: 'Whoever says this has fulfilled his duty of gratitude for that day', tags: ['morning', 'daily', 'gratitude'] },
  { id: 2, arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ', transliteration: 'Allahumma bika asbahna wa bika amsayna wa bika nahya wa bika namootu wa ilaykan nushoor', translation: 'O Allah, by Your leave we have reached the morning and by Your leave we have reached the evening, by Your leave we live and die and unto You is our resurrection.', reference: 'Tirmidhi 5/466', category: 'morning', occasion: 'Every morning', tags: ['morning', 'daily'] },
  { id: 3, arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ', transliteration: 'Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana abduka, wa ana ala ahdika wa wadika mastatattu, aoodhu bika min sharri ma sanatu, aboo-u laka binimatika alayya, wa aboo-u bidhanbi, faghfir li fa-innahu la yaghfirudh-dhunuba illa anta', translation: 'O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil I have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for verily none can forgive sins except You.', reference: 'Sahih Bukhari 7/150', category: 'morning', occasion: 'Morning and evening — Sayyidul Istighfar', virtue: 'Whoever says this with certainty in the morning and dies that day enters Paradise', tags: ['morning', 'evening', 'istighfar', 'paradise'] },
  { id: 4, arabic: 'اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ وَمَلَائِكَتَكَ وَجَمِيعَ خَلْقِكَ أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ', transliteration: 'Allahumma inni asbahtu ushhiduka wa ushhidu hamalata arshika wa mala-ikataka wa jamee-a khalqika annaka antallahu la ilaha illa anta wahdaka la shareeka laka wa anna Muhammadan abduka wa rasooluka', translation: 'O Allah, verily I have reached the morning and call on You, the bearers of Your throne, Your angels, and all of Your creation to witness that You are Allah, none has the right to be worshipped except You, alone, without partner, and that Muhammad is Your servant and Messenger.', reference: 'Abu Dawud 4/317', category: 'morning', occasion: 'Say 4 times every morning', virtue: 'Allah will free a quarter of him from the Fire for each time. If said 4 times, Allah frees him entirely from the Fire that day.', tags: ['morning', 'protection', 'fire'] },
  { id: 5, arabic: 'اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ', transliteration: 'Allahumma ma asbaha bi min nimatin aw bi-ahadin min khalqika faminka wahdaka la shareeka laka falakal hamdu wa lakash shukr', translation: 'O Allah, what blessing I or any of Your creation have risen upon, is from You alone, without partner, so for You is all praise and unto You all thanks.', reference: 'Abu Dawud 4/318', category: 'morning', occasion: 'Every morning', virtue: 'Whoever says this has fulfilled his gratitude for that day', tags: ['morning', 'gratitude', 'shukr'] },
  { id: 6, arabic: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي اللَّهُمَّ عَافِنِي فِي سَمْعِي اللَّهُمَّ عَافِنِي فِي بَصَرِي لَا إِلَهَ إِلَّا أَنْتَ', transliteration: 'Allahumma aafini fi badani, Allahumma aafini fi sami, Allahumma aafini fi basari, la ilaha illa anta', translation: 'O Allah, grant my body health. O Allah, grant my hearing health. O Allah, grant my sight health. None has the right to be worshipped except You.', reference: 'Abu Dawud 4/324', category: 'morning', occasion: 'Say 3 times morning and evening', virtue: 'Protection for body, hearing, and sight', tags: ['morning', 'evening', 'health', 'protection'] },
  { id: 7, arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ لَا إِلَهَ إِلَّا أَنْتَ', transliteration: 'Allahumma inni aoodhu bika minal kufri wal faqri wa aoodhu bika min adhabil qabri la ilaha illa anta', translation: 'O Allah, I seek refuge in You from disbelief and poverty, and I seek refuge in You from the punishment of the grave. None has the right to be worshipped except You.', reference: 'Abu Dawud 4/324', category: 'morning', occasion: 'Say 3 times morning and evening', tags: ['morning', 'evening', 'protection'] },
  { id: 8, arabic: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ', transliteration: 'Hasbiyallahu la ilaha illa huwa alayhi tawakkaltu wa huwa Rabbul Arshil Adheem', translation: 'Allah is sufficient for me. None has the right to be worshipped except Him. I place my trust in Him and He is Lord of the Majestic Throne.', reference: 'Abu Dawud (Sahih)', category: 'morning', occasion: 'Say 7 times morning and evening', virtue: 'Allah will grant him whatever he desires from this world and the next', tags: ['morning', 'evening', 'tawakkul', 'trust'] },
  { id: 9, arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ', transliteration: 'Bismillahil-ladhi la yadurru maasmihi shayun fil ardi wa la fis-samai wa huwas-Samiul Aleem', translation: 'In the Name of Allah, with Whose Name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.', reference: 'Abu Dawud 4/323, Tirmidhi 5/465', category: 'morning', occasion: 'Say 3 times morning and evening', virtue: 'Nothing will harm him that day/night', tags: ['morning', 'evening', 'protection', 'harm'] },
  { id: 10, arabic: 'رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا', transliteration: 'Radheetu billahi Rabba, wa bil-Islami deena, wa bi-Muhammadin sallallahu alayhi wa sallama nabiyya', translation: 'I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace be upon him) as my Prophet.', reference: 'Abu Dawud 4/318', category: 'morning', occasion: 'Say 3 times morning and evening', virtue: 'It is a right upon Allah to please him on the Day of Judgement', tags: ['morning', 'evening', 'contentment'] },

  // ═══════════════════════════════════════════════════════════════
  // EVENING ADHKAR (أذكار المساء)
  // ═══════════════════════════════════════════════════════════════
  { id: 11, arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', transliteration: 'Amsayna wa amsal mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la shareeka lah, lahul mulku wa lahul hamdu wa huwa ala kulli shayin qadeer', translation: 'We have reached the evening and at this very time the whole kingdom belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah alone, without partner.', reference: 'Muslim 4/2088', category: 'evening', occasion: 'Every evening after Asr', tags: ['evening', 'daily'] },
  { id: 12, arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ', transliteration: 'Allahumma bika amsayna wa bika asbahna wa bika nahya wa bika namootu wa ilaykal maseer', translation: 'O Allah, by Your leave we have reached the evening and by Your leave we have reached the morning, by Your leave we live and die and unto You is our return.', reference: 'Tirmidhi 5/466', category: 'evening', occasion: 'Every evening', tags: ['evening', 'daily'] },
  { id: 13, arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', transliteration: 'Aoodhu bikalimatillahit-tammaati min sharri ma khalaq', translation: 'I seek refuge in the perfect words of Allah from the evil of what He has created.', reference: 'Muslim 4/2081', category: 'evening', occasion: 'Say 3 times in the evening', virtue: 'Nothing will harm him that night', tags: ['evening', 'protection'] },

  // ═══════════════════════════════════════════════════════════════
  // SLEEP & WAKING (النوم والاستيقاظ)
  // ═══════════════════════════════════════════════════════════════
  { id: 14, arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', transliteration: 'Bismika Allahumma amootu wa ahya', translation: 'In Your name O Allah, I die and I live.', reference: 'Sahih Bukhari 11/113', category: 'sleep', occasion: 'When going to sleep', tags: ['sleep', 'night'] },
  { id: 15, arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', transliteration: 'Alhamdu lillahil-ladhi ahyana bada ma amatana wa ilayhin-nushoor', translation: 'All praise is for Allah who gave us life after having taken it from us and unto Him is the resurrection.', reference: 'Sahih Bukhari 11/113', category: 'sleep', occasion: 'Upon waking up', tags: ['waking', 'morning'] },
  { id: 16, arabic: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ', transliteration: 'Allahumma qini adhabaka yawma tabathu ibadaka', translation: 'O Allah, protect me from Your punishment on the day You resurrect Your servants.', reference: 'Abu Dawud 4/311', category: 'sleep', occasion: 'Before sleeping — say 3 times', tags: ['sleep', 'protection', 'judgement'] },
  { id: 17, arabic: 'اللَّهُمَّ بِاسْمِكَ أَحْيَا وَبِاسْمِكَ أَمُوتُ', transliteration: 'Allahumma bismika ahya wa bismika amoot', translation: 'O Allah, in Your name I live and in Your name I die.', reference: 'Sahih Bukhari', category: 'sleep', occasion: 'Before sleeping', tags: ['sleep'] },

  // ═══════════════════════════════════════════════════════════════
  // FOOD & DRINK (الطعام والشراب)
  // ═══════════════════════════════════════════════════════════════
  { id: 18, arabic: 'بِسْمِ اللَّهِ', transliteration: 'Bismillah', translation: 'In the name of Allah.', reference: 'Abu Dawud 3/347, Tirmidhi 4/288', category: 'food', occasion: 'Before eating or drinking', virtue: 'Shaytan cannot share in your food when you say Bismillah', tags: ['food', 'eating', 'drinking'] },
  { id: 19, arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ', transliteration: 'Alhamdu lillahil-ladhi atamani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah', translation: 'All praise is for Allah who fed me this and provided it for me without any might or power from myself.', reference: 'Abu Dawud, Tirmidhi, Ibn Majah', category: 'food', occasion: 'After eating', virtue: 'All previous sins are forgiven', tags: ['food', 'after eating', 'forgiveness'] },
  { id: 20, arabic: 'بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ', transliteration: 'Bismillahi awwalahu wa aakhirahu', translation: 'In the name of Allah at the beginning and at the end.', reference: 'Abu Dawud, Tirmidhi', category: 'food', occasion: 'When you forget to say Bismillah before eating', tags: ['food', 'eating'] },
  { id: 21, arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِيهِ وَأَطْعِمْنَا خَيْرًا مِنْهُ', transliteration: 'Allahumma barik lana fihi wa atimna khayran minhu', translation: 'O Allah, bless it for us and feed us better than it.', reference: 'Abu Dawud, Tirmidhi', category: 'food', occasion: 'After drinking milk', tags: ['food', 'milk', 'barakah'] },
  { id: 22, arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ', transliteration: 'Alhamdu lillahil-ladhi atamana wa saqana wa jaalna muslimeen', translation: 'All praise is for Allah who fed us, gave us drink, and made us Muslims.', reference: 'Abu Dawud, Tirmidhi', category: 'food', occasion: 'After eating — general', tags: ['food', 'after eating', 'gratitude'] },

  // ═══════════════════════════════════════════════════════════════
  // TRAVEL (السفر)
  // ═══════════════════════════════════════════════════════════════
  { id: 23, arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ', transliteration: 'Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrineen wa inna ila Rabbina lamunqaliboon', translation: 'Glory to Him who has subjected this to us, and we could never have it by our efforts, and to our Lord we shall surely return.', reference: 'Quran 43:13-14', category: 'travel', occasion: 'When riding any vehicle or transport', tags: ['travel', 'vehicle', 'quran'] },
  { id: 24, arabic: 'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى وَمِنَ الْعَمَلِ مَا تَرْضَى', transliteration: 'Allahumma inna nasaluka fi safarina hadhal birra wat-taqwa wa minal amali ma tarda', translation: 'O Allah, we ask You on this journey for goodness and piety, and for deeds that are pleasing to You.', reference: 'Muslim 2/978', category: 'travel', occasion: 'When starting a journey', tags: ['travel', 'journey'] },
  { id: 25, arabic: 'اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ', transliteration: 'Allahumma hawwin alayna safarana hadha watwi anna budahu', translation: 'O Allah, make this journey easy for us and shorten its distance for us.', reference: 'Muslim 2/978', category: 'travel', occasion: 'During travel', tags: ['travel', 'ease'] },
  { id: 26, arabic: 'الْحَمْدُ لِلَّهِ الَّذِي سَلَّمَنَا وَآوَانَا وَكَفَانَا', transliteration: 'Alhamdu lillahil-ladhi sallamana wa aawana wa kafana', translation: 'All praise is for Allah who kept us safe, sheltered us, and sufficed us.', reference: 'Muslim', category: 'travel', occasion: 'Upon returning from travel', tags: ['travel', 'return', 'gratitude'] },

  // ═══════════════════════════════════════════════════════════════
  // HOME & FAMILY (البيت والأسرة)
  // ═══════════════════════════════════════════════════════════════
  { id: 27, arabic: 'بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى رَبِّنَا تَوَكَّلْنَا', transliteration: 'Bismillahi walajna wa bismillahi kharajna wa ala Rabbina tawakkalna', translation: 'In the name of Allah we enter and in the name of Allah we leave, and upon our Lord we place our trust.', reference: 'Abu Dawud 4/325', category: 'home', occasion: 'When entering the home', tags: ['home', 'entering'] },
  { id: 28, arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', transliteration: 'Bismillahi tawakkaltu alallahi la hawla wa la quwwata illa billah', translation: 'In the name of Allah, I place my trust in Allah, there is no might nor power except with Allah.', reference: 'Abu Dawud 4/325, Tirmidhi 5/490', category: 'home', occasion: 'When leaving the home', virtue: 'It will be said to him: You are guided, defended and protected. The devil will move away from him.', tags: ['home', 'leaving', 'protection'] },
  { id: 29, arabic: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا', transliteration: 'Rabbana hab lana min azwajina wa dhurriyyatina qurrata ayunin wajalna lil-muttaqeena imama', translation: 'Our Lord, grant us from among our wives and offspring comfort to our eyes and make us an example for the righteous.', reference: 'Quran 25:74', category: 'home', occasion: 'Dua for family and children', tags: ['family', 'children', 'spouse', 'quran'] },
  { id: 30, arabic: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ', transliteration: 'Rabbij-alni muqeemas-salati wa min dhurriyyati Rabbana wa taqabbal duaa', translation: 'My Lord, make me an establisher of prayer, and from my descendants. Our Lord, accept my supplication.', reference: 'Quran 14:40', category: 'home', occasion: 'Dua for righteous children', tags: ['children', 'prayer', 'quran'] },

  // ═══════════════════════════════════════════════════════════════
  // HEALTH & HEALING (الصحة والشفاء)
  // ═══════════════════════════════════════════════════════════════
  { id: 31, arabic: 'اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ اشْفِ أَنْتَ الشَّافِي لَا شِفَاءَ إِلَّا شِفَاؤُكَ شِفَاءً لَا يُغَادِرُ سَقَمًا', transliteration: 'Allahumma Rabban-nas, adhhibil-bas, ishfi antash-Shafi, la shifaa illa shifauka, shifaan la yughadiru saqama', translation: 'O Allah, Lord of mankind, remove the illness, cure the disease. You are the One who cures. There is no cure except Your cure — a cure that leaves no illness.', reference: 'Sahih Bukhari 7/131, Muslim', category: 'health', occasion: 'When visiting or praying for a sick person', virtue: 'The Prophet ﷺ used to recite this when visiting the sick', tags: ['health', 'sick', 'healing', 'ruqyah'] },
  { id: 32, arabic: 'أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ', transliteration: 'Asalullaha al-Adheema Rabbal Arshil Adheemi an yashfiyaka', translation: 'I ask Allah the Mighty, Lord of the Mighty Throne, to cure you.', reference: 'Abu Dawud, Tirmidhi (Sahih)', category: 'health', occasion: 'Say 7 times when visiting a sick person', virtue: 'If it is not his time to die, he will be cured', tags: ['health', 'sick', 'visiting'] },
  { id: 33, arabic: 'بِسْمِ اللَّهِ أَرْقِيكَ مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ اللَّهُ يَشْفِيكَ بِسْمِ اللَّهِ أَرْقِيكَ', transliteration: 'Bismillahi arqeeka min kulli shayin yudheeka min sharri kulli nafsin aw aynin hasidin Allahu yashfeeka bismillahi arqeeka', translation: 'In the name of Allah I perform ruqyah for you, from everything that is harming you, from the evil of every soul or envious eye. May Allah heal you, in the name of Allah I perform ruqyah for you.', reference: 'Sahih Muslim 4/1718', category: 'health', occasion: 'Ruqyah — recite over the sick person', tags: ['health', 'ruqyah', 'evil eye', 'healing'] },

  // ═══════════════════════════════════════════════════════════════
  // PROTECTION & RUQYAH (الحماية والرقية)
  // ═══════════════════════════════════════════════════════════════
  { id: 34, arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', transliteration: 'Aoodhu bikalimatillahit-tammaati min sharri ma khalaq', translation: 'I seek refuge in the perfect words of Allah from the evil of what He has created.', reference: 'Muslim 4/2081', category: 'protection', occasion: 'Evening, when stopping at a place, for protection', virtue: 'Nothing will harm him until he leaves that place', tags: ['protection', 'evening', 'travel'] },
  { id: 35, arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ', transliteration: 'Aoodhu bikalimatillahit-tammati min kulli shaytanin wa hammah wa min kulli aynin lammah', translation: 'I seek refuge in the perfect words of Allah from every devil and poisonous creature and from every evil eye.', reference: 'Sahih Bukhari 4/119', category: 'protection', occasion: 'For protecting children — the Prophet ﷺ used this for Hasan and Husayn', tags: ['protection', 'children', 'evil eye', 'shaytan'] },
  { id: 36, arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ', transliteration: 'Allahumma inni aoodhu bika minal-hammi wal-hazani, wa aoodhu bika minal-ajzi wal-kasali, wa aoodhu bika minal-jubni wal-bukhli, wa aoodhu bika min ghalabatid-dayni wa qahrir-rijal', translation: 'O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debts and from being overpowered by men.', reference: 'Sahih Bukhari 7/158', category: 'anxiety', occasion: 'When feeling anxious, worried, or overwhelmed', tags: ['anxiety', 'worry', 'sadness', 'debt', 'protection'] },

  // ═══════════════════════════════════════════════════════════════
  // ANXIETY & DISTRESS (القلق والكرب)
  // ═══════════════════════════════════════════════════════════════
  { id: 37, arabic: 'لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ', transliteration: 'La ilaha illallahul-Adheemul-Haleem, la ilaha illallahu Rabbul-Arshil-Adheem, la ilaha illallahu Rabbus-samawati wa Rabbul-ardi wa Rabbul-Arshil-Kareem', translation: 'None has the right to be worshipped except Allah, the Mighty, the Forbearing. None has the right to be worshipped except Allah, Lord of the Magnificent Throne. None has the right to be worshipped except Allah, Lord of the heavens, Lord of the earth, and Lord of the Noble Throne.', reference: 'Sahih Bukhari 8/154, Muslim 4/2092', category: 'anxiety', occasion: 'When in severe distress or calamity', virtue: 'The Prophet ﷺ would say this at times of distress', tags: ['anxiety', 'distress', 'calamity', 'hardship'] },
  { id: 38, arabic: 'اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ وَأَصْلِحْ لِي شَأْنِي كُلَّهُ لَا إِلَهَ إِلَّا أَنْتَ', transliteration: 'Allahumma rahmataka arju fala takilni ila nafsi tarfata aynin wa aslih li shani kullahu la ilaha illa anta', translation: 'O Allah, it is Your mercy that I hope for, so do not leave me in charge of my affairs even for a blink of an eye, and rectify for me all of my affairs. None has the right to be worshipped except You.', reference: 'Abu Dawud 4/324', category: 'anxiety', occasion: 'When feeling helpless or overwhelmed', tags: ['anxiety', 'helplessness', 'mercy'] },
  { id: 39, arabic: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', transliteration: 'La ilaha illa anta subhanaka inni kuntu minaz-dhalimeen', translation: 'None has the right to be worshipped except You. Glory be to You. Indeed, I have been of the wrongdoers.', reference: 'Quran 21:87, Tirmidhi', category: 'anxiety', occasion: 'Dua of Yunus (AS) — for any difficulty', virtue: 'No Muslim makes this dua for anything except that Allah answers it', tags: ['anxiety', 'distress', 'quran', 'yunus'] },

  // ═══════════════════════════════════════════════════════════════
  // FORGIVENESS (الاستغفار والتوبة)
  // ═══════════════════════════════════════════════════════════════
  { id: 40, arabic: 'رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ', transliteration: 'Rabbana dhalamna anfusana wa in lam taghfir lana wa tarhamna lanakoonanna minal-khasireen', translation: 'Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.', reference: 'Quran 7:23', category: 'forgiveness', occasion: 'Seeking forgiveness — dua of Adam (AS)', tags: ['forgiveness', 'repentance', 'quran', 'adam'] },
  { id: 41, arabic: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ', transliteration: 'Rabbighfir li wa tub alayya innaka antat-Tawwabur-Raheem', translation: 'My Lord, forgive me and accept my repentance. You are the Acceptor of Repentance, the Most Merciful.', reference: 'Abu Dawud, Tirmidhi (Sahih)', category: 'forgiveness', occasion: 'General istighfar — say frequently', virtue: 'The Prophet ﷺ would say this 100 times in a single gathering', tags: ['forgiveness', 'repentance', 'daily'] },
  { id: 42, arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي', transliteration: 'Allahumma innaka Afuwwun tuhibbul afwa fafu anni', translation: 'O Allah, You are Forgiving and love forgiveness, so forgive me.', reference: 'Tirmidhi (Sahih)', category: 'forgiveness', occasion: 'Laylatul Qadr and anytime seeking forgiveness', virtue: 'The Prophet ﷺ taught Aisha (RA) this dua specifically for Laylatul Qadr', tags: ['forgiveness', 'laylatul qadr', 'ramadan'] },

  // ═══════════════════════════════════════════════════════════════
  // PRAYER & WORSHIP (الصلاة والعبادة)
  // ═══════════════════════════════════════════════════════════════
  { id: 43, arabic: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ', transliteration: 'Rabbij-alni muqeemas-salati wa min dhurriyyati Rabbana wa taqabbal duaa', translation: 'My Lord, make me an establisher of prayer, and from my descendants. Our Lord, and accept my supplication.', reference: 'Quran 14:40', category: 'prayer', occasion: 'Dua for consistency in prayer', tags: ['prayer', 'salah', 'quran'] },
  { id: 44, arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ', transliteration: 'Subhanaka Allahumma wa bihamdika ashhadu an la ilaha illa anta astaghfiruka wa atoobu ilayk', translation: 'Glory is to You O Allah, and praise. I bear witness that none has the right to be worshipped except You. I seek Your forgiveness and turn to You in repentance.', reference: 'Abu Dawud, Tirmidhi, Nasai (Sahih)', category: 'prayer', occasion: 'Kaffaratul Majlis — when leaving any gathering', virtue: 'Expiation for what occurred in that gathering', tags: ['prayer', 'gathering', 'forgiveness'] },
  { id: 45, arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar', translation: 'Our Lord, give us in this world that which is good and in the Hereafter that which is good, and protect us from the punishment of the Fire.', reference: 'Quran 2:201', category: 'prayer', occasion: 'The most comprehensive dua — recite anytime', virtue: 'The most frequent dua of the Prophet ﷺ', tags: ['prayer', 'comprehensive', 'quran', 'popular'] },

  // ═══════════════════════════════════════════════════════════════
  // RIZQ & PROVISION (الرزق)
  // ═══════════════════════════════════════════════════════════════
  { id: 46, arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا', transliteration: 'Allahumma inni asaluka ilman naafian wa rizqan tayyiban wa amalan mutaqabbala', translation: 'O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds.', reference: 'Ibn Majah (Sahih)', category: 'rizq', occasion: 'After Fajr prayer', tags: ['rizq', 'knowledge', 'morning', 'provision'] },
  { id: 47, arabic: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ', transliteration: 'Allahummak-fini bihalalika an haramika wa aghnini bifadlika amman siwaka', translation: 'O Allah, suffice me with what You have allowed instead of what You have forbidden, and make me independent of all others besides You.', reference: 'Tirmidhi 5/560 (Hasan)', category: 'rizq', occasion: 'When in debt or financial difficulty', virtue: 'Even if you had a debt as large as a mountain, Allah would pay it off for you', tags: ['rizq', 'debt', 'halal', 'provision'] },

  // ═══════════════════════════════════════════════════════════════
  // KNOWLEDGE (العلم)
  // ═══════════════════════════════════════════════════════════════
  { id: 48, arabic: 'رَبِّ زِدْنِي عِلْمًا', transliteration: 'Rabbi zidni ilma', translation: 'My Lord, increase me in knowledge.', reference: 'Quran 20:114', category: 'knowledge', occasion: 'Before studying, exams, or seeking knowledge', tags: ['knowledge', 'study', 'quran', 'exam'] },
  { id: 49, arabic: 'اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي وَعَلِّمْنِي مَا يَنْفَعُنِي وَزِدْنِي عِلْمًا', transliteration: 'Allahumma-nfani bima allamtani wa allimni ma yanfauni wa zidni ilma', translation: 'O Allah, benefit me with what You have taught me, teach me what will benefit me, and increase me in knowledge.', reference: 'Tirmidhi, Ibn Majah (Hasan)', category: 'knowledge', occasion: 'After studying or learning something new', tags: ['knowledge', 'study', 'beneficial'] },

  // ═══════════════════════════════════════════════════════════════
  // ISLAMIC EVENTS (المناسبات)
  // ═══════════════════════════════════════════════════════════════
  { id: 50, arabic: 'اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْأَمْنِ وَالْإِيمَانِ وَالسَّلَامَةِ وَالْإِسْلَامِ رَبِّي وَرَبُّكَ اللَّهُ', transliteration: 'Allahumma ahillahu alayna bil-amni wal-iman was-salamati wal-Islam Rabbi wa Rabbukallah', translation: 'O Allah, let this moon appear on us with security and faith, with safety and Islam. My Lord and your Lord is Allah.', reference: 'Tirmidhi 5/504 (Hasan)', category: 'events', occasion: 'When seeing the new crescent moon (start of new month)', tags: ['events', 'moon', 'new month', 'ramadan'] },
];

// Update category counts
import { DUAS_EXTENDED } from './duaDatabase2';
import { DUAS_BATCH3 } from './duaDatabase3';
import { DUAS_BATCH4 } from './duaDatabase4';
import { DUAS_BATCH5 } from './duaDatabase5';

// Merge extended duas into main array
DUAS.push(...DUAS_EXTENDED);
DUAS.push(...DUAS_BATCH3);
DUAS.push(...DUAS_BATCH4);
DUAS.push(...DUAS_BATCH5);

DUA_CATEGORIES.forEach(cat => {
  cat.count = DUAS.filter(d => d.category === cat.id).length;
});
