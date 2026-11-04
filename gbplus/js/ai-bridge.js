// GB+ AI: same-origin, authenticated bridge to financial data already loaded in GB+.
// Read operations are pure; title creation uses the normal app commit pipeline.
// This file is dynamically imported: if it fails, the finance UI remains available.
import {balance,accountBalance,pending,paid,today,generateTitles} from './domain.js';

const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n/100);
const dateLabel=d=>new Date(d+'T12:00:00').toLocaleDateString('pt-BR');
const normalize=s=>String(s||'').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const sum=(rows,fn)=>rows.reduce((n,row)=>n+fn(row),0);
const monthOf=(s,base)=>{if(!/(mes passado|ultimo mes|mes anterior)/.test(s))return base.slice(0,7);const d=new Date(base+'T12:00:00');d.setDate(1);d.setMonth(d.getMonth()-1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');};
function nextDay(date){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function line(t,db){const partner=db.partners.find(p=>p.id===t.partnerId)?.name;return '• '+t.description+(partner?' ('+partner+')':'')+' — '+money(pending(db,t))+' — '+dateLabel(t.due);}
function list(db,rows,title,limit=8){
 if(!rows.length)return 'Não encontrei '+title.toLowerCase()+' nos registros da sua conta GB+.';
 const sorted=[...rows].sort((a,b)=>a.due.localeCompare(b.due));
 return title+': '+rows.length+' título(s), '+money(sum(rows,t=>pending(db,t)))+' pendentes.\n'+sorted.slice(0,limit).map(t=>line(t,db)).join('\n')+(sorted.length>limit?'\n… e mais '+(sorted.length-limit)+' título(s).':'');
}
function summarizeBy(db,rows,key){
 const groups=new Map();
 for(const t of rows){const name=key==='partner'?db.partners.find(p=>p.id===t.partnerId)?.name||'Sem parceiro':db.categories.find(c=>c.id===t.categoryId)?.name||'Sem categoria';groups.set(name,(groups.get(name)||0)+pending(db,t));}
 return [...groups.entries()].sort((a,b)=>b[1]-a[1]);
}
const formatGroups=(groups,heading)=>!groups.length?'Não encontrei '+heading.toLowerCase()+' na sua conta GB+.':heading+':\n'+groups.slice(0,10).map(([name,amount])=>'• '+name+': '+money(amount)).join('\n')+(groups.length>10?'\n… e mais '+(groups.length-10)+' grupos.':'');
export function answerFromDb(db,query){
 const s=normalize(query),day=today(),month=monthOf(s,day);
 const open=db.titles.filter(t=>!t.cancelled&&pending(db,t)>0);
 const payable=open.filter(t=>t.type==='expense'),receivable=open.filter(t=>t.type==='income');
 const payableTotal=sum(payable,t=>pending(db,t)),receivableTotal=sum(receivable,t=>pending(db,t));
 const bank=balance(db),available=bank-payableTotal;
 const payments=db.payments.filter(p=>p.date.startsWith(month));
 const typeFor=p=>db.titles.find(t=>t.id===p.titleId)?.type;
 const spent=sum(payments.filter(p=>typeFor(p)==='expense'),p=>p.amount);
 const received=sum(payments.filter(p=>typeFor(p)==='income'),p=>p.amount);
 const period=month.slice(5,7)+'/'+month.slice(0,4);
 if(!s)return 'Me diga o que gostaria de consultar no GB+.';
 if(/^(oi|ola|bom dia|boa tarde|boa noite|opa|tudo bem)$/.test(s))return 'Olá! Posso consultar os dados reais da sua conta GB+: saldo, contas a pagar e receber, vencimentos, clientes e relatórios financeiros.';
 if(/^(que dia e hoje|qual e a data de hoje|hoje e que dia|qual dia e hoje)$/.test(s))return 'Hoje é '+new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date())+'.';
 if(/(ia de verdade|inteligencia artificial|voce e uma ia|voce e robo|como funciona essa ia)/.test(s))return 'Estou conectado aos registros reais da sua conta GB+ e faço consultas financeiras calculadas pelo próprio sistema. Minha interpretação de mensagens ainda é baseada em regras; a IA generativa externa só funciona quando o serviço de IA estiver ativado.';
 if(/^(o que voce faz|o que vc faz|me ajuda|ajuda|como pode ajudar|o que consegue fazer)$/.test(s))return 'Estou conectado aos seus dados GB+. Posso consultar saldos, contas a pagar e receber, vencimentos, resultados, categorias, parceiros e maiores despesas. Também preparo lançamentos para sua confirmação.';
 if(/(?:contas?|titulos?|boletos?|pagamentos?) (?:em atraso|atrasad|vencid)|o que esta atrasad|tenho (?:algo|contas?) atrasad|inadimplen/.test(s))return list(db,open.filter(t=>t.due<day),'Títulos vencidos');
 if(/(?:amanha|proximo dia)/.test(s)&&/(?:vence|vencem|venciment|conta|titulo|boleto)/.test(s))return list(db,open.filter(t=>t.due===nextDay(day)),'Vencimentos de amanhã');
 if(/hoje/.test(s)&&/(?:vence|vencem|venciment|conta|titulo|boleto)/.test(s))return list(db,open.filter(t=>t.due===day),'Vencimentos de hoje');
 if(/(?:venc|boleto|contas?|titulos?)/.test(s)&&/(?:mes|mensal)/.test(s))return list(db,open.filter(t=>t.due.startsWith(month)),'Vencimentos de '+period);
 if(/(?:venciment|proximas contas|proximos titulos|vai vencer|a vencer)/.test(s))return list(db,open.filter(t=>t.due>=day),'Próximos vencimentos');
 if(/(quais sao meus clientes|quais clientes tenho|quantos clientes|listar clientes)/.test(s)){
  const clients=db.partners.filter(p=>p.roles?.includes('Cliente'));
  return clients.length?'Clientes cadastrados: '+clients.length+'.\n'+clients.slice(0,12).map(p=>'• '+p.name).join('\n')+(clients.length>12?'\n… e mais '+(clients.length-12)+' clientes.':''):'Não há clientes cadastrados na sua conta GB+.';
 }
 if(/(quais sao meus fornecedores|quantos fornecedores|listar fornecedores)/.test(s)){
  const suppliers=db.partners.filter(p=>p.roles?.includes('Fornecedor'));
  return suppliers.length?'Fornecedores cadastrados: '+suppliers.length+'.\n'+suppliers.slice(0,12).map(p=>'• '+p.name).join('\n')+(suppliers.length>12?'\n… e mais '+(suppliers.length-12)+' fornecedores.':''):'Não há fornecedores cadastrados na sua conta GB+.';
 }
 const partnerMention=db.partners.find(p=>p.name&&normalize(p.name).length>=4&&s.includes(normalize(p.name)));
 if(partnerMention&&/(quanto|valor|saldo|devo|devendo|a pagar|receber|pendencias|pendente)/.test(s)){
  const debts=open.filter(t=>t.partnerId===partnerMention.id);
  const type=/(me deve|receber|cliente|a receber)/.test(s)?'income':/(pagar|devo|fornecedor|despesa)/.test(s)?'expense':null;
  return list(db,type?debts.filter(t=>t.type===type):debts,'Títulos em aberto de '+partnerMention.name);
 }
 if(/(?:maior despesa|maiores despesas|mais caro|onde gasto mais)/.test(s)){
   const expenses=db.titles.filter(t=>t.type==='expense'&&!t.cancelled).sort((a,b)=>b.amount-a.amount);
   return expenses.length?'Maiores despesas cadastradas (valor do título):\n'+expenses.slice(0,5).map(t=>'• '+t.description+' — '+money(t.amount)+' — '+dateLabel(t.due)).join('\n'):'Ainda não há despesas cadastradas.';
 }
 if(/(?:quanto gastei|quanto paguei|despesas pagas|total pago|gastos? (?:de|do|deste|no) mes|gastei no mes)/.test(s))return 'Despesas efetivamente pagas em '+period+': '+money(spent)+'. Conto apenas baixas registradas no GB+.';
 if(/(?:quanto recebi|recebimentos do mes|receitas recebidas|total recebido|recebi no mes)/.test(s))return 'Receitas efetivamente recebidas em '+period+': '+money(received)+'. Conto apenas baixas registradas.';
 if(/(?:resultado financeiro|resultado do mes|lucro|superavit|deficit|gastei mais do que recebi|recebi mais do que gastei)/.test(s))return 'Resultado financeiro de '+period+': '+money(received-spent)+' (recebido '+money(received)+' menos pago '+money(spent)+'). Isso não é necessariamente lucro contábil.';
 if(/(?:saldo por banco|saldos? das contas|saldo de cada conta|saldo por conta|contas bancarias|quais bancos)/.test(s)){
   return db.accounts.length?'Saldos calculados das suas contas:\n'+db.accounts.map(a=>'• '+a.name+': '+money(accountBalance(db,a.id,day))).join('\n'):'Não há contas bancárias cadastradas.';
 }
 if(/(?:projet|previs|futur)/.test(s)&&/(?:saldo|caixa|dinheiro|valor)/.test(s))return 'Saldo projetado simplificado: '+money(bank-payableTotal+receivableTotal)+' = saldo atual '+money(bank)+' − contas a pagar '+money(payableTotal)+' + contas a receber '+money(receivableTotal)+'. As datas dos pagamentos e recebimentos não foram consideradas.';
 if(/(?:disponivel|quanto posso gastar|dinheiro livre|sobra pra gastar|sobra para gastar)/.test(s))return 'Saldo bancário: '+money(bank)+'. Após reservar '+money(payableTotal)+' de contas a pagar, sobram '+money(available)+'. É uma estimativa financeira, não uma autorização para gastar.';
 if(/(?:quanto|qual|mostrar|ver|consultar|tenho|meu|atual).*saldo|saldo.*(?:atual|total|bancario)|tenho no banco|tenho em caixa/.test(s))return 'Saldo atual calculado das contas bancárias cadastradas no GB+: '+money(bank)+'. Considera saldos iniciais, baixas e transferências.';
 if(/(?:por fornecedor|por parceiro|quem devo|quem eu devo)/.test(s)&&/(?:despesa|pagar|devo|fornecedor|parceiro)/.test(s))return formatGroups(summarizeBy(db,payable,'partner'),'Contas a pagar por parceiro');
 if(/(?:por cliente|quem me deve|clientes? devendo|clientes? em aberto)/.test(s))return formatGroups(summarizeBy(db,receivable,'partner'),'Contas a receber por cliente');
 if(/(?:por categoria|categorias? com|categoria)/.test(s)&&/(?:despesa|gasto|pagar|receita|receber)/.test(s)){
   const type=/receita|receber/.test(s)?'income':'expense';
   return formatGroups(summarizeBy(db,type==='income'?receivable:payable,'category'),(type==='income'?'Receitas':'Despesas')+' em aberto por categoria');
 }
 if(/(?:a receber|contas? a receber|recebiveis|clientes? me devem|valores? para receber)/.test(s)){
   if(/(?:quais|listar|mostr|relac|detalh|cliente|titulos?)/.test(s))return list(db,receivable,'Contas a receber');
   return 'Total real em contas a receber em aberto no GB+: '+money(receivableTotal)+' ('+receivable.length+' títulos). Não é dinheiro já disponível em banco.';
 }
 if(/(?:a pagar|contas? a pagar|devo pagar|despesas? em aberto|boletos? em aberto)/.test(s)){
   if(/(?:quais|listar|mostr|relac|detalh|fornecedor|titulos?)/.test(s))return list(db,payable,'Contas a pagar');
   return 'Total real de contas a pagar em aberto no GB+: '+money(payableTotal)+' ('+payable.length+' títulos).';
 }
 if(/(?:resumo|visao geral|situacao financeira|como esta meu financeiro|painel financeiro)/.test(s))return 'Resumo financeiro do GB+:\n• Saldo bancário: '+money(bank)+'\n• A receber: '+money(receivableTotal)+'\n• A pagar: '+money(payableTotal)+'\n• Recebido em '+period+': '+money(received)+'\n• Pago em '+period+': '+money(spent)+'\n• Resultado do mês: '+money(received-spent)+'.';
 if(/(?:quantos titulos|quantas contas|total de lancamentos|titulos cadastrados)/.test(s))return 'Você tem '+db.titles.length+' título(s) cadastrados, sendo '+open.length+' com saldo em aberto, '+open.filter(t=>t.due<day).length+' vencidos e '+db.titles.filter(t=>t.cancelled).length+' cancelados.';
 if(/(?:listar|mostrar|quais|ver).*(?:titulos|lancamentos|contas)/.test(s))return list(db,open,'Lançamentos em aberto');
 return null;
}
export function installAiBridge({getDb,getUser,getRepository,commit}){
 const frame=document.querySelector('.gb-ai-widget iframe'),widget=document.querySelector('.gb-ai-widget');
 if(!frame||!widget)return;
 const completed=new Map(),inFlight=new Set();
 function ready(){return !!(getUser()?.id&&getDb()&&getRepository());}
 function profile(){
  if(!frame.contentWindow)return;
  const user=getUser();
  const name=String(user?.user_metadata?.full_name||user?.user_metadata?.name||user?.user_metadata?.display_name||user?.email?.split('@')[0]||'').trim().split(/\s+/)[0].slice(0,40);
  frame.contentWindow.postMessage({kind:'gbplus-ai-profile',name,userId:user?.id||null,realData:ready(),writeEnabled:ready()&&navigator.onLine},location.origin);
 }
 const reply=(target,kind,requestId,data)=>{try{target.postMessage({kind,requestId,...data},location.origin);}catch(error){console.warn('GB+ AI reply unavailable',error);}};
 async function receive(event){
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  const data=event.data;
  if(!data||typeof data.kind!=='string')return;
  if(data.kind==='gbplus-ai-request-profile'){profile();return;}
  if(!['gbplus-ai-query','gbplus-ai-create-title'].includes(data.kind)||typeof data.requestId!=='string'||data.requestId.length>90)return;
  if(!ready()){reply(event.source,data.kind==='gbplus-ai-query'?'gbplus-ai-query-result':'gbplus-ai-create-result',data.requestId,{ok:false,message:'A conta GB+ ainda não carregou. Entre na sua conta e reabra o assistente.'});return;}
  if(data.kind==='gbplus-ai-query'){
   const q=typeof data.text==='string'?data.text:typeof data.query==='string'?data.query:'';
   try{
    if(q.length>500)throw Error('Pergunta muito longa. Resuma em até 500 caracteres.');
    const answer=answerFromDb(getDb(),q);
    reply(event.source,'gbplus-ai-query-result',data.requestId,{ok:!!answer,message:answer?'':'Não entendi essa consulta. Posso mostrar saldos, vencimentos, contas por cliente/fornecedor, categorias e resultados.',answer:answer||undefined});
   }catch(error){reply(event.source,'gbplus-ai-query-result',data.requestId,{ok:false,message:error.message||'Falha ao consultar seu financeiro.'});}
   return;
  }
  if(completed.has(data.requestId)){reply(event.source,'gbplus-ai-create-result',data.requestId,{ok:true,message:completed.get(data.requestId)});return;}
  if(inFlight.has(data.requestId))return;
  if(!navigator.onLine){reply(event.source,'gbplus-ai-create-result',data.requestId,{ok:false,message:'Sem conexão. Para criar títulos é necessário estar online.'});return;}
  const p=data.proposal,db=getDb();
  if(!p||!['expense','income'].includes(p.type)||!['single','recurring','installment'].includes(p.mode)||typeof p.description!=='string'||!p.description.trim()||p.description.length>300||!Number.isSafeInteger(p.amountCents)||p.amountCents<1||typeof p.due!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(p.due)||!Number.isInteger(p.count)||p.count<1||p.count>120){
   reply(event.source,'gbplus-ai-create-result',data.requestId,{ok:false,message:'Prévia inválida. Confira tipo, descrição, valor, vencimento e quantidade.'});return;
  }
  const name=p.description.trim(),lower=s=>s.toLocaleLowerCase('pt-BR');
  const category=db.categories.find(c=>c.type===p.type&&lower(c.name)===lower(name))||
    db.categories.find(c=>c.type===p.type&&/outras (despesas|receitas)/i.test(c.name))||
    db.categories.find(c=>c.type===p.type);
  if(!category){reply(event.source,'gbplus-ai-create-result',data.requestId,{ok:false,message:'Não há categoria cadastrada para esse tipo de título.'});return;}
  const partnerName=typeof p.partner==='string'?p.partner.trim():'';
  const partner=partnerName?db.partners.find(x=>lower(x.name)===lower(partnerName)):null;
  if(partnerName&&!partner){reply(event.source,'gbplus-ai-create-result',data.requestId,{ok:false,message:'Parceiro “'+partnerName.slice(0,70)+'” não encontrado. Cadastre-o no GB+ ou retire-o da prévia.'});return;}
  inFlight.add(data.requestId);
  try{
   const titles=generateTitles({type:p.type,description:name,categoryId:category.id,partnerId:partner?.id||'',document:'',issue:today(),due:p.due,amount:p.amountCents,accountId:'',notes:'Criado pelo GB+ AI após confirmação expressa.'},p.mode,p.mode==='single'?1:p.count);
   await commit(d=>{d.titles.push(...titles);},'Lançamento criado pelo GB+ AI.');
   const message=titles.length+' título(s) salvos na sua conta GB+ ('+category.name+'). Verifique em Lançamentos.';
   completed.set(data.requestId,message);
   if(completed.size>50)completed.delete(completed.keys().next().value);
   reply(event.source,'gbplus-ai-create-result',data.requestId,{ok:true,message});
  }catch(error){reply(event.source,'gbplus-ai-create-result',data.requestId,{ok:false,message:error?.message||'Não foi possível confirmar a gravação. Confira os títulos antes de tentar novamente.'});}
  finally{inFlight.delete(data.requestId);}
 }
 window.addEventListener('message',event=>{receive(event).catch(error=>console.error('GB+ AI error',error));});
 frame.addEventListener('load',profile);
 widget.addEventListener('toggle',()=>{if(widget.open)profile();});
 window.addEventListener('gbplus-ai-ready',profile);
 if(frame.contentWindow)profile();
}
