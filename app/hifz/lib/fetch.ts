// app/hifz/lib/fetch.ts — server-side Quran.com fetching for the Hifz hub.
// Server components use UPSTREAM_API directly (same pattern as app/quran/page.tsx).
// Quran text is NEVER pasted into the repo — it always comes from Quran.com.
// Word-by-word: the words payload's `text` is a Uthmani code glyph (not
// readable Arabic), so display words always come from the verse's own
// Indo-Pak text, split by whitespace, paired with the words payload by
// position for translation + transliteration.

import { UPSTREAM_API, TAFSIR_ID, TAFSIR_NAME, TRANSLATIONS, TAFSIRS, KHATTAB_TRANSLATION_ID, type Verse } from '../../quran/lib';
import { cleanIndopak } from '../../quran/lib';
import type { HifzSurah } from '../surahs';

export const SITE_URL = 'https://www.iloveislam.life';

/** Visible attribution — spec §9.2, on every hifz page. The default
 *  (Saheeh International + Ibn Kathir Abridged); use attributionFor()
 *  below when the reader picked a different translation/tafsir. */
export const ATTRIBUTION =
  'Quran text, translation (Saheeh International) and tafsir (Ibn Kathir Abridged) via Quran.com.';

/** Attribution naming the translation/tafsir actually selected, so the
 *  credit always matches what is on screen. Quran text, translations and
 *  tafsirs are served freely by Quran.com's public API with attribution;
 *  nothing is pasted into the repo. */
export function attributionFor(translationId = 20, tafsirId: number = TAFSIR_ID): string {
  const tName = TRANSLATIONS.find((t) => t.id === translationId)?.name ?? 'Saheeh International';
  const fName = TAFSIRS.find((t) => t.id === tafsirId)?.name ?? TAFSIR_NAME;
  return `Quran text, translation (${tName}) and tafsir (${fName}) via Quran.com.`;
}

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

/** All verses of a surah: Indo-Pak text + Saheeh International + reciter audio.
 *  When translationId is Khattab (131 — not a v4 resource), the Arabic +
 *  audio still come from v4 (fetched with the default translation so the
 *  Verse shape stays complete) and the translation text is substituted
 *  from the open quran-api dataset (same source as /api/quran/khattab).
 *  A missing Khattab file leaves the default translation in place
 *  rather than failing the whole surah. */
export async function fetchSurahVerses(
  surahId: number,
  translationId = 20,
  reciterId = 7,
): Promise<Verse[]> {
  const data = await fetchJson(
    `${UPSTREAM_API}/verses/by_chapter/${surahId}?fields=text_indopak,text_uthmani&translations=${translationId === KHATTAB_TRANSLATION_ID ? 20 : translationId}&audio=${reciterId}&per_page=all`,
  );
  const verses = (data as { verses?: Verse[] } | null)?.verses;
  if (!Array.isArray(verses)) return [];
  if (translationId === KHATTAB_TRANSLATION_ID) {
    const khattab = await fetchKhattabSurah(surahId);
    if (khattab) {
      for (const v of verses) {
        const text = khattab[v.verse_number];
        if (typeof text === 'string' && text.length > 0) {
          v.translations = [{ text }];
        }
      }
    }
  }
  return verses;
}

/** Khattab text for one surah, keyed by verse number, from the open
 *  quran-api dataset (eng-mustafakhattaba) via jsDelivr. Null on any
 *  failure — callers fall back to the v4 translation already fetched. */
