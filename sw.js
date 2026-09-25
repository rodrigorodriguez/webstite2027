/* Service worker | rodrigorodriguez.com
   Strategy: navigation requests are network-first with cached offline
   fallback; same-origin static assets are cache-first (they carry the
   ?v=N cache-bust). Cosmically small, deliberately boring. */
const CACHE = 'rr-site-v1';
const OFFLINE = '/404.html';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([
    '/', '/404.html',
    '/css/site.css?v=7', '/js/site.js?v=7', '/js/search.js?v=7',
    '/js/share.js?v=7', '/js/motion.js?v=3',
    '/fonts/space-grotesk-700.woff2', '/fonts/manrope-400.woff2',
    '/images/icons/icon-192.png', '/images/icons/icon-512.png'
  ])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match(OFFLINE)))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok && (url.pathname.startsWith('/css/') || url.pathname.startsWith('/js/') ||
            url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/images/'))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
