// app/hifz/lib/similar-phrases.ts — "Color similar phrases" (Settings →
// Marking) for the reader.
//
// The dataset is public/mutashabihat.json (1.3 MB, built by
// tools/build-mutashabihat.mjs from the canonical Quran text: pairs of
// ayahs sharing a verbatim phrase — a shared 4-word phrase, or 2+
// shared 3-word phrases). It is fetched lazily, once, only when the
// setting is on. This module answers one question: which normalised
// words of a given ayah also occur in a similar verse's shared
// phrases — the reader then colours exactly those words (the same
// amber wash SimilarVerses.tsx uses for its own display). A missing
// or unreadable dataset yields an empty set: no colouring, never a
// crash, never invented phrases.

import { normalizeArabic } from './alignment';

interface Partner {
  score: number;
  phrases: string[][];
}

interface MutashabihatData {
  byAyah: Record<string, Partner[]>;
}

let dataPromise: Promise<MutashabihatData | null> | null = null;

function loadData(): Promise<MutashabihatData | null> {
  if (!dataPromise) {
    dataPromise = fetch('/mutashabihat.json')
      .then((r) => (r.ok ? (r.json() as Promise<MutashabihatData>) : null))
      .catch(() => null);
  }
  return dataPromise;
}

/** Normalised words of `surah:ayah` that a similar verse shares. */
export async function loadSimilarWordSet(surah: number, ayah: number): Promise<ReadonlySet<string>> {
  const out = new Set<string>();
  try {
    const data = await loadData();
    const partners = data?.byAyah[`${surah}:${ayah}`] ?? [];
    for (const p of partners) {
      for (const phrase of p.phrases ?? []) {
        for (const w of phrase) {
          const n = normalizeArabic(w);
          if (n) out.add(n);
        }
      }
    }
  } catch {
    /* dataset unreadable — no colouring */
  }
  return out;
}
