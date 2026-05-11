'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const PRESETS = [
  { name: 'Subhanallah',       arabic: 'سُبْحَانَ اللَّهِ',                  meaning: 'Glory be to Allah',              target: 33,  color: 'emerald', hadith: 'Whoever recites this 33 times after each prayer will have his sins forgiven even if they are as much as the foam of the sea.' },
  { name: 'Alhamdulillah',     arabic: 'الْحَمْدُ لِلَّهِ',                  meaning: 'All praise be to Allah',          target: 33,  color: 'blue',    hadith: '"Alhamdulillah fills the scale." — Sahih Muslim' },
  { name: 'Allahu Akbar',      arabic: 'اللَّهُ أَكْبَرُ',                   meaning: 'Allah is the Greatest',           target: 33,  color: 'purple',  hadith: '"Subhanallah, Alhamdulillah, Allahu Akbar are more beloved to me than all that the sun rises over." — Sahih Muslim' },
  { name: 'La ilaha illallah', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',         meaning: 'There is no god but Allah',       target: 100, color: 'amber',   hadith: '"The best dhikr is La ilaha illallah." — Sunan Tirmidhi' },
  { name: 'Astaghfirullah',    arabic: 'أَسْتَغْفِرُ اللَّهَ',              meaning: 'I seek forgiveness from Allah',   target: 100, color: 'rose',    hadith: 'The Prophet ﷺ used to seek forgiveness 100 times per day. — Sahih Bukhari' },
  { name: 'Salawat',           arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', meaning: 'Blessings upon the Prophet ﷺ',   target: 100, color: 'teal',    hadith: '"Whoever sends blessings upon me once, Allah will send blessings upon him tenfold." — Sahih Muslim' },
  { name: 'Hasbunallah',       arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', meaning: 'Allah is sufficient for us',  target: 33,  color: 'indigo',  hadith: 'This was the saying of Ibrahim ﷺ when thrown into the fire, and Muhammad ﷺ when facing hardship. — Sahih Bukhari' },
  { name: 'Laa Hawla',         arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', meaning: 'No power except with Allah', target: 33, color: 'orange', hadith: '"It is a treasure from the treasures of Paradise." — Sahih Bukhari & Muslim' },
];

const COLORS: Record<string, { bg: string; light: string; text: string; border: string; ring: string; grad: string }> = {
  emerald: { bg: '#059669', light: '#ecfdf5', text: '#047857', border: '#6ee7b7', ring: '#10b981', grad: 'linear-gradient(135deg,#059669,#0d9488)' },
  blue:    { bg: '#2563eb', light: '#eff6ff', text: '#1d4ed8', border: '#93c5fd', ring: '#3b82f6', grad: 'linear-gradient(135deg,#2563eb,#7c3aed)' },
  purple:  { bg: '#7c3aed', light: '#f5f3ff', text: '#6d28d9', border: '#c4b5fd', ring: '#8b5cf6', grad: 'linear-gradient(135deg,#7c3aed,#db2777)' },
  amber:   { bg: '#d97706', light: '#fffbeb', text: '#b45309', border: '#fcd34d', ring: '#f59e0b', grad: 'linear-gradient(135deg,#d97706,#dc2626)' },
  rose:    { bg: '#e11d48', light: '#fff1f2', text: '#be123c', border: '#fda4af', ring: '#f43f5e', grad: 'linear-gradient(135deg,#e11d48,#7c3aed)' },
  teal:    { bg: '#0d9488', light: '#f0fdfa', text: '#0f766e', border: '#5eead4', ring: '#14b8a6', grad: 'linear-gradient(135deg,#0d9488,#2563eb)' },
  indigo:  { bg: '#4338ca', light: '#eef2ff', text: '#3730a3', border: '#a5b4fc', ring: '#6366f1', grad: 'linear-gradient(135deg,#4338ca,#0d9488)' },
  orange:  { bg: '#ea580c', light: '#fff7ed', text: '#c2410c', border: '#fdba74', ring: '#f97316', grad: 'linear-gradient(135deg,#ea580c,#d97706)' },
};

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
  const [showShare, setShowShare]   = useState(false);
  const [copied, setCopied]         = useState(false);
  const [streakDay, setStreakDay]   = useState(() => loadData('dhikr_streak', 0));
  const [showHadith, setShowHadith] = useState(false);
  const [tab, setTab]               = useState<'counter'|'stats'>('counter');

  const preset = PRESETS[selected];
  const color  = COLORS[preset.color];
  const progress = Math.min((count / preset.target) * 100, 100);
  const circumference = 2 * Math.PI * 44;

  // Reset per dhikr switch
  useEffect(() => {
    setCount(0); setSessions(0); setCelebrated(false);
  }, [selected]);

  // Save total
  useEffect(() => { saveData('dhikr_total', totalAll); }, [totalAll]);

  const vibrate = () => {
    try { if (navigator.vibrate) navigator.vibrate(30); } catch {}
  };

  const handleCount = useCallback(() => {
    vibrate();
    const next = count + 1;
    setCount(next);
    setTotalAll(t => t + 1);
    setFlash(true);
    setTimeout(() => setFlash(false), 120);

    if (next >= preset.target) {
      setSessions(s => s + 1);
      setCount(0);
      setCelebrated(true);
      try { if (navigator.vibrate) navigator.vibrate([60, 40, 60]); } catch {}
      setTimeout(() => setCelebrated(false), 2500);

      // Update streak
      const today = new Date().toDateString();
      const lastDay = loadData<string>('dhikr_last_day', '');
      if (lastDay !== today) {
        const newStreak = streakDay + 1;
        setStreakDay(newStreak);
        saveData('dhikr_streak', newStreak);
        saveData('dhikr_last_day', today);
      }
    }
  }, [count, preset.target, streakDay]);

  // Space bar / enter support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleCount(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCount]);

  const reset = () => { setCount(0); setSessions(0); setCelebrated(false); };
  const resetAll = () => { setCount(0); setSessions(0); setTotalAll(0); setStreakDay(0); setCelebrated(false); saveData('dhikr_total', 0); saveData('dhikr_streak', 0); };

  const shareText = `🌙 I just completed ${sessions > 0 ? sessions + ' round(s) of ' : ''}${preset.name} (${preset.arabic})

${preset.meaning}

📿 "${preset.hadith}"

Use this free Islamic Dhikr Counter 👇
🔗 iloveislam.life/dhikr

Share this with someone you love — every time they do dhikr because of you, you earn the same reward! 🤍`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Dhikr Counter — I Love Islam', text: shareText, url: 'https://iloveislam.life/dhikr' });
        return;
      } catch {}
    }
    setShowShare(true);
  };

  const copyShare = () => {
    navigator.clipboard?.writeText(shareText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f8', fontFamily: 'Georgia, serif' }}>

      {/* Header */}
      <div style={{ background: color.grad, padding: '14px 16px 20px', transition: 'background 0.4s' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none' }}>← Back</Link>
            <h1 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>📿 Dhikr Counter</h1>
            <button onClick={() => setTab(tab === 'counter' ? 'stats' : 'counter')}
              style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}>
              {tab === 'counter' ? '📊 Stats' : '📿 Counter'}
            </button>
          </div>

          {/* Streak & total bar */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Total Dhikr', value: totalAll.toLocaleString(), icon: '📿' },
              { label: 'Day Streak', value: streakDay + (streakDay === 1 ? ' day' : ' days'), icon: '🔥' },
              { label: 'This Session', value: (sessions * preset.target + count).toString(), icon: '✨' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '8px 6px', textAlign: 'center' }}>
                <p style={{ fontSize: 15, margin: '0 0 2px' }}>{s.icon}</p>
                <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: '0 0 1px' }}>{s.value}</p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 14px 50px' }}>

        {/* ── STATS TAB ── */}
        {tab === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e4de', padding: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0a3d2e', margin: '0 0 16px' }}>📊 Your Progress</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Total Dhikr Ever', value: totalAll.toLocaleString(), color: '#0a3d2e' },
                  { label: 'Day Streak', value: streakDay + ' days', color: '#d97706' },
                  { label: 'Rounds Today', value: sessions.toString(), color: '#7c3aed' },
                  { label: 'Remaining Now', value: (preset.target - count).toString(), color: '#e11d48' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#f8f6f2', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: '0 0 4px' }}>{s.value}</p>
                    <p style={{ fontSize: 11, color: '#999', margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e4de', padding: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0a3d2e', margin: '0 0 12px' }}>✨ The Power of Dhikr</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { num: '33×', label: 'Subhanallah, Alhamdulillah, Allahu Akbar after each prayer', icon: '🕌' },
                  { num: '100×', label: 'La ilaha illallah — best of all dhikr', icon: '⭐' },
                  { num: '10×', label: 'Reward multiplied for each Salawat on the Prophet ﷺ', icon: '💚' },
                ].map(i => (
                  <div key={i.num} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px', background: '#f8f6f2', borderRadius: 10 }}>
                    <span style={{ fontSize: 18 }}>{i.icon}</span>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: color.text }}>{i.num} </span>
                      <span style={{ fontSize: 12, color: '#666' }}>{i.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={resetAll} style={{ background: '#fff', border: '1px solid #fca5a5', borderRadius: 12, padding: '12px', color: '#ef4444', fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
              🗑️ Reset All Stats
            </button>
          </div>
        )}

        {/* ── COUNTER TAB ── */}
        {tab === 'counter' && (
          <>
            {/* Dhikr selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12, marginTop: 4 }}>
              {PRESETS.map((p, i) => {
                const c = COLORS[p.color];
                const isActive = selected === i;
                return (
                  <button key={p.name} onClick={() => setSelected(i)}
                    style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${isActive ? c.border : '#e8e4de'}`, background: isActive ? c.light : '#fff', cursor: 'pointer', transition: 'all .15s', fontFamily: 'Georgia, serif' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: isActive ? c.text : '#555', margin: '0 0 2px' }}>{p.name}</p>
                    <p style={{ fontSize: 10, color: '#aaa', margin: 0 }}>× {p.target}</p>
                  </button>
                );
              })}
            </div>

            {/* Main counter card */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8e4de', padding: '24px 20px', textAlign: 'center', marginBottom: 10 }}>

              {/* Arabic */}
              <div style={{ background: color.light, borderRadius: 14, padding: '16px 12px', marginBottom: 20 }}>
                <p style={{ fontFamily: "'Scheherazade New', Georgia, serif", fontSize: 30, color: color.text, margin: '0 0 6px', lineHeight: 1.8 }}>
                  {preset.arabic}
                </p>
                <p style={{ fontSize: 13, color: '#888', margin: 0 }}>{preset.meaning}</p>
              </div>

              {/* Progress ring */}
              <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 16px' }}>
                <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#f0ede8" strokeWidth="7" />
                  <circle cx="50" cy="50" r="44" fill="none"
                    stroke={color.ring} strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.25s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 52, fontWeight: 800, color: color.text, lineHeight: 1 }}>{count}</span>
                  <span style={{ fontSize: 13, color: '#bbb', marginTop: 4 }}>of {preset.target}</span>
                  {sessions > 0 && (
                    <span style={{ fontSize: 11, color: color.text, marginTop: 6, background: color.light, padding: '2px 10px', borderRadius: 20 }}>
                      ✅ {sessions} round{sessions !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Celebration */}
              {celebrated && (
                <div style={{ background: `linear-gradient(135deg, #059669, #0d9488)`, color: '#fff', borderRadius: 12, padding: '10px 16px', marginBottom: 14, fontSize: 14, fontWeight: 600 }}>
                  🎉 Alhamdulillah! Round complete! 🤍
                </div>
              )}

              {/* BIG TAP BUTTON */}
              <button
                onClick={handleCount}
                style={{
                  width: '100%', padding: '22px 0', borderRadius: 18,
                  background: flash ? color.ring : color.grad,
                  color: '#fff', fontSize: 20, fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                  boxShadow: `0 8px 28px ${color.ring}50`,
                  transform: flash ? 'scale(0.96)' : 'scale(1)',
                  transition: 'all 0.1s ease',
                  fontFamily: 'Georgia, serif',
                  letterSpacing: 0.5,
                }}
              >
                📿 Tap to Count
              </button>
              <p style={{ fontSize: 10, color: '#ccc', marginTop: 6 }}>or press Space / Enter on keyboard</p>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={reset}
                  style={{ flex: 1, padding: '11px', border: '1px solid #e8e4de', borderRadius: 12, fontSize: 13, color: '#888', background: '#fafafa', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                  🔄 Reset
                </button>
                <button onClick={() => setShowHadith(!showHadith)}
                  style={{ flex: 1, padding: '11px', border: `1px solid ${color.border}`, borderRadius: 12, fontSize: 13, color: color.text, background: color.light, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                  📖 Hadith
                </button>
                <button onClick={handleShare}
                  style={{ flex: 1, padding: '11px', border: 'none', borderRadius: 12, fontSize: 13, color: '#fff', background: color.grad, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                  🌙 Share
                </button>
              </div>
            </div>

            {/* Hadith card */}
            {showHadith && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 16, padding: '16px 18px', marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', margin: '0 0 6px' }}>📖 Hadith / Virtue</p>
                <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{preset.hadith}</p>
              </div>
            )}

            {/* Share motivation card */}
            <div style={{ background: 'linear-gradient(135deg, #0a3d2e, #1a5c3a)', borderRadius: 16, padding: '16px 18px' }}>
              <p style={{ color: '#c8a96e', fontSize: 13, fontWeight: 700, margin: '0 0 6px' }}>🌙 Share & Earn Sadaqah Jariyah</p>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.6, margin: '0 0 12px' }}>
                Share this app with family and friends. Every time someone does dhikr because of you, you earn the same reward — even after you are gone. The Prophet ﷺ said: <em>&quot;Whoever guides someone to goodness will have a reward like the one who did it.&quot;</em>
              </p>
              <button onClick={handleShare}
                style={{ width: '100%', padding: '11px', background: '#c8a96e', color: '#0a3d2e', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                🤍 Share This App
              </button>
            </div>
          </>
        )}
      </div>

      {/* Share modal */}
      {showShare && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowShare(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: '#e5e5e5', borderRadius: 2, margin: '0 auto 20px' }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0a3d2e', margin: '0 0 6px' }}>🌙 Share & Earn Rewards</p>
            <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 14px' }}>Every dhikr they do = reward for you too 🤍</p>

            <div style={{ background: '#f8f6f2', borderRadius: 12, padding: '14px', marginBottom: 14, fontSize: 12, color: '#555', lineHeight: 1.7, maxHeight: 160, overflowY: 'auto' }}>
              {shareText}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={copyShare}
                style={{ padding: '14px', background: copied ? '#059669' : '#0a3d2e', color: '#fff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'background .2s' }}>
                {copied ? '✅ Copied!' : '📋 Copy Message'}
              </button>

              {/* WhatsApp */}
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', padding: '14px', background: '#25d366', color: '#fff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', fontFamily: 'Georgia, serif' }}>
                💬 Share on WhatsApp
              </a>

              {/* Telegram */}
              <a href={`https://t.me/share/url?url=https://iloveislam.life/dhikr&text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', padding: '14px', background: '#0088cc', color: '#fff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', fontFamily: 'Georgia, serif' }}>
                ✈️ Share on Telegram
              </a>

              <button onClick={() => setShowShare(false)}
                style={{ padding: '12px', background: '#f8f6f2', color: '#888', border: 'none', borderRadius: 14, fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap');
      `}</style>
    </div>
  );
}