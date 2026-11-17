import {openThermalReceipt} from './thermal-receipt-rc16.js?v=1.2.0-rc.5';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n||0)/100);
const header='{restaurante}\n{razao_social}\nCNPJ: {cnpj}\n{endereco}\nTelefone: {telefone}\n{dados_extras}';
export function defaultPrintModel(kind){return {title:kind==='cash'?'COMANDA':'PEDIDO · COZINHA',header,details:kind==='cash'?'{mesa}\nPedido: #{pedido}\nAberto: {data}\nStatus: {status}':'Mesa: {mesa}\nComanda: #{pedido}\nRodada: {rodada}\nStatus: {status}',footer:kind==='cash'?'Obrigado pela preferência!':'Pedido interno · Impressão manual',total_label:'Total',received_label:'Recebido',balance_label:'Saldo',round_label:'Rodada',note_label:'Obs:',show_rounds:kind==='cash',separators:true,notice:kind==='cash'?'DOCUMENTO NÃO FISCAL · Não substitui nota fiscal ou comprovante bancário.':'PEDIDO INTERNO · NÃO FISCAL',sample_notice:'AMOSTRA · Sem pedido real',item_format:'{qtd} × {produto}',price_format:'{valor_item}',show_notes:true,show_prices:kind==='cash',show_total:kind==='cash',show_received:kind==='cash',show_balance:kind==='cash',receipt_title:'RECIBO DE PAGAMENTO',receipt_details:'Recebimento: {forma_pagamento}\nValor pago: {valor_pagamento}\nRegistro: {registro_pagamento}\nData: {data_pagamento}',pix_title:'PAGAMENTO PIX',pix_details:'Valor a pagar: {valor_pagamento}\nRecebedor: {recebedor_pix}\nEscaneie o QR Code. Aguardando confirmação.'}}
export function normalizePrintConfig(response={},restaurant={}){
 const b=response.business??{},c=response.config??{};
 const address=[[b.street,b.address_number].filter(Boolean).join(', '),b.neighborhood,[b.city,b.state].filter(Boolean).join(' - '),b.postal_code?'CEP '+b.postal_code:''].filter(Boolean).join(' · ');
 const pick=(base,saved)=>Object.fromEntries(Object.entries(base).map(([k,v])=>[k,typeof saved?.[k]===typeof v?saved[k]:v]));
 return {business:pick({name:b.name||restaurant.name||'Restaurante',legal_name:'',cnpj:'',address,phone:b.phone||'',extra:''},c.business),cash:pick(defaultPrintModel('cash'),c.cash),kitchen:pick(defaultPrintModel('kitchen'),c.kitchen)};
}
export async function printRequest(supabase,restaurant,action='print_config',config){
 const {data,error}=await supabase.functions.invoke('restaurant-core',{body:{restaurant_id:restaurant.id,action,...(config?{config}:{})}});
 if(error||data?.error){let msg=data?.error??error?.message??'Não foi possível acessar o modelo.';try{msg=(await error?.context?.json?.())?.error??msg}catch{}throw Error(msg)}
 return data;
}
const methods={pix_recorded:'Pix',credit_recorded:'Cartão de crédito',debit_recorded:'Cartão de débito',cash:'Dinheiro',other_recorded:'Outro'};
const names={open:'Aberta',closed:'Encerrada',cancelled:'Cancelada',submitted:'Enviado',pending:'Pendente',preparing:'Em preparo',ready:'Pronto',served:'Servido',paid:'Pago'};
function date(value,tz){if(!value)return '';try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:tz||'America/Sao_Paulo'}).format(new Date(value))}catch{return String(value)}}
export function resolveLines(text,values){
 return String(text??'').split(/\r?\n/).map(line=>{
  const tokens=[...line.matchAll(/\{([a-z_]+)\}/g)];
  if(tokens.length&&tokens.every(t=>Object.hasOwn(values,t[1])&&!String(values[t[1]]??'').trim()))return '';
  return line.replace(/\{([a-z_]+)\}/g,(full,key)=>Object.hasOwn(values,key)?String(values[key]??''):full).trim();
 }).flatMap(line=>line.split(/\r?\n/).map(x=>x.trim())).filter(Boolean);
}
export function buildReceipt(config,kind,data={}){
 const m=config[kind],b=config.business,items=(data.items??[]).filter(x=>x.status!=='cancelled');
 const total=items.reduce((n,i)=>n+Number(i.unit_price_cents||0)*Number(i.quantity||0),0),received=Number(data.received||0);
 const values={restaurante:b.name,razao_social:b.legal_name,cnpj:b.cnpj,endereco:b.address,telefone:b.phone,dados_extras:b.extra,mesa:data.table||'Mesa',pedido:data.id||'',data:date(data.opened_at,data.timezone),emissao:date(data.printed_at??new Date(),data.timezone),status:names[data.status]??data.status??'',rodada:data.round??'',quantidade:items.reduce((n,i)=>n+Number(i.quantity||0),0),total:money(total),recebido:money(received),saldo:money(Math.max(0,total-received)),forma_pagamento:data.receipt?methods[data.receipt.method]??data.receipt.method:data.pix?'Pix':'',valor_pagamento:data.receipt||data.pix?money((data.receipt??data.pix).amount_cents):'',registro_pagamento:data.receipt?.id??'',data_pagamento:date(data.receipt?.at,data.timezone),recebedor_pix:data.pix?.recipient_name??''};
 const rule=m.separators?'<hr>':'',lines=(str,center=false,heading=false)=>resolveLines(str,values).map((line,i)=>heading&&i===0?'<h1>'+esc(line)+'</h1>':'<p'+(center?' style="text-align:center"':'')+'>'+esc(line)+'</p>').join('');
 const title=resolveLines(data.receipt?m.receipt_title:data.pix?m.pix_title:m.title,values).map(x=>'<h2 style="text-align:center">'+esc(x)+'</h2>').join('');
 const groups=new Map();for(const item of items){const n=Number(item.round_no||data.round||1);if(!groups.has(n))groups.set(n,[]);groups.get(n).push(item)}
 const ordered=m.show_rounds?[...groups.entries()].sort((a,b)=>a[0]-b[0]):[[null,items]];
 const itemValues=i=>({...values,qtd:i.quantity,produto:i.product_name,valor_unitario:money(i.unit_price_cents),valor_item:money(Number(i.unit_price_cents||0)*Number(i.quantity||0)),observacao:m.show_notes?i.note??'':''});
 const itemText=(format,i)=>resolveLines(format,itemValues(i)).map(esc).join('<br>');
 const note=i=>m.show_notes&&i.note&&!m.item_format.includes('{observacao}')?esc((m.note_label?m.note_label+' ':'')+i.note):'';
 const label=(text,v)=>text?esc(text)+' '+v:v;
 const totalLine=(visible,text,v,bold=false)=>visible?'<p>'+label(text?text+':':'',bold?'<b>'+money(v)+'</b>':money(v))+'</p>':'';
 const totalLines=totalLine(m.show_total,m.total_label,total,true)+totalLine(m.show_received,m.received_label,received)+totalLine(m.show_balance,m.balance_label,Math.max(0,total-received));
 const roundText=r=>label(m.round_label,esc(r));
 const products=m.show_prices?'<table>'+ordered.map(([r,rows])=>(r!==null?'<tr><td colspan="2">'+roundText(r)+'</td></tr>':'')+rows.map(i=>'<tr><td>'+itemText(m.item_format,i)+(note(i)?'<br><small>'+note(i)+'</small>':'')+'</td><td>'+itemText(m.price_format,i)+'</td></tr>').join('')).join('')+'</table>':ordered.map(([r,rows])=>(r!==null?'<p><b>'+roundText(r)+'</b></p>':'')+rows.map(i=>'<p class="item">'+itemText(m.item_format,i)+(note(i)?'<span class="note">'+note(i)+'</span>':'')+'</p>').join('')).join('');
 const notices=str=>resolveLines(str,values).map(x=>'<small>'+esc(x)+'</small>').join('');
 return lines(m.header,true,true)+title+rule+lines(m.details)+lines(data.receipt?m.receipt_details:data.pix?m.pix_details:'')+rule+products+(totalLines?'<div class="totals">'+totalLines+'</div>':'')+rule+lines(m.footer,true)+notices(m.notice)+(data.sample?notices(m.sample_notice):'');
}
export function sampleReceipt(config,kind,timezone){return buildReceipt(config,kind,{id:'TESTE-001',table:'Mesa 04',opened_at:new Date(),timezone,status:'open',round:1,items:[{quantity:1,product_name:'X-Burger',unit_price_cents:1950,round_no:1,note:'Sem cebola'},{quantity:2,product_name:'Suco de laranja',unit_price_cents:700,round_no:1}],received:0,sample:true})}
export async function printConfigured({supabase,restaurant,kind,data,popup:existingPopup,qrMatrix}){
 const popup=existingPopup??window.open('','_blank');if(!popup){alert('Autorize pop-ups para abrir a prévia de impressão.');return}
 popup.document.title='Preparando impressão';popup.document.body.textContent='Preparando o cupom…';
 let result,warning=data.pix?'Cobrança Pix estática: confira o destinatário e o valor no banco. Não comprova recebimento e pode ser paga novamente; não reutilize.':data.receipt?'Recebimento registrado manualmente. Não é comprovante bancário.':'';try{result=await printRequest(supabase,restaurant)}catch{result={};warning+=' Não foi possível consultar o modelo salvo. Esta prévia usa o modelo padrão; confira antes de imprimir.'}
 if(popup.closed)return;
 openThermalReceipt({popup,title:data.receipt?'Recibo · Intervalo':data.pix?'Cobrança Pix · Intervalo':kind==='cash'?'Comanda · Intervalo':'Pedido cozinha · Intervalo',qrMatrix,content:buildReceipt(normalizePrintConfig(result,restaurant),kind,{...data,timezone:result.business?.timezone}),warning});
}
