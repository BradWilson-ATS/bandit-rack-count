// Bandit rack count — offline app shell cache.
// Submissions are handled by the page itself (fetch + localStorage queue), not here —
// this only makes sure the form opens with no signal at all.
var CACHE = 'bandit-rack-count-v2';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE).then(function(cache){ return cache.addAll(SHELL); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return; // let submissions go straight to the network
  if(new URL(event.request.url).origin !== location.origin) return; // don't cache the webhook call

  // Network-first: with signal, always show what's actually deployed — this app gets
  // repackaged and redeployed often, and a driver silently running a stale build is worse
  // than a slightly slower load. The cache only kicks in with no signal at all.
  event.respondWith(
    fetch(event.request).then(function(resp){
      if(resp && resp.ok){
        var copy = resp.clone();
        caches.open(CACHE).then(function(cache){ cache.put(event.request, copy); });
      }
      return resp;
    }).catch(function(){
      return caches.match(event.request);
    })
  );
});
