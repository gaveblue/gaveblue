import {icon} from './ui-icons.js?v=1.0.0-rc.1';
import {sheetifyForms,showFormSheetError} from './operational-sheets-rc15.js?v=1.2.0-rc.14';
import {initInfinitePaySettings} from './marketplace-infinitepay-settings-rc8.js?v=1.1.0-rc.9';
import {initManualPixSettings} from './marketplace-manual-pix-settings-rc10.js?v=1.1.0-rc.10';
import {storefrontMediaFields,initStorefrontMedia} from './storefront-media-rc21.js?v=1.1.0-rc.22';

// Gestão > Loja Online. Painel rc6; estado e permissões decididos no backend.
export async function renderPage({supabase,restaurant,role,box,esc,link,embedded=false,isActive=()=>true,initialSection='pedidos',externalNavigation=false,canPay=true}){
 if(!embedded)document.body.classList.add('iv-fullwidth','iv-online-admin');
 const css='<link rel="stylesheet" href="/intervalo/online-management-rc1.css?v=1.2.0-rc.1"><style>.iv-on-order-filters{display:grid;gap:7px;margin:10px 0}.iv-on-filter-row{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:7px}.iv-on-filter-row input,.iv-on-filter-row select{width:100%;min-width:0;min-height:42px;font-size:13px;padding:8px;border:1px solid #dce3ea;border-radius:10px;background:white}.iv-on-order{padding:12px!important;overflow-wrap:anywhere}.iv-on-order[hidden]{display:none!important}.iv-on-order details{margin:8px 0;color:#536478;font-size:12px}.iv-on-order summary{cursor:pointer;font-weight:650;color:#637287}.iv-on-order-actions{flex-wrap:wrap}.iv-on-order-actions button{white-space:normal}.iv-on-order p{margin:5px 0!important}.iv-on-order-filters select{max-width:100%}</style>';
 const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n||0)/100);
 const realToCents=str=>{
  const raw=String(str).trim().replace(/\s/g,'');
  const s=raw.includes(',')?raw.replace(/\./g,'').replace(',','.'):raw;
  if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(s))throw Error('Informe um valor válido, como 20,00.');
  const [a,b='']=s.split('.');
  return Number(a)*100+Number((b+'00').slice(0,2));
 };
 const toDisplay=n=>(Number(n||0)/100).toFixed(2).replace('.',',');
 const request=async(action,fields={})=>{
  const {data,error}=await supabase.functions.invoke('marketplace-management',{body:{restaurant_id:restaurant.id,action,...fields}});
  if(error||data?.error){let message=data?.error??error?.message??'Falha no serviço';try{const body=await error?.context?.json?.();message=body?.error??message}catch{}throw Error(message)}
  return data;
 };
 let activeSection=['pedidos','entregas','vitrine','pagamentos','horarios'].includes(initialSection)?initialSection:'pedidos';
 const base=css+'<div class="iv-on-shell'+(embedded?' is-integrated':'')+'">'+(embedded?'':'<header class="iv-on-header">'
  +'<div class="iv-on-heading"><span class="iv-on-eyebrow">INTERVALO / GESTÃO / VENDAS</span>'
  +'<h1>'+icon('store',25)+' Loja Online</h1><p>'+esc(restaurant.name)+'</p></div>'
  +'<a class="iv-on-back" href="'+link('/'+restaurant.slug+'/gestao')+'">'+icon('arrowLeft',16)+' Voltar à Gestão</a></header>');
 let initialized=false;
 function pending(){
  const line=(size='')=>'<span class="iv-on-skeleton '+size+'"></span>';
  box(base+'<main class="iv-on-main iv-on-loading" role="status" aria-busy="true" aria-label="Carregando loja online">'
   +'<div class="iv-on-loading-head">'+line('iv-on-skel-title')+line('iv-on-skel-sub')+'</div>'
   +'<div class="iv-on-stats" aria-hidden="true">'+Array.from({length:3},()=>'<div class="iv-on-stat">'+line('iv-on-skel-label')+line('iv-on-skel-value')+'</div>').join('')+'</div>'
   +'<div class="iv-on-columns" aria-hidden="true"><div class="iv-on-column"><section class="iv-on-card iv-on-skel-card">'
   +line('iv-on-skel-title')+line('iv-on-skel-sub')+line('iv-on-skel-button')+'</section><section class="iv-on-card iv-on-skel-card">'
   +line('iv-on-skel-title')+line('iv-on-skel-sub')+line('iv-on-skel-button')+'</section></div>'
   +'<div class="iv-on-column"><section class="iv-on-card iv-on-skel-card">'
   +line('iv-on-skel-title')+line('iv-on-skel-sub')+line('iv-on-skel-button')+'</section></div></div></main></div>');
 }
 async function load(){
  const active=document.querySelector('.iv-on-shell');
  if(!initialized)pending();
  else if(active){active.classList.add('iv-on-refreshing');active.setAttribute('aria-busy','true')}
  let data;
  try{data=await request('get')}catch(e){
   if(!isActive())return;
   if(initialized){
    const root=document.querySelector('.iv-on-shell');
    root?.classList.remove('iv-on-refreshing');root?.removeAttribute('aria-busy');
    const notice=document.getElementById('iv-on-notice');
    if(notice){notice.textContent='Não foi possível atualizar: '+e.message;notice.hidden=false}
   }else{
    box(base+'<main class="iv-on-main"><section class="iv-on-card iv-on-error" role="alert"><h2>Não foi possível carregar a Loja Online</h2>'
     +'<p>'+esc(e.message)+'</p><a class="iv-on-button secondary" href="'+link('/'+restaurant.slug+'/vendas-online')+'">Tentar novamente</a></section></main></div>');
   }
   return;
  }
  if(!isActive())return;
  const store=data.storefront??{},online=data.online_settings??{},pub=data.publication??{};
  const visible=store.marketplace_visible===true;
  const published=pub.is_published===true&&pub.cardapio_enabled===true;
  const salesActive=online.enabled===true&&pub.accepts_customer_orders===true&&!online.paused;
  const tags=(store.cuisine_tags??[]).join(', ');
  const hours=data.business_hours??[];
  const zones=data.delivery_zones??[];
  const activeZones=zones.filter(z=>z.active).length;
  const shopLink=link('/loja/'+restaurant.slug);
  const dayNames=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const schedule=hours.map(h=>'<div class="iv-on-time-row"><select name="day">'+dayNames.map((d,i)=>'<option value="'+i+'" '+(i===h.weekday?'selected':'')+'>'+d+'</option>').join('')+'</select><input type="time" name="opens" value="'+esc(String(h.opens_at).slice(0,5))+'"><input type="time" name="closes" value="'+esc(String(h.closes_at).slice(0,5))+'"><label><input type="checkbox" name="delivery" '+(h.delivery_enabled?'checked':'')+'> Entrega</label><label><input type="checkbox" name="pickup" '+(h.pickup_enabled?'checked':'')+'> Retirada</label><button type="button" data-remove-time aria-label="Excluir faixa">×</button></div>').join('');
  const state=(ok,label)=>'<span class="iv-on-status '+(ok?'ready':'')+'">'+label+'</span>';
  const value=(label,number,description,ic)=>'<article class="iv-on-stat"><div class="iv-on-stat-top"><span>'+esc(label)+'</span><span class="iv-on-stat-symbol">'+icon(ic,18)+'</span></div><strong>'+number+'</strong><small>'+esc(description)+'</small></article>';
  let out=base+'<main class="iv-on-main">'
   +(!externalNavigation?'<div class="iv-on-intro"><div><span class="iv-on-eyebrow">OPERAÇÃO DIGITAL</span><h2>Vendas online</h2></div>'+state(salesActive,salesActive?'Recebendo pedidos':online.paused?'Loja pausada':'Pedidos desligados')+'</div>':'')
   +(embedded&&!externalNavigation?'<nav class="iv-on-integrated-nav" aria-label="Áreas das vendas online">'+[['pedidos','Pedidos','bag'],['horarios','Horários','clock'],['entregas','Entregas','bike'],['vitrine','Vitrine','store'],['pagamentos','Pagamentos','wallet']].map(([key,label,ic])=>'<button type="button" data-on-view="'+key+'" aria-pressed="'+(activeSection===key)+'">'+icon(ic,16)+label+'</button>').join('')+'</nav>':'')
   +'<p class="iv-on-notice" id="iv-on-notice" role="alert" hidden></p>'
   +'<section class="iv-on-stats" data-on-section="pedidos" aria-label="Situação da loja">'
   +value('Cardápio',published?'Publicado':'Pendente',published?'Pronto para consulta':'Publique o cardápio primeiro','receipt')
   +value('Marketplace',visible&&published?'Visível':'Oculto',visible?'Participação configurada':'Não aparece nas buscas','search')
   +value('Pedidos',salesActive?'Ativos':'Desligados',salesActive?'Recebimento habilitado':'Sem compras novas','bag')
   +'</section>'
   +'<div class="iv-on-columns"><div class="iv-on-column">'
   +'<section class="iv-on-card" data-on-section="vitrine"><div class="iv-on-card-heading"><span class="iv-on-card-icon">'+icon('store',19)+'</span>'
   +'<div><h2>Minha vitrine</h2><p>Como o cliente encontra e conhece seu restaurante.</p></div></div>'
   +'<div class="iv-on-store-cover">'+(typeof store.banner_url==='string'&&/^https:\/\/[^\s<>"']+$/i.test(store.banner_url)?'<img src="'+esc(store.banner_url)+'" alt="Capa do restaurante" loading="lazy">':'<span>Imagem de capa</span>')+'</div>'
   +'<div class="iv-on-store-preview"><div class="iv-on-store-avatar">'+(typeof store.logo_url==='string'&&/^https:\/\/[^\s<>"']+$/i.test(store.logo_url)?'<img src="'+esc(store.logo_url)+'" alt="Logo do restaurante" loading="lazy">':icon('store',24))+'</div><div><strong>'+esc(store.display_name||restaurant.name)+'</strong>'
   +'<small>'+esc(store.description||'Adicione uma descrição para a sua loja.')+'</small></div></div>'
   +'<div class="iv-on-detail"><span>Categorias</span><strong>'+esc(tags||'Não informadas')+'</strong></div>'
   +'<div class="iv-on-detail"><span>Exibição na busca</span>'+state(visible&&published,visible&&published?'Visível':'Oculta')+'</div>'
   +'<div class="iv-on-card-actions"><button type="button" id="iv-on-configure" class="iv-on-button">'+icon('settings',16)+' Configurar vitrine</button>'
   +'<button type="button" class="iv-on-button secondary" data-on-edit-media="logo">'+icon('settings',16)+' Editar logo</button>'
   +'<button type="button" class="iv-on-button secondary" data-on-edit-media="banner">'+icon('settings',16)+' Editar capa</button>'
   +'<a class="iv-on-button secondary" href="'+shopLink+'">'+icon('arrowRight',16)+' Ver loja</a></div>'
   +'<div class="iv-on-separator"></div>'
   +'<div class="iv-on-line"><div><h3>Mostrar no marketplace</h3><p>Exibir na busca não ativa o recebimento de pedidos.</p></div>'
   +'<button type="button" class="iv-on-button secondary" id="iv-online-visibility" '+(!published?'disabled':'')+'>'
   +icon(visible?'x':'checkCircle',16)+(visible?' Ocultar':' Exibir')+'</button></div>'
   +(!published?'<p class="iv-on-hint">Publique o cardápio para habilitar essa opção.</p>':'')
   +'</section>'
   +'<section class="iv-on-card" data-on-section="horarios"><div class="iv-on-card-heading"><span class="iv-on-card-icon">'+icon('clock',19)+'</span><div><h2>Horários de funcionamento</h2><p>Horários de pedidos online (entrega e retirada).</p></div></div>'
   +'<div class="iv-on-week">'+[1,2,3,4,5,6,0].map(day=>{const list=hours.filter(h=>h.weekday===day&&h.active!==false);return '<div class="iv-on-week-row"><strong>'+dayNames[day]+'</strong><span>'+(list.length?list.map(h=>esc(String(h.opens_at).slice(0,5)+' – '+String(h.closes_at).slice(0,5))+'<small>'+esc([h.delivery_enabled?'Entrega':'',h.pickup_enabled?'Retirada':''].filter(Boolean).join(' · ')||'Sem modalidade')+'</small>').join('<br>'):'<small>Fechado</small>')+'</span></div>'}).join('')+'</div>'
   +'<button type="button" id="iv-on-edit-hours" class="iv-on-button iv-on-wide">'+icon('clock',16)+' Editar horários</button></section>'
   +'<section class="iv-on-card" data-on-section="entregas"><div class="iv-on-card-heading"><span class="iv-on-card-icon">'+icon('bike',19)+'</span><div><h2>Entrega e retirada</h2><p>Modalidades e regiões atendidas.</p></div></div>'
   +'<div class="iv-on-option"><div><strong>Modalidades de atendimento</strong><p>'+esc([online.delivery_enabled?'Entrega':'',online.pickup_enabled?'Retirada':''].filter(Boolean).join(' · ')||'Nenhuma modalidade ativa')+'</p></div><button type="button" class="iv-on-button secondary" id="iv-on-edit-fulfillment">Configurar</button></div>'
   +'<div class="iv-on-option"><div><strong>Regiões de entrega</strong><p>'+activeZones+' ativa(s) de '+zones.length+' cadastrada(s)</p></div>'
   +'<button type="button" id="iv-on-new-zone" class="iv-on-button secondary">'+icon('plus',15)+' Nova região</button></div>'
   +'<div class="iv-on-zone-list">'+zones.map(z=>'<div class="iv-on-zone-row"><div><strong>'+esc(z.name)+'</strong><small>'+esc(z.city)+' / '+esc(z.state)+' · '+money(z.fee_cents)+' · '+(z.active?'Ativa':'Inativa')+'</small></div>'
      +'<button type="button" class="iv-on-text-action" data-zone-edit="'+esc(z.id)+'">Editar</button></div>').join('')+'</div>'
   +(!zones.length?'<p class="iv-on-hint">Nenhuma região cadastrada. Para entregas, adicione pelo menos uma.</p>':'')
   +'</section></div><div class="iv-on-column">'
   +'<section class="iv-on-card" data-on-section="vitrine"><div class="iv-on-card-heading"><span class="iv-on-card-icon">'+icon('receipt',19)+'</span><div><h2>Recebimento de pedidos</h2>'
   +'<p>Controle a abertura de pedidos sem afetar o atendimento presencial.</p></div></div>'
   +'<div class="iv-on-sales-state"><div><small>Estado atual</small><strong>'+(salesActive?'Recebendo pedidos':online.paused?'Pausado':'Pedidos desativados')+'</strong>'
   +'<p>Entrega própria e retirada no local, conforme configuração da vitrine.</p></div>'
   +state(salesActive,salesActive?'Ativo':'Inativo')+'</div>'
   +'<div class="iv-on-detail"><span>Entrega própria</span><strong>'+(online.delivery_enabled===false?'Desligada':'Configurada')+'</strong></div>'
   +'<div class="iv-on-detail"><span>Retirada</span><strong>'+(online.pickup_enabled===false?'Desligada':'Configurada')+'</strong></div>'
   +'<button type="button" class="iv-on-button iv-on-wide '+(salesActive?'secondary':'')+'" id="iv-on-toggle">'
   +icon(salesActive?'x':'checkCircle',16)+(salesActive?' Desativar pedidos':' Ativar recebimento')+'</button>'
   +'<p class="iv-on-hint">A ativação exige confirmação do Master e configurações válidas.</p>'
   +'</section>'
   +'<section class="iv-on-card" data-on-section="pagamentos" id="iv-on-manual-pix"></section>'
   +'<section class="iv-on-card" data-on-section="pagamentos" id="iv-on-infinitepay"></section>'
   +'<section class="iv-on-card" data-on-section="pedidos"><div class="iv-on-card-heading"><span class="iv-on-card-icon">'+icon('bag',19)+'</span>'
   +'<div><h2>Pedidos recebidos</h2><p>Acompanhe os pedidos de delivery e retirada.</p></div>'
   +'<button type="button" class="iv-on-icon-action" id="iv-on-orders-refresh" aria-label="Atualizar pedidos" title="Atualizar pedidos">'+icon('refresh',17)+'</button></div>'
   +'<div class="iv-on-order-filters"><div class="iv-on-filter-row"><input id="iv-on-search-orders" type="search" placeholder="Buscar pedido ou cliente" aria-label="Buscar pedido"><select id="iv-on-order-mode" aria-label="Modalidade"><option value="all">Todos</option><option value="delivery">Delivery</option><option value="pickup">Retirada</option></select></div><div class="iv-on-filter-row"><select id="iv-on-order-stage" aria-label="Etapa"><option value="active">Em andamento</option><option value="all">Todos os pedidos</option><option value="dispatch">Prontos / em entrega</option><option value="finished">Finalizados</option></select><select id="iv-on-order-source" aria-label="Origem"><option value="all">Todas as origens</option><option value="staff">Atendimento</option><option value="other">Loja e outros canais</option></select></div></div><div id="iv-on-orders-list" class="iv-on-orders" role="status" aria-live="polite">'
   +'<div class="iv-on-orders-loading"><span class="iv-on-skeleton iv-on-skel-title"></span><span class="iv-on-skeleton iv-on-skel-sub"></span></div></div>'
   +'</section></div></div>'
   +'<div class="iv-on-form-host" aria-hidden="true">'
   +'<form id="iv-online-draft" autocomplete="off">'
   +'<label class="iv-on-field">Nome comercial<input name="display_name" required minlength="2" maxlength="120" value="'+esc(store.display_name||restaurant.name)+'" placeholder="Nome do restaurante"></label>'
   +storefrontMediaFields(store)
   +'<label class="iv-on-field">Descrição<textarea name="description" maxlength="1000" placeholder="Conte aos clientes sobre seu restaurante">'+esc(store.description??'')+'</textarea></label>'
   +'<label class="iv-on-field">Categorias culinárias<input name="cuisine_tags" maxlength="350" placeholder="Lanches, bebidas, pizzaria" value="'+esc(tags)+'"><span class="iv-on-help">Separe por vírgula. Até 12 categorias.</span></label>'
   +'<div class="iv-on-checks"><label><input type="checkbox" name="delivery_enabled" '+(online.delivery_enabled!==false?'checked':'')+'> Entrega própria</label><label><input type="checkbox" name="pickup_enabled" '+(online.pickup_enabled!==false?'checked':'')+'> Retirada no local</label></div>'
   +'<label class="iv-on-field">Pedido mínimo (R$)<input name="minimum_order" inputmode="decimal" value="'+toDisplay(online.minimum_order_cents)+'" placeholder="0,00"></label>'
   +'<label class="iv-on-field">Preparo estimado (minutos)<input name="estimated_prep_minutes" type="number" min="5" max="240" required value="'+esc(online.estimated_prep_minutes??30)+'"></label>'
   +'<label class="iv-on-field">Instruções ao cliente<textarea name="notes" maxlength="500" placeholder="Informações de atendimento">'+esc(online.notes??'')+'</textarea></label>'
   +'<button class="iv-on-button" type="submit">'+icon('checkCircle',16)+' Salvar configurações</button></form>'
   +'<form id="iv-on-hours"><div id="iv-on-hour-list">'+schedule+'</div><button type="button" class="iv-on-button secondary" id="iv-on-add-hour">'+icon('plus',15)+' Faixa de horário</button>'
   +'<button class="iv-on-button" type="submit">Salvar horários</button></form>'
   +'<form id="iv-on-zone-form">'
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
   +'<button class="iv-on-button" type="submit">Salvar região</button></form>'
   +'</div></main></div>';
  box(out);
  if(!isActive())return;
  if(embedded){
   const root=document.querySelector('.iv-on-shell.is-integrated');
   const showSection=()=>{
    root?.querySelectorAll('[data-on-section]').forEach(el=>{el.hidden=el.dataset.onSection!==activeSection});
    root?.querySelectorAll('[data-on-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.onView===activeSection)));
   };
   root?.querySelectorAll('[data-on-view]').forEach(b=>b.onclick=()=>{
    activeSection=b.dataset.onView;
    showSection();
    const url=new URL(location.href);
    url.searchParams.set('tab','vendas');
    url.searchParams.set('area',activeSection);
    history.replaceState(history.state,'',url.pathname+url.search+url.hash);
   });
   showSection();
  }
  initialized=true;
  if(!externalNavigation||activeSection==='pagamentos'){
   void initInfinitePaySettings({supabase,restaurant,role,esc});
   void initManualPixSettings({supabase,restaurant,role,esc});
  }
  const form=document.getElementById('iv-online-draft');
  const mediaController=initStorefrontMedia({form,supabase,restaurant});
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
    const media=await mediaController.resolve();
    await request('save_draft',{
     ...media,
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
  const [draftSheet]=sheetifyForms([{id:'iv-online-draft',label:'Configurar loja',title:'Dados da loja online',description:'Edite nome, categorias, preparo e modalidades de atendimento.'}]);
  if(draftSheet){
   draftSheet.trigger.hidden=true;draftSheet.trigger.style.display='none';
   const openDraft=()=>{if(!draftSheet.dialog.open)draftSheet.trigger.click()};
   document.getElementById('iv-on-configure').onclick=openDraft;
   document.getElementById('iv-on-edit-fulfillment').onclick=()=>{openDraft();draftSheet.dialog.querySelector('[name="delivery_enabled"]')?.closest('.iv-on-checks')?.scrollIntoView({block:'start'})};
   document.querySelectorAll('[data-on-edit-media]').forEach(button=>button.onclick=()=>{
    openDraft();
    const target=draftSheet.dialog.querySelector('[data-store-media="'+button.dataset.onEditMedia+'"]');
    target?.scrollIntoView({behavior:'instant',block:'center'});
    target?.querySelector('[data-media-pick]')?.focus({preventScroll:true});
   });
  }else{
   const failed=()=>alert('Não foi possível abrir a edição da vitrine. Atualize a página e tente novamente.');
   document.getElementById('iv-on-configure').onclick=failed;
   document.getElementById('iv-on-edit-fulfillment').onclick=failed;
   document.querySelectorAll('[data-on-edit-media]').forEach(b=>b.onclick=failed);
  }
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
  const [hoursSheet]=sheetifyForms([{id:'iv-on-hours',label:'Configurar horários',title:'Horários dos pedidos'}]);
  if(hoursSheet){hoursSheet.trigger.hidden=true;hoursSheet.trigger.style.display='none';document.getElementById('iv-on-edit-hours').onclick=()=>hoursSheet.trigger.click()};
  const zoneForm=document.getElementById('iv-on-zone-form');
  let editingZone=null;
  const fillZone=zone=>{
   editingZone=zone?.id??null;
   ['name','city','state','postal_code_from','postal_code_to'].forEach(k=>{
    zoneForm.elements.namedItem(k).value=zone?.[k]??'';
   });
   zoneForm.elements.namedItem('neighborhoods').value=(zone?.neighborhoods??[]).join(', ');
   zoneForm.elements.namedItem('fee').value=toDisplay(zone?.fee_cents);
   zoneForm.elements.namedItem('minimum').value=toDisplay(zone?.minimum_order_cents);
   zoneForm.elements.namedItem('eta').value=zone?.estimated_delivery_minutes??40;
   zoneForm.elements.namedItem('active').checked=zone?.active??true;
  };
  zoneForm.onsubmit=async e=>{
   e.preventDefault();const button=zoneForm.querySelector('[type="submit"]');if(button.disabled)return;
   const v=Object.fromEntries(new FormData(zoneForm).entries());
   button.disabled=true;button.textContent='Salvando...';
   try{
    await request('zone_save',{
     id:editingZone,name:v.name,city:v.city,state:String(v.state??'').toUpperCase(),
     neighborhoods:String(v.neighborhoods??'').split(',').map(x=>x.trim()).filter(Boolean),
     postal_code_from:String(v.postal_code_from??'').replace(/\D/g,''),
     postal_code_to:String(v.postal_code_to??'').replace(/\D/g,''),
     fee_cents:realToCents(v.fee),minimum_order_cents:realToCents(v.minimum),
     estimated_delivery_minutes:Number(v.eta),active:zoneForm.elements.namedItem('active').checked
    });
    await load();
   }catch(e){if(!showFormSheetError(zoneForm,e.message))alert(e.message);button.disabled=false;button.textContent='Salvar região'}
  };
  const [zoneSheet]=sheetifyForms([{id:'iv-on-zone-form',label:'Editar região',title:'Região de entrega',description:'Defina bairros, CEPs e frete.'}]);
  if(zoneSheet){
   zoneSheet.trigger.hidden=true;zoneSheet.trigger.style.display='none';
   document.getElementById('iv-on-new-zone').onclick=()=>{fillZone(null);zoneSheet.trigger.click()};
   document.querySelectorAll('[data-zone-edit]').forEach(btn=>btn.onclick=()=>{
    const zone=(data.delivery_zones??[]).find(z=>z.id===btn.dataset.zoneEdit);
    if(zone){fillZone(zone);zoneSheet.trigger.click()}
   });
  }
  const toggle=document.getElementById('iv-on-toggle');
  if(toggle){
   if(role!=='master'){toggle.disabled=true;toggle.title='Somente o Master pode ativar pedidos'}
   else toggle.onclick=async()=>{
    const enabled=!salesActive;
    if(!confirm(enabled?'Ativar o recebimento de pedidos REAIS?':'Desativar novos pedidos?'))return;
    const confirmation=enabled?(prompt('Digite HABILITAR PEDIDOS para confirmar')??''):'';
    if(enabled&&confirmation!=='HABILITAR PEDIDOS')return;
    toggle.disabled=true;
    try{await request('set_sales_active',{enabled,confirmation});await load()}
    catch(e){alert(e.message);toggle.disabled=false}
   };
  }
  const ordersArea=document.getElementById('iv-on-orders-list');
  const ops=async(action,extra={})=>{
   const {data,error}=await supabase.functions.invoke('marketplace-operations',{body:{restaurant_id:restaurant.id,action,...extra}});
   if(error||data?.error)throw Error(data?.error??error?.message??'Falha ao consultar pedidos');
   return data;
  };
  const statuses={pending_acceptance:'Aguardando aceite',accepted:'Aceito',preparing:'Em preparo',ready:'Pronto',ready_for_pickup:'Pronto para retirada',out_for_delivery:'Saiu para entrega',delivered:'Entregue',picked_up:'Retirado',rejected:'Recusado',cancelled:'Cancelado',expired:'Expirado'};
  const availableActions=o=>o.status==='pending_acceptance'?(o.payment_method==='manual_pix'?['rejected']:['accepted','rejected']):o.status==='accepted'?['preparing','cancelled']:o.status==='preparing'?[o.fulfillment_type==='pickup'?'ready_for_pickup':'ready']:o.status==='ready'?['out_for_delivery']:o.status==='out_for_delivery'?['delivered']:o.status==='ready_for_pickup'?['picked_up']:[];
  let orderBusy=false,orderSignature='',orderChanging=false;
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const filters=()=>{const search=norm(document.getElementById('iv-on-search-orders')?.value),mode=document.getElementById('iv-on-order-mode')?.value??'all',stage=document.getElementById('iv-on-order-stage')?.value??'active',source=document.getElementById('iv-on-order-source')?.value??'all';let visible=0;ordersArea.querySelectorAll('[data-on-filter]').forEach(row=>{const terminal=['delivered','picked_up','cancelled','rejected','expired'].includes(row.dataset.stage),dispatch=['ready','ready_for_pickup','out_for_delivery'].includes(row.dataset.stage);row.hidden=!(row.dataset.onFilter.includes(search)&&(mode==='all'||row.dataset.mode===mode)&&(stage==='all'||stage==='active'&&!terminal||stage==='finished'&&terminal||stage==='dispatch'&&dispatch)&&(source==='all'||(source==='staff')===(row.dataset.source==='staff')));if(!row.hidden)visible++});const empty=ordersArea.querySelector('[data-on-filter-empty]');if(empty)empty.hidden=visible!==0};
  for(const id of ['iv-on-search-orders','iv-on-order-mode','iv-on-order-stage','iv-on-order-source'])document.getElementById(id)?.addEventListener('input',filters);
  async function refreshOrders(silent=false){
   if(!ordersArea?.isConnected||orderBusy||silent&&(orderChanging||document.querySelector('dialog[open]')||ordersArea.querySelector('details[open]')))return;
   orderBusy=true;
   const refreshButton=document.getElementById('iv-on-orders-refresh');
   if(refreshButton){refreshButton.disabled=true;refreshButton.setAttribute('aria-busy','true')}
   try{
    const result=await ops('list'),orders=result.orders??[],items=result.items??[];
    const signature=JSON.stringify(result);if(silent&&signature===orderSignature)return;orderSignature=signature;
    const charges=new Map((result.manual_pix_charges??[]).map(x=>[x.order_id,x]));
    let html='';
    for(const o of orders){
     const rows=items.filter(i=>i.order_id===o.id);
     html+='<div class="iv-on-order" data-on-filter="'+esc(norm([o.public_code,o.customer_name,o.customer_phone,statuses[o.status]].join(' ')))+'" data-mode="'+esc(o.fulfillment_type)+'" data-stage="'+esc(o.status)+'" data-source="'+(String(o.source).includes('staff')?'staff':'other')+'"><div class="iv-on-row"><strong>'+esc(o.public_code)+'</strong><span class="iv-on-status">'+esc(statuses[o.status]??o.status)+'</span></div>';
     html+='<p>'+esc(o.customer_name)+' · '+(o.fulfillment_type==='delivery'?'Delivery':'Retirada')+' · '+(String(o.source).includes('staff')?'Atendimento':'Loja / outro canal')+'</p>';
     const address=o.delivery_address,addr=typeof address==='string'?address:address&&typeof address==='object'?[address.street??address.address,address.number??address.address_number,address.complement,address.neighborhood,address.city,address.state,address.reference].filter(v=>typeof v==='string'||typeof v==='number').join(', '):'';
     const fmt=v=>{try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v))}catch{return '—'}};
     html+='<details><summary>Itens e acompanhamento · '+rows.length+'</summary><p>Telefone: '+esc(o.customer_phone??'—')+'</p>'+(addr?'<p>Endereço: '+esc(addr)+'</p>':'')+(o.customer_note?'<p>Obs.: '+esc(o.customer_note)+'</p>':'')+rows.map(i=>'<p>'+esc(i.quantity)+'× '+esc(i.product_name)+(i.note?' · '+esc(i.note):'')+'</p>').join('')+[['Recebido',o.created_at],['Aceito',o.accepted_at],['Pronto',o.prepared_at],['Saiu para entrega',o.dispatched_at],['Finalizado',o.fulfilled_at]].filter(([,v])=>v).map(([label,v])=>'<p>'+label+': '+esc(fmt(v))+'</p>').join('')+'</details>';
     const manualCharge=charges.get(o.id);
     html+='<div class="iv-on-row"><strong>'+money(o.total_cents)+'</strong><span>'+(o.payment_status==='paid'?'Pago':o.payment_method==='manual_pix'?(manualCharge?.reported_at?'Pix informado · conferir no banco':'Aguardando Pix · 10 min'):'Pagamento pendente')+'</span></div>';
     html+='<div class="iv-on-order-actions">';
     if(o.payment_method==='manual_pix'&&o.status==='pending_acceptance'){
      if(manualCharge?.reported_at)html+='<button type="button" class="iv-on-button" data-manual-pix-accept="'+esc(o.id)+'" data-amount="'+esc(money(o.total_cents))+'">Conferi o Pix · aceitar pedido</button>';
      else html+='<span class="iv-on-hint">Aguardando cliente informar pagamento (limite 10 minutos)</span>';
     }
     html+=availableActions(o).map(state=>'<button type="button" class="iv-on-button" data-order-id="'+esc(o.id)+'" data-status="'+state+'">'+esc(statuses[state]??state)+'</button>').join('');
     if(canPay&&o.payment_status==='unpaid'&&!['rejected','cancelled','expired','pending_acceptance'].includes(o.status))
      html+='<button type="button" class="iv-on-button secondary" data-online-pay="'+esc(o.id)+'">Registrar recebimento</button>';
     html+='</div></div>';
    }
    ordersArea.innerHTML=html?html+'<div class="iv-on-empty" data-on-filter-empty hidden>Nenhum pedido neste filtro.</div>':'<div class="iv-on-empty">'+icon('bag',24)+'<strong>Nenhum pedido por enquanto</strong><p>Os novos pedidos aparecerão aqui quando a loja começar a receber.</p></div>';filters();
    ordersArea.querySelectorAll('[data-status]').forEach(b=>b.onclick=async()=>{
     if(['rejected','cancelled','delivered','picked_up'].includes(b.dataset.status)&&!confirm('Confirma esta alteração?'))return;
     if(orderChanging)return;orderChanging=true;b.disabled=true;
     try{await ops('transition',{order_id:b.dataset.orderId,target:b.dataset.status});await refreshOrders()}
     catch(e){alert(e.message);b.disabled=false}finally{orderChanging=false}
    });
    ordersArea.querySelectorAll('[data-manual-pix-accept]').forEach(b=>b.onclick=async()=>{
     if(!confirm('Você conferiu no EXTRATO da conta que recebeu exatamente '+b.dataset.amount+'? O comprovante ou botão Já paguei não bastam. Ao confirmar, o pedido será ACEITO.'))return;
     if(orderChanging)return;orderChanging=true;b.disabled=true;
     try{await ops('accept_manual_pix',{order_id:b.dataset.manualPixAccept});await refreshOrders()}
     catch(e){alert(e.message);b.disabled=false}finally{orderChanging=false}
    });
    ordersArea.querySelectorAll('[data-online-pay]').forEach(b=>b.onclick=()=>{
     if(orderChanging||document.getElementById('iv-online-confirm-pay'))return;
     const host=document.createElement('div');ordersArea.append(host);host.innerHTML='<form id="iv-online-confirm-pay"><label>Forma de pagamento<select name="method" required><option value="pix">Pix</option><option value="cash">Dinheiro</option><option value="card">Cartão</option></select></label><p class="iv-on-hint">Confirme apenas o recebimento efetivamente realizado.</p><button type="submit">Registrar recebimento</button></form>';
     const form=host.querySelector('form'),entry=sheetifyForms([{id:form.id,label:'Registrar recebimento',title:'Pagamento',description:'Escolha a forma de recebimento.',fixedAction:true}])[0];if(!entry){host.remove();return}
     entry.trigger.hidden=true;const submit=entry.dialog.querySelector('[type=submit]');
     entry.dialog.addEventListener('close',()=>{entry.dispose();host.remove()},{once:true});
     form.onsubmit=async e=>{e.preventDefault();if(orderChanging)return;if(!confirm('Confirma que recebeu este pagamento?'))return;orderChanging=true;submit.disabled=true;
      try{await ops('pay',{order_id:b.dataset.onlinePay,method:new FormData(form).get('method')});submit.disabled=false;entry.close();await refreshOrders()}
      catch(err){showFormSheetError(form,err.message);submit.disabled=false}finally{orderChanging=false}
     };entry.trigger.click();
    });
   }catch(e){ordersArea.textContent='Não foi possível consultar os pedidos: '+e.message}
   finally{orderBusy=false;if(refreshButton){refreshButton.disabled=false;refreshButton.removeAttribute('aria-busy')}}
  }
  document.getElementById('iv-on-orders-refresh').onclick=()=>refreshOrders(false);
  if(!externalNavigation||activeSection==='pedidos')refreshOrders();
  const orderPoll=setInterval(()=>{
   if(!ordersArea.isConnected){clearInterval(orderPoll);return}
   if(document.visibilityState==='visible'&&(!externalNavigation||activeSection==='pedidos'))void refreshOrders(true);
  },15000);
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
