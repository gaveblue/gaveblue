/* GB+ PWA install · real browser flow only. No simulated progress or installed state. */
const deferKey='gbplus-pwa-suggest-after-v1';
let installEvent=null;
let panel=null;
let installedByEvent=false;
let isShowingInstructions=false;
const windowHasPwa=()=>window.matchMedia('(display-mode: standalone)').matches||
 window.matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
export const isPwaInstalled=()=>installedByEvent||windowHasPwa();
export const isPhoneBrowser=()=>window.matchMedia('(max-width:760px) and (pointer:coarse)').matches;
function laterTimestamp(){try{return Number(localStorage.getItem(deferKey))||0;}catch{return 0;}}
function deferOffer(days=7){try{localStorage.setItem(deferKey,String(Date.now()+days*86400000));}catch{}}
function hide(){
 if(!panel)return;
 panel.remove();panel=null;isShowingInstructions=false;
}
function ios(){return /iPhone|iPad|iPod/i.test(navigator.userAgent||'')&&!window.MSStream;}
function instructionText(){
 if(ios())return 'No Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”. Confirme a adição para instalar o GB+.';
 if(/Android/i.test(navigator.userAgent||''))return 'No Chrome, abra o menu ⋮ e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”. Confirme a instalação nas opções do navegador.';
 return 'No menu do navegador, procure a opção “Instalar aplicativo” ou “Adicionar à tela inicial”. Essa etapa depende do navegador.';
}
function createOffer(){
 const overlay=document.createElement('div');overlay.className='gb-pwa-overlay';
 overlay.setAttribute('role','presentation');
 const dialog=document.createElement('section');dialog.className='gb-pwa-card';
 dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','gb-pwa-title');
 dialog.innerHTML='<button type="button" class="gb-pwa-close" data-pwa-close aria-label="Fechar convite">×</button>'+
  '<div class="gb-pwa-symbol" aria-hidden="true">GB<span>+</span></div>'+
  '<h2 id="gb-pwa-title">Leve o GB+ para seu celular</h2>'+
  '<p class="gb-pwa-description">Instale o aplicativo para abrir suas finanças direto da tela inicial, em uma experiência mais prática.</p>'+
  '<p class="gb-pwa-extra" hidden></p>'+
  '<div class="gb-pwa-actions"><button type="button" class="gb-pwa-later" data-pwa-later>Deixar para depois</button>'+
  '<button type="button" class="gb-pwa-install" data-pwa-install>Instalar agora</button></div>';
 overlay.append(dialog);
 overlay.addEventListener('click',event=>{if(event.target===overlay)later();});
 overlay.addEventListener('click',event=>{
  if(event.target.closest('[data-pwa-close],[data-pwa-later]')){later();return;}
  if(event.target.closest('[data-pwa-install]'))void installNow();
 });
 overlay.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();later();return;}
  if(event.key==='Tab'){
   const controls=[...dialog.querySelectorAll('button:not([disabled]):not([hidden])')];
   if(!controls.length)return;
   if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls.at(-1).focus();}
   else if(!event.shiftKey&&document.activeElement===controls.at(-1)){event.preventDefault();controls[0].focus();}
  }
 });
 document.body.append(overlay);
 panel=overlay;
 dialog.querySelector('[data-pwa-install]')?.focus({preventScroll:true});
 return dialog;
}
function later(){deferOffer(7);hide();}
function explainInstallation(){
 if(!panel)createOffer();
 const dialog=panel.querySelector('.gb-pwa-card');
 isShowingInstructions=true;
 dialog.querySelector('.gb-pwa-extra').hidden=false;
 dialog.querySelector('.gb-pwa-extra').textContent=instructionText();
 dialog.querySelector('[data-pwa-install]').hidden=true;
 dialog.querySelector('[data-pwa-later]').textContent='Entendi';
 dialog.querySelector('[data-pwa-later]').focus({preventScroll:true});
}
export async function installNow(){
 if(isPwaInstalled()){hide();return false;}
 if(!installEvent){explainInstallation();return false;}
 const event=installEvent;
 installEvent=null; // The browser prompt event can only be used once.
 hide();
 try{
  await event.prompt(); // Real, user-initiated installation prompt.
  const choice=await event.userChoice;
  if(choice?.outcome==='dismissed')deferOffer(1);
  // Accepted != installed. Only 'appinstalled' or standalone view proves it.
  return choice?.outcome==='accepted';
 }catch{
  explainInstallation();
  return false;
 }
}
export function maybeOfferPwaInstall(){
 if(!isPhoneBrowser()||isPwaInstalled()||panel)return false;
 if(document.body.classList.contains('auth-locked')||document.body.classList.contains('gb-update-open')||document.querySelector('#modal[open],#auth-modal[open]'))return false;
 if(Date.now()<laterTimestamp())return false;
 createOffer();return true;
}
export function showInstallHelp(){
 if(isPwaInstalled())return false;
 if(!panel)createOffer();
 if(!installEvent)explainInstallation();
 return true;
}
export function setupPwaInstallation(){
 window.addEventListener('gbplus-update-open',()=>hide());
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  installEvent=event;
  if(panel&&isShowingInstructions){
   const dialog=panel.querySelector('.gb-pwa-card');
   dialog.querySelector('.gb-pwa-extra').hidden=true;
   dialog.querySelector('[data-pwa-install]').hidden=false;
   dialog.querySelector('[data-pwa-later]').textContent='Deixar para depois';
   isShowingInstructions=false;
  }
 });
 window.addEventListener('appinstalled',()=>{
  installedByEvent=true;installEvent=null;hide();
  window.dispatchEvent(new Event('gbplus-installed'));
 });
}
