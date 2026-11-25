// app/hifz/lib/reader-theme.ts — Light / Dark theme for the reader
// (Phase 7). The reader stack (ReaderScreen + its overlays) paints
// its chrome with hardcoded light colours, so a theme toggle needs a
// single shared switch:
//
//   * The stored value lives in the SAME settings document the old
//     settings page already uses — `ili_hifz_settings_v1.theme`
//     ('light' | 'dark' | 'sepia' | 'auto'), via progress.ts
//     loadSettings / saveSettings — so the reader toggle and the old
//     Settings → Themes picker agree, and the pre-paint script in
//     app/layout.tsx (which sets data-theme from that same document
//     before first paint) makes the choice persist across reloads
//     with no flash.
//   * `applyReaderTheme` also sets / removes `data-theme` on
//     <html> live, so the change is visible immediately, and
//     dispatches `ili-theme-change` so any mounted toggle UI
//     re-renders.
//   * The reader's colours are CSS variables (--reader-bg,
//     --reader-ink, ...) defined in :root and redefined under
//     [data-theme="dark"] in globals.css, so components using them
//     restyle without re-rendering.
//   * 'auto' resolves through prefers-color-scheme and follows the
//     system while it is stored (a matchMedia listener re-applies
//     on change). 'sepia' keeps its own data-theme value (globals.css
//     has sepia rules); the resolved reader theme reads it as Light.

import { loadSettings, saveSettings } from '../progress';
import { syncPrefsFromStorage } from './i18n';

export type ReaderTheme = 'light' | 'dark';

/** What is stored in the settings document. */
export type StoredTheme = 'light' | 'dark' | 'sepia' | 'auto';

/** Dispatched on window after applyReaderTheme(). */
export const READER_THEME_EVENT = 'ili-theme-change';

/** Resolve a stored theme to what the reader actually paints. */
export function resolveStoredTheme(stored: StoredTheme | string | undefined): ReaderTheme {
  if (stored === 'dark') return 'dark';
  if (stored === 'auto' && typeof window !== 'undefined') {
    try {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    } catch {
      /* matchMedia unavailable — fall through to light */
    }
  }
  return 'light';
}

export function getReaderTheme(): ReaderTheme {
  try {
    return resolveStoredTheme(loadSettings().theme);
  } catch {
    return 'light';
  }
}

/** While 'auto' is stored, follow the system when it flips. */
let autoWatching = false;
export function ensureAutoThemeListener(): void {
  if (autoWatching || typeof window === 'undefined' || !window.matchMedia) return;
  try {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      try {
        if (loadSettings().theme === 'auto') {
          applyReaderTheme('auto', false);
          syncPrefsFromStorage();
        }
      } catch {
        /* storage unavailable — nothing to re-apply */
      }
    });
    autoWatching = true;
  } catch {
    /* matchMedia unavailable */
  }
}

/** Persist the theme, apply it to <html> live, and notify listeners. */
export function applyReaderTheme(theme: StoredTheme, persist = true): void {
  if (persist) {
    try {
      const settings = loadSettings();
      settings.theme = theme;
      saveSettings(settings);
    } catch {
      /* storage unavailable — still apply it live */
    }
  }
  try {
    if (theme === 'sepia') {
      document.documentElement.setAttribute('data-theme', 'sepia');
    } else if (resolveStoredTheme(theme) === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  } catch {
    /* no document (SSR) — the pre-paint script applies it on load */
  }
  if (theme === 'auto') ensureAutoThemeListener();
  try {
    window.dispatchEvent(new Event(READER_THEME_EVENT));
  } catch {
    /* no window — nothing to notify */
  }
}
