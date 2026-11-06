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

test('dashboard balance keeps total while each account shows logo and balance in a pill',()=>{
 const views=fs.readFileSync(path.join(__dirname,'../gbplus/js/views.js'),'utf8');
 assert.match(views,/stat\('balance',m\.balance/);
 assert.match(views,/bankBadge\(bankForAccount\(db,a\)\)/);
 assert.match(views,/gb-balance-bank-amount/);
 assert.match(views,/money\(accountBalance\(db,a\.id,today\(\)\)\)/);
 assert.match(views,/data-action="account-detail"/);
});
test('build 67 invalidates cached UI and includes updated pill styling',()=>{
 const version=JSON.parse(fs.readFileSync(path.join(__dirname,'../gbplus/version.json'),'utf8'));
 const html=fs.readFileSync(path.join(__dirname,'../gbplus/index.html'),'utf8');
 const sw=fs.readFileSync(path.join(__dirname,'../gbplus/sw.js'),'utf8');
 const css=fs.readFileSync(path.join(__dirname,'../gbplus/styles.css'),'utf8');
 assert.equal(version.version,'2.4.9');assert.equal(version.build,67);
 assert.match(html,/gbplus-build" content="67"/);
 assert.match(html,/styles\.css\?v=20261106-94/);
 assert.match(sw,/gb-plus-shell-v67/);
 assert.match(css,/\.gb-balance-bank-amount/);
});

test('pílulas mostram somente o logo e o saldo, com a identidade no título e acessibilidade',()=>{
 const views=fs.readFileSync(path.join(__dirname,'../gbplus/js/views.js'),'utf8');
 const script=views.replace(/^import .*;$/gm,'').replace(/\bexport\s+/g,'');
 const fakeEsc=x=>String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const strip=new Function('esc','money','today','accountBalance','bankBadge','bankForAccount',script+';return balanceAccountStrip;')(
  fakeEsc,
  n=>'R$ '+(n/100).toFixed(2).replace('.',','),
  ()=>'2026-11-06',
  (db,id)=>db.accounts.find(a=>a.id===id).initial,
  ()=>'<span class="gb-bank-badge">B</span>',
  ()=>null
 );
 const db={accounts:[
  {id:'a',name:'Conta principal',initial:10050,active:true},
  {id:'b',name:'Conta & B',initial:7024,active:true},
  {id:'c',name:'Oculta',initial:9999,active:false}
 ]};
 const html=strip(db);
 assert.equal((html.match(/class="gb-balance-bank"/g)||[]).length,2);
 assert.match(html,/R\$ 100,50/);
 assert.match(html,/R\$ 70,24/);
 assert.match(html,/data-action="account-detail"/);
 assert.match(html,/Abrir movimentações de Conta &amp; B/);
 assert.doesNotMatch(html,/gb-balance-bank-name/);
 assert.doesNotMatch(html,/Oculta/);
 assert.match(views,/stat\('balance',m\.balance,'Saldo atual de todas as contas'/);
});
test('clicar na pílula abre o extrato existente sem trocar o saldo principal',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../gbplus/js/app.js'),'utf8');
 const views=fs.readFileSync(path.join(__dirname,'../gbplus/js/views.js'),'utf8');
 assert.ok(app.includes("'account-detail':el=>openModal('Movimentações da conta',accountDetail("));
 assert.doesNotMatch(views,/selectedAccountId|toggle-balance-account|return-total-balance/);
});
test('CSS cria cápsula pequena, arredondada e horizontal com rolagem no celular',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../gbplus/styles.css'),'utf8');
 assert.match(css,/build 67/);
 assert.match(css,/height:40px/);
 assert.match(css,/border-radius:999px/);
 assert.match(css,/flex-direction:row/);
 assert.match(css,/\.gb-balance-bank>\.gb-balance-bank-amount/);
 assert.match(css,/\.gb-balance-bank \.gb-bank-badge/);
 assert.match(css,/overflow-x:auto/);
});
