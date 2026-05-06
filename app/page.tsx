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

export default function Home() {
  const [search, setSearch] = useState('');

  // Save scroll position while scrolling
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position when coming back
  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      setTimeout(() => window.scrollTo({ top: parseInt(saved), behavior: 'instant' }), 50);
    }
  }, []);

  const filteredTools = useMemo(() => {
    if (!search.trim()) return tools;
    return tools
      .map((section) => ({
        ...section,
        items: section.items.filter((tool) =>
          `${tool.name} ${tool.desc}`.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [search]);

  const totalResults = filteredTools.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <div className="min-h-screen" style={{ background: '#f7f6f2' }}>

      {/* Header */}
      <header style={{ background: '#0a3d2e' }} className="px-6 py-10 text-center relative overflow-hidden">
        {/* Big decorative crescent */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
          <span className="text-white font-arabic" style={{ fontSize: '300px' }}>☽</span>
        </div>

        <h1 className="font-arabic text-5xl mb-2 relative z-10" style={{ color: '#c8a96e' }}>
          ♡ I Love Islam
        </h1>
        <p className="text-white/50 text-xs tracking-widest uppercase mb-6 relative z-10">
          Free Islamic Tools for Everyone
        </p>

        {/* Search */}
        <div className="max-w-md mx-auto relative z-10 flex items-center gap-3 bg-white/10 border border-white/20 rounded-full px-5 py-3 shadow-lg backdrop-blur-sm focus-within:border-white/40 transition-all">
          <span className="text-white/40">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            className="bg-transparent text-white placeholder-white/30 text-sm outline-none flex-1"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-white/40 hover:text-white transition-colors text-lg leading-none">
              ✕
            </button>
          )}
        </div>

        {search && (
          <p className="text-white/40 text-xs mt-3 relative z-10">
            Found <span className="text-white font-semibold">{totalResults}</span> result{totalResults !== 1 ? 's' : ''}
          </p>
        )}
      </header>

      {/* Tools */}
      <main className="max-w-5xl mx-auto px-5 py-8">

        {/* No results */}
        {filteredTools.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-14 text-center">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-gray-700 font-bold text-lg mb-2">No tools found</p>
            <p className="text-gray-400 text-sm">Try searching with different keywords</p>
            <button onClick={() => setSearch('')}
              className="mt-5 px-5 py-2 rounded-xl text-white text-sm transition-colors"
              style={{ background: '#0a3d2e' }}>
              Clear Search
            </button>
          </div>
        )}

        {filteredTools.map((section) => (
          <div key={section.category} className="mb-10">

            {/* Section title */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-base">{section.emoji}</span>
              <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">
                {section.category}
              </h2>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Grid — 3 cols on mobile, 4 on tablet, 6 on desktop for Most Used */}
            <div className={`grid gap-3 ${
              section.category === 'Most Used'
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6'
                : 'grid-cols-2 md:grid-cols-4'
            }`}>
              {section.items.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-200 group relative overflow-hidden active:scale-95 flex flex-col items-center text-center"
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110 ${tool.color}`}>
                    {tool.icon}
                  </div>

                  {/* Name */}
                  <p className="text-xs font-bold text-gray-800 leading-tight mb-1">
                    {tool.name}
                  </p>

                  {/* Desc */}
                  <p className="text-gray-400 leading-snug group-hover:text-gray-500 transition-colors" style={{ fontSize: '10px' }}>
                    {tool.desc}
                  </p>

                  {/* Hover arrow */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-emerald-400 text-xs font-bold">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Stats pills */}
        {!search && (
          <div className="flex flex-wrap justify-center gap-2 mt-2 mb-4">
            {[
              { icon: '🛠️', label: '19 Tools' },
              { icon: '💚', label: '100% Free' },
              { icon: '🔓', label: 'No Sign-up' },
              { icon: '📱', label: 'Works on Mobile' },
              { icon: '🌍', label: 'Works Worldwide' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3 py-1.5 shadow-sm">
                <span className="text-sm">{s.icon}</span>
                <span className="text-xs text-gray-500 font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-gray-100 bg-white mt-4">
        <p className="font-arabic text-emerald-800 text-xl mb-1">بسم الله الرحمن الرحيم</p>
        <p className="text-xs tracking-widest uppercase text-gray-300">Made with ❤️ for the Ummah · Always Free</p>
      </footer>
    </div>
  );
}