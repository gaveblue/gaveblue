import {esc,icon,button,field,select,formFooter,empty} from './ui.js?v=20261105-72';
import {today,money,dateLabel,pending,accountBalance} from './domain.js?v=20261105-72';
import {BANKS,bankCatalog,bankOptions,findBank,bankBadge,bankPicker} from './banks.js?v=20261105-78';
import {creditCards,cardPurchases,cardUsed,cardAvailable} from './credit-cards.js?v=20261105-72';
import {cashForecast} from './forecast.js?v=20261105-72';

const heading=(title,subtitle,buttons='')=>'<div class="page-heading"><div><h1>'+title+'</h1><p>'+subtitle+'</p></div><div class="heading-actions">'+buttons+'</div></div>';
export function banksView(db){
 const custom=db.banks||[];
 const all=bankCatalog(db);
 return heading('Bancos e instituições','Identifique suas contas e cartões com ícones das principais instituições brasileiras.',
  button(icon('plus')+'Cadastrar instituição','new-bank','primary'))+
 '<div class="gb-finance24-intro">As instituições aparecem em ordem alfabética, com código bancário COMPE quando disponível. Os logos não representam integração bancária.</div>'+
 '<div class="gb-bank-directory-search"><label for="gb-bank-directory-query">Buscar banco por nome, código COMPE ou ISPB</label>'+
 '<input id="gb-bank-directory-query" class="gb-bank-directory-search-input" type="search" autocomplete="off" placeholder="Ex.: Sicoob, Sicobi, Nordeste, Pan, 623, 756" aria-controls="gb-bank-directory-results">'+
 '<small data-bank-directory-count>'+all.length+' instituições disponíveis.</small></div>'+
 '<p data-bank-directory-empty class="gb-bank-no-results" hidden>Nenhuma instituição encontrada. Cadastre seu banco personalizado.</p>'+
 '<div id="gb-bank-directory-results" class="gb-bank-directory">'+all.map(b=>{
  const removable=custom.some(x=>x.id===b.id);
  return '<article class="gb-bank-directory-item" data-directory-bank-id="'+esc(b.id)+'">'+bankBadge(b)+
   '<div><strong>'+esc(b.name)+'</strong><small>'+(removable?'Personalizado':(b.code?'Cód. '+esc(b.code)+' · ':'')+'ISPB '+esc(b.ispb||'—'))+'</small></div>'+
   (removable?button('Editar','edit-bank','small','data-id="'+esc(b.id)+'"'): '<span class="gb-bank-directory-label">Disponível</span>')+'</article>';
 }).join('')+'</div>';
}
export function bankForm(bank){
 return '<form id="bank-form" data-id="'+esc(bank?.id||'')+'"><div class="form-grid">'+
  '<div class="full">'+field('Nome do banco ou instituição','name',bank?.name||'','text','required maxlength="120" placeholder="Ex.: Cooperativa regional"')+'</div>'+
  field('Cor de identificação','color',bank?.color||'#586174','color','required')+
  '</div><p class="form-hint">Instituições personalizadas recebem um símbolo com as iniciais. Não é necessário informar códigos bancários ou dados de acesso.</p>'+
  formFooter(bank?'Salvar instituição':'Cadastrar instituição')+'</form>';
}
export function cardsView(db){
 const cards=creditCards(db),purchases=cardPurchases(db);
 const totalLimit=cards.filter(c=>c.active).reduce((s,c)=>s+c.limit,0);
 const used=cards.filter(c=>c.active).reduce((s,c)=>s+cardUsed(db,c.id),0);
 return heading('Cartões de crédito','Acompanhe limite, compras, parcelas e faturas no Contas a pagar.',
  button(icon('plus')+'Novo cartão','new-card','primary'))+
 '<div class="gb-finance24-stats"><div><span>Limite total ativo</span><strong>'+money(totalLimit)+'</strong></div>'+
 '<div><span>Limite utilizado</span><strong>'+money(used)+'</strong></div><div><span>Disponível</span><strong>'+money(totalLimit-used)+'</strong></div></div>'+
 '<p class="gb-finance24-intro">Uma compra no cartão consome limite, mas não reduz o saldo da conta bancária. A fatura só reduz o saldo quando você registra a baixa do título.</p>'+
 (cards.length?'<div class="gb-credit-grid">'+cards.map(card=>{
  const bank=findBank(db,card.bankId),used=cardUsed(db,card.id),available=cardAvailable(db,card);
  const related=purchases.filter(p=>p.cardId===card.id),invoices=db.titles.filter(t=>t.cardInvoice&&t.cardId===card.id)
   .sort((a,b)=>a.due.localeCompare(b.due));
  return '<section class="gb-credit-card"><div class="gb-credit-card-top">'+bankBadge(bank)+
   '<div><h2>'+esc(card.name)+'</h2><small>'+esc(bank?.name||'Instituição não informada')+
   (card.last4?' · final '+esc(card.last4):'')+'</small></div>'+
   button('Editar','edit-card','small','data-id="'+esc(card.id)+'"')+'</div>'+
   '<div class="gb-credit-card-balance"><small>Limite disponível</small><strong>'+money(available)+'</strong>'+
   '<span>Utilizado '+money(used)+' de '+money(card.limit)+'</span><div class="gb-credit-meter"><i style="width:'+Math.max(0,Math.min(100,used/card.limit*100)).toFixed(2)+'%"></i></div></div>'+
   '<div class="gb-credit-card-meta"><span>Fecha dia <b>'+card.closingDay+'</b></span><span>Vence dia <b>'+card.dueDay+'</b></span>'+
   '<span>'+esc(card.active?'Ativo':'Inativo')+'</span></div>'+
   '<div class="gb-credit-card-buttons">'+button(icon('plus')+'Compra no cartão','new-card-purchase','primary small','data-id="'+esc(card.id)+'"')+'</div>'+
   '<h3>Faturas</h3>'+(invoices.length?invoices.slice(0,9).map(t=>
    '<button type="button" class="gb-credit-invoice" data-action="title-detail" data-id="'+esc(t.id)+'"><span>'+dateLabel(t.due)+
    '<small>'+esc(t.description)+'</small></span><strong>'+money(pending(db,t))+'</strong></button>').join(''):
    '<p class="muted">Nenhuma fatura registrada.</p>')+
   '<h3>Compras recentes</h3>'+(related.length?related.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10).map(p=>
    '<div class="gb-credit-purchase"><div><strong>'+esc(p.description)+'</strong><small>'+dateLabel(p.date)+
    ' · parcela '+p.sequence+'/'+p.count+'</small></div><span>'+money(p.amount)+'</span>'+
    button(icon('trash'),'delete-card-purchase','small','data-id="'+esc(p.id)+'" aria-label="Excluir compra"')+'</div>').join(''):
    '<p class="muted">Nenhuma compra cadastrada neste cartão.</p>')+'</section>';
 }).join('')+'</div>':empty('Cadastre seu primeiro cartão','Informe limite e dias de fechamento e vencimento para gerar suas faturas.','new-card','Cadastrar cartão'));
}
export function cardForm(db,card){
 const options=bankOptions(db);
 return '<form id="card-form" data-id="'+esc(card?.id||'')+'"><div class="form-grid">'+
  '<div class="full">'+field('Apelido do cartão','name',card?.name||'','text','required maxlength="120" placeholder="Ex.: Cartão principal"')+'</div>'+
  bankPicker(db,card?.bankId||'')+
  '<div class="full">'+select('Conta prevista para pagamento da fatura','payAccountId',[['','Não definir'],...db.accounts.map(a=>[a.id,a.name])],card?.payAccountId||'')+'</div>'+
  field('Últimos 4 dígitos (opcional)','last4',card?.last4||'','text','inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="1234"')+
  field('Limite total (R$)','limit',(card?.limit||0)/100||'','number','required min="0.01" max="10000000000" step="0.01"')+
  field('Dia do fechamento','closingDay',card?.closingDay||10,'number','required min="1" max="28" step="1"')+
  field('Dia do vencimento','dueDay',card?.dueDay||17,'number','required min="1" max="28" step="1"')+
  select('Situação','active',[['true','Ativo'],['false','Inativo']],String(card?.active??true))+
  '</div><p class="form-hint">A conta escolhida é usada somente para prever o saldo das novas faturas; o dinheiro sai apenas quando a baixa for registrada. Use dias de 1 a 28. Após registrar compras, fechamento e vencimento ficam fixos. Não informe número completo, CVV ou senha.</p>'+
  formFooter(card?'Salvar cartão':'Cadastrar cartão')+'</form>';
}
export function cardPurchaseForm(db,cardId=''){
 const active=creditCards(db).filter(c=>c.active);
 if(!active.length)return empty('Cadastre um cartão primeiro','Para registrar a compra, informe o limite e as datas da fatura.','new-card','Cadastrar cartão');
 const selected=active.some(c=>c.id===cardId)?cardId:active[0].id;
 return '<form id="card-purchase-form"><div class="form-grid">'+
  '<div class="full">'+select('Cartão utilizado','cardId',active.map(c=>[c.id,c.name]),selected,'required')+'</div>'+
  '<div class="full">'+field('Descrição da despesa','description','','text','required maxlength="300" placeholder="Ex.: Compra no supermercado"')+'</div>'+
  '<div class="full">'+select('Categoria da despesa','categoryId',db.categories.filter(c=>c.type==='expense').map(c=>[c.id,c.name]),'','required')+'</div>'+
  '<div class="full">'+select('Parceiro (opcional)','partnerId',[['','Sem parceiro'],...db.partners.filter(p=>p.active).map(p=>[p.id,p.name])],'')+'</div>'+
  field('Data da compra','date',today(),'date','required max="'+today()+'"')+
  field('Valor total (R$)','amount','','number','required min="0.01" step="0.01" max="10000000000"')+
  field('Número de parcelas','count',1,'number','required min="1" max="36" step="1"')+
  '</div><p class="form-hint">O valor total consome o limite imediatamente. Cada parcela entra na fatura correspondente, que será criada em Contas a pagar. Não cria despesa duplicada.</p>'+
  formFooter('Registrar compra')+'</form>';
}
export function forecastSummary(db,days=30){
 const f=cashForecast(db,days);
 const difference=f.expected-f.current;
 return '<section class="gb-future-summary" aria-label="Previsão de saldo"><div><span>SEU FUTURO FINANCEIRO</span>'+
  '<h2>Quanto você terá daqui a '+days+' dias?</h2><p>Projeção a partir das contas e dos títulos pendentes.</p></div>'+
  '<div class="gb-future-values"><span>Saldo atual<strong>'+money(f.current)+'</strong></span>'+
  '<span>Saldo previsto<strong class="'+(f.expected<0?'is-negative':'')+'">'+money(f.expected)+'</strong></span>'+
  '<span>Variação<strong>'+money(difference)+'</strong></span></div>'+
  '<a href="#forecast" class="button primary">Ver previsão completa '+icon('arrow')+'</a></section>';
}
export function forecastView(db,days=30){
 const f=cashForecast(db,days),scale=Math.max(1,...f.points.map(p=>Math.abs(p.balance)));
 const changed=f.points.filter(p=>p.in||p.out);
 return heading('Previsão financeira','Veja como as receitas e despesas pendentes podem afetar seus saldos.',
  button(icon('sliders')+'Simular cenário','forecast-simulate'))+
 '<div class="gb-forecast-period" aria-label="Período da previsão">'+[7,15,30,60,90].map(n=>
  '<button type="button" class="button '+(n===days?'primary':'')+'" data-action="forecast-period" data-value="'+n+'" aria-pressed="'+String(n===days)+'">'+n+' dias</button>').join('')+'</div>'+
 '<div class="gb-finance24-stats"><div><span>Saldo atual</span><strong>'+money(f.current)+'</strong></div>'+
 '<div><span>Saldo previsto em '+days+' dias</span><strong>'+money(f.expected)+'</strong></div>'+
 '<div><span>Menor saldo previsto</span><strong>'+money(f.lowest)+'</strong><small>'+dateLabel(f.lowestDate)+'</small></div></div>'+
 '<div class="gb-finance24-stats gb-forecast-inputs"><div><span>A receber</span><strong>'+money(f.totalIn)+'</strong></div>'+
 '<div><span>A pagar</span><strong>'+money(f.totalOut)+'</strong></div>'+
 '<div><span>Títulos atrasados incluídos</span><strong>'+money(f.overdue)+'</strong></div></div>'+
 (f.lowest<0?'<p class="gb-forecast-warning" role="status">'+icon('info')+' Atenção: a projeção indica possível saldo negativo em '+dateLabel(f.lowestDate)+'.</p>':'')+
 '<section class="panel gb-forecast-chart"><h2>Evolução do saldo projetado</h2><p>As baixas já realizadas integram o saldo atual. Pendências são projetadas na data de vencimento; vencidas entram no primeiro dia.</p>'+
 '<div class="gb-forecast-bars">'+f.points.filter((_,i)=>i===0||i===days||i%Math.max(1,Math.round(days/16))===0).map(p=>
  '<div title="'+dateLabel(p.date)+' — '+money(p.balance)+'" class="'+(p.balance<0?'negative':'')+'">'+
  '<span style="height:'+Math.round(Math.abs(p.balance)/scale*100)+'%"></span><small>'+p.date.slice(8)+'</small></div>').join('')+'</div></section>'+
 '<section class="panel gb-forecast-detail"><h2>Calendário financeiro</h2><p>Datas com receitas e despesas projetadas no período.</p>'+
 (changed.length?'<div class="gb-forecast-days">'+changed.map(p=>
  '<div class="gb-forecast-day"><time datetime="'+p.date+'">'+dateLabel(p.date)+'</time>'+
  '<span class="income">+ '+money(p.in)+'</span><span class="expense">− '+money(p.out)+'</span>'+
  '<strong>Saldo '+money(p.balance)+'</strong></div>').join('')+'</div>':
  '<p class="muted">Nenhum vencimento pendente neste período.</p>')+'</section>'+
 '<section class="panel gb-forecast-detail"><h2>Previsão por conta</h2>'+
 (f.byAccount.length?'<div class="gb-forecast-accounts">'+f.byAccount.map(a=>
  '<div><strong>'+esc(a.name)+'</strong><span>Hoje '+money(a.current)+'</span><span>Previsto '+money(a.expected)+'</span></div>').join('')+'</div>':
  '<p class="muted">Cadastre uma conta financeira para visualizar projeções individuais.</p>')+
 (f.unassignedDelta?'<p class="form-hint">Há '+money(Math.abs(f.unassignedDelta))+' em variações previstas sem conta vinculada. Esses títulos entram no saldo global projetado, mas não são atribuídos automaticamente a uma conta.</p>':'')+'</section>';
}
export function forecastScenarioForm(db,days=30){
 const titles=db.titles.filter(t=>pending(db,t)>0);
 if(!titles.length)return empty('Nenhum título pendente','Registre receitas ou despesas para simular mudanças nos vencimentos.','new-title','Novo lançamento');
 return '<form id="forecast-scenario-form" data-days="'+days+'"><div class="form-grid">'+
 '<div class="full">'+select('Título para simular','titleId',titles.map(t=>[t.id,t.description+' · '+money(pending(db,t))+' · '+dateLabel(t.due)]),'','required')+'</div>'+
 field('Novo vencimento hipotético','due',today(),'date','required')+'</div>'+
 '<p class="form-hint">Esta simulação é apenas uma prévia. Não altera ou salva o vencimento do título.</p>'+formFooter('Calcular cenário')+'</form>';
}
export const forecastResult=(db,days,titleId,due)=>{
 const original=cashForecast(db,days),modified=cashForecast(db,days,today(),{[titleId]:due});
 return '<div class="gb-scenario-result"><p>Previsão sem alteração: <strong>'+money(original.expected)+'</strong></p>'+
 '<p>Com o vencimento simulado: <strong>'+money(modified.expected)+'</strong></p>'+
 '<p>Diferença no período: <strong>'+money(modified.expected-original.expected)+'</strong></p>'+
 '<p class="form-hint">Nenhum lançamento foi modificado.</p></div>';
};
