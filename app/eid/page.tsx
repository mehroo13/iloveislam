'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// ==================== TYPES ====================
interface IslamicEventTemplate {
  name: string;
  arabicName: string;
  hijriMonth: number; // 1–12
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
}

// ==================== HIJRI <-> GREGORIAN ====================
// Kuwaiti algorithm — accurate to ±1 day
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
  // Each Hijri year ≈ 354.367 days; epoch offset from 622 CE
  return Math.floor(((gYear - 622) * 33) / 32);
}

const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
];

// ==================== EVENT TEMPLATES ====================
// Only Hijri month + day are stored. Gregorian year is resolved at runtime.
const EVENT_TEMPLATES: IslamicEventTemplate[] = [
  {
    name: 'Ramadan',
    arabicName: 'رَمَضَان',
    hijriMonth: 9, hijriDay: 1,
    emoji: '🌙',
    color: '#c8a96e',
    bgGradient: 'linear-gradient(135deg, #1a0a00 0%, #3d1f00 50%, #1a0a00 100%)',
    description: 'The blessed month of fasting, prayer, and reflection',
    importance: 'Fard (Obligatory)',
  },
  {
    name: 'Laylatul Qadr',
    arabicName: 'لَيْلَةُ الْقَدْر',
    hijriMonth: 9, hijriDay: 27,
    emoji: '✨',
    color: '#a78bfa',
    bgGradient: 'linear-gradient(135deg, #0f0520 0%, #2d1b69 50%, #0f0520 100%)',
    description: 'The Night of Power — better than a thousand months',
    importance: 'The Most Blessed Night',
  },
  {
    name: 'Eid ul-Fitr',
    arabicName: 'عِيدُ الفِطْر',
    hijriMonth: 10, hijriDay: 1,
    emoji: '🎉',
    color: '#4ade80',
    bgGradient: 'linear-gradient(135deg, #0a1a0a 0%, #0a3d2e 50%, #0a1a0a 100%)',
    description: 'The Festival of Breaking the Fast — celebrate with family',
    importance: 'Eid Prayer (Wajib)',
  },
  {
    name: 'Day of Arafah',
    arabicName: 'يَوْمُ عَرَفَة',
    hijriMonth: 12, hijriDay: 9,
    emoji: '🕋',
    color: '#fbbf24',
    bgGradient: 'linear-gradient(135deg, #1a1000 0%, #3d2e00 50%, #1a1000 100%)',
    description: 'Fasting on this day expiates sins of two years',
    importance: 'Highly Recommended Fast',
  },
  {
    name: 'Eid ul-Adha',
    arabicName: 'عِيدُ الأَضْحَى',
    hijriMonth: 12, hijriDay: 10,
    emoji: '🐑',
    color: '#fb923c',
    bgGradient: 'linear-gradient(135deg, #1a0800 0%, #4a1a00 50%, #1a0800 100%)',
    description: 'The Festival of Sacrifice — commemorating Ibrahim (AS)',
    importance: 'Eid Prayer & Qurbani',
  },
  {
    name: 'Islamic New Year',
    arabicName: 'رَأْسُ السَّنَةِ الهِجْرِيَّة',
    hijriMonth: 1, hijriDay: 1,
    emoji: '🌟',
    color: '#38bdf8',
    bgGradient: 'linear-gradient(135deg, #00101a 0%, #003d5c 50%, #00101a 100%)',
    description: 'The start of a new Hijri year — reflect and renew intentions',
    importance: 'New Hijri Year',
  },
  {
    name: 'Day of Ashura',
    arabicName: 'يَوْمُ عَاشُورَاء',
    hijriMonth: 1, hijriDay: 10,
    emoji: '🤲',
    color: '#818cf8',
    bgGradient: 'linear-gradient(135deg, #0a001a 0%, #1e1b4b 50%, #0a001a 100%)',
    description: 'Fasting on this day expiates sins of the previous year',
    importance: 'Recommended Fast',
  },
  {
    name: "Mawlid an-Nabi",
    arabicName: 'المَوْلِدُ النَّبَوِيّ',
    hijriMonth: 3, hijriDay: 12,
    emoji: '☪️',
    color: '#34d399',
    bgGradient: 'linear-gradient(135deg, #001a0a 0%, #014a2a 50%, #001a0a 100%)',
    description: "Commemorating the birth of Prophet Muhammad ﷺ",
    importance: 'Celebrated Widely',
  },
  {
    name: "Isra and Mi'raj",
    arabicName: 'الإسراء والمعراج',
    hijriMonth: 7, hijriDay: 27,
    emoji: '🌠',
    color: '#f0abfc',
    bgGradient: 'linear-gradient(135deg, #1a001a 0%, #4a004a 50%, #1a001a 100%)',
    description: "The miraculous night journey and ascension of the Prophet ﷺ",
    importance: 'Significant Night',
  },
  {
    name: "Shab-e-Barat",
    arabicName: 'لَيْلَةُ البَرَاءَة',
    hijriMonth: 8, hijriDay: 15,
    emoji: '🕯️',
    color: '#fcd34d',
    bgGradient: 'linear-gradient(135deg, #1a1400 0%, #4a3a00 50%, #1a1400 100%)',
    description: "The Night of Forgiveness — seek Allah's mercy and pardon",
    importance: 'Night of Worship',
  },
];

