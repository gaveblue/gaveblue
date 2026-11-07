import {parseBankStatement,parseBankCsv,inspectBankCsv,proposeReconciliation,readBankFileText} from './bank-import-preview.js?v=20261106-2509';
import {bankImportMarkup,bankImportHistoryMarkup,bankImportFilteredRows,bankImportBulkDecisions,BANK_IMPORT_PAGE_SIZE,BANK_IMPORT_WRITES_ENABLED} from './bank-import-ui.js?v=20261106-2600';
import {reviewSelection,applyReconciliationBatch,undoReconciliationBatch,reconciliationRecordKey,knownReconciliationKeys} from './bank-reconciliation.js?v=20261106-2505';
import {filterFlowRows} from './gb-flow-filters.js?v=20261106-68';
import {uid,today,money,dateLabel,cents,addMonths,validDate,generateTitles,addPayment,transfer,updateTitle,pending,flow,within} from './domain.js?v=20261105-72';
import {KEY,INDICATORS,defaultPanel,parseBackup,backupText,MOBILE_SHORTCUTS,defaultMobileNav,effectiveMobileNav,validMobileNav,shouldOfferSetup} from './store.js?v=20261106-2600';
import {esc,icon,button,field,select,formFooter,download,csv,titleTable} from './ui.js?v=20261105-72';
import {routes,dashboard,titlesView,partnersView,categoriesView,flowView,reportsView,settingsView,notificationsView,filteredTitles,reportData} from './views.js?v=20261106-2610';
import {accountsCardsView} from './accounts-cards-view.js?v=20261106-2513';
import {renderReactCharts,unmountReactCharts} from './gb-react-loader.js?v=20261105-45';
import {mountNativeCharts} from './gb-charts-native.js?v=20261106-68';
import {titleForm,partnerForm,accountForm,categoryForm,paymentForm,transferForm,titleDetail,customizeForm,accountDetail} from './forms.js?v=20261107-2700';
import {serviceById,serviceSearchKey,isServiceExpenseCategory} from './service-catalog.js?v=20261106-2630';
import {serviceIconMarkup,serviceIdentityMarkup,serviceDisplayName} from './service-ui.js?v=20261107-2700';
import {openGbPickerSheet,installGbPickerSheet,installEntryFormDrag} from './bottom-sheet.js?v=20261107-2700';
import {toggleEntryMenu,chooseEntryOption,syncEntrySelect,closeEntryMenus} from './entry-select.js?v=20261107-2700';
import {installGbControls,enhanceGbControls} from './custom-controls.js?v=20261104-42';
import {expectedDates,recurrenceAnchor} from './gb-calendar-rules.js?v=20261105-47';
import {CATEGORY_ICON_OPTIONS,categoryIconFor,gbIcon} from './gb-icons.js?v=20261104-42';
import {setupPwaInstallation,maybeOfferPwaInstall,showInstallHelp,isPwaInstalled} from './pwa-install.js?v=20261104-40';
import {SupabaseRepository} from '../integrations/supabase/repository.js?v=20261106-2505';
import {initializeAuth,authClient,currentUser,showAuth,isRecovery,updatePersonalProfile,consumeAuthReturnMessage,consumeSessionNotice,signOutAccount,authError,emailCooldownSeconds,markAuthEmailSent} from './auth.js?v=20261105-69';
import {profileView,validateProfile,validCPF,formatCPF} from './profile.js?v=20261105-59';
import {canResetFinancialData,canDeleteAccount,clearFinancialDocument} from './account-safety.js?v=20261106-2610';
import {resetAccountModal,deleteAccountModal,syncAccountDangerConfirm} from './account-safety-ui.js?v=20261106-2610';
import {firstSetupView,customMobileNavForm,shortcutsPreview,readMobileNav,firstStepsPanel} from './setup-ui.js?v=20261105-87';
import {BANKS,bankCatalog,findBank,bankName,syncBankPicker,filterBankPicker,filterBankDirectory} from './banks.js?v=20261105-87';
import {addCardPurchase,removeCardPurchase,ensureCardMayChange,creditCards,cardPurchases} from './credit-cards.js?v=20261105-72';
import {cashForecast} from './forecast.js?v=20261105-72';
import {banksView,bankForm,cardForm,cardPurchaseForm,forecastView,forecastSummary,forecastScenarioForm,forecastResult} from './finance-24-ui.js?v=20261106-2511';
import {launchesView} from './launches-view.js?v=20261106-2620';
import {installLaunchGestures} from './launches-gestures.js?v=20261104-38';
import {launchSelection,paymentSelection,paymentSummary,applyLaunchPayments,reversedSelection,applyLaunchReversals,deletionSelection,applyLaunchDeletions} from './launch-actions.js?v=20261105-72';
let repository=null;let db;let busy=false;let pendingGeneration=null;let confirmAction=null;let pwaReady=false;
let forecastDays=30;
const isInstalledApp=isPwaInstalled;
setupPwaInstallation();
installGbControls();
const inviteLink='https://gaveblue.com.br/gbplus/';
const firstStepsIgnored=new Set();
function firstStepsDismissed(){
 const id=currentUser()?.id;if(!id)return true;
 if(firstStepsIgnored.has(id))return true;
 try{return localStorage.getItem('gbplus-first-steps-dismissed:'+id)==='1';}catch{return false;}
}
let profileCpfStatus={userId:null,cpf:'',ready:false,loading:false,error:''};
let bankImportDraft=null; // Memory-only preview; released on modal close.

