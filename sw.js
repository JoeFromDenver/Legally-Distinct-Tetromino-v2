// sw.js - Service Worker for Tetromino Game

const CACHE_NAME = 'tetromino-game-cache-v4'; // Incremented cache version
// Updated list of files to cache
const urlsToCache = [
  './', // Alias for index.html
  './index.html',
  './manifest.json',
  // Local Audio Engine
  './js/Tone.js',
  // Icons
  './icons/web-app-manifest-192x192.png',
  './icons/web-app-manifest-512x512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-96x96.png',
  './icons/favicon.svg',
  './icons/favicon.ico'
];

// Install event: Cache the application shell
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing v4...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell v4');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: App shell v4 cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Caching v4 failed', error);
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating v4...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated v4 successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event: Serve cached content when offline, or fetch from network
self.addEventListener('fetch', (event) => {
  const isCachableRequest = urlsToCache.some(cachedUrl => {
    const requestPath = new URL(event.request.url, self.location.origin).pathname;
    const cachedPath = new URL(cachedUrl, self.location.origin).pathname;
    return requestPath === cachedPath;
  });

  if (event.request.method === 'GET' && isCachableRequest) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(
            (networkResponse) => {
              if (!networkResponse || networkResponse.status !== 200) {
                return networkResponse;
              }
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              return networkResponse;
            }
          ).catch(error => {
            console.error('Service Worker: Fetching failed for', event.request.url, error);
          });
        })
    );
  } else {
    event.respondWith(fetch(event.request));
  }
});