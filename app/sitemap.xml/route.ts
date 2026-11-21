import { ALL_SURAHS } from '../hifz/surahs';
import { JUZ_PAGES } from '../hifz/juz';
import { MUSHAF_TOTAL_PAGES } from '../hifz/mushaf';

// app/sitemap.xml/route.ts — I Love Islam-only sitemap (single-purpose refocus,
// 2026-11-21). The old tool pages and blog redirect to /hifz and are NOT
// listed. The legal pages, About and Contact ARE listed (2026-11-21 SEO /
// AdSense fix — AdSense reviewers look for About, Contact, Privacy and
// Terms). Interactive tool pages (/hifz/recite, /hifz/test, /hifz/voice-search)
// are noindex by their own metadata, so they are not listed either.
// /hifz/my-progress stays listed (low priority) as it was.
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
    { loc: '/hifz/juz/30', lastmod: REFOCUS_DATE, changefreq: 'monthly', priority: '0.8' },    { loc: '/hifz/plans', lastmod: REFOCUS_DATE, changefreq: 'monthly', priority: '0.7' },
    { loc: '/hifz/ayat-al-kursi', lastmod: REFOCUS_DATE, changefreq: 'monthly', priority: '0.8' },
    // my-progress is a tool page, not content — low priority (spec §9.1).
    { loc: '/hifz/my-progress', lastmod: REFOCUS_DATE, changefreq: 'monthly', priority: '0.3' },
    // Group challenges (spec §15.9) — same low priority as my-progress.
    { loc: '/hifz/challenges', lastmod: '2026-11-21', changefreq: 'monthly', priority: '0.3' },
    // Trust pages — About, Contact, Privacy, Terms (AdSense reviewers look
    // for these; all four are live pages).
    { loc: '/about', lastmod: '2026-11-21', changefreq: 'monthly', priority: '0.5' },
    { loc: '/contact', lastmod: '2026-11-21', changefreq: 'monthly', priority: '0.5' },
    { loc: '/privacy', lastmod: '2026-11-21', changefreq: 'monthly', priority: '0.3' },
    { loc: '/terms', lastmod: '2026-11-21', changefreq: 'monthly', priority: '0.3' },
  ];

  // Hifz hub URLs, generated from the full-Quran slug table so the sitemap
  // can never drift from app/hifz/surahs.ts. Ayah ref is SURAH-AYAH, e.g. 67-1.
  // Full Quran (Phase 2): 114 surah pages + 6,236 ayah pages + 30 juz pages.
  const hifzEntries: SitemapEntry[] = [];
  for (const surah of ALL_SURAHS) {
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
  // Juz overview pages 1–29 (juz 30 is listed above as /hifz/juz/30).
  for (const juz of JUZ_PAGES) {
    if (juz.n === 30) continue;
    hifzEntries.push({
      loc: `/hifz/juz/${juz.n}`,
      lastmod: REFOCUS_DATE,
      changefreq: 'monthly',
      priority: '0.7',
    });
  }
  // Mushaf pages 1–604 (spec §21) — one URL per printed-mushaf page.
  for (let p = 1; p <= MUSHAF_TOTAL_PAGES; p++) {
    hifzEntries.push({
      loc: `/hifz/mushaf/${p}`,
      lastmod: REFOCUS_DATE,
      changefreq: 'monthly',
      priority: '0.5',
    });
  }

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
