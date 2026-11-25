// app/hifz/components/ReaderSettings.tsx — Step 5 of the step-by-step
// Tarteel match: the "Settings" full-screen page. Opens from the gear
// icon in the reader's top bar. Layout follows the two reference
// screenshots (top + scrolled): very light grey background, circular
// back button + "Settings" title, a horizontally scrollable banner
// (pink Testing Mode card), then grouped white cards — Experiences,
// Quran Appearance, Appearance, Notifications, Sounds & Haptics,
// Downloads, Privacy — each row with a small black icon, a label, and
// a light grey chevron. The page scrolls vertically; the header stays
// fixed. No "Tarteel" / "Premium" wording anywhere.
//
// Navigation is a proper STACK (Settings subtree, 2026-11-25): every
// row opens its own real sub-screen (see SettingsScreens.tsx), and
// every sub-screen has a back button that returns to the previous
// screen — Settings → sub-screen → back → Settings. Nested jumps
// push another screen on top, and back unwinds one step at a time.
// The Mushaf Layout row still opens the layout sheet (the full
// Mushaf Layout screen replaces it in a later commit); TEST YOURSELF
// opens the reader in Testing Mode; Data Usage is still a dialog and
// Delete All Audio Data a two-tap row (both become full screens in
// a later commit).
//
// Alive pass (2026-11-25): every remaining row works. Hidden Verses
// is a real switch on the reader's state; Language is a real picker
// over the 8 locales; Reciters is a real picker over the 12
// recitations (the reader's Listen uses the picked one); Testing
// Mode opens the reader in Testing Mode; Data Usage shows the real
// on-device storage numbers. Leaderboard follow-up: the Privacy row
// "Show me on the global leaderboard" is a real opt-in switch writing
// `profiles.show_on_leaderboard` (migration 0002, applied live);
// guests see it disabled — an account is needed.

'use client';

import { useEffect, useRef, useState } from 'react';
import { deleteAllLocalData } from '../lib/store';
import { getSupabase } from '../lib/supabase';
import { DEFAULT_RECITER_ID, DEFAULT_TRANSLATION_ID, loadSettings, saveSettings } from '../progress';
import { TAFSIR_ID } from '../../quran/lib';
import {
  DroppedConnectionScreen,
  HiddenVersesScreen,
  LanguageScreen,
  ListeningScreen,
  MarkingScreen,
  MistakeFeedbackScreen,
  RecitationScreen,
  RecitersScreen,
  RemindersScreen,
  SessionStartStopScreen,
  TafsirScreen,
  TestingModeScreen,
  ThemeScreen,
  TranslationsScreen,
} from './SettingsScreens';

const INK = 'var(--reader-ink)';
const MUTED = 'var(--reader-muted)';

