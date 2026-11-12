import {icon} from './ui-icons.js?v=1.0.0-rc.1';
// Intervalo 0.9.7 — cardápio público somente consulta. Sem pedidos ou cobranças online.
export async function renderPublicMenu({supabase,slug,box,esc,link}){
 document.body.classList.add('intervalo-menu');
 const css='<style>body.intervalo-menu{background:#fff8f3;color:#172033}body.intervalo-menu>header,body.intervalo-menu>.foot{display:none}body.intervalo-menu #app .wrap{max-width:1120px;padding:0 18px 50px}.dm-bar{display:flex;align-items:center;justify-content:space-between;padding:18px 0;gap:15px}.dm-logo{font-size:26px;font-weight:900;font-style:italic;letter-spacing:-1.5px}.dm-logo:after{content:"";display:block;width:66%;height:4px;background:#ff7600;border-radius:20px;transform:rotate(-3deg);margin:-2px 0 0 21px}.dm-bar small{font-size:11px;color:#81909d;text-align:right}.dm-hero{background:linear-gradient(120deg,#ff840b,#ed5700);border-radius:24px;padding:38px;color:#fff;position:relative;overflow:hidden}.dm-hero:after{content:"";width:210px;height:210px;border:38px solid #ffffff27;border-radius:100%;position:absolute;right:-75px;top:-80px}.dm-hero>*{position:relative;z-index:1}.dm-hero h1{font-size:clamp(28px,5vw,46px);letter-spacing:-1.3px;margin:9px 0}.dm-hero p{font-size:14px;line-height:1.6;color:#fff9f0;max-width:580px}.dm-tag{font-size:11px;letter-spacing:2px;font-weight:900;text-transform:uppercase}.dm-hero button{margin:9px 8px 0 0;padding:10px 14px;border-radius:11px;border:1px solid #ffffff80;background:#ffffff29;color:#fff;font-weight:800;cursor:pointer}.dm-tools{position:sticky;top:0;z-index:10;background:#fff8f3ec;backdrop-filter:blur(12px);padding:15px 0 10px;border-bottom:1px solid #ffe0c5}.dm-tools input{background:#fff;width:100%;border:1px solid #ffdcbd;border-radius:14px;padding:13px 15px;box-shadow:none}.dm-categories{display:flex;gap:8px;overflow:auto;scrollbar-width:none;padding:13px 0 0}.dm-categories::-webkit-scrollbar{display:none}.dm-categories button{white-space:nowrap;background:#fff;border:1px solid #ffdac0;border-radius:50px;padding:9px 14px;color:#815536;font-size:13px;font-weight:800;cursor:pointer}.dm-categories button[aria-pressed=true]{background:#ff7100;color:#fff;border-color:#ff7100}.dm-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:25px 0 16px}.dm-head h2{margin:0;font-size:25px;letter-spacing:-.8px}.dm-counter{font-size:12px;color:#818c99}.dm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:15px}.dm-card{background:#fff;border:1px solid #f4e4d6;border-radius:19px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 5px 12px #653d1f08}.dm-photo{height:165px;background:linear-gradient(130deg,#fff3e4,#ffdeb7);display:grid;place-items:center;position:relative;overflow:hidden}.dm-photo img{width:100%;height:100%;object-fit:cover;display:block}.dm-photo span{font-size:68px}.dm-photo b{font-size:10px;background:#ffffffed;border-radius:50px;color:#e66b04;position:absolute;left:10px;top:10px;padding:6px 10px}.dm-content{padding:17px;display:flex;flex-direction:column;flex:1;gap:6px}.dm-content h3{font-size:17px;line-height:1.25;margin:2px 0}.dm-content p{font-size:12px;color:#728096;line-height:1.5;flex:1;margin:3px 0;overflow-wrap:anywhere}.dm-content strong{color:#f06a00;font-size:19px;margin:10px 0}.dm-content details{font-size:12px;color:#485569;border-top:1px solid #f3e3d5;padding-top:10px}.dm-content summary{cursor:pointer;font-weight:750}.dm-content ul{padding-left:19px;line-height:1.8}.dm-card[hidden]{display:none!important}.dm-empty[hidden]{display:none!important}.dm-empty{background:#fff;border:1px dashed #ffca9f;border-radius:15px;padding:35px;text-align:center;color:#856447}.dm-footer{text-align:center;margin:35px 0;padding:20px 0;border-top:1px solid #f2ddc8;font-size:12px;line-height:1.6;color:#80909b}.dm-footer b{color:#ee6e00}@media(max-width:580px){.dm-bar{padding:14px 0}.dm-logo{font-size:22px}.dm-hero{padding:26px 22px;border-radius:18px}.dm-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.dm-photo{height:117px}.dm-photo span{font-size:47px}.dm-content{padding:11px}.dm-content h3{font-size:14px}.dm-content strong{font-size:17px}.dm-content p{font-size:11px}.dm-photo b{display:none}}@media(max-width:340px){.dm-grid{grid-template-columns:1fr}.dm-photo{height:175px}}</style>';
 const bar='<div class="dm-bar"><div class="dm-logo">Intervalo</div><small>Cardápio digital<br>Uma experiência Gaveblue</small></div>';
 box(css+bar+'<div class="dm-empty" role="status">Carregando cardápio...</div>');
 let data;
 try{
  const result=await supabase.functions.invoke('public-menu',{body:{slug}});
  if(result.error||!result.data?.published)throw Error('Não publicado');
  data=result.data;
 }catch{
  box(css+bar+'<section class="dm-empty"><h1>Cardápio indisponível</h1><p>O restaurante não publicou o cardápio ou está temporariamente indisponível.</p><a href="'+link('/')+'">Voltar</a></section>');
  return;
 }
 const cats=data.categories??[],catIds=new Set(cats.map(c=>c.id));
 const products=(data.products??[]).filter(p=>catIds.has(p.category_id));
 const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n??0)/100);
 const categoryIcon=name=>icon(/bebid|sucos|refriger|drink/i.test(name)?'cup':/pizza/i.test(name)?'pizza':/sobremesa|doce/i.test(name)?'cake':/batata|porç|acomp/i.test(name)?'package':/cafe|café/i.test(name)?'coffee':'burger',52);
 const safeImage=p=>typeof p.image_url==='string'&&/^https:\/\/[^\s<>"']+$/.test(p.image_url)?p.image_url:null;
 let out=css+bar+'<section class="dm-hero"><span class="dm-tag">Bem-vindo ao nosso cardápio</span><h1>'+esc(data.restaurant.name)+'</h1><p>Encontre seus sabores favoritos. Consulte a equipe do restaurante para realizar seu pedido.</p><button type="button" id="dm-share">Compartilhar cardápio</button><button type="button" id="dm-copy">Copiar link</button></section>'
 +'<section class="dm-tools"><input type="search" id="dm-search" aria-label="Buscar no cardápio" placeholder="Buscar lanches, bebidas, produtos..." autocomplete="off"><div class="dm-categories" role="group" aria-label="Categorias">'
 +'<button type="button" data-dm-cat="all" aria-pressed="true">Todos</button>'+cats.map(c=>'<button type="button" data-dm-cat="'+esc(c.id)+'" aria-pressed="false">'+esc(c.name)+'</button>').join('')+'</div></section>'
 +'<div class="dm-head"><h2>Nosso cardápio</h2><span id="dm-counter" class="dm-counter">'+products.length+' opções</span></div><div class="dm-grid">';
 for(const p of products){
  const cat=cats.find(c=>c.id===p.category_id),photo=safeImage(p),extras=(data.options??[]).filter(o=>o.product_id===p.id);
  out+='<article class="dm-card" data-dm-product data-category="'+esc(p.category_id)+'" data-search="'+esc((p.name+' '+(p.description??'')+' '+(cat?.name??'')).toLocaleLowerCase('pt-BR'))+'">'
    +'<div class="dm-photo">'+(photo?'<img src="'+esc(photo)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" alt="'+esc(p.name)+'">':'<span aria-hidden="true">'+categoryIcon(cat?.name??'')+'</span>')
    +'<b>'+esc(cat?.name??'Produto')+'</b></div><div class="dm-content"><h3>'+esc(p.name)+'</h3><p>'+esc(p.description??'')+'</p><strong>'+money(p.price_cents)+'</strong>';
  if(extras.length)out+='<details><summary>Opcionais ('+extras.length+')</summary><ul>'+extras.map(o=>'<li>'+esc(o.name)+' · +'+money(o.price_delta_cents)+'</li>').join('')+'</ul></details>';
  out+='</div></article>';
 }
 out+='</div><div class="dm-empty" id="dm-empty" hidden>Nenhum produto encontrado.</div><div class="dm-footer">Cardápio de consulta. Pedidos e pagamentos são realizados diretamente com o estabelecimento.<p>Preços e disponibilidade sujeitos à alteração.<br>Plataforma <b>Intervalo</b> · Gaveblue</p></div>';
 box(out);
 document.querySelectorAll('.dm-photo img').forEach(img=>img.addEventListener('error',()=>{
  const picture=img.parentNode;
  const fallback=document.createElement('span');fallback.innerHTML=icon('burger',48);fallback.setAttribute('aria-label','Sem foto disponível');
  img.replaceWith(fallback);
 }));
 const input=document.getElementById('dm-search'),cards=[...document.querySelectorAll('[data-dm-product]')];let category='all';
 const refresh=()=>{
  const q=input.value.trim().toLocaleLowerCase('pt-BR');let visible=0;
  for(const card of cards){const show=(category==='all'||card.dataset.category===category)&&(!q||card.dataset.search.includes(q));card.hidden=!show;if(show)visible++}
  document.getElementById('dm-counter').textContent=visible+' opções';
  document.getElementById('dm-empty').hidden=visible>0;
 };
 input.oninput=refresh;
 document.querySelectorAll('[data-dm-cat]').forEach(b=>b.onclick=()=>{
  category=b.dataset.dmCat;
  document.querySelectorAll('[data-dm-cat]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  refresh();
 });
 const url=new URL(link('/'+slug+'/cardapio'),location.origin).href;
 const copy=async()=>{try{await navigator.clipboard.writeText(url);return true}catch{return false}};
 document.getElementById('dm-copy').onclick=async e=>{e.currentTarget.textContent=(await copy())?'Link copiado':'Copie o link na barra de endereço'};
 document.getElementById('dm-share').onclick=async()=>{
  if(typeof navigator.share==='function')try{await navigator.share({title:'Cardápio · '+data.restaurant.name,url});return}catch(e){if(e?.name==='AbortError')return}
  if(await copy())alert('Link do cardápio copiado.');
 };
}
