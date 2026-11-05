'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../gbplus/js');
const source=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/^import .*;$/gm,'').replace(/\bexport\s+/g,'');
let sequence=0;
const cryptoMock={randomUUID:()=>String(++sequence)};
const domain=new Function('crypto',source('domain.js')+';return {uid,today,validDate,paid,pending,accountBalance,balance,updateTitle};')(cryptoMock);
const banks=new Function('esc',source('banks.js')+';return {BANKS,findBank,bankBadge,bankCatalog};')(s=>String(s).replace(/</g,'&lt;'));
const store=new Function('uid','validDate','paid','today','CATEGORY_ICON_OPTIONS','BANKS',source('store.js')+';return {emptyDatabase,validateDatabase};')(
 domain.uid,domain.validDate,domain.paid,domain.today,[],banks.BANKS
);
const cards=new Function('uid','today','validDate','paid','pending',source('credit-cards.js')+';return {cardCycle,shiftCardCycle,cardDue,cardAvailable,cardUsed,addCardPurchase,removeCardPurchase,ensureCardMayChange};')(
 domain.uid,domain.today,domain.validDate,domain.paid,domain.pending
);
const forecast=new Function('today','balance','pending','accountBalance','validDate',source('forecast.js')+';return {cashForecast};')(
 domain.today,domain.balance,domain.pending,domain.accountBalance,domain.validDate
);
function fixture(){
 const db=store.emptyDatabase();
 db.settings.setupCompleted=true;
 db.cards=[{id:domain.uid(),name:'Cartão principal',bankId:'nubank',last4:'1234',limit:100000,closingDay:10,dueDay:17,active:true}];
 db.accounts=[{id:domain.uid(),name:'Conta principal',bank:'Nubank',bankId:'nubank',branch:'',number:'',initial:50000,active:true}];
 db.cardPurchases=[];
 return db;
}
const purchase=(db,amount=90000,count=3)=>cards.addCardPurchase(db,{cardId:db.cards[0].id,date:'2026-11-05',amount,
 description:'Mercado parcelado',categoryId:db.categories.find(c=>c.type==='expense').id,count});
test('catalog offers real bank logo identifiers and custom names fallback',()=>{
 assert.equal(banks.findBank(null,'Nubank').ispb,'18236120');
 assert.equal(banks.findBank(null,'Caixa').ispb,'00360305');
 assert.match(banks.bankBadge(banks.findBank(null,'Itaú')),/60701190\.svg/);
 assert.match(banks.bankBadge({name:'Cooperativa local',color:'#555555'}),/CL/);
});
test('legacy backup is valid with absent banks and cards arrays',()=>{
 const old=store.emptyDatabase();
 assert.equal(store.validateDatabase(old),old);
});
test('card billing closing and due dates follow cycle boundaries',()=>{
 assert.equal(cards.cardCycle('2026-11-05',10),'2026-11');
 assert.equal(cards.cardCycle('2026-11-12',10),'2026-12');
 assert.equal(cards.cardDue('2026-11',10,17),'2026-11-17');
 assert.equal(cards.cardDue('2026-11',25,5),'2026-12-05');
});
test('installment creates matching invoice titles without separate expense titles',()=>{
 const db=fixture(),rows=purchase(db,90001,3);
 assert.equal(rows.length,3);
 assert.equal(rows.reduce((s,p)=>s+p.amount,0),90001);
 assert.deepEqual(rows.map(p=>p.sequence),[1,2,3]);
 assert.equal(db.titles.length,3);
 assert.equal(db.titles.reduce((s,t)=>s+t.amount,0),90001);
 assert.ok(db.titles.every(t=>t.cardInvoice&&t.type==='expense'));
 assert.equal(store.validateDatabase(db),db);
});
test('credit limit consumed upfront, returned only with actual invoice payments',()=>{
 const db=fixture();purchase(db);
 assert.equal(cards.cardAvailable(db,db.cards[0]),10000);
 assert.throws(()=>purchase(db,10001,1),/limite/);
 db.payments.push({id:domain.uid(),titleId:db.titles[0].id,accountId:db.accounts[0].id,date:'2026-11-05',amount:15000});
 assert.equal(cards.cardAvailable(db,db.cards[0]),25000);
 assert.equal(domain.accountBalance(db,db.accounts[0].id,'2026-11-05'),35000);
 assert.equal(store.validateDatabase(db),db);
});
test('projected balance uses outstanding invoices, not original credit card purchases',()=>{
 const db=fixture();purchase(db);
 db.payments.push({id:domain.uid(),titleId:db.titles[0].id,accountId:db.accounts[0].id,date:'2026-11-05',amount:15000});
 const f30=forecast.cashForecast(db,30,'2026-11-05');
 const f60=forecast.cashForecast(db,60,'2026-11-05');
 assert.equal(f30.current,35000);
 assert.equal(f30.totalOut,15000);
 assert.equal(f30.expected,20000);
 assert.equal(f60.totalOut,45000);
 assert.equal(f60.expected,-10000);
});
test('installment purchase cannot be deleted after a linked invoice is partly paid',()=>{
 const db=fixture(),p=purchase(db);
 db.payments.push({id:domain.uid(),titleId:db.titles[0].id,accountId:db.accounts[0].id,date:'2026-11-05',amount:5000});
 assert.throws(()=>cards.removeCardPurchase(db,p[0].id),/baixa/);
 assert.equal(db.cardPurchases.length,3);
 assert.throws(()=>domain.updateTitle(db,db.titles[0].id,{amount:2}),/Faturas/);
});
test('deleting an unpaid installment group updates every invoice and validates',()=>{
 const db=fixture(),rows=purchase(db);
 assert.equal(cards.removeCardPurchase(db,rows[0].id),3);
 assert.equal(db.cardPurchases.length,0);
 assert.equal(db.titles.length,0);
 assert.equal(store.validateDatabase(db),db);
});
test('closing and due dates cannot be changed after a card has purchases',()=>{
 const db=fixture();purchase(db);
 assert.throws(()=>cards.ensureCardMayChange(db,db.cards[0].id,{...db.cards[0],closingDay:12}),/fechamento/);
});
test('existing cards/bank records must survive standard schema validation',()=>{
 const db=fixture();
 db.banks=[{id:domain.uid(),name:'Minha cooperativa',color:'#aabbcc'}];
 db.cards[0].bankId=db.banks[0].id;
 assert.equal(store.validateDatabase(db),db);
});

test('future card invoices can project against a selected bank account without payment',()=>{
 const db=fixture();
 db.cards[0].payAccountId=db.accounts[0].id;
 purchase(db,12000,2);
 assert.ok(db.titles.every(t=>t.accountId===db.accounts[0].id));
 assert.equal(domain.accountBalance(db,db.accounts[0].id,'2026-11-05'),50000);
 const projection=forecast.cashForecast(db,60,'2026-11-05');
 assert.equal(projection.byAccount[0].current,50000);
 assert.equal(projection.byAccount[0].expected,38000);
 assert.equal(store.validateDatabase(db),db);
});
test('invalid payment account reference is rejected without changing existing data',()=>{
 const db=fixture();
 db.cards[0].payAccountId='non_existing_account';
 assert.throws(()=>store.validateDatabase(db),/cartão de crédito/);
});
