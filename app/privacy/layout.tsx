import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — I Love Islam | Free Islamic Tools',
  description:
    'We do not collect any personal data. All tools work locally in your browser. Learn how we protect your privacy.',
  openGraph: {
    title: 'Privacy Policy — I Love Islam',
    description: 'Your privacy is protected. No registration, no data collection.',
    type: 'website',
    url: 'https://iloveislam.life/privacy',
    siteName: 'I Love Islam',
    locale: 'en_US',
  },
  alternates: { canonical: 'https://iloveislam.life/privacy' },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}