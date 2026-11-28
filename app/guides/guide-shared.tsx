// app/guides/guide-shared.tsx — shared bits for the SEO guide pages
// (2026-11-28). These are plain informational pages, not app screens:
// they reuse the trust-page look (TrustShell + white cards) and carry
// their own visible breadcrumb + FAQPage / BreadcrumbList JSON-LD.
// Nothing here touches the app UI, reader, coach or test.
import Link from 'next/link';
import { SITE_URL } from '../hifz/lib/fetch';

export type Faq = { q: string; a: string };

export const GUIDES: { slug: string; title: string; blurb: string }[] = [
  {
    slug: 'how-to-memorize-the-quran',
    title: 'How to Memorize the Quran',
    blurb:
      'A step-by-step method: start small, listen first, recite aloud to the coach, and revise every day.',
  },
  {
    slug: 'memorize-quran-online-free',
    title: 'Memorize Quran Online Free',
    blurb:
      'Memorize in your browser — nothing to install, no sign-up, no payment — with instant word-by-word feedback.',
  },
  {
    slug: 'quran-recitation-checker',
    title: 'Quran Recitation Checker',
    blurb:
      'How the AI coach checks your recitation word by word — what it checks, and what it does not do.',
  },
  {
    slug: 'learn-quran-online',
    title: 'Learn Quran Online',
    blurb:
      'Read the Mushaf, listen to recitation, understand with translation and tafsir, and practise aloud.',
  },
];

/** Visible breadcrumb: Home → Guides → this page. (The app's own
 *  Breadcrumb component is a deliberate no-op — Tarteel has none —
 *  so the guides carry their own.) */
export function GuideBreadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[#6B7280]">
        <li>
          <Link href="/" className="hover:text-[#111827] hover:underline">
            Home
          </Link>
        </li>
        <li aria-hidden="true">›</li>
        <li>
          <Link href="/guides" className="hover:text-[#111827] hover:underline">
            Guides
          </Link>
        </li>
        <li aria-hidden="true">›</li>
        <li aria-current="page" className="font-medium text-[#111827]">
          {current}
        </li>
      </ol>
    </nav>
  );
}

/** FAQ section, rendered from the same data as the FAQPage JSON-LD. */
export function GuideFaq({ faqs }: { faqs: Faq[] }) {
  return (
    <section className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <h2 className="text-lg font-bold">Frequently asked questions</h2>
      <dl className="mt-4 space-y-4">
        {faqs.map((faq) => (
          <div key={faq.q}>
            <dt className="text-sm font-bold leading-relaxed">{faq.q}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-[#6B7280]">{faq.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Call to action into the app: the coach, the hub, and the plans. */
export function GuideCta() {
  return (
    <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <h2 className="text-lg font-bold">Try it now — free, no sign-up</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#6B7280]">
        Open the coach, pick a surah, and recite aloud. The coach listens and shows you,
        word by word, how you did.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/hifz/recite"
          className="rounded-full bg-[#102E26] px-5 py-3 text-sm font-bold text-white hover:opacity-90"
        >
          Open the coach
        </Link>
        <Link
          href="/hifz"
          className="rounded-full border border-[#111827]/25 px-5 py-3 text-sm font-bold text-[#111827] hover:bg-white"
        >
          Browse the Hifz Hub
        </Link>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
        <Link href="/hifz/plans" className="font-bold text-[#111827] hover:underline">
          See the 7-day and 30-day hifz plans
        </Link>
      </p>
    </div>
  );
}

/** Links to the other guides, for readers and for search engines. */
export function GuideMore({ except }: { except: string }) {
  const others = GUIDES.filter((g) => g.slug !== except);
  return (
    <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <h2 className="text-lg font-bold">More guides</h2>
      <ul className="mt-3 space-y-2">
        {others.map((g) => (
          <li key={g.slug} className="text-sm leading-relaxed">
            <Link
              href={`/guides/${g.slug}`}
              className="font-bold text-[#111827] hover:underline"
            >
              {g.title}
            </Link>
            <span className="text-[#6B7280]"> — {g.blurb}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** FAQPage + BreadcrumbList JSON-LD for a guide page. Rendered with
 *  the docs' `<`-sanitised JSON.stringify (see
 *  node_modules/next/dist/docs/01-app/02-guides/json-ld.md). */
export function guideJsonLd(opts: {
  slug: string;
  title: string;
  description: string;
  faqs: Faq[];
}) {
  const url = `${SITE_URL}/guides/${opts.slug}`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: opts.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/guides` },
        { '@type': 'ListItem', position: 3, name: opts.title, item: url },
      ],
    },
  ];
}

/** Serialise JSON-LD the way the Next.js docs recommend. */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
