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
 ['Principal',[management('visao','Visão geral','dashboard'),management('pedidos','Pedidos','bag','vendas','pedidos')]],
 ['Operação',[route('mesas','Mesas','table','gestao'),route('garcom','Garçom','utensils'),route('cozinha','Cozinha','chef'),route('caixa','Caixa','register')]],
 ['Gerenciamento',[management('produtos','Produtos','package','produtos'),management('estoque','Estoque','layers','estoque'),route('relatorios','Relatórios','chart','gestao')]],
 ['Canais de venda',[route('catalogo','Cardápio digital','receipt','gestao','catalogo?aba=publicacao'),management('vitrine','Loja online','store','vendas','vitrine'),...(!manage?[route('cardapio','Consultar cardápio','receipt','cardapio')]:[])]],
 ['Restaurante',[management('dados','Dados do restaurante','store','dados'),management('horarios','Horários de funcionamento','clock','vendas','horarios'),management('entregas','Entrega e retirada','bike','vendas','entregas'),management('pagamentos','Formas de pagamento','wallet','vendas','pagamentos'),route('impressao','Impressão','printer','gestao'),management('equipe','Equipe','users','equipe'),...(ctx.role==='master'?[management('acessos','Permissões','shield','acessos')]:[])]]
 ];
 return groups.map(([label,rows])=>[label,rows.filter(x=>can(x.required))]).filter(([,rows])=>rows.length);
}
export function currentMenuId(module,params){
 const get=k=>params?.get(k);
 if(module==='gestao'){const tab=get('tab')||'visao';return tab==='vendas'?(get('area')||'pedidos'):tab}
 if(module==='estoque')return get('aba')==='produtos'?'produtos':'estoque';
 if(module==='catalogo')return ['categorias','adicionais'].includes(get('aba'))?'produtos':'catalogo';
 return module;
}
export function sidebarMarkup(ctx,{active='',local=false}={}){
 const name=String(ctx.restaurant.name||ctx.restaurant.slug||'Restaurante').replace(/(^|[-\s])\p{L}/gu,x=>x.replace('-',' ').toLocaleUpperCase('pt-BR'));
 const section=(label,items)=>'<div class="mg-v2-nav-title">'+esc(label)+'</div><nav class="mg-v2-nav" aria-label="'+esc(label)+'">'+items+'</nav>';
 const row=item=>{
  const selected=item.id===active,cls='mg-v2-navlink'+(selected?' active':''),inner=icon(item.symbol,18)+esc(item.label),current=selected?' aria-current="page"':'';
  if(local&&item.tab)return '<button type="button" class="'+cls+'" data-tab="'+esc(item.tab)+'"'+(item.area?' data-area="'+esc(item.area)+'"':'')+current+'>'+inner+'</button>';
  return '<a class="'+cls+'" href="'+esc(ctx.link('/'+ctx.restaurant.slug+'/'+item.route))+'"'+current+(item.id==='cardapio'?' target="_blank" rel="noopener"':'')+'>'+inner+'</a>';
 };
 return '<div class="mg-v2-brand">Intervalo</div><a class="mg-v2-restaurant" href="'+esc(ctx.link('/inicio'))+'" aria-label="Trocar restaurante"><span class="mg-rest-icon">'+icon('store',19)+'</span><span class="mg-rest-text">'+esc(name)+'<small>Trocar restaurante</small></span>'+icon('chevronRight',14)+'</a>'
  +menuGroups(ctx).map(([label,items])=>section(label,items.map(row).join(''))).join('')
  +section('Pessoal','<a class="mg-v2-navlink" href="'+esc(ctx.link('/minha-conta'))+'">'+icon('user',18)+'Minha conta</a><button type="button" class="mg-v2-navlink" data-iv-global-logout>'+icon('logout',18)+'Sair</button>')
  +'<div class="mg-v2-side-spacer"></div><div class="mg-v2-side-user"><span class="mg-v2-avatar">'+esc(name.slice(0,2).toUpperCase())+'</span><span><strong>'+esc(name)+'</strong><small>'+esc(roleNames[ctx.role]??ctx.role)+'</small></span></div>';
}
export function menuButtonMarkup(){return '<button class="iv-global-menu-button" type="button" data-iv-global-menu aria-label="Abrir menu do restaurante" aria-haspopup="dialog">'+icon('menu',23)+'</button>'}
export function installGlobalNavigation(ctx){
 // One drawer per document; remains intact while operational views redraw.
 if(document.getElementById('iv-global-nav-style'))return;
 const css=document.createElement('link');css.id='iv-global-nav-style';css.rel='stylesheet';css.href='/intervalo/global-navigation-rc7.css?v=1.2.0-rc.7';document.head.append(css);
 const managementStyle=document.createElement('link');managementStyle.rel='stylesheet';managementStyle.href='/intervalo/management-design-rc11.css?v=1.2.0-rc.1';document.head.append(managementStyle);
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
