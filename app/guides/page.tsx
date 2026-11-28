// app/guides/page.tsx — Guides index (2026-11-28). Small hub listing
// the four SEO guide pages; also the target of the guides' breadcrumb
// "Guides" link. Original blurbs only — no copied text.
import type { Metadata } from 'next';
import Link from 'next/link';
import TrustShell from '../components/TrustShell';
import { SITE_URL } from '../hifz/lib/fetch';
import { GUIDES, jsonLdHtml } from './guide-shared';

const TITLE = 'Quran Guides — Learn & Memorise the Quran';
const DESCRIPTION =
  'Free guides to learning and memorizing the Quran online: how to memorize step by step, how the AI recitation checker works, and how to learn in your browser — no sign-up.';

export const metadata: Metadata = {
  title: `${TITLE} | I Love Islam`,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/guides` },
  openGraph: {
    title: `${TITLE} | I Love Islam`,
    description: DESCRIPTION,
    url: `${SITE_URL}/guides`,
    siteName: 'I Love Islam',
    type: 'website',
    images: [
      {
        url: '/optimized/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'I Love Islam — Memorise the Quran with an AI Recitation Coach',
      },
    ],
  },
};

export default function GuidesIndex() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/guides` },
    ],
  };
  return (
    <TrustShell title="Quran Guides">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbLd) }}
      />
      <div className="space-y-4">
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[#6B7280]">
            <li>
              <Link href="/" className="hover:text-[#111827] hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="font-medium text-[#111827]">
              Guides
            </li>
          </ol>
        </nav>
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <p className="text-sm leading-relaxed text-[#6B7280]">
            Short, practical guides to learning and memorizing the Quran with the free AI
            coach on this site — no sign-up, nothing to install, the whole Quran included.
          </p>
        </div>
        {GUIDES.map((g) => (
          <div
            key={g.slug}
            className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
          >
            <h2 className="text-lg font-bold">
              <Link href={`/guides/${g.slug}`} className="hover:underline">
                {g.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{g.blurb}</p>
          </div>
        ))}
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <Link
            href="/hifz/recite"
            className="inline-block rounded-full bg-[#102E26] px-5 py-3 text-sm font-bold text-white hover:opacity-90"
          >
            Open the coach
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
            <Link href="/hifz" className="font-bold text-[#111827] hover:underline">
              Browse the Hifz Hub
            </Link>
          </p>
        </div>
      </div>
    </TrustShell>
  );
}
