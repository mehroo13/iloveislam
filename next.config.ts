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
    ];
  },
};

export default withBundleAnalyzer(nextConfig as any);
