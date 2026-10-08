// Check for a newer release without clearing local data or interrupting a form.
(() => {
  'use strict';
  const current=document.querySelector('meta[name="app-release"]')?.content;
  let checking=false,notice,updating=false,ready=false;
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const hasOpenForm=()=>Boolean(document.querySelector('dialog[open]'));
  async function manifest(signal){
    const response=await fetch('./release.json?check='+Date.now(),{cache:'no-store',signal});
    if(!response.ok)throw new Error('Release unavailable');
    const release=await response.json();
    if(!/^[a-f0-9]{16}$/.test(release.version)||!Array.isArray(release.assets)||!release.assets.length||release.assets.some(asset=>
      !/^(?:[\w-]+\/)*[\w.-]+\.(?:js|css)$/.test(asset.file)||asset.file.split('/').includes('..')||!/^[a-f0-9]{16}$/.test(asset.version)
    ))throw new Error('Invalid release');
    return release;
  }
  function message(state,title,description,label){
    notice.dataset.state=state;
    notice.querySelector('.release-title').textContent=title;
    notice.querySelector('.release-description').textContent=description;
    notice.querySelector('button').textContent=label;
  }
  function progress(done,total){
    const value=Math.round(done/total*100),bar=notice.querySelector('[role="progressbar"]');
    bar.setAttribute('aria-valuenow',String(value));
    notice.querySelector('.release-fill').style.width=value+'%';
    notice.querySelector('.release-percent').textContent=value+'%';
  }
  function waitForForm(){
    notice.querySelector('button').disabled=false;
    message(ready?'ready':'available',ready?'Atualização pronta':'Nova versão disponível',
      'Salve ou cancele o formulário aberto antes de atualizar.',ready?'Aplicar atualização':'Atualizar agora');
  }
  async function apply(){
    if(hasOpenForm()){waitForForm();return;}
    notice.querySelector('button').disabled=true;
    message('ready','Tudo pronto!','Recarregando o sistema com a nova versão…','Atualizando…');
    await pause(700);
    // A form may have been opened while the files were downloading.
    if(hasOpenForm()){waitForForm();return;}
    location.reload();
  }
  async function update(){
    if(updating)return;
    if(hasOpenForm()){waitForForm();return;}
    updating=true;
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),90000);
    try{
      if(ready){await apply();return;}
      notice.querySelector('button').disabled=true;
      notice.querySelector('.release-progress').hidden=false;
      progress(0,1);
      message('downloading','Baixando atualização…','Preparando a nova versão para você.','Baixando…');
      const release=await manifest(controller.signal);
      // Warm the browser cache with the actual new page and its versioned files.
      const pageURL=new URL(location.href);pageURL.hash='';
      const response=await fetch(pageURL,{cache:'reload',signal:controller.signal});
      if(!response.ok)throw new Error('Page unavailable');
      const html=new DOMParser().parseFromString(await response.text(),'text/html');
      if(html.querySelector('meta[name="app-release"]')?.content!==release.version)throw new Error('Release still deploying');
      let done=1,next=0;const total=release.assets.length+1;
      progress(done,total);
      async function download(){
        while(next<release.assets.length){
          const asset=release.assets[next++];
          const file=await fetch('./'+asset.file+'?v='+asset.version,{cache:'reload',signal:controller.signal});
          if(!file.ok)throw new Error('Asset unavailable');
          const bytes=await file.arrayBuffer();
          if(crypto.subtle){
            const text=new TextDecoder().decode(bytes).replace(/\r\n/g,'\n');
            const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
            const hash=Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('').slice(0,16);
            if(hash!==asset.version)throw new Error('Asset still deploying');
          }
          if(controller.signal.aborted)return;
          progress(++done,total);
        }
      }
      await Promise.all(Array.from({length:Math.min(4,release.assets.length)},download));
      if(controller.signal.aborted)throw new Error('Download interrupted');
      ready=true;
      await pause(350); // Let the progress bar reach its final position.
      await apply();
    }catch{
      controller.abort();
      message('error','Não foi possível atualizar','Verifique sua conexão e tente novamente. Seus dados continuam salvos.','Tentar novamente');
      notice.querySelector('button').disabled=false;
    }finally{clearTimeout(timeout);updating=false;}
  }
  async function check(){
    if(checking||notice||document.hidden||!current||current==='development')return;
    checking=true;
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
    try{
      const release=await manifest(controller.signal);
      if(release.version===current)return;
      notice=document.createElement('aside');notice.className='release-notice';notice.dataset.state='available';notice.setAttribute('aria-label','Atualização do sistema');
      notice.innerHTML='<div class="release-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><g class="release-arrow"><path d="M12 3v12m-4-4 4 4 4-4"/></g><path class="release-tray" d="M4 16v4h16v-4"/><path class="release-check" d="m5 12 4 4L19 6"/></svg></div><div class="release-copy" role="status" aria-live="polite" aria-atomic="true"><strong class="release-title">Nova versão disponível</strong><p class="release-description">Atualize para receber as últimas melhorias.</p></div><div class="release-progress" hidden><div class="release-track" role="progressbar" aria-label="Download da atualização" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="release-fill"></span></div><span class="release-percent" aria-hidden="true">0%</span></div><button type="button">Atualizar agora</button>';
      notice.querySelector('button').onclick=update;
      document.body.append(notice);
    }catch{/* Keep the current page usable while offline. */}
    finally{clearTimeout(timeout);checking=false;}
  }
  check();setInterval(check,300000);document.addEventListener('visibilitychange',check);
})();
