'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../gbplus/js/daily-statement.js'),'utf8').replace(/\bexport\s+/g,'');
const {dailyStatement}=new Function(source+';return {dailyStatement};')();
const db=()=>({
 accounts:[{id:'a',name:'Conta A',initial:10000},{id:'b',name:'Conta B',initial:5000}],
 titles:[{id:'income',description:'Cliente',type:'income'},{id:'expense',description:'Energia',type:'expense'},{id:'future',description:'Pendente',type:'expense'}],
 payments:[
  {id:'p1',titleId:'income',accountId:'a',date:'2026-11-01',amount:2500},
  {id:'p2',titleId:'expense',accountId:'a',date:'2026-11-01',amount:400},
  {id:'p3',titleId:'expense',accountId:'b',date:'2026-11-02',amount:200},
  {id:'p4',titleId:'future',accountId:'a',date:'2026-11-07',amount:1000}
 ],
 transfers:[{id:'t1',from:'a',to:'b',date:'2026-11-02',amount:600}]
});
test('daily closing balance equals opening plus credits minus debits',()=>{
 const x=dailyStatement(db(),'a','2026-11-05');
 assert.equal(x.opening,10000);assert.equal(x.credits,2500);assert.equal(x.debits,1000);assert.equal(x.closing,11500);
 assert.equal(x.days.find(d=>d.date==='2026-11-01').opening,10000);
 assert.equal(x.days.find(d=>d.date==='2026-11-01').closing,12100);
 assert.equal(x.days.find(d=>d.date==='2026-11-02').closing,11500);
});
test('current day appears with unchanged closing balance when there is no movement',()=>{
 const x=dailyStatement(db(),'a','2026-11-05');
 assert.equal(x.days[0].date,'2026-11-05');assert.equal(x.days[0].opening,11500);
 assert.equal(x.days[0].closing,11500);assert.equal(x.days[0].items.length,0);
});
test('transfers move funds between accounts without creating system income or expense',()=>{
 const x=dailyStatement(db(),'b','2026-11-05');
 assert.equal(x.closing,5400);assert.equal(x.credits,600);assert.equal(x.debits,200);
 assert.equal(x.days.find(d=>d.date==='2026-11-02').items.filter(i=>i.kind==='transfer').length,1);
});
test('future movements do not change the current balance',()=>{
 assert.equal(dailyStatement(db(),'a','2026-11-05').closing,11500);
 assert.equal(dailyStatement(db(),'a','2026-11-07').closing,10500);
});
test('empty accounts show a current-day opening and closing equal to the initial balance',()=>{
 const d=db();d.payments=[];d.transfers=[];
 const x=dailyStatement(d,'a','2026-11-05');
 assert.equal(x.days.length,1);assert.equal(x.days[0].closing,10000);
});
test('orphaned payments are skipped and cannot break the account statement',()=>{
 const d=db();d.payments.push({id:'orphan',titleId:'unknown',accountId:'a',date:'2026-11-04',amount:1000});
 assert.equal(dailyStatement(d,'a','2026-11-05').closing,11500);
});
test('read-only ledger does not mutate payments, transfers or opening balance',()=>{
 const d=db(),snapshot=JSON.stringify(d);
 dailyStatement(d,'a','2026-11-05');assert.equal(JSON.stringify(d),snapshot);
});
test('unknown account cannot be read as another account',()=>{
 assert.throws(()=>dailyStatement(db(),'other','2026-11-05'),/Conta não encontrada/);
});
test('daily statement is available from the account detail modal and dashboard account icons',()=>{
 const forms=fs.readFileSync(path.join(__dirname,'../gbplus/js/forms.js'),'utf8');
 const views=fs.readFileSync(path.join(__dirname,'../gbplus/js/views.js'),'utf8');
 assert.match(forms,/dailyStatement\(db,a.id,today\(\)\)/);
 assert.match(forms,/Saldo do fim do dia/);
 assert.match(views,/data-action="account-detail"/);
 assert.match(views,/balanceAccountStrip\(db\)/);
});
