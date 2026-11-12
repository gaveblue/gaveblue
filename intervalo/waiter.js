// Intervalo 0.9.7 — painel responsivo do garçom; operações reais via restaurant-core.
export async function renderPage({supabase,restaurant,box,esc,link}){
 document.body.classList.add('intervalo-garcom');
 const css='<style>body.intervalo-garcom{background:#f8f9fb;color:#182033}body.intervalo-garcom>header,body.intervalo-garcom>.foot{display:none}body.intervalo-garcom #app .wrap{max-width:1600px;padding:18px clamp(12px,2.1vw,30px) 90px}.wg-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px}.wg-logo{font-size:27px;font-weight:950;font-style:italic;letter-spacing:-1.6px;line-height:1}.wg-logo span{color:#ff7000}.wg-brand{display:flex;align-items:center;gap:14px}.wg-role{background:linear-gradient(120deg,#ff8200,#ff5700);padding:9px 15px;border-radius:30px;color:#fff;font-size:12px;font-weight:850}.wg-sub{font-size:11px;color:#82909e;margin-top:5px}.wg-top-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.wg-action{background:#fff;border:1px solid #e5e7eb;color:#263245;padding:9px 12px;border-radius:11px;font-size:12px;font-weight:750;cursor:pointer;text-decoration:none}.wg-action.orange{border-color:#ffbd85;background:#fff3e8;color:#e86400}.wg-app{display:grid;grid-template-columns:245px minmax(300px,1fr) minmax(270px,330px);gap:14px;align-items:start}.wg-panel{background:#fff;border:1px solid #e7e8ed;border-radius:19px;min-width:0;box-shadow:0 3px 12px #24304908}.wg-panel-head{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:18px 17px 10px}.wg-panel h2{font-size:17px;line-height:1.2;margin:0;letter-spacing:-.35px}.wg-hint{font-size:12px;color:#81909e;margin:5px 0 0}.wg-counter{font-size:11px;background:#fff1e6;border-radius:50px;padding:6px 9px;color:#de6600;font-weight:900}.wg-table-filters,.wg-cats{display:flex;overflow:auto;gap:6px;padding:9px 13px;scrollbar-width:none}.wg-table-filters::-webkit-scrollbar,.wg-cats::-webkit-scrollbar{display:none}.wg-table-filters button,.wg-cats button{border:1px solid #e6e8ed;background:#fff;padding:8px 11px;border-radius:50px;white-space:nowrap;cursor:pointer;color:#566577;font-size:11px;font-weight:800}.wg-table-filters button[aria-pressed=true],.wg-cats button[aria-pressed=true]{background:#ff7800;border-color:#ff7800;color:#fff}.wg-tables{padding:3px 11px 13px;display:grid;gap:9px;max-height:calc(100vh - 260px);overflow:auto}.wg-table{display:block;width:100%;text-align:left;background:#fff;border:1px solid #e7eaf0;border-radius:13px;padding:13px;cursor:pointer}.wg-table.selected{background:#fff3e7;border-color:#ff9200;box-shadow:0 0 0 1px #ff9200}.wg-table-name{font-size:14px;font-weight:850;display:flex;align-items:center;gap:8px}.wg-table-icon{font-size:20px}.wg-table-meta{font-size:11px;color:#788698;margin-top:5px;display:flex;justify-content:space-between;gap:6px}.wg-dot{display:inline-block;width:8px;height:8px;border-radius:100%;background:#15b652;margin-right:4px}.wg-dot.busy{background:#ff7900}.wg-catalogue{padding:14px}.wg-catalogue-heading{display:flex;align-items:center;justify-content:space-between;gap:10px}.wg-catalogue-heading h2{margin:0 0 5px;font-size:20px}.wg-search{width:100%;background:#fafbfc;border:1px solid #e6e9ed;border-radius:12px;padding:12px 13px;box-shadow:none;margin:14px 0 6px;font-size:13px}.wg-cats{padding:10px 0 13px}.wg-products{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.wg-product{border:1px solid #eceef1;border-radius:15px;overflow:hidden;background:#fff;min-width:0}.wg-product-photo{height:145px;background:linear-gradient(120deg,#fff5ea,#ffe5c9);position:relative;display:grid;place-items:center;overflow:hidden}.wg-product-photo img{width:100%;height:100%;object-fit:cover;display:block}.wg-product-photo span{font-size:57px}.wg-product-text{padding:11px}.wg-product-text b{display:block;font-size:13px;line-height:1.35;min-height:33px}.wg-product-text p{color:#8b97a5;font-size:11px;line-height:1.35;min-height:28px;margin:4px 0 8px}.wg-product-foot{display:flex;align-items:center;justify-content:space-between;gap:5px}.wg-price{color:#ea6600;font-size:15px;font-weight:900}.wg-plus{border:0;background:#ff7400;color:white;font-size:22px;width:35px;height:35px;border-radius:12px;cursor:pointer}.wg-plus:disabled{background:#e2e8f0;color:#94a3b8}.wg-order{position:sticky;top:14px;padding:17px;max-height:calc(100vh - 30px);overflow:auto}.wg-order h2{margin:3px 0 7px;font-size:22px}.wg-selected{color:#e86a00;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px}.wg-state{background:#ecfdf3;border-radius:40px;color:#078943;padding:6px 9px;font-size:11px;font-weight:800}.wg-state.busy{background:#fff0e2;color:#d56800}.wg-order-label{font-size:11px;color:#7c899b;margin:11px 0}.wg-line{display:flex;align-items:flex-start;justify-content:space-between;padding:12px 0;border-top:1px solid #f0f1f4;gap:12px;font-size:12px}.wg-line b{font-size:12px}.wg-line small{display:block;color:#8995a3;margin-top:4px}.wg-line strong{white-space:nowrap;font-size:12px}.wg-total{display:flex;justify-content:space-between;align-items:center;gap:10px;border-top:1px dashed #cbd5e1;padding:17px 0 12px;font-size:14px;font-weight:900}.wg-total span:last-child{font-size:21px;color:#ed6b00}.wg-primary,.wg-outline,.wg-danger{display:block;width:100%;border-radius:12px;padding:13px;cursor:pointer;font-size:13px;font-weight:850;margin:8px 0;border:0}.wg-primary{background:linear-gradient(110deg,#ff8200,#ff5c00);color:#fff}.wg-outline{color:#11713b;border:1px solid #8fd1a4;background:#fff}.wg-danger{color:#b42318;border:1px solid #f5a4a4;background:#fff}.wg-primary:disabled,.wg-outline:disabled,.wg-danger:disabled{opacity:.45;cursor:not-allowed}.wg-empty{padding:20px;text-align:center;color:#9aa2af;font-size:12px}.wg-mobile-tabs{display:none}.wg-offline{background:#fef2f2;color:#b42318;padding:10px 13px;border-radius:11px;margin:9px 0;font-size:12px}.wg-note{background:#fff6e9;border:1px solid #ffdfbc;border-radius:10px;padding:10px;font-size:11px;color:#945323;line-height:1.5}.wg-modal{border:0;border-radius:19px;padding:22px;max-width:460px;width:calc(100% - 28px);box-shadow:0 20px 80px #0005}.wg-modal::backdrop{background:#172033a0}.wg-modal h3{margin:0 0 8px}.wg-modal label{display:block;margin:10px 0;font-size:12px;font-weight:750}.wg-modal input,.wg-modal textarea{display:block;margin-top:6px;padding:11px;width:100%;border-radius:10px;border:1px solid #d6dce3}.wg-modal textarea{min-height:82px;resize:vertical}.wg-modal .wg-options{font-size:12px;color:#8b562c;line-height:1.5}.wg-modal-btns{display:flex;gap:9px;margin-top:15px}.wg-modal-btns button{flex:1;padding:12px;border-radius:10px;border:0;cursor:pointer;font-weight:800}.wg-modal-btns button:first-child{background:#e8edf2;color:#344154}.wg-modal-btns button:last-child{background:#ff7000;color:#fff}.wg-mobile-tabs button[aria-pressed=true]{color:#ff6e00}@media(max-width:1090px){.wg-app{grid-template-columns:210px minmax(270px,1fr)}.wg-order{grid-column:1/-1;position:static;max-height:none}.wg-products{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:690px){body.intervalo-garcom #app .wrap{padding:13px 11px 95px}.wg-top{margin-bottom:11px}.wg-logo{font-size:23px}.wg-role{font-size:11px;padding:8px 11px}.wg-top-actions{width:100%;justify-content:flex-end}.wg-app{display:block}.wg-panel{border-radius:17px;margin-bottom:10px}.wg-panel[data-section]{display:none}.wg-app[data-view=mesas] [data-section=mesas],.wg-app[data-view=cardapio] [data-section=cardapio],.wg-app[data-view=comanda] [data-section=comanda]{display:block}.wg-tables{max-height:none}.wg-order{max-height:none}.wg-products{grid-template-columns:repeat(2,minmax(0,1fr))}.wg-product-photo{height:140px}.wg-mobile-tabs{position:fixed;left:0;right:0;bottom:0;z-index:15;display:flex;justify-content:space-around;gap:8px;background:#fff;border-top:1px solid #e6e9ef;padding:8px max(12px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom));box-shadow:0 -5px 20px #1220330b}.wg-mobile-tabs button{border:0;background:transparent;cursor:pointer;display:flex;flex-direction:column;gap:3px;align-items:center;font-size:11px;color:#8692a0;font-weight:800;padding:8px 16px}.wg-mobile-tabs button span{font-size:19px}}@media(max-width:370px){.wg-product-photo{height:112px}.wg-products{gap:8px}.wg-product-text{padding:9px}.wg-product-text b{font-size:12px}.wg-price{font-size:14px}}</style>';
 const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)/100);
 const call=async(action,extra={})=>{
  const r=await supabase.functions.invoke('restaurant-core',{body:{restaurant_id:restaurant.id,action,...extra}});
  if(r.error||r.data?.error){
    let msg=r.data?.error??r.error?.message??'Falha ao comunicar com o restaurante';
    try{const d=await r.error?.context?.json?.();msg=d?.error??msg}catch{}
    throw Error(msg);
  }
  return r.data;
 };
 const icon=name=>/bebid|refriger|suco/i.test(name)?'🥤':/pizza/i.test(name)?'🍕':/doce|sobremesa/i.test(name)?'🍰':/batata|porç|acomp/i.test(name)?'🍟':'🍔';
 const photo=p=>typeof p.image_url==='string'&&/^https:\/\/[^\s<>"']+$/.test(p.image_url)?p.image_url:null;
 const statuses={open:'Aberta',submitted:'Enviada à cozinha',preparing:'Em preparo',ready:'Pronta',served:'Servida'};
 let selectedId=null,tableFilter='all',categoryFilter='all',search='',view='mesas';
 let fetching=false,lastSignature='',snapshot=null,alive=true;
 const header=css+'<div class="wg-top"><div class="wg-brand"><div><div class="wg-logo">Interva<span>lo</span></div><div class="wg-sub">'+esc(restaurant.name)+'</div></div><span class="wg-role">Garçom</span></div><div class="wg-top-actions"><span class="wg-action" id="wg-connection">Verificando conexão</span><button class="wg-action orange" id="wg-install" type="button">Instalar app</button><a class="wg-action" href="'+link('/inicio')+'">Restaurantes</a></div></div>';
 const selected=()=>snapshot?.tables?.find(t=>t.id===selectedId);
 const order=()=>snapshot?.orders?.find(o=>o.table_id===selectedId&&!['closed','cancelled'].includes(o.status));
 const listFor=o=>snapshot?.items?.filter(i=>i.order_id===o.id&&i.status!=='cancelled')??[];
 function showView(name){
  view=name;
  const root=document.getElementById('wg-root');if(root)root.dataset.view=name;
  document.querySelectorAll('[data-w-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.wView===name)));
 }
 function applyCatalogFilter(){
  const q=search.trim().toLocaleLowerCase('pt-BR');let count=0;
  document.querySelectorAll('[data-w-product]').forEach(el=>{
    const visible=(categoryFilter==='all'||el.dataset.category===categoryFilter)&&(!q||el.dataset.search.includes(q));
    el.hidden=!visible;if(visible)count++;
  });
  const el=document.getElementById('wg-products-count');if(el)el.textContent=count+' produtos';
 }
 function render(){
  if(!snapshot)return;
  const {tables,orders,items,products,categories}=snapshot;
  const activeTable=selected(),activeOrder=order(),lines=activeOrder?listFor(activeOrder):[];
  const total=lines.reduce((sum,i)=>sum+Number(i.unit_price_cents)*Number(i.quantity),0);
  const occupied=t=>orders.some(o=>o.table_id===t.id&&!['closed','cancelled'].includes(o.status));
  const visibleTables=tables.filter(t=>tableFilter==='all'||(tableFilter==='busy'?occupied(t):!occupied(t)));
  const filteredCats=categories.filter(c=>c.active&&products.some(p=>p.category_id===c.id));
  const status=activeOrder?.status,canAdd=status==='open',title='Mesa '+(activeTable?.label??'');
  let html=header+(navigator.onLine===false?'<div class="wg-offline">Sem internet. Não é possível enviar comandas até a conexão voltar.</div>':'')
  +'<div id="wg-root" class="wg-app" data-view="'+esc(view)+'">'
  +'<aside class="wg-panel" data-section="mesas"><div class="wg-panel-head"><div><h2>Mesas</h2><p class="wg-hint">Selecione para atender</p></div><span class="wg-counter">'+tables.filter(occupied).length+' ocupadas</span></div>'
  +'<div class="wg-table-filters" role="group" aria-label="Filtro de mesas">'+[['all','Todas'],['busy','Ocupadas'],['free','Livres']].map(([k,l])=>'<button type="button" data-w-filter="'+k+'" aria-pressed="'+(tableFilter===k)+'">'+l+'</button>').join('')+'</div><div class="wg-tables">';
  for(const t of visibleTables){
    const busy=occupied(t);
    html+='<button type="button" class="wg-table'+(t.id===selectedId?' selected':'')+'" data-w-table="'+esc(t.id)+'" aria-current="'+(t.id===selectedId)+'"><span class="wg-table-name"><span class="wg-table-icon" aria-hidden="true">▰</span>'+esc(t.label)+'</span><span class="wg-table-meta"><span><i class="wg-dot'+(busy?' busy':'')+'"></i>'+(busy?'Ocupada':'Livre')+'</span><span>'+esc(t.area??'Salão')+'</span></span></button>';
  }
  html+='</div></aside><section class="wg-panel" data-section="cardapio"><div class="wg-catalogue"><div class="wg-catalogue-heading"><div><h2>Cardápio</h2><p class="wg-hint">Escolha um produto para a '+esc(activeTable?.label??'mesa')+'</p></div><span class="wg-counter" id="wg-products-count">'+products.length+' produtos</span></div>'
   +'<input class="wg-search" id="wg-search" type="search" placeholder="Buscar produtos..." aria-label="Buscar produto" value="'+esc(search)+'" autocomplete="off">'
   +'<div class="wg-cats" role="group" aria-label="Categorias"><button data-w-cat="all" aria-pressed="'+(categoryFilter==='all')+'">Todos</button>'
   +filteredCats.map(c=>'<button type="button" data-w-cat="'+esc(c.id)+'" aria-pressed="'+(categoryFilter===c.id)+'">'+esc(c.name)+'</button>').join('')+'</div><div class="wg-products">';
  for(const p of products){
    const cat=categories.find(c=>c.id===p.category_id),src=photo(p);
    html+='<article class="wg-product" data-w-product data-category="'+esc(p.category_id)+'" data-search="'+esc((p.name+' '+(p.description??'')+' '+(cat?.name??'')).toLocaleLowerCase('pt-BR'))+'">'
      +'<div class="wg-product-photo">'+(src?'<img src="'+esc(src)+'" alt="'+esc(p.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer">':'<span aria-hidden="true">'+icon(cat?.name??'')+'</span>')+'</div>'
      +'<div class="wg-product-text"><b>'+esc(p.name)+'</b><p>'+esc(p.description??'')+'</p><div class="wg-product-foot"><span class="wg-price">'+money(p.price_cents)+'</span>'
      +'<button type="button" class="wg-plus" data-w-add="'+esc(p.id)+'" aria-label="Adicionar '+esc(p.name)+'" '+(canAdd?'':'disabled title="Abra uma comanda nesta mesa antes de adicionar itens"')+'>+</button></div></div></article>';
  }
  html+='</div>'+(!products.length?'<p class="wg-empty">O restaurante ainda não tem produtos disponíveis no cardápio.</p>':'')+'</div></section>'
   +'<aside class="wg-panel wg-order" data-section="comanda"><div class="wg-selected">Comanda</div><h2>'+(activeTable?esc(activeTable.label):'Selecione uma mesa')+'</h2>'
   +'<span class="wg-state'+(activeOrder?' busy':'')+'">'+(activeOrder?esc(statuses[status]??status):'Livre')+'</span>'
   +'<p class="wg-order-label">'+(activeTable?esc(activeTable.area??'Salão')+' · '+(activeOrder?'Pedido em andamento':'Sem comanda aberta'):'Escolha uma mesa no painel de mesas')+'</p>';
  if(activeOrder){
    for(const item of lines){
      html+='<div class="wg-line"><div><b>'+esc(item.quantity)+' × '+esc(item.product_name)+'</b>'+(item.note?'<small>Obs.: '+esc(item.note)+'</small>':'')+'</div><strong>'+money(Number(item.unit_price_cents)*Number(item.quantity))+'</strong></div>';
    }
    if(!lines.length)html+='<p class="wg-empty">Nenhum item adicionado. Abra o cardápio e escolha seus produtos.</p>';
    html+='<div class="wg-total"><span>Total</span><span>'+money(total)+'</span></div>';
    if(status==='open'){
      html+='<button type="button" class="wg-primary" data-w-view="cardapio">+ Adicionar produtos</button>'
        +'<button type="button" class="wg-primary" id="wg-submit" '+(lines.length?'':'disabled')+'>Enviar para cozinha</button>'
        +'<button type="button" class="wg-danger" id="wg-cancel">Cancelar comanda não enviada</button>';
    }else if(status==='ready'){
      html+='<button type="button" class="wg-outline" id="wg-served">Marcar como servido</button>';
    }else{
      html+='<p class="wg-note">'+(status==='served'?'Pedido servido. O caixa registra o recebimento e encerra a comanda.':'Pedido encaminhado à cozinha. Acompanhe a atualização dos estados por aqui.')+'</p>';
    }
  }else if(activeTable){
    html+='<p class="wg-empty">Mesa livre. Abra uma comanda para começar o atendimento.</p><button type="button" class="wg-primary" id="wg-open">Abrir comanda</button>';
  }else html+='<p class="wg-empty">Selecione uma mesa primeiro.</p>';
  html+='</aside></div><div class="wg-mobile-tabs" role="group" aria-label="Etapas do atendimento">'
    +[['mesas','▰','Mesas'],['cardapio','🍔','Cardápio'],['comanda','▤','Comanda']].map(([id,ico,label])=>'<button type="button" data-w-view="'+id+'" aria-pressed="'+(view===id)+'"><span>'+ico+'</span>'+label+'</button>').join('')+'</div>';
  box(html);
  const conn=document.getElementById('wg-connection');if(conn)conn.textContent=navigator.onLine?'● Internet disponível':'● Sem internet';
  document.getElementById('wg-install').onclick=()=>{if(typeof window.intervaloInstallGarcom==='function')window.intervaloInstallGarcom();else alert('No Android: menu do navegador → Instalar app. No iPhone: Compartilhar → Adicionar à Tela de Início.');};
  document.querySelectorAll('[data-w-filter]').forEach(b=>b.onclick=()=>{tableFilter=b.dataset.wFilter;render()});
  document.querySelectorAll('[data-w-table]').forEach(b=>b.onclick=()=>{selectedId=b.dataset.wTable;categoryFilter='all';search='';view='cardapio';render()});
  document.querySelectorAll('[data-w-view]').forEach(b=>b.onclick=()=>showView(b.dataset.wView));
  document.querySelectorAll('[data-w-cat]').forEach(b=>b.onclick=()=>{categoryFilter=b.dataset.wCat;document.querySelectorAll('[data-w-cat]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));applyCatalogFilter()});
  const input=document.getElementById('wg-search');input.oninput=e=>{search=e.target.value;applyCatalogFilter()};
  applyCatalogFilter();
  async function action(button,cmd,data){
    button.disabled=true;
    try{await call(cmd,data);await reload()}catch(e){alert(e.message);button.disabled=false}
  }
  const opening=document.getElementById('wg-open');
  if(opening)opening.onclick=()=>action(opening,'order_open',{table_id:selectedId});
  const submit=document.getElementById('wg-submit');
  if(submit)submit.onclick=()=>{if(confirm('Enviar esta comanda para a cozinha? Após o envio, o pedido passa para produção e o estoque é descontado.'))action(submit,'order_submit',{order_id:activeOrder.id})};
  const cancel=document.getElementById('wg-cancel');
  if(cancel)cancel.onclick=()=>{
    const reason=prompt('Motivo do cancelamento (mínimo 3 caracteres):','Erro na abertura');
    if(reason===null)return;
    if(reason.trim().length<3||reason.length>180){alert('Informe um motivo válido entre 3 e 180 caracteres.');return}
    if(confirm('Cancelar esta comanda ainda não enviada e liberar a mesa?'))action(cancel,'order_cancel',{order_id:activeOrder.id,reason:reason.trim()});
  };
  const served=document.getElementById('wg-served');
  if(served)served.onclick=()=>action(served,'order_progress',{order_id:activeOrder.id,p_next:'served'});
  document.querySelectorAll('[data-w-add]').forEach(b=>b.onclick=()=>openProduct(products.find(p=>p.id===b.dataset.wAdd),activeOrder));
 }
 function openProduct(product,activeOrder){
  if(!product||!activeOrder||activeOrder.status!=='open')return;
  const dlg=document.createElement('dialog');dlg.className='wg-modal';
  const extras=(snapshot.options??[]).filter(o=>o.product_id===product.id);
  const form=document.createElement('form');form.method='dialog';
  const title=document.createElement('h3');title.textContent=product.name+' · '+money(product.price_cents);
  const description=document.createElement('p');description.className='wg-hint';description.textContent='Adicione a quantidade e observações para a cozinha.';
  const qLabel=document.createElement('label');qLabel.textContent='Quantidade';
  const qty=document.createElement('input');qty.type='number';qty.name='quantity';qty.required=true;qty.min=1;qty.max=99;qty.value='1';qLabel.append(qty);
  const nLabel=document.createElement('label');nLabel.textContent='Observação (opcional)';
  const note=document.createElement('textarea');note.name='note';note.maxLength=350;note.placeholder='Ex.: sem cebola, ponto bem passado...';nLabel.append(note);
  const warning=document.createElement('p');warning.className='wg-note';
  if(extras.length)warning.textContent='Adicionais do catálogo ainda não alteram o preço da comanda. Informe pedidos especiais na observação; valores extras precisam ser tratados separadamente.';
  const feedback=document.createElement('p');feedback.className='error';feedback.setAttribute('role','alert');
  const buttons=document.createElement('div');buttons.className='wg-modal-btns';
  const no=document.createElement('button');no.type='button';no.textContent='Cancelar';no.onclick=()=>dlg.close();
  const yes=document.createElement('button');yes.type='submit';yes.textContent='Adicionar à comanda';
  buttons.append(no,yes);form.append(title,description,qLabel,nLabel);
  if(extras.length)form.append(warning);
  form.append(feedback,buttons);dlg.append(form);document.body.append(dlg);
  dlg.onclose=()=>dlg.remove();
  form.onsubmit=async e=>{
    e.preventDefault();const quantity=Number(qty.value);
    if(!Number.isInteger(quantity)||quantity<1||quantity>99){feedback.textContent='Quantidade entre 1 e 99.';return}
    yes.disabled=true;
    try{
      await call('item_add',{order_id:activeOrder.id,product_id:product.id,quantity,note:note.value});
      dlg.close();view='comanda';await reload();
    }catch(err){feedback.textContent=err.message;yes.disabled=false}
  };
  dlg.showModal();qty.focus();
 }
 async function reload(silent=false){
  if(!alive||fetching)return;
  if(silent&&(document.querySelector('.wg-modal[open]')||document.activeElement?.id==='wg-search'))return;
  fetching=true;
  if(!silent&&!snapshot)box(header+'<section class="wg-panel wg-empty">Carregando mesas e produtos...</section>');
  try{
    const [t,o,c]=await Promise.all([call('tables'),call('orders'),call('catalog')]);
    const categories=(c.categories??[]).filter(x=>x.active);
    const ids=new Set(categories.map(x=>x.id));
    const products=(c.products??[]).filter(x=>x.available&&ids.has(x.category_id));
    const tables=(t.tables??[]).filter(x=>x.active!==false),orders=o.orders??[],items=o.items??[],options=c.options??[];
    const sig=JSON.stringify({tables,orders,items,products,categories,options});
    if(silent&&sig===lastSignature)return;
    snapshot={tables,orders,items,products,categories,options};lastSignature=sig;
    if(!tables.some(t=>t.id===selectedId))selectedId=tables[0]?.id??null;
    render();
  }catch(err){if(!silent)box(header+'<section class="wg-panel wg-empty"><h2>Não foi possível carregar o atendimento</h2><p>'+esc(err.message)+'</p><button class="wg-action" id="wg-retry">Tentar novamente</button></section>');
    document.getElementById('wg-retry')?.addEventListener('click',()=>reload())}
  finally{fetching=false}
 }
 const poll=setInterval(()=>{if(document.visibilityState==='visible'&&document.getElementById('wg-root'))reload(true)},10000);
 const visibility=()=>{if(document.visibilityState==='visible')reload(true)};
 document.addEventListener('visibilitychange',visibility);
 window.addEventListener('pagehide',()=>{alive=false;clearInterval(poll);document.removeEventListener('visibilitychange',visibility)},{once:true});
 return reload();
}
