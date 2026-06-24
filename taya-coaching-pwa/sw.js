/* Taya Fitness — Coaching Online · Service Worker */
const VERSION = 'taya-online-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/login.html',
  '/app/index.html',
  '/assets/app.css',
  '/assets/supabase.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html'
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

// Activate: drop old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
//  - Never cache Supabase/Stripe API calls (always network).
//  - Navigations: network-first, fall back to cache, then offline page.
//  - Static assets: cache-first, then network.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isApi =
    url.hostname.endsWith('supabase.co') ||
    url.hostname.endsWith('stripe.com') ||
    url.pathname.startsWith('/functions/');

  if (isApi) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/offline.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) =>
      cached ||
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(request, copy));
        return res;
      }).catch(() => cached)
    )
  );
});
