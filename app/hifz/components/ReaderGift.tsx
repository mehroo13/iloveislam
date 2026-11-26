// app/hifz/components/ReaderGift.tsx — Step 4 of the step-by-step
// Tarteel match: the "Welcome / Gift" full-screen overlay. Opens from
// the gift icon in the reader's top bar. Layout follows the reference
// gift screen, but the copy is ours: everything is 100% free forever.
// No paywall wording anywhere. (The "No payment." in the bottom
// subtext is the required negation from the brief, not a payment
// requirement.)
// Full-screen, very light grey background (#F8F8F8), 20px side
// padding, flexbox column. Top: our own I Love Islam logo left, dark
// circular close button right. Hero: our own green/blue SVG gift,
// bold title, grey subtitle, signature. Feature card: white card with
// a green+gold badge, two horizontally swipeable cards with our own
// placeholder phone images (mini mushaf lines / plan list over warm
// gradients — not Tarteel's screenshots). Bottom: fixed gold pill
// button "START LEARNING NOW" + tiny subtext. X and the button close
// the overlay and return to the reader. Never auto-shows on load —
// gift-icon trigger only.

'use client';

import { useEffect, useState } from 'react';
import { loadProgress } from '../progress';
import { ALL_SURAHS } from '../surahs';

const INK = 'var(--reader-ink)';
const MUTED = 'var(--reader-muted)';

/* ---------------------------------------------------------------- */
/*  Icons (inline SVG, our own).                                     */
/* ---------------------------------------------------------------- */

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

// 3D-style green and blue gift box — our own drawing.
function IconGiftLarge() {
  return (
    <svg viewBox="0 0 180 140" className="h-[112px] w-[148px]" aria-hidden="true">
      <defs>
        <linearGradient id="giftBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4ADE80" />
          <stop offset="0.45" stopColor="#22C55E" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
        <linearGradient id="giftLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#86EFAC" />
          <stop offset="1" stopColor="#34D399" />
        </linearGradient>
      </defs>
      {/* Bow */}
      <path d="M90 48 C72 22 44 20 47 38 C49 53 72 51 90 48 Z" fill="#22C55E" />
      <path d="M90 48 C108 22 136 20 133 38 C131 53 108 51 90 48 Z" fill="#16A34A" />
      <circle cx="90" cy="48" r="8" fill="#15803D" />
      {/* Lid */}
      <rect x="38" y="54" width="104" height="22" rx="5" fill="url(#giftLid)" />
      {/* Body */}
      <rect x="46" y="76" width="88" height="58" rx="5" fill="url(#giftBody)" />
      {/* Ribbon down the front */}
      <rect x="82" y="54" width="16" height="80" fill="#16A34A" opacity="0.85" />
      {/* Sheen */}
      <ellipse cx="66" cy="92" rx="12" ry="18" fill="#FFFFFF" opacity="0.22" />
    </svg>
  );
}

