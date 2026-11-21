// app/hifz/lib/fetch.ts — server-side Quran.com fetching for the Hifz hub.
// Server components use UPSTREAM_API directly (same pattern as app/quran/page.tsx).
// Quran text is NEVER pasted into the repo — it always comes from Quran.com.
// Word-by-word: the words payload's `text` is a Uthmani code glyph (not
// readable Arabic), so display words always come from the verse's own
// Indo-Pak text, split by whitespace, paired with the words payload by
// position for translation + transliteration.

import { UPSTREAM_API, TAFSIR_NAME, type Verse } from '../../quran/lib';
import { cleanIndopak } from '../../quran/lib';
import type { LaunchSurah } from '../surahs';

export const SITE_URL = 'https://www.iloveislam.life';

/** Visible attribution — spec §9.2, on every hifz page. */
export const ATTRIBUTION =
  'Quran text, translation (Saheeh International) and tafsir (Ibn Kathir Abridged) via Quran.com.';

/** Al-Baqarah metadata for the Ayat al-Kursi pages (Al-Baqarah as a whole is NOT in v1). */
export const AL_BAQARAH: LaunchSurah = {
  id: 2,
  slug: 'al-baqarah',
  arabic: 'البقرة',
  name: 'Al-Baqarah',
  meaning: 'The Cow',
  ayahCount: 286,
  revelation: 'Madani',
  juz: 1,
  juzEnd: 3,
};

export interface WordInfo {
  position: number;
  translation: string;
  transliteration: string;
  audioUrl?: string;
}

export interface VerseWithWords extends Verse {
  words?: WordInfo[];
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

/** All verses of a surah: Indo-Pak text + Saheeh International + reciter audio. */
export async function fetchSurahVerses(
  surahId: number,
  translationId = 20,
  reciterId = 7,
): Promise<Verse[]> {
  const data = await fetchJson(
    `${UPSTREAM_API}/verses/by_chapter/${surahId}?fields=text_indopak,text_uthmani&translations=${translationId}&audio=${reciterId}&per_page=all`,
  );
  const verses = (data as { verses?: Verse[] } | null)?.verses;
  return Array.isArray(verses) ? verses : [];
}

/** One verse by canonical key, e.g. "67:1". */
export async function fetchVerseByKey(
  key: string,
  translationId = 20,
  reciterId = 7,
): Promise<Verse | null> {
  const data = await fetchJson(
    `${UPSTREAM_API}/verses/by_key/${key}?fields=text_indopak,text_uthmani&translations=${translationId}&audio=${reciterId}`,
  );
  const verse = (data as { verse?: Verse } | null)?.verse;
  return verse ?? null;
}

/** Word-by-word data for one verse, paired with the verse's Indo-Pak words by position. */
export async function fetchVerseWords(key: string): Promise<WordInfo[]> {
  const data = await fetchJson(
    `${UPSTREAM_API}/verses/by_key/${key}?fields=text_indopak,text_uthmani&words=true`,
  );
  const raw = (data as { verse?: { words?: Record<string, unknown>[] } } | null)?.verse?.words;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((w) => w.char_type_name === 'word')
    .map((w) => ({
      position: Number(w.position ?? 0),
      translation: String(
        (w.translation as { text?: string } | undefined)?.text ?? '',
      ),
      transliteration: String(
        (w.transliteration as { text?: string } | undefined)?.text ?? '',
      ),
      audioUrl:
        typeof w.audio_url === 'string' ? w.audio_url : undefined,
    }));
}

/** Word-by-word data for a whole surah, keyed by verse number. Client code
 *  fetches this through the proxy instead; this server helper is for the
 *  single-ayah pages. Kept here so the pairing logic lives in one place. */
export function pairWords(indopakText: string, words: WordInfo[]): { arabic: string; translation: string; transliteration: string; audioUrl?: string }[] {
  const display = cleanIndopak(indopakText).split(/\s+/).filter(Boolean);
  return display.map((arabic, i) => {
    const w = words[i];
    return {
      arabic,
      translation: w?.translation ?? '',
      transliteration: w?.transliteration ?? '',
      audioUrl: w?.audioUrl,
    };
  });
}

/** Tafsir (Ibn Kathir Abridged, id 169) for one ayah — server-side, for the ayah page. */
export async function fetchTafsir(key: string): Promise<string> {
  const data = await fetchJson(`${UPSTREAM_API}/tafsirs/169/by_ayah/${key}`);
  const text = String((data as { tafsir?: { text?: string } } | null)?.tafsir?.text ?? '');
  return text.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
}

export { TAFSIR_NAME };

/* ------------------------------------------------------------------ */
/*  JSON-LD helpers (spec §9.1)                                       */
/* ------------------------------------------------------------------ */

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function surahJsonLd(surah: LaunchSurah, description: string) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `Surah ${surah.name} — Read, Listen & Memorise`,
      description,
      inLanguage: ['ar', 'en'],
      author: { '@type': 'Organization', name: 'Hifz', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'Hifz', url: SITE_URL },
      mainEntityOfPage: `${SITE_URL}/hifz/${surah.slug}`,
    },
    breadcrumbJsonLd([
      { name: 'Home', url: SITE_URL },
      { name: 'Hifz', url: `${SITE_URL}/hifz` },
      { name: `Surah ${surah.name}`, url: `${SITE_URL}/hifz/${surah.slug}` },
    ]),
  ];
}

export function ayahJsonLd(opts: {
  surah: LaunchSurah;
  ayah: number;
  key: string;
  description: string;
  arabicText: string;
}) {
  const { surah, ayah, key, description, arabicText } = opts;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `Surah ${surah.name} Ayah ${ayah} (${key})`,
      description,
      inLanguage: ['ar', 'en'],
      author: { '@type': 'Organization', name: 'Hifz', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'Hifz', url: SITE_URL },
      mainEntityOfPage: `${SITE_URL}/hifz/${surah.slug}/${surah.id}-${ayah}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Quotation',
      text: arabicText,
      isBasedOn: { '@type': 'CreativeWork', name: 'The Holy Quran', url: 'https://quran.com' },
      inLanguage: 'ar',
    },
    breadcrumbJsonLd([
      { name: 'Home', url: SITE_URL },
      { name: 'Hifz', url: `${SITE_URL}/hifz` },
      { name: `Surah ${surah.name}`, url: `${SITE_URL}/hifz/${surah.slug}` },
      {
        name: `Ayah ${ayah}`,
        url: `${SITE_URL}/hifz/${surah.slug}/${surah.id}-${ayah}`,
      },
    ]),
  ];
}

/** Prev/next surah within the launch set, in mushaf order. */
export function prevNextSurah(all: LaunchSurah[], currentId: number) {
  const sorted = [...all].sort((a, b) => a.id - b.id);
  const idx = sorted.findIndex((s) => s.id === currentId);
  return {
    prev: idx > 0 ? sorted[idx - 1] : null,
    next: idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null,
  };
}
