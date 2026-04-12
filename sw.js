// Service Worker (F) – pre-cache + hardened runtime cache
const CACHE_NAME = 'portfolio-os-v5';
const MAX_CACHE_ENTRIES = 150; // Prevent unbounded cache growth
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

/**
 * Validate a response is safe to cache.
 * Blocks opaque responses (from redirects/no-cors) that could poison the cache,
 * and non-ok responses that would serve error pages as cached content.
 */
function isCacheable(response) {
    if (!response || !response.ok) return false;
    // Block opaque responses — they hide status codes and could be error pages
    if (response.type === 'opaque' || response.type === 'opaqueredirect') return false;
    return true;
}

/**
 * Evict oldest entries when cache exceeds max size.
 * Prevents storage exhaustion from runtime-cached images.
 */
async function trimCache(cacheName, max) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > max) {
        await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
    }
}

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
    // Only cache same-origin GET requests
    if (url.origin !== location.origin) return;
    if (e.request.method !== 'GET') return;

    // Navigation requests: network-first to prevent serving stale HTML
    if (e.request.mode === 'navigate') {
        e.respondWith(
            (async () => {
                try {
                    const res = await fetch(e.request);
                    if (isCacheable(res)) {
                        const cache = await caches.open(CACHE_NAME);
                        cache.put(e.request, res.clone());
                    }
                    return res;
                } catch {
                    const cached = await caches.match(e.request);
                    return cached || new Response('Offline', { status: 503 });
                }
            })()
        );
        return;
    }

    // Runtime cache for images — validate before caching
    if (e.request.destination === 'image') {
        e.respondWith(
            (async () => {
                const cache = await caches.open(CACHE_NAME);
                const cached = await cache.match(e.request);
                if (cached) return cached;
                const res = await fetch(e.request);
                if (isCacheable(res)) {
                    cache.put(e.request, res.clone());
                    trimCache(CACHE_NAME, MAX_CACHE_ENTRIES);
                }
                return res;
            })()
        );
        return;
    }
    // Hashed assets (Vite bundles): cache-first — hash changes on rebuild
    // Unhashed assets: network-first so deploys land immediately
    const isHashed = /\.[a-zA-Z0-9_-]{8,}\.(js|css)$/.test(url.pathname);
    if (isHashed) {
        e.respondWith(
            (async () => {
                const cached = await caches.match(e.request);
                return cached || fetch(e.request).then(res => {
                    if (isCacheable(res)) {
                        const cache = caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
                    }
                    return res;
                });
            })()
        );
        return;
    }
    // Everything else: network-first
    e.respondWith(
        (async () => {
            try {
                const res = await fetch(e.request);
                if (isCacheable(res)) {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(e.request, res.clone());
                }
                return res;
            } catch {
                const cached = await caches.match(e.request);
                return cached || new Response('Offline', { status: 503 });
            }
        })()
    );
});
