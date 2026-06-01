import { allArticles } from '../blog/content';

export async function GET() {
  const base = 'https://www.iloveislam.life';
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  interface SitemapEntry {
    loc: string;
    lastmod: string;
    changefreq: string;
    priority: string;
  }

  const entries: SitemapEntry[] = [
    // Homepage
    { loc: '/', lastmod: now, changefreq: 'daily', priority: '1.0' },

    // Core tool pages — high priority
    { loc: '/zakat', lastmod: now, changefreq: 'monthly', priority: '0.9' },
    { loc: '/prayer-times', lastmod: now, changefreq: 'daily', priority: '0.9' },
    { loc: '/qibla', lastmod: now, changefreq: 'monthly', priority: '0.9' },
    { loc: '/quran', lastmod: now, changefreq: 'monthly', priority: '0.9' },
    { loc: '/hijri', lastmod: now, changefreq: 'daily', priority: '0.9' },
    { loc: '/dhikr', lastmod: now, changefreq: 'monthly', priority: '0.9' },
    { loc: '/halal-scanner', lastmod: now, changefreq: 'weekly', priority: '0.9' },
    { loc: '/dua', lastmod: now, changefreq: 'monthly', priority: '0.9' },
    { loc: '/names', lastmod: now, changefreq: 'monthly', priority: '0.9' },
    { loc: '/kids', lastmod: now, changefreq: 'monthly', priority: '0.9' },
    { loc: '/ramadan', lastmod: now, changefreq: 'monthly', priority: '0.9' },
    { loc: '/night', lastmod: now, changefreq: 'monthly', priority: '0.9' },

    // Secondary tool pages
    { loc: '/hadith', lastmod: now, changefreq: 'monthly', priority: '0.8' },
    { loc: '/sadaqah', lastmod: now, changefreq: 'monthly', priority: '0.8' },
    { loc: '/inheritance', lastmod: now, changefreq: 'monthly', priority: '0.8' },
    { loc: '/mizan', lastmod: now, changefreq: 'monthly', priority: '0.8' },
    { loc: '/mosque', lastmod: now, changefreq: 'monthly', priority: '0.8' },
    { loc: '/halal-finance', lastmod: now, changefreq: 'monthly', priority: '0.8' },
    { loc: '/kaffarah', lastmod: now, changefreq: 'monthly', priority: '0.8' },
    { loc: '/hajj', lastmod: now, changefreq: 'monthly', priority: '0.8' },
    { loc: '/travel', lastmod: now, changefreq: 'monthly', priority: '0.8' },
    { loc: '/names-finder', lastmod: now, changefreq: 'monthly', priority: '0.8' },
    { loc: '/will', lastmod: now, changefreq: 'monthly', priority: '0.8' },
    { loc: '/eid', lastmod: now, changefreq: 'monthly', priority: '0.8' },
    { loc: '/eid-adha', lastmod: now, changefreq: 'monthly', priority: '0.8' },

    // Kids game pages
    { loc: '/kids/games/prayer-guide', lastmod: now, changefreq: 'monthly', priority: '0.7' },
    { loc: '/kids/games/memory-match', lastmod: now, changefreq: 'monthly', priority: '0.7' },
    { loc: '/kids/games/pillars-quiz', lastmod: now, changefreq: 'monthly', priority: '0.7' },
    { loc: '/kids/games/arabic-letters', lastmod: now, changefreq: 'monthly', priority: '0.7' },
    { loc: '/kids/games/dua-memory', lastmod: now, changefreq: 'monthly', priority: '0.7' },
    { loc: '/kids/games/islamic-trivia', lastmod: now, changefreq: 'monthly', priority: '0.7' },
    { loc: '/kids/games/prophets-quiz', lastmod: now, changefreq: 'monthly', priority: '0.7' },
    { loc: '/kids/games/quran-letters', lastmod: now, changefreq: 'monthly', priority: '0.7' },
    { loc: '/kids/games/word-builder', lastmod: now, changefreq: 'monthly', priority: '0.7' },
    { loc: '/kids/games/islamic-months', lastmod: now, changefreq: 'monthly', priority: '0.7' },
    { loc: '/kids/games/asma-ul-husna', lastmod: now, changefreq: 'monthly', priority: '0.7' },
    { loc: '/kids/games/dua-matching', lastmod: now, changefreq: 'monthly', priority: '0.7' },
    { loc: '/kids/games/hajj-adventure', lastmod: now, changefreq: 'monthly', priority: '0.7' },
    { loc: '/kids/games/islamic-coloring', lastmod: now, changefreq: 'monthly', priority: '0.7' },
    { loc: '/kids/games/dhikr-challenge', lastmod: now, changefreq: 'monthly', priority: '0.7' },
    { loc: '/kids/games/sahaba-heroes', lastmod: now, changefreq: 'monthly', priority: '0.7' },
    { loc: '/kids/games/seerah-adventure', lastmod: now, changefreq: 'monthly', priority: '0.7' },

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

  // Blog article URLs
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
