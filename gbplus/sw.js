// GB+ PWA recovery release v13: do not block installation on network requests,
// automatically redirect app windows, or reload open financial forms.
const CACHE='gb-plus-shell-v15';
const CORE=['./','./index.html','./styles.css','./js/app.js','./js/update.js','./recuperar.html'];
const scope=new URL(self.registration.scope);
const inScope=url=>url.origin===scope.origin&&url.pathname.startsWith(scope.pathname);
const delay=(ms)=>new Promise((_,reject)=>setTimeout(()=>reject(new Error('NETWORK_TIMEOUT')),ms));
async function network(request,ms){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),ms);
 try{return await fetch(request,{cache:'no-store',signal:controller.signal});}
 finally{clearTimeout(timer);}
}
async function fallback(request){
 const own=await caches.open(CACHE);
 const hit=await own.match(request,{ignoreSearch:true})||await caches.match(request,{ignoreSearch:true});
 if(hit)return hit;
 if(request.mode==='navigate'){
  const offline=await own.match(new URL('./index.html',scope))||
    await caches.match(new URL('./index.html',scope));
  if(offline)return offline;
  return new Response('<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GB+ indisponível</title><body style="font:16px system-ui;padding:30px;background:#f5f5f8;color:#161616"><h1>GB+ temporariamente indisponível</h1><p>Não foi possível carregar a página. Confira sua conexão e tente novamente.</p><p><a href="./recuperar.html">Abrir recuperação do GB+</a></p></body></html>',{status:503,headers:{'Content-Type':'text/html;charset=utf-8'}});
 }
 return Response.error();
}
self.addEventListener('install',event=>{
 // No large asset prefetch: waiting for network can trap Android PWA splash.
 event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate',event=>{
 // Never redirect or force-reload open pages; old caches remain until safely replaced.
 event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||!inScope(url))return;
 event.respondWith((async()=>{
  try{
   const response=await network(request,request.mode==='navigate'?6000:8000);
   if(response.ok&&response.type==='basic'){
    // Cache writes MUST NOT delay the response that releases the PWA splash.
    const clone=response.clone();
    event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,clone)).catch(()=>{}));
   }
   return response;
  }catch(error){return fallback(request);}
 })());
});
