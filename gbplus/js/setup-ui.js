import {esc,icon,button,field,select} from './ui.js?v=20261105-72';
import {money} from './domain.js?v=20261105-72';
import {MOBILE_SHORTCUTS,defaultMobileNav,effectiveMobileNav} from './store.js?v=20261105-72';

// The fixed slots are never rendered as selectors and cannot be removed.
const selectionOptions=MOBILE_SHORTCUTS.map(([key,label])=>[key,label]);
export function readMobileNav(form){
 return [0,1,2].map(i=>form.elements.namedItem('slot'+i)?.value||'');
}
export function shortcutsPicker(values=defaultMobileNav()){
 const current=Array.isArray(values)&&values.length===3?values:defaultMobileNav();
 return '<div class="shortcut-fields">'+
  '<div class="shortcut-fixed">'+icon('home')+' <strong>Início</strong> <small>Fixo · posição 1</small></div>'+
  select('2º atalho','slot0',selectionOptions,current[0],'required')+
  '<div class="shortcut-fixed">'+icon('plus')+' <strong>Novo</strong> <small>Fixo · posição 3</small></div>'+
  select('4º atalho','slot1',selectionOptions,current[1],'required')+
  select('5º atalho','slot2',selectionOptions,current[2],'required')+
  '</div>';
}
export function shortcutsPreview(values=defaultMobileNav()){
 const byKey=new Map(MOBILE_SHORTCUTS.map(([key,label,graphic])=>[key,{label,graphic}]));
 const slot=key=>byKey.get(key)||byKey.get('menu');
 const items=[
  {label:'Início',graphic:'home',fixed:true},
  {...slot(values[0])},
  {label:'Novo',graphic:'plus',fixed:true},
  {...slot(values[1])},
  {...slot(values[2])}
 ];
 return '<div class="shortcut-preview" aria-label="Prévia da barra inferior">'+items.map(item=>'<div class="shortcut-preview-item">'+icon(item.graphic)+(item.fixed?'<b>':'<span>')+esc(item.label)+(item.fixed?'</b>':'</span>')+'</div>').join('')+'</div>';
}
export function customMobileNavForm(db){
 const nav=effectiveMobileNav(db.settings);
 return '<form id="mobile-nav-form" class="mobile-nav-config">'+
 '<p class="form-hint">Personalize os três atalhos livres. Início (primeiro) e Novo (central) permanecem fixos. Você pode trocar o Menu por qualquer seção e acessar Configurações pelo seu perfil.</p>'+
 shortcutsPicker(nav)+
 '<h3 class="shortcut-preview-heading">Como ficará no celular</h3><div id="mobile-nav-preview">'+shortcutsPreview(nav)+'</div>'+
 '<div class="form-error" role="alert"></div>'+
 '<div class="form-footer">'+button('Padrão','reset-mobile-nav','small','type="button"')+
 '<button class="button primary" type="submit">Salvar atalhos '+icon('check')+'</button></div></form>';
}
const wizardBack=()=>'<button class="button" type="button" data-action="setup-back">Voltar</button>';
const wizardNote='<p class="form-hint">Nada será lançado ou gravado até você confirmar a configuração.</p>';
const wizardFoot=(label)=>'<div class="form-error" role="alert"></div><div class="form-footer">'+wizardBack()+'<button class="button primary" type="submit">'+label+icon('arrow')+'</button></div>';
const panel=(title,text,body)=>'<h3 class="setup-question">'+title+'</h3><p class="setup-description">'+text+'</p>'+body;
const row=(back,buttons)=>'<div class="form-footer">'+(back?wizardBack():'')+buttons+'</div>';
export function firstSetupView(d){
 const stage=d.step;
 const progress={welcome:1,'account-choice':2,'account-details':2,'balance-choice':3,'balance-details':3,preferences:4,review:5}[stage]||1;
 const marker='<div class="setup-progress" aria-label="Etapa '+progress+' de 5"><span>PASSO '+progress+' DE 5</span><div class="setup-progress-track"><i style="width:'+(progress*20)+'%"></i></div></div>';
 let body='';
 if(stage==='welcome')body=panel('Vamos preparar o seu financeiro','Você decide o que configurar agora. Em poucos passos, podemos cadastrar sua primeira conta, informar um saldo inicial e escolher a aparência do GB+.',
  '<div class="setup-benefits"><div>'+icon('wallet')+' Contas financeiras</div><div>'+icon('chart')+' Saldo inicial</div><div>'+icon('sun')+' Aparência</div></div>'+wizardNote+
  row(false,button('Agora não','setup-later')+button('Começar configuração','setup-begin','primary')));
 if(stage==='account-choice')body=panel('Deseja cadastrar uma conta financeira?','Pode ser uma conta bancária, caixa ou outra conta que você acompanhe no GB+. Se preferir, cadastre depois em Contas bancárias.',
  row(true,button('Não, depois','setup-account-no')+button('Sim, cadastrar','setup-account-yes','primary')));
 if(stage==='account-details')body=panel('Primeira conta financeira','Informe os dados essenciais da sua conta. Agência e número são opcionais.',
  '<form id="setup-account-form"><div class="form-grid">'+
   field('Nome da conta','name',d.name,'text','required maxlength="120" placeholder="Ex.: Conta principal"')+
   field('Banco ou instituição','bank',d.bank,'text','maxlength="120" placeholder="Ex.: Banco, dinheiro em caixa"')+
   field('Agência (opcional)','branch',d.branch,'text','maxlength="80"')+
   field('Número da conta (opcional)','number',d.number,'text','maxlength="80"')+
   '</div>'+wizardFoot('Continuar')+'</form>');
 if(stage==='balance-choice')body=panel('Quer informar o saldo inicial?','É o valor disponível na conta antes dos novos pagamentos e recebimentos registrados no GB+. Não é uma receita nem cria movimentação.',
  row(true,button('Sem saldo inicial','setup-balance-no')+button('Sim, informar saldo','setup-balance-yes','primary')));
 if(stage==='balance-details')body=panel('Qual é o saldo inicial dessa conta?','Informe o saldo que será usado como ponto de partida. Se a conta estiver negativa, use o sinal de menos.',
  '<form id="setup-balance-form"><div class="form-grid">'+
   field('Saldo inicial (R$)','initial',(d.initial/100).toFixed(2),'number','required min="-10000000000" max="10000000000" step="0.01" inputmode="decimal"')+
   '</div>'+wizardFoot('Continuar')+'</form>');
 if(stage==='preferences')body=panel('Deixe o GB+ do seu jeito','Escolha o modo de aparência do aplicativo. Os atalhos do celular podem ser personalizados depois em Configurações.',
  '<form id="setup-preferences-form">'+
   '<div class="setup-theme">'+select('Aparência','theme',[['light','Modo claro'],['dark','Modo escuro']],d.theme,'required')+'</div>'+
   wizardFoot('Revisar configuração')+'</form>');
 if(stage==='review')body=panel('Confira antes de começar','Somente depois de tocar em Concluir os dados serão salvos na sua conta GB+.',
  '<div class="setup-review">'+
  '<div><small>Conta financeira</small><strong>'+esc(d.createAccount?d.name:'Nenhuma conta agora')+'</strong></div>'+
  (d.createAccount?'<div><small>Banco / instituição</small><strong>'+esc(d.bank||'Não informado')+'</strong></div><div><small>Saldo inicial</small><strong>'+money(d.initial)+'</strong></div>':'')+
  '<div><small>Aparência</small><strong>'+(d.theme==='dark'?'Escura':'Clara')+'</strong></div></div>'+
  '<p class="form-hint">As categorias padrão de receitas e despesas já estarão disponíveis. Nenhuma receita, despesa ou baixa será criada por este assistente.</p>'+
  '<div class="form-error" role="alert"></div>'+
  row(true,button('Concluir configuração','setup-finish','primary')));
 return marker+'<div class="setup-step">'+body+'</div>';
}

