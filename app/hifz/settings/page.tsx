// app/hifz/settings/page.tsx — Settings (spec §22).
import type { Metadata } from 'next';
import SettingsClient from '../components/SettingsClient';
import SettingsHeader from '../components/SettingsHeader';
import { Attribution } from '../components/HifzShared';
import { SITE_URL } from '../lib/fetch';

export const metadata: Metadata = {
  title: 'Settings — Language, Theme & Privacy | I Love Islam',
  description:
    'Hifz settings: language, theme, mushaf layout, recitation and privacy. Everything stays on your device.',
  alternates: { canonical: `${SITE_URL}/hifz/settings` },
  robots: { index: false, follow: true },
};

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <SettingsHeader />
      <div className="mt-6">
        <SettingsClient />
      </div>
      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
