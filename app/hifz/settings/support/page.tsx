// app/hifz/settings/support/page.tsx — Support This App detail screen.
import type { Metadata } from 'next';
import DetailShell from '../DetailShell';
import { SupportDetail } from '../DetailContent';
import { SITE_URL } from '../../lib/fetch';

export const metadata: Metadata = {
  title: 'Support This App — Settings | I Love Islam',
  description: 'This app is free forever. An optional donation helps keep it running.',
  alternates: { canonical: `${SITE_URL}/hifz/settings/support` },
  robots: { index: false, follow: true },
};

export default function SupportSettingsPage() {
  return (
    <DetailShell titleKey="set.support">
      <SupportDetail />
    </DetailShell>
  );
}
