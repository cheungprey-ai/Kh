// ==========================================
// Cheung Prey AI - Service Worker
// ==========================================
const CACHE_NAME = 'cheung-prey-ai-v1';
const ASSETS = [
    './',
    './index.html',
    './app2.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// ============ INSTALL ============
self.addEventListener('install', (e) => {
    console.log('[SW] Installing...');
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching assets');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// ============ ACTIVATE ============
self.addEventListener('activate', (e) => {
    console.log('[SW] Activating...');
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((k) => k !== CACHE_NAME)
                    .map((k) => {
                        console.log('[SW] Deleting old cache:', k);
                        return caches.delete(k);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// ============ FETCH ============
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;

    const url = e.request.url;
    if (url.includes('cdn.') ||
        url.includes('googleapis.com') ||
        url.includes('gstatic.com') ||
        url.includes('jsdelivr.net') ||
        url.includes('cloudflare.com') ||
        url.includes('unpkg.com') ||
        url.includes('huggingface.co')) {
        return;
    }

    e.respondWith(
        fetch(e.request)
            .then((res) => {
                if (res && res.status === 200 && res.type === 'basic') {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, clone);
                    });
                }
                return res;
            })
            .catch(() => {
                return caches.match(e.request).then((cached) => {
                    if (cached) return cached;
                    return caches.match('./index.html');
                });
            })
    );
});

// ============ MESSAGE ============
self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});