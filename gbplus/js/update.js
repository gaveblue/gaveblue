/* GB+ Update Center.
 * Real downloads, file-by-file progress, explicit installation/reload.
 * This center contains real downloads only; no previews or fake installations.
 * Never change financial records, user storage or auth sessions.
 */
(function(){
 'use strict';
 const script=document.currentScript;
 const base=new URL('../',script?.src||location.href);
 const installed=(document.querySelector('meta[name="gbplus-version"]')?.content||'0.0.0').trim();
 const numberParts=v=>String(v).split('.').slice(0,3).map(n=>Number(n)||0);
 const compare=(a,b)=>{const aa=numberParts(a),bb=numberParts(b);for(let i=0;i<3;i++){const d=(aa[i]||0)-(bb[i]||0);if(d)return d;}return 0;};
 const sIcon='<svg viewBox="0 0 24 24" aria-hidden="true" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m-5-5 5 5 5-5M5 18v3h14v-3"/></svg>';
 let registration=null,manifest=null,box=null,active=false,dirty=false;
 let dismissedVersion=null,downloadReady=false,checking=false,confirmRestart=false;
 const els={};
 function view(){
  if(box)return box;
  if(!document.body)return null;
  const node=document.createElement('aside');
  node.className='gb-update-notice';
  node.setAttribute('role','dialog');
  node.setAttribute('aria-modal','true');
  node.setAttribute('aria-label','Atualizações do GB+');
  node.hidden=true;
  node.innerHTML='<div class="gb-update-top"><span class="gb-update-symbol">'+sIcon+'</span>'+
   '<div class="gb-update-heading"><strong id="gbu-title">Atualização disponível</strong><small id="gbu-subtitle">Uma nova versão está pronta</small></div>'+
   '<button class="gb-update-close" type="button" aria-label="Fechar aviso de atualização" id="gbu-close">×</button></div>'+
   '<p id="gbu-description" class="gb-update-description"></p>'+
   '<ul id="gbu-notes" class="gb-update-notes"></ul>'+
   '<div id="gbu-progress" class="gb-update-progress" hidden><div class="gb-update-progress-track" role="progressbar" aria-label="Arquivos preparados" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="gbu-bar"><span id="gbu-fill"></span></div><div class="gb-update-progress-meta"><span id="gbu-phase">Preparando…</span><b id="gbu-percent">0%</b></div></div>'+
   '<p id="gbu-feedback" class="gb-update-feedback" role="status" aria-live="polite"></p>'+
   '<div class="gb-update-buttons"><button type="button" id="gbu-later" class="gb-update-secondary">Depois</button><button type="button" id="gbu-primary" class="gb-update-primary">Baixar atualização</button></div>';
  document.body.append(node);box=node;
  for(const id of ['title','subtitle','description','notes','progress','bar','fill','phase','percent','feedback','later','primary','close'])els[id]=node.querySelector('#gbu-'+id);
  els.close.addEventListener('click',dismiss);
  els.later.addEventListener('click',dismiss);
  els.primary.addEventListener('click',primaryClick);
  node.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&!active){event.preventDefault();dismiss();}
   if(event.key==='Tab'){
    const controls=[...node.querySelectorAll('button:not([hidden]):not([disabled])')];
    if(!controls.length)return;
    if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls[controls.length-1].focus();}
    else if(!event.shiftKey&&document.activeElement===controls[controls.length-1]){event.preventDefault();controls[0].focus();}
   }
  });
  return box;
 }
 function put(node,text){if(node)node.textContent=text;}
 function setProgress(value,label){
  const valueInt=Math.max(0,Math.min(100,Math.round(value)));
  els.progress.hidden=false;
  els.fill.style.width=valueInt+'%';els.bar.setAttribute('aria-valuenow',String(valueInt));
  put(els.percent,valueInt+'%');put(els.phase,label);
 }
 function show(title,subtitle,description){
  const el=view();if(!el)return;
  el.hidden=false;document.body.classList.add('gb-update-open');window.dispatchEvent(new Event('gbplus-update-open'));put(els.title,title);put(els.subtitle,subtitle);put(els.description,description);
  els.notes.replaceChildren();els.progress.hidden=true;put(els.feedback,'');
  els.later.hidden=false;els.later.disabled=false;els.close.disabled=false;els.primary.disabled=false;els.primary.hidden=false;
  requestAnimationFrame(()=>(els.primary.hidden?els.later:els.primary).focus({preventScroll:true}));
 }
 function dismiss(){
  if(active){put(els.feedback,'Conclua o download ou aguarde a operação terminar.');return;}
  if(box)box.hidden=true;document.body.classList.remove('gb-update-open');confirmRestart=false;
  if(manifest&&compare(manifest.version,installed)>0)dismissedVersion=manifest.version;
 }
 function notes(list){
  els.notes.replaceChildren();
  for(const item of (Array.isArray(list)?list:[]).slice(0,3)){
   if(typeof item!=='string')continue;
   const li=document.createElement('li');li.textContent=item.slice(0,140);els.notes.append(li);
  }
 }
 function available(info,force=false){
  if(active)return;
  if(!force&&dismissedVersion===info.version)return;
  manifest=info;downloadReady=false;
  const isMajor=Number(info.version.split('.')[0])>Number(installed.split('.')[0]);
  show(isMajor?'Grande atualização disponível':'Atualização disponível',
   'GB+ '+installed+' → '+info.version,
   isMajor?'Uma nova geração do GB+: configuração inicial guiada, barra personalizável e experiência móvel aprimorada. Baixe e escolha quando reiniciar.':'Uma versão nova foi publicada. Baixe os arquivos e depois escolha quando reiniciar.');
  notes(info.notes);
  els.primary.hidden=false;els.primary.dataset.next='download';
  put(els.later,'Depois');put(els.primary,'Baixar atualização');
 }
 function current(){
  if(active)return;
  downloadReady=false;
  show('Tudo atualizado','GB+ versão '+installed,'Você já está utilizando a versão mais recente publicada.');
  put(els.later,'Fechar');els.primary.hidden=true;els.primary.dataset.next='';
 }
 function trouble(message){
  if(!view())return;
  if(box.hidden)show('Não foi possível verificar','GB+ '+installed,'Confira sua conexão e tente novamente.');
  put(els.feedback,message);put(els.later,'Fechar');els.primary.hidden=false;els.primary.disabled=false;
  put(els.primary,'Tentar novamente');els.primary.dataset.next='retry';active=false;
 }
 const releaseURL=()=>new URL('./version.json?check='+Date.now(),base);
 // Independent public repository reference. A stale/offline service-worker cache
 // must never be accepted as proof that there is no newer version.
 const sourceURL=()=>new URL('https://raw.githubusercontent.com/gaveblue/gaveblue/main/gbplus/version.json?check='+Date.now());
 function validRelease(data){
  return !!data&&/^\d+\.\d+\.\d+$/.test(data.version)&&Array.isArray(data.assets)&&
   Number.isInteger(data.build)&&data.assets.length<=80&&data.assets.length>=1;
 }
 async function loadRelease(url,ms=8500){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  try{
   const response=await fetch(url,{cache:'no-store',signal:controller.signal});
   if(!response.ok)throw Error('Arquivo de versões indisponível ('+response.status+').');
   const data=await response.json();
   if(!validRelease(data))throw Error('O arquivo de versões recebido é inválido.');
   return data;
  }finally{clearTimeout(timer);}
 }
 function publicationPending(source,hosted=null){
  if(active)return;
  manifest=null;downloadReady=false;
  const hostedLabel=hosted?.version||'não confirmada';
  show('Atualização aguardando publicação',
   'GitHub '+source.version+' · site '+hostedLabel,
   'A nova versão já consta no repositório, mas o site ainda não a está entregando. Por segurança, o GB+ não vai instalar arquivos incompletos ou mostrar “Tudo atualizado”.');
  notes(['Sua conta, seus lançamentos e seus saldos não serão alterados.','É possível tentar renovar somente os arquivos antigos do aplicativo.']);
  put(els.later,'Fechar');put(els.primary,'Recuperar atualização');
  els.primary.hidden=false;els.primary.dataset.next='recover';
 }
 function unverified(){
  show('Versão não confirmada','GB+ '+installed,
   'Não consegui consultar a publicação do GitHub. O site informou esta versão, mas não posso garantir que seja a mais recente.');
  put(els.later,'Fechar');put(els.primary,'Tentar novamente');
  els.primary.hidden=false;els.primary.dataset.next='retry';
 }
 async function check(manual=false){
  if(checking||active)return;
  checking=true;
  try{
   if(!navigator.onLine)throw Error('Você está offline.');
   const results=await Promise.allSettled([
    loadRelease(releaseURL(),8500),
    loadRelease(sourceURL(),6500)
   ]);
   const hosted=results[0].status==='fulfilled'?results[0].value:null;
   const source=results[1].status==='fulfilled'?results[1].value:null;
   // Install only versions actually available on the GB+ host; a newer
   // GitHub-only build is not ready for the app downloader yet.
   if(hosted&&compare(hosted.version,installed)>0){available(hosted,manual);return;}
   // Check public source against hosted version before claiming "up to date".
   if(source&&(!hosted||compare(source.version,hosted.version)>0)){
    publicationPending(source,hosted);return;
   }
   if(!hosted)throw Error('Não foi possível obter a versão publicada no site.');
   if(manual){
    if(source)current();
    else unverified();
   }
  }catch(error){if(manual)trouble(error.message||'Verificação indisponível.');}
  finally{checking=false;}
 }
 function safeAsset(asset){
  if(typeof asset!=='string'||!asset.startsWith('./')||asset.includes('..')||asset.includes('?')||asset.includes('#'))throw Error('Arquivo de atualização inválido.');
  const url=new URL(asset,base);
  if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))throw Error('Arquivo fora do GB+.');
  return url;
 }
 async function download(){
  if(active||!manifest)return;
  active=true;downloadReady=false;
  els.primary.disabled=true;els.later.disabled=true;els.close.disabled=true;els.primary.dataset.next='';
  put(els.primary,'Baixando…');put(els.feedback,'Arquivos baixados de verdade, não apenas uma animação.');
  const assets=manifest.assets;
  const total=assets.length;
  let completed=0,failed=null;
  const cacheName='gb-plus-shell-v'+manifest.build;
  let cache=null;
  try{
   if(!navigator.onLine)throw Error('Sem conexão. Não é possível baixar esta atualização.');
   if('caches' in window)cache=await caches.open(cacheName);
   setProgress(0,'Baixando arquivos · 0 de '+total);
   // Real progress: a file counts only after fetching and caching (if available).
   let next=0;
   async function worker(){
    while(next<total){
     if(failed)return;
     const idx=next++;
     const url=safeAsset(assets[idx]);
     url.searchParams.set('gbplus_release',String(manifest.build));
     const abort=new AbortController();
     const timeout=setTimeout(()=>abort.abort(),15000);
     try{
      const response=await fetch(url,{cache:'no-store',signal:abort.signal});
      if(!response.ok)throw Error('Não foi possível baixar '+assets[idx]+' ('+response.status+').');
      if(cache)await cache.put(new Request(url),response.clone());
      // Consume response if not caching; a mere fetch() does not ensure body download.
      else await response.arrayBuffer();
      completed++;
      setProgress(completed/total*92,'Baixando arquivos · '+completed+' de '+total);
     }finally{clearTimeout(timeout);}
    }
   }
   // Bounded parallel fetches for Android, avoiding dozens of simultaneous requests.
   await Promise.all(Array.from({length:Math.min(3,total)},()=>worker().catch(error=>{failed=error;})));
   if(failed)throw failed;
   setProgress(95,'Preparando atualização do aplicativo…');
   if('serviceWorker' in navigator){
    registration=registration||await navigator.serviceWorker.getRegistration(base.pathname);
    if(!registration)registration=await navigator.serviceWorker.register(new URL('./sw.js',base),{updateViaCache:'none'});
    await registration.update();
   }
   setProgress(100,'Arquivos preparados com sucesso');
   downloadReady=true;
   put(els.title,'Pronto para instalar');
   put(els.subtitle,'GB+ '+manifest.version);
   put(els.description,'Os arquivos foram preparados. O GB+ será atualizado quando você escolher reiniciar.');
   put(els.feedback,cache?'Progresso medido pelos arquivos baixados.':'Os arquivos foram baixados; o armazenamento offline não está disponível neste navegador.');
   put(els.primary,'Instalar e reiniciar');els.primary.dataset.next='install';
   put(els.later,'Mais tarde');
  }catch(error){
   downloadReady=false;
   put(els.title,'Download interrompido');
   put(els.description,'A versão anterior permanece disponível. Você pode tentar novamente sem apagar seus registros.');
   put(els.feedback,error?.message||'Falha ao preparar a atualização.');
   put(els.primary,'Tentar download novamente');els.primary.dataset.next='download';
   put(els.later,'Depois');
  }finally{
   active=false;els.primary.disabled=false;els.primary.hidden=false;els.later.disabled=false;els.close.disabled=false;
  }
 }
 function apply(){
  if(!downloadReady||!manifest)return;
  if(document.body.classList.contains('saving')||document.querySelector('dialog[open]')){
   put(els.feedback,'Conclua e feche o lançamento ou formulário antes de reiniciar.');return;
  }
  if(dirty&&!confirmRestart){
   confirmRestart=true;
   put(els.title,'Confirme a reinicialização');
   put(els.description,'Houve alterações em campos nesta sessão. Se algum formulário ainda não foi salvo, ele poderá perder essas alterações ao reiniciar. Deseja continuar?');
   put(els.later,'Voltar');put(els.primary,'Reiniciar mesmo assim');
   els.primary.dataset.next='install';return;
  }
  put(els.title,'Instalando atualização…');
  put(els.description,'Reabrindo o GB+ com a nova versão. Seus dados financeiros serão preservados.');
  setProgress(100,'Instalando e reiniciando…');
  els.primary.disabled=true;els.later.disabled=true;els.close.disabled=true;
  // Explicit user click only. Preserve route and auth context, but bypass stale HTML caches.
  const destination=new URL(location.href);
  destination.searchParams.set('gbplus_release',String(manifest.build));
  location.assign(destination.href);
 }
 function primaryClick(){
  if(active)return;
  const next=els.primary.dataset.next;
  if(next==='close'){dismiss();return;}
  if(next==='install'){apply();return;}
  if(next==='retry'){check(true);return;}
  if(next==='recover'){location.assign(new URL('./recuperar.html',base).href);return;}
  download();
 }
 function start(){
  // Never block the initial finance application boot on update checks.
  if('serviceWorker' in navigator){
   navigator.serviceWorker.register(new URL('./sw.js',base),{updateViaCache:'none'}).then(reg=>{
    registration=reg;
    reg.update().catch(()=>{});
   }).catch(()=>{});
   navigator.serviceWorker.addEventListener('controllerchange',()=>{check(false);});
  }
  document.addEventListener('input',event=>{if(event.target.closest?.('#main,#modal'))dirty=true;},{passive:true});
  window.addEventListener('gbplus-check-updates',()=>check(true));
  // Only real version checks and verified asset downloads are supported.
  window.addEventListener('focus',()=>check(false));
  // Once on boot and infrequently after; no forced reload.
  setTimeout(()=>check(false),1800);
  setInterval(()=>check(false),15*60*1000);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
