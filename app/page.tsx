'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLang, LANGUAGES } from '@/lib/lang-context';

// ── Tool definitions (keys match translation keys) ─────────────────────────
const toolDefs = [
  {
    categoryKey: 'mostUsed',
    emoji: '⭐',
    items: [
      { key: 'zakat',    icon: '💰', href: '/zakat',    color: 'bg-emerald-50 text-emerald-700' },
      { key: 'prayer',   icon: '🕐', href: '/prayer-times', color: 'bg-blue-50 text-blue-700' },
      { key: 'qibla',    icon: '🧭', href: '/qibla',   color: 'bg-amber-50 text-amber-700' },
      { key: 'hijri',    icon: '🌙', href: '/hijri',   color: 'bg-purple-50 text-purple-700' },
      { key: 'quran',    icon: '📖', href: '/quran',   color: 'bg-green-50 text-green-700' },
      { key: 'dhikr',    icon: '📿', href: '/dhikr',   color: 'bg-teal-50 text-teal-700' },
    ],
  },
  {
    categoryKey: 'dailyPractice',
    emoji: '🤲',
    items: [
      { key: 'dua',      icon: '🤲', href: '/dua',     color: 'bg-amber-50 text-amber-700' },
      { key: 'names',    icon: '⭐', href: '/names',   color: 'bg-rose-50 text-rose-700' },
      { key: 'ramadan',  icon: '🌙', href: '/ramadan', color: 'bg-indigo-50 text-indigo-700' },
      { key: 'hadith',   icon: '🔍', href: '/hadith',  color: 'bg-cyan-50 text-cyan-700' },
    ],
  },
  {
    categoryKey: 'finance',
    emoji: '💝',
    items: [
      { key: 'sadaqah',      icon: '❤️',  href: '/sadaqah',      color: 'bg-pink-50 text-pink-700' },
      { key: 'will',         icon: '📜',  href: '/will',         color: 'bg-stone-50 text-stone-700' },
      { key: 'inheritance',  icon: '⚖️',  href: '/inheritance',  color: 'bg-orange-50 text-orange-700' },
      { key: 'halalFinance', icon: '✅',  href: '/halal-finance', color: 'bg-lime-50 text-lime-700' },
      { key: 'kaffarah',     icon: '📋',  href: '/kaffarah',     color: 'bg-yellow-50 text-yellow-700' },
    ],
  },
  {
    categoryKey: 'travel',
    emoji: '📚',
    items: [
      { key: 'travel',      icon: '🌍', href: '/travel',       color: 'bg-blue-50 text-blue-700' },
      { key: 'hajj',        icon: '🕋', href: '/hajj',         color: 'bg-stone-50 text-stone-700' },
      { key: 'mosque',      icon: '🕌', href: '/mosque',       color: 'bg-emerald-50 text-emerald-700' },
      { key: 'namesFinder', icon: '✏️', href: '/names-finder', color: 'bg-violet-50 text-violet-700' },
    ],
  },
];

const SCROLL_KEY = 'iloveislam_scroll';

