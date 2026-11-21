import type { NextConfig } from "next";

// Enable optional bundle analysis by setting ANALYZE=true in the environment.
// Make the require optional so builds don't break if the devDependency isn't installed.
let withBundleAnalyzer = (c: any) => c;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const createAnalyzer = require('@next/bundle-analyzer');
  withBundleAnalyzer = createAnalyzer({ enabled: process.env.ANALYZE === 'true' });
} catch (e) {
  // package not installed; continue without analyzer
}

const nextConfig: NextConfig = {
  // Single-purpose Hifz app (2026-11-21 refocus): every old tool route is
  // permanently redirected to the Hifz hub. The old route folders stay in
  // the repo (app/quran/lib.ts is shared by the Hifz pages) but no old tool
  // URL can ever be served again — redirects run before routing.
  async redirects() {
    const retired = [
      'about',
      'blog',
      'compare-religions',
      'contact',
      'dhikr',
      'dua',
      'dua-for-this-moment',
      'eid',
      'eid-adha',
      'faq',
      'hadith',
      'hajj',
      'halal-finance',
      'hijri',
      'inheritance',
      'install',
      'kaffarah',
      'mizan',
      'names',
      'names-finder',
      'night',
      'prayer-times',
      'qibla',
      'quran',
      'ramadan',
      'sadaqah',
      'travel',
      'zakat',
    ];
    const rules: { source: string; destination: string; permanent: boolean }[] = [];
    for (const route of retired) {
      rules.push({ source: `/${route}`, destination: '/hifz', permanent: true });
      rules.push({ source: `/${route}/:path*`, destination: '/hifz', permanent: true });
    }
    return rules;
  },
  async headers() {
    return [
      {
        source: '/optimized/:all*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/:all*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Security and SEO headers for all pages
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self)' },
        ],
      },
    ];
  },
  // Trailing slash consistency — no trailing slashes
  trailingSlash: false,
};

export default withBundleAnalyzer(nextConfig as any);
