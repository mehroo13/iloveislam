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
import { Breadcrumb, Attribution } from '../../components/HifzShared';
import MushafNav from '../../components/MushafNav';
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

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Home', url: SITE_URL },
              { name: 'Hifz', url: `${SITE_URL}/hifz` },
              { name: 'Mushaf', url: `${SITE_URL}/hifz/mushaf/1` },
              { name: `Page ${n}`, url: `${SITE_URL}/hifz/mushaf/${n}` },
            ]),
          ),
        }}
      />
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hifz', href: '/hifz' },
          { label: 'Mushaf', href: '/hifz/mushaf/1' },
          { label: `Page ${n}` },
        ]}
      />

      <header className="mt-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#0B3D2E] sm:text-3xl">
          Mushaf — Page {n} of {MUSHAF_TOTAL_PAGES}
        </h1>
        <p className="mt-1 text-sm text-[#5b6b62]">
          {surahs.map((s) => `Surah ${s.name}`).join(' · ')} · Read it like the printed Quran
        </p>
      </header>

      <MushafNav page={n} />

      <div className="mt-4">
        <MushafPageView page={n} verses={verses} />
      </div>

      <MushafNav page={n} />

      <Attribution />
    </main>
  );
}