/** Human-readable byte count for the Data Usage dialog. */
function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---------------------------------------------------------------- */
/*  Icons (inline SVG, our own).                                     */
/* ---------------------------------------------------------------- */

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" style={{ stroke: INK }} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}
function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}
function IconMic() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2.5" width="6" height="12" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
      <path d="M12 18v3.5" />
    </svg>
  );
}
function IconHeadphones() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 14.5v-2.5a7.5 7.5 0 0 1 15 0v2.5" />
      <rect x="3" y="13.5" width="4" height="7" rx="1.8" />
      <rect x="17" y="13.5" width="4" height="7" rx="1.8" />
    </svg>
  );
}
function IconBookOpen() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 6.5C10.5 5 8 4.5 5 5c-1 .2-2 .6-2 1.4v11.2c0 .8 1 1.2 2 1 3-.5 5.5 0 7 1.5 1.5-1.5 4-2 7-1.5 1 .2 2-.2 2-1V6.4c0-.8-1-1.2-2-1.4-3-.5-5.5 0-7 1.5Z" />
      <path d="M12 6.5v12.6" />
    </svg>
  );
}
function IconEyeOff() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12C5 7.5 8.5 5.5 12 5.5c3.5 0 7 2 9.5 6.5-2.5 4.5-6 6.5-9.5 6.5-3.5 0-7-2-9.5-6.5Z" />
      <circle cx="12" cy="12" r="2.6" style={{ fill: INK }} stroke="none" />
      <path d="M4.5 4.5l15 15" />
    </svg>
  );
}
function IconMarker() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1Z" />
      <path d="M13.5 7.5l3 3" />
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  );
}
function IconSun() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15 18 9" />
      <path d="M10.3 20.5a2 2 0 0 0 3.4 0" />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v11" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 20h16" />
    </svg>
  );
}
function IconSpeaker() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5v5h3.5L12 19.5v-15L7.5 9.5H4Z" />
      <path d="M15.5 9a4.2 4.2 0 0 1 0 6" />
      <path d="M18 6.5a8 8 0 0 1 0 11" />
    </svg>
  );
}
function IconPlayCircle() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5l5.5 3.5L10 15.5v-7Z" style={{ fill: INK }} stroke="none" />
    </svg>
  );
}
function IconWifiOff() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 9a15 15 0 0 1 5-3.3M12 5.5c2.9 0 5.7 1 8 2.8M5.5 12.5a10 10 0 0 1 3.5-2.3M12 12.5c1.9 0 3.7.7 5 1.8" />
      <circle cx="12" cy="18.5" r="1.4" style={{ fill: INK }} stroke="none" />
      <path d="M4 4l16 16" />
    </svg>
  );
}
function IconCheckCircle() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.8 2.8L16.5 9" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10.5" width="16" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function IconMinusCircle() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" style={{ fill: INK }} />
      <path d="M8 12h8" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
function IconTrophy() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" style={{ stroke: INK }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5.5H4.5a2.75 2.75 0 0 0 2.75 4.5M17 5.5h2.5a2.75 2.75 0 0 1-2.75 4.5" />
      <path d="M12 14v3.5" />
      <path d="M8.5 20.5h7" />
    </svg>
  );
}

// Gold 4-point sparkle, as in the pink banner's decoration.
function IconSparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#F59E0B" aria-hidden="true">
      <path d="M12 1l2.2 7.8L22 11l-7.8 2.2L12 21l-2.2-7.8L2 11l7.8-2.2L12 1Z" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/*  Sections — the reference's sections; each row has a real        */
/*  destination.                                                     */
/* ---------------------------------------------------------------- */

type ScreenId =
  | 'recitation'
  | 'listening'
  | 'reciters'
  | 'hiddenVerses'
  | 'marking'
  | 'language'
  | 'theme'
  | 'reminders'
  | 'mistakeFeedback'
  | 'sessionStartStop'
  | 'droppedConnection'
  | 'testingMode'
  | 'translations'
  | 'tafsir';

const SCREEN_TITLES: Record<ScreenId, string> = {
  recitation: 'Recitation',
  listening: 'Listening',
  reciters: 'Reciters',
  hiddenVerses: 'Hidden Verses',
  marking: 'Marking',
  language: 'Language',
  theme: 'Theme',
  reminders: 'Reminders',
  mistakeFeedback: 'Mistake Feedback',
  sessionStartStop: 'Session Start & Stop',
  droppedConnection: 'Dropped Connection',
  testingMode: 'Testing Mode',
  translations: 'Translations',
  tafsir: 'Tafsir',
};

type RowAction =
  | { kind: 'screen'; screen: ScreenId }
  | { kind: 'layout' }
  | { kind: 'dataUsage' }
  | { kind: 'delete' }
  | { kind: 'leaderboard' };

type RowDef = { icon: () => React.JSX.Element; label: string; action: RowAction };
type SectionDef = { title: string; rows: RowDef[] };