// ── Language Switcher ──────────────────────────────────────────────────────
function LangSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === lang)!;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '5px 12px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        {current.flag} {current.nativeLabel} <span style={{ opacity: 0.6 }}>▾</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', overflow: 'hidden', zIndex: 100, minWidth: 140 }}>
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }}
              style={{ width: '100%', padding: '10px 16px', border: 'none', background: lang === l.code ? '#f0f9f4' : '#fff', color: lang === l.code ? '#0a3d2e' : '#333', fontSize: 13, fontWeight: lang === l.code ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
              {l.flag} {l.nativeLabel}
              {lang === l.code && <span style={{ marginLeft: 'auto', color: '#0a3d2e' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Live Bar ───────────────────────────────────────────────────────────────
function LiveBar() {
  const [time, setTime] = useState('');
  const [hijri, setHijri] = useState('');
  const { lang } = useLang();

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchHijri = async () => {
      try {
        const today = new Date();
        const d = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        const res = await fetch(`https://api.aladhan.com/v1/gToH/${d}`);
        const data = await res.json();
        if (data.code === 200) {
          const h = data.data.hijri;
          const monthName = lang === 'ar' ? h.month.ar : h.month.en;
          setHijri(`${h.day} ${monthName} ${h.year} AH`);
        }
      } catch {}
    };
    fetchHijri();
  }, [lang]);

  return (
    <div className="flex items-center justify-center gap-4 flex-wrap text-white/50 text-xs mb-6">
      {time && <span className="flex items-center gap-1">🕐 {time}</span>}
      {hijri && <span className="flex items-center gap-1">🌙 {hijri}</span>}
      <span className="flex items-center gap-1">🌍 1.8 Billion Muslims Worldwide</span>
    </div>
  );
}

// ── Home Page ──────────────────────────────────────────────────────────────
export default function Home() {
  const [search, setSearch] = useState('');
  const { t, lang } = useLang();

  useEffect(() => {
    const handleScroll = () => sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString());
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) setTimeout(() => window.scrollTo({ top: parseInt(saved), behavior: 'instant' }), 50);
  }, []);

  const filteredSections = useMemo(() => {
    return toolDefs
      .map(section => ({
        ...section,
        label: t.cats[section.categoryKey as keyof typeof t.cats],
        items: section.items.filter(item => {
          const tool = t.tools[item.key as keyof typeof t.tools];
          return !search.trim() || `${tool.name} ${tool.desc}`.toLowerCase().includes(search.toLowerCase());
        }),
      }))
      .filter(s => s.items.length > 0);
  }, [search, t]);

  const totalResults = filteredSections.reduce((a, s) => a + s.items.length, 0);

  return (
    <>
      <h1 className="sr-only">I Love Islam — Free Islamic Tools: Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Hijri Calendar and more</h1>

      <div className="min-h-screen" style={{ background: '#f7f6f2' }}>

        {/* HEADER */}
        <header style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #0d5238 50%, #0a3d2e 100%)' }}
          className="px-6 pt-10 pb-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute top-4 left-8 text-white/5 text-8xl">☽</div>
            <div className="absolute bottom-4 right-8 text-white/5 text-6xl">✦</div>
          </div>

          {/* Language switcher — top right */}
          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
            <LangSwitcher />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
              <span className="text-xs" style={{ color: '#c8a96e' }}>✦</span>
              <span className="text-white/70 text-xs tracking-widest uppercase">{t.badge}</span>
              <span className="text-xs" style={{ color: '#c8a96e' }}>✦</span>
            </div>

            <h2 className="font-arabic text-5xl md:text-6xl mb-2" style={{ color: '#c8a96e' }}>
              ♡ {t.siteName}
            </h2>
            <p className="text-white/60 text-sm mb-5">{t.tagline}</p>

            <LiveBar />

            <div className="max-w-lg mx-auto flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-5 py-3 shadow-lg backdrop-blur-sm focus-within:border-white/40 transition-all">
              <span className="text-white/40">🔍</span>
              <input
                type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.search}
                className="bg-transparent text-white placeholder-white/30 text-sm outline-none flex-1"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-white/40 hover:text-white transition-colors text-lg leading-none">✕</button>
              )}
            </div>

            {search && (
              <p className="text-white/40 text-xs mt-3">
                {t.found} <span className="text-white font-semibold">{totalResults}</span> {totalResults !== 1 ? t.results : t.result}
              </p>
            )}
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6">

          {/* MIZAN BANNER */}
          {!search && (
            <Link href="/mizan" className="block mb-8 group">
              <div className="relative rounded-3xl overflow-hidden border border-amber-200 hover:shadow-xl hover:shadow-amber-900/10 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #3d1f00 40%, #1a0a00 100%)' }}>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-3 right-6 text-amber-400/20 text-7xl">✦</div>
                  <div className="absolute bottom-3 left-6 text-amber-400/10 text-5xl">☽</div>
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
                  <div className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl border border-amber-400/30"
                    style={{ background: 'rgba(200,169,110,0.15)' }}>✦</div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full border border-amber-400/40 text-amber-400 tracking-widest uppercase">
                        {t.mizan.badge}
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{t.mizan.title}</h2>
                    <p className="text-sm md:text-base mb-1" style={{ color: '#c8a96e' }}>{t.mizan.desc}</p>
                    <p className="text-white/40 text-xs">{t.mizan.sub}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all group-hover:scale-105"
                      style={{ background: '#c8a96e', color: '#1a0a00' }}>
                      {t.mizan.cta} <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* NO RESULTS */}
          {filteredSections.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 p-14 text-center">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-gray-700 font-bold text-lg mb-2">{t.noResults} "{search}"</p>
              <p className="text-gray-400 text-sm">{t.trySearching}</p>
              <button onClick={() => setSearch('')} className="mt-5 px-5 py-2 rounded-xl text-white text-sm" style={{ background: '#0a3d2e' }}>
                {t.clearSearch}
              </button>
            </div>
          )}

          {/* TOOL SECTIONS */}
          {filteredSections.map(section => (
            <div key={section.categoryKey} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span>{section.emoji}</span>
                <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-400">{section.label}</h2>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className={`grid gap-3 ${section.categoryKey === 'mostUsed' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6' : 'grid-cols-2 md:grid-cols-4'}`}>
                {section.items.map(item => {
                  const tool = t.tools[item.key as keyof typeof t.tools];
                  return (
                    <Link key={item.key} href={item.href}
                      className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-200 group relative overflow-hidden active:scale-95 flex flex-col items-center text-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110 ${item.color}`}>
                        {item.icon}
                      </div>
                      <p className="text-xs font-bold text-gray-800 leading-tight mb-1">{tool.name}</p>
                      <p className="text-gray-400 leading-snug group-hover:text-gray-500 transition-colors" style={{ fontSize: '10px' }}>{tool.desc}</p>
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-emerald-400 text-xs font-bold">→</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* STATS */}
          {!search && (
            <>
              <div className="flex flex-wrap justify-center gap-2 mt-4 mb-6">
                {[
                  { icon: '🛠️', label: '20 Free Tools' },
                  { icon: '💚', label: '100% Free' },
                  { icon: '🔓', label: 'No Sign-up' },
                  { icon: '📱', label: 'Works on Mobile' },
                  { icon: '🌍', label: 'Works Worldwide' },
                  { icon: '⚡', label: 'Always Fast' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3 py-1.5 shadow-sm">
                    <span className="text-sm">{s.icon}</span>
                    <span className="text-xs text-gray-500 font-medium">{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-4">
                <h2 className="font-semibold text-gray-800 mb-3 text-sm">About I Love Islam Tools</h2>
                <p className="text-xs text-gray-400 leading-relaxed mb-2">
                  I Love Islam is a free collection of Islamic tools designed for Muslims worldwide. Whether you need to calculate your annual <strong className="text-gray-600">Zakat</strong>, find accurate <strong className="text-gray-600">Prayer Times</strong> for your city, locate the <strong className="text-gray-600">Qibla direction</strong>, or read the <strong className="text-gray-600">Quran</strong> with translation — everything is available in one place, completely free.
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Our tools include a <strong className="text-gray-600">Hijri Calendar converter</strong>, <strong className="text-gray-600">Dhikr counter</strong>, <strong className="text-gray-600">99 Names of Allah</strong>, <strong className="text-gray-600">Halal Travel guide</strong>, <strong className="text-gray-600">Mosque Finder</strong>, <strong className="text-gray-600">Islamic Inheritance Calculator</strong>, and our unique <strong className="text-gray-600">Mizan Islamic Life Blueprint</strong> — all built with love for the Ummah.
                </p>
              </div>
            </>
          )}
        </main>

        {/* FOOTER */}
        <footer className="mt-8 border-t border-gray-100 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="text-center mb-6">
              <p className="font-arabic text-emerald-800 text-2xl mb-1">{t.footer.bismillah}</p>
              <p className="text-xs text-gray-400">{t.footer.bismillahTranslation}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
              {[
                { label: 'Most Used', links: ['Zakat Calculator', 'Prayer Times', 'Qibla Finder', 'Quran Reader'] },
                { label: 'Daily Practice', links: ['Dhikr Counter', '99 Names of Allah', 'Dua Generator', 'Hadith Search'] },
                { label: 'Finance', links: ['Sadaqah Tracker', 'Inheritance Calculator', 'Halal Finance', 'Islamic Will'] },
                { label: 'Knowledge', links: ['Hajj Checklist', 'Mosque Finder', 'Halal Travel', 'Islamic Names'] },
              ].map(col => (
                <div key={col.label}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{col.label}</p>
                  {col.links.map(l => <p key={l} className="text-xs text-gray-400 mb-1">{l}</p>)}
                </div>
              ))}
            </div>

            {/* Footer nav links */}
            <div className="flex justify-center gap-6 mb-4">
              <Link href="/blog" className="text-xs text-emerald-700 hover:text-emerald-900 font-medium">{t.footer.blog}</Link>
              <Link href="/about" className="text-xs text-emerald-700 hover:text-emerald-900 font-medium">{t.footer.about}</Link>
              <Link href="/privacy" className="text-xs text-emerald-700 hover:text-emerald-900 font-medium">{t.footer.privacy}</Link>
            </div>

            <div className="border-t border-gray-100 pt-4 text-center">
              <p className="text-xs text-gray-300">{t.footer.copyright}</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
