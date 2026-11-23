// app/hifz/components/ModeSwitcher.tsx — the floating mode switcher
// (Stage 4, Part 1 §2 + Part 6).
//
// One prominent, labelled control that lets the user switch between
// Reading / Recite / Listen / Memorise / Test from any Quran
// reading-or-practice screen, without going through Settings.
//
// OUR OWN DESIGN — not Tarteel's press-and-hold green orb: a labelled
// dark-green pill ("Mode: Recite ▾") fixed at the bottom-right, above
// the bottom tab bar, that opens a plain card listing the five modes
// with one-line descriptions. The current mode is marked and the panel
// closes on selection, Escape, or tapping outside it. z-[65] sits above
// the cookie-consent banner (z-[60]) so the switcher stays tappable
// while the banner is up, and below the onboarding overlay (z-[70]).
//
// HOW IT SWITCHES — it asks the mounted page first (see lib/mode.ts):
// a reader page that can apply the mode in place prevents the default
// on the `hifz:set-mode` event and switches cleanly (stopping the mic
// or the audio first — never abandoning a live session invisibly). If
// no page handles it, the switcher navigates: Test → /hifz/test,
// anything else → the last-read surah with ?mode=… so the reader
// opens in that mode. The mode is persisted, so the label stays right
// across pages.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  MODE_EVENT, lastReadSlug, loadMode, requestMode,
  type HifzMode,
} from '../lib/mode';
import { useT } from '../lib/i18n';

const MODES: HifzMode[] = ['reading', 'recite', 'listen', 'memorise', 'test'];

/** i18n keys for the mode labels / descriptions (lib/i18n.ts `mode.*`). */
const MODE_LABEL_KEYS: Record<HifzMode, string> = {
  reading: 'mode.reading',
  recite: 'mode.recite',
  listen: 'mode.listen',
  memorise: 'mode.memorise',
  test: 'mode.test',
};
const MODE_DESC_KEYS: Record<HifzMode, string> = {
  reading: 'mode.descReading',
  recite: 'mode.descRecite',
  listen: 'mode.descListen',
  memorise: 'mode.descMemorise',
  test: 'mode.descTest',
};

/** Glyphs are plain text marks (our own set), not copied artwork. */
const MODE_ICONS: Record<HifzMode, string> = {
  reading: '▤',
  recite: '🎙',
  listen: '♪',
  memorise: '◐',
  test: '✎',
};

export default function ModeSwitcher() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  // Hidden on the Mushaf reader routes (/hifz/mushaf, /hifz/mushaf/[page]):
  // the reader has its own mode entry — the big mic button starts Recite
  // and the chapter sheet lists all five modes — so the floating pill
  // would collide with the mic button. Every mode stays reachable from
  // the reader through that sheet; see MushafReader / MushafPageView.
  const onMushafRoute = pathname === '/hifz/mushaf' || pathname.startsWith('/hifz/mushaf/');
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<HifzMode>('reading');
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMode(loadMode());
    const onMode = (e: Event) => {
      const m = (e as CustomEvent<{ mode: HifzMode }>).detail?.mode;
      if (m) setMode(m);
    };
    window.addEventListener(MODE_EVENT, onMode);
    return () => window.removeEventListener(MODE_EVENT, onMode);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, [open ]);

  const select = useCallback(
    (next: HifzMode) => {
      setOpen(false);
      setMode(next);
      // Ask the mounted page to apply it in place first.
      if (requestMode(next)) return;
      // Nobody handled it: navigate to where the mode lives.
      if (next === 'test') {
        router.push('/hifz/test');
        return;
      }
      if (next === 'reading') {
        // Reading has no destination of its own — stay put on a reader
        // page (surah / ayah / mushaf); from any other /hifz page, go
        // to the hub, where the surah list is.
        const first = pathname.split('/')[2] ?? '';
        const nonReader = new Set([
          'test', 'memorize', 'search', 'voice-search', 'my-progress',
          'goals', 'plans', 'challenges', 'settings', 'diagnostics',
          'recite', 'juz', 'juz-amma', 'ayat-al-kursi',
        ]);
        if (pathname === '/hifz' || nonReader.has(first)) router.push('/hifz');
        return;
      }
      router.push(`/hifz/${lastReadSlug()}?mode=${next}`);
    },
    [pathname, router],
  );

  if (onMushafRoute) return null;

  return (
    <div ref={panelRef} className="fixed bottom-[76px] right-3 z-[65] sm:right-5">
      {open && (
        <div
          role="menu"
          aria-label={t('mode.practiceMode')}
          className="mb-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-xl"
        >
          <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-[#5b6b62]">
            {t('mode.practiceMode')}
          </p>
          <ul>
            {MODES.map((m) => (
              <li key={m}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={mode === m}
                  onClick={() => select(m)}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#FFFBF2] ${
                    mode === m ? 'bg-[#E4FFF2]' : ''
                  }`}
                >
                  <span aria-hidden="true" className="mt-0.5 text-lg leading-none">
                    {MODE_ICONS[m]}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-bold text-[#102E26]">
                      {t(MODE_LABEL_KEYS[m])}
                      {mode === m && (
                        <span className="rounded-full bg-[#1FA36B] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          {t('mode.current')}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-[#5b6b62]">
                      {t(MODE_DESC_KEYS[m])}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="px-3 pb-2 pt-1 text-[11px] leading-snug text-[#5b6b62]">
            {t('mode.switchNote')}
          </p>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('mode.ariaChange').replace('{label}', t(MODE_LABEL_KEYS[mode]))}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-12 items-center gap-2 rounded-full bg-[#102E26] py-2.5 pl-4 pr-3 text-sm font-bold text-white shadow-lg ring-1 ring-[#FFB800]/60 hover:bg-[#1FA36B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800]"
      >
        <span aria-hidden="true" className="text-base leading-none">
          {MODE_ICONS[mode]}
        </span>
        <span>
          {t('mode.pill').replace('{label}', t(MODE_LABEL_KEYS[mode]))}
        </span>
        <span aria-hidden="true" className="text-xs text-white/70">
          {open ? '▴' : '▾'}
        </span>
      </button>
    </div>
  );
}
