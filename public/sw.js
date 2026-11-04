const CACHE_NAME = 'orquiml-v4';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon.png',
  './apple-touch-icon.png'
];

// 1. Instalación: forzar activación inmediata
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

// 2. Activación: borrar cachés antiguas y tomar control de clientes abiertos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Manejo de peticiones:
// - HTML / Navegación: ESTRATEGIA NETWORK-FIRST con fallback a Caché
//   (Garantiza que en cuanto hay internet, el iPhone descargue la última versión de código al abrirse)
// - Recursos de aplicación (JS, CSS, Imágenes): ESTRATEGIA CACHE-FIRST con actualización en segundo plano
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Comprobar si la petición es de navegación (HTML principal)
  const isNavigation =
    event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/orquidea/') ||
    url.pathname.endsWith('/orquidea');

  if (isNavigation) {
    // NETWORK-FIRST PARA HTML
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Si no hay internet (offline), responder con la versión guardada en caché
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('./index.html') || caches.match('./');
          });
        })
    );
    return;
  }

  // CACHE-FIRST PARA ACTIVOS ESTÁTICOS Y COMPILADOS (JS con hash, CSS, iconos)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Devolver de caché de inmediato (máxima velocidad y 100% offline)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // Si no estaba en caché, buscar en la red y guardar copia
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          return new Response('Offline resource not found', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
    })
  );
});
