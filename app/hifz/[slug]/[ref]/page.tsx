// app/hifz/[slug]/[ref]/page.tsx — per-ayah page (spec §4.3).
// [ref] is SURAH-AYAH, e.g. 67-1; the page shows the canonical key 67:1.
// All 114 surahs have ayah pages (Phase 2, full Quran — 6,236 ayahs).
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALL_SURAHS, getSurahBySlug } from '../../surahs';
import {
  fetchVerseByKey, fetchVerseWords, fetchTafsir, ayahJsonLd, SITE_URL,
} from '../../lib/fetch';
import { cleanTranslationText, cleanIndopak } from '../../../quran/lib';
import AyahClient from '../../components/AyahClient';
import { Breadcrumb, Attribution, BackToReader } from '../../components/HifzShared';

export async function generateStaticParams() {
  const params: { slug: string; ref: string }[] = [];
  for (const s of ALL_SURAHS) {
    for (let ayah = 1; ayah <= s.ayahCount; ayah++) {
      params.push({ slug: s.slug, ref: `${s.id}-${ayah}` });
    }
  }
  return params;
}

function parseRef(ref: string): { surahId: number; ayah: number } | null {
  const m = /^(\d+)-(\d+)$/.exec(ref);
  if (!m) return null;
  return { surahId: Number(m[1]), ayah: Number(m[2]) };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; ref: string }>;
}): Promise<Metadata> {
  const { slug, ref } = await params;
  const parsed = parseRef(ref);
  const surah = getSurahBySlug(slug);
  if (!parsed || !surah || parsed.surahId !== surah.id) {
    return { title: 'Ayah not found | I Love Islam' };
  }
  const key = `${surah.id}:${parsed.ayah}`;
  const title = `Surah ${surah.name} Ayah ${parsed.ayah} (${key}) | I Love Islam`;
  const description = `Read Surah ${surah.name} verse ${parsed.ayah} with Indo-Pak Arabic, Saheeh International translation, word-by-word, audio and tafsir.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/hifz/${surah.slug}/${surah.id}-${parsed.ayah}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/hifz/${surah.slug}/${surah.id}-${parsed.ayah}`,
      siteName: 'I Love Islam',
      type: 'article',
    },
  };
}

export default async function AyahPage({
  params,
}: {
  params: Promise<{ slug: string; ref: string }>;
}) {
  const { slug, ref } = await params;
  const parsed = parseRef(ref);
  const isKursi = slug === 'al-baqarah' && parsed?.surahId === 2 && parsed.ayah === 255;
  const surah = getSurahBySlug(slug);
  if (!parsed || !surah || parsed.surahId !== surah.id) notFound();
  if (parsed.ayah < 1 || parsed.ayah > surah.ayahCount) notFound();

  const key = `${surah.id}:${parsed.ayah}`;
  const [verse, words, tafsir] = await Promise.all([
    fetchVerseByKey(key),
    fetchVerseWords(key),
    fetchTafsir(key),
  ]);
  if (!verse) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <p role="alert" className="rounded-2xl border border-red-200 bg-white px-5 py-4 text-sm text-red-700">
          This ayah could not be loaded right now. Check your connection and reload the page.
        </p>
      </main>
    );
  }

  const description = `Read Surah ${surah.name} verse ${parsed.ayah} with Indo-Pak Arabic, Saheeh International translation, word-by-word, audio and tafsir.`;
  const prevKey = parsed.ayah > 1 ? `${surah.id}:${parsed.ayah - 1}` : null;
  const nextKey = parsed.ayah < surah.ayahCount ? `${surah.id}:${parsed.ayah + 1}` : null;
  const prevLink = prevKey;
  const nextLink = nextKey;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            ayahJsonLd({
              surah,
              ayah: parsed.ayah,
              key,
              description,
              arabicText: cleanIndopak(verse.text_indopak),
            }),
          ),
        }}
      />
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hifz', href: '/hifz' },
          { label: `Surah ${surah.name}`, href: `/hifz/${surah.slug}` },
          { label: `Ayah ${parsed.ayah} (${key})` },
        ]}
      />

      {/* Audit C2: ayah pages had no back button at all. Same fixed
          destination as every other feature screen — the Features menu
          (/?dashboard=1), never router.back(). */}
      <BackToReader />
      <header className="mt-4 rounded-2xl bg-[#102E26] px-5 py-8 text-center text-white shadow-sm sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#FFB800]">
          Surah {surah.name} · {key}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Surah {surah.name} Ayah {parsed.ayah}
        </h1>
        <p className="mt-1 text-sm text-white/70">
          {surah.meaning} · {surah.revelation} · Juz {surah.juz}
          {surah.juzEnd && surah.juzEnd !== surah.juz ? `–${surah.juzEnd}` : ''}
        </p>
      </header>

      <div className="mt-6">
        <AyahClient
          surah={surah}
          ayah={parsed.ayah}
          initialVerse={verse}
          initialWords={words}
          initialTafsir={tafsir}
          prevKey={prevLink}
          nextKey={nextLink}
        />
      </div>

      <section aria-labelledby="more-heading" className="mt-10 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <h2 id="more-heading" className="text-lg font-bold text-[#102E26]">More from Surah {surah.name}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link href={`/hifz/${surah.slug}`} className="font-semibold text-[#1FA36B] hover:underline">
              Study the whole surah — read, listen and memorise →
            </Link>
          </li>
          {isKursi && (
            <li>
              <Link href="/hifz/ayat-al-kursi" className="font-semibold text-[#1FA36B] hover:underline">
                Ayat al-Kursi — the single-ayah study page →
              </Link>
            </li>
          )}
          <li>
            <Link href="/hifz/test" className="font-semibold text-[#1FA36B] hover:underline">
              Test yourself on this ayah in Test Mode →
            </Link>
          </li>
          <li>
            <Link href="/hifz/my-progress" className="font-semibold text-[#1FA36B] hover:underline">
              My progress — streak, mistakes and export →
            </Link>
          </li>
        </ul>
        {verse.translations?.[0] && (
          <p className="mt-4 text-sm leading-relaxed text-[#5b6b62]">
            “{cleanTranslationText(verse.translations[0].text)}” — Saheeh International, {key}.
          </p>
        )}
      </section>

      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
