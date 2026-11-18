// Intervalo 0.7.0 — Gestao de restaurante e equipe; apenas UI, servidor decide permissões.
import {icon} from './ui-icons.js?v=1.0.0-rc.1';
import {sheetifyForms,showFormSheetError} from './operational-sheets-rc15.js?v=1.2.0-rc.14';
import {sidebarMarkup} from './global-navigation-rc7.js?v=1.2.0-rc.7';
export async function renderManagement({supabase,restaurant,role,box,esc,link,navContext}) {
 const modules=["gestao","garcom","cozinha","caixa","cardapio"];
 const labels={gestao:"Gestão",garcom:"Garçom",cozinha:"Cozinha",caixa:"Caixa",cardapio:"Cardápio"};
 const roles={master:"Master",manager:"Gerente",waiter:"Garçom",kitchen:"Cozinha",cashier:"Caixa"};
 const defaults={master:modules,manager:modules,waiter:["garcom","cardapio"],kitchen:["cozinha","cardapio"],cashier:["caixa","cardapio"]};
 document.body.classList.add("iv-fullwidth","iv-master","iv-management-v2");
 const params=new URLSearchParams(location.search);
 const onlineAreas=['pedidos','vitrine','horarios','entregas','pagamentos'];
 const allowedTabs=['visao','vendas','dados','equipe','acessos','produtos','estoque'];
 const requested=params.get('tab');
 let state={tab:allowedTabs.includes(requested)&&(requested!=='acessos'||role==='master')?requested:'visao',area:onlineAreas.includes(params.get('area'))?params.get('area'):'pedidos',data:null,overview:null};
 const onlineTitles={pedidos:'Pedidos',vitrine:'Loja online',horarios:'Horários de funcionamento',entregas:'Entrega e retirada',pagamentos:'Formas de pagamento'};
 const sty='<link rel="stylesheet" href="/intervalo/management-design-rc11.css?v=1.2.0-rc.14"><style>.mtabs{display:flex;gap:8px;overflow:auto;margin:23px 0}.mtabs button{border:1px solid #dbe2e8;background:white;padding:11px 16px;border-radius:10px;font-size:13px;font-weight:700;color:#334155;white-space:nowrap}.mtabs button.selected{color:white;background:#0f766e;border-color:#0f766e}.mg{display:grid;grid-template-columns:1fr 1fr;gap:14px}.mg .full{grid-column:1/-1}.mg label{display:block;font-size:12px;font-weight:700;color:#475569;margin-bottom:7px}.mg input,.mg select{padding:11px;width:100%;border:1px solid #cbd5e1;border-radius:9px;background:white;color:#0f172a}.mg input:focus,.mg select:focus{outline:2px solid #99f6e4}.team-card{background:#fff;border:1px solid #dce4ec;border-radius:13px;padding:17px;margin:12px 0}.team-top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center}.team-actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:13px}.team-actions select{border-radius:8px;padding:9px;border:1px solid #cbd5e1}.smallbtn{border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:8px;padding:9px 12px;font-weight:700;font-size:12px}.smallbtn.danger{color:#b91c1c;border-color:#fecaca}.status{font-size:11px;border-radius:50px;background:#f1f5f9;padding:6px 10px;font-weight:750;color:#475569}.pgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:10px}.pitem{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:13px}.pitem strong{display:block;margin:0 0 8px}.pitem span{font-size:12px;color:#64748b}.pitem button{margin-top:9px}.onboarding-note{font-size:13px;padding:12px;background:#ecfdf5;border:1px solid #ccfbf1;border-radius:10px;color:#115e59}.muted-sm{font-size:12px;color:#64748b;line-height:1.6}@media(max-width:650px){.mg{grid-template-columns:1fr}.mg .full{grid-column:auto}.team-actions{align-items:stretch}}</style>';
 function renderLoading(){
  const line=(size="")=>'<span class="mg-v2-skel mg-v2-skel-line '+size+'"></span>';
  const kp=Array.from({length:4},()=>'<div class="mg-v2-skel-card">'+line("long")+'<span class="mg-v2-skel mg-v2-skel-num"></span>'+line("tiny")+'</div>').join("");
  const mod=Array.from({length:8},()=>'<div class="mg-v2-skel-module"><span class="mg-v2-skel"></span>'+line("short")+'</div>').join("");
  const sideLinks=Array.from({length:7},()=>'<div class="mg-v2-skel mg-v2-skel-nav"></div>').join("");
  box(sty+'<div class="mg-v2-shell mg-v2-loading" id="mg-v2-root" role="status" aria-busy="true" aria-label="Carregando gestão do restaurante">'
   +'<aside class="mg-v2-side" aria-hidden="true"><span class="mg-v2-skel mg-v2-skel-brand"></span><div class="mg-v2-restaurant">'+icon("store",18)+'<span>'+esc(restaurant.name)+'</span></div>'+sideLinks+'</aside>'
   +'<div class="mg-v2-workspace"><header class="mg-v2-topbar"><div class="mg-v2-top-left">'+icon("store",17)+'<strong style="font-size:12px;color:#657487">Intervalo / Gestão</strong></div><span class="mg-v2-skel mg-v2-skel-line short" style="max-width:116px"></span></header>'
   +'<main class="mg-v2-main"><div class="mg-v2-overline">GESTÃO DO RESTAURANTE</div><div class="mg-v2-skel mg-v2-skel-hero"></div>'+line("long")
   +'<div class="mg-v2-loading-note"><span class="mg-v2-loading-dot"></span>Preparando sua visão geral...</div>'
   +'<div class="mg-v2-kpis mg-v2-skel-kpis" aria-hidden="true">'+kp+'</div>'
   +'<div class="mg-v2-section-head"><h2>Acessar módulos</h2></div><div class="mg-v2-modules mg-v2-skel-modules" aria-hidden="true">'+mod+'</div>'
   +'<div class="mg-v2-dual" aria-hidden="true"><div class="mg-v2-skel-panel">'+line("short")+line("long")+line("long")+'</div><div class="mg-v2-skel-panel">'+line("short")+line("long")+line("long")+'</div></div></main>'
   +'</div></div>');
 }
 function showTemporaryPassword(temp,email){
  const dlg=document.createElement('dialog');
  dlg.style.cssText='border:1px solid #cbd5e1;border-radius:14px;padding:23px;max-width:460px;width:calc(100% - 30px)';
  const heading=document.createElement('h2');heading.textContent='Funcionário cadastrado';
  const info=document.createElement('p');info.className='muted-sm';info.textContent='Conta '+email+'. Entregue esta senha provisória pessoalmente ou por canal privado. Ela não ficará disponível após fechar.';
  const value=document.createElement('input');value.readOnly=true;value.value=temp;value.style.cssText='padding:12px;width:100%;border:1px solid #cbd5e1;border-radius:8px';
  const copy=document.createElement('button');copy.className='smallbtn';copy.type='button';copy.textContent='Copiar senha';
  copy.onclick=async()=>{try{await navigator.clipboard.writeText(value.value);copy.textContent='Senha copiada'}catch{value.select();copy.textContent='Selecione e copie'}};
  const close=document.createElement('button');close.className='smallbtn';close.type='button';close.style.marginLeft='8px';close.textContent='Fechar';close.onclick=()=>dlg.close();
  dlg.onclose=()=>{value.value='';dlg.remove()};
  dlg.append(heading,info,value,copy,close);document.body.append(dlg);dlg.showModal();
 }
 function message(text,type="success"){const el=document.getElementById("mg-message");if(el){el.className=type==="error"?"error":"notice";el.textContent=text;el.scrollIntoView({block:"nearest"});}}
 async function call(action,values={}){
   const {data,error}=await supabase.functions.invoke("restaurant-team",{body:{restaurant_id:restaurant.id,action,...values}});
   if(error){let reason=error.message??"Erro ao comunicar com o servidor";try{const v=await error.context?.json?.();reason=v?.error??reason;}catch{}throw Error(reason)}
   if(data?.error)throw Error(data.error);
   return data;
 }
 async function refresh(){
  const existing=document.getElementById("mg-v2-root");
  existing?.classList?.add("is-refreshing");
  existing?.setAttribute?.("aria-busy","true");
  try{
   state.data=await call("list");
   if(state.tab==="visao"){
    const fetchCore=async action=>{
     try{const {data,error}=await supabase.functions.invoke("restaurant-core",{body:{restaurant_id:restaurant.id,action}});return error||data?.error?null:data}catch{return null}
    };
    const fetchOnline=async()=>{try{
     const {data,error}=await supabase.functions.invoke('marketplace-operations',{body:{restaurant_id:restaurant.id,action:'overview'}});
     return error||data?.error?null:data;
    }catch{return null}};
    const [orders,stock,online]=await Promise.all([fetchCore("orders"),fetchCore("stock_list"),fetchOnline()]);
    state.overview={orders,stock,online};
   }
   draw();
  }finally{
   const active=document.getElementById("mg-v2-root");
   active?.classList?.remove("is-refreshing");
   active?.setAttribute?.("aria-busy","false");
  }
 }
 const value=(x)=>esc(x??"");
 const input=(label,name,val,more="")=>'<div><label for="m-'+name+'">'+label+'</label><input id="m-'+name+'" name="'+name+'" value="'+value(val)+'" '+more+'></div>';
 function draw(){
   const d=state.data;if(!d)return;
   const s=d.settings??{},isMaster=d.actor_role==="master",isManager=d.actor_role==="manager";
   const note=s.onboarding_completed_at?"Cadastro inicial concluído. Você pode atualizar os dados abaixo.":"Preencha telefone, cidade e UF para concluir o cadastro inicial do restaurante.";
   const tabs=[["visao","Visão geral"],["vendas","Vendas online"],["dados","Dados do restaurante"],["equipe","Equipe"],["acessos","Permissões"]];
   const quickModules=[["garcom","Garçom","garcom"],["cozinha","Cozinha","cozinha"],["caixa","Caixa","caixa"],["catalogo","Cardápio","gestao"],["mesas","Mesas","gestao"],["estoque","Estoque","gestao"],["relatorios","Relatórios","gestao"],["impressao","Impressão","gestao"]];
   const accessible=quickModules.filter(([path,label,required])=>navContext.can(required));
   const modIcons={catalogo:"receipt",mesas:"table",garcom:"utensils",cozinha:"chef",caixa:"register",estoque:"package",impressao:"printer",relatorios:"chart"};
   const moduleLinks=accessible.map(([path,label])=>'<a class="mg-v2-module" href="'+link("/"+d.restaurant.slug+"/"+path)+'"><span class="mg-v2-module-icon">'+icon(modIcons[path]??"layers",20)+'</span>'+esc(label)+'</a>').join("");
   const storeName=String(d.restaurant.name||d.restaurant.slug).replace(/(^|[-\s])\p{L}/gu,x=>x.replace('-',' ').toLocaleUpperCase('pt-BR'));
   const pageTitle=state.tab==='vendas'?onlineTitles[state.area]:({visao:"Visão geral",dados:"Dados do restaurante",equipe:"Equipe do restaurante",acessos:"Permissões da equipe",produtos:"Produtos",estoque:"Estoque"}[state.tab]??"Gestão");
   const topTitle=state.tab==="visao"?"Visão geral":pageTitle;
   const topSubtitle=state.tab==="visao"?"Acompanhe a operação do restaurante.":state.tab==="vendas"?({pedidos:'Acompanhe os pedidos e o atendimento.',vitrine:'Gerencie a presença digital do restaurante.',horarios:'Defina os horários de recebimento online.',entregas:'Configure modalidades, regiões e taxas.',pagamentos:'Configure os meios de recebimento.'}[state.area]):state.tab==="produtos"?"Organize o que seu restaurante vende.":state.tab==="estoque"?"Controle insumos, fichas técnicas e movimentações.":state.tab==="dados"?"Informações do estabelecimento.":"Gerencie esta área.";
   const roleText=roles[d.actor_role]??d.actor_role;
   const mainLink=link("/inicio");
   const quickLinks='<section class="mg-v2-section"><div class="mg-v2-section-head"><h2>Operação</h2></div><div class="mg-v2-modules">'+accessible.filter(([p])=>['garcom','cozinha','caixa','mesas'].includes(p)).map(([p,label])=>'<a class="mg-v2-module" href="'+link('/'+d.restaurant.slug+'/'+p)+'"><span class="mg-v2-module-icon">'+icon(modIcons[p],20)+'</span>'+esc(label)+'</a>').join('')+'</div></section>';
   const bottom='';
   const viewHead=sty+'<div class="mg-v2-shell" id="mg-v2-root">'
     +'<button type="button" class="mg-v2-side-overlay" data-mg-close-nav aria-label="Fechar menu"></button>'
     +'<aside class="mg-v2-side" aria-label="Menu do restaurante">'+sidebarMarkup(navContext,{active:state.tab==='vendas'?state.area:state.tab,local:true})+'</aside>'
     +'<div class="mg-v2-workspace"><header class="mg-v2-topbar">'
     +'<div class="mg-v2-top-left"><button type="button" class="mg-v2-iconbtn mg-v2-menuopen" data-mg-open-nav aria-label="Abrir menu">'+icon("menu",19)+'</button>'
     +'<div class="mg-v2-crumb">Intervalo / <b>'+value(pageTitle)+'</b></div></div>'
     +'<div class="mg-v2-top-right"><button type="button" class="mg-v2-top-store" data-tab="dados">'+icon("store",16)+'<span>'+value(storeName)+'</span></button>'
     +'<span class="mg-v2-avatar" aria-label="'+value(roleText)+'">'+value((d.restaurant.name??"R").slice(0,2).toUpperCase())+'</span></div></header>'
     +'<main class="mg-v2-main"><div class="mg-v2-hero"><div><span class="mg-v2-overline">GESTÃO DO RESTAURANTE</span><h1>'+value(topTitle)+'</h1><p>'+value(topSubtitle)+'</p></div>'
     +(state.tab==="visao"?'<button type="button" class="mg-v2-primary" data-mg-sheet="quick">'+icon("plus",16)+' Ações</button>':"")+'</div>'
     +'<div id="mg-message" role="status" aria-live="polite"></div><div class="mg-v2-content" data-mg-current-tab="'+state.tab+'">';
   let inner="";
   if(state.tab==="visao"){
    const all=state.overview?.orders?.orders??[],active=all.filter(o=>!["closed","cancelled"].includes(o.status));
    const activeTables=new Set(active.map(o=>o.table_id).filter(Boolean)).size;
    const stock=state.overview?.stock?.items,low=Array.isArray(stock)?stock.filter(i=>i.active&&Number(i.quantity)<=Number(i.min_quantity)):[];
    const team=(d.members??[]).filter(m=>m.status==="active").length;
    const orderData=state.overview?.orders,online=state.overview?.online,activeIds=new Set(active.map(x=>x.id));
    const readyOrders=new Set((orderData?.rounds??[]).filter(r=>r.status==='ready'&&activeIds.has(r.order_id)).map(r=>r.order_id));
    const queue=active.filter(o=>o.status==='served').length;
    const cards=[
     ["clipboard","Pedidos presenciais",orderData?active.length:"—","Em andamento"],
     ["table","Mesas em uso",orderData?activeTables:"—","Em atendimento"],
     ["checkCircle","Prontos para servir",orderData?readyOrders.size:"—","Pedidos com rodada pronta"],
     ["wallet","A receber",orderData?queue:"—","Pedidos servidos"],
     ["bag","Pedidos externos",online?Number(online.pending??0)+Number(online.preparing??0):"—","Aguardando ou em andamento"],
     ["alert","Estoque em alerta",Array.isArray(stock)?low.length:"—","Insumos no mínimo"],
     ["users","Equipe ativa",team,"Vínculos habilitados"]
    ];
    const kpiColors=["orange","","green","orange","","red","green"];
    inner='<div class="mg-v2-kpis">'+cards.map(([ic,label,number,detail],i)=>'<article class="mg-v2-kpi"><div class="mg-v2-kpi-top"><div class="mg-v2-kpi-label">'+esc(label)+'</div><span class="mg-v2-kpi-icon '+kpiColors[i]+'">'+icon(ic,19)+'</span></div><div class="mg-v2-kpi-val">'+value(number)+'</div><div class="mg-v2-kpi-note">'+esc(detail)+'</div></article>').join('')+'</div>'
      +'<section class="mg-v2-sales-entry"><span class="mg-v2-sales-icon">'+icon("bag",22)+'</span>'
      +'<div class="mg-v2-sales-copy"><strong>Vendas online</strong><small>'+(
       state.overview?.online?
        esc(String(state.overview.online.pending??0)+' aguardando aceite · '+String(state.overview.online.preparing??0)+' em andamento')
        :'Pedidos de delivery e retirada no mesmo painel')+'</small></div>'
      +'<button type="button" data-tab="vendas" data-area="pedidos">Abrir pedidos '+icon("chevronRight",15)+'</button></section>'
      +quickLinks
      +'<div class="mg-v2-dual"><section class="mg-v2-panel"><h3>Fluxo de atendimento</h3><p>Do lançamento do pedido ao recebimento no caixa.</p>'
      +'<div class="mg-v2-process"><span>Garçom</span>'+icon("chevronRight",14)+'<span>Cozinha</span>'+icon("chevronRight",14)+'<span>Caixa</span></div>'
      +'<p>'+(state.overview?.orders?active.length+' comanda(s) em andamento nesta consulta.':'Pedidos indisponíveis nesta consulta.')+'</p>'
      +(active.length?active.slice(0,3).map(o=>'<div class="mg-v2-alert-row">'+icon("receipt",17)+'<div><strong>Comanda #'+value(String(o.id).replace(/-/g,"").slice(-5).toUpperCase())+'</strong><small>Status: '+value(({open:'Em atendimento',submitted:'Enviado',preparing:'Em preparo',ready:'Pronto',served:'A receber'})[o.status]??o.status)+'</small></div></div>').join(''):"")
      +(accessible.some(([path])=>path==="mesas")?'<a class="mg-v2-panel-link" href="'+link("/"+d.restaurant.slug+"/mesas")+'">Visualizar mesas '+icon("arrowRight",13)+'</a>':"")
      +'</section><section class="mg-v2-panel"><h3>Estoque e alertas</h3><p>Acompanhe os itens que precisam de reposição.</p>'
      +(Array.isArray(stock)?low.length?low.slice(0,5).map(i=>'<div class="mg-v2-alert-row">'+icon("alert",17)+'<div><strong>'+value(i.name)+'</strong><small>Saldo: '+value(i.quantity)+' '+value(i.unit)+' · mínimo: '+value(i.min_quantity)+'</small></div></div>').join(''):'<div class="mg-v2-alert-row">'+icon("checkCircle",17)+'<div><strong>Nenhum alerta no momento</strong><small>Consulta de estoque concluída.</small></div></div>':'<div class="mg-v2-alert-row">'+icon("info",17)+'<div><strong>Consulta indisponível</strong><small>Atualize a página para tentar novamente.</small></div></div>')
      +(accessible.some(([path])=>path==="estoque")?'<a class="mg-v2-panel-link" href="'+link("/"+d.restaurant.slug+"/estoque")+'">Ver estoque '+icon("arrowRight",13)+'</a>':"")
      +'</section></div>';
   }else if(state.tab==="produtos"||state.tab==="estoque"){
    const entries=state.tab==='produtos'?[
     ['estoque?aba=produtos','Produtos e variações','Preço, fotos, disponibilidade e cadastro','package'],
     ['catalogo?aba=categorias','Categorias','Organize os grupos do cardápio','layers'],
     ['catalogo?aba=adicionais','Adicionais','Opções e preços adicionais','plus']
    ]:[['estoque?aba=insumos','Insumos','Ingredientes e materiais','package'],['estoque?aba=fichas','Fichas técnicas','Ingredientes por produto','clipboard'],['estoque?aba=historico','Movimentações','Entradas, perdas e ajustes','clock']];
    inner='<section class="mg-v2-panel mg-v2-hub">'+entries.map(([path,title,note,ic])=>'<a class="mg-v2-hub-row" href="'+link('/'+d.restaurant.slug+'/'+path)+'"><span class="mg-v2-module-icon">'+icon(ic,20)+'</span><span><strong>'+esc(title)+'</strong><small>'+esc(note)+'</small></span>'+icon('chevronRight',17)+'</a>').join('')+'</section>';
   }else if(state.tab==="vendas"){
    inner='<section class="mg-v2-online-host" id="mg-v2-online-host" aria-label="Vendas online">'
      +'<div class="iv-loading-inline" role="status" aria-label="Carregando pedidos e configurações" aria-busy="true"><div class="iv-loading-inline-lines" aria-hidden="true"><span class="iv-load-skeleton"></span><span class="iv-load-skeleton"></span></div></div></section>';
   }else if(state.tab==="dados"){
     inner='<section class="panel"><h2>Informações do estabelecimento</h2><p class="onboarding-note">'+note+'</p><form id="restaurant-settings" class="mg">'+input("Telefone","phone",s.phone,'inputmode="tel" maxlength="30"')+input("CEP (somente números)","postal_code",s.postal_code,'inputmode="numeric" maxlength="8"')+input("Rua / Avenida","street",s.street,'maxlength="150"')+input("Número","address_number",s.address_number,'maxlength="30"')+input("Bairro","neighborhood",s.neighborhood,'maxlength="100"')+input("Cidade","city",s.city,'maxlength="120"')+input("UF","state",s.state,'maxlength="2" style="text-transform:uppercase"')+'<div><label for="m-timezone">Fuso horário</label><select id="m-timezone" name="timezone">'+["America/Sao_Paulo","America/Manaus","America/Cuiaba","America/Rio_Branco","America/Belem","America/Fortaleza","America/Recife","America/Noronha"].map(t=>'<option value="'+t+'" '+((s.timezone??"America/Sao_Paulo")===t?"selected":"")+'>'+t.replace("America/","")+'</option>').join("")+'</select></div><div class="full team-actions"><button class="btn" type="submit">Salvar dados</button>'+(!s.onboarding_completed_at?'<button class="btn alt" name="finish" type="button" id="mg-finish">Concluir cadastro</button>':'')+'</div></form><p class="muted-sm">Cadastros e alterações ficam vinculados ao estabelecimento e registrados para auditoria.</p></section>';
   }else if(state.tab==="equipe"){
     const options=(isMaster?["manager","waiter","kitchen","cashier"]:["waiter","kitchen","cashier"]);
     inner=(isMaster?'<section class="panel"><h2>Criar funcionário com senha provisória</h2><p class="muted-sm">O Master cadastra sua equipe sem depender de confirmação de e-mail. A senha precisa ser trocada no primeiro acesso. O endereço informado é liberado administrativamente, mas a titularidade do e-mail não é verificada.</p><form id="manual-staff" class="mg">'
      +input("Nome","display_name","",'required minlength="2" maxlength="100"')
      +input("E-mail de login","email","",'required type="email" autocomplete="off"')
      +'<div><label>Função</label><select name="role"><option value="manager">Gerente</option><option value="waiter">Garçom</option><option value="kitchen">Cozinha</option><option value="cashier">Caixa</option></select></div>'
      +'<div><label>Senha provisória</label><input name="temporary_password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></div>'
      +'<div><label>Repita a senha provisória</label><input name="repeat_password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></div>'
      +'<div><label>Sua senha atual de Master</label><input name="current_password" type="password" autocomplete="current-password" required></div>'
      +'<div class="full"><button class="btn" type="submit">Cadastrar funcionário</button></div></form></section>':'')
      +'<section class="panel"><h2>Vincular funcionário que já tem conta</h2><p class="muted-sm">Use esta opção somente para um e-mail que já tenha conta no Intervalo. Nenhum e-mail será enviado. Para pessoas novas, use o cadastro com senha provisória acima.</p><form id="invite-team" class="mg">'+input("Nome","display_name","",'required minlength="2" maxlength="100"')+input("E-mail","email","",'required type="email" autocomplete="email"')+'<div><label for="staff-role">Função</label><select name="role" id="staff-role">'+options.map(o=>'<option value="'+o+'">'+roles[o]+'</option>').join("")+'</select></div><div style="display:flex;align-items:end"><button class="btn" type="submit">Vincular conta existente</button></div></form></section><h2 style="margin-top:28px">Pessoas cadastradas ('+d.members.length+')</h2>';
     for(const m of d.members){
       const editable=m.user_id!==null&&m.role!=="master"&&(isMaster||isManager&&["waiter","kitchen","cashier"].includes(m.role));
       const selectable=isMaster?["manager","waiter","kitchen","cashier"]:["waiter","kitchen","cashier"];
       inner+='<article class="team-card"><div class="team-top"><div><b>'+value(m.display_name||m.invited_email||"Usuário")+'</b><div class="muted-sm">'+value(m.invited_email)+'</div><div class="muted-sm">'+value(roles[m.role]??m.role)+'</div></div><span class="status">'+(m.status==="active"?"Ativo":m.status==="pending"?"Convite pendente":"Revogado")+'</span></div>';
       if(editable&&m.status==="active"){inner+='<div class="team-actions"><select aria-label="Alterar função" data-role="'+value(m.user_id)+'">'+selectable.map(t=>'<option value="'+t+'" '+(m.role===t?"selected":"")+'>'+roles[t]+'</option>').join("")+'</select><button type="button" class="smallbtn" data-setrole="'+value(m.user_id)+'">Salvar função</button><button type="button" class="smallbtn danger" data-revoke="'+value(m.user_id)+'">Revogar acesso</button></div>'}
       else if(editable&&m.status==="pending")inner+='<div class="team-actions"><button type="button" class="smallbtn danger" data-revoke="'+value(m.user_id)+'">Cancelar convite</button></div>';
       inner+='</article>';
     }
   }else if(state.tab==="acessos"&&isMaster){
     inner='<h2>Permissões individuais</h2><p class="muted">Configure exceções por funcionário. Essas permissões não ativam um módulo desabilitado para o restaurante.</p>';
     const active=d.members.filter(m=>m.status==="active"&&m.role!=="master");
     if(!active.length)inner+='<section class="panel">Convide um funcionário e aguarde a ativação para configurar permissões.</section>';
     for(const member of active){
       inner+='<h3>'+value(member.display_name||member.invited_email)+' · '+value(roles[member.role])+'</h3><div class="pgrid">';
       for(const mod of modules){
         const item=d.overrides.find(o=>o.user_id===member.user_id&&o.module===mod);
         const allowed=item?item.allowed:(defaults[member.role]??[]).includes(mod);
         const enabled=d.enabled.find(m=>m.module===mod)?.enabled??false;
         inner+='<div class="pitem"><strong>'+labels[mod]+'</strong><span>'+(!enabled?"Módulo ainda não habilitado · ":"")+(item?"Permissão personalizada":"Permissão padrão")+'</span><div><button class="smallbtn" data-perm="'+value(member.user_id)+'" data-mod="'+mod+'" data-allowed="'+(!allowed)+'">'+(allowed?"✓ Permitir — clique para bloquear":"Bloqueado — clique para permitir")+'</button></div></div>';
       }
       inner+='</div>';
     }
   }
   box(viewHead+inner+"</div></main>"+bottom+"</div></div>");
   if(state.tab==="vendas"){
    const host=document.getElementById('mg-v2-online-host');
    const isActive=()=>!!host?.isConnected&&state.tab==='vendas';
    void import('/intervalo/online-management-rc1.js?v=1.2.0-rc.14a').then(({renderPage})=>{
     if(!isActive())return;
     return renderPage({supabase,restaurant,role,esc,link,embedded:true,isActive,
      initialSection:state.area,externalNavigation:true,canPay:navContext.can('caixa'),
      box:html=>{if(isActive())host.innerHTML=html}});
    }).catch(e=>{if(isActive())host.innerHTML='<div class="mg-v2-panel" role="alert">Não foi possível abrir Vendas: '+esc(e.message)+'</div>'});
   }
   const shell=document.getElementById("mg-v2-root");
   const switchTab=(tab,area='pedidos')=>{
     if(!allowedTabs.includes(tab)||tab==="acessos"&&!isMaster)return;
     state.tab=tab;state.area=onlineAreas.includes(area)?area:'pedidos';
     const url=new URL(location.href);
     if(tab==='visao')url.searchParams.delete('tab');else url.searchParams.set('tab',tab);
     if(tab==='vendas')url.searchParams.set('area',state.area);else url.searchParams.delete('area');
     history.replaceState(history.state,'',url.pathname+url.search+url.hash);
     if(tab==='visao'&&!state.overview){draw();void refresh().catch(e=>message(e.message,'error'))}else draw();
   };
   document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{shell?.classList.remove("menu-open");switchTab(b.dataset.tab,b.dataset.area)});
   // Logout is handled by the shared navigation controller.
   shell?.querySelector("[data-mg-open-nav]")?.addEventListener("click",()=>shell.classList.add("menu-open"));
   shell?.querySelector("[data-mg-close-nav]")?.addEventListener("click",()=>shell.classList.remove("menu-open"));
   function openSheet(kind){
     document.querySelector("dialog.mg-v2-sheet[open]")?.close();
     const choices=kind==="quick"
       ?[["route","garcom","Garçom","Atendimento e pedidos","utensils"],
         ["route","cozinha","Cozinha","Preparação dos pedidos","chef"],
         ["route","caixa","Caixa","Recebimentos e fechamento","register"],
         ["route","mesas","Mesas","Consultar ocupação","table"],
         ["tab","produtos","Produtos","Produtos e categorias","package"],
         ["tab","estoque","Estoque","Insumos e saldos","layers"]]
       :[["tab","dados","Dados do restaurante","Endereço, telefone e cadastro","store"],
         ["route","relatorios","Relatórios","Indicadores gerenciais","chart"],
         ["tab","equipe","Equipe","Configurações existentes, sem alterações","users"],
         ["tab","acessos","Permissões","Apenas para o Master","shield"],
         ["tab","vendas","Vendas online","Pedidos, entregas e pagamentos","bag"],
         ["route","impressao","Impressão","Prévia manual e documentos internos","printer"],
         ["route","inicio","Trocar restaurante","Voltar aos meus restaurantes","arrowLeft"]];
     const available=choices.filter(([type,path])=>type==="tab"?(path!=="acessos"||isMaster):(path==="inicio"||accessible.some(([p])=>p===path)));
     const dialog=document.createElement("dialog");dialog.className="mg-v2-sheet";
     dialog.setAttribute("aria-label",kind==="quick"?"Ações rápidas":"Mais opções");
     const rows=available.map(([type,path,label,note,symbol])=>{
       const inner='<span class="mg-v2-sheet-symbol" aria-hidden="true">'+icon(symbol,19)+'</span><span class="mg-v2-sheet-text"><strong>'+esc(label)+'</strong><small>'+esc(note)+'</small></span><span class="mg-right-icon" aria-hidden="true">'+icon("chevronRight",16)+'</span>';
       return type==="tab"?
         '<button type="button" class="mg-v2-sheet-item" data-mg-sheet-tab="'+path+'">'+inner+'</button>':
         '<a class="mg-v2-sheet-item" href="'+(path==="inicio"?mainLink:link("/"+d.restaurant.slug+"/"+path))+'">'+inner+'</a>';
     }).join("");
     dialog.innerHTML='<div class="mg-v2-sheet-handle-area" aria-hidden="true"><span class="mg-v2-sheet-handle"></span></div><div class="mg-v2-sheet-head"><h2>'+(kind==="quick"?"Ações rápidas":"Mais opções")+'</h2><button type="button" class="mg-v2-iconbtn" data-mg-sheet-close aria-label="Fechar">'+icon("x",19)+'</button></div>'
       +'<div class="mg-v2-sheet-list">'+(rows||'<p>Não há módulos habilitados para esta ação.</p>')+'</div>';
     document.body.append(dialog);
     dialog.addEventListener("close",()=>dialog.remove(),{once:true});
     dialog.addEventListener("click",e=>{
       if(e.target===dialog){dialog.close();return}
       if(e.target.closest("[data-mg-sheet-close]")){dialog.close();return}
       const tab=e.target.closest("[data-mg-sheet-tab]");
       if(tab){const next=tab.dataset.mgSheetTab;dialog.close();switchTab(next)}
     });
     dialog.showModal();
     const grip=dialog.querySelector(".mg-v2-sheet-handle-area");
     let dragY=null;
     grip?.addEventListener("pointerdown",e=>{if(e.button!==0)return;dragY=e.clientY;grip.setPointerCapture?.(e.pointerId)});
     grip?.addEventListener("pointerup",e=>{if(dragY!==null&&e.clientY-dragY>64&&dialog.open)dialog.close();dragY=null});
     grip?.addEventListener("pointercancel",()=>{dragY=null});
   }
   shell?.querySelectorAll("[data-mg-sheet]").forEach(b=>b.addEventListener("click",()=>openSheet(b.dataset.mgSheet)));

   const settingForm=document.getElementById("restaurant-settings");
   if(settingForm){
     async function save(complete){
       const button=complete?document.getElementById("mg-finish"):(settingForm.querySelector('button[type="submit"]')??document.querySelector('button[type="submit"][form="restaurant-settings"]'));
       if(button?.disabled)return;
       const previous=button?.textContent;
       if(button){button.disabled=true;button.textContent=complete?"Concluindo...":"Salvando...";button.setAttribute("aria-busy","true")}
       try{
         const settings=Object.fromEntries(new FormData(settingForm).entries());
         settings.state=(settings.state??"").trim().toUpperCase();
         settings.postal_code=(settings.postal_code??"").replace(/\D/g,"");
         await call("save_settings",{settings,complete});await refresh();message(complete?"Cadastro concluído.":"Dados salvos.");
       }catch(e){if(!showFormSheetError(settingForm,e.message))message(e.message,"error")}
       finally{
         if(button?.isConnected){button.disabled=false;button.textContent=previous;button.removeAttribute("aria-busy")}
       }
     }
     settingForm.onsubmit=async e=>{e.preventDefault();await save(false)};
     const finish=document.getElementById("mg-finish");if(finish)finish.onclick=()=>save(true);
   }
   const manualStaffForm=document.getElementById("manual-staff");
   if(manualStaffForm)manualStaffForm.onsubmit=async e=>{
     e.preventDefault();
     const raw=Object.fromEntries(new FormData(manualStaffForm).entries());
     if(raw.temporary_password!==raw.repeat_password){if(!showFormSheetError(manualStaffForm,"As senhas provisórias não coincidem."))message("As senhas provisórias não coincidem.","error");return}
     const button=manualStaffForm.querySelector('button[type="submit"]')??document.querySelector('button[type="submit"][form="manual-staff"]');button.disabled=true;
     const temp=raw.temporary_password,email=raw.email.trim().toLowerCase();
     try{
       await call("create_staff_with_password",{
         email,role:raw.role,display_name:raw.display_name,
         temporary_password:temp,current_password:raw.current_password
       });
       state.tab="equipe";await refresh();message("Funcionário criado. A senha será exigida para o primeiro acesso.");
       showTemporaryPassword(temp,email);
     }catch(err){if(!showFormSheetError(manualStaffForm,err.message))message(err.message,"error");button.disabled=false}
   };
   const inviteForm=document.getElementById("invite-team");
   if(inviteForm)inviteForm.onsubmit=async e=>{
     e.preventDefault();const values=Object.fromEntries(new FormData(inviteForm).entries()),button=inviteForm.querySelector('button[type=submit]')??document.querySelector('button[form="invite-team"]');if(button?.disabled)return;if(button)button.disabled=true;
     try{const out=await call("invite",values);await refresh();state.tab="equipe";draw();message("Vínculo criado sem envio de e-mail. A pessoa pode entrar na conta existente e aceitar o convite.")}catch(err){if(!showFormSheetError(inviteForm,err.message))message(err.message,"error");if(button)button.disabled=false}
   };
   sheetifyForms([{id:'restaurant-settings',label:'Editar dados',title:'Dados do restaurante',description:'Atualize as informações do estabelecimento.',fixedAction:true,extraClass:'iv-management-form-sheet'},{id:'manual-staff',label:'Cadastrar funcionário',title:'Novo funcionário',description:'Cadastre o acesso e a senha provisória.',fixedAction:true,extraClass:'iv-management-form-sheet'},{id:'invite-team',label:'Vincular conta',title:'Vincular funcionário',description:'Use uma conta já cadastrada no Intervalo.',fixedAction:true,extraClass:'iv-management-form-sheet'}]);
   document.querySelectorAll("[data-setrole]").forEach(b=>b.onclick=async()=>{
      const id=b.dataset.setrole,role=document.querySelector('[data-role="'+id+'"]')?.value;
      try{await call("set_role",{user_id:id,role});await refresh();state.tab="equipe";draw();message("Função atualizada.")}catch(err){message(err.message,"error")}
   });
   document.querySelectorAll("[data-revoke]").forEach(b=>b.onclick=async()=>{
      if(!confirm("Revogar o vínculo deste funcionário com este restaurante?"))return;
      try{await call("revoke",{user_id:b.dataset.revoke});await refresh();state.tab="equipe";draw();message("Acesso revogado.")}catch(err){message(err.message,"error")}
   });
   document.querySelectorAll("[data-perm]").forEach(b=>b.onclick=async()=>{
      try{await call("set_access",{user_id:b.dataset.perm,module:b.dataset.mod,allowed:b.dataset.allowed==="true"});await refresh();state.tab="acessos";draw();message("Permissão atualizada.")}catch(err){message(err.message,"error")}
   });
 }
 renderLoading();
 try{await refresh();}catch(e){box(sty+'<section class="panel"><h1>Não foi possível carregar a gestão</h1><p class="error">'+esc(e.message)+'</p><a href="'+link("/inicio")+'">Voltar aos restaurantes</a></section>')}
}
