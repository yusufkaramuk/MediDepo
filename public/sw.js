const CACHE_NAME = 'ilac-stok-v6';

// App shell — cache edilecek statik dosyalar
const APP_SHELL = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Sadece same-origin GET isteklerini cache'le
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // /medicines.json: SW cache'ini bypass et — IndexedDB'de tutulur
  if (url.pathname === '/medicines.json') return;

  // Hashed assets (JS/CSS): cache-first (değişmez)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return res;
        });
      })
    );
    return;
  }

  // HTML navigasyon: network-first, offline'da cache
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match('/') || caches.match(request))
    );
    return;
  }
});

// Push bildirimi (Özellik 1 için hazır)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { payload = { title: 'İlaç Takip', body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'İlaç Takip', {
      body: payload.body || '',
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: payload.tag || 'ilac-bildirim',
      data: payload.data || {},
      actions: payload.actions || [],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      const focused = cls.find(c => c.focus);
      if (focused) return focused.focus();
      return clients.openWindow('/');
    })
  );
});
