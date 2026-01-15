// sw.js - исправленная версия
const CACHE_NAME = 'pwa-test-v1';
const urlsToCache = [
  './',                    // Текущая директория
  './auth.html',
  './dashbord.html',      // Обратите внимание на имя файла! У вас dashbord.html (с одной 'o')
  './register.html',
  './style.css',
  './app.js',
  './auth.js',
  './dashboard.js',       // Если у вас есть этот файл
  './register.js',        // Если у вас есть этот файл
  './manifest.json'
];

self.addEventListener('install', event => {
  console.log('[SW] Установка');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Начинаем кэширование...');
        
        // Кэшируем по одному, чтобы видеть ошибки
        const cachePromises = urlsToCache.map(url => {
          return cache.add(url).catch(err => {
            console.log(`[SW] Не удалось кэшировать ${url}:`, err);
            // Продолжаем даже если один файл не кэшировался
            return Promise.resolve();
          });
        });
        
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('[SW] Установка завершена');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Активация');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Пропускаем запросы к внешним ресурсам
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('[SW] Использую кэш для:', event.request.url);
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // Не кэшируем неуспешные ответы
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Клонируем ответ для кэширования
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('[SW] Закэшировано:', event.request.url);
              });
            
            return response;
          })
          .catch(error => {
            console.log('[SW] Ошибка fetch:', error);
            
            // Для HTML страниц возвращаем заглушку
            if (event.request.headers.get('accept').includes('text/html')) {
              return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Оффлайн</title>
                  <style>
                    body { font-family: Arial; padding: 50px; text-align: center; }
                    h1 { color: #4a90e2; }
                  </style>
                </head>
                <body>
                  <h1>🌐 Оффлайн режим</h1>
                  <p>Приложение доступно оффлайн</p>
                  <p>Попробуйте:</p>
                  <ul>
                    <li><a href="./auth.html">Авторизация</a></li>
                    <li><a href="./dashbord.html">Дашборд</a></li>
                  </ul>
                </body>
                </html>
              `, {
                headers: { 'Content-Type': 'text/html' }
              });
            }
            
            return new Response('Оффлайн', { status: 503 });
          });
      })
  );
});

// Push уведомления (базовые)
self.addEventListener('push', event => {
  const options = {
    body: 'Новое уведомление от PWA Test',
    icon: 'https://via.placeholder.com/192x192/4a90e2/ffffff?text=PWA',
    badge: 'https://via.placeholder.com/72x72/4a90e2/ffffff?text=PWA'
  };
  
  event.waitUntil(
    self.registration.showNotification('PWA Test', options)
  );
});