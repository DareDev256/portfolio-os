// Service Worker (F) – simple pre-cache + runtime cache for images
const CACHE_NAME = 'portfolio-os-v2';
const PRECACHE = [
    '/',
    '/index.html',
    '/css/reset.css',
    '/css/variables.css',
    '/css/styles.css',
    '/css/windows.css',
    '/css/glass.css',
    '/css/galaxy.css',
    '/css/modal.css',
    '/css/loading.css',
    '/css/welcome.css',
    '/css/tour.css',
    '/css/interactions.css',
    '/css/mobile.css',
    '/css/accessibility.css',
    '/assets/wallpapers/default.jpg',
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(PRECACHE.map((p) => new Request(p, { cache: 'reload' })));
            self.skipWaiting();
        })()
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
            self.clients.claim();
        })()
    );
});

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    // Only cache same-origin requests
    if (url.origin !== location.origin) return;
    // Runtime cache for images
    if (e.request.destination === 'image') {
        e.respondWith(
            (async () => {
                const cache = await caches.open(CACHE_NAME);
                const cached = await cache.match(e.request);
                if (cached) return cached;
                const res = await fetch(e.request);
                if (res.ok) {
                    cache.put(e.request, res.clone());
                }
                return res;
            })()
        );
        return;
    }
    // Default: try cache, fall back to network
    e.respondWith(
        (async () => {
            const cached = await caches.match(e.request);
            return cached || fetch(e.request);
        })()
    );
});
