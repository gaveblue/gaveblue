(() => {
  'use strict';
  const dialog=document.createElement('dialog');dialog.id='withdrawal-dialog';dialog.className='form-dialog withdrawal-dialog';dialog.setAttribute('aria-labelledby','withdrawal-title');
  dialog.innerHTML='<form id="withdrawal-form"><div class="withdrawal-heading"><div><span class="section-kicker">Controle de cheques</span><h2 id="withdrawal-title">Registrar saque</h2></div><button type="button" id="withdrawal-close" class="secondary" aria-label="Fechar registro de saque">✕</button></div><p id="withdrawal-description"></p><label>Data de saque<input type="date" id="withdrawal-date" required></label><p id="withdrawal-error" role="alert"></p><div class="withdrawal-actions"><button type="button" id="withdrawal-remove" class="danger" hidden>Remover saque</button><button type="button" id="withdrawal-cancel" class="secondary">Cancelar</button><button type="submit" id="withdrawal-save">Salvar saque</button></div></form>';
  document.body.append(dialog);
  const el=id=>document.getElementById(id),input=el('withdrawal-date'),error=el('withdrawal-error');let selected=null,saving=false,trigger=null;
  function validDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
  function open(record){
    if(saving)return;selected=record;trigger=document.activeElement;input.max=today();input.value=record.data.dataSaque||today();input.setCustomValidity('');error.textContent='';
    el('withdrawal-title').textContent=record.data.dataSaque?'Editar saque':'Registrar saque';el('withdrawal-description').textContent='Cheque '+record.data.cheque+' · '+record.data.nome+' · '+money(record.data.valor);
    el('withdrawal-remove').hidden=!record.data.dataSaque;dialog.showModal();input.focus();
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
    saving=true;error.textContent='';dialog.querySelectorAll('button,input').forEach(control=>control.disabled=true);
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
    }catch(e){error.textContent=e.message;}
    finally{saving=false;dialog.querySelectorAll('button,input').forEach(control=>control.disabled=false);}
  }
  el('withdrawal-form').onsubmit=event=>{event.preventDefault();save();};el('withdrawal-remove').onclick=()=>save(true);
  window.chequeWithdrawal={open,validDate};
})();