const SECTIONS: SectionDef[] = [
  {
    title: 'Experiences',
    rows: [
      { icon: IconMic, label: 'Recitation', action: { kind: 'screen', screen: 'recitation' } },
      { icon: IconHeadphones, label: 'Listening', action: { kind: 'screen', screen: 'listening' } },
    ],
  },
  {
    title: 'Quran Appearance',
    rows: [
      { icon: IconBookOpen, label: 'Mushaf Layout', action: { kind: 'layout' } },
      { icon: IconEyeOff, label: 'Hidden Verses', action: { kind: 'screen', screen: 'hiddenVerses' } },
      { icon: IconMarker, label: 'Marking', action: { kind: 'screen', screen: 'marking' } },
    ],
  },
  {
    title: 'Appearance',
    rows: [
      { icon: IconGlobe, label: 'Language', action: { kind: 'screen', screen: 'language' } },
      { icon: IconSun, label: 'Theme', action: { kind: 'screen', screen: 'theme' } },
    ],
  },
  {
    title: 'Notifications',
    rows: [{ icon: IconBell, label: 'Reminders', action: { kind: 'screen', screen: 'reminders' } }],
  },
  {
    title: 'Sounds & Haptics',
    rows: [
      { icon: IconSpeaker, label: 'Mistake Feedback', action: { kind: 'screen', screen: 'mistakeFeedback' } },
      { icon: IconPlayCircle, label: 'Session Start & Stop', action: { kind: 'screen', screen: 'sessionStartStop' } },
      { icon: IconWifiOff, label: 'Dropped Connection', action: { kind: 'screen', screen: 'droppedConnection' } },
      { icon: IconCheckCircle, label: 'Testing Mode', action: { kind: 'screen', screen: 'testingMode' } },
    ],
  },
  {
    title: 'Downloads',
    rows: [
      { icon: IconDownload, label: 'Reciters', action: { kind: 'screen', screen: 'reciters' } },
      { icon: IconBookOpen, label: 'Translations', action: { kind: 'screen', screen: 'translations' } },
      { icon: IconBookOpen, label: 'Tafsir', action: { kind: 'screen', screen: 'tafsir' } },
    ],
  },
  {
    title: 'Privacy',
    rows: [
      { icon: IconTrophy, label: 'Show me on the global leaderboard', action: { kind: 'leaderboard' } },
      { icon: IconLock, label: 'Data Usage', action: { kind: 'dataUsage' } },
      { icon: IconMinusCircle, label: 'Delete All Audio Data', action: { kind: 'delete' } },
    ],
  },
];

/* ---------------------------------------------------------------- */
/*  Banner decoration — our own drawing: three tilted gradient       */
/*  capsules, a green circle peeking at the right edge, gold         */
/*  sparkles and white rays, as in the reference pink card.          */
/* ---------------------------------------------------------------- */

