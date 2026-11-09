import {esc,icon,button,field,select,formFooter,empty} from './ui.js?v=20261105-72';
import {today,money,dateLabel,pending,paid,status,accountBalance} from './domain.js?v=20261105-72';
import {BANKS,bankCatalog,bankOptions,findBank,bankBadge,bankPicker} from './banks.js?v=20261105-87';
import {financePickerField} from './finance-picker-300.js?v=20261109-3000';
import {creditCards,cardPurchases,cardUsed,cardAvailable,cardCycle,cardDue} from './credit-cards.js?v=20261107-2800';
import {cashForecast} from './forecast.js?v=20261105-72';

const heading=(title,subtitle,buttons='')=>'<div class="page-heading"><div><h1>'+title+'</h1><p>'+subtitle+'</p></div><div class="heading-actions">'+buttons+'</div></div>';
export function banksView(db){
 const custom=db.banks||[];
 const all=bankCatalog(db);
 return heading('Bancos e instituições','Consulte as instituições disponíveis ou cadastre a sua.',
  button(icon('plus')+'Cadastrar instituição','new-bank','primary'))+
 '<div class="gb-bank-directory-search"><label for="gb-bank-directory-query">Pesquisar</label>'+
 '<input id="gb-bank-directory-query" class="gb-bank-directory-search-input" type="search" autocomplete="off" placeholder="Pesquisar" aria-label="Pesquisar instituições financeiras" aria-controls="gb-bank-directory-results">'+
 '<small class="gb-visually-hidden" data-bank-directory-count aria-live="polite"></small></div>'+
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
export function cardsView(db,{embedded=false}={}){
 const cards=creditCards(db),purchases=cardPurchases(db);
 const totalLimit=cards.filter(c=>c.active).reduce((s,c)=>s+c.limit,0);
 const used=cards.filter(c=>c.active).reduce((s,c)=>s+cardUsed(db,c.id),0);
 return (embedded?'':heading('Cartões de crédito','Acompanhe limite, compras, parcelas e faturas no Contas a pagar.',
  button(icon('plus')+'Novo cartão','new-card','primary')))+
 '<div class="gb-finance24-stats"><div><span>Limite total ativo</span><strong>'+money(totalLimit)+'</strong></div>'+
 '<div><span>Limite utilizado</span><strong>'+money(used)+'</strong></div><div><span>Disponível</span><strong>'+money(totalLimit-used)+'</strong></div></div>'+
 '<p class="gb-finance24-intro">Uma compra no cartão consome limite, mas não reduz o saldo da conta bancária. A fatura só reduz o saldo quando você registra a baixa do título.</p>'+
 (cards.length?'<div class="gb-credit-grid">'+cards.map(card=>{
  const bank=findBank(db,card.bankId),used=cardUsed(db,card.id),available=cardAvailable(db,card);
  const related=purchases.filter(p=>p.cardId===card.id&&p.source!=='invoice-balance'),invoices=db.titles.filter(t=>t.cardInvoice&&t.cardId===card.id)
   .sort((a,b)=>(pending(db,b)>0)-(pending(db,a)>0)||a.due.localeCompare(b.due));
  const upcomingCycle=cardCycle(today(),card.closingDay);
  const upcomingClose=upcomingCycle+'-'+String(card.closingDay).padStart(2,'0');
  const upcomingDue=cardDue(upcomingCycle,card.closingDay,card.dueDay);
  const totalPending=invoices.reduce((sum,invoice)=>sum+pending(db,invoice),0);
  return '<section class="gb-credit-card"><div class="gb-credit-card-top">'+bankBadge(bank)+
   '<div><h2>'+esc(card.name)+'</h2><small>'+esc(bank?.name||'Instituição não informada')+
   (card.last4?' · final '+esc(card.last4):'')+'</small></div>'+
   button('Editar','edit-card','small','data-id="'+esc(card.id)+'"')+'</div>'+
   '<div class="gb-credit-card-balance"><small>Limite disponível</small><strong>'+money(available)+'</strong>'+
   '<span>Utilizado '+money(used)+' de '+money(card.limit)+'</span><div class="gb-credit-meter"><i style="width:'+Math.max(0,Math.min(100,used/card.limit*100)).toFixed(2)+'%"></i></div></div>'+
   '<div class="gb-credit-card-meta"><span>Fecha dia <b>'+card.closingDay+'</b></span><span>Vence dia <b>'+card.dueDay+'</b></span>'+
   '<span>'+esc(card.active?'Ativo':'Inativo')+'</span></div>'+
   '<p class="gb-invoice-next">Próximo fechamento: <strong>'+dateLabel(upcomingClose)+'</strong> · Vencimento previsto: <strong>'+dateLabel(upcomingDue)+'</strong></p>'+ 
   '<div class="gb-credit-card-buttons">'+button(icon('plus')+'Nova compra','new-card-purchase','primary small','data-id="'+esc(card.id)+'"')+'</div>'+
   '<details class="gb30-card-details"><summary>Faturas e compras</summary>'+ 
   '<div class="gb30-card-extra">'+button('Informar saldo de fatura','new-card-invoice','small','data-id="'+esc(card.id)+'"')+'</div>'+ 
   '<h3>Faturas <small class="gb-invoice-total">'+money(totalPending)+' a pagar</small></h3>'+(invoices.length?invoices.slice(0,12).map(t=>
    '<div class="gb-credit-invoice-row"><button type="button" class="gb-credit-invoice" data-action="title-detail" data-id="'+esc(t.id)+'"><span>'+dateLabel(t.due)+
    '<small>'+esc(t.description)+' · '+(cardPurchases(db).some(p=>p.invoiceId===t.id&&p.source==='invoice-balance')?'Saldo informado · ':'')+status(db,t)+(paid(db,t.id)>0&&pending(db,t)>0?' · '+money(paid(db,t.id))+' pagos':'')+'</small></span><strong>'+money(pending(db,t))+'</strong></button>' +
    (pending(db,t)>0?button('Pagar','payment','small','data-id="'+esc(t.id)+'" aria-label="Pagar '+esc(t.description)+'"'):'')+'</div>').join(''):
    '<p class="muted">Ainda não há faturas com valores lançados. Os próximos vencimentos são apenas previsões de calendário.</p>')+
   '<h3>Compras recentes</h3>'+(related.length?related.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10).map(p=>
    '<div class="gb-credit-purchase"><div><strong>'+esc(p.description)+'</strong><small>'+dateLabel(p.date)+
    ' · parcela '+p.sequence+'/'+p.count+'</small></div><span>'+money(p.amount)+'</span>'+
    '<div class="gb-credit-purchase-actions">'+button('Editar','edit-card-purchase','small','data-id="'+esc(p.id)+'" aria-label="Editar compra"')+
    button(icon('trash'),'delete-card-purchase','small','data-id="'+esc(p.id)+'" aria-label="Excluir compra"')+'</div></div>').join(''):
    '<p class="muted">Nenhuma compra cadastrada neste cartão.</p>')+'</details></section>';
 }).join('')+'</div>':empty('Cadastre seu primeiro cartão','Informe limite e dias de fechamento e vencimento para gerar suas faturas.','new-card','Cadastrar cartão'));
}
export function cardInvoiceBalanceForm(db,cardId=''){
 const card=creditCards(db).find(c=>c.id===cardId&&c.active);
 if(!card)return empty('Cadastre um cartão ativo','Para informar uma fatura, escolha um cartão ativo.','new-card','Cadastrar cartão');
 const cycle=cardCycle(today(),card.closingDay);
 return '<form id="card-invoice-balance-form">'+
  '<input type="hidden" name="cardId" value="'+esc(card.id)+'">'+
  '<div class="form-grid"><p class="full"><strong>'+esc(card.name)+'</strong> · Fecha dia '+card.closingDay+' · Vence dia '+card.dueDay+'</p>'+
   '<div class="full">'+field('Competência da fatura (mês/ano)','cycle',cycle,'month','required max="'+esc(cycle)+'"')+'</div>'+
   '<div class="full">'+field('Valor consolidado da fatura (R$)','amount','','number','required min="0.01" max="10000000000" step="0.01"')+'</div>'+
   '<div class="full">'+field('Identificação','description','Saldo informado da fatura','text','required maxlength="300"')+'</div></div>'+
  '<p class="form-hint">Use apenas para uma fatura informada pelo banco que ainda não possui compras registradas no GB+ nesta competência. Não registre compras dessa mesma fatura novamente: isso duplicaria o valor. O lançamento será criado em Contas a pagar, com vencimento conforme o cartão; a conta bancária só será debitada quando a baixa for confirmada.</p>'+
  formFooter('Gerar fatura a pagar')+'</form>';
}
export function cardForm(db,card){

 return '<form id="card-form" data-id="'+esc(card?.id||'')+'"><div class="form-grid">'+
  '<div class="full">'+field('Apelido do cartão','name',card?.name||'','text','required maxlength="120" placeholder="Ex.: Cartão principal"')+'</div>'+
  financePickerField(db,{kind:'bank',name:'bankId',label:'Banco ou instituição',value:card?.bankId||'',allowEmpty:true})+
  financePickerField(db,{kind:'account',name:'payAccountId',label:'Conta prevista para pagar a fatura',value:card?.payAccountId||'',allowEmpty:true})+

  field('Limite total (R$)','limit',(card?.limit||0)/100||'','number','required min="0.01" max="10000000000" step="0.01"')+
  field('Dia do fechamento','closingDay',card?.closingDay||10,'number','required min="1" max="28" step="1"')+
  field('Dia do vencimento','dueDay',card?.dueDay||17,'number','required min="1" max="28" step="1"')+
  '<details class="full gb30-optional"><summary>Mais opções do cartão</summary><div class="gb30-optional-body">'+
  field('Últimos 4 dígitos (opcional)','last4',card?.last4||'','text','inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="1234"')+
  select('Situação','active',[['true','Ativo'],['false','Inativo']],String(card?.active??true))+
  '</div></details>'+

  '</div><p class="form-hint">A conta escolhida é usada somente para prever o saldo das novas faturas; o dinheiro sai apenas quando a baixa for registrada. Use dias de 1 a 28. Após registrar compras, fechamento e vencimento ficam fixos. Não informe número completo, CVV ou senha.</p>'+
  formFooter(card?'Salvar cartão':'Cadastrar cartão')+'</form>';
}
export function cardPurchaseForm(db,cardId='',purchase=null){
 const active=creditCards(db).filter(c=>c.active||c.id===purchase?.cardId);
 if(!active.length)return empty('Cadastre um cartão primeiro','Para registrar a compra, informe o limite e as datas da fatura.','new-card','Cadastrar cartão');
 const selected=active.some(c=>c.id===(purchase?.cardId||cardId))?(purchase?.cardId||cardId):active[0].id;
 const group=purchase?(purchase.groupId?cardPurchases(db).filter(p=>p.groupId===purchase.groupId):[purchase]):[];
 const total=group.reduce((sum,p)=>sum+p.amount,0);
 const locked=group.some(p=>db.payments?.some(row=>row.titleId===p.invoiceId));
 const imported=purchase?.source==='invoice-balance';
 if(imported){
  const card=active.find(c=>c.id===purchase.cardId);
  return '<form id="card-purchase-form" data-id="'+esc(purchase.id)+'">'+
   '<input type="hidden" name="cardId" value="'+esc(purchase.cardId)+'">'+
   '<input type="hidden" name="date" value="'+esc(purchase.date)+'">'+
   '<input type="hidden" name="categoryId" value="'+esc(purchase.categoryId)+'">'+
   '<input type="hidden" name="partnerId" value="">'+
   '<input type="hidden" name="count" value="1">'+
   '<div class="form-grid"><p class="full"><strong>'+esc(card?.name||'Cartão')+'</strong> · Competência '+esc(card?.closingDay?cardCycle(purchase.date,card.closingDay):'—')+'</p>'+
    '<div class="full">'+field('Identificação da fatura','description',purchase.description,'text','required maxlength="300"')+'</div>'+
    '<div class="full">'+field('Valor consolidado da fatura (R$)','amount',total/100,'number','required min="0.01" max="10000000000" step="0.01"')+'</div></div>'+
   '<p class="form-hint">'+(locked?'Esta fatura já possui pagamento. Estorne todas as baixas antes de alterar o valor.':'O valor informado representa toda a fatura: não lance compras individuais nesta mesma competência.')+'</p>'+
   formFooter('Salvar saldo da fatura')+'</form>';
 }
 return '<form id="card-purchase-form" data-id="'+esc(purchase?.id||'')+'"><div class="form-grid">'+
  financePickerField(db,{kind:'card',name:'cardId',label:'Cartão utilizado',value:selected,required:true})+
  '<div class="full">'+field(imported?'Descrição do saldo da fatura':'Descrição da despesa','description',purchase?.description||'','text','required maxlength="300" placeholder="Ex.: Compra no supermercado"')+'</div>'+
  financePickerField(db,{kind:'expense-category',name:'categoryId',label:'Categoria',value:purchase?.categoryId||'',required:true})+
  financePickerField(db,{kind:'partner',name:'partnerId',label:'Parceiro',value:purchase?.partnerId||'',allowEmpty:true})+
  field('Data da compra','date',purchase?.date||today(),'date','required max="'+today()+'"')+
  field('Valor total (R$)','amount',purchase?total/100:'','number','required min="0.01" step="0.01" max="10000000000"')+
  field('Número de parcelas','count',group.length||1,'number','required min="1" max="36" step="1"')+
  '</div><p class="form-hint">'+(imported?'Saldo consolidado lançado manualmente. Não cadastre compras individuais para esta competência sem antes remover o saldo informado. ': '')+(locked?
   'Esta compra possui fatura paga. Você pode ajustar descrição, categoria e parceiro; para mudar valores ou parcelas, estorne a baixa da fatura primeiro.':
   'Alterações de cartão, data, valor ou parcelas recalculam as faturas correspondentes sem duplicar despesas ou afetar o caixa antes da baixa.')+
  '</p>'+formFooter(purchase?'Salvar alterações':'Registrar compra')+'</form>';
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
