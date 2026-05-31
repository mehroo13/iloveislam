'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Preset {
  name: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  target: number | null; // null = free mode
  color: string;
  hadith: string;
  category: 'tasbih' | 'tahlil' | 'istighfar' | 'salawat' | 'dua' | 'free';
}

interface DhikrHistoryEntry {
  dhikr: string;
  count: number;
  date: string; // ISO date string
  duration: number; // seconds
}

// ─── Presets ─────────────────────────────────────────────────────────────────
const PRESETS: Preset[] = [
  {
    name: 'Subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'Subhānallāh',
    meaning: 'Glory be to Allah',
    target: 33,
    color: 'emerald',
    category: 'tasbih',
    hadith: 'Whoever recites Subhanallah, Alhamdulillah, and Allahu Akbar 33 times each after every prayer will have their sins forgiven, even if they are as much as the foam of the sea. — Sahih Muslim',
  },
  {
    name: 'Alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillāh',
    meaning: 'All praise be to Allah',
    target: 33,
    color: 'blue',
    category: 'tasbih',
    hadith: '"Alhamdulillah fills the scale of good deeds." — Sahih Muslim',
  },
  {
    name: 'Allahu Akbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allāhu Akbar',
    meaning: 'Allah is the Greatest',
    target: 33,
    color: 'purple',
    category: 'tasbih',
    hadith: '"Subhanallah, Alhamdulillah, and Allahu Akbar are more beloved to me than all that the sun rises over." — Sahih Muslim',
  },
  {
    name: 'La ilaha illallah',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
    transliteration: 'Lā ilāha illallāh',
    meaning: 'There is no god but Allah',
    target: 100,
    color: 'amber',
    category: 'tahlil',
    hadith: '"The best dhikr is La ilaha illallah." — Sunan Tirmidhi',
  },
  {
    name: 'Tahlil (Full)',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    transliteration: 'Lā ilāha illallāhu wahdahu lā sharīka lah',
    meaning: 'No god but Allah alone, no partner has He',
    target: 100,
    color: 'gold',
    category: 'tahlil',
    hadith: '"Whoever says this 100 times will have a reward equal to freeing 10 slaves, 100 good deeds written, 100 sins wiped away." — Sahih Bukhari',
  },
  {
    name: 'Astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullāh',
    meaning: 'I seek forgiveness from Allah',
    target: 100,
    color: 'rose',
    category: 'istighfar',
    hadith: 'The Prophet ﷺ used to seek forgiveness more than 100 times per day. — Sahih Bukhari',
  },
  {
    name: 'Salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
    transliteration: 'Allāhumma ṣalli ʿalā Muḥammad',
    meaning: 'Blessings upon the Prophet ﷺ',
    target: 100,
    color: 'teal',
    category: 'salawat',
    hadith: '"Whoever sends blessings upon me once, Allah will send blessings upon him tenfold." — Sahih Muslim',
  },
  {
    name: 'Durood Ibrahim',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ',
    transliteration: 'Allāhumma ṣalli ʿalā Muḥammadin wa ʿalā āli Muḥammad',
    meaning: 'Full Durood Ibrahim (Salawat)',
    target: 10,
    color: 'cyan',
    category: 'salawat',
    hadith: '"Send Durood Ibrahim upon me; it is the most complete salawat." — Sahih Bukhari',
  },
  {
    name: 'Hasbunallah',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    transliteration: 'Ḥasbunallāhu wa niʿmal wakīl',
    meaning: 'Allah is sufficient for us',
    target: 33,
    color: 'indigo',
    category: 'dua',
    hadith: 'This was the saying of Ibrahim ﷺ when thrown into the fire, and Muhammad ﷺ in times of hardship. — Sahih Bukhari',
  },
  {
    name: 'Laa Hawla',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'Lā ḥawla wa lā quwwata illā billāh',
    meaning: 'No power except with Allah',
    target: 33,
    color: 'orange',
    category: 'dua',
    hadith: '"It is a treasure from the treasures of Paradise." — Sahih Bukhari & Muslim',
  },
  {
    name: 'Subhanallah wa Bihamdihi',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'Subḥānallāhi wa biḥamdih',
    meaning: 'Glory and praise be to Allah',
    target: 100,
    color: 'lime',
    category: 'tasbih',
    hadith: '"Two phrases light on the tongue, heavy on the Scale, beloved to the Most Merciful: Subhanallahi wa bihamdihi, Subhanallahil Azeem." — Sahih Bukhari',
  },
  {
    name: 'Subhanallahil Azeem',
    arabic: 'سُبْحَانَ اللَّهِ الْعَظِيمِ',
    transliteration: 'Subḥānallāhil ʿAẓīm',
    meaning: 'Glory be to Allah the Most Great',
    target: 100,
    color: 'sky',
    category: 'tasbih',
    hadith: '"A tree is planted in Jannah for whoever says Subhanallahil Azeem." — Ibn Hibban (Sahih)',
  },
  {
    name: 'Rabbighfirli',
    arabic: 'رَبِّ اغْفِرْ لِي',
    transliteration: 'Rabbighfir lī',
    meaning: 'My Lord, forgive me',
    target: 100,
    color: 'pink',
    category: 'istighfar',
    hadith: 'The Prophet ﷺ would say Rabbighfirli between every two sajdahs in prayer. — Sahih Muslim',
  },
  {
    name: 'Ayatul Kursi',
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
    transliteration: 'Allāhu lā ilāha illā huwal-Ḥayyul-Qayyūm…',
    meaning: 'The Verse of the Throne',
    target: 1,
    color: 'violet',
    category: 'dua',
    hadith: '"Whoever recites Ayatul Kursi after every obligatory prayer, nothing prevents them from entering Paradise except death." — Al-Nasai (Sahih)',
  },
  {
    name: 'Ya Allah',
    arabic: 'يَا اللَّهُ',
    transliteration: 'Yā Allāh',
    meaning: 'O Allah (calling upon Him)',
    target: null, // free mode
    color: 'amber',
    category: 'free',
    hadith: '"Allah has 99 names, one hundred minus one. Whoever memorises them all will enter Paradise." — Sahih Bukhari',
  },
  {
    name: 'Free Dhikr',
    arabic: 'ذِكْرٌ حُرٌّ',
    transliteration: 'Dhikr',
    meaning: 'Count any dhikr freely',
    target: null,
    color: 'slate',
    category: 'free',
    hadith: '"The example of one who remembers Allah and one who does not is like the living and the dead." — Sahih Bukhari',
  },
  {
    name: 'Sayyidul Istighfar',
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ',
    transliteration: 'Allāhumma anta Rabbī lā ilāha illā ant',
    meaning: 'Master supplication for forgiveness',
    target: 3,
    color: 'rose',
    category: 'istighfar',
    hadith: '"Whoever says this with certainty in the morning and dies before evening enters Paradise." — Sahih Bukhari',
  },
  {
    name: 'SubhanAllah wal Hamdulillah',
    arabic: 'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ',
    transliteration: 'Subḥānallāhi wal-ḥamdulillāhi wa lā ilāha illallāhu wallāhu akbar',
    meaning: 'Glory, praise, no god but Allah, Allah is Greatest',
    target: 33,
    color: 'emerald',
    category: 'tasbih',
    hadith: '"These are more beloved to me than all that the sun rises over." — Sahih Muslim',
  },
  {
    name: 'Ya Hayyu Ya Qayyum',
    arabic: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
    transliteration: 'Yā Ḥayyu yā Qayyūmu bi-raḥmatika astaghīth',
    meaning: 'O Living, O Sustainer, by Your mercy I seek help',
    target: 33,
    color: 'teal',
    category: 'dua',
    hadith: '"Whoever persists in this dua, Allah will give him a way out of every difficulty." — Al-Hakim (Sahih)',
  },
  {
    name: 'Tasbih Fatimi',
    arabic: 'سُبْحَانَ اللَّهِ ٣٣ + الْحَمْدُ لِلَّهِ ٣٣ + اللَّهُ أَكْبَرُ ٣٤',
    transliteration: 'Subḥānallāh 33 + Alḥamdulillāh 33 + Allāhu Akbar 34',
    meaning: 'Post-prayer Tasbih of Fatimah (RA)',
    target: 100,
    color: 'gold',
    category: 'tasbih',
    hadith: '"The Prophet ﷺ taught Fatimah to say SubhanAllah 33, Alhamdulillah 33, Allahu Akbar 34 before sleeping." — Sahih Bukhari & Muslim',
  },
  {
    name: 'Rabbi Zidni Ilma',
    arabic: 'رَبِّ زِدْنِي عِلْمًا',
    transliteration: 'Rabbi zidnī ʿilmā',
    meaning: 'My Lord, increase me in knowledge',
    target: 33,
    color: 'indigo',
    category: 'dua',
    hadith: 'Quran 20:114 — Allah commanded the Prophet ﷺ to make this dua.',
  },
  {
    name: 'Allahumma Ajirni Minan Naar',
    arabic: 'اللَّهُمَّ أَجِرْنِي مِنَ النَّارِ',
    transliteration: 'Allāhumma ajirnī minan-nār',
    meaning: 'O Allah, save me from the Fire',
    target: 7,
    color: 'orange',
    category: 'dua',
    hadith: '"Whoever asks Allah for Paradise 3 times, Paradise says: O Allah admit him. Whoever seeks protection from Fire 3 times, the Fire says: O Allah protect him." — Tirmidhi (Sahih)',
  },
];

