// app/hifz/layout.tsx — hub wrapper. Shared treatment for /hifz/*:
// cream pages (Tarteel look), centred reading column, skippable
// onboarding, theme + language application (see AppShell / lib/i18n).
// The bottom tab bar lives in SiteChrome (root layout) so it also shows
// on the homepage `/` — it is NOT rendered here (no double tabs).
import type { Metadata } from 'next';
import { Onboarding, ThemeApplier } from './components/AppShell';
import ModeSwitcher from './components/ModeSwitcher';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.iloveislam.life'),
};

// Runs before first paint: apply the saved theme + language straight from
// localStorage so a returning user never flashes the light LTR default.
// Same logic as lib/i18n syncPrefsFromStorage, duplicated here on purpose
// — React hasn't hydrated yet when this runs. No CSP header blocks inline
// scripts on this site (next.config.ts sets no Content-Security-Policy).
const PREFS_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem('ili_hifz_settings_v1')||'null');if(!s)return;var th=s.theme;if(th==='dark'||th==='sepia'){document.documentElement.setAttribute('data-theme',th)}var lang=s.language;if(lang){document.documentElement.lang=lang;document.documentElement.dir=(lang==='ar'||lang==='ur')?'rtl':'ltr'}}catch(e){}})();`;

export default function HifzLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFFBF2] text-[#1C2420]">
      <script dangerouslySetInnerHTML={{ __html: PREFS_SCRIPT }} />
      <ThemeApplier />
      <Onboarding />
      <ModeSwitcher />
      {children}
    </div>
  );
}
