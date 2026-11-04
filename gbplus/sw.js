// GB+ PWA release 2026-11-04 — network-first prevents stale financial UI and AI.
const CACHE='gb-plus-shell-v10';
const VERSION='v10';
const ASSETS=['./','./index.html','./styles.css','./js/app.js','./js/ai-bridge.js','./js/update.js','./js/domain.js','./js/store.js','./js/ui.js','./js/views.js','./js/forms.js','./js/auth.js','./js/cloud-config.js','./vendor/supabase-2.118.0.js','./integrations/supabase/client.js','./integrations/supabase/repository.js','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png','./ai-lab/','./ai-lab/index.html','./ai-lab/engine.js','./ai-lab/faq.js','./ai-lab/voice.js'];
const scope=new URL(self.registration.scope);
const inScope=url=>url.origin===scope.origin&&url.pathname.startsWith(scope.pathname);
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 // Individual asset errors must not block a new safety/update fix from installing.
 await Promise.allSettled(ASSETS.map(async asset=>{
  const url=new URL(asset,scope);url.searchParams.set('gbplus_release',VERSION);
  const res=await fetch(url,{cache:'no-store'});
  if(!res.ok)throw Error('Unavailable: '+asset);
  await cache.put(new Request(new URL(asset,scope)),res);
 }));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await Promise.all((await caches.keys()).filter(name=>name.startsWith('gb-plus-shell-')&&name!==CACHE).map(name=>caches.delete(name)));
 await self.clients.claim();
 const clients=await self.clients.matchAll({type:'window'});
 // Only background tabs are navigated automatically: never discard an open form.
 await Promise.all(clients.filter(client=>client.visibilityState==='hidden').map(client=>{
  const url=new URL(client.url);if(!inScope(url)||url.searchParams.get('gbplus_release')===VERSION)return Promise.resolve();
  url.searchParams.set('gbplus_release',VERSION);
  return client.navigate(url.href).catch(()=>{});
 }));
 await Promise.all(clients.filter(client=>client.visibilityState==='visible').map(client=>client.postMessage({kind:'gbplus-update-ready',version:VERSION})));
})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||!inScope(url))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(request,{cache:'no-store'});
   if(response.ok&&response.type==='basic')await cache.put(request,response.clone()).catch(()=>{});
   return response;
  }catch(error){
   const previous=await cache.match(request,{ignoreSearch:true});
   if(previous)return previous;
   if(request.mode==='navigate'){
    const shell=await cache.match(new URL('./index.html',scope));
    if(shell)return shell;
   }
   return Response.error();
  }
 })());
});
