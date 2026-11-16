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
   +'<div class="iv-on-panel"><h2>Horários e regiões de entrega</h2><p>Estrutura de banco criada e pronta para receber seus horários e taxas. A edição desses cadastros será disponibilizada nas próximas etapas.</p>'
   +'<div class="iv-on-row"><span class="iv-on-closed">'+icon('clock',16)+' '+(data.business_hours??[]).length+' faixas de horário cadastradas</span>'
   +'<span class="iv-on-closed">'+icon('package',16)+' '+activeZones+' regiões ativas</span></div></div>';
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
