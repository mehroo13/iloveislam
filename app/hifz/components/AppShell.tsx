// app/hifz/components/AppShell.tsx — the app shell for /hifz/* (spec §22,
// screenshot rebuild 2026-11-21).
//
// Bottom tabs (NOT top tabs — the screenshots + updated spec win over the
// earlier top-tab plan): Home | Mushaf | Memorize | Search | Progress.
// Plus: 3-screen skippable onboarding (dark green, our own wording — no
// Tarteel copy), theme application (light/dark/sepia), and the IndexedDB
// mirror migration (localStorage data is never lost).
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { migrateToIdb } from '../lib/store';

const TABS: { href: string; label: string; icon: string; match: (p: string) => boolean }[] = [
  { href: '/hifz', label: 'Home', icon: '⌂', match: (p) => p === '/hifz' },
  { href: '/hifz/mushaf/1', label: 'Mushaf', icon: '▤', match: (p) => p.startsWith('/hifz/mushaf') },
  { href: '/hifz/memorize', label: 'Memorize', icon: '◐', match: (p) => p.startsWith('/hifz/memorize') || p.startsWith('/hifz/test') || p.startsWith('/hifz/recite') },
  { href: '/hifz/search', label: 'Search', icon: '⌕', match: (p) => p.startsWith('/hifz/search') || p.startsWith('/hifz/voice-search') },
  { href: '/hifz/my-progress', label: 'Progress', icon: '▦', match: (p) => p.startsWith('/hifz/my-progress') || p.startsWith('/hifz/goals') || p.startsWith('/hifz/plans') || p.startsWith('/hifz/challenges') },
];

export function BottomTabs() {
  const pathname = usePathname() ?? '';
  return (
    <nav
      aria-label="Hifz sections"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E5E7EB] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around">
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
                  active ? 'text-[#1FA36B]' : 'text-[#5b6b62]'
                }`}
              >
                <span aria-hidden="true" className={`text-xl leading-none ${active ? 'text-[#57D798]' : ''}`}>
                  {t.icon}
                </span>
                {t.label}
                {active && <span aria-hidden="true" className="h-1 w-8 rounded-full bg-[#57D798]" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Apply the saved theme (light/dark/sepia) to <html data-theme>. */
export function ThemeApplier() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ili_hifz_settings_v1');
      const parsed = raw ? (JSON.parse(raw) as { theme?: string; language?: string }) : null;
      const theme = parsed?.theme;
      if (theme === 'dark' || theme === 'sepia') {
        document.documentElement.setAttribute('data-theme', theme);
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      // Full RTL for Arabic + Urdu (Settings → Language).
      const lang = parsed?.language;
      if (lang === 'ar' || lang === 'ur') {
        document.documentElement.dir = 'rtl';
      } else if (lang) {
        document.documentElement.dir = 'ltr';
      }
      if (lang) document.documentElement.lang = lang;
    } catch {
      /* default light */
    }
    // One-time migration of existing localStorage progress into IndexedDB.
    void migrateToIdb();
  }, []);
  return null;
}

const ONBOARD_KEY = 'ili_onboarded_v1';

/** Onboarding — max 3 screens, skippable, never asks for email/password.
 * Dark-green screens in the style of the reference (our own words and our
 * own eight-point-star mark — no copied logo, name or wording). Shown once;
 * "Skip" is always visible. */
export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARD_KEY)) setVisible(true);
    } catch {
      /* storage unavailable — don't block the app */
    }
  }, []);

  const done = () => {
    try {
      localStorage.setItem(ONBOARD_KEY, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  const screens = [
    {
      title: 'Recite. Get checked, word by word.',
      body: 'Recite aloud and the checker follows your voice — it highlights each word as you say it, on this device. Your audio never leaves your device unless you choose to share it.',
      bubbles: [
        { text: 'قُلْ هُوَ اللَّهُ أَحَدٌ', kind: 'correct' },
        { text: 'اللَّهُ الصَّمَدُ', kind: 'correct' },
      ],
    },
    {
      title: 'Mistakes, spotted straight away.',
      body: 'Incorrect words, extra words and missed words are highlighted as you recite — correct words in green, mistakes in red, skipped words in orange. Tap any mistake to see the right word.',
      bubbles: [
        { text: 'قُلْ هُوَ اللَّهُ أَحَدٌ', kind: 'correct' },
        { text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', kind: 'mistake' },
      ],
    },
    {
      title: 'Hide it. Recite it. Own it.',
      body: 'Hide the verses and recite from memory — words reveal as you get them right. Test yourself, track your streak, and revise what needs work. Free, no account, no sign-up.',
      bubbles: [{ text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', kind: 'correct' }],
    },
  ];
  const s = screens[step];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to I Love Islam Hifz"
      className="fixed inset-0 z-[70] flex flex-col bg-[#102E26] text-white"
    >
      <div className="flex items-center justify-between px-5 pt-5">
        <p className="text-sm font-bold tracking-wide">
          I LOVE ISLAM <span className="text-[#57D798]">· HIFZ</span>
        </p>
        <button
          type="button"
          onClick={done}
          className="rounded-full border border-white/40 px-4 py-1.5 text-sm font-semibold hover:bg-white/10"
        >
          Skip
        </button>
      </div>
      <div className="flex flex-1 flex-col justify-center px-6">
        <div className="space-y-3">
          {s.bubbles.map((b, i) => (
            <p
              key={i}
              dir="rtl"
              lang="ar"
              className={`font-quran w-fit max-w-full rounded-2xl px-5 py-3 text-2xl leading-relaxed ${
                b.kind === 'mistake' ? 'bg-[#DC2626] text-white' : 'bg-white text-[#102E26]'
              }`}
            >
              {b.text}
            </p>
          ))}
        </div>
        <h2 className="mt-8 text-3xl font-bold leading-tight">{s.title}</h2>
        <p className="mt-3 max-w-md text-base leading-relaxed text-white/80">{s.body}</p>
      </div>
      <div className="px-6 pb-8">
        <div className="mb-4 flex gap-2" aria-hidden="true">
          {screens.map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i === step ? 'bg-[#57D798]' : 'bg-white/25'}`} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => (step < 2 ? setStep(step + 1) : done())}
          className="w-full rounded-full bg-[#57D798] py-3.5 text-base font-bold text-[#102E26] hover:brightness-105"
        >
          {step < 2 ? 'Next →' : 'Get started →'}
        </button>
        <p className="mt-3 text-center text-xs text-white/60">
          Free forever · No account · Your data stays on this device
        </p>
      </div>
    </div>
  );
}
