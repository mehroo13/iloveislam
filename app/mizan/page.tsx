'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ── ABJAD NUMEROLOGY (Islamic letter-number system) ──
const ABJAD = [1,2,3,4,5,6,7,8,9,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600,700,800,900,1000];

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

// ── THE 9 ISLAMIC ARCHETYPES ──
const ARCHETYPES: Record<number, {
  name: string;
  arabic: string;
  title: string;
  divineName: string;
  divineArabic: string;
  verse: string;
  verseRef: string;
  color: string;
  glow: string;
  lightColor: string;
  symbol: string;
  personality: string;
  strength: string[];
  challenge: string;
  rizq: string;
  relationship: string;
  purpose: string;
  dhikr: string;
  dhikrArabic: string;
  dhikrCount: number;
}> = {
  1: {
    name: 'Al-Awwal', arabic: 'الأَوَّل', title: 'The Pioneer',
    divineName: 'Al-Wahid', divineArabic: 'الْوَاحِدُ',
    verse: 'He is the First and the Last, the Evident and the Hidden.',
    verseRef: 'Quran 57:3',
    color: '#c8a96e', glow: 'rgba(200,169,110,0.3)', lightColor: '#fef3e2',
    symbol: '☀️',
    personality: 'You are a natural leader with a pioneering spirit. Born to walk paths others have not yet discovered, you carry the light of originality. Like Sayyiduna Ibrahim ﷺ who stood alone against his people, you have the courage to stand for truth even in solitude.',
    strength: ['Natural leadership', 'Original thinking', 'Unwavering conviction', 'Divine courage'],
    challenge: 'Your challenge is patience with those who move slower. Practice the Sunnah of Shura — consulting others even when you know the way.',
    rizq: 'Your wealth flows through leadership roles, entrepreneurship, and independent ventures. Allah has written rizq in paths you create yourself.',
    relationship: 'You love deeply and protect fiercely. You seek a partner who respects your independence and matches your spiritual ambition. Give your loved ones space to grow.',
    purpose: 'To illuminate new paths for the Ummah. You are here to start things, to be the first, to show others what is possible when you trust Allah completely.',
    dhikr: 'Ya Wahid', dhikrArabic: 'يَا وَاحِدُ', dhikrCount: 1000,
  },
  2: {
    name: 'Al-Tawazun', arabic: 'التَّوَازُن', title: 'The Peacemaker',
    divineName: 'Al-Lateef', divineArabic: 'اللَّطِيفُ',
    verse: 'And He is the Subtle, the All-Aware.',
    verseRef: 'Quran 67:14',
    color: '#7eb8d4', glow: 'rgba(126,184,212,0.3)', lightColor: '#e8f4f9',
    symbol: '🌊',
    personality: 'You are the bridge between worlds — gifted with deep empathy and a rare ability to bring harmony to chaos. Like water that finds its level, you naturally restore balance. The Prophet ﷺ said "Gentleness adorns everything" — this is your nature.',
    strength: ['Deep empathy', 'Peacemaking', 'Intuitive wisdom', 'Gentle strength'],
    challenge: 'Your challenge is over-giving. Learn that your own spiritual cup must be full before you pour into others. Setting limits is not selfishness — it is wisdom.',
    rizq: 'Your wealth flows through partnerships, counselling, healing, and serving others. Collaborative ventures and supporting roles bring your greatest blessings.',
    relationship: 'You are the most devoted partner. You feel deeply and love completely. Seek someone who appreciates your sensitivity and does not mistake your gentleness for weakness.',
    purpose: 'To heal divisions in the Ummah. You are here to reconcile, to listen, to carry the pain of others with grace and return it as hope.',
    dhikr: 'Ya Lateef', dhikrArabic: 'يَا لَطِيفُ', dhikrCount: 129,
  },
  3: {
    name: 'Al-Bayaan', arabic: 'البَيَان', title: 'The Illuminator',
    divineName: 'Al-Nur', divineArabic: 'النُّورُ',
    verse: 'Allah is the Light of the heavens and the earth.',
    verseRef: 'Quran 24:35',
    color: '#f0c040', glow: 'rgba(240,192,64,0.3)', lightColor: '#fefce8',
    symbol: '✨',
    personality: 'You are a bearer of light — eloquent, expressive, and touched with divine creativity. Your words carry weight and your presence lifts rooms. Like the companions who memorised and spread the Quran, you are built to carry sacred knowledge forward.',
    strength: ['Eloquence and expression', 'Creative vision', 'Inspiring others', 'Joy and optimism'],
    challenge: 'Your challenge is focus. Your gifts are many and the world pulls you in many directions. Choose your calling with intention and go deep rather than wide.',
    rizq: 'Your wealth flows through communication, teaching, writing, art, and dawah. Your voice and creativity are your greatest assets.',
    relationship: 'You need a partner who stimulates your mind and appreciates your creativity. You give joy freely — seek someone who gives it back.',
    purpose: 'To spread the light of Islam through beauty and expression. You are here to make the truth irresistible.',
    dhikr: 'Ya Nur', dhikrArabic: 'يَا نُورُ', dhikrCount: 1001,
  },
  4: {
    name: 'Al-Itqan', arabic: 'الإِتْقَان', title: 'The Builder',
    divineName: 'Al-Matin', divineArabic: 'الْمَتِينُ',
    verse: 'Indeed, Allah loves those who act with excellence.',
    verseRef: 'Quran 2:195',
    color: '#6b8f71', glow: 'rgba(107,143,113,0.3)', lightColor: '#f0f7f1',
    symbol: '🏔️',
    personality: 'You are the foundation upon which communities are built. Reliable, disciplined, and tireless, you embody the Islamic concept of Itqan — doing everything with excellence. The Prophet ﷺ said "Allah loves when one of you does a job, to do it with Itqan." That is you.',
    strength: ['Unshakeable discipline', 'Trustworthiness', 'Practical wisdom', 'Long-term vision'],
    challenge: 'Your challenge is rigidity. The Sunnah teaches us flexibility — even in worship, Allah made concessions for travellers. Learn to bend without breaking.',
    rizq: 'Your wealth flows through steady, long-term work. You build things that last. Real estate, structured businesses, and skilled crafts are your domain.',
    relationship: 'You are the most loyal partner — your word is your bond. Seek someone who values consistency over excitement and matches your devotion.',
    purpose: 'To build lasting structures for the Ummah — institutions, families, businesses, and communities that outlive you.',
    dhikr: 'Ya Matin', dhikrArabic: 'يَا مَتِينُ', dhikrCount: 500,
  },
  5: {
    name: 'Al-Hurriyyah', arabic: 'الحُرِّيَّة', title: 'The Voyager',
    divineName: 'Al-Fattah', divineArabic: 'الْفَتَّاحُ',
    verse: 'Say: Travel through the land and observe how He began creation.',
    verseRef: 'Quran 29:20',
    color: '#9b6b9b', glow: 'rgba(155,107,155,0.3)', lightColor: '#f5eef8',
    symbol: '🌍',
    personality: 'You are the free spirit of the Ummah — adaptable, curious, and drawn to the horizons of this world. Like the great Muslim travellers Ibn Battuta and Ibn Khaldun who mapped the world for the sake of knowledge, you learn by experiencing.',
    strength: ['Adaptability', 'Courage to explore', 'Cross-cultural wisdom', 'Infectious enthusiasm'],
    challenge: 'Your challenge is rootedness. Freedom without anchor becomes drift. Establish your daily Salah as the five pillars that hold your life steady while you roam.',
    rizq: 'Your wealth flows through travel, trade, diverse ventures, and connecting people across cultures. Your network is your net worth.',
    relationship: 'You need a partner who gives you wings, not chains. Seek someone who travels the inner and outer worlds with you.',
    purpose: 'To spread Islam across cultures and borders — to be a living bridge between the Ummah and the world.',
    dhikr: 'Ya Fattah', dhikrArabic: 'يَا فَتَّاحُ', dhikrCount: 489,
  },
  6: {
    name: 'Al-Rahma', arabic: 'الرَّحْمَة', title: 'The Nurturer',
    divineName: 'Al-Wadud', divineArabic: 'الْوَدُودُ',
    verse: 'And We have not sent you except as a mercy to the worlds.',
    verseRef: 'Quran 21:107',
    color: '#d4748c', glow: 'rgba(212,116,140,0.3)', lightColor: '#fdf0f3',
    symbol: '🌹',
    personality: 'You carry the divine quality of Rahma — mercy — as your defining trait. Like a mother\'s love that knows no conditions, you give without keeping score. The Prophet ﷺ was described as "rahmatun lil-alameen" — this quality lives strongly in you.',
    strength: ['Unconditional compassion', 'Healing presence', 'Community building', 'Generous heart'],
    challenge: 'Your challenge is learning that mercy also means sometimes saying no. Enabling is not mercy. The most merciful act is sometimes the difficult one.',
    rizq: 'Your wealth flows through caring professions, family businesses, hospitality, and community work. Your home is your greatest investment.',
    relationship: 'You are the heart of every family. You love deeply and create sanctuaries of peace. Seek a partner who cherishes your nurturing nature.',
    purpose: 'To embody the Rahma of Islam in every interaction — to be the reason someone feels Allah\'s love through you.',
    dhikr: 'Ya Wadud', dhikrArabic: 'يَا وَدُودُ', dhikrCount: 33,
  },
  7: {
    name: 'Al-Hikmah', arabic: 'الحِكْمَة', title: 'The Seeker',
    divineName: 'Al-Alim', divineArabic: 'اَلْعَلِيمُ',
    verse: 'And He taught you what you did not know. And the favour of Allah upon you has been great.',
    verseRef: 'Quran 4:113',
    color: '#5b8dd4', glow: 'rgba(91,141,212,0.3)', lightColor: '#eef4fc',
    symbol: '🔭',
    personality: 'You are the scholar, the contemplative, the seeker of divine wisdom. You were born to go deep — into books, into prayer, into the mysteries of existence. Like Imam Ghazali who retreated to find truth, you find God in silence and study.',
    strength: ['Profound intellect', 'Spiritual depth', 'Pattern recognition', 'Quiet wisdom'],
    challenge: 'Your challenge is connection. Wisdom that stays in your mind helps no one. The Prophet ﷺ said "convey from me even one verse." Share what you know.',
    rizq: 'Your wealth flows through knowledge-based work — research, scholarship, medicine, law, and any field requiring deep expertise.',
    relationship: 'You need depth, not surface. Seek a partner who can sit in comfortable silence and engage in meaningful conversation.',
    purpose: 'To be a bridge between divine knowledge and the Ummah — to make the complex simple and bring people closer to Allah through understanding.',
    dhikr: 'Ya Alim', dhikrArabic: 'يَا عَلِيمُ', dhikrCount: 150,
  },
  8: {
    name: 'Al-Quwwah', arabic: 'القُوَّة', title: 'The Commander',
    divineName: 'Al-Qawi', divineArabic: 'الْقَوِيُّ',
    verse: 'Indeed, the strong believer is more beloved to Allah than the weak believer.',
    verseRef: 'Sahih Muslim',
    color: '#c0392b', glow: 'rgba(192,57,43,0.3)', lightColor: '#fdf0ee',
    symbol: '⚔️',
    personality: 'You carry the strength of mountains and the ambition of eagles. You were built for authority, for impact, for changing the world at scale. Like Umar ibn al-Khattab RA whose conversion shifted the entire power of early Islam, your strength is a divine gift.',
    strength: ['Commanding presence', 'Strategic mind', 'Extraordinary drive', 'Transformative vision'],
    challenge: 'Your challenge is the ego. Power is a test. The greatest leaders in Islam — Umar, Salahuddin — were known for their humility in private. Strength must always serve others.',
    rizq: 'Your wealth flows through business empires, leadership positions, and ventures that operate at scale. You are built for significant financial responsibility.',
    relationship: 'You need a partner who is your equal in strength — who challenges and supports you. Never mistake softness for weakness in those around you.',
    purpose: 'To be a force for justice in the world — to use your power to lift the Ummah and establish what is right.',
    dhikr: 'Ya Qawi', dhikrArabic: 'يَا قَوِيُّ', dhikrCount: 116,
  },
  9: {
    name: 'Al-Kamal', arabic: 'الكَمَال', title: 'The Completer',
    divineName: 'Al-Kamil', divineArabic: 'الكَامِل',
    verse: 'This day I have perfected for you your religion and completed My favour upon you.',
    verseRef: 'Quran 5:3',
    color: '#8e44ad', glow: 'rgba(142,68,173,0.3)', lightColor: '#f5eef8',
    symbol: '🌌',
    personality: 'You are the completion — the one who brings things full circle. Nine is the number of perfection in Islamic numerology, the final digit before return. You carry an old soul, a humanitarian heart, and a vision that transcends borders. You feel the pain of the entire Ummah.',
    strength: ['Universal compassion', 'Visionary thinking', 'Spiritual completion', 'Timeless wisdom'],
    challenge: 'Your challenge is endings — you must learn to let go. Not every circle you close needs to be reopened. Trust Allah with what has passed.',
    rizq: 'Your wealth flows through service to humanity, philanthropic leadership, and work that has global impact. Your giving is your greatest investment.',
    relationship: 'You love all of humanity and can struggle to give one person the totality of that love. Seek a partner who understands your vast heart.',
    purpose: 'To complete what others began — to be the final piece that makes the Ummah whole. You are here to leave the world better than you found it.',
    dhikr: 'Subhan Allah wa bihamdihi', dhikrArabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', dhikrCount: 100,
  },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Mizan() {
  const [step, setStep] = useState<'intro'|'input'|'calculating'|'result'>('intro');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [name, setName] = useState('');
  const [result, setResult] = useState<{life: number; soul: number; destiny: number; archetype: typeof ARCHETYPES[1]} | null>(null);
  const [revealStep, setRevealStep] = useState(0);
  const [dhikrCount, setDhikrCount] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const calculate = () => {
    if (!day || !month || !year || year.length < 4) return;
    setStep('calculating');
    setTimeout(() => {
      const d = parseInt(day), m = parseInt(month), y = parseInt(year);
      const life = getLifeNumber(d, m, y);
      const soul = getSoulNumber(d);
      const destiny = getDestinyNumber(m, y);
      setResult({ life, soul, destiny, archetype: ARCHETYPES[life] });
      setStep('result');
      setRevealStep(0);
      setTimeout(() => setRevealStep(1), 300);
      setTimeout(() => setRevealStep(2), 800);
      setTimeout(() => setRevealStep(3), 1400);
      setTimeout(() => setRevealStep(4), 2000);
    }, 3000);
  };

  useEffect(() => {
    if (step === 'result' && resultRef.current) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [step]);

  const arch = result?.archetype;

  return (
    <div className="min-h-screen" style={{ background: '#080c10' }}>

      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-4 border-b border-white/5">
        <Link href="/" className="text-white/40 hover:text-white/80 text-sm transition-colors">← Back</Link>
        <div className="flex items-center gap-2">
          <span style={{ color: '#c8a96e' }}>✦</span>
          <span className="text-white/60 text-sm font-medium">Mizan — Islamic Life Blueprint</span>
        </div>
      </header>

      {/* ── INTRO SCREEN ── */}
      {step === 'intro' && (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="mb-8">
            <div className="text-6xl mb-6 animate-pulse">✦</div>
            <p className="text-xs tracking-[0.4em] uppercase mb-4" style={{ color: '#c8a96e' }}>
              Islamic Numerology & Self-Discovery
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Discover Your<br />
              <span style={{ color: '#c8a96e' }}>Islamic Blueprint</span>
            </h1>
            <p className="text-white/50 text-base leading-relaxed max-w-lg mx-auto mb-8">
              Based on the ancient Abjad numerology system used by Islamic scholars for centuries — combined with the 99 Names of Allah and Quranic guidance — your birth date reveals your divine archetype, life purpose, and spiritual path.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {['Your Divine Name', 'Life Purpose', 'Soul Number', 'Rizq Path', 'Your Dhikr', 'Quranic Verse'].map(f => (
                <span key={f} className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/50">{f}</span>
              ))}
            </div>

            <button onClick={() => setStep('input')}
              className="px-10 py-4 rounded-2xl font-semibold text-base transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #c8a96e, #a07840)', color: '#080c10' }}>
              Begin Your Journey ✦
            </button>

            <p className="text-white/20 text-xs mt-4">Based on Islamic Abjad numerology · Free forever · Private</p>
          </div>

          {/* The 9 archetypes preview */}
          <div className="mt-12 grid grid-cols-3 gap-3">
            {Object.values(ARCHETYPES).map(a => (
              <div key={a.name} className="rounded-xl border border-white/5 p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="text-2xl mb-1">{a.symbol}</div>
                <p className="text-xs font-medium text-white/60">{a.title}</p>
                <p className="font-arabic text-xs mt-0.5" style={{ color: a.color }}>{a.arabic}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INPUT SCREEN ── */}
      {step === 'input' && (
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <div className="text-4xl mb-4">✦</div>
            <h2 className="text-2xl font-bold text-white mb-2">Enter Your Birth Date</h2>
            <p className="text-white/40 text-sm">Your birth date is the key to your Islamic blueprint</p>
          </div>

          <div className="rounded-2xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>

            {/* Name */}
            <div className="mb-5">
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Your Name (optional)</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Ahmed, Fatima..."
                className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none border border-white/10 focus:border-white/30 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>

            {/* Date inputs */}
            <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">Date of Birth</label>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div>
                <label className="text-xs text-white/30 mb-1 block">Day</label>
                <input type="number" min="1" max="31" value={day}
                  onChange={e => setDay(e.target.value)}
                  placeholder="DD"
                  className="w-full rounded-xl px-3 py-3 text-white text-center text-lg font-bold outline-none border border-white/10 focus:border-white/30 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
              <div>
                <label className="text-xs text-white/30 mb-1 block">Month</label>
                <select value={month} onChange={e => setMonth(e.target.value)}
                  className="w-full rounded-xl px-2 py-3 text-white text-sm outline-none border border-white/10 focus:border-white/30 transition-all"
                  style={{ background: '#111418' }}>
                  <option value="">MM</option>
                  {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/30 mb-1 block">Year</label>
                <input type="number" min="1900" max="2025" value={year}
                  onChange={e => setYear(e.target.value)}
                  placeholder="YYYY"
                  className="w-full rounded-xl px-3 py-3 text-white text-center text-lg font-bold outline-none border border-white/10 focus:border-white/30 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
            </div>

            <button onClick={calculate}
              disabled={!day || !month || !year || year.length < 4}
              className="w-full py-4 rounded-xl font-bold text-base transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #c8a96e, #a07840)', color: '#080c10' }}>
              Reveal My Blueprint ✦
            </button>
          </div>

          <p className="text-center text-white/20 text-xs mt-4">
            We do not store your data. Everything is calculated privately in your browser.
          </p>
        </div>
      )}

      {/* ── CALCULATING SCREEN ── */}
      {step === 'calculating' && (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <div className="text-6xl mb-8 animate-spin" style={{ animationDuration: '3s' }}>✦</div>
          <p className="text-white/60 text-lg mb-2">Calculating your blueprint...</p>
          <p className="text-white/30 text-sm mb-8">Applying the Abjad numerology system</p>
          <div className="space-y-2 text-sm text-white/40">
            {['Reading your birth numbers...', 'Finding your Divine Name...', 'Selecting your Quranic verse...', 'Preparing your blueprint...'].map((t, i) => (
              <p key={t} className="animate-pulse" style={{ animationDelay: `${i * 0.5}s` }}>{t}</p>
            ))}
          </div>
        </div>
      )}

      {/* ── RESULT SCREEN ── */}
      {step === 'result' && result && arch && (
        <div ref={resultRef} className="max-w-2xl mx-auto px-4 py-8">

          {/* Hero card */}
          <div className={`rounded-3xl p-8 mb-5 text-center relative overflow-hidden transition-all duration-700 ${revealStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ background: `linear-gradient(135deg, #0d1117 0%, ${arch.color}22 100%)`, border: `1px solid ${arch.color}40` }}>

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 right-6 text-6xl opacity-10">{arch.symbol}</div>
              <div className="absolute bottom-4 left-6 opacity-5 font-arabic text-7xl">{arch.arabic}</div>
            </div>

            {name && <p className="text-white/40 text-sm mb-2">Blueprint for <span className="text-white/70 font-medium">{name}</span></p>}

            <div className="text-5xl mb-4">{arch.symbol}</div>
            <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: arch.color }}>Your Islamic Archetype</p>
            <h2 className="text-3xl font-bold text-white mb-1">{arch.title}</h2>
            <p className="font-arabic text-3xl mb-4" style={{ color: arch.color }}>{arch.arabic}</p>

            {/* 3 numbers */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { label: 'Life Number', value: result.life, sub: 'Core path' },
                { label: 'Soul Number', value: result.soul, sub: 'Inner self' },
                { label: 'Destiny Number', value: result.destiny, sub: 'Mission' },
              ].map(n => (
                <div key={n.label} className="rounded-xl p-3" style={{ background: `${arch.color}15`, border: `1px solid ${arch.color}30` }}>
                  <p className="text-2xl font-bold" style={{ color: arch.color }}>{n.value}</p>
                  <p className="text-white/60 text-xs mt-0.5">{n.label}</p>
                  <p className="text-white/30 text-xs">{n.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Divine Name */}
          <div className={`rounded-2xl p-6 mb-4 text-center transition-all duration-700 delay-200 ${revealStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ background: `${arch.color}10`, border: `1px solid ${arch.color}25` }}>
            <p className="text-xs tracking-widest uppercase text-white/40 mb-2">Your Divine Name from the 99</p>
            <p className="font-arabic text-4xl mb-1" style={{ color: arch.color }}>{arch.divineArabic}</p>
            <p className="text-white text-xl font-semibold mb-3">{arch.divineName}</p>
            <div className="border-t border-white/10 pt-3 mt-3">
              <p className="text-white/60 text-sm italic leading-relaxed">"{arch.verse}"</p>
              <p className="text-white/30 text-xs mt-1">{arch.verseRef}</p>
            </div>
          </div>

          {/* Personality */}
          <div className={`rounded-2xl p-6 mb-4 transition-all duration-700 delay-300 ${revealStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs tracking-widest uppercase text-white/30 mb-3">Your Personality</p>
            <p className="text-white/80 text-sm leading-relaxed">{arch.personality}</p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {arch.strength.map(s => (
                <div key={s} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: `${arch.color}15` }}>
                  <span style={{ color: arch.color }} className="text-xs">✦</span>
                  <span className="text-white/70 text-xs">{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4 detail cards */}
          <div className={`grid grid-cols-1 gap-4 mb-4 transition-all duration-700 delay-500 ${revealStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

            {[
              { icon: '⚠️', label: 'Your Challenge', text: arch.challenge, color: '#e07050' },
              { icon: '💎', label: 'Your Rizq & Wealth Path', text: arch.rizq, color: '#50c878' },
              { icon: '❤️', label: 'Relationships & Love', text: arch.relationship, color: '#d4748c' },
              { icon: '🎯', label: 'Your Life Purpose', text: arch.purpose, color: arch.color },
            ].map(card => (
              <div key={card.label} className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span>{card.icon}</span>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: card.color }}>{card.label}</p>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>

          {/* Dhikr recommendation */}
          <div className={`rounded-2xl p-6 mb-6 text-center transition-all duration-700 delay-700 ${revealStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ background: `linear-gradient(135deg, #0a3d2e, #0d5238)`, border: `1px solid ${arch.color}40` }}>
            <p className="text-xs tracking-widest uppercase text-white/40 mb-3">Your Recommended Dhikr</p>
            <p className="font-arabic text-3xl mb-2" style={{ color: arch.color }}>{arch.dhikrArabic}</p>
            <p className="text-white text-lg font-semibold mb-1">{arch.dhikr}</p>
            <p className="text-white/40 text-xs mb-5">Recite {arch.dhikrCount} times daily for your soul's alignment</p>

            {/* Mini dhikr counter */}
            <div className="bg-black/20 rounded-xl p-4">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                  <circle cx="50" cy="50" r="42" fill="none"
                    stroke={arch.color} strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - Math.min(dhikrCount / arch.dhikrCount, 1))}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-white font-bold text-lg">{dhikrCount}</span>
                  <span className="text-white/30 text-xs">/ {arch.dhikrCount}</span>
                </div>
              </div>
              <button onClick={() => setDhikrCount(c => c < arch.dhikrCount ? c + 1 : c)}
                className="px-8 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 hover:opacity-90"
                style={{ background: arch.color, color: '#080c10' }}>
                📿 Tap to Count
              </button>
              {dhikrCount >= arch.dhikrCount && (
                <p className="text-white/60 text-xs mt-2">🎉 Alhamdulillah! Daily dhikr complete!</p>
              )}
              {dhikrCount > 0 && dhikrCount < arch.dhikrCount && (
                <button onClick={() => setDhikrCount(0)} className="text-white/20 text-xs mt-2 hover:text-white/40 block mx-auto">Reset</button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={() => { setStep('input'); setResult(null); setDhikrCount(0); }}
              className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm hover:border-white/20 hover:text-white/80 transition-all">
              ← Try Another Date
            </button>
            <button onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'My Islamic Blueprint', text: `I am ${arch.title} (${arch.name}) — Discover yours at iloveislam.life/mizan`, url: 'https://iloveislam.life/mizan' });
              }
            }}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
              style={{ background: arch.color, color: '#080c10' }}>
              Share My Blueprint ✦
            </button>
          </div>

          <p className="text-center text-white/15 text-xs mt-4 pb-8">
            Mizan is for self-reflection and inspiration only. All guidance should be sought from Allah ﷻ and qualified Islamic scholars.
          </p>
        </div>
      )}
    </div>
  );
}
