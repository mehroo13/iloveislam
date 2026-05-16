import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us — I Love Islam | Free Islamic Tools',
  description:
    'Get in touch with the I Love Islam team. Report bugs, suggest new tools, ask Islamic questions, or discuss partnerships. We reply within 48 hours inshaAllah.',
  openGraph: {
    title: 'Contact Us — I Love Islam',
    description: 'Reach out to the I Love Islam team. We’re here to help.',
    type: 'website',
    url: 'https://iloveislam.life/contact',
    siteName: 'I Love Islam',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Contact Us — I Love Islam',
    description: 'Report bugs, suggest tools, or just say salam.',
  },
  alternates: { canonical: 'https://iloveislam.life/contact' },
  robots: { index: true, follow: true },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}