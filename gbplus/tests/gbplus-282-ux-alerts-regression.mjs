// GB+ 2.8.2 — regressões de categorias, ícones, notificações e tema sem banco real.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>readFileSync(resolve(root,name),'utf8');
const source=(name)=>read('js/'+name+'.js').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
let n=0;const ok=(value,label)=>{assert.ok(value,label);n++;};

const categories=Function(source('category-library')+';return {CATEGORY_SUGGESTIONS,missingCategorySuggestions,appendCategorySuggestions};')();
const iconData=Function(source('gb-icons')+';return {CATEGORY_ICON_OPTIONS,gbIcon};')();
const categoryKeys=new Set(iconData.CATEGORY_ICON_OPTIONS.map(([key])=>key));
ok(categories.CATEGORY_SUGGESTIONS.length>=45,'Biblioteca precisa ter 45+ sugestões');
ok(categoryKeys.size>=50,'Biblioteca de ícones precisa ter 50+ opções');
ok(categories.CATEGORY_SUGGESTIONS.every(([,type,key])=>['expense','income'].includes(type)&&categoryKeys.has(key)),'Cada sugestão precisa ter ícone válido');
let nextId=0;const list=[{id:'old',name:'Café',type:'expense'}];
const added=categories.appendCategorySuggestions(list,()=>String(++nextId));
ok(added===categories.CATEGORY_SUGGESTIONS.length,'Novo pacote não pode eliminar dados existentes');
ok(list[0].id==='old'&&list[0].name==='Café','Categoria anterior preservada');
ok(categories.appendCategorySuggestions(list,()=>String(++nextId))===0,'Aplicação idempotente');

const notifications=Function(source('notification-rules')+';return {calculateDueAlerts,validNotificationPrefs,notificationPrefs,DEFAULT_NOTIFICATION_PREFS};')();
const original={settings:{},payments:[],titles:[
 {id:'late',due:'2026-11-07',description:'Atrasado',type:'expense',amount:5000,cancelled:false},
 {id:'today',due:'2026-11-08',description:'Hoje',type:'expense',amount:12000,cancelled:false},
 {id:'soon',due:'2026-11-12',description:'Próximo',type:'income',amount:10000,cancelled:false},
 {id:'beyond',due:'2026-11-29',description:'Futuro',type:'expense',amount:1000,cancelled:false},
 {id:'cancelled',due:'2026-11-08',description:'Cancelado',type:'expense',amount:2000,cancelled:true}
]};
let result=notifications.calculateDueAlerts(original,'2026-11-08');
ok(result.total===3,'Considerar atrasado, hoje e próximo no intervalo padrão');
ok(result.summary.overdue===1&&result.summary.today===1&&result.summary.upcoming===1,'Distribuição correta');
original.payments.push({titleId:'today',amount:12000});
result=notifications.calculateDueAlerts(original,'2026-11-08');
ok(result.total===2&&!result.items.some(x=>x.id==='today'),'Título quitado não deve gerar aviso');
original.settings.notifications={enabled:true,daysBefore:2,expenses:true,incomes:false,includeOverdue:false};
ok(notifications.validNotificationPrefs(original.settings.notifications),'Preferências válidas');
result=notifications.calculateDueAlerts(original,'2026-11-08');
ok(result.total===0,'Filtros de antecedência, tipo e atrasados respeitados');
original.settings.notifications.enabled=false;
ok(notifications.calculateDueAlerts(original,'2026-11-08').total===0,'Avisos pausados');
ok(!notifications.validNotificationPrefs({enabled:true,daysBefore:100,expenses:true,incomes:true,includeOverdue:true}),'Antecedência inválida rejeitada');

const app=read('js/app.js'),page=read('index.html'),css=read('next-282.css'),views=read('js/views.js'),toggle=read('lab/liquid-theme-toggle.html'),more=read('js/more-view.js');
ok(css.includes('.gb-balance-accounts::-webkit-scrollbar{display:none')&&css.includes('overflow-x:auto!important'),'Esconder barra mantendo rolagem horizontal');
ok(page.includes('id="gb-top-theme-frame"')&&!page.includes('class="avatar"'),'Liquid Glass no cabeçalho substitui Minha Conta');
ok(toggle.includes('compact')&&toggle.includes('canSendTheme=true'),'Efeito compacto conserva interação sem evento inicial');
ok(app.includes('frame.contentWindow!==event.source')&&app.includes('event.origin!==location.origin'),'Origem/janela conferidas no tema');
ok(more.includes('href="#profile"')&&more.includes('Minha Conta')&&more.includes('Carteira'),'Minha Conta em Mais e Carteira');
ok(views.includes("['due-overview','Painel de vencimentos']"),'Relatório antigo preservado');
ok(views.includes("button(icon('settings')+' Configurar avisos'"),'Notificações configuráveis na tela');
ok(app.includes("form.id==='notification-preferences-form'"),'Salvar preferências por formulário');
ok(app.includes("form.id==='category-form'"),'Cadastro de categoria preservado');
ok(!page.includes('data-action="top-theme"'),'Não manter botão antigo ao lado do controle novo');
ok(page.includes('next-282.css?v=20261108-2831'),'Folha de estilos nova registrada');

const viewSource=views.slice(views.indexOf('export function notificationsView(db){'),views.indexOf('export function partnersView(db',views.indexOf('export function notificationsView(db){'))).replace(/^export /,'');
const notificationView=Function('heading','button','icon','esc','money','dateLabel','calculateDueAlerts','notificationPrefs','today',
viewSource+';return notificationsView;')((title,subtitle,action)=>'<header>'+title+subtitle+action+'</header>',(label)=>'<button>'+label+'</button>',
 key=>'<i>'+key+'</i>',s=>String(s),n=>String(n),s=>s,notifications.calculateDueAlerts,notifications.notificationPrefs,()=> '2026-11-08');
original.settings.notifications={...notifications.DEFAULT_NOTIFICATION_PREFS};original.payments=[];
original.categories=[{id:'x',name:'Despesas',type:'expense'}];
const html=notificationView(original);
ok(html.includes('Configurar avisos')&&html.includes('Atrasado')&&html.includes('Próximo'),'Notificações devem listar títulos reais');
ok(html.includes('não envia notificações push')||html.includes('não envia push'),'Avisos internos claramente explicados');
console.log('GB+ 2.8.2: '+n+' verificações de categorias, ícones, avisos e tema aprovadas.');
