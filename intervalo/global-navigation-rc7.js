// Intervalo · Navegação compartilhada dos módulos internos.
import {icon} from './ui-icons.js?v=1.0.0-rc.1';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roleNames={master:'Master',manager:'Gerente',waiter:'Garçom',kitchen:'Cozinha',cashier:'Caixa'};
const defaults={master:['gestao','garcom','cozinha','caixa','cardapio'],manager:['gestao','garcom','cozinha','caixa','cardapio'],waiter:['garcom','cardapio'],kitchen:['cozinha','cardapio'],cashier:['caixa','cardapio']};
export function moduleAllowed(role,flags,overrides,module){
 if(!flags.some(x=>x.module===module&&x.enabled===true))return false;
 if(module==='gestao'&&!['master','manager'].includes(role))return false;
 if(role==='master')return true;
 const override=overrides.find(x=>x.module===module);
 return override?override.allowed===true:(defaults[role]??[]).includes(module);
}
const management=(id,label,symbol,tab='visao',area='')=>({id,label,symbol,required:'gestao',route:'gestao'+(tab==='visao'?'':'?tab='+tab+(area?'&area='+area:'')),tab,area});
const route=(id,label,symbol,required=id,path=id)=>({id,label,symbol,required,route:path});
export function menuGroups(ctx){
 const can=ctx.can,manage=can('gestao');
 const groups=[
 ['Acesso rápido',[management('visao','Início','dashboard'),management('pedidos','Pedidos online','bag','vendas','pedidos'),route('relatorios','Relatórios','chart','gestao')],false],
 ['Operação',[route('garcom','Garçom','utensils'),route('cozinha','Cozinha','chef'),route('caixa','Caixa','register'),route('mesas','Administrar mesas','table','gestao'),...(!manage?[route('cardapio','Consultar cardápio','receipt','cardapio')]:[])],true],
 ['Produtos e cardápio',[management('produtos','Produtos','package','produtos'),route('categorias','Categorias','layers','gestao','catalogo?aba=categorias'),route('adicionais','Adicionais','plus','gestao','catalogo?aba=adicionais'),route('catalogo','Cardápio digital','receipt','gestao','catalogo?aba=publicacao')],true],
 ['Estoque',[management('estoque','Insumos','layers','estoque'),route('fichas','Fichas técnicas','clipboard','gestao','estoque?aba=fichas'),route('historico','Movimentações','clock','gestao','estoque?aba=historico')],true],
 ['Loja online',[management('vitrine','Vitrine','store','vendas','vitrine'),management('entregas','Entrega e retirada','bike','vendas','entregas'),management('horarios','Horários','clock','vendas','horarios'),management('pagamentos','Pagamentos online','wallet','vendas','pagamentos')],true],
 ['Configurações',[management('dados','Dados do restaurante','store','dados'),management('equipe','Equipe','users','equipe'),...(ctx.role==='master'?[management('acessos','Permissões','shield','acessos')]:[]),route('impressao','Impressão','printer','gestao')],true]
 ];
 return groups.map(([name,items,fold])=>[name,items.filter(x=>can(x.required)),fold]).filter(([,items])=>items.length);
}
export function currentMenuId(module,params){
 const get=k=>params?.get(k);
 if(module==='gestao'){const tab=get('tab')||'visao';return tab==='vendas'?(get('area')||'pedidos'):tab}
 if(module==='estoque'){const a=get('aba');return ['produtos','fichas','historico'].includes(a)?a:'estoque'}
 if(module==='catalogo'){const a=get('aba');return ['categorias','adicionais'].includes(a)?a:'catalogo'}
 return module;
}
export function sidebarMarkup(ctx,{active='',local=false}={}){
 const name=String(ctx.restaurant.name||ctx.restaurant.slug||'Restaurante').replace(/(^|[-\s])\p{L}/gu,x=>x.replace('-',' ').toLocaleUpperCase('pt-BR'));
 const sections={
  'Operação':['utensils','Atendimento e produção'],
  'Produtos e cardápio':['package','Itens disponíveis para venda'],
  'Estoque':['layers','Insumos e movimentações'],
  'Loja online':['store','Vitrine e entregas'],
  'Configurações':['settings','Equipe e estabelecimento']
 };
 const row=item=>{
  const selected=item.id===active,cls='mg-v2-navlink'+(selected?' active':''),
   inner='<span class="mg-v2-navlink-icon">'+icon(item.symbol,17)+'</span><span class="mg-v2-navlink-label">'+esc(item.label)+'</span>'+(selected?'<span class="mg-v2-navlink-current" aria-hidden="true"></span>':''),
   current=selected?' aria-current="page"':'';
  if(local&&item.tab)return '<button type="button" class="'+cls+'" data-tab="'+esc(item.tab)+'"'+(item.area?' data-area="'+esc(item.area)+'"':'')+current+'>'+inner+'</button>';
  return '<a class="'+cls+'" href="'+esc(ctx.link('/'+ctx.restaurant.slug+'/'+item.route))+'"'+current+(item.id==='cardapio'?' target="_blank" rel="noopener"':'')+'>'+inner+'</a>';
 };
 const section=(title,items,fold,selected)=>{
  const nav='<nav class="mg-v2-nav" aria-label="'+esc(title)+'">'+items+'</nav>';
  if(!fold)return '<div class="mg-v2-nav-title">'+esc(title)+'</div>'+nav;
  const [symbol,subtitle]=sections[title]||['layers',''];
  return '<details class="mg-v2-nav-group"'+(selected?' open':'')+'><summary class="mg-v2-nav-group-toggle">'
   +'<span class="mg-v2-group-icon">'+icon(symbol,18)+'</span>'
   +'<span class="mg-v2-group-copy"><strong>'+esc(title)+'</strong><small>'+esc(subtitle)+'</small></span>'
   +'<span class="mg-v2-group-chevron">'+icon('chevronDown',16)+'</span>'
   +'</summary><div class="mg-v2-nav-group-panel">'+nav+'</div></details>';
 };
 return '<div class="mg-v2-brandbar"><span class="mg-v2-brand-sign" aria-hidden="true">i<span></span></span>'
  +'<div class="mg-v2-brand"><strong>Intervalo</strong><small>Gestão de restaurantes</small></div></div>'
  +'<a class="mg-v2-restaurant" href="'+esc(ctx.link('/inicio'))+'" aria-label="Trocar restaurante">'
  +'<span class="mg-rest-icon">'+icon('store',20)+'</span><span class="mg-rest-text">'+esc(name)+'<small>Trocar restaurante</small></span><span class="mg-rest-arrow">'+icon('chevronDown',16)+'</span></a>'
  +'<div class="mg-v2-menu-caption">ÁREA DE TRABALHO</div>'
  +menuGroups(ctx).map(([title,items,fold])=>section(title,items.map(row).join(''),fold,items.some(x=>x.id===active))).join('')
  +'<div class="mg-v2-side-spacer"></div>'
  +'<div class="mg-v2-personal-actions">'
  +section('Conta','<a class="mg-v2-navlink" href="'+esc(ctx.link('/minha-conta'))+'"><span class="mg-v2-navlink-icon">'+icon('user',17)+'</span><span class="mg-v2-navlink-label">Minha conta</span></a>'
  +'<button type="button" class="mg-v2-navlink" data-iv-global-logout><span class="mg-v2-navlink-icon">'+icon('logout',17)+'</span><span class="mg-v2-navlink-label">Sair</span></button>',false,false)
  +'<div class="mg-v2-side-user"><span class="mg-v2-avatar">'+esc(name.slice(0,2).toUpperCase())+'</span><span><strong>'+esc(name)+'</strong><small>'+esc(roleNames[ctx.role]??ctx.role)+'</small></span></div></div>';
}
export function menuButtonMarkup(){return '<button class="iv-global-menu-button" type="button" data-iv-global-menu aria-label="Abrir menu do restaurante" aria-haspopup="dialog">'+icon('menu',23)+'</button>'}
export function installGlobalNavigation(ctx){
 // One drawer per document; remains intact while operational views redraw.
 if(document.getElementById('iv-global-nav-style'))return;
 const css=document.createElement('link');css.id='iv-global-nav-style';css.rel='stylesheet';css.href='/intervalo/global-navigation-rc7.css?v=1.2.0-rc.17';document.head.append(css);
 const managementStyle=document.createElement('link');managementStyle.rel='stylesheet';managementStyle.href='/intervalo/management-design-rc11.css?v=1.2.0-rc.17';document.head.append(managementStyle);
 let drawer=null,launcher=null,signingOut=false;
 const show=trigger=>{
  if(drawer?.open)return;
  launcher=trigger;
  drawer=document.createElement('dialog');drawer.className='iv-global-nav-dialog';drawer.setAttribute('aria-label','Menu do restaurante');
  drawer.innerHTML='<div class="iv-global-nav-inner"><div class="mg-v2-side"><button type="button" class="iv-global-nav-close" aria-label="Fechar menu" autofocus>'+icon('x',21)+'</button>'+sidebarMarkup(ctx,{active:currentMenuId(ctx.module,new URLSearchParams(location.search))})+'</div></div>';
  document.body.append(drawer);
  const current=drawer;
  const close=()=>{if(current.open)current.close()};
  current.querySelector('.iv-global-nav-close').onclick=close;
  current.addEventListener('click',e=>{if(e.target===current)close()});
  current.addEventListener('close',()=>{current.remove();if(drawer===current)drawer=null;if(launcher?.isConnected)launcher.focus({preventScroll:true});launcher=null},{once:true});
  current.showModal();current.querySelector('.iv-global-nav-close').focus({preventScroll:true});
 };
 document.addEventListener('click',async e=>{
  const trigger=e.target.closest?.('[data-iv-global-menu]');
  if(trigger){e.preventDefault();show(trigger);return}
  const logout=e.target.closest?.('[data-iv-global-logout]');
  if(!logout||signingOut)return;
  e.preventDefault();signingOut=true;logout.disabled=true;
  try{const {error}=await ctx.supabase.auth.signOut();if(error)throw error;location.assign(ctx.link('/login'))}
  catch(err){alert(err.message||'Não foi possível sair.');logout.disabled=false;signingOut=false}
 });
}
