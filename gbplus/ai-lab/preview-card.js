// GB+ AI: presentation-only preview; production validation/writes remain in ai-bridge.
const labels=Object.freeze({single:'Único',recurring:'Recorrente',installment:'Parcelado'});
const ico=Object.freeze({
 text:'M5 4h14v16H5z M8 8h8 M8 12h8 M8 16h5',
 coins:'M12 6c4.5 0 8 1.3 8 3s-3.5 3-8 3-8-1.3-8-3 3.5-3 8-3z M4 9v6c0 1.7 3.5 3 8 3s8-1.3 8-3V9 M4 15v3c0 1.7 3.5 3 8 3s8-1.3 8-3v-3',
 calendar:'M4 6h16v15H4z M4 10h16 M8 3v6 M16 3v6',
 repeat:'M20 8a8 8 0 0 0-14-3L4 7 M4 3v4h4 M4 16a8 8 0 0 0 14 3l2-2 M20 21v-4h-4',
 layers:'M12 3l9 5-9 5-9-5z M3 12l9 5 9-5 M3 16l9 5 9-5',
 calculator:'M5 3h14v18H5z M8 7h8 M8 12h2 M14 12h2 M8 16h2 M14 16h2',
 info:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 10v6 M12 7h.01'
});
const svg=name=>'<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+ico[name]+'"/></svg>';
const pad=n=>String(n).padStart(2,'0');
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&
 !Number.isNaN(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
function addMonth(date,offset){
 const [year,month,day]=date.split('-').map(Number);
 const first=new Date(Date.UTC(year,month-1+offset,1,12));
 const end=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0,12)).getUTCDate();
 return first.getUTCFullYear()+'-'+pad(first.getUTCMonth()+1)+'-'+pad(Math.min(day,end));
}
export function proposalSchedule(proposal){
 if(!proposal||!['expense','income'].includes(proposal.type)||
  !['single','recurring','installment'].includes(proposal.mode)||
  !validDate(proposal.due)||!Number.isSafeInteger(proposal.amountCents)||
  proposal.amountCents<=0)throw Error('Prévia incompleta. Confira data, tipo e valor.');
 const count=proposal.mode==='single'?1:Number(proposal.count);
 if(!Number.isInteger(count)||count<1||count>120)throw Error('A quantidade deve ser de 1 a 120 títulos.');
 if(proposal.mode==='installment'&&proposal.amountCents<count)throw Error('O valor não permite tantas parcelas.');
 const items=Array.from({length:count},(_,index)=>({
  sequence:index+1,count,due:addMonth(proposal.due,index),
  amountCents:proposal.mode==='installment'?
   Math.floor(proposal.amountCents/count)+(index<proposal.amountCents%count?1:0):proposal.amountCents
 }));
 return {items,totalCents:items.reduce((sum,item)=>sum+item.amountCents,0)};
}
const node=(tag,className='',value='')=>{
 const item=document.createElement(tag);
 if(className)item.className=className;
 if(value!==undefined)item.textContent=String(value);
 return item;
};
const money=number=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(number/100);
const dateLabel=date=>date.split('-').reverse().join('/');
function makeLine(icon,label,value,highlight=false){
 const line=node('div','ai-preview-line'+(highlight?' is-total':''));
 const mark=node('span','ai-preview-line-icon');mark.innerHTML=svg(icon);
 line.append(mark,node('span','ai-preview-line-label',label),node('strong','ai-preview-line-value',value));
 return line;
}
export function renderProposalPreview(container,proposal,format=money){
 const {items,totalCents}=proposalSchedule(proposal);
 container.replaceChildren();
 const rows=node('div','ai-preview-lines');
 rows.append(
  makeLine('text','Descrição',proposal.description||'Não informado'),
  makeLine('coins',proposal.mode==='installment'?'Valor total do parcelamento':'Valor por título',format(proposal.amountCents)),
  makeLine('calendar','Primeiro vencimento',dateLabel(proposal.due)),
  makeLine('repeat','Periodicidade',proposal.mode==='recurring'?'Mensal':proposal.mode==='installment'?'Parcelado':'Único'),
  makeLine('layers','Quantidade',items.length+' '+(items.length===1?'título':'títulos')),
  makeLine('calculator','Total',format(totalCents),true)
 );
 const schedule=document.createElement('details');schedule.id='ai-due-details';schedule.className='ai-due-details';schedule.open=true;
 const heading=node('summary','ai-due-summary');heading.innerHTML=svg('calendar')+'<span>Detalhes e vencimentos</span><span class="ai-due-chevron" aria-hidden="true">⌄</span>';
 schedule.append(heading);
 const list=node('div','ai-due-list');
 for(const item of items){
  const row=node('div','ai-due-row');
  row.append(node('span','ai-due-index',item.sequence+'/'+item.count),
   node('time','ai-due-date',dateLabel(item.due)),node('strong','ai-due-amount',format(item.amountCents)));
  row.querySelector('time').dateTime=item.due;
  list.append(row);
 }
 schedule.append(list);
 const hint=node('div','ai-preview-alert');
 const info=node('span','ai-preview-line-icon');info.innerHTML=svg('info');
 const meaning=node('span','','Ao confirmar, '+items.length+' '+(items.length===1?'título será gravado':'títulos serão gravados')+' na sua conta GB+. O saldo não será alterado até a baixa.');
 hint.append(info,meaning);
 container.append(rows,schedule,hint);
 return {items,totalCents};
}
export function validateEditedProposal(draft){
 const text=String(draft?.description||'').trim();
 const amount=Number(draft?.amountCents),count=Number(draft?.count);
 if(!text||text.length>300)throw Error('Informe uma descrição de até 300 caracteres.');
 if(!Number.isSafeInteger(amount)||amount<=0||amount>1e12)throw Error('Informe um valor positivo válido.');
 const changed={...draft,description:text,amountCents:amount,count};
 proposalSchedule(changed);
 return changed;
}
export const proposalModeLabel=mode=>labels[mode]||'Lançamento';
