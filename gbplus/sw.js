const CACHE='gb-plus-shell-v7';
const ASSETS=['./','./index.html','./styles.css','./js/app.js','./js/update.js','./js/domain.js','./js/store.js','./js/ui.js','./js/views.js','./js/forms.js','./js/auth.js','./js/cloud-config.js','./vendor/supabase-2.118.0.js','./integrations/supabase/client.js','./integrations/supabase/repository.js','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(async cache=>{
  // Fetch a coherent release, bypassing previously cached HTTP responses.
  // Store under canonical asset URLs so module imports work offline.
  const responses=await Promise.all(ASSETS.map(async asset=>{
    const url=new URL(asset,self.registration.scope);
    url.searchParams.set('gbplus_release',CACHE);
    const response=await fetch(url,{cache:'reload'});
    if(!response.ok)throw new Error('GB+ asset unavailable');
    return [asset,response];
  }));
  await Promise.all(responses.map(([asset,response])=>cache.put(asset,response)));
  await self.skipWaiting();
})));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  await Promise.all((await caches.keys()).filter(k=>k.startsWith('gb-plus-shell-')&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
  const scope=new URL(self.registration.scope);
  const clients=await self.clients.matchAll({type:'window'});
  await Promise.all(clients.filter(client=>{const url=new URL(client.url);return url.origin===scope.origin&&url.pathname.startsWith(scope.pathname);}).map(client=>{
    const url=new URL(client.url);url.searchParams.set('gbplus_release',CACHE);
    return client.navigate(url.href).catch(()=>{});
  }));
})()));
// The chatbot evolves independently from the app shell: always fetch current modules.
// Never serve stale AI rules or a stale chat page from the app's cache.
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname+'ai-lab/'))return;
 event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>new Response('Chat indisponível offline. Reabra com internet.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})));
});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin||!new URL(event.request.url).pathname.startsWith(new URL(self.registration.scope).pathname)||new URL(event.request.url).pathname.startsWith(new URL(self.registration.scope).pathname+'ai-lab/'))return;event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request).then(cached=>cached||fetch(event.request).catch(()=>event.request.mode==='navigate'?cache.match('./index.html'):Response.error()))));});
