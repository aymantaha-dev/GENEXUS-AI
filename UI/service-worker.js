/**
 * GENEXUS UI - Service Worker for GitHub Pages (UI subfolder)
 */

const CACHE_NAME = 'genexus-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './about.html',
  './why.html',
  './copyright.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap',
  'https://unpkg.com/lucide@latest'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching assets for UI subfolder');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            const url = new URL(event.request.url);
            
            // Don't cache API calls or external images
            if (!url.pathname.includes('/api/') && 
                !url.pathname.includes('generate') &&
                !url.hostname.includes('render.com')) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            return caches.match('./index.html');
          });
      })
  );
});