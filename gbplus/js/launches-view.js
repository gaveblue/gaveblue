import {money,dateLabel,pending,paid,today,within} from './domain.js?v=20261104-42';
import {esc,icon,select,empty} from './ui.js?v=20261104-42';
import {filteredTitles,periodBar} from './views.js?v=20261105-47';

const statusOptions=[
 ['all','Todos','layers'],['open','Pendentes','clock'],['settled','Pagos','check'],
 ['income','A receber','up'],['expense','A pagar','down']
];
function selectedStatus(state){
 if(state.type==='income'&&!state.status)return'income';
 if(state.type==='expense'&&!state.status)return'expense';
 return state.status||'all';
}
function launchCard(db,t,isSelected){
 const income=t.type==='income';
 const balance=pending(db,t);
 const label=t.cancelled?'Cancelado':balance===0?(income?'Recebido':'Pago'):paid(db,t.id)>0?'Parcial':t.due<today()?'Vencido':'Pendente';
 const statusStyle=t.cancelled?'cancelled':balance===0?'settled':t.due<today()?'late':'pending';
 const partner=db.partners.find(p=>p.id===t.partnerId)?.name||'Sem parceiro';
 const category=db.categories.find(c=>c.id===t.categoryId)?.name||'Sem categoria';
 const subtitle=partner==='Sem parceiro'?category:partner;
 return `<div class="gb-launch-swipe-shell" data-launch-id="${esc(t.id)}" data-intent="">
   <div class="gb-launch-underlay gb-launch-underlay-pay" aria-hidden="true">${icon('check')}<span>Baixar</span></div>
   <div class="gb-launch-underlay gb-launch-underlay-delete" aria-hidden="true">${icon('trash')}<span>Excluir</span></div>
   <article class="gb-launch-card ${income?'is-income':'is-expense'} ${isSelected?'is-selected':''}"
    role="button" tabindex="0" aria-pressed="${String(isSelected)}" data-action="select-launch" data-id="${esc(t.id)}"
    aria-label="${esc(t.description)} · ${income?'receita':'despesa'} · ${money(t.amount)}. ${isSelected?'Selecionado':'Toque para selecionar'}">
    <span class="gb-launch-card-icon ${income?'is-income':'is-expense'}">${icon(income?'up':'down')}</span>
    <span class="gb-launch-card-title"><strong>${esc(t.description)}${t.count>1?` <small>${t.sequence}/${t.count}</small>`:''}</strong>
      <span>${esc(subtitle)}</span>${subtitle!==category?`<small>${esc(category)}</small>`:''}</span>
    <span class="gb-launch-card-meta"><time datetime="${t.due}">${dateLabel(t.due)}</time>
      <span class="gb-launch-state ${statusStyle}">${esc(label)}</span>
      <strong>${money(t.amount)}</strong>${balance>0&&balance!==t.amount?`<small>${money(balance)} pendente</small>`:''}</span>
    <span class="gb-launch-selected-indicator" aria-hidden="true">${icon('check')}</span>
   </article></div>`;
}
function actionButton(action,title,svg,className=''){
 return `<button type="button" class="gb-launch-action ${className}" data-action="${action}" title="${title}" aria-label="${title}">${icon(svg)}</button>`;
}
export function launchesView(db,state){
 const visible=filteredTitles(db,state);
 const ids=new Set(state.launchSelected||[]);
 const selected=visible.filter(t=>ids.has(t.id));
 const summary=db.titles.filter(t=>within(t.due,state.range)&&(!state.partner||t.partnerId===state.partner)&&(!state.category||t.categoryId===state.category));
 const amountIn=summary.filter(t=>t.type==='income').reduce((sum,t)=>sum+pending(db,t),0);
 const amountOut=summary.filter(t=>t.type==='expense').reduce((sum,t)=>sum+pending(db,t),0);
 const current=selectedStatus(state),menuOpen=!!state.launchStatusOpen;
 const queryVisible=!!state.launchSearchOpen||!!state.query||!!state.moreFilters;
 const dropdown=statusOptions.map(([key,text,ico])=>`<button type="button" role="menuitemradio" aria-checked="${key===current}" class="gb-launch-menu-option ${key===current?'active':''}" data-action="launch-filter" data-value="${key}">${icon(ico)}<span>${text}</span>${key===current?icon('check'):''}</button>`).join('');
 const toolbar=selected.length?`<div class="gb-launch-toolbar" role="toolbar" aria-label="Ações para ${selected.length} lançamento(s) selecionado(s)">
   <span class="gb-launch-count" aria-label="${selected.length} selecionado(s)">${selected.length}</span>
   ${selected.length===1?actionButton('launch-detail','Visualizar lançamento','eye')+actionButton('launch-edit','Editar lançamento','edit'):''}
   ${actionButton('launch-pay','Baixar lançamentos selecionados','check','pay')}
   ${actionButton('launch-reverse','Estornar baixas selecionadas','refresh','reverse')}
   ${actionButton('launch-delete','Excluir lançamentos selecionados','trash','delete')}
   ${actionButton('launch-clear','Limpar seleção','close','clear')}
  </div>`:'';
 return `<div class="gb-launch-page">
   <header class="gb-launch-heading"><h1>Lançamentos</h1><p>Controle suas receitas e despesas.</p></header>
   <div class="gb-launch-summary" aria-label="Valores pendentes no período">
     <div class="gb-launch-summary-card income"><span class="gb-launch-summary-icon">${icon('up')}</span><span><small>A receber</small><strong>${money(amountIn)}</strong></span></div>
     <div class="gb-launch-summary-card expense"><span class="gb-launch-summary-icon">${icon('down')}</span><span><small>A pagar</small><strong>${money(amountOut)}</strong></span></div>
   </div>
   <div class="gb-launch-controls">
     <label class="gb-launch-period"><span class="sr-only">Período</span>${periodBar(state)}</label>
     <div class="gb-launch-status-wrap">
       <button type="button" class="gb-launch-status-trigger ${current!=='all'?'has-filter':''}" data-action="launch-status" aria-controls="gb-launch-status-menu" aria-expanded="${menuOpen}" aria-haspopup="true">${icon('settings')}<span>${current==='all'?'Status':(statusOptions.find(x=>x[0]===current)?.[1]||'Status')}</span>${icon('chevron')}</button>
       <div id="gb-launch-status-menu" class="gb-launch-status-menu" role="menu" ${menuOpen?'':'hidden'}>${dropdown}</div>
     </div>
     <button type="button" class="gb-launch-search-toggle ${queryVisible?'is-active':''}" data-action="launch-search" aria-label="Pesquisar lançamentos" aria-expanded="${queryVisible}" aria-controls="gb-launch-search">${icon('search')}</button>
   </div>
   <div id="gb-launch-search" class="gb-launch-search-zone" ${queryVisible?'':'hidden'}>
     <label class="gb-launch-search-input">${icon('search')}<input id="title-search" type="search" placeholder="Pesquisar lançamentos" autocomplete="off" aria-label="Pesquisar lançamentos" value="${esc(state.query||'')}"></label>
     <button type="button" class="gb-launch-more-filter" data-action="toggle-title-filters" aria-expanded="${!!state.moreFilters}">${icon('settings')} Filtros adicionais</button>
     <div class="gb-launch-advanced" ${state.moreFilters?'':'hidden'}>
       ${select('Parceiro','partner',[['','Todos'],...db.partners.map(p=>[p.id,p.name])],state.partner,'data-filter="partner"')}
       ${select('Categoria','category',[['','Todas'],...db.categories.map(c=>[c.id,c.name])],state.category,'data-filter="category"')}
       ${select('Situação detalhada','status',[['','Todas'],['open','Pendentes'],['late','Vencidos'],['partial','Parciais'],['settled','Pagos'],['cancelled','Cancelados']],state.status,'data-filter="status"')}
       <button class="gb-launch-clear-filter" data-action="clear-title-filters" type="button">Limpar filtros</button>
     </div>
   </div>
   <div class="gb-launch-list" aria-label="Lançamentos disponíveis">
      ${visible.length?visible.map(t=>launchCard(db,t,ids.has(t.id))).join(''):
        empty('Nenhum lançamento encontrado','Experimente outro período ou filtros.','new-title','Novo lançamento')}
   </div>
   ${toolbar}
 </div>`;
}
