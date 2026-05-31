import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us — I Love Islam | Free Islamic Tools for Every Muslim',
  description:
    'Learn about I Love Islam – a free collection of 26+ Islamic tools built for Muslims worldwide. Discover our mission, values, methodology, sources, and commitment to serving the global Ummah with accurate, private, and accessible Islamic tools.',
  keywords: [
    'about i love islam', 'islamic tools website', 'free muslim tools', 'islamic app',
    'muslim website', 'islamic technology', 'ummah tools', 'halal tools',
  ],
  openGraph: {
    title: 'About I Love Islam — Free Islamic Tools for the Ummah',
    description: 'Discover why we built 26+ free Islamic tools for the global Muslim community. Our mission, values, and commitment to accuracy and privacy.',
    type: 'website',
    url: 'https://iloveislam.life/about',
    siteName: 'I Love Islam',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About I Love Islam',
    description: '26+ free Islamic tools for every Muslim. Learn about our mission and values.',
  },
  alternates: { canonical: 'https://iloveislam.life/about' },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}