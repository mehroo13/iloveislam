'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';

/* ── Types ── */
interface IslamicEventTemplate {
  name: string;
  arabicName: string;
  hijriMonth: number;
  hijriDay: number;
  emoji: string;
  color: string;
  bgGradient: string;
  description: string;
  importance: string;
}

interface ResolvedEvent {
  name: string;
  arabicName: string;
  hijriDate: string;
  gregorianDate: Date;
  emoji: string;
  color: string;
  bgGradient: string;
  description: string;
  importance: string;
  key: string;
  pinned?: boolean;
}

/* ── Hijri ↔ Gregorian Conversion ── */
function hijriToGregorian(hy: number, hm: number, hd: number): Date {
  const jd =
    Math.floor((11 * hy + 3) / 30) +
    Math.floor(354 * hy) +
    Math.floor(30 * hm) -
    Math.floor((hm - 1) / 2) +
    hd + 1948440 - 385;
  let l = jd + 68569;
  const n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const day = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const month = j + 2 - 12 * l;
  const year = 100 * (n - 49) + i + l;
  return new Date(year, month - 1, day);
}

function gregorianToApproxHijriYear(gYear: number): number {
  return Math.floor(((gYear - 622) * 33) / 32);
}

const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
];

/* ── Event Templates ── */
const EVENT_TEMPLATES: IslamicEventTemplate[] = [
  {
    name: 'Ramadan', arabicName: 'رَمَضَان', hijriMonth: 9, hijriDay: 1,
    emoji: '🌙', color: '#c8a96e',
    bgGradient: 'linear-gradient(135deg, #1a0a00 0%, #3d1f00 50%, #1a0a00 100%)',
    description: 'The blessed month of fasting, prayer, and reflection', importance: 'Fard (Obligatory)',
  },
  {
    name: 'Laylatul Qadr', arabicName: 'لَيْلَةُ الْقَدْر', hijriMonth: 9, hijriDay: 27,
    emoji: '✨', color: '#a78bfa',
    bgGradient: 'linear-gradient(135deg, #0f0520 0%, #2d1b69 50%, #0f0520 100%)',
    description: 'The Night of Power — better than a thousand months', importance: 'The Most Blessed Night',
  },
  {
    name: 'Eid ul-Fitr', arabicName: 'عِيدُ الفِطْر', hijriMonth: 10, hijriDay: 1,
    emoji: '🎉', color: '#4ade80',
    bgGradient: 'linear-gradient(135deg, #0a1a0a 0%, #0a3d2e 50%, #0a1a0a 100%)',
    description: 'The Festival of Breaking the Fast — celebrate with family', importance: 'Eid Prayer (Wajib)',
  },
  {
    name: 'Day of Arafah', arabicName: 'يَوْمُ عَرَفَة', hijriMonth: 12, hijriDay: 9,
    emoji: '🕋', color: '#fbbf24',
    bgGradient: 'linear-gradient(135deg, #1a1000 0%, #3d2e00 50%, #1a1000 100%)',
    description: 'Fasting on this day expiates sins of two years', importance: 'Highly Recommended Fast',
  },
  {
    name: 'Eid ul-Adha', arabicName: 'عِيدُ الأَضْحَى', hijriMonth: 12, hijriDay: 10,
    emoji: '🐑', color: '#fb923c',
    bgGradient: 'linear-gradient(135deg, #1a0800 0%, #4a1a00 50%, #1a0800 100%)',
    description: 'The Festival of Sacrifice — commemorating Ibrahim (AS)', importance: 'Eid Prayer & Qurbani',
  },
  {
    name: 'Islamic New Year', arabicName: 'رَأْسُ السَّنَةِ الهِجْرِيَّة', hijriMonth: 1, hijriDay: 1,
    emoji: '🌟', color: '#38bdf8',
    bgGradient: 'linear-gradient(135deg, #00101a 0%, #003d5c 50%, #00101a 100%)',
    description: 'The start of a new Hijri year — reflect and renew intentions', importance: 'New Hijri Year',
  },
  {
    name: 'Day of Ashura', arabicName: 'يَوْمُ عَاشُورَاء', hijriMonth: 1, hijriDay: 10,
    emoji: '🤲', color: '#818cf8',
    bgGradient: 'linear-gradient(135deg, #0a001a 0%, #1e1b4b 50%, #0a001a 100%)',
    description: 'Fasting on this day expiates sins of the previous year', importance: 'Recommended Fast',
  },
  {
    name: "Mawlid an-Nabi", arabicName: 'المَوْلِدُ النَّبَوِيّ', hijriMonth: 3, hijriDay: 12,
    emoji: '☪️', color: '#34d399',
    bgGradient: 'linear-gradient(135deg, #001a0a 0%, #014a2a 50%, #001a0a 100%)',
    description: "Commemorating the birth of Prophet Muhammad ﷺ", importance: 'Celebrated Widely',
  },
  {
    name: "Isra and Mi'raj", arabicName: 'الإسراء والمعراج', hijriMonth: 7, hijriDay: 27,
    emoji: '🌠', color: '#f0abfc',
    bgGradient: 'linear-gradient(135deg, #1a001a 0%, #4a004a 50%, #1a001a 100%)',
    description: "The miraculous night journey and ascension of the Prophet ﷺ", importance: 'Significant Night',
  },
  {
    name: "Shab-e-Barat", arabicName: 'لَيْلَةُ البَرَاءَة', hijriMonth: 8, hijriDay: 15,
    emoji: '🕯️', color: '#fcd34d',
    bgGradient: 'linear-gradient(135deg, #1a1400 0%, #4a3a00 50%, #1a1400 100%)',
    description: "The Night of Forgiveness — seek Allah's mercy and pardon", importance: 'Night of Worship',
  },
];

