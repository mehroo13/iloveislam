import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ — I Love Islam | Free Islamic Tools Help & Answers',
  description:
    'Find answers to frequently asked questions about our free Islamic tools – Zakat, Prayer Times, Qibla, Quran Reader, Dhikr, and more. Privacy, accuracy, and usage explained.',
  openGraph: {
    title: 'FAQ — I Love Islam',
    description: 'Answers to common questions about our free Islamic tools.',
    type: 'website',
    url: 'https://iloveislam.life/faq',
    siteName: 'I Love Islam',
    locale: 'en_US',
  },
  alternates: { canonical: 'https://iloveislam.life/faq' },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}