// ==================== DYNAMIC RESOLVER ====================
// Finds the next occurrence of every event from today onward — works for any year, forever.
function resolveUpcomingEvents(): ResolvedEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const baseHijriYear = gregorianToApproxHijriYear(today.getFullYear());
  const results: ResolvedEvent[] = [];

  for (const tmpl of EVENT_TEMPLATES) {
    // Search up to 3 Hijri years ahead to find the next occurrence
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
        break; // Only the next occurrence of this event
      }
    }
  }

  return results.sort((a, b) => a.gregorianDate.getTime() - b.gregorianDate.getTime());
}

function resolvePastEvents(): ResolvedEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setFullYear(cutoff.getFullYear() - 1); // Last 12 months only
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

// ==================== HELPERS ====================
function getDaysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ==================== COUNTDOWN RING ====================
function CountdownRing({ days, color }: { days: number; color: string }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, 1 - days / 365));
  const offset = circ * (1 - pct);
  return (
    <svg width="110" height="110" className="transform -rotate-90">
      <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <circle cx="55" cy="55" r={r} fill="none"
        stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${color}80)` }} />
    </svg>
  );
}

// ==================== EVENT CARD ====================
function EventCard({ event, isPast }: { event: ResolvedEvent; isPast: boolean }) {
  const days = getDaysUntil(event.gregorianDate);
  const isToday = days === 0;
  const isSoon = !isPast && days > 0 && days <= 30;

  return (
    <div className="relative rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      style={{
        background: isPast ? '#111' : event.bgGradient,
        borderColor: isPast ? '#222' : `${event.color}30`,
        opacity: isPast ? 0.5 : 1,
      }}>
      {!isPast && isSoon && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top, ${event.color}15 0%, transparent 60%)` }} />
      )}
      {isToday && (
        <div className="absolute top-3 right-3 z-10">
          <span className="text-[10px] font-bold px-2 py-1 rounded-full animate-pulse"
            style={{ background: event.color, color: '#000' }}>TODAY! 🎉</span>
        </div>
      )}
      {isSoon && !isToday && (
        <div className="absolute top-3 right-3 z-10">
          <span className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: `${event.color}30`, color: event.color, border: `1px solid ${event.color}50` }}>
            {days} days away
          </span>
        </div>
      )}
      <div className="p-5 flex items-center gap-4">
        <div className="relative flex-shrink-0 w-[110px] h-[110px]">
          {isPast ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-600 text-3xl">✓</span>
            </div>
          ) : (
            <>
              <CountdownRing days={days} color={event.color} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl leading-none font-bold" style={{ color: event.color }}>
                  {isToday ? event.emoji : days}
                </span>
                {!isToday && <span className="text-[10px] text-white/40 mt-0.5">days</span>}
              </div>
            </>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg">{event.emoji}</span>
            <h3 className="text-white font-bold text-sm leading-tight">{event.name}</h3>
          </div>
          <p className="text-xl mb-1 font-arabic" style={{ color: event.color }}>{event.arabicName}</p>
          <p className="text-white/40 text-[11px] mb-1">{formatDate(event.gregorianDate)}</p>
          <p className="text-white/50 text-[11px] leading-snug mb-2">{event.description}</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: `${event.color}20`, color: event.color, border: `1px solid ${event.color}30` }}>
            {event.importance}
          </span>
        </div>
      </div>
      <div className="px-5 pb-3">
        <p className="text-[10px] text-white/25 border-t border-white/5 pt-2">🌙 {event.hijriDate}</p>
      </div>
    </div>
  );
}

