// app/hifz/[slug]/page.tsx — per-surah study page (spec §4.1 template).
// Server component: fetches verses from Quran.com upstream, renders the hero
// + client island. Al-Baqarah is NOT a launch surah (only 2:255 exists) —
// /hifz/al-baqarah itself 404s.
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LAUNCH_SURAHS, getSurahBySlug } from '../surahs';
import { getPlan } from '../plans';
import { fetchSurahVerses, surahJsonLd, prevNextSurah, SITE_URL } from '../lib/fetch';
import SurahClient from '../components/SurahClient';
import VirtuesBlock from '../components/VirtuesBlock';
import PlanCard from '../components/PlanCard';
import { Breadcrumb, Attribution, PremiumSection, SurahHero } from '../components/HifzShared';

export async function generateStaticParams() {
  return LAUNCH_SURAHS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const surah = getSurahBySlug(slug);
  if (!surah) return { title: 'Surah not found | I Love Islam' };
  const title = `Surah ${surah.name} — Read, Listen & Memorise | I Love Islam`;
  const description = `Memorise Surah ${surah.name} (${surah.id}) — Arabic, translation, audio and a 30-day hifz plan. Recite aloud and get word-by-word feedback.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/hifz/${surah.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/hifz/${surah.slug}`,
      siteName: 'I Love Islam',
      type: 'article',
    },
  };
}

export default async function SurahPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const surah = getSurahBySlug(slug);
  if (!surah) notFound();

  const verses = await fetchSurahVerses(surah.id);
  const plan7 = getPlan(surah.slug, 7);
  const plan30 = getPlan(surah.slug, 30);
  const { prev, next } = prevNextSurah(LAUNCH_SURAHS, surah.id);
  const description = `Memorise Surah ${surah.name} (${surah.id}) — Arabic, translation, audio and a 30-day hifz plan. Recite aloud and get word-by-word feedback.`;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(surahJsonLd(surah, description)) }}
      />
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hifz', href: '/hifz' },
          { label: `Surah ${surah.name}` },
        ]}
      />
      <div className="mt-4">
        <SurahHero surah={surah} planDays={plan30 ? 30 : 7} />
      </div>

      {verses.length === 0 && (
        <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-white px-5 py-4 text-sm text-red-700">
          The Quran text could not be loaded right now. Check your connection and reload the page.
        </p>
      )}

      <SurahClient
        surah={surah}
        initialVerses={verses}
      />

      <VirtuesBlock slug={surah.slug} />

      {/* Memorisation plans */}
      <section aria-labelledby="plans-heading" className="mt-8">
        <h2 id="plans-heading" className="text-2xl font-bold text-[#0B3D2E]">Memorisation plan</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {plan7 && <PlanCard plan={plan7} surahSlug={surah.slug} surahName={surah.name} />}
          {plan30 && <PlanCard plan={plan30} surahSlug={surah.slug} surahName={surah.name} premium />}
        </div>
        <p className="mt-3 text-sm text-[#5b6b62]">
          <Link href="/hifz/plans" className="font-semibold text-[#146B4D] underline">See all plans</Link>
          {' '}— including the Juz Amma 90-day plan.
        </p>
      </section>

      {/* Related */}
      <nav aria-label="Related pages" className="mt-10 rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-[#0B3D2E]">Keep going</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {prev && (
            <li>
              <Link href={`/hifz/${prev.slug}`} className="font-semibold text-[#146B4D] hover:underline">
                ← Previous surah: {prev.name} ({prev.ayahCount} ayahs)
              </Link>
            </li>
          )}
          {next && (
            <li>
              <Link href={`/hifz/${next.slug}`} className="font-semibold text-[#146B4D] hover:underline">
                Next surah: {next.name} ({next.ayahCount} ayahs) →
              </Link>
            </li>
          )}
          {surah.juz === 30 ? (
            <li>
              <Link href="/hifz/juz-amma" className="font-semibold text-[#146B4D] hover:underline">
                Juz 30 (Juz Amma) overview
              </Link>
            </li>
          ) : (
            <li>
              <Link href="/hifz/juz-amma" className="font-semibold text-[#146B4D] hover:underline">
                Juz Amma — the beginner path
              </Link>
            </li>
          )}
          <li>
            <Link href="/quran" className="font-semibold text-[#146B4D] hover:underline">
              Read the whole Quran in the reader
            </Link>
          </li>
          <li>
            <Link href="/hifz/my-progress" className="font-semibold text-[#146B4D] hover:underline">
              My progress — streak, mistakes and export
            </Link>
          </li>
        </ul>
      </nav>

      <PremiumSection />
      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
