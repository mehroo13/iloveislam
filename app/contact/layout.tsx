import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us — I Love Islam | Free AI Quran Memorization App',
  description:
    'Get in touch with the I Love Islam team. Report bugs, suggest features, ask questions about the Hifz app, or discuss partnerships. We reply within 48 hours inshaAllah.',
  openGraph: {
    title: 'Contact Us — I Love Islam',
    description: 'Reach out to the I Love Islam team. We’re here to help.',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'I Love Islam — Memorise the Quran with AI' }],
    url: 'https://www.iloveislam.life/contact',
    siteName: 'I Love Islam',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Contact Us — I Love Islam',
    description: 'Report bugs, suggest features, or just say salam.',
  },
  alternates: { canonical: 'https://www.iloveislam.life/contact' },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ContactPage',
      name: 'Contact I Love Islam',
      description: 'Get in touch with the I Love Islam team. Report bugs, suggest features, or ask questions.',
      url: 'https://www.iloveislam.life/contact',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Contact', item: 'https://www.iloveislam.life/contact' },
      ],
    },
  ],
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}