// ==================== LIVE HERO ====================
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
    <div className="rounded-3xl p-6 mb-8 relative overflow-hidden border"
      style={{ background: event.bgGradient, borderColor: `${event.color}30` }}>
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div className="absolute -top-8 -right-8 text-[120px] opacity-5">{event.emoji}</div>
        <div className="absolute -bottom-4 -left-4 text-[80px] opacity-5">☽</div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
          style={{ background: `radial-gradient(circle, ${event.color}10 0%, transparent 70%)` }} />
      </div>
      <div className="relative z-10 text-center">
        <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: event.color }}>
          ✨ Next Islamic Event
        </p>
        <h2 className="text-white font-bold text-2xl mb-1">{event.name}</h2>
        <p className="text-3xl mb-1 font-arabic" style={{ color: event.color }}>{event.arabicName}</p>
        <p className="text-white/40 text-xs mb-5">{formatDate(event.gregorianDate)} · {event.hijriDate}</p>
        <div className="flex justify-center gap-3 mb-4">
          {[
            { val: t.days, label: 'Days' },
            { val: t.hours, label: 'Hours' },
            { val: t.minutes, label: 'Mins' },
            { val: t.seconds, label: 'Secs' },
          ].map(({ val, label }) => (
            <div key={label} className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold"
                style={{ background: `${event.color}20`, color: event.color, border: `1px solid ${event.color}30` }}>
                {String(val).padStart(2, '0')}
              </div>
              <span className="text-[10px] text-white/30 mt-1">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-white/50 text-xs">{event.description}</p>
      </div>
    </div>
  );
}

// ==================== PAGE ====================
export default function IslamicEventsPage() {
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const { upcomingEvents, pastEvents } = useMemo(() => ({
    upcomingEvents: resolveUpcomingEvents(),
    pastEvents: resolvePastEvents(),
  }), []);

  const nextEvent = upcomingEvents[0] || null;
  const displayEvents = filter === 'upcoming' ? upcomingEvents : pastEvents;

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070a0a' }}>
        <div className="text-emerald-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#070a0a' }}>
      <header style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #0d5238 100%)' }}>
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="text-white/50 hover:text-white/80 text-xs transition flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/10">
              ← Back
            </Link>
            <span className="text-white/30 text-xs">🌙 Islamic Calendar</span>
          </div>
          <div className="text-center">
            <p className="text-4xl mb-2">🕌</p>
            <h1 className="text-white font-bold text-2xl mb-1">Islamic Events & Countdowns</h1>
            <p className="text-white/40 text-sm">Ramadan · Eid · Ashura · Mawlid · and more</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {nextEvent && <NextEventHero event={nextEvent} />}

        <div className="flex gap-2 mb-5">
          {(['upcoming', 'past'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all capitalize"
              style={filter === f
                ? { background: '#0a3d2e', color: '#4ade80', border: '1px solid #2d6a4f' }
                : { background: '#111', color: '#555', border: '1px solid #222' }}>
              {f === 'upcoming' ? `Upcoming (${upcomingEvents.length})` : `Past (${pastEvents.length})`}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {displayEvents.map(event => (
            <EventCard key={event.key} event={event} isPast={filter === 'past'} />
          ))}
        </div>

        <div className="mt-8 p-4 rounded-2xl border border-white/5 bg-white/5 text-center">
          <p className="text-white/30 text-xs leading-relaxed">
            ⚠️ Dates are calculated algorithmically and may vary ±1 day depending on moon sighting in your region. Always confirm with your local mosque.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-emerald-500 hover:text-emerald-400 text-xs transition">
            ← Back to all Islamic tools
          </Link>
        </div>
      </main>
    </div>
  );
}