const state={route:'dashboard',accountCardsTab:'accounts',period:'all',range:{},query:'',status:'',type:'',partner:'',category:'',partnerQuery:'',granularity:'month',flowChartMode:'bars',flowStatus:'all',report:'payable',reportPartner:'',moreFilters:false,launchSelected:[],launchStatusOpen:false,launchSearchOpen:false};
const modal=document.querySelector('#modal');
installGbPickerSheet();
installEntryFormDrag(modal);
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
function openModal(title,content){
 const isEntry=content.includes('id="title-form"');
 modal.classList.toggle('gb-entry-modal',isEntry);
 modal.classList.toggle('gb-bank-import-modal',content.includes('id="gb-import-workspace"'));
 if(isEntry)modal.dataset.gbSnap='partial';
 else delete modal.dataset.gbSnap;
 const grab=isEntry?'<button type="button" class="gb-entry-sheet-grab" data-entry-sheet-grab aria-label="Expandir formulário" aria-expanded="false"><span aria-hidden="true"></span></button>':'';
 document.querySelector('#modal-content').innerHTML=
  '<div class="modal-heading">'+grab+'<h2 id="modal-title">'+esc(title)+'</h2>'+
  '<button class="icon-button" data-action="close" aria-label="Fechar">'+icon('close')+'</button></div>'+
  '<div class="modal-body">'+content+'</div>';
 modal.setAttribute('aria-labelledby','modal-title');
 if(!modal.open)modal.showModal();
 enhanceGbControls(modal);
 fitEntryAmount(modal.querySelector('#entry-amount'));
 if(isEntry){syncEntrySettlement(modal.querySelector('#title-form'));if(modal.querySelector('#title-form')?.dataset.step==='3')refreshEntrySchedule(modal.querySelector('#title-form'));}
}
function closeModal(){if(modal.open)modal.close();bankImportDraft=null;pendingGeneration=null;confirmAction=null;if(pwaReady)setTimeout(()=>maybeOfferPwaInstall(),1100);}
function confirm(title,message,callback){confirmAction=callback;openModal(title,`<p class="confirm-message">${esc(message)}</p><div class="form-error" role="alert"></div><div class="form-footer">${button('Cancelar','close')}${button('Confirmar','confirm','primary')}</div>`);}
// 2.5.0: preview only, never invokes commit(), Supabase or AI.
function redrawBankImport(){
 if(!bankImportDraft)return;
 const old=document.querySelector('#modal .modal-body');
 const top=old?.scrollTop||0;
 openModal('Importar extrato bancário',bankImportMarkup(db,bankImportDraft));
 const fresh=document.querySelector('#modal .modal-body');
 if(fresh)fresh.scrollTop=bankImportDraft.step==='confirm'?0:top;
}
function openBankImport(accountId=''){
 const accounts=(db.accounts||[]).filter(a=>a.active!==false);
 const account=accounts.find(a=>a.id===accountId)||accounts[0];
 bankImportDraft={accountId:account?.id||'',parsed:null,preview:null,filename:'',accountHint:'',filter:'all',page:0,error:'',decisions:{},selectedRows:[],bulkAction:'',bulkCategory:'',step:'review',review:null,confirmCreation:false,confirmAccount:false,csvSource:null,csvMapping:null};
 redrawBankImport();
}
// Guided onboarding is opt-in. No financial records are created before final confirmation.
let setupDraft=null;
function startSetupWizard(){
 if(!db)return;
 setupDraft={step:'welcome',history:[],createAccount:false,name:'',bank:'',branch:'',number:'',bankId:'',initial:0,theme:db.settings.theme};
 showSetupWizard();
}
function showSetupWizard(){
 if(!setupDraft)return;
 openModal('Configuração inicial do GB+',firstSetupView(setupDraft,db));
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
 return slots.map(([key,label,ico])=>key==='new'||key==='menu'?`<button type="button" data-action="${key==='new'?'new-title':'mobile-menu'}" class="${key==='new'?'mobile-new':''}" aria-label="${label}">${icon(ico)}<span>${label}</span></button>`:`<a href="#${key}" class="${(key==='accounts'||key==='cards'?state.route==='accounts'&&state.accountCardsTab===key:state.route===key)?'active':''}" ${(key==='accounts'||key==='cards'?state.route==='accounts'&&state.accountCardsTab===key:state.route===key)?'aria-current="page"':''}>${icon(ico)}<span>${label}</span></a>`).join('');
})();const views={dashboard:()=>dashboard(db,state,!!currentUser(),currentUser()),titles:()=>launchesView(db,state),payable:()=>titlesView(db,state),receivable:()=>titlesView(db,state),partners:()=>partnersView(db,state),accounts:()=>accountsCardsView(db,state.accountCardsTab),categories:()=>categoriesView(db),flow:()=>flowView(db,state),provisions:()=>flowView(db,state),reports:()=>reportsView(db,state),settings:()=>settingsView(db,!isInstalledApp(),!!currentUser(),currentUser(),isInstalledApp()),notifications:()=>notificationsView(db),banks:()=>banksView(db),cards:()=>accountsCardsView(db,'cards'),forecast:()=>forecastView(db,forecastDays),profile:()=>profileView(currentUser(),profileCpfStatus.userId===currentUser()?.id?profileCpfStatus:{ready:false,cpf:'',error:''})};document.body.classList.toggle('gb-settings-page',state.route==='settings');unmountReactCharts();document.querySelector('#main').innerHTML=(views[state.route]||views.dashboard)();if(state.route==='dashboard'){
 const flowSection=document.querySelector('#main .dashboard-middle');
 if(flowSection)flowSection.insertAdjacentHTML('beforebegin',forecastSummary(db));
}
if(state.route==='dashboard'&&!firstStepsDismissed()){
 const html=firstStepsPanel(db);
 if(html){
  const main=document.querySelector('#main'),anchor=main.querySelector('.page-heading');
  if(anchor)anchor.insertAdjacentHTML('afterend',html);
  else main.insertAdjacentHTML('afterbegin',html);
 }
}enhanceGbControls(document.querySelector('#main'));if(state.route==='profile'){initializeProfileDirtyState();if(!profileCpfStatus.ready&&!profileCpfStatus.loading&&!profileCpfStatus.error)void loadRegisteredCpf();}updateConnection();if(state.route==='dashboard')applyPanel();if(['dashboard','flow','provisions'].includes(state.route)){
  try{
   const allRows=flow(db,state.range,state.route==='dashboard'?'month':state.granularity);
   const rows=state.route==='dashboard'?allRows:filterFlowRows(allRows,state.flowStatus);
   mountNativeCharts(db,state,rows);
   renderReactCharts(db,state,rows);
  }catch(error){console.warn('GB+ gráficos indisponíveis; financeiro mantido.',error);}
 }}

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
 // Compare effective saved values, not formatting (phone, CPF or CEP masks).
 const normalize=(key,value)=>{
  const text=String(value);
  if(['phone','cpf','postal_code'].includes(key))return text.replace(/\D/g,'');
  if(key==='full_name')return text.trim().replace(/\s+/g,' ');
  if(key==='state')return text.trim().toUpperCase();
  return text.trim();
 };
 return JSON.stringify([...new FormData(form)].map(([key,value])=>[key,normalize(key,value)]));
}
function syncProfileSaveState(form){
 if(!form||form.id!=='profile-form')return;
 const submit=form.querySelector('#profile-save');
 const available=form.dataset.saving!=='true'&&form.dataset.initialSnapshot!==profileSnapshot(form);
 if(submit){submit.disabled=!available;submit.hidden=!available;}
 const area=form.querySelector('.gb-account-save-area');
 if(area)area.hidden=!available&&!form.querySelector('#profile-message')?.textContent?.trim();
}
function initializeProfileDirtyState(){
 const form=document.getElementById('profile-form');
 if(!form)return;
 form.dataset.initialSnapshot=profileSnapshot(form);
 syncProfileSaveState(form);
}
function applyPanel(){const device=matchMedia('(max-width: 760px)').matches?'mobile':'desktop';document.querySelectorAll('[data-indicator]').forEach(el=>{el.hidden=!db.settings.panel[device][el.dataset.indicator];});document.querySelectorAll('.dashboard-middle,.results-grid,.stats-grid').forEach(el=>el.hidden=![...el.children].some(x=>!x.hidden));}
function route(){if(!db)return;const requested=location.hash.slice(1);const next=requested==='cards'?'accounts':requested;if(requested==='cards'){state.accountCardsTab='cards';history.replaceState(null,'','#accounts');}if(next==='main'&&document.querySelector('#main').childElementCount)return;const previous=state.route;state.route=next==='profile'||routes.some(r=>r[0]===next)?next:'dashboard';if(previous!==state.route){state.launchSelected=[];state.launchStatusOpen=false;}state.type=state.route==='payable'?'expense':state.route==='receivable'?'income':'';closeModal();render();window.scrollTo(0,0);}
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

