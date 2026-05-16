import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us — I Love Islam | Free Islamic Tools for Every Muslim',
  description:
    'Learn about I Love Islam – a free collection of 20+ Islamic tools built for Muslims worldwide. Our mission, story, values, and commitment to the Ummah.',
  openGraph: {
    title: 'About I Love Islam',
    description: 'Discover why we built free Islamic tools for the global Muslim community.',
    type: 'website',
    url: 'https://iloveislam.life/about',
    siteName: 'I Love Islam',
    locale: 'en_US',
  },
  alternates: { canonical: 'https://iloveislam.life/about' },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}