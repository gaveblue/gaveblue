// Intervalo — cozinha com consulta automática em intervalos de 15s, sem alegar Realtime ou impressão.
import {icon} from './ui-icons.js?v=1.0.0-rc.1';
import {menuButtonMarkup} from './global-navigation-rc7.js?v=1.2.0-rc.7';
import {printConfigured,onlineReceiptData} from './print-template-rc2.js?v=1.2.0-rc.15';
export function kitchenClock(start,stage,now=Date.now()){
 const ts=Date.parse(start??'');if(!Number.isFinite(ts)||stage==='ready')return {text:stage==='ready'?'Pronto':'Sem horário',late:false};
 const seconds=Math.max(0,Math.floor((now-ts)/1000));
 return {text:String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0'),late:seconds>=1200};
}
export async function renderPage({supabase,restaurant,box,esc,link}){
 document.body.classList.add('iv-fullwidth','iv-kds');
 const css='<style>.k-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.k-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:22px}.k-card h3{margin:0}.k-card button,.k-reload{margin-top:11px;border:0;border-radius:9px;padding:12px 15px;background:#0f766e;color:#fff;cursor:pointer;font-weight:700}.k-state{font-size:11px;border-radius:20px;background:#e2e8f0;padding:6px 10px;font-weight:700}.k-top{display:flex;justify-content:space-between;align-items:center;gap:10px}.k-card p{font-size:14px}.k-card small{color:#64748b}.k-empty{padding:36px;border:1px dashed #cbd5e1;border-radius:13px;color:#64748b}.iv-kds-table{font-weight:750}.iv-kds-online{border-color:#ffb766;border-left:4px solid #ff7900}.iv-kds-online .iv-kds-source{font-size:11px;font-weight:850;letter-spacing:.3px;color:#c56100}.iv-kds-alert{background:#fff7ed;border:1px solid #fed7aa;border-radius:13px;padding:13px 15px;color:#9a3412;font-size:13px;margin:12px 0}.iv-kds-online-status{font-size:12px;color:#64748b;margin:7px 0 11px}.iv-kds-online .iv-kds-head h3{font-size:15px}</style>';
 const timeCss='<style>.iv-kds-clock{font-variant-numeric:tabular-nums;white-space:nowrap}.iv-kds-clock.danger{background:#fee2e2!important;color:#b42323!important}.iv-kds-ticket.is-late{border-color:#ef9a9a!important}.iv-kds-ticket.is-late .iv-kds-head h3{color:#b42323}@media(max-width:480px){.iv-kds-ticket{min-width:0}.iv-kds-head{flex-wrap:wrap}.iv-kds-actions{flex-wrap:wrap}.iv-kds-item{overflow-wrap:anywhere}}</style>';
 const clockMarkup=(start,stage)=>{const c=kitchenClock(start,stage);return '<span class="iv-chip iv-kds-clock '+(stage==='ready'?'success':c.late?'danger':'orange')+'" data-k-start="'+esc(start??'')+'" data-k-stage="'+stage+'">'+icon(stage==='ready'?'checkCircle':c.late?'alert':'clock',14)+'<span>'+esc(c.text)+'</span></span>'};
 const base=css+timeCss+'<div class="iv-header"><div><div class="iv-global-title">'+menuButtonMarkup()+'<div><span class="iv-section-caption">COZINHA · KDS</span><h1>Painel de produção</h1></div></div><p>'+esc(restaurant.name)+' · Presencial e Loja Online</p></div><div class="iv-actions"><span class="iv-chip success" id="k-online">Conectado</span><button class="iv-btn" type="button" id="k-reload">'+icon('refresh',16)+' Atualizar</button></div></div>';
 const call=async(action,extra={})=>{const r=await supabase.functions.invoke('restaurant-core',{body:{restaurant_id:restaurant.id,action,...extra}});if(r.error||r.data?.error){let reason=r.data?.error??r.error?.message??'Falha';try{const v=await r.error?.context?.json?.();reason=v?.error??reason}catch{}throw Error(reason)}return r.data};
 let fetching=false,lastSignature='';
 async function refresh(silent=false){
  if(fetching)return;
  fetching=true;
  if(!silent)box(base+'<div class="iv-loading-inline" role="status" aria-live="polite" aria-busy="true"><div class="iv-loading-inline-label"><span class="iv-load-dot" aria-hidden="true"></span><span>Organizando as rodadas...</span></div><div class="iv-loading-inline-lines" aria-hidden="true"><span class="iv-load-skeleton"></span><span class="iv-load-skeleton"></span></div></div>');
  try{
    // A falha de um módulo não pode esconder os pedidos válidos do outro.
    const [coreResult,onlineResult]=await Promise.allSettled([
      call('orders'),
      supabase.functions.invoke('marketplace-operations',{body:{restaurant_id:restaurant.id,action:'kitchen_queue'}})
    ]);
    const data=coreResult.status==='fulfilled'?coreResult.value:{orders:[],rounds:[],items:[],tables:[]};
    const coreError=coreResult.status==='rejected'?(coreResult.reason?.message??'Falha na consulta de comandas'):'';
    const reply=onlineResult.status==='fulfilled'?onlineResult.value:null;
    let onlineError='';
    if(onlineResult.status==='rejected')onlineError=onlineResult.reason?.message??'Erro de conexão com pedidos online';
    else if(!reply||reply.error||reply.data?.error){
      onlineError=reply?.data?.error??reply?.error?.message??'Não foi possível consultar os pedidos da Loja Online';
      try{onlineError=(await reply?.error?.context?.json?.())?.error??onlineError}catch{}
    }
    const online=!onlineError&&Array.isArray(reply?.data?.orders)?reply.data.orders:[];
    const onlineItems=!onlineError&&Array.isArray(reply?.data?.items)?reply.data.items:[];
    const orders=data.orders??[],rounds=(data.rounds??[]).filter(r=>['submitted','preparing','ready'].includes(r.status));
    const preparingSince=reply?.data?.preparing_since??{};
    const signature=JSON.stringify({orders,rounds,items:data.items??[],tables:data.tables??[],online,onlineItems,preparingSince,coreError,onlineError});
    if(silent&&signature===lastSignature)return;
    lastSignature=signature;
    const lanes=[['submitted','Novos pedidos','Aguardando início','receipt'],['preparing','Em preparo','Pedidos em produção','chef'],['ready','Prontos','Aguardando entrega','checkCircle']];
    const minutes=r=>{const t=new Date(r.submitted_at??r.created_at??'').getTime();return Number.isFinite(t)?Math.max(0,Math.floor((Date.now()-t)/60000)):null};
    let out=base;
    if(coreError)out+='<div class="iv-kds-alert" role="alert">Não foi possível carregar comandas presenciais: '+esc(coreError)+'. Use Atualizar para tentar novamente.</div>';
    if(onlineError)out+='<div class="iv-kds-alert" role="alert">Não foi possível carregar a fila da Loja Online: '+esc(onlineError)+'. Verifique a permissão Cozinha e toque em Atualizar.</div>';
    out+='<div class="iv-kds-board">';
    for(const [stage,name,caption,ico] of lanes){
      const queue=rounds.filter(r=>r.status===stage).sort((a,b)=>new Date(a.submitted_at??a.created_at)-new Date(b.submitted_at??b.created_at));
      const onlineQueue=online.filter(o=>
        stage==='submitted'?o.status==='accepted':
        stage==='preparing'?o.status==='preparing':
        ['ready','ready_for_pickup'].includes(o.status)
      ).sort((a,b)=>new Date(a.accepted_at??a.created_at)-new Date(b.accepted_at??b.created_at));
      out+='<section class="iv-kds-lane '+stage+'"><div class="iv-kds-lanehead"><div><b>'+icon(ico,21)+esc(name)+'</b><small>'+caption+'</small></div><strong>'+(queue.length+onlineQueue.length)+'</strong></div><div class="iv-kds-stack">';
      for(const round of queue){
        const o=orders.find(x=>x.id===round.order_id);
        if(!o)continue;
        const t=(data.tables??[]).find(t=>t.id===o.table_id),start=stage==='preparing'?round.started_at:round.submitted_at??round.created_at;
        out+='<article class="iv-kds-ticket"><div class="iv-kds-head"><h3>#'+esc(String(o.id).replace(/-/g,'').slice(-5).toUpperCase())+'</h3>'+clockMarkup(start,stage)+'</div>'
          +'<div class="iv-kds-table">'+icon('table',17)+esc(t?.label??'Sem mesa')+' · Rodada '+esc(round.round_no)+'</div>';
        for(const item of (data.items??[]).filter(i=>i.order_id===o.id&&Number(i.round_no||1)===Number(round.round_no)&&i.status!=='cancelled')){
          out+='<div class="iv-kds-item"><span>'+Number(item.quantity)+'×</span><div><b>'+esc(item.product_name)+'</b>'+(item.note?'<p>'+icon('info',13)+esc(item.note)+'</p>':'')+'</div></div>';
        }
        if(stage==='ready')out+='<div class="iv-chip success">'+icon('checkCircle',14)+' Pronto para servir</div>';
        out+='<div class="iv-kds-actions">';
        if(stage==='submitted')out+='<button class="iv-kds-next" data-progress="'+esc(o.id)+'" data-round="'+esc(round.round_no)+'" data-next="preparing">'+icon('chef',17)+' Iniciar preparo</button>';
        if(stage==='preparing')out+='<button class="iv-kds-next" data-progress="'+esc(o.id)+'" data-round="'+esc(round.round_no)+'" data-next="ready">'+icon('checkCircle',17)+' Marcar como pronto</button>';
        out+='<button type="button" class="iv-kds-print" data-ticket="'+esc(o.id)+'" data-ticket-round="'+esc(round.round_no)+'" title="Imprimir pedido manualmente" aria-label="Prévia do pedido para impressão">'+icon('printer',18)+'</button></div></article>';
      }
      // Todo pedido aceito da Loja Online entra na mesma etapa visual da cozinha.
      // Os estados e itens permanecem em tabelas distintas, sem criar mesa fictícia.
      for(const o of onlineQueue){
        const label=o.fulfillment_type==='delivery'?'DELIVERY':'RETIRADA';
        const next=o.status==='accepted'?'preparing':o.status==='preparing'
          ?(o.fulfillment_type==='pickup'?'ready_for_pickup':'ready'):null;
        const start=stage==='preparing'?preparingSince[o.id]:o.accepted_at??o.created_at;
        out+='<article class="iv-kds-ticket iv-kds-online" data-source="online"><div class="iv-kds-head">'
          +'<h3>'+esc(o.public_code)+'</h3><span class="iv-chip orange">'+esc(label)+'</span></div>'
          +'<div class="iv-kds-source">'+icon('package',14)+' PEDIDO DA LOJA ONLINE</div>'
          +'<p class="iv-kds-online-status">'+esc(o.status==='accepted'?'Aceito · aguardando início':o.status==='preparing'?'Em preparo':o.fulfillment_type==='pickup'?'Pronto para retirada':'Pronto para entrega')
          +'</p>'+clockMarkup(start,stage);
        const items=onlineItems.filter(i=>i.order_id===o.id);
        if(!items.length)out+='<p class="iv-kds-online-status">Itens indisponíveis. Toque em Atualizar.</p>';
        for(const item of items){
          out+='<div class="iv-kds-item"><span>'+Number(item.quantity)+'×</span><div><b>'+esc(item.product_name)+'</b>'
            +(item.note?'<p>'+icon('info',13)+esc(item.note)+'</p>':'')+'</div></div>';
        }
        out+='<div class="iv-kds-actions">';
        if(next)out+='<button type="button" class="iv-kds-next" data-online-order="'+esc(o.id)+'" data-online-next="'+esc(next)+'">'
          +icon(next==='preparing'?'chef':'checkCircle',17)+esc(next==='preparing'?' Iniciar preparo':' Marcar pronto')+'</button>';
        else out+='<span class="iv-chip success">'+icon('checkCircle',14)+' Aguardando retirada/expedição</span>';
        out+='<button type="button" class="iv-kds-print" data-online-print="'+esc(o.id)+'" aria-label="Imprimir pedido online">'+icon('printer',18)+'</button></div></article>';
      }
      if(!queue.length&&!onlineQueue.length)out+='<div class="iv-empty">Nenhum pedido nesta etapa</div>';
      out+='</div></section>';
    }
    out+='</div>';
    box(out);
    const kOnline=document.getElementById('k-online');if(kOnline)kOnline.textContent=navigator.onLine?'Conectado à internet':'Sem internet';
    document.getElementById('k-reload').onclick=()=>refresh();
    document.querySelectorAll('[data-progress]').forEach(b=>b.onclick=async()=>{
      b.disabled=true;
      try{await call('round_progress',{order_id:b.dataset.progress,round_no:Number(b.dataset.round),p_next:b.dataset.next});await refresh()}
      catch(e){alert(e.message);b.disabled=false}
    });
    document.querySelectorAll('[data-online-order]').forEach(b=>b.onclick=async()=>{
     b.disabled=true;
     try{
      const result=await supabase.functions.invoke('marketplace-operations',{body:{restaurant_id:restaurant.id,
       action:'transition',order_id:b.dataset.onlineOrder,target:b.dataset.onlineNext}});
      if(result.error||result.data?.error)throw Error(result.data?.error??result.error?.message??'Erro ao atualizar delivery');
      await refresh();
     }catch(e){alert(e.message);b.disabled=false}
    });
    document.querySelectorAll('[data-online-print]').forEach(b=>b.onclick=()=>{const o=online.find(x=>x.id===b.dataset.onlinePrint);if(o)void printConfigured({supabase,restaurant,kind:'kitchen',data:onlineReceiptData(o,onlineItems.filter(x=>x.order_id===o.id))})});
    tick();
    document.querySelectorAll('[data-ticket]').forEach(button=>button.onclick=()=>{
      const order=orders.find(o=>o.id===button.dataset.ticket);
      if(!order)return;
      const table=(data.tables??[]).find(t=>t.id===order.table_id);
      const ticketRound=Number(button.dataset.ticketRound);
      const orderItems=(data.items??[]).filter(i=>i.order_id===order.id&&Number(i.round_no||1)===ticketRound&&i.status!=='cancelled');
      const shortId=String(order.id||'').replace(/-/g,'').slice(-8).toUpperCase();
      void printConfigured({supabase,restaurant,kind:'kitchen',data:{id:shortId,table:table?.label??'Mesa',status:rounds.find(x=>x.order_id===order.id&&Number(x.round_no)===ticketRound)?.status??'',round:ticketRound,opened_at:order.opened_at,items:orderItems}});
    });
  }catch(e){if(!silent)box(base+'<section class="k-card"><p class="error">'+esc(e.message)+'</p></section>')}
  finally{fetching=false}
 }
 function tick(){
  if(document.visibilityState!=='visible')return;const now=Date.now();
  for(const el of document.querySelectorAll('[data-k-stage]')){
   const c=kitchenClock(el.dataset.kStart,el.dataset.kStage,now),late=el.classList.contains('danger');
   if(c.late!==late){el.classList.toggle('danger',c.late);el.classList.toggle('orange',!c.late&&el.dataset.kStage!=='ready');el.innerHTML=icon(c.late?'alert':el.dataset.kStage==='ready'?'checkCircle':'clock',14)+'<span></span>'}
   const span=el.querySelector('span');if(span&&span.textContent!==c.text)span.textContent=c.text;
   el.closest('.iv-kds-ticket')?.classList.toggle('is-late',c.late);
  }
 }
 const timer=setInterval(tick,1000);
 const poll=setInterval(()=>{if(document.visibilityState==='visible'&&document.getElementById('k-reload'))refresh(true)},15000);
 window.addEventListener('pagehide',()=>{clearInterval(poll);clearInterval(timer)},{once:true});
 return refresh();
}