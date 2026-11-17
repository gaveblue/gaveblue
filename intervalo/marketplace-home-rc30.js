// RC30 · Marketplace do consumidor; artes vetoriais locais, sem bibliotecas externas.
import {icon} from './ui-icons.js?v=1.0.0-rc.1';
const svg=(body)=>'<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'+body+'</svg>';
const burger='<ellipse cx="60" cy="88" rx="49" ry="7" fill="#9b4e1525"/><path d="M15 75Q17 92 60 91Q103 92 105 75Z" fill="#df862d"/><path d="M18 77Q59 90 102 76" stroke="#f9b85d" stroke-width="5" fill="none"/><rect x="13" y="62" width="94" height="15" rx="8" fill="#64351e"/><path d="M16 62Q50 55 104 62L91 76L62 66L37 74Z" fill="#ffc441"/><path d="M15 53Q29 49 43 54T70 53T105 53L103 62H15Z" fill="#d34835"/><path d="M10 49Q18 40 29 47T48 45T67 47T88 43L109 49L105 57Q95 53 85 58T58 55T31 57L15 54Z" fill="#6a9834"/><path d="M13 46C13 20 36 7 60 7S107 20 107 46Q60 53 13 46Z" fill="#e89b3d"/><path d="M21 37Q31 12 60 12Q87 11 100 35" stroke="#ffcf7b" stroke-width="5" stroke-linecap="round" fill="none"/><g fill="#fff0bc"><ellipse cx="39" cy="26" rx="3" ry="1.5" transform="rotate(-30 39 26)"/><ellipse cx="57" cy="20" rx="3" ry="1.5"/><ellipse cx="76" cy="25" rx="3" ry="1.5" transform="rotate(30 76 25)"/><ellipse cx="88" cy="36" rx="3" ry="1.5"/><ellipse cx="56" cy="36" rx="3" ry="1.5"/></g>';
const pizza='<ellipse cx="60" cy="85" rx="49" ry="7" fill="#6f371324"/><circle cx="60" cy="49" r="42" fill="#c87a36"/><circle cx="60" cy="49" r="35" fill="#ffd36c"/><circle cx="60" cy="49" r="32" fill="#f0a43d"/><g fill="#b94132" stroke="#d45a49" stroke-width="2"><circle cx="43" cy="30" r="9"/><circle cx="78" cy="30" r="8"/><circle cx="61" cy="54" r="10"/><circle cx="34" cy="63" r="8"/><circle cx="81" cy="68" r="8"/></g><g fill="#598f45"><path d="m54 34 9-6-1 11zM74 47l10 4-11 4zM49 74l8-11 3 9z"/></g><path d="M60 7v84M18 49h84M30 19l60 60M30 79l60-60" stroke="#b46d2c" stroke-width="1" opacity=".45"/>';
const meal='<ellipse cx="60" cy="85" rx="49" ry="7" fill="#67533718"/><circle cx="60" cy="48" r="44" fill="#e1e9ed"/><circle cx="60" cy="48" r="36" fill="#fff"/><path d="M25 50Q19 26 47 20Q63 23 63 46L51 62Z" fill="#f5e7c8"/><g stroke="#ddcda7" stroke-width="2" stroke-linecap="round"><path d="m30 34 5 2m4-9 5 2m-5 13 5 1m8-11 5 2m-7 12 5 1m-22 4 5 1"/></g><path d="M56 56Q69 28 89 39Q105 53 82 75Q65 86 56 56Z" fill="#8e4f2c"/><g stroke="#5b311f" stroke-width="3" opacity=".8"><path d="m63 52 22 13m-15-23 23 12"/></g><g fill="#71a85b"><circle cx="34" cy="66" r="10"/><circle cx="45" cy="73" r="10"/><circle cx="28" cy="76" r="7"/></g><g fill="#d4503d"><circle cx="29" cy="65" r="5"/><circle cx="43" cy="77" r="5"/></g>';
const drink='<ellipse cx="60" cy="91" rx="32" ry="5" fill="#71340c21"/><path d="M75 32 84 4H95" stroke="#ed6c46" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M29 24H90L81 87H39Z" fill="#c1d4d9"/><path d="M33 37H86L79 83H41Z" fill="#824529"/><ellipse cx="59.5" cy="25" rx="30" ry="6" fill="#f8fcfd"/><ellipse cx="59.5" cy="29" rx="25" ry="5" fill="#a6603c"/><g fill="#e8b78b" opacity=".7"><rect x="43" y="30" width="15" height="12" rx="3" transform="rotate(-20 43 30)"/><rect x="62" y="32" width="15" height="12" rx="3" transform="rotate(20 62 32)"/></g><path d="m40 43 5 32" stroke="#f9faf9" opacity=".4" stroke-width="4" stroke-linecap="round"/>';
const acai='<ellipse cx="60" cy="88" rx="43" ry="7" fill="#51334b1f"/><path d="M15 48Q20 86 60 88Q100 86 105 48" fill="#8978ad"/><ellipse cx="60" cy="47" rx="45" ry="21" fill="#553054"/><ellipse cx="60" cy="44" rx="40" ry="17" fill="#6b3c70"/><g fill="#f5d584" stroke="#e4ac57" stroke-width="1"><circle cx="36" cy="40" r="9"/><circle cx="49" cy="47" r="9"/><circle cx="64" cy="51" r="9"/></g><g fill="#de5055"><path d="M65 28Q54 30 63 43Q77 44 78 33Q74 27 65 28Z"/><path d="M84 36Q73 40 83 53Q96 53 99 43Q97 37 84 36Z"/></g><g fill="#e8b779"><circle cx="28" cy="51" r="3"/><circle cx="37" cy="56" r="3"/><circle cx="50" cy="59" r="3"/><circle cx="80" cy="58" r="3"/></g>';
const arts={burger,pizza,meal,drink,acai};
const pin='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 10-8 10S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>';
const heart='<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.9 8.5c0 4.1-8.9 9.4-8.9 9.4S3.1 12.6 3.1 8.5a4.7 4.7 0 0 1 8.9-2.1 4.7 4.7 0 0 1 8.9 2.1Z"/></svg>';
const categories=[['burger','Lanches',/lanch|hamb[uú]rg|burger|sandu[ií]ch/],['pizza','Pizzas',/pizza/],['meal','Refeições',/refei[cç]|restaurante|almo[cç]|marmit|comida|prato|churras|jantar/],['drink','Bebidas',/bebida|drink|sucos|refrigerante|bar/],['acai','Açaí',/a[cç]a[ií]|sorvete/]];
const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
export function matchesQuery(haystack,query){
 const q=normalize(query).trim(),hay=normalize(haystack);
 if(!q)return true;
 const words=[...new Set(q.split(/[^a-z0-9]+/).filter(x=>x.length>=2))].slice(0,8);
 return words.length?words.every(word=>hay.includes(word)):hay.includes(q);
}
const cityKey=r=>[r.city,r.state].filter(Boolean).join(', ');
export const displayName=r=>{const name=String(r.name??'').trim();return !name||name===r.slug?String(r.slug??'').replace(/-/g,' ').replace(/(^|\s)\p{L}/gu,x=>x.toLocaleUpperCase('pt-BR')):name};
const getLocal=(k,fallback)=>{try{return JSON.parse(localStorage.getItem(k))??fallback}catch{return fallback}};
const putLocal=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const keys={city:'intervalo-market-city-v1',favorites:'intervalo-market-favorites-v1'};
const validSlug=s=>typeof s==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
export function mountHome({rows,page,esc,link,safePhoto,logo,searchMode=false,busy=false,error=false,searchProducts}){
 const records=Array.isArray(rows)?rows.filter(r=>validSlug(r.slug)):[];
 const cities=[...new Set(records.map(cityKey).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 let city=getLocal(keys.city,'');
 if(typeof city!=='string'||!cities.includes(city))city='';
 if(!city&&cities.length===1&&records.every(x=>cityKey(x)))city=cities[0];
 const saved=getLocal(keys.favorites,[]);const favorites=new Set(Array.isArray(saved)?saved.filter(validSlug).slice(0,100):[]);
 let selected='all',openOnly=false,favoriteOnly=false,mode='all',q='';
 let productMatches=new Map(),searchState='idle',timer=null,generation=0;
 const recent=new Map(),bySlug=new Map(records.map(r=>[r.slug,r]));
 const status=r=>r.checkout_available===true?['open','Aberto para pedidos']:r.customer_orders_enabled?['closed','Fechado no momento']:['closed','Pedidos indisponíveis'];
 const cards=records.map(r=>{
  const name=displayName(r),cover=safePhoto(r.banner_url),st=status(r);
  const tags=Array.isArray(r.cuisine_tags)?r.cuisine_tags.filter(t=>typeof t==='string').slice(0,3).join(' · '):'';
  return '<article class="iv-home-card" data-home-card="'+esc(r.slug)+'"><a class="iv-home-card-link" href="'+link('/loja/'+r.slug)+'" aria-label="Abrir '+esc(name)+'"><div class="iv-home-card-cover">'+(cover?'<img src="'+esc(cover)+'" alt="" loading="lazy" decoding="async">':'<span>'+icon('store',37)+'</span>')+'</div><div class="iv-home-card-body"><span class="iv-mkt-store-icon">'+logo(r.logo_url,name)+'</span><div class="iv-home-card-copy"><strong>'+esc(name)+'</strong>'+(tags||cityKey(r)?'<small>'+esc(tags||cityKey(r))+'</small>':'')+'<span class="iv-home-status '+st[0]+'">'+st[1]+'</span><small class="iv-home-product-match" data-home-match hidden></small></div></div></a><button class="iv-home-favorite" type="button" data-home-favorite="'+esc(r.slug)+'" aria-label="Favoritar '+esc(name)+'" aria-pressed="'+favorites.has(r.slug)+'">'+heart+'</button></article>';
 }).join('');
 const markup='<section class="iv-home-head"><div class="iv-home-top"><button class="iv-home-location" type="button" id="iv-home-city"><small>Entregar em</small><strong>'+pin+'<span id="iv-home-city-label">'+esc(city||'Selecionar cidade')+'</span>'+icon('chevronDown',15)+'</strong></button><button class="iv-home-bell" type="button" id="iv-home-bell" aria-label="Notificações">'+icon('bell',23)+'</button></div><label class="iv-home-search">'+icon('search',21)+'<input type="search" id="iv-home-search" placeholder="O que vamos pedir hoje?" aria-label="Buscar restaurantes e produtos" maxlength="80" autocomplete="off"></label></section>'
 +'<section class="iv-home-banner"><div><small>SEU MOMENTO INTERVALO</small><h1>Deu fome?</h1><p>Peça seus favoritos por aqui.</p></div><span class="iv-home-banner-art">'+svg(burger)+'</span></section>'
 +'<div class="iv-home-categories" role="group" aria-label="Categorias de comida">'+categories.map(([id,name])=>'<button type="button" data-home-category="'+id+'" aria-pressed="false"><span>'+svg(arts[id])+'</span><strong>'+name+'</strong></button>').join('')+'</div>'
 +'<div class="iv-home-filters" role="group" aria-label="Filtrar restaurantes"><button type="button" id="iv-home-all" aria-pressed="true">Todos</button><button type="button" id="iv-home-open" aria-pressed="false">Abertos agora</button><button type="button" id="iv-home-filters" aria-pressed="false">'+icon('sliders',16)+' Filtros</button></div>'
 +'<div class="iv-home-heading"><h2 id="iv-home-heading">Restaurantes para você</h2></div><p class="iv-home-search-status" id="iv-home-search-status" role="status" aria-live="polite" hidden></p>'
 +(busy?'<div class="iv-home-skeleton" role="status" aria-label="Carregando restaurantes"><div></div><span></span><span></span></div>':error?'<div class="iv-mkt-empty">Não foi possível carregar os restaurantes.<br><a class="iv-mkt-action" href="'+link('/explorar')+'">Tentar novamente</a></div>':'<div class="iv-home-grid" id="iv-home-grid">'+cards+'</div><div class="iv-mkt-empty" id="iv-home-empty" hidden><h2>Nenhum restaurante encontrado</h2><p>Tente outra cidade ou limpe os filtros.</p><button class="iv-mkt-action" type="button" id="iv-home-reset">Limpar filtros</button></div>');
 page(markup,searchMode?'buscar':'inicio');
 const $=id=>document.getElementById(id);
 const search=$('iv-home-search');search.disabled=busy||error;
 const items=[...document.querySelectorAll('[data-home-card]')];
 const filter=()=>{
  const term=normalize(q.trim());let count=0;
  for(const card of items){
   const r=bySlug.get(card.dataset.homeCard);
   const hay=normalize([displayName(r),r.description,...(Array.isArray(r.cuisine_tags)?r.cuisine_tags:[]),cityKey(r)].join(' '));
   const match=productMatches.get(r.slug), localMatch=matchesQuery(hay,term);
   const hint=card.querySelector('[data-home-match]');
   hint.hidden=!match;
   if(match)hint.textContent='Encontrado: '+match.matches.join(' · ')+(match.matched_count>match.matches.length?' +'+(match.matched_count-match.matches.length):'');
   else hint.textContent='';
   card.querySelector('.iv-home-card-link').href=link('/loja/'+r.slug+(match&&term?'?q='+encodeURIComponent(q.trim()):''));
   const rule=categories.find(c=>c[0]===selected)?.[2];
   const hide=!!((city&&cityKey(r)!==city)||(term&&!localMatch&&!match)||(rule&&!rule.test(hay))||(openOnly&&r.checkout_available!==true)||(favoriteOnly&&!favorites.has(r.slug))||(mode==='delivery'&&!r.delivery_available)||(mode==='pickup'&&!r.pickup_available));
   card.hidden=hide;if(!hide)count++;
  }
  if($('iv-home-empty'))$('iv-home-empty').hidden=count>0||searchState==='pending';
  const live=$('iv-home-search-status');
  live.hidden=!term;
  live.textContent=searchState==='pending'?'Buscando produtos nos cardápios...':searchState==='error'?'Busca de produtos indisponível. Exibindo apenas resultados por restaurante.':term.length<3?'Digite pelo menos 3 caracteres para procurar produtos.':count+' restaurante(s) encontrado(s)';
  $('iv-home-heading').textContent=term?'Resultados da busca':city?'Restaurantes perto de você':'Restaurantes para você';
  $('iv-home-city-label').textContent=city||'Selecionar cidade';
  $('iv-home-all').setAttribute('aria-pressed',String(selected==='all'&&!openOnly&&!favoriteOnly&&mode==='all'));
  $('iv-home-open').setAttribute('aria-pressed',String(openOnly));
  $('iv-home-filters').setAttribute('aria-pressed',String(favoriteOnly||mode!=='all'));
  document.querySelectorAll('[data-home-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.homeCategory===selected)));
 };
 const cancelSearch=()=>{generation++;clearTimeout(timer);timer=null;productMatches=new Map();searchState='idle'};
 const applyResults=data=>{
  productMatches=new Map((Array.isArray(data?.results)?data.results:[]).filter(r=>validSlug(r.slug)&&Array.isArray(r.matches)).map(r=>[r.slug,{matches:r.matches.filter(x=>typeof x==='string').slice(0,3),matched_count:Number(r.matched_count)||0}]));
  searchState='done';filter();
 };
 const scheduleSearch=()=>{
  cancelSearch();const term=normalize(q).trim();
  if(busy||error||typeof searchProducts!=='function'||term.length<3||!/[a-z0-9]{2}/.test(term)){filter();return}
  const old=recent.get(term);
  if(old&&Date.now()-old.at<60000){applyResults(old.data);return}
  searchState='pending';filter();const ticket=generation,requested=q.trim().slice(0,80);
  timer=setTimeout(async()=>{
   try{
    const result=await searchProducts(requested);
    if(ticket!==generation||!search.isConnected)return;
    if(recent.size>=20)recent.delete(recent.keys().next().value);
    recent.set(term,{at:Date.now(),data:result});applyResults(result);
   }catch{if(ticket===generation&&search.isConnected){searchState='error';filter()}}
  },500);
 };
 const reset=()=>{selected='all';openOnly=false;favoriteOnly=false;mode='all';q='';search.value='';cancelSearch();filter()};
 const sheet=(title,body,onBind)=>{
  const dlg=document.createElement('dialog');dlg.className='iv-mkt-sheet iv-home-sheet';dlg.setAttribute('aria-label',title);
  dlg.innerHTML='<div class="iv-mkt-sheet-handle"></div><div class="iv-mkt-sheet-content"><h2>'+esc(title)+'</h2>'+body+'<button type="button" class="iv-mkt-sheet-close" data-home-close>Fechar</button></div>';
  dlg.querySelector('[data-home-close]').onclick=()=>dlg.close();dlg.addEventListener('close',()=>dlg.remove(),{once:true});dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});document.body.append(dlg);onBind?.(dlg);dlg.showModal();dlg.querySelector('[data-home-close]').focus({preventScroll:true});
 };
 $('iv-home-city').onclick=()=>sheet('Onde você está?','<p>Escolha entre as cidades cadastradas pelos restaurantes.</p><div class="iv-home-choice">'+['',...cities].map(c=>'<button type="button" data-home-city="'+esc(c)+'" aria-pressed="'+(city===c)+'">'+esc(c||'Todas as cidades')+'</button>').join('')+'</div>',dlg=>dlg.querySelectorAll('[data-home-city]').forEach(b=>b.onclick=()=>{city=b.dataset.homeCity;putLocal(keys.city,city);filter();dlg.close()}));
 $('iv-home-bell').onclick=()=>sheet('Notificações','<p>As notificações ainda não estão habilitadas. Você pode consultar o acompanhamento dos seus pedidos.</p><a class="iv-mkt-action" href="'+link('/pedido')+'">Meus pedidos</a>');
 $('iv-home-filters').onclick=()=>sheet('Filtros','<div class="iv-home-choice"><button type="button" data-home-mode="all" aria-pressed="'+(mode==='all')+'">Todas as modalidades</button><button type="button" data-home-mode="delivery" aria-pressed="'+(mode==='delivery')+'">Entrega</button><button type="button" data-home-mode="pickup" aria-pressed="'+(mode==='pickup')+'">Retirada</button><button type="button" id="iv-home-fav-only" aria-pressed="'+favoriteOnly+'">Somente favoritos</button></div>',dlg=>{
  dlg.querySelectorAll('[data-home-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.homeMode;dlg.querySelectorAll('[data-home-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));filter()});
  dlg.querySelector('#iv-home-fav-only').onclick=e=>{favoriteOnly=!favoriteOnly;e.currentTarget.setAttribute('aria-pressed',String(favoriteOnly));filter()};
 });
 $('iv-home-all').onclick=reset;$('iv-home-open').onclick=()=>{openOnly=!openOnly;filter()};
 $('iv-home-reset')?.addEventListener('click',reset);
 search.oninput=()=>{q=search.value;scheduleSearch()};
 document.querySelectorAll('[data-home-category]').forEach(b=>b.onclick=()=>{selected=selected===b.dataset.homeCategory?'all':b.dataset.homeCategory;filter()});
 document.querySelectorAll('[data-home-favorite]').forEach(b=>b.onclick=()=>{const s=b.dataset.homeFavorite;if(favorites.has(s))favorites.delete(s);else {if(favorites.size>=100)favorites.delete(favorites.values().next().value);favorites.add(s)}putLocal(keys.favorites,[...favorites]);b.setAttribute('aria-pressed',String(favorites.has(s)));filter()});
 document.querySelectorAll('.iv-home-card-cover img').forEach(img=>{const fallback=()=>{if(img.isConnected){const parent=img.parentElement;img.remove();parent.innerHTML='<span>'+icon('store',37)+'</span>'}};img.addEventListener('error',fallback,{once:true});if(img.complete&&!img.naturalWidth)fallback()});
 filter();
 if(searchMode&&!busy&&!error)search.focus({preventScroll:true});
}