function BannerDecoration() {
  return (
    <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-[140px] overflow-hidden rounded-r-2xl" aria-hidden="true">
      {/* White rays fanning out from behind the capsules. */}
      <svg viewBox="0 0 140 162" className="absolute inset-0 h-full w-full" fill="none" stroke="#FFFFFF" strokeWidth="1.4" opacity="0.75">
        <path d="M118 78 L18 6" />
        <path d="M118 78 L8 38" />
        <path d="M118 78 L4 78" />
        <path d="M118 78 L8 118" />
        <path d="M118 78 L18 150" />
      </svg>
      {/* Green circle peeking at the right edge. */}
      <div className="absolute -right-[10px] top-[118px] h-[30px] w-[30px] rounded-full bg-[#4ADE80]" />
      {/* Capsules: blue, purple, pink — tilted, with a light seam.
          Right ends bleed off the card edge, as in the reference. */}
      <div className="absolute -right-[4px] top-[30px] flex h-[20px] w-[74px] -rotate-[10deg] items-center justify-center rounded-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] shadow-md">
        <span className="h-[6px] w-[38px] rounded-full bg-white/60" />
      </div>
      <div className="absolute -right-[4px] top-[64px] flex h-[20px] w-[74px] -rotate-[10deg] items-center justify-center rounded-full bg-gradient-to-r from-[#A855F7] to-[#C084FC] shadow-md">
        <span className="h-[6px] w-[38px] rounded-full bg-white/60" />
      </div>
      <div className="absolute -right-[4px] top-[102px] flex h-[20px] w-[74px] -rotate-[10deg] items-center justify-center rounded-full bg-gradient-to-r from-[#F472B6] to-[#FB7185] shadow-md">
        <span className="h-[6px] w-[38px] rounded-full bg-white/60" />
      </div>
      <IconSparkle className="absolute -right-[2px] top-[4px] h-3.5 w-3.5" />
      <IconSparkle className="absolute right-[48px] top-[81px] h-3 w-3" />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Overlay                                                            */
/* ---------------------------------------------------------------- */

export default function ReaderSettings({
  open,
  onClose,
  onTestYourself,
  onOpenLayout,
  hideVerses,
  onToggleHideVerses,
  detectMistakes,
  onToggleDetectMistakes,
  hideMarkers,
  onToggleHideMarkers,
  mistakeMarkingOn,
  onToggleMistakeMarking,
  similarOn,
  onToggleSimilar,
  tajweedOn,
  onToggleTajweed,
  playSpeed,
  onPlaySpeedChange,
  translationId,
  onSelectTranslation,
  tafsirId,
  onSelectTafsir,
}: {
  open: boolean;
  onClose: () => void;
  /** Phase 7: TEST YOURSELF opens the reader in Testing Mode. */
  onTestYourself?: () => void;
  /** Phase 7: the Mushaf Layout row opens the layout sheet (until
   *  the full Mushaf Layout screen replaces it). */
  onOpenLayout?: () => void;
  /** Alive pass: the Hidden Verses row toggles the reader's state. */
  hideVerses?: boolean;
  onToggleHideVerses?: () => void;
  /** Settings subtree: Recitation screen — mistake detection. */
  detectMistakes?: boolean;
  onToggleDetectMistakes?: (v: boolean) => void;
  /** Settings subtree: Hidden Verses screen — ayah-end markers. */
  hideMarkers?: boolean;
  onToggleHideMarkers?: (v: boolean) => void;
  /** Settings subtree: Marking screen — mistake-history washes. */
  mistakeMarkingOn?: boolean;
  onToggleMistakeMarking?: (v: boolean) => void;
  /** Settings subtree: Marking screen — similar-phrase colouring. */
  similarOn?: boolean;
  onToggleSimilar?: (v: boolean) => void;
  /** Fourth refinement: Marking screen — tajweed colours. */
  tajweedOn?: boolean;
  onToggleTajweed?: (v: boolean) => void;
  /** Settings subtree: Listening screen — Listen play speed. */
  playSpeed?: number;
  onPlaySpeedChange?: (v: number) => void;
  /** Settings subtree: Translations screen — the reader's translation. */
  translationId?: number;
  onSelectTranslation?: (id: number) => void;
  /** Settings subtree: Tafsir screen — the reader's tafsir. */
  tafsirId?: number;
  onSelectTafsir?: (id: number) => void;
}) {
  const [rendered, setRendered] = useState(open);
  const [shown, setShown] = useState(false);
  /** Navigation stack: [] is the Settings main screen; each push
   *  adds a sub-screen; back pops one. Reset on every open so a
   *  reopened Settings always starts at the main screen. */
  const [stack, setStack] = useState<ScreenId[]>([]);
  useEffect(() => {
    if (open) setStack([]);
  }, [open ]);
  const current: ScreenId | null = stack.length > 0 ? stack[stack.length - 1] : null;
  const push = (screen: ScreenId) => setStack((s) => [...s, screen]);
  const pop = () => setStack((s) => (s.length === 0 ? s : s.slice(0, -1)));
  /** Reciters: the picked recitation for Listen (settings doc
   *  `reciterId`, default 7 Alafasy). The reader's playback reads it
   *  when a take starts. Owned here so the Listening and Reciters
   *  screens share one value. */
  const [reciterId, setReciterId] = useState<number>(() => {
    try {
      return loadSettings().reciterId ?? DEFAULT_RECITER_ID;
    } catch {
      return DEFAULT_RECITER_ID;
    }
  });
  const chooseReciter = (id: number) => {
    setReciterId(id);
    try {
      const settings = loadSettings();
      saveSettings({ ...settings, reciterId: id });
    } catch {
      /* storage unavailable — the choice still applies this session */
    }
  };
  /** Alive pass — Data Usage: the real on-device storage numbers,
   *  measured when the dialog opens (never estimated or invented). */
  const [dataUsage, setDataUsage] = useState<null | { usage: number; quota: number; lsBytes: number }>(null);
  const [dataUsageLoading, setDataUsageLoading] = useState(false);
  const openDataUsage = async () => {
    setDataUsage(null);
    setDataUsageLoading(true);
    let usage = 0;
    let quota = 0;
    try {
      const est = await navigator.storage.estimate();
      usage = est.usage ?? 0;
      quota = est.quota ?? 0;
    } catch {
      /* estimate unavailable — the dialog says so */
    }
    let lsBytes = 0;
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k) continue;
        lsBytes += k.length + (window.localStorage.getItem(k)?.length ?? 0);
      }
    } catch {
      /* storage unavailable */
    }
    setDataUsage({ usage, quota, lsBytes });
    setDataUsageLoading(false);
  };
  /** Phase 7 — Delete All Audio Data: two-tap confirm. The first
   *  tap arms the row ("Tap again to delete"); the second clears
   *  the on-device audio + ALL of localStorage and reloads. The arm
   *  expires after 4 s so an accidental first tap cannot delete
   *  anything later. NOTE: this still wipes all of localStorage
   *  (Phase 7 behaviour) — the Delete screen narrows it to
   *  audio-only in a later commit; see the Settings subtree report. */
  const [deleteArmed, setDeleteArmed] = useState(false);
  const deleteTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (deleteTimerRef.current !== null) window.clearTimeout(deleteTimerRef.current);
    };
  }, []);
  const handleDeleteTap = async () => {
    if (!deleteArmed) {
      setDeleteArmed(true);
      deleteTimerRef.current = window.setTimeout(() => setDeleteArmed(false), 4000);
      return;
    }
    if (deleteTimerRef.current !== null) window.clearTimeout(deleteTimerRef.current);
    setDeleteArmed(false);
    // IndexedDB first (session recordings + the localStorage mirror
    // in the kv store), then ALL of localStorage, then reload.
    // FLAG: clearing all of localStorage wipes every locally stored
    // record — goals, sessions, bookmarks, settings — not just
    // audio. That is what the spec asks for; narrow it to audio-only
    // on request (see the Phase 7 report).
    try {
      await deleteAllLocalData();
    } catch {
      /* delete failure is never fatal — still clear + reload */
    }
    try {
      window.localStorage.clear();
    } catch {
      /* storage unavailable */
    }
    window.location.reload();
  };
  /** Leaderboard opt-in (migration 0002, applied live 2026-11-25):
   *  writes `profiles.show_on_leaderboard` for the signed-in user
   *  (RLS "own profile" allows a user to update only their own row).
   *  Guests see the row disabled — an account is needed. Turning it
   *  off is the "remove me" path: the member vanishes from the board
   *  at once. */
  const [lbState, setLbState] = useState<'loading' | 'guest' | 'ready'>('loading');
  const [lbOptedIn, setLbOptedIn] = useState(false);
  const [lbSaving, setLbSaving] = useState(false);
  const [lbError, setLbError] = useState<string | null>(null);
  const lbUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLbState('loading');
    setLbError(null);
    lbUserIdRef.current = null;
    const sb = getSupabase();
    if (!sb) {
      setLbState('guest');
      return;
    }
    void sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!alive) return;
      const user = session?.user;
      if (!user) {
        setLbState('guest');
        return;
      }
      lbUserIdRef.current = user.id;
      try {
        const { data } = await sb
          .from('profiles')
          .select('show_on_leaderboard')
          .eq('id', user.id)
          .maybeSingle();
        if (!alive) return;
        setLbOptedIn((data as { show_on_leaderboard?: boolean | null } | null)?.show_on_leaderboard === true);
        setLbState('ready');
      } catch {
        if (!alive) return;
        setLbOptedIn(false);
        setLbState('ready');
      }
    });
    return () => {
      alive = false;
    };
  }, [open ]);
  const handleLeaderboardToggle = async () => {
    if (lbState !== 'ready' || lbSaving || !lbUserIdRef.current) return;
    const sb = getSupabase();
    if (!sb) return;
    const next = !lbOptedIn;
    setLbOptedIn(next);
    setLbSaving(true);
    setLbError(null);
    const { error } = await sb
      .from('profiles')
      .update({ show_on_leaderboard: next })
      .eq('id', lbUserIdRef.current);
    setLbSaving(false);
    if (error) {
      setLbOptedIn(!next);
      setLbError('Could not save that — check your connection and try again.');
    }
  };

  // Mount / fade lifecycle: mount, then fade in; on close, fade out
  // and unmount after the transition.
  useEffect(() => {
    if (open) {
      setRendered(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const timer = window.setTimeout(() => setRendered(false), 200);
    return () => window.clearTimeout(timer);
  }, [open ]);

  if (!rendered) return null;

  const onRowAction = (action: RowAction) => {
    if (action.kind === 'screen') push(action.screen);
    else if (action.kind === 'layout') onOpenLayout?.();
    else if (action.kind === 'dataUsage') void openDataUsage();
    else if (action.kind === 'delete') void handleDeleteTap();
  };

  return (
    <div
      role="dialog"
      aria-label="Settings"
      className="absolute inset-0 z-[70] flex flex-col transition-opacity duration-200"
      style={{ backgroundColor: 'var(--reader-bg)', opacity: shown ? 1 : 0 }}
    >
      {/* Header: back button left, title right. On the main screen
          back returns to the reader; on a sub-screen it pops the
          stack. Stays fixed while the content below scrolls. */}
      <header className="flex shrink-0 items-center justify-between px-4 pb-3 pt-4">
        <button
          type="button"
          aria-label={current ? 'Back to Settings' : 'Back to reader'}
          onClick={current ? pop : onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D1D5DB] bg-white"
        >
          <IconChevronLeft />
        </button>
        <h1 className="text-[20px] font-bold leading-none" style={{ color: INK }}>
          {current ? SCREEN_TITLES[current] : 'Settings'}
        </h1>
      </header>

      {current === 'recitation' ? (
        <RecitationScreen
          onBack={pop}
          detectMistakes={detectMistakes ?? true}
          onToggleDetectMistakes={(v) => onToggleDetectMistakes?.(v)}
        />
      ) : current === 'listening' ? (
        <ListeningScreen
          onBack={pop}
          reciterId={reciterId}
          onChooseReciter={chooseReciter}
          playSpeed={playSpeed ?? 1}
          onPlaySpeedChange={(v) => onPlaySpeedChange?.(v)}
          onOpenReciters={() => push('reciters')}
        />
      ) : current === 'reciters' ? (
        <RecitersScreen onBack={pop} reciterId={reciterId} onChooseReciter={chooseReciter} />
      ) : current === 'hiddenVerses' ? (
        <HiddenVersesScreen
          onBack={pop}
          hideVerses={hideVerses ?? false}
          onToggleHideVerses={() => onToggleHideVerses?.()}
          hideMarkers={hideMarkers ?? false}
          onToggleHideMarkers={(v) => onToggleHideMarkers?.(v)}
        />
      ) : current === 'marking' ? (
        <MarkingScreen
          onBack={pop}
          tajweedOn={tajweedOn ?? true}
          onToggleTajweed={(v) => onToggleTajweed?.(v)}
          highlightMistakes={mistakeMarkingOn ?? true}
          onToggleHighlightMistakes={(v) => onToggleMistakeMarking?.(v)}
          colorSimilar={similarOn ?? false}
          onToggleColorSimilar={(v) => onToggleSimilar?.(v)}
        />
      ) : current === 'language' ? (
        <LanguageScreen onBack={pop} />
      ) : current === 'theme' ? (
        <ThemeScreen onBack={pop} />
      ) : current === 'reminders' ? (
        <RemindersScreen onBack={pop} />
      ) : current === 'mistakeFeedback' ? (
        <MistakeFeedbackScreen onBack={pop} onOpenRecitation={() => push('recitation')} />
      ) : current === 'sessionStartStop' ? (
        <SessionStartStopScreen onBack={pop} />
      ) : current === 'droppedConnection' ? (
        <DroppedConnectionScreen onBack={pop} />
      ) : current === 'testingMode' ? (
        <TestingModeScreen onBack={pop} />
      ) : current === 'translations' ? (
        <TranslationsScreen
          onBack={pop}
          translationId={translationId ?? DEFAULT_TRANSLATION_ID}
          onSelectTranslation={(id) => onSelectTranslation?.(id)}
        />
      ) : current === 'tafsir' ? (
        <TafsirScreen
          onBack={pop}
          tafsirId={tafsirId ?? TAFSIR_ID}
          onSelectTafsir={(id) => onSelectTafsir?.(id)}
        />
      ) : (
        /* Scrollable main screen: banner + grouped sections. */
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
          {/* Top banner — the Testing Mode card only. The "Get
              Started" card is gone: there is no tutorial to view, so
              a button for one would be a dead control. */}
          <div className="mt-3 flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Card 1 — Testing Mode (pink). */}
            <article className="relative flex h-[162px] w-[290px] min-w-[290px] shrink-0 flex-col overflow-hidden rounded-2xl bg-[#FFEDF9] p-4">
              <BannerDecoration />
              {/* Text runs full width, as in the reference — the
                  decoration overlaps the last words of the longer lines. */}
              <div>
                <h2 className="text-[15px] font-bold leading-snug" style={{ color: INK }}>
                  New Feature: Testing Mode
                </h2>
                <p className="mt-1 w-[94%] text-[12.5px] leading-snug text-[#4B5563]">
                  Test yourself randomly and build confidence reciting from anywhere in the Quran.
                </p>
              </div>
              <button
                type="button"
                onClick={onTestYourself}
                data-testid="settings-test-yourself"
                className="relative z-10 mt-auto h-[34px] self-start rounded-full bg-[#F6C45B] px-5 text-[12px] font-bold tracking-wide shadow-sm"
                style={{ color: '#111827' }}
              >
                TEST YOURSELF
              </button>
            </article>
          </div>

          {/* Grouped sections. */}
          {SECTIONS.map((section, si) => (
            <section key={section.title} className={si === 0 ? 'mt-3' : 'mt-5'}>
              <h2 className="mb-1.5 px-1.5 text-[16px] font-bold" style={{ color: INK }}>
                {section.title}
              </h2>
              <div className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                {section.rows.map((row, ri) => {
                  const RowIcon = row.icon;
                  return (
                    <div key={row.label}>
                      {ri > 0 && <div className="ml-12 mr-4 border-t border-[#EFEFEF]" />}
                      {row.action.kind === 'leaderboard' ? (
                        /* Leaderboard opt-in: a real switch for signed-in
                           users; disabled for guests (an account is
                           needed) and while the profile is loading. */
                        <div className="flex w-full items-center gap-3 px-4 py-[14px]">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                            <RowIcon />
                          </span>
                          <span
                            className="min-w-0 flex-1 text-[15px]"
                            style={{ color: INK, opacity: lbState === 'ready' ? 1 : 0.55 }}
                          >
                            {row.label}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={lbOptedIn}
                            aria-label="Show me on the global leaderboard"
                            data-testid="settings-leaderboard-toggle"
                            disabled={lbState !== 'ready' || lbSaving}
                            onClick={() => void handleLeaderboardToggle()}
                            className="relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60"
                            style={{ backgroundColor: lbOptedIn ? '#16A34A' : '#D1D5DB' }}
                          >
                            <span
                              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
                              style={{ left: lbOptedIn ? '22px' : '2px' }}
                            />
                          </button>
                        </div>
                      ) : row.action.kind === 'delete' ? (
                        /* Phase 7 — Delete All Audio Data: two-tap
                           confirm; the second tap clears the on-device
                           audio + ALL of localStorage and reloads
                           (narrowed to audio-only by the Delete
                           screen in a later commit). */
                        <button
                          type="button"
                          onClick={() => onRowAction(row.action)}
                          data-testid="settings-delete-audio"
                          aria-label={deleteArmed ? 'Tap again to delete all audio data' : 'Delete All Audio Data'}
                          className="flex w-full items-center gap-3 px-4 py-[14px] text-left"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                            <RowIcon />
                          </span>
                          <span className="min-w-0 flex-1 text-[15px]" style={{ color: deleteArmed ? '#DC2626' : INK }}>
                            {deleteArmed ? 'Tap again to delete everything' : row.label}
                          </span>
                          {deleteArmed ? (
                            <span className="shrink-0 text-[12px] font-bold" style={{ color: '#DC2626' }}>
                              Confirm
                            </span>
                          ) : (
                            <IconChevronRight />
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRowAction(row.action)}
                          className="flex w-full items-center gap-3 px-4 py-[14px] text-left"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                            <RowIcon />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[15px]" style={{ color: INK }}>
                            {row.label}
                          </span>
                          <IconChevronRight />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {section.title === 'Privacy' && (
                <p className="mt-2 px-1.5 text-[12px] leading-snug" style={{ color: MUTED }}>
                  {lbState === 'guest'
                    ? 'You need an account to appear on the board — sign in from Account & backup. Only your display name, memorised ayahs, current streak and longest streak would be shown.'
                    : 'Only your display name, memorised ayahs, current streak and longest streak are shown. Off by default — turning it off removes you at once.'}
                </p>
              )}
              {section.title === 'Privacy' && lbError && (
                <p className="mt-1 px-1.5 text-[12px] font-semibold leading-snug" style={{ color: '#DC2626' }}>
                  {lbError}
                </p>
              )}
            </section>
          ))}

          {/* Data Usage dialog — the real on-device numbers. */}
          {(dataUsageLoading || dataUsage !== null) && (
            <div
              className="absolute inset-0 z-[80] flex items-end justify-center bg-black/40"
              onClick={() => {
                setDataUsage(null);
                setDataUsageLoading(false);
              }}
              role="presentation"
            >
              <div
                className="w-full rounded-t-3xl bg-white p-5 pb-8 shadow-xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Data usage"
              >
                <h2 className="text-[18px] font-bold" style={{ color: INK }}>
                  Data Usage
                </h2>
                <p className="mt-1 text-[13px] leading-snug" style={{ color: MUTED }}>
                  Everything is stored on this device only — nothing is uploaded.
                </p>
                {dataUsage === null ? (
                  <p className="mt-4 text-[14px]" style={{ color: MUTED }}>
                    Measuring…
                  </p>
                ) : (
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] px-4 py-3">
                      <span className="text-[14px]" style={{ color: INK }}>
                        Browser storage used
                      </span>
                      <span className="text-[14px] font-semibold" style={{ color: INK }}>
                        {formatBytes(dataUsage.usage)}
                        {dataUsage.quota > 0 ? ` of ${formatBytes(dataUsage.quota)}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] px-4 py-3">
                      <span className="text-[14px]" style={{ color: INK }}>
                        Saved settings, goals &amp; sessions
                      </span>
                      <span className="text-[14px] font-semibold" style={{ color: INK }}>
                        {formatBytes(dataUsage.lsBytes)}
                      </span>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDataUsage(null);
                    setDataUsageLoading(false);
                  }}
                  className="mt-4 h-11 w-full rounded-full text-[15px] font-bold text-white"
                  style={{ backgroundColor: '#16A34A' }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
