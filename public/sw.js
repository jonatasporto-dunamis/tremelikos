// Service Worker para Tremeliko's Burguer
// Estratégia: network-first para /api/*, cache-first para assets estáticos
// e stale-while-revalidate para /produto/[slug] (cardápio leitura)

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const PAGES_CACHE = `pages-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/combos',
  '/perfil-da-loja',
  '/manifest.webmanifest',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGES_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== PAGES_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // ignora outros domínios (Supabase, Meta, GA) — não cachear
  if (url.host !== self.location.host) return;

  // API → network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() => new Response(JSON.stringify({ offline: true }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }))
    );
    return;
  }

  // Admin → sempre network (não cachear)
  if (url.pathname.startsWith('/admin')) {
    event.respondWith(fetch(req));
    return;
  }

  // Carrinho/Checkout → network
  if (url.pathname.startsWith('/carrinho')) {
    event.respondWith(fetch(req));
    return;
  }

  // Imagens e estáticos → cache-first
  if (url.pathname.startsWith('/_next/static/') || url.pathname.match(/\.(png|jpg|jpeg|webp|svg|woff2?)$/i)) {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }).catch(() => caches.match('/icon-192x192.png'))
      )
    );
    return;
  }

  // Páginas do cardápio → stale-while-revalidate
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(PAGES_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const networkPromise = fetch(req).then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => cached || caches.match('/'));
        return cached || networkPromise;
      })
    );
  }
});

// notificações push (estrutura; sem chave de push server-side)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || "Tremeliko's", {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data: data.url || '/',
      })
    );
  } catch {
    /* ignore */
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data || '/';
  event.waitUntil(clients.openWindow(targetUrl));
});
