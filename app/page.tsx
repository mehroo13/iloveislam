'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const tools = [
  {
    category: 'Most Used',
    emoji: '⭐',
    items: [
      { name: 'Zakat Calculator', desc: 'Calculate your annual zakat', icon: '💰', href: '/zakat', color: 'bg-emerald-50 text-emerald-700' },
      { name: 'Prayer Times', desc: 'Daily salah times by location', icon: '🕐', href: '/prayer-times', color: 'bg-blue-50 text-blue-700' },
      { name: 'Qibla Finder', desc: 'Find the direction of Mecca', icon: '🧭', href: '/qibla', color: 'bg-amber-50 text-amber-700' },
      { name: 'Hijri Calendar', desc: 'Convert Islamic & Gregorian dates', icon: '🌙', href: '/hijri', color: 'bg-purple-50 text-purple-700' },
      { name: 'Quran Reader', desc: 'Read with translation & mushaf', icon: '📖', href: '/quran', color: 'bg-green-50 text-green-700' },
      { name: 'Dhikr Counter', desc: 'Digital tasbih with presets', icon: '📿', href: '/dhikr', color: 'bg-teal-50 text-teal-700' },
    ],
  },
  {
    category: 'Daily Practice',
    emoji: '🤲',
    items: [
      { name: 'Dua Generator', desc: 'Find prayers for every moment', icon: '🤲', href: '/dua', color: 'bg-amber-50 text-amber-700' },
      { name: '99 Names of Allah', desc: 'Asma ul Husna with meanings', icon: '⭐', href: '/names', color: 'bg-rose-50 text-rose-700' },
      { name: 'Ramadan Planner', desc: 'Suhoor, iftar & ibadah tracker', icon: '🌙', href: '/ramadan', color: 'bg-indigo-50 text-indigo-700' },
      { name: 'Hadith Search', desc: 'Search across hadith books', icon: '🔍', href: '/hadith', color: 'bg-cyan-50 text-cyan-700' },
    ],
  },
  {
    category: 'Finance & Giving',
    emoji: '💝',
    items: [
      { name: 'Sadaqah Tracker', desc: 'Log your voluntary charity', icon: '❤️', href: '/sadaqah', color: 'bg-pink-50 text-pink-700' },
      { name: 'Islamic Will', desc: 'Draft your Wasiyyah easily', icon: '📜', href: '/will', color: 'bg-stone-50 text-stone-700' },
      { name: 'Inheritance Calculator', desc: 'Islamic inheritance shares', icon: '⚖️', href: '/inheritance', color: 'bg-orange-50 text-orange-700' },
      { name: 'Halal Finance Check', desc: 'Check if a deal is riba-free', icon: '✅', href: '/halal-finance', color: 'bg-lime-50 text-lime-700' },
      { name: 'Kaffarah Calculator', desc: 'Expiation for broken oaths', icon: '📋', href: '/kaffarah', color: 'bg-yellow-50 text-yellow-700' },
    ],
  },
  {
    category: 'Travel & Knowledge',
    emoji: '📚',
    items: [
      { name: 'Halal Travel', desc: 'Plan your journey with ease', icon: '🌍', href: '/travel', color: 'bg-blue-50 text-blue-700' },
      { name: 'Hajj Checklist', desc: 'Step-by-step pilgrimage guide', icon: '🕋', href: '/hajj', color: 'bg-stone-50 text-stone-700' },
      { name: 'Mosque Finder', desc: 'Nearest masjid by GPS', icon: '🕌', href: '/mosque', color: 'bg-emerald-50 text-emerald-700' },
      { name: 'Islamic Name Finder', desc: 'Meanings of Arabic names', icon: '✏️', href: '/names-finder', color: 'bg-violet-50 text-violet-700' },
    ],
  },
];

const SCROLL_KEY = 'iloveislam_scroll';

function LiveBar() {
  const [time, setTime] = useState('');
  const [hijri, setHijri] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
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
          setHijri(`${h.day} ${h.month.en} ${h.year} AH`);
        }
      } catch {}
    };
    fetchHijri();
  }, []);

  return (
    <div className="flex items-center justify-center gap-4 flex-wrap text-white/50 text-xs mb-6">
      {time && (
        <span className="flex items-center gap-1">
          <span>🕐</span> {time}
        </span>
      )}
      {hijri && (
        <span className="flex items-center gap-1">
          <span>🌙</span> {hijri}
        </span>
      )}
      <span className="flex items-center gap-1">
        <span>🌍</span> 1.8 Billion Muslims Worldwide
      </span>
    </div>
  );
}

