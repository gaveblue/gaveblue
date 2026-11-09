(function setupWeFrotasOsGuide(global) {
  'use strict';
  const doc = global.document;
  let bridge = null;
  let draftVehicle = null;
  let draftSubstitutionId = '';
  let draftOrderId = '';
  let existingOrder = null;
  let sheetOpen = false;
  let legacyEdited = false;

  const text = value => String(value ?? '');
  const esc = value => text(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const byId = id => doc.getElementById(id);
  const value = id => text(byId(id)?.value).trim();
  const validDate = date => /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(new Date(date + 'T00:00:00').getTime()) &&
    new Date(date + 'T00:00:00').toISOString().slice(0,10) === date;
  const identifier = prefix => prefix + (global.crypto?.randomUUID?.() || String(Date.now()) + '-' + Math.random().toString(36).slice(2));
  const plateKey = plate => text(plate).toUpperCase().replace(/[^A-Z0-9]/g,'');
  const allVehicles = () => bridge?.vehicles?.() || [];
  const allDrivers = () => bridge?.drivers?.() || [];
  const sourceId = () => value('order-veiculo');
  const type = () => value('order-tipo-os');
  const isIncident = t => ['sinistro','pane','revisao','avulsa'].includes(t);
  const setVisible = (id, show) => {const el=byId(id); if(el)el.hidden=!show;};
  const getSaved = () => existingOrder?.operationalIncident || null;
  const linked = () => Boolean(getSaved()?.substitutionId);
  const isPt = () => type()==='sinistro' && value('os-guide-severity')==='pt';
  const stopped = () => isPt() || selectedRadio('os-guide-stopped')==='sim';
  const wantsReserve = () => stopped() && selectedRadio('os-guide-reserve')==='sim';
  const providerLabel = {frota:'Própria frota',locadora:'Locadora',oficina:'Oficina / concessionária',seguradora:'Seguradora'};
  const vehicleLabel = v => [v.numeroFrota ? 'Frota '+v.numeroFrota : '',v.placa||'',v.modelo||''].filter(Boolean).join(' · ');
  const clone = o => JSON.parse(JSON.stringify(o));
  function options(list, placeholder) {
    return '<option value="">'+esc(placeholder)+'</option>'+list.map(item=>'<option value="'+esc(item.id)+'">'+esc(vehicleLabel(item))+'</option>').join('');
  }
  function reset() {
    draftVehicle=null;draftSubstitutionId='';draftOrderId=identifier('os-');existingOrder=null;legacyEdited=false;
    closeSheet(true);
  }
  function formHtml() {
    return '<section class="wf-os-guide" id="os-operational-guide" aria-label="Situação operacional da OS" hidden>'+
      '<header class="wf-os-guide-header"><span class="wf-os-guide-mark">02</span><div><h3>Situação do veículo</h3><p>Responda somente o necessário. Os dados da OS e do carro reserva serão salvos juntos.</p></div></header>'+
      '<div class="wf-os-guide-block" id="os-guide-severity-block" hidden><label for="os-guide-severity">Situação do sinistro</label>'+
      '<select id="os-guide-severity" class="wf-os-guide-select"><option value="avaliacao">Aguardando avaliação</option><option value="leve">Avaria leve / reparável</option><option value="pt">Perda total confirmada</option></select>'+
      '<div class="wf-os-guide-subgrid"><label for="os-guide-insurer">Seguradora (opcional)<input id="os-guide-insurer" placeholder="Nome da seguradora"></label>'+
      '<label for="os-guide-protocol">Protocolo / sinistro (opcional)<input id="os-guide-protocol" placeholder="Número de referência"></label></div>'+
      '<label for="os-guide-bo">Boletim de ocorrência / observações (opcional)<input id="os-guide-bo" placeholder="Número, referência ou informação pertinente"></label></div>'+
      '<div class="wf-os-guide-block" id="os-guide-stopped-block"><span class="wf-os-guide-label">Este veículo ficará parado?</span>'+
      '<div class="wf-os-guide-choices" role="group" aria-label="Veículo ficará parado?">'+
      '<label><input name="os-guide-stopped" type="radio" value="sim"> Sim, ficará indisponível</label>'+
      '<label><input name="os-guide-stopped" type="radio" value="nao"> Não, continua operando</label></div></div>'+
      '<div class="wf-os-guide-alert" id="os-guide-pt-alert" hidden><strong>Perda total confirmada</strong><p>O veículo ficará imobilizado, sem retorno automático à frota. A baixa definitiva deve ser tratada separadamente.</p></div>'+
      '<div class="wf-os-guide-block" id="os-guide-reserve-block" hidden><span class="wf-os-guide-label">O motorista utilizará um carro reserva?</span>'+
      '<div class="wf-os-guide-choices" role="group" aria-label="Precisa de carro reserva?">'+
      '<label><input name="os-guide-reserve" type="radio" value="sim"> Sim, vincular agora</label>'+
      '<label><input name="os-guide-reserve" type="radio" value="nao"> Não / definir depois</label></div></div>'+
      '<div class="wf-os-guide-block wf-os-guide-reserve-detail" id="os-guide-detail" hidden>'+
      '<label for="os-guide-origin">Origem do carro reserva</label>'+
      '<select class="wf-os-guide-select" id="os-guide-origin">'+
      '<option value="frota">Própria frota</option><option value="locadora">Locadora</option>'+
      '<option value="oficina">Oficina / concessionária</option><option value="seguradora">Seguradora</option></select>'+
      '<div class="wf-os-guide-pick"><label for="os-guide-vehicle">Veículo já cadastrado'+
      '<select id="os-guide-vehicle" class="wf-os-guide-select"><option value="">Selecione o carro reserva</option></select></label>'+
      '<button type="button" id="os-guide-new" class="wf-os-guide-new" aria-label="Cadastrar carro reserva temporário">+ Cadastrar novo</button></div>'+
      '<p class="wf-os-guide-small" id="os-guide-created" hidden></p>'+
      '<div class="wf-os-guide-subgrid"><label for="os-guide-start">Data da entrega<input type="date" id="os-guide-start"></label>'+
      '<label for="os-guide-km">KM do carro reserva na entrega<input id="os-guide-km" type="number" min="0" step="1" inputmode="numeric" placeholder="Ex.: 24000"></label></div>'+
      '<p class="wf-os-guide-small">O abastecimento será lançado na placa do reserva, nunca no KM do titular. Data e KM de devolução serão informados ao encerrar a substituição.</p></div>'+
      '<div class="wf-os-guide-alert" id="os-guide-linked" hidden></div>'+
      '<div id="os-guide-closure" class="wf-os-guide-block wf-os-guide-reserve-detail" hidden>'+
      '<strong>Antes de encerrar esta OS</strong><p class="wf-os-guide-small">Confirme as movimentações. Encerrar a OS não presume a devolução do reserva.</p>'+
      '<div id="os-guide-back-block"><span class="wf-os-guide-label">O veículo titular voltou a operar?</span>'+
      '<div class="wf-os-guide-choices"><label><input name="os-guide-back" type="radio" value="sim"> Sim, voltou</label>'+
      '<label><input name="os-guide-back" type="radio" value="nao"> Não, continua parado</label></div></div>'+
      '<div id="os-guide-return-block"><span class="wf-os-guide-label">O carro reserva já foi devolvido?</span>'+
      '<div class="wf-os-guide-choices"><label><input name="os-guide-return" type="radio" value="sim"> Sim, devolvido</label>'+
      '<label><input name="os-guide-return" type="radio" value="nao"> Não, continua em uso</label></div></div>'+
      '<div id="os-guide-return-detail" class="wf-os-guide-subgrid" hidden>'+
      '<label for="os-guide-return-date">Data da devolução<input type="date" id="os-guide-return-date"></label>'+
      '<label for="os-guide-return-km">KM na devolução<input type="number" id="os-guide-return-km" min="0" step="1" inputmode="numeric"></label></div></div>'+
      '<div class="wf-os-guide-summary" id="os-guide-summary"></div>'+
      '</section>';
  }

  function selectedRadio(name) {return doc.querySelector('input[name="'+name+'"]:checked')?.value || '';}
  function setRadio(name,v) {doc.querySelectorAll('input[name="'+name+'"]').forEach(el=>{el.checked=el.value===v});}
  function isReserveInUse(v,source,day) {
    return allVehicles().some(origin=>(origin.vehicleSubstitutions||[]).some(r=>
      r.reserveVehicleId===v.id && r.sourceVehicleId!==source && (!r.endDate || !day || r.endDate>=day)));
  }
  function populateVehicles() {
    const el=byId('os-guide-vehicle');if(!el)return;
    const previous=el.value;
    const source=sourceId(),day=value('os-guide-start')||value('order-data-inicio');
    const rows=allVehicles().filter(v=>String(v.id)!==source&&v.ativo!==false&&
      (!v.operationalStatus||v.operationalStatus==='disponivel')&&!isReserveInUse(v,source,day));
    el.innerHTML=options(rows,'Selecione o carro reserva');
    if(draftVehicle) el.insertAdjacentHTML('beforeend','<option value="'+esc(draftVehicle.id)+'">NOVO · '+esc(vehicleLabel(draftVehicle))+'</option>');
    if(rows.some(r=>String(r.id)===previous)||previous===draftVehicle?.id)el.value=previous;
    else if(draftVehicle)el.value=draftVehicle.id;
  }
  function currentRecord() {
    const old=getSaved();if(!old?.substitutionId)return null;
    const vehicle=allVehicles().find(v=>String(v.id)===String(existingOrder?.vehicleId));
    return (vehicle?.vehicleSubstitutions||[]).find(r=>r.id===old.substitutionId)||null;
  }
  function isClosing() {
    return Boolean(existingOrder&&existingOrder.status!=='fechada'&&
      value('order-status')==='fechada'&&getSaved()?.stopped);
  }
  function readClosure() {
    if(!isClosing())return null;
    const prior=getSaved(),record=currentRecord();
    const back=prior.perdaTotalConfirmada?'nao':selectedRadio('os-guide-back');
    if(!back)throw Error('Confirme se o veículo titular voltou a operar.');
    const active=Boolean(record&&!record.endDate);
    const returned=active?selectedRadio('os-guide-return'):'nao';
    if(active&&!returned)throw Error('Informe se o carro reserva já foi devolvido.');
    if(returned==='sim') {
      const returnDate=value('os-guide-return-date'),returnKm=value('os-guide-return-km');
      if(!validDate(returnDate))throw Error('Informe a data válida de devolução do reserva.');
      if(!/^\d+$/.test(returnKm)||!Number.isSafeInteger(Number(returnKm))||
         Number(returnKm)<Number(record.startKm))
        throw Error('Informe o KM final válido do carro reserva.');
      return {titularBack:back==='sim',reserveReturned:true,returnDate,returnKm:Number(returnKm)};
    }
    return {titularBack:back==='sim',reserveReturned:false};
  }
  function refresh() {
    const root=byId('os-operational-guide');if(!root)return;
    const incident=isIncident(type());
    setVisible('os-operational-guide',incident);
    if(!incident)return;
    if(!existingOrder&&!selectedRadio('os-guide-stopped')){
      if(type()==='pane')setRadio('os-guide-stopped','sim');
      else if(['avulsa','revisao'].includes(type()))setRadio('os-guide-stopped','nao');
    }
    const severity=type()==='sinistro',pt=isPt(),halt=stopped(),need=wantsReserve();
    setVisible('os-guide-severity-block',severity);
    setVisible('os-guide-stopped-block',!pt);
    setVisible('os-guide-pt-alert',pt);
    setVisible('os-guide-reserve-block',halt&&!linked());
    setVisible('os-guide-detail',need&&!linked());
    setVisible('os-guide-linked',linked());
    setVisible('os-guide-closure',isClosing());
    setVisible('os-guide-back-block',isClosing()&&!getSaved()?.perdaTotalConfirmada);
    setVisible('os-guide-return-block',isClosing()&&Boolean(currentRecord()&&!currentRecord().endDate));
    setVisible('os-guide-return-detail',isClosing()&&selectedRadio('os-guide-return')==='sim');
    if(byId('os-guide-severity'))byId('os-guide-severity').disabled=linked();
    doc.querySelectorAll('input[name="os-guide-stopped"]').forEach(el=>{el.disabled=linked()});
    const linkedBox=byId('os-guide-linked');
    if(linkedBox&&linked()){
      linkedBox.innerHTML='<strong>Carro reserva já vinculado</strong><p>A substituição desta OS tem histórico protegido. Para informar devolução ou acompanhar custos, abra a aba Carro reserva na ficha do veículo titular.</p>';
    }
    const s=byId('os-guide-summary');
    if(s){
      const label=pt?'Perda total — indisponível':halt?'Veículo ficará parado':'Veículo continua em operação';
      const note=linked()?'Carro reserva vinculado à OS':
        need?'Carro reserva será registrado junto com a OS':
        halt?'Reserva não informado — poderá ser definido depois':'Não exige carro reserva';
      s.textContent=label+' · '+note;
    }
    const start=byId('os-guide-start');
    if(start&&!start.value)start.value=value('order-data-inicio');
    if(byId('os-guide-new')){byId('os-guide-new').disabled=value('os-guide-origin')==='frota';
      byId('os-guide-new').title=value('os-guide-origin')==='frota'?'Selecione um veículo já cadastrado da frota.':'';}
    if(need&&!linked())populateVehicles();
    const created=byId('os-guide-created');
    if(created){created.hidden=!draftVehicle;created.textContent=draftVehicle?
      'Cadastro temporário preparado: '+vehicleLabel(draftVehicle)+'. Será salvo somente com a OS.':'';}
  }
  function loadOrder(order) {
    existingOrder=order||null;draftVehicle=null;legacyEdited=false;
    const old=getSaved();
    draftSubstitutionId=old?.substitutionId||'';
    setRadio('os-guide-stopped',old?.stopped?'sim':old?'nao':'');
    setRadio('os-guide-reserve',old?.reserveRequested?'sim':old?'nao':'');
    if(byId('os-guide-severity'))byId('os-guide-severity').value=old?.severity||'avaliacao';
    for(const [id,k] of [['os-guide-insurer','insurer'],['os-guide-protocol','protocol'],['os-guide-bo','bo'],
      ['os-guide-origin','origin'],['os-guide-start','startDate'],['os-guide-km','startKm']]){
      if(byId(id)&&old?.[k]!=null)byId(id).value=old[k];
    }
    setRadio('os-guide-back','');setRadio('os-guide-return','');
    refresh();
    if(old?.reserveVehicleId&&byId('os-guide-vehicle'))byId('os-guide-vehicle').value=old.reserveVehicleId;
  }
  function notify(message){bridge?.toast?.(message);}
  function closeSheet(force=false) {
    const el=byId('wf-os-quick-overlay');if(el)el.remove();sheetOpen=false;
  }
  function showSheet() {
    if(sheetOpen)return;
    const origin=value('os-guide-origin')||'locadora';
    if(origin==='frota'){notify('Escolha um veículo já cadastrado da própria frota.');return;}
    const overlay=doc.createElement('div');overlay.id='wf-os-quick-overlay';overlay.className='wf-os-quick-overlay';
    overlay.innerHTML='<div class="wf-os-quick-backdrop" data-os-quick-close></div>'+
      '<section role="dialog" aria-modal="true" aria-labelledby="wf-os-quick-title" class="wf-os-quick-sheet">'+
      '<div class="wf-os-quick-handle"></div><div class="wf-os-quick-title"><div><small>Veículo temporário</small><h2 id="wf-os-quick-title">Cadastrar carro reserva</h2></div>'+
      '<button type="button" class="wf-os-guide-close" data-os-quick-close aria-label="Fechar">×</button></div>'+
      '<p>Informe a placa e os dados mínimos. O cadastro será confirmado junto com a OS, nunca antes.</p>'+
      '<form id="wf-os-quick-form"><label>Placa<input id="wf-os-quick-plate" required maxlength="9" placeholder="ABC-1D23" value="'+esc(draftVehicle?.placa||'')+'"></label>'+
      '<label>Modelo<input id="wf-os-quick-model" required maxlength="120" placeholder="Ex.: Onix" value="'+esc(draftVehicle?.modelo||'')+'"></label>'+
      '<label>Ano (opcional)<input id="wf-os-quick-year" type="number" min="1980" max="2100" placeholder="2026" value="'+esc(draftVehicle?.ano||'')+'"></label>'+
      '<p>Origem selecionada: <strong>'+esc(providerLabel[origin]||origin)+'</strong></p>'+
      '<div class="wf-os-quick-actions"><button type="button" data-os-quick-close>Cancelar</button>'+
      '<button type="submit">Usar este veículo</button></div></form></section>';
    doc.body.appendChild(overlay);sheetOpen=true;byId('wf-os-quick-plate')?.focus();
  }
  function saveQuick(e) {
    e.preventDefault();
    const plate=plateKey(value('wf-os-quick-plate'));
    const model=value('wf-os-quick-model');
    const year=value('wf-os-quick-year');
    if(!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(plate)){notify('Informe uma placa brasileira válida, sem pontuação.');return;}
    if(model.length<2){notify('Informe o modelo do carro reserva.');return;}
    if(year&&(!/^\d{4}$/.test(year)||Number(year)>new Date().getFullYear()+1)){notify('Verifique o ano do carro reserva.');return;}
    if(allVehicles().some(v=>plateKey(v.placa)===plate&&v.id!==draftVehicle?.id)){
      notify('Essa placa já está cadastrada. Selecione o veículo existente.');return;
    }
    const origin=value('os-guide-origin')||'locadora';
    draftVehicle={id:draftVehicle?.id||identifier('res-'),numeroFrota:'RES-'+plate,placa:plate,modelo:model,ano:year,cor:'',
      propriedade:origin==='locadora'?'locado':'emprestado',locado:origin==='locadora',
      temporario:true,reserveProviderOrigin:origin,operationalStatus:'disponivel',ativo:true,motoristaId:''};
    closeSheet(true);populateVehicles();refresh();
    if(byId('os-guide-vehicle'))byId('os-guide-vehicle').value=draftVehicle.id;
  }
  function collect() {
    if(!isIncident(type()))return {enabled:false};
    const prior=getSaved();
    if(existingOrder&&!prior&&!legacyEdited)return {enabled:false,legacy:true};
    const severity=type()==='sinistro'?value('os-guide-severity'):'';
    const halt=stopped(),need=wantsReserve();
    const source=sourceId(),driver=value('order-driver'),date=value('os-guide-start')||value('order-data-inicio');
    if(type()==='sinistro'&&!['leve','avaliacao','pt'].includes(severity))throw Error('Selecione a situação do sinistro.');
    if(!isPt()&&!selectedRadio('os-guide-stopped'))throw Error('Informe se o veículo ficará parado.');
    if(halt&&!linked()&&!selectedRadio('os-guide-reserve'))throw Error('Informe se haverá carro reserva ou se será definido depois.');
    const incident={
      kind:type(),severity,stopped:halt,unavailable:halt,perdaTotalConfirmada:isPt(),
      insurer:value('os-guide-insurer'),protocol:value('os-guide-protocol'),bo:value('os-guide-bo'),
      reserveRequested:need||linked(),origin:need?value('os-guide-origin'):prior?.origin||'',
      reserveVehicleId:linked()?prior.reserveVehicleId:need?value('os-guide-vehicle'):'',
      substitutionId:linked()?prior.substitutionId:need?(draftSubstitutionId ||= identifier('osr-')):'',
      startDate:need?date:prior?.startDate||'',
      startKm:need?value('os-guide-km'):prior?.startKm||'',
      reserveStatus:linked()?prior.reserveStatus:halt?(need?'em_uso':'pendente'):'nao_necessario'
    };
    if(linked()){
      const record=currentRecord();
      if(!record)throw Error('Vínculo do carro reserva não localizado. Revise o histórico antes de editar esta OS.');
      const closure=readClosure();
      return {enabled:true,incident:{...prior,
        insurer:incident.insurer,protocol:incident.protocol,bo:incident.bo,
        ...(record.endDate||closure?.reserveReturned?{reserveStatus:'devolvido'}:{}),
        ...(closure?.titularBack?{restoredAt: value('order-data-termino')||new Date().toISOString().slice(0,10)}:{})
      },closure};
    }
    if(need){
      if(draftVehicle&&incident.reserveVehicleId===draftVehicle.id){
        if(incident.origin==='frota')throw Error('Selecione um carro já cadastrado da frota. O cadastro rápido é para veículos emprestados ou locados.');
        draftVehicle.reserveProviderOrigin=incident.origin;
        draftVehicle.propriedade=incident.origin==='locadora'?'locado':'emprestado';
        draftVehicle.locado=incident.origin==='locadora';
      }
      if(!source||!driver)throw Error('Selecione o veículo e o motorista responsável pelo reserva.');
      if(!incident.reserveVehicleId)throw Error('Escolha ou cadastre o carro reserva.');
      if(incident.reserveVehicleId===source)throw Error('O titular não pode ser o próprio carro reserva.');
      if(!validDate(date))throw Error('Informe uma data válida para a entrega do carro reserva.');
      if(!/^\d+$/.test(incident.startKm)||!Number.isSafeInteger(Number(incident.startKm)))throw Error('Informe o KM inteiro do carro reserva na entrega.');
      const reserve=draftVehicle?.id===incident.reserveVehicleId?draftVehicle:allVehicles().find(v=>String(v.id)===incident.reserveVehicleId);
      if(!reserve)throw Error('O carro reserva não está cadastrado.');
      if(reserve.ativo===false||reserve.operationalStatus&&reserve.operationalStatus!=='disponivel')throw Error('O carro reserva não está disponível operacionalmente.');
      const record={id:incident.substitutionId,sourceVehicleId:source,reserveVehicleId:reserve.id,driverId:driver,
        reason:type()==='sinistro'?'sinistro':type()==='pane'?'manutencao':'outro',
        startDate:date,endDate:'',startKm:Number(incident.startKm),endKm:'',
        extraCost:0,notes:'Vinculado à ordem de serviço',createdAt:new Date().toISOString()};
      return {enabled:true,incident,reserveVehicle:draftVehicle?.id===reserve.id?clone(draftVehicle):null,record};
    }
    const closure=readClosure();
    return {enabled:true,incident:{
      ...incident,
      ...(closure?.titularBack?{restoredAt:value('order-data-termino')||new Date().toISOString().slice(0,10)}:{})
    },closure};
  }
  function onChange(e) {
    if(!byId('os-operational-guide'))return;
    if(existingOrder&&!getSaved()&&(e.target?.id==='order-tipo-os'||e.target?.closest?.('#os-operational-guide')))legacyEdited=true;
    if(e.target?.id==='order-tipo-os'){
      setRadio('os-guide-stopped',type()==='pane'?'sim':['avulsa','revisao'].includes(type())?'nao':'');
      setRadio('os-guide-reserve','');
    }
    if(e.target?.id==='order-tipo-os'||e.target?.id==='order-veiculo'||e.target?.id==='order-data-inicio'||e.target?.id==='order-status'
      ||e.target?.id==='os-guide-severity'||e.target?.id==='os-guide-start'
      ||e.target?.id==='os-guide-origin'||e.target?.closest?.('#os-operational-guide'))refresh();
  }
  if(doc) {
    doc.addEventListener('change',onChange);
    doc.addEventListener('click',e=>{
      if(e.target?.closest?.('#os-guide-new')){e.preventDefault();showSheet();}
      if(e.target?.closest?.('[data-os-quick-close]')){e.preventDefault();closeSheet(true);}
    });
    doc.addEventListener('submit',e=>{if(e.target?.id==='wf-os-quick-form')saveQuick(e);});
    doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&sheetOpen)closeSheet(true);});
  }
  global.WeFrotasOsGuide=Object.freeze({
    configure(api){bridge=api;},
    reset,formHtml,refresh,loadOrder,collect,
    draftOrderId:()=>draftOrderId,
    getDraftVehicle:()=>draftVehicle,
    __test:{plateKey,validDate}
  });
})(typeof window !== 'undefined'?window:globalThis);
