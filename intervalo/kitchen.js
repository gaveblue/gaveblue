// Intervalo — cozinha com consulta automática em intervalos de 15s, sem alegar Realtime ou impressão.
export async function renderPage({supabase,restaurant,box,esc,link}){
 const css='<style>.k-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.k-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:22px}.k-card h3{margin:0}.k-card button,.k-reload{margin-top:11px;border:0;border-radius:9px;padding:12px 15px;background:#0f766e;color:#fff;cursor:pointer;font-weight:700}.k-state{font-size:11px;border-radius:20px;background:#e2e8f0;padding:6px 10px;font-weight:700}.k-top{display:flex;justify-content:space-between;align-items:center;gap:10px}.k-card p{font-size:14px}.k-card small{color:#64748b}.k-empty{padding:36px;border:1px dashed #cbd5e1;border-radius:13px;color:#64748b}</style>';
 const base=css+'<h1>Cozinha · Fila de produção</h1><p class="muted">'+esc(restaurant.name)+' · Os pedidos ficam separados por restaurante.</p><p><a href="'+link('/'+restaurant.slug+'/gestao')+'">Voltar à Gestão</a></p><p class="muted">A fila consulta novos pedidos automaticamente a cada 15 segundos enquanto a tela está visível. Não utiliza WebSocket/Realtime. Impressão térmica ainda depende de testes.</p>';
 const call=async(action,extra={})=>{const r=await supabase.functions.invoke('restaurant-core',{body:{restaurant_id:restaurant.id,action,...extra}});if(r.error||r.data?.error){let reason=r.data?.error??r.error?.message??'Falha';try{const v=await r.error?.context?.json?.();reason=v?.error??reason}catch{}throw Error(reason)}return r.data};
 let fetching=false,lastSignature='';
 async function refresh(silent=false){
  if(fetching)return;
  fetching=true;
  if(!silent)box(base+'<p>Carregando pedidos...</p>');
  try{
    const data=await call('orders'),orders=(data.orders??[]).filter(o=>['submitted','preparing','ready'].includes(o.status));
    const signature=JSON.stringify({orders,items:data.items??[],tables:data.tables??[]});
    if(silent&&signature===lastSignature)return;
    lastSignature=signature;
    let out=base+'<button class="k-reload" id="k-reload">Atualizar fila</button><h2>Pedidos ('+orders.length+')</h2><div class="k-grid">';
    for(const o of orders){
      const t=(data.tables??[]).find(t=>t.id===o.table_id);
      out+='<div class="k-card"><div class="k-top"><h3>'+esc(t?.label??'Mesa')+'</h3><span class="k-state">'+esc(o.status)+'</span></div>';
      for(const item of (data.items??[]).filter(i=>i.order_id===o.id&&i.status!=='cancelled')){
       out+='<p><b>'+item.quantity+'× '+esc(item.product_name)+'</b>'+(item.note?' <small>· '+esc(item.note)+'</small>':'')+'</p>';
      }
      if(o.status==='submitted')out+='<button data-progress="'+esc(o.id)+'" data-next="preparing">Iniciar preparo</button>';
      if(o.status==='preparing')out+='<button data-progress="'+esc(o.id)+'" data-next="ready">Marcar pronto</button>';
      if(o.status==='ready')out+='<p><small>Pronto para entrega à mesa</small></p>';
      out+='</div>';
    }
    out+='</div>';if(!orders.length)out+='<div class="k-empty">Sem pedidos aguardando preparo.</div>';
    box(out);
    document.getElementById('k-reload').onclick=refresh;
    document.querySelectorAll('[data-progress]').forEach(b=>b.onclick=async()=>{
      b.disabled=true;
      try{await call('order_progress',{order_id:b.dataset.progress,p_next:b.dataset.next});await refresh()}
      catch(e){alert(e.message);b.disabled=false}
    });
  }catch(e){if(!silent)box(base+'<section class="k-card"><p class="error">'+esc(e.message)+'</p></section>')}
  finally{fetching=false}
 }
 const poll=setInterval(()=>{if(document.visibilityState==='visible'&&document.getElementById('k-reload'))refresh(true)},15000);
 window.addEventListener('pagehide',()=>clearInterval(poll),{once:true});
 return refresh();
}