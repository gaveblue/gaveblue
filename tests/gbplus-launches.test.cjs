'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../gbplus');
const source=name=>fs.readFileSync(path.join(root,name),'utf8').replace(/^import .*;$/gm,'').replace(/\bexport\s+/g,'');
let n=0;const domain=new Function('crypto',source('js/domain.js')+';return {money,dateLabel,pending,paid,today,within,addPayment};')({randomUUID:()=>String(++n)});
const actions=new Function('addPayment','pending','paid',source('js/launch-actions.js')+';return {paymentSummary,applyLaunchPayments,applyLaunchReversals,applyLaunchDeletions};')(domain.addPayment,domain.pending,domain.paid);
const make=()=>({titles:[
{id:'t1',description:'Venda',type:'income',amount:3000000,cancelled:false,due:'2026-11-15'},
{id:'t2',description:'Energia',type:'expense',amount:208292,cancelled:false,due:'2026-11-10'},
{id:'t3',description:'Cancelado',type:'expense',amount:5000,cancelled:true,due:'2026-11-12'}
],payments:[],accounts:[{id:'a1',name:'Banco',active:true}],partners:[],categories:[]});
const view=new Function('money','dateLabel','pending','paid','today','within','esc','icon','select','empty','filteredTitles','periodBar',source('js/launches-view.js')+';return launchesView;')(
domain.money,domain.dateLabel,domain.pending,domain.paid,()=> '2026-11-04',domain.within,x=>String(x),n=>'<svg>'+n+'</svg>',()=>'<select></select>',()=>'<p>Sem dados</p>',(db,s)=>db.titles.filter(t=>!s.type||t.type===s.type),()=>'<select id="period"></select>');
const state=ids=>({range:{from:'2026-11-01',to:'2026-11-30'},type:'',status:'',period:'month',partner:'',category:'',query:'',launchSelected:ids});

test('minimal launch screen and no checkboxes',()=>{
const html=view(make(),state([]));
for(const text of ['Lançamentos','A receber','A pagar','Pendentes','Pagos','Venda','Energia'])assert.ok(html.includes(text));
assert.ok(html.includes('data-action="select-launch"'));assert.ok(!html.includes('type="checkbox"'));
});
test('edit only for one selected launch; batch actions for many',()=>{
const single=view(make(),state(['t1'])),multi=view(make(),state(['t1','t2']));
assert.ok(single.includes('data-action="launch-edit"'));assert.ok(!multi.includes('data-action="launch-edit"'));
for(const act of ['launch-pay','launch-reverse','launch-delete'])assert.ok(multi.includes('data-action="'+act+'"'));
});
test('batch payments and reversals are limited to selected IDs',()=>{
const db=make();
assert.equal(actions.paymentSummary(db,['t1','t2']).income,3000000);
assert.equal(actions.applyLaunchPayments(db,['t1','t2','t1'],'a1',domain.today()),2);
assert.equal(db.payments.length,2);
assert.equal(actions.applyLaunchReversals(db,['t2']),1);
assert.equal(db.payments.length,1);assert.equal(db.payments[0].titleId,'t1');
});
test('paid and cancelled titles cannot be paid twice',()=>{
const db=make();
assert.throws(()=>actions.applyLaunchPayments(db,['t1','t3'],'a1',domain.today()));
assert.equal(db.payments.length,0);
actions.applyLaunchPayments(db,['t1'],'a1',domain.today());
assert.throws(()=>actions.applyLaunchPayments(db,['t1'],'a1',domain.today()));
});
test('deletion requires previous reversal and preserves other entries',()=>{
const db=make();actions.applyLaunchPayments(db,['t1'],'a1',domain.today());
assert.throws(()=>actions.applyLaunchDeletions(db,['t1','t2']));
actions.applyLaunchReversals(db,['t1']);
assert.equal(actions.applyLaunchDeletions(db,['t1','t2']),2);
assert.deepEqual(db.titles.map(t=>t.id),['t3']);
});
test('swipe threshold requires deliberate movement',()=>{
const threshold=new Function(source('js/launches-gestures.js')+';return launchSwipeThreshold;')();
assert.equal(threshold(270),150);assert.equal(threshold(900),220);
});
