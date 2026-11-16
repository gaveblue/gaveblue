import {icon} from './ui-icons.js?v=1.0.0-rc.1';
import {sheetifyForms,showFormSheetError} from './operational-sheets-rc15.js?v=1.0.0-rc.15';

// Gestão > Loja Online. Configurações em rascunho. NÃO aceita pedidos.
export async function renderPage({supabase,restaurant,box,esc,link}){
 document.body.classList.add('iv-fullwidth','iv-online-admin');
 const css='<link rel="stylesheet" href="/intervalo/online-management-rc1.css?v=1.1.0-rc.1">';
 const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n||0)/100);
 const realToCents=str=>{
  const s=String(str).trim().replace(',','.');
  if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(s))throw Error('Informe um valor válido, como 20,00.');
  const [a,b='']=s.split('.');
  return Number(a)*100+Number((b+'00').slice(0,2));
 };
 const toDisplay=n=>(Number(n||0)/100).toFixed(2).replace('.',',');
 const request=async(action,fields={})=>{
  const {data,error}=await supabase.functions.invoke('marketplace-management',{body:{restaurant_id:restaurant.id,action,...fields}});
  if(error||data?.error){let message=data?.error??error?.message??'Falha no serviço';try{const body=await error?.context?.json?.();message=body?.error??message}catch{}throw Error(message)}
  return data;
 };
 const base=css+'<section class="iv-on-header"><div><span class="iv-on-eyebrow">GESTÃO DO RESTAURANTE</span><h1>'+icon('store',26)+' Loja Online</h1><p>'+esc(restaurant.name)+' · Configurações do marketplace</p></div>'
  +'<a class="iv-on-back" href="'+link('/'+restaurant.slug+'/gestao')+'">'+icon('arrowLeft',17)+' Voltar à gestão</a></section>';
 function pending(){box(base+'<div class="iv-loading-inline" role="status" aria-busy="true"><span class="iv-load-dot"></span> Carregando configurações...</div>')}
 async function load(){
  pending();
  let data;
  try{data=await request('get')}catch(e){box(base+'<div class="iv-on-panel"><p class="error">'+esc(e.message)+'</p><a class="iv-on-link" href="'+link('/'+restaurant.slug+'/vendas-online')+'">Tentar novamente</a></div>');return}
  const store=data.storefront??{},online=data.online_settings??{},pub=data.publication??{};
  const visible=store.marketplace_visible===true;
  const published=pub.is_published===true&&pub.cardapio_enabled===true;
  const tags=(store.cuisine_tags??[]).join(', ');
  const activeZones=(data.delivery_zones??[]).filter(z=>z.active).length;
  const shopLink=link('/loja/'+restaurant.slug);
  const dayNames=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const schedule=(data.business_hours??[]).map(h=>'<div class="iv-on-time-row"><select name="day">'+dayNames.map((d,i)=>'<option value="'+i+'" '+(i===h.weekday?'selected':'')+'>'+d+'</option>').join('')+'</select><input type="time" name="opens" value="'+esc(String(h.opens_at).slice(0,5))+'"><input type="time" name="closes" value="'+esc(String(h.closes_at).slice(0,5))+'"><label><input type="checkbox" name="delivery" '+(h.delivery_enabled?'checked':'')+'> Entrega</label><label><input type="checkbox" name="pickup" '+(h.pickup_enabled?'checked':'')+'> Retirada</label><button type="button" data-remove-time>×</button></div>').join('');
  let out=base
   +'<div class="iv-on-banner"><strong>Marketplace em preparação.</strong> Você pode configurar os dados da loja e visualizar o cardápio. O checkout e o recebimento de pedidos ainda estão bloqueados por segurança.</div>'
   +'<div class="iv-on-stat-grid"><article class="iv-on-stat">'+icon('store',22)+'<span>Cardápio público</span><strong>'+(published?'Publicado':'Não publicado')+'</strong></article>'
   +'<article class="iv-on-stat">'+icon('search',22)+'<span>Exibição no marketplace</span><strong>'+(visible?'Visível':'Oculta')+'</strong></article>'
   +'<article class="iv-on-stat">'+icon('receipt',22)+'<span>Recebimento de pedidos</span><strong>Desativado</strong></article></div>'
   +'<div class="iv-on-panel"><div class="iv-on-row"><div><h2>Vitrine do restaurante</h2><p>Nome, descrição e categorias que o cliente verá na loja.</p></div><a class="iv-on-button secondary" href="'+shopLink+'">'+icon('arrowRight',16)+' Visualizar loja</a></div>'
   +'<form id="iv-online-draft" autocomplete="off">'
   +'<label class="iv-on-field">Nome comercial<input name="display_name" required minlength="2" maxlength="120" value="'+esc(store.display_name||restaurant.name)+'" placeholder="Nome do restaurante"></label>'
   +'<label class="iv-on-field">Descrição<textarea name="description" maxlength="1000" placeholder="Conte aos clientes sobre seu restaurante">'+esc(store.description??'')+'</textarea></label>'
   +'<label class="iv-on-field">Categorias culinárias<input name="cuisine_tags" maxlength="350" placeholder="Lanches, bebidas, pizzaria" value="'+esc(tags)+'"><span class="iv-on-help">Separe por vírgula. Até 12 categorias.</span></label>'
   +'<div class="iv-on-checks"><label><input type="checkbox" name="delivery_enabled" '+(online.delivery_enabled!==false?'checked':'')+'> Entrega própria</label><label><input type="checkbox" name="pickup_enabled" '+(online.pickup_enabled!==false?'checked':'')+'> Retirada no local</label></div>'
   +'<label class="iv-on-field">Pedido mínimo (R$)<input name="minimum_order" inputmode="decimal" value="'+toDisplay(online.minimum_order_cents)+'" placeholder="0,00"></label>'
   +'<label class="iv-on-field">Preparo estimado (minutos)<input name="estimated_prep_minutes" type="number" min="5" max="240" required value="'+esc(online.estimated_prep_minutes??30)+'"></label>'
   +'<label class="iv-on-field">Instruções ao cliente<textarea name="notes" maxlength="500" placeholder="Informações de atendimento">'+esc(online.notes??'')+'</textarea></label>'
   +'<button class="iv-on-button" type="submit">'+icon('checkCircle',16)+' Salvar configurações</button></form>'
   +'</div>'
   +'<div class="iv-on-panel"><div class="iv-on-row"><div><h2>Participação no marketplace</h2><p>Listar a loja na busca pública, sem habilitar compras.</p></div><span class="iv-on-status '+(visible?'ready':'')+'">'+(visible?'Exibida':'Não exibida')+'</span></div>'
   +'<p>O restaurante precisa ter o cardápio público publicado para aparecer na vitrine.</p>'
   +'<button type="button" class="iv-on-button secondary" id="iv-online-visibility" '+(!published?'disabled':'')+'>'+icon(visible?'x':'checkCircle',16)+(visible?' Ocultar do marketplace':' Exibir no marketplace')+'</button></div>'
   +'<section class="iv-on-panel"><h2>Horários de atendimento</h2><p>Defina as faixas em que os pedidos podem entrar. Cada dia pode ter mais de uma faixa.</p>'
   +'<form id="iv-on-hours"><div id="iv-on-hour-list">'+schedule+'</div><button type="button" class="iv-on-button secondary" id="iv-on-add-hour">+ Faixa de horário</button><button class="iv-on-button" type="submit">Salvar horários</button></form></section>'
   +'<section class="iv-on-panel"><div class="iv-on-row"><div><h2>Regiões de entrega</h2><p>Os endereços são validados contra cidade, bairro e CEP.</p></div><button type="button" class="iv-on-button" id="iv-on-new-zone">+ Região</button></div>'
   +(data.delivery_zones??[]).map(z=>'<div class="iv-on-zone-row"><div><strong>'+esc(z.name)+'</strong><small>'+esc(z.city)+' / '+esc(z.state)+' · R$ '+toDisplay(z.fee_cents)+' · '+(z.active?'Ativa':'Inativa')+'</small></div><button type="button" class="iv-on-button secondary" data-zone-edit="'+esc(z.id)+'">Editar</button></div>').join('')
   +'</section>'
   +'<div id="iv-on-zone-holder"><form id="iv-on-zone-form">'
   +'<label class="iv-on-field">Nome da região<input name="name" maxlength="90"></label>'
   +'<label class="iv-on-field">Cidade<input name="city" maxlength="100"></label>'
   +'<label class="iv-on-field">Estado (UF)<input name="state" maxlength="2"></label>'
   +'<label class="iv-on-field">Bairros, separados por vírgula<textarea name="neighborhoods" rows="2"></textarea></label>'
   +'<label class="iv-on-field">CEP inicial<input name="postal_code_from" maxlength="8"></label>'
   +'<label class="iv-on-field">CEP final<input name="postal_code_to" maxlength="8"></label>'
   +'<label class="iv-on-field">Taxa de entrega (R$)<input name="fee" value="0,00"></label>'
   +'<label class="iv-on-field">Pedido mínimo da região (R$)<input name="minimum" value="0,00"></label>'
   +'<label class="iv-on-field">Tempo de entrega (minutos)<input name="eta" type="number" min="5" max="240" value="40"></label>'
   +'<label class="iv-on-field"><input name="active" type="checkbox" checked> Região ativa</label>'
   +'<button class="iv-on-button" type="submit">Salvar região</button></form></div>'
   +'<section class="iv-on-panel"><h2>Recebimento de pedidos</h2><p>Somente o Master pode liberar o checkout. A entrega será realizada pelo próprio restaurante.</p>'
   +'<div class="iv-on-row"><span class="iv-on-status '+(online.enabled?'ready':'')+'">'+(online.enabled?'Pedidos ativos':'Pedidos desligados')+'</span>'
   +'<button type="button" class="iv-on-button" id="iv-on-toggle">'+(online.enabled?'Desativar pedidos':'Ativar pedidos online')+'</button></div></section>';

  box(out);
  const form=document.getElementById('iv-online-draft');
  form.onsubmit=async e=>{
   e.preventDefault();
   const button=form.querySelector('button[type="submit"]');if(button.disabled)return;
   button.disabled=true;button.textContent='Salvando...';
   try{
    const v=Object.fromEntries(new FormData(form).entries());
    const tags=String(v.cuisine_tags??'').split(',').map(x=>x.trim()).filter(Boolean);
    if(tags.length>12||tags.some(t=>t.length>40))throw Error('Informe até 12 categorias com no máximo 40 caracteres cada.');
    const mins=Number(v.estimated_prep_minutes);
    if(!Number.isSafeInteger(mins)||mins<5||mins>240)throw Error('O preparo deve ser entre 5 e 240 minutos.');
    await request('save_draft',{
     display_name:String(v.display_name??'').trim(),
     description:String(v.description??'').trim(),
     cuisine_tags:tags,
     delivery_enabled:form.elements.namedItem('delivery_enabled').checked,
     pickup_enabled:form.elements.namedItem('pickup_enabled').checked,
     minimum_order_cents:realToCents(v.minimum_order),
     estimated_prep_minutes:mins,
     notes:String(v.notes??'').trim()
    });
    await load();
   }catch(err){if(!showFormSheetError(form,err.message))alert(err.message);button.disabled=false;button.textContent='Salvar configurações'}
  };
  sheetifyForms([{id:'iv-online-draft',label:'Configurar loja',title:'Dados da loja online',description:'Os dados serão salvos como rascunho. Pedidos permanecerão desativados.'}]);
  const hoursForm=document.getElementById('iv-on-hours'),hourList=document.getElementById('iv-on-hour-list');
  hourList.onclick=e=>{if(e.target.closest('[data-remove-time]'))e.target.closest('.iv-on-time-row')?.remove()};
  document.getElementById('iv-on-add-hour').onclick=()=>{
   if(hourList.children.length>=28){alert('Limite de 28 faixas.');return}
   hourList.insertAdjacentHTML('beforeend','<div class="iv-on-time-row"><select name="day">'+dayNames.map((d,i)=>'<option value="'+i+'" '+(i===1?'selected':'')+'>'+d+'</option>').join('')+'</select><input type="time" name="opens" value="11:00"><input type="time" name="closes" value="22:00"><label><input type="checkbox" name="delivery" checked> Entrega</label><label><input type="checkbox" name="pickup" checked> Retirada</label><button type="button" data-remove-time>×</button></div>');
  };
  hoursForm.onsubmit=async e=>{
   e.preventDefault();const button=hoursForm.querySelector('[type="submit"]');if(button.disabled)return;
   const hours=[...hourList.querySelectorAll('.iv-on-time-row')].map(row=>({
    weekday:Number(row.querySelector('[name="day"]').value),
    opens_at:row.querySelector('[name="opens"]').value,
    closes_at:row.querySelector('[name="closes"]').value,
    delivery_enabled:row.querySelector('[name="delivery"]').checked,
    pickup_enabled:row.querySelector('[name="pickup"]').checked
   }));
   if(hours.some(h=>!h.opens_at||!h.closes_at||h.opens_at===h.closes_at)){alert('Revise os horários.');return}
   button.disabled=true;button.textContent='Salvando...';
   try{await request('save_hours',{hours});await load()}
   catch(e){if(!showFormSheetError(hoursForm,e.message))alert(e.message);button.disabled=false;button.textContent='Salvar horários'}
  };
  sheetifyForms([{id:'iv-on-hours',label:'Configurar horários',title:'Horários de pedidos'}]);
  const visibility=document.getElementById('iv-online-visibility');
  if(visibility)visibility.onclick=async()=>{
   const next=!visible;
   if(next&&!confirm('A loja ficará visível na busca pública do marketplace. Os pedidos online continuarão desativados. Confirma?'))return;
   visibility.disabled=true;
   try{await request('set_visible',{marketplace_visible:next});await load()}
   catch(e){alert(e.message);visibility.disabled=false}
  };
 }
 return load();
}