export default function Home() {
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleScroll = () => sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString());
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) setTimeout(() => window.scrollTo({ top: parseInt(saved), behavior: 'instant' }), 50);
  }, []);

  const filteredTools = useMemo(() => {
    if (!search.trim()) return tools;
    return tools
      .map((s) => ({
        ...s,
        items: s.items.filter((t) =>
          `${t.name} ${t.desc}`.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [search]);

  const totalResults = filteredTools.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <>
      {/* SEO hidden h1 for Google */}
      <h1 className="sr-only">
        I Love Islam — Free Islamic Tools: Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Hijri Calendar and more
      </h1>

      <div className="min-h-screen" style={{ background: '#f7f6f2' }}>

        {/* ── HERO HEADER ── */}
        <header style={{ background: 'linear-gradient(135deg, #0a3d2e 0%, #0d5238 50%, #0a3d2e 100%)' }}
          className="px-6 pt-10 pb-8 text-center relative overflow-hidden">

          {/* Animated geometric background */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute top-4 left-8 text-white/5 text-8xl font-arabic">☽</div>
            <div className="absolute bottom-4 right-8 text-white/5 text-6xl font-arabic">✦</div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/3 text-9xl font-arabic">☽</div>
          </div>

          {/* Brand */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
              <span className="text-xs" style={{ color: '#c8a96e' }}>✦</span>
              <span className="text-white/70 text-xs tracking-widest uppercase">Free · No Sign-up · Always Available</span>
              <span className="text-xs" style={{ color: '#c8a96e' }}>✦</span>
            </div>

            <h2 className="font-arabic text-5xl md:text-6xl mb-2" style={{ color: '#c8a96e' }}>
              ♡ I Love Islam
            </h2>
            <p className="text-white/60 text-sm mb-5">
              The complete toolkit for every Muslim — 20 free tools in one place
            </p>

            {/* Live bar */}
            <LiveBar />

            {/* Search */}
            <div className="max-w-lg mx-auto flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-5 py-3 shadow-lg backdrop-blur-sm focus-within:border-white/40 focus-within:bg-white/15 transition-all">
              <span className="text-white/40">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tools — zakat, qibla, quran..."
                className="bg-transparent text-white placeholder-white/30 text-sm outline-none flex-1"
                aria-label="Search Islamic tools"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-white/40 hover:text-white transition-colors text-lg leading-none" aria-label="Clear search">✕</button>
              )}
            </div>

            {search && (
              <p className="text-white/40 text-xs mt-3">
                Found <span className="text-white font-semibold">{totalResults}</span> result{totalResults !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6">

          {/* ── MIZAN FEATURED HERO BANNER ── */}
          {!search && (
            <Link href="/mizan" className="block mb-8 group">
              <div className="relative rounded-3xl overflow-hidden border border-amber-200 hover:shadow-xl hover:shadow-amber-900/10 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #3d1f00 40%, #1a0a00 100%)' }}>

                {/* Decorative elements */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-3 right-6 text-amber-400/20 text-7xl">✦</div>
                  <div className="absolute bottom-3 left-6 text-amber-400/10 text-5xl font-arabic">☽</div>
                  <div className="absolute top-1/2 right-1/4 text-amber-400/10 text-4xl">◈</div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl border border-amber-400/30"
                    style={{ background: 'rgba(200,169,110,0.15)' }}>
                    ✦
                  </div>

                  {/* Text */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full border border-amber-400/40 text-amber-400 tracking-widest uppercase">
                        ✨ New Featured Tool
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                      Mizan — Your Islamic Life Blueprint
                    </h2>
                    <p className="text-sm md:text-base mb-1" style={{ color: '#c8a96e' }}>
                      Discover your personality, life purpose & spiritual path through Islamic numerology
                    </p>
                    <p className="text-white/40 text-xs">
                      Based on Abjad numerology · 99 Names of Allah · Quranic guidance · Your birth date
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all group-hover:scale-105"
                      style={{ background: '#c8a96e', color: '#1a0a00' }}>
                      Discover Yours
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* ── NO RESULTS ── */}
          {filteredTools.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 p-14 text-center">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-gray-700 font-bold text-lg mb-2">No tools found for "{search}"</p>
              <p className="text-gray-400 text-sm">Try searching: zakat, prayer, quran, qibla...</p>
              <button onClick={() => setSearch('')}
                className="mt-5 px-5 py-2 rounded-xl text-white text-sm"
                style={{ background: '#0a3d2e' }}>
                Clear Search
              </button>
            </div>
          )}

          {/* ── TOOL SECTIONS ── */}
          {filteredTools.map((section) => (
            <div key={section.category} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span>{section.emoji}</span>
                <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-400">
                  {section.category}
                </h2>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className={`grid gap-3 ${
                section.category === 'Most Used'
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6'
                  : 'grid-cols-2 md:grid-cols-4'
              }`}>
                {section.items.map((tool) => (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    aria-label={`${tool.name} — ${tool.desc}`}
                    className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-200 group relative overflow-hidden active:scale-95 flex flex-col items-center text-center"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110 ${tool.color}`}>
                      {tool.icon}
                    </div>
                    <p className="text-xs font-bold text-gray-800 leading-tight mb-1">{tool.name}</p>
                    <p className="text-gray-400 leading-snug group-hover:text-gray-500 transition-colors" style={{ fontSize: '10px' }}>
                      {tool.desc}
                    </p>
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-emerald-400 text-xs font-bold">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* ── STATS ── */}
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

              {/* SEO text block — helps Google understand the site */}
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

        {/* ── FOOTER ── */}
        <footer className="mt-8 border-t border-gray-100 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="text-center mb-6">
              <p className="font-arabic text-emerald-800 text-2xl mb-1">بسم الله الرحمن الرحيم</p>
              <p className="text-xs text-gray-400">In the name of Allah, the Most Gracious, the Most Merciful</p>
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
                  {col.links.map(l => (
                    <p key={l} className="text-xs text-gray-400 mb-1">{l}</p>
                  ))}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 text-center">
              <p className="text-xs text-gray-300">© 2025 iloveislam.life · Made with ❤️ for the Ummah · Always Free · No Ads · No Sign-up</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
