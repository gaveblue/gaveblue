import {icon} from './ui-icons.js?v=1.0.0-rc.1';

// Vitrine prévia real. NÃO cria pedidos e não envia dados pessoais.
export async function renderMarketplace({supabase,route,box,esc,link}){
 document.body.classList.add('iv-marketplace');
 const css='<link rel="stylesheet" href="/intervalo/marketplace-preview-rc1.css?v=1.1.0-rc.1">';
 const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n??0)/100);
 const nav=css+'<nav class="iv-mkt-nav" aria-label="Navegação do marketplace"><a class="iv-mkt-brand" href="'+link('/explorar')+'">intervalo</a>'
  +'<div class="iv-mkt-links"><span class="iv-mkt-preview">PRÉVIA</span><a href="'+link('/inicio')+'">'+icon('store',15)+' Gestão</a></div></nav>';
 const bottom=(active='inicio')=>'<nav class="iv-mkt-bottom" aria-label="Navegação do consumidor">'
  +[['inicio','home','Início','/explorar'],['buscar','search','Buscar','/explorar'],['pedidos','receipt','Pedidos','/pedido'],['perfil','user','Perfil','/cliente']].map(([id,sym,label,to])=>'<a href="'+link(to)+'" class="'+(id===active?'active':'')+'">'+icon(sym,20)+esc(label)+'</a>').join('')+'</nav>';
 const page=(inner,active='inicio')=>box('<div class="iv-mkt-shell">'+nav+inner+bottom(active)+'</div>');
 const loading=()=>page('<div class="iv-mkt-hero"><div><span class="iv-mkt-eyebrow">INTERVALO MARKETPLACE</span><h1>Seu próximo pedido começa aqui</h1><p>Estamos preparando uma nova experiência de delivery.</p></div><div class="iv-mkt-icon-large">'+icon('store',54)+'</div></div><div class="iv-loading-inline" role="status" aria-busy="true"><span class="iv-load-dot" aria-hidden="true"></span> Preparando os restaurantes...</div>');
 const safePhoto=url=>typeof url==='string'&&/^https:\/\/[^\s<>"']+$/.test(url)?url:null;
 const logo=(url,name)=>safePhoto(url)?'<img src="'+esc(url)+'" alt="'+esc(name)+'" loading="lazy">':icon('store',27);
 const service=async body=>{
  const {data,error}=await supabase.functions.invoke('marketplace-public',{body});
  if(error||data?.error)throw Error('Não foi possível carregar a vitrine. Verifique sua conexão e tente novamente.');
  return data;
 };
 const placeholder=(title,description,retryLink='/explorar',retryLabel='Explorar restaurantes')=>'<div class="iv-mkt-empty">'+icon('info',27)+'<h2>'+esc(title)+'</h2><p>'+esc(description)+'</p><a class="iv-mkt-action" href="'+link(retryLink)+'">'+icon('arrowLeft',15)+' '+esc(retryLabel)+'</a></div>';
 const sectionHeading='<div class="iv-mkt-eyebrow">ESCOLHA SEU PRÓXIMO SABOR</div><h2 class="iv-mkt-title">Restaurantes para você</h2><p class="iv-mkt-description">As lojas só ficam visíveis nesta lista quando o estabelecimento decide participar do marketplace.</p>';

 if(route[0]==='explorar'){
  loading();
  try{
   const data=await service({action:'discover'});
   const rows=data.restaurants??[];
   let cards=rows.map(r=>'<a class="iv-mkt-store" href="'+link('/loja/'+encodeURIComponent(r.slug))+'" data-mkt-store data-search="'+esc([r.name,r.description,...(r.cuisine_tags??[]),r.city??''].join(' ').toLocaleLowerCase('pt-BR'))+'">'
    +'<span class="iv-mkt-store-icon">'+logo(r.logo_url,r.name)+'</span><span class="iv-mkt-store-copy"><strong>'+esc(r.name)+'</strong>'
    +'<small>'+esc([r.city,r.state].filter(Boolean).join(' · ')||'Consulte o cardápio digital')+'</small>'
    +'<small>'+(r.customer_orders_enabled?'Pedido online disponível':'Cardápio para consulta · pedidos em breve')+'</small></span>'+icon('chevronRight',18)+'</a>').join('');
   if(!rows.length)cards=placeholder('Restaurantes em preparação','Estamos organizando as primeiras lojas do Intervalo. O marketplace ainda não recebe pedidos online.','/','Voltar ao Intervalo');
   page('<section class="iv-mkt-hero"><div><span class="iv-mkt-eyebrow">INTERVALO MARKETPLACE</span><h1>Descubra novos sabores</h1><p>Restaurantes perto de você, cardápios próprios e, em breve, pedidos de delivery e retirada.</p></div><div class="iv-mkt-icon-large">'+icon('store',56)+'</div></section>'
     +sectionHeading
     +(rows.length?'<div class="iv-mkt-filter"><label class="iv-mkt-input">'+icon('search',19)+'<input id="iv-mkt-search" type="search" aria-label="Buscar restaurantes" placeholder="Buscar restaurantes ou comidas"></label></div>':'')
     +'<div class="iv-mkt-grid" id="iv-mkt-results">'+cards+'</div>'
     +(rows.length?'<p id="iv-mkt-count" class="iv-mkt-description">'+rows.length+' restaurante(s)</p><div class="iv-mkt-empty" id="iv-mkt-not-found" hidden>Nenhum restaurante encontrado para a busca.</div>':''),'inicio');
   const search=document.getElementById('iv-mkt-search');
   if(search){
    const items=[...document.querySelectorAll('[data-mkt-store]')];
    search.oninput=()=>{
     const q=search.value.trim().toLocaleLowerCase('pt-BR');let n=0;
     for(const item of items){item.hidden=!!q&&!item.dataset.search.includes(q);if(!item.hidden)n++}
     document.getElementById('iv-mkt-not-found').hidden=n>0;
     document.getElementById('iv-mkt-count').textContent=n+' restaurante(s)';
    };
   }
  }catch{
   page(placeholder('Não foi possível carregar os restaurantes','A consulta ao marketplace falhou. Tente atualizar a página.','/explorar','Tentar novamente'));
  }
  return;
 }

 if(route[0]==='loja'){
  if(route.length!==2||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(route[1])){page(placeholder('Loja inválida','Confira o endereço da loja.'));return}
  loading();
  try{
   const data=await service({action:'store',slug:route[1]});
   if(!data.published){page(placeholder('Loja indisponível','Este restaurante ainda não publicou seu cardápio.'));return}
   const r=data.restaurant,cats=data.categories??[],allowed=new Set(cats.map(x=>x.id));
   const products=(data.products??[]).filter(x=>allowed.has(x.category_id));
   const storeTitle=esc(r.name);
   const photo=logo(r.logo_url,r.name);
   let out='<div class="iv-mkt-store-head"><div class="iv-mkt-store-avatar">'+photo+'</div><div><span class="iv-mkt-eyebrow">LOJA DO RESTAURANTE</span><h1>'+storeTitle+'</h1><p>'+esc(r.description||'Conheça o cardápio deste restaurante.')+'</p>'
      +'<span class="iv-mkt-pill">'+icon('store',14)+' '+esc([r.city,r.state].filter(Boolean).join(' · ')||'Cardápio público')+'</span>'
      +'<span class="iv-mkt-pill">'+icon('info',14)+' Pedidos online em preparação</span></div></div>'
      +'<div class="iv-mkt-empty" style="padding:14px;text-align:left;margin-bottom:21px">'+icon('info',20)+' <strong>Vitrine de prévia.</strong> Os preços e produtos são reais do cardápio, mas a compra online ainda não está liberada.</div>'
      +'<div class="iv-mkt-filter"><label class="iv-mkt-input">'+icon('search',17)+'<input id="iv-mkt-product-search" type="search" aria-label="Buscar produto" placeholder="Buscar no cardápio"></label></div>'
      +'<div class="iv-mkt-pills" role="group" aria-label="Categorias"><button type="button" data-mkt-cat="all" aria-pressed="true">Todos</button>'
      +cats.map(c=>'<button type="button" data-mkt-cat="'+esc(c.id)+'" aria-pressed="false">'+esc(c.name)+'</button>').join('')+'</div>'
      +'<h2 class="iv-mkt-title" style="font-size:21px">Cardápio</h2><p class="iv-mkt-description">'+products.length+' produto(s) disponíveis para consulta</p><div class="iv-mkt-product-grid">';
   for(const p of products){
    const category=cats.find(c=>c.id===p.category_id);
    const picture=safePhoto(p.image_url);
    out+='<button class="iv-mkt-product" type="button" data-mkt-product="'+esc(p.id)+'" data-category="'+esc(p.category_id)+'" data-search="'+esc([p.name,p.description,category?.name].join(' ').toLocaleLowerCase('pt-BR'))+'" aria-label="Ver detalhes de '+esc(p.name)+'">'
     +'<span class="iv-mkt-photo">'+(picture?'<img src="'+esc(picture)+'" alt="'+esc(p.name)+'" loading="lazy">':icon('burger',46))+'</span>'
     +'<span class="iv-mkt-body"><strong>'+esc(p.name)+'</strong><p>'+esc(p.description??'')+'</p><span class="iv-mkt-price">'+money(p.price_cents)+'</span></span></button>';
   }
   if(!products.length)out+=placeholder('Cardápio sem produtos','O restaurante ainda não cadastrou itens disponíveis.');
   out+='</div><div id="iv-mkt-empty" class="iv-mkt-empty" hidden>Nenhum produto encontrado.</div>';
   page(out,'buscar');
   const inputs=[...document.querySelectorAll('[data-mkt-product]')];
   const search=document.getElementById('iv-mkt-product-search');
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
   document.querySelectorAll('[data-mkt-product]').forEach(b=>b.onclick=()=>{
    const p=products.find(x=>String(x.id)===b.dataset.mktProduct);if(!p)return;
    const extras=(data.options??[]).filter(x=>x.product_id===p.id);
    const dialog=document.createElement('dialog');dialog.className='iv-mkt-sheet';dialog.setAttribute('aria-label','Detalhes de '+p.name);
    dialog.innerHTML='<div class="iv-mkt-sheet-handle"></div><div class="iv-mkt-sheet-content"><h2>'+esc(p.name)+'</h2><p>'+esc(p.description??'')+'</p><strong class="iv-mkt-price">'+money(p.price_cents)+'</strong>'
      +(extras.length?'<h3 style="font-size:13px">Adicionais</h3><p>'+extras.map(x=>esc(x.name)+' (+ '+money(x.price_delta_cents)+')').join(' · ')+'</p>':'')
      +'<p>Os pedidos online estarão disponíveis após a conclusão dos testes.</p><button class="iv-mkt-sheet-close" type="button">Fechar</button></div>';
    document.body.append(dialog);
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});
    dialog.addEventListener('click',e=>{if(e.target===dialog||e.target.closest('.iv-mkt-sheet-close'))dialog.close()});
    dialog.showModal();dialog.querySelector('.iv-mkt-sheet-close')?.focus({preventScroll:true});
   });
  }catch{
   page(placeholder('Não foi possível abrir a loja','Tente novamente. Se continuar acontecendo, confira se o cardápio está publicado.','/loja/'+route[1],'Tentar novamente'));
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