/** Checklist opcional: não cria dados nem altera saldos por conta própria. */
export function firstStepsPanel(db){
 const accounts=Array.isArray(db?.accounts)?db.accounts:[],titles=Array.isArray(db?.titles)?db.titles:[];
 const account=accounts[0],hasAccount=accounts.length>0,hasTitle=titles.length>0;
 if(hasAccount&&hasTitle)return '';
 const progress=(hasAccount?2:0)+(hasTitle?1:0);
 const item=(number,title,description,done,actionHTML)=>'<div class="gb-first-steps-item '+(done?'is-done':'')+'">'+
  '<span class="gb-first-steps-number">'+(done?icon('check'):number)+'</span>'+
  '<div class="gb-first-steps-text"><strong>'+title+'</strong><p>'+description+'</p></div>'+
  '<div class="gb-first-steps-action">'+(done?'<span class="gb-first-steps-done">Feito</span>':actionHTML)+'</div></div>';
 const first=item('1','Cadastre sua primeira conta',
  'Escolha a conta bancária ou o caixa que deseja controlar.',hasAccount,
  button('Cadastrar conta','new-account','small'));
 const second=item('2','Informe o saldo inicial',
  hasAccount?'Saldo registrado: <strong>'+money(account.initial||0)+'</strong>. Pode ser zero; ajuste pelo cadastro da conta quando necessário.':'Durante o cadastro da conta, informe quanto ela tem hoje (inclusive R$ 0,00).',
  hasAccount,hasAccount?'':button('Criar conta e saldo','new-account','small'));
 const third=item('3','Registre seu primeiro lançamento',
  'Lance uma despesa ou receita com valor e vencimento para acompanhar seu financeiro.',
  hasTitle,button('Criar lançamento','new-title','small'));
 return '<section class="gb-first-steps" aria-labelledby="gb-first-steps-title">'+
  '<div class="gb-first-steps-heading"><div><span class="gb-first-steps-kicker">PRIMEIROS PASSOS</span>'+
  '<h2 id="gb-first-steps-title">Vamos deixar seu financeiro pronto?</h2>'+
  '<p>Três passos simples. O saldo inicial é um ponto de partida, não uma receita.</p></div>'+
  button('Agora não','onboarding-dismiss','small','aria-label="Ocultar orientações iniciais"')+'</div>'+
  '<div class="gb-first-steps-progress" role="status">'+progress+' de 3 etapas realizadas</div>'+
  '<div class="gb-first-steps-list">'+first+second+third+'</div></section>';
}
