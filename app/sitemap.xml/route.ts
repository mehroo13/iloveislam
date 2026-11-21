import { LAUNCH_SURAHS, AYAT_AL_KURSI } from '../hifz/surahs';

// app/sitemap.xml/route.ts — I Love Islam-only sitemap (single-purpose refocus,
// 2026-11-21). The old tool pages, blog, about/contact/faq/install and the
// legal pages are NOT listed: the tools redirect to /hifz, and the legal
// pages are kept live but unlinked from the nav. Interactive tool pages
// (/hifz/recite, /hifz/test, /hifz/voice-search) are noindex by their own
// metadata, so they are not listed either. /hifz/my-progress stays listed
// (low priority) as it was.
export async function GET() {
  const base = 'https://www.iloveislam.life';
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  // Refocus date: the site became a single-purpose Hifz app on this date.
  const REFOCUS_DATE = '2026-11-21';

  interface SitemapEntry {
    loc: string;
    lastmod: string;
    changefreq: string;
    priority: string;
  }

  const entries: SitemapEntry[] = [
    // Homepage — the Hifz app itself
    { loc: '/', lastmod: now, changefreq: 'daily', priority: '1.0' },

    // Hifz hub
    { loc: '/hifz', lastmod: REFOCUS_DATE, changefreq: 'weekly', priority: '0.9' },
    { loc: '/hifz/juz-amma', lastmod: REFOCUS_DATE, changefreq: 'monthly', priority: '0.8' },
    { loc: '/hifz/juz/30', lastmod: REFOCUS_DATE, changefreq: 'monthly', priority: '0.8' },
    { loc: '/hifz/plans', lastmod: REFOCUS_DATE, changefreq: 'monthly', priority: '0.7' },
    { loc: '/hifz/ayat-al-kursi', lastmod: REFOCUS_DATE, changefreq: 'monthly', priority: '0.8' },
    // my-progress is a tool page, not content — low priority (spec §9.1).
    { loc: '/hifz/my-progress', lastmod: REFOCUS_DATE, changefreq: 'monthly', priority: '0.3' },
    // Group challenges (spec §15.9) — same low priority as my-progress.
    { loc: '/hifz/challenges', lastmod: '2026-11-21', changefreq: 'monthly', priority: '0.3' },
  ];

  // Hifz hub URLs, generated from the launch-set slug table so the sitemap
  // can never drift from app/hifz/surahs.ts. Ayah ref is SURAH-AYAH, e.g. 67-1.
  // Note: the launch set has 969 ayah pages (404 named surahs + 564 Juz Amma
  // + 1 Ayat al-Kursi), not the "~490" the spec estimated — Juz Amma alone
  // holds 564 ayahs.
  const hifzEntries: SitemapEntry[] = [];
  for (const surah of LAUNCH_SURAHS) {
    hifzEntries.push({
      loc: `/hifz/${surah.slug}`,
      lastmod: REFOCUS_DATE,
      changefreq: 'monthly',
      priority: '0.8',
    });
    for (let ayah = 1; ayah <= surah.ayahCount; ayah++) {
      hifzEntries.push({
        loc: `/hifz/${surah.slug}/${surah.id}-${ayah}`,
        lastmod: REFOCUS_DATE,
        changefreq: 'monthly',
        priority: '0.6',
      });
    }
  }
  // Ayat al-Kursi (2:255) — canonical ayah page under its surah.
  hifzEntries.push({
    loc: `/hifz/${AYAT_AL_KURSI.surahSlug}/${AYAT_AL_KURSI.ref}`,
    lastmod: REFOCUS_DATE,
    changefreq: 'monthly',
    priority: '0.7',
  });

  const allEntries = [...entries, ...hifzEntries];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries
  .map(
    (entry) => `  <url>
    <loc>${base}${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
