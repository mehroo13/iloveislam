// app/hifz/layout.tsx — hub wrapper. Shared treatment for /hifz/*:
// white pages (Tarteel look), centred reading column, bottom tab bar
// (Home | Mushaf | Memorize | Search | Progress), skippable onboarding,
// theme application + IndexedDB migration (see AppShell).
import type { Metadata } from 'next';
import { BottomTabs, Onboarding, ThemeApplier } from './components/AppShell';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.iloveislam.life'),
};

export default function HifzLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[#1C2420]">
      <ThemeApplier />
      <Onboarding />
      <div className="pb-20">{children}</div>
      <BottomTabs />
    </div>
  );
}
