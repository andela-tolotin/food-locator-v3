const cacheName = 'food-locator';
const cacheVersion = `${cacheName}::1.0.0`;

const cachedFiles = [
  './',
  './img/icon@2x.png',
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
  './build/css/all.css',
  './js/idb.js',
  './js/dbhelper.js',
  './js/main.js',
  './js/restaurant_info.js',
  './restaurant.html',
  'http://localhost:1337/reviews',
  'http://localhost:1337/restaurants',
  'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon-2x.png',
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
  'manifest.json',
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
  'https://api.tiles.mapbox.com/v4/mapbox.streets/16/19308/24633.jpg70?access_token=pk.eyJ1IjoibGF6dG9wYXoiLCJhIjoiY2prbDJ5YmphMXF3NTNrb2c3MWVwd3J3cyJ9.A5kR6w5IyetjxUCi1huHdg'
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
    // If network is good send the reviews up
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
        return response || fetch(event.request);
      })
    );
  }

});

