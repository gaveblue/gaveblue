import {icon} from './ui-icons.js?v=1.0.0-rc.1';
import {formatBRL} from './marketplace-cart-rc4.js?v=1.1.0-rc.4';

export async function renderTracking({supabase,route,box,esc,link}){
 document.body.classList.add('iv-marketplace','iv-commerce');
 const css='<link rel="stylesheet" href="/intervalo/marketplace-preview-rc1.css?v=1.1.0-rc.4"><link rel="stylesheet" href="/intervalo/marketplace-commerce-rc4.css?v=1.1.0-rc.4">';
 const page=body=>box('<div class="iv-mkt-shell">'+css+'<nav class="iv-mkt-nav"><a class="iv-mkt-brand" href="'+link('/explorar')+'">intervalo</a><div class="iv-mkt-links"><a href="'+link('/explorar')+'">Restaurantes</a></div></nav>'+body+'</div>');
 const token=route[1];
 const paidQuery=new URLSearchParams(location.search);
 if(!token||!/^[0-9a-f-]{36}\.[a-f0-9]{64}$/i.test(token)){
  page('<section class="iv-mkt-empty" style="margin:34px 0"><h2>Meus pedidos</h2><p>Para consultar um pedido sem cadastro, abra o link privado recebido ao finalizar. Não é possível consultar pedidos de outras pessoas somente pelo número.</p><a class="iv-mkt-action" href="'+link('/explorar')+'">Explorar restaurantes</a></section>');
  return;
 }
 page('<div class="iv-loading-inline" role="status" aria-busy="true"><span class="iv-load-dot"></span> Consultando pedido...</div>');
 const labels={pending_acceptance:'Aguardando aceite',accepted:'Pedido aceito',preparing:'Em preparação',ready:'Pronto para sair',ready_for_pickup:'Pronto para retirada',out_for_delivery:'Saiu para entrega',delivered:'Entregue',picked_up:'Retirado',rejected:'Recusado',cancelled:'Cancelado',expired:'Expirado'};
 const terminal=new Set(['delivered','picked_up','rejected','cancelled','expired']);
 let timer=null;
 const refresh=async()=>{
  try{
   const {data,error}=await supabase.functions.invoke('marketplace-online',{body:{action:'track',token}});
   if(error||data?.error)throw Error(data?.error??'O link expirou ou o pedido não foi encontrado.');
   const order=data.order,items=data.items??[];
   if(order.payment_method==='infinitepay'&&order.payment_status!=='paid'){
    try{
     const {data:checked}=await supabase.functions.invoke('marketplace-infinitepay',{body:{
      action:'status',token,slug:paidQuery.get('slug')??'',transaction_nsu:paidQuery.get('transaction_nsu')??''
     }});
     if(checked?.paid===true)order.payment_status='paid';
    }catch{/* Somente webhook/consulta confirmada pode marcar como pago. */}
   }
   const steps=order.fulfillment_type==='delivery'?['pending_acceptance','accepted','preparing','ready','out_for_delivery','delivered']:
    ['pending_acceptance','accepted','preparing','ready_for_pickup','picked_up'];
   const i=steps.indexOf(order.status);
   const row=items.map(x=>'<div class="iv-com-line"><span>'+esc(x.quantity)+' × '+esc(x.product_name)+'</span><b>'+formatBRL(x.line_total_cents)+'</b></div>').join('');
   page('<section class="iv-com-checkout-head"><span class="iv-mkt-eyebrow">ACOMPANHAMENTO</span><h1>Pedido '+esc(order.public_code)+'</h1>'
    +'<p>'+esc(data.restaurant?.name??'Restaurante')+' · '+(order.fulfillment_type==='delivery'?'Entrega própria':'Retirada')+'</p></section>'
    +'<section class="iv-com-panel"><div class="iv-com-status '+(terminal.has(order.status)?'ready':'')+'">' +icon('clock',18)+' '+esc(order.payment_method==='infinitepay'&&order.payment_status!=='paid'?'Aguardando pagamento online':(labels[order.status]??order.status))+'</div>'
    +'<div class="iv-com-timeline">'+steps.map((s,j)=>'<div class="iv-com-stage '+(j<=i?'done':'')+'">'
      +icon(j<=i?'checkCircle':'circle',17)+'<span>'+esc(labels[s])+'</span></div>').join('')+'</div></section>'
    +'<section class="iv-com-panel"><h2>Resumo</h2>'+row
    +'<div class="iv-com-line total"><span>Total</span><b>'+formatBRL(order.total_cents)+'</b></div>'
    +'<p>Pagamento: '+(order.payment_status==='paid'?'Confirmado':order.payment_method==='infinitepay'?'Aguardando pagamento online':'A confirmar com o restaurante')+'</p>'
    +(order.payment_method==='infinitepay'&&order.payment_status!=='paid'?'<button type="button" class="iv-com-secondary" id="iv-com-pay">Pagar agora · InfinitePay</button>':'')
    +'<button type="button" class="iv-com-secondary" id="iv-com-refresh">Atualizar</button></section>'
    +'<p class="iv-com-privacy">Este endereço é privado. Não compartilhe o link de acompanhamento.</p>');
   document.getElementById('iv-com-refresh').onclick=refresh;
   const payButton=document.getElementById('iv-com-pay');
   if(payButton)payButton.onclick=async()=>{
    payButton.disabled=true;payButton.textContent='Abrindo pagamento...';
    try{
     const {data:payment,error}=await supabase.functions.invoke('marketplace-infinitepay',{body:{action:'create',token}});
     if(error||payment?.error||!payment?.payment_url)throw Error(payment?.error||'Não foi possível abrir a cobrança');
     location.assign(payment.payment_url);
    }catch(e){payButton.disabled=false;payButton.textContent='Tentar pagar novamente';alert(e.message)}
   };
   if(terminal.has(order.status)&&timer){clearInterval(timer);timer=null}
  }catch(e){
   page('<div class="iv-mkt-empty" style="margin:36px 0"><h2>Não foi possível acompanhar</h2><p>'+esc(e.message)+'</p>'
    +'<button class="iv-com-secondary" id="iv-com-retry">Tentar novamente</button></div>');
   document.getElementById('iv-com-retry').onclick=refresh;
  }
 };
 await refresh();
 if(!timer&&document.getElementById('iv-com-refresh'))timer=setInterval(()=>{if(document.visibilityState==='visible')refresh()},18000);
 window.addEventListener('pagehide',()=>{if(timer)clearInterval(timer)},{once:true});
}
