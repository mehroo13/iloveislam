import { allArticles } from '../blog/content';

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

  const allEntries = [...entries, ...blogEntries];

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
