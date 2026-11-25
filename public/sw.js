// I Love Islam — Advanced Service Worker v3.0.2
// Offline-first PWA for the single-purpose Hifz app (rebrand 2026-11-21).
//
// Offline coach (§15.10): the coach model (Tilawa, hosted on tilawa.dev,
// downloaded through the Cache API) and the ONNX runtime WASM are cached
// by MODEL_CACHE below, and the Quran proxy responses are cached for 7
// days (Quran text never changes). After one online recitation — which
// downloads the model — plus "Save surahs for offline use" on My Progress,
// the coach works in airplane mode: pages, surah text and model all come
// from cache. Voice Search still needs the network (browser speech
// recognition); the page says so.
//
// v3.0.2 (2026-11-25 refinement pass): cache names bumped v3 → v4 so the
// new worker installs, deletes EVERY old cache on activate (including
// any stale precached `/` document and old JS chunks), and re-precaches
// the current shell. This is the purge for phones that were still
// rendering the old site header above the reader. RSC payloads
// (`?_rsc=`) are network-first now: the old stale-while-revalidate
// default could serve a days-old app tree to the client router.

const CACHE_VERSION = 'hifz-v3.0.2';
const STATIC_CACHE = 'hifz-static-v4';
const DYNAMIC_CACHE = 'hifz-dynamic-v4';
const API_CACHE = 'hifz-api-v4';
const IMAGE_CACHE = 'hifz-images-v4';
const MODEL_CACHE = 'hifz-model-v4';
const OFFLINE_URL = '/offline.html';

// ==================== CACHE STRATEGIES FOR THE HIFZ APP ====================
// Network First — I Love Islam pages are dynamic (Quran text comes from the API).
const NETWORK_FIRST_ROUTES = [
  '/hifz',
  '/hifz/recite',
  '/hifz/test',
  '/hifz/voice-search',
  '/hifz/plans',
  '/hifz/my-progress',
  '/hifz/challenges',
  '/hifz/juz-amma',
];

// All Hifz routes combined
const ALL_TOOL_ROUTES = [...NETWORK_FIRST_ROUTES];

// Static assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/logo.png',
  '/logo2.png',
];

// API endpoints to cache with expiry — the Hifz app's Quran proxy only.
const CACHEABLE_API_PATTERNS = [
  '/api/quran',
];

// API cache expiry (in milliseconds) — Quran text never changes, so the
// proxy responses stay usable offline for 7 days; networkFirstWithExpiry
// returns even an expired entry when offline rather than nothing.
const API_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// Coach model assets (§15.10): Tilawa hosts its ONNX model on tilawa.dev
// and its WASM runtime on a CDN. These are large, versioned, immutable
// files — cache-first, so the coach works in airplane mode after the
// first download. (Tilawa also caches through the Cache API itself;
// this is the service-worker's copy of the same guarantee.)
function isModelRequest(url) {
  if (url.hostname.includes('tilawa.dev')) return true;
  if (/\.(onnx|wasm|mjs)$/i.test(url.pathname)) return true;
  if (url.hostname.includes('cdn.jsdelivr.net') && url.pathname.includes('onnxruntime')) return true;
  return false;
}

// ==================== INSTALL EVENT ====================
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      }),
      // Pre-cache all tool routes
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(ALL_TOOL_ROUTES).catch((err) => {
          console.log('Some tool routes failed to precache:', err);
        });
      }),
    ])
  );
  self.skipWaiting();
});

// ==================== ACTIVATE EVENT ====================
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, IMAGE_CACHE, MODEL_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // Notify all clients that SW is updated
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        });
      });
    })
  );
  self.clients.claim();
});

// ==================== FETCH EVENT ====================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension, analytics, ads
  if (url.protocol === 'chrome-extension:') return;
  if (url.hostname.includes('google-analytics') || url.hostname.includes('googletagmanager')) return;
  if (url.hostname.includes('pagead2.googlesyndication.com')) return;
  if (url.hostname.includes('doubleclick.net')) return;

  // Coach model files (Tilawa model + ONNX WASM) — Cache First, so the
  // coach works in airplane mode after the first download (§15.10).
  // Cross-origin: cache only opaque-safe successful responses.
  if (isModelRequest(url)) {
    event.respondWith(cacheFirst(event.request, MODEL_CACHE));
    return;
  }

  // Handle API requests — Network First with cache fallback + expiry
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithExpiry(event.request));
    return;
  }

  // Handle external API requests (aladhan, etc.)
  if (url.hostname.includes('aladhan.com') || url.hostname.includes('api.')) {
    event.respondWith(networkFirstWithExpiry(event.request));
    return;
  }

  // Handle images — Cache First
  if (isImageRequest(event.request)) {
    event.respondWith(cacheFirstForImages(event.request));
    return;
  }

  // Handle static assets (JS, CSS, fonts) — Cache First
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // Handle Network First Hifz routes
  if (NETWORK_FIRST_ROUTES.some((route) => url.pathname === route || url.pathname.startsWith(route + '/'))) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Handle navigation requests (HTML pages) — Network First
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // App Router RSC payloads (?_rsc=) — Network First. These carry the
  // app tree for client-side navigations; the old stale-while-revalidate
  // default could hand the router a days-old tree (e.g. the old site
  // header above the reader).
  if (url.searchParams.has('_rsc')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Default — Stale While Revalidate
  event.respondWith(staleWhileRevalidate(event.request));
});

