import {icon} from './ui-icons.js?v=1.0.0-rc.1';
// Intervalo — cadastros operacionais auxiliares (mesas, estoque, dispositivos, relatórios).
export async function renderPage({supabase,restaurant,module,box,esc,link}){
 document.body.classList.add('iv-fullwidth','iv-support');
 const css='<style>.x-panel{padding:19px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;margin:13px 0}.x-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:14px}.x-form{display:flex;flex-wrap:wrap;gap:12px;align-items:end}.x-form label{flex:1 1 180px;font-size:12px;font-weight:700}.x-form input,.x-form select{display:block;width:100%;margin-top:7px;padding:10px 12px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#0f172a}.x-form button,.x-btn{padding:11px 14px;background:#0f766e;color:#fff;border:0;border-radius:9px;cursor:pointer;font-size:12px;font-weight:700}.x-muted{font-size:12px;color:#64748b}.x-note{font-size:12px;line-height:1.55;background:#fff7ed;border:1px solid #fdba74;border-radius:10px;color:#9a3412;padding:13px}.x-panel h3{margin:2px 0 11px}</style>';
 const names={mesas:'Mesas e salões',estoque:'Estoque e Produtos',impressao:'Impressão manual',relatorios:'Relatórios operacionais'};
 const title=css+'<div class="iv-header"><div><span class="iv-section-caption">OPERAÇÃO DO RESTAURANTE</span><h1>'+icon({mesas:'table',estoque:'package',impressao:'printer',relatorios:'chart'}[module]??'layers',25)+' '+esc(names[module]??'Operação')+'</h1><p>'+esc(restaurant.name)+'</p></div><a class="iv-btn secondary" href="'+link('/'+restaurant.slug+'/gestao')+'">'+icon('arrowLeft',16)+' Voltar à gestão</a></div>';
 const fmt=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)/100);
 const call=async(action,params={})=>{const r=await supabase.functions.invoke('restaurant-core',{body:{restaurant_id:restaurant.id,action,...params}});if(r.error||r.data?.error){let message=r.data?.error??r.error?.message??'Falha';try{const x=await r.error?.context?.json?.();if(x?.error)message=x.error}catch{}throw Error(message)}return r.data};
 const form=(id,callback)=>{const f=document.getElementById(id);if(!f)return;f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('button[type=submit]');b.disabled=true;try{await callback(Object.fromEntries(new FormData(f).entries()));await load()}catch(err){alert(err.message);b.disabled=false}}};
 const stockTabsAllowed=["insumos","produtos","fichas","historico"];
 let stockTab=stockTabsAllowed.includes(new URLSearchParams(location.search).get("aba"))?new URLSearchParams(location.search).get("aba"):"insumos";
 const moneyInput=n=>(Number(n??0)/100).toFixed(2).replace(".",",");
 const cents=value=>{const text=String(value??"").trim().replace(/\s/g,"").replace(",",".");if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(text))throw Error("Informe um preço válido, como 24,90");const [a,b=""]=text.split(".");return Number(a)*100+Number((b+"00").slice(0,2))};
 async function load(){
  box(title+'<p>Carregando...</p>');
  try{
  if(module==='mesas'){
    const {tables=[]}=await call('tables');
    let out=title+'<section class="x-panel"><h2>Nova mesa</h2><form class="x-form" id="newtable"><label>Nome<input name="label" required maxlength="45" placeholder="Mesa 1"></label><label>Salão<input name="area" value="Salão" maxlength="60" required></label><label>Capacidade<input name="seats" type="number" value="4" min="1" max="50" required></label><button type="submit">Cadastrar</button></form></section><h2>Mesas ('+tables.length+')</h2><div class="x-grid">';
    for(const t of tables){out+='<div class="x-panel"><h3>'+esc(t.label)+'</h3><p class="x-muted">'+esc(t.area)+' · '+t.seats+' lugar(es) · '+(t.active?'Ativa':'Inativa')+'</p><button class="x-btn" data-switch="'+esc(t.id)+'">'+(t.active?'Desativar':'Ativar')+'</button></div>';}
    out+='</div>';box(out);
    form('newtable',v=>call('table_create',{label:v.label,area:v.area,seats:Number(v.seats),active:true}));
    document.querySelectorAll('[data-switch]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const t=tables.find(t=>t.id===b.dataset.switch);await call('table_update',{id:t.id,label:t.label,area:t.area,seats:t.seats,active:!t.active});await load()}catch(e){alert(e.message);b.disabled=false}});
  }else if(module==='estoque'){
    const [stocks,commercial]=await Promise.all([call('stock_list'),call('catalog')]);
    const items=stocks.items??[],recipes=stocks.recipes??[],movements=stocks.movements??[];
    const products=commercial.products??[],categories=commercial.categories??[],activeCats=categories.filter(c=>c.active);
    const active=items.filter(i=>i.active),opts=(rows,id,label)=>rows.map(x=>'<option value="'+esc(x[id])+'">'+esc(x[label])+'</option>').join('');
    const low=active.filter(i=>Number(i.quantity)<=Number(i.min_quantity));
    const exposed=products.filter(p=>p.show_on_menu&&p.available&&activeCats.some(c=>c.id===p.category_id));
    const validTab=stockTabsAllowed.includes(stockTab)?stockTab:"insumos";
    const style='<style>'
      +'.x-tabs{display:flex;gap:9px;overflow-x:auto;margin:18px 0 15px;scrollbar-width:none}.x-tabs button{display:flex;align-items:center;gap:8px;white-space:nowrap;padding:12px 15px;background:#fff;border:1px solid var(--iv-border);border-radius:12px;color:#4e5b6e;font-size:12px;font-weight:850;cursor:pointer}.x-tabs button[aria-pressed=true]{background:#ff7600;border-color:#ff7600;color:#fff}.x-tabs button .iv-icon{width:18px;height:18px}'
      +'.x-mini-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:8px 0 13px}.x-mini-stats .x-panel{margin:0}.x-mini-stats b{font-size:26px;display:block;letter-spacing:-.7px}.x-mini-stats span{font-size:11px;color:#718095}'
      +'.x-product-card{display:flex;flex-direction:column;gap:11px}.x-product-head{display:flex;gap:12px;align-items:center}.x-product-photo{width:65px;height:65px;object-fit:cover;border-radius:12px;background:#fff1e5;border:1px solid #ffead5;flex:none}.x-product-placeholder{width:65px;height:65px;display:grid;place-items:center;background:#fff1e5;color:#eb7100;border-radius:12px;flex:none}.x-product-head h3{margin:0 0 4px;font-size:16px}.x-product-head strong{font-size:18px;color:#d85e00}'
      +'.x-switch-row{display:flex;align-items:center;justify-content:space-between;gap:9px;border-top:1px solid #edf0f4;padding:12px 0;font-size:12px}.x-switch-row>span{display:flex;align-items:center;gap:7px;font-weight:750}'
      +'.x-toggle{appearance:none;flex:none;width:44px;height:26px;border-radius:99px;position:relative;border:1px solid #cbd5df;background:#ccd3dd;cursor:pointer;transition:.2s}.x-toggle:before{content:"";position:absolute;width:18px;height:18px;top:3px;left:3px;background:#fff;border-radius:50%;box-shadow:0 1px 2px #0002;transition:.2s}.x-toggle:checked{background:#ff7600;border-color:#ff7600}.x-toggle:checked:before{transform:translateX(18px)}.x-toggle:focus-visible{outline:3px solid #ffb164;outline-offset:2px}'
      +'.x-product-card details{border-top:1px solid #edf0f4;padding-top:11px}.x-product-card summary{color:#d66200;font-size:12px;font-weight:850;cursor:pointer}.x-product-card .x-form{margin-top:14px}.x-product-note{color:#718095;font-size:11px;line-height:1.55}.x-product-card .x-panel{margin:0}'
      +'@media(max-width:650px){.x-mini-stats{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.x-mini-stats .x-panel{padding:10px}.x-mini-stats b{font-size:22px}.x-tabs button{padding:10px 12px}.x-product-head strong{font-size:16px}}'
      +'</style>';
    let out=title+style
     +'<div class="x-mini-stats"><div class="x-panel"><b>'+items.length+'</b><span>Insumos cadastrados</span></div><div class="x-panel"><b>'+products.length+'</b><span>Produtos cadastrados</span></div><div class="x-panel"><b>'+exposed.length+'</b><span>Prontos para cardápio*</span></div></div>'
     +'<nav class="x-tabs" aria-label="Seções de estoque e produtos">'
     +[['insumos','package','Insumos'],['produtos','store','Produtos'],['fichas','clipboard','Fichas técnicas'],['historico','clock','Movimentações']].map(([id,ic,label])=>
       '<button type="button" data-stock-tab="'+id+'" aria-pressed="'+(validTab===id)+'">'+icon(ic,17)+label+'</button>').join('')
     +'</nav>';

    if(validTab==='insumos'){
      out+='<p class="x-note">Insumos representam ingredientes e materiais controlados em quantidade. Eles <b>não aparecem automaticamente no cardápio</b>; a venda acontece pelos Produtos.</p>'
       +'<section class="x-panel"><h2>'+icon('plus',19)+' Novo insumo</h2>'
       +'<form id="newstock" class="x-form"><label>Nome<input name="name" required minlength="2" maxlength="120" placeholder="Ex.: Carne bovina"></label>'
       +'<label>Unidade<select name="unit"><option value="un">Unidades</option><option value="kg">Kg</option><option value="g">Gramas</option><option value="l">Litros</option><option value="ml">mL</option></select></label>'
       +'<label>Saldo inicial<input name="quantity" type="number" min="0" step=".001" value="0" required></label>'
       +'<label>Estoque mínimo<input name="min_quantity" type="number" min="0" step=".001" value="0" required></label>'
       +'<button type="submit">'+icon('plus',16)+' Cadastrar insumo</button></form></section>'
       +'<div class="iv-toolbar"><h2>Insumos ('+items.length+')</h2><span class="iv-chip '+(low.length?'danger':'success')+'">'+low.length+' abaixo do mínimo</span></div><div class="x-grid">';
      for(const item of items){
        const isLow=Number(item.quantity)<=Number(item.min_quantity);
        out+='<article class="x-panel"><h3>'+icon('package',18)+' '+esc(item.name)+'</h3><p>Saldo atual: <b>'+esc(item.quantity)+' '+esc(item.unit)+'</b></p>'
          +'<p class="x-muted">Estoque mínimo: '+esc(item.min_quantity)+' · <span class="iv-chip '+(isLow?'danger':'success')+'">'+(isLow?'Repor':'Regular')+'</span></p></article>';
      }
      if(!items.length)out+='<div class="iv-empty">Nenhum insumo cadastrado.</div>';
      out+='</div>';
      if(active.length)out+='<section class="x-panel"><h2>'+icon('refresh',19)+' Entrada, perda ou ajuste</h2>'
       +'<form id="adjuststock" class="x-form"><label>Insumo<select name="stock_item_id" required>'+opts(active,'id','name')+'</select></label>'
       +'<label>Movimentação<select name="reason"><option value="receive">Entrada (+)</option><option value="waste">Perda (-)</option><option value="adjustment">Ajuste (+ ou -)</option></select></label>'
       +'<label>Quantidade<input name="delta" type="number" step=".001" required placeholder="Ex.: 2 ou -0.5"></label>'
       +'<button type="submit">'+icon('checkCircle',17)+' Registrar movimento</button></form></section>';
    }
    if(validTab==='produtos'){
      out+='<p class="x-note"><b>Cadastro central de produtos e preços.</b> A chave <b>Exibir no cardápio</b> controla a vitrine pública. A chave <b>Disponível para venda</b> controla o que o garçom consegue vender. São controles independentes.</p>'
       +'<div class="iv-toolbar"><h2>'+icon('store',20)+' Produtos e precificação</h2><a class="iv-btn secondary" href="'+link('/'+restaurant.slug+'/catalogo')+'">'+icon('layers',16)+' Categorias e publicação</a></div>';
      out+='<section class="x-panel"><details><summary>'+icon('layers',17)+' Categorias de produtos</summary><p class="x-muted">Cadastre aqui a categoria e depois selecione-a no produto. Ativar ou ocultar categorias continua disponível na tela de Cardápio.</p>'
        +'<form id="newcatstock" class="x-form"><label>Nome da nova categoria<input name="name" minlength="2" maxlength="90" required placeholder="Ex.: Lanches"></label>'
        +'<button type="submit">'+icon('plus',16)+' Criar categoria</button></form></details></section>';
      if(!activeCats.length)out+='<section class="x-panel"><p class="x-note">Antes de criar um produto, cadastre uma categoria ativa no módulo Cardápio.</p>'
        +'<a href="'+link('/'+restaurant.slug+'/catalogo')+'" class="iv-btn">'+icon('plus',16)+' Criar categoria</a></section>';
      else out+='<section class="x-panel"><h2>'+icon('plus',19)+' Cadastrar produto</h2>'
       +'<form class="x-form" id="newprodstock"><label>Nome do produto<input name="name" required minlength="2" maxlength="150" placeholder="Ex.: X-Burger"></label>'
       +'<label>Categoria<select name="category_id" required>'+opts(activeCats,'id','name')+'</select></label>'
       +'<label>Preço de venda (R$)<input name="price" required inputmode="decimal" placeholder="24,90"></label>'
       +'<label>Descrição<input name="description" maxlength="1000" placeholder="Descrição curta"></label>'
       +'<label>URL da foto (HTTPS, opcional)<input type="url" name="image_url" maxlength="1200" placeholder="https://..."></label>'
       +'<label class="x-switch-row"><span>'+icon('store',16)+' Exibir no cardápio</span><input class="x-toggle" type="checkbox" name="show_on_menu" checked></label>'
       +'<label class="x-switch-row"><span>'+icon('checkCircle',16)+' Disponível para venda</span><input class="x-toggle" type="checkbox" name="available" checked></label>'
       +'<button type="submit">'+icon('plus',16)+' Cadastrar produto</button></form></section>';
      out+='<div class="iv-toolbar"><h2>Produtos ('+products.length+')</h2><span class="iv-chip orange">'+exposed.length+' prontos para cardápio*</span></div><div class="x-grid">';
      for(const p of products){
        const cat=categories.find(c=>c.id===p.category_id),visible=!!p.show_on_menu,selling=!!p.available;
        const photo=typeof p.image_url==='string'&&/^https:\/\/[^\s<>"']+$/.test(p.image_url)?p.image_url:null;
        out+='<article class="x-panel x-product-card"><div class="x-product-head">'
          +(photo?'<img class="x-product-photo" src="'+esc(photo)+'" alt="Foto de '+esc(p.name)+'" loading="lazy" referrerpolicy="no-referrer">':'<span class="x-product-placeholder">'+icon('store',28)+'</span>')
          +'<div><h3>'+esc(p.name)+'</h3><strong>'+fmt(p.price_cents)+'</strong><div class="x-product-note">'+esc(cat?.name??'Sem categoria')+'</div></div></div>'
          +'<label class="x-switch-row"><span>'+icon('receipt',17)+' Exibir no cardápio</span><input type="checkbox" class="x-toggle" data-product-flag="'+esc(p.id)+'" data-flag="show_on_menu" aria-label="Exibir '+esc(p.name)+' no cardápio público" '+(visible?'checked':'')+'></label>'
          +'<label class="x-switch-row"><span>'+icon('checkCircle',17)+' Disponível para venda</span><input type="checkbox" class="x-toggle" data-product-flag="'+esc(p.id)+'" data-flag="available" aria-label="Disponibilizar '+esc(p.name)+' para venda" '+(selling?'checked':'')+'></label>'
          +'<details><summary>'+icon('settings',16)+' Editar produto e preço</summary><form class="x-form" data-edit-product="'+esc(p.id)+'">'
          +'<label>Nome<input name="name" required minlength="2" maxlength="150" value="'+esc(p.name)+'"></label>'
          +'<label>Categoria<select name="category_id" required>'+categories.map(c=>'<option value="'+esc(c.id)+'" '+(c.id===p.category_id?'selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></label>'
          +'<label>Preço (R$)<input name="price" required inputmode="decimal" value="'+moneyInput(p.price_cents)+'"></label>'
          +'<label>Descrição<input name="description" maxlength="1000" value="'+esc(p.description??'')+'"></label>'
          +'<label>URL da foto<input type="url" name="image_url" maxlength="1200" value="'+esc(p.image_url??'')+'" placeholder="https://..."></label>'
          +'<button type="submit">'+icon('checkCircle',16)+' Salvar alterações</button></form></details>'
          +'<p class="x-product-note">Ocultar do cardápio não apaga o produto nem sua ficha técnica.</p></article>';
      }
      if(!products.length)out+='<div class="iv-empty">Cadastre seu primeiro produto para começar.</div>';
      out+='</div><p class="x-product-note">* A vitrine pública também depende da publicação geral do cardápio, da categoria ativa e do produto disponível.</p>';
    }
    if(validTab==='fichas'){
      const missing=products.filter(p=>p.available&&!recipes.some(r=>r.product_id===p.id));
      out+='<p class="x-note"><b>Ficha técnica:</b> configure quanto de cada insumo uma unidade do produto consome. Ao enviar o pedido à cozinha, o sistema baixa o estoque na mesma transação. Produtos sem ficha não têm baixa automática.</p>'
       +(missing.length?'<section class="x-panel"><strong>'+missing.length+' produto(s) disponível(is) sem ficha técnica</strong><p class="x-muted">'+missing.map(p=>esc(p.name)).join(', ')+'</p></section>':'');
      if(active.length&&products.length){
        out+='<section class="x-panel"><h2>'+icon('clipboard',19)+' Vincular ingrediente ao produto</h2>'
          +'<form id="recipeset" class="x-form"><label>Produto<select name="product_id" required>'+opts(products,'id','name')+'</select></label>'
          +'<label>Ingrediente<select name="stock_item_id" required>'+opts(active,'id','name')+'</select></label>'
          +'<label>Quantidade por unidade<input name="quantity" type="number" min="0" max="10000000" step=".001" required placeholder="Ex.: 0.150"></label>'
          +'<button type="submit">'+icon('checkCircle',16)+' Salvar ficha</button></form><p class="x-muted">Use quantidade zero para remover um ingrediente da ficha.</p></section>';
      }else out+='<section class="x-panel"><p>Cadastre ao menos um produto e um insumo ativo para montar fichas técnicas.</p></section>';
      out+='<section class="x-panel"><h2>Ingredientes vinculados ('+recipes.length+')</h2>';
      if(!recipes.length)out+='<p class="x-muted">Nenhuma ficha técnica foi cadastrada.</p>';
      for(const r of recipes){
        const p=products.find(p=>p.id===r.product_id),i=items.find(i=>i.id===r.stock_item_id);
        out+='<p class="x-muted"><b>'+esc(p?.name??'Produto')+'</b> · '+esc(r.quantity)+' '+esc(i?.unit??'')+' de '+esc(i?.name??'Insumo')+'</p>';
      }
      out+='</section>';
    }
    if(validTab==='historico'){
      out+='<section class="x-panel"><h2>'+icon('clock',20)+' Últimas movimentações</h2>';
      if(!movements.length)out+='<p class="x-muted">Nenhuma movimentação registrada.</p>';
      for(const m of movements.slice(0,60)){
        const item=items.find(i=>i.id===m.stock_item_id);
        out+='<div class="x-switch-row"><span>'+esc(item?.name??'Insumo')+' · '+esc(m.reason)+'<small class="x-muted">'+esc(new Date(m.created_at).toLocaleString('pt-BR'))+'</small></span><b>'+esc(m.quantity_delta)+'</b></div>';
      }
      out+='</section>';
    }
    box(out);
    document.querySelectorAll('[data-stock-tab]').forEach(button=>button.onclick=()=>{
      stockTab=button.dataset.stockTab;
      try{const url=new URL(location.href);url.searchParams.set('aba',stockTab);history.replaceState(null,'',url.pathname+url.search)}catch{}
      load();
    });
    form('newstock',v=>call('stock_create',{name:v.name,unit:v.unit,quantity:Number(v.quantity),min_quantity:Number(v.min_quantity)}));
    form('adjuststock',v=>call('stock_adjust',{stock_item_id:v.stock_item_id,reason:v.reason,delta:Number(v.delta)}));
    form('recipeset',v=>call('recipe_set',{product_id:v.product_id,stock_item_id:v.stock_item_id,quantity:Number(v.quantity)}));
    form('newcatstock',v=>call('category_create',{name:v.name,sort_order:0}));
    form('newprodstock',v=>call('product_create',{
      name:v.name,category_id:v.category_id,price_cents:cents(v.price),description:v.description??'',
      image_url:v.image_url??'',sort_order:0,available:v.available==='on',show_on_menu:v.show_on_menu==='on'
    }));
    document.querySelectorAll('[data-product-flag]').forEach(t=>t.onchange=async()=>{
      t.disabled=true;
      const previous=!t.checked;
      try{await call('product_flags',{id:t.dataset.productFlag,[t.dataset.flag]:t.checked});await load()}
      catch(e){t.checked=previous;t.disabled=false;alert(e.message)}
    });
    document.querySelectorAll('[data-edit-product]').forEach(f=>f.onsubmit=async e=>{
      e.preventDefault();
      const button=f.querySelector('button[type=submit]');button.disabled=true;
      try{
        const p=products.find(p=>p.id===f.dataset.editProduct);if(!p)throw Error('Produto não encontrado');
        const v=Object.fromEntries(new FormData(f).entries());
        await call('product_update',{
          id:p.id,name:v.name,category_id:v.category_id,price_cents:cents(v.price),description:v.description??'',
          image_url:v.image_url??'',sort_order:p.sort_order??0,available:p.available,show_on_menu:p.show_on_menu
        });
        await load();
      }catch(err){alert(err.message);button.disabled=false}
    });
  }else if(module==='impressao'){
    const kitchen=link('/'+restaurant.slug+'/cozinha'),cash=link('/'+restaurant.slug+'/caixa');
    let out=title
      +'<p class="x-note"><b>Modo manual habilitado.</b> Não é necessário cadastrar impressora nem instalar agente. Abra a comanda ou o pedido, confira a prévia e escolha <b>Imprimir / Salvar PDF</b> na janela do navegador. A escolha da impressora e a impressão são feitas por quem está operando o aparelho.</p>'
      +'<div class="x-grid">'
      +'<section class="x-panel"><h2>Pedidos da cozinha</h2><p class="x-muted">Na fila da cozinha, clique em <b>Imprimir pedido (manual)</b> no pedido desejado. A prévia traz mesa, itens e observações.</p><p><a class="x-btn" href="'+kitchen+'">Abrir cozinha</a></p></section>'
      +'<section class="x-panel"><h2>Comandas do caixa</h2><p class="x-muted">No caixa, localize a comanda, clique em <b>Visualizar / imprimir comanda</b> e imprima manualmente ou salve como PDF.</p><p><a class="x-btn" href="'+cash+'">Abrir caixa</a></p></section>'
      +'</div><section class="x-panel"><h2>Equipamentos</h2><p class="x-muted">A integração automática, o agente Windows, a fila de impressão e os testes com impressora térmica foram adiados para uma versão futura. Nenhuma impressão é disparada automaticamente.</p></section>';
    box(out);
  }else if(module==='relatorios'){
    const d=await call('report');
    let out=title+'<p class="x-note">Relatório gerencial preliminar. Não é relatório fiscal, nem conciliação bancária. O processamento está limitado às últimas movimentações consultadas.</p><h2>Comandas por status</h2><div class="x-grid">';
    for(const [status,count] of Object.entries(d.orders_by_status??{}))out+='<div class="x-panel"><h3>'+esc(status)+'</h3><b>'+esc(count)+'</b></div>';
    out+='</div><h2>Valores registrados por método</h2><div class="x-grid">';
    for(const [method,value] of Object.entries(d.recorded_receipts_cents??{}))out+='<div class="x-panel"><h3>'+esc(method)+'</h3><b>'+fmt(value)+'</b></div>';
    out+='</div>';box(out);
  }else box(title+'<p class="x-note">Esta área ainda não está habilitada.</p>');
  }catch(e){box(title+'<div class="x-panel"><p class="error">'+esc(e.message)+'</p></div>')}
 }
 return load();
}