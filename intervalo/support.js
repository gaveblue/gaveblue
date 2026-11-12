// Intervalo — cadastros operacionais auxiliares (mesas, estoque, dispositivos, relatórios).
export async function renderPage({supabase,restaurant,module,box,esc,link}){
 const css='<style>.x-panel{padding:19px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;margin:13px 0}.x-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:14px}.x-form{display:flex;flex-wrap:wrap;gap:12px;align-items:end}.x-form label{flex:1 1 180px;font-size:12px;font-weight:700}.x-form input,.x-form select{display:block;width:100%;margin-top:7px;padding:10px 12px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#0f172a}.x-form button,.x-btn{padding:11px 14px;background:#0f766e;color:#fff;border:0;border-radius:9px;cursor:pointer;font-size:12px;font-weight:700}.x-muted{font-size:12px;color:#64748b}.x-note{font-size:12px;line-height:1.55;background:#fff7ed;border:1px solid #fdba74;border-radius:10px;color:#9a3412;padding:13px}.x-panel h3{margin:2px 0 11px}</style>';
 const names={mesas:'Mesas e salões',estoque:'Estoque',impressao:'Impressão térmica',relatorios:'Relatórios operacionais'};
 const title=css+'<h1>'+esc(names[module]??'Operação')+'</h1><p class="x-muted">'+esc(restaurant.name)+'</p><p><a href="'+link('/'+restaurant.slug+'/gestao')+'">Voltar à Gestão</a></p>';
 const fmt=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)/100);
 const call=async(action,params={})=>{const r=await supabase.functions.invoke('restaurant-core',{body:{restaurant_id:restaurant.id,action,...params}});if(r.error||r.data?.error){let message=r.data?.error??r.error?.message??'Falha';try{const x=await r.error?.context?.json?.();if(x?.error)message=x.error}catch{}throw Error(message)}return r.data};
 const form=(id,callback)=>{const f=document.getElementById(id);if(!f)return;f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('button[type=submit]');b.disabled=true;try{await callback(Object.fromEntries(new FormData(f).entries()));await load()}catch(err){alert(err.message);b.disabled=false}}};
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
    const {items=[]}=await call('stock_list');
    let out=title+'<p class="x-note">O estoque está preparado para cadastro de insumos e saldos iniciais. A baixa automática por venda e as fichas técnicas ainda não estão operacionais.</p><section class="x-panel"><h2>Novo insumo</h2><form id="newstock" class="x-form"><label>Nome<input name="name" required minlength="2" maxlength="120"></label><label>Unidade<select name="unit"><option value="un">Unidades</option><option value="kg">Kg</option><option value="g">Gramas</option><option value="l">Litros</option><option value="ml">mL</option></select></label><label>Saldo inicial<input name="quantity" type="number" min="0" step=".001" value="0" required></label><label>Estoque mínimo<input name="min_quantity" type="number" min="0" step=".001" value="0" required></label><button type="submit">Cadastrar</button></form></section><h2>Insumos ('+items.length+')</h2><div class="x-grid">';
    for(const item of items)out+='<div class="x-panel"><h3>'+esc(item.name)+'</h3><p>Saldo: '+esc(item.quantity)+' '+esc(item.unit)+'</p><p class="x-muted">Estoque mínimo: '+esc(item.min_quantity)+'</p></div>';
    out+='</div>';box(out);
    form('newstock',v=>call('stock_create',{name:v.name,unit:v.unit,quantity:Number(v.quantity),min_quantity:Number(v.min_quantity)}));
  }else if(module==='impressao'){
    const {devices=[],jobs=[]}=await call('printers');
    let out=title+'<p class="x-note">A impressora B&G BG-06 depende do agente local no Windows e de teste físico com USB ou Bluetooth. Nenhum equipamento está enviando impressões e as filas não estão processadas automaticamente.</p><section class="x-panel"><h2>Cadastrar equipamento planejado</h2><form id="newprinter" class="x-form"><label>Nome<input name="display_name" value="B&G BG-06" required minlength="2" maxlength="100"></label><label>Estação<select name="station"><option value="cozinha">Cozinha</option><option value="caixa">Caixa</option><option value="balcao">Balcão</option></select></label><button type="submit">Cadastrar desativado</button></form></section><h2>Dispositivos ('+devices.length+')</h2><div class="x-grid">';
    for(const d of devices)out+='<div class="x-panel"><h3>'+esc(d.display_name)+'</h3><p class="x-muted">'+esc(d.station)+' · '+(d.enabled?'Habilitado':'Desativado')+'</p></div>';
    out+='</div><h2>Fila ('+jobs.length+')</h2><p class="x-muted">Fila de impressão apenas estruturada, sem agente habilitado.</p>';box(out);
    form('newprinter',v=>call('printer_register',{display_name:v.display_name,station:v.station}));
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