async function fetchKhattabSurah(surahId: number): Promise<Record<number, string> | null> {
  try {
    const res = await fetch(
      `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/eng-mustafakhattaba/${surahId}.json`,
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(12000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { chapter?: { verse?: number; text?: string }[] };
    const out: Record<number, string> = {};
    for (const v of Array.isArray(data?.chapter) ? data.chapter : []) {
      if (typeof v?.verse === 'number' && typeof v?.text === 'string') out[v.verse] = v.text;
    }
    return out;
  } catch {
    return null;
  }
}

/** One verse by canonical key, e.g. "67:1". Khattab (131) substitutes
 *  the same way as fetchSurahVerses. */
export async function fetchVerseByKey(
  key: string,
  translationId = 20,
  reciterId = 7,
): Promise<Verse | null> {
  const data = await fetchJson(
    `${UPSTREAM_API}/verses/by_key/${key}?fields=text_indopak,text_uthmani&translations=${translationId === KHATTAB_TRANSLATION_ID ? 20 : translationId}&audio=${reciterId}`,
  );
  const verse = (data as { verse?: Verse } | null)?.verse;
  if (!verse) return null;
  if (translationId === KHATTAB_TRANSLATION_ID) {
    const surah = Number(key.split(':')[0]);
    const khattab = await fetchKhattabSurah(surah);
    const text = khattab?.[verse.verse_number];
    if (typeof text === 'string' && text.length > 0) verse.translations = [{ text }];
  }
  return verse;
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

/** One Madani mushaf page (verses/by_page) with word positions — for the
 *  Mushaf reading mode. Words carry text_uthmani, line_number and
 *  char_type_name ('word' | 'end' for the ayah-end marker). */
export interface MushafWord {
  text_uthmani: string;
  /** Indo-Pak form of the same word (Quran.com word_fields=text_indopak). */
  text_indopak?: string;
  line_number: number;
  page_number: number;
  position: number;
  char_type_name: string;
}

export interface MushafVerse {
  verse_key: string;
  juz_number: number;
  /** Hizb (1–60) the verse falls in — for the reader top bar. */
  hizb_number?: number;
  words: MushafWord[];
}

export async function fetchMushafPage(page: number): Promise<MushafVerse[]> {
  const data = await fetchJson(
    `${UPSTREAM_API}/verses/by_page/${page}?words=true&word_fields=text_uthmani,text_indopak,line_number,page_number,position,char_type_name&fields=text_uthmani,hizb_number`,
  );
  const verses = (data as { verses?: MushafVerse[] } | null)?.verses;
  return Array.isArray(verses) ? verses : [];
}

/* ------------------------------------------------------------------ */
/*  Mushaf word cleaning (spec §21)                                     */
/* ------------------------------------------------------------------ */

/* Small high pause marks (U+06D6–U+06DC, U+06DF–U+06E8, U+06EA–U+06ED):
   Quran.com's Uthmani word text carries them after a space ("رَيْبَ ۛ"),
   which renders as a tiny floating mark above the line. Attaching the
   mark to the preceding letter puts it above the word, as in the printed
   mushaf. Quran.com's Indo-Pak words already carry the marks attached. */
const SMALL_HIGH_MARK = /[\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/;
/** Invisible direction/format controls that trail Quran.com words — they
 *  can be separated by a space (e.g. "…\u200F \uFEFF\uFEFF"), so spaces
 *  are stripped with them. */
const TRAILING_CONTROLS = /[\s\u200B\u200F\uFEFF]+$/;

/** Uthmani word text for the mushaf: PUA stripped, pause marks attached
 *  to the preceding letter, trailing controls stripped. */
export function cleanMushafUthmani(text: string): string {
  return text
    .replace(/[\uE000-\uF8FF]/g, '')
    .replace(/\s+(?=[\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED])/g, '')
    .replace(TRAILING_CONTROLS, '')
    .trim();
}

/** Indo-Pak word text for the mushaf: PUA markers (spec §15.7) and
 *  trailing direction controls stripped. */
export function cleanMushafIndopak(text: string): string {
  return text
    .replace(/[\uE000-\uF8FF]/g, '')
    .replace(TRAILING_CONTROLS, '')
    .trim();
}

/** True when a cleaned word is only small-high pause marks (no letters). */
export function isPauseMarkOnly(text: string): boolean {
  return text.length > 0 && [...text].every((ch) => SMALL_HIGH_MARK.test(ch));
}

/** Tafsir for one ayah — server-side, for the ayah page. tafsirId defaults
 *  to Ibn Kathir (Abridged, 169); any id from TAFSIRS in app/quran/lib.ts
 *  works (all 20 were verified live to return text for 2:255). */
export async function fetchTafsir(key: string, tafsirId: number = TAFSIR_ID): Promise<string> {
  const data = await fetchJson(`${UPSTREAM_API}/tafsirs/${tafsirId}/by_ayah/${key}`);
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

export function surahJsonLd(surah: HifzSurah, description: string) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `Surah ${surah.name} (${surah.meaning}) — Read, Listen & Memorise`,
      description,
      inLanguage: ['ar', 'en'],
      author: { '@type': 'Organization', name: 'I Love Islam', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'I Love Islam', url: SITE_URL },
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
  surah: HifzSurah;
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
      author: { '@type': 'Organization', name: 'I Love Islam', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'I Love Islam', url: SITE_URL },
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

/** Prev/next surah within the whole Quran, in mushaf order. */
export function prevNextSurah(all: HifzSurah[], currentId: number) {
  const sorted = [...all].sort((a, b) => a.id - b.id);
  const idx = sorted.findIndex((s) => s.id === currentId);
  return {
    prev: idx > 0 ? sorted[idx - 1] : null,
    next: idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null,
  };
}
