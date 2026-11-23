// app/hifz/components/SettingsClient.tsx — Settings (spec §22), restructured
// into Tarteel-style grouped white cards with icon + label + chevron rows.
// Restructure + restyle only: every pre-existing setting and behaviour is
// preserved (language, theme, recitation coach, Quran appearance, data
// usage, reminders, mic help, account, export/import/clear, privacy,
// support). New group/row labels are English for now (i18n.ts untouched).
'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  loadProgress, loadMistakes, loadSettings, saveProgress, saveMistakes, saveSettings,
  exportProgress, importProgress, downloadProgressJson,
  localDateString,
  type HifzSettings,
} from '../progress';
import { mirrorAllToIdb } from '../lib/store';
import { loadBookmarks, saveBookmarks } from '../lib/bookmarks';
import { loadChallenges, saveChallenges } from '../lib/challenges';
import AccountSection from './AccountSection';
import SearchablePicker from './SearchablePicker';
import {
  RECITERS, TRANSLATIONS, TAFSIRS, TAFSIR_ID, groupByLanguage,
  reciterName, tafsirName, translationName,
} from '../../quran/lib';
import {
  SUPPORTED_LOCALES,
  isSupportedLocale,
  resetUiPrefsToDefaults,
  setUiLocale,
  setUiTheme,
  syncPrefsFromStorage,
  useT,
} from '../lib/i18n';

/* Listen prefs live in the same key the surah page reads
   ('ili_hifz_listen_v1', SurahClient): repeat / pause / speed /
   word-by-word. The per-surah ayah range (fromAyah/toAyah) is NOT shown
   here — it belongs to the surah being listened to — and is preserved
   untouched when these prefs are saved. */
const LISTEN_KEY = 'ili_hifz_listen_v1';
const TAFSIR_KEY = 'ili_hifz_tafsir_v1';

type ListenPrefs = { repeat: number; pauseSec: number; speed: number; wordByWord: boolean };

function loadListenPrefs(): ListenPrefs {
  try {
    const raw = localStorage.getItem(LISTEN_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<ListenPrefs>;
      return {
        repeat: [1, 2, 3, 5, 10].includes(Number(p.repeat)) ? Number(p.repeat) : 1,
        pauseSec: [0, 1, 2, 3, 5, 10].includes(Number(p.pauseSec)) ? Number(p.pauseSec) : 0,
        speed: [0.5, 0.75, 1, 1.25, 1.5, 2].includes(Number(p.speed)) ? Number(p.speed) : 1,
        wordByWord: p.wordByWord === true,
      };
    }
  } catch {
    /* defaults */
  }
  return { repeat: 1, pauseSec: 0, speed: 1, wordByWord: false };
}

