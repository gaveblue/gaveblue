import {uid,today,money,dateLabel,cents,generateTitles,addPayment,transfer,updateTitle,pending,flow,within} from './domain.js';
import {LocalRepository,KEY,INDICATORS,defaultPanel,parseBackup,backupText} from './store.js';
import {esc,icon,button,field,formFooter,download,csv,titleTable} from './ui.js';
import {routes,dashboard,titlesView,partnersView,accountsView,categoriesView,flowView,reportsView,settingsView,filteredTitles,reportData} from './views.js';
import {titleForm,partnerForm,accountForm,categoryForm,paymentForm,transferForm,titleDetail,customizeForm,accountDetail} from './forms.js';
import {SupabaseRepository} from '../integrations/supabase/repository.js';
import {initializeAuth,authClient,currentUser,onlineSelected,accountCard,showAuth,isRecovery} from './auth.js';
let repository=new LocalRepository();let db;let busy=false;let pendingGeneration=null;let confirmAction=null;let installPrompt=null;
const state={route:'dashboard',period:'month',range:{},query:'',status:'',type:'',partner:'',category:'',partnerQuery:'',granularity:'month',report:'payable',reportPartner:''};
const modal=document.querySelector('#modal');
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),4500);}
function openModal(title,content){document.querySelector('#modal-content').innerHTML=`<div class="modal-heading"><h2 id="modal-title">${title}</h2><button class="icon-button" data-action="close" aria-label="Fechar">${icon('close')}</button></div><div class="modal-body">${content}</div>`;modal.setAttribute('aria-labelledby','modal-title');if(!modal.open)modal.showModal();}
function closeModal(){modal.close();pendingGeneration=null;confirmAction=null;}
function confirm(title,message,callback){confirmAction=callback;openModal(title,`<p class="confirm-message">${esc(message)}</p><div class="form-error" role="alert"></div><div class="form-footer">${button('Cancelar','close')}${button('Confirmar','confirm','primary')}</div>`);}
function rangeFor(period){const now=today();const [y,m]=now.split('-').map(Number);const date=(y,m,d)=>`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;if(period==='all')return {from:'',to:''};if(period==='year')return {from:`${y}-01-01`,to:`${y}-12-31`};const dt=new Date(y,m-1-(period==='last'?1:0),1);const yy=dt.getFullYear(),mm=dt.getMonth()+1;return {from:date(yy,mm,1),to:date(yy,mm,new Date(yy,mm,0).getDate())};}
async function commit(mutator,message='Salvo com sucesso.'){if(!db)throw Error('Entre ou abra o modo local antes de continuar.');if(busy)throw Error('Aguarde a gravação atual.');busy=true;document.body.classList.add('saving');try{const draft=structuredClone(db);await mutator(draft);db=await repository.save(draft);closeModal();render();toast(message);}finally{busy=false;document.body.classList.remove('saving');}}
function render(){if(!db)return;document.documentElement.dataset.theme=db.settings.theme;document.querySelector('meta[name="theme-color"]').content=db.settings.theme==='dark'?'#111214':'#f6f6f8';document.querySelector('#navigation').innerHTML=routes.map(([key,label,ico])=>`<a href="#${key}" class="nav-item ${state.route===key?'active':''}" ${state.route===key?'aria-current="page"':''}>${icon(ico)}<span>${label}</span>${key==='payable'&&db.titles.some(t=>t.type==='expense'&&pending(db,t)>0)?`<span class="nav-count">${db.titles.filter(t=>t.type==='expense'&&pending(db,t)>0).length}</span>`:''}</a>`).join('');document.querySelector('#breadcrumb').textContent=routes.find(r=>r[0]===state.route)?.[1]||'Visão geral';document.querySelector('.theme-button').innerHTML=`${icon(db.settings.theme==='light'?'moon':'sun')}<span>Modo ${db.settings.theme==='light'?'escuro':'claro'}</span><span class="theme-switch"></span>`;document.querySelector('[data-action="search"]').innerHTML=icon('search');document.querySelector('[data-action="notifications"]').innerHTML=icon('bell');document.querySelector('#mobile-navigation').innerHTML=[['dashboard','Início','home'],['titles','Títulos','transfer'],['new','Novo','plus'],['partners','Parceiros','people'],['menu','Menu','menu']].map(([key,label,ico])=>key==='new'||key==='menu'?`<button data-action="${key==='new'?'new-title':'mobile-menu'}" class="${key==='new'?'mobile-new':''}">${icon(ico)}<span>${label}</span></button>`:`<a href="#${key}" class="${state.route===key?'active':''}">${icon(ico)}<span>${label}</span></a>`).join('');const views={dashboard:()=>dashboard(db,state),titles:()=>titlesView(db,state),payable:()=>titlesView(db,state),receivable:()=>titlesView(db,state),partners:()=>partnersView(db,state),accounts:()=>accountsView(db),categories:()=>categoriesView(db),flow:()=>flowView(db,state),provisions:()=>flowView(db,state),reports:()=>reportsView(db,state),settings:()=>settingsView(db,!!installPrompt,!!currentUser())};document.querySelector('#main').innerHTML=(views[state.route]||views.dashboard)();if(state.route==='settings')document.querySelector('.settings-grid').insertAdjacentHTML('afterbegin',accountCard());updateConnection();if(state.route==='dashboard')applyPanel();}
function applyPanel(){const device=matchMedia('(max-width: 760px)').matches?'mobile':'desktop';document.querySelectorAll('[data-indicator]').forEach(el=>{el.hidden=!db.settings.panel[device][el.dataset.indicator];});document.querySelectorAll('.dashboard-middle,.results-grid,.stats-grid').forEach(el=>el.hidden=![...el.children].some(x=>!x.hidden));}
function route(){if(!db)return;const next=location.hash.slice(1);if(next==='main'&&document.querySelector('#main').childElementCount)return;state.route=routes.some(r=>r[0]===next)?next:'dashboard';state.type=state.route==='payable'?'expense':state.route==='receivable'?'income':'';closeModal();render();window.scrollTo(0,0);}
function formValues(form){return Object.fromEntries(new FormData(form));}
function getTitle(id){const t=db.titles.find(t=>t.id===id);if(!t)throw Error('Título não encontrado.');return t;}
function fail(error){if(currentUser()&&['SESSION','CONFLICT','SAVE','RELOAD'].includes(error.code)){document.querySelector('#sync-alert').hidden=false;}const area=modal.open?modal.querySelector('.form-error'):null;if(area){area.textContent=error.message;area.scrollIntoView({block:'nearest'});}else toast(error.message||'Não foi possível concluir a operação.');}
const actions={
  close:closeModal,
  confirm:async()=>{const fn=confirmAction;if(fn&&!busy){confirmAction=null;try{await fn();}catch(e){confirmAction=fn;throw e;}}},
  theme:()=>commit(d=>{d.settings.theme=d.settings.theme==='light'?'dark':'light';},'Tema atualizado.'),
  'set-theme':el=>commit(d=>{d.settings.theme=el.dataset.value;},'Tema atualizado.'),
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
  customize:()=>openModal('Personalizar painel',customizeForm(db)),
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
  notifications:()=>{state.status='late';state.period='all';state.range=rangeFor('all');location.hash='titles';if(state.route==='titles')render();},
  'mobile-menu':()=>openModal('Seu financeiro',`<nav class="menu-grid">${routes.map(([key,label,ico])=>`<a href="#${key}" data-action="close">${icon(ico)}${label}</a>`).join('')}</nav><div class="local-note">${icon('info')} ${currentUser()?'Conta online · use o mesmo login em seus dispositivos.':'Dados locais, sem sincronização entre dispositivos.'}</div>`),
  backup:()=>{download(`gb-plus-backup-${today()}.json`,backupText(db),'application/json');toast('Backup exportado. Guarde-o em um local seguro.');},
  restore:()=>document.querySelector('#backup-input').click(),
  'export-titles':()=>{const rows=filteredTitles(db,state);download(`gb-plus-titulos-${today()}.csv`,csv([['Descrição','Tipo','Parceiro','Categoria','Documento','Emissão','Vencimento','Valor (R$)','Pendente (R$)'],...rows.map(t=>[t.description,t.type==='income'?'Receita':'Despesa',db.partners.find(p=>p.id===t.partnerId)?.name||'',db.categories.find(c=>c.id===t.categoryId)?.name,t.document,dateLabel(t.issue),dateLabel(t.due),(t.amount/100).toFixed(2).replace('.',','),(pending(db,t)/100).toFixed(2).replace('.',',')])]),'text/csv;charset=utf-8');},
  'export-flow':()=>download(`gb-plus-fluxo-${today()}.csv`,csv([['Período','Entradas previstas','Saídas previstas','Entradas realizadas','Saídas realizadas'],...flow(db,state.range,state.granularity).map(r=>[dateLabel(r.date),...[r.expectedIn,r.expectedOut,r.actualIn,r.actualOut].map(v=>(v/100).toFixed(2).replace('.',','))])]),'text/csv;charset=utf-8'),
  'export-report':()=>download(`gb-plus-relatorio-${state.report}-${today()}.csv`,csv(reportData(db,state)),'text/csv;charset=utf-8'),
  install:async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;render();}else openModal('Instalar o GB+',`<p>No <b>iPhone</b>, abra no Safari, toque em Compartilhar e selecione “Adicionar à Tela de Início”.</p><p>No <b>Android ou computador</b>, use “Instalar aplicativo” no menu do navegador, quando disponível.</p><p class="form-hint">A instalação e o modo offline precisam de HTTPS ou localhost. No modo local, os dados ficam neste navegador. No modo online, ficam vinculados ao seu login e exigem conexão.</p>`);}
};
document.addEventListener('click',async e=>{const el=e.target.closest('[data-action]');if(!el||!db)return;if(el.tagName==='BUTTON')e.preventDefault();try{await actions[el.dataset.action]?.(el);}catch(error){fail(error);}});
document.addEventListener('submit',async e=>{e.preventDefault();if(busy||!db)return;const form=e.target,v=formValues(form),id=form.dataset.id;try{
  if(form.id==='title-form'){const input={type:v.type,description:v.description.trim(),categoryId:v.categoryId,partnerId:v.partnerId,document:v.document.trim(),issue:v.issue,due:v.due,amount:cents(v.amount),accountId:v.accountId,notes:v.notes.trim()};if(id){await commit(d=>updateTitle(d,id,{...input,cancelled:v.cancelled==='true'},v.scope==='future'));return;}const generated=generateTitles(input,v.mode,v.mode==='single'?1:Number(v.count));const clone=form.cloneNode(true);form.querySelectorAll('input,select,textarea').forEach((el,i)=>{const dest=clone.querySelectorAll('input,select,textarea')[i];if(el.tagName==='SELECT')[...dest.options].forEach(o=>o.toggleAttribute('selected',o.value===el.value));else if(el.tagName==='TEXTAREA')dest.textContent=el.value;else dest.setAttribute('value',el.value);});generated.formHTML=clone.outerHTML;pendingGeneration=generated;openModal('Revise antes de confirmar',`<div class="preview-summary"><span>${generated.length} título(s) · ${v.mode==='installment'?'Parcelado':v.mode==='recurring'?'Recorrente':'Único'}</span><strong>${money(generated.reduce((s,t)=>s+t.amount,0))}</strong><p>Valor total da operação</p></div><div class="preview-list">${generated.map(t=>`<div><span>${esc(t.description)} ${t.count>1?`${t.sequence}/${t.count}`:''}<small>${dateLabel(t.due)}</small></span><b>${money(t.amount)}</b></div>`).join('')}</div><div class="form-error" role="alert"></div><div class="form-footer">${button('Voltar','back-generation')}${button('Confirmar geração','save-generation','primary')}</div>`);}
  else if(form.id==='partner-form'){const roles=new FormData(form).getAll('roles');if(!roles.length)throw Error('Selecione ao menos uma classificação.');const row={...v,id:id||uid(),name:v.name.trim(),active:v.active==='true',roles};await commit(d=>{if(row.document&&d.partners.some(p=>p.id!==row.id&&p.document.replace(/\D/g,'')===row.document.replace(/\D/g,'')))throw Error('Já existe um parceiro com este CPF/CNPJ.');upsert(d.partners,row);});}
  else if(form.id==='account-form'){await commit(d=>upsert(d.accounts,{...v,id:id||uid(),name:v.name.trim(),initial:cents(v.initial),active:v.active==='true'}));}
  else if(form.id==='category-form'){await commit(d=>{const row={...v,id:id||uid(),name:v.name.trim()};if(d.categories.some(c=>c.id!==row.id&&c.type===row.type&&c.name.toLowerCase()===row.name.toLowerCase()))throw Error('Já existe uma categoria com este nome e tipo.');if(id&&d.titles.some(t=>t.categoryId===id&&t.type!==v.type))throw Error('Não é possível alterar o tipo de uma categoria em uso.');upsert(d.categories,row);});}
  else if(form.id==='payment-form'){await commit(d=>addPayment(d,{titleId:id,accountId:v.accountId,date:v.date,amount:cents(v.amount)}),'Baixa registrada. Saldo atualizado.');}
  else if(form.id==='transfer-form'){await commit(d=>transfer(d,{...v,amount:cents(v.amount)}),'Transferência registrada.');}
  else if(form.id==='customize-form'){await commit(d=>{for(const device of ['desktop','mobile'])for(const key of Object.keys(INDICATORS))d.settings.panel[device][key]=new FormData(form).has(`${device}:${key}`);},'Painel personalizado.');}
  else if(form.id==='period-form'){if(v.from>v.to)throw Error('O início deve ser anterior ao fim do período.');state.period='custom';state.range={from:v.from,to:v.to};closeModal();render();}
}catch(error){fail(error);}});
function upsert(rows,row){const i=rows.findIndex(x=>x.id===row.id);if(i<0)rows.push(row);else rows[i]=row;}
document.addEventListener('change',async e=>{if(!db)return;const el=e.target;try{
  if(el.id==='entry-type'){const select=document.querySelector('#entry-category');select.innerHTML=db.categories.filter(c=>c.type===el.value).map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');}
  if(el.id==='entry-mode'){document.querySelector('#count-field').hidden=el.value==='single';document.querySelector('#mode-hint').textContent=el.value==='installment'?'O valor total será dividido entre as parcelas, com ajuste exato dos centavos.':el.value==='recurring'?'O valor mensal será repetido em cada mês. Você poderá editar as ocorrências depois.':'Um título, um vencimento. O saldo só muda ao registrar uma baixa.';}
  if(el.id==='period'){if(el.value==='custom'){openModal('Escolher período',`<form id="period-form"><div class="form-grid">${field('De','from',state.range.from||today(),'date','required')}${field('Até','to',state.range.to||today(),'date','required')}</div>${formFooter('Aplicar período')}</form>`);el.value=state.period;}else{state.period=el.value;state.range=rangeFor(el.value);render();}}
  if(el.dataset.filter){state[el.dataset.filter]=el.value;render();}
  if(el.id==='report-type'){state.report=el.value;render();}
  if(el.id==='report-partner'){state.reportPartner=el.value;render();}
  if(el.id==='backup-input'&&el.files[0]){const file=el.files[0];el.value='';if(file.size>15*1024*1024)throw Error('O backup deve ter no máximo 15 MB.');const restored=parseBackup(await file.text());confirm('Restaurar backup?',`Este arquivo contém ${restored.titles.length} títulos, ${restored.partners.length} parceiros e ${restored.accounts.length} contas. Os registros atuais serão substituídos. Exporte um backup antes de continuar, se necessário.`,()=>commit(d=>{Object.keys(d).forEach(k=>delete d[k]);Object.assign(d,restored);},'Backup restaurado com sucesso.'));}
}catch(error){fail(error);}});
document.addEventListener('input',e=>{if(!['title-search','partner-search'].includes(e.target.id))return;const el=e.target;const pos=el.selectionStart;state[el.id==='title-search'?'query':'partnerQuery']=el.value;render();const next=document.getElementById(el.id);next.focus();next.setSelectionRange(pos,pos);});
window.addEventListener('hashchange',route);
matchMedia('(max-width: 760px)').addEventListener('change',()=>{if(db&&state.route==='dashboard')applyPanel();});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;if(db&&state.route==='settings')render();});
window.addEventListener('storage',e=>{if(e.key===KEY&&!currentUser())toast('Dados alterados em outra aba. Atualize a página antes de continuar.');});
modal.addEventListener('cancel',()=>{pendingGeneration=null;confirmAction=null;});

function clearAccount(){
  db=null;repository.dispose?.();closeModal();
  const authDialog=document.querySelector('#auth-modal');if(authDialog){authDialog.close();authDialog.innerHTML='';}
  document.querySelector('#main').innerHTML='<section class="panel recovery"><h1>Atualizando sua sessão…</h1></section>';
  document.querySelector('#navigation').innerHTML='';
  document.querySelector('#mobile-navigation').innerHTML='';
}
function updateConnection(){
  const online=!!currentUser();
  document.querySelector('#connection').textContent=online?(navigator.onLine?'Conta online':'Sem conexão · gravação indisponível'):(navigator.onLine?'Dados neste navegador':'Sem conexão · modo local');
  document.querySelector('.local-mark').innerHTML='<span class="status-dot"></span> '+(online?'Conta online<small>Dados privados do seu login.</small>':'Armazenamento local<small>Seus dados, neste navegador.</small>');
  const access=document.querySelector('#account-access');
  access.textContent=online?'Minha conta':'Entrar';access.title=online?currentUser().email:'Entrar na conta online';
}
async function refreshOnline(manual=false){
  if(!currentUser()||!db||busy||!navigator.onLine||document.hidden||document.querySelector('#auth-modal')?.open)return;
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
window.addEventListener('gbplus-refresh',()=>refreshOnline(true));
window.addEventListener('gbplus-message',event=>toast(event.detail));
window.addEventListener('focus',()=>refreshOnline());
window.addEventListener('online',()=>{updateConnection();refreshOnline();});
window.addEventListener('offline',updateConnection);
async function init(){
  document.querySelector('.avatar').outerHTML='<button class="button small" id="account-access">Entrar</button>';
  document.querySelector('#account-access').onclick=()=>{if(currentUser()&&db){location.hash='settings';}else showAuth();};
  document.querySelector('#main').insertAdjacentHTML('beforebegin','<div id="sync-alert" class="auth-notice sync-alert" role="alert" hidden>A gravação online precisa ser conferida. Feche o formulário, atualize os dados e refaça a alteração. <button class="button small" data-auth-action="refresh">Atualizar dados online</button></div>');
  try{
    const user=await initializeAuth(clearAccount);
    repository=user?new SupabaseRepository(authClient(),user.id):new LocalRepository();
    db=await repository.read();state.range=rangeFor('month');route();
    if(isRecovery())showAuth('recovery');
  }catch(error){
    const cloud=!!currentUser()||onlineSelected();
    document.querySelector('#main').innerHTML='<section class="panel recovery"><h1>'+ (cloud?'Acesse sua conta online':'Não foi possível abrir o GB+')+'</h1><p>'+esc(error.message)+'</p><p>Nenhum registro foi substituído.</p><div class="button-stack"><button class="button primary" data-auth-action="signin">Entrar na conta online</button><button class="button" onclick="location.reload()">Tentar novamente</button><button class="button" data-auth-action="local">Abrir registros locais</button>'+(!cloud?'<button class="button" id="recover-raw">Exportar conteúdo local original</button>':'')+'</div></section>';
    const raw=document.querySelector('#recover-raw');if(raw)raw.onclick=()=>download('gb-plus-recuperacao.txt',localStorage.getItem(KEY)||'Armazenamento vazio','text/plain');
    if(isRecovery())showAuth('recovery');
  }
  updateConnection();setInterval(()=>refreshOnline(),60000);
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').then(reg=>{
    const notifyUpdate=()=>toast('Uma atualização está pronta. Feche as abas do GB+ e abra novamente para usar a nova versão.');
    if(reg.waiting)notifyUpdate();
    reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',()=>{if(reg.waiting&&navigator.serviceWorker.controller)notifyUpdate();}));
  }).catch(()=>toast('O modo offline não pôde ser ativado.'));
}
init();
