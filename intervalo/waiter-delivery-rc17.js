// Intervalo 1.1.0-rc.17 — pedido de entrega/retirada pelo Garçom (sem mesa).
import {icon} from './ui-icons.js?v=1.0.0-rc.1';
import {groupProducts,chooseVariant} from './product-variants-rc28.js?v=1.1.0-rc.28';
const asText=value=>String(value??'');
const digits=value=>asText(value).replace(/\D/g,'');
const escapeText=value=>asText(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n||0)/100);
export async function openWaiterDelivery({supabase,restaurant,products,categories=[],afterCreated}){
 if(document.querySelector('dialog.wd-sheet[open]'))return;
 const dlg=document.createElement('dialog');dlg.className='wd-sheet';dlg.setAttribute('aria-label','Novo pedido delivery ou retirada');
 dlg.innerHTML="<style>\ndialog.wd-sheet{position:fixed;inset:0;margin:auto;max-width:620px;width:100%;max-height:100dvh;height:100dvh;padding:0;border:0;border-radius:0;background:#f6f7f9;color:#1a2739;box-shadow:0 20px 80px #1e293b45;overflow:hidden;font:14px/1.4 Inter,system-ui,sans-serif}\ndialog.wd-sheet::backdrop{background:#1b293b96}\n.wd-shell{display:flex;flex-direction:column;height:100%;min-height:0}\n.wd-head{flex:none;background:#fff;border-bottom:1px solid #e9ecf1;padding:14px 16px 12px;display:flex;align-items:center;justify-content:space-between;gap:12px}\n.wd-head h2{margin:0;font-size:18px;line-height:1.2;font-weight:850}\n.wd-head p{margin:4px 0 0;color:#8490a2;font-size:11px}\n.wd-close{width:37px;height:37px;background:#f2f4f7;border:0;border-radius:11px;display:grid;place-items:center;color:#475569}\n.wd-main{flex:1;overflow:auto;overscroll-behavior:contain;padding:15px 15px 25px;min-height:0}\n.wd-foot{flex:none;display:flex;gap:9px;align-items:center;background:#fff;padding:12px 15px max(12px,env(safe-area-inset-bottom));border-top:1px solid #e9edf1;box-shadow:0 -5px 20px #21354b0b}\n.wd-back,.wd-next{border:0;border-radius:12px;min-height:48px;padding:11px 15px;font-size:13px;font-weight:850;cursor:pointer}\n.wd-next{background:#fb7605;color:#fff;flex:1}.wd-next:disabled{opacity:.55;cursor:wait}\n.wd-back{background:#f1f3f6;color:#405069}.wd-back[hidden]{display:none}\n.wd-card{background:white;border:1px solid #e7ecf2;border-radius:16px;padding:14px;margin:0 0 12px;min-width:0}\n.wd-card h3{font-size:14px;font-weight:850;margin:0 0 9px}\n.wd-muted{font-size:12px;color:#768399;margin:3px 0 12px}\n.wd-search{border:1px solid #e0e7ef;border-radius:11px;background:#fff;padding:12px;font-size:16px;width:100%;margin:0 0 10px}\n.wd-products{display:grid;gap:8px}.wd-product{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px;border:1px solid #e9edf1;border-radius:12px;background:white}\n.wd-product>div{min-width:0;flex:1}.wd-product b{font-size:13px;display:block;overflow-wrap:anywhere}\n.wd-product small{font-size:11px;color:#728092;display:block;margin-top:3px;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.wd-product .wd-thumb{position:relative;width:56px;height:56px;flex:0 0 56px;border-radius:9px;overflow:hidden;display:grid;place-items:center;background:#fff0e3;color:#e96900}.wd-thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.wd-product .wd-item-price{display:block;text-align:right;color:#ef7900;font-size:13px;margin-top:4px;font-weight:800}.wd-catalog-tools{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:0 0 10px}.wd-catalog-tools h3{margin:0}.wd-view{display:flex;gap:2px;padding:3px;border:1px solid #e7eaf0;border-radius:12px;background:#f5f7fa}.wd-view button{width:34px;height:33px;display:grid;place-items:center;border:0;border-radius:9px;background:transparent;color:#7f8a9c}.wd-view button[aria-pressed=true]{background:white;color:#ef7000;box-shadow:0 1px 5px #0b253016}.wd-categories{display:flex;overflow:auto;gap:6px;margin:0 0 10px}.wd-categories button{flex:none;border:1px solid #e7ebf0;border-radius:99px;padding:7px 12px;background:white;color:#66758a;font-size:12px}.wd-categories button[aria-pressed=true]{color:#df6c00;background:#fff2e7;border-color:#ffd3ad}.wd-products.is-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.wd-products.is-grid .wd-product{flex-direction:column;align-items:stretch;gap:7px}.wd-products.is-grid .wd-thumb{width:100%;height:105px;flex:0 0 105px}.wd-products.is-grid .wd-icon-button{align-self:flex-end}.wd-product[hidden]{display:none!important}\n.wd-icon-button{border:0;border-radius:11px;width:37px;height:37px;background:#fff0e3;color:#e96900;display:grid;place-items:center;flex:none}\n.wd-cart-item{padding:11px 0;border-top:1px solid #f0f2f5}\n.wd-cart-item:first-of-type{border-top:0}.wd-cart-top{display:flex;align-items:center;justify-content:space-between;gap:10px}\n.wd-cart-top>div:first-child{min-width:0;flex:1}.wd-cart-top strong{font-size:12px}.wd-cart-top small{display:block;color:#788494;font-size:11px}\n.wd-qty{display:flex;align-items:center;gap:8px}.wd-qty button{width:30px;height:30px;border:1px solid #e0e5ec;border-radius:9px;background:#fff;color:#df6c00;font-size:19px;cursor:pointer}\n.wd-qty span{min-width:16px;text-align:center;font-weight:850;font-size:13px}\n.wd-note{width:100%;min-height:43px;max-height:85px;margin-top:8px;padding:10px;border:1px solid #e2e7ef;border-radius:10px;background:#f9fafc;font-size:13px;resize:vertical}\n.wd-total{display:flex;justify-content:space-between;gap:12px;font-weight:800;font-size:13px;padding:9px 2px}\n.wd-total strong{color:#ef6c00;font-size:18px}\n.wd-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}\n.wd-field{display:grid;gap:5px;font-size:12px;color:#526172;font-weight:750;margin:0 0 10px;min-width:0}\n.wd-field input,.wd-field select,.wd-field textarea{min-width:0;width:100%;box-sizing:border-box;border:1px solid #dfe6ef;border-radius:10px;background:white;color:#1f2937;padding:11px;font:16px/1.25 system-ui}\n.wd-field textarea{resize:vertical;min-height:70px}\n.wd-field.wd-full{grid-column:1/-1}.wd-choice{display:flex;gap:8px;margin:10px 0 15px}.wd-choice button{flex:1;border:1px solid #e2e8f0;background:white;color:#697789;border-radius:11px;min-height:43px;font-weight:800;font-size:12px;cursor:pointer}\n.wd-choice button[aria-pressed=true]{color:#dd6200;background:#fff1e6;border-color:#ffca99}\n.wd-warning{background:#fff6ea;color:#99530c;border:1px solid #ffddb2;border-radius:11px;padding:10px 12px;font-size:11px;margin:8px 0}\n.wd-error{font-size:12px;color:#b42318;margin:10px 0;min-height:0}\n.wd-success{text-align:center;padding:22px 15px}.wd-success h3{font-size:23px;letter-spacing:-.5px;margin:10px 0}.wd-success p{color:#566578;font-size:13px}\n.wd-link{display:block;word-break:break-all;font-size:11px;color:#5b6b83;background:#f3f5f9;border-radius:10px;padding:10px;margin:11px 0}\n.wd-link-button{background:#fff4e8;color:#e36d00;border:1px solid #ffd6ad;border-radius:10px;padding:10px 12px;font-size:12px;font-weight:800;width:100%}\n@media(min-width:700px){dialog.wd-sheet{height:min(90dvh,920px);max-height:90dvh;border-radius:22px}}\n@media(max-width:370px){.wd-grid{grid-template-columns:1fr}.wd-choice{gap:5px}}\n</style>"+'<div class="wd-shell"><header class="wd-head"><div><h2 id="wd-title">Novo pedido</h2><p id="wd-subtitle">Delivery e retirada · atendimento pelo Garçom</p></div><button type="button" class="wd-close" aria-label="Fechar">'+icon('x',20)+'</button></header><main class="wd-main" id="wd-main"><p class="wd-muted">Carregando regiões de entrega...</p></main><footer class="wd-foot"><button type="button" class="wd-back" id="wd-back" hidden>Voltar</button><button type="button" class="wd-next" id="wd-next" disabled>Carregando...</button></footer></div>';
 document.body.append(dlg);
 const byId=id=>dlg.querySelector('#'+id);
 const main=byId('wd-main'),next=byId('wd-next'),back=byId('wd-back');
 const close=()=>{if(!saving&&dlg.open)dlg.close()};
 dlg.querySelector('.wd-close').onclick=close;
 dlg.addEventListener('click',e=>{if(e.target===dlg)close()});
 dlg.addEventListener('close',()=>{window.visualViewport?.removeEventListener('resize',align);window.visualViewport?.removeEventListener('scroll',align);dlg.remove()},{once:true});
 const align=()=>{if(!dlg.isConnected)return;if(window.innerWidth<700){const vv=window.visualViewport;if(vv){dlg.style.height=Math.floor(vv.height)+'px';dlg.style.maxHeight=Math.floor(vv.height)+'px';dlg.style.top=Math.floor(vv.offsetTop)+'px'}}};
 window.visualViewport?.addEventListener('resize',align);
 window.visualViewport?.addEventListener('scroll',align);
 dlg.showModal();align();dlg.querySelector('.wd-close').focus({preventScroll:true});
 let config=null,step='items',saving=false,query='',requestId=crypto.randomUUID(),created=null;
 const cart=new Map();
 const fields={name:'',phone:'',zone:'',street:'',number:'',complement:'',neighborhood:'',city:'',state:'',postal_code:'',reference:'',note:'',method:''};
 let kind='delivery';
 const available=(products||[]).filter(p=>p.available!==false&&p.show_on_menu===true&&p.category_id);
 const grouped=groupProducts(available);
 const activeCats=categories.filter(c=>grouped.some(g=>g.product.category_id===c.id));
 let activeCategory='all',layout='list';
 try{if(localStorage.getItem('intervalo.waiter.catalog.layout.v1')==='grid')layout='grid'}catch{}
 const safePhoto=p=>typeof p.image_url==='string'&&/^https:\/\/[^\s<>"']+$/.test(p.image_url)?p.image_url:null;
 function total(){return [...cart.values()].reduce((n,r)=>n+Number(r.product.price_cents)*r.qty,0)}
 function fee(){return kind==='delivery'?Number(config?.zones?.find(z=>z.id===fields.zone)?.fee_cents||0):0}
 function field(name,label,props=''){
  return '<label class="wd-field">'+label+'<input name="'+name+'" '+props+' value="'+escapeText(fields[name]||'')+'"></label>';
 }
 function saveFields(){
  const form=byId('wd-data');if(!form)return;
  const d=new FormData(form);
  for(const key of Object.keys(fields)){if(d.has(key))fields[key]=asText(d.get(key)).trim()}
 }
 function setStep(value){step=value;render()}
 function add(id,delta){
  const product=available.find(p=>p.id===id);if(!product)return;
  const found=cart.get(id),qty=(found?.qty||0)+delta;
  if(qty<=0){cart.delete(id)}else if(qty<=20){
   if(!found&&cart.size>=25){alert('O máximo é de 25 produtos por pedido.');return}
   cart.set(id,{product,qty,note:found?.note||''});
  }
  render();
 }
 function renderItems(){
  const rows=grouped.map(g=>{
   const p=g.product,src=safePhoto(p),cat=categories.find(c=>c.id===p.category_id);
   return '<article class="wd-product" data-wd-product data-category="'+escapeText(p.category_id)+'" data-search="'+escapeText([g.name,g.search,p.description,cat?.name].join(' ').toLocaleLowerCase('pt-BR'))+'"><span class="wd-thumb">'+(src?'<img src="'+escapeText(src)+'" loading="lazy" decoding="async" alt="'+escapeText(g.name)+'">':icon('burger',27))+'</span><div><b>'+escapeText(g.name)+'</b><small>'+escapeText(p.description??'')+'</small><strong class="wd-item-price">'+(g.variants.length>1?'A partir de ':'')+brl(g.price)+'</strong></div><button class="wd-icon-button" type="button" aria-label="Adicionar '+escapeText(g.name)+'" data-wd-pick="'+escapeText(g.key)+'">'+icon('plus',18)+'</button></article>';
  }).join('');
  const entries=[...cart.values()].map(({product,qty,note})=>'<div class="wd-cart-item"><div class="wd-cart-top"><div><strong>'+escapeText(product.name)+'</strong><small>'+brl(Number(product.price_cents)*qty)+'</small></div><div class="wd-qty"><button type="button" data-wd-minus="'+escapeText(product.id)+'" aria-label="Diminuir quantidade">−</button><span>'+qty+'</span><button type="button" data-wd-add="'+escapeText(product.id)+'" aria-label="Aumentar quantidade">+</button></div></div><textarea class="wd-note" data-wd-note="'+escapeText(product.id)+'" maxlength="350" placeholder="Observação do item, se necessário">'+escapeText(note)+'</textarea></div>').join('');
  main.innerHTML='<section class="wd-card"><div class="wd-catalog-tools"><h3>Cardápio</h3><div class="wd-view" role="group" aria-label="Visualização"><button type="button" data-wd-view="list" aria-label="Lista" aria-pressed="'+(layout==='list')+'">'+icon('bars',19)+'</button><button type="button" data-wd-view="grid" aria-label="Grade" aria-pressed="'+(layout==='grid')+'">'+icon('dashboard',19)+'</button></div></div><input id="wd-search" class="wd-search" type="search" placeholder="Buscar produto..." autocomplete="off" value="'+escapeText(query)+'"><div class="wd-categories"><button type="button" data-wd-cat="all" aria-pressed="'+(activeCategory==='all')+'">Todos</button>'+activeCats.map(c=>'<button type="button" data-wd-cat="'+escapeText(c.id)+'" aria-pressed="'+(activeCategory===c.id)+'">'+escapeText(c.name)+'</button>').join('')+'</div><div class="wd-products'+(layout==='grid'?' is-grid':'')+'">'+rows+'</div><p class="wd-muted" id="wd-catalog-empty" hidden>Nenhum produto encontrado.</p></section>'
   +'<section class="wd-card"><h3>Resumo · '+cart.size+' produto(s)</h3>'+(entries||'<p class="wd-muted">Adicione itens para começar.</p>')+'<div class="wd-total"><span>Subtotal</span><strong>'+brl(total())+'</strong></div></section>';
  const filter=()=>{
   const q=query.trim().toLocaleLowerCase('pt-BR');let count=0;
   main.querySelectorAll('[data-wd-product]').forEach(el=>{el.hidden=(activeCategory!=='all'&&el.dataset.category!==activeCategory)||(q&&!el.dataset.search.includes(q));if(!el.hidden)count++});
   main.querySelector('#wd-catalog-empty').hidden=count>0;
  };
  main.querySelector('#wd-search').oninput=e=>{query=e.target.value;filter()};
  main.querySelectorAll('[data-wd-cat]').forEach(b=>b.onclick=()=>{activeCategory=b.dataset.wdCat;main.querySelectorAll('[data-wd-cat]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));filter()});
  main.querySelectorAll('[data-wd-view]').forEach(b=>b.onclick=()=>{layout=b.dataset.wdView;try{localStorage.setItem('intervalo.waiter.catalog.layout.v1',layout)}catch{}main.querySelector('.wd-products').classList.toggle('is-grid',layout==='grid');main.querySelectorAll('[data-wd-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))});
  main.querySelectorAll('.wd-thumb img').forEach(img=>{const fallback=()=>{if(img.isConnected)img.parentElement.innerHTML=icon('burger',27)};img.addEventListener('error',fallback,{once:true});if(img.complete&&!img.naturalWidth)fallback()});
  main.querySelectorAll('[data-wd-pick]').forEach(b=>b.onclick=()=>chooseVariant(grouped.find(g=>g.key===b.dataset.wdPick),brl,p=>add(p.id,1)));
  filter();
  main.querySelectorAll('[data-wd-add]').forEach(b=>b.onclick=()=>add(b.dataset.wdAdd,1));
  main.querySelectorAll('[data-wd-minus]').forEach(b=>b.onclick=()=>add(b.dataset.wdMinus,-1));
  main.querySelectorAll('[data-wd-note]').forEach(t=>t.oninput=()=>{const item=cart.get(t.dataset.wdNote);if(item)item.note=t.value});
  back.hidden=true;next.hidden=false;next.disabled=cart.size===0;next.textContent='Continuar · '+brl(total());
 }
 function renderForm(){
  const canDelivery=config?.settings?.delivery_enabled!==false&&config?.zones?.length>0;
  const canPickup=config?.settings?.pickup_enabled!==false;
  if(!canDelivery&&kind==='delivery')kind='pickup';
  const z=config?.zones?.find(x=>x.id===fields.zone);
  if(!fields.method||!['cash','pix_on_delivery','card_on_delivery','cash_on_pickup','pix_on_pickup','card_on_pickup'].includes(fields.method))
   fields.method=kind==='delivery'?'cash':'cash_on_pickup';
  const opts=kind==='delivery'?[['cash','Dinheiro na entrega'],['pix_on_delivery','Pix na entrega'],['card_on_delivery','Cartão na entrega']]:[['cash_on_pickup','Dinheiro na retirada'],['pix_on_pickup','Pix na retirada'],['card_on_pickup','Cartão na retirada']];
  const options=opts.map(([k,v])=>'<option value="'+k+'" '+(fields.method===k?'selected':'')+'>'+v+'</option>').join('');
  const zones=(config?.zones||[]).map(x=>'<option value="'+escapeText(x.id)+'" '+(fields.zone===x.id?'selected':'')+'>'+escapeText(x.name)+' · '+brl(x.fee_cents)+'</option>').join('');
  main.innerHTML='<form id="wd-data" class="wd-card" autocomplete="on"><h3>Atendimento e entrega</h3><p class="wd-muted">Pedido lançado pelo Garçom, separado das comandas de mesa.</p>'
   +'<div class="wd-choice"><button type="button" data-wd-kind="delivery" aria-pressed="'+(kind==='delivery')+'" '+(canDelivery?'':'disabled')+'>'+icon('bike',18)+' Delivery</button><button type="button" data-wd-kind="pickup" aria-pressed="'+(kind==='pickup')+'" '+(canPickup?'':'disabled')+'>'+icon('bag',18)+' Retirada</button></div>'
   +'<div class="wd-grid">'+field('name','Cliente *','required minlength="2" maxlength="120" autocomplete="name"')+field('phone','Celular *','required inputmode="tel" autocomplete="tel" maxlength="20"')+'</div>'
   +(kind==='delivery'?'<label class="wd-field">Região de entrega *<select name="zone" id="wd-zone" required><option value="">Selecione a região</option>'+zones+'</select></label>'
   +'<div class="wd-grid">'+field('street','Rua / avenida *','required maxlength="160"')+field('number','Número *','required maxlength="25"')
   +field('neighborhood','Bairro *','required maxlength="100"')+field('postal_code','CEP *','required maxlength="9" inputmode="numeric"')
   +field('city','Cidade *','required maxlength="100"')+field('state','UF *','required maxlength="2" style="text-transform:uppercase"')
   +field('complement','Complemento','maxlength="120"')+field('reference','Referência','maxlength="160"')+'</div>'
   +(z&&z.neighborhoods?.length?'<p class="wd-muted">Região: '+escapeText(z.neighborhoods.join(', '))+'</p>':''):'')
   +'<label class="wd-field">Pagamento ao receber *<select name="method" required>'+options+'</select></label>'
   +'<label class="wd-field">Observações gerais<textarea name="note" maxlength="500" placeholder="Instruções do pedido">'+escapeText(fields.note)+'</textarea></label>'
   +'<div class="wd-total"><span>Itens</span><span>'+brl(total())+'</span></div>'
   +(kind==='delivery'?'<div class="wd-total"><span>Taxa de entrega</span><span>'+brl(fee())+'</span></div>':'')
   +'<div class="wd-total"><span>Total estimado</span><strong>'+brl(total()+fee())+'</strong></div>'
   +'<p class="wd-warning">Pagamento ainda não confirmado. O pedido entra na Cozinha ao finalizar e poderá ser acompanhado no módulo Loja Online.</p>'
   +'<p class="wd-error" id="wd-error" role="alert"></p></form>';
  const form=byId('wd-data');
  form.querySelectorAll('[data-wd-kind]').forEach(b=>b.onclick=()=>{
   saveFields();
   kind=b.dataset.wdKind;
   fields.method=kind==='delivery'?'cash':'cash_on_pickup';
   renderForm();
  });
  const zone=byId('wd-zone');
  if(zone)zone.onchange=()=>{
   saveFields();const selected=config.zones.find(z=>z.id===fields.zone);
   if(selected){
    fields.city=selected.city;fields.state=selected.state;
    if(selected.neighborhoods?.length===1)fields.neighborhood=selected.neighborhoods[0];
    if(selected.postal_code_from&&selected.postal_code_from===selected.postal_code_to)fields.postal_code=selected.postal_code_from;
   }
   renderForm();
  };
  back.hidden=false;next.hidden=false;next.disabled=false;next.textContent='Confirmar pedido · '+brl(total()+fee());
 }
 function renderSuccess(){
  main.innerHTML='<section class="wd-card wd-success">'+icon('checkCircle',42)+'<h3>Pedido enviado à cozinha</h3><p>Pedido <b>'+escapeText(created?.order?.public_code||'registrado')+'</b> · '+brl(created?.order?.total_cents||0)+'</p><p>Pagamento pendente de confirmação; não foi cobrado automaticamente.</p><span class="wd-link">'+escapeText(created?.tracking_url||'')+'</span><button class="wd-link-button" id="wd-copy" type="button">'+icon('clipboard',16)+' Copiar link de acompanhamento</button><p class="wd-muted">A entrega/retirada pode ser acompanhada pela Gestão e Cozinha.</p></section>';
  byId('wd-copy').onclick=async()=>{
   try{await navigator.clipboard.writeText(created.tracking_url);byId('wd-copy').textContent='Link copiado'}catch{prompt('Copie o link de acompanhamento:',created.tracking_url)}
  };
  back.hidden=true;next.hidden=false;next.disabled=false;next.textContent='Novo pedido';
 }
 function render(){
  byId('wd-title').textContent=step==='done'?'Pedido registrado':step==='items'?'Novo pedido':'Dados do cliente';
  byId('wd-subtitle').textContent=step==='done'?'Pronto para acompanhar':step==='items'?'1 de 2 · Produtos':'2 de 2 · Entrega e pagamento';
  main.scrollTop=0;
  if(step==='items')renderItems();
  else if(step==='form')renderForm();
  else renderSuccess();
 }
 async function submit(){
  saveFields();
  const er=byId('wd-error');
  const phone=digits(fields.phone);
  if(fields.name.length<2||phone.length<10||phone.length>13){er.textContent='Informe o nome e o telefone do cliente.';return}
  if(kind==='delivery'){
   if(!fields.zone||!fields.street||!fields.number||!fields.neighborhood||!fields.city||!/^[A-Z]{2}$/.test(fields.state.toUpperCase())||digits(fields.postal_code).length!==8){
    er.textContent='Confira região, rua, número, bairro, cidade, UF e CEP.';return;
   }
  }
  const body={
   action:'create',restaurant_id:restaurant.id,request_id:requestId,kind,
   zone_id:kind==='delivery'?fields.zone:null,
   address:kind==='delivery'?{
    street:fields.street,number:fields.number,neighborhood:fields.neighborhood,
    city:fields.city,state:fields.state.toUpperCase(),postal_code:digits(fields.postal_code),
    complement:fields.complement,reference:fields.reference
   }:null,
   customer_name:fields.name,customer_phone:phone,customer_note:fields.note,
   payment_method:fields.method,
   items:[...cart.values()].map(v=>({product_id:v.product.id,quantity:v.qty,note:v.note}))
  };
  if(!confirm('Confirmar pedido de '+(kind==='delivery'?'DELIVERY':'RETIRADA')+' para '+fields.name+'? Os itens serão enviados diretamente à Cozinha e o estoque será reservado.'))return;
  saving=true;next.disabled=true;back.disabled=true;next.textContent='Registrando pedido...';
  try{
   const {data,error}=await supabase.functions.invoke('marketplace-staff-orders',{body});
   if(error||data?.error){
    let message=data?.error??error?.message??'Não foi possível registrar o pedido.';
    try{const details=await error?.context?.json?.();if(details?.error)message=details.error}catch{}
    throw Error(message);
   }
   created=data;step='done';render();if(typeof afterCreated==='function')afterCreated();
  }catch(err){er.textContent=err.message||'Erro ao registrar pedido.'}
  finally{saving=false;back.disabled=false;next.disabled=false;if(step==='form')next.textContent='Confirmar pedido · '+brl(total()+fee())}
 }
 next.onclick=()=>{
  if(saving)return;
  if(step==='items'){if(!cart.size)return;setStep('form')}
  else if(step==='form')submit();
  else{cart.clear();requestId=crypto.randomUUID();created=null;query='';setStep('items')}
 };
 back.onclick=()=>{if(!saving&&step==='form'){saveFields();setStep('items')}};
 try{
  const {data,error}=await supabase.functions.invoke('marketplace-staff-orders',{body:{action:'config',restaurant_id:restaurant.id}});
  if(error||data?.error)throw Error(data?.error??error?.message??'Falha ao carregar entregas');
  if(!dlg.isConnected)return;
  config=data;
  if(data.settings?.delivery_enabled===false&&data.settings?.pickup_enabled===false)throw Error('Ative delivery ou retirada na Loja Online.');
  if(!data.zones?.length||data.settings?.delivery_enabled===false)kind='pickup';
  if(!data.settings?.enabled||data.settings?.paused)throw Error('A Loja Online precisa estar habilitada e sem pausa para calcular os pedidos.');
  render();
 }catch(err){
  main.innerHTML='<div class="wd-card"><h3>Pedidos indisponíveis</h3><p class="wd-error">'+escapeText(err.message||'Verifique a configuração da Loja Online.')+'</p><p class="wd-muted">Confira a ativação da loja, regiões de entrega e suas permissões de Garçom.</p></div>';
  next.hidden=true;
 }
}
