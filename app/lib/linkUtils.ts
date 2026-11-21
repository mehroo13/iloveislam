// Removed tools (routes deleted Nov 2026) — any internal link to them in kept
// blog articles is retargeted to the homepage or the closest kept tool so
// readers never land on a dead route.
const REMOVED_ROUTE_REDIRECTS: { pattern: RegExp; target: string }[] = [
  { pattern: /^\/halal-scanner(\/.*)?$/, target: '/' },
  { pattern: /^\/will(\/.*)?$/, target: '/inheritance' },
  { pattern: /^\/mosque(\/.*)?$/, target: '/travel' },
  { pattern: /^\/kids(\/.*)?$/, target: '/' },
];

// Server-side helper to adjust anchor tags: add rel/target for external links
export function processAnchors(html: string, siteOrigin = 'https://www.iloveislam.life'): string {
  if (!html) return html;
  // Add target and rel to external anchors
  return html.replace(/<a\s+([^>]*?)href=("|')([^"'>]+)("|')([^>]*)>/gi, (match, before, q1, href, q2, after) => {
    try {
      let url = href.trim();
      // Retarget links pointing at removed tools
      const path = url.startsWith(siteOrigin) ? url.slice(siteOrigin.length) : url;
      for (const { pattern, target } of REMOVED_ROUTE_REDIRECTS) {
        if (pattern.test(path)) {
          url = target;
          break;
        }
      }
      const isExternal = /^https?:\/\//i.test(url) && !url.startsWith(siteOrigin);
      let attrs = `${before}href=${q1}${url}${q2}${after}`.trim();
      if (isExternal) {
        if (!/target=/.test(attrs)) attrs += ' target="_blank"';
        if (!/rel=/.test(attrs)) attrs += ' rel="noopener noreferrer"';
        if (!/aria-label=/.test(attrs)) attrs += ` aria-label="Opens in a new tab: ${href}"`;
      }
      return `<a ${attrs}>`;
    } catch (e) {
      return match;
    }
  });
}
