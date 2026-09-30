(() => {
  'use strict';
  const KEY='receipt-finance',el=id=>document.getElementById(id),empty=()=>({version:1,accounts:[],entries:[]});
  let state=empty(),tab='movements',accountId='',working=false;
  const cents=value=>Math.round(Number(value)*100),cash=value=>money(value/100),dateValid=value=>window.chequeWithdrawal.validDate(value);
  const settled=(ledger,id)=>ledger.entries.find(entry=>entry.kind==='debit'&&entry.receiptId===id&&!ledger.entries.some(other=>other.reversalOf===entry.id));
  function assertEditable(ledger,id){if(settled(ledger||empty(),id))throw new Error('Este recibo tem uma baixa no Financeiro. Estorne a baixa antes de alterar o recibo.');}
  const root=document.createElement('section');root.id='finance';root.hidden=true;
  root.innerHTML=`<div class="section-heading"><div><span class="section-kicker">Contas e pagamentos</span><h1>Financeiro</h1><p>Controle as baixas dos recibos e acompanhe o saldo de cada conta.</p></div><button type="button" id="finance-new-account" class="secondary">＋ Nova conta</button></div>
    <div class="finance-tabs" aria-label="Seções do financeiro"><button type="button" data-finance-tab="statement">Extrato bancário</button><button type="button" data-finance-tab="movements">Movimentações</button></div>
    <p id="finance-message" role="status"></p>
    <section id="finance-statement" hidden><div class="filters finance-filters"><label>Conta bancária<select id="finance-account"></select></label><label>Movimentação — de<input id="finance-from" type="date"></label><label>Até<input id="finance-to" type="date"></label><button type="button" id="finance-credit">＋ Crédito</button></div><p id="finance-period-error" role="alert" hidden></p><div id="finance-account-empty" class="panel" hidden><h2>Cadastre a primeira conta</h2><p>Informe a conta que receberá as baixas e o saldo inicial. Depois, selecione um recibo em Movimentações para baixar o pagamento.</p><button type="button" id="finance-first-account">Cadastrar conta</button></div><div id="finance-statement-content"><div class="finance-summary"><article><span>Saldo anterior ao período</span><strong id="finance-opening"></strong></article><article><span>Créditos no período</span><strong id="finance-credits"></strong></article><article><span>Débitos no período</span><strong id="finance-debits"></strong></article><article><span>Saldo ao fim do período</span><strong id="finance-closing"></strong></article></div><div class="table-wrap"><table class="finance-statement-table"><thead><tr><th>Data da movimentação</th><th>Recibo</th><th>Descrição / recebedor</th><th>Crédito</th><th>Débito</th><th>Saldo acumulado</th></tr></thead><tbody id="finance-statement-rows"></tbody></table></div></div></section>
    <section id="finance-movements"><div class="filters"><label>Buscar recibo<input id="finance-search" type="search" placeholder="Número, recebedor ou cheque"></label><label>Situação<select id="finance-filter"><option value="">Todos os recibos</option><option value="pending">Pendentes</option><option value="settled">Baixados</option></select></label></div><p id="finance-pending-summary"></p><div class="table-wrap"><table class="finance-movements-table"><thead><tr><th>Emissão</th><th>Recibo</th><th>Recebedor</th><th>Pagamento / cheque</th><th>Valor</th><th>Situação</th><th>Conta da baixa</th><th>Data da baixa</th><th>Ações</th></tr></thead><tbody id="finance-movement-rows"></tbody></table></div></section>`;
  el('status').before(root);
  const nav=document.createElement('button');nav.id='nav-finance';nav.className='nav-btn';nav.type='button';nav.title='Financeiro';nav.setAttribute('aria-controls','finance-subnav');nav.setAttribute('aria-expanded','false');nav.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h18v14H3V7Zm0 0V4l14-2v5M21 11h-6v6h6M17 14h1"/></svg><span class="nav-label">Financeiro</span>';
  el('nav-cheques').after(nav);
  const subnav=document.createElement('div');subnav.id='finance-subnav';subnav.className='finance-subnav';subnav.hidden=true;subnav.innerHTML='<button type="button" data-finance-tab="statement" title="Extrato bancário">Extrato bancário</button><button type="button" data-finance-tab="movements" title="Movimentações">Movimentações</button>';nav.after(subnav);
  const month=today().slice(0,7)+'-01';el('finance-from').value=month;el('finance-to').value=today();
  function message(text,error=false){el('finance-message').textContent=text;el('finance-message').classList.toggle('error',error);}
  function sectionChanged(section){root.hidden=section!=='finance';subnav.hidden=section!=='finance';nav.setAttribute('aria-expanded',String(section==='finance'));}
  async function show(next='movements'){
    tab=next;setActiveSection('finance','Financeiro');statusMessage('');message('');
    el('finance-statement').hidden=tab!=='statement';el('finance-movements').hidden=tab!=='movements';
    document.querySelectorAll('[data-finance-tab]').forEach(button=>{button.classList.toggle('active',button.dataset.financeTab===tab);if(button.dataset.financeTab===tab)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
    try{await refresh();}catch(error){message(error.message,true);}
  }
  nav.onclick=()=>show();document.querySelectorAll('[data-finance-tab]').forEach(button=>button.onclick=()=>show(button.dataset.financeTab));
  async function reload(){state=(await transaction('readonly',s=>s.get(KEY),'config'))?.value||empty();render();}
  function accountOptions(select,selected=accountId){select.replaceChildren(new Option(state.accounts.length?'Selecione a conta':'Nenhuma conta cadastrada',''));for(const account of state.accounts)select.add(new Option(account.name+(account.number?' · '+account.number:''),account.id));select.value=selected;}
  function receiptLink(cell,id,number){const button=document.createElement('button');button.type='button';button.className='grid-link';button.textContent='Nº '+(number||'—');button.title='Ir para o lançamento em Recibos';button.onclick=()=>goToReceipt(id);cell.append(button);}
  async function goToReceipt(id){
    await refresh();const record=records.find(r=>r.id===id);if(!record){message('O recibo vinculado não está disponível neste histórico.',true);return;}
    showView(true);el('search').value=record.data.numero||record.data.nome;el('filter').value='';selectedReceipts.clear();selectedReceipts.add(id);renderHistory();document.querySelector('#records tr.selected')?.scrollIntoView({block:'center'});
  }
  function render(){
    if(!state.accounts.some(a=>a.id===accountId))accountId=state.accounts[0]?.id||'';
    accountOptions(el('finance-account'));renderStatement();renderMovements();
  }
  function signed(entry){return entry.kind==='debit'?-entry.cents:entry.cents;}
  function renderStatement(){
    const account=state.accounts.find(a=>a.id===accountId),from=el('finance-from').value,to=el('finance-to').value,invalid=Boolean(from&&to&&from>to);
    el('finance-account-empty').hidden=Boolean(account);el('finance-statement-content').hidden=!account;el('finance-credit').disabled=!account;
    el('finance-period-error').hidden=!invalid;el('finance-period-error').textContent=invalid?'A data final deve ser igual ou posterior à inicial.':'';
    const body=el('finance-statement-rows');body.replaceChildren();
    if(!account)return;
    const entries=[{id:'opening-'+account.id,kind:'opening',date:account.openingDate,cents:account.openingCents,description:'Saldo inicial da conta',createdAt:''},...state.entries.filter(e=>e.accountId===account.id)].sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt.localeCompare(b.createdAt));
    let balance=entries.filter(e=>from&&e.date<from).reduce((sum,e)=>sum+signed(e),0),credits=0,debits=0;
    el('finance-opening').textContent=invalid?'—':cash(balance);
    const visible=invalid?[]:entries.filter(e=>(!from||e.date>=from)&&(!to||e.date<=to));
    for(const entry of visible){
      const amount=signed(entry);balance+=amount;if(amount>=0)credits+=amount;else debits-=amount;
      const row=body.insertRow();row.insertCell().textContent=dateBR(entry.date);const link=row.insertCell();if(entry.receiptId)receiptLink(link,entry.receiptId,entry.receiptNumber);else link.textContent='—';
      row.insertCell().textContent=entry.kind==='debit'?entry.receiver:entry.kind==='reversal'?'Estorno · '+entry.receiver:entry.description;
      row.insertCell().textContent=amount>0?cash(amount):'—';row.cells[3].className='finance-positive';row.insertCell().textContent=amount<0?cash(-amount):'—';row.cells[4].className='finance-negative';row.insertCell().textContent=cash(balance);row.cells[5].className=balance<0?'finance-negative':'finance-balance';
    }
    if(!visible.length){const cell=body.insertRow().insertCell();cell.colSpan=6;cell.className='empty';cell.textContent=invalid?'Corrija o período.':'Nenhuma movimentação neste período.';}
    el('finance-credits').textContent=invalid?'—':cash(credits);el('finance-debits').textContent=invalid?'—':cash(debits);el('finance-closing').textContent=invalid?'—':cash(balance);el('finance-closing').classList.toggle('finance-negative',balance<0);
  }
  function renderMovements(){
    const query=el('finance-search').value.trim().toLocaleLowerCase('pt-BR'),filter=el('finance-filter').value,body=el('finance-movement-rows');body.replaceChildren();
    const pending=records.filter(r=>!settled(state,r.id));el('finance-pending-summary').textContent=pending.length+' recibo(s) pendente(s) · '+cash(pending.reduce((sum,r)=>sum+cents(r.data.valor),0));
    const items=records.filter(r=>{const paid=settled(state,r.id);return (!filter||(filter==='settled'?Boolean(paid):!paid))&&[r.data.numero,r.data.nome,r.data.cheque].join(' ').toLocaleLowerCase('pt-BR').includes(query);});
    for(const record of items){
      const d=record.data,entry=settled(state,record.id),account=state.accounts.find(a=>a.id===entry?.accountId),row=body.insertRow();
      row.insertCell().textContent=dateBR(d.dataEmissao);receiptLink(row.insertCell(),record.id,d.numero);row.insertCell().textContent=d.nome;row.insertCell().textContent=paymentName(d.formaPagamento||'cheque')+((d.formaPagamento||'cheque')==='cheque'?' · '+d.cheque:'');row.insertCell().textContent=money(d.valor);
      const status=row.insertCell();status.textContent=entry?'Baixado':'Pendente';status.className=entry?'finance-positive':'finance-pending';row.insertCell().textContent=account?.name||'—';row.insertCell().textContent=entry?dateBR(entry.date):'—';
      const button=document.createElement('button');button.type='button';button.className=entry?'secondary':'finance-settle';button.textContent=entry?'Estornar':'Baixar';button.setAttribute('aria-label',(entry?'Estornar':'Baixar')+' recibo '+d.numero);button.onclick=()=>openSettlement(record.id);row.insertCell().append(button);
    }
    if(!items.length){const cell=body.insertRow().insertCell();cell.colSpan=9;cell.className='empty';cell.textContent='Nenhum recibo encontrado.';}
  }
  el('finance-account').onchange=()=>{accountId=el('finance-account').value;renderStatement();};for(const id of ['finance-from','finance-to'])el(id).oninput=renderStatement;el('finance-search').oninput=renderMovements;el('finance-filter').onchange=renderMovements;
  // All financial writes share the receipt lock and an atomic IndexedDB transaction.
  async function mutate(change){
    return navigator.locks.request('covre-receipt-number',()=>new Promise((resolve,reject)=>{
      const tx=db.transaction(['config','recibos','empresas'],'readwrite'),config=tx.objectStore('config'),store=tx.objectStore('recibos');let ledger,all,failure,result;
      const a=config.get(KEY),b=store.getAll();
      const ready=()=>{if(ledger===undefined||all===undefined)return;try{result=change(ledger,all,{store,config,companies:tx.objectStore('empresas')});validate(ledger);config.put({id:KEY,value:ledger});}catch(error){failure=error;tx.abort();}};
      a.onsuccess=()=>{ledger=a.result?.value||empty();ready();};b.onsuccess=()=>{all=b.result;ready();};tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(failure||new Error('Não foi possível salvar no financeiro. Tente novamente.'));
    }));
  }
  const dialog=document.createElement('dialog');dialog.id='finance-dialog';dialog.className='form-dialog finance-dialog';dialog.setAttribute('aria-labelledby','finance-dialog-title');document.body.append(dialog);
  function openForm(title,body,submitLabel,submit){
    dialog.innerHTML='<form id="finance-form"><div class="withdrawal-heading"><h2 id="finance-dialog-title">'+title+'</h2><button type="button" data-close aria-label="Fechar formulário">✕</button></div>'+body+'<p id="finance-form-error" role="alert"></p><div class="withdrawal-actions"><button type="button" class="secondary" data-close>Cancelar</button><button type="submit">'+submitLabel+'</button></div></form>';
    dialog.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>{if(!working)dialog.close();});
    el('finance-form').onsubmit=async event=>{event.preventDefault();if(working)return;working=true;el('finance-form-error').textContent='';const values=Object.fromEntries(new FormData(event.currentTarget));dialog.querySelectorAll('button,input,select').forEach(c=>c.disabled=true);
      try{await submit(values);await refresh();dialog.close();message('Movimentação salva.');}catch(error){el('finance-form-error').textContent=error.message;}finally{working=false;dialog.querySelectorAll('button,input,select').forEach(c=>c.disabled=false);}
    };
    if(!dialog.open)dialog.showModal();
  }
  dialog.addEventListener('cancel',event=>{if(working)event.preventDefault();});
  const accountField=()=>'<label>Conta da movimentação<select name="accountId" id="finance-form-account" required></select></label>';
  const dateField=(label,value=today())=>'<label>'+label+'<input type="date" name="date" value="'+value+'" max="'+today()+'" required></label>';
  function checkedDate(date,account){if(!dateValid(date)||date>today())throw new Error('Informe uma data válida, até hoje.');if(date<account.openingDate)throw new Error('A data é anterior ao saldo inicial desta conta ('+dateBR(account.openingDate)+').');}
  function newAccount(){
    openForm('Cadastrar conta bancária','<div class="fields"><label class="wide">Nome da conta<input name="name" maxlength="80" placeholder="Ex.: Conta principal" required></label><label>Banco<input name="bank" maxlength="80" required></label><label>Agência<input name="agency" maxlength="30"></label><label>Conta<input name="number" maxlength="30" required></label><label>Saldo inicial (R$)<input type="number" name="opening" step="0.01" value="0" required></label>'+dateField('Data do saldo inicial')+'</div><p class="finance-help">O saldo é o valor disponível no início dessa data, antes das movimentações que serão registradas. Use um valor negativo se a conta estiver devedora.</p>','Salvar conta',async values=>{
      const opening=cents(values.opening);if(!Number.isSafeInteger(opening)||Math.abs(opening)>99999999999)throw new Error('Informe um saldo inicial válido.');if(!dateValid(values.date)||values.date>today())throw new Error('Informe uma data inicial válida.');if(!values.name.trim()||!values.bank.trim()||!values.number.trim())throw new Error('Preencha nome, banco e conta.');
      const account={id:crypto.randomUUID(),name:values.name.trim(),bank:values.bank.trim(),agency:values.agency.trim(),number:values.number.trim(),openingCents:opening,openingDate:values.date,createdAt:new Date().toISOString()};
      await mutate(ledger=>ledger.accounts.push(account));accountId=account.id;
    });
  }
  el('finance-new-account').onclick=el('finance-first-account').onclick=newAccount;
  el('finance-credit').onclick=()=>{
    openForm('Registrar crédito',accountField()+'<label>Descrição<input name="description" maxlength="160" required></label><label>Valor do crédito (R$)<input name="amount" type="number" min="0.01" step="0.01" required></label>'+dateField('Data da movimentação'),'Salvar crédito',async values=>{
      const amount=cents(values.amount);if(!Number.isSafeInteger(amount)||amount<=0||amount>99999999999||!values.description.trim())throw new Error('Informe descrição e valor válidos.');
      await mutate(ledger=>{const account=ledger.accounts.find(a=>a.id===values.accountId);if(!account)throw new Error('Selecione uma conta.');checkedDate(values.date,account);ledger.entries.push({id:crypto.randomUUID(),accountId:account.id,kind:'credit',date:values.date,cents:amount,description:values.description.trim(),createdAt:new Date().toISOString()});});
    });accountOptions(el('finance-form-account'));
  };
  async function openSettlement(id){
    if(working)return;await show('movements');const record=records.find(r=>r.id===id);if(!record){message('Recibo não encontrado.',true);return;}
    if(!state.accounts.length){message('Cadastre a conta bancária antes de baixar o recibo.');newAccount();return;}
    const existing=settled(state,id),d=record.data,summary='<p class="finance-receipt-summary">Recibo nº '+escapeHTML(d.numero||'—')+' · '+escapeHTML(d.nome)+'<strong>'+money(d.valor)+'</strong></p>';
    if(existing){
      openForm('Estornar baixa',summary+'<p>O estorno será registrado como crédito na mesma conta, e o recibo voltará a ficar pendente.</p>'+dateField('Data do estorno'),'Confirmar estorno',async values=>{
        await mutate((ledger,all,{store})=>{const entry=settled(ledger,id),current=all.find(r=>r.id===id);if(!entry||entry.id!==existing.id||!current)throw new Error('Esta baixa mudou. Feche e reabra a movimentação.');const account=ledger.accounts.find(a=>a.id===entry.accountId);checkedDate(values.date,account);if(values.date<entry.date)throw new Error('O estorno não pode ser anterior à baixa.');ledger.entries.push({id:crypto.randomUUID(),accountId:entry.accountId,kind:'reversal',reversalOf:entry.id,receiptId:id,receiptNumber:entry.receiptNumber,receiver:entry.receiver,cents:entry.cents,date:values.date,createdAt:new Date().toISOString()});const data={...current.data};delete data.dataSaque;store.put({...current,data,updatedAt:new Date().toISOString()});});
      });return;
    }
    openForm('Baixar recibo',summary+accountField()+dateField((d.formaPagamento||'cheque')==='cheque'?'Data do saque / movimentação':'Data da movimentação'),'Confirmar baixa',async values=>{
      await mutate((ledger,all,{store})=>{
        const current=all.find(r=>r.id===id),account=ledger.accounts.find(a=>a.id===values.accountId);
        if(!current||(current.updatedAt||current.createdAt)!==(record.updatedAt||record.createdAt))throw new Error('Este recibo mudou. Feche e reabra a movimentação.');if(settled(ledger,id))throw new Error('Este recibo já foi baixado.');if(!account)throw new Error('Selecione uma conta.');checkedDate(values.date,account);
        if(ledger.entries.some(e=>e.receiptId===id&&e.kind==='reversal'&&e.date>values.date))throw new Error('A nova baixa não pode ser anterior ao último estorno deste recibo.');
        const amount=cents(current.data.valor);if(!Number.isSafeInteger(amount)||amount<=0)throw new Error('Valor do recibo inválido.');
        ledger.entries.push({id:crypto.randomUUID(),accountId:account.id,kind:'debit',receiptId:id,receiptNumber:current.data.numero||'',receiver:current.data.nome,cents:amount,date:values.date,createdAt:new Date().toISOString()});
        const data={...current.data};if((data.formaPagamento||'cheque')==='cheque')data.dataSaque=values.date;store.put({...current,data,updatedAt:new Date().toISOString()});
      });accountId=values.accountId;
    });accountOptions(el('finance-form-account'));
  }
  function validate(value){
    if(!value||value.version!==1||!Array.isArray(value.accounts)||!Array.isArray(value.entries))throw new Error('Dados financeiros inválidos.');
    const ids=new Set(),accounts=new Map();for(const a of value.accounts){if(!a||typeof a.id!=='string'||!a.id||ids.has(a.id)||typeof a.name!=='string'||!a.name.trim()||typeof a.bank!=='string'||typeof a.number!=='string'||!dateValid(a.openingDate)||!Number.isSafeInteger(a.openingCents)||Math.abs(a.openingCents)>99999999999)throw new Error('Conta inválida no financeiro.');ids.add(a.id);accounts.set(a.id,a);}
    const entries=new Map(),reversed=new Set();for(const e of value.entries){if(!e||typeof e.id!=='string'||ids.has(e.id)||!accounts.has(e.accountId)||!['debit','credit','reversal'].includes(e.kind)||!dateValid(e.date)||e.date<accounts.get(e.accountId).openingDate||!Number.isSafeInteger(e.cents)||e.cents<=0||typeof e.createdAt!=='string')throw new Error('Movimentação financeira inválida.');if(e.kind!=='credit'&&(typeof e.receiptId!=='string'||!e.receiptId||typeof e.receiver!=='string'))throw new Error('Recibo vinculado inválido.');if(e.kind==='credit'&&typeof e.description!=='string')throw new Error('Descrição de crédito inválida.');ids.add(e.id);entries.set(e.id,e);}
    for(const e of value.entries.filter(e=>e.kind==='reversal')){const original=entries.get(e.reversalOf);if(!original||original.kind!=='debit'||original.accountId!==e.accountId||original.receiptId!==e.receiptId||original.cents!==e.cents||e.date<original.date||reversed.has(original.id))throw new Error('Estorno financeiro inválido.');reversed.add(original.id);}
    const active=new Set();for(const e of value.entries.filter(e=>e.kind==='debit'&&!reversed.has(e.id))){if(active.has(e.receiptId))throw new Error('O recibo possui mais de uma baixa ativa.');active.add(e.receiptId);}
    for(const account of value.accounts){let balance=account.openingCents;for(const entry of value.entries.filter(e=>e.accountId===account.id)){balance+=signed(entry);if(!Number.isSafeInteger(balance))throw new Error('O saldo ultrapassa o limite suportado.');}}
    return value;
  }
  async function exportData(ids){const ledger=(await transaction('readonly',s=>s.get(KEY),'config'))?.value||empty();return {...ledger,entries:ids?ledger.entries.filter(e=>!e.receiptId||ids.includes(e.receiptId)):ledger.entries};}
  async function restore({imported,companies:partners,sequence,finance}){
    if(finance)validate(finance);
    await mutate((ledger,all,{store,config,companies:partnerStore})=>{
      const known=new Map(all.map(r=>[r.id,r])),numbers=new Map(all.filter(r=>r.data.numero).map(r=>[String(BigInt(r.data.numero)),r.id]));
      for(const record of imported){if(known.has(record.id))continue;const number=record.data.numero&&String(BigInt(record.data.numero));if(number&&numbers.has(number)&&numbers.get(number)!==record.id)throw new Error('Número de recibo já utilizado. A importação foi cancelada.');if(number)numbers.set(number,record.id);known.set(record.id,record);store.add(record);}
      if(finance){for(const key of ['accounts','entries'])for(const item of finance[key]){const existing=ledger[key].find(e=>e.id===item.id);if(existing){if(JSON.stringify(existing)!==JSON.stringify(item))throw new Error('O backup financeiro conflita com dados existentes. Nada foi importado.');}else ledger[key].push(item);}validate(ledger);}
      for(const entry of ledger.entries.filter(e=>e.kind==='debit')){const record=known.get(entry.receiptId);if(!record)throw new Error('O backup financeiro referencia um recibo ausente.');const active=settled(ledger,record.id);if(active?.id===entry.id){if(cents(record.data.valor)!==entry.cents)throw new Error('O valor do recibo difere da baixa no backup.');if((record.data.formaPagamento||'cheque')==='cheque')store.put({...record,data:{...record.data,dataSaque:entry.date}});}}
      for(const partner of partners){const request=partnerStore.get(partner.id);request.onsuccess=()=>{if(!request.result)partnerStore.put(partner);};}
      const request=config.get('receipt-sequence');request.onsuccess=()=>{let max=BigInt(request.result?.value||'0');for(const number of numbers.keys())if(BigInt(number)>max)max=BigInt(number);if(sequence!==undefined&&BigInt(sequence)>max)max=BigInt(sequence);config.put({id:'receipt-sequence',value:String(max)});};
    });
  }
  async function deleteReceipts(ids){await mutate((ledger,all,{store})=>{if(ledger.entries.some(e=>ids.includes(e.receiptId)))throw new Error('Há recibos vinculados ao histórico financeiro. Eles devem ser mantidos para consulta.');for(const id of ids)store.delete(id);});}
  async function checkEditable(id){const ledger=await exportData();assertEditable(ledger,id);}
  window.receiptFinance={reload,show,sectionChanged,openSettlement,settlementFor:id=>settled(state,id),assertEditable,checkEditable,deleteReceipts,exportData,restore,validate};
  databaseReady.then(()=>reload()).then(()=>renderCheques()).catch(error=>message(error.message,true));
})();
