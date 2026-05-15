'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ==================== NUMEROLOGY ====================
function reduce(n: number): number {
  while (n > 9) n = n.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  return n === 0 ? 9 : n;
}
function getLifeNumber(day: number, month: number, year: number): number {
  return reduce(`${day}${month}${year}`.split('').reduce((a, b) => a + parseInt(b), 0));
}
function getSoulNumber(day: number): number { return reduce(day); }
function getDestinyNumber(month: number, year: number): number {
  return reduce(`${month}${year}`.split('').reduce((a, b) => a + parseInt(b), 0));
}
function isValidDate(d: number, m: number, y: number): boolean {
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d && y >= 1900 && y <= new Date().getFullYear();
}

// ==================== ARCHETYPES ====================
const ARCHETYPES: Record<number, {
  name: string; arabic: string; title: string;
  divineName: string; divineArabic: string;
  verse: string; verseRef: string;
  color: string; pageGrad: string; cardGrad: string;
  symbol: string; emoji: string;
  personality: string; strength: string[];
  challenge: string; rizq: string;
  relationship: string; purpose: string;
  dhikr: string; dhikrArabic: string; dhikrCount: number;
  companions: number[]; incompatible: number[];
  compatibilityReason: string;
  dailyVerses: { verse: string; ref: string; reflection: string }[];
  prophetExample: string;
  estimatedUsers: number;
}> = {
  1: {
    name: 'Al-Awwal', arabic: 'الأَوَّل', title: 'The Pioneer',
    divineName: 'Al-Wahid', divineArabic: 'الْوَاحِدُ',
    verse: 'He is the First and the Last, the Evident and the Hidden.',
    verseRef: 'Quran 57:3',
    color: '#c8a96e',
    pageGrad: 'linear-gradient(160deg, #1c1000 0%, #2a1a00 50%, #1a1000 100%)',
    cardGrad: 'linear-gradient(135deg, #3a2500, #1a1000)',
    symbol: '☀️', emoji: '🌟',
    personality: 'You are a natural leader with a pioneering spirit. Born to walk paths others have not yet discovered, you carry the light of originality. Like Sayyiduna Ibrahim ﷺ who stood alone against his people, you have the courage to stand for truth even in solitude.',
    strength: ['Natural leadership', 'Original thinking', 'Unwavering conviction', 'Divine courage'],
    challenge: 'Your challenge is patience with those who move slower. Practice Shura — consulting others even when you know the way.',
    rizq: 'Your wealth flows through leadership roles, entrepreneurship, and independent ventures. Allah has written rizq in paths you create yourself.',
    relationship: 'You love deeply and protect fiercely. You seek a partner who respects your independence and matches your spiritual ambition.',
    purpose: 'To illuminate new paths for the Ummah. You are here to start things, to be the first, to show others what is possible.',
    dhikr: 'Ya Wahid', dhikrArabic: 'يَا وَاحِدُ', dhikrCount: 1000,
    companions: [3, 5, 9], incompatible: [4, 8],
    compatibilityReason: 'Pioneers thrive with creative Illuminators (3), adventurous Voyagers (5), and wise Completers (9) who match their vision.',
    prophetExample: 'Like Sayyiduna Ibrahim ﷺ — the first to stand alone for truth.',
    estimatedUsers: 18743,
    dailyVerses: [
      { verse: 'Indeed, with hardship will be ease.', ref: 'Quran 94:6', reflection: 'Your path is new — ease is already written into your struggle.' },
      { verse: 'And He found you lost and guided you.', ref: 'Quran 93:7', reflection: 'Even pioneers need guidance. Turn to Allah before every new step.' },
      { verse: 'Say: My Lord, increase me in knowledge.', ref: 'Quran 20:114', reflection: 'Leadership without knowledge is dangerous. Seek first, then lead.' },
      { verse: 'We have already written in the Psalms that the righteous will inherit the earth.', ref: 'Quran 21:105', reflection: 'What you build in righteousness will outlast you.' },
      { verse: 'So be patient. Indeed, the promise of Allah is truth.', ref: 'Quran 30:60', reflection: 'Your vision is correct. The timing is Allah\'s, not yours.' },
      { verse: 'Do not weaken and do not grieve, and you will be superior if you are believers.', ref: 'Quran 3:139', reflection: 'Pioneers face opposition. Your Iman is your armour.' },
      { verse: 'Indeed, Allah will not change the condition of a people until they change what is in themselves.', ref: 'Quran 13:11', reflection: 'Every great change starts inside you.' },
    ],
  },
  2: {
    name: 'Al-Tawazun', arabic: 'التَّوَازُن', title: 'The Peacemaker',
    divineName: 'Al-Lateef', divineArabic: 'اللَّطِيفُ',
    verse: 'And He is the Subtle, the All-Aware.',
    verseRef: 'Quran 67:14',
    color: '#7eb8d4',
    pageGrad: 'linear-gradient(160deg, #001828 0%, #002035 50%, #001525 100%)',
    cardGrad: 'linear-gradient(135deg, #003050, #001525)',
    symbol: '🌊', emoji: '🕊️',
    personality: 'You are the bridge between worlds — gifted with deep empathy and a rare ability to bring harmony to chaos. Like water that finds its level, you naturally restore balance. The Prophet ﷺ said "Gentleness adorns everything" — this is your nature.',
    strength: ['Deep empathy', 'Peacemaking', 'Intuitive wisdom', 'Gentle strength'],
    challenge: 'Your challenge is over-giving. Your own spiritual cup must be full before you pour into others. Setting limits is not selfishness — it is wisdom.',
    rizq: 'Your wealth flows through partnerships, counselling, healing, and serving others. Collaborative ventures bring your greatest blessings.',
    relationship: 'You are the most devoted partner. You feel deeply and love completely. Seek someone who appreciates your sensitivity.',
    purpose: 'To heal divisions in the Ummah. You are here to reconcile, to listen, to carry the pain of others and return it as hope.',
    dhikr: 'Ya Lateef', dhikrArabic: 'يَا لَطِيفُ', dhikrCount: 129,
    companions: [4, 6, 8], incompatible: [1, 5],
    compatibilityReason: 'Peacemakers harmonise beautifully with steady Builders (4), nurturing Nurturers (6), and commanding Commanders (8) who need their balance.',
    prophetExample: 'Like Sayyida Khadijah RA — the first to believe, the one who brought peace to the Prophet ﷺ.',
    estimatedUsers: 22156,
    dailyVerses: [
      { verse: 'And speak to people good words.', ref: 'Quran 2:83', reflection: 'Your words are medicine. Choose them with the care of a healer.' },
      { verse: 'And the servants of the Most Merciful are those who walk upon the earth easily.', ref: 'Quran 25:63', reflection: 'Gentleness is not weakness. It is the way of the beloved.' },
      { verse: 'Repel evil by that which is better.', ref: 'Quran 41:34', reflection: 'Your superpower is responding to hardness with softness.' },
      { verse: 'And reconciliation is best.', ref: 'Quran 4:128', reflection: 'When in doubt, choose peace.' },
      { verse: 'Allah does not burden a soul beyond that it can bear.', ref: 'Quran 2:286', reflection: 'You carry others\' pain. Remember you also have a limit.' },
      { verse: 'And He has put between you affection and mercy.', ref: 'Quran 30:21', reflection: 'Your relationships are a sign of Allah\'s mercy. Cherish them.' },
      { verse: 'Be patient, for the patience of Allah is greater than your patience.', ref: 'Hadith', reflection: 'When you feel unseen, Allah sees every act of gentleness.' },
    ],
  },
  3: {
    name: 'Al-Bayaan', arabic: 'البَيَان', title: 'The Illuminator',
    divineName: 'Al-Nur', divineArabic: 'النُّورُ',
    verse: 'Allah is the Light of the heavens and the earth.',
    verseRef: 'Quran 24:35',
    color: '#f0c040',
    pageGrad: 'linear-gradient(160deg, #1a1600 0%, #2a2200 50%, #1a1600 100%)',
    cardGrad: 'linear-gradient(135deg, #3a2e00, #1a1600)',
    symbol: '✨', emoji: '🌙',
    personality: 'You are a bearer of light — eloquent, expressive, and touched with divine creativity. Your words carry weight and your presence lifts rooms. Like the companions who memorised and spread the Quran, you are built to carry sacred knowledge forward.',
    strength: ['Eloquence and expression', 'Creative vision', 'Inspiring others', 'Joy and optimism'],
    challenge: 'Your challenge is focus. Your gifts are many and the world pulls you in many directions. Choose your calling with intention and go deep.',
    rizq: 'Your wealth flows through communication, teaching, writing, art, and dawah. Your voice and creativity are your greatest assets.',
    relationship: 'You need a partner who stimulates your mind and appreciates your creativity. You give joy freely — seek someone who gives it back.',
    purpose: 'To spread the light of Islam through beauty and expression. You are here to make the truth irresistible.',
    dhikr: 'Ya Nur', dhikrArabic: 'يَا نُورُ', dhikrCount: 1001,
    companions: [1, 5, 7], incompatible: [4, 6],
    compatibilityReason: 'Illuminators shine brightest alongside pioneering Leaders (1), free-spirited Voyagers (5), and deep-thinking Seekers (7) who appreciate their light.',
    prophetExample: 'Like Hassan ibn Thabit RA — the poet of the Prophet ﷺ, who weaponised beauty for truth.',
    estimatedUsers: 15892,
    dailyVerses: [
      { verse: 'The Most Merciful taught the Quran, created man, and taught him eloquence.', ref: 'Quran 55:1-4', reflection: 'Your gift of expression is directly from Allah. Use it for Him.' },
      { verse: 'And who is better in speech than one who invites to Allah?', ref: 'Quran 41:33', reflection: 'Your highest calling is making Islam beautiful through your words.' },
      { verse: 'We have made it easy for remembrance, so is there anyone who will remember?', ref: 'Quran 54:17', reflection: 'You are here to make remembrance easy for others.' },
      { verse: 'The parable of a good word is like a good tree.', ref: 'Quran 14:24', reflection: 'Your creative works are seeds. Plant them with intention.' },
      { verse: 'Say: If the sea were ink for writing the words of my Lord, it would run out.', ref: 'Quran 18:109', reflection: 'There is infinite knowledge to express. You will never run out of material.' },
      { verse: 'Read in the name of your Lord who created.', ref: 'Quran 96:1', reflection: 'All creation starts with reading. Begin every creative act with Allah\'s name.' },
      { verse: 'And He taught Adam the names of all things.', ref: 'Quran 2:31', reflection: 'Language is a divine gift. The first thing Allah gave humans was the ability to name.' },
    ],
  },
  4: {
    name: 'Al-Itqan', arabic: 'الإِتْقَان', title: 'The Builder',
    divineName: 'Al-Matin', divineArabic: 'الْمَتِينُ',
    verse: 'Indeed, Allah loves those who act with excellence.',
    verseRef: 'Quran 2:195',
    color: '#7ab87a',
    pageGrad: 'linear-gradient(160deg, #021008 0%, #041a0c 50%, #021008 100%)',
    cardGrad: 'linear-gradient(135deg, #063018, #021008)',
    symbol: '🏔️', emoji: '🏗️',
    personality: 'You are the foundation upon which communities are built. Reliable, disciplined, and tireless, you embody Itqan — doing everything with excellence. The Prophet ﷺ said "Allah loves when one of you does a job, to do it with Itqan." That is you.',
    strength: ['Unshakeable discipline', 'Trustworthiness', 'Practical wisdom', 'Long-term vision'],
    challenge: 'Your challenge is rigidity. Even in worship, Allah made concessions for travellers. Learn to bend without breaking.',
    rizq: 'Your wealth flows through steady, long-term work. You build things that last. Real estate, structured businesses, and skilled crafts are your domain.',
    relationship: 'You are the most loyal partner — your word is your bond. Seek someone who values consistency over excitement.',
    purpose: 'To build lasting structures for the Ummah — institutions, families, businesses, and communities that outlive you.',
    dhikr: 'Ya Matin', dhikrArabic: 'يَا مَتِينُ', dhikrCount: 500,
    companions: [2, 6, 8], incompatible: [3, 5],
    compatibilityReason: 'Builders ground themselves with harmonious Peacemakers (2), warm Nurturers (6), and ambitious Commanders (8) who share their drive.',
    prophetExample: 'Like Salman al-Farisi RA — the brilliant strategist who built the trench that saved Madinah.',
    estimatedUsers: 19234,
    dailyVerses: [
      { verse: 'And that there is not for man except that for which he strives.', ref: 'Quran 53:39', reflection: 'Your effort is your legacy. Every brick you lay is recorded.' },
      { verse: 'Do good as Allah has done good to you.', ref: 'Quran 28:77', reflection: 'Excellence is a response to Allah\'s generosity, not a competition.' },
      { verse: 'And your Lord is not ever unjust to His servants.', ref: 'Quran 41:46', reflection: 'Every honest day of work is seen. Nothing is wasted with Allah.' },
      { verse: 'We will surely test you with something of fear and hunger.', ref: 'Quran 2:155', reflection: 'Builders are tested through the long haul. Patience is your superpower.' },
      { verse: 'Whoever does righteousness — it is for his own soul.', ref: 'Quran 41:46', reflection: 'Build for Allah first. The worldly recognition is secondary.' },
      { verse: 'And prepare against them whatever you are able of strength.', ref: 'Quran 8:60', reflection: 'Preparation is worship. Being ready is an act of trust in Allah.' },
      { verse: 'He who has made for you the earth a bed and the sky a ceiling.', ref: 'Quran 2:22', reflection: 'Allah is the ultimate Builder. You reflect His attribute of Matin.' },
    ],
  },
  5: {
    name: 'Al-Hurriyyah', arabic: 'الحُرِّيَّة', title: 'The Voyager',
    divineName: 'Al-Fattah', divineArabic: 'الْفَتَّاحُ',
    verse: 'Say: Travel through the land and observe how He began creation.',
    verseRef: 'Quran 29:20',
    color: '#c07ec0',
    pageGrad: 'linear-gradient(160deg, #180a20 0%, #240f30 50%, #180a20 100%)',
    cardGrad: 'linear-gradient(135deg, #380f4a, #180a20)',
    symbol: '🌍', emoji: '🧭',
    personality: 'You are the free spirit of the Ummah — adaptable, curious, and drawn to the horizons of this world. Like Ibn Battuta and Ibn Khaldun who mapped the world for knowledge, you learn by experiencing.',
    strength: ['Adaptability', 'Courage to explore', 'Cross-cultural wisdom', 'Infectious enthusiasm'],
    challenge: 'Your challenge is rootedness. Freedom without anchor becomes drift. Establish your daily Salah as the five pillars that hold your life steady.',
    rizq: 'Your wealth flows through travel, trade, diverse ventures, and connecting people across cultures. Your network is your net worth.',
    relationship: 'You need a partner who gives you wings, not chains. Seek someone who travels the inner and outer worlds with you.',
    purpose: 'To spread Islam across cultures and borders — to be a living bridge between the Ummah and the world.',
    dhikr: 'Ya Fattah', dhikrArabic: 'يَا فَتَّاحُ', dhikrCount: 489,
    companions: [1, 3, 7], incompatible: [4, 2],
    compatibilityReason: 'Voyagers journey best with pioneering Leaders (1), expressive Illuminators (3), and intellectual Seekers (7) who match their curiosity.',
    prophetExample: 'Like Ibn Battuta — who travelled 75,000 miles in the name of knowledge and Islam.',
    estimatedUsers: 14567,
    dailyVerses: [
      { verse: 'Say: Travel through the land and observe.', ref: 'Quran 29:20', reflection: 'Your journeys are commanded by Allah. Travel with purpose.' },
      { verse: 'And of His signs is the creation of the heavens and the earth.', ref: 'Quran 30:22', reflection: 'Every new place you visit is a new sign of Allah.' },
      { verse: 'So flee to Allah.', ref: 'Quran 51:50', reflection: 'The ultimate journey is always toward Allah.' },
      { verse: 'He who goes out seeking knowledge is in the path of Allah.', ref: 'Hadith — Tirmidhi', reflection: 'Every journey for knowledge is a journey for Allah.' },
      { verse: 'And We sent you not except as a mercy to the worlds.', ref: 'Quran 21:107', reflection: 'Wherever you go, carry mercy. That is your gift to every land.' },
      { verse: 'And put your trust in Allah, and sufficient is Allah as Disposer of affairs.', ref: 'Quran 33:3', reflection: 'The best travel companion is tawakkul.' },
      { verse: 'We will show them Our signs in the horizons.', ref: 'Quran 41:53', reflection: 'Allah promises to reveal Himself in the world\'s horizons. You are looking.' },
    ],
  },
  6: {
    name: 'Al-Rahma', arabic: 'الرَّحْمَة', title: 'The Nurturer',
    divineName: 'Al-Wadud', divineArabic: 'الْوَدُودُ',
    verse: 'And We have not sent you except as a mercy to the worlds.',
    verseRef: 'Quran 21:107',
    color: '#e87898',
    pageGrad: 'linear-gradient(160deg, #200510 0%, #300810 50%, #200510 100%)',
    cardGrad: 'linear-gradient(135deg, #4a0820, #200510)',
    symbol: '🌹', emoji: '💗',
    personality: 'You carry the divine quality of Rahma — mercy — as your defining trait. Like a mother\'s love that knows no conditions, you give without keeping score. The Prophet ﷺ was described as "rahmatun lil-alameen" — this quality lives strongly in you.',
    strength: ['Unconditional compassion', 'Healing presence', 'Community building', 'Generous heart'],
    challenge: 'Your challenge is learning that mercy also means sometimes saying no. Enabling is not mercy. The most merciful act is sometimes the difficult one.',
    rizq: 'Your wealth flows through caring professions, family businesses, hospitality, and community work. Your home is your greatest investment.',
    relationship: 'You are the heart of every family. You love deeply and create sanctuaries of peace. Seek a partner who cherishes your nurturing nature.',
    purpose: 'To embody the Rahma of Islam in every interaction — to be the reason someone feels Allah\'s love through you.',
    dhikr: 'Ya Wadud', dhikrArabic: 'يَا وَدُودُ', dhikrCount: 33,
    companions: [2, 4, 9], incompatible: [1, 7],
    compatibilityReason: 'Nurturers bloom alongside gentle Peacemakers (2), reliable Builders (4), and wise Completers (9) who value their warmth.',
    prophetExample: 'Like Sayyida Fatimah RA — the daughter of the Prophet ﷺ, embodiment of mercy and devotion.',
    estimatedUsers: 24891,
    dailyVerses: [
      { verse: 'Your Lord has decreed that you worship none but Him, and be kind to parents.', ref: 'Quran 17:23', reflection: 'Mercy begins at home. Who in your family needs your care today?' },
      { verse: 'Allah is gentle and loves gentleness in all matters.', ref: 'Hadith — Bukhari', reflection: 'Your gentleness is beloved to Allah. It is not weakness.' },
      { verse: 'The best of you are those who are best to their families.', ref: 'Hadith', reflection: 'Your home is your greatest legacy. Invest in it with your whole heart.' },
      { verse: 'Whoever does not show mercy will not be shown mercy.', ref: 'Hadith — Bukhari', reflection: 'Mercy is a currency. The more you give, the more returns from Allah.' },
      { verse: 'My mercy encompasses all things.', ref: 'Quran 7:156', reflection: 'You reflect Al-Rahman. Your mercy is a drop from His infinite ocean.' },
      { verse: 'And He has put between you affection and mercy.', ref: 'Quran 30:21', reflection: 'Your loving relationships are a literal sign from Allah.' },
      { verse: 'The believers in their mutual kindness are like a body.', ref: 'Hadith — Bukhari', reflection: 'When any part of the Ummah hurts, you feel it. That is your gift.' },
    ],
  },
  7: {
    name: 'Al-Hikmah', arabic: 'الحِكْمَة', title: 'The Seeker',
    divineName: 'Al-Alim', divineArabic: 'اَلْعَلِيمُ',
    verse: 'And He taught you what you did not know. And the favour of Allah upon you has been great.',
    verseRef: 'Quran 4:113',
    color: '#6898e8',
    pageGrad: 'linear-gradient(160deg, #020e22 0%, #041530 50%, #020e22 100%)',
    cardGrad: 'linear-gradient(135deg, #082545, #020e22)',
    symbol: '🔭', emoji: '📚',
    personality: 'You are the scholar, the contemplative, the seeker of divine wisdom. You were born to go deep — into books, into prayer, into the mysteries of existence. Like Imam Ghazali who retreated to find truth, you find God in silence and study.',
    strength: ['Profound intellect', 'Spiritual depth', 'Pattern recognition', 'Quiet wisdom'],
    challenge: 'Wisdom that stays in your mind helps no one. The Prophet ﷺ said "convey from me even one verse." Share what you know.',
    rizq: 'Your wealth flows through knowledge-based work — research, scholarship, medicine, law, and any field requiring deep expertise.',
    relationship: 'You need depth, not surface. Seek a partner who can sit in comfortable silence and engage in meaningful conversation.',
    purpose: 'To be a bridge between divine knowledge and the Ummah — to make the complex simple and bring people closer to Allah.',
    dhikr: 'Ya Alim', dhikrArabic: 'يَا عَلِيمُ', dhikrCount: 150,
    companions: [3, 5, 9], incompatible: [6, 8],
    compatibilityReason: 'Seekers connect deeply with creative Illuminators (3), curious Voyagers (5), and visionary Completers (9) who match their depth.',
    prophetExample: 'Like Imam al-Ghazali — who retreated from the world to understand it more deeply than anyone.',
    estimatedUsers: 16234,
    dailyVerses: [
      { verse: 'My Lord, increase me in knowledge.', ref: 'Quran 20:114', reflection: 'Every morning this is your du\'a. Knowledge is your worship.' },
      { verse: 'Are those who know equal to those who do not know?', ref: 'Quran 39:9', reflection: 'Your pursuit of knowledge answers Allah\'s question.' },
      { verse: 'Allah will raise up those who have believed and those given knowledge, by degrees.', ref: 'Quran 58:11', reflection: 'Your learning is an ascent toward Allah.' },
      { verse: 'Indeed, in the alternation of the night and the day are signs for those of understanding.', ref: 'Quran 3:190', reflection: 'The universe is a book. You were made to read it.' },
      { verse: 'He gives wisdom to whom He wills, and whoever is given wisdom has certainly been given much good.', ref: 'Quran 2:269', reflection: 'Your wisdom is a direct gift from Allah. It is an amanah.' },
      { verse: 'Read! In the name of your Lord who created.', ref: 'Quran 96:1', reflection: 'The first revelation was a command for you. Never stop reading.' },
      { verse: 'And they ask you about the soul. Say: The soul is from the affair of my Lord.', ref: 'Quran 17:85', reflection: 'Seekers learn the peace of not knowing.' },
    ],
  },
  8: {
    name: 'Al-Quwwah', arabic: 'القُوَّة', title: 'The Commander',
    divineName: 'Al-Qawi', divineArabic: 'الْقَوِيُّ',
    verse: 'Indeed, the strong believer is more beloved to Allah than the weak believer.',
    verseRef: 'Sahih Muslim',
    color: '#e85858',
    pageGrad: 'linear-gradient(160deg, #1e0200 0%, #2e0400 50%, #1e0200 100%)',
    cardGrad: 'linear-gradient(135deg, #4a0800, #1e0200)',
    symbol: '⚔️', emoji: '🦅',
    personality: 'You carry the strength of mountains and the ambition of eagles. You were built for authority, for impact, for changing the world at scale. Like Umar ibn al-Khattab RA whose conversion shifted the entire power of early Islam, your strength is a divine gift.',
    strength: ['Commanding presence', 'Strategic mind', 'Extraordinary drive', 'Transformative vision'],
    challenge: 'Your challenge is the ego. The greatest leaders in Islam were known for their humility in private. Strength must always serve others.',
    rizq: 'Your wealth flows through business empires, leadership positions, and ventures that operate at scale. You are built for significant financial responsibility.',
    relationship: 'You need a partner who is your equal in strength — who challenges and supports you. Never mistake softness for weakness.',
    purpose: 'To be a force for justice in the world — to use your power to lift the Ummah and establish what is right.',
    dhikr: 'Ya Qawi', dhikrArabic: 'يَا قَوِيُّ', dhikrCount: 116,
    companions: [2, 4, 6], incompatible: [1, 9],
    compatibilityReason: 'Commanders are balanced by gentle Peacemakers (2), grounded Builders (4), and compassionate Nurturers (6) who soften their edges.',
    prophetExample: 'Like Umar ibn al-Khattab RA — whose very strength became a pillar of the early Islamic state.',
    estimatedUsers: 17456,
    dailyVerses: [
      { verse: 'Indeed, the strong believer is more beloved to Allah than the weak believer.', ref: 'Sahih Muslim', reflection: 'Your strength is wanted. Use it in Allah\'s service.' },
      { verse: 'And prepare against them whatever you are able of strength.', ref: 'Quran 8:60', reflection: 'Your drive to build power has divine sanction.' },
      { verse: 'And do not weaken in pursuit of the enemy.', ref: 'Quran 4:104', reflection: 'Commanders don\'t quit. Your persistence is a form of worship.' },
      { verse: 'Indeed, the noblest of you in the sight of Allah is the most righteous of you.', ref: 'Quran 49:13', reflection: 'Power is measured in taqwa, not wealth or authority.' },
      { verse: 'Justice belongs to Allah.', ref: 'Quran 6:62', reflection: 'Ultimate justice belongs to Allah alone. Your job is to pursue it.' },
      { verse: 'And He is the Oft-Forgiving, the Loving.', ref: 'Quran 85:14', reflection: 'The strongest act a Commander can perform is to forgive.' },
      { verse: 'O you who have believed, stand firmly for justice.', ref: 'Quran 4:135', reflection: 'Stand firm, even when it costs you.' },
    ],
  },
  9: {
    name: 'Al-Kamal', arabic: 'الكَمَال', title: 'The Completer',
    divineName: 'Al-Jami', divineArabic: 'الْجَامِعُ',
    verse: 'This day I have perfected for you your religion and completed My favour upon you.',
    verseRef: 'Quran 5:3',
    color: '#a878e8',
    pageGrad: 'linear-gradient(160deg, #0e0420 0%, #180630 50%, #0e0420 100%)',
    cardGrad: 'linear-gradient(135deg, #2a0850, #0e0420)',
    symbol: '🌌', emoji: '♾️',
    personality: 'You are the completion — the one who brings things full circle. Nine is the number of perfection in Islamic numerology. You carry an old soul, a humanitarian heart, and a vision that transcends borders. You feel the pain of the entire Ummah.',
    strength: ['Universal compassion', 'Visionary thinking', 'Spiritual completion', 'Timeless wisdom'],
    challenge: 'Your challenge is endings — you must learn to let go. Trust Allah with what has passed.',
    rizq: 'Your wealth flows through service to humanity, philanthropic leadership, and work that has global impact.',
    relationship: 'You love all of humanity and can struggle to give one person the totality of that love. Seek a partner who understands your vast heart.',
    purpose: 'To complete what others began — to be the final piece that makes the Ummah whole.',
    dhikr: 'Subhan Allah wa bihamdihi', dhikrArabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', dhikrCount: 100,
    companions: [1, 6, 7], incompatible: [5, 8],
    compatibilityReason: 'Completers find their match in visionary Pioneers (1), compassionate Nurturers (6), and deep Seekers (7) who share their wisdom.',
    prophetExample: 'Like Imam Ali RA — the completion of knowledge, whose wisdom gathered all the threads of early Islam.',
    estimatedUsers: 13978,
    dailyVerses: [
      { verse: 'This day I have perfected for you your religion.', ref: 'Quran 5:3', reflection: 'Completion is Allah\'s signature. Use it to finish what matters.' },
      { verse: 'And the Hereafter is better for you than the first life.', ref: 'Quran 93:4', reflection: 'The completion that matters most is your akhirah.' },
      { verse: 'Every soul will taste death.', ref: 'Quran 3:185', reflection: 'You think about endings. That awareness makes your time meaningful.' },
      { verse: 'Indeed, to Allah we belong and to Him we shall return.', ref: 'Quran 2:156', reflection: 'The ultimate completion is return. You\'re always heading home.' },
      { verse: 'Is there any reward for good other than good?', ref: 'Quran 55:60', reflection: 'What you give returns perfectly completed in the akhirah.' },
      { verse: 'He who leaves behind knowledge by which people benefit after his death will have ongoing reward.', ref: 'Hadith — Muslim', reflection: 'Your legacy is your completion. What will remain when you\'re gone?' },
      { verse: 'Allah does not burden a soul beyond that it can bear.', ref: 'Quran 2:286', reflection: 'You don\'t have to carry the whole world.' },
    ],
  },
};

