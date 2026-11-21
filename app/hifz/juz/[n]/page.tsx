// app/hifz/juz/[n]/page.tsx — Juz overview (spec §1.1, Phase 2 full Quran).
// All 30 juz have pages: each lists its surah segments with ayah ranges,
// linking into the surah pages and the recitation coach. Juz 30 redirects
// to /hifz/juz-amma (the same content, the beginner path).
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getJuz, JUZ_PAGES } from '../../juz';
import { JUZ_FIRST_PAGE } from '../../mushaf';
import { getSurahById } from '../../surahs';
import { Breadcrumb, Attribution} from '../../components/HifzShared';
import { SITE_URL } from '../../lib/fetch';

export async function generateStaticParams() {
  return JUZ_PAGES.map((j) => ({ n: String(j.n) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>;
}): Promise<Metadata> {
  const { n } = await params;
  const juz = getJuz(Number(n));
  if (!juz || n === '30') {
    return { title: 'Juz not found | I Love Islam' };
  }
  const first = juz.segments[0];
  const last = juz.segments[juz.segments.length - 1];
  const firstSurah = getSurahById(first.surahId);
  const lastSurah = getSurahById(last.surahId);
  const title = `Juz ${juz.n} — ${juz.name} | I Love Islam`;
  const description =
    `Juz ${juz.n} (${juz.name}) — ${juz.totalAyahs} ayahs, from ` +
    `${firstSurah?.name ?? ''} ${firstSurah?.id}:${first.fromAyah} to ` +
    `${lastSurah?.name ?? ''} ${lastSurah?.id}:${last.toAyah}. ` +
    `Read, listen and memorise with the AI recitation coach.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/hifz/juz/${juz.n}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/hifz/juz/${juz.n}`,
      siteName: 'I Love Islam',
      type: 'article',
    },
  };
}

export default async function JuzPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  if (n === '30') redirect('/hifz/juz-amma');
  const juz = getJuz(Number(n));
  if (!juz) notFound();

  const first = juz.segments[0];
  const last = juz.segments[juz.segments.length - 1];
  const firstSurah = getSurahById(first.surahId);
  const prev = getJuz(juz.n - 1);
  const next = getJuz(juz.n + 1);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hifz', href: '/hifz' },
          { label: `Juz ${juz.n}` },
        ]}
      />

      <header className="mt-4 rounded-2xl bg-[#102E26] px-5 py-8 text-center text-white shadow-sm sm:px-8">
        <p dir="rtl" lang="ar" className="font-quran text-3xl text-[#FFB800]">
          {juz.arabic}
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Juz {juz.n} — {juz.name}
        </h1>
        <p className="mt-1 text-sm text-white/70">
          {juz.totalAyahs} ayahs · {juz.segments.length}{' '}
          {juz.segments.length === 1 ? 'surah' : 'surahs'} · Part {juz.n} of 30
        </p>
        {firstSurah && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/hifz/${firstSurah.slug}?mode=recite`}
              className="inline-block rounded-full bg-[#FFB800] px-6 py-3 text-sm font-bold text-[#102E26] hover:brightness-110"
            >
              Start reciting — Surah {firstSurah.name}
            </Link>
            <Link
              href={`/hifz/mushaf/${JUZ_FIRST_PAGE[juz.n]}`}
              className="inline-block rounded-full border border-white/40 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
            >
              Read as Mushaf →
            </Link>
          </div>
        )}
      </header>

      <section aria-labelledby="surahs-heading" className="mt-8">
        <h2 id="surahs-heading" className="text-xl font-bold text-[#102E26]">
          Surahs in Juz {juz.n}
        </h2>
        <ul className="mt-3 divide-y divide-[#E5E7EB] rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          {juz.segments.map((seg) => {
            const surah = getSurahById(seg.surahId);
            if (!surah) return null;
            const range =
              seg.fromAyah === 1 && seg.toAyah === surah.ayahCount
                ? `all ${surah.ayahCount} ayahs`
                : seg.fromAyah === seg.toAyah
                  ? `ayah ${seg.fromAyah}`
                  : `ayahs ${seg.fromAyah}–${seg.toAyah}`;
            return (
              <li key={seg.surahId}>
                <Link
                  href={`/hifz/${surah.slug}`}
                  className="flex min-w-0 items-center gap-3 px-4 py-3 hover:bg-[#FFFBF2]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E4FFF2] text-xs font-bold text-[#1FA36B]">
                    {surah.id}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-[#102E26]">
                      Surah {surah.name}
                    </span>
                    <span className="block truncate text-sm text-[#5b6b62]">
                      {surah.meaning} · {range}
                    </span>
                  </span>
                  <span aria-hidden="true" className="shrink-0 font-bold text-[#1FA36B]">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-sm text-[#5b6b62]">
          Juz {juz.n} runs from {firstSurah?.name} {firstSurah?.id}:{first.fromAyah} to{' '}
          {getSurahById(last.surahId)?.name} {last.surahId}:{last.toAyah}.
        </p>
      </section>

      <nav aria-label="More juz" className="mt-8 flex items-center justify-between gap-3">
        {prev ? (
          <Link
            href={prev.n === 30 ? '/hifz/juz-amma' : `/hifz/juz/${prev.n}`}
            className="rounded-full border border-[#102E26]/15 bg-white px-4 py-2 text-sm font-semibold text-[#1FA36B] hover:border-[#FFB800]"
          >
            ← Juz {prev.n} — {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={next.n === 30 ? '/hifz/juz-amma' : `/hifz/juz/${next.n}`}
            className="rounded-full border border-[#102E26]/15 bg-white px-4 py-2 text-sm font-semibold text-[#1FA36B] hover:border-[#FFB800]"
          >
            Juz {next.n} — {next.name} →
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
