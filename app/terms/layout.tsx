import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — I Love Islam | Free Islamic Tools',
  description:
    'Read the terms of service for using I Love Islam free Islamic tools. All tools are free forever. Use responsibly.',
  openGraph: {
    title: 'Terms of Service — I Love Islam',
    description: 'Free Islamic tools terms of service. All tools are provided as-is for educational use.',
    type: 'website',
    url: 'https://iloveislam.life/terms',
    siteName: 'I Love Islam',
    locale: 'en_US',
  },
  alternates: { canonical: 'https://iloveislam.life/terms' },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}