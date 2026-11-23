// app/hifz/settings/microphone/page.tsx — Microphone Help detail screen.
import type { Metadata } from 'next';
import DetailShell from '../DetailShell';
import { MicHelpDetail } from '../DetailContent';
import { SITE_URL } from '../../lib/fetch';

export const metadata: Metadata = {
  title: 'Microphone Help — Settings | I Love Islam',
  description: 'Tips for getting the recitation checker to hear you clearly.',
  alternates: { canonical: `${SITE_URL}/hifz/settings/microphone` },
  robots: { index: false, follow: true },
};

export default function MicrophoneSettingsPage() {
  return (
    <DetailShell titleKey="set.micHelp">
      <MicHelpDetail />
    </DetailShell>
  );
}