// ==================== CACHING STRATEGIES ====================

// Cache First — serve from cache, only fetch if not cached
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match(OFFLINE_URL);
    }
    return new Response('Offline', { status: 503 });
  }
}

// Network First — try network, fallback to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match(OFFLINE_URL);
    }
    return new Response(JSON.stringify({ offline: true, message: 'You are offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Network First with Expiry — for API responses
async function networkFirstWithExpiry(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      // Store with timestamp header
      const headers = new Headers(response.headers);
      headers.set('sw-cache-timestamp', Date.now().toString());
      const cachedResponse = new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
      });
      cache.put(request, cachedResponse);
    }
    return response;
  } catch (error) {
    // Try cache with expiry check
    const cached = await caches.match(request);
    if (cached) {
      const timestamp = cached.headers.get('sw-cache-timestamp');
      if (timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < API_CACHE_EXPIRY) {
          return cached;
        }
      }
      // Return even expired cache when offline (better than nothing)
      return cached;
    }
    return new Response(JSON.stringify({ offline: true, message: 'You are offline — showing cached data' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Cache First for Images
async function cacheFirstForImages(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return a transparent 1x1 pixel as fallback
    return new Response(
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then((c) => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => cached || new Response('Offline', { status: 503 }));

  return cached || fetchPromise;
}

// ==================== HELPERS ====================

function isImageRequest(request) {
  const url = new URL(request.url);
  return (
    request.destination === 'image' ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|avif)$/i.test(url.pathname) ||
    url.pathname.startsWith('/optimized/')
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image') ||
    /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname)
  );
}

// ==================== BACKGROUND SYNC ====================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncCachedData());
  }
  if (event.tag === 'newsletter-sync') {
    event.waitUntil(syncNewsletterSubscriptions());
  }
});

async function syncCachedData() {
  // Refresh Hifz data and other dynamic data
  try {
    const clients = await self.clients.matchAll();
    
    // Refresh API caches
    const apiCache = await caches.open(API_CACHE);
    const apiRequests = await apiCache.keys();
    
    for (const request of apiRequests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const headers = new Headers(response.headers);
          headers.set('sw-cache-timestamp', Date.now().toString());
          const cachedResponse = new Response(await response.blob(), {
            status: response.status,
            statusText: response.statusText,
            headers: headers,
          });
          await apiCache.put(request, cachedResponse);
        }
      } catch (e) {
        // Skip failed refreshes
      }
    }

    // Notify clients that data was refreshed
    clients.forEach((client) => {
      client.postMessage({ type: 'DATA_REFRESHED' });
    });
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

async function syncNewsletterSubscriptions() {
  const cache = await caches.open('newsletter-queue');
  const requests = await cache.keys();
  for (const request of requests) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.delete(request);
      }
    } catch (error) {
      console.log('Failed to sync newsletter subscription');
    }
  }
}

// ==================== PUSH NOTIFICATIONS ====================
// NOTE: no push subscription exists anywhere in the app — nothing ever
// subscribes, so this handler never fires. Reminders are local only
// (SHOW_REMINDER above). This handler is kept only so a future, explicitly
// approved push feature would have somewhere to land; it is not wired up.
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'I Love Islam', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/favicon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: data.actions || [],
    tag: data.tag || 'hifz-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'I Love Islam', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});

// ==================== MESSAGE HANDLER ====================
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  // Local reminders (opt-in only, no push, no server): the app shell
  // (PWAProvider) checks the stored goals while the app is open and
  // asks the worker to show the notification at the goal's reminder
  // time. The worker is the one that calls showNotification, so the
  // reminder appears as a system notification. Each goal fires at most
  // once a day — the page tracks that, not the worker.
  if (event.data?.type === 'SHOW_REMINDER') {
    const title = event.data.title || 'Time to practise your Hifz';
    event.waitUntil(
      self.registration.showNotification(title, {
        body: event.data.body || '',
        icon: '/icon-192.png',
        badge: '/favicon.png',
        vibrate: [100, 50, 100],
        tag: event.data.goalId ? `hifz-reminder-${event.data.goalId}` : 'hifz-reminder',
        renotify: true,
        data: {
          url: event.data.url || '/hifz/goals',
          dateOfArrival: Date.now(),
        },
      })
    );
  }
  if (event.data?.type === 'CACHE_TOOL') {
    // Cache a specific tool page on demand
    const toolUrl = event.data.url;
    if (toolUrl) {
      caches.open(DYNAMIC_CACHE).then((cache) => {
        cache.add(toolUrl).catch(() => {});
      });
    }
  }
  if (event.data?.type === 'CLEAR_API_CACHE') {
    caches.delete(API_CACHE);
  }
});
