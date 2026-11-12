// Intervalo — caixa: apenas registros de recebimentos externos, sem integração com adquirentes.
export async function renderPage({supabase,restaurant,box,esc,link}){
 const css='<style>.c-card{padding:20px;background:white;border:1px solid #e2e8f0;border-radius:14px;margin:14px 0}.c-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:13px}.c-form{display:flex;gap:10px;flex-wrap:wrap;align-items:end}.c-form label{flex:1 1 185px;font-size:12px;font-weight:700}.c-form input,.c-form select{display:block;width:100%;padding:11px;border:1px solid #cbd5e1;border-radius:9px;margin-top:6px;background:white}.c-form button{border:0;background:#0f766e;color:white;border-radius:9px;padding:12px 13px;font-weight:700;cursor:pointer}.c-form button:disabled{opacity:.45}.c-warning{background:#fff7ed;border:1px solid #fdba74;padding:12px;border-radius:10px;color:#9a3412;font-size:13px}.c-muted{font-size:12px;color:#64748b}.c-money{color:#0f766e;font-weight:800}</style>';
 const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)/100);
 const toCents=s=>{const t=String(s??'').trim().replace(',','.');if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(t))throw Error('Valor inválido. Exemplo: 15,50');let [i,f='']=t.split('.');return Number(i)*100+Number((f+'00').slice(0,2))};
 const call=async(action,data={})=>{const r=await supabase.functions.invoke('restaurant-core',{body:{restaurant_id:restaurant.id,action,...data}});if(r.error||r.data?.error){let message=r.data?.error??r.error?.message??'Falha';try{const v=await r.error?.context?.json?.();if(v?.error)message=v.error}catch{}throw Error(message)}return r.data};
 const main=css+'<h1>Caixa e recebimentos</h1><p class="c-muted">'+esc(restaurant.name)+' · Controle de movimentações registradas.</p><p><a href="'+link('/'+restaurant.slug+'/gestao')+'">Voltar à Gestão</a></p><p class="c-warning"><b>Importante:</b> este sistema não cobra cartões, não gera Pix e não confirma transações junto a bancos. Registre somente valores já recebidos, conferidos fora do Intervalo.</p>';
 async function reload(){
  box(main+'<p>Carregando caixa...</p>');
  try{
    const [ordersData,cashData]=await Promise.all([call('orders'),call('cash_summary')]);
    const open=(cashData.sessions??[]).find(s=>s.status==='open');
    const orders=(ordersData.orders??[]).filter(o=>o.status==='served');
    const items=ordersData.items??[],pay=ordersData.payments??[],tables=ordersData.tables??[];
    let out=main+'<div class="c-card"><h2>Sessão de caixa</h2>';
    if(!open)out+='<form id="cash-open" class="c-form"><label>Troco inicial (R$)<input required name="amount" placeholder="0,00" value="0,00"></label><button type="submit">Abrir caixa</button></form>';
    else{
      out+='<p class="c-muted">Iniciado: '+esc(open.opened_at)+' · Troco: '+money(open.starting_cash_cents)+'</p>';
      out+='<form id="cash-close" class="c-form"><label>Dinheiro físico contado (R$)<input required name="amount" placeholder="0,00"></label><button type="submit">Fechar caixa</button></form>';
    }
    out+='</div><h2>Comandas aguardando quitação</h2><div class="c-grid">';
    for(const order of orders){
      const total=items.filter(i=>i.order_id===order.id&&i.status!=='cancelled').reduce((sum,i)=>sum+Number(i.unit_price_cents)*i.quantity,0);
      const paid=pay.filter(x=>x.order_id===order.id).reduce((sum,x)=>sum+Number(x.amount_cents),0);
      const outstanding=total-paid;
      const table=tables.find(t=>t.id===order.table_id);
      out+='<div class="c-card"><h3>'+esc(table?.label??'Mesa')+'</h3><p>Total '+money(total)+' · Já pago '+money(paid)+'</p><p class="c-money">Em aberto: '+money(Math.max(0,outstanding))+'</p><form class="c-form" data-payment="'+esc(order.id)+'"><label>Valor recebido<input name="amount" required value="'+(Math.max(0,outstanding)/100).toFixed(2).replace('.',',')+'"></label><label>Forma<select name="method"><option value="cash">Dinheiro</option><option value="debit_recorded">Débito recebido externamente</option><option value="credit_recorded">Crédito recebido externamente</option><option value="pix_recorded">Pix recebido externamente</option><option value="other_recorded">Outro recebido externamente</option></select></label><button type="submit" '+(open?'':'disabled title="Abra uma sessão de caixa"')+'>Registrar recebimento</button></form></div>';
    }
    out+='</div>';
    if(!orders.length)out+='<div class="c-card"><p>Não há contas servidas aguardando pagamento.</p></div>';
    box(out);
    const bind=(selector,callback)=>{const f=document.querySelector(selector);if(f)f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('button[type=submit]');b.disabled=true;try{await callback(Object.fromEntries(new FormData(f).entries()));await reload()}catch(err){alert(err.message);b.disabled=false}}};
    bind('#cash-open',v=>call('cash_open',{starting_cash_cents:toCents(v.amount)}));
    bind('#cash-close',async v=>{const d=await call('cash_close',{counted_cash_cents:toCents(v.amount)});alert('Conferência encerrada. Diferença em dinheiro: '+money(d.result?.difference_cents??0))});
    document.querySelectorAll('form[data-payment]').forEach(f=>f.onsubmit=async e=>{
      e.preventDefault();const b=f.querySelector('button');b.disabled=true;
      try{const v=Object.fromEntries(new FormData(f).entries());await call('pay_manual',{order_id:f.dataset.payment,amount_cents:toCents(v.amount),method:v.method});await reload()}
      catch(err){alert(err.message);b.disabled=false}
    });
  }catch(e){box(main+'<div class="c-card"><p class="error">'+esc(e.message)+'</p></div>')}
 }
 return reload();
}