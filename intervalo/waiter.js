// Intervalo — garçom: mesas, comandas e envio para cozinha.
export async function renderPage({supabase,restaurant,box,esc,link}){
 const css='<style>.w-card{padding:18px;border:1px solid #e2e8f0;border-radius:14px;background:white}.w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:13px}.w-card h3{margin:0 0 10px}.w-card p{font-size:13px;color:#64748b}.w-card button{border:0;border-radius:9px;padding:10px 13px;background:#0f766e;color:white;font-weight:700;cursor:pointer}.w-card button:disabled{opacity:.5}.w-card form{display:grid;gap:9px;margin-top:13px}.w-card input,.w-card select{width:100%;padding:9px;border:1px solid #cbd5e1;background:white;border-radius:8px}.w-card label{font-size:12px}.w-status{padding:5px 9px;border-radius:18px;background:#e2e8f0;color:#334155;font-size:11px}.w-header{display:flex;justify-content:space-between;gap:10px;align-items:center}.w-empty{padding:30px;border:1px dashed #cbd5e1;border-radius:12px}.w-refresh{padding:10px 13px;background:#f0fdfa;color:#0f766e;border:1px solid #99f6e4;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px}</style>';
 const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)/100);
 const call=async(action,extra={})=>{const r=await supabase.functions.invoke('restaurant-core',{body:{restaurant_id:restaurant.id,action,...extra}});if(r.error||r.data?.error){let msg=r.data?.error??r.error?.message??'Falha';try{const data=await r.error?.context?.json?.();if(data?.error)msg=data.error}catch{}throw Error(msg)}return r.data};
 const top=css+'<h1>Garçom · Comandas</h1><p class="muted">'+esc(restaurant.name)+' · Abra uma mesa, lance os itens e envie para a cozinha. Os estados são consultados automaticamente a cada 10 segundos quando a tela está visível.</p><p><a href="'+link('/'+restaurant.slug+'/gestao')+'">Voltar à Gestão</a></p>';
 let fetching=false,lastSignature='';
 async function reload(silent=false){
  if(fetching)return;
  fetching=true;
  if(!silent)box(top+'<p>Carregando mesas e comandas...</p>');
  try{
    const [t,o,c]=await Promise.all([call('tables'),call('orders'),call('catalog')]);
    const tables=t.tables??[],orders=o.orders??[],items=o.items??[],products=(c.products??[]).filter(p=>p.available);
    const signature=JSON.stringify({tables,orders,items,products});
    if(silent&&(signature===lastSignature||document.activeElement?.closest('form[data-item]')))return;
    lastSignature=signature;
    let html=top+'<p><button type="button" class="w-refresh" id="w-refresh">Atualizar agora</button></p><div class="w-grid">';
    for(const table of tables){
      const open=orders.find(x=>x.table_id===table.id&&!['closed','cancelled'].includes(x.status));
      html+='<article class="w-card"><div class="w-header"><h3>'+esc(table.label)+'</h3><span class="w-status">'+(open?esc(open.status):'Livre')+'</span></div><p>'+esc(table.area)+'</p>';
      if(!open)html+='<button type="button" data-open="'+esc(table.id)+'">Abrir comanda</button>';
      else {
        const ordered=items.filter(i=>i.order_id===open.id&&i.status!=='cancelled');
        let total=0;
        for(const item of ordered){total+=Number(item.unit_price_cents)*item.quantity;html+='<p>'+item.quantity+' × '+esc(item.product_name)+' — '+money(Number(item.unit_price_cents)*item.quantity)+'</p>';}
        html+='<p><b>Total: '+money(total)+'</b></p>';
        if(open.status==='open'){
          html+='<form data-item="'+esc(open.id)+'"><label>Produto<select name="product_id" required>'+products.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+' · '+money(p.price_cents)+'</option>').join('')+'</select></label><label>Quantidade<input name="quantity" type="number" min="1" max="99" value="1" required></label><label>Observação<input name="note" maxlength="350" placeholder="Sem cebola, por exemplo"></label><button type="submit" '+(products.length?'':'disabled')+'>Adicionar item</button></form>';
          if(ordered.length)html+='<p><button type="button" data-submit="'+esc(open.id)+'">Enviar pedido à cozinha</button></p>';
          html+='<p><button type="button" style="background:#fff1f2;color:#9f1239" data-cancel="'+esc(open.id)+'">Cancelar comanda não enviada</button></p>';
        }else if(open.status==='ready')html+='<button type="button" data-served="'+esc(open.id)+'">Marcar como servido</button>';
        else html+='<p class="w-status">Pedido encaminhado · '+esc(open.status)+'</p>';
      }
      html+='</article>';
    }
    html+='</div>';if(!tables.length)html+='<div class="w-empty">O Master precisa cadastrar mesas antes de abrir comandas.</div>';
    box(html);
    document.getElementById('w-refresh').onclick=()=>reload();
    async function invoke(button,action,extra){button.disabled=true;try{await call(action,extra);await reload()}catch(e){alert(e.message);button.disabled=false}}
    document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>invoke(b,'order_open',{table_id:b.dataset.open}));
    document.querySelectorAll('[data-submit]').forEach(b=>b.onclick=()=>invoke(b,'order_submit',{order_id:b.dataset.submit}));
    document.querySelectorAll('[data-cancel]').forEach(b=>b.onclick=async()=>{
      const reason=prompt('Informe o motivo do cancelamento (mínimo 3 caracteres):','Erro na abertura');
      if(reason===null)return;
      if(reason.trim().length<3||reason.length>180){alert('Informe uma justificativa entre 3 e 180 caracteres');return}
      if(!confirm('Cancelar esta comanda e liberar a mesa? Itens ainda não enviados serão cancelados.'))return;
      await invoke(b,'order_cancel',{order_id:b.dataset.cancel,reason:reason.trim()});
    });
    document.querySelectorAll('[data-served]').forEach(b=>b.onclick=()=>invoke(b,'order_progress',{order_id:b.dataset.served,p_next:'served'}));
    document.querySelectorAll('form[data-item]').forEach(f=>f.onsubmit=async e=>{e.preventDefault();const v=Object.fromEntries(new FormData(f).entries());await invoke(f.querySelector('button'),'item_add',{order_id:f.dataset.item,product_id:v.product_id,quantity:Number(v.quantity),note:v.note})});
  }catch(e){if(!silent)box(top+'<div class="w-empty"><p class="error">'+esc(e.message)+'</p></div>')}
  finally{fetching=false}
 }
 const poll=setInterval(()=>{if(document.visibilityState==='visible'&&document.getElementById('w-refresh'))reload(true)},10000);
 const visibility=()=>{if(document.visibilityState==='visible'&&document.getElementById('w-refresh'))reload(true)};
 document.addEventListener('visibilitychange',visibility);
 window.addEventListener('pagehide',()=>{clearInterval(poll);document.removeEventListener('visibilitychange',visibility)},{once:true});
 return reload();
}