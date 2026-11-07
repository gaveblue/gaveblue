// GB+ 2.7.6 — editing a credit-card purchase must never duplicate invoices.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const source=readFileSync(resolve(here,'../js/credit-cards.js'),'utf8')
 .replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
let sequence=0;
const funcs=Function('uid','today','validDate','paid','pending',
 source+';return {addCardPurchase,updateCardPurchase,removeCardPurchase,cardUsed};')(
 ()=> 'test-'+(++sequence),()=> '2026-11-07',
 day=>/^\d{4}-\d{2}-\d{2}$/.test(day),
 ()=>0,()=>0);
const db={
 cards:[{id:'card1',name:'Cartão fictício',active:true,closingDay:10,dueDay:20,limit:60000,payAccountId:''}],
 categories:[{id:'food',type:'expense',name:'Mercado'}],cardPurchases:[],titles:[],payments:[]
};
const base={cardId:'card1',date:'2026-11-06',amount:12000,count:3,
 description:'Mercado',categoryId:'food',partnerId:''};
const created=funcs.addCardPurchase(db,base);
assert.equal(created.length,3);
assert.equal(db.titles.length,3);
assert.equal(funcs.cardUsed(db,'card1'),12000);
const firstId=created[0].id;
funcs.updateCardPurchase(db,firstId,{...base,description:'Compra corrigida'});
assert.equal(db.cardPurchases.length,3);
assert(db.cardPurchases.every(p=>p.description==='Compra corrigida'));
assert.equal(funcs.cardUsed(db,'card1'),12000);
funcs.updateCardPurchase(db,firstId,{...base,amount:15000});
assert.equal(db.cardPurchases.length,3);
assert.equal(db.titles.reduce((sum,t)=>sum+t.amount,0),15000);
assert.equal(funcs.cardUsed(db,'card1'),15000);
const safe=JSON.stringify(db);
assert.throws(()=>funcs.updateCardPurchase(db,firstId,{...base,amount:120000}),/limite disponível/);
assert.equal(JSON.stringify(db),safe,'Invalid edit must not change financial data');
db.payments.push({id:'p1',titleId:db.cardPurchases[0].invoiceId,amount:1000});
assert.throws(()=>funcs.updateCardPurchase(db,firstId,{...base,amount:19000}),/fatura paga/);
funcs.updateCardPurchase(db,firstId,{...base,amount:15000,description:'Ajuste de descrição'});
assert(db.cardPurchases.every(p=>p.description==='Ajuste de descrição'));
assert.equal(db.titles.reduce((sum,t)=>sum+t.amount,0),15000);
console.log('GB+ 2.7.6: edição de cartão, parcelas, limites, fatura paga e atomicidade OK.');
