// GB+ update helper: show a safe refresh when the PWA worker changes.
// Never erase storage or reload while a user is entering a financial form.
(function(){
 if(!('serviceWorker' in navigator))return;
 const VERSION='v11',KEY='gbplus:refreshed:'+VERSION;
 let notice=null;
 function editing(){
  const active=document.activeElement;
  return !!document.querySelector('dialog[open], body.saving')||
   !!(active&&['INPUT','TEXTAREA','SELECT'].includes(active.tagName));
 }
 function refresh(){
  if(sessionStorage.getItem(KEY))return;
  if(editing()){
   if(notice)return;
   notice=document.createElement('div');
   notice.setAttribute('role','status');
   notice.style.cssText='position:fixed;left:12px;right:12px;bottom:calc(15px + env(safe-area-inset-bottom));z-index:20000;background:#19191c;color:#fff;border-radius:14px;padding:13px 16px;box-shadow:0 5px 28px #0004;display:flex;align-items:center;gap:10px;justify-content:space-between;font:13px system-ui';
   const label=document.createElement('span');label.textContent='Nova versão do GB+ disponível. Salve seu formulário antes de atualizar.';
   const btn=document.createElement('button');btn.type='button';btn.textContent='Atualizar';btn.style.cssText='background:#fff;color:#111;border:0;border-radius:9px;padding:9px 12px;font:600 12px system-ui';
   btn.addEventListener('click',()=>{sessionStorage.setItem(KEY,'1');location.reload();});
   notice.append(label,btn);document.body.append(notice);
   return;
  }
  sessionStorage.setItem(KEY,'1');
  location.reload();
 }
 navigator.serviceWorker.addEventListener('controllerchange',refresh);
 navigator.serviceWorker.addEventListener('message',event=>{if(event.data?.kind==='gbplus-update-ready')refresh();});
 navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>{
  reg.update().catch(()=>{});
  window.addEventListener('focus',()=>reg.update().catch(()=>{}));
  setInterval(()=>reg.update().catch(()=>{}),60000);
 }).catch(error=>console.warn('Atualização do GB+ indisponível.',error));
})();
