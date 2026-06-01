import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Halal Scanner — Check if Food is Halal or Haram | I Love Islam',
  description:
    'Scan any product barcode, QR code, or upload a photo to instantly check if it is Halal, Haram, or Mashbooh. Free ingredient-by-ingredient analysis with no sign-up.',
  keywords: [
    'halal scanner', 'halal food checker', 'haram ingredients', 'halal barcode scanner',
    'is it halal', 'mashbooh', 'E numbers halal', 'halal product checker', 'Islamic food guide',
  ],
  openGraph: {
    title: 'Halal Scanner — Check if Food is Halal or Haram',
    description: 'Scan barcodes, QR codes, or upload product photos to instantly check Halal status. Free.',
    url: 'https://www.iloveislam.life/halal-scanner',
    siteName: 'I Love Islam',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'HalalScan — Free Halal Food Scanner' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Halal Scanner | I Love Islam',
    description: 'Scan any food product to check if it is Halal, Haram, or Mashbooh. Free.',
    images: ['/optimized/og-image.webp'],
  },
  alternates: { canonical: 'https://www.iloveislam.life/halal-scanner' },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'HalalScan — Halal Food Scanner',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Scan any product barcode, QR code, or upload a photo to instantly determine if a food product is Halal, Haram, or Mashbooh with ingredient-by-ingredient analysis.',
      url: 'https://www.iloveislam.life/halal-scanner',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://www.iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Halal Scanner', item: 'https://www.iloveislam.life/halal-scanner' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does the Halal Scanner work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Point your camera at a product barcode or QR code, or upload a photo of the ingredients list. The scanner analyzes each ingredient against a database of known Halal, Haram, and Mashbooh substances to give you a clear verdict.',
          },
        },
        {
          '@type': 'Question',
          name: 'What ingredients does it check for?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The scanner checks for gelatin (pork-derived), alcohol-based flavourings, E-numbers with animal origins, carmine (E120), L-cysteine (E920), and hundreds of other additives that may be derived from non-Halal sources.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does the Halal Scanner work offline?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, the scanner has a local ingredient database cached for offline use. Barcode lookups require internet, but photo-based ingredient analysis works offline.',
          },
        },
      ],
    },
  ],
};

export default function HalalScannerLayout({ children }: { children: React.ReactNode }) {
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
