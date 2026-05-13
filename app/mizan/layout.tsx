export const metadata = {
  title: 'Mizan — Islamic Life Blueprint & Personality Tool',
  description: 'Discover your personality, life purpose and spiritual path through Abjad numerology and the 99 Names of Allah.',
  openGraph: {
    title: 'Mizan — Discover Your Islamic Blueprint',
    description: 'Discover your personality, life purpose and spiritual path through Abjad numerology and the 99 Names of Allah.',
    url: 'https://www.iloveislam.life/mizan',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mizan — Discover Your Islamic Blueprint',
    description: 'Discover your personality, life purpose and spiritual path through Abjad numerology and the 99 Names of Allah.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
