/* Vehicle list: reads the existing tenant snapshot; never writes operational data. */
(() => {
  'use strict';
  const columns=[['photo','Foto',64],['plate','Placa',120],['model','Veículo',190],['fleet','Frota / Ano',115],['details','Seguro / Chassi',160],['status','Cadastro',110],['km','KM atual',115],['consumption','Consumo estimado (km/L)',155],['perKm','Custo por km (R$/km)',155],['cost','Despesas no período',150]];
  const state={page:1,size:10,start:'',end:'',hidden:new Set(['details']),signature:'',pageVehicles:[]};
  const esc=v=>escapeHtml(String(v??''));
  const num=v=>v==null?'Sem base suficiente':Number(v).toLocaleString('pt-BR',{maximumFractionDigits:2});
  function buildRows(vehicles,filters) {
    const byVehicle=new Map();
    window.WeFrotasVehicleReports.detailRows(filters).forEach(r=>{if(!byVehicle.has(r.vehicleId))byVehicle.set(r.vehicleId,[]);byVehicle.get(r.vehicleId).push(r);});
    return vehicles.map(vehicle=>({vehicle,metrics:window.WeFrotasVehicleReports.vehicleIndicators(vehicle,byVehicle.get(vehicle.id)||[])}));
  }
  function sortedRows() {
    const rows=buildRows(getVisibleVehicles(),{start:state.start,end:state.end});
    const key=vehicleSortState.key;
    if(['cost','consumption','perKm'].includes(key))rows.sort((a,b)=>{
      const x=a.metrics[key==='cost'?'costs':key],y=b.metrics[key==='cost'?'costs':key];
      if(x==null)return y==null?0:1;if(y==null)return -1;
      return (x-y)*(vehicleSortState.direction==='asc'?1:-1);
    });
    return rows;
  }
  function controls(panel) {
    if(document.getElementById('vehicle-list-controls'))return;
    const box=document.createElement('div');box.id='vehicle-list-controls';box.className='vehicle-list-controls report-filter-card';
    const source=document.getElementById('module-compact-date-button-relatorios')?.closest('.module-compact-date-range');
    const calendar=source?source.outerHTML.replaceAll('relatorios','vehicleList').replaceAll('report-filter-start','vehicle-list-start').replaceAll('report-filter-end','vehicle-list-end'):'';
    box.innerHTML=`<div class="vehicle-list-tools"><div><strong>Indicadores por período</strong>${calendar}</div><details class="vehicle-list-columns"><summary class="settings-action-btn">Colunas</summary><div>${columns.filter(([key])=>key!=='plate').map(([key,label])=>`<label><input type="checkbox" data-column="${key}" ${state.hidden.has(key)?'':'checked'}> ${label}</label>`).join('')}</div></details><button type="button" class="settings-action-btn" data-export>Exportar XLSX</button></div><p class="vehicle-list-note">Período aplicado às despesas, consumo e custo/km. KM atual é cadastral/histórico. Consumo estimado entre leituras; não comprova tanque cheio. O filtro Seguro continua independente. Exportação inclui todos os veículos filtrados, não apenas esta página.</p>`;
    panel.querySelector('.orders-table-shell').before(box);
    box.addEventListener('change',event=>{const key=event.target.dataset.column;if(!key)return;event.target.checked?state.hidden.delete(key):state.hidden.add(key);renderVehicles();});
    box.querySelector('[data-export]').addEventListener('click',exportRows);
    const footer=document.createElement('div');footer.id='vehicle-list-pagination';footer.className='vp-pagination';panel.querySelector('.orders-table-shell').after(footer);
    footer.addEventListener('click',event=>{const step=Number(event.target.closest('[data-page]')?.dataset.page);if(!step)return;state.page+=step;selectedVehicles.clear();renderVehicles();});
    footer.addEventListener('change',event=>{if(event.target.id!=='vehicle-list-size')return;state.size=Number(event.target.value);state.page=1;selectedVehicles.clear();renderVehicles();});
  }
  function display(row,key) {
    const v=row.vehicle,m=row.metrics;
    switch(key){
      case 'plate':return v.placa||'-';case 'model':return v.modelo||'Não informado';case 'fleet':return `${v.numeroFrota||'-'} / ${v.ano||'-'}`;
      case 'details':return `${v.seguroVencimento?formatDate(v.seguroVencimento):'Sem seguro informado'} / ${v.chassi||'-'}`;
      case 'status':return isEntityActive(v)?'Ativo':'Inativo';case 'km':return getVehicleCurrentKm(v.id);
      case 'consumption':return m.consumption;case 'perKm':return m.perKm;case 'cost':return m.costs;default:return '';
    }
  }
  function render() {
    const panel=document.getElementById('panel-veiculos'),list=document.getElementById('vehicles-list');if(!panel||!list)return;
    controls(panel);
    const rows=sortedRows();
    const signature=JSON.stringify([rows.map(r=>r.vehicle.id),state.start,state.end]);
    if(signature!==state.signature){state.page=1;state.signature=signature;selectedVehicles.clear();}
    const pages=Math.max(1,Math.ceil(rows.length/state.size));state.page=Math.max(1,Math.min(state.page,pages));
    const pageRows=rows.slice((state.page-1)*state.size,state.page*state.size);state.pageVehicles=pageRows.map(r=>r.vehicle);
    const shown=columns.filter(([key])=>!state.hidden.has(key)),grid='38px '+shown.map(([, ,width])=>`${width}px`).join(' ');
    const head=panel.querySelector('.entity-table-head--vehicles');head.style.gridTemplateColumns=grid;
    head.innerHTML='<div></div>'+shown.map(([key,label])=>key==='photo'?'<div>Foto</div>':`<button type="button" class="finance-sort-head" data-sort="${key}">${esc(label)} <span data-vehicle-sort-indicator="${key}"></span></button>`).join('');
    head.onclick=event=>{const key=event.target.closest('[data-sort]')?.dataset.sort;if(key)toggleVehicleSort(key);};
    list.innerHTML=pageRows.length?pageRows.map(row=>{
      const v=row.vehicle,id=esc(v.id),checked=selectedVehicles.has(v.id);
      return `<div class="orders-table-row entity-table-row--vehicles vehicle-list-row ${checked?'selected':''}" role="button" tabindex="0" data-vehicle-profile="${id}" style="grid-template-columns:${grid}"><div class="orders-table-cell orders-table-cell--check"><button type="button" class="selection-check ${checked?'checked':''}" aria-label="Selecionar ${esc(v.placa)}">✓</button></div>${shown.map(([key])=>{
        if(key==='photo'){const url=window.WeFrotasVehicleProfile.photoSource(v.vehicleImageUrl||v.imageUrl||'');return `<div class="orders-table-cell">${url?`<img class="vehicle-list-photo" src="${esc(url)}" width="48" height="40" loading="lazy" decoding="async" alt="${esc(v.placa)}">`:'<span class="vehicle-list-no-photo">Sem foto</span>'}</div>`;}
        const val=display(row,key),text=key==='cost'?formatCurrency(val):key==='perKm'?(val==null?'Sem base suficiente':formatCurrency(val)):['km','consumption'].includes(key)?num(val):val;
        return `<div class="orders-table-cell"><span class="orders-main-text">${esc(text)}</span></div>`;
      }).join('')}</div>`;
    }).join(''):'<div class="empty-state">Nenhum veículo encontrado com os filtros aplicados.</div>';
    list.onclick=event=>{const row=event.target.closest('[data-vehicle-profile]');if(row)toggleVehicleSelection(event,row.dataset.vehicleProfile);};
    list.ondblclick=event=>{const row=event.target.closest('[data-vehicle-profile]');if(row)window.WeFrotasVehicleProfile.open(row.dataset.vehicleProfile);};
    list.onkeydown=event=>{const row=event.target.closest('[data-vehicle-profile]');if(row&&event.target===row)handleVehicleRowSelectionKey(event,row.dataset.vehicleProfile);};
    list.querySelectorAll('.vehicle-list-photo').forEach(img=>img.addEventListener('error',()=>{const id=img.closest('[data-vehicle-profile]').dataset.vehicleProfile,v=pageRows.find(r=>String(r.vehicle.id)===id)?.vehicle,original=String(v?.vehicleImageUrl||v?.imageUrl||'');if(original.startsWith('https://')&&original!==img.getAttribute('src'))img.src=original;else{img.removeAttribute('src');img.alt='Foto indisponível';}},{once:true}));
    document.getElementById('vehicle-list-start').value=state.start;document.getElementById('vehicle-list-end').value=state.end;renderModuleCompactFilterControls('vehicleList');
    document.getElementById('vehicle-list-pagination').innerHTML=`<span>${rows.length?((state.page-1)*state.size+1):0}–${Math.min(state.page*state.size,rows.length)} de ${rows.length} veículos · Página ${state.page}/${pages}</span><label>Por página <select id="vehicle-list-size" class="soft-input">${[10,25,50].map(n=>`<option ${n===state.size?'selected':''}>${n}</option>`).join('')}</select></label><button type="button" class="settings-action-btn" data-page="-1" ${state.page===1?'disabled':''}>Anterior</button><button type="button" class="settings-action-btn" data-page="1" ${state.page===pages?'disabled':''}>Próxima</button>`;
    updateEntityListViewport('vehicles-list-shell',pageRows.length);updateSimpleSortIndicators('data-vehicle-sort-indicator',vehicleSortState);updateVehicleSelectionUI();
    document.getElementById('select-all-vehicles').title='Selecionar veículos desta página';
  }
  function exportData() {
    const shown=columns.filter(([key])=>key!=='photo'&&!state.hidden.has(key));
    return {headers:shown.map(([,label])=>label),rows:sortedRows().map(row=>shown.map(([key])=>display(row,key)??'Sem base suficiente'))};
  }
  function exportRows() {
    if(!requireWefrotasPermission('read'))return;
    if(!window.XLSX){showToast('Biblioteca de exportação ainda não carregada.');return;}
    const data=exportData();if(!data.rows.length){showToast('Não há veículos para exportar.');return;}
    const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([data.headers,...data.rows]),'Veículos');
    XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([['Período inicial',state.start||'Todo histórico'],['Período final',state.end||'Todo histórico'],['Busca',document.getElementById('vehicle-filter-search')?.value||''],['Cadastro',document.getElementById('vehicle-filter-status')?.value||'Todos'],['Seguro de',document.getElementById('vehicle-filter-start')?.value||''],['Seguro até',document.getElementById('vehicle-filter-end')?.value||''],['Base','Despesas por data de lançamento; combustível por abastecimento; KM atual histórico. Consumo estimado e custo por km dependem de leituras válidas.']]),'Filtros e critérios');
    XLSX.writeFile(book,`veiculos_${state.start||'historico'}_${state.end||'atual'}.xlsx`);
  }
  window.WeFrotasVehicleList={render,buildRows,exportData,resetPeriod(){state.start='';state.end='';state.page=1;},pageVehicles:()=>state.pageVehicles,applyPeriod(){state.start=document.getElementById('vehicle-list-start').value;state.end=document.getElementById('vehicle-list-end').value;state.page=1;renderVehicles();}};
})();
