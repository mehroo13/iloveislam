// app/hifz/settings/account/page.tsx — Account & backup detail screen.
import type { Metadata } from 'next';
import DetailShell from '../DetailShell';
import AccountSection from '../../components/AccountSection';
import { SITE_URL } from '../../lib/fetch';

export const metadata: Metadata = {
  title: 'Account — Settings | I Love Islam',
  description: 'Optional account and cloud backup for your Hifz progress. Everything works as a guest too.',
  alternates: { canonical: `${SITE_URL}/hifz/settings/account` },
  robots: { index: false, follow: true },
};

export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ auth?: string }>;
}) {
  const auth = (await searchParams)?.auth;
  return (
    <DetailShell titleKey="rb.set.account">
      <AccountSection authError={auth === 'link_expired' ? 'link_expired' : null} />
    </DetailShell>
  );
}
