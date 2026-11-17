import {openThermalReceipt} from './thermal-receipt-rc16.js?v=1.2.0-rc.2';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n||0)/100);
const header='{restaurante}\n{razao_social}\nCNPJ: {cnpj}\n{endereco}\nTelefone: {telefone}\n{dados_extras}';
export function defaultPrintModel(kind){return {title:kind==='cash'?'COMANDA':'PEDIDO · COZINHA',header,details:kind==='cash'?'{mesa}\nPedido: #{pedido}\nAberto: {data}\nStatus: {status}':'Mesa: {mesa}\nComanda: #{pedido}\nRodada: {rodada}\nStatus: {status}',footer:kind==='cash'?'Obrigado pela preferência!':'Pedido interno · Impressão manual',total_label:'Total',received_label:'Recebido',balance_label:'Saldo',round_label:'Rodada',note_label:'Obs:',show_rounds:kind==='cash',separators:true}}
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
const names={open:'Aberta',closed:'Encerrada',cancelled:'Cancelada',submitted:'Enviado',pending:'Pendente',preparing:'Em preparo',ready:'Pronto',served:'Servido',paid:'Pago'};
function date(value,tz){if(!value)return '';try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:tz||'America/Sao_Paulo'}).format(new Date(value))}catch{return String(value)}}
export function resolveLines(text,values){
 return String(text??'').split(/\r?\n/).map(line=>{
  const tokens=[...line.matchAll(/\{([a-z_]+)\}/g)];
  if(tokens.length&&tokens.every(t=>Object.hasOwn(values,t[1])&&!String(values[t[1]]??'').trim()))return '';
  return line.replace(/\{([a-z_]+)\}/g,(full,key)=>Object.hasOwn(values,key)?String(values[key]??''):full).trim();
 }).filter(Boolean);
}
export function buildReceipt(config,kind,data={}){
 const m=config[kind],b=config.business,items=(data.items??[]).filter(x=>x.status!=='cancelled');
 const total=items.reduce((n,i)=>n+Number(i.unit_price_cents||0)*Number(i.quantity||0),0),received=Number(data.received||0);
 const values={restaurante:b.name,razao_social:b.legal_name,cnpj:b.cnpj,endereco:b.address,telefone:b.phone,dados_extras:b.extra,mesa:data.table||'Mesa',pedido:data.id||'',data:date(data.opened_at,data.timezone),emissao:date(data.printed_at??new Date(),data.timezone),status:names[data.status]??data.status??'',rodada:data.round??'',quantidade:items.reduce((n,i)=>n+Number(i.quantity||0),0)};
 const rule=m.separators?'<hr>':'',lines=(str,center=false,heading=false)=>resolveLines(str,values).map((line,i)=>heading&&i===0?'<h1>'+esc(line)+'</h1>':'<p'+(center?' style="text-align:center"':'')+'>'+esc(line)+'</p>').join('');
 const title=resolveLines(m.title,values).map(x=>'<h2 style="text-align:center">'+esc(x)+'</h2>').join('');
 const groups=new Map();for(const item of items){const n=Number(item.round_no||data.round||1);if(!groups.has(n))groups.set(n,[]);groups.get(n).push(item)}
 const ordered=m.show_rounds?[...groups.entries()].sort((a,b)=>a[0]-b[0]):[[null,items]];
 const note=i=>esc((m.note_label?m.note_label+' ':'')+i.note);
 const products=kind==='cash'?'<table>'+ordered.map(([r,rows])=>(r!==null?'<tr><td colspan="2">'+esc((m.round_label||'Rodada')+' '+r)+'</td></tr>':'')+rows.map(i=>'<tr><td>'+esc(i.quantity)+' × '+esc(i.product_name)+(i.note?'<br><small>'+note(i)+'</small>':'')+'</td><td>'+money(Number(i.unit_price_cents||0)*Number(i.quantity||0))+'</td></tr>').join('')).join('')+'</table><div class="totals"><p>'+esc(m.total_label||'Total')+': <b>'+money(total)+'</b></p><p>'+esc(m.received_label||'Recebido')+': '+money(received)+'</p><p>'+esc(m.balance_label||'Saldo')+': '+money(Math.max(0,total-received))+'</p></div>':ordered.map(([r,rows])=>(r!==null?'<p><b>'+esc((m.round_label||'Rodada')+' '+r)+'</b></p>':'')+rows.map(i=>'<p class="item">'+esc(i.quantity)+' × '+esc(i.product_name)+(i.note?'<span class="note">'+note(i)+'</span>':'')+'</p>').join('')).join('');
 return lines(m.header,true,true)+title+rule+lines(m.details)+rule+products+rule+lines(m.footer,true)+'<small>'+(kind==='cash'?'DOCUMENTO NÃO FISCAL · Não substitui nota fiscal ou comprovante bancário.':'PEDIDO INTERNO · NÃO FISCAL')+'</small>';
}
export function sampleReceipt(config,kind,timezone){return buildReceipt(config,kind,{id:'TESTE-001',table:'Mesa 04',opened_at:new Date(),timezone,status:'open',round:1,items:[{quantity:1,product_name:'X-Burger',unit_price_cents:1950,round_no:1,note:'Sem cebola'},{quantity:2,product_name:'Suco de laranja',unit_price_cents:700,round_no:1}],received:0})+'<small>AMOSTRA · Sem pedido real</small>'}
export async function printConfigured({supabase,restaurant,kind,data}){
 const popup=window.open('','_blank');if(!popup){alert('Autorize pop-ups para abrir a prévia de impressão.');return}
 popup.document.title='Preparando impressão';popup.document.body.textContent='Preparando o cupom…';
 let result,warning='';try{result=await printRequest(supabase,restaurant)}catch{result={};warning='Não foi possível consultar o modelo salvo. Esta prévia usa o modelo padrão; confira antes de imprimir.'}
 if(popup.closed)return;
 openThermalReceipt({popup,title:kind==='cash'?'Comanda · Intervalo':'Pedido cozinha · Intervalo',content:buildReceipt(normalizePrintConfig(result,restaurant),kind,{...data,timezone:result.business?.timezone}),warning});
}
