// Intervalo — caixa: apenas registros de recebimentos externos, sem integração com adquirentes.
import {icon} from './ui-icons.js?v=1.0.0-rc.1';
import {menuButtonMarkup} from './global-navigation-rc7.js?v=1.2.0-rc.7';
import {sheetifyForms,showFormSheetError} from './operational-sheets-rc15.js?v=1.0.0-rc.15';
import {printConfigured} from './print-template-rc2.js?v=1.2.0-rc.5';
export async function renderPage({supabase,restaurant,box,esc,link}){
 document.body.classList.add('iv-fullwidth','iv-pos','iv-cash-v2');
 const css="<style>\nbody.iv-cash-v2{background:#f5f6f8;color:#263247}body.iv-cash-v2>header,body.iv-cash-v2>.foot{display:none}\nbody.iv-cash-v2 #app>.wrap{padding:0 0 32px!important;max-width:none!important}\n.iv-cash-app{max-width:760px;margin:auto;min-height:calc(100dvh - 32px);font-size:14px;color:#263247}\n.iv-cash-app *{box-sizing:border-box}.iv-cash-app button,.iv-cash-app input,.iv-cash-app select{font-family:inherit}\n.iv-cash-head{position:sticky;top:0;z-index:4;display:flex;align-items:center;gap:12px;padding:16px 16px 14px;background:white;border-bottom:1px solid #e9edf2}.iv-cash-head h1{font-size:23px;letter-spacing:-.6px;line-height:1.15;color:#263247;margin:0!important;font-weight:780}.iv-cash-head p{margin:3px 0 0!important;font-size:12px;color:#8290a0}.iv-cash-head-copy{flex:1;min-width:0}.iv-cash-icon-btn{display:grid;place-items:center;width:42px;height:42px;flex:none;border:0;background:transparent;color:#263247;border-radius:11px;padding:0}.iv-cash-icon-btn:hover{background:#f4f6f8}.iv-cash-head>a.iv-cash-icon-btn{color:#8290a0}.iv-cash-menu{position:relative}.iv-cash-menu summary{list-style:none;cursor:pointer}.iv-cash-menu summary::-webkit-details-marker{display:none}.iv-cash-menu-pop{position:absolute;top:47px;left:0;width:200px;padding:6px;background:#fff;border:1px solid #e2e8ef;border-radius:12px;box-shadow:0 5px 20px #2030471a}.iv-cash-menu-pop a,.iv-cash-menu-pop button{display:flex;align-items:center;gap:9px;width:100%;text-align:left;padding:11px 8px;border:0;background:transparent;border-radius:8px;color:#344359;font-size:13px}\n.iv-cash-content{padding:14px 14px 24px;display:grid;gap:13px}.iv-cash-card{background:white;border:1px solid #e4e9ef;border-radius:17px;padding:16px;margin:0;min-width:0}.iv-cash-card h2,.iv-cash-content>h2{margin:0!important;font-size:16px;line-height:1.3;color:#263247}.iv-cash-content>h2{padding:1px 2px;font-size:15px}.iv-cash-session-top,.iv-cash-split{display:flex;justify-content:space-between;align-items:center;gap:10px}.iv-cash-status{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:650;color:#7c899a;white-space:nowrap}.iv-cash-status:before{content:\"\";width:7px;height:7px;background:currentColor;border-radius:50%}.iv-cash-status.good{color:#27965b}.iv-cash-status.wait{color:#d67b17}.iv-cash-status.bad{color:#cf5050}.iv-cash-caption{font-size:12px;color:#8490a0;line-height:1.4;margin:0}.iv-cash-session-value{margin-top:16px}.iv-cash-big{font-size:32px;letter-spacing:-1px;font-weight:780;color:#263247;line-height:1.25;display:block;font-variant-numeric:tabular-nums}.iv-cash-session-metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px;border-top:1px solid #edf0f3;margin-top:14px;padding-top:13px}.iv-cash-session-metrics b{display:block;font-size:15px;margin-top:4px}.iv-cash-manage{display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px;margin-top:15px;border:0;background:#f4f6f8;color:#344359;border-radius:12px;padding:13px;font-size:13px;font-weight:650;text-align:left;min-height:44px}\n.iv-cash-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.iv-cash-tile{text-align:left;display:flex;flex-direction:column;gap:14px;padding:14px;min-height:133px;border:1px solid #e4e9ef;background:#fff;border-radius:16px;color:#263247;min-width:0}.iv-cash-tile-top{display:flex;align-items:center;justify-content:space-between;gap:7px;width:100%}.iv-cash-tile-icon{display:grid;place-items:center;flex:none;width:42px;height:42px;background:#fff0e4;border-radius:12px;color:#ed7900}.iv-cash-tile-count{font-size:24px;font-weight:780;line-height:1}.iv-cash-tile strong{display:block;font-size:14px;line-height:1.25;font-weight:700;overflow-wrap:anywhere}.iv-cash-tile small{display:block;font-size:11px;font-weight:400;color:#8591a1;margin-top:4px;line-height:1.4}.iv-cash-tile:active,.iv-cash-row:active{background:#fff7ef}\n.iv-cash-search{display:flex;align-items:center;gap:9px;background:white;border:1px solid #e4e9ef;border-radius:13px;color:#8490a0;padding:0 12px;min-height:46px}.iv-cash-search>.iv-cash-icon-btn{width:34px;height:34px;color:#8190a0}.iv-cash-search input{border:0!important;background:transparent!important;box-shadow:none!important;outline:none!important;min-width:0;width:100%;margin:0!important;padding:12px 0!important;font-size:14px;font-weight:400}\n.iv-cash-list{padding:2px 13px}.iv-cash-row{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:67px;padding:12px 0;background:transparent;border:0;border-bottom:1px solid #edf0f3;text-align:left;color:#263247}.iv-cash-row:last-of-type{border-bottom:0}.iv-cash-row[hidden],.iv-cash-no-results[hidden]{display:none!important}.iv-cash-row-name{flex:1;min-width:0}.iv-cash-row-name strong{display:block;font-size:14px;overflow-wrap:anywhere}.iv-cash-row-name small{display:block;color:#8793a2;font-size:11px;line-height:1.35;margin-top:4px;overflow-wrap:anywhere}.iv-cash-row-name small.good{color:#27965b}.iv-cash-row-amount{font-size:13px;font-weight:650;white-space:nowrap}.iv-cash-row>.iv-icon{color:#8b97a5;flex:none}\n.iv-cash-empty{padding:24px 12px;text-align:center;color:#8490a0;font-size:13px;line-height:1.5}.iv-cash-empty>.iv-icon{display:block;margin:0 auto 9px;color:#a1adba}.iv-cash-line{display:flex;align-items:start;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #edf0f3;font-size:13px}.iv-cash-line:last-child{border-bottom:0}.iv-cash-line small{display:block;color:#8490a0;font-size:11px;margin-top:4px;line-height:1.4;white-space:pre-wrap}.iv-cash-line b{white-space:nowrap;font-variant-numeric:tabular-nums}.iv-cash-round{font-size:11px;font-weight:650;color:#bd6c21;background:#fff4e8;border-radius:8px;margin:10px 0 0;padding:7px 9px}.iv-cash-actions{display:grid;gap:8px}.iv-cash-action{display:flex;align-items:center;gap:10px;min-height:49px;width:100%;padding:12px 14px;border:1px solid #e4e9ef;background:white;border-radius:13px;color:#344359;text-align:left;font-weight:650;font-size:13px}.iv-cash-action>.iv-icon:first-child{color:#ed7900}.iv-cash-action span{flex:1;min-width:0}.iv-cash-action small{font-size:11px;color:#8290a0;font-weight:400}.iv-cash-primary{border:0;background:#ff7900;color:white;text-align:center;display:flex;justify-content:center;align-items:center;gap:8px;width:100%;min-height:47px;padding:12px;border-radius:12px;font-size:14px;font-weight:700}.iv-cash-primary:disabled{opacity:.48}.iv-cash-warn{font-size:12px;color:#a46b30;background:#fff5e9;border:1px solid #f5dfc7;border-radius:10px;padding:9px 10px;margin:0;line-height:1.45}.iv-cash-subtitle{font-size:11px;color:#8190a0;margin:5px 0 0}.iv-cash-summary-lines{margin-top:8px}\n.iv-cash-app .iv-op-open{width:100%;margin:0!important;min-height:46px;border-radius:12px}.iv-cash-app .iv-cash-payment-trigger .iv-op-open{background:#ff7900;color:white;border:0;justify-content:center;font-size:14px}.iv-cash-app .iv-cash-payment-trigger .iv-op-open>span:first-child,.iv-cash-app .iv-cash-payment-trigger .iv-op-open .iv-op-arrow{display:none}\ndialog.iv-cash-sheet .c-form,dialog.iv-cash-sheet .c-session-form{display:grid;gap:10px;margin:0}dialog.iv-cash-sheet .c-form label,dialog.iv-cash-sheet .c-session-form label{margin:0!important;font-size:12px;font-weight:600;display:grid;gap:5px;color:#435369}dialog.iv-cash-sheet input:not([type=radio]):not([type=checkbox]),dialog.iv-cash-sheet select{font-size:16px;font-weight:400;min-height:44px;margin:0;padding:9px 11px;border:1px solid #dce3eb;background:white;border-radius:10px;width:100%;color:#263247}\ndialog.iv-cash-sheet .c-methods{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}dialog.iv-cash-sheet .c-method{position:relative}dialog.iv-cash-sheet .c-method input{position:absolute;opacity:0;pointer-events:none}dialog.iv-cash-sheet .c-method>span{display:flex;align-items:center;gap:8px;padding:12px 9px;min-height:48px;border:1px solid #e1e7ee;border-radius:11px;color:#617185;font-size:13px}dialog.iv-cash-sheet .c-method input:checked+span{border-color:#ff9d4c;background:#fff1e5;color:#d96800}dialog.iv-cash-sheet .c-method input:focus-visible+span{outline:2px solid #ff9d4c}dialog.iv-cash-sheet .c-method input:checked+span .iv-icon{color:#ed7900}\ndialog.iv-cash-sheet .c-form .iv-cash-check{display:flex!important;align-items:center;gap:7px;font-weight:400}dialog.iv-cash-sheet .iv-cash-check input{accent-color:#ff7900;width:18px;height:18px;margin:0}dialog.iv-cash-sheet .c-form button[type=submit],dialog.iv-cash-sheet .c-session-form button[type=submit]{background:#ff7900;color:white;border:0;border-radius:11px;min-height:44px;font-weight:700}dialog.iv-cash-sheet button:disabled{opacity:.5}dialog.iv-cash-sheet .iv-op-footer .iv-op-submit{flex:1;width:auto;min-height:44px;border-radius:11px;border:0;background:#ff7900;color:white;font-weight:700}dialog.iv-cash-sheet .iv-op-footer{display:flex;align-items:center;gap:8px;padding-top:9px;border-top:1px solid #edf0f3;flex:none}dialog.iv-cash-sheet .iv-op-footer .iv-op-cancel{flex:0 0 auto;width:auto;padding:0 16px}\n@media(max-width:350px){.iv-cash-content{padding:10px}.iv-cash-tile{padding:11px;min-height:127px}.iv-cash-tile strong{font-size:13px}.iv-cash-row{gap:7px}.iv-cash-row-amount{font-size:12px}}\n</style>";
 const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)/100);
 const toCents=s=>{const raw=String(s??'').trim().replace(/\s/g,'');const t=raw.includes(',')?raw.replace(/\./g,'').replace(',','.'):raw;if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(t))throw Error('Valor inválido. Exemplo: 15,50');let [i,f='']=t.split('.');return Number(i)*100+Number((f+'00').slice(0,2))};
 const call=async(action,data={})=>{const r=await supabase.functions.invoke('restaurant-core',{body:{restaurant_id:restaurant.id,action,...data}});if(r.error||r.data?.error){let message=r.data?.error??r.error?.message??'Falha';try{const v=await r.error?.context?.json?.();if(v?.error)message=v.error}catch{}throw Error(message)}return r.data};
 let qrPromise=null;
 const qrLib=()=>{
  if(typeof window.qrcode==='function')return Promise.resolve(window.qrcode);
  if(qrPromise)return qrPromise;
  qrPromise=new Promise((resolve,reject)=>{
   const el=document.createElement('script');el.src='https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';el.referrerPolicy='no-referrer';
   const timer=setTimeout(()=>{el.remove();reject(Error('Gerador QR indisponível. Tente novamente com internet.'))},12000);
   el.onload=()=>{clearTimeout(timer);if(typeof window.qrcode==='function')resolve(window.qrcode);else reject(Error('Gerador QR indisponível.'))};
   el.onerror=()=>{clearTimeout(timer);el.remove();reject(Error('Não foi possível carregar o gerador QR.'))};document.head.append(el)
  }).catch(err=>{qrPromise=null;throw err});return qrPromise;
 };

 const menus=[['open','Pedidos em aberto','receipt','Em atendimento'],['queue','Recebimentos','wallet','Aguardando pagamento'],['paid','Pedidos pagos','checkCircle','Histórico e recibos'],['delivery','Delivery e retirada','bike','Pedidos externos']];
 const states={open:'Em consumo',submitted:'Enviado à cozinha',preparing:'Em preparo',ready:'Pronto',served:'Aguardando pagamento',closed:'Pagamento confirmado',cancelled:'Cancelado',pending_acceptance:'Aguardando aceite',accepted:'Aceito',rejected:'Recusado',ready_for_pickup:'Pronto para retirada',out_for_delivery:'Saiu para entrega',delivered:'Entregue',picked_up:'Retirado',expired:'Expirado'};
 const methodNames={pix_recorded:'Pix',credit_recorded:'Crédito',debit_recorded:'Débito',cash:'Dinheiro',other_recorded:'Outro',pix:'Pix',card:'Cartão'};
 const str=s=>String(s??'');
 const short=s=>str(s).replace(/-/g,'').slice(-8).toUpperCase();
 const formattedName=str(restaurant.name||restaurant.slug).replace(/-/g,' ').replace(/(^|\s)\p{L}/gu,x=>x.toLocaleUpperCase('pt-BR'));
 const date=s=>{if(!s)return '—';try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(s))}catch{return '—'}};
 const normalize=s=>str(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
 let screen='home',selectedOrderId=null,query='',snapshot=null,loading=false;
 const header=title=>css+'<div class="iv-cash-app"><div class="iv-cash-head">'+menuButtonMarkup()+(screen==='home'?'':'<button type="button" data-cash-back class="iv-cash-icon-btn" aria-label="Voltar">'+icon('arrowLeft',21)+'</button>')+'<div class="iv-cash-head-copy"><h1>'+esc(title)+'</h1><p>'+esc(formattedName)+'</p></div><button class="iv-cash-icon-btn" type="button" data-cash-refresh aria-label="Atualizar caixa" title="Atualizar caixa">'+icon('refresh',20)+'</button></div><main class="iv-cash-content">';
 const wrap=(title,body)=>header(title)+body+'</main></div>';
 const bindNav=()=>{
  document.querySelector('[data-cash-back]')?.addEventListener('click',()=>{if(selectedOrderId){selectedOrderId=null;draw()}else navigate('home')});
  document.querySelectorAll('[data-cash-refresh]').forEach(b=>b.onclick=()=>reload());
 };
 const navigate=(next,id=null)=>{screen=next;selectedOrderId=id;query='';draw();window.scrollTo(0,0)};
 const empty=(text,ic='receipt')=>'<div class="iv-cash-empty">'+icon(ic,26)+esc(text)+'</div>';
 async function reload(){
  if(loading)return;loading=true;
  box(wrap('Caixa','<div class="iv-loading-inline" role="status" aria-busy="true" aria-label="Carregando caixa"><div class="iv-loading-inline-lines" aria-hidden="true"><span class="iv-load-skeleton"></span><span class="iv-load-skeleton"></span></div></div><div class="iv-loading-inline" aria-hidden="true"><div class="iv-loading-inline-lines"><span class="iv-load-skeleton"></span><span class="iv-load-skeleton"></span></div></div>'));
  try{
   const [ordersData,cashData,onlineReply]=await Promise.all([call('orders'),call('cash_summary'),supabase.functions.invoke('marketplace-operations',{body:{restaurant_id:restaurant.id,action:'cash_list'}}).catch(()=>({error:true}))]);
   snapshot={ordersData,cashData,onlineReply};loading=false;draw();
  }catch(err){loading=false;box(wrap('Caixa','<section class="iv-cash-card"><p class="error">'+esc(err.message)+'</p><button type="button" class="iv-cash-primary" data-cash-refresh>Tentar novamente</button></section>'));bindNav()}
 }
 function draw(){
  if(!snapshot)return;
  const {ordersData,cashData,onlineReply}=snapshot,onlineError=!!(onlineReply?.error||onlineReply?.data?.error||!onlineReply?.data),onlineOrders=onlineError?[]:onlineReply.data.orders??[],onlinePayments=onlineError?[]:onlineReply.data.payments??[];
  const open=(cashData.sessions??[]).find(s=>s.status==='open'),sessionPayments=open?(cashData.payments??[]).filter(p=>p.cash_session_id===open.id):[];
  const sessionCash=sessionPayments.filter(p=>p.method==='cash').reduce((n,p)=>n+Number(p.amount_cents),0),sessionTotal=sessionPayments.reduce((n,p)=>n+Number(p.amount_cents),0),expected=Number(open?.starting_cash_cents??0)+sessionCash;
  const all=ordersData.orders??[],items=ordersData.items??[],pay=ordersData.payments??[],tables=ordersData.tables??[],rounds=ordersData.rounds??[];
  const orderGroups={open:all.filter(o=>['open','submitted','preparing','ready'].includes(o.status)),queue:all.filter(o=>o.status==='served'),paid:all.filter(o=>o.status==='closed').sort((a,b)=>str(b.closed_at).localeCompare(str(a.closed_at))),delivery:onlineOrders};
  const calc=o=>{const rows=items.filter(i=>i.order_id===o.id&&i.status!=='cancelled'),total=rows.reduce((n,i)=>n+Number(i.unit_price_cents)*Number(i.quantity),0),paid=pay.filter(x=>x.order_id===o.id).reduce((n,x)=>n+Number(x.amount_cents),0);return {rows,total,paid,outstanding:Math.max(0,total-paid)}};
  const label=o=>{const table=tables.find(t=>t.id===o.table_id),name=str(table?.label).trim();return name?(/^\d+$/.test(name)?'Mesa '+name.padStart(2,'0'):name):'Pedido #'+short(o.id)};
  const line=(name,value)=>'<div class="iv-cash-line"><span>'+esc(name)+'</span><b>'+esc(value)+'</b></div>';
  const action=(name,ico,attr,details='')=>'<button type="button" class="iv-cash-action" '+attr+'>'+icon(ico,20)+'<span>'+esc(name)+(details?'<small> · '+esc(details)+'</small>':'')+'</span>'+icon('chevronRight',16)+'</button>';
  const paymentLine=(p)=>action('Imprimir recibo','printer','data-payment-receipt="'+esc(p.id)+'"',money(p.amount_cents)+' · '+(methodNames[p.method]??p.method));
  const receiptData=(order,receipt=null)=>{const d=calc(order),table=tables.find(t=>t.id===order.table_id);return {id:short(order.id),table:table?.label??'Pedido',status:order.status,opened_at:order.opened_at,items:d.rows,received:d.paid,...(receipt?{receipt}:{})}};
  let selected=screen==='delivery'?null:all.find(o=>o.id===selectedOrderId);
  let onlineSelected=screen==='delivery'?onlineOrders.find(o=>o.id===selectedOrderId):null;
  if(selectedOrderId&&!selected&&!onlineSelected)selectedOrderId=null;
  if(selected&&screen==='queue'&&selected.status==='closed'){screen='paid'}
  if(selected&&screen==='queue'&&selected.status!=='served'&&selected.status!=='closed'){screen='open'}
  let title='Caixa',out='';
  if(screen==='home'){
   out='<section class="iv-cash-card"><div class="iv-cash-session-top"><h2>Sessão de caixa</h2><span class="iv-cash-status '+(open?'good':'')+'">'+(open?'Aberta':'Fechada')+'</span></div><div class="iv-cash-session-value"><p class="iv-cash-caption">Recebimentos da sessão · presencial</p><span class="iv-cash-big">'+(open?money(sessionTotal):'—')+'</span></div><div class="iv-cash-session-metrics"><div><p class="iv-cash-caption">Dinheiro esperado</p><b>'+ (open?money(expected):'—')+'</b></div><div><p class="iv-cash-caption">Troco inicial</p><b>'+(open?money(open.starting_cash_cents):'—')+'</b></div></div><button type="button" class="iv-cash-manage" data-cash-screen="session">'+(open?'Gerenciar sessão':'Abrir sessão')+icon('chevronRight',16)+'</button></section><h2>Operação</h2><div class="iv-cash-tiles">'+menus.map(([id,name,ico,desc])=>'<button type="button" class="iv-cash-tile" data-cash-screen="'+id+'"><span class="iv-cash-tile-top"><span class="iv-cash-tile-icon">'+icon(ico,22)+'</span><span class="iv-cash-tile-count">'+(id==='delivery'&&onlineError?'—':orderGroups[id].length)+'</span></span><span><strong>'+name+'</strong><small>'+desc+'</small></span></button>').join('')+'</div>';
  }else if(screen==='session'){
   title='Sessão de caixa';
   out='<section class="iv-cash-card"><div class="iv-cash-session-top"><h2>'+(open?'Caixa aberto':'Caixa fechado')+'</h2><span class="iv-cash-status '+(open?'good':'')+'">'+(open?'Aberta':'Fechada')+'</span></div>';
   if(open){
    const sum=method=>sessionPayments.filter(p=>method.includes(p.method)).reduce((n,p)=>n+Number(p.amount_cents),0);
    out+='<div class="iv-cash-session-value"><p class="iv-cash-caption">Abertura da sessão</p><b>'+esc(date(open.opened_at))+'</b></div><div class="iv-cash-summary-lines">'+line('Troco inicial',money(open.starting_cash_cents))+line('Recebimentos em dinheiro',money(sessionCash))+line('Pix',money(sum(['pix_recorded'])))+line('Cartões',money(sum(['credit_recorded','debit_recorded'])))+line('Outros',money(sum(['other_recorded'])))+line('Total recebido · presencial',money(sessionTotal))+line('Dinheiro esperado',money(expected))+'</div>';
   }else out+='<p class="iv-cash-subtitle">Abra uma sessão para registrar recebimentos.</p>';
   out+='</section><div class="iv-cash-actions">'+(open?'<form id="cash-close" class="c-session-form"><label>Dinheiro contado (R$)<input required name="amount" inputmode="decimal" placeholder="0,00"></label><button class="iv-cash-primary" type="submit">Fechar sessão</button></form>':'<form id="cash-open" class="c-session-form"><label>Troco inicial (R$)<input required name="amount" inputmode="decimal" placeholder="0,00" value="0,00"></label><button type="submit" class="iv-cash-primary">Abrir caixa</button></form>')+'</div>';
  }else if(selected){
   title=label(selected);const d=calc(selected),canPay=selected.status==='served'&&d.outstanding>0;
   out='<section class="iv-cash-card"><p class="iv-cash-caption">'+esc(states[selected.status]??selected.status)+'</p><span class="iv-cash-big">'+money(canPay?d.outstanding:d.total)+'</span><p class="iv-cash-subtitle">Pedido #'+esc(short(selected.id))+' · '+esc(date(selected.opened_at))+'</p></section><section class="iv-cash-card"><h2>Detalhes do pedido</h2>';
   const groups=[...new Set(d.rows.map(i=>Number(i.round_no||1)))].sort((a,b)=>a-b);
   for(const round of groups){out+='<div class="iv-cash-round">Rodada '+esc(round)+'</div>';for(const i of d.rows.filter(i=>Number(i.round_no||1)===round))out+='<div class="iv-cash-line"><span>'+esc(i.quantity)+' × '+esc(i.product_name)+(i.note?'<small>'+esc(i.note)+'</small>':'')+'</span><b>'+money(Number(i.quantity)*Number(i.unit_price_cents))+'</b></div>'}
   if(!d.rows.length)out+=empty('Nenhum item neste pedido.');
   out+='<div class="iv-cash-summary-lines">'+line('Total do pedido',money(d.total))+line('Já recebido',money(d.paid))+line('Saldo a receber',money(d.outstanding))+'</div></section><div class="iv-cash-actions">'+action('Imprimir pedido','printer','data-receipt="'+esc(selected.id)+'"')+pay.filter(p=>p.order_id===selected.id).map(paymentLine).join('')+'</div>';
   if(canPay){
    if(!open)out+='<p class="iv-cash-warn">Abra uma sessão de caixa para receber.</p><button class="iv-cash-primary" data-cash-screen="session" type="button">Abrir sessão</button>';
    else{
     out+='<div class="iv-cash-payment-trigger"><form class="c-form c-payment-form" id="cash-payment-form" data-payment="'+esc(selected.id)+'"><div class="c-methods">';
     for(const [method,name,ico] of [['pix_recorded','Pix','card'],['credit_recorded','Crédito','card'],['debit_recorded','Débito','card'],['cash','Dinheiro','money'],['other_recorded','Outro','wallet']])out+='<label class="c-method"><input type="radio" name="method" value="'+method+'" '+(method==='pix_recorded'?'checked':'')+'><span>'+icon(ico,20)+'<b>'+name+'</b></span></label>';
     out+='</div><label>Valor do pagamento (R$)<input name="amount" required inputmode="decimal" value="'+(d.outstanding/100).toFixed(2).replace('.',',')+'"></label><button type="button" class="iv-btn secondary" id="cash-pix-print">'+icon('printer',16)+' Imprimir cobrança Pix</button><p class="iv-cash-warn">Confira o recebimento no banco ou na maquininha antes de confirmar. Você pode receber valores parciais.</p><label class="iv-cash-check"><input type="checkbox" name="print_receipt" checked> Abrir recibo após confirmar</label><button type="submit" class="iv-cash-primary">'+icon('checkCircle',18)+' Registrar recebimento</button></form></div>';
    }
   }
  }else if(onlineSelected){
   const o=onlineSelected;title='Pedido #'+str(o.public_code).replace(/^ON-/,'');
   out='<section class="iv-cash-card"><p class="iv-cash-caption">'+(o.fulfillment_type==='delivery'?'Delivery':'Retirada')+'</p><span class="iv-cash-big">'+money(o.total_cents)+'</span><div class="iv-cash-summary-lines">'+line('Pedido',o.public_code)+line('Situação',states[o.status]??o.status)+line('Pagamento',o.payment_status==='paid'?'Pago':(['rejected','cancelled','expired'].includes(o.status)?'Não recebido':'Pendente'))+line('Forma de pagamento',methodNames[o.payment_method]??o.payment_method??'—')+line('Data',date(o.created_at))+'</div></section>';
   if(o.payment_status!=='paid'&&!['pending_acceptance','rejected','cancelled','expired'].includes(o.status))out+='<div class="iv-cash-payment-trigger"><form id="cash-online-pay" class="c-form"><label>Forma de pagamento<select name="method" required><option value="pix">Pix</option><option value="card">Cartão</option><option value="cash">Dinheiro</option></select></label><p class="iv-cash-warn">Confirme apenas após receber o valor fora do aplicativo.</p><button type="submit" class="iv-cash-primary">Confirmar recebimento</button></form></div>';
  }else{
   title=menus.find(m=>m[0]===screen)?.[1]??'Caixa';
   if(screen==='delivery'&&onlineError){out='<section class="iv-cash-card"><p class="iv-cash-caption">Não foi possível carregar os pedidos externos.</p><button class="iv-cash-manage" data-cash-refresh type="button">Tentar novamente '+icon('refresh',16)+'</button></section>'}
   else{
    const rows=orderGroups[screen]??[];
    out='<div class="iv-cash-search">'+icon('search',20)+'<input id="iv-cash-search" type="search" aria-label="Buscar pedido" placeholder="Buscar pedido" autocomplete="off" value="'+esc(query)+'"><button class="iv-cash-icon-btn" type="button" data-cash-refresh aria-label="Atualizar pedidos" title="Atualizar pedidos">'+icon('refresh',18)+'</button></div>';
    if(screen==='delivery')out+='<p class="iv-cash-caption">Recebimentos confirmados nesta sessão: '+money(onlinePayments.reduce((n,p)=>n+Number(p.amount_cents),0))+'</p>';
    out+='<section class="iv-cash-card iv-cash-list">';
    if(rows.length){
     for(const o of rows){
      const external=screen==='delivery',d=external?null:calc(o);
      const name=external?o.public_code:label(o),subtitle=external?(o.fulfillment_type==='delivery'?'Delivery':'Retirada')+' · '+(states[o.status]??o.status)+' · '+(o.payment_status==='paid'?'Pago':(['rejected','cancelled','expired'].includes(o.status)?'Não recebido':'Pendente')):states[o.status]??o.status;
      const amount=external?o.total_cents:screen==='queue'?d.outstanding:d.total;
      out+='<button class="iv-cash-row" type="button" data-cash-select="'+esc(o.id)+'" data-search="'+esc(normalize([name,subtitle,short(o.id),money(amount)].join(' ')))+'"><span class="iv-cash-row-name"><strong>'+esc(name)+'</strong><small class="'+(screen==='paid'||external&&o.payment_status==='paid'?'good':'')+'">'+esc(subtitle)+'</small></span><span class="iv-cash-row-amount">'+money(amount)+'</span>'+icon('chevronRight',17)+'</button>';
     }
     out+='<div class="iv-cash-no-results" hidden>'+empty('Nenhum pedido encontrado na busca.','search')+'</div>';
    }else out+=empty(({open:'Nenhum pedido em aberto.',queue:'Nenhum pedido aguardando pagamento.',paid:'Nenhum pedido pago neste recorte.',delivery:'Nenhum pedido de delivery ou retirada.'})[screen]??'Nenhum pedido.');
    out+='</section>';
   }
  }
  box(wrap(title,out));bindNav();
  document.querySelectorAll('[data-cash-screen]').forEach(btn=>btn.onclick=()=>navigate(btn.dataset.cashScreen));
  document.querySelectorAll('[data-cash-select]').forEach(btn=>btn.onclick=()=>{selectedOrderId=btn.dataset.cashSelect;draw();window.scrollTo(0,0)});
  document.querySelectorAll('[data-receipt]').forEach(btn=>btn.onclick=()=>{const o=all.find(x=>x.id===btn.dataset.receipt);if(o)void printConfigured({supabase,restaurant,kind:'cash',data:receiptData(o)})});
  document.querySelectorAll('[data-payment-receipt]').forEach(btn=>btn.onclick=()=>{const p=pay.find(x=>x.id===btn.dataset.paymentReceipt),o=p&&all.find(x=>x.id===p.order_id);if(o)void printConfigured({supabase,restaurant,kind:'cash',data:receiptData(o,p)})});
  const filter=()=>{const q=normalize(query.trim());let count=0;document.querySelectorAll('[data-cash-select]').forEach(el=>{el.hidden=!el.dataset.search.includes(q);if(!el.hidden)count++});const message=document.querySelector('.iv-cash-no-results');if(message)message.hidden=count!==0};
  const search=document.getElementById('iv-cash-search');if(search){search.oninput=()=>{query=search.value;filter()};filter()}
  const bind=(selector,callback)=>{const f=document.querySelector(selector);if(f)f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('[type=submit]')??document.querySelector('button[type=submit][form="'+f.id+'"]');if(!b||b.disabled)return;b.disabled=true;try{await callback(Object.fromEntries(new FormData(f)));const dlg=f.closest('dialog');if(dlg?.open)dlg.close();await reload()}catch(err){if(!showFormSheetError(f,err.message))alert(err.message);b.disabled=false}}};
  bind('#cash-open',v=>call('cash_open',{starting_cash_cents:toCents(v.amount)}));
  bind('#cash-close',async v=>{const result=await call('cash_close',{counted_cash_cents:toCents(v.amount)});alert('Conferência encerrada. Diferença em dinheiro: '+money(result.result?.difference_cents??0))});
  bind('#cash-online-pay',async v=>{if(!confirm('Confirma o recebimento real deste pagamento?'))throw Error('Recebimento não registrado.');const res=await supabase.functions.invoke('marketplace-operations',{body:{restaurant_id:restaurant.id,action:'pay',order_id:onlineSelected.id,method:v.method}});if(res.error||res.data?.error)throw Error(res.data?.error??res.error?.message??'Pagamento não registrado')});
    document.querySelectorAll('form[data-payment]').forEach(f=>{
     const pix=f.querySelector('#cash-pix-print'),submit=f.querySelector('[type=submit]');
     const sync=()=>{pix.hidden=f.elements.method.value!=='pix_recorded';pix.style.display=pix.hidden?'none':''};
     f.addEventListener('change',sync);sync();
     const showError=err=>{if(!showFormSheetError(f,err.message))alert(err.message)};
     pix.onclick=async()=>{
      if(pix.disabled||submit.disabled)return;
      let amount;
      try{amount=toCents(f.elements.amount.value);if(amount<=0||amount>calc(selected).outstanding)throw Error('Informe um valor dentro do saldo em aberto.')}catch(err){showError(err);return}
      const popup=window.open('','_blank');if(!popup){alert('Autorize pop-ups para abrir a impressão.');return}
      popup.document.body.textContent='Preparando cobrança Pix…';pix.disabled=true;submit.disabled=true;
      try{
       const [charge,qr]=await Promise.all([call('cash_pix_quote',{order_id:f.dataset.payment,amount_cents:amount}),qrLib()]);
       if(popup.closed)return;
       const code=qr(0,'M');code.addData(charge.payload,'Byte');code.make();const n=code.getModuleCount(),matrix=Array.from({length:n},(_,r)=>Array.from({length:n},(_,col)=>code.isDark(r,col)));
       await printConfigured({supabase,restaurant,kind:'cash',popup,qrMatrix:matrix,data:{...receiptData(selected),pix:charge}});
      }catch(err){popup.close();showError(err)}finally{pix.disabled=false;submit.disabled=!open||calc(selected).outstanding<=0}
     };
     f.onsubmit=async event=>{
      event.preventDefault();if(submit.disabled||pix.disabled)return;
      let v,amount;try{v=Object.fromEntries(new FormData(f));amount=toCents(v.amount);if(amount<=0||amount>calc(selected).outstanding)throw Error('Informe um valor dentro do saldo em aberto.')}catch(err){showError(err);return}
      if(!confirm('Confirma que recebeu '+money(amount)+'? Confira o pagamento real antes de registrar.'))return;
      const popup=v.print_receipt?window.open('','_blank'):null;if(popup)popup.document.body.textContent='Preparando recibo…';
      submit.disabled=true;pix.disabled=true;
      let result;
      try{result=await call('pay_manual',{order_id:f.dataset.payment,amount_cents:amount,method:v.method})}
      catch(err){popup?.close();showError(err);submit.disabled=false;pix.disabled=false;return}
      // A impressão nunca repete ou condiciona um pagamento já registrado.
      const receipt={id:result.result?.payment_id,method:v.method,amount_cents:amount,at:new Date().toISOString()};
      const data={...receiptData(selected,receipt),received:calc(selected).total-Number(result.result?.remaining_cents??Math.max(0,calc(selected).outstanding-amount)),status:result.result?.fully_paid?'closed':'served'};
      if(popup)void printConfigured({supabase,restaurant,kind:'cash',data,popup}).catch(()=>{try{popup.close()}catch{}alert('Pagamento registrado. Falha ao preparar recibo; não registre novamente.')});
      if(v.print_receipt&&!popup)alert('Pagamento registrado. Autorize pop-ups para imprimir o recibo.');
      // Fecha painel antigo, mesmo enquanto o novo estado é carregado.
      const dialog=f.closest('dialog');if(dialog?.open)dialog.close();
      await reload();
     };
    });

  const installed=sheetifyForms([
   {id:'cash-open',label:'Abrir sessão de caixa',title:'Abrir caixa',description:'Informe o troco inicial.',extraClass:'iv-cash-sheet'},
   {id:'cash-close',label:'Fechar sessão de caixa',title:'Conferência de caixa',description:'Conte o dinheiro disponível antes de encerrar.',extraClass:'iv-cash-sheet'},
   {id:'cash-payment-form',label:'Receber pagamento',title:'Pagamento',description:'Escolha a forma de pagamento.',extraClass:'iv-cash-sheet'},
   {id:'cash-online-pay',label:'Receber pagamento',title:'Pagamento',description:'Confirme o recebimento.',extraClass:'iv-cash-sheet'}
  ]);
  // Fixed action in the existing sheet; form association keeps original submit handler and validation.
  for(const {dialog,form} of installed){
   const submit=form.querySelector('[type=submit]'),foot=dialog.querySelector('.iv-op-footer');
   if(submit&&foot){submit.setAttribute('form',form.id);foot.append(submit)}
  }
 }
 return reload();
}
