(() => {
  'use strict';
  const dialog=document.createElement('dialog');dialog.id='withdrawal-dialog';dialog.className='form-dialog withdrawal-dialog';dialog.setAttribute('aria-labelledby','withdrawal-title');
  dialog.innerHTML='<form id="withdrawal-form"><div class="withdrawal-heading"><div><span class="section-kicker">Controle de cheques</span><h2 id="withdrawal-title">Registrar saque</h2></div><button type="button" id="withdrawal-close" class="secondary" aria-label="Fechar registro de saque">✕</button></div><p id="withdrawal-description"></p><label>Data de saque<input type="date" id="withdrawal-date" required></label><p id="withdrawal-error" role="alert"></p><div class="withdrawal-actions"><button type="button" id="withdrawal-remove" class="danger" hidden>Remover saque</button><button type="button" id="withdrawal-cancel" class="secondary">Cancelar</button><button type="submit" id="withdrawal-save">Salvar saque</button></div></form>';
  document.body.append(dialog);
  const el=id=>document.getElementById(id),input=el('withdrawal-date'),error=el('withdrawal-error');let selected=null,saving=false,trigger=null;
  const tableStatus=document.createElement('p');tableStatus.id='cheque-withdrawal-status';tableStatus.setAttribute('role','status');el('cheques').append(tableStatus);
  function validDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
  function open(record){
    if(saving)return;selected=record;trigger=document.activeElement;tableStatus.textContent='';input.max=today();input.value=record.data.dataSaque||today();input.setCustomValidity('');error.textContent='';
    el('withdrawal-title').textContent=record.data.dataSaque?'Editar saque':'Registrar saque';el('withdrawal-description').textContent='Cheque '+record.data.cheque+' · '+record.data.nome+' · '+money(record.data.valor);
    el('withdrawal-remove').hidden=!record.data.dataSaque;dialog.showModal();input.focus();
  }
  function toggle(record){
    if(saving)return;
    if(!record.data.dataSaque){open(record);return;}
    selected=record;trigger=document.activeElement;tableStatus.textContent='';save(true);
  }
  function close(){if(!saving)dialog.close();}
  dialog.addEventListener('cancel',event=>{if(saving)event.preventDefault();});
  dialog.addEventListener('close',()=>{if(trigger?.isConnected)trigger.focus();});
  el('withdrawal-close').onclick=el('withdrawal-cancel').onclick=close;
  input.oninput=()=>{input.setCustomValidity('');error.textContent='';};
  async function save(remove=false){
    if(saving||!selected)return;
    const date=remove?'':input.value;
    if(!remove){input.setCustomValidity(validDate(date)&&date<=today()?'':'Informe uma data de saque válida, até hoje.');if(!el('withdrawal-form').reportValidity())return;}
    saving=true;error.textContent='';if(trigger)trigger.disabled=true;dialog.querySelectorAll('button,input').forEach(control=>control.disabled=true);
    try{
      // Read and update atomically: keep stored PDFs, attachments and file references intact.
      await new Promise((resolve,reject)=>{
        const tx=db.transaction('recibos','readwrite'),store=tx.objectStore('recibos'),request=store.get(selected.id);let failure='';
        request.onsuccess=()=>{
          const current=request.result;
          if(!current||(current.updatedAt||current.createdAt)!==(selected.updatedAt||selected.createdAt)){failure='Este recibo foi alterado ou excluído. Feche esta janela e reabra a tela de cheques antes de tentar novamente.';tx.abort();return;}
          if((current.data.formaPagamento||'cheque')!=='cheque'){failure='Este recibo não possui pagamento por cheque.';tx.abort();return;}
          const data={...current.data};if(remove)delete data.dataSaque;else data.dataSaque=date;
          store.put({...current,data,updatedAt:new Date().toISOString()});
        };
        tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(new Error(failure||'Não foi possível salvar o saque. Tente novamente.'));
      });
      await refresh();dialog.close();
      [...document.querySelectorAll('.cheque-withdrawal')].find(button=>button.getAttribute('aria-label')==='Saque do cheque '+selected.data.cheque)?.focus();
    }catch(e){if(dialog.open)error.textContent=e.message;else tableStatus.textContent=e.message;}
    finally{saving=false;if(trigger)trigger.disabled=false;dialog.querySelectorAll('button,input').forEach(control=>control.disabled=false);}
  }
  el('withdrawal-form').onsubmit=event=>{event.preventDefault();save();};el('withdrawal-remove').onclick=()=>save(true);
  window.chequeWithdrawal={open,toggle,validDate};
  const periodDialog=document.createElement('dialog');periodDialog.id='cheque-period-dialog';periodDialog.className='form-dialog withdrawal-dialog';periodDialog.setAttribute('aria-labelledby','cheque-period-title');
  periodDialog.innerHTML='<form id="cheque-period-form"><div class="withdrawal-heading"><div><span class="section-kicker">Filtro de período</span><h2 id="cheque-period-title">Qual data deseja buscar?</h2></div><button type="button" id="cheque-period-close" class="secondary" aria-label="Fechar filtro de período">✕</button></div><fieldset class="period-type"><legend>Buscar por</legend><label><input type="radio" name="period-type" value="emissao" required> Emissão do cheque</label><label><input type="radio" name="period-type" value="saque" required> Data do saque</label></fieldset><div class="period-dates"><label>De<input type="date" id="cheque-date-from" required></label><label>Até<input type="date" id="cheque-date-to" required></label></div><p id="cheque-date-error" role="alert"></p><div class="withdrawal-actions"><button type="button" id="cheque-period-remove" class="secondary">Remover período</button><button type="button" id="cheque-period-cancel" class="secondary">Cancelar</button><button type="submit">Aplicar período</button></div></form>';
  document.body.append(periodDialog);
  const periodForm=el('cheque-period-form'),periodButton=el('cheque-period'),from=el('cheque-date-from'),to=el('cheque-date-to');
  function updatePeriod(){periodButton.textContent=chequePeriod?(chequePeriod.type==='saque'?'Saque':'Emissão')+': '+dateBR(chequePeriod.from)+' a '+dateBR(chequePeriod.to):'Selecionar período';periodButton.title=periodButton.textContent;renderCheques();}
  function clear(){chequePeriod=null;updatePeriod();}
  periodButton.onclick=()=>{
    periodForm.reset();from.value=chequePeriod?.from||'';to.value=chequePeriod?.to||'';
    if(chequePeriod)periodForm.querySelector('[value="'+chequePeriod.type+'"]').checked=true;
    el('cheque-date-error').textContent='';to.setCustomValidity('');el('cheque-period-remove').hidden=!chequePeriod;periodDialog.showModal();
  };
  el('cheque-period-close').onclick=el('cheque-period-cancel').onclick=()=>periodDialog.close();
  periodDialog.addEventListener('close',()=>periodButton.focus());
  el('cheque-period-remove').onclick=()=>{clear();periodDialog.close();};
  periodForm.oninput=()=>{to.setCustomValidity('');el('cheque-date-error').textContent='';};
  periodForm.onsubmit=event=>{
    event.preventDefault();const type=periodForm.querySelector('[name="period-type"]:checked')?.value;
    if(!type||!validDate(from.value)||!validDate(to.value)||from.value>to.value){el('cheque-date-error').textContent='Escolha o tipo de data e um período válido. A data final deve ser igual ou posterior à inicial.';return;}
    chequePeriod={type,from:from.value,to:to.value};updatePeriod();periodDialog.close();
  };
  window.chequeDateFilter={clear};
})();
