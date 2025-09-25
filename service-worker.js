const CACHE_NAME = 'cloudbox-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    // Firebase CDN 스크립트는 온라인에서 가져오는 것이 일반적이지만,
    // 필수적인 PWA 자산을 여기에 추가할 수 있습니다.
    // 'styles.css', // CSS가 HTML 내부에 있어 생략
    // 'scripts.js'  // JS가 HTML 내부에 있어 생략
];

// 설치 이벤트: 서비스 워커를 설치하고 파일들을 캐시에 저장
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting(); // 설치 후 바로 활성화
});

// 페치 이벤트: 네트워크 요청을 가로채서 캐시 또는 네트워크에서 응답
self.addEventListener('fetch', event => {
    // Firebase Realtime DB 및 Storage 요청은 캐시하지 않고 네트워크로 바로 보냄
    if (event.request.url.includes('firebaseio.com') || event.request.url.includes('firebasestorage.googleapis.com')) {
        return fetch(event.request);
    }
    
    // 캐시-우선 전략: 캐시에서 찾고, 없으면 네트워크에서 가져와 캐시에 저장
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 캐시에 있으면 캐시 응답 반환
                if (response) {
                    return response;
                }
                
                // 캐시에 없으면 네트워크 요청
                return fetch(event.request).then(
                    response => {
                        // 유효한 응답이 아니면 반환
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // 응답을 복제하여 캐시에 저장
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                            
                        return response;
                    }
                );
            })
    );
});

// 활성화 이벤트: 오래된 캐시 제거
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName); // 화이트리스트에 없는 캐시 삭제
                    }
                })
            );
        })
    );
    return self.clients.claim();
});