import {filterFlowRows} from './gb-flow-filters.js?v=20261106-68';
import {money,today,dateLabel,metrics,pending,paid,status,flow,accountBalance,within} from './domain.js?v=20261105-72';
import {INDICATORS} from './store.js?v=20261105-78';
import {esc,icon,button,empty,titleTable,chart,select,field} from './ui.js?v=20261105-72';
import {gbIcon,categoryIconFor} from './gb-icons.js?v=20261109-2900';
import {bankBadge,bankForAccount,bankName} from './banks.js?v=20261105-87';
import {accountKind,accountMark,accountTypeLabel,goalProgressMarkup} from './account-goals.js?v=20261109-2900';
import {missingCategorySuggestions,isLegacyServiceCategory} from './category-library.js?v=20261108-2862';
import {calculateDueAlerts,notificationPrefs} from './notification-rules.js?v=20261108-2821';
export const routes=[['dashboard','Dashboard','home'],['titles','Lançamentos','titles'],['payable','Contas a pagar','down'],['receivable','Contas a receber','up'],['provisions','Provisões','layers'],['flow','Fluxo de caixa','chart'],['partners','Parceiros','people'],['accounts','Contas e cartões','wallet'],['forecast','Previsão financeira','chart'],['banks','Bancos','building-2'],['categories','Categorias','category'],['reports','Relatórios','chart'],['notifications','Notificações','bell'],['more','Mais','more']];
const stat=(key,value,subtitle,ico,extra='',footer='')=>`<article class="stat ${extra}" data-indicator="${key}"><div class="stat-top"><span class="stat-icon">${icon(ico)}</span>${key==='balance'?'<span class="stat-tag">AGORA</span>':''}</div><p>${INDICATORS[key]}</p><strong>${money(value)}</strong><small>${subtitle}</small>${footer}</article>`;
function balanceAccountStrip(db){
 const accounts=(db.accounts||[]).filter(a=>a.active!==false);
 if(!accounts.length)return '';
 return '<div class="gb-balance-accounts" role="group" aria-label="Saldos das contas">'+
  accounts.map(a=>{
   const amount=money(accountBalance(db,a.id,today()));
   return '<button type="button" class="gb-balance-bank" data-action="account-detail" data-id="'+esc(a.id)+'" '+
    'title="'+esc(a.name)+' · '+esc(amount)+'" aria-label="Abrir movimentações de '+esc(a.name)+'. Saldo: '+esc(amount)+'">'+
    accountMark(db,a)+
    '<span class="gb-balance-bank-amount">'+esc(amount)+'</span></button>';
  }).join('')+'</div>';
}
export function periodBar(state){return `<div class="period-control">${icon('calendar')}<select id="period" aria-label="Período"><option value="month" ${state.period==='month'?'selected':''}>Este mês</option><option value="last" ${state.period==='last'?'selected':''}>Mês anterior</option><option value="year" ${state.period==='year'?'selected':''}>Este ano</option><option value="all" ${state.period==='all'?'selected':''}>Todo o período</option><option value="custom" ${state.period==='custom'?'selected':''}>Personalizado</option></select></div>`;}
export function heading(title,subtitle,actions=''){return `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;}
function dashboardGreeting(user){
 const hour=new Date().getHours();
 const greeting=hour<12?'Bom dia':hour<18?'Boa tarde':'Boa noite';
 const name=String(user?.user_metadata?.gbplus_profile?.full_name||user?.user_metadata?.full_name||user?.user_metadata?.name||'').trim().split(/\s+/)[0].slice(0,35);
 return esc(greeting+(name?', '+name:'')+'!');
}
export function dashboard(db,state,online=false,user=null){const m=metrics(db,state.range);const upcoming=db.titles.filter(t=>pending(db,t)>0&&within(t.due,state.range)).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,4);return `${heading(dashboardGreeting(user),'Aqui está o resumo do seu financeiro.',periodBar(state))}<div class="section-kicker">VISÃO GERAL <span>${state.range.from?dateLabel(state.range.from)+' — '+dateLabel(state.range.to):'Todos os registros'}</span></div><div class="stats-grid">${stat('balance',m.balance,'Saldo atual de todas as contas','wallet','featured',balanceAccountStrip(db))}${stat('receivable',m.receivable,'Saldo pendente no período','up')}${stat('payable',m.payable,'Saldo pendente no período','down')}${stat('provisions',m.provisions,'Entradas − saídas previstas','layers')}</div><div class="dashboard-middle"><section class="panel flow-panel" data-indicator="chart"><div class="panel-heading"><div><h2>Fluxo de caixa</h2><p>O movimento real do seu dinheiro</p></div><div class="legend"><span>Receitas</span><span>Despesas</span></div></div><div class="gb-chart-slot"><div class="gb-react-charts" data-gb-react="earnings" hidden></div><div class="gb-chart-fallback"><div data-gb-native="earnings" hidden></div><div data-gb-chart-original>${chart(flow(db,state.range))}</div></div></div><div class="panel-bottom"><span>Valores efetivamente recebidos e pagos</span><a href="#flow">Ver fluxo completo ${icon('arrow')}</a></div></section><section class="panel upcoming-panel" data-indicator="upcoming"><div class="panel-heading"><div><h2>Próximos vencimentos</h2><p>O que merece sua atenção</p></div><a href="#titles" class="icon-button" aria-label="Ver todos os títulos">${icon('chevron')}</a></div>${upcoming.length?`<div class="upcoming-list">${upcoming.map(t=>`<button data-action="title-detail" data-id="${t.id}" class="upcoming-item"><span class="item-icon ${t.type==='income'?'income-arrow':'expense-arrow'}">${icon(t.type==='income'?'up':'down')}</span><span><b>${esc(t.description)}</b><small>${t.due<today()?'Vencido · ':''}${dateLabel(t.due)} · ${t.type==='income'?'A receber':'A pagar'}</small></span><strong>${money(pending(db,t))}</strong></button>`).join('')}</div>`:empty('Tudo tranquilo por aqui','Nenhum vencimento neste período.')}<div class="panel-bottom"><span>${db.titles.filter(t=>pending(db,t)>0&&within(t.due,state.range)).length} títulos em aberto no período</span></div></section></div><section class="results-grid">${stat('received',m.received,'Recebimentos no período','up')}${stat('spent',m.spent,'Pagamentos no período','down')}${stat('result',m.result,'Recebido − pago no período','chart')}${stat('overdue',m.overdue,'Pendências vencidas no período','clock')}</section><section class="getting-started"><div class="intro-icon">${icon('plus')}</div><div><h2>${db.titles.length?'Um financeiro organizado começa no registro.':'Seu próximo passo começa aqui.'}</h2><p>${db.titles.length?'Único, parcelado ou recorrente. Registre uma vez e acompanhe tudo.':'Adicione sua conta e faça o primeiro lançamento. A clareza vem com o hábito.'}</p></div>${button(icon('plus')+'Novo lançamento','new-title','primary')}</section><div class="local-note">${icon('info')} ${online?'Dados da sua conta online. Use o mesmo login em seus dispositivos. Gravações exigem conexão.':'Dados salvos somente neste navegador. Para levar seus registros a outro dispositivo, exporte e restaure um backup.'}</div>`;}
export function filteredTitles(db,state){return db.titles.filter(t=>within(t.due,state.range)&&(!state.type||t.type===state.type)&&(!state.partner||t.partnerId===state.partner)&&(!state.category||t.categoryId===state.category)&&(!state.query||`${t.description} ${t.document} ${db.partners.find(p=>p.id===t.partnerId)?.name||''}`.toLocaleLowerCase('pt-BR').includes(state.query.toLocaleLowerCase('pt-BR')))&&(!state.status||(state.status==='open'?pending(db,t)>0:state.status==='late'?pending(db,t)>0&&t.due<today():state.status==='partial'?paid(db,t.id)>0&&pending(db,t)>0:state.status==='settled'?paid(db,t.id)===t.amount:t.cancelled))).sort((a,b)=>a.due.localeCompare(b.due));}
function mobileTitleCards(db,titles){
 if(!titles.length)return empty('Nenhum título encontrado','Experimente ajustar os filtros para encontrar os lançamentos.','new-title','Novo lançamento');
 return '<div class="mobile-title-list">'+titles.map(t=>{
  const income=t.type==='income',due=dateLabel(t.due),category=db.categories.find(c=>c.id===t.categoryId)?.name||'Sem categoria',partner=db.partners.find(p=>p.id===t.partnerId)?.name||'Sem parceiro',remaining=pending(db,t),st=status(db,t);
  return `<article class="mobile-title-card">
   <span class="mobile-title-arrow ${income?'income-arrow':'expense-arrow'}">${icon(income?'up':'down')}</span>
   <button class="mobile-title-open" data-action="title-detail" data-id="${t.id}" aria-label="Abrir lançamento ${esc(t.description)}">
    <strong>${esc(t.description)}${t.count>1?` <span class="muted">${t.sequence}/${t.count}</span>`:''}</strong>
    <small>${income?'Receita':'Despesa'} · ${esc(partner)}</small>
    <span class="mobile-title-category">${icon('category')} ${esc(category)}</span>
   </button>
   <div class="mobile-title-side"><time datetime="${t.due}">${due}</time><span class="badge ${st.startsWith('Vencido')?'overdue':''}">${esc(st)}</span><strong>${money(t.amount)}</strong></div>
   <div class="mobile-title-footer"><small>${money(remaining)} pendente</small><div class="mobile-title-buttons">${remaining>0?button('Baixar','payment','small',`data-id="${t.id}"`):''}<button class="icon-button" data-action="edit-title" data-id="${t.id}" aria-label="Editar ${esc(t.description)}">${icon('edit')}</button></div></div>
  </article>`;
 }).join('')+'</div>';
}
export function titlesView(db,state){
 const titles=filteredTitles(db,state);
 const advanced=!!state.moreFilters;
 const active=[!!state.query,!!state.status,!!state.partner,!!state.category,!!(state.type&&state.route==='titles'),state.period!=='month'].filter(Boolean).length;
 const incomePending=titles.filter(t=>t.type==='income').reduce((sum,t)=>sum+pending(db,t),0);
 const expensePending=titles.filter(t=>t.type==='expense').reduce((sum,t)=>sum+pending(db,t),0);
 const title=state.route==='payable'?'Contas a pagar':state.route==='receivable'?'Contas a receber':'Lançamentos';
 const filterUI=`<div class="title-filter-shell">
  <div class="filters title-filters">
   <label class="search-field">${icon('search')}<input id="title-search" type="search" placeholder="Buscar descrição, parceiro ou documento" value="${esc(state.query)}" aria-label="Pesquisar títulos" autocomplete="off"></label>
   <div class="title-filter-grid">
    <label class="title-period-field"><span>Período</span>${periodBar(state)}</label>
    ${select('Situação','status',[['','Todas'],['open','Em aberto / parciais'],['late','Vencidos'],['partial','Parcialmente baixados'],['settled','Pagos / recebidos'],['cancelled','Cancelados']],state.status,'data-filter="status"')}
    ${select('Tipo','type',[['','Todos'],['income','Receitas'],['expense','Despesas']],state.type,'data-filter="type"')}
    <div class="title-filter-more">
     <button class="button" type="button" data-action="toggle-title-filters" aria-expanded="${advanced}" aria-controls="title-advanced-filters">${icon('settings')} Mais filtros ${state.partner||state.category?'<span class="title-count">•</span>':''}</button>
    </div>
   </div>
   <div id="title-advanced-filters" class="title-advanced-filters" ${advanced?'':'hidden'}>
    ${select('Parceiro','partner',[['','Todos'],...db.partners.map(p=>[p.id,p.name])],state.partner,'data-filter="partner"')}
    ${select('Categoria','category',[['','Todas'],...db.categories.map(c=>[c.id,c.name])],state.category,'data-filter="category"')}
   </div>
   <div class="title-filter-footer"><button class="title-filter-reset" type="button" data-action="clear-title-filters" ${active?'':'disabled'}>Limpar filtros</button><span>${active?'Filtros ativos: '+active:'Exibindo todos os tipos no período'}</span></div>
  </div>
 </div>`;
 return `${heading(title,'Cada compromisso e cada entrada, no mesmo lugar.',button(icon('plus')+'Novo lançamento','new-title','primary'))}
 <section class="panel titles-panel">${filterUI}
  <div class="table-summary"><span>${titles.length} ${titles.length===1?'título encontrado':'títulos encontrados'}</span>${button(icon('download')+'Exportar CSV','export-titles','small')}</div>
  <div class="title-totals" aria-label="Valores em aberto nos títulos filtrados">
   <span>${icon('up','income-arrow')} <span>A receber</span> <b>${money(incomePending)}</b></span>
   <span>${icon('down','expense-arrow')} <span>A pagar</span> <b>${money(expensePending)}</b></span>
  </div>
  <div class="titles-desktop-table">${titleTable(db,titles)}</div>
  <div class="titles-mobile-cards">${mobileTitleCards(db,titles)}</div>
 </section>`;
}
// Notifications are calculated from the authenticated user's actual open titles.
// They are not push notifications and are never fabricated or stored separately.
export function notificationsView(db){
 const alerts=calculateDueAlerts(db,today()),prefs=notificationPrefs(db.settings);
 const groups=[
  ['overdue','Atrasados','clock'],['today','Vencem hoje','calendar'],['upcoming','Próximos vencimentos','bell']
 ];
 const item=entry=>{
  const t=entry.title,category=db.categories.find(c=>c.id===t.categoryId)?.name||'Sem categoria';
  const lead=entry.group==='overdue'?'Atrasado há '+Math.abs(entry.daysUntil)+' dia(s)':
   entry.group==='today'?'Vence hoje':'Vence em '+entry.daysUntil+' dia(s)';
  return '<button class="gb-alert-row" type="button" data-action="title-detail" data-id="'+esc(t.id)+'">'+
   '<span class="gb-alert-row-icon">'+icon(t.type==='income'?'up':'down')+'</span>'+
   '<span class="gb-alert-row-content"><strong>'+esc(t.description)+'</strong><small>'+lead+' · '+esc(category)+' · '+dateLabel(t.due)+'</small></span>'+
   '<span class="gb-alert-row-value">'+money(entry.pending)+'</span></button>';
 };
 return heading('Notificações','Avisos dos seus compromissos, configurados por você.',
  button(icon('settings')+' Configurar avisos','notification-preferences','small'))+
  '<section class="gb-alerts-intro"><span>'+icon('bell')+'</span><div><strong>Avisos de vencimento</strong>'+
   '<small>'+(prefs.enabled?'Alertas ativos para os próximos '+prefs.daysBefore+' dia(s).':'Avisos pausados nas suas preferências.')+'</small></div></section>'+
  '<div class="gb-alerts-stats"><span>'+alerts.summary.overdue+' atrasado(s)</span><span>'+alerts.summary.today+' hoje</span><span>'+alerts.summary.upcoming+' próximos</span></div>'+
  (prefs.enabled?groups.map(([key,label,glyph])=>{
    const rows=alerts.items.filter(entry=>entry.group===key);
    return '<section class="gb-alerts-group"><h2>'+icon(glyph)+' '+label+' <small>'+rows.length+'</small></h2>'+
      (rows.length?'<div class="gb-alerts-list">'+rows.map(item).join('')+'</div>':
       '<p class="gb-alerts-empty">Nenhum lembrete nesta faixa.</p>')+'</section>';
   }).join(''):
   '<div class="gb-alerts-disabled">Seus avisos estão desativados. Toque em <strong>Configurar avisos</strong> para reativar.</div>')+
  '<p class="gb-alerts-disclaimer">Estes são lembretes exibidos dentro do GB+. O aplicativo ainda não envia notificações push quando está fechado. As preferências ficam salvas com seus dados.</p>';
}

export function partnersView(db,state){const ps=db.partners.filter(p=>`${p.name} ${p.tradeName} ${p.document}`.toLowerCase().includes(state.partnerQuery.toLowerCase()));return `${heading('Parceiros','Pessoas e empresas que fazem parte do seu negócio.',button(icon('plus')+'Novo parceiro','new-partner','primary'))}<section class="panel"><div class="filters"><label class="search-field">${icon('search')}<input id="partner-search" type="search" placeholder="Buscar nome, CPF ou CNPJ" aria-label="Pesquisar parceiros" value="${esc(state.partnerQuery)}"></label><span class="muted">${ps.length} parceiros</span></div>${ps.length?`<div class="partner-grid">${ps.map(p=>`<article class="partner-card"><div class="partner-top"><div class="partner-avatar">${esc(p.name.slice(0,2).toUpperCase())}</div><span class="badge">${p.active?'Ativo':'Inativo'}</span></div><h3>${esc(p.name)}</h3><p>${esc(p.tradeName||p.email||'Sem nome fantasia')}</p><div class="role-list">${p.roles.map(r=>`<span>${esc(r)}</span>`).join('')}</div><div class="partner-bottom">${button('Ver histórico','partner-detail','small',`data-id="${p.id}"`)}<button class="icon-button" data-action="edit-partner" data-id="${p.id}" aria-label="Editar ${esc(p.name)}">${icon('edit')}</button></div></article>`).join('')}</div>`:empty('Bons negócios começam com boas conexões','Cadastre clientes, fornecedores e outros parceiros.','new-partner','Adicionar parceiro')}</section>`;}
export function accountsView(db,{embedded=false}={}){
 const accounts=db.accounts.filter(a=>accountKind(a)!=='goal');
 const goals=db.accounts.filter(a=>accountKind(a)==='goal');
 const goalCards=goals.map(a=>
  '<article class="gb-goal-card" data-goal-id="'+esc(a.id)+'">'+
   '<div class="gb-goal-top">'+accountMark(db,a)+
    '<span class="badge">'+(a.active?'Ativo':'Inativo')+'</span></div>'+
   '<h3>'+esc(a.name)+'</h3>'+
   '<span class="gb-goal-balance">'+money(accountBalance(db,a.id,today()))+'</span>'+
   goalProgressMarkup(db,a)+
   '<div class="gb30-primary-actions">'+
    (a.active!==false?button(icon('plus')+'Guardar','goal-deposit','primary small','data-id="'+esc(a.id)+'"'):'')+
   '</div>'+
   '<details class="gb30-more"><summary>'+icon('chevron')+' Mais opções</summary><div class="gb30-more-actions">'+
    (a.active!==false?button('Retirar','goal-withdraw','small','data-id="'+esc(a.id)+'"'):'')+
    button('Movimentações','account-detail','small','data-id="'+esc(a.id)+'"')+
    button('Editar cofrinho','edit-account','small','data-id="'+esc(a.id)+'"')+
   '</div></details></article>').join('');
 const accountCards=accounts.map(a=>
  '<article class="panel account-card"><div class="panel-heading">'+
   '<span class="gb-account-bank-logo">'+accountMark(db,a)+'</span>'+
   '<span class="badge">'+(a.active?'Ativa':'Inativa')+'</span></div>'+
   '<h2>'+esc(a.name)+'</h2>'+
   '<p>'+esc(accountKind(a)==='bank'?(bankName(db,a.bankId,a.bank)||'Conta financeira'):accountTypeLabel(a))+'</p>'+
   '<strong>'+money(accountBalance(db,a.id,today()))+'</strong>'+
   '<small>Saldo atual</small>'+
   '<div class="gb30-primary-actions">'+
    button('Movimentações','account-detail','small','data-id="'+esc(a.id)+'"')+
   '</div>'+
   '<details class="gb30-more"><summary>'+icon('chevron')+' Mais opções</summary><div class="gb30-more-actions">'+
    button('Editar conta','edit-account','small','data-id="'+esc(a.id)+'"')+
    button('Conciliações','bank-import-history','small','data-id="'+esc(a.id)+'"')+
    (a.active!==false?button(icon('upload')+'Importar extrato','bank-import-open','small','data-id="'+esc(a.id)+'"'):'')+
   '</div></details></article>').join('');
 const saved=goals.reduce((sum,a)=>sum+accountBalance(db,a.id,today()),0);
 const available=accounts.reduce((sum,a)=>sum+accountBalance(db,a.id,today()),0);
 return (embedded?'':heading('Contas financeiras','Bancos, contas personalizadas e metas num só lugar.',
  button('Novo cofrinho','new-goal','small')+
  button(icon('plus')+'Nova conta','new-account','primary')))+
  '<div class="gb30-accounts-summary" aria-label="Resumo das contas">'+
   '<div><small>Em contas</small><strong>'+money(available)+'</strong></div>'+
   '<div><small>Nos cofrinhos</small><strong>'+money(saved)+'</strong></div>'+
  '</div>'+
  '<section class="gb-goals-section" aria-label="Cofrinhos e metas">'+
   '<div class="gb-goals-head"><div><h2>Meus cofrinhos</h2><p>Acompanhe seus objetivos, sem misturar transferências com receitas.</p></div>'+
    button(icon('plus')+'Criar meta','new-goal','small')+'</div>'+
   (goals.length?'<div class="gb-goal-grid">'+goalCards+'</div>':
    '<div class="gb-goal-empty"><div><strong>Seu primeiro cofrinho</strong><p>Reserve para emergências, casamento, educação ou qualquer sonho.</p></div>'+
    button('Criar cofrinho','new-goal','small')+'</div>')+
  '</section>'+
  '<h2 class="gb-standard-accounts-label">Contas e dinheiro disponível</h2>'+
  '<div class="account-grid">'+accountCards+'</div>'+
  (!accounts.length?'<section class="panel">'+
    empty('Onde seu dinheiro se movimenta?','Adicione uma conta bancária ou personalizada para guardar e transferir valores.','new-account','Adicionar conta')+
   '</section>':'');
}
export function categoriesView(db){
 const missing=missingCategorySuggestions(db.categories);
 // Do not destroy legacy IDs: card purchases, statement imports and older titles
 // may still reference them. Keep referenced legacy categories editable.
 const historicalIds=new Set([
  ...(db.titles||[]).map(t=>t.categoryId),
  ...(db.cardPurchases||[]).map(p=>p.categoryId),
  ...(db.bankImportBatches||[]).flatMap(b=>(b.entries||[]).map(e=>e.categoryId))
 ]);
 const visible=db.categories.filter(c=>!isLegacyServiceCategory(c)||historicalIds.has(c.id));
 return `${heading('Categorias','Dê significado a cada entrada e saída.',button(icon('plus')+'Nova categoria','new-category','primary')+(missing.length?button('Adicionar '+missing.length+' sugestões','add-suggested-categories','small') : ''))}<div class="two-columns">${['income','expense'].map(type=>`<section class="panel"><div class="panel-heading"><h2>${icon(type==='income'?'up':'down')} ${type==='income'?'Receitas':'Despesas'}</h2><span class="badge">${visible.filter(c=>c.type===type).length}</span></div><div class="category-list">${visible.filter(c=>c.type===type).map(c=>`<div><span class="gb-category-list-label"><span class="gb-category-list-icon">${gbIcon(categoryIconFor(c))}</span>${esc(c.name)}${isLegacyServiceCategory(c)?' <small>(categoria antiga)</small>':''}</span><button class="icon-button" data-action="edit-category" data-id="${c.id}" aria-label="Editar ${esc(c.name)}">${icon('edit')}</button></div>`).join('')}</div></section>`).join('')}</div>`;
}
export function flowView(db,state){
 const status=['all','paid','pending'].includes(state.flowStatus)?state.flowStatus:'all';
 const rows=filterFlowRows(flow(db,state.range,state.granularity),status);
 const m=metrics(db,state.range);
 const modes=[['day','Diário'],['week','Semanal'],['month','Mensal']];
 const statuses=[['all','Todos'],['paid','Baixados'],['pending','Pendentes']];
 const columns=status==='paid'
   ? [['Entradas realizadas','actualIn'],['Saídas realizadas','actualOut'],['Resultado realizado','actualResult']]
   : status==='pending'
   ? [['Entradas previstas','expectedIn'],['Saídas previstas','expectedOut'],['Saldo previsto','pendingResult']]
   : [['Entradas previstas','expectedIn'],['Saídas previstas','expectedOut'],['Entradas realizadas','actualIn'],['Saídas realizadas','actualOut'],['Resultado realizado','actualResult']];
 const amountFor=(row,key)=>key==='actualResult'?row.actualIn-row.actualOut:key==='pendingResult'?row.expectedIn-row.expectedOut:row[key];
 const table='<div class="gb-flow-table-hint">Deslize a tabela horizontalmente para consultar as outras colunas.</div>'+
  '<div class="table-wrap" role="region" tabindex="0" aria-label="Movimentações financeiras por período"><table><thead><tr><th scope="col">Período (início)</th>'+
  columns.map(([label])=>'<th scope="col" class="numeric">'+label+'</th>').join('')+'</tr></thead><tbody>'+
  rows.map(row=>'<tr><th scope="row">'+dateLabel(row.date)+'</th>'+columns.map(([,key])=>'<td class="numeric">'+money(amountFor(row,key))+'</td>').join('')+'</tr>').join('')+
  '</tbody></table></div>';
 const description=status==='paid'
  ? 'Somente valores recebidos e pagos, pelas datas das baixas.'
  : status==='pending'
  ? 'Somente saldos em aberto, pelas datas dos vencimentos.'
  : 'Valores já baixados e saldos pendentes, sem contagem duplicada.';
 return heading(state.route==='provisions'?'Provisões financeiras':'Fluxo de caixa',
  'Previsões são saldos pendentes. Realizados vêm exclusivamente das baixas.',periodBar(state))+
  '<div class="stats-grid three">'+stat('balance',m.balance,'Saldo atual de todas as contas','wallet','featured')+
  stat('provisions',m.provisions,'Pendentes com vencimento no período','layers')+
  '<article class="stat"><div class="stat-top">'+icon('chart')+'</div><p>Saldo projetado</p><strong>'+money(m.balance+m.provisions)+'</strong><small>Saldo atual + previsões do período</small></article></div>'+
  '<section class="panel gb-cashflow-panel">'+
  '<div class="panel-heading"><h2>Previsto e realizado</h2><div class="segmented" role="group" aria-label="Agrupar por período">'+
  modes.map(([key,label])=>'<button type="button" class="'+(state.granularity===key?'active':'')+'" data-action="granularity" data-value="'+key+'" aria-pressed="'+(state.granularity===key)+'">'+label+'</button>').join('')+
  '</div></div>'+
  '<div class="gb-flow-status-toolbar"><span>Situação dos lançamentos</span><div class="gb-flow-status-switch" role="group" aria-label="Filtrar o fluxo por situação">'+
  statuses.map(([key,label])=>'<button type="button" data-action="flow-status" data-value="'+key+'" class="'+(status===key?'active':'')+'" aria-pressed="'+(status===key)+'">'+label+'</button>').join('')+
  '</div></div>'+
  '<div class="gb-flow-graph-toolbar"><strong>Visualização do gráfico</strong>'+
  '<div class="gb-flow-graph-switch" role="group" aria-label="Escolha o tipo de gráfico">'+
  '<button type="button" data-action="flow-chart-mode" data-mode="bars" class="button '+(state.flowChartMode==='bars'?'primary':'')+'" aria-pressed="'+(state.flowChartMode==='bars')+'">Barras</button>'+
  '<button type="button" data-action="flow-chart-mode" data-mode="lines" class="button '+(state.flowChartMode==='lines'?'primary':'')+'" aria-pressed="'+(state.flowChartMode==='lines')+'">Linhas</button>'+
  '<button type="button" data-action="flow-chart-mode" data-mode="net" class="button '+(state.flowChartMode==='net'?'primary':'')+'" aria-pressed="'+(state.flowChartMode==='net')+'">Resultado</button>'+
  '</div><p>'+description+'</p></div>'+
  '<div class="gb-chart-slot gb-cashflow-slot"><div class="gb-react-charts" data-gb-react="cashflow-bars" hidden></div>'+
  '<div class="gb-chart-fallback"><div data-gb-native="cashflow-bars" hidden></div></div></div>'+
  (rows.length?table:empty('Nenhuma movimentação nesta situação','Escolha outro período ou consulte os demais estados dos lançamentos.'))+
  '<div class="panel-bottom"><span>Transferências internas não são receitas nem despesas.</span>'+
  button(icon('download')+'CSV','export-flow','small')+'</div></section>';
}
export const reportTypes=[['payable','Contas a pagar'],['receivable','Contas a receber'],['late','Títulos vencidos'],['income','Receitas por categoria'],['expense','Despesas por categoria'],['partner','Movimentações por parceiro'],['card-purchases','Compras no cartão por categoria'],['due-overview','Painel de vencimentos'],['flow','Fluxo de caixa mensal'],['result','Resultado financeiro']];
export function reportData(db,state){const type=state.report;const m=metrics(db,state.range);if(type==='due-overview'){const day=today();const rows=db.titles.filter(t=>!t.cancelled&&pending(db,t)>0&&within(t.due,state.range)).sort((a,b)=>a.due.localeCompare(b.due));return [['Faixa','Descrição','Tipo','Vencimento','Situação','Pendente'],...rows.map(t=>[t.due<day?'Atrasado':t.due===day?'Hoje':'Previsto',t.description,t.type==='income'?'A receber':'A pagar',dateLabel(t.due),status(db,t),money(pending(db,t))])];}if(['payable','receivable','late'].includes(type)){const ts=db.titles.filter(t=>within(t.due,state.range)&&pending(db,t)>0&&(type==='late'?t.due<today():t.type===(type==='payable'?'expense':'income')));return [['Descrição','Parceiro','Vencimento','Situação','Valor','Pendente'],...ts.map(t=>[t.description,db.partners.find(p=>p.id===t.partnerId)?.name||'—',dateLabel(t.due),status(db,t),money(t.amount),money(pending(db,t))])];}if(['income','expense'].includes(type))return [['Categoria','Valor realizado'],...db.categories.filter(c=>c.type===type).map(c=>[c.name,money(db.payments.filter(p=>within(p.date,state.range)&&db.titles.find(t=>t.id===p.titleId)?.categoryId===c.id).reduce((s,p)=>s+p.amount,0))])];if(type==='card-purchases')return [['Categoria da compra','Valor das compras'],...db.categories.filter(c=>c.type==='expense').map(c=>[c.name,(db.cardPurchases||[]).filter(p=>p.categoryId===c.id&&within(p.date,state.range)).reduce((sum,p)=>sum+p.amount,0)]).filter(row=>row[1]>0).map(([name,amount])=>[name,money(amount)])];if(type==='partner')return [['Data','Parceiro','Descrição','Tipo','Valor'],...db.payments.filter(p=>within(p.date,state.range)&&(!state.reportPartner||db.titles.find(t=>t.id===p.titleId)?.partnerId===state.reportPartner)).map(p=>{const t=db.titles.find(t=>t.id===p.titleId);return [dateLabel(p.date),db.partners.find(x=>x.id===t.partnerId)?.name||'Sem parceiro',t.description,t.type==='income'?'Receita':'Despesa',money(p.amount)];})];if(type==='flow')return [['Mês','Entradas previstas','Saídas previstas','Entradas realizadas','Saídas realizadas'],...flow(db,state.range).map(r=>[dateLabel(r.date).slice(3),...[r.expectedIn,r.expectedOut,r.actualIn,r.actualOut].map(money)])];return [['Indicador','Valor'],['Receitas recebidas',money(m.received)],['Despesas pagas',money(m.spent)],['Resultado financeiro',money(m.result)]];}
export function financialReportImportEntry(){
 return '<section class="panel gb-fin-import-entry gb-fin-import-hide-mobile">'+
  '<div class="gb-fin-import-entry-head"><div><h3>Importar relatórios financeiros</h3>'+
  '<p>Leitura e conferência de PDF, Excel ou CSV no computador. A importação só grava após confirmação.</p></div></div>'+
  '<div class="gb-fin-import-types">'+
  '<button type="button" class="gb-fin-import-type" data-action="financial-import-open" data-kind="receivable">'+icon('up')+
   '<strong>Contas a receber</strong><small>Títulos previstos, vencimentos e clientes.</small></button>'+
  '<button type="button" class="gb-fin-import-type" data-action="financial-import-open" data-kind="payable">'+icon('down')+
   '<strong>Contas a pagar</strong><small>Fornecedores, notas, vencimentos e títulos pagos.</small></button>'+
  '<button type="button" class="gb-fin-import-type" data-action="financial-import-open" data-kind="received">'+icon('check')+
   '<strong>Contas recebidas</strong><small>Liquidações do Sicoob; baixas administrativas excluídas.</small></button>'+
  '</div></section>';
}
export function reportsView(db,state){const data=reportData(db,state);return `${heading('Relatórios','Informação organizada para decidir com confiança.',button(icon('download')+'Exportar CSV','export-report','primary'))}<section class="panel"><div class="filters">${select('Relatório','report',reportTypes,state.report,'id="report-type"')}${periodBar(state)}${state.report==='partner'?select('Parceiro','reportPartner',[['','Todos'],...db.partners.map(p=>[p.id,p.name])],state.reportPartner,'id="report-partner"'):''}</div><div class="table-wrap"><table><thead><tr>${data[0].map(v=>`<th>${esc(v)}</th>`).join('')}</tr></thead><tbody>${data.slice(1).map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${state.report==='card-purchases'?'<p class="form-hint" style="padding:12px 18px">Compras na data original, sem duplicidade: o caixa só é reduzido quando a fatura é paga.</p>':''}${data.length===1?empty('Nenhum registro neste período','Ajuste o período ou adicione lançamentos.'):''}</section>${financialReportImportEntry()}`;}
function cfgOption(title,description,ico,color,action,badge=''){
 return `<button type="button" class="gb-cfg-row" data-action="${action}" data-settings-keywords="${esc(title+' '+description)}"><span class="gb-cfg-row-icon tone-${color}">${icon(ico)}</span><span class="gb-cfg-row-label"><strong>${esc(title)}</strong><small>${esc(description)}</small></span>${badge?`<span class="gb-cfg-version">${esc(badge)}</span>`:''}<span class="gb-cfg-next">${icon('chevron')}</span></button>`;
}
function cfgSection(label,rows,embedded=false){
 if(embedded)return `<details class="gb-cfg-group gb-more-cfg-group" aria-label="${esc(label)}" ${label==='PREFERÊNCIAS'?'open':''}><summary class="gb-more-cfg-summary"><span>${esc(label)}</span>${icon('chevron')}</summary><div class="gb-cfg-list">${rows}</div></details>`;
 return `<section class="gb-cfg-group" aria-label="${esc(label)}"><h2>${esc(label)}</h2><div class="gb-cfg-list">${rows}</div></section>`;
}
export function settingsView(db,canInstall,online=false,user=null,installed=false,embedded=false){
 const section=(label,rows)=>cfgSection(label,rows,embedded);
 const appVersion=document.querySelector('meta[name="gbplus-version"]')?.content||'2.1.3';
 const name=String(user?.user_metadata?.gbplus_profile?.full_name||user?.user_metadata?.full_name||user?.user_metadata?.name||user?.email?.split('@')[0]||'Minha conta').trim();
 // Visibility is restricted to the owner; the admin API independently validates
 // the authenticated user's live app_metadata on every request.
 const administration=online&&user?.id==='aa9701df-8e84-42cc-b2bd-4b644a983260'&&user?.app_metadata?.gbplus_admin===true
  ?section('ADMINISTRAÇÃO',`<a href="./admin.html" class="gb-cfg-row" data-settings-keywords="painel administrativo usuários perfis gerenciar"><span class="gb-cfg-row-icon tone-purple">${icon('shield')}</span><span class="gb-cfg-row-label"><strong>Painel administrativo</strong><small>Gerenciar usuários e perfis do GB+</small></span><span class="gb-cfg-next">${icon('chevron')}</span></a>`):'';
 const preferences=section('PREFERÊNCIAS',
  cfgOption('Aparência','Escolha entre modo claro e escuro','palette','purple','settings-appearance')+
  cfgOption('Avisos de vencimento','Escolha prazos e tipos de lembretes','bell','orange','notification-preferences')+
  cfgOption('Preferências de e-mail','Autorize ou cancele mensagens promocionais','bell','green','email-preferences')+
  cfgOption('Personalizar painel','Escolha e organize os cards do início','grid','blue','customize')+
  cfgOption('Barra de ações','Defina os atalhos exibidos na navegação','phone','cyan','customize-mobile-nav'));
 const records=section('DADOS E REGISTROS',
  cfgOption('Backup e restauração','Exportar ou restaurar seus dados','cloud','green','settings-backup')+
  cfgOption('Dados da conta','Registros, sincronização e armazenamento','database','blue','settings-data')+
  cfgOption('Limpar todos os dados','Recomeçar o financeiro sem excluir seu login','trash','neutral','settings-reset')+
  cfgOption('Configuração inicial','Ajustes básicos e saldo inicial','gear','orange','restart-setup')+
  cfgOption('Bancos e instituições','Gerenciar logos e instituições personalizadas','wallet','blue','open-banks')+
  cfgOption('Cartões de crédito','Limites, faturas e compras parceladas','credit-card','purple','open-cards'));
 const system=section('SISTEMA',
  cfgOption('Atualizações do GB+','Verificar nova versão e instalar','refresh','blue','settings-updates','v'+appVersion)+
  (installed?'':cfgOption('Instalar aplicativo','Adicionar o GB+ à tela inicial','download','purple','install')));
 const support=section('SUPORTE E SOBRE',
  cfgOption('Convidar um amigo','Compartilhe o GB+ com seus amigos','share','green','invite-friend')+
  cfgOption('Ajuda e suporte','Dúvidas, tutoriais e contato','help','blue','settings-help')+
  cfgOption('Sobre o GB+','Versão, novidades e licenças','info','neutral','settings-about'));
 return `<div class="gb-settings-layout${embedded?' gb-more-settings':''}">\n  ${embedded?'':`  <header class="gb-cfg-header"><a href="#dashboard" class="gb-cfg-back" aria-label="Voltar ao início">${icon('arrow')}</a><h1>Configurações</h1><button type="button" class="gb-cfg-search-trigger" data-action="settings-search" aria-label="Pesquisar nas configurações" aria-expanded="false" aria-controls="gb-cfg-search">${icon('search')}</button></header>
  <div id="gb-cfg-search" class="gb-cfg-search" hidden><label for="settings-search-input" class="sr-only">Buscar configurações</label>${icon('search')}<input type="search" id="settings-search-input" placeholder="Pesquisar configurações" autocomplete="off" aria-label="Pesquisar configurações"></div>
  <a href="#profile" class="gb-cfg-profile"><span class="gb-cfg-profile-avatar">${icon('user')}</span><span class="gb-cfg-profile-label"><strong>${esc(name)}</strong><small>Gerenciar conta, dados e segurança</small></span><span class="gb-cfg-next">${icon('chevron')}</span></a>`}\n  ${administration}${preferences}${records}${system}${support}
  ${online?'<button type="button" class="gb-cfg-delete gb-cfg-row" data-action="settings-delete" data-settings-keywords="excluir conta remover permanentemente dados"><span class="gb-cfg-row-icon">'+icon('trash')+'</span><span class="gb-cfg-row-label"><strong>Excluir conta</strong><small>Excluir cadastro, login e dados permanentemente</small></span><span class="gb-cfg-next">'+icon('chevron')+'</span></button>':''}
  <p class="gb-cfg-empty" id="gb-cfg-no-results" hidden>Nenhuma configuração encontrada.</p>
  <input type="file" id="backup-input" accept=".json,application/json" hidden>
 </div>`;
}
