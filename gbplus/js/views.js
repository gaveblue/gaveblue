import {money,today,dateLabel,metrics,pending,paid,status,flow,accountBalance,within} from './domain.js';
import {INDICATORS} from './store.js';
import {esc,icon,button,empty,titleTable,chart,select,field} from './ui.js?v=20261104-33';
export const routes=[['dashboard','Dashboard','home'],['titles','Lançamentos','titles'],['payable','Contas a pagar','down'],['receivable','Contas a receber','up'],['provisions','Provisões','layers'],['flow','Fluxo de caixa','chart'],['partners','Parceiros','people'],['accounts','Contas bancárias','wallet'],['categories','Categorias','category'],['reports','Relatórios','chart'],['notifications','Notificações','bell'],['settings','Configurações','settings']];
const stat=(key,value,subtitle,ico,extra='')=>`<article class="stat ${extra}" data-indicator="${key}"><div class="stat-top"><span class="stat-icon">${icon(ico)}</span>${key==='balance'?'<span class="stat-tag">AGORA</span>':''}</div><p>${INDICATORS[key]}</p><strong>${money(value)}</strong><small>${subtitle}</small></article>`;
export function periodBar(state){return `<div class="period-control">${icon('calendar')}<select id="period" aria-label="Período"><option value="month" ${state.period==='month'?'selected':''}>Este mês</option><option value="last" ${state.period==='last'?'selected':''}>Mês anterior</option><option value="year" ${state.period==='year'?'selected':''}>Este ano</option><option value="all" ${state.period==='all'?'selected':''}>Todo o período</option><option value="custom" ${state.period==='custom'?'selected':''}>Personalizado</option></select></div>`;}
export function heading(title,subtitle,actions=''){return `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;}
function dashboardGreeting(user){
 const hour=new Date().getHours();
 const greeting=hour<12?'Bom dia':hour<18?'Boa tarde':'Boa noite';
 const name=String(user?.user_metadata?.gbplus_profile?.full_name||user?.user_metadata?.full_name||user?.user_metadata?.name||'').trim().split(/\s+/)[0].slice(0,35);
 return esc(greeting+(name?', '+name:'')+'!');
}
export function dashboard(db,state,online=false,user=null){const m=metrics(db,state.range);const upcoming=db.titles.filter(t=>pending(db,t)>0&&within(t.due,state.range)).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,4);return `${heading(dashboardGreeting(user),'Aqui está o resumo do seu financeiro.',periodBar(state))}<div class="section-kicker">VISÃO GERAL <span>${state.range.from?dateLabel(state.range.from)+' — '+dateLabel(state.range.to):'Todos os registros'}</span></div><div class="stats-grid">${stat('balance',m.balance,'Saldo atual de todas as contas','wallet','featured')}${stat('receivable',m.receivable,'Saldo pendente no período','up')}${stat('payable',m.payable,'Saldo pendente no período','down')}${stat('provisions',m.provisions,'Entradas − saídas previstas','layers')}</div><div class="dashboard-middle"><section class="panel flow-panel" data-indicator="chart"><div class="panel-heading"><div><h2>Fluxo de caixa</h2><p>O movimento real do seu dinheiro</p></div><div class="legend"><span>Receitas</span><span>Despesas</span></div></div>${chart(flow(db,state.range))}<div class="panel-bottom"><span>Valores efetivamente recebidos e pagos</span><a href="#flow">Ver fluxo completo ${icon('arrow')}</a></div></section><section class="panel upcoming-panel" data-indicator="upcoming"><div class="panel-heading"><div><h2>Próximos vencimentos</h2><p>O que merece sua atenção</p></div><a href="#titles" class="icon-button" aria-label="Ver todos os títulos">${icon('chevron')}</a></div>${upcoming.length?`<div class="upcoming-list">${upcoming.map(t=>`<button data-action="title-detail" data-id="${t.id}" class="upcoming-item"><span class="item-icon ${t.type==='income'?'income-arrow':'expense-arrow'}">${icon(t.type==='income'?'up':'down')}</span><span><b>${esc(t.description)}</b><small>${t.due<today()?'Vencido · ':''}${dateLabel(t.due)} · ${t.type==='income'?'A receber':'A pagar'}</small></span><strong>${money(pending(db,t))}</strong></button>`).join('')}</div>`:empty('Tudo tranquilo por aqui','Nenhum vencimento neste período.')}<div class="panel-bottom"><span>${db.titles.filter(t=>pending(db,t)>0&&within(t.due,state.range)).length} títulos em aberto no período</span></div></section></div><section class="results-grid">${stat('received',m.received,'Recebimentos no período','up')}${stat('spent',m.spent,'Pagamentos no período','down')}${stat('result',m.result,'Recebido − pago no período','chart')}${stat('overdue',m.overdue,'Pendências vencidas no período','clock')}</section><section class="getting-started"><div class="intro-icon">${icon('plus')}</div><div><h2>${db.titles.length?'Um financeiro organizado começa no registro.':'Seu próximo passo começa aqui.'}</h2><p>${db.titles.length?'Único, parcelado ou recorrente. Registre uma vez e acompanhe tudo.':'Adicione sua conta e faça o primeiro lançamento. A clareza vem com o hábito.'}</p></div>${button(icon('plus')+'Novo lançamento','new-title','primary')}</section><div class="local-note">${icon('info')} ${online?'Dados da sua conta online. Use o mesmo login em seus dispositivos. Gravações exigem conexão.':'Dados salvos somente neste navegador. Para levar seus registros a outro dispositivo, exporte e restaure um backup.'}</div>`;}
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
 const day=today(),next=new Date(day+'T12:00:00');next.setDate(next.getDate()+7);
 const limit=next.getFullYear()+'-'+String(next.getMonth()+1).padStart(2,'0')+'-'+String(next.getDate()).padStart(2,'0');
 const open=db.titles.filter(t=>!t.cancelled&&pending(db,t)>0);
 const late=open.filter(t=>t.due<day).sort((a,b)=>a.due.localeCompare(b.due));
 const current=open.filter(t=>t.due===day);
 const soon=open.filter(t=>t.due>day&&t.due<=limit).sort((a,b)=>a.due.localeCompare(b.due));
 const groups=[['Atrasados',late,'clock'],['Vencem hoje',current,'calendar'],['Próximos 7 dias',soon,'bell']];
 const item=t=>{
  const category=db.categories.find(c=>c.id===t.categoryId)?.name||'Sem categoria';
  return '<button class="notification-item" type="button" data-action="title-detail" data-id="'+esc(t.id)+'">'+
   '<span class="notification-direction '+(t.type==='income'?'income-arrow':'expense-arrow')+'">'+icon(t.type==='income'?'up':'down')+'</span>'+
   '<span class="notification-description"><strong>'+esc(t.description)+'</strong><small>'+esc(category)+' · '+(t.type==='income'?'A receber':'A pagar')+' · '+dateLabel(t.due)+'</small></span>'+
   '<span class="notification-amount">'+money(pending(db,t))+'</span>'+icon('chevron')+
  '</button>';
 };
 return heading('Notificações','Seus compromissos financeiros que merecem atenção.')+
  '<div class="notification-overview"><span>'+icon('clock')+' <b>'+late.length+'</b> atrasado(s)</span>'+
   '<span>'+icon('calendar')+' <b>'+current.length+'</b> vencem hoje</span>'+
   '<span>'+icon('bell')+' <b>'+soon.length+'</b> nos próximos 7 dias</span></div>'+
  '<div class="notification-groups">'+groups.map(([name,rows,ico])=>
   '<section class="panel notification-group"><div class="notification-group-heading"><h2>'+icon(ico)+' '+name+'</h2><span class="badge">'+rows.length+'</span></div>'+
   (rows.length?'<div class="notification-items">'+rows.map(item).join('')+'</div>':
    '<p class="notification-empty">Nenhum título '+(name==='Atrasados'?'atrasado':name==='Vencem hoje'?'vence hoje':'vence nos próximos 7 dias')+'.</p>')+
   '</section>').join('')+
  '</div><p class="notification-help">Estas notificações são calculadas com base nos títulos em aberto do GB+. Toque em um lançamento para ver seus detalhes. Não são alertas enviados ao telefone.</p>';
}

export function partnersView(db,state){const ps=db.partners.filter(p=>`${p.name} ${p.tradeName} ${p.document}`.toLowerCase().includes(state.partnerQuery.toLowerCase()));return `${heading('Parceiros','Pessoas e empresas que fazem parte do seu negócio.',button(icon('plus')+'Novo parceiro','new-partner','primary'))}<section class="panel"><div class="filters"><label class="search-field">${icon('search')}<input id="partner-search" type="search" placeholder="Buscar nome, CPF ou CNPJ" aria-label="Pesquisar parceiros" value="${esc(state.partnerQuery)}"></label><span class="muted">${ps.length} parceiros</span></div>${ps.length?`<div class="partner-grid">${ps.map(p=>`<article class="partner-card"><div class="partner-top"><div class="partner-avatar">${esc(p.name.slice(0,2).toUpperCase())}</div><span class="badge">${p.active?'Ativo':'Inativo'}</span></div><h3>${esc(p.name)}</h3><p>${esc(p.tradeName||p.email||'Sem nome fantasia')}</p><div class="role-list">${p.roles.map(r=>`<span>${esc(r)}</span>`).join('')}</div><div class="partner-bottom">${button('Ver histórico','partner-detail','small',`data-id="${p.id}"`)}<button class="icon-button" data-action="edit-partner" data-id="${p.id}" aria-label="Editar ${esc(p.name)}">${icon('edit')}</button></div></article>`).join('')}</div>`:empty('Bons negócios começam com boas conexões','Cadastre clientes, fornecedores e outros parceiros.','new-partner','Adicionar parceiro')}</section>`;}
export function accountsView(db){return `${heading('Contas bancárias','Saldos reais. Todas as contas sob seu controle.',button(icon('transfer')+'Transferir','new-transfer')+button(icon('plus')+'Nova conta','new-account','primary'))}<div class="account-grid">${db.accounts.map(a=>`<article class="panel account-card"><div class="panel-heading"><span class="stat-icon">${icon('wallet')}</span><span class="badge">${a.active?'Ativa':'Inativa'}</span></div><h2>${esc(a.name)}</h2><p>${esc(a.bank||'Conta financeira')}</p><strong>${money(accountBalance(db,a.id,today()))}</strong><small>Saldo atual · Inicial: ${money(a.initial)}</small><div class="partner-bottom">${button('Movimentações','account-detail','small',`data-id="${a.id}"`)}<button class="icon-button" data-action="edit-account" data-id="${a.id}" aria-label="Editar conta ${esc(a.name)}">${icon('edit')}</button></div></article>`).join('')}</div>${!db.accounts.length?`<section class="panel">${empty('Onde seu dinheiro se movimenta?','Adicione uma conta bancária, carteira ou caixa para registrar baixas.','new-account','Adicionar conta')}</section>`:''}`;}
export function categoriesView(db){return `${heading('Categorias','Dê significado a cada entrada e saída.',button(icon('plus')+'Nova categoria','new-category','primary'))}<div class="two-columns">${['income','expense'].map(type=>`<section class="panel"><div class="panel-heading"><h2>${icon(type==='income'?'up':'down')} ${type==='income'?'Receitas':'Despesas'}</h2><span class="badge">${db.categories.filter(c=>c.type===type).length}</span></div><div class="category-list">${db.categories.filter(c=>c.type===type).map(c=>`<div><span>${esc(c.name)}</span><button class="icon-button" data-action="edit-category" data-id="${c.id}" aria-label="Editar ${esc(c.name)}">${icon('edit')}</button></div>`).join('')}</div></section>`).join('')}</div>`;}
export function flowView(db,state){const rows=flow(db,state.range,state.granularity);const m=metrics(db,state.range);return `${heading(state.route==='provisions'?'Provisões financeiras':'Fluxo de caixa','Previsões são saldos pendentes. Realizados vêm exclusivamente das baixas.',periodBar(state))}<div class="stats-grid three">${stat('balance',m.balance,'Saldo atual de todas as contas','wallet','featured')}${stat('provisions',m.provisions,'Pendentes com vencimento no período','layers')}<article class="stat"><div class="stat-top">${icon('chart')}</div><p>Saldo projetado</p><strong>${money(m.balance+m.provisions)}</strong><small>Saldo atual + previsões do período</small></article></div><section class="panel"><div class="panel-heading"><h2>Previsto e realizado</h2><div class="segmented">${[['day','Diário'],['week','Semanal'],['month','Mensal']].map(([k,v])=>`<button class="${state.granularity===k?'active':''}" data-action="granularity" data-value="${k}">${v}</button>`).join('')}</div></div>${rows.length?`<div class="table-wrap"><table><thead><tr><th>Período (início)</th><th class="numeric">Entradas previstas</th><th class="numeric">Saídas previstas</th><th class="numeric">Entradas realizadas</th><th class="numeric">Saídas realizadas</th><th class="numeric">Resultado realizado</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${dateLabel(r.date)}</td>${[r.expectedIn,r.expectedOut,r.actualIn,r.actualOut,r.actualIn-r.actualOut].map(v=>`<td class="numeric">${money(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:empty('Seu fluxo ainda está em branco','Crie títulos e registre baixas para comparar previsões e realizações.')}<div class="panel-bottom"><span>Transferências internas não são receitas nem despesas.</span>${button(icon('download')+'CSV','export-flow','small')}</div></section>`;}
export const reportTypes=[['payable','Contas a pagar'],['receivable','Contas a receber'],['late','Títulos vencidos'],['income','Receitas por categoria'],['expense','Despesas por categoria'],['partner','Movimentações por parceiro'],['flow','Fluxo de caixa mensal'],['result','Resultado financeiro']];
export function reportData(db,state){const type=state.report;const m=metrics(db,state.range);if(['payable','receivable','late'].includes(type)){const ts=db.titles.filter(t=>within(t.due,state.range)&&pending(db,t)>0&&(type==='late'?t.due<today():t.type===(type==='payable'?'expense':'income')));return [['Descrição','Parceiro','Vencimento','Situação','Valor','Pendente'],...ts.map(t=>[t.description,db.partners.find(p=>p.id===t.partnerId)?.name||'—',dateLabel(t.due),status(db,t),money(t.amount),money(pending(db,t))])];}if(['income','expense'].includes(type))return [['Categoria','Valor realizado'],...db.categories.filter(c=>c.type===type).map(c=>[c.name,money(db.payments.filter(p=>within(p.date,state.range)&&db.titles.find(t=>t.id===p.titleId)?.categoryId===c.id).reduce((s,p)=>s+p.amount,0))])];if(type==='partner')return [['Data','Parceiro','Descrição','Tipo','Valor'],...db.payments.filter(p=>within(p.date,state.range)&&(!state.reportPartner||db.titles.find(t=>t.id===p.titleId)?.partnerId===state.reportPartner)).map(p=>{const t=db.titles.find(t=>t.id===p.titleId);return [dateLabel(p.date),db.partners.find(x=>x.id===t.partnerId)?.name||'Sem parceiro',t.description,t.type==='income'?'Receita':'Despesa',money(p.amount)];})];if(type==='flow')return [['Mês','Entradas previstas','Saídas previstas','Entradas realizadas','Saídas realizadas'],...flow(db,state.range).map(r=>[dateLabel(r.date).slice(3),...[r.expectedIn,r.expectedOut,r.actualIn,r.actualOut].map(money)])];return [['Indicador','Valor'],['Receitas recebidas',money(m.received)],['Despesas pagas',money(m.spent)],['Resultado financeiro',money(m.result)]];}
export function reportsView(db,state){const data=reportData(db,state);return `${heading('Relatórios','Informação organizada para decidir com confiança.',button(icon('download')+'Exportar CSV','export-report','primary'))}<section class="panel"><div class="filters">${select('Relatório','report',reportTypes,state.report,'id="report-type"')}${periodBar(state)}${state.report==='partner'?select('Parceiro','reportPartner',[['','Todos'],...db.partners.map(p=>[p.id,p.name])],state.reportPartner,'id="report-partner"'):''}</div><div class="table-wrap"><table><thead><tr>${data[0].map(v=>`<th>${esc(v)}</th>`).join('')}</tr></thead><tbody>${data.slice(1).map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${data.length===1?empty('Nenhum registro neste período','Ajuste o período ou adicione lançamentos.'):''}</section>`;}
function cfgOption(title,description,ico,color,action,badge=''){
 return `<button type="button" class="gb-cfg-row" data-action="${action}" data-settings-keywords="${esc(title+' '+description)}"><span class="gb-cfg-row-icon tone-${color}">${icon(ico)}</span><span class="gb-cfg-row-label"><strong>${esc(title)}</strong><small>${esc(description)}</small></span>${badge?`<span class="gb-cfg-version">${esc(badge)}</span>`:''}<span class="gb-cfg-next">${icon('chevron')}</span></button>`;
}
function cfgSection(label,rows){
 return `<section class="gb-cfg-group" aria-label="${esc(label)}"><h2>${esc(label)}</h2><div class="gb-cfg-list">${rows}</div></section>`;
}
export function settingsView(db,canInstall,online=false,user=null){
 const appVersion=document.querySelector('meta[name="gbplus-version"]')?.content||'2.1.0';
 const name=String(user?.user_metadata?.gbplus_profile?.full_name||user?.user_metadata?.full_name||user?.user_metadata?.name||user?.email?.split('@')[0]||'Minha conta').trim();
 const preferences=cfgSection('PREFERÊNCIAS',
  cfgOption('Aparência','Tema, cores e layout','palette','purple','settings-appearance')+
  cfgOption('Personalizar painel','Escolha e organize os cards do início','grid','blue','customize')+
  cfgOption('Barra de ações','Defina os atalhos exibidos na navegação','phone','cyan','customize-mobile-nav'));
 const records=cfgSection('DADOS E REGISTROS',
  cfgOption('Backup e restauração','Exportar ou restaurar seus dados','cloud','green','settings-backup')+
  cfgOption('Dados da conta','Registros, sincronização e armazenamento','database','blue','settings-data')+
  cfgOption('Configuração inicial','Ajustes básicos e saldo inicial','gear','orange','restart-setup'));
 const system=cfgSection('SISTEMA',
  cfgOption('Atualizações do GB+','Verificar nova versão e instalar','refresh','blue','settings-updates','v'+appVersion)+
  cfgOption('Instalar aplicativo','Adicionar o GB+ à tela inicial','download','purple','install'));
 const support=cfgSection('SUPORTE E SOBRE',
  cfgOption('Ajuda e suporte','Dúvidas, tutoriais e contato','help','blue','settings-help')+
  cfgOption('Sobre o GB+','Versão, novidades e licenças','info','neutral','settings-about'));
 return `<div class="gb-settings-layout">
  <header class="gb-cfg-header"><a href="#dashboard" class="gb-cfg-back" aria-label="Voltar ao início">${icon('arrow')}</a><h1>Configurações</h1><button type="button" class="gb-cfg-search-trigger" data-action="settings-search" aria-label="Pesquisar nas configurações" aria-expanded="false" aria-controls="gb-cfg-search">${icon('search')}</button></header>
  <div id="gb-cfg-search" class="gb-cfg-search" hidden><label for="settings-search-input" class="sr-only">Buscar configurações</label>${icon('search')}<input type="search" id="settings-search-input" placeholder="Pesquisar configurações" autocomplete="off" aria-label="Pesquisar configurações"></div>
  <a href="#profile" class="gb-cfg-profile"><span class="gb-cfg-profile-avatar">${icon('user')}</span><span class="gb-cfg-profile-label"><strong>${esc(name)}</strong><small>Gerenciar conta, dados e segurança</small></span><span class="gb-cfg-next">${icon('chevron')}</span></a>
  ${preferences}${records}${system}${support}
  <button type="button" class="gb-cfg-delete gb-cfg-row" data-action="settings-delete" data-settings-keywords="excluir conta remover permanentemente dados"><span class="gb-cfg-row-icon">${icon('trash')}</span><span class="gb-cfg-row-label"><strong>Excluir conta</strong><small>Remover permanentemente sua conta e dados</small></span><span class="gb-cfg-next">${icon('chevron')}</span></button>
  <p class="gb-cfg-empty" id="gb-cfg-no-results" hidden>Nenhuma configuração encontrada.</p>
  <input type="file" id="backup-input" accept=".json,application/json" hidden>
 </div>`;
}
