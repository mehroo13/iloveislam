// app/api/quran/khattab/[n]/route.ts — Dr. Mustafa Khattab, The Clear
// Quran, one surah at a time (Phase 1, Mushaf Layout "Translation /
// Transliteration" mode).
//
// Why this route exists: neither Quran.com v4 (126 translation
// resources, verified 2026-11-24 — no id 131, no Khattab) nor AlQuran
// Cloud (22 English editions — only Talal Itani's "Clear Qur'an")
// serves Khattab's translation. The open quran-api dataset
// (fawazahmed0/quran-api, public GitHub data served via jsDelivr) does:
// edition `eng-mustafakhattaba` ("Mustafa Khattab Allah Edition").
// This route proxies one surah's file server-side (same-origin for the
// browser, cached a day — the text is static) and returns only
// { surah, translations: { ayahNumber: text } }.
// Attribution: "Translation: Dr. Mustafa Khattab, The Clear Quran."

import { NextResponse } from 'next/server';
import { cleanTranslationText } from '../../../../quran/lib';

const UPSTREAM =
  'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/eng-mustafakhattaba';
const TIMEOUT_MS = 12000;

export const revalidate = 86400;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ n: string }> },
) {
  const { n } = await ctx.params;
  const surah = Number(n);
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    return NextResponse.json({ error: 'surah must be 1-114' }, { status: 400 });
  }
  try {
    const res = await fetch(`${UPSTREAM}/${surah}.json`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Khattab source returned ${res.status}` },
        { status: 502 },
      );
    }
    const data = (await res.json()) as {
      chapter?: { verse?: number; text?: string }[];
    };
    const translations: Record<number, string> = {};
    for (const v of Array.isArray(data?.chapter) ? data.chapter : []) {
      if (typeof v?.verse === 'number' && typeof v?.text === 'string') {
        // The upstream text is clean today (verified all 114 surahs,
        // 2026-11-26), but the route is the single choke point for
        // Khattab text — strip any footnote-marker HTML here too, so
        // a future upstream change can never leak markers into the
        // reader (the render layer strips as well).
        translations[v.verse] = cleanTranslationText(v.text);
      }
    }
    return NextResponse.json(
      { surah, translations },
      {
        headers: {
          'Cache-Control':
            'public, s-maxage=86400, stale-while-revalidate=86400',
        },
      },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'khattab fetch failed' },
      { status: 502 },
    );
  }
}
