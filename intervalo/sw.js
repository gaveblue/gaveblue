// Intervalo 0.9.8 — SW com fallback offline. Nenhuma resposta privada, JWT ou comanda é armazenada.
const OFFLINE_CACHE='intervalo-offline-v0.9.8';
const OFFLINE_PAGE='/intervalo/offline.html';
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(OFFLINE_CACHE).then(cache=>cache.add(new Request(OFFLINE_PAGE,{cache:'reload'})))
  .catch(()=>{}).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('intervalo-offline-')&&k!==OFFLINE_CACHE).map(k=>caches.delete(k))))
   .then(()=>self.clients.claim())
 );
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.mode!=='navigate'||request.method!=='GET')return;
 const u=new URL(request.url);
 if(u.origin!==self.location.origin||!u.pathname.startsWith('/intervalo/'))return;
 // Sempre consultar a rede: NUNCA armazenar sessão, mesas, pedidos ou respostas autenticadas.
 event.respondWith(fetch(request).catch(async()=>(
   await caches.match(OFFLINE_PAGE)||new Response('Intervalo offline. Conecte-se e tente novamente.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})
 )));
});
