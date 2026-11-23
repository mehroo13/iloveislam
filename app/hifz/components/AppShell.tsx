// app/hifz/components/AppShell.tsx — the app shell for /hifz/* (spec §22,
// screenshot rebuild 2026-11-21).
//
// No bottom tab bar: no Tarteel screenshot has one, so the tabs are gone
// (SiteChrome no longer renders them). The destinations the tabs used to
// carry are reachable from the reader's hamburger drawer instead — the
// drawer worker (W4) added the nav link row there (Home, My Progress,
// Bookmarks, Goals, Challenges, Settings); this file owns no nav data. Plus: 4-step skippable
// onboarding (light screens in the reference style, our own wording —
// no copied logo, name or text; step 4 is Book Settings), theme
// application (light/dark/sepia), and the IndexedDB mirror migration
// (localStorage data is never lost).
'use client';

import { useEffect, useState } from 'react';
import { migrateToIdb } from '../lib/store';
import { useSyncUiPrefs, useT } from '../lib/i18n';
import BookSettings from './BookSettings';


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
