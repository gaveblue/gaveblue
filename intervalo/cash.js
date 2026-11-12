// Intervalo — caixa: apenas registros de recebimentos externos, sem integração com adquirentes.
import {icon} from './ui-icons.js?v=1.0.0-rc.1';
export async function renderPage({supabase,restaurant,box,esc,link}){
 document.body.classList.add('iv-fullwidth','iv-pos');
 const css='<style>.c-card{padding:20px;background:white;border:1px solid #e2e8f0;border-radius:14px;margin:14px 0}.c-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:13px}.c-form{display:flex;gap:10px;flex-wrap:wrap;align-items:end}.c-form label{flex:1 1 185px;font-size:12px;font-weight:700}.c-form input,.c-form select{display:block;width:100%;padding:11px;border:1px solid #cbd5e1;border-radius:9px;margin-top:6px;background:white}.c-form button{border:0;background:#0f766e;color:white;border-radius:9px;padding:12px 13px;font-weight:700;cursor:pointer}.c-form button:disabled{opacity:.45}.c-warning{background:#fff7ed;border:1px solid #fdba74;padding:12px;border-radius:10px;color:#9a3412;font-size:13px}.c-muted{font-size:12px;color:#64748b}.c-money{color:#0f766e;font-weight:800}.c-preview{padding:9px 12px;margin-bottom:13px;border:1px solid #0f766e;background:#f0fdfa;color:#0f766e;border-radius:9px;font-size:12px;font-weight:700}</style>';
 const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)/100);
 const toCents=s=>{const t=String(s??'').trim().replace(',','.');if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(t))throw Error('Valor inválido. Exemplo: 15,50');let [i,f='']=t.split('.');return Number(i)*100+Number((f+'00').slice(0,2))};
 const call=async(action,data={})=>{const r=await supabase.functions.invoke('restaurant-core',{body:{restaurant_id:restaurant.id,action,...data}});if(r.error||r.data?.error){let message=r.data?.error??r.error?.message??'Falha';try{const v=await r.error?.context?.json?.();if(v?.error)message=v.error}catch{}throw Error(message)}return r.data};
 const main=css+'<div class="iv-header"><div><span class="iv-section-caption">FRENTE DE CAIXA</span><h1>'+icon('register',26)+' Caixa · Recebimentos</h1><p>'+esc(restaurant.name)+' · Pagamentos registrados manualmente após confirmação externa</p></div><div class="iv-actions"><a class="iv-btn secondary" href="'+link('/inicio')+'">'+icon('arrowLeft',16)+' Restaurantes</a></div></div><div class="iv-note">'+icon('info',16)+' Pix e cartões não são processados aqui. Confirme o recebimento fora do Intervalo antes de registrá-lo no caixa.</div>'
 let selectedOrderId=null;
 async function reload(){
  box(main+'<p>Carregando caixa...</p>');
  try{
    const [ordersData,cashData]=await Promise.all([call('orders'),call('cash_summary')]);
    const open=(cashData.sessions??[]).find(s=>s.status==='open');
    const orders=(ordersData.orders??[]).filter(o=>o.status==='served');
    const recentClosed=(ordersData.orders??[]).filter(o=>o.status==='closed').slice(0,20);
    const items=ordersData.items??[],pay=ordersData.payments??[],tables=ordersData.tables??[];
    if(!orders.some(o=>o.id===selectedOrderId))selectedOrderId=orders[0]?.id??null;
    const selected=orders.find(o=>o.id===selectedOrderId);
    const calc=o=>{const rows=items.filter(i=>i.order_id===o.id&&i.status!=="cancelled"),total=rows.reduce((n,i)=>n+Number(i.unit_price_cents)*Number(i.quantity),0),paid=pay.filter(x=>x.order_id===o.id).reduce((n,x)=>n+Number(x.amount_cents),0);return {rows,total,paid,outstanding:Math.max(0,total-paid)}};
    let out=main+'<section class="c-session"><div><h3>'+icon("wallet",19)+' Sessão de caixa</h3><p class="c-muted">'+(open?'Aberta · Início: '+esc(open.opened_at)+' · Troco inicial: '+money(open.starting_cash_cents):'Abra o caixa antes de registrar recebimentos.')+'</p></div>';
    if(!open)out+='<form id="cash-open" class="c-session-form"><label>Troco inicial (R$)<input required name="amount" placeholder="0,00" value="0,00"></label><button class="iv-btn" type="submit">'+icon("plus",16)+' Abrir caixa</button></form>';
    else out+='<form id="cash-close" class="c-session-form"><label>Dinheiro contado (R$)<input required name="amount" placeholder="0,00"></label><button class="iv-btn secondary" type="submit">'+icon("checkCircle",16)+' Fechar caixa</button></form>';
    out+='</section><div class="c-pos-layout"><aside class="c-queue"><div class="c-pane-title"><h2>'+icon('clipboard',20)+' Fila de pagamento</h2><span class="iv-chip orange">'+orders.length+'</span></div><p class="c-muted">Comandas servidas aguardando quitação.</p><div class="c-queue-list">';
    for(const o of orders){
      const table=tables.find(t=>t.id===o.table_id),d=calc(o);
      out+='<button type="button" class="c-queue-item'+(o.id===selectedOrderId?' selected':'')+'" data-cash-select="'+esc(o.id)+'"><span>'+icon("table",19)+' <b>'+esc(table?.label??'Comanda')+'</b></span><span>'+money(d.outstanding)+' '+icon("chevronRight",17)+'</span></button>';
    }
    if(!orders.length)out+='<div class="iv-empty">Nenhuma comanda aguardando pagamento</div>';
    out+='</div><h3 class="c-closed-heading">'+icon('checkCircle',17)+' Quitadas recentemente</h3><div class="c-queue-list">';
    for(const o of recentClosed){
      const table=tables.find(t=>t.id===o.table_id),d=calc(o);
      out+='<div class="c-closed-row"><b>'+esc(table?.label??'Comanda')+'<small>'+money(d.total)+'</small></b><button class="c-preview" data-receipt="'+esc(o.id)+'" type="button">'+icon("printer",16)+' Imprimir</button></div>';
    }
    if(!recentClosed.length)out+='<p class="c-muted">Nenhuma comanda quitada neste recorte.</p>';
    out+='</div></aside><section class="c-details">';
    if(selected){
      const table=tables.find(t=>t.id===selected.table_id),d=calc(selected);
      out+='<div class="c-pane-title"><h2>'+icon("table",21)+' '+esc(table?.label??'Comanda')+'</h2><span class="iv-chip orange">Aguardando pagamento</span></div><p class="c-muted">Confira os itens antes de registrar o pagamento.</p><div class="c-line-head"><span>Itens consumidos</span><span>Valor</span></div>';
      for(const item of d.rows)out+='<div class="c-line"><div><b>'+Number(item.quantity)+'× '+esc(item.product_name)+'</b>'+(item.note?'<small>'+esc(item.note)+'</small>':'')+'</div><strong>'+money(Number(item.unit_price_cents)*Number(item.quantity))+'</strong></div>';
      out+='<div class="c-totals"><div><span>Total da comanda</span><b>'+money(d.total)+'</b></div><div><span>Já recebido</span><b>'+money(d.paid)+'</b></div><div class="c-total-main"><span>Saldo a receber</span><strong>'+money(d.outstanding)+'</strong></div></div>'
       +'<button type="button" class="c-preview" data-receipt="'+esc(selected.id)+'">'+icon("printer",16)+' Visualizar / imprimir comanda</button>';
    }else out+='<div class="iv-empty">Selecione uma comanda para conferir o pagamento.</div>';
    out+='</section><aside class="c-payment"><div class="c-pane-title"><h2>'+icon('wallet',20)+' Pagamento</h2></div>';
    if(selected){
      const d=calc(selected);
      out+='<p class="c-muted">Selecione a forma de recebimento já confirmada. Para dividir a conta, registre valores parciais.</p><form class="c-form c-payment-form" data-payment="'+esc(selected.id)+'"><h3>Forma de pagamento</h3><div class="c-methods">';
      for(const [method,label,ico] of [["pix_recorded","Pix","card"],["credit_recorded","Crédito","card"],["debit_recorded","Débito","card"],["cash","Dinheiro","banknote"],["other_recorded","Outro","wallet"]]){
        out+='<label class="c-method"><input type="radio" name="method" value="'+method+'" '+(method==='pix_recorded'?'checked':'')+'><span>'+icon(ico,22)+'<b>'+label+'</b></span></label>';
      }
      out+='</div><label>Valor recebido (R$)<input name="amount" required inputmode="decimal" value="'+(d.outstanding/100).toFixed(2).replace('.',',')+'"></label><div class="iv-note">Para pagamentos parciais, informe o valor de cada recebimento separadamente.</div>'
       +'<button type="submit" class="iv-btn c-confirm" '+(!open||d.outstanding<=0?'disabled':'')+'>'+icon("checkCircle",18)+' Registrar recebimento</button></form>';
      if(!open)out+='<p class="c-muted">Abra uma sessão de caixa para registrar pagamentos.</p>';
    }else out+='<div class="iv-empty">Aguardando uma comanda servida.</div>';
    out+='</aside></div>';
    box(out);
    document.querySelectorAll('[data-cash-select]').forEach(button=>button.onclick=()=>{selectedOrderId=button.dataset.cashSelect;reload()});
    document.querySelectorAll('[data-receipt]').forEach(button=>button.onclick=()=>{
      const order=(ordersData.orders??[]).find(o=>o.id===button.dataset.receipt);
      if(!order)return;
      const table=tables.find(t=>t.id===order.table_id);
      const rows=items.filter(i=>i.order_id===order.id&&i.status!=='cancelled');
      const total=rows.reduce((n,i)=>n+Number(i.unit_price_cents)*i.quantity,0);
      const receipts=pay.filter(p=>p.order_id===order.id);
      const received=receipts.reduce((n,p)=>n+Number(p.amount_cents),0);
      const content='<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Comanda · Intervalo</title>'
        +'<style>body{font:14px Arial,sans-serif;max-width:460px;margin:28px auto;padding:12px;color:#111}h1{text-align:center;font-size:21px}hr{border:0;border-top:1px dashed #777;margin:14px 0}table{width:100%;border-collapse:collapse}td{padding:6px 3px;border-bottom:1px solid #eee}td:last-child{text-align:right}small{color:#555}.totals{text-align:right;margin:12px 0}.toolbar{margin-bottom:20px}.toolbar button{padding:9px 14px}@media print{.toolbar{display:none}body{max-width:76mm;margin:0;padding:0;font-size:11px}}</style></head><body>'
        +'<div class="toolbar"><button onclick="window.print()">Imprimir / Salvar PDF</button></div>'
        +'<h1>'+esc(restaurant.name)+'</h1><p style="text-align:center">PRÉVIA DE COMANDA · NÃO FISCAL</p><hr>'
        +'<p><b>'+esc(table?.label??'Mesa')+'</b> · '+esc(order.status)+'</p>'
        +'<p><small>Pedido: '+esc(order.id)+'<br>Aberto: '+esc(order.opened_at)+'</small></p><hr><table>'
        +rows.map(i=>'<tr><td>'+esc(i.quantity)+' × '+esc(i.product_name)+(i.note?'<br><small>'+esc(i.note)+'</small>':'')+'</td><td>'+money(Number(i.unit_price_cents)*i.quantity)+'</td></tr>').join('')
        +'</table><div class="totals"><p>Total: <b>'+money(total)+'</b></p><p>Recebimentos registrados: '+money(received)+'</p><p>Saldo: '+money(Math.max(0,total-received))+'</p></div><hr>'
        +'<p><small>Documento interno, não substitui nota fiscal nem comprova recebimento bancário.</small></p></body></html>';
      const win=window.open('','_blank');
      if(!win){alert('O navegador bloqueou a prévia. Autorize a abertura de janelas para este site.');return}
      win.document.open();win.document.write(content);win.document.close();win.focus();
    });
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