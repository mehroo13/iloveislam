import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Night Recitation — Sleep with Quran (Mulk, Rahman, Ya-Sin) | I Love Islam",
  description:
    "Sleep peacefully with soothing Quran recitation by Al-Sudais. Play Surah Mulk, Rahman, Ya-Sin, and Ad-Duha with auto-repeat. Free Islamic sleep aid, no sign-up.",
  keywords: [
    "Surah Mulk",
    "Surah Rahman",
    "Surah Ya-Sin",
    "Quran sleep",
    "Islamic sleep aid",
    "Quran recitation night",
    "night Quran",
    "sleep with Quran",
    "Al-Sudais recitation",
  ],
  openGraph: {
    title: "Night Recitation — Sleep with Quran | I Love Islam",
    description:
      "Let the Quran bring peace to your night. Play Surah Mulk, Rahman, Ya-Sin or Duha with auto-stop after your chosen repeats.",
    url: "https://www.iloveislam.life/night",
    siteName: "I Love Islam",
    locale: "en_US",
    type: "website",
    images: [{ url: '/optimized/og-image.webp', width: 1200, height: 630, alt: 'Night Recitation — I Love Islam' }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Night Recitation — Sleep with Quran | I Love Islam",
    description: "Sleep peacefully with Surah Mulk, Rahman, Ya-Sin recitation. Free.",
    images: ['/optimized/og-image.webp'],
  },
  alternates: { canonical: "https://www.iloveislam.life/night" },
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
      name: 'Night Recitation — Quran Sleep Tool',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Sleep with the soothing recitation of Surah Mulk, Rahman, Ya-Sin, and Ad-Duha by Sheikh Al-Sudais. Set repeat count and drift into peaceful rest.',
      url: 'https://www.iloveislam.life/night',
      provider: { '@type': 'Organization', name: 'I Love Islam', url: 'https://www.iloveislam.life' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.iloveislam.life' },
        { '@type': 'ListItem', position: 2, name: 'Night Recitation', item: 'https://www.iloveislam.life/night' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What surahs are available for night recitation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Surah Al-Mulk, Surah Ar-Rahman, Surah Ya-Sin, and Surah Ad-Duha are available, recited by Sheikh Al-Sudais.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I set the recitation to auto-stop?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, you can set a repeat count and the recitation will automatically stop after the chosen number of plays.',
          },
        },
      ],
    },
  ],
};

export default function NightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section>{children}</section>
    </>
  );
}
