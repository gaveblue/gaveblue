// Intervalo — cozinha com consulta automática em intervalos de 15s, sem alegar Realtime ou impressão.
import {icon} from './ui-icons.js?v=1.0.0-rc.1';
export async function renderPage({supabase,restaurant,box,esc,link}){
 document.body.classList.add('iv-fullwidth','iv-kds');
 const css='<style>.k-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.k-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:22px}.k-card h3{margin:0}.k-card button,.k-reload{margin-top:11px;border:0;border-radius:9px;padding:12px 15px;background:#0f766e;color:#fff;cursor:pointer;font-weight:700}.k-state{font-size:11px;border-radius:20px;background:#e2e8f0;padding:6px 10px;font-weight:700}.k-top{display:flex;justify-content:space-between;align-items:center;gap:10px}.k-card p{font-size:14px}.k-card small{color:#64748b}.k-empty{padding:36px;border:1px dashed #cbd5e1;border-radius:13px;color:#64748b}</style>';
 const base=css+'<div class="iv-header"><div><span class="iv-section-caption">COZINHA · KDS</span><h1>'+icon('chef',27)+' Painel de produção</h1><p>'+esc(restaurant.name)+' · Atualização a cada 15 segundos</p></div><div class="iv-actions"><a class="iv-btn secondary" href="'+link('/inicio')+'">'+icon('arrowLeft',15)+' Restaurantes</a><span class="iv-chip success" id="k-online">Conectado</span><button class="iv-btn" type="button" id="k-reload">'+icon('refresh',16)+' Atualizar</button></div></div>';
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
    const lanes=[['submitted','Novos pedidos','Aguardando início','receipt'],['preparing','Em preparo','Pedidos em produção','chef'],['ready','Prontos','Aguardando entrega','checkCircle']];
    const minutes=o=>{const t=new Date(o.submitted_at??o.opened_at??'').getTime();return Number.isFinite(t)?Math.max(0,Math.floor((Date.now()-t)/60000)):null};
    let out=base+'<div class="iv-kds-board">';
    for(const [stage,name,caption,ico] of lanes){
      const queue=orders.filter(o=>o.status===stage);
      out+='<section class="iv-kds-lane '+stage+'"><div class="iv-kds-lanehead"><div><b>'+icon(ico,21)+esc(name)+'</b><small>'+caption+'</small></div><strong>'+queue.length+'</strong></div><div class="iv-kds-stack">';
      for(const o of queue){
        const t=(data.tables??[]).find(t=>t.id===o.table_id),age=minutes(o),late=age!==null&&age>=20&&stage!=='ready';
        out+='<article class="iv-kds-ticket"><div class="iv-kds-head"><h3>#'+esc(String(o.id).replace(/-/g,'').slice(-5).toUpperCase())+'</h3><span class="iv-chip '+(stage==='ready'?'success':late?'danger':'orange')+'">'+icon(stage==='ready'?'checkCircle':late?'alert':'clock',14)+esc(stage==='ready'?'Pronto':age===null?'Sem horário':age+' min')+'</span></div>'
          +'<div class="iv-kds-table">'+icon('table',17)+esc(t?.label??'Sem mesa')+'</div>';
        for(const item of (data.items??[]).filter(i=>i.order_id===o.id&&i.status!=='cancelled')){
          out+='<div class="iv-kds-item"><span>'+Number(item.quantity)+'×</span><div><b>'+esc(item.product_name)+'</b>'+(item.note?'<p>'+icon('info',13)+esc(item.note)+'</p>':'')+'</div></div>';
        }
        if(stage==='ready')out+='<div class="iv-chip success">'+icon('checkCircle',14)+' Pronto para servir</div>';
        out+='<div class="iv-kds-actions">';
        if(stage==='submitted')out+='<button class="iv-kds-next" data-progress="'+esc(o.id)+'" data-next="preparing">'+icon('chef',17)+' Iniciar preparo</button>';
        if(stage==='preparing')out+='<button class="iv-kds-next" data-progress="'+esc(o.id)+'" data-next="ready">'+icon('checkCircle',17)+' Marcar como pronto</button>';
        out+='<button type="button" class="iv-kds-print" data-ticket="'+esc(o.id)+'" title="Imprimir pedido manualmente" aria-label="Prévia do pedido para impressão">'+icon('printer',18)+'</button></div></article>';
      }
      if(!queue.length)out+='<div class="iv-empty">Nenhum pedido nesta etapa</div>';
      out+='</div></section>';
    }
    out+='</div>';
    box(out);
    const kOnline=document.getElementById('k-online');if(kOnline)kOnline.textContent=navigator.onLine?'Conectado à internet':'Sem internet';
    document.getElementById('k-reload').onclick=()=>refresh();
    document.querySelectorAll('[data-progress]').forEach(b=>b.onclick=async()=>{
      b.disabled=true;
      try{await call('order_progress',{order_id:b.dataset.progress,p_next:b.dataset.next});await refresh()}
      catch(e){alert(e.message);b.disabled=false}
    });
    document.querySelectorAll('[data-ticket]').forEach(button=>button.onclick=()=>{
      const order=orders.find(o=>o.id===button.dataset.ticket);
      if(!order)return;
      const table=(data.tables??[]).find(t=>t.id===order.table_id);
      const orderItems=(data.items??[]).filter(i=>i.order_id===order.id&&i.status!=='cancelled');
      const ticket='<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Pedido cozinha · Intervalo</title>'
       +'<style>body{max-width:460px;margin:25px auto;padding:12px;font:14px Arial,sans-serif;color:#111}h1{text-align:center;font-size:20px}hr{border:0;border-top:1px dashed #777;margin:13px 0}.item{margin:10px 0;font-weight:bold}.note{margin-left:16px;font-weight:normal}.toolbar{margin-bottom:20px}@media print{body{max-width:76mm;margin:0;padding:0;font-size:11px}.toolbar{display:none}}</style></head><body>'
       +'<div class="toolbar"><button onclick="window.print()">Imprimir / Salvar PDF</button></div>'
       +'<h1>PEDIDO · COZINHA</h1><p style="text-align:center">'+esc(restaurant.name)+'</p><hr>'
       +'<p><b>Mesa: '+esc(table?.label??'Mesa')+'</b><br>Comanda: '+esc(order.id)+'<br>Status: '+esc(order.status)+'</p><hr>'
       +orderItems.map(i=>'<p class="item">'+esc(i.quantity)+' × '+esc(i.product_name)
         +(i.note?'<span class="note"><br>Obs: '+esc(i.note)+'</span>':'')+'</p>').join('')
       +'<hr><small>Prévia manual do pedido; não indica envio para impressora térmica ou confirmação de impressão.</small></body></html>';
      const win=window.open('','_blank');
      if(!win){alert('Autorize janelas pop-up para abrir a prévia de impressão.');return}
      win.document.open();win.document.write(ticket);win.document.close();win.focus();
    });
  }catch(e){if(!silent)box(base+'<section class="k-card"><p class="error">'+esc(e.message)+'</p></section>')}
  finally{fetching=false}
 }
 const poll=setInterval(()=>{if(document.visibilityState==='visible'&&document.getElementById('k-reload'))refresh(true)},15000);
 window.addEventListener('pagehide',()=>clearInterval(poll),{once:true});
 return refresh();
}