// ─── Colors ───────────────────────────────────────────────────────────────────
const COLORS: Record<string, { bg: string; light: string; text: string; border: string; ring: string; grad: string }> = {
  emerald: { bg: '#059669', light: '#ecfdf5', text: '#047857', border: '#6ee7b7', ring: '#10b981', grad: 'linear-gradient(135deg,#059669,#0d9488)' },
  blue:    { bg: '#2563eb', light: '#eff6ff', text: '#1d4ed8', border: '#93c5fd', ring: '#3b82f6', grad: 'linear-gradient(135deg,#2563eb,#7c3aed)' },
  purple:  { bg: '#7c3aed', light: '#f5f3ff', text: '#6d28d9', border: '#c4b5fd', ring: '#8b5cf6', grad: 'linear-gradient(135deg,#7c3aed,#db2777)' },
  amber:   { bg: '#d97706', light: '#fffbeb', text: '#b45309', border: '#fcd34d', ring: '#f59e0b', grad: 'linear-gradient(135deg,#d97706,#dc2626)' },
  gold:    { bg: '#b8860b', light: '#fefce8', text: '#92400e', border: '#fde68a', ring: '#eab308', grad: 'linear-gradient(135deg,#b8860b,#d97706)' },
  rose:    { bg: '#e11d48', light: '#fff1f2', text: '#be123c', border: '#fda4af', ring: '#f43f5e', grad: 'linear-gradient(135deg,#e11d48,#7c3aed)' },
  teal:    { bg: '#0d9488', light: '#f0fdfa', text: '#0f766e', border: '#5eead4', ring: '#14b8a6', grad: 'linear-gradient(135deg,#0d9488,#2563eb)' },
  cyan:    { bg: '#0891b2', light: '#ecfeff', text: '#0e7490', border: '#67e8f9', ring: '#06b6d4', grad: 'linear-gradient(135deg,#0891b2,#0d9488)' },
  indigo:  { bg: '#4338ca', light: '#eef2ff', text: '#3730a3', border: '#a5b4fc', ring: '#6366f1', grad: 'linear-gradient(135deg,#4338ca,#0d9488)' },
  orange:  { bg: '#ea580c', light: '#fff7ed', text: '#c2410c', border: '#fdba74', ring: '#f97316', grad: 'linear-gradient(135deg,#ea580c,#d97706)' },
  lime:    { bg: '#65a30d', light: '#f7fee7', text: '#4d7c0f', border: '#bef264', ring: '#84cc16', grad: 'linear-gradient(135deg,#65a30d,#059669)' },
  sky:     { bg: '#0284c7', light: '#f0f9ff', text: '#0369a1', border: '#7dd3fc', ring: '#0ea5e9', grad: 'linear-gradient(135deg,#0284c7,#4338ca)' },
  pink:    { bg: '#db2777', light: '#fdf2f8', text: '#be185d', border: '#f9a8d4', ring: '#ec4899', grad: 'linear-gradient(135deg,#db2777,#7c3aed)' },
  violet:  { bg: '#6d28d9', light: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe', ring: '#8b5cf6', grad: 'linear-gradient(135deg,#6d28d9,#1d4ed8)' },
  slate:   { bg: '#475569', light: '#f8fafc', text: '#334155', border: '#cbd5e1', ring: '#64748b', grad: 'linear-gradient(135deg,#475569,#334155)' },
};

const CELEBRATIONS = [
  'MashAllah! Keep going! 🤍',
  'Alhamdulillah! One more round! ✨',
  'SubhanAllah! You are doing great! 🌙',
  'Barakallah feek! Allah is watching! 💚',
  'Every dhikr brings you closer to Allah! 📿',
  'The angels are recording your worship! 🌟',
  'JazakAllah khair for this beautiful act! 🕌',
  'Allah loves those who remember Him! 💛',
];

const CATEGORIES = ['all', 'tasbih', 'tahlil', 'istighfar', 'salawat', 'dua', 'free'] as const;

// ─── Storage helpers ──────────────────────────────────────────────────────────
function saveData(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function loadData<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

// ─── Tasbeeh Bead Visual ─────────────────────────────────────────────────────
function TasbeehBeads({ count, target, color }: { count: number; target: number; color: string }) {
  const c = COLORS[color] || COLORS.emerald;
  const total = Math.min(target, 33); // display max 33 beads
  const filled = target <= 33 ? count : Math.round((count / target) * 33);
  const beadCount = total;
  const radius = 68;
  const cx = 90, cy = 90;

  return (
    <svg viewBox="0 0 180 180" width="180" height="180" style={{ display: 'block', margin: '0 auto' }}>
      {/* String */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#d4c5a9" strokeWidth="1.5" strokeDasharray="4 3" />
      {/* Beads */}
      {Array.from({ length: beadCount }).map((_, i) => {
        const angle = (i / beadCount) * 2 * Math.PI - Math.PI / 2;
        const bx = cx + radius * Math.cos(angle);
        const by = cy + radius * Math.sin(angle);
        const active = i < filled;
        return (
          <g key={i}>
            <circle cx={bx} cy={by} r={active ? 7 : 5.5}
              fill={active ? c.ring : '#e8dcc8'}
              stroke={active ? c.bg : '#c8b89a'}
              strokeWidth="1"
              style={{ transition: 'all 0.2s ease', filter: active ? `drop-shadow(0 0 3px ${c.ring}88)` : 'none' }}
            />
            {active && <circle cx={bx - 2} cy={by - 2} r={1.8} fill="rgba(255,255,255,0.5)" />}
          </g>
        );
      })}
      {/* Center count */}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="28" fontWeight="800" fill={c.text} fontFamily="Georgia, serif">{count}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#aaa" fontFamily="Georgia, serif">of {target}</text>
    </svg>
  );
}

// ─── Session Timer ────────────────────────────────────────────────────────────
function useSessionTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (active) {
      ref.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (ref.current) clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [active]);
  const reset = () => setSeconds(0);
  const fmt = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return { seconds, fmt, reset };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DhikrCounter() {
  const [selected, setSelected]       = useState(0);
  const [count, setCount]             = useState(0);
  const [sessions, setSessions]       = useState(0);
  const [totalAll, setTotalAll]       = useState(() => loadData('dhikr_total', 0));
  const [flash, setFlash]             = useState(false);
  const [celebrated, setCelebrated]   = useState(false);
  const [celebMsg, setCelebMsg]       = useState('');
  const [showShare, setShowShare]     = useState(false);
  const [copied, setCopied]           = useState(false);
  const [streakDay, setStreakDay]     = useState(() => loadData('dhikr_streak', 0));
  const [showHadith, setShowHadith]   = useState(false);
  const [tab, setTab]                 = useState<'counter' | 'stats' | 'history'>('counter');
  const [ripples, setRipples]         = useState<{ id: number; x: number; y: number }[]>([]);
  const [rippleId, setRippleId]       = useState(0);
  const [darkMode, setDarkMode]       = useState(() => loadData('dhikr_dark', false));
  const [soundOn, setSoundOn]         = useState(() => loadData('dhikr_sound', false));
  const [vibOn, setVibOn]             = useState(() => loadData('dhikr_vib', true));
  const [customTarget, setCustomTarget] = useState<string>('');
  const [editingTarget, setEditingTarget] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [history, setHistory]         = useState<DhikrHistoryEntry[]>(() => loadData('dhikr_history', []));
  const [perDhikrCounts, setPerDhikrCounts] = useState<Record<string, number>>(() => loadData('dhikr_per', {}));
  const [displayMode, setDisplayMode] = useState<'ring' | 'beads'>('beads');
  const [timerActive, setTimerActive] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [wakeLock, setWakeLock] = useState<any>(null);
  const { seconds, fmt: timerFmt, reset: resetTimer } = useSessionTimer(timerActive);

  // Wake Lock — keep screen on while counting
  useEffect(() => {
    if (timerActive && 'wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').then((lock: any) => setWakeLock(lock)).catch(() => {});
    }
    return () => { if (wakeLock) { wakeLock.release(); setWakeLock(null); } };
  }, [timerActive]);

  const preset = PRESETS[selected];
  const color  = COLORS[preset.color] || COLORS.emerald;
  const effectiveTarget = customTarget ? parseInt(customTarget) : (preset.target ?? 99999);
  const isFreeMode = preset.target === null && !customTarget;
  const progress = isFreeMode ? 0 : Math.min((count / effectiveTarget) * 100, 100);
  const circumference = 2 * Math.PI * 44;

  // Undo last count
  const undoCount = useCallback(() => {
    if (count > 0) {
      setCount(c => c - 1);
      setTotalAll((t: number) => Math.max(0, t - 1));
      setPerDhikrCounts(prev => ({ ...prev, [preset.name]: Math.max(0, (prev[preset.name] || 0) - 1) }));
    }
  }, [count, preset.name]);

  // Dark mode palette
  const dm = darkMode;
  const pageBg   = dm ? '#0a0f1a' : '#f0ede6';
  const cardBg   = dm ? '#131929' : '#fff';
  const cardBg2  = dm ? '#1a2236' : '#faf7f2';
  const textMain = dm ? '#e8dcc8' : '#1a1208';
  const textMuted= dm ? '#7a6e5e' : '#9a8878';
  const borderC  = dm ? '#2a3548' : '#e8dcc8';

  useEffect(() => { setCount(0); setSessions(0); setCelebrated(false); setCustomTarget(''); setEditingTarget(false); resetTimer(); setTimerActive(false); }, [selected]);
  useEffect(() => { saveData('dhikr_total', totalAll); }, [totalAll]);
  useData('dhikr_dark', darkMode);
  useData('dhikr_sound', soundOn);
  useData('dhikr_vib', vibOn);
  useEffect(() => { saveData('dhikr_history', history); }, [history]);
  useEffect(() => { saveData('dhikr_per', perDhikrCounts); }, [perDhikrCounts]);

  function useData(key: string, val: unknown) {
    useEffect(() => { saveData(key, val); }, [val]);
  }

  // Audio click sound
  const playClick = useCallback(() => {
    if (!soundOn) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }, [soundOn]);

  const handleCount = useCallback((e?: React.MouseEvent<HTMLButtonElement>) => {

    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleId + 1;
      setRippleId(id);
      setRipples(prev => [...prev, { id, x, y }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    }

    // Vibration
    if (vibOn && navigator.vibrate) navigator.vibrate(18);

    // Sound
    playClick();

    // Start timer on first count
    if (count === 0 && sessions === 0) setTimerActive(true);

    const next = count + 1;
    setCount(next);
    setTotalAll((t: number) => t + 1);
    setPerDhikrCounts(prev => ({ ...prev, [preset.name]: (prev[preset.name] || 0) + 1 }));
    setFlash(true);
    setTimeout(() => setFlash(false), 80);

    if (!isFreeMode && next >= effectiveTarget) {
      setSessions((s: number) => s + 1);
      setCount(0);
      const msg = CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
      setCelebMsg(msg);
      setCelebrated(true);
      setTimeout(() => setCelebrated(false), 2800);

      // Save to history
      const entry: DhikrHistoryEntry = {
        dhikr: preset.name,
        count: effectiveTarget,
        date: new Date().toISOString(),
        duration: seconds,
      };
      setHistory(prev => [entry, ...prev].slice(0, 100));

      const today = new Date().toDateString();
      const lastDay = loadData<string>('dhikr_last_day', '');
      if (lastDay !== today) {
        const newStreak = streakDay + 1;
        setStreakDay(newStreak);
        saveData('dhikr_streak', newStreak);
        saveData('dhikr_last_day', today);
      }
    }
  }, [count, effectiveTarget, streakDay, rippleId, isFreeMode, soundOn, vibOn, preset.name, seconds, playClick, sessions]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleCount(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCount]);

  const reset = () => {
    setCount(0);
    setSessions(0);
    setCelebrated(false);
    resetTimer();
    setTimerActive(false);
  };

  const resetAll = () => {
    setCount(0); setSessions(0); setTotalAll(0); setStreakDay(0);
    setCelebrated(false); setHistory([]); setPerDhikrCounts({});
    saveData('dhikr_total', 0); saveData('dhikr_streak', 0); saveData('dhikr_history', []); saveData('dhikr_per', {});
  };

  const shareText = `🌙 I just completed ${sessions > 0 ? sessions + ' round(s) of ' : ''}${preset.name} (${preset.arabic})\n\n${preset.meaning}\n\n📿 "${preset.hadith}"\n\nUse this free Islamic Dhikr Counter 👇\n🔗 iloveislam.life/dhikr\n\nShare this — every time they do dhikr because of you, you earn the same reward! 🤍`;

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Dhikr Counter — I Love Islam', text: shareText, url: 'https://iloveislam.life/dhikr' }); return; } catch {}
    }
    setShowShare(true);
  };

  const copyShare = () => {
    navigator.clipboard?.writeText(shareText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredPresets = categoryFilter === 'all'
    ? PRESETS
    : PRESETS.filter(p => p.category === categoryFilter);

  const todayStr = new Date().toDateString();
  const todayHistory = history.filter(h => new Date(h.date).toDateString() === todayStr);
  const todayTotal = todayHistory.reduce((a, b) => a + b.count, 0);

  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'Georgia', serif", transition: 'background 0.4s ease', color: textMain }}>

      {/* FULL SCREEN TAP MODE */}
      {fullScreen && (
        <div
          onClick={() => handleCount()}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: dm ? '#0a0f1a' : color.grad,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', userSelect: 'none', touchAction: 'manipulation',
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 8px' }}>{preset.arabic}</p>
          <p style={{ color: '#fff', fontSize: 120, fontWeight: 800, margin: 0, lineHeight: 1, fontFamily: 'Georgia, serif' }}>{count}</p>
          {!isFreeMode && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, margin: '8px 0 0' }}>of {effectiveTarget} · Round {sessions + 1}</p>}
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 24 }}>Tap anywhere to count</p>
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
            <button onClick={(e) => { e.stopPropagation(); undoCount(); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 20, padding: '8px 14px', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>↩ Undo</button>
            <button onClick={(e) => { e.stopPropagation(); setFullScreen(false); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 20, padding: '8px 14px', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>✕ Exit</button>
          </div>
          {celebrated && <p style={{ position: 'absolute', bottom: 60, color: '#fff', fontSize: 16, fontWeight: 700, animation: 'popIn 0.4s ease' }}>{celebMsg}</p>}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&display=swap');
        @keyframes ripple    { 0% { transform:scale(0);opacity:.4; } 100% { transform:scale(4);opacity:0; } }
        @keyframes popIn     { 0% { transform:scale(.8);opacity:0; } 60% { transform:scale(1.05); } 100% { transform:scale(1);opacity:1; } }
        @keyframes slideUp   { from { transform:translateY(16px);opacity:0; } to { transform:translateY(0);opacity:1; } }
        @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
        @keyframes glow      { 0%,100% { box-shadow:0 0 12px ${color.ring}44; } 50% { box-shadow:0 0 28px ${color.ring}88; } }
        @keyframes beadPulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.05); } }
        .dhikr-btn:active    { transform:scale(0.96) !important; }
        .preset-chip:hover   { transform:translateY(-1px); box-shadow:0 4px 14px rgba(0,0,0,0.1); }
        .tab-btn             { transition:all .2s ease; }
        .tab-btn:hover       { opacity:.85; }
        .icon-btn:hover      { opacity:.75; }
        ::-webkit-scrollbar  { width:4px; }
        ::-webkit-scrollbar-thumb { background:${color.ring}44; border-radius:4px; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: dm ? `linear-gradient(160deg,#0f1b2d,#1a2a42)` : color.grad, padding: '14px 16px 28px', transition: 'background 0.5s ease', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>← Back</Link>
            <h1 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0, letterSpacing: 0.5 }}>📿 Dhikr Counter</h1>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {/* Dark mode */}
              <button onClick={() => setDarkMode(!dm)} className="icon-btn"
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 20, padding: '5px 10px', cursor: 'pointer', fontSize: 14, color: '#fff' }}>
                {dm ? '☀️' : '🌙'}
              </button>
              {/* Sound */}
              <button onClick={() => setSoundOn(!soundOn)} className="icon-btn"
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 20, padding: '5px 10px', cursor: 'pointer', fontSize: 14, color: '#fff' }}>
                {soundOn ? '🔊' : '🔇'}
              </button>
              {/* Full screen */}
              <button onClick={() => setFullScreen(true)} className="icon-btn"
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 20, padding: '5px 10px', cursor: 'pointer', fontSize: 14, color: '#fff' }}>
                ⛶
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
            {[
              { label: 'Total',   value: totalAll.toLocaleString(), icon: '📿' },
              { label: 'Streak',  value: streakDay + 'd', icon: '🔥' },
              { label: 'Today',   value: todayTotal.toString(), icon: '🌟' },
              { label: 'Timer',   value: timerFmt, icon: '⏱' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.14)', borderRadius: 12, padding: '10px 4px', textAlign: 'center', backdropFilter: 'blur(6px)' }}>
                <p style={{ fontSize: 14, margin: '0 0 2px' }}>{s.icon}</p>
                <p style={{ color: '#fff', fontSize: 13, fontWeight: 800, margin: '0 0 1px', letterSpacing: 0.2, fontFamily: 'Georgia, serif' }}>{s.value}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 14px 80px' }}>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 0, background: cardBg2, borderRadius: 14, padding: 4, margin: '14px 0 12px', border: `1px solid ${borderC}` }}>
          {(['counter', 'stats', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className="tab-btn"
              style={{
                flex: 1, padding: '9px 0', border: 'none', borderRadius: 11, cursor: 'pointer',
                background: tab === t ? (dm ? color.bg : color.ring) : 'transparent',
                color: tab === t ? '#fff' : textMuted,
                fontSize: 12, fontWeight: tab === t ? 700 : 500, fontFamily: 'Georgia, serif',
                letterSpacing: 0.3,
              }}>
              {t === 'counter' ? '📿 Counter' : t === 'stats' ? '📊 Stats' : '📋 History'}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════
            COUNTER TAB
        ════════════════════════════════════════════ */}
        {tab === 'counter' && (
          <>
            {/* Category Filter */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 10, scrollbarWidth: 'none' }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategoryFilter(cat)}
                  style={{
                    flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    background: categoryFilter === cat ? color.ring : (dm ? '#1a2236' : '#e8dcc8'),
                    color: categoryFilter === cat ? '#fff' : textMuted,
                    fontSize: 11, fontWeight: 600, fontFamily: 'Georgia, serif',
                    textTransform: 'capitalize', transition: 'all .2s',
                  }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Dhikr Selector Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 12 }}>
              {filteredPresets.map((p, _i) => {
                const idx = PRESETS.indexOf(p);
                const c2 = COLORS[p.color] || COLORS.emerald;
                const isActive = selected === idx;
                return (
                  <button key={p.name} onClick={() => setSelected(idx)} className="preset-chip"
                    style={{
                      textAlign: 'left', padding: '11px 13px', borderRadius: 14,
                      border: `2px solid ${isActive ? c2.ring : borderC}`,
                      background: isActive ? (dm ? `${c2.bg}22` : c2.light) : cardBg,
                      cursor: 'pointer', transition: 'all .2s',
                      fontFamily: 'Georgia, serif',
                      boxShadow: isActive ? `0 0 0 3px ${c2.ring}22` : 'none',
                    }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: isActive ? c2.text : textMain, margin: '0 0 2px' }}>{p.name}</p>
                    <p style={{ fontSize: 10, color: isActive ? c2.ring : textMuted, margin: 0 }}>
                      {p.target ? `× ${p.target}` : 'Free'}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Main Counter Card */}
            <div style={{ background: cardBg, borderRadius: 24, border: `1px solid ${borderC}`, padding: '22px 18px', textAlign: 'center', marginBottom: 10, boxShadow: dm ? '0 8px 40px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)', animation: 'slideUp 0.3s ease' }}>

              {/* Arabic display */}
              <div style={{ background: dm ? `${color.bg}18` : color.light, borderRadius: 16, padding: '16px 12px', marginBottom: 18, border: `1px solid ${dm ? color.bg + '44' : color.border}` }}>
                <p style={{ fontFamily: "'Scheherazade New', Georgia, serif", fontSize: 30, color: dm ? color.ring : color.text, margin: '0 0 4px', lineHeight: 2.1, direction: 'rtl' }}>
                  {preset.arabic}
                </p>
                <p style={{ fontSize: 11, color: dm ? color.ring + 'aa' : color.text, margin: '0 0 3px', fontStyle: 'italic', opacity: 0.8 }}>{preset.transliteration}</p>
                <p style={{ fontSize: 12, color: textMuted, margin: 0 }}>{preset.meaning}</p>
              </div>

              {/* Display mode toggle */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                {(['beads', 'ring'] as const).map(m => (
                  <button key={m} onClick={() => setDisplayMode(m)}
                    style={{
                      padding: '4px 14px', border: `1px solid ${displayMode === m ? color.ring : borderC}`,
                      background: displayMode === m ? color.ring : 'transparent',
                      color: displayMode === m ? '#fff' : textMuted,
                      borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 600,
                    }}>
                    {m === 'beads' ? '📿 Beads' : '⭕ Ring'}
                  </button>
                ))}
              </div>

              {/* Counter Visual */}
              {displayMode === 'beads' ? (
                <div style={{ margin: '0 auto 16px', animation: flash ? 'beadPulse 0.08s ease' : 'none' }}>
                  <TasbeehBeads
                    count={count}
                    target={isFreeMode ? 33 : Math.min(effectiveTarget, 100)}
                    color={preset.color}
                  />
                </div>
              ) : (
                <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 16px' }}>
                  <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', background: `radial-gradient(circle, ${color.ring}14 0%, transparent 70%)` }} />
                  <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke={dm ? '#1e2a3a' : '#f0ede8'} strokeWidth="7" />
                    <circle cx="50" cy="50" r="44" fill="none"
                      stroke={color.ring} strokeWidth="7"
                      strokeDasharray={circumference}
                      strokeDashoffset={isFreeMode ? circumference * 0.75 : circumference * (1 - progress / 100)}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.2s ease, stroke 0.4s ease' }}
                    />
                    <circle cx="50" cy="50" r="37" fill="none" stroke={color.ring} strokeWidth="0.5" opacity="0.2" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 52, fontWeight: 800, color: dm ? color.ring : color.text, lineHeight: 1, transition: 'color 0.4s ease', fontFamily: 'Lora, Georgia, serif' }}>{count}</span>
                    {!isFreeMode && <span style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>of {effectiveTarget}</span>}
                    {sessions > 0 && (
                      <span style={{ fontSize: 10, color: dm ? color.ring : color.text, marginTop: 8, background: dm ? `${color.bg}33` : color.light, padding: '3px 10px', borderRadius: 20, border: `1px solid ${dm ? color.bg : color.border}`, animation: 'popIn 0.3s ease' }}>
                        ✅ {sessions} round{sessions !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Progress bar (only when target set) */}
              {!isFreeMode && (
                <div style={{ background: dm ? '#1e2a3a' : '#f0ede8', borderRadius: 99, height: 5, marginBottom: 16, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: color.grad, borderRadius: 99, transition: 'width 0.2s ease' }} />
                </div>
              )}

              {/* Custom target row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14, justifyContent: 'center' }}>
                <span style={{ fontSize: 11, color: textMuted }}>Target:</span>
                {editingTarget ? (
                  <input
                    type="number"
                    value={customTarget}
                    onChange={e => setCustomTarget(e.target.value)}
                    onBlur={() => setEditingTarget(false)}
                    autoFocus
                    placeholder={String(preset.target ?? '∞')}
                    style={{
                      width: 70, padding: '4px 8px', borderRadius: 8, border: `1px solid ${color.ring}`,
                      background: cardBg2, color: textMain, fontSize: 12, fontFamily: 'Georgia, serif',
                      outline: 'none', textAlign: 'center',
                    }}
                  />
                ) : (
                  <button onClick={() => setEditingTarget(true)}
                    style={{ padding: '4px 12px', borderRadius: 8, border: `1px dashed ${color.ring}`, background: 'transparent', color: dm ? color.ring : color.text, fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                    {customTarget || (preset.target ? `${preset.target}` : '∞')} ✏️
                  </button>
                )}
                {customTarget && (
                  <button onClick={() => setCustomTarget('')}
                    style={{ padding: '3px 8px', borderRadius: 8, border: `1px solid ${borderC}`, background: 'transparent', color: textMuted, fontSize: 11, cursor: 'pointer' }}>
                    reset
                  </button>
                )}
              </div>

              {/* Celebration */}
              {celebrated && (
                <div style={{ background: `linear-gradient(135deg,#059669,#0d9488)`, color: '#fff', borderRadius: 14, padding: '12px 16px', marginBottom: 14, fontSize: 14, fontWeight: 600, animation: 'popIn 0.3s ease', boxShadow: '0 4px 18px rgba(5,150,105,0.3)' }}>
                  {celebMsg}
                </div>
              )}

              {/* TAP BUTTON */}
              <button
                onClick={handleCount}
                className="dhikr-btn"
                style={{
                  width: '100%', padding: '22px 0', borderRadius: 20,
                  background: flash ? color.ring : color.grad,
                  color: '#fff',
                  fontSize: 20, fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                  boxShadow: `0 8px 32px ${color.ring}40`,
                  transform: flash ? 'scale(0.975)' : 'scale(1)',
                  transition: 'transform 0.08s ease, box-shadow 0.3s ease, background 0.1s ease',
                  fontFamily: 'Georgia, serif', letterSpacing: 0.5,
                  position: 'relative', overflow: 'hidden',
                  animation: 'glow 3s ease infinite',
                }}
              >
                {ripples.map(r => (
                  <span key={r.id} style={{ position: 'absolute', left: r.x, top: r.y, width: 40, height: 40, marginLeft: -20, marginTop: -20, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', animation: 'ripple 0.6s ease-out forwards', pointerEvents: 'none' }} />
                ))}
                📿 {isFreeMode ? `Count — ${count}` : 'Tap to Count'}
              </button>

              {/* Vibration toggle + keyboard hint */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                <p style={{ fontSize: 10, color: textMuted, margin: 0 }}>Space / Enter on keyboard</p>
                <button onClick={() => setVibOn(!vibOn)}
                  style={{ background: 'none', border: 'none', fontSize: 11, color: textMuted, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                  {vibOn ? '📳 Vibrate ON' : '📴 Vibrate OFF'}
                </button>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 7, marginTop: 14 }}>
                <button onClick={undoCount} disabled={count === 0}
                  style={{ padding: 11, border: `1.5px solid ${borderC}`, borderRadius: 13, fontSize: 12, color: count === 0 ? '#ccc' : textMuted, background: cardBg2, cursor: count === 0 ? 'default' : 'pointer', fontFamily: 'Georgia, serif', opacity: count === 0 ? 0.5 : 1 }}>
                  ↩
                </button>
                <button onClick={reset}
                  style={{ flex: 1, padding: 11, border: `1.5px solid ${borderC}`, borderRadius: 13, fontSize: 12, color: textMuted, background: cardBg2, cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'background .2s' }}>
                  🔄 Reset
                </button>
                <button onClick={() => setShowHadith(!showHadith)}
                  style={{ flex: 1, padding: 11, border: `1.5px solid ${dm ? color.bg + '66' : color.border}`, borderRadius: 13, fontSize: 12, color: dm ? color.ring : color.text, background: dm ? `${color.bg}18` : color.light, cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'all .2s' }}>
                  📖 {showHadith ? 'Hide' : 'Hadith'}
                </button>
                <button onClick={handleShare}
                  style={{ flex: 1, padding: 11, border: 'none', borderRadius: 13, fontSize: 12, color: '#fff', background: color.grad, cursor: 'pointer', fontFamily: 'Georgia, serif', boxShadow: `0 4px 14px ${color.ring}30` }}>
                  🌙 Share
                </button>
              </div>
            </div>

            {/* Hadith Card */}
            {showHadith && (
              <div style={{ background: dm ? '#1a1500' : '#fffbeb', border: `1px solid ${dm ? '#3d3000' : '#fde68a'}`, borderRadius: 18, padding: '18px 20px', marginBottom: 10, animation: 'slideUp 0.25s ease', boxShadow: '0 2px 14px rgba(251,191,36,0.1)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: dm ? '#fbbf24' : '#92400e', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>📖 Hadith & Virtue</p>
                <p style={{ fontSize: 13, color: dm ? '#fde68a' : '#78350f', lineHeight: 1.9, margin: 0, fontStyle: 'italic', fontFamily: 'Lora, Georgia, serif' }}>{preset.hadith}</p>
              </div>
            )}

            {/* Sadaqah Jariyah Banner */}
            <div style={{ background: dm ? 'linear-gradient(135deg,#0f1f10,#1a3020)' : 'linear-gradient(135deg,#0a3d2e,#1a5c3a)', borderRadius: 18, padding: '18px 20px', boxShadow: '0 4px 20px rgba(10,61,46,0.25)' }}>
              <p style={{ color: '#c8a96e', fontSize: 13, fontWeight: 700, margin: '0 0 7px', fontFamily: 'Lora, Georgia, serif' }}>🌙 Share & Earn Sadaqah Jariyah</p>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.75, margin: '0 0 13px', fontFamily: 'Lora, Georgia, serif' }}>
                Every time someone does dhikr because of you, you earn the same reward — even after you are gone.{' '}
                <em>&quot;Whoever guides someone to goodness will have a reward like the one who did it.&quot;</em>
              </p>
              <button onClick={handleShare}
                style={{ width: '100%', padding: 12, background: '#c8a96e', color: '#0a3d2e', border: 'none', borderRadius: 13, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', boxShadow: '0 4px 16px rgba(200,169,110,0.3)' }}>
                🤍 Share This App
              </button>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════
            STATS TAB
        ════════════════════════════════════════════ */}
        {tab === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, animation: 'slideUp 0.3s ease' }}>
            {/* Overall stats */}
            <div style={{ background: cardBg, borderRadius: 20, border: `1px solid ${borderC}`, padding: '20px 18px', boxShadow: dm ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: dm ? color.ring : color.text, margin: '0 0 16px', fontFamily: 'Lora, Georgia, serif' }}>📊 Your Journey</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                {[
                  { label: 'Total Dhikr Ever', value: totalAll.toLocaleString(), c: dm ? color.ring : color.text },
                  { label: 'Day Streak 🔥',    value: streakDay + ' days', c: '#f59e0b' },
                  { label: 'Today\'s Dhikr',   value: todayTotal.toString(), c: dm ? '#4ade80' : '#16a34a' },
                  { label: 'Sessions Done',    value: sessions.toString(), c: dm ? '#a78bfa' : '#7c3aed' },
                ].map(s => (
                  <div key={s.label} style={{ background: cardBg2, borderRadius: 14, padding: '16px 10px', textAlign: 'center', border: `1px solid ${borderC}` }}>
                    <p style={{ fontSize: 26, fontWeight: 800, color: s.c, margin: '0 0 4px', fontFamily: 'Lora, Georgia, serif' }}>{s.value}</p>
                    <p style={{ fontSize: 10, color: textMuted, margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-dhikr breakdown */}
            <div style={{ background: cardBg, borderRadius: 20, border: `1px solid ${borderC}`, padding: '18px', boxShadow: dm ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: dm ? color.ring : color.text, margin: '0 0 14px', fontFamily: 'Lora, Georgia, serif' }}>📿 Per-Dhikr Totals</p>
              {Object.keys(perDhikrCounts).length === 0 ? (
                <p style={{ fontSize: 12, color: textMuted, textAlign: 'center', padding: '12px 0', fontStyle: 'italic' }}>No data yet — start counting!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {Object.entries(perDhikrCounts).sort((a, b) => b[1] - a[1]).map(([name, cnt]) => {
                    const p2 = PRESETS.find(p => p.name === name);
                    const c2 = p2 ? (COLORS[p2.color] || COLORS.emerald) : COLORS.emerald;
                    const pct = Math.round((cnt / (totalAll || 1)) * 100);
                    return (
                      <div key={name} style={{ background: cardBg2, borderRadius: 12, padding: '11px 14px', border: `1px solid ${borderC}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: textMain }}>{name}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: dm ? c2.ring : c2.text }}>{cnt.toLocaleString()}</span>
                        </div>
                        <div style={{ background: dm ? '#1a2236' : '#f0ede8', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: c2.grad, borderRadius: 99, transition: 'width 0.4s ease' }} />
                        </div>
                        <p style={{ fontSize: 10, color: textMuted, margin: '4px 0 0', textAlign: 'right' }}>{pct}% of all dhikr</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Power of dhikr */}
            <div style={{ background: cardBg, borderRadius: 20, border: `1px solid ${borderC}`, padding: '18px', boxShadow: dm ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: dm ? color.ring : color.text, margin: '0 0 13px', fontFamily: 'Lora, Georgia, serif' }}>✨ The Power of Dhikr</p>
              {[
                { num: '33×', label: 'SubhanAllah, Alhamdulillah, Allahu Akbar after each prayer', icon: '🕌' },
                { num: '100×', label: 'La ilaha illallah — the best of all dhikr', icon: '⭐' },
                { num: '10×', label: 'Reward multiplied for every Salawat on the Prophet ﷺ', icon: '💚' },
                { num: '1×', label: 'Ayatul Kursi after prayer → path to Paradise', icon: '🌙' },
              ].map(i => (
                <div key={i.num} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: cardBg2, borderRadius: 12, marginBottom: 7, border: `1px solid ${borderC}` }}>
                  <span style={{ fontSize: 18 }}>{i.icon}</span>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: dm ? color.ring : color.text }}>{i.num} </span>
                    <span style={{ fontSize: 12, color: textMuted, lineHeight: 1.6, fontFamily: 'Lora, Georgia, serif' }}>{i.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={resetAll}
              style={{ background: cardBg, border: `1px solid ${dm ? '#3d1515' : '#fca5a5'}`, borderRadius: 14, padding: 14, color: '#ef4444', fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
              🗑️ Reset All Stats
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════
            HISTORY TAB
        ════════════════════════════════════════════ */}
        {tab === 'history' && (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <p style={{ fontSize: 40, margin: '0 0 12px' }}>📿</p>
                <p style={{ fontSize: 15, color: textMuted, fontStyle: 'italic', fontFamily: 'Lora, Georgia, serif' }}>No completed rounds yet.<br />Complete a dhikr round to see your history!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Today summary */}
                {todayHistory.length > 0 && (
                  <div style={{ background: dm ? `${color.bg}22` : color.light, border: `1px solid ${dm ? color.bg + '55' : color.border}`, borderRadius: 16, padding: '14px 16px', marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: dm ? color.ring : color.text, margin: '0 0 4px' }}>📅 Today</p>
                    <p style={{ fontSize: 12, color: textMuted, margin: 0 }}>{todayHistory.length} round{todayHistory.length !== 1 ? 's' : ''} · {todayTotal.toLocaleString()} dhikr total</p>
                  </div>
                )}

                {history.map((h, i) => {
                  const p2 = PRESETS.find(p => p.name === h.dhikr);
                  const c2 = p2 ? (COLORS[p2.color] || COLORS.emerald) : COLORS.emerald;
                  const dateObj = new Date(h.date);
                  const isToday = dateObj.toDateString() === todayStr;
                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = isToday ? `Today ${timeStr}` : dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + timeStr;
                  const durStr = h.duration ? `${Math.floor(h.duration / 60)}m ${h.duration % 60}s` : '';

                  return (
                    <div key={i} style={{ background: cardBg, borderRadius: 14, border: `1px solid ${borderC}`, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: dm ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.04)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: dm ? `${c2.bg}33` : c2.light, border: `2px solid ${c2.ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                        📿
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: textMain, margin: '0 0 2px' }}>{h.dhikr}</p>
                        <p style={{ fontSize: 11, color: textMuted, margin: 0 }}>{dateStr}{durStr ? ` · ${durStr}` : ''}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color: dm ? c2.ring : c2.text, margin: 0, fontFamily: 'Lora, Georgia, serif' }}>{h.count}×</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SHARE MODAL ── */}
      {showShare && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(5px)' }}
          onClick={() => setShowShare(false)}>
          <div style={{ background: cardBg, borderRadius: '24px 24px 0 0', padding: '24px 20px 48px', width: '100%', maxWidth: 520, animation: 'slideUp 0.3s ease' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: borderC, borderRadius: 2, margin: '0 auto 20px' }} />
            <p style={{ fontSize: 17, fontWeight: 700, color: dm ? color.ring : '#0a3d2e', margin: '0 0 4px', fontFamily: 'Lora, Georgia, serif' }}>🌙 Share & Earn Rewards</p>
            <p style={{ fontSize: 12, color: textMuted, margin: '0 0 16px' }}>Every dhikr they do = reward for you too 🤍</p>
            <div style={{ background: cardBg2, borderRadius: 14, padding: 14, marginBottom: 14, fontSize: 12, color: textMuted, lineHeight: 1.8, maxHeight: 130, overflowY: 'auto', border: `1px solid ${borderC}`, fontFamily: 'Lora, Georgia, serif' }}>
              {shareText}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={copyShare}
                style={{ padding: 14, background: copied ? '#059669' : '#0a3d2e', color: '#fff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'background .3s' }}>
                {copied ? '✅ Copied!' : '📋 Copy Message'}
              </button>
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', padding: 14, background: '#25d366', color: '#fff', borderRadius: 14, fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', fontFamily: 'Georgia, serif' }}>
                💬 Share on WhatsApp
              </a>
              <a href={`https://t.me/share/url?url=https://iloveislam.life/dhikr&text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', padding: 14, background: '#0088cc', color: '#fff', borderRadius: 14, fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', fontFamily: 'Georgia, serif' }}>
                ✈️ Share on Telegram
              </a>
              <button onClick={() => setShowShare(false)}
                style={{ padding: 12, background: cardBg2, color: textMuted, border: `1px solid ${borderC}`, borderRadius: 14, fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}