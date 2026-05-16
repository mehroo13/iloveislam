import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Islamic Knowledge & Guides – Free Articles on Islam | I Love Islam',
  description:
    'Read in‑depth Islamic guides: Zakat, Prayer, Qibla, Quran, Ramadan, Hajj, Islamic finance, and much more. Free, no sign‑up.',
  alternates: { canonical: 'https://iloveislam.life/blog' },
  openGraph: {
    title: 'Islamic Knowledge & Guides | I Love Islam',
    description: 'Free in‑depth Islamic guides and articles.',
    url: 'https://iloveislam.life/blog',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Islamic Knowledge & Guides | I Love Islam',
    description: 'Free in‑depth Islamic guides and articles.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}