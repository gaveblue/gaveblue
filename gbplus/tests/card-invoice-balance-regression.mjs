// GB+ 2.8.0 — faturas externas e baixa no fluxo já existente, sem duplicar títulos.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=dirname(fileURLToPath(import.meta.url));
const source=readFileSync(resolve(dir,'../js/credit-cards.js'),'utf8')
 .replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
let sequence=0;
const paid=(db,id)=>db.payments.filter(p=>p.titleId===id).reduce((sum,p)=>sum+p.amount,0);
const pending=(db,t)=>t.amount-paid(db,t.id);
const api=Function('uid','today','validDate','paid','pending',
 source+';return {registerCardInvoiceBalance,addCardPurchase,removeCardPurchase,updateCardPurchase,cardUsed,cardCycle,cardDue};')(
 ()=> 'test'+(++sequence),()=> '2026-11-07',
 date=>/^\d{4}-\d{2}-\d{2}$/.test(date),paid,pending);
const db={
 cards:[{id:'cartao1',name:'Cartão de teste',active:true,closingDay:10,dueDay:20,limit:100000,payAccountId:'conta1'}],
 accounts:[{id:'conta1',active:true,name:'Conta de teste',initial:50000}],
 categories:[{id:'mercado',name:'Mercado',type:'expense'}],
 cardPurchases:[],titles:[],payments:[],transfers:[],partners:[]
};
const [imported]=api.registerCardInvoiceBalance(db,{cardId:'cartao1',cycle:'2026-11',amount:15000,description:'Saldo informado pelo banco'});
assert.equal(imported.source,'invoice-balance');
assert.equal(db.titles.length,1);
assert.equal(db.cardPurchases.length,1);
assert.equal(db.titles[0].amount,15000);
assert.equal(db.titles[0].cardCycle,'2026-11');
assert.equal(db.titles[0].due,'2026-11-20');
assert.equal(db.titles[0].accountId,'conta1');
assert.equal(pending(db,db.titles[0]),15000);
assert.equal(api.cardUsed(db,'cartao1'),15000);
const previous=JSON.stringify(db);
assert.throws(()=>api.registerCardInvoiceBalance(db,{cardId:'cartao1',cycle:'2026-11',amount:15000}),/Já existe uma fatura/);
assert.throws(()=>api.addCardPurchase(db,{cardId:'cartao1',date:'2026-11-06',amount:2000,count:1,description:'Compra duplicada',categoryId:'mercado'}),/saldo informado/);
assert.throws(()=>api.registerCardInvoiceBalance(db,{cardId:'cartao1',cycle:'2026-12',amount:15000}),/competência atual ou anterior/);
assert.equal(JSON.stringify(db),previous,'Operações recusadas não podem modificar o documento.');
api.updateCardPurchase(db,imported.id,{cardId:'cartao1',date:'2026-11-07',amount:16500,count:1,description:'Saldo corrigido',categoryId:imported.categoryId,partnerId:''});
assert.equal(db.titles.length,1,'Editar saldo da fatura não deve duplicar títulos.');
assert.equal(db.titles[0].amount,16500);
assert.equal(db.cardPurchases[0].source,'invoice-balance');
const [regular]=api.addCardPurchase(db,{cardId:'cartao1',date:'2026-10-06',amount:5000,count:1,description:'Compra de outubro',categoryId:'mercado'});
assert.equal(db.titles.length,2);
assert.equal(db.titles.find(t=>t.cardCycle==='2026-10').amount,5000);
assert.equal(api.cardUsed(db,'cartao1'),21500);
// Baixa parcial da fatura: saldo bancário deve ser contabilizado uma única vez.
const invoice=db.titles.find(t=>t.cardCycle==='2026-11');
db.payments.push({id:'pagamento1',titleId:invoice.id,accountId:'conta1',date:'2026-11-07',amount:6500});
assert.equal(pending(db,invoice),10000);
assert.equal(api.cardUsed(db,'cartao1'),15000);
assert.throws(()=>api.removeCardPurchase(db,imported.id),/fatura com baixa/);
assert.throws(()=>api.updateCardPurchase(db,db.cardPurchases.find(p=>p.source==='invoice-balance').id,{cardId:'cartao1',date:'2026-11-07',amount:18000,count:1,description:'Inadmissível',categoryId:imported.categoryId}),/fatura paga/);
assert.equal(db.titles.length,2);
assert.equal(regular.source,'purchase');
console.log('GB+ 2.8.0: fatura consolidada, vencimento, duplicidade, edição, baixa parcial e limite OK.');