/* ── Starfield Particle System ── */
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const stars: { x: number; y: number; r: number; opacity: number; speed: number; twinkleSpeed: number; twinklePhase: number }[] = [];
    const STAR_COUNT = 120;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize stars
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.3 + 0.05,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      stars.forEach(star => {
        star.twinklePhase += star.twinkleSpeed;
        const currentOpacity = star.opacity * (0.6 + 0.4 * Math.sin(star.twinklePhase));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 180, 140, ${currentOpacity})`;
        ctx.fill();

        // Glow for larger stars
        if (star.r > 1) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 169, 110, ${currentOpacity * 0.15})`;
          ctx.fill();
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.8 }} />;
}

/* ── Geometric Pattern Ornament ── */
function GeometricOrnament({ size = 200, opacity = 0.04 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ position: 'absolute', pointerEvents: 'none', opacity }}>
      <defs>
        <pattern id="geometric" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="#c8a96e" strokeWidth="0.5" />
          <circle cx="20" cy="20" r="8" fill="none" stroke="#c8a96e" strokeWidth="0.3" />
          <circle cx="20" cy="20" r="3" fill="#c8a96e" fillOpacity="0.3" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#geometric)" />
    </svg>
  );
}

/* ── Resolver ── */
function resolveUpcomingEvents(): ResolvedEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const baseHijriYear = gregorianToApproxHijriYear(today.getFullYear());
  const results: ResolvedEvent[] = [];

  for (const tmpl of EVENT_TEMPLATES) {
    for (let offset = -1; offset <= 3; offset++) {
      const hy = baseHijriYear + offset;
      if (hy < 1) continue;
      const gDate = hijriToGregorian(hy, tmpl.hijriMonth, tmpl.hijriDay);
      gDate.setHours(0, 0, 0, 0);
      if (gDate >= today) {
        results.push({
          ...tmpl,
          name: `${tmpl.name} ${gDate.getFullYear()}`,
          hijriDate: `${tmpl.hijriDay} ${HIJRI_MONTHS[tmpl.hijriMonth - 1]} ${hy} AH`,
          gregorianDate: gDate,
          key: `${tmpl.name}-${hy}`,
        });
        break;
      }
    }
  }
  return results.sort((a, b) => a.gregorianDate.getTime() - b.gregorianDate.getTime());
}

