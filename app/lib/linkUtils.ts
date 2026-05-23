// Server-side helper to adjust anchor tags: add rel/target for external links
export function processAnchors(html: string, siteOrigin = 'https://www.iloveislam.life'): string {
  if (!html) return html;
  // Add target and rel to external anchors
  return html.replace(/<a\s+([^>]*?)href=("|')([^"'>]+)("|')([^>]*)>/gi, (match, before, q1, href, q2, after) => {
    try {
      const url = href.trim();
      const isExternal = /^https?:\/\//i.test(url) && !url.startsWith(siteOrigin);
      let attrs = `${before}href=${q1}${href}${q2}${after}`.trim();
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
