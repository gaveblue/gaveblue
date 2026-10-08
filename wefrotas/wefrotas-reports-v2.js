/* Read-only reporting: never mutates operational records. */
(() => {
  const titles = {
    vehicle_expenses: 'Despesas por veículo — detalhado', vehicle_indicators: 'Indicadores de custo e consumo por veículo',
    overview: 'Visão geral de custos', monthly_vehicle_cost: 'Custos por veículo',
    fuel_register: 'Abastecimentos e consumo', irregularities: 'Irregularidades de abastecimento',
    orders: 'Ordens de serviço', maintenance_comparison: 'Manutenção preventiva × corretiva',
    availability: 'Disponibilidade da frota', vehicle_performance: 'Desempenho dos veículos',
    driver_performance: 'Desempenho dos motoristas', fines: 'Infrações e multas',
    finance_status: 'Despesas e pagamentos', supplier_ranking: 'Custos por fornecedor',
    deadlines: 'Pendências e vencimentos', record_audit: 'Auditoria de registros'
  };
  const oldBuild = buildReportData, oldTitle = getReportTitleByType, oldFilters = getReportFilters;
  const oldOrders = getFilteredReportOrders, oldContext = getReportDateContextLabel;
  if (typeof setFilterValue === 'function') {
    const originalSetFilterValue = setFilterValue;
    setFilterValue = (id, value) => {
      if (id === 'report-filter-type' && ['cost', 'fuel_liters_per_km'].includes(value)) {
        originalSetFilterValue('report-filter-fuel-view', value);
        value = 'fuel_register';
      }
      originalSetFilterValue(id, value);
      if (id === 'report-filter-type') {
        for (const [wrap, type] of [['report-situation-wrap','orders'],['report-horizon-wrap','deadlines'],['report-fuel-view-wrap','fuel_register']]) {
          const node = document.getElementById(wrap); if (node) node.hidden = value !== type;
        }
      }
    };
  }
  const cell = value => ({text: value === null || value === undefined || value === '' ? 'Não informado' : String(value)});
  const table = (filters, headers, values, note, summary = []) => ({
    title: titles[filters.type], meta: `Período: ${getReportPeriodLabel(filters)} • Veículo: ${getReportVehicleLabel(filters.vehicleId)} • ${note}`,
    columns: headers.map(label => ({label})), rows: values.map(row => ({cells: row.map(cell)})),
    summary, footerNote: note, emptyMessage: `Nenhum registro disponível para os filtros. ${note}`
  });
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const vehicles = filters => allVehicles.filter(v => !filters.vehicleId || v.id === filters.vehicleId);
  const entries = filters => getReportFinanceEntries(filters);
  const net = list => sumFinanceNetTotal(list);
  const money = list => formatCurrency(net(list));
  const category = e => isFuelEntry(e) || isFuelGroupEntry(e) ? 'Combustível' : String(e.categoria || e.serviceType || 'Despesas gerais / não classificadas');
  const badge = (label, value, help) => ({label, value: String(value), help});
  function detailRows(filters) {
    const children = new Map(), parents = new Map(allFinanceEntries.map(e=>[e.id,e]));
    allFinanceEntries.forEach(e=>{if(e.groupedIntoId && parents.has(e.groupedIntoId)){const list=children.get(e.groupedIntoId)||[];list.push(e);children.set(e.groupedIntoId,list);}});
    const rows=[];
    allFinanceEntries.filter(e=>!e.groupedIntoId || !parents.has(e.groupedIntoId)).forEach(parent=>{
      const list=children.get(parent.id)||[parent];
      const totalCents=Math.round(getFinanceNetTotal(parent)*100);
      const weights=list.map(e=>Math.abs(getFinanceNetTotal(e))),sum=weights.reduce((a,b)=>a+b,0);
      let allocated=0;
      list.forEach((entry,index)=>{
        const cents=index===list.length-1?totalCents-allocated:Math.round(totalCents*(sum?weights[index]/sum:1/list.length));allocated+=cents;
        if(entry.kind==='receita'||parent.kind==='receita')return;
        const vehicleId=getEntryImmediateVehicleId(entry)||getEntryImmediateVehicleId(parent);
        const date=getFinanceEntryDate(entry)||getFinanceEntryDate(parent);
        if(filters.vehicleId&&vehicleId!==filters.vehicleId)return;
        if((filters.start||filters.end)&&!isDateWithinRange(date,filters.start,filters.end))return;
        rows.push({entry,parent,vehicleId,date,total:cents/100,allocated:list[0]!==parent});
      });
    });
    return rows.sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.entry.id).localeCompare(String(b.entry.id)));
  }
  function vehicleIndicators(vehicle, rows) {
    const readings=rows.filter(r=>r.vehicleId===vehicle.id&&isFuelEntry(r.entry)).sort((a,b)=>String(a.date).localeCompare(String(b.date))||Number(a.entry.km)-Number(b.entry.km));
    const valid=readings.length>=2&&readings.every((r,i)=>r.entry.km!=null&&String(r.entry.km).trim()!==''&&Number.isSafeInteger(Number(r.entry.km))&&Number(r.entry.km)>=0&&(!i||Number(r.entry.km)>=Number(readings[i-1].entry.km)));
    const first=valid?Number(readings[0].entry.km):null,last=valid?Number(readings.at(-1).entry.km):null;
    const distance=valid&&last>first?last-first:null;
    const liters=readings.slice(1).map(r=>parseDecimalInputValue(r.entry.litros));
    const volume=distance&&liters.every(l=>Number.isFinite(l)&&l>0)?liters.reduce((a,b)=>a+b,0):null;
    const costs=rows.filter(r=>r.vehicleId===vehicle.id).reduce((sum,r)=>sum+r.total,0);
    return {first,last,distance,costs,perKm:distance?costs/distance:null,consumption:volume?distance/volume:null};
  }
  getReportTitleByType = type => titles[type] || (type === 'fuel_liters_per_km' ? 'Consumo médio (km/L)' : type === 'cost' ? 'Custo por km' : oldTitle(type));
  getReportFilters = () => ({...oldFilters(), type: document.getElementById('report-filter-type')?.value || 'overview', situation: document.getElementById('report-filter-situation')?.value || '', horizon: document.getElementById('report-filter-horizon')?.value || ''});
  getFilteredReportOrders = () => {
    const f = getReportFilters();
    return oldOrders().filter(o => f.type !== 'orders' || !f.situation || o.status === f.situation);
  };
  getReportDateContextLabel = type => {
    if (['vehicle_expenses','vehicle_indicators'].includes(type)) return 'Abastecimentos pela data do abastecimento; outras despesas pela data principal do lançamento. Agrupamentos são rateados sem duplicar totais.';
    if (type === 'fuel_register' && document.getElementById('report-filter-fuel-view')?.value === 'cost') return oldContext('cost');
    if (type === 'availability') return 'Retrato cadastral atual. O período não reconstrói disponibilidade histórica.';
    if (type === 'deadlines') return 'Datas de vencimento; revisões por km são exibidas somente sem janela de dias.';
    if (type === 'record_audit') return 'Data do envio. Somente registros da Central carregados nesta sessão; não é a auditoria completa do administrador.';
    if (['overview','maintenance_comparison','fines','driver_performance','vehicle_performance'].includes(type)) return 'Valores pela data principal do lançamento financeiro; OS pela abertura. Dados ausentes não são estimados.';
    if (type === 'irregularities') return 'Data de abastecimento. Alertas são indícios para revisão, não comprovação de erro ou fraude.';
    return oldContext(type);
  };

  buildReportData = filters => {
    const f = filters;
    if(f.type==='vehicle_expenses') {
      const rows=detailRows(f);
      return table(f,['Data','Veículo','Propriedade','Categoria','Fornecedor','Referência','OS','Valor líquido','Agrupamento'],rows.map(r=>{
        const v=allVehicles.find(v=>v.id===r.vehicleId),order=allOrders.find(o=>o.id===(r.entry.orderId||r.parent.orderId));
        return [formatDate(r.date),r.vehicleId?getReportVehicleLabel(r.vehicleId):'Sem veículo vinculado',v?.locado===true?'Locado':v?.locado===false?'Próprio':'Não informado',category(r.entry),r.entry.fornecedor||r.parent.fornecedor,r.entry.nf||r.entry.id,order?.numero||'Sem OS',formatCurrency(r.total),r.allocated?`Rateio do grupo ${r.parent.nf||r.parent.id}`:'Avulso'];
      }), 'Despesas linha por linha, inclusive serviços e combustível. Receitas excluídas. Filhos substituem o agrupamento; valor final do grupo rateado proporcionalmente, com ajuste de centavos. Registros sem vínculo ficam explicitamente separados.',[badge('Total de despesas',formatCurrency(rows.reduce((s,r)=>s+r.total,0)),'Sem duplicar agrupamentos.'),badge('Lançamentos',rows.length,'No período selecionado.')]);
    }
    if(f.type==='vehicle_indicators') {
      const rows=detailRows(f),number=n=>n===null?'Sem base suficiente':n.toLocaleString('pt-BR',{maximumFractionDigits:2});
      return table(f,['Veículo','Propriedade','Custo total','KM inicial','KM final','KM rodado','Custo médio por km (R$/km)','Consumo estimado (km/L)'],vehicles(f).map(v=>{const s=vehicleIndicators(v,rows);return [getReportVehicleLabel(v.id),v.locado===true?'Locado':v.locado===false?'Próprio':'Não informado',formatCurrency(s.costs),number(s.first),number(s.last),number(s.distance),s.perKm===null?'Sem base suficiente':formatCurrency(s.perKm),number(s.consumption)];}), 'KM entre a primeira e a última leitura de abastecimento do período, não toda a quilometragem do veículo. Custo por km = despesas do período ÷ KM observado. Consumo estimado exclui os litros do primeiro registro; exige leituras crescentes e litros válidos, mas não comprova tanque cheio. KM inválido ou regressivo impede os índices. Custo por km e média por km são o mesmo indicador.');
    }
    if (['monthly_vehicle_cost','fuel_register','orders','finance_status','supplier_ranking'].includes(f.type)) {
      const fuelView = document.getElementById('report-filter-fuel-view')?.value || 'fuel_register';
      const result = oldBuild(f.type === 'fuel_register' ? {...f,type:fuelView} : f); result.title = f.type === 'fuel_register' && fuelView !== 'fuel_register' ? `${titles[f.type]} — ${getReportTitleByType(fuelView)}` : titles[f.type];
      if (f.type === 'orders') result.meta += ` • Situação: ${document.getElementById('report-filter-situation')?.selectedOptions?.[0]?.textContent || 'Todas'}`;
      if (f.type === 'fuel_register') result.meta += ' • Consumo médio (km/L) disponível na visão detalhada de consumo.';
      if (f.type === 'finance_status') result.meta += ' • Distribuído em OS não significa pago: quitação não é comprovada por esse status.';
      return result;
    }
    if (!titles[f.type]) return oldBuild(f);
    const list = entries(f), selectedVehicles = vehicles(f);
    if (f.type === 'overview') {
      const buckets = new Map();
      list.forEach(e => {const key = category(e); if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(e);});
      const ranking = selectedVehicles.map(v => ({v, total: net(list.filter(e => getEntryImmediateVehicleId(e) === v.id))})).sort((a,b) => b.total-a.total);
      return table(f, ['Categoria','Lançamentos','Custo líquido'], [...buckets].map(([k,l]) => [k,l.length,money(l)]),
        'Inclui lançamentos não agrupados, pendentes e distribuídos; receitas abatem despesas. Não representa pagamentos. Comparação mensal exige períodos equivalentes; não calculada nesta visão.',
        [badge('Custo líquido',money(list),'Pela data principal do lançamento.'),badge('Lançamentos',list.length,'Filhos de agrupamentos não são somados novamente.'),badge('Maior custo',ranking[0]?.v.placa || 'Sem dados',ranking[0] ? formatCurrency(ranking[0].total) : 'Sem valores'),badge('Categorias',buckets.size,'Classificação registrada, sem inferência por descrição.')]);
    }
    if (f.type === 'availability') {
      return table(f,['Frota','Placa','Situação operacional','Cadastro','Tempo parado'],selectedVehicles.map(v=>[v.numeroFrota,v.placa,v.situacaoOperacional || 'Não informado',v.ativo === false || v.active === false ? 'Inativo' : 'Sem inativação registrada','Não informado']),
        'Cadastro ativo não comprova disponibilidade. Percentual de disponibilidade e tempo parado dependem de apontamentos operacionais ainda não registrados.');
    }
    if (f.type === 'maintenance_comparison') {
      const orders = oldOrders();
      const groups = ['Preventiva','Corretiva','Não classificada'];
      const kind = o => ['preventiva','corretiva'].includes(norm(o.modalidadeManutencao)) ? norm(o.modalidadeManutencao) === 'preventiva' ? 'Preventiva' : 'Corretiva' : 'Não classificada';
      return table(f,['Modalidade','OS','Valor vinculado','Percentual de OS','Tempo médio parado'],groups.map(g=>{const os=orders.filter(o=>kind(o)===g),ids=new Set(os.map(o=>o.id));return [g,os.length,money(allFinanceEntries.filter(e=>ids.has(e.orderId)&&!e.groupedIntoId)),orders.length?`${(os.length/orders.length*100).toFixed(1)}%`:'Não informado','Não informado'];}),
        'Inclui OS filtradas pela abertura. Sem modalidade explícita, a OS fica Não classificada; não se deduz preventiva/corretiva pelo texto. Falhas recorrentes e paradas exigem registros próprios.');
    }
    if (f.type === 'vehicle_performance') {
      const stats=getVehicleCostStats(f), orders=oldOrders();
      return table(f,['Frota','Placa','Km calculados (combustível)','Custo combustível/km','Custo líquido geral','OS','Dias indisponíveis'],selectedVehicles.map(v=>{const s=stats.find(s=>s.vehicleId===v.id);return [v.numeroFrota,v.placa,s?.totalKm || 'Não informado',s?.costPerKm!=null?formatCurrency(s.costPerKm):'Não informado',money(list.filter(e=>getEntryImmediateVehicleId(e)===v.id)),orders.filter(o=>o.vehicleId===v.id).length,'Não informado'];}),
        'Km e custo/km seguem a base de combustíveis distribuídos em OS. Custos gerais usam lançamentos financeiros. Multas, ocorrências e tempo parado sem base estruturada não são inferidos.');
    }
    if (f.type === 'driver_performance') {
      return table(f,['Motorista','Lançamentos vinculados','Valor líquido','Litros registrados','Infrações e ocorrências'],allDrivers.map(d=>{const own=list.filter(e=>String(e.motoristaId || e.driverId || '')===String(d.id));return [d.nome,own.length,money(own),own.reduce((s,e)=>s+parseDecimalInputValue(e.litros),0).toLocaleString('pt-BR'),'Não informado'];}).filter(row=>!f.vehicleId || row[1]>0),
        'Somente vínculos explícitos do lançamento; não atribui ao motorista atual despesas antigas do veículo. Não é ranking de conduta. Eventos Rastraki não integrados nesta visão.');
    }
    if (f.type === 'fines') {
      const fines=list.filter(e=>/^(multa|multas|infracao|infracoes)$/.test(norm(e.categoria || e.serviceType)));
      return table(f,['Referência','Veículo','Valor','Vencimento','Motorista','Prazo de indicação','Situação'],fines.map(e=>[e.nf,getReportVehicleLabel(getEntryImmediateVehicleId(e)),formatCurrency(e.total),formatDate(e.dataVencimento),getDriverLabel(e.motoristaId || e.driverId),'Não informado',getFinanceEntryStatus(e)]),
        'Apenas despesas explicitamente classificadas como multa/infração. Ausência de linhas não comprova ausência de infrações; auto, prazo de indicação e reincidência exigem cadastro específico.');
    }
    if (f.type === 'deadlines') {
      const rows=[];
      const add=(type,who,date)=>{const days=date?daysUntil(date):null;if(f.horizon==='overdue'&&!(days!==null&&days<0))return;if(['7','30','60'].includes(f.horizon)&&!(days!==null&&days>=0&&days<=Number(f.horizon)))return;if((f.start||f.end)&&(!date||!isDateWithinRange(date,f.start,f.end)))return;rows.push([type,who,date?formatDate(date):'Não informado',days===null?'Documento/data ausente':days<0?'Vencido':`Vence em ${days} dia(s)`]);};
      const linkedDrivers=new Set(selectedVehicles.map(v=>String(v.motoristaId || v.driverId || '')));
      allDrivers.filter(d=>!f.vehicleId||linkedDrivers.has(String(d.id))).forEach(d=>add('CNH',d.nome,d.validade));
      selectedVehicles.forEach(v=>add('Seguro',v.placa,v.seguroVencimento));
      if(!f.horizon&&!f.start&&!f.end) getReportMaintenanceItems(f).forEach(({vehicle:v,maintenance:m})=>rows.push(['Revisão por km',v.placa,'Não se aplica',m.remainingKm===null?'KM ausente':m.remainingKm<=0?'Vencida':`Faltam ${m.remainingKm} km`]));
      return table(f,['Pendência','Responsável/veículo','Vencimento','Situação'],rows,
        'CNHs, seguros e revisões por km disponíveis. CRLV, contratos e prazos de multas ainda não possuem base estruturada nesta visão.');
    }
    if (f.type === 'record_audit') {
      const records=centralPendingRecords.filter(r=>{const d=r.data && typeof r.data==='object'?r.data:r;return (!f.vehicleId||String(d.vehicleId||r.vehicleId)===String(f.vehicleId))&&(!(f.start||f.end)||isDateWithinRange(d.data||r.createdAt,f.start,f.end));});
      return table(f,['Protocolo','Data','Motorista','Status','Comprovante','Tempo de processamento','Responsável pela ação'],records.map(r=>{const d=r.data && typeof r.data==='object'?r.data:r;return [d.protocolo||r.$id||r.id,d.data||r.createdAt,d.motorista||d.driverName,r.status||d.status,d.comprovanteUrl?'Vinculado':'Não informado','Não informado','Consultar auditoria administrativa'];}),
        'Recorte dos registros carregados da Central. Alterações, exclusões, falhas de sincronização e autoria completa permanecem na auditoria administrativa; lista vazia pode significar dados não carregados.');
    }
    if (f.type === 'irregularities') {
      const seen=new Set(),rows=[];
      getFuelMileageAudit().filter(item=>!f.vehicleId||item.vehicleId===f.vehicleId).forEach(item=>{
        const {entry:e,vehicleId:id,date,previous}=item, liters=parseDecimalInputValue(e.litros),flags=[...item.flags];
        const key=JSON.stringify([id,date,e.km,liters,e.total]);if(id&&seen.has(key))flags.push('Possível duplicidade (mesmos dados)');if(id)seen.add(key);
        if(!e.comprovanteUrl&&!e.receiptUrl&&!e.comprovante)flags.push('Comprovante não identificado nos campos padrão');
        if(flags.length&&(!(f.start||f.end)||isDateWithinRange(date,f.start,f.end)))rows.push([formatDate(date),id?getReportVehicleLabel(id):'Veículo não identificado',e.nf||e.id,item.km??'Não informado',previous?.km??'Sem referência',previous?formatDate(previous.date):'—',previous?(previous.entry.nf||previous.entry.id):'—',flags.join('; ')]);
      });
      return table(f,['Data','Veículo','Referência','KM lançado','KM anterior de referência','Data anterior','Referência anterior','Indícios para revisão'],rows,
        'Compara o histórico carregado, inclusive antes do período selecionado e filhos de agrupamentos. Sem horário, não presume a ordem no mesmo dia. Revise os dois comprovantes antes de corrigir; nenhum KM é alterado automaticamente. Anexos podem existir em agrupamentos.',[badge('Lançamentos para revisar',rows.length,'Use todas as datas para examinar o histórico completo disponível.')]);
    }
  };
  document.addEventListener('DOMContentLoaded',()=>{
    const select=document.getElementById('report-filter-type');if(!select)return;
    select.innerHTML=Object.entries(titles).map(([value,title])=>`<option value="${value}">${title}</option>`).join('');
    const refresh=()=>{document.getElementById('report-situation-wrap').hidden=select.value!=='orders';document.getElementById('report-horizon-wrap').hidden=select.value!=='deadlines';document.getElementById('report-fuel-view-wrap').hidden=select.value!=='fuel_register';};
    select.addEventListener('change',refresh);refresh();renderReports();
  });
  clearReportFilters = () => {
    for(const [id,value] of Object.entries({'report-filter-type':'overview','report-filter-vehicle':'','report-filter-start':'','report-filter-end':'','report-filter-situation':'','report-filter-horizon':'','report-filter-fuel-view':'fuel_register'})) setFilterValue(id,value);
    for(const id of ['report-situation-wrap','report-horizon-wrap','report-fuel-view-wrap']) {const node=document.getElementById(id);if(node)node.hidden=true;}
    syncReportDateBounds();renderReports();
  };
})();

