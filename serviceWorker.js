const cacheName = 'food-locator';
const cacheVersion = `${cacheName}::1.0.0`;

const cachedFiles = [
  './',
  './img/1.jpg',
  './img/2.jpg',
  './img/3.jpg',
  './img/4.jpg',
  './img/5.jpg',
  './img/6.jpg',
  './img/7.jpg',
  './img/8.jpg',
  './img/9.jpg',
  './img/10.jpg',
  './img/mobile_1.jpg',
  './img/mobile_2.jpg',
  './img/mobile_3.jpg',
  './img/mobile_4.jpg',
  './img/mobile_5.jpg',
  './img/mobile_6.jpg',
  './img/mobile_7.jpg',
  './img/mobile_8.jpg',
  './img/mobile_9.jpg',
  './img/mobile_10.jpg',
  './css/styles.css',
  './js/main.js',
  './js/dbhelper.js',
  './js/restaurant_info.js',
  './data/restaurants.json',
  './restaurant.html',
  'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon-2x.png',
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
  'manifest.json',
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
];

const networkFiles = [];

self.addEventListener('install', event => {

  console.log('[pwa install]');

  event.waitUntil(
    caches.open(cacheVersion)
    .then(cache => cache.addAll(cachedFiles))
  );

});

self.addEventListener('activate', event => {

  console.log('[pwa activate]');

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key.indexOf(cacheName) === 0 && key !== cacheVersion)
        .map(key => caches.delete(key))
      )
    )
  );

  return self.clients.claim();

});

self.addEventListener('fetch', event => {
  if (networkFiles.filter(item => event.request.url.match(item)).length) {
    console.log('[network fetch]', event.request.url);

    event.respondWith(
      caches.match(event.request)
      .then(response => response || fetch(event.request))
    );

  } else {
    console.log('[pwa fetch]', event.request.url);

    event.respondWith(
      caches.match(event.request)
      .then(response => {

        caches.open(cacheVersion).then(cache => cache.add(event.request.url));
        return response || fetch(event.request)

      })
    );

  }

});

