#!/usr/bin/env node
// GB+ 2.8.2 — regressão da candidata. Não acessa banco de produção.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const stripped=s=>s.replace(/^import\s+.*?;\s*$/gm,'').replace(/^export /gm,'');
const evalModule=(path,body)=>Function(stripped(read(path))+';'+body)();
const {CATEGORY_ICON_OPTIONS,gbIcon}=evalModule('js/gb-icons.js','return {CATEGORY_ICON_OPTIONS,gbIcon};');
const {CATEGORY_SUGGESTIONS,missingCategorySuggestions,appendCategorySuggestions}=evalModule('js/category-library.js','return {CATEGORY_SUGGESTIONS,missingCategorySuggestions,appendCategorySuggestions};');
const {calculateDueAlerts,validNotificationPrefs}=evalModule('js/notification-rules.js','return {calculateDueAlerts,validNotificationPrefs};');
let passed=0;
function check(cond,label){assert.ok(cond,label);passed++;}
for(const path of ['js/app.js','js/views.js','js/forms.js','js/store.js','js/more-view.js']){
  Function(stripped(read(path)));check(true,'O arquivo precisa ter sintaxe JavaScript válida: '+path);
}
check(CATEGORY_ICON_OPTIONS.length>=55,'São necessárias pelo menos 55 opções de ícone.');
const icons=new Set(CATEGORY_ICON_OPTIONS.map(([id])=>id));
check(icons.size===CATEGORY_ICON_OPTIONS.length,'A biblioteca não pode repetir ícones.');
for(const id of icons)check(/<(?:path|rect|circle|ellipse)/.test(gbIcon(id)),'O ícone precisa ter geometria própria: '+id);
check(CATEGORY_SUGGESTIONS.length===50,'O pacote deve conter 50 sugestões iniciais.');
for(const [name,type,icon] of CATEGORY_SUGGESTIONS)check(['expense','income'].includes(type)&&icons.has(icon)&&name,'Categoria deve ter tipo e ícone válidos: '+name);
const existing=[{id:'old',type:'expense',name:'Supermercado'}];
let seq=0;
check(appendCategorySuggestions(existing,()=>String(++seq))===49,'Não duplicar categoria previamente cadastrada.');
check(appendCategorySuggestions(existing,()=>String(++seq))===0,'Adicionar sugestões deve ser idempotente.');
check(missingCategorySuggestions(existing).length===0,'Nenhuma sugestão deve faltar após importar.');
const db={settings:{notifications:{enabled:true,daysBefore:7,expenses:true,incomes:true,includeOverdue:true}},titles:[
  {id:'a',description:'Conta atrasada',type:'expense',due:'2026-11-06',amount:8000,cancelled:false},
  {id:'b',description:'Hoje',type:'expense',due:'2026-11-08',amount:10000,cancelled:false},
  {id:'c',description:'Receita',type:'income',due:'2026-11-11',amount:12000,cancelled:false},
  {id:'d',description:'Longe',type:'income',due:'2026-12-01',amount:5000,cancelled:false},
  {id:'e',description:'Cancelada',type:'expense',due:'2026-11-08',amount:3000,cancelled:true}
],payments:[{titleId:'b',amount:3500}]};
const found=calculateDueAlerts(db,'2026-11-08');
check(found.total===3,'Lembrar apenas títulos elegíveis, no prazo.');
check(found.summary.overdue===1&&found.summary.today===1&&found.summary.upcoming===1,'Agrupar corretamente os vencimentos.');
check(found.items.find(x=>x.id==='b').pending===6500,'Usar saldo pendente após pagamento parcial.');
db.payments.push({titleId:'b',amount:6500});
check(calculateDueAlerts(db,'2026-11-08').total===2,'Não avisar sobre título quitado.');
db.settings.notifications.includeOverdue=false;
check(calculateDueAlerts(db,'2026-11-08').total===1,'A preferência deve ocultar atrasados.');
db.settings.notifications.enabled=false;
check(calculateDueAlerts(db,'2026-11-08').total===0,'Desligar alertas deve ocultar a lista.');
check(!validNotificationPrefs({...db.settings.notifications,daysBefore:999}),'Recusar número de dias fora da lista.');
const index=read('index.html'),app=read('js/app.js'),styles=read('next-282.css'),more=read('js/more-view.js'),views=read('js/views.js');
check(index.includes('id="gb-top-theme-frame"')&&!index.includes('data-action="top-theme"'),'Glass compacto no topo, sem botão antigo.');
check(!index.includes('id="account-access"')&&more.includes('href="#profile"'),'Minha Conta precisa ficar dentro de Mais.');
check(styles.includes('.gb-balance-accounts::-webkit-scrollbar')&&styles.includes('overflow-x:auto!important'),'Ocultar barra sem bloquear rolagem dos bancos.');
check(app.includes("next==='more'")&&app.includes("calculateDueAlerts(db,today())"),'Rotas e alertas devem estar ligados ao aplicativo.');
check(app.includes('gb-category-icon-search')&&app.includes('notification-preferences-form'),'Busca de ícones e formulário de avisos devem funcionar.');
check(views.includes("due-overview")&&views.includes("export function notificationsView(db)"),'Relatório de vencimentos e notificações devem coexistir.');
check(index.includes('app.js?v=20261108-2831')&&index.includes('next-282.css?v=20261108-2831'),'Imports versionados para contornar cache antigo.');
const toggle=read('lab/liquid-theme-toggle.html');
check(toggle.includes('gb-theme-compact')&&toggle.includes('setOrbit(p)')&&toggle.includes('postMessage'),'Efeito orbital deve continuar na versão compacta.');
for(const [,script] of toggle.matchAll(/<script>([\s\S]*?)<\/script>/g))Function(script);
console.log('GB+ 2.8.2: '+passed+' verificações aprovadas em ambiente local, sem dados financeiros reais.');
