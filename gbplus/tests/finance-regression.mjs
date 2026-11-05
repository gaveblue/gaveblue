// Regression suite for GB+ 2.2.8. No npm and no financial account required.
// Run: node gbplus/tests/finance-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const here=dirname(fileURLToPath(import.meta.url));
const source=name=>readFileSync(resolve(here,'../js/'+name+'.js'),'utf8');
function evaluate(name,deps,returnNames){
 const code=source(name).replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
 const keys=Object.keys(deps);
 return Function(...keys,code+';return {'+returnNames.join(',')+'}')( ...Object.values(deps) );
}
const {expectedDates,recurrenceAnchor,nextBusinessDay,isBusinessDay}=evaluate('gb-calendar-rules',{},['expectedDates','recurrenceAnchor','nextBusinessDay','isBusinessDay']);
const domain=evaluate('domain',{parseMoneyCentavos:()=>0,expectedDates,nextBusinessDay,recurrenceAnchor},['addMonths','updateTitle','generateTitles','flow']);
const ai=evaluate('ai-scenarios',{},['readScenarioMonth','readScenarioAmount','answerScenario']);
const {buildChartPayload}=evaluate('gb-charts-data',{},['buildChartPayload']);

assert.equal(nextBusinessDay('2026-11-02'),'2026-11-03','Finados must be skipped');
assert.equal(isBusinessDay('2026-11-15'),false);
assert.equal(isBusinessDay('2026-11-03'),true);
const original={id:'a',mode:'recurring',groupId:'g',sequence:1,count:3,due:'2026-11-03',originalDue:'2026-10-31',amount:10000,businessDays:true,type:'expense'};
const db={titles:[original,{...original,id:'b',sequence:2,due:'2026-11-30',originalDue:'2026-11-30'},{...original,id:'c',sequence:3,due:'2026-12-31',originalDue:'2026-12-31'}],payments:[]};
const dates=expectedDates(recurrenceAnchor(original.due,original),'recurring',3,true,domain.addMonths).map(d=>d.date);
domain.updateTitle(db,'a',{due:original.due,amount:10000,type:'expense',businessDays:true},true);
assert.deepEqual(db.titles.map(t=>t.due),dates,'Recurring preview must match dates persisted after saving');
assert.deepEqual(dates,['2026-11-03','2026-11-30','2026-12-31']);
assert.equal(recurrenceAnchor('2026-11-10',original),'2026-11-10');
const generated=domain.generateTitles({amount:10000,due:'2026-11-30',type:'expense'},'installment',3,{businessDays:true});
assert.equal(generated.reduce((sum,t)=>sum+t.amount,0),10000,'Installments must preserve total in cents');
assert.equal(generated.length,3);

const asOf='2026-11-05';
for(const [sentence,expected] of Object.entries({
 'daqui três meses':'2027-02',
 'daqui 3 meses':'2027-02',
 'daqui a três meses':'2027-02',
 'mês que vem':'2026-12',
 'em 2 meses':'2027-01'
})) assert.equal(ai.readScenarioMonth(sentence,asOf),expected,sentence);
const noTitles={titles:[],payments:[]};
const start=ai.answerScenario(noTitles,'Quero comprar uma calça daqui três meses',{asOf,bankCents:100000});
assert.equal(start.context.month,'2027-02');
const priced=ai.answerScenario(noTitles,'R$ 250',{asOf,bankCents:100000,context:start.context});
assert.equal(priced.context.amount,25000);
const newPurchase=ai.answerScenario(noTitles,'Quero comprar um iPhone de R$ 18.000 mês que vem',{asOf,bankCents:100000,context:priced.context});
assert.equal(newPurchase.context.amount,1800000,'New item must not reuse the previous price');

const cash=domain.flow({
 titles:[{id:'income',due:'2026-11-15',amount:15000,type:'income'},{id:'expense',due:'2026-11-15',amount:20000,type:'expense'}],
 payments:[{titleId:'income',date:'2026-11-05',amount:5000},{titleId:'expense',date:'2026-11-05',amount:2000},{titleId:'missing',date:'2026-11-05',amount:9999}]
},{from:'2026-11-01',to:'2026-11-30'},'month');
assert.equal(cash.length,1);
assert.deepEqual([cash[0].actualIn,cash[0].actualOut,cash[0].expectedIn,cash[0].expectedOut],[5000,2000,10000,18000]);
const today=new Date();
const now=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
const chartDb={titles:[{id:'paid',type:'income',categoryId:'s'}],categories:[{id:'s',name:'Vendas'}],payments:[{titleId:'paid',date:now,amount:12345}]};
const output=buildChartPayload(chartDb,{granularity:'month'},[{date:now.slice(0,7)+'-01',actualIn:12345,actualOut:5500}]);
assert.equal(output.earnings.periods.find(p=>p.id==='7d').total,123.45);
assert.equal(output.bar.data[0].expense,55);
const barsOnly=buildChartPayload(chartDb,{granularity:'month'},[],{includeEarnings:false});
assert.equal(barsOnly.earnings.periods.length,0);
assert.equal(barsOnly.earnings.hasRecords,false);
console.log('GB+ 2.2.8: regressions passed (calendar, recurrence, AI, cashflow, chart).');
