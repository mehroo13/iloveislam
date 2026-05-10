'use client';

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import Link from 'next/link';
import Head from 'next/head';

// ==================== NUMEROLOGY HELPERS ====================
function getLifeNumber(day: number, month: number, year: number): number {
  const sum = `${day}${month}${year}`.split('').reduce((a, b) => a + parseInt(b), 0);
  let n = sum;
  while (n > 9) n = n.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  return n === 0 ? 9 : n;
}

function getSoulNumber(day: number): number {
  let n = day;
  while (n > 9) n = n.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  return n === 0 ? 9 : n;
}

function getDestinyNumber(month: number, year: number): number {
  const sum = `${month}${year}`.split('').reduce((a, b) => a + parseInt(b), 0);
  let n = sum;
  while (n > 9) n = n.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  return n === 0 ? 9 : n;
}

// ==================== DATE VALIDATION ====================
function isValidDate(day: number, month: number, year: number): boolean {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day &&
         year >= 1900 && 
         year <= new Date().getFullYear();
}

// ==================== ARCHETYPES DATA ====================
const ARCHETYPES: Record<number, {
  name: string; arabic: string; title: string;
  divineName: string; divineArabic: string;
  verse: string; verseRef: string;
  color: string; bgGradient: string; symbol: string; emoji: string;
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
    color: '#c8a96e', bgGradient: 'linear-gradient(135deg, #2a1a00, #1a1200)',
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
      { verse: 'And We have already written in the Psalms that the righteous will inherit the earth.', ref: 'Quran 21:105', reflection: 'What you build in righteousness will outlast you.' },
      { verse: 'So be patient. Indeed, the promise of Allah is truth.', ref: 'Quran 30:60', reflection: 'Your vision is correct. The timing is Allah\'s, not yours.' },
      { verse: 'Do not weaken and do not grieve, and you will be superior if you are believers.', ref: 'Quran 3:139', reflection: 'Pioneers face opposition. Your Iman is your armour.' },
      { verse: 'Indeed, Allah will not change the condition of a people until they change what is in themselves.', ref: 'Quran 13:11', reflection: 'Every great change you want in the world starts inside you.' },
    ],
  },
  2: {
    name: 'Al-Tawazun', arabic: 'التَّوَازُن', title: 'The Peacemaker',
    divineName: 'Al-Lateef', divineArabic: 'اللَّطِيفُ',
    verse: 'And He is the Subtle, the All-Aware.',
    verseRef: 'Quran 67:14',
    color: '#7eb8d4', bgGradient: 'linear-gradient(135deg, #001a2a, #00121e)',
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
      { verse: 'And reconciliation is best.', ref: 'Quran 4:128', reflection: 'When in doubt, choose peace. Allah rewards the peacemaker.' },
      { verse: 'Allah does not burden a soul beyond that it can bear.', ref: 'Quran 2:286', reflection: 'You carry others\' pain. Remember you also have a limit Allah has set.' },
      { verse: 'And He has put between you affection and mercy.', ref: 'Quran 30:21', reflection: 'Your relationships are a sign of Allah\'s mercy. Cherish them.' },
      { verse: 'Be patient, for the patience of Allah is greater than your patience.', ref: 'Hadith', reflection: 'When you feel unseen, remember Allah sees every act of gentleness.' },
    ],
  },
  3: {
    name: 'Al-Bayaan', arabic: 'البَيَان', title: 'The Illuminator',
    divineName: 'Al-Nur', divineArabic: 'النُّورُ',
    verse: 'Allah is the Light of the heavens and the earth.',
    verseRef: 'Quran 24:35',
    color: '#f0c040', bgGradient: 'linear-gradient(135deg, #2a2000, #1a1400)',
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
      { verse: 'We have made it easy for remembrance, so is there anyone who will remember?', ref: 'Quran 54:17', reflection: 'You are here to make remembrance easy and beautiful for others.' },
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
    color: '#6b8f71', bgGradient: 'linear-gradient(135deg, #0a1a0c, #081208)',
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
    color: '#9b6b9b', bgGradient: 'linear-gradient(135deg, #1a0a1a, #120812)',
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
      { verse: 'And of His signs is the creation of the heavens and the earth.', ref: 'Quran 30:22', reflection: 'Every new place you visit is a new sign of Allah to contemplate.' },
      { verse: 'So flee to Allah.', ref: 'Quran 51:50', reflection: 'The ultimate journey is always toward Allah, not away from difficulty.' },
      { verse: 'He who goes out seeking knowledge is in the path of Allah.', ref: 'Hadith — Tirmidhi', reflection: 'Every journey for knowledge is a journey for Allah.' },
      { verse: 'And We sent you not except as a mercy to the worlds.', ref: 'Quran 21:107', reflection: 'Wherever you go, carry mercy. That is your gift to every land.' },
      { verse: 'And put your trust in Allah, and sufficient is Allah as Disposer of affairs.', ref: 'Quran 33:3', reflection: 'The best travel companion is tawakkul. Trust Allah on every road.' },
      { verse: 'We will show them Our signs in the horizons.', ref: 'Quran 41:53', reflection: 'Allah promises to reveal Himself in the world\'s horizons. You are looking.' },
    ],
  },
  6: {
    name: 'Al-Rahma', arabic: 'الرَّحْمَة', title: 'The Nurturer',
    divineName: 'Al-Wadud', divineArabic: 'الْوَدُودُ',
    verse: 'And We have not sent you except as a mercy to the worlds.',
    verseRef: 'Quran 21:107',
    color: '#d4748c', bgGradient: 'linear-gradient(135deg, #2a0a14, #1a0810)',
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
      { verse: 'Whoever does not show mercy will not be shown mercy.', ref: 'Hadith — Bukhari', reflection: 'Mercy is a currency. The more you give, the more returns to you from Allah.' },
      { verse: 'My mercy encompasses all things.', ref: 'Quran 7:156', reflection: 'You reflect Al-Rahman. Your mercy is a drop from His infinite ocean.' },
      { verse: 'And He has put between you affection and mercy.', ref: 'Quran 30:21', reflection: 'Your loving relationships are a literal sign from Allah. Treasure them.' },
      { verse: 'The believers in their mutual kindness are like a body.', ref: 'Hadith — Bukhari', reflection: 'When any part of the Ummah hurts, you feel it. That is your gift.' },
    ],
  },
  7: {
    name: 'Al-Hikmah', arabic: 'الحِكْمَة', title: 'The Seeker',
    divineName: 'Al-Alim', divineArabic: 'اَلْعَلِيمُ',
    verse: 'And He taught you what you did not know. And the favour of Allah upon you has been great.',
    verseRef: 'Quran 4:113',
    color: '#5b8dd4', bgGradient: 'linear-gradient(135deg, #001428, #000e1a)',
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
      { verse: 'Are those who know equal to those who do not know?', ref: 'Quran 39:9', reflection: 'Your pursuit of knowledge is not ego — it is answering Allah\'s rhetorical question.' },
      { verse: 'Allah will raise up those who have believed among you and those given knowledge, by degrees.', ref: 'Quran 58:11', reflection: 'Your learning is an ascent. Each level of knowledge elevates your station with Allah.' },
      { verse: 'Indeed, in the alternation of the night and the day are signs for those of understanding.', ref: 'Quran 3:190', reflection: 'The universe is a book. You were made to read it.' },
      { verse: 'He gives wisdom to whom He wills, and whoever is given wisdom has certainly been given much good.', ref: 'Quran 2:269', reflection: 'Your wisdom is a direct gift from Allah. It is an amanah — a trust.' },
      { verse: 'Read! In the name of your Lord who created.', ref: 'Quran 96:1', reflection: 'The first revelation was a command for you. Never stop reading.' },
      { verse: 'And they ask you about the soul. Say: The soul is from the affair of my Lord.', ref: 'Quran 17:85', reflection: 'Some mysteries are kept by Allah. Seekers learn the peace of not knowing.' },
    ],
  },
  8: {
    name: 'Al-Quwwah', arabic: 'القُوَّة', title: 'The Commander',
    divineName: 'Al-Qawi', divineArabic: 'الْقَوِيُّ',
    verse: 'Indeed, the strong believer is more beloved to Allah than the weak believer.',
    verseRef: 'Sahih Muslim',
    color: '#c0392b', bgGradient: 'linear-gradient(135deg, #1a0500, #0f0300)',
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
      { verse: 'Indeed, the strong believer is more beloved to Allah than the weak believer.', ref: 'Sahih Muslim', reflection: 'Your strength is wanted. Use it in Allah\'s service, not for yourself.' },
      { verse: 'And prepare against them whatever you are able of strength.', ref: 'Quran 8:60', reflection: 'Allah commands preparation. Your drive to build power has divine sanction.' },
      { verse: 'And do not weaken in pursuit of the enemy.', ref: 'Quran 4:104', reflection: 'Commanders don\'t quit. Your persistence is a form of worship.' },
      { verse: 'Indeed, the noblest of you in the sight of Allah is the most righteous of you.', ref: 'Quran 49:13', reflection: 'Power is not measured in wealth or authority, but in taqwa. Recalibrate.' },
      { verse: 'Justice belongs to Allah.', ref: 'Quran 6:62', reflection: 'You love justice. Remember: ultimate justice belongs to Allah alone. Your job is to pursue it.' },
      { verse: 'And He is the Oft-Forgiving, the Loving.', ref: 'Quran 85:14', reflection: 'The strongest act a Commander can perform is to forgive.' },
      { verse: 'O you who have believed, stand firmly for justice.', ref: 'Quran 4:135', reflection: 'This verse was written for you. Stand firm, even when it costs you.' },
    ],
  },
  9: {
    name: 'Al-Kamal', arabic: 'الكَمَال', title: 'The Completer',
    divineName: 'Al-Jami', divineArabic: 'الْجَامِعُ',
    verse: 'This day I have perfected for you your religion and completed My favour upon you.',
    verseRef: 'Quran 5:3',
    color: '#8e44ad', bgGradient: 'linear-gradient(135deg, #0f0520, #08031a)',
    symbol: '🌌', emoji: '♾️',
    personality: 'You are the completion — the one who brings things full circle. Nine is the number of perfection in Islamic numerology. You carry an old soul, a humanitarian heart, and a vision that transcends borders. You feel the pain of the entire Ummah.',
    strength: ['Universal compassion', 'Visionary thinking', 'Spiritual completion', 'Timeless wisdom'],
    challenge: 'Your challenge is endings — you must learn to let go. Trust Allah with what has passed.',
    rizq: 'Your wealth flows through service to humanity, philanthropic leadership, and work that has global impact. Your giving is your greatest investment.',
    relationship: 'You love all of humanity and can struggle to give one person the totality of that love. Seek a partner who understands your vast heart.',
    purpose: 'To complete what others began — to be the final piece that makes the Ummah whole.',
    dhikr: 'Subhan Allah wa bihamdihi', dhikrArabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', dhikrCount: 100,
    companions: [1, 6, 7], incompatible: [5, 8],
    compatibilityReason: 'Completers find their match in visionary Pioneers (1), compassionate Nurturers (6), and deep Seekers (7) who share their wisdom.',
    prophetExample: 'Like Imam Ali RA — the completion of knowledge, whose wisdom gathered all the threads of early Islam.',
    estimatedUsers: 13978,
    dailyVerses: [
      { verse: 'This day I have perfected for you your religion.', ref: 'Quran 5:3', reflection: 'Completion is Allah\'s signature. You carry that energy — use it to finish what matters.' },
      { verse: 'And the Hereafter is better for you than the first life.', ref: 'Quran 93:4', reflection: 'The completion that matters most is your akhirah. Everything else is prologue.' },
      { verse: 'Every soul will taste death.', ref: 'Quran 3:185', reflection: 'You think about endings. Good. That awareness is what makes your time meaningful.' },
      { verse: 'Indeed, to Allah we belong and to Him we shall return.', ref: 'Quran 2:156', reflection: 'The ultimate completion is return. You\'re always heading home.' },
      { verse: 'Is there any reward for good other than good?', ref: 'Quran 55:60', reflection: 'What you give to humanity returns to you in the akhirah, perfectly completed.' },
      { verse: 'He who leaves behind knowledge by which people benefit after his death will have ongoing reward.', ref: 'Hadith — Muslim', reflection: 'Your legacy is your completion. What will remain when you\'re gone?' },
      { verse: 'Allah does not burden a soul beyond that it can bear.', ref: 'Quran 2:286', reflection: 'Your vast heart has a limit Allah set. You don\'t have to carry the whole world.' },
    ],
  },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getCacheKey(name: string, day: string, month: string, year: string) {
  return `mizan_v2_${name.trim().toLowerCase()}_${day}_${month}_${year}`;
}

