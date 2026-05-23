"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { TOOLS_DATA } from '../lib/toolsData';

// NOTE: This file contains the client-only interactive homepage components.

const GA_MEASUREMENT_ID = 'G-4BDTXNC58M';

const TRANSLATIONS: Record<string, any> = {
  en: {
    tagline: 'The complete toolkit for every Muslim',
    search: 'Search tools — zakat, qibla, quran...',
    found: 'Found', results: 'result',
    noTools: 'No tools found', noToolsSub: 'Try: zakat, prayer, quran, qibla...',
    clear: 'Clear Search',
    about: 'About', blog: 'Blog', privacy: 'Privacy', contact: 'Contact', faq: 'FAQ', terms: 'Terms',
    mostUsed: 'Most Used', daily: 'Daily Practice', finance: 'Finance & Giving', travel: 'Travel & Knowledge', kids: '🧒 Kids Corner',
    footerMade: 'Made with ❤️ for the Ummah', footerFree: 'Always Free · No Sign-up',
    stats: { tools: '26 Free Tools', free: '100% Free', noSignup: 'No Sign-up', mobile: 'Works on Mobile', world: 'Works Worldwide', fast: 'Always Fast' },
    aboutTitle: 'About I Love Islam Tools',
    aboutText1: 'I Love Islam is a free collection of Islamic tools for Muslims worldwide — Zakat Calculator, Prayer Times, Qibla Finder, Quran Reader, Hijri Calendar, Kaffarah Calculator, HalalScan and much more. Everything in one place, completely free.',
    aboutText2: 'Our tools include Dhikr counter, 99 Names of Allah, Halal Travel guide, Mosque Finder, Islamic Inheritance Calculator, Sadaqah Tracker, Eid ul Adha toolkit, Islamic Alarm, Night Recitation player, and our unique Mizan Islamic Life Blueprint.',
    newsletterTitle: 'Weekly Islamic Guidance',
    newsletterSubtitle: 'Spiritual reminders and tool updates.',
    newsletterPlaceholder: 'Your email',
    newsletterButton: 'Subscribe',
  }
};

const LANGUAGES = [ { code: 'en', label: 'English', flag: '🇬🇧' } ];
const RTL_LANGS: string[] = [];

// Copy the essential data for tools/featured (trimmed for brevity)
const ALL_FEATURED_TOOLS = [
  { href: '/mizan', badge: '✨ Featured', title: 'Mizan — Islamic Life Blueprint', desc: 'Discover your purpose', icon: '✦', gradient: 'linear-gradient(135deg, #1a0a00, #3d1f00)', accent: '#c8a96e' },
  { href: '/halal-scanner', badge: '🆕 New Tool', title: 'HalalScan — Halal Food Scanner', desc: 'Scan barcodes & photos to check Halal', icon: '📷', gradient: 'linear-gradient(135deg, #071a0d, #0a3d1a)', accent: '#4ade80' },
];

// client-only interactive widgets use shared data when needed

const THEME_KEY = 'iloveislam_theme';
const LANG_KEY = 'iloveislam_lang';
const TOOL_CLICKS_KEY = 'iloveislam_tool_clicks';

function useDarkMode() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);
  const toggle = useCallback(() => {
    setDark(prev => { const next = !prev; document.documentElement.classList.toggle('dark', next); localStorage.setItem(THEME_KEY, next ? 'dark' : 'light'); return next; });
  }, []);
  return { dark, toggle, mounted };
}

function trackToolClick(toolName: string) {
  try {
    const clicks = JSON.parse(localStorage.getItem(TOOL_CLICKS_KEY) || '{}');
    clicks[toolName] = (clicks[toolName] || 0) + 1;
    localStorage.setItem(TOOL_CLICKS_KEY, JSON.stringify(clicks));
    if ((window as any).gtag) {
      (window as any).gtag('event', 'tool_click', { event_category: 'engagement', event_label: toolName, value: clicks[toolName] });
    }
  } catch {}
}

function ScrollManager() { return { save: () => { try { const key = 'scroll_' + window.location.pathname; sessionStorage.setItem(key, String(Math.round(window.scrollY))); } catch {} } }; }

function LiveBar() {
  const [time, setTime] = useState('');
  useEffect(() => { const tick = () => { const now = new Date(); setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); }; tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer); }, []);
  return (<div className="flex items-center justify-center gap-3 flex-wrap text-white/45 text-xs mb-4"><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />{time}</span></div>);
}

function ToolCard({ tool }: { tool: any }) {
  const handleClick = () => { trackToolClick(tool.name); try { const key = 'scroll_' + window.location.pathname; sessionStorage.setItem(key, String(Math.round(window.scrollY))); } catch {} };
  return (
    <Link href={tool.href} onClick={handleClick} className="group bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center text-center active:scale-95">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2 transition-transform duration-200 group-hover:scale-110 ${tool.color}`}>{tool.icon}</div>
      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight mb-0.5">{tool.name}</p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{tool.desc}</p>
    </Link>
  );
}

export default function HomeInteractive() {
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState('en');
  const [mounted, setMounted] = useState(false);
  const { dark, toggle: toggleDark, mounted: darkMounted } = useDarkMode();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); const savedLang = localStorage.getItem(LANG_KEY); if (savedLang && TRANSLATIONS[savedLang]) setLang(savedLang); }, []);

  if (!mounted || !darkMounted) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <button onClick={toggleDark} aria-label="Toggle theme" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">{dark ? '☀️' : '🌙'}</button>
      <div className="relative">
        <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder={TRANSLATIONS.en.search} className="px-3 py-2 rounded-xl border bg-white/5 text-sm" aria-label="Search tools" />
      </div>
    </div>
  );
}
