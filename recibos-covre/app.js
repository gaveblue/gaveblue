'use strict';
function extenso(value) {
  let text=numeroParaExtenso(value);
  if(value<1)text=text.replace(/^Zero reais e /,'');
  if(value>=1000000&&value%1000000===0)text=text.replace(/ reais$/,' de reais');
  return text;
}
const byId = id => document.getElementById(id);
const form = byId('receipt-form');
const LAST_STEP=form.querySelectorAll('.step').length-1;
const field = name => form.elements.namedItem(name);
const money = value => Number(value).toLocaleString('pt-BR', {style:'currency',currency:'BRL'});
function formatDocument(value){
  const d=String(value||'').replace(/\D/g,'').slice(0,14);
  return d.length<=11?d.replace(/^(\d{3})(\d)/,'$1.$2').replace(/^(\d{3}\.\d{3})(\d)/,'$1.$2').replace(/(\.\d{3})(\d{1,2})$/,'$1-$2'):
    d.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2}\.\d{3})(\d)/,'$1.$2').replace(/(\.\d{3})(\d)/,'$1/$2').replace(/(\/\d{4})(\d{1,2})$/,'$1-$2');
}
function validDocument(value){
  const d=String(value).replace(/\D/g,'');if(![11,14].includes(d.length)||/^(\d)\1+$/.test(d))return false;
  const digit=(body,weights)=>{const rest=[...body].reduce((sum,n,i)=>sum+Number(n)*weights[i],0)%11;return rest<2?0:11-rest;};
  if(d.length===11)return digit(d.slice(0,9),[10,9,8,7,6,5,4,3,2])===Number(d[9])&&digit(d.slice(0,10),[11,10,9,8,7,6,5,4,3,2])===Number(d[10]);
  return digit(d.slice(0,12),[5,4,3,2,9,8,7,6,5,4,3,2])===Number(d[12])&&digit(d.slice(0,13),[6,5,4,3,2,9,8,7,6,5,4,3,2])===Number(d[13]);
}
const documentInputs=()=>document.querySelectorAll('[name=documento],[name=pagadorDocumento],[name=companyDocument]');
documentInputs().forEach(input=>{input.inputMode='numeric';input.value=formatDocument(input.value);input.addEventListener('input',()=>input.value=formatDocument(input.value));input.addEventListener('blur',()=>{if(input.value)fieldError(input,inputError(input));});});
const receiptNumber=value=>String(value).padStart(4,'0');
const dateBR = value => value.split('-').reverse().join('/');
const hasReceiptAttachment=r=>Boolean(r.attachment||r.attachmentPDF||r.files?.attachment||r.files?.attachmentPDF);
const escapeHTML = value => { const el = document.createElement('span'); el.textContent = String(value ?? ''); return el.innerHTML; };
let step=0, db, records=[], companies=[], draft, attachment=null, current=null, previewURL, savedURL, busy=false;
let editingRecord=null, editingCompany=null, preservedAttachmentPDF=null;
let attachmentLoading=false,transitioning=false;
function clearFieldError(input){
  input.removeAttribute('aria-invalid');input.removeAttribute('aria-describedby');
  input.closest('label')?.querySelector('.field-error')?.remove();
}
function clearErrors(container){
  container.querySelectorAll('input,select').forEach(input=>{clearFieldError(input);delete input.dataset.uploadError;});
}
function fieldError(input,message){
  clearFieldError(input);if(!message)return;
  const error=document.createElement('span');error.className='field-error';error.id='error-'+(input.name||input.id);
  error.textContent=message;input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby',error.id);input.closest('label')?.append(error);
}
function numericValue(value){return Number(value.replace(/^R\$\s*/,'').replaceAll('.','').replace(',','.'));}
function inputError(input){
  if(input.disabled||input.type==='radio')return '';
  const value=input.value.trim(),name=input.name;
  if(input.dataset.uploadError)return input.dataset.uploadError;
  if(input.required&&!value)return 'Preencha este campo.';
  if(!input.validity.valid)return input.validity.typeMismatch?'Informe um valor válido.':'Revise o preenchimento deste campo.';
  if(!value)return '';
  if(input.maxLength>0&&value.length>input.maxLength)return 'Use até '+input.maxLength+' caracteres.';
  if(['documento','pagadorDocumento','companyDocument'].includes(name)&&(!/^[\d./\s-]+$/.test(value)||![11,14].includes(value.replace(/\D/g,'').length)))return 'Informe CPF com 11 dígitos ou CNPJ com 14 dígitos.';
  if(['documento','pagadorDocumento','companyDocument'].includes(name)&&!validDocument(value))return 'CPF/CNPJ inválido. Confira os dígitos informados.';
  if(['nota','cheque'].includes(name)&&!/^\d+$/.test(value))return 'Use somente números.';
  if(name==='valor'&&(!/^R\$\s*\d{1,3}(\.\d{3})*,\d{2}$/.test(value)||numericValue(value)<=0||numericValue(value)>999999999.99))return 'Informe um valor entre R$ 0,01 e R$ 999.999.999,99.';
  if(input.type==='date'&&!/^\d{4}-\d{2}-\d{2}$/.test(value))return 'Informe uma data válida.';
  if(name==='pixChave'){
    const type=field('pixTipo').value,digits=value.replace(/\D/g,'');
    if(['cpf','cnpj'].includes(type)&&(!validDocument(value)||digits.length!==(type==='cpf'?11:14)))return 'Informe uma chave '+type.toUpperCase()+' válida.';
    if(type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))return 'Informe um e-mail válido.';
    if(type==='telefone'&&!/^\+?55\d{10,11}$/.test(value.replace(/[\s()-]/g,'')))return 'Informe o telefone com +55, DDD e número.';
    if(type==='aleatoria'&&!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value))return 'Informe a chave aleatória no formato UUID.';
  }
  if(input.form===form){
    const prefixes={nome:'Nome: ',documento:'CPF/CNPJ: ',servico:field('tipo').value==='covre'?'Tipo de entrega: ':'Tipo de serviço: ',nota:'Nº Nota Fiscal: ',destino:'Destino: ',emitente:'Emitente: ',banco:'Banco: ',agencia:'Agência: ',conta:'Conta: ',cheque:'Nº Cheque: '};
    const ctx=document.createElement('canvas').getContext('2d');ctx.font=(['nome','cheque','valor'].includes(name)?'bold ':'')+'9.48px Arial';
    let line=name in prefixes?prefixes[name]+value:'';
    const paymentPrefixes={depositoTitular:'Titular: ',depositoBanco:'Banco: ',depositoAgencia:'Agência: ',depositoConta:'Conta: ',pixChave:'Chave: '};
    if(name in paymentPrefixes)line=paymentPrefixes[name]+value;
    if(name==='local'&&field('dataEmissao').value){
      const date=new Date(field('dataEmissao').value+'T12:00:00');
      if(!Number.isNaN(date.getTime()))line=value+', '+date.toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'});
    }
    if(line&&ctx.measureText(line).width>480)return 'O texto excede a largura do recibo. Abrevie o preenchimento.';
    if(name==='pagadorNome'){
      const suffix=', inscrito(a) no CNPJ sob nº '+field('pagadorDocumento').value+(field('pagadorIE').value?' e I.E. nº '+field('pagadorIE').value:'')+'.';
      ctx.font='bold 9.48px Arial';const width=ctx.measureText(value).width;ctx.font='9.48px Arial';
      if(width+ctx.measureText(suffix).width>481)return 'Nome e documentos excedem a largura do recibo. Abrevie o nome.';
    }
    if(name==='pagadorEndereco'&&ctx.measureText('Endereço: '+value+', '+field('pagadorCidade').value+' - CEP '+field('pagadorCEP').value+'.').width>480)return 'Endereço e cidade excedem a largura do recibo. Abrevie o endereço.';
  }
  return '';
}
function validateFields(container){
  let first;
  container.querySelectorAll('input,select').forEach(clearFieldError);
  container.querySelectorAll('input,select').forEach(input=>{const message=inputError(input);if(!message)return;const target=input.dataset.partnerDetail?field(input.name.startsWith('pagador')?'pagadorNome':'nome'):input;fieldError(target,input.dataset.partnerDetail?'Revise os dados complementares no cadastro do parceiro: '+message:message);if(!first)first=target;});
  if(first){first.focus();first.scrollIntoView({block:'center',behavior:'smooth'});return false;}
  return true;
}
field('valor').addEventListener('input',event=>{
  const digits=event.target.value.replace(/\D/g,'');event.target.value=digits?money(Number(digits)/100):'';
});
for(const container of [form,byId('company-form')]){
  container.addEventListener('input',event=>{if(event.target.matches('input,select')&&event.target.hasAttribute('aria-invalid'))fieldError(event.target,inputError(event.target));});
}
const statusMessage = (message,error=false) => {
  for(const id of ['status','receipt-status','company-status']){byId(id).textContent=message;byId(id).classList.toggle('error',error);}
};
const today = () => {const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
['dataEmissao','dataServico','dataCheque'].forEach(n=>field(n).value=today());
const modelName = tipo=>tipo==='covre'?'Frete':'Carga / descarga';
const paymentName=method=>({cheque:'Cheque',deposito:'Depósito bancário',pix:'PIX',dinheiro:'Dinheiro'}[method||'cheque']||'Cheque');
function updatePayment(){
  const method=field('formaPagamento').value;
  for(const key of ['cheque','deposito','pix','dinheiro']){
    const panel=byId('payment-'+key);panel.hidden=key!==method;
    panel.querySelectorAll('input,select').forEach(input=>{input.disabled=key!==method;if(input.disabled)clearFieldError(input);});
  }
}
document.querySelectorAll('[name=formaPagamento]').forEach(input=>input.onchange=updatePayment);
field('pixTipo').onchange=()=>{field('pixChave').value='';clearFieldError(field('pixChave'));};
field('pixChave').addEventListener('input',()=>{if(['cpf','cnpj'].includes(field('pixTipo').value))field('pixChave').value=formatDocument(field('pixChave').value);});
function showView(history){
  setActiveSection('history','Recibos');
  if(history)byId('receipt-dialog').close();
  else {
    byId('receipt-dialog-title').textContent=editingRecord?'Alterar recibo':'Novo recibo';
    if(!byId('receipt-dialog').open)byId('receipt-dialog').showModal();
  }
}
function setActiveSection(section,title){
  window.receiptFinance?.sectionChanged(section);
  if(byId('layout-settings'))byId('layout-settings').hidden=section!=='settings';
  byId('editor').hidden=false;byId('history').hidden=section!=='history';
  byId('home').hidden=section!=='home';
  byId('companies').hidden=section!=='companies';byId('cheques').hidden=section!=='cheques';byId('backup-screen').hidden=section!=='backup';
  const activeId=section==='history'?'nav-new':section==='home'?'nav-home':'nav-'+section;
  document.querySelectorAll('.nav-btn').forEach(button=>button.classList.toggle('active',button.id===activeId));
  byId('page-title').textContent=title;syncNavigation();
}
function syncNavigation(){
  document.querySelectorAll('.nav-btn').forEach(button=>{
    if(button.classList.contains('active'))button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  });
  if(innerWidth<=800)setCollapsed(true);
}
function setCollapsed(collapsed){
  byId('app-layout').classList.toggle('sidebar-collapsed',collapsed);
  byId('sidebar-toggle').setAttribute('aria-expanded',String(!collapsed));
  byId('sidebar-toggle').setAttribute('aria-label',collapsed?'Expandir menu':'Recolher menu');
}
byId('sidebar-toggle').onclick=()=>setCollapsed(!byId('app-layout').classList.contains('sidebar-collapsed'));
setCollapsed(innerWidth<=800);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&innerWidth<=800)setCollapsed(true);});
byId('nav-home').onclick=()=>{refresh().then(()=>setActiveSection('home','Início')).catch(error=>statusMessage(error.message,true));};
byId('home-new').onclick=()=>newReceipt();
byId('home-partners').onclick=()=>byId('nav-companies').click();
byId('home-cheques').onclick=()=>byId('nav-cheques').click();
byId('nav-backup').onclick=()=>{
  setActiveSection('backup','Backup');
};
byId('nav-settings').onclick=()=>{setActiveSection('settings','Configurações');window.receiptLayout?.open();};
byId('nav-companies').onclick=()=>{refresh().then(()=>setActiveSection('companies','Parceiros')).catch(error=>statusMessage(error.message,true));};
byId('nav-cheques').onclick=()=>{refresh().then(()=>setActiveSection('cheques','Cheques emitidos')).catch(error=>statusMessage(error.message,true));};
byId('restore-label').onkeydown=event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();byId('restore').click();}};
function showStep(n){
  step=n;document.querySelectorAll('.step').forEach(el=>el.hidden=Number(el.dataset.step)!==n);
  document.querySelectorAll('.steps li').forEach((el,i)=>{const warning=i===LAST_STEP-1&&i<n&&!attachment&&!preservedAttachmentPDF;el.classList.toggle('active',i===n);el.classList.toggle('completed',i<n&&!warning);el.classList.toggle('warning',warning);el.querySelector('.step-dot').textContent=warning?'!':i<n?'✓':'';el.setAttribute('aria-label','Etapa '+(i+1)+': '+el.dataset.title+(warning?' — comprovante não inserido':i<n?' — concluída':i===n?' — atual':''));});
  byId('previous').hidden=n===0;byId('next').hidden=n===LAST_STEP;byId('issue').hidden=n!==LAST_STEP;
  byId('next').textContent=n===LAST_STEP-1?'Conferir recibo →':'Continuar →';
  byId('skip-attachment').hidden=n!==LAST_STEP-1||Boolean(attachment||preservedAttachmentPDF);
  form.querySelector('.step[data-step="'+n+'"]').scrollTop=0;
  byId('receipt-dialog').scrollTop=0;statusMessage('');
  document.querySelectorAll('.steps li').forEach((el,i)=>{if(i===n)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
}
function validStep(){return validateFields(form.querySelector('.step[data-step="'+step+'"]'));}
function readData(){
  documentInputs().forEach(input=>input.value=formatDocument(input.value));
  const d=Object.fromEntries(new FormData(form));
  for(const key in d)d[key]=String(d[key]).trim();
  d.valor=d.valor.replace(/^R\$\s*/, '');
  d.statusCheque=editingRecord?.data.statusCheque||'emitido';
  if(d.formaPagamento==='cheque'&&editingRecord?.data.dataSaque)d.dataSaque=editingRecord.data.dataSaque;
  if(!validDocument(d.documento))throw new Error('Informe um CPF com 11 dígitos ou CNPJ com 14 dígitos.');
  if(!validDocument(d.pagadorDocumento))throw new Error('Informe o CPF/CNPJ do pagador com 11 ou 14 dígitos.');
  const paymentRequired={cheque:['emitente','banco','agencia','conta','cheque'],deposito:['depositoTitular','depositoBanco','depositoAgencia','depositoConta'],pix:['pixTipo','pixChave'],dinheiro:[]};
  if(['nome','local','servico','nota',...(paymentRequired[d.formaPagamento]||[])].some(k=>!d[k]))throw new Error('Preencha todos os campos obrigatórios.');
  if(!/^\d{1,3}(\.\d{3})*,\d{2}$|^\d+(,\d{1,2})?$/.test(d.valor))throw new Error('Informe o valor em reais, por exemplo 1.250,00.');
  d.valor=Number(d.valor.replaceAll('.','').replace(',','.'));
  if(d.valor<=0||d.valor>999999999.99)throw new Error('Informe um valor entre R$ 0,01 e R$ 999.999.999,99.');
  return d;
}
const selectedReceipts=new Set(),selectedPartners=new Set();
const gridSort={receipts:{key:'',direction:1},partners:{key:'',direction:1}};
function sortItems(items,grid){
  const {key,direction}=gridSort[grid];
  if(!key)return items;
  return items.sort((a,b)=>{const left=(grid==='receipts'?a.data:a)[key]??'',right=(grid==='receipts'?b.data:b)[key]??'';return direction*(typeof left==='number'?left-right:String(left).localeCompare(String(right),'pt-BR',{numeric:true}));});
}
function configureGrid(section,prefix,keys,render){
  const headers=byId(section).querySelectorAll('th');
  keys.forEach((key,index)=>{
    if(!key)return;const th=headers[index],label=th.textContent,button=document.createElement('button');button.type='button';button.className='sort-heading';button.textContent=label+' ↕';th.replaceChildren(button);
    button.onclick=()=>{const state=gridSort[prefix];state.direction=state.key===key?-state.direction:1;state.key=key;headers.forEach(header=>header.removeAttribute('aria-sort'));th.setAttribute('aria-sort',state.direction===1?'ascending':'descending');render();};
  });
  const filters=byId(section).querySelector('.filters'),clear=document.createElement('button');clear.type='button';clear.className='filter-clear';clear.textContent='Limpar';clear.title='Limpar filtros';clear.onclick=()=>{filters.querySelectorAll('input,select').forEach(input=>input.value='');render();};filters.append(clear);
}
configureGrid('history','receipts',['','dataEmissao','numero','nome','tipo','valor','',''],renderHistory);
configureGrid('companies','partners',['','name','role','document','address','city'],renderCompanies);
const actionPaths={add:'M12 5v14M5 12h14',edit:'M16.5 4.5l3 3L9 18l-4 1 1-4 10.5-10.5z',danger:'M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12'};
document.querySelectorAll('.icon-action').forEach(button=>{
  const type=Object.keys(actionPaths).find(key=>button.classList.contains(key));
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(actionPaths[type]||'M14 3H6v18h13V8zM14 3v5h5M9 13h7M9 17h7')+'"/></svg>';
});
function selectionCell(row,id,selected,update,label){
  const input=document.createElement('input');input.type='checkbox';input.checked=selected.has(id);
  input.setAttribute('aria-label','Selecionar '+label);
  input.onchange=()=>{input.checked?selected.add(id):selected.delete(id);row.classList.toggle('selected',input.checked);update();};
  row.classList.toggle('selected',input.checked);row.insertCell().append(input);
}
function updateToolbar(prefix,selected,items){
  const ids=new Set(items.map(item=>item.id));for(const id of selected)if(!ids.has(id))selected.delete(id);
  byId(prefix+'-selected').textContent=selected.size+' selecionado'+(selected.size===1?'':'s');
  byId(prefix+'-edit').disabled=selected.size!==1;byId(prefix+'-delete').disabled=!selected.size;
  if(byId(prefix+'-pdf'))byId(prefix+'-pdf').disabled=selected.size!==1;
  byId(prefix+'-all').checked=items.length>0&&selected.size===items.length;
  byId(prefix+'-all').indeterminate=selected.size>0&&selected.size<items.length;
}
function receiptItems(){
  const q=byId('search').value.toLocaleLowerCase('pt-BR');
  return sortItems(records.filter(r=>(!byId('filter').value||r.data.tipo===byId('filter').value)&&[r.data.numero,r.data.nome,r.data.documento,r.data.nota,r.data.cheque].join(' ').toLocaleLowerCase('pt-BR').includes(q)),'receipts');
}
function renderHistory() {
  const items=receiptItems(),update=()=>updateToolbar('receipts',selectedReceipts,items);update();
  byId('records').replaceChildren();
  if(!items.length){const cell=byId('records').insertRow().insertCell();cell.colSpan=8;cell.className='empty';cell.textContent='Nenhum recibo encontrado. Use + para incluir um recibo.';}
  for(const r of items){
    const row=byId('records').insertRow(),d=r.data;
    selectionCell(row,r.id,selectedReceipts,update,d.nome);
    [dateBR(d.dataEmissao),d.numero||'—',d.nome,modelName(d.tipo)+' · NF '+d.nota,money(d.valor)].forEach(t=>row.insertCell().textContent=t);
    const attachmentCell=row.insertCell(),hasAttachment=hasReceiptAttachment(r);attachmentCell.textContent=hasAttachment?'SIM':'NÃO';attachmentCell.className=hasAttachment?'attachment-yes':'attachment-no';
    const button=document.createElement('button');button.type='button';button.className='grid-link';button.textContent='Abrir PDF';button.onclick=()=>openSaved(r);row.insertCell().append(button);
    row.ondblclick=event=>{if(!event.target.closest('button,input'))editRecord(r);};
  }
}

const roleLabel=role=>({pagador:'Pagadora',recebedor:'Recebedora',ambos:'Pagadora e recebedora'}[role]||'Recebedora');
function partnerItems(){
  const query=byId('company-search').value.toLocaleLowerCase('pt-BR'),role=byId('company-filter').value;
  return sortItems(companies.filter(c=>(!role||c.role===role)&&[c.name,c.document,c.city,c.address].join(' ').toLocaleLowerCase('pt-BR').includes(query)),'partners');
}
function renderCompanies(){
  const list=byId('company-list'),items=partnerItems(),update=()=>updateToolbar('partners',selectedPartners,items);update();
  list.replaceChildren();byId('company-list-count').textContent=items.length+' parceiro(s)';
  if(!items.length){const cell=list.insertRow().insertCell();cell.colSpan=6;cell.className='empty';cell.textContent='Nenhum parceiro encontrado. Use + para cadastrar.';return;}
  for(const company of items){
    const row=list.insertRow();selectionCell(row,company.id,selectedPartners,update,company.name);
    [company.name,roleLabel(company.role),company.document,company.address||'—',company.city||'—'].forEach(value=>row.insertCell().textContent=value);
    row.ondblclick=event=>{if(!event.target.closest('input'))editCompany(company);};
  }
}

let chequePeriod=null;
function renderCheques(){
  const query=(byId('cheque-search')?.value||'').toLocaleLowerCase('pt-BR'),filter=byId('cheque-filter')?.value||'';
  const withdrawalDate=record=>window.receiptFinance?.withdrawalDateFor(record)??record.data.dataSaque;
  const items=records.filter(record=>{const d=record.data;if((d.formaPagamento||'cheque')!=='cheque')return false;const withdrawn=Boolean(withdrawalDate(record)),has=hasReceiptAttachment(record),date=chequePeriod?.type==='saque'?withdrawalDate(record):(d.dataCheque||d.dataEmissao);return (!chequePeriod||(date&&date>=chequePeriod.from&&date<=chequePeriod.to))&&(!filter||(filter==='sacado'&&withdrawn)||(filter==='pendente'&&!withdrawn)||(filter==='sem-anexo'&&!has))&&[d.cheque,d.nome,d.nota].join(' ').toLocaleLowerCase('pt-BR').includes(query);});
  const body=byId('cheque-records');body.replaceChildren();
  if(!items.length){const cell=body.insertRow().insertCell();cell.colSpan=8;cell.className='empty';cell.textContent='Nenhum cheque encontrado.';return;}
  for(const record of items){
    const d={...record.data,dataSaque:withdrawalDate(record)},has=hasReceiptAttachment(record);const row=body.insertRow();
    [d.cheque,dateBR(d.dataCheque||d.dataEmissao),d.nome,money(d.valor)].forEach(value=>row.insertCell().textContent=value);
    const flag=document.createElement('button');flag.type='button';flag.className='cheque-withdrawal';flag.setAttribute('role','switch');flag.setAttribute('aria-checked',String(Boolean(d.dataSaque)));flag.setAttribute('aria-label','Saque do cheque '+d.cheque);flag.title=d.dataSaque?'Marcar cheque '+d.cheque+' como não sacado':'Registrar saque do cheque '+d.cheque;flag.innerHTML='<span class="withdrawal-track" aria-hidden="true"></span><span>'+(d.dataSaque?'SACADO':'NÃO SACADO')+'</span>';flag.onclick=()=>window.chequeWithdrawal.toggle(record);row.insertCell().append(flag);
    const dateCell=row.insertCell();
    if(d.dataSaque){const dateButton=document.createElement('button');dateButton.type='button';dateButton.className='cheque-date-edit';dateButton.textContent=dateBR(d.dataSaque);dateButton.title='Editar data do saque';dateButton.setAttribute('aria-label','Editar data do saque do cheque '+d.cheque);dateButton.onclick=()=>window.chequeWithdrawal.open(record);dateCell.append(dateButton);}else dateCell.textContent='—';
    const annex=row.insertCell(),action=row.insertCell();
    if(has){const button=chequeIconButton('Visualizar anexo do cheque '+d.cheque,'eye');button.onclick=()=>openAttachment(record);annex.append(button);}else annex.textContent='Sem anexo';
    const button=chequeIconButton('Visualizar recibo do cheque '+d.cheque,'document');button.onclick=()=>openSaved(record);action.append(button);
  }
}
function chequeIconButton(label,icon){
  const button=document.createElement('button');button.type='button';button.className='icon-action cheque-view';button.title=label;button.setAttribute('aria-label',label);
  const path=icon==='eye'?'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>':'<path d="M14 2H5v20h14V7l-5-5Z"/><path d="M14 2v5h5M8 12h8M8 16h8"/>';
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+path+'</svg>';return button;
}
function openDatabase() {
  return new Promise((resolve,reject) => {
    const r=indexedDB.open('gaveblue-recibos-frete',3);
    r.onupgradeneeded=()=>{
      if(!r.result.objectStoreNames.contains('recibos'))r.result.createObjectStore('recibos',{keyPath:'id'});
      if(!r.result.objectStoreNames.contains('empresas'))r.result.createObjectStore('empresas',{keyPath:'id'});
      if(!r.result.objectStoreNames.contains('config'))r.result.createObjectStore('config',{keyPath:'id'});
    };
    r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result);};
    r.onerror=()=>reject(new Error('Não foi possível abrir o histórico.'));
    r.onblocked=()=>reject(new Error('Feche outras abas e tente novamente.'));
  });
}
function transaction(mode,action,storeName='recibos') {
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(storeName,mode);
    const r=action(tx.objectStore(storeName));
    tx.oncomplete=()=>resolve(r?.result);
    tx.onerror=tx.onabort=()=>reject(new Error('Falha ao acessar o histórico. Verifique o espaço disponível.'));
  });
}
async function refresh() {
  records=await transaction('readonly',s=>s.getAll());
  companies=await transaction('readonly',s=>s.getAll(),'empresas');
  records.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  companies.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  if(window.receiptFinance)await window.receiptFinance.reload();
  renderCompanies();renderCheques();renderDashboard();
  renderHistory();
}
function renderDashboard(){
  window.localProfile?.updateStorage();
  byId('home-receipts').textContent=records.length;byId('home-partners-count').textContent=companies.length;
  byId('home-attachments').textContent=records.filter(hasReceiptAttachment).length;
  byId('home-total').textContent=money(records.reduce((sum,r)=>sum+Number(r.data.valor||0),0));
  const list=byId('home-latest');list.replaceChildren();
  if(!records.length){list.textContent='Nenhum recibo emitido ainda.';return;}
  records.slice(0,5).forEach(r=>{const item=document.createElement('button');item.type='button';item.className='home-latest-item';item.innerHTML='<strong></strong><span></span><b></b>';item.querySelector('strong').textContent=(r.data.numero?'Nº '+r.data.numero+' · ':'')+r.data.nome;item.querySelector('span').textContent=modelName(r.data.tipo)+' · '+dateBR(r.data.dataEmissao);item.querySelector('b').textContent=money(r.data.valor);item.onclick=()=>openSaved(r);list.append(item);});
}
async function sequenceHighWater(){
  const saved=await transaction('readonly',s=>s.get('receipt-sequence'),'config');
  const all=await transaction('readonly',s=>s.getAll());
  return all.reduce((max,r)=>/^\d+$/.test(r.data?.numero||'')&&BigInt(r.data.numero)>max?BigInt(r.data.numero):max,BigInt(saved?.value||'0'));
}
async function nextReceiptNumber(){return receiptNumber((await sequenceHighWater())+1n);}
async function saveNumberedRecord(record){
  return navigator.locks.request('covre-receipt-number',async()=>{
    if(!editingRecord?.data.numero){record.data={...record.data,numero:await nextReceiptNumber()};record.pdf=await generatePDF(record.data);}
    const persisted=window.receiptFiles?await window.receiptFiles.prepare(record):record;
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(['recibos','config'],'readwrite'),store=tx.objectStore('recibos');let conflict=false,financeError='';
      const write=()=>{
        const config=tx.objectStore('config'),financial=config.get('receipt-finance');
        financial.onsuccess=()=>{
          try{window.receiptFinance?.assertEditable(financial.result?.value,record.id);}catch(error){financeError=error.message;tx.abort();return;}
          store.put(persisted);const request=config.get('receipt-sequence');request.onsuccess=()=>{const previous=BigInt(request.result?.value||'0'),number=BigInt(record.data.numero);config.put({id:'receipt-sequence',value:String(number>previous?number:previous)});};
        };
      };
      if(editingRecord){const request=store.get(record.id);request.onsuccess=()=>{const existing=request.result;if(!existing||(existing.updatedAt||existing.createdAt)!==(editingRecord.updatedAt||editingRecord.createdAt)){conflict=true;tx.abort();}else write();};}else write();
      tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(new Error(financeError||(conflict?'Este recibo foi alterado ou excluído em outra aba. Reabra-o antes de salvar.':'Não foi possível salvar o recibo. Nenhum número foi consumido.')));
    });
    return record;
  });
}
async function getFile(url){
  const name=url.split('/').pop(),model=window.RECEIPT_MODELS?.[name];
  if(!model)throw new Error('Os modelos do recibo não foram carregados. Reabra a página quando o servidor local estiver disponível.');
  return model.json?{json:async()=>structuredClone(model.json)}:{arrayBuffer:async()=>Uint8Array.from(atob(model.base64),char=>char.charCodeAt(0)).buffer};
}
async function openSaved(record) {
  try{if(window.receiptFiles)record=await window.receiptFiles.hydrate(record,{pdfOnly:true});}catch(error){statusMessage(error.message,true);return;}
  if(byId('draft-dialog').open)byId('draft-dialog').close();
  current=record;
  if(savedURL)URL.revokeObjectURL(savedURL);
  savedURL=URL.createObjectURL(record.pdf);
  byId('saved-preview').src=savedURL;
  byId('pdf-title').textContent=(record.data.numero?'Nº '+record.data.numero+' · ':'')+modelName(record.data.tipo)+' · '+record.data.nome;
  if(!byId('pdf-dialog').open)byId('pdf-dialog').showModal();
}
async function openAttachment(record){
  try{if(window.receiptFiles)record=await window.receiptFiles.hydrate(record);}catch(error){statusMessage(error.message,true);return;}
  const body=byId('attachment-body');body.replaceChildren();byId('attachment-title').textContent='Anexo do cheque '+record.data.cheque+' · '+record.data.nome;
  if(record.attachment){const image=document.createElement('img');image.alt='Comprovante anexado ao cheque '+record.data.cheque;image.src=URL.createObjectURL(new Blob([record.attachment.bytes],{type:record.attachment.type}));body.append(image);}
  else if(record.attachmentPDF){const frame=document.createElement('iframe');frame.title='PDF do anexo';frame.src=URL.createObjectURL(record.attachmentPDF);body.append(frame);}
  else {const empty=document.createElement('p');empty.textContent='Este cheque não possui anexo separado.';body.append(empty);}
  byId('attachment-dialog').showModal();
}
byId('close-attachment').onclick=()=>byId('attachment-dialog').close();
function downloadBlob(blob,name) {
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function openDraft(){
  if(!draft)return;
  byId('draft-title').textContent=(editingRecord?'Alteração • ':'Prévia • ')+modelName(draft.data.tipo);
  byId('draft-status').textContent='Confira o documento antes de salvar.';byId('draft-status').classList.remove('error');
  if(!byId('draft-dialog').open)byId('draft-dialog').showModal();
}
byId('open-draft').onclick=openDraft;
byId('close-draft').onclick=()=>byId('draft-dialog').close();
byId('draft-dialog').addEventListener('cancel',event=>{if(busy)event.preventDefault();});
byId('issue-preview').onclick=()=>form.requestSubmit();
const cancelEdit=document.createElement('button');
cancelEdit.type='button';cancelEdit.className='secondary';cancelEdit.textContent='Cancelar alteração';cancelEdit.hidden=true;
form.querySelector('.form-actions').prepend(cancelEdit);
cancelEdit.onclick=()=>closeReceipt();
async function editRecord(record){
  try{await window.receiptFinance?.checkEditable(record.id);}catch(error){statusMessage(error.message,true);return;}
  try{if(window.receiptFiles)record=await window.receiptFiles.hydrate(record);}catch(error){statusMessage(error.message,true);return;}
  if(editingRecord&&!confirm('Descartar as alterações atuais e abrir este recibo?'))return;
  resetForm();editingRecord=record;
  for(const [key,value] of Object.entries(record.data)){
    const input=field(key);if(input)input.value=key==='valor'?money(value):value;
  }
  documentInputs().forEach(input=>input.value=formatDocument(input.value));
  attachment=record.attachment?structuredClone(record.attachment):null;
  // Legacy records only have the final PDF; preserve its attachment region.
  preservedAttachmentPDF=record.attachmentPDF||(!Object.hasOwn(record,'attachment')?record.pdf:null);
  if(attachment||preservedAttachmentPDF){
    byId('attachment-name').textContent=attachment?.name||'Comprovante do recibo original preservado';
    byId('remove-attachment').hidden=false;
  }
  byId('editor').querySelector('h1').textContent='Alterar recibo';
  byId('issue').textContent=byId('issue-preview').textContent='Salvar alterações';
  cancelEdit.hidden=false;updateType();updatePayment();showStep(0);showView(false);
  statusMessage('Editando o recibo de '+record.data.nome+'. O original será substituído somente ao salvar.');
}
async function deleteRecord(record){
  if(!confirm('Excluir o recibo de '+record.data.nome+' — '+money(record.data.valor)+'? O PDF também será removido deste histórico.'))return;
  try{
    if(window.receiptFinance)await window.receiptFinance.deleteReceipts([record.id]);else await transaction('readwrite',store=>store.delete(record.id));
    if(editingRecord?.id===record.id)resetForm();
    await refresh();statusMessage('Recibo excluído do histórico. Arquivos existentes na pasta do PC foram mantidos.');
  }catch(error){statusMessage(error.message,true);}
}
function resetCompanyForm(){
  byId('company-form').reset();clearErrors(byId('company-form'));editingCompany=null;byId('company-form-title').textContent='Novo parceiro';byId('save-company').textContent='Salvar parceiro';byId('cancel-company').hidden=false;
}
function editCompany(company){
  editingCompany=company;const form=byId('company-form');
  for(const [key,value] of Object.entries({companyName:company.name,companyDocument:formatDocument(company.document),companyRole:company.role,companyAddress:company.address||'',companyCity:company.city||'',companyBank:company.bank||'',companyIE:company.ie||'',companyCEP:company.cep||'',companyAgency:company.agency||'',companyAccount:company.account||''})){const input=form.elements.namedItem(key);if(input)input.value=value;}
  byId('company-form-title').textContent='Alterar parceiro';byId('save-company').textContent='Salvar alterações';byId('cancel-company').hidden=false;statusMessage('');byId('company-dialog').showModal();
}
async function deleteCompany(company){
  if(!confirm('Excluir o cadastro de '+company.name+'? Recibos já emitidos não serão alterados.'))return;
  try{await transaction('readwrite',store=>store.delete(company.id),'empresas');await refresh();statusMessage('Parceiro excluído do cadastro.');}
  catch(error){statusMessage(error.message,true);}
}
byId('company-form').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;if(!validateFields(form))return;const data=Object.fromEntries(new FormData(form));
  data.name=String(data.companyName||'').trim();data.document=formatDocument(data.companyDocument);data.role=String(data.companyRole||'recebedor');data.address=String(data.companyAddress||'').trim();data.city=String(data.companyCity||'').trim();data.bank=String(data.companyBank||'').trim();
  if(!data.name||!data.document)return statusMessage('Informe nome e CPF/CNPJ da empresa.',true);
  const digits=data.document.replace(/\D/g,'');if(![11,14].includes(digits.length))return statusMessage('O CPF/CNPJ deve ter 11 ou 14 dígitos.',true);
  try{const company={id:editingCompany?.id||crypto.randomUUID(),createdAt:editingCompany?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),name:data.name,document:data.document,role:data.role,address:data.address,city:data.city,bank:data.bank,ie:String(data.companyIE||'').trim(),cep:String(data.companyCEP||'').trim(),agency:String(data.companyAgency||'').trim(),account:String(data.companyAccount||'').trim()};await transaction('readwrite',store=>store.put(company),'empresas');resetCompanyForm();byId('company-dialog').close();await refresh();setActiveSection('companies','Parceiros');statusMessage('Parceiro salvo no cadastro.');}
  catch(error){statusMessage(error.message,true);}
});
function closeCompany(){byId('company-dialog').close();resetCompanyForm();statusMessage('');}
byId('cancel-company').onclick=closeCompany;
byId('close-company').onclick=closeCompany;
byId('new-company').onclick=()=>{resetCompanyForm();statusMessage('');byId('company-dialog').showModal();};
function chooseReceiver(company){
  for(const [name,value] of Object.entries({nome:company.name,documento:company.document,recebedorEndereco:company.address,recebedorCidade:company.city,depositoTitular:company.name,depositoBanco:company.bank,depositoAgencia:company.agency,depositoConta:company.account,recebedorIE:company.ie,recebedorCEP:company.cep})){
    field(name).value=['documento','pagadorDocumento'].includes(name)?formatDocument(value):value||'';clearFieldError(field(name));
  }
  byId('receiver-search').value=company.name;closePartnerResults('receiver');
}
function choosePayer(company){
  const values={pagadorNome:company.name,pagadorDocumento:company.document,pagadorIE:company.ie,pagadorEndereco:company.address,pagadorCidade:company.city,pagadorCEP:company.cep,emitente:company.name,banco:company.bank,agencia:company.agency,conta:company.account};
  for(const [name,value] of Object.entries(values)){field(name).value=['documento','pagadorDocumento'].includes(name)?formatDocument(value):value||'';clearFieldError(field(name));}
  byId('payer-search').value=company.name;byId('payer-results').hidden=true;byId('payer-search').setAttribute('aria-expanded','false');
}
const normalizePartner=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
function closePartnerResults(prefix){byId(prefix+'-results').hidden=true;byId(prefix+'-search').setAttribute('aria-expanded','false');}
function searchPartners(prefix){
  const q=normalizePartner(byId(prefix+'-search').value.trim()),results=byId(prefix+'-results');results.replaceChildren();
  results.hidden=false;byId(prefix+'-search').setAttribute('aria-expanded','true');
  const digits=q.replace(/\D/g,'');
  const matches=companies.filter(c=>!q||normalizePartner(c.name+' '+c.document+' '+(c.city||'')).includes(q)||(digits&&c.document.replace(/\D/g,'').includes(digits)));
  for(const company of matches){const button=document.createElement('button');button.type='button';button.className='partner-option';button.textContent=company.name+' · '+company.document;button.onclick=()=>prefix==='payer'?choosePayer(company):chooseReceiver(company);results.append(button);}
  if(!matches.length)results.textContent='Nenhum parceiro encontrado. Cadastre em Parceiros ou preencha os dados manualmente.';
}
for(const prefix of ['payer','receiver']){
  const input=byId(prefix+'-search'),results=byId(prefix+'-results');
  input.oninput=()=>searchPartners(prefix);
  input.onfocus=async()=>{try{companies=await transaction('readonly',store=>store.getAll(),'empresas');if(document.activeElement===input)searchPartners(prefix);}catch(error){statusMessage(error.message,true);}};
  input.onkeydown=event=>{if(event.key==='ArrowDown'){event.preventDefault();results.querySelector('button')?.focus();}if(event.key==='Escape'&&!results.hidden){event.preventDefault();event.stopPropagation();closePartnerResults(prefix);}};
  results.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();input.focus();closePartnerResults(prefix);}if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();(event.key==='ArrowDown'?event.target.nextElementSibling:event.target.previousElementSibling)?.focus();}};
  document.addEventListener('click',event=>{if(event.target!==input&&!results.contains(event.target))closePartnerResults(prefix);});
}
byId('company-search').oninput=renderCompanies;byId('company-filter').onchange=renderCompanies;
for(const [prefix,selected,getItems,render] of [['receipts',selectedReceipts,receiptItems,renderHistory],['partners',selectedPartners,partnerItems,renderCompanies]]){
  byId(prefix+'-all').onchange=event=>{selected.clear();if(event.target.checked)getItems().forEach(item=>selected.add(item.id));render();};
}
byId('receipts-edit').onclick=()=>{const record=records.find(r=>selectedReceipts.has(r.id));if(record)editRecord(record);};
byId('receipts-pdf').onclick=()=>{const record=records.find(r=>selectedReceipts.has(r.id));if(record)openSaved(record);};
byId('partners-edit').onclick=()=>{const company=companies.find(c=>selectedPartners.has(c.id));if(company)editCompany(company);};
async function deleteSelection(selected,store,label){
  if(!selected.size||!confirm('Excluir '+selected.size+' '+label+' selecionado(s)?'+(store==='empresas'?' Os recibos emitidos serão mantidos.':' Os PDFs também serão removidos deste histórico.')))return;
  try{if(store==='recibos'&&window.receiptFinance)await window.receiptFinance.deleteReceipts([...selected]);else await transaction('readwrite',objectStore=>{for(const id of selected)objectStore.delete(id);},store);selected.clear();await refresh();statusMessage('Exclusão concluída.');}catch(error){statusMessage(error.message,true);}
}
byId('receipts-delete').onclick=()=>deleteSelection(selectedReceipts,'recibos','recibo');
byId('partners-delete').onclick=()=>deleteSelection(selectedPartners,'empresas','parceiro');
function closeReceipt(){
  if(busy||transitioning||attachmentLoading)return;
  if(!byId('receipt-exit-dialog').open)byId('receipt-exit-dialog').showModal();
}
byId('exit-cancel').onclick=()=>byId('receipt-exit-dialog').close();
byId('exit-discard').onclick=()=>{byId('receipt-exit-dialog').close();resetForm();showView(true);statusMessage('');};
byId('exit-save').onclick=async()=>{
  byId('receipt-exit-dialog').close();
  if(!validateReceipt())return;
  await saveReceipt(true);
};
function validateReceipt(){
  for(let n=0;n<LAST_STEP;n++){
    const section=form.querySelector('.step[data-step="'+n+'"]');
    if([...section.querySelectorAll('input,select')].some(input=>inputError(input))){showStep(n);validateFields(section);return false;}
  }
  return true;
}
async function animateStep(){
  transitioning=true;form.inert=true;byId('close-receipt').disabled=true;
  const dot=document.querySelector('.steps li.active');dot.classList.add('transitioning');
  try{await new Promise(resolve=>setTimeout(resolve,500));}
  finally{dot.classList.remove('transitioning');form.inert=false;byId('close-receipt').disabled=false;transitioning=false;}
}
byId('close-receipt').onclick=closeReceipt;
byId('receipt-dialog').addEventListener('cancel',event=>{event.preventDefault();closeReceipt();});
byId('cheque-search').oninput=renderCheques;byId('cheque-filter').onchange=renderCheques;
byId('cheque-clear').onclick=()=>{for(const id of ['cheque-search','cheque-filter'])byId(id).value='';window.chequeDateFilter.clear();};
async function nextStep() {
  if(busy||transitioning||attachmentLoading||!validStep())return;
  statusMessage('');
  if(step<LAST_STEP-1){await animateStep();showStep(step+1);return;}
  if(!validateReceipt())return;
  await animateStep();
  busy=true;byId('next').disabled=true;
  try {
    const data=readData();data.numero=editingRecord?.data.numero||await nextReceiptNumber();draft={data,pdf:await generatePDF(data)};
    if(previewURL)URL.revokeObjectURL(previewURL);
    previewURL=URL.createObjectURL(draft.pdf);byId('draft-preview').src=previewURL;
    byId('summary').replaceChildren();
    for(const [label,value] of [['Número',data.numero],['Modelo',modelName(data.tipo)],['Prestador',data.nome],['Documento',data.documento],['Nota fiscal',data.nota],['Valor',money(data.valor)],['Pagamento',paymentName(data.formaPagamento)]]){
      const item=document.createElement('div'),title=document.createElement('span'),text=document.createElement('strong');
      title.textContent=label;text.textContent=value;item.append(title,text);byId('summary').append(item);
    }
    showStep(LAST_STEP);openDraft();
  } catch(error){statusMessage(error.message,true);}
  finally {busy=false;byId('next').disabled=false;}
}
async function saveReceipt(exit=false){
  if(busy||transitioning||attachmentLoading)return;
  busy=true;byId('issue').disabled=true;
  byId('issue-preview').disabled=true;byId('close-draft').disabled=true;
  try {
    if(window.receiptFiles)await window.receiptFiles.ensureActiveAccess();
    if(exit){const data=readData();data.numero=editingRecord?.data.numero||await nextReceiptNumber();draft={data,pdf:await generatePDF(data)};}
    if(!draft)return;
    const record={id:editingRecord?.id||crypto.randomUUID(),version:2,createdAt:editingRecord?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),data:draft.data,pdf:draft.pdf,attachment,attachmentPDF:preservedAttachmentPDF};
    await saveNumberedRecord(record);
    draft=null;await refresh();showView(true);if(!exit)openSaved(record);
    statusMessage('Recibo salvo. O PDF está disponível para download e reimpressão.');
    resetForm();
  }catch(error){statusMessage(error.message,true);byId('draft-status').textContent=error.message;byId('draft-status').classList.add('error');}
  finally{busy=false;byId('issue').disabled=false;byId('issue-preview').disabled=false;byId('close-draft').disabled=false;}
}
form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(step!==LAST_STEP){nextStep();return;}
  if(validateReceipt())await saveReceipt();
});
function updateType() {
  const freight=field('tipo').value==='covre';
  byId('destination-field').hidden=!freight;field('destino').disabled=!freight;
  byId('service-label').textContent=freight?'Tipo de entrega':'Tipo de serviço';
  field('servico').placeholder=freight?'Ex.: Venda':'Ex.: Descarga de mercadoria de compra';
}
function resetForm() {
  form.reset();clearErrors(form);byId('receiver-search').value='';closePartnerResults('receiver');byId('payer-results').hidden=true;byId('payer-search').setAttribute('aria-expanded','false');attachment=null;draft=null;editingRecord=null;preservedAttachmentPDF=null;
  byId('editor').querySelector('h1').textContent='Novo recibo';
  byId('issue').textContent=byId('issue-preview').textContent='Salvar e emitir recibo';
  cancelEdit.hidden=true;
  byId('attachment-name').textContent='';byId('remove-attachment').hidden=true;
  ['dataEmissao','dataServico','dataCheque'].forEach(n=>field(n).value=today());
  window.localProfile?.applyDefaults();
  updateType();updatePayment();showStep(0);
}
byId('next').onclick=nextStep;
byId('skip-attachment').onclick=()=>{if(busy||transitioning||attachmentLoading)return;delete byId('attachment').dataset.uploadError;clearFieldError(byId('attachment'));nextStep();};
byId('previous').onclick=()=>{if(!busy&&!transitioning&&!attachmentLoading)showStep(Math.max(0,step-1));};
function newReceipt(){
  resetForm();statusMessage('');
  showView(false);
}
byId('nav-new').onclick=async()=>{try{await refresh();showView(true);}catch(e){statusMessage(e.message,true);}};
byId('create-another').onclick=newReceipt;
showStep(0);showView(true);
byId('search').oninput=renderHistory;byId('filter').onchange=renderHistory;
function blobBase64(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=reject;r.readAsDataURL(blob);});}
byId('backup').onclick=async()=>{
  try{
    await navigator.locks.request('covre-receipt-number',async()=>{
    await refresh();
    const items=await Promise.all(records.map(async source=>{const r=window.receiptFiles?await window.receiptFiles.hydrate(source):source;const {files,fileBackup,filesCopiedAt,...portable}=r;return ({
      ...portable,pdf:await blobBase64(r.pdf),
      ...(Object.hasOwn(r,'attachment')?{attachment:r.attachment?{...r.attachment,bytes:await blobBase64(new Blob([r.attachment.bytes]))}:null}:{}),
      attachmentPDF:r.attachmentPDF?await blobBase64(r.attachmentPDF):null
    });}));
    const finance=await window.receiptFinance?.exportData();
    downloadBlob(new Blob([JSON.stringify({format:'gaveblue-frete',version:2,records:items,empresas:companies,sequence:String(await sequenceHighWater()),finance})],{type:'application/json'}), 'recibos-covre-'+today()+'.json');
    });
    statusMessage('Cópia do histórico exportada.');
  }catch(e){statusMessage(e.message||'Não foi possível exportar o histórico.',true);}
};
byId('restore').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
    if(file.size>100*1024*1024)throw new Error('A cópia excede o limite de 100 MB.');
    const backup=JSON.parse(await file.text());
    if(backup.sequence!==undefined&&!/^\d+$/.test(String(backup.sequence)))throw new Error('Sequência inválida no backup.');
    if(backup.format!=='gaveblue-frete'||![1,2].includes(backup.version)||!Array.isArray(backup.records)||backup.records.length>2000)throw new Error('Arquivo de histórico inválido.');
    const imported=backup.records.map(r=>{
      if(!r||typeof r.id!=='string'||!r.id||typeof r.createdAt!=='string'||!Number.isFinite(Date.parse(r.createdAt))||!r.data||!['covre','chapa'].includes(r.data.tipo)||typeof r.pdf!=='string')throw new Error('Registro inválido na cópia.');
      const required=['nome','documento','nota','dataEmissao',...((r.data.formaPagamento||'cheque')==='cheque'?['cheque']:[])];
      if(r.data.numero!==undefined&&!/^\d+$/.test(r.data.numero))throw new Error('Número de recibo inválido no backup.');
      if(r.data.dataSaque!==undefined&&r.data.dataSaque!==''&&!window.chequeWithdrawal.validDate(r.data.dataSaque))throw new Error('Data de saque inválida no backup.');
      if(required.some(k=>typeof r.data[k]!=='string'||!r.data[k].trim())||!/^\d{4}-\d{2}-\d{2}$/.test(r.data.dataEmissao)||!Number.isFinite(r.data.valor)||r.data.valor<=0)throw new Error('Dados inválidos na cópia.');
      const bytes=Uint8Array.from(atob(r.pdf),c=>c.charCodeAt(0));
      if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw new Error('PDF inválido na cópia.');
      let decodedAttachment=null,attachmentPDF=null;
      if(r.attachment){
        if(!['image/png','image/jpeg'].includes(r.attachment.type)||typeof r.attachment.bytes!=='string'||r.attachment.bytes.length>7*1024*1024)throw new Error('Anexo inválido na cópia.');
        decodedAttachment={type:r.attachment.type,name:r.attachment.name,bytes:Uint8Array.from(atob(r.attachment.bytes),c=>c.charCodeAt(0))};
      }
      if(r.attachmentPDF){
        if(typeof r.attachmentPDF!=='string')throw new Error('Anexo inválido na cópia.');
        const attachmentBytes=Uint8Array.from(atob(r.attachmentPDF),c=>c.charCodeAt(0));
        if(new TextDecoder().decode(attachmentBytes.slice(0,5))!=='%PDF-')throw new Error('Anexo inválido na cópia.');
        attachmentPDF=new Blob([attachmentBytes],{type:'application/pdf'});
      }
      const {files,fileBackup,filesCopiedAt,...portable}=r;
      return {...portable,pdf:new Blob([bytes],{type:'application/pdf'}),...(Object.hasOwn(r,'attachment')?{attachment:decodedAttachment}:{}),attachmentPDF};
    });
    const importedCompanies=(backup.version===2?(backup.empresas||[]):[]).map(company=>{if(!company||typeof company.id!=='string'||typeof company.name!=='string'||typeof company.document!=='string'||!['pagador','recebedor','ambos'].includes(company.role))throw new Error('Cadastro de empresa inválido na cópia.');return company;});
    await refresh();const existing=new Set(records.map(r=>r.id));const existingCompanies=new Set(companies.map(company=>company.id));
    const numbered=new Map(records.filter(r=>r.data.numero).map(r=>[String(BigInt(r.data.numero)),r.id]));
    for(const record of imported){if(existing.has(record.id)||!record.data.numero)continue;const number=String(BigInt(record.data.numero));if(numbered.has(number)&&numbered.get(number)!==record.id)throw new Error('O recibo nº '+record.data.numero+' já pertence a outro registro. A importação foi cancelada.');numbered.set(number,record.id);}
    await window.receiptFinance.restore({imported,companies:importedCompanies,sequence:backup.sequence,finance:backup.finance});
    await refresh();showView(true);statusMessage('Histórico importado. Registros já existentes foram preservados.');
  }catch(e){statusMessage(e.message||'Não foi possível importar o histórico.',true);}
  finally{event.target.value='';}
};
document.querySelectorAll('[name=tipo]').forEach(el=>el.onchange=updateType);
byId('close-dialog').onclick=()=>byId('pdf-dialog').close();
byId('download').onclick=()=>downloadBlob(current.pdf,'recibo-'+current.data.tipo+'-'+current.id.slice(0,8)+'.pdf');
byId('print').onclick=()=>{
  try{byId('saved-preview').contentWindow.focus();byId('saved-preview').contentWindow.print();}
  catch{window.open(savedURL,'_blank','noopener');}
};
byId('remove-attachment').onclick=()=>{attachment=null;preservedAttachmentPDF=null;byId('attachment').value='';delete byId('attachment').dataset.uploadError;clearFieldError(byId('attachment'));byId('attachment-name').textContent='';byId('remove-attachment').hidden=true;byId('skip-attachment').hidden=step!==LAST_STEP-1;};
byId('attachment').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  attachmentLoading=true;byId('next').disabled=true;
  try{
    if(!['image/png','image/jpeg'].includes(file.type)||file.size>5*1024*1024)throw new Error('Selecione uma imagem PNG ou JPEG de até 5 MB.');
    const image=await createImageBitmap(file);
    if(image.width*image.height>40000000){image.close();throw new Error('A imagem é muito grande. Use até 40 megapixels.');}
    image.close();attachment={type:file.type,name:file.name,bytes:await file.arrayBuffer()};preservedAttachmentPDF=null;
    byId('attachment-name').textContent=file.name;byId('remove-attachment').hidden=false;
    delete event.target.dataset.uploadError;clearFieldError(event.target);statusMessage('');
  }catch(e){event.target.value='';event.target.dataset.uploadError=e.message;fieldError(event.target,e.message);byId('remove-attachment').hidden=false;}
  finally{attachmentLoading=false;byId('next').disabled=false;byId('skip-attachment').hidden=step!==LAST_STEP-1||Boolean(attachment||preservedAttachmentPDF);}
};
const databaseReady=openDatabase().then(async result=>{db=result;await refresh();});
databaseReady.catch(error=>{statusMessage(error.message,true);byId('issue').disabled=true;});
async function generatePDF(data,options={}) {
  const customLayout=Object.hasOwn(options,'layout')?options.layout:await window.receiptLayout?.read(data.tipo);
  const pdfAttachment=Object.hasOwn(options,'attachment')?options.attachment:attachment;
  const pdfAttachmentSource=Object.hasOwn(options,'attachmentPDF')?options.attachmentPDF:preservedAttachmentPDF;
  const layout=await (await getFile('./modelos/layout.json')).json();
  const metrics=layout[data.tipo];
  const paymentTitleY=metrics.fields.emitente.y+10.92;
  for(const key of ['localData','assinatura','assinaturaDocumento'])Object.assign(metrics.fields[key],{x:metrics.width/2,align:'center'});
  if(customLayout)for(const [key,settings] of Object.entries(customLayout.fields||{}))if(metrics.fields[key])Object.assign(metrics.fields[key],settings);
  const originalPayer={pagadorNome:'COVRE & CIA LTDA',pagadorDocumento:'28.419.232/0001-06',pagadorIE:'080.989.89-6',pagadorEndereco:'Av. Agenor Luiz Heringer, 463, Centro',pagadorCidade:'Pinheiros/ES',pagadorCEP:'29980-000'};
  const customPayer=Object.entries(originalPayer).some(([key,value])=>(data[key]??value)!==value);
  const method=data.formaPagamento||'cheque';
  const template=data.tipo+(customPayer?'-partners-v2':'-v1')+(method==='cheque'?'':'-payment')+'.pdf';
  const pdf=await PDFLib.PDFDocument.load(await (await getFile('./modelos/'+template)).arrayBuffer());
  const page=pdf.getPages()[0];
  const staticFields=(await (await getFile('./modelos/static-layout.json')).json())[template];
  const changed=[];
  for(const [key,m] of Object.entries(staticFields)){
    const settings=customLayout?.fields?.[key];
    if(settings&&['x','y','size','width','align','weight'].some(prop=>settings[prop]!==undefined&&settings[prop]!== (m[prop]??(prop==='align'?'left':undefined)))){
      const b=m.bounds;page.drawRectangle({x:b.x-.4,y:b.y-.4,width:b.width+.8,height:b.height+.8,color:PDFLib.rgb(1,1,1)});changed.push([key,m,settings]);
    }else options.onField?.({key,kind:m.kind,text:m.text,metric:{x:m.x,y:m.y,size:m.size,...(m.kind==='line'?{width:m.width}:{align:'left',weight:m.weight})},...m.bounds});
  }
  for(const [key,m,settings] of changed){
    if(m.kind==='line'){
      const line={x:m.x,y:m.y,size:m.size,width:m.width,...settings};
      if(![line.x,line.y,line.size,line.width].every(Number.isFinite)||line.size<.5||line.size>12||line.width<10||line.x<0||line.y<0||line.x+line.width>metrics.width||line.y+line.size>metrics.height)throw new Error('A linha divisória ultrapassa a página. Ajuste a posição, a largura ou a espessura.');
      const color=Array.isArray(m.color)?PDFLib.rgb(...m.color):PDFLib.rgb(m.color,m.color,m.color);
      page.drawRectangle({x:line.x,y:line.y,width:line.width,height:line.size,color});
      options.onField?.({key,kind:'line',text:m.text,metric:line,x:line.x,y:line.y,width:line.width,height:line.size});
    }else await drawLayoutText(pdf,page,key,m.text,{...m,...settings,weight:settings.weight==='auto'?m.weight:settings.weight||m.weight},options);
  }
  if(method!=='cheque')await drawLayoutText(pdf,page,'tituloPagamento','DADOS DO PAGAMENTO',{x:56.784,y:paymentTitleY,size:9.48,weight:'bold',...customLayout?.fields?.tituloPagamento},options);
  if(data.numero){
    const text='Nº '+data.numero,m={x:metrics.width/2,y:773,size:10,align:'center',weight:'normal',...customLayout?.fields?.numero};
    const font=await pdf.embedFont(m.weight==='bold'?PDFLib.StandardFonts.HelveticaBold:PDFLib.StandardFonts.Helvetica),width=font.widthOfTextAtSize(text,m.size);
    const x=m.align==='center'?m.x-width/2:m.align==='right'?m.x-width:m.x;
    if(x<0||x+width>metrics.width||m.y+m.size>metrics.height||m.y<3)throw new Error('O número do recibo ultrapassa a página. Ajuste a posição ou a fonte.');
    page.drawText(text,{x,y:m.y,size:m.size,font});options.onField?.({key:'numero',text,metric:m,x,y:m.y-2,width,height:m.size+3});
  }
  if(customPayer)await drawPayer(pdf,page,data,customLayout,options);
  const fullDate=new Date(data.dataEmissao+'T12:00:00').toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'});
  const amount=money(data.valor)+' ('+extenso(data.valor).toUpperCase()+')';
  const values={
    nome:'Nome: '+data.nome,documento:'CPF/CNPJ: '+data.documento,
    servico:(data.tipo==='covre'?'Tipo de entrega: ':'Tipo de serviço: ')+data.servico,
    nota:'Nº Nota Fiscal: '+data.nota,destino:'Destino: '+data.destino,
    dataServico:(data.tipo==='covre'?'Data do frete: ':'Data: ')+dateBR(data.dataServico),
    valorServico:'Valor: '+amount,emitente:'Emitente: '+data.emitente,
    banco:'Banco: '+data.banco,agencia:'Agência: '+data.agencia,conta:'Conta: '+data.conta,
    dataCheque:'Data: '+dateBR(data.dataCheque||data.dataEmissao),cheque:'Nº Cheque: '+data.cheque,
    valorCheque:'Valor: '+amount,localData:data.local+', '+fullDate,
    assinatura:data.nome,assinaturaDocumento:(data.documento.replace(/\D/g,'').length===14?'CNPJ: ':'CPF: ')+data.documento
  };
  if(method!=='cheque'){
    Object.assign(values,{emitente:'Forma de pagamento: '+paymentName(method),banco:'',agencia:'',conta:'',dataCheque:'',cheque:''});
    if(method==='deposito')Object.assign(values,{banco:'Titular: '+data.depositoTitular,agencia:'Banco: '+data.depositoBanco,conta:'Agência: '+data.depositoAgencia,dataCheque:'Conta: '+data.depositoConta,cheque:'Tipo de conta: '+(data.depositoTipo==='poupanca'?'Poupança':'Corrente')});
    if(method==='pix')Object.assign(values,{banco:'Tipo de chave: '+({cpf:'CPF',cnpj:'CNPJ',email:'E-mail',telefone:'Telefone',aleatoria:'Aleatória'}[data.pixTipo]),agencia:'Chave: '+data.pixChave});
  }
  for(const [key,m] of Object.entries(metrics.fields)) {
    if(!values[key])continue;
    const text=values[key],boldLine=m.weight==='bold'||((!m.weight||m.weight==='auto')&&['assinatura','valorCheque'].includes(key));
    const splitBold=(!m.weight||m.weight==='auto')&&['nome','valorServico','cheque'].includes(key);
    const separator=splitBold?text.indexOf(':')+2:0;
    const prefix=text.slice(0,separator),suffix=text.slice(separator);
    const amountBold=m.weight==='normal'?false:true;
    // Draw with the original Arial face, then embed losslessly at 288 dpi.
    // This keeps the saved PDF independent of fonts on the reprinting device.
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
    let fontSize=m.size;
    const setFont=bold=>ctx.font=(bold?'bold ':'')+fontSize+'px Arial, sans-serif';
    setFont(boldLine);
    let prefixWidth=0,width=ctx.measureText(text).width;
    if(splitBold){setFont(false);prefixWidth=ctx.measureText(prefix).width;setFont(true);width=prefixWidth+ctx.measureText(suffix).width;}
    const wrapsAmount=['valorServico','valorCheque'].includes(key);
    const lines=[];
    if(wrapsAmount){
      // Both original templates reserve two lines before the next section.
      // Very long amounts keep their full text with a small font adjustment.
      do{
        lines.length=0;
        if(splitBold){setFont(false);prefixWidth=ctx.measureText(prefix).width;}
        setFont(amountBold);
        let line='';
        for(const word of suffix.split(/\s+/)){
          const candidate=line?line+' '+word:word;
          if(line&&ctx.measureText(candidate).width+(lines.length===0?prefixWidth:0)>480){lines.push(line);line=word;}else line=candidate;
        }
        if(line)lines.push(line);
        if(lines.length>2)fontSize-=0.2;
      }while(lines.length>2);
      width=Math.max(...lines.map((line,index)=>ctx.measureText(line).width+(index===0?prefixWidth:0)));
    }
    if(width>480){
      const labels={nome:'nome',documento:'CPF/CNPJ',servico:'tipo de serviço',nota:'nota fiscal',destino:'destino',valorServico:'valor por extenso',valorCheque:'valor por extenso',emitente:'emitente',banco:'banco',agencia:'agência',conta:'conta',cheque:'número do cheque',localData:'local e data',assinatura:'nome na assinatura',assinaturaDocumento:'documento na assinatura'};
      throw new Error('O texto de '+(labels[key]||'data')+' excede a largura disponível no modelo. Revise o preenchimento antes de emitir.');
    }
    const x=m.align==='center'?m.x-width/2:m.align==='right'?m.x-width:m.x;
    const scale=4,baseline=Math.max(12,Math.ceil(fontSize)+2),lineHeight=Math.max(11,fontSize*1.15),height=baseline+Math.max(4,fontSize*.3)+(wrapsAmount?lines.length-1:0)*lineHeight;
    if(x<0||x+width>metrics.width||m.y+baseline>metrics.height||m.y-(height-baseline)<0)throw new Error('O texto “'+text.slice(0,35)+'” ultrapassa a página. Ajuste a posição ou a fonte.');
    canvas.width=Math.ceil((width+1)*scale);canvas.height=height*scale;
    ctx.scale(scale,scale);ctx.fillStyle='#000';ctx.textBaseline='alphabetic';
    if(wrapsAmount){
      if(splitBold){setFont(false);ctx.fillText(prefix,0,baseline);}
      setFont(amountBold);lines.forEach((line,index)=>ctx.fillText(line,index===0?prefixWidth:0,baseline+index*lineHeight));
    }
    else if(splitBold){setFont(false);ctx.fillText(prefix,0,baseline);setFont(true);ctx.fillText(suffix,prefixWidth,baseline);}
    else{setFont(boldLine);ctx.fillText(text,0,baseline);}
    const image=await pdf.embedPng(canvas.toDataURL('image/png'));
    page.drawImage(image,{x,y:m.y-(height-baseline),width:canvas.width/scale,height});
    options.onField?.({key,text,metric:{...m,align:m.align||'left',weight:m.weight||'auto'},x,y:m.y-(height-baseline),width:canvas.width/scale,height});
  }
  if(pdfAttachmentSource&&!pdfAttachment){
    const original=await PDFLib.PDFDocument.load(await pdfAttachmentSource.arrayBuffer());
    const region=await pdf.embedPage(original.getPages()[0],{left:56.7,bottom:28,right:537.7,top:182});
    page.drawPage(region,{x:56.7,y:28,width:481,height:154});
  }
  if(pdfAttachment) {
    const image=pdfAttachment.type==='image/png'?await pdf.embedPng(pdfAttachment.bytes):await pdf.embedJpg(pdfAttachment.bytes);
    const box={x:56.7,y:28,width:481,height:154};
    const scale=Math.min(box.width/image.width,box.height/image.height);
    page.drawImage(image,{x:box.x+(box.width-image.width*scale)/2,y:box.y+box.height-image.height*scale,width:image.width*scale,height:image.height*scale});
  }
  pdf.setTitle('Recibo '+(data.numero||'')+' de '+modelName(data.tipo)+' - '+data.nome);
  pdf.setAuthor(data.pagadorNome||'COVRE & CIA LTDA');pdf.setSubject('Pagamento');
  return new Blob([await pdf.save()],{type:'application/pdf'});
}
async function drawLayoutText(pdf,page,key,text,m,options={},boldPrefix=''){
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  const font=bold=>ctx.font=(bold?'bold ':'')+m.size+'px Arial';
  const mixed=boldPrefix&&(!m.weight||m.weight==='auto');
  font(mixed||m.weight==='bold');const prefixWidth=mixed?ctx.measureText(boldPrefix).width:0;
  const suffix=mixed?text.slice(boldPrefix.length):text; font(m.weight==='bold');const width=prefixWidth+ctx.measureText(suffix).width;
  const baseline=Math.max(12,Math.ceil(m.size)+2),height=baseline+Math.max(4,m.size*.3);
  canvas.width=Math.ceil((width+1)*4);canvas.height=Math.ceil(height*4);ctx.scale(4,4);ctx.fillStyle='#000';
  if(mixed){font(true);ctx.fillText(boldPrefix,0,baseline);}font(m.weight==='bold');ctx.fillText(suffix,prefixWidth,baseline);
  const x=m.align==='center'?m.x-width/2:m.align==='right'?m.x-width:m.x;
  if(x<0||x+width>595.56||m.y+baseline>842.04||m.y-(height-baseline)<0)throw new Error('O texto “'+text.slice(0,35)+'” ultrapassa a página. Ajuste a posição ou a fonte.');
  const image=await pdf.embedPng(canvas.toDataURL('image/png'));page.drawImage(image,{x,y:m.y-(height-baseline),width:canvas.width/4,height:canvas.height/4});
  options.onField?.({key,text,metric:{...m,align:m.align||'left',weight:m.weight||(boldPrefix?'auto':'normal')},x,y:m.y-(height-baseline),width:canvas.width/4,height:canvas.height/4});
}
async function drawPayer(pdf,page,data,customLayout,options={}){
  const layout=(await (await getFile('./modelos/partners-layout.json')).json())[data.tipo];
  const documentLabel=data.pagadorDocumento.replace(/\D/g,'').length===11?'CPF':'CNPJ';
  const identity=data.pagadorNome+', '+(documentLabel==='CNPJ'?'inscrita':'inscrito(a)')+' no '+documentLabel+' sob nº '+data.pagadorDocumento+(data.pagadorIE?' e I.E. nº '+data.pagadorIE:'')+'.';
  const address='Endereço: '+[data.pagadorEndereco,data.pagadorCidade].filter(Boolean).join(', ')+(data.pagadorCEP?' - CEP '+data.pagadorCEP:'')+'.';
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  async function line(text,m,boldPrefix='',key){
    if(key&&customLayout?.fields?.[key])return drawLayoutText(pdf,page,key,text,{...m,...customLayout.fields[key]},options,boldPrefix);
    const suffix=text.slice(boldPrefix.length);ctx.font='bold '+m.size+'px Arial';const prefixWidth=ctx.measureText(boldPrefix).width;
    ctx.font=m.size+'px Arial';const width=prefixWidth+ctx.measureText(suffix).width;
    if(width>481)throw new Error('Os dados do pagador excedem a largura do modelo. Abrevie o nome ou endereço.');
    canvas.width=Math.ceil((width+1)*4);canvas.height=64;ctx.scale(4,4);ctx.fillStyle='#000';ctx.font='bold '+m.size+'px Arial';ctx.fillText(boldPrefix,0,12);ctx.font=m.size+'px Arial';ctx.fillText(suffix,prefixWidth,12);
    const image=await pdf.embedPng(canvas.toDataURL('image/png'));page.drawImage(image,{x:m.x,y:m.y-4,width:canvas.width/4,height:16});
    if(key)options.onField?.({key,text,metric:{...m,weight:boldPrefix?'auto':'normal',align:'left'},x:m.x,y:m.y-4,width:canvas.width/4,height:16});
  }
  await line(identity,layout.payer[0],data.pagadorNome,'identidadePagador');await line(address,layout.payer[1],'Endereço:','enderecoPagador');
  const declaration=layout.declarationText.replace('COVRE & CIA LTDA',data.pagadorNome).replace('CNPJ nº 28.419.232/0001-06',documentLabel+' nº '+data.pagadorDocumento);
  ctx.font=layout.declaration[0].size+'px Arial';const lines=[];let current='';
  for(const word of declaration.split(/\s+/)){const candidate=current?current+' '+word:word;if(ctx.measureText(candidate).width>481&&current){lines.push(current);current=word;}else current=candidate;}
  if(current)lines.push(current);
  if(lines.length>4)throw new Error('O nome do pagador é longo demais para a declaração deste modelo. Abrevie-o antes de emitir.');
  for(let i=0;i<lines.length;i++)await line(lines[i],{...layout.declaration[0],y:layout.declaration[0].y-i*12.42},'','declaracao'+i);
}
    function numeroParaExtenso(valor) {
      if (!valor || isNaN(valor) || valor === 0) return '';
      
      const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
      const dez = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
      const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
      const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
      
      function converterGrupo(n) {
        if (n === 0) return '';
        if (n === 100) return 'cem';
        
        let resultado = '';
        const c = Math.floor(n / 100);
        const d = Math.floor((n % 100) / 10);
        const u = n % 10;
        
        if (c > 0) resultado += centenas[c];
        if (d === 1) {
          if (resultado) resultado += ' e ';
          resultado += dez[u];
          return resultado;
        }
        if (d > 0) {
          if (resultado) resultado += ' e ';
          resultado += dezenas[d];
        }
        if (u > 0) {
          if (resultado) resultado += ' e ';
          resultado += unidades[u];
        }
        return resultado;
      }
      
      const partes = valor.toFixed(2).split('.');
      const reais = parseInt(partes[0]);
      const centavos = parseInt(partes[1]);
      
      function converterNumeroInteiro(n) {
        if (n === 0) return 'zero';
        if (n < 1000) return converterGrupo(n);

        if (n < 1000000) {
          const milhares = Math.floor(n / 1000);
          const resto = n % 1000;
          let resultado = milhares === 1 ? 'mil' : `${converterGrupo(milhares)} mil`;

          if (resto > 0) {
            resultado += ' e ' + converterGrupo(resto);
          }

          return resultado;
        }

        if (n < 1000000000) {
          const milhoes = Math.floor(n / 1000000);
          const resto = n % 1000000;
          let resultado = milhoes === 1 ? 'um milhão' : `${converterGrupo(milhoes)} milhões`;

          if (resto > 0) {
            resultado += resto < 100 ? ' e ' : ', ';
            resultado += converterNumeroInteiro(resto);
          }

          return resultado;
        }

        const bilhoes = Math.floor(n / 1000000000);
        const resto = n % 1000000000;
        let resultado = bilhoes === 1 ? 'um bilhão' : `${converterGrupo(bilhoes)} bilhões`;

        if (resto > 0) {
          resultado += resto < 100 ? ' e ' : ', ';
          resultado += converterNumeroInteiro(resto);
        }

        return resultado;
      }

      let extenso = '';

      if (reais === 0) {
        extenso = 'zero reais';
      } else if (reais === 1) {
        extenso = 'um real';
      } else {
        extenso = converterNumeroInteiro(reais) + ' reais';
      }
      
      if (centavos > 0) {
        extenso += ' e ' + converterGrupo(centavos);
        extenso += centavos === 1 ? ' centavo' : ' centavos';
      }
      
      return extenso.charAt(0).toUpperCase() + extenso.slice(1);
    }