// Sub-archetype titles for 81 unique combinations
const SUB_TITLES: Record<string, string> = {
  '1-1': 'The Solitary Pioneer', '1-2': 'The Gentle Pioneer', '1-3': 'The Creative Pioneer',
  '1-4': 'The Disciplined Pioneer', '1-5': 'The Adventurous Pioneer', '1-6': 'The Compassionate Pioneer',
  '1-7': 'The Wise Pioneer', '1-8': 'The Powerful Pioneer', '1-9': 'The Complete Pioneer',
  '2-1': 'The Courageous Peacemaker', '2-2': 'The Pure Peacemaker', '2-3': 'The Expressive Peacemaker',
  '2-4': 'The Steadfast Peacemaker', '2-5': 'The Free Peacemaker', '2-6': 'The Merciful Peacemaker',
  '2-7': 'The Contemplative Peacemaker', '2-8': 'The Strong Peacemaker', '2-9': 'The Universal Peacemaker',
  '3-1': 'The Leading Illuminator', '3-2': 'The Healing Illuminator', '3-3': 'The Pure Illuminator',
  '3-4': 'The Grounded Illuminator', '3-5': 'The Travelling Illuminator', '3-6': 'The Loving Illuminator',
  '3-7': 'The Scholarly Illuminator', '3-8': 'The Bold Illuminator', '3-9': 'The Visionary Illuminator',
  '4-1': 'The Pioneering Builder', '4-2': 'The Harmonious Builder', '4-3': 'The Creative Builder',
  '4-4': 'The Master Builder', '4-5': 'The Versatile Builder', '4-6': 'The Nurturing Builder',
  '4-7': 'The Wise Builder', '4-8': 'The Commanding Builder', '4-9': 'The Legacy Builder',
  '5-1': 'The Leading Voyager', '5-2': 'The Peaceful Voyager', '5-3': 'The Artistic Voyager',
  '5-4': 'The Structured Voyager', '5-5': 'The Pure Voyager', '5-6': 'The Caring Voyager',
  '5-7': 'The Seeking Voyager', '5-8': 'The Bold Voyager', '5-9': 'The Completing Voyager',
  '6-1': 'The Pioneering Nurturer', '6-2': 'The Gentle Nurturer', '6-3': 'The Expressive Nurturer',
  '6-4': 'The Devoted Nurturer', '6-5': 'The Free Nurturer', '6-6': 'The Pure Nurturer',
  '6-7': 'The Wise Nurturer', '6-8': 'The Powerful Nurturer', '6-9': 'The Universal Nurturer',
  '7-1': 'The Pioneer Seeker', '7-2': 'The Peaceful Seeker', '7-3': 'The Inspired Seeker',
  '7-4': 'The Grounded Seeker', '7-5': 'The Travelling Seeker', '7-6': 'The Loving Seeker',
  '7-7': 'The Pure Seeker', '7-8': 'The Commanding Seeker', '7-9': 'The Complete Seeker',
  '8-1': 'The Pioneering Commander', '8-2': 'The Balanced Commander', '8-3': 'The Creative Commander',
  '8-4': 'The Master Commander', '8-5': 'The Free Commander', '8-6': 'The Merciful Commander',
  '8-7': 'The Wise Commander', '8-8': 'The Pure Commander', '8-9': 'The Complete Commander',
  '9-1': 'The Pioneering Completer', '9-2': 'The Peaceful Completer', '9-3': 'The Illuminating Completer',
  '9-4': 'The Building Completer', '9-5': 'The Voyaging Completer', '9-6': 'The Merciful Completer',
  '9-7': 'The Wise Completer', '9-8': 'The Powerful Completer', '9-9': 'The Perfect Completer',
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getDayOfWeek(): number { return new Date().getDay(); }

function ShariaDisclaimer({ color }: { color: string }) {
  return (
    <div style={{ borderLeft: `3px solid ${color}55`, borderRadius: 8, padding: '12px 16px', marginTop: 20, background: `${color}08` }}>
      <p style={{ color: color, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>📜 Important Islamic Note</p>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, lineHeight: 1.6 }}>
        Mizan is a tool for self-reflection and inspiration based on patterns in creation. It is not divination nor a replacement for Islamic guidance. All knowledge belongs to Allah alone. Consult qualified scholars for religious decisions.
      </p>
    </div>
  );
}

export default function Mizan() {
  const [step, setStep] = useState<'intro'|'input'|'calculating'|'result'>('intro');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ life: number; soul: number; destiny: number; archetype: typeof ARCHETYPES[1]; subTitle: string } | null>(null);
  const [revealStep, setRevealStep] = useState(0);
  const [dhikrCount, setDhikrCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<'personality'|'rizq'|'relationship'|'compatibility'|'daily'|'dhikr'>('personality');
  const [visits, setVisits] = useState(1);
  const [previewNum, setPreviewNum] = useState<number|null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const v = parseInt(localStorage.getItem('mizan_visits') || '0') + 1;
      setVisits(v);
      localStorage.setItem('mizan_visits', v.toString());
      const saved = localStorage.getItem('mizan_last');
      if (saved) {
        const p = JSON.parse(saved);
        setName(p.name || ''); setDay(p.day || ''); setMonth(p.month || ''); setYear(p.year || '');
      }
      const sd = localStorage.getItem('mizan_dhikr_today');
      if (sd) {
        const { date, count } = JSON.parse(sd);
        if (date === new Date().toDateString()) setDhikrCount(count);
      }
    } catch {}
  }, []);

  const saveDhikr = (count: number) => {
    try { localStorage.setItem('mizan_dhikr_today', JSON.stringify({ date: new Date().toDateString(), count })); } catch {}
  };

  // Inline validation while typing
  useEffect(() => {
    if (step === 'input') {
      const d = parseInt(day), m = parseInt(month), y = parseInt(year);
      if (day && month && year) {
        if (!isValidDate(d, m, y)) setError('Please enter a valid date');
        else setError('');
      } else {
        setError('');
      }
    }
  }, [day, month, year, step]);

  const calculate = () => {
    if (!day || !month || !year || year.length < 4) { setError('Please fill in all fields'); return; }
    const d = parseInt(day), m = parseInt(month), y = parseInt(year);
    if (!isValidDate(d, m, y)) { setError('Please enter a valid date'); return; }
    setError('');
    const cacheKey = `mizan_v3_${name.trim().toLowerCase()}_${d}_${m}_${y}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setResult(JSON.parse(cached));
        setStep('result');
        setRevealStep(0);
        return;
      }
    } catch {}
    setStep('calculating');
    setTimeout(() => {
      const life = getLifeNumber(d, m, y);
      const soul = getSoulNumber(d);
      const destiny = getDestinyNumber(m, y);
      const subTitle = SUB_TITLES[`${life}-${soul}`] || `The ${ARCHETYPES[life].title}`;
      const newResult = { life, soul, destiny, archetype: ARCHETYPES[life], subTitle };
      try {
        localStorage.setItem(cacheKey, JSON.stringify(newResult));
        localStorage.setItem('mizan_last', JSON.stringify({ name, day, month, year }));
      } catch {}
      setResult(newResult);
      setStep('result');
      setRevealStep(0);
    }, 2000);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (step === 'result' && e.key === 'Escape') { setStep('input'); setResult(null); setRevealStep(0); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step]);

  useEffect(() => {
    if (step === 'result') {
      const timeouts = [300, 700, 1100, 1600].map((t, i) => setTimeout(() => setRevealStep(i + 1), t));
      return () => timeouts.forEach(clearTimeout);
    }
  }, [step]);

  useEffect(() => {
    if (step === 'result' && resultRef.current) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [step]);

  const handleDhikr = () => {
    if (!result) return;
    const newCount = dhikrCount < result.archetype.dhikrCount ? dhikrCount + 1 : dhikrCount;
    setDhikrCount(newCount);
    saveDhikr(newCount);
    try { if (navigator.vibrate) navigator.vibrate(25); } catch {}
  };

  const handleShare = useCallback(() => {
    if (!result) return;
    const arch = result.archetype;
    const text = `✦ My Islamic Blueprint ✦\n\nI am "${result.subTitle}"\nArchetype: ${arch.title} — ${arch.name}\n${arch.arabic}\n\nMy Divine Name: ${arch.divineName} ${arch.divineArabic}\nLife ${result.life} · Soul ${result.soul} · Destiny ${result.destiny}\n\n"${arch.verse}"\n— ${arch.verseRef}\n\n🌿 Discover YOUR Islamic Blueprint free:\niloveislam.life/mizan\n\n#ILoveIslam #IslamicBlueprint #Mizan`;
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      navigator.share({ title: 'My Islamic Blueprint — Mizan', text, url: 'https://iloveislam.life/mizan' }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {
        const el = document.createElement('textarea');
        el.value = text; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }, [result]);

  const clearAllData = () => {
    try {
      localStorage.removeItem('mizan_visits');
      localStorage.removeItem('mizan_last');
      localStorage.removeItem('mizan_dhikr_today');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('mizan_v3_')) localStorage.removeItem(key);
      });
      setVisits(1);
      setName(''); setDay(''); setMonth(''); setYear(''); setDhikrCount(0);
      setResult(null); setStep('intro');
    } catch {}
    alert('All your local Mizan data has been cleared.');
  };

  const arch = result?.archetype;
  const todayVerse = arch ? arch.dailyVerses[getDayOfWeek() % arch.dailyVerses.length] : null;
  const pageBg = arch ? arch.pageGrad : 'linear-gradient(160deg, #060a0f 0%, #0a1018 100%)';
  const waShareLink = result ? `https://wa.me/?text=${encodeURIComponent(
    `✦ My Islamic Blueprint ✦\n\nI am "${result.subTitle}"\nArchetype: ${arch!.title} — ${arch!.name}\n${arch!.arabic}\n\nMy Divine Name: ${arch!.divineName} ${arch!.divineArabic}\nLife ${result.life} · Soul ${result.soul} · Destiny ${result.destiny}\n\n"${arch!.verse}"\n— ${arch!.verseRef}\n\n🌿 Discover YOUR Islamic Blueprint free:\niloveislam.life/mizan\n\n#ILoveIslam #IslamicBlueprint #Mizan`
  )}` : '';

  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'Georgia', serif", transition: 'background 1.5s ease', position: 'relative' }} role="main" aria-label="Mizan Islamic Blueprint">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap');
        .qf { font-family: 'Scheherazade New', 'Traditional Arabic', serif !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes shimmer { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 20px rgba(200,169,110,0.2); } 50% { box-shadow: 0 0 50px rgba(200,169,110,0.5); } }
        .float { animation: float 4s ease-in-out infinite; }
        .shimmer { animation: shimmer 2.5s ease-in-out infinite; }
        .fade-up { animation: fadeUp 0.6s ease-out forwards; }
        .scale-in { animation: scaleIn 0.5s ease-out forwards; }
        .glow { animation: glowPulse 3s ease-in-out infinite; }
        button:focus-visible { outline: 2px solid #c8a96e; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(200,169,110,0.2); border-radius: 2px; }
        .arch-card:hover { transform: translateY(-4px) scale(1.03); transition: all 0.25s ease; }
        .section-btn:hover { opacity: 0.85; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0; }
        .mizan-bg::before {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }
        .content-wrapper { position: relative; z-index: 1; }
      `}</style>
      <div className="content-wrapper">
        <header style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }} aria-label="Back to tools">← Back</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#c8a96e', fontSize: 12 }}>✦</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: '0.2em' }}>MIZAN</span>
              <span style={{ color: '#c8a96e', fontSize: 12 }}>✦</span>
            </div>
            {step === 'result' ? (
              <button onClick={() => { setStep('input'); setResult(null); setRevealStep(0); }}
                style={{ color: '#c8a96e', fontSize: 12, border: '1px solid rgba(200,169,110,0.3)', padding: '4px 14px', borderRadius: 20, background: 'transparent', cursor: 'pointer' }}
                aria-label="Start new reading"
              >
                New Reading
              </button>
            ) : <div style={{ width: 80 }} />}
          </div>
        </header>

        {/* INTRO */}
        {step === 'intro' && (
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '36px 16px 60px' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div className="float" style={{ fontSize: 60, marginBottom: 14 }}>✦</div>
              <p style={{ color: '#c8a96e', fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 10 }}>Islamic Numerology & Self-Discovery</p>
              <h1 style={{ color: '#fff', fontSize: 'clamp(28px,6vw,48px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 12 }}>
                Discover Your<br /><span style={{ color: '#c8a96e' }}>Islamic Blueprint</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.8, maxWidth: 480, margin: '0 auto 24px' }}>
                Your birth date reveals your divine archetype, life purpose, and spiritual path — through the ancient Abjad numerology system, 99 Names of Allah, and Quranic guidance.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
                {['Divine Name', 'Life Purpose', 'Daily Verse', 'Rizq Path', 'Companions', 'Dhikr Guide', 'Prophet Mirror'].map(f => (
                  <span key={f} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(200,169,110,0.2)', color: 'rgba(200,169,110,0.65)', background: 'rgba(200,169,110,0.05)' }}>{f}</span>
                ))}
              </div>
              {visits > 1 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.15)', borderRadius: 20, padding: '6px 16px', marginBottom: 20 }}>
                  <span style={{ fontSize: 14 }}>🔥</span>
                  <span style={{ color: '#c8a96e', fontSize: 12 }}>Welcome back — visit #{visits}</span>
                </div>
              )}
              <button onClick={() => setStep('input')}
                style={{ background: 'linear-gradient(135deg, #c8a96e, #a07840)', color: '#0a0800', padding: '14px 44px', borderRadius: 50, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 8px 30px rgba(200,169,110,0.35)', letterSpacing: 0.5 }}
                className="glow"
                aria-label="Begin your Mizan journey"
              >
                Begin Your Journey ✦
              </button>
              <p style={{ color: 'rgba(255,255,255,0.12)', fontSize: 11, marginTop: 10 }}>Free · Private · No data stored on servers</p>
              <button onClick={clearAllData} style={{ marginTop: 20, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 16px', color: 'rgba(255,255,255,0.3)', fontSize: 11, cursor: 'pointer' }}>
                🗑 Clear My Data
              </button>
            </div>

            {/* Archetype grid */}
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 16 }}>
              The 9 Islamic Archetypes — Which Are You?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              {Object.entries(ARCHETYPES).map(([num, a]) => (
                <button key={num} className="arch-card"
                  onClick={() => setPreviewNum(previewNum === parseInt(num) ? null : parseInt(num))}
                  style={{ background: `${a.color}0d`, border: `1px solid ${a.color}22`, borderRadius: 14, padding: '14px 10px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: 26, marginBottom: 5 }}>{a.symbol}</div>
                  <p style={{ color: a.color, fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{a.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9 }} className="qf">{a.arabic}</p>
                  <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9, marginTop: 3 }}>{a.estimatedUsers.toLocaleString()} people</p>
                </button>
              ))}
            </div>

            {previewNum !== null && ARCHETYPES[previewNum] && (
              <div className="fade-up" style={{ background: `${ARCHETYPES[previewNum].color}0d`, border: `1px solid ${ARCHETYPES[previewNum].color}25`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <p style={{ color: ARCHETYPES[previewNum].color, fontWeight: 700, fontSize: 16 }}>{ARCHETYPES[previewNum].title}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{ARCHETYPES[previewNum].divineName} · {ARCHETYPES[previewNum].divineArabic}</p>
                  </div>
                  <span style={{ fontSize: 32 }}>{ARCHETYPES[previewNum].symbol}</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>
                  {ARCHETYPES[previewNum].personality.slice(0, 200)}...
                </p>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontStyle: 'italic' }}>
                  "{ARCHETYPES[previewNum].verse}" — {ARCHETYPES[previewNum].verseRef}
                </p>
              </div>
            )}
            <ShariaDisclaimer color="#c8a96e" />
          </div>
        )}

        {/* INPUT */}
        {step === 'input' && (
          <div style={{ maxWidth: 480, margin: '0 auto', padding: '44px 16px' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div className="float" style={{ fontSize: 48, marginBottom: 10 }}>✦</div>
              <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Enter Your Birth Date</h2>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Your date unlocks your unique blueprint — one of 81 possible combinations</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: 24 }}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Your Name (optional)</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ahmed, Fatima, Muhammad..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <label style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Date of Birth</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.2fr', gap: 8, marginBottom: 22 }}>
                {[
                  { label: 'Day', value: day, setter: setDay, placeholder: 'DD', min: 1, max: 31 },
                  { label: 'Year', value: year, setter: setYear, placeholder: 'YYYY', min: 1900, max: new Date().getFullYear() },
                ].map((f, idx) => (
                  <div key={f.label} style={{ order: idx === 0 ? 0 : 2 }}>
                    <label style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, display: 'block', marginBottom: 5 }}>{f.label}</label>
                    <input type="number" min={f.min} max={f.max} value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '13px 6px', color: '#fff', fontSize: 18, fontWeight: 700, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div style={{ order: 1 }}>
                  <label style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, display: 'block', marginBottom: 5 }}>Month</label>
                  <select value={month} onChange={e => setMonth(e.target.value)}
                    style={{ width: '100%', background: '#0d1319', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '13px 8px', color: month ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}>
                    <option value="">Month</option>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>

              {error && (
                <div role="alert" style={{ background: 'rgba(220,80,60,0.12)', border: '1px solid rgba(220,80,60,0.3)', borderRadius: 8, padding: 10, marginBottom: 14 }}>
                  <p style={{ color: '#e06050', fontSize: 13, textAlign: 'center' }}>{error}</p>
                </div>
              )}

              <button onClick={calculate} disabled={!day || !month || !year || year.length < 4 || !!error}
                style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 700, background: (!day || !month || !year || year.length < 4 || !!error) ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #c8a96e, #a07840)', color: (!day || !month || !year || year.length < 4 || !!error) ? 'rgba(255,255,255,0.2)' : '#0a0800', cursor: (!day || !month || !year || year.length < 4 || !!error) ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                aria-label="Calculate Islamic blueprint"
              >
                Reveal My Blueprint ✦
              </button>
            </div>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.12)', fontSize: 11, marginTop: 10 }}>Everything calculated privately in your browser. Nothing sent to servers.</p>
            <ShariaDisclaimer color="#c8a96e" />
            <button onClick={clearAllData} style={{ marginTop: 20, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 16px', color: 'rgba(255,255,255,0.3)', fontSize: 11, cursor: 'pointer', display: 'block', margin: '20px auto 0' }}>
              🗑 Clear My Data
            </button>
          </div>
        )}

        {/* CALCULATING */}
        {step === 'calculating' && (
          <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 64, animation: 'spin 3s linear infinite', marginBottom: 24 }}>✦</div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20, marginBottom: 6, fontWeight: 600 }}>Calculating your blueprint...</p>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, marginBottom: 32 }}>Applying the Abjad numerology system</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Reading your birth numbers...','Finding your Divine Name...','Selecting your Quranic verse...','Calculating compatibility...','Preparing your unique sub-archetype...','Finalising your blueprint...'].map((t, i) => (
                <p key={t} className="shimmer" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, animationDelay: `${i * 0.4}s` }}>{t}</p>
              ))}
            </div>
            <button onClick={() => {
              const d = parseInt(day), m = parseInt(month), y = parseInt(year);
              const life = getLifeNumber(d, m, y), soul = getSoulNumber(d), destiny = getDestinyNumber(m, y);
              const subTitle = SUB_TITLES[`${life}-${soul}`] || `The ${ARCHETYPES[life].title}`;
              setResult({ life, soul, destiny, archetype: ARCHETYPES[life], subTitle });
              setStep('result');
            }} style={{ marginTop: 40, color: 'rgba(255,255,255,0.2)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
              Skip animation →
            </button>
          </div>
        )}

        {/* RESULT */}
        {step === 'result' && result && arch && (
          <div ref={resultRef} style={{ maxWidth: 680, margin: '0 auto', padding: '16px 12px 60px' }}>
            {/* HERO CARD */}
            <div className="scale-in" style={{ background: arch.cardGrad, border: `1px solid ${arch.color}40`, borderRadius: 28, padding: '32px 22px', marginBottom: 14, textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: `0 16px 60px ${arch.color}20` }}>
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '8%', right: '6%', fontSize: 100, opacity: 0.05 }}>{arch.symbol}</div>
                <div style={{ position: 'absolute', bottom: '6%', left: '5%', fontSize: 80, opacity: 0.04 }} className="qf">{arch.arabic}</div>
              </div>

              {name && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginBottom: 6 }}>Blueprint for <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{name}</span></p>}

              <div className="float" style={{ fontSize: 60, marginBottom: 10 }}>{arch.symbol}</div>
              <p style={{ color: arch.color, fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 6 }}>Your Unique Archetype</p>
              <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginBottom: 4, lineHeight: 1.2 }}>{result.subTitle}</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 4 }}>Core type: {arch.title} · {arch.name}</p>
              <p className="qf" style={{ color: arch.color, fontSize: 26, marginBottom: 16 }}>{arch.arabic}</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Life', value: result.life, sub: 'Core path' },
                  { label: 'Soul', value: result.soul, sub: 'Inner self' },
                  { label: 'Destiny', value: result.destiny, sub: 'Mission' },
                ].map(n => (
                  <div key={n.label} style={{ background: `${arch.color}18`, border: `1px solid ${arch.color}30`, borderRadius: 14, padding: '12px 6px' }}>
                    <p style={{ color: arch.color, fontSize: 30, fontWeight: 700 }}>{n.value}</p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{n.label}</p>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>{n.sub}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, letterSpacing: '0.4em', marginBottom: 6 }}>YOUR DIVINE NAME</p>
                <p className="qf" style={{ color: arch.color, fontSize: 32, marginBottom: 4, lineHeight: 1.6 }}>{arch.divineArabic}</p>
                <p style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{arch.divineName}</p>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontStyle: 'italic', marginBottom: 4 }}>"{arch.verse}"</p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginBottom: 16 }}>{arch.verseRef}</p>

              <div style={{ background: `${arch.color}12`, border: `1px solid ${arch.color}20`, borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                <p style={{ color: arch.color, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>✦ Your Prophetic Mirror</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{arch.prophetExample}</p>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginBottom: 6 }}>🌍 {arch.estimatedUsers.toLocaleString()} people share your core archetype</p>
              <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                <div style={{ width: `${(arch.estimatedUsers / 25000) * 100}%`, height: 3, background: arch.color, borderRadius: 2, transition: 'width 1s ease' }} />
              </div>

              {visits > 1 && (
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 10 }}>
                  🔥 You've visited Mizan {visits} time{visits !== 1 ? 's' : ''}. Your spiritual journey continues.
                </p>
              )}
            </div>

            {/* SHARE BUTTONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              <button onClick={handleShare}
                style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: copied ? 'linear-gradient(135deg,#50c878,#2d8a50)' : `linear-gradient(135deg, ${arch.color}, #a07840)`, color: '#0a0800', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', boxShadow: `0 6px 24px ${arch.color}40` }}
                aria-label="Share your blueprint"
              >
                {copied ? '✅ Copied! Paste anywhere 🤍' : '✦ Share My Islamic Blueprint'}
              </button>
              {waShareLink && (
                <a href={waShareLink} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: 14, border: '1px solid #25d366', background: 'transparent', color: '#25d366', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
                >
                  💬 Share on WhatsApp
                </a>
              )}
            </div>
            {!copied && <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center', marginBottom: 14 }}>Every share is sadaqah jariyah 🌙</p>}

            {/* SECTION NAVIGATION */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
              {([
                { id: 'personality', label: '🗺️ Blueprint' },
                { id: 'rizq', label: '💎 Rizq & Love' },
                { id: 'compatibility', label: '🤝 Companions' },
                { id: 'daily', label: '📖 Daily Verse' },
                { id: 'dhikr', label: '📿 Dhikr' },
              ] as const).map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 20, border: `1px solid ${activeSection === s.id ? arch.color : 'rgba(255,255,255,0.1)'}`, background: activeSection === s.id ? `${arch.color}22` : 'rgba(255,255,255,0.04)', color: activeSection === s.id ? arch.color : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: activeSection === s.id ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* PERSONALITY */}
            {activeSection === 'personality' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${arch.color}20`, borderRadius: 18, padding: 20 }}>
                  <p style={{ color: arch.color, fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 12 }}>Your Personality</p>
                  <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.85 }}>{arch.personality}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 14 }}>
                    {arch.strength.map(s => (
                      <div key={s} style={{ display: 'flex', gap: 8, alignItems: 'center', background: `${arch.color}0e`, borderRadius: 10, padding: '8px 12px' }}>
                        <span style={{ color: arch.color, fontSize: 10 }}>✦</span>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: 'rgba(220,80,60,0.08)', border: '1px solid rgba(220,80,60,0.2)', borderRadius: 16, padding: 18 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    <p style={{ color: '#e07050', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Your Challenge</p>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 13, lineHeight: 1.75 }}>{arch.challenge}</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 18 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span>🎯</span>
                    <p style={{ color: arch.color, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Your Life Purpose</p>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.75 }}>{arch.purpose}</p>
                </div>
              </div>
            )}

            {/* RIZQ & LOVE */}
            {activeSection === 'rizq' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: 'rgba(80,200,120,0.07)', border: '1px solid rgba(80,200,120,0.2)', borderRadius: 16, padding: 20 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>💎</span>
                    <p style={{ color: '#50c878', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Your Rizq & Wealth Path</p>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 14, lineHeight: 1.8 }}>{arch.rizq}</p>
                </div>
                <div style={{ background: 'rgba(220,110,140,0.07)', border: '1px solid rgba(220,110,140,0.2)', borderRadius: 16, padding: 20 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>❤️</span>
                    <p style={{ color: '#e87898', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Relationships & Love</p>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 14, lineHeight: 1.8 }}>{arch.relationship}</p>
                </div>
              </div>
            )}

            {/* COMPATIBILITY */}
            {activeSection === 'compatibility' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${arch.color}18`, borderRadius: 16, padding: 18, marginBottom: 4 }}>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: '0.3em', marginBottom: 8 }}>WHY THESE COMPANIONS?</p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7 }}>{arch.compatibilityReason}</p>
                </div>
                <p style={{ color: '#50c878', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', paddingLeft: 4 }}>✦ Best Companions</p>
                {arch.companions.map(n => {
                  const a = ARCHETYPES[n];
                  return (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, background: `${a.color}0a`, border: `1px solid ${a.color}1e`, borderRadius: 14, padding: '14px 16px' }}>
                      <span style={{ fontSize: 28, flexShrink: 0 }}>{a.symbol}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: a.color, fontWeight: 700, fontSize: 14 }}>{a.title}</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Life Number {n} · {a.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 3 }}>{a.personality.slice(0, 80)}...</p>
                      </div>
                      <span style={{ background: '#50c87818', border: '1px solid #50c87840', borderRadius: 20, padding: '3px 10px', color: '#50c878', fontSize: 10, flexShrink: 0 }}>✦ Compatible</span>
                    </div>
                  );
                })}
                <p style={{ color: '#e07050', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', paddingLeft: 4, marginTop: 4 }}>⚠️ Challenging Dynamics</p>
                {arch.incompatible.map(n => {
                  const a = ARCHETYPES[n];
                  return (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(220,80,60,0.05)', border: '1px solid rgba(220,80,60,0.15)', borderRadius: 14, padding: '14px 16px' }}>
                      <span style={{ fontSize: 28, flexShrink: 0 }}>{a.symbol}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 700, fontSize: 14 }}>{a.title}</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Requires patience & understanding</p>
                      </div>
                      <span style={{ background: 'rgba(220,80,60,0.1)', border: '1px solid rgba(220,80,60,0.3)', borderRadius: 20, padding: '3px 10px', color: '#e07050', fontSize: 10, flexShrink: 0 }}>⚠️ Challenging</span>
                    </div>
                  );
                })}
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                  In Islam, every relationship can work with Tawakkul and patience. These are tendencies, not destinies.
                </p>
              </div>
            )}

            {/* DAILY VERSE */}
            {activeSection === 'daily' && todayVerse && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: 'linear-gradient(135deg, #0a3d2e, #0d5238)', border: `1px solid ${arch.color}40`, borderRadius: 20, padding: 24, textAlign: 'center' }}>
                  <p style={{ color: arch.color, fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 16 }}>Your Verse for Today</p>
                  <p style={{ color: '#fff', fontSize: 17, lineHeight: 1.9, fontStyle: 'italic', marginBottom: 10 }}>"{todayVerse.verse}"</p>
                  <p style={{ color: arch.color, fontSize: 12, marginBottom: 20 }}>{todayVerse.ref}</p>
                  <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: '14px 16px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: '0.2em', marginBottom: 8 }}>REFLECTION FOR THE {arch.title.toUpperCase()}</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.75 }}>{todayVerse.reflection}</p>
                  </div>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center' }}>A new verse every day of the week 🌙</p>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${arch.color}15`, borderRadius: 16, padding: 18 }}>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, letterSpacing: '0.3em', marginBottom: 14 }}>ALL 7 VERSES FOR YOUR ARCHETYPE</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {arch.dailyVerses.map((v, i) => {
                      const isToday = i === getDayOfWeek() % arch.dailyVerses.length;
                      return (
                        <div key={i} style={{ padding: '11px 14px', background: isToday ? `${arch.color}12` : 'transparent', border: `1px solid ${isToday ? arch.color + '30' : 'transparent'}`, borderRadius: 10 }}>
                          <p style={{ color: isToday ? arch.color : 'rgba(255,255,255,0.45)', fontSize: 12, fontStyle: 'italic', marginBottom: 3 }}>"{v.verse}"</p>
                          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>{v.ref} {isToday && '← Today'}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* DHIKR */}
            {activeSection === 'dhikr' && arch && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: 'linear-gradient(135deg, #0a3d2e, #0d5238)', border: `1px solid ${arch.color}40`, borderRadius: 20, padding: 28, textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 14 }}>Your Recommended Dhikr</p>
                  <p className="qf" style={{ color: arch.color, fontSize: 32, marginBottom: 6, lineHeight: 1.7 }}>{arch.dhikrArabic}</p>
                  <p style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{arch.dhikr}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginBottom: 26 }}>Recite {arch.dhikrCount} times daily</p>

                  <div style={{ position: 'relative', width: 150, height: 150, margin: '0 auto 20px' }}>
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      background: `conic-gradient(${arch.color} ${(dhikrCount / arch.dhikrCount) * 360}deg, rgba(255,255,255,0.07) 0deg)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.3s ease',
                    }}>
                      <div style={{
                        width: '84%', height: '84%', borderRadius: '50%',
                        background: '#0d0800',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ color: arch.color, fontSize: 34, fontWeight: 700, lineHeight: 1 }}>{dhikrCount}</span>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 2 }}>/ {arch.dhikrCount}</span>
                        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10, marginTop: 2 }}>{Math.round((dhikrCount / arch.dhikrCount) * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <button onClick={handleDhikr}
                    style={{ padding: '16px 44px', borderRadius: 50, border: 'none', background: `linear-gradient(135deg, ${arch.color}, #a07840)`, color: '#0a0800', fontSize: 16, fontWeight: 700, marginBottom: 12, boxShadow: `0 6px 28px ${arch.color}40`, cursor: 'pointer', transition: 'transform 0.1s' }}>
                    📿 {dhikrCount === 0 ? 'Begin Dhikr' : 'Tap to Count'}
                  </button>

                  {dhikrCount >= arch.dhikrCount && (
                    <p style={{ color: '#50c878', fontSize: 14, fontWeight: 600 }}>🎉 Alhamdulillah! Daily dhikr complete!</p>
                  )}
                  {dhikrCount > 0 && dhikrCount < arch.dhikrCount && (
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginBottom: 6 }}>{arch.dhikrCount - dhikrCount} remaining · Saved automatically</p>
                      <button onClick={() => { setDhikrCount(0); saveDhikr(0); }} style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer' }}>Reset for today</button>
                    </div>
                  )}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${arch.color}14`, borderRadius: 16, padding: 18 }}>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, letterSpacing: '0.3em', marginBottom: 10 }}>WHY THIS DHIKR FOR YOU</p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.75 }}>
                    The Divine Name <span style={{ color: arch.color }}>{arch.divineName}</span> ({arch.divineArabic}) reflects the attribute of Allah that your archetype most needs to connect with. Regular recitation aligns your soul with its divine purpose and draws you closer to your spiritual mission.
                  </p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 16, padding: 18 }}>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, letterSpacing: '0.3em', marginBottom: 10 }}>HADITH ON DHIKR</p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontStyle: 'italic', lineHeight: 1.75 }}>
                    "Shall I tell you about the best of your deeds, the purest in the sight of your King, the highest in raising your rank, and better for you than spending gold and silver?" They said: Yes. He said: "Remembrance of Allah."
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 8 }}>— Tirmidhi & Ibn Majah</p>
                </div>
              </div>
            )}

            <ShariaDisclaimer color={arch.color} />
            <button onClick={clearAllData} style={{ marginTop: 20, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 16px', color: 'rgba(255,255,255,0.3)', fontSize: 11, cursor: 'pointer', display: 'block', margin: '20px auto 0' }}>
              🗑 Clear My Data
            </button>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.08)', fontSize: 11, marginTop: 20 }}>
              Mizan is for self-reflection only. All guidance should be sought from Allah ﷻ and qualified Islamic scholars.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}