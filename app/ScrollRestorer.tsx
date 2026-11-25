'use client';

/**
 * ScrollRestorer — fixes Next.js App Router scroll-to-top on back navigation.
 *
 * How it works:
 * 1. On every scroll, saves Y position to sessionStorage keyed by pathname.
 * 2. On mount (which happens on every navigation in App Router), immediately
 *    restores the saved position for the current path.
 * 3. history.scrollRestoration = 'manual' stops browser + Next.js fighting us.
 *
 * Exception: the continuous mushaf reader (/hifz/mushaf) owns its own
 * scroll restoration (localStorage ili_mushaf_reader_pos_v1). When it has
 * a saved spot, this component does not touch scroll at all on that
 * route — neither the fresh-session scrollTo(0) nor the sessionStorage
 * restore — or it yanks the reader's restore and page 1 gets saved over
 * the real position.
 *
 * Place <ScrollRestorer /> inside your RootLayout, inside <body>, before {children}.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const STORAGE_PREFIX = 'scroll_';
// The continuous mushaf reader's saved position (see MushafReader).
// When it exists, the reader owns scroll restoration on its route.
const MUSHAF_POS_KEY = 'ili_mushaf_reader_pos_v1';

function getKey(path: string) {
  return STORAGE_PREFIX + path;
}

/** True when the mushaf reader has a saved "pick up where you left off" spot. */
function hasSavedMushafPos(): boolean {
  try {
    const raw = window.localStorage.getItem(MUSHAF_POS_KEY);
    if (!raw) return false;
    const p = JSON.parse(raw) as { page?: unknown };
    return typeof p.page === 'number' && p.page >= 1;
  } catch {
    return false;
  }
}

export default function ScrollRestorer() {
  const pathname = usePathname();

  // Step 1: On every mount for any pathname, restore immediately
  useEffect(() => {
    // Tell browser & Next.js: don't touch scroll, we handle it
    if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Hands off the continuous mushaf reader: it restores its own
    // scroll from ili_mushaf_reader_pos_v1 after mount. If this
    // component also scrolled — to the top on a fresh session (no
    // sessionStorage Y), or to a stale sessionStorage Y via double-rAF
    // after the reader's restore — it would yank the restore and the
    // reader would then save page 1 over the real position.
    if (pathname === '/hifz/mushaf' && hasSavedMushafPos()) return;

    // Anchor links (e.g. /about#support from the Donate button) win
    // over both the saved position and the fresh-page top: without
    // this, the scrollTo(0) below yanked the page to the top and the
    // anchor target was never shown. scrollRestoration is 'manual',
    // so the browser does not do this for us.
    const hash = window.location.hash;
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.scrollIntoView({ behavior: 'instant', block: 'start' });
          });
        });
        return;
      }
    }

    const key = getKey(pathname);
    const saved = sessionStorage.getItem(key);
    const y = saved ? parseInt(saved, 10) : 0;

    if (y > 0) {
      // requestAnimationFrame ensures DOM is painted before we scroll
      // Double-rAF is needed because Next.js does its scroll reset in the first frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: y, behavior: 'instant' });
        });
      });
    } else {
      // Fresh page — go to top
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname]);

  // Step 2: Save scroll position continuously
  useEffect(() => {
    const key = getKey(pathname);

    const save = () => {
      if (window.scrollY > 0) {
        sessionStorage.setItem(key, String(Math.round(window.scrollY)));
      }
    };

    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, [pathname]);

  return null;
}