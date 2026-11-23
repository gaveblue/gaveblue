const CACHE_NAME = 'central-registros-static-v20260809-3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css?v=20260809-1548',
  './app.js?v=20260809-1548',
  './manifest.webmanifest',
  './assets/pwa/icon-192.png',
  './assets/pwa/icon-512.png',
  './assets/pwa/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      // Esta SW pertence ao site raiz: não apagar caches de outros aplicativos.
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('central-registros-static-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(async () => {
        const cache = await caches.open(CACHE_NAME);
        const stored = await cache.keys();
        await Promise.all(stored.filter((r) => new URL(r.url).pathname.startsWith('/confraternizacao/')).map((r) => cache.delete(r)));
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // RSVP tem dados mutáveis e não é PWA: jamais usar cópias antigas ou fallback
  // do site principal para esta pasta. Isso não altera os demais módulos.
  if (requestUrl.pathname.startsWith('/confraternizacao/')) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        return response;
      })
      .catch(() => caches.match(request).then((cachedResponse) => cachedResponse || caches.match('./index.html')))
  );
});
