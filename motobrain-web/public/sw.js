const CACHE = 'motobrain-v3';
const SHELL = [
  '/',
  '/portal',
  '/portal/servicios',
  '/portal/login',
  '/portal-registro',
  '/portal/consultar',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // No cachear llamadas al backend ni a APIs externas
  if (url.pathname.startsWith('/api/backend/')) return;
  if (url.port === '4000') return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Cachear respuestas del mismo origen (HTML, JS, CSS, iconos)
        if (res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request)),
  );
});
