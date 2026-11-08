// GB+ 2.8.1 — regressões executáveis sem contas reais ou banco externo.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>readFileSync(resolve(root,name),'utf8');
const app=read('js/app.js'),page=read('index.html'),navStyle=read('liquid-glass.css');
const finance=read('js/finance-24-ui.js'),accounts=read('js/accounts-cards-view.js'),moreCode=read('js/more-view.js'),moreStyle=read('more-page.css');
let passed=0;
const test=(condition,label)=>{assert.ok(condition,label);passed++;};
test(page.includes('id="connection" class="connection" hidden'),'Status online não deve ocupar o cabeçalho');
test(page.includes('id="gb-theme-toggle"')&&page.includes('data-action="top-theme"'),'Alternador sol/lua deve estar no cabeçalho');
test(accounts.includes("finance-24-ui.js?v=20261108-2811"),'A tela Contas/Cartões deve carregar a nova versão do código de faturas');
test(app.includes("accounts-cards-view.js?v=20261108-2811"),'A importação da tela Contas/Cartões deve ter cache invalidado');
test(page.includes('./more-page.css?v=20261108-2811'),'A página Mais precisa carregar seu estilo');
test(navStyle.includes('.top-actions .connection{display:none!important}'),'Conexão deve ficar oculta mesmo sob CSS anterior');
test(navStyle.includes('left:var(--gb-liquid-left,6px)'),'A lente deve usar a posição real da aba');
test(app.includes("next==='more'"),'Rota Mais deve ser reconhecida pelo roteador');
test(app.includes("more:()=>moreView"),'A rota Mais deve renderizar um painel real');
test(app.includes("key==='menu'?'more':key"),'Mais precisa ser link de página, não popup');
test(!app.includes("'mobile-menu':()=>openModal('Seu financeiro'"),'Popup antigo não pode continuar em uso');

const body=moreCode.replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const moreView=Function('esc','icon',body+';return moreView;')(s=>String(s),s=>'<i>'+s+'</i>');
const moreHtml=moreView(true);
test(moreHtml.includes('href="#cards"')&&moreHtml.includes('href="#settings"'),'Todas as principais funcionalidades devem estar listadas');
test((moreHtml.match(/class="gb-more-row"/g)||[]).length===15&&moreHtml.includes('class="gb-more-profile"'),'Mais deve listar 15 destinos e Minha Conta destacada');
test(moreStyle.includes('max-width:770px')&&moreStyle.includes('gb-more-list'),'A página Mais deve ter lista responsiva');

const start=app.indexOf('function alignLiquidNavIndicator(){');
const stop=app.indexOf("window.addEventListener('resize'",start);
test(start>=0&&stop>start,'Medidor de lente precisa estar presente');
const props={};
const nav={classList:{contains:s=>s==='gb-liquid-nav'},
  style:{setProperty:(key,value)=>{props[key]=value}},
  getBoundingClientRect:()=>({left:30,width:340}),
  querySelector:()=>({getBoundingClientRect:()=>({left:236,width:62})})
};
Function('document',app.slice(start,stop)+';return alignLiquidNavIndicator;')({
  querySelector:()=>nav
})();
test(props['--gb-liquid-left']==='206.0px'&&props['--gb-liquid-width']==='62.0px',
  'Lente deve alinhar exatamente com o botão, sem desvio lateral');
test(props['--gb-liquid-visible']==='1','Botão ativo precisa realçar a lente');

const source=finance.replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const depNames=['esc','icon','button','field','select','formFooter','empty','today','money','dateLabel','pending','paid','status','accountBalance','BANKS','bankCatalog','bankOptions','findBank','bankBadge','bankPicker','creditCards','cardPurchases','cardUsed','cardAvailable','cardCycle','cardDue','cashForecast'];
const dep={
 esc:s=>String(s??''),icon:s=>'<i>'+s+'</i>',
 button:(label,action)=>'<button data-action="'+action+'">'+label+'</button>',
 field:()=>'',select:()=>'',formFooter:()=>'',empty:()=>'<p>Sem cartões</p>',
 today:()=> '2026-11-08',money:c=>String(c),dateLabel:s=>s,
 pending:(db,title)=>title.amount-db.payments.filter(p=>p.titleId===title.id).reduce((s,p)=>s+p.amount,0),
 paid:(db,id)=>db.payments.filter(p=>p.titleId===id).reduce((s,p)=>s+p.amount,0),
 status:()=> 'Pendente',accountBalance:()=>0,BANKS:[],bankCatalog:()=>[],
 bankOptions:()=>[],findBank:()=>null,bankBadge:()=>'<b>Banco</b>',bankPicker:()=>'',creditCards:db=>db.cards,
 cardPurchases:db=>db.cardPurchases,cardUsed:()=>2000,cardAvailable:()=>48000,
 cardCycle:()=> '2026-11',cardDue:()=> '2026-11-20',cashForecast:()=>{}
};
const cardsView=Function(...depNames,source+';return cardsView;')(...depNames.map(n=>dep[n]));
const db={cards:[{id:'cartao',bankId:'',name:'Cartão teste',active:true,limit:50000,closingDay:10,dueDay:20}],
 titles:[{id:'fatura',cardId:'cartao',cardInvoice:true,due:'2026-11-20',description:'Fatura de novembro',amount:12000}],
 cardPurchases:[],payments:[]};
const open=cardsView(db,{embedded:true});
test(open.includes('Fatura de novembro'),'Cartões devem renderizar título real de fatura');
test(open.includes('data-action="payment"'),'Fatura pendente precisa oferecer Pagar');
db.payments.push({id:'pagamento',titleId:'fatura',amount:12000});
const settled=cardsView(db,{embedded:true});
test(!settled.includes('data-action="payment"'),'Fatura quitada não pode oferecer Pagar');
console.log('GB+ 2.8.2: '+passed+' verificações aprovadas — cartões, Mais, cabeçalho e lente centralizada.');
