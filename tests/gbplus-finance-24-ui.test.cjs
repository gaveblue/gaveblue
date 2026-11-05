'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../gbplus/js');
const load=name=>fs.readFileSync(path.join(root,name),'utf8').replace(/^import .*;$/gm,'').replace(/\bexport\s+/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=n=>'<svg data-icon="'+n+'"></svg>';
const button=(label,action,kind='',extra='')=>'<button data-action="'+action+'" '+extra+'>'+label+'</button>';
const field=(label,name,value='',type='text',attrs='')=>'<label>'+label+'<input name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+attrs+'></label>';
const select=(label,name,items,value='')=>'<label>'+label+'<select name="'+name+'">'+items.map(([id,text])=>'<option value="'+esc(id)+'">'+esc(text)+'</option>').join('')+'</select></label>';
const formFooter=(label='Salvar')=>'<button type="submit">'+label+'</button>';
const empty=(title,description)=>'<div>'+title+' '+description+'</div>';
const money=value=>'R$ '+(value/100).toFixed(2).replace('.',',');
const dateLabel=v=>v?String(v).split('-').reverse().join('/'):'—';
const banks=new Function('esc','select',load('banks.js')+';return {BANKS,bankCatalog,findBank,bankBadge,bankOptions,bankPicker};')(esc,select);
const forecast=new Function('today','balance','pending','accountBalance','validDate',load('forecast.js')+';return {cashForecast};')(
 ()=> '2026-11-05',
 db=>(db.accounts||[]).reduce((sum,a)=>sum+a.initial,0),
 (db,t)=>t.amount-(db.payments||[]).filter(p=>p.titleId===t.id).reduce((sum,p)=>sum+p.amount,0),
 (db,id)=>db.accounts.find(a=>a.id===id)?.initial||0,
 s=>/^\d{4}-\d{2}-\d{2}$/.test(s)
);
const credit=new Function(load('credit-cards.js')+';return {creditCards,cardPurchases,cardUsed,cardAvailable};')();
const ui=new Function('esc','icon','button','field','select','formFooter','empty','today','money','dateLabel','pending','accountBalance','BANKS','bankCatalog','bankOptions','findBank','bankBadge','bankPicker','creditCards','cardPurchases','cardUsed','cardAvailable','cashForecast',
 load('finance-24-ui.js')+';return {banksView,bankForm,cardsView,cardForm,cardPurchaseForm,forecastSummary,forecastView,forecastScenarioForm,forecastResult};')(
 esc,icon,button,field,select,formFooter,empty,()=> '2026-11-05',money,dateLabel,
 (db,t)=>t.amount,()=>0,
 banks.BANKS,banks.bankCatalog,banks.bankOptions,banks.findBank,banks.bankBadge,banks.bankPicker,
 credit.creditCards,credit.cardPurchases,credit.cardUsed,credit.cardAvailable,forecast.cashForecast
);
const fixture=()=>({
 banks:[],cards:[{id:'card01',bankId:'nubank',name:'Principal',last4:'1234',limit:80000,closingDay:10,dueDay:17,active:true}],
 cardPurchases:[],
 accounts:[{id:'account01',initial:20000,name:'Conta principal'}],
 titles:[],payments:[],transfers:[],
 categories:[{id:'cat01',name:'Compras',type:'expense'}],
 partners:[],revision:0
});
test('new bank registry has official logo previews and custom-bank form',()=>{
 assert.match(ui.banksView(fixture()),/Banco do Brasil/);
 assert.match(ui.banksView(fixture()),/60701190/);
 assert.match(ui.bankForm({id:'custom',name:'<script>alert(1)</script>',color:'#112233'}),/&lt;script&gt;/);
 assert.doesNotMatch(ui.bankForm({id:'custom',name:'<script>',color:'#112233'}),/<script>/);
});
test('card registration does not request credit-card number or CVV',()=>{
 const html=ui.cardForm(fixture());
 assert.match(html,/Limite total/);
 assert.match(html,/Dia do fechamento/);
 assert.match(html,/Dia do vencimento/);
 assert.match(html,/Conta prevista para pagamento da fatura/);
 assert.match(html,/Últimos 4 dígitos/);
 assert.doesNotMatch(html,/name="cvv"/);
 assert.doesNotMatch(html,/name="cardNumber"/);
});
test('credit-card expenses are linked to a chosen card rather than duplicating a title',()=>{
 const html=ui.cardPurchaseForm(fixture());
 assert.match(html,/Cartão utilizado/);
 assert.match(html,/name="cardId"/);
 assert.match(html,/Número de parcelas/);
 assert.match(html,/sem duplicar|Não cria despesa duplicada/i);
});
test('credit card overview renders limit and invoice list',()=>{
 const db=fixture();db.titles.push({id:'inv01',cardInvoice:true,cardId:'card01',description:'Fatura do cartão',due:'2026-11-17',amount:10000});
 const html=ui.cardsView(db);
 assert.match(html,/Limite total ativo/);
 assert.match(html,/Compra no cartão/);
 assert.match(html,/Fatura do cartão/);
 assert.match(html,/data-action="title-detail"/);
});
test('forecast offers 7–90 days and preview without modifying finance data',()=>{
 const db=fixture();db.titles.push({id:'expense01',type:'expense',due:'2026-11-17',amount:2500});
 const before=JSON.stringify(db);
 const html=ui.forecastView(db,30);
 assert.match(html,/Previsão financeira/);
 assert.match(html,/Calendário financeiro/);
 assert.match(html,/Simular cenário/);
 assert.match(html,/90 dias/);
 assert.match(html,/R\$ 175,00/);
 assert.equal(JSON.stringify(db),before);
});
test('main app wires card, bank, forecast and purchase actions',()=>{
 const app=load('app.js'),views=load('views.js'),form=load('forms.js');
 for(const action of ["'new-card':","'new-bank':","'new-card-purchase':","'forecast-period':","'forecast-simulate':"])
  assert.ok(app.includes(action),action);
 assert.match(views,/\['cards','Cartões de crédito'/);
 assert.match(views,/\['banks','Bancos'/);
 assert.match(views,/\['forecast','Previsão financeira'/);
 assert.match(form,/Lançar compra no cartão/);
});
