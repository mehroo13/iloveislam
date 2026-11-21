// app/hifz/layout.tsx — hub wrapper. Shared treatment for /hifz/*:
// cream pages (Tarteel look), centred reading column, skippable
// onboarding, theme application + IndexedDB migration (see AppShell).
// The bottom tab bar lives in SiteChrome (root layout) so it also shows
// on the homepage `/` — it is NOT rendered here (no double tabs).
import type { Metadata } from 'next';
import { Onboarding, ThemeApplier } from './components/AppShell';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.iloveislam.life'),
};

export default function HifzLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFFBF2] text-[#1C2420]">
      <ThemeApplier />
      <Onboarding />
      {children}
    </div>
  );
}
