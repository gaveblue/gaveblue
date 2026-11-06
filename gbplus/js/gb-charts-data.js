import {selectCashflowWindow} from './gb-flow-filters.js?v=20261106-68';
// Read-only adapter: money is stored as integer centavos in GB+.
// Chart input is expressed in BRL (number) without changing financial records.
const iso = date => {
  const d = new Date(date);
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
};
const addDays = (date,days) => {
  const [y,m,d] = date.split('-').map(Number);
  const utc = new Date(Date.UTC(y,m-1,d+days,12));
  return utc.toISOString().slice(0,10);
};
const addMonths = (date,months) => {
  const [y,m] = date.split('-').map(Number);
  const utc = new Date(Date.UTC(y,m-1+months,1,12));
  return utc.toISOString().slice(0,10);
};
const MONTHS=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const fmtDay = date => date.slice(8,10)+' '+MONTHS[Number(date.slice(5,7))-1];
const fmtMonth = date => MONTHS[Number(date.slice(5,7))-1]+'/'+date.slice(2,4);
const validAmount = cents => Number.isSafeInteger(cents) && cents > 0;
const moneyNumber = cents => Math.round(cents)/100;
const COLORS = ['#16a34a','#10b981','#047857','#84cc16','#059669'];
const cleanRows = db => {
  const titles = new Map((db?.titles||[]).map(title=>[title.id,title]));
  return (db?.payments||[]).flatMap(payment=>{
    const title=titles.get(payment.titleId);
    if(!title||!validAmount(payment.amount)||!(/^\d{4}-\d{2}-\d{2}$/.test(payment.date)))return [];
    return [{date:payment.date,amount:payment.amount,type:title.type,categoryId:title.categoryId||''}];
  });
};
function buildPeriods(db,allRecords){
  const now=iso(new Date()),firstOfMonth=now.slice(0,7)+'-01';
  const records=allRecords.filter(row=>row.type==='income');
  const categories=new Map((db?.categories||[]).map(category=>[category.id,String(category.name||'Sem categoria')]));
  const definitions=[
    {id:'7d',label:'7D',start:addDays(now,-6),end:now,previousStart:addDays(now,-13),previousEnd:addDays(now,-7),comparison:'em relação aos 7 dias anteriores',key:date=>date,buckets:Array.from({length:7},(_,i)=>addDays(now,i-6))},
    {id:'30d',label:'30D',start:addDays(now,-29),end:now,previousStart:addDays(now,-59),previousEnd:addDays(now,-30),comparison:'em relação aos 30 dias anteriores',key:date=>date,buckets:Array.from({length:30},(_,i)=>addDays(now,i-29))},
    {id:'12m',label:'12M',start:addMonths(firstOfMonth,-11),end:now,previousStart:addMonths(firstOfMonth,-23),previousEnd:addDays(addMonths(firstOfMonth,-11),-1),comparison:'em relação aos 12 meses anteriores',key:date=>date.slice(0,7)+'-01',buckets:Array.from({length:12},(_,i)=>addMonths(firstOfMonth,i-11))}
  ];
  return definitions.map(def=>{
    const current=records.filter(row=>row.date>=def.start&&row.date<=def.end);
    const previous=records.filter(row=>row.date>=def.previousStart&&row.date<=def.previousEnd);
    const bucketAmounts=new Map(def.buckets.map(key=>[key,0]));
    const sourceAmounts=new Map();
    for(const record of current){
      const key=def.key(record.date);
      if(bucketAmounts.has(key))bucketAmounts.set(key,bucketAmounts.get(key)+record.amount);
      const category=categories.get(record.categoryId)||'Outras receitas';
      sourceAmounts.set(category,(sourceAmounts.get(category)||0)+record.amount);
    }
    const sorted=[...sourceAmounts.entries()].sort((a,b)=>b[1]-a[1]);
    const sources=sorted.slice(0,4).map(([label,amount],i)=>({id:'source-'+i,label,amount:moneyNumber(amount),color:COLORS[i]}));
    if(sorted.length>4)sources.push({id:'other',label:'Demais categorias',amount:moneyNumber(sorted.slice(4).reduce((s,[,n])=>s+n,0)),color:COLORS[4]});
    if(!sources.length)sources.push({id:'empty',label:'Sem recebimentos',amount:0,color:COLORS[0]});
    return {id:def.id,label:def.label,comparison:def.comparison,total:moneyNumber(current.reduce((s,row)=>s+row.amount,0)),previous:moneyNumber(previous.reduce((s,row)=>s+row.amount,0)),trend:def.buckets.map(key=>moneyNumber(bucketAmounts.get(key)||0)),trendLabels:def.buckets.map(key=>def.id==='12m'?fmtMonth(key):fmtDay(key)),sources};
  });
}
export function buildChartPayload(db, state, flowRows, options={}){
  // Avoid rescanning payment history on the bar-chart-only screens.
  const records=options.includeEarnings===false?[]:cleanRows(db);
  const all=Array.isArray(flowRows)?flowRows:[];
  const status=['all','paid','pending'].includes(state?.flowStatus)?state.flowStatus:'all';
  const mode=(state?.route==='flow'||state?.route==='provisions')?status:'paid';
  const visible=selectCashflowWindow(all,state?.granularity,Boolean(options.mobile));
  const barData=visible.map(r=>({
    label:state?.granularity==='month'?fmtMonth(r.date):fmtDay(r.date),
    income:moneyNumber((mode==='paid'?0:r.expectedIn)+ (mode==='pending'?0:r.actualIn)),
    expense:moneyNumber((mode==='paid'?0:r.expectedOut)+(mode==='pending'?0:r.actualOut))
  }));
  return {
    earnings: { periods:options.includeEarnings===false?[]:buildPeriods(db,records), hasRecords:records.some(row=>row.type==='income') },
    bar: { data:barData, count:all.length, shown:barData.length, status:mode, periodLabel:state?.granularity==='day'?'diários':state?.granularity==='week'?'semanais':'mensais' }
  };
}
