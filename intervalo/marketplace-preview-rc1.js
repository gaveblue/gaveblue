import {mountHome} from './marketplace-home-rc30.js?v=1.1.0-rc.30';
import {groupProducts,chooseVariant} from './product-variants-rc28.js?v=1.1.0-rc.28';
import {icon} from './ui-icons.js?v=1.0.0-rc.1';
import {readCatalog,saveCatalog,forgetCatalog,publicResult} from './public-catalog-cache-rc26.js?v=1.1.0-rc.28';
import {addCartItem,loadCart,cartCount} from './marketplace-cart-rc4.js?v=1.1.0-rc.4';

// Vitrine prévia real. NÃO cria pedidos e não envia dados pessoais.
export async function renderMarketplace({supabase,route,box,esc,link}){
 document.body.classList.add('iv-marketplace');
 const originalLink=link;
 link=(target)=>{
  if((target==='/explorar'||target==='/explorar?buscar=1')||/^\/loja\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(target))return originalLink('/?intervalo_route='+encodeURIComponent(originalLink(target))+'&iv_release=1.1.0-rc.30');
  return originalLink(target);
 };
 const css='<link rel="stylesheet" href="/intervalo/marketplace-preview-rc1.css?v=1.1.0-rc.30"><link rel="stylesheet" href="/intervalo/marketplace-commerce-rc4.css?v=1.1.0-rc.4">';
 const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n??0)/100);
 const nav=css+'<nav class="iv-mkt-nav" aria-label="Navegação do marketplace"><a class="iv-mkt-brand" href="'+link('/explorar')+'">intervalo</a>'
  +'</nav>';
 const bottom=(active='inicio')=>'<nav class="iv-mkt-bottom" aria-label="Navegação do consumidor">'
  +[['inicio','home','Início','/explorar'],['buscar','search','Buscar','/explorar?buscar=1'],['pedidos','receipt','Pedidos','/pedido'],['perfil','user','Perfil','/cliente']].map(([id,sym,label,to])=>'<a href="'+link(to)+'" class="'+(id===active?'active':'')+'">'+icon(sym,20)+esc(label)+'</a>').join('')+'</nav>';
 const page=(inner,active='inicio',storePage=false)=>{
  box('<div class="iv-mkt-shell'+(storePage?' is-store-page':route[0]==='explorar'?' is-home-page':'')+'">'+nav+inner+bottom(active)+'</div>');
  document.querySelectorAll('.iv-mkt-photo img,.iv-mkt-store-icon img,.iv-mkt-store-avatar img').forEach(img=>img.addEventListener('error',()=>{
   if(!img.isConnected)return;
   const span=document.createElement('span');
   span.innerHTML=icon(img.closest('.iv-mkt-photo')?'burger':'store',img.closest('.iv-mkt-photo')?43:27);
   span.setAttribute('aria-label','Imagem indisponível');
   img.replaceWith(span);
  },{once:true}));
 };
 const loading=()=>page('<div class="iv-mkt-hero"><div><span class="iv-mkt-eyebrow">INTERVALO MARKETPLACE</span><h1>Seu próximo pedido começa aqui</h1><p>Estamos preparando uma nova experiência de delivery.</p></div><div class="iv-mkt-icon-large">'+icon('store',54)+'</div></div><div class="iv-loading-inline" role="status" aria-busy="true"><span class="iv-load-dot" aria-hidden="true"></span> Preparando os restaurantes...</div>');
 const safePhoto=url=>typeof url==='string'&&/^https:\/\/[^\s<>"']+$/.test(url)?url:null;
 const logo=(url,name)=>safePhoto(url)?'<img src="'+esc(url)+'" alt="'+esc(name)+'" loading="lazy">':icon('store',27);
 const service=async body=>{
  const {data,error}=await supabase.functions.invoke('marketplace-public',{body});
  if(error||data?.error)throw Error('Não foi possível carregar a vitrine. Verifique sua conexão e tente novamente.');
  return data;
 };
 const placeholder=(title,description,retryLink='/explorar',retryLabel='Explorar restaurantes')=>'<div class="iv-mkt-empty">'+icon('info',27)+'<h2>'+esc(title)+'</h2><p>'+esc(description)+'</p><a class="iv-mkt-action" href="'+link(retryLink)+'">'+icon('arrowLeft',15)+' '+esc(retryLabel)+'</a></div>';
 if(route[0]==='explorar'){
  const searchMode=new URLSearchParams(location.search).get('buscar')==='1';
  const args={page,esc,link,safePhoto,logo,searchMode};
  mountHome({...args,rows:[],busy:true});
  try{const data=await service({action:'discover'});mountHome({...args,rows:data.restaurants??[]})}
  catch{mountHome({...args,rows:[],error:true})}
  return;
 }

 if(route[0]==='loja'){
  if(route.length!==2||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(route[1])){page(placeholder('Loja inválida','Confira o endereço da loja.'));return}
  const slug=route[1],cached=readCatalog('store',slug);
  const renderStore=(data,checking=false,previous=null)=>{
   const r=data.restaurant,cats=data.categories??[],allowed=new Set(cats.map(x=>x.id));
   const products=(data.products??[]).filter(x=>allowed.has(x.category_id));const grouped=groupProducts(products);
   // RC23 — perfil da loja com capa, avatar sobreposto e metadados compactos.
   const rawName=String(r.name??'').trim();
   const publicName=(!rawName||rawName===r.slug)?String(r.slug??route[1]).replace(/-/g,' ').replace(/(^|\s)\p{L}/gu,x=>x.toLocaleUpperCase('pt-BR')):rawName;
   const storeTitle=esc(publicName);
   const photo=logo(r.logo_url,publicName);
   const cover=safePhoto(r.banner_url);
   const online=data.online_settings??{};
   const isOpen=data.checkout_available===true;
   const statusLabel=checking?'Verificando disponibilidade':isOpen?'Aberto para pedidos':data.customer_orders_enabled?'Fechado para pedidos':'Pedidos online indisponíveis';
   const min=Number(online.minimum_order_cents??0);
   const hasMin=Number.isFinite(min)&&min>0;
   const place=[r.city,r.state].filter(Boolean).join(' - ');
   const description=String(r.description??'').trim();
   let out='<section class="iv-mkt-store-profile" aria-label="Informações do restaurante">'
      +'<div class="iv-mkt-cover">'+(cover?'<img src="'+esc(cover)+'" alt="Capa do restaurante" loading="eager">':'<div class="iv-mkt-cover-placeholder">'+icon('store',30)+'</div>')+'</div>'
      +'<div class="iv-mkt-cover-actions"><a class="iv-mkt-cover-button" href="'+link('/explorar')+'" aria-label="Voltar para restaurantes" title="Voltar">'+icon('arrowLeft',22)+'</a><button class="iv-mkt-cover-button" id="iv-mkt-open-search" type="button" aria-label="Buscar no cardápio" aria-controls="iv-mkt-search-panel" aria-expanded="false">'+icon('search',23)+'</button></div>'
      +'<div class="iv-mkt-store-head"><div class="iv-mkt-store-avatar">'+photo+'</div><h1>'+storeTitle+'</h1>'
      +'<div class="iv-mkt-store-meta"><span class="iv-mkt-store-status '+(isOpen?'is-open':'is-closed')+'" role="status">'+statusLabel+'</span>'
      +(hasMin?'<span class="iv-mkt-store-min">Mín. '+money(min)+'</span>':'')
      +'<button type="button" class="iv-mkt-store-info" id="iv-mkt-store-info">Informações '+icon('chevronRight',14)+'</button></div>'
      +(place?'<div class="iv-mkt-store-place">'+esc(place)+'</div>':'')
      +(description?'<p class="iv-mkt-store-description">'+esc(description)+'</p>':'')
      +(checking?'<p class="iv-mkt-store-notice" role="status" id="iv-public-cache-status">'+icon('refresh',15)+'<span>Atualizando preços e disponibilidade...</span></p>':!isOpen?'<p class="iv-mkt-store-notice">'+icon('info',15)+'<span>Você pode consultar o cardápio; a finalização está indisponível no momento.</span></p>':'')
      +'</div></section>'
      +'<div class="iv-mkt-filter iv-mkt-store-search" id="iv-mkt-search-panel" hidden><label class="iv-mkt-input">'+icon('search',17)+'<input id="iv-mkt-product-search" type="search" aria-label="Buscar produto" placeholder="Buscar no cardápio"></label></div>'
      +'<div class="iv-mkt-pills" role="group" aria-label="Categorias"><button type="button" data-mkt-cat="all" aria-pressed="true">Todos</button>'
      +cats.map(c=>'<button type="button" data-mkt-cat="'+esc(c.id)+'" aria-pressed="false">'+esc(c.name)+'</button>').join('')+'</div>'
      +'<div class="iv-mkt-catalog-head"><div><h2 class="iv-mkt-title" style="font-size:21px">Cardápio</h2><p class="iv-mkt-description">'+grouped.length+' produto(s) disponíveis para consulta</p></div>'
      +'<div class="iv-mkt-view" role="group" aria-label="Modo de visualização"><button type="button" data-mkt-view="list" aria-label="Exibir produtos em lista" title="Lista" aria-pressed="false">'+icon('bars',19)+'</button><button type="button" data-mkt-view="grid" aria-label="Exibir produtos em grade" title="Grade" aria-pressed="true">'+icon('dashboard',19)+'</button></div></div><div class="iv-mkt-product-grid">';
   for(const g of grouped){
    const p=g.product,category=cats.find(c=>c.id===p.category_id);
    const picture=safePhoto(p.image_url);
    out+='<button class="iv-mkt-product" type="button" data-mkt-product="'+esc(g.key)+'" data-category="'+esc(p.category_id)+'" data-search="'+esc([g.name,g.search,p.description,category?.name].join(' ').toLocaleLowerCase('pt-BR'))+'" aria-label="Ver detalhes de '+esc(p.name)+'">'
     +'<span class="iv-mkt-photo">'+(picture?'<img src="'+esc(picture)+'" alt="'+esc(p.name)+'" loading="lazy" decoding="async">':icon('burger',46))+'</span>'
     +'<span class="iv-mkt-body"><strong>'+esc(g.name)+'</strong><p>'+esc(p.description??'')+'</p><span class="iv-mkt-price">'+(g.variants.length>1?'A partir de ':'')+money(g.price)+'</span></span></button>';
   }
   if(!products.length)out+=placeholder('Cardápio sem produtos','O restaurante ainda não cadastrou itens disponíveis.');
   out+='</div><div id="iv-mkt-empty" class="iv-mkt-empty" hidden>Nenhum produto encontrado.</div><div id="iv-com-cartbar" class="iv-com-cartbar" hidden></div>';
   page(out,'buscar',true);
   const coverImg=document.querySelector('.iv-mkt-store-profile .iv-mkt-cover img');
   coverImg?.addEventListener('error',()=>{
     const fallback=document.createElement('div');fallback.className='iv-mkt-cover-placeholder';fallback.innerHTML=icon('store',30);coverImg.replaceWith(fallback);
   },{once:true});
   const infoButton=document.getElementById('iv-mkt-store-info');
   infoButton.onclick=()=>{
     const hours=Array.isArray(data.hours)?data.hours:[];
     const weekdays=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
     const hourRows=hours.map(h=>'<div class="iv-mkt-info-row"><span>'+esc(weekdays[Number(h.weekday)]??'Dia')+'</span><strong>'+esc(String(h.opens_at??'').slice(0,5))+' – '+esc(String(h.closes_at??'').slice(0,5))+'</strong></div>').join('');
     const modes=[online.delivery_configured?'Entrega':null,online.pickup_configured?'Retirada':null].filter(Boolean).join(' · ');
     const dialog=document.createElement('dialog');dialog.className='iv-mkt-sheet';dialog.setAttribute('aria-label','Informações do restaurante');
     dialog.innerHTML='<div class="iv-mkt-sheet-handle"></div><div class="iv-mkt-sheet-content"><h2>'+storeTitle+'</h2><p>'+statusLabel+'</p>'
      +(description?'<p>'+esc(description)+'</p>':'')+(place?'<div class="iv-mkt-info-row"><span>Localização</span><strong>'+esc(place)+'</strong></div>':'')
      +(hasMin?'<div class="iv-mkt-info-row"><span>Pedido mínimo</span><strong>'+money(min)+'</strong></div>':'')
      +(modes?'<div class="iv-mkt-info-row"><span>Modalidades</span><strong>'+esc(modes)+'</strong></div>':'')
      +'<h3>Horários cadastrados</h3>'+(hourRows||'<p>Nenhum horário informado pelo restaurante.</p>')
      +'<button class="iv-mkt-sheet-close" type="button">Fechar</button></div>';
     dialog.querySelector('button').onclick=()=>dialog.close();
     dialog.addEventListener('close',()=>dialog.remove(),{once:true});
     dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
     document.body.append(dialog);dialog.showModal();
   };
   const cartBar=document.getElementById('iv-com-cartbar');
   const refreshCart=()=>{
     const current=loadCart(route[1]),qty=cartCount(current);
     cartBar.hidden=checking||qty===0;
     if(qty&&!checking){
       const subtotal=current.items.reduce((sum,i)=>{
         const p=products.find(x=>x.id===i.product_id);
         const extra=(data.options??[]).filter(x=>i.option_ids.includes(x.id)).reduce((n,x)=>n+Number(x.price_delta_cents),0);
         return sum+(Number(p?.price_cents??0)+extra)*i.quantity;
       },0);
       cartBar.innerHTML='<span><strong>'+qty+' item(ns)</strong><small>Subtotal estimado: '+money(subtotal)+'</small></span>'
         +'<a href="'+link('/checkout?loja='+encodeURIComponent(route[1]))+'">Ver carrinho '+icon('arrowRight',16)+'</a>';
     }
   };
   refreshCart();
   const inputs=[...document.querySelectorAll('[data-mkt-product]')];
   const productGrid=document.querySelector('.iv-mkt-product-grid');
   const setView=mode=>{
     productGrid.classList.toggle('is-list',mode==='list');
     document.querySelectorAll('[data-mkt-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mktView===mode)));
     try{localStorage.setItem('intervalo-market-view:'+route[1],mode)}catch{}
   };
   document.querySelectorAll('[data-mkt-view]').forEach(b=>b.onclick=()=>setView(b.dataset.mktView));
   let preferredView='grid';
   try{preferredView=localStorage.getItem('intervalo-market-view:'+route[1])==='list'?'list':'grid'}catch{}
   setView(preferredView);
   const search=document.getElementById('iv-mkt-product-search');
   const searchPanel=document.getElementById('iv-mkt-search-panel');
   const searchButton=document.getElementById('iv-mkt-open-search');
   searchButton.onclick=()=>{
     const show=searchPanel.hidden;searchPanel.hidden=!show;
     searchButton.setAttribute('aria-expanded',String(show));
     if(show){search.focus({preventScroll:true});searchPanel.scrollIntoView({block:'nearest'})}
     else{search.value='';filter()}
   };
   let activeCat='all';
   const filter=()=>{
    const q=search.value.trim().toLocaleLowerCase('pt-BR');let count=0;
    for(const el of inputs){const show=(activeCat==='all'||el.dataset.category===activeCat)&&(!q||el.dataset.search.includes(q));el.hidden=!show;if(show)count++}
    document.getElementById('iv-mkt-empty').hidden=count>0;
   };
   search.oninput=filter;
   document.querySelectorAll('[data-mkt-cat]').forEach(b=>b.onclick=()=>{
    activeCat=b.dataset.mktCat;
    document.querySelectorAll('[data-mkt-cat]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    filter();
   });
   if(previous){
    if(previous.cat==='all'||cats.some(c=>String(c.id)===previous.cat))activeCat=previous.cat;
    search.value=previous.query;
    searchPanel.hidden=!previous.searchOpen;
    searchButton.setAttribute('aria-expanded',String(previous.searchOpen));
    document.querySelectorAll('[data-mkt-cat]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mktCat===activeCat)));
    filter();
    if(previous.y)window.scrollTo(0,previous.y);
    if(previous.focused&&!searchPanel.hidden)search.focus({preventScroll:true});
   }
   if(checking)document.querySelectorAll('[data-mkt-product]').forEach(b=>{b.disabled=true;b.setAttribute('aria-disabled','true')});
   const openProduct=p=>{
    if(checking||!p)return;
    const extras=(data.options??[]).filter(x=>x.product_id===p.id);
    const dialog=document.createElement('dialog');dialog.className='iv-mkt-sheet';dialog.setAttribute('aria-label','Detalhes de '+p.name);
    const detailPhoto=safePhoto(p.image_url);
    dialog.innerHTML='<div class="iv-mkt-sheet-handle"></div><div class="iv-mkt-sheet-content">'
      +(detailPhoto?'<figure class="iv-mkt-detail-photo"><div><img src="'+esc(detailPhoto)+'" alt="'+esc(p.name)+'" decoding="async"></div><figcaption>Imagem meramente ilustrativa</figcaption></figure>':'')
      +'<div class="iv-mkt-detail-heading"><h2>'+esc(p.name)+'</h2><strong class="iv-mkt-price">'+money(p.price_cents)+'</strong></div><p>'+esc(p.description??'')+'</p>'
      +(extras.length?'<h3>Adicionais</h3><div class="iv-com-options">'+extras.map(x=>'<label class="iv-com-option"><input type="checkbox" name="option" value="'+esc(x.id)+'"><span>'+esc(x.name)+'</span><strong>+ '+money(x.price_delta_cents)+'</strong></label>').join('')+'</div>':'')
      +'<label class="iv-com-field">Observações<textarea id="iv-com-note" maxlength="350" rows="2" placeholder="Ex.: sem cebola"></textarea></label>'
      +'<div class="iv-com-quantity"><span>Quantidade</span><button type="button" data-qty="-1">−</button><strong id="iv-com-qty">1</strong><button type="button" data-qty="1">+</button></div>'
      +'<p class="iv-com-error" id="iv-com-error" hidden></p>'
      +'<div class="iv-com-actions"><button type="button" class="iv-com-secondary" data-close>Cancelar</button><button type="button" class="iv-com-primary" data-add>Adicionar ao carrinho</button></div></div>';
    const previewImg=dialog.querySelector('.iv-mkt-detail-photo img');
    if(previewImg){
     const onFailure=()=>previewImg.closest('figure')?.remove();
     previewImg.addEventListener('error',onFailure,{once:true});
     if(previewImg.complete&&!previewImg.naturalWidth)onFailure();
    }
    let qty=1;
    dialog.querySelectorAll('[data-qty]').forEach(btn=>btn.onclick=()=>{
      qty=Math.max(1,Math.min(20,qty+Number(btn.dataset.qty)));
      dialog.querySelector('#iv-com-qty').textContent=qty;
    });
    dialog.querySelector('[data-close]').onclick=()=>dialog.close();
    dialog.querySelector('[data-add]').onclick=()=>{
      try{
        const option_ids=[...dialog.querySelectorAll('input[name="option"]:checked')].map(x=>x.value);
        addCartItem(route[1],{product_id:p.id,option_ids,quantity:qty,note:dialog.querySelector('#iv-com-note').value});
        dialog.close();refreshCart();
      }catch(e){
        const err=dialog.querySelector('#iv-com-error');err.textContent=e.message;err.hidden=false;
      }
    };
    document.body.append(dialog);
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
    dialog.showModal();dialog.querySelector('[data-close]')?.focus({preventScroll:true});
   };
   document.querySelectorAll('[data-mkt-product]').forEach(b=>b.onclick=()=>{if(!checking)chooseVariant(grouped.find(g=>String(g.key)===b.dataset.mktProduct),money,openProduct)});
  };
  let shownCache=false;
  if(cached){try{renderStore(cached.data,true);shownCache=true}catch{forgetCatalog('store',slug);loading()}}
  else loading();
  try{
   const data=await publicResult(await supabase.functions.invoke('marketplace-public',{body:{action:'store',slug}}));
   if(data?.published!==true||!data.restaurant||data.restaurant.slug!==slug){forgetCatalog('store',slug);page(placeholder('Loja indisponível','Este restaurante ainda não publicou seu cardápio.'));return}
   const previous=shownCache?{cat:document.querySelector('[data-mkt-cat][aria-pressed="true"]')?.dataset.mktCat??'all',query:document.getElementById('iv-mkt-product-search')?.value??'',searchOpen:document.getElementById('iv-mkt-search-panel')?.hidden===false,y:window.scrollY,focused:document.activeElement?.id==='iv-mkt-product-search'}:null;
   document.querySelectorAll('dialog.iv-mkt-sheet[open]').forEach(d=>d.close());
   saveCatalog('store',slug,data);
   renderStore(data,false,previous);
  }catch(e){
   if(e?.unavailable){forgetCatalog('store',slug);page(placeholder('Loja indisponível','O cardápio não está disponível neste momento.'));return}
   if(shownCache){
    const status=document.getElementById('iv-public-cache-status');
    if(status){status.innerHTML=icon('info',15)+'<span>Não foi possível atualizar. Exibindo a última consulta; compras indisponíveis. <button type="button" class="iv-mkt-cache-retry">Tentar novamente</button></span>';status.querySelector('button').onclick=()=>location.reload()}
    return;
   }
   page(placeholder('Não foi possível abrir a loja','Tente novamente. Se continuar acontecendo, confira se o cardápio está publicado.','/loja/'+slug,'Tentar novamente'));
  }
  return;
 }

 const titles={checkout:'Checkout em preparação',pedido:'Acompanhamento em preparação',cliente:'Conta de cliente em preparação'};
 const explanations={
  checkout:'Estamos implementando a compra com ou sem cadastro, entregas próprias e valores calculados no servidor. Nenhum pedido pode ser enviado nesta prévia.',
  pedido:'Quando os pedidos online forem liberados, o cliente receberá um link privado para consultar o andamento.',
  cliente:'A conta do consumidor será opcional e separada do acesso de funcionários e restaurantes.'
 };
 const kind=route[0];
 page('<section style="margin-top:38px"><span class="iv-mkt-eyebrow">PRÓXIMA ETAPA</span><h1 class="iv-mkt-title">'+esc(titles[kind]||'Página não encontrada')+'</h1></section>'
   +placeholder('Funcionalidade ainda não liberada',explanations[kind]||'Essa área não está disponível.','/explorar','Voltar à vitrine'),
   kind==='cliente'?'perfil':kind==='pedido'?'pedidos':'inicio');
}
