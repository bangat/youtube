const CACHE_NAME = 'premium-player-cache-v1';
const FILES_TO_CACHE = [
  '/',
  'index.html'
  // 아이콘들도 캐시하려면 여기에 경로를 추가할 수 있습니다.
  // 예: 'icons/icon-192x192.png'
];

// 서비스 워커 설치 시: 필수 파일들을 캐시에 저장합니다.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('캐시 열림');
        return cache.addAll(FILES_TO_CACHE);
      })
  );
});

// 네트워크 요청 발생 시: 캐시를 먼저 확인하고 없으면 네트워크로 요청합니다.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 파일이 있으면 그걸 주고, 없으면 네트워크로 요청
        return response || fetch(event.request);
      })
  );
});

// 서비스 워커 활성화 시: 오래된 버전의 캐시를 정리합니다.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});