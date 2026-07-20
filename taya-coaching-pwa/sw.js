/* Taya Fitness — Coaching Online · Service Worker */
const VERSION = 'taya-online-v2';
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

/* ══════════════════════════════════════════════════════════════════
   RAPPELS DE SÉANCE

   Le serveur envoie la notification ; c'est ce fichier qui l'affiche,
   même quand l'app est fermée. C'est tout l'intérêt du service worker.
   ══════════════════════════════════════════════════════════════════ */

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (_) { d = {}; }

  const titre = d.titre || 'Ta séance approche 💪';
  const options = {
    body: d.corps || 'Rendez-vous dans une heure.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: d.tag || 'seance',          // une seule notification par séance
    renotify: false,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: { url: d.url || '/app/?view=seance' },
    actions: [{ action: 'ouvrir', title: 'Voir ma séance' }],
  };
  event.waitUntil(self.registration.showNotification(titre, options));
});

// Au clic : on réutilise l'onglet déjà ouvert plutôt que d'en empiler un.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const cible = (event.notification.data && event.notification.data.url) || '/app/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((liste) => {
      for (const c of liste) {
        if (c.url.includes('/app') && 'focus' in c) { c.navigate(cible); return c.focus(); }
      }
      return self.clients.openWindow(cible);
    })
  );
});