function getDayOfWeek(): number {
  return new Date().getDay();
}

// ==================== COMPONENTS ====================

function ShariaDisclaimer() {
  return (
    <div style={{ 
      background: 'rgba(200,169,110,0.05)', 
      borderLeft: `3px solid #c8a96e`,
      borderRadius: 8,
      padding: '12px 16px',
      marginTop: 20
    }}>
      <p style={{ color: '#c8a96e', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
        📜 Important Islamic Note
      </p>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, lineHeight: 1.6 }}>
        Mizan is a tool for self-reflection and inspiration based on patterns in creation. 
        It is not divination nor a replacement for Islamic guidance. 
        All knowledge belongs to Allah alone. Consult qualified scholars for religious decisions.
      </p>
    </div>
  );
}

function AccessibleButton({ onClick, children, ariaLabel, disabled, ...props }: any) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel || (typeof children === 'string' ? children : 'Button')}
      disabled={disabled}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      {...props}
    >
      {children}
    </button>
  );
}

function ExportButton({ result, name, day, month, year }: any) {
  const exportBlueprint = () => {
    const data = {
      name: name || 'Anonymous',
      birthDate: `${day}/${month}/${year}`,
      result: {
        life: result.life,
        soul: result.soul,
        destiny: result.destiny,
        archetype: result.archetype.name,
        title: result.archetype.title,
        divineName: result.archetype.divineName
      },
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mizan-blueprint-${(name || 'user').toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={exportBlueprint}
      style={{ 
        padding: '8px 16px', 
        borderRadius: 8, 
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'transparent',
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        cursor: 'pointer'
      }}
      aria-label="Export your blueprint as JSON"
    >
      📥 Export Blueprint
    </button>
  );
}

export default function Mizan() {
  const [step, setStep] = useState<'intro'|'input'|'calculating'|'result'>('intro');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{life: number; soul: number; destiny: number; archetype: typeof ARCHETYPES[1]} | null>(null);
  const [revealStep, setRevealStep] = useState(0);
  const [dhikrCount, setDhikrCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'blueprint'|'daily'|'compatibility'|'dhikr'>('blueprint');
  const [previewArchetype, setPreviewArchetype] = useState<number|null>(null);
  const [searchArchetype, setSearchArchetype] = useState('');
  const [darkMode] = useState(true);
  const resultRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Filtered archetypes for search
  const filteredArchetypes = Object.values(ARCHETYPES).filter(a =>
    a.name.toLowerCase().includes(searchArchetype.toLowerCase()) ||
    a.title.toLowerCase().includes(searchArchetype.toLowerCase())
  );

  useEffect(() => {
    const saved = localStorage.getItem('mizan_last');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setName(parsed.name || '');
        setDay(parsed.day || '');
        setMonth(parsed.month || '');
        setYear(parsed.year || '');
      } catch {}
    }
    const savedDhikr = localStorage.getItem('mizan_dhikr_today');
    if (savedDhikr) {
      try {
        const { date, count } = JSON.parse(savedDhikr);
        if (date === new Date().toDateString()) setDhikrCount(count);
      } catch {}
    }
  }, []);

  // Save dhikr progress
  const saveDhikr = (count: number) => {
    localStorage.setItem('mizan_dhikr_today', JSON.stringify({ date: new Date().toDateString(), count }));
  };

  // Calculate function with validation
  const calculate = () => {
    if (!day || !month || !year || year.length < 4) {
      setError('Please fill in all fields');
      return;
    }
    
    const d = parseInt(day);
    const m = parseInt(month);
    const y = parseInt(year);
    
    if (!isValidDate(d, m, y)) {
      setError('Please enter a valid date');
      return;
    }
    
    setError('');
    const cacheKey = getCacheKey(name, day, month, year);
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setResult(parsed);
        setStep('result');
        setRevealStep(0);
        return;
      } catch {}
    }
    
    setStep('calculating');
    setTimeout(() => {
      const life = getLifeNumber(d, m, y);
      const soul = getSoulNumber(d);
      const destiny = getDestinyNumber(m, y);
      const newResult = { life, soul, destiny, archetype: ARCHETYPES[life] };
      localStorage.setItem(cacheKey, JSON.stringify(newResult));
      localStorage.setItem('mizan_last', JSON.stringify({ name, day, month, year }));
      setResult(newResult);
      setStep('result');
      setRevealStep(0);
    }, 2500);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (step === 'result' && e.key === 'Escape') {
        setStep('input');
        setResult(null);
        setRevealStep(0);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [step]);

  // Handle reveal animations
  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];
    
    if (step === 'result') {
      [300, 700, 1100, 1500].forEach((t, i) => {
        const timeout = setTimeout(() => setRevealStep(i + 1), t);
        timeouts.push(timeout);
      });
    }
    
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [step]);

  // Scroll to result
  useEffect(() => {
    if (step === 'result' && resultRef.current) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [step]);

  // Handle dhikr
  const handleDhikr = () => {
    if (!result) return;
    const newCount = dhikrCount < result.archetype.dhikrCount ? dhikrCount + 1 : dhikrCount;
    setDhikrCount(newCount);
    saveDhikr(newCount);
  };

  // Handle share
  const handleShare = () => {
    if (!result) return;
    const arch = result.archetype;
    const text = `✦ My Islamic Blueprint ✦\n\nI am "${arch.title}" — ${arch.name}\n${arch.arabic}\n\nMy Divine Name: ${arch.divineName} ${arch.divineArabic}\nLife Number: ${result.life} | Soul: ${result.soul} | Destiny: ${result.destiny}\n\n"${arch.verse}"\n— ${arch.verseRef}\n\nMy purpose: ${arch.purpose.slice(0, 100)}...\n\n🌿 Discover YOUR Islamic Blueprint free:\niloveislam.life/mizan\n\n#ILoveIslam #IslamicBlueprint #Mizan`;
    
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      navigator.share({ title: 'My Islamic Blueprint — Mizan', text, url: 'https://iloveislam.life/mizan' });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }).catch(() => {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    }
  };

  const arch = result?.archetype;
  const todayVerse = arch ? arch.dailyVerses[getDayOfWeek() % arch.dailyVerses.length] : null;

  return (
    <>
      <Head>
        <title>Mizan - Islamic Life Blueprint | Discover Your Spiritual Archetype</title>
        <meta name="description" content="Discover your Islamic archetype based on Abjad numerology, the 99 Names of Allah, and Quranic guidance. Free self-discovery tool." />
        <meta name="keywords" content="islamic blueprint, mizan, abjad numerology, islamic archetype, 99 names of allah, islamic self discovery" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes" />
        <meta property="og:title" content="Mizan - Islamic Life Blueprint" />
        <meta property="og:description" content="Discover your spiritual archetype based on the 99 Names of Allah and Quranic guidance." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className="min-h-screen" style={{ background: darkMode ? '#060a0f' : '#f5f3f0', fontFamily: "'Georgia', 'Times New Roman', serif" }}>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
          @keyframes shimmer { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 20px rgba(200,169,110,0.3); } 50% { box-shadow: 0 0 40px rgba(200,169,110,0.6); } }
          .float { animation: float 4s ease-in-out infinite; }
          .shimmer { animation: shimmer 3s ease-in-out infinite; }
          .fade-up { animation: fadeUp 0.6s ease-out forwards; }
          .tab-active { border-bottom: 2px solid currentColor; }
          .archetype-card:hover { transform: translateY(-3px) scale(1.02); transition: all 0.25s; }
          .dhikr-btn:active { transform: scale(0.92); }
          button:focus-visible, a:focus-visible, input:focus-visible { outline: 2px solid #c8a96e; outline-offset: 2px; }
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
          }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-thumb { background: #c8a96e33; border-radius: 2px; }
          .qf { font-family: 'Scheherazade New', 'Traditional Arabic', serif; }
        `}</style>

        {/* Header */}
        <header style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50, background: darkMode ? 'rgba(6,10,15,0.9)' : 'rgba(245,243,240,0.9)' }} className="px-5 py-3 flex items-center gap-4 flex-wrap">
          <Link href="/" style={{ color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: 13 }} className="hover:text-white/60 transition-colors">← Back</Link>
          <div className="flex items-center gap-2 flex-1">
            <span style={{ color: '#c8a96e', fontSize: 14 }}>✦</span>
            <span style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: 13, letterSpacing: '0.1em' }}>MIZAN · ISLAMIC LIFE BLUEPRINT</span>
          </div>
          {step === 'result' && result && (
            <div style={{ display: 'flex', gap: 8 }}>
              <ExportButton result={result} name={name} day={day} month={month} year={year} />
              <AccessibleButton onClick={() => { setStep('input'); setResult(null); setRevealStep(0); setDhikrCount(0); }}
                style={{ color: '#c8a96e', fontSize: 12, border: '1px solid #c8a96e44', padding: '4px 12px', borderRadius: 20, background: 'transparent' }}>
                New Reading
              </AccessibleButton>
            </div>
          )}
        </header>

        {/* ── INTRO ── */}
        {step === 'intro' && (
          <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 16px 60px' }}>
            <div className="text-center" style={{ marginBottom: 48 }}>
              <div className="float" style={{ fontSize: 64, marginBottom: 16 }}>✦</div>
              <p style={{ color: '#c8a96e', fontSize: 11, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 12 }}>
                Islamic Numerology & Self-Discovery
              </p>
              <h1 style={{ color: darkMode ? '#fff' : '#1a1a2e', fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 16 }}>
                Discover Your<br />
                <span style={{ color: '#c8a96e' }}>Islamic Blueprint</span>
              </h1>
              <p style={{ color: darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)', fontSize: 15, lineHeight: 1.8, maxWidth: 520, margin: '0 auto 28px' }}>
                Based on the ancient Abjad numerology system used by Islamic scholars for centuries — combined with the 99 Names of Allah and Quranic guidance — your birth date reveals your divine archetype, life purpose, and spiritual path.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
                {['Your Divine Name', 'Life Purpose', 'Daily Verse', 'Rizq Path', 'Compatibility', 'Your Dhikr', 'Prophet Example'].map(f => (
                  <span key={f} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(200,169,110,0.25)', color: 'rgba(200,169,110,0.7)', background: 'rgba(200,169,110,0.05)' }}>{f}</span>
                ))}
              </div>
              <AccessibleButton onClick={() => setStep('input')}
                style={{ background: 'linear-gradient(135deg, #c8a96e, #a07840)', color: '#060a0f', padding: '14px 40px', borderRadius: 50, fontWeight: 700, fontSize: 15, border: 'none' }}>
                Begin Your Journey ✦
              </AccessibleButton>
              <p style={{ color: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)', fontSize: 11, marginTop: 10 }}>Free forever · Private · No data stored on servers</p>
            </div>

            {/* Search Archetypes */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 12 }}>
                Search Archetypes
              </p>
              <input
                type="text"
                placeholder="Search by name or title..."
                value={searchArchetype}
                onChange={(e) => setSearchArchetype(e.target.value)}
                style={{ width: '100%', padding: '10px 16px', borderRadius: 30, border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', color: darkMode ? '#fff' : '#333', fontSize: 14, outline: 'none' }}
              />
            </div>

            {/* Archetype Preview Grid */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 20 }}>
                The 9 Islamic Archetypes — Which Are You?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {filteredArchetypes.map(a => {
                  const archetypeNum = Object.keys(ARCHETYPES).find(k => ARCHETYPES[parseInt(k)] === a);
                  return (
                    <AccessibleButton key={a.name} className="archetype-card"
                      onClick={() => setPreviewArchetype(previewArchetype === parseInt(archetypeNum || '0') ? null : parseInt(archetypeNum || '0'))}
                      style={{ background: `${a.color}10`, border: `1px solid ${a.color}25`, borderRadius: 14, padding: '16px 12px', textAlign: 'center', width: '100%' }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{a.symbol}</div>
                      <p style={{ color: a.color, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{a.title}</p>
                      <p style={{ color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)', fontSize: 10 }} className="qf">{a.arabic}</p>
                      <p style={{ color: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)', fontSize: 10, marginTop: 4 }}>{a.estimatedUsers.toLocaleString()} people</p>
                    </AccessibleButton>
                  );
                })}
              </div>
            </div>

            {/* Archetype Preview Popup */}
            {previewArchetype !== null && ARCHETYPES[previewArchetype] && (
              <div style={{ marginTop: 12, background: `${ARCHETYPES[previewArchetype].color}10`, border: `1px solid ${ARCHETYPES[previewArchetype].color}30`, borderRadius: 16, padding: 20 }} className="fade-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <p style={{ color: ARCHETYPES[previewArchetype].color, fontWeight: 700, fontSize: 16 }}>{ARCHETYPES[previewArchetype].title}</p>
                    <p style={{ color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)', fontSize: 12 }}>{ARCHETYPES[previewArchetype].name} · {ARCHETYPES[previewArchetype].divineName}</p>
                  </div>
                  <span style={{ fontSize: 32 }}>{ARCHETYPES[previewArchetype].symbol}</span>
                </div>
                <p style={{ color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
                  {ARCHETYPES[previewArchetype].personality.slice(0, 180)}...
                </p>
                <p style={{ color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: 11, fontStyle: 'italic' }}>
                  "{ARCHETYPES[previewArchetype].verse}" — {ARCHETYPES[previewArchetype].verseRef}
                </p>
              </div>
            )}

            <ShariaDisclaimer />
          </div>
        )}

        {/* ── INPUT ── */}
        {step === 'input' && (
          <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 16px' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div className="float" style={{ fontSize: 48, marginBottom: 12 }}>✦</div>
              <h2 style={{ color: darkMode ? '#fff' : '#1a1a2e', fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Enter Your Birth Date</h2>
              <p style={{ color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.5)', fontSize: 13 }}>Your birth date is the key to your Islamic blueprint</p>
            </div>

            <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, borderRadius: 20, padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.5)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  Your Name (optional)
                </label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ahmed, Fatima, Muhammad..."
                  style={{ width: '100%', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 12, padding: '12px 16px', color: darkMode ? '#fff' : '#333', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <label style={{ color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.5)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                Date of Birth
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 10, marginBottom: 24 }}>
                <div>
                  <label style={{ color: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)', fontSize: 10, display: 'block', marginBottom: 6 }}>Day</label>
                  <input type="number" min="1" max="31" value={day} onChange={e => setDay(e.target.value)} placeholder="DD"
                    style={{ width: '100%', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 12, padding: '14px 8px', color: darkMode ? '#fff' : '#333', fontSize: 20, fontWeight: 700, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ color: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)', fontSize: 10, display: 'block', marginBottom: 6 }}>Month</label>
                  <select value={month} onChange={e => setMonth(e.target.value)}
                    style={{ width: '100%', background: darkMode ? '#0d1319' : '#f0f0f0', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 12, padding: '14px 8px', color: month ? (darkMode ? '#fff' : '#333') : (darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)'), fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                    <option value="">Month</option>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)', fontSize: 10, display: 'block', marginBottom: 6 }}>Year</label>
                  <input type="number" min="1900" max={new Date().getFullYear()} value={year} onChange={e => setYear(e.target.value)} placeholder="YYYY"
                    style={{ width: '100%', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 12, padding: '14px 8px', color: darkMode ? '#fff' : '#333', fontSize: 16, fontWeight: 700, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(224,112,80,0.1)', border: '1px solid rgba(224,112,80,0.3)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <p style={{ color: '#e07050', fontSize: 13, textAlign: 'center' }}>{error}</p>
                </div>
              )}

              <AccessibleButton onClick={calculate} disabled={!day || !month || !year || year.length < 4}
                style={{ width: '100%', padding: '15px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, background: day && month && year && year.length >= 4 ? 'linear-gradient(135deg, #c8a96e, #a07840)' : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'), color: day && month && year && year.length >= 4 ? '#060a0f' : (darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)') }}>
                Reveal My Blueprint ✦
              </AccessibleButton>
            </div>
            <p style={{ textAlign: 'center', color: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)', fontSize: 11, marginTop: 12 }}>
              Your data never leaves your device. Everything is calculated in your browser.
            </p>
            <ShariaDisclaimer />
          </div>
        )}

        {/* ── CALCULATING ── */}
        {step === 'calculating' && (
          <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 64, animation: 'spin 3s linear infinite', marginBottom: 24 }} role="status" aria-label="Loading">✦</div>
            <p style={{ color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontSize: 18, marginBottom: 8 }}>Calculating your blueprint...</p>
            <p style={{ color: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)', fontSize: 13, marginBottom: 32 }}>Applying the Abjad numerology system</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Reading your birth numbers...', 'Finding your Divine Name...', 'Selecting your Quranic verse...', 'Preparing compatibility...', 'Finalising your blueprint...'].map((t, i) => (
                <p key={t} className="shimmer" style={{ color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: 13, animationDelay: `${i * 0.4}s` }}>{t}</p>
              ))}
            </div>
            <AccessibleButton 
              onClick={() => {
                const d = parseInt(day), m = parseInt(month), y = parseInt(year);
                const life = getLifeNumber(d, m, y);
                const soul = getSoulNumber(d);
                const destiny = getDestinyNumber(m, y);
                const newResult = { life, soul, destiny, archetype: ARCHETYPES[life] };
                setResult(newResult);
                setStep('result');
              }}
              style={{ marginTop: 40, color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}
              ariaLabel="Skip animation">
              Skip animation →
            </AccessibleButton>
          </div>
        )}

        {/* ── RESULT ── */}
        {step === 'result' && result && arch && (
          <div ref={resultRef} style={{ maxWidth: 680, margin: '0 auto', padding: '16px 12px 60px' }}>

            {/* Hero Card */}
            <div ref={cardRef}
              className={`transition-all duration-700 ${revealStep >= 1 ? 'opacity-100' : 'opacity-0'}`}
              style={{ background: arch.bgGradient, border: `1px solid ${arch.color}40`, borderRadius: 24, padding: '32px 24px', marginBottom: 12, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '10%', right: '8%', fontSize: 80, opacity: 0.06 }}>{arch.symbol}</div>
                <div style={{ position: 'absolute', bottom: '8%', left: '6%', opacity: 0.04, fontSize: 100 }} className="qf">{arch.arabic}</div>
              </div>

              {name && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 6 }}>Blueprint for <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{name}</span></p>}
              <div className="float" style={{ fontSize: 56, marginBottom: 12 }}>{arch.symbol}</div>
              <p style={{ color: arch.color, fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 8 }}>Your Islamic Archetype</p>
              <h2 style={{ color: '#fff', fontSize: 32, fontWeight: 700, marginBottom: 4 }}>{arch.title}</h2>
              <p className="qf" style={{ color: arch.color, fontSize: 28, marginBottom: 2 }}>{arch.arabic}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 6 }}>{arch.name}</p>
              
              {/* Popularity bar */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: arch.color, fontSize: 11, marginBottom: 4 }}>
                  🌍 {arch.estimatedUsers.toLocaleString()} people share your archetype
                </p>
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                  <div style={{ width: `${(arch.estimatedUsers / 25000) * 100}%`, height: 4, background: arch.color, borderRadius: 2 }} />
                </div>
              </div>

              {/* Numbers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Life Number', value: result.life, sub: 'Core path' },
                  { label: 'Soul Number', value: result.soul, sub: 'Inner self' },
                  { label: 'Destiny', value: result.destiny, sub: 'Mission' },
                ].map(n => (
                  <div key={n.label} style={{ background: `${arch.color}15`, border: `1px solid ${arch.color}30`, borderRadius: 14, padding: '14px 8px' }}>
                    <p className="number-badge" style={{ color: arch.color, fontSize: 28, fontWeight: 700 }}>{n.value}</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>{n.label}</p>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>{n.sub}</p>
                  </div>
                ))}
              </div>

              {/* Divine name */}
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: '0.3em', marginBottom: 6 }}>YOUR DIVINE NAME</p>
                <p className="qf" style={{ color: arch.color, fontSize: 30, marginBottom: 2 }}>{arch.divineArabic}</p>
                <p style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{arch.divineName}</p>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontStyle: 'italic' }}>"{arch.verse}"</p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 4 }}>{arch.verseRef}</p>

              {/* Prophet example */}
              <div style={{ marginTop: 16, padding: '10px 14px', background: `${arch.color}10`, borderRadius: 10, border: `1px solid ${arch.color}20` }}>
                <p style={{ color: arch.color, fontSize: 11, fontWeight: 600 }}>✦ Your Prophetic Mirror</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>{arch.prophetExample}</p>
              </div>
            </div>

            {/* Share buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <AccessibleButton onClick={handleShare}
                style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: copied ? '#50c878' : `linear-gradient(135deg, ${arch.color}, #a07840)`, color: '#060a0f', fontSize: 13, fontWeight: 700 }}>
                {copied ? '✅ Copied! Share it!' : '✦ Share My Blueprint'}
              </AccessibleButton>
            </div>
            {copied && <p style={{ textAlign: 'center', color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: 11, marginBottom: 12 }}>Paste in WhatsApp, Instagram, or Twitter!</p>}

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, marginBottom: 16, gap: 0 }} className={`transition-all duration-700 ${revealStep >= 2 ? 'opacity-100' : 'opacity-0'}`}>
              {(['blueprint', 'daily', 'compatibility', 'dhikr'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ flex: 1, padding: '10px 4px', background: 'none', border: 'none', borderBottom: activeTab === tab ? `2px solid ${arch.color}` : '2px solid transparent', color: activeTab === tab ? arch.color : (darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)'), fontSize: 11, fontWeight: activeTab === tab ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s', marginBottom: -1 }}>
                  {tab === 'blueprint' && '🗺️ Blueprint'}
                  {tab === 'daily' && '📖 Daily Verse'}
                  {tab === 'compatibility' && '🤝 Companions'}
                  {tab === 'dhikr' && '📿 Dhikr'}
                </button>
              ))}
            </div>

            {/* Blueprint Tab */}
            {activeTab === 'blueprint' && (
              <div className={`transition-all duration-700 ${revealStep >= 2 ? 'opacity-100' : 'opacity-0'}`} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`, borderRadius: 18, padding: 20 }}>
                  <p style={{ color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 12 }}>Your Personality</p>
                  <p style={{ color: darkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)', fontSize: 14, lineHeight: 1.8 }}>{arch.personality}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 14 }}>
                    {arch.strength.map(s => (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${arch.color}10`, borderRadius: 8, padding: '8px 12px' }}>
                        <span style={{ color: arch.color, fontSize: 10 }}>✦</span>
                        <span style={{ color: darkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)', fontSize: 12 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {[
                  { icon: '⚠️', label: 'Your Challenge', text: arch.challenge, c: '#e07050' },
                  { icon: '💎', label: 'Your Rizq & Wealth Path', text: arch.rizq, c: '#50c878' },
                  { icon: '❤️', label: 'Relationships & Love', text: arch.relationship, c: '#d4748c' },
                  { icon: '🎯', label: 'Your Life Purpose', text: arch.purpose, c: arch.color },
                ].map(card => (
                  <div key={card.label} style={{ background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, borderRadius: 16, padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 16 }}>{card.icon}</span>
                      <p style={{ color: card.c, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{card.label}</p>
                    </div>
                    <p style={{ color: darkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)', fontSize: 13, lineHeight: 1.75 }}>{card.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Daily Verse Tab */}
            {activeTab === 'daily' && todayVerse && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: `linear-gradient(135deg, #0a3d2e, #0d5238)`, border: `1px solid ${arch.color}40`, borderRadius: 20, padding: 24, textAlign: 'center' }}>
                  <p style={{ color: arch.color, fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 16 }}>Your Verse for Today</p>
                  <p style={{ color: '#fff', fontSize: 18, lineHeight: 1.9, fontStyle: 'italic', marginBottom: 12 }}>"{todayVerse.verse}"</p>
                  <p style={{ color: arch.color, fontSize: 12, marginBottom: 20 }}>{todayVerse.ref}</p>
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '14px 16px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '0.2em', marginBottom: 8 }}>REFLECTION FOR THE {arch.title.toUpperCase()}</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.75 }}>{todayVerse.reflection}</p>
                  </div>
                </div>

                <p style={{ color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: 12, textAlign: 'center' }}>A new verse awaits you every day of the week 🌙</p>

                <div style={{ background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, borderRadius: 16, padding: 18 }}>
                  <p style={{ color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: 10, letterSpacing: '0.3em', marginBottom: 14 }}>ALL 7 VERSES FOR YOUR ARCHETYPE</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {arch.dailyVerses.map((v, i) => (
                      <div key={i} style={{ padding: '12px 14px', background: i === getDayOfWeek() % arch.dailyVerses.length ? `${arch.color}10` : 'transparent', border: i === getDayOfWeek() % arch.dailyVerses.length ? `1px solid ${arch.color}30` : '1px solid transparent', borderRadius: 10 }}>
                        <p style={{ color: i === getDayOfWeek() % arch.dailyVerses.length ? arch.color : (darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'), fontSize: 13, fontStyle: 'italic', marginBottom: 4 }}>"{v.verse}"</p>
                        <p style={{ color: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)', fontSize: 11 }}>{v.ref}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Compatibility Tab */}
            {activeTab === 'compatibility' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`, borderRadius: 18, padding: 20 }}>
                  <p style={{ color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 8 }}>Why These Companions?</p>
                  <p style={{ color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontSize: 13, lineHeight: 1.7 }}>{arch.compatibilityReason}</p>
                </div>

                <div>
                  <p style={{ color: '#50c878', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>✦ Your Best Companions</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {arch.companions.map(n => {
                      const a = ARCHETYPES[n];
                      return (
                        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 14, background: `${a.color}08`, border: `1px solid ${a.color}20`, borderRadius: 14, padding: '14px 16px' }}>
                          <span style={{ fontSize: 28, flexShrink: 0 }}>{a.symbol}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ color: a.color, fontWeight: 700, fontSize: 14 }}>{a.title}</p>
                            <p style={{ color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)', fontSize: 11 }}>{a.name} · Life Number {n}</p>
                            <p style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: 12, marginTop: 4 }}>{a.personality.slice(0, 90)}...</p>
                          </div>
                          <div style={{ background: '#50c87822', border: '1px solid #50c87844', borderRadius: 20, padding: '3px 10px', flexShrink: 0 }}>
                            <span style={{ color: '#50c878', fontSize: 11 }}>✦ Compatible</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p style={{ color: '#e07050', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>⚠️ Challenging Dynamics</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {arch.incompatible.map(n => {
                      const a = ARCHETYPES[n];
                      return (
                        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(224,112,80,0.05)', border: '1px solid rgba(224,112,80,0.15)', borderRadius: 14, padding: '14px 16px' }}>
                          <span style={{ fontSize: 28, flexShrink: 0 }}>{a.symbol}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', fontWeight: 700, fontSize: 14 }}>{a.title}</p>
                            <p style={{ color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: 11 }}>Life Number {n} — requires patience & understanding</p>
                          </div>
                          <div style={{ background: 'rgba(224,112,80,0.1)', border: '1px solid rgba(224,112,80,0.3)', borderRadius: 20, padding: '3px 10px', flexShrink: 0 }}>
                            <span style={{ color: '#e07050', fontSize: 11 }}>⚠️ Challenging</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderRadius: 14, padding: 16, textAlign: 'center' }}>
                  <p style={{ color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: 12 }}>
                    In Islam, every relationship can work with Tawakkul and patience. These are tendencies, not destinies. Allah writes our connections.
                  </p>
                </div>
              </div>
            )}

            {/* Dhikr Tab */}
            {activeTab === 'dhikr' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: 'linear-gradient(135deg, #0a3d2e, #0d5238)', border: `1px solid ${arch.color}40`, borderRadius: 20, padding: 28, textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 14 }}>Your Recommended Dhikr</p>
                  <p className="qf" style={{ color: arch.color, fontSize: 34, marginBottom: 6, lineHeight: 1.6 }}>{arch.dhikrArabic}</p>
                  <p style={{ color: '#fff', fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{arch.dhikr}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 28 }}>Recite {arch.dhikrCount} times daily</p>

                  <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 20px' }}>
                    <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                      <circle cx="60" cy="60" r="50" fill="none"
                        stroke={arch.color} strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - Math.min(dhikrCount / arch.dhikrCount, 1))}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.2s ease' }} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: arch.color, fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{dhikrCount}</span>
                      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 2 }}>/ {arch.dhikrCount}</span>
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 2 }}>
                        {Math.round((dhikrCount / arch.dhikrCount) * 100)}%
                      </span>
                    </div>
                  </div>

                  <AccessibleButton onClick={handleDhikr} className="dhikr-btn"
                    style={{ padding: '16px 40px', borderRadius: 50, border: 'none', background: `linear-gradient(135deg, ${arch.color}, #a07840)`, color: '#060a0f', fontSize: 16, fontWeight: 700, marginBottom: 12, boxShadow: `0 4px 24px ${arch.color}44` }}>
                    📿 {dhikrCount === 0 ? 'Begin Dhikr' : 'Tap to Count'}
                  </AccessibleButton>

                  {dhikrCount >= arch.dhikrCount && (
                    <p style={{ color: '#50c878', fontSize: 14, fontWeight: 600 }}>🎉 Alhamdulillah! Daily dhikr complete!</p>
                  )}

                  {dhikrCount > 0 && dhikrCount < arch.dhikrCount && (
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginBottom: 8 }}>
                        {arch.dhikrCount - dhikrCount} remaining · Saved automatically
                      </p>
                      <AccessibleButton onClick={() => { setDhikrCount(0); saveDhikr(0); }}
                        style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, background: 'none', border: 'none' }}>
                        Reset for today
                      </AccessibleButton>
                    </div>
                  )}
                </div>

                <div style={{ background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, borderRadius: 16, padding: 18 }}>
                  <p style={{ color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: 10, letterSpacing: '0.3em', marginBottom: 12 }}>WHY THIS DHIKR FOR YOU</p>
                  <p style={{ color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontSize: 13, lineHeight: 1.75 }}>
                    The Divine Name <span style={{ color: arch.color }}>{arch.divineName}</span> ({arch.divineArabic}) reflects the attribute of Allah that your archetype most needs to connect with. Regular recitation of this Name aligns your soul with its divine purpose.
                  </p>
                </div>

                <div style={{ background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, borderRadius: 16, padding: 18 }}>
                  <p style={{ color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: 10, letterSpacing: '0.3em', marginBottom: 8 }}>HADITH ON DHIKR</p>
                  <p style={{ color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontSize: 13, fontStyle: 'italic', lineHeight: 1.75 }}>
                    "Shall I tell you about the best of your deeds, the purest in the sight of your King, the highest in raising your rank, and better for you than spending gold and silver, and better than meeting your enemy and striking their necks?" They said: Yes. He said: "Remembrance of Allah."
                  </p>
                  <p style={{ color: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)', fontSize: 11, marginTop: 8 }}>— Tirmidhi & Ibn Majah</p>
                </div>
              </div>
            )}

            <ShariaDisclaimer />
            
            <p style={{ textAlign: 'center', color: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)', fontSize: 11, marginTop: 24 }}>
              Mizan is for self-reflection and inspiration only. All guidance should be sought from Allah ﷻ and qualified Islamic scholars.
            </p>
          </div>
        )}
      </div>
    </>
  );
}