function resolvePastEvents(): ResolvedEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const baseHijriYear = gregorianToApproxHijriYear(today.getFullYear());
  const results: ResolvedEvent[] = [];

  for (const tmpl of EVENT_TEMPLATES) {
    for (let offset = -2; offset <= 0; offset++) {
      const hy = baseHijriYear + offset;
      if (hy < 1) continue;
      const gDate = hijriToGregorian(hy, tmpl.hijriMonth, tmpl.hijriDay);
      gDate.setHours(0, 0, 0, 0);
      if (gDate < today && gDate >= cutoff) {
        results.push({
          ...tmpl,
          name: `${tmpl.name} ${gDate.getFullYear()}`,
          hijriDate: `${tmpl.hijriDay} ${HIJRI_MONTHS[tmpl.hijriMonth - 1]} ${hy} AH`,
          gregorianDate: gDate,
          key: `${tmpl.name}-${hy}-past`,
        });
      }
    }
  }
  return results.sort((a, b) => b.gregorianDate.getTime() - a.gregorianDate.getTime());
}

/* ── Helpers ── */
function getDaysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── Countdown Ring ── */
function CountdownRing({ days, color }: { days: number; color: string }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, 1 - days / 365));
  const offset = circ * (1 - pct);
  return (
    <svg width="100" height="100" className="transform -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle cx="50" cy="50" r={r} fill="none"
        stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 8px ${color}60)` }} />
    </svg>
  );
}

/* ── Event Card ── */
function EventCard({
  event,
  isPast,
  isPinned,
  onTogglePin,
}: {
  event: ResolvedEvent;
  isPast: boolean;
  isPinned: boolean;
  onTogglePin: (key: string) => void;
}) {
  const days = getDaysUntil(event.gregorianDate);
  const isToday = days === 0;
  const isSoon = !isPast && days > 0 && days <= 30;

  return (
    <div
      className="relative rounded-2xl overflow-hidden border transition-all duration-500 group"
      style={{
        background: isPast ? 'rgba(15,15,20,0.8)' : event.bgGradient,
        borderColor: isPinned ? `${event.color}60` : isPast ? 'rgba(255,255,255,0.04)' : `${event.color}20`,
        boxShadow: isPinned
          ? `0 0 30px ${event.color}20, 0 0 60px ${event.color}08, inset 0 1px 0 ${event.color}15`
          : isSoon
          ? `0 0 20px ${event.color}10`
          : 'none',
        opacity: isPast ? 0.45 : 1,
      }}
    >
      {/* Glow halo on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: `inset 0 0 60px ${event.color}08` }} />

      {/* Pinned indicator */}
      {isPinned && (
        <div className="absolute top-3 left-3 z-10">
          <span className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"
            style={{ background: `${event.color}25`, color: event.color, border: `1px solid ${event.color}40` }}>
            📌 Pinned
          </span>
        </div>
      )}

      {/* Today badge */}
      {isToday && (
        <div className="absolute top-3 right-3 z-10">
          <span className="text-[10px] font-bold px-2 py-1 rounded-full animate-pulse"
            style={{ background: event.color, color: '#000' }}>TODAY! 🎉</span>
        </div>
      )}

      {/* Soon badge */}
      {isSoon && !isToday && !isPinned && (
        <div className="absolute top-3 right-3 z-10">
          <span className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: `${event.color}20`, color: event.color, border: `1px solid ${event.color}30` }}>
            {days}d
          </span>
        </div>
      )}

      {/* Pin button */}
      {!isPast && (
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePin(event.key); }}
          className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110"
          style={{
            background: isPinned ? `${event.color}30` : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isPinned ? event.color : 'rgba(255,255,255,0.1)'}`,
            color: isPinned ? event.color : 'rgba(255,255,255,0.3)',
          }}
          title={isPinned ? 'Unpin' : 'Pin to top'}
        >
          📌
        </button>
      )}

      <div className="p-5 flex items-center gap-4">
        {/* Countdown Ring */}
        <div className="relative flex-shrink-0 w-[100px] h-[100px]">
          {isPast ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-600 text-2xl">✓</span>
            </div>
          ) : (
            <>
              <CountdownRing days={days} color={event.color} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl leading-none font-bold" style={{ color: event.color }}>
                  {isToday ? event.emoji : days}
                </span>
                {!isToday && <span className="text-[9px] text-white/30 mt-0.5">days</span>}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg">{event.emoji}</span>
            <h3 className="text-white font-bold text-sm leading-tight">{event.name}</h3>
          </div>
          <p className="text-xl mb-1 font-arabic" style={{ color: event.color }}>{event.arabicName}</p>
          <p className="text-white/30 text-[11px] mb-1">{formatDate(event.gregorianDate)}</p>
          <p className="text-white/40 text-[11px] leading-snug mb-2">{event.description}</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: `${event.color}15`, color: event.color, border: `1px solid ${event.color}25` }}>
            {event.importance}
          </span>
        </div>
      </div>

      {/* Hijri date footer */}
      <div className="px-5 pb-3">
        <p className="text-[10px] text-white/20 border-t border-white/5 pt-2">🌙 {event.hijriDate}</p>
      </div>
    </div>
  );
}

/* ── Hero Countdown ── */
function NextEventHero({ event }: { event: ResolvedEvent }) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const target = new Date(event.gregorianDate);
      target.setHours(0, 0, 0, 0);
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) { setT({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setT({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [event]);

  return (
    <div className="relative rounded-3xl p-6 mb-8 overflow-hidden border"
      style={{ background: event.bgGradient, borderColor: `${event.color}40`, boxShadow: `0 0 60px ${event.color}15` }}>
      {/* Geometric ornament */}
      <GeometricOrnament size={300} opacity={0.05} />
      <div className="absolute -top-4 -right-4 text-[100px] opacity-5">{event.emoji}</div>
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${event.color}40, transparent)` }} />

      <div className="relative z-10 text-center">
        <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: event.color }}>
          ✦ Next Islamic Event ✦
        </p>
        <h2 className="text-white font-bold text-2xl mb-1">{event.name}</h2>
        <p className="text-3xl mb-1 font-arabic" style={{ color: event.color }}>{event.arabicName}</p>
        <p className="text-white/40 text-xs mb-5">{formatDate(event.gregorianDate)} · {event.hijriDate}</p>

        {/* Live countdown digits */}
        <div className="flex justify-center gap-3 mb-4">
          {[
            { val: t.days, label: 'Days' },
            { val: t.hours, label: 'Hrs' },
            { val: t.minutes, label: 'Mins' },
            { val: t.seconds, label: 'Secs' },
          ].map(({ val, label }) => (
            <div key={label} className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold font-mono"
                style={{
                  background: `${event.color}15`,
                  color: event.color,
                  border: `1px solid ${event.color}30`,
                  boxShadow: `0 0 15px ${event.color}10`,
                }}>
                {String(val).padStart(2, '0')}
              </div>
              <span className="text-[10px] text-white/30 mt-1.5">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-white/50 text-xs">{event.description}</p>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function IslamicEventsPage() {
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [pinnedKeys, setPinnedKeys] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('islamic_events_pinned');
    if (saved) {
      try { setPinnedKeys(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('islamic_events_pinned', JSON.stringify(pinnedKeys));
  }, [pinnedKeys]);

  const togglePin = useCallback((key: string) => {
    setPinnedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [key, ...prev]);
  }, []);

  const { upcomingEvents, pastEvents } = useMemo(() => ({
    upcomingEvents: resolveUpcomingEvents().map(e => ({ ...e, pinned: pinnedKeys.includes(e.key) })),
    pastEvents: resolvePastEvents(),
  }), [pinnedKeys]);

  // Sort: pinned first, then by date
  const sortedUpcoming = useMemo(() => {
    const pinned = upcomingEvents.filter(e => e.pinned);
    const unpinned = upcomingEvents.filter(e => !e.pinned).sort((a, b) => a.gregorianDate.getTime() - b.gregorianDate.getTime());
    return [...pinned, ...unpinned];
  }, [upcomingEvents]);

  const nextEvent = sortedUpcoming[0] || null;
  const displayEvents = filter === 'upcoming' ? sortedUpcoming : pastEvents;

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#06080c' }}>
        <div className="text-emerald-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: '#06080c' }}>
      {/* Starfield background */}
      <Starfield />

      {/* Subtle radial gradient overlay */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(200,169,110,0.04) 0%, transparent 60%)' }} />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header style={{ background: 'linear-gradient(180deg, rgba(10,61,46,0.6) 0%, rgba(13,82,56,0.3) 80%, transparent 100%)', backdropFilter: 'blur(20px)' }}>
          <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="text-white/40 hover:text-white/70 text-xs transition flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20">
                ← Back
              </Link>
              <span className="text-white/20 text-xs tracking-[0.2em]">☽ ISLAMIC CALENDAR</span>
            </div>
            <div className="text-center">
              <div className="relative inline-block mb-3">
                <span className="text-4xl">🕌</span>
                <div className="absolute -inset-4 rounded-full opacity-20"
                  style={{ background: 'radial-gradient(circle, #c8a96e, transparent)' }} />
              </div>
              <h1 className="text-white font-bold text-2xl mb-2">Islamic Events & Countdowns</h1>
              <p className="text-white/35 text-sm">Ramadan · Eid · Ashura · Mawlid · Laylatul Qadr</p>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          {/* Hero */}
          {nextEvent && <NextEventHero event={nextEvent} />}

          {/* Filter tabs */}
          <div className="flex gap-2 mb-5">
            {(['upcoming', 'past'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all capitalize"
                style={filter === f
                  ? { background: 'rgba(10,61,46,0.6)', color: '#4ade80', border: '1px solid rgba(45,106,79,0.5)', backdropFilter: 'blur(10px)' }
                  : { background: 'rgba(255,255,255,0.03)', color: '#555', border: '1px solid rgba(255,255,255,0.06)' }}>
                {f === 'upcoming' ? `Upcoming (${sortedUpcoming.length})` : `Past (${pastEvents.length})`}
              </button>
            ))}
            {pinnedKeys.length > 0 && filter === 'upcoming' && (
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1"
                style={{ background: 'rgba(200,169,110,0.1)', color: '#c8a96e', border: '1px solid rgba(200,169,110,0.2)' }}>
                📌 {pinnedKeys.length} pinned
              </span>
            )}
          </div>

          {/* Event cards */}
          <div className="flex flex-col gap-4">
            {displayEvents.map(event => (
              <EventCard
                key={event.key}
                event={event}
                isPast={filter === 'past'}
                isPinned={!!event.pinned}
                onTogglePin={togglePin}
              />
            ))}
          </div>

          {/* Empty state */}
          {displayEvents.length === 0 && (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🌙</p>
              <p className="text-white/40 text-sm">No events to show</p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-8 p-4 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
            <p className="text-white/25 text-xs leading-relaxed">
              ⚠️ Dates are calculated algorithmically and may vary ±1 day depending on moon sighting in your region. Always confirm with your local mosque.
            </p>
          </div>

          {/* Footer link */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-emerald-600 hover:text-emerald-500 text-xs transition">
              ← Back to all Islamic tools
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}