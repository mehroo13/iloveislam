// app/hifz/settings/DetailContent.tsx — the detail-screen bodies for the
// sections that moved off the main Settings page: Your Data
// (export/import/clear), Microphone Help, Support. Moved verbatim from
// SettingsClient (same storage keys, same behaviour) — only the
// presentation moved.
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  loadProgress, loadMistakes, loadSettings, saveProgress, saveMistakes, saveSettings,
  exportProgress, importProgress, downloadProgressJson,
  localDateString,
  type HifzSettings,
} from '../progress';
import { mirrorAllToIdb } from '../lib/store';
import { loadBookmarks, saveBookmarks } from '../lib/bookmarks';
import { loadChallenges, saveChallenges } from '../lib/challenges';
import { resetUiPrefsToDefaults, syncPrefsFromStorage, useT } from '../lib/i18n';

/** Your Data — export / import / clear (was the "Your data" card on the
    main Settings page). */
export function DataDetail() {
  const [settings, setSettings] = useState<HifzSettings | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const t = useT();

  useEffect(() => {
    try {
      setSettings(loadSettings());
    } catch {
      setSettings(null);
    }
  }, []);

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
      setMsg(t('rb.set.exportFailed'));
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
      setImportMsg(t('rb.dash.importedOk'));
      // An import can carry a different language/theme — apply it at once.
      syncPrefsFromStorage();
    };
    reader.onerror = () => setImportMsg(t('rb.dash.fileUnreadable'));
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
      setMsg(t('rb.set.clearedAll'));
      // Reset the live locale/theme to the defaults right away.
      resetUiPrefsToDefaults();
    } catch {
      setMsg(t('rb.set.clearFailed'));
    }
  };

  return (
    <div className="rounded-xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
      {msg && (
        <p role="status" className="mb-3 rounded-xl border border-[#E8EAED] bg-white px-4 py-3 text-sm font-semibold text-[#1FA36B]">
          {msg}
        </p>
      )}
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
          className="min-h-11 rounded-full border border-[#102E26] px-5 py-2.5 text-sm font-semibold text-[#111827] hover:bg-[#E4FFF2]"
        >
          {t('set.import')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          aria-label={t('rb.dash.chooseExport')}
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
      <p className="mt-3 text-sm text-[#6B7280]">{t('rb.dash.backupNote')}</p>
    </div>
  );
}

/** Microphone Help — the recitation-coach tips (was a card on the main
    Settings page). */
export function MicHelpDetail() {
  const t = useT();
  return (
    <div className="rounded-xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
      {/* Logical `ps-*` (not `pl-*`) so the list indent mirrors in RTL. */}
      <ul className="list-disc space-y-1 ps-5 text-sm leading-relaxed text-[#6B7280]">
        <li>{t('rb.set.micPerm')}</li>
        <li>{t('rb.set.micQuiet')}</li>
        <li>{t('rb.set.micMadd')}</li>
        <li>{t('rb.set.micOffline')}</li>
        <li>{t('rb.set.micStuck')}</li>
      </ul>
    </div>
  );
}

/** Support — donate note + button (was a card on the main Settings page). */
export function SupportDetail() {
  const t = useT();
  return (
    <div className="rounded-xl border border-[#E8EAED] bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm leading-relaxed text-[#6B7280]">{t('rb.set.donateNote')}</p>
      <a
        href="/about#support"
        className="mt-3 inline-block rounded-full bg-[#FFB800] px-5 py-2.5 text-sm font-bold text-[#111827] hover:brightness-105"
      >
        {t('set.donate')}
      </a>
    </div>
  );
}