/** Center the entire R$ + formatted amount group, including larger values. */
function fitEntryAmount(input){
 if(!input||input.id!=='entry-amount')return;
 const length=String(input.value||'0,00').length;
 input.style.width=Math.max(4.7,Math.min(18,length+0.8))+'ch';
}
function updateServicePicker(form,id){
 if(!form||form.id!=='title-form')return;
 const service=serviceById(id),custom=id==='custom';
 if(id&&!service&&!custom)throw Error('Serviço não localizado.');
 const hidden=form.querySelector('[name="serviceId"]');
 const name=form.querySelector('[name="serviceName"]');
 const description=form.elements.description;
 const previousId=hidden.value;
 const previousLabel=serviceDisplayName(previousId,name.value,'');
 const wrap=form.querySelector('.gb-service-custom');
 const current=form.querySelector('.gb-service-selected-content');
 const toggle=form.querySelector('[data-action="title-service-toggle"]');

 hidden.value=service?.id||(custom?'custom':'');
 if(!custom)name.value='';
 wrap.hidden=!custom;name.required=custom;
 const label=service?.name||(custom?'Outro serviço':'Nenhum serviço escolhido');
 current.innerHTML=(service?serviceIconMarkup(service):'<span class="gb-service-monogram" aria-hidden="true">+</span>')+
  '<span class="gb-service-selected-name">'+esc(label)+'</span>';
 // For personal finance, the selected service is always the transaction name.
 // This is a display/prefill rule only; it does not create a payment or subscription.
 if(description){
  if(service||custom){
   description.value=serviceDisplayName(hidden.value,name.value,'');
   description.readOnly=true;
  }else{
   if(previousId&&description.value===previousLabel)description.value='';
   description.readOnly=false;
  }
 }
 if(toggle)toggle.textContent=id?'Alterar':'Selecionar';
 const info=form.querySelector('.gb-service-help');
 if(info)info.textContent=service?.billingMode==='subscription'?
  'Assinatura? Se desejar, escolha Recorrente na etapa Detalhes. Nada será agendado automaticamente.':
  'A identificação não cria assinatura, cobrança, despesa ou baixa. Você decide os valores e vencimentos.';
 if(toggle)toggle.setAttribute('aria-expanded','false');
 if(custom)name.focus({preventScroll:true});
}
/** Service choice is a second level of the selected expense category. */
function syncEntryServiceCategory(form){
 if(!form||form.id!=='title-form')return;
 const categoryId=form.elements.categoryId?.value;
 const category=db.categories.find(c=>c.id===categoryId);
 const visible=form.elements.type?.value==='expense'&&isServiceExpenseCategory(category);
 const area=form.querySelector('.gb-service-area');
 if(!area)return;
 area.hidden=!visible;
 if(!visible&&form.elements.serviceId?.value)updateServicePicker(form,'');
}
function filterServicesInForm(form){
 if(!form||form.id!=='title-form')return;
 const search=serviceSearchKey(form.querySelector('#gb-service-search')?.value||'');
 const group=form.querySelector('#gb-service-group')?.value||'all';
 let found=0;
 form.querySelectorAll('.gb-service-option').forEach(option=>{
  const matchText=!search||option.dataset.serviceSearch?.includes(search);
  const matchGroup=group==='all'||option.dataset.serviceGroup===group||option.dataset.serviceGroup==='custom';
  option.hidden=!(matchText&&matchGroup);if(!option.hidden)found++;
 });
 const noResult=form.querySelector('.gb-service-empty');
 if(noResult)noResult.hidden=found>0;
}
function validateEntryStepOne(form){
 const type=form.elements.type?.value;
 const categoryId=form.elements.categoryId?.value;
 if(!['income','expense'].includes(type)||!db.categories.some(c=>c.id===categoryId&&c.type===type))throw Error('Selecione o tipo e uma categoria válida.');
 if(!form.elements.description?.value.trim())throw Error('Informe a descrição do lançamento.');
 if(cents(form.elements.amount?.value||'0')<1)throw Error('Informe um valor maior que R$ 0,00.');
 const serviceId=form.elements.serviceId?.value||'';
 const customName=form.elements.serviceName?.value.trim()||'';
 if(serviceId&&type!=='expense')throw Error('Serviços só podem ser associados a despesas.');
 // Old titles may already contain a service in another category; preserve them
 // when editing, but a new service must be chosen under a service category.
 if(serviceId&&!form.dataset.id&&!isServiceExpenseCategory(db.categories.find(c=>c.id===categoryId)))
  throw Error('Selecione a categoria Serviços para identificar o aplicativo.');
 if(serviceId&&!serviceById(serviceId)&&serviceId!=='custom')throw Error('Escolha um serviço válido.');
 if(serviceId==='custom'&&(!customName||customName.length>120))throw Error('Informe o nome do serviço personalizado (até 120 caracteres).');
 // Emissão e vencimento serão validados na terceira etapa.
}
function validateEntryStepTwo(form){
 if(form.dataset.id)return;
 const mode=form.elements.mode?.value||'single';
 if(!['single','installment','recurring'].includes(mode))throw Error('Escolha uma periodicidade válida.');
 if(mode!=='single'){
  const count=Number(form.elements.count?.value);
  if(!Number.isInteger(count)||count<2||count>120)throw Error('Informe de 2 a 120 parcelas ou meses.');
  if(mode==='installment'&&cents(form.elements.amount.value)<count)
   throw Error('O valor precisa comportar ao menos R$ 0,01 por parcela.');
 }
}
function syncEntrySettlement(form){
 if(!form||form.id!=='title-form')return;
 const group=form.querySelector('.gb-entry-settlement');
 if(!group)return;
 const mode=form.elements.mode?.value||'single';
 const isSeries=mode!=='single';
 const accounts=(db?.accounts||[]).filter(a=>a.active);
 const paid=group.querySelector('input[value="paid"]');
 const pending=group.querySelector('input[value="pending"]');
 if(paid){
  paid.disabled=isSeries||accounts.length===0;
  if(paid.disabled&&paid.checked&&pending)pending.checked=true;
 }
 const show=!!paid?.checked&&!paid.disabled;
 const details=group.querySelector('.gb-entry-settlement-details');
 const warn=group.querySelector('.gb-entry-settlement-series');
 if(details)details.hidden=!show;
 if(warn){
  warn.hidden=!isSeries&&accounts.length>0;
  warn.textContent=isSeries?
   'Parcelamentos e recorrências devem ser baixados por título, depois da criação.':
   'Cadastre uma conta financeira ativa para habilitar a baixa imediata.';
 }
 const account=form.elements.settleAccountId;
 const date=form.elements.settleDate;
 if(account)account.required=show;
 if(date)date.required=show;
}
function validateEntryStepThree(form){
 if(!validDate(form.elements.issue?.value))throw Error('Informe uma data de emissão válida.');
 if(!validDate(form.elements.due?.value))throw Error('Informe uma data de vencimento válida.');
 if(form.dataset.id)return;
 const choice=form.elements.settlement?.value||'pending';
 if(!['pending','paid'].includes(choice))throw Error('Escolha como registrar o lançamento.');
 if(choice==='paid'){
  if(form.elements.mode?.value!=='single')throw Error('Baixa imediata disponível apenas para lançamento único.');
  if(!db.accounts.some(a=>a.id===form.elements.settleAccountId?.value&&a.active))
   throw Error('Selecione uma conta financeira ativa para a baixa.');
  if(!validDate(form.elements.settleDate?.value)||form.elements.settleDate.value>today())
   throw Error('A data da baixa deve ser válida e não pode ser futura.');
 }
}
function toggleEntryStep(form,step){
 if(!form||form.id!=='title-form'||![1,2,3].includes(step))return;
 const current=Number(form.dataset.step||1);
 if(step>current){
  if(current===1)validateEntryStepOne(form);
  if(current===2)validateEntryStepTwo(form);
 }
 form.dataset.step=String(step);
 for(let number=1;number<=3;number++){
  const stage=form.querySelector('#gb-entry-step-'+['','one','two','three'][number]);
  if(stage)stage.hidden=number!==step;
  const footer=form.querySelector('[data-entry-footer="'+number+'"]');
  if(footer)footer.hidden=number!==step;
 }
 const progress=form.querySelector('.gb-entry-progress');
 if(progress){
  progress.setAttribute('aria-label','Etapa '+step+' de 3');
  [...progress.children].forEach((item,i)=>item.classList.toggle('active',i===step-1));
 }
 const error=form.querySelector('.form-error');if(error)error.textContent='';
 if(step===2){
  const recap=form.querySelector('.gb-entry-amount-recap strong');
  if(recap)recap.textContent=money(cents(form.elements.amount.value));
 }
 if(step===3){syncEntrySettlement(form);refreshEntrySchedule(form);}
 const scroll=modal.querySelector('.modal-body')||modal;
 scroll.scrollTo({top:0,behavior:'instant'});
 const focus=step===1?form.elements.amount:
  step===2?(form.querySelector('#gb-entry-step-two .gb-entry-trigger')||form.elements.document):
  form.elements.issue;
 requestAnimationFrame(()=>focus?.focus({preventScroll:true}));
}
function refreshEntrySchedule(form){
 if(!form||form.id!=='title-form')return;
 const mode=form.elements.mode?.value||form.dataset.mode||'single';
 const section=form.querySelector('#gb-entry-installments');
 const countField=form.querySelector('#count-field');
 if(countField)countField.hidden=mode==='single';
 if(!section)return;
 section.hidden=mode==='single'||(!!form.dataset.id&&form.elements.scope?.value!=='future');
 if(section.hidden)return;
 const target=form.querySelector('#gb-entry-schedule'),summary=form.querySelector('#gb-entry-schedule-count');
 const due=form.elements.due?.value;
 const count=form.elements.count?Number(form.elements.count.value):(Number(form.dataset.count)||1);
 if(!validDate(due)){target.textContent='Defina um vencimento válido na terceira etapa.';return;}
 if(!Number.isInteger(count)||count<1||count>120){target.textContent='Informe de 1 a 120 parcelas ou meses.';return;}
 try{
  const source=form.dataset.id?getTitle(form.dataset.id):null;
  const anchor=source?recurrenceAnchor(due,source):due;
  const dates=expectedDates(anchor,mode,count,!!form.elements.businessDays?.checked,addMonths);
  let amount=0;
  try{amount=cents(form.elements.amount?.value||'0,00');}catch{}
  summary.textContent=count+' vencimento'+(count!==1?'s':'');
  target.innerHTML=dates.map((entry,i)=>{
   const installment=mode==='installment'?(Math.floor(amount/count)+(i<amount%count?1:0)):amount;
   return '<div class="gb-entry-schedule-row"><span class="gb-entry-schedule-sequence">'+entry.index+'</span>'+
    '<span class="gb-entry-schedule-date"><strong>'+dateLabel(entry.date)+'</strong>'+
    (entry.shifted?'<small>Próximo dia útil · original '+dateLabel(entry.nominal)+'</small>':'<small>Vencimento previsto</small>')+'</span>'+
    '<strong>'+money(installment)+'</strong></div>';
  }).join('');
 }catch(error){target.textContent=error.message||'Revise os vencimentos.';}
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
   const target=getTitle(ids[0]);
   if(target.cardInvoice)throw Error('Edite compras e parcelas pelo cartão. A fatura não pode ser alterada manualmente.');
   openModal('Editar lançamento',titleForm(db,target));
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
  'entry-toggle':el=>{
   const wrap=el.closest('.gb-entry-select'),form=el.closest('#title-form');
   if(form&&wrap?.dataset.entryName==='categoryId'){
    const source=form.querySelector('#entry-category');
    closeEntryMenus();
    el.setAttribute('aria-expanded','true');
    const shown=openGbPickerSheet({
     kind:'category',
     items:db.categories.filter(c=>c.type===form.elements.type?.value),
     selected:source?.value||'',
     onPick:id=>{
      if(!form.isConnected||!source||![...source.options].some(o=>o.value===id))return;
      source.value=id;
      syncEntrySelect(source);
      source.dispatchEvent(new Event('change',{bubbles:true}));
     }
    });
    if(!shown){el.setAttribute('aria-expanded','false');toggleEntryMenu(el);}
    return;
   }
   toggleEntryMenu(el);
  },
  'entry-option':el=>chooseEntryOption(el),
  'entry-type-pick':el=>{
   const form=el.closest('#title-form'),select=form?.querySelector('#entry-type');
   const type=el.dataset.value;
   if(!select||!['expense','income'].includes(type))return;
   select.value=type;
   form.querySelectorAll('.gb-entry-flow-option').forEach(button=>{
    const active=button.dataset.value===type;
    button.classList.toggle('is-active',active);
    button.setAttribute('aria-pressed',String(active));
   });
   form.dataset.entryType=type;
   select.dispatchEvent(new Event('change',{bubbles:true}));
  },
  'title-next':el=>{const form=el.closest('#title-form');toggleEntryStep(form,Math.min(3,Number(form?.dataset.step||1)+1));},
  'title-back':el=>{const form=el.closest('#title-form');toggleEntryStep(form,Math.max(1,Number(form?.dataset.step||1)-1));},
  'title-service-toggle':el=>{
   const form=el.closest('#title-form');
   if(!form)return;
   el.setAttribute('aria-expanded','true');
   const shown=openGbPickerSheet({
    kind:'service',selected:form.elements.serviceId?.value||'',
    onPick:id=>{if(form.isConnected)updateServicePicker(form,id);}
   });
   if(!shown)el.setAttribute('aria-expanded','false');
  },
  'title-service-pick':el=>updateServicePicker(el.closest('#title-form'),el.dataset.serviceId),
  'title-service-clear':el=>updateServicePicker(el.closest('#title-form'),''),
  'category-icon':el=>{
   const form=el.closest('#category-form'),value=el.dataset.icon;
   if(!form||!CATEGORY_ICON_OPTIONS.some(([key])=>key===value))return;
   form.elements.icon.value=value;
   form.querySelectorAll('.gb-category-icon-choice').forEach(button=>{
    const selected=button.dataset.icon===value;
    button.classList.toggle('is-selected',selected);
    button.setAttribute('aria-pressed',String(selected));
   });
  },
  'new-title':()=>openModal('Novo lançamento',titleForm(db,null,state.type||'expense')),
  'open-banks':()=>{location.hash='banks';if(state.route==='banks')render();},
  'accounts-cards-tab':el=>{
   const tab=el.dataset.tab;
   if(state.route!=='accounts'||!['accounts','cards'].includes(tab)||tab===state.accountCardsTab)return;
   state.accountCardsTab=tab;render();
   document.querySelector('#gb-finance-tab-'+tab)?.focus({preventScroll:true});
  },
  'open-cards':()=>{state.accountCardsTab='cards';location.hash='accounts';if(state.route==='accounts')render();},
  'new-bank':()=>openModal('Cadastrar banco ou instituição',bankForm()),
  'edit-bank':el=>{
   const bank=(db.banks||[]).find(x=>x.id===el.dataset.id);
   if(!bank)throw Error('Instituição personalizada não encontrada.');
   openModal('Editar instituição financeira',bankForm(bank));
  },
  'new-card':()=>openModal('Cadastrar cartão de crédito',cardForm(db)),
  'edit-card':el=>{
   const card=creditCards(db).find(x=>x.id===el.dataset.id);
   if(!card)throw Error('Cartão não encontrado.');
   openModal('Editar cartão de crédito',cardForm(db,card));
  },
  'new-card-purchase':el=>openModal('Compra no cartão de crédito',cardPurchaseForm(db,el?.dataset?.id||'')),
  'delete-card-purchase':el=>{
   const purchase=cardPurchases(db).find(x=>x.id===el.dataset.id);
   if(!purchase)throw Error('Compra não encontrada.');
   confirm('Excluir compra do cartão?','A compra de '+money(purchase.amount)+' será removida da fatura correspondente. Se for parcelada, todas as parcelas serão removidas. Não é possível excluir compras de faturas que já tiveram pagamento.',()=>commit(d=>removeCardPurchase(d,purchase.id),'Compra removida e faturas atualizadas.'));
  },
  'forecast-period':el=>{
   const days=Number(el.dataset.value);
   if(![7,15,30,60,90].includes(days))return;
   forecastDays=days;render();
  },
  'forecast-simulate':()=>openModal('Simular vencimento',forecastScenarioForm(db,forecastDays)),
  'edit-title':el=>{
   const title=getTitle(el.dataset.id);
   if(title.cardInvoice)throw Error('Faturas são atualizadas pelas compras do cartão; não podem ser editadas como títulos comuns.');
   openModal('Editar lançamento',titleForm(db,title));
  },
  'title-detail':el=>openModal('Detalhes do título',titleDetail(db,getTitle(el.dataset.id))),
  payment:el=>openModal('Registrar baixa',paymentForm(db,getTitle(el.dataset.id))),
  'new-partner':()=>openModal('Novo parceiro',partnerForm()),
  'edit-partner':el=>openModal('Editar parceiro',partnerForm(db.partners.find(p=>p.id===el.dataset.id))),
  'partner-detail':el=>{const p=db.partners.find(p=>p.id===el.dataset.id);openModal('Histórico do parceiro',`<h3>${esc(p.name)}</h3><p class="muted">${esc(p.document||'')} ${esc(p.email||'')}</p><p>${esc(p.address||'')}</p><p>${esc(p.notes||'')}</p>${titleTable(db,db.titles.filter(t=>t.partnerId===p.id))}`);},
  'new-account':()=>openModal('Nova conta financeira',accountForm(db)),
  'edit-account':el=>openModal('Editar conta',accountForm(db,db.accounts.find(a=>a.id===el.dataset.id))),
  'account-detail':el=>openModal('Movimentações da conta',accountDetail(db,db.accounts.find(a=>a.id===el.dataset.id))),
  'bank-import-open':el=>openBankImport(el.dataset.id||''),
  'bank-import-reset':()=>{
   if(!bankImportDraft)return;
   Object.assign(bankImportDraft,{parsed:null,preview:null,filename:'',accountHint:'',filter:'all',page:0,error:'',decisions:{},selectedRows:[],bulkAction:'',bulkCategory:'',step:'review',review:null,confirmCreation:false,confirmAccount:false,csvSource:null,csvMapping:null});
   redrawBankImport();
  },

  'bank-import-map':()=>{
   if(!bankImportDraft?.csvSource||!bankImportDraft.csvMapping)return;
   Object.assign(bankImportDraft,{parsed:null,preview:null,step:'mapping',error:'',decisions:{},selectedRows:[],bulkAction:'',bulkCategory:'',review:null,confirmCreation:false,confirmAccount:false});
   redrawBankImport();
  },
  'bank-import-apply-map':()=>{
   const draft=bankImportDraft;
   if(!draft?.csvSource||!draft.csvMapping||draft.step!=='mapping')return;
   try{
    const m=draft.csvMapping,mode=m.mode,columns={...m.columns};
    if(mode==='split'){columns.amount=-1;columns.kind=-1;}
    else{columns.credit=-1;columns.debit=-1;}
    const parsed=parseBankCsv(draft.csvSource,{separator:m.separator,indexes:columns});
    draft.parsed=parsed;
    draft.preview=proposeReconciliation(parsed,db,draft.accountId);
    draft.accountHint=parsed.accountHint||'';
    Object.assign(draft,{error:'',filter:'all',page:0,decisions:{},selectedRows:[],bulkAction:'',bulkCategory:'',review:null,confirmCreation:false,confirmAccount:false,step:'review'});
   }catch(error){draft.error=error?.message||'Confira o mapeamento do CSV.';}
   redrawBankImport();
  },
  'bank-import-select-visible':()=>{
   const d=bankImportDraft;if(!d?.preview||d.step!=='review')return;
   const rows=bankImportFilteredRows(d.preview,d.filter,d.decisions);
   const page=Math.min(Math.max(0,Number(d.page)||0),Math.max(0,Math.ceil(rows.length/BANK_IMPORT_PAGE_SIZE)-1));
   const saved=knownReconciliationKeys(db,d.accountId);
   const slice=rows.slice(page*BANK_IMPORT_PAGE_SIZE,(page+1)*BANK_IMPORT_PAGE_SIZE);
   const eligible=slice.filter(row=>row.status!=='possible_duplicate_in_file'&&!saved.has(reconciliationRecordKey(row.record)));
   const selected=new Set(d.selectedRows||[]);
   eligible.forEach(row=>selected.add(row.index));
   d.selectedRows=[...selected].sort((a,b)=>a-b);d.error='';redrawBankImport();
  },
  'bank-import-clear-selection':()=>{
   if(!bankImportDraft?.preview)return;
   bankImportDraft.selectedRows=[];bankImportDraft.bulkAction='';bankImportDraft.bulkCategory='';
   bankImportDraft.error='';redrawBankImport();
  },
  'bank-import-apply-bulk':()=>{
   const d=bankImportDraft;if(!d?.preview||d.step!=='review')return;
   try{
    const next=bankImportBulkDecisions(d.preview,d.selectedRows,d.bulkAction,d.bulkCategory,db,
     d.accountId,d.decisions,today());
    d.decisions=next;d.selectedRows=[];d.bulkAction='';d.bulkCategory='';
    d.review=null;d.confirmCreation=false;d.confirmAccount=false;d.error='';
   }catch(error){d.error=error.message||'Confira os movimentos selecionados.';}
   redrawBankImport();
  },
  'bank-import-filter':el=>{
   if(!bankImportDraft?.preview||!['all','expense','income','possible_match','ambiguous','not_found','decided'].includes(el.dataset.value))return;
   bankImportDraft.filter=el.dataset.value;bankImportDraft.page=0;redrawBankImport();
  },
  'bank-import-next':()=>{
   if(!bankImportDraft?.preview)return;
   const count=bankImportFilteredRows(bankImportDraft.preview,bankImportDraft.filter,bankImportDraft.decisions).length;
   bankImportDraft.page=Math.min(Math.max(0,Math.ceil(count/BANK_IMPORT_PAGE_SIZE)-1),bankImportDraft.page+1);
   redrawBankImport();
  },
  'bank-import-prev':()=>{
   if(!bankImportDraft?.preview)return;
   bankImportDraft.page=Math.max(0,bankImportDraft.page-1);redrawBankImport();
  },
  'bank-import-close':()=>closeModal(),
  'bank-import-review':()=>{
   if(!BANK_IMPORT_WRITES_ENABLED)return;
   if(!bankImportDraft?.preview)return;
   try{
    bankImportDraft.review=reviewSelection(bankImportDraft.preview,bankImportDraft.decisions,db,{today:today()});
    bankImportDraft.error='';bankImportDraft.step='confirm';bankImportDraft.confirmCreation=false;bankImportDraft.confirmAccount=false;redrawBankImport();
   }catch(error){bankImportDraft.error=error.message;redrawBankImport();}
  },
  'bank-import-back':()=>{
   if(!bankImportDraft?.preview)return;
   bankImportDraft.step='review';bankImportDraft.review=null;bankImportDraft.confirmCreation=false;bankImportDraft.confirmAccount=false;redrawBankImport();
  },
  'bank-import-commit':async ()=>{
   if(!BANK_IMPORT_WRITES_ENABLED)throw Error('A conciliação com gravação está bloqueada nesta versão de prévia.');
   const draft=bankImportDraft;
   if(!draft?.preview||draft.step!=='confirm'||!draft.review)return;
   if(!draft.confirmAccount)throw Error('Confirme que o extrato pertence à conta financeira selecionada.');
   if(draft.review.totals.created>0&&!draft.confirmCreation)throw Error('Confirme expressamente a criação dos lançamentos e o impacto nos saldos.');
   const batchId=uid(),accountId=draft.accountId,parsed=draft.parsed;
   const decisions=structuredClone(draft.decisions);
   // Recompute against the current account data in the optimistic revision save.
   await commit(d=>applyReconciliationBatch(d,parsed,accountId,decisions,{
    propose:proposeReconciliation,batchId,now:new Date().toISOString(),today:today(),makeId:uid
   }),'Importação confirmada. Confira os lançamentos e saldos atualizados.');
  },
  'bank-import-history':el=>openModal('Histórico de conciliações',bankImportHistoryMarkup(db,el.dataset.id)),
  'bank-import-undo':el=>{
   if(!BANK_IMPORT_WRITES_ENABLED)throw Error('A reversão por importação está bloqueada nesta versão de prévia.');
   const batchId=el.dataset.id;
   const batch=(db.bankImportBatches||[]).find(b=>b.id===batchId&&b.status==='active');
   if(!batch)throw Error('Lote já revertido ou não encontrado.');
   confirm('Reverter vínculos de conciliação?',
    batch.entries.some(e=>e.action==='create')?'O lote tem lançamentos criados. Se estiverem intactos, seus títulos e baixas serão estornados juntos, alterando o saldo. Deseja continuar?':'Os vínculos serão revertidos. As baixas e o saldo permanecerão iguais.',
    ()=>commit(d=>{undoReconciliationBatch(d,batchId);},'Reversão concluída. Confira os saldos e o histórico.'));
  },
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
  'profile-signout':()=>{
    const form=document.querySelector('#profile-form');
    const unsaved=!!form&&form.dataset.initialSnapshot!==profileSnapshot(form);
    confirmAction=async()=>{await signOutAccount();};
    const exitIcon='<svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>';
    openModal('Deseja sair da sua conta?',
      '<div class="gb-logout-dialog"><span class="gb-logout-dialog-icon">'+exitIcon+'</span>'+
      '<p>Sua sessão será encerrada neste dispositivo. Seus dados financeiros salvos permanecerão na sua conta.</p>'+
      (unsaved?'<p class="gb-logout-unsaved" role="alert">Você tem alterações não salvas em Minha conta. Elas serão perdidas se sair agora.</p>':'')+
      '<div class="form-error" role="alert"></div>'+
      '<div class="gb-logout-dialog-actions">'+button('Continuar no GB+','close')+
      '<button type="button" class="gb-logout-confirm-button" data-action="confirm">'+exitIcon+' Sair da conta</button></div></div>');
  },
  'profile-change-password':()=>{
    const email=currentUser()?.email;
    if(!email)throw Error('Não foi possível identificar seu e-mail de acesso.');
    confirm('Alterar senha','Vamos enviar um link de redefinição de senha para o e-mail da sua conta. Deseja continuar?',async()=>{
      if(!navigator.onLine)throw Error('Conecte-se à internet para solicitar a alteração de senha.');
      if(emailCooldownSeconds()>0)throw Error('Aguarde '+emailCooldownSeconds()+' segundos antes de solicitar outro e-mail de recuperação.');
      const response=await authClient().auth.resetPasswordForEmail(email,{redirectTo:new URL('./',document.baseURI).href});
      if(response.error)throw Error(authError(response.error));
      markAuthEmailSent();
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
  'settings-reset':()=>openModal('Limpar todos os dados',resetAccountModal(db,!!currentUser())),
  'settings-reset-execute':async()=>{
   const form=modal.querySelector('#gb-reset-form');
   if(!form||!canResetFinancialData(form.elements.confirmation?.value,form.elements.acknowledged?.checked))
    throw Error('Digite LIMPAR e confirme que deseja apagar os registros financeiros.');
   if(currentUser()&&!navigator.onLine)throw Error('Conecte-se para apagar os dados sincronizados com segurança.');
   await commit(d=>clearFinancialDocument(d),'Dados financeiros limpos. Seu login permanece ativo.');
  },
  'settings-delete':()=>openModal('Excluir conta',deleteAccountModal(currentUser())),
  'settings-delete-execute':async()=>{
   const form=modal.querySelector('#gb-delete-form'),user=currentUser();
   if(!user?.id||!user.email)throw Error('Entre na sua conta novamente para solicitar a exclusão.');
   if(!form||!canDeleteAccount(form.elements.confirmation?.value,form.elements.email?.value,user.email,form.elements.acknowledged?.checked))
    throw Error('Digite EXCLUIR, confirme seu e-mail e marque a declaração de segurança.');
   if(!navigator.onLine)throw Error('Conecte-se à internet para excluir a conta.');
   if(busy)throw Error('Aguarde a operação anterior.');
   busy=true;document.body.classList.add('saving');
   const submit=form.querySelector('#gb-delete-execute');
   if(submit)submit.disabled=true;
   try{
    const {data,error}=await authClient().functions.invoke('gbplus-delete-account',{
     body:{confirmation:'EXCLUIR',email:form.elements.email.value.trim()}
    });
    if(error||data?.deleted!==true)throw Error('Não foi possível confirmar a exclusão no servidor. Confira sua conexão e tente novamente ou contate o suporte.');
    // The server has deleted this user's Auth identity and cascaded their data.
    // Remove per-user AI conversation history from this device as well.
    try{localStorage.removeItem('gbplus-ai-chats-v1:'+user.id);}catch{}
    try{localStorage.removeItem('gbplus-first-steps-dismissed:'+user.id);}catch{}
    try{await authClient().auth.signOut({scope:'local'});}catch{}
    try{sessionStorage.removeItem('gbplus-recovery');}catch{}
    location.replace('./?web=1');
   }finally{
    busy=false;document.body.classList.remove('saving');
    if(submit?.isConnected)syncAccountDangerConfirm(form,currentUser(),busy);
   }
  },
  customize:()=>openModal('Personalizar painel',customizeForm(db)),
  'customize-mobile-nav':()=>openModal('Personalizar barra de ações',customMobileNavForm(db)),
  'reset-mobile-nav':()=>{
   const form=modal.querySelector('#mobile-nav-form');
   if(!form)return;
   defaultMobileNav().forEach((value,i)=>{form.elements.namedItem('slot'+i).value=value;});
   updateMobileNavPreview(form);
  },
  'onboarding-dismiss':()=>{
   const id=currentUser()?.id;if(!id)return;
   firstStepsIgnored.add(id);
   try{localStorage.setItem('gbplus-first-steps-dismissed:'+id,'1');}catch{}
   render();
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
     d.accounts.push({id:uid(),name:draft.name.trim(),bank:draft.bank.trim(),bankId:draft.bankId||'',branch:draft.branch.trim(),number:draft.number.trim(),initial:draft.initial,active:true});
    }
    d.settings.theme=draft.theme;
    d.settings.setupCompleted=true;
   },'Configuração inicial concluída. Seu GB+ está pronto!');
   setupDraft=null;
  },
  'reset-panel':()=>{modal.querySelectorAll('input[type="checkbox"]').forEach(el=>el.checked=true);},
  'delete-title':el=>{const t=getTitle(el.dataset.id);if(t.cardInvoice)throw Error('Exclua as compras vinculadas ao cartão para ajustar a fatura.');if(db.payments.some(p=>p.titleId===t.id))throw Error('Estorne as baixas antes de excluir este título.');confirm('Excluir título?',`O lançamento “${t.description}” será removido. Os outros títulos da série serão mantidos.`,()=>commit(d=>{d.titles=d.titles.filter(x=>x.id!==t.id);},'Título excluído.'));},
  'delete-partner':el=>{const id=el.dataset.id;if(db.titles.some(t=>t.partnerId===id))throw Error('Este parceiro possui títulos. Altere sua situação para inativo para preservar o histórico.');confirm('Excluir parceiro?','O cadastro será removido.',()=>commit(d=>{d.partners=d.partners.filter(p=>p.id!==id);},'Parceiro excluído.'));},
  'delete-category':el=>{const id=el.dataset.id;if(db.titles.some(t=>t.categoryId===id))throw Error('Esta categoria está vinculada a títulos e não pode ser excluída.');confirm('Excluir categoria?','A categoria será removida.',()=>commit(d=>{d.categories=d.categories.filter(c=>c.id!==id);},'Categoria excluída.'));},
  'delete-account':el=>{const id=el.dataset.id;if((db.cards||[]).some(card=>card.payAccountId===id))throw Error('Esta conta é a conta de pagamento prevista de um cartão. Altere o cartão antes de excluí-la.');if(db.titles.some(t=>t.accountId===id)||db.payments.some(p=>p.accountId===id)||db.transfers.some(t=>t.from===id||t.to===id))throw Error('Esta conta tem vínculos. Marque-a como inativa para manter o histórico.');if((db.bankImportBatches||[]).some(b=>b.accountId===id))throw Error('Esta conta possui histórico de conciliações. Marque-a como inativa para preservá-lo.');confirm('Excluir conta?','A conta e seu saldo inicial serão removidos.',()=>commit(d=>{d.accounts=d.accounts.filter(a=>a.id!==id);},'Conta excluída.'));},
  'undo-payment':el=>{const id=el.dataset.id;confirm('Estornar baixa?','A baixa será removida, o valor voltará a ficar pendente e o saldo da conta será recalculado.',()=>commit(d=>{d.payments=d.payments.filter(p=>p.id!==id);},'Baixa estornada.'));},
  'undo-transfer':el=>{const id=el.dataset.id;confirm('Estornar transferência?','A movimentação será removida das duas contas.',()=>commit(d=>{d.transfers=d.transfers.filter(t=>t.id!==id);},'Transferência estornada.'));},
  'save-generation':()=>{if(!pendingGeneration||busy)return;const generated=pendingGeneration;return commit(d=>{
   if(generated.some(t=>d.titles.some(x=>!x.cancelled&&x.type===t.type&&x.description===t.description&&x.due===t.due&&x.amount===t.amount&&x.partnerId===t.partnerId)))
    throw Error('Já existe um título igual (descrição, parceiro, valor e vencimento). Revise para evitar duplicidade.');
   d.titles.push(...generated);
   if(generated.settlement){
    if(generated.length!==1||generated[0].mode!=='single')throw Error('Baixa imediata somente para lançamento único.');
    addPayment(d,{titleId:generated[0].id,accountId:generated.settlement.accountId,date:generated.settlement.date,amount:generated[0].amount});
   }
  },generated.settlement?'Lançamento criado e baixado. Saldo atualizado.':`${generated.length} título(s) criado(s) pendente(s).`);},
  'back-generation':()=>{if(pendingGeneration?.formHTML){openModal('Novo lançamento',pendingGeneration.formHTML);pendingGeneration=null;}},
  granularity:el=>{state.granularity=el.dataset.value;render();},
  'flow-chart-mode':el=>{const mode=el.dataset.mode;if(!['bars','lines','net'].includes(mode))return;state.flowChartMode=mode;render();},
  'flow-status':el=>{const next=el.dataset.value;if(!['all','paid','pending'].includes(next))return;state.flowStatus=next;render();},
  'choose-bank':el=>{
   const select=el.closest('.gb-bank-picker')?.querySelector('select[name="bankId"]');
   if(!select||!findBank(db,el.dataset.bankId))return;
   select.value=el.dataset.bankId;
   select.dispatchEvent(new Event('change',{bubbles:true}));
  },
  search:()=>{state.query='';location.hash='titles';if(state.route==='titles')render();requestAnimationFrame(()=>document.querySelector('#title-search')?.focus());},
  notifications:()=>{location.hash='notifications';if(state.route==='notifications')render();},
  'mobile-menu':()=>openModal('Seu financeiro',`<nav class="menu-grid">${routes.map(([key,label,ico])=>`<a href="#${key}" data-action="close">${icon(ico)}${label}</a>`).join('')}</nav><div class="local-note">${icon('info')} ${currentUser()?'Conta online · use o mesmo login em seus dispositivos.':'Dados locais, sem sincronização entre dispositivos.'}</div>`),
  'legacy-backup':()=>{if(!currentUser())return;const raw=localStorage.getItem(KEY);if(!raw){toast('Não há registros locais antigos neste navegador.');return;}download('gb-plus-local-original.json',raw,'application/json');toast('Cópia local exportada. Seus dados online não foram alterados.');},
  backup:()=>{download(`gb-plus-backup-${today()}.json`,backupText(db),'application/json');toast('Backup exportado. Guarde-o em um local seguro.');},
  restore:()=>document.querySelector('#backup-input').click(),
  'export-titles':()=>{const rows=filteredTitles(db,state);download(`gb-plus-titulos-${today()}.csv`,csv([['Descrição','Tipo','Parceiro','Categoria','Documento','Emissão','Vencimento','Valor (R$)','Pendente (R$)'],...rows.map(t=>[t.description,t.type==='income'?'Receita':'Despesa',db.partners.find(p=>p.id===t.partnerId)?.name||'',db.categories.find(c=>c.id===t.categoryId)?.name,t.document,dateLabel(t.issue),dateLabel(t.due),(t.amount/100).toFixed(2).replace('.',','),(pending(db,t)/100).toFixed(2).replace('.',',')])]),'text/csv;charset=utf-8');},
  'export-flow':()=>download(`gb-plus-fluxo-${today()}.csv`,csv([['Período','Entradas previstas','Saídas previstas','Entradas realizadas','Saídas realizadas'],...filterFlowRows(flow(db,state.range,state.granularity),state.flowStatus).map(r=>[dateLabel(r.date),...[r.expectedIn,r.expectedOut,r.actualIn,r.actualOut].map(v=>(v/100).toFixed(2).replace('.',','))])]),'text/csv;charset=utf-8'),
  'export-report':()=>download(`gb-plus-relatorio-${state.report}-${today()}.csv`,csv(reportData(db,state)),'text/csv;charset=utf-8'),
  install:()=>{if(isInstalledApp()){toast('GB+ já está instalado neste dispositivo.');return;}if(matchMedia('(max-width:760px) and (pointer:coarse)').matches){location.assign('./instalar.html');return;}showInstallHelp();},
};
document.addEventListener('click',async e=>{const el=e.target.closest('[data-action]');if(!el||!db)return;if(el.tagName==='BUTTON')e.preventDefault();try{await actions[el.dataset.action]?.(el);}catch(error){fail(error);}});
// Keyboard access for the unified Contas/Cartões tabs, no changes to other screens.
document.addEventListener('keydown',e=>{
 const current=e.target?.closest?.('.gb-finance-tab');
 if(!current||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 e.preventDefault();
 let next=e.key==='Home'?'accounts':e.key==='End'?'cards':
  state.accountCardsTab==='accounts'?'cards':'accounts';
 if(next!==state.accountCardsTab)actions['accounts-cards-tab']({dataset:{tab:next}});
});

document.addEventListener('click',e=>{if(!e.target.closest('.gb-entry-select'))closeEntryMenus();});
// User-selected file bytes stay local and are discarded with the modal.
document.addEventListener('change',async e=>{
 const el=e.target;
 if(['gb-reset-form','gb-delete-form'].includes(el.form?.id))syncAccountDangerConfirm(el.form,currentUser(),busy);
 if(!bankImportDraft||!modal.open||!el?.closest?.('#modal'))return;
 const draft=bankImportDraft;
 if(el.matches?.('[data-bank-select-index]')){
  if(!draft.preview||draft.step!=='review')return;
  const index=Number(el.dataset.bankSelectIndex),row=draft.preview.rows[index];
  if(!Number.isSafeInteger(index)||!row||row.index!==index||row.status==='possible_duplicate_in_file')return;
  if(knownReconciliationKeys(db,draft.accountId).has(reconciliationRecordKey(row.record)))return;
  const selected=new Set(draft.selectedRows||[]);
  if(el.checked)selected.add(index);else selected.delete(index);
  draft.selectedRows=[...selected].sort((a,b)=>a-b);draft.error='';redrawBankImport();return;
 }
 if(el.id==='gb-import-bulk-action'){
  if(!draft.preview||draft.step!=='review'||!['','pending','ignore','create'].includes(el.value))return;
  draft.bulkAction=el.value;draft.bulkCategory='';draft.error='';redrawBankImport();return;
 }
 if(el.id==='gb-import-bulk-category'){
  if(!draft.preview||draft.step!=='review')return;
  draft.bulkCategory=el.value;draft.error='';return;
 }
 if(el.id==='gb-import-account'){
  const id=el.value;
  if(!(db.accounts||[]).some(a=>a.id===id&&a.active!==false))return;
  draft.accountId=id;
  if(draft.parsed)draft.preview=proposeReconciliation(draft.parsed,db,id);
  draft.filter='all';draft.page=0;draft.decisions={};draft.selectedRows=[];draft.bulkAction='';draft.bulkCategory='';draft.review=null;draft.confirmCreation=false;draft.confirmAccount=false;draft.step=draft.csvMapping&&!draft.preview?'mapping':'review';redrawBankImport();return;
 }

 if(el.matches?.('[data-bank-map-field]')){
  if(draft.step!=='mapping'||!draft.csvMapping)return;
  const field=el.dataset.bankMapField;
  if(!['date','description','amount','credit','debit','kind','id','balance'].includes(field))return;
  draft.csvMapping.columns[field]=el.value===''?-1:Number(el.value);
  draft.error='';return;
 }
 if(el.matches?.('[data-bank-map-mode]')){
  if(draft.step!=='mapping'||!draft.csvMapping||!['amount','split'].includes(el.value))return;
  draft.csvMapping.mode=el.value;draft.error='';redrawBankImport();return;
 }
 if(el.matches?.('[data-bank-review-index]')){
  if(!draft.preview||draft.step!=='review')return;
  const index=Number(el.dataset.bankReviewIndex);
  if(!Number.isInteger(index)||!draft.preview.rows[index])return;
  if(el.value==='skip')delete draft.decisions[index];
  else if(['link','ignore','pending','create'].includes(el.value))draft.decisions[index]={action:el.value,target:'',...(el.value==='create'?{categoryId:'',description:draft.preview.rows[index].record.description.slice(0,300)}:{})};
  draft.selectedRows=(draft.selectedRows||[]).filter(i=>i!==index);
  draft.review=null;draft.confirmCreation=false;draft.error='';redrawBankImport();return;
 }
 if(el.matches?.('[data-bank-create-category]')){
  if(!draft.preview||draft.step!=='review')return;
  const index=Number(el.dataset.bankCreateCategory),choice=draft.decisions[index];
  if(!Number.isInteger(index)||choice?.action!=='create')return;
  choice.categoryId=el.value;draft.review=null;draft.confirmCreation=false;draft.error='';return;
 }
 if(el.id==='gb-import-account-confirm'){
  if(draft.step!=='confirm')return;
  draft.confirmAccount=Boolean(el.checked);redrawBankImport();return;
 }
 if(el.id==='gb-import-create-confirm'){
  if(draft.step!=='confirm')return;
  draft.confirmCreation=Boolean(el.checked);
  redrawBankImport();return;
 }
 if(el.matches?.('[data-bank-review-target]')){
  if(!draft.preview||draft.step!=='review')return;
  const index=Number(el.dataset.bankReviewTarget),choice=draft.decisions[index];
  if(!Number.isInteger(index)||!draft.preview.rows[index]||choice?.action!=='link')return;
  const valid=draft.preview.rows[index].candidates.some(c=>c.type+':'+c.id===el.value);
  choice.target=valid?el.value:'';
  draft.review=null;draft.error='';return;
 }
 if(el.id!=='gb-import-file')return;
 const file=el.files?.[0];
 if(!file)return;
 draft.error='';
 try{
  const contents=await readBankFileText(file);
  if(draft!==bankImportDraft||!modal.open)return;
  const isCsv=/\.(csv|txt)$/i.test(file.name);
  const mapping=isCsv?inspectBankCsv(contents):null;
  draft.csvSource=isCsv?contents:null;
  draft.csvMapping=mapping;
  draft.filename=file.name.slice(0,140);
  try{
   const parsed=parseBankStatement(contents,file.name);
   const preview=proposeReconciliation(parsed,db,draft.accountId);
   draft.parsed=parsed;draft.preview=preview;draft.accountHint=parsed.accountHint||'';
   Object.assign(draft,{error:'',filter:'all',page:0,decisions:{},selectedRows:[],bulkAction:'',bulkCategory:'',review:null,confirmCreation:false,confirmAccount:false,step:'review'});
  }catch(parseError){
   if(!mapping)throw parseError;
   Object.assign(draft,{parsed:null,preview:null,step:'mapping',error:'Colunas não reconhecidas automaticamente. Selecione as correspondências para conferir o arquivo.'});
  }
 }catch(error){
  if(draft!==bankImportDraft||!modal.open)return;
  Object.assign(draft,{parsed:null,preview:null,csvSource:null,csvMapping:null,filename:'',accountHint:'',error:error?.message||'Não foi possível ler o extrato.'});
 }
 if(draft===bankImportDraft&&modal.open)redrawBankImport();
});
document.addEventListener('change',e=>{
 if(e.target?.matches?.('select[name="bankId"]')&&db)syncBankPicker(e.target.closest('.gb-bank-picker'),db);
});
document.addEventListener('input',e=>{
 if(bankImportDraft?.step==='review'&&e.target?.matches?.('[data-bank-create-description]')){
  const index=Number(e.target.dataset.bankCreateDescription),choice=bankImportDraft.decisions[index];
  if(choice?.action==='create'){
   choice.description=e.target.value;
   bankImportDraft.review=null;bankImportDraft.confirmCreation=false;bankImportDraft.error='';
  }
  return;
 }
 if(!db)return;
 if(e.target?.matches?.('.gb-bank-search')){
  filterBankPicker(e.target.closest('.gb-bank-picker'),e.target.value);
 }
 if(e.target?.matches?.('.gb-bank-directory-search-input')){
  filterBankDirectory(document.querySelector('#main'),db,e.target.value);
 }
});
document.addEventListener('keydown',e=>{
 if(e.key!=='Enter'||!e.target?.matches?.('.gb-bank-search'))return;
 e.preventDefault();
 const first=e.target.closest('.gb-bank-picker')?.querySelector('.gb-bank-shortcut:not([hidden])');
 if(first)first.click();
});
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
   const name=String(v.name||'').trim(),bankId=String(v.bankId||''),manualBank=String(v.bank||'').trim();
   const bank=bankId?bankName(db,bankId):manualBank,branch=String(v.branch||'').trim(),number=String(v.number||'').trim();
   if(bankId&&!findBank(db,bankId))throw Error('Selecione uma instituição válida.');
   if(!name||name.length>120||bank.length>120||branch.length>80||number.length>80)throw Error('Confira o nome e os dados da conta.');
   Object.assign(setupDraft,{createAccount:true,name,bank,bankId,branch,number});
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
  if(form.id==='title-form'){
   if(form.dataset.step!=='3')throw Error('Conclua as três etapas do lançamento.');
   validateEntryStepOne(form);
   validateEntryStepTwo(form);
   validateEntryStepThree(form);
   const serviceId=v.type==='expense'?String(v.serviceId||''):'';
   if(serviceId&&!serviceById(serviceId)&&serviceId!=='custom')throw Error('Serviço inválido.');
   const serviceName=serviceId==='custom'?String(v.serviceName||'').trim():'';
   if(serviceId==='custom'&&(!serviceName||serviceName.length>120))throw Error('Informe o nome do serviço.');
   const description=serviceId?serviceDisplayName(serviceId,serviceName,''):v.description.trim();
   const isPaid=!id&&v.settlement==='paid';
   const input={type:v.type,description,categoryId:v.categoryId,partnerId:v.partnerId||'',
    document:v.document.trim(),issue:v.issue,due:v.due,amount:cents(v.amount),
    accountId:isPaid?v.settleAccountId:(v.accountId||''),notes:v.notes.trim(),serviceId,serviceName,
    paymentMethod:v.paymentMethod==='debit'?'debit':'account'};
   if(id){
    const original=getTitle(id);
    const businessDays=original.mode!=='single'&&v.businessDays==='true';
    await commit(d=>updateTitle(d,id,{...input,cancelled:v.cancelled==='true',businessDays},v.scope==='future'));
    return;
   }
   const businessDays=v.mode!=='single'&&v.businessDays==='true';
   const generated=generateTitles(input,v.mode,v.mode==='single'?1:Number(v.count),{businessDays});
   if(isPaid)generated.settlement={accountId:v.settleAccountId,date:v.settleDate};
   const clone=form.cloneNode(true);
   const originals=[...form.querySelectorAll('input,select,textarea')],destinations=[...clone.querySelectorAll('input,select,textarea')];
   originals.forEach((el,i)=>{
    const dest=destinations[i];if(!dest)return;
    if(el.tagName==='SELECT'){[...dest.options].forEach(o=>o.toggleAttribute('selected',o.value===el.value));}
    else if(el.type==='checkbox')dest.toggleAttribute('checked',el.checked);
    else if(el.tagName==='TEXTAREA')dest.textContent=el.value;
    else dest.setAttribute('value',el.value);
   });
   generated.formHTML=clone.outerHTML;
   pendingGeneration=generated;
   const shifted=generated.filter(t=>t.shiftedToBusinessDay).length;
   const accountName=isPaid?db.accounts.find(a=>a.id===v.settleAccountId)?.name||'':'';
   openModal('Revise antes de confirmar',
    '<div class="preview-summary"><span>'+generated.length+' título(s) · '+
    (v.mode==='installment'?'Parcelado':v.mode==='recurring'?'Recorrente':'Único')+
    '</span><strong>'+money(generated.reduce((sum,t)=>sum+t.amount,0))+
    '</strong><p>Valor total da operação</p></div>'+
    (businessDays?'<p class="gb-entry-review-note">Somente dias úteis nacionais. '+shifted+
    ' vencimento(s) ajustado(s) ao próximo dia útil.</p>':'')+
    (isPaid?'<p class="gb-entry-review-note">Baixa imediata de '+money(input.amount)+' em '+esc(accountName)+
     ', em '+dateLabel(v.settleDate)+'. O saldo bancário será alterado na confirmação.</p>':
     '<p class="gb-entry-review-note">Os lançamentos serão criados como pendentes, sem movimentar o saldo.</p>')+
    '<div class="preview-list">'+generated.map(t=>
     '<div><span>'+esc(t.description)+(t.count>1?' · '+t.sequence+'/'+t.count:'')+
     '<small>'+dateLabel(t.due)+(t.shiftedToBusinessDay?' · ajustado do dia '+dateLabel(t.originalDue):'')+
     '</small></span><b>'+money(t.amount)+'</b></div>').join('')+'</div>'+
    '<div class="form-error" role="alert"></div><div class="form-footer">'+
    button('Voltar','back-generation')+button('Confirmar geração','save-generation','primary')+'</div>');
  }
  else if(form.id==='partner-form'){const roles=new FormData(form).getAll('roles');if(!roles.length)throw Error('Selecione ao menos uma classificação.');const row={...v,id:id||uid(),name:v.name.trim(),active:v.active==='true',roles};await commit(d=>{if(row.document&&d.partners.some(p=>p.id!==row.id&&p.document.replace(/\D/g,'')===row.document.replace(/\D/g,'')))throw Error('Já existe um parceiro com este CPF/CNPJ.');upsert(d.partners,row);});}
  else if(form.id==='account-form'){
   const bank= v.bankId?findBank(db,v.bankId):null;
   if(v.bankId&&!bank)throw Error('Selecione um banco válido.');
   const chosen=bank?bank.name:String(v.bank||'').trim();
   const {bankLookup,...accountFields}=v; // A consulta de busca nunca é gravada junto à conta.
   await commit(d=>upsert(d.accounts,{...accountFields,id:id||uid(),name:v.name.trim(),bankId:bank?.id||'',bank:chosen,initial:cents(v.initial),active:v.active==='true'}));
  }
  else if(form.id==='bank-form'){
   const name=String(v.name||'').trim();
   if(!name||name.length>120||!/^#[0-9a-f]{6}$/i.test(v.color))throw Error('Informe um nome e uma cor válidos.');
   await commit(d=>{
    if(bankCatalog(d).some(b=>b.id!==id&&b.name.trim().toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')))throw Error('Já existe uma instituição com esse nome.');
    if(!Array.isArray(d.banks))d.banks=[];
    upsert(d.banks,{id:id||uid(),name,color:v.color});
   },'Instituição personalizada salva.');
  }
  else if(form.id==='card-form'){
   const row={id:id||uid(),name:String(v.name||'').trim(),bankId:String(v.bankId||''),payAccountId:String(v.payAccountId||''),last4:String(v.last4||'').trim(),
    limit:cents(v.limit),closingDay:Number(v.closingDay),dueDay:Number(v.dueDay),active:v.active==='true'};
   if(!row.name||row.name.length>120||row.limit<=0||!Number.isInteger(row.closingDay)||row.closingDay<1||row.closingDay>28||!Number.isInteger(row.dueDay)||row.dueDay<1||row.dueDay>28||row.last4&&!/^\d{4}$/.test(row.last4))throw Error('Confira nome, limite, final e dias do cartão.');
   if(row.bankId&&!findBank(db,row.bankId))throw Error('Selecione uma instituição válida.');
   if(row.payAccountId&&!db.accounts.some(a=>a.id===row.payAccountId))throw Error('Selecione uma conta financeira válida para o cartão.');
   await commit(d=>{
    if(!Array.isArray(d.cards))d.cards=[];
    ensureCardMayChange(d,id,row);
    if(d.cards.some(c=>c.id!==row.id&&c.name.toLocaleLowerCase('pt-BR')===row.name.toLocaleLowerCase('pt-BR')))throw Error('Já existe um cartão com esse nome.');
    upsert(d.cards,row);
   },'Cartão atualizado. Limite e vencimentos configurados.');
  }
  else if(form.id==='card-purchase-form'){
   const amount=cents(v.amount),count=Number(v.count||1);
   if(!Number.isInteger(count)||count<1||count>36)throw Error('Informe de 1 a 36 parcelas.');
   await commit(d=>addCardPurchase(d,{cardId:v.cardId,date:v.date,amount,description:v.description,categoryId:v.categoryId,partnerId:v.partnerId,count}),
    'Compra registrada. As faturas correspondentes foram atualizadas.');
  }
  else if(form.id==='forecast-scenario-form'){
   const title=db.titles.find(t=>t.id===v.titleId&&pending(db,t)>0);
   if(!title||!validDate(v.due))throw Error('Selecione um título em aberto e uma data válida.');
   const result=forecastResult(db,forecastDays,title.id,v.due);
   openModal('Resultado da simulação',result+'<div class="form-footer">'+button('Voltar à previsão','close','primary')+'</div>');
  }
  else if(form.id==='category-form'){if(!CATEGORY_ICON_OPTIONS.some(([key])=>key===v.icon))throw Error('Escolha um ícone válido para a categoria.');await commit(d=>{const row={...v,id:id||uid(),name:v.name.trim()};if(d.categories.some(c=>c.id!==row.id&&c.type===row.type&&c.name.toLowerCase()===row.name.toLowerCase()))throw Error('Já existe uma categoria com este nome e tipo.');if(id&&d.titles.some(t=>t.categoryId===id&&t.type!==v.type))throw Error('Não é possível alterar o tipo de uma categoria em uso.');upsert(d.categories,row);});}
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
  if(el.form?.id==='title-form'&&['mode','scope','count','due','businessDays'].includes(el.name))refreshEntrySchedule(el.form);
  if(el.name?.startsWith('slot')&&el.form?.id==='mobile-nav-form')updateMobileNavPreview(el.form);
  if(el.id==='entry-type'){
   const select=el.form?.querySelector('#entry-category');
   if(select){
    select.innerHTML=db.categories.filter(c=>c.type===el.value).map(c=>
     `<option value="${esc(c.id)}" data-icon="${esc(categoryIconFor(c))}">${esc(c.name)}</option>`).join('');
    syncEntrySelect(select);
   }
   syncEntryServiceCategory(el.form);
   const credit=el.form?.querySelector('.gb-credit-entry-link');if(credit)credit.hidden=el.value!=='expense';
   const refund=el.form?.querySelector('.gb-entry-refund-hint');if(refund)refund.hidden=el.value!=='income';
  }
  if(el.id==='entry-category')syncEntryServiceCategory(el.form);
  if(el.id==='gb-service-group')filterServicesInForm(el.closest('#title-form'));
  if(el.id==='entry-mode'){refreshEntrySchedule(el.form);syncEntrySettlement(el.form);}
  if(el.form?.id==='title-form'&&el.name==='settlement')syncEntrySettlement(el.form);
  if(el.id==='period'){if(el.value==='custom'){openModal('Escolher período',`<form id="period-form"><div class="form-grid">${field('De','from',state.range.from||today(),'date','required')}${field('Até','to',state.range.to||today(),'date','required')}</div>${formFooter('Aplicar período')}</form>`);el.value=state.period;}else{state.period=el.value;state.range=rangeFor(el.value);state.launchSelected=[];state.launchStatusOpen=false;render();}}
  if(el.dataset.filter){state[el.dataset.filter]=el.value;if(['partner','category'].includes(el.dataset.filter))state.moreFilters=true;state.launchSelected=[];render();}
  if(el.id==='report-type'){state.report=el.value;render();}
  if(el.id==='report-partner'){state.reportPartner=el.value;render();}
  if(el.id==='backup-input'&&el.files[0]){const file=el.files[0];el.value='';if(file.size>15*1024*1024)throw Error('O backup deve ter no máximo 15 MB.');const restored=parseBackup(await file.text());confirm('Restaurar backup?',`Este arquivo contém ${restored.titles.length} títulos, ${restored.partners.length} parceiros e ${restored.accounts.length} contas. Os registros atuais serão substituídos. Exporte um backup antes de continuar, se necessário.`,()=>commit(d=>{Object.keys(d).forEach(k=>delete d[k]);Object.assign(d,restored);},'Backup restaurado com sucesso.'));}
}catch(error){fail(error);}});
document.addEventListener('input',e=>{if(e.target.id==='entry-amount')fitEntryAmount(e.target);if(e.target.form?.id==='title-form'&&e.target.name==='serviceName'&&e.target.form.elements.serviceId?.value==='custom')e.target.form.elements.description.value=e.target.value.trim();if(['gb-reset-form','gb-delete-form'].includes(e.target.form?.id))syncAccountDangerConfirm(e.target.form,currentUser(),busy);if(e.target.id==='gb-service-search')filterServicesInForm(e.target.closest('#title-form'));if(e.target.form?.id==='title-form'&&['amount','count','due'].includes(e.target.name))refreshEntrySchedule(e.target.form);if(e.target.form?.id==='profile-form'){
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
modal.addEventListener('cancel',()=>{bankImportDraft=null;pendingGeneration=null;confirmAction=null;});
modal.addEventListener('close',()=>{if(!modal.open)bankImportDraft=null;modal.classList.remove('gb-bank-import-modal');});

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
  if(!user){const sessionNotice=consumeSessionNotice();showAuth('signin',loginReturnMessage||sessionNotice);return;}
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
import('./ai-bridge.js?v=20261105-47').then(({installAiBridge})=>{
 installAiBridge({getDb:()=>db,getUser:currentUser,getRepository:()=>repository,commit,openEditor:titleId=>{
   if(!db||!currentUser())throw Error('É necessário estar conectado para editar este título.');
   const title=getTitle(titleId);
   document.querySelector('.gb-ai-widget').open=false;
   openModal('Editar lançamento',titleForm(db,title));
  }});
 window.dispatchEvent(new Event('gbplus-ai-ready'));
}).catch(error=>console.error('Assistente GB+ indisponível; financeiro preservado.',error));
