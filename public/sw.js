// I Love Islam Service Worker
const CACHE_NAME = 'iloveislam-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/offline.html',
];

// Tool routes to cache
const TOOL_ROUTES = [
  '/zakat',
  '/prayer-times',
  '/qibla',
  '/quran',
  '/hijri',
  '/dhikr',
  '/dua',
  '/names',
  '/mizan',
  '/ramadan',
  '/hadith',
  '/sadaqah',
  '/will',
  '/inheritance',
  '/halal-finance',
  '/kaffarah',
  '/travel',
  '/hajj',
  '/mosque',
  '/names-finder',
  '/about',
  '/blog',
  '/contact',
  '/faq',
  '/terms',
  '/privacy',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([...STATIC_ASSETS, ...TOOL_ROUTES]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API requests
  if (url.pathname.startsWith('/api/')) return;
  
  // Skip analytics
  if (url.hostname.includes('google-analytics') || url.hostname.includes('googletagmanager')) return;
  
  // Skip AdSense
  if (url.hostname.includes('pagead2.googlesyndication.com')) return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Otherwise fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Cache the fetched response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // If offline and request is for a page, show offline page
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
    })
  );
});

// Background sync for newsletter signups
self.addEventListener('sync', (event) => {
  if (event.tag === 'newsletter-sync') {
    event.waitUntil(syncNewsletterSubscriptions());
  }
});

async function syncNewsletterSubscriptions() {
  // Implement background sync for offline newsletter signups
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