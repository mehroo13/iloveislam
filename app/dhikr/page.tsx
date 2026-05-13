'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const PRESETS = [
  { name: 'Subhanallah',       arabic: 'سُبْحَانَ اللَّهِ',                       meaning: 'Glory be to Allah',              target: 33,  color: 'emerald', hadith: 'Whoever recites Subhanallah, Alhamdulillah, and Allahu Akbar 33 times each after every prayer will have their sins forgiven, even if they are as much as the foam of the sea. — Sahih Muslim' },
  { name: 'Alhamdulillah',     arabic: 'الْحَمْدُ لِلَّهِ',                       meaning: 'All praise be to Allah',          target: 33,  color: 'blue',    hadith: '"Alhamdulillah fills the scale of good deeds." — Sahih Muslim' },
  { name: 'Allahu Akbar',      arabic: 'اللَّهُ أَكْبَرُ',                        meaning: 'Allah is the Greatest',           target: 33,  color: 'purple',  hadith: '"Subhanallah, Alhamdulillah, and Allahu Akbar are more beloved to me than all that the sun rises over." — Sahih Muslim' },
  { name: 'La ilaha illallah', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',              meaning: 'There is no god but Allah',       target: 100, color: 'amber',   hadith: '"The best dhikr is La ilaha illallah." — Sunan Tirmidhi' },
  { name: 'Astaghfirullah',    arabic: 'أَسْتَغْفِرُ اللَّهَ',                   meaning: 'I seek forgiveness from Allah',   target: 100, color: 'rose',    hadith: 'The Prophet ﷺ used to seek forgiveness more than 100 times per day. — Sahih Bukhari' },
  { name: 'Salawat',           arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',      meaning: 'Blessings upon the Prophet ﷺ',   target: 100, color: 'teal',    hadith: '"Whoever sends blessings upon me once, Allah will send blessings upon him tenfold." — Sahih Muslim' },
  { name: 'Hasbunallah',       arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', meaning: 'Allah is sufficient for us',      target: 33,  color: 'indigo',  hadith: 'This was the saying of Ibrahim ﷺ when thrown into the fire, and Muhammad ﷺ in times of hardship. — Sahih Bukhari' },
  { name: 'Laa Hawla',         arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', meaning: 'No power except with Allah', target: 33,  color: 'orange',  hadith: '"It is a treasure from the treasures of Paradise." — Sahih Bukhari & Muslim' },
];

const COLORS: Record<string, { bg: string; light: string; text: string; border: string; ring: string; grad: string; darkText: string }> = {
  emerald: { bg: '#059669', light: '#ecfdf5', text: '#047857', border: '#6ee7b7', ring: '#10b981', grad: 'linear-gradient(135deg,#059669,#0d9488)', darkText: '#34d399' },
  blue:    { bg: '#2563eb', light: '#eff6ff', text: '#1d4ed8', border: '#93c5fd', ring: '#3b82f6', grad: 'linear-gradient(135deg,#2563eb,#7c3aed)', darkText: '#60a5fa' },
  purple:  { bg: '#7c3aed', light: '#f5f3ff', text: '#6d28d9', border: '#c4b5fd', ring: '#8b5cf6', grad: 'linear-gradient(135deg,#7c3aed,#db2777)', darkText: '#a78bfa' },
  amber:   { bg: '#d97706', light: '#fffbeb', text: '#b45309', border: '#fcd34d', ring: '#f59e0b', grad: 'linear-gradient(135deg,#d97706,#dc2626)', darkText: '#fbbf24' },
  rose:    { bg: '#e11d48', light: '#fff1f2', text: '#be123c', border: '#fda4af', ring: '#f43f5e', grad: 'linear-gradient(135deg,#e11d48,#7c3aed)', darkText: '#fb7185' },
  teal:    { bg: '#0d9488', light: '#f0fdfa', text: '#0f766e', border: '#5eead4', ring: '#14b8a6', grad: 'linear-gradient(135deg,#0d9488,#2563eb)', darkText: '#2dd4bf' },
  indigo:  { bg: '#4338ca', light: '#eef2ff', text: '#3730a3', border: '#a5b4fc', ring: '#6366f1', grad: 'linear-gradient(135deg,#4338ca,#0d9488)', darkText: '#818cf8' },
  orange:  { bg: '#ea580c', light: '#fff7ed', text: '#c2410c', border: '#fdba74', ring: '#f97316', grad: 'linear-gradient(135deg,#ea580c,#d97706)', darkText: '#fb923c' },
};

// Motivational messages shown on round completion
const CELEBRATIONS = [
  'MashAllah! Keep going! 🤍',
  'Alhamdulillah! One more round! ✨',
  'SubhanAllah! You are doing great! 🌙',
  'Barakallah feek! Allah is watching! 💚',
  'Every dhikr brings you closer to Allah! 📿',
  'The angels are recording your worship! 🌟',
];

function saveData(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function loadData<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

export default function DhikrCounter() {
  const [selected, setSelected]     = useState(0);
  const [count, setCount]           = useState(0);
  const [sessions, setSessions]     = useState(0);
  const [totalAll, setTotalAll]     = useState(() => loadData('dhikr_total', 0));
  const [flash, setFlash]           = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const [celebMsg, setCelebMsg]     = useState('');
  const [showShare, setShowShare]   = useState(false);
  const [copied, setCopied]         = useState(false);
  const [streakDay, setStreakDay]   = useState(() => loadData('dhikr_streak', 0));
  const [showHadith, setShowHadith] = useState(false);
  const [tab, setTab]               = useState<'counter'|'stats'>('counter');
  const [ripples, setRipples]       = useState<{id: number; x: number; y: number}[]>([]);
  const [rippleId, setRippleId]     = useState(0);

  const preset = PRESETS[selected];
  const color  = COLORS[preset.color];
  const progress = Math.min((count / preset.target) * 100, 100);
  const circumference = 2 * Math.PI * 44;

  useEffect(() => {
    setCount(0); setSessions(0); setCelebrated(false);
  }, [selected]);

  useEffect(() => { saveData('dhikr_total', totalAll); }, [totalAll]);

  const handleCount = useCallback((e?: React.MouseEvent<HTMLButtonElement>) => {
    // Ripple effect on button click
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleId + 1;
      setRippleId(id);
      setRipples(prev => [...prev, { id, x, y }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    }

    const next = count + 1;
    setCount(next);
    setTotalAll((t: number) => t + 1);
    setFlash(true);
    setTimeout(() => setFlash(false), 100);

    if (next >= preset.target) {
      setSessions((s: number) => s + 1);
      setCount(0);
      const msg = CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
      setCelebMsg(msg);
      setCelebrated(true);
      setTimeout(() => setCelebrated(false), 2500);

      const today = new Date().toDateString();
      const lastDay = loadData<string>('dhikr_last_day', '');
      if (lastDay !== today) {
        const newStreak = streakDay + 1;
        setStreakDay(newStreak);
        saveData('dhikr_streak', newStreak);
        saveData('dhikr_last_day', today);
      }
    }
  }, [count, preset.target, streakDay, rippleId]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleCount(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCount]);

  const reset = () => { setCount(0); setSessions(0); setCelebrated(false); };
  const resetAll = () => {
    setCount(0); setSessions(0); setTotalAll(0); setStreakDay(0); setCelebrated(false);
    saveData('dhikr_total', 0); saveData('dhikr_streak', 0);
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

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f8', fontFamily: "'Georgia', serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap');
        @keyframes ripple { 0% { transform: scale(0); opacity: 0.4; } 100% { transform: scale(4); opacity: 0; } }
        @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 60% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes shimmer { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        .dhikr-btn:active { transform: scale(0.97) !important; }
        .preset-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: color.grad, padding: '14px 16px 22px', transition: 'background 0.5s ease' }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none' }}>← Back</Link>
            <h1 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>📿 Dhikr Counter</h1>
            <button onClick={() => setTab(tab === 'counter' ? 'stats' : 'counter')}
              style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 20, padding: '5px 13px', cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'background .2s' }}>
              {tab === 'counter' ? '📊 Stats' : '📿 Counter'}
            </button>
          </div>

          {/* Stats bar */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Total Dhikr', value: totalAll.toLocaleString(), icon: '📿' },
              { label: 'Day Streak',  value: streakDay + (streakDay === 1 ? ' day' : ' days'), icon: '🔥' },
              { label: 'This Round',  value: (sessions * preset.target + count).toString(), icon: '✨' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: '10px 6px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
                <p style={{ fontSize: 16, margin: '0 0 2px' }}>{s.icon}</p>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 800, margin: '0 0 1px', letterSpacing: 0.3 }}>{s.value}</p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 500, margin: '0 auto', padding: '14px 14px 60px' }}>

        {/* ── STATS TAB ── */}
        {tab === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4, animation: 'slideUp 0.3s ease' }}>
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #ede9e2', padding: 22, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0a3d2e', margin: '0 0 16px' }}>📊 Your Journey</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Total Dhikr Ever', value: totalAll.toLocaleString(), c: color.text },
                  { label: 'Day Streak 🔥',    value: streakDay + ' days', c: '#d97706' },
                  { label: 'Rounds Completed', value: sessions.toString(), c: '#7c3aed' },
                  { label: 'Remaining Now',    value: (preset.target - count).toString(), c: '#e11d48' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#f8f5f0', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
                    <p style={{ fontSize: 26, fontWeight: 800, color: s.c, margin: '0 0 4px' }}>{s.value}</p>
                    <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #ede9e2', padding: 22, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0a3d2e', margin: '0 0 14px' }}>✨ The Power of Dhikr</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { num: '33×', label: 'SubhanAllah, Alhamdulillah, Allahu Akbar after each prayer', icon: '🕌' },
                  { num: '100×', label: 'La ilaha illallah — the best of all dhikr', icon: '⭐' },
                  { num: '10×', label: 'Reward multiplied for every Salawat on the Prophet ﷺ', icon: '💚' },
                ].map(i => (
                  <div key={i.num} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, background: '#f8f5f0', borderRadius: 12 }}>
                    <span style={{ fontSize: 20 }}>{i.icon}</span>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: color.text }}>{i.num} </span>
                      <span style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{i.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={resetAll} style={{ background: '#fff', border: '1px solid #fca5a5', borderRadius: 14, padding: 14, color: '#ef4444', fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'background .2s' }}>
              🗑️ Reset All Stats
            </button>
          </div>
        )}

        {/* ── COUNTER TAB ── */}
        {tab === 'counter' && (
          <>
            {/* Dhikr selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 12, marginTop: 4 }}>
              {PRESETS.map((p, i) => {
                const c = COLORS[p.color];
                const isActive = selected === i;
                return (
                  <button key={p.name} onClick={() => setSelected(i)} className="preset-btn"
                    style={{
                      textAlign: 'left', padding: '11px 13px', borderRadius: 14,
                      border: `2px solid ${isActive ? c.ring : '#ede9e2'}`,
                      background: isActive ? c.light : '#fff',
                      cursor: 'pointer', transition: 'all .2s',
                      fontFamily: 'Georgia, serif', boxShadow: isActive ? `0 0 0 3px ${c.ring}22` : 'none',
                    }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: isActive ? c.text : '#666', margin: '0 0 2px' }}>{p.name}</p>
                    <p style={{ fontSize: 10, color: isActive ? c.text : '#bbb', margin: 0, opacity: 0.8 }}>× {p.target}</p>
                  </button>
                );
              })}
            </div>

            {/* Main counter card */}
            <div style={{ background: '#fff', borderRadius: 22, border: '1px solid #ede9e2', padding: '24px 20px', textAlign: 'center', marginBottom: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', animation: 'slideUp 0.3s ease' }}>

              {/* Arabic display */}
              <div style={{ background: color.light, borderRadius: 16, padding: '18px 14px', marginBottom: 20, border: `1px solid ${color.border}` }}>
                <p style={{ fontFamily: "'Scheherazade New', Georgia, serif", fontSize: 32, color: color.text, margin: '0 0 6px', lineHeight: 2, direction: 'rtl' }}>
                  {preset.arabic}
                </p>
                <p style={{ fontSize: 13, color: '#999', margin: 0, fontStyle: 'italic' }}>{preset.meaning}</p>
              </div>

              {/* Progress ring */}
              <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 20px' }}>
                {/* Glow effect behind ring */}
                <div style={{
                  position: 'absolute', inset: 20, borderRadius: '50%',
                  background: `radial-gradient(circle, ${color.ring}18 0%, transparent 70%)`,
                  transition: 'all 0.3s ease',
                }} />
                <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                  {/* Background track */}
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#f0ede8" strokeWidth="7" />
                  {/* Progress arc */}
                  <circle cx="50" cy="50" r="44" fill="none"
                    stroke={color.ring} strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.2s ease, stroke 0.4s ease' }}
                  />
                  {/* Inner decorative ring */}
                  <circle cx="50" cy="50" r="37" fill="none" stroke={color.ring} strokeWidth="0.5" opacity="0.2" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 54, fontWeight: 800, color: color.text, lineHeight: 1, transition: 'color 0.4s ease' }}>{count}</span>
                  <span style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>of {preset.target}</span>
                  {sessions > 0 && (
                    <span style={{ fontSize: 11, color: color.text, marginTop: 8, background: color.light, padding: '3px 12px', borderRadius: 20, border: `1px solid ${color.border}`, animation: 'popIn 0.3s ease' }}>
                      ✅ {sessions} round{sessions !== 1 ? 's' : ''} complete
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ background: '#f0ede8', borderRadius: 99, height: 6, marginBottom: 20, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: color.grad, borderRadius: 99, transition: 'width 0.2s ease' }} />
              </div>

              {/* Celebration banner */}
              {celebrated && (
                <div style={{ background: `linear-gradient(135deg, #059669, #0d9488)`, color: '#fff', borderRadius: 14, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontWeight: 600, animation: 'popIn 0.3s ease', boxShadow: '0 4px 16px rgba(5,150,105,0.3)' }}>
                  {celebMsg}
                </div>
              )}

              {/* ── TAP BUTTON — no vibration, smooth ripple only ── */}
              <button
                onClick={handleCount}
                className="dhikr-btn"
                style={{
                  width: '100%', padding: '22px 0', borderRadius: 20,
                  background: flash ? color.ring : color.grad,
                  color: '#fff', fontSize: 20, fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                  boxShadow: `0 8px 32px ${color.ring}45`,
                  transform: flash ? 'scale(0.975)' : 'scale(1)',
                  transition: 'transform 0.08s ease, box-shadow 0.3s ease, background 0.08s ease',
                  fontFamily: 'Georgia, serif', letterSpacing: 0.5,
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Ripple effects */}
                {ripples.map(r => (
                  <span key={r.id} style={{
                    position: 'absolute', left: r.x, top: r.y,
                    width: 40, height: 40, marginLeft: -20, marginTop: -20,
                    borderRadius: '50%', background: 'rgba(255,255,255,0.35)',
                    animation: 'ripple 0.6s ease-out forwards',
                    pointerEvents: 'none',
                  }} />
                ))}
                📿 Tap to Count
              </button>
              <p style={{ fontSize: 10, color: '#ccc', marginTop: 7 }}>or press Space / Enter on keyboard</p>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={reset}
                  style={{ flex: 1, padding: 12, border: '1.5px solid #ede9e2', borderRadius: 14, fontSize: 13, color: '#888', background: '#fafaf8', cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'background .2s' }}>
                  🔄 Reset
                </button>
                <button onClick={() => setShowHadith(!showHadith)}
                  style={{ flex: 1, padding: 12, border: `1.5px solid ${color.border}`, borderRadius: 14, fontSize: 13, color: color.text, background: color.light, cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'all .2s' }}>
                  📖 {showHadith ? 'Hide' : 'Hadith'}
                </button>
                <button onClick={handleShare}
                  style={{ flex: 1, padding: 12, border: 'none', borderRadius: 14, fontSize: 13, color: '#fff', background: color.grad, cursor: 'pointer', fontFamily: 'Georgia, serif', boxShadow: `0 4px 14px ${color.ring}35` }}>
                  🌙 Share
                </button>
              </div>
            </div>

            {/* Hadith card */}
            {showHadith && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 18, padding: '18px 20px', marginBottom: 10, animation: 'slideUp 0.25s ease', boxShadow: '0 2px 12px rgba(251,191,36,0.12)' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>📖 Hadith & Virtue</p>
                <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>{preset.hadith}</p>
              </div>
            )}

            {/* Share motivation */}
            <div style={{ background: 'linear-gradient(135deg, #0a3d2e, #1a5c3a)', borderRadius: 18, padding: '18px 20px', boxShadow: '0 4px 20px rgba(10,61,46,0.2)' }}>
              <p style={{ color: '#c8a96e', fontSize: 13, fontWeight: 700, margin: '0 0 8px' }}>🌙 Share & Earn Sadaqah Jariyah</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.7, margin: '0 0 14px' }}>
                Every time someone does dhikr because of you, you earn the same reward — even after you are gone. The Prophet ﷺ said: <em>&quot;Whoever guides someone to goodness will have a reward like the one who did it.&quot;</em>
              </p>
              <button onClick={handleShare}
                style={{ width: '100%', padding: 12, background: '#c8a96e', color: '#0a3d2e', border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', boxShadow: '0 4px 14px rgba(200,169,110,0.3)' }}>
                🤍 Share This App
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── SHARE MODAL ── */}
      {showShare && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowShare(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px 44px', width: '100%', maxWidth: 500, animation: 'slideUp 0.3s ease' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: '#e5e5e5', borderRadius: 2, margin: '0 auto 20px' }} />
            <p style={{ fontSize: 17, fontWeight: 700, color: '#0a3d2e', margin: '0 0 4px' }}>🌙 Share & Earn Rewards</p>
            <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 16px' }}>Every dhikr they do = reward for you too 🤍</p>

            <div style={{ background: '#f8f5f0', borderRadius: 14, padding: 16, marginBottom: 16, fontSize: 12, color: '#555', lineHeight: 1.8, maxHeight: 150, overflowY: 'auto', border: '1px solid #ede9e2' }}>
              {shareText}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <button onClick={copyShare}
                style={{ padding: 14, background: copied ? '#059669' : '#0a3d2e', color: '#fff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'background .3s' }}>
                {copied ? '✅ Copied to clipboard!' : '📋 Copy Message'}
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
                style={{ padding: 12, background: '#f8f5f0', color: '#888', border: 'none', borderRadius: 14, fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}