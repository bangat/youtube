const CACHE_NAME = 'cloudbox-cache-v8';
const STATIC_ASSETS = [
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

function isFirebaseRequest(url) {
    return url.includes('firebaseio.com')
        || url.includes('firebasestorage.googleapis.com')
        || url.includes('firebasestorage.app');
}

function isAppShellRequest(requestUrl, request) {
    const pathname = requestUrl.pathname;
    return request.mode === 'navigate'
        || pathname === '/'
        || pathname === '/index.html'
        || pathname === '/youtube/'
        || pathname === '/youtube/index.html'
        || pathname.endsWith('/index.html')
        || pathname.endsWith('/service-worker.js')
        || pathname.endsWith('/manifest.json');
}

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }

    const requestUrl = new URL(event.request.url);

    if (isFirebaseRequest(event.request.url)) {
        event.respondWith(fetch(event.request));
        return;
    }

    if (isAppShellRequest(requestUrl, event.request)) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then(response => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            });
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => Promise.all(
            cacheNames.map(cacheName => {
                if (cacheName !== CACHE_NAME) {
                    return caches.delete(cacheName);
                }
                return Promise.resolve();
            })
        ))
    );
    self.clients.claim();
});
