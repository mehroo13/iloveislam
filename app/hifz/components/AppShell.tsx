// app/hifz/components/AppShell.tsx — the app shell for /hifz/* (spec §22,
// screenshot rebuild 2026-11-21).
//
// Bottom tabs (NOT top tabs — the screenshots + updated spec win over the
// earlier top-tab plan): Home | Mushaf | Memorize | Search | Progress.
// White bar, inline SVG icons, active tab green with a green underline.
// Plus: 4-step skippable onboarding (light screens in the reference
// style, our own wording — no copied logo, name or text; step 4 is Book
// Settings), theme application
// (light/dark/sepia), and the IndexedDB mirror migration (localStorage
// data is never lost).
'use client';

import { useEffect, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { migrateToIdb } from '../lib/store';
import { useSyncUiPrefs, useT } from '../lib/i18n';
import BookSettings from './BookSettings';

type IconProps = { className?: string };

function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function MushafIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function MemorizeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ProgressIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

const TABS: { href: string; labelKey: string; icon: ComponentType<IconProps>; match: (p: string) => boolean }[] = [
  // Home is the homepage `/` (the app's front page: Continue + surah list).
  // It also stays highlighted on reader pages that belong to no other tab
  // (surah / ayah / juz pages) — see the fallback in BottomTabs below.
  // The old /hifz hub is still one tap away from the homepage.
  { href: '/', labelKey: 'nav.home', icon: HomeIcon, match: (p) => p === '/' || p === '/hifz' },
  { href: '/hifz/mushaf', labelKey: 'nav.mushaf', icon: MushafIcon, match: (p) => p.startsWith('/hifz/mushaf') },
  { href: '/hifz/memorize', labelKey: 'nav.memorize', icon: MemorizeIcon, match: (p) => p.startsWith('/hifz/memorize') || p.startsWith('/hifz/test') || p.startsWith('/hifz/recite') },
  { href: '/hifz/search', labelKey: 'nav.search', icon: SearchIcon, match: (p) => p.startsWith('/hifz/search') || p.startsWith('/hifz/voice-search') },
  { href: '/hifz/my-progress', labelKey: 'nav.progress', icon: ProgressIcon, match: (p) => p.startsWith('/hifz/my-progress') || p.startsWith('/hifz/goals') || p.startsWith('/hifz/plans') || p.startsWith('/hifz/challenges') },
];

export function BottomTabs() {
  const pathname = usePathname() ?? '';
  const t = useT();
  // The tab whose match() fits this route, if any. Reader pages (surah,
  // ayah, juz) match no tab — they belong to Home, so Home stays lit there
  // instead of leaving the bar with nothing active. Non-app routes never
  // render these tabs at all (SiteChrome), so the fallback only fires
  // inside /hifz/*.
  const matched = TABS.find((tab) => tab.match(pathname));
  const activeHref = matched ? matched.href : pathname === '/' || pathname.startsWith('/hifz') ? '/' : null;
  // BottomTabs renders on `/` too (via SiteChrome in the root layout),
  // where the hifz layout — and ThemeApplier — never runs. So the tabs
  // themselves apply the saved theme + language on mount.
  useSyncUiPrefs();
  return (
    <nav
      aria-label={t('nav.sections')}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E8EAED] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around">
        {TABS.map((tab) => {
          const active = tab.href === activeHref;
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
                  active ? 'text-[#1FA36B]' : 'text-[#6B7280]'
                }`}
              >
                <Icon className="h-6 w-6" />
                {t(tab.labelKey)}
                {active && <span aria-hidden="true" className="h-1 w-8 rounded-full bg-[#57D798]" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Apply the saved theme (light/dark/sepia) + language (lang/dir) to
 *  <html>. The store (lib/i18n) is the live source: it reads
 *  `ili_hifz_settings_v1` after mount, applies it, and re-renders every
 *  subscriber when Settings changes it — no reload needed. */
export function ThemeApplier() {
  useSyncUiPrefs();
  useEffect(() => {
    // One-time migration of existing localStorage progress into IndexedDB.
    void migrateToIdb();
  }, []);
  return null;
}

const ONBOARD_KEY = 'ili_onboarded_v1';

/** Onboarding — 4 steps, skippable, never asks for email/password.
 * Light screens in the reference style (light grey background, white card, dark
 * text, green accents) in our own words and our own eight-point-star
 * mark — no copied logo, name or wording. Steps 1–3 introduce the
 * coach; step 4 is Book Settings (mushaf edition + tajweed colours),
 * whose Continue finishes onboarding. Shown once; "Skip" is always
 * visible. */
export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const t = useT();

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
      title: t('ob.s1.title'),
      body: t('ob.s1.body'),
      bubbles: [
        { text: 'قُلْ هُوَ اللَّهُ أَحَدٌ', kind: 'correct' },
        { text: 'اللَّهُ الصَّمَدُ', kind: 'correct' },
      ],
    },
    {
      title: t('ob.s2.title'),
      body: t('ob.s2.body'),
      bubbles: [
        { text: 'قُلْ هُوَ اللَّهُ أَحَدٌ', kind: 'correct' },
        { text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', kind: 'mistake' },
      ],
    },
    {
      title: t('ob.s3.title'),
      body: t('ob.s3.body'),
      bubbles: [{ text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', kind: 'correct' }],
    },
  ];
  const s = screens[Math.min(step, 2)];
  const isBookStep = step === 3;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('rb.shell.onboardingLabel')}
      className="fixed inset-0 z-[70] flex flex-col bg-[#F2F4F3] text-[#111827]"
    >
      <div className="flex items-center justify-between px-5 pt-5">
        <p className="text-sm font-bold tracking-wide">
          I LOVE ISLAM <span className="text-[#1FA36B]">· HIFZ</span>
        </p>
        <button
          type="button"
          onClick={done}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D8DEDB] bg-white px-4 py-1.5 text-sm font-semibold text-[#111827] hover:bg-[#E8EAED]"
        >
          {t('ob.skip')}
        </button>
      </div>
      {isBookStep ? (
        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4">
          <div className="mb-5 flex gap-2" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i === step ? 'bg-[#57D798]' : 'bg-[#D5DBD7]'}`} />
            ))}
          </div>
          <BookSettings onContinue={done} />
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col justify-center px-6">
            <div className="space-y-3">
              {s.bubbles.map((b, i) => (
                <p
                  key={i}
                  dir="rtl"
                  lang="ar"
                  className={`font-quran w-fit max-w-full rounded-2xl px-5 py-3 text-2xl leading-relaxed ${
                    b.kind === 'mistake'
                      ? 'bg-[#DC2626] text-white'
                      : 'border border-[#E8EAED] bg-white text-[#111827] shadow-sm'
                  }`}
                >
                  {b.text}
                </p>
              ))}
            </div>
            <h2 className="mt-8 text-3xl font-bold leading-tight text-[#111827]">{s.title}</h2>
            <p className="mt-3 max-w-md text-base leading-relaxed text-[#43564D]">{s.body}</p>
          </div>
          <div className="px-6 pb-8">
            <div className="mb-4 flex gap-2" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i === step ? 'bg-[#57D798]' : 'bg-[#D5DBD7]'}`} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="w-full rounded-full bg-[#57D798] py-3.5 text-base font-bold text-[#102E26] hover:brightness-105"
            >
              {t('ob.next')}
            </button>
            <p className="mt-3 text-center text-xs text-[#6B7280]">
              {t('ob.freeNote')}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
