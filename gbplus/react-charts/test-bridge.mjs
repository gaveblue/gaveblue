import assert from "node:assert/strict";
import { buildChartPayload } from "../js/gb-charts-data.js";

const now = new Date();
const date = [now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
const db = {
  titles:[
    {id:"received",type:"income",categoryId:"sales",cancelled:false},
    {id:"spent",type:"expense",categoryId:"expense",cancelled:false},
    {id:"cancelled-and-paid",type:"income",categoryId:"sales",cancelled:true}
  ],
  categories:[{id:"sales",name:"Vendas",type:"income"}],
  payments:[
    {titleId:"received",date,amount:10250},
    {titleId:"spent",date,amount:5500},
    {titleId:"cancelled-and-paid",date,amount:100},
    {titleId:"orphan",date,amount:90000}
  ]
};
const payload=buildChartPayload(db,{granularity:"month"},[
  {date:date.slice(0,7)+"-01",actualIn:10350,actualOut:5500}
]);
assert.equal(payload.earnings.hasRecords,true);
assert.equal(payload.earnings.periods.length,3);
assert.equal(payload.earnings.periods.find(p=>p.id==="7d").total,103.50);
assert.deepEqual(payload.earnings.periods.map(p=>p.label),["7D","30D","12M"]);
assert.equal(payload.earnings.periods[0].sources[0].label,"Vendas");
assert.equal(payload.bar.data[0].income,103.5);
assert.equal(payload.bar.data[0].expense,55);
assert.ok(!JSON.stringify(payload).includes("900"));
const empty=buildChartPayload({titles:[],payments:[],categories:[]},{granularity:"day"},[]);
assert.equal(empty.earnings.hasRecords,false);
assert.equal(empty.bar.data.length,0);
console.log("GB+ EasyUI: adapter tests passed.");
