import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Install I Love Islam App — Free Offline Islamic Tools',
  description: 'Install I Love Islam on your phone or computer for instant offline access to Prayer Times, Dhikr Counter, Quran Reader, and 25+ Islamic tools.',
  alternates: { canonical: 'https://www.iloveislam.life/install' },
  openGraph: {
    title: 'Install I Love Islam App — Free Offline Islamic Tools',
    description: 'Install I Love Islam on your phone or computer for instant offline access to Prayer Times, Dhikr Counter, Quran Reader, and 25+ Islamic tools.',
    url: 'https://www.iloveislam.life/install',
  },
};

export default function InstallLayout({ children }: { children: React.ReactNode }) {
  return children;
}
