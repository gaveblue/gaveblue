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
 let timer=null,countdown=null;
 const loadQrScript=()=>new Promise((resolve,reject)=>{
  if(window.qrcode)return resolve(window.qrcode);
  let script=document.getElementById('iv-pix-qr-lib');
  if(script){script.addEventListener('load',()=>resolve(window.qrcode),{once:true});script.addEventListener('error',reject,{once:true});return}
  script=document.createElement('script');script.id='iv-pix-qr-lib';
  script.src='https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';script.referrerPolicy='no-referrer';
  script.onload=()=>resolve(window.qrcode);script.onerror=()=>reject(Error('Imagem do QR indisponível; use Copia e Cola.'));
  document.head.appendChild(script);
 });
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
   let manual=null;
   if(order.payment_method==='manual_pix'&&order.payment_status!=='paid'&&!terminal.has(order.status)){
    try{const {data:pix,error:pixError}=await supabase.functions.invoke('marketplace-manual-pix',{body:{action:'get',token}});
     if(pixError||pix?.error)throw Error(pix?.error||'Pix temporariamente indisponível');manual=pix;
    }catch(e){manual={error:e.message}}
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
    +(order.payment_method==='manual_pix'&&order.payment_status!=='paid'&&!terminal.has(order.status)?
       '<section class="iv-com-panel" id="iv-manual-pix-panel" style="text-align:center">'
       +'<h2>Pagamento Pix direto</h2>'
       +(manual?.error?'<p>'+esc(manual.error)+'</p>':manual?.reported?'<p>Pagamento informado. O restaurante vai conferir o crédito no banco antes de aceitar.</p>':manual?.expired?'<p>O prazo acabou. Este pedido foi cancelado.</p>':
        '<p>Você tem <strong id="iv-pix-countdown">10:00</strong> para pagar e avisar o restaurante.</p>'
        +'<div id="iv-pix-qr" style="width:210px;max-width:100%;margin:16px auto" aria-label="QR Code Pix"></div>'
        +'<label style="display:block;text-align:left;font-weight:600;margin-bottom:8px" for="iv-pix-copy">Pix Copia e Cola</label>'
        +'<textarea id="iv-pix-copy" readonly rows="3" style="width:100%;max-width:100%;font-size:11px;padding:12px;box-sizing:border-box;border:1px solid #e8edf2;border-radius:12px">'+esc(manual?.payload??'')+'</textarea>'
        +'<button type="button" class="iv-com-secondary" id="iv-pix-copy-button" style="margin:10px">Copiar código Pix</button>'
        +'<button type="button" class="iv-com-secondary" id="iv-pix-reported" style="margin:10px">Já paguei · informar restaurante</button>'
        +'<p style="font-size:12px;color:#7d8998;margin-top:12px">Pague apenas se o nome do recebedor exibido no seu banco estiver correto. O botão Já paguei não confirma recebimento.</p>')
       +'</section>':'')
    +'<section class="iv-com-panel"><h2>Resumo</h2>'+row
    +'<div class="iv-com-line total"><span>Total</span><b>'+formatBRL(order.total_cents)+'</b></div>'
    +'<p>Pagamento: '+(order.payment_status==='paid'?'Confirmado':order.payment_method==='infinitepay'?'Aguardando pagamento online':order.payment_method==='manual_pix'?manual?.reported?'Informado pelo cliente · aguardando conferência':'Pix pendente':'A confirmar com o restaurante')+'</p>'
    +(order.payment_method==='infinitepay'&&order.payment_status!=='paid'?'<button type="button" class="iv-com-secondary" id="iv-com-pay">Pagar agora · InfinitePay</button>':'')
    +'<button type="button" class="iv-com-secondary" id="iv-com-refresh">Atualizar</button></section>'
    +'<p class="iv-com-privacy">Este endereço é privado. Não compartilhe o link de acompanhamento.</p>');
   document.getElementById('iv-com-refresh').onclick=refresh;
   if(countdown){clearInterval(countdown);countdown=null}
   if(manual?.payload&&!manual.reported&&!manual.expired&&!manual.error){
    const qrElement=document.getElementById('iv-pix-qr');
    loadQrScript().then(qrcode=>{if(!qrElement?.isConnected||!qrcode)return;
     const qr=qrcode(0,'M');qr.addData(manual.payload,'Byte');qr.make();
     qrElement.innerHTML=qr.createSvgTag({cellSize:4,margin:2});
     qrElement.querySelector('svg')?.setAttribute('style','width:100%;height:auto;max-width:210px');
    }).catch(()=>{if(qrElement?.isConnected)qrElement.textContent='Não foi possível mostrar o QR Code. Use o Pix Copia e Cola abaixo.'});
    const tick=()=>{
     const left=Math.max(0,Math.ceil((new Date(manual.expires_at).getTime()-Date.now())/1000));
     const el=document.getElementById('iv-pix-countdown');if(el)el.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');
     if(left<=0){clearInterval(countdown);countdown=null;refresh()}
    };tick();if(countdown!==null||document.getElementById('iv-pix-countdown'))countdown=setInterval(tick,1000);
    document.getElementById('iv-pix-copy-button')?.addEventListener('click',async()=>{
     try{await navigator.clipboard.writeText(manual.payload);document.getElementById('iv-pix-copy-button').textContent='Código copiado!'}
     catch{const input=document.getElementById('iv-pix-copy');input.select();document.execCommand('copy');document.getElementById('iv-pix-copy-button').textContent='Código selecionado / copiado'}
    });
    document.getElementById('iv-pix-reported')?.addEventListener('click',async e=>{
     if(!confirm('Você já concluiu o Pix no aplicativo do banco? O restaurante precisará conferir o recebimento.'))return;
     e.currentTarget.disabled=true;
     try{
      const {data:reported,error:e2}=await supabase.functions.invoke('marketplace-manual-pix',{body:{action:'report',token}});
      if(e2||reported?.error)throw Error(reported?.error||'Não foi possível avisar o restaurante');
      await refresh();
     }catch(err){alert(err.message);e.currentTarget.disabled=false}
    });
   }
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
   if(terminal.has(order.status)&&countdown){clearInterval(countdown);countdown=null}
  }catch(e){
   page('<div class="iv-mkt-empty" style="margin:36px 0"><h2>Não foi possível acompanhar</h2><p>'+esc(e.message)+'</p>'
    +'<button class="iv-com-secondary" id="iv-com-retry">Tentar novamente</button></div>');
   document.getElementById('iv-com-retry').onclick=refresh;
  }
 };
 await refresh();
 if(!timer&&document.getElementById('iv-com-refresh'))timer=setInterval(()=>{if(document.visibilityState==='visible')refresh()},18000);
 window.addEventListener('pagehide',()=>{if(timer)clearInterval(timer);if(countdown)clearInterval(countdown)},{once:true});
}
