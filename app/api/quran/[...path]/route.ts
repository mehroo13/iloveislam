// app/api/quran/[...path]/route.ts — same-origin proxy for Quran.com API v4.
//
// Why this exists: the reader used to fetch verses straight from the user's
// browser to api.quran.com, and that direct connection fails/times out for
// some users (the Juz view failed outright with "Could not load the Quran
// text"). The Quran.com API itself is healthy from a server. So the browser
// now talks only to iloveislam.life, and this route fetches from Quran.com
// server-side with a timeout, one retry, and caching.
//
// Only whitelisted Quran.com v4 paths are proxied — this is not an open proxy.
import { NextResponse } from 'next/server';

const UPSTREAM = 'https://api.quran.com/api/v4';

/* Paths the reader actually uses. Anything else gets a 404. */
const ALLOWED_PATH = /^(?:verses\/(?:by_chapter\/\d+|by_juz\/\d+|by_page\/\d+|by_key\/\d+:\d+)|chapters|search|tafsirs\/\d+\/by_ayah\/\d+:\d+)$/;

const TIMEOUT_MS = 12000;
const STATIC_REVALIDATE = 86400; // Quran text, chapters, tafsir never change
const SEARCH_REVALIDATE = 3600;

async function fetchUpstream(url: string, revalidate: number): Promise<Response> {
  return fetch(url, {
    next: { revalidate },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: 'application/json' },
  });
}

/* by_juz needs server-side pagination: Quran.com rejects per_page=all on
   this endpoint with a 404 ("Surah number or slug is invalid"), and the
   default page holds only 10 verses. So fetch every page (per_page=50,
   a few pages per juz) and merge them into one response for the client. */
async function fetchJuzMerged(baseUrl: string, revalidate: number): Promise<unknown> {
  const first = await fetchUpstream(`${baseUrl}&page=1`, revalidate);
  if (!first.ok) throw new Error(`Quran.com returned ${first.status}`);
  const firstData = await first.json();
  const verses: unknown[] = Array.isArray(firstData?.verses) ? firstData.verses : [];
  const totalPages: number = Number(firstData?.pagination?.total_pages ?? 1);
  const totalRecords: number = Number(firstData?.pagination?.total_records ?? verses.length);

  const remaining: number[] = [];
  for (let p = 2; p <= totalPages; p++) remaining.push(p);
  for (let i = 0; i < remaining.length; i += 6) {
    const batch = remaining.slice(i, i + 6);
    const pages = await Promise.all(
      batch.map(async (p) => {
        const res = await fetchUpstream(`${baseUrl}&page=${p}`, revalidate);
        if (!res.ok) throw new Error(`Quran.com returned ${res.status} for page ${p}`);
        return res.json();
      }),
    );
    for (const page of pages) {
      if (Array.isArray(page?.verses)) verses.push(...page.verses);
    }
  }
  return {
    verses,
    pagination: { current_page: 1, per_page: 50, total_pages: totalPages, total_records: totalRecords },
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const joined = path.join('/');
  if (!ALLOWED_PATH.test(joined)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const incoming = new URL(req.url);
  const upstreamUrl = `${UPSTREAM}/${joined}${incoming.search}`;
  const revalidate = joined === 'search' ? SEARCH_REVALIDATE : STATIC_REVALIDATE;
  const isJuz = joined.startsWith('verses/by_juz/');

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // Juz: paginate server-side and merge (per_page=all 404s upstream).
      if (isJuz) {
        const q = new URLSearchParams(incoming.searchParams);
        q.delete('per_page');
        q.set('per_page', '50');
        const data = await fetchJuzMerged(`${UPSTREAM}/${joined}?${q.toString()}`, revalidate);
        return NextResponse.json(data, {
          headers: {
            'Cache-Control': `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate}`,
          },
        });
      }
      const res = await fetchUpstream(upstreamUrl, revalidate);
      if (!res.ok) {
        // Retry once on server errors; pass client errors straight through as a 502.
        if (res.status >= 500 && attempt === 0) continue;
        return NextResponse.json(
          { error: `Quran.com returned ${res.status}` },
          { status: 502 },
        );
      }
      const data = await res.json();
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate}`,
        },
      });
    } catch (err) {
      // Timeout or network error — retry once, then give up with a 502 so the
      // reader shows its "Try again" state instead of hanging.
      if (attempt === 0) continue;
      console.error('Quran proxy failed:', upstreamUrl, err);
      return NextResponse.json(
        { error: 'Could not reach Quran.com' },
        { status: 502 },
      );
    }
  }
  return NextResponse.json({ error: 'Could not reach Quran.com' }, { status: 502 });
}
