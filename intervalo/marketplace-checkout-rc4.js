import {icon} from './ui-icons.js?v=1.0.0-rc.1';
import {loadCart,setCartItemQuantity,clearCart,formatBRL} from './marketplace-cart-rc4.js?v=1.1.0-rc.4';

export async function renderCheckout({supabase,box,esc,link}){
 document.body.classList.add('iv-marketplace','iv-commerce');
 const css='<link rel="stylesheet" href="/intervalo/marketplace-preview-rc1.css?v=1.1.0-rc.4"><link rel="stylesheet" href="/intervalo/marketplace-commerce-rc4.css?v=1.1.0-rc.4">';
 const slug=new URLSearchParams(location.search).get('loja');
 const safe=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
 const page=x=>box('<div class="iv-mkt-shell">'+css+'<nav class="iv-mkt-nav"><a class="iv-mkt-brand" href="'+link('/explorar')+'">intervalo</a><div class="iv-mkt-links"><a href="'+link('/loja/'+slug)+'">'+icon('arrowLeft',17)+' Loja</a></div></nav>'+x+'</div>');
 const issue=(msg,back)=>page('<section class="iv-mkt-empty" style="margin:35px 0"><h2>'+esc(msg)+'</h2><a class="iv-mkt-action" href="'+link(back??'/explorar')+'">Voltar</a></section>');
 if(!slug||!safe.test(slug))return issue('Loja não encontrada');
 let cart=loadCart(slug);
 if(!cart.items.length)return issue('Seu carrinho está vazio','/loja/'+slug);
 page('<div class="iv-loading-inline" role="status" aria-busy="true"><span class="iv-load-dot"></span> Conferindo o cardápio...</div>');
 const call=async(fn,payload)=>{
  const {data,error}=await supabase.functions.invoke(fn,{body:payload});
  if(error||data?.error){
   let reason=data?.error??error?.message??'Erro de comunicação';
   try{const obj=await error?.context?.json?.();reason=obj?.error??reason}catch{}
   throw Error(reason);
  }
  return data;
 };
 let data;
 try{data=await call('marketplace-public',{action:'store',slug})}catch(e){return issue(e.message,'/loja/'+slug)}
 if(!data.published)return issue('Cardápio indisponível','/loja/'+slug);
 const products=data.products??[],options=data.options??[];
 const configured=data.online_settings??{},zones=data.delivery_zones??[];
 const canOrder=data.checkout_available===true;
 const pickupAllowed=configured.pickup_configured!==false;
 const deliveryAllowed=configured.delivery_configured===true&&zones.length>0;
 const defaultKind=pickupAllowed?'pickup':'delivery';
 const approx=item=>{
  const p=products.find(x=>x.id===item.product_id);
  return (Number(p?.price_cents??0)+options.filter(x=>item.option_ids.includes(x.id)).reduce((n,x)=>n+Number(x.price_delta_cents),0))*item.quantity;
 };
 const amount=cart.items.reduce((n,i)=>n+approx(i),0);
 let html='<section class="iv-com-checkout-head"><span class="iv-mkt-eyebrow">CHECKOUT</span><h1>Finalizar pedido</h1><p>'
  +esc(data.restaurant?.name??slug)+' · Não precisa criar cadastro</p></section>';
 if(!canOrder)html+='<div class="iv-com-warning">'+icon('info',19)+' O restaurante não está recebendo pedidos agora. Confira o carrinho, mas a compra permanecerá bloqueada até a abertura.</div>';
 html+='<div class="iv-com-checkout-layout"><div><section class="iv-com-panel"><h2>Seu carrinho</h2>';
 for(let i=0;i<cart.items.length;i++){
  const item=cart.items[i],p=products.find(x=>x.id===item.product_id);
  html+='<div class="iv-com-cart-item"><div><strong>'+esc(p?.name??'Produto indisponível')+'</strong><small>'+esc(item.note)+'</small>'
   +'<small>'+formatBRL(approx(item))+'</small></div><div class="iv-com-cart-controls">'
   +'<button type="button" data-cart="'+i+'" data-step="-1" aria-label="Diminuir">−</button><b>'+item.quantity+'</b>'
   +'<button type="button" data-cart="'+i+'" data-step="1" aria-label="Aumentar">+</button></div></div>';
 }
 html+='<a class="iv-com-text-link" href="'+link('/loja/'+slug)+'">Adicionar produtos</a></section>'
   +'<form id="iv-checkout-form" novalidate>'
   +'<section class="iv-com-panel"><h2>Entrega ou retirada</h2><div class="iv-com-choices">'
   +(pickupAllowed?'<label><input type="radio" name="kind" value="pickup" '+(defaultKind==='pickup'?'checked':'')+'> Retirada</label>':'')
   +(deliveryAllowed?'<label><input type="radio" name="kind" value="delivery" '+(defaultKind==='delivery'?'checked':'')+'> Entrega própria</label>':'')
   +'</div><div id="iv-delivery-fields" '+(defaultKind==='pickup'?'hidden':'')+'><h3>Endereço</h3>'
   +'<label class="iv-com-field">Região de entrega<select name="zone"><option value="">Selecione</option>'
   +zones.map(z=>'<option value="'+esc(z.id)+'">'+esc(z.name+' · '+z.city+'/'+z.state)+' — '+formatBRL(z.fee_cents)+'</option>').join('')+'</select></label>'
   +'<div class="iv-com-dual"><label class="iv-com-field">CEP<input name="postal_code" inputmode="numeric" maxlength="9" placeholder="00000-000"></label>'
   +'<label class="iv-com-field">UF<input name="state" maxlength="2"></label></div>'
   +'<div class="iv-com-dual"><label class="iv-com-field">Cidade<input name="city" maxlength="100"></label>'
   +'<label class="iv-com-field">Bairro<input name="neighborhood" maxlength="100"></label></div>'
   +'<label class="iv-com-field">Rua<input name="street" maxlength="160"></label>'
   +'<div class="iv-com-dual"><label class="iv-com-field">Número<input name="number" maxlength="25"></label>'
   +'<label class="iv-com-field">Complemento<input name="complement" maxlength="120"></label></div>'
   +'<label class="iv-com-field">Referência<input name="reference" maxlength="160"></label></div></section>'
   +'<section class="iv-com-panel"><h2>Contato</h2><p>Não precisa criar senha ou informar CPF.</p>'
   +'<label class="iv-com-field">Nome<input name="name" autocomplete="name" maxlength="120"></label>'
   +'<label class="iv-com-field">Celular / WhatsApp<input name="phone" autocomplete="tel" inputmode="tel" maxlength="20"></label>'
   +'<label class="iv-com-field">Observações gerais<textarea name="note" maxlength="500" rows="2"></textarea></label></section>'
   +'<section class="iv-com-panel"><h2>Pagamento na entrega/retirada</h2><div class="iv-com-choices">'
   +'<label><input type="radio" name="payment" value="pix" checked> Pix</label>'
   +'<label><input type="radio" name="payment" value="card"> Cartão</label>'
   +'<label><input type="radio" name="payment" value="cash"> Dinheiro</label></div></section>'
   +'<section class="iv-com-panel"><label class="iv-com-consent"><input type="checkbox" name="terms"> Li e concordo com os termos da compra e o uso dos meus dados para processar este pedido.</label>'
   +'<label class="iv-com-consent"><input type="checkbox" name="marketing"> Autorizo mensagens promocionais (opcional).</label></section></form></div>'
   +'<aside class="iv-com-panel iv-com-summary"><h2>Resumo</h2>'
   +'<div class="iv-com-line"><span>Subtotal estimado</span><b>'+formatBRL(amount)+'</b></div>'
   +'<div class="iv-com-line"><span>Entrega</span><b id="iv-fee">A calcular</b></div>'
   +'<div class="iv-com-line total"><span>Total confirmado</span><b id="iv-total">—</b></div>'
   +'<p>O preço final será conferido no servidor antes de enviar.</p>'
   +'<p class="iv-com-error" id="iv-checkout-error" role="alert" hidden></p>'
   +'<button type="button" class="iv-com-primary" id="iv-quote" '+(!canOrder?'disabled':'')+'>Calcular total</button>'
   +'<button type="button" class="iv-com-primary" id="iv-place" hidden>Confirmar pedido</button>'
   +'<a class="iv-com-text-link" href="'+link('/loja/'+slug)+'">Continuar comprando</a></aside></div>';
 page(html);
 const form=document.getElementById('iv-checkout-form'),delivery=document.getElementById('iv-delivery-fields');
 const price=document.getElementById('iv-total'),fee=document.getElementById('iv-fee');
 const quoteBtn=document.getElementById('iv-quote'),placeBtn=document.getElementById('iv-place'),errorEl=document.getElementById('iv-checkout-error');
 let quote=null,fingerprint='',busy=false;
 const warn=message=>{errorEl.textContent=message;errorEl.hidden=!message};
 const getData=()=>{
  const fd=new FormData(form),kind=fd.get('kind')??defaultKind,del=kind==='delivery';
  const address=del?{
   postal_code:String(fd.get('postal_code')??'').replace(/\D/g,''),
   state:String(fd.get('state')??'').trim().toUpperCase(),
   city:String(fd.get('city')??'').trim(),neighborhood:String(fd.get('neighborhood')??'').trim(),
   street:String(fd.get('street')??'').trim(),number:String(fd.get('number')??'').trim(),
   complement:String(fd.get('complement')??'').trim(),reference:String(fd.get('reference')??'').trim()
  }:null;
  const payment=String(fd.get('payment')??'pix');
  return {
   slug,items:loadCart(slug).items.map(x=>({product_id:x.product_id,quantity:x.quantity,option_ids:x.option_ids,note:x.note})),
   fulfillment_type:kind,zone_id:del?String(fd.get('zone')??''):null,address,
   customer_name:String(fd.get('name')??'').trim(),customer_phone:String(fd.get('phone')??'').trim(),
   customer_note:String(fd.get('note')??'').trim(),accept_terms:fd.get('terms')==='on',
   marketing_opt_in:fd.get('marketing')==='on',source:'storefront',
   payment_method:del?(payment==='pix'?'pix_on_delivery':payment==='card'?'card_on_delivery':'cash'):
    (payment==='pix'?'pix_on_pickup':payment==='card'?'card_on_pickup':'cash_on_pickup')
  };
 };
 const reset=()=>{quote=null;fingerprint='';placeBtn.hidden=true;quoteBtn.hidden=false;fee.textContent='A calcular';price.textContent='—';warn('')};
 form.addEventListener('input',reset);form.addEventListener('change',reset);
 form.querySelectorAll('[name="kind"]').forEach(x=>x.addEventListener('change',()=>{delivery.hidden=x.value==='pickup'&&x.checked}));
 const zone=form.elements.namedItem('zone');
 if(zone)zone.addEventListener('change',()=>{const z=zones.find(x=>x.id===zone.value);if(z){form.elements.namedItem('city').value=z.city;form.elements.namedItem('state').value=z.state}});
 document.querySelectorAll('[data-cart]').forEach(b=>b.onclick=()=>{
  try{
   const list=loadCart(slug),index=Number(b.dataset.cart);
   setCartItemQuantity(slug,index,list.items[index].quantity+Number(b.dataset.step));
   location.reload();
  }catch(e){warn(e.message)}
 });
 const validate=data=>{
  if(!data.items.length)throw Error('Seu carrinho está vazio');
  if(data.fulfillment_type==='delivery'&&(!data.zone_id||!data.address.street||!data.address.number||
    !data.address.neighborhood||!data.address.city||data.address.postal_code.length!==8))
   throw Error('Informe região, CEP e endereço de entrega completo');
  if(data.customer_name.length<2||data.customer_phone.replace(/\D/g,'').length<10)
   throw Error('Informe nome e celular válidos');
 };
 quoteBtn.onclick=async()=>{
  if(busy||!canOrder)return;
  const req=getData();
  try{
   validate(req);busy=true;quoteBtn.disabled=true;quoteBtn.textContent='Conferindo...';
   const result=await call('marketplace-online',{action:'quote',...req});
   quote=result.quote;fingerprint=JSON.stringify(req);fee.textContent=formatBRL(quote.delivery_fee_cents);
   price.textContent=formatBRL(quote.total_cents);quoteBtn.hidden=true;placeBtn.hidden=false;warn('');
  }catch(e){warn(e.message)}
  finally{busy=false;quoteBtn.disabled=!canOrder;quoteBtn.textContent='Calcular total'}
 };
 placeBtn.onclick=async()=>{
  if(busy||!quote)return;
  const req=getData();
  if(JSON.stringify(req)!==fingerprint){reset();warn('Dados alterados. Calcule o total novamente.');return}
  if(!req.accept_terms){warn('Aceite os termos antes de confirmar.');return}
  busy=true;placeBtn.disabled=true;placeBtn.textContent='Enviando...';
  try{
   const encoded=new TextEncoder().encode(JSON.stringify(req));
   const digest=await crypto.subtle.digest('SHA-256',encoded);
   const fingerprintHash=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
   let saved=null;
   try{saved=JSON.parse(sessionStorage.getItem('intervalo-checkout-idempotency')||'null')}catch{}
   const key=saved?.fingerprint===fingerprintHash?saved.key:crypto.randomUUID();
   try{sessionStorage.setItem('intervalo-checkout-idempotency',JSON.stringify({fingerprint:fingerprintHash,key}))}catch{}
   const result=await call('marketplace-online',{action:'place',...req,checkout_key:key});
   clearCart(slug);
   location.assign(link('/pedido/'+encodeURIComponent(result.tracking_token)));
  }catch(e){warn(e.message)}
  finally{busy=false;placeBtn.disabled=false;placeBtn.textContent='Confirmar pedido'}
 };
}