// Green and gold badge / medal with a white checkmark — our own.
function IconBadge() {
  return (
    <svg viewBox="0 0 56 56" className="h-[52px] w-[52px] shrink-0" aria-hidden="true">
      <path d="M19 40 L14 54 L22 47 L27 54 L27 40 Z" fill="#F59E0B" />
      <path d="M37 40 L42 54 L34 47 L29 54 L29 40 Z" fill="#D97706" />
      <circle cx="28" cy="22" r="19" fill="#F59E0B" />
      <circle cx="28" cy="22" r="14.5" fill="#22C55E" />
      <path d="M21 22.5l4.8 4.8L35.5 17" fill="none" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/*  Placeholder phone images (our own simple designs).               */
/* ---------------------------------------------------------------- */

// Mini phone showing mushaf-like lines with a couple of coloured
// words — suggests mistake detection on the page.
function PhoneMistake() {
  return (
    <div
      className="relative flex h-[120px] items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 48%, #DC2626 100%)' }}
    >
      <div className="relative h-[102px] w-[80px] rounded-[10px] border-2 border-[#1F2937] bg-white shadow-lg">
        <div className="border-b border-[#E5E7EB] px-1.5 py-1 text-center text-[6px] font-bold tracking-wide text-[#6B7280]">
          CHAPTER 1 · VERSE 1
        </div>
        <div dir="rtl" lang="ar" className="font-quran px-1.5 pt-1 text-center text-[8px] leading-[1.9] text-[#111827]">
          بِسْمِ اللَّهِ <span className="text-[#DC2626]">الرَّحْمَٰنِ</span>
          <br />
          الرَّحِيمِ الْحَمْدُ <span className="text-[#16A34A]">لِلَّهِ</span>
          <br />
          رَبِّ الْعَالَمِينَ
        </div>
        <div className="mt-1 flex justify-center gap-2">
          <span className="flex h-3 w-3 items-center justify-center rounded-full border border-[#9CA3AF] text-[6px] text-[#6B7280]">١</span>
          <span className="flex h-3 w-3 items-center justify-center rounded-full border border-[#9CA3AF] text-[6px] text-[#6B7280]">٢</span>
        </div>
      </div>
    </div>
  );
}

// Mini phone showing a memorization plan list — rows with the user's
// REAL progress (audit C5: the old hardcoded 100/42/18/0% rows showed
// fabricated progress on a fresh profile with zero activity). The rows
// are passed in by ReaderGift, which reads them from local progress.
function PhonePlan({ rows }: { rows: { label: string; pct: number }[] }) {
  return (
    <div
      className="relative flex h-[120px] items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #FB923C 0%, #F97316 52%, #EA580C 100%)' }}
    >
      <div className="relative h-[102px] w-[80px] rounded-[10px] border-2 border-[#1F2937] bg-white shadow-lg">
        <div className="border-b border-[#E5E7EB] px-2 py-1 text-[6px] font-bold tracking-wide text-[#6B7280]">
          MEMORIZATION
        </div>
        <div className="space-y-1.5 px-2 pt-1.5">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 shrink-0 rounded-[2px] bg-[#22C55E]" />
                <span className="truncate text-[7px] font-semibold text-[#111827]">{r.label}</span>
                <span className="ml-auto text-[6px] text-[#9CA3AF]">{r.pct}%</span>
              </div>
              <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-[#E5E7EB]">
                <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${Math.max(r.pct, 4)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* The app's real features, in our own words — shown by "View full
 * feature list". Every item is a feature that actually works. */
const FEATURES: { name: string; desc: string }[] = [
  { name: 'Recitation Coach', desc: 'on-device AI listens as you recite and lights each word green as you say it.' },
  { name: 'Mistake Detection', desc: 'skipped or wrong words turn red, with what was missed.' },
  { name: 'Hide Verses', desc: 'hide the verses and recite from memory — tap a hidden verse to peek.' },
  { name: 'Testing Mode', desc: 'recite from memory with the text hidden — peeks are counted.' },
  { name: 'Mistake History', desc: 'mistakes from every session are saved in your history.' },
  { name: 'Mistake Frequency', desc: 'the words you miss most often are highlighted in the reader, so revision goes where it is needed.' },
  { name: 'Memorization Planning', desc: '7-day and 30-day plans for every surah, plus goals and a spaced revision queue.' },
  { name: 'Listen & Follow', desc: 'play the recitation with word-by-word highlighting, in 12 reciters.' },
  { name: 'Goals & Streaks', desc: 'set Memorize or Review goals and keep your daily streak.' },
  { name: 'Memorization Progress', desc: 'per-surah progress, completion, and badges from your own practice.' },
  { name: 'Global Leaderboard', desc: 'opt in from Settings → Privacy to appear on the board.' },
  { name: 'Groups & Challenges', desc: 'create or join a group and compete with family and friends.' },
  { name: 'Mushaf, Text & Translation', desc: 'Quran Text, Book and Translation layouts, with themes and offline use.' },
];

/* ---------------------------------------------------------------- */
/*  Overlay                                                            */
/* ---------------------------------------------------------------- */

// The four surahs the plan preview shows, with their real
// memorisation progress: share of ayahs marked memorised. Fresh
// profiles honestly show 0% everywhere — never sample numbers.
const PLAN_PREVIEW_SURAHS = [1, 2, 3, 4];
function realPlanRows(): { label: string; pct: number }[] {
  try {
    const progress = loadProgress();
    return PLAN_PREVIEW_SURAHS.map((id) => {
      const surah = ALL_SURAHS.find((s) => s.id === id);
      if (!surah) return { label: '', pct: 0 };
      let done = 0;
      for (let ayah = 1; ayah <= surah.ayahCount; ayah++) {
        if (progress.ayahs[`${id}:${ayah}`]?.status === 'memorised') done++;
      }
      return {
        label: surah.name,
        pct: surah.ayahCount > 0 ? Math.round((done / surah.ayahCount) * 100) : 0,
      };
    });
  } catch {
    return PLAN_PREVIEW_SURAHS.map((id) => ({
      label: ALL_SURAHS.find((s) => s.id === id)?.name ?? '',
      pct: 0,
    }));
  }
}

export default function ReaderGift({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rendered, setRendered] = useState(open);
  const [shown, setShown] = useState(false);
  const [planRows, setPlanRows] = useState<{ label: string; pct: number }[]>(() =>
    PLAN_PREVIEW_SURAHS.map((id) => ({
      label: ALL_SURAHS.find((s) => s.id === id)?.name ?? '',
      pct: 0,
    })),
  );
  // Alive pass: "View full feature list" expands the real feature
  // list below (the app's actual features, in our own words).
  const [showFullList, setShowFullList] = useState(false);

  // Mount / fade lifecycle: mount, then fade in; on close, fade out
  // and unmount after the transition.
  useEffect(() => {
    if (open) {
      // Read the user's real progress each time the overlay opens, so
      // the plan preview never shows stale or invented numbers (C5).
      setPlanRows(realPlanRows());
      setRendered(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const timer = window.setTimeout(() => setRendered(false), 200);
    return () => window.clearTimeout(timer);
  }, [open ]);

  if (!rendered) return null;

  return (
    <div
      role="dialog"
      aria-label="Welcome — everything is free"
      className="absolute inset-0 z-[70] flex flex-col transition-opacity duration-200"
      style={{ backgroundColor: 'var(--reader-bg)', opacity: shown ? 1 : 0 }}
    >
      {/* Scrollable content: header, hero, feature card. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[150px]">
        {/* Header: logo left, close right. */}
        <header className="flex items-center justify-between pt-5">
          {/* Our own mark (public/logo.svg). Never the reference's
              two-diamond mark. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="I Love Islam" width={28} height={28} className="h-7 w-7" />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3A3A3A]"
          >
            <IconClose />
          </button>
        </header>

        {/* Hero: gift, title, subtitle, signature. */}
        <div className="mt-2 flex justify-center">
          <IconGiftLarge />
        </div>
        <h1 className="mt-2 text-center text-[21px] font-bold leading-snug" style={{ color: INK }}>
          Everything is 100% Free, Forever!
        </h1>
        <p className="mt-2 px-1 text-center text-[14.5px] leading-[1.55]" style={{ color: MUTED }}>
          Take advantage of our completely free tools to discover why this is the best way to memorize &amp; recite
          the Quran. We hope it benefits you greatly inshaAllah.
        </p>
        <p className="mt-2 text-[15px]" style={{ color: MUTED }}>
          Sincerely, The I Love Islam Team 💖
        </p>

        {/* Feature showcase card. */}
        <section className="mt-4 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between px-4 pt-3">
            <p className="text-[18px] font-medium leading-tight text-[#9CA3AF]">
              Experience
              <span className="block">All Features</span>
            </p>
            <IconBadge />
          </div>

          {/* Horizontal scroll: two feature cards, swipeable. */}
          <div className="mt-2 flex snap-x gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <article className="flex w-[228px] min-w-[228px] snap-start flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
              <p className="px-3 pt-3 text-[16px] font-bold" style={{ color: INK }}>
                Mistake Detection
              </p>
              <p className="px-3 pt-1 text-[13px] leading-snug" style={{ color: MUTED }}>
                Our flagship feature: AI will detect incorrect, missed, and extra words in your recitation AND alert
                you in real-time!
              </p>
              <div className="mt-3">
                <PhoneMistake />
              </div>
            </article>
            <article className="flex w-[228px] min-w-[228px] snap-start flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
              <p className="px-3 pt-3 text-[16px] font-bold" style={{ color: INK }}>
                Memorization Plan
              </p>
              <p className="px-3 pt-1 text-[13px] leading-snug" style={{ color: MUTED }}>
                Tailor your memorization using our intuitive planning tools.
              </p>
              <div className="mt-3">
                <PhonePlan rows={planRows} />
              </div>
            </article>
          </div>

          <button
            type="button"
            onClick={() => setShowFullList((v) => !v)}
            aria-expanded={showFullList}
            className="w-full border-t border-[#E5E7EB] py-2.5 text-center text-[14px]"
            style={{ color: '#64748B' }}
          >
            {showFullList ? 'Hide feature list' : 'View full feature list'}
          </button>
          {showFullList && (
            <ul className="border-t border-[#E5E7EB] px-4 py-3">
              {FEATURES.map((f) => (
                <li key={f.name} className="flex gap-2 py-1.5 text-[13.5px] leading-snug">
                  <span aria-hidden="true" style={{ color: '#16A34A' }}>
                    ✓
                  </span>
                  <span>
                    <span className="font-bold" style={{ color: INK }}>
                      {f.name}
                    </span>{' '}
                    <span style={{ color: MUTED }}>— {f.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Bottom action area: fixed to the bottom. */}
      <div
        className="fixed inset-x-0 bottom-0 z-[70] px-5"
        style={{ backgroundColor: 'var(--reader-bg)', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="h-[52px] w-full rounded-full bg-[#F6C45B] text-[16px] font-bold tracking-wide shadow-sm"
          style={{ color: '#111827' }}
        >
          START LEARNING NOW
        </button>
        <p className="pt-2 text-center text-[11px]" style={{ color: '#9CA3AF' }}>
          No sign-up. No payment. 100% free forever.
        </p>
      </div>
    </div>
  );
}
