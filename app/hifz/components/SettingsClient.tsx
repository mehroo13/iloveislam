// app/hifz/components/SettingsClient.tsx — Settings (spec §22), Tarteel-style
// grouped white cards: bold black section titles inside the card, plain
// black icon + label-only rows with grey chevrons, no subtitles, no icon
// chips. Each row expands to its detail panel (the current value lives
// there, not on the row). Restructure + restyle only: every pre-existing
// setting and behaviour is preserved (language, theme, recitation coach,
// Quran appearance, data usage, reminders, sounds, downloads, privacy,
// account, export/import/clear, mic help, support) — the long blocks
// (account, your data, mic help, support) now live on detail screens
// under /hifz/settings/* and are linked from here instead of inline.
'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  loadSettings, saveSettings,
  type HifzSettings,
} from '../progress';
import { mirrorAllToIdb, deleteAllSessionAudio } from '../lib/store';
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
    case 'user':
      return (<svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></svg>);
    default:
      return (<svg {...common}><circle cx="12" cy="12" r="10" /></svg>);
  }
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
      className={`shrink-0 text-[#9CA3AF] transition-transform rtl:-scale-x-100 ${expanded ? 'rotate-90 rtl:-rotate-90' : ''}`}
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
        <p className="text-sm font-semibold text-[#111827]">{label}</p>
        {hint && <p className="mt-0.5 text-xs leading-relaxed text-[#6B7280]">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-[#57D798]' : 'bg-[#E8EAED]'}`}
      >
        {/* Logical `start-*` (not `left-*`) so the knob mirrors in RTL. */}
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'start-[22px]' : 'start-0.5'}`}
        />
      </button>
    </div>
  );
}

/** White card with the bold black section title as its first row. */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <div className="overflow-hidden rounded-xl border border-[#E8EAED] bg-white">
        <h2 className="border-b border-[#E8EAED] px-4 py-3 text-[17px] font-bold text-[#111827]">{title}</h2>
        <div className="divide-y divide-[#E8EAED]">{children}</div>
      </div>
    </section>
  );
}

/** Plain black icon + label only + grey chevron row. Button or link. */
function Row({
  icon,
  label,
  expanded,
  onClick,
  href,
}: {
  icon: string;
  label: string;
  expanded?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <>
      <span aria-hidden="true" className="shrink-0 text-[#111827]">
        <Icon name={icon} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#111827]">{label}</span>
      <Chevron expanded={expanded} />
    </>
  );
  const cls = 'flex w-full items-center gap-3 px-4 py-3.5 text-start hover:bg-[#F3F4F6]';
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

/** Expanded panel under a row — the row's detail screen. */
function Panel({ children }: { children: ReactNode }) {
  return <div className="border-t border-[#E8EAED] bg-[#F4F5F7]/60 px-4 py-4">{children}</div>;
}

/** The row's current value, shown inside its detail panel (not on the row). */
function Current({ label, value }: { label: string; value: string }) {
  return (
    <p className="mb-3 text-xs text-[#6B7280]">
      {label}: <span className="font-semibold text-[#111827]">{value}</span>
    </p>
  );
}

/** Link row inside a detail panel (e.g. open the coach, mic help). */
function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-3 flex items-center justify-between rounded-xl border border-[#E8EAED] bg-white px-4 py-3 text-sm font-semibold text-[#111827] hover:bg-[#E4FFF2]"
    >
      <span>{children}</span>
      <span aria-hidden="true">›</span>
    </Link>
  );
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
    <label className="block text-sm font-semibold text-[#111827]">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full max-w-xs rounded-lg border border-[#E8EAED] bg-white px-3 py-2.5 text-sm font-normal"
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
  const [open, setOpen] = useState<string | null>(null);
  const [listen, setListen] = useState<ListenPrefs>({ repeat: 1, pauseSec: 0, speed: 1, wordByWord: false });
  const [tafsirId, setTafsirId] = useState<number>(TAFSIR_ID);
  const t = useT();

  /* --- Reminders (opt-in local notifications, no push, no server) ---
     Goals live under the same key GoalsClient uses ('ili_goals_v1'), with
     the same shape ({ id, name, remind, remindTime }) — toggling here and
     toggling on the Goals page are the same setting. Notification
     permission is requested ONLY when the user turns a reminder on. */
  type ReminderGoal = { id: string; name: string; remind?: boolean; remindTime?: string };
  const GOALS_KEY = 'ili_goals_v1';
  const [reminderGoals, setReminderGoals] = useState<ReminderGoal[]>([]);
  const [perm, setPerm] = useState<string>('unsupported');
  const [reminderNote, setReminderNote] = useState<string | null>(null);

  const loadReminderGoals = (): ReminderGoal[] => {
    try {
      const raw = localStorage.getItem(GOALS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ReminderGoal[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const persistReminderGoals = (next: ReminderGoal[]) => {
    try {
      // Merge into the stored goals (not a blind overwrite) so fields
      // GoalsClient owns (range, schedule, sessions…) survive.
      const raw = localStorage.getItem(GOALS_KEY);
      const stored = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : [];
      const byId = new Map(next.map((g) => [g.id, g]));
      const merged = Array.isArray(stored)
        ? stored.map((g) =>
            byId.has(String(g.id))
              ? { ...g, remind: byId.get(String(g.id))!.remind, remindTime: byId.get(String(g.id))!.remindTime }
              : g,
          )
        : next;
      localStorage.setItem(GOALS_KEY, JSON.stringify(merged));
    } catch {
      /* storage unavailable — state stays in memory for this visit */
    }
    setReminderGoals(next);
    // The app shell (PWAProvider) re-checks due reminders on this event.
    window.dispatchEvent(new Event('ili-reminders-changed'));
  };

  /** Turn a goal's reminder on/off. Enabling requests notification
      permission at that moment only; if it is denied (or already
      blocked) the reminder stays off and the UI says so honestly. */
  const setReminderGoal = async (id: string, remind: boolean, remindTime?: string) => {
    if (remind) {
      if (typeof Notification === 'undefined') {
        setReminderNote('This browser does not support notifications, so reminders cannot be turned on here.');
        return;
      }
      if (Notification.permission === 'denied') {
        setReminderNote('Notifications are blocked for this site in your browser settings, so the reminder was not turned on. Allow notifications for this site first, then try again.');
        return;
      }
      if (Notification.permission !== 'granted') {
        const result = await Notification.requestPermission();
        setPerm(result);
        if (result !== 'granted') {
          setReminderNote('Notification permission was not given, so the reminder was not turned on. Nothing was changed.');
          return;
        }
      }
      setReminderNote(null);
    }
    persistReminderGoals(
      reminderGoals.map((g) =>
        g.id === id
          ? { ...g, remind, ...(remindTime !== undefined ? { remindTime } : {}) }
          : g,
      ),
    );
  };

  /** Next due reminder across enabled goals, e.g. "today at 08:00". */
  const nextReminderText = (): string | null => {
    const enabled = reminderGoals.filter((g) => g.remind && g.remindTime);
    if (enabled.length === 0) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    let best: { day: 'today' | 'tomorrow'; mins: number; time: string } | null = null;
    for (const g of enabled) {
      const [h, m] = (g.remindTime ?? '').split(':').map(Number);
      if (!Number.isFinite(h) || !Number.isFinite(m)) continue;
      const mins = h * 60 + m;
      const cand = mins > nowMin ? { day: 'today' as const, mins, time: g.remindTime! } : { day: 'tomorrow' as const, mins: mins + 1440, time: g.remindTime! };
      if (!best || cand.mins < best.mins) best = cand;
    }
    return best ? `${best.day} at ${best.time}` : null;
  };

  /** Send one test reminder right now (only if permission is granted). */
  const sendTestReminder = async () => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      setReminderNote(t('notif.turnOnFirst'));
      return;
    }
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_REMINDER',
          title: t('notif.reminderTitle'),
          body: t('notif.testReminderBody'),
          url: '/hifz/goals',
        });
      } else {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(t('notif.reminderTitle'), {
          body: t('notif.testReminderBody'),
          icon: '/icon-192.png',
          tag: 'hifz-reminder-test',
        });
      }
      setReminderNote(t('notif.testSent'));
    } catch {
      setReminderNote(t('notif.testFailed'));
    }
  };

  /** TRUE audio-only delete: deleteAllSessionAudio() (audio blob store,
      ../lib/store) purges saved recording blobs only. Progress, mistakes,
      goals and settings are untouched — unlike clear-all below. */
  const deleteAudioOnly = async () => {
    if (!window.confirm(t('rb.set.deleteAudioConfirm'))) return;
    try {
      await deleteAllSessionAudio();
      setMsg(t('rb.set.deleteAudioDeleted'));
    } catch {
      setMsg(t('rb.set.deleteAudioFailed'));
    }
  };

  const toggleOpen = (key: string) => setOpen((cur) => (cur === key ? null : key));

  const translationGroups = useMemo(() => groupByLanguage(TRANSLATIONS), []);
  const tafsirGroups = useMemo(() => groupByLanguage(TAFSIRS), []);
  const reciterGroups = useMemo(() => [{ lang: t('rb.set.reciters'), items: RECITERS }], [t]);

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
    setReminderGoals(loadReminderGoals());
    setPerm(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
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

  const clearAll = () => {
    if (!window.confirm(t('rb.set.deleteAllConfirm'))) return;
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith('ili_') || k.startsWith('quran_bookmarks')) localStorage.removeItem(k);
      }
      if (typeof indexedDB !== 'undefined') {
        indexedDB.deleteDatabase('ili-hifz');
      }
      setMsg(t('rb.set.clearedAll'));
      // Reset the live locale/theme to the defaults right away.
      resetUiPrefsToDefaults();
    } catch {
      setMsg(t('rb.set.clearFailed'));
    }
  };

  if (!settings) {
    return (
      <div className="rounded-xl border border-[#E8EAED] bg-white p-5">
        <p className="text-sm text-[#6B7280]">{t('set.loading')}</p>
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
    t('rb.set.repeatSpeed').replace('{r}', String(listen.repeat)).replace('{s}', String(listen.speed)) +
    (listen.wordByWord ? t('rb.set.wbwSuffix') : '');
  const currentLabel = t('mode.current');

  return (
    <div className="space-y-5">
      {msg && (
        <p role="status" className="rounded-xl border border-[#E8EAED] bg-white px-4 py-3 text-sm font-semibold text-[#1FA36B]">
          {msg}
        </p>
      )}

      {/* Promo banner — Testing Mode. Pink gradient with our own simple
          pill shapes (CSS only, no copied artwork). */}
      <section
        aria-label={t('rb.set.newFeatureTesting')}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FBCFE8] via-[#F472B6] to-[#D946EF] p-5 shadow-sm"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-3 top-4 flex w-32 flex-col items-end gap-2.5 rtl:-left-3 rtl:right-auto"
        >
          <span className="h-6 w-28 -rotate-6 rounded-full bg-[#60A5FA] shadow-md ring-2 ring-white/50" />
          <span className="h-6 w-24 rotate-3 rounded-full bg-[#A78BFA] shadow-md ring-2 ring-white/50" />
          <span className="h-6 w-20 -rotate-3 rounded-full bg-[#FB7185] shadow-md ring-2 ring-white/50" />
          <span className="h-6 w-16 rotate-6 rounded-full bg-[#FBBF24] shadow-md ring-2 ring-white/50" />
          <span className="mt-1 h-3 w-3 rotate-45 rounded-[2px] bg-[#FDE68A] shadow" />
        </div>
        <div className="relative max-w-[62%]">
          <h2 className="text-[17px] font-bold leading-snug text-[#111827]">{t('rb.set.newFeatureTesting')}</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[#3F3F46]">{t('rb.set.testPromo')}</p>
          <Link
            href="/hifz/test"
            className="mt-3 inline-block rounded-full bg-[#FFB800] px-5 py-2.5 text-sm font-bold text-[#111827] shadow-sm hover:brightness-105"
          >{t('rb.set.testYourself')}</Link>
        </div>
      </section>

      {/* Experiences */}
      <Group title={t('rb.set.experiences')}>
        <div>
          <Row
            icon="mic"
            label={t('set.recitation')}
            expanded={open === 'recitation'}
            onClick={() => toggleOpen('recitation')}
          />
          {open === 'recitation' && (
            <Panel>
              <Current label={currentLabel} value={reciterName(settings.reciterId)} />
              <div className="divide-y divide-[#E8EAED]">
                <Toggle
                  label={t('set.detectMistakes')}
                  hint={t('rb.set.detectMistakesHint')}
                  checked={settings.detectMistakes ?? true}
                  onChange={(v) => update({ detectMistakes: v })}
                />
                <Toggle
                  label={t('set.dontProgress')}
                  hint={t('rb.set.retryHint')}
                  checked={settings.dontProgress ?? false}
                  onChange={(v) => update({ dontProgress: v })}
                />
              </div>
              <PanelLink href="/hifz/recite">{t('rb.set.openCoach')}</PanelLink>
              <PanelLink href="/hifz/settings/microphone">{t('set.micHelp')}</PanelLink>
            </Panel>
          )}
        </div>
        <div>
          <Row
            icon="headphones"
            label={t('surah.modeListening')}
            expanded={open === 'listening'}
            onClick={() => toggleOpen('listening')}
          />
          {open === 'listening' && (
            <Panel>
              <Current label={currentLabel} value={listenValue} />
              <div className="space-y-4">
                <MiniSelect
                  label={t('surah.repeatEach')}
                  value={String(listen.repeat)}
                  onChange={(v) => updateListen({ repeat: Number(v) })}
                  options={[
                    { value: '1', label: t('rb.set.once') },
                    { value: '2', label: t('rb.set.timesN').replace('{n}', '2') },
                    { value: '3', label: t('rb.set.timesN').replace('{n}', '3') },
                    { value: '5', label: t('rb.set.timesN').replace('{n}', '5') },
                    { value: '10', label: t('rb.set.timesN').replace('{n}', '10') },
                  ]}
                />
                <MiniSelect
                  label={t('rb.set.pauseBetween')}
                  value={String(listen.pauseSec)}
                  onChange={(v) => updateListen({ pauseSec: Number(v) })}
                  options={[
                    { value: '0', label: t('rb.set.noPause') },
                    { value: '1', label: t('rb.set.second1') },
                    { value: '2', label: t('rb.set.secondsN').replace('{n}', '2') },
                    { value: '3', label: t('rb.set.secondsN').replace('{n}', '3') },
                    { value: '5', label: t('rb.set.secondsN').replace('{n}', '5') },
                    { value: '10', label: t('rb.set.secondsN').replace('{n}', '10') },
                  ]}
                />
                <MiniSelect
                  label={t('rb.set.playbackSpeed')}
                  value={String(listen.speed)}
                  onChange={(v) => updateListen({ speed: Number(v) })}
                  options={[
                    { value: '0.5', label: '0.5×' },
                    { value: '0.75', label: '0.75×' },
                    { value: '1', label: t('rb.set.speedNormal') },
                    { value: '1.25', label: '1.25×' },
                    { value: '1.5', label: '1.5×' },
                    { value: '2', label: '2×' },
                  ]}
                />
                <div className="divide-y divide-[#E8EAED]">
                  <Toggle
                    label={t('surah.wordByWord')}
                    hint={t('rb.set.wbwHint')}
                    checked={listen.wordByWord}
                    onChange={(v) => updateListen({ wordByWord: v })}
                  />
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#6B7280]">{t('rb.set.listenSync')}</p>
            </Panel>
          )}
        </div>
      </Group>

      {/* Quran Appearance */}
      <Group title={t('set.appearance')}>
        <div>
          <Row
            icon="layers"
            label={t('rb.set.mushafLayout')}
            expanded={open === 'layout'}
            onClick={() => toggleOpen('layout')}
          />
          {open === 'layout' && (
            <Panel>
              <Current
                label={currentLabel}
                value={(settings.mushafLines ?? 15) === 15 ? t('set.mushaf15') : t('set.mushaf16')}
              />
              <MiniSelect
                label={t('set.mushafLayout')}
                value={String(settings.mushafLines ?? 15)}
                onChange={(v) => update({ mushafLines: Number(v) as 15 | 16 })}
                options={[
                  { value: '15', label: t('set.mushaf15') },
                  { value: '16', label: t('set.mushaf16') },
                ]}
              />
              <p className="mt-2 text-xs text-[#6B7280]">
                The Madani mushaf is 15 lines a page. Compact text shows the same page slightly
                smaller; page breaks never change.
              </p>
              <PanelLink href="/hifz/setup">Book settings — mushaf edition &amp; tajweed</PanelLink>
            </Panel>
          )}
        </div>
        <div>
          <Row
            icon="eye-off"
            label={t('rb.set.hiddenVerses')}
            expanded={open === 'hidden'}
            onClick={() => toggleOpen('hidden')}
          />
          {open === 'hidden' && (
            <Panel>
              <Current
                label={currentLabel}
                value={settings.showForHidden ? t('rb.set.washesVisible') : t('rb.set.hiddenStayHidden')}
              />
              <div className="divide-y divide-[#E8EAED]">
                <Toggle
                  label={t('set.showForHidden')}
                  hint={t('rb.set.weakWashHint')}
                  checked={settings.showForHidden ?? false}
                  onChange={(v) => update({ showForHidden: v })}
                />
                <Toggle
                  label={t('set.hideAyahMarkers')}
                  hint={t('rb.set.hideMarkersHint')}
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
            label={t('rb.set.marking')}
            expanded={open === 'marking'}
            onClick={() => toggleOpen('marking')}
          />
          {open === 'marking' && (
            <Panel>
              <Current
                label={currentLabel}
                value={(settings.highlightMistakes ?? true) ? t('rb.set.mistakesOn') : t('rb.set.mistakesOff')}
              />
              <div className="divide-y divide-[#E8EAED]">
                <Toggle
                  label={t('set.highlightMistakes')}
                  hint={t('rb.set.washHint')}
                  checked={settings.highlightMistakes ?? true}
                  onChange={(v) => update({ highlightMistakes: v })}
                />
                <Toggle
                  label={t('set.tajweedColors')}
                  hint={t('rb.set.tajweedHintLong')}
                  checked={settings.tajweedColors ?? false}
                  onChange={(v) => update({ tajweedColors: v })}
                />
              </div>
            </Panel>
          )}
        </div>
      </Group>

      {/* Appearance */}
      <Group title={t('rb.set.appearance')}>
        <div>
          <Row
            icon="globe"
            label={t('set.language')}
            expanded={open === 'language'}
            onClick={() => toggleOpen('language')}
          />
          {open === 'language' && (
            <Panel>
              <Current label={currentLabel} value={localeName} />
              <MiniSelect
                label={t('set.interfaceLanguage')}
                value={settings.language ?? 'en'}
                onChange={(v) => update({ language: v })}
                options={SUPPORTED_LOCALES.map((l) => ({ value: l.code, label: l.name }))}
              />
              <p className="mt-2 text-xs text-[#6B7280]">{t('set.languageHint')}</p>
            </Panel>
          )}
        </div>
        <div>
          <Row
            icon="sun"
            label={t('set.theme')}
            expanded={open === 'theme'}
            onClick={() => toggleOpen('theme')}
          />
          {open === 'theme' && (
            <Panel>
              <Current label={currentLabel} value={themeLabel} />
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
                      (settings.theme ?? 'light') === v ? 'bg-[#102E26] text-white' : 'border border-[#E8EAED] bg-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#6B7280]">{t('set.themeHint')}</p>
            </Panel>
          )}
        </div>
      </Group>

      {/* Notifications */}
      <Group title={t('rb.set.notifications')}>
        <div>
          <Row
            icon="bell"
            label={t('set.reminders')}
            expanded={open === 'reminders'}
            onClick={() => toggleOpen('reminders')}
          />
          {open === 'reminders' && (
            <Panel>
              {/* Real opt-in local reminders (no push, no server): the app
                  itself shows a notification on this device at the goal's
                  reminder time. Permission is requested only when a
                  reminder is turned on. The per-goal in-app banner on the
                  Goals page still exists alongside this. */}
              <Current
                label={currentLabel}
                value={
                  perm === 'denied'
                    ? t('rb.set.reminderBlocked')
                    : reminderGoals.some((g) => g.remind)
                      ? t('rb.set.reminderOnNext').replace('{time}', nextReminderText() ?? '')
                      : t('common.off')
                }
              />
              <p className="mb-3 text-sm leading-relaxed text-[#6B7280]">
                {t('rb.set.remindersLocalNote')}
                {perm === 'denied' && ` ${t('rb.set.remindersBlockedNote')}`}
              </p>
              {reminderGoals.length === 0 ? (
                <p className="text-sm leading-relaxed text-[#6B7280]">
                  {t('rb.set.noGoalsForReminder')}
                </p>
              ) : (
                <div className="divide-y divide-[#E8EAED]">
                  {reminderGoals.map((g) => (
                    <div key={g.id} className="py-1">
                      <Toggle
                        label={g.name}
                        checked={!!g.remind}
                        onChange={(v) => {
                          void setReminderGoal(g.id, v, g.remindTime ?? '08:00');
                        }}
                      />
                      {g.remind && (
                        <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-[#111827]">
                          {t('rb.set.atLabel')}
                          <input
                            type="time"
                            value={g.remindTime ?? '08:00'}
                            onChange={(e) => {
                              void setReminderGoal(g.id, true, e.target.value);
                            }}
                            className="min-h-11 rounded-lg border border-[#E8EAED] bg-white px-2 py-1.5 text-sm"
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {reminderGoals.some((g) => g.remind) && perm === 'granted' && (
                <button
                  type="button"
                  onClick={() => {
                    void sendTestReminder();
                  }}
                  className="mt-3 min-h-11 rounded-full border border-[#E8EAED] bg-white px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#E4FFF2]"
                >
                  {t('notif.sendTestReminder')}
                </button>
              )}
              {reminderNote && (
                <p role="status" className="mt-3 text-sm leading-relaxed text-[#111827]">
                  {reminderNote}
                </p>
              )}
              <p className="mt-3 text-xs leading-relaxed text-[#6B7280]">
                {t('rb.set.streakHomeNote')}
              </p>
            </Panel>
          )}
        </div>
      </Group>

      {/* Sounds & Haptics — chevron rows; the toggles live on the detail
          panels. There is no "session start/stop" sound and no "dropped
          connection" sound anywhere in the app (no such fields in
          HifzSettings, no sound prefs in the codebase), so those two rows
          are omitted rather than added as dead rows. */}
      <Group title={t('rb.set.sounds')}>
        <div>
          <Row
            icon="volume"
            label={t('rb.set.mistakeFeedback')}
            expanded={open === 'mistakeSound'}
            onClick={() => toggleOpen('mistakeSound')}
          />
          {open === 'mistakeSound' && (
            <Panel>
              <Toggle
                label={t('rb.set.mistakeFeedback')}
                hint={t('rb.set.mistakeFeedbackHint')}
                checked={settings.detectMistakes ?? true}
                onChange={(v) => update({ detectMistakes: v })}
              />
            </Panel>
          )}
        </div>
        <div>
          <Row
            icon="target"
            label={t('rb.set.testingMode')}
            expanded={open === 'testSound'}
            onClick={() => toggleOpen('testSound')}
          />
          {open === 'testSound' && (
            <Panel>
              <Toggle
                label={t('rb.set.testingMode')}
                hint={t('rb.set.soundHint')}
                checked={settings.testSound ?? true}
                onChange={(v) => update({ testSound: v })}
              />
            </Panel>
          )}
        </div>
      </Group>

      {/* Downloads — each row opens the real picker (same catalogues and
          storage keys the surah pages use). The picker button already
          shows the current selection. */}
      <Group title={t('rb.set.downloads')}>
        <div>
          <Row
            icon="download"
            label={t('rb.set.reciters')}
            expanded={open === 'reciters'}
            onClick={() => toggleOpen('reciters')}
          />
          {open === 'reciters' && (
            <Panel>
              <SearchablePicker
                label={t('surah.reciter')}
                value={settings.reciterId}
                groups={reciterGroups}
                onChange={(id) => update({ reciterId: id })}
                searchPlaceholder={t('rb.set.searchReciters')}
                noResults={t('rb.set.noReciters')}
              />
              <p className="mt-2 text-xs text-[#6B7280]">{t('rb.set.listenEverywhere')}</p>
            </Panel>
          )}
        </div>
        <div>
          <Row
            icon="download"
            label={t('rb.set.translations')}
            expanded={open === 'translations'}
            onClick={() => toggleOpen('translations')}
          />
          {open === 'translations' && (
            <Panel>
              <SearchablePicker
                label={t('surah.translation')}
                value={settings.translationId}
                groups={translationGroups}
                onChange={(id) => update({ translationId: id })}
                searchPlaceholder={t('picker.searchTranslations')}
                noResults={t('rb.set.noTranslations')}
              />
              <p className="mt-2 text-xs text-[#6B7280]">{t('rb.set.shownLang')}</p>
            </Panel>
          )}
        </div>
        <div>
          <Row
            icon="download"
            label={t('surah.tafsir')}
            expanded={open === 'tafsir'}
            onClick={() => toggleOpen('tafsir')}
          />
          {open === 'tafsir' && (
            <Panel>
              <SearchablePicker
                label={t('surah.tafsir')}
                value={tafsirId}
                groups={tafsirGroups}
                onChange={(id) => updateTafsir(id)}
                searchPlaceholder={t('picker.searchTafsirs')}
                noResults={t('rb.set.noTafsirs')}
              />
              <p className="mt-2 text-xs text-[#6B7280]">{t('rb.set.shownTafsir')}</p>
            </Panel>
          )}
        </div>
      </Group>

      {/* Privacy — the last section on the page, like Tarteel. Your Data
          and Account live here as single rows to their detail screens
          (both are data matters); the long privacy paragraph now lives
          inside the Data Usage detail panel. */}
      <Group title={t('set.privacy')}>
        <div>
          <Row
            icon="database"
            label={t('set.dataUsage')}
            expanded={open === 'data'}
            onClick={() => toggleOpen('data')}
          />
          {open === 'data' && (
            <Panel>
              <div className="divide-y divide-[#E8EAED]">
                <Toggle
                  label={t('set.saveAudio')}
                  hint={t('rb.set.recordingsHint')}
                  checked={settings.saveAudio ?? true}
                  onChange={(v) => update({ saveAudio: v })}
                />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
                {t('rb.set.indexedDbNoteA')}
                <Link href="/hifz/settings/account" className="font-semibold text-[#111827] underline">
                  {t('rb.set.accountWord')}
                </Link>
                {t('rb.set.indexedDbNoteB')}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">{t('rb.set.privacyLong')}</p>
            </Panel>
          )}
        </div>
        <div>
          {/* Audio-only delete: purges saved recording blobs only — progress,
              mistakes, goals and settings stay exactly as they are. */}
          <Row
            icon="trash"
            label={t('rb.set.deleteAudioRecordings')}
            expanded={open === 'deleteAudio'}
            onClick={() => toggleOpen('deleteAudio')}
          />
          {open === 'deleteAudio' && (
            <Panel>
              <p className="text-sm leading-relaxed text-[#6B7280]">
                {t('rb.set.deleteAudioOnlyNote')}
              </p>
              <button
                type="button"
                onClick={() => {
                  void deleteAudioOnly();
                }}
                className="mt-3 min-h-11 rounded-full bg-[#B91C1C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#991B1B]"
              >
                {t('rb.set.deleteAudioRecordings')}
              </button>
            </Panel>
          )}
        </div>
        <div>
          {/* Delete everything: the existing clear-all — progress, mistakes,
              goals, settings and saved audio. Labelled honestly. */}
          <Row
            icon="trash"
            label={t('rb.set.deleteAllData')}
            expanded={open === 'deleteAll'}
            onClick={() => toggleOpen('deleteAll')}
          />
          {open === 'deleteAll' && (
            <Panel>
              <p className="text-sm leading-relaxed text-[#6B7280]">
                {t('rb.set.deleteAllNote')}
              </p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-3 min-h-11 rounded-full bg-[#B91C1C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#991B1B]"
              >
                {t('rb.set.deleteAllData')}
              </button>
            </Panel>
          )}
        </div>
        <div>
          <Row icon="database" label={t('set.yourData')} href="/hifz/settings/data" />
        </div>
        <div>
          <Row icon="user" label={t('rb.set.account')} href="/hifz/settings/account" />
        </div>
      </Group>

      {/* Footer link only — the page's sections end at Privacy. */}
      <div className="pt-1 text-center">
        <Link
          href="/hifz/settings/support"
          className="text-sm font-semibold text-[#1FA36B] underline-offset-2 hover:underline"
        >
          {t('set.support')} ›
        </Link>
      </div>
    </div>
  );
}
