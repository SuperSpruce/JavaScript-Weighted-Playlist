// sw.js
const CACHE_NAME = 'music-cache';
const TRACKS_TO_CACHE = []; // Fill dynamically with next few tracks

self.addEventListener('install', event => event.waitUntil(caches.open(CACHE_NAME)));
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});