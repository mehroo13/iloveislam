// app/hifz/components/SettingsClient.tsx — Settings (spec §22).
// Languages incl. Hindi + Urdu (full RTL for Arabic + Urdu), themes
// (light/dark/sepia), mushaf prefs, recitation prefs, notifications,
// mic help, export/import, clear all data, privacy notice, and the only
// donation link on the site (Settings only — never on the hub or reader).
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  loadProgress, loadMistakes, loadSettings, saveSettings,
  exportProgress, importProgress, downloadProgressJson,
  localDateString,
  type HifzSettings,
} from '../progress';
import { mirrorAllToIdb } from '../lib/store';

const LANGUAGES: { code: string; name: string; rtl: boolean }[] = [
  { code: 'en', name: 'English', rtl: false },
  { code: 'ar', name: 'العربية (Arabic)', rtl: true },
  { code: 'ur', name: 'اردو (Urdu)', rtl: true },
  { code: 'fr', name: 'Français (French)', rtl: false },
  { code: 'id', name: 'Bahasa Indonesia', rtl: false },
  { code: 'ms', name: 'Bahasa Melayu (Malay)', rtl: false },
  { code: 'ru', name: 'Русский (Russian)', rtl: false },
  { code: 'hi', name: 'हिन्दी (Hindi)', rtl: false },
];

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
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}
        />
      </button>
    </div>
  );
}

