/* GB+ mobile installation page.
 * Installation is browser-controlled. Never fake app installation or claim store availability.
 * Returning users and desktop users keep the existing web application.
 */
(function(){
 'use strict';
 const seenKey='gbplus-install-intro-seen-v1';
 const intro=document.getElementById('install-welcome');
 const guide=document.getElementById('install-guide');
 const icon=document.getElementById('guide-icon');
 const title=document.getElementById('guide-title');
 const description=document.getElementById('guide-description');
 const steps=document.getElementById('guide-steps');
 const callout=document.getElementById('guide-callout');
 const status=document.getElementById('install-status');
 const landingStatus=document.getElementById('landing-install-status');
 const postInstallOverlay=document.getElementById('postinstall-overlay');
 const postInstallTitle=document.getElementById('postinstall-title');
 const postInstallDescription=document.getElementById('postinstall-description');
 const postInstallSpinner=document.getElementById('postinstall-spinner');
 const postInstallProgress=document.getElementById('postinstall-progress');
 const postInstallProgressFill=document.getElementById('postinstall-progress-fill');
 const postInstallStage=document.getElementById('postinstall-stage');
 const postInstallPercent=document.getElementById('postinstall-percent');
 const postInstallFootnote=document.getElementById('postinstall-footnote');
 const postInstallDone=document.getElementById('postinstall-done');
 const postInstallDismiss=document.getElementById('postinstall-dismiss');
 const openUrl=new URL('./?web=1',location.href).href;
 const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 let promptEvent=null;
 let installedByEvent=false;
 let activePlatform='';
 let preparationFrame=0;
 let preparationDone=false;
 const PREPARATION_DURATION_MS=10000;

 const appleIcon='<svg role="img" viewBox="0 0 24 24" fill="currentColor" aria-label="Apple"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>';
 const playIcon='<svg role="img" viewBox="0 0 24 24" fill="currentColor" aria-label="Android"><path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z"/></svg>';
 const content={
  iphone:{
   heading:'Instalar no iPhone',
   lead:'No iPhone, adicione o GB+ à Tela de Início pelo Safari.',
   icon:appleIcon,
   steps:[
    ['Abra no Safari','Acesse gaveblue.com.br/gbplus no Safari. Se estiver em outro navegador, abra esse endereço pelo Safari.'],
    ['Toque em Compartilhar','No Safari, toque no ícone Compartilhar, na barra de ferramentas.'],
    ['Adicione à Tela de Início','Escolha “Adicionar à Tela de Início”, marque “Abrir como App” se aparecer e confirme em “Adicionar”.']
   ],
   note:'Pronto! O ícone GB+ ficará na Tela de Início. Abra por ele para usar como aplicativo.'
  },
  android:{
   heading:'Instalar no Android',
   lead:'Se a instalação automática não aparecer, use a opção do navegador.',
   icon:playIcon,
   steps:[
    ['Abra no Google Chrome','Acesse gaveblue.com.br/gbplus no Chrome. Se estiver em um navegador interno, escolha abrir no Chrome.'],
    ['Toque no menu ⋮','Abra o menu de três pontos no canto superior direito do Chrome.'],
    ['Escolha Instalar','Toque em “Instalar aplicativo” ou “Adicionar à tela inicial” e confirme.']
   ],
   note:'Se o Chrome não oferecer a instalação direta, abra o menu ⋮ e procure “Instalar aplicativo”.'
  }
 };

 function markWebAccess(){
  try{
   localStorage.setItem(seenKey,'1');
   // Do not show a second installation pop-up right after returning to the app.
   localStorage.setItem('gbplus-pwa-suggest-after-v1',String(Date.now()+7*86400000));
  }catch{}
 }
 function platformFromLocation(){
  const mode=new URLSearchParams(location.search).get('plataforma');
  return mode==='iphone'||mode==='android'?mode:'';
 }
 function showScreen(platform){
  activePlatform=platform;
  const isGuide=!!content[platform];
  intro.hidden=isGuide;
  guide.hidden=!isGuide;
  if(!isGuide){document.title='Instalar GB+ · Gestão Financeira';window.scrollTo(0,0);return;}
  const info=content[platform];
  title.textContent=info.heading;
  description.textContent=info.lead;
  icon.innerHTML=info.icon;
  steps.replaceChildren();
  for(const [heading,detail]of info.steps){
   const li=document.createElement('li');
   const div=document.createElement('div');
   const strong=document.createElement('strong'),span=document.createElement('span');
   strong.textContent=heading;span.textContent=detail;
   div.append(strong,span);li.append(div);steps.append(li);
  }
  callout.textContent=info.note;callout.hidden=false;
  status.textContent='';
  document.title=info.heading+' · GB+';
  window.scrollTo(0,0);
 }
 function navigate(platform){
  const url=new URL(location.href);
  if(platform)url.searchParams.set('plataforma',platform);
  else url.searchParams.delete('plataforma');
  history.pushState({gbInstallGuide:!!platform},'',url.pathname+url.search);
  showScreen(platform);
 }
 // This 10-second bar represents our transition screen, not the Android
 // download/install progress. Actual installation success comes from appinstalled.
 function reflectInstallationResult(){
  if(!preparationDone)return;
  postInstallSpinner.classList.add('is-complete');
  postInstallDone.hidden=false;
  postInstallDismiss.hidden=false;
  postInstallProgress.setAttribute('aria-valuenow','100');
  postInstallProgressFill.style.width='100%';
  postInstallPercent.textContent='100%';
  if(installedByEvent){
   postInstallTitle.textContent='GB+ instalado!';
   postInstallDescription.textContent='Pronto! O GB+ foi adicionado ao seu dispositivo. Você já pode encontrá-lo na Tela de Início.';
   postInstallStage.textContent='Concluído';
   postInstallFootnote.textContent='Abra o aplicativo pelo ícone GB+.';
  }else{
   postInstallTitle.textContent='Instalação solicitada';
   postInstallDescription.textContent='A confirmação foi enviada ao Android. Se a instalação ainda estiver terminando, acompanhe a notificação do sistema.';
   postInstallStage.textContent='Preparação concluída';
   postInstallFootnote.textContent='O Android é responsável por concluir a instalação.';
  }
 }
 function showPostInstallPreparation(){
  if(!postInstallOverlay||!postInstallProgress)return;
  cancelAnimationFrame(preparationFrame);
  preparationDone=false;
  postInstallTitle.textContent='Preparando seu acesso';
  postInstallDescription.textContent='O Android recebeu sua confirmação. Estamos preparando a tela de conclusão.';
  postInstallStage.textContent='Preparando acesso…';
  postInstallFootnote.textContent='A instalação é realizada pelo Android.';
  postInstallSpinner.classList.remove('is-complete');
  postInstallDone.hidden=true;
  postInstallDismiss.hidden=true;
  postInstallProgressFill.style.width='0%';
  postInstallProgress.setAttribute('aria-valuenow','0');
  postInstallPercent.textContent='0%';
  postInstallOverlay.hidden=false;
  document.body.classList.add('postinstall-open');
  const start=performance.now();
  function tick(now){
   if(postInstallOverlay.hidden)return;
   const progress=Math.min(100,Math.round((now-start)/PREPARATION_DURATION_MS*100));
   postInstallProgressFill.style.width=progress+'%';
   postInstallProgress.setAttribute('aria-valuenow',String(progress));
   postInstallPercent.textContent=progress+'%';
   postInstallStage.textContent=progress<50?'Preparando acesso…':progress<100?'Quase pronto…':'Preparação concluída';
   if(progress<100)preparationFrame=requestAnimationFrame(tick);
   else{preparationFrame=0;preparationDone=true;reflectInstallationResult();}
  }
  preparationFrame=requestAnimationFrame(tick);
 }
 function closePostInstallPreparation(){
  cancelAnimationFrame(preparationFrame);
  preparationFrame=0;
  postInstallOverlay.hidden=true;
  document.body.classList.remove('postinstall-open');
 }
 postInstallDismiss?.addEventListener('click',closePostInstallPreparation);
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(preparationFrame);});
 async function installAndroid(){
  if(isStandalone()||installedByEvent){markWebAccess();location.assign(openUrl);return;}
  if(!promptEvent){navigate('android');return;}
  const event=promptEvent;
  promptEvent=null; // Chromium does not allow reusing install events.
  try{
   await event.prompt(); // Always called directly from a user's click.
   const choice=await event.userChoice;
   if(choice?.outcome==='accepted'){
    // Important order: the native Android confirmation happens FIRST.
    // Only then show our own 10-second transition; no fake download metrics.
    markWebAccess();
    landingStatus.textContent='';
    showPostInstallPreparation();
   }else{
    navigate('android');
    status.textContent='A instalação não foi concluída. Você pode tentar pelo menu do Chrome.';
   }
  }catch{
   navigate('android');
   status.textContent='Seu navegador não ofereceu a instalação direta. Siga as instruções abaixo.';
  }
 }
 document.querySelectorAll('[data-platform]').forEach(button=>button.addEventListener('click',()=>{
  if(button.dataset.platform==='android')void installAndroid();
  else navigate('iphone');
 }));
 document.querySelector('[data-back]')?.addEventListener('click',()=>{
  if(history.state?.gbInstallGuide)history.back();
  else navigate('');
 });
 window.addEventListener('popstate',()=>showScreen(platformFromLocation()));
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  promptEvent=event;
 });
 window.addEventListener('appinstalled',()=>{
  installedByEvent=true;
  promptEvent=null;
  markWebAccess();
  // appinstalled is the real signal of completion; keep the 10-second
  // presentation running if it has already started.
  if(postInstallOverlay?.hidden!==false)landingStatus.textContent='GB+ instalado! Abra pelo ícone na Tela de Início.';
  else reflectInstallationResult();
  if(activePlatform==='android')status.textContent='GB+ instalado! Agora você pode abrir pelo ícone na Tela de Início.';
 });
 document.querySelectorAll('[data-open-web]').forEach(link=>link.addEventListener('click',markWebAccess));
 // Register the existing lightweight, network-first GB+ service worker without
 // waiting for it. First-time Android visitors can then become PWA-installable.
 if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
   navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
  },{once:true});
 }
 if(isStandalone()){
  markWebAccess();
  location.replace(openUrl);
 }else{
  showScreen(platformFromLocation());
 }
})();
