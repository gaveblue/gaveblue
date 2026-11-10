(function wefrotasReplacementModule() {
  'use strict';
  const bridge = () => window.WeFrotasReplacementBridge;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
  const number = v => new Intl.NumberFormat('pt-BR').format(Number(v)||0);
  const today = () => { const d = new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
  const vehicleLabel = v => [v?.numeroFrota ? `Frota ${v.numeroFrota}` : '',v?.placa,v?.modelo].filter(Boolean).join(' · ') || 'Veículo';
  const vehicle = id => bridge()?.vehicles().find(v => String(v.id)===String(id));
  const all = () => bridge()?.vehicles().flatMap(v => (Array.isArray(v.vehicleSubstitutions)?v.vehicleSubstitutions:[]).map(item=>({...item,sourceVehicleId:v.id}))) || [];
  const fuelDate = entry => String(entry?.dataAbastecimento || entry?.dataVencimento || '').slice(0,10);
  const activeOn = (item,date) => Boolean(date && item.startDate && date>=item.startDate && (!item.endDate || date<=item.endDate));
  const overlaps = (a,b) => a.startDate <= (b.endDate||'9999-12-31') && b.startDate <= (a.endDate||'9999-12-31');
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value||'') && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value;
  let saving=false, returnFocus=null;
  const entries = item => bridge()?.finance().filter(entry => entry?.entryType==='combustivel'
    && entry.kind!=='receita'
    && entry.vehicleId===item.reserveVehicleId
    && (entry.substitutionId===item.id || (
      !entry.substitutionId && entry.vehicleId===item.reserveVehicleId
      && entry.driverId && item.driverId && String(entry.driverId)===String(item.driverId)
      && activeOn(item,fuelDate(entry))
    ))) || [];
  function currentForDriver(driverId,date) {
    if(!driverId || !date) return null;
    return all().find(r => String(r.driverId)===String(driverId) && activeOn(r,date)) || null;
  }
  // Resolve a Central record against the physical reserve, not the driver's habitual car.
  // Never silently switch an unrelated plate or reinterpret events outside the OS period.
  function resolveCentralFuel(recordedVehicleId,driverId,date) {
    const recordedId=String(recordedVehicleId||'');
    const active=currentForDriver(driverId,date);
    if (!active) {
      const upcoming=all().filter(r=>String(r.sourceVehicleId)===recordedId
        && driverId && String(r.driverId)===String(driverId) && r.startDate>date)
        .sort((a,b)=>a.startDate.localeCompare(b.startDate))[0];
      const days=upcoming ? Math.round((Date.parse(upcoming.startDate)-Date.parse(date))/86400000) : -1;
      return {vehicleId:recordedId,isReserve:false,review:false,
        periodWarning:days>=1 && days<=7
          ? 'A entrega do carro reserva está registrada para '+upcoming.startDate+'. O abastecimento é anterior. Confira a data na OS caso o KM seja do reserva.'
          : ''};
    }
    const sourceId=String(active.sourceVehicleId),reserveId=String(active.reserveVehicleId);
    if (recordedId && recordedId!==sourceId && recordedId!==reserveId)
      return {vehicleId:'',isReserve:false,review:true,
        reason:'O veículo registrado na Central é diferente do titular e do reserva desta substituição. Confirme a placa física antes de aprovar.'};
    if (!vehicle(reserveId))
      return {vehicleId:'',isReserve:false,review:true,
        reason:'O carro reserva desta substituição não foi encontrado no cadastro. Confira a OS.'};
    return {vehicleId:reserveId,isReserve:true,review:false,
      replacementId:active.id,replacedVehicleId:sourceId};
  }
  function forFuel(vehicleId,driverId,date) {
    if(!date) return {replacement:null,wrongVehicle:false};
    const sourceMatch = all().find(r=>r.sourceVehicleId===vehicleId && activeOn(r,date));
    if(sourceMatch) return {replacement:sourceMatch,wrongVehicle:true};
    const reserveMatches = all().filter(r=>r.reserveVehicleId===vehicleId && activeOn(r,date));
    const match = reserveMatches.find(r=>r.driverId===driverId) || (reserveMatches.length===1?reserveMatches[0]:null);
    return {replacement:match||null,wrongVehicle:false};
  }
  function association(vehicleId,driverId,date,existingId='',km='') {
    const result=forFuel(vehicleId,driverId,date);
    if(result.wrongVehicle) return {error:result.replacement?.reason==='sinistro'
      ? 'Este veículo está sinistrado e possui carro reserva ativo. Selecione a placa física do reserva e informe o KM do reserva antes de salvar.'
      : 'Este veículo está temporariamente substituído. Lance o abastecimento na placa do carro reserva, usando o KM do reserva.'};
    const r=result.replacement;
    if(r && r.driverId && r.driverId!==driverId) return {error:'O motorista informado não corresponde ao motorista desta substituição.'};
    if(existingId && (!r || r.id!==existingId)) return {error:'Este abastecimento já está vinculado a uma substituição. Revise o vínculo antes de alterar veículo, motorista ou período.'};
    if(r && km!=='' && km!=null && Number.isSafeInteger(Number(km)) && Number(km)<Number(r.startKm))
      return {error:'KM do abastecimento menor que o KM registrado na entrega do carro reserva.'};
    if(r && r.endDate && km!=='' && km!=null && Number.isSafeInteger(Number(km)) && Number(km)>Number(r.endKm))
      return {error:'KM do abastecimento maior que o KM registrado na devolução do carro reserva.'};
    if(r && existingId && r.id!==existingId) return {replacementId:r.id,replacedVehicleId:r.sourceVehicleId};
    return r ? {replacementId:r.id,replacedVehicleId:r.sourceVehicleId,sinisterFuelReview:false} : {replacementId:'',replacedVehicleId:'',sinisterFuelReview:false};
  }
  function statistics(item) {
    const fuel=entries(item).filter(entry=>activeOn(item,fuelDate(entry)));
    // Reuse the same cent-based allocation as the vehicle/finance reports.
    const rows=bridge()?.costRows?.(item);
    const fuelIds=new Set(fuel.map(e=>e.id));
    const spent=rows ? rows.filter(r=>fuelIds.has(r.entry.id)).reduce((sum,r)=>sum+r.total,0)
      : fuel.reduce((sum,e)=>sum+Number(bridge()?.netCost(e)||0),0);
    const other=rows ? rows.filter(r=>!fuelIds.has(r.entry.id) && r.entry.entryType!=='combustivel'
      && (r.entry.substitutionId===item.id || (!r.entry.substitutionId && r.entry.driverId===item.driverId))).reduce((sum,r)=>sum+r.total,0):0;
    const readings=fuel.map(e=>Number(e.km)).filter(n=>Number.isSafeInteger(n)&&n>=0);
    const last=item.endKm!=='' && item.endKm!=null ? Number(item.endKm) : readings.length?Math.max(Number(item.startKm),...readings):null;
    const km=last!==null && Number.isFinite(last) && last>=Number(item.startKm) ? last-Number(item.startKm) : null;
    const extra=Math.max(0,Number(item.extraCost)||0);
    return {fuel,spent,other,extra,total:spent+other+extra,km,perKm:km>0?(spent+other+extra)/km:null};
  }
  function validate(value) {
    const source=vehicle(value.sourceVehicleId),reserve=vehicle(value.reserveVehicleId);
    if(!source || !reserve) return 'Cadastre o titular e o veículo reserva antes de iniciar a substituição.';
    if(source.id===reserve.id) return 'O titular e o carro reserva precisam ser veículos diferentes.';
    if(!value.driverId || !bridge().drivers().some(d=>d.id===value.driverId)) return 'Selecione um motorista cadastrado.';
    const original=all().find(r=>r.id===value.id);
    if(!original && (source.ativo===false || reserve.ativo===false || bridge().drivers().find(d=>d.id===value.driverId)?.ativo===false)) return 'Veículos e motorista precisam estar ativos.';
    if(!original && reserve.operationalStatus && reserve.operationalStatus!=='disponivel') return 'O carro reserva não está disponível operacionalmente.';
    if(!['manutencao','sinistro','outro'].includes(value.reason)) return 'Selecione um motivo válido.';
    if(!validDate(value.startDate)) return 'Informe uma data de entrega válida.';
    if(value.endDate && !validDate(value.endDate)) return 'Informe uma data de devolução válida.';
    if(value.startKm==='' || value.startKm==null || !Number.isSafeInteger(Number(value.startKm)) || Number(value.startKm)<0) return 'O KM de entrega deve ser inteiro e não negativo.';
    if(value.endDate && value.endDate<value.startDate) return 'A devolução não pode ser anterior à entrega.';
    if(value.endDate && (value.endKm==='' || value.endKm==null || !Number.isSafeInteger(Number(value.endKm)) || Number(value.endKm)<Number(value.startKm))) return 'Informe um KM de devolução válido, igual ou maior que o KM de entrega.';
    if(!value.endDate && value.endKm!=='' && value.endKm!=null) return 'Informe também a data de devolução para registrar o KM final.';
    if(!Number.isFinite(Number(value.extraCost)) || Number(value.extraCost)<0) return 'O custo adicional não pode ser negativo.';
    const concurrent=all().find(r=>r.id!==value.id && overlaps(r,value) && (
      r.sourceVehicleId===value.sourceVehicleId || r.reserveVehicleId===value.reserveVehicleId ||
      r.sourceVehicleId===value.reserveVehicleId || r.reserveVehicleId===value.sourceVehicleId ||
      (value.driverId && r.driverId===value.driverId)
    ));
    if(concurrent) return `Já existe uma substituição sobreposta para esse veículo ou motorista (${vehicle(concurrent.reserveVehicleId)?.placa||'-'}).`;
    const previous=bridge().finance().filter(e=>e.entryType==='combustivel' && e.vehicleId===reserve.id && fuelDate(e) && fuelDate(e)<value.startDate)
      .map(e=>Number(e.km)).filter(n=>Number.isSafeInteger(n) && n>=0);
    if(previous.length && Number(value.startKm)<Math.max(...previous)) return 'KM de entrega inferior ao abastecimento anterior registrado para o reserva.';
    const linked=entries(value).filter(e=>activeOn(value,fuelDate(e)));
    if(value.id && bridge().finance().some(e=>e.substitutionId===value.id && !activeOn(value,fuelDate(e))))
      return 'O novo período exclui abastecimentos já vinculados. Revise as datas antes de encerrar.';
    if(value.endDate && bridge().finance().some(e=>e.entryType==='combustivel' && e.vehicleId===reserve.id && fuelDate(e)>value.endDate && e.km!=='' && e.km!=null && Number.isSafeInteger(Number(e.km)) && Number(e.km)<Number(value.endKm))) return 'KM de devolução superior a uma leitura posterior do reserva.';
    if(linked.some(e=>Number.isSafeInteger(Number(e.km)) && Number(e.km)<Number(value.startKm)))
      return 'Há abastecimento do reserva com KM inferior ao KM de entrega.';
    if(value.endDate && linked.some(e=>Number.isSafeInteger(Number(e.km)) && Number(e.km)>Number(value.endKm)))
      return 'Há abastecimento até a devolução com KM superior ao KM final informado.';
    if(value.id) {
      const original=all().find(r=>r.id===value.id);
      if(original && entries(original).length) {
        const locked=['sourceVehicleId','reserveVehicleId','driverId','startDate','startKm'];
        if(locked.some(k=>String(original[k])!==String(value[k]))) return 'Não é possível trocar os vínculos ou a entrega após existirem abastecimentos vinculados.';
      }
    }
    return '';
  }
  function operationalText(value) {
    return ({manutencao:'Em manutenção',sinistro:'Sinistrado',imobilizado:'Imobilizado',disponivel:'Disponível'})[value]||'Disponível';
  }
  function renderProfile(sourceId) {
    const source=vehicle(sourceId);if(!source)return '<p>Veículo não encontrado.</p>';
    const records=all().filter(r=>String(r.sourceVehicleId)===String(sourceId)).sort((a,b)=>String(b.startDate).localeCompare(String(a.startDate)));
    const open=records.some(r=>!r.endDate);
    const status=operationalText(source.operationalStatus);
    const cards=records.map(r=>{
      const s=statistics(r),reserve=vehicle(r.reserveVehicleId),driver=bridge().drivers().find(d=>d.id===r.driverId);
      const statusLabel=r.endDate?'Encerrada':'Em utilização';
      return `<article class="wf-reserve-card">
        <div class="wf-reserve-card-head"><div><small>${esc(r.reason==='sinistro'?'Sinistro':r.reason==='manutencao'?'Manutenção':'Indisponibilidade')} · ${esc(statusLabel)}</small>
        <h3>${esc(vehicleLabel(reserve))}</h3><p>${esc(driver?.nome||'Motorista não localizado')}${r.orderNumber ? ' · OS ' + esc(r.orderNumber) : ''}</p></div>
        <button type="button" class="wf-reserve-button" data-wf-open="${esc(sourceId)}" data-wf-edit="${esc(r.id)}">${r.endDate?'Ver / editar':'Gerenciar'}</button></div>
        <div class="wf-reserve-facts"><div><span>Período</span><strong>${esc(r.startDate)} — ${esc(r.endDate||'em uso')}</strong></div><div><span>Odômetro do reserva</span><strong>${number(r.startKm)} — ${r.endKm!=='' && r.endKm!=null?number(r.endKm):'não devolvido'}</strong></div>
        <div><span>Combustível</span><strong>${money(s.spent)}</strong></div><div><span>Custo adicional informado</span><strong>${money(s.extra)}</strong></div><div><span>Distância do reserva</span><strong>${s.km===null?'Aguardando leitura':number(s.km)+' km'}</strong></div>
        <div><span>Outras despesas vinculadas</span><strong>${money(s.other)}</strong></div><div><span>Custo operacional estimado</span><strong>${money(s.total)}</strong></div></div>
        <p class="wf-reserve-hint">KM e abastecimentos pertencem ao ${esc(reserve?.placa||'reserva')}. Os custos aparecem aqui apenas para análise da substituição, sem duplicar lançamentos financeiros.</p></article>`;
    }).join('');
    return `<div class="wf-reserve-container"><div class="wf-reserve-head"><div><h3>Substituições temporárias</h3><p>Status operacional do titular: ${esc(status)}. O odômetro do titular não recebe registros do reserva.</p></div>
      <button type="button" class="wf-reserve-primary" data-wf-open="${esc(sourceId)}" ${open?'disabled title="Encerre a substituição atual antes de iniciar outra"':''}>+ Carro reserva</button></div>
      ${cards||'<div class="vp-empty">Nenhuma substituição cadastrada. Inicie uma para vincular motorista, datas, KM e veículo reserva.</div>'}
      <p class="wf-reserve-hint">Carro de seguradora, oficina ou locadora? Cadastre-o em Veículos com propriedade “Locado” ou “Emprestado”, depois selecione-o aqui. Os custos adicionais são informativos e não geram uma segunda despesa no Financeiro.</p></div>`;
  }
  function closeSheet() {
    if(saving)return;
    const overlay=document.getElementById('wf-reserve-overlay');
    if(overlay){overlay.remove();document.body.classList.remove('wf-reserve-lock');returnFocus?.focus?.();}
  }
  function openSheet(sourceId,editId='') {
    if(saving)return;
    const source=vehicle(sourceId);if(!source)return;
    const current=editId ? all().find(r=>r.id===editId && r.sourceVehicleId===sourceId):null;
    if(editId && !current)return;
    const record=current||{id:'',sourceVehicleId:sourceId,reserveVehicleId:'',driverId:source.motoristaId||'',reason:'manutencao',startDate:today(),endDate:'',startKm:'',endKm:'',extraCost:0,notes:''};
    const locked=Boolean(record.id && entries(record).length);
    const options=bridge().vehicles().filter(v=>v.id!==sourceId && (v.ativo!==false || v.id===record.reserveVehicleId))
      .sort((a,b)=>vehicleLabel(a).localeCompare(vehicleLabel(b),'pt-BR'));
    const drivers=bridge().drivers().filter(d=>d.ativo!==false || d.id===record.driverId).sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR'));
    closeSheet();
    returnFocus=document.activeElement;
    const overlay=document.createElement('div');overlay.id='wf-reserve-overlay';overlay.className='wf-reserve-overlay';
    overlay.innerHTML=`<div class="wf-reserve-backdrop" data-wf-close="1"></div><section class="wf-reserve-sheet" role="dialog" aria-modal="true" aria-labelledby="wf-reserve-heading">
      <div class="wf-reserve-handle" aria-hidden="true"></div><div class="wf-reserve-sheet-title"><div><small>WeFrotas · Veículos</small><h2 id="wf-reserve-heading">${current?'Gerenciar carro reserva':'Nova substituição'}</h2></div><button type="button" class="wf-reserve-close" data-wf-close="1" aria-label="Fechar">×</button></div>
      <form id="wf-reserve-form" data-source-id="${esc(sourceId)}" data-record-id="${esc(record.id)}"><p class="wf-reserve-source">Titular: <strong>${esc(vehicleLabel(source))}</strong></p>
      <div class="wf-reserve-form-grid">
      <label>Motivo<select id="wf-reason" ${locked?'disabled':''}><option value="manutencao" ${record.reason==='manutencao'?'selected':''}>Manutenção</option><option value="sinistro" ${record.reason==='sinistro'?'selected':''}>Sinistro</option><option value="outro" ${record.reason==='outro'?'selected':''}>Outro</option></select></label>
      <label>Motorista responsável<select id="wf-driver" required ${locked?'disabled':''}><option value="">Selecione</option>${drivers.map(d=>`<option value="${esc(d.id)}" ${d.id===record.driverId?'selected':''}>${esc(d.nome)}</option>`).join('')}</select></label>
      <label class="wf-reserve-wide">Veículo reserva<select id="wf-vehicle" required ${locked?'disabled':''}><option value="">Selecione o carro reserva cadastrado</option>${options.map(v=>`<option value="${esc(v.id)}" ${v.id===record.reserveVehicleId?'selected':''}>${esc(vehicleLabel(v))}</option>`).join('')}</select></label>
      <label>Data da entrega<input id="wf-start-date" type="date" required value="${esc(record.startDate)}" ${locked?'disabled':''}></label>
      <label>KM na entrega<input id="wf-start-km" type="number" min="0" step="1" required value="${esc(record.startKm)}" ${locked?'disabled':''}></label>
      <label>Data da devolução<input id="wf-end-date" type="date" value="${esc(record.endDate)}"></label>
      <label>KM na devolução<input id="wf-end-km" type="number" min="0" step="1" value="${esc(record.endKm)}"></label>
      <label class="wf-reserve-wide">Custo adicional (R$) — informativo<input id="wf-extra" type="number" min="0" step=".01" value="${esc(record.extraCost||0)}"></label>
      <label class="wf-reserve-wide">Observações<textarea id="wf-notes" rows="2">${esc(record.notes)}</textarea></label>
      </div><p class="wf-reserve-hint">${locked?'Já há abastecimentos vinculados. Veículo, motorista, motivo e dados de entrega foram bloqueados para preservar a auditoria.':'O veículo reserva precisa ter cadastro próprio para receber KM e abastecimentos.'} Para encerrar, informe data e KM de devolução.</p>
      <div class="wf-reserve-actions"><button type="button" data-wf-close="1">Cancelar</button><button class="wf-reserve-primary" id="wf-save" type="submit">${record.endDate?'Salvar alterações':current?'Salvar / encerrar':'Iniciar substituição'}</button></div>
      </form></section>`;
    document.body.append(overlay);document.body.classList.add('wf-reserve-lock');
    overlay.querySelector('#wf-reason').disabled=locked;
    overlay.querySelector('#wf-reason').value=record.reason;
    overlay.querySelector('#wf-reserve-heading').focus?.();
    overlay.querySelector('#wf-vehicle')?.focus();
  }
  async function onSubmit(form) {
    if(saving)return;
    const sourceId=form.dataset.sourceId,recordId=form.dataset.recordId;
    const old=recordId?all().find(r=>r.id===recordId):null;
    const field=id=>form.querySelector('#'+id)?.value||'';
    const next={
      id:recordId || (typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`),
      sourceVehicleId:sourceId,
      reserveVehicleId:old?.reserveVehicleId && form.querySelector('#wf-vehicle').disabled?old.reserveVehicleId:field('wf-vehicle'),
      driverId:old?.driverId && form.querySelector('#wf-driver').disabled?old.driverId:field('wf-driver'),
      reason:old?.reason && form.querySelector('#wf-reason').disabled?old.reason:field('wf-reason'),
      startDate:old?.startDate && form.querySelector('#wf-start-date').disabled?old.startDate:field('wf-start-date'),
      startKm:old?.startKm!=null && form.querySelector('#wf-start-km').disabled?old.startKm:field('wf-start-km'),
      endDate:field('wf-end-date'),
      endKm:field('wf-end-km'),
      extraCost:Math.round(Number(field('wf-extra')||0)*100)/100,
      notes:field('wf-notes').trim(),
      createdAt:old?.createdAt||new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };
    const error=validate(next);
    if(error){bridge().toast(error);return;}
    form.dataset.recordId=next.id; // Retry with the same ID after an uncertain response.
    saving=true;form.setAttribute('aria-busy','true');
    const btn=form.querySelector('#wf-save');btn.disabled=true;btn.textContent='Salvando...';
    try {
      await bridge().save(sourceId,next);
      saving=false;
      closeSheet();window.WeFrotasVehicleProfile?.refresh();
      bridge().toast(next.endDate?'Substituição encerrada/atualizada. Odômetros preservados.':'Carro reserva vinculado. Abasteça pela placa do reserva.');
    } catch(e) {bridge().toast(`Substituição não confirmada no servidor: ${e.message||'falha na conexão'}`);}
    finally {saving=false;form.removeAttribute('aria-busy');btn.disabled=false;btn.textContent='Salvar';}
  }
  document.addEventListener('click',event=>{
    const close=event.target.closest?.('[data-wf-close]');
    if(close){event.preventDefault();closeSheet();return;}
    const target=event.target.closest?.('[data-wf-open]');
    if(target){event.preventDefault();openSheet(target.dataset.wfOpen,target.dataset.wfEdit||'');}
  });
  document.addEventListener('submit',event=>{
    if(event.target?.id!=='wf-reserve-form')return;
    event.preventDefault();onSubmit(event.target);
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape' && document.getElementById('wf-reserve-overlay'))closeSheet();
    if(event.key==='Tab') {
      const overlay=document.getElementById('wf-reserve-overlay');
      const controls=overlay && [...overlay.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')];
      if(!controls?.length)return;
      const first=controls[0],last=controls[controls.length-1];
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  window.WeFrotasSubstitutions={all,forFuel,association,currentForDriver,resolveCentralFuel,statistics,validate,renderProfile,open:openSheet,close:closeSheet};
})();
