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
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
  // Trailing slash consistency — no trailing slashes
  trailingSlash: false,
};

export default withBundleAnalyzer(nextConfig as any);
