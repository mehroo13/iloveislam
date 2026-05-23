import { allArticles } from '../blog/content';

export async function GET() {
  const base = 'https://www.iloveislam.life';

  const staticPaths = [
    '/',
    '/zakat',
    '/prayer-times',
    '/qibla',
    '/quran',
    '/hijri',
    '/dhikr',
    '/inheritance',
    '/mizan',
    '/mosque',
    '/hadith',
    '/ramadan',
    '/dua',
    '/names',
    '/sadaqah',
    '/halal-finance',
    '/kaffarah',
    '/hajj',
    '/travel',
    '/names-finder',
    '/will',
  ];

  const blogUrls = allArticles.map(a => `/blog/${a.slug}`);

  const urls = [...staticPaths, ...blogUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((path) => `  <url><loc>${base}${path}</loc></url>`)
    .join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
