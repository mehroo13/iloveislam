// app/hifz/ayat-al-kursi/page.tsx — special single-ayah study page (spec §1.1, §4.2).
// Canonical ayah content lives at /hifz/al-baqarah/2-255; this page links there.
// Al-Baqarah as a whole is NOT in v1.
import type { Metadata } from 'next';
import Link from 'next/link';
import { AYAT_AL_KURSI } from '../surahs';
import { fetchVerseByKey, fetchVerseWords, fetchTafsir, ayahJsonLd, SITE_URL, AL_BAQARAH } from '../lib/fetch';
import { getVirtue } from '../virtues';
import AyahClient from '../components/AyahClient';
import VirtuesBlock from '../components/VirtuesBlock';
import { Breadcrumb, Attribution, PremiumSection } from '../components/HifzShared';
import { stripHtml, cleanIndopak } from '../../quran/lib';

const KEY = AYAT_AL_KURSI.key; // "2:255"

export const metadata: Metadata = {
  title: 'Ayat al-Kursi (2:255) — Memorise | Hifz',
  description:
    'Memorise Ayat al-Kursi (2:255), the greatest verse in the Book of Allah — Arabic, translation, word-by-word, audio and tafsir, with the recitation coach.',
  alternates: { canonical: `${SITE_URL}/hifz/ayat-al-kursi` },
  openGraph: {
    title: 'Ayat al-Kursi (2:255) — Memorise | Hifz',
    description:
      'Memorise Ayat al-Kursi (2:255), the greatest verse in the Book of Allah — Arabic, translation, word-by-word, audio and tafsir.',
    url: `${SITE_URL}/hifz/ayat-al-kursi`,
    siteName: 'Hifz',
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
                surah: AL_BAQARAH,
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
      <header className="mt-4 rounded-2xl bg-[#0B3D2E] px-5 py-8 text-center text-white shadow-sm sm:px-8">
        <p dir="rtl" lang="ar" className="font-quran text-4xl text-[#C9A227] sm:text-5xl">آية الكرسي</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Ayat al-Kursi</h1>
        <p className="mt-1 text-base text-white/80">The Throne Verse · Surah Al-Baqarah, ayah 255 (2:255)</p>
        <p className="mt-2 text-sm text-white/70">
          One ayah · Madani · Juz 3 ·{' '}
          <Link href="/hifz/al-baqarah/2-255" className="font-semibold text-[#E7D9A8] underline">
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
            surah={AL_BAQARAH}
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

      <section aria-labelledby="plan-heading" className="mt-8 rounded-2xl border border-[#e5e0d3] bg-white p-5 shadow-sm">
        <h2 id="plan-heading" className="text-lg font-bold text-[#0B3D2E]">Memorise it in 7 days</h2>
        <p className="mt-1 text-sm leading-relaxed text-[#5b6b62]">
          One ayah, seven days: listen each morning, hide it, recite it, and let the coach check
          every word. By day 7, recite it three times correctly in a row — that is memorised.
        </p>
        <Link
          href="/hifz/al-baqarah/2-255?mode=recite"
          className="mt-4 inline-block rounded-full bg-[#0B3D2E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#146B4D]"
        >
          Recite Ayat al-Kursi now
        </Link>
      </section>

      {verse?.translations?.[0] && (
        <p className="mt-6 text-sm leading-relaxed text-[#5b6b62]">
          “{stripHtml(verse.translations[0].text)}” — Saheeh International, 2:255.
        </p>
      )}

      <PremiumSection />
      <Attribution reciterName="Mishary Alafasy" />
    </main>
  );
}