export default function SettingsClient() {
  const [settings, setSettings] = useState<HifzSettings | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      setSettings(loadSettings());
    } catch {
      setSettings(null);
    }
  }, []);

  const update = (patch: Partial<HifzSettings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
    mirrorAllToIdb();
    if (patch.theme) {
      if (patch.theme === 'light') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', patch.theme);
    }
    if (patch.language) {
      const lang = LANGUAGES.find((l) => l.code === patch.language);
      document.documentElement.dir = lang?.rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = patch.language;
    }
  };

  const doExport = () => {
    try {
      const progress = loadProgress();
      const mistakes = loadMistakes();
      downloadProgressJson(`hifz-${localDateString()}.json`, exportProgress(progress, mistakes, settings!));
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
      setSettings(result.settings);
      setImportMsg('Progress imported successfully.');
    };
    reader.onerror = () => setImportMsg('That file could not be read.');
    reader.readAsText(file);
  };

  const clearAll = () => {
    if (!window.confirm('Delete ALL your Hifz progress, mistakes, goals and settings on this device? This cannot be undone. Export first if you want a copy.')) return;
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith('ili_') || k.startsWith('quran_bookmarks')) localStorage.removeItem(k);
      }
      if (typeof indexedDB !== 'undefined') {
        indexedDB.deleteDatabase('ili-hifz');
      }
      setMsg('Everything on this device was cleared. Reload the page to start fresh.');
    } catch {
      setMsg('Clear failed — browser storage is unavailable.');
    }
  };

  if (!settings) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <p className="text-sm text-[#5b6b62]">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {msg && (
        <p role="status" className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1FA36B]">
          {msg}
        </p>
      )}

      {/* Language */}
      <section aria-labelledby="lang-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="lang-heading" className="text-lg font-bold text-[#102E26]">Language</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          Interface language. Arabic and Urdu switch the whole interface to right-to-left.
          Quran translations are picked separately, on each surah page.
        </p>
        <label className="mt-3 block text-sm font-semibold">
          Interface language
          <select
            value={settings.language ?? 'en'}
            onChange={(e) => update({ language: e.target.value })}
            className="mt-1 block w-full max-w-xs rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </label>
      </section>

      {/* Themes */}
      <section aria-labelledby="theme-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="theme-heading" className="text-lg font-bold text-[#102E26]">Theme</h2>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Theme">
          {(
            [
              ['light', 'Light'],
              ['dark', 'Dark'],
              ['sepia', 'Sepia'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={(settings.theme ?? 'light') === v}
              onClick={() => update({ theme: v })}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                (settings.theme ?? 'light') === v ? 'bg-[#102E26] text-white' : 'border border-[#E5E7EB]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-[#5b6b62]">Dark is best for night recitation; sepia is warm paper, like a printed mushaf.</p>
      </section>

      {/* Recitation */}
      <section aria-labelledby="rec-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="rec-heading" className="text-lg font-bold text-[#102E26]">Recitation</h2>
        <div className="divide-y divide-[#E5E7EB]">
          <Toggle
            label="Detect mistakes"
            hint="Flag incorrect, extra, missed and skipped words as you recite. Off = follow-along only: the app highlights words but never judges them."
            checked={settings.detectMistakes ?? true}
            onChange={(v) => update({ detectMistakes: v })}
          />
          <Toggle
            label="Strict harakat (tashkeel)"
            hint="On: a word said with the wrong vowel marks counts as a mistake. Off: harakat differences are ignored. This is about vowel marks only — the checker never judges tajweed."
            checked={settings.harakatStrict ?? false}
            onChange={(v) => update({ harakatStrict: v })}
          />
          <Toggle
            label="Don't progress until a mistake is fixed"
            hint="On: after a session with mistakes, you must retry those words before moving to the next ayah. Off: you can continue past a wrongly-flagged word."
            checked={settings.dontProgress ?? false}
            onChange={(v) => update({ dontProgress: v })}
          />
          <Toggle
            label="Sound on test completion"
            hint="Play a sound (and vibrate, on phones) when a test question finishes."
            checked={settings.testSound ?? true}
            onChange={(v) => update({ testSound: v })}
          />
        </div>
      </section>

      {/* Quran appearance */}
      <section aria-labelledby="app-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="app-heading" className="text-lg font-bold text-[#102E26]">Quran appearance</h2>
        <div className="divide-y divide-[#E5E7EB]">
          <Toggle
            label="Highlight mistake history"
            hint="Words you have missed often show a soft pastel wash on the page — red for most-missed, fading to green as you get them right."
            checked={settings.highlightMistakes ?? true}
            onChange={(v) => update({ highlightMistakes: v })}
          />
          <Toggle
            label="Show washes over hidden words"
            hint="Keep the weak-spot washes visible even while verses are hidden, so you see where to be careful before you recite."
            checked={settings.showForHidden ?? false}
            onChange={(v) => update({ showForHidden: v })}
          />
          <Toggle
            label="Show Tajweed colours"
            hint="Colour words by the tajweed rule that applies (madd, ghunna, qalqalah…). Display only — this app does not detect tajweed mistakes."
            checked={settings.tajweedColors ?? false}
            onChange={(v) => update({ tajweedColors: v })}
          />
          <Toggle
            label="Hide ayah markers"
            hint="Hide the ayah-end rosettes for a true test of memory."
            checked={settings.hideAyahMarkers ?? false}
            onChange={(v) => update({ hideAyahMarkers: v })}
          />
          <Toggle
            label="Colour the mushaf by topic"
            hint="Tint each ayah by its topic (Allah & Tawhid, Prophets, Afterlife…) with a legend on the mushaf page. A study aid, not tafsir — every ayah is given one main topic by an automatic mapping."
            checked={settings.topicColors ?? true}
            onChange={(v) => update({ topicColors: v })}
          />
        </div>
        <label className="mt-4 block text-sm font-semibold">
          Mushaf layout
          <select
            value={settings.mushafLines ?? 15}
            onChange={(e) => update({ mushafLines: Number(e.target.value) as 15 | 16 })}
            className="mt-1 block w-full max-w-xs rounded-lg border border-[#E5E7EB] bg-[#FFFBF2] px-3 py-2.5 text-sm"
          >
            <option value={15}>15 lines per page (Madani)</option>
            <option value={16}>16 lines per page</option>
          </select>
        </label>
        <p className="mt-2 text-xs text-[#5b6b62]">
          The Madani mushaf is 15 lines a page; the 16-line layout shows the same text slightly
          smaller. Page breaks stay the Madani ones in both.
        </p>
      </section>

      {/* Data usage / audio */}
      <section aria-labelledby="data-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="data-heading" className="text-lg font-bold text-[#102E26]">Data usage</h2>
        <div className="divide-y divide-[#E5E7EB]">
          <Toggle
            label="Save session audio on this device"
            hint="Keep your own recitation recordings on this device so you can listen back to them. Recordings never leave the device and are never uploaded."
            checked={settings.saveAudio ?? true}
            onChange={(v) => update({ saveAudio: v })}
          />
        </div>
        <p className="mt-3 text-sm text-[#5b6b62]">
          Progress is also mirrored into IndexedDB on this device (with a one-time migration of
          your existing progress), so it survives even if localStorage is cleared by the browser.
          Nothing is ever sent to a server.
        </p>
      </section>

      {/* Notifications */}
      <section aria-labelledby="notif-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="notif-heading" className="text-lg font-bold text-[#102E26]">Reminders</h2>
        <p className="mt-1 text-sm text-[#5b6b62]">
          This app has no accounts and no server, so it cannot send push notifications. Your
          daily goal and streak are shown on the home screen and Progress tab instead — open
          the app once a day and the streak stays alive. In-app reminders (a banner when your
          goal is unmet by the evening) are planned; nothing is promised here that is not built.
        </p>
      </section>

      {/* Mic help */}
      <section aria-labelledby="mic-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="mic-heading" className="text-lg font-bold text-[#102E26]">Microphone help</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#5b6b62]">
          <li>The checker needs microphone permission. If it is blocked, allow it in your browser&apos;s site settings (padlock icon → microphone → Allow).</li>
          <li>Recite in a quiet room, close to the microphone. Background noise and Bluetooth or car microphones cause false flags.</li>
          <li>Long madd (stretching a word for 6 counts) is the checker&apos;s known weak spot — if it flags a correct long stretch, remove the mistake from your history.</li>
          <li>The checker works offline once the model has downloaded (about 25 MB, first recitation). Quran text and reciter audio still need a connection unless saved for offline use.</li>
          <li>If the checker seems stuck on one ayah, tap “Practice without mic” and self-mark instead — the session still counts.</li>
        </ul>
      </section>

      {/* Export / import / clear */}
      <section aria-labelledby="export-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="export-heading" className="text-lg font-bold text-[#102E26]">Your data</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={doExport}
            className="rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B]"
          >
            Export my progress (.json)
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-full border border-[#102E26] px-5 py-2.5 text-sm font-semibold text-[#102E26] hover:bg-[#E4FFF2]"
          >
            Import progress
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
            className="rounded-full border border-red-700 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Clear all my data
          </button>
        </div>
        {importMsg && (
          <p role="status" className="mt-3 text-sm font-semibold text-[#1FA36B]">{importMsg}</p>
        )}
      </section>

      {/* Privacy */}
      <section aria-labelledby="privacy-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="privacy-heading" className="text-lg font-bold text-[#102E26]">Privacy</h2>
        <p className="mt-1 text-sm leading-relaxed text-[#5b6b62]">
          Everything in this app lives on your device: progress, mistakes, goals, recordings.
          Your voice is processed on this device by the downloaded checker — audio is never
          uploaded, never sold, never shared. There is no account, no tracking, no advertising.
          The only network calls are to fetch Quran text, translations and reciter audio.
        </p>
      </section>

      {/* Donation — Settings only */}
      <section aria-labelledby="donate-heading" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h2 id="donate-heading" className="text-lg font-bold text-[#102E26]">Support this app</h2>
        <p className="mt-1 text-sm leading-relaxed text-[#5b6b62]">
          This app is free forever — no Premium, no paywall, no ads. If it helps your hifz and
          you would like to help keep it running, you can donate. Donations are optional and
          never unlock anything: everything is already free.
        </p>
        <a
          href="/about#support"
          className="mt-3 inline-block rounded-full bg-[#FFB800] px-5 py-2.5 text-sm font-bold text-[#102E26] hover:brightness-105"
        >
          Donate (optional) →
        </a>
      </section>
    </div>
  );
}
