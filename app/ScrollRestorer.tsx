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
 * Place <ScrollRestorer /> inside your RootLayout, inside <body>, before {children}.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const STORAGE_PREFIX = 'scroll_';

function getKey(path: string) {
  return STORAGE_PREFIX + path;
}

export default function ScrollRestorer() {
  const pathname = usePathname();

  // Step 1: On every mount for any pathname, restore immediately
  useEffect(() => {
    // Tell browser & Next.js: don't touch scroll, we handle it
    if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
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