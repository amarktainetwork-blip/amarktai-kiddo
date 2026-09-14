const VERSION='amarktai-kiddo-v3';
const SHELL=['/','/dashboard','/chat','/library','/manifest.webmanifest','/icon.svg','/icon-192.svg','/icon-512.svg'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==VERSION).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);

  if(url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/api/')||url.pathname==='/health'||url.pathname==='/ready')return;

  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request)
        .then(response=>{
          const clone=response.clone();
          caches.open(VERSION).then(cache=>cache.put(request,clone));
          return response;
        })
        .catch(async()=>await caches.match(request)||await caches.match('/')||Response.error())
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached=>{
      if(cached)return cached;
      return fetch(request).then(response=>{
        if(response.ok){
          const clone=response.clone();
          caches.open(VERSION).then(cache=>cache.put(request,clone));
        }
        return response;
      });
    })
  );
});
