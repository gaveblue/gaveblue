// GB+ safe updater. Never reload automatically and never delete financial data.
(function(){
 if(!('serviceWorker' in navigator))return;
 let visible=false;
 function offerReload(){
  if(visible)return;visible=true;
  const show=()=>{
   if(!document.body){document.addEventListener('DOMContentLoaded',show,{once:true});return;}
   const notice=document.createElement('aside');
   notice.setAttribute('role','status');
   notice.style.cssText='position:fixed;z-index:20000;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));padding:12px 14px;background:#1c1c20;color:#fff;border-radius:14px;box-shadow:0 6px 24px #0004;display:flex;align-items:center;justify-content:space-between;gap:10px;font:13px system-ui';
   const label=document.createElement('span');label.textContent='Atualização disponível. Salve seu trabalho antes de recarregar.';
   const button=document.createElement('button');button.type='button';button.textContent='Atualizar';button.style.cssText='background:#fff;color:#19191c;border:0;border-radius:9px;padding:9px 12px;font:600 12px system-ui';
   button.addEventListener('click',()=>location.reload());
   const close=document.createElement('button');close.type='button';close.setAttribute('aria-label','Adiar atualização');close.textContent='×';close.style.cssText='border:0;background:transparent;color:#fff;font:22px system-ui;padding:2px 5px';
   close.addEventListener('click',()=>notice.remove());
   notice.append(label,button,close);document.body.append(notice);
  };
  show();
 }
 navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'})
   .then(reg=>{reg.update().catch(()=>{});})
   .catch(error=>console.warn('GB+ PWA: atualização indisponível',error));
 // Only offer a voluntary refresh; don't cause launch-time reload loops.
 navigator.serviceWorker.addEventListener('controllerchange',offerReload);
})();
