// app/hifz/mushaf/[page]/page.tsx — Mushaf reading mode (spec §21).
// One Madani mushaf page (1–604) rendered like the printed Quran:
// ornamental surah headers, Bismillah, ayah-end markers, juz markers,
// Uthmani script. Server component; all 604 pages are statically
// generated at build time from Quran.com verses/by_page.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MUSHAF_TOTAL_PAGES, surahsOnMushafPage } from '../../mushaf';
import { getSurahById } from '../../surahs';
import { fetchMushafPage, breadcrumbJsonLd, SITE_URL } from '../../lib/fetch';
import { Attribution } from '../../components/HifzShared';
import MushafPageView from '../../components/MushafPageView';

export async function generateStaticParams() {
  return Array.from({ length: MUSHAF_TOTAL_PAGES }, (_, i) => ({
    page: String(i + 1),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  const n = Number(page);
  if (!Number.isInteger(n) || n < 1 || n > MUSHAF_TOTAL_PAGES) {
    return { title: 'Mushaf page not found | I Love Islam' };
  }
  const surahs = surahsOnMushafPage(n)
    .map(getSurahById)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const names = surahs.map((s) => `Surah ${s.name}`).join(' and ');
  const title = `Mushaf Page ${n} — ${names} | I Love Islam`;
  const description =
    `Read Mushaf page ${n} of 604 like the printed Madani Quran — ${names}. ` +
    `Indo-Pak or Uthmani script, ayah-end markers and juz markers. Free, no sign-up.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/hifz/mushaf/${n}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/hifz/mushaf/${n}`,
      siteName: 'I Love Islam',
      type: 'article',
    },
  };
}

export default async function MushafPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const n = Number(page);
  if (!Number.isInteger(n) || n < 1 || n > MUSHAF_TOTAL_PAGES) notFound();

  const verses = await fetchMushafPage(n);
  const surahs = surahsOnMushafPage(n)
    .map(getSurahById)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  // Wider than the old max-w-3xl on purpose: the mushaf page is rendered
  // at a fixed 970px design width (the widest Quranic line is ~895px —
  // see MushafPageView) and transform-scaled to fit, so the container
  // must be ~960px wide on desktop for the fit scale to stay ~1.
  // On a phone the container is fluid and the page scales down.
  // Tarteel-clean reader: the legacy page chrome (breadcrumb, "Mushaf —
  // Page N of 604" header, MushafNav prev/next + jump box above and below
  // the page) is gone — the MushafPageView top bar (sticky) is the only
  // chrome. Page navigation now lives in the chapter sheet (Prev/Next
  // links there, plus chapter / juz / bookmark jumps). The h1 stays,
  // screen-reader-only, so the page keeps its heading for SEO and
  // accessibility. No top padding: the sticky top bar sits flush at the
  // top of the viewport, full-screen like the reference.
  return (
    <main className="mx-auto max-w-5xl px-4 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Home', url: SITE_URL },
              { name: 'Hifz', url: `${SITE_URL}/hifz` },
              { name: 'Mushaf', url: `${SITE_URL}/hifz/mushaf` },
              { name: `Page ${n}`, url: `${SITE_URL}/hifz/mushaf/${n}` },
            ]),
          ),
        }}
      />
      <h1 className="sr-only">
        Mushaf — Page {n} of {MUSHAF_TOTAL_PAGES} —{' '}
        {surahs.map((s) => `Surah ${s.name}`).join(' and ')}
      </h1>

      <MushafPageView page={n} verses={verses} />

      <Attribution />
    </main>
  );
}
