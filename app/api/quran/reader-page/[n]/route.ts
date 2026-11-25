// app/api/quran/reader-page/[n]/route.ts — one reader page (verses +
// tajweed + top-bar meta) for the reader screen's swipes. Same data
// the root page renders server-side for page 1. `?edition=` selects
// the print (madani-1405 | madani-1421 | madani-1441 | indopak);
// an unknown edition falls back to 1405. Indo-Pak pages run 1–610,
// the Madani editions 1–604.
import { NextResponse } from 'next/server';
import { fetchReaderPage } from '@/app/hifz/lib/reader-page';
import { mushafEditionById, type MushafEditionId } from '@/app/hifz/lib/mushaf-edition';

export const revalidate = 3600;

export async function GET(req: Request, ctx: { params: Promise<{ n: string }> }) {
  const { n } = await ctx.params;
  const edition = mushafEditionById(
    new URL(req.url).searchParams.get('edition') as MushafEditionId | null,
  );
  const page = Number(n);
  if (!Number.isInteger(page) || page < 1 || page > edition.totalPages) {
    return NextResponse.json(
      { error: `page must be 1-${edition.totalPages} for ${edition.id}` },
      { status: 400 },
    );
  }
  try {
    const data = await fetchReaderPage(page, edition.id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'reader page failed' },
      { status: 502 },
    );
  }
}
