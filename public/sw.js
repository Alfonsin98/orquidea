const CACHE_NAME = 'orquiml-v2';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon.png',
  './apple-touch-icon.png'
];

// 1. Instalación: precachear archivos base esenciales y tomar control inmediato
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activación: limpiar cachés antiguas y tomar control de clientes abiertos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch: Estrategia Cache-First con almacenamiento dinámico
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Si ya está en caché, servirlo de inmediato (100% offline)
        // Y en segundo plano refrescar si hay conexión disponible
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Sin conexión: no pasa nada, se sirvió la versión de caché
          });

        return cachedResponse;
      }

      // Si no estaba en caché, buscarlo en la red y guardarlo para el futuro
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Guardar una copia en caché para cuando no haya internet
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Si estamos offline y es navegación (abrir la página principal)
          if (
            event.request.mode === 'navigate' ||
            (event.request.headers.get('accept') &&
              event.request.headers.get('accept').includes('text/html'))
          ) {
            return caches.match('./index.html') || caches.match('/');
          }

          // Para otros recursos (JS, CSS, imágenes) no devolver HTML para no romper la sintaxis
          return new Response('Offline resource not found', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
    })
  );
});
