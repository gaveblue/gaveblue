import {today,balance,pending,accountBalance,validDate} from './domain.js?v=20261105-47';

export function addForecastDays(date,days){
 if(!validDate(date)||!Number.isInteger(days)||Math.abs(days)>365)throw Error('Período de previsão inválido.');
 const dt=new Date(date+'T12:00:00Z');
 dt.setUTCDate(dt.getUTCDate()+days);
 return dt.toISOString().slice(0,10);
}
/** Read-only forecast: settled payments are already reflected in accountBalance.
 * Overdue titles are projected as an immediate obligation, not re-dated in storage. */
export function cashForecast(db,days=30,asOf=today(),overrides={}){
 if(![7,15,30,60,90].includes(days)||!validDate(asOf))throw Error('Selecione um prazo de previsão válido.');
 const until=addForecastDays(asOf,days);
 const changes=new Map();
 let overdue=0;
 const allocated=new Map();
 for(const t of db.titles||[]){
  const amount=pending(db,t);if(amount<=0)continue;
  const due=overrides[t.id]||t.due;
  if(!validDate(due))throw Error('Data de simulação inválida.');
  if(due<asOf)overdue+=amount;
  const date=due<asOf?asOf:due;
  if(date>until)continue;
  const entry=changes.get(date)||{in:0,out:0};
  if(t.type==='income')entry.in+=amount;else entry.out+=amount;
  changes.set(date,entry);
  if(t.accountId){
   const perAccount=allocated.get(t.accountId)||0;
   allocated.set(t.accountId,perAccount+(t.type==='income'?amount:-amount));
  }
 }
 const current=balance(db);let projected=current,lowest=current,lowestDate=asOf,totalIn=0,totalOut=0;
 const points=[];
 for(let day=0;day<=days;day++){
  const date=addForecastDays(asOf,day),change=changes.get(date)||{in:0,out:0};
  projected+=change.in-change.out;totalIn+=change.in;totalOut+=change.out;
  if(projected<lowest){lowest=projected;lowestDate=date;}
  points.push({date,in:change.in,out:change.out,balance:projected});
 }
 const byAccount=(db.accounts||[]).map(a=>{
  const actual=accountBalance(db,a.id,asOf);
  return {id:a.id,name:a.name,current:actual,expected:actual+(allocated.get(a.id)||0)};
 });
 const assignedChange=[...allocated.values()].reduce((a,b)=>a+b,0);
 return {days,asOf,until,current,expected:projected,totalIn,totalOut,lowest,lowestDate,overdue,
  unassignedDelta:totalIn-totalOut-assignedChange,points,byAccount};
}
