import { allArticles } from '../blog/content';
import { LAUNCH_SURAHS, AYAT_AL_KURSI } from '../hifz/surahs';

export async function GET() {
  const base = 'https://www.iloveislam.life';
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  // Rebuild date: every tool page was rebuilt from scratch on this date.
  const REBUILD_DATE = '2026-11-21';

  interface SitemapEntry {
    loc: string;
    lastmod: string;
    changefreq: string;
    priority: string;
  }

  const entries: SitemapEntry[] = [
    // Homepage
    { loc: '/', lastmod: now, changefreq: 'daily', priority: '1.0' },

    // Core tool pages — high priority (rebuilt 2026-11-21)
    { loc: '/zakat', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.9' },
    { loc: '/prayer-times', lastmod: REBUILD_DATE, changefreq: 'daily', priority: '0.9' },
    { loc: '/qibla', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.9' },
    { loc: '/quran', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.9' },
    { loc: '/hijri', lastmod: REBUILD_DATE, changefreq: 'daily', priority: '0.9' },
    { loc: '/dhikr', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.9' },
    { loc: '/dua', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.9' },
    { loc: '/dua-for-this-moment', lastmod: REBUILD_DATE, changefreq: 'weekly', priority: '0.9' },
    { loc: '/names', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.9' },
    { loc: '/ramadan', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.9' },
    { loc: '/night', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.9' },

    // Secondary tool pages (rebuilt 2026-11-21)
    { loc: '/hadith', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.8' },
    { loc: '/sadaqah', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.8' },
    { loc: '/inheritance', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.8' },
    { loc: '/mizan', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.8' },
    { loc: '/halal-finance', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.8' },
    { loc: '/kaffarah', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.8' },
    { loc: '/hajj', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.8' },
    { loc: '/travel', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.8' },
    { loc: '/names-finder', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.8' },
    { loc: '/eid', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.8' },
    { loc: '/eid-adha', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.8' },

    // Blog index
    { loc: '/blog', lastmod: now, changefreq: 'weekly', priority: '0.7' },

    // Hifz hub (added 2026-11-21; URLs generated from app/hifz/surahs.ts)
    { loc: '/hifz', lastmod: REBUILD_DATE, changefreq: 'weekly', priority: '0.9' },
    { loc: '/hifz/juz-amma', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.8' },
    { loc: '/hifz/juz/30', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.8' },
    { loc: '/hifz/plans', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.7' },
    { loc: '/hifz/ayat-al-kursi', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.8' },
    // my-progress is a tool page, not content — low priority (spec §9.1).
    { loc: '/hifz/my-progress', lastmod: REBUILD_DATE, changefreq: 'monthly', priority: '0.3' },

    // Static pages
    { loc: '/about', lastmod: now, changefreq: 'monthly', priority: '0.5' },
    { loc: '/contact', lastmod: now, changefreq: 'yearly', priority: '0.4' },
    { loc: '/faq', lastmod: now, changefreq: 'monthly', priority: '0.5' },
    { loc: '/install', lastmod: now, changefreq: 'monthly', priority: '0.5' },
    { loc: '/privacy', lastmod: now, changefreq: 'yearly', priority: '0.3' },
    { loc: '/terms', lastmod: now, changefreq: 'yearly', priority: '0.3' },
  ];

  // Blog article URLs — lastmod is each article's own publish date
  // (article.date), not the rebuild/request date.
  const blogEntries: SitemapEntry[] = allArticles.map((a) => ({
    loc: `/blog/${a.slug}`,
    lastmod: a.date || now,
    changefreq: 'monthly',
    priority: '0.7',
  }));

  // Hifz hub URLs, generated from the launch-set slug table so the sitemap
  // can never drift from app/hifz/surahs.ts. Ayah ref is SURAH-AYAH, e.g. 67-1.
  // Note: the launch set has 969 ayah pages (404 named surahs + 564 Juz Amma
  // + 1 Ayat al-Kursi), not the "~490" the spec estimated — Juz Amma alone
  // holds 564 ayahs.
  const hifzEntries: SitemapEntry[] = [];
  for (const surah of LAUNCH_SURAHS) {
    hifzEntries.push({
      loc: `/hifz/${surah.slug}`,
      lastmod: REBUILD_DATE,
      changefreq: 'monthly',
      priority: '0.8',
    });
    for (let ayah = 1; ayah <= surah.ayahCount; ayah++) {
      hifzEntries.push({
        loc: `/hifz/${surah.slug}/${surah.id}-${ayah}`,
        lastmod: REBUILD_DATE,
        changefreq: 'monthly',
        priority: '0.6',
      });
    }
  }
  // Ayat al-Kursi (2:255) — canonical ayah page under its surah.
  hifzEntries.push({
    loc: `/hifz/${AYAT_AL_KURSI.surahSlug}/${AYAT_AL_KURSI.ref}`,
    lastmod: REBUILD_DATE,
    changefreq: 'monthly',
    priority: '0.7',
  });

  const allEntries = [...entries, ...blogEntries, ...hifzEntries];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries
  .map(
    (entry) => `  <url>
    <loc>${base}${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
