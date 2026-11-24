// app/api/quran/reader-page/[n]/route.ts — one reader page (verses +
// tajweed + top-bar meta) for the reader screen's swipes. Same data
// the root page renders server-side for page 1.
import { NextResponse } from 'next/server';
import { fetchReaderPage } from '@/app/hifz/lib/reader-page';

export const revalidate = 3600;

export async function GET(_req: Request, ctx: { params: Promise<{ n: string }> }) {
  const { n } = await ctx.params;
  const page = Number(n);
  if (!Number.isInteger(page) || page < 1 || page > 604) {
    return NextResponse.json({ error: 'page must be 1-604' }, { status: 400 });
  }
  try {
    const data = await fetchReaderPage(page);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'reader page failed' },
      { status: 502 },
    );
  }
}