/* Small stroke icons (own simple paths, no artwork copied). */
function Icon({ name }: { name: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'mic':
      return (<svg {...common}><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 19v3" /></svg>);
    case 'headphones':
      return (<svg {...common}><path d="M3 14a9 9 0 0 1 18 0" /><rect x="2" y="14" width="4" height="7" rx="2" /><rect x="18" y="14" width="4" height="7" rx="2" /></svg>);
    case 'layers':
      return (<svg {...common}><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" /></svg>);
    case 'eye-off':
      return (<svg {...common}><path d="M3 3l18 18" /><path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c7 0 10 7 10 7a17 17 0 0 1-2.9 3.9M6.6 6.6A16 16 0 0 0 2 12s3 7 10 7a9.6 9.6 0 0 0 5.4-1.6" /></svg>);
    case 'star':
      return (<svg {...common}><path d="m12 2 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8z" /></svg>);
    case 'globe':
      return (<svg {...common}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>);
    case 'sun':
      return (<svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
    case 'bell':
      return (<svg {...common}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>);
    case 'volume':
      return (<svg {...common}><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></svg>);
    case 'download':
      return (<svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></svg>);
    case 'database':
      return (<svg {...common}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>);
    case 'trash':
      return (<svg {...common}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>);
    case 'target':
      return (<svg {...common}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>);
    default:
      return (<svg {...common}><circle cx="12" cy="12" r="10" /></svg>);
  }
}

function IconChip({ name, danger }: { name: string; danger?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
        danger ? 'bg-red-50 text-red-700' : 'bg-[#E4FFF2] text-[#1FA36B]'
      }`}
    >
      <Icon name={name} />
    </span>
  );
}

function Chevron({ expanded }: { expanded?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-[#6B7280] transition-transform rtl:-scale-x-100 ${expanded ? 'rotate-90 rtl:-rotate-90' : ''}`}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold text-[#102E26]">{label}</p>
        {hint && <p className="mt-0.5 text-xs leading-relaxed text-[#5b6b62]">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-[#57D798]' : 'bg-[#E5E7EB]'}`}
      >
        {/* Logical `start-*` (not `left-*`) so the knob mirrors in RTL. */}
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'start-[22px]' : 'start-0.5'}`}
        />
      </button>
    </div>
  );
}

/** Group title + white card of divided rows (Tarteel-style). */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-[#6B7280]">{title}</h2>
      <div className="divide-y divide-[#E5E7EB] rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        {children}
      </div>
    </section>
  );
}

/** Group title + white padded card (for content blocks, not rows). */
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-[#6B7280]">{title}</h2>
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">{children}</div>
    </section>
  );
}

/** Icon + label (+ optional value line) + chevron row. Button or link. */
function Row({
  icon,
  label,
  value,
  expanded,
  onClick,
  href,
  danger,
}: {
  icon: string;
  label: string;
  value?: string;
  expanded?: boolean;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
}) {
  const inner = (
    <>
      <IconChip name={icon} danger={danger} />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm font-semibold ${danger ? 'text-red-700' : 'text-[#102E26]'}`}>{label}</span>
        {value && <span className="block truncate text-xs text-[#5b6b62]">{value}</span>}
      </span>
      <Chevron expanded={expanded} />
    </>
  );
  const cls = 'flex w-full items-center gap-3 px-4 py-3.5 text-start hover:bg-[#FFFBF2]';
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-expanded={expanded} className={cls}>
      {inner}
    </button>
  );
}

/** Expanded panel under a row, holding the real controls. */
function Panel({ children }: { children: ReactNode }) {
  return <div className="border-t border-[#E5E7EB] bg-[#FFFBF2]/60 px-4 py-4">{children}</div>;
}

function MiniSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-sm font-semibold text-[#102E26]">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full max-w-xs rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm font-normal"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export default function SettingsClient() {
  const [settings, setSettings] = useState<HifzSettings | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [listen, setListen] = useState<ListenPrefs>({ repeat: 1, pauseSec: 0, speed: 1, wordByWord: false });
  const [tafsirId, setTafsirId] = useState<number>(TAFSIR_ID);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const t = useT();

  const toggleOpen = (key: string) => setOpen((cur) => (cur === key ? null : key));

  const translationGroups = useMemo(() => groupByLanguage(TRANSLATIONS), []);
  const tafsirGroups = useMemo(() => groupByLanguage(TAFSIRS), []);
  const reciterGroups = useMemo(() => [{ lang: 'Reciters', items: RECITERS }], []);

  useEffect(() => {
    try {
      setSettings(loadSettings());
    } catch {
      setSettings(null);
    }
    try {
      setListen(loadListenPrefs());
    } catch {
      /* listen defaults stand */
    }
    try {
      const stored = Number(localStorage.getItem(TAFSIR_KEY) ?? '');
      if (Number.isFinite(stored) && stored > 0) setTafsirId(stored);
    } catch {
      /* default tafsir stands */
    }
  }, []);

  const update = (patch: Partial<HifzSettings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
    mirrorAllToIdb();
    // Language/theme go through the i18n store: it re-saves the same
    // values, applies them to <html> (lang/dir/data-theme) and notifies
    // every subscriber (bottom tabs, onboarding) so the whole shell
    // re-renders in the new language/theme immediately — no reload.
    if (patch.theme) setUiTheme(patch.theme);
    if (patch.language && isSupportedLocale(patch.language)) setUiLocale(patch.language);
  };

  const updateListen = (patch: Partial<ListenPrefs>) => {
    const next = { ...listen, ...patch };
    setListen(next);
    try {
      // Merge into the stored object so the per-surah ayah range
      // (fromAyah/toAyah) the surah page keeps in the same key survives.
      const raw = localStorage.getItem(LISTEN_KEY);
      const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      localStorage.setItem(LISTEN_KEY, JSON.stringify({ ...prev, ...next }));
    } catch {
      /* storage unavailable — prefs stay in memory for this visit */
    }
  };

  const updateTafsir = (id: number) => {
    setTafsirId(id);
    try {
      localStorage.setItem(TAFSIR_KEY, String(id));
    } catch {
      /* storage unavailable */
    }
  };

  const doExport = () => {
    try {
      const progress = loadProgress();
      const mistakes = loadMistakes();
      // Stage 7 (§24): the backup must carry EVERYTHING — bookmarks and
      // group challenges included, not just progress/mistakes/settings.
      downloadProgressJson(
        `hifz-${localDateString()}.json`,
        exportProgress(progress, mistakes, settings!, {
          bookmarks: loadBookmarks(),
          challenges: loadChallenges(),
        }),
      );
    } catch {
      setMsg('Export failed — browser storage is unavailable.');
    }
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = importProgress(String(reader.result ?? ''));
      if (!result.ok) {
        setImportMsg(result.error);
        return;
      }
      // Stage 7 (§24): an import restores the whole backup — bookmarks
      // and challenges included. (Before this fix the import validated
      // them and then silently dropped them.)
      saveProgress(result.progress);
      saveMistakes(result.mistakes);
      saveSettings(result.settings);
      saveBookmarks(result.bookmarks);
      saveChallenges(result.challenges);
      mirrorAllToIdb();
      setSettings(result.settings);
      setImportMsg('Progress imported successfully.');
      // An import can carry a different language/theme — apply it at once.
      syncPrefsFromStorage();
    };
    reader.onerror = () => setImportMsg('That file could not be read.');
    reader.readAsText(file);
  };

  const clearAll = () => {
    if (!window.confirm('Delete ALL your Hifz data on this device — progress, mistakes, goals, settings and saved audio recordings? This cannot be undone. Export first if you want a copy.')) return;
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith('ili_') || k.startsWith('quran_bookmarks')) localStorage.removeItem(k);
      }
      if (typeof indexedDB !== 'undefined') {
        indexedDB.deleteDatabase('ili-hifz');
      }
      setMsg('Everything on this device was cleared. Reload the page to start fresh.');
      // Reset the live locale/theme to the defaults right away.
      resetUiPrefsToDefaults();
    } catch {
      setMsg('Clear failed — browser storage is unavailable.');
    }
  };

  if (!settings) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <p className="text-sm text-[#5b6b62]">{t('set.loading')}</p>
      </div>
    );
  }

  const localeName =
    SUPPORTED_LOCALES.find((l) => l.code === (settings.language ?? 'en'))?.name ?? 'English';
  const themeLabel =
    (settings.theme ?? 'light') === 'dark'
      ? t('set.themeDark')
      : (settings.theme ?? 'light') === 'sepia'
        ? t('set.themeSepia')
        : t('set.themeLight');
  const listenValue =
    `Repeat ${listen.repeat}× · ${listen.speed}× speed` +
    (listen.wordByWord ? ' · Word by word' : '');

  return (
    <div className="space-y-6">
      {msg && (
        <p role="status" className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1FA36B]">
          {msg}
        </p>
      )}

      {/* Promo banner — Testing Mode (own words, no copied Tarteel copy). */}
      <section
        aria-label="New feature: Testing Mode"
        className="rounded-2xl border border-[#F2C94C] bg-[#FFF7D6] p-5 shadow-sm"
      >
        <p className="text-xs font-bold uppercase tracking-wide text-[#7A5C00]">New feature</p>
        <h2 className="mt-1 text-lg font-bold text-[#102E26]">Testing Mode</h2>
        <p className="mt-1 text-sm leading-relaxed text-[#5b6b62]">
          Put your memory to the test — the app quizzes you on verses from anywhere in the
          Quran, so you find the weak spots before they find you.
        </p>
        <Link
          href="/hifz/test"
          className="mt-3 inline-block rounded-full bg-[#FFB800] px-5 py-2.5 text-sm font-bold text-[#102E26] hover:brightness-105"
        >
          TEST YOURSELF
        </Link>
      </section>

      {/* Experiences */}
      <Group title="Experiences">
        <div>
          <Row
            icon="mic"
            label={t('set.recitation')}
            value={reciterName(settings.reciterId)}
            expanded={open === 'recitation'}
            onClick={() => toggleOpen('recitation')}
          />
          {open === 'recitation' && (
            <Panel>
              <div className="divide-y divide-[#E5E7EB]">
                <Toggle
                  label={t('set.detectMistakes')}
                  hint="Flag incorrect, extra, missed and skipped words as you recite. Off = follow-along only: the app highlights words but never judges them."
                  checked={settings.detectMistakes ?? true}
                  onChange={(v) => update({ detectMistakes: v })}
                />
                <Toggle
                  label={t('set.strictHarakat')}
                  hint="On: a word said with the wrong vowel marks counts as a mistake. Off: harakat differences are ignored. This is about vowel marks only — the checker never judges tajweed."
                  checked={settings.harakatStrict ?? false}
                  onChange={(v) => update({ harakatStrict: v })}
                />
                <Toggle
                  label={t('set.dontProgress')}
                  hint="On: after a session with mistakes, you must retry those words before moving to the next ayah. Off: you can continue past a wrongly-flagged word."
                  checked={settings.dontProgress ?? false}
                  onChange={(v) => update({ dontProgress: v })}
                />
              </div>
              <Link
                href="/hifz/recite"
                className="mt-3 flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
              >
                <span>Open the recitation coach</span>
                <span aria-hidden="true">›</span>
              </Link>
            </Panel>
          )}
        </div>
        <div>
          <Row
            icon="headphones"
            label="Listening"
            value={listenValue}
            expanded={open === 'listening'}
            onClick={() => toggleOpen('listening')}
          />
          {open === 'listening' && (
            <Panel>
              <div className="space-y-4">
                <MiniSelect
                  label="Repeat each ayah"
                  value={String(listen.repeat)}
                  onChange={(v) => updateListen({ repeat: Number(v) })}
                  options={[
                    { value: '1', label: 'Once' },
                    { value: '2', label: '2 times' },
                    { value: '3', label: '3 times' },
                    { value: '5', label: '5 times' },
                    { value: '10', label: '10 times' },
                  ]}
                />
                <MiniSelect
                  label="Pause between repeats"
                  value={String(listen.pauseSec)}
                  onChange={(v) => updateListen({ pauseSec: Number(v) })}
                  options={[
                    { value: '0', label: 'No pause' },
                    { value: '1', label: '1 second' },
                    { value: '2', label: '2 seconds' },
                    { value: '3', label: '3 seconds' },
                    { value: '5', label: '5 seconds' },
                    { value: '10', label: '10 seconds' },
                  ]}
                />
                <MiniSelect
                  label="Playback speed"
                  value={String(listen.speed)}
                  onChange={(v) => updateListen({ speed: Number(v) })}
                  options={[
                    { value: '0.5', label: '0.5×' },
                    { value: '0.75', label: '0.75×' },
                    { value: '1', label: '1× (normal)' },
                    { value: '1.25', label: '1.25×' },
                    { value: '1.5', label: '1.5×' },
                    { value: '2', label: '2×' },
                  ]}
                />
                <div className="divide-y divide-[#E5E7EB]">
                  <Toggle
                    label="Word by word"
                    hint="Play each word's clip in turn, highlighting it as it sounds — for slow, careful listening."
                    checked={listen.wordByWord}
                    onChange={(v) => updateListen({ wordByWord: v })}
                  />
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#5b6b62]">
                These are the same listen settings used on every surah page — change them here
                or there, they stay in sync. The ayah range is picked on the surah itself.
              </p>
            </Panel>
          )}
        </div>
      </Group>

      {/* Quran Appearance */}
      <Group title={t('set.appearance')}>
        <div>
          <Row
            icon="layers"
            label="Mushaf Layout"
            value={(settings.mushafLines ?? 15) === 15 ? t('set.mushaf15') : t('set.mushaf16')}
            expanded={open === 'layout'}
            onClick={() => toggleOpen('layout')}
          />
          {open === 'layout' && (
            <Panel>
              <MiniSelect
                label={t('set.mushafLayout')}
                value={String(settings.mushafLines ?? 15)}
                onChange={(v) => update({ mushafLines: Number(v) as 15 | 16 })}
                options={[
                  { value: '15', label: t('set.mushaf15') },
                  { value: '16', label: t('set.mushaf16') },
                ]}
              />
              <p className="mt-2 text-xs text-[#5b6b62]">
                The Madani mushaf is 15 lines a page. Compact text shows the same page slightly
                smaller; page breaks never change.
              </p>
              <Link
                href="/hifz/setup"
                className="mt-3 flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
              >
                <span>Book settings — mushaf edition &amp; tajweed</span>
                <span aria-hidden="true">›</span>
              </Link>
            </Panel>
          )}
        </div>
        <div>
          <Row
            icon="eye-off"
            label="Hidden Verses"
            value={settings.showForHidden ? 'Washes stay visible when hidden' : 'Hidden words stay hidden'}
            expanded={open === 'hidden'}
            onClick={() => toggleOpen('hidden')}
          />
          {open === 'hidden' && (
            <Panel>
              <div className="divide-y divide-[#E5E7EB]">
                <Toggle
                  label={t('set.showForHidden')}
                  hint="Keep the weak-spot washes visible even while verses are hidden, so you see where to be careful before you recite."
                  checked={settings.showForHidden ?? false}
                  onChange={(v) => update({ showForHidden: v })}
                />
                <Toggle
                  label={t('set.hideAyahMarkers')}
                  hint="Hide the ayah-end rosettes for a true test of memory."
                  checked={settings.hideAyahMarkers ?? false}
                  onChange={(v) => update({ hideAyahMarkers: v })}
                />
              </div>
            </Panel>
          )}
        </div>
        <div>
          <Row
            icon="star"
            label="Marking"
            value={settings.highlightMistakes ?? true ? 'Mistake history highlighted' : 'Mistake history off'}
            expanded={open === 'marking'}
            onClick={() => toggleOpen('marking')}
          />
          {open === 'marking' && (
            <Panel>
              <div className="divide-y divide-[#E5E7EB]">
                <Toggle
                  label={t('set.highlightMistakes')}
                  hint="Words you have missed often show a soft pastel wash on the page — red for most-missed, fading to green as you get them right."
                  checked={settings.highlightMistakes ?? true}
                  onChange={(v) => update({ highlightMistakes: v })}
                />
                <Toggle
                  label={t('set.tajweedColors')}
                  hint="Colour words by the tajweed rule that applies (madd, ghunna, qalqalah…). Display only — this app does not detect tajweed mistakes."
                  checked={settings.tajweedColors ?? false}
                  onChange={(v) => update({ tajweedColors: v })}
                />
                <Toggle
                  label={t('set.topicColors')}
                  hint="Tint each ayah by its topic (Allah & Tawhid, Prophets, Afterlife…) with a legend on the mushaf page. A study aid, not tafsir — every ayah is given one main topic by an automatic mapping."
                  checked={settings.topicColors ?? true}
                  onChange={(v) => update({ topicColors: v })}
                />
              </div>
            </Panel>
          )}
        </div>
      </Group>

      {/* Appearance */}
      <Group title="Appearance">
        <div>
          <Row
            icon="globe"
            label={t('set.language')}
            value={localeName}
            expanded={open === 'language'}
            onClick={() => toggleOpen('language')}
          />
          {open === 'language' && (
            <Panel>
              <MiniSelect
                label={t('set.interfaceLanguage')}
                value={settings.language ?? 'en'}
                onChange={(v) => update({ language: v })}
                options={SUPPORTED_LOCALES.map((l) => ({ value: l.code, label: l.name }))}
              />
              <p className="mt-2 text-xs text-[#5b6b62]">{t('set.languageHint')}</p>
            </Panel>
          )}
        </div>
        <div>
          <Row
            icon="sun"
            label={t('set.theme')}
            value={themeLabel}
            expanded={open === 'theme'}
            onClick={() => toggleOpen('theme')}
          />
          {open === 'theme' && (
            <Panel>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t('set.theme')}>
                {(
                  [
                    ['light', t('set.themeLight')],
                    ['dark', t('set.themeDark')],
                    ['sepia', t('set.themeSepia')],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={(settings.theme ?? 'light') === v}
                    onClick={() => update({ theme: v })}
                    className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${
                      (settings.theme ?? 'light') === v ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB] bg-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#5b6b62]">{t('set.themeHint')}</p>
            </Panel>
          )}
        </div>
      </Group>

      {/* Notifications */}
      <Group title="Notifications">
        <div>
          <Row
            icon="bell"
            label={t('set.reminders')}
            value="On-device only — no push notifications"
            expanded={open === 'reminders'}
            onClick={() => toggleOpen('reminders')}
          />
          {open === 'reminders' && (
            <Panel>
              <p className="text-sm leading-relaxed text-[#5b6b62]">
                The app works fully without an account, so it cannot send push notifications. Your
                daily goal and streak are shown on the home screen and Progress tab instead — open
                the app once a day and the streak stays alive. In-app reminders (a banner when your
                goal is unmet by the evening) are planned; nothing is promised here that is not built.
              </p>
            </Panel>
          )}
        </div>
      </Group>

      {/* Sounds & Haptics — only rows with a real setting behind them.
          There is no "session start/stop" sound and no "dropped connection"
          sound anywhere in the app (no such fields in HifzSettings, no
          sound prefs in the codebase), so those two rows are omitted
          rather than added as dead rows. */}
      <Group title="Sounds & Haptics">
        <div className="flex items-center gap-3 px-4">
          <IconChip name="volume" />
          <div className="min-w-0 flex-1">
            <Toggle
              label="Mistake Feedback"
              hint="The coach flags wrong, extra and missed words as you recite. Off = follow-along only, no mistake flags."
              checked={settings.detectMistakes ?? true}
              onChange={(v) => update({ detectMistakes: v })}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 px-4">
          <IconChip name="target" />
          <div className="min-w-0 flex-1">
            <Toggle
              label="Testing Mode"
              hint="Play a sound (and vibrate, on phones) when a test question finishes."
              checked={settings.testSound ?? true}
              onChange={(v) => update({ testSound: v })}
            />
          </div>
        </div>
      </Group>

      {/* Downloads — each row opens the real picker (same catalogues and
          storage keys the surah pages use). */}
      <Group title="Downloads">
        <div>
          <Row
            icon="download"
            label="Reciters"
            value={reciterName(settings.reciterId)}
            expanded={open === 'reciters'}
            onClick={() => toggleOpen('reciters')}
          />
          {open === 'reciters' && (
            <Panel>
              <SearchablePicker
                label="Reciter"
                value={settings.reciterId}
                groups={reciterGroups}
                onChange={(id) => update({ reciterId: id })}
                searchPlaceholder="Search reciters…"
                noResults="No reciters match your search."
              />
              <p className="mt-2 text-xs text-[#5b6b62]">
                Used for Listen audio everywhere — surah pages, Recite and Tests.
              </p>
            </Panel>
          )}
        </div>
        <div>
          <Row
            icon="download"
            label="Translations"
            value={translationName(settings.translationId)}
            expanded={open === 'translations'}
            onClick={() => toggleOpen('translations')}
          />
          {open === 'translations' && (
            <Panel>
              <SearchablePicker
                label="Translation"
                value={settings.translationId}
                groups={translationGroups}
                onChange={(id) => update({ translationId: id })}
                searchPlaceholder="Search translations…"
                noResults="No translations match your search."
              />
              <p className="mt-2 text-xs text-[#5b6b62]">
                Shown on surah pages and in the reader, in the language you pick.
              </p>
            </Panel>
          )}
        </div>
        <div>
          <Row
            icon="download"
            label="Tafsir"
            value={tafsirName(tafsirId)}
            expanded={open === 'tafsir'}
            onClick={() => toggleOpen('tafsir')}
          />
          {open === 'tafsir' && (
            <Panel>
              <SearchablePicker
                label="Tafsir"
                value={tafsirId}
                groups={tafsirGroups}
                onChange={(id) => updateTafsir(id)}
                searchPlaceholder="Search tafsirs…"
                noResults="No tafsirs match your search."
              />
              <p className="mt-2 text-xs text-[#5b6b62]">
                Shown on surah pages in Tafsir view.
              </p>
            </Panel>
          )}
        </div>
      </Group>

      {/* Privacy */}
      <Group title={t('set.privacy')}>
        <div>
          <Row
            icon="database"
            label={t('set.dataUsage')}
            value={(settings.saveAudio ?? true) ? 'Session audio saved on this device' : 'Session audio not saved'}
            expanded={open === 'data'}
            onClick={() => toggleOpen('data')}
          />
          {open === 'data' && (
            <Panel>
              <div className="divide-y divide-[#E5E7EB]">
                <Toggle
                  label={t('set.saveAudio')}
                  hint="Keep your own recitation recordings on this device so you can listen back to them. Recordings never leave the device unless you choose to share one, and are never uploaded by the app."
                  checked={settings.saveAudio ?? true}
                  onChange={(v) => update({ saveAudio: v })}
                />
              </div>
              <p className="mt-3 text-sm text-[#5b6b62]">
                Progress is also mirrored into IndexedDB on this device (with a one-time migration of
                your existing progress), so it survives even if localStorage is cleared by the browser.
                As a guest, nothing is ever sent to a server. If you choose to create an optional
                account (see “Account” below), your progress is also backed up to your
                account so it follows you to other devices — and only then.
              </p>
            </Panel>
          )}
        </div>
        <div>
          {/* No audio-only delete exists in the app: recordings are
              per-session blobs gated by the save-audio toggle above, and
              the only delete is the existing clear-all. This row runs
              that same clear-all, and says so plainly before confirming. */}
          <Row
            icon="trash"
            label="Delete All Audio Data"
            value="Deletes everything on this device, including saved audio"
            danger
            onClick={clearAll}
          />
        </div>
        <div className="px-4 py-4">
          <p className="text-sm leading-relaxed text-[#5b6b62]">
            Everything in this app lives on your device by default: progress, mistakes, goals,
            recordings. Your voice is processed on this device by the downloaded checker — audio is
            never uploaded, never sold, never shared. There is no tracking and no advertising, and
            no account is ever required. If you choose to create an optional account (see “Account”
            below), only your email address and your progress records (which surahs
            you have memorised, your goals, bookmarks, test results and settings) are stored online,
            so your progress follows you to other devices. You can delete your progress on this
            device, or delete your account and its cloud backup, from that same section. The only
            other network calls are to fetch Quran text, translations and reciter audio.
          </p>
        </div>
      </Group>

      {/* More — Account */}
      <section aria-label="Account">
        <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-[#6B7280]">Account</h2>
        <AccountSection />
      </section>

      {/* More — Your data */}
      <Card title={t('set.yourData')}>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={doExport}
            className="min-h-11 rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B]"
          >
            {t('set.export')}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="min-h-11 rounded-full border border-[#102E26] px-5 py-2.5 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
          >
            {t('set.import')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            aria-label="Choose a progress export file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) doImport(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={clearAll}
            className="min-h-11 rounded-full border border-red-700 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            {t('set.clear')}
          </button>
        </div>
        {importMsg && (
          <p role="status" className="mt-3 text-sm font-semibold text-[#1FA36B]">{importMsg}</p>
        )}
        <p className="mt-3 text-sm text-[#5b6b62]">
          The backup file holds your progress, mistakes, settings, bookmarks and group challenges —
          everything needed to restore this device. It never leaves your device unless you choose
          to keep the file somewhere yourself.
        </p>
      </Card>

      {/* More — Microphone help */}
      <Card title={t('set.micHelp')}>
        {/* Logical `ps-*` (not `pl-*`) so the list indent mirrors in RTL. */}
        <ul className="list-disc space-y-1 ps-5 text-sm leading-relaxed text-[#5b6b62]">
          <li>The checker needs microphone permission. If it is blocked, allow it in your browser&apos;s site settings (padlock icon → microphone → Allow).</li>
          <li>Recite in a quiet room, close to the microphone. Background noise and Bluetooth or car microphones cause false flags.</li>
          <li>Long madd (stretching a word for 6 counts) is the checker&apos;s known weak spot — if it flags a correct long stretch, remove the mistake from your history.</li>
          <li>The checker works offline once the model has downloaded (about 25 MB, first recitation). Quran text and reciter audio still need a connection unless saved for offline use.</li>
          <li>If the checker seems stuck on one ayah, tap “Practice without mic” and self-mark instead — the session still counts.</li>
        </ul>
      </Card>

      {/* More — Support / donate (Settings only) */}
      <Card title={t('set.support')}>
        <p className="text-sm leading-relaxed text-[#5b6b62]">
          This app is free forever — no Premium, no paywall, no ads. If it helps your hifz and
          you would like to help keep it running, you can donate. Donations are optional and
          never unlock anything: everything is already free.
        </p>
        <a
          href="/about#support"
          className="mt-3 inline-block rounded-full bg-[#FFB800] px-5 py-2.5 text-sm font-bold text-[#102E26] hover:brightness-105"
        >
          {t('set.donate')}
        </a>
      </Card>
    </div>
  );
}
