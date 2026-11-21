import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dua for This Moment — Find the Right Dua for Right Now | I Love Islam',
  description:
    'Feeling anxious, grateful, sick, travelling or starting something hard? Find the right dua for this exact moment — Arabic, transliteration and translation from the Quran and authentic hadith, free with no sign-up.',
  keywords: [
    'dua for this moment',
    'dua for anxiety',
    'dua before sleep',
    'dua for exams',
    'dua for travel',
    'dua for parents',
    'dua of the day',
    'islamic dua',
    'authentic duas',
  ],
  openGraph: {
    title: 'Dua for This Moment — Find the Right Dua for Right Now | I Love Islam',
    description:
      'Tap what you are feeling or facing and find the right dua — Arabic, transliteration and translation from the Quran and authentic hadith.',
    url: 'https://www.iloveislam.life/dua-for-this-moment',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Free Islamic Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dua for This Moment — Find the Right Dua for Right Now | I Love Islam',
    description:
      'Tap what you are feeling or facing and find the right dua — Arabic, transliteration and translation from the Quran and authentic hadith.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/dua-for-this-moment' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

export default function DuaForThisMomentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
