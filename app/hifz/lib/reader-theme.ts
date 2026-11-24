// app/hifz/lib/reader-theme.ts — Light / Dark theme for the reader
// (Phase 7). The reader stack (ReaderScreen + its overlays) paints
// its chrome with hardcoded light colours, so a theme toggle needs a
// single shared switch:
//
//   * The stored value lives in the SAME settings document the old
//     settings page already uses — `ili_hifz_settings_v1.theme`
//     ('light' | 'dark' | 'sepia'), via progress.ts loadSettings /
//     saveSettings — so the reader toggle and the old Settings →
//     Themes picker agree, and the pre-paint script in app/layout.tsx
//     (which sets data-theme from that same document before first
//     paint) makes the choice persist across reloads with no flash.
//   * `applyReaderTheme` also sets / removes `data-theme` on
//     <html> live, so the change is visible immediately, and
//     dispatches `ili-theme-change` so any mounted toggle UI
//     re-renders.
//   * The reader's colours are CSS variables (--reader-bg,
//     --reader-ink, ...) defined in :root and redefined under
//     [data-theme="dark"] in globals.css, so components using them
//     restyle without re-rendering. The toggle offers Light / Dark
//     only; a 'sepia' value left by the old picker reads as Light
//     here (toggling writes 'light' or 'dark').

import { loadSettings, saveSettings } from '../progress';

export type ReaderTheme = 'light' | 'dark';

/** Dispatched on window after applyReaderTheme(). */
export const READER_THEME_EVENT = 'ili-theme-change';

export function getReaderTheme(): ReaderTheme {
  try {
    return loadSettings().theme === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/** Persist the theme, apply it to <html> live, and notify listeners. */
export function applyReaderTheme(theme: ReaderTheme): void {
  try {
    const settings = loadSettings();
    settings.theme = theme;
    saveSettings(settings);
  } catch {
    /* storage unavailable — still apply it live */
  }
  try {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  } catch {
    /* no document (SSR) — the pre-paint script applies it on load */
  }
  try {
    window.dispatchEvent(new Event(READER_THEME_EVENT));
  } catch {
    /* no window — nothing to notify */
  }
}
