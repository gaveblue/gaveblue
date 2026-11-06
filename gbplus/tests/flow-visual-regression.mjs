// GB+ build 68 — read-only cashflow visualization regression cases.
// Run: node gbplus/tests/flow-visual-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const here=dirname(fileURLToPath(import.meta.url));
const source=path=>readFileSync(resolve(here,'..',path),'utf8');
const load=(path,deps,names)=>{
 const code=source(path).replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
 return Function(...Object.keys(deps),code+';return {'+names.join(',')+'}')( ...Object.values(deps) );
};
const {filterFlowRows,selectCashflowWindow}=load('js/gb-flow-filters.js',{},['filterFlowRows','selectCashflowWindow']);
const {flow}=load('js/domain.js',{parseMoneyCentavos:()=>0,expectedDates:()=>[],nextBusinessDay:d=>d,recurrenceAnchor:d=>d},['flow']);
const {buildChartPayload}=load('js/gb-charts-data.js',{selectCashflowWindow},['buildChartPayload']);

const db={
 titles:[
  {id:'receita',type:'income',amount:10000,due:'2026-11-15',categoryId:'vendas'},
  {id:'despesa',type:'expense',amount:5000,due:'2026-11-20',categoryId:'fixas'}
 ],
 payments:[
  {id:'p1',titleId:'receita',amount:2500,date:'2026-11-06'},
  {id:'p2',titleId:'despesa',amount:1000,date:'2026-11-06'}
 ],
 categories:[]
};
const raw=flow(db,{from:'2026-11-01',to:'2026-11-30'},'month');
const all=filterFlowRows(raw,'all');
const settled=filterFlowRows(raw,'paid');
const pending=filterFlowRows(raw,'pending');
assert.equal(raw.length,1);
assert.deepEqual([all[0].expectedIn,all[0].expectedOut,all[0].actualIn,all[0].actualOut],[7500,4000,2500,1000]);
assert.deepEqual([settled[0].expectedIn,settled[0].expectedOut,settled[0].actualIn,settled[0].actualOut],[0,0,2500,1000]);
assert.deepEqual([pending[0].expectedIn,pending[0].expectedOut,pending[0].actualIn,pending[0].actualOut],[7500,4000,0,0]);
assert.equal(all[0].expectedIn+all[0].actualIn,10000,'No double counting partial payment');
assert.equal(all[0].expectedOut+all[0].actualOut,5000,'No double counting partial expense');
assert.equal(db.payments.length,2,'Filters do not update payment records');
assert.equal(db.titles[0].amount,10000,'Filters do not update titles');
assert.equal(filterFlowRows(raw,'paid').length,1);
assert.deepEqual(filterFlowRows([{date:'2026-12-01',actualIn:0,actualOut:0,expectedIn:300,expectedOut:0}],'paid'),[]);
assert.deepEqual(filterFlowRows([{date:'2026-12-01',actualIn:100,actualOut:0,expectedIn:0,expectedOut:0}],'pending'),[]);
const payload=(status,rows)=>buildChartPayload(db,{route:'flow',granularity:'month',flowStatus:status},rows,{includeEarnings:false,mobile:true});
assert.equal(payload('all',all).bar.data[0].income,100);
assert.equal(payload('all',all).bar.data[0].expense,50);
assert.equal(payload('paid',settled).bar.data[0].income,25);
assert.equal(payload('paid',settled).bar.data[0].expense,10);
assert.equal(payload('pending',pending).bar.data[0].income,75);
assert.equal(payload('pending',pending).bar.data[0].expense,40);
assert.equal(payload('all',all).earnings.hasRecords,false);
const future=Array.from({length:30},(_,index)=>({date:String(2026+Math.floor(index/12))+'-'+String(index%12+1).padStart(2,'0')+'-01',expectedIn:100,expectedOut:0,actualIn:0,actualOut:0}));
const near=selectCashflowWindow(future,'month',true,'2026-11-06');
assert.equal(near.length,6);
assert.equal(near.some(row=>row.date.startsWith('2026-11')),true);
assert.equal(near.some(row=>row.date.startsWith('2028')),false,'Do not jump to distant installments');
assert.equal(future.length,30,'Chart window must not truncate the complete table dataset');
assert.equal(selectCashflowWindow(future,'month',false,'2026-11-06').length,12);
assert.equal(selectCashflowWindow([], 'month', true).length,0);
console.log('GB+ build 68: testes de filtro, baixa parcial e janela do gráfico passaram.');
