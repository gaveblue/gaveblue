// Independent from Auth: update even when a session or API is unavailable.
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>{
    reg.update().catch(()=>{});
    window.addEventListener('focus',()=>reg.update().catch(()=>{}));
    setInterval(()=>reg.update().catch(()=>{}),60000);
  }).catch(()=>{});
}
