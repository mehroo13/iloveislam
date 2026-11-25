// app/hifz/lib/layout-mode.ts — the reader's three display layouts
// (Settings subtree, 2026-11-25). Shared by the reader (ReaderScreen)
// and the Mushaf Layout screen (SettingsScreens). It used to live in
// ReaderMushafLayout.tsx; the bottom sheet is retired — the full
// Mushaf Layout screen is the one layout picker now.

/** Book = the 15-line Madani mushaf page; Text = resizable flowing
 *  Arabic; Translation = Arabic + the selected translation. */
export type ReaderLayoutMode = 'book' | 'text' | 'translation';
