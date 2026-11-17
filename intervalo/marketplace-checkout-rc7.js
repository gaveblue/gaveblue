// Intervalo Marketplace — Checkout mobile-first rc9 · InfinitePay Novo Mundo.
// Apenas apresentação: cotação, finalização, termos, idempotência e requisições seguem o contrato rc4.
import {icon} from './ui-icons.js?v=1.0.0-rc.1';
import {customerAuth} from './marketplace-customer-rc5.js?v=1.1.0-rc.32';
import {loadCart,setCartItemQuantity,clearCart,formatBRL} from './marketplace-cart-rc4.js?v=1.1.0-rc.4';

export async function renderCheckout({supabase,box,esc,link}){
 document.body.classList.add('iv-marketplace','iv-commerce','iv-checkout-rc7');
 const css='<link rel="stylesheet" href="/intervalo/marketplace-preview-rc1.css?v=1.1.0-rc.4">'
  +'<link rel="stylesheet" href="/intervalo/marketplace-commerce-rc4.css?v=1.1.0-rc.4">'
  +'<link rel="stylesheet" href="/intervalo/marketplace-checkout-rc7.css?v=1.1.0-rc.7">';
 const slug=new URLSearchParams(location.search).get('loja');
 const safe=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
 const storeHref=slug&&safe.test(slug)?link('/loja/'+slug):link('/explorar');
 const page=content=>box('<div class="iv-mkt-shell iv-ck-shell">'+css
  +'<nav class="iv-mkt-nav iv-ck-nav"><a class="iv-mkt-brand" href="'+link('/explorar')+'">intervalo</a>'
  +'<div class="iv-mkt-links"><a href="'+storeHref+'">'+icon('arrowLeft',16)+' Voltar à loja</a></div></nav>'+content+'</div>');
 const issue=(message,back)=>page('<section class="iv-mkt-empty iv-ck-error-page"><div class="iv-ck-round-icon">'+icon('bag',25)+'</div>'
  +'<h2>'+esc(message)+'</h2><a class="iv-mkt-action" href="'+link(back??'/explorar')+'">Voltar</a></section>');
 if(!slug||!safe.test(slug))return issue('Loja não encontrada');
 const cart=loadCart(slug);
 if(!cart.items.length)return issue('Seu carrinho está vazio','/loja/'+slug);
 // Skeleton desde a primeira consulta, sem spinner/loader antigo.
 page('<div class="iv-ck-loading" role="status" aria-busy="true" aria-label="Preparando finalização do pedido">'
  +'<div class="iv-ck-skeleton iv-ck-skel-title"></div><div class="iv-ck-skeleton iv-ck-skel-caption"></div>'
  +'<div class="iv-ck-grid"><main class="iv-ck-column">'
  +Array.from({length:4},()=>'<section class="iv-ck-card iv-ck-skeleton-card">'
    +'<span class="iv-ck-skeleton iv-ck-skel-head"></span><span class="iv-ck-skeleton iv-ck-skel-line"></span></section>').join('')
  +'</main><aside class="iv-ck-card iv-ck-skeleton-card"><span class="iv-ck-skeleton iv-ck-skel-head"></span>'
  +'<span class="iv-ck-skeleton iv-ck-skel-line"></span><span class="iv-ck-skeleton iv-ck-skel-line"></span></aside></div></div>');
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
 try{data=await call('marketplace-public',{action:'store',slug})}
 catch(e){return issue(e.message,'/loja/'+slug)}
 if(!data.published)return issue('Cardápio indisponível','/loja/'+slug);
 const products=data.products??[],options=data.options??[];
 const configured=data.online_settings??{},zones=data.delivery_zones??[];
 const canOrder=data.checkout_available===true;
 const onlinePix=slug==='novo-mundo';
 let manualPixEnabled=false;
 try{manualPixEnabled=(await call('marketplace-manual-pix',{action:'config',slug})).enabled===true}catch{}
 let customerProfile=null,savedAddresses=[],signedIn=false;
 try{
  const {data:auth}=await customerAuth.auth.getUser();
  if(auth?.user){
   signedIn=true;
   const [p,a]=await Promise.all([
    customerAuth.from('customer_profiles').select('display_name,phone,terms_accepted_at').eq('id',auth.user.id).maybeSingle(),
    customerAuth.from('customer_addresses').select('id,label,street,number,neighborhood,city,state,postal_code,complement,reference').eq('customer_id',auth.user.id).order('created_at',{ascending:true}).limit(20)
   ]);
   if(!p.error&&p.data?.terms_accepted_at)customerProfile=p.data;
   if(customerProfile&&!a.error)savedAddresses=a.data||[];
  }
 }catch{/* Usuário visitante também pode comprar; não dependemos desta consulta. */}
 const pickupAllowed=configured.pickup_configured!==false;
 const deliveryAllowed=configured.delivery_configured===true&&zones.length>0;
 const defaultKind=pickupAllowed?'pickup':'delivery';
 const approx=item=>{
  const product=products.find(x=>x.id===item.product_id);
  return (Number(product?.price_cents??0)+options.filter(x=>item.option_ids.includes(x.id))
   .reduce((total,x)=>total+Number(x.price_delta_cents),0))*item.quantity;
 };
 const amount=cart.items.reduce((total,item)=>total+approx(item),0);
 const sheet=(key,title,description,content)=>'<dialog class="iv-ck-sheet" id="iv-ck-sheet-'+key+'" aria-labelledby="iv-ck-title-'+key+'">'
  +'<div class="iv-ck-sheet-frame"><div class="iv-ck-sheet-drag" data-ck-drag title="Arraste para expandir ou fechar">'
  +'<span aria-hidden="true"></span></div><header class="iv-ck-sheet-header"><div>'
  +'<h2 id="iv-ck-title-'+key+'">'+title+'</h2><p>'+description+'</p></div>'
  +'<button type="button" class="iv-ck-icon-btn" data-ck-close aria-label="Fechar">'+icon('x',19)+'</button></header>'
  +'<p class="iv-ck-sheet-error" id="iv-ck-error-'+key+'" role="alert" hidden></p>'
  +'<div class="iv-ck-sheet-scroll">'+content+'</div>'
  +'<footer class="iv-ck-sheet-footer"><button type="button" class="iv-ck-button" data-ck-done>Concluir '+icon('check',16)+'</button></footer></div></dialog>';
 const details=(iconName,title,description,key)=>'<button type="button" class="iv-ck-edit-card" data-ck-open="'+key+'">'
  +'<span class="iv-ck-icon-wrap">'+icon(iconName,19)+'</span><span class="iv-ck-edit-info"><strong>'+title+'</strong>'
  +'<small id="iv-ck-preview-'+key+'">'+description+'</small></span>'
  +'<span class="iv-ck-edit-label">Editar '+icon('chevronRight',15)+'</span></button>';
 let html='<header class="iv-ck-head"><span class="iv-mkt-eyebrow">SEU PEDIDO</span><h1>Finalizar compra</h1>'
  +'<p>'+esc(data.restaurant?.name??slug)+' · Compra rápida, sem precisar de cadastro</p></header>';
 if(!customerProfile)html+='<div class="iv-ck-card"><p style="margin:0 0 7px;font-size:13px">Você pode comprar sem cadastro, ou usar sua conta para preencher os dados.</p><a class="iv-ck-inline-link" href="'+link('/cliente?voltar=checkout&loja='+encodeURIComponent(slug))+'">'+(signedIn?'Completar cadastro':'Entrar ou criar conta')+' '+icon('chevronRight',15)+'</a></div>';
 if(!canOrder)html+='<div class="iv-com-warning">'+icon('info',18)
  +' O restaurante não está recebendo pedidos neste momento. Você pode conferir os dados, mas não concluir a compra.</div>';
 html+='<form id="iv-checkout-form" novalidate><div class="iv-ck-grid"><main class="iv-ck-column">'
  +'<section class="iv-ck-card"><div class="iv-ck-title-line"><span class="iv-ck-number">1</span>'
  +'<div><h2>Como deseja receber?</h2><p>Escolha a modalidade do pedido.</p></div></div>'
  +'<div class="iv-ck-kind-options">'
  +(pickupAllowed?'<label class="iv-ck-kind"><input type="radio" name="kind" value="pickup" '+(defaultKind==='pickup'?'checked':'')+'>'
    +'<span>'+icon('store',20)+'<strong>Retirada</strong><small>Buscar no restaurante</small></span></label>':'')
  +(deliveryAllowed?'<label class="iv-ck-kind"><input type="radio" name="kind" value="delivery" '+(defaultKind==='delivery'?'checked':'')+'>'
    +'<span>'+icon('bike',20)+'<strong>Entrega</strong><small>Entrega feita pela loja</small></span></label>':'')
  +'</div></section>'
  +'<section class="iv-ck-card"><div class="iv-ck-title-line"><span class="iv-ck-number">2</span>'
  +'<div><h2>Suas informações</h2><p>Toque para preencher ou alterar.</p></div></div>'
  +'<div class="iv-ck-edit-list"><div id="iv-delivery-fields" '+(defaultKind==='pickup'?'hidden':'')+'>'
  +details('home','Endereço de entrega','Informe seu endereço','address')+'</div>'
  +details('user','Contato','Nome e WhatsApp para o pedido','contact')
  +details('card','Pagamento',manualPixEnabled?'Pix direto · QR Code em 10 minutos':'Escolha a forma de pagamento','payment')+'</div></section>'
  +'<section class="iv-ck-card"><div class="iv-ck-title-line"><span class="iv-ck-number">3</span>'
  +'<div><h2>Itens do pedido</h2><p>Revise seu carrinho antes de continuar.</p></div></div>';
 for(let i=0;i<cart.items.length;i++){
  const item=cart.items[i],product=products.find(x=>x.id===item.product_id);
  html+='<div class="iv-ck-cart-item"><div class="iv-ck-cart-info"><strong>'+esc(product?.name??'Produto indisponível')+'</strong>'
   +(item.note?'<small>'+esc(item.note)+'</small>':'')
   +'<span>'+formatBRL(approx(item))+'</span></div><div class="iv-com-cart-controls">'
   +'<button type="button" data-cart="'+i+'" data-step="-1" aria-label="Diminuir quantidade de '+esc(product?.name??'produto')+'">−</button>'
   +'<b>'+item.quantity+'</b><button type="button" data-cart="'+i+'" data-step="1" aria-label="Aumentar quantidade de '
   +esc(product?.name??'produto')+'">+</button></div></div>';
 }
 html+='<a class="iv-ck-inline-link" href="'+storeHref+'">'+icon('plus',15)+' Adicionar mais produtos</a></section>'
  +'<section class="iv-ck-card iv-ck-consent-panel"><h2>Antes de finalizar</h2>'
  +'<label class="iv-com-consent"><input type="checkbox" name="terms"> Li e concordo com os '
  +'<a href="/intervalo/termos/" target="_blank" rel="noopener noreferrer">Termos de Compra</a> e a '
  +'<a href="/intervalo/privacidade/" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>.</label>'
  +'<label class="iv-com-consent"><input type="checkbox" name="marketing"> Autorizo mensagens promocionais (opcional).</label>'
  +'</section></main><aside class="iv-ck-card iv-ck-summary"><div class="iv-ck-title-line">'
  +'<span class="iv-ck-icon-wrap">'+icon('receipt',19)+'</span><div><h2>Resumo da compra</h2>'
  +'<p>Total conferido no servidor.</p></div></div>'
  +'<div class="iv-ck-line"><span>Subtotal estimado</span><b>'+formatBRL(amount)+'</b></div>'
  +'<div class="iv-ck-line"><span>Entrega</span><b id="iv-fee">A calcular</b></div>'
  +'<div class="iv-ck-line iv-ck-total"><span>Total</span><b id="iv-total">—</b></div>'
  +'<p class="iv-ck-hint">Os valores são confirmados no servidor. No Pix direto, o QR Code e o Copia e Cola aparecem no Intervalo com prazo de 10 minutos para pagar ou avisar o restaurante.</p>'
  +'</aside></div>'
  // Os campos dos dialogs continuam dentro do único form do checkout, inclusive quando o dialog está fechado.
  +sheet('address','Endereço de entrega','Confira a região e onde devemos entregar.',
    (savedAddresses.length?'<label class="iv-com-field">Usar endereço salvo<select id="iv-saved-address"><option value="">Preencher manualmente</option>'
      +savedAddresses.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.label+' · '+a.street+', '+a.number)+'</option>').join('')+'</select></label>':'')
    +'<label class="iv-com-field">Região de entrega<select name="zone"><option value="">Selecione sua região</option>'
    +zones.map(z=>'<option value="'+esc(z.id)+'">'+esc(z.name+' · '+z.city+'/'+z.state)+' — '+formatBRL(z.fee_cents)+'</option>').join('')+'</select></label>'
    +'<div class="iv-com-dual"><label class="iv-com-field">CEP<input name="postal_code" inputmode="numeric" maxlength="9" placeholder="00000-000" autocomplete="postal-code"></label>'
    +'<label class="iv-com-field">UF<input name="state" maxlength="2" autocomplete="address-level1"></label></div>'
    +'<div class="iv-com-dual"><label class="iv-com-field">Cidade<input name="city" maxlength="100" autocomplete="address-level2"></label>'
    +'<label class="iv-com-field">Bairro<input name="neighborhood" maxlength="100"></label></div>'
    +'<label class="iv-com-field">Rua<input name="street" maxlength="160" autocomplete="street-address"></label>'
    +'<div class="iv-com-dual"><label class="iv-com-field">Número<input name="number" maxlength="25"></label>'
    +'<label class="iv-com-field">Complemento<input name="complement" maxlength="120"></label></div>'
    +'<label class="iv-com-field">Referência<input name="reference" maxlength="160"></label>')
  +sheet('contact','Seus dados','Como o restaurante deve identificar e contatar você.',
    '<label class="iv-com-field">Seu nome<input name="name" autocomplete="name" maxlength="120" value="'
    +esc(customerProfile?.display_name||'')+'" placeholder="Nome e sobrenome"></label>'
    +'<label class="iv-com-field">Celular / WhatsApp<input name="phone" autocomplete="tel" inputmode="tel" maxlength="20" value="'
    +esc(customerProfile?.phone||'')+'" placeholder="(00) 00000-0000"></label>'
    +'<label class="iv-com-field">Observações para o restaurante<textarea name="note" maxlength="500" rows="3" placeholder="Alguma observação sobre seu pedido?"></textarea></label>')
  +sheet('payment','Forma de pagamento',manualPixEnabled?'Pix direto com confirmação do restaurante ou outras opções.':onlinePix?'Pagar online ou no recebimento.':'O pagamento será feito na entrega ou retirada.',
    '<div class="iv-ck-payment-list">'
    +(manualPixEnabled?'<label><input type="radio" name="payment" value="manual" checked><span>'+icon('money',20)+'<strong>Pix direto · QR Code</strong><small>10 minutos para pagar ou avisar · restaurante confere antes de aceitar</small></span></label>':'')
    +(onlinePix?'<label><input type="radio" name="payment" value="online" '+(!manualPixEnabled?'checked':'')+'><span>'+icon('checkCircle',20)+'<strong>InfinitePay · Alternativa</strong><small>Checkout seguro da InfinitePay</small></span></label>':'')
    +'<label><input type="radio" name="payment" value="pix" '+(!manualPixEnabled&&!onlinePix?'checked':'')+'><span>'+icon('money',20)+'<strong>Pix na entrega/retirada</strong></span></label>'
    +'<label><input type="radio" name="payment" value="card"><span>'+icon('card',20)+'<strong>Cartão na entrega/retirada</strong></span></label>'
    +'<label><input type="radio" name="payment" value="cash"><span>'+icon('wallet',20)+'<strong>Dinheiro</strong></span></label></div>')
  +'<div class="iv-ck-sticky"><div class="iv-ck-sticky-inner"><div class="iv-ck-sticky-price">'
  +'<small>Total do pedido</small><strong id="iv-ck-sticky-total">A calcular</strong></div>'
  +'<div class="iv-ck-sticky-actions"><p class="iv-com-error" id="iv-checkout-error" role="alert" hidden></p>'
  +'<button type="button" class="iv-ck-button" id="iv-quote" '+(!canOrder?'disabled':'')+'>'
  +(canOrder?'Calcular total':'Pedidos indisponíveis')+' '+icon('arrowRight',17)+'</button>'
  +'<button type="button" class="iv-ck-button" id="iv-place" hidden>Confirmar pedido '+icon('checkCircle',17)+'</button></div></div></div>'
  +'</form>';
 page(html);
 const form=document.getElementById('iv-checkout-form');
 const delivery=document.getElementById('iv-delivery-fields');
 const total=document.getElementById('iv-total'),fee=document.getElementById('iv-fee'),stickyTotal=document.getElementById('iv-ck-sticky-total');
 const quoteBtn=document.getElementById('iv-quote'),placeBtn=document.getElementById('iv-place'),errorEl=document.getElementById('iv-checkout-error');
 let quote=null,fingerprint='',busy=false;
 const warn=message=>{errorEl.textContent=message;errorEl.hidden=!message;if(message)errorEl.scrollIntoView?.({block:'nearest',behavior:'smooth'})};
 const sheetError=(key,message)=>{
  const el=document.getElementById('iv-ck-error-'+key);
  if(el){el.textContent=message;el.hidden=!message}
 };
 const getData=()=>{
  const fd=new FormData(form),kind=fd.get('kind')??defaultKind,needsAddress=kind==='delivery';
  const address=needsAddress?{
   postal_code:String(fd.get('postal_code')??'').replace(/\D/g,''),
   state:String(fd.get('state')??'').trim().toUpperCase(),
   city:String(fd.get('city')??'').trim(),neighborhood:String(fd.get('neighborhood')??'').trim(),
   street:String(fd.get('street')??'').trim(),number:String(fd.get('number')??'').trim(),
   complement:String(fd.get('complement')??'').trim(),reference:String(fd.get('reference')??'').trim()
  }:null;
  const payment=String(fd.get('payment')??(manualPixEnabled?'manual':onlinePix?'online':'pix'));
  return {
   slug,items:loadCart(slug).items.map(x=>({product_id:x.product_id,quantity:x.quantity,option_ids:x.option_ids,note:x.note})),
   fulfillment_type:kind,zone_id:needsAddress?String(fd.get('zone')??''):null,address,
   customer_name:String(fd.get('name')??'').trim(),customer_phone:String(fd.get('phone')??'').trim(),
   customer_note:String(fd.get('note')??'').trim(),accept_terms:fd.get('terms')==='on',
   marketing_opt_in:fd.get('marketing')==='on',source:'storefront',
   payment_method:payment==='manual'&&manualPixEnabled?'manual_pix':payment==='online'&&onlinePix?'infinitepay':needsAddress?(payment==='pix'?'pix_on_delivery':payment==='card'?'card_on_delivery':'cash'):
    (payment==='pix'?'pix_on_pickup':payment==='card'?'card_on_pickup':'cash_on_pickup')
  };
 };
 const reset=()=>{
  quote=null;fingerprint='';placeBtn.hidden=true;quoteBtn.hidden=false;
  fee.textContent='A calcular';total.textContent='—';stickyTotal.textContent='A calcular';warn('');
  for(const key of ['address','contact','payment'])sheetError(key,'');
 };
 const syncPreviews=()=>{
  const fd=new FormData(form),kind=fd.get('kind')??defaultKind,hasDelivery=kind==='delivery';
  delivery.hidden=!hasDelivery;
  const name=String(fd.get('name')??'').trim(),phone=String(fd.get('phone')??'').trim();
  const street=String(fd.get('street')??'').trim(),number=String(fd.get('number')??'').trim();
  const district=String(fd.get('neighborhood')??'').trim(),city=String(fd.get('city')??'').trim();
  document.getElementById('iv-ck-preview-contact').textContent=name?(name+(phone?' · '+phone:'')):'Nome e WhatsApp para o pedido';
  document.getElementById('iv-ck-preview-address').textContent=street
   ?street+(number?', '+number:'')+(district?' · '+district:'')+(city?' · '+city:'')
   :'Informe seu endereço';
  const chosen=fd.get('payment')??'pix';
  document.getElementById('iv-ck-preview-payment').textContent=chosen==='manual'&&manualPixEnabled?'Pix direto · 10 minutos':chosen==='online'&&onlinePix
   ?'Pagamento antecipado · InfinitePay'
   :(chosen==='card'?'Cartão':chosen==='cash'?'Dinheiro':'Pix')+' · Pagamento na '+(hasDelivery?'entrega':'retirada');
 };
 const dialogs=[...form.querySelectorAll('.iv-ck-sheet')];
 const openSheet=key=>{
  const dialog=document.getElementById('iv-ck-sheet-'+key);if(!dialog)return;
  if(!dialog.open)dialog.showModal();
  dialog.__ckAlign?.();
  dialog.classList.remove('iv-ck-expanded');
  dialog.querySelector('.iv-ck-sheet-scroll')?.scrollTo?.(0,0);
  dialog.querySelector('[data-ck-close]')?.focus?.({preventScroll:true});
 };
 const closeSheet=dialog=>{if(dialog?.open)dialog.close();syncPreviews()};
 // Bottom sheets arrastáveis, expansíveis, com fechamento pelo grip, backdrop, Escape e botão.
 for(const dialog of dialogs){
  const frame=dialog.querySelector('.iv-ck-sheet-frame'),handle=dialog.querySelector('[data-ck-drag]');
  dialog.querySelectorAll('[data-ck-close],[data-ck-done]').forEach(button=>button.addEventListener('click',()=>closeSheet(dialog)));
  dialog.addEventListener('click',e=>{if(e.target===dialog)closeSheet(dialog)});
  dialog.addEventListener('close',()=>{dialog.classList.remove('iv-ck-expanded');frame.style.transform=''});
  let start=null,lastDelta=0;
  handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;start=e.clientY;lastDelta=0;handle.setPointerCapture?.(e.pointerId)});
  handle.addEventListener('pointermove',e=>{
   if(start===null)return;lastDelta=e.clientY-start;
   frame.style.transform=lastDelta>0?'translateY('+Math.min(130,lastDelta)+'px)':'';
  });
  const finish=()=>{
   if(start===null)return;
   if(lastDelta>85)closeSheet(dialog);
   else if(lastDelta< -40)dialog.classList.add('iv-ck-expanded');
   start=null;lastDelta=0;frame.style.transform='';
  };
  handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
  const align=()=>{
   if(!dialog.open)return;
   const vv=window.visualViewport,height=vv?.height??window.innerHeight;
   const keyboard=Math.max(0,window.innerHeight-(height+(vv?.offsetTop??0)));
   dialog.style.bottom=keyboard+'px';
   dialog.style.setProperty('--iv-ck-visible-height',Math.max(260,Math.floor(height-8))+'px');
  };
  const detachViewport=()=>{
   window.visualViewport?.removeEventListener('resize',align);
   window.visualViewport?.removeEventListener('scroll',align);
   dialog.style.bottom='';dialog.style.removeProperty('--iv-ck-visible-height');
  };
  dialog.__ckAlign=()=>{
   window.visualViewport?.addEventListener('resize',align);
   window.visualViewport?.addEventListener('scroll',align);
   align();
  };
  dialog.addEventListener('close',detachViewport);
  dialog.addEventListener('focusin',align);dialog.addEventListener('click',align);
 }
 form.querySelectorAll('[data-ck-open]').forEach(button=>button.onclick=()=>openSheet(button.dataset.ckOpen));
 form.addEventListener('submit',event=>event.preventDefault());
 form.addEventListener('input',()=>{reset();syncPreviews()});
 form.addEventListener('change',()=>{reset();syncPreviews()});
 const picker=document.getElementById('iv-saved-address');
 if(picker)picker.onchange=()=>{
  const address=savedAddresses.find(x=>x.id===picker.value);
  for(const field of ['street','number','complement','neighborhood','city','state','postal_code','reference'])
   form.elements.namedItem(field).value=address?.[field]||'';
  // Região e taxa sempre revalidadas por restaurante.
  form.elements.namedItem('zone').value='';
  reset();syncPreviews();
 };
 if(picker&&savedAddresses.length){picker.value=savedAddresses[0].id;picker.onchange()}
 const zone=form.elements.namedItem('zone');
 if(zone)zone.addEventListener('change',()=>{
  const chosen=zones.find(x=>x.id===zone.value);
  if(chosen){form.elements.namedItem('city').value=chosen.city;form.elements.namedItem('state').value=chosen.state}
  reset();syncPreviews();
 });
 form.querySelectorAll('[data-cart]').forEach(button=>button.onclick=()=>{
  try{
   const list=loadCart(slug),index=Number(button.dataset.cart);
   setCartItemQuantity(slug,index,list.items[index].quantity+Number(button.dataset.step));
   location.reload();
  }catch(e){warn(e.message)}
 });
 const validate=req=>{
  if(!req.items.length)throw Error('Seu carrinho está vazio.');
  if(req.fulfillment_type==='delivery'&&(!req.zone_id||!req.address.street||!req.address.number||
   !req.address.neighborhood||!req.address.city||req.address.postal_code.length!==8)){
   sheetError('address','Informe região, CEP e endereço de entrega completo.');
   openSheet('address');throw Error('Informe região, CEP e endereço de entrega completo.');
  }
  if(req.customer_name.length<2||req.customer_phone.replace(/\D/g,'').length<10){
   sheetError('contact','Informe nome e celular válidos.');
   openSheet('contact');throw Error('Informe nome e celular válidos.');
  }
 };
 quoteBtn.onclick=async()=>{
  if(busy||!canOrder)return;
  const req=getData();
  try{
   validate(req);
   busy=true;quoteBtn.disabled=true;quoteBtn.innerHTML=icon('refresh',16)+' Conferindo valores...';
   const result=await call('marketplace-online',{action:'quote',...req});
   quote=result.quote;fingerprint=JSON.stringify(req);
   fee.textContent=formatBRL(quote.delivery_fee_cents);
   total.textContent=formatBRL(quote.total_cents);
   stickyTotal.textContent=formatBRL(quote.total_cents);
   quoteBtn.hidden=true;placeBtn.hidden=false;placeBtn.innerHTML=(req.payment_method==='infinitepay'?'Ir para pagamento ':req.payment_method==='manual_pix'?'Gerar código Pix ':'Confirmar pedido ')+icon('checkCircle',17);warn('');
  }catch(e){warn(e.message)}
  finally{busy=false;quoteBtn.disabled=!canOrder;quoteBtn.innerHTML='Calcular total '+icon('arrowRight',17)}
 };
 placeBtn.onclick=async()=>{
  if(busy||!quote)return;
  const req=getData();
  if(JSON.stringify(req)!==fingerprint){reset();warn('Dados alterados. Calcule o total novamente.');return}
  if(!req.accept_terms){warn('Aceite os termos antes de confirmar.');return}
  busy=true;placeBtn.disabled=true;placeBtn.innerHTML=icon('refresh',16)+' Enviando pedido...';
  try{
   const encoded=new TextEncoder().encode(JSON.stringify(req));
   const digest=await crypto.subtle.digest('SHA-256',encoded);
   const fingerprintHash=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
   let saved=null;
   try{saved=JSON.parse(sessionStorage.getItem('intervalo-checkout-idempotency')||'null')}catch{}
   const key=saved?.fingerprint===fingerprintHash?saved.key:crypto.randomUUID();
   try{sessionStorage.setItem('intervalo-checkout-idempotency',JSON.stringify({fingerprint:fingerprintHash,key}))}catch{}
   const result=await call('marketplace-online',{action:'place',...req,checkout_key:key});
   const trackingPath=link('/pedido/'+encodeURIComponent(result.tracking_token));
   if(req.payment_method==='infinitepay'){
    window.__ivPaymentRecovery=trackingPath;
    const payment=await call('marketplace-infinitepay',{action:'create',token:result.tracking_token});
    if(payment.paid===true){clearCart(slug);location.assign(trackingPath);return}
    if(!payment.payment_url)throw Error('Não foi possível abrir o pagamento');
    clearCart(slug);
    location.assign(payment.payment_url);
    return;
   }
   clearCart(slug);
   location.assign(trackingPath);
  }catch(e){warn(e.message);if(window.__ivPaymentRecovery){errorEl.innerHTML=esc(e.message)+' · <a href="'+window.__ivPaymentRecovery+'">Abrir pedido e tentar pagar novamente</a>';errorEl.hidden=false}}
  finally{busy=false;placeBtn.disabled=false;placeBtn.innerHTML=(getData().payment_method==='infinitepay'?'Ir para pagamento ':getData().payment_method==='manual_pix'?'Gerar código Pix ':'Confirmar pedido ')+icon('checkCircle',17)}
 };
 syncPreviews();
}
