const CACHE_NAME = 'countdown-app-v1.0.0';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js',
  'https://cdn.tailwindcss.com'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  console.log('[SW] 安裝中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 緩存檔案');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] 安裝完成');
        return self.skipWaiting();
      })
  );
});

// 啟用 Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] 啟用中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 刪除舊緩存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] 啟用完成');
      return self.clients.claim();
    })
  );
});

// 攔截網路請求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在緩存中找到，直接返回
        if (response) {
          console.log('[SW] 從緩存返回:', event.request.url);
          return response;
        }
        
        // 否則從網路獲取
        console.log('[SW] 從網路獲取:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // 檢查是否為有效回應
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆回應，因為它只能使用一次
            const responseToCache = response.clone();
            
            // 將新資源加入緩存
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // 網路失敗時的後備方案
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// 背景同步 (可選)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] 背景同步');
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // 在這裡可以添加背景同步邏輯
  // 例如同步離線時的數據變更
  return Promise.resolve();
}

// 推送通知 (可選)
self.addEventListener('push', event => {
  console.log('[SW] 收到推送訊息');
  
  const options = {
    body: event.data ? event.data.text() : '您的重要日子快到了！',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('重要日子倒數', options)
  );
});

// 通知點擊處理
self.addEventListener('notificationclick', event => {
  console.log('[SW] 通知被點擊');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./')
  );
});
