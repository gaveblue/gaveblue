import {uid,today,money,dateLabel,cents,generateTitles,addPayment,transfer,updateTitle,pending,flow,within} from './domain.js';
import {KEY,INDICATORS,defaultPanel,parseBackup,backupText,MOBILE_SHORTCUTS,defaultMobileNav,effectiveMobileNav,validMobileNav,shouldOfferSetup} from './store.js?v=20261104-38';
import {esc,icon,button,field,select,formFooter,download,csv,titleTable} from './ui.js?v=20261104-38';
import {routes,dashboard,titlesView,partnersView,accountsView,categoriesView,flowView,reportsView,settingsView,notificationsView,filteredTitles,reportData} from './views.js?v=20261104-38';
import {titleForm,partnerForm,accountForm,categoryForm,paymentForm,transferForm,titleDetail,customizeForm,accountDetail} from './forms.js?v=20261104-40';
import {toggleEntryMenu,chooseEntryOption,syncEntrySelect,closeEntryMenus} from './entry-select.js?v=20261104-40';
import {installGbControls,enhanceGbControls} from './custom-controls.js?v=20261104-40';
import {setupPwaInstallation,maybeOfferPwaInstall,showInstallHelp,isPwaInstalled} from './pwa-install.js?v=20261104-40';
import {SupabaseRepository} from '../integrations/supabase/repository.js';
import {initializeAuth,authClient,currentUser,showAuth,isRecovery,updatePersonalProfile,consumeAuthReturnMessage} from './auth.js?v=20261104-32';
import {profileView,validateProfile,validCPF,formatCPF} from './profile.js?v=20261104-37';
import {firstSetupView,customMobileNavForm,shortcutsPreview,readMobileNav} from './setup-ui.js?v=20261104-35';
import {launchesView} from './launches-view.js?v=20261104-38';
import {installLaunchGestures} from './launches-gestures.js?v=20261104-38';
import {launchSelection,paymentSelection,paymentSummary,applyLaunchPayments,reversedSelection,applyLaunchReversals,deletionSelection,applyLaunchDeletions} from './launch-actions.js?v=20261104-38';
let repository=null;let db;let busy=false;let pendingGeneration=null;let confirmAction=null;let pwaReady=false;
const isInstalledApp=isPwaInstalled;
setupPwaInstallation();
installGbControls();
const inviteLink='https://gaveblue.com.br/gbplus/';
let profileCpfStatus={userId:null,cpf:'',ready:false,loading:false,error:''};
const state={route:'dashboard',period:'all',range:{},query:'',status:'',type:'',partner:'',category:'',partnerQuery:'',granularity:'month',report:'payable',reportPartner:'',moreFilters:false,launchSelected:[],launchStatusOpen:false,launchSearchOpen:false};
const modal=document.querySelector('#modal');
// Desktop-only sidebar preference; changing it never touches the finance database.
const sidebarPreferenceKey='gbplus-sidebar-hidden-v1';
function syncSidebarVisibility(hidden,save=false){
 const collapsed=!!hidden;
 document.documentElement.classList.toggle('sidebar-hidden',collapsed);
 const button=document.querySelector('#sidebar-toggle');
 if(button){
  button.setAttribute('aria-expanded',String(!collapsed));
  button.setAttribute('aria-label',collapsed?'Mostrar menu lateral':'Ocultar menu lateral');
  button.setAttribute('title',collapsed?'Mostrar menu lateral':'Ocultar menu lateral');
 }
 if(save)try{localStorage.setItem(sidebarPreferenceKey,collapsed?'1':'0');}catch{}
}
try{syncSidebarVisibility(localStorage.getItem(sidebarPreferenceKey)==='1');}
catch{syncSidebarVisibility(false);}
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),4500);}
function openModal(title,content){modal.classList.toggle("gb-entry-modal",content.includes('id="title-form"'));document.querySelector('#modal-content').innerHTML=`<div class="modal-heading"><h2 id="modal-title">${title}</h2><button class="icon-button" data-action="close" aria-label="Fechar">${icon('close')}</button></div><div class="modal-body">${content}</div>`;modal.setAttribute('aria-labelledby','modal-title');if(!modal.open)modal.showModal();enhanceGbControls(modal);}
function closeModal(){if(modal.open)modal.close();pendingGeneration=null;confirmAction=null;if(pwaReady)setTimeout(()=>maybeOfferPwaInstall(),1100);}
function confirm(title,message,callback){confirmAction=callback;openModal(title,`<p class="confirm-message">${esc(message)}</p><div class="form-error" role="alert"></div><div class="form-footer">${button('Cancelar','close')}${button('Confirmar','confirm','primary')}</div>`);}
// Guided onboarding is opt-in. No financial records are created before final confirmation.
let setupDraft=null;
function startSetupWizard(){
 if(!db)return;
 setupDraft={step:'welcome',history:[],createAccount:false,name:'',bank:'',branch:'',number:'',initial:0,theme:db.settings.theme};
 showSetupWizard();
}
function showSetupWizard(){
 if(!setupDraft)return;
 openModal('Configuração inicial do GB+',firstSetupView(setupDraft));
}
function nextSetupStep(step){
 if(!setupDraft)return;
 setupDraft.history.push(setupDraft.step);
 setupDraft.step=step;
 showSetupWizard();
}
function updateMobileNavPreview(form){
 if(!form||form.id!=='mobile-nav-form')return;
 const current=readMobileNav(form),preview=form.querySelector('#mobile-nav-preview');
 if(preview)preview.innerHTML=shortcutsPreview(current);
 const message=form.querySelector('.form-error');
 if(message)message.textContent=validMobileNav(current)?'':'Selecione três atalhos diferentes, sem repetições.';
}
function renderMobileShortcut(key){
 if(key==='menu')return ['menu','Mais','more'];
 const item=MOBILE_SHORTCUTS.find(([id])=>id===key);
 return item||['titles','Lançamentos','transfer'];
}
function rangeFor(period){const now=today();const [y,m]=now.split('-').map(Number);const date=(y,m,d)=>`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;if(period==='all')return {from:'',to:''};if(period==='year')return {from:`${y}-01-01`,to:`${y}-12-31`};const dt=new Date(y,m-1-(period==='last'?1:0),1);const yy=dt.getFullYear(),mm=dt.getMonth()+1;return {from:date(yy,mm,1),to:date(yy,mm,new Date(yy,mm,0).getDate())};}
async function commit(mutator,message='Salvo com sucesso.'){if(!db)throw Error('Entre ou abra o modo local antes de continuar.');if(busy)throw Error('Aguarde a gravação atual.');busy=true;document.body.classList.add('saving');try{const draft=structuredClone(db);await mutator(draft);db=await repository.save(draft);state.launchSelected=[];closeModal();render();toast(message);}finally{busy=false;document.body.classList.remove('saving');}}
function updateSystemAppearance(theme){
 const selected=theme==='dark'?'dark':'light',color=selected==='dark'?'#111214':'#f6f6f8';
 document.documentElement.dataset.theme=selected;
 document.documentElement.style.colorScheme=selected;
 document.documentElement.style.backgroundColor=color;
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',color);
 try{localStorage.setItem('gbplus-appearance-v1',selected);}catch{}
}
function render(){if(!db)return;updateSystemAppearance(db.settings.theme);document.querySelector('#navigation').innerHTML=routes.map(([key,label,ico])=>`<a href="#${key}" class="nav-item ${state.route===key?'active':''}" ${state.route===key?'aria-current="page"':''}>${icon(ico)}<span>${label}</span></a>`).join('');document.querySelector('#breadcrumb').textContent=state.route==='profile'?'Minha conta':routes.find(r=>r[0]===state.route)?.[1]||'Visão geral';document.querySelector('.theme-button').innerHTML=`${icon(db.settings.theme==='light'?'moon':'sun')}<span>Modo ${db.settings.theme==='light'?'escuro':'claro'}</span><span class="theme-switch"></span>`;document.querySelector('[data-action="search"]').innerHTML=icon('search');const notificationBell=document.querySelector('[data-action="notifications"]');const dueNotifications=db.titles.filter(t=>!t.cancelled&&pending(db,t)>0&&t.due<=today()).length;notificationBell.innerHTML=icon('bell')+(dueNotifications?'<span class="notification-dot" aria-hidden="true"></span>':'');notificationBell.setAttribute('aria-label','Notificações'+(dueNotifications?' · '+dueNotifications+' títulos vencidos ou vencendo hoje':''));const topTheme=document.querySelector('[data-action="top-theme"]');if(topTheme){const dark=db.settings.theme==='dark';topTheme.innerHTML=icon(dark?'sun':'moon');topTheme.setAttribute('aria-label',dark?'Ativar modo claro':'Ativar modo escuro');topTheme.title=dark?'Ativar modo claro':'Ativar modo escuro';topTheme.setAttribute('aria-pressed',String(dark));}document.querySelector('#mobile-navigation').innerHTML=(()=>{
 const custom=effectiveMobileNav(db.settings);
 const slots=[['dashboard','Início','home'],renderMobileShortcut(custom[0]),['new','Novo','plus'],renderMobileShortcut(custom[1]),renderMobileShortcut(custom[2])];
 return slots.map(([key,label,ico])=>key==='new'||key==='menu'?`<button type="button" data-action="${key==='new'?'new-title':'mobile-menu'}" class="${key==='new'?'mobile-new':''}" aria-label="${label}">${icon(ico)}<span>${label}</span></button>`:`<a href="#${key}" class="${state.route===key?'active':''}" ${state.route===key?'aria-current="page"':''}>${icon(ico)}<span>${label}</span></a>`).join('');
})();const views={dashboard:()=>dashboard(db,state,!!currentUser(),currentUser()),titles:()=>launchesView(db,state),payable:()=>titlesView(db,state),receivable:()=>titlesView(db,state),partners:()=>partnersView(db,state),accounts:()=>accountsView(db),categories:()=>categoriesView(db),flow:()=>flowView(db,state),provisions:()=>flowView(db,state),reports:()=>reportsView(db,state),settings:()=>settingsView(db,!isInstalledApp(),!!currentUser(),currentUser(),isInstalledApp()),notifications:()=>notificationsView(db),profile:()=>profileView(currentUser(),profileCpfStatus.userId===currentUser()?.id?profileCpfStatus:{ready:false,cpf:'',error:''})};document.body.classList.toggle('gb-settings-page',state.route==='settings');document.querySelector('#main').innerHTML=(views[state.route]||views.dashboard)();if(state.route==='profile'){initializeProfileDirtyState();if(!profileCpfStatus.ready&&!profileCpfStatus.loading&&!profileCpfStatus.error)void loadRegisteredCpf();}updateConnection();if(state.route==='dashboard')applyPanel();}

function filterSettings(value){
 const search=String(value||'').trim().toLocaleLowerCase('pt-BR');
 let matches=0;
 document.querySelectorAll('.gb-cfg-group').forEach(group=>{
  let groupMatches=0;
  group.querySelectorAll('.gb-cfg-row').forEach(row=>{
   const show=!search||row.dataset.settingsKeywords.toLocaleLowerCase('pt-BR').includes(search);
   row.hidden=!show;if(show){groupMatches++;matches++;}
  });
  group.hidden=groupMatches===0;
 });
 const profile=document.querySelector('.gb-cfg-profile');
 if(profile){const name=profile.textContent.toLocaleLowerCase('pt-BR');profile.hidden=!!search&&!('perfil minha conta dados segurança '+name).includes(search);}
 const remove=document.querySelector('.gb-cfg-delete');
 if(remove){remove.hidden=!!search&&!remove.dataset.settingsKeywords.includes(search);if(!remove.hidden)matches++;}
 const empty=document.querySelector('#gb-cfg-no-results');if(empty)empty.hidden=matches>0||(profile&&!profile.hidden);
}
async function loadRegisteredCpf(force=false){
 const id=currentUser()?.id;
 if(!id)return;
 if(profileCpfStatus.userId!==id)profileCpfStatus={userId:id,cpf:'',ready:false,loading:false,error:''};
 if(profileCpfStatus.loading||(!force&&(profileCpfStatus.ready||profileCpfStatus.error)))return;
 profileCpfStatus.loading=true;profileCpfStatus.error='';
 try{
  const {data,error}=await authClient().from('gbplus_profiles').select('cpf').eq('user_id',id).maybeSingle();
  if(error)throw error;
  if(currentUser()?.id!==id)return;
  profileCpfStatus.cpf=data?.cpf||'';
  profileCpfStatus.ready=true;
 }catch(error){
  if(currentUser()?.id!==id)return;
  profileCpfStatus.ready=false;profileCpfStatus.error='Não foi possível validar o CPF cadastrado. Confira a conexão e tente novamente.';
 }finally{
  if(profileCpfStatus.userId===id)profileCpfStatus.loading=false;
  if(currentUser()?.id===id&&state.route==='profile')render();
 }
}
function profileCpfFeedback(form){
 const el=form.querySelector('[name="cpf"]'),output=form.querySelector('#gb-cpf-validation');
 if(!el||!output)return;
 const digits=el.value.replace(/\D/g,'');
 const valid=digits.length===11&&validCPF(digits);
 output.textContent=digits.length===0?'':valid?'CPF válido. Ele ficará bloqueado após salvar.':digits.length<11?'Informe os 11 dígitos do CPF.':'CPF inválido. Confira os dígitos.';
 output.dataset.invalid=String(digits.length>0&&!valid);
}
function profileSnapshot(form){
 return JSON.stringify([...new FormData(form)].map(([key,value])=>[key,String(value)]));
}
function syncProfileSaveState(form){
 if(!form||form.id!=='profile-form')return;
 const submit=form.querySelector('#profile-save');
 if(submit)submit.disabled=form.dataset.saving==='true'||form.dataset.initialSnapshot===profileSnapshot(form);
}
function initializeProfileDirtyState(){
 const form=document.getElementById('profile-form');
 if(!form)return;
 form.dataset.initialSnapshot=profileSnapshot(form);
 syncProfileSaveState(form);
}
function applyPanel(){const device=matchMedia('(max-width: 760px)').matches?'mobile':'desktop';document.querySelectorAll('[data-indicator]').forEach(el=>{el.hidden=!db.settings.panel[device][el.dataset.indicator];});document.querySelectorAll('.dashboard-middle,.results-grid,.stats-grid').forEach(el=>el.hidden=![...el.children].some(x=>!x.hidden));}
function route(){if(!db)return;const next=location.hash.slice(1);if(next==='main'&&document.querySelector('#main').childElementCount)return;const previous=state.route;state.route=next==='profile'||routes.some(r=>r[0]===next)?next:'dashboard';if(previous!==state.route){state.launchSelected=[];state.launchStatusOpen=false;}state.type=state.route==='payable'?'expense':state.route==='receivable'?'income':'';closeModal();render();window.scrollTo(0,0);}
function formValues(form){return Object.fromEntries(new FormData(form));}
function getTitle(id){const t=db.titles.find(t=>t.id===id);if(!t)throw Error('Título não encontrado.');return t;}
function fail(error){if(currentUser()&&['SESSION','CONFLICT','SAVE','RELOAD'].includes(error.code)){document.querySelector('#sync-alert').hidden=false;}const area=modal.open?modal.querySelector('.form-error'):null;if(area){area.textContent=error.message;area.scrollIntoView({block:'nearest'});}else toast(error.message||'Não foi possível concluir a operação.');}
function launchSelectedIds(){
 const visible=new Set(filteredTitles(db,state).map(t=>t.id));
 return state.launchSelected.filter(id=>visible.has(id));
}
function toggleLaunchSelection(id,longPress=false){
 if(state.route!=='titles'||!filteredTitles(db,state).some(t=>t.id===id))return;
 const next=new Set(launchSelectedIds());
 if(longPress)next.add(id);
 else if(next.has(id))next.delete(id);
 else next.add(id);
 state.launchSelected=[...next];state.launchStatusOpen=false;render();
}
function startLaunchPayment(ids){
 const selected=paymentSelection(db,ids);
 if(selected.length===1){openModal('Registrar baixa',paymentForm(db,selected[0]));return;}
 const totals=paymentSummary(db,ids);
 const accounts=db.accounts.filter(a=>a.active);
 if(!accounts.length){openModal('Baixar lançamentos','<p>Cadastre uma conta financeira ativa antes de registrar baixas.</p>'+button('Cadastrar conta','new-account','primary'));return;}
 const assigned=[...new Set(selected.map(t=>t.accountId).filter(Boolean))];
 const suggested=assigned.length===1&&accounts.some(a=>a.id===assigned[0])?assigned[0]:accounts.length===1?accounts[0].id:'';
 openModal('Baixar '+selected.length+' lançamentos',
  '<p class="muted">Cada lançamento será baixado pelo saldo pendente. Receitas e despesas são registradas separadamente.</p>'+
  '<div class="detail-summary" style="margin:16px 0"><span>'+selected.length+' lançamentos</span><strong>'+money(totals.income+totals.expense)+'</strong><small>'+
  money(totals.income)+' a receber · '+money(totals.expense)+' a pagar</small></div>'+
  '<form id="launch-bulk-pay-form" data-ids="'+ids.join(',')+'"><div class="form-grid">'+
  field('Data da baixa','date',today(),'date','required max="'+today()+'"')+
  select('Conta utilizada','accountId',[['','Selecione uma conta'],...accounts.map(a=>[a.id,a.name])],suggested,'required')+
  '</div>'+formFooter('Revisar baixas')+'</form>');
}
function requestLaunchReversal(ids){
 const {titles,payments,total}=reversedSelection(db,ids);
 confirm('Estornar '+payments.length+' baixa(s)?',
  'Serão estornadas '+payments.length+' baixas de '+titles.length+' lançamento(s), totalizando '+money(total)+'. Os saldos serão recalculados. Continuar?',
  ()=>commit(d=>applyLaunchReversals(d,ids),payments.length+' baixa(s) estornada(s).'));
}
function requestLaunchDeletion(ids){
 const selected=deletionSelection(db,ids);
 confirm('Excluir '+selected.length+' lançamento(s)?',
  'Os '+selected.length+' lançamento(s) selecionados serão removidos. Registros já baixados precisam ser estornados antes. Confirmar exclusão?',
  ()=>commit(d=>applyLaunchDeletions(d,ids),selected.length+' lançamento(s) excluído(s).'));
}
const actions={
  close:closeModal,
  'toggle-sidebar':()=>syncSidebarVisibility(!document.documentElement.classList.contains('sidebar-hidden'),true),
  confirm:async()=>{const fn=confirmAction;if(fn&&!busy){confirmAction=null;try{await fn();}catch(e){confirmAction=fn;throw e;}}},
  theme:()=>commit(d=>{d.settings.theme=d.settings.theme==='light'?'dark':'light';},'Tema atualizado.'),
  'top-theme':()=>commit(d=>{d.settings.theme=d.settings.theme==='light'?'dark':'light';},'Tema atualizado.'),
  'check-updates':()=>{closeModal();window.dispatchEvent(new Event('gbplus-check-updates'));},
  'select-launch':el=>toggleLaunchSelection(el.dataset.id),
  'launch-clear':()=>{state.launchSelected=[];render();},
  'launch-detail':()=>{
   const ids=launchSelectedIds();
   if(ids.length!==1)throw Error('Selecione um lançamento para visualizar.');
   openModal('Detalhes do lançamento',titleDetail(db,getTitle(ids[0])));
  },
  'launch-edit':()=>{
   const ids=launchSelectedIds();
   if(ids.length!==1)throw Error('A edição é individual. Selecione apenas um lançamento.');
   openModal('Editar lançamento',titleForm(db,getTitle(ids[0])));
  },
  'launch-pay':()=>startLaunchPayment(launchSelectedIds()),
  'launch-reverse':()=>requestLaunchReversal(launchSelectedIds()),
  'launch-delete':()=>requestLaunchDeletion(launchSelectedIds()),
  'launch-status':()=>{state.launchStatusOpen=!state.launchStatusOpen;render();},
  'launch-filter':el=>{
   const key=el.dataset.value;
   if(!['all','open','settled','income','expense'].includes(key))return;
   state.type=key==='income'?'income':key==='expense'?'expense':'';
   state.status=key==='open'?'open':key==='settled'?'settled':'';
   state.launchSelected=[];state.launchStatusOpen=false;render();
  },
  'launch-search':()=>{
   const wasOpen=!!state.launchSearchOpen||!!state.query||!!state.moreFilters;
   state.launchSearchOpen=!wasOpen;
   if(wasOpen){state.query='';state.moreFilters=false;}
   state.launchSelected=[];state.launchStatusOpen=false;render();
   if(!wasOpen)document.getElementById('title-search')?.focus();
  },
  'toggle-title-filters':()=>{state.moreFilters=!state.moreFilters;state.launchSelected=[];render();},
  'clear-title-filters':()=>{state.query='';state.status='';state.partner='';state.category='';state.type=state.route==='payable'?'expense':state.route==='receivable'?'income':'';state.period='all';state.range=rangeFor('all');state.moreFilters=false;state.launchSelected=[];state.launchStatusOpen=false;render();},
  'set-theme':el=>commit(d=>{d.settings.theme=el.dataset.value;},'Tema atualizado.'),
  'entry-toggle':el=>toggleEntryMenu(el),
  'entry-option':el=>chooseEntryOption(el),
  'new-title':()=>openModal('Novo lançamento',titleForm(db,null,state.type||'expense')),
  'edit-title':el=>openModal('Editar lançamento',titleForm(db,getTitle(el.dataset.id))),
  'title-detail':el=>openModal('Detalhes do título',titleDetail(db,getTitle(el.dataset.id))),
  payment:el=>openModal('Registrar baixa',paymentForm(db,getTitle(el.dataset.id))),
  'new-partner':()=>openModal('Novo parceiro',partnerForm()),
  'edit-partner':el=>openModal('Editar parceiro',partnerForm(db.partners.find(p=>p.id===el.dataset.id))),
  'partner-detail':el=>{const p=db.partners.find(p=>p.id===el.dataset.id);openModal('Histórico do parceiro',`<h3>${esc(p.name)}</h3><p class="muted">${esc(p.document||'')} ${esc(p.email||'')}</p><p>${esc(p.address||'')}</p><p>${esc(p.notes||'')}</p>${titleTable(db,db.titles.filter(t=>t.partnerId===p.id))}`);},
  'new-account':()=>openModal('Nova conta financeira',accountForm()),
  'edit-account':el=>openModal('Editar conta',accountForm(db.accounts.find(a=>a.id===el.dataset.id))),
  'account-detail':el=>openModal('Movimentações da conta',accountDetail(db,db.accounts.find(a=>a.id===el.dataset.id))),
  'new-category':()=>openModal('Nova categoria',categoryForm()),
  'edit-category':el=>openModal('Editar categoria',categoryForm(db.categories.find(c=>c.id===el.dataset.id))),
  'new-transfer':()=>openModal('Transferir entre contas',transferForm(db)),

  'settings-search':el=>{
    const search=document.querySelector('#gb-cfg-search'),input=document.querySelector('#settings-search-input');
    if(!search||!input)return;
    const opening=search.hidden;search.hidden=!opening;el.setAttribute('aria-expanded',String(opening));
    if(opening)input.focus();else{input.value='';filterSettings('');}
  },
  'settings-appearance':()=>openModal('Aparência',
    '<p class="muted">Escolha como deseja visualizar seu financeiro. A preferência é aplicada ao GB+ inteiro.</p>'+
    '<div class="segmented" style="margin-top:18px">'+
    ['light','dark'].map(t=>button(icon(t==='light'?'sun':'moon')+(t==='light'?'Modo claro':'Modo escuro'),'set-theme',db.settings.theme===t?'primary':'','data-value="'+t+'"')).join('')+
    '</div>'),
  'settings-backup':()=>openModal('Backup e restauração',
    '<p class="muted">Exporte uma cópia dos seus registros financeiros. A restauração substitui os registros atuais e exige confirmação antes de salvar.</p>'+
    '<div class="button-stack" style="margin-top:20px">'+
    button(icon('download')+' Exportar backup JSON','backup','primary')+
    button(icon('upload')+' Restaurar backup','restore')+'</div>'),
  'settings-data':()=>openModal('Dados da conta',
    '<p class="muted">'+(currentUser()?'Seus registros financeiros são protegidos pelo login conectado e sincronizados quando há conexão.':'Seus registros são armazenados neste navegador.')+'</p>'+
    '<p style="margin-top:16px"><strong>'+db.titles.length+'</strong> lançamento(s) cadastrados · <strong>'+db.accounts.length+'</strong> conta(s) financeira(s).</p>'+
    '<div class="button-stack" style="margin-top:22px">'+button(icon('refresh')+' Atualizar dados online','refresh-settings',currentUser()?'primary':'',currentUser()?'':'disabled')+button(icon('download')+' Exportar backup','backup')+'</div>'+
    '<p class="form-hint" style="margin-top:16px">Seus registros financeiros não são apagados ao sair do aplicativo.</p>'),
  'refresh-settings':()=>{closeModal();window.dispatchEvent(new Event('gbplus-refresh'));},
  'settings-updates':()=>openModal('Atualizações do GB+',
    '<p class="muted">Versão instalada: <strong>GB+ '+esc(document.querySelector('meta[name="gbplus-version"]')?.content||'')+'</strong>. Confira se há uma versão nova para baixar e instalar.</p>'+
    '<div class="button-stack" style="margin-top:20px">'+button(icon('refresh')+' Verificar atualizações','check-updates','primary')+'</div>'),
  'invite-friend':()=>openModal('Convidar um amigo',
    '<p>Compartilhe o GB+ com alguém que queira organizar melhor suas finanças.</p>'+
    '<label class="field" style="margin-top:18px">Link de convite<input id="gb-invite-link" type="url" value="'+esc(inviteLink)+'" readonly aria-label="Link do GB+"></label>'+
    '<div class="button-stack" style="margin-top:20px">'+button(icon('copy')+' Copiar link','copy-invite','primary')+
    (typeof navigator.share==='function'?button(icon('share')+' Compartilhar','share-invite'):'')+'</div>'),
  'copy-invite':async()=>{
    const field=document.querySelector('#gb-invite-link');
    try{
      if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(inviteLink);
      else if(field){field.focus();field.select();if(!document.execCommand?.('copy'))throw Error('COPY_UNAVAILABLE');}
      else throw Error('COPY_UNAVAILABLE');
      toast('Link de convite copiado!');
    }catch{field?.focus();field?.select();toast('Selecione e copie o link de convite acima.');}
  },
  'share-invite':async()=>{
    if(typeof navigator.share!=='function')return actions['copy-invite']();
    try{await navigator.share({title:'GB+ · Gestão Financeira',text:'Conheça o GB+ e organize suas finanças:',url:inviteLink});}
    catch(e){if(e?.name!=='AbortError')toast('Não foi possível compartilhar. Use Copiar link.');}
  },
  'retry-profile-cpf':()=>{profileCpfStatus.ready=false;profileCpfStatus.error='';void loadRegisteredCpf(true);},
  'profile-change-password':()=>{
    const email=currentUser()?.email;
    if(!email)throw Error('Não foi possível identificar seu e-mail de acesso.');
    confirm('Alterar senha','Vamos enviar um link de redefinição de senha para o e-mail da sua conta. Deseja continuar?',async()=>{
      if(!navigator.onLine)throw Error('Conecte-se à internet para solicitar a alteração de senha.');
      const response=await authClient().auth.resetPasswordForEmail(email,{redirectTo:new URL('./',document.baseURI).href});
      if(response.error)throw Error('Não foi possível enviar o e-mail. Tente novamente em instantes.');
      closeModal();toast('Se o e-mail estiver cadastrado, você receberá um link para alterar sua senha.');
    });
  },
  'settings-help':()=>openModal('Ajuda e suporte',
    '<p>Precisa de ajuda com o GB+? Descreva sua dúvida, informe a versão do aplicativo e, se necessário, anexe uma captura da tela. Nunca envie senhas ou códigos de acesso.</p>'+
    '<p style="margin-top:16px"><a class="button primary" href="mailto:contato@gaveblue.com.br?subject=Suporte%20GB%2B">'+icon('arrow')+' Entrar em contato</a></p>'+
    '<p style="margin-top:18px"><a href="./privacidade.html" class="button">Política de Privacidade</a></p>'),
  'settings-about':()=>openModal('Sobre o GB+',
    '<p><strong>GB+ · Gestão Financeira</strong></p>'+
    '<p class="muted" style="margin-top:10px">Versão '+esc(document.querySelector('meta[name="gbplus-version"]')?.content||'')+'. Um aplicativo para organizar seu financeiro.</p>'+
    '<p style="margin-top:18px"><a href="./privacidade.html" class="button">Política de Privacidade</a></p>'),
  'settings-delete':()=>openModal('Excluir conta',
    '<p><strong>Esta ação pode remover permanentemente seu acesso e seus dados financeiros.</strong></p>'+
    '<p style="margin-top:12px" class="muted">A exclusão automática ainda não está disponível nesta versão. Para proteger sua conta, a solicitação é atendida após confirmação de titularidade. Nada será excluído ao abrir esta opção.</p>'+
    '<div class="button-stack" style="margin-top:20px">'+
    button(icon('download')+' Fazer backup antes','backup')+
    '<a class="button danger" href="mailto:contato@gaveblue.com.br?subject=Solicita%C3%A7%C3%A3o%20de%20exclus%C3%A3o%20da%20conta%20GB%2B">Solicitar exclusão de conta</a></div>'),
  customize:()=>openModal('Personalizar painel',customizeForm(db)),
  'customize-mobile-nav':()=>openModal('Personalizar barra de ações',customMobileNavForm(db)),
  'reset-mobile-nav':()=>{
   const form=modal.querySelector('#mobile-nav-form');
   if(!form)return;
   defaultMobileNav().forEach((value,i)=>{form.elements.namedItem('slot'+i).value=value;});
   updateMobileNavPreview(form);
  },
  'restart-setup':startSetupWizard,
  'setup-begin':()=>nextSetupStep('account-choice'),
  'setup-account-yes':()=>{if(!setupDraft)return;setupDraft.createAccount=true;nextSetupStep('account-details');},
  'setup-account-no':()=>{if(!setupDraft)return;setupDraft.createAccount=false;setupDraft.initial=0;nextSetupStep('preferences');},
  'setup-balance-yes':()=>nextSetupStep('balance-details'),
  'setup-balance-no':()=>{if(!setupDraft)return;setupDraft.initial=0;nextSetupStep('preferences');},
  'setup-back':()=>{if(!setupDraft)return;setupDraft.step=setupDraft.history.pop()||'welcome';showSetupWizard();},
  'setup-later':async()=>{
   if(!setupDraft)return;
   await commit(d=>{d.settings.setupCompleted=true;},'Configuração inicial adiada. Você pode reabri-la em Configurações.');
   setupDraft=null;
  },
  'setup-finish':async()=>{
   if(!setupDraft||busy)return;
   const draft=structuredClone(setupDraft);
   if(!['dark','light'].includes(draft.theme))throw Error('Revise a preferência de aparência.');
   if(draft.createAccount&&(!draft.name.trim()||draft.name.length>120))throw Error('Informe um nome válido para a conta.');
   if(!Number.isSafeInteger(draft.initial)||Math.abs(draft.initial)>1e12)throw Error('Saldo inicial inválido.');
   await commit(d=>{
    if(draft.createAccount){
     if(d.accounts.some(a=>a.name.trim().toLocaleLowerCase('pt-BR')===draft.name.trim().toLocaleLowerCase('pt-BR')))throw Error('Já existe uma conta com esse nome. Escolha outro para evitar duplicidade.');
     d.accounts.push({id:uid(),name:draft.name.trim(),bank:draft.bank.trim(),branch:draft.branch.trim(),number:draft.number.trim(),initial:draft.initial,active:true});
    }
    d.settings.theme=draft.theme;
    d.settings.setupCompleted=true;
   },'Configuração inicial concluída. Seu GB+ está pronto!');
   setupDraft=null;
  },
  'reset-panel':()=>{modal.querySelectorAll('input[type="checkbox"]').forEach(el=>el.checked=true);},
  'delete-title':el=>{const t=getTitle(el.dataset.id);if(db.payments.some(p=>p.titleId===t.id))throw Error('Estorne as baixas antes de excluir este título.');confirm('Excluir título?',`O lançamento “${t.description}” será removido. Os outros títulos da série serão mantidos.`,()=>commit(d=>{d.titles=d.titles.filter(x=>x.id!==t.id);},'Título excluído.'));},
  'delete-partner':el=>{const id=el.dataset.id;if(db.titles.some(t=>t.partnerId===id))throw Error('Este parceiro possui títulos. Altere sua situação para inativo para preservar o histórico.');confirm('Excluir parceiro?','O cadastro será removido.',()=>commit(d=>{d.partners=d.partners.filter(p=>p.id!==id);},'Parceiro excluído.'));},
  'delete-category':el=>{const id=el.dataset.id;if(db.titles.some(t=>t.categoryId===id))throw Error('Esta categoria está vinculada a títulos e não pode ser excluída.');confirm('Excluir categoria?','A categoria será removida.',()=>commit(d=>{d.categories=d.categories.filter(c=>c.id!==id);},'Categoria excluída.'));},
  'delete-account':el=>{const id=el.dataset.id;if(db.titles.some(t=>t.accountId===id)||db.payments.some(p=>p.accountId===id)||db.transfers.some(t=>t.from===id||t.to===id))throw Error('Esta conta tem vínculos. Marque-a como inativa para manter o histórico.');confirm('Excluir conta?','A conta e seu saldo inicial serão removidos.',()=>commit(d=>{d.accounts=d.accounts.filter(a=>a.id!==id);},'Conta excluída.'));},
  'undo-payment':el=>{const id=el.dataset.id;confirm('Estornar baixa?','A baixa será removida, o valor voltará a ficar pendente e o saldo da conta será recalculado.',()=>commit(d=>{d.payments=d.payments.filter(p=>p.id!==id);},'Baixa estornada.'));},
  'undo-transfer':el=>{const id=el.dataset.id;confirm('Estornar transferência?','A movimentação será removida das duas contas.',()=>commit(d=>{d.transfers=d.transfers.filter(t=>t.id!==id);},'Transferência estornada.'));},
  'save-generation':()=>{if(!pendingGeneration||busy)return;const generated=pendingGeneration;return commit(d=>{if(generated.some(t=>d.titles.some(x=>!x.cancelled&&x.type===t.type&&x.description===t.description&&x.due===t.due&&x.amount===t.amount&&x.partnerId===t.partnerId)))throw Error('Já existe um título igual (descrição, parceiro, valor e vencimento). Revise para evitar duplicidade.');d.titles.push(...generated);},`${generated.length} título(s) criado(s).`);},
  'back-generation':()=>{if(pendingGeneration?.formHTML){openModal('Novo lançamento',pendingGeneration.formHTML);pendingGeneration=null;}},
  granularity:el=>{state.granularity=el.dataset.value;render();},
  search:()=>{state.query='';location.hash='titles';if(state.route==='titles')render();requestAnimationFrame(()=>document.querySelector('#title-search')?.focus());},
  notifications:()=>{location.hash='notifications';if(state.route==='notifications')render();},
  'mobile-menu':()=>openModal('Seu financeiro',`<nav class="menu-grid">${routes.map(([key,label,ico])=>`<a href="#${key}" data-action="close">${icon(ico)}${label}</a>`).join('')}</nav><div class="local-note">${icon('info')} ${currentUser()?'Conta online · use o mesmo login em seus dispositivos.':'Dados locais, sem sincronização entre dispositivos.'}</div>`),
  'legacy-backup':()=>{if(!currentUser())return;const raw=localStorage.getItem(KEY);if(!raw){toast('Não há registros locais antigos neste navegador.');return;}download('gb-plus-local-original.json',raw,'application/json');toast('Cópia local exportada. Seus dados online não foram alterados.');},
  backup:()=>{download(`gb-plus-backup-${today()}.json`,backupText(db),'application/json');toast('Backup exportado. Guarde-o em um local seguro.');},
  restore:()=>document.querySelector('#backup-input').click(),
  'export-titles':()=>{const rows=filteredTitles(db,state);download(`gb-plus-titulos-${today()}.csv`,csv([['Descrição','Tipo','Parceiro','Categoria','Documento','Emissão','Vencimento','Valor (R$)','Pendente (R$)'],...rows.map(t=>[t.description,t.type==='income'?'Receita':'Despesa',db.partners.find(p=>p.id===t.partnerId)?.name||'',db.categories.find(c=>c.id===t.categoryId)?.name,t.document,dateLabel(t.issue),dateLabel(t.due),(t.amount/100).toFixed(2).replace('.',','),(pending(db,t)/100).toFixed(2).replace('.',',')])]),'text/csv;charset=utf-8');},
  'export-flow':()=>download(`gb-plus-fluxo-${today()}.csv`,csv([['Período','Entradas previstas','Saídas previstas','Entradas realizadas','Saídas realizadas'],...flow(db,state.range,state.granularity).map(r=>[dateLabel(r.date),...[r.expectedIn,r.expectedOut,r.actualIn,r.actualOut].map(v=>(v/100).toFixed(2).replace('.',','))])]),'text/csv;charset=utf-8'),
  'export-report':()=>download(`gb-plus-relatorio-${state.report}-${today()}.csv`,csv(reportData(db,state)),'text/csv;charset=utf-8'),
  install:()=>{if(isInstalledApp()){toast('GB+ já está instalado neste dispositivo.');return;}showInstallHelp();},
};
document.addEventListener('click',async e=>{const el=e.target.closest('[data-action]');if(!el||!db)return;if(el.tagName==='BUTTON')e.preventDefault();try{await actions[el.dataset.action]?.(el);}catch(error){fail(error);}});
document.addEventListener('click',e=>{if(!e.target.closest('.gb-entry-select'))closeEntryMenus();});
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const open=document.querySelector('#modal .gb-entry-select .gb-entry-trigger[aria-expanded="true"]');if(!open)return;e.preventDefault();e.stopImmediatePropagation();closeEntryMenus();open.focus();},true);
document.addEventListener('keydown',e=>{const trigger=e.target.closest?.('.gb-entry-trigger');if(!trigger||!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;e.preventDefault();const wrap=trigger.closest('.gb-entry-select');const options=[...wrap.querySelectorAll('.gb-entry-option')];toggleEntryMenu(trigger);if(!options.length)return;const selected=options.findIndex(el=>el.getAttribute('aria-selected')==='true');const last=options.length-1;const index=e.key==='Home'?0:e.key==='End'?last:e.key==='ArrowUp'?Math.max(0,selected-1):Math.min(last,selected+1);options[index]?.focus();});
document.addEventListener('submit',async e=>{e.preventDefault();if(busy||!db)return;const form=e.target;
  // Profile saves use Supabase Auth and never change financial accounts or titles.
  if(form.id==='profile-form'){
   const button=form.querySelector('#profile-save'),result=form.querySelector('#profile-message');
   if(!button||button.disabled||form.dataset.initialSnapshot===profileSnapshot(form))return;
   if(!profileCpfStatus.ready){if(result)result.textContent='Aguarde a confirmação do cadastro do CPF.';return;}
   form.dataset.saving='true';button.disabled=true;
   if(result)result.textContent='Salvando alterações…';
   try{
    const savedCpf=profileCpfStatus.cpf||'';
    const profile=validateProfile(form,savedCpf);
    if(!savedCpf&&profile.cpf){
      const userId=currentUser()?.id;
      const {error}=await authClient().from('gbplus_profiles').insert({user_id:userId,cpf:profile.cpf});
      if(error){
        if(error.code==='23505')throw Error('Este CPF já está cadastrado no GB+ ou foi registrado em outra sessão. Confira os dados.');
        if(error.code==='23514')throw Error('CPF inválido. Confira os 11 dígitos.');
        throw Error('Não foi possível registrar seu CPF. Confira a conexão e tente novamente.');
      }
      profileCpfStatus.cpf=profile.cpf;
    }
    await updatePersonalProfile(profile);
    window.dispatchEvent(new Event('gbplus-ai-ready'));
    render();
    toast('Alterações salvas com sucesso.');
   }catch(error){
    if(profileCpfStatus.cpf&&!currentUser()?.user_metadata?.gbplus_profile?.cpf){
      if(result)result.textContent='CPF registrado e bloqueado. Os outros dados não foram salvos; tente novamente.';
    }else if(result)result.textContent=error.message||'Não foi possível salvar. Tente novamente.';
   }finally{
    delete form.dataset.saving;
    if(form.isConnected)syncProfileSaveState(form);
   }
   return;
  }
  const v=formValues(form),id=form.dataset.id;try{
  if(form.id==='mobile-nav-form'){
   const shortcuts=readMobileNav(form);
   if(!validMobileNav(shortcuts))throw Error('Escolha três atalhos diferentes para a barra inferior.');
   await commit(d=>{d.settings.mobileNav=[...shortcuts];},'Barra inferior personalizada. Abra o celular para conferir.');
   return;
  }
  if(form.id==='setup-account-form'){
   if(!setupDraft)return;
   const name=String(v.name||'').trim(),bank=String(v.bank||'').trim(),branch=String(v.branch||'').trim(),number=String(v.number||'').trim();
   if(!name||name.length>120||bank.length>120||branch.length>80||number.length>80)throw Error('Confira o nome e os dados da conta.');
   Object.assign(setupDraft,{createAccount:true,name,bank,branch,number});
   nextSetupStep('balance-choice');
   return;
  }
  if(form.id==='setup-balance-form'){
   if(!setupDraft)return;
   setupDraft.initial=cents(v.initial);
   nextSetupStep('preferences');
   return;
  }
  if(form.id==='setup-preferences-form'){
   if(!setupDraft)return;
   const theme=String(v.theme||'');
   if(!['light','dark'].includes(theme))throw Error('Selecione um tema válido.');
   setupDraft.theme=theme;
   nextSetupStep('review');
   return;
  }
  if(form.id==='title-form'){if(!['income','expense'].includes(v.type)||!db.categories.some(c=>c.id===v.categoryId&&c.type===v.type))throw Error('Escolha uma categoria válida para o tipo do lançamento.');const input={type:v.type,description:v.description.trim(),categoryId:v.categoryId,partnerId:v.partnerId,document:v.document.trim(),issue:v.issue,due:v.due,amount:cents(v.amount),accountId:v.accountId||'',notes:v.notes.trim()};if(id){await commit(d=>updateTitle(d,id,{...input,cancelled:v.cancelled==='true'},v.scope==='future'));return;}const generated=generateTitles(input,v.mode,v.mode==='single'?1:Number(v.count));const clone=form.cloneNode(true);form.querySelectorAll('input,select,textarea').forEach((el,i)=>{const dest=clone.querySelectorAll('input,select,textarea')[i];if(el.tagName==='SELECT')[...dest.options].forEach(o=>o.toggleAttribute('selected',o.value===el.value));else if(el.tagName==='TEXTAREA')dest.textContent=el.value;else dest.setAttribute('value',el.value);});generated.formHTML=clone.outerHTML;pendingGeneration=generated;openModal('Revise antes de confirmar',`<div class="preview-summary"><span>${generated.length} título(s) · ${v.mode==='installment'?'Parcelado':v.mode==='recurring'?'Recorrente':'Único'}</span><strong>${money(generated.reduce((s,t)=>s+t.amount,0))}</strong><p>Valor total da operação</p></div><div class="preview-list">${generated.map(t=>`<div><span>${esc(t.description)} ${t.count>1?`${t.sequence}/${t.count}`:''}<small>${dateLabel(t.due)}</small></span><b>${money(t.amount)}</b></div>`).join('')}</div><div class="form-error" role="alert"></div><div class="form-footer">${button('Voltar','back-generation')}${button('Confirmar geração','save-generation','primary')}</div>`);}
  else if(form.id==='partner-form'){const roles=new FormData(form).getAll('roles');if(!roles.length)throw Error('Selecione ao menos uma classificação.');const row={...v,id:id||uid(),name:v.name.trim(),active:v.active==='true',roles};await commit(d=>{if(row.document&&d.partners.some(p=>p.id!==row.id&&p.document.replace(/\D/g,'')===row.document.replace(/\D/g,'')))throw Error('Já existe um parceiro com este CPF/CNPJ.');upsert(d.partners,row);});}
  else if(form.id==='account-form'){await commit(d=>upsert(d.accounts,{...v,id:id||uid(),name:v.name.trim(),initial:cents(v.initial),active:v.active==='true'}));}
  else if(form.id==='category-form'){await commit(d=>{const row={...v,id:id||uid(),name:v.name.trim()};if(d.categories.some(c=>c.id!==row.id&&c.type===row.type&&c.name.toLowerCase()===row.name.toLowerCase()))throw Error('Já existe uma categoria com este nome e tipo.');if(id&&d.titles.some(t=>t.categoryId===id&&t.type!==v.type))throw Error('Não é possível alterar o tipo de uma categoria em uso.');upsert(d.categories,row);});}
  else if(form.id==='payment-form'){await commit(d=>addPayment(d,{titleId:id,accountId:v.accountId,date:v.date,amount:cents(v.amount)}),'Baixa registrada. Saldo atualizado.');}
  else if(form.id==='launch-bulk-pay-form'){
   const ids=String(form.dataset.ids||'').split(',').filter(Boolean);
   const summary=paymentSummary(db,ids);
   if(!db.accounts.some(a=>a.id===v.accountId&&a.active))throw Error('Selecione uma conta financeira ativa.');
   confirm('Confirmar '+summary.count+' baixas?',
     'Serão lançadas '+summary.count+' baixas na conta escolhida, com data '+dateLabel(v.date)+
     ', no valor total de '+money(summary.income+summary.expense)+'. Confirmar?',
     ()=>commit(d=>applyLaunchPayments(d,ids,v.accountId,v.date),
       summary.count+' baixa(s) registradas. Saldos atualizados.'));
  }
  else if(form.id==='transfer-form'){await commit(d=>transfer(d,{...v,amount:cents(v.amount)}),'Transferência registrada.');}
  else if(form.id==='customize-form'){await commit(d=>{for(const device of ['desktop','mobile'])for(const key of Object.keys(INDICATORS))d.settings.panel[device][key]=new FormData(form).has(`${device}:${key}`);},'Painel personalizado.');}
  else if(form.id==='period-form'){if(v.from>v.to)throw Error('O início deve ser anterior ao fim do período.');state.period='custom';state.range={from:v.from,to:v.to};closeModal();render();}
}catch(error){fail(error);}});
function upsert(rows,row){const i=rows.findIndex(x=>x.id===row.id);if(i<0)rows.push(row);else rows[i]=row;}
document.addEventListener('change',async e=>{if(!db)return;const el=e.target;try{
  if(el.form?.id==='profile-form')syncProfileSaveState(el.form);
  if(el.name?.startsWith('slot')&&el.form?.id==='mobile-nav-form')updateMobileNavPreview(el.form);
  if(el.id==='entry-type'){const select=document.querySelector('#entry-category');if(select){select.innerHTML=db.categories.filter(c=>c.type===el.value).map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');syncEntrySelect(select);}}
  if(el.id==='entry-mode'){const count=document.querySelector('#count-field');if(count)count.hidden=el.value==='single';}
  if(el.id==='period'){if(el.value==='custom'){openModal('Escolher período',`<form id="period-form"><div class="form-grid">${field('De','from',state.range.from||today(),'date','required')}${field('Até','to',state.range.to||today(),'date','required')}</div>${formFooter('Aplicar período')}</form>`);el.value=state.period;}else{state.period=el.value;state.range=rangeFor(el.value);state.launchSelected=[];state.launchStatusOpen=false;render();}}
  if(el.dataset.filter){state[el.dataset.filter]=el.value;if(['partner','category'].includes(el.dataset.filter))state.moreFilters=true;state.launchSelected=[];render();}
  if(el.id==='report-type'){state.report=el.value;render();}
  if(el.id==='report-partner'){state.reportPartner=el.value;render();}
  if(el.id==='backup-input'&&el.files[0]){const file=el.files[0];el.value='';if(file.size>15*1024*1024)throw Error('O backup deve ter no máximo 15 MB.');const restored=parseBackup(await file.text());confirm('Restaurar backup?',`Este arquivo contém ${restored.titles.length} títulos, ${restored.partners.length} parceiros e ${restored.accounts.length} contas. Os registros atuais serão substituídos. Exporte um backup antes de continuar, se necessário.`,()=>commit(d=>{Object.keys(d).forEach(k=>delete d[k]);Object.assign(d,restored);},'Backup restaurado com sucesso.'));}
}catch(error){fail(error);}});
document.addEventListener('input',e=>{if(e.target.form?.id==='profile-form'){
 const field=e.target;
 if(field.name==='cpf'){
  const digits=field.value.replace(/\D/g,'').slice(0,11);
  field.value=formatCPF(digits);
  profileCpfFeedback(field.form);
 }
 syncProfileSaveState(e.target.form);return;}if(e.target.id==='settings-search-input'){filterSettings(e.target.value);return;}if(!['title-search','partner-search'].includes(e.target.id))return;const el=e.target;const pos=el.selectionStart;state[el.id==='title-search'?'query':'partnerQuery']=el.value;if(el.id==='title-search')state.launchSelected=[];render();const next=document.getElementById(el.id);next.focus();next.setSelectionRange(pos,pos);});
document.addEventListener('keydown',event=>{
 const card=event.target.closest?.('.gb-launch-card');
 if(card&&card===event.target&&(event.key==='Enter'||event.key===' ')){
  event.preventDefault();toggleLaunchSelection(card.dataset.id);
 }
});
installLaunchGestures({
 onLongPress:id=>{if(db&&state.route==='titles')toggleLaunchSelection(id,true);},
 onSwipe:(direction,id)=>{
  if(!db||state.route!=='titles')return;
  try{
   if(direction==='pay')startLaunchPayment([id]);
   else if(direction==='delete')requestLaunchDeletion([id]);
  }catch(error){fail(error);}
 }
});
window.addEventListener('hashchange',route);
matchMedia('(max-width: 760px)').addEventListener('change',()=>{if(db&&state.route==='dashboard')applyPanel();});
window.addEventListener('gbplus-installed',()=>{if(db&&state.route==='settings')render();});
window.addEventListener('storage',e=>{if(e.key===KEY&&!currentUser())toast('Dados alterados em outra aba. Atualize a página antes de continuar.');});
modal.addEventListener('cancel',()=>{pendingGeneration=null;confirmAction=null;});

function clearAccount(){
  db=null;repository?.dispose?.();closeModal();profileCpfStatus={userId:null,cpf:'',ready:false,loading:false,error:''};
  document.body.classList.add('auth-locked');
  showAuth('signin');
  document.querySelector('#main').innerHTML='<section class="panel recovery"><h1>Atualizando sua sessão…</h1></section>';
  document.querySelector('#navigation').innerHTML='';
  document.querySelector('#mobile-navigation').innerHTML='';
}
function updateConnection(){
  const online=!!currentUser();
  document.querySelector('#connection').textContent=online?(navigator.onLine?'Conta online':'Sem conexão · gravação indisponível'):(navigator.onLine?'Dados neste navegador':'Sem conexão · modo local');
  document.querySelector('.local-mark').innerHTML='<span class="status-dot"></span> '+(online?'Conta online<small>Dados privados do seu login.</small>':'Armazenamento local<small>Seus dados, neste navegador.</small>');
  const access=document.querySelector('#account-access');
  access.innerHTML=icon('user');access.setAttribute('aria-label',online?'Minha conta':'Entrar na minha conta');access.title=online?'Minha conta — '+currentUser().email:'Entrar na minha conta';
}
async function refreshOnline(manual=false){
  if(!currentUser()||!db||busy||!navigator.onLine||document.hidden||document.body.classList.contains('auth-locked'))return;
  if(modal.open){if(manual)toast('Feche o formulário antes de atualizar os dados online.');return;}
  busy=true;
  try{
    const nextRepo=new SupabaseRepository(authClient(),currentUser().id);
    const next=await nextRepo.read();
    const changed=next.revision!==db.revision;
    repository.dispose?.();repository=nextRepo;db=next;
    document.querySelector('#sync-alert').hidden=true;
    if(changed)render();
    if(manual)toast('Dados online atualizados.');
    document.querySelector('#connection').textContent='Online · atualizado '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  }catch(error){document.querySelector('#connection').textContent='Online · atualização pendente';if(manual)fail(error);}
  finally{busy=false;}
}
// Financial assistant bridge runs separately so failures cannot prevent GB+ startup.
window.addEventListener('gbplus-refresh',()=>refreshOnline(true));
window.addEventListener('gbplus-message',event=>toast(event.detail));
window.addEventListener('focus',()=>refreshOnline());
window.addEventListener('online',()=>{updateConnection();refreshOnline();});
window.addEventListener('offline',updateConnection);
// Startup is read-only. If network/auth initialization stalls, display a recovery
// choice rather than leaving the financial PWA on its logo indefinitely.
function startupLimit(operation,ms){
 let timer;
 return Promise.race([
  operation,
  new Promise((_,reject)=>{timer=setTimeout(()=>{
   const error=new Error('O acesso está demorando além do esperado. Seus registros não foram alterados.');
   error.code='GBPLUS_STARTUP_TIMEOUT';reject(error);
  },ms);})
 ]).finally(()=>clearTimeout(timer));
}
function startupRecovery(message){
 const gate=document.querySelector('#auth-gate');
 if(!gate)return;
 document.body.classList.add('auth-locked');
 gate.hidden=false;
 gate.innerHTML='<section class="auth-page"><div class="auth-card"><header class="auth-brand"><div class="auth-wordmark">GB<span>+</span></div><p>Gestão Financeira</p></header>'+
 '<p class="auth-description" role="alert"></p>'+
 '<a class="auth-primary" href="./recuperar.html" style="display:flex;align-items:center;justify-content:center;text-decoration:none;min-height:48px">Recuperar abertura do GB+</a>'+
 '<button type="button" id="gbplus-try-again" class="auth-forgot" style="margin-top:16px">Tentar novamente</button>'+
 '<p class="auth-description" style="margin-top:16px">Nenhum título, conta ou dado financeiro foi excluído.</p></div></section>';
 gate.querySelector('[role="alert"]').textContent=message||'Não foi possível concluir o carregamento. Confira sua conexão.';
 gate.querySelector('#gbplus-try-again').addEventListener('click',()=>location.reload());
}
async function init(){
 try{
  const avatar=document.querySelector('.avatar');
  if(avatar)avatar.outerHTML='<button type="button" class="icon-button account-button" id="account-access" aria-label="Minha conta" title="Minha conta">'+icon('user')+'</button>';
  const account=document.querySelector('#account-access');
  if(account)account.onclick=()=>{if(currentUser()&&db){location.hash='profile';}else showAuth();};
  const main=document.querySelector('#main');
  if(main&&!document.querySelector('#sync-alert'))main.insertAdjacentHTML('beforebegin','<div id="sync-alert" class="auth-notice sync-alert" role="alert" hidden>A gravação online precisa ser conferida. Feche o formulário, atualize os dados e refaça a alteração. <button class="button small" data-auth-action="refresh">Atualizar dados online</button></div>');
  const loginReturnMessage=consumeAuthReturnMessage();
  const user=await startupLimit(initializeAuth(clearAccount),16000);
  if(!user){showAuth('signin',loginReturnMessage);return;}
  if(isRecovery()){showAuth('recovery');return;}
  repository=new SupabaseRepository(authClient(),user.id);
  db=await startupLimit(repository.read(),16000);
  state.range=rangeFor('all');
  document.querySelector('#auth-gate').hidden=true;
  document.body.classList.remove('auth-locked');
  document.documentElement.removeAttribute('data-boot');
  route();window.dispatchEvent(new Event('gbplus-ai-ready'));
  if(shouldOfferSetup(db))startSetupWizard();
  pwaReady=true;
  setTimeout(()=>maybeOfferPwaInstall(),1800);
  updateConnection();setInterval(()=>refreshOnline(),60000);
 }catch(error){
  if(error?.code==='GBPLUS_STARTUP_TIMEOUT'||!document.querySelector('#account-access')){
   startupRecovery(error?.message);
  }else{
   // A real authentication error still uses the usual sign-in form.
   showAuth(isRecovery()?'recovery':'signin',error?.message||'Não foi possível abrir o GB+.');
  }
 }
}
init().catch(error=>startupRecovery(error?.message));
// Importing the AI integration must never block the financial application.
import('./ai-bridge.js?v=20261104-v3').then(({installAiBridge})=>{
 installAiBridge({getDb:()=>db,getUser:currentUser,getRepository:()=>repository,commit,openEditor:titleId=>{
   if(!db||!currentUser())throw Error('É necessário estar conectado para editar este título.');
   const title=getTitle(titleId);
   document.querySelector('.gb-ai-widget').open=false;
   openModal('Editar lançamento',titleForm(db,title));
  }});
 window.dispatchEvent(new Event('gbplus-ai-ready'));
}).catch(error=>console.error('Assistente GB+ indisponível; financeiro preservado.',error));
