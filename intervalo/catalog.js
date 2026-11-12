import {icon} from './ui-icons.js?v=1.0.0-rc.1';
// Intervalo: cadastro de categorias, produtos e publicação de cardápio.
export async function renderPage({supabase,restaurant,box,esc,link}){
 document.body.classList.add('iv-fullwidth','iv-catalog');
 const style='<style>.op-card{padding:19px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;margin:12px 0}.op-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}.op-cards .op-card{margin:0}.op-form{display:flex;gap:11px;flex-wrap:wrap;align-items:end}.op-form label{font-size:12px;font-weight:700;flex:1 1 175px}.op-form input,.op-form select{display:block;width:100%;padding:11px;border:1px solid #cbd5e1;border-radius:9px;margin-top:7px;background:white;color:#0f172a}.op-btn{background:#ff7600;color:#fff;border:0;padding:11px 14px;border-radius:9px;cursor:pointer;font-weight:700}.op-btn.alt{background:#e2e8f0;color:#334155}.op-photo{width:100%;height:130px;background:#ffede0;border-radius:11px;object-fit:cover;display:block;margin-bottom:10px}.op-photo-placeholder{height:130px;display:grid;place-items:center;background:linear-gradient(135deg,#fff3e7,#ffddbb);border-radius:11px;font-size:55px;margin-bottom:10px}.op-warn{padding:14px;background:#fffbeb;border:1px solid #fcd34d;border-radius:11px;font-size:12px}.op-muted{color:#64748b;font-size:13px}</style>';
 const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)/100);
 const cents=t=>{const v=String(t).replace(/\s/g,'').replace(',','.');if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(v))throw Error('Informe valor no formato 18,50');const [i,f='']=v.split('.');return Number(i)*100+Number((f+'00').slice(0,2))};
 const call=async(action,params={})=>{const {data,error}=await supabase.functions.invoke('restaurant-core',{body:{restaurant_id:restaurant.id,action,...params}});if(error){let msg=error.message;try{const d=await error.context?.json?.();msg=d?.error??msg}catch{}throw Error(msg)}if(data?.error)throw Error(data.error);return data};
 const field=(name,label,value='',extra='')=>'<label>'+label+'<input name="'+name+'" value="'+esc(value)+'" '+extra+'></label>';
 const form=(id,cb)=>{const f=document.getElementById(id);if(f)f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('button');b.disabled=true;try{await cb(Object.fromEntries(new FormData(f).entries()));await load()}catch(err){alert(err.message);b.disabled=false}}};
 const binding=(sel,cb)=>document.querySelectorAll(sel).forEach(b=>b.onclick=async()=>{b.disabled=true;try{await cb(b);await load()}catch(err){alert(err.message);b.disabled=false}});
 const start=style+'<div class="iv-header"><div><span class="iv-section-caption">CARDÁPIO DO RESTAURANTE</span><h1>'+icon('receipt',25)+' Cardápio digital</h1><p>'+esc(restaurant.name)+' · Publicação, categorias e visualização da vitrine.</p></div><a class="iv-btn secondary" href="'+link('/'+restaurant.slug+'/gestao')+'">'+icon('arrowLeft',16)+' Voltar à gestão</a></div>';
 async function load(){
  box(start+'<section class="op-card">Carregando cardápio...</section>');
  try{
  const d=await call('catalog'),cats=d.categories??[],products=d.products??[],options=d.options??[],published=!!d.publication?.is_published;
  let out=start+'<section class="op-card"><h2>Publicação</h2><p>'+ (published?'Visível para os clientes':'Oculto até a publicação') +'</p><p><a href="'+link('/'+restaurant.slug+'/cardapio')+'">Visualizar cardápio público</a></p><p class="op-muted">Compartilhe o endereço ou QR Code somente depois de publicar o cardápio.</p><button type="button" class="op-btn alt" id="copy-menu">Copiar link</button> <button type="button" class="op-btn alt" id="qr-menu">Gerar QR Code</button><div id="qr-preview" style="margin-top:12px"></div><p></p><button id="publish" class="op-btn">'+(published?'Despublicar':'Publicar cardápio')+'</button><p class="op-warn">Nesta fase o cardápio é somente consulta; não recebe pedidos diretos de clientes.</p></section>';
  out+='<div class="op-cards"><section class="op-card"><h2>'+icon('layers',19)+' Categorias</h2><p class="op-muted">Organize a vitrine em grupos.</p><form id="newcat" class="op-form">'+field('name','Nome da categoria','','required minlength="2" maxlength="90"')+'<button class="op-btn">Cadastrar categoria</button></form></section>'
    +'<section class="op-card"><h2>'+icon('store',19)+' Cadastro de produtos</h2><p class="op-muted">O nome, preço, foto, disponibilidade e a chave <b>Exibir no cardápio</b> ficam concentrados em <b>Estoque e Produtos → Produtos</b>.</p>'
    +'<a class="iv-btn" href="'+link('/'+restaurant.slug+'/estoque?aba=produtos')+'">'+icon('arrowRight',17)+' Abrir cadastro de produtos</a></section></div>';
  out+='<h2>Categorias ('+cats.length+')</h2><div class="op-cards">';
  for(const c of cats)out+='<article class="op-card"><strong>'+esc(c.name)+'</strong><p class="op-muted">'+(c.active?'Ativa':'Oculta')+' · '+products.filter(p=>p.category_id===c.id).length+' produto(s)</p><button class="op-btn alt" data-cat="'+esc(c.id)+'">'+(c.active?'Ocultar':'Exibir')+'</button></article>';
  out+='</div><div class="iv-toolbar"><h2>'+icon('receipt',19)+' Produtos do catálogo ('+products.length+')</h2><a href="'+link('/'+restaurant.slug+'/estoque?aba=produtos')+'" class="iv-btn secondary">'+icon('settings',16)+' Editar preços</a></div><div class="op-cards">';
    for(const p of products){
      const photo=typeof p.image_url==='string'&&/^https:\/\/[^\s<>"']+$/.test(p.image_url)?p.image_url:null;
      const visible=!!p.show_on_menu,available=!!p.available;
      out+='<article class="op-card">'+(photo?'<img class="op-photo" src="'+esc(photo)+'" alt="Foto de '+esc(p.name)+'" loading="lazy" referrerpolicy="no-referrer">':'<div class="op-photo-placeholder">'+icon('store',43)+'</div>')
        +'<h3>'+esc(p.name)+'</h3><b>'+money(p.price_cents)+'</b><p class="op-muted">'+esc(p.description??'')+'</p>'
        +'<div class="iv-actions"><span class="iv-chip '+(visible?'orange':'')+'">'+(visible?'Marcado para cardápio':'Oculto no cardápio')+'</span>'
        +'<span class="iv-chip '+(available?'success':'danger')+'">'+(available?'Disponível':'Venda pausada')+'</span></div></article>';
    }
    if(!products.length)out+='<div class="iv-empty">Nenhum produto cadastrado. Cadastre em Estoque e Produtos.</div>';
    out+='</div>';
  out+='<section class="op-card"><h2>Adicionais</h2><p class="op-warn">Os adicionais podem aparecer no cardápio, mas a composição de adicionais em comandas ainda depende da próxima implementação.</p><form class="op-form" id="newopt"><label>Produto<select name="product_id" required>'+products.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('')+'</select></label>'+field('name','Nome do adicional','','required minlength="2" maxlength="120"')+field('price','Valor adicional em R$','0,00','required')+'<button class="op-btn">Adicionar</button></form></section>';
  box(out);
  form('newcat',v=>call('category_create',{name:v.name,sort_order:0}));
  form('newopt',v=>call('option_create',{name:v.name,price_delta_cents:cents(v.price),product_id:v.product_id}));
  binding('[data-cat]',b=>{const c=cats.find(c=>c.id===b.dataset.cat);return call('category_update',{id:c.id,name:c.name,sort_order:c.sort_order,active:!c.active})});
  binding('#publish',()=>call('menu_publish',{published:!published}));
  const menuUrl=new URL(link('/'+restaurant.slug+'/cardapio'),location.origin).href;
  const copyButton=document.getElementById('copy-menu');
  copyButton.onclick=async()=>{try{await navigator.clipboard.writeText(menuUrl);copyButton.textContent='Link copiado'}catch{prompt('Copie o link do cardápio:',menuUrl)}};
  const qrButton=document.getElementById('qr-menu');
  qrButton.onclick=async()=>{
    qrButton.disabled=true;qrButton.textContent='Gerando QR...';
    try{
      const imported=await import('https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm');
      const qr=imported.default??imported;
      const dataUrl=await qr.toDataURL(menuUrl,{width:260,margin:2,errorCorrectionLevel:'M'});
      const dest=document.getElementById('qr-preview');dest.replaceChildren();
      const img=document.createElement('img');img.src=dataUrl;img.width=260;img.height=260;img.alt='QR Code do cardápio público';
      const tip=document.createElement('p');tip.className='op-muted';tip.textContent='Aponte a câmera para abrir '+menuUrl+'. Este QR não processa pagamentos nem pedidos.';
      dest.append(img,tip);
    }catch{document.getElementById('qr-preview').textContent='Não foi possível gerar o QR Code. Use Copiar link.'}
    finally{qrButton.disabled=false;qrButton.textContent='Gerar QR Code'}
  };
  }catch(e){box(start+'<section class="op-card"><p class="error">'+esc(e.message)+'</p></section>')}
 }
 return load();
}