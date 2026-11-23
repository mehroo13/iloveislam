// app/hifz/settings/data/page.tsx — Your Data detail screen (export /
// import / clear).
import type { Metadata } from 'next';
import DetailShell from '../DetailShell';
import { DataDetail } from '../DetailContent';
import { SITE_URL } from '../../lib/fetch';

export const metadata: Metadata = {
  title: 'Your Data — Settings | I Love Islam',
  description: 'Export, import or clear your Hifz data on this device.',
  alternates: { canonical: `${SITE_URL}/hifz/settings/data` },
  robots: { index: false, follow: true },
};

export default function DataSettingsPage() {
  return (
    <DetailShell titleKey="set.yourData">
      <DataDetail />
    </DetailShell>
  );
}
