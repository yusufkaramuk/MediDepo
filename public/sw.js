const CACHE_NAME = 'drdepo-v9';

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

// ---- Push payload doğrulama (allowlist) ----------------------------------
// Sunucudan gelse bile payload'a güvenilmez; her alan tip/uzunluk/format
// kontrolünden geçer. Hatalı JSON'da güvenli varsayılan bildirim gösterilir.

const ALLOWED_DATA_TYPES = ['expiry', 'system', 'test'];

function safeString(value, max) {
  if (typeof value !== 'string') return null;
  const s = value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim().slice(0, max);
  return s || null;
}

/** Yalnızca aynı origin içi göreli yol kabul eder; aksi halde '/'. */
function safeInternalUrl(value) {
  if (typeof value !== 'string' || value.length > 300) return '/';
  try {
    const resolved = new URL(value, self.location.origin);
    if (resolved.origin !== self.location.origin) return '/';
    return resolved.pathname + resolved.search + resolved.hash;
  } catch {
    return '/';
  }
}

function sanitizePushPayload(raw) {
  const p = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const out = {
    title: safeString(p.title, 80) || 'DrDepo',
    body: safeString(p.body, 240) || 'Yeni bir bildiriminiz var.',
    tag: (safeString(p.tag, 64) || 'drdepo-bildirim').replace(/[^\w:-]/g, '-'),
    data: { url: '/' },
  };

  const d = p.data && typeof p.data === 'object' && !Array.isArray(p.data) ? p.data : {};
  out.data.url = safeInternalUrl(d.url);
  const type = safeString(d.type, 32);
  if (type && ALLOWED_DATA_TYPES.includes(type)) out.data.type = type;

  return out;
}

self.addEventListener('push', (event) => {
  let payload = null;
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = null; // Hatalı JSON → güvenli varsayılan bildirim
    }
  }
  const safe = sanitizePushPayload(payload);

  const options = {
    body: safe.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: safe.tag,
    data: safe.data,
    lang: 'tr',
  };
  event.waitUntil(self.registration.showNotification(safe.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = safeInternalUrl(data.url);
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      const message = {
        type: 'notification-click',
        url: targetUrl,
        notificationType: data.type || null,
      };
      const existing = cls.find(c => 'focus' in c);
      if (existing) {
        existing.postMessage(message);
        return existing.focus();
      }
      // Açık pencere yok: hedef URL ile yeni pencere aç (yalnızca same-origin).
      return clients.openWindow(targetUrl);
    })
  );
});

// Tarayıcı aboneliği yenilediğinde (endpoint değişimi) uygulamaya haber ver;
// açık istemci yoksa bir sonraki açılışta subscribe() yeni endpoint'i yazar.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      for (const c of cls) c.postMessage({ type: 'push-subscription-change' });
    })
  );
});
