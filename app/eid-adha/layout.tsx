import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Eid ul Adha Calculator 2026 | Qurbani Calculator, Takbeer Counter & More',
  description:
    'Complete Eid ul Adha Islamic toolkit: Qurbani calculator with share splitting, meat distribution calculator, Takbeer counter, Eid checklist, Sunnah guide, Eid prayer finder, greetings generator, and traditional Eid recipes. Free Islamic tool for Muslims worldwide.',

  keywords: [
    'eid ul adha calculator',
    'qurbani calculator',
    'qurbani share calculator',
    'cow share calculator eid',
    'qurbani distribution calculator',
    'meat distribution eid ul adha',
    'eid ul adha 2026',
    'qurbani 2026',
    'takbeer counter eid',
    'eid checklist',
    'qurbani rules',
    'eid ul adha sunnah',
    'eid prayer time',
    'eid mubarak greeting',
    'qurbani price per share',
    'dhul hijjah tracker',
    'day of arafah 2026',
    'eid ul adha recipes',
    'halal recipes eid',
    'islamic eid calculator',
    'qurbani fiqh rules',
    'cow qurbani 7 shares',
    'eid adha islamische rechner',
  ].join(', '),

  authors: [{ name: 'iLoveIslam', url: 'https://www.iloveislam.life' }],
  creator: 'iLoveIslam',
  publisher: 'iLoveIslam',

  metadataBase: new URL('https://www.iloveislam.life'),

  alternates: {
    canonical: 'https://www.iloveislam.life/eid-ul-adha',
  },

  openGraph: {
    type: 'website',
    url: 'https://www.iloveislam.life/eid-ul-adha',
    title: 'Eid ul Adha Calculator 2026 | Complete Islamic Toolkit',
    description:
      'Qurbani calculator, share splitter, meat distribution, Takbeer counter, Eid checklist, Sunnah guide & more. The most complete Eid ul Adha tool for Muslims.',
    siteName: 'iLoveIslam',
    images: [
      {
        url: '/og-eid-ul-adha.jpg',
        width: 1200,
        height: 630,
        alt: 'Eid ul Adha Calculator — Qurbani Share Calculator & Islamic Toolkit',
      },
    ],
    locale: 'en_US',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Eid ul Adha Calculator 2026 | Qurbani Share Calculator',
    description:
      'Free Islamic tool: Qurbani calculator, meat distribution, Takbeer counter, Eid checklist & more.',
    images: ['/og-eid-ul-adha.jpg'],
    creator: '@iloveislamlife',
    site: '@iloveislamlife',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  category: 'religion',
};

// ─── JSON-LD Structured Data ──────────────────────────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://www.iloveislam.life/eid-ul-adha',
      url: 'https://www.iloveislam.life/eid-ul-adha',
      name: 'Eid ul Adha Calculator 2026 | Complete Islamic Toolkit',
      description: 'Free Qurbani calculator, share splitter, meat distribution calculator, Takbeer counter, Eid ul Adha checklist and Sunnah guide.',
      inLanguage: 'en',
      isPartOf: {
        '@type': 'WebSite',
        '@id': 'https://www.iloveislam.life/#website',
        url: 'https://www.iloveislam.life',
        name: 'iLoveIslam',
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Qurbani Calculator & Eid ul Adha Toolkit',
      url: 'https://www.iloveislam.life/eid-ul-adha',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description: 'Complete Eid ul Adha toolkit including Qurbani calculator with share splitting, meat distribution calculator, Takbeer counter, Eid checklist, Sunnah timeline, and Eid recipes.',
      author: {
        '@type': 'Organization',
        name: 'iLoveIslam',
        url: 'https://www.iloveislam.life',
      },
      featureList: [
        'Qurbani share calculator',
        'Meat distribution calculator',
        'Takbeer counter with Arabic text',
        'Eid ul Adha checklist',
        'Sunnah of Eid interactive guide',
        'Eid prayer finder',
        'Eid greeting generator',
        'Eid ul Adha recipes',
        'Dhul Hijjah 10 days tracker',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is a Qurbani calculator?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A Qurbani calculator helps Muslims calculate the cost per share of their Eid ul Adha sacrifice, split shares between family members (up to 7 for cow/camel), and track who has paid. It also helps calculate meat distribution across the three portions: self, relatives, and the poor.',
          },
        },
        {
          '@type': 'Question',
          name: 'How many shares is a cow for Qurbani?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A cow (or bull/buffalo/camel) can be shared between up to 7 people for Qurbani. A goat or sheep counts as only 1 person\'s Qurbani.',
          },
        },
        {
          '@type': 'Question',
          name: 'When is Eid ul Adha 2026?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Eid ul Adha 2026 is expected to fall on June 6–7, 2026 (subject to moon sighting), corresponding to the 10th of Dhul Hijjah 1446 AH.',
          },
        },
        {
          '@type': 'Question',
          name: 'How should Qurbani meat be distributed?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Qurbani meat should be divided into three equal portions: one-third for yourself and family, one-third for relatives and friends, and one-third for the poor and needy. Giving to the poor is obligatory and a core purpose of Qurbani.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is Takbeer-e-Tashreeq?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Takbeer-e-Tashreeq is: "Allahu Akbar, Allahu Akbar, La ilaha illallah, wallahu Akbar, Allahu Akbar, wa lillahil hamd." It is recited after every obligatory prayer from Fajr on the 9th of Dhul Hijjah until Asr on the 13th.',
          },
        },
      ],
    },
  ],
};

export default function EidulAdhaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}