/* Vehicle workspace: reads existing tenant data. No writes, uploads or new tables. */
(() => {
  'use strict';
  const tabs = {overview:'Visão geral',fuel:'Abastecimentos',maintenance:'Manutenções / OS',costs:'Custos',mileage:'Histórico de KM',notes:'Observações'};
  const state = {id:'',tab:'overview',start:'',end:'',page:1};
  const esc = value => escapeHtml(String(value ?? ''));
  const value = v => v == null || v === '' ? 'Não informado' : String(v);
  const number = n => n == null || !Number.isFinite(Number(n)) ? 'Sem base suficiente' : Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
  const money = n => n == null ? 'Sem base suficiente' : formatCurrency(n);
  const date = d => d ? formatDate(d) : 'Não informado';
  const card = (label,v,help='') => `<article class="vp-stat"><span>${esc(label)}</span><strong>${esc(v)}</strong><small>${esc(help)}</small></article>`;
  const safeImage = raw => {if(!raw)return '';try {const u=new URL(raw,location.href);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch(_){return '';}};
  function model() {
    const vehicle=allVehicles.find(v=>String(v.id)===state.id);
    if(!vehicle)return null;
    const rows=window.WeFrotasVehicleReports.detailRows({vehicleId:vehicle.id,start:state.start,end:state.end});
    const fuel=rows.filter(r=>isFuelEntry(r.entry));
    const orders=allOrders.filter(o=>String(o.vehicleId)===state.id&&(!state.start&&!state.end||isDateWithinRange(o.dataInicio,state.start,state.end)));
    const readings=fuel.filter(r=>r.entry.km!=null&&String(r.entry.km).trim()!=='').slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))||Number(a.entry.km)-Number(b.entry.km));
    return {vehicle,rows,fuel,orders,readings,metrics:window.WeFrotasVehicleReports.vehicleIndicators(vehicle,rows)};
  }
  function table(headers,rows,empty='Nenhum registro no período selecionado.') {
    if(!rows.length)return `<div class="vp-empty">${esc(empty)}</div>`;
    const pages=Math.ceil(rows.length/25);state.page=Math.min(state.page,pages);
    return `<div class="vp-table-scroll"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.slice((state.page-1)*25,state.page*25).map(row=>`<tr>${row.map(v=>`<td>${esc(value(v))}</td>`).join('')}</tr>`).join('')}</tbody></table></div><footer class="vp-pagination"><span>${rows.length} registros · Página ${state.page} de ${pages}</span><button data-page="-1" ${state.page===1?'disabled':''}>Anterior</button><button data-page="1" ${state.page===pages?'disabled':''}>Próxima</button></footer>`;
  }
  function mileageRows(m) {
    return m.readings.map((r,i)=>{
      const km=Number(r.entry.km),prev=i?Number(m.readings[i-1].entry.km):null;
      const valid=Number.isSafeInteger(km)&&km>=0;
      return [date(r.date),valid?number(km):'KM inválido',prev===null?'Primeiro do período':!valid||!Number.isFinite(prev)?'Sem base':km<prev?'Regressão: revisar registros':number(km-prev),'Abastecimento',r.entry.fornecedor,r.entry.nf||r.entry.id];
    });
  }
  function monthChart(rows,kind) {
    const sums=new Map();rows.forEach(r=>{if(!/^\d{4}-\d{2}/.test(r.date||''))return;const month=r.date.slice(0,7);const n=kind==='km'?Number(r.entry.km):r.total;if(!Number.isFinite(n))return;sums.set(month,kind==='km'?Math.max(sums.get(month)??0,n):(sums.get(month)||0)+n);});
    const points=[...sums].sort(([a],[b])=>a.localeCompare(b)).slice(-8),max=Math.max(...points.map(([,n])=>n),1);
    if(!points.length)return '<p class="vp-empty">Sem dados para o gráfico.</p>';
    return `<div class="vp-chart" role="group" aria-label="${esc(kind==='km'?'Maior KM observado por mês':'Despesas por mês')}">${points.map(([month,n])=>`<button type="button" data-source-month="${esc(month)}" data-source-kind="${kind}" title="Ver registros de origem"><span>${esc(kind==='km'?number(n):money(n))}</span><i style="height:${Math.max(2,n/max*100)}px"></i><small>${esc(month.split('-').reverse().join('/'))}</small></button>`).join('')}</div>`;
  }
  function content(m) {
    const {vehicle:v,metrics:s}=m;
    if(state.tab==='overview') {
      const drivers=getVehicleLinkedDrivers(v).map(d=>d.nome).join(', ');
      return `<div class="vp-overview"><article class="vp-card"><h3>Dados do veículo</h3><dl>${[['Placa',v.placa],['Frota',v.numeroFrota],['Modelo',v.modelo],['Ano',v.ano],['Cor',v.cor],['Chassi',v.chassi],['Propriedade',window.WeFrotasVehicleReports.ownership(v)],['Motorista vinculado',drivers],['Seguro — vencimento',v.seguroVencimento?date(v.seguroVencimento):'']].map(([k,val])=>`<div><dt>${esc(k)}</dt><dd>${esc(value(val))}</dd></div>`).join('')}</dl></article><article class="vp-card"><h3>Despesas no período</h3>${monthChart(m.rows,'cost')}<p>Todos os tipos de despesa; agrupamentos sem duplicação.</p></article><article class="vp-card"><h3>Quilometragem observada</h3>${monthChart(m.readings,'km')}<p>Maior leitura por mês, não distância rodada. Meses sem dados não são preenchidos.</p></article></div><div class="vp-stats">${card('Abastecimentos',m.fuel.length)}${card('OS abertas no período',m.orders.length,'Inclui todas as situações de OS.')}${card('Despesas',money(s.costs))}${card('Distância observada',s.distance==null?'Sem base suficiente':number(s.distance)+' km','Entre leituras de abastecimento do período.')}</div>`;
    }
    if(state.tab==='fuel')return table(['Data','KM','Litros','Valor líquido','Preço/L lançado','Posto','Motorista','Referência'],m.fuel.slice().reverse().map(r=>{const l=parseDecimalInputValue(r.entry.litros),d=allDrivers.find(d=>d.id===r.entry.driverId);return [date(r.date),r.entry.km,l>0?number(l):'Não informado',money(r.total),l>0?money(Number(r.entry.total)/l):'Sem base',r.entry.fornecedor,d?.nome,r.entry.nf||r.entry.id];}));
    if(state.tab==='maintenance')return `<p class="vp-note">OS pela data de abertura. OS fechada não comprova, sozinha, a execução de manutenção. Valores detalhados na aba Custos.</p>${table(['OS','Abertura','Término informado','Descrição','Situação','Responsável'],m.orders.map(o=>[o.numero,date(o.dataInicio),date(o.dataTermino),o.descricao,o.status,o.responsavelNome||allDrivers.find(d=>d.id===o.driverId)?.nome]))}`;
    if(state.tab==='costs')return `<div class="vp-stats">${card('Total de despesas',money(s.costs),'Receitas não incluídas.')}${card('Lançamentos',m.rows.length)}</div>${table(['Data','Tipo','Fornecedor','Referência','OS','Valor líquido','Origem'],m.rows.slice().reverse().map(r=>[date(r.date),isFuelEntry(r.entry)?'Combustível':r.entry.categoria||r.entry.serviceType||'Despesa',r.entry.fornecedor||r.parent.fornecedor,r.entry.nf||r.entry.id,allOrders.find(o=>o.id===(r.entry.orderId||r.parent.orderId))?.numero||'Sem OS',money(r.total),r.allocated?'Rateio do agrupamento '+(r.parent.nf||r.parent.id):'Avulso']))}`;
    if(state.tab==='mileage')return `<p class="vp-note">Histórico derivado dos abastecimentos existentes. Não cria leituras novas nem corrige odômetros automaticamente; registros do mesmo dia não comprovam ordem horária.</p>${table(['Data','KM','Variação observada','Origem','Fornecedor','Referência'],mileageRows(m).reverse())}`;
    const notes=m.rows.filter(r=>r.entry.observacoes).map(r=>[date(r.date),isFuelEntry(r.entry)?'Abastecimento':'Despesa',r.entry.observacoes,r.entry.nf||r.entry.id]);
    return `<p class="vp-note">Observações já registradas nas despesas do veículo. Autoria não é inferida a partir do motorista. Novas notas independentes não são criadas nesta prévia.</p>${table(['Data','Origem','Observação','Referência'],notes)}`;
  }
  function render() {
    if(!state.id)return;
    const m=model();if(!m){close();return;}
    const panel=document.getElementById('panel-veiculos');if(!panel)return;
    let root=document.getElementById('vehicle-profile');
    if(!root){root=document.createElement('section');root.id='vehicle-profile';panel.append(root);root.addEventListener('click',click);root.addEventListener('change',change);}
    panel.classList.add('vp-open');
    const v=m.vehicle,s=m.metrics,image=safeImage(v.vehicleImageUrl||v.imageUrl||'');
    root.innerHTML=`<div class="vp-breadcrumb"><button data-action="back">← Veículos</button><span>Visualizar veículo</span></div><header class="vp-heading">${image?`<img src="${esc(image)}" alt="Foto do veículo" loading="lazy">`:'<div class="vp-photo-empty">Sem foto</div>'}<div><span class="vp-badge">${isEntityActive(v)?'Cadastro ativo':'Cadastro inativo'}</span><h2 tabindex="-1">${esc(v.placa)}</h2><p>${esc(v.modelo)} · Frota ${esc(v.numeroFrota)}</p></div><button data-action="edit">Editar cadastro</button></header><div class="vp-stats">${card('Consumo estimado',s.consumption==null?'Sem base suficiente':number(s.consumption)+' km/L','Não comprova tanque cheio.')}${card('Custo médio por km',s.perKm==null?'Sem base suficiente':money(s.perKm)+'/km','Despesas ÷ distância observada.')}${card('KM inicial / final',s.first==null?'Sem base suficiente':number(s.first)+' / '+number(s.last),'Leituras no período selecionado.')}${card('Último abastecimento no período',date(m.fuel.at(-1)?.date))}</div><nav class="vp-tabs" aria-label="Seções do veículo">${Object.entries(tabs).map(([key,label])=>`<button data-tab="${key}" aria-current="${state.tab===key?'page':'false'}">${label}</button>`).join('')}</nav><div class="vp-filters"><label>Data inicial<input id="vp-start" type="date" value="${esc(state.start)}"></label><label>Data final<input id="vp-end" type="date" value="${esc(state.end)}"></label><button data-action="clear">Todas as datas</button><span>Combustível por abastecimento · OS por abertura · outras despesas por lançamento.</span></div><div class="vp-content">${content(m)}</div>`;
    const sourceLists={fuel:m.fuel.slice().reverse().map(r=>r.entry),costs:m.rows.slice().reverse().map(r=>r.entry),maintenance:m.orders,mileage:m.readings.slice().reverse().map(r=>r.entry),notes:m.rows.filter(r=>r.entry.observacoes).map(r=>r.entry)};
    const sources=sourceLists[state.tab]||[];
    const sourceTable=root.querySelector('.vp-content table');
    if(sourceTable){
      const heading=document.createElement('th');heading.textContent='Visualizar';sourceTable.querySelector('thead tr').append(heading);
      sourceTable.querySelectorAll('tbody tr').forEach((row,index)=>{
        const source=sources[(state.page-1)*25+index];if(!source)return;
        const cell=document.createElement('td'),button=document.createElement('button');
        button.type='button';button.className='settings-action-btn';button.dataset.sourceId=source.id;
        button.dataset.sourceType=state.tab==='maintenance'?'order':'finance';
        button.setAttribute('aria-label',state.tab==='maintenance'?'Visualizar OS':'Visualizar lançamento');
        button.title=button.getAttribute('aria-label');
        button.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
        cell.append(button);row.append(cell);
      });
    }
    // Reuse the exact range selector used by Reports and Finance, including typed dates.
    const periodSource=document.getElementById('module-compact-date-button-relatorios')?.closest('.module-compact-date-range');
    if(periodSource){
      const filters=root.querySelector('.vp-filters');
      filters.classList.add('report-filter-card');
      filters.innerHTML=periodSource.outerHTML.replaceAll('relatorios','vehicleProfile').replaceAll('report-filter-start','vp-start').replaceAll('report-filter-end','vp-end');
      root.querySelector('#vp-start').value=state.start;
      root.querySelector('#vp-end').value=state.end;
      renderModuleCompactFilterControls('vehicleProfile');
    }
    root.querySelectorAll('.vp-stat').forEach(node=>{node.classList.add('report-summary-card');node.querySelector('span').classList.add('report-summary-label');node.querySelector('strong').classList.add('report-summary-value');node.querySelector('small').classList.add('report-summary-help');});
    root.querySelectorAll('.vp-card').forEach(node=>node.classList.add('content-card'));
    root.querySelectorAll('.vp-table-scroll').forEach(node=>node.classList.add('orders-table-scroll'));
    root.querySelectorAll('button[data-action],button[data-page],button[data-tab]').forEach(node=>node.classList.add('settings-action-btn'));
  }
  function click(event) {
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.sourceMonth){
      const month=button.dataset.sourceMonth,first=month+'-01',last=month+'-'+new Date(Number(month.slice(0,4)),Number(month.slice(5)),0).getDate();
      state.start=state.start&&state.start>first?state.start:first;state.end=state.end&&state.end<last?state.end:last;
      state.tab=button.dataset.sourceKind==='km'?'mileage':'costs';state.page=1;render();return;
    }
    if(button.dataset.sourceId){
      const id=button.dataset.sourceId;
      if(button.dataset.sourceType==='order'){const previous=selectedOrders;try{selectedOrders=new Set([id]);viewSelectedOrder();}finally{selectedOrders=previous;}}
      else{const previous=selectedFinance;try{viewFinanceEntryById(id);}finally{selectedFinance=previous;}}
      return;
    }
    if(button.dataset.tab){state.tab=button.dataset.tab;state.page=1;render();return;}
    if(button.dataset.page){state.page+=Number(button.dataset.page);render();return;}
    if(button.dataset.action==='back')close();
    if(button.dataset.action==='clear'){state.start='';state.end='';state.page=1;render();}
    if(button.dataset.action==='edit'){const previous=selectedVehicles;try{selectedVehicles=new Set([state.id]);editSelectedVehicle();}finally{selectedVehicles=previous;}}
  }
  function change(event) {
    if(!['vp-start','vp-end'].includes(event.target.id))return;
    const start=document.getElementById('vp-start').value,end=document.getElementById('vp-end').value;
    if(start&&end&&start>end){showToast('A data final deve ser igual ou posterior à inicial.');render();return;}
    state.start=start;state.end=end;state.page=1;render();
  }
  function close(){if(typeof closeModuleCompactCalendars==='function')closeModuleCompactCalendars();state.id='';document.getElementById('vehicle-profile')?.remove();document.getElementById('panel-veiculos')?.classList.remove('vp-open');}
  window.WeFrotasVehicleProfile={open(id){state.id=String(id);state.tab='overview';state.page=1;state.start='';state.end='';render();document.querySelector('#vehicle-profile h2')?.focus();},close,refresh:render,applyPeriod(){state.start=document.getElementById('vp-start').value;state.end=document.getElementById('vp-end').value;state.page=1;render();}};
  document.addEventListener('DOMContentLoaded',()=>{const list=document.getElementById('vehicles-list');if(list)new MutationObserver(()=>{if(state.id)render();}).observe(list,{childList:true});});
})();
