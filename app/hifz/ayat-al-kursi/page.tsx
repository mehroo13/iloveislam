// app/hifz/ayat-al-kursi/page.tsx — special single-ayah study page (spec §1.1, §4.2).
// Canonical ayah content lives at /hifz/al-baqarah/2-255; this page links there.
import type { Metadata } from 'next';
import Link from 'next/link';
import { AYAT_AL_KURSI, getSurahBySlug } from '../surahs';
import { fetchVerseByKey, fetchVerseWords, fetchTafsir, ayahJsonLd, SITE_URL } from '../lib/fetch';
import { getVirtue } from '../virtues';
import AyahClient from '../components/AyahClient';
import VirtuesBlock from '../components/VirtuesBlock';
import { Breadcrumb, Attribution} from '../components/HifzShared';
import { cleanTranslationText, cleanIndopak } from '../../quran/lib';

const KEY = AYAT_AL_KURSI.key; // "2:255"
const BAQARAH = getSurahBySlug('al-baqarah')!;

export const metadata: Metadata = {
  title: 'Ayat al-Kursi (2:255) — Memorise | I Love Islam',
  description:
    'Memorise Ayat al-Kursi (2:255), the greatest verse in the Book of Allah — Arabic, translation, word-by-word, audio and tafsir, with the recitation coach.',
  alternates: { canonical: `${SITE_URL}/hifz/ayat-al-kursi` },
  openGraph: {
    title: 'Ayat al-Kursi (2:255) — Memorise | I Love Islam',
    description:
      'Memorise Ayat al-Kursi (2:255), the greatest verse in the Book of Allah — Arabic, translation, word-by-word, audio and tafsir.',
    url: `${SITE_URL}/hifz/ayat-al-kursi`,
    siteName: 'I Love Islam',
    type: 'article',
  },
};

export default async function AyatAlKursiPage() {
  const [verse, words, tafsir] = await Promise.all([
    fetchVerseByKey(KEY),
    fetchVerseWords(KEY),
    fetchTafsir(KEY),
  ]);
  const virtue = getVirtue('ayat-al-kursi');
  const description =
    'Memorise Ayat al-Kursi (2:255), the greatest verse in the Book of Allah — Arabic, translation, word-by-word, audio and tafsir, with the recitation coach.';

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      {verse && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              ayahJsonLd({
                surah: BAQARAH,
                ayah: 255,
                key: KEY,
                description,
                arabicText: cleanIndopak(verse.text_indopak),
              }),
            ),
          }}
        />
      )}
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hifz', href: '/hifz' },
          { label: 'Ayat al-Kursi' },
        ]}
      />
      <header className="mt-4 rounded-2xl bg-[#102E26] px-5 py-8 text-center text-white shadow-sm sm:px-8">
        <p dir="rtl" lang="ar" className="font-quran text-4xl text-[#FFB800] sm:text-5xl">آية الكرسي</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Ayat al-Kursi</h1>
        <p className="mt-1 text-base text-white/80">The Throne Verse · Surah Al-Baqarah, ayah 255 (2:255)</p>
        <p className="mt-2 text-sm text-white/70">
          One ayah · Madani · Juz 3 ·{' '}
          <Link href="/hifz/al-baqarah/2-255" className="font-semibold text-[#F2C94C] underline">
            Canonical ayah page: /hifz/al-baqarah/2-255
          </Link>
        </p>
      </header>

      {!verse && (
        <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-white px-5 py-4 text-sm text-red-700">
          Ayat al-Kursi could not be loaded right now. Check your connection and reload the page.
        </p>
      )}

      {verse && (
        <div className="mt-6">
          <AyahClient
            surah={BAQARAH}
            ayah={255}
            initialVerse={verse}
            initialWords={words}
            initialTafsir={tafsir}
            prevKey={null}
            nextKey={null}
          />
        </div>
      )}

      <VirtuesBlock slug="ayat-al-kursi" />

      {virtue && (
        <p className="mt-4 text-sm text-[#5b6b62]">
          Source: {virtue.source} · Graded {virtue.grading}.
        </p>
      )}

      <section aria-labelledby="plan-heading" className="mt-8 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <h2 id="plan-heading" className="text-lg font-bold text-[#102E26]">Memorise it in 7 days</h2>
        <p className="mt-1 text-sm leading-relaxed text-[#5b6b62]">
          One ayah, seven days: listen each morning, hide it, recite it, and let the coach check
          every word. By day 7, recite it three times correctly in a row — that is memorised.
        </p>
        <Link
          href="/hifz/al-baqarah/2-255?mode=recite"
          className="mt-4 inline-block rounded-full bg-[#102E26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1FA36B]"
        >
          Recite Ayat al-Kursi now
        </Link>
      </section>

      {verse?.translations?.[0] && (
        <p lang="en" translate="no" className="mt-6 text-sm leading-relaxed text-[#5b6b62]">
          “{cleanTranslationText(verse.translations[0].text)}” — Saheeh International, 2:255.
        </p>
      